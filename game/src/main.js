// Lantern Run: a side-scroller sketch where the hero, enemies, spells, status effects and weather are pixelfx effects.
import { createFrame, clearFrame, createFx, composite, painterFor, resolveOptions } from "../../vendor/pixelfx/src/core/index.js";
import { drawHero, POSES, runPose, MAGE } from "./hero.js";
import { renderHamster, POSES as HPOSES } from "./hamster.js";
import { drawKnight, KNIGHT } from "./knight.js";
import { renderWarrior, WARRIOR_POSES } from "./warrior.js";
import { loadWarriorAtlas } from "./warrior-atlas.js";

import * as coinSpin from "../../vendor/pixelfx/src/fx/pickups/coin-spin.js";
import * as collectBurst from "../../vendor/pixelfx/src/fx/pickups/collect-burst.js";
import * as heartPickup from "../../vendor/pixelfx/src/fx/pickups/heart-pickup.js";
import * as chestOpen from "../../vendor/pixelfx/src/fx/pickups/chest-open.js";
import * as potion from "../../vendor/pixelfx/src/fx/pickups/potion.js";
import * as poof from "../../vendor/pixelfx/src/fx/spawn/poof.js";
import * as dissolveBurn from "../../vendor/pixelfx/src/fx/spawn/dissolve-burn.js";
import * as shatterDeath from "../../vendor/pixelfx/src/fx/spawn/shatter-death.js";
import * as disintegrate from "../../vendor/pixelfx/src/fx/spawn/disintegrate.js";
import * as hitSpark from "../../vendor/pixelfx/src/fx/impacts/hit-spark.js";
import * as torch from "../../vendor/pixelfx/src/fx/fire/torch.js";
import * as fireball from "../../vendor/pixelfx/src/fx/fire/fireball.js";
import * as iceLance from "../../vendor/pixelfx/src/fx/ice/ice-lance.js";
import * as zapHit from "../../vendor/pixelfx/src/fx/lightning/zap-hit.js";
import * as plasmaBall from "../../vendor/pixelfx/src/fx/lightning/plasma-ball.js";
import * as electrified from "../../vendor/pixelfx/src/fx/lightning/electrified.js";
import * as plasmaShot from "../../vendor/pixelfx/src/fx/projectiles/plasma-shot.js";
import * as burning from "../../vendor/pixelfx/src/fx/status/burning.js";
import * as frozen from "../../vendor/pixelfx/src/fx/status/frozen.js";
import * as haste from "../../vendor/pixelfx/src/fx/status/haste.js";
import * as cursed from "../../vendor/pixelfx/src/fx/status/cursed.js";
import * as slime from "../../vendor/pixelfx/src/fx/critters/slime.js";
import * as bat from "../../vendor/pixelfx/src/fx/critters/bat.js";
import * as snake from "../../vendor/pixelfx/src/fx/critters/snake.js";
import * as frog from "../../vendor/pixelfx/src/fx/critters/frog.js";
import * as ghost from "../../vendor/pixelfx/src/fx/critters/ghost.js";
import * as skull from "../../vendor/pixelfx/src/fx/critters/flying-skull.js";
import * as eyeball from "../../vendor/pixelfx/src/fx/critters/eyeball.js";
import * as wisp from "../../vendor/pixelfx/src/fx/critters/wisp.js";
import * as damageNumber from "../../vendor/pixelfx/src/fx/ui/damage-number.js";
import * as questComplete from "../../vendor/pixelfx/src/fx/ui/quest-complete.js";
import * as starIris from "../../vendor/pixelfx/src/fx/transitions/star-iris.js";
import * as snow from "../../vendor/pixelfx/src/fx/weather/snow.js";
import * as fallingLeaves from "../../vendor/pixelfx/src/fx/weather/falling-leaves.js";
import * as fog from "../../vendor/pixelfx/src/fx/weather/fog.js";
import * as iceSpikes from "../../vendor/pixelfx/src/fx/ice/ice-spikes.js";
import * as snowflakeBurst from "../../vendor/pixelfx/src/fx/ice/snowflake-burst.js";
import * as lightningStrike from "../../vendor/pixelfx/src/fx/lightning/lightning-strike.js";
import * as plasmaExplosion from "../../vendor/pixelfx/src/fx/explosions/plasma-explosion.js";
import * as manaBurst from "../../vendor/pixelfx/src/fx/arcane/mana-burst.js";
import * as spawnPortal from "../../vendor/pixelfx/src/fx/spawn/spawn-portal.js";
import * as icicleFall from "../../vendor/pixelfx/src/fx/ice/icicle-fall.js";
import { rasterText, textWidth } from "../../vendor/pixelfx/src/core/font.js";

const W = 320, H = 180, T = 16, OY = -4, ROWS = 11, AW = 64, MAX_SEGS = 4;
const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
// ---------------- hero kind: the rigged mage, or a hamster (window.LANTERN_HERO = "lantern" | "wizard" | "scout")
const HERO_KIND = new URLSearchParams(window.location.search).get("hero") || window.LANTERN_HERO || "wizard";
const IS_KNIGHT = HERO_KIND === "knight";
const IS_WARRIOR = HERO_KIND === "warrior";
const HAM = HERO_KIND === "mage" || IS_KNIGHT ? null : IS_WARRIOR ? "warrior" : (["lantern", "wizard", "scout"].includes(HERO_KIND) ? HERO_KIND : "wizard");
const HERO_H = IS_WARRIOR ? 34 : HAM ? 20 : 34;
const toU32 = (px) => { const out = new Uint32Array(px.length / 4); for (let i = 0; i < out.length; i++) out[i] = px[i * 4 + 3] ? ((px[i * 4 + 3] << 24) | (px[i * 4 + 2] << 16) | (px[i * 4 + 1] << 8) | px[i * 4]) >>> 0 : 0; return out; };
const HFRAMES = HAM ? Object.fromEntries((IS_WARRIOR ? WARRIOR_POSES : Object.keys(HPOSES)).map((k) => { const f = IS_WARRIOR ? renderWarrior(k) : renderHamster(HAM, k); return [k, { ...f, c: toU32(f.px) }]; })) : null;
let WARRIOR_SPRITES = null;
const makeHamActor = (f) => {
  const data = new Uint8Array(f.w * f.h);
  for (let i = 0; i < data.length; i++) data[i] = f.c[i] ? 1 : 0;
  return { mask: { w: f.w, h: f.h, data }, pixels: f.c, x: -f.ox, y: -f.oy, w: f.w, h: f.h, k: 2, head: IS_WARRIOR ? [0, -36] : [3, -24], chest: IS_WARRIOR ? [0, -22] : [3, -10] };
};
let HAM_ACTOR = HAM ? makeHamActor(HFRAMES.idle) : null;


// ---------------- palettes ----------------
const GOLD = ["#2a1405", "#5c3008", "#9a5a0e", "#d48e18", "#f5b92c", "#ffde5e", "#fff4bc", "#ffffff"];
const ICE = ["#0e1a3a", "#1d3d6e", "#2f6aa8", "#4f9cd8", "#86c8f2", "#c0ecff", "#ffffff"];
const BLUE_FIRE = ["#0a1640", "#13307a", "#1d56b8", "#2f8ae6", "#4fbcf5", "#86e0ff", "#bff2ff", "#e6fbff", "#ffffff"];
const HEX_FIRE = ["#0e2008", "#1a4010", "#2c6a16", "#46a01c", "#76d42a", "#aef05a", "#dcff9a", "#f4ffd8", "#ffffff"];
const SMOKE = ["#1c1820", "#3a3440", "#5e5868", "#8a8496", "#bcb6c8", "#ffffff"];
const RED7 = ["#140806", "#3a1208", "#5e1e0c", "#8a3014", "#c0521e", "#f08a3a", "#ffd090"];
const SPARK_ICE = ["#151a3d", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"];
const SPARK_ZAP = ["#2a1b78", "#4630c0", "#5a62f0", "#9ed8ff", "#ffe26b", "#fff3a6", "#ffffff"];

const AREAS = [
  {
    name: "Dusk Meadow", tip: "Stomp what you can. X casts, Q switches spells.",
    sky: ["#1a1030", "#24143c", "#331a48", "#4a2150", "#682b55", "#8a3a52", "#b0504c"], moon: "#f6e3c0",
    hills: ["#2c1a40", "#1b1129"], top: ["#7cbf4c", "#5fa242", "#4f8f3a", "#2f5a2a"], dirt: ["#3c2627", "#4a2e2c", "#33201f", "#2a1a1d"],
    plank: ["#c48a52", "#9a6a3e", "#7a5030", "#3b2216"], torch: null,
    weather: [fallingLeaves, {}], pal: {},
  },
  {
    name: "Frost Hollow", tip: "Ice is slippery and the pools freeze you. Frozen enemies are solid ground.",
    sky: ["#0b1430", "#10204a", "#16305e", "#1f4474", "#2c5c8a", "#3f7aa0", "#6aa0b8"], moon: "#e8f4ff",
    hills: ["#23365a", "#18263f"], top: ["#f0f8ff", "#c8e6f8", "#a4cfe8", "#5f8fb8"], dirt: ["#2c3a5a", "#364768", "#24304a", "#1a2238"],
    plank: ["#a8c8e0", "#7a9ab8", "#5a7a98", "#2a3a58"], torch: BLUE_FIRE, ice: true,
    weather: [snow, {}],
    pal: { slime: ["#06121e", "#0c2f4a", "#145a86", "#2f8ac4", "#62c0ec", "#b6ecff", "#f0fcff"], skull: BLUE_FIRE, frog: ["#06121e", "#0c2f4a", "#145a86", "#2f8ac4", "#62c0ec", "#b6ecff", "#f0fcff"], snake: ["#0a1426", "#16284a", "#24406e", "#3a6296", "#6a94c4", "#a8cceb", "#e8f6ff"] },
  },
  {
    name: "Ember Depths", tip: "Lava sets you burning. Touch the storm globe to turn electric.",
    sky: ["#120608", "#1e0a0c", "#2e0e10", "#461412", "#661c14", "#8a2a16", "#b04418"], moon: "#ff9a5a",
    hills: ["#3a1210", "#220a0a"], top: ["#8a7c7a", "#6a5e5e", "#544848", "#2e2424"], dirt: ["#2a1c1e", "#3a2426", "#20151a", "#160e10"],
    plank: ["#6a5a5a", "#4a3e40", "#3a3032", "#1a1416"], torch: null, lava: true,
    weather: [snow, { palette: ["#140806", "#2a100a", "#4a1c10", "#7a3018", "#b05424", "#e08a3a", "#ffc070", "#fff0c0"] }],
    pal: { slime: ["#1a0604", "#4a1208", "#8a240c", "#d0481a", "#ff8a2a", "#ffcc66", "#fff2c4"], bat: ["#120608", "#2a0c10", "#4a1418", "#7a2228", "#a83a3a", "#d86a5a", "#ffb090"], frog: RED7, snake: RED7 },
  },
  {
    name: "Haunted Grove", tip: "Ghosts can't be stomped. Burn or zap them. Eyes shoot back.",
    sky: ["#0a0c18", "#10142a", "#16203a", "#1c2c40", "#223a44", "#2c4a4a", "#3c5c52"], moon: "#cfeedd",
    hills: ["#1c2a36", "#10181f"], top: ["#5ac8a0", "#3a9a80", "#2c7a6a", "#1c4a48"], dirt: ["#26183a", "#302046", "#1e1230", "#150c24"],
    plank: ["#5a4a6a", "#43354f", "#33283e", "#1a1224"], torch: HEX_FIRE,
    weather: [fog, {}],
    pal: { slime: ["#0c0820", "#1f1450", "#3a2a8a", "#5a48c6", "#8a78ee", "#c2b6ff", "#f0ecff"] },
  },
];
// ---------------- stages ----------------
// A stage is a run of 64-tile segments. Each segment has an area theme (art, weather, enemy palettes) and a layout.
// Stage 1 is all Dusk Meadow and Stage 2 all Frost Hollow; Stage 3 holds Ember Depths and Haunted Grove until they're split too.
const STAGES = [
  { title: "Dusk Meadow", segs: [
    { theme: 0, layout: "meadow1", name: "Dusk Meadow", tip: "Stomp what you can. X casts, Q switches spells." },
    { theme: 0, layout: "meadow2", name: "Bramble Hills", tip: "Old Croaker waits at the bottom of the hills." },
    { theme: 0, layout: "meadow3", name: "Duskwood Edge", tip: "Something big is flapping in the dark ahead." },
  ] },
  { title: "Frost Hollow", segs: [
    { theme: 1, layout: "frost1", name: "Frost Hollow", tip: "Ice is slippery. Fire melts frozen foes." },
    { theme: 1, layout: "frost2", name: "Glacier Pass", tip: "King Gloop holds the far end of the pass." },
    { theme: 1, layout: "frost3", name: "Crystal Lake", tip: "Something cold is watching from over the lake." },
  ] },
  { title: "Ember Depths to Haunted Grove", segs: [
    { theme: 2, layout: "ember" }, { theme: 3, layout: "grove" },
  ] },
];
let stageI = 0, SEGS = STAGES[0].segs, NA = SEGS.length, COLS = AW * NA, stageScore0 = 0, stageCoins0 = 0;
const areaOfX = (px) => Math.max(0, Math.min(NA - 1, Math.floor(px / (AW * T))));
const themeAt = (px) => SEGS[areaOfX(px)].theme;
const segName = (i) => SEGS[i].name || AREAS[SEGS[i].theme].name;
const segTip = (i) => SEGS[i].tip || AREAS[SEGS[i].theme].tip;

// ---------------- level ----------------
const E = 0, GR = 1, PL = 2, IC = 3, WA = 4, LV = 5;
const grid = [...Array(ROWS)].map(() => new Uint8Array(AW * MAX_SEGS));
const SOLID = (t) => t === GR || t === PL || t === IC;
const tileAt = (tx, ty) => (tx < 0 || tx >= COLS ? GR : ty < 0 || ty >= ROWS ? E : grid[ty][tx]);
const solid = (tx, ty) => SOLID(tileAt(tx, ty));

const SPEC = { torches: [], coins: [], enemies: [], hearts: [], potions: [], globes: [], wisps: [], flags: [], arenas: [] };
function buildLevel() {
  for (const r of grid) r.fill(0);
  for (const k in SPEC) SPEC[k] = [];
  for (let a = 0; a < NA; a++) {
    const th = SEGS[a].theme, lay = SEGS[a].layout, o = a * AW, ice = !!AREAS[th].ice;
    const X = (tx) => (o + tx) * T + 8;
    const ground = (x0, x1, top = 9) => { for (let x = x0; x <= x1; x++) for (let y = top; y < ROWS; y++) grid[y][o + x] = y === top && ice ? IC : GR; };
    const plank = (x0, x1, y) => { for (let x = x0; x <= x1; x++) grid[y][o + x] = PL; };
    const pool = (x0, x1) => { ground(x0, x1, 10); for (let x = x0; x <= x1; x++) { grid[9][o + x] = WA; grid[10][o + x] = GR; } };
    const lava = (x0, x1) => { for (let x = x0; x <= x1; x++) grid[10][o + x] = LV; };
    const coinsRow = (x0, x1, y) => { for (let x = x0; x <= x1; x++) SPEC.coins.push([X(x), y]); };
    const en = (kind, tx, opts = {}) => SPEC.enemies.push({ kind, area: th, x: X(tx), ...opts, x0: opts.x0 != null ? X(opts.x0) : X(tx) - 40, x1: opts.x1 != null ? X(opts.x1) : X(tx) + 40 });
    SPEC.flags.push(X(2));
    if (lay === "meadow1") {
      ground(0, 13); ground(17, 29); ground(22, 25, 7); plank(31, 33, 6); ground(35, 49); plank(39, 42, 5); ground(53, 63);
      SPEC.torches.push(X(6), X(20), X(45), X(58));
      coinsRow(5, 9, 128); SPEC.coins.push([X(14), 112], [X(15), 100], [X(16), 112]);
      coinsRow(22, 25, 96); coinsRow(31, 33, 80); coinsRow(40, 41, 64); coinsRow(55, 60, 128);
      en("slime", 10, { x0: 8, x1: 12 }); en("snake", 27, { x0: 18, x1: 28 }); en("bat", 32, { by: 56, x0: 29, x1: 36 });
      en("slime", 37, { x0: 36, x1: 48 }); en("frog", 46, { x0: 44, x1: 48 }); en("snake", 59, { x0: 54, x1: 62 });
      SPEC.potions.push([X(41), 80]);
    }
    if (lay === "meadow2") {
      // Bramble Hills: steps, a plank bridge and short pits, ending in Old Croaker's pond-side arena
      ground(0, 10); ground(13, 21); ground(16, 18, 7); plank(23, 25, 6); ground(27, 34); ground(30, 31, 6); ground(36, 44); plank(38, 42, 5); ground(48, 63);
      SPEC.torches.push(X(5), X(14), X(36), X(52), X(60));
      coinsRow(3, 7, 128); coinsRow(16, 18, 96); coinsRow(23, 25, 80); coinsRow(30, 31, 80); coinsRow(38, 42, 64);
      en("slime", 8, { x0: 3, x1: 10 }); en("frog", 17, { x0: 16, x1: 18 }); en("bat", 24, { by: 58, x0: 21, x1: 27 });
      en("slime", 33, { x0: 32, x1: 34 }); en("snake", 40, { x0: 37, x1: 43 });
      SPEC.potions.push([X(20), 144]); SPEC.hearts.push([X(41), 80]);
      SPEC.flags.push(X(43));
      SPEC.arenas.push({ kind: "croaker", x0: (o + 48) * T, x1: (o + 64) * T, floor: 9 * T });
    }
    if (lay === "meadow3") {
      // Duskwood Edge: plank hops over wider pits, then Duskwing's arena with two ledges and the stage's chest
      ground(0, 12); plank(14, 16, 6); ground(18, 26); ground(21, 23, 7); plank(28, 30, 6); ground(32, 63); ground(35, 36, 7);
      plank(45, 47, 6); plank(55, 57, 6);
      for (let y = 0; y < ROWS; y++) grid[y][o + 63] = GR;
      SPEC.torches.push(X(4), X(19), X(33), X(42), X(60));
      coinsRow(3, 8, 128); coinsRow(14, 16, 80); coinsRow(21, 23, 96); coinsRow(28, 30, 80);
      en("bat", 8, { by: 60, x0: 4, x1: 11 }); en("slime", 19, { x0: 18, x1: 20 }); en("frog", 25, { x0: 24, x1: 26 }); en("bat", 29, { by: 56, x0: 27, x1: 31 }); en("snake", 33, { x0: 32, x1: 34 });
      SPEC.hearts.push([X(36), 112]); SPEC.potions.push([X(22), 112]);
      SPEC.flags.push(X(38));
      SPEC.arenas.push({ kind: "dusk", x0: (o + 40) * T, x1: (o + 63) * T, floor: 9 * T, chest: true });
      SPEC.chest = X(51);
    }
    if (lay === "frost1") {
      ground(0, 11); pool(12, 15); ground(16, 27); ground(20, 23, 7); plank(29, 30, 6); ground(32, 40); pool(41, 43); ground(44, 45);
      plank(36, 39, 5); ground(49, 63); ground(55, 57, 7);
      SPEC.torches.push(X(5), X(18), X(34), X(51), X(61));
      coinsRow(12, 15, 104); coinsRow(20, 23, 96); coinsRow(29, 30, 80); coinsRow(41, 43, 104); coinsRow(55, 57, 96);
      en("slime", 8, { x0: 5, x1: 11 }); en("skull", 25, { hy: 84 }); en("frog", 33, { x0: 32, x1: 35 });
      en("slime", 38, { x0: 32, x1: 40 }); en("skull", 47, { hy: 70 }); en("slime", 52, { x0: 49, x1: 54 }); en("snake", 60, { x0: 58, x1: 62 });
      SPEC.hearts.push([X(37), 80]);
    }
    if (lay === "frost2") {
      // Glacier Pass: a plank over the first gap, a frozen pool, then King Gloop's arena with a checkpoint just before it
      ground(0, 9); plank(11, 13, 7); ground(15, 22); ground(18, 20, 7); pool(23, 26); ground(27, 33); plank(34, 36, 6); ground(38, 45); ground(40, 41, 7);
      ground(49, 63);
      SPEC.torches.push(X(4), X(16), X(29), X(39), X(52), X(61));
      coinsRow(11, 13, 96); coinsRow(18, 20, 96); coinsRow(23, 26, 104); coinsRow(34, 36, 80); coinsRow(40, 41, 96);
      en("slime", 6, { x0: 2, x1: 9 }); en("skull", 14, { hy: 80 }); en("frog", 21, { x0: 21, x1: 22 }); en("snake", 30, { x0: 27, x1: 33 });
      en("skull", 36, { hy: 66 }); en("slime", 44, { x0: 42, x1: 45 });
      SPEC.potions.push([X(12), 80]); SPEC.hearts.push([X(41), 80]);
      SPEC.flags.push(X(44));
      SPEC.arenas.push({ kind: "gloop", x0: (o + 49) * T, x1: (o + 64) * T, floor: 9 * T });
    }
    if (lay === "frost3") {
      // Crystal Lake: two frozen pools, then Rimeskull's arena with two ledges and the stage's chest
      ground(0, 8); pool(9, 12); ground(13, 20); plank(22, 24, 6); ground(26, 31); ground(28, 29, 7); pool(32, 35); ground(36, 63); ground(38, 39, 7);
      plank(46, 48, 6); plank(55, 57, 6);
      for (let y = 0; y < ROWS; y++) grid[y][o + 63] = GR;
      SPEC.torches.push(X(4), X(15), X(27), X(37), X(44), X(60));
      coinsRow(9, 12, 104); coinsRow(15, 18, 128); coinsRow(22, 24, 80); coinsRow(28, 29, 96); coinsRow(32, 35, 104);
      en("skull", 6, { hy: 76 }); en("slime", 18, { x0: 14, x1: 20 }); en("frog", 30, { x0: 30, x1: 31 }); en("skull", 34, { hy: 70 });
      SPEC.potions.push([X(23), 80]); SPEC.hearts.push([X(38), 96]);
      SPEC.flags.push(X(40));
      SPEC.arenas.push({ kind: "rime", x0: (o + 42) * T, x1: (o + 63) * T, floor: 9 * T, chest: true });
      SPEC.chest = X(52);
    }
    if (lay === "ember") {
      ground(0, 9); lava(10, 14); plank(12, 12, 6); ground(15, 24); ground(19, 21, 7); lava(25, 31); plank(27, 28, 7); plank(30, 30, 5);
      ground(32, 44); lava(45, 49); plank(47, 47, 6); ground(50, 63);
      SPEC.torches.push(X(4), X(17), X(40), X(55));
      coinsRow(11, 13, 72); coinsRow(19, 21, 96); coinsRow(27, 28, 96); SPEC.coins.push([X(30), 64]); coinsRow(46, 48, 80); coinsRow(52, 56, 128);
      en("slime", 6, { x0: 3, x1: 9 }); en("snake", 22, { x0: 16, x1: 24 }); en("skull", 17, { hy: 76 }); en("bat", 28, { by: 52, x0: 25, x1: 31 });
      en("frog", 42, { x0: 40, x1: 44 }); en("skull", 47, { hy: 64 }); en("slime", 57, { x0: 51, x1: 62 });
      SPEC.globes.push(X(35));
    }
    if (lay === "grove") {
      ground(0, 12); ground(16, 30); plank(20, 23, 6); plank(32, 33, 7); ground(35, 63); ground(40, 42, 7); plank(48, 50, 6); plank(56, 58, 6);
      for (let y = 0; y < ROWS; y++) grid[y][o + 63] = GR;
      SPEC.torches.push(X(4), X(18), X(37), X(46), X(61));
      coinsRow(5, 9, 128); SPEC.coins.push([X(13), 112], [X(14), 100], [X(15), 112]); coinsRow(20, 23, 80); coinsRow(40, 42, 96);
      en("ghost", 11, { gy: 110 }); en("slime", 25, { x0: 17, x1: 29 }); en("eyeball", 29); en("ghost", 38, { gy: 100 });
      SPEC.hearts.push([X(21), 96], [X(41), 112]); SPEC.wisps.push(X(6));
      // final boss: the Hollow Eye guards the chest; the two ledges are for stomping it
      SPEC.flags.push(X(36));
      SPEC.arenas.push({ kind: "eye", x0: (o + 44) * T, x1: (o + 63) * T, floor: 9 * T, chest: true });
      SPEC.chest = X(53);
    }
  }
}
const surfaceAt = (px) => { const tx = Math.floor(px / T); for (let y = 0; y < ROWS; y++) if (SOLID(grid[y][tx])) return y * T; return ROWS * T + 40; };

// ---------------- DOM, frames ----------------
const cv = document.getElementById("game");
const ctx = cv.getContext("2d");
const scene = document.createElement("canvas"); scene.width = W; scene.height = H;
const sctx = scene.getContext("2d", { willReadFrequently: true });
const frame = createFrame(W, H, 0, OY);
const wframe = createFrame(W, H, 0, OY);
const outImg = ctx.createImageData(W, H);
const bannerEl = document.getElementById("banner"), tipEl = document.getElementById("tip");
let tipTimer = 0;
function say(title, tip, ms = 4500) {
  bannerEl.textContent = title || ""; tipEl.textContent = tip || "";
  bannerEl.style.opacity = title ? "1" : "0"; tipEl.style.opacity = tip ? "1" : "0";
  clearTimeout(tipTimer);
  if (ms) tipTimer = setTimeout(() => { bannerEl.style.opacity = "0"; tipEl.style.opacity = "0"; }, ms);
}

// ---------------- baked loops ----------------
// Pure looping effects (coins, torches, hearts...) are a function of time alone, so each frame is drawn once
// into a small buffer the first time it's needed and copied after that.
const BAKES = new Map();
function bakeOf(mod, opts = {}, frontOnly = false) {
  const key = mod.meta.name + "|" + JSON.stringify(opts) + "|" + frontOnly + "|" + (opts.flip ? 1 : 0);
  let b = BAKES.get(key);
  if (!b) {
    const [w, h] = mod.meta.size, [ox, oy] = mod.meta.origin, D = mod.meta.duration ?? 1;
    b = { mod, w, h, ox, oy, D, n: Math.max(1, Math.round(D * 30)), frames: [], frontOnly, opts: resolveOptions(mod.meta, opts), flip: !!opts.flip };
    BAKES.set(key, b);
  }
  return b;
}
function bakedFrame(b, t) {
  const i = Math.floor((((t % b.D) + b.D) % b.D) * 30) % b.n;
  let f = b.frames[i];
  if (!f) {
    const fr = createFrame(b.w, b.h, -b.ox, -b.oy), p = painterFor(fr).place(0, 0, b.flip, 0), tt = (i / b.n) * b.D;
    p.fade = 1; p.lightK = b.opts.light ?? 1;
    if (!b.frontOnly && b.mod.drawBack) { p.layer = "back"; b.mod.drawBack(p, tt, b.opts); }
    p.layer = "front"; b.mod.draw(p, tt, b.opts);
    let x0 = b.w, y0 = b.h, x1 = -1, y1 = -1;
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) { const j = y * b.w + x; if (fr.color[j] || (fr.light[j] & 0xffffff)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    const cw = Math.max(0, x1 - x0 + 1), ch = Math.max(0, y1 - y0 + 1), color = new Uint32Array(cw * ch), light = new Uint32Array(cw * ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { color[y * cw + x] = fr.color[(y0 + y) * b.w + x0 + x]; light[y * cw + x] = fr.light[(y0 + y) * b.w + x0 + x]; }
    f = b.frames[i] = { color, light, x0, y0, x1, y1, cw };
  }
  return f;
}
function blit(frame, b, t, x, y) {
  const f = bakedFrame(b, t);
  if (f.x1 < 0) return;
  const X0 = Math.round(x) - b.ox - frame.ox, Y0 = Math.round(y) - b.oy - frame.oy, FW = frame.w, FH = frame.h, C = frame.color, L = frame.light;
  for (let yy = f.y0; yy <= f.y1; yy++) {
    const py = Y0 + yy; if (py < 0 || py >= FH) continue;
    for (let xx = f.x0; xx <= f.x1; xx++) {
      const px = X0 + xx; if (px < 0 || px >= FW) continue;
      const j = (yy - f.y0) * f.cw + (xx - f.x0), i = py * FW + px, s = f.color[j];
      if (s) {
        const a = s >>> 24;
        if (a === 255 || !C[i]) C[i] = s;
        else { const k = a / 255, d = C[i]; C[i] = (Math.max(a, d >>> 24) << 24) | (Math.round(((s >>> 16) & 255) * k + ((d >>> 16) & 255) * (1 - k)) << 16) | (Math.round(((s >>> 8) & 255) * k + ((d >>> 8) & 255) * (1 - k)) << 8) | Math.round((s & 255) * k + (d & 255) * (1 - k)); }
      }
      const l = f.light[j];
      if (l & 0xffffff) { const d = L[i]; L[i] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + ((l >>> 16) & 255)) << 16) | (Math.min(255, ((d >>> 8) & 255) + ((l >>> 8) & 255)) << 8) | Math.min(255, (d & 255) + (l & 255)); }
    }
  }
}

// ---------------- state ----------------
let P, cam, score, coinCount, shake, iris, quest, oneShots, dust, bolts, shots, projectiles;
let coins, hearts, potions, globes, torches, enemies, wisps, chest, flags, spawnX, areaSeen, weather, weatherArea, winT, state, time;
const SPELLS = [
  { key: "fire", name: "Fire", cost: 22, color: "#ff8a2a" },
  { key: "ice", name: "Ice", cost: 26, color: "#86e0ff" },
  { key: "zap", name: "Zap", cost: 34, color: "#ffe26b" },
];
const STATUS = { burning: { mod: burning, t: 2.6 }, frozen: { mod: frozen, t: 2.6 }, electrified: { mod: electrified, t: 8 }, haste: { mod: haste, t: 7 }, cursed: { mod: cursed, t: 3.2 } };

const spawn = (mod, o) => { oneShots.push(createFx(mod, { seed: (Math.random() * 1e6) | 0, ...o })); };
const MODS = { slime, bat, snake, frog, ghost, skull, eyeball };
const HB = { slime: [-12, -17, 24, 17], snake: [-30, -10, 60, 10], frog: [-11, -16, 22, 16], bat: [-12, -16, 24, 16], ghost: [-10, -40, 24, 30], skull: [-10, -56, 22, 26], eyeball: [-12, -60, 26, 24] };
const STOMPABLE = { slime: 1, snake: 1, frog: 1, bat: 1, eyeball: 1 };
const PLATFORM_WHEN_FROZEN = { slime: 1, frog: 1, snake: 1 };

function makeEnemy(s) {
  const area = AREAS[s.area], e = { ...s, alive: true, dir: -1, frozenT: 0, t: Math.random() * 10, cool: 1 + Math.random() * 2 };
  e.y = s.kind === "bat" ? s.by : s.kind === "skull" ? s.hy + 40 : s.kind === "ghost" ? s.gy : surfaceAt(s.x);
  e.hx = e.x; e.hyHome = e.y;
  e.palette = area.pal[s.kind] || null;
  e.seed = 1 + (Math.round(s.x / 16) % 2);
  return e;
}
const enemyBake = (e) => bakeOf(MODS[e.kind], { seed: e.seed, flip: e.dir < 0, ...(e.palette ? { palette: e.palette } : {}) });
function freezeFx(e) {
  const m = MODS[e.kind], o = { seed: e.seed, flip: e.dir < 0, palette: ICE };
  for (const [k, v] of Object.entries(m.meta.options || {})) if (Array.isArray(v) && typeof v[0] === "string") o[k] = ICE;
  return { b: bakeOf(m, o), t: e.t, x: e.x, y: e.y };
}

function makeTorches() {
  torches = SPEC.torches.map((x, i) => ({ x, y: surfaceAt(x) - 14, ph: i * 0.7, b: bakeOf(torch, { seed: 1 + (i % 2), ...(AREAS[themeAt(x)].torch ? { palette: AREAS[themeAt(x)].torch } : {}) }) }));
}

function resetHero(x) {
  const hp = P ? P.hp : 4;
  P = { x: x - 6, y: surfaceAt(x) - HERO_H - 2, vx: 0, vy: 0, w: 12, h: HERO_H, face: 1, onGround: false, wasGround: false, coyote: 0, buffer: 0, inv: 1, run: 0,
    hp, mana: 100, spell: 0, castT: 0, cool: 0, status: null, dead: null, frozen: false, onIce: false, hurtT: 0, attackT: 0, attackDuration: 0, attackKind: "", combo: 0, comboWindow: 0, attackQueued: false, attackHit: false, rollT: 0, rollCool: 0, dashT: 0, dashCool: 0 };
}

function newGame(stage = stageI, keep = null) {
  stageI = Math.max(0, Math.min(STAGES.length - 1, stage)); SEGS = STAGES[stageI].segs; NA = SEGS.length; COLS = AW * NA;
  buildLevel(); buildDecor();
  P = null;
  coins = SPEC.coins.map(([x, y], i) => ({ x, y, ph: (i * 0.37) % 1.6, b: bakeOf(coinSpin, { seed: 1 + (i % 3) }, true) }));
  hearts = SPEC.hearts.map(([x, y]) => ({ x, y, b: bakeOf(heartPickup, {}, true) }));
  potions = SPEC.potions.map(([x, y]) => ({ x, y, b: bakeOf(potion, { palette: ["#06140a", "#0b3318", "#126a2a", "#1fa040", "#47d462", "#9af0a0", "#d8ffe0", "#ffffff"] }, true) }));
  globes = SPEC.globes.map((x) => ({ x, y: surfaceAt(x), cool: 0, b: bakeOf(plasmaBall, {}) }));
  wisps = SPEC.wisps.map((x) => createFx(wisp, { x, y: surfaceAt(x) - 4, seed: x % 13 }));
  makeTorches();
  enemies = SPEC.enemies.map(makeEnemy);
  chest = { x: SPEC.chest, y: surfaceAt(SPEC.chest), fx: createFx(chestOpen, { x: SPEC.chest, y: surfaceAt(SPEC.chest) }), opened: false, hidden: true };
  arenas = SPEC.arenas.map(makeArena); hazards = [];
  flags = SPEC.flags.map((x, i) => ({ x, y: surfaceAt(x), hit: i === 0 }));
  spawnX = flags[0].x + 10;
  resetHero(spawnX); P.hp = keep ? Math.max(4, keep.hp) : 4;
  cam = 0; score = 0; coinCount = 0; shake = 0; iris = null; quest = null; oneShots = []; dust = []; bolts = []; shots = []; projectiles = [];
  if (keep) { score = keep.score; coinCount = keep.coins; }
  stageScore0 = score; stageCoins0 = coinCount;
  areaSeen = new Set([0]); weather = null; weatherArea = -1; winT = 0; state = "play"; time = 0;
  say(`Stage ${stageI + 1}: ${STAGES[stageI].title}`, IS_WARRIOR ? "X COMBO. C HEAVY. SHIFT DODGE. F DASH. V CAST." : segTip(0), 5000);
}

// ---------------- input ----------------
const keys = new Set();
let jumpPressed = false, castPressed = false, swapPressed = false, heavyPressed = false, rollPressed = false, dashPressed = false, magicPressed = false;
const JUMP = ["Space", "KeyZ", "ArrowUp", "KeyW", "KeyK"], CAST = ["KeyX", "KeyJ"], SWAP = ["KeyQ", "KeyE", "KeyC"];
const GAME_KEYS = new Set([...JUMP, ...CAST, "ArrowLeft", "ArrowRight", "ArrowDown", "KeyA", "KeyD"]);
window.addEventListener("keydown", (e) => {
  if (e.target && e.target.tagName === "BUTTON" && (e.code === "Space" || e.code === "Enter")) return;
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  if (!e.repeat) {
    if (JUMP.includes(e.code)) jumpPressed = true;
    if (CAST.includes(e.code)) castPressed = true;
    if (SWAP.includes(e.code) && !(IS_WARRIOR && e.code === "KeyC")) swapPressed = true;
    if (IS_WARRIOR && e.code === "KeyC") heavyPressed = true;
    if (IS_WARRIOR && (e.code === "ShiftLeft" || e.code === "ShiftRight")) rollPressed = true;
    if (IS_WARRIOR && e.code === "KeyF") dashPressed = true;
    if (IS_WARRIOR && e.code === "KeyV") magicPressed = true;
    if (e.code === "Digit1") P.spell = 0;
    if (e.code === "Digit2") P.spell = 1;
    if (e.code === "Digit3") P.spell = 2;
    if (e.code === "KeyR") restartStage();
  }
  keys.add(e.code);
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => keys.clear());
const hold = (id, code, onPress) => {
  const b = document.getElementById(id);
  if (!b) return;
  const on = (e) => { e.preventDefault(); onPress && onPress(); keys.add(code); };
  const off = (e) => { e.preventDefault(); keys.delete(code); };
  b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
};
hold("tLeft", "ArrowLeft"); hold("tRight", "ArrowRight");
if (IS_WARRIOR) {
  document.getElementById("castHelp").hidden = true;
  document.getElementById("warriorHelp").hidden = false;
  for (const id of ["tHeavy", "tRoll", "tDash", "tMagic"]) document.getElementById(id).hidden = false;
  document.getElementById("tCast").textContent = "ATTACK";
  document.getElementById("tCast").setAttribute("aria-label", "Light attack");
  hold("tHeavy", "KeyC", () => (heavyPressed = true));
  hold("tRoll", "ShiftLeft", () => (rollPressed = true));
  hold("tDash", "KeyF", () => (dashPressed = true));
  hold("tMagic", "KeyV", () => (magicPressed = true));
}
hold("tJump", "Space", () => (jumpPressed = true)); hold("tCast", "KeyX", () => (castPressed = true)); hold("tSwap", "KeyQ", () => (swapPressed = true));
for (const a of document.querySelectorAll("a[data-stage], a[href^='?hero=']")) {
  const qs = new URLSearchParams(window.location.search);
  if (a.dataset.stage) qs.set("stage", a.dataset.stage); else qs.set("hero", new URLSearchParams(a.getAttribute("href").slice(1)).get("hero"));
  a.setAttribute("href", "?" + qs.toString());
}
document.getElementById("restartBtn").addEventListener("click", () => { restartStage(); cv.focus(); });
function restartStage() { newGame(stageI, stageI ? { score: stageScore0, coins: stageCoins0, hp: 4 } : null); }
const padState = { left: false, right: false, jump: false, previous: [], index: null };
const padStatus = document.getElementById("padStatus");
if (IS_WARRIOR) {
  document.getElementById("padStandard").hidden = true;
  document.getElementById("padWarrior").hidden = false;
}
// Poll every frame: buttons trigger once per press, while movement and jump can be held.
function pollGamepad() {
  let pad = null;
  try { if (navigator.getGamepads) pad = Array.from(navigator.getGamepads()).find(p => p && p.connected) || null; } catch (_) { /* no gamepad access */ }
  if (!pad || !document.hasFocus()) {
    padState.left = padState.right = padState.jump = false;
    padState.previous = []; padState.index = null;
    padStatus.hidden = !pad;
    if (pad) padStatus.textContent = "Controller connected";
    return;
  }
  if (padState.index !== pad.index) { padState.previous = []; padState.index = pad.index; }
  padStatus.hidden = false; padStatus.textContent = "Controller connected";
  const buttons = pad.buttons.map(b => !!b && (b.pressed || b.value > 0.5));
  const pressed = i => !!buttons[i] && !padState.previous[i];
  const axis = pad.axes[0] || 0;
  padState.left = axis < -0.3 || !!buttons[14];
  padState.right = axis > 0.3 || !!buttons[15];
  padState.jump = !!buttons[0];
  if (pressed(0)) jumpPressed = true;
  if (IS_WARRIOR) {
    if (pressed(2)) castPressed = true;
    if (pressed(3)) heavyPressed = true;
    if (pressed(1)) rollPressed = true;
    if (pressed(5)) dashPressed = true;
    if (pressed(7)) magicPressed = true;
    if (pressed(4)) swapPressed = true;
  } else {
    if (pressed(2) || pressed(1)) castPressed = true;
    if (pressed(3) || pressed(5)) swapPressed = true;
    if (pressed(4) && P) P.spell = (P.spell + SPELLS.length - 1) % SPELLS.length;
  }
  if (pressed(9) && P) restartStage();
  padState.previous = buttons;
}
const down = (...c) => c.some((k) => keys.has(k)) || (padState.jump && c.some(k => JUMP.includes(k)));

// ---------------- helpers ----------------
const box = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
const heroBox = () => [P.x, P.y, P.w, P.h];
const enemyBox = (e) => { const h = HB[e.kind]; return [e.x + h[0], e.y + h[1], h[2], h[3]]; };
function overlapsSolid(x, y, w, h) {
  const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.01) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.01) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solid(tx, ty)) return { tx, ty };
  // frozen enemies are solid blocks
  for (const e of enemies) if (e.alive && e.frozenT > 0 && PLATFORM_WHEN_FROZEN[e.kind]) { const b = enemyBox(e); if (box([x, y, w, h], b)) return { block: b }; }
  // a sealed boss arena's rune walls
  for (const A of arenas) if (A.locked) for (const b of [[A.x0 - 6, -400, 6, 800], [A.x1, -400, 6, 800]]) if (box([x, y, w, h], b)) return { block: b };
  return null;
}
const touchesTile = (type) => {
  const x0 = Math.floor(P.x / T), x1 = Math.floor((P.x + P.w - 0.01) / T), y0 = Math.floor(P.y / T), y1 = Math.floor((P.y + P.h - 0.01) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileAt(tx, ty) === type) return true;
  return false;
};
function puff(x, y, n, spread, col) {
  for (let i = 0; i < n; i++) dust.push({ x: x + (Math.random() - 0.5) * 8, y, vx: (Math.random() - 0.5) * spread, vy: -Math.random() * 25 - 5, life: 0.3 + Math.random() * 0.25, age: 0, col });
}

function setStatus(kind) {
  if (P.status && P.status.kind === "electrified" && kind !== "electrified") return;
  const s = STATUS[kind];
  P.status = { kind, t: s.t, mod: s.mod, fx: createFx(s.mod, { actor: HAM_ACTOR || (IS_KNIGHT ? KNIGHT : MAGE), seed: 3 }) };
}
const statusIs = (k) => P.status && P.status.kind === k;

function hurt(cause, fromX, amount = 1) {
  if (P.inv > 0 || (IS_WARRIOR && P.rollT > 0.08) || P.dead || state !== "play" || statusIs("electrified")) return;
  P.hp -= amount; P.inv = 1.3; P.hurtT = 0.3;
  P.vy = -230; P.vx = (P.x + 6 < fromX ? -1 : 1) * 150;
  spawn(hitSpark, { x: P.x + 6, y: P.y + Math.round(P.h * 0.53), flip: P.vx < 0 });
  spawn(damageNumber, { x: P.x + 6, y: P.y - 4, text: "-" + amount });
  shake = 0.25;
  if (cause === "fire") setStatus("burning");
  if (cause === "ice") setStatus("frozen");
  if (cause === "curse") setStatus("cursed");
  if (P.hp <= 0) die(cause);
}
function die(cause) {
  const mod = cause === "fire" ? dissolveBurn : cause === "ice" ? shatterDeath : disintegrate;
  P.dead = { t: 0, fx: createFx(mod, { actor: HAM_ACTOR || (IS_KNIGHT ? KNIGHT : MAGE), x: Math.round(P.x + 6), y: Math.round(P.y + P.h), flip: P.face < 0, seed: 4 }) };
  P.status = null; P.vx = 0;
  state = "dying";
}
function startIris() {
  state = "iris";
  iris = { fx: createFx(starIris, { x: Math.round(cam), y: OY, focus: [Math.max(10, Math.min(310, Math.round(P.x + 6 - cam))), Math.max(10, Math.min(170, Math.round(P.y + P.h / 2 - OY)))] }), swapped: false };
}

function killEnemy(e, how) {
  e.alive = false;
  const b = enemyBox(e), cx = b[0] + b[2] / 2, by = b[1] + b[3];
  const pal = how === "fire" ? ["#2a0e08", "#5a1a0c", "#a8320f", "#e8601a", "#ffb060", "#ffffff"] : how === "ice" || e.frozenT > 0 ? ICE.slice(1) : how === "zap" ? ["#120a33", "#2a1b78", "#5a62f0", "#9ed8ff", "#fff3a6", "#ffffff"] : e.kind === "ghost" ? ["#10142a", "#3e4f86", "#a3b8e2", "#d8e4ff", "#ffffff", "#ffffff"] : SMOKE;
  spawn(poof, { x: cx, y: by + (e.kind === "skull" || e.kind === "eyeball" || e.kind === "ghost" ? 12 : 0), palette: pal });
  const pts = e.kind === "ghost" || e.kind === "skull" ? 150 : 100;
  spawn(damageNumber, { x: cx, y: b[1] - 2, text: "+" + pts, palette: GOLD });
  score += pts; shake = Math.max(shake, 0.1);
}

// ---------------- spells ----------------
function cast() {
  const sp = SPELLS[P.spell];
  if (P.cool > 0 || P.dead || state !== "play") return;
  if (statusIs("cursed")) { spawn(damageNumber, { x: P.x + 6, y: P.y - 4, text: "HEXED", palette: ["#140a1c", "#3a1a50", "#6a2a8a", "#a050c8", "#d090f0", "#f0d0ff", "#ffffff", "#ffffff"] }); P.cool = 0.5; return; }
  const free = statusIs("electrified");
  if (!free && P.mana < sp.cost) { P.cool = 0.15; return; }
  if (!free) P.mana -= sp.cost;
  P.castT = 0.3; P.cool = 0.38;
  const hx = P.x + 6 + P.face * (IS_WARRIOR ? 20 : HAM ? 13 : 20), hy = P.y + Math.round(P.h * 0.47);
  if (sp.key === "zap") { zap(hx, hy); return; }
  // soft aim: the nearest enemy ahead, within a wide cone
  const speed = sp.key === "fire" ? 230 : 260;
  let vx = P.face * speed, vy = 0, best = 200;
  for (const e of enemies) {
    if (!e.alive) continue;
    const b = enemyBox(e), dx = b[0] + b[2] / 2 - hx, dy = b[1] + b[3] / 2 - hy;
    if (Math.sign(dx) !== P.face || Math.abs(dy) > Math.abs(dx) * 0.9 + 10) continue;
    const d = Math.hypot(dx, dy);
    if (d < best) { best = d; vx = (dx / d) * speed; vy = (dy / d) * speed; }
  }
  for (const A of arenas) {
    if (!A.locked || !bossHittable(A.boss)) continue;
    const b = bossBox(A.boss), dx = b[0] + b[2] / 2 - hx, dy = b[1] + b[3] / 2 - hy;
    if (Math.sign(dx) !== P.face || Math.abs(dy) > Math.abs(dx) * 1.2 + 16) continue;
    const d = Math.hypot(dx, dy);
    if (d < best + 40) { best = d; vx = (dx / d) * speed; vy = (dy / d) * speed; }
  }
  const angle = (vx < 0 ? -1 : 1) * Math.atan2(vy, Math.abs(vx));
  const mod = sp.key === "fire" ? fireball : iceLance;
  projectiles.push({ kind: sp.key, x: hx, y: hy, vx, vy, life: sp.key === "fire" ? 1.4 : 1.2, fx: createFx(mod, { x: hx, y: hy, flip: vx < 0, angle, seed: (Math.random() * 99) | 0 }) });
}
function zap(hx, hy) {
  const hit = new Set();
  let from = [hx, hy], range = 150;
  const targets = enemies.filter((e) => e.alive).map((e) => ({ e, b: enemyBox(e) }));
  for (const A of arenas) if (A.locked && bossHittable(A.boss)) targets.push({ e: A.boss, arena: A, b: bossBox(A.boss) });
  for (let k = 0; k < 3; k++) {
    let best = null, bd = range;
    for (const tg of targets) {
      if (hit.has(tg.e)) continue;
      const b = tg.b, cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2, dx = cx - from[0], dy = cy - from[1];
      if (k === 0 && Math.sign(dx) !== P.face) continue;
      if (Math.abs(dy) > (tg.arena ? 110 : 80)) continue;
      const d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; best = { e: tg.e, arena: tg.arena, cx, cy }; }
    }
    if (!best) break;
    hit.add(best.e);
    bolts.push({ a: from, b: [best.cx, best.cy], t: 0.22, seed: Math.random() * 1000 });
    spawn(zapHit, { x: best.cx, y: best.cy, flip: best.cx < from[0] });
    if (best.arena) damageBoss(best.arena, 1, "zap", best.cx, best.cy); else killEnemy(best.e, "zap");
    from = [best.cx, best.cy]; range = 110;
  }
  if (!hit.size) bolts.push({ a: [hx, hy], b: [hx + P.face * 70, hy + (Math.random() - 0.5) * 20], t: 0.18, seed: Math.random() * 1000 });
  shake = Math.max(shake, 0.12);
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.life -= dt; if (p.g) p.vy += p.g * dt; p.x += p.vx * dt; if (p.vy) p.y += p.vy * dt;
    p.fx.update(dt); p.fx.options.x = p.x; p.fx.options.y = p.y;
    let gone = p.life <= 0;
    const tip = p.x + Math.sign(p.vx) * 4, tt = tileAt(Math.floor(tip / T), Math.floor(p.y / T));
    if (!gone && (p.kind === "shot" ? tt === GR || tt === IC : SOLID(tt))) {
      gone = true;
      const pal = p.kind === "fire" ? undefined : p.kind === "ice" ? SPARK_ICE : p.spark || ["#2a0a3a", "#5a1a7a", "#9a40c8", "#d080f0", "#f0c0ff", "#ffffff", "#ffffff"];
      spawn(hitSpark, { x: tip, y: p.y + 6, flip: p.vx > 0, ...(pal ? { palette: pal } : {}) });
    }
    if (!gone && p.kind === "shot") {
      if (box([p.x - 4, p.y - 4, 8, 8], heroBox())) { gone = true; hurt(p.cause || "curse", p.x); }
    }
    if (!gone && p.kind !== "shot") {
      for (const e of enemies) {
        if (!e.alive) continue;
        if (!box([p.x - 7, p.y - 7, 14, 14], enemyBox(e))) continue;
        gone = true;
        if (p.kind === "fire") {
          if (e.kind === "skull" && e.frozenT <= 0) { spawn(hitSpark, { x: p.x, y: p.y + 6, flip: p.vx > 0 }); spawn(damageNumber, { x: e.x, y: e.y - 60, text: "IMMUNE", palette: GOLD }); }
          else killEnemy(e, "fire");
        } else {
          if (e.frozenT > 0 || e.kind === "skull") killEnemy(e, "ice");
          else { e.frozenT = 5; e.ice = freezeFx(e); spawn(hitSpark, { x: p.x, y: p.y + 6, flip: p.vx > 0, palette: SPARK_ICE }); score += 20; }
        }
        break;
      }
      if (!gone) for (const A of arenas) {
        if (!A.locked || !bossHittable(A.boss) || !box([p.x - 7, p.y - 7, 14, 14], bossBox(A.boss))) continue;
        gone = true;
        damageBoss(A, 1, p.kind, p.x, p.y);
        break;
      }
    }
    if (gone) projectiles.splice(i, 1);
  }
}

// ---------------- enemies ----------------
function updateEnemies(dt) {
  const hcx = P.x + 6, hcy = P.y + P.h / 2;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (e.frozenT > 0) {
      e.frozenT -= dt;
      if (e.frozenT <= 0) { e.ice = null; spawn(hitSpark, { x: e.x, y: e.y - 8, palette: SPARK_ICE }); }
      else {
        e.ice.x = e.x + (e.frozenT < 1 ? (Math.floor(e.frozenT * 30) % 2 ? 1 : -1) : 0);
        e.ice.y = e.y;
        // standing on a frozen block is safe; touching it from the side is too
        continue;
      }
    }
    e.t += dt;
    const near = Math.abs(hcx - e.x) < 260;
    if (e.kind === "slime" || e.kind === "snake" || e.kind === "frog") {
      const sp = e.kind === "slime" ? 22 : e.kind === "snake" ? 40 : 12;
      e.x += e.dir * sp * dt;
      if (e.x < e.x0) { e.x = e.x0; e.dir = 1; }
      if (e.x > e.x1) { e.x = e.x1; e.dir = -1; }
    } else if (e.kind === "bat" && e.homing) {
      const dx = hcx - e.x, dy = hcy + 8 - e.y, d = Math.hypot(dx, dy) || 1;
      e.x += (dx / d) * 50 * dt; e.y += (dy / d) * 40 * dt + Math.sin(e.t * 6) * 0.6; e.dir = dx < 0 ? -1 : 1;
    } else if (e.kind === "bat") {
      e.x += e.dir * 34 * dt;
      if (e.x < e.x0) { e.x = e.x0; e.dir = 1; }
      if (e.x > e.x1) { e.x = e.x1; e.dir = -1; }
      e.y = e.by + Math.sin(e.t * 2.2) * 12;
    } else if (e.kind === "skull") {
      e.cool -= dt;
      if (!e.dive && e.cool <= 0 && near && Math.abs(hcx - e.x) < 170) { e.dive = { t: 0, tx: hcx, ty: P.y + P.h + 40 }; }
      if (e.dive) {
        e.dive.t += dt;
        const tx = e.dive.t < 0.9 ? e.dive.tx : e.hx, ty = e.dive.t < 0.9 ? e.dive.ty : e.hyHome, sp = e.dive.t < 0.9 ? 120 : 55;
        const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
        if (d > 1) { e.x += (dx / d) * Math.min(d, sp * dt); e.y += (dy / d) * Math.min(d, sp * dt); }
        e.dir = dx < 0 ? -1 : 1;
        if (e.dive.t > 0.9 && d < 2) { e.dive = null; e.cool = 2.4 + Math.random(); }
      } else { e.y = e.hyHome + Math.sin(e.t * 1.7) * 6; e.dir = hcx < e.x ? -1 : 1; }
    } else if (e.kind === "ghost") {
      if (near && Math.abs(hcx - e.x) < 220) {
        const dx = hcx - e.x, dy = P.y + P.h + 6 - e.y, d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * 26 * dt; e.y += (dy / d) * 20 * dt; e.dir = dx < 0 ? -1 : 1;
      }
    } else if (e.kind === "eyeball") {
      e.cool -= dt; e.dir = hcx < e.x ? -1 : 1;
      if (e.cool <= 0 && near && Math.abs(hcx - e.x) < 220 && Math.abs(hcy - (e.y - 48)) < 70) {
        e.cool = 2.6;
        const sx = e.x + e.dir * 12, sy = e.y - 48;
        const dx = hcx - sx, dy = hcy - sy, d = Math.hypot(dx, dy) || 1;
        projectiles.push({ kind: "shot", x: sx, y: sy, vx: (dx / d) * 110, vy: (dy / d) * 110, life: 3, fx: createFx(plasmaShot, { x: sx, y: sy, flip: dx < 0, angle: (dx < 0 ? -1 : 1) * Math.atan2(dy, Math.abs(dx)), palette: ["#140620", "#3a0f5e", "#6a1d9c", "#a03ad6", "#d46cf2", "#f2a8ff", "#ffe2ff", "#ffffff"] }) });
      }
    }
  }
}

function heroVsEnemies() {
  if (state !== "play" || P.dead) return;
  const hb = heroBox();
  for (const e of enemies) {
    if (!e.alive) continue;
    const b = enemyBox(e);
    if (!box(hb, b)) continue;
    if (e.frozenT > 0) {
      if (!PLATFORM_WHEN_FROZEN[e.kind] && P.vy > 40 && P.y + P.h - b[1] < 12) { killEnemy(e, "ice"); P.vy = down(...JUMP) ? -360 : -250; }
      continue;
    }
    if (statusIs("electrified")) { spawn(zapHit, { x: e.x, y: b[1] + b[3] / 2 }); killEnemy(e, "zap"); continue; }
    const feet = P.y + P.h;
    if (STOMPABLE[e.kind] && P.vy > 40 && feet - b[1] < 12) {
      killEnemy(e, "stomp");
      spawn(hitSpark, { x: e.x, y: b[1] + 4, angle: -Math.PI / 2, aim: 0 });
      P.vy = down(...JUMP) ? -380 : -260;
      continue;
    }
    const cause = e.kind === "skull" ? (e.palette === BLUE_FIRE ? "ice" : "fire") : e.kind === "ghost" ? "curse" : "hit";
    hurt(cause, e.x);
  }
}

// ---------------- bosses ----------------
// Each stage has a mid boss and an end boss: Old Croaker and Duskwing in Dusk Meadow, King Gloop and Rimeskull in
// Frost Hollow, and the Hollow Eye guarding the chest at the end of Haunted Grove. Entering an arena seals it, shows the boss's health bar, and if the hero
// dies the arena reopens and the boss resets. Both are pixelfx critters drawn at twice their size.
const BOSS_GRAV = 1100;
const WHITE7 = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"];
const RED7B = ["#2a0606", "#5a0c0c", "#9a1818", "#d43a2a", "#ff6a4a", "#ffb09a", "#ffe8e0"];
const SHOT_PAL = ["#140620", "#3a0f5e", "#6a1d9c", "#a03ad6", "#d46cf2", "#f2a8ff", "#ffe2ff", "#ffffff"];
const ROOT_PAL = ["#06141a", "#0c2a30", "#145050", "#1e7a6e", "#34b096", "#7ae8c8", "#d4fff0", "#ffffff"];
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
let arenas = [], hazards = [];

function makeGloop(A) {
  return { kind: "gloop", name: "King Gloop", hp: 14, max: 14, x: (A.x0 + A.x1) / 2 + 40, y: A.floor, vx: 0, vy: 0, dir: -1,
    state: "wait", t: 0, anim: 0, flash: 0, touchCool: 0, hops: 0, phase: 1, sx: 1, sy: 1, deathT: 0, big: false };
}
function makeEye(A) {
  const homeY = A.floor - 74;
  return { kind: "eye", name: "The Hollow Eye", hp: 28, max: 28, x: (A.x0 + A.x1) / 2, cy: A.floor + 40, homeY, dir: -1,
    state: "wait", t: 0, anim: 0, flash: 0, touchCool: 0, phase: 1, phaseShown: 1, atk: 1.2, seq: 0, queue: [], stunT: 0,
    shakeX: 0, tx: 0, deathT: 0, nextPop: 0, boom: false };
}
function makeArena(spec) { return { ...spec, locked: false, cleared: false, boss: BOSSES[spec.kind].make(spec) }; }
const setB = (B, s) => { B.state = s; B.t = 0; };
const bossBox = (B) => BOSSES[B.kind].box(B);
const bossHittable = (B) => !["wait", "intro", "dying", "dead"].includes(B.state);
const lockedArena = () => arenas.find((A) => A.locked) || null;

function lockArena(A) {
  A.locked = true;
  const B = A.boss;
  setB(B, "intro");
  // clear ordinary enemies out of the arena so it's a one-on-one fight
  for (const e of enemies) if (e.alive && e.x > A.x0 - 200 && e.x < A.x1 + 40) { e.alive = false; spawn(poof, { x: e.x, y: e.y, palette: SMOKE }); }
  BOSSES[B.kind].intro(A);
}
function resetArena(A) {
  A.locked = false;
  A.boss = BOSSES[A.kind].make(A);
  for (const e of enemies) if (e.minion) e.alive = false;
  hazards = []; windVX = 0;
}

function damageBoss(A, amount, how, px, py) {
  const B = A.boss;
  if (!bossHittable(B)) return false;
  let dmg = amount;
  const def = BOSSES[B.kind], m = def.mult[how];
  if (m !== undefined) dmg = amount * m;
  if (def.onHit) def.onHit(B, how);
  spawn(hitSpark, { x: px, y: py, flip: px < B.x, ...(how === "ice" ? { palette: SPARK_ICE } : how === "zap" ? { palette: SPARK_ZAP } : {}) });
  if (dmg === 0) { spawn(damageNumber, { x: px, y: py - 10, text: "RESIST", palette: ICE }); return true; }
  B.hp = Math.max(0, B.hp - dmg); B.flash = 0.12;
  spawn(damageNumber, { x: px, y: py - 10, text: "-" + dmg, ...(dmg > amount ? { palette: GOLD } : {}) });
  score += 10 * dmg; shake = Math.max(shake, 0.08);
  if (B.hp <= 0) { setB(B, "dying"); B.deathT = 0; B.nextPop = 0; hazards = hazards.filter((h) => h.kind !== "strike"); shake = 0.4; }
  return true;
}

// ---- King Gloop
function updateGloop(A, dt) {
  const B = A.boss, hx = P.x + 6;
  B.t += dt; B.flash = Math.max(0, B.flash - dt); B.touchCool = Math.max(0, B.touchCool - dt);
  if (B.state !== "air") B.anim += dt;
  switch (B.state) {
    case "wait": case "dead": return;
    case "dying":
      B.deathT += dt; B.sx = 1 + Math.sin(B.deathT * 45) * 0.06; B.sy = 1 - Math.min(0.35, B.deathT * 0.25);
      if (B.deathT > 1.3) gloopDefeated(A);
      return;
    case "intro":
      B.dir = hx < B.x ? -1 : 1;
      if (B.t > 1.4) setB(B, "idle");
      break;
    case "idle":
      B.dir = hx < B.x ? -1 : 1;
      B.sx += (1 - B.sx) * Math.min(1, dt * 10); B.sy += (1 - B.sy) * Math.min(1, dt * 10);
      if (B.t > (B.phase > 1 ? 0.45 : 0.8)) setB(B, "squash");
      break;
    case "squash": {
      const k = Math.min(1, B.t / 0.35);
      B.sx = 1 + 0.18 * k; B.sy = 1 - 0.25 * k;
      if (B.t > 0.35) {
        B.hops++; B.big = B.hops % 3 === 0;
        const vy = B.big ? -490 : -390, air = (2 * -vy) / BOSS_GRAV, tx = clampN(hx, A.x0 + 34, A.x1 - 34);
        B.vx = (tx - B.x) / air; B.vy = vy; B.sx = 0.82; B.sy = 1.22;
        setB(B, "air");
      }
      break;
    }
    case "air":
      B.vy += BOSS_GRAV * dt; B.x += B.vx * dt; B.y += B.vy * dt;
      B.x = clampN(B.x, A.x0 + 26, A.x1 - 26);
      B.sx += (0.92 - B.sx) * Math.min(1, dt * 6); B.sy += (1.08 - B.sy) * Math.min(1, dt * 6);
      if (B.vy > 0 && B.y >= A.floor) { B.y = A.floor; gloopLand(A); setB(B, "land"); }
      break;
    case "land": {
      const k = Math.min(1, B.t / 0.3);
      B.sx = 1.3 - 0.3 * k; B.sy = 0.7 + 0.3 * k;
      if (B.t > 0.3) setB(B, "idle");
      break;
    }
  }
  if (B.phase === 1 && B.hp <= B.max / 2 && B.state !== "air") { B.phase = 2; gloopSplit(A); }
}
function gloopLand(A) {
  const B = A.boss, reach = B.big ? 170 : 118, height = B.big ? 34 : 24;
  shake = B.big ? 0.4 : 0.25;
  puff(B.x, A.floor, 14, 160, "#e8f4ff");
  for (const dir of [-1, 1]) {
    const ox = B.x + dir * 20;
    hazards.push({ kind: "spikes", ox, dir, reach, floor: A.floor, t: 0, fx: createFx(iceSpikes, { x: ox, y: A.floor, flip: dir < 0, reach, height, seed: (Math.random() * 99) | 0 }) });
  }
}
function gloopSplit(A) {
  const B = A.boss;
  B.flash = 0.3; shake = 0.3;
  say("", "King Gloop splits! Clear the little ones or keep hitting the king.", 3000);
  for (const dx of [-34, 34]) {
    const x = clampN(B.x + dx, A.x0 + 24, A.x1 - 24);
    const e = makeEnemy({ kind: "slime", area: 1, x, x0: A.x0 + 20, x1: A.x1 - 20 });
    e.minion = true; e.dir = dx < 0 ? -1 : 1;
    enemies.push(e);
    spawn(poof, { x, y: A.floor, palette: ICE.slice(1) });
  }
}
function gloopDefeated(A) {
  const B = A.boss;
  setB(B, "dead"); A.locked = false; A.cleared = true; hazards = [];
  for (const e of enemies) if (e.minion && e.alive) killEnemy(e, "ice");
  spawn(snowflakeBurst, { x: B.x, y: A.floor });
  for (const dx of [-18, 0, 18]) spawn(poof, { x: B.x + dx, y: A.floor - (dx ? 4 : 10), palette: ICE.slice(1) });
  spawn(damageNumber, { x: B.x, y: A.floor - 52, text: "+1500", palette: GOLD });
  score += 1500; shake = 0.5;
  hearts.push({ x: B.x, y: A.floor, b: bakeOf(heartPickup, {}, true) });
  for (let i = 0; i < 6; i++) { const x = B.x - 50 + i * 20; coins.push({ x, y: A.floor - 30 - Math.round(Math.sin((i / 5) * Math.PI) * 18), ph: i * 0.3, b: bakeOf(coinSpin, { seed: 1 + (i % 3) }, true) }); }
  say("King Gloop melts!", "The way to Crystal Lake is open.", 4000);
}
const CROWN = ["..y....y....y..", ".yYy..yYy..yYy.", ".yYYyyYYYyyYYy.", ".yYYYYYYYYYYYy.", ".yRYYYYBYYYYRy.", ".yyyyyyyyyyyyy."];
const CROWN_PAL = { y: 0xff0e5a8a, Y: 0xff4ac8f5, R: 0xff4a34e8, B: 0xfff4c862 };
function drawGloop(A) {
  const B = A.boss;
  if (B.state === "dead") return;
  if (B.state === "dying" && Math.floor(B.deathT * 20) % 3 === 0) return;
  const b = bakeOf(slime, { seed: 1, hop: 0, palette: B.flash > 0 ? WHITE7 : AREAS[1].pal.slime, flip: B.dir < 0 });
  const top = blitScaled(frame, b, B.anim, B.x, B.y, 2 * B.sx, 2 * B.sy);
  // the crown rides the top of his head, tipped back while he's in the air
  const cx = Math.round(B.x - CROWN[0].length + (B.dir < 0 ? 3 : -3)), cy = Math.round(top) - 9 + (B.state === "air" ? 1 : 0);
  for (let y = 0; y < CROWN.length; y++) for (let x = 0; x < CROWN[0].length; x++) {
    const ch = CROWN[y][x]; if (ch === ".") continue;
    for (let k = 0; k < 4; k++) {
      const px = cx + x * 2 + (k & 1) - frame.ox, py = cy + y * 2 + (k >> 1) - frame.oy;
      if (px >= 0 && py >= 0 && px < W && py < H) frame.color[py * W + px] = B.flash > 0 ? 0xffffffff : CROWN_PAL[ch];
    }
  }
}

// ---- The Hollow Eye
function updateEye(A, dt) {
  const B = A.boss, hx = P.x + 6;
  B.t += dt; B.anim += dt; B.flash = Math.max(0, B.flash - dt); B.touchCool = Math.max(0, B.touchCool - dt); B.shakeX = 0;
  if (B.state === "wait" || B.state === "dead") return;
  if (B.state === "dying") {
    B.deathT += dt; B.shakeX = (Math.random() - 0.5) * 6; shake = Math.max(shake, 0.12);
    if (B.deathT > B.nextPop) { B.nextPop += 0.22; spawn(poof, { x: B.x + (Math.random() - 0.5) * 50, y: B.cy + 10 + (Math.random() - 0.5) * 30, palette: SHOT_PAL.slice(2) }); }
    if (!B.boom && B.deathT > 1.5) { B.boom = true; spawn(plasmaExplosion, { x: B.x, y: B.cy }); shake = 0.6; }
    if (B.deathT > 2.1) eyeDefeated(A);
    return;
  }
  B.phase = B.hp > B.max * 0.6 ? 1 : B.hp > B.max * 0.3 ? 2 : 3;
  if (B.phase > B.phaseShown) {
    B.phaseShown = B.phase; B.flash = 0.3; shake = 0.3;
    spawn(manaBurst, { x: B.x, y: B.cy + 24, palette: SHOT_PAL });
    say("", B.phase === 2 ? "The eye calls up the restless dead!" : "It's diving now. Keep moving!", 3000);
  }
  for (let i = B.queue.length - 1; i >= 0; i--) { const q = B.queue[i]; q.t -= dt; if (q.t <= 0) { B.queue.splice(i, 1); q.f(); } }
  if (B.stunT > 0) { B.stunT -= dt; return; }
  switch (B.state) {
    case "intro": {
      const k = Math.min(1, B.t / 1.6);
      B.cy = A.floor + 40 + (B.homeY - A.floor - 40) * (1 - (1 - k) ** 3);
      if (B.t > 2) setB(B, "float");
      break;
    }
    case "float": {
      const sp = [0, 34, 48, 62][B.phase];
      B.x += B.dir * sp * dt;
      if (B.x < A.x0 + 60) B.dir = 1;
      if (B.x > A.x1 - 60) B.dir = -1;
      B.cy += (B.homeY + Math.sin(B.t * 1.6) * 8 - B.cy) * Math.min(1, dt * 3);
      B.atk -= dt;
      if (B.atk <= 0) eyeAttack(A);
      break;
    }
    case "telegraph":
      B.shakeX = (Math.random() - 0.5) * 4;
      if (B.t > 0.7) { B.tx = clampN(hx, A.x0 + 40, A.x1 - 40); setB(B, "dive"); }
      break;
    case "dive": {
      const ty = A.floor - 30, dx = B.tx - B.x, dy = ty - B.cy, d = Math.hypot(dx, dy), step = 300 * dt;
      if (d <= step) { B.x = B.tx; B.cy = ty; eyeSlam(A); setB(B, "dizzy"); }
      else { B.x += (dx / d) * step; B.cy += (dy / d) * step; }
      break;
    }
    case "dizzy":
      if (B.t > 1.7) setB(B, "rise");
      break;
    case "rise":
      B.cy += (B.homeY - B.cy) * Math.min(1, dt * 2.5);
      if (Math.abs(B.cy - B.homeY) < 2) { setB(B, "float"); B.atk = 0.8; }
      break;
  }
}
function eyeShot(A, angle) {
  const B = A.boss, sx = B.x, sy = B.cy + 4, sp = 100 + 15 * B.phase, vx = Math.cos(angle) * sp, vy = Math.sin(angle) * sp;
  projectiles.push({ kind: "shot", x: sx, y: sy, vx, vy, life: 4, fx: createFx(plasmaShot, { x: sx, y: sy, flip: vx < 0, angle: (vx < 0 ? -1 : 1) * Math.atan2(vy, Math.abs(vx)), palette: SHOT_PAL }) });
}
const aimAt = (A) => Math.atan2(P.y + P.h / 2 - (A.boss.cy + 4), P.x + 6 - A.boss.x);
function strikeAt(A, x) {
  x = clampN(x, A.x0 + 16, A.x1 - 16);
  hazards.push({ kind: "strike", x, floor: A.floor, t: 0, fx: createFx(lightningStrike, { x, y: A.floor, seed: (Math.random() * 99) | 0 }) });
}
function eyeAttack(A) {
  const B = A.boss, ph = B.phase, q = (t, f) => B.queue.push({ t, f });
  const list = ph === 1 ? ["volley", "strike"] : ph === 2 ? ["volley", "summon", "strike", "volley"] : ["dive", "volley", "strike", "summon"];
  const atk = list[B.seq++ % list.length];
  B.atk = [0, 2.4, 2.0, 1.7][ph];
  if (atk === "volley") {
    if (ph === 1) for (let k = 0; k < 3; k++) q(k * 0.28, () => eyeShot(A, aimAt(A)));
    else {
      q(0, () => { const a = aimAt(A); for (let k = -2; k <= 2; k++) eyeShot(A, a + k * 0.3); });
      if (ph === 3) q(0.7, () => eyeShot(A, aimAt(A)));
    }
  } else if (atk === "strike") {
    const n = ph === 1 ? 1 : ph === 2 ? 2 : 3;
    for (let k = 0; k < n; k++) q(k * 0.35, () => strikeAt(A, P.x + 6 + (k === 0 ? 0 : (k % 2 ? 1 : -1) * 58)));
  } else if (atk === "summon") {
    const alive = enemies.filter((e) => e.minion && e.alive).length;
    if (alive >= 2) { B.atk = 0.4; return; }
    const x = P.x + 6 < (A.x0 + A.x1) / 2 ? A.x1 - 50 : A.x0 + 50;
    spawn(spawnPortal, { x, y: A.floor });
    q(1.0, () => {
      const e = makeEnemy({ kind: "ghost", area: 3, x, gy: A.floor - 40, x0: x, x1: x });
      e.minion = true; enemies.push(e);
      spawn(poof, { x, y: A.floor - 10, palette: ["#10142a", "#3e4f86", "#a3b8e2", "#d8e4ff", "#ffffff", "#ffffff"] });
    });
  } else if (atk === "dive") setB(B, "telegraph");
}
function eyeSlam(A) {
  const B = A.boss;
  shake = 0.45;
  puff(B.x, A.floor, 16, 180);
  for (const dir of [-1, 1]) {
    const ox = B.x + dir * 18;
    hazards.push({ kind: "spikes", ox, dir, reach: 96, floor: A.floor, t: 0, fx: createFx(iceSpikes, { x: ox, y: A.floor, flip: dir < 0, reach: 96, height: 22, palette: ROOT_PAL, seed: (Math.random() * 99) | 0 }) });
  }
}
function eyeDefeated(A) {
  const B = A.boss;
  setB(B, "dead"); A.locked = false; A.cleared = true; hazards = [];
  for (const e of enemies) if (e.minion && e.alive) killEnemy(e, "zap");
  revealChest(A, "+5000", 5000, "The Hollow Eye falls!", `Open the chest to clear Stage ${stageI + 1}.`);
}
function drawEye(A) {
  const B = A.boss;
  if (B.state === "wait" || B.state === "dead") return;
  if (B.state === "dying" && B.boom) return;
  const pal = B.flash > 0 ? { palette: WHITE7, flesh: WHITE7, iris: WHITE7 } : B.stunT > 0 ? { palette: ICE, flesh: ICE, iris: ICE } : B.state === "telegraph" ? { flesh: RED7B } : {};
  const b = bakeOf(eyeball, { seed: 2, flip: P.x + 6 < B.x, ...pal });
  const x = B.x + B.shakeX, feet = B.cy + 96;
  blitScaled(frame, b, B.anim, x, feet, 2, 2, A.floor + 2);
  // a violet glow round it, angrier as it weakens, red while it winds up a dive
  const col = B.state === "telegraph" ? [255, 60, 50] : [170, 80, 255], k0 = 0.35 + 0.15 * (B.phase - 1);
  addGlow(x, B.cy, 34, col, k0);
  if (B.state === "dizzy") for (let i = 0; i < 3; i++) {
    const a = time * 5 + (i * Math.PI * 2) / 3, sx = x + Math.cos(a) * 20, sy = B.cy - 30 + Math.sin(a) * 5;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) plot(sx + dx, sy + dy, 0xff6be2ff);
  }
}

// ---- Old Croaker (Stage 1 mid boss): a giant frog that leaps, lashes its tongue and lobs spit
const CROAK_K = 2.4;
const SPIT_PAL = ["#06140a", "#123a14", "#1f6a20", "#3aa030", "#7ad04a", "#c8f080", "#f0ffd0", "#ffffff"];
const DUSK_PAL = ["#1a0612", "#3a0c26", "#6a1a40", "#a8305a", "#e05a7a", "#ffa0b0", "#ffe0e8", "#ffffff"];
function makeCroaker(A) {
  return { kind: "croaker", name: "Old Croaker", hp: 16, max: 16, x: (A.x0 + A.x1) / 2 + 50, y: A.floor, vx: 0, vy: 0, dir: -1,
    state: "wait", t: 0, anim: 0, flash: 0, touchCool: 0, phase: 1, seq: 0, slowT: 0, tongue: 0, spat: false, deathT: 0 };
}
function croakerMouth(B) { return [B.x + B.dir * 28, B.y - 20]; }
function updateCroaker(A, dt) {
  const B = A.boss, hx = P.x + 6;
  B.slowT = Math.max(0, B.slowT - dt);
  const k = B.slowT > 0 ? 0.55 : 1, ds = dt * k;
  B.t += ds; B.anim += ds; B.flash = Math.max(0, B.flash - dt); B.touchCool = Math.max(0, B.touchCool - dt);
  switch (B.state) {
    case "wait": case "dead": return;
    case "dying":
      B.deathT += dt;
      if (B.deathT > 1.3) croakerDefeated(A);
      return;
    case "intro":
      B.dir = hx < B.x ? -1 : 1;
      if (B.t > 1.4) setB(B, "idle");
      break;
    case "idle": {
      B.dir = hx < B.x ? -1 : 1;
      if (B.t < (B.phase > 1 ? 0.55 : 0.9)) break;
      const near = Math.abs(hx - B.x) < 150 && Math.abs(P.y + P.h - B.y) < 30;
      const next = ["leap", "tongue", "spit"][B.seq++ % 3];
      setB(B, next === "tongue" && !near ? "crouch" : next === "tongue" ? "aim" : next === "leap" ? "crouch" : "spit");
      B.spat = false;
      break;
    }
    case "crouch":
      if (B.t > 0.35) {
        const vy = -470, air = (2 * -vy) / BOSS_GRAV, tx = clampN(hx, A.x0 + 34, A.x1 - 34);
        B.vx = (tx - B.x) / air; B.vy = vy;
        setB(B, "air");
      }
      break;
    case "air":
      B.vy += BOSS_GRAV * ds; B.x += B.vx * ds; B.y += B.vy * ds;
      B.x = clampN(B.x, A.x0 + 30, A.x1 - 30);
      if (B.vy > 0 && B.y >= A.floor) {
        B.y = A.floor; setB(B, "land");
        shake = 0.3; puff(B.x, A.floor, 14, 150);
        // the thump throws a ripple of dust both ways along the ground
        for (const dir of [-1, 1]) hazards.push({ kind: "ripple", ox: B.x + dir * 24, dir, reach: 90, floor: A.floor, t: 0, fx: rippleFx(B.x + dir * 24, A.floor, dir, 90) });
      }
      break;
    case "land":
      if (B.t > 0.5) setB(B, "idle");
      break;
    case "aim":
      if (B.t > 0.45) setB(B, "lash");
      break;
    case "lash": {
      const u = Math.min(1, B.t / 0.42);
      B.tongue = 150 * Math.sin(Math.PI * u);
      const [mx, my] = croakerMouth(B), tip = mx + B.dir * B.tongue;
      if (box(heroBox(), [Math.min(mx, tip), my - 4, Math.abs(tip - mx), 8])) hurt("hit", tip);
      if (B.t > 0.42) { B.tongue = 0; setB(B, "idle"); }
      break;
    }
    case "spit":
      if (!B.spat && B.t > 0.35) {
        B.spat = true;
        const n = B.phase > 1 ? 5 : 3, [mx, my] = croakerMouth(B);
        for (let i = 0; i < n; i++) {
          const tx = clampN(hx + (i - (n - 1) / 2) * 34, A.x0 + 10, A.x1 - 10), T = 0.85 + i * 0.06, g = 520;
          const vx = (tx - mx) / T, vy = (A.floor - 6 - my) / T - 0.5 * g * T;
          projectiles.push({ kind: "shot", cause: "hit", spark: SPIT_PAL, g, x: mx, y: my, vx, vy, life: 3, fx: createFx(plasmaShot, { x: mx, y: my, flip: vx < 0, palette: SPIT_PAL }) });
        }
      }
      if (B.t > 0.75) setB(B, "idle");
      break;
  }
  if (B.phase === 1 && B.hp <= B.max / 2 && B.state !== "air") {
    B.phase = 2; B.flash = 0.3; shake = 0.3;
    say("", "Old Croaker calls his tadpoles! Little frogs incoming.", 3000);
    for (const dx of [-60, 60]) {
      const x = clampN(B.x + dx, A.x0 + 24, A.x1 - 24), e = makeEnemy({ kind: "frog", area: 0, x, x0: A.x0 + 20, x1: A.x1 - 20 });
      e.minion = true; enemies.push(e); spawn(poof, { x, y: A.floor, palette: SPIT_PAL.slice(1, 7) });
    }
  }
}
function rippleFx(x, floor, dir, reach) {
  // a low wave of dust rolling along the ground
  let t = 0;
  return {
    options: {}, update(dt) { t += dt; }, done: () => t > 0.6,
    draw(fr) {
      const front = x + dir * reach * Math.min(1, t / 0.5);
      for (let i = 0; i < 18; i++) {
        const px = front - dir * i * 2, h = Math.max(0, 7 - i * 0.4) * (1 - t / 0.6);
        for (let y = 0; y < h; y++) plot(px, floor - y - 1, y > h - 2 ? 0xffd8cfe6 : 0xff8a7fa0);
      }
    },
  };
}
function croakerDefeated(A) {
  const B = A.boss;
  setB(B, "dead"); A.locked = false; A.cleared = true; hazards = [];
  for (const e of enemies) if (e.minion && e.alive) killEnemy(e, "stomp");
  for (const dx of [-20, 0, 20]) spawn(poof, { x: B.x + dx, y: A.floor - (dx ? 4 : 12), palette: SPIT_PAL.slice(1, 7) });
  spawn(collectBurst, { x: B.x, y: A.floor - 10, palette: SPIT_PAL });
  spawn(damageNumber, { x: B.x, y: A.floor - 52, text: "+1500", palette: GOLD });
  score += 1500; shake = 0.5;
  hearts.push({ x: B.x, y: A.floor, b: bakeOf(heartPickup, {}, true) });
  for (let i = 0; i < 6; i++) { const x = B.x - 50 + i * 20; coins.push({ x, y: A.floor - 30 - Math.round(Math.sin((i / 5) * Math.PI) * 18), ph: i * 0.3, b: bakeOf(coinSpin, { seed: 1 + (i % 3) }, true) }); }
  say("Old Croaker croaks!", "Onward to the Duskwood edge.", 4000);
}
function drawCroaker(A) {
  const B = A.boss;
  if (B.state === "wait" || B.state === "dead") return;
  if (B.state === "dying" && Math.floor(B.deathT * 20) % 3 === 0) return;
  const t = B.state === "crouch" || B.state === "aim" ? 1.12 : B.state === "air" ? 1.25 : B.state === "spit" ? 0.2 + Math.min(0.3, B.t) : B.anim % 0.85;
  const pal = B.flash > 0 ? { palette: WHITE7, belly: WHITE7 } : B.slowT > 0 ? { palette: ICE, belly: ICE } : {};
  blitScaled(frame, bakeOf(frog, { seed: 3, flip: B.dir < 0, ...pal }), t, B.x, B.y, CROAK_K, CROAK_K);
  if (B.state === "aim") addGlow(...croakerMouth(B), 14, [255, 90, 120], 0.5);
  if (B.tongue > 1) {
    const [mx, my] = croakerMouth(B), tip = mx + B.dir * B.tongue;
    for (let x = 0; x <= B.tongue; x++) {
      const px = mx + B.dir * x;
      for (let y = -2; y <= 2; y++) plot(px, my + y, Math.abs(y) === 2 ? 0xff3a2a8a : 0xff7a60e8);
    }
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) plot(tip + x, my + y, x * x + y * y > 9 ? 0xff3a2a8a : 0xff9a88ff);
  }
}

// ---- Duskwing (Stage 1 end boss): a giant bat that swoops, sends its swarm and rains thorn seeds
const DUSK_K = 2.4;
function makeDusk(A) {
  return { kind: "dusk", name: "Duskwing", hp: 26, max: 26, x: A.x1 - 60, cy: A.floor - 210, homeY: A.floor - 100, dir: -1,
    state: "wait", t: 0, anim: 0, flash: 0, touchCool: 0, phase: 1, phaseShown: 1, atk: 1.4, seq: 0, queue: [], stunT: 0, path: null, deathT: 0, nextPop: 0 };
}
function updateDusk(A, dt) {
  const B = A.boss, hx = P.x + 6;
  B.t += dt; B.anim += dt; B.flash = Math.max(0, B.flash - dt); B.touchCool = Math.max(0, B.touchCool - dt);
  if (B.state === "wait" || B.state === "dead") return;
  if (B.state === "dying") {
    B.deathT += dt; B.cy = Math.min(A.floor - 18, B.cy + dt * 90); shake = Math.max(shake, 0.1);
    if (B.deathT > B.nextPop) { B.nextPop += 0.2; spawn(poof, { x: B.x + (Math.random() - 0.5) * 50, y: B.cy + 10, palette: DUSK_PAL.slice(1, 7) }); }
    if (B.deathT > 1.6) duskDefeated(A);
    return;
  }
  B.phase = B.hp > B.max / 2 ? 1 : 2;
  if (B.phase > B.phaseShown) {
    B.phaseShown = B.phase; B.flash = 0.3; shake = 0.3;
    spawn(manaBurst, { x: B.x, y: B.cy + 20, palette: DUSK_PAL });
    say("", "Duskwing is furious! Watch the ground for falling thorns.", 3000);
  }
  for (let i = B.queue.length - 1; i >= 0; i--) { const q = B.queue[i]; q.t -= dt; if (q.t <= 0) { B.queue.splice(i, 1); q.f(); } }
  if (B.stunT > 0) { B.stunT -= dt; return; }
  switch (B.state) {
    case "intro": {
      const k = Math.min(1, B.t / 1.4);
      B.cy = A.floor - 210 + (B.homeY - A.floor + 210) * (1 - (1 - k) ** 3);
      B.x += ((A.x0 + A.x1) / 2 + 40 - B.x) * Math.min(1, dt * 2);
      B.dir = hx < B.x ? -1 : 1;
      if (B.t > 1.8) setB(B, "hover");
      break;
    }
    case "hover":
      B.dir = hx < B.x ? -1 : 1;
      B.x += (clampN(hx + (B.x < hx ? -50 : 50), A.x0 + 40, A.x1 - 40) - B.x) * Math.min(1, dt * 0.9);
      B.cy += (B.homeY + Math.sin(B.t * 2.2) * 10 - B.cy) * Math.min(1, dt * 3);
      B.atk -= dt;
      if (B.atk <= 0) duskAttack(A);
      break;
    case "telegraph":
      B.cy -= dt * 22;
      if (B.t > 0.55) {
        const sx = B.x, sy = B.cy, lx = clampN(hx, A.x0 + 30, A.x1 - 30), ex = clampN(2 * lx - sx, A.x0 + 40, A.x1 - 40);
        B.path = { sx, sy, lx, ly: A.floor - Math.max(22, P.h - 4), ex, ey: B.homeY, d: B.phase > 1 ? 0.85 : 1.05 };
        setB(B, "swoop");
      }
      break;
    case "swoop": {
      const p = B.path, u = Math.min(1, B.t / p.d);
      // a U through the hero's spot and up the far side
      const a = u < 0.5 ? u * 2 : (u - 0.5) * 2;
      B.x = u < 0.5 ? p.sx + (p.lx - p.sx) * a : p.lx + (p.ex - p.lx) * a;
      B.cy = u < 0.5 ? p.sy + (p.ly - p.sy) * Math.sin((a * Math.PI) / 2) : p.ly + (p.ey - p.ly) * (1 - Math.cos((a * Math.PI) / 2));
      B.dir = p.ex > p.sx ? 1 : -1;
      if (u >= 1) { setB(B, "hover"); B.atk = B.phase > 1 ? 0.9 : 1.3; }
      break;
    }
    case "descend":
      B.cy += (A.floor - 22 - B.cy) * Math.min(1, dt * 4);
      if (B.t > 0.6) { setB(B, "rest"); shake = 0.2; puff(B.x, A.floor, 10, 120); }
      break;
    case "rest":
      if (B.t > (B.phase > 1 ? 1.5 : 2)) setB(B, "rise");
      break;
    case "rise":
      B.cy += (B.homeY - B.cy) * Math.min(1, dt * 2.5);
      if (Math.abs(B.cy - B.homeY) < 3) { setB(B, "hover"); B.atk = 0.8; }
      break;
  }
}
function duskAttack(A) {
  const B = A.boss, ph = B.phase, q = (t, f) => B.queue.push({ t, f });
  const list = ph === 1 ? ["swoop", "swarm", "swoop", "rest"] : ["swoop", "drops", "swarm", "swoop", "drops", "rest"];
  const atk = list[B.seq++ % list.length];
  B.atk = ph === 1 ? 1.6 : 1.2;
  if (atk === "swoop") setB(B, "telegraph");
  else if (atk === "rest") setB(B, "descend");
  else if (atk === "swarm") {
    const alive = enemies.filter((e) => e.minion && e.alive).length, n = Math.min(ph + 1, 4 - alive);
    for (let i = 0; i < n; i++) q(i * 0.3, () => {
      const x = i % 2 ? A.x0 + 20 : A.x1 - 20, e = makeEnemy({ kind: "bat", area: 0, x, by: A.floor - 120, x0: A.x0 + 10, x1: A.x1 - 10 });
      e.minion = true; e.homing = true; enemies.push(e);
      spawn(poof, { x, y: A.floor - 110, palette: DUSK_PAL.slice(1, 7) });
    });
    say("", "Bats! Stomp or blast them.", 1800);
  } else if (atk === "drops") {
    for (let i = 0; i < 4; i++) {
      const x = clampN(hx() + (i - 1.5) * 44 + (Math.random() - 0.5) * 12, A.x0 + 12, A.x1 - 12);
      hazards.push({ kind: "marker", x, floor: A.floor, t: 0, fx: markerFx(x, A.floor, 0.9) });
      q(0.3, () => projectiles.push({ kind: "shot", cause: "hit", spark: DUSK_PAL, g: 900, x, y: A.floor - 175, vx: 0, vy: 60, life: 2, fx: createFx(plasmaShot, { x, y: A.floor - 175, angle: Math.PI / 2, palette: DUSK_PAL }) }));
    }
  }
  function hx() { return P.x + 6; }
}
function markerFx(x, floor, life) {
  // a pulsing red mark on the ground where a thorn will fall
  let t = 0;
  return {
    options: {}, update(dt) { t += dt; }, done: () => t > life,
    draw() {
      const k = Math.floor(t * 12) % 2 ? 0xff4a40ff : 0xff2a20b0;
      for (let dx = -7; dx <= 7; dx++) { plot(x + dx, floor - 1, k); if (Math.abs(dx) < 5) plot(x + dx, floor - 2, k); }
      addGlow(x, floor - 2, 10, [255, 60, 60], 0.35);
    },
  };
}
function duskDefeated(A) {
  const B = A.boss;
  setB(B, "dead"); A.locked = false; A.cleared = true; hazards = [];
  for (const e of enemies) if (e.minion && e.alive) killEnemy(e, "fire");
  spawn(manaBurst, { x: B.x, y: A.floor - 10, palette: DUSK_PAL });
  revealChest(A, "+4000", 4000, "Duskwing is driven off!", "Open the chest to clear Stage 1.");
}
function revealChest(A, label, pts, title, tip) {
  spawn(manaBurst, { x: chest.x, y: chest.y - 6 });
  spawn(collectBurst, { x: chest.x, y: chest.y - 4, palette: GOLD });
  chest.hidden = false;
  spawn(damageNumber, { x: chest.x, y: chest.y - 60, text: label, palette: GOLD });
  score += pts; shake = 0.5;
  say(title, tip, 5000);
}
const batCentroids = new WeakMap();
function bakeCentroid(b, t) {
  // where the bat's body is in this frame, so the boss stays put while the loop drifts it about
  const f = bakedFrame(b, t);
  let c = batCentroids.get(f);
  if (!c) {
    let sx = 0, sy = 0, n = 0;
    for (let y = 0; y <= f.y1 - f.y0; y++) for (let x = 0; x <= f.x1 - f.x0; x++) if (f.color[y * f.cw + x] >>> 24 === 255) { sx += x; sy += y; n++; }
    c = n ? [sx / n + f.x0 - b.ox, sy / n + f.y0 - b.oy] : [0, 0];
    batCentroids.set(f, c);
  }
  return c;
}
function drawDusk(A) {
  const B = A.boss;
  if (B.state === "wait" || B.state === "dead") return;
  if (B.state === "dying" && Math.floor(B.deathT * 20) % 3 === 0) return;
  const resting = B.state === "rest" || B.state === "descend";
  const pal = B.flash > 0 ? { palette: WHITE7, eyes: WHITE7 } : B.stunT > 0 ? { palette: ICE, eyes: ICE } : {};
  const b = bakeOf(bat, { seed: 4, flip: B.dir < 0, ...pal }), t = resting ? 1.8 : B.anim * (B.state === "swoop" ? 1.6 : 1);
  const [cx, cy] = bakeCentroid(b, t);
  blitScaled(frame, b, t, B.x - cx * DUSK_K, B.cy - cy * DUSK_K, DUSK_K, DUSK_K, A.floor + 2);
  addGlow(B.x, B.cy, 30, B.state === "telegraph" ? [255, 60, 60] : [200, 70, 140], B.state === "telegraph" ? 0.55 : 0.25);
  if (B.state === "rest") for (let i = 0; i < 3; i++) {
    const a = time * 5 + (i * Math.PI * 2) / 3, sx = B.x + Math.cos(a) * 18, sy = B.cy - 26 + Math.sin(a) * 4;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) plot(sx + dx, sy + dy, 0xff6be2ff);
  }
}

// ---- Rimeskull (Stage 2 end boss): a giant frost-flame skull that fires ice shards, drops icicles, slams the
// ice and, when hurt, blows a blizzard across the lake
const RIME_K = 2.2, RIME_BONE = ["#0e1a2e", "#22324a", "#3e5670", "#6a86a0", "#a0bcd0", "#d4e8f2", "#f6fcff"];
const ICICLE_FREE = 0.64, ICICLE_HIT = ICICLE_FREE + Math.sqrt((2 * 44) / 950);
let windVX = 0;
function makeRime(A) {
  return { kind: "rime", name: "Rimeskull", hp: 24, max: 24, x: A.x1 - 70, cy: A.floor - 230, homeY: A.floor - 86, dir: -1,
    state: "wait", t: 0, anim: 0, flash: 0, touchCool: 0, phase: 1, phaseShown: 1, atk: 1.4, seq: 0, queue: [], stunT: 0,
    gustDir: 1, slamX: 0, vy: 0, deathT: 0, nextPop: 0 };
}
function updateRime(A, dt) {
  const B = A.boss, hx = P.x + 6;
  B.t += dt; B.anim += dt; B.flash = Math.max(0, B.flash - dt); B.touchCool = Math.max(0, B.touchCool - dt);
  if (B.state === "wait" || B.state === "dead") return;
  if (B.state === "dying") {
    B.deathT += dt; B.cy = Math.min(A.floor - 26, B.cy + dt * 70); shake = Math.max(shake, 0.1);
    if (B.deathT > B.nextPop) { B.nextPop += 0.18; spawn(poof, { x: B.x + (Math.random() - 0.5) * 50, y: B.cy + 10, palette: ICE.slice(1) }); }
    if (B.deathT > 1.6) rimeDefeated(A);
    return;
  }
  B.phase = B.hp > B.max / 2 ? 1 : 2;
  if (B.phase > B.phaseShown) {
    B.phaseShown = B.phase; B.flash = 0.3; shake = 0.3;
    spawn(snowflakeBurst, { x: B.x, y: B.cy + 30 });
    say("", "Rimeskull howls! Walk into the blizzard and watch for icicles.", 3000);
  }
  for (let i = B.queue.length - 1; i >= 0; i--) { const q = B.queue[i]; q.t -= dt; if (q.t <= 0) { B.queue.splice(i, 1); q.f(); } }
  if (B.stunT > 0) { B.stunT -= dt; return; }
  const mid = (A.x0 + A.x1) / 2;
  switch (B.state) {
    case "intro": {
      const k = Math.min(1, B.t / 1.4);
      B.cy = A.floor - 230 + (B.homeY - A.floor + 230) * (1 - (1 - k) ** 3);
      B.x += (mid + 50 - B.x) * Math.min(1, dt * 2);
      B.dir = hx < B.x ? -1 : 1;
      if (B.t > 1.8) setB(B, "hover");
      break;
    }
    case "hover":
      B.dir = hx < B.x ? -1 : 1;
      B.x += (clampN(hx + (B.x < hx ? -70 : 70), A.x0 + 40, A.x1 - 40) - B.x) * Math.min(1, dt * 0.9);
      B.cy += (B.homeY + Math.sin(B.t * 1.8) * 8 - B.cy) * Math.min(1, dt * 3);
      B.atk -= dt;
      if (B.atk <= 0) rimeAttack(A);
      break;
    case "rise":
      // float up over the hero, then shudder before the slam
      B.x += (B.slamX - B.x) * Math.min(1, dt * 5);
      B.cy += (A.floor - 104 - B.cy) * Math.min(1, dt * 5);
      if (B.t > 0.55) setB(B, "shudder");
      break;
    case "shudder":
      if (B.t > (B.phase > 1 ? 0.45 : 0.6)) { B.vy = 0; setB(B, "drop"); }
      break;
    case "drop":
      B.vy += 1400 * dt; B.cy += B.vy * dt;
      if (B.cy >= A.floor - 26) { B.cy = A.floor - 26; rimeSlam(A); setB(B, "stuck"); }
      break;
    case "stuck":
      if (B.t > (B.phase > 1 ? 1.3 : 1.7)) setB(B, "lift");
      break;
    case "lift":
      B.cy += (B.homeY - B.cy) * Math.min(1, dt * 2.5);
      if (Math.abs(B.cy - B.homeY) < 3) { setB(B, "hover"); B.atk = 0.8; }
      break;
    case "gust": {
      // blow from one wall toward the other; the wind pushes the hero while icicles fall
      const wx = B.gustDir > 0 ? A.x0 + 36 : A.x1 - 36;
      B.x += (wx - B.x) * Math.min(1, dt * 3); B.dir = B.gustDir;
      B.cy += (A.floor - 70 - B.cy) * Math.min(1, dt * 3);
      if (B.t > 0.5 && B.t < 3.1) windVX = B.gustDir * 62;
      if (B.t > 0.5 && Math.random() < dt * 30) puff(B.x + B.gustDir * 30, B.cy + 20 + (Math.random() - 0.5) * 30, 1, 30, "#e8f4ff");
      if (B.t > 3.3) { setB(B, "hover"); B.atk = 0.9; }
      break;
    }
  }
}
function rimeAttack(A) {
  const B = A.boss, ph = B.phase, q = (t, f) => B.queue.push({ t, f }), hx = () => P.x + 6;
  const list = ph === 1 ? ["shards", "icicles", "slam"] : ["gust", "shards", "slam", "icicles", "shards", "slam"];
  const atk = list[B.seq++ % list.length];
  B.atk = ph === 1 ? 1.7 : 1.25;
  if (atk === "slam") { B.slamX = clampN(hx(), A.x0 + 30, A.x1 - 30); setB(B, "rise"); }
  else if (atk === "gust") {
    B.gustDir = hx() < (A.x0 + A.x1) / 2 ? -1 : 1; setB(B, "gust");
    say("", "A blizzard! Push against the wind.", 2000);
    for (let i = 0; i < 6; i++) q(0.6 + i * 0.42, () => dropIcicle(A, i % 2 ? hx() : A.x0 + 24 + Math.random() * (A.x1 - A.x0 - 48)));
  } else if (atk === "shards") {
    const n = ph === 1 ? 3 : 5;
    for (let i = 0; i < n; i++) q(0.25 + i * (ph === 1 ? 0.32 : 0.22), () => {
      const sx = B.x, sy = B.cy + 12, dx = hx() - sx, dy = P.y + P.h / 2 - sy, d = Math.hypot(dx, dy) || 1, v = ph === 1 ? 150 : 175;
      const ang = Math.atan2(dy, dx);
      projectiles.push({ kind: "shot", cause: "ice", spark: SPARK_ICE, x: sx, y: sy, vx: (dx / d) * v, vy: (dy / d) * v, life: 3, fx: createFx(plasmaShot, { x: sx, y: sy, angle: ang, palette: SPARK_ICE }) });
      B.flash = 0.05;
    });
  } else if (atk === "icicles") {
    const n = ph === 1 ? 3 : 5;
    for (let i = 0; i < n; i++) q(i * 0.22, () => dropIcicle(A, hx() + (i - (n - 1) / 2) * 38 + (Math.random() - 0.5) * 10));
  }
}
function dropIcicle(A, x) {
  x = clampN(x, A.x0 + 12, A.x1 - 12);
  hazards.push({ kind: "icicle", x, floor: A.floor, t: 0, fx: createFx(icicleFall, { x, y: A.floor, seed: (Math.random() * 99) | 0 }) });
}
function rimeSlam(A) {
  const B = A.boss, reach = B.phase > 1 ? 130 : 96;
  shake = 0.4;
  puff(B.x, A.floor, 14, 160, "#e8f4ff");
  spawn(snowflakeBurst, { x: B.x, y: A.floor });
  for (const dir of [-1, 1]) {
    const ox = B.x + dir * 22;
    hazards.push({ kind: "spikes", ox, dir, reach, floor: A.floor, t: 0, fx: createFx(iceSpikes, { x: ox, y: A.floor, flip: dir < 0, reach, height: 20, seed: (Math.random() * 99) | 0 }) });
  }
}
function rimeDefeated(A) {
  const B = A.boss;
  setB(B, "dead"); A.locked = false; A.cleared = true; hazards = []; windVX = 0;
  projectiles = projectiles.filter((p) => p.kind !== "shot");
  spawn(snowflakeBurst, { x: B.x, y: A.floor });
  spawn(manaBurst, { x: B.x, y: A.floor - 10, palette: SPARK_ICE });
  revealChest(A, "+4500", 4500, "Rimeskull shatters!", `Open the chest to clear Stage ${stageI + 1}.`);
}
function drawRime(A) {
  const B = A.boss;
  if (B.state === "wait" || B.state === "dead") return;
  if (B.state === "dying" && Math.floor(B.deathT * 20) % 3 === 0) return;
  const pal = B.flash > 0 ? { palette: WHITE7, bone: WHITE7 } : { palette: BLUE_FIRE, bone: RIME_BONE };
  const b = bakeOf(skull, { seed: 3, hover: 0, floor: false, flip: B.dir < 0, ...pal });
  const jx = B.state === "shudder" || B.stunT > 0 ? (Math.floor(time * 40) % 2 ? 1.5 : -1.5) : 0;
  blitScaled(frame, b, B.anim, B.x + jx, B.cy, RIME_K, RIME_K, A.floor + 2);
  const warn = B.state === "shudder" || B.state === "rise";
  addGlow(B.x, B.cy, 34, warn ? [255, 80, 80] : B.stunT > 0 ? [255, 230, 110] : [90, 190, 255], warn ? 0.5 : 0.3);
  if (warn) {
    // a shadow on the ice where it will land
    const k = Math.floor(time * 12) % 2 ? 0xff4a40ff : 0xff2a20b0;
    for (let dx = -16; dx <= 16; dx++) { plot(B.slamX + dx, A.floor - 1, k); if (Math.abs(dx) < 11) plot(B.slamX + dx, A.floor - 2, k); }
  }
  if (B.state === "stuck") for (let i = 0; i < 3; i++) {
    const a = time * 5 + (i * Math.PI * 2) / 3, sx = B.x + Math.cos(a) * 20, sy = B.cy - 34 + Math.sin(a) * 4;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) plot(sx + dx, sy + dy, 0xffffe0a0);
  }
  if (B.state === "gust" && B.t > 0.5) for (let i = 0; i < 28; i++) {
    // wind streaks across the arena
    const span = A.x1 - A.x0, u = ((i * 61.7 + B.t * 260) % span), x = B.gustDir > 0 ? A.x0 + u : A.x1 - u, y = A.floor - 8 - ((i * 37) % 130);
    for (let d = 0; d < 7; d++) plot(x - B.gustDir * d, y, d < 3 ? 0xfffff0dd : 0xffd8b890);
  }
}

// ---- the bosses, by kind
const BOSSES = {
  gloop: { make: makeGloop, update: updateGloop, draw: drawGloop, cause: "ice", bar: ["#4fbcf5", "#c8f0ff"], wall: [90, 190, 255], mult: { fire: 2, ice: 0 },
    box: (B) => [B.x - 23 * B.sx, B.y - 32 * B.sy, 46 * B.sx, 32 * B.sy],
    intro: () => { say("King Gloop", "Fire melts him. Jump over the frost lines when he lands.", 5000); shake = 0.3; } },
  eye: { make: makeEye, update: updateEye, draw: drawEye, cause: "curse", bar: ["#b04ae0", "#f0c0ff"], wall: [150, 90, 255], mult: { zap: 2 },
    box: (B) => [B.x - 22 + B.shakeX, B.cy - 22, 46, 44],
    onHit: (B, how) => { if (how === "ice") B.stunT = 1.1; },
    intro: (A) => { spawn(spawnPortal, { x: A.boss.x, y: A.floor }); say("The Hollow Eye", "Zap hits it hardest. Climb the ledges to stomp it.", 5000); } },
  croaker: { make: makeCroaker, update: updateCroaker, draw: drawCroaker, cause: "hit", bar: ["#62b440", "#d8ffb0"], wall: [110, 220, 90], mult: { ice: 2 },
    box: (B) => [B.x - 30, B.y - 42, 60, 42],
    onHit: (B, how) => { if (how === "ice") B.slowT = 2.5; },
    intro: () => { say("Old Croaker", "Ice slows him down. Jump his tongue and stomp his back.", 5000); shake = 0.25; } },
  dusk: { make: makeDusk, update: updateDusk, draw: drawDusk, cause: "hit", bar: ["#c0507a", "#ffc0d8"], wall: [255, 130, 90], mult: { fire: 2 },
    box: (B) => [B.x - 28, B.cy - 20, 56, 36],
    onHit: (B, how) => { if (how === "ice") B.stunT = 1.0; },
    intro: () => { say("Duskwing", "Fire hurts it most. Stomp it from the ledges or when it lands to rest.", 5000); } },
  rime: { make: makeRime, update: updateRime, draw: drawRime, cause: "ice", bar: ["#4fbcf5", "#e6fbff"], wall: [120, 210, 255], mult: { fire: 2, ice: 0 },
    box: (B) => [B.x - 24, B.cy - 26, 48, 52],
    onHit: (B, how) => { if (how === "zap" && B.state === "hover") B.stunT = 0.7; },
    intro: () => { say("Rimeskull", "Fire melts it. Stomp it while it's stuck in the ice.", 5000); shake = 0.3; } },
};

// ---- shared
function plot(x, y, c) { const px = Math.round(x) - frame.ox, py = Math.round(y) - frame.oy; if (px >= 0 && py >= 0 && px < W && py < H) frame.color[py * W + px] = c; }
function addGlow(x, y, r, [cr, cg, cb], k0) {
  const gx = Math.round(x) - frame.ox, gy = Math.round(y) - frame.oy, L = frame.light;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const d = Math.hypot(dx, dy); if (d >= r) continue;
    const px = gx + dx, py = gy + dy; if (px < 0 || py < 0 || px >= W || py >= H) continue;
    const k = (1 - d / r) ** 2 * k0, i = py * W + px, v = L[i];
    L[i] = (255 << 24) | (Math.min(255, ((v >>> 16) & 255) + cb * k) << 16) | (Math.min(255, ((v >>> 8) & 255) + cg * k) << 8) | Math.min(255, (v & 255) + cr * k);
  }
}
/** Draw a baked loop frame scaled by (kx, ky) about its origin, placed at world (x, y); returns the top of its solid body (world y). */
function blitScaled(frame, b, t, x, y, kx, ky, clipY = Infinity) {
  const f = bakedFrame(b, t);
  if (f.x1 < 0) return y;
  const FW = frame.w, FH = frame.h, C = frame.color, L = frame.light, ox = b.ox, oy = b.oy;
  const dx0 = Math.floor((f.x0 - ox) * kx), dx1 = Math.ceil((f.x1 + 1 - ox) * kx), dy0 = Math.floor((f.y0 - oy) * ky), dy1 = Math.ceil((f.y1 + 1 - oy) * ky);
  const X = Math.round(x) - frame.ox, Y = Math.round(y) - frame.oy, clip = clipY - frame.oy;
  let top = Infinity;
  for (let dy = dy0; dy < dy1; dy++) {
    let solidRow = 0;
    const py = Y + dy; if (py < 0 || py >= FH || py >= clip) continue;
    const sy = Math.floor(dy / ky) + oy; if (sy < f.y0 || sy > f.y1) continue;
    for (let dx = dx0; dx < dx1; dx++) {
      const px = X + dx; if (px < 0 || px >= FW) continue;
      const sx = Math.floor(dx / kx) + ox; if (sx < f.x0 || sx > f.x1) continue;
      const j = (sy - f.y0) * f.cw + (sx - f.x0), i = py * FW + px, s = f.color[j];
      if (s) {
        const a = s >>> 24;
        if (a === 255) { C[i] = s; if (++solidRow === 8 && dy < top) top = dy; }
        else if (!C[i]) C[i] = s;
        else { const k = a / 255, d = C[i]; C[i] = (Math.max(a, d >>> 24) << 24) | (Math.round(((s >>> 16) & 255) * k + ((d >>> 16) & 255) * (1 - k)) << 16) | (Math.round(((s >>> 8) & 255) * k + ((d >>> 8) & 255) * (1 - k)) << 8) | Math.round((s & 255) * k + (d & 255) * (1 - k)); }
      }
      const l = f.light[j];
      if (l & 0xffffff) { const d = L[i]; L[i] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + ((l >>> 16) & 255)) << 16) | (Math.min(255, ((d >>> 8) & 255) + ((l >>> 8) & 255)) << 8) | Math.min(255, (d & 255) + (l & 255)); }
    }
  }
  return y + (top === Infinity ? dy0 : top);
}
function updateBosses(dt) {
  windVX = 0;
  for (const A of arenas) {
    if (!A.locked && !A.cleared && state === "play" && !P.dead && P.x > A.x0 + 16 && P.x < A.x1) lockArena(A);
    // ordinary enemies stay outside a sealed arena; only the boss's own minions are inside
    if (A.locked) for (const e of enemies) if (e.alive && !e.minion && e.x > A.x0 - 30 && e.x < A.x1 + 30) e.x = e.x < (A.x0 + A.x1) / 2 ? A.x0 - 30 : A.x1 + 30;
    BOSSES[A.kind].update(A, dt);
  }
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.t += dt; h.fx.update(dt);
    const hcx = P.x + 6, feet = P.y + P.h;
    if (h.kind === "spikes" && h.t > 0.04 && h.t < 0.52) {
      const u = Math.min(1, (h.t - 0.04) / 0.44), front = h.ox + h.dir * h.reach * (1 - Math.pow(1 - u, 1.7));
      if (Math.abs(hcx - front) < 11 && feet > h.floor - 16) hurt(h.fx.options.palette === ROOT_PAL ? "hit" : "ice", front);
    }
    if (h.kind === "ripple" && h.t < 0.5) {
      const front = h.ox + h.dir * h.reach * Math.min(1, h.t / 0.5);
      if (Math.abs(hcx - front) < 9 && feet > h.floor - 8) hurt("hit", front);
    }
    if (h.kind === "icicle" && h.t > ICICLE_FREE && h.t < ICICLE_HIT + 0.06) {
      const tip = Math.min(h.floor, h.floor - 44 + 0.5 * 950 * (h.t - ICICLE_FREE) ** 2);
      if (Math.abs(hcx - h.x) < 9 && P.y < tip && P.y + P.h > tip - 36) hurt("ice", h.x);
    }
    if (h.kind === "strike" && h.t > 0.76 && h.t < 1.12 && Math.abs(hcx - h.x) < 16) hurt("hit", h.x);
    if (h.fx.done()) hazards.splice(i, 1);
  }
}
function heroVsBosses() {
  if (state !== "play" || P.dead) return;
  const hb = heroBox();
  for (const A of arenas) {
    const B = A.boss;
    if (!A.locked || !bossHittable(B)) continue;
    const bb = bossBox(B);
    if (!box(hb, bb)) continue;
    if (statusIs("electrified")) {
      if (B.touchCool <= 0) { spawn(zapHit, { x: P.x + 6, y: P.y + P.h / 2 }); damageBoss(A, 1, "zap", P.x + 6, P.y + P.h / 2); B.touchCool = 0.5; }
      P.vx = (P.x + 6 < B.x ? -1 : 1) * 160;
      continue;
    }
    if (P.vy > 40 && P.y + P.h - bb[1] < 12 && B.touchCool <= 0) {
      damageBoss(A, 2, "stomp", P.x + 6, bb[1]);
      P.vy = down(...JUMP) ? -420 : -300; B.touchCool = 0.25;
      continue;
    }
    hurt(BOSSES[B.kind].cause, B.x);
  }
}
function drawBosses() {
  for (const A of arenas) {
    if (A.x1 < cam - 80 || A.x0 > cam + W + 80) continue;
    BOSSES[A.kind].draw(A);
    if (A.locked) for (const wx of [A.x0 - 4, A.x1 + 2]) {
      // the sealed arena's rune walls: a shimmering column of light
      const [cr, cg, cb] = BOSSES[A.kind].wall;
      for (let y = A.floor - 150; y < A.floor; y++) {
        const k = 0.45 + 0.35 * Math.sin(y * 0.35 - time * 9);
        for (let dx = -2; dx <= 2; dx++) {
          const px = Math.round(wx + dx) - frame.ox, py = Math.round(y) - frame.oy;
          if (px < 0 || py < 0 || px >= W || py >= H) continue;
          const kk = k * (1 - Math.abs(dx) / 3), i = py * W + px, v = frame.light[i];
          frame.light[i] = (255 << 24) | (Math.min(255, ((v >>> 16) & 255) + cb * kk) << 16) | (Math.min(255, ((v >>> 8) & 255) + cg * kk) << 8) | Math.min(255, (v & 255) + cr * kk);
          if (dx === 0 && (y + Math.floor(time * 20)) % 9 === 0) frame.color[i] = 0xffffffff;
        }
      }
    }
  }
  for (const h of hazards) h.fx.draw(frame);
}
function bossBar(g) {
  const A = lockedArena(); if (!A) return;
  const B = A.boss; if (B.state === "dead") return;
  const x = 80, y = 168, w = 160, fill = Math.round((w - 2) * B.hp / B.max);
  g.fillStyle = "#000"; g.fillRect(x - 1, y - 1, w + 2, 7);
  g.fillStyle = "#2a1426"; g.fillRect(x, y, w, 5);
  g.fillStyle = BOSSES[B.kind].bar[0]; g.fillRect(x + 1, y + 1, fill, 3);
  g.fillStyle = BOSSES[B.kind].bar[1]; g.fillRect(x + 1, y + 1, fill, 1);
  const name = B.name.toUpperCase(), tw = textWidth(name, "mini"), tx = Math.round(160 - tw / 2), ty = y - 8;
  rasterText(name, "mini", (gx, gy) => { g.fillStyle = "#000"; g.fillRect(tx + gx, ty + gy + 1, 1, 1); });
  rasterText(name, "mini", (gx, gy) => { g.fillStyle = "#ece4f4"; g.fillRect(tx + gx, ty + gy, 1, 1); });
}

// ---------------- hero ----------------
const GRAV = 1000, RUN = 118, ACC = 950, FRIC = 1200, JUMPV = 390;
function updateHero(dt) {
  if (P.dead) {
    P.dead.fx.update(dt); P.dead.t += dt;
    if (P.dead.t > 1.9 && state === "dying") startIris();
    return;
  }
  if (state !== "play" && state !== "win") return;
  const st = P.status ? P.status.kind : null;
  const speed = RUN * (st === "haste" ? 1.6 : st === "frozen" ? 0.5 : 1);
  const jumpV = JUMPV * (st === "haste" ? 1.1 : st === "frozen" ? 0.78 : 1);
  const acc = P.onIce ? 380 : ACC, fric = P.onIce ? 140 : FRIC;
  const L = state === "play" && (down("ArrowLeft", "KeyA") || padState.left), R = state === "play" && (down("ArrowRight", "KeyD") || padState.right);
  const dir = (R ? 1 : 0) - (L ? 1 : 0);
  if (dir && !(IS_WARRIOR && (P.rollT > 0 || P.dashT > 0))) { P.vx += dir * acc * dt * (Math.sign(P.vx) !== dir ? 1.6 : 1); P.face = dir; }
  else if (!(IS_WARRIOR && (P.rollT > 0 || P.dashT > 0))) { const s = Math.sign(P.vx), m = Math.max(0, Math.abs(P.vx) - fric * dt); P.vx = s * m; }
  if (P.hurtT <= 0 && !(IS_WARRIOR && (P.rollT > 0 || P.dashT > 0))) P.vx = Math.max(-speed, Math.min(speed, P.vx));
  P.hurtT -= dt;

  P.coyote = P.onGround ? 0.09 : P.coyote - dt;
  P.buffer = jumpPressed && state === "play" ? 0.12 : P.buffer - dt;
  if (P.buffer > 0 && P.coyote > 0) { P.vy = -jumpV; P.buffer = 0; P.coyote = 0; puff(P.x + 6, P.y + P.h, 5, 50); }
  if (!down(...JUMP) && P.vy < -140) P.vy = -140;
  P.vy = Math.min(480, P.vy + GRAV * dt);

  if (IS_WARRIOR && state === "play") {
    P.rollCool = Math.max(0, P.rollCool - dt); P.dashCool = Math.max(0, P.dashCool - dt);
    P.rollT = Math.max(0, P.rollT - dt); P.dashT = Math.max(0, P.dashT - dt);
    P.comboWindow = Math.max(0, P.comboWindow - dt);
    if (rollPressed && P.onGround && !P.rollCool) { P.rollT = 0.38; P.rollCool = 0.65; P.dashT = 0; P.attackT = 0; P.attackQueued = false; P.vx = P.face * 205; }
    if (dashPressed && !P.dashCool && !P.rollT) { P.dashT = 0.18; P.dashCool = 0.75; P.attackT = 0; P.attackQueued = false; P.vx = P.face * 265; }
    if (!P.rollT && !P.dashT && P.hurtT <= 0) {
      if (castPressed && P.attackT > 0 && P.attackKind !== "heavy") P.attackQueued = true;
      if (heavyPressed && !P.attackT) { P.attackKind = "heavy"; P.attackDuration = P.attackT = 0.55; P.attackHit = false; P.combo = 0; }
      else if ((castPressed || P.attackQueued) && (!P.attackT || (P.attackKind !== "heavy" && P.attackT < 0.13))) {
        P.attackQueued = false;
        P.combo = P.comboWindow > 0 ? P.combo % 3 + 1 : 1; P.comboWindow = 0.8;
        P.attackKind = "attack" + P.combo; P.attackDuration = P.attackT = 0.3; P.attackHit = false;
      }
    }
    if (P.attackT > 0) {
      P.attackT = Math.max(0, P.attackT - dt);
      const elapsed = P.attackDuration - P.attackT, heavy = P.attackKind === "heavy";
      if (!P.attackHit && elapsed >= (heavy ? 0.30 : 0.11)) {
        P.attackHit = true;
        const reach = heavy ? 34 : 26, hb = [P.face > 0 ? P.x + P.w : P.x - reach, P.y + 3, reach, P.h - 4];
        for (const e of enemies) if (e.alive && box(hb, enemyBox(e))) { const b = enemyBox(e); spawn(hitSpark, { x: e.x, y: b[1] + b[3] / 2, flip: P.face < 0 }); killEnemy(e, "slash"); }
        for (const A of arenas) if (A.locked && bossHittable(A.boss) && box(hb, bossBox(A.boss))) { const b = bossBox(A.boss); damageBoss(A, heavy ? 2 : 1, "slash", P.face > 0 ? b[0] + 4 : b[0] + b[2] - 4, b[1] + b[3] / 2); }
      }
    }
  }
  const mvx = P.vx + (P.dead ? 0 : windVX);
  P.x += mvx * dt;
  let hit = overlapsSolid(P.x, P.y, P.w, P.h);
  if (hit) {
    if (hit.block) P.x = mvx > 0 ? hit.block[0] - P.w : hit.block[0] + hit.block[2];
    else P.x = mvx > 0 ? hit.tx * T - P.w : (hit.tx + 1) * T;
    P.vx = 0;
  }
  const vyBefore = P.vy;
  P.y += P.vy * dt;
  P.onGround = false;
  hit = overlapsSolid(P.x, P.y, P.w, P.h);
  if (hit) {
    if (P.vy > 0) { P.y = (hit.block ? hit.block[1] : hit.ty * T) - P.h; P.onGround = true; }
    else P.y = hit.block ? hit.block[1] + hit.block[3] : (hit.ty + 1) * T;
    P.vy = 0;
  }
  const below = tileAt(Math.floor((P.x + 6) / T), Math.floor((P.y + P.h + 1) / T));
  P.onIce = P.onGround && below === IC;
  if (P.onGround && !P.wasGround && vyBefore > 260) puff(P.x + 6, P.y + P.h, 8, 80, P.onIce ? "#e8f4ff" : null);
  P.wasGround = P.onGround;
  if (P.onGround && Math.abs(P.vx) > 70 && Math.random() < dt * 7) puff(P.x + 6 - P.face * 4, P.y + P.h, 1, 20, P.onIce ? "#e8f4ff" : null);
  P.run += Math.abs(P.vx) * dt;
  P.inv = Math.max(0, P.inv - dt);
  P.castT = Math.max(0, P.castT - dt); P.cool = Math.max(0, P.cool - dt);
  P.mana = Math.min(100, P.mana + dt * 20);

  if (swapPressed) P.spell = (P.spell + 1) % SPELLS.length;
  if (IS_WARRIOR ? magicPressed : castPressed) cast();

  // hazards
  if (state === "play") {
    if (touchesTile(WA)) { if (statusIs("burning")) { P.status = null; puff(P.x + 6, P.y + 10, 10, 40, "#d8e8f0"); } else if (!statusIs("frozen") && !statusIs("electrified")) setStatus("frozen"); }
    if (touchesTile(LV) && !P.dead) {
      if (!statusIs("electrified")) { P.inv = 0; hurt("fire", P.x + 6); }
      P.vy = -470; P.y -= 4; setStatus("burning");
      spawn(hitSpark, { x: P.x + 6, y: P.y + P.h, angle: -Math.PI / 2, aim: 0 });
    }
    if (P.y > ROWS * T + 40) { P.hp--; if (P.hp <= 0) P.hp = 0; startIris(); }
  }
  if (P.status) { P.status.t -= dt; P.status.fx.update(dt); if (P.status.t <= 0) P.status = null; }
}

function heroPose() {
  if (P.hurtT > 0) return POSES.hurt;
  if (P.castT > 0) return POSES.cast;
  if (!P.onGround) return P.vy < 0 ? POSES.rise : POSES.fall;
  if (Math.abs(P.vx) > 15) return runPose(P.run / 13);
  return Math.floor(time * 2) % 2 ? POSES.idle2 : POSES.idle;
}

// ---------------- pickups, areas ----------------
function updateWorld(dt) {
  const hb = heroBox(), playing = state === "play" && !P.dead;
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    if (playing && box(hb, [c.x - 6, c.y - 7, 12, 14])) { coins.splice(i, 1); coinCount++; score += 10; spawn(collectBurst, { x: c.x, y: c.y + 14, palette: GOLD }); }
  }
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    if (playing && box(hb, [h.x - 8, h.y - 32, 16, 16])) { hearts.splice(i, 1); P.hp = Math.min(6, P.hp + 1); spawn(collectBurst, { x: h.x, y: h.y - 10 }); }
  }
  for (let i = potions.length - 1; i >= 0; i--) {
    const p = potions[i];
    if (playing && box(hb, [p.x - 8, p.y - 34, 16, 26])) { potions.splice(i, 1); setStatus("haste"); P.mana = 100; spawn(collectBurst, { x: p.x, y: p.y - 10, palette: ["#06140a", "#0b3318", "#126a2a", "#1fa040", "#47d462", "#9af0a0", "#d8ffe0", "#ffffff"] }); say("", "Haste! Run faster and jump higher for a few seconds.", 2500); }
  }
  for (const g of globes) {
    g.cool = Math.max(0, g.cool - dt);
    if (playing && g.cool <= 0 && box(hb, [g.x - 12, g.y - 30, 24, 30])) { g.cool = 12; setStatus("electrified"); P.mana = 100; spawn(zapHit, { x: g.x, y: g.y - 24 }); shake = 0.2; say("", "Electrified! Anything you touch is zapped, and spells are free.", 3000); }
  }
  for (const w of wisps) w.update(dt);
  for (const f of flags) if (!f.hit && playing && box(hb, [f.x - 4, f.y - 30, 12, 30])) {
    f.hit = true; spawnX = f.x + 10;
    spawn(collectBurst, { x: f.x, y: f.y - 8, palette: ["#061412", "#0b2f2b", "#12594a", "#1f8f4f", "#47c752", "#a6f06a", "#f0ffd2", "#ffffff"] });
  }
  if (!chest.opened && !chest.hidden && playing && box(hb, [chest.x - 14, chest.y - 18, 28, 18])) {
    chest.opened = true; state = "win"; winT = 0; score += 500;
    const more = stageI + 1 < STAGES.length;
    say(`Stage ${stageI + 1} clear`, more ? `Press jump to go on to Stage ${stageI + 2}` : "You beat every stage! Press R to play again", 0);
  }
  if (chest.opened) chest.fx.update(dt);
  if (state === "win") { winT += dt; if (winT > 1.3 && !quest) quest = createFx(questComplete, { x: 0, y: 0, text: `STAGE ${stageI + 1} CLEAR` }); }
  if (quest) { quest.update(dt); quest.options.x = Math.round(cam) + 160; quest.options.y = OY + 58; }
  // entering an area
  const a = areaOfX(P.x + 6);
  if (!areaSeen.has(a)) { areaSeen.add(a); say(segName(a), segTip(a), 5500); }
}

// ---------------- update ----------------
function update(dt) {
  time += dt;
  pollGamepad();
  updateHero(dt);
  if (state === "win" && winT > 2 && jumpPressed && stageI + 1 < STAGES.length) { newGame(stageI + 1, { score, coins: coinCount, hp: P.hp }); return; }
  jumpPressed = castPressed = swapPressed = heavyPressed = rollPressed = dashPressed = magicPressed = false;
  updateEnemies(dt);
  updateBosses(dt);
  heroVsEnemies();
  heroVsBosses();
  updateProjectiles(dt);
  updateWorld(dt);
  for (let i = oneShots.length - 1; i >= 0; i--) { oneShots[i].update(dt); if (oneShots[i].done()) oneShots.splice(i, 1); }
  for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i]; d.age += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 0.9; d.vy *= 0.92; if (d.age > d.life) dust.splice(i, 1); }
  for (let i = bolts.length - 1; i >= 0; i--) { bolts[i].t -= dt; if (bolts[i].t <= 0) bolts.splice(i, 1); }

  if (iris) {
    iris.fx.update(dt); iris.fx.options.x = Math.round(cam);
    if (!iris.swapped && iris.fx.t > 1.1) {
      iris.swapped = true;
      const hp = Math.max(P.hp, 3);
      P = null; resetHero(spawnX); P.hp = hp; P.inv = 1.2;
      for (const A of arenas) if (A.locked && !A.cleared) resetArena(A);
      cam = Math.max(0, Math.min(COLS * T - W, P.x - 150));
      projectiles = projectiles.filter((p) => p.kind !== "shot");
    }
    if (iris.swapped && iris.fx.t > 1.5 && state === "iris") state = "play";
    if (iris.fx.done()) iris = null;
  }

  const arena = lockedArena();
  const target = Math.max(0, Math.min(COLS * T - W, arena ? (arena.x0 + arena.x1) / 2 - W / 2 : P.x + 6 - 150 + P.face * 22));
  cam += (target - cam) * Math.min(1, dt * 6);
  shake = Math.max(0, shake - dt);

  // weather follows the area the camera is in
  const wa = themeAt(cam + 160);
  if (wa !== weatherArea) {
    if (weather) { weather.stop(); oldWeather = weather; }
    const [mod, opts] = AREAS[wa].weather;
    weather = createFx(mod, { ...opts, x: 160, y: 170, seed: wa + 2 });
    weather.update(2);
    weatherArea = wa;
  }
  weather.update(dt);
  if (oldWeather) { oldWeather.update(dt); if (oldWeather.done()) oldWeather = null; }
}
let oldWeather = null;

// ---------------- art ----------------
function makeCanvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function skyFor(A, ai) {
  const c = makeCanvas(W, H), g = c.getContext("2d"), bands = A.sky;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = y / H, s = Math.min(bands.length - 1, Math.floor(t * (bands.length - 1) + BAYER[(y & 3) * 4 + (x & 3)] / 16));
    g.fillStyle = bands[s]; g.fillRect(x, y, 1, 1);
  }
  for (let i = 0; i < (ai === 2 ? 25 : 70); i++) { const x = (hash(i, 1, ai) * W) | 0, y = (hash(i, 2, ai) * 90) | 0; g.fillStyle = hash(i, 3) > 0.8 ? "#ffe9c4" : "#b9a8d8"; g.globalAlpha = ai === 2 ? 0.5 : 1; g.fillRect(x, y, 1, 1); }
  g.globalAlpha = 1;
  const mx = [250, 70, 230, 260][ai], my = [36, 30, 44, 34][ai], mr = [13, 9, 18, 11][ai];
  g.fillStyle = A.moon; g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill();
  g.globalAlpha = 0.25; g.fillStyle = "#000"; g.fillRect(mx - 5, my - 6, 3, 3); g.fillRect(mx + 4, my + 3, 4, 3); g.globalAlpha = 1;
  return c;
}
// The tiles, props, trees and backdrops come from itch.io packs (sliced and recolored per area by prep_art.py).
const DATA = window.LANTERN_ART;
const AKEYS = ["meadow", "frost", "ember", "grove"];
const ALL_IMAGES = [];
const IMG = (u) => { const im = new Image(); im.src = u; ALL_IMAGES.push(im); return im; };
const ART = AREAS.map((A, i) => {
  const d = DATA.areas[AKEYS[i]];
  return {
    sky: skyFor(A, i),
    ground: IMG(d.ground), water: d.water ? IMG(d.water) : null,
    bushes: d.bushes.map(IMG), trees: { l: IMG(d.trees.l), m: IMG(d.trees.m) },
    par: { mountains: IMG(d.parallax.mountains), far: IMG(d.parallax.pines_far), near: IMG(d.parallax.pines_near) },
    forest: d.forest ? { far: IMG(d.forest.far), mid: IMG(d.forest.mid), near: IMG(d.forest.near) } : null,
  };
});
const PLANK = IMG(DATA.plank);
const PROPS = Object.fromEntries(Object.entries(DATA.props).map(([k, u]) => [k, IMG(u)]));
const artReady = Promise.all(ALL_IMAGES.map((im) => (im.decode ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
const AREA_PROPS = [
  ["mushroom_a", "mushroom_b", "mushroom_c", "flower_blue", "sprig", "fern", "cattail"],
  ["ice_fern", "ice_fern"],
  [],
  ["lavender", "lily", "lily2", "mushroom_glow_a", "mushroom_glow_b", "fern"],
];

// trees, bushes and small plants scattered over flat ground, the same every run
let DECOR = [];
const isGround = (tx, ty) => { const v = tileAt(tx, ty); return v === GR || v === IC; };
function topRow(tx) { for (let y = 0; y < ROWS; y++) if (isGround(tx, y)) return y; return -1; }
function flat(tx, r) { const y = topRow(tx); if (y < 0) return false; for (let k = -r; k <= r; k++) if (topRow(tx + k) !== y) return false; return true; }
function buildDecor() {
  DECOR = [];
  const near = (x, list, d) => list.some((q) => Math.abs(q - x) < d);
  const flagsX = SPEC.flags, torchX = SPEC.torches;
  for (let a = 0; a < NA; a++) {
    const th = SEGS[a].theme, art = ART[th], o = a * AW, props = AREA_PROPS[th];
    for (let lx = 2; lx < AW - 2; lx++) {
      const tx = o + lx, ty = topRow(tx);
      if (ty < 0) continue;
      const surf = ty * T, cx = tx * T + 8;
      const h1 = hash(tx, 1, th), h2 = hash(tx, 2, th), h3 = hash(tx, 3, th);
      if (h1 < 0.13 && flat(tx, 2) && !near(cx, flagsX, 30)) {
        const im = art.trees[h2 < 0.55 ? "l" : "m"];
        DECOR.push({ k: "tree", im, x: Math.round(cx - im.width / 2), y: surf - im.height + 3 });
      }
      if (h2 > 0.8 && flat(tx, 3) && !near(cx, torchX, 20)) {
        const im = art.bushes[Math.floor(h3 * 4)];
        DECOR.push({ k: "bush", im, x: Math.round(cx - im.width / 2), y: surf - im.height + 4 });
      }
      if (props.length && h3 > 0.62 && flat(tx, 0)) {
        const name = props[Math.floor(hash(tx, 4, th) * props.length)], im = PROPS[name];
        DECOR.push({ k: "prop", im, x: Math.round(cx - im.width / 2 + (hash(tx, 5) - 0.5) * 8), y: surf - im.height + 2, glow: name.startsWith("mushroom_glow") });
      }
    }
  }
  DECOR.sort((p, q) => ({ tree: 0, bush: 1, prop: 2 }[p.k] - { tree: 0, bush: 1, prop: 2 }[q.k]));
}
function tileX(g, im, off, y) {
  const w = im.width; if (!w) return;
  let x = -(Math.round(off) % w); if (x > 0) x -= w;
  for (; x < W; x += w) g.drawImage(im, x, y);
}
function drawBackdrop(g, i, a, c, sy) {
  const A = ART[i];
  g.globalAlpha = a;
  g.drawImage(A.sky, 0, 0);
  if (A.forest) {
    tileX(g, A.forest.far, c * 0.12, -60 + sy); tileX(g, A.forest.mid, c * 0.25, -60 + sy); tileX(g, A.forest.near, c * 0.42, -60 + sy);
  } else {
    tileX(g, A.par.mountains, c * 0.06, 44 + sy); tileX(g, A.par.far, c * 0.18, 60 + sy); tileX(g, A.par.near, c * 0.36, 84 + sy);
  }
  g.globalAlpha = 1;
}

// ---------------- HUD ----------------
const DIG = { "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111", "4": "101101111001001", "5": "111100111001111", "6": "111100111101111", "7": "111001010010010", "8": "111101111101111", "9": "111101111001111", "x": "000101010101000" };
function text(g, s, x, y, col) {
  for (const ch of s) { const m = DIG[ch]; if (m) for (let i = 0; i < 15; i++) if (m[i] === "1") { g.fillStyle = "#000"; g.fillRect(x + (i % 3), y + ((i / 3) | 0) + 1, 1, 1); g.fillStyle = col; g.fillRect(x + (i % 3), y + ((i / 3) | 0), 1, 1); } x += 4; }
}
const HEART = [".11.11.", "1221111", "1211111", "1111111", ".11111.", "..111..", "...1..."];
function hud(g) {
  const n = Math.max(4, P.hp);
  for (let i = 0; i < n; i++) for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
    const c = HEART[y][x]; if (c === ".") continue;
    g.fillStyle = i < P.hp ? (c === "2" ? "#ffb7c2" : "#e8344a") : "#3a2c52"; g.fillRect(6 + i * 9 + x, 6 + y, 1, 1);
  }
  // mana
  g.fillStyle = "#000"; g.fillRect(6, 16, 42, 5);
  g.fillStyle = "#2a2440"; g.fillRect(7, 17, 40, 3);
  g.fillStyle = statusIs("electrified") ? "#ffe26b" : "#5ab4ff"; g.fillRect(7, 17, Math.round(40 * P.mana / 100), 3);
  g.fillStyle = "#c8ecff"; g.fillRect(7, 17, Math.round(40 * P.mana / 100), 1);
  // spells
  SPELLS.forEach((s, i) => {
    const x = 52 + i * 10, y = 14, sel = i === P.spell, ok = P.mana >= s.cost || statusIs("electrified");
    g.fillStyle = sel ? "#ffffff" : "#000"; g.fillRect(x - 1, y - 1, 9, 9);
    g.fillStyle = "#1a1426"; g.fillRect(x, y, 7, 7);
    g.globalAlpha = ok ? 1 : 0.35; g.fillStyle = s.color;
    g.fillRect(x + 2, y + 1, 3, 5); g.fillRect(x + 1, y + 2, 5, 3); g.fillStyle = "#fff"; g.fillRect(x + 2, y + 2, 1, 1);
    g.globalAlpha = 1;
  });
  if (statusIs("cursed")) { g.fillStyle = "rgba(60,20,90,0.7)"; g.fillRect(51, 13, 30, 9); }
  g.fillStyle = "#2a1405"; g.fillRect(6, 26, 5, 6); g.fillStyle = "#f5b92c"; g.fillRect(7, 26, 3, 6); g.fillStyle = "#fff4bc"; g.fillRect(7, 27, 1, 3);
  text(g, "x" + coinCount, 13, 27, "#ffe066");
  const s = String(score).padStart(5, "0");
  text(g, s, W - 6 - s.length * 4, 7, "#ece4f4");
  bossBar(g);
}

// ---------------- hamster hero ----------------
function hamsterPose() {
  if (IS_WARRIOR) {
    if (P.hurtT > 0) return "hurt";
    if (P.rollT > 0) return P.rollT > 0.19 ? "roll0" : "roll1";
    if (P.dashT > 0) return "dash";
    if (P.attackT > 0) return P.attackKind;
  }
  if (P.hurtT > 0) return "hurt";
  if (P.castT > 0) return "cast";
  if (!P.onGround) return P.vy < 0 ? "jump" : "fall";
  if (Math.abs(P.vx) > 15) return "run" + (Math.floor(P.run / 7) % 4);
  return Math.floor(time * 2) % 2 ? "idle2" : "idle";
}
function warriorSprite() {
  if (!WARRIOR_SPRITES) return HFRAMES[hamsterPose()];
  let name, index = 0;
  if (P.dead) { name = "Death"; index = Math.floor(P.dead.t / 0.1); }
  else if (P.hurtT > 0) name = "Hit";
  else if (P.rollT > 0) { name = "Slide"; index = Math.floor((0.38 - P.rollT) / 0.38 * 5); }
  else if (P.dashT > 0) { name = "Dash"; index = Math.floor((0.18 - P.dashT) / 0.18 * 7); }
  else if (P.attackT > 0) {
    name = P.attackKind === "heavy" || P.attackKind === "attack2" ? "Attack2" : "Attack1";
    index = Math.floor((P.attackDuration - P.attackT) / P.attackDuration * WARRIOR_SPRITES[name].length);
  } else if (!P.onGround) { name = P.vy < 0 ? "Jump" : "Fall"; index = Math.min(2, Math.floor(Math.abs(P.vy) / 120)); }
  else if (Math.abs(P.vx) > 15) { name = "Run"; index = Math.floor(P.run / 5); }
  else { name = "Idle"; index = Math.floor(time * 8); }
  const frames = WARRIOR_SPRITES[name];
  return frames[P.dead ? Math.min(index, frames.length - 1) : index % frames.length];
}
function drawHamster(frame) {
  const f = IS_WARRIOR ? warriorSprite() : HFRAMES[hamsterPose()], flip = P.face < 0, X = Math.round(P.x + 6), Y = Math.round(P.y + P.h);
  const st = P.status ? P.status.fx : null;
  if (st) { st.options.x = X; st.options.y = Y; st.options.flip = flip; st.draw(frame, "back"); }
  const C = frame.color, L = frame.light, FW = frame.w, FH = frame.h;
  const X0 = X - frame.ox, Y0 = Y - frame.oy;
  const flash = P.hurtT > 0.2;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const c = f.c[y * f.w + x]; if (!c) continue;
    const px = X0 + (flip ? f.ox - x - 1 : x - f.ox), py = Y0 + y - f.oy;
    if (px >= 0 && py >= 0 && px < FW && py < FH) C[py * FW + px] = flash ? 0xffffffff : c;
  }
  if (st) st.draw(frame, "front");
  if (IS_WARRIOR && !WARRIOR_SPRITES && P.attackT > 0 && P.attackDuration - P.attackT > (P.attackKind === "heavy" ? 0.28 : 0.09)) {
    const radius = P.attackKind === "heavy" ? 28 : 22;
    for (let j = 0; j <= 12; j++) {
      const theta = -1.0 + j * 0.14, px = X0 + P.face * Math.round(Math.cos(theta) * radius), py = Y0 - 19 + Math.round(Math.sin(theta) * radius);
      if (px >= 0 && py >= 0 && px < FW && py < FH) C[py * FW + px] = 0xffc5dce6;
    }
  }
  if (f.gem) {
    const col = parseInt(SPELLS[P.spell].color.slice(1), 16), r = (col >> 16) & 255, g = (col >> 8) & 255, b = col & 255;
    const gx = X0 + (flip ? f.ox - f.gem[0] - 1 : f.gem[0] - f.ox), gy = Y0 + f.gem[1] - f.oy, k0 = 0.55 + 0.2 * Math.sin(time * 6);
    for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) {
      const d = Math.hypot(x, y); if (d >= 9) continue;
      const px = gx + x, py = gy + y; if (px < 0 || py < 0 || px >= FW || py >= FH) continue;
      const k = (1 - d / 9) ** 2 * k0, i = py * FW + px, v = L[i];
      L[i] = (255 << 24) | (Math.min(255, ((v >>> 16) & 255) + b * k) << 16) | (Math.min(255, ((v >>> 8) & 255) + g * k) << 8) | Math.min(255, (v & 255) + r * k);
    }
  }
}

// ---------------- render ----------------
const bg32 = new Uint32Array(W * H);
let wTick = 0;
function blendArea(g, pick, cx, sy) {
  const u = cx / (AW * T), i = Math.max(0, Math.min(NA - 1, Math.floor(u))), f = u - i;
  pick(i, 1);
  if (f < 0.08 && i > 0) pick(i - 1, 1 - (0.5 + f / 0.16));
  else if (f > 0.92 && i < NA - 1) pick(i + 1, (f - 0.92) / 0.16);
}
function render() {
  const sx = shake > 0 && !reduceMotion ? Math.round((Math.random() - 0.5) * 4) : 0;
  const sy = shake > 0 && !reduceMotion ? Math.round((Math.random() - 0.5) * 3) : 0;
  const c = Math.round(cam) + sx, g = sctx, cx = c + 160;
  blendArea(g, (i, a) => drawBackdrop(g, SEGS[i].theme, a, c, sy), cx, sy);
  // trees and bushes behind the ground's grass
  for (const d of DECOR) {
    if (d.k === "prop" || d.x > c + W || d.x + d.im.width < c) continue;
    g.drawImage(d.im, d.x - c, d.y - OY + sy);
  }

  const c0 = Math.floor(c / T), c1 = Math.ceil((c + W) / T);
  const lavaTiles = [];
  const tops = [], waters = [];
  for (let ty = 0; ty < ROWS; ty++) for (let tx = c0; tx <= c1; tx++) {
    if (tx < 0 || tx >= COLS) continue;
    const v = grid[ty][tx]; if (!v) continue;
    const art = ART[themeAt(tx * T)], X = tx * T - c, Y = ty * T - OY + sy;
    if (v === LV) { lavaTiles.push([tx, ty]); continue; }
    if (v === WA) { waters.push([art, tx, X, Y]); continue; }
    if (v === PL) {
      const l = tileAt(tx - 1, ty) !== PL, r = tileAt(tx + 1, ty) !== PL, sx = l && !r ? 0 : r && !l ? 32 : 16;
      g.drawImage(PLANK, sx, 0, 16, 16, X, Y - 1, 16, 16);
      continue;
    }
    const col = !isGround(tx - 1, ty) ? 0 : !isGround(tx + 1, ty) ? 4 : 1 + ((tx * 7 + ty * 3) % 3);
    if (!isGround(tx, ty - 1)) tops.push([art, col, X, Y]);
    else g.drawImage(art.ground, col * 16, 32, 16, 16, X, Y, 16, 16);
  }
  for (const [art, col, X, Y] of tops) g.drawImage(art.ground, col * 16, 0, 16, 32, X, Y - 8, 16, 32);
  for (const d of DECOR) {
    if (d.k !== "prop" || d.x > c + W || d.x + d.im.width < c) continue;
    g.drawImage(d.im, d.x - c, d.y - OY + sy);
  }
  for (const [art, tx, X, Y] of waters) {
    if (!art.water) continue;
    g.globalAlpha = 0.88;
    g.drawImage(art.water, ((tx + Math.floor(time * 3)) % 4) * 16, 0, 16, 16, X, Y + 1, 16, 16);
    g.globalAlpha = 1;
  }
  // lava: a churning surface
  for (const [tx, ty] of lavaTiles) {
    const X = tx * T - c, Y = ty * T - OY + sy;
    for (let y = 0; y < T + 8; y++) for (let x = 0; x < T; x += 2) {
      const wx = tx * T + x, n = Math.sin(wx * 0.35 + time * 2.4) + Math.sin(wx * 0.13 - time * 1.7 + y * 0.4);
      const surf = 2 + Math.round(Math.sin(wx * 0.3 + time * 3) * 1.5);
      if (y < surf) continue;
      g.fillStyle = y < surf + 2 ? (n > 0.6 ? "#fff3a6" : "#ffc23d") : n > 1 ? "#ff8a2a" : n > -0.4 ? "#e8501c" : "#a8260e";
      g.fillRect(X + x, Y + y, 2, 1);
    }
  }
  // flags
  for (const f of flags) {
    const fxp = f.x - c, fyp = f.y - OY + sy;
    if (fxp < -20 || fxp > W + 20) continue;
    g.fillStyle = "#c9c2d8"; g.fillRect(fxp, fyp - 30, 2, 30);
    g.fillStyle = f.hit ? "#47c752" : "#5b3f66";
    for (let i = 0; i < 6; i++) g.fillRect(fxp + 2, fyp - 30 + i, 10 - i * 1.5, 1);
  }
  for (const d of dust) { const k = 1 - d.age / d.life; g.fillStyle = d.col || (k > 0.5 ? "#d9cfe6" : "#8a7fa0"); const s = k > 0.6 ? 2 : 1; g.fillRect(Math.round(d.x - c), Math.round(d.y - OY + sy), s, s); }

  const data = g.getImageData(0, 0, W, H);
  bg32.set(new Uint32Array(data.data.buffer));

  // ---- pixelfx layer
  clearFrame(frame);
  frame.ox = c; frame.oy = OY - sy;
  const vis = (x, r) => x > c - r && x < c + W + r;
  for (const [tx, ty] of lavaTiles) { // lava glow on the light buffer
    const X = tx * T - c;
    for (let y = -26; y < 6; y++) { const py = ty * T - frame.oy + y; if (py < 0 || py >= H) continue; const k = Math.max(0, 1 - Math.abs(y + 2) / 26) ** 2 * 70; for (let x = 0; x < T; x++) { const px = X + x; if (px < 0 || px >= W) continue; const i = py * W + px, d = frame.light[i]; frame.light[i] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + k * 0.12) << 16) | (Math.min(255, ((d >>> 8) & 255) + k * 0.45) << 8) | Math.min(255, (d & 255) + k); } }
  }
  for (const d of DECOR) {
    if (!d.glow || d.x > c + W + 20 || d.x + d.im.width < c - 20) continue;
    const gx = d.x + d.im.width / 2 - frame.ox, gy = d.y + 6 - frame.oy, k0 = 0.75 + 0.25 * Math.sin(time * 2 + d.x);
    for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) {
      const dd = Math.hypot(x, y); if (dd >= 14) continue;
      const px = Math.round(gx + x), py = Math.round(gy + y); if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const k = (1 - dd / 14) ** 2 * 60 * k0, i = py * W + px, v = frame.light[i];
      frame.light[i] = (255 << 24) | (Math.min(255, ((v >>> 16) & 255) + k) << 16) | (Math.min(255, ((v >>> 8) & 255) + k * 0.45) << 8) | Math.min(255, (v & 255) + k * 0.7);
    }
  }
  for (const t of torches) if (vis(t.x, 40)) blit(frame, t.b, time + t.ph, t.x, t.y);
  for (const w of wisps) if (vis(w.options.x, 70)) w.draw(frame);
  for (const gl of globes) if (vis(gl.x, 60)) blit(frame, gl.b, time, gl.x, gl.y);
  for (const co of coins) if (vis(co.x, 24)) blit(frame, co.b, time + co.ph, co.x, co.y + 20);
  for (const h of hearts) if (vis(h.x, 24)) blit(frame, h.b, time, h.x, h.y);
  for (const p of potions) if (vis(p.x, 24)) blit(frame, p.b, time, p.x, p.y);
  if (vis(chest.x, 90) && !chest.hidden) chest.fx.draw(frame);
  for (const e of enemies) if (e.alive && vis(e.x, 60)) { if (e.frozenT > 0) blit(frame, e.ice.b, e.ice.t, e.ice.x, e.ice.y); else blit(frame, enemyBake(e), e.t, e.x, e.y); }
  drawBosses();

  if (P.dead) { if (IS_WARRIOR && WARRIOR_SPRITES) drawHamster(frame); else P.dead.fx.draw(frame); }
  else if (!(iris && !iris.swapped && iris.fx.t > 1.1)) {
    const blink = P.inv > 0 && state === "play" && Math.floor(P.inv * 14) % 2 === 0;
    if (HAM) { if (!blink) drawHamster(frame); }
    else (IS_KNIGHT ? drawKnight : drawHero)(frame, {
      x: P.x + 6, y: P.y + P.h, face: P.face, pose: heroPose(), staffForward: P.castT > 0, gem: SPELLS[P.spell].color,
      status: P.status ? P.status.fx : null, statusMod: P.status ? P.status.mod : null, alpha: blink ? 0 : 1,
    });
  }
  for (const p of projectiles) p.fx.draw(frame);
  for (const o of oneShots) o.draw(frame);
  drawBolts();

  // weather in its own buffer at 30 Hz, laid over the scene
  if ((wTick++ & 1) === 0) {
    clearFrame(wframe); wframe.ox = c; wframe.oy = OY;
    weather.options.x = c + 160; weather.options.y = OY + 186; weather.draw(wframe);
    if (oldWeather) { oldWeather.options.x = c + 160; oldWeather.options.y = OY + 186; oldWeather.draw(wframe); }
  }
  mergeWeather();
  if (quest) quest.draw(frame);
  if (iris) iris.fx.draw(frame);

  composite(frame, outImg.data, bg32);
  ctx.putImageData(outImg, 0, 0);
  hud(ctx);
}
function mergeWeather() {
  const C = frame.color, L = frame.light, WC = wframe.color, WL = wframe.light, n = W * H;
  for (let i = 0; i < n; i++) {
    const s = WC[i];
    if (s) {
      const a = s >>> 24;
      if (a === 255 || !C[i]) C[i] = s;
      else { const k = a / 255, d = C[i]; const ch = (sh) => Math.round(((s >>> sh) & 255) * k + ((d >>> sh) & 255) * (1 - k)); C[i] = (Math.max(a, d >>> 24) << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0); }
    }
    const l = WL[i];
    if (l & 0xffffff) { const d = L[i]; L[i] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + ((l >>> 16) & 255)) << 16) | (Math.min(255, ((d >>> 8) & 255) + ((l >>> 8) & 255)) << 8) | Math.min(255, (d & 255) + (l & 255)); }
  }
}
function drawBolts() {
  const C = frame.color, L = frame.light;
  for (const b of bolts) {
    const [ax, ay] = b.a, [bx, by] = b.b, n = Math.max(4, Math.round(Math.hypot(bx - ax, by - ay) / 6));
    let px = ax, py = ay;
    for (let k = 1; k <= n; k++) {
      const u = k / n, j = k === n ? 0 : (hash(k, Math.floor(b.seed + time * 30)) - 0.5) * 12;
      const qx = ax + (bx - ax) * u + (-(by - ay) / (n * 6)) * j, qy = ay + (by - ay) * u + ((bx - ax) / (n * 6)) * j;
      const steps = Math.ceil(Math.hypot(qx - px, qy - py));
      for (let s = 0; s <= steps; s++) {
        const x = Math.round(px + (qx - px) * (s / steps) - frame.ox), y = Math.round(py + (qy - py) * (s / steps) - frame.oy);
        for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) {
          const X = x + ox, Y = y + oy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const d = Math.abs(ox) + Math.abs(oy), i = Y * W + X;
          if (d === 0) C[i] = 0xffffffff; else if (d === 1 && b.t > 0.08) C[i] = 0xff6bf2ff;
          const k = (1 - d / 7) * 60 * (b.t / 0.22), v = L[i];
          L[i] = (255 << 24) | (Math.min(255, ((v >>> 16) & 255) + k * 1.2) << 16) | (Math.min(255, ((v >>> 8) & 255) + k) << 8) | Math.min(255, (v & 255) + k * 0.7);
        }
      }
      px = qx; py = qy;
    }
  }
}

// ---------------- loop ----------------
let last = performance.now(), fpsAcc = 0, fpsN = 0;
window.__lantern = { get P() { return P; }, get enemies() { return enemies; }, teleport(x, y) { P.x = x; P.y = y != null ? y : Math.min(surfaceAt(x + 6), 144) - 40; P.vy = 0; cam = Math.max(0, x - 150); }, setStatus(k) { setStatus(k); }, perf: { ms: 0 }, get state() { return state; }, get projectiles() { return projectiles; }, kill(n) { P.hp = n; }, face(d) { P.face = d; }, get cam() { return cam; }, get arenas() { return arenas; }, get hazards() { return hazards; }, get chest() { return chest; }, get stage() { return stageI; }, newGame(i) { newGame(i); }, hitBoss(i, n, how) { return damageBoss(arenas[i], n, how || "slash", arenas[i].boss.x, arenas[i].boss.y || arenas[i].boss.cy); } };
function loop(now) {
  const dt = Math.max(0, Math.min(1 / 30, (now - last) / 1000)); last = now;
  const t0 = performance.now();
  update(dt);
  render();
  fpsAcc += performance.now() - t0; fpsN++;
  if (fpsN === 60) { window.__lantern.perf.ms = fpsAcc / 60; fpsAcc = 0; fpsN = 0; }
  requestAnimationFrame(loop);
}
const warriorAtlasReady = IS_WARRIOR ? loadWarriorAtlas(window.LANTERN_WARRIOR_ATLAS).then(sheets => {
  WARRIOR_SPRITES = sheets;
  HAM_ACTOR = makeHamActor(sheets.Idle[0]);
}).catch(err => { console.error("Warrior sprite atlas could not be loaded; using original warrior.", err); }) : Promise.resolve();
Promise.all([artReady, warriorAtlasReady]).then(() => {
  const qs = new URLSearchParams(window.location.search);
  newGame((parseInt(qs.get("stage"), 10) || 1) - 1);
  last = performance.now();
  requestAnimationFrame(loop);
});
cv.addEventListener("pointerdown", () => cv.focus());
