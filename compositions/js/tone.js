let sampleRate
const freq = 300  // Hz
const dur = 2.5   // seconds
let phase, remainingSamples

async function setup(_sampleRate) {
    sampleRate = _sampleRate
    phase = 0
    remainingSamples = Math.floor(dur * sampleRate)
}

function process(output) {
    let i
    const n = Math.min(remainingSamples, output.length)
    for (i = 0; i < n; i++) {
        output[i] = Math.sin(phase)
        phase += 2*Math.PI*freq/sampleRate
        phase %= 2*Math.PI
    }
    remainingSamples -= i
    return i
}
