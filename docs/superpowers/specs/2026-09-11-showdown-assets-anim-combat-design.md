# Design Spec: Pokémon Showdown Animated Sprites, Modern Attack FX & Enhanced Combat UI

- **Date**: 2026-09-11
- **Status**: Validated & Approved
- **Scope**: Road to Legends — Mode Pokémon (Pokémon : La Voie des Maîtres)
- **Target Systems**: `js/poke/sprites-showdown.js`, `js/poke/anim-showdown.js`, `js/poke/ui-combat.js`, `css/poke.css`, `tests/test_showdown_animated_engine.mjs`

---

## 1. Overview & Goals

Following the foundation of the Pokémon Showdown Art Direction (dark theme, Showdown tokens, floating healthboxes, 2x2 move grid), this specification completes the combat experience with authentic Pokémon Showdown assets, animations, and battle mechanics indicators:

1. **Showdown Animated Sprites (Front & Back)**:
   - Dynamic streaming of official Pokémon Showdown animated GIFs (`https://play.pokemonshowdown.com/sprites/ani/` and `/ani-back/`).
   - Resilient, instantaneous local offline fallback to the 386 full-color GBA sprites (`assets/img/poke/gen3/face/` and `dos/`).
   - Normalization mapper translating all 386 species (Gen 1 Kanto, Gen 2 Johto, Gen 3 Hoenn) into Showdown canonical identifiers.
   - Centered and grounded on the 3D elliptical platforms (`left: 50%; transform: translateX(-50%)`, `bottom: 20px`).

2. **Modern Attack Animations Engine (`anim-showdown.js`)**:
   - Hardware-accelerated Canvas 2D overlay (`.pk-arene-fx`) with HiDPI / Retina resolution handling.
   - **7 Signature Attack Animations**:
     - *Tonnerre / Fatal-Foudre*: Jagged multi-branched vertical lightning discharge with screen flash and trailing sparks.
     - *Surf / Cascade*: Translucent sweeping tidal wave traversing from player to opponent (or vice versa).
     - *Séisme / Ampleur*: Ground fissure cracks, earth dust particles, and violent viewport screen-shake.
     - *Lance-Flammes / Déflagration*: Blazing parabolic torrent of flame particles radiating heat toward the target.
     - *Laser Glace / Blizzard*: Cryogenic sub-zero energy beam with shattering crystalline ice prisms.
     - *Tranche / Griffe / Morsure*: Kinetic slashing energy arcs and snapping energetic jaws.
     - *Psyko / Ball'Ombre / Vibrobscur*: Concentric chromatic aberration shockwaves and target distortion.
   - **Procedural Particle Engine by Move Type**:
     - Physical: Forward dash thrust + directional impact sparks colored by move type (`--type-*`).
     - Special: Elemental projectile orb/beam traveling between platforms.
     - Status: Rising or contracting concentric energy rings.

3. **Enhanced Tactical Combat UI**:
   - **Healthbox Stat Stage Pills**: Real-time display of active stat stages (`.pk-hb-paliers`):
     - Green pill (`#22c55e`) for positive stages (`+1 Atk`, `+2 Vit`, `+1 SpA`).
     - Red pill (`#ef4444`) for negative stages (`-1 Déf`, `-2 Atk`, `-1 Vit`).
     - Zero/neutral stages are cleanly hidden.
   - **Stat Change Visual Auras**:
     - Green upward chevrons (`▲▲▲`) floating over Pokémon during stat boost.
     - Red downward chevrons (`▼▼▼`) floating over Pokémon during stat drop.
   - **Tactical Effectiveness Badges on Move Buttons**:
     - Computed dynamically against the opponent's active typing:
       - `×2` or `×4`: High-contrast emerald badge (`#22c55e`).
       - `×½` or `×¼`: Amber/orange badge (`#f59e0b`).
       - `×0`: Slate gray badge (`#64748b`) for immunities.
       - `STAT`: Neutral gray tag for status moves.
   - **Weather Indicator**:
     - Discrete arena header badge when active weather exists (`🌧️ Pluie (3)`, `☀️ Soleil`, `⏳ Tempête`, `❄️ Grêle`).

---

## 2. Architecture & File Structure

```
js/poke/
├── sprites-showdown.js      # [NEW] Normalization of species names -> Showdown GIF URLs + local fallback
├── anim-showdown.js         # [NEW] Canvas 2D engine: 7 signature animations + procedural type effects + stat auras
├── ui-combat.js             # [MODIFY] Mounts canvas, wires animated sprites, renders stat pills & effectiveness badges
├── icones.js                # [MAINTAIN] Core sprite routing
└── ordre.js                 # [MODIFY] Registers sprites-showdown.js and anim-showdown.js in POKE_ORDRE_ECRANS

css/
└── poke.css                 # [MODIFY] Styles for .pk-arene-fx, .pk-hb-paliers, .pk-palier-pill, .pk-attaque-efficacite

tests/
├── test_showdown_animated_engine.mjs # [NEW] Test suite for sprite mapping, offline fallback, stat badges & FX
└── run_all_tests.mjs                 # [MODIFY] Integrates animated engine tests into Master Suite
```

---

## 3. Detailed Component Specifications

### 3.1 `js/poke/sprites-showdown.js`

- **Global Namespace**: `W.PokeSpritesShowdown`
- **Normalization Table**:
  - Maps national dex IDs (1 to 386) to lowercase alphanumeric strings:
    - Normal case: `1 -> bulbasaur`, `25 -> pikachu`, `259 -> marshtomp`, `276 -> taillow`.
    - Special cases:
      - Nidoran ♀ (#29): `nidoranf`
      - Nidoran ♂ (#32): `nidoranm`
      - Mr. Mime (#122): `mrmime`
      - Farfetch'd (#83): `farfetchd`
      - Ho-Oh (#250): `hooh`
      - Deoxys (#386): `deoxys`
- **Methods**:
  - `nomShowdown(n)`: Returns the normalized identifier string.
  - `aniFace(mon, suffixe)`:
    `"https://play.pokemonshowdown.com/sprites/" + (estChroma ? "ani-shiny/" : "ani/") + nom + ".gif"`
  - `aniDos(mon, suffixe)`:
    `"https://play.pokemonshowdown.com/sprites/" + (estChroma ? "ani-back-shiny/" : "ani-back/") + nom + ".gif"`
  - `repliFace(mon)`: `"assets/img/poke/gen3/face/" + mon.n + ".png?i=6"`
  - `repliDos(mon)`: `"assets/img/poke/gen3/dos/" + mon.n + ".png?i=6"`

### 3.2 `js/poke/anim-showdown.js`

- **Global Namespace**: `W.PokeAnimShowdown`
- **Canvas Management**:
  - Canvas initialized and attached to `.pk-arene-showdown` as `.pk-arene-fx`.
  - Coordinates mapped to arena dimensions `rect.width` × `rect.height`, scaled by `window.devicePixelRatio || 1`.
- **API**:
  - `jouerAttaque(canvas, attCle, coteAttaquant, cb)`:
    - Dispatches to signature animation if `attCle` is in signature registry (`TONNERRE`, `FATAL_FOUDRE`, `SURF`, `CASCADE`, `SEISME`, `AMPLEUR`, `LANCE_FLAMMES`, `DEFLAGRATION`, `LASER_GLACE`, `BLIZZARD`, `TRANCHE`, `GRIFFE`, `MORSURE`, `PSYKO`, `BALL_OMBRE`, `VIBROBSCUR`).
    - Otherwise dispatches to procedural renderer based on move category and type.
    - Resolves via `requestAnimationFrame` loop lasting 400ms to 600ms, clears canvas, and invokes callback `cb`.
  - `jouerStatAura(canvas, coteCible, delta, statNom)`:
    - Renders upward floating green chevrons if `delta > 0`.
    - Renders downward floating red chevrons if `delta < 0`.
    - Lasts 400ms.

### 3.3 `js/poke/ui-combat.js` Integration

1. **Sprite Tag Generation**:
   - In `monterCamp`:
     ```html
     <img class="est-entrant pk-sprite-combattant"
          data-cote="${cote}"
          alt="${nom}"
          src="${PokeSpritesShowdown.ani(mon, cote)}"
          onerror="this.onerror=null; this.src='${PokeSpritesShowdown.repli(mon, cote)}';">
     ```
2. **Stat Stage Pills in Healthbox**:
   - Inside `.pk-healthbox`:
     - Container `.pk-hb-paliers` renders a badge for each non-zero stat:
       `<span class="pk-palier-pill ${val > 0 ? 'est-hausse' : 'est-baisse'}">${val > 0 ? '+' : ''}${val} ${statAbbr}</span>`
3. **Tactical Effectiveness Badges**:
   - On `.pk-attaque-btn`:
     - Calculate multiplier `mult = W.PokeType.multiplicateur(attaque.type, cible.types)`.
     - Render badge `.pk-attaque-efficacite`:
       - `mult >= 2`: `×2` or `×4` (`.est-super`)
       - `0 < mult < 1`: `×½` or `×¼` (`.est-peu`)
       - `mult === 0`: `×0` (`.est-inutile`)
       - `mult === 1`: hidden or subtle neutral.

---

## 4. Architectural Rules & Invariants

- **Pure Vanilla JS (ES5 / IIFE)**: Strict syntax compliance with zero bundlers or external packages.
- **NOYAU Isolation**: Zero modifications to core simulation files (`combat.js`, `partie.js`, `moteur.js`, `rng.js`). All animations and sprites are strictly presentation layer (`ECRANS`).
- **Mulberry32 PRNG Determinism**: Zero calls to `Math.random` or non-deterministic APIs in the animation timing or visual generation that could leak into game state.
- **Backward Compatibility**: Standalone test suites and master regression suite `run_all_tests.mjs` must maintain 100% pass rate.

---

## 5. Verification Plan

1. **Unit & Integration Suite (`tests/test_showdown_animated_engine.mjs`)**:
   - Test 1: Species name to Showdown animated GIF resolution across all 386 Pokémon (Kanto, Johto, Hoenn).
   - Test 2: Offline fallback mechanism to local GBA sprites.
   - Test 3: Canvas FX mounting, retina scaling, and lifecycle cleanup.
   - Test 4: Signature animations dispatch and procedural fallbacks.
   - Test 5: Stat stage pills rendering (`+1 Atk`, `-1 Def`) and auras.
   - Test 6: Move effectiveness calculation and badge display.
2. **Master Regression Runner (`tests/run_all_tests.mjs`)**:
   - Full execution of all 61+ tests verifying zero regressions across Gen 1, Gen 2, and Gen 3.
