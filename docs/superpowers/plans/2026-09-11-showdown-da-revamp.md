# Pokémon Showdown Art Direction & Combat Engine Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely overhaul the visual art direction of Pokémon : La Voie des Maîtres into a modern, dark-themed, high-contrast aesthetic inspired by Pokémon Showdown across all generations, combat engine, Battle Factory, home lobby, tactical map, bag, and chest.

**Architecture:** Implement a 5-layer pipeline: (1) Showdown design tokens and dark slate CSS architecture eliminating glaring white containers; (2) responsive 2-column Showdown battle engine with floating healthboxes, 2×2 type-colored move grid, and live scrolling battle log; (3) Showdown Teambuilder draft cards and 2-column swap in Battle Factory; (4) unified dark mode for central screens (home lobby, roadmap, bag, and chest); (5) master regression validation suite.

**Tech Stack:** Pure Vanilla JavaScript (ES5 / IIFE), HTML5, Modern CSS (Custom Properties, CSS Grid, Flexbox), Node.js test runner with `assert/strict`.

**Spec:** `docs/superpowers/specs/2026-09-11-showdown-da-revamp-design.md`

## Global Constraints

- Zero external runtime dependencies. Pure Vanilla JS (ES5 / IIFE).
- Strict NOYAU rules: 'use strict', zero DOM access in logic/data modules (`combat.js`, `partie.js`, `progression.js`, `usine.js`), zero `Math.random` or `Date.now`.
- Replay engine determinism and Mulberry32 parity strictly preserved across Gen 1, Gen 2, and Gen 3.
- No text with contrast ratio < 4.5:1 (WCAG AA). Main headings and move labels must achieve $\ge 7:1$ (WCAG AAA).
- Complete elimination of `#ffffff` container backgrounds and white-on-white text collisions.
- Full backward compatibility: all 55 existing master tests must continue to pass without regression.

---

### Task 1: Showdown Design Tokens, Theme & Global CSS Overhaul

**Files:**
- Modify: `css/poke.css:1-250`, `css/poke.css:7150-7717`
- Test: `tests/test_showdown_css_tokens.mjs`

**Interfaces:**
- Produces: CSS custom properties `--surface-base`, `--surface-carte`, `--surface-survol`, `--bordure-nette`, `--bordure-focus`, `--texte-principal`, `--texte-secondaire`, `--texte-discret`, `--type-[normal...fee]`, `--hp-haut`, `--hp-moyen`, `--hp-critique`.
- Consumed by: `js/poke/ui-combat.js`, `js/poke/ui-usine.js`, `js/poke/ui.js`.

- [ ] **Step 1: Write the failing test for Showdown design tokens**

Create `tests/test_showdown_css_tokens.mjs` asserting that:
1. `css/poke.css` defines all Showdown surface variables (`--surface-base`, `--surface-carte`, `--surface-survol`).
2. `--sur-fond` does NOT equal `#ffffff`.
3. All 18 Showdown canonical type variables (`--type-feu`, `--type-eau`, etc.) are declared.
4. `.pk-showdown-combat`, `.pk-arene-showdown`, `.pk-healthbox`, `.pk-grille-attaques`, and `.pk-battle-log` styles are declared.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_showdown_css_tokens.mjs`  
Expected: FAIL with missing variables or selectors.

- [ ] **Step 3: Update `css/poke.css` with Showdown tokens and layout rules**

Implement:
1. Replace `--sur-fond: #ffffff` with dark slate `#1e293b`.
2. Add Showdown dark tokens in `:root`:
   - `--fond: #080c14;`
   - `--surface-base: #0f172a;`
   - `--surface-carte: #1e293b;`
   - `--surface-survol: #334155;`
   - `--bordure-douce: rgba(255, 255, 255, 0.08);`
   - `--bordure-nette: #334155;`
   - `--bordure-focus: #38bdf8;`
   - `--texte-principal: #f8fafc;`
   - `--texte-secondaire: #94a3b8;`
   - `--texte-discret: #64748b;`
3. Declare the 18 official Pokémon Showdown type colors.
4. Declare responsive layout classes for `.pk-showdown-combat`, `.pk-arene-showdown`, `.pk-healthbox`, `.pk-grille-attaques`, and `.pk-battle-log`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_showdown_css_tokens.mjs`  
Expected: PASS with 100% of tokens verified.

- [ ] **Step 5: Commit**

```bash
git add css/poke.css tests/test_showdown_css_tokens.mjs
git commit -m "feat(css): Task 1 - showdown design tokens, dark surfaces and type palette"
```

---

### Task 2: Modern Showdown Combat Engine Presentation

**Files:**
- Modify: `js/poke/ui-combat.js:1270-1325`, `js/poke/ui-combat.js:2180-2350`, `js/poke/ui-combat.js:2840-2869`
- Test: `tests/test_showdown_combat_ui.mjs`

**Interfaces:**
- Consumes: Showdown tokens from Task 1, `W.PokeCombat`, `W.PokeSprites`, `W.PokeRegles`.
- Produces: `W.PokeUICombat.Ecran` with Showdown battlefield, floating healthboxes, 2×2 move grid, and Live Battle Log.

- [ ] **Step 1: Write the failing test for Showdown combat screen**

Create `tests/test_showdown_combat_ui.mjs` asserting:
1. `Ecran.prototype.monter()` mounts `.pk-showdown-combat` containing `.pk-arene-showdown`, `.pk-battle-log`, and `.pk-actions-showdown`.
2. Floating healthboxes (`.pk-healthbox[data-cote="adverse"]` and `[data-cote="joueur"]`) display name, level, status, HP bar with animated gradient, and numeric/percentage values.
3. Move selection renders a 2×2 grid (`.pk-grille-attaques`) with 4 distinct colored buttons containing name, type pill, power, accuracy, and PP.
4. Live Battle Log updates on each turn action and records events with turn headers.
5. The bag button is hidden when `options.usine: true` or `options.duel: true`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_showdown_combat_ui.mjs`  
Expected: FAIL.

- [ ] **Step 3: Implement Showdown Combat Screen in `js/poke/ui-combat.js`**

Implement:
1. `Ecran.prototype.monter()`:
   - Create `.pk-showdown-combat` with 2-column desktop / stacked mobile layout.
   - Left column: `.pk-arene-showdown` with opponent platform (top-right) and player platform (bottom-left), plus floating healthboxes.
   - Below arena: `.pk-actions-showdown` containing the 2×2 move grid and tactical quick buttons ([ÉQUIPE], [ABANDONNER], [SAC]).
   - Right column: `.pk-battle-log` with live autoscroll, turn headers, and event pills.
2. `Ecran.prototype.menuAttaques()`:
   - Render the 4 move buttons in a 2×2 grid.
   - Each button is styled with its elemental type color (`--type-...`), displaying:
     - Top row: Move Name (bold) + Category tag (`PHY`, `SPE`, `STA`).
     - Bottom row: Type Name + Power (`Pui 90`) + Accuracy (`Préc 100%`) + PP (`PP 15/15`).
3. `Ecran.prototype.menuEquipe()`:
   - Modern modal/drawer showing team bench with healthbars and quick switch.
4. `Ecran.prototype.rafraichir()`:
   - Smoothly update healthboxes, percentage, and healthbar color gradient.
5. `Ecran.prototype.ajouterLog(texte, tag)`:
   - Append styled entries to the Live Battle Log.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_showdown_combat_ui.mjs`  
Expected: PASS with 100% pass rate.

- [ ] **Step 5: Commit**

```bash
git add js/poke/ui-combat.js tests/test_showdown_combat_ui.mjs
git commit -m "feat(combat): Task 2 - showdown battle arena, floating healthboxes, 2x2 move grid and live log"
```

---

### Task 3: Battle Factory Teambuilder Draft & Modern Swap Screen

**Files:**
- Modify: `js/poke/ui-usine.js:250-320`, `js/poke/ui-usine.js:430-515`, `js/poke/ui-usine.js:630-740`, `js/poke/ui-usine.js:890-990`
- Test: `tests/test_gen3_usine_ui.mjs`

**Interfaces:**
- Consumes: Showdown tokens from Task 1, Showdown combat engine from Task 2.
- Produces: `W.PokeUIUsine` with Teambuilder draft cards, 2-column comparison swap, and modern PCo shop.

- [ ] **Step 1: Write test updates in `tests/test_gen3_usine_ui.mjs`**

Add tests verifying:
1. `rendreCartePokemon` generates Showdown Teambuilder cards with dark backgrounds, nature indicators, ability descriptions, and 4 move pills.
2. `ouvrirDraft` renders the 6 Teambuilder cards with dynamic selection highlights and counter.
3. `ouvrirEchange` renders side-by-side comparison columns with swap highlights.
4. `ouvrirBoutiquePCo` renders dark shop cards with filter tabs and reserve indicators.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_gen3_usine_ui.mjs`  
Expected: FAIL on new Teambuilder expectations.

- [ ] **Step 3: Modernize `js/poke/ui-usine.js`**

Implement:
1. `rendreCartePokemon`:
   - Style as a Showdown Teambuilder profile card with dark surface, 80px sprite/art, type pills, clear nature with `(+Stat, -Stat)`, ability name and full description, held item, and 4 move pills with power and accuracy.
2. `ouvrirDraft`:
   - Teambuilder grid with cyan glowing border on selected cards and `X / 3` counter.
3. `ouvrirEchange`:
   - 2-column comparison with player team on left and opponent team on right, and visual swap selector.
4. `ouvrirHall`:
   - Competitive lobby with Samson banner, 4 metric cards (Streak, PCo, Silver, Gold), and dark card rules.
5. `ouvrirBoutiquePCo`:
   - Category filter tabs, PCo price badges, and reserve badges.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_gen3_usine_ui.mjs`  
Expected: PASS with 100% across all usine tests.

- [ ] **Step 5: Commit**

```bash
git add js/poke/ui-usine.js tests/test_gen3_usine_ui.mjs
git commit -m "feat(usine): Task 3 - showdown teambuilder draft, comparative swap and modern lobby"
```

---

### Task 4: Central Screens Revamp (Accueil, Carte Tactique, Sac, Coffre & Pokédex)

**Files:**
- Modify: `js/poke/ui.js` (sections `accueil`, `carte`, `ecranSac`, `ecranCoffre`, `pokedex`)
- Test: `tests/test_coffre_objets_depart.mjs`, `tests/test_showdown_ui_central.mjs`

**Interfaces:**
- Consumes: Showdown tokens from Task 1.
- Produces: Modern dark lobby, tactical roadmap, tabbed inventory bag, and Sugimori Pokédex.

- [ ] **Step 1: Write tests in `tests/test_showdown_ui_central.mjs`**

Verify:
1. `#pk-accueil` renders the modern competitive lobby layout.
2. `#pk-carte` roadmap nodes use dark surface with glowing path indicators.
3. `ecranSac` and `ecranCoffre` use tabbed category navigation and dark item cards.
4. Pokédex detail cards display Sugimori art, stat bars, and ability descriptions.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_showdown_ui_central.mjs`  
Expected: FAIL.

- [ ] **Step 3: Update `js/poke/ui.js` with Showdown DA**

Implement:
1. Home screen `accueil()`:
   - Modern dark lobby with trainer banner and clean mode cards.
2. Map `carte()`:
   - Tactical roadmap with clean dark nodes, glowing current node, and act header.
3. Bag `ecranSac()` & Chest `ecranCoffre()`:
   - Tabbed category pills (Soins, Balls, Objets Tenus, Vitamines, Pierres) with item cards and 1-click equip to team.
4. Pokédex:
   - High-contrast detail modal with base stats bars and ability breakdown.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/test_showdown_ui_central.mjs`  
Run: `node tests/test_coffre_objets_depart.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/poke/ui.js tests/test_showdown_ui_central.mjs
git commit -m "feat(ui): Task 4 - modern lobby, tactical roadmap, tabbed bag and showdown pokedex"
```

---

### Task 5: Master Regression Runner, Invariant Suite & Verification

**Files:**
- Modify: `tests/run_all_tests.mjs`
- Test: All suites (`tests/run_all_tests.mjs`, `test_showdown_combat_ui.mjs`, `test_gen3_usine_ui.mjs`, etc.)

**Interfaces:**
- Validates all 4 tasks against strict project invariants.

- [ ] **Step 1: Update `tests/run_all_tests.mjs` with Suite 13**

Add Suite 13: "13. Pokémon Showdown Art Direction & Unified Combat Engine Invariants"
- Test 1: Showdown design tokens, dark surfaces, and elimination of `#ffffff` container backgrounds.
- Test 2: Showdown 2-column combat screen layout, floating healthboxes, and 2×2 move grid.
- Test 3: Live Battle Log event recording and autoscroll.
- Test 4: Battle Factory Teambuilder draft cards, 2-column swap, and PCo shop.
- Test 5: Cross-generational bit-level Mulberry32 determinism and replay parity under the new combat presentation.

- [ ] **Step 2: Run master test suite**

Run: `node tests/run_all_tests.mjs`  
Expected: All 60+ tests PASS (100% pass rate).

- [ ] **Step 3: Run all standalone test suites**

Run:
- `node tests/test_showdown_css_tokens.mjs`
- `node tests/test_showdown_combat_ui.mjs`
- `node tests/test_showdown_ui_central.mjs`
- `node tests/test_gen3_usine_ui.mjs`
- `node tests/test_gen3_usine_engine.mjs`
- `node tests/test_coffre_objets_depart.mjs`
- `node tests/test_gen3_combat_talents.mjs`
- `node tests/test_gen3_natures.mjs`
Expected: 100% PASS across every suite.

- [ ] **Step 4: Commit**

```bash
git add tests/run_all_tests.mjs
git commit -m "feat(tests): Task 5 - comprehensive regression suite for showdown art direction and combat engine"
```
