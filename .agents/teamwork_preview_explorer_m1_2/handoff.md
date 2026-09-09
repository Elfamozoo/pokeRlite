# Handoff Report — Milestone 1 Audit: Game Mechanics, Battle Engine, Voyage, Capture, and Meta Systems

**Author**: Explorer 2 (`teamwork_preview_explorer_m1_2`)  
**Date**: August 2026  
**Status**: Task Complete (Hard Handoff)  
**Detailed Report**: `c:\Users\illye\Documents\antigravity\rtl-pokemon\.agents\teamwork_preview_explorer_m1_2\analysis.md`

---

## 1. Observation

Direct code observations from the audited subsystems:

1. **Combat Damage Calculation (`js/poke/combat.js:580–840`)**:
   - Damage formula accurately implements the Pokémon damage formula:
     `var base = Math.floor((Math.floor(Math.floor(2 * L / 5 + 2) * p.puissance * p.atk / p.def) / 50) + 2);`
   - STAB (1.5x), Weather (1.5x / 0.5x in `meteoDegats`), Type boost (1.1x in `POKE_GEN2_TENUS`), Screen doubling (`REFLECT` / `LIGHT_SCREEN`), Defense halving (`EXPLODE_EFFECT`), Burns (`Math.floor(atk / 2)`), and Badge boosts (1.125x for Boulder/Thunder/Soul/Volcano in Kanto and Zephyr/Plain/Mineral/Glacier in Johto via `PokeRegles.badgesStat`).
   - Critical hit bug from Gen 1 ROM is faithfully preserved (`FORT_CRITIQUE` divides by 4 under Focus Energy); Gen 2 Scope Lens doubles crit rate.
   - Damage variance roll $R \in [217, 255]$ is drawn via `h.entier(39) + 217`. Roguelite Oath scaling (`degatsInfliges` / `degatsSubis`) is applied with a strict 1 HP damage floor.

2. **Turn Order & Determinism (`js/poke/combat.js:140–210`)**:
   - `joueurEnPremier` consumes an unconditional PRNG draw (`h.brut()`) on every turn resolution before priority / speed checks, guaranteeing that the RNG draw count is invariant across client and server replays.
   - Quick Claw trigger ($60/256$) is evaluated only on priority tie.

3. **Status & Conditions (`js/poke/combat.js:900–1200`)**:
   - Natural thaw rate is 10% per turn in Gen 2; waking turn from sleep is consumed without attack unless using `SNORE` / `SLEEP_TALK`.
   - Full paralysis rate is $63/256 \approx 24.6\%$; confusion self-damage is 50% using a 40-power physical typeless formula based on unboosted base stats.
   - Attraction checks gender derived from Attack DV vs species gender threshold byte.

4. **Capture Engine (`js/poke/capture.js:40–160`)**:
   - Canonical 3-step roll:
     - Ball roll thresholds: Poké (256), Great (201), Ultra (151), Safari (151), Master (0).
     - Status gates: Sleep/Freeze (25), Burn/Para/Poison (12).
     - Catch rate gate: `jet > Math.round(taux * serments)`.
     - HP value: `valeur = Math.floor((pvMax * 255 * 4) / (pv * ball.facteur))` (factor 8 for Great Ball, 12 for others).
   - `PokeCapture.chance()` calculates exact mathematical probability analytically without advancing PRNG state.

5. **World Scaling & Level Design (`js/poke/voyage.js`, `actes.js`, `carte-actes.js`, `gen2/voyage.js`)**:
   - Degressive level caps (`plafondDe` in `actes.js:233–286`): +8 margin in Acts 1–4, +5 in Acts 5–6, 0 in Acts 7–8 with fixed boss targets (Blaine=67, Giovanni=70), and +16 in Act 9 (`hautDeLaLigue` + 14 = Level 95 cap).
   - Johto incorporates the Burned Tower roaming beasts mechanic (Raikou, Entei, Suicune with 6% grass encounter chance and 3-turn flee timer) and the post-game Red epilogue at Mt. Silver (Levels 81–88).
   - Node generator (`carte-actes.js:530–565`) applies `RAMPE_MONDE = { gen2: 1.3 }` to prevent early-game attrition in Johto.

6. **Meta Progression & Roguelite Compounding (`js/poke/butin.js`, `serments.js`, `sceaux.js`, `acquis.js`, `chasses.js`, `fusion.js`)**:
   - Post-battle loot cards offer 3 distinct choices with TM power caps (`PLAFOND_CT` [95, 95, 100, 100, 100, 0...]).
   - `PokeChoix.combien` / `deRang` uses a combinatorial bijection to select a unique triplet from 1 RNG draw (`h.entier`), preserving replay determinism.
   - `PokeSerments.effet(partie)` unifies 17 base oaths, 11 hunting-unlocked oaths, the date-derived daily rule, and 8 cumulative difficulty seals with strict safety bounds (`equipeMax >= 1`, `degatsSubis >= 0.35`, `degatsInfliges >= 0.30`).
   - `PokeFusion.fusionner` guarantees non-decreasing idempotency across save syncs.

---

## 2. Logic Chain

1. *From Observation 1 & 2*: The simulation core strictly isolates game logic from DOM manipulation and enforces deterministic PRNG consumption on every turn order check, guaranteeing that combat outcomes are 100% reproducible on the server.
2. *From Observation 3 & 4*: The capture system integrates oath scaling directly into species catch rate thresholds rather than adding extra rolls, while `chance()` provides analytical odds for the UI without consuming PRNG state.
3. *From Observation 5*: The world level scaling curve and degressive act caps resolve the classic roguelite snowball problem: early acts allow team expansion while late acts force strategic composition against fixed boss apexes.
4. *From Observation 6*: The meta progression systems (Oaths, Seals, Acquis, Daily Rules, Hunting Quests) compound through a single mathematical pipeline (`PokeSerments.effet`), eliminating duplicate rule definitions and guaranteeing idempotent cloud saves.

---

## 3. Caveats

- Investigation was performed in read-only mode (`CODE_ONLY`) via static code analysis.
- UI rendering performance and audio latency in browser environments were not benchmarked on hardware devices.
- Gen 2 features are currently gated via `W.PokeRegles` and are not yet exposed in live production builds.

---

## 4. Conclusion

The Game Mechanics, Battle Engine, Voyage, Capture, and Meta systems are implemented with exceptional quality, structural rigor, and mathematical fidelity to both the 1996/1999 ROMs and modern Roguelite design principles. 

Key improvement recommendations for future milestones:
1. **P1 (High)**: Ensure server-side replay parity in `rejeu.js` for all Gen 2 moves, held items, and weather prior to public release of Johto.
2. **P2 (Medium)**: Standardize return types between `chance()` (float $0..1$) and `chanceSafari()` (percentage $1..100$) in `capture.js`.
3. **P2 (Medium)**: Refactor `obtenablesDuMonde()` in `progression.js` to eliminate temporary in-memory mutation of `PokeRegles.courante`.
4. **P3 (Low)**: Pre-compile Gen 2 move effect lookup dictionaries to eliminate dynamic allocations during batch battle simulations.

---

## 5. Verification Method

To independently verify the audit conclusions:
1. **PRNG Invariance**: Inspect `js/poke/combat.js` lines 140–210 and `js/poke/rng.js` to verify single-draw bijection logic.
2. **Level Cap Verification**: Check `js/poke/actes.js` lines 233–286 (`margeDe`, `EFFECTIF_FIN`, `monteeLigue`, `hautDeLaLigue`).
3. **Capture Odds Verification**: Compare formulas in `js/poke/capture.js` lines 63–157 (`tenter` vs `chance`).
4. **Save Idempotency**: Inspect `js/poke/fusion.js` lines 80–259 (`POLITIQUE` dictionary and `fusionner` implementation).
