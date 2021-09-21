let wasm
const wasmPromise = loadWasm()

async function loadWasm() {
    const { instance } = await WebAssembly.instantiateStreaming(fetch("compositions/rust/tune_bg.wasm"))
    wasm = instance.exports
}

/**
* @param {number} _sample_rate
*/
async function setup(_sample_rate) {
    await wasmPromise
    wasm.setup(_sample_rate);
}

let cachegetFloat32Memory0 = null;
function getFloat32Memory0() {
    if (cachegetFloat32Memory0 === null || cachegetFloat32Memory0.buffer !== wasm.memory.buffer) {
        cachegetFloat32Memory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachegetFloat32Memory0;
}

let WASM_VECTOR_LEN = 0;

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4);
    getFloat32Memory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
* @param {Float32Array} output
*/
function process(output) {
    try {
        var ptr0 = passArrayF32ToWasm0(output, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.process(ptr0, len0);
    } finally {
        output.set(getFloat32Memory0().subarray(ptr0 / 4, ptr0 / 4 + len0));
        wasm.__wbindgen_free(ptr0, len0 * 4);
    }
}
