console.log("Web Worker: start")
let port
let pos = 0

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
        const length = process(e.data)
        if (length < e.data.length) {
            // `process` did not fill the buffer, indicating the end of the piece.
            e.data.fill(0, length)
            playSilence()
            self.postMessage("end")
        } else {
            pos += length
            self.postMessage(pos)
        }
        port.postMessage(e.data, [e.data.buffer])
    }
}

self.onmessage = async (event) => {
    // Receive composition name, sample rate, and Audio Worklet's port from main thread.
    console.log("Web Worker: setup")
    port = event.data.port
    playSilence()
    // All futures messages will change the play state (pause/unpause).
    self.onmessage = (event) => {
        if (event.data) {
            playAudio()
        } else {
            playSilence()
        }
    }
    self.path = `bundles/${event.data.name}/`
    importScripts(`${self.path}/main.js`)
    setup(event.data.sampleRate).then(() => {
        self.postMessage("setup")
        playAudio()
    })
}
