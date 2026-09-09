# Task 1 Brief: Canonical Gen 3 Technical Machines (CTs & CSs) and Registry Wiring

## Objective
Create the canonical Generation 3 Technical Machines (CT01 to CT50) and Hidden Machines (CS01 to CS08) module (`js/poke/gen3/ct.js`), wire it into the single source of truth in `js/poke/ordre.js` (`GEN3`), and expose unified CT accessors in `js/poke/regles.js` (`PokeRegles.ct(partie)`, `cs(partie)`, `ctParCle(partie)`).

## Requirements
1. **`js/poke/gen3/ct.js`**:
   - Strict NOYAU rules: `'use strict'`, zero DOM/browser dependencies, zero `Math.random()` / `Date.now()`.
   - Export `W.POKE_GEN3_CT` containing the 50 canonical Gen 3 CTs:
     ```javascript
     W.POKE_GEN3_CT = [
       { n: 1, cle: "FOCUS_PUNCH", prix: 3000, type: "fighting" },
       { n: 2, cle: "DRAGON_CLAW", prix: 3000, type: "dragon" },
       { n: 3, cle: "WATER_PULSE", prix: 3000, type: "water" },
       { n: 4, cle: "CALM_MIND", prix: 3000, type: "psychic" },
       { n: 5, cle: "ROAR", prix: 1000, type: "normal" },
       { n: 6, cle: "TOXIC", prix: 3000, type: "poison" },
       { n: 7, cle: "HAIL", prix: 3000, type: "ice" },
       { n: 8, cle: "BULK_UP", prix: 3000, type: "fighting" },
       { n: 9, cle: "BULLET_SEED", prix: 2000, type: "grass" },
       { n: 10, cle: "HIDDEN_POWER", prix: 3000, type: "normal" },
       { n: 11, cle: "SUNNY_DAY", prix: 2000, type: "fire" },
       { n: 12, cle: "TAUNT", prix: 3000, type: "dark" },
       { n: 13, cle: "ICE_BEAM", prix: 4000, type: "ice" },
       { n: 14, cle: "BLIZZARD", prix: 5500, type: "ice" },
       { n: 15, cle: "HYPER_BEAM", prix: 7500, type: "normal" },
       { n: 16, cle: "LIGHT_SCREEN", prix: 3000, type: "psychic" },
       { n: 17, cle: "PROTECT", prix: 3000, type: "normal" },
       { n: 18, cle: "RAIN_DANCE", prix: 2000, type: "water" },
       { n: 19, cle: "GIGA_DRAIN", prix: 3000, type: "grass" },
       { n: 20, cle: "SAFEGUARD", prix: 3000, type: "normal" },
       { n: 21, cle: "FRUSTRATION", prix: 1000, type: "normal" },
       { n: 22, cle: "SOLARBEAM", prix: 3000, type: "grass" },
       { n: 23, cle: "IRON_TAIL", prix: 3000, type: "steel" },
       { n: 24, cle: "THUNDERBOLT", prix: 4000, type: "electric" },
       { n: 25, cle: "THUNDER", prix: 5500, type: "electric" },
       { n: 26, cle: "EARTHQUAKE", prix: 3000, type: "ground" },
       { n: 27, cle: "RETURN", prix: 1000, type: "normal" },
       { n: 28, cle: "DIG", prix: 2000, type: "ground" },
       { n: 29, cle: "PSYCHIC_M", prix: 3500, type: "psychic" },
       { n: 30, cle: "SHADOW_BALL", prix: 3000, type: "ghost" },
       { n: 31, cle: "BRICK_BREAK", prix: 3000, type: "fighting" },
       { n: 32, cle: "DOUBLE_TEAM", prix: 2000, type: "normal" },
       { n: 33, cle: "REFLECT", prix: 3000, type: "psychic" },
       { n: 34, cle: "SHOCK_WAVE", prix: 3000, type: "electric" },
       { n: 35, cle: "FLAMETHROWER", prix: 4000, type: "fire" },
       { n: 36, cle: "SLUDGE_BOMB", prix: 3000, type: "poison" },
       { n: 37, cle: "SANDSTORM", prix: 2000, type: "rock" },
       { n: 38, cle: "FIRE_BLAST", prix: 5500, type: "fire" },
       { n: 39, cle: "ROCK_TOMB", prix: 3000, type: "rock" },
       { n: 40, cle: "AERIAL_ACE", prix: 3000, type: "flying" },
       { n: 41, cle: "TORMENT", prix: 3000, type: "dark" },
       { n: 42, cle: "FACADE", prix: 3000, type: "normal" },
       { n: 43, cle: "SECRET_POWER", prix: 3000, type: "normal" },
       { n: 44, cle: "REST", prix: 3000, type: "psychic" },
       { n: 45, cle: "ATTRACT", prix: 3000, type: "normal" },
       { n: 46, cle: "THIEF", prix: 3000, type: "dark" },
       { n: 47, cle: "STEEL_WING", prix: 3000, type: "steel" },
       { n: 48, cle: "SKILL_SWAP", prix: 3000, type: "psychic" },
       { n: 49, cle: "SNATCH", prix: 3000, type: "dark" },
       { n: 50, cle: "OVERHEAT", prix: 3000, type: "fire" }
     ];
     ```
   - Export `W.POKE_GEN3_CS` containing the 8 canonical Gen 3 HMs:
     ```javascript
     W.POKE_GEN3_CS = [
       { n: 1, cle: "CUT", cs: true, type: "normal" },
       { n: 2, cle: "FLY", cs: true, type: "flying" },
       { n: 3, cle: "SURF", cs: true, type: "water" },
       { n: 4, cle: "STRENGTH", cs: true, type: "normal" },
       { n: 5, cle: "FLASH", cs: true, type: "normal" },
       { n: 6, cle: "ROCK_SMASH", cs: true, type: "fighting" },
       { n: 7, cle: "WATERFALL", cs: true, type: "water" },
       { n: 8, cle: "DIVE", cs: true, type: "water" }
     ];
     ```
   - Export `W.POKE_GEN3_CT_PAR_CLE` fast lookup table mapping move key to CT or CS object.
   - Attach to `typeof window !== "undefined" ? window : globalThis`.

2. **`js/poke/ordre.js`**:
   - In `GEN3` array, insert `"js/poke/gen3/ct.js"` right after `"js/poke/gen3/objets.js"`.

3. **`js/poke/regles.js`**:
   - In `JEUX.gen1`: add `ct: function () { return W.POKE_CT; }`, `cs: function () { return null; }`, `ctParCle: function () { return W.POKE_CT_PAR_CLE; }`.
   - In `JEUX.gen2`: add `ct: function () { return W.POKE_GEN2_CT || W.POKE_CT; }`, `cs: function () { return null; }`.
   - In `JEUX.gen3`: add `ct: function () { return W.POKE_GEN3_CT || W.POKE_CT; }`, `cs: function () { return W.POKE_GEN3_CS || null; }`, `ctParCle: function () { return W.POKE_GEN3_CT_PAR_CLE || W.POKE_CT_PAR_CLE; }`.
   - On `PokeRegles`:
     ```javascript
     ct: function (partieOuCle) {
       var k = typeof partieOuCle === "string" ? partieOuCle : de(partieOuCle);
       var j = JEUX[k] || jeu();
       return j.ct ? j.ct() : W.POKE_CT;
     },
     cs: function (partieOuCle) {
       var k = typeof partieOuCle === "string" ? partieOuCle : de(partieOuCle);
       var j = JEUX[k] || jeu();
       return j.cs ? j.cs() : null;
     },
     ctParCle: function (partieOuCle) {
       var k = typeof partieOuCle === "string" ? partieOuCle : de(partieOuCle);
       var j = JEUX[k] || jeu();
       return j.ctParCle ? j.ctParCle() : W.POKE_CT_PAR_CLE;
     }
     ```

4. **Testing**:
   - Write `tests/test_gen3_ct.mjs` verifying:
     - All 50 CTs exist, in order 1..50, with valid names, keys, prices and types.
     - All 8 CSs exist, in order 1..8, with `cs: true`.
     - `W.POKE_GEN3_CT_PAR_CLE` maps `"FOCUS_PUNCH"` -> CT01, `"OVERHEAT"` -> CT50, `"DIVE"` -> CS08.
     - `PokeRegles.ct("gen3")` returns `W.POKE_GEN3_CT`.
     - `PokeRegles.ct("gen1")` returns `W.POKE_CT`.
     - Non-regression: `node tests/run_all_tests.mjs` passes 100%.

## Report Contract
The implementer writes its report to:
`.superpowers/sdd/2026-09-09-gen3-loot/task-1-report.md`
And returns only:
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- Commits created
- Short test summary
- Any concerns
