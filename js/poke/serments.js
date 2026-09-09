(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES SERMENTS — CE QUI FAIT QUE DEUX VOYAGES NE SE RESSEMBLENT PAS
  //
  //  🔴 LE VOYAGE N'AVAIT AUCUN LEVIER DE CONSTRUCTION. On choisissait un
  //     chemin, on ramassait du butin, on gagnait des badges — et deux parties
  //     menées correctement se déroulaient de la même façon. Le butin varie ce
  //     qu'on POSSÈDE ; rien ne variait ce qu'on EST. C'est le trou qui sépare
  //     un enchaînement de combats d'un roguelite : dans les meilleurs, chaque
  //     étape franchie demande un arbitrage qui engage la suite.
  //
  //  🔴 UN SERMENT SE PREND À CHAQUE BADGE, ET IL NE SE REPREND PAS. Huit
  //     arbitrages par voyage, trois propositions à chaque fois. Chacun ÉCHANGE
  //     une contrainte contre une force — jamais un bonus sec. Un choix sans
  //     coût n'est pas un choix, c'est une case à cocher, et le mode en a
  //     déjà refusé une fois.
  //
  //  🔴 TOUT PASSE PAR UNE PORTE UNIQUE : `effet(partie)`. Les serments ne
  //     touchent jamais un système directement — ils déclarent des clés, et
  //     chaque système lit la porte. Sans ça, quinze serments auraient éparpillé
  //     quinze branches dans le moteur, et `poke-serments.mjs` ne pourrait pas
  //     prouver qu'aucune n'est morte. Le mode a déjà payé deux fois le prix
  //     d'un effet déclaré que rien ne lisait.
  //
  //  🔴 AUCUN TIRAGE HORS DE `PokeHasard`. Les trois propositions se tirent de
  //     la graine du voyage : au Défi du jour, tout le monde reçoit les mêmes
  //     serments dans le même ordre, et la comparaison reste honnête. C'est
  //     aussi ce qui les autorise là — un serment est un choix DANS la partie,
  //     pas un acquis rapporté du dehors.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── LES CLÉS D'EFFET, ET RIEN D'AUTRE ──────────────────────────────────────
  //  🔴 Cette table est le CONTRAT. Une clé qui n'y figure pas ne sera lue par
  //     personne ; une clé qui y figure sans lecteur est refusée par le
  //     détecteur. `neutre` donne la valeur qui ne change rien, ce qui permet
  //     d'écrire les lecteurs sans jamais tester l'existence de la clé.
  var CLES = {
    degatsInfliges: 1,    // × sur les dégâts que TU infliges
    degatsSubis: 1,       // × sur les dégâts que tu SUBIS
    critBonus: 0,         // + sur ta part de coups critiques (0 → 1)
    capture: 1,           // × sur ta chance de capture
    argent: 1,            // × sur l'argent gagné
    expGain: 1,           // × sur l'expérience gagnée
    butinChoix: 0,        // + de cartes proposées au butin
    equipeMax: 6,         // places dans l'équipe
    soinInterdit: false,  // les SOINS quittent le sac de combat (les Balls restent)
    // 🔴 DEUX INTERDITS DIFFÉRENTS, ET ILS ÉTAIENT CONFONDUS. L'acquis « Le pas
    //    de course » annonce « les Centres ne te soignent plus » et posait
    //    `soinInterdit` — qui ferme le sac EN COMBAT et n'a jamais été lu par
    //    l'écran du Centre. La carte faisait donc exactement l'inverse de sa
    //    promesse : elle fermait le sac, pas le Centre, et le Centre soignait
    //    toujours. Un joueur ne pouvait pas comprendre ce qu'il achetait.
    centreInterdit: false, // le Centre Pokémon refuse de soigner
    fuiteInterdite: false, // on ne fuit plus un sauvage
    bossNiveau: 0,        // + de niveaux aux Champions
    // 🔴 LE PLAFOND DE NIVEAU — la mécanique des meilleurs fan games durs
    //    (Radical Red, Emerald Rogue) : on ne monte pas au-dessus du Champion
    //    de l'acte. Le grind cesse d'être une réponse, la COMPOSITION en
    //    devient une. C'est un drapeau, pas un nombre : le nombre dépend de
    //    l'acte, et le composé n'a pas à connaître le monde.
    plafondChampion: false,
    // ═══════════════════════════════════════════════════════════════════════
    //  L'EXPÉRIENCE PARTAGÉE — LA RÉPONSE AU DÉFAUT LE PLUS PROFOND DU MODE
    //
    //  🔴 MESURÉ LE 09/08 SUR 1 618 AFFRONTEMENTS : à CHAQUE arène, exactement
    //     UN Pokémon sur six est au niveau du Champion. Tête d'équipe 72,9 et
    //     MÉDIANE 12,0 devant Giovanni. Un voyage n'est pas une équipe de six,
    //     c'est un porteur solo qui traîne cinq passagers — parce que la
    //     première génération ne donne d'expérience qu'aux combattants, et que
    //     neuf actes amplifient l'écart au lieu de le résorber.
    //  🔴 ET LE REMÈDE CANON NE SUFFIT PAS. Mesuré aussi : en forçant la
    //     politique à TOUJOURS prendre le Multi Exp., la médiane passe de 12,0
    //     à 13,2 et les taux de victoire ne bougent pas. Sa règle d'origine —
    //     moitié aux combattants, moitié partagée entre six — donne 8 % d'une
    //     part normale à chaque passager. Fidèle, et sans effet ici.
    //  🔴 ON N'IMPOSE RIEN, ON OFFRE. C'est la décision déjà prise au v280 pour
    //     le plafond de niveau : l'équilibre du mode ne se change pas sur la foi
    //     du simulateur seul (0,8 % simulé contre 45,7 % réel côté ninja). Un
    //     serment est un CHOIX de départ, cumulable, annoncé, et qui ne touche
    //     personne qui ne l'a pas pris.
    //  ⚠️ C'est un DRAPEAU, pas un multiplicateur : « toute l'équipe gagne » ne
    //     se dose pas. Le prix, lui, est un nombre — et il est dans le serment.
    expPartage: false,
    //  🔴 CE QUE TU ATTRAPES ARRIVE AU NIVEAU DE TA TÊTE D'ÉQUIPE. C'est un
    //     DRAPEAU, pas un multiplicateur : une capture arrive à niveau, ou elle
    //     n'y arrive pas. Il change la FAÇON de jouer, pas un chiffre — un
    //     Pokémon croisé à l'acte 6 cesse d'être une ligne de Pokédex et
    //     redevient un recrutement. Lu à l'entrée de la capture, une seule.
    captureNiveau: false,
    //  🔴 × SUR TES DÉGÂTS QUAND IL NE TE RESTE QU'UN POKÉMON DEBOUT. C'est un
    //     multiplicateur CONDITIONNEL, le premier du contrat : il ne vaut que
    //     dans l'état le plus tendu du mode. Il se heurte de plein fouet aux
    //     serments qui bornent l'équipe à deux ou trois places, et à ceux qui
    //     interdisent le soin — c'est le joueur qui aura fabriqué la rencontre.
    dernierDebout: 1,
  };

  function neutre() {
    var o = {};
    for (var k in CLES) o[k] = CLES[k];
    return o;
  }

  // ── LE POOL ────────────────────────────────────────────────────────────────
  //  Chaque serment porte un COÛT et un GAIN, et les deux sont câblés. Le
  //  libellé dit exactement ce que la table fait : un texte qui promet plus
  //  que le code est un mensonge que le joueur découvre au pire moment.
  var POOL = [
    {
      id: "lame",
      nom: { fr: "Serment de la lame", en: "Oath of the blade" },
      dit: {
        fr: "Tu encaisses moins bien. Tu frappes plus fort.",
        en: "You take more. You hit harder.",
      },
      effet: { degatsInfliges: 1.2, degatsSubis: 1.2 },
    },
    {
      id: "muraille",
      nom: { fr: "Serment de la muraille", en: "Oath of the wall" },
      dit: {
        fr: "Tes coups portent moins. Tu encaisses mieux.",
        en: "Your hits land softer. You take less.",
      },
      effet: { degatsSubis: 0.78, degatsInfliges: 0.88 },
    },
    {
      id: "audace",
      nom: { fr: "Serment de l'audace", en: "Oath of daring" },
      dit: {
        fr: "Le sac reste fermé en combat. Un coup critique sur cinq de plus.",
        en: "The bag stays shut in battle. One more critical hit in five.",
      },
      effet: { critBonus: 0.2, soinInterdit: true },
    },
    {
      id: "chasse",
      nom: { fr: "Serment de la chasse", en: "Oath of the hunt" },
      dit: {
        fr: "Les Champions gagnent deux niveaux. Tes Poké Balls tiennent bien mieux.",
        en: "Gym Leaders gain two levels. Your Poké Balls hold far better.",
      },
      effet: { capture: 1.5, bossNiveau: 2 },
    },
    {
      id: "solitude",
      nom: { fr: "Serment de la solitude", en: "Oath of solitude" },
      dit: {
        fr: "Quatre places dans l'équipe. Chaque combat rapporte moitié plus d'expérience.",
        en: "Four team slots. Every battle grants half again the experience.",
      },
      effet: { equipeMax: 4, expGain: 1.5 },
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE SERMENT DU PLAFOND — CE QUI EMPÊCHE LE GRIND DE RÉPONDRE À TOUT
    //
    //  Mesuré sur 1 618 affrontements : devant le septième Champion, l'écart de
    //  niveau atteint +20 et le combat se gagne à 100 %. Un roguelite dont les
    //  derniers actes sont les plus faciles n'a pas de sommet — et la seule
    //  réponse à une difficulté, aujourd'hui, est de monter d'un niveau de plus.
    //
    //  Les meilleurs fan games durs (Radical Red, Emerald Rogue) répondent par
    //  un PLAFOND : on ne dépasse pas le Champion de l'acte. Le grind cesse
    //  d'être une réponse ; la composition, la couverture de types et l'ordre
    //  d'entrée en deviennent une.
    //
    //  ⚠️ IL EST OPTIONNEL, ET C'EST VOLONTAIRE. Le mode a déjà ses paliers de
    //     difficulté (les sceaux) ; imposer le plafond à tout le monde serait
    //     un changement d'équilibre non validé. Ici c'est un serment : on le
    //     jure, on le voit, et il paie — l'expérience rentre plus vite, elle
    //     attend simplement l'acte suivant pour se convertir.
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: "plafond",
      nom: { fr: "Serment du plafond", en: "Oath of the ceiling" },
      dit: {
        fr: "Tu ne dépasses pas le Champion de l'acte. L'expérience rentre moitié plus.",
        en: "You never outlevel the act's Leader. Experience comes in half again.",
      },
      effet: { plafondChampion: true, expGain: 1.5 },
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  LE SERMENT DE LA TROUPE — SIX POKÉMON QUI JOUENT VRAIMENT
    //
    //  🔴 IL RÉPOND AU DÉFAUT LE PLUS PROFOND DU MODE, ET IL EST MESURÉ : un
    //     Pokémon sur six au niveau du Champion, à chaque arène, sur 1 618
    //     affrontements. Cinq captures sur six deviennent décoratives — ce qui
    //     abîme aussi la boucle de capture, puisqu'attraper ne renforce rien.
    //  🔴 SON PRIX EST CELUI DE LA MÉCANIQUE ELLE-MÊME : l'expérience se répand
    //     au lieu de se concentrer, donc la TÊTE d'équipe monte moins vite. On
    //     échange un porteur qui balaye contre six Pokémon qui tiennent. C'est
    //     un choix de construction, pas un cadeau — et c'est exactement ce que
    //     les meilleurs fan games ont fait de l'Exp. Share.
    //  ⚠️ `expGain: 0.7` N'EST PAS UNE PUNITION, C'EST LA CONSERVATION. Sans
    //     lui, partager multiplierait l'expérience totale du voyage par six et
    //     ferait de ce serment le seul choix rationnel. Sept dixièmes partagés
    //     entre l'équipe restent très au-dessus d'un dixième chacun : le
    //     serment gagne, et il gagne en LARGEUR, pas en hauteur.
    //  ⚠️ IL NE REMPLACE PAS LE MULTI EXP., il le double. L'objet garde sa règle
    //     canon ; le serment, lui, est une règle de voyage. Les cumuler donne un
    //     partage complet — et c'est cohérent : on a juré ET payé l'objet.
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: "troupe",
      nom: { fr: "Serment de la troupe", en: "Oath of the band" },
      dit: {
        fr: "Chacun gagne un tiers d'expérience en moins. Personne n'en est privé.",
        en: "Each one gains a third less experience. Nobody is left out.",
      },
      effet: { expPartage: true, expGain: 0.7 },
    },
    {
      id: "avarice",
      nom: { fr: "Serment de l'avarice", en: "Oath of greed" },
      dit: {
        fr: "Les Poké Balls tiennent bien moins. L'argent double.",
        en: "Your Poké Balls hold far worse. Money doubles.",
      },
      effet: { argent: 2, capture: 0.7 },
    },
    {
      id: "abondance",
      nom: { fr: "Serment de l'abondance", en: "Oath of plenty" },
      dit: {
        fr: "L'argent baisse d'un tiers. Une carte de butin de plus à chaque fois.",
        en: "Money drops by a third. One more loot card each time.",
      },
      effet: { butinChoix: 1, argent: 0.66 },
    },
    {
      id: "honneur",
      nom: { fr: "Serment de l'honneur", en: "Oath of honour" },
      dit: {
        fr: "On ne fuit plus un sauvage. Tes coups gagnent un dixième.",
        en: "No fleeing from the wild. Your hits gain a tenth.",
      },
      effet: { fuiteInterdite: true, degatsInfliges: 1.1 },
    },
    {
      id: "endurance",
      nom: { fr: "Serment de l'endurance", en: "Oath of endurance" },
      dit: {
        fr: "L'expérience baisse d'un quart. Tu encaisses un dixième de moins.",
        en: "Experience drops by a quarter. You take a tenth less.",
      },
      effet: { degatsSubis: 0.9, expGain: 0.75 },
    },
    {
      id: "defi",
      nom: { fr: "Serment du défi", en: "Oath of challenge" },
      dit: {
        fr: "Les Champions gagnent trois niveaux. Deux cartes de butin de plus.",
        en: "Gym Leaders gain three levels. Two more loot cards.",
      },
      effet: { bossNiveau: 3, butinChoix: 2 },
    },
    {
      id: "patience",
      nom: { fr: "Serment de la patience", en: "Oath of patience" },
      dit: {
        fr: "Tes coups perdent un dixième. L'expérience monte d'un tiers.",
        en: "Your hits lose a tenth. Experience rises by a third.",
      },
      effet: { expGain: 1.34, degatsInfliges: 0.9 },
    },
    {
      id: "meute",
      nom: { fr: "Serment de la meute", en: "Oath of the pack" },
      dit: {
        fr: "L'expérience baisse d'un cinquième. Tes Poké Balls tiennent mieux.",
        en: "Experience drops by a fifth. Your Poké Balls hold better.",
      },
      effet: { capture: 1.3, expGain: 0.8 },
    },
    {
      id: "duel",
      nom: { fr: "Serment du duel", en: "Oath of the duel" },
      dit: {
        fr: "Trois places dans l'équipe. Tes coups gagnent un tiers.",
        en: "Three team slots. Your hits gain a third.",
      },
      effet: { equipeMax: 3, degatsInfliges: 1.34 },
    },
    {
      id: "prudence",
      nom: { fr: "Serment de la prudence", en: "Oath of caution" },
      dit: {
        fr: "Un coup critique sur dix en moins. L'argent monte de moitié.",
        en: "One fewer critical hit in ten. Money rises by half.",
      },
      effet: { argent: 1.5, critBonus: -0.1 },
    },
    {
      id: "vertu",
      nom: { fr: "Serment de la vertu", en: "Oath of virtue" },
      dit: {
        fr: "Tu ne rouvres plus ton sac. Tu encaisses un cinquième de moins.",
        en: "You never open your bag again. You take a fifth less.",
      },
      effet: { soinInterdit: true, degatsSubis: 0.8 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  LES ONZE SERMENTS SOUS VERROU — CE QUE LES CHASSES OUVRENT
    //
    //  🔴 UN ROGUELITE OÙ LE POOL NE GROSSIT JAMAIS S'ÉPUISE. Après dix
    //     voyages, les dix-sept premiers serments sont tous connus et le choix
    //     devient une routine. Ceux-ci n'apparaissent qu'une fois la chasse
    //     correspondante accomplie — voir `js/poke/chasses.js`. C'est la
    //     mécanique qui fait qu'un voyage perdu rapporte quand même.
    //
    //  🔴 ILS SONT PLUS TRANCHÉS QUE LES QUINZE PREMIERS, dans les deux sens.
    //     Un serment qu'on a mérité doit se sentir : offrir un vingt et unième
    //     réglage de dix pour cent aurait fait de la récompense une déception.
    //
    //  ⚠️ LE DÉFI DU JOUR NE LES VOIT JAMAIS. Le voyage du jour se compare
    //     entre joueurs : y faire entrer des serments que l'un a ouverts et
    //     l'autre pas casserait la seule règle que ce mode n'a jamais pliée.
    //     `offrir()` reçoit donc un ensemble VIDE au Défi du jour.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LE PREMIER OUVERT, ET IL EST FAIT POUR ÇA. Les huit autres se méritent
    //    par des badges ou une collection ; celui-ci s'ouvre en TRAVERSANT le
    //    monde — dix espèces croisées, pas capturées. C'est le seul que le
    //    premier voyage puisse rapporter, même perdu à l'acte 1, et c'est
    //    exactement le trou que la mesure a trouvé : 30,8 % des voyages
    //    n'accomplissaient AUCUNE chasse, le pilier bâti pour payer un échec.
    //    ⚠️ Ses deux clés sont VIVES et employées ailleurs (`captureNiveau` par
    //       l'acquis du recruteur, `degatsInfliges` partout) : une clé inventée
    //       ne ferait rien, sans erreur — le mode l'a déjà payé.
    {
      id: "arpenteur", verrou: true,
      nom: { fr: "Serment de l'arpenteur", en: "Oath of the surveyor" },
      dit: {
        fr: "Ce que tu attrapes arrive au niveau de ta tête d'équipe. Tes coups perdent un quart.",
        en: "What you catch arrives at your lead's level. Your hits lose a quarter.",
      },
      effet: { captureNiveau: true, degatsInfliges: 0.75 },
    },
    // 🔴 LE ONZIÈME, ET IL RÉPARE UN DOUBLON. « Aucun tombé » — la chasse la plus
    //    exigeante du carnet — ouvrait `collection`, que « Douze espèces »
    //    ouvre déjà : la plus dure ne rapportait donc rien à qui avait fait la
    //    plus simple, tout en le lui promettant à l'écran. Onze chasses
    //    demandent onze serments, sinon l'échelle a un barreau en double.
    //    Son thème suit sa chasse : qui a traversé trois actes sans perdre
    //    personne jure de ne plus jamais reculer.
    {
      id: "rempart", verrou: true,
      nom: { fr: "Serment du rempart", en: "Oath of the rampart" },
      dit: {
        fr: "Tu ne fuis plus. Tu encaisses trois dixièmes de moins, et tu frappes plus juste.",
        en: "No fleeing. You take three tenths less, and you strike truer.",
      },
      effet: { fuiteInterdite: true, degatsSubis: 0.7, critBonus: 0.15 },
    },
    {
      id: "fureur", verrou: true,
      nom: { fr: "Serment de la fureur", en: "Oath of fury" },
      dit: {
        fr: "Tu encaisses moitié de plus. Tes coups gagnent moitié.",
        en: "You take half again. Your hits gain half.",
      },
      effet: { degatsInfliges: 1.5, degatsSubis: 1.5 },
    },
    {
      id: "ermite", verrou: true,
      nom: { fr: "Serment de l'ermite", en: "Oath of the hermit" },
      dit: {
        fr: "Deux places dans l'équipe. L'expérience double.",
        en: "Two team slots. Experience doubles.",
      },
      effet: { equipeMax: 2, expGain: 2 },
    },
    {
      id: "oeil", verrou: true,
      nom: { fr: "Serment de l'œil juste", en: "Oath of the true eye" },
      dit: {
        fr: "Les Champions t'attendent trois niveaux plus haut. Deux coups critiques sur cinq de plus.",
        en: "Gym Leaders wait three levels higher. Two more critical hits in five.",
      },
      effet: { critBonus: 0.4, bossNiveau: 3 },
    },
    {
      id: "collection", verrou: true,
      nom: { fr: "Serment du collectionneur", en: "Oath of the collector" },
      dit: {
        fr: "Tes coups perdent un quart. Tes Poké Balls tiennent deux fois mieux.",
        en: "Your hits lose a quarter. Your Poké Balls hold twice as well.",
      },
      effet: { capture: 2, degatsInfliges: 0.75 },
    },
    {
      id: "marche", verrou: true,
      nom: { fr: "Serment du marché", en: "Oath of the market" },
      dit: {
        fr: "L'argent tombe de moitié. Trois cartes de butin de plus.",
        en: "Money falls by half. Three more loot cards.",
      },
      effet: { butinChoix: 3, argent: 0.5 },
    },
    {
      id: "silence", verrou: true,
      nom: { fr: "Serment du silence", en: "Oath of silence" },
      dit: {
        fr: "Ni sac ni fuite. Tu encaisses un tiers de moins.",
        en: "No bag, no fleeing. You take a third less.",
      },
      effet: { soinInterdit: true, fuiteInterdite: true, degatsSubis: 0.66 },
    },
    {
      id: "fortune", verrou: true,
      nom: { fr: "Serment de la fortune", en: "Oath of fortune" },
      dit: {
        fr: "L'expérience tombe de moitié. L'argent triple.",
        en: "Experience falls by half. Money triples.",
      },
      effet: { argent: 3, expGain: 0.5 },
    },
    {
      id: "titan", verrou: true,
      nom: { fr: "Serment du titan", en: "Oath of the titan" },
      dit: {
        fr: "Les Champions gagnent cinq niveaux. Tes coups gagnent moitié.",
        en: "Gym Leaders gain five levels. Your hits gain half.",
      },
      effet: { bossNiveau: 5, degatsInfliges: 1.5 },
    },
    {
      id: "sacrifice", verrou: true,
      nom: { fr: "Serment du sacrifice", en: "Oath of sacrifice" },
      dit: {
        fr: "Trois places, sac fermé. Tes coups et tes Poké Balls gagnent un tiers.",
        en: "Three slots, bag shut. Your hits and Poké Balls gain a third.",
      },
      effet: { equipeMax: 3, soinInterdit: true, degatsInfliges: 1.34, capture: 1.34 },
    },
  ];

  var PAR_ID = {};
  for (var i = 0; i < POOL.length; i++) PAR_ID[POOL[i].id] = POOL[i];

  // ── LA PORTE UNIQUE ────────────────────────────────────────────────────────
  //  🔴 LES MULTIPLICATEURS SE COMPOSENT, LES SEUILS SE CUMULENT, ET LES
  //     BORNES SE PRENNENT AU PLUS SERRÉ. Trois serments qui ajoutent chacun
  //     vingt pour cent de dégâts en donnent 1,728 — pas 1,6. C'est voulu :
  //     s'engager trois fois dans la même voie doit se sentir. Mais les places
  //     d'équipe prennent le MINIMUM, jamais la somme : deux serments de
  //     solitude ne laissent pas deux places, ils en laissent quatre.
  //  🔴 LA RÈGLE DU JOUR SE FOND ICI, PAS AILLEURS. Elle s'exprime dans les
  //     mêmes clés que les serments ; lui donner son propre composeur aurait
  //     créé un second endroit où borner un empilement — et c'est comme ça
  //     qu'on obtient deux vérités sur les mêmes dégâts.
  function listeDesEffets(partie) {
    var out = [];
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LA RÈGLE « EXPRESS » ÉTAIT DEVENUE INFRANCHISSABLE — 14/08, mesuré
    //     sur 400 voyages : **0 % de badges, 0 % de Ligue, médiane 0**. Elle ne
    //     se termine plus jamais.
    //     Sa promesse est « moitié moins de rangées par acte » : un raccourci
    //     payé en expérience et en butin, récompensé par un quart de score en
    //     plus. Elle tenait tant que les Champions étaient au canon. Depuis
    //     qu'ils montent de +9 à +14, arriver avec deux fois moins de nœuds
    //     n'est plus un raccourci, c'est une impasse — et c'est mon
    //     durcissement qui l'a fermée.
    //  ✅ ON LUI REND SA VIABILITÉ SANS LUI RENDRE SA LONGUEUR : l'expérience
    //     par combat monte, parce qu'il y a moitié moins de combats. La règle
    //     garde donc son identité — une route COURTE — et cesse d'être une
    //     route MORTE. Le butin, lui, reste rare : c'est là qu'elle se paie.
    //  ⚠️ PAR LA MÊME PORTE QUE TOUT LE RESTE. Une règle qui pousserait ses
    //     effets ailleurs serait invisible au composé, et le mode a déjà payé
    //     ça deux fois (le Sceau de la Cascade, les acquis).
    //  📏 LA VALEUR EST MESURÉE, PAS DEVINÉE — 1400 voyages, trois essais :
    //     1,45 → 16,3 % de badges (trop dure, médiane 1) · 1,60 → 26,3 %
    //     (elle passait DEVANT le voyage, ce qui n'a aucun sens pour une route
    //     qu'on paie) · **1,52 → 24,4 % de badges, 17,5 % de Ligue, médiane 2**,
    //     à côté du voyage (23,9 % / 14,9 % / médiane 3).
    //     Le bon repère n'est PAS « le même taux de fin » mais « la même fin,
    //     une autre FORME » : express tue 30 % au premier acte contre 17 %, ne
    //     croise aucun comptoir une fois sur deux, et rend la moitié du Pokédex.
    //     Elle est plus courte et plus risquée, pas plus facile.
    // ═══════════════════════════════════════════════════════════════════════
    if (partie && partie.regle === "express") out.push({ expGain: 1.52 });
    var pris = (partie && partie.serments) || [];
    for (var i = 0; i < pris.length; i++) if (PAR_ID[pris[i]]) out.push(PAR_ID[pris[i]].effet);
    var r = W.PokeRegleDuJour ? W.PokeRegleDuJour.effetDe(partie) : null;
    if (r) out.push(r);
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LES ACQUIS SE COMPOSENT ICI, ET NULLE PART AILLEURS. C'est la leçon
    //     que le Sceau de la Cascade a coûtée : il se composait dans l'écran, et
    //     une correction du butin lisait le composé sans le voir — trois cartes
    //     au lieu de deux, dans le sens qui avantage le joueur, sans un mot.
    //     Un acquis pousse donc exactement les mêmes clés qu'un serment, par la
    //     même boucle, et le combat comme le butin le lisent sans rien savoir de
    //     lui. C'est ce qui garantit qu'il ne peut pas avoir de branche morte.
    //  ⚠️ APRÈS les serments et la règle du jour, AVANT les bornes : un acquis
    //     est un gain, il doit pouvoir être rogné par les mêmes plafonds.
    // ═══════════════════════════════════════════════════════════════════════
    if (W.PokeAcquis) {
      var acq = W.PokeAcquis.effets(partie);
      for (var q = 0; q < acq.length; q++) out.push(acq[q]);
    }
    return out;
  }

  function effet(partie) {
    var e = neutre();
    var sources = listeDesEffets(partie);
    for (var i = 0; i < sources.length; i++) {
      var s = { effet: sources[i] };
      for (var k in s.effet) {
        if (!(k in CLES)) continue;
        var v = s.effet[k];
        if (typeof v === "boolean") e[k] = e[k] || v;
        else if (k === "equipeMax") e[k] = Math.min(e[k], v);
        else if (k === "critBonus" || k === "butinChoix" || k === "bossNiveau") e[k] += v;
        else e[k] *= v;
      }
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE SCEAU SE COMPOSE ICI, ET PLUS DANS L'ÉCRAN. Il vivait dans le
    //     `SERM()` de `ui.js` — une deuxième composition, invisible à qui
    //     appelle `PokeSerments.effet` directement. Trouvé en corrigeant le
    //     butin : ma correction lisait le composé et voyait les serments mais
    //     PAS le Sceau de la Cascade, qui retire une carte. Trois cartes au
    //     lieu de deux, dans le sens qui avantage le joueur, sans un mot.
    //     Il n'y a donc qu'UNE composition — serments, règle du jour, sceau —
    //     et tout le monde la lit par la même porte.
    //  🔴 ET IL VIENT APRÈS LES BORNES DES SERMENTS, PAS AVANT. Je l'avais
    //     d'abord posé avant, ce qui paraissait plus propre — et ça DÉTRUISAIT
    //     le Sceau de la Cascade : les bornes de serment plafonnent `butinChoix`
    //     à zéro (un serment ne doit pas retirer de carte), donc le −1 du sceau
    //     était effacé et le joueur gardait ses trois cartes. Les sceaux ont
    //     leurs PROPRES bornes (−2 à 3), plus larges, parce qu'ils ont le droit
    //     de retirer ce qu'un serment n'a pas le droit de retirer.
    //     ⚠️ Vu en mesurant le composé, pas en relisant : `effet({sceau:2})
    //        .butinChoix` rendait 0 au lieu de −1. Consolider deux compositions
    //        ne consiste pas à les additionner : leur ORDRE portait une règle.
    // ═══════════════════════════════════════════════════════════════════════

    // Les bornes de sûreté des SERMENTS : un empilement ne doit jamais rendre
    // le jeu absurde. Elles ne valent que pour ce qu'on a juré.
    e.equipeMax = Math.max(1, e.equipeMax);
    e.critBonus = Math.max(-0.2, Math.min(0.6, e.critBonus));
    e.degatsSubis = Math.max(0.35, e.degatsSubis);
    e.degatsInfliges = Math.max(0.4, e.degatsInfliges);
    e.capture = Math.max(0.4, e.capture);
    e.expGain = Math.max(0.4, e.expGain);
    e.argent = Math.max(0.4, e.argent);
    // 🔴 LE PLANCHER DE `butinChoix` EFFAÇAIT LE PRIX D'UN ACQUIS. « L'acharnement »
    //    déclare `butinChoix: -1` — une carte de butin en moins, écrit sur sa
    //    carte — et ce `Math.max(0, …)` le rabotait : mesuré,
    //    `effet({acquis:["acharnement"]}).butinChoix` rendait **0**, donc le
    //    joueur gardait ses trois cartes dans le sens qui l'avantage, sans un
    //    mot. C'est EXACTEMENT l'incident du Sceau de la Cascade, raconté vingt
    //    lignes plus haut, rejoué sur les acquis.
    //  ⚠️ Le plancher existe pour empêcher un SERMENT de retirer une carte. Un
    //     acquis, lui, a le droit — c'est son prix annoncé. On descend donc le
    //     plancher à −1 : assez pour qu'un prix se paie, pas assez pour qu'un
    //     empilement vide le butin.
    e.butinChoix = Math.max(-1, Math.min(3, e.butinChoix));
    e.bossNiveau = Math.max(0, Math.min(9, e.bossNiveau));

    // Le sceau ensuite, avec ses bornes à lui : c'est une difficulté imposée,
    // et elle a le droit d'aller là où un serment n'a pas le droit d'aller.
    if (W.PokeSceaux && partie && partie.sceau) W.PokeSceaux.appliquer(e, partie.sceau);
    return e;
  }

  // ── LES TROIS PROPOSITIONS ─────────────────────────────────────────────────
  //  🔴 ON NE REPROPOSE JAMAIS UN SERMENT DÉJÀ PRIS. Sans ça, la fin d'un
  //     voyage n'offrirait plus que des doublons — et le dernier badge, celui
  //     qui devrait porter la décision la plus lourde, deviendrait le plus
  //     pauvre. C'est la faute qu'on retrouve dans tous les tirages sans
  //     mémoire.
  //  🔴 LE NOMBRE DE TIRAGES NE DÉPEND PAS DE CE QUI EST DÉJÀ PRIS : on
  //     mélange TOUT le pool, puis on filtre. Un tirage dont le compte varie
  //     avec l'état de la partie casse le rejeu — le mode l'a déjà payé.
  function offrir(partie, h, combien) {
    var n = combien || 3;
    var pris = {};
    var deja = (partie && partie.serments) || [];
    for (var i = 0; i < deja.length; i++) pris[deja[i]] = true;
    var ordre = POOL.slice();
    // Mélange de Fisher-Yates, toujours sur la longueur PLEINE du pool.
    for (var j = ordre.length - 1; j > 0; j--) {
      var k = h.entier(j + 1);
      var t = ordre[j]; ordre[j] = ordre[k]; ordre[k] = t;
    }
    // 🔴 LE VERROU SE LÈVE PAR `partie.sermentsOuverts`, ET IL EST FILTRÉ ICI,
    //    APRÈS LE MÉLANGE. Filtrer avant aurait fait varier la longueur du
    //    tableau mélangé, donc le NOMBRE de tirages, donc toutes les graines
    //    du mode — un joueur qui a ouvert trois serments n'aurait plus joué le
    //    même monde qu'un joueur qui n'en a ouvert aucun. Le mélange porte
    //    toujours sur le pool PLEIN ; le filtre ne fait que sauter des cases.
    var ouverts = (partie && partie.sermentsOuverts) || {};
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 UN COÛT DÉJÀ PAYÉ DEVENAIT UN BONUS GRATUIT. Les coûts booléens se
    //     composent par `||` — ce qui est juste — mais un serment dont le SEUL
    //     prix est un drapeau déjà levé n'a plus de prix du tout. Mesuré :
    //     Sceau 3 (`plafondChampion`) plus le Serment du plafond donnait
    //     **`expGain` 1,5 pour zéro contrepartie**, la carte affichant quand
    //     même « tu ne dépasses pas le Champion de l'acte » — une règle que le
    //     sceau imposait DÉJÀ. Même chose pour `audace` après `vertu`, pour
    //     `silence`, pour `sacrifice`, et pour l'acquis du pas de course.
    //  ✅ ON NE LE PROPOSE PLUS. Le composé reste juste ; c'est l'OFFRE qui
    //     cesse de présenter un marché qui n'en est pas un.
    //  ⚠️ APRÈS LE MÉLANGE, comme le verrou, et pour la même raison : filtrer
    //     avant ferait varier le nombre de tirages, donc toutes les graines.
    // ═══════════════════════════════════════════════════════════════════════
    var out = [];
    for (var m = 0; m < ordre.length && out.length < n; m++) {
      var s = ordre[m];
      if (pris[s.id]) continue;
      if (s.verrou && !ouverts[s.id]) continue;
      if (coutDejaPaye(s, partie)) continue;
      out.push(s);
    }
    return out;
  }

  // Vrai quand TOUT ce que ce serment coûte est déjà en vigueur — donc quand il
  // ne resterait de lui que ses gains. Un serment sans prix n'est pas un choix.
  function coutDejaPaye(s, partie) {
    var enCours = null;
    var couts = 0, payes = 0;
    for (var k in s.effet) {
      if (typeof s.effet[k] !== "boolean" || !s.effet[k]) continue;
      // `expPartage` est un GAIN booléen, pas un prix : il ne compte pas.
      if (k === "expPartage" || k === "captureNiveau") continue;
      couts++;
      if (!enCours) enCours = effet(partie);
      if (enCours[k]) payes++;
    }
    return couts > 0 && couts === payes;
  }

  function prendre(partie, id) {
    if (!PAR_ID[id]) return false;
    if (!partie.serments) partie.serments = [];
    if (partie.serments.indexOf(id) >= 0) return false;
    partie.serments.push(id);
    return true;
  }

  function de(id) { return PAR_ID[id] || null; }

  // 🔴 PAS DE PORTE `tous()`. Elle a existé une heure, et le détecteur de
  //    portes mortes l'a refusée à raison : seul l'outil de contrôle
  //    l'appelait. Une porte qu'aucun joueur ne franchit n'est pas gardée par
  //    l'outil qui la franchit — elle est MAQUILLÉE par lui. Le détecteur
  //    énumère donc le pool par `offrir()`, la porte que le jeu emprunte
  //    vraiment : ce qu'il mesure est ce qui se joue.
  W.PokeSerments = {
    CLES: CLES,
    neutre: neutre,
    effet: effet,
    offrir: offrir,
    prendre: prendre,
    de: de,
  };
})(typeof window !== "undefined" ? window : globalThis);
