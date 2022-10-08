#include <stdbool.h>

typedef void CSOUND;

void _start();
CSOUND *csoundCreateWasi();
int csoundSetOption(CSOUND *csound, char *s);
double *csoundGetSpout(CSOUND *csound);
double csoundGet0dBFS(CSOUND *csound);
int csoundGetKsmps(CSOUND *csound);
int csoundGetNchnls(CSOUND *csound);
int csoundCompileCsd(CSOUND *csound, char *filename);
int csoundStart(CSOUND *csound);
int csoundPerformKsmpsWasi(CSOUND *csound);

#define N 1024

static void *cs;
static double scale;
static int channels;
static int ksmps;
static double *spout;
static float output[N];

static int spout_index;

void *setup(float sample_rate) {
    _start();
    cs = csoundCreateWasi();
    // ["-+rtaudio=null", "--sample-rate=44100", "--nchnls_i=0", "-b 1024"]
    csoundSetOption(cs, "-odac");
    csoundCompileCsd(cs, "main.csd");
    csoundStart(cs);
    scale = 1.0 / csoundGet0dBFS(cs);
    ksmps = csoundGetKsmps(cs);
    spout_index = ksmps;
    channels = csoundGetNchnls(cs);
    spout = csoundGetSpout(cs);
    return output;
}

int process() {
    static bool done = false;
    
    int i;
    for (i = 0; i < N; i++) {
        if (spout_index == ksmps) {
            if (done) {
                break;
            } else if (csoundPerformKsmpsWasi(cs) != 0) {
                // Include the last Ksmps frames.
                done = true;
            }
            spout_index = 0;
        }
        output[i] = spout[spout_index*channels] * scale;
        spout_index++;
    }
    return i;
}
