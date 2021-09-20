#include <stdio.h>
#include <emscripten/emscripten.h>

int t;

EMSCRIPTEN_KEEPALIVE
void setup(int samplerate) {
    t = 0;
}

EMSCRIPTEN_KEEPALIVE
int process(float *output, int length) {
    for (int i = 0; i < length; i++, t++) {
        uint8_t val = ((t<<1)^((t<<1)+(t>>7)&t>>12))|t>>(4-(1^7&(t>>19)))|t>>7;
        output[i] = val / 127.5 - 1;
    }
    return length;
}
