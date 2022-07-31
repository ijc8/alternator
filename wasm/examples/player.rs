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

const N : usize = 1024;
static mut buf: [f32; N] = [0.0; N];

fn benchmark(mut fun: impl FnMut()) -> std::time::Duration {
    let mut times = Vec::new();
    for i in 0..2048 {
        let time = std::time::Instant::now();
        fun();
        let elapsed = time.elapsed();
        times.push(elapsed);
    }
    *times.iter().min().unwrap()
}

pub fn main() -> Result<()> {
    use cpal::{Sample, SampleFormat};

    let mut store = Store::<()>::default();
    let module = Module::from_file(store.engine(), "rust-wasm-export/target/wasm32-unknown-unknown/release/rust_wasm_export.wasm")?;
    let instance = Instance::new(&mut store, &module, &[])?;
    // let setup = instance.get_typed_func::<_, i32, _>(&mut store, "setup")?;
    // println!("setup: {}", setup.call(&mut store, ()).unwrap());
    let process = instance.get_typed_func::<_, f32, _>(&mut store, "process")?;
    let process_block = instance.get_typed_func::<_, (), _>(&mut store, "process_block")?;
    let memory = instance.get_memory(&mut store, "memory").unwrap();

    let individual = benchmark(|| {
        for i in 0..N {
            unsafe {
                buf[i] = process.call(&mut store, ()).unwrap();
            }
        }
    });
    println!("individual (sec/samp): {:?}", individual.as_secs_f64() / (N as f64));

    let internal_buf = instance.get_global(&mut store, "buf").unwrap();
    let idx = internal_buf.get(&mut store).unwrap_i32() as usize;
    let block = benchmark(|| {
        process_block.call(&mut store, ()).unwrap();
        // Now, how to extract the results from Wasm linear memory to the host's float buffer?
        // Attempt 1. Definitely safe but a little slow.
        // let data = memory.data(&store);
        // for i in 0..N {
        //     let sample = f32::from_le_bytes(data[(idx + i*4)..idx + (i + 1)*4].try_into().unwrap());
        //     unsafe { buf[i] = sample }
        // }
        // More idiomatic alternative?
        // unsafe {
        //     for (chunk, out) in data[idx..idx + N*4].chunks_exact(4).zip(buf.iter_mut()) {
        //         *out = f32::from_le_bytes(chunk.try_into().unwrap());
        //     }
        // }
        // Attempt 2. Fast but doubly unsafe: ignores endianness, and also may have undefined behavior if wasmtime memory is not f32-aligned.
        // let data = &memory.data(&mut store)[idx..idx + N*4];
        // unsafe {
        //     let data = std::slice::from_raw_parts(data.as_ptr() as *const f32, N);
        //     buf = data.try_into().unwrap();
        // };
        // Attempt 3. Fast and only singly unsafe; alignment is no issue, but endianness is ignored.
        let byte_view = unsafe {
            std::slice::from_raw_parts_mut(buf.as_mut_ptr() as *mut u8, N*4)
        };
        memory.read(&store, idx, byte_view).unwrap();

        // Hypothetically, we'd need to then do this if running on a big-endian machine:
        // let u32_view = unsafe {
        //     std::slice::from_raw_parts_mut(buf.as_mut_ptr() as *mut u32, N)
        // };
        // for i in 0..N {
        //     u32_view[i] = u32_view[i].swap_bytes();
        // }

        // This method of swapping bytes is way (~5x) slower:
        // for i in 0..N {
        //     byte_view[i*4..(i+1)*4].reverse();
        // }
    });
    println!("block (sec/samp): {:?}", block.as_secs_f64() / (N as f64));
    println!("ratio: {:?}", individual.as_secs_f64() / block.as_secs_f64());
    let tp = (block.as_secs_f64() - individual.as_secs_f64() / N as f64) * 1e9 / ((N - 1) as f64);
    let tw = (individual - block).as_secs_f64() * 1e9 / ((N - 1) as f64);
    println!("estimated time per `process()` call (ns): {}", tp);
    println!("estimated overhead per wasmtime call (ns): {}", tw);
    println!("sanity check: {} == {}", individual.as_nanos(), N as f64 * (tw + tp));
    println!("sanity check: {} == {}", block.as_nanos(), tw + N as f64 * tp);

    // for i in 0..N {
    //     unsafe { println!("{}: {}", i, buf[i]) };
    // }

    Ok(())

    // let (device, supported_config) = get_audio_setup();
    // println!(
    //     "device: {:?}, config: {:?}",
    //     device.name(),
    //     supported_config
    // );

    // let err_fn = |err| eprintln!("an error occurred on the output audio stream: {}", err);
    // let sample_format = supported_config.sample_format();
    // let channels = supported_config.channels() as usize;
    // let config: cpal::StreamConfig = supported_config.into();
    // let running = Arc::new(AtomicBool::new(true));

    // let sample_rate = config.sample_rate.0 as f64;

    // fn make_mono_writer<S: Sample>(
    //     _running: Arc<AtomicBool>,
    //     process: TypedFunc<(), f32>,
    //     mut store: Store<()>,
    //     channels: usize,
    //     sample_rate: f64,
    // ) -> impl FnMut(&mut [S], &cpal::OutputCallbackInfo) {
    //     let mut phase = 0.0f64;
    //     move |output: &mut [S], _: &cpal::OutputCallbackInfo| {
    //         for frame in output.chunks_mut(channels) {
    //             // let sample = Sample::from(&match stream.next() {
    //             //     Some(value) => value as f32,
    //             //     None => {
    //             //         running.store(false, std::sync::atomic::Ordering::Relaxed);
    //             //         0.0f32
    //             //     }
    //             // });
    //             let sample = Sample::from(&(process.call(&mut store, ()).unwrap()));
    //             phase += std::f64::consts::TAU * 200.0 / sample_rate;
    //             for out in frame.iter_mut() {
    //                 *out = sample;
    //             }
    //         }
    //     }
    // }

    // let stream = match sample_format {
    //     SampleFormat::F32 => device.build_output_stream(
    //         &config,
    //         make_mono_writer::<f32>(running.clone(), process, store, channels, sample_rate),
    //         err_fn,
    //     ),
    //     SampleFormat::I16 => device.build_output_stream(
    //         &config,
    //         make_mono_writer::<i16>(running.clone(), process, store, channels, sample_rate),
    //         err_fn,
    //     ),
    //     SampleFormat::U16 => device.build_output_stream(
    //         &config,
    //         make_mono_writer::<u16>(running.clone(), process, store, channels, sample_rate),
    //         err_fn,
    //     ),
    // }
    // .unwrap();
    // std::thread::sleep(std::time::Duration::from_secs(4));

    // Ok(())
}
