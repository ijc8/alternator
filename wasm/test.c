typedef void CSOUND;

CSOUND *csoundCreateWasi();
int csoundSetOption(CSOUND *csound, char *s);
double *csoundGetSpout(CSOUND *csound);
double csoundGet0dBFS(CSOUND *csound);
int csoundGetNchnls(CSOUND *csound);
int csoundCompileCsd(CSOUND *csound, char *filename);
int csoundStart(CSOUND *csound);
int csoundPerformKsmpsWasi(CSOUND *csound);

#define N 32

static void *cs;
static double scale;
static int channels;
static double *spout;
static float output[N];

void *setup() {
    cs = csoundCreateWasi();
    // ["-odac", "-iadc", "-M0", "-+rtaudio=null", "--sample-rate=44100", "--nchnls_i=0", "-b 1024"]
    csoundSetOption(cs, "-odac");
    csoundCompileCsd(cs, "main.csd");
    csoundStart(cs);
    scale = 1.0 / csoundGet0dBFS(cs);
    channels = csoundGetNchnls(cs);
    spout = csoundGetSpout(cs);
    return output;
}

int process() {
    // static int n = 0;
    // TODO: Should include this last sample and still scale.
    if (csoundPerformKsmpsWasi(cs) != 0) {
        return N - 1;
    }
    for (int i = 0; i < N; i++) {
        output[i] = spout[i*channels] * scale;
    }
    return N;
}
