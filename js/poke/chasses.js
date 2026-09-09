(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES CHASSES — CE QU'UN VOYAGE PERDU RAPPORTE QUAND MÊME
  //
  //  🔴 C'EST LE TROU DE RÉTENTION QUI RESTAIT, ET C'EST LE PLUS LARGE. Un
  //     voyage qui s'arrête au troisième acte ne laissait RIEN : ni ouverture,
  //     ni trace, ni raison de relancer autre chose que l'envie. Or c'est le
  //     cas le plus fréquent — la médiane mesurée du mode est de trois à
  //     quatre badges. Le jeu punissait donc son issue la plus courante par le
  //     vide, et c'est exactement ce qui fait fermer un onglet.
  //
  //     La réponse est celle de tous les roguelites qui tiennent : CHAQUE
  //     voyage produit du permanent. Ici, une chasse accomplie OUVRE un
  //     serment — le pool passe de dix-sept à vingt-sept. Le levier qu'on a
  //     construit hier devient la récompense d'aujourd'hui.
  //
  //  🔴 ELLES SE JUGENT AU BILAN, ET NULLE PART AILLEURS. Une seule porte, un
  //     seul moment : la fin du voyage. Les évaluer en cours de route aurait
  //     éparpillé onze conditions dans le moteur, et aucune n'aurait
  //     pu être prouvée vivante. Ce dossier a déjà payé trois fois le prix
  //     d'un effet déclaré que rien ne déclenche.
  //
  //  🔴 UNE CHASSE DIT CE QU'ELLE DEMANDE, EN CHIFFRES. Pas de « va loin » :
  //     « quatre badges », « douze espèces », « sans perdre un Pokémon ». Un
  //     objectif qu'on ne peut pas mesurer soi-même en cours de partie ne
  //     dirige aucune décision — il ne fait que décorer un écran de fin.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── LA LISTE ───────────────────────────────────────────────────────────────
  //  `mesure(b)` rend un COUPLE [fait, sur] — jamais un booléen. C'est ce qui
  //  permet à l'écran d'afficher « 3 / 4 » plutôt qu'une case vide, et une
  //  progression visible vaut dix fois une case à cocher.
  //   · `b` est le bilan de la partie (voir `PokePartie.bilan`) ;
  //   · `c` est le compte conservé (voir `PokeProgression`).
  var CHASSES = [
    // ── Le premier barreau ───────────────────────────────────────────────────
    //  🔴 IL MANQUAIT, ET LA MESURE L'A CHIFFRÉ : le barreau le plus bas de tout
    //     le système était « deux badges », quand **16,6 % des voyages finissent
    //     à ZÉRO badge et 14,2 % à un seul**. Autrement dit, le pilier de la
    //     méta bâti pour payer un voyage perdu ne payait RIEN à 30,8 % des
    //     voyages — précisément ceux qu'il devait tenir. Relevé sur 548
    //     voyages : à l'acte 1, chasses accomplies = **0,00**.
    //  ✅ CELUI-CI SE FRANCHIT EN TRAVERSANT, PAS EN GAGNANT. Croiser dix
    //     espèces, pas les attraper : c'est la seule chose qu'un voyage mort au
    //     premier acte ait vraiment faite. Mesuré : **81 % des voyages à zéro
    //     badge le franchissent** (médiane 10 vues, minimum 7).
    //  ⚠️ ET IL EST FACILE, À DESSEIN. 97 % de tous les voyages le passent : son
    //     travail n'est pas de trier, c'est que le PREMIER voyage ouvre quelque
    //     chose, quelle que soit sa fin. Les dix autres chasses se méritent.
    {
      id: "dixCroisees",
      nom: { fr: "Dix croisées", en: "Ten encountered" },
      dit: {
        fr: "Croise dix espèces dans un même voyage.",
        en: "Encounter ten species in one journey.",
      },
      mesure: function (b) { return [b.vus, 10]; },
      ouvre: { serment: "arpenteur" },
    },

    // ── Aller loin ───────────────────────────────────────────────────────────
    {
      id: "deuxBadges",
      nom: { fr: "Deux badges", en: "Two badges" },
      dit: { fr: "Gagne deux badges dans un même voyage.", en: "Win two badges in one journey." },
      mesure: function (b) { return [b.badges, 2]; },
      ouvre: { serment: "fureur" },
    },
    {
      id: "quatreBadges",
      nom: { fr: "Quatre badges", en: "Four badges" },
      dit: { fr: "Gagne quatre badges dans un même voyage.", en: "Win four badges in one journey." },
      mesure: function (b) { return [b.badges, 4]; },
      ouvre: { serment: "oeil" },
    },
    {
      id: "septBadges",
      nom: { fr: "Sept badges", en: "Seven badges" },
      dit: { fr: "Gagne sept badges dans un même voyage.", en: "Win seven badges in one journey." },
      mesure: function (b) { return [b.badges, 7]; },
      ouvre: { serment: "titan" },
    },
    {
      id: "ligue",
      nom: { fr: "La Ligue", en: "The League" },
      dit: { fr: "Franchis le Conseil 4.", en: "Beat the Elite Four." },
      mesure: function (b) { return [b.ligue ? 1 : 0, 1]; },
      ouvre: { serment: "sacrifice" },
    },

    // ── Collectionner ────────────────────────────────────────────────────────
    {
      id: "douzeEspeces",
      nom: { fr: "Douze espèces", en: "Twelve species" },
      dit: { fr: "Attrape douze espèces dans un même voyage.", en: "Catch twelve species in one journey." },
      mesure: function (b) { return [b.pris, 12]; },
      ouvre: { serment: "collection" },
    },
    {
      id: "trenteAuCompte",
      nom: { fr: "Trente au compte", en: "Thirty on record" },
      dit: { fr: "Attrape trente espèces différentes en tout.", en: "Catch thirty different species overall." },
      mesure: function (b, c) { return [c.pris, 30]; },
      ouvre: { serment: "ermite" },
    },
    {
      id: "unLegendaire",
      nom: { fr: "Un légendaire", en: "One legendary" },
      dit: { fr: "Attrape un légendaire.", en: "Catch a legendary." },
      mesure: function (b) { return [b.legendaires.length, 1]; },
      ouvre: { serment: "marche" },
    },

    // ── Tenir parole ─────────────────────────────────────────────────────────
    //  🔴 CELLES-CI LISENT LES SERMENTS, et c'est ce qui relie les deux
    //     systèmes : jurer devient un moyen d'ouvrir de quoi jurer mieux.
    {
      id: "troisSerments",
      nom: { fr: "Trois serments", en: "Three oaths" },
      dit: { fr: "Tiens trois serments dans un même voyage.", en: "Hold three oaths in one journey." },
      mesure: function (b) { return [b.serments.length, 3]; },
      ouvre: { serment: "silence" },
    },
    {
      id: "badgeSousSerment",
      nom: { fr: "Parole tenue", en: "Word kept" },
      // ⚠️ « APRÈS » NE SE MESURE PAS ICI, ET LA PHRASE LE DISAIT. Le bilan ne
      //    porte que le TOTAL de badges et la LISTE des serments : rien ne dit
      //    lequel est venu en premier. La chasse comptait donc aussi les badges
      //    gagnés AVANT le serment — un joueur qui jure au 3ᵉ badge la validait
      //    aussitôt. On aligne la phrase sur ce que la mesure sait vraiment
      //    faire, plutôt que d'inventer un ordre que la donnée ne garde pas.
      dit: {
        fr: "Trois badges, sous le serment de la solitude ou du duel.",
        en: "Three badges, under the oath of solitude or the duel.",
      },
      mesure: function (b) {
        var etroit = b.serments.indexOf("solitude") >= 0 || b.serments.indexOf("duel") >= 0;
        return [etroit ? b.badges : 0, 3];
      },
      ouvre: { serment: "fortune" },
    },

    // ── Ne rien perdre ───────────────────────────────────────────────────────
    {
      id: "sansPerte",
      nom: { fr: "Aucun tombé", en: "None fallen" },
      dit: {
        fr: "Gagne trois badges sans perdre un seul Pokémon.",
        en: "Win three badges without losing a single Pokémon.",
      },
      // 🔴 ELLE LISAIT `perdus`, QUI N'EXISTE QU'EN NUZLOCKE. En voyage, en
      //    express et au Défi du jour, le compteur valait zéro par construction :
      //    la chasse la plus exigeante du carnet tombait seule au 3ᵉ badge.
      //    `tombes` compte ce qui EST tombé, quelle que soit la règle.
      // 🔴 PUIS ELLE EST PASSÉE DE « TOUJOURS VRAIE » À « JAMAIS VRAIE », et
      //    c'est un joueur qui l'a dit : « même en faisant une perfect run le
      //    succès aucun tombé ne se valide pas » (Totor, 19/08). La correction
      //    d'avant lisait `tombes === 0` sur le bilan de CLÔTURE — il fallait
      //    donc finir le voyage entier, Ligue comprise, sans qu'une créature
      //    tombe une seule fois. Huit badges et un seul tombé : refusée.
      // 🔑 LA PHRASE PARLE D'UN MOMENT, PAS D'UNE FIN. « Gagne trois badges sans
      //    perdre un seul Pokémon » se juge sur les badges gagnés AVANT la
      //    première chute — `badgesSansChute`, figé par `partie.js` dès qu'un
      //    Pokémon est à terre.
      //    ⚠️ Le repli sur l'ancienne lecture sert les bilans d'avant le 20/08,
      //       qui ne portent pas le champ : ils gardent leur chance.
      mesure: function (b) {
        var avant = b.badgesSansChute;
        if (avant === undefined) avant = (b.tombes || 0) === 0 ? b.badges : 0;
        return [avant || 0, 3];
      },
      // ⚠️ SON SERMENT LUI EST PROPRE. Elle ouvrait `collection`, que « Douze
      //    espèces » — bien plus facile — ouvre déjà : la plus dure des onze ne
      //    rapportait donc rien à qui avait fait la plus simple, tout en le lui
      //    promettant. Onze chasses, onze serments.
      ouvre: { serment: "rempart" },
    },
  ];

  var PAR_ID = {};
  for (var i = 0; i < CHASSES.length; i++) PAR_ID[CHASSES[i].id] = CHASSES[i];

  function de(id) { return PAR_ID[id] || null; }

  // ── L'ÉTAT LISIBLE ─────────────────────────────────────────────────────────
  //  🔴 IL REND TOUT, ACCOMPLI OU NON, avec le compte. Le carnet doit montrer
  //     ce qui reste à faire : une liste qui n'affiche que les réussites ne
  //     dirige aucun voyage, elle félicite. Et le mode a besoin qu'on sache
  //     quoi tenter au prochain départ.
  function etat(compte, bilan) {
    var faites = (compte && compte.chasses) || {};
    // ⚠️ TOUT CHAMP LU PAR UNE `mesure` DOIT ÊTRE ICI. Le carnet appelle `etat()`
    //    SANS bilan ; un champ oublié y vaudrait `undefined`, et la chasse
    //    s'afficherait « NaN / 10 » sur l'écran qui sert à savoir quoi tenter.
    //    ⚠️ `tombes` et `badgesSansChute` manquaient à ce repli alors que la
    //       chasse « Aucun tombé » les lit : ils rendaient zéro par les `|| 0`
    //       de sa mesure, donc pas de NaN — mais la règle écrite juste au-dessus
    //       ne souffre pas d'exception, sans quoi elle ne garde plus rien.
    var b = bilan || {
      badges: 0, pris: 0, vus: 0, ligue: false, legendaires: [], serments: [],
      perdus: 0, tombes: 0, badgesSansChute: 0,
    };
    // ⚠️ LE REPLI NE COUVRAIT QUE LE COMPTE ABSENT, pas le compte INCOMPLET :
    //    `compte || { pris: 0 }` laisse passer un objet sans `pris`, et
    //    « Trente au compte » sortait alors **NaN / 30** à l'écran. Les deux
    //    appelants réels passent bien un nombre — c'est une sonde de contrôle
    //    qui l'a révélé — mais un défaut qui n'attend qu'un troisième appelant
    //    reste un défaut. On complète champ par champ.
    var c = { pris: (compte && compte.pris) || 0 };
    return CHASSES.map(function (ch) {
      var m = ch.mesure(b, c);
      return {
        id: ch.id, nom: ch.nom, dit: ch.dit, ouvre: ch.ouvre,
        faite: !!faites[ch.id],
        fait: Math.min(m[0], m[1]), sur: m[1],
      };
    });
  }

  // ── L'ÉVALUATION ───────────────────────────────────────────────────────────
  //  🔴 ELLE NE REND QUE LE NEUF. Rejouer les chasses déjà accomplies aurait
  //     réannoncé les mêmes ouvertures à chaque fin de voyage — une fanfare
  //     qu'on entend tout le temps ne récompense plus rien, et le mode a déjà
  //     écrit cette règle pour les badges.
  //  🔴 ELLE N'ÉCRIT RIEN. Poser le résultat dans le compte est le travail de
  //     `PokeProgression` : une fonction qui mesure ET qui enregistre ne peut
  //     pas être appelée pour un simple aperçu, et l'écran du carnet a besoin
  //     d'exactement cet aperçu.
  function evaluer(bilan, compte) {
    var faites = (compte && compte.chasses) || {};
    var neuves = [];
    for (var j = 0; j < CHASSES.length; j++) {
      var ch = CHASSES[j];
      if (faites[ch.id]) continue;
      var m = ch.mesure(bilan, compte || { pris: 0 });
      if (m[0] >= m[1]) neuves.push(ch);
    }
    return neuves;
  }

  // Les serments ouverts par les chasses accomplies, sous la forme que
  // `PokeSerments.offrir` attend. Porte unique : la partie ne construit jamais
  // cet ensemble elle-même.
  function sermentsOuverts(compte) {
    var faites = (compte && compte.chasses) || {};
    var out = {};
    for (var k = 0; k < CHASSES.length; k++) {
      var ch = CHASSES[k];
      if (faites[ch.id] && ch.ouvre && ch.ouvre.serment) out[ch.ouvre.serment] = true;
    }
    return out;
  }

  W.PokeChasses = {
    de: de,
    etat: etat,
    evaluer: evaluer,
    sermentsOuverts: sermentsOuverts,
  };
})(typeof window !== "undefined" ? window : globalThis);
