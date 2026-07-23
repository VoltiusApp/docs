#!/usr/bin/env bash
# Orchestrate the docs screenshot pipeline: capture (in the tauri-headless container)
# -> frame (Pillow) -> inject (into the docs). Run with the container up:
#
#   ./tools/screenshots/run.sh                       # all shots in shots.json
#   ./tools/screenshots/run.sh tour-window           # a subset, by id
#
# Precondition: the tauri-headless + ssh-host-1 containers are running
# (cd ../voltius && docker compose -f compose.headless.yml up -d), and `uv` is on PATH.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
CONTENT="$REPO/docs"
ASSETS="$CONTENT/assets/screenshots"
MANIFEST="$HERE/shots.json"
CONTAINER="tauri-headless"
IDS=("$@")

echo "==> capture (container: $CONTAINER)"
docker cp "$MANIFEST" "$CONTAINER:/tmp/shots.json"
docker cp "$HERE/capture.mjs" "$CONTAINER:/tmp/capture.mjs"
docker exec "$CONTAINER" node /tmp/capture.mjs /tmp/shots.json "${IDS[@]+"${IDS[@]}"}"
mkdir -p "$HERE/raw"
docker cp "$CONTAINER:/app/screenshots/raw/." "$HERE/raw/"

echo "==> frame"
mkdir -p "$ASSETS"
uv run --with pillow python "$HERE/_frame_all.py" "$MANIFEST" "$HERE/raw" "$ASSETS" "${IDS[@]+"${IDS[@]}"}"

echo "==> inject"
python3 "$HERE/inject.py" "$CONTENT" "$MANIFEST" "${IDS[@]+"${IDS[@]}"}"

echo "==> done"
