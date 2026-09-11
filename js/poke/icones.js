(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES PICTOGRAMMES — DESSINÉS, JAMAIS EMPRUNTÉS
  //
  //  🔴 AUCUN EMOJI. `poke-design.mjs` fait échouer la livraison si un emoji
  //     entre dans le chrome, et il a raison : un emoji change de dessin selon
  //     le système, donc l'écran n'est plus le même d'une machine à l'autre.
  //     Ici, chaque nœud de la carte porte un tracé qu'on maîtrise.
  //
  //  🔴 UN PICTOGRAMME NE REMPLACE JAMAIS SON LIBELLÉ. Il l'accompagne. Un
  //     dessin seul se devine ; le mode ninja a livré six boutons illisibles
  //     pour l'avoir oublié. Le libellé reste, le tracé aide à balayer.
  //
  //  Tous les tracés sont sur une grille de 24, trait de 2, bouts arrondis :
  //  une famille se reconnaît à sa géométrie, pas à son sujet.
  // ═══════════════════════════════════════════════════════════════════════════

  // `currentColor` partout : le pictogramme prend la couleur de son texte, donc
  // il suit l'état du nœud (courant, pris, perdu) sans une ligne de plus.
  var TRACES = {
    // Trois brins d'herbe. La rencontre sauvage, c'est ça et rien d'autre.
    herbes: '<path d="M4 20c0-5 2-8 4-11 0 4 1 7 1 11"/>' +
            '<path d="M12 20c0-6 2-10 4-13 0 5 1 9 1 13"/>' +
            '<path d="M9 20c0-4 1-7 2-9"/>',

    // La vague. Deux crêtes : une seule se lirait comme un trait.
    eau: '<path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>' +
         '<path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',

    // Un dresseur : la tête, les épaules. La casquette le distingue d'un PNJ.
    dresseur: '<circle cx="12" cy="8" r="3.2"/>' +
              '<path d="M8 6.4h8"/>' +
              '<path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',

    // 🔴 LE BADGE — ET IL MANQUAIT DEPUIS LA v393. `icôneButin` renvoie
    //    « badge » pour la carte d'acquis depuis le premier jour du système, et
    //    ce tracé n'existait pas : `svg()` rendait une chaîne vide, donc la
    //    carte s'affichait CREUSE, sans une erreur, sur toutes les parties.
    //    Il a fallu qu'un autre écran cite le nom en LITTÉRAL pour que le
    //    contrôle le voie — cité par une variable, il lui échappait.
    //    *Un pictogramme absent ne casse rien : il laisse un trou que personne
    //    ne signale.*
    // ⚠️ Un écusson, pas une étoile ni une médaille : le badge est ce que l'on
    //    porte, et il doit se distinguer du `boss` (le Champion qui le donne)
    //    comme l'acquis se distingue du serment.
    badge: '<path d="M12 3l7 3.2v5.4c0 4.2-2.8 7.6-7 9.4-4.2-1.8-7-5.2-7-9.4V6.2z"/>' +
           '<path d="M9 12l2.2 2.2L15.5 10"/>',

    // Le rythme : un chevron double, celui qu'on connaît pour « avancer plus
    //    vite ». ⚠️ Pas une horloge — on ne règle pas une durée, on choisit une
    //    allure, et l'horloge se lirait comme un compte à rebours.
    // 🔴 TROIS TRACÉS, UN PAR CRAN — et c'est le NOMBRE de chevrons qui dit
    //    l'allure. Un tracé unique avec un chiffre à côté demandait une
    //    légende ; celui-ci se lit comme l'avance rapide d'un lecteur, sans
    //    rien apprendre. Le propriétaire a demandé « à quoi sert cette
    //    icône » — c'est le seul retour qui compte sur un pictogramme.
    // ⚠️ Les chevrons restent CENTRÉS quel qu'en soit le nombre : décalés, le
    //    bouton semblerait bouger d'un cran à l'autre.
    rythme1: '<path d="M9 6l6 6-6 6"/>',
    rythme2: '<path d="M5 6l6 6-6 6"/><path d="M13 6l6 6-6 6"/>',
    rythme3: '<path d="M2 6l5 6-5 6"/><path d="M9 6l5 6-5 6"/><path d="M16 6l5 6-5 6"/>',

    // 🔴 `svg("pokedex")` ÉTAIT APPELÉ DEUX FOIS ET N'EXISTAIT PAS — le même
    //    silence que `badge` : deux boutons s'affichaient sans icône depuis
    //    toujours. Relevé quand le propriétaire a demandé « une icône Pokédex
    //    à la place du rond ».
    //    L'appareil de 1996, épuré à trois traits : le boîtier, la charnière,
    //    la lentille. À vingt-deux pixels, tout ce qui s'ajoute se brouille.
    pokedex: '<rect x="4.5" y="3" width="15" height="18" rx="2"/>' +
             '<path d="M9.5 3v18"/>' +
             '<circle cx="7" cy="6.5" r="1.3"/>',

    // La trouvaille : un coffre fermé qu'on va ouvrir.
    objet: '<rect x="4" y="9" width="16" height="10" rx="1.5"/>' +
           '<path d="M4 13h16"/><path d="M12 9v10"/>' +
           '<path d="M8 9V7a4 4 0 0 1 8 0v2"/>',

    // Le Centre : la croix des soins, telle que le jeu la pose sur son toit.
    centre: '<rect x="3" y="5" width="18" height="14" rx="2"/>' +
            '<path d="M12 9v6"/><path d="M9 12h6"/>',

    // La boutique : le store rayé d'une devanture.
    boutique: '<path d="M3 9l1.5-4h15L21 9"/>' +
              '<path d="M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>' +
              '<path d="M9 9v3"/><path d="M15 9v3"/>',

    // La scène du scénario : le repère planté sur la carte.
    scene: '<path d="M12 21s6.5-6.1 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.9 12 21 12 21z"/>' +
           '<circle cx="12" cy="10.5" r="2.4"/>',

    // Le légendaire : l'astre. Quatre branches, pas cinq — une étoile à cinq
    // branches est le pictogramme du favori partout ailleurs sur le web.
    legendaire: '<path d="M12 2.5l2.4 6.6 6.6 2.4-6.6 2.4L12 20.5l-2.4-6.6L3 11.5l6.6-2.4z"/>',

    // L'arène : l'écusson du Champion. Il ferme l'acte, il en a la solennité.
    boss: '<path d="M12 2.5l8 3v6.2c0 5-3.4 9.1-8 10.3-4.6-1.2-8-5.3-8-10.3V5.5z"/>' +
          '<path d="M9 12l2.2 2.2L15.5 10"/>',

    // La Ligue : la coupe. Elle n'apparaît qu'une fois par voyage.
    ligue: '<path d="M8 4h8v4a4 4 0 0 1-8 0z"/>' +
           '<path d="M8 5.5H5.5A2.5 2.5 0 0 0 8 10"/>' +
           '<path d="M16 5.5h2.5A2.5 2.5 0 0 1 16 10"/>' +
           '<path d="M12 12v4"/><path d="M8.5 20h7"/><path d="M10 16h4v4h-4z"/>',

    // La Poké Ball. Elle sert d'emblème au mode : accueil, chargement, vitrine.
    ball: '<circle cx="12" cy="12" r="9"/>' +
          '<path d="M3 12h6"/><path d="M15 12h6"/>' +
          '<circle cx="12" cy="12" r="3"/>',
    // Le haut-parleur et ses deux ondes. Coupé, les ondes deviennent une croix
    // — l'état se lit à la forme, pas à la couleur, comme partout ici.
    son: '<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/>' +
         '<path d="M15.5 9.4a3.6 3.6 0 0 1 0 5.2"/>' +
         '<path d="M18 7a7 7 0 0 1 0 10"/>',
    sonCoupe: '<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"/>' +
              '<path d="M16 10l5 4"/><path d="M21 10l-5 4"/>',
  };

  // Le Pokédex fermé — l'appareil, réduit à son emblème d'onglet.
  TRACES.pokedex = '<rect x="4" y="3" width="16" height="18" rx="2"/>' +
                   '<circle cx="8.5" cy="7.5" r="2"/>' +
                   '<path d="M13 7h4"/><path d="M8 13h8"/><path d="M8 17h5"/>';

  // 🔴 UNE SEULE PORTE. Un tracé écrit à la main dans un écran finirait par
  //    diverger de celui-ci — le motif s'est vérifié cinq fois sur ce mode
  //    (l'ordre de chargement en quatre exemplaires, la liste des effets
  //    traités, les noms d'arène par gabarit, le dépouillement des
  //    commentaires, la version dans `data-v`). Ce qui est recopié diverge.
  function svg(nom, options) {
    var o = options || {};
    var d = TRACES[nom];
    if (!d) return "";
    return '<svg class="pkdx-icone" viewBox="0 0 24 24" width="' + (o.taille || 22) +
      '" height="' + (o.taille || 22) + '" fill="none" stroke="currentColor"' +
      ' stroke-width="' + (o.trait || 2) + '" stroke-linecap="round"' +
      ' stroke-linejoin="round" aria-hidden="true" focusable="false">' + d + "</svg>";
  }

  function existe(nom) { return !!TRACES[nom]; }

  W.PokeIcones = { svg: svg, existe: existe, NOMS: Object.keys(TRACES) };

  // ═════════════════════════════════════════════════════════════════════════
  //  LA PORTE UNIQUE DE LA COULEUR DE TYPE
  //
  //  🔴 LA LOI DU MODE : toute couleur à l'écran nomme un type ou une créature.
  //     La feuille ne laisse `--type-*` s'exprimer que sous un sélecteur
  //     `[data-type]` ; il reste à garantir que `data-type` n'est jamais posé
  //     sans son nom lisible. C'est le rôle de ces deux fonctions, et
  //     `poke-design.mjs` fait échouer la livraison si un écran écrit
  //     `data-type=` sans passer par ici.
  //
  //  Sans ce garde-fou, la règle se contournerait en une ligne : un `data-type`
  //  posé sur un bloc décoratif rendrait la couleur muette — illisible pour un
  //  daltonien, et décorative pour tout le monde.
  // ═════════════════════════════════════════════════════════════════════════
  function langue() { return W.POKE_LANG || "fr"; }
  var NOMS = function () {
    return (W.PokeRegles && W.PokeRegles.typeNoms && W.PokeRegles.typeNoms()) || W.POKE_TYPE_NOMS;
  };

  function nomDuType(t) {
    // ⚠️ PAR LE REGISTRE : la gen 2 porte DIX-SEPT types, et cette porte
    //    décide si `data-type` se pose. Lue sur la globale de Kanto, elle
    //    aurait rendu Ténèbres et Acier muets — sans teinte, sans libellé, et
    //    sans erreur.
    var noms = NOMS();
    var n = noms && noms[t];
    return n ? (n[langue()] || n.fr) : "";
  }

  // L'identifiant depuis le libellé français : les arènes portent « Roche »,
  // la feuille attend « rock ». On relie les deux par le nom, à un seul endroit.
  function idDuNom(nom) {
    var noms = NOMS() || {};
    for (var t in noms) if (noms[t].fr === nom || noms[t].en === nom) return t;
    return null;
  }

  // L'attribut seul, pour un bloc qui nomme le type PAR AILLEURS (la bannière
  // d'arène affiche sa pastille juste à côté). Il refuse un type inconnu :
  // mieux vaut aucune couleur qu'une couleur qui ne veut rien dire.
  function attr(t) {
    return nomDuType(t) ? ' data-type="' + t + '"' : "";
  }

  // La pastille : la couleur ET le nom, indissociables. C'est le seul objet du
  // mode qui a le droit d'être coloré sans rien d'autre autour.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 `info` POSAIT UN `tabindex`, Y COMPRIS SUR LES PASTILLES QUI VIVENT
  //     DANS UN BOUTON — audit du 14/08. Les trois types des starters sont
  //     DANS `.pkdx-starter` : un élément focalisable imbriqué dans un bouton,
  //     exactement la faute que `infobulles.js` a déjà consignée et corrigée
  //     pour les marqueurs de la carte. Elle s'était refaite ici.
  //  ✅ LE DÉFAUT EST DÉSORMAIS LE CAS SÛR. `info` ne donne que l'explication ;
  //     `seule` — « cette pastille est son propre arrêt au clavier » — est ce
  //     qui pose le `tabindex`. Une pastille dans un bouton s'atteint par SON
  //     bouton : `infobulles.js` descend au focus, c'est écrit là-bas.
  //     *Une option qu'on oublie doit rendre le cas SÛR, pas l'autre.*
  // ═══════════════════════════════════════════════════════════════════════════
  function pastille(t, options) {
    var nom = nomDuType(t);
    if (!nom) return "";
    var o = options || {};
    return '<span class="pkdx-type"' + attr(t) +
      (o.info ? ' data-info="type" data-info-val="' + t + '"' + (o.seule ? ' tabindex="0"' : "") : "") +
      ">" + nom + "</span>";
  }

  // La même porte, pour un élément déjà dans la page. Un type inconnu RETIRE
  // l'attribut au lieu d'en poser un vide : une teinte orpheline resterait
  // accrochée à l'élément au tour suivant.
  function poser(element, t) {
    if (!element) return;
    if (nomDuType(t)) element.setAttribute("data-type", t);
    else element.removeAttribute("data-type");
  }

  function multiplicateur(typeAtt, typesDef) {
    return (W.PokeCombat && W.PokeCombat.efficacite) ? W.PokeCombat.efficacite(typeAtt, typesDef) : 1;
  }

  W.PokeType = { attr: attr, pastille: pastille, poser: poser, nom: nomDuType, id: idDuNom, multiplicateur: multiplicateur };

  // ═══════════════════════════════════════════════════════════════════════════
  //  OÙ VIT LE VISAGE D'UNE ESPÈCE — UNE SEULE PORTE  [19/08/2026]
  //
  //  🔴 SIGNALÉ À L'ÉCRAN PAR LE PROPRIÉTAIRE : un cadre vide et « Germignon »
  //     en dessous, sur l'écran de fin d'un voyage de Johto. Trente-neuf
  //     endroits écrivaient `assets/img/poke/face/<n>.png` en dur — un chemin
  //     qui ne contient que les cent cinquante et une espèces de 1996. Toute
  //     créature de Johto y était une image cassée, partout : équipe, Pokédex,
  //     combat, carte de partage, écran de fin.
  //
  //  🔑 LA RÈGLE TIENT EN DEUX LIGNES, et c'est pour ça qu'elle vaut mieux que
  //     trente-neuf corrections : au-delà de 151, le sprite N'EXISTE que dans
  //     le dossier de 1999 ; en deçà, il suit le monde qu'on joue — les
  //     visages de Cristal à Johto, ceux de Rouge/Bleue partout ailleurs.
  //     Hors voyage, le registre rend `gen1`, donc la collection du compte
  //     garde les visages de 1996 pour les cent cinquante et un premiers.
  //
  //  ⚠️ LE PARAMÈTRE DE CACHE RESTE À L'APPELANT. Il vaut `?i=6` à certains
  //     endroits, rien à d'autres, et ce n'est pas à cette porte d'en décider :
  //     elle dit OÙ, pas COMBIEN DE TEMPS.
  // ═══════════════════════════════════════════════════════════════════════════
  function dossierSprite(n) {
    var cle = W.PokeRegles ? W.PokeRegles.courant() : "gen1";
    if (cle === "gen3") return "assets/img/poke/gen3/";
    if (+n > 251) return "assets/img/poke/gen3/";
    if (+n > 151) return "assets/img/poke/gen2/";
    return cle === "gen2" ? "assets/img/poke/gen2/" : "assets/img/poke/";
  }

  W.PokeSprites = {
    face: function (n, suffixe) { return dossierSprite(n) + "face/" + n + ".png" + (suffixe || ""); },
    dos: function (n, suffixe) { return dossierSprite(n) + "dos/" + n + ".png" + (suffixe || ""); },
    art: function (n) { return "assets/img/poke/art/" + n + ".webp"; },
    imgFace: function (n, suffixe) { return dossierSprite(n) + "face/" + n + ".png" + (suffixe || ""); },
    imgDos: function (n, suffixe) { return dossierSprite(n) + "dos/" + n + ".png" + (suffixe || ""); },
    spriteFace: function (n, suffixe) { return dossierSprite(n) + "face/" + n + ".png" + (suffixe || ""); },
    spriteDos: function (n, suffixe) { return dossierSprite(n) + "dos/" + n + ".png" + (suffixe || ""); },
    combatFace: function (n, suffixe) {
      // Collection complète et unifiée des 386 sprites couleur GBA/Showdown (face)
      return "assets/img/poke/gen3/face/" + n + ".png" + (suffixe || "");
    },
    combatDos: function (n, suffixe) {
      // Collection complète et unifiée des 386 sprites dos couleur GBA/Showdown (dos)
      return "assets/img/poke/gen3/dos/" + n + ".png" + (suffixe || "");
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
