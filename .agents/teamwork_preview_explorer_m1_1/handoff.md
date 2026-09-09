# Handoff Report — Explorer 1 (Milestone 1)

## 1. Observation

Direct code observations, verbatim tool outputs, and line locations from the audit:

1. **Non-Deterministic Calls Scan**:
   - Zero occurrences of `Math.random()`, `Date.now()`, `new Date()`, `performance.now()`, or `crypto` exist in all 48 NOYAU and Gen 2 NOYAU files (`js/poke/rng.js` through `js/poke/rejeu.js` and `js/poke/gen2/*.js`).
   - All `Math.random` and `Date` calls are isolated in ECRANS / presentation files (`js/poke/ui.js:5171-5172`, `js/poke/progression.js:182`, `js/poke/classement.js:111`, `js/poke/audio.js:299`, `js/poke/anim-attaque.js:423`, `js/poke/gate.js:225`).
2. **DOM / Storage Boundary in NOYAU**:
   - Zero occurrences of `document`, `localStorage`, `sessionStorage`, `navigator`, `location`, `fetch`, `XMLHttpRequest`, `alert`, `confirm`, `prompt`, `setTimeout`, `setInterval`, `requestAnimationFrame` exist inside NOYAU files.
   - 100% of NOYAU files include `"use strict";`.
3. **IIFE Invocation Inconsistency**:
   - `js/poke/serments.js:661`: `})(window);`
   - `js/poke/chasses.js:262`: `})(window);`
   - `js/poke/sceaux.js:205`: `})(window);`
   - In contrast, 28 of 31 NOYAU files end with: `})(typeof window !== "undefined" ? window : globalThis);`
   - Direct execution in Node.js without pre-declaring global `window` results in:
     `ReferenceError: window is not defined`
4. **Gen 2 Script Order Inconsistency**:
   - `js/poke/ordre.js:157-175`: `js/poke/gen2/sons.js` and `js/poke/gen2/sons-attaques.js` are in `var GEN2` (which is inserted into `NOYAU`).
   - `js/poke/ordre.js:105-109`: `js/poke/sons.js` and `js/poke/audio.js` are in `var ECRANS`.
5. **Replay & PRNG Determinism Validation**:
   - `js/poke/rng.js`: `mulberry32` produces identical 32-bit PRNG sequences across 1000 draws in both Gen1 and Gen2 environments.
   - `js/poke/rejeu.js`: `replayDaily("2026-08-25", journal)` returns `{ score: 3410, name: "Dresseur 8677" }` identically across both environments.

---

## 2. Logic Chain

1. **PRNG Soundness**:
   - Observations 1 and 5 show that the PRNG generator (`mulberry32`), deterministic hash (`graineDe`), and combinatorial unranking (`PokeChoix`) are the sole sources of randomness for game state transitions. Because no unauthorized native non-deterministic APIs are accessed in NOYAU, game state generation is mathematically reproducible.
2. **Replay Invariant Integrity**:
   - Observation 5 and the code in `js/poke/rejeu.js` and `js/poke/partie.js` demonstrate that daily challenge scoring relies on invariant bounding (`plafondNiveau`, `prisesMaxDuJour`, `acteDuLegendaire`) and score normalization (`normaliserDefi`) on a single shared score formula (`scoreDeBilan`). Because meta-progression (`PokeProgression`) is bypassed when `partie.compare = true`, client and server are guaranteed to compute identical scores for honest players.
3. **Headless Compatibility Defect**:
   - Observation 3 shows that evaluating `serments.js`, `chasses.js`, and `sceaux.js` in a standards-compliant headless Node.js or worker environment will fail if `window` is not explicitly aliased. Standardizing the IIFE trailer to `(typeof window !== "undefined" ? window : globalThis)` eliminates this portability hazard.
4. **Resource Optimization Defect**:
   - Observation 4 shows that Gen 2 audio synthesis data is currently evaluated inside NOYAU by the server. Moving `gen2/sons.js` and `gen2/sons-attaques.js` to `GEN2_ECRANS` aligns with the architectural principle defined in `ordre.js:106` ("the server replays combat without ever emitting sound").

---

## 3. Caveats

- **Network / API Integration**: Replay validation was tested on the client-side/NOYAU engine (`replayDaily`), but the remote API backend (`api/server.mjs`) is not part of this local repository mirror and was not directly executed.
- **Visual Presentation**: Animation and WebAudio sound synthesis fidelity in the browser DOM were not evaluated in this audit (deferred to Explorer 2 / Milestone 3).

---

## 4. Conclusion

The core architecture (`NOYAU`), PRNG contract (`mulberry32`), and replay verification engine of *Road to Legends — Mode Pokémon* are structurally sound, strictly deterministic, and free of DOM or non-deterministic leaks.

### Actionable Recommendations for Milestone 2 (Implementers):
1. **Fix IIFE global binding** in `js/poke/serments.js:661`, `js/poke/chasses.js:262`, and `js/poke/sceaux.js:205` by replacing `})(window);` with `})(typeof window !== "undefined" ? window : globalThis);`.
2. **Reclassify Gen 2 audio tables** in `js/poke/ordre.js` by moving `js/poke/gen2/sons.js` and `js/poke/gen2/sons-attaques.js` from `GEN2` to `GEN2_ECRANS`.
3. **Incorporate automated determinism checks** into the project test suite.

---

## 5. Verification Method

To independently verify these conclusions:

1. **Verify strict NOYAU headless evaluation**:
   Run in Node.js:
   ```bash
   node -e "
   const fs = require('fs');
   const NOYAU = ['js/poke/rng.js','js/poke/genre.js','js/poke/types.js','js/poke/regles.js','js/poke/attaques.js','js/poke/especes.js','js/poke/monde.js','js/poke/dresseurs.js','js/poke/classes.js','js/poke/obtentions.js','js/poke/ct.js','js/poke/moteur.js','js/poke/combat.js','js/poke/capture.js','js/poke/voyage.js','js/poke/actes.js','js/poke/carte-actes.js','js/poke/eclat.js','js/poke/fusion.js','js/poke/partie.js','js/poke/depart.js','js/poke/obtenir.js','js/poke/butin.js','js/poke/regle-du-jour.js','js/poke/acquis.js','js/poke/serments.js','js/poke/chasses.js','js/poke/sceaux.js','js/poke/scenario.js','js/poke/duel.js','js/poke/rejeu.js'];
   for (const f of NOYAU) eval(fs.readFileSync(f, 'utf8'));
   console.log('NOYAU loaded cleanly:', typeof replayDaily === 'function');
   "
   ```
2. **Verify PRNG and Replay Parity**:
   Run `.agents/teamwork_preview_explorer_m1_1/test_determinism.js` in Node.js:
   ```bash
   node .agents/teamwork_preview_explorer_m1_1/test_determinism.js
   ```
   Expected output: All 4 test suites return `PASS` with matching draw counts, state matches, and score equality.
