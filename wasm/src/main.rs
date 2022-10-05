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

struct WasmStr<T: Fn()> {
    addr: i32,
    free: T,
}

impl<T: Fn()> Drop for WasmStr<T> {
    fn drop(&mut self) {
        (self.free)();
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
    let module = Module::from_file(store.engine(), "csound.dylib.wasm")?;

    println!("B");

    let a = 128 * 16;
    let b = (a + 128) * 65536;

    let memory = Memory::new(&mut store, MemoryType::new(16, None))?;
    let table = Table::new(&mut store, TableType::new(ValType::FuncRef, 3343, None), Val::FuncRef(None))?;
    let stack_pointer = Global::new(&mut store, GlobalType::new(ValType::I32, Mutability::Var), Val::I32(b))?;
    let memory_base = Global::new(&mut store, GlobalType::new(ValType::I32, Mutability::Const), Val::I32(a))?;
    let table_base = Global::new(&mut store, GlobalType::new(ValType::I32, Mutability::Const), Val::I32(0))?;
    let heap_base = Global::new(&mut store, GlobalType::new(ValType::I32, Mutability::Var), Val::I32(b))?;

    linker.define("env", "memory", memory)?;
    linker.define("env", "__indirect_function_table", table)?;
    linker.define("env", "__stack_pointer", stack_pointer)?;
    linker.define("env", "__memory_base", memory_base)?;
    linker.define("env", "__table_base", table_base)?;
    linker.define("GOT.mem", "__heap_base", heap_base)?;

    linker.func_wrap("env", "csoundLoadModules", |_: i32| { 0 })?;
    linker.func_wrap("env", "csoundWasiJsMessageCallback", |_: i32, _: i32, _: i32, _: i32| {})?;

    let instance = linker.instantiate(&mut store, &module)?;

    let allocStringMem = instance.get_typed_func::<i32, i32, _>(&mut store, "allocStringMem")?;
    let freeStringMem = instance.get_typed_func::<i32, (), _>(&mut store, "freeStringMem")?;

    let csoundInitialize = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundInitialize")?;
    csoundInitialize.call(&mut store, 0);

    println!("C");

    let thing = instance.get_typed_func::<_, i32, _>(&mut store, "csoundGetAPIVersion")?;
    let version = thing.call(&mut store, ()).unwrap();
    println!("{}", version);

    let mut string2ptr = |s: &str| {
        let buffer = s.as_bytes();
        let addr = allocStringMem.call(&mut store, buffer.len() as i32).unwrap();
        memory.write(&mut store, addr as usize, buffer);
        let sref = &mut store;
        WasmStr { addr, free: move || { freeStringMem.call(sref, addr).unwrap(); } }
    };
    for s in ["-odac", "-iadc", "-M0", "-+rtaudio=null", "-+rtmidi=null", "--sample-rate=44100", "--nchnls_i=0"] {
        let cstr = string2ptr(s);
        println!("{} {}", s, cstr.addr);
        // csoundSetOption(cs, cstr.addr);
    }


    // let setup = instance.get_typed_func::<f32, i32, _>(&mut store, "setup")?;
    // let process = instance.get_typed_func::<_, (), _>(&mut store, "process")?;
    // let memory = instance.get_memory(&mut store, "memory").unwrap();

    // let sample_rate = config.sample_rate.0 as f32;
    // // TODO: In the future, we might also pass in the block size and number of channels.
    // let buf_address = setup.call(&mut store, sample_rate)? as usize;

    // const N: usize = 1024;
    // let mut buf = [0.0f32; N];

    // let byte_view = unsafe { std::slice::from_raw_parts_mut(buf.as_mut_ptr() as *mut u8, N*4) };
    // let u32_view = unsafe { std::slice::from_raw_parts(buf.as_ptr() as *const u32, N) };

    // // Start playing audio.
    // let channels = config.channels as usize;
    // let mut i = N;
    // let err_fn = |err| eprintln!("an error occurred on the output audio stream: {}", err);
    // let _stream = device.build_output_stream(config, move |output: &mut [T], _: &cpal::OutputCallbackInfo| {
    //     for frame in output.chunks_mut(channels) {
    //         if i == N {
    //             // Generate more samples.
    //             process.call(&mut store, ()).unwrap();
    //             memory.read(&store, buf_address, byte_view).unwrap();
    //             i = 0;
    //         }
    //         let sample = Sample::from(&f32::from_bits(u32::from_le(u32_view[i])));
    //         i += 1;
    //         for out in frame.iter_mut() {
    //             *out = sample;
    //         }
    //     }
    // }, err_fn)?;

    // std::thread::sleep(std::time::Duration::from_secs(4));

    Ok(())
}
