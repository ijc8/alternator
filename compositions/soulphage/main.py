from aleatora import *

scale = input_stream[:14.0].record("scale")
pitches = [scale[i*2.0:i*2.0+1.9].freeze() for i in range(7)]
inst = midi.sampler({60: pitches[0], 62: pitches[1], 64: pitches[2], 65: pitches[3], 67: pitches[4], 69: pitches[5], 71: pitches[6]})

mid = 64+48+48
end = mid + 48 + 48

bpm = 120
spb = 60 / bpm

# TODO: Panning omitted until Alternator supports stereo.
main = arrange([
    (0, inst(tune(const(0), dur=2))),
    (8*spb, inst(tune(const(4)[:(mid-8)//2] >> const(5), dur=2))),
    (16*spb, inst(tune(Stream.cycle([2,2,3,3,2,2,5,5,3,3,6,6]), dur=4))),
    (64*spb, inst(tune(const(0)[:(mid-64)//4] >> const(5), oct=4, dur=4))),
    ((64+48)*spb, inst(tune(const(0), oct=6))),
    ((64+48+24)*spb, inst(tune(Stream.cycle([2, 1]), amp=PEuclid(3,5), oct=6))),
    (mid*spb, inst(tune(Stream.cycle([4, 5]), amp=PEuclid(4,7), oct=6))),
    (mid*spb, (2*rand-1)*db(ramp(-72, -15, (end - mid) * spb))),
])[:end*spb]
