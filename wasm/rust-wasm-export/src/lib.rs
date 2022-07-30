static mut phase: f64 = 0.0;
static sample_rate: f64 = 44100.0;

#[no_mangle]
pub unsafe fn process() -> f32 {
    let out = phase.sin();
    phase += std::f64::consts::TAU * 200.0 / sample_rate;
    out as f32
}
