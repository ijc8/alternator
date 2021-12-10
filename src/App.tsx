import { Dialog } from '@headlessui/react'
import React, { useEffect, useRef, useState } from 'react'
import { BiPlay, BiPause, BiSkipPrevious, BiSkipNext, BiPlayCircle, BiVolumeFull, BiPauseCircle, BiVolumeLow, BiVolumeMute } from 'react-icons/bi'
// TODO: Consider BsJournalCode when react-icons 4.3.0 isn't broken.
import { BsFileEarmarkCode, BsSearch, BsThreeDotsVertical } from 'react-icons/bs'
import { FaHome, FaInfoCircle, FaWrench } from 'react-icons/fa'
import { FiExternalLink } from 'react-icons/fi'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import './App.css'

interface Track {
    url: string
    name: string
    title: string
    artist: string
    album: string
    duration: number
    channels: number
}

const audioContext = new AudioContext()

let gain: GainNode
let audioWorklet: AudioWorkletNode
let channel: MessageChannel
let webWorker: Worker
let setupDone = false

async function setupAudio() {
    await audioContext.resume()
    gain = new GainNode(audioContext)
    gain.connect(audioContext.destination)
    console.log("Sample rate:", audioContext.sampleRate)
    await audioContext.audioWorklet.addModule("worklet.js")
    setupDone = true
}

let _setInfo = ({ pos, length }: { pos: number, length: number }) => { }
let _setUnderrun = (u: boolean) => { }

async function play(track: Track) {
    if (!setupDone) {
        await setupAudio()
    }
    audioWorklet && audioWorklet.disconnect()
    webWorker && webWorker.terminate()
    audioWorklet = new AudioWorkletNode(audioContext, "doublebuffer", {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [track.channels],
        processorOptions: { numFrames: 1024 },
    })
    channel = new MessageChannel()
    channel.port1.onmessage = (e) => {
        _setUnderrun(e.data)
    }
    audioWorklet.port.postMessage(null, [channel.port2])
    webWorker = new Worker("worker.js")
    // Send sample rate and Audio Worklet's port to the Web Worker, which will generate the samples as needed.
    webWorker.postMessage({
        path: track.url,
        sampleRate: audioContext.sampleRate,
        port: audioWorklet.port
    }, [audioWorklet.port])
    audioWorklet.connect(gain)
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
                    <path d="M15.63.75h.72q.67 1.06 1 2.07.34 1.02.34 2.02t-.33 2.02q-.34 1.02-1.01 2.08h-.72q.6-1.03.9-2.05.29-1.01.29-2.05 0-1.04-.3-2.05-.3-1-.89-2.04zM4.87.75h-.72q-.67 1.06-1 2.07-.34 1.02-.34 2.02t.33 2.02q.34 1.02 1 2.08h.73q-.6-1.03-.9-2.05-.29-1.01-.29-2.05 0-1.04.3-2.05.29-1 .89-2.04z" transform="matrix(.76335 0 0 1 2.67 0)" />
                </g>
                <g id="outer">
                    <path d="M18.06 0h.85q.8 1.25 1.19 2.45.4 1.2.4 2.39 0 1.19-.4 2.4-.4 1.2-1.19 2.45h-.85q.7-1.22 1.05-2.42.35-1.2.35-2.43 0-1.23-.35-2.42-.34-1.2-1.05-2.42zM2.44 0h-.85Q.79 1.25.39 2.45 0 3.65 0 4.84q0 1.19.4 2.4.4 1.2 1.19 2.45h.85q-.7-1.22-1.05-2.42-.35-1.2-.35-2.43 0-1.23.35-2.42.34-1.2 1.05-2.42z" transform="matrix(.76335 0 0 1 2.67 0)" />
                </g>
            </g>
        </svg>
    </>

}

type PlayStatus = "setup" | "play" | "pause"

const Track = ({ index, track, status, setPlaying }: { index: number, track: Track, status: PlayStatus | null, setPlaying: (p: boolean) => void }) => {
    const [hover, setHover] = useState(false)
    const [sourceOpen, setSourceOpen] = useState(false)
    // Only on mobile
    const [menuOpen, setMenuOpen] = useState(false)

    const onMouseEnter = () => {
        setHover(true)
    }

    const onMouseLeave = () => {
        setHover(false)
    }

    const onClick = () => {
        if (window.matchMedia("(max-width: 768px)").matches) {
            // Corresponds to Tailwind's `md:` prefix.
            setPlaying(true)
        }
    }

    const viewSource = () => {
        setSourceOpen(true)
    }

    return <div className={(status === null ? "" : "bg-gray-700 ") + "group flex items-center hover:bg-gray-600 active:translate-y-px active:translate-x-px md:active:translate-x-0 md:active:translate-y-0 px-4 py-2"}
        onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}
    >
        <div className="w-10 hidden md:block">
            {status === "setup"
                ? <div className="relative -left-2"><LoadAnimation /></div>
                : hover
                    ? <button className="text-2xl relative -left-1.5 top-1" onClick={() => setPlaying(status !== "play")}>
                        {status === "play" ? <BiPause /> : <BiPlay />}
                    </button>
                    : status === "play"
                        ? <div className="relative -left-2 top-0.5"><PlayAnimation /></div>
                        : <span className="text-gray-400">{index + 1}</span>}
        </div>
        <div className={"flex-grow" + (status === null ? "" : " text-cyan-500")}>
            {track.title}
            <div className="text-gray-400 text-sm">{track.artist}</div>
        </div>
        {/* <div className="w-1/4">{track.album}</div> */}
        <div className="w-20 text-right">{formatTime(track.duration)}</div>
        <div className="w-10 md:invisible group-hover:visible">
            <button onClick={viewSource} className="ml-4 text-xl relative top-0.5 hidden md:block">
                <BsFileEarmarkCode />
            </button>
            <button onClick={e => { e.stopPropagation(); setMenuOpen(true) }} className="text-gray-400 w-full text-right md:hidden">
                <BsThreeDotsVertical className="inline" />
            </button>
        </div>
        <SourceView isOpen={sourceOpen} setIsOpen={setSourceOpen} track={track} />
        {/* Only on mobile */}
        <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen h-screen">
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
                <div className="relative bg-gray-700 text-white rounded max-w-full max-h-full mx-auto p-3 flex flex-col">
                    <Dialog.Title className="flex border-b pb-2 mb-3 justify-between">
                        <span><FaInfoCircle className="text-xl inline-block" /> Info</span>
                    </Dialog.Title>
                    <div className="grid" style={{ gridTemplateColumns: "auto auto" }}>
                        <div className="text-gray-400">Title</div><div>{track.title}</div>
                        <div className="text-gray-400">Artist</div><div>{track.artist}</div>
                        <div className="text-gray-400 pr-3">Duration</div><div>{formatTime(track.duration)}</div>
                        <div className="text-gray-400">Source</div>
                        <button className="text-left text-cyan-500" onClick={() => { setMenuOpen(false); viewSource() }}>View Source</button>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
}

interface File {
    name: string
    contents: string
}

const SourceView = ({ isOpen, setIsOpen, track }: { isOpen: boolean, setIsOpen: (b: boolean) => void, track: Track }) => {
    const [files, setFiles] = useState<File[]>([])
    const [selectedFile, setSelectedFile] = useState<File>()

    useEffect(() => {
        if (!isOpen) {
            setFiles([])
            setSelectedFile(undefined)
            return
        }
        (async () => {
            const { files } = await (await fetch(`${track.url}/track.json`)).json()
            const data = new Uint8Array(await (await fetch(`${track.url}/bundle.data`)).arrayBuffer())
            const decoder = new TextDecoder()
            for (const file of files) {
                file.name = file.filename
                file.contents = decoder.decode(data.subarray(file.start, file.end))
            }
            files.push({
                name: "main.js",
                contents: await (await fetch(`${track.url}/main.js`)).text()
            })
            setFiles(files)
            setSelectedFile(files[0])
        })()
    }, [track, isOpen])

    const getLanguage = (name: string) => {
        if (name.endsWith(".py")) {
            return "python"
        } else if (name.endsWith(".js")) {
            return "javascript"
        } else {
            return "text"
        }
    }

    let repoUrl = track.url
    if (repoUrl.startsWith("https://raw.githubusercontent.com")) {
        repoUrl = repoUrl.replace("raw.githubusercontent", "github")
        repoUrl = repoUrl.replace("/main/", "/tree/main/")
    }

    return <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen h-screen">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            <div className="relative bg-gray-700 text-white rounded max-w-full mx-auto p-3 flex flex-col" style={{ maxHeight: "89%" }}>
                <Dialog.Title className="flex border-b pb-2 mb-3 justify-between">
                    <span><BsFileEarmarkCode className="text-xl inline-block" /> {track.title}</span>
                    <a className="text-blue-400 ml-4" href={repoUrl} target="_blank" rel="noreferrer">
                        View in Repository
                        <FiExternalLink className="ml-1 inline-block" />
                    </a>
                </Dialog.Title>
                <div className="flex min-h-0">
                    <div className="bg-gray-800 mr-2 overflow-auto" style={{ minWidth: "5rem" }}>
                        <ul className="max-h-full min-w-max">
                            {files.map(file =>
                                <li key={file.name} className={(file === selectedFile ? "bg-blue-600 " : "") + "px-2"}
                                    onClick={() => setSelectedFile(file)}>
                                    {file.name}
                                </li>
                            )}
                        </ul>
                    </div>
                    {selectedFile
                        ? <SyntaxHighlighter language={getLanguage(selectedFile.name)} style={a11yDark} className="max-h-full overflow-y-auto flex-grow">
                            {selectedFile.contents}
                        </SyntaxHighlighter>
                        : null}
                </div>
            </div>
        </div>
    </Dialog>
}

interface PlayState {
    track: Track
    status: PlayStatus
}

const Navbar = ({ isHome, goHome, search, fetchAlbum }: {
    isHome: boolean, goHome: () => void, search: (q: string) => void, fetchAlbum: (url: string) => void
}) => {
    const [underrun, setUnderrun] = useState(false)
    _setUnderrun = setUnderrun

    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const buttonClass = "hover:bg-gray-700 p-2 font-semibold flex items-center justify-center"

    return <header className="bg-black flex items-center p-1 justify-evenly md:justify-start md:flex-col md:w-56 md:items-stretch">
        <button className="glitch text-3xl relative top-8 mb-14 hidden md:block" id="logo" onClick={goHome}>
            {[...new Array(5)].map((_, i) => <div key={i}>Alternator</div>)}
        </button>
        <div className="items-center justify-center mb-8 hidden md:flex">
            Status
            <div className={`w-2 h-2 ml-2 mt-0.5 rounded-full ${underrun ? "bg-red-500" : "bg-green-400"}`} />
        </div>
        <button className={buttonClass + (isHome ? " bg-gray-800" : "")} onClick={goHome}><FaHome className="mr-2" /> Home</button>
        <div className="w-1/3 md:w-full">
            {searchOpen
                ? <div className="flex items-center p-1 md:px-2 bg-gray-800">
                    <BsSearch className="mr-2" />
                    <input
                        type="text" autoFocus={true} onBlur={() => setSearchOpen(false)} className="bg-gray-600 w-3/4 px-2 py-1"
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => {
                            if (e.key === "Enter") {
                                if (!searchQuery.trim()) {
                                    setSearchOpen(false)
                                } else {
                                    console.log("Search query:", searchQuery)
                                    setSearchOpen(false)
                                    search(searchQuery)
                                }
                            }
                        }}
                    />
                </div>
                : <button className={buttonClass + " w-full"} onClick={() => setSearchOpen(true)}>
                    <BsSearch className="mr-2" />
                    Search
                </button>}
        </div>
        {/* Temporary buttons for testing. */}
        <button className={buttonClass} onClick={() => fetchAlbum(prompt("Album URL")!)}><FaWrench className="mr-2" /> Load Album</button>
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
    const track = state?.track
    const disabled = state === null || state.status === "setup"
    const seekBar = useRef<HTMLDivElement>(null)
    const [info, setInfo] = useState({ pos: 0, length: 0 })
    const { pos, length } = state?.status === "setup" ? { pos: 0, length: 0 } : info
    const duration = track && (track.duration === Infinity
        ? length + 10 * audioContext.sampleRate
        : track.duration * audioContext.sampleRate)
    const [seekPos, setSeekPos] = useState<number>()
    const durationRef = useRef(duration)
    durationRef.current = duration

    _setInfo = ({ pos, length }) => {
        // The Web Worker doesn't know anything about channels.
        pos /= track!.channels
        length /= track!.channels
        setInfo({ pos, length })
        if (seekPos !== undefined && pos === seekPos) {
            // Clearing seekPos here prevents a visual glitch where the position and time briefly jump back to the present.
            setSeekPos(undefined)
        }
    }

    const trackSeek = (event: MouseEvent | React.MouseEvent) => {
        const duration = durationRef.current
        if (!seekBar.current || !state || !duration) {
            return
        }
        const el = seekBar.current!
        const frac = (event.clientX - el.offsetLeft) / el.clientWidth
        setSeekPos(Math.max(0, Math.min(frac, 1)) * duration)
    }

    const seek = (event: MouseEvent | React.MouseEvent) => {
        const duration = durationRef.current
        if (!seekBar.current || !state || !duration) {
            return
        }
        const el = seekBar.current!
        const frac = (event.clientX - el.offsetLeft) / el.clientWidth
        const nextPos = Math.round(duration * Math.max(0, Math.min(frac, 1)))
        setSeekPos(nextPos)
        webWorker.postMessage(nextPos * track!.channels)
        document.removeEventListener("mousemove", trackSeek)
        document.removeEventListener("mouseup", seek)
    }

    const displayPos = seekPos ?? pos

    return <footer className="bg-gray-900 flex flex-col md:flex-row justify-between md:items-center px-4 py-2 md:py-6">
        <div className="w-full md:w-1/4">
            {track && <div className="flex items-end justify-between md:block">
                <div className="font-semibold">{track.title}</div>
                <div className="text-gray-400 text-sm">{track.artist}</div>
            </div>}
        </div>
        <div className="w-full md:w-5/12 flex md:block">
            <div className="flex justify-center text-3xl">
                <button disabled={disabled} className="disabled:text-gray-500 hidden md:block" onClick={reset}><BiSkipPrevious /></button>
                <button disabled={disabled} className="disabled:text-gray-500 text-4xl">
                    {state?.status === "setup"
                        ? <div className="py-1.5"><LoadAnimation /></div>
                        : state?.status === "play"
                            ? <BiPauseCircle onClick={() => setPlaying(false)} />
                            : <BiPlayCircle onClick={() => setPlaying(true)} />}
                </button>
                <button disabled={disabled} className="disabled:text-gray-500 hidden md:block"><BiSkipNext /></button>
            </div>
            <div className="flex flex-grow justify-between items-center text-gray-400 text-sm select-none">
                {duration && <div className="text-right w-12">{formatTime(Math.floor(displayPos / audioContext.sampleRate))}</div>}
                <div ref={seekBar} className="group mx-2 py-2 w-full" onClick={seek} onMouseDown={(e) => {
                    trackSeek(e)
                    document.addEventListener("mousemove", trackSeek)
                    document.addEventListener("mouseup", seek)
                }}>
                    {duration && <div className="w-full flex relative">
                        <div className="absolute w-full h-1 bg-gradient-split" style={{
                            backgroundSize: "12px 4px",
                            backgroundPosition: `${Math.max(pos, length) / duration * 100}%`
                        }} />
                        <div className="bg-gray-500 h-1 relative" style={{ width: `${length / duration * 100}%` }}>
                            {duration && <>
                                <div className="bg-cyan-500 h-1" style={{ width: `${Math.min(pos, length) / length * 100}%` }} />
                                <div className={(seekPos ? "" : "hidden group-hover:block ") + "absolute top-0 transform -translate-x-1/2 -translate-y-1/4 rounded-full w-2 h-2 bg-white"}
                                    style={{ left: `${displayPos / length * 100}%` }} />
                            </>}
                        </div>
                    </div>}
                </div>
                {duration && <div className="w-12">{formatTime(Math.floor(duration / audioContext.sampleRate))}</div>}
            </div>
        </div>
        <VolumeControl />
    </footer>
}

const VolumeControl = () => {
    const [volume, setVolume] = useState(1)
    const volumeBar = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!gain) return
        if (volume === 0) {
            // Slider is all the way down: mute
            gain.gain.value = 0
        } else {
            const db = (volume - 1) * 64
            gain.gain.value = 10**(db/20)
            console.log(db, gain.gain.value)
        }
    }, [volume])

    const mouseMove = (event: MouseEvent | React.MouseEvent) => {
        if (!volumeBar.current) return
        const el = volumeBar.current
        const frac = (event.clientX - el.offsetLeft) / el.clientWidth
        setVolume(Math.max(0, Math.min(frac, 1)))
    }

    const mouseUp = () => {
        document.removeEventListener("mousemove", mouseMove)
        document.removeEventListener("mouseup", mouseUp)
    }

    const VolumeIcon = (
        volume > 0.5 ? BiVolumeFull :
        volume > 0 ? BiVolumeLow :
        BiVolumeMute
    )

    return <div className="w-1/4 hidden md:flex justify-end items-center">
        <VolumeIcon className="text-gray-400 mr-2" />
        <div ref={volumeBar} className="relative w-32 h-1 py-2 -top-0.5"
            onMouseDown={e => {
                mouseMove(e)
                document.addEventListener("mousemove", mouseMove)
                document.addEventListener("mouseup", mouseUp)
        }}>
            <div className="absolute bg-gray-600 h-1 w-full"></div>
            <div className="relative bg-gray-400 h-1" style={{ width: `${volume * 100}%` }}></div>
        </div>
    </div>
}

interface Album {
    url: string
    title: string
    artist: string
    cover: string
    tracks: string[]
}

const USE_BACKEND = true

const HomeView = ({ query, setAlbum }: { query?: string, setAlbum: (a: Album) => void }) => {
    const findAlbums = async () => {
        if (USE_BACKEND) {
            // TODO: Local caching.
            const url = 'https://api.github.com/search/repositories?q=topic:alternator-album' + (query ? "%20" + query : "")
            const response = await fetch(url, {
                headers: { Accept: "application/vnd.github.v3+json" }
            })
            const results = await response.json()
            console.log("Found:", results.items.map((result: any) => result.full_name))
            const albums = []
            // TODO: Use `Promise.all`.
            for (const { full_name, default_branch } of results.items) {
                const url = `https://raw.githubusercontent.com/${full_name}/${default_branch}`
                const response = await fetch(`${url}/album.json`)
                const info = await response.json()
                console.log(info)
                albums.push({ url, ...info })
            }
            setAlbums(albums)
        } else {
            const albums = [
                {
                    url: "https://raw.githubusercontent.com/ijc8/example-album/main",
                    title: "Example Album",
                    artist: "ijc8",
                    cover: "cover.svg",
                    tracks: [],
                },
                {
                    url: "https://raw.githubusercontent.com/ijc8/demo-reel/main",
                    title: "Offline Mode",
                    artist: "ijc8",
                    cover: "album_art.svg",
                    tracks: [],
                },
            ].filter(a => query === undefined || a.title.toLowerCase().includes(query.toLowerCase()))
            setAlbums(albums)
        }
    }

    useEffect(() => {
        findAlbums()
    }, [query])

    const [albums, setAlbums] = useState<Album[]>()

    return <div className="p-6 md:pt-12 md:pl-16 flex-grow bg-gray-800">
        <h1 className="text-3xl hidden md:block">{query ? <>Search results for <i>{query}</i></> : "Home"}</h1>
        <div className="flex flex-col items-center md:flex-row">
            {albums
                ? albums.map(album =>
                    <div key={album.url} className="hover:bg-gray-600 p-4 cursor-pointer">
                        <div className="w-60 h-60 border" onClick={() => setAlbum(album)}>
                            <img src={`${album.url}/${album.cover}`} alt="Album cover art" />
                        </div>
                        <div className="font-semibold mt-1">{album.title}</div>
                        <div className="text-gray-400 -mt-1">{album.artist}</div>
                    </div>)
                : "Loading"}
        </div>
    </div>
}

const AlbumView = ({ state, setState, album, tracks }: {
    state: PlayState | null, setState: (s: PlayState) => void, album: Album, tracks?: Track[]
}) => {
    return <>
        <div className="flex flex-col items-center py-3 md:pt-20 md:pl-16 md:pb-6 md:flex-row md:items-end bg-green-900">
            <div className="w-60 h-60 border md:mr-8">
                <img src={`${album.url}/${album.cover}`} alt="Album cover art" />
            </div>
            <div className="flex flex-col items-start mt-3">
                <h1 className="font-semibold text-3xl md:text-5xl">{album.title}</h1>
                <h2>Ian Clester</h2>
            </div>
        </div>
        <div className="md:p-16 pt-4 flex-grow bg-gray-800">
            <div className="flex flex-col">
                <div className="flex text-gray-400 px-4">
                    <div className="w-10 hidden md:block">#</div>
                    <div className="flex-grow">Title</div>
                    {/* <div className="w-1/4">Album</div> */}
                    <div className="w-20 text-right">Duration</div>
                    <div className="w-10">{/* View Source / Mobile Menu */}</div>
                </div>
                <div className="col-span-full border-b border-gray-700 mb-2"></div>
                {tracks === undefined
                    ? <div className="m-auto"><LoadAnimation /></div>
                    : tracks.map((track, i) => <Track
                        key={i} index={i} track={track}
                        status={state && state.track === track ? state.status : null}
                        setPlaying={(playing: boolean) => {
                            setState({
                                track,
                                status: playing ? "play" : "pause",
                            })
                        }
                        } />)}
            </div>
        </div>
    </>
}

const App = () => {
    const [state, _setState] = useState<PlayState | null>(null)
    const [tracks, setTracks] = useState<Track[]>()
    const [album, setAlbum] = useState<Album>()
    const [query, setQuery] = useState<string>()

    const setState = async (newState: PlayState) => {
        if (state?.track !== newState.track) {
            _setState({ track: newState.track, status: "setup" })
            const end = (await play(newState.track)).end
            _setState({ track: newState.track, status: "play" });
            await end
            _setState(null)
        } else {
            webWorker.postMessage(newState.status === "play")
            _setState(newState)
        }
    }

    const fetchAlbum = async (url: string) => {
        const album = await (await fetch(`${url}/album.json`)).json()
        console.log("Got album info:", album)
        album.url = url
        setAlbum(album)
        const tracks = []
        for (const name of album.tracks) {
            const track = await (await fetch(`${url}/${name}/track.json`)).json()
            track.name = name
            track.url = `${url}/${name}`
            if (track.duration === undefined || track.duration === null) {
                track.duration = Infinity
            }
            tracks.push(track)
        }
        setTracks(tracks)
    }

    return <div className="flex flex-col text-white min-h-full max-h-full justify-end">
        <div className="flex flex-col md:flex-row flex-grow min-h-0">
            <Navbar
                isHome={album === undefined}
                goHome={() => { setAlbum(undefined); setQuery(undefined) }}
                search={(q: string) => { setAlbum(undefined); setQuery(q) }}
                fetchAlbum={fetchAlbum}
            />
            <main className="flex-grow flex flex-col overflow-y-auto">
                {album === undefined
                    ? <HomeView query={query} setAlbum={album => fetchAlbum(album.url)} />
                    : <AlbumView state={state} setState={setState} album={album} tracks={tracks} />}
            </main>
        </div>
        <Controls state={state} setPlaying={(playing: boolean) => {
            setState({
                track: state!.track,
                status: playing ? "play" : "pause",
            })
        }} reset={async () => {
            _setState({ track: state!.track, status: "setup" })
            // TODO: Consistent method of resetting.
            let end
            if (state!.track.url.split("/").pop()!.startsWith("pd")) {
                end = (await play(state!.track)).end
            } else {
                end = (await reset()).end
            }
            _setState({ track: state!.track, status: "play" })
            await end
            _setState(null)
        }} />
    </div>
}

export default App
