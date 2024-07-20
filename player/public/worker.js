console.log("Web Worker: start")
let port
// Playback position, in samples.
let pos = 0
// Target position for seeking.
let nextPos = null
// Number of samples generated so far (does not include replayed samples).
let currentLength = 0
// Total length of the composition: number of samples generated between start and end.
let fullLength = Infinity

const HISTORY_SECONDS = 10 * 60
// TODO: Investigate conflict with Emscripten-generated `buffer` (c-stereo-test).
let _buffer = null

function playSilence() {
    port.onmessage = (e) => {
        e.data.fill(0)
        port.postMessage(e.data, [e.data.buffer])
    }
}

const STARTING = 0
const PLAYING = 1
const STOPPING = 2
let state = STARTING

function playAudio() {
    port.onmessage = (e) => {
        // Received empty buffer from Audio Worklet. Fill with generated samples and send it back.
        // Uncomment to force occasional underruns:
        // for (let j = 0; j < (1 << 25); j++) {}

        const blockLength = e.data.length
        while (pos + blockLength > currentLength) {
            if (currentLength + blockLength > _buffer.length) {
                // Double history buffer length.
                // TODO: We should cap this at some point, and then use `_buffer` as a circular buffer.
                // (Will require UI to support to indicate that old samples are no longer accessible.)
                const newBuffer = new Float32Array(_buffer.length * 2)
                newBuffer.set(_buffer)
                _buffer = newBuffer
            }
            const length = process(_buffer.subarray(currentLength, currentLength + blockLength))
            currentLength += length
            if (length < blockLength) {
                fullLength = currentLength
                break
            } else {
                self.postMessage({ pos, length: currentLength, end: false })
            }
        }

        if (pos + blockLength > fullLength) {
            e.data.set(_buffer.subarray(pos, fullLength))
            e.data.fill(0, fullLength - pos)
            pos = fullLength
            playSilence()
        } else {
            e.data.set(_buffer.subarray(pos, pos + blockLength))
            pos += blockLength
        }

        // Apply envelopes to avoid clicks during state transitions (play, pause, unpause).
        if (state === STARTING) {
            for (let i = 0; i < e.data.length; i++) {
                e.data[i] *= i/e.data.length
            }
            state = PLAYING
        } else if (state === STOPPING) {
            for (let i = 0; i < e.data.length; i++) {
                e.data[i] *= 1 - i/e.data.length
            }
            state = STARTING
            if (nextPos !== null) {
                // Seeking.
                pos = nextPos
                nextPos = null
            } else {
                // Pausing.
                playSilence()
            }
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
    self.onmessage = (event) => {
        if (event.data === true) {
            // Play.
            playAudio()
        } else if (event.data === false) {
            // Pause.
            state = STOPPING
        } else if (event.data.sampleRate) {
            // Reset.
            // TODO: This is a bit of a hack; may prefer to reset by just creating a new worker.
            // (Current obstacle to that is Pyodide load time.)
            playSilence()
            setup(event.data.sampleRate).then(() => {
                _buffer = new Float32Array(HISTORY_SECONDS * event.data.sampleRate)
                pos = 0
                currentLength = 0
                fullLength = Infinity
                self.postMessage("setup")
                playAudio()
            })
        } else {
            // Seek to given position.
            if (state === STARTING) {
                // Already paused, don't need to ramp down first.
                pos = event.data
                self.postMessage({ pos, length: currentLength, end: pos === fullLength })
            } else {
                nextPos = event.data
                state = STOPPING
            }
        }
    }
    self.path = event.data.path + "/"
    // Load from blob to avoid MIME type complaints.
    const code = await (await fetch(`${self.path}main.js`)).text()
    const url = URL.createObjectURL(new Blob([code], { type: "application/javascript" }))
    importScripts(url)
    await setup(event.data.sampleRate)
    _buffer = new Float32Array(HISTORY_SECONDS * event.data.sampleRate)
    self.postMessage("setup")
    playAudio()
}
