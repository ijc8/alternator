import React, { useState } from 'react'
import { BiPlay } from 'react-icons/bi'
import logo from './logo.svg'
import './App.css'

const songs = [
    {
        name: "pd-thing",
        title: "Harmonic Thing (Pure Data)",
        album: "Pretty Paltry Patches",
        duration: "0:10",
    },
    {
        name: "py-audio-file",
        title: "Phasing (Aleatora)",
        album: "Phasing: Greatest Hits (1964-2021)",
        duration: "∞",
    }
]

const audioContext = new AudioContext()

let audioWorklet: AudioWorkletNode
let webWorker: Worker
let setupDone = false

async function setupAudio() {
    await audioContext.resume()
    console.log("Sample rate:", audioContext.sampleRate)
    await audioContext.audioWorklet.addModule("worklet.js")
    setupDone = true
}

async function play(name: string) {
    if (!setupDone) {
        await setupAudio()
    }
    audioWorklet && audioWorklet.disconnect()
    webWorker && webWorker.terminate()
    audioWorklet = new AudioWorkletNode(audioContext, "doublebuffer", {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [1],
    })
    webWorker = new Worker("worker.js")
    // Send sample rate and Audio Worklet's port to the Web Worker, which will generate the samples as needed.
    webWorker.postMessage({ name, sampleRate: audioContext.sampleRate, port: audioWorklet.port }, [audioWorklet.port])
    audioWorklet.connect(audioContext.destination)
}

const Track = ({
    index, name, title, album, duration
} : {
    name: string, index: number, title: string, album: string, duration: string
}) => {
    const [hover, setHover] = useState(false)

    const onMouseEnter = () => {
        setHover(true)
    }

    const onMouseLeave = () => {
        setHover(false)
    }

    const onPlay = () => {
        console.log("Playing", name)
        play(name)
    }

    return <div className="group contents" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <div className="group-hover:bg-gray-700 p-4">{hover ? <BiPlay className="text-2xl relative -left-1.5" onClick={onPlay} /> : index + 1}</div>
        <div className="group-hover:bg-gray-700 p-4">{title}</div>
        <div className="group-hover:bg-gray-700 p-4">{album}</div>
        <div className="group-hover:bg-gray-700 p-4">{duration}</div>
    </div>
}

const App = () => {
    return <div className="flex flex-row text-white">
        <header className="App-header min-h-screen w-56 bg-black">
            <div className="flex flex-row">
                <div className="glitch flex-grow relative top-6" id="logo">
                    {[...new Array(5)].map((_, i) => <div key={i}>Alternator</div>)}
                </div>
            </div>
        </header>
        <main className="flex-grow flex flex-col">
            <div className="pt-20 pl-16 pb-6 flex flex-row items-end bg-green-900">
                <div className="w-60 h-60 border mr-8">
                    <img src="album_art.svg" alt="Album art" />
                </div>
                <div className="flex flex-col items-start">
                    <h1>Example album/playlist thing</h1>
                    <h2>Ian Clester</h2>
                </div>
            </div>
            <div className="p-16 pt-4 flex-grow bg-gray-800">
                <div className="grid grid-cols-4">
                    <div className="contents text-gray-400">
                        <div className="px-4">#</div>
                        <div className="px-4">Title</div>
                        <div className="px-4">Album</div>
                        <div className="px-4">Duration</div>
                    </div>
                    <div className="col-span-full border-b border-gray-700 mb-2"></div>
                    {songs.map((song, i) => <Track key={i} index={i} {...song} />)}
                </div>
            </div>
        </main>
    </div>
}

export default App;
