(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  HOENN (GEN 3) — CAPSULES TECHNIQUES & SECRÈTES  [09/09/2026]
  //  50 CTs canoniques (CT01 à CT50) et 8 CSs (CS01 à CS08 - Émeraude).
  // ═══════════════════════════════════════════════════════════════════════════

  W.POKE_GEN3_CT = [
    { n: 1, cle: "FOCUS_PUNCH", prix: 3000, type: "fighting" },
    { n: 2, cle: "DRAGON_CLAW", prix: 3000, type: "dragon" },
    { n: 3, cle: "WATER_PULSE", prix: 3000, type: "water" },
    { n: 4, cle: "CALM_MIND", prix: 3000, type: "psychic" },
    { n: 5, cle: "ROAR", prix: 1000, type: "normal" },
    { n: 6, cle: "TOXIC", prix: 3000, type: "poison" },
    { n: 7, cle: "HAIL", prix: 3000, type: "ice" },
    { n: 8, cle: "BULK_UP", prix: 3000, type: "fighting" },
    { n: 9, cle: "BULLET_SEED", prix: 2000, type: "grass" },
    { n: 10, cle: "HIDDEN_POWER", prix: 3000, type: "normal" },
    { n: 11, cle: "SUNNY_DAY", prix: 2000, type: "fire" },
    { n: 12, cle: "TAUNT", prix: 3000, type: "dark" },
    { n: 13, cle: "ICE_BEAM", prix: 4000, type: "ice" },
    { n: 14, cle: "BLIZZARD", prix: 5500, type: "ice" },
    { n: 15, cle: "HYPER_BEAM", prix: 7500, type: "normal" },
    { n: 16, cle: "LIGHT_SCREEN", prix: 3000, type: "psychic" },
    { n: 17, cle: "PROTECT", prix: 3000, type: "normal" },
    { n: 18, cle: "RAIN_DANCE", prix: 2000, type: "water" },
    { n: 19, cle: "GIGA_DRAIN", prix: 3000, type: "grass" },
    { n: 20, cle: "SAFEGUARD", prix: 3000, type: "normal" },
    { n: 21, cle: "FRUSTRATION", prix: 1000, type: "normal" },
    { n: 22, cle: "SOLARBEAM", prix: 3000, type: "grass" },
    { n: 23, cle: "IRON_TAIL", prix: 3000, type: "steel" },
    { n: 24, cle: "THUNDERBOLT", prix: 4000, type: "electric" },
    { n: 25, cle: "THUNDER", prix: 5500, type: "electric" },
    { n: 26, cle: "EARTHQUAKE", prix: 3000, type: "ground" },
    { n: 27, cle: "RETURN", prix: 1000, type: "normal" },
    { n: 28, cle: "DIG", prix: 2000, type: "ground" },
    { n: 29, cle: "PSYCHIC_M", prix: 3500, type: "psychic" },
    { n: 30, cle: "SHADOW_BALL", prix: 3000, type: "ghost" },
    { n: 31, cle: "BRICK_BREAK", prix: 3000, type: "fighting" },
    { n: 32, cle: "DOUBLE_TEAM", prix: 2000, type: "normal" },
    { n: 33, cle: "REFLECT", prix: 3000, type: "psychic" },
    { n: 34, cle: "SHOCK_WAVE", prix: 3000, type: "electric" },
    { n: 35, cle: "FLAMETHROWER", prix: 4000, type: "fire" },
    { n: 36, cle: "SLUDGE_BOMB", prix: 3000, type: "poison" },
    { n: 37, cle: "SANDSTORM", prix: 2000, type: "rock" },
    { n: 38, cle: "FIRE_BLAST", prix: 5500, type: "fire" },
    { n: 39, cle: "ROCK_TOMB", prix: 3000, type: "rock" },
    { n: 40, cle: "AERIAL_ACE", prix: 3000, type: "flying" },
    { n: 41, cle: "TORMENT", prix: 3000, type: "dark" },
    { n: 42, cle: "FACADE", prix: 3000, type: "normal" },
    { n: 43, cle: "SECRET_POWER", prix: 3000, type: "normal" },
    { n: 44, cle: "REST", prix: 3000, type: "psychic" },
    { n: 45, cle: "ATTRACT", prix: 3000, type: "normal" },
    { n: 46, cle: "THIEF", prix: 3000, type: "dark" },
    { n: 47, cle: "STEEL_WING", prix: 3000, type: "steel" },
    { n: 48, cle: "SKILL_SWAP", prix: 3000, type: "psychic" },
    { n: 49, cle: "SNATCH", prix: 3000, type: "dark" },
    { n: 50, cle: "OVERHEAT", prix: 3000, type: "fire" }
  ];

  W.POKE_GEN3_CS = [
    { n: 1, cle: "CUT", cs: true, type: "normal" },
    { n: 2, cle: "FLY", cs: true, type: "flying" },
    { n: 3, cle: "SURF", cs: true, type: "water" },
    { n: 4, cle: "STRENGTH", cs: true, type: "normal" },
    { n: 5, cle: "FLASH", cs: true, type: "normal" },
    { n: 6, cle: "ROCK_SMASH", cs: true, type: "fighting" },
    { n: 7, cle: "WATERFALL", cs: true, type: "water" },
    { n: 8, cle: "DIVE", cs: true, type: "water" }
  ];

  W.POKE_GEN3_CT_PAR_CLE = (function () {
    var m = {};
    for (var i = 0; i < W.POKE_GEN3_CT.length; i++) m[W.POKE_GEN3_CT[i].cle] = W.POKE_GEN3_CT[i];
    for (var j = 0; j < W.POKE_GEN3_CS.length; j++) m[W.POKE_GEN3_CS[j].cle] = W.POKE_GEN3_CS[j];
    return m;
  })();
})(typeof window !== "undefined" ? window : globalThis);
