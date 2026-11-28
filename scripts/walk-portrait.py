"""WEBSITE 28: portrait (540x960) frames for phones from the 960x540 walk, by fit and extend.

For each frame position p (a whole frame of tier 1, or p + 0.5 for tier 2):
  - zoom k(p): the landscape frame scaled to k x 540 px wide (1.4 in the locker room, 1.2 in
    the tunnel, 1.1 on the field, ramped across the boundaries), placed as a band in the middle;
  - pan x(p): where the detail is (gradient energy, column by column), smoothed over the walk and
    never moving more than 6 px a frame;
  - above and below the band, an extension by stage (weights ramped across boundaries):
      locker: mirrored, progressively blurred copies of the frame, bright lights masked first;
      tunnel: a dark ceiling from the top edge colours, a glossy floor (a faint blurred mirror over
              the bottom edge colours), a vignette;
      field:  a sky gradient from the top rows; grass by mirroring and tiling the nearest grass
              rows, with noise, never one row stretched;
  - a 24 px feathered seam and film grain matched to the frame's own;
  - fill colours from the edges averaged over neighbouring frames, so nothing flickers.

Needs Python 3 with numpy, pillow and opencv-python-headless (a virtual environment of its own).
Run from the project's folder:
  python scripts/walk-portrait.py test <out_dir>             -> 9 test frames and side by sides
  python scripts/walk-portrait.py all public/journey [80]    -> every frame, WebP at that quality
"""
import sys, os, math
import numpy as np
import cv2

SEQ = 'public/journey/seq/f{:03d}.webp'
MID = 'public/journey/mid/f{:03d}-1.webp'
W, H = 540, 960
COUNT = 381
SEAM = 24

# Stage edges (frames) and their ramps
LOCKER_END, TUNNEL_END = 70, 205
RAMP = 14


def stage_weights(p):
    """(locker, tunnel, field) weights at frame position p, ramped across boundaries."""
    def ramp(x, edge):
        return min(1.0, max(0.0, (x - (edge - RAMP / 2)) / RAMP))
    a = ramp(p, LOCKER_END)
    b = ramp(p, TUNNEL_END)
    return (1 - a, a * (1 - b), b)


def zoom(p):
    l, t, f = stage_weights(p)
    return 1.4 * l + 1.2 * t + 1.1 * f


_cache = {}


def load(p):
    key = round(p * 2) / 2
    if key in _cache:
        return _cache[key]
    i = int(math.floor(key))
    path = SEQ.format(i) if key == i else MID.format(i)
    im = cv2.imread(path, cv2.IMREAD_COLOR)
    if im is None:
        raise FileNotFoundError(path)
    im = im.astype(np.float32)
    if len(_cache) > 64:
        _cache.clear()
    _cache[key] = im
    return im


# --- the pan path ------------------------------------------------------------------------------

def interest_x(im):
    """Where the detail is, 0..1 across the frame: gradient energy by column."""
    g = cv2.cvtColor(im.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    gx = np.abs(cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3))
    gy = np.abs(cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3))
    energy = (gx + gy)[60:480].sum(axis=0)
    energy = cv2.GaussianBlur(energy.reshape(1, -1), (0, 0), 40).ravel()
    cols = np.arange(energy.size)
    return float((energy * cols).sum() / max(1e-6, energy.sum()) / energy.size)


def pan_path():
    """Crop offset (px, in the scaled frame) for every whole frame, smoothed, <= 6 px a frame."""
    raw = []
    for i in range(COUNT):
        im = cv2.resize(load(i), (480, 270))
        cx = interest_x(cv2.resize(im, (960, 540)))
        # The locker room: lean toward the side with the shirts and the board (the detail)
        raw.append(cx)
    raw = np.array(raw)
    # Heavy smoothing over the walk (about a second of scroll)
    k = 31
    padded = np.pad(raw, k, mode='edge')
    kernel = np.ones(2 * k + 1) / (2 * k + 1)
    smooth = np.convolve(padded, kernel, mode='same')[k:-k]
    offsets = []
    prev = None
    for i in range(COUNT):
        sw = zoom(i) * W
        spare = sw - W
        # Centre of interest -> left edge of the crop, clamped inside the frame
        x = smooth[i] * sw - W / 2
        x = min(spare, max(0.0, x))
        if prev is not None:
            x = min(prev + 6, max(prev - 6, x))
        offsets.append(x)
        prev = x
    return np.array(offsets)


# --- fill colours, averaged over neighbours -----------------------------------------------------

def edge_stats(p):
    """Mean colour of the band's top and bottom rows, per column (smoothed), averaged over +-8."""
    tops, bots = [], []
    for q in range(int(p) - 8, int(p) + 9, 4):
        q = min(COUNT - 1, max(0, q))
        im = load(q)
        tops.append(im[:10].mean(axis=0))
        bots.append(im[-10:].mean(axis=0))
    top = np.mean(tops, axis=0)
    bot = np.mean(bots, axis=0)
    top = cv2.GaussianBlur(top.reshape(1, -1, 3), (0, 0), 30).reshape(-1, 3)
    bot = cv2.GaussianBlur(bot.reshape(1, -1, 3), (0, 0), 30).reshape(-1, 3)
    return top, bot


def grain(shape, sigma, seed):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, sigma, shape[:2]).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), 0.6)
    return np.repeat(n[:, :, None], 3, axis=2)


def frame_grain_sigma(band):
    g = cv2.cvtColor(band.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    hp = g - cv2.GaussianBlur(g, (0, 0), 1.2)
    return float(min(6.0, max(1.5, np.std(hp) * 0.6)))


# --- the extensions ------------------------------------------------------------------------------

def mirrored(band, rows, up):
    """`rows` rows continuing the band by mirroring (and mirroring again when it runs out)."""
    h = band.shape[0]
    out = []
    flip = band[::-1]
    src = flip if up else flip
    # Tile flip/normal alternately away from the seam
    k = 0
    seq = [band[::-1], band] if True else []
    while sum(x.shape[0] for x in out) < rows:
        out.append(seq[k % 2])
        k += 1
    stack = np.concatenate(out, axis=0)[:rows]
    if up:
        # Above: the mirror of the band's top, read upward
        stack = np.concatenate(out, axis=0)[:rows][::-1]
    return stack


def mask_lights(band):
    """Bright lights (the locker room's strip lights) toned down before they are mirrored."""
    lum = band.mean(axis=2)
    mask = np.clip((lum - 200) / 40, 0, 1)
    mask = cv2.GaussianBlur(mask, (0, 0), 6)[:, :, None]
    local = cv2.GaussianBlur(band, (0, 0), 25)
    calm = np.minimum(band, local * 0.9)
    return band * (1 - mask) + calm * mask


def blur_with_distance(img, near_top):
    """Blur growing with the distance from the seam: sharp at the seam, soft far away."""
    h = img.shape[0]
    a = cv2.GaussianBlur(img, (0, 0), 3)
    b = cv2.GaussianBlur(img, (0, 0), 12)
    c = cv2.GaussianBlur(img, (0, 0), 28)
    t = np.linspace(0, 1, h).reshape(-1, 1, 1)
    if near_top:
        t = t[::-1]  # the seam is at the bottom of an area above the band
    out = np.where(t < 0.33, a * (1 - t / 0.33) + b * (t / 0.33),
                   b * (1 - (t - 0.33) / 0.67) + c * ((t - 0.33) / 0.67))
    return out


def mirror_fade(band, rows, colour, up, reach, dark_far, blur_far=34, blur_near=6):
    """`rows` rows continuing the band away from its edge: within about `reach` rows a mirror of
    the band's own edge rows, blurring more and more; beyond, the edge colour, darkening to
    `dark_far` of itself at the far end. Never content from deep inside the frame."""
    n = min(band.shape[0], reach)
    edge = band[:n] if up else band[-n:]
    mirror = edge[::-1]  # the rows nearest the seam first, read away from it (for `below`)
    if up:
        mirror = edge[::-1]  # above: row 0 of the band continues upward as its mirror
    # Away from the seam, index 0 = next to the band
    away = mirror if not up else edge[::-1][::-1][::-1]
    away = band[:n][::-1][::-1] if up else band[-n:][::-1]
    if up:
        away = band[:n]  # band rows 0..n; reading away from the seam upward = rows 0,1,2.. mirrored
    if away.shape[0] < rows:
        away = np.concatenate([away, np.repeat(away[-1:], rows - away.shape[0], axis=0)], axis=0)
    away = away[:rows]
    d = np.arange(rows, dtype=np.float32).reshape(-1, 1, 1)
    # Blur grows with the distance from the seam
    soft = cv2.GaussianBlur(away, (0, 0), blur_near)
    softer = cv2.GaussianBlur(away, (0, 0), blur_far)
    t = np.clip(d / max(1, reach), 0, 1)
    blurred = soft * (1 - t) + softer * t
    # Mirror near the seam, colour beyond
    w = np.exp(-d / (reach * 0.55))
    far = colour[None] * (1 - (1 - dark_far) * (d / max(1, rows - 1)))
    out = blurred * w + far * (1 - w)
    # Index 0 next to the seam: above, the first row is the one just over the band
    return out[::-1] if up else out


def extend_locker(band, above, below, top, bot):
    calm = mask_lights(band)
    up = mirror_fade(calm, above, top * 0.92, True, 100, 0.55)
    down = mirror_fade(calm, below, bot * 0.95, False, 160, 0.6)
    return up, down


def extend_tunnel(band, above, below, top, bot):
    up = mirror_fade(band, above, top, True, 60, 0.35)
    down = mirror_fade(band, below, bot * 0.9, False, 140, 0.45)
    return up, down


def extend_field(band, above, below, top, bot, p):
    # Sky: the top rows' colour, a little deeper blue toward the top
    t = np.linspace(1, 0, above).reshape(-1, 1, 1)
    deep = top * np.array([1.08, 0.97, 0.88])  # BGR: more blue, less red
    sky = top[None] * (1 - 0.35 * t) + deep[None] * 0.35 * t
    sky = mirror_fade(band, above, top, True, 12, 1.0) * 0 + sky
    # Grass: the nearest rows mirrored and quickly out of focus, as a lens near the ground sees it,
    # into the grass's own colour, with fine noise: no line or ball ever repeated
    # The grass's colour: its last 60 rows on average (the edge rows alone are the dark roots)
    colour = cv2.GaussianBlur(band[-60:].mean(axis=0).reshape(1, -1, 3), (0, 0), 30).reshape(-1, 3)
    grass = mirror_fade(band, below, colour * 1.02, False, 90, 0.82, blur_far=26, blur_near=2.5)
    noise = grain(grass.shape, 4, int(p * 10) + 7)
    return sky, grass + noise


def build(p, pan):
    """The portrait frame at position p (fractional for tier 2), as float BGR."""
    k = zoom(p)
    sw = int(round(k * W))
    sh = int(round(sw * 540 / 960))
    src = load(p)
    scaled = cv2.resize(src, (sw, sh), interpolation=cv2.INTER_AREA)
    x0 = int(round(np.interp(p, np.arange(COUNT), pan)))
    band = scaled[:, x0:x0 + W]
    # The band a little above the middle: more ground than sky reads as walking
    top_y = int(round((H - sh) * 0.46))
    above, below = top_y, H - top_y - sh

    # Fill colours of the band's edges, in the band's crop, averaged over neighbours
    top_full, bot_full = edge_stats(p)
    top = cv2.resize(top_full.reshape(1, -1, 3), (sw, 1)).reshape(-1, 3)[x0:x0 + W]
    bot = cv2.resize(bot_full.reshape(1, -1, 3), (sw, 1)).reshape(-1, 3)[x0:x0 + W]

    wl, wt, wf = stage_weights(p)
    ups, downs = [], []
    if wl > 0:
        u, d = extend_locker(band, above, below, top, bot)
        ups.append((wl, u)); downs.append((wl, d))
    if wt > 0:
        u, d = extend_tunnel(band, above, below, top, bot)
        ups.append((wt, u)); downs.append((wt, d))
    if wf > 0:
        u, d = extend_field(band, above, below, top, bot, p)
        ups.append((wf, u)); downs.append((wf, d))
    up = sum(w * a for w, a in ups)
    down = sum(w * a for w, a in downs)

    out = np.zeros((H, W, 3), np.float32)
    out[:above] = up
    out[above + sh:] = down
    out[above:above + sh] = band
    # A 24 px feathered seam: the band's edge rows blend into the extension
    for edge, direction in ((above, 1), (above + sh, -1)):
        seam = int(round(SEAM * (1 + wf))) if direction == -1 else SEAM
        for r in range(seam):
            y = edge + r * direction if direction == 1 else edge - 1 - r
            a = (r + 0.5) / seam
            ext = up[-1] if direction == 1 else down[0]
            out[y] = out[y] * a + ext * (1 - a)
    # Grain on the extensions, matched to the frame's own
    sigma = frame_grain_sigma(band)
    g = grain((H, W, 3), sigma, int(p * 2) + 1)
    mask = np.ones((H, 1, 1), np.float32)
    mask[above + SEAM:above + sh - SEAM] = 0
    out = out + g * mask
    # Vignette in the tunnel
    if wt > 0:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
        vig = 1 - wt * 0.35 * np.clip(r - 0.55, 0, 1) ** 1.2
        out = out * vig[:, :, None]
    return np.clip(out, 0, 255).astype(np.uint8)


def centre_crop(p):
    """What a phone showed before: the 960x540 frame covering 540x960 (a centre strip)."""
    src = load(p)
    sh = H
    sw = int(round(960 * H / 540))
    big = cv2.resize(src, (sw, sh), interpolation=cv2.INTER_CUBIC)
    x0 = (sw - W) // 2
    return np.clip(big[:, x0:x0 + W], 0, 255).astype(np.uint8)


if __name__ == '__main__':
    mode = sys.argv[1]
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    pan = pan_path()
    if mode == 'test':
        picks = {'locker': [10, 35, 58], 'tunnel': [100, 150, 190], 'field': [230, 300, 370]}
        for stage, ps in picks.items():
            row = []
            for p in ps:
                new = build(p, pan)
                cv2.imwrite(os.path.join(out, f'{stage}-{p:03d}.png'), new)
                old = centre_crop(p)
                pair = np.concatenate([old, np.full((H, 12, 3), 255, np.uint8), new], axis=1)
                cv2.putText(pair, 'before: centre strip', (16, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 220, 255), 2)
                cv2.putText(pair, 'new: fit and extend', (W + 28, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 220, 255), 2)
                cv2.imwrite(os.path.join(out, f'pair-{stage}-{p:03d}.jpg'), pair, [cv2.IMWRITE_JPEG_QUALITY, 88])
                row.append(new)
            sheet = np.concatenate([np.pad(r, ((0, 0), (0, 8), (0, 0)), constant_values=255) for r in row], axis=1)
            cv2.imwrite(os.path.join(out, f'sheet-{stage}.jpg'), sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])
        print('pan range', pan.min(), pan.max(), 'max step', np.abs(np.diff(pan)).max())
    if mode == 'all':
        # Every frame (tier 1) and every in-between (tier 2), as WebP, quality from argv[3]
        from PIL import Image
        quality = int(sys.argv[3]) if len(sys.argv) > 3 else 80
        seq = os.path.join(out, 'portrait')
        mid = os.path.join(out, 'portrait-mid')
        os.makedirs(seq, exist_ok=True)
        os.makedirs(mid, exist_ok=True)
        total = [0, 0]
        for i in range(COUNT):
            for half in ((0,) if i == COUNT - 1 else (0, 1)):
                p = i + 0.5 * half
                img = build(p, pan)
                path = os.path.join(seq, f'f{i:03d}.webp') if half == 0 else os.path.join(mid, f'f{i:03d}-1.webp')
                Image.fromarray(img[:, :, ::-1]).save(path, 'WEBP', quality=quality, method=6)
                total[half] += os.path.getsize(path)
            if i % 20 == 0:
                print(i, f'tier1 {total[0]/1e6:.2f} MB tier2 {total[1]/1e6:.2f} MB', flush=True)
        print('done', f'tier1 {total[0]/1e6:.2f} MB tier2 {total[1]/1e6:.2f} MB')
