# Task 2 Report: Base de Données des Talents (Abilities) pour 100 % des Espèces

## Metadata
- **Task**: Task 2 — Base de Données des Talents (Abilities) pour 100 % des Espèces
- **Status**: DONE
- **Commit**: `68b2d9f9642cc38a82dae2855807f958bf3c2ec4` (`feat(gen3): Task 2 - canonical abilities database and 100% species mapping`)
- **Date**: 2026-09-09

---

## 1. Summary of Changes

### 1.1. `js/poke/gen3/talents.js` [CREATED]
- Declares all 76 canonical Gen 3 abilities in `POKE_GEN3_TALENTS`:
  - Each ability specifies `id`, localized `nom` (`fr`, `en`), and localized `desc` (`fr`, `en`).
  - Covers weather abilities (`DRIZZLE`, `DROUGHT`, `SAND_STREAM`, `AIR_LOCK`), competitive anchors (`INTIMIDATE`, `LEVITATE`, `WONDER_GUARD`, `HUGE_POWER`, `PURE_POWER`, `SPEED_BOOST`), and signatures (`FORECAST`, `COLOR_CHANGE`, `SHADOW_TAG`, `TRUANT`).
- Exports the `W.PokeTalents` helper API:
  - `table()`: returns `POKE_GEN3_TALENTS`.
  - `cles()` and `liste()`: returns array of all 76 talent IDs.
  - `nom(cle, lang)`: returns translated talent name (defaults to French).
  - `desc(cle, lang)`: returns translated description (defaults to French).
  - `de(p)`: returns ability from Pokemon instance (`p.talent`) or fallback to species (`esp[p.n].talent`).
- Strict NOYAU compliance: strict mode (`"use strict"`), zero DOM/browser global leaks, zero unauthorized non-deterministic calls.

### 1.2. `js/poke/gen3/especes.js` & `notes-data/POKE_GEN3_ESPECES.json` [MODIFIED]
- Enriched all 135 Hoenn species (252 to 386) with their canonical Gen 3 `talent`:
  - Starters: Treecko line (`OVERGROW`), Torchic line (`BLAZE`), Mudkip line (`TORRENT`).
  - Signatures: Shedinja (`WONDER_GUARD`), Castform (`FORECAST`), Kecleon (`COLOR_CHANGE`), Slakoth/Slaking (`TRUANT`), Ninjask (`SPEED_BOOST`).
  - Legendaries: Kyogre (`DRIZZLE`), Groudon (`DROUGHT`), Rayquaza (`AIR_LOCK`), Jirachi (`SERENE_GRACE`), Deoxys (`PRESSURE`), Regis/Latis.
- Updated generator `tools/poke-gen3-build-data.mjs` with `GEN3_TALENTS_MAP` to ensure reproducible builds.

### 1.3. `js/poke/especes.js` & `js/poke/gen2/especes.js` [MODIFIED]
- Enriched all 251 species (1 to 251) with their official Gen 3 retro `talent`:
  - Starters: Bulbasaur line (`OVERGROW`), Charmander line (`BLAZE`), Squirtle line (`TORRENT`), Chikorita (`OVERGROW`), Cyndaquil (`BLAZE`), Totodile (`TORRENT`).
  - Signatures: Pikachu/Raichu (`STATIC`), Gengar (`LEVITATE`), Snorlax (`IMMUNITY`), Mewtwo (`PRESSURE`), Mew (`SYNCHRONIZE`), Tyranitar (`SAND_STREAM`), Lugia/Ho-Oh (`PRESSURE`), Celebi (`NATURAL_CURE`).
  - Both `js/poke/especes.js` (1-151) and `js/poke/gen2/especes.js` (1-251) updated to ensure total consistency regardless of which rule profile is mounted.

### 1.4. `js/poke/moteur.js` [MODIFIED]
- In `creer(n, niveau, h, options)`:
  ```javascript
  talent: o.talent !== undefined ? o.talent : (e.talent || (e.talents && e.talents[0]) || null),
  ```
- Automatically initializes `talent` on every creature instantiation while respecting custom overrides (`o.talent`).
- Consumes zero PRNG draws, maintaining strict bit-identical determinism across replay simulations.

### 1.5. `js/poke/ordre.js` [MODIFIED]
- Registered `"js/poke/gen3/talents.js"` in `GEN3` immediately following `"js/poke/gen3/natures.js"`.

### 1.6. `tests/test_gen3_talents_data.mjs` [CREATED]
- Test suite with 11 tests verifying:
  1. `talents.js` existence and static NOYAU constraints.
  2. `ordre.js` wiring after `natures.js`.
  3. All 76 abilities in `POKE_GEN3_TALENTS` with valid `nom` and `desc`.
  4. Helper `PokeTalents` methods (`table`, `cles`, `liste`, `nom`, `desc`, `de`).
  5. 100% of 135 Hoenn species (252-386) have a valid ability.
  6. 100% of species 1-251 have a valid ability.
  7. Engine integration in `creer` and PRNG draw invariance.

### 1.7. `tests/run_all_tests.mjs` [MODIFIED]
- Updated `POKE_ORDRE_GEN3` expected count from 15 to 16.

---

## 2. Test Verification

### 2.1. Dedicated Unit Test: `test_gen3_talents_data.mjs`
- Initial test before implementation: **FAILED (1/11 passed, 10 failed)**
- Final test after implementation: **PASSED (11/11 passed, 100%)**

```
=== 1. File Existence & Static Constraints (js/poke/gen3/talents.js) ===
  ✓ talents.js exists on disk
  ✓ talents.js respects strict mode and has zero non-deterministic / DOM calls

=== 2. ordre.js Dependency Wiring ===
  ✓ ordre.js includes talents.js in GEN3 immediately after natures.js

=== 3. Canonical Abilities Definitions & PokeTalents Helpers ===
  ✓ talents.js evaluates and exports POKE_GEN3_TALENTS and PokeTalents
  ✓ POKE_GEN3_TALENTS contains exactly 76 abilities with valid nom and desc
  ✓ PokeTalents helper functions work as expected

=== 4. Species Talent Mapping Verification (1-386) ===
  ✓ All 135 Hoenn species (252-386) have valid canonical talents
  ✓ All species 1-251 have valid canonical Gen 3 retro-talents

=== 5. PokeMoteur.creer Integration & PRNG Invariance ===
  ✓ creer automatically initializes talent from species
  ✓ creer respects explicit o.talent override
  ✓ creer talent initialization consumes zero PRNG draws

Total Tests: 11 | Passed: 11 | Failed: 0
ALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)
```

### 2.2. Regression Test Suite: `run_all_tests.mjs`
- **Result**: **44/44 passed (100%)**
- Execution time: ~270ms
- Turn-by-turn combat determinism (Gen 1, Gen 2, Gen 3): 100% bit-identical.
- Replay daily scoring: 100% identical.

---

## 3. Invariants & Non-Regression
- **100% Species Coverage**: All 386 canonical species from National Dex 1 to 386 have a valid `talent` referencing `POKE_GEN3_TALENTS`.
- **Zero non-deterministic calls**: Verified via static regex inspection.
- **Zero DOM leaks**: Verified.
- **PRNG Invariance**: Ability initialization is deterministic reading directly from species object without consuming PRNG draws.

---

## 4. Concerns & Blockers
- None. Task 2 completed cleanly with 100% test pass rate.
