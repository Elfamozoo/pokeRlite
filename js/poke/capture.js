(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA CAPTURE
  //
  //  🔴 FICHIER PUR. Le résultat est calculé AVANT l'animation, et l'animation
  //     ne peut pas le contredire. Trois secousses puis une évasion, c'est du
  //     jeu ; une animation qui décide du sort, c'est un bug.
  //
  //  Ce qui vient du jeu d'origine, et qu'on ne discute pas :
  //   · la Master Ball ne rate jamais ;
  //   · un Pokémon ENDORMI ou GELÉ est bien plus facile à prendre qu'un
  //     Pokémon paralysé, brûlé ou empoisonné ;
  //   · les PV restants comptent énormément — c'est ce qui rend la scène de
  //     l'animé exacte : on affaiblit, on endort, puis on lance ;
  //   · le taux de capture de l'espèce fait le reste. Ronflex est à 25,
  //     Mewtwo à 3, Chenipan à 255. Ces nombres ne s'arrondissent pas.
  //
  //  ⚠️ CE QUI EST À NOUS, ET QUI EST ASSUMÉ : le nombre de secousses. Il est
  //     DÉDUIT de la même valeur que le résultat, jamais tiré à part. Une
  //     capture ratée de justesse secoue trois fois ; une capture sans espoir
  //     ne secoue pas. On ne prétend pas reproduire l'algorithme de secousses
  //     du ROM — on garantit ce qui compte au joueur : l'animation dit la
  //     vérité du calcul.
  // ═══════════════════════════════════════════════════════════════════════════

  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };

  // Les Balls. `tirage` est la borne du premier jet, `facteur` intervient dans
  // le calcul de valeur : plus il est bas, meilleure est la Ball.
  // 🔴 LE FACTEUR 8 N'APPARTIENT QU'À LA SUPER BALL. Le ROM
  //    (`item_effects.asm`, bloc `.skip1`) est explicite : « It's 8 for Great
  //    Balls and 12 for the others ». L'avantage de l'Hyper Ball en première
  //    génération tient UNIQUEMENT à sa plage de jet — 0-150 au lieu de 0-200 —
  //    jamais au diviseur de PV. Les deux étaient à 8 : Hyper et Safari
  //    valaient donc une fois et demie leur vraie force, et `chance()` lisant
  //    la même table, le pourcentage annoncé à l'écran mentait avec elles.
  //    ⚠️ Écart NON déclaré dans l'en-tête, contrairement au nombre de
  //       secousses : ce n'était pas un choix, c'était une erreur.
  var BALLS = {
    POKE_BALL: { tirage: 256, facteur: 12, safari: false },
    GREAT_BALL: { tirage: 201, facteur: 8, safari: false },
    ULTRA_BALL: { tirage: 151, facteur: 12, safari: false },
    SAFARI_BALL: { tirage: 151, facteur: 12, safari: true },
    MASTER_BALL: { tirage: 0, facteur: 0, safari: false },
  };

  // Seuils d'aide selon le statut, tels que le jeu les applique : le sommeil et
  // le gel valent bien plus que le poison ou la paralysie.
  var AIDE_STATUT = { sommeil: 25, gel: 25, para: 12, brulure: 12, poison: 12, poisonGrave: 12 };

  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 `serments` EST UN NOMBRE, PAS UNE LISTE. C'est `PokeSerments.effet()`
  //     qui l'a composé et borné ; la capture n'a pas à savoir qu'il existe des
  //     serments. Un multiplicateur au-dessus de un fait tenir les Balls mieux
  //     — Serment de la chasse, Serment de la meute —, au-dessous il les fait
  //     tenir moins — Serment de l'avarice.
  //  🔴 IL AGIT SUR LE TAUX DE L'ESPÈCE, PAS SUR LES TIRAGES. Le nombre
  //     d'appels à `h` ne bouge d'aucune façon : le rejeu d'une graine reste
  //     exact, et c'est la condition pour que le Défi du jour survive à
  //     l'arrivée des serments.
  // ═══════════════════════════════════════════════════════════════════════════
  function tenter(cible, cleBall, h, serments) {
    var ball = BALLS[cleBall];
    if (!ball) throw new Error("Poké Ball inconnue : " + cleBall);

    // La Master Ball. Un seul exemplaire dans la partie, et il ne rate jamais.
    if (cleBall === "MASTER_BALL") {
      return { pris: true, secousses: 3, raison: "master" };
    }

    var taux = ESP()[cible.n].capture;
    if (serments && serments !== 1) taux = Math.max(1, Math.min(255, Math.round(taux * serments)));
    var jet = h.entier(ball.tirage);

    // 1 · Le statut peut emporter la capture d'un coup.
    var aide = AIDE_STATUT[cible.statut] || 0;
    if (aide && jet < aide) return { pris: true, secousses: 3, raison: "statut" };

    // 2 · Le taux de l'espèce est une porte franche : au-dessus, c'est non.
    //     🔴 C'est ici que se joue la rareté. Un Mewtwo à 3 recale presque tous
    //        les jets, et c'est voulu (§4bis du brief).
    if (jet > taux) return { pris: false, secousses: secoussesRatees(jet, taux), raison: "taux" };

    // 3 · Les PV restants. La valeur est bornée à 255 ; à 255 la capture est
    //     acquise. Descendre la cible au rouge fait donc toute la différence.
    var pvMax = cible.stats.pv;
    var pv = Math.max(1, cible.pv);
    var valeur = Math.floor((pvMax * 255 * 4) / (pv * ball.facteur));
    if (valeur >= 255) return { pris: true, secousses: 3, raison: "affaibli" };

    var second = h.entier(256);
    if (second <= valeur) return { pris: true, secousses: 3, raison: "calcul" };

    // Raté — mais de combien ? La secousse dit au joueur s'il était près du
    // but. C'est l'information la plus utile de tout l'écran de capture.
    var marge = (valeur + 1) / 256;
    var s = marge > 0.66 ? 3 : marge > 0.33 ? 2 : marge > 0.10 ? 1 : 0;
    return { pris: false, secousses: s, raison: "pv" };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA CHANCE, AVANT DE LANCER — LA MÉCANIQUE LA PLUS CHÈREMENT CACHÉE DU MODE
  //
  //  🔴 MESURÉ, ET C'EST ÉNORME : Artikodin niveau 50 à la Super Ball, c'est
  //     2,6 % éveillé et 16,0 % ENDORMI. Six fois mieux. Le savoir-faire de la
  //     première génération — on affaiblit, on endort, PUIS on lance — est
  //     entièrement câblé au-dessus… et rien à l'écran ne le dit. Sur 300
  //     voyages du harnais, les trois oiseaux ont été croisés douze fois et
  //     capturés ZÉRO fois. La politique ne pense pas à endormir ; un joueur qui
  //     n'a pas grandi avec le jeu n'y pense pas non plus. Et le nœud du
  //     légendaire annonce lui-même « un seul essai, et il ne revient pas » :
  //     l'ignorance coûte l'espèce, définitivement.
  //
  //  🔴 ON DONNE DONC LE CHIFFRE, PAS UN CONSEIL. « Endors-le d'abord » est un
  //     tutoriel ; « 2,6 % · endormi 16 % » est une DÉCISION — risquer la Ball
  //     maintenant, ou passer un tour à endormir en espérant qu'il ne fuie pas.
  //     C'est ce que font les meilleurs fan games, et pour cette raison.
  //
  //  🔴 CALCUL ANALYTIQUE, AUCUN TIRAGE CONSOMMÉ. Il ne prend pas de `h` : une
  //     estimation qui piocherait dans la graine décalerait tout le rejeu, et le
  //     Défi du jour mourrait le jour où l'on ouvre son sac. Il relit les MÊMES
  //     constantes et les mêmes bornes que `tenter` — deux tables auraient
  //     divergé au premier ajustement, et l'écran aurait menti sur la seule
  //     chose qu'on lui demande.
  // ═══════════════════════════════════════════════════════════════════════════
  function chance(cible, cleBall, serments, statutSuppose) {
    var ball = BALLS[cleBall];
    if (!ball) return 0;
    if (cleBall === "MASTER_BALL") return 1;

    var taux = ESP()[cible.n].capture;
    if (serments && serments !== 1) taux = Math.max(1, Math.min(255, Math.round(taux * serments)));

    var R = ball.tirage;                       // le jet vit dans [0, R[
    var statut = statutSuppose === undefined ? cible.statut : statutSuppose;
    var aide = Math.min(AIDE_STATUT[statut] || 0, R);

    // 1 · Le statut emporte la capture quand jet < aide.
    var pStatut = aide / R;

    // 2 · Sinon, le taux est une porte franche : il faut jet ≤ taux.
    //     ⚠️ Les jets sous `aide` sont DÉJÀ comptés au-dessus : on ne prend ici
    //        que la tranche [aide, min(taux, R-1)]. Sans cette borne basse, un
    //        Chenipan endormi passerait au-dessus de 100 %.
    var hautPorte = Math.min(taux, R - 1);
    var pPorte = Math.max(0, hautPorte - aide + 1) / R;
    if (pPorte <= 0) return pStatut;

    // 3 · Les PV restants, exactement comme dans `tenter`.
    var pvMax = cible.stats.pv;
    var pv = Math.max(1, cible.pv);
    var valeur = Math.floor((pvMax * 255 * 4) / (pv * ball.facteur));
    var pPv = valeur >= 255 ? 1 : (valeur + 1) / 256;

    return Math.min(1, pStatut + pPorte * pPv);
  }

  // Quand le taux recale, la secousse reflète la distance au seuil. Un Ronflex
  // plein PV bouge une fois ; un Mewtwo ne bouge pas.
  function secoussesRatees(jet, taux) {
    var ecart = jet - taux;
    return ecart < 20 ? 2 : ecart < 60 ? 1 : 0;
  }

  // La Zone Safari a son propre calcul : pas de combat, donc pas de PV à faire
  // descendre. Le caillou rend le Pokémon plus facile à prendre mais plus
  // prompt à fuir ; l'appât fait l'inverse. C'est la mécanique d'origine, et
  // c'est la seule zone du jeu qui fonctionne ainsi.
  function tenterSafari(cible, etatSafari, h) {
    var taux = ESP()[cible.n].capture;
    var ajuste = Math.max(1, Math.min(255, Math.floor(taux * (etatSafari.caillou ? 2 : 1) * (etatSafari.appat ? 0.5 : 1))));
    // ⚠️ LES DEUX NOMBRES VIENNENT DE LA TABLE, PAS DE LA MAIN. Ils étaient
    //    recopiés ici (`151`, `8`) : deux tables pour une règle, et la Safari
    //    Ball a justement changé de facteur — la copie aurait menti en silence.
    var lot = BALLS.SAFARI_BALL;
    var jet = h.entier(lot.tirage);
    if (jet > ajuste) return { pris: false, secousses: secoussesRatees(jet, ajuste), raison: "taux" };
    var valeur = Math.floor((255 * 4) / lot.facteur);
    var second = h.entier(256);
    if (second <= valeur) return { pris: true, secousses: 3, raison: "calcul" };
    return { pris: false, secousses: 2, raison: "calcul" };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA CHANCE AU PARC, DITE AVANT LE JET
  //
  //  🔴 C'EST LA SEULE ZONE OÙ L'ON NE PEUT PAS AFFAIBLIR, donc la seule où le
  //     pari est TOUT — et c'était la seule où l'écran ne chiffrait rien. En
  //     combat chaque Ball porte son pourcentage ; ici on n'avait qu'une humeur
  //     (« calme / occupé / énervé »), donc l'appât et le caillou étaient deux
  //     boutons dont on ne mesurait jamais l'effet.
  //  ⚠️ AUCUN TIRAGE : les deux jets de `tenterSafari` sont indépendants, leur
  //     produit se calcule. Afficher ne coûte pas un cran de hasard, et le
  //     rejeu serveur ne bouge pas.
  //  ⚠️ MÊMES NOMBRES QUE `tenterSafari`, lus dans la même table : deux calculs
  //     divergeraient, et c'est l'écran qui aurait tort.
  // ═══════════════════════════════════════════════════════════════════════════
  function chanceSafari(cible, etatSafari) {
    var etat = etatSafari || {};
    var taux = ESP()[cible.n].capture;
    var ajuste = Math.max(1, Math.min(255,
      Math.floor(taux * (etat.caillou ? 2 : 1) * (etat.appat ? 0.5 : 1))));
    var lot = BALLS.SAFARI_BALL;
    // Premier jet : il faut tomber sous le taux ajusté, sur `tirage` valeurs.
    var p1 = Math.min(1, ajuste / lot.tirage);
    // Second jet : il faut tomber sous la valeur, sur 256.
    var p2 = Math.min(1, (Math.floor((255 * 4) / lot.facteur) + 1) / 256);
    return Math.max(1, Math.round(p1 * p2 * 100));
  }

  // La fuite d'un Pokémon de la Zone Safari, et celle des légendaires.
  // 🔴 Un légendaire enfui est PERDU pour la partie. Le jeu doit le DIRE :
  //    un silence, ici, se lit comme un bug.
  function fuit(cible, etatSafari, h) {
    var base = 12 + (etatSafari.caillou ? 20 : 0) - (etatSafari.appat ? 8 : 0);
    return h.chance(Math.max(2, base));
  }

  W.PokeCapture = {
    BALLS: BALLS,
    AIDE_STATUT: AIDE_STATUT,
    tenter: tenter,
    chance: chance,
    tenterSafari: tenterSafari,
    chanceSafari: chanceSafari,
    fuit: fuit,
  };
})(typeof window !== "undefined" ? window : globalThis);
