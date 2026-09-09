(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES SCEAUX DE KANTO — CE QUI RESTE À FAIRE QUAND ON A TOUT FAIT
  //
  //  🔴 LE JEU N'AVAIT PAS DE PLAFOND. Franchir la Ligue était la fin : après
  //     elle, le voyage suivant recommençait exactement au même niveau de
  //     difficulté, et le seul objectif restant était de collectionner. Un
  //     roguelite qui ne monte pas d'un cran après sa victoire perd ses
  //     meilleurs joueurs le jour où ils gagnent — et ce sont eux qui restent.
  //
  //  🔴 LA RÉPONSE EST CELLE DU GENRE, ET ELLE EST ÉPROUVÉE : des paliers
  //     CUMULATIFS. Le Sceau 5 porte les règles 1 à 5. On ne choisit pas une
  //     difficulté dans un menu, on la GAGNE : chaque Ligue franchie ouvre le
  //     sceau suivant, et un seul. C'est ce qui fait qu'un palier veut dire
  //     quelque chose — il se raconte.
  //
  //  🔴 ILS PASSENT PAR LA PORTE DES SERMENTS, ET C'EST TOUT L'INTÉRÊT. Un
  //     sceau ne déclare rien de neuf : il pousse les MÊMES clés que les
  //     serments — `bossNiveau`, `butinChoix`, `argent`, `capture`… Aucun
  //     système du jeu n'a été rouvert pour les câbler : le combat, le butin,
  //     la capture et l'expérience les lisent déjà. Une mécanique qui se
  //     branche sur une porte existante est une mécanique qui ne peut pas
  //     avoir de branche morte.
  //
  //  ⚠️ LE DÉFI DU JOUR EST TOUJOURS AU SCEAU ZÉRO. On s'y compare ; un joueur
  //     qui l'aurait joué à un palier plus dur n'aurait pas joué le même jeu.
  // ═══════════════════════════════════════════════════════════════════════════

  //  Chaque sceau porte UNE règle, et une seule. Deux règles par palier
  //  rendraient impossible de dire ce qui vient de changer — or c'est
  //  exactement ce qu'un joueur veut savoir quand il monte d'un cran.
  var SCEAUX = [
    {
      n: 1,
      nom: { fr: "Sceau de la Roche", en: "Boulder Seal" },
      dit: { fr: "Les Champions gagnent deux niveaux.", en: "Gym Leaders gain two levels." },
      effet: { bossNiveau: 2 },
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LES BARREAUX 2 ET 3 NE COÛTAIENT RIEN — mesuré le 11/08, n=600,
    //     politique « optimal », huit badges : sceau 1 **51,0 %**, sceau 2
    //     **52,9 %**, sceau 3 **49,0 %**. Trois barreaux, une seule hauteur —
    //     et le deuxième était même AU-DESSUS du premier. L'en-tête de ce
    //     fichier promet qu'un palier « se raconte » et qu'on sait ce qui vient
    //     de changer ; deux paliers sur huit ne changeaient rien.
    //     C'est la classe de la règle « express » : un nom, une phrase, aucun
    //     effet. Elle se paie deux fois plus cher ici, parce que ces paliers se
    //     GAGNENT — on rejoue une Ligue entière pour ouvrir une case vide.
    //
    //  ⚖️ ET L'ARGENT N'EST PAS UN LEVIER DANS CE MODE. Ce n'est pas une
    //     question de dose : mesuré à ×0,6 puis à **×0,25**, le taux ne bouge
    //     pas (47,1 % → 47,8 %). Le joueur arrive devant le légendaire avec
    //     12 593 ₽ en médiane et 98 % peuvent s'offrir une Hyper Ball. On ne
    //     réajuste donc pas la dose, on RETIRE la clé du palier.
    // ═══════════════════════════════════════════════════════════════════════
    {
      n: 2,
      nom: { fr: "Sceau de la Cascade", en: "Cascade Seal" },
      dit: { fr: "Une place de moins dans ton équipe.", en: "One fewer slot on your team." },
      // ⚖️ MESURÉ : 8 badges 50,7 → 47,8 %, Ligue 16,8 → 14,2 % (n=400).
      //    Et le résultat n'allait PAS de soi : ce dossier a établi qu'un corps
      //    de plus DILUE l'expérience — donc en retirer un la concentre, ce qui
      //    devrait aider. C'est l'inverse qui se produit, et ça confirme l'autre
      //    mesure du dossier : le goulot du mode est la COUVERTURE DE TYPES, pas
      //    le niveau. Une place en moins, c'est une réponse en moins.
      effet: { equipeMax: 5 },
    },
    {
      n: 3,
      nom: { fr: "Sceau de la Foudre", en: "Thunder Seal" },
      // ═════════════════════════════════════════════════════════════════════
      // 🔴 « BUG SCEAU NUMÉRO 3 ? » — NaGaNn, 18/08, sur #bug-report. Il a lu
      //    « Tu ne montes plus au-dessus du Champion de l'acte » et compris que
      //    LE VOYAGE s'arrêtait après Pierre. Il a ouvert un rapport de bug
      //    pour un jeu qui marchait, puis s'est corrigé tout seul : « peut-être
      //    que ça parle de niveau alors ? ». Oui — et la phrase ne le disait
      //    pas. En français, « monter » veut dire progresser autant que gagner
      //    des niveaux ; l'anglais, lui, disait « level » et était clair.
      // 🔑 CE N'EST PAS UNE PHRASE FAUSSE, C'EST UNE PHRASE À DEUX LECTURES —
      //    et c'est pire, parce qu'aucun contrôle ne peut la prendre en défaut.
      //    On nomme donc la GRANDEUR (« le niveau »), pas le mouvement.
      // ⚠️ ET LE SCEAU NE CRÉE PAS LE PLAFOND, il en retire la MARGE : un
      //    plafond existe à tous les actes, ce barreau ramène l'avance à zéro.
      //    La marge qu'il supprime vaut 8 aux actes 1-4, 5 aux actes 5-6,
      //    **ZÉRO aux actes 7-8** (`margeDe`) — donc cette règle-ci n'y change
      //    littéralement rien — et `MARGE_LIGUE` au dernier.
      // 🔴 ET LE PLAFOND OBSERVÉ N'EST PAS CELUI DE LA RÈGLE SEULE. Un sceau
      //    EMPILE les paliers d'en dessous : au sceau 3, le sceau 1 monte aussi
      //    les Champions de deux niveaux, et le plafond SUIT le Champion.
      //    Mesuré en jeu, plafond sans sceau → avec sceau 3 :
      //      actes 1-4  22/32/43/49 → 16/26/37/43   (−6)
      //      actes 5-6  61/67       → 58/64         (−3)
      //      actes 7-8  67/70       → 69/72         (**+2**)
      //      Ligue      95          → 81            (−14)
      //    Aux deux dernières arènes le plafond MONTE : la marge y était déjà
      //    nulle, il ne reste que la montée du Champion. Ce n'est pas une
      //    inversion de difficulté — le Champion monte d'autant — mais une
      //    lecture « le sceau 3 baisse mon plafond » y serait fausse.
      //    ⚠️ Mon premier relevé lisait `plafondDe(n, AR, 0, true)` — le sceau
      //       SEUL, sans les paliers qu'il empile — et sortait −8/−5/0/−16.
      //       L'écran de jeu affichait 16 là où je calculais 14 : c'est lui qui
      //       m'a repris. *Mesurer une règle hors de la pile où elle s'applique
      //       donne un chiffre juste pour un jeu qui n'existe pas.*
      //    La phrase reste vraie partout : on ne dépasse plus, nulle part.
      // ═════════════════════════════════════════════════════════════════════
      dit: {
        fr: "Tes Pokémon ne dépassent plus le niveau du Champion de l'acte.",
        en: "Your Pokémon no longer exceed the act's Gym Leader in level.",
      },
      // ⚖️ MESURÉ, et c'est le barreau le plus tranchant de l'échelle :
      //    8 badges 47,1 → 36,5 %, Ligue 16,8 → 9,5 % (n=400). Comparé au même
      //    endroit, « le sac se ferme en combat » ne rendait que −2,2 points.
      // 🔑 C'est la mécanique que ce fichier nomme lui-même plus bas comme celle
      //    des meilleurs fan games durs : le grind cesse d'être une réponse, la
      //    COMPOSITION en devient une. Elle avait un lecteur, un serment, et
      //    aucun palier — l'échelle d'ascension passait à côté de son meilleur
      //    outil pour proposer un rabais sur l'argent de poche.
      effet: { plafondChampion: true },
    },
    {
      n: 4,
      nom: { fr: "Sceau du Prisme", en: "Rainbow Seal" },
      dit: { fr: "Tu encaisses un septième de plus.", en: "You take a seventh more." },
      // 🔴 LE TEXTE DISAIT « UN SEPTIÈME », LA DONNÉE APPLIQUAIT 15 %. Un
      //    septième vaut 14,29 % : l'écart est de six millièmes, imperceptible
      //    en jeu — et c'est bien pour ça qu'il a vécu. Les sept autres sceaux
      //    sont exacts au centième près (0,6 = 1 − 2/5, 0,75 = 1 − 1/4,
      //    0,8 = 1 − 1/5, 0,9 = 1 − 1/10) ; celui-ci était le seul à mentir.
      //    On écrit donc la FRACTION, pas son arrondi : la phrase et la donnée
      //    disent désormais littéralement la même chose, et personne ne pourra
      //    plus « arrondir » l'une sans voir l'autre.
      effet: { degatsSubis: 1 + 1 / 7 },
    },
    {
      n: 5,
      nom: { fr: "Sceau de l'Âme", en: "Soul Seal" },
      dit: { fr: "Tes Poké Balls tiennent un quart de moins.", en: "Your Poké Balls hold a quarter less." },
      effet: { capture: 0.75 },
    },
    {
      n: 6,
      nom: { fr: "Sceau du Marais", en: "Marsh Seal" },
      dit: { fr: "Les Champions gagnent trois niveaux de plus.", en: "Gym Leaders gain three more levels." },
      effet: { bossNiveau: 3 },
    },
    {
      n: 7,
      nom: { fr: "Sceau du Volcan", en: "Volcano Seal" },
      dit: { fr: "L'expérience baisse d'un cinquième.", en: "Experience drops by a fifth." },
      effet: { expGain: 0.8 },
    },
    {
      n: 8,
      nom: { fr: "Sceau de la Terre", en: "Earth Seal" },
      dit: { fr: "Tes coups perdent un dixième.", en: "Your hits lose a tenth." },
      effet: { degatsInfliges: 0.9 },
    },
  ];

  function nombre() { return SCEAUX.length; }
  function de(n) { return SCEAUX[n - 1] || null; }
  // 🔴 PAS DE PORTE `tous()`. Le détecteur de portes mortes vient de la
  //    refuser, comme il avait refusé `PokeSerments.tous` il y a trois heures :
  //    seul un outil l'appelait. L'écran de départ énumère avec `de(1..n)`,
  //    donc par la porte que le joueur emprunte vraiment.

  // ── LA COMPOSITION ─────────────────────────────────────────────────────────
  //  🔴 ELLE MODIFIE UN EFFET DÉJÀ COMPOSÉ, elle n'en fabrique pas un autre.
  //     Les serments ont déjà borné le leur ; le sceau s'ajoute par-dessus et
  //     on reborne à la fin. Rendre deux objets qu'un appelant devrait fondre
  //     lui-même, c'est confier la règle de fusion à trois écrans différents —
  //     et c'est comme ça qu'ils divergent.
  //  ⚠️ `butinChoix` peut devenir NÉGATIF ici, et c'est voulu : le Sceau de la
  //     Cascade retire une carte. La borne basse des serments valait zéro ;
  //     elle descend à −2, et l'écran de butin garde au moins une carte.
  function appliquer(effet, n) {
    if (!effet || !n) return effet;
    for (var i = 0; i < SCEAUX.length && i < n; i++) {
      var e = SCEAUX[i].effet;
      for (var k in e) {
        if (!(k in effet)) continue;
        var v = e[k];
        if (typeof v === "boolean") effet[k] = effet[k] || v;
        else if (k === "equipeMax") effet[k] = Math.min(effet[k], v);
        else if (k === "critBonus" || k === "butinChoix" || k === "bossNiveau") effet[k] += v;
        else effet[k] *= v;
      }
    }
    effet.butinChoix = Math.max(-2, Math.min(3, effet.butinChoix));
    effet.bossNiveau = Math.max(0, Math.min(14, effet.bossNiveau));
    effet.argent = Math.max(0.2, effet.argent);
    effet.expGain = Math.max(0.3, effet.expGain);
    effet.capture = Math.max(0.25, effet.capture);
    effet.degatsSubis = Math.min(2.2, effet.degatsSubis);
    effet.degatsInfliges = Math.max(0.3, effet.degatsInfliges);
    return effet;
  }

  W.PokeSceaux = {
    nombre: nombre,
    de: de,
    appliquer: appliquer,
  };
})(typeof window !== "undefined" ? window : globalThis);
