console.log("Web Worker: start")
let port
// Playback position, in samples.
let pos = 0
// Number of samples generated so far (does not include replayed samples).
let currentLength = 0
// Total length of the composition: number of samples generated between start and end.
let fullLength = Infinity
const HISTORY_SECONDS = 5 * 60
let buffer = null

function playSilence() {
    port.onmessage = (e) => {
        e.data.fill(0)
        port.postMessage(e.data, [e.data.buffer])
    }
}

function playAudio() {
    port.onmessage = (e) => {
        // Received empty buffer from Audio Worklet. Fill with generated samples and send it back.
        // Uncomment to force occasional underruns:
        // for (let j = 0; j < (1 << 25); j++) {}

        // TODO: Use `buffer` as a circular buffer, in case we hit `HISTORY_SECONDS`.
        const blockLength = e.data.length
        if (pos + blockLength > currentLength) {
            const length = process(buffer.subarray(currentLength, currentLength + blockLength))
            currentLength += length
            if (length < blockLength) {
                fullLength = currentLength
            }
        }

        if (pos + blockLength > fullLength) {
            e.data.set(buffer.subarray(pos, fullLength))
            e.data.fill(0, fullLength - pos)
            pos = fullLength
            playSilence()
        } else {
            e.data.set(buffer.subarray(pos, pos + blockLength))
            pos += blockLength
        }
        // Send updated position/status to main thread.
        self.postMessage({ pos, length: currentLength, end: pos === fullLength })
        // Send samples to AudioWorklet.
        port.postMessage(e.data, [e.data.buffer])
    }
}

self.onmessage = async (event) => {
    // Receive composition name, sample rate, and Audio Worklet's port from main thread.
    console.log("Web Worker: setup")
    port = event.data.port
    playSilence()
    // All futures messages will change the play state (play/pause/seek).
    // TODO: Apply a brief envelope for each of these actions to prevent discontinuities.
    self.onmessage = (event) => {
        if (event.data === true) {
            playAudio()
        } else if (event.data === false) {
            playSilence()
        } else {
            pos = event.data
            self.postMessage({ pos, length: currentLength, end: pos === fullLength })
        }
    }
    self.path = `bundles/${event.data.name}/`
    importScripts(`${self.path}/main.js`)
    setup(event.data.sampleRate).then(() => {
        buffer = new Float32Array(HISTORY_SECONDS * event.data.sampleRate)
        self.postMessage("setup")
        playAudio()
    })
}
