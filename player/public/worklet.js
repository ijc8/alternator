console.log("AudioWorklet: start")

class DoubleBufferProcessor extends AudioWorkletProcessor {
    constructor(options) {
        console.log("AudioWorklet: constructor")
        super()
        this.numFrames = options.processorOptions.numFrames
        this.currentBuffer = new Float32Array(this.numFrames * options.outputChannelCount[0])
        this.nextBuffer = new Float32Array(this.numFrames * options.outputChannelCount[0])
        this.frameIndex = 0
        this.underrun = false

        this.port.onmessage = (e) => {
            this.statusPort = e.ports[0]
            this.port.onmessage = (e) => {
                this.nextBuffer = e.data
                this.nextBufferReady = true
            }
        }

        this.swapBuffers()
    }

    swapBuffers() {
        [this.currentBuffer, this.nextBuffer] = [this.nextBuffer, this.currentBuffer]
        this.frameIndex = 0
        this.nextBufferReady = false
        // Send next buffer for the Web Worker to fill.
        this.port.postMessage(this.nextBuffer, [this.nextBuffer.buffer])
    }

    process(inputs, outputs, parameters) {
        const channels = outputs[0]
        if (this.frameIndex >= this.numFrames) {
            // Currently in underrun.
            if (!this.underrun) {
                // Signal the start of an underrun.
                this.statusPort.postMessage(true)
                this.underrun = true
            }
            for (const channel of channels) {
                channel.fill(0)
            }
        } else {
            if (this.underrun) {
                // Signal the end of an underrun.
                this.statusPort.postMessage(false)
                this.underrun = false
            }
            // TODO: Maybe deinterleave in WebAssembly?
            const numChannels = channels.length
            const numFrames = channels[0].length
            for (let f = 0; f < numFrames; f++) {
                const start = (this.frameIndex + f) * numChannels
                for (let c = 0; c < numChannels; c++) {
                    channels[c][f] = this.currentBuffer[start + c]
                }
            }
        }
        // NOTE: This assumes this.frameSize is a multiple of the channels[i].length (128).
        this.frameIndex += channels[0].length
        if (this.frameIndex >= this.numFrames && this.nextBufferReady) {
            this.swapBuffers()
        }
        return true
    }
}

registerProcessor("doublebuffer", DoubleBufferProcessor)
