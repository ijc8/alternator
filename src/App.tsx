import React from 'react'
import logo from './logo.svg'
import './App.css'

const songs = [
    {
        title: "Tone",
        album: "Tones (Deluxe Set): 20-20000 Hz",
        duration: "0:05",
    }
]

function App() {
    return <div className="flex flex-row text-white">
        <header className="App-header min-h-screen w-56 bg-black">
            <div className="flex flex-row">
                <div className="glitch flex-grow relative top-6" id="logo">
                    {[...new Array(5)].map(_ => <div>Alternator</div>)}
                </div>
            </div>
        </header>
        <main className="flex-grow flex flex-col">
            <div className="pt-20 pl-16 pb-6 flex flex-row items-end bg-gray-800">
                <div className="w-60 h-60 border mr-8">
                    Album image goes here!
                </div>
                <div className="flex flex-col items-start">
                    <h1>Example album/playlist thing</h1>
                    <h2>Ian Clester</h2>
                </div>
            </div>
            <div className="pl-16 pt-4 flex-grow bg-gray-900">
                <div className="grid grid-cols-4">
                    <div>#</div>
                    <div>Title</div>
                    <div>Album</div>
                    <div>Duration</div>
                    {songs.map(({ title, album, duration }, i) => <>
                        <div>{i + 1}</div>
                        <div>{title}</div>
                        <div>{album}</div>
                        <div>{duration}</div>
                    </>)}
                </div>
            </div>
        </main>
    </div>
}

export default App;
