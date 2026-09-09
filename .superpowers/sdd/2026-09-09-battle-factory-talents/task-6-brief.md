# Task 6 Brief: Intégration Complète, Suite de Régression Globale & Validation Déterministe

## Project Context
This is Task 6 of the Battle Factory & Gen 3 Tactical Engine implementation plan for **Pokémon : La Voie des Maîtres** (`feat/battle-factory-talents`).
Tasks 1-5 implemented:
1. Canonical Gen 3 natures and +/-10% stat calculation (`js/poke/gen3/natures.js`).
2. Canonical abilities database (76 abilities) and 100% species mapping (1-386) (`js/poke/gen3/talents.js`).
3. Combat ability hooks, weather (hail), air lock, and competitive held items (`js/poke/gen3/objets-tenus.js`, `combat.js`).
4. Canonical Emerald factory sets (4 tiers) and Battle Factory game engine (`js/poke/gen3/sets-usine.js`, `usine.js`).
5. Battle Factory UI, draft, swap, boss screens, and PCo shop (`js/poke/ui-usine.js`, `progression.js`, `ui.js`).

## Your Objective
Update `tests/run_all_tests.mjs` to incorporate **Suite 11: Battle Factory, Natures, Talents & Tactical Engine Invariants**.
Verify all assertions pass with 100% success rate, ensuring bit-level determinism, cross-generational non-regression, and comprehensive coverage.

## Detailed Requirements for Suite 11 in `tests/run_all_tests.mjs`:
Add `suite("11. Battle Factory, Natures, Talents & Tactical Engine Invariants");` containing:

1. **Test 1: Natures system invariants & stat calculations**
   - Verify `POKE_GEN3_NATURES` has 25 entries.
   - Verify `PokeNatures` helper functions (`nom`, `de`, `tirer`, `liste`).
   - Verify that nature multipliers (+10% / -10%) apply correctly with `Math.floor`, never alter PV, and 5 neutral natures do not modify any stats.
   - Verify Gen 1 and Gen 2 creatures created without `genererNature` do NOT have a nature assigned, guaranteeing zero PRNG consumption.

2. **Test 2: Canonical abilities database & 100% species mapping**
   - Verify `POKE_GEN3_TALENTS` has 76 abilities with `nom.fr`, `nom.en`, `desc.fr`, `desc.en`.
   - Verify `PokeTalents` helper functions (`table`, `cles`, `nom`, `desc`, `de`).
   - Verify that 100% of species 1 to 386 in `POKE_ESPECES` and `POKE_GEN3_ESPECES` have a valid `talent` key referencing `POKE_GEN3_TALENTS`.
   - Verify `PokeMoteur.creer` deterministically initializes `mon.talent` without consuming PRNG calls.

3. **Test 3: Combat engine ability hooks & held item mechanics**
   - Verify `PokeRegles.talentsActifs()` returns `true` for `gen3` and `false` for `gen1`/`gen2`.
   - Verify entrance hooks: `INTIMIDATE` drops opponent attack by 1 stage unless blocked by `CLEAR_BODY` / `WHITE_SMOKE` / `HYPER_CUTTER`.
   - Verify weather abilities: `DRIZZLE`, `DROUGHT`, `SAND_STREAM` trigger appropriate meteo.
   - Verify immunities: `LEVITATE` ignores Ground moves, `WONDER_GUARD` ignores non-super-effective damage, `VOLT_ABSORB` / `WATER_ABSORB` / `FLASH_FIRE` absorb elemental moves.
   - Verify damage buffs: `OVERGROW` / `BLAZE` / `TORRENT` at <= 1/3 HP, `HUGE_POWER` doubling physical attack, `THICK_FAT` halving fire/ice damage.
   - Verify held items: `CHOICE_BAND` boosts physical damage by 1.5x, `LEFTOVERS` heals 1/16 HP end of turn, `WHITE_HERB` clears negative stages, `LUM_BERRY` clears status.
   - Verify weather: `HAIL` chips non-ice, `AIR_LOCK` / `CLOUD_NINE` negates weather damage and weather move boost.
   - Verify cross-generational invariance: Gen 1/Gen 2 combat ignores abilities even if assigned.

4. **Test 4: Battle Factory catalog (POKE_GEN3_SETS_USINE) & palier resolution**
   - Verify `POKE_GEN3_SETS_USINE` exports 4 tiers (tier 1: >=30, tier 2: >=35, tier 3: >=40, tier 4: >=50).
   - Verify every set in every tier specifies valid `espece` (1-386), valid `nature`, valid `objet` from `POKE_GEN3_TENUS`, and 4 moves from `POKE_ATTAQUES` / `POKE_GEN3_ATTAQUES`.
   - Verify `PokeUsine.palierPourCombat(combat)` returns palier 1 for combats 1-7, palier 2 for 8-14, palier 3 for 15-21, palier 4 for 22+.

5. **Test 5: PokeUsine session state transitions & Boss Samson / Noland**
   - Verify `PokeUsine.creerSession("USINE-TEST-SEED")` generates 6 unique rental Pokémon at level 50 with distinct species and held items.
   - Verify `PokeUsine.choisirEquipeInitiale` transitions state to combat 1.
   - Verify `PokeUsine.continuerSerie` and `PokeUsine.soignerEquipe` maintain streak and fully restore HP.
   - Verify combat 21 triggers Noland (tier 3, symbol: "argent") and combat 42 triggers Noland (tier 4, symbol: "or").
   - Verify `PokeUsine.calculerGainPCo` calculates correct rewards (3 for series 1-4, 5 for 5-6, 10 for 7+, +10 on symbol victory).

6. **Test 6: Cross-generational bit-level PRNG determinism & replay parity**
   - Run 100 PRNG draws across Gen 1, Gen 2, and Gen 3 sessions with identical Mulberry32 seeds, asserting bit-identical sequence parity.

## Verification Requirements
- All tests in `tests/run_all_tests.mjs` must pass (50+ tests, 100% pass rate).
- All standalone tests must continue to pass:
  - `node tests/test_gen3_natures.mjs`
  - `node tests/test_gen3_talents_data.mjs`
  - `node tests/test_gen3_combat_talents.mjs`
  - `node tests/test_gen3_usine_engine.mjs`
  - `node tests/test_gen3_usine_ui.mjs`
  - `node tests/test_gen3_registry.mjs`
- Commit your changes with:
  `git add tests/run_all_tests.mjs`
  `git commit -m "feat(gen3): Task 6 - comprehensive regression suite for battle factory and tactical engine"`
- Write your full report to `.superpowers/sdd/2026-09-09-battle-factory-talents/task-6-report.md`.
