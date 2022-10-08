void *csoundCreateWasi();
int csoundSetOption(void *csound, char *s);
void *csoundGetSpout(void *csound);
int csoundCompileCsd(void *csound, char *filename);
int csoundStart(void *csound);
int csoundPerformKsmpsWasi(void *csound);

static void *cs;

void *setup() {
    cs = csoundCreateWasi();
    // ["-odac", "-iadc", "-M0", "-+rtaudio=null", "--sample-rate=44100", "--nchnls_i=0", "-b 1024"]
    csoundSetOption(cs, "-odac");
    csoundCompileCsd(cs, "main.csd");
    csoundStart(cs);
    return csoundGetSpout(cs);
}

int process() {
    return csoundPerformKsmpsWasi(cs);
}
