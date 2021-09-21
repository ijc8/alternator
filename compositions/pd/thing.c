#include <emscripten.h>

#include <stdio.h>
#include "z_libpd.h"

int done;

void finish(const char *s) {
    done = 1;
}

EMSCRIPTEN_KEEPALIVE
void setup(int sample_rate) {
    done = 0;

    // initialize libpd
    libpd_init();
    libpd_init_audio(0, 1, sample_rate);

    libpd_bind("finish");
    libpd_set_banghook(finish);

    // compute audio    [; pd dsp 1(
    libpd_start_message(1); // one entry in list
    libpd_add_float(1.0f);
    libpd_finish_message("pd", "dsp");

    // open patch       [; pd open file folder(
    libpd_openfile("thing.pd", ".");
}

EMSCRIPTEN_KEEPALIVE
int process(float *output, int length) {
    if (done) {
        return 0;
    }
    // Assumes length is a multiple of libpd_blocksize().
    int blocksize = libpd_blocksize();
    int i;
    for (i = 0; i < length; i += blocksize) {
        libpd_process_float(1, NULL, &output[i]);
    }
    if (i > length) {
        fprintf(stderr, "buffer overflow: %d > %d\n", i, length);
    }
    return length;
}
