# Task 2 Brief: Base de Données des Talents (Abilities) pour 100 % des Espèces

## 1. Description & Context
Cette tâche introduit la base de données exhaustive des talents (abilities) de la 3e génération (les 76 talents officiels de Gen 3) dans `js/poke/gen3/talents.js`, et associe à chaque espèce de Pokémon (1 à 386) son talent canonique.
Elle fournit également le helper `W.PokeTalents` pour consulter les noms, descriptions et talents des Pokémon.

## 2. Target Files
- Create: `js/poke/gen3/talents.js`
- Modify: `js/poke/gen3/especes.js` (enrichir les 135 Pokémon d'Hoenn avec `talent`)
- Modify: `js/poke/especes.js` (enrichir les espèces 1-251 avec leur talent canonique Gen 3)
- Modify: `js/poke/moteur.js` (dans `creer(n, niveau, h, options)` : propager `talent: o.talent || e.talent || (e.talents && e.talents[0]) || null`)
- Modify: `js/poke/ordre.js` (enregistrer `js/poke/gen3/talents.js` dans `GEN3`)
- Create Test: `tests/test_gen3_talents_data.mjs`

## 3. Detailed Specifications

### 3.1. Dictionnaire des 76 Talents (`js/poke/gen3/talents.js`)
Format IIFE standard : `(function (W) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis);`
Déclarer `W.POKE_GEN3_TALENTS` avec les 76 talents de Gen 3 :
1. `STENCH`: { nom: { fr: "Puanteur", en: "Stench" }, desc: { fr: "Éloigne les Pokémon sauvages.", en: "Helps repel wild Pokémon." } }
2. `DRIZZLE`: { nom: { fr: "Crachin", en: "Drizzle" }, desc: { fr: "Invoque la pluie en entrant en combat.", en: "Summons rain in battle." } }
3. `SPEED_BOOST`: { nom: { fr: "Turbo", en: "Speed Boost" }, desc: { fr: "Augmente la Vitesse à chaque tour.", en: "Gradually boosts Speed." } }
4. `BATTLE_ARMOR`: { nom: { fr: "Armurbaston", en: "Battle Armor" }, desc: { fr: "Empêche l'ennemi de porter des coups critiques.", en: "Blocks critical hits." } }
5. `STURDY`: { nom: { fr: "Fermeté", en: "Sturdy" }, desc: { fr: "Protège contre les attaques de K.O. en un coup.", en: "Negates 1-hit KO attacks." } }
6. `DAMP`: { nom: { fr: "Moiteur", en: "Damp" }, desc: { fr: "Empêche l'utilisation de Destruction et Explosion.", en: "Prevents combatants from self-destructing." } }
7. `LIMBER`: { nom: { fr: "Échauffement", en: "Limber" }, desc: { fr: "Immunise le Pokémon contre la paralysie.", en: "Prevents paralysis." } }
8. `SAND_VEIL`: { nom: { fr: "Voile Sable", en: "Sand Veil" }, desc: { fr: "Augmente l'esquive sous la tempête de sable.", en: "Ups evasion in a sandstorm." } }
9. `STATIC`: { nom: { fr: "Statik", en: "Static" }, desc: { fr: "Peut paralyser au contact.", en: "Paralyzes on contact." } }
10. `VOLT_ABSORB`: { nom: { fr: "Absorb Volt", en: "Volt Absorb" }, desc: { fr: "Rend des PV si touché par une attaque Électrik.", en: "Turns electricity into HP." } }
11. `WATER_ABSORB`: { nom: { fr: "Absorb Eau", en: "Water Absorb" }, desc: { fr: "Rend des PV si touché par une attaque Eau.", en: "Turns water into HP." } }
12. `OBLIVIOUS`: { nom: { fr: "Benêt", en: "Oblivious" }, desc: { fr: "Immunise le Pokémon contre l'attraction.", en: "Prevents attraction." } }
13. `CLOUD_NINE`: { nom: { fr: "Ciel Gris", en: "Cloud Nine" }, desc: { fr: "Neutralise les effets de la météo.", en: "Negates weather effects." } }
14. `COMPOUND_EYES`: { nom: { fr: "Œil Composé", en: "Compound Eyes" }, desc: { fr: "Augmente la précision des attaques.", en: "Raises accuracy." } }
15. `INSOMNIA`: { nom: { fr: "Insomnie", en: "Insomnia" }, desc: { fr: "Empêche le Pokémon de s'endormir.", en: "Prevents sleep." } }
16. `COLOR_CHANGE`: { nom: { fr: "Déguisement", en: "Color Change" }, desc: { fr: "Prend le type de l'attaque ennemie reçue.", en: "Changes type to foe's move." } }
17. `IMMUNITY`: { nom: { fr: "Vaccin", en: "Immunity" }, desc: { fr: "Immunise le Pokémon contre l'empoisonnement.", en: "Prevents poisoning." } }
18. `FLASH_FIRE`: { nom: { fr: "Torche", en: "Flash Fire" }, desc: { fr: "Immunise au Feu et renforce ses attaques Feu.", en: "Powers up if hit by fire." } }
19. `SHIELD_DUST`: { nom: { fr: "Écran Poudre", en: "Shield Dust" }, desc: { fr: "Bloque les effets secondaires des attaques adverses.", en: "Prevents added effects." } }
20. `OWN_TEMPO`: { nom: { fr: "Tempo Perso", en: "Own Tempo" }, desc: { fr: "Empêche le Pokémon d'être confus.", en: "Prevents confusion." } }
21. `SUCTION_CUPS`: { nom: { fr: "Ventouse", en: "Suction Cups" }, desc: { fr: "Empêche d'être forcé à quitter le combat.", en: "Firmly anchors the body." } }
22. `INTIMIDATE`: { nom: { fr: "Intimidation", en: "Intimidate" }, desc: { fr: "Baisse l'Attaque ennemie à l'entrée.", en: "Lowers the foe's Attack." } }
23. `SHADOW_TAG`: { nom: { fr: "Marque Ombre", en: "Shadow Tag" }, desc: { fr: "Empêche le Pokémon ennemi de fuir.", en: "Prevents the foe's escape." } }
24. `ROUGH_SKIN`: { nom: { fr: "Peau Dure", en: "Rough Skin" }, desc: { fr: "Blesse l'ennemi en cas de contact.", en: "Hurts on contact." } }
25. `WONDER_GUARD`: { nom: { fr: "Garde Mystik", en: "Wonder Guard" }, desc: { fr: "Seules les attaques super efficaces blessent.", en: "Only super-effective hits harm." } }
26. `LEVITATE`: { nom: { fr: "Lévitation", en: "Levitate" }, desc: { fr: "Immunise contre les attaques de type Sol.", en: "Not hit by Ground attacks." } }
27. `EFFECT_SPORE`: { nom: { fr: "Pose Spore", en: "Effect Spore" }, desc: { fr: "Peut paralyser, empoisonner ou endormir au contact.", en: "Leaves spores on contact." } }
28. `SYNCHRONIZE`: { nom: { fr: "Synchro", en: "Synchronize" }, desc: { fr: "Transmet le poison, la paralysie ou la brûlure.", en: "Passes on status problems." } }
29. `CLEAR_BODY`: { nom: { fr: "Corps Sain", en: "Clear Body" }, desc: { fr: "Empêche la réduction des statistiques.", en: "Prevents ability reduction." } }
30. `NATURAL_CURE`: { nom: { fr: "Médic Nature", en: "Natural Cure" }, desc: { fr: "Soigne les statuts en quittant le combat.", en: "Heals upon switching out." } }
31. `LIGHTNING_ROD`: { nom: { fr: "Paratonnerre", en: "Lightning Rod" }, desc: { fr: "Attire les attaques Électrik.", en: "Draws electrical moves." } }
32. `SERENE_GRACE`: { nom: { fr: "Sérénité", en: "Serene Grace" }, desc: { fr: "Double les chances des effets secondaires.", en: "Promotes added effects." } }
33. `SWIFT_SWIM`: { nom: { fr: "Glissade", en: "Swift Swim" }, desc: { fr: "Double la Vitesse sous la pluie.", en: "Raises Speed in rain." } }
34. `CHLOROPHYLL`: { nom: { fr: "Chlorophylle", en: "Chlorophyll" }, desc: { fr: "Double la Vitesse sous le soleil.", en: "Raises Speed in sunshine." } }
35. `ILLUMINATE`: { nom: { fr: "Lumiattirance", en: "Illuminate" }, desc: { fr: "Attire les Pokémon sauvages.", en: "Encounter rate increases." } }
36. `TRACE`: { nom: { fr: "Calque", en: "Trace" }, desc: { fr: "Imite le talent de l'adversaire à l'entrée.", en: "Copies special ability." } }
37. `HUGE_POWER`: { nom: { fr: "Coloforce", en: "Huge Power" }, desc: { fr: "Double l'Attaque du Pokémon.", en: "Raises Attack." } }
38. `POISON_POINT`: { nom: { fr: "Point Poison", en: "Poison Point" }, desc: { fr: "Peut empoisonner au contact.", en: "Poisons foe on contact." } }
39. `INNER_FOCUS`: { nom: { fr: "Attention", en: "Inner Focus" }, desc: { fr: "Empêche le Pokémon d'avoir peur.", en: "Prevents flinching." } }
40. `MAGMA_ARMOR`: { nom: { fr: "Armumagma", en: "Magma Armor" }, desc: { fr: "Immunise le Pokémon contre le gel.", en: "Prevents freezing." } }
41. `WATER_VEIL`: { nom: { fr: "Ignifu-Voile", en: "Water Veil" }, desc: { fr: "Immunise le Pokémon contre les brûlures.", en: "Prevents burns." } }
42. `MAGNET_PULL`: { nom: { fr: "Magnépiège", en: "Magnet Pull" }, desc: { fr: "Empêche les Pokémon Acier de fuir.", en: "Traps Steel-type Pokémon." } }
43. `SOUNDPROOF`: { nom: { fr: "Anti-Bruit", en: "Soundproof" }, desc: { fr: "Immunise contre les attaques sonores.", en: "Avoids sound-based moves." } }
44. `RAIN_DISH`: { nom: { fr: "Cuvette", en: "Rain Dish" }, desc: { fr: "Régénère des PV sous la pluie.", en: "Slight HP recovery in rain." } }
45. `SAND_STREAM`: { nom: { fr: "Sable Volant", en: "Sand Stream" }, desc: { fr: "Invoque une tempête de sable en entrant en combat.", en: "Summons a sandstorm." } }
46. `PRESSURE`: { nom: { fr: "Pression", en: "Pressure" }, desc: { fr: "Force l'ennemi à dépenser 2 PP par coup.", en: "Raises foe's PP usage." } }
47. `THICK_FAT`: { nom: { fr: "Isograisse", en: "Thick Fat" }, desc: { fr: "Divise par 2 les dégâts Feu et Glace reçus.", en: "Heat-and-cold protection." } }
48. `EARLY_BIRD`: { nom: { fr: "Matinal", en: "Early Bird" }, desc: { fr: "Le Pokémon se réveille deux fois plus vite.", en: "Awakens quickly from sleep." } }
49. `FLAME_BODY`: { nom: { fr: "Corps Ardent", en: "Flame Body" }, desc: { fr: "Peut brûler au contact.", en: "Burns the foe on contact." } }
50. `RUN_AWAY`: { nom: { fr: "Fuite", en: "Run Away" }, desc: { fr: "Permet de fuir n'importe quel combat sauvage.", en: "Makes escaping easier." } }
51. `KEEN_EYE`: { nom: { fr: "Regard Vif", en: "Keen Eye" }, desc: { fr: "Empêche la précision de baisser.", en: "Prevents loss of accuracy." } }
52. `HYPER_CUTTER`: { nom: { fr: "Hyper Cutter", en: "Hyper Cutter" }, desc: { fr: "Empêche l'Attaque de baisser.", en: "Prevents Attack reduction." } }
53. `PICKUP`: { nom: { fr: "Ramassage", en: "Pickup" }, desc: { fr: "Permet parfois de trouver des objets après un combat.", en: "May pick up items." } }
54. `TRUANT`: { nom: { fr: "Absentéisme", en: "Truant" }, desc: { fr: "Le Pokémon n'agit qu'un tour sur deux.", en: "Moves only every two turns." } }
55. `HUSTLE`: { nom: { fr: "Agitation", en: "Hustle" }, desc: { fr: "Augmente l'Attaque mais réduit la précision.", en: "Powers up moves, but unaligned." } }
56. `CUTE_CHARM`: { nom: { fr: "Joli Sourire", en: "Cute Charm" }, desc: { fr: "Peut rendre amoureux au contact.", en: "Infatuates on contact." } }
57. `PLUS`: { nom: { fr: "Plus", en: "Plus" }, desc: { fr: "Améliore l'Attaque Spéciale si un allié a Minus.", en: "Powers up with Minus." } }
58. `MINUS`: { nom: { fr: "Minus", en: "Minus" }, desc: { fr: "Améliore l'Attaque Spéciale si un allié a Plus.", en: "Powers up with Plus." } }
59. `FORECAST`: { nom: { fr: "Météo", en: "Forecast" }, desc: { fr: "Change la forme et le type selon le climat.", en: "Changes with the weather." } }
60. `STICKY_HOLD`: { nom: { fr: "Glue", en: "Sticky Hold" }, desc: { fr: "Empêche le vol de l'objet tenu.", en: "Prevents item theft." } }
61. `SHED_SKIN`: { nom: { fr: "Mue", en: "Shed Skin" }, desc: { fr: "Peut guérir d'un statut à la fin du tour.", en: "Heals the body by shedding." } }
62. `GUTS`: { nom: { fr: "Cran", en: "Guts" }, desc: { fr: "Augmente l'Attaque en cas d'altération de statut.", en: "Boosts Attack on status." } }
63. `MARVEL_SCALE`: { nom: { fr: "Écaille Spéciale", en: "Marvel Scale" }, desc: { fr: "Augmente la Défense en cas de statut.", en: "Ups Defense on status." } }
64. `LIQUID_OOZE`: { nom: { fr: "Suintement", en: "Liquid Ooze" }, desc: { fr: "Blesse l'ennemi qui draine des PV.", en: "Draining causes damage." } }
65. `OVERGROW`: { nom: { fr: "Engrais", en: "Overgrow" }, desc: { fr: "Booste les attaques Plante en cas de crise.", en: "Ups Grass moves in a pinch." } }
66. `BLAZE`: { nom: { fr: "Brasier", en: "Blaze" }, desc: { fr: "Booste les attaques Feu en cas de crise.", en: "Ups Fire moves in a pinch." } }
67. `TORRENT`: { nom: { fr: "Torrent", en: "Torrent" }, desc: { fr: "Booste les attaques Eau en cas de crise.", en: "Ups Water moves in a pinch." } }
68. `SWARM`: { nom: { fr: "Essaim", en: "Swarm" }, desc: { fr: "Booste les attaques Insecte en cas de crise.", en: "Ups Bug moves in a pinch." } }
69. `ROCK_HEAD`: { nom: { fr: "Tête de Roc", en: "Rock Head" }, desc: { fr: "Empêche les dégâts de recul.", en: "Prevents recoil damage." } }
70. `DROUGHT`: { nom: { fr: "Sécheresse", en: "Drought" }, desc: { fr: "Invoque le soleil en entrant en combat.", en: "Summons sunlight in battle." } }
71. `ARENA_TRAP`: { nom: { fr: "Piège Sable", en: "Arena Trap" }, desc: { fr: "Empêche l'ennemi au sol de fuir.", en: "Prevents fleeing." } }
72. `VITAL_SPIRIT`: { nom: { fr: "Esprit Vital", en: "Vital Spirit" }, desc: { fr: "Empêche le Pokémon de s'endormir.", en: "Prevents sleep." } }
73. `WHITE_SMOKE`: { nom: { fr: "Écran Fumée", en: "White Smoke" }, desc: { fr: "Empêche la réduction des statistiques.", en: "Prevents ability reduction." } }
74. `PURE_POWER`: { nom: { fr: "Force Pure", en: "Pure Power" }, desc: { fr: "Double l'Attaque du Pokémon.", en: "Raises Attack." } }
75. `SHELL_ARMOR`: { nom: { fr: "Coque Armure", en: "Shell Armor" }, desc: { fr: "Empêche les coups critiques adverses.", en: "Blocks critical hits." } }
76. `AIR_LOCK`: { nom: { fr: "Air Lock", en: "Air Lock" }, desc: { fr: "Neutralise tous les effets de la météo.", en: "Negates weather effects." } }

Exporter le helper `W.PokeTalents` :
- `table()`: renvoie `W.POKE_GEN3_TALENTS`.
- `cles()` ou `liste()`: renvoie la liste des 76 clés.
- `de(p)`: renvoie `p && p.talent ? p.talent : (p && p.n && ESP()[p.n] && ESP()[p.n].talent ? ESP()[p.n].talent : null)`.
- `nom(cle, lang)`: renvoie le nom traduit (`fr` par défaut).
- `desc(cle, lang)`: renvoie la description traduite (`fr` par défaut).

### 3.2. Attribution des Talents aux Espèces
- **Dans `js/poke/gen3/especes.js` (espèces 252 à 386)** :
  Chaque Pokémon reçoit son talent canonique :
  - Arcko/Massko/Jungko (252-254): `talent: "OVERGROW"`
  - Poussifeu/Galifeu/Braségali (255-257): `talent: "BLAZE"`
  - Gobou/Flobio/Laggron (258-260): `talent: "TORRENT"`
  - Medhyèna/Grahyèna (261-262): `talent: "INTIMIDATE"`
  - Zigzaton/Linéon (263-264): `talent: "PICKUP"`
  - Chenipotte/Armulys/Blindalys (265, 266, 268): `talent: "SHIELD_DUST"`
  - Charmillon (267): `talent: "SWARM"`
  - Papinox (269): `talent: "SHIELD_DUST"`
  - Nénupiot/Lombre/Ludicolo (270-272): `talent: "SWIFT_SWIM"`
  - Grainipiot/Pifeuil/Tengalice (273-275): `talent: "CHLOROPHYLL"`
  - Nirondelle/Hélédelle (276-277): `talent: "GUTS"`
  - Goélise/Bekipan (278-279): `talent: "KEEN_EYE"`
  - Tarsal/Kirlia/Gardevoir (280-282): `talent: "SYNCHRONIZE"`
  - Arakdo/Maskadra (283-284): 283 `talent: "SWIFT_SWIM"`, 284 `talent: "INTIMIDATE"`
  - Balignon/Chapignon (285-286): `talent: "EFFECT_SPORE"`
  - Parecool/Monaflèmit (287, 289): `talent: "TRUANT"`
  - Vigoroth (288): `talent: "VITAL_SPIRIT"`
  - Ningale (290): `talent: "COMPOUND_EYES"`
  - Ninjask (291): `talent: "SPEED_BOOST"`
  - Munja (292): `talent: "WONDER_GUARD"`
  - Chuchmur/Ramboum/Brouhabam (293-295): `talent: "SOUNDPROOF"`
  - Tarinor (299): `talent: "STURDY"`
  - Skitty/Delcatty (300-301): `talent: "CUTE_CHARM"`
  - Ténéfix (302): `talent: "KEEN_EYE"`
  - Mysdibule (303): `talent: "HYPER_CUTTER"`
  - Galekid/Galegon/Galeking (304-306): `talent: "ROCK_HEAD"`
  - Méditikka/Charmina (307-308): `talent: "PURE_POWER"`
  - Dynavolt/Élecsprint (309-310): `talent: "STATIC"`
  - Posipi (311): `talent: "PLUS"`, Négapi (312): `talent: "MINUS"`
  - Muciole/Lumivole (313-314): `talent: "SWARM"`
  - Rosélia (315): `talent: "NATURAL_CURE"`
  - Gloupti/Avaltout (316-317): `talent: "LIQUID_OOZE"`
  - Carvanha/Sharpedo (318-319): `talent: "ROUGH_SKIN"`
  - Wailmer/Wailord (320-321): `talent: "WATER_VEIL"`
  - Chamallot/Camérupt (322-323): `talent: "MAGMA_ARMOR"`
  - Chartor (324): `talent: "WHITE_SMOKE"`
  - Spoink/Groret (325-326): `talent: "THICK_FAT"`
  - Spinda (327): `talent: "OWN_TEMPO"`
  - Kraknoix/Vibraninf/Libégon (328-330): 328 `talent: "HYPER_CUTTER"`, 329-330 `talent: "LEVITATE"`
  - Cacnea/Cacturne (331-332): `talent: "SAND_VEIL"`
  - Tylton/Altaria (333-334): `talent: "NATURAL_CURE"`
  - Mangriff (335): `talent: "IMMUNITY"`, Séviper (336): `talent: "SHED_SKIN"`
  - Séléroc/Solaroc (337-338): `talent: "LEVITATE"`
  - Barloche/Barbicha (339-340): `talent: "OBLIVIOUS"`
  - Écrapince/Colhomard (341-342): `talent: "HYPER_CUTTER"`
  - Balbuto/Kaorine (343-344): `talent: "LEVITATE"`
  - Lilia/Vacilys (345-346): `talent: "SUCTION_CUPS"`
  - Anorith/Armaldo (347-348): `talent: "BATTLE_ARMOR"`
  - Barpau (349): `talent: "SWIFT_SWIM"`, Milobellus (350): `talent: "MARVEL_SCALE"`
  - Morphéo (351): `talent: "FORECAST"`
  - Morpheo/Kecleon (352): `talent: "COLOR_CHANGE"`
  - Polichombr/Branette (353-354): `talent: "INSOMNIA"`
  - Skelénox/Téraclope (355-356): `talent: "LEVITATE"`
  - Tropius (357): `talent: "CHLOROPHYLL"`
  - Éoko (358): `talent: "LEVITATE"`
  - Absol (359): `talent: "PRESSURE"`
  - Okéoké (360): `talent: "SHADOW_TAG"`
  - Stalgamin/Oniglali (361-362): `talent: "INNER_FOCUS"`
  - Obalie/Phrégle/Kaimorse (363-365): `talent: "THICK_FAT"`
  - Coquiperl (366): `talent: "SHELL_ARMOR"`, Serpang (367): `talent: "SWIFT_SWIM"`, Rosabyss (368): `talent: "SWIFT_SWIM"`
  - Relicanth (369): `talent: "SWIFT_SWIM"`
  - Lovdisc (370): `talent: "SWIFT_SWIM"`
  - Draby/Drackhaus/Drattak (371-373): 371-372 `talent: "ROCK_HEAD"`, 373 `talent: "INTIMIDATE"`
  - Terhal/Métang/Métalosse (374-376): `talent: "CLEAR_BODY"`
  - Regirock/Regice/Registeel (377-379): `talent: "CLEAR_BODY"`
  - Latias/Latios (380-381): `talent: "LEVITATE"`
  - Kyogre (382): `talent: "DRIZZLE"`
  - Groudon (383): `talent: "DROUGHT"`
  - Rayquaza (384): `talent: "AIR_LOCK"`
  - Jirachi (385): `talent: "SERENE_GRACE"`
  - Deoxys (386): `talent: "PRESSURE"`
- **Dans `js/poke/especes.js` (espèces 1 à 251)** :
  Associer aux espèces leur talent officiel Gen 3 (ou le principal s'il en a deux). Par exemple :
  - Bulbizarre à Florizarre (1-3): `talent: "OVERGROW"`
  - Salamèche à Dracaufeu (4-6): `talent: "BLAZE"`
  - Carapuce à Tortank (7-9): `talent: "TORRENT"`
  - Chenipan/Chrysacier/Papilusion (10-12): 10-11 `SHIELD_DUST`, 12 `COMPOUND_EYES`
  - Roucool à Roucarnage (16-18): `KEEN_EYE`
  - Pikachu/Raichu (25-26): `STATIC`
  - Mélofée/Mélodelfe (35-36): `CUTE_CHARM`
  - Goupix/Feunard (37-38): `FLASH_FIRE`
  - Machoc à Mackogneur (66-68): `GUTS`
  - Fantominus à Ectoplasma (92-94): `LEVITATE`
  - Ronflex (143): `IMMUNITY`
  - Mewtwo (150): `PRESSURE`, Mew (151): `SYNCHRONIZE`
  - etc.
  (Tous les 1-251 doivent avoir `talent` renseigné).

### 3.3. Intégration Moteur (`js/poke/moteur.js`)
Dans `creer(n, niveau, h, options)` :
```javascript
talent: o.talent !== undefined ? o.talent : (e.talent || (e.talents && e.talents[0]) || null),
```

### 3.4. Ordre des Fichiers (`js/poke/ordre.js`)
Ajouter `"js/poke/gen3/talents.js"` dans `GEN3` immédiatement après `"js/poke/gen3/natures.js"`.

### 3.5. Tests Unitaires (`tests/test_gen3_talents_data.mjs`)
Tester :
1. Les 76 talents existent dans `POKE_GEN3_TALENTS` avec nom `{ fr, en }` et desc `{ fr, en }`.
2. `PokeTalents` helper API (`table`, `cles`, `de`, `nom`, `desc`).
3. 100% des 135 Pokémon Hoenn (252 à 386) ont un `talent` valide existant dans la table.
4. 100% des espèces 1 à 251 ont un `talent` valide existant dans la table.
5. Starters, légendaires et signatures vérifiés (Arcko, Poussifeu, Gobou, Munja, Kyogre, Groudon, Rayquaza, Ectoplasma, Ronflex...).
6. `creer` initialise `talent` automatiquement depuis l'espèce.
7. `node tests/run_all_tests.mjs` passe à 100% (44/44).
