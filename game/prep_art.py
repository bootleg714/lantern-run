# Slice and recolor the itch.io packs into Lantern Run's per-area art, written as one JSON of data URIs.
# Run with: python3 -I prep_art.py <assets dir> <out json>
import sys, io, json, base64, colorsys
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
HF = SRC / "Legacy-Fantasy_-_High_Forest_2.0" / "Legacy-Fantasy - High Forest 2.3"
GROVE = Path(__file__).resolve().parent / "art" / "grove-original.png"

def load(p):
    return np.array(Image.open(p).convert("RGBA"))

def hexes(lst):
    return np.array([[int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)] for h in lst], dtype=float)

def classify(a):
    """'grass' for the green/olive foliage pixels, 'rock' for everything else."""
    rgb = a[..., :3].astype(float) / 255
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # hue in degrees
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return (h > 50) & (h < 170) & (sat > 0.25)

def recolor(a, ramps, mask=None, keep=None):
    """Map each pixel's lightness onto the ramp for its class. ramps: {'grass': [...], 'rock': [...]}."""
    out = a.copy()
    lum = (0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]) / 255
    on = a[..., 3] > 0
    gmask = classify(a) if mask is None else mask
    for cls, sel in (("grass", gmask & on), ("rock", ~gmask & on)):
        if cls not in ramps or not sel.any():
            continue
        R = hexes(ramps[cls])
        l = lum[sel]
        lo, hi = np.percentile(l, 2), np.percentile(l, 98)
        t = np.clip((l - lo) / max(hi - lo, 1e-6), 0, 1)
        idx = np.clip(np.round(t * (len(R) - 1)).astype(int), 0, len(R) - 1)
        out[..., :3][sel] = R[idx]
    return out

def uri(arr):
    buf = io.BytesIO()
    Image.fromarray(arr.astype(np.uint8), "RGBA").save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

tiles = load(HF / "Assets" / "Tiles.png")
crop = lambda a, x0, y0, x1, y1: a[y0:y1, x0:x1].copy()

# --- ground tiles: a strip of 16-wide cells, 32 tall for tops (8px of grass rises above the surface)
def ground_strip(top_y):
    """[TL, TM1, TM2, TM3, TR] tops (16x32) then [ML, MM1, MM2, MM3, MR] fills (16x16) from the block at x=1."""
    tops = [crop(tiles, 1 + 16 * i, top_y - 8, 17 + 16 * i, top_y + 24) for i in range(5)]
    fills = [crop(tiles, 1 + 16 * i, top_y + 24 + (8 if i in (2,) else 0), 17 + 16 * i, top_y + 40 + (8 if i in (2,) else 0)) for i in range(5)]
    return tops, fills

def sheet(cells_top, cells_fill):
    s = np.zeros((48, 16 * 5, 4), dtype=np.uint8)
    for i, c in enumerate(cells_top):
        s[0:32, 16 * i:16 * i + 16] = c
    for i, c in enumerate(cells_fill):
        s[32:48, 16 * i:16 * i + 16] = c
    return s

grass_tops, grass_fills = ground_strip(18)   # grass block: surface at y = 18
rock_tops, rock_fills = ground_strip(98)     # boulder-topped block: surface at y = 98
GRASS = sheet(grass_tops, grass_fills)
ROCK = sheet(rock_tops, rock_fills)

AREA = {
    "meadow": {"ground": GRASS, "ramps": None},
    "frost": {"ground": GRASS, "ramps": {"grass": ["#3a5478", "#6a8cb4", "#a4c4e0", "#d4e8f6", "#f2faff", "#ffffff"], "rock": ["#090e1a", "#10182a", "#18233a", "#22324c", "#324866", "#4c6686"]}},
    "ember": {"ground": ROCK, "ramps": {"rock": ["#0e0808", "#1a0f0e", "#2a1814", "#3e221a", "#5a3224", "#7a4a34", "#9a6448"]}},
    "grove": {"ground": GRASS, "ramps": {"grass": ["#0a2628", "#123e3c", "#1a5c54", "#26806c", "#3aa688", "#66cca6"], "rock": ["#0c0818", "#161024", "#201834", "#2c2246", "#3c2e5e", "#523e7a"]}},
}

out = {"areas": {}, "credits": []}
for name, spec in AREA.items():
    g = spec["ground"] if spec["ramps"] is None else recolor(spec["ground"], spec["ramps"])
    if name == "ember":
        # embers glowing in the cracks of the fill cells
        rng = np.random.default_rng(3)
        fill = g[32:48]
        dark = (fill[..., 3] > 0) & (fill[..., :3].sum(-1) < 90)
        hot = dark & (rng.random(dark.shape) < 0.035)
        fill[hot, :3] = [255, 120, 40]
    out["areas"][name] = {"ground": uri(g)}

# --- log platform (48x17 in three cells), water surface
plank = crop(tiles, 81, 88, 129, 104)
out["plank"] = uri(plank)
water = crop(tiles, 96, 298, 160, 314)
out["areas"]["frost"]["water"] = uri(recolor(water, {"rock": ["#24507a", "#3a7aa8", "#62a8d4", "#9ad4f0", "#d4f2ff", "#ffffff"], "grass": ["#24507a", "#3a7aa8", "#62a8d4", "#9ad4f0", "#d4f2ff", "#ffffff"]}))

# --- bushes (124x43), recolored per area
bushes = [crop(tiles, 274, y, 398, y + 43) for y in (5, 53, 101, 149)]
BUSH_RAMPS = {
    "meadow": None,
    "frost": {"grass": ["#1a2a44", "#2e4a6c", "#5a7ea4", "#9ab8d4", "#d8eaf8", "#ffffff"], "rock": ["#101a2c", "#1e2e48", "#34506e"]},
    "ember": {"grass": ["#120808", "#1e0e0c", "#2e1610", "#401e14", "#5a2a18", "#7a3a1e"], "rock": ["#0e0606", "#1a0c0a", "#2a1410"]},
    "grove": {"grass": ["#081c22", "#0e2e34", "#164446", "#205e58", "#2e7c6c", "#44a084"], "rock": ["#080a14", "#10142a", "#1a1e3a"]},
}
for name, r in BUSH_RAMPS.items():
    out["areas"][name]["bushes"] = [uri(b if r is None else recolor(b, r)) for b in bushes]

# --- props
def prop(x0, y0, x1, y1):
    return crop(tiles, x0, y0, x1, y1)
PROPS = {
    "mushroom_a": prop(258, 243, 290, 272), "mushroom_b": prop(290, 236, 322, 272), "mushroom_c": prop(321, 251, 336, 272),
    "flower_blue": prop(259, 272, 271, 288), "lavender": prop(272, 270, 290, 304), "cattail": prop(257, 293, 272, 320),
    "lily": prop(306, 310, 334, 352), "lily2": prop(274, 315, 302, 352), "fern": prop(320, 359, 352, 384), "sprig": prop(352, 273, 368, 287),
}
out["props"] = {k: uri(v) for k, v in PROPS.items()}
glow = {"rock": ["#140a2a", "#2a1450", "#4a2a8a", "#7a52c8", "#b48cf0", "#e8d4ff"], "grass": ["#062a2a", "#0e4a44", "#1a7a6a", "#34b096", "#7ae8c8", "#d4fff0"]}
out["props"]["mushroom_glow_a"] = uri(recolor(PROPS["mushroom_a"], glow, mask=np.zeros(PROPS["mushroom_a"].shape[:2], bool)))
out["props"]["mushroom_glow_b"] = uri(recolor(PROPS["mushroom_b"], glow, mask=np.zeros(PROPS["mushroom_b"].shape[:2], bool)))
out["props"]["ice_fern"] = uri(recolor(PROPS["fern"], BUSH_RAMPS["frost"]))

# --- trees (complete pines, three sizes), per area
def tree(path, box):
    return crop(load(HF / "Trees" / path), *box)
SIZES = {"l": (3, 941, 97, 1091), "m": (2, 1089, 78, 1200)}
TREE = {
    "meadow": ("Golden-Tree.png", None),
    "frost": ("Dark-Tree.png", {"grass": ["#14223a", "#22385a", "#3e5e86", "#7a9cc0", "#c4dcf0", "#ffffff"], "rock": ["#0e1424", "#1a2438", "#2a3a54"]}),
    "ember": ("Dark-Tree.png", {"grass": ["#0c0606", "#160a08", "#22100c", "#341810", "#4a2214", "#6a2e18"], "rock": ["#0a0606", "#140a08", "#20100c"]}),
    "grove": ("Dark-Tree.png", {"grass": ["#06141a", "#0c222a", "#14363c", "#1e4e50", "#2c6a66", "#3e8a7e"], "rock": ["#080812", "#100e20", "#1a1630"]}),
}
def tint(a, hx, k):
    """Blend toward a color, keeping alpha: pushes decor back into the scene's haze."""
    out = a.copy().astype(float)
    c = np.array([int(hx[1:3], 16), int(hx[3:5], 16), int(hx[5:7], 16)], float)
    out[..., :3] = out[..., :3] * (1 - k) + c * k
    return out.astype(np.uint8)
HAZE = {"meadow": "#2a1838", "frost": "#1a2a44", "ember": "#1e0a0a", "grove": "#0e1a26"}
for name, (path, r) in TREE.items():
    out["areas"][name]["trees"] = {}
    for sz, box in SIZES.items():
        t = tree(path, box)
        t = t if r is None else recolor(t, r)
        out["areas"][name]["trees"][sz] = uri(tint(t, HAZE[name], 0.38 if name == "meadow" else 0.22))

# --- pine and mountain silhouettes for the parallax, two tones per area (far, near)
bg = load(HF / "Trees" / "Background.png")
layers = {"pines_far": crop(bg, 352, 0, 704, 256), "pines_near": crop(bg, 0, 0, 352, 256), "mountains": crop(bg, 704, 0, 896, 256)}
SIL = {
    "meadow": {"mountains": ["#2a1a3e", "#36224c"], "pines_far": ["#24163a", "#2e1d46"], "pines_near": ["#170f26", "#1e1430"]},
    "frost": {"mountains": ["#2a3e62", "#3a5278"], "pines_far": ["#203454", "#2a4266"], "pines_near": ["#142238", "#1a2c46"]},
    "ember": {"mountains": ["#3a1210", "#4c1a14"], "pines_far": ["#2a0c0c", "#361210"], "pines_near": ["#1a0808", "#220c0a"]},
    "grove": {"mountains": ["#1a2836", "#223442"], "pines_far": ["#142030", "#1a2a3a"], "pines_near": ["#0c1420", "#101a28"]},
}
for name, cols in SIL.items():
    out["areas"][name]["parallax"] = {k: uri(recolor(v, {"rock": cols[k], "grass": cols[k]})) for k, v in layers.items()}

# --- original Haunted Grove backdrop, already sized for the game
original_grove = load(GROVE)
out["areas"]["grove"]["forest"] = {"image": uri(original_grove), "w": int(original_grove.shape[1]), "h": int(original_grove.shape[0])}

out["credits"] = [
    "Tiles, props, trees: Legacy Fantasy High Forest by Anokolisa",
    "Haunted Grove backdrop: original AI-generated artwork",
]
OUT.write_text(json.dumps(out))
print("wrote", OUT, round(OUT.stat().st_size / 1024), "KB")
