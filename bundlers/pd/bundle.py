import json
import os
import sys
import tarfile

if len(sys.argv) < 2:
    exit(f"Usage: {sys.argv[0]} pathA [pathB ...]")

files = []
position = 0

with open("bundle.data", "wb") as bundle:
    def add(path):
        global position
        start = position
        with open(path, "rb") as file:
            position += bundle.write(file.read())
        files.append({
            "filename": os.path.join("/", path),
            "start": start,
            "end": position,
        })

    for path in sys.argv[1:]:
        if os.path.isdir(path):
            for dirname, _, filenames in os.walk(path):
                for filename in filenames:
                    add(os.path.join(path, filename))
        else:
            add(os.path.join(path))

with open("bundle.js.metadata", "w") as metadata:
    json.dump({
        "files": files,
        "remote_package_size": position,
    }, metadata, separators=(",",":"))

with tarfile.open("bundle.tar.xz", "w:xz") as archive:
    archive.add("main.js")
    archive.add("main.wasm")
    archive.add("bundle.data")
    archive.add("bundle.js.metadata")
