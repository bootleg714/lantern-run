# Lantern Run handoff

## Stage 4 expansion — November 1, 2026

This section supersedes the earlier single-section Stage 4 status below.

- Stage 4 now follows the other stages' three-section structure: Haunted Grove (`grove1`), Wispwood Crossing (`grove2`), and Hollow Sanctum (`grove3`). All three use the existing Haunted Grove art, green torches, fog, palettes, and props. No new external assets or gameplay audio were added.
- Preserved the original grove opening, then extended its platforming and ghost encounters. The middle section uses short plank crossings and leads to a new mid boss. The final section leads into the original Hollow Eye arena, moved to the third section; its three-phase fight, ledges, chest and stage-clear flow remain intact.
- The Veilkeeper: 20 HP, a scaled mint-colored pixelfx ghost. Warned curse-orb volleys use a fixed aim, a destination portal telegraphs a blink for 0.8 seconds, and a 0.75-second recovery window prevents immediate arrival contact damage. At half health it adds root waves with a 0.65-second warning. Fire deals double, ice stuns briefly, stomps do no damage, and melee works. Defeat clears its enemy shots, awards 2,500 points and a heart, releases the arena, and leaves the final chest hidden.
- Added checkpoints before both bosses, an intermediate grove checkpoint, and hearts/haste pickups along the route. Boss death resets and Stage 3 → Stage 4 progression use the existing systems. Stages 1–3 layouts and bosses are unchanged.
- Updated the README and in-page boss guide. Rebuilt the self-contained `index.html` with `node game/build.mjs`.
- `tests/stage4.cjs` is a headless engine regression harness using `@napi-rs/canvas`. It verifies ordinary movement/gravity/collision across the traversal sections, both Veilkeeper phases, damage and stun rules, real projectile/root damage, blink recovery safety, checkpoint respawn and boss reset, boss completion and chest gating, Biscuit/knight fire casts, warrior heavy attacks, and Stage 3 → Stage 4 progression. Terrain traversal tests disable combat, so they validate geometry rather than difficulty.
- Visual samples reviewed for the grove, crossing, both bosses, and final approach. Browser/controller playtesting remains the next step: check enemy pressure, telegraph readability, checkpoint spacing, performance, and difficulty with each hero. The headless renderer is not a real-browser or hardware performance measurement.

## Recent changes

- Replaced the Haunted Grove backdrop from Free Pixel Art Forest with original AI-generated artwork. The final revision uses a reduced palette and crisp pixel shapes to better match the other areas. The user reviewed it in-game and liked the result.
- The new background is a single 278 × 238 image that scrolls horizontally; the former backdrop used three parallax layers. The image edges are blended for tiling. Gameplay settings were not intentionally changed.
- Source artwork: `game/art/grove-original.png`. `game/prep_art.py` embeds it when regenerating `game/art.json`; `game/src/main.js` draws it; `index.html` is the built, self-contained game. The README credits were updated.

## Verification and lessons

- `node game/build.mjs` passed after the final artwork revision. Pixelated canvas scaling was already enabled; the softer appearance came from the artwork itself. Simpler shapes and a reduced palette produced the requested sharper look.
- The user confirmed the final appearance looks right. A dedicated check of the scrolling seam, area transition, and frame rate on target hardware is still advisable; these were not independently tested.

## Next steps and known issues

- Play through Haunted Grove and check the scrolling seam and transition, especially while moving at different speeds. Check performance on the target machine.
- Rebuild with `node game/build.mjs` after changing code or `game/art.json`. Full art regeneration with `python game/prep_art.py <assets-dir> game/art.json` also requires the Legacy Fantasy source pack, Pillow, and NumPy.
- The other asset packs retain their own licenses and credits; review their terms before distributing the game or assets.

## Knight character

- Added an optional knight based on the existing pixelfx rig, with idle, run, jump, fall, casting and hurt poses. Use the Knight and Biscuit links above the controls; switching reloads and restarts the run. Biscuit remains the default. The knight retains the existing magic spells and controls.
- `game/src/knight.js` renders the knight and supplies its status/death actor. The rig uses the existing pixelfx license and notice. The knight uses the existing taller mage collision box. Check animation, spell origins, status/death effects, and tight platforms in play on target hardware.
- The build passed and a headless browser preview showed the knight in its idle pose. Animation and gameplay behavior still need hands-on testing.

## Warrior combat prototype (superseded artwork)

- Added Warrior as a third selectable character in Lantern Run. `game/src/warrior.js` draws an original articulated, armored gothic warrior and pre-renders its pose frames at startup; it does not use the pixelfx character rig. The existing heroes remain selectable and Biscuit remains the default.
- Warrior controls: X for a three-hit light combo (early follow-up inputs are buffered), C for a heavy attack, Shift for a roll with a brief enemy-damage evasion window, F for a dash, V to cast and Q to switch spells. Touch controls are provided. Roll and dash have short cooldowns. Melee currently defeats enemies in one hit, matching the existing demo's simple enemy health model.
- The build and a headless browser check covered startup, all three combo steps, a melee hit, the heavy pose, roll and dash. Animation feel, all enemy types, status effects, accessibility and performance still need hands-on testing on target hardware. The warrior uses a 34-pixel collision box; level art and existing game progression are unchanged. This is a combat prototype, not a full gothic level or a finished Souls-style combat system.

## Previous Fantasy Knight integration (superseded)

- Replaced the Warrior's visible artwork with the supplied Fantasy Knight sprites by aamatniekss, using the darker outlined variant. Idle, run, jump, fall, light and heavy slashes, roll, dash, hurt, and death use sprite-sheet frames. Existing combat mechanics, controls, and collision box remain in place. The original procedural warrior remains as a fallback if the sheets fail to load.
- Original selected sheets are in `game/art/free-knight/`. `game/build.mjs` embeds them into the self-contained `index.html`; `game/src/free-knight.js` slices frames after loading, preserving a shared feet anchor. The warrior's collision and hitboxes are unchanged, so check the larger sword visuals against actual reach. No visual edits have been made to the supplied artwork yet.
- Creator and license: https://aamatniekss.itch.io/fantasy-knight-free-pixelart-animated-character . The creator permits use in free/commercial games and modification, prohibits redistribution of the assets on their own, and says the assets cannot be used in AI creations; check the current terms before any further use.
- Test all animation timing, status and death effects, collision alignment, and frame rate on the target hardware. Crouch, slide and wall-climb sheets from the pack have not been wired to mechanics.
- Build passed; headless browser verified imported sprite actor loading, a melee hit, the three combo steps, heavy attack, roll and dash. The screenshot showed the imported character. Full animation, death and status visuals still need hands-on review.

## Clembod warrior sprite integration

- The selectable Warrior now uses Clembod's Warrior-Free Animation Set V1.3 instead of Fantasy Knight. Source: https://clembod.itch.io/warrior-free-animation-set . The included license permits personal and commercial use and modification, but prohibits redistribution and resale; credit is appreciated. `game/art/clembod-warrior/LICENSE.txt` contains the supplied license.
- Individual original frames are arranged into `game/art/clembod-warrior/warrior-atlas.png`; `game/src/warrior-atlas.js` slices them using a shared foot anchor, and `game/build.mjs` embeds the atlas in the self-contained game. Previous Fantasy Knight source sheets and loader were removed from the game folder. The original procedural warrior remains a fallback if loading fails.
- Idle, run, jump, fall, two attack sequences, dash, hurt and death use the new pack. The pack has no roll animation, so Shift's existing dodge uses its slide animation; the movement and evasion mechanics remain as before. The third combo step reuses an attack sequence.
- The build and a headless browser check verified sprite loading, melee hit, combo steps, heavy attack, dodge and dash. Test animation transitions, alignment and actual hit reach, status/death effects, and performance on target hardware. Extra pack animations such as ledge grab, wall slide and ladder grab are not connected.

## Controller support

- Added browser Gamepad API polling with left stick/D-pad movement, held jump, button press edges, a 0.3 stick dead zone and a connection indicator. Keyboard and touch remain supported. Input is released while the window is unfocused or the controller disconnects. Standard Xbox-style mappings are documented in the game and README; warrior buttons include light and heavy attacks, dodge, dash, casting and spell switching.
- Browser tests use a simulated standard gamepad; physical controller models, Bluetooth/USB reconnection, focus behavior and performance still need hands-on testing on target hardware. Browsers may require pressing a controller button while the tab is focused before exposing the device.

## Level 1 bosses

- Added a mini boss and a final boss to finish Level 1. King Gloop, a crowned frost slime drawn at 2x from pixelfx's slime, holds a new arena at the end of Frost Hollow (tiles 49-63 of that area; the small bump and the slime, snake and coins that were there were removed). The Hollow Eye, pixelfx's eyeball at 2x, holds the end of Haunted Grove (tiles 44-62); the old bump there became two plank ledges, the eyeball, bat and ghost that were there were removed, and the chest now starts hidden at the arena's centre and appears when the Eye is defeated. A checkpoint flag sits before each arena, and an extra heart sits on the bump before the final arena.
- Entering an arena seals it with rune walls (collision in `overlapsSolid`), locks the camera to it, clears nearby ordinary enemies, shows the boss name banner and a health bar in the HUD. Dying resets an uncleared arena and its boss. All boss code is in the `bosses` section of `game/src/main.js`; spells (soft aim, zap chains, projectiles), stomps, electrified touches and the warrior's melee all damage bosses.
- King Gloop: 14 HP; hop cycle with every third hop bigger; each landing sends ice-spikes both ways and only the racing front line hurts; splits two slime minions at half health. Fire does double, ice does nothing.
- The Hollow Eye: 28 HP in three phases (60% and 30% thresholds): aimed volleys and lightning strikes, then spreads, double strikes and ghost summons (max two), then a telegraphed dive with root spikes and a dizzy window. Zap does double, ice stuns it for about a second. Lightning hurts between 0.76 and 1.12 s of the strike effect, matching its bolt.
- Newly vendored pixelfx effects: ice/ice-spikes, ice/snowflake-burst, lightning/lightning-strike, explosions/_lib and plasma-explosion, spawn/spawn-portal; arcane/mana-burst was already in the folder.
- Headless browser tests covered both fights with Biscuit start to finish (arena lock, damage multipliers, split, spikes and strikes hurting the hero, summons, dive, death, wall removal, chest reveal and "LEVEL 1 CLEAR"), and boss damage with the warrior, knight and mage. Frame time stayed around 10-14 ms. Difficulty and hit timing still need hands-on tuning with a real controller; a pre-existing request for an image named "undefined" at startup is harmless but could be tracked down.

## Stages, and Stage 1's bosses

- The single four-area level is now split into stages. `STAGES` near the top of `game/src/main.js` lists each stage's 64-tile segments; a segment has an area theme (art, weather, enemy palettes) and a layout name that `buildLevel` builds. Stage 1 is three Dusk Meadow segments: the original meadow (`meadow1`) plus two new layouts, Bramble Hills (`meadow2`) and Duskwood Edge (`meadow3`). Stage 2 is the old Frost Hollow, Ember Depths and Haunted Grove layouts with King Gloop and the Hollow Eye, unchanged except that it now starts at Frost Hollow.
- Area banners now come from each segment (`name` and `tip` in `STAGES`), weather changes only when the theme changes, and decor uses the segment's theme. Opening a stage's chest shows "STAGE n CLEAR"; pressing jump starts the next stage, keeping score, coins and hearts. R, Start and the Restart button restart the current stage. `?stage=n` picks the starting stage, and the page's Stage links keep the chosen hero (the hero links keep the stage).
- New Stage 1 bosses, both pixelfx critters drawn at 2.4x: Old Croaker (frog, 16 HP) at the end of Bramble Hills, and Duskwing (bat, 26 HP) at the end of Duskwood Edge, guarding the stage's chest. Croaker: leap with dust ripples on landing, tongue lash when the hero is close, arcing spit globs, two frog minions at half health; ice does double and slows him. Duskwing: telegraphed U-shaped swoops through the hero's position, homing bat minions, rests on the ground to be stomped, and at half health thorn drops onto flashing ground markers; fire does double, ice stuns. Duskwing's drawing is re-centred on its body each frame because the bat loop drifts in a figure-eight.
- Bosses are now defined in one `BOSSES` table (make, update, draw, hit box, contact damage, damage multipliers, on-hit effect, intro banner, health-bar and wall colours), so adding a boss means adding an entry and an arena in a layout. Projectiles gained optional gravity (`g`), damage cause and spark palette for spit and thorns, and bats can home in on the hero (`homing`).
- Headless browser tests played Stage 1's segments, every attack state of both new bosses, their defeats, the chest, "STAGE 1 CLEAR" and the jump into Stage 2, then both Stage 2 bosses with Biscuit and the warrior, and restart and link behaviour. No errors; frame time about 11 ms. Fight difficulty and timings still need hands-on tuning.


## Stage 2: Frost Hollow, and Rimeskull

- Stage 2 is now three Frost Hollow segments: the original frost layout restored to its pre-boss ending (`frost1`), Glacier Pass (`frost2`, new, ending in King Gloop's arena at tiles 49-63 with a checkpoint at 44), and Crystal Lake (`frost3`, new, ending in Rimeskull's arena at tiles 42-62 with two plank ledges, the stage's chest at tile 52 and a wall at 63). Ember Depths and Haunted Grove moved unchanged to Stage 3, which has no mid boss yet. The page's Stage links now include 3.
- Rimeskull: pixelfx's flying skull at 2.2x (blue flame, frosted bone palette, `hover: 0` and `floor: false` so it draws centred on `B.cy` with no ground shadow), 24 HP. Attacks: aimed ice shards (3, then 5 faster), icicle drops around the hero using the newly vendored `ice/icicle-fall` (it hurts only while the falling icicle overlaps the hero, `ICICLE_FREE` to `ICICLE_HIT`), and a slam: it rises over the hero, shudders above a flashing red mark, drops, sends ice spikes both ways and sits stuck in the ice for a stomp window. At half health it adds a blizzard gust that pushes the hero toward the far wall (`windVX`, added to the hero's horizontal move and reset every frame) while icicles fall. Fire does double, ice does nothing, zap stuns it briefly while hovering; contact freezes.
- Headless browser tests covered every Rimeskull state in both phases, hero damage from its attacks, its defeat and chest, King Gloop in Glacier Pass, the Hollow Eye in Stage 3, restart and links, with Biscuit and the warrior. No errors; frame time about 10-11 ms. Fight difficulty, the gust strength and icicle timing need hands-on tuning.

## Stage 3: Ember Depths, the Cinder Wyrm and the Pyre Phoenix

- Stage 3 is now three Ember Depths segments: the original `ember` layout, Cinder Steps (`ember2`, new, lava pits and a plank, ending in the Cinder Wyrm's arena at tiles 46-63 with a checkpoint at 40) and Magma Halls (`ember3`, new, ending in the Pyre Phoenix's arena at tiles 42-62 with two plank ledges, the chest at tile 52 and a wall at 63). Haunted Grove moved unchanged to Stage 4, a single segment for now; the page has a Stage 4 link.
- Cinder Wyrm: pixelfx's snake at 1.8x in a lava palette, 18 HP, hit box along its low body (`WYRM_BOX`; the snake faces right, head at +30). Crawls after the hero; "rear" spits 3-4 gravity fireballs aimed at and around the hero; "inhale" glows at the mouth then a `fire/fire-breath` jet (hurts in a widening cone up to 108 px for 1.1 s); at half health adds three `fire/flame-pillar` eruptions (hurt 0.6-1.9 s within 12 px). Ice does double and slows it, fire does nothing; contact burns.
- Pyre Phoenix: pixelfx's bird at 2x in fire colours, re-centred each frame with `bakeCentroid`, 28 HP. Meteors (`fire/meteor`, impact at 0.62 s, with red markers), fans of fireball feathers, a telegraphed dive onto a red mark followed by a dazed stomp window, and at half health `fire/fire-tornado` hazards that roll across the floor at 78 px/s and hurt only near the ground (jump them). Ice does double and stuns it while hovering; fire does nothing.
- Newly vendored pixelfx effects: fire/fire-breath, fire-tornado, flame-pillar, meteor and critters/bird. Projectiles with gravity now turn to face their direction of travel. Killing a boss also clears breath and tornado hazards.
- Headless browser tests covered every state of both bosses in both phases, all their hazards hurting the hero, defeats, the chest, and the Hollow Eye in Stage 4. No errors; frame time about 11-13 ms. Difficulty still needs hands-on tuning.
