// ═══════════════════════════════════════════════════════════════════════════
//  CE QUE FAIT UN OBJET — UNE SEULE PHRASE, TROIS ÉCRANS
//
//  La carte de butin, l'étal de la boutique et l'infobulle du sac posent tous
//  la même question : « à quoi sert ce truc ? ». Elle n'a qu'une réponse, et
//  elle est ici.
//
//  🔴 POURQUOI CE FICHIER EXISTE. Ces branches vivaient dans `ditButin`, au
//     milieu de `ui.js` — 325 Ko d'écran qui touchent `document` dès leur
//     chargement, donc INVÉRIFIABLES en Node. Le seul contrôle possible était
//     de relire la source à coups d'expressions régulières, c'est-à-dire de
//     RECOPIER la règle dans l'outil qui la juge. Deux copies de la même règle,
//     c'est la faute que ce dossier traque depuis le premier jour.
//     Ici, `tools/poke-sac.mjs` APPELLE la vraie fonction.
//
//  🔴 `T` EST INJECTÉ, ET C'EST VOULU. Le dictionnaire reste dans l'écran ;
//     ce fichier ne connaît que des CLÉS. Un contrôle peut donc lui passer un
//     `T` qui rend la clé elle-même et vérifier qu'aucun objet ne repart les
//     mains vides, sans rien savoir du français ni de l'anglais.
//
//  🔴 IL VIT DANS LES ÉCRANS. Il ne décide de rien : aucun rejeu serveur n'en
//     dépend, et une légende ne change pas un combat.
// ═══════════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a son itinéraire, ses clés et ses zones.
  var ETAPES = function () { return (W.PokeRegles && W.PokeRegles.etapes()) || W.POKE_ETAPES || []; };
  var CLES_V = function () { return (W.PokeRegles && W.PokeRegles.clesVoyage()) || W.POKE_CLES || {}; };
  var ZONES = function () { return (W.PokeRegles && W.PokeRegles.zones()) || W.POKE_ZONES || []; };
  var LIEUX = function () { return (W.PokeRegles && W.PokeRegles.lieux()) || W.POKE_LIEUX || {}; };

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUI SE VEND — LA MÊME PORTE QUE CE QUI SE RAMASSE
  //
  //  🔴 LA BOUTIQUE MONTRAIT UN NOM ET UN PRIX. « Attaque + · 500 ₽ » ne dit
  //     rien à qui n'a pas joué au jeu de 1996 — alors que les objets X sont
  //     l'outil qui gagne un combat de Champion en première génération : deux
  //     Attaque + avant de frapper valent mieux que six potions. Un joueur qui
  //     ne sait pas achète des potions.
  // ═══════════════════════════════════════════════════════════════════════════
  var DIT_OBJET = {
    X_ATTACK: "bDitXAtt", X_DEFEND: "bDitXDef", X_SPEED: "bDitXVit",
    X_SPECIAL: "bDitXSpe", X_ACCURACY: "bDitXPrecision",
    DIRE_HIT: "bDitDireHit", GUARD_SPEC: "bDitGardeStats",
    REPEL: "bDitRepousse", SUPER_REPEL: "bDitRepousse", MAX_REPEL: "bDitRepousse",
    ESCAPE_ROPE: "bDitCorde", POKE_DOLL: "bDitPoupee",
    FULL_RESTORE: "bDitGuerison",
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 TROIS OBJETS DONNÉS AU JOUEUR, ET MUETS DANS SON SAC — 11/08/2026.
    //    `poke-cles-mortes` le relevait à chaque passage : « ET ELLE EST
    //    DONNÉE au joueur — il la reçoit, elle s'affiche dans son sac, et sa
    //    ligne "elle ouvre" reste vide ». Le relevé n'a jamais été lu parce que
    //    la BATTERIE jetait la sortie des détecteurs verts. Deux défauts
    //    empilés, et le second cachait le premier.
    // ⚠️ ON NE LEUR REND PAS UN RÔLE — ce serait un changement de jeu, et le
    //    détecteur le dit : poser `exige: ["velo"]` FERMERAIT du contenu.
    //    On leur rend la PAROLE : chacune dit ce qu'elle était dans le ROM et
    //    pourquoi elle ne sert à rien ici. Un objet qui explique son inutilité
    //    est un clin d'œil ; un objet muet est un bug.
    // ═══════════════════════════════════════════════════════════════════════
    BICYCLE: "bDitVelo", CARD_KEY: "bDitCarteMag", GOLD_TEETH: "bDitDentier",
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 LES REMÈDES D'ÉTAT N'AVAIENT PAS UN MOT, et ce sont les cartes qui
  //    répondent aux deux murs du mode. `butin.js` documente la mesure : devant
  //    Erika et Koga, le taux de victoire tombe à 7 % et 3 % À NIVEAU ÉGAL —
  //    parce que Rafflesia endort et empoisonne, et que Koga aligne quatre
  //    Poison. Ces familles ont été ajoutées POUR ça. Et leur carte ne disait
  //    rien : « Antidote » contre « Potion ×3 », un joueur prend les potions.
  //    Il prend le mauvais outil pour le mur qui l'attend, et rien à l'écran ne
  //    l'a jamais prévenu.
  // 🔴 CHACUN NOMME SON ÉTAT, PAS SA CATÉGORIE. « Guérit un état » ne se relie
  //    à rien ; « guérit le poison » se relie au Champion Poison qu'on a vu
  //    annoncé trois rangées plus haut.
  // ═══════════════════════════════════════════════════════════════════════════
  var DIT_ETAT = {
    ANTIDOTE: "bDitAntidote",
    PARLYZ_HEAL: "bDitParalysie",
    AWAKENING: "bDitSommeil",
    BURN_HEAL: "bDitBrulure",
    ICE_HEAL: "bDitGel",
    FULL_HEAL: "bDitTousEtats",
  };

  // Les quatre Balls ne se valent pas, et la Master Ball encore moins : une
  // légende commune faisait passer la seule Ball infaillible du voyage pour
  // « de quoi capturer ».
  var DIT_BALL = {
    MASTER_BALL: "bDitBallMaster",
    ULTRA_BALL: "bDitBallHyper",
    GREAT_BALL: "bDitBallSuper",
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA CANNE
  //
  //  🔴 ELLE NE DISAIT RIEN — elle tombait dans le retour vide, avec pour seule
  //     légende son nom. Or c'est la SEULE carte du butin qui ouvre un TYPE DE
  //     NŒUD pour tout le reste du voyage : `carte-actes.js` l'écrit noir sur
  //     blanc — « une carte qui ouvre un type de nœud vaut mieux que dix
  //     objets » — et le joueur ne pouvait pas le savoir. Il la laissait pour
  //     trois potions, ce qui est le bon calcul quand on ignore l'autre.
  //  🔴 ET ELLE DIT COMBIEN D'ESPÈCES ELLE ATTEINT, parce que les trois cannes
  //     ne se valent pas du tout : la Vieille Canne ne donne QUE Magicarpe, la
  //     Méga Canne en ouvre douze. Une légende commune aurait menti sur deux
  //     des trois.
  //  ⚠️ ET ELLE DIT QU'ELLE EST UN BARREAU, PAS UN SOMMET. `canneSuivante` rend
  //     la PREMIÈRE canne qu'on n'a pas : refuser la Vieille Canne, qui ne
  //     donne que Magicarpe, bloque les quatorze autres espèces pour tout le
  //     voyage. Annoncer « 1 espèce au bout » sans le dire aurait été un
  //     mauvais conseil déguisé en information — et le joueur l'aurait suivi.
  // ═══════════════════════════════════════════════════════════════════════════
  function ditCanne(cle, T) {
    var vues = {};
    var etapes = ETAPES() || [];
    for (var i = 0; i < etapes.length; i++) {
      var t = (W.PokeCarteActes && W.PokeCarteActes.tablePeche(cle, etapes[i].lieu)) || [];
      for (var k = 0; k < t.length; k++) vues[t[k].n] = true;
    }
    var suite = false, apres = false;
    var lst = (W.PokeButin && W.PokeButin.CANNES) || [];
    for (var j = 0; j < lst.length; j++) {
      if (apres) { suite = true; break; }
      if (lst[j].objet === cle) apres = true;
    }
    return T(suite ? "bDitCanneEchelle" : "bDitCanne", { n: Object.keys(vues).length });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA PHRASE
  //
  //  Rend "" quand l'objet n'a rien à dire — un badge, une clé de scénario, un
  //  étage de la tour Silph. Aucun de ces objets n'atteint le sac du joueur.
  // ═══════════════════════════════════════════════════════════════════════════
  function objet(cle, T, nomStat) {
    if (!cle) return "";
    if (cle === "RARE_CANDY") return T("bDitBonbon");
    // ═════════════════════════════════════════════════════════════════════════
    // 🔴 LES CINQ VITAMINES ÉTAIENT MUETTES DÈS QU'ON NE LES REGARDAIT PAS EN
    //    CARTE DE BUTIN. Elles se vendent 9 800 ₽ pièce au 5F de Céladopole —
    //    l'objet le plus cher du mode après la Pépite — et à l'étal comme au
    //    sac, « Protéine » ne disait rien du tout. Leur phrase existait, mais
    //    UNIQUEMENT sur la branche `type: "vitamine"` : le même objet parlait
    //    ramassé et se taisait acheté.
    // 🔴 LA STATISTIQUE SE LIT DANS `VITAMINES`, la table qui l'applique. Le
    //    nom lisible, lui, reste à l'écran : ce fichier ne connaît pas les
    //    langues, il ne connaît que des clés.
    // ═════════════════════════════════════════════════════════════════════════
    var vitamines = (W.PokeObtenir && W.PokeObtenir.VITAMINES) || {};
    if (vitamines[cle]) {
      var s = vitamines[cle];
      return T("bDitVitamine", { stat: nomStat ? nomStat(s) : s });
    }
    if (DIT_BALL[cle]) return T(DIT_BALL[cle]);
    if (/BALL/.test(cle)) return T("bDitBall");
    // ═════════════════════════════════════════════════════════════════════════
    // 🔴 LA LÉGENDE SE LIT DANS LA TABLE QUI APPLIQUE L'OBJET. `OBJETS_SOIN`
    //    décide de ce qui se passe quand on boit la Potion ; c'est donc elle
    //    qui doit dire ce qu'elle fait. Une seule légende couvrait Potion,
    //    Super Potion et Hyper Potion — qui rendent 20, 50 et 200 PV : elle
    //    mentait sur deux objets sur trois, et l'écart de prix (300 ₽ contre
    //    1 500 ₽) devenait incompréhensible.
    // 🔴 CE QUI SOIGNE **ET** GUÉRIT GARDE SA PHRASE. La Guérison rend tous les
    //    PV et lève tous les états ; « Rend tous les PV » serait vrai et
    //    incomplet — la moitié la plus chère de l'objet disparaîtrait. Le test
    //    `!o.etat` fait exactement ce tri, sans liste à tenir à jour.
    // ═════════════════════════════════════════════════════════════════════════
    var loi = (W.PokeCombat && W.PokeCombat.OBJETS_SOIN) || {};
    var soin = loi[cle];
    if (soin && !soin.etat) {
      if (soin.ranime) return T(soin.ranime >= 1 ? "bDitRappelMax" : "bDitRappel");
      if (soin.soin) return soin.soin < 0 ? T("bDitSoinMax") : T("bDitSoin", { n: soin.soin });
    }
    if (DIT_ETAT[cle]) return T(DIT_ETAT[cle]);
    // ═════════════════════════════════════════════════════════════════════════
    // 🔴 L'EXP.ALL NON PLUS N'AVAIT RIEN — la carte que `ui.js` décrit lui-même
    //    comme celle « qui change un voyage ». Mesuré : elle sort 126 fois sur
    //    800 tirages, donc régulièrement, et sa légende était vide. Elle répare
    //    le défaut structurel du mode : en première génération, seuls les
    //    COMBATTANTS gagnent de l'expérience, si bien qu'une équipe finit à
    //    « Florizarre N.43 et trois Roucool N.5 ». Sans un mot, elle ressemble
    //    à un objet de plus.
    // ═════════════════════════════════════════════════════════════════════════
    if (cle === "EXP_ALL") return T("bDitExpAll");
    if (DIT_OBJET[cle]) return T(DIT_OBJET[cle]);
    if (/STONE/.test(cle)) return T("bDitPierre");
    if (/ROD/.test(cle)) return ditCanne(cle, T);
    return "";
  }

  W.PokeDits = { objet: objet };
})(typeof window !== "undefined" ? window : globalThis);
