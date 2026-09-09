# Context: Road to Legends — Mode Pokémon

## Project Context
"Road to Legends — Mode Pokémon" is a vanilla JavaScript/HTML5/CSS3 roguelite fan-game featuring Kanto (151 species, Gen1 mechanics) and Johto (251 species, Gen2 mechanics).
The game relies on deterministic seed-based replay simulation (`mulberry32`) for server validation of player runs.

## Architectural Divisions
1. **NOYAU (Core)**:
   - Must be pure JavaScript with zero DOM manipulation, zero `localStorage`/`sessionStorage` access, zero network operations, and zero `Math.random()` or `Date.now()`.
   - All randomness MUST come from `PokeHasard(graine)` or derived seeds.
   - Load order in `js/poke/ordre.js` is critical and must be strictly preserved.
2. **ECRANS (Interface)**:
   - Responsible for DOM manipulation, user input handling, WebAudio sound synthesis, sprite animation rendering, dialogs, and screen transitions.
   - Must never influence the deterministic state or PRNG count of the NOYAU.
3. **GEN2 (Johto)**:
   - Modular extension loaded conditionally when Johto is active.
   - Data and logic injected before `regles.js` in NOYAU; animations injected before `anim-attaque.js` in ECRANS.
4. **Generated vs Hand-written Files**:
   - Generated data files (`especes.js`, `attaques.js`, `monde.js`, `dresseurs.js`, `classes.js`, `obtentions.js`, `ct.js`, `sons.js`, `animations.js`, etc.) contain ROM-level data tables.
   - Hand-written files contain core algorithms, game state machine, UI, combat logic, capture mechanics, and progression.

## Key Invariants & Rules
- **Determinism**: Identical seed + identical user choices = identical outcome bit-for-bit.
- **Loading Order**: `ordre.js` is the single source of truth.
- **Browser Execution**: Must load cleanly on `index.html` via local HTTP server without any uncaught JavaScript exceptions or console errors.
