use anyhow::Result;
use wasmtime::*;

fn main() -> Result<()> {
    // Load our WebAssembly (parsed WAT in our case), and then load it into a
    // `Module` which is attached to a `Store` cache. After we've got that we
    // can instantiate it.
    let mut store = Store::<()>::default();
    let module = Module::from_file(store.engine(), "rust-wasm-export/target/wasm32-unknown-unknown/release/rust_wasm_export.wasm")?;
    let instance = Instance::new(&mut store, &module, &[])?;

    let factorial = instance.get_typed_func::<i32, i32, _>(&mut store, "factorial")?;

    println!("factorial(5) = {}", factorial.call(&mut store, 5)?);
    Ok(())
}
