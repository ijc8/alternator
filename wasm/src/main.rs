use std::{sync::{atomic::{AtomicBool, Ordering}, Arc}};

use anyhow::{anyhow, Result};
use cpal::{traits::{DeviceTrait, HostTrait}, Sample};
use wasmtime::*;
use wasmtime_wasi::{WasiCtx, sync::WasiCtxBuilder, Dir};

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
    // Setup Wasmtime.
    let engine = Engine::default();
    let mut linker = Linker::<WasiCtx>::new(&engine);
    wasmtime_wasi::add_to_linker(&mut linker, |s| s)?;

    println!("A");
    let wasi = WasiCtxBuilder::new()
        .inherit_stdio()
        .inherit_args()?
        .preopened_dir(Dir::from_std_file(std::fs::File::open("assets")?), "/")?
        .build();
    let mut store = Store::new(&engine, wasi);

    // Load Wasm.
    let module = Module::from_file(store.engine(), "csound.static.mod2.wasm")?;

    println!("B");

    linker.func_wrap("env", "csoundLoadModules", |_: i32| { 0 })?;
    linker.func_wrap("env", "csoundWasiJsMessageCallback", |_: i32, _: i32, _: i32, _: i32| {})?;

    let instance = linker.instantiate(&mut store, &module)?;

    let memory = instance.get_memory(&mut store, "memory").unwrap();

    // Magic? Reading from files fails without this call.
    let start = instance.get_typed_func::<(), (), _>(&mut store, "_start")?;
    start.call(&mut store, ())?;

    let csound_initialize = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundInitialize")?;
    println!("initialize: {}", csound_initialize.call(&mut store, 0).unwrap());
    let setup = instance.get_typed_func::<(), i32, _>(&mut store, "setup")?;
    let buf_address = setup.call(&mut store, ()).unwrap() as usize;
    dbg!(buf_address);
    let csound_get_ksmps = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundGetKsmps")?;

    // let setup = instance.get_typed_func::<f32, i32, _>(&mut store, "setup")?;
    let process = instance.get_typed_func::<(), i32, _>(&mut store, "process")?;
    // let memory = instance.get_memory(&mut store, "memory").unwrap();

    let sample_rate = config.sample_rate.0 as f32;
    // TODO: In the future, we might also pass in the block size and number of channels.
    // let buf_address = setup.call(&mut store, sample_rate)? as usize;

    const N: usize = 1024;
    let mut buf = [0.0f32; N];

    let byte_view = unsafe { std::slice::from_raw_parts_mut(buf.as_mut_ptr() as *mut u8, N*4) };
    let u32_view = unsafe { std::slice::from_raw_parts(buf.as_ptr() as *const u32, N) };

    // Start playing audio.
    let channels = config.channels as usize;
    let mut i = N;
    let err_fn = |err| eprintln!("an error occurred on the output audio stream: {}", err);
    let finished = Arc::new(AtomicBool::new(false));
    let finished2 = finished.clone();
    let main_thread = std::thread::current();
    let _stream = device.build_output_stream(config, move |output: &mut [T], _: &cpal::OutputCallbackInfo| {
        for frame in output.chunks_mut(channels) {
            if i == N {
                // Generate more samples.
                if (process.call(&mut store, ()).unwrap() as usize) < N {
                    finished.store(true, Ordering::Relaxed);
                    main_thread.unpark();
                    break;
                }
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

    while !finished2.load(Ordering::Relaxed) {
        std::thread::park();
    }

    Ok(())
}
