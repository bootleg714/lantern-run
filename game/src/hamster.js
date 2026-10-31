// A short, round hamster hero, built from shapes and shaded per pixel so every pose stays consistent.
// Frames are 32x28 with the feet at (16, 27). Three outfits share one body.

const FW = 32, FH = 28, FOOT_X = 16, FOOT_Y = 27;

const hexToRGBA = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
};

export const LOOKS = {
  lantern: {
    name: "Pip, the lantern keeper",
    fur: ["#5a2c12", "#9a521e", "#d07a2c", "#eea250", "#ffc77a"],
    cream: ["#c9a882", "#ead2b0", "#fff3df"],
    pink: "#f29a9a", ink: "#2a160e",
    gear: "lantern",
  },
  wizard: {
    name: "Biscuit, the hedge wizard",
    fur: ["#1a2858", "#2c4890", "#4670c4", "#74a0e6", "#b4d2f8"],
    cream: ["#a6b8dc", "#d2e0f4", "#f4f8ff"],
    pink: "#f4a6b8", ink: "#121830",
    gear: "wizard",
  },
  scout: {
    name: "Juniper, the acorn scout",
    fur: ["#3a3a46", "#62626e", "#8e8e9a", "#b8b8c2", "#dcdce2"],
    cream: ["#b4b4bc", "#dedee4", "#ffffff"],
    pink: "#f2a6a6", ink: "#17161c",
    gear: "scout",
  },
};

// pose parameters: body squash, bob, feet, paw
export const POSES = {
  idle: { sx: 1, sy: 1, bob: 0, feet: [0, 0], paw: "down", lift: 0 },
  idle2: { sx: 1.03, sy: 0.96, bob: 0, feet: [0, 0], paw: "down", lift: 0 },
  run0: { sx: 1.06, sy: 0.94, bob: 0, feet: [-3, 3], paw: "down", lift: 0, lean: 1 },
  run1: { sx: 0.97, sy: 1.04, bob: -2, feet: [0, 0], paw: "down", lift: 1, lean: 1 },
  run2: { sx: 1.06, sy: 0.94, bob: 0, feet: [3, -3], paw: "down", lift: 0, lean: 1 },
  run3: { sx: 0.97, sy: 1.04, bob: -2, feet: [0, 0], paw: "down", lift: 1, lean: 1 },
  jump: { sx: 0.9, sy: 1.1, bob: -1, feet: [-1, 2], paw: "up", lift: 2 },
  fall: { sx: 1.04, sy: 0.98, bob: 0, feet: [2, -1], paw: "out", lift: 1 },
  cast: { sx: 1.02, sy: 0.98, bob: 0, feet: [-2, 2], paw: "forward", lift: 0, lean: 1 },
  hurt: { sx: 0.94, sy: 1.04, bob: -1, feet: [1, -1], paw: "up", lift: 1, lean: -1 },
};

function inEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

/** Render one frame: returns { w, h, px: Uint8ClampedArray RGBA, gem: [x, y] | null } */
export function renderHamster(lookKey, poseKey) {
  const L = LOOKS[lookKey], P = POSES[poseKey];
  const fur = L.fur.map(hexToRGBA), cream = L.cream.map(hexToRGBA), pink = hexToRGBA(L.pink), ink = hexToRGBA(L.ink);
  const grid = new Array(FW * FH).fill(null);
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < FW && y < FH) grid[y * FW + x] = c; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < FW && y < FH ? grid[y * FW + x] : null);

  const lean = P.lean || 0;
  const by = 18 + P.bob, bx = 13 + lean * 0.5;
  const body = { cx: bx, cy: by, rx: 9.5 * P.sx, ry: 7.2 * P.sy };
  const head = { cx: bx + 6.2 + lean * 0.6, cy: by - 5.2 * P.sy, rx: 6.6, ry: 6 };

  // fur mask, then rim shading: lit where the edge faces up-left, shaded where it faces down-right
  const furMask = (x, y) => inEllipse(x, y, body.cx, body.cy, body.rx, body.ry) || inEllipse(x, y, head.cx, head.cy, head.rx, head.ry);
  const M = (x, y) => x >= 0 && y >= 0 && x < FW && y < FH && furMask(x, y);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    if (!M(x, y)) continue;
    let k = 2;
    if (!M(x + 2, y + 2) || !M(x, y + 2)) k = 1;
    if (!M(x + 1, y + 1) && !M(x, y + 1)) k = 0;
    if (!M(x - 2, y - 2) && M(x + 1, y + 1)) k = 3;
    if (!M(x - 1, y - 1) && !M(x - 1, y) && !M(x, y - 1)) k = 3;
    // a soft highlight on the crown and back
    if (k === 2 && !M(x - 3, y - 3) && M(x + 2, y + 2)) k = 3;
    set(x, y, fur[k]);
  }
  // one bright fleck on the head
  set(Math.round(head.cx - 2), Math.round(head.cy - 3), fur[4]); set(Math.round(head.cx - 1), Math.round(head.cy - 3), fur[4]);
  // cream belly, muzzle and cheek pouch
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    if (!get(x, y)) continue;
    const belly = inEllipse(x, y, body.cx + 3.5, body.cy + 3.2, 6.5, 4.2);
    const cheek = inEllipse(x, y, head.cx + 2.2, head.cy + 2.6, 4.2, 3.2);
    if (belly || cheek) {
      const shade = inEllipse(x, y, body.cx + 4.5, body.cy + 4.6, 5, 2.4) ? 0 : y > (cheek ? head.cy + 4 : body.cy + 5) ? 0 : x > head.cx + 4 ? 1 : 2;
      set(x, y, cream[Math.max(0, Math.min(2, cheek ? Math.max(1, shade) : shade))]);
    }
  }
  // tail nub
  set(Math.round(body.cx - body.rx), Math.round(body.cy - 1), fur[2]);
  // ears: small rounded nubs, the front one pink inside
  const hy0 = Math.round(head.cy - head.ry);
  const backEar = [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 1]], frontEar = [[0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [2, 1]];
  const bx0 = Math.round(head.cx - 3), fx0 = Math.round(head.cx);
  for (const [dx, dy] of backEar) set(bx0 + dx, hy0 + dy, fur[1]);
  for (const [dx, dy] of frontEar) set(fx0 + dx, hy0 + dy, fur[3]);
  set(fx0, hy0, pink); set(fx0 + 1, hy0, pink);
  // feet
  const fy = Math.round(by + body.ry * 0.85) + (P.lift ? -P.lift : 0);
  const foot = (x0) => { for (let i = 0; i < 3; i++) set(Math.round(x0 + i), Math.min(FH - 1, fy + 1), pink); set(Math.round(x0), Math.min(FH - 1, fy), fur[1]); set(Math.round(x0 + 1), Math.min(FH - 1, fy), fur[1]); };
  foot(bx - 5 + P.feet[0]);
  foot(bx + 3 + P.feet[1]);

  // outline: selective ink on the outside edge
  const filled = grid.map((c) => !!c);
  const out = grid.slice();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    if (filled[y * FW + x]) continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < FW && Y < FH && filled[Y * FW + X]; });
    if (n) out[y * FW + x] = ink;
  }
  for (let i = 0; i < out.length; i++) grid[i] = out[i];

  // face: eye with shine, nose, blush, whisker
  const ex = Math.round(head.cx + 2.4), ey = Math.round(head.cy - 1.2);
  if (poseKey === "hurt") { set(ex, ey, ink); set(ex + 1, ey + 1, ink); set(ex + 1, ey - 1, ink); }
  else { set(ex, ey, ink); set(ex, ey + 1, ink); set(ex + 1, ey, ink); set(ex + 1, ey + 1, ink); set(ex, ey, [255, 255, 255, 255]); }
  const nose = [Math.round(head.cx + head.rx) - 1, Math.round(head.cy + 0.6)];
  set(nose[0], nose[1], pink); set(nose[0] + 1, nose[1], ink);
  set(ex - 1, ey + 3, hexToRGBA("#f6a0a0"));
  set(nose[0] + 2, nose[1] + 1, ink);

  // paws
  const pawC = pink;
  let gem = null;
  const paw = (x, y) => { set(x, y, pawC); set(x + 1, y, pawC); set(x, y + 1, ink); set(x + 1, y + 1, ink); };
  const chestX = Math.round(head.cx + 1), chestY = Math.round(by + 0.5);
  if (P.paw === "down") paw(chestX, chestY);
  if (P.paw === "up") { paw(chestX + 1, chestY - 4); }
  if (P.paw === "out") { paw(chestX + 3, chestY - 1); }
  if (P.paw === "forward") { paw(chestX + 5, chestY - 2); }

  // gear sits on the real top of the head
  let headTop = FH; for (let y = 0; y < FH; y++) if (get(Math.round(head.cx), y)) { headTop = y; break; }
  const pawPos = P.paw === "forward" ? [chestX + 6, chestY - 2] : P.paw === "up" ? [chestX + 2, chestY - 4] : P.paw === "out" ? [chestX + 4, chestY - 1] : [chestX + 1, chestY];
  if (L.gear === "lantern") {
    // a little blue scarf with a trailing tail
    const sy = Math.round(head.cy + head.ry - 1.5);
    for (let x = Math.round(head.cx - 5); x <= Math.round(head.cx + 2); x++) { set(x, sy, hexToRGBA("#3a7ad8")); set(x, sy + 1, hexToRGBA("#2552a8")); }
    const tail = P.lean ? [[-6, 0], [-7, 1], [-8, 1], [-9, 2]] : [[-6, 1], [-6, 2], [-7, 3]];
    for (const [dx, dy] of tail) set(Math.round(head.cx + dx), sy + dy, hexToRGBA("#2552a8"));
    // the lantern hangs from the paw
    const [lx, ly] = pawPos;
    set(lx + 1, ly + 1, ink);
    const top = ly + 2;
    for (let x = -1; x <= 1; x++) set(lx + 1 + x, top, hexToRGBA("#6a4a2a"));
    for (let y = 1; y <= 3; y++) { set(lx, top + y, hexToRGBA("#6a4a2a")); set(lx + 2, top + y, hexToRGBA("#6a4a2a")); set(lx + 1, top + y, y === 2 ? [255, 255, 255, 255] : hexToRGBA("#ffd25a")); }
    for (let x = -1; x <= 1; x++) set(lx + 1 + x, top + 4, hexToRGBA("#6a4a2a"));
    gem = [lx + 1, top + 2];
  }
  if (L.gear === "wizard") {
    // pointy purple hat, tip trailing back
    const HAT = ["kk........", "kHkk......", ".kHHkk....", ".kHHHHk...", "..kHHhHk..", "..kHHhHHk.", "kkTTTTTTTk", "kTTTTTTTTTk", ".kkkkkkkkk."];
    const pal = { k: ink, H: hexToRGBA("#6a3aa4"), h: hexToRGBA("#9a68d4"), T: hexToRGBA("#f5c84a") };
    const hx = Math.round(head.cx) - 6, hy = headTop - HAT.length + 5;
    HAT.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== ".") set(hx + c, hy + r, pal[ch]); }));
    // a twig staff with a glowing tip
    const [sx, sy0] = pawPos, fwd = P.paw === "forward";
    for (let i = -5; i <= 9; i++) { const X = fwd ? sx + i : sx + Math.round(i * 0.15), Y = fwd ? sy0 - Math.round(i * 0.25) : sy0 - i; set(X, Y, hexToRGBA(i > 7 ? "#f5c84a" : "#7a4a24")); }
    gem = fwd ? [sx + 11, sy0 - 3] : [sx + 1, sy0 - 11];
    set(gem[0], gem[1], [255, 255, 255, 255]);
  }
  if (L.gear === "scout") {
    // acorn cap helmet and a leaf cape
    const CAP = ["....kk....", "...kSSk...", ".kkCCCCkk.", "kCcCcCcCck", "kCCcCcCCck", ".kkkkkkkk."];
    const pal = { k: ink, C: hexToRGBA("#8a5a2a"), c: hexToRGBA("#b8823e"), S: hexToRGBA("#5a3a1a") };
    const cx = Math.round(head.cx) - 5, cy = headTop - CAP.length + 5;
    CAP.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== ".") set(cx + c, cy + r, pal[ch]); }));
    // a big leaf worn as a cape over the back, midrib and all
    const leafC = [hexToRGBA("#1d5228"), hexToRGBA("#2f7a3a"), hexToRGBA("#4aa04a"), hexToRGBA("#8ad06a")];
    const flap = P.lean ? 1 : 0, lx0 = body.cx - 1, ly0 = body.cy - 4;
    for (let y = -4; y <= 5; y++) for (let x = -8; x <= 2; x++) {
      const u = (x + 3) / 5.5, v = (y - 0.5 - (x + 3) * 0.35) / 2.6;
      if (u * u + v * v > 1) continue;
      const px = Math.round(lx0 + x - flap), py = Math.round(ly0 + y);
      const rib = Math.abs(y - 0.5 - (x + 3) * 0.35) < 0.5;
      set(px, py, rib ? leafC[3] : u * u + v * v > 0.7 ? leafC[0] : v < 0 ? leafC[2] : leafC[1]);
    }
    // a pine-cone wand
    const [sx, sy0] = pawPos;
    set(sx + 2, sy0 - 1, hexToRGBA("#7a4a24")); set(sx + 3, sy0 - 2, hexToRGBA("#7a4a24"));
    gem = [sx + 4, sy0 - 3];
    set(gem[0], gem[1], hexToRGBA("#b8ff9a"));
  }

  const px = new Uint8ClampedArray(FW * FH * 4);
  grid.forEach((c, i) => { if (c) { px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]; px[i * 4 + 3] = c[3]; } });
  return { w: FW, h: FH, ox: FOOT_X, oy: FOOT_Y, px, gem };
}
