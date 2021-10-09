importScripts('pyodide/pyodide.js')

async function setupPyodide() {
    self.pyodide = await loadPyodide({ indexURL: 'pyodide/' })
    const metadata = await (await fetch(self.path + "bundle.metadata")).json()
    const blob = await (await fetch(self.path + "bundle.data")).blob()
    self.pyodide.FS.mkdir("alternator")
    self.pyodide.FS.mount(self.pyodide.FS.filesystems.WORKERFS, {
        packages: [{ metadata, blob }]
    }, "/alternator")
    // Aleatora setup
    self.pyodide.runPython(setupCode)
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

let audioCallback

async function setup(sampleRate) {
    await setupPyodidePromise
    self.pyodide.runPython(`
import os
os.chdir("/alternator")
import sys
sys.path.append(".")
import aleatora.streams.audio
aleatora.streams.audio.SAMPLE_RATE = ${sampleRate}
from main import main`)
    audioCallback = self.pyodide.runPython(`
print("Playing:", main)
frames = iter(main)
def callback(outdata, num_frames):
    i = -1
    for i, frame in zip(range(num_frames), frames):
        outdata[i] = frame[0]
        outdata[num_frames+i] = frame[1]
    return (i + 1) * 2
callback
`)
    console.log("Setup done")
}

function process(output) {
    return audioCallback(output, output.length / 2)
}
