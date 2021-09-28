console.log("AudioWorklet: start")

const BLOCK_SIZE = 1024

class DoubleBufferProcessor extends AudioWorkletProcessor {
    constructor(options) {
        console.log("AudioWorklet: constructor")
        super()
        this.currentBuffer = new Float32Array(BLOCK_SIZE)
        this.nextBuffer = new Float32Array(BLOCK_SIZE)
        this.index = 0

        this.port.onmessage = (e) => {
            this.nextBuffer = e.data
            this.nextBufferReady = true
        }

        this.swapBuffers()
    }

    swapBuffers() {
        [this.currentBuffer, this.nextBuffer] = [this.nextBuffer, this.currentBuffer]
        this.index = 0
        this.nextBufferReady = false
        // Send next buffer for the Web Worker to fill.
        this.port.postMessage(this.nextBuffer, [this.nextBuffer.buffer])
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0][0]
        if (this.index >= BLOCK_SIZE) {
            // Currently in underrun.
            if (this.index === BLOCK_SIZE) {
                // Only print this once per underrun-streak.
                console.log("Underrun!")
            }
            output.fill(0)
        } else {
            output.set(this.currentBuffer.subarray(this.index, this.index + output.length))
        }
        // NOTE: This assumes BLOCK_SIZE is a multiple of output.length (128).
        this.index += output.length
        if (this.index >= BLOCK_SIZE && this.nextBufferReady) {
            this.swapBuffers()
        }
        return true
    }
}

registerProcessor("doublebuffer", DoubleBufferProcessor)
