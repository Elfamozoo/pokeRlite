(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE TEMPO — ATTENDRE SANS SE FAIRE ÉTRANGLER
  //
  //  🔴 UN ONGLET QUI N'EST PAS AU PREMIER PLAN VOIT TOUS SES `setTimeout`
  //     RAMENÉS À UNE SECONDE. C'est une règle de Chrome, pas un défaut du jeu —
  //     et elle n'a aucune conséquence pour un joueur, qui regarde son écran.
  //     Elle en a une, énorme, pour le JOUEUR DIRIGÉ : le mode enchaîne des
  //     centaines d'écrans séparés par des attentes de quelques dizaines de
  //     millisecondes, et le harnais tourne la partie à zéro de rythme. À une
  //     seconde chacune, une partie demande des heures.
  //
  //  🔴 MESURÉ LE 08/08, APRÈS AVOIR CRU À UNE BOUCLE INFINIE. Dans l'onglet de
  //     fond : un intervalle de 50 ms battait TROIS fois en deux secondes au
  //     lieu de quarante, pendant que deux cents allers-retours par
  //     `MessageChannel` prenaient deux millisecondes en tout. J'avais d'abord
  //     corrigé les attentes du harnais ; celles du JEU restaient bridées, et
  //     c'est le jeu qui mène la danse.
  //
  //  🔴 CE N'EST PAS UNE ASTUCE DE TEST QU'ON GLISSE DANS LE JEU. Une attente de
  //     zéro milliseconde veut dire « rends la main puis continue » — jamais
  //     « attends une seconde ». Le canal de message DIT exactement ça, et il le
  //     tient au premier plan comme en arrière-plan. Au-dessus de zéro, on garde
  //     le minuteur : une animation qui doit durer 400 ms les dure.
  // ═══════════════════════════════════════════════════════════════════════════

  function rendreLaMain(fn) {
    var c = new W.MessageChannel();
    c.port1.onmessage = function () { fn(); };
    c.port2.postMessage(0);
  }

  // La porte unique. `apres(ms, fn)` remplace `setTimeout(fn, ms)` partout où le
  // délai peut valoir zéro — c'est-à-dire partout où le rythme est réglable.
  function apres(ms, fn) {
    if (ms > 0) return W.setTimeout(fn, ms);
    rendreLaMain(fn);
    return 0;
  }

  W.PokeTempo = { apres: apres };
})(typeof window !== "undefined" ? window : globalThis);
