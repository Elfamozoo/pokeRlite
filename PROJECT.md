# Project: Road to Legends — Mode Pokémon

## Architecture
- **Tech Stack**: Pure Vanilla JavaScript (IIFE modular pattern), HTML5, CSS3. Zero external frameworks.
- **Module Boundaries**:
  - `NOYAU` (31+ files + 17 Gen2 files): Pure business logic, state machines, deterministic PRNG (`mulberry32`), replay simulation. Strict zero DOM access, zero storage access, zero unauthorized `Math.random()` / `Date.now()`.
  - `ECRANS` (16 files + 2 Gen2 files): DOM rendering, UI event handlers, WebAudio sound synthesis, sprite animations, tooltips, dialogs.
  - `GEN2` (Johto): Modular expansion (types, hold items, species 152-251, routes, animations) cleanly injected into NOYAU and ECRANS via `ordre.js`.
  - `gate.js`: Bootstrap loader, version monitoring, sequential script injector.

## Code Layout
- `index.html`: Entry HTML page.
- `css/poke.css`: Complete game styling.
- `js/poke/ordre.js`: Single authoritative source of truth for script load order and module registry.
- `js/poke/gate.js`: Bootstrap and sequential script loader.
- `js/poke/*.js`: Core game modules (rng, rules, combat, capture, voyage, meta progression, UI).
- `js/poke/gen2/*.js`: Gen 2 (Johto) extensions.
- `assets/img/poke/`: Sprites (face/dos), portraits, animations, artworks.
- `tests/*.mjs`: Comprehensive automated test suites.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | M1: Codebase Audit & Improvement Roadmap | Comprehensive audit of 68+ files across NOYAU/ECRANS, determinism check, UI/UX analysis, identifying priority bugs and improvements | none | DONE |
| 2 | M2: Core Bug Fixes & Determinism Hardening | Implement priority core fixes in combat, voyage, capture, and meta systems while preserving determinism | M1 | IN_PROGRESS |
| 3 | M3: UI/UX & Quality-of-Life Enhancements | UI polishing, responsiveness, accessibility, visual feedback, tooltips, and audio/animation refinements | M2 | PLANNED |
| 4 | M4: E2E Verification & Non-Regression Suite | Comprehensive verification across all 4 tiers + white-box tier 5, ensuring zero console errors and strict audit compliance | M3 | PLANNED |

## Interface Contracts
### NOYAU ↔ ECRANS
- NOYAU modules (`PokeMoteur`, `PokeCombat`, `PokeVoyage`, `PokeCapture`, `PokePartie`, `PokeRegles`) expose deterministic state transformers and evaluation functions.
- ECRANS modules (`PokeUI`, `PokeUICombat`, `PokePokedex`, `PokeCarte`, `PokeInfobulles`) handle DOM presentation and user interaction.
- ECRANS must never alter PRNG sequences or simulate outcomes directly. All game state transitions flow through NOYAU.
- Determinism contract: Any identical initial seed and action sequence must produce identical game state on client and server.
