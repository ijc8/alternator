const _scriptDir = undefined
function setupModule(Module) {
    return Module.ready
}

let initChuckInstance, runChuckFile, isShredActive

const chuckID = 1
const numChannels = 2
let shredID
let Module

let buffer, bufferArray

async function setupChuck() {
    const loadMetadata = (async () => (await fetch(self.path + "track.json")).json())()
    const loadData = (async () => (await (await fetch(self.path + "bundle.data")).blob()).arrayBuffer())()
    const wasm = new Uint8Array(await (await fetch(self.path + "/main.wasm")).arrayBuffer())

    Module = await setupModule({
        wasmBinary: wasm,
        print: console.log,
        printErr: console.err,
        noAudioDecoding: true,
        noImageDecoding: true
    })

    const setDataDir = Module.cwrap('setDataDir', 'number', ['string'])
    initChuckInstance = Module.cwrap('initChuckInstance', 'number', ['number', 'number', 'number', 'number'])
    runChuckFile = Module.cwrap('runChuckFile', 'number', ['number', 'string'])
    isShredActive = Module.cwrap('isShredActive', 'number', ['number', 'number'])

    const [metadata, data] = await Promise.all([loadMetadata, loadData])
    for (const { filename, start, end } of metadata.files) {
        const slice = new Uint8Array(data, start, end - start)
        Module["FS_createPreloadedFile"]("/", filename, slice, true, true)
    }

    setDataDir("/")
}

const chuckReady = setupChuck()

async function setup(sampleRate) {
    await chuckReady

    initChuckInstance(chuckID, sampleRate, 0, numChannels)
    shredID = runChuckFile(chuckID, "main.ck")
    console.log("ChucK bundle: running.")

    const bufferSize = 1024 * numChannels
    buffer = Module._malloc(bufferSize * Float32Array.BYTES_PER_ELEMENT)
    bufferArray = new Float32Array(Module.HEAP32.buffer, buffer, bufferSize)
}

function process(output) {
    if (!isShredActive(chuckID, shredID)) {
        console.log("ChucK bundle: done!")
        return 0
    }

    const numFrames = output.length / numChannels
    Module.HEAPF32.set(output, buffer / output.BYTES_PER_ELEMENT)
    // for multichannel, WebAudio uses planar buffers.
    // this version of ChucK has been specially compiled to do the same
    Module._chuckManualAudioCallback(chuckID, 0, buffer, numFrames, 0, numChannels)
    // ...which is awkward, because Alternator already compensates for this. So we first undo it.
    // TODO: ChucK WASM build without `__CHUCK_USE_PLANAR_BUFFERS__`.
    for (let f = 0; f < numFrames; f++) {
        for (let c = 0; c < numChannels; c++) {
            output[f * numChannels + c] = bufferArray[c * numFrames + f]
        }
    }

    return output.length
}