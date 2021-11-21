#include <emscripten.h>

#define DR_WAV_IMPLEMENTATION
#include "dr_wav.h"

drwav wav;

EMSCRIPTEN_KEEPALIVE
void setup(int sample_rate) {
    drwav_init_file(&wav, "main.wav", NULL);
}

EMSCRIPTEN_KEEPALIVE
int process(float *output, int length) {
    drwav_uint64 read = drwav_read_pcm_frames_f32(&wav, length, output);
    return read;
}
