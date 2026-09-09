# Task 3 Brief: Dresseurs, Classes, Arènes et Rivaux (`dresseurs.js`, `classes.js`, `equipes.js`, `arenes.js`, `rival.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 3

## Objective
Author the trainer, gym leader, Elite Four, Champion, epilogue boss, and rival modules in `js/poke/gen3/` and test them with `tests/test_gen3_trainers.mjs`.

## Files to Create
- `js/poke/gen3/classes.js`
- `js/poke/gen3/dresseurs.js`
- `js/poke/gen3/equipes.js`
- `js/poke/gen3/arenes.js`
- `js/poke/gen3/rival.js`
- `tests/test_gen3_trainers.mjs`

## Requirements
1. **`js/poke/gen3/classes.js`**:
   - Declares `W.POKE_GEN3_CLASSES` (object mapping class identifiers to localized `{ fr, en }` names and prize money multipliers).
   - Includes canonical Emerald classes: `rich_boy`, `lady`, `triathlete`, `aroma_lady`, `pokemon_ranger`, `collector`, `ninja_boy`, `parasol_lady`, `sailor`, `fisherman`, `hiker`, `youngster`, `lass`, `swimmer_m`, `swimmer_f`, `team_aqua`, `team_magma`, `leader`, `elite_four`, `champion`, `expert`, etc.
2. **`js/poke/gen3/dresseurs.js`**:
   - Declares `W.POKE_GEN3_DRESSEURS` (pool of route trainers with unique ID, class, localized name, quotes, and team key).
3. **`js/poke/gen3/equipes.js`**:
   - Declares `W.POKE_GEN3_EQUIPES` (rosters of Pokémon with species number, level, and moves).
4. **`js/poke/gen3/arenes.js`**:
   - **8 Gym Leaders (Canonical Emerald Rosters)**:
     - `arene1` - Roxanne (Mérouville): Geodude 74 (lv 12), Geodude 74 (lv 12), Nosepass 299 (lv 15)
     - `arene2` - Brawly (Myokara): Machop 66 (lv 16), Meditite 307 (lv 16), Makuhita 296 (lv 19)
     - `arene3` - Wattson (Lavandia): Voltorb 100 (lv 20), Electrike 309 (lv 20), Magneton 82 (lv 22), Manectric 310 (lv 24)
     - `arene4` - Flannery (Vermilava): Numel 322 (lv 24), Slugma 218 (lv 24), Camerupt 323 (lv 26), Torkoal 324 (lv 29)
     - `arene5` - Norman (Clémenti-Ville): Spinda 327 (lv 27), Vigoroth 288 (lv 27), Linoone 264 (lv 29), Slaking 289 (lv 31)
     - `arene6` - Winona (Cimetronelle): Swablu 333 (lv 29), Tropius 357 (lv 29), Pelipper 279 (lv 30), Skarmory 227 (lv 31), Altaria 334 (lv 33)
     - `arene7` - Tate & Liza (Algatia): Claydol 344 (lv 41), Xatu 178 (lv 41), Lunatone 337 (lv 42), Solrock 338 (lv 42)
     - `arene8` - Juan (Atalanopolis): Luvdisc 370 (lv 41), Whiscash 340 (lv 41), Sealeo 364 (lv 43), Crawdaunt 342 (lv 43), Kingdra 230 (lv 46)
   - **Elite Four**:
     - `conseil1` - Sidney (Damien): Mightyena 262 (lv 46), Shiftry 275 (lv 48), Cacturne 332 (lv 46), Crawdaunt 342 (lv 48), Absol 359 (lv 49)
     - `conseil2` - Phoebe (Spectra): Dusclops 356 (lv 48), Banette 354 (lv 49), Sableye 302 (lv 50), Banette 354 (lv 49), Dusclops 356 (lv 51)
     - `conseil3` - Glacia: Glalie 362 (lv 50), Sealeo 364 (lv 50), Glalie 362 (lv 52), Sealeo 364 (lv 52), Walrein 365 (lv 53)
     - `conseil4` - Drake (Aragon): Shelgon 372 (lv 52), Altaria 334 (lv 54), Kingdra 230 (lv 53), Flygon 330 (lv 53), Salamence 373 (lv 55)
   - **Champion**:
     - `maitre` - Wallace (Marc): Wailord 321 (lv 57), Tentacruel 73 (lv 55), Ludicolo 272 (lv 56), Whiscash 340 (lv 56), Gyarados 130 (lv 56), Milotic 350 (lv 58)
   - **Epilogue Boss**:
     - `dresseurFinal` - Steven Stone (Pierre Rochard - Meteor Falls): Skarmory 227 (lv 77), Claydol 344 (lv 75), Aggron 306 (lv 76), Cradily 346 (lv 76), Armaldo 348 (lv 76), Metagross 376 (lv 78)
   - Exports: `W.POKE_GEN3_ARENES`, `W.POKE_GEN3_CONSEIL`, `W.POKE_GEN3_MAITRE`, `W.POKE_GEN3_STEVEN`.
5. **`js/poke/gen3/rival.js`**:
   - Declares `W.POKE_GEN3_RIVAL` containing the 3 starter variants for May/Brendan (Arcko 252, Poussifeu 255, Gobou 258) across key encounter checkpoints.
   - Declares `W.POKE_GEN3_TIMMY` (Wally) for his Victory Road battle with Gardevoir 282, Altaria 334, Delcatty 301, Roselia 315, Magneton 82.
6. **Strict NOYAU Constraints**:
   - Strict mode `'use strict'`.
   - Zero DOM, zero window/document access.
   - Zero non-deterministic calls (`Math.random`, `Date.now`).
7. **Test (`tests/test_gen3_trainers.mjs`)**:
   - Asserts all 8 gym leaders exist and have valid Pokémon numbers and levels.
   - Asserts 4 Elite Four members and Champion Wallace exist with complete teams.
   - Asserts Steven Stone exists with 6 Pokémon at levels 75-78.
   - Asserts rival variants cover all 3 starters.
   - Runs cleanly in Node.js and exits with code 0.

## Output Contract
Write your full report to `.superpowers/sdd/2026-09-09-hoenn-gen3/task-3-report.md`.
Return only:
- Status: `DONE` | `DONE_WITH_CONCERNS` | `NEEDS_CONTEXT` | `BLOCKED`
- Commits created
- Short test summary
- Any concerns
