// Actual user (composer) code in Python:
const composition = `
from aleatora import *

main = osc(200)[:2.0] >> osc(400)[:2.0]
`

// Infrastructure:
importScripts('pyodide/pyodide.js')

async function setupPyodide() {
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
    postMessage(true)
}

const setupPyodidePromise = setupPyodide()

// NOTE: eval(compile(source, "<string>", "exec", ast.PyCF_ALLOW_TOP_LEVEL_AWAIT))
// returns a coroutine if `source` contains a top-level await, and None otherwise.

const setupCode = `
import sys

# HACK: Shim "sounddevice" for aleatora.
import sys
import types
sounddevice = types.ModuleType("sounddevice")
sounddevice.query_devices = lambda: print("* 0 Audio Worklet Output Buffer")
sys.modules["sounddevice"] = sounddevice
`

let playing = true
let audioCallback

async function setup(sampleRate) {
    await setupPyodidePromise
    // TODO: Cleaner way to do this?
    self.pyodide.runPython(`import aleatora.streams.audio; aleatora.streams.audio.SAMPLE_RATE = ${sampleRate}`)
    self.pyodide.runPython(composition)
    audioCallback = self.pyodide.runPython(`
print("Playing:", main)
samples = iter(main)
def callback(outdata, frames):
    i = -1
    for i, sample in zip(range(frames), samples):
        outdata[i] = sample
    return i + 1
callback
`)
    console.log("Setup done")
}

// Temporary name change due to pyodide bug: https://github.com/pyodide/pyodide/issues/1846
function _process(output) {
    return audioCallback(output, output.length)
}


// Even more basic infrastructure:
console.log("Web Worker: start")
let port

function playSilence() {
    port.onmessage = (e) => {
        e.data.fill(0)
        port.postMessage(e.data, [e.data.buffer])
    }
}

self.onmessage = async (event) => {
    // Receive sample rate and Audio Worklet's port from main thread.
    console.log("Web Worker: setup")
    port = event.data.port
    playSilence()
    setup(event.data.sampleRate).then(() => {
        port.onmessage = (e) => {
            // Received empty buffer from Audio Worklet. Fill with generated samples and send it back.
            // Uncomment to force occasional underruns:
            // for (let j = 0; j < (1 << 25); j++) {}
            const length = _process(e.data)
            if (length < e.data.length) {
                // `process` did not fill the buffer, indicating the end of the piece.
                e.data.fill(0, length)
                playSilence()
            }
            port.postMessage(e.data, [e.data.buffer])
        }
    })
}
