clang --target=wasm32-unknown-wasi test.c -c -o test.wasm.o
wasm2wat test.wasm.o -o test.wat.o
sed "s/call 0/call \$_start/" -i test.wat.o
sed "s/call 1/call \$csoundCreateWasi/" -i test.wat.o
sed "s/call 2/call \$csoundSetOption/" -i test.wat.o
sed "s/call 3/call \$csoundCompileCsd/" -i test.wat.o
sed "s/call 4/call \$csoundStart/" -i test.wat.o
sed "s/call 5/call \$csoundGet0dBFS/" -i test.wat.o
sed "s/call 6/call \$csoundGetKsmps/" -i test.wat.o
sed "s/call 7/call \$csoundGetNchnls/" -i test.wat.o
sed "s/call 8/call \$csoundGetSpout/" -i test.wat.o
sed "s/call 9/call \$csoundPerformKsmpsWasi/" -i test.wat.o
sed "s/(type [0-9]) //" -i test.wat.o
