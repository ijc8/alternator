importScripts("//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/highlight.min.js")

self.onmessage = (event) => {
    console.log("Got", event.data)
    const result = hljs.highlightAuto(event.data)
    self.postMessage({ language: result.language, value: result.value })
}
