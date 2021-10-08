from aleatora import *
import random

bpm = random.randrange(80, 130)

main = (
    beat("- = - - - = - - - = - - - = - - ", dur=.25, bpm=bpm, amp=PRand(2)).cycle() +
    beat("    o  o      o  o  o  o o  o   ", dur=.25, bpm=bpm, amp=PRand(2)).cycle() +
    beat("x       x x       x     x x   x ", dur=.25, bpm=bpm, amp=PRand(2)).cycle()
)
