# Task 5 Brief: Interface Utilisateur de l'Usine, Écrans de Draft/Swap, Boss Noland & Boutique PCo

## 1. Description & Context
Cette tâche conçoit et intègre l'interface utilisateur complète de l'Usine de Combat dans `js/poke/ui-usine.js`.
Elle connecte le moteur de jeu `W.PokeUsine` aux écrans visuels :
1. **Hall d'accueil de l'Usine** : statistiques, record, PCo, symboles Argent et Or, boutons d'action.
2. **Écran de Draft initial** : affichage des 6 cartes de prêt au niveau 50 (avec sprites, stats, types, nature, talent, objet et attaques), sélection interactive de 3 créatures.
3. **Orchestration de Combat** : intégration du combat tour par tour à 3 contre 3 avec le moteur standard, détection de victoire/défaite.
4. **Écran d'Échange d'Après-Match (Swap)** : comparaison équipe joueur vs équipe vaincue, choix d'échanger ou de passer, soins de l'équipe.
5. **Écrans de Fin de Série & Défaite** : célébration de série, remise cinématique du Symbole du Savoir par Noland au combat 21 et 42, attribution des PCo, mise à jour du record.
6. **Boutique de PCo (Points de Combat)** : consultation du solde, achat d'objets de combat rares, vitamines et pierres d'évolution.
7. **Bouton d'accueil & Navigation** : ajout du bouton "Zone de Combat" sur l'accueil (`ui.js`).

## 2. Target Files
- Create: `js/poke/ui-usine.js`
- Modify: `js/poke/ui.js`
- Modify: `js/poke/progression.js` (pour persister `pco`, `usineRecord`, `symbolesUsine`, et la session active d'Usine)
- Modify: `js/poke/ordre.js` (enregistrer `js/poke/ui-usine.js` dans `GEN3_ECRANS`)
- Create Test: `tests/test_gen3_usine_ui.mjs`

## 3. Detailed Specifications

### 3.1. Persistance Usine dans `js/poke/progression.js`
Ajouter les méthodes de lecture/écriture pour la session d'Usine et les statistiques persistantes :
- `usineLire()` : renvoie l'état Usine sauvegardé `{ pco: 0, record: 0, symboles: { argent: false, or: false }, session: null }`.
- `usineEcrire(data)` : persiste l'état Usine dans le compte joueur (`localStorage` ou structure mémoire).
- `ajouterPCo(n)` : crédite `n` PCo au joueur.
- `depenserPCo(n)` : débite `n` PCo si le solde est suffisant (renvoie `true` si succès, `false` sinon).
- `enregistrerRecordUsine(victoires)` : met à jour le record si `victoires > record`.
- `debloquerSymboleUsine(type)` : `"argent"` ou `"or"`.

### 3.2. Interface `W.PokeUIUsine` (`js/poke/ui-usine.js`)
Format IIFE standard : `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);`
Exposer `W.PokeUIUsine` avec :

1. `ouvrirHall(options)` :
   - Affiche le titre « Usine de Combat » / « Battle Factory », le Savant de l'Usine Noland.
   - Panneau de statistiques : Record de victoires consécutives, PCo disponibles, médaillons pour les Symboles du Savoir (Argent et Or).
   - Bouton « Nouveau défi » (ou « Reprendre la série » si une session est en cours).
   - Bouton « Boutique PCo ».
   - Bouton « Retour à l'accueil ».

2. `ouvrirDraft(session, options)` :
   - Présente les 6 cartes de Pokémon de prêt générées par `PokeUsine.tirerPrets`.
   - Carte de Pokémon riche :
     - Image sprite face (`assets/img/poke/...` ou `assets/img/poke/gen3/...`).
     - Nom de l'espèce, Niveau 50, badges de types (couleurs de type).
     - Nature (ex: "Rigide (+Attaque, -Att. Spé)").
     - Talent (Nom + description courte).
     - Objet tenu (Nom + icône + description courte).
     - Liste des 4 capacités (Nom, type, puissance, précision).
   - Interaction : clic pour sélectionner / désélectionner (exactement 3 sélections autorisées avec indicateur `Sélectionnés : X / 3`).
   - Bouton « Confirmer l'équipe » (actif seulement quand 3 sont sélectionnés).
   - Clic sur Confirmer : appelle `PokeUsine.choisirEquipeInitiale(session, indices, h)` et lance le premier combat.

3. `lancerCombat(session, options)` :
   - Prépare le match contre `session.adversaire`.
   - Si Boss Noland : message spécial d'apparition du Savant de l'Usine.
   - Résout le combat tour par tour en utilisant `PokeCombat` / `ui-combat` avec les 3 Pokémon du joueur et les 3 Pokémon adverses.
   - En fin de match :
     - Victoire :
       - Si `session.combat < 7` : ouvre `ouvrirEchange(session, options)`.
       - Si `session.combat === 7` : ouvre `ouvrirVictoireSerie(session, options)`.
     - Défaite : ouvre `ouvrirDefaite(session, options)`.

4. `ouvrirEchange(session, options)` :
   - Écran présentant côte à côte :
     - Colonne gauche : « Votre équipe » (3 Pokémon avec leurs fiches).
     - Colonne droite : « Équipe vaincue » (3 Pokémon avec leurs fiches).
   - Le joueur peut choisir 1 Pokémon de son camp et 1 Pokémon du camp adverse pour procéder à l'échange.
   - Bouton « Confirmer l'échange » (actif si 1 de chaque côté est sélectionné).
   - Bouton « Garder mon équipe (pas d'échange) ».
   - Dans les deux cas : soigne l'équipe et lance le combat suivant.

5. `ouvrirVictoireSerie(session, options)` :
   - Écran de célébration : annonce « Série de 7 victoires complétée ! ».
   - Si combat 21 ou 42 : cérémonie d'attribution du Symbole du Savoir (Argent ou Or) remis par Noland avec dialogue officiel.
   - Attribution des PCo gagnés (crédités sur le compte).
   - Bouton « Continuer pour la Série suivante » (appelle `PokeUsine.continuerSerie` et lance le combat 1 de la série suivante).
   - Bouton « Enregistrer et Quitter » (sauvegarde la session et retourne au Hall).

6. `ouvrirDefaite(session, options)` :
   - Écran de fin de série : annonce de la défaite.
   - Récapitulatif : nombre de victoires de la série, PCo totaux accumulés, mise à jour du record.
   - Effacement de la session active.
   - Bouton « Retour au Hall ».

7. `ouvrirBoutiquePCo(options)` :
   - Affiche le solde de PCo du joueur.
   - Liste des articles achetables :
     - **Objets de combat** :
       - Restes : 48 PCo
       - Bandeau Choix : 64 PCo
       - Lentille Scope : 48 PCo
       - Vive Griffe : 24 PCo
       - Herbe Blanche : 32 PCo
     - **Vitamines & Préparation (1 PCo)** :
       - Zinc, Calcium, Protéine, Fer, Carbos, PV Plus, Super Bonbon
     - **Pierres d'évolution (8 PCo)** :
       - Pierre Eau, Feu, Foudre, Plante, Lune, Soleil
   - Bouton d'achat par article (désactivé si PCo insuffisants).
   - Au clic : déduit les PCo, ajoute l'objet dans le sac du joueur (`PokeProgression`), et met à jour l'affichage en direct.
   - Bouton « Retour au Hall ».

### 3.3. Intégration dans `ui.js`
- Sur l'écran d'accueil (`accueil()`) :
  - Dans la rangée d'actions de jeu (`pkdx-actions est-pied`), ajouter à côté de `pk-defi` :
    ```html
    <button type="button" class="pkdx-touche" id="pk-usine">Zone de Combat</button>
    ```
  - Clic sur `#pk-usine` : joue le son `PRESS_AB` et appelle `PokeUIUsine.ouvrirHall({ retour: accueil })`.
- Ajouter les traductions nécessaires dans le dictionnaire de langues :
  - `usineTitre`: "Zone de Combat" (en: "Battle Frontier")
  - `usineHall`: "Usine de Combat" (en: "Battle Factory")
  - `usinePrets`: "Sélectionnez 3 Pokémon de prêt" (en: "Select 3 Rental Pokémon")
  - `usineEchange`: "Échange de Pokémon" (en: "Swap Pokémon")
  - `usineBoutique`: "Boutique PCo" (en: "Battle Shop")
  - `usinePco`: "PCo" (en: "BP")

### 3.4. Ordre des Fichiers (`js/poke/ordre.js`)
Ajouter `"js/poke/ui-usine.js"` dans `GEN3_ECRANS` après `"js/poke/gen3/sons.js"`.
Mettre à jour le compte attendu de `POKE_ORDRE_GEN3_ECRANS` dans `tests/run_all_tests.mjs` (de 1 à 2).

### 3.5. Tests Unitaires (`tests/test_gen3_usine_ui.mjs`)
Tester :
1. `ui-usine.js` s'évalue proprement et exporte `W.PokeUIUsine`.
2. `ouvrirHall` produit le HTML attendu (titre, record, PCo, symboles).
3. `ouvrirDraft` génère les 6 cartes avec toutes les données requises (sprite, nature, talent, objet, attaques).
4. `ouvrirEchange` génère les deux colonnes (équipe actuelle vs équipe vaincue).
5. `ouvrirBoutiquePCo` liste tous les articles et gère correctement le solde de PCo.
6. `ordre.js` intègre `ui-usine.js` dans `GEN3_ECRANS`.
7. `node tests/run_all_tests.mjs` passe à 100% (44/44).
