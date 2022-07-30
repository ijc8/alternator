use std::sync::{Arc, atomic::AtomicBool};

use anyhow::Result;
use cpal::traits::{DeviceTrait, HostTrait};
use wasmtime::*;

fn get_audio_setup() -> (cpal::Device, cpal::SupportedStreamConfig) {
    let host = cpal::default_host();
    let device = host
        .default_output_device()
        .expect("no output device available");
    if let Ok(config) = device.default_output_config() {
        return (device, config);
    }
    for device in host.output_devices().unwrap() {
        if let Ok(config) = device.default_output_config() {
            return (device, config);
        }
    }
    panic!("no output devices have valid configs")
}

pub fn main() -> Result<()> {
    use cpal::{Sample, SampleFormat};

    let mut store = Store::<()>::default();
    let module = Module::from_file(store.engine(), "rust-wasm-export/target/wasm32-unknown-unknown/release/rust_wasm_export.wasm")?;
    let instance = Instance::new(&mut store, &module, &[])?;
    let process = instance.get_typed_func::<_, f32, _>(&mut store, "process")?;

    let (device, supported_config) = get_audio_setup();
    println!(
        "device: {:?}, config: {:?}",
        device.name(),
        supported_config
    );

    let err_fn = |err| eprintln!("an error occurred on the output audio stream: {}", err);
    let sample_format = supported_config.sample_format();
    let channels = supported_config.channels() as usize;
    let config: cpal::StreamConfig = supported_config.into();
    let running = Arc::new(AtomicBool::new(true));

    let sample_rate = config.sample_rate.0 as f64;

    fn make_mono_writer<S: Sample>(
        _running: Arc<AtomicBool>,
        process: TypedFunc<(), f32>,
        mut store: Store<()>,
        channels: usize,
        sample_rate: f64,
    ) -> impl FnMut(&mut [S], &cpal::OutputCallbackInfo) {
        let mut phase = 0.0f64;
        move |output: &mut [S], _: &cpal::OutputCallbackInfo| {
            for frame in output.chunks_mut(channels) {
                // let sample = Sample::from(&match stream.next() {
                //     Some(value) => value as f32,
                //     None => {
                //         running.store(false, std::sync::atomic::Ordering::Relaxed);
                //         0.0f32
                //     }
                // });
                let sample = Sample::from(&(process.call(&mut store, ()).unwrap()));
                phase += std::f64::consts::TAU * 200.0 / sample_rate;
                for out in frame.iter_mut() {
                    *out = sample;
                }
            }
        }
    }

    let stream = match sample_format {
        SampleFormat::F32 => device.build_output_stream(
            &config,
            make_mono_writer::<f32>(running.clone(), process, store, channels, sample_rate),
            err_fn,
        ),
        SampleFormat::I16 => device.build_output_stream(
            &config,
            make_mono_writer::<i16>(running.clone(), process, store, channels, sample_rate),
            err_fn,
        ),
        SampleFormat::U16 => device.build_output_stream(
            &config,
            make_mono_writer::<u16>(running.clone(), process, store, channels, sample_rate),
            err_fn,
        ),
    }
    .unwrap();
    std::thread::sleep(std::time::Duration::from_secs(4));

    Ok(())
}
