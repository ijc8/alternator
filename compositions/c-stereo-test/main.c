#include <stdio.h>
#include <math.h>
#include <emscripten/emscripten.h>

int t;
int samplerate;

EMSCRIPTEN_KEEPALIVE
void setup(int _samplerate) {
    t = 0;
    samplerate = _samplerate;
}

EMSCRIPTEN_KEEPALIVE
int process(float *output, int frames) {
    for (int i = 0; i < frames; i++, t++) {
        output[i * 2] = sinf(2*M_PI*200.f/samplerate*t);
        output[i * 2 + 1] = sinf(2*M_PI*300.f/samplerate*t);
    }
    return frames;
}
