import { Dialog } from '@headlessui/react'
import React, { useEffect, useRef, useState } from 'react'
import { BiPlay, BiPause, BiSkipPrevious, BiSkipNext, BiPlayCircle, BiVolumeFull, BiPauseCircle } from 'react-icons/bi'
// TODO: Consider BsJournalCode when react-icons 4.3.0 isn't broken.
import { BsFileEarmarkCode } from 'react-icons/bs'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import './App.css'

const tracks = [
    {
        name: "pd-thing",
        title: "Some Harmonics",
        artist: "Ian Clester",
        album: "Pretty Paltry Patches",
        duration: 10,
        channels: 1,
    },
    {
        name: "pd-thing2",
        title: "Some Harmonics (Extended Edition)",
        artist: "Ian Clester",
        album: "Pretty Paltry Patches",
        duration: 60,
        channels: 1,
    },
    {
        name: "py-audio-file",
        title: "Vocal Phasing",
        artist: "Ian Clester",
        album: "Phasing: Greatest Hits (1964-2021)",
        duration: Infinity,
        channels: 1,
    },
    {
        name: "py-piano-phase",
        title: "Piano(?) Phase",
        artist: "Ian Clester",
        album: "Phasing: Greatest Hits (1964-2021)",
        duration: Infinity,
        channels: 1,
    },
    {
        name: "beat",
        title: "Beat",
        artist: "Ian Clester",
        album: "Funky Functions",
        duration: Infinity,
        channels: 1,
    },
    {
        name: "py-stereo-test",
        title: "Stereo Test (Python)",
        artist: "Ian Clester",
        album: "The Test Album",
        duration: Infinity,
        channels: 2,
    },
    {
        name: "c-stereo-test",
        title: "Stereo Test (C)",
        artist: "Ian Clester",
        album: "The Test Album",
        duration: Infinity,
        channels: 2,
    },
]

const audioContext = new AudioContext()

let audioWorklet: AudioWorkletNode
let channel: MessageChannel
let webWorker: Worker
let setupDone = false

async function setupAudio() {
    await audioContext.resume()
    console.log("Sample rate:", audioContext.sampleRate)
    await audioContext.audioWorklet.addModule("worklet.js")
    setupDone = true
}

let _setInfo = ({ pos, length }: { pos: number, length: number }) => {}
let _setUnderrun = (u: boolean) => {}

async function play(name: string) {
    if (!setupDone) {
        await setupAudio()
    }
    audioWorklet && audioWorklet.disconnect()
    webWorker && webWorker.terminate()
    const channels = tracks.find(track => track.name === name)!.channels
    audioWorklet = new AudioWorkletNode(audioContext, "doublebuffer", {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [channels],
        processorOptions: { frameSize: 1024 },
    })
    channel = new MessageChannel()
    channel.port1.onmessage = (e) => {
        _setUnderrun(e.data)
    }
    audioWorklet.port.postMessage(null, [channel.port2])
    webWorker = new Worker("worker.js")
    // Send sample rate and Audio Worklet's port to the Web Worker, which will generate the samples as needed.
    webWorker.postMessage({ name, sampleRate: audioContext.sampleRate, port: audioWorklet.port }, [audioWorklet.port])
    audioWorklet.connect(audioContext.destination)
    return new Promise<{ end: Promise<void> }>(resolveSetup => {
        webWorker.onmessage = () => {
            resolveSetup({
                end: new Promise<void>(resolveEnd => {
                    webWorker.onmessage = (event) => {
                        _setInfo(event.data)
                        if (event.data.end) {
                            resolveEnd()
                        }
                    }
                })
            })
        }
    })
}

async function reset() {
    webWorker.postMessage({ sampleRate: audioContext.sampleRate })
    return new Promise<{ end: Promise<void> }>(resolveSetup => {
        webWorker.onmessage = () => {
            resolveSetup({
                end: new Promise<void>(resolveEnd => {
                    webWorker.onmessage = (event) => {
                        _setInfo(event.data)
                        if (event.data.end) {
                            resolveEnd()
                        }
                    }
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
                fill-opacity: 1;
            }

            30%, 70% {
                fill-opacity: 0;
            }
        }`}
    </style>
    <svg id="playing" fill="#0cf" width="8mm" viewBox="0 0 15.65 9.69" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(-2.67)">
            <path className="animate-pulse" d="m10.7 3.02 1.48 3.96h-.56l-.9-2.37-1.1 2.37h-.57l1.41-3.08-.2-.57q-.14-.36-.45-.36h-.28v-.45h.34q.65.01.83.5z" />
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
    index, name, title, artist, album, duration, status, setPlaying,
} : {
    index: number, name: string, title: string, artist: string, album: string, duration: number, status: PlayStatus | null, setPlaying: (p: boolean) => void,
}) => {
    const [hover, setHover] = useState(false)
    const [sourceOpen, setSourceOpen] = useState(false)

    const onMouseEnter = () => {
        setHover(true)
    }

    const onMouseLeave = () => {
        setHover(false)
    }

    const viewSource = () => {
        setSourceOpen(true)
    }

    return <div className={(status === null ? "" : "bg-gray-700 ") + "group flex items-center hover:bg-gray-600 px-4 py-2"} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <div className="w-1/4">
            {status === "setup"
                ? <div className="relative -left-2"><LoadAnimation /></div>
                : hover
                    ? <button className="text-2xl relative -left-1.5 top-1" onClick={() => setPlaying(status !== "play")}>
                        {status === "play" ? <BiPause /> : <BiPlay />}
                    </button>
                    : status === "play"
                        ? <div className="relative -left-2 top-0.5"><PlayAnimation /></div>
                        : index + 1}
        </div>
        <div className="w-1/4">
            {title}
            <div className="text-gray-400 text-sm">{artist}</div>
        </div>
        <div className="w-1/4">{album}</div>
        <div className="w-2/12">{formatTime(duration)}</div>
        <div className="w-1/12 hidden group-hover:block">
            <button onClick={viewSource} className="text-xl relative top-1">
                <BsFileEarmarkCode />
            </button>
        </div>
        <SourceView isOpen={sourceOpen} setIsOpen={setSourceOpen} name={name} title={title} />
    </div>
}

interface File {
    name: string
    contents: string
}

const SourceView = ({ isOpen, setIsOpen, name, title }: { isOpen: boolean, setIsOpen: (b: boolean) => void, name: string, title: string }) => {
    const [files, setFiles] = useState<File[]>([])
    const [selectedFile, setSelectedFile] = useState<File>()

    useEffect(() => {
        if (!isOpen) {
            setFiles([])
            setSelectedFile(undefined)
            return
        }
        (async () => {
            const { files } = await (await fetch(`bundles/${name}/bundle.metadata`)).json()
            const data = new Uint8Array(await (await fetch(`bundles/${name}/bundle.data`)).arrayBuffer())
            const decoder = new TextDecoder()
            for (const file of files) {
                file.name = file.filename.substr(1)
                file.contents = decoder.decode(data.subarray(file.start, file.end))
            }
            setFiles(files)
            setSelectedFile(files[0])
        })()
    }, [name, isOpen])

    const getLanguage = (name: string) => {
        if (name.endsWith(".py")) {
            return "python"
        } else if (name.endsWith(".js")) {
            return "javascript"
        } else {
            return "text"
        }
    }

    return <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen h-screen">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            <div className="relative bg-gray-700 text-white rounded max-w-full max-h-full mx-auto p-3 flex flex-col">
                <Dialog.Title className="flex border-b mb-3"><BsFileEarmarkCode className="mr-2 text-xl" /> {title}</Dialog.Title>
                <div className="flex min-h-0">
                    <div className="bg-gray-800 mr-2">
                        <ul>
                            {files.map(file =>
                                <li key={file.name} className={(file === selectedFile ? "bg-blue-600 " : "") + "px-2"}
                                    onClick={() => setSelectedFile(file)}>
                                    {file.name}
                                </li>
                            )}
                        </ul>
                    </div>
                    {selectedFile
                        ? <SyntaxHighlighter language={getLanguage(selectedFile.name)} style={a11yDark} className="max-h-full overflow-y-auto">
                            {selectedFile.contents}
                        </SyntaxHighlighter>
                        : null}
                </div>
            </div>
        </div>
    </Dialog>
}

interface PlayState {
    name: string
    status: PlayStatus
}

const Sidebar = () => {
    const [underrun, setUnderrun] = useState(false)
    _setUnderrun = setUnderrun

    return <header className="w-56 bg-black">
        <div className="glitch text-3xl flex-grow relative top-8 mb-14" id="logo">
            {[...new Array(5)].map((_, i) => <div key={i}>Alternator</div>)}
        </div>
        <div className="flex items-center justify-center">
            Status
            <div className={`w-2 h-2 ml-2 mt-0.5 rounded-full ${underrun ? "bg-red-500" : "bg-green-400"}`} />
        </div>
    </header>
}

function formatTime(seconds: number) {
    if (seconds === Infinity) {
        return "∞"
    }
    seconds = Math.floor(seconds)
    let minutes = Math.floor(seconds / 60)
    seconds -= minutes * 60
    const hours = Math.floor(minutes / 60)
    if (hours === 0) {
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
    minutes -= hours * 60
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

const Controls = ({ state, setPlaying, reset }: { state: PlayState | null, setPlaying: (b: boolean) => void, reset: () => void }) => {
    const track = tracks.find(track => track.name === state?.name)
    const disabled = state === null || state.status ===  "setup"
    const seekBar = useRef<HTMLDivElement>(null)
    const [{ pos, length }, setInfo] = useState({ pos: 0, length: 0 })
    const duration = track && (track.duration === Infinity
        ? length + 10 * audioContext.sampleRate
        : track.duration * audioContext.sampleRate)
    _setInfo = setInfo

    const seek = (event: MouseEvent | React.MouseEvent) => {
        if (!seekBar.current || !state || !duration) {
            return
        }
        const el = seekBar.current!
        const frac = (event.clientX - el.offsetLeft) / el.clientWidth
        webWorker.postMessage(Math.round(duration * Math.max(0, Math.min(frac, 1))))
    }

    return <footer className="bg-gray-900 flex justify-between items-center px-4 py-6">
        <div className="w-1/4">
            {track && <>
                <div>{track.title}</div>
                <div className="text-gray-400 text-sm">{track.artist}</div>
            </>}
        </div>
        <div className="w-5/12">
            <div className="flex justify-center text-3xl">
                <button disabled={disabled} className="disabled:text-gray-500" onClick={reset}><BiSkipPrevious /></button>
                <button disabled={disabled} className="disabled:text-gray-500 text-4xl">
                    {state?.status === "play"
                        ? <BiPauseCircle onClick={() => setPlaying(false)} />
                        : <BiPlayCircle onClick={() => setPlaying(true)} />}
                </button>
                <button disabled={disabled} className="disabled:text-gray-500"><BiSkipNext /></button>
            </div>
            <div className="flex justify-between items-center text-gray-400 text-sm select-none">
                {duration && <div className="text-right w-12">{formatTime(Math.floor(pos / audioContext.sampleRate))}</div>}
                <div ref={seekBar} className="group mx-2 py-2 w-full" onClick={seek} onMouseDown={(e) => {
                    const release = () => {
                        document.removeEventListener("mousemove", seek)
                        document.removeEventListener("mouseup", release)
                    }
                    document.addEventListener("mousemove", seek)
                    document.addEventListener("mouseup", release)
                }}>
                    {duration && <div className="w-full flex relative">
                        <div className="absolute w-full h-1 bg-gradient-split" style={{
                              backgroundSize: "12px 4px",
                              backgroundPosition: `${Math.max(pos, length) / duration * 100}%`
                        }} />
                        <div className="bg-gray-500 h-1 relative" style={{ width: `${length / duration * 100}%` }}>
                            {duration && <>
                                <div className="bg-cyan-500 h-1" style={{ width: `${Math.min(pos, length) / length * 100}%` }} />
                                <div className="hidden group-hover:block absolute top-0 transform -translate-x-1/2 -translate-y-1/4 rounded-full w-2 h-2 bg-white"
                                    style={{ left: `${pos / length * 100}%` }} />
                            </>}
                        </div>
                    </div>}
                </div>
                {duration && <div className="w-12">{formatTime(Math.floor(duration / audioContext.sampleRate))}</div>}
            </div>
        </div>
        <div className="w-1/4 flex justify-end items-center">
            <BiVolumeFull className="text-gray-400 mr-2" />
            <div className="bg-gray-500 w-32 h-1"></div>
        </div>
    </footer>
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

    return <div className="flex flex-col text-white min-h-screen max-h-screen justify-end">
        <div className="flex flex-row flex-grow min-h-0">
            <Sidebar />
            <main className="flex-grow flex flex-col overflow-y-auto">
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
                    <div className="flex flex-col">
                        <div className="flex text-gray-400 px-4">
                            <div className="w-1/4">#</div>
                            <div className="w-1/4">Title</div>
                            <div className="w-1/4">Album</div>
                            <div className="w-1/4">Duration</div>
                        </div>
                        <div className="col-span-full border-b border-gray-700 mb-2"></div>
                        {tracks.map(({ name, ...track }, i) =>
                        <Track
                            key={i} index={i} name={name} {...track}
                            status={state?.name === name ? state.status : null}
                            setPlaying={(playing: boolean) => {
                                setState({
                                    name,
                                    status: playing ? "play" : "pause",
                                })
                            }
                        } />)}
                    </div>
                </div>
            </main>
        </div>
        <Controls state={state} setPlaying={(playing: boolean) => {
            setState({
                name: state!.name,
                status: playing ? "play" : "pause",
            })
        }} reset={async () => {
            _setState({ name: state!.name, status: "setup" })
            // TODO: Consistent method of resetting.
            let end
            if (state!.name.startsWith("pd")) {
                end = (await play(state!.name)).end
            } else {
                end = (await reset()).end
            }
            _setState({ name: state!.name, status: "play" });
            await end
            _setState(null)        
        }} />
    </div>
}

export default App;
