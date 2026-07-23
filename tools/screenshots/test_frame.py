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
