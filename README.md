# Lantern Run

A 2D pixel-art side-scroller starring Biscuit, a small blue hamster wizard. Run through Level 1's four areas (Dusk Meadow, Frost Hollow, Ember Depths and Haunted Grove), stomp and blast a bestiary of critters, beat the mini boss at the end of Frost Hollow and the final boss guarding the chest.

Every enemy, spell, status effect, death, pickup and weather overlay comes from [pixelfx](https://github.com/patch-gg/pixelfx). The ground, trees, props and other backdrops come from free itch.io packs, recolored per area. The Haunted Grove backdrop is original AI-generated artwork.

## Play

Open `index.html` in a browser. It is one self-contained file with no server needed. Choose **Knight** above the controls to try the animated knight; **Warrior** selects the animated Clembod warrior melee fighter, and **Biscuit** switches back. Switching characters restarts the run.

| Key | Action |
| --- | --- |
| Left / Right or A / D | Move |
| Space, Z or Up | Jump (hold for higher) |
| X | Cast |
| Q, or 1 / 2 / 3 | Switch spell: fire, ice, zap |
| R | Restart |

For the warrior: X chains up to three light attacks, C performs a heavy strike, Shift dodges (shown as a slide), F dashes, and V casts the selected spell. Q still switches spells. Dodges briefly avoid enemy damage; dodge and dash have short cooldowns.

A controller works too: plug it in (or pair it) and press any button. Anything the browser reads as a standard gamepad works, including Xbox, PlayStation and Switch Pro controllers.

| Controller | Action |
| --- | --- |
| Left stick or D-pad | Move |
| A | Jump (hold for higher) |
| X or B | Cast |
| Y or RB | Next spell |
| LB | Previous spell |
| Start | Restart |

Controller (standard Xbox-style layout): move with the left stick or D-pad, jump with A, and restart with Start. For Biscuit or the knight, X or B casts, Y or RB selects the next spell, and LB selects the previous spell. For the warrior, X attacks, Y uses a heavy attack, B dodges, RB dashes, RT casts, and LB switches spells. Press a controller button while the game tab is focused to connect.

## Bosses

Level 1 has two boss fights. Walking into a boss arena seals it behind rune walls and shows the boss's health bar; there is a checkpoint flag just before each one, and if the hero dies the boss resets.

| Boss | Where | Attacks | Weak to |
| --- | --- | --- | --- |
| King Gloop | End of Frost Hollow | Hops at you; each landing sends frost lines racing along the floor (jump them). Every third hop is a big one. Splits off two slimes at half health. | Fire (double damage). Ice does nothing. |
| The Hollow Eye | End of Haunted Grove, guarding the chest | Phase 1: aimed orb volleys and lightning strikes. Phase 2: orb spreads, double strikes and ghost summons. Phase 3: dives to the floor, sends root spikes out, then sits dizzy. | Zap (double damage); ice stuns it. Stomp it from the two ledges. |

Stomps do 2 damage, as does the warrior's heavy attack. Both bosses are pixelfx critters (the slime and the eyeball) drawn at twice their size; their attacks use the ice-spikes, lightning-strike, spawn-portal, mana-burst, snowflake-burst and plasma-explosion effects.

## Project layout

```
index.html          the built game (open this to play)
game/
  src/main.js       game loop, level, enemies, spells, status effects, rendering
  src/hamster.js    Biscuit and the other hamster designs, drawn from shapes
  src/warrior-atlas.js loads and slices the warrior animation atlas
  src/warrior.js    original articulated warrior fallback
  art/clembod-warrior/  warrior animation atlas and license
  src/knight.js     the animated knight, built on the pixelfx rig
  src/hero.js       the original rigged mage hero (set window.LANTERN_HERO = "mage" to use him)
  template.html     the page around the game
  art.json          sliced and recolored tiles, trees, props and backdrops
  prep_art.py       rebuilds art.json from the original asset packs
  bundle.mjs        a tiny dependency-free bundler for the ES modules
  build.mjs         builds index.html
vendor/pixelfx/     the parts of pixelfx the game uses (MIT)
```

## Adding more effects

`vendor/pixelfx` holds only the effects Lantern Run uses. pixelfx has 232; to use another one, copy its file (and its category's `_lib.js`) from [the pixelfx repo](https://github.com/patch-gg/pixelfx/tree/main/src/fx) into the matching folder under `vendor/pixelfx/src/fx/`, then import it in `game/src/main.js`.

## Build

Needs Node 18 or newer, with no packages to install.

```
node game/build.mjs
```

To rebuild the art after changing `prep_art.py`, download the asset packs below into a folder (for example `assets/`, which git ignores) and run:

```
python3 game/prep_art.py assets game/art.json
```

`prep_art.py` needs Python 3 with Pillow and NumPy.

## Credits

- Effects: [pixelfx](https://github.com/patch-gg/pixelfx) by Patch, MIT. See `vendor/pixelfx/LICENSE` and `NOTICE.md`.
- Tiles, trees, props and pine backdrops: [Legacy Fantasy: High Forest](https://anokolisa.itch.io/) by Anokolisa.
- Haunted Grove backdrop: AI-generated original artwork in `game/art/grove-original.png`.

- Warrior sprites: [Warrior-Free Animation Set](https://clembod.itch.io/warrior-free-animation-set) by Clembod. The license permits personal and commercial use and modifications, and prohibits redistribution or resale. See the included license and creator page.
