# Voltius Doc Screenshots Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a committed, repeatable pipeline that captures the real Voltius desktop app headless, frames each capture as a floating window over a Voltius-brand gradient, and injects the result into the docs where `> Screenshot placeholder — …` markers sit — then run it end-to-end on the 3-shot Getting-Started/Tour pilot.

**Architecture:** Everything lives in the **docs repo** under `tools/screenshots/`. A running `tauri-headless` Docker container (Xvfb + WebKit + `tauri-driver`) is used only as a capture engine, reached via `docker cp`/`docker exec`. A JSON manifest is the single source of truth: `capture.mjs` (runs inside the container) produces raw PNGs → `frame.py` (Pillow, host-side) beautifies them → `inject.py` (host-side) swaps the placeholder blockquotes for figure markdown. `run.sh` orchestrates.

**Tech Stack:** Node.js (`capture.mjs`, W3C WebDriver against tauri-driver:4444), Python + Pillow via `uv run --with pillow` (`frame.py`, `inject.py`), Bash (`run.sh`), Docker (`tauri-headless` + `ssh-host-1`, already running), Zensical/MkDocs-Material docs.

## Global Constraints

- **Docs repo root:** `/home/ubuntu/fourretout/voltius-dev/docs`. All repo-relative paths below are from here.
- **Content dir:** `docs/` (so `docs/getting-started/tour.md`). Manifest `page` values are relative to this content dir.
- **Committed final images:** `docs/assets/screenshots/<id>.png`.
- **Do NOT modify the voltius repo, its Dockerfile, or compose file.** Container is a black-box capture engine.
- **No new committed Python deps:** run Pillow via `uv run --with pillow python …` (never `uv add`).
- **Theme:** dark only. One self-contained image per shot (gradient baked in).
- **Brand palette:** cyan `#57c7d8` = `(87,199,216)`; deep navy `#0b1f24` = `(11,31,36)`; lifted navy `(18,46,54)`; logo cyan `#64F5FC`.
- **Container name:** `tauri-headless`. App binary inside: `/app/target/debug/voltius`. tauri-driver on `localhost:4444` inside the container. Raw captures written to `/app/screenshots/raw/<id>.png` inside the container.
- **Test-banner rule:** the "Verify your email … e2e-sync-35@test.invalid" banner is a test artifact and must never appear in a shot — every capture dismisses it first.
- **Caption syntax:** `pymdownx.blocks.caption` is enabled — captions use the `/// caption … ///` block immediately after the image.
- **Branch:** work on `docs-screenshots` (already checked out).

---

### Task 1: Scaffold — directories, manifest, gitignore, CSS

Creates the pipeline skeleton and the manifest with the 3 pilot entries (everything except the capture `steps`, which are discovered live in Task 4).

**Files:**
- Create: `tools/screenshots/shots.json`
- Create: `tools/screenshots/README.md`
- Create: `docs/assets/screenshots/.gitkeep`
- Modify: `.gitignore` (append `tools/screenshots/raw/`)
- Modify: `docs/stylesheets/extra.css` (append `.voltius-shot` rule)

**Interfaces:**
- Produces: `shots.json` — a JSON array of shot objects with keys `id` (string), `page` (string, relative to content dir), `match` (string, substring of the placeholder description), `steps` (array — empty for now), `crop` (`null` or `[x,y,w,h]`), `annotate` (`null` or `[{n,at:[x,y],label}]`), `alt` (string), `caption` (string). Consumed by `capture.mjs`, `frame.py`, `inject.py`.

- [ ] **Step 1: Create the manifest with the 3 pilot shots**

Create `tools/screenshots/shots.json`:

```json
[
  {
    "id": "tour-window",
    "page": "getting-started/tour.md",
    "match": "annotated full window",
    "steps": [],
    "crop": null,
    "annotate": [
      { "n": 1, "at": [120, 22], "label": "Title bar + omnibar" },
      { "n": 2, "at": [120, 70], "label": "Top NavBar" },
      { "n": 3, "at": [35, 300], "label": "Vault sidebar" },
      { "n": 4, "at": [600, 300], "label": "Main panel" }
    ],
    "alt": "The Voltius main window with its four regions",
    "caption": "The four regions of the window: title bar, NavBar, vault sidebar, and main panel."
  },
  {
    "id": "first-connection-hosts",
    "page": "getting-started/first-connection.md",
    "match": "empty Hosts page",
    "steps": [],
    "crop": null,
    "annotate": null,
    "alt": "The Hosts page with the Add host button",
    "caption": "The Hosts page — click Add host to create your first connection."
  },
  {
    "id": "first-connection-terminal",
    "page": "getting-started/first-connection.md",
    "match": "first terminal session",
    "steps": [],
    "crop": null,
    "annotate": null,
    "alt": "A live SSH terminal session in Voltius",
    "caption": "Your first terminal session, connected over SSH."
  }
]
```

- [ ] **Step 2: Create the raw-capture ignore + assets keep file**

```bash
cd /home/ubuntu/fourretout/voltius-dev/docs
printf '\n# Screenshot pipeline intermediates\ntools/screenshots/raw/\n' >> .gitignore
mkdir -p docs/assets/screenshots && touch docs/assets/screenshots/.gitkeep
mkdir -p tools/screenshots/raw
```

- [ ] **Step 3: Add the `.voltius-shot` CSS rule**

Append to `docs/stylesheets/extra.css`:

```css

/* Framed documentation screenshots (see tools/screenshots/) */
.voltius-shot {
  display: block;
  max-width: 880px;
  width: 100%;
  height: auto;
  margin: 1.2rem auto;
  border-radius: 8px;
}
```

- [ ] **Step 4: Write the pipeline README**

Create `tools/screenshots/README.md`:

```markdown
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
```

- [ ] **Step 5: Verify JSON is valid and commit**

Run:
```bash
cd /home/ubuntu/fourretout/voltius-dev/docs
python3 -c "import json;print(len(json.load(open('tools/screenshots/shots.json'))),'shots OK')"
```
Expected: `3 shots OK`

```bash
git add tools/screenshots/shots.json tools/screenshots/README.md docs/assets/screenshots/.gitkeep docs/stylesheets/extra.css .gitignore
git commit -m "docs(screenshots): scaffold pipeline (manifest, dirs, css)"
```

---

### Task 2: `frame.py` — the beautifier (host-side, TDD)

Turns a raw capture into the framed image: crop → rounded corners → soft drop shadow → composite on the brand gradient, with optional numbered callout pins + legend.

**Files:**
- Create: `tools/screenshots/frame.py`
- Test: `tools/screenshots/test_frame.py`

**Interfaces:**
- Produces: `frame_image(raw_path: str, out_path: str, crop=None, annotate=None, target_w: int | None = 1600) -> None` — writes an opaque RGB PNG to `out_path`. `crop` is `None` or `(x,y,w,h)`. `annotate` is `None` or a list of `{"n": int, "at": [x,y], "label": str}` in cropped-image pixel coordinates. `target_w=None` skips the final rescale (used by tests to inspect exact geometry).
- Produces: `PAD_RATIO = 0.09`, `ACCENT = (87,199,216)` module constants (consumed by tests).

- [ ] **Step 1: Write the failing tests**

Create `tools/screenshots/test_frame.py`:

```python
import os, tempfile
from PIL import Image
import frame


def _raw(path, color, size=(400, 300)):
    Image.new("RGB", size, color).save(path)


def test_output_is_padded_and_opaque():
    with tempfile.TemporaryDirectory() as d:
        raw = os.path.join(d, "r.png"); out = os.path.join(d, "o.png")
        _raw(raw, (200, 40, 40))                      # red window
        frame.frame_image(raw, out, target_w=None)
        img = Image.open(out)
        assert img.mode == "RGB"                      # opaque, gradient-backed
        # extreme corner is gradient (navy-ish), NOT the red window
        r, g, b = img.getpixel((2, 2))
        assert r < 60 and b > g >= 20                 # navy family, not red
        # center is the red window
        cr, cg, cb = img.getpixel((img.width // 2, img.height // 2))
        assert cr > 150 and cg < 90


def test_crop_selects_region():
    with tempfile.TemporaryDirectory() as d:
        raw = os.path.join(d, "r.png"); out = os.path.join(d, "o.png")
        img = Image.new("RGB", (400, 300), (200, 40, 40))
        for x in range(200, 400):                     # right half green
            for y in range(300):
                img.putpixel((x, y), (40, 200, 40))
        img.save(raw)
        frame.frame_image(raw, out, crop=(200, 0, 200, 300), target_w=None)
        o = Image.open(out)
        cr, cg, cb = o.getpixel((o.width // 2, o.height // 2))
        assert cg > 150 and cr < 90                    # center is green now


def test_rounded_corner_is_background():
    with tempfile.TemporaryDirectory() as d:
        raw = os.path.join(d, "r.png"); out = os.path.join(d, "o.png")
        _raw(raw, (200, 40, 40), size=(400, 300))
        frame.frame_image(raw, out, target_w=None)
        o = Image.open(out)
        pad = int(400 * frame.PAD_RATIO)
        # pixel at the very top-left corner of the window box is rounded away -> gradient
        r, g, b = o.getpixel((pad + 1, pad + 1))
        assert not (r > 150 and g < 90)


def test_annotate_draws_accent_pin():
    with tempfile.TemporaryDirectory() as d:
        raw = os.path.join(d, "r.png"); out_plain = os.path.join(d, "p.png"); out_ann = os.path.join(d, "a.png")
        _raw(raw, (200, 40, 40))
        frame.frame_image(raw, out_plain, target_w=None)
        frame.frame_image(raw, out_ann, annotate=[{"n": 1, "at": [120, 22], "label": "X"}], target_w=None)
        assert list(Image.open(out_plain).getdata()) != list(Image.open(out_ann).getdata())
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
cd /home/ubuntu/fourretout/voltius-dev/docs/tools/screenshots
uv run --with pillow python -m pytest test_frame.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'frame'` (or `AttributeError`).

- [ ] **Step 3: Implement `frame.py`**

Create `tools/screenshots/frame.py`:

```python
"""Beautify a raw app capture: crop -> rounded window -> shadow -> brand gradient."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont

NAVY = (11, 31, 36)        # #0b1f24
LIFT = (18, 46, 54)        # faintly cyan-lifted navy
ACCENT = (87, 199, 216)    # #57c7d8
PAD_RATIO = 0.09


def _gradient(w, h):
    """Vertical navy->lift gradient with a faint top-left accent glow."""
    col = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        col.putpixel((0, y), tuple(int(NAVY[i] + (LIFT[i] - NAVY[i]) * t) for i in range(3)))
    bg = col.resize((w, h)).convert("RGBA")
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    rr = int(min(w, h) * 0.9)
    gd.ellipse([-rr // 2, -rr // 2, rr, rr], fill=ACCENT + (26,))
    glow = glow.filter(ImageFilter.GaussianBlur(rr // 6))
    return Image.alpha_composite(bg, glow)


def _rounded(img, radius):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, img.size[0] - 1, img.size[1] - 1], radius=radius, fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def _font(size):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _annotate(canvas, offset, annotate):
    ox, oy = offset
    d = ImageDraw.Draw(canvas)
    r = 15
    fnt = _font(20)
    for a in annotate:
        x, y = a["at"]
        cx, cy = ox + x, oy + y
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ACCENT + (255,))
        d.text((cx, cy), str(a["n"]), fill=(6, 18, 22, 255), anchor="mm", font=fnt)
    # legend, bottom-left
    lf = _font(18)
    lx, ly = int(canvas.width * 0.03), int(canvas.height * 0.97)
    for a in reversed(annotate):
        txt = f'{a["n"]}. {a["label"]}'
        d.text((lx, ly), txt, fill=(210, 225, 228, 255), anchor="ls", font=lf)
        ly -= 26


def frame_image(raw_path, out_path, crop=None, annotate=None, target_w=1600):
    shot = Image.open(raw_path).convert("RGBA")
    if crop:
        x, y, w, h = crop
        shot = shot.crop((x, y, x + w, y + h))
    pad = int(shot.width * PAD_RATIO)
    radius = max(10, int(shot.width * 0.013))
    win = _rounded(shot, radius)

    cw, ch = shot.width + pad * 2, shot.height + pad * 2
    canvas = _gradient(cw, ch)

    shadow = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    shaped = Image.new("RGBA", win.size, (0, 0, 0, 0))
    shaped.paste(Image.new("RGBA", win.size, (0, 0, 0, 150)), (0, 0), win)
    shadow.paste(shaped, (pad, pad + int(pad * 0.18)), shaped)
    shadow = shadow.filter(ImageFilter.GaussianBlur(int(pad * 0.4)))
    canvas = Image.alpha_composite(canvas, shadow)

    canvas.paste(win, (pad, pad), win)

    if annotate:
        _annotate(canvas, (pad, pad), annotate)

    if target_w and canvas.width != target_w:
        ratio = target_w / canvas.width
        canvas = canvas.resize((target_w, int(canvas.height * ratio)), Image.LANCZOS)

    canvas.convert("RGB").save(out_path)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
cd /home/ubuntu/fourretout/voltius-dev/docs/tools/screenshots
uv run --with pillow python -m pytest test_frame.py -v
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
cd /home/ubuntu/fourretout/voltius-dev/docs
git add tools/screenshots/frame.py tools/screenshots/test_frame.py
git commit -m "docs(screenshots): add Pillow framer (gradient + window + annotations)"
```

---

### Task 3: `inject.py` — placeholder → figure markdown (host-side, TDD)

Replaces a `> Screenshot placeholder — …` blockquote with the figure markdown. Idempotent, and computes the correct relative image path from the page's depth.

**Files:**
- Create: `tools/screenshots/inject.py`
- Test: `tools/screenshots/test_inject.py`

**Interfaces:**
- Consumes: `shots.json` entries (`id`, `page`, `match`, `alt`, `caption`).
- Produces: `image_rel_path(page: str, shot_id: str) -> str` — e.g. `("getting-started/tour.md","tour-window") -> "../assets/screenshots/tour-window.png"`.
- Produces: `inject_text(md: str, entry: dict) -> str` — returns md with the matching placeholder blockquote replaced; unchanged if no match (idempotent).
- Produces: CLI `python inject.py <content_dir> <shots.json> [ids…]` — edits files in place.

- [ ] **Step 1: Write the failing tests**

Create `tools/screenshots/test_inject.py`:

```python
import inject

ENTRY = {
    "id": "tour-window",
    "page": "getting-started/tour.md",
    "match": "annotated full window",
    "alt": "The Voltius main window",
    "caption": "The four regions.",
}

MD = (
    "# Tour\n\n"
    "> Screenshot placeholder — annotated full window with title bar, NavBar.\n\n"
    "Four regions:\n"
)


def test_rel_path_one_level():
    assert inject.image_rel_path("getting-started/tour.md", "tour-window") == \
        "../assets/screenshots/tour-window.png"


def test_rel_path_two_levels():
    assert inject.image_rel_path("a/b/c.md", "x") == "../../assets/screenshots/x.png"


def test_inject_replaces_placeholder():
    out = inject.inject_text(MD, ENTRY)
    assert "Screenshot placeholder" not in out
    assert "![The Voltius main window](../assets/screenshots/tour-window.png){ .voltius-shot }" in out
    assert "/// caption\nThe four regions.\n///" in out
    assert "Four regions:" in out                      # surrounding content preserved


def test_inject_is_idempotent():
    once = inject.inject_text(MD, ENTRY)
    twice = inject.inject_text(once, ENTRY)
    assert once == twice


def test_inject_no_match_returns_unchanged():
    other = dict(ENTRY, match="nonexistent description")
    assert inject.inject_text(MD, other) == MD
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
cd /home/ubuntu/fourretout/voltius-dev/docs/tools/screenshots
python3 -m pytest test_inject.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'inject'`.

- [ ] **Step 3: Implement `inject.py`**

Create `tools/screenshots/inject.py`:

```python
"""Replace `> Screenshot placeholder — …` blockquotes with figure markdown."""
import json
import re
import sys
from pathlib import Path


def image_rel_path(page: str, shot_id: str) -> str:
    depth = page.count("/")               # pages are content-dir-relative
    return "../" * depth + f"assets/screenshots/{shot_id}.png"


def _figure(entry: dict) -> str:
    rel = image_rel_path(entry["page"], entry["id"])
    return (
        f'![{entry["alt"]}]({rel}){{ .voltius-shot }}\n'
        f'/// caption\n{entry["caption"]}\n///'
    )


def inject_text(md: str, entry: dict) -> str:
    # Match a single-line placeholder blockquote containing the `match` substring.
    pattern = re.compile(
        r'^> Screenshot placeholder —[^\n]*' + re.escape(entry["match"]) + r'[^\n]*$',
        re.MULTILINE,
    )
    if not pattern.search(md):
        return md
    return pattern.sub(lambda _: _figure(entry), md, count=1)


def main(argv):
    content_dir, manifest = Path(argv[0]), Path(argv[1])
    ids = set(argv[2:])
    shots = json.loads(manifest.read_text())
    changed = 0
    for entry in shots:
        if ids and entry["id"] not in ids:
            continue
        page = content_dir / entry["page"]
        text = page.read_text()
        new = inject_text(text, entry)
        if new != text:
            page.write_text(new)
            changed += 1
            print(f"injected {entry['id']} -> {entry['page']}")
        else:
            print(f"skip {entry['id']} (no matching placeholder)")
    print(f"{changed} file(s) updated")


if __name__ == "__main__":
    main(sys.argv[1:])
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
cd /home/ubuntu/fourretout/voltius-dev/docs/tools/screenshots
python3 -m pytest test_inject.py -v
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
cd /home/ubuntu/fourretout/voltius-dev/docs
git add tools/screenshots/inject.py tools/screenshots/test_inject.py
git commit -m "docs(screenshots): add idempotent placeholder->figure injector"
```

---

### Task 4: `capture.mjs` — discover click-paths, capture raws (needs container)

Extends the `wd.mjs` pattern into a manifest-driven runner that runs **inside** the `tauri-headless` container. Because the exact routes/selectors are only knowable from the live app, this task first **discovers** them via the `tauri-docker` MCP, records them into `shots.json` `steps`, then implements the runner that replays them.

**Files:**
- Create: `tools/screenshots/capture.mjs`
- Modify: `tools/screenshots/shots.json` (fill in `steps` for the 3 shots)

**Interfaces:**
- Consumes: `shots.json` (`id`, `steps`, plus reads nothing else). App at `/app/target/debug/voltius`, tauri-driver at `http://localhost:4444`.
- Produces: raw PNGs at `/app/screenshots/raw/<id>.png` inside the container.
- Step verbs (the vocabulary `steps` may use): `{"dismissBanner": true}`, `{"click": "<css>"}`, `{"type": ["<css>", "<text>"]}`, `{"press": "<key>"}`, `{"waitFor": "<css>"}`, `{"waitMs": <int>}`, `{"eval": "<js>"}`.

- [ ] **Step 1: Confirm the capture environment is live**

Run:
```bash
docker ps --format '{{.Names}}' | grep -E 'tauri-headless|ssh-host-1'
docker exec tauri-headless sh -c 'ls /app/target/debug/voltius && curl -sf localhost:4444/status >/dev/null && echo DRIVER_OK'
```
Expected: both container names printed, then `DRIVER_OK`. If the app binary or driver is missing, start/rebuild via `cd ../voltius && docker compose -f compose.headless.yml up -d` and wait for the tauri-driver line in `docker compose -f compose.headless.yml logs tauri-headless`.

- [ ] **Step 2: Discover routes/selectors live via the `tauri-docker` MCP**

Using the `tauri-docker` MCP tools (`launch_app` with `appPath=/app/target/debug/voltius`, then `capture_screenshot`, `get_app_state`, `click_element`, `execute_tauri_command`), determine and **write down**:

1. **Banner dismiss selector** — the `×` on the "Verify your email …" banner. Inspect the DOM (`get_app_state` / a `document.querySelectorAll` eval) to find its stable selector (e.g. a button with an aria-label or a known class). Record as the `dismissBanner` implementation selector (Step 3 hardcodes it).
2. **`tour-window`** — the default home view already shows all four regions; steps are just `dismissBanner` + a settle wait. Confirm the four `annotate.at` coordinates land on the right regions in the captured raw; adjust the coordinates in `shots.json` if needed.
3. **`first-connection-hosts`** — the click-path from launch to the **Hosts** page showing the **Add host** control. The current Personal vault may already contain `ssh-host-1`; for a clean "empty Hosts" shot, either switch to / create an empty vault or capture the Hosts view where **Add host** is prominent. Record the exact clicks.
4. **`first-connection-terminal`** — the click-path to an open terminal session against `ssh-host-1` (add/connect host `ssh-host-1:2222`, user `voltius`, password `voltius`; approve fingerprint if prompted; wait for the prompt to render). Record the exact clicks/types/waits.

Write the discovered sequences into `shots.json` `steps`. Example shape (values are placeholders for the real selectors you discover):

```json
"steps": [
  { "dismissBanner": true },
  { "click": "[data-testid='nav-hosts']" },
  { "waitFor": "[data-testid='add-host']" },
  { "waitMs": 400 }
]
```

- [ ] **Step 3: Implement `capture.mjs`**

Create `tools/screenshots/capture.mjs`. It reads `shots.json` from its own directory, opens one WebDriver session, and for each requested id resets to a clean launch, replays `steps`, and screenshots to `/app/screenshots/raw/<id>.png`. (Runs inside the container, where `shots.json` is copied alongside it by `run.sh`.)

```js
// Manifest-driven capture runner. Runs INSIDE tauri-headless against tauri-driver:4444.
// Usage: node capture.mjs <shots.json> [id ...]
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const BASE = 'http://localhost:4444';
const APP = '/app/target/debug/voltius';
const OUT = '/app/screenshots/raw';
const BANNER_CLOSE = "[aria-label='Dismiss'], .announce button, button[title='Dismiss']"; // set from Task 4 Step 2

const [manifestPath, ...ids] = process.argv.slice(2);
const shots = JSON.parse(readFileSync(manifestPath, 'utf8'))
  .filter(s => ids.length === 0 || ids.includes(s.id));

async function http(method, path, body) {
  const r = await fetch(BASE + path, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { raw: t }; }
}

let sid;
async function newSession() {
  const r = await http('POST', '/session', {
    capabilities: { alwaysMatch: { 'tauri:options': { application: APP } } },
  });
  sid = r.value && r.value.sessionId;
  if (!sid) throw new Error('no session: ' + JSON.stringify(r).slice(0, 300));
  await http('POST', `/session/${sid}/timeouts`, { implicit: 6000 });
  // Best-effort: enlarge the window for crisper captures (ignored if unsupported).
  await http('POST', `/session/${sid}/window/rect`, { width: 1600, height: 1060 });
}
async function endSession() { if (sid) await http('DELETE', `/session/${sid}`); sid = null; }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function evalJs(script, args = []) {
  const r = await http('POST', `/session/${sid}/execute/sync`, { script, args });
  return r && ('value' in r ? r.value : r);
}
async function clickCss(sel) {
  // DOM-event click (dodges WebKitGTK dropped-click on ripple mutation), per wd.mjs.
  return evalJs(`
    var el=document.querySelector(arguments[0]); if(!el) return 'NOEL';
    el.scrollIntoView({block:'center',inline:'center'});
    var r=el.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(t){
      el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,clientX:cx,clientY:cy,button:0}));
    }); return 'OK';`, [sel]);
}
async function waitFor(sel, ms = 6000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await evalJs(`return !!document.querySelector(arguments[0]);`, [sel])) return true;
    await sleep(150);
  }
  throw new Error('waitFor timeout: ' + sel);
}
async function typeInto(sel, text) {
  await evalJs(`
    var el=document.querySelector(arguments[0]); if(!el) return 'NOEL';
    var set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    el.focus(); set.call(el, arguments[1]);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true})); return 'OK';`, [sel, text]);
}
async function pressKey(key) {
  await http('POST', `/session/${sid}/actions`, {
    actions: [{ type: 'key', id: 'kb', actions: [
      { type: 'keyDown', value: key }, { type: 'keyUp', value: key }]}],
  });
}
async function dismissBanner() {
  await evalJs(`
    var sels=${JSON.stringify(BANNER_CLOSE)}.split(',');
    for (var i=0;i<sels.length;i++){var el=document.querySelector(sels[i].trim());
      if(el){el.click();return 'CLOSED';}} return 'NONE';`);
}

async function runStep(step) {
  if (step.dismissBanner) return dismissBanner();
  if (step.click) return clickCss(step.click);
  if (step.type) return typeInto(step.type[0], step.type[1]);
  if (step.press) return pressKey(step.press);
  if (step.waitFor) return waitFor(step.waitFor);
  if (step.waitMs != null) return sleep(step.waitMs);
  if (step.eval) return evalJs(step.eval);
  throw new Error('unknown step: ' + JSON.stringify(step));
}

async function capture(shot) {
  await newSession();
  await sleep(1200);                                   // splash settle
  for (const step of shot.steps) await runStep(step);
  await sleep(400);
  const r = await http('GET', `/session/${sid}/screenshot`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${shot.id}.png`, r.value, 'base64');
  console.log('SHOT ' + shot.id);
  await endSession();
}

for (const shot of shots) {
  try { await capture(shot); }
  catch (e) { console.error('FAIL ' + shot.id + ': ' + e.message); await endSession(); process.exitCode = 1; }
}
```

- [ ] **Step 4: Capture the 3 raws and eyeball them**

Run (this is what `run.sh` will wrap; run it manually here to validate):
```bash
docker cp tools/screenshots/shots.json tauri-headless:/tmp/shots.json
docker cp tools/screenshots/capture.mjs tauri-headless:/tmp/capture.mjs
docker exec tauri-headless node /tmp/capture.mjs /tmp/shots.json
docker cp tauri-headless:/app/screenshots/raw/. tools/screenshots/raw/
ls -l tools/screenshots/raw/*.png
```
Expected: `SHOT tour-window`, `SHOT first-connection-hosts`, `SHOT first-connection-terminal`; three PNGs pulled back. **Open each raw PNG and confirm:** no test banner, the intended screen is shown, terminal shows a live prompt. If a shot is wrong, refine its `steps` in `shots.json` and re-run this step.

- [ ] **Step 5: Commit**

```bash
cd /home/ubuntu/fourretout/voltius-dev/docs
git add tools/screenshots/capture.mjs tools/screenshots/shots.json
git commit -m "docs(screenshots): add capture runner + discovered steps for pilot"
```

---

### Task 5: `run.sh` orchestrator + end-to-end pilot + visual review

Wires capture → frame → inject into one command, runs the full pilot, visually reviews the framed images, and commits the final images + injected docs.

**Files:**
- Create: `tools/screenshots/run.sh`

**Interfaces:**
- Consumes: `shots.json`, `capture.mjs`, `frame.py`, `inject.py`; the running `tauri-headless` container.
- Produces: framed PNGs in `docs/assets/screenshots/<id>.png`; injected figure markdown in the target pages.

- [ ] **Step 1: Implement `run.sh`**

Create `tools/screenshots/run.sh`:

```bash
#!/usr/bin/env bash
# Orchestrate: capture (in container) -> frame -> inject. Run from the docs repo root
# or anywhere; paths resolve relative to this script.
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
docker exec "$CONTAINER" node /tmp/capture.mjs /tmp/shots.json "${IDS[@]}"
mkdir -p "$HERE/raw"
docker cp "$CONTAINER:/app/screenshots/raw/." "$HERE/raw/"

echo "==> frame"
mkdir -p "$ASSETS"
uv run --with pillow python "$HERE/_frame_all.py" "$MANIFEST" "$HERE/raw" "$ASSETS" "${IDS[@]}"

echo "==> inject"
python3 "$HERE/inject.py" "$CONTENT" "$MANIFEST" "${IDS[@]}"

echo "==> done"
```

`_frame_all.py` (created in Step 2) is invoked as a script; because it lives in `$HERE`, `import frame` resolves to the sibling `frame.py`.

- [ ] **Step 2: Add the frame-all driver used by `run.sh`**

Create `tools/screenshots/_frame_all.py`:

```python
"""Frame every (or the requested) manifest shot: raw/<id>.png -> assets/<id>.png."""
import json, sys
from pathlib import Path
import frame

manifest, raw_dir, out_dir, *ids = sys.argv[1:]
shots = json.loads(Path(manifest).read_text())
raw_dir, out_dir = Path(raw_dir), Path(out_dir)
for s in shots:
    if ids and s["id"] not in ids:
        continue
    raw = raw_dir / f'{s["id"]}.png'
    if not raw.exists():
        print(f'MISSING raw for {s["id"]}, skipping'); continue
    crop = tuple(s["crop"]) if s.get("crop") else None
    frame.frame_image(str(raw), str(out_dir / f'{s["id"]}.png'),
                      crop=crop, annotate=s.get("annotate"))
    print(f'framed {s["id"]}')
```

- [ ] **Step 3: Make it executable and run the full pilot**

Run:
```bash
cd /home/ubuntu/fourretout/voltius-dev/docs
chmod +x tools/screenshots/run.sh
./tools/screenshots/run.sh
ls -l docs/assets/screenshots/*.png
git status --short docs/getting-started/
```
Expected: `capture` → `frame` → `inject` sections print without error; three framed PNGs in `docs/assets/screenshots/`; `first-connection.md` and `tour.md` show as modified.

- [ ] **Step 4: Visually review the 3 framed images**

Open each of `docs/assets/screenshots/tour-window.png`, `first-connection-hosts.png`, `first-connection-terminal.png` and confirm: brand gradient background, rounded window with soft shadow, no test banner, crisp text, and (for `tour-window`) the four numbered pins land on the right regions with a readable legend. If framing constants need tuning, adjust `PAD_RATIO`/`radius`/shadow in `frame.py` and re-run `./tools/screenshots/run.sh <id>`.

- [ ] **Step 5: Verify the injected markdown renders**

Run:
```bash
cd /home/ubuntu/fourretout/voltius-dev/docs
grep -n 'voltius-shot\|/// caption\|Screenshot placeholder' docs/getting-started/first-connection.md docs/getting-started/tour.md
```
Expected: each figure present with `{ .voltius-shot }` and a `/// caption … ///` block; **no** remaining `Screenshot placeholder` lines in `tour.md`, and only the two intended ones replaced in `first-connection.md`. (`install.md`'s placeholder is intentionally untouched.)

- [ ] **Step 6: Commit the pipeline glue + pilot output**

```bash
cd /home/ubuntu/fourretout/voltius-dev/docs
git add tools/screenshots/run.sh tools/screenshots/_frame_all.py \
        docs/assets/screenshots/tour-window.png \
        docs/assets/screenshots/first-connection-hosts.png \
        docs/assets/screenshots/first-connection-terminal.png \
        docs/getting-started/first-connection.md docs/getting-started/tour.md
git commit -m "docs(screenshots): orchestrator + pilot images for getting-started"
```

---

## Self-Review

**Spec coverage:**
- Committed repeatable pipeline → Tasks 1-5 (all under `tools/screenshots/`, re-runnable via `run.sh`). ✓
- Dark-only, self-contained images → `frame.py` bakes the gradient; no theme-aware CSS. ✓
- Brand gradient + floating window (rounded + shadow) → `frame.py` `_gradient`/`_rounded`/shadow. ✓
- Maps onto existing placeholders → `inject.py` matches `> Screenshot placeholder — …` by substring. ✓
- Pilot = 3 exact shots (tour-window, first-connection-hosts, first-connection-terminal) → `shots.json`. ✓
- `install.md` out of scope → no manifest entry; Task 5 Step 5 asserts it stays untouched. ✓
- Test-banner suppression → `dismissBanner` step, run first; Task 4 discovers the selector. ✓
- 2× capture → `capture.mjs` sets window rect 1600×1060 (best-effort). ✓
- No voltius-repo changes → only `docker cp`/`docker exec`; container is a black box. ✓
- No committed Python deps → Pillow via `uv run --with pillow`. ✓
- Annotated tour shot → `annotate` in manifest + `_annotate` in `frame.py`. ✓

**Placeholder scan:** No TBD/TODO in steps. The manifest's empty `steps` arrays are deliberately populated by real discovery in Task 4 (not a plan placeholder — it's a runtime artifact that cannot be known without the live app). `BANNER_CLOSE` in `capture.mjs` is a best-guess default explicitly finalized in Task 4 Step 2.

**Type consistency:** `frame_image(raw_path, out_path, crop, annotate, target_w)` — signature identical in Task 2 definition, `test_frame.py`, and `_frame_all.py`. `inject_text(md, entry)` / `image_rel_path(page, shot_id)` — identical across `inject.py`, `test_inject.py`. Manifest keys (`id`, `page`, `match`, `steps`, `crop`, `annotate`, `alt`, `caption`) — consistent across `capture.mjs`, `inject.py`, `_frame_all.py`. Step-verb keys (`dismissBanner`, `click`, `type`, `press`, `waitFor`, `waitMs`, `eval`) — defined in Task 4 Interfaces and handled 1:1 in `runStep`. ✓
