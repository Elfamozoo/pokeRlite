# Task 2 Brief: Module NOYAU Données (`types.js`, `especes.js`, `attaques.js`, `effets.js`, `objets.js`)

**Plan:** `docs/superpowers/plans/2026-09-09-hoenn-gen3.md`  
**Task Number:** 2

## Objective
Author the core NOYAU data modules for Gen 3 in `js/poke/gen3/` and test them with `tests/test_gen3_data_module.mjs`.

## Files to Create
- `js/poke/gen3/types.js`
- `js/poke/gen3/effets.js`
- `js/poke/gen3/attaques.js`
- `js/poke/gen3/especes.js`
- `js/poke/gen3/objets.js`
- `tests/test_gen3_data_module.mjs`

## Requirements
1. **`js/poke/gen3/types.js`**:
   - IIFE modular pattern `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);`.
   - Exports `W.POKE_GEN3_TYPES`, `W.POKE_GEN3_TYPE_NOMS`, `W.POKE_GEN3_TYPE_TABLE`, `W.POKE_GEN3_TYPES_SPECIAUX`.
   - Reuses the canonical 17-type chart established in Gen 2.
2. **`js/poke/gen3/effets.js`**:
   - Maps Gen 3 move effect identifiers to `combat.js` supported effect handlers.
   - Exports `W.POKE_GEN3_EFFETS`.
3. **`js/poke/gen3/attaques.js`**:
   - Exports `W.POKE_GEN3_ATTAQUES` (array of 103 moves from Fake Out 252 to Psycho Boost 354) and `W.POKE_GEN3_ATTAQUE_PAR_CLE` (object index by `cle`).
   - Every move must have `{ cle, nom: { fr, en }, type, categorie, puissance, precision, pp, effet }`.
   - `categorie`: Follows Gen 3 type-based categorization:
     - Special: `water`, `fire`, `grass`, `electric`, `ice`, `psychic`, `dragon`, `dark`.
     - Physical: `normal`, `fighting`, `flying`, `poison`, `ground`, `rock`, `bug`, `ghost`, `steel`.
4. **`js/poke/gen3/especes.js`**:
   - Exports `W.POKE_GEN3_ESPECES` (array of 135 species, indices 252 to 386) and `W.POKE_GEN3_ESPECE` (object keyed by national dex number `252`..`386`).
   - Base stats use the 6 stats `{ pv, atk, def, vit, sat, sdf }`.
   - Types use canonical Gen 3 types (no Fairy type).
   - **Crucial fixes from Task 1 Review**:
     - Clean cross-gen evolutions: Remove any `vers` targeting Pokémon > 386 (Linoone 264, Nosepass 299, Roselia 315, Dusclops 356 have `evolue: []` in Gen 3; Kirlia 281 only evolves to Gardevoir 282 at lv 30; Snorunt 361 only evolves to Glalie 362 at lv 42).
     - Clean duplicate entries (Zigzagoon).
     - Ensure all evolution entries have a valid `par` (e.g. Nincada into Ninjask 291 and Shedinja 292).
     - Feebas 349 evolves to Milotic 350 (`par: "bonheur"` or beauty condition).
     - Normalize the 14 legacy move keys in `depart`, `apprend`, `ct`:
       - `SOLARBEAM`, `PSYCHIC_M`, `FAINT_ATTACK`, `BUBBLEBEAM`, `POISONPOWDER`, `DYNAMICPUNCH`, `DOUBLESLAP`, `VICEGRIP`, `HI_JUMP_KICK`, `THUNDERPUNCH`, `DRAGONBREATH`, `SELFDESTRUCT`, `ANCIENTPOWER`, `EXTREMESPEED`.
5. **`js/poke/gen3/objets.js`**:
   - Exports `W.POKE_GEN3_OBJETS` (Hoenn held items, berries, evolution stones, and key items).
6. **Strict NOYAU Constraints**:
   - Strict mode `'use strict'` everywhere.
   - Zero DOM access, zero `window`, zero `document`.
   - Zero non-deterministic calls (`Math.random`, `Date.now`).
7. **Test (`tests/test_gen3_data_module.mjs`)**:
   - Runs in headless Node.js without DOM.
   - Asserts all 135 species exist and are valid.
   - Asserts no evolutions > 386 exist.
   - Asserts move normalization and valid categories.
   - Asserts zero DOM and zero non-deterministic leaks.

## Output Contract
Write your full report to `.superpowers/sdd/2026-09-09-hoenn-gen3/task-2-report.md`.
Return only:
- Status: `DONE` | `DONE_WITH_CONCERNS` | `NEEDS_CONTEXT` | `BLOCKED`
- Commits created
- Short test summary
- Any concerns
