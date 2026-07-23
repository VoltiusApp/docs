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
