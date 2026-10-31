// The hero: pixelfx's rigged 24x38 character, posed every frame and recolored as a hooded mage,
// with a hat and staff drawn on top. Status effects (burning, frozen, electrified...) are painted on the
// standing body and carried onto the pose, the same way pixelfx's own act player does it.
import { posed, STAND, lerpPose } from "../../vendor/pixelfx/src/core/act.js";
import { skeleton } from "../../vendor/pixelfx/src/core/rig.js";
import { stockActor, HERO2, DUMMY_PAL, actorAlphaOf } from "../../vendor/pixelfx/src/core/actor.js";
import { hex, mix } from "../../vendor/pixelfx/src/core/color.js";
import { createFrame, clearFrame, painterFor } from "../../vendor/pixelfx/src/core/fx.js";

const RW = 24, RH = 38;
const INK = hex("#17121f");
const RAMPS = {
  hood: ["#c48ae6", "#9a62c8", "#7442a4", "#522c7e", "#361c58"].map(hex),
  skin: ["#ffe2c4", "#f6c6a0", "#dda07c", "#b67858", "#8a5640"].map(hex),
  robe: ["#7fd8cf", "#3fa8ab", "#2a7d8c", "#1d576c", "#143b4d"].map(hex),
  trim: ["#ffe8a0", "#f5c84a", "#d49a26", "#9a6a14", "#6a460c"].map(hex),
  legs: ["#76769a", "#55557a", "#40405e", "#2e2e46", "#202034"].map(hex),
  boot: ["#c08050", "#9a5c38", "#784226", "#552e1a", "#3a1e12"].map(hex),
};
const SHADE = {};
for (const [ch, v] of Object.entries(DUMMY_PAL)) SHADE[hex(v) >>> 0] = { A: 0, B: 1, C: 2, D: 3, E: 2, F: 3, G: 4, J: 4, k: -1, m: -2 }[ch];

// which part of the outfit each pixel of the standing sprite belongs to
const REGION = new Array(RW * RH).fill("robe");
for (let r = 0; r < RH; r++)
  for (let c = 0; c < RW; c++) {
    let g = "robe";
    if (r <= 2) g = "hood";
    else if (r <= 6) g = c >= 12 && r >= 3 ? "skin" : "hood";
    else if (r <= 8) g = "trim"; // collar
    else if (r >= 19 && r <= 21 && c >= 5 && c <= 8) g = "skin"; // hand at rest
    else if (r === 22 || r === 23) g = "trim"; // belt line
    else if (r >= 28 && r <= 34) g = "legs";
    else if (r >= 35) g = "boot";
    REGION[r * RW + c] = g;
  }
const EYE = new Set([3 * RW + 13]);

/** A dummy-colored pixel at standing-sprite cell s, in the mage's colors. */
function recolor(c, s) {
  const sh = SHADE[c >>> 0];
  if (sh === -1 || sh === undefined) return c === 0 ? 0 : sh === -1 ? INK : c;
  if (s >= 0 && EYE.has(s)) return INK;
  if (sh === -2) return RAMPS.trim[1];
  const g = s >= 0 ? REGION[s] : "robe";
  return RAMPS[g][Math.min(4, sh)];
}

// the standing mage, as an actor any pixelfx effect can take (o.actor)
const base = stockActor(2);
const restPx = new Uint32Array(RW * RH);
HERO2.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== ".") restPx[r * RW + c] = recolor(hex(DUMMY_PAL[ch]), r * RW + c); }));
export const MAGE = { ...base, pixels: restPx };

// every standing cell mapped to the nearest cell on the body (as pixelfx's act.js does)
const REST_MASK = new Uint8Array(RW * RH);
HERO2.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== ".") REST_MASK[r * RW + c] = 1; }));
const NEAREST = new Int16Array(RW * RH).fill(-1);
for (let r = 0; r < RH; r++)
  for (let c = 0; c < RW; c++) {
    let best = -1, bd = 1e9;
    for (let y = Math.max(0, r - 7); y < Math.min(RH, r + 8); y++)
      for (let x = Math.max(0, c - 7); x < Math.min(RW, c + 8); x++) {
        const d = (x - c) * (x - c) + (y - r) * (y - r);
        if (REST_MASK[y * RW + x] && d < bd) { bd = d; best = y * RW + x; }
      }
    NEAREST[r * RW + c] = best;
  }
const lum = (c) => (0.3 * (c & 255) + 0.59 * ((c >>> 8) & 255) + 0.11 * ((c >>> 16) & 255)) / 255;
function carry(v, rest, own) {
  const lv = lum(v);
  if (lv > 0.9 || v >>> 24 < 255) return v;
  const k = Math.max(0.45, Math.min(1.5, lum(own) / Math.max(0.08, lum(rest))));
  const ch = (n) => Math.min(255, Math.round(((v >>> n) & 255) * k));
  return (255 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

// recolored pose pixels, cached per pose
const RECOLOR = new WeakMap();
function mageColors(r) {
  let out = RECOLOR.get(r);
  if (!out) {
    out = new Uint32Array(r.n);
    for (let i = 0; i < r.n; i++) out[i] = recolor(r.color[i], r.src[i] >= 0 ? NEAREST[r.src[i]] : -1);
    RECOLOR.set(r, out);
  }
  return out;
}

// ---- poses
export const POSES = {
  idle: { ...STAND, fx: 6, fy: -17, bx: -2, by: -16 },
  idle2: { ...STAND, crouch: 1, fx: 6, fy: -16, bx: -2, by: -15 },
  run: [
    { lean: 5, crouch: 2, ffx: 10, ffy: -3, fbx: -9, fby: -7, fx: -5, fy: -19, bx: 10, by: -23 },
    { lean: 5, crouch: 0, ffx: 3, ffy: -9, fbx: -1, fby: -1, fx: 2, fy: -20, bx: 3, by: -21 },
    { lean: 5, crouch: 2, ffx: -9, ffy: -7, fbx: 10, fby: -3, fx: 10, fy: -23, bx: -5, by: -19 },
    { lean: 5, crouch: 0, ffx: -1, ffy: -1, fbx: 3, fby: -9, fx: 3, fy: -21, bx: 2, by: -20 },
  ],
  rise: { lean: 1, crouch: 0, ffx: 5, ffy: -11, fbx: -5, fby: -4, fx: 8, fy: -31, bx: -7, by: -27 },
  fall: { lean: 2, crouch: 0, ffx: 7, ffy: -6, fbx: -6, fby: -9, fx: 10, fy: -26, bx: -9, by: -25 },
  cast: { lean: 4, crouch: 2, ffx: 9, ffy: -4, fbx: -8, fby: -4, fx: 16, fy: -26, bx: -5, by: -19 },
  hurt: { lean: -6, crouch: 1, ffx: 4, fbx: -6, fx: -9, fy: -31, bx: -11, by: -27 },
};
export function runPose(phase) {
  const R = POSES.run, f = ((phase % 4) + 4) % 4, i = Math.floor(f), u = f - i;
  return lerpPose(R[i], R[(i + 1) % 4], u);
}

// ---- hat and staff
const HAT = [
  "..........kk",
  "........kkHk",
  "......kkHHk.",
  ".....kHHHk..",
  "....kHHHHk..",
  "...kHHHHHk..",
  "...kHHhHHk..",
  ".kkTTTTTTTkk",
  "kTTTTTTTTTTk",
  ".kkkkkkkkkk.",
];
const HAT_PAL = { k: INK, H: RAMPS.hood[2], h: RAMPS.hood[0], T: RAMPS.trim[1] };

/**
 * Paint the hero into a frame. h: { x, y (feet, world), face: 1|-1, pose, status (a live fx made with actor: MAGE or null),
 * statusMod, gem (hex color), staffForward (bool), flash, alpha }.
 */
let scratch = null;
export function drawHero(frame, h) {
  const W = frame.w, H = frame.h, flip = h.face < 0;
  const FX = Math.round(h.x) - frame.ox, FY = Math.round(h.y) - frame.oy;
  const q = h.pose, r = posed(q), cols = mageColors(r);
  const C = frame.color, L = frame.light;
  const put = (px, py, c) => { if (px >= 0 && py >= 0 && px < W && py < H && c) C[py * W + px] = c; };
  const addLight = (px, py, col, k) => {
    if (px < 0 || py < 0 || px >= W || py >= H) return;
    const i = py * W + px, d = L[i];
    L[i] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + ((col >>> 16) & 255) * k) << 16) | (Math.min(255, ((d >>> 8) & 255) + ((col >>> 8) & 255) * k) << 8) | Math.min(255, (d & 255) + (col & 255) * k);
  };
  const sk = skeleton(q).joints;
  const J = (name) => { const j = sk[name]; return [FX + (flip ? -j[0] - 1 : j[0]), FY + j[1]]; };

  // the staff, behind the body when held at rest, in front when casting
  const [hx, hy] = J("handN");
  const gemC = hex(h.gem || "#ffd27a");
  const staff = () => {
    let dx = h.staffForward ? 1 : 0.18, dy = h.staffForward ? -0.25 : -1;
    const len = 22, back = h.staffForward ? 6 : 9, dir = flip ? -1 : 1;
    for (let s = -back; s <= len; s++) {
      const px = Math.round(hx + dir * dx * s), py = Math.round(hy + dy * s);
      put(px, py, s > len - 2 ? RAMPS.trim[1] : s % 7 === 0 ? RAMPS.boot[3] : RAMPS.boot[1]);
      put(px + (h.staffForward ? 0 : 1), py + (h.staffForward ? 1 : 0), INK);
    }
    const gx = Math.round(hx + dir * dx * (len + 2)), gy = Math.round(hy + dy * (len + 2));
    for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
      const d = Math.abs(ox) + Math.abs(oy);
      if (d <= 2) put(gx + ox, gy + oy, d === 2 ? INK : d === 0 ? 0xffffffff : gemC);
    }
    const glow = 0.5 + 0.25 * Math.sin(performance.now() / 160);
    for (let oy = -9; oy <= 9; oy++) for (let ox = -9; ox <= 9; ox++) {
      const d = Math.hypot(ox, oy);
      if (d < 9) addLight(gx + ox, gy + oy, gemC, (1 - d / 9) ** 2 * glow * 0.55);
    }
  };
  const alpha = h.alpha ?? 1;
  if (alpha <= 0) return;
  if (!h.staffForward) staff();

  const paintBody = (colorOf) => {
    for (let i = 0; i < r.n; i++) {
      const px = flip ? FX - r.xs[i] - 1 : FX + r.xs[i], py = FY + r.ys[i];
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const c = colorOf(i);
      if (c) C[py * W + px] = c;
    }
  };
  if (alpha <= 0) return;
  if (!h.status) {
    paintBody((i) => (h.flash ? 0xffffffff : cols[i]));
  } else {
    // the status effect paints the standing body in a small scratch frame around the hero
    const SW = 128, SH = 112;
    if (!scratch) scratch = { a: createFrame(SW, SH), b: createFrame(SW, SH) };
    const A = scratch.a, B = scratch.b;
    for (const f of [A, B]) { f.ox = frame.ox + FX - 64; f.oy = frame.oy + FY - 90; }
    clearFrame(A); clearFrame(B);
    const fx = h.status;
    fx.options.x = Math.round(h.x); fx.options.y = Math.round(h.y); fx.options.flip = flip;
    fx.draw(A, "back");
    B.color.set(A.color); B.light.set(A.light);
    const D = fx.meta.duration ?? 1, tt = fx.meta.loop ? fx.t % D : Math.min(fx.t, D);
    const aA = actorAlphaOf(h.statusMod, tt, fx.options);
    // the standing mage under the effect
    const bx0 = 64, by0 = 90;
    if (aA > 0) for (let s = 0; s < RW * RH; s++) {
      if (!restPx[s]) continue;
      const c = s % RW, rr = (s / RW) | 0, px = flip ? bx0 - (c - 12) - 1 : bx0 + c - 12, py = by0 + rr - RH;
      B.color[py * SW + px] = restPx[s];
    }
    fx.draw(B, "front");
    // back layer straight in (floor glow, smoke behind)
    const lean = q.lean ?? 0, cr = q.crouch ?? 0;
    const shiftOf = (ly) => { const k = Math.max(0, Math.min(1, (-11 - ly) / 7)); return [Math.round(lean * k), Math.round(cr * k)]; };
    const restAt = (sx, sy) => { const c = (flip ? bx0 - sx - 1 : sx - bx0) + 12, r0 = sy - by0 + RH; return c >= 0 && r0 >= 0 && c < RW && r0 < RH && REST_MASK[r0 * RW + c] === 1; };
    const copyTo = (buf, sx, sy, s, isLight) => {
      const [dx, dy] = shiftOf(sy - by0), px = FX - 64 + sx + (flip ? -dx : dx), py = FY - 90 + sy + dy;
      if (px < 0 || py < 0 || px >= W || py >= H) return;
      const i = py * W + px;
      if (isLight) { const d = buf[i]; buf[i] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + ((s >>> 16) & 255)) << 16) | (Math.min(255, ((d >>> 8) & 255) + ((s >>> 8) & 255)) << 8) | Math.min(255, (d & 255) + (s & 255)); }
      else if (s >>> 24 === 255 || !buf[i]) buf[i] = s;
      else { const k = (s >>> 24) / 255, d = buf[i]; const ch = (n) => Math.round(((s >>> n) & 255) * k + ((d >>> n) & 255) * (1 - k)); buf[i] = (Math.max(s >>> 24, d >>> 24) << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0); }
    };
    for (let sy = 0; sy < SH; sy++) for (let sx = 0; sx < SW; sx++) { const c = A.color[sy * SW + sx]; if (c) copyTo(C, sx, sy, c, false); }
    paintBody((i) => {
      if (h.flash) return 0xffffffff;
      const s = r.src[i] >= 0 ? NEAREST[r.src[i]] : -1;
      if (s < 0) return aA > 0.5 ? cols[i] : 0;
      const c = s % RW, rr = (s / RW) | 0, sx = flip ? bx0 - (c - 12) - 1 : bx0 + c - 12, sy = by0 + rr - RH;
      const v = B.color[sy * SW + sx];
      if (!v) return 0;
      return v === restPx[s] ? cols[i] : carry(v, restPx[s], cols[i]);
    });
    for (let sy = 0; sy < SH; sy++) for (let sx = 0; sx < SW; sx++) {
      const j = sy * SW + sx;
      if (B.color[j] && B.color[j] !== A.color[j] && !restAt(sx, sy)) copyTo(C, sx, sy, B.color[j], false);
      if (B.light[j] & 0xffffff) copyTo(L, sx, sy, B.light[j], true);
    }
  }

  // the hat sits on the crown, tipped with the head
  const [cx, cy] = J("crown"), [nx, ny] = J("head");
  const hatX = Math.round(cx - (flip ? 6 : 5)), hatY = Math.round(cy - 7);
  for (let y = 0; y < HAT.length; y++) for (let x = 0; x < 12; x++) {
    const ch = HAT[y][flip ? x : 11 - x]; // the tip trails behind him
    if (ch === ".") continue;
    put(hatX + x, hatY + y, h.flash ? 0xffffffff : HAT_PAL[ch]);
  }
  if (h.staffForward) staff();
}
