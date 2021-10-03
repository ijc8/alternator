from aleatora import *

# A variant of Reich's Piano Phase in the style of Sam Aaron's examples, which (unlike the original) are continuously phasing.
# See https://gist.github.com/samaaron/997ba2902af1cf81a26f

notes = [64, 66, 71, 73, 74, 66, 64, 73, 71, 66, 74, 73]
def loop(tempo):
    return ConcatStream((sqr(m2f(note)) * basic_envelope(10.0/tempo)) for note in notes).cycle()

main = (loop(72) + loop(73))/2
