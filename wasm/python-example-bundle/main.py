import math
import random

freq = random.randrange(400, 800)
phase = 0

def setup(_sample_rate):
    global sample_rate
    sample_rate = _sample_rate

def process(buffer):
    global phase
    for i in range(len(buffer)):
        buffer[i] = math.sin(phase)
        phase += 2*math.pi*freq/sample_rate
    return len(buffer)
