const N: usize = 1024;

static mut phase: f64 = 0.0;
static sample_rate: f64 = 44100.0;
// static buf: Vec<f32> = vec![0.0; 1024];
#[no_mangle]
static mut buf: [f32; N] = [0.0; N];

#[no_mangle]
pub unsafe fn setup() -> *const f32 {
    buf.as_ptr()
}

#[no_mangle]
pub unsafe fn process() {
    for i in 0..N {
        buf[i] = phase.sin() as f32;
        phase += std::f64::consts::TAU * 200.0 / sample_rate;
    }
}
