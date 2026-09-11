(function (W) {
  "use strict";

  // Table des paliers et effets propres à la troisième génération.
  var PALIERS = {
    EFFECT_BULK_UP: [["atk", "def"], 1, 100],
    EFFECT_CALM_MIND: [["sat", "sdf"], 1, 100],
    EFFECT_DRAGON_DANCE: [["atk", "vit"], 1, 100],
    EFFECT_COSMIC_POWER: [["def", "sdf"], 1, 100],
    EFFECT_TICKLE: [["atk", "def"], -1, 100],
    EFFECT_HOWL: ["atk", 1, 100],
    EFFECT_IRON_DEFENSE: ["def", 2, 100],
    EFFECT_TAIL_GLOW: ["sat", 2, 100],
    EFFECT_FEATHER_DANCE: ["atk", -2, 100],
    EFFECT_FAKE_TEARS: ["sdf", -2, 100],
    EFFECT_METAL_SOUND: ["sdf", -2, 100],
  };

  var METEO = {
    EFFECT_RAIN_DANCE: { cle: "pluie", tours: 5 },
    EFFECT_SUNNY_DAY: { cle: "zenith", tours: 5 },
    EFFECT_SANDSTORM: { cle: "sable", tours: 5 },
    EFFECT_HAIL: { cle: "grele", tours: 5 },
  };

  var METEO_DEGATS = {
    pluie: { water: 1.5, fire: 0.5 },
    zenith: { fire: 1.5, water: 0.5 },
    sable: {},
    grele: {},
  };

  var METEO_USURE = {
    sable: { part: 16, epargne: ["rock", "ground", "steel"] },
    grele: { part: 16, epargne: ["ice"] },
  };

  W.POKE_GEN3_EFFETS_NEUFS_TABLE = {
    paliers: PALIERS,
    durees: {},
    meteo: METEO,
    meteoDegats: METEO_DEGATS,
    meteoUsure: METEO_USURE,
  };
})(typeof window !== "undefined" ? window : globalThis);
