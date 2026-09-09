// ═══════════════════════════════════════════════════════════════════════
//  LES OBTENTIONS SPÉCIALES D'HOENN : FOSSILES, CASINO, CADEAUX, ÉCHANGES
// ═══════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";

  // Les deux fossiles du Désert d'Hoenn (Route 111 / Tour Mirage).
  // Ranimer l'un au laboratoire Devor de Mérouville laisse l'autre dans le sable.
  //   griffe : Anorith (#347, niveau 20)
  //   racine : Lilia (#345, niveau 20)
  var FOSSILES = [
    {
      cle: "griffe",
      objet: "CLAW_FOSSIL",
      n: 347,
      niveau: 20,
      nom: { fr: "Fossile Griffe", en: "Claw Fossil" }
    },
    {
      cle: "racine",
      objet: "ROOT_FOSSIL",
      n: 345,
      niveau: 20,
      nom: { fr: "Fossile Racine", en: "Root Fossil" }
    }
  ];
  FOSSILES.griffe = FOSSILES[0];
  FOSSILES.racine = FOSSILES[1];
  W.POKE_GEN3_FOSSILES = FOSSILES;

  // Le Casino de Lavandia (Mauville Game Corner).
  // Lots en jetons : Pokémon rares, peluches décoratives, et Capsules Techniques.
  W.POKE_GEN3_CASINO = {
    emeraude: [
      { n: 63, jetons: 180, niveau: 10 },    // Abra
      { n: 283, jetons: 500, niveau: 15 },   // Surskit (Arakdo)
      { n: 303, jetons: 1000, niveau: 20 },  // Mawile (Mysdibule)
      { n: 137, jetons: 2800, niveau: 20 }   // Porygon
    ],
    pokemon: [
      { n: 63, jetons: 180, niveau: 10 },
      { n: 283, jetons: 500, niveau: 15 },
      { n: 303, jetons: 1000, niveau: 20 },
      { n: 137, jetons: 2800, niveau: 20 }
    ],
    peluches: [
      { id: "PLUSH_TREECKO", nom: { fr: "Poupée Arcko", en: "Treecko Doll" }, jetons: 1000 },
      { id: "PLUSH_TORCHIC", nom: { fr: "Poupée Poussifeu", en: "Torchic Doll" }, jetons: 1000 },
      { id: "PLUSH_MUDKIP", nom: { fr: "Poupée Gobou", en: "Mudkip Doll" }, jetons: 1000 }
    ],
    ct: [
      { ct: "TM10", attaque: "HIDDEN_POWER", jetons: 3000 },
      { ct: "TM29", attaque: "PSYCHIC_M", jetons: 3500 },
      { ct: "TM35", attaque: "FLAMETHROWER", jetons: 4000 },
      { ct: "TM24", attaque: "THUNDERBOLT", jetons: 4000 },
      { ct: "TM13", attaque: "ICE_BEAM", jetons: 4000 }
    ]
  };

  // Les Pokémon offerts en cadeau au cours de l'aventure à Hoenn.
  //   - Castform / Morphéo (#351) au Centre Météo après avoir repoussé la Team Aqua/Magma.
  //   - Wynaut / Okéoké (#360, œuf) par la vieille dame aux sources chaudes de Vermilava.
  //   - Beldum / Terhal (#374) laissé par Pierre Rochard (Steven) dans sa maison d'Algatia.
  W.POKE_GEN3_CADEAUX = [
    {
      n: 351,
      niveau: 25,
      lieu: "weather-institute",
      etape: "weather-institute",
      objetTenu: "MYSTIC_WATER",
      donneur: { fr: "Scientifique du Centre Météo", en: "Weather Institute Scientist" }
    },
    {
      n: 360,
      niveau: 5,
      lieu: "lavaridge-town",
      etape: "lavaridge-town",
      oeuf: true,
      donneur: { fr: "Vieille dame des Sources Chaudes", en: "Old Lady at Hot Springs" }
    },
    {
      n: 374,
      niveau: 5,
      lieu: "mossdeep-city",
      etape: "mossdeep-city",
      donneur: { fr: "Pierre Rochard", en: "Steven Stone" }
    }
  ];

  // Les échanges avec les PNJ à travers Hoenn.
  //   donne  : numéro Pokédex cédé
  //   recoit : numéro Pokédex obtenu
  //   surnom : surnom canonique du Pokémon reçu
  //   etape  : lieu où l'échange se déroule
  W.POKE_GEN3_ECHANGES = [
    {
      donne: 287, // Slakoth / Parecool
      recoit: 296, // Makuhita
      surnom: "MAKU",
      lieu: "rustboro-city",
      etape: "rustboro-city"
    },
    {
      donne: 300, // Skitty
      recoit: 222, // Corsola / Corayon
      surnom: "CORONA",
      lieu: "fortree-city",
      etape: "fortree-city"
    },
    {
      donne: 25, // Pikachu
      recoit: 300, // Skitty
      surnom: "SKITTY",
      lieu: "pacifidlog-town",
      etape: "pacifidlog-town"
    },
    {
      donne: 311, // Plusle
      recoit: 312, // Minun
      surnom: "MINUN",
      lieu: "pacifidlog-town",
      etape: "pacifidlog-town"
    },
    {
      donne: 300, // Skitty
      recoit: 52, // Meowth / Miaouss
      surnom: "MEOWTHY",
      lieu: "battle-frontier",
      etape: "battle-frontier"
    }
  ];

})(typeof window !== "undefined" ? window : globalThis);
