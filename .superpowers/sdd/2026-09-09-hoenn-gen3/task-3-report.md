# Task 3 Report: Dresseurs, Classes, Arènes et Rivaux (`classes.js`, `dresseurs.js`, `equipes.js`, `arenes.js`, `rival.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 3  
**Status:** `DONE`

---

## 1. Summary of Changes

Implemented the trainer, gym leader, Elite Four, Champion, epilogue boss, and rival modules for Generation 3 (Hoenn — Pokémon Emerald canonical rosters) in `js/poke/gen3/` along with the validation test suite `tests/test_gen3_trainers.mjs`:

1. **`js/poke/gen3/classes.js`**:
   - IIFE modular pattern `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);`.
   - Declares `W.POKE_GEN3_CLASSES` mapping canonical Hoenn trainer classes to localized `{ fr, en }` names, prize money multipliers (`mult`), and route flags (`route: true/false`).
   - Includes canonical Emerald classes: `rich_boy`, `lady`, `triathlete`, `aroma_lady`, `pokemon_ranger`, `collector`, `ninja_boy`, `parasol_lady`, `sailor`, `fisherman`, `hiker`, `youngster`, `lass`, `swimmer_m`, `swimmer_f`, `team_aqua`, `team_magma`, `leader`, `elite_four`, `champion`, `expert`, `bug_catcher`, `camper`, `picnicker`, `cooltrainer_m`, `cooltrainer_f`, `guitarist`, `bird_keeper`, `black_belt`, `psychic`, `gentleman`, `beauty`, `ruin_maniac`, `pokemaniac`, `hex_maniac`, `dragon_tamer`, `tuber`, `kindler`, `twins`.
   - Also aliases PascalCase equivalents (`Youngster`, `Lass`, `Hiker`, `Sailor`, `RichBoy`, etc.) for seamless cross-generation engine interoperability.

2. **`js/poke/gen3/dresseurs.js`**:
   - Declares `W.POKE_GEN3_DRESSEURS` containing a pool of 25+ iconic route trainers across Hoenn.
   - Each trainer has unique `id` (e.g. `youngster_calvin`, `rich_boy_winston`, `ninja_boy_lao`, `parasol_lady_madeline`), valid `classe`, localized name `{ fr, en }`, combat quotes `{ debut, fin }`, and associated `equipeKey`.

3. **`js/poke/gen3/equipes.js`**:
   - Declares `W.POKE_GEN3_EQUIPES` providing calibrated Pokémon rosters for route trainer classes.
   - Levels span from early routes (lv 3-6) to late routes and Victory Road (lv 45-50).
   - Every Pokémon specifies national dex number (1-386), level, and canonical move keys (`TACKLE`, `HEADBUTT`, `AERIAL_ACE`, `SURF`, `EARTHQUAKE`, etc.).

4. **`js/poke/gen3/arenes.js`**:
   - **8 Gym Leaders (`W.POKE_GEN3_ARENES`)** with canonical Emerald rosters:
     - `arene1` - Roxanne (Mérouville / Rustboro): Geodude #74 (lv 12), Geodude #74 (lv 12), Nosepass #299 (lv 15).
     - `arene2` - Brawly (Myokara / Dewford): Machop #66 (lv 16), Meditite #307 (lv 16), Makuhita #296 (lv 19).
     - `arene3` - Wattson (Lavandia / Mauville): Voltorb #100 (lv 20), Electrike #309 (lv 20), Magneton #82 (lv 22), Manectric #310 (lv 24).
     - `arene4` - Flannery (Vermilava / Lavaridge): Numel #322 (lv 24), Slugma #218 (lv 24), Camerupt #323 (lv 26), Torkoal #324 (lv 29).
     - `arene5` - Norman (Clémenti-Ville / Petalburg): Spinda #327 (lv 27), Vigoroth #288 (lv 27), Linoone #264 (lv 29), Slaking #289 (lv 31).
     - `arene6` - Winona (Cimetronelle / Fortree): Swablu #333 (lv 29), Tropius #357 (lv 29), Pelipper #279 (lv 30), Skarmory #227 (lv 31), Altaria #334 (lv 33).
     - `arene7` - Tate & Liza (Algatia / Mossdeep): Claydol #344 (lv 41), Xatu #178 (lv 41), Lunatone #337 (lv 42), Solrock #338 (lv 42).
     - `arene8` - Juan (Atalanopolis / Sootopolis): Luvdisc #370 (lv 41), Whiscash #340 (lv 41), Sealeo #364 (lv 43), Crawdaunt #342 (lv 43), Kingdra #230 (lv 46).
   - **Elite Four (`W.POKE_GEN3_CONSEIL`)**:
     - `conseil1` - Sidney (Damien): Mightyena #262 (lv 46), Shiftry #275 (lv 48), Cacturne #332 (lv 46), Crawdaunt #342 (lv 48), Absol #359 (lv 49).
     - `conseil2` - Phoebe (Spectra): Dusclops #356 (lv 48), Banette #354 (lv 49), Sableye #302 (lv 50), Banette #354 (lv 49), Dusclops #356 (lv 51).
     - `conseil3` - Glacia: Glalie #362 (lv 50), Sealeo #364 (lv 50), Glalie #362 (lv 52), Sealeo #364 (lv 52), Walrein #365 (lv 53).
     - `conseil4` - Drake (Aragon): Shelgon #372 (lv 52), Altaria #334 (lv 54), Kingdra #230 (lv 53), Flygon #330 (lv 53), Salamence #373 (lv 55).
   - **Champion (`W.POKE_GEN3_MAITRE`)**:
     - Wallace (Marc): Wailord #321 (lv 57), Tentacruel #73 (lv 55), Ludicolo #272 (lv 56), Whiscash #340 (lv 56), Gyarados #130 (lv 56), Milotic #350 (lv 58).
   - **Epilogue Boss (`W.POKE_GEN3_STEVEN`)**:
     - Steven Stone (Pierre Rochard - Meteor Falls): Skarmory #227 (lv 77), Claydol #344 (lv 75), Aggron #306 (lv 76), Cradily #346 (lv 76), Armaldo #348 (lv 76), Metagross #376 (lv 78).

5. **`js/poke/gen3/rival.js`**:
   - Declares `W.POKE_GEN3_RIVAL` containing 3 starter variants for May/Brendan (`ordre: [252, 255, 258]`) across key encounter checkpoints (`debut` for Route 103, 110, 119; `milieu` for Lilycove City and epilogue).
   - Declares `W.POKE_GEN3_TIMMY` (Wally) with canonical Victory Road roster: Altaria #334 (lv 44), Delcatty #301 (lv 43), Roselia #315 (lv 44), Magneton #82 (lv 41), Gardevoir #282 (lv 45).

6. **Strict NOYAU Constraints**:
   - `'use strict'` enforced in all files.
   - Zero DOM / window / document access.
   - Zero non-deterministic calls (`Math.random`, `Date.now`, etc.).

---

## 2. Verification Results

1. **Initial TDD Failure Verification**:
   - `node tests/test_gen3_trainers.mjs` was executed prior to file creation and failed with 16/16 test failures.

2. **Task 3 Test Suite (`tests/test_gen3_trainers.mjs`)**:
   - Command: `node tests/test_gen3_trainers.mjs`
   - Result: **16 / 16 tests passed (100%)**, 0 failures.

3. **Data Modules Test Suite (`tests/test_gen3_data_module.mjs`)**:
   - Command: `node tests/test_gen3_data_module.mjs`
   - Result: **24 / 24 tests passed (100%)**, 0 failures.

4. **Full Regression Suite (`tests/run_all_tests.mjs`)**:
   - Command: `node tests/run_all_tests.mjs`
   - Result: **25 / 25 tests passed (100%)**, zero regressions across existing modules, NOYAU pure execution, PRNG determinism, and replay scoring.

---

## 3. Commits Created
- `feat(gen3): Task 3 - trainers, gym leaders, elite four and rivals` (`f937c69`)

---

## 4. Concerns & Notes for Subsequent Tasks
- Gym Leaders (`W.POKE_GEN3_ARENES`), Elite Four (`W.POKE_GEN3_CONSEIL`), Wallace (`W.POKE_GEN3_MAITRE`), Steven (`W.POKE_GEN3_STEVEN`), Rival (`W.POKE_GEN3_RIVAL`), and Wally (`W.POKE_GEN3_TIMMY`) are fully defined and available for consumption by Task 4 (`monde.js`, `obtentions.js`), Task 5 (`voyage.js`), and Task 6 (`regles.js`).
