# Task 3 Brief: Moteur de Combat Évolué (Hooks de Talents, Météo Grêle/Air Lock & Objets Tenus)

## 1. Description & Context
Cette tâche connecte le moteur de combat (`combat.js`) aux talents actifs et aux mécaniques tactiques de la 3e génération :
1. Objets tenus compétitifs Gen 3 dans `js/poke/gen3/objets-tenus.js` (`CHOICE_BAND`, `LEFTOVERS`, `WHITE_HERB`, `LUM_BERRY`, etc.).
2. Hooks pour les talents actifs en combat : entrée sur le terrain (`INTIMIDATE`, `DRIZZLE`, `DROUGHT`, `SAND_STREAM`, `AIR_LOCK`), calcul de dégâts (`OVERGROW`, `BLAZE`, `TORRENT`, `HUGE_POWER`, `GUTS`, `THICK_FAT`), immunités et absorption (`LEVITATE`, `WONDER_GUARD`, `VOLT_ABSORB`, `WATER_ABSORB`, `FLASH_FIRE`, `SOUNDPROOF`), effets de contact (`STATIC`, `POISON_POINT`, `FLAME_BODY`, `ROUGH_SKIN`, `SYNCHRONIZE`, immunités de statut), et fin de tour (`SPEED_BOOST`, `SHED_SKIN`, `RAIN_DISH`).
3. Prise en charge de la météo Grêle (`grele`) et de la neutralisation météo par `AIR_LOCK` / `CLOUD_NINE`.
4. Règle absolue de non-régression : Les combats Gen 1 et Gen 2 n'activent AUCUN talent (`PokeRegles.talentsActifs()` rend `false`), préservant bit-à-bit les 44+ tests existants.

## 2. Target Files
- Create: `js/poke/gen3/objets-tenus.js`
- Modify: `js/poke/combat.js`
- Modify: `js/poke/regles.js`
- Modify: `js/poke/ordre.js`
- Create Test: `tests/test_gen3_combat_talents.mjs`

## 3. Detailed Specifications

### 3.1. Objets Tenus Gen 3 (`js/poke/gen3/objets-tenus.js`)
Format IIFE standard : `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);`
Déclarer `W.POKE_GEN3_TENUS` :
- `boost`: dictionnaire des 17 objets de type (Eau Mystique, Charbon, Grain Miracle, etc.) avec `boostFacteur: 1.1`.
- `leftovers`: { effet: "HELD_LEFTOVERS", part: 16 } (soigne 1/16 PV max par tour).
- `choiceBand`: { effet: "HELD_CHOICE_BAND", facteur: 1.5, bloque: true } (+50% Attaque physique).
- `whiteHerb`: { effet: "HELD_WHITE_HERB", restaurePaliersNegatifs: true, consomme: true }.
- `quickClaw`: { effet: "HELD_QUICK_CLAW", sur: 256, seuil: 60 }.
- `scopeLens`: { effet: "HELD_CRITICAL_UP", facteur: 2 }.
- `focusBand`: { effet: "HELD_FOCUS_BAND", sur: 256, seuil: 26 }.
- `baies`:
  - `HELD_LUM_BERRY`: { soigneStatuts: true, soigneConfusion: true, consomme: true }
  - `HELD_SITRUS_BERRY`: { soigne: 30, seuil: 0.5, consomme: true }
  - Baies de statut individuelles (`HELD_CHESTO_BERRY`, `HELD_PECHA_BERRY`, etc.).

### 3.2. Registre des Règles (`js/poke/regles.js`)
- Dans la déclaration du jeu `gen3` :
  - Ajouter `talentsActifs: function () { return true; }`.
  - Ajouter `tenus: function () { return W.POKE_GEN3_TENUS || W.POKE_GEN2_TENUS; }`.
- Pour `gen1` et `gen2` :
  - `talentsActifs()` rend `false` (ou n'est pas défini).

### 3.3. Hooks de Combat (`js/poke/combat.js`)
Définir le helper interne :
```javascript
function talentsSontActifs(e) {
  if (e && e.talentsActifs !== undefined) return e.talentsActifs;
  return W.PokeRegles && W.PokeRegles.talentsActifs ? W.PokeRegles.talentsActifs() : false;
}

function talentDe(p, e) {
  if (!p || !talentsSontActifs(e)) return null;
  if (p.talent) return p.talent;
  if (W.PokeTalents && W.PokeTalents.de) return W.PokeTalents.de(p);
  var esp = ESP();
  return (esp && esp[p.n] && esp[p.n].talent) || null;
}

function airLockActif(e) {
  if (!talentsSontActifs(e)) return false;
  var pJ = actif(e.joueur), pA = actif(e.adverse);
  var tJ = vivant(pJ) && talentDe(pJ, e);
  var tA = vivant(pA) && talentDe(pA, e);
  return tJ === "AIR_LOCK" || tJ === "CLOUD_NINE" || tA === "AIR_LOCK" || tA === "CLOUD_NINE";
}
```

1. **Entrée en Combat (`entreeEnCombat(e, cote, p, ev)`)** :
   Appelé lors de l'initialisation du combat ou d'un remplacement :
   - `INTIMIDATE`: si l'autre camp a un Pokémon actif vivant :
     Vérifier si sa capacité empêche la baisse (`CLEAR_BODY`, `WHITE_SMOKE`, `HYPER_CUTTER`).
     Sinon, baisse son palier d'Attaque de 1 (`paliers.atk = Math.max(-6, paliers.atk - 1)`) et émet `{ t: "talentIntimidation", qui: cote, cible: autreCote }`.
   - `DRIZZLE`: si météo non présente ou différente, active la pluie : `e.meteo = { cle: "pluie", reste: 5 };` + émet `{ t: "meteo", cle: "pluie", talent: "DRIZZLE" }`.
   - `DROUGHT`: active le zénith (`"zenith"`).
   - `SAND_STREAM`: active la tempête de sable (`"sable"`).
   - `TRACE`: copie le talent du Pokémon adverse actif (si non `null`).

2. **Immunités & Absorptions (`verifierImmuniteTalent(att, def, a, e, ev)`)** :
   - `LEVITATE`: si `a.type === "ground"` (et attaque non nulle) -> l'attaque échoue, émet `{ t: "talentImmunite", talent: "LEVITATE", type: "ground" }`.
   - `WONDER_GUARD`: si l'attaque est une attaque directe avec puissance > 0 et que l'efficacité contre le type du défenseur n'est PAS super efficace (`eff <= 1`) -> l'attaque échoue, émet `{ t: "talentGardeMystik" }`.
   - `VOLT_ABSORB`: si `a.type === "electric"` -> dégâts 0, soigne `Math.floor(def.stats.pv / 4)` PV.
   - `WATER_ABSORB`: si `a.type === "water"` -> dégâts 0, soigne `Math.floor(def.stats.pv / 4)` PV.
   - `FLASH_FIRE`: si `a.type === "fire"` -> dégâts 0, active `def.volatils.flashFire = true`.
   - `SOUNDPROOF`: si l'attaque est sonore (`ROAR`, `SUPERSONIC`, `SCREECH`, `HYPER_VOICE`, `SNORE`) -> dégâts/effet 0.

3. **Calcul de Dégâts (`calculerDegats`)** :
   - `OVERGROW`, `BLAZE`, `TORRENT`, `SWARM`: si `att.pv <= Math.floor(att.stats.pv / 3)` et que `a.type` correspond au talent (`grass`, `fire`, `water`, `bug`) -> `A = Math.floor(A * 1.5)`.
   - `HUGE_POWER` / `PURE_POWER`: sur coup physique -> `A = A * 2`.
   - `GUTS`: si `att.statut` est non nul (brûlure, poison, para, sommeil) -> `A = Math.floor(A * 1.5)` (et ne PAS diviser par 2 pour la brûlure).
   - `THICK_FAT`: si le défenseur a ce talent et que `a.type === "fire"` ou `a.type === "ice"` -> `A = Math.max(1, Math.floor(A / 2))`.
   - `BATTLE_ARMOR` / `SHELL_ARMOR`: empêche `critique = true`.
   - `ROCK_HEAD`: annule les dégâts de recul subis par le lanceur.
   - `CHOICE_BAND`: si le lanceur tient cet objet et attaque physique -> `A = Math.floor(A * 1.5)`.

4. **Effets de Contact & Statuts (`apresCoup`)** :
   Si le coup a porté et a touché :
   - `STATIC`: 30% de chance de paralyser l'attaquant si sans statut (`h.entier(100) < 30`).
   - `POISON_POINT`: 30% de chance d'empoisonner l'attaquant.
   - `FLAME_BODY`: 30% de chance de brûler l'attaquant.
   - `ROUGH_SKIN`: l'attaquant perd `Math.max(1, Math.floor(att.stats.pv / 16))` PV.
   - `SYNCHRONIZE`: si le porteur reçoit un statut pendant le tour, l'adversaire le reçoit aussi.
   - Immunités strictes de statut :
     - `IMMUNITY`: guérit immédiatement de tout poison (`p.statut = null`).
     - `INSOMNIA` / `VITAL_SPIRIT`: empêche le sommeil.
     - `LIMBER`: empêche la paralysie.
     - `WATER_VEIL`: empêche la brûlure.
     - `MAGMA_ARMOR`: empêche le gel.
     - `OWN_TEMPO`: empêche la confusion (`volatils.confusion = 0`).

5. **Fin de Tour (`finDeTour`)** :
   - `SPEED_BOOST`: monte `paliers.vit` de 1 (max 6).
   - `RAIN_DISH`: si météo active est `pluie` (et non annulée par Air Lock), soigne `Math.max(1, Math.floor(p.stats.pv / 16))` PV.
   - `SHED_SKIN`: si statut actif, 1 chance sur 3 (`h.entier(3) === 0`) de guérir.
   - `LEFTOVERS` (Restes): si `p.objet` correspond à Restes, soigne 1/16 PV max.
   - `WHITE_HERB`: si un palier est négatif, le remet à 0 et consomme l'objet (`p.objet = null`).
   - `LUM_BERRY`: si statut ou confusion actif, soigne et consomme l'objet.
   - Météo :
     - Si `airLockActif(e)`, ignorer les dégâts météo de fin de tour et les multiplicateurs météo.
     - Prise en charge de la Grêle (`"grele"`) : inflige 1/16 PV max à chaque fin de tour aux créatures n'ayant pas le type `"ice"`.

### 3.4. Ordre des Fichiers (`js/poke/ordre.js`)
Ajouter `"js/poke/gen3/objets-tenus.js"` dans `GEN3` après `"js/poke/gen3/talents.js"`.

### 3.5. Tests Unitaires (`tests/test_gen3_combat_talents.mjs`)
Tester :
1. `INTIMIDATE` baisse l'Attaque adverse à l'entrée.
2. `LEVITATE` immunise contre les attaques Sol (Séisme).
3. `WONDER_GUARD` immunise contre les attaques normales/non-super efficaces, et laisse passer les super efficaces (Feu, Vol, etc.).
4. `OVERGROW` / `BLAZE` / `TORRENT` boostent à $\le 1/3$ PV.
5. `HUGE_POWER` double l'attaque.
6. `STATIC` paralyse sur contact.
7. `SPEED_BOOST` monte la vitesse en fin de tour.
8. `DRIZZLE`, `DROUGHT`, `SAND_STREAM` activent la météo.
9. `AIR_LOCK` annule les effets météo.
10. `HAIL` (Grêle) blesse les non-Glace.
11. `CHOICE_BAND`, `LEFTOVERS`, `WHITE_HERB`, `LUM_BERRY` fonctionnent fidèlement.
12. 100% de non-régression sur Gen 1 et Gen 2 (`run_all_tests.mjs` passe 44/44).
