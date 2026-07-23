# Voltius docs screenshots — design

**Date:** 2026-07-23
**Status:** Approved (pilot)
**Topic:** A repeatable pipeline that captures the real Voltius app headless, frames each
capture in a Termius-style brand gradient, and injects the result into the docs where
`> Screenshot placeholder — …` markers already sit.

## Goal

The docs (`docs/`, Zensical / MkDocs-Material) contain **46 placeholder markers** across
40 pages, each a blockquote of the form:

```markdown
> Screenshot placeholder — <precise description of the wanted shot>.
```

Replace these with clean, professional screenshots of the real app: cropped where
relevant, floated as a window (rounded corners + soft shadow) over a subtle Voltius-brand
gradient — the look of <https://docs.termius.com/>.

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Deliverable | Committed, repeatable pipeline (not a one-off image batch) |
| Theme | **Dark only** — one image per shot, self-contained, shows on any docs theme |
| Framing | Brand gradient + floating window (rounded + soft drop shadow) |
| First scope | **Pilot**: Getting Started + Tour, then expand section by section |

## Existing stack (reused, not rebuilt)

- `../voltius/Dockerfile.tauri-headless` + `../voltius/compose.headless.yml` — a running
  `tauri-headless` container (Xvfb + WebKit + `tauri-driver` on port 4444) with the dev
  (debug) app, plus a throwaway `ssh-host-1` (user `voltius` / pass `voltius`) to connect
  and SFTP against. **Both containers are already up.**
- `tauri-docker` MCP (`docker exec -i tauri-headless npx -y github:VoltiusApp/mcp-tauri-automation`)
  — **connected**; exposes `launch_app`, `capture_screenshot`, `click_element`,
  `type_text`, `press_key`, `wait_for_element`, `get_app_state`, `execute_tauri_command`.
  Used **interactively** to discover the click-path for each shot.
- `../voltius/wd.mjs` — a minimal W3C WebDriver client against tauri-driver, run **inside**
  the container. The deterministic `capture.mjs` runner extends this pattern.
- App renders its **own custom titlebar** (Vaults/SFTP tabs + window controls), so raw
  captures already include clean app chrome — no OS window frame needed.
- Raw captures are currently 1200×800 webview PNGs in `../voltius/screenshots/`.

## Brand palette (for the gradient)

- Cyan `#57c7d8` (docs `--md-primary-fg-color`)
- Deep navy `#0b1f24` (docs `--md-primary-bg-color`)
- Logo cyan `#64F5FC`

Gradient: subtle diagonal from `#0b1f24` to a faintly cyan-lifted navy. Low contrast — the
app window is the subject, the gradient is atmosphere.

## Architecture (Approach A)

Everything lives in the **docs repo**; the container is only a capture engine reached via
`docker exec` / `docker cp`. No changes to the voltius repo or its compose file.

```
docs/tools/screenshots/
  shots.json        # THE manifest — one entry per placeholder shot
  capture.mjs       # runs INSIDE tauri-headless: seed state -> resize -> dismiss banner -> capture raw
  frame.py          # raw PNG (+crop/annotations) -> framed PNG (gradient + rounded + shadow)
  inject.py         # swap "> Screenshot placeholder — X" -> figure markdown
  run.sh            # orchestrator: docker cp capture.mjs in -> run -> cp raws back -> frame -> inject
  raw/              # intermediate raw captures pulled back from the container (gitignored)
docs/docs/assets/screenshots/<id>.png   # committed final framed images
```

### Components (each independently testable)

**1. Manifest — `shots.json`.** Single source of truth. One entry per shot:

```json
{
  "id": "tour-window",
  "page": "getting-started/tour.md",
  "match": "annotated full window",
  "steps": [{ "goto": "home" }, { "dismissBanner": true }],
  "crop": null,
  "annotate": [{ "n": 1, "at": [40, 20], "label": "Title bar" }],
  "alt": "The Voltius main window",
  "caption": "The four regions of the window."
}
```

- `page` — path under `docs/docs/`.
- `match` — a substring of the placeholder's description, used to locate the exact
  blockquote to replace (handles pages with multiple placeholders).
- `steps` — ordered capture actions consumed by `capture.mjs`.
- `crop` — `null` (full window) or `[x, y, w, h]` in raw-capture pixels.
- `annotate` — optional numbered callout pins (for "annotated" shots).
- `alt` / `caption` — accessibility + figure caption.

**2. Capture — `capture.mjs`.** Runs inside the container against tauri-driver. Extends
`wd.mjs`. Responsibilities:
- Launch the app (`/app/target/debug/voltius`) or reuse a session.
- **Set window rect** to capture at **2×** (~2400×1600) for retina-crisp docs images.
- Reusable step verbs: `goto` (navigate a route/tab), `click`, `type`, `press`,
  `waitFor`, and `dismissBanner` (clicks the test-email banner's × so it never appears).
- Write raw PNG to `/app/screenshots/raw/<id>.png`.

Selectors/click-paths per shot are **discovered interactively via the `tauri-docker` MCP**,
then baked into the manifest `steps` so the runner is deterministic and re-runnable.

**3. Framing — `frame.py`** (run via `uv run --with pillow`, no committed dep). Per shot:
crop → round corners → soft drop shadow → composite onto the diagonal brand gradient with
even padding. Optional numbered callout pins + legend for `annotate` shots. Output
~1600px wide (displayed ≤880px in docs). Gradient baked in → self-contained image, correct
on light and dark docs pages.

**4. Injection — `inject.py`.** For each manifest entry, find the placeholder blockquote in
`page` by `match` and replace it with:

```markdown
![<alt>](../assets/screenshots/<id>.png){ .voltius-shot }
/// caption
<caption>
///
```

`pymdownx.blocks.caption` is already enabled. Idempotent: only replaces placeholders still
present, so it is safe to re-run as the UI evolves. A `.voltius-shot` rule (max-width +
centering) is added to `docs/docs/stylesheets/extra.css`.

**5. Orchestrator — `run.sh`.** With the container up:
`cd docs && ./tools/screenshots/run.sh [ids…]`
→ `docker cp capture.mjs` into the container → run capture for the requested ids (all if
none given) → `docker cp` raws back to `tools/screenshots/raw/` → `frame.py` → `inject.py`.

## Pilot scope — Getting Started + Tour

| Shot id | Page | Placeholder |
| --- | --- | --- |
| `tour-window` | `getting-started/tour.md` | annotated full window (numbered callouts) |
| `first-connection-hosts` | `getting-started/first-connection.md` (line 7) | empty Hosts page with **Add host** highlighted |
| `first-connection-terminal` | `getting-started/first-connection.md` (line 32) | first terminal session |

`getting-started/index.md` has no placeholder — the pilot is exactly these three app shots.

**Out of scope for the app-capture pipeline:** `getting-started/install.md` — "download
picker" is the website/download page, not the app UI. Its placeholder is left untouched and
flagged for a separate web capture later.

## Cross-cutting handling

- **Test banner:** every shot runs `dismissBanner` first (the "Verify your email …
  e2e-sync-35@test.invalid" banner is a test artifact and must never appear in docs).
- **Data realism:** the pilot uses the existing single host (`ssh-host-1`) and the
  connect/terminal flow. Richer seeding (folders, tags, multiple hosts, snippets, port
  forwards) is deferred to the sections that need it.
- **Resolution:** capture at 2× via window resize; frame to ~1600px; docs cap display width.

## Re-run story

`cd docs && ./tools/screenshots/run.sh` (bare = all shots) or with explicit ids for a
subset. Requires the `tauri-headless` container running and `tauri-docker` MCP available for
discovery of any *new* shots.

## Non-goals

- Light-theme or theme-aware images (dark only, by decision).
- Website / marketing-page captures (install download picker, web portal) — separate effort.
- Changing the voltius repo, its Dockerfile, or compose file.
