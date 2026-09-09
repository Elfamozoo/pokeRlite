// ═══════════════════════════════════════════════════════════════════════
//  FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
//  Produit par : node tools/poke-concours-gen2.mjs
//  Sources     : pret/pokecrystal data/wild/bug_contest_mons.asm · pret/pokecrystal maps/Route36NationalParkGate.asm (verbosegiveitem) · pret/pokecrystal engine/events/bug_contest/judging.asm (ContestScore)
//  Toute correction se fait dans le générateur, jamais ici.
// ═══════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";
  // Le vivier du Concours de capture d'insectes du Parc National. Les poids
  // sont ceux du ROM et somment à 100 : le tirage n'a pas de reste.
  W.POKE_GEN2_CONCOURS = {"vivier":[{"n":10,"poids":20,"min":7,"max":18},{"n":13,"poids":20,"min":7,"max":18},{"n":11,"poids":10,"min":9,"max":18},{"n":14,"poids":10,"min":9,"max":18},{"n":12,"poids":5,"min":12,"max":15},{"n":15,"poids":5,"min":12,"max":15},{"n":48,"poids":10,"min":10,"max":16},{"n":46,"poids":10,"min":10,"max":17},{"n":123,"poids":5,"min":13,"max":14},{"n":127,"poids":5,"min":13,"max":14}],"jamaisTire":{"n":49,"pourquoi":"rang terminateur -1, le vivier somme deja a 100 %"},"prix":{"premier":"SUN_STONE","deuxieme":"EVERSTONE","troisieme":"GOLD_BERRY","participation":"BERRY"},"bareme":{"pvMax":4,"atk":1,"def":1,"vit":1,"sat":1,"sdf":1,"pvRestantsSur":8,"objetTenu":1,"dvBit":2,"dvPoids":{"vit":1,"spe":4,"atk":8,"def":16}},"balls":20,"etape":"parc-national"};
})(typeof window !== "undefined" ? window : globalThis);
