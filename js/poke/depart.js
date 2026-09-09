(function (W) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a son itinéraire, ses clés et ses zones.
  var ETAPES = function () { return (W.PokeRegles && W.PokeRegles.etapes()) || W.POKE_ETAPES || []; };
  var CLES_V = function () { return (W.PokeRegles && W.PokeRegles.clesVoyage()) || W.POKE_CLES || {}; };
  var ZONES = function () { return (W.PokeRegles && W.PokeRegles.zones()) || W.POKE_ZONES || []; };
  var LIEUX = function () { return (W.PokeRegles && W.PokeRegles.lieux()) || W.POKE_LIEUX || {}; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE VIVIER DE DÉPART — CE QUE TU ATTRAPES DEVIENT CE AVEC QUOI TU REPARS
  //
  //  🔴 IL NE SE PASSAIT RIEN ENTRE DEUX PARTIES. Le Pokédex se remplissait et
  //     ne débloquait rien : chaque voyage recommençait avec les trois mêmes
  //     starters, et une capture n'était qu'un numéro de plus dans une liste.
  //     C'est le trou de rétention le plus large du mode.
  //
  //     La réponse est celle de tous les roguelites qui accrochent, et c'est
  //     exactement le cœur de PokéRogue : ce qu'on obtient dans une partie
  //     CHANGE la partie suivante. Ici, capturer une espèce l'ouvre comme
  //     Pokémon de départ. Un Mélofée attrapé à un pour cent au fond du Mont
  //     Sélénité n'est plus une ligne du Pokédex — c'est une partie entière
  //     qu'on n'aurait pas pu jouer hier.
  //
  //  🔴 TROIS BORNES, ET CHACUNE A UNE RAISON DE JEU.
  //     · On ne part qu'avec une PREMIÈRE FORME. Partir avec un Dracaufeu
  //       supprimerait le voyage au lieu de le varier — et l'évolution est la
  //       pierre angulaire du mode.
  //     · Les LÉGENDAIRES n'ouvrent jamais. Ils sont uniques par partie ; en
  //       faire un départ retirerait le seul moment de rareté du jeu.
  //     · Le DÉFI DU JOUR garde les trois starters du canon. On ne compare pas
  //       des voyages où l'un part avec Ronflex et l'autre avec Chenipan — et
  //       c'est la règle du projet : aucun acquis hors partie ne pèse là où
  //       l'on se compare.
  // ═══════════════════════════════════════════════════════════════════════════

  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES TROIS DE LA TABLE — ILS SUIVENT LE MONDE
  //
  //  🔴 C'ÉTAIT UNE CONSTANTE, ET ELLE MENTAIT DÈS QU'IL Y A EU DEUX MONDES.
  //     `[1, 4, 7]` posait Bulbizarre, Salamèche et Carapuce sur la table du
  //     Professeur Orme. Le registre les nomme désormais par monde ; ce fichier
  //     ne sait plus lesquels, et c'est exactement ce qu'on voulait.
  //  ⚠️ CE N'EST PLUS UNE CONSTANTE, DONC ON NE LA GARDE PLUS EN CACHE. Les
  //     premières formes et les légendaires non plus : Pikachu est une première
  //     forme en 1996 et ne l'est PLUS en 1999 (Pichu évolue vers lui), et
  //     Évoli y gagne deux issues. Un cache posé sous Kanto et relu sous Johto
  //     ouvrirait le mauvais vivier sans un mot.
  // ═══════════════════════════════════════════════════════════════════════════
  var CANON = function () {
    return (W.PokeRegles ? W.PokeRegles.canon() : [1, 4, 7]).slice();
  };
  var CLE = function () { return W.PokeRegles ? W.PokeRegles.courant() : "gen1"; };

  // Une espèce est une PREMIÈRE FORME si rien n'évolue vers elle.
  var _premieres = {};
  function premieresFormes() {
    var cle = CLE();
    if (_premieres[cle]) return _premieres[cle];
    var issues = {};
    for (var n in ESP()) {
      if (!/^\d+$/.test(n)) continue;
      var e = ESP()[n];
      for (var i = 0; i < (e.evolue || []).length; i++) issues[e.evolue[i].vers] = true;
    }
    var out = {};
    for (var m in ESP()) {
      if (!/^\d+$/.test(m)) continue;
      if (!issues[m]) out[m] = true;
    }
    _premieres[cle] = out;
    return out;
  }

  // 🔴 Les légendaires n'ouvrent jamais. On les lit dans le MONDE — les étapes
  //    qui en portent un — au lieu d'écrire une liste qui divergerait.
  var _legendaires = {};
  function legendaires() {
    var cle = CLE();
    if (_legendaires[cle]) return _legendaires[cle];
    var out = {};
    for (var i = 0; i < (ETAPES() || []).length; i++) {
      if (ETAPES()[i].legendaire) out[ETAPES()[i].legendaire] = true;
    }
    _legendaires[cle] = out;
    return out;
  }

  // ── DEUX RÈGLES, ET IL FAUT LES DISTINGUER ─────────────────────────────────
  //  🔴 `recevable` est STRUCTUREL : première forme, pas un légendaire. Le
  //     serveur de rejeu peut le vérifier — il a le monde et les espèces.
  //  🔴 `vivier` est une affaire de COMPTE : il lit le Pokédex conservé, qui
  //     n'existe que dans le navigateur. Le serveur n'a pas cette information.
  //
  //  Confondre les deux mettait le mode dans une impasse : `depart.js` vit dans
  //  le noyau, que le serveur charge, et il aurait appelé `PokeProgression`,
  //  qui vit dans les écrans. Le rejeu serait tombé au premier starter.
  //  L'ouverture est donc une affordance d'écran ; la règle anti-triche est la
  //  règle structurelle, et c'est elle que la partie applique.
  function recevable(n) {
    return !!premieresFormes()[n] && !legendaires()[n];
  }

  // Le vivier ouvert : les trois du canon, plus toute première forme capturée.
  function vivier(options) {
    var o = options || {};
    // Au Défi du jour et en PvP classé, personne n'a d'avantage acquis ailleurs.
    if (o.compare) return CANON();
    // Hors navigateur — le rejeu serveur — on ne connaît aucun compte : on rend
    // la règle structurelle, et la validation de compte se fait ailleurs.
    if (!W.PokeProgression) return CANON();
    var prises = (W.PokeProgression.lire().pris) || {};
    var premieres = premieresFormes(), leg = legendaires();
    var out = CANON();
    for (var n in prises) {
      var num = +n;
      if (out.indexOf(num) >= 0) continue;
      if (!premieres[num] || leg[num]) continue;
      out.push(num);
    }
    out.sort(function (a, b) { return a - b; });
    return out;
  }

  // Ce qu'il reste à ouvrir : le compteur qui donne envie de capturer.
  // 🔴 Un déblocage qui ne s'annonce pas n'existe pas. On dit toujours combien
  //    d'espèces sont ouvertes, et sur combien d'ouvrables.
  function compte() {
    var premieres = premieresFormes(), leg = legendaires();
    var ouvrables = 0;
    for (var n in premieres) if (!leg[n]) ouvrables++;
    return { ouverts: vivier().length, ouvrables: ouvrables };
  }

  // Une espèce peut-elle servir de départ, et sinon pourquoi ? La RAISON compte
  // autant que le refus : un Pokémon absent de la liste sans explication se lit
  // comme un oubli.
  function raisonFermee(n) {
    if (vivier().indexOf(n) >= 0) return null;
    if (legendaires()[n]) return "legendaire";
    if (!premieresFormes()[n]) return "evolution";
    return "jamaisCapture";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE MYTHE DE MEW — TROIS ÉTATS, LUS EN UN SEUL ENDROIT
  //
  //  🔴 MEW N'EST PAS OBTENABLE LÉGITIMEMENT EN ROUGE/BLEU, et le mode le dit
  //     déjà : le diplôme du Pokédex ne l'exige pas. On ne le donne donc pas —
  //     on le rend ATTEIGNABLE au bout de la seule chose qui reste quand tout le
  //     reste est fait : les cent cinquante autres.
  //
  //  🔴 ET LA CONDITION SE MESURE SUR LE COMPTE, PAS SUR LA PARTIE. Une seule
  //     partie ne peut atteindre que 98 espèces sur 151 — l'exclusivité de
  //     version l'interdit. Exiger 150 dans un voyage serait une condition
  //     impossible, c'est-à-dire un contenu mort de plus.
  //
  //  🔴 TROIS ÉTATS, PARCE QU'UN SEUL NE FAIT PAS UN MYTHE. Le camion se croise
  //     à chaque voyage et il DIT ce qu'il voit : rien, puis quelque chose qui
  //     bouge, puis Mew. C'est l'état du milieu qui tient le joueur — sans lui,
  //     la condition serait invisible et la récompense tomberait du ciel.
  //     Le seuil de l'éveil est à 100 : assez loin pour se mériter, assez près
  //     pour qu'on y croie.
  var MEW = 151, EVEIL = 100;

  function mythe() {
    // Hors navigateur — le rejeu serveur — aucun compte n'existe : le camion ne
    // cache rien, et c'est la réponse sûre.
    if (!W.PokeProgression) return { etat: "rien", pris: 0, seuil: EVEIL, total: 150 };
    var pris = W.PokeProgression.lire().pris || {};
    var n = 0;
    for (var k in pris) if (+k !== MEW) n++;
    if (n >= 150) return { etat: "mew", pris: n, seuil: EVEIL, total: 150 };
    if (n >= EVEIL) return { etat: "remue", pris: n, seuil: EVEIL, total: 150 };
    return { etat: "rien", pris: n, seuil: EVEIL, total: 150 };
  }

  W.PokeDepart = {
    CANON: CANON,
    recevable: recevable,
    vivier: vivier,
    compte: compte,
    raisonFermee: raisonFermee,
    premieresFormes: premieresFormes,
    legendaires: legendaires,
    MEW: MEW,
    mythe: mythe,
  };
})(typeof window !== "undefined" ? window : globalThis);
