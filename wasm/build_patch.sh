clang --target=wasm32-unknown-wasi test.c -c -o test.wasm.o
wasm2wat test.wasm.o -o test.wat.o
sed "s/call 0/call \$csoundCreateWasi/" -i test.wat.o
sed "s/call 1/call \$csoundSetOption/" -i test.wat.o
sed "s/call 2/call \$csoundCompileCsd/" -i test.wat.o
sed "s/call 3/call \$csoundStart/" -i test.wat.o
sed "s/call 4/call \$csoundGet0dBFS/" -i test.wat.o
sed "s/call 5/call \$csoundGetKsmps/" -i test.wat.o
sed "s/call 6/call \$csoundGetNchnls/" -i test.wat.o
sed "s/call 7/call \$csoundGetSpout/" -i test.wat.o
sed "s/call 8/call \$csoundPerformKsmpsWasi/" -i test.wat.o
sed "s/(type 0) //" -i test.wat.o
