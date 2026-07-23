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
