# Codebase Audit: NOYAU Architecture, PRNG Determinism Contract, & Replay Engine

**Milestone**: M1 (Codebase Audit & Improvement Roadmap)  
**Agent**: Explorer 1  
**Date**: 2026-08-25  
**Target Scope**: Core (`NOYAU`) architecture, PRNG determinism (`mulberry32` in `js/poke/rng.js`), dependency graph (`js/poke/ordre.js`), non-deterministic source leaks, DOM/storage boundary leaks, Gen 2 modular injection, and server replay contract (`js/poke/rejeu.js`).

---

## 1. Executive Summary

A comprehensive automated and manual audit of all 68 JavaScript source files (31 Gen 1 NOYAU files, 17 Gen 2 NOYAU files, 16 Gen 1 ECRANS files, 2 Gen 2 ECRANS files, and `gate.js`) was conducted.

### Key Audit Findings
1. **PRNG Determinism Contract (EXCELLENT)**:
   - Zero unauthorized calls to `Math.random()`, `Date.now()`, `new Date()`, `performance.now()`, or `crypto` exist across all 48 NOYAU and Gen 2 NOYAU files.
   - `mulberry32` generator in `js/poke/rng.js` conforms to a 32-bit stateful mathematical contract with guaranteed bit-identical outputs across V8 (Node/Chrome), JavaScriptCore (Safari), and SpiderMonkey (Firefox).
   - Combinatorial unranking (`PokeChoix.deRang` / `PokeChoix.combien`) enforces single-draw consumption for multi-choice pools (triplets, CT offers), preventing draw-drift.
2. **DOM / Browser Global Isolation (EXCELLENT)**:
   - Zero DOM or browser global references (`document`, `HTMLElement`, `localStorage`, `sessionStorage`, `fetch`, `alert`, `prompt`, `confirm`, `setTimeout`, `setInterval`, `requestAnimationFrame`) exist in NOYAU business logic.
   - 100% of NOYAU files are strict-mode compliant (`"use strict";`).
3. **Dependency Order & Global Exports (DEFECT IDENTIFIED)**:
   - **IIFE Invocation Inconsistency**: 3 NOYAU files (`serments.js:661`, `chasses.js:262`, `sceaux.js:205`) invoke their enclosing IIFE with `(window)` instead of `(typeof window !== "undefined" ? window : globalThis)`. In headless environments (Node.js/workers) where `window` is not explicitly pre-aliased, loading these files throws `ReferenceError: window is not defined`.
   - **Gen 2 Audio Misclassification**: `js/poke/gen2/sons.js` (32 KB) and `js/poke/gen2/sons-attaques.js` (30 KB) are included in `GEN2` in `ordre.js` (which is injected into `NOYAU`), whereas Gen 1 audio data (`sons.js`, `audio.js`) is correctly classified under `ECRANS`. This incurs unnecessary memory/processing overhead on headless replay servers.
4. **Replay Engine & Daily Scoring Invariants (VERIFIED & SOUND)**:
   - Replay architecture in `js/poke/rejeu.js` and `js/poke/partie.js` uses an invariant-bounding strategy on summary logs (`scoreDeBilan`, `plafondNiveau`, `prisesMaxDuJour`, `acteDuLegendaire`, `dureeMinimale`) rather than fragile step-by-step combat simulation.
   - Meta-progression perks (`PokeProgression`) are strictly guarded behind `!partie.compare`, preventing client-server score divergence on daily challenges.

---

## 2. PRNG Determinism Contract Audit (`js/poke/rng.js`)

### 2.1 Implementation Analysis
`rng.js` implements a 32-bit PRNG pipeline based on `mulberry32` preceded by a deterministic polynomial string hasher (`graineDe`):

```js
// js/poke/rng.js:25-32
function graineDe(texte) {
  var h = 1779033703 ^ texte.length;
  for (var i = 0; i < texte.length; i++) {
    h = Math.imul(h ^ texte.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
```

```js
// js/poke/rng.js:43-50
Hasard.prototype.brut = function () {
  this.tirages++;
  this.etat = (this.etat + 0x6d2b79f5) >>> 0;
  var t = this.etat;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
```

### 2.2 Mathematical & Architectural Properties
1. **Bit-Level Reproducibility**: All arithmetic operations use 32-bit unsigned integers via `Math.imul`, bitwise shifts `>>> 0`, `<< 13`, `>>> 19`, and division by exact float constant $2^{32} = 4294967296$. Floating-point mantissa precision is preserved.
2. **Draw Accounting (`this.tirages`)**: Every call to `brut()` increments `this.tirages`. Higher-level methods (`entier(n)`, `entre(a, b)`, `chance(pourcent)`, `pondere(liste, champ)`) call `brut()` exactly once.
3. **Fisher-Yates Shuffle (`melange(liste)`)**: Consumes strictly $N - 1$ draws for an array of length $N$.
4. **Isolated Sub-Streams (`derive(etiquette)`)**: Child subsystems (e.g. duel RNG, cosmetic VFX) use `derive(label)`:
   ```js
   Hasard.prototype.derive = function (etiquette) {
     return new Hasard(graineDe(String(this.source) + "|" + etiquette));
   };
   ```
   This isolates the primary game progression PRNG sequence from secondary subsystem invocations.
5. **Lexicographic Combinatorial Unranking (`PokeChoix`)**:
   - `parmi(n, k)`: Computes $\binom{n}{k}$.
   - `choixDeRang(vivier, rang, k)`: Bijective unranking algorithm that unfolds any subset of size $k$ given a single integer rank $r \in [0, \binom{n}{k}-1]$.
   - This eliminates the need to draw multiple random numbers while iterating, ensuring multi-choice cards (e.g. 3 perks, 3 CTs) consume exactly 1 PRNG step.

### 2.3 Non-Deterministic Calls Audit
A full scan across all 68 project files revealed:
- **NOYAU (31 Gen 1 + 17 Gen 2 files)**: **0** calls to `Math.random()`, `Date.now()`, `new Date()`, `performance.now()`, or `crypto`.
- **ECRANS & Bootstrap (`ui.js`, `progression.js`, `classement.js`, `audio.js`, `anim-attaque.js`, `gate.js`)**: All calls are strictly confined to presentation layers:
  - `js/poke/ui.js:5171-5172`: Used exclusively to generate random seed strings for unranked Free Play mode:
    `var graine = W.POKE_GRAINE || ("POKE-LIBRE-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36));`
  - `js/poke/progression.js`: Used for meta-save timestamps (`quand: Date.now()`).
  - `js/poke/classement.js` / `js/poke/gate.js`: Cache busting & countdown timers.
  - `js/poke/audio.js` / `js/poke/anim-attaque.js`: WebAudio synthesis & sprite frame deltas.

---

## 3. DOM & Browser Global Boundary Audit

### 3.1 Verification Methodology
1. Pattern match against `document`, `window`, `localStorage`, `sessionStorage`, `navigator`, `location`, `history`, `fetch`, `XMLHttpRequest`, `alert`, `confirm`, `prompt`, `setTimeout`, `setInterval`, `requestAnimationFrame`, `HTMLElement`, `AudioContext`.
2. Property access tracing on `W.*` namespace within NOYAU.
3. Isolated VM evaluation without browser global injection.

### 3.2 Results
- Zero DOM API calls inside all 48 NOYAU files.
- Zero local/session storage accesses inside NOYAU.
- `W.*` property accesses inside NOYAU are strictly restricted to internal module registration (`W.PokeMoteur`, `W.PokeCombat`, `W.POKE_TYPES`, etc.) and optional capability checks (`if (W.PokeProgression)`).

---

## 4. Dependency Order & Globals Audit (`js/poke/ordre.js`)

### 4.1 Dependency Order Analysis
The single authoritative script order in `ordre.js` organizes files into two distinct layers:
1. **NOYAU Layer (evaluated by client & server)**:
   - `rng.js` $\to$ `genre.js` $\to$ `types.js` $\to$ [Optional `GEN2`] $\to$ `regles.js` $\to$ Data tables (`attaques`, `especes`, `monde`, `dresseurs`, `classes`, `obtentions`, `ct`) $\to$ Mechanics (`moteur`, `combat`, `capture`, `voyage`, `actes`, `carte-actes`) $\to$ Meta & Rules (`eclat`, `fusion`, `partie`, `depart`, `obtenir`, `butin`, `regle-du-jour`, `acquis`, `serments`, `chasses`, `sceaux`, `scenario`, `duel`, `rejeu`).
2. **ECRANS Layer (evaluated by client only)**:
   - `tempo.js` $\to$ `icones.js` $\to$ `sons.js` $\to$ `audio.js` $\to$ `animations.js` $\to$ `anim-attaque.js` $\to$ `progression.js` $\to$ UI components (`dits-objets`, `mesure-arene`, `ui-combat`, `pokedex-ui`, `infobulles`, `carte-partage`, `classement`, `fin`, `ui`).

### 4.2 Discovered Defect 1: IIFE Invocation Inconsistency in `serments.js`, `chasses.js`, `sceaux.js`

**Location**:
- `js/poke/serments.js:661`: `})(window);`
- `js/poke/chasses.js:262`: `})(window);`
- `js/poke/sceaux.js:205`: `})(window);`

**Comparative Code Evidence**:
In 28 of 31 NOYAU files, the IIFE wrapper is written as:
```js
})(typeof window !== "undefined" ? window : globalThis);
```
However, in `serments.js`, `chasses.js`, and `sceaux.js`:
```js
// js/poke/serments.js:653-661
  W.PokeSerments = {
    CLES: CLES,
    neutre: neutre,
    effet: effet,
    offrir: offrir,
    prendre: prendre,
    de: de,
  };
})(window);
```

**Impact & Severity**: **MEDIUM / HIGH (Headless Portability Hazard)**  
When NOYAU is evaluated in a pure Node.js context, web worker, or isolated VM where `window` is not explicitly declared as a global alias for `globalThis`, loading `serments.js`, `chasses.js`, or `sceaux.js` throws a fatal `ReferenceError: window is not defined`.

**Recommended Fix**:
Standardize the trailer across all three files:
```js
- })(window);
+ })(typeof window !== "undefined" ? window : globalThis);
```

---

### 4.3 Discovered Defect 2: Architectural Misplacement of Gen 2 Audio Data in `GEN2` (NOYAU)

**Location**: `js/poke/ordre.js:157-175` vs `js/poke/ordre.js:105-109`

**Code Evidence**:
In `ordre.js`:
```js
// Lines 105-109 (Gen 1 Audio in ECRANS):
    // Le son : les programmes du ROM d'abord, la puce qui les joue ensuite.
    // 🔴 Ils vivent dans les ÉCRANS : le serveur rejoue un combat sans jamais
    //    rien émettre, et un son ne décide de rien.
    "js/poke/sons.js",
    "js/poke/audio.js",

// Lines 157-175 (Gen 2 NOYAU list):
  var GEN2 = [
    "js/poke/gen2/types.js",
    ...
    "js/poke/gen2/concours.js",
    "js/poke/gen2/sons.js",            // <-- 31.9 KB WebAudio note table
    "js/poke/gen2/sons-attaques.js",   // <-- 29.7 KB WebAudio note table
  ];
```

**Impact & Severity**: **LOW / ARCHITECTURAL CLEANLINESS**  
`gen2/sons.js` and `gen2/sons-attaques.js` contain purely WebAudio sound synthesis tables (61.6 KB total). No game logic module in NOYAU (`combat`, `moteur`, `capture`, `rejeu`) accesses them during gameplay or replay verification. Placing them in `GEN2` forces the server replay engine to load audio assets into memory.

**Recommended Fix**:
Move `gen2/sons.js` and `gen2/sons-attaques.js` into `GEN2_ECRANS` or evaluate audio data strictly within the presentation tier.

---

## 5. Replay Engine Invariants & `score_mismatch` Hazards (`rejeu.js`, `partie.js`)

### 5.1 Replay Contract Mechanics
In `js/poke/rejeu.js`, daily challenge scores are validated via:
`replayDaily(date, journal, options) -> { score, name, resume }`

Rather than step-by-step action replay (which is prone to desynchronization across minor code updates), the replay engine verifies that the ending game state is mathematically and structurally reachable within the rules of the mode:

1. **Daily Seed Version Binding (`prisesMaxDuJour(date)`)**:
   - Seed: `"POKE-JOUR-" + String(date)`
   - Determines version (`rouge` vs `bleu`) via `h.brut() < 0.5`.
   - Computes maximum catchable species count `P.atteignables(version)`.
2. **Act-Bounded Level Caps (`plafondNiveau(acte)`)**:
   - Caps team Pokémon levels to Champion level + 20 margin (`MARGE_SERMENTS`).
3. **Act-Bounded Encounters and Captures (`normaliser`)**:
   - Bounded by formula: `Math.min(prisesMaxDuJour(date), Math.ceil(max * (acte + 2) / (LIMITES.acte + 2)))`.
   - Prevents impossible summaries (e.g. 139 catches on Act 3).
4. **Progression-Linked Legendary Whitelist (`acteDuLegendaire`)**:
   - Dynamically inspects `PokeActes.acteDe(n)` to verify legendary availability by reached act.
5. **Anti-Forging Elapsed Time Floor (`dureeMinimale`)**:
   - Minimum duration required: `(acte - 1) * 40s + badges * 25s`.
6. **Score Normalization (`normaliserDefi`)**:
   - Multipliers for rule selection (`voyage`) and seal upgrades (`sceau = 0`) are hard-reset to default in daily challenges, guaranteeing equal competitive weighting.

### 5.2 Determinism Verification Simulation
A headless test harness (`test_determinism.js`) was executed in pure V8 context:
- **Test 1: PRNG mulberry32 Sequence Stability**: 1000 consecutive draws compared between Gen1 and Gen2 configurations $\to$ **1000/1000 exact match (PASS)**.
- **Test 2: Game State Creation**: 50 independent game sessions created from identical seeds $\to$ **50/50 exact JSON state match (PASS)**.
- **Test 3: Map & Turn-by-Turn Combat**: Act 1 procedural map generation and 10 rounds of turn-by-turn combat evaluated identically $\to$ **PASS**.
- **Test 4: Replay Daily Verification**: Evaluated daily challenge scoring with identical output $\to$ **score: 3410, name: "Dresseur 8677" (PASS)**.

---

## 6. Prioritized Improvement Roadmap

| Priority | Issue / Area | Target File(s) & Line(s) | Description | Recommended Strategy |
|:---:|:---|:---|:---|:---|
| **P1** | IIFE Global Scope Binding | `js/poke/serments.js:661`<br>`js/poke/chasses.js:262`<br>`js/poke/sceaux.js:205` | IIFE passes `(window)` instead of `(typeof window !== "undefined" ? window : globalThis)` | Standardize IIFE invocation parameter to ensure headless Node.js/worker execution without pre-aliasing. |
| **P2** | Script Order Classification | `js/poke/ordre.js:157-175` | `gen2/sons.js` & `gen2/sons-attaques.js` placed in `GEN2` (NOYAU) instead of `GEN2_ECRANS` | Move audio synthesis data files to `GEN2_ECRANS` to reduce headless server replay memory footprint and maintain symmetry with Gen 1. |
| **P3** | Strict Meta-Progression Interface | `js/poke/partie.js:194`<br>`js/poke/depart.js:111`<br>`js/poke/acquis.js:308` | Direct reference to `W.PokeProgression` from NOYAU modules | Formalize an explicit adapter / dependency injection pattern (e.g. passing account storage as an optional options argument) to keep NOYAU completely free of ambient globals. |
| **P4** | Automated Regression Suite Integration | `tools/` / CI suite | Ensure CI runs automated multi-engine headless tests for `replayDaily` and PRNG determinism | Include `test_determinism.js` in milestone M4 verification suite. |
