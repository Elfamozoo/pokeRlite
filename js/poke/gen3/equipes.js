(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  Équipes de Dresseurs de Route pour Hoenn (Génération 3 - Émeraude).
  //  Calibrées sur les paliers de niveaux 3 à 50+ à travers les 9 Actes.
  // ═══════════════════════════════════════════════════════════════════════════

  var EQUIPES = {
    "youngster": [
      // Early routes (Routes 101, 102, 104)
      [{ n: 263, niveau: 3, attaques: ["TACKLE", "GROWL"] }], // Zigzagoon
      [{ n: 261, niveau: 4, attaques: ["TACKLE"] }], // Poochyena
      [{ n: 273, niveau: 5, attaques: ["BIDE", "HARDEN"] }], // Seedot
      [{ n: 261, niveau: 4, attaques: ["TACKLE"] }, { n: 265, niveau: 4, attaques: ["TACKLE", "STRING_SHOT"] }], // Poochyena, Wurmple
      [{ n: 263, niveau: 5, attaques: ["TACKLE", "TAIL_WHIP"] }, { n: 276, niveau: 5, attaques: ["PECK", "GROWL"] }], // Zigzagoon, Taillow
      [{ n: 276, niveau: 7, attaques: ["PECK", "GROWL", "QUICK_ATTACK"] }], // Taillow
      // Mid-early routes (Route 116, Route 110)
      [{ n: 261, niveau: 10, attaques: ["TACKLE", "HOWL", "SAND_ATTACK"] }, { n: 276, niveau: 10, attaques: ["PECK", "QUICK_ATTACK"] }],
      [{ n: 263, niveau: 13, attaques: ["HEADBUTT", "TAIL_WHIP", "SAND_ATTACK"] }, { n: 277, niveau: 14, attaques: ["WING_ATTACK", "QUICK_ATTACK"] }],
      // Mid routes (Route 117, Route 111, Route 115)
      [{ n: 264, niveau: 20, attaques: ["HEADBUTT", "SAND_ATTACK", "ODOR_SLEUTH"] }], // Linoone
      [{ n: 262, niveau: 24, attaques: ["BITE", "ROAR", "ODOR_SLEUTH"] }, { n: 277, niveau: 25, attaques: ["WING_ATTACK", "AERIAL_ACE"] }],
      // Late routes (Route 119, Route 120, Route 123)
      [{ n: 264, niveau: 32, attaques: ["SLASH", "HEADBUTT", "REST", "BELLY_DRUM"] }, { n: 262, niveau: 32, attaques: ["CRUNCH", "TAKE_DOWN", "SCARY_FACE"] }],
      [{ n: 264, niveau: 38, attaques: ["SLASH", "FACADE", "COVET"] }, { n: 277, niveau: 39, attaques: ["AERIAL_ACE", "DOUBLE_TEAM", "ENDEAVOR"] }]
    ],

    "lass": [
      // Early
      [{ n: 265, niveau: 3, attaques: ["TACKLE", "STRING_SHOT"] }], // Wurmple
      [{ n: 285, niveau: 4, attaques: ["ABSORB", "TACKLE"] }], // Shroomish
      [{ n: 263, niveau: 5, attaques: ["TACKLE", "TAIL_WHIP"] }], // Zigzagoon
      [{ n: 285, niveau: 5, attaques: ["ABSORB", "TACKLE"] }], // Shroomish
      [{ n: 263, niveau: 6, attaques: ["TACKLE", "TAIL_WHIP"] }, { n: 285, niveau: 6, attaques: ["ABSORB", "STUN_SPORE"] }],
      [{ n: 300, niveau: 9, attaques: ["TACKLE", "GROWL", "TAIL_WHIP"] }], // Skitty
      // Mid-early
      [{ n: 300, niveau: 13, attaques: ["TACKLE", "SING", "ATTRACT"] }, { n: 285, niveau: 13, attaques: ["MEGA_DRAIN", "STUN_SPORE", "LEECH_SEED"] }],
      [{ n: 183, niveau: 16, attaques: ["WATER_GUN", "TAIL_WHIP", "ROLLOUT"] }, { n: 300, niveau: 16, attaques: ["FEINT_ATTACK", "SING", "ATTRACT"] }],
      // Mid
      [{ n: 286, niveau: 24, attaques: ["MACH_PUNCH", "MEGA_DRAIN", "LEECH_SEED"] }], // Breloom
      [{ n: 301, niveau: 27, attaques: ["FEINT_ATTACK", "ASSIST", "SING", "CHARM"] }, { n: 184, niveau: 27, attaques: ["BUBBLEBEAM", "ROLLOUT", "DOUBLE_EDGE"] }],
      // Late
      [{ n: 301, niveau: 34, attaques: ["DOUBLE_EDGE", "FEINT_ATTACK", "COVET", "CHARM"] }, { n: 286, niveau: 35, attaques: ["SKY_UPPERCUT", "GIGA_DRAIN", "SPORE"] }]
    ],

    "bug_catcher": [
      [{ n: 265, niveau: 3, attaques: ["TACKLE", "STRING_SHOT"] }],
      [{ n: 266, niveau: 4, attaques: ["HARDEN", "TACKLE"] }], // Silcoon
      [{ n: 268, niveau: 4, attaques: ["HARDEN", "POISON_STING"] }], // Cascoon
      [{ n: 290, niveau: 6, attaques: ["SCRATCH", "HARDEN"] }], // Nincada
      [{ n: 266, niveau: 5, attaques: ["HARDEN"] }, { n: 268, niveau: 5, attaques: ["HARDEN"] }], // Silcoon, Cascoon
      [{ n: 267, niveau: 8, attaques: ["CONFUSION", "GUST", "POISON_STING"] }], // Beautifly
      [{ n: 269, niveau: 8, attaques: ["CONFUSION", "GUST", "POISON_STING"] }], // Dustox
      [{ n: 290, niveau: 12, attaques: ["SCRATCH", "HARDEN", "LEECH_LIFE"] }], // Nincada
      [{ n: 283, niveau: 14, attaques: ["WATER_GUN", "QUICK_ATTACK", "SWEET_SCENT"] }], // Surskit
      [{ n: 313, niveau: 20, attaques: ["SIGNAL_BEAM", "MOONLIGHT", "TAIL_GLOW"] }], // Volbeat
      [{ n: 314, niveau: 20, attaques: ["SIGNAL_BEAM", "MOONLIGHT", "SWEET_SCENT"] }], // Illumise
      [{ n: 291, niveau: 32, attaques: ["SLASH", "SWORDS_DANCE", "FURY_CUTTER", "SCREECH"] }], // Ninjask
      [{ n: 284, niveau: 36, attaques: ["BUBBLEBEAM", "SILVER_WIND", "QUICK_ATTACK"] }], // Masquerain
      [{ n: 214, niveau: 42, attaques: ["MEGAHORN", "BRICK_BREAK", "COUNTER", "TAKE_DOWN"] }] // Heracross
    ],

    "rich_boy": [
      [{ n: 263, niveau: 7, attaques: ["TACKLE", "HEADBUTT"] }], // Zigzagoon
      [{ n: 264, niveau: 14, attaques: ["HEADBUTT", "SAND_ATTACK", "ODOR_SLEUTH"] }], // Linoone
      [{ n: 304, niveau: 20, attaques: ["HEADBUTT", "IRON_DEFENSE", "METAL_CLAW"] }], // Aron
      [{ n: 305, niveau: 30, attaques: ["IRON_DEFENSE", "TAKE_DOWN", "METAL_CLAW", "ROAR"] }], // Lairon
      [{ n: 306, niveau: 45, attaques: ["IRON_TAIL", "EARTHQUAKE", "ROCK_SLIDE", "DOUBLE_EDGE"] }] // Aggron
    ],

    "lady": [
      [{ n: 263, niveau: 7, attaques: ["TACKLE", "GROWL"] }],
      [{ n: 300, niveau: 14, attaques: ["TACKLE", "SING", "ATTRACT"] }],
      [{ n: 303, niveau: 20, attaques: ["BITE", "FAINT_ATTACK", "SWEET_SCENT"] }], // Mawile
      [{ n: 311, niveau: 30, attaques: ["WEATHER_BALL", "HEADBUTT"] }], // Plusle/Minun/Castform
      [{ n: 350, niveau: 46, attaques: ["SURF", "ICE_BEAM", "RECOVER", "WATER_PULSE"] }] // Milotic
    ],

    "triathlete": [
      // Runner
      [{ n: 84, niveau: 12, attaques: ["PECK", "QUICK_ATTACK", "GROWL"] }], // Doduo
      [{ n: 85, niveau: 28, attaques: ["TRI_ATTACK", "DRILL_PECK", "PURSUIT"] }], // Dodrio
      // Cyclist
      [{ n: 81, niveau: 16, attaques: ["THUNDERSHOCK", "SONICBOOM", "SUPERSONIC"] }], // Magnemite
      [{ n: 82, niveau: 32, attaques: ["THUNDERBOLT", "SONICBOOM", "THUNDER_WAVE"] }], // Magneton
      // Swimmer
      [{ n: 118, niveau: 24, attaques: ["WATER_PULSE", "HORN_ATTACK", "SUPERSONIC"] }], // Goldeen
      [{ n: 119, niveau: 36, attaques: ["WATERFALL", "HORN_DRILL", "FURY_ATTACK"] }], // Seaking
      [{ n: 85, niveau: 44, attaques: ["DRILL_PECK", "TRI_ATTACK", "AGILITY", "FURY_ATTACK"] }]
    ],

    "aroma_lady": [
      [{ n: 285, niveau: 14, attaques: ["MEGA_DRAIN", "STUN_SPORE", "LEECH_SEED"] }], // Shroomish
      [{ n: 315, niveau: 18, attaques: ["MEGA_DRAIN", "POISON_STING", "SWEET_SCENT"] }], // Roselia
      [{ n: 274, niveau: 26, attaques: ["RAZOR_LEAF", "FAINT_ATTACK", "GROWTH"] }], // Nuzleaf
      [{ n: 315, niveau: 34, attaques: ["GIGA_DRAIN", "MAGICAL_LEAF", "TOXIC", "SYNTHESIS"] }], // Roselia
      [{ n: 45, niveau: 43, attaques: ["GIGA_DRAIN", "PETAL_DANCE", "MOONLIGHT", "SLEEP_POWDER"] }] // Vileplume
    ],

    "pokemon_ranger": [
      [{ n: 276, niveau: 18, attaques: ["WING_ATTACK", "QUICK_ATTACK"] }, { n: 285, niveau: 18, attaques: ["MEGA_DRAIN", "HEADBUTT"] }],
      [{ n: 277, niveau: 28, attaques: ["AERIAL_ACE", "QUICK_ATTACK", "ENDEAVOR"] }, { n: 286, niveau: 28, attaques: ["MACH_PUNCH", "GIGA_DRAIN", "COUNTER"] }],
      [{ n: 335, niveau: 35, attaques: ["SLASH", "CRUSH_CLAW", "FURY_SWIPES"] }], // Zangoose
      [{ n: 336, niveau: 35, attaques: ["POISON_TAIL", "CRUNCH", "SCREECH"] }], // Seviper
      [{ n: 357, niveau: 44, attaques: ["SOLARBEAM", "BODY_SLAM", "SYNTHESIS", "AERIAL_ACE"] }] // Tropius
    ],

    "collector": [
      [{ n: 265, niveau: 15, attaques: ["TACKLE", "POISON_STING"] }, { n: 268, niveau: 15, attaques: ["HARDEN"] }],
      [{ n: 316, niveau: 24, attaques: ["SLUDGE", "YAWN", "ACID_ARMOR"] }], // Gulpin
      [{ n: 327, niveau: 30, attaques: ["TEETER_DANCE", "PSYBEAM", "DIZZY_PUNCH"] }], // Spinda
      [{ n: 352, niveau: 38, attaques: ["ANCIENTPOWER", "SLASH", "FEINT_ATTACK"] }], // Kecleon
      [{ n: 358, niveau: 45, attaques: ["PSYCHIC_M", "HEAL_BELL", "HYPNOSIS", "DOUBLE_EDGE"] }] // Chimecho
    ],

    "ninja_boy": [
      [{ n: 290, niveau: 13, attaques: ["SCRATCH", "SAND_ATTACK", "LEECH_LIFE"] }], // Nincada
      [{ n: 109, niveau: 22, attaques: ["SMOG", "SLUDGE", "SELFDESTRUCT"] }], // Koffing
      [{ n: 316, niveau: 28, attaques: ["SLUDGE", "TOXIC", "YAWN"] }], // Gulpin
      [{ n: 291, niveau: 35, attaques: ["SLASH", "AERIAL_ACE", "SWORDS_DANCE", "DOUBLE_TEAM"] }], // Ninjask
      [{ n: 292, niveau: 42, attaques: ["SHADOW_BALL", "CONFUSE_RAY", "SPITE", "LEECH_LIFE"] }] // Shedinja
    ],

    "parasol_lady": [
      [{ n: 283, niveau: 15, attaques: ["WATER_GUN", "BUBBLE", "SWEET_SCENT"] }], // Surskit
      [{ n: 118, niveau: 25, attaques: ["WATER_PULSE", "HORN_ATTACK", "SUPERSONIC"] }], // Goldeen
      [{ n: 311, niveau: 32, attaques: ["WEATHER_BALL", "RAIN_DANCE", "WATER_PULSE"] }], // Castform
      [{ n: 351, niveau: 38, attaques: ["WEATHER_BALL", "BLIZZARD", "HYDRO_PUMP", "HAIL"] }], // Castform Ice/Water
      [{ n: 279, niveau: 44, attaques: ["SURF", "WING_ATTACK", "STOCKPILE", "SPIT_UP"] }] // Pelipper
    ],

    "sailor": [
      [{ n: 278, niveau: 11, attaques: ["WATER_GUN", "WING_ATTACK"] }], // Wingull
      [{ n: 66, niveau: 14, attaques: ["KARATE_CHOP", "LOW_KICK", "LEER"] }], // Machop
      [{ n: 278, niveau: 18, attaques: ["WATER_GUN", "SUPERSONIC", "WING_ATTACK"] }, { n: 66, niveau: 18, attaques: ["SEISMIC_TOSS", "KARATE_CHOP"] }],
      [{ n: 279, niveau: 28, attaques: ["WATER_PULSE", "WING_ATTACK", "SUPERSONIC"] }], // Pelipper
      [{ n: 67, niveau: 34, attaques: ["VITAL_THROW", "CROSS_CHOP", "ROCK_SLIDE"] }], // Machoke
      [{ n: 319, niveau: 42, attaques: ["CRUNCH", "SLASH", "SURF", "SCREECH"] }], // Sharpedo
      [{ n: 364, niveau: 45, attaques: ["BODY_SLAM", "AURORA_BEAM", "SURF", "REST"] }] // Sealeo
    ],

    "fisherman": [
      [{ n: 129, niveau: 10, attaques: ["SPLASH", "TACKLE"] }, { n: 129, niveau: 10, attaques: ["SPLASH", "TACKLE"] }], // Magikarp
      [{ n: 118, niveau: 14, attaques: ["PECK", "WATER_GUN"] }, { n: 129, niveau: 15, attaques: ["TACKLE"] }],
      [{ n: 72, niveau: 20, attaques: ["POISON_STING", "CONSTRICT", "ACID", "WATER_PULSE"] }], // Tentacool
      [{ n: 318, niveau: 25, attaques: ["BITE", "WATER_GUN", "FOCUS_ENERGY"] }], // Carvanha
      [{ n: 320, niveau: 30, attaques: ["WATER_PULSE", "ROLLOUT", "DEFENSE_CURL"] }], // Wailmer
      [{ n: 339, niveau: 34, attaques: ["MUD_SLAP", "WATER_PULSE", "MAGNITUDE"] }], // Barboach
      [{ n: 130, niveau: 40, attaques: ["HYDRO_PUMP", "DRAGON_RAGE", "BITE", "TWISTER"] }], // Gyarados
      [{ n: 340, niveau: 45, attaques: ["EARTHQUAKE", "SURF", "AMNESIA", "REST"] }] // Whiscash
    ],

    "hiker": [
      [{ n: 74, niveau: 8, attaques: ["TACKLE", "DEFENSE_CURL"] }], // Geodude
      [{ n: 74, niveau: 12, attaques: ["ROCK_THROW", "TACKLE", "DEFENSE_CURL"] }, { n: 74, niveau: 12, attaques: ["ROCK_THROW", "TACKLE"] }],
      [{ n: 299, niveau: 16, attaques: ["ROCK_THROW", "TACKLE", "BLOCK"] }], // Nosepass
      [{ n: 75, niveau: 24, attaques: ["ROCK_THROW", "MAGNITUDE", "DEFENSE_CURL"] }], // Graveler
      [{ n: 304, niveau: 25, attaques: ["HEADBUTT", "METAL_CLAW", "MUD_SLAP"] }, { n: 75, niveau: 25, attaques: ["ROCK_THROW", "SELFDESTRUCT"] }],
      [{ n: 322, niveau: 30, attaques: ["MAGNITUDE", "EMBER", "TAKE_DOWN"] }], // Numel
      [{ n: 323, niveau: 38, attaques: ["EARTHQUAKE", "ROCK_SLIDE", "ERUPTION", "AMNESIA"] }], // Camerupt
      [{ n: 76, niveau: 44, attaques: ["EARTHQUAKE", "ROCK_SLIDE", "EXPLOSION", "DOUBLE_EDGE"] }], // Golem
      [{ n: 306, niveau: 48, attaques: ["IRON_TAIL", "EARTHQUAKE", "ROCK_SLIDE", "ROAR"] }] // Aggron
    ],

    "swimmer_m": [
      [{ n: 72, niveau: 24, attaques: ["ACID", "WATER_PULSE", "WRAP"] }],
      [{ n: 318, niveau: 28, attaques: ["BITE", "WATER_PULSE", "SCARY_FACE"] }],
      [{ n: 278, niveau: 30, attaques: ["WING_ATTACK", "WATER_PULSE", "SUPERSONIC"] }, { n: 72, niveau: 30, attaques: ["BUBBLEBEAM", "ACID"] }],
      [{ n: 341, niveau: 34, attaques: ["BUBBLEBEAM", "CRABHAMMER", "HARDEN"] }], // Corphish
      [{ n: 319, niveau: 38, attaques: ["CRUNCH", "SLASH", "SURF"] }], // Sharpedo
      [{ n: 364, niveau: 44, attaques: ["BODY_SLAM", "AURORA_BEAM", "SURF"] }], // Sealeo
      [{ n: 130, niveau: 46, attaques: ["HYDRO_PUMP", "DRAGON_DANCE", "BITE", "EARTHQUAKE"] }]
    ],

    "swimmer_f": [
      [{ n: 183, niveau: 24, attaques: ["WATER_GUN", "ROLLOUT", "TAIL_WHIP"] }],
      [{ n: 118, niveau: 28, attaques: ["WATER_PULSE", "HORN_ATTACK", "SUPERSONIC"] }],
      [{ n: 366, niveau: 32, attaques: ["WATER_PULSE", "CLAMP", "IRON_DEFENSE"] }], // Clamperl
      [{ n: 370, niveau: 36, attaques: ["WATER_PULSE", "SWEET_KISS", "ATTRACT"] }], // Luvdisc
      [{ n: 119, niveau: 40, attaques: ["WATERFALL", "MEGAHORN", "HORN_DRILL"] }], // Seaking
      [{ n: 367, niveau: 44, attaques: ["CRUNCH", "SURF", "BATON_PASS", "SCREECH"] }], // Huntail
      [{ n: 368, niveau: 45, attaques: ["PSYCHIC_M", "SURF", "SAFEGUARD", "SCREECH"] }] // Gorebyss
    ],

    "team_aqua": [
      [{ n: 261, niveau: 14, attaques: ["BITE", "HOWL"] }, { n: 72, niveau: 14, attaques: ["POISON_STING", "WATER_GUN"] }],
      [{ n: 262, niveau: 24, attaques: ["BITE", "ROAR", "SWAGGER"] }, { n: 318, niveau: 24, attaques: ["BITE", "WATER_PULSE"] }],
      [{ n: 319, niveau: 32, attaques: ["CRUNCH", "SLASH", "SCARY_FACE"] }, { n: 262, niveau: 32, attaques: ["CRUNCH", "TAKE_DOWN"] }],
      [{ n: 89, niveau: 36, attaques: ["SLUDGE_BOMB", "MINIMIZE", "ACID_ARMOR"] }, { n: 319, niveau: 37, attaques: ["CRUNCH", "SURF", "TAUNT"] }],
      [{ n: 262, niveau: 42, attaques: ["CRUNCH", "DOUBLE_EDGE", "TAUNT"] }, { n: 319, niveau: 44, attaques: ["CRUNCH", "HYDRO_PUMP", "SLASH"] }]
    ],

    "team_magma": [
      [{ n: 261, niveau: 14, attaques: ["BITE", "HOWL"] }, { n: 322, niveau: 14, attaques: ["EMBER", "MAGNITUDE"] }],
      [{ n: 262, niveau: 24, attaques: ["BITE", "ROAR", "SWAGGER"] }, { n: 322, niveau: 24, attaques: ["EMBER", "MAGNITUDE", "TAKE_DOWN"] }],
      [{ n: 323, niveau: 32, attaques: ["EARTHQUAKE", "ROCK_SLIDE", "TAKE_DOWN"] }, { n: 262, niveau: 32, attaques: ["CRUNCH", "TAKE_DOWN"] }],
      [{ n: 110, niveau: 36, attaques: ["SLUDGE_BOMB", "SMOKESCREEN", "EXPLOSION"] }, { n: 323, niveau: 37, attaques: ["EARTHQUAKE", "FLAMETHROWER", "AMNESIA"] }],
      [{ n: 262, niveau: 42, attaques: ["CRUNCH", "DOUBLE_EDGE", "SCARY_FACE"] }, { n: 323, niveau: 44, attaques: ["EARTHQUAKE", "ERUPTION", "ROCK_SLIDE"] }]
    ],

    "expert": [
      [{ n: 307, niveau: 28, attaques: ["CONFUSION", "MEDITATE", "MIND_READER"] }, { n: 296, niveau: 28, attaques: ["ARM_THRUST", "KNOCK_OFF", "BELLY_DRUM"] }],
      [{ n: 308, niveau: 36, attaques: ["HI_JUMP_KICK", "PSYCHIC_M", "CALM_MIND"] }, { n: 297, niveau: 36, attaques: ["VITAL_THROW", "FAKE_OUT", "BELLY_DRUM"] }],
      [{ n: 308, niveau: 44, attaques: ["HI_JUMP_KICK", "PSYCHIC_M", "RECOVER", "CALM_MIND"] }], // Medicham
      [{ n: 297, niveau: 46, attaques: ["CROSS_CHOP", "EARTHQUAKE", "SURF", "KNOCK_OFF"] }], // Hariyama
      [{ n: 308, niveau: 48, attaques: ["HI_JUMP_KICK", "PSYCHIC_M", "ICE_PUNCH", "THUNDERPUNCH"] }]
    ],

    "cooltrainer_m": [
      [{ n: 304, niveau: 26, attaques: ["HEADBUTT", "METAL_CLAW", "IRON_DEFENSE"] }, { n: 277, niveau: 26, attaques: ["WING_ATTACK", "AERIAL_ACE"] }],
      [{ n: 305, niveau: 34, attaques: ["IRON_TAIL", "BODY_SLAM", "TAKE_DOWN"] }, { n: 334, niveau: 35, attaques: ["DRAGONBREATH", "AERIAL_ACE", "DRAGON_DANCE"] }],
      [{ n: 254, niveau: 42, attaques: ["LEAF_BLADE", "DRAGON_CLAW", "CRUNCH", "QUICK_ATTACK"] }], // Sceptile
      [{ n: 257, niveau: 42, attaques: ["BLAZE_KICK", "SKY_UPPERCUT", "SLASH", "QUICK_ATTACK"] }], // Blaziken
      [{ n: 260, niveau: 42, attaques: ["SURF", "EARTHQUAKE", "MUDDY_WATER", "TAKE_DOWN"] }], // Swampert
      [{ n: 373, niveau: 48, attaques: ["DRAGON_CLAW", "FLAMETHROWER", "FLY", "CRUNCH"] }] // Salamence
    ],

    "cooltrainer_f": [
      [{ n: 281, niveau: 26, attaques: ["CONFUSION", "DOUBLE_TEAM", "CALM_MIND"] }, { n: 300, niveau: 26, attaques: ["FEINT_ATTACK", "ASSIST", "CHARM"] }],
      [{ n: 282, niveau: 35, attaques: ["PSYCHIC_M", "THUNDERBOLT", "CALM_MIND"] }, { n: 350, niveau: 36, attaques: ["SURF", "ICE_BEAM", "RECOVER"] }],
      [{ n: 334, niveau: 42, attaques: ["DRAGONBREATH", "EARTHQUAKE", "AERIAL_ACE", "DRAGON_DANCE"] }],
      [{ n: 359, niveau: 44, attaques: ["SLASH", "SWORDS_DANCE", "AERIAL_ACE", "ROCK_SLIDE"] }], // Absol
      [{ n: 282, niveau: 48, attaques: ["PSYCHIC_M", "THUNDERBOLT", "CALM_MIND", "SHADOW_BALL"] }] // Gardevoir
    ],

    "psychic": [
      [{ n: 280, niveau: 15, attaques: ["CONFUSION", "DOUBLE_TEAM", "GROWL"] }], // Ralts
      [{ n: 64, niveau: 24, attaques: ["PSYBEAM", "CONFUSION", "RECOVER"] }], // Kadabra
      [{ n: 281, niveau: 32, attaques: ["PSYBEAM", "CALM_MIND", "TELEPORT"] }], // Kirlia
      [{ n: 325, niveau: 36, attaques: ["PSYCHIC_M", "TEETER_DANCE", "BOUNCE"] }], // Spoink
      [{ n: 65, niveau: 44, attaques: ["PSYCHIC_M", "CALM_MIND", "RECOVER", "REFLECT"] }] // Alakazam
    ],

    "black_belt": [
      [{ n: 66, niveau: 16, attaques: ["KARATE_CHOP", "LOW_KICK", "LEER"] }],
      [{ n: 296, niveau: 24, attaques: ["ARM_THRUST", "KNOCK_OFF", "SAND_ATTACK"] }],
      [{ n: 67, niveau: 32, attaques: ["VITAL_THROW", "KARATE_CHOP", "SEISMIC_TOSS"] }],
      [{ n: 297, niveau: 38, attaques: ["ARM_THRUST", "BELLY_DRUM", "VITAL_THROW"] }],
      [{ n: 68, niveau: 46, attaques: ["CROSS_CHOP", "EARTHQUAKE", "ROCK_SLIDE", "SUBMISSION"] }] // Machamp
    ],

    "guitarist": [
      [{ n: 309, niveau: 18, attaques: ["SPARK", "QUICK_ATTACK", "LEER"] }],
      [{ n: 310, niveau: 28, attaques: ["SPARK", "BITE", "QUICK_ATTACK", "ROAR"] }],
      [{ n: 310, niveau: 38, attaques: ["THUNDERBOLT", "CRUNCH", "QUICK_ATTACK"] }]
    ],

    "bird_keeper": [
      [{ n: 276, niveau: 14, attaques: ["WING_ATTACK", "PECK", "QUICK_ATTACK"] }],
      [{ n: 277, niveau: 26, attaques: ["AERIAL_ACE", "WING_ATTACK", "QUICK_ATTACK"] }],
      [{ n: 333, niveau: 30, attaques: ["PECK", "SAFEGUARD", "SING", "MIST"] }],
      [{ n: 227, niveau: 38, attaques: ["STEEL_WING", "AERIAL_ACE", "SPIKES"] }],
      [{ n: 334, niveau: 45, attaques: ["AERIAL_ACE", "DRAGONBREATH", "DRAGON_DANCE", "EARTHQUAKE"] }]
    ]
  };

  // Alias PascalCase pour les équipes également
  var aliasList = [
    ["Youngster", "youngster"],
    ["Lass", "lass"],
    ["BugCatcher", "bug_catcher"],
    ["RichBoy", "rich_boy"],
    ["Lady", "lady"],
    ["Triathlete", "triathlete"],
    ["AromaLady", "aroma_lady"],
    ["PokemonRanger", "pokemon_ranger"],
    ["Collector", "collector"],
    ["NinjaBoy", "ninja_boy"],
    ["ParasolLady", "parasol_lady"],
    ["Sailor", "sailor"],
    ["Fisherman", "fisherman"],
    ["Hiker", "hiker"],
    ["SwimmerM", "swimmer_m"],
    ["SwimmerF", "swimmer_f"],
    ["TeamAqua", "team_aqua"],
    ["TeamMagma", "team_magma"],
    ["Expert", "expert"],
    ["CooltrainerM", "cooltrainer_m"],
    ["CooltrainerF", "cooltrainer_f"],
    ["Psychic", "psychic"],
    ["BlackBelt", "black_belt"],
    ["Guitarist", "guitarist"],
    ["BirdKeeper", "bird_keeper"]
  ];

  for (var a = 0; a < aliasList.length; a++) {
    var pName = aliasList[a][0];
    var sName = aliasList[a][1];
    if (EQUIPES[sName] && !EQUIPES[pName]) {
      EQUIPES[pName] = EQUIPES[sName];
    }
  }

  W.POKE_GEN3_EQUIPES = EQUIPES;

})(typeof window !== "undefined" ? window : globalThis);
