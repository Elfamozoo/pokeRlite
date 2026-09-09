# Task 7 Brief: Écrans, Synthèse WebAudio & Intégration UI (`sons.js`, `ui.js`, `pokedex-ui.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 7

## Objective
Author the WebAudio procedural cry sound programs in `js/poke/gen3/sons.js`, update `js/poke/ordre.js` to load `GEN3_ECRANS`, update UI world selection and sprite path routing in `js/poke/ui.js` and `js/poke/pokedex-ui.js`, and verify with `tests/test_gen3_ui.mjs`.

## Files to Create / Modify
- Create: `js/poke/gen3/sons.js`
- Modify: `js/poke/ordre.js`
- Modify: `js/poke/ui.js`
- Modify: `js/poke/pokedex-ui.js`
- Create: `tests/test_gen3_ui.mjs`

## Requirements
1. **`js/poke/gen3/sons.js`**:
   - Defines `W.POKE_GEN3_SONS`:
     - Contains procedural WebAudio sound programs for the cries of species 252 through 386.
     - Compatible with `PokeAudio.cri(n)`.
     - Follows the data structure of `js/poke/sons.js` and `js/poke/gen2/sons.js` (channel configurations, pitches, envelopes, durations).
2. **`js/poke/ordre.js`**:
   - In `GEN3_ECRANS`, include `"js/poke/gen3/sons.js"`.
   - Splice `GEN3_ECRANS` into `ECRANS` when `W.POKE_BANC_HOENN` is true (right after `GEN2_ECRANS` or anims).
3. **`js/poke/ui.js`**:
   - In `MONDES_DITS`:
     ```javascript
     gen3: { nom: "mondeHoenn", dit: "mondeHoennDit", sur: "hoenn" }
     ```
   - In the dictionary of translation strings (`DITS` or localization):
     - `mondeHoenn`: { fr: "Hoenn", en: "Hoenn" }
     - `mondeHoennDit`: { fr: "La région des terres et des mers", en: "The land of land and seas" }
     - `mondeChoixSur`: ensure Hoenn is supported.
   - Sprite path resolution:
     - Check where face and back sprites are constructed (e.g. `imgFace(n)`, `imgDos(n)`, `spriteFace(n)`, `spriteDos(n)` in `ui.js`, `ui-combat.js`, `pokedex-ui.js`).
     - If `n > 251`:
       - Face sprite path: `assets/img/poke/gen3/face/${n}.png`
       - Back sprite path: `assets/img/poke/gen3/dos/${n}.png`
       - Artwork path: `assets/img/poke/art/${n}.webp`
     - Species 1-151 and 152-251 paths remain untouched.
4. **`js/poke/pokedex-ui.js`**:
   - Ensure the Pokédex grid and detail views work cleanly up to 386 (reading `W.PokeRegles.dexTotalCompte()`).
5. **Tests (`tests/test_gen3_ui.mjs`)**:
   - Asserts `W.POKE_GEN3_SONS` is defined and contains cry definitions for all species 252 to 386.
   - Asserts `MONDES_DITS.gen3` exists and has `nom`, `dit`, `sur`.
   - Asserts `POKE_ORDRE_ECRANS` includes `"js/poke/gen3/sons.js"`.
   - Asserts sprite path routing helper correctly handles Gen 1 (1-151), Gen 2 (152-251), and Gen 3 (252-386).
   - Asserts zero regression on existing suites (`tests/run_all_tests.mjs`).

## Output Contract
Write your full report to `.superpowers/sdd/2026-09-09-hoenn-gen3/task-7-report.md`.
Return only:
- Status: `DONE` | `DONE_WITH_CONCERNS` | `NEEDS_CONTEXT` | `BLOCKED`
- Commits created
- Short test summary
- Any concerns
