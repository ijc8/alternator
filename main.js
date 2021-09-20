// Create Web Worker to run Python code in a separate thread.
const pyodideWorker = new Worker('aleatora_worker.js')

const audioContext = new AudioContext()

async function main() {
    try {
        await new Promise(resolve => pyodideWorker.onmessage = resolve)
    } catch (err) {
        codebox.runButton.classList.add("error")
        return
    }
    codebox.runButton.classList.remove("loading")
    codebox.runButton.disabled = false
    pyodideWorker.onmessage = handleMessageFromWorker
    resumeContextOnInteraction()
}

function resumeContextOnInteraction() {
    // from https://github.com/captbaritone/winamp2-js/blob/a5a76f554c369637431fe809d16f3f7e06a21969/js/media/index.js#L8-L27
    if (audioContext.state === "suspended") {
        const resume = async () => {
            await audioContext.resume()
            if (audioContext.state === "running") {
                document.body.removeEventListener("touchend", resume, false)
                document.body.removeEventListener("click", resume, false)
                document.body.removeEventListener("keydown", resume, false)
            }
            setupAudio()
        }
        document.body.addEventListener("touchend", resume, false)
        document.body.addEventListener("click", resume, false)
        document.body.addEventListener("keydown", resume, false)
    } else {
        setupAudio()
    }
}

const blockSize = 1024
const buffers = [new Float32Array(blockSize), new Float32Array(blockSize)]
const promises = [null, null]
let audioBuffers
let nextBufferTime

let i = 0

async function swapBuffers(buffer) {
    await promises[1-i]
    pyodideWorker.postMessage(buffers[1-i], [buffers[1-i].buffer])
    buffers[i] = buffer
    audioBuffers[i].copyToChannel(buffer, 0)
    const source = new AudioBufferSourceNode(audioContext, { buffer: audioBuffers[i] })
    source.connect(audioContext.destination)
    source.start(nextBufferTime)
    promises[i] = new Promise(resolve => (source.onended = () => resolve()))
    nextBufferTime += blockSize / audioContext.sampleRate
    i = 1 - i
}

async function setupAudio() {
    await audioContext.resume()
    // TODO: Set Aleatora's SAMPLE_RATE to audioContext.sampleRate.
    console.log("Sample rate", audioContext.sampleRate)
    audioBuffers = [
        audioContext.createBuffer(1, blockSize, audioContext.sampleRate),
        audioContext.createBuffer(1, blockSize, audioContext.sampleRate)
    ]
    nextBufferTime = audioContext.currentTime
    swapBuffers(buffers[i])
}

let workerResolve = () => {}

function handleMessageFromWorker(e) {
    if (e.data.output) {
        const pre = document.createElement("pre")
        pre.textContent = e.data.output
        codebox.output.appendChild(pre)
    } else if (e.data.url) {
        const el = document.createElement(e.data.type)
        el.src = e.data.url
        if (e.data.type === "audio") {
            el.controls = true
        }
        for (const [attr, value] of e.data.attrs ?? []) {
            el[attr] = value
        }
        codebox.output.appendChild(el)
    } else if (e.data instanceof Float32Array) {
        swapBuffers(e.data)
    } else {
        workerResolve(e.data)
    }
}

async function runScript(script) {
    const result = await new Promise((resolve, reject) => {
        pyodideWorker.onerror = reject
        workerResolve = resolve
        pyodideWorker.postMessage(script)
    })
    return result
}

class CodeBox {
    constructor(container) {
        const editorContainer = document.createElement("div")
        container.prepend(editorContainer)
        this.editor = ace.edit(editorContainer, {
            maxLines: 30,
        });
        this.editor.setTheme("ace/theme/chrome");
        this.editor.session.setMode("ace/mode/python");
        this.editor.commands.addCommand({
            name: "run",
            bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
            exec: () => this.run(),
        })

        this.runButton = container.querySelector("button.run")
        this.runButton.classList.add("loading")
        this.runButton.disabled = true
        this.runButton.onclick = () => this.run()

        this.playing = true
        this.playButton = container.querySelector("button.play")
        this.playButton.classList.add("playing")
        this.playButton.onclick = () => this.togglePlay()

        this.output = document.createElement("div")
        this.output.classList.add("output")
        container.appendChild(this.output)
    }

    async run() {
        // Don't change the button state unless the computation takes at least 30ms.
        this.runButton.disabled = true
        const timer = setTimeout(() => this.runButton.classList.add("running"), 30)
        this.output.innerText = ""
        await runScript(this.editor.getValue())
        clearTimeout(timer)
        this.runButton.classList.remove("running")
        this.runButton.disabled = false
    }

    togglePlay() {
        this.playing = !this.playing
        if (this.playing) {
            this.playButton.classList.add("playing")
            pyodideWorker.postMessage({ command: "play" })
        } else {
            this.playButton.classList.remove("playing")
            pyodideWorker.postMessage({ command: "pause" })
        }
    }
}

let selected = 0
const sessions = []

const tabContainer = document.getElementById("tabs")
document.querySelectorAll(".preset").forEach((el, i) => {
    const button = document.createElement("button")
    button.innerText = el.id
    tabContainer.appendChild(button)
    button.onclick = () => selectTab(i)
    sessions.push(ace.createEditSession(el.textContent.trim(), "ace/mode/python"))
    el.hidden = true
})

function selectTab(index) {
    document.querySelectorAll("#tabs button").forEach((el, i) => {
        if (i === index) {
            el.classList.add("active")
        } else {
            el.classList.remove("active")
        }
    })
    sessions[selected] = codebox.editor.getSession()
    codebox.editor.setSession(sessions[index])
    selected = index
}

const codebox = new CodeBox(document.querySelector(".runnable"))
codebox.editor.setSession(sessions[0])

selectTab(0)

main()
