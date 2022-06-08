import json
import os
import shutil
import sys

if len(sys.argv) < 3:
    name = os.path.basename(sys.argv[0])
    exit(f"""
{name} is a utility to bundle up your composition for Alternator.

Usage: {name} <template name> <composition directory>
Available templates: {', '.join(os.listdir(os.path.join(os.path.dirname(sys.argv[0]), "templates")))}
""".strip())

template = sys.argv[1]
template_dir = os.path.join(os.path.dirname(sys.argv[0]), "templates", template)
root = sys.argv[2]

# Check for track metadata.
track_info_path = os.path.join(root, "track.json")

try:
    with open(track_info_path) as f:
        track_info = json.load(f)
except Exception as e:
    exit(f"Failed to open {track_info_path}:\n{e.__class__.__qualname__}: {e}")

missing_fields = [field for field in ["title", "artist", "duration", "channels"] if field not in track_info]
if missing_fields:
    exit(f"Missing fields [{', '.join(missing_fields)}] in {track_info_path}.")

# Create output directory for bundle.
bundle_dir = os.path.join("bundles", os.path.basename(os.path.abspath(root)))
print("Creating output directory:", bundle_dir)
os.makedirs(bundle_dir, exist_ok=True)

# Copy over main.js (and main.wasm, if applicable) from template to bundle.
print(f"Copying main.js from {template} template.")
shutil.copy(os.path.join(template_dir, "main.js"), bundle_dir)
if os.path.exists(os.path.join(template_dir, "main.wasm")):
    print(f"Copying main.wasm from {template} template.")
    shutil.copy(os.path.join(template_dir, "main.wasm"), bundle_dir)

# Bundle up assets required by the composition.
files = []
position = 0
with open(os.path.join(bundle_dir, "bundle.data"), "wb") as bundle_data:
    for path, _, filenames in os.walk(root):
        for filename in filenames:
            if filename == "track.json" and path == root:
                continue
            path_in_bundle = os.path.abspath(os.path.join("/", os.path.relpath(path, root), filename))
            print("Bundling", path_in_bundle)

            start = position
            with open(os.path.join(path, filename), "rb") as file:
                position += bundle_data.write(file.read())
            files.append({
                "filename": path_in_bundle,
                "start": start,
                "end": position,
            })

# Finalize & save track metadata in bundle.
track_info |= {
    "files": files,
    "remote_package_size": position,
}
print("Saving finalized track.json.")
with open(os.path.join(bundle_dir, "track.json"), "w") as f:
    json.dump(track_info, f, separators=(",",":"))

print(f"Finished bundle: {bundle_dir}")
