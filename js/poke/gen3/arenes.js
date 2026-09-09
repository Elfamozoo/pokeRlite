(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  Arènes d'Hoenn, Conseil 4, Maître et Boss Épilogue (Émeraude Canon).
  //  Équipes complètes avec espèces nationales (1-386), niveaux et capacités.
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Les 8 Champions d'Arène d'Hoenn (rosters canoniques d'Émeraude)
  W.POKE_GEN3_ARENES = [
    {
      ordre: 1,
      ville: "rustboro-city",
      nom: { fr: "Arène de Mérouville", en: "Rustboro Gym" },
      champion: "Roxanne",
      championFr: "Roxanne",
      championEn: "Roxanne",
      badge: "Roche",
      badgeEn: "Stone",
      type: "Roche",
      ct: "TM39",
      equipe: [
        { n: 74, niveau: 12, attaques: ["ROCK_THROW", "TACKLE", "DEFENSE_CURL", "ROCK_TOMB"] },
        { n: 74, niveau: 12, attaques: ["ROCK_THROW", "TACKLE", "DEFENSE_CURL", "ROCK_TOMB"] },
        { n: 299, niveau: 15, attaques: ["ROCK_THROW", "TACKLE", "HARDEN", "ROCK_TOMB"] }
      ]
    },
    {
      ordre: 2,
      ville: "dewford-town",
      nom: { fr: "Arène de Myokara", en: "Dewford Gym" },
      champion: "Brawly",
      championFr: "Bastien",
      championEn: "Brawly",
      badge: "Poing",
      badgeEn: "Knuckle",
      type: "Combat",
      ct: "TM08",
      equipe: [
        { n: 66, niveau: 16, attaques: ["KARATE_CHOP", "LOW_KICK", "LEER", "BULK_UP"] },
        { n: 307, niveau: 16, attaques: ["MEDITATE", "FOCUS_PUNCH", "LIGHT_SCREEN", "REFLECT"] },
        { n: 296, niveau: 19, attaques: ["ARM_THRUST", "KNOCK_OFF", "SAND_ATTACK", "BULK_UP"] }
      ]
    },
    {
      ordre: 3,
      ville: "mauville-city",
      nom: { fr: "Arène de Lavandia", en: "Mauville Gym" },
      champion: "Wattson",
      championFr: "Voltère",
      championEn: "Wattson",
      badge: "Dynamo",
      badgeEn: "Dynamo",
      type: "Électrik",
      ct: "TM34",
      equipe: [
        { n: 100, niveau: 20, attaques: ["SPARK", "ROLLOUT", "SCREECH", "SHOCK_WAVE"] },
        { n: 309, niveau: 20, attaques: ["SPARK", "QUICK_ATTACK", "LEER", "SHOCK_WAVE"] },
        { n: 82, niveau: 22, attaques: ["SPARK", "SONICBOOM", "SUPERSONIC", "SHOCK_WAVE"] },
        { n: 310, niveau: 24, attaques: ["QUICK_ATTACK", "THUNDER_WAVE", "HOWL", "SHOCK_WAVE"] }
      ]
    },
    {
      ordre: 4,
      ville: "lavaridge-town",
      nom: { fr: "Arène de Vermilava", en: "Lavaridge Gym" },
      champion: "Flannery",
      championFr: "Adriane",
      championEn: "Flannery",
      badge: "Chaleur",
      badgeEn: "Heat",
      type: "Feu",
      ct: "TM50",
      equipe: [
        { n: 322, niveau: 24, attaques: ["OVERHEAT", "ROCK_TOMB", "MAGNITUDE", "SUNNY_DAY"] },
        { n: 218, niveau: 24, attaques: ["OVERHEAT", "ROCK_TOMB", "LIGHT_SCREEN", "SMOG"] },
        { n: 323, niveau: 26, attaques: ["OVERHEAT", "TACKLE", "ATTRACT", "MAGNITUDE"] },
        { n: 324, niveau: 29, attaques: ["OVERHEAT", "BODY_SLAM", "FLAIL", "ATTRACT"] }
      ]
    },
    {
      ordre: 5,
      ville: "petalburg-city",
      nom: { fr: "Arène de Clémenti-Ville", en: "Petalburg Gym" },
      champion: "Norman",
      championFr: "Norman",
      championEn: "Norman",
      badge: "Balancier",
      badgeEn: "Balance",
      type: "Normal",
      ct: "TM42",
      equipe: [
        { n: 327, niveau: 27, attaques: ["TEETER_DANCE", "PSYBEAM", "HYPNOSIS", "FACADE"] },
        { n: 288, niveau: 27, attaques: ["SLASH", "FAINT_ATTACK", "ENCORE", "FACADE"] },
        { n: 264, niveau: 29, attaques: ["SLASH", "BELLY_DRUM", "HEADBUTT", "FACADE"] },
        { n: 289, niveau: 31, attaques: ["COUNTER", "YAWN", "FAINT_ATTACK", "FACADE"] }
      ]
    },
    {
      ordre: 6,
      ville: "fortree-city",
      nom: { fr: "Arène de Cimetronelle", en: "Fortree Gym" },
      champion: "Winona",
      championFr: "Alizée",
      championEn: "Winona",
      badge: "Plume",
      badgeEn: "Feather",
      type: "Vol",
      ct: "TM40",
      equipe: [
        { n: 333, niveau: 29, attaques: ["AERIAL_ACE", "MIRROR_MOVE", "PERISH_SONG", "SAFEGUARD"] },
        { n: 357, niveau: 29, attaques: ["AERIAL_ACE", "SOLARBEAM", "SUNNY_DAY", "SYNTHESIS"] },
        { n: 279, niveau: 30, attaques: ["AERIAL_ACE", "WATER_GUN", "SUPERSONIC", "PROTECT"] },
        { n: 227, niveau: 31, attaques: ["AERIAL_ACE", "STEEL_WING", "SAND_ATTACK", "FURY_ATTACK"] },
        { n: 334, niveau: 33, attaques: ["AERIAL_ACE", "DRAGON_DANCE", "EARTHQUAKE", "DRAGONBREATH"] }
      ]
    },
    {
      ordre: 7,
      ville: "mossdeep-city",
      nom: { fr: "Arène d'Algatia", en: "Mossdeep Gym" },
      champion: "Tate & Liza",
      championFr: "Lévy & Tatia",
      championEn: "Tate & Liza",
      badge: "Esprit",
      badgeEn: "Mind",
      type: "Psy",
      ct: "TM04",
      equipe: [
        { n: 344, niveau: 41, attaques: ["EARTHQUAKE", "ANCIENTPOWER", "PSYCHIC_M", "LIGHT_SCREEN"] },
        { n: 178, niveau: 41, attaques: ["PSYCHIC_M", "SUNNY_DAY", "CONFUSE_RAY", "CALM_MIND"] },
        { n: 337, niveau: 42, attaques: ["PSYCHIC_M", "LIGHT_SCREEN", "HYPNOSIS", "CALM_MIND"] },
        { n: 338, niveau: 42, attaques: ["SOLARBEAM", "FLAMETHROWER", "SUNNY_DAY", "PSYCHIC_M"] }
      ]
    },
    {
      ordre: 8,
      ville: "sootopolis-city",
      nom: { fr: "Arène d'Atalanopolis", en: "Sootopolis Gym" },
      champion: "Juan",
      championFr: "Juan",
      championEn: "Juan",
      badge: "Pluie",
      badgeEn: "Rain",
      type: "Eau",
      ct: "TM03",
      equipe: [
        { n: 370, niveau: 41, attaques: ["WATER_PULSE", "SWEET_KISS", "ATTRACT", "FLAIL"] },
        { n: 340, niveau: 41, attaques: ["WATER_PULSE", "EARTHQUAKE", "RAIN_DANCE", "AMNESIA"] },
        { n: 364, niveau: 43, attaques: ["WATER_PULSE", "ENCORE", "BODY_SLAM", "AURORA_BEAM"] },
        { n: 342, niveau: 43, attaques: ["WATER_PULSE", "CRABHAMMER", "TAUNT", "LEER"] },
        { n: 230, niveau: 46, attaques: ["WATER_PULSE", "ICE_BEAM", "DRAGON_DANCE", "REST"] }
      ]
    }
  ];

  // 2. Conseil 4 de la Ligue Pokémon d'Émeraude
  W.POKE_GEN3_CONSEIL = [
    {
      ordre: 1,
      nom: "Damien",
      nomFr: "Damien",
      nomEn: "Sidney",
      type: "Ténèbres",
      equipe: [
        { n: 262, niveau: 46, attaques: ["ROAR", "DOUBLE_EDGE", "SAND_ATTACK", "CRUNCH"] },
        { n: 275, niveau: 48, attaques: ["TORMENT", "DOUBLE_TEAM", "SWAGGER", "EXTRASENSORY"] },
        { n: 332, niveau: 46, attaques: ["FAINT_ATTACK", "LEECH_SEED", "SPIKES", "COTTON_SPORE"] },
        { n: 342, niveau: 48, attaques: ["SURF", "SWORDS_DANCE", "STRENGTH", "FACADE"] },
        { n: 359, niveau: 49, attaques: ["SLASH", "SWORDS_DANCE", "AERIAL_ACE", "ROCK_SLIDE"] }
      ]
    },
    {
      ordre: 2,
      nom: "Spectra",
      nomFr: "Spectra",
      nomEn: "Phoebe",
      type: "Spectre",
      equipe: [
        { n: 356, niveau: 48, attaques: ["SHADOW_PUNCH", "CONFUSE_RAY", "CURSE", "PROTECT"] },
        { n: 354, niveau: 49, attaques: ["SHADOW_BALL", "GRUDGE", "SPITE", "FAINT_ATTACK"] },
        { n: 302, niveau: 50, attaques: ["SHADOW_BALL", "FAINT_ATTACK", "DOUBLE_TEAM", "NIGHT_SHADE"] },
        { n: 354, niveau: 49, attaques: ["SHADOW_BALL", "PSYCHIC_M", "THUNDERBOLT", "TOXIC"] },
        { n: 356, niveau: 51, attaques: ["SHADOW_BALL", "ICE_BEAM", "ROCK_SLIDE", "EARTHQUAKE"] }
      ]
    },
    {
      ordre: 3,
      nom: "Glacia",
      nomFr: "Glacia",
      nomEn: "Glacia",
      type: "Glace",
      equipe: [
        { n: 362, niveau: 50, attaques: ["ICY_WIND", "LIGHT_SCREEN", "CRUNCH", "ICE_BEAM"] },
        { n: 364, niveau: 50, attaques: ["ENCORE", "BODY_SLAM", "HAIL", "ICE_BALL"] },
        { n: 362, niveau: 52, attaques: ["ICE_BEAM", "SHADOW_BALL", "CRUNCH", "EXPLOSION"] },
        { n: 364, niveau: 52, attaques: ["BLIZZARD", "DOUBLE_EDGE", "HAIL", "ATTRACT"] },
        { n: 365, niveau: 53, attaques: ["SURF", "BODY_SLAM", "BLIZZARD", "SHEER_COLD"] }
      ]
    },
    {
      ordre: 4,
      nom: "Aragon",
      nomFr: "Aragon",
      nomEn: "Drake",
      type: "Dragon",
      equipe: [
        { n: 372, niveau: 52, attaques: ["ROCK_TOMB", "IRON_DEFENSE", "DRAGON_CLAW", "PROTECT"] },
        { n: 334, niveau: 54, attaques: ["DRAGON_DANCE", "COTTON_SPORE", "DRAGONBREATH", "TAKE_DOWN"] },
        { n: 230, niveau: 53, attaques: ["SMOKESCREEN", "DRAGON_DANCE", "SURF", "BODY_SLAM"] },
        { n: 330, niveau: 53, attaques: ["CRUNCH", "DRAGONBREATH", "SCREECH", "FLAMETHROWER"] },
        { n: 373, niveau: 55, attaques: ["FLAMETHROWER", "DRAGON_CLAW", "CRUNCH", "ROCK_SLIDE"] }
      ]
    }
  ];

  // 3. Maître de la Ligue Pokémon d'Émeraude : Marc (Wallace)
  W.POKE_GEN3_MAITRE = {
    nom: "Marc",
    nomFr: "Marc",
    nomEn: "Wallace",
    type: "Eau",
    equipe: [
      { n: 321, niveau: 57, attaques: ["RAIN_DANCE", "WATER_SPOUT", "BLIZZARD", "DOUBLE_EDGE"] },
      { n: 73, niveau: 55, attaques: ["TOXIC", "HYDRO_PUMP", "SLUDGE_BOMB", "ICE_BEAM"] },
      { n: 272, niveau: 56, attaques: ["GIGA_DRAIN", "SURF", "LEECH_SEED", "DOUBLE_TEAM"] },
      { n: 340, niveau: 56, attaques: ["EARTHQUAKE", "SURF", "AMNESIA", "HYPER_BEAM"] },
      { n: 130, niveau: 56, attaques: ["DRAGON_DANCE", "HYPER_BEAM", "EARTHQUAKE", "SURF"] },
      { n: 350, niveau: 58, attaques: ["RECOVER", "SURF", "ICE_BEAM", "TOXIC"] }
    ]
  };

  // 4. Boss Ultime de l'Épilogue : Pierre Rochard (Steven Stone) dans les profondeurs du Site Météore
  W.POKE_GEN3_STEVEN = {
    nom: "Pierre Rochard",
    nomFr: "Pierre Rochard",
    nomEn: "Steven",
    lieu: "meteor-falls",
    equipe: [
      { n: 227, niveau: 77, attaques: ["TOXIC", "AERIAL_ACE", "SPIKES", "STEEL_WING"] },
      { n: 344, niveau: 75, attaques: ["REFLECT", "LIGHT_SCREEN", "ANCIENTPOWER", "PSYCHIC_M"] },
      { n: 306, niveau: 76, attaques: ["THUNDERBOLT", "SOLARBEAM", "DRAGON_CLAW", "EARTHQUAKE"] },
      { n: 346, niveau: 76, attaques: ["GIGA_DRAIN", "ANCIENTPOWER", "SLUDGE_BOMB", "CONFUSE_RAY"] },
      { n: 348, niveau: 76, attaques: ["WATER_PULSE", "ANCIENTPOWER", "SLASH", "AERIAL_ACE"] },
      { n: 376, niveau: 78, attaques: ["METEOR_MASH", "PSYCHIC_M", "EARTHQUAKE", "SHADOW_BALL"] }
    ]
  };

})(typeof window !== "undefined" ? window : globalThis);
