# Docs screenshot pipeline

Captures the real Voltius app headless, frames it (brand gradient + floating window),
and injects the images into the docs where `> Screenshot placeholder — …` markers sit.

## Prerequisites
- The `tauri-headless` and `ssh-host-1` containers running
  (`cd ../voltius && docker compose -f compose.headless.yml up -d`).
- `uv` on PATH (for Pillow via `uv run --with pillow`).

## Run
    ./tools/screenshots/run.sh            # all shots in shots.json
    ./tools/screenshots/run.sh tour-window first-connection-hosts   # subset by id

## Files
- `shots.json` — manifest, one entry per shot. Single source of truth.
- `capture.mjs` — runs INSIDE the container: seed state, dismiss test banner, capture raw PNG.
- `frame.py` — raw PNG (+crop/annotations) -> framed PNG.
- `inject.py` — swap placeholder blockquote -> figure markdown.
- `run.sh` — orchestrator.
- `raw/` — intermediate captures pulled from the container (gitignored).
