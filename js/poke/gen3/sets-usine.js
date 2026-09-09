(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  SETS CANONIQUES DE L'USINE DE COMBAT (BATTLE FACTORY — ÉMERAUDE)
  //
  //  Bibliothèque de sets de prêt compétitifs organisée en 4 tiers de difficulté :
  //   · tier1 : Séries 1-2 (combats 1 à 14), créatures de base ou solides intermédiaires
  //   · tier2 : Séries 3-4 (combats 15 à 28), évolutions viables de milieu de tournoi
  //   · tier3 : Séries 5-7 (combats 29 à 49) et Meneur Samson Argent (combat 21)
  //   · tier4 : Meneur Samson Or (combat 42) & très hautes séries (+ légendaires autorisés)
  // ═══════════════════════════════════════════════════════════════════════════

  var TIER1 = [
    { espece: 25, nature: "timide", objet: "MAGNET", attaques: ["THUNDERBOLT", "QUICK_ATTACK", "THUNDER_WAVE", "SURF"], repartition: "sat_vit" },
    { espece: 253, nature: "timide", objet: "MIRACLE_SEED", attaques: ["LEAF_BLADE", "QUICK_ATTACK", "PURSUIT", "GIGA_DRAIN"], repartition: "sat_vit" },
    { espece: 256, nature: "rigide", objet: "CHARCOAL", attaques: ["FLAMETHROWER", "DOUBLE_KICK", "BULK_UP", "ROCK_SLIDE"], repartition: "atk_vit" },
    { espece: 259, nature: "brave", objet: "MYSTIC_WATER", attaques: ["SURF", "EARTHQUAKE", "ICE_BEAM", "PROTECT"], repartition: "atk_pv" },
    { espece: 261, nature: "jovial", objet: "BLACKGLASSES", attaques: ["CRUNCH", "BITE", "TAKE_DOWN", "ROAR"], repartition: "atk_vit" },
    { espece: 276, nature: "jovial", objet: "SILK_SCARF", attaques: ["QUICK_ATTACK", "WING_ATTACK", "AERIAL_ACE", "STEEL_WING"], repartition: "atk_vit" },
    { espece: 278, nature: "modeste", objet: "MYSTIC_WATER", attaques: ["WATER_PULSE", "WING_ATTACK", "SUPERSONIC", "MIST"], repartition: "sat_vit" },
    { espece: 281, nature: "modeste", objet: "TWISTEDSPOON", attaques: ["PSYCHIC_M", "CALM_MIND", "SHADOW_BALL", "REFLECT"], repartition: "sat_vit" },
    { espece: 286, nature: "jovial", objet: "BLACKBELT_I", attaques: ["MACH_PUNCH", "STUN_SPORE", "HEADBUTT", "GIGA_DRAIN"], repartition: "atk_vit" },
    { espece: 305, nature: "rigide", objet: "HARD_STONE", attaques: ["ROCK_SLIDE", "IRON_TAIL", "HEADBUTT", "IRON_DEFENSE"], repartition: "atk_pv" },
    { espece: 64, nature: "timide", objet: "TWISTEDSPOON", attaques: ["PSYCHIC_M", "RECOVER", "REFLECT", "SHADOW_BALL"], repartition: "sat_vit" },
    { espece: 67, nature: "rigide", objet: "BLACKBELT_I", attaques: ["CROSS_CHOP", "ROCK_SLIDE", "SEISMIC_TOSS", "BULK_UP"], repartition: "atk_pv" },
    { espece: 75, nature: "rigide", objet: "HARD_STONE", attaques: ["EARTHQUAKE", "ROCK_SLIDE", "EXPLOSION", "DEFENSE_CURL"], repartition: "atk_pv" },
    { espece: 264, nature: "rigide", objet: "SILK_SCARF", attaques: ["SLASH", "HEADBUTT", "BELLY_DRUM", "REST"], repartition: "atk_vit" },
    { espece: 271, nature: "calme", objet: "SITRUS_BERRY", attaques: ["SURF", "GIGA_DRAIN", "LEECH_SEED", "PROTECT"], repartition: "pv_sat" },
    { espece: 274, nature: "mauvais", objet: "BLACKGLASSES", attaques: ["FAINT_ATTACK", "GIGA_DRAIN", "EXTRASENSORY", "EXPLOSION"], repartition: "atk_vit" },
    { espece: 294, nature: "modeste", objet: "SILK_SCARF", attaques: ["HYPER_VOICE", "UPROAR", "BITE", "HOWL"], repartition: "pv_sat" },
    { espece: 296, nature: "rigide", objet: "BLACKBELT_I", attaques: ["ARM_THRUST", "BELLY_DRUM", "KNOCK_OFF", "SMELLING_SALTS"], repartition: "atk_pv" },
    { espece: 299, nature: "malin", objet: "HARD_STONE", attaques: ["ROCK_SLIDE", "THUNDER_WAVE", "REST", "ROCK_TOMB"], repartition: "pv_def" },
    { espece: 300, nature: "jovial", objet: "SILK_SCARF", attaques: ["DOUBLESLAP", "FAINT_ATTACK", "SING", "CHARM"], repartition: "atk_vit" },
    { espece: 302, nature: "calme", objet: "LEFTOVERS", attaques: ["SHADOW_BALL", "NIGHT_SHADE", "CONFUSE_RAY", "RECOVER"], repartition: "pv_def" },
    { espece: 303, nature: "rigide", objet: "METAL_COAT", attaques: ["IRON_DEFENSE", "CRUNCH", "SLUDGE_BOMB", "SWORDS_DANCE"], repartition: "atk_pv" },
    { espece: 307, nature: "jovial", objet: "BLACKBELT_I", attaques: ["HI_JUMP_KICK", "PSYCHIC_M", "CALM_MIND", "RECOVER"], repartition: "atk_vit" },
    { espece: 309, nature: "timide", objet: "MAGNET", attaques: ["SPARK", "QUICK_ATTACK", "HOWL", "THUNDER_WAVE"], repartition: "sat_vit" },
    { espece: 311, nature: "timide", objet: "MAGNET", attaques: ["THUNDERBOLT", "SPARK", "AGILITY", "ENCORE"], repartition: "sat_vit" },
    { espece: 312, nature: "timide", objet: "MAGNET", attaques: ["THUNDERBOLT", "QUICK_ATTACK", "CHARM", "ENCORE"], repartition: "sat_vit" },
    { espece: 315, nature: "modeste", objet: "POISON_BARB", attaques: ["GIGA_DRAIN", "SLUDGE_BOMB", "STUN_SPORE", "SYNTHESIS"], repartition: "sat_vit" },
    { espece: 316, nature: "calme", objet: "SITRUS_BERRY", attaques: ["SLUDGE_BOMB", "YAWN", "PAIN_SPLIT", "TOXIC"], repartition: "pv_def" },
    { espece: 318, nature: "rigide", objet: "MYSTIC_WATER", attaques: ["CRUNCH", "WATER_PULSE", "SCARY_FACE", "SCREECH"], repartition: "atk_vit" },
    { espece: 322, nature: "discret", objet: "CHARCOAL", attaques: ["FLAMETHROWER", "EARTHQUAKE", "MAGNITUDE", "ROCK_SLIDE"], repartition: "atk_pv" },
    { espece: 325, nature: "calme", objet: "TWISTEDSPOON", attaques: ["PSYCHIC_M", "CONFUSE_RAY", "REST", "SNORE"], repartition: "pv_sat" },
    { espece: 328, nature: "rigide", objet: "SOFT_SAND", attaques: ["EARTHQUAKE", "CRUNCH", "ROCK_SLIDE", "SAND_ATTACK"], repartition: "atk_pv" },
    { espece: 331, nature: "rigide", objet: "MIRACLE_SEED", attaques: ["NEEDLE_ARM", "FAINT_ATTACK", "COTTON_SPORE", "POISON_STING"], repartition: "atk_vit" },
    { espece: 341, nature: "rigide", objet: "MYSTIC_WATER", attaques: ["CRABHAMMER", "SWORDS_DANCE", "KNOCK_OFF", "TAUNT"], repartition: "atk_pv" },
    { espece: 343, nature: "modeste", objet: "SOFT_SAND", attaques: ["EARTHQUAKE", "PSYBEAM", "ANCIENTPOWER", "LIGHT_SCREEN"], repartition: "pv_def" }
  ];

  var TIER2 = [
    { espece: 254, nature: "timide", objet: "MIRACLE_SEED", attaques: ["LEAF_BLADE", "CRUNCH", "DRAGON_CLAW", "QUICK_ATTACK"], repartition: "sat_vit" },
    { espece: 272, nature: "modeste", objet: "LEFTOVERS", attaques: ["SURF", "GIGA_DRAIN", "ICE_BEAM", "RAIN_DANCE"], repartition: "pv_sat" },
    { espece: 275, nature: "naif", objet: "BLACKGLASSES", attaques: ["FAINT_ATTACK", "GIGA_DRAIN", "EXPLOSION", "SHADOW_BALL"], repartition: "atk_vit" },
    { espece: 277, nature: "jovial", objet: "SILK_SCARF", attaques: ["AERIAL_ACE", "FACADE", "STEEL_WING", "QUICK_ATTACK"], repartition: "atk_vit" },
    { espece: 279, nature: "modeste", objet: "MYSTIC_WATER", attaques: ["SURF", "WING_ATTACK", "ICE_BEAM", "PROTECT"], repartition: "pv_sat" },
    { espece: 284, nature: "modeste", objet: "SILVERPOWDER", attaques: ["SILVER_WIND", "WATER_PULSE", "ICE_BEAM", "STUN_SPORE"], repartition: "sat_vit" },
    { espece: 291, nature: "jovial", objet: "LIECHI_BERRY", attaques: ["SWORDS_DANCE", "BATON_PASS", "SLASH", "SILVER_WIND"], repartition: "atk_vit" },
    { espece: 292, nature: "rigide", objet: "LUM_BERRY", attaques: ["SHADOW_BALL", "SWORDS_DANCE", "CONFUSE_RAY", "FURY_CUTTER"], repartition: "atk_vit" },
    { espece: 295, nature: "modeste", objet: "SILK_SCARF", attaques: ["HYPER_VOICE", "FLAMETHROWER", "SHADOW_BALL", "ICE_BEAM"], repartition: "pv_sat" },
    { espece: 297, nature: "rigide", objet: "BLACKBELT_I", attaques: ["CROSS_CHOP", "EARTHQUAKE", "ROCK_SLIDE", "BELLY_DRUM"], repartition: "atk_pv" },
    { espece: 306, nature: "rigide", objet: "QUICK_CLAW", attaques: ["IRON_TAIL", "ROCK_SLIDE", "EARTHQUAKE", "DOUBLE_EDGE"], repartition: "atk_pv" },
    { espece: 308, nature: "jovial", objet: "BLACKBELT_I", attaques: ["HI_JUMP_KICK", "SHADOW_BALL", "ROCK_SLIDE", "FAKE_OUT"], repartition: "atk_vit" },
    { espece: 310, nature: "timide", objet: "MAGNET", attaques: ["THUNDERBOLT", "CRUNCH", "THUNDER_WAVE", "QUICK_ATTACK"], repartition: "sat_vit" },
    { espece: 323, nature: "modeste", objet: "CHARCOAL", attaques: ["FIRE_BLAST", "EARTHQUAKE", "ROCK_SLIDE", "ERUPTION"], repartition: "atk_pv" },
    { espece: 324, nature: "assure", objet: "WHITE_HERB", attaques: ["OVERHEAT", "BODY_SLAM", "IRON_DEFENSE", "REST"], repartition: "pv_def" },
    { espece: 326, nature: "calme", objet: "TWISTEDSPOON", attaques: ["PSYCHIC_M", "CALM_MIND", "CONFUSE_RAY", "REST"], repartition: "pv_sat" },
    { espece: 327, nature: "brave", objet: "SILK_SCARF", attaques: ["TEETER_DANCE", "FACADE", "PSYCHIC_M", "HYPNOSIS"], repartition: "equilibre" },
    { espece: 330, nature: "jovial", objet: "SOFT_SAND", attaques: ["EARTHQUAKE", "ROCK_SLIDE", "DRAGON_CLAW", "FIRE_BLAST"], repartition: "atk_vit" },
    { espece: 334, nature: "calme", objet: "LEFTOVERS", attaques: ["DRAGON_DANCE", "AERIAL_ACE", "EARTHQUAKE", "REST"], repartition: "pv_def" },
    { espece: 335, nature: "jovial", objet: "SILK_SCARF", attaques: ["SWORDS_DANCE", "SLASH", "SHADOW_BALL", "BRICK_BREAK"], repartition: "atk_vit" },
    { espece: 336, nature: "brave", objet: "POISON_BARB", attaques: ["SLUDGE_BOMB", "CRUNCH", "FLAMETHROWER", "GIGA_DRAIN"], repartition: "atk_pv" },
    { espece: 337, nature: "modeste", objet: "HARD_STONE", attaques: ["PSYCHIC_M", "ROCK_SLIDE", "CALM_MIND", "HYPNOSIS"], repartition: "sat_vit" },
    { espece: 338, nature: "rigide", objet: "HARD_STONE", attaques: ["ROCK_SLIDE", "EARTHQUAKE", "SHADOW_BALL", "EXPLOSION"], repartition: "atk_pv" },
    { espece: 340, nature: "modeste", objet: "MYSTIC_WATER", attaques: ["EARTHQUAKE", "SURF", "ICE_BEAM", "SPARK"], repartition: "atk_pv" },
    { espece: 342, nature: "rigide", objet: "BLACKGLASSES", attaques: ["CRABHAMMER", "SWORDS_DANCE", "CRUNCH", "SLUDGE_BOMB"], repartition: "atk_pv" },
    { espece: 344, nature: "assure", objet: "LEFTOVERS", attaques: ["EARTHQUAKE", "PSYCHIC_M", "ICE_BEAM", "REFLECT"], repartition: "pv_def" },
    { espece: 346, nature: "calme", objet: "LEFTOVERS", attaques: ["ANCIENTPOWER", "GIGA_DRAIN", "RECOVER", "CONFUSE_RAY"], repartition: "pv_def" },
    { espece: 348, nature: "rigide", objet: "HARD_STONE", attaques: ["ROCK_SLIDE", "SWORDS_DANCE", "EARTHQUAKE", "AERIAL_ACE"], repartition: "atk_pv" },
    { espece: 354, nature: "rigide", objet: "SPELL_TAG", attaques: ["SHADOW_BALL", "WILL_O_WISP", "DESTINY_BOND", "FAINT_ATTACK"], repartition: "atk_vit" },
    { espece: 356, nature: "calme", objet: "LEFTOVERS", attaques: ["SHADOW_BALL", "WILL_O_WISP", "CONFUSE_RAY", "PAIN_SPLIT"], repartition: "pv_def" },
    { espece: 357, nature: "calme", objet: "SITRUS_BERRY", attaques: ["SOLARBEAM", "SYNTHESIS", "AERIAL_ACE", "BODY_SLAM"], repartition: "pv_def" },
    { espece: 359, nature: "jovial", objet: "SCOPE_LENS", attaques: ["SWORDS_DANCE", "SLASH", "SHADOW_BALL", "ROCK_SLIDE"], repartition: "atk_vit" },
    { espece: 362, nature: "timide", objet: "NEVERMELTICE", attaques: ["ICE_BEAM", "CRUNCH", "EXPLOSION", "SPIKES"], repartition: "sat_vit" },
    { espece: 364, nature: "calme", objet: "NEVERMELTICE", attaques: ["SURF", "ICE_BEAM", "BODY_SLAM", "REST"], repartition: "pv_sat" },
    { espece: 365, nature: "modeste", objet: "LEFTOVERS", attaques: ["SURF", "ICE_BEAM", "BODY_SLAM", "REST"], repartition: "pv_sat" },
    { espece: 367, nature: "rigide", objet: "MYSTIC_WATER", attaques: ["HYDRO_PUMP", "CRUNCH", "ICE_BEAM", "BATON_PASS"], repartition: "atk_pv" },
    { espece: 368, nature: "modeste", objet: "MYSTIC_WATER", attaques: ["SURF", "ICE_BEAM", "PSYCHIC_M", "BATON_PASS"], repartition: "sat_vit" },
    { espece: 369, nature: "rigide", objet: "HARD_STONE", attaques: ["ROCK_SLIDE", "EARTHQUAKE", "WATERFALL", "DOUBLE_EDGE"], repartition: "pv_def" },
    { espece: 370, nature: "timide", objet: "PETAYA_BERRY", attaques: ["SURF", "ICE_BEAM", "SWEET_KISS", "ATTRACT"], repartition: "sat_vit" }
  ];

  var TIER3 = [
    { espece: 376, nature: "rigide", objet: "CHOICE_BAND", attaques: ["METEOR_MASH", "EARTHQUAKE", "SHADOW_BALL", "EXPLOSION"], repartition: "atk_pv" },
    { espece: 373, nature: "rigide", objet: "CHOICE_BAND", attaques: ["DRAGON_DANCE", "EARTHQUAKE", "ROCK_SLIDE", "AERIAL_ACE"], repartition: "atk_vit" },
    { espece: 260, nature: "rigide", objet: "LEFTOVERS", attaques: ["SURF", "EARTHQUAKE", "ICE_BEAM", "PROTECT"], repartition: "atk_pv" },
    { espece: 257, nature: "jovial", objet: "SALAC_BERRY", attaques: ["FLAMETHROWER", "SKY_UPPERCUT", "SWORDS_DANCE", "ROCK_SLIDE"], repartition: "atk_vit" },
    { espece: 143, nature: "prudent", objet: "LEFTOVERS", attaques: ["BODY_SLAM", "EARTHQUAKE", "REST", "SHADOW_BALL"], repartition: "pv_def" },
    { espece: 121, nature: "timide", objet: "PETAYA_BERRY", attaques: ["SURF", "THUNDERBOLT", "ICE_BEAM", "RECOVER"], repartition: "sat_vit" },
    { espece: 94, nature: "timide", objet: "WHITE_HERB", attaques: ["THUNDERBOLT", "ICE_PUNCH", "FIRE_PUNCH", "DESTINY_BOND"], repartition: "sat_vit" },
    { espece: 135, nature: "timide", objet: "MAGNET", attaques: ["THUNDERBOLT", "SHADOW_BALL", "THUNDER_WAVE", "BITE"], repartition: "sat_vit" },
    { espece: 134, nature: "assure", objet: "LEFTOVERS", attaques: ["SURF", "ICE_BEAM", "TOXIC", "PROTECT"], repartition: "pv_def" },
    { espece: 136, nature: "rigide", objet: "CHARCOAL", attaques: ["FLAMETHROWER", "SHADOW_BALL", "BODY_SLAM", "QUICK_ATTACK"], repartition: "atk_pv" },
    { espece: 65, nature: "timide", objet: "TWISTEDSPOON", attaques: ["PSYCHIC_M", "FIRE_PUNCH", "THUNDERPUNCH", "CALM_MIND"], repartition: "sat_vit" },
    { espece: 68, nature: "rigide", objet: "FOCUS_BAND", attaques: ["CROSS_CHOP", "ROCK_SLIDE", "EARTHQUAKE", "BULK_UP"], repartition: "atk_pv" },
    { espece: 248, nature: "rigide", objet: "CHOICE_BAND", attaques: ["ROCK_SLIDE", "EARTHQUAKE", "CRUNCH", "DRAGON_DANCE"], repartition: "atk_pv" },
    { espece: 212, nature: "rigide", objet: "METAL_COAT", attaques: ["SWORDS_DANCE", "STEEL_WING", "AERIAL_ACE", "QUICK_ATTACK"], repartition: "atk_pv" },
    { espece: 214, nature: "jovial", objet: "CHOICE_BAND", attaques: ["MEGAHORN", "BRICK_BREAK", "ROCK_SLIDE", "EARTHQUAKE"], repartition: "atk_vit" },
    { espece: 242, nature: "assure", objet: "LEFTOVERS", attaques: ["SOFTBOILED", "TOXIC", "SEISMIC_TOSS", "ICE_BEAM"], repartition: "pv_def" },
    { espece: 227, nature: "malin", objet: "LEFTOVERS", attaques: ["SPIKES", "ROAR", "AERIAL_ACE", "TOXIC"], repartition: "pv_def" },
    { espece: 350, nature: "assure", objet: "LEFTOVERS", attaques: ["SURF", "ICE_BEAM", "RECOVER", "TOXIC"], repartition: "pv_def" },
    { espece: 286, nature: "jovial", objet: "FOCUS_BAND", attaques: ["SPORE", "FOCUS_PUNCH", "MACH_PUNCH", "HEADBUTT"], repartition: "atk_vit" },
    { espece: 85, nature: "jovial", objet: "CHOICE_BAND", attaques: ["DRILL_PECK", "DOUBLE_EDGE", "QUICK_ATTACK", "STEEL_WING"], repartition: "atk_vit" },
    { espece: 130, nature: "rigide", objet: "LEFTOVERS", attaques: ["DRAGON_DANCE", "EARTHQUAKE", "DOUBLE_EDGE", "HYDRO_PUMP"], repartition: "atk_vit" },
    { espece: 6, nature: "timide", objet: "CHARCOAL", attaques: ["FLAMETHROWER", "DRAGON_CLAW", "AIR_CUTTER", "EARTHQUAKE"], repartition: "sat_vit" },
    { espece: 9, nature: "assure", objet: "LEFTOVERS", attaques: ["SURF", "ICE_BEAM", "REST", "PROTECT"], repartition: "pv_def" },
    { espece: 3, nature: "modeste", objet: "MIRACLE_SEED", attaques: ["SOLARBEAM", "SLUDGE_BOMB", "SLEEP_POWDER", "SYNTHESIS"], repartition: "sat_vit" },
    { espece: 115, nature: "jovial", objet: "SILK_SCARF", attaques: ["BODY_SLAM", "EARTHQUAKE", "SHADOW_BALL", "FAKE_OUT"], repartition: "atk_vit" },
    { espece: 128, nature: "jovial", objet: "CHOICE_BAND", attaques: ["DOUBLE_EDGE", "EARTHQUAKE", "IRON_TAIL", "ROCK_SLIDE"], repartition: "atk_vit" },
    { espece: 131, nature: "modeste", objet: "LEFTOVERS", attaques: ["ICE_BEAM", "SURF", "THUNDERBOLT", "CONFUSE_RAY"], repartition: "pv_sat" },
    { espece: 149, nature: "rigide", objet: "LUM_BERRY", attaques: ["DRAGON_DANCE", "EARTHQUAKE", "AERIAL_ACE", "FIRE_BLAST"], repartition: "atk_vit" },
    { espece: 195, nature: "relax", objet: "LEFTOVERS", attaques: ["EARTHQUAKE", "SURF", "ICE_BEAM", "RECOVER"], repartition: "pv_def" },
    { espece: 196, nature: "timide", objet: "TWISTEDSPOON", attaques: ["PSYCHIC_M", "CALM_MIND", "MORNING_SUN", "BITE"], repartition: "sat_vit" },
    { espece: 197, nature: "calme", objet: "LEFTOVERS", attaques: ["TOXIC", "CONFUSE_RAY", "MOONLIGHT", "FAINT_ATTACK"], repartition: "pv_def" },
    { espece: 205, nature: "relax", objet: "LEFTOVERS", attaques: ["SPIKES", "EXPLOSION", "EARTHQUAKE", "TOXIC"], repartition: "pv_def" },
    { espece: 217, nature: "rigide", objet: "SILK_SCARF", attaques: ["SLASH", "EARTHQUAKE", "FIRE_PUNCH", "BRICK_BREAK"], repartition: "atk_pv" },
    { espece: 229, nature: "timide", objet: "CHARCOAL", attaques: ["FLAMETHROWER", "CRUNCH", "WILL_O_WISP", "SOLARBEAM"], repartition: "sat_vit" },
    { espece: 230, nature: "modeste", objet: "LUM_BERRY", attaques: ["DRAGON_DANCE", "SURF", "ICE_BEAM", "DOUBLE_EDGE"], repartition: "sat_vit" },
    { espece: 232, nature: "rigide", objet: "SOFT_SAND", attaques: ["EARTHQUAKE", "ROCK_SLIDE", "RAPID_SPIN", "ROAR"], repartition: "atk_pv" },
    { espece: 233, nature: "calme", objet: "LEFTOVERS", attaques: ["THUNDERBOLT", "ICE_BEAM", "RECOVER", "THUNDER_WAVE"], repartition: "pv_sat" },
    { espece: 237, nature: "rigide", objet: "BLACKBELT_I", attaques: ["HI_JUMP_KICK", "MACH_PUNCH", "RAPID_SPIN", "ROCK_SLIDE"], repartition: "atk_pv" },
    { espece: 282, nature: "modeste", objet: "LUM_BERRY", attaques: ["PSYCHIC_M", "CALM_MIND", "THUNDERBOLT", "WILL_O_WISP"], repartition: "sat_vit" },
    { espece: 373, nature: "timide", objet: "PETAYA_BERRY", attaques: ["DRAGON_CLAW", "FLAMETHROWER", "HYDRO_PUMP", "CRUNCH"], repartition: "sat_vit" },
    { espece: 376, nature: "rigide", objet: "LIECHI_BERRY", attaques: ["AGILITY", "METEOR_MASH", "EARTHQUAKE", "EXPLOSION"], repartition: "atk_vit" },
    { espece: 272, nature: "modeste", objet: "MYSTIC_WATER", attaques: ["SURF", "ICE_BEAM", "GIGA_DRAIN", "RAIN_DANCE"], repartition: "sat_vit" }
  ];

  // Tier 4 = Tier 3 + Légendaires autorisés en Zone de Combat
  var TIER4_LEGENDAIRES = [
    { espece: 144, nature: "calme", objet: "LEFTOVERS", attaques: ["ICE_BEAM", "AERIAL_ACE", "WATER_PULSE", "REFLECT"], repartition: "pv_def" },
    { espece: 145, nature: "timide", objet: "LEFTOVERS", attaques: ["THUNDERBOLT", "THUNDER_WAVE", "DRILL_PECK", "LIGHT_SCREEN"], repartition: "sat_vit" },
    { espece: 146, nature: "modeste", objet: "CHARCOAL", attaques: ["FIRE_BLAST", "AIR_CUTTER", "WILL_O_WISP", "AGILITY"], repartition: "sat_vit" },
    { espece: 243, nature: "timide", objet: "LEFTOVERS", attaques: ["THUNDERBOLT", "CALM_MIND", "CRUNCH", "REFLECT"], repartition: "sat_vit" },
    { espece: 244, nature: "rigide", objet: "CHARCOAL", attaques: ["FIRE_BLAST", "DOUBLE_EDGE", "SOLARBEAM", "CALM_MIND"], repartition: "atk_vit" },
    { espece: 245, nature: "assure", objet: "LEFTOVERS", attaques: ["SURF", "ICE_BEAM", "CALM_MIND", "REST"], repartition: "pv_def" },
    { espece: 377, nature: "malin", objet: "LEFTOVERS", attaques: ["ROCK_SLIDE", "EARTHQUAKE", "EXPLOSION", "CURSE"], repartition: "pv_def" },
    { espece: 378, nature: "modeste", objet: "LEFTOVERS", attaques: ["ICE_BEAM", "THUNDERBOLT", "REST", "AMNESIA"], repartition: "pv_sat" },
    { espece: 379, nature: "calme", objet: "LEFTOVERS", attaques: ["SEISMIC_TOSS", "TOXIC", "PROTECT", "REST"], repartition: "pv_def" },
    { espece: 380, nature: "timide", objet: "LEFTOVERS", attaques: ["CALM_MIND", "DRAGON_CLAW", "PSYCHIC_M", "RECOVER"], repartition: "sat_vit" },
    { espece: 381, nature: "timide", objet: "PETAYA_BERRY", attaques: ["DRAGON_CLAW", "PSYCHIC_M", "THUNDERBOLT", "ICE_BEAM"], repartition: "sat_vit" }
  ];

  var TIER4 = TIER3.concat(TIER4_LEGENDAIRES);

  W.POKE_GEN3_SETS_USINE = {
    tier1: TIER1,
    tier2: TIER2,
    tier3: TIER3,
    tier4: TIER4
  };

})(typeof window !== "undefined" ? window : globalThis);
