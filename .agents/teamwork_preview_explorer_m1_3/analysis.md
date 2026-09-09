# RTL Pokémon — Comprehensive Frontend, UI/UX, DOM, Styling & Audio Audit (M1)

**Auditor**: Explorer 3 (Frontend, UI/UX, DOM Lifecycle, Responsive Design, Audio & Animations)  
**Date**: 2026-08-25  
**Scope**: `index.html`, `manifest.json`, `js/poke/gate.js`, `js/poke/ordre.js`, `js/poke/ui.js`, `js/poke/ui-combat.js`, `js/poke/pokedex-ui.js`, `js/poke/infobulles.js`, `js/poke/fin.js`, `js/poke/classement.js`, `js/poke/carte-partage.js`, `js/poke/audio.js`, `js/poke/sons.js`, `js/poke/animations.js`, `js/poke/anim-attaque.js`, `js/poke/tempo.js`, `js/poke/gen2/*`, and `css/poke.css`.

---

## 1. Executive Summary & Architectural Overview

The frontend of *Road to Legends — Mode Pokémon* is built as a zero-dependency, ultra-optimized Vanilla JavaScript Single Page Application (SPA). It avoids heavyweight modern UI frameworks (React/Vue/Svelte) in favor of a specialized, custom micro-kernel architecture designed for instantaneous boot times, offline gameplay resilience, and authentic Game Boy Color hardware emulation (specifically in audio synthesis and attack animation rendering).

### Core Architectural Pillars
1. **Micro-Kernel Bootloader (`gate.js` -> `ordre.js`)**:
   - `index.html` loads only `js/poke/gate.js` with access gate verification.
   - `gate.js` sets up version polling (`PokeVeille`), registers the Service Worker, and pulls `ordre.js`.
   - `ordre.js` organizes dependencies into two strictly ordered pipelines: `NOYAU` (pure game logic, deterministic rule engine, RNG) and `ECRANS` (DOM rendering, event handlers, animations, audio).
   - When Johto (Gen 2) is active, Gen 2 modules are dynamically spliced into the boot sequence before rules and combat animations.
2. **DOM Rendering & Screen Coque Model**:
   - All UI rendering targets a single DOM root `#poke-racine`.
   - Screens transition via complete innerHTML tree replacement using `coque(html)` (for full-screen wrappers with HUD and navigation) or `hote(id)` (for modal/sub-screen containers).
3. **Hardware-Accurate Emulation Subsystems**:
   - **Audio Engine (`audio.js`)**: Emulates the 4-channel Game Boy APU (2 Pulse/Square waves, 1 Programmable Wave, 1 Noise generator) via offline WebAudio synthesis into cached `AudioBuffer` objects.
   - **Animation Engine (`anim-attaque.js`)**: Replays disassembler-accurate Game Boy tile transformations (160x144 resolution, OAM base coordinates, HFLIP/HVFLIP matrices, sprite palettes) directly on CSS-blended canvases.
4. **Deterministic Design System (`css/poke.css`)**:
   - Enforces the strict rule: *"Every color on screen must name a Pokémon type, a rarity, or a creature."*
   - Seamless dual-theme support: Standard Plateau/Feuille theme and Ink Mode (`body.encre`), with strict WCAG AA contrast calibrations.

---

## 2. Deep UI Architecture & Lifecycle Audit

### 2.1 Boot Sequence & Dynamic Module Injection
- **Location**: `index.html` (lines 50-64), `js/poke/gate.js` (lines 1-309), `js/poke/ordre.js` (lines 1-292).
- **Mechanics**:
  - `gate.js` verifies the passkey `CLE = "poke-4c1e7b"` via `localStorage.getItem("rtl_cle")` or URL parameter `?cle=`.
  - Once verified, `gate.js` calls `chargerOrdre()`, which injects `js/poke/ordre.js?v=version`.
  - `ordre.js` inspects `localStorage` or URL query params to determine if Johto is unlocked (`JOHTO === "ouvert"` or `surLeBanc()`). It then constructs a sequential script loading array:
    ```javascript
    // ordre.js lines 90-130
    var liste = NOYAU.concat(gen2Actif ? GEN2 : []).concat(ECRANS).concat(gen2Actif ? GEN2_ECRANS : []);
    ```
  - Scripts are loaded sequentially via `suite(fichiers, i)`: each script's `onload` triggers the next.
- **Findings & Risks**:
  - **Single Script Failure Risk**: If any single script in the chain encounters a network glitch or a 404, the sequence halts completely with no automatic retry or graceful degradation screen.
  - **Race Condition Guard**: `W.RTL_DEMARRAGE_IMMEDIAT = true` ensures that when `ui.js` finishes loading, it automatically triggers `W.PokeDemarrer()`, avoiding DOMContentLoaded timing mismatches.

### 2.2 DOM Tree Swapping, Event Delegation & Memory Churn
- **Location**: `js/poke/ui.js` (lines 1700-1950, 2700-2850), `js/poke/infobulles.js` (lines 640-687).
- **Mechanics**:
  - Screen switches repeatedly execute `racine.innerHTML = coque(html)` or `hote.innerHTML = ...`.
  - Global event listeners are registered via specialized arming functions:
    - `armerClics()`: Attaches a capture-phase `click` listener on `document` to enforce a 300ms double-click guard (`GARDE_CLIC_MS`) and thumb-jitter guard (`GARDE_POUCE`, 40px radius threshold via `sansBouger()`).
    - `armerBarre()`: Attaches a `scroll` listener on `window` to dynamically show/hide the bottom sticky action bar on mobile (`.est-barre-rangee`).
    - `armerRetour()`: Attaches a `popstate` listener on `window` to manage in-game modal back-navigation (`empilerRetour()`).
    - `PokeInfobulles.brancher()`: Attaches `mouseover`, `mouseout`, `focusin`, `focusout`, `keydown`, `touchstart`, `scroll`, and `resize` listeners on `document` and `window`.
- **Memory & Lifecycle Findings**:
  - **Listener Singletons**: `armerClics`, `armerBarre`, and `PokeInfobulles.brancher` all use idempotent boolean guards (`brancher.fait = true`, `barreArmee = true`, `clicsArmes = true`). This prevents duplicate global listener accumulation when screens re-render.
  - **DOM Garbage Collection Churn**: While global listeners do not leak, replacing massive HTML trees on every click generates high GC churn for DOM nodes, SVG icons, and sprite `<img>` elements.
  - **MutationObserver Cleanup**: `infobulles.js` (lines 678-682) implements a persistent `MutationObserver` on `document.body` that automatically destroys floating tooltip DOM elements if their anchor node is removed from the DOM:
    ```javascript
    if (W.MutationObserver) {
      new W.MutationObserver(function () {
        if (ancre && !D.body.contains(ancre)) fermer();
      }).observe(D.body, { childList: true, subtree: true });
    }
    ```
    *Positive Finding*: This elegantly prevents orphaned floating tooltips during rapid screen transitions.

### 2.3 Screen Transitions, History Navigation & Modals
- **Location**: `js/poke/ui.js` (lines 1850-2050).
- **Navigation Model**:
  - Rather than updating `window.location.hash` for every sub-step (which would clutter browser history during 50+ combat turns), the application maintains an internal screen stack `pileRetour = []`.
  - When opening a sub-screen (Pokédex modal, Bag, Team overview, Settings), `empilerRetour(fermerFn)` pushes a state object to `history.pushState({ poke: true, niveau: pileRetour.length }, "")`.
  - Pressing the hardware/browser Back button triggers `popstate`, popping the top function from `pileRetour` and closing the modal without leaving the app.
  - Unloading or completing a run executes `viderRetour()`, synchronizing browser history back to root.

---

## 3. Screen-by-Screen Component Audit

### 3.1 Combat UI & Animation Lifecycle (`js/poke/ui-combat.js`)
- **Architecture**:
  - Encapsulated in the `Ecran` class (lines 1-2853).
  - Combat execution is decoupled into two phases:
    1. **Synchronous Turn Resolution (`W.PokeCombat.jouerTour`)**: The deterministic rules engine calculates the entire turn's outcomes and outputs an array of discrete event objects (`ev = [...]`).
    2. **Sequential Event Playback Queue (`Ecran.prototype.jouer`)**: The UI processes events one by one, synchronizing HP deltas, text descriptions, sound effects, and CSS/canvas animations.
- **HP Delta Synchronization**:
  - To avoid displaying final turn damage before animations play, `Ecran.prototype.suivreEvenement` (lines 1374-1470) maintains `this.affiche = { joueur: HP, adverse: HP }` and adjusts values incrementally on `degats`, `soin`, `usure`, `contrecoup`, `graineDraine`, etc.
  - A final safety resynchronization (`Ecran.prototype.resynchroniser`) recalibrates `this.affiche` against `mon.pv` when the event queue empties.
- **Identified Lifecycle Bugs & Risks**:
  1. **Uncancelled Capture Timers (`animerCapture`)**:
     - Lines 1755-1788 use `W.setTimeout` directly without tracking timeout IDs:
       ```javascript
       W.setTimeout(function () {
         camp.classList.add("est-happe");
         // ...
       }, 480);
       for (var k = 0; k < n; k++) {
         (function (i) {
           W.setTimeout(function () { son("TINK"); }, 480 + 520 * i + 260);
         })(k);
       }
       ```
     - If the player forfeits, switches screens, or if an unexpected state error occurs during ball animation, these timers continue to fire in the background, attempting to play sounds and mutate detached DOM elements.
     - **Recommendation**: Route all timers through a central cancellable registry on `Ecran` or use `PokeTempo.apres`.
  2. **Attack Entrave / Move Trapping Race Conditions**:
     - Lines 2790-2796 properly guard against using bag items while trapped in multistrike moves (`Danse Flammes`, `Étreinte`), preventing premature item consumption.

### 3.2 Pokédex Screen (`js/poke/pokedex-ui.js`)
- **Structure**:
  - Handles two distinct scopes: **Account Pokédex** (persistent collection across all runs) and **Run Pokédex** (creatures encountered in the current seed).
  - Dual-column grid with live search filtering (`data-filtre="tous|vus|pris|manquants"`).
- **Sound Integration**:
  - Line 562 adds an audio button `#pkdx-cri` on known species fiches, executing `W.PokeSon.cri(n)` on demand as well as on initial fiche render (line 648).
  - Unknown silhouettes (`etat === "inconnu"`) strictly suppress cry playback and name resolution, preserving spoiler protection.
- **Lifecycle & Event Cleanup**:
  - Detail modal uses `hote.innerHTML = ...` and attaches `#pkdx-retour` to restore the grid via `rendre()`. All listeners are re-bound cleanly upon grid restoration.

### 3.3 Info Tooltip System (`js/poke/infobulles.js`)
- **Tri-Positional Collision Clamping**:
  - `placer(el)` (lines 572-610) checks available viewport space in order:
    1. Below the element (`b.height <= placeDessous`).
    2. Above the element (`b.height <= placeDessus`).
    3. Lateral side with greatest remaining width (`placeDroite >= placeGauche ? right : left`), centered vertically and clamped between `scrollY + marge` and viewport bounds.
  - Tooltips set `pointer-events: none` in CSS to ensure buttons beneath overlapping tooltips remain clickable.
- **Accessibility & Focus Delegation**:
  - `cible(e)` (lines 611-640) handles both upward event bubbling (for hover/touch) and downward child query (for keyboard `focusin` on parent buttons containing tooltip metadata), avoiding invalid nested interactive elements (`tabindex` inside `<button>`).

### 3.4 Hall of Fame & Run End (`js/poke/fin.js`)
- **Delta Computation**:
  - Computes net species added to the global account during the run by comparing `partie.pris` against `partie.pokedexAvant` (line 768).
- **DOM Method Compatibility**:
  - Lines 905 & 912 utilize `hote.querySelectorAll("[data-emporter]").forEach(...)`.
  - Line 888 uses `champ.remove()`.
  - While supported in modern evergreen browsers, replacing with standard `for` loops and `parentNode.removeChild` aligns with the codebase's strict ES5 legacy support philosophy.

### 3.5 Share Card Generator (`js/poke/carte-partage.js`)
- **Canvas Pipeline**:
  - Renders 4:5 landscape (`1200x675`) and 9:16 vertical story (`1080x1920`) cards.
  - Image assets (badges, sprites) are pre-loaded asynchronously via `charger(src)` (lines 141-148) with fallback to `null` so missing sprites never break card generation.
- **Glyph Rendering Safety**:
  - Lines 116-139 test gender symbols (`♀`, `♂`) via `mesurable(ctx, glyphe)` against standard fallback widths (``), replacing them with `(f)` / `(m)` if the platform font cannot render them (critical for Windows Canvas 2D fallback).
- **Clipboard API Resilience**:
  - `copier(texte, champ)` (lines 593-604) executes `document.execCommand("copy")` first on an off-screen `<textarea>`, falling back to `navigator.clipboard.writeText(texte)` for secure contexts.

### 3.6 Leaderboard & Cloud Sync (`js/poke/classement.js`)
- **Security & Integrity**:
  - Daily challenge scores require signed device tokens (`/api/device`), run initiation handshake (`/api/daily/start`), and full run journal submission (`/api/daily`).
- **Cloud Progression Sync**:
  - `pokedexSynchroniser()` (lines 487-500) executes a two-way union merge via `PokeFusion.fusionner(local, remote)` so that neither local nor server collection progress can ever be lost or downgraded.

---

## 4. Styling & Responsive Design Audit (`css/poke.css`)

### 4.1 Design Token Architecture & Semantic Palette
- **Token Hierarchy**:
  - Background: `--fond: #0d1420` (deep night slate).
  - HUD Bar: `--hud: #162032`, `--hud-signature: #b4271d` (red accent line, 3px solid).
  - Leaf Theme (Light surfaces for Dex/Fiches/Arena): `--feuille-papier: #ffffff`, `--feuille-creux: #f2f5fa`, `--feuille-encre: #121824`.
  - Plateau Theme (Dark surfaces for Map/Run): `--plateau-papier: #182234`, `--plateau-creux: #121b2b`, `--plateau-encre: #eef3fb`.
- **WCAG AA Contrast Calibration**:
  - `--plateau-sceau-encre: #ff8a7d` (lightened red text for dark backgrounds, providing 4.73:1 contrast against `#182234`).
  - `--feuille-sceau-encre: #c62a1f` (deep red text for light backgrounds, providing 5.1:1 contrast against `#ffffff`).
  - `--feuille-encre-pale: #6a7381` (calibrated to 4.80:1 against white).

### 4.2 Ink Mode / Dark Minimalist Theme (`body.encre`)
- **Structure** (lines 6800-6917):
  - Activated via `document.body.classList.add("encre")` unless `?encre=0` is passed.
  - Flattens all border radii and elevations:
    ```css
    body.encre, body.encre .pkdx {
      --r1: 0; --r2: 0; --r3: 0;
      --ombre-1: none; --ombre-2: none; --ombre-3: none;
    }
    ```
  - Replaces card surfaces with sharp 2.5px solid boundary borders.
  - Disabled states (`[disabled]`, `[aria-disabled="true"]`) carry higher specificity `(0,2,1)` to prevent state overrides.

### 4.3 Responsive Viewport Breakpoints & Touch Target Sizing

| Breakpoint | Target Components & Adjustments | Verified Status |
| :--- | :--- | :--- |
| **`<= 360px`** | Compact mobile: Starters reflow to 3-column grid (`repeat(3, minmax(0, 1fr))`), HUD badges scale to `9x9px`, button text wraps without clipping. | Passed |
| **`<= 390px`** | iPhone standard: HUD grid switches from 4-col to 3-col stacked (`grid-template-columns: auto 1fr auto`), stats badge moves below title. | Passed |
| **`<= 480px`** | Filter buttons switch to 2x2 grid (`:has(> [data-filtre])`), search bar spans full width (`grid-column: 1 / -1`). | Passed |
| **`<= 560px`** | Action bar spacing reduced from 16px to 8px gap to prevent horizontal page overflow. | Passed |
| **`<= 620px`** | Fixed bottom navigation bar (`.pkdx-actions.est-pied.est-carte`): 4-column equal grid with vertical icon-over-text layout. | Passed |
| **`<= 700px`** | Combat action menu converts to 2x2 square grid matching original Game Boy layout. | Passed |

### 4.4 Mobile Scroll-Away Sticky Bar
- **Behavior**: On mobile (`<= 620px`), the bottom action bar hides smoothly on downward scroll (`transform: translateY(calc(100% + 12px))`, `opacity: 0`, `pointer-events: none`) and reappears immediately when scrolling up.
- **Accessibility**: Includes `@media (prefers-reduced-motion: reduce)` override disabling transitions and keeping the bar fixed.

---

## 5. Audio & Animation Engines Audit

### 5.1 Game Boy APU Synthesizer (`js/poke/audio.js`)
- **Sound Architecture**:
  - Implements software synthesis of 4 Game Boy hardware channels:
    - **CH1 & CH2 (Square Wave)**: Configurable duty cycles (12.5%, 25%, 50%, 75%), volume envelope step counter, hardware frequency sweep.
    - **CH3 (Wave)**: Programmable 32-sample 4-bit waveform.
    - **CH4 (Noise)**: 15-bit LFSR (Linear Feedback Shift Register) pseudo-random noise generator with 7-bit periodic mode switch.
  - Output is synthesized at `sampleRate * 2` (supersampled), processed through a 1-pole high-pass filter to remove DC offset, peak-normalized to `0.82`, and stored as an immutable `AudioBuffer`.
- **Autoplay & AudioContext Lifecycle**:
  - Context is created lazily or upon first user interaction (`pointerdown`, `keydown`).
  - **Suspended Context Guard** (lines 298-311):
    ```javascript
    if (c.state === "suspended") {
      var demande = (W.performance && W.performance.now()) || 0;
      c.resume().then(function () {
        var t = (W.performance && W.performance.now()) || 0;
        if (t - demande > 250) return; // Drop stale sound if resume took > 250ms
        src.start();
      });
      return src;
    }
    ```
    *Positive Finding*: This prevents the notorious mobile Safari bug where audio plays with a 1.5s delay after the screen wakes up.
- **Haptic Feedback**:
  - Integrated directly into the sound dispatcher (`toucher(nom)`, lines 335-350) using `navigator.vibrate` patterns for critical tactile moments (`TINK` = 30ms ball shake, `CAUGHT_MON` = 3-step capture fanfare, `POKEDEX_RATING` = badge fanfare).

### 5.2 Combat Attack Animations (`js/poke/anim-attaque.js`)
- **Rendering Pipeline**:
  - Draws onto an overlay layer `.pkdx-anim` positioned over the 160x144 Game Boy screen container `.pkdx-ecran-gb`.
  - Spritesheet tiles from `assets/img/poke/anim/move_anim_0.png` and `_1.png` are blended via CSS `mix-blend-mode: multiply` on pure white background, ensuring authentic dark linework without transparency haloing.
  - CSS custom property `--echelle` dynamically scales the 160px coordinate space to the container's rendered pixel width.
- **Exception & Interruption Safety**:
  - `jouer()` (lines 398-438) wraps the execution loop in a `try ... finally` block:
    ```javascript
    try {
      for (var i = 0; i < pas.length; i++) {
        if (pas[i].e !== undefined) await jouerEffet(scene, pas[i], vitesse, cote);
        else await jouerSous(couche, pas[i], vitesse, cote);
      }
    } finally {
      couche.innerHTML = "";
      couche.classList.remove("est-visible");
      nettoyerSprites(scene);
    }
    ```
    *Positive Finding*: Guaranteed removal of temporary CSS transformation classes (`CLASSES_SPRITE`), ensuring Pokémon sprites are never left permanently invisible or displaced if animations are skipped.

### 5.3 Animation Timing & Background Throttling (`js/poke/tempo.js`)
- **Chrome Background Tab Optimization**:
  - Standard browser `setTimeout` throttles to 1000ms minimum in inactive background tabs.
  - `PokeTempo.apres(ms, fn)` uses `MessageChannel` for 0ms transitions:
    ```javascript
    function rendreLaMain(fn) {
      var c = new W.MessageChannel();
      c.port1.onmessage = function () { fn(); };
      c.port2.postMessage(0);
    }
    ```
    *Positive Finding*: Allows automated test runs and bot play to execute instantly without timer throttling.

---

## 6. PWA, Offline & Service Worker Audit

### 6.1 Service Worker & Manifest Analysis
1. **Manifest Color Inconsistency (`manifest.json`)**:
   - `manifest.json` line 6 contains: `"background_color": "#171310", "theme_color": "#171310"`.
   - `#171310` is the dark brown theme of the Naruto mode.
   - `index.html` line 16 explicitly specifies: `<meta name="theme-color" content="#0d1420">`.
   - **Impact**: When launching the PWA on Android/iOS, the splash screen displays the Naruto brown color before transitioning to the Pokémon blue slate `#0d1420`.
2. **Absolute Path Assumption in Service Worker Registration**:
   - `index.html` line 20: `<link rel="manifest" href="/manifest.json?v=3">`.
   - `gate.js` line 44: `W.navigator.serviceWorker.register("/service-worker.js")`.
   - **Impact**: If the application is hosted in a sub-path (e.g. `https://domain.com/pokemon/` or on a staging server), registering against domain root `/service-worker.js` fails or hijacks the parent domain's service worker scope.
   - **Recommendation**: Use relative paths (`service-worker.js` / `./manifest.json`) or construct URLs based on `window.location.pathname`.

### 6.2 Version Check Toast (`PokeVeille` & `.pk-maj`)
- `gate.js` (lines 170-220) queries `location.pathname + "?sonde=" + Date.now()` every 10 minutes.
- If a version mismatch is detected against `W.POKE_VERSION`, a non-intrusive floating toast `.pk-maj` is rendered at the bottom of the viewport prompting the player to reload.

---

## 7. Improvement Roadmap & Actionable Recommendations

```
+========================================================================================+
|                              RTL POKEMON - UI/UX ROADMAP                               |
+========================================================================================+
| Tier 1: Critical Fixes (PWA & Lifecycle)                                               |
|   ├── 1. Fix manifest.json theme/background color (#171310 -> #0d1420)                 |
|   ├── 2. Make Service Worker & Manifest paths relative to support subdirectories       |
|   └── 3. Implement cancellable timer registry for combat capture animations            |
+----------------------------------------------------------------------------------------+
| Tier 2: High Priority (Codebase Health & Compatibility)                                |
|   ├── 4. Standardize ES5 DOM loops in fin.js (replace NodeList.forEach & .remove())    |
|   ├── 5. Add structured error boundary for API fetch failures in classement.js         |
|   └── 6. Split monolithic ui.js (15k lines) into modular screen components             |
+----------------------------------------------------------------------------------------+
| Tier 3: Medium Priority (UX & Polish)                                                  |
|   ├── 7. Add CSS :has() fallback for legacy iOS Safari (< 15.4) in pokedex filters     |
|   ├── 8. Convert Canvas toBlob/createObjectURL in carte-partage.js for low-RAM devices|
|   └── 9. Introduce subtle micro-haptics on menu tab selection                         |
+========================================================================================+
```
