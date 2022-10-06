use std::{fs::read_to_string, sync::{atomic::{AtomicBool, Ordering}, Arc}};

use anyhow::{anyhow, Result};
use cpal::{traits::{DeviceTrait, HostTrait}, Sample};
use wasmtime::*;
use wasmtime_wasi::{WasiCtx, sync::WasiCtxBuilder};

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
        .build();
    let mut store = Store::new(&engine, wasi);

    // Load Wasm.
    let module = Module::from_file(store.engine(), "csound.static.mod.wasm")?;

    println!("B");

    linker.func_wrap("env", "csoundLoadModules", |_: i32| { 0 })?;
    linker.func_wrap("env", "csoundWasiJsMessageCallback", |_: i32, _: i32, _: i32, _: i32| {})?;

    let instance = linker.instantiate(&mut store, &module)?;

    let memory = instance.get_memory(&mut store, "memory").unwrap();

    let alloc_string_mem = instance.get_typed_func::<i32, i32, _>(&mut store, "allocStringMem")?;
    let free_string_mem = instance.get_typed_func::<i32, (), _>(&mut store, "freeStringMem")?;

    let csound_initialize = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundInitialize")?;
    println!("initialize: {}", csound_initialize.call(&mut store, 0).unwrap());
    let csound_create = instance.get_typed_func::<(), i32, _>(&mut store, "csoundCreateWasi")?;
    let cs = csound_create.call(&mut store, ()).unwrap();
    dbg!(cs);
    let csound_set_option = instance.get_typed_func::<(i32, i32), i32, _>(&mut store, "csoundSetOption")?;
    let csound_compile_csd_text = instance.get_typed_func::<(i32, i32), i32, _>(&mut store, "csoundCompileCsdText")?;
    let csound_get_0dbfs = instance.get_typed_func::<i32, f64, _>(&mut store, "csoundGet0dBFS")?;
    let csound_get_ksmps = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundGetKsmps")?;
    let csound_get_spout = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundGetSpout")?;
    let csound_get_nchnls = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundGetNchnls")?;
    // let csound_get_output_buffer_size = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundGetOutputBufferSize")?;
    let csound_start = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundStart")?;
    let csound_perform_ksmps = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundPerformKsmpsWasi")?;

    let thing = instance.get_typed_func::<_, i32, _>(&mut store, "csoundGetAPIVersion")?;
    let version = thing.call(&mut store, ()).unwrap();
    println!("{}", version);

    let mut with_wasm_str = |s: &str, f: Box<dyn FnOnce(&mut Store<WasiCtx>, i32)>| {
        let buffer = s.as_bytes();
        let addr = alloc_string_mem.call(&mut store, buffer.len() as i32).unwrap();
        memory.write(&mut store, addr as usize, buffer).unwrap();
        f(&mut store, addr);
        free_string_mem.call(&mut store, addr).unwrap();
    };

    for s in ["-odac", "-iadc", "-M0", "-+rtaudio=null", "--sample-rate=44100", "--nchnls_i=0", "-b 1024"] {
        println!("{}", s);
        with_wasm_str(s, Box::new(|store, addr| {
            println!("{}", addr);
            csound_set_option.call(store, (cs, addr)).unwrap();
        }))
    }

    let csd = read_to_string("example.csd")?;

    with_wasm_str(csd.as_str(), Box::new(|store, addr| {
        csound_compile_csd_text.call(store, (cs, addr)).unwrap();
    }));

    println!("start: {}", csound_start.call(&mut store, cs)?);

    let spout = csound_get_spout.call(&mut store, cs)? as usize;
    let nchan = csound_get_nchnls.call(&mut store, cs)?;
    let ksmps = csound_get_ksmps.call(&mut store, cs)?;
    let spout_len = nchan * ksmps;
    let scale = 1.0 / csound_get_0dbfs.call(&mut store, cs)?;

    // let setup = instance.get_typed_func::<f32, i32, _>(&mut store, "setup")?;
    // let process = instance.get_typed_func::<_, (), _>(&mut store, "process")?;
    // let memory = instance.get_memory(&mut store, "memory").unwrap();

    let sample_rate = config.sample_rate.0 as f32;
    // TODO: In the future, we might also pass in the block size and number of channels.
    // let buf_address = setup.call(&mut store, sample_rate)? as usize;

    const N: usize = 64;
    let mut buf = [0.0f64; N];

    let byte_view = unsafe { std::slice::from_raw_parts_mut(buf.as_mut_ptr() as *mut u8, N*8) };
    let u64_view = unsafe { std::slice::from_raw_parts(buf.as_ptr() as *const u64, N) };

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
                // process.call(&mut store, ()).unwrap();
                if csound_perform_ksmps.call(&mut store, cs).unwrap() != 0 {
                    finished.store(true, Ordering::Relaxed);
                    main_thread.unpark();
                    break;
                }
                // memory.read(&store, buf_address, byte_view).unwrap();
                memory.read(&store, spout, byte_view).unwrap();
                i = 0;
            }
            let sample = Sample::from(&(f64::from_bits(u64::from_le(u64_view[i])) as f32));
            i += 2;
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
