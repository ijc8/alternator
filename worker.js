importScripts('pyodide/pyodide.js');

(async () => {
    self.pyodide = await loadPyodide({ indexURL: 'pyodide/' })
    // NOTE: We intentionally avoid runPythonAsync here because we don't want this to pre-load extra modules like matplotlib.
    self.pyodide.runPython(setupCode)
    // Aleatora setup
    await self.pyodide.loadPackagesFromImports("import micropip")
    await self.pyodide.runPythonAsync(
        'import asyncio, micropip\n\
await asyncio.wait([micropip.install(f"lib/{name}.whl") for name in \
["oscpy-0.6.0-py2.py3-none-any", "mido-1.2.10-py2.py3-none-any", "sounddevice-0.4.2-py3-none-any"]])\n\
await micropip.install("lib/aleatora-0.2.0a0-py3-none-any.whl")')
    // Inform the main thread that we finished loading.
    self.postMessage(true)
})()

function write(output) {
    self.postMessage({ output })
    return output.length
}

let audioCallback = null

function setAudioCallback(callback) {
    audioCallback = callback
}

function show(type, url, attrs) {
    self.postMessage({ type, url, attrs: attrs?.toJs() })
}

// Stand-in for `time.sleep`, which does not actually sleep.
// To avoid a busy loop, instead import asyncio and await asyncio.sleep().
function spin(seconds) {
    const time = performance.now() + seconds * 1000
    while (performance.now() < time);
}

// NOTE: eval(compile(source, "<string>", "exec", ast.PyCF_ALLOW_TOP_LEVEL_AWAIT))
// returns a coroutine if `source` contains a top-level await, and None otherwise.

const setupCode = `
import array
import ast
import base64
import contextlib
import io
import js
import pyodide
import sys
import time
import traceback
import wave

time.sleep = js.spin

# For redirecting stdout and stderr later.
class JSWriter(io.TextIOBase):
    def write(self, s):
        return js.write(s)

def setup_matplotlib():
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    def show():
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        img = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('utf-8')
        js.show("img", img)
        plt.clf()

    plt.show = show

def play_stream(stream):
    samples = iter(stream)
    def callback(outdata, frames, time, status):
        i = -1
        for i, sample in zip(range(frames), samples):
            outdata[i] = sample
        return i == frames - 1
    js.setAudioCallback(callback)

def show_image(image, **attrs):
    from PIL import Image
    if not isinstance(image, Image.Image):
        image = Image.fromarray(image)
    buf = io.BytesIO()
    image.save(buf, format='png')
    data = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('utf-8')
    js.show("img", data, attrs)

def show_animation(frames, duration=100, format="apng", loop=0, **attrs):
    from PIL import Image
    buf = io.BytesIO()
    img, *imgs = [frame if isinstance(frame, Image.Image) else Image.fromarray(frame) for frame in frames]
    img.save(buf, format='png' if format == "apng" else format, save_all=True, append_images=imgs, duration=duration, loop=0)
    img = f'data:image/{format};base64,' + base64.b64encode(buf.getvalue()).decode('utf-8')
    js.show("img", img, attrs)

def convert_audio(data):
    try:
        import numpy as np
        is_numpy = isinstance(data, np.ndarray)
    except ImportError:
        is_numpy = False
    if is_numpy:
        if len(data.shape) == 1:
            channels = 1
        if len(data.shape) == 2:
            channels = data.shape[0]
            data = data.T.ravel()
        else:
            raise ValueError("Too many dimensions (expected 1 or 2).")
        return ((data * (2**15 - 1)).astype("<h").tobytes(), channels)
    else:
        data = array.array('h', (int(x * (2**15 - 1)) for x in data))
        if sys.byteorder == 'big':
            data.byteswap()
        return (data.tobytes(), 1)

def show_audio(samples, rate):
    bytes, channels = convert_audio(samples)
    buf = io.BytesIO()
    with wave.open(buf, mode='wb') as w:
        w.setnchannels(channels)
        w.setframerate(rate)
        w.setsampwidth(2)
        w.setcomptype('NONE', 'NONE')
        w.writeframes(bytes)
    audio = 'data:audio/wav;base64,' + base64.b64encode(buf.getvalue()).decode('utf-8')
    js.show("audio", audio)

# HACK: Create "embed" module for user.
import types
embed = types.ModuleType('embed')
sys.modules['embed'] = embed
embed.image = show_image
embed.animation = show_animation
embed.audio = show_audio

# HACK: Shim "sounddevice" for aleatora.
import sys
import types
sounddevice = types.ModuleType("sounddevice")
sounddevice.query_devices = lambda: print("* 0 Audio Worklet Output Buffer")
sys.modules["sounddevice"] = sounddevice

async def run(source):
    out = JSWriter()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
        try:
            imports = pyodide.find_imports(source)
            await js.pyodide.loadPackagesFromImports(source)
            if "matplotlib" in imports:
                setup_matplotlib()
            if "embed" in imports:
                await js.pyodide.loadPackagesFromImports("import numpy, PIL")
            code = compile(source, "<string>", "exec", ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
            globals = {}
            result = eval(code, globals)
            if result:
                await result
            if "main" in globals:
                print("Playing:", globals["main"])
                play_stream(globals["main"])
        except:
            traceback.print_exc()
`

self.onmessage = async (event) => {
    if (event.data instanceof Float32Array) {
        if (audioCallback === null) {
            event.data.fill(0)
        } else {
            const keepGoing = audioCallback(event.data, event.data.length, 0, 0)
            if (!keepGoing) {
                console.log("All done.")
                audioCallback = null
            }
        }
        self.postMessage(event.data, [event.data.buffer])
    } else {
        self.pyodide.globals.set("source", event.data)
        await self.pyodide.runPythonAsync("await run(source)")
        self.postMessage({ done: true })
    }
}
