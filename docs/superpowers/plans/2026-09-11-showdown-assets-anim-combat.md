# Pokémon Showdown Animated Sprites, Modern Attack FX & Enhanced Combat UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate official Pokémon Showdown animated GIFs with offline fallback, a high-performance Canvas 2D modern attack animation engine, and tactical combat UI enhancements (stat stage pills, stat change auras, and move effectiveness badges).

**Architecture:** Pure Vanilla JS (ES5 / IIFE) architecture with two new presentation modules: `sprites-showdown.js` (species normalization and CDN animated sprite resolution with offline fallback) and `anim-showdown.js` (Canvas 2D particle/fx engine with 7 signature attack animations and procedural type effects). `ui-combat.js` is enriched to render floating stat pills (`.pk-hb-paliers`), trigger stat change auras, and compute live type effectiveness badges (`×2`, `×½`, etc.) on move buttons.

**Tech Stack:** Pure Vanilla JS (ES5 / IIFE), HTML5 Canvas 2D (HiDPI / Retina), CSS3 Variables & Flex/Grid, Node.js test runner (`assert/strict`, `vm`). Zero external runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-11-showdown-assets-anim-combat-design.md`

## Global Constraints
- Zero external runtime dependencies. Pure Vanilla JS (ES5 / IIFE).
- Strict NOYAU rules: zero DOM access, zero `Math.random` / `Date.now` in core modules (`combat.js`, `partie.js`, `moteur.js`, `rng.js`).
- Resilient offline-first fallback: if Showdown CDN is unavailable or offline, all sprites fall back instantly to local GBA sprites (`assets/img/poke/gen3/`).
- Mulberry32 PRNG determinism and replay engine parity strictly preserved across Gen 1, Gen 2, and Gen 3 runs.
- 100% pass rate across master test runner (`node tests/run_all_tests.mjs`) and all standalone suites.

---

### Task 1: Showdown Animated Sprites Mapper & Offline-First Proxy (`sprites-showdown.js` & `ordre.js`)

**Files:**
- Create: `js/poke/sprites-showdown.js`
- Modify: `js/poke/ordre.js:45-55`
- Test: `tests/test_showdown_animated_engine.mjs`

**Interfaces:**
- Consumes: Species data and dex numbers (1 to 386) from `especes.js`.
- Produces: `W.PokeSpritesShowdown` with `nomShowdown(n)`, `aniFace(mon, suffixe)`, `aniDos(mon, suffixe)`, `repliFace(mon)`, `repliDos(mon)`.

- [ ] **Step 1: Write test in `tests/test_showdown_animated_engine.mjs`**

```javascript
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

// Test 1: Species name to Showdown identifier normalization
// (Pikachu -> pikachu, Nidoran ♀ -> nidoranf, Mr. Mime -> mrmime, Ho-Oh -> hooh, Deoxys -> deoxys)
// Test 2: aniFace / aniDos URL generation (https://play.pokemonshowdown.com/sprites/ani/...)
// Test 3: repliFace / repliDos local GBA fallback (assets/img/poke/gen3/...)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_showdown_animated_engine.mjs`
Expected: FAIL (`Cannot find module 'js/poke/sprites-showdown.js'`)

- [ ] **Step 3: Implement `js/poke/sprites-showdown.js` and register in `js/poke/ordre.js`**

Implement `W.PokeSpritesShowdown`:
1. Build normalization dictionary for all 386 Pokémon (handling hyphens, gender symbols, apostrophes).
2. Export `nomShowdown(n)`.
3. Export `aniFace(mon, suffixe)` and `aniDos(mon, suffixe)`.
4. Export `repliFace(mon)` and `repliDos(mon)`.
5. Register `"js/poke/sprites-showdown.js"` in `POKE_ORDRE_ECRANS` in `js/poke/ordre.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_showdown_animated_engine.mjs`
Expected: PASS (100%)

- [ ] **Step 5: Commit**

```bash
git add js/poke/sprites-showdown.js js/poke/ordre.js tests/test_showdown_animated_engine.mjs
git commit -m "feat(sprites): Task 1 - showdown animated sprites proxy and offline fallback"
```

---

### Task 2: Modern Attack FX Canvas Engine (`anim-showdown.js` & `ordre.js`)

**Files:**
- Create: `js/poke/anim-showdown.js`
- Modify: `js/poke/ordre.js:45-55`
- Test: `tests/test_showdown_animated_engine.mjs`

**Interfaces:**
- Consumes: Canvas rendering context 2D, move key, attacker/defender camp.
- Produces: `W.PokeAnimShowdown` with `monter(hote)`, `jouerAttaque(canvas, attCle, coteAttaquant, cb)`, `jouerStatAura(canvas, coteCible, delta, cb)`.

- [ ] **Step 1: Write test updates in `tests/test_showdown_animated_engine.mjs`**

Assert:
1. `PokeAnimShowdown.monter(hote)` creates `<canvas class="pk-arene-fx">`.
2. `jouerAttaque` dispatches signature attacks (Tonnerre, Surf, Séisme, Lance-Flammes, Laser Glace, Tranche, Psyko) and resolves callback.
3. `jouerAttaque` falls back to procedural type renderer for generic moves.
4. `jouerStatAura` renders upward chevrons on boost (delta > 0) and downward chevrons on drop (delta < 0).

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_showdown_animated_engine.mjs`
Expected: FAIL (`PokeAnimShowdown is undefined`)

- [ ] **Step 3: Implement `js/poke/anim-showdown.js` and register in `js/poke/ordre.js`**

Implement `W.PokeAnimShowdown`:
1. `monter(hote)`: creates and scales `.pk-arene-fx` canvas to match `.pk-arene-showdown` bounding rect with HiDPI ratio.
2. Signature animations:
   - *Tonnerre*: Jagged vertical lightning discharge + electric sparks + flash.
   - *Surf*: Blue rolling tidal crest wave sweeping across field.
   - *Séisme*: Ground fissure lines, screen shake, and rock debris.
   - *Lance-Flammes*: Stream of oscillating flame particles with thermal glow.
   - *Laser Glace*: Freeze beam and shattering crystalline ice prisms.
   - *Tranche*: Sharp kinetic slashing arcs.
   - *Psyko*: Chromatic aberration rings and ripples.
3. Procedural type renderer:
   - Physical: Thrust towards target + impact burst.
   - Special: Colored elemental beam/projectile.
   - Status: Concentric energy rings.
4. `jouerStatAura`: green rising chevrons for positive delta, red falling chevrons for negative delta.
5. Register `"js/poke/anim-showdown.js"` in `POKE_ORDRE_ECRANS` in `js/poke/ordre.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_showdown_animated_engine.mjs`
Expected: PASS (100%)

- [ ] **Step 5: Commit**

```bash
git add js/poke/anim-showdown.js js/poke/ordre.js tests/test_showdown_animated_engine.mjs
git commit -m "feat(anim): Task 2 - modern canvas fx engine with signature attacks and stat auras"
```

---

### Task 3: Combat UI Integration — Stat Stage Pills & Tactical Move Effectiveness (`ui-combat.js` & `css/poke.css`)

**Files:**
- Modify: `js/poke/ui-combat.js`
- Modify: `css/poke.css`
- Test: `tests/test_showdown_animated_engine.mjs`, `tests/test_showdown_combat_ui.mjs`

**Interfaces:**
- Consumes: `W.PokeSpritesShowdown`, `W.PokeAnimShowdown`, `W.PokeType.multiplicateur`.
- Produces: Enhanced `.pk-showdown-combat` with animated GIF battle sprites, canvas FX, stat stage pills (`.pk-hb-paliers`), and tactical move effectiveness badges (`.pk-attaque-efficacite`).

- [ ] **Step 1: Write test updates in `tests/test_showdown_animated_engine.mjs`**

Assert:
1. `Ecran.prototype.monter()` mounts `<canvas class="pk-arene-fx">`.
2. `monterCamp` renders animated GIF with `onerror` fallback to local GBA sprite.
3. `rafraichir()` renders stat stage pills (`.pk-palier-pill.est-hausse` and `.est-baisse`) inside `.pk-hb-paliers` for non-zero stats.
4. Move buttons in `.pk-grille-attaques` display live effectiveness badge (`.pk-attaque-efficacite`) against opponent's active typing (`×2`, `×4`, `×½`, `×¼`, `×0`, `STAT`).
5. Stat stage change events trigger `PokeAnimShowdown.jouerStatAura`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_showdown_animated_engine.mjs`
Expected: FAIL

- [ ] **Step 3: Implement enhancements in `js/poke/ui-combat.js` and `css/poke.css`**

Implement:
1. In `Ecran.prototype.monter`: call `W.PokeAnimShowdown.monter(this.elArene)`.
2. In `monterCamp`: use `W.PokeSpritesShowdown.ani(mon, cote)` with `onerror="this.onerror=null;this.src='...'"` fallback.
3. In `rafraichir()`:
   - Update `.pk-hb-paliers` with pills for any stat whose stage !== 0 (`+1 Atk`, `-1 Def`, etc.).
   - Update move buttons: compute `W.PokeType.multiplicateur(att.type, advTypes)` and inject `.pk-attaque-efficacite` tag.
4. In `jouer()` / `agir()`:
   - Call `W.PokeAnimShowdown.jouerAttaque(...)` when an attack is executed.
   - Call `W.PokeAnimShowdown.jouerStatAura(...)` when stat changes occur.
5. Add CSS rules in `css/poke.css` for `.pk-arene-fx`, `.pk-hb-paliers`, `.pk-palier-pill`, `.pk-attaque-efficacite`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/test_showdown_animated_engine.mjs`
Run: `node tests/test_showdown_combat_ui.mjs`
Expected: PASS (100%)

- [ ] **Step 5: Commit**

```bash
git add js/poke/ui-combat.js css/poke.css tests/test_showdown_animated_engine.mjs tests/test_showdown_combat_ui.mjs
git commit -m "feat(combat): Task 3 - animated sprites integration, stat stage pills and tactical effectiveness badges"
```

---

### Task 4: Master Regression Suite Integration & Full Verification (`run_all_tests.mjs`)

**Files:**
- Modify: `tests/run_all_tests.mjs`
- Test: All suites (`node tests/run_all_tests.mjs`, all standalone tests)

**Interfaces:**
- Validates all 3 tasks against strict project invariants.

- [ ] **Step 1: Update `tests/run_all_tests.mjs` Suite 13**

Add test assertions to Suite 13:
- Test 7: Showdown animated sprite routing and resilient offline fallback.
- Test 8: Modern Canvas FX engine and signature attack dispatcher.
- Test 9: Healthbox stat stage pills (`+1 Atk`, `-1 Def`) and move button effectiveness tags (`×2`, `×½`, etc.).
- Test 10: Non-regression across Gen 1, Gen 2, Gen 3 Mulberry32 PRNG sequences.

- [ ] **Step 2: Run master test suite and all standalone suites**

Run: `node tests/run_all_tests.mjs`
Run: `node tests/test_showdown_animated_engine.mjs`
Run: `node tests/test_showdown_combat_ui.mjs`
Run: `node tests/test_gen3_usine_ui.mjs`
Run: `node tests/test_showdown_ui_central.mjs`
Run: `node tests/test_coffre_objets_depart.mjs`
Expected: 100% pass across all suites (0 failures).

- [ ] **Step 3: Commit**

```bash
git add tests/run_all_tests.mjs
git commit -m "feat(tests): Task 4 - master regression suite for showdown animated engine and combat indicators"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-11-showdown-assets-anim-combat.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.
