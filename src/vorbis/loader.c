#include <emscripten.h>

#include "stb_vorbis.c"

stb_vorbis *vorbis;

EMSCRIPTEN_KEEPALIVE
void setup(int sample_rate) {
    // TODO: Resample as needed.
    int error;
    vorbis = stb_vorbis_open_filename("main.ogg", &error, NULL);
}

EMSCRIPTEN_KEEPALIVE
int process(float *output, int length) {
    return stb_vorbis_get_samples_float_interleaved(vorbis, 2, output, length);
}
