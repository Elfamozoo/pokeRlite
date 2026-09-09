# Task 4 Brief: Sets Canoniques d'Émeraude & Moteur de l'Usine de Combat (Battle Factory)

## 1. Description & Context
Cette tâche implémente le moteur pur NOYAU de l'Usine de Combat (Battle Factory) dans `js/poke/gen3/usine.js`, ainsi que la bibliothèque des sets de prêt de compétition officiels de Pokémon Émeraude dans `js/poke/gen3/sets-usine.js`.
Elle régit l'intégralité de la boucle de jeu de l'Usine : draft des 6 prêts, sélection de 3 créatures au niveau 50, séries de 7 combats échelonnés, le Boss Meneur Noland (Samson) aux combats 21 (Symbole Argent) et 42 (Symbole Or), le système d'échange d'après-match (swap), les soins automatiques et l'attribution des PCo (Points de Combat).

## 2. Target Files
- Create: `js/poke/gen3/sets-usine.js`
- Create: `js/poke/gen3/usine.js`
- Modify: `js/poke/ordre.js`
- Modify: `tests/run_all_tests.mjs` (mettre à jour le compte attendu de fichiers dans `POKE_ORDRE_GEN3`)
- Modify: `tests/test_gen3_registry.mjs` (aligner `EXPECTED_GEN3_NOYAU`)
- Create Test: `tests/test_gen3_usine_engine.mjs`

## 3. Detailed Specifications

### 3.1. Catalogue des Sets de l'Usine (`js/poke/gen3/sets-usine.js`)
Format IIFE standard : `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);`
Déclarer `W.POKE_GEN3_SETS_USINE` avec 4 tiers de difficulté :
- **`tier1` (Séries 1-2, combats 1 à 14)** : Au moins 30 sets variés de Pokémon de base ou pré-évolués solides (ex: Pikachu, Massko, Galifeu, Flobio, Medhyèna, Nirondelle, Goélise, Kirlia, Chapignon, Galegon, Kadabra, Machopeur, Gravalanch, etc.) avec attaques cohérentes, nature, et objet tenu.
- **`tier2` (Séries 3-4, combats 15 à 28)** : Au moins 35 sets de Pokémon évolués viables (ex: Jungko, Galifeu, Ludicolo, Tengalice, Hélédelle, Bekipan, Maskadra, Ningale/Ninjask, Brouhabam, Galeking, Charmina, Élecsprint, Camérupt, Libégon, Altaria, Mangriff, Séviper, Kaorine, Armaldo, Vacilys, etc.).
- **`tier3` (Séries 5-7, combats 29 à 49, et Boss Noland Argent)** : Au moins 40 sets compétitifs majeurs (ex: Métalosse, Drattak, Laggron, Braségali, Ronflex, Staross, Ectoplasma, Voltali, Aquali, Pyroli, Alakazam, Mackogneur, Tyranocif, Cizayox, Scarhino, Leuphorie, Airmure, Milobellus, Chapignon Spore/Mitra-Poing, Dodrio, etc.).
- **`tier4` (Boss Noland Or & très hautes séries)** : Les monstres du Tier 3 + légendaires autorisés en Zone (Artikodin, Électhor, Sulfura, Suicune, Raikou, Entei, Latios, Latias, Regirock, Regice, Registeel).

Chaque set respecte la structure :
```javascript
{
  espece: 260, // Numéro national (1 à 386)
  nature: "rigide",
  objet: "LEFTOVERS",
  attaques: ["SURF", "EARTHQUAKE", "ICE_BEAM", "PROTECT"],
  repartition: "atk_pv" // "atk_vit", "sat_vit", "pv_def", "pv_sat", "equilibre"
}
```

### 3.2. Moteur de l'Usine (`js/poke/gen3/usine.js`)
Format IIFE standard NOYAU ('use strict', zéro DOM, zéro `Math.random` / `Date.now`).
Exporter `W.PokeUsine` avec les méthodes :

1. `palierPourCombat(serie, combatDansSerie, totalVictoires)` :
   - `totalVictoires < 14` -> `"tier1"`
   - `totalVictoires < 28` -> `"tier2"`
   - `totalVictoires >= 28` -> `"tier3"`
   - Si combat 42 ou série $\ge 6$ -> `"tier4"`
2. `genererMonDeSet(set, h, palier)` :
   - Instancie le Pokémon via `PokeMoteur.creer(set.espece, 50, h, { nature: set.nature, objet: set.objet, attaques: set.attaques })`.
   - Attribue les DVs et la statExp selon le palier :
     - Tier 1 : DVs = 9 sur toutes les stats, statExp = 2000 sur stats clés.
     - Tier 2 : DVs = 12 sur toutes les stats, statExp = 8000 sur stats clés.
     - Tier 3 : DVs = 15 (parfaits), statExp = 25000 sur stats clés.
     - Tier 4 / Noland : DVs = 15, statExp = 65535 (max).
   - Recalcule immédiatement les stats avec `PokeMoteur.calculerStats(mon)`.
   - Met les PV au max : `mon.pv = mon.stats.pv`.
3. `tirerPrets(graine, serie, h)` :
   - Tire 6 sets du bon palier sans doublon d'espèce (`espece`) et sans doublon d'objet (`objet`).
   - Génère les 6 instances de Pokémon complètes au niveau 50.
4. `tirerAdversaire(session, h)` :
   - Détermine si c'est un Boss :
     - Si `session.combatGlobal === 21` (fin de série 3) : Meneur Samson (Argent) !
       `{ id: "noland_argent", nom: "Meneur Samson", titre: "Savant de l'Usine", classe: "meneur", estBoss: true, symbole: "argent" }`.
       Équipe : 3 Pokémon tirés de `tier3` avec DVs max.
     - Si `session.combatGlobal === 42` (fin de série 6) : Meneur Samson (Or) !
       `{ id: "noland_or", nom: "Meneur Samson", titre: "Savant de l'Usine", classe: "meneur", estBoss: true, symbole: "or" }`.
       Équipe : 3 Pokémon tirés de `tier4` avec DVs max.
     - Sinon : Dresseur généré (Topdresseur, Gentleman, Karatéka, Pokéfan, etc.) avec nom et 3 Pokémon sans doublon d'espèce tirés du palier correspondant.
5. `creerSession(options, h)` :
   - Crée l'objet session :
     ```javascript
     {
       graine: (h && h.graine) || 123456,
       serie: 1,
       combat: 1, // 1 à 7
       combatGlobal: 1, // total combats affrontés
       victoires: 0,
       echanges: 0,
       prets: [... 6 Pokémon ...],
       equipe: [], // 3 Pokémon choisis
       adversaire: null,
       statut: "choix_initial", // "choix_initial" | "combat" | "echange" | "serie_gagnee" | "defaite"
       pcoGagnes: 0,
       symboles: { argent: false, or: false }
     }
     ```
6. `choisirEquipeInitiale(session, indices, h)` :
   - Vérifie que `indices` contient exactement 3 indices valides et distincts (0 à 5).
   - Initialise `session.equipe = [prets[i0], prets[i1], prets[i2]]`.
   - Génère le premier adversaire via `tirerAdversaire(session, h)`.
   - Passe `session.statut = "combat"`.
7. `enregistrerResultatCombat(session, joueurGagne, h)` :
   - Si `joueurGagne` :
     - `session.victoires++`
     - Si combat 21 : `session.symboles.argent = true`
     - Si combat 42 : `session.symboles.or = true`
     - Si `session.combat < 7` :
       - Passe `session.statut = "echange"`.
     - Si `session.combat === 7` :
       - Calcule PCo gagnés : `calculerGainPCo(session.serie, session.combatGlobal === 21 || session.combatGlobal === 42)`.
       - Ajoute aux `session.pcoGagnes`.
       - Passe `session.statut = "serie_gagnee"`.
   - Si défaite :
     - Passe `session.statut = "defaite"`.
8. `appliquerEchange(session, indexJoueur, indexAdverse, h)` :
   - Échange `session.equipe[indexJoueur]` avec `session.adversaire.equipe[indexAdverse]`.
   - `session.echanges++`.
   - Soigne l'équipe (`soignerEquipe(session.equipe)`).
   - Passe au combat suivant : `session.combat++`, `session.combatGlobal++`.
   - Génère le prochain adversaire via `tirerAdversaire(session, h)`.
   - Passe `session.statut = "combat"`.
9. `garderEquipe(session, h)` :
   - Ne fait aucun échange.
   - Soigne l'équipe (`soignerEquipe(session.equipe)`).
   - Passe au combat suivant : `session.combat++`, `session.combatGlobal++`.
   - Génère le prochain adversaire via `tirerAdversaire(session, h)`.
   - Passe `session.statut = "combat"`.
10. `continuerSerie(session, h)` :
    - Appelé depuis `"serie_gagnee"`.
    - `session.serie++`.
    - `session.combat = 1`.
    - `session.combatGlobal++`.
    - Soigne l'équipe.
    - Génère le prochain adversaire.
    - Passe `session.statut = "combat"`.
11. `soignerEquipe(equipe)` :
    - Pour chaque mon de l'équipe : `mon.pv = mon.stats.pv`, `mon.statut = null`, remet les PP au max, vide `mon.volatils`.
12. `calculerGainPCo(serie, estBoss)` :
    - Série 1 : 3 PCo.
    - Série 2 : 3 PCo.
    - Série 3 : 5 PCo (+15 PCo si boss argent).
    - Série 4 : 5 PCo.
    - Série 5 : 7 PCo.
    - Série 6 : 7 PCo (+30 PCo si boss or).
    - Séries 7+ : 10 PCo.

### 3.3. Ordre des Fichiers (`js/poke/ordre.js`)
Ajouter `"js/poke/gen3/sets-usine.js"` et `"js/poke/gen3/usine.js"` dans `GEN3` après `"objets-tenus.js"`.
Mettre à jour `tests/run_all_tests.mjs` (compte attendu dans `POKE_ORDRE_GEN3` passe de 17 à 19) et `tests/test_gen3_registry.mjs`.

### 3.4. Tests Unitaires (`tests/test_gen3_usine_engine.mjs`)
Tester :
1. Structure et complétude des 4 tiers de `POKE_GEN3_SETS_USINE` (moves valides, natures valides, espèces valides, objets valides).
2. `tirerPrets` génère 6 Pokémon de niveau 50 avec 6 espèces distinctes et 6 objets tenus distincts.
3. `choisirEquipeInitiale` valide 3 Pokémon et passe en statut "combat".
4. Déroulement d'une série : 7 victoires successives mènent à "serie_gagnee" avec gain de PCo.
5. Échange post-combat (`appliquerEchange`) remplace correctement le Pokémon désigné et soigne l'équipe.
6. Refus d'échange (`garderEquipe`) conserve l'équipe et avance.
7. Boss Noland apparaît au combat 21 (symbole argent) et combat 42 (symbole or).
8. Défaite passe en statut "defaite".
9. Déterminisme PRNG strict sous Mulberry32.
10. `node tests/run_all_tests.mjs` passe à 100% (44/44).
