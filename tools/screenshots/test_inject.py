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
