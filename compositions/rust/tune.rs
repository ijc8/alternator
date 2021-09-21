mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

static freq: f32 = 200.0;
static mut sample_rate: u32 = 0;
static mut phase: f32 = 0.0;

#[wasm_bindgen]
pub fn setup(_sample_rate: u32) {
    unsafe {
        sample_rate = _sample_rate;
        phase = 0.0;
    }
}

#[wasm_bindgen]
pub fn process(output: &mut [f32]) {
    for i in 0..output.len() {
        unsafe {
            output[i] = phase.sin();
            phase += 2.0*std::f32::consts::PI*freq/sample_rate as f32;
        }
    }
}
