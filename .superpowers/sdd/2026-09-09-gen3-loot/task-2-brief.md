# Task 2 Brief: Core Loot & Reward Engine Adaptation (Butin, Obtenir, Carte-Actes)

## Context & Objectives
In Task 1, we implemented the canonical Gen 3 Technical Machines (CT01 to CT50) and Hidden Machines (CS01 to CS08) in `js/poke/gen3/ct.js` and wired them dynamically through `regles.js` (`PokeRegles.ct`, `PokeRegles.cs`, `PokeRegles.ctParCle`).

Now in Task 2, we adapt the core loot, rewards, and shopping engines so that when playing in Hoenn (Gen 3):
1. Post-battle TM loot cards (`js/poke/butin.js`: `apprenables(p)`):
   - Query CT list dynamically via `(W.PokeRegles && W.PokeRegles.ct ? W.PokeRegles.ct(p) : W.POKE_CT)` instead of hardcoded `W.POKE_CT`.
   - In Gen 3, offer learnable Gen 3 TMs (CT01 to CT50) based on active Pokémon species learnsets in `W.POKE_GEN3_ESPECES`.
2. Evolution stone loot cards (`js/poke/butin.js`: `pierresUtiles(p)`):
   - Recognize all canonical stone evolutions present in the team (including `WATER_STONE`, `LEAF_STONE`, `MOON_STONE`, `SUN_STONE`, `FIRE_STONE`, `THUNDERSTONE`/`THUNDER_STONE`).
3. Vitamin rewards & items (`js/poke/butin.js`, `js/poke/obtenir.js`, `js/poke/carte-actes.js`):
   - Support `ZINC` (Special Defense EV/stat-exp) alongside `HP_UP`, `PROTEIN`, `IRON`, `CARBOS`, `CALCIUM`.
   - In `obtenir.js`, define `VITAMINES_GEN3` with `ZINC: "sdf"` and `CALCIUM: "sat"` (or appropriate mapping).
   - In `employerVitamine`, handle `ZINC` and update statExp properly (with `mon.statExp.sdf`, `mon.statExp.sat`, and recalculate stats via `M().calculerStats(mon)`).
   - In `moteur.js:calculerStats`: Ensure if `e.sat` or `e.sdf` are present, `s[sa]` and `s[sd]` respect them (falling back to `e.spe` for Gen 1 / Gen 2).
   - **CRITICAL REPLAY / PRNG PRESERVATION**: In `butin.js:vitamine`, for Gen 1 / Gen 2 parties, the drawn table MUST remain strictly the 5 legacy vitamins (`Object.keys(W.PokeObtenir.VITAMINES)`) so PRNG draws (`h.dans`) are completely unchanged on Kanto and Johto seeds! Only for Gen 3 does it include `ZINC`.
4. Gym Leader TM rewards and TM resolution (`js/poke/obtenir.js`: `machinePour(cle, p)`):
   - Handle `"TM39"`, `"TM08"`, `"TM34"`, etc. (from `W.POKE_GEN3_ARENES`), as well as numeric `39`, `"TM_ROCK_TOMB"`, or move keys, resolving against the active generation's CT table `(W.PokeRegles && W.PokeRegles.ct ? W.PokeRegles.ct(p) : W.POKE_CT)`.
   - Update `ctDe(p)` to use the active generation's CT table.
5. Poké Marts & Shops (`js/poke/gen3/obtentions.js`, `js/poke/obtenir.js`, `js/poke/carte-actes.js`):
   - In `js/poke/gen3/obtentions.js`, define `W.POKE_GEN3_MARTS` with canonical Emerald town inventories and Lilycove Department Store counters (`LilycoveDept2F`, `LilycoveDept3F`, `LilycoveDept4F`, `LilycoveDept5F`).
   - In `obtenir.js`:
     - Update `martPour(p)` to use Gen 3 marts per act when in Gen 3 (`RustboroMart`, `DewfordMart`, `MauvilleMart`, `LavaridgeMart`, `VerdanturfMart`, `FortreeMart`, `LilycoveDept2F`, `MossdeepMart`, `EverGrandeMart`).
     - Update `inventaire(nomMart)` to look up `nomMart` across `W.POKE_GEN3_MARTS`, `W.POKE_GEN2_MARTS`, or `W.POKE_MARTS`.
     - Expose `martMachines(p)` (returning `"LilycoveDept4F"` in Gen 3, `MART_MACHINES` otherwise) and `martCombat(p)` (returning `"LilycoveDept3F"` in Gen 3, `MART_COMBAT` otherwise).
   - In `carte-actes.js:noeudBoutique`:
     - On the rare shelf (acte >= 4), when in Gen 3, include `ZINC` in the vitamins pool and include `MOON_STONE` and `SUN_STONE` in the stones pool.
     - Preserving 100% invariance for Gen 1 and Gen 2 rare shelves.

## Files to Create & Modify
- Create `tests/test_gen3_loot_engine.mjs` (TDD unit test verifying all Task 2 requirements).
- Modify `js/poke/gen3/obtentions.js`: add `W.POKE_GEN3_MARTS`.
- Modify `js/poke/butin.js`: update `apprenables(p)`, `pierresUtiles(p)`, `vitamine.tirer`.
- Modify `js/poke/obtenir.js`: update `machinePour(cle, p)`, `ctDe(p)`, `VITAMINES_GEN3`, `employerVitamine`, `inventaire`, `martPour`, `martMachines`, `martCombat`.
- Modify `js/poke/carte-actes.js`: update `noeudBoutique` rare shelf for Gen 3.
- Modify `js/poke/moteur.js`: support `expSa` / `expSd` in `calculerStats` if `e.sat`/`e.sdf` are defined on `p.statExp`.

## Strict Constraints
- Strict NOYAU rules: 'use strict', zero DOM access, zero `Math.random()`, zero `Date.now()`.
- Determinism & Non-Regression: all 36+ tests in `tests/run_all_tests.mjs` MUST remain green.
- Single source of truth: Gen 3 CTs read from `PokeRegles.ct(p)`.
