import React, { useState } from 'react'
import { BiPlay, BiPause } from 'react-icons/bi'
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
    return new Promise<{ end: Promise<void> }>(resolveSetup => {
        webWorker.onmessage = () => {
            resolveSetup({
                end: new Promise<void>(resolveEnd => {
                    webWorker.onmessage = () => resolveEnd()
                })
            })
        }
    })
}

const LoadAnimation = () => {
    return <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="25px" viewBox="0 0 100 100">
        <path fill="none" stroke="#00ccff" strokeWidth="8" strokeDasharray="42.76482137044271 42.76482137044271" d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z" strokeLinecap="butt">
            <animate attributeName="stroke-dashoffset" repeatCount="indefinite" dur="1.2048192771084336s" keyTimes="0;1" values="0;256.58892822265625"></animate>
        </path>
    </svg>
}

const PlayAnimation = () => {
    return <>
    <style>
        {`#playing #inner {
            animation: 1s linear 0s infinite normal none running propagate;
        }

        #playing #middle {
            animation: 1s linear 0.25s infinite normal none running propagate;
        }

        #playing #outer {
            animation: 1s linear 0.5s infinite normal none running propagate;
        }

        @keyframes propagate {
            0% {
                fill: #fff
            }

            30%, 70% {
                fill: #888
            }
        }`}
    </style>
    <svg id="playing" fill="#0cf" width="8mm" viewBox="0 0 15.65 9.69" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(-2.67)">
            <path d="m10.7 3.02 1.48 3.96h-.56l-.9-2.37-1.1 2.37h-.57l1.41-3.08-.2-.57q-.14-.36-.45-.36h-.28v-.45h.34q.65.01.83.5z" />
            <g id="inner">
                <path d="M78.24 103.48h.55q.5.8.76 1.57.25.77.25 1.52 0 .77-.25 1.54t-.76 1.57h-.55q.45-.78.67-1.55.23-.77.23-1.56 0-.78-.23-1.54-.22-.77-.67-1.55z" strokeWidth=".17" transform="matrix(.76335 0 0 1 -46.85 -101.71)" />
                <path d="M80.35 103.48h.54q.51.8.76 1.57.26.77.26 1.52 0 .77-.26 1.54-.25.77-.76 1.57h-.54q.45-.78.67-1.55.22-.77.22-1.56 0-.78-.22-1.54-.22-.77-.67-1.55z" strokeWidth=".17" transform="matrix(-.76335 0 0 1 69.46 -101.71)" />
            </g>
            <g id="middle">
                <path d="M15.63.75h.72q.67 1.06 1 2.07.34 1.02.34 2.02t-.33 2.02q-.34 1.02-1.01 2.08h-.72q.6-1.03.9-2.05.29-1.01.29-2.05 0-1.04-.3-2.05-.3-1-.89-2.04zM4.87.75h-.72q-.67 1.06-1 2.07-.34 1.02-.34 2.02t.33 2.02q.34 1.02 1 2.08h.73q-.6-1.03-.9-2.05-.29-1.01-.29-2.05 0-1.04.3-2.05.29-1 .89-2.04z" transform="matrix(.76335 0 0 1 2.67 0)"/>
            </g>
            <g id="outer">
                <path d="M18.06 0h.85q.8 1.25 1.19 2.45.4 1.2.4 2.39 0 1.19-.4 2.4-.4 1.2-1.19 2.45h-.85q.7-1.22 1.05-2.42.35-1.2.35-2.43 0-1.23-.35-2.42-.34-1.2-1.05-2.42zM2.44 0h-.85Q.79 1.25.39 2.45 0 3.65 0 4.84q0 1.19.4 2.4.4 1.2 1.19 2.45h.85q-.7-1.22-1.05-2.42-.35-1.2-.35-2.43 0-1.23.35-2.42.34-1.2 1.05-2.42z" transform="matrix(.76335 0 0 1 2.67 0)"/>
            </g>
        </g>
    </svg>
    </>

}

type PlayStatus = "setup" | "play" | "pause"

const Track = ({
    index, title, album, duration, status, setPlaying,
} : {
    index: number, title: string, album: string, duration: string, status: PlayStatus | null, setPlaying: (p: boolean) => void,
}) => {
    const [hover, setHover] = useState(false)

    const onMouseEnter = () => {
        setHover(true)
    }

    const onMouseLeave = () => {
        setHover(false)
    }

    const className = (status === null ? "" : "bg-gray-700 ") + "group-hover:bg-gray-600 p-4"

    console.log("status", status)

    return <div className="group contents" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <div className={className}>
            {status === "setup"
                ? <div className="relative -left-2"><LoadAnimation /></div>
                : hover
                    ? status === "play"
                        ? <BiPause className="text-2xl relative -left-1.5" onClick={() => setPlaying(false)} />
                        : <BiPlay className="text-2xl relative -left-1.5" onClick={() => setPlaying(true)} />
                    : status === "play"
                        ? <div className="relative -left-2 top-0.5"><PlayAnimation /></div>
                        : index + 1}
        </div>
        <div className={className}>{title}</div>
        <div className={className}>{album}</div>
        <div className={className}>{duration}</div>
    </div>
}

interface PlayState {
    name: string
    status: PlayStatus
}

const App = () => {
    const [state, _setState] = useState<PlayState | null>(null)

    const setState = async (newState: PlayState) => {
        if (state?.name !== newState.name) {
            _setState({ name: newState.name, status: "setup" })
            const end = (await play(newState.name)).end
            _setState({ name: newState.name, status: "play" });
            await end
            _setState(null)
        } else {
            webWorker.postMessage(newState.status === "play")
            _setState(newState)
        }
    }

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
                    {songs.map(({ name, ...song }, i) => <Track key={i} index={i} {...song} status={state?.name === name ? state.status : null} setPlaying={(playing: boolean) => {
                        setState({
                            name,
                            status: playing ? "play" : "pause",
                        })
                    }} />)}
                </div>
            </div>
        </main>
    </div>
}

export default App;
