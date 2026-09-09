# Task 2 Report: Module NOYAU Données (`types.js`, `effets.js`, `attaques.js`, `especes.js`, `objets.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 2  
**Status:** `DONE`

---

## 1. Summary of Changes

Implemented the core NOYAU data modules for Generation 3 (Hoenn — Pokémon Emerald reference) in `js/poke/gen3/` along with the validation test suite and the build/sanitization pipeline:

1. **`js/poke/gen3/types.js`**:
   - IIFE modular pattern `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);`.
   - Exports `W.POKE_GEN3_TYPES` (17 canonical types: Normal through Dark, excluding post-Gen 5 Fairy type).
   - Exports `W.POKE_GEN3_TYPE_NOMS` with bilingual `{ fr, en }` names for all 17 types.
   - Exports `W.POKE_GEN3_TYPE_TABLE` implementing the exact Gen 2/3 effectiveness matrix (e.g. Ghost vs Psychic = 2, Bug vs Poison = 0.5, Poison vs Bug = 1, Ice vs Fire = 0.5, Dark/Ghost resisted by Steel = 0.5).
   - Exports `W.POKE_GEN3_TYPES_SPECIAUX` containing the 8 canonical Special types (`fire`, `water`, `grass`, `electric`, `psychic`, `ice`, `dragon`, `dark`).

2. **`js/poke/gen3/effets.js`**:
   - Maps Gen 3 move effect identifiers to `combat.js` supported effect handlers.
   - Exports `W.POKE_GEN3_EFFETS` translating 3G effects (such as `EFFECT_FAKE_OUT`, `EFFECT_HEAT_WAVE`, `EFFECT_ARM_THRUST`, `EFFECT_IRON_DEFENSE`, `EFFECT_SHEER_COLD`, `EFFECT_AERIAL_ACE`, `EFFECT_SLACK_OFF`, etc.) to engine handlers (`FLINCH_SIDE_EFFECT1`, `BURN_SIDE_EFFECT1`, `TWO_TO_FIVE_ATTACKS_EFFECT`, `DEFENSE_UP2_EFFECT`, `OHKO_EFFECT`, `SWIFT_EFFECT`, `HEAL_EFFECT`, etc.).

3. **`js/poke/gen3/attaques.js`**:
   - Exports `W.POKE_GEN3_ATTAQUES` (array of exactly 103 moves, IDs 252 to 354, Fake Out through Psycho Boost) and `W.POKE_GEN3_ATTAQUE_PAR_CLE` (indexed by uppercase move key).
   - Enforces valid schema `{ id, cle, nom: { fr, en }, type, categorie, puissance, precision, pp, effet, chance, dit }`.
   - Enforces Gen 3 type-based categorization:
     - `categorie = "special"` for moves of types: `water`, `fire`, `grass`, `electric`, `ice`, `psychic`, `dragon`, `dark`.
     - `categorie = "physique"` for moves of types: `normal`, `fighting`, `flying`, `poison`, `ground`, `rock`, `bug`, `ghost`, `steel`.

4. **`js/poke/gen3/especes.js`**:
   - Exports `W.POKE_GEN3_ESPECES` (array of exactly 135 species, national dex numbers 252 to 386, Treecko through Deoxys) and `W.POKE_GEN3_ESPECE` (indexed by both national dex number and uppercase `cle`).
   - Retains 6 positive base stats `{ pv, atk, def, vit, sat, sdf }` and authentic Gen 3 pre-Fairy types (Ralts line pure Psychic, Mawile pure Steel, Azurill pure Normal).
   - **Full Evolution & Key Sanitization Applied**:
     - Removed cross-gen evolutions > 386: Linoone (264), Nosepass (299), Roselia (315), and Dusclops (356) now have `evolue: []`.
     - Kirlia (281) only evolves to Gardevoir (282) at level 30 (Gallade 475 removed).
     - Snorunt (361) only evolves to Glalie (362) at level 42 (Froslass 478 removed).
     - Cleaned duplicate evolutions for Zigzagoon (263) to a single entry (Linoone 264 at lv 20).
     - Ensured all evolution entries have a valid `par`: Nincada (290) evolves into Ninjask (291) and Shedinja (292) with `par: "niveau"`, `niveau: 20`.
     - Feebas (349) evolves into Milotic (350) with `par: "bonheur"`.
     - Normalized all 14 historical move keys in `depart`, `apprend`, and `ct` to canonical engine keys:
       `SOLARBEAM`, `PSYCHIC_M`, `FAINT_ATTACK`, `BUBBLEBEAM`, `POISONPOWDER`, `DYNAMICPUNCH`, `DOUBLESLAP`, `VICEGRIP`, `HI_JUMP_KICK`, `THUNDERPUNCH`, `DRAGONBREATH`, `SELFDESTRUCT`, `ANCIENTPOWER`, `EXTREMESPEED`.

5. **`js/poke/gen3/objets.js`**:
   - Exports `W.POKE_GEN3_OBJETS` containing 151 entries: Hoenn held items (Soul Dew, Deep Sea Tooth/Scale, Choice Band, Shell Bell, Silk Scarf, White Herb, Mental Herb, Incenses), berries (Oran, Sitrus, status berries, Pinch berries), evolution stones, Pokéballs, and key items/fossils (Claw/Root fossils, Devon Scope, Go-Goggles, Orbs, Magma Emblem, tickets).

6. **Tooling & Test Harness**:
   - `tools/poke-gen3-build-data.mjs`: Compilation script to compile and sanitize data from `notes-data/`.
   - `tests/test_gen3_data_module.mjs`: Headless test suite validating strict NOYAU constraints, headless execution, type chart correctness, move categorization, species integrity, evolution sanitization, and move key normalization.

---

## 2. Verification Results

1. **Initial TDD Failure Verification**:
   - `node tests/test_gen3_data_module.mjs` failed with 24/24 test failures prior to file implementation.

2. **Task 2 Test Suite (`tests/test_gen3_data_module.mjs`)**:
   - Command: `node tests/test_gen3_data_module.mjs`
   - Result: **24 / 24 tests passed (100%)**, 0 failures.

3. **Task 1 Test Suite (`tests/test_gen3_fetch.mjs`)**:
   - Command: `node tests/test_gen3_fetch.mjs`
   - Result: **12 / 12 tests passed (100%)**, 0 failures.

4. **Full Regression Suite (`tests/run_all_tests.mjs`)**:
   - Command: `node tests/run_all_tests.mjs`
   - Result: **25 / 25 tests passed (100%)**, zero regressions across existing Kanto & Johto test suites, PRNG determinism contract, and replay scoring.

---

## 3. Commits Created
- `feat(gen3): Task 2 - core NOYAU data modules` (commit `f399bc2`)

---

## 4. Concerns & Notes for Subsequent Tasks
- All 103 moves and 135 species are now indexed and available via global exports (`W.POKE_GEN3_ESPECE`, `W.POKE_GEN3_ATTAQUE_PAR_CLE`, etc.).
- Task 3 (`classes.js`, `dresseurs.js`, `equipes.js`, `arenes.js`, `rival.js`) can safely build trainer rosters referencing canonical species numbers 252-386 and move keys without any key mismatch.
