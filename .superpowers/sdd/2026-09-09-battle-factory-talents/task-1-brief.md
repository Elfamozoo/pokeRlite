# Task 1 Brief: Les 25 Natures Canoniques Gen 3 & Calcul de Statistiques

## 1. Description & Context
Cette tâche met en place le système des 25 natures canoniques de la 3e génération. Chaque nature applique $+10\%$ sur une statistique et $-10\%$ sur une autre (5 natures sont neutres).
Ce système enrichit le calcul des statistiques dans `moteur.js:calculerStats`, tout en garantissant une invariance absolue (0 impact, 0 tirage PRNG supplémentaire) pour la Gen 1 et la Gen 2.

## 2. Target Files
- Create: `js/poke/gen3/natures.js`
- Modify: `js/poke/moteur.js`
- Modify: `js/poke/ordre.js`
- Create Test: `tests/test_gen3_natures.mjs`

## 3. Detailed Specifications

### 3.1. Dictionnaire des Natures (`js/poke/gen3/natures.js`)
Format IIFE standard : `(function (W) { "use strict"; ... })(this);`
Déclarer `W.POKE_GEN3_NATURES` :
```javascript
var NATURES = {
  hardi:   { id: "hardi",   nom: { fr: "Hardi",   en: "Hardy" },   plus: null,  moins: null },
  docile:  { id: "docile",  nom: { fr: "Docile",  en: "Docile" },  plus: null,  moins: null },
  pudique: { id: "pudique", nom: { fr: "Pudique", en: "Bashful" }, plus: null,  moins: null },
  bizarre: { id: "bizarre", nom: { fr: "Bizarre", en: "Quirky" },  plus: null,  moins: null },
  serieux: { id: "serieux", nom: { fr: "Sérieux", en: "Serious" }, plus: null,  moins: null },

  rigide:  { id: "rigide",  nom: { fr: "Rigide",  en: "Adamant" }, plus: "atk", moins: "sat" },
  brave:   { id: "brave",   nom: { fr: "Brave",   en: "Brave" },   plus: "atk", moins: "vit" },
  mauvais: { id: "mauvais", nom: { fr: "Mauvais", en: "Naughty" }, plus: "atk", moins: "sdf" },
  solo:    { id: "solo",    nom: { fr: "Solo",    en: "Lonely" },  plus: "atk", moins: "def" },

  assure:  { id: "assure",  nom: { fr: "Assuré",  en: "Bold" },    plus: "def", moins: "atk" },
  relax:   { id: "relax",   nom: { fr: "Relax",   en: "Relaxed" }, plus: "def", moins: "vit" },
  malin:   { id: "malin",   nom: { fr: "Malin",   en: "Impish" },  plus: "def", moins: "sat" },
  lache:   { id: "lache",   nom: { fr: "Lâche",   en: "Lax" },     plus: "def", moins: "sdf" },

  modeste: { id: "modeste", nom: { fr: "Modeste", en: "Modest" },  plus: "sat", moins: "atk" },
  doux:    { id: "doux",    nom: { fr: "Doux",    en: "Mild" },    plus: "sat", moins: "def" },
  discret: { id: "discret", nom: { fr: "Discret", en: "Quiet" },   plus: "sat", moins: "vit" },
  foufou:  { id: "foufou",  nom: { fr: "Foufou",  en: "Rash" },    plus: "sat", moins: "sdf" },

  calme:   { id: "calme",   nom: { fr: "Calme",   en: "Calm" },    plus: "sdf", moins: "atk" },
  gentil:  { id: "gentil",  nom: { fr: "Gentil",  en: "Gentle" },  plus: "sdf", moins: "def" },
  malpoli: { id: "malpoli", nom: { fr: "Malpoli", en: "Sassy" },   plus: "sdf", moins: "vit" },
  prudent: { id: "prudent", nom: { fr: "Prudent", en: "Careful" }, plus: "sdf", moins: "sat" },

  timide:  { id: "timide",  nom: { fr: "Timide",  en: "Timid" },   plus: "vit", moins: "atk" },
  presse:  { id: "presse",  nom: { fr: "Pressé",  en: "Hasty" },   plus: "vit", moins: "def" },
  jovial:  { id: "jovial",  nom: { fr: "Jovial",  en: "Jolly" },   plus: "vit", moins: "sat" },
  naif:    { id: "naif",    nom: { fr: "Naïf",    en: "Naive" },   plus: "vit", moins: "sdf" }
};
```
Exporter aussi l'objet helper `W.PokeNatures` :
- `table()`: renvoie `NATURES`.
- `cles()` ou `liste()`: renvoie la liste des 25 identifiants.
- `nom(cle, lang)`: renvoie le nom traduit (fr par défaut).
- `de(p)`: renvoie `p && p.nature ? p.nature : null`.
- `tirer(h)`: si `h && h.choisir`, choisit une nature parmi `liste()`.

### 3.2. Intégration Moteur (`js/poke/moteur.js`)
1. Dans `calculerStats(p)` :
   À la fin du calcul des statistiques `s` (qui contient `pv`, `atk`, `def`, `vit`, et les deux spéciales `sa` et `sd`) :
   ```javascript
   if (p.nature && W.POKE_GEN3_NATURES && W.POKE_GEN3_NATURES[p.nature]) {
     var nMod = W.POKE_GEN3_NATURES[p.nature];
     if (nMod.plus && s[nMod.plus]) s[nMod.plus] = Math.floor(s[nMod.plus] * 1.1);
     if (nMod.moins && s[nMod.moins]) s[nMod.moins] = Math.floor(s[nMod.moins] * 0.9);
   }
   ```
2. Dans `creer(o, h)` :
   Assurer la propagation de `nature` :
   ```javascript
   nature: o.nature !== undefined ? o.nature : (o.genererNature && h && W.PokeNatures ? W.PokeNatures.tirer(h) : undefined),
   ```
   ⚠️ CRITIQUE : Ne PAS tirer de nature par défaut si `o.nature` n'est pas demandé, afin de ne consommer aucun tirage PRNG dans les sessions Gen 1 et Gen 2 existantes !

### 3.3. Ordre des Fichiers (`js/poke/ordre.js`)
Ajouter `"js/poke/gen3/natures.js"` dans `GEN3` juste après `"js/poke/gen3/especes.js"`.

### 3.4. Tests Unitaires (`tests/test_gen3_natures.mjs`)
Tester :
1. Les 25 natures sont présentes et leurs modificateurs exacts.
2. Les 5 neutres ont `plus: null, moins: null`.
3. Pour un Pokémon avec `nature: "rigide"`, Attaque est augmentée de 10% et Attaque Spéciale diminuée de 10% par rapport à une nature neutre.
4. Pour un Pokémon avec `nature: "timide"`, Vitesse est augmentée de 10% et Attaque diminuée de 10%.
5. Les PV ne sont jamais modifiés par la nature.
6. Sans `p.nature`, les stats sont bit-identiques à l'existant.
7. `ordre.js` inclut bien `natures.js` et s'exécute sans erreur.

## 4. Contraintes Globales
- Zero DOM access, zero non-deterministic calls (`Math.random()`, `Date.now()`).
- Strict mode `'use strict'`.
- `node tests/run_all_tests.mjs` doit passer à 100% (44/44).
