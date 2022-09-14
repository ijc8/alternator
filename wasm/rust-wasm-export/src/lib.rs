const N: usize = 1024;

static mut phase: f64 = 0.0;
static mut sample_rate: f64 = 44100.0;
#[no_mangle]
static mut buf: [f32; N] = [0.0; N];

#[no_mangle]
pub unsafe fn setup(_sample_rate: f32) -> *const f32 {
    sample_rate = _sample_rate as f64;
    buf.as_ptr()
}

#[no_mangle]
pub unsafe fn process() {
    for x in buf.iter_mut() {
        *x = phase.sin() as f32;
        phase += std::f64::consts::TAU * 200.0 / sample_rate;
    }
}
