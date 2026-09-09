# Spécification de Conception : Intégration de la Région d'Hoenn (3ᵉ Génération — Pokémon Émeraude)

**Date** : 9 Septembre 2026  
**Statut** : Validé (En attente de plan d'implémentation)  
**Version de référence** : Pokémon Version Émeraude (GBA)  
**Périmètre** : Ajout complet de la région d'Hoenn, des 135 nouvelles espèces (252 à 386), de l'itinéraire en 9 actes roguelite, des légendaires et du boss final d'épilogue.

---

## 1. Contexte & Principes Architecturaux

Le projet **Road to Legends — Mode Pokémon** est un roguelite Pokémon en pur Vanilla JS (ES5 / IIFE), sans dépendance externe, doté d'une séparation stricte :
- **NOYAU** : Simulation déterministe pure (PRNG Mulberry32 bit-à-bit invariant, tirages comptés, rejeu serveur). **Strictement 0 DOM**, 0 `Math.random()`, 0 `Date.now()`.
- **ECRANS** : Rendu DOM, événements, animations de sprites, synthèse sonore WebAudio matérielle.
- **Règle fondamentale** : « Ce qui est recopié diverge » — ordre unique dans `js/poke/ordre.js` et registre central polymorphe dans `js/poke/regles.js`.

L'intégration d'Hoenn suit fidèlement le patron modulaire créé pour Johto (`js/poke/gen2/`), sous la forme d'un dossier dédié `js/poke/gen3/` et de son pendant graphique/audio.

---

## 2. Décisions de Conception Validées

1. **Version de Référence** : **Pokémon Émeraude**
   - 8ᵉ arène tenue par Juan (Atalanopolis).
   - Marc (Wallace) en Maître de la Ligue Pokémon.
   - Pierre Rochard (Steven Stone) en boss ultime d'épilogue au Site Météore (niveau 75-78).
   - Les deux factions actives : Team Magma et Team Aqua.
   - Climax narratif : éveil de Groudon et Kyogre, résolu par le réveil de Rayquaza au sommet du Pilier Céleste.
2. **Moteur de Combat (Simplicité & Robustesse)** :
   - Maintien du modèle à 6 statistiques (`pv`, `atk`, `def`, `vit`, `sat`, `sdf`) établi en Gen 2.
   - Pas de Talents (Abilities) ni de Natures dans cette première version (v1) afin de préserver l'intégrité absolue du PRNG et du moteur de combat.
   - Les nouvelles attaques de 3G (n°252 à n°354) sont traduites vers les identifiants d'effet pris en charge par `combat.js`.
3. **Périmètre du Pokédex & Espèces** :
   - Pokédex National étendu à **386 espèces** (`dexTotalCompte: 386`).
   - Modélisation complète des 135 créatures de la 3G (Arcko n°252 à Deoxys n°386).
   - Les tables de rencontre d'Hoenn respectent fidèlement le canon d'Émeraude (avec les espèces réintroduites de 1G et 2G).
4. **Garantie d'accès à 100% des Pokémon (sur plusieurs runs)** :
   - **Trio Météo** : Rayquaza (Pilier Céleste, niv. 70), Groudon (Grotte Terra, niv. 70), Kyogre (Grotte Marine, niv. 70).
   - **Trio des Régis** : Débloqués via le nœud de la Chambre Scellée, menant à Regirock (Ruines du Désert), Regice (Grotte de l'Îlot), Registeel (Tombeau Antique).
   - **Errants (`errants`)** : Latios et Latias libérés sur les routes d'Hoenn après la Ligue, avec fuite instantanée au premier tour.
   - **Fabuleux (`mythique`)** : Jirachi (#385, niv. 30) au Centre Spatial d'Algatia ; Deoxys (#386, niv. 30) à l'Île Aurore accessible via le Diplôme d'Hoenn.
   - **Fossiles & Casino** : Fossile Griffe (Anorith) / Racine (Lilia) au Désert ; Casino de Lavandia.
5. **Pipeline de Données & Assets** :
   - Script d'outillage dédié `tools/poke-gen3-fetch.mjs` pour télécharger et formater automatiquement les données et sprites canoniques depuis PokéAPI / PokéSprite / GitHub pret.
   - Synthèse des cris des espèces 252 à 386 via WebAudio dans `js/poke/gen3/sons.js`.

---

## 3. Architecture des Composants & Modules

### 3.1 Structure des Fichiers (`js/poke/gen3/`)

```
js/poke/gen3/
  ├── types.js            // Enregistrement des 17 types pour la 3G
  ├── effets.js           // Traduction des effets d'attaque 3G vers le moteur
  ├── objets.js           // Objets canoniques d'Hoenn (Lunettes Sable, Baies 3G)
  ├── obtentions.js       // Échanges, dons, fossiles Griffe/Racine, Casino Lavandia
  ├── attaques.js         // Attaques 252 à 354 (puissance, précision, PP, type, catégorie)
  ├── especes.js          // 135 espèces (252-386) : base 6 stats, types, exp, sexe, évolutions
  ├── dresseurs.js        // Classes, dialogues et noms des dresseurs d'Hoenn
  ├── classes.js          // Classes d'Hoenn (Aromathérapeute, Guitariste, Triathlète...)
  ├── equipes.js          // Pools d'équipes de route d'Émeraude
  ├── rival.js            // Flora / Brice (selon starter choisi) et Timmy (Route Victoire)
  ├── arenes.js           // Équipes des 8 champions, Conseil 4, Marc et Pierre Rochard
  ├── monde.js            // Données brutes des zones d'Émeraude (herbe, surf, pêche)
  └── voyage.js           // Découpage des 9 actes, verrous CS, scènes, errants, sanctuaires

js/poke/gen3/ (ECRANS)
  ├── sons.js             // Définition synthétisée WebAudio des cris 252-386
  ├── sons-attaques.js    // Effets sonores de combat GBA
  └── anim-attaque.js     // Lecteur d'animations pour les attaques spécifiques 3G
```

### 3.2 Assets Visuels
- `assets/img/poke/gen3/face/<252-386>.png` (Sprites combat face)
- `assets/img/poke/gen3/dos/<252-386>.png` (Sprites combat dos)
- `assets/img/poke/art/<252-386>.webp` (Artworks officiels pour Pokédex et fiches)
- `assets/img/poke/gen3/dresseur/` (Portraits des champions, conseil 4, maîtres, rivaux)

---

## 4. Découpage Détaillé des 9 Actes d'Hoenn (`gen3/voyage.js`)

| Acte | Étape Majeure | Clé / CS obtenue | Boss / Objectif |
|---|---|---|---|
| **Acte 1** | Bourg-en-Vol → Route 101-104 → Bois Clémenti → Mérouville | **CS01 Coupe** | **Roxanne** (Badge Roche, niv. 12-15) |
| **Acte 2** | Traversée Briney → Myokara → Grotte Granite (Pierre Rochard) | **CS05 Flash** | **Brawly** (Badge Poing, niv. 16-19) |
| **Acte 3** | Poivressel → Route 110 (Duel Rival) → Lavandia (Casino) | **CS06 Éclate-Roc** | **Wattson** (Badge Dynamo, niv. 20-24) |
| **Acte 4** | Désert Rte 111 (Fossile) → Mont Chimère (Teams) → Vermilava | **Lunettes Sable** | **Flannery** (Badge Chaleur, niv. 24-29) |
| **Acte 5** | Sentier Sinuroc → Clémenti-Ville | **CS03 Surf** | **Norman** (Badge Balancier, niv. 27-31) |
| **Acte 6** | Route 118 (Surf) → Centre Météo (Morphéo) → Cimetronelle | **CS02 Vol** | **Winona** (Badge Plume, niv. 29-33) |
| **Acte 7** | Mont Mémoria → Repaire Team Nénucrique → Algatia | **CS08 Plongée** | **Tito & Tato** (Badge Esprit, niv. 41-42) |
| **Acte 8** | Caverne Fondmer → Tempête Atalanopolis → Pilier Céleste (Rayquaza) | **CS07 Cascade** | **Juan** (Badge Pluie, niv. 41-46) |
| **Acte 9** | Cascade Éternara → Route Victoire (Timmy) → Ligue Pokémon | — | **Conseil 4** + **Maître Marc** (niv. 53-58) |
| **Épilogue** | Salle secrète du Site Météore | — | **Pierre Rochard** (niv. 75-78) |

---

## 5. Intégration Registre & Interfaces

### 5.1 Registre Central (`PokeRegles`)
Entrée `JEUX.gen3` :
- `dexTotal: 386`
- `canon: [252, 255, 258]` (Arcko, Poussifeu, Gobou)
- `professeur: { fr: "Seko", en: "Birch" }`
- `versions: ["emeraude"]`
- `speAtk: "sat"`, `speDef: "sdf"`
- `badgesStat: { 1: "atk", 3: "vit", 5: "def", 7: "spe" }`
- `maitre: function() { return W.POKE_GEN3_MAITRE; }`
- `dresseurFinal: function() { return W.POKE_GEN3_STEVEN; }`
- `errants: function() { return W.POKE_GEN3_ERRANTS; }`
- `mythique: function() { return { n: 385, niveau: 30, lieu: "centre-spatial" }; }`

### 5.2 Chargeur Unique (`ordre.js`)
- Tableau `GEN3` injecté dans `NOYAU` avant `regles.js` lorsque `HOENN === "ouvert"`.
- Tableau `GEN3_ECRANS` injecté dans `ECRANS`.

### 5.3 Interface Utilisateur (`ui.js`)
- `MONDES_DITS.gen3` configuré avec libellés et badges d'Hoenn.
- Écran de démarrage (`ecranMonde`) dynamique affichant les 3 régions.
- Pokédex global (`pokedex-ui.js`) s'adaptant à 386 créatures.

---

## 6. Stratégie de Vérification & Tests Automatisés

1. **Non-régression bit-à-bit Kanto & Johto** : Exécution de `tests/run_all_tests.mjs` et des simulations de 200 combats pour vérifier que les tirages et résultats de 1G et 2G restent strictement identiques.
2. **Évaluation Headless du NOYAU** : Le module `gen3/` doit s'évaluer en Node.js pur sans DOM ni variable `window`.
3. **Zéro fuite non-déterministe** : Analyse statique prouvant 0 appel à `Math.random()` ou `Date.now()` dans `js/poke/gen3/`.
4. **Validation de complétude des données** :
   - 135 espèces valides avec leurs 6 statistiques et attaques.
   - Les 9 actes joignables avec victoire de ligue et accès à Pierre Rochard.
   - Tous les légendaires (Rayquaza, Groudon, Kyogre, Régis, Latios/Latias, Jirachi, Deoxys) présents sur des nœuds atteignables.
