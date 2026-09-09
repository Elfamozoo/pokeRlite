(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES OBJETS TENUS DE LA TROISIÈME GÉNÉRATION (HOENN — ÉMERAUDE)
  //
  //  Ce fichier définit les métadonnées numériques et effets des objets tenus
  //  compétitifs de la 3e génération (Bandeau Choix, Restes, Herbe Blanche,
  //  Baies compétitives, etc.).
  // ═══════════════════════════════════════════════════════════════════════════

  //  Les dix-sept renforts de type : ×1,1 sur les dégâts d'un coup du même type.
  var BOOST = {
    HELD_NORMAL_BOOST: "normal",
    HELD_FIGHTING_BOOST: "fighting",
    HELD_FLYING_BOOST: "flying",
    HELD_POISON_BOOST: "poison",
    HELD_GROUND_BOOST: "ground",
    HELD_ROCK_BOOST: "rock",
    HELD_BUG_BOOST: "bug",
    HELD_GHOST_BOOST: "ghost",
    HELD_STEEL_BOOST: "steel",
    HELD_FIRE_BOOST: "fire",
    HELD_WATER_BOOST: "water",
    HELD_GRASS_BOOST: "grass",
    HELD_ELECTRIC_BOOST: "electric",
    HELD_PSYCHIC_BOOST: "psychic",
    HELD_ICE_BOOST: "ice",
    HELD_DRAGON_BOOST: "dragon",
    HELD_DARK_BOOST: "dark",
  };

  W.POKE_GEN3_TENUS = {
    // Renforts de type : ×1,1
    boost: BOOST,
    boostFacteur: 1.1,

    // Restes (Leftovers) : soigne 1/16 PV max par tour
    leftovers: { effet: "HELD_LEFTOVERS", part: 16 },

    // Bandeau Choix (Choice Band) : +50% Attaque physique, bloque sur la première capacité
    choiceBand: { effet: "HELD_CHOICE_BAND", facteur: 1.5, bloque: true },

    // Herbe Blanche (White Herb) : restaure les paliers négatifs et se consomme
    whiteHerb: { effet: "HELD_WHITE_HERB", restaurePaliersNegatifs: true, consomme: true },

    // Vive Griffe (Quick Claw) : 60 / 256 chances d'agir en premier à priorité égale
    quickClaw: { effet: "HELD_QUICK_CLAW", sur: 256, seuil: 60 },
    viveGriffe: { effet: "HELD_QUICK_CLAW", sur: 256, seuil: 60 },

    // Lentille Scope (Scope Lens) : double le taux de coup critique
    scopeLens: { effet: "HELD_CRITICAL_UP", facteur: 2 },
    critique: { effet: "HELD_CRITICAL_UP", facteur: 2 },

    // Bandeau (Focus Band) : 26 / 256 (environ 10%) chances de survivre à 1 PV
    focusBand: { effet: "HELD_FOCUS_BAND", sur: 256, seuil: 26 },

    // Poudre Claire (Brightpowder) : précision adverse ×0,9
    brightpowder: { effet: "HELD_BRIGHTPOWDER", precision: 0.9 },

    // Roche Royale (King's Rock) : 30 / 256 chances d'apeurer sur coup porté
    flinch: { effet: "HELD_FLINCH", sur: 256, seuil: 30 },

    // Baie Mepo (Leppa Berry) : rend 10 PP au coup épuisé
    rendPP: { effet: "HELD_RESTORE_PP", pp: 10 },

    // ── Les Baies ────────────────────────────────────────────────────────────
    baies: {
      HELD_BERRY: { soigne: 10, seuil: 0.5, consomme: true },
      HELD_SITRUS_BERRY: { soigne: 30, seuil: 0.5, consomme: true },
      HELD_LUM_BERRY: { soigneStatuts: true, soigneConfusion: true, consomme: true },
      HELD_CHESTO_BERRY: { statut: "sommeil", consomme: true },
      HELD_PECHA_BERRY: { statuts: ["poison", "poisonGrave"], consomme: true },
      HELD_RAWST_BERRY: { statut: "brulure", consomme: true },
      HELD_ASPEAR_BERRY: { statut: "gel", consomme: true },
      HELD_CHERI_BERRY: { statut: "para", consomme: true },
      HELD_PERSIM_BERRY: { soigneConfusion: true, consomme: true },
    },

    // Baies de statut qui lèvent l'état
    soins: {
      HELD_HEAL_POISON: ["poison", "poisonGrave"],
      HELD_HEAL_PARALYZE: ["para"],
      HELD_HEAL_FREEZE: ["gel"],
      HELD_HEAL_BURN: ["brulure"],
      HELD_HEAL_SLEEP: ["sommeil"],
      HELD_HEAL_STATUS: ["poison", "poisonGrave", "para", "gel", "brulure", "sommeil"],
      HELD_LUM_BERRY: ["poison", "poisonGrave", "para", "gel", "brulure", "sommeil"],
      HELD_CHESTO_BERRY: ["sommeil"],
      HELD_PECHA_BERRY: ["poison", "poisonGrave"],
      HELD_RAWST_BERRY: ["brulure"],
      HELD_ASPEAR_BERRY: ["gel"],
      HELD_CHERI_BERRY: ["para"],
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
