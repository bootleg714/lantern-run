# Lantern Run

A 2D pixel-art side-scroller starring Biscuit, a small blue hamster wizard. Run through four areas (Dusk Meadow, Frost Hollow, Ember Depths and Haunted Grove), stomp and blast a bestiary of critters, and reach the chest at the end.

Every enemy, spell, status effect, death, pickup and weather overlay comes from [pixelfx](https://github.com/patch-gg/pixelfx). The ground, trees, props and other backdrops come from free itch.io packs, recolored per area. The Haunted Grove backdrop is original AI-generated artwork.

## Play

Open `index.html` in a browser. It is one self-contained file with no server needed.

| Key | Action |
| --- | --- |
| Left / Right or A / D | Move |
| Space, Z or Up | Jump (hold for higher) |
| X | Cast |
| Q, or 1 / 2 / 3 | Switch spell: fire, ice, zap |
| R | Restart |

A controller works too: plug it in (or pair it) and press any button. Anything the browser reads as a standard gamepad works, including Xbox, PlayStation and Switch Pro controllers.

| Controller | Action |
| --- | --- |
| Left stick or D-pad | Move |
| A | Jump (hold for higher) |
| X or B | Cast |
| Y or RB | Next spell |
| LB | Previous spell |
| Start | Restart |

## Project layout

```
index.html          the built game (open this to play)
game/
  src/main.js       game loop, level, enemies, spells, status effects, rendering
  src/hamster.js    Biscuit and the other hamster designs, drawn from shapes
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
