import io
import json
import os
import sys
import tarfile

if len(sys.argv) < 3:
    exit(f"Usage: {sys.argv[0]} platform directory")

bundle_dir = os.path.join(os.path.dirname(sys.argv[0]), sys.argv[1])
root = sys.argv[2]

files = []
position = 0

data = io.BytesIO()

def add(path):
    relpath = os.path.join(os.path.relpath(path, root))
    print("Bundling", relpath)

    global position
    start = position
    with open(path, "rb") as file:
        position += data.write(file.read())
    files.append({
        "filename": os.path.join("/", relpath),
        "start": start,
        "end": position,
    })

for path, _, filenames in os.walk(root):
    for filename in filenames:
        add(os.path.join(path, filename))

metadata = json.dumps({
    "files": files,
    "remote_package_size": position,
}, separators=(",",":")).encode("utf8")

with tarfile.open(os.path.basename(os.path.abspath(root)) + ".tar.xz", "w:xz") as archive:
    os.chdir(bundle_dir)
    archive.add("main.js")
    archive.add("main.wasm")
    info = tarfile.TarInfo("bundle.data")
    info.size = position
    data.seek(0)
    archive.addfile(info, data)
    info = tarfile.TarInfo("bundle.metadata")
    info.size = len(metadata)
    archive.addfile(info, io.BytesIO(metadata))
