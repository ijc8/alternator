use anyhow::{anyhow, Result};
use cpal::{traits::{DeviceTrait, HostTrait}, Sample};
use wasmtime::*;

fn get_audio_setup() -> Result<(cpal::Device, cpal::SupportedStreamConfig)> {
    let host = cpal::default_host();
    let device = host
        .default_output_device()
        .expect("no output device available");
    if let Ok(config) = device.default_output_config() {
        return Ok((device, config));
    }
    for device in host.output_devices().unwrap() {
        if let Ok(config) = device.default_output_config() {
            return Ok((device, config));
        }
    }
    Err(anyhow!("No output devices have valid configurations"))
}

const N : usize = 1024;
static mut buf: [f32; N] = [0.0; N];

pub fn main() -> Result<()> {
    let (device, config) = get_audio_setup()?;
    println!(
        "device: {:?}, config: {:?}",
        device.name(),
        config
    );

    match config.sample_format() {
        cpal::SampleFormat::F32 => run::<f32>(&device, &config.into()),
        cpal::SampleFormat::I16 => run::<i16>(&device, &config.into()),
        cpal::SampleFormat::U16 => run::<u16>(&device, &config.into()),
    }
}

fn run<T: cpal::Sample>(device: &cpal::Device, config: &cpal::StreamConfig) -> Result<(), anyhow::Error> {
    // Load Wasm.
    let mut store = Store::<()>::default();
    let module = Module::from_file(store.engine(), "rust-wasm-export/target/wasm32-unknown-unknown/release/rust_wasm_export.wasm")?;
    let instance = Instance::new(&mut store, &module, &[])?;
    // let setup = instance.get_typed_func::<_, i32, _>(&mut store, "setup")?;
    // println!("setup: {}", setup.call(&mut store, ()).unwrap());
    let process = instance.get_typed_func::<_, (), _>(&mut store, "process")?;
    let memory = instance.get_memory(&mut store, "memory").unwrap();

    let internal_buf = instance.get_global(&mut store, "buf").unwrap();
    let buf_address = internal_buf.get(&mut store).unwrap_i32() as usize;

    let byte_view = unsafe { std::slice::from_raw_parts_mut(buf.as_mut_ptr() as *mut u8, N*4) };
    let u32_view = unsafe { std::slice::from_raw_parts(buf.as_ptr() as *const u32, N) };

    // Start playing audio.
    let sample_rate = config.sample_rate.0 as f64;
    let channels = config.channels as usize;
    let mut i = N;
    let err_fn = |err| eprintln!("an error occurred on the output audio stream: {}", err);
    let stream = device.build_output_stream(config, move |output: &mut [T], _: &cpal::OutputCallbackInfo| {
        for frame in output.chunks_mut(channels) {
            if i == N {
                // Generate more samples.
                process.call(&mut store, ()).unwrap();
                memory.read(&store, buf_address, byte_view).unwrap();
                i = 0;
            }
            let sample = Sample::from(&f32::from_bits(u32::from_le(u32_view[i])));
            i += 1;
            for out in frame.iter_mut() {
                *out = sample;
            }
        }
    }, err_fn)?;

    std::thread::sleep(std::time::Duration::from_secs(4));

    Ok(())
}
