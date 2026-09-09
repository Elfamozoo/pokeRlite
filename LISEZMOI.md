# Road to Legends — Mode Pokémon (miroir local)

Mirror de la partie Pokémon de https://roadtolegends.com/pokemon
Scrapé le 25/08/2026 — version `v=773` (gate.js).

## ⚠️ À savoir

- Ce mode a été **ouvert en « discret » par le propriétaire du site le 16/08/2026**
  (verrou `OUVERT = true` dans `js/poke/gate.js`). Il reste volontairement
  **non indexé** (`noindex`) : le proprio ne veut pas qu'il soit trouvable
  par un moteur de recherche. Usage personnel uniquement, ne pas republier.
- Les données du jeu sont générées depuis des sources publiques :
  `pret/pokered` (désassemblage des ROMs Pokémon Rouge/Bleu/Or/Argent),
  PokéAPI, Poképédia. Le moteur et l'interface (JS/CSS) sont l'œuvre du
  propriétaire du site.
- Le classement/DUEL/CONNEXION dépendent de l'API du site (`api/server.mjs`)
  : ces fonctions ne marcheront pas en local. Le jeu solo (COMMENCER),
  le Pokédex, la carte, les combats et le son (synthétisé WebAudio, pas de
  fichiers audio) fonctionnent hors ligne.

## Lancer le jeu

```bash
cd rtl-pokemon && python3 -m http.server 8000
# puis ouvrir http://localhost:8000/
```

(Ou ouvrir directement index.html dans un navigateur.)

## Contenu

| Chemin | Contenu |
|---|---|
| `index.html` | Page du mode (pokemon.html d'origine) |
| `css/poke.css` | Styles du mode (410 Ko) |
| `js/poke/*.js` (68 fichiers) | Moteur, données, interface |
| `assets/img/poke/face/1-151.png` | Sprites de face Gen1 (1996) |
| `assets/img/poke/dos/1-151.png` | Sprites de dos Gen1 |
| `assets/img/poke/gen2/face/152-251.png` | Sprites de face Gen2 (1999) |
| `assets/img/poke/gen2/dos/152-251.png` | Sprites de dos Gen2 |
| `assets/img/poke/art/1-251.webp` | Artworks (Pokédex, écrans) |
| `assets/img/poke/dresseur/*.png` | Portraits (champions, conseil 4, rival, classes) |
| `assets/img/poke/gen2/dresseur/arene1-8 + conseil1-4.png` | Portraits Johto |
| `assets/img/poke/anim/move_anim_0-1.png` | Tilesheets d'animations Gen1 |
| `assets/img/poke/anim/gen2/*.png` (31 planches) | Tilesheets d'animations Gen2 |

Données incluses dans le JS : 251 espèces (stats, types, évolutions, CT,
apprentissages, Pokédex FR/EN), attaques, objets, lieux de Kanto et Johto,
8 arènes + Conseil 4 par monde, dresseurs de route, équipes exactes des ROMs.

## Structure JS (ordre de chargement)

`gate.js` → `ordre.js` (liste des 66 fichiers) → noyau (rng, types, regles,
attaques, especes, monde, dresseurs…) → moteur (moteur, combat, capture,
voyage) → interface (ui, ui-combat, pokedex-ui…).

Le dossier `gen2/` contient la 2e génération (Johto, 152-251, types
ténèbres/acier, objets tenus, météo…).

Fichiers générés (ne pas éditer à la main, voir en-têtes) :
`especes.js`, `gen2/especes.js`, `monde.js`, `dresseurs.js`, `classes.js`,
`sons.js`, `attaques.js`, `gen2/animations.js`, etc.
