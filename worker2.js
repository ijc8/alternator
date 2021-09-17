console.log("Web Worker: start")
let port

self.onmessage = async (event) => {
    // Receive sample rate and Audio Worklet's port from main thread.
    console.log("Web Worker: setup")
    await setup(event.data.sampleRate)
    port = event.data.port
    port.onmessage = (e) => {
        // Received empty buffer from Audio Worklet. Fill with generated samples and send it back.
        // Uncomment to force occasional underruns:
        // for (let j = 0; j < (1 << 25); j++) {}
        const length = _process(e.data)
        if (length < e.data.length) {
            // `process` did not fill the buffer, indicating the end of the piece.
            e.data.fill(0, length)
            // Generate silence from here on out.
            port.onmessage = (e) => {
                e.data.fill(0)
                port.postMessage(e.data, [e.data.buffer])
            }
        }
        port.postMessage(e.data, [e.data.buffer])
    }
}

// --- User (composer) code starts here ---
// let sampleRate
// const freq = 300  // Hz
// const dur = 2.5   // seconds
// let phase, remainingSamples

// function setup(_sampleRate) {
//     sampleRate = _sampleRate
//     phase = 0
//     remainingSamples = Math.floor(dur * sampleRate)
// }

// function _process(output) {
//     let i
//     const n = Math.min(remainingSamples, output.length)
//     for (i = 0; i < n; i++) {
//         output[i] = Math.sin(phase)
//         phase += 2*Math.PI*freq/sampleRate
//         phase %= 2*Math.PI
//     }
//     remainingSamples -= i
//     return i
// }




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
import ast
import js
import pyodide
import sys

# HACK: Shim "sounddevice" for aleatora.
import sys
import types
sounddevice = types.ModuleType("sounddevice")
sounddevice.query_devices = lambda: print("* 0 Audio Worklet Output Buffer")
sys.modules["sounddevice"] = sounddevice

async def run(source):
    await js.pyodide.loadPackagesFromImports(source)
    code = compile(source, "<string>", "exec", ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    globals = {}
    result = eval(code, globals)
    if result:
        await result
    stream = globals["main"]
    print("Playing:", stream)
    samples = iter(stream)
    def callback(outdata, frames):
        i = -1
        for i, sample in zip(range(frames), samples):
            outdata[i] = sample
        return i + 1
    return callback
`

let playing = true
let audioCallback

async function setup(sampleRate) {
    await setupPyodidePromise
    // TODO: Cleaner way to do this?
    self.pyodide.runPython(`import aleatora.streams.audio; aleatora.streams.audio.SAMPLE_RATE = ${sampleRate}`)
    // Actual user (composer) code:
    self.pyodide.globals.set("source", `
from aleatora import *

main = osc(200)[:2.0] >> osc(400)[:2.0]
`)
    audioCallback = await self.pyodide.runPython("run(source)")
}

// Temporary name change due to pyodide bug: https://github.com/pyodide/pyodide/issues/1846
function _process(output) {
    return audioCallback(output, output.length)
}
