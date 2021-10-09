dur = 5.0
notedur = 1.0
amp = 5000
squish = 2
decay = 2.0
for (st = 0; st < dur; st += 0.11) {
    freq = irand(200, 500)
    pan = irand(0, 1)
    STRUM2(st, notedur, amp, freq, squish, decay, pan)
}
