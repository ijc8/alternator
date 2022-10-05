use std::fs::read;

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

fn get_binary_header_data(wasm_bytes: &[u8]) -> (u32, u32, u32) {
    let magic: [u8; 4] = wasm_bytes[0..4].try_into().unwrap();
    if u32::from_le_bytes(magic) != 0x6d736100 {
        panic!("Wasm magic number is missing!");
    }
    if wasm_bytes[8] != 0 {
        panic!("Dylink section wasn't found in wasm binary, assuming static wasm.");
        // return "static";
    }

    let mut next = 9;
    let mut get_leb = || {
        let mut return_value: u32 = 0;
        let mut mul: u32 = 1;
        loop {
            let byte = wasm_bytes[next];
            next += 1;
            return_value += (byte & 0x7f) as u32 * mul;
            mul *= 0x80;
            if byte & 0x80 == 0 { break };
        }
        return_value
    };
    let _section_size = get_leb();
    // 6, size of "dylink" string = 7
    next += 7;
    // This is dumb.
    let mut get_leb = || {
        let mut return_value: u32 = 0;
        let mut mul: u32 = 1;
        loop {
            let byte = wasm_bytes[next];
            next += 1;
            return_value += (byte & 0x7f) as u32 * mul;
            mul *= 0x80;
            if byte & 0x80 == 0 { break };
        }
        return_value
    };
    let memory_size = get_leb();
    let memory_align = get_leb();
    let table_size = get_leb();
    // let tableAlign = getLEB();
    // let neededDynlibsCount = getLEB();
    (memory_size, memory_align, table_size)
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
    let wasm_bytes = read("csound.dylib.wasm").unwrap();
    let (memory_size, memory_align, table_size) = get_binary_header_data(wasm_bytes.as_slice());
    println!("Got {}, {}, {}", memory_size, memory_align, table_size);
    let module = Module::from_file(store.engine(), "csound.dylib.wasm")?;

    println!("B");

    const PAGE_SIZE: i32 = 65536;
    const PAGES_PER_MB: i32 = 16; // 1048576 bytes per MB / PAGE_SIZE

    let fixed_memory_base = 128 * PAGES_PER_MB;
    let initial_memory = ((memory_size + memory_align) as f32 / (PAGE_SIZE as f32)).ceil() as i32;
    let plugins_memory = 0;
  
    let total_initial_memory = initial_memory + plugins_memory + fixed_memory_base;

    let memory = Memory::new(&mut store, MemoryType::new(16, None))?;
    memory.grow(&mut store, total_initial_memory as u64).unwrap();
    println!("ma {}", memory.data_size(&store));
    let table = Table::new(&mut store, TableType::new(ValType::FuncRef, 3344, None), Val::FuncRef(None))?;
    let stack_pointer = Global::new(&mut store, GlobalType::new(ValType::I32, Mutability::Var), Val::I32(total_initial_memory * PAGE_SIZE))?;
    let memory_base = Global::new(&mut store, GlobalType::new(ValType::I32, Mutability::Const), Val::I32(fixed_memory_base))?;
    let table_base = Global::new(&mut store, GlobalType::new(ValType::I32, Mutability::Const), Val::I32(1))?;
    let heap_base = Global::new(&mut store, GlobalType::new(ValType::I32, Mutability::Var), Val::I32(total_initial_memory * PAGE_SIZE))?;

    linker.define("env", "memory", memory)?;
    linker.define("env", "__indirect_function_table", table)?;
    linker.define("env", "__stack_pointer", stack_pointer)?;
    linker.define("env", "__memory_base", memory_base)?;
    linker.define("env", "__table_base", table_base)?;
    linker.define("GOT.mem", "__heap_base", heap_base)?;

    linker.func_wrap("env", "csoundLoadModules", |_: i32| { 0 })?;
    linker.func_wrap("env", "csoundWasiJsMessageCallback", |_: i32, _: i32, _: i32, _: i32| {})?;

    let instance = linker.instantiate(&mut store, &module)?;

    let alloc_string_mem = instance.get_typed_func::<i32, i32, _>(&mut store, "allocStringMem")?;
    let free_string_mem = instance.get_typed_func::<i32, (), _>(&mut store, "freeStringMem")?;

    let csound_initialize = instance.get_typed_func::<i32, i32, _>(&mut store, "csoundInitialize")?;
    println!("initialize: {}", csound_initialize.call(&mut store, 0).unwrap());
    let csound_create = instance.get_typed_func::<(), i32, _>(&mut store, "csoundCreateWasi")?;
    let cs = csound_create.call(&mut store, ()).unwrap();
    dbg!(cs);
    let csound_set_option = instance.get_typed_func::<(i32, i32), i32, _>(&mut store, "csoundSetOption")?;

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

    for s in ["-odac", "-iadc", "-M0", "-+rtaudio=null", "-+rtmidi=null", "--sample-rate=44100", "--nchnls_i=0"] {
        println!("{}", s);
        with_wasm_str(s, Box::new(|store, addr| {
            println!("{}", addr);
            csound_set_option.call(store, (cs, addr)).unwrap();
        }))
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
