// ═══════════════════════════════════════════════════════════════════════
//  FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
//  Produit par : node tools/poke-ct.mjs
//  Sources     : constants/item_constants.asm · data/items/tm_prices.asm
//  Toute correction se fait dans le générateur, jamais ici.
// ═══════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";
  // Les 50 Capsules Techniques, dans l'ordre du jeu. `prix` est celui du ROM,
  // en pièces — le ROM le range en milliers, on le déplie ici une fois pour
  // toutes plutôt que de laisser chaque écran s'en souvenir.
  W.POKE_CT = [{"n":1,"cle":"MEGA_PUNCH","prix":3000,"type":"normal"},{"n":2,"cle":"RAZOR_WIND","prix":2000,"type":"normal"},{"n":3,"cle":"SWORDS_DANCE","prix":2000,"type":"normal"},{"n":4,"cle":"WHIRLWIND","prix":1000,"type":"normal"},{"n":5,"cle":"MEGA_KICK","prix":3000,"type":"normal"},{"n":6,"cle":"TOXIC","prix":4000,"type":"poison"},{"n":7,"cle":"HORN_DRILL","prix":2000,"type":"normal"},{"n":8,"cle":"BODY_SLAM","prix":4000,"type":"normal"},{"n":9,"cle":"TAKE_DOWN","prix":3000,"type":"normal"},{"n":10,"cle":"DOUBLE_EDGE","prix":4000,"type":"normal"},{"n":11,"cle":"BUBBLEBEAM","prix":2000,"type":"water"},{"n":12,"cle":"WATER_GUN","prix":1000,"type":"water"},{"n":13,"cle":"ICE_BEAM","prix":4000,"type":"ice"},{"n":14,"cle":"BLIZZARD","prix":5000,"type":"ice"},{"n":15,"cle":"HYPER_BEAM","prix":5000,"type":"normal"},{"n":16,"cle":"PAY_DAY","prix":5000,"type":"normal"},{"n":17,"cle":"SUBMISSION","prix":3000,"type":"fighting"},{"n":18,"cle":"COUNTER","prix":2000,"type":"fighting"},{"n":19,"cle":"SEISMIC_TOSS","prix":3000,"type":"fighting"},{"n":20,"cle":"RAGE","prix":2000,"type":"normal"},{"n":21,"cle":"MEGA_DRAIN","prix":5000,"type":"grass"},{"n":22,"cle":"SOLARBEAM","prix":5000,"type":"grass"},{"n":23,"cle":"DRAGON_RAGE","prix":5000,"type":"dragon"},{"n":24,"cle":"THUNDERBOLT","prix":2000,"type":"electric"},{"n":25,"cle":"THUNDER","prix":5000,"type":"electric"},{"n":26,"cle":"EARTHQUAKE","prix":4000,"type":"ground"},{"n":27,"cle":"FISSURE","prix":5000,"type":"ground"},{"n":28,"cle":"DIG","prix":2000,"type":"ground"},{"n":29,"cle":"PSYCHIC_M","prix":4000,"type":"psychic"},{"n":30,"cle":"TELEPORT","prix":1000,"type":"psychic"},{"n":31,"cle":"MIMIC","prix":2000,"type":"normal"},{"n":32,"cle":"DOUBLE_TEAM","prix":1000,"type":"normal"},{"n":33,"cle":"REFLECT","prix":1000,"type":"psychic"},{"n":34,"cle":"BIDE","prix":2000,"type":"normal"},{"n":35,"cle":"METRONOME","prix":4000,"type":"normal"},{"n":36,"cle":"SELFDESTRUCT","prix":2000,"type":"normal"},{"n":37,"cle":"EGG_BOMB","prix":2000,"type":"normal"},{"n":38,"cle":"FIRE_BLAST","prix":5000,"type":"fire"},{"n":39,"cle":"SWIFT","prix":2000,"type":"normal"},{"n":40,"cle":"SKULL_BASH","prix":4000,"type":"normal"},{"n":41,"cle":"SOFTBOILED","prix":2000,"type":"normal"},{"n":42,"cle":"DREAM_EATER","prix":2000,"type":"psychic"},{"n":43,"cle":"SKY_ATTACK","prix":5000,"type":"flying"},{"n":44,"cle":"REST","prix":2000,"type":"psychic"},{"n":45,"cle":"THUNDER_WAVE","prix":2000,"type":"electric"},{"n":46,"cle":"PSYWAVE","prix":4000,"type":"psychic"},{"n":47,"cle":"EXPLOSION","prix":3000,"type":"normal"},{"n":48,"cle":"ROCK_SLIDE","prix":4000,"type":"rock"},{"n":49,"cle":"TRI_ATTACK","prix":4000,"type":"normal"},{"n":50,"cle":"SUBSTITUTE","prix":2000,"type":"normal"}];

  // Les 5 Capsules Secrètes. Elles n'ont pas de prix : on ne les achète pas,
  // on les mérite — et elles ouvrent aussi des chemins sur la carte.
  W.POKE_CS = [{"n":1,"cle":"CUT","type":"normal"},{"n":2,"cle":"FLY","type":"flying"},{"n":3,"cle":"SURF","type":"water"},{"n":4,"cle":"STRENGTH","type":"normal"},{"n":5,"cle":"FLASH","type":"normal"}];

  // Retrouver une machine par le coup qu'elle enseigne.
  W.POKE_CT_PAR_CLE = (function () {
    var m = {};
    for (var i = 0; i < W.POKE_CT.length; i++) m[W.POKE_CT[i].cle] = W.POKE_CT[i];
    return m;
  })();
})(typeof window !== "undefined" ? window : globalThis);
