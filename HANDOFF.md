# Lantern Run handoff

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
