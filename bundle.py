import io
import json
import os
import sys
import tarfile

if len(sys.argv) < 3:
    exit(f"Usage: {sys.argv[0]} platform directory")

bundle_dir = os.path.join(os.path.dirname(sys.argv[0]), "templates", sys.argv[1])
root = sys.argv[2]

track_info_path = os.path.join(root, "track.json")

try:
    with open(track_info_path) as f:
        track_info = json.load(f)
except Exception as e:
    exit(f"Failed to open {track_info_path}:\n{e.__class__.__qualname__}: {e}")

missing_fields = [field for field in ["title", "artist", "duration", "channels"] if field not in track_info]
if missing_fields:
    exit(f"Missing fields [{', '.join(missing_fields)}] in {track_info_path}.")

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
        if not (filename == "track.json" and path == root):
            add(os.path.join(path, filename))

metadata = json.dumps(track_info | {
    "files": files,
    "remote_package_size": position,
}, separators=(",",":")).encode("utf8")

with tarfile.open(os.path.basename(os.path.abspath(root)) + ".tar.xz", "w:xz") as archive:
    os.chdir(bundle_dir)
    archive.add("main.js")
    if os.path.exists("main.wasm"):
        archive.add("main.wasm")
    info = tarfile.TarInfo("bundle.data")
    info.size = position
    data.seek(0)
    archive.addfile(info, data)
    info = tarfile.TarInfo("track.json")
    info.size = len(metadata)
    archive.addfile(info, io.BytesIO(metadata))
