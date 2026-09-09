(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  Rival Brice / Flora (May / Brendan) & Timmy (Wally) pour Hoenn (Émeraude).
  //
  //  5 rencontres au fil de l'aventure pour le rival, 3 variantes chacune selon
  //  le starter choisi (l'ordre dans le tableau dicte la variante adverse).
  //  Timmy défend l'entrée de la Ligue au bout de la Route Victoire.
  // ═══════════════════════════════════════════════════════════════════════════

  W.POKE_GEN3_RIVAL = {
    // Les 3 starters : Arcko (252), Poussifeu (255), Gobou (258)
    ordre: [252, 255, 258],
    rencontres: 5,

    // Rencontres de début : Route 103, Route 110, Route 119 (3 x 3 variantes = 9 équipes)
    debut: [
      // 1. Route 103 (Niveau 5)
      [{ n: 252, niveau: 5, attaques: ["POUND", "LEER"] }],
      [{ n: 255, niveau: 5, attaques: ["SCRATCH", "GROWL"] }],
      [{ n: 258, niveau: 5, attaques: ["TACKLE", "GROWL"] }],

      // 2. Route 110 (Niveaux 18-20)
      [
        { n: 278, niveau: 18, attaques: ["WATER_GUN", "WING_ATTACK", "SUPERSONIC"] },
        { n: 271, niveau: 18, attaques: ["NATURE_POWER", "ABSORB", "FURY_SWIPES"] },
        { n: 253, niveau: 20, attaques: ["PURSUIT", "MEGA_DRAIN", "QUICK_ATTACK", "LEER"] }
      ],
      [
        { n: 278, niveau: 18, attaques: ["WATER_GUN", "WING_ATTACK", "SUPERSONIC"] },
        { n: 322, niveau: 18, attaques: ["EMBER", "MAGNITUDE", "TACKLE"] },
        { n: 256, niveau: 20, attaques: ["DOUBLE_KICK", "EMBER", "PECK", "FOCUS_ENERGY"] }
      ],
      [
        { n: 271, niveau: 18, attaques: ["NATURE_POWER", "ABSORB", "FURY_SWIPES"] },
        { n: 218, niveau: 18, attaques: ["EMBER", "ROCK_THROW", "HARDEN"] },
        { n: 259, niveau: 20, attaques: ["MUD_SHOT", "WATER_GUN", "BIDE", "MUD_SPORT"] }
      ],

      // 3. Route 119 (Niveaux 29-31)
      [
        { n: 278, niveau: 29, attaques: ["WATER_PULSE", "WING_ATTACK", "SUPERSONIC", "MIST"] },
        { n: 271, niveau: 29, attaques: ["FURY_SWIPES", "MEGA_DRAIN", "NATURE_POWER"] },
        { n: 253, niveau: 31, attaques: ["PURSUIT", "GIGA_DRAIN", "QUICK_ATTACK", "SCREECH"] }
      ],
      [
        { n: 322, niveau: 29, attaques: ["MAGNITUDE", "FLAMETHROWER", "TAKE_DOWN"] },
        { n: 278, niveau: 29, attaques: ["WATER_PULSE", "WING_ATTACK", "SUPERSONIC"] },
        { n: 256, niveau: 31, attaques: ["SKY_UPPERCUT", "FLAME_WHEEL", "PECK", "SAND_ATTACK"] }
      ],
      [
        { n: 271, niveau: 29, attaques: ["MEGA_DRAIN", "SURF", "FURY_SWIPES"] },
        { n: 218, niveau: 29, attaques: ["FLAMETHROWER", "ROCK_SLIDE", "SMOG"] },
        { n: 259, niveau: 31, attaques: ["MUD_SHOT", "SURF", "TAKE_DOWN", "FORESIGHT"] }
      ]
    ],

    // Rencontres de milieu / fin : Nénucrique & Épilogue (2 x 3 variantes = 6 équipes)
    milieu: [
      // 4. Nénucrique (Lilycove City - Niveaux 31-34)
      [
        { n: 277, niveau: 31, attaques: ["AERIAL_ACE", "QUICK_ATTACK", "WING_ATTACK", "DOUBLE_TEAM"] },
        { n: 320, niveau: 32, attaques: ["WATER_PULSE", "ROLLOUT", "ASTONISH"] },
        { n: 285, niveau: 32, attaques: ["MEGA_DRAIN", "STUN_SPORE", "HEADBUTT"] },
        { n: 254, niveau: 34, attaques: ["LEAF_BLADE", "PURSUIT", "QUICK_ATTACK", "SCREECH"] }
      ],
      [
        { n: 277, niveau: 31, attaques: ["AERIAL_ACE", "QUICK_ATTACK", "WING_ATTACK", "DOUBLE_TEAM"] },
        { n: 279, niveau: 32, attaques: ["WATER_PULSE", "WING_ATTACK", "PROTECT"] },
        { n: 219, niveau: 32, attaques: ["FLAMETHROWER", "ROCK_SLIDE", "AMNESIA"] },
        { n: 257, niveau: 34, attaques: ["BLAZE_KICK", "DOUBLE_KICK", "SLASH", "SAND_ATTACK"] }
      ],
      [
        { n: 277, niveau: 31, attaques: ["AERIAL_ACE", "QUICK_ATTACK", "WING_ATTACK", "DOUBLE_TEAM"] },
        { n: 272, niveau: 32, attaques: ["GIGA_DRAIN", "SURF", "NATURE_POWER"] },
        { n: 219, niveau: 32, attaques: ["FLAMETHROWER", "ROCK_SLIDE", "AMNESIA"] },
        { n: 260, niveau: 34, attaques: ["MUDDY_WATER", "EARTHQUAKE", "TAKE_DOWN", "MUD_SHOT"] }
      ],

      // 5. Combat d'Épilogue (Niveaux 42-45)
      [
        { n: 277, niveau: 42, attaques: ["AERIAL_ACE", "QUICK_ATTACK", "STEEL_WING", "DOUBLE_TEAM"] },
        { n: 321, niveau: 43, attaques: ["WATER_SPOUT", "BLIZZARD", "BODY_SLAM", "REST"] },
        { n: 286, niveau: 43, attaques: ["SKY_UPPERCUT", "GIGA_DRAIN", "MACH_PUNCH", "SPORE"] },
        { n: 254, niveau: 45, attaques: ["LEAF_BLADE", "DRAGON_CLAW", "CRUNCH", "QUICK_ATTACK"] }
      ],
      [
        { n: 277, niveau: 42, attaques: ["AERIAL_ACE", "QUICK_ATTACK", "STEEL_WING", "DOUBLE_TEAM"] },
        { n: 279, niveau: 43, attaques: ["SURF", "WING_ATTACK", "PROTECT", "STOCKPILE"] },
        { n: 219, niveau: 43, attaques: ["FLAMETHROWER", "EARTHQUAKE", "ROCK_SLIDE", "RECOVER"] },
        { n: 257, niveau: 45, attaques: ["BLAZE_KICK", "SKY_UPPERCUT", "SLASH", "SWORDS_DANCE"] }
      ],
      [
        { n: 277, niveau: 42, attaques: ["AERIAL_ACE", "QUICK_ATTACK", "STEEL_WING", "DOUBLE_TEAM"] },
        { n: 272, niveau: 43, attaques: ["HYDRO_PUMP", "GIGA_DRAIN", "ICE_BEAM", "LEECH_SEED"] },
        { n: 219, niveau: 43, attaques: ["FLAMETHROWER", "EARTHQUAKE", "ROCK_SLIDE", "RECOVER"] },
        { n: 260, niveau: 45, attaques: ["EARTHQUAKE", "SURF", "ICE_BEAM", "BRICK_BREAK"] }
      ]
    ]
  };

  // Timmy (Wally) à la Route Victoire (Émeraude Canon)
  W.POKE_GEN3_TIMMY = {
    nom: "Timmy",
    nomFr: "Timmy",
    nomEn: "Wally",
    lieu: "victory-road",
    equipe: [
      { n: 334, niveau: 44, attaques: ["AERIAL_ACE", "DRAGONBREATH", "DRAGON_DANCE", "SAFEGUARD"] },
      { n: 301, niveau: 43, attaques: ["ASSIST", "CHARM", "FAINT_ATTACK", "COVET"] },
      { n: 315, niveau: 44, attaques: ["GIGA_DRAIN", "TOXIC", "LEECH_SEED", "GRASS_WHISTLE"] },
      { n: 82, niveau: 41, attaques: ["THUNDERBOLT", "TRI_ATTACK", "SCREECH", "THUNDER_WAVE"] },
      { n: 282, niveau: 45, attaques: ["PSYCHIC_M", "FUTURE_SIGHT", "CALM_MIND", "DOUBLE_TEAM"] }
    ]
  };

})(typeof window !== "undefined" ? window : globalThis);
