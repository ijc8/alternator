from aleatora import *

voice = wav.load("voice.wav").cycle()
main = voice + voice.resample(1.02)
