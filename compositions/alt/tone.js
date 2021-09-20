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
}

const setupPyodidePromise = setupPyodide()

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

function process(output) {
    return audioCallback(output, output.length)
}
