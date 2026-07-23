"""Frame every (or the requested) manifest shot: raw/<id>.png -> assets/<id>.png.

Invoked by run.sh via `uv run --with pillow python _frame_all.py <manifest> <raw_dir> <out_dir> [ids...]`.
Lives beside frame.py so `import frame` resolves to the sibling module.
"""
import json
import sys
from pathlib import Path

import frame

manifest, raw_dir, out_dir, *ids = sys.argv[1:]
shots = json.loads(Path(manifest).read_text())
raw_dir, out_dir = Path(raw_dir), Path(out_dir)
out_dir.mkdir(parents=True, exist_ok=True)

for s in shots:
    if ids and s["id"] not in ids:
        continue
    raw = raw_dir / f'{s["id"]}.png'
    if not raw.exists():
        print(f'MISSING raw for {s["id"]}, skipping')
        continue
    crop = tuple(s["crop"]) if s.get("crop") else None
    frame.frame_image(str(raw), str(out_dir / f'{s["id"]}.png'),
                      crop=crop, annotate=s.get("annotate"))
    print(f'framed {s["id"]}')
