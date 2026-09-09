# Battle Factory (Usine de Combat) & Moteur Tactique Gen 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter l'Usine de Combat (Battle Factory) avec ses sets de prêt officiels d'Émeraude, le Meneur Noland (Samson), les échanges d'après-match et la boutique PCo, propulsée par le socle tactique Gen 3 (25 natures, talents canoniques pour 100% des Pokémon, météo étendue et objets tenus compétitifs).

**Architecture:** Les modules de données et de logique métier (`natures.js`, `talents.js`, `objets-tenus.js`, `sets-usine.js`, `usine.js`) sont développés selon les règles strictes NOYAU (fonctions pures, 'use strict', zéro DOM, PRNG Mulberry32 déterministe). Les hooks du moteur de combat (`combat.js`, `moteur.js`) n'impactent pas les combats Gen 1 et Gen 2. L'interface (`ui-usine.js`) prend en charge le draft des 6 prêts, la progression des 7 combats, les échanges tactiques et la boutique PCo.

**Tech Stack:** Vanilla JavaScript (ES5 / IIFE universel), Node.js (test runner sans dépendance externe), WebAudio API pour les bruitages.

**Spec:** [`docs/superpowers/specs/2026-09-09-battle-factory-talents-design.md`](file:///c:/Users/illye/Documents/antigravity/rtl-pokemon/docs/superpowers/specs/2026-09-09-battle-factory-talents-design.md)

## Global Constraints

- **Zéro dépendance d'exécution externe** : code pur Vanilla JS uniquement.
- **Règles NOYAU absolues** : `'use strict'`, zéro accès DOM (`window`, `document`) dans les modules de logique et données, zéro appel non-déterministe (`Math.random()`, `Date.now()`).
- **Contrat de déterminisme Mulberry32** : tous les tirages procèdent de graines déterministes.
- **Non-régression 100 % garantie** : les 44+ tests existants dans `tests/run_all_tests.mjs` doivent impérativement rester au vert.
- **Compatibilité ascendante** : les Pokémon et combats Gen 1 et Gen 2 ignorent natures et talents.

---

### Task 1: Les 25 Natures Canoniques Gen 3 & Calcul de Statistiques

**Files:**
- Create: `js/poke/gen3/natures.js`
- Modify: `js/poke/moteur.js:80-92`
- Modify: `js/poke/ordre.js:100-125`
- Test: `tests/test_gen3_natures.mjs`

**Interfaces:**
- Produces: `W.POKE_GEN3_NATURES` (dictionnaire des 25 natures `{ fr, en, plus, moins }`)
- Produces: `W.PokeNatures = { table, tirer, facteur, nom }`
- Modifies: `W.PokeMoteur.calculerStats(p)` appliquant `plus` (+10%) et `moins` (-10%) si `p.nature` est défini.

- [ ] **Step 1: Write the failing test**
Create `tests/test_gen3_natures.mjs` to verify:
- Exactly 25 canonical natures defined with localized French & English names.
- 5 neutral natures have `plus: null, moins: null`.
- 20 stat-modifying natures correctly specify $+10\%$ on one stat and $-10\%$ on another.
- `PokeMoteur.calculerStats` applies the $+10\%$ and $-10\%$ factors when `p.nature` is set.
- `PokeMoteur.calculerStats` leaves stats bit-identical when `p.nature` is absent (Gen 1 & Gen 2 non-regression).

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_gen3_natures.mjs`
Expected: FAIL ("Cannot find module" or "POKE_GEN3_NATURES undefined")

- [ ] **Step 3: Implement `js/poke/gen3/natures.js`, update `moteur.js` and `ordre.js`**
- Create `js/poke/gen3/natures.js` exporting `W.POKE_GEN3_NATURES` and helper functions.
- Update `moteur.js:calculerStats` to apply `nMod.plus` and `nMod.moins` factors.
- Add `js/poke/gen3/natures.js` to `GEN3` in `ordre.js`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_gen3_natures.mjs`
Expected: PASS (100%)

- [ ] **Step 5: Verify global non-regression**
Run: `node tests/run_all_tests.mjs`
Expected: PASS (44/44, 100%)

- [ ] **Step 6: Commit**
```bash
git add js/poke/gen3/natures.js js/poke/moteur.js js/poke/ordre.js tests/test_gen3_natures.mjs
git commit -m "feat(gen3): Task 1 - canonical natures and stat calculation modifiers"
```

---

### Task 2: Base de Données des Talents (Abilities) pour 100 % des Espèces

**Files:**
- Create: `js/poke/gen3/talents.js`
- Modify: `js/poke/gen3/especes.js` (enrichir les 135 espèces Hoenn avec `talent`)
- Modify: `js/poke/especes.js` (enrichir les espèces 1-251 avec leur talent officiel Gen 3)
- Modify: `js/poke/ordre.js`
- Test: `tests/test_gen3_talents_data.mjs`

**Interfaces:**
- Produces: `W.POKE_GEN3_TALENTS` (dictionnaire exhaustif des talents `{ fr, en, desc: { fr, en } }`)
- Produces: `W.PokeTalents = { table, de(p), nom(cle, lang), desc(cle, lang) }`
- Updates: 100% des espèces Pokémon (1 à 386) ont la propriété `talent` (ou `talents: [t1, t2]`).

- [ ] **Step 1: Write the failing test**
Create `tests/test_gen3_talents_data.mjs` to verify:
- `W.POKE_GEN3_TALENTS` contains definitions and fr/en translations for all Gen 3 abilities.
- 100% of Gen 3 species (252-386) have a valid `talent` key referencing `W.POKE_GEN3_TALENTS`.
- Species 1-251 have their canonical Gen 3 retro-talents assigned.
- Starter lines have canonical abilities: Arcko (Overgrow), Poussifeu (Blaze), Gobou (Torrent).
- Signature species have canonical abilities: Munja (Wonder Guard), Rayquaza (Air Lock), Kyogre (Drizzle), Groudon (Drought).

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_gen3_talents_data.mjs`
Expected: FAIL ("W.POKE_GEN3_TALENTS undefined")

- [ ] **Step 3: Implement `js/poke/gen3/talents.js`, enrich species, and wire `ordre.js`**
- Create `js/poke/gen3/talents.js` declaring `W.POKE_GEN3_TALENTS` and `W.PokeTalents`.
- Add canonical talent mapping to `js/poke/gen3/especes.js` and `js/poke/especes.js`.
- Add `js/poke/gen3/talents.js` to `GEN3` in `ordre.js`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_gen3_talents_data.mjs`
Expected: PASS (100%)

- [ ] **Step 5: Verify global non-regression**
Run: `node tests/run_all_tests.mjs`
Expected: PASS (44/44, 100%)

- [ ] **Step 6: Commit**
```bash
git add js/poke/gen3/talents.js js/poke/gen3/especes.js js/poke/especes.js js/poke/ordre.js tests/test_gen3_talents_data.mjs
git commit -m "feat(gen3): Task 2 - canonical abilities database and 100% species mapping"
```

---

### Task 3: Moteur de Combat Évolué (Hooks de Talents, Météo Grêle/Air Lock & Objets Tenus)

**Files:**
- Create: `js/poke/gen3/objets-tenus.js`
- Modify: `js/poke/combat.js` (hooks entrée, dégâts, contact, immunités, fin de tour, météo)
- Modify: `js/poke/regles.js` & `js/poke/ordre.js`
- Test: `tests/test_gen3_combat_talents.mjs`

**Interfaces:**
- Produces: `W.POKE_GEN3_TENUS` (Bandeau Choix, Herbe Blanche, Baie Prunus, Restes, etc.)
- Modifies: `combat.js` pour appeler les hooks de talents et gérer la Grêle et Air Lock uniquement en présence de `talent` actif.
- Invariance: en Gen 1 et Gen 2 sans talents, `combat.js` suit strictement le flux d'origine.

- [ ] **Step 1: Write the failing test**
Create `tests/test_gen3_combat_talents.mjs` testing:
- `INTIMIDATE` triggers on entrance and lowers opponent's Attack stage by 1.
- `LEVITATE` completely grants immunity to Ground attacks and Spikes.
- `WONDER_GUARD` only allows super-effective attacks to deal damage.
- `OVERGROW`, `BLAZE`, `TORRENT` boost moves by $\times 1.5$ when HP $\le 1/3$.
- `HUGE_POWER` doubles physical attack in damage calculations.
- `STATIC` has a 30% chance to paralyze on contact.
- `SPEED_BOOST` increases Speed stage at end of turn.
- `DRIZZLE`, `DROUGHT`, `SAND_STREAM` trigger weather on entrance.
- `AIR_LOCK` negates weather damage and multipliers.
- `HAIL` (Grêle) deals $1/16$ damage per turn to non-Ice types.
- `CHOICE_BAND` boosts physical attack by $\times 1.5$.
- Deterministic PRNG execution under Mulberry32.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_gen3_combat_talents.mjs`
Expected: FAIL

- [ ] **Step 3: Implement `js/poke/gen3/objets-tenus.js` and update `combat.js`**
- Create `js/poke/gen3/objets-tenus.js` with Gen 3 competitive held items.
- Integrate ability hooks in `combat.js` (`talentDe`, `entreeEnCombat`, `immunitesAbsorptions`, `calculerDegats`, `apresCoup`, `finDeTour`).
- Add Hail and Air Lock checks to `combat.js:meteoFinDeTour` and damage calculation.
- Wire into `regles.js` and `ordre.js`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_gen3_combat_talents.mjs`
Expected: PASS (100%)

- [ ] **Step 5: Verify global non-regression**
Run: `node tests/run_all_tests.mjs`
Expected: PASS (44/44, 100%)

- [ ] **Step 6: Commit**
```bash
git add js/poke/gen3/objets-tenus.js js/poke/combat.js js/poke/regles.js js/poke/ordre.js tests/test_gen3_combat_talents.mjs
git commit -m "feat(gen3): Task 3 - combat engine ability hooks, hail weather, air lock and held items"
```

---

### Task 4: Sets Canoniques d'Émeraude & Moteur de l'Usine de Combat (Battle Factory)

**Files:**
- Create: `js/poke/gen3/sets-usine.js`
- Create: `js/poke/gen3/usine.js`
- Modify: `js/poke/ordre.js`
- Test: `tests/test_gen3_usine_engine.mjs`

**Interfaces:**
- Produces: `W.POKE_GEN3_SETS_USINE` (catalogue complet des sets de prêt de Pokémon Émeraude par tiers de difficulté 1 à 4)
- Produces: `W.PokeUsine = { creerSession, tirerPrets, tirerAdversaire, appliquerEchange, soignerEquipe, resoudreCombat, calculerGainPCo, bossNoland }`

- [ ] **Step 1: Write the failing test**
Create `tests/test_gen3_usine_engine.mjs` testing:
- Sets table contains valid Pokémon with 4 legal moves, nature, held item, and species ID.
- `PokeUsine.tirerPrets(graine, serie)` generates 6 unique rental Pokémon with level 50, distinct species and items.
- `PokeUsine.tirerAdversaire(graine, serie, combat)` generates an opponent trainer and team scaled to the current streak.
- Combat 21 (end of streak 3) and combat 42 (end of streak 6) trigger Frontier Brain Noland (Samson).
- `PokeUsine.appliquerEchange(session, playerIdx, advIdx)` swaps Pokémon correctly while retaining current HP/status resets.
- Full session serialization & deserialization works without throwing.
- PRNG Mulberry32 determinism: identical seed produces identical rental draft and opponent teams.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_gen3_usine_engine.mjs`
Expected: FAIL

- [ ] **Step 3: Implement `js/poke/gen3/sets-usine.js`, `js/poke/gen3/usine.js` and wire `ordre.js`**
- Create `js/poke/gen3/sets-usine.js` importing the canonical sets extracted from pokeemerald decompilation.
- Create `js/poke/gen3/usine.js` with pure NOYAU session management, opponent generation, and Noland boss fight.
- Add both files to `GEN3` in `ordre.js`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_gen3_usine_engine.mjs`
Expected: PASS (100%)

- [ ] **Step 5: Verify global non-regression**
Run: `node tests/run_all_tests.mjs`
Expected: PASS (44/44, 100%)

- [ ] **Step 6: Commit**
```bash
git add js/poke/gen3/sets-usine.js js/poke/gen3/usine.js js/poke/ordre.js tests/test_gen3_usine_engine.mjs
git commit -m "feat(gen3): Task 4 - canonical emerald factory sets and battle factory game engine"
```

---

### Task 5: Interface Utilisateur de l'Usine, Écrans de Draft/Swap, Boss Noland & Boutique PCo

**Files:**
- Create: `js/poke/ui-usine.js`
- Modify: `js/poke/ui.js` (navigation, bouton Zone de Combat, intégration boutique PCo)
- Modify: `index.html` (bouton d'accès accueil)
- Modify: `js/poke/ordre.js` (`GEN3_ECRANS`)
- Test: `tests/test_gen3_usine_ui.mjs`

**Interfaces:**
- Produces: `W.PokeUIUsine = { ouvrirHall, ouvrirDraft, ouvrirEchange, ouvrirBoutiquePCo, ouvrirVictoireSerie, ouvrirDefaite }`
- Extends: `ui.js` with `"usine"` view routing and PCo tracking in player save state.

- [ ] **Step 1: Write the failing test**
Create `tests/test_gen3_usine_ui.mjs` testing:
- `ui-usine.js` exports `W.PokeUIUsine`.
- Renders the 6 rental cards during draft with species, types, nature, ability, held item, and moves.
- Renders post-battle swap screen with player's team and defeated opponent's team.
- PCo balance updates correctly upon series completion.
- PCo shop allows purchasing competitive items, vitamins, and evolution stones when player has sufficient PCo.
- Clean DOM destruction and event listener cleanup.

- [ ] **Step 2: Run test to verify it fails**
Run: `node tests/test_gen3_usine_ui.mjs`
Expected: FAIL

- [ ] **Step 3: Implement `js/poke/ui-usine.js` and wire into `ui.js`, `index.html` and `ordre.js`**
- Create `js/poke/ui-usine.js` with responsive, theme-matching UI for all Factory phases.
- Add Zone de Combat button to home screen.
- Wire `GEN3_ECRANS` in `ordre.js`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node tests/test_gen3_usine_ui.mjs`
Expected: PASS (100%)

- [ ] **Step 5: Verify global non-regression**
Run: `node tests/run_all_tests.mjs`
Expected: PASS (44/44, 100%)

- [ ] **Step 6: Commit**
```bash
git add js/poke/ui-usine.js js/poke/ui.js index.html js/poke/ordre.js tests/test_gen3_usine_ui.mjs
git commit -m "feat(gen3): Task 5 - battle factory user interface, draft, swap, boss screens and battle shop"
```

---

### Task 6: Intégration Complète, Suite de Régression Globale & Validation Déterministe

**Files:**
- Modify: `tests/run_all_tests.mjs`
- Test: All suites

**Interfaces:**
- Updates `tests/run_all_tests.mjs` to add Suite 11 (Battle Factory, Abilities, Natures & Held Items invariants).
- Asserts 100% test pass rate across all tiers.

- [ ] **Step 1: Update `tests/run_all_tests.mjs` to include Suite 11**
Add Suite 11 verifying:
- All 25 natures exist and apply $+10\% / -10\%$ correctly in Gen 3 while remaining bit-identical in Gen 1 & 2.
- 100% of species 1-386 have valid ability definitions.
- Combat engine ability hooks execute accurately without leaking memory or throwing.
- Battle Factory rental pool builds correctly with 4 tiers and canonical Emerald sets.
- Battle Factory session state transitions (draft -> combat -> swap -> Noland boss at 21 & 42 -> PCo shop) are deterministic and replayable.
- Bit-level replay determinism across Mulberry32 seeds.

- [ ] **Step 2: Run all standalone test suites**
Run:
- `node tests/test_gen3_natures.mjs`
- `node tests/test_gen3_talents_data.mjs`
- `node tests/test_gen3_combat_talents.mjs`
- `node tests/test_gen3_usine_engine.mjs`
- `node tests/test_gen3_usine_ui.mjs`
- `node tests/run_all_tests.mjs`
Expected: ALL PASS (100%)

- [ ] **Step 3: Commit**
```bash
git add tests/run_all_tests.mjs
git commit -m "feat(gen3): Task 6 - comprehensive regression suite for battle factory and tactical engine"
```

- [ ] **Step 4: Push feature branch to GitHub**
```bash
git push origin feat/battle-factory-talents
```
