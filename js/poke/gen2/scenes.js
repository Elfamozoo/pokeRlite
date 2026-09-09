// ═══════════════════════════════════════════════════════════════════════
//  FICHIER GÉNÉRÉ — NE PAS ÉDITER À LA MAIN.
//  Produit par : node tools/poke-scenes-gen2.mjs
//  Sources     : pret/pokecrystal data/events/npc_trades.asm · pret/pokecrystal data/events/odd_eggs.asm · pret/pokecrystal data/wild/treemons.asm · treemon_maps.asm · pret/pokecrystal maps/*.asm (givepoke · giveegg · loadwildmon · trade)
//  Toute correction se fait dans le générateur, jamais ici.
// ═══════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";
  // Les échanges avec les PNJ de Johto. Trois des sept du ROM se tiennent à
  // Kanto — hors de cet itinéraire — et ne sont donc pas ici.
  W.POKE_GEN2_ECHANGES = [{"donne":63,"recoit":66,"surnom":"MUSCLE","etape":"doublonville"},{"donne":69,"recoit":95,"surnom":"ROCKY","etape":"mauville"},{"donne":98,"recoit":100,"surnom":"VOLTY","etape":"oliville-port"},{"donne":148,"recoit":85,"surnom":"DORIS","etape":"ebenelle"}];

  // Le Casino de Doublonville. Johto n'a qu'une version, Cristal : ses lots
  // sont les mêmes pour tout le monde, contrairement à ceux de 1996.
  W.POKE_GEN2_CASINO = {"cristal":[{"n":63,"jetons":100,"niveau":5},{"n":104,"jetons":800,"niveau":15},{"n":202,"jetons":1500,"niveau":15}]};

  // Les cadeaux. Ils portent l'ÉTAPE et non le lieu : à Johto, deux d'entre
  // eux se donnent au fond d'un donjon.
  W.POKE_GEN2_CADEAUX = [{"n":133,"niveau":20,"etape":"doublonville"},{"n":147,"niveau":15,"etape":"antre-dragon"},{"n":236,"niveau":10,"etape":"mont-creuset"},{"n":21,"niveau":10,"etape":"route-35"}];

  // Les rencontres posées à la main dans le ROM : Simularbre en travers de la
  // route, le Lokhlass des Caves Jumelles, le Léviator rouge, les Voltorbe du
  // repaire Rocket. Une seule tentative, comme un légendaire.
  W.POKE_GEN2_STATIQUES = [{"n":130,"niveau":30,"etape":"lac-colere"},{"n":185,"niveau":20,"etape":"route-36"},{"n":100,"niveau":23,"etape":"repaire-rocket"},{"n":74,"niveau":21,"etape":"repaire-rocket"},{"n":109,"niveau":21,"etape":"repaire-rocket"},{"n":101,"niveau":23,"etape":"repaire-rocket"},{"n":131,"niveau":20,"etape":"caves-jumelles"}];

  // Les œufs. Celui du Centre de Mauville porte Togepi ; l'Œuf Étrange de
  // Cristal porte les sept bébés que rien n'attrape dans la nature.
  W.POKE_GEN2_OEUFS = [{"cle":"togepi","etape":"mauville","niveau":5,"table":[{"n":175,"poids":100}]},{"cle":"etrange","etape":"route-34","niveau":5,"table":[{"n":172,"poids":9},{"n":173,"poids":19},{"n":174,"poids":19},{"n":238,"poids":16},{"n":240,"poids":12},{"n":239,"poids":14},{"n":236,"poids":11}]}];

  // Les arbres et les rochers. Deux tables par jeu : commune et rare.
  W.POKE_GEN2_ARBRES = {"jeux":{"canyon":{"commun":[{"poids":50,"n":21,"niveau":10},{"poids":15,"n":21,"niveau":10},{"poids":15,"n":21,"niveau":10},{"poids":10,"n":190,"niveau":10},{"poids":5,"n":190,"niveau":10},{"poids":5,"n":190,"niveau":10}],"rare":[{"poids":50,"n":21,"niveau":10},{"poids":15,"n":214,"niveau":10},{"poids":15,"n":214,"niveau":10},{"poids":10,"n":190,"niveau":10},{"poids":5,"n":190,"niveau":10},{"poids":5,"n":190,"niveau":10}]},"town":{"commun":[{"poids":50,"n":21,"niveau":10},{"poids":15,"n":23,"niveau":10},{"poids":15,"n":21,"niveau":10},{"poids":10,"n":190,"niveau":10},{"poids":5,"n":190,"niveau":10},{"poids":5,"n":190,"niveau":10}],"rare":[{"poids":50,"n":21,"niveau":10},{"poids":15,"n":214,"niveau":10},{"poids":15,"n":214,"niveau":10},{"poids":10,"n":190,"niveau":10},{"poids":5,"n":190,"niveau":10},{"poids":5,"n":190,"niveau":10}]},"route":{"commun":[{"poids":50,"n":163,"niveau":10},{"poids":15,"n":167,"niveau":10},{"poids":15,"n":165,"niveau":10},{"poids":10,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10}],"rare":[{"poids":50,"n":163,"niveau":10},{"poids":15,"n":204,"niveau":10},{"poids":15,"n":204,"niveau":10},{"poids":10,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10}]},"kanto":{"commun":[{"poids":50,"n":163,"niveau":10},{"poids":15,"n":23,"niveau":10},{"poids":15,"n":163,"niveau":10},{"poids":10,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10}],"rare":[{"poids":50,"n":163,"niveau":10},{"poids":15,"n":204,"niveau":10},{"poids":15,"n":204,"niveau":10},{"poids":10,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10}]},"lake":{"commun":[{"poids":50,"n":163,"niveau":10},{"poids":15,"n":48,"niveau":10},{"poids":15,"n":163,"niveau":10},{"poids":10,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10}],"rare":[{"poids":50,"n":163,"niveau":10},{"poids":15,"n":204,"niveau":10},{"poids":15,"n":204,"niveau":10},{"poids":10,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10},{"poids":5,"n":102,"niveau":10}]},"forest":{"commun":[{"poids":50,"n":163,"niveau":10},{"poids":15,"n":204,"niveau":10},{"poids":15,"n":204,"niveau":10},{"poids":10,"n":164,"niveau":10},{"poids":5,"n":12,"niveau":10},{"poids":5,"n":15,"niveau":10}],"rare":[{"poids":50,"n":163,"niveau":10},{"poids":15,"n":10,"niveau":10},{"poids":15,"n":13,"niveau":10},{"poids":10,"n":163,"niveau":10},{"poids":5,"n":11,"niveau":10},{"poids":5,"n":14,"niveau":10}]},"rock":{"commun":[{"poids":90,"n":98,"niveau":15},{"poids":10,"n":213,"niveau":15}],"rare":[{"poids":90,"n":98,"niveau":15},{"poids":10,"n":213,"niveau":15}]}},"etapes":{"route-29":"route","route-30":"route","route-31":"route","route-32":"kanto","route-33":"town","route-34":"route","route-35":"route","route-36":"route","route-37":"route","route-38":"route","route-39":"route","route-42":"town","route-43":"lake","route-44":"canyon","route-45":"canyon","route-46":"canyon","bois-aux-chenes":"forest"},"rochers":{"chenal-40":"rock","grotte-obscure":"rock","puits-ramoloss":"rock"}};
})(typeof window !== "undefined" ? window : globalThis);
