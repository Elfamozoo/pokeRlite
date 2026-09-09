(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  FICHIER GÉNÉRÉ — ne pas modifier à la main.
  //    node tools/poke-classes.mjs
  //
  //  Les classes de Dresseur avec leur nom OFFICIEL français, et celui de LA
  //  PREMIÈRE GÉNÉRATION : la page moderne dit « Électricien », le jeu de 1996
  //  dit « Rocker ». « Bug Catcher » donne SCOUT, « Beauty » donne CANON,
  //  « Gambler » donne CROUPIER — ce sont des noms, pas des traductions.
  //
  //  `route` dit si la classe peut apparaître sur un nœud de la carte. Les
  //  Champions, le Conseil 4 et le rival n'y sont pas : ce sont des personnes,
  //  pas des métiers. La Team Rocket non plus — elle a ses repaires.
  // ═══════════════════════════════════════════════════════════════════════════
  W.POKE_CLASSES = {
    "Beauty": {"fr":"Canon","en":"Beauty","route":true},
    "Biker": {"fr":"Motard","en":"Biker","route":true},
    "BirdKeeper": {"fr":"Ornithologue","en":"Bird Keeper","route":true},
    "Blackbelt": {"fr":"Karatéka","en":"Blackbelt","route":true},
    "BugCatcher": {"fr":"Scout","en":"Bug Catcher","route":true},
    "Burglar": {"fr":"Pillard","en":"Burglar","route":true},
    "Channeler": {"fr":"Exorciste","en":"Channeler","route":true},
    "CooltrainerF": {"fr":"Topdresseur","en":"Cooltrainer♀","route":true},
    "CooltrainerM": {"fr":"Topdresseur","en":"Cooltrainer♂","route":true},
    "CueBall": {"fr":"Loubard","en":"Cue Ball","route":true},
    "Engineer": {"fr":"Mécano","en":"Engineer","route":true},
    "Fisher": {"fr":"Pêcheur","en":"Fisher","route":true},
    "Gambler": {"fr":"Croupier","en":"Gambler","route":true},
    "Gentleman": {"fr":"Gentleman","en":"Gentleman","route":true},
    "Hiker": {"fr":"Montagnard","en":"Hiker","route":true},
    "JrTrainerF": {"fr":"Dresseur Jr♀","en":"Jr.Trainer♀","route":true},
    "JrTrainerM": {"fr":"Dresseur Jr♂","en":"Jr.Trainer♂","route":true},
    "Juggler": {"fr":"Jongleur","en":"Juggler","route":true},
    "Lass": {"fr":"Fillette","en":"Lass","route":true},
    "Pokemaniac": {"fr":"Pokémaniac","en":"Pokemaniac","route":true},
    "Psychic": {"fr":"Kinésiste","en":"Psychic","route":true},
    "Rocker": {"fr":"Rocker","en":"Rocker","route":true},
    "Rocket": {"fr":"Rocket","en":"Rocket","route":false},
    "Sailor": {"fr":"Marin","en":"Sailor","route":true},
    "Scientist": {"fr":"Scientifique","en":"Scientist","route":true},
    "SuperNerd": {"fr":"Intello","en":"Super Nerd","route":true},
    "Swimmer": {"fr":"Nageur","en":"Swimmer","route":true},
    "Tamer": {"fr":"Dompteur","en":"Tamer","route":true},
    "UnusedJuggler": {"fr":"Jongleur","en":"Unused Juggler","route":false},
  };
})(typeof window !== "undefined" ? window : globalThis);
