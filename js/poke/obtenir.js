(function (W) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a son itinéraire, ses clés et ses zones.
  var ETAPES = function () { return (W.PokeRegles && W.PokeRegles.etapes()) || W.POKE_ETAPES || []; };
  var CLES_V = function () { return (W.PokeRegles && W.PokeRegles.clesVoyage()) || W.POKE_CLES || {}; };
  var ZONES = function () { return (W.PokeRegles && W.PokeRegles.zones()) || W.POKE_ZONES || []; };
  var LIEUX = function () { return (W.PokeRegles && W.PokeRegles.lieux()) || W.POKE_LIEUX || {}; };
  // ⚠️ PAR LE REGISTRE : ce fichier lisait la globale à neuf endroits, et sous
  //    un autre jeu de règles il aurait servi le Pokédex de Kanto à Johto.
  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  // ═══════════════════════════════════════════════════════════════════════
  //  LES SCÈNES SE DEMANDENT AU MONDE COURANT  [20/08/2026]
  //  Voir le bandeau de `regles.js` : ces tables se lisaient en direct, et un
  //  voyage de Johto recevait donc les échanges, le Casino et les cadeaux de
  //  1996 — dont aucune étape n'existe chez lui.
  // ═══════════════════════════════════════════════════════════════════════
  var R = function () { return W.PokeRegles; };
  var porte = function (nom, replis) {
    var r = R();
    if (r && r[nom]) return r[nom]();
    return replis;
  };
  var ECHANGES = function () { return porte("echanges", W.POKE_ECHANGES) || []; };
  var CASINO = function () { return porte("casino", W.POKE_CASINO) || {}; };
  var CADEAUX = function () { return porte("cadeaux", W.POKE_CADEAUX) || []; };
  var FOSSILES = function () { return porte("fossiles", W.POKE_FOSSILES) || []; };
  var DOJO = function () { return porte("dojo", W.POKE_DOJO) || null; };
  var AMBRE = function () { return porte("ambre", W.POKE_AMBRE) || null; };
  var STATIQUES = function () { return porte("statiques", null) || []; };
  var OEUFS = function () { return porte("oeufs", null) || []; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES AUTRES FAÇONS D'OBTENIR UN POKÉMON
  //
  //  🔴 POURQUOI CE FICHIER EXISTE. `poke-injoignable` relevait DOUZE espèces
  //     présentes dans les données et qu'aucun joueur ne pouvait obtenir :
  //     Canarticho, Excelangue, Évoli et ses trois évolutions, Porygon, les
  //     deux lignées de fossiles, Mew. Le Pokédex plafonnait à 122 sur 151.
  //
  //     La donnée ne manquait pas — la MÉCANIQUE manquait. Le monde déclarait
  //     `fossile: true` au Mont Sélénité et `casino: true` à Céladopole,
  //     l'écran l'annonçait, et le code ne donnait rien. C'est la classe de
  //     défaut n°1 du projet dans son autre sens : le jeu annonce et ne livre
  //     pas.
  //
  //  🔴 ET LA BOUTIQUE NE FAISAIT RIEN NON PLUS. L'argent s'accumulait sans
  //     jamais se dépenser : un dresseur battu donnait 1 300 ₽ qui ne servaient
  //     à rien. Une récompense qu'on ne peut pas employer n'est pas une
  //     récompense.
  //
  //  Aucune règle n'est inventée ici : les prix, les inventaires, les surnoms
  //  des Pokémon échangés et les niveaux des cadeaux viennent tous du ROM, par
  //  `tools/poke-obtentions.mjs`.
  // ═══════════════════════════════════════════════════════════════════════════

  var M = function () { return W.PokeMoteur; };
  var P = function () { return W.PokePartie; };

  // ── L'argent ───────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES MACHINES SE VENDENT — PORTE UNIQUE
  //
  //  🔴 UNE CLÉ `TM_TONNERRE` N'EST PAS UN OBJET DE SAC. Les cinquante machines
  //     vivent dans `POKE_CT` avec leur numéro, leur type et LEUR PRIX CANON —
  //     1 000 à 5 000 ₽, ceux du comptoir de Céladopole. Elles n'ont jamais eu
  //     d'entrée dans `POKE_OBJETS`, si bien que tout ce qui passait par
  //     `prixDe` les voyait à zéro et que l'étal les jetait en silence.
  //  🔴 UNE SEULE FONCTION TRADUIT LA CLÉ EN MACHINE, et tout le reste s'y
  //     branche. Deux traductions, ce serait deux prix — et un jour l'écran
  //     affiche 2 000 ₽ pendant que la caisse en prend 4 000.
  // ═══════════════════════════════════════════════════════════════════════════
  function machinePour(cle) {
    if (!cle || cle.slice(0, 3) !== "TM_") return null;
    var att = cle.slice(3);
    for (var i = 0; i < W.POKE_CT.length; i++) if (W.POKE_CT[i].cle === att) return W.POKE_CT[i];
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA CT QUE LE CHAMPION REMET EN MAIN PROPRE
  //
  //  🔴 EN 1996, BATTRE PIERRE DONNE **SA** CT. C'est ce qui fait qu'un badge se
  //     souvient : on ne repart pas avec « un objet », on repart avec Toxik
  //     parce qu'on a battu Koga. Ici la victoire ne rendait qu'un tirage de
  //     butin — le même que pour n'importe quel dresseur, en un peu meilleur.
  //  ⚠️ Elle passe par la MÊME porte que l'achat : `p.ct[m.n]`. Une seconde
  //     façon de ranger une machine finirait avec deux comptes, et l'écran
  //     d'apprentissage n'en lirait qu'un.
  //  🔴 ET ELLE A RENDU `{ok:false}` EN SILENCE PENDANT TOUT UN CHANTIER. Elle
  //     prend une clé d'OBJET (« TM_THUNDERBOLT ») ; l'écran de choix de la
  //     capsule lui passait la clé du COUP (« THUNDERBOLT »), qui est ce que
  //     porte `POKE_CT`. `machinePour` rendait null, la machine n'entrait pas
  //     dans `p.ct`, et l'apprentissage refusait ensuite pour « pasLaCT ».
  //     Aucune erreur, aucun écran cassé — et l'A/B de la mécanique est sorti
  //     IDENTIQUE au témoin, à la décimale près sur 400 voyages. C'est ce qui
  //     l'a trahi : un résultat rigoureusement identique n'est pas un résultat
  //     nul, c'est un branchement mort.
  //  ✅ On sépare donc les deux : `poserMachine` range une machine déjà
  //     résolue, `donnerCT` résout une clé d'objet puis délègue. Un appelant
  //     qui tient déjà la machine ne repasse plus par une conversion de clé.
  function poserMachine(p, m) {
    if (!m) return { ok: false, raison: "inconnue" };
    p.ct = p.ct || {};
    p.ct[m.n] = (p.ct[m.n] || 0) + 1;
    return { ok: true, machine: m };
  }

  function donnerCT(p, cle) {
    return poserMachine(p, machinePour(cle));
  }

  function prixDe(cle) {
    var o = W.PokeRegles ? W.PokeRegles.objet(cle) : W.POKE_OBJETS[cle];
    if (o) return o.prix;
    var m = machinePour(cle);
    return m ? m.prix : 0;
  }

  // 🔴 UNE SEULE PORTE POUR DÉPENSER. Vérifier le solde à l'appel plutôt qu'ici
  //    laisserait passer un achat à découvert dès qu'un écran oublie le test —
  //    et un écran finit toujours par l'oublier.
  function acheter(p, cle, combien) {
    var n = combien || 1;
    var prix = prixDe(cle);
    if (!prix) return { ok: false, raison: "objetInconnu" };
    var total = prix * n;
    if (p.argent < total) return { ok: false, raison: "tropCher", manque: total - p.argent };
    p.argent -= total;
    // 🔴 UNE MACHINE NE VA PAS DANS LE SAC. Elle vit dans `p.ct`, indexée par
    //    son numéro — c'est là que l'écran d'apprentissage va la chercher.
    //    L'envoyer dans `p.sac` aurait produit un achat qui débite, qui dit
    //    « acheté », et qui n'apparaît nulle part : de l'argent qui disparaît.
    var m = machinePour(cle);
    if (m) {
      p.ct = p.ct || {};
      p.ct[m.n] = (p.ct[m.n] || 0) + n;
      return { ok: true, total: total, machine: m };
    }
    p.sac[cle] = (p.sac[cle] || 0) + n;
    return { ok: true, total: total };
  }

  // Ce qu'une boutique propose. Les badges n'ouvrent PAS l'inventaire dans le
  // jeu d'origine — c'est la ville qui décide — donc on lit la ville.
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 CINQ OBJETS À VENDRE QUI NE PEUVENT RIEN FAIRE ICI. La Corde Sortie, les
  //    trois Repousse et la Poké Poupée appartiennent à un jeu où l'on MARCHE :
  //    quitter un donjon, éviter les rencontres d'herbes hautes, fuir un combat
  //    de dresseur. Ce mode est une carte à embranchements — il n'y a ni donjon
  //    à quitter, ni pas à faire dans l'herbe. Les vendre, c'est prendre 550 ₽
  //    pour un objet qui ne servira jamais, et le joueur ne peut pas le deviner.
  //    On les retire de l'étal. La donnée du ROM reste intacte : c'est la
  //    VITRINE qu'on filtre, pas la table.
  // 🔴 LES OBJETS DE STATISTIQUE RESTENT, EUX. Attaque +, Défense +, Vitesse +,
  //    Atq. Spé. +, Précision +, Muscle + et Garde-Stats étaient dans le même
  //    cas — vendus, inemployables — mais leur mécanique existe : les paliers
  //    du moteur. Ils ont désormais leur place au sac de combat.
  var HORS_MONDE = /^(ESCAPE_ROPE|REPEL|SUPER_REPEL|MAX_REPEL|POKE_DOLL)$/;

  function inventaire(nomMart) {
    var liste = W.POKE_MARTS[nomMart];
    if (!liste) return [];
    return liste.filter(function (c) {
      var connu = W.PokeRegles ? !!W.PokeRegles.objet(c) : !!W.POKE_OBJETS[c];
      return (connu || !!machinePour(c)) && !HORS_MONDE.test(c);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  QUELS COMPTOIRS S'OUVRENT — ET C'EST DE LA DONNÉE, PAS DE L'ÉCRAN
  //
  //  🔴 QUATRE COMPTOIRS SUR QUATORZE N'ÉTAIENT OUVERTS PAR AUCUN ÉCRAN, et
  //     avec eux 13 objets câblés dans le moteur et obtenables NULLE PART :
  //     les sept objets X — que `combat.js` appelle « l'outil qui gagne un
  //     combat de Champion » — plus la Potion Max et la Guérison, les deux
  //     meilleurs soins du jeu. Le sac savait les employer, l'infobulle savait
  //     les décrire, et le joueur ne pouvait pas en posséder un seul.
  //
  //  🔴 CETTE LISTE A VÉCU DANS `ui.js`, ET L'OUTIL QUI MESURAIT
  //     L'ATTEIGNABILITÉ LA RELISAIT À L'EXPRESSION RÉGULIÈRE. Au premier
  //     comptoir ajouté, il a divergé : il accusait encore les sept objets X
  //     alors qu'ils venaient d'être rendus achetables. Une porte doit vivre
  //     là où un contrôle peut l'APPELER.
  //
  //  L'étal suit l'avancement : le ROM range ses inventaires par ville, et une
  //  ville tardive vend mieux. On prend celle qui correspond à l'acte atteint.
  //  ⚠️ Safrania sort de la liste au profit du hall de la Ligue : son stock est
  //     inclus dans celui de Cramois'Île à la Hyper Ball près, donc rien ne se
  //     perd, et l'acte 9 devient enfin un vrai ravitaillement avant le
  //     Conseil 4.
  // ═══════════════════════════════════════════════════════════════════════════
  var MARTS_PAR_ACTE = ["ViridianMartClerkText", "PewterMartClerkText", "CeruleanMartClerkText",
    "VermilionMartClerkText", "CeladonMart2FClerk1Text", "LavenderMartClerkText",
    "FuchsiaMartClerkText", "CinnabarMartClerkText", "IndigoPlateauLobbyClerkText"];
  // Les deux comptoirs du grand magasin de Céladopole, et l'acte où la ville
  // s'ouvre — celui d'Erika. Plus tôt serait hors canon ; plus tard serait hors
  // de portée, la moitié des voyages s'arrêtant devant Koga à l'acte 5.
  var MART_MACHINES = "CeladonMart2FClerk2Text";
  var MART_COMBAT = "CeladonMart5FClerk1Text";
  var ACTE_MACHINES = 4;

  function martPour(p) {
    var i = Math.min(MARTS_PAR_ACTE.length - 1, Math.max(0, (p.acte || 1) - 1));
    // Un nom d'étal absent des données ne doit pas rendre la boutique muette :
    // on redescend jusqu'au premier qui existe.
    for (var k = i; k >= 0; k--) {
      if (inventaire(MARTS_PAR_ACTE[k]).length) return MARTS_PAR_ACTE[k];
    }
    return MARTS_PAR_ACTE[0];
  }

  // ⚠️ PAS DE `martsOuverts()` ICI. J'en avais écrit une pour que l'outil
  //    d'atteignabilité ait sa liste — et le détecteur de portes mortes l'a
  //    refusée à raison : aucun écran ne l'appelait, c'était une porte ouverte
  //    par un outil seul. C'est la TROISIÈME fois sur ce mode (`Serments.tous`,
  //    `Sceaux.tous`). L'outil interroge maintenant `martPour()` acte par acte,
  //    exactement comme la boutique — donc il ne peut pas mesurer une liste que
  //    le joueur n'a pas.
  // ── Le Casino ──────────────────────────────────────────────────────────────
  //  Les jetons s'achètent au prix du ROM : `ItemPrices` donne 10 ₽ pour un
  //  jeton. Les lots gardent leur coût canon — Porygon vaut 9 999 jetons en
  //  Rouge, et c'est voulu : c'est le Pokémon le plus cher du jeu de 1996.
  //  ⚠️ À ce prix, Porygon ne s'atteint pas en un voyage. Ce n'est PAS un
  //     blocage : le Pokédex se garde entre les parties, donc l'espèce reste
  //     accessible au compte. Le lot 9 tranchera s'il faut rapprocher l'échelle
  //     de l'économie d'un voyage — avec des mesures, pas au jugé.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PRIX DU JETON — arbitrage du 17/08, sur la question de LoicPerezzz
  // ---------------------------------------------------------------------------
  //  « Comment on fait pour avoir assez d'oseille pour Porygon ? » Réponse
  //  mesurée d'avant l'arbitrage : ON NE POUVAIT PAS.
  //    · Porygon vaut 9 999 jetons en Rouge (6 500 en Bleu), prix canon ;
  //    · le jeton valait 10 ₽ — prix canon lui aussi — donc 99 990 ₽ ;
  //    · un voyage ENTIER fait passer ~1 500 ₽ par la bourse en médiane, et
  //      18 129 ₽ dans le cas le plus riche des soixante voyages mesurés.
  //  Facteur 4 à 60. Et Porygon ne se trouve NULLE PART ailleurs, donc il
  //  bloquait le diplôme du Pokédex (150 espèces) — qui ouvre lui-même la
  //  chasse à Mew. Un mur, au bout d'une chaîne qui mène à tout le reste.
  //
  //  🔑 EN 1996 LES JETONS SE GAGNENT AUX MACHINES À SOUS. Elles n'existent pas
  //     ici : le Casino n'a que le comptoir et la vitrine. On avait donc gardé
  //     le PRIX CANON sans la MÉCANIQUE CANON qui le rendait payable — et un
  //     prix canon sans sa mécanique n'est plus un prix, c'est un mur.
  //
  //  ✅ CE QU'ON CHANGE, ET RIEN D'AUTRE : le taux de change du comptoir. Les
  //     prix des lots restent ceux du ROM, à l'unité près — c'est eux que le
  //     joueur lit, et c'est eux qui portent la hiérarchie du Casino.
  //     À 1 ₽ le jeton, Porygon vaut 9 999 ₽ : au-dessus de ce que rapporte un
  //     voyage ordinaire, en dessous du plus riche jamais mesuré. C'est-à-dire
  //     exactement ce que le mode sait faire — *une branche prise est une
  //     branche perdue* : on le paie en renonçant aux Hyper Balls et aux soins
  //     de la Ligue, ou on ne le paie pas.
  //  ⚠️ Il vit ICI et pas dans `obtentions.js`, qui est GÉNÉRÉ depuis le ROM :
  //     l'y écrire serait effacé au prochain passage du générateur.
  //  ⚠️ Le défi du jour Pokémon ne rejoue pas le tour par tour (le serveur
  //     recalcule le score depuis le bilan) : aucun verrou daté à poser.
  var PRIX_JETON = 1;
  function prixJeton() { return PRIX_JETON; }

  function acheterJetons(p, combien) {
    var total = prixJeton() * combien;
    if (p.argent < total) return { ok: false, raison: "tropCher", manque: total - p.argent };
    p.argent -= total;
    p.jetons = (p.jetons || 0) + combien;
    return { ok: true, total: total };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 CE QUI JUSTIFIE UN PRIX À QUATRE CHIFFRES. Porygon coûte 9 999 jetons
  //    parce qu'il ne se rencontre NULLE PART ailleurs : ni dans une herbe, ni
  //    à la ligne, ni au bout d'une évolution. Le joueur ne pouvait pas le
  //    savoir — l'écran affichait un prix énorme sans dire pourquoi, et un prix
  //    sans raison ressemble à une erreur d'équilibrage.
  //    On le CALCULE sur les tables du monde. L'écrire à la main serait faux le
  //    jour où une table bouge, et ce mode a déjà payé cette leçon.
  // 🔴 ET LE CALCUL EST PRUDENT : au moindre doute il répond « trouvable ». Une
  //    exclusivité annoncée à tort est un mensonge affiché ; une exclusivité
  //    oubliée n'est qu'une info en moins.
  // ═══════════════════════════════════════════════════════════════════════════
  var _sauvages = {};
  function especesSauvages(version) {
    if (_sauvages[version]) return _sauvages[version];
    var vus = {};
    var pousser = function (t) {
      if (!t || !t.length) return;
      for (var i = 0; i < t.length; i++) vus[t[i].n] = true;
    };
    var zones = ZONES() || [];
    for (var i = 0; i < zones.length; i++) {
      if (zones[i].herbe) pousser(zones[i].herbe[version]);
      if (zones[i].eau) pousser(zones[i].eau[version]);
    }
    //  🔴 PAR LE REGISTRE, ET C'EST CE CHIFFRE-LÀ QUI COMPTAIT. Cette fonction
    //     dit ce qu'un voyage peut ATTEINDRE ; en lisant la table de Kanto sous
    //     Johto, elle promettait des poissons de Kanto et oubliait ceux d'ici.
    var pe = (W.PokeRegles && W.PokeRegles.peche && W.PokeRegles.peche()) || W.POKE_PECHE || {};
    pousser(pe.canne);
    pousser(pe.bonne);
    var g = (pe.mega && pe.mega.groupes) || {};
    for (var k in g) if (Object.prototype.hasOwnProperty.call(g, k)) pousser(g[k]);

    // Ce qui sort d'une espèce trouvable est trouvable aussi. On propage jusqu'à
    // ce que plus rien ne bouge — deux passes suffisent en gen 1, la boucle ne
    // suppose rien.
    // 🔴 `POKE_ESPECE`, PAS `POKE_ESPECES`. Le second est le tableau source,
    //    indexé à partir de zéro ; le premier est la table du jeu, indexée par
    //    numéro de Pokédex — et c'est celui-là que tout le reste emploie. Les
    //    deux existent, les deux répondent, et se tromper décale tout d'un cran
    //    en silence : ma première sonde promettait Kadabra là où l'écran donnait
    //    Abra. Un décalage d'un rang ne lève aucune erreur.
    var esp = ESP() || {};
    var bouge = true;
    while (bouge) {
      bouge = false;
      for (var n in esp) {
        if (!vus[n]) continue;
        var ev = esp[n].evolue || [];
        for (var j = 0; j < ev.length; j++) {
          if (!vus[ev[j].vers]) { vus[ev[j].vers] = true; bouge = true; }
        }
      }
    }
    _sauvages[version] = vus;
    return vus;
  }

  // Le lot est-il la SEULE porte vers cette espèce, dans cette version ?
  function introuvableAilleurs(version, n) {
    return !especesSauvages(version)[n];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  OÙ TROUVER UNE ESPÈCE
  //
  //  🔴 LE POKÉDEX SAVAIT DIRE CE QUI MANQUE ET JAMAIS OÙ LE CHERCHER. Sa fiche
  //     affiche « Attrapé à Mont Sélénité, niveau 12 » — pour ce qu'on possède
  //     DÉJÀ. Le filtre « MANQUANTS », lui, listait des silhouettes sans une
  //     piste. Une collection dont on ignore où compléter les trous n'est pas
  //     une collection, c'est un score.
  //
  //  🔴 TOUT SE CALCULE, RIEN NE S'ÉCRIT. Les tables du monde, les échanges, le
  //     casino, les cadeaux, les fossiles et les chaînes d'évolution portent
  //     déjà la réponse. Une liste de lieux tapée à la main serait fausse le
  //     jour où une table bouge — et ce mode a payé cette leçon plus d'une fois.
  // ═══════════════════════════════════════════════════════════════════════════
  function ouTrouver(version, n) {
    var out = [];
    var vu = {};
    var poser = function (type, lieu, taux) {
      var cle = type + "|" + (lieu || "");
      if (vu[cle]) { if (taux > vu[cle].taux) vu[cle].taux = taux; return; }
      vu[cle] = { type: type, lieu: lieu || null, taux: taux || 0 };
      out.push(vu[cle]);
    };

    var zones = ZONES() || [];
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      var milieux = [["herbe", z.herbe], ["eau", z.eau]];
      for (var m = 0; m < milieux.length; m++) {
        var t = milieux[m][1] && milieux[m][1][version];
        if (!t) continue;
        for (var k = 0; k < t.length; k++) {
          if (t[k].n !== n) continue;
          poser(milieux[m][0], z.lieu || z.id, t[k].poids || 0);
        }
      }
    }

    var pe = (W.PokeRegles && W.PokeRegles.peche && W.PokeRegles.peche()) || W.POKE_PECHE || {};
    var cannes = [["canne", pe.canne], ["bonne", pe.bonne]];
    for (var c = 0; c < cannes.length; c++) {
      var liste = cannes[c][1] || [];
      for (var j = 0; j < liste.length; j++) if (liste[j].n === n) poser("peche", null, 0);
    }
    var g = (pe.mega && pe.mega.groupes) || {};
    for (var gk in g) {
      if (!Object.prototype.hasOwnProperty.call(g, gk)) continue;
      for (var gi = 0; gi < g[gk].length; gi++) if (g[gk][gi].n === n) poser("peche", null, 0);
    }

    var ech = ECHANGES();
    for (var e = 0; e < ech.length; e++) if (ech[e].recoit === n) poser("echange", ech[e].etape, 0);

    var cas = CASINO()[version] || [];
    for (var q = 0; q < cas.length; q++) if (cas[q].n === n) poser("casino", null, 0);

    var cad = CADEAUX();
    for (var d = 0; d < cad.length; d++) if (cad[d].n === n) poser("cadeau", cad[d].lieu || cad[d].etape, 0);

    var fos = FOSSILES();
    for (var f = 0; f < fos.length; f++) if (fos[f].n === n) poser("fossile", null, 0);

    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE DOJO ET LE VIEIL AMBRE MANQUAIENT ICI — 11/08/2026.
    //     Kicklee, Tygnon et Ptéra sont posés par le monde, obtenables, comptés
    //     dans les atteignables, servis par leurs écrans et gardés par deux
    //     détecteurs. Mais `ouTrouver` ne lisait ni `POKE_DOJO` ni `POKE_AMBRE`,
    //     et `pistesHtml` rend "" sur une liste vide : **la fiche de ces trois
    //     espèces n'affichait AUCUNE section « OÙ LE TROUVER »**.
    //     Trois des créatures les plus cherchées du jeu, muettes sur l'écran
    //     dont c'est toute la fonction. *Le jeu sait, et il ne dit pas* — la
    //     classe de défaut n°1 du projet, sur la question que le propriétaire a
    //     posée mot pour mot : « où se trouve tel truc ? »
    //  ⚠️ Chacun a SA phrase. « Offert à Safrania » serait faux pour le Dojo :
    //     on y prend l'un des deux ET on perd l'autre — c'est le seul choix
    //     exclusif du jeu, et c'est justement l'identité du mode.
    // ═══════════════════════════════════════════════════════════════════════
    var dj = DOJO();
    if (dj && (dj.choix || []).indexOf(n) >= 0) poser("dojo", dj.lieu, 0);
    var am = AMBRE();
    if (am && am.n === n) poser("ambre", am.lieu, 0);

    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [24/08] TROIS VOIES DE JOHTO MANQUAIENT ICI, ET ELLES ONT FAILLI
    //     FAIRE MENTIR LA FICHE. Ce soir, le Pokédex a cessé de se taire quand
    //     une espèce n'a aucune piste : il écrit « il ne vit nulle part dans ce
    //     voyage ». Un silence était vague ; cette phrase-là est une
    //     AFFIRMATION — et pour Raikou, Capumain ou Scarhino, elle était
    //     FAUSSE. Un écran qui dit presque vrai coûte plus cher qu'un écran
    //     muet, et celui-ci disait franchement faux.
    //  🔑 LA CLASSE : rendre un écran bavard rend ses trous VISIBLES. Tant que
    //     la rubrique disparaissait, une voie oubliée ne se voyait pas.
    //  ⚠️ ELLES VALENT POUR TOUT MONDE QUI LES DÉCLARE : Kanto n'a ni arbre ni
    //     errant ni concours, ses portes rendent `null`, et rien ne bouge.
    // ═══════════════════════════════════════════════════════════════════════
    var arb = R() && R().arbres ? R().arbres() : null;
    if (arb && arb.jeux) {
      var vuArbre = false;
      for (var ja in arb.jeux) {
        for (var jb in arb.jeux[ja]) {
          var lot = arb.jeux[ja][jb];
          if (!lot || !lot.length) continue;
          for (var jc = 0; jc < lot.length; jc++) {
            if (lot[jc] && lot[jc].n === n) { vuArbre = true; break; }
          }
          if (vuArbre) break;
        }
        if (vuArbre) break;
      }
      if (vuArbre) poser("arbre", null, 0);
    }

    var err = R() && R().errants ? R().errants() : null;
    if (err && err.liste) {
      for (var ea = 0; ea < err.liste.length; ea++) {
        if (err.liste[ea].n === n) { poser("errant", null, 0); break; }
      }
    }

    var con = R() && R().concours ? R().concours() : null;
    if (con && con.vivier) {
      for (var ca = 0; ca < con.vivier.length; ca++) {
        if (con.vivier[ca].n === n) { poser("concours", null, 0); break; }
      }
    }

    // Le départ : les trois du canon, et toute première forme déjà capturée.
    if (W.PokeDepart && W.PokeDepart.CANON().indexOf(n) >= 0) poser("depart", null, 0);

    // Les rencontres uniques posées par le monde : légendaires et Ronflex.
    var et = ETAPES() || [];
    for (var s = 0; s < et.length; s++) {
      if (et[s].legendaire === n) poser("legendaire", et[s].lieu || et[s].id, 0);
    }
    // 🔴 SEPT RENCONTRES POSÉES À JOHTO CONTRE UNE À KANTO. La ligne d'avant
    //    lisait `W.POKE_RONFLEX` et le drapeau `ronflex` de l'étape : un seul
    //    cas, donc six fiches muettes sur « où le trouver » — Simularbre, le
    //    Lokhlass, le Léviator rouge, les Voltorbe du repaire.
    var sta = STATIQUES();
    for (var sq = 0; sq < sta.length; sq++) {
      if (sta[sq].n !== n) continue;
      var eSta = null;
      for (var se = 0; se < et.length; se++) if (et[se].id === sta[sq].etape) eSta = et[se];
      poser("statique", (eSta && eSta.lieu) || sta[sq].etape, 0);
    }
    // Les œufs : ce qui en sort ne se trouve nulle part ailleurs.
    var oeu = OEUFS();
    for (var oq = 0; oq < oeu.length; oq++) {
      for (var ot = 0; ot < (oeu[oq].table || []).length; ot++) {
        if (oeu[oq].table[ot].n === n) poser("oeuf", oeu[oq].etape, 0);
      }
    }

    // Ce qui sort d'une évolution : on nomme la forme dont il vient, pas un lieu.
    // 🔴 ON NE PARCOURT QUE LES CLÉS NUMÉRIQUES. `POKE_ESPECE` est indexé DEUX
    //    fois — par numéro de Pokédex ET par clé du ROM (« IVYSAUR ») — donc
    //    une boucle `for…in` visite chaque espèce deux fois. La fiche affichait
    //    « évolution (Herbizarre) · évolution (Herbizarre) » : une piste
    //    dupliquée se lit comme deux chemins différents.
    var esp = ESP() || {};
    for (var src in esp) {
      if (!Object.prototype.hasOwnProperty.call(esp, src)) continue;
      if (!/^\d+$/.test(src)) continue;
      var ev = esp[src].evolue || [];
      for (var v = 0; v < ev.length; v++) {
        if (ev[v].vers === n) poser("evolution", +src, 0);
      }
    }

    // Le plus probable d'abord : un taux de rencontre passe avant une piste
    // sans chiffre, et les évolutions ferment la marche — elles supposent
    // d'avoir déjà trouvé la forme précédente.
    out.sort(function (a, b) {
      if ((a.type === "evolution") !== (b.type === "evolution")) return a.type === "evolution" ? 1 : -1;
      return (b.taux || 0) - (a.taux || 0);
    });
    return out;
  }

  function lotsCasino(p) {
    return (CASINO()[p.version] || []).map(function (l) {
      var c = {};
      for (var k in l) if (Object.prototype.hasOwnProperty.call(l, k)) c[k] = l[k];
      c.unique = introuvableAilleurs(p.version, l.n);
      return c;
    });
  }

  function prendreLot(p, lot, h) {
    if ((p.jetons || 0) < lot.jetons) {
      return { ok: false, raison: "pasAssezDeJetons", manque: lot.jetons - (p.jetons || 0) };
    }
    p.jetons -= lot.jetons;
    var mon = M().creer(lot.n, lot.niveau, h, { capture: { zone: "casino", niveau: lot.niveau } });
    return { ok: true, mon: mon };
  }

  // ── Les échanges ───────────────────────────────────────────────────────────
  //  🔴 UN ÉCHANGE PREND VRAIMENT LE POKÉMON. On cède le sien : c'est ce qui
  //     rend le choix réel, et c'est la règle du jeu d'origine. Le Pokémon reçu
  //     garde son SURNOM canon — « DUX » pour le Canarticho de Carmin-sur-Mer.
  function echangesDe(p, etape) {
    return ECHANGES().filter(function (e) {
      return e.etape === etape && !(p.echanges && p.echanges[e.recoit]);
    });
  }

  //  🔴 « Ça me demande un échange Mime contre Abra mais j'ai pas Mime — ça
  //     devrait m'empêcher de sélectionner la case » (proprio, 12/08). Prendre
  //     un nœud ferme l'autre branche : un troc qu'on ne peut pas payer est un
  //     piège, pas un choix. LA porte que la carte ET l'écran relisent — deux
  //     copies de « as-tu de quoi payer ? » finiraient par se contredire.
  function echangeJouable(p, etape) {
    return echangesDe(p, etape).some(function (e) { return !!trouver(p, e.donne); });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ALLER-RETOUR — LA SECONDE RAISON D'ENTRER DANS UN NŒUD D'ÉCHANGE
  //
  //  🔴 QUATRE POKÉMON REDEVENAIENT IMPOSSIBLES, ET C'EST LE CORRECTIF DU 12/08
  //     QUI LES AVAIT REFERMÉS. Fermer un troc impayable était juste : prendre
  //     le nœud coûte l'autre branche, et un comptoir vide est un piège. Mais ce
  //     nœud porte AUSSI l'aller-retour, la seule porte vers Alakazam,
  //     Ectoplasma, Grolem et Mackogneur. Un joueur avec un Spectrum en poche et
  //     sans l'espèce réclamée par le dresseur voyait la case grisée : le jeu
  //     lui refusait l'entrée du seul endroit où son Spectrum pouvait évoluer.
  //     Le correctif d'un piège en avait créé un autre, invisible — personne ne
  //     signale une porte qu'il ne sait pas devoir exister.
  //  🔑 LE NŒUD S'OUVRE DONC SUR L'UNE **OU** L'AUTRE des deux raisons. C'est
  //     ici, et ici seulement, qu'on répond « y a-t-il quelque chose à y faire ».
  //     La carte et l'écran lisent cette porte ; deux copies de la question
  //     finiraient par se contredire, exactement comme `echangeJouable` et son
  //     jumeau de la carte avant le 12/08.
  //  ⚠️ ON BALAIE L'ÉQUIPE **ET** LA RÉSERVE. L'écran ne regardait que l'équipe :
  //     un Spectrum laissé au PC n'était jamais proposé, sans un mot. Or on le
  //     confie au dresseur — d'où il part n'a aucune importance pour la fiction.
  // ═══════════════════════════════════════════════════════════════════════════
  function candidatsRetour(p) {
    var out = [], M2 = M();
    if (!M2 || !M2.evolutionParEchange) return out;
    ["equipe", "boite"].forEach(function (ou) {
      var liste = p[ou] || [];
      for (var i = 0; i < liste.length; i++) {
        var ev = M2.evolutionParEchange(liste[i]);
        if (ev) out.push({ ou: ou, i: i, mon: liste[i], vers: ev.vers });
      }
    });
    return out;
  }

  function retourJouable(p) { return candidatsRetour(p).length > 0; }

  // Où se trouve, dans l'équipe puis la boîte, un Pokémon de cette espèce.
  function trouver(p, n) {
    for (var i = 0; i < p.equipe.length; i++) if (p.equipe[i].n === n) return { ou: "equipe", i: i };
    for (var j = 0; j < p.boite.length; j++) if (p.boite[j].n === n) return { ou: "boite", i: j };
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 L'ÉCHANGE CÉDAIT UN EXEMPLAIRE PRÉCIS SANS LE NOMMER NI LE FAIRE
  //     CHOISIR. `trouver` rend LE PREMIER de l'espèce — dans l'équipe d'abord,
  //     la boîte ensuite — et le `splice` est DÉFINITIF. Deux Abra, l'un N.5 et
  //     l'autre N.30 : le jeu cédait l'un ou l'autre selon l'ordre de l'équipe,
  //     sans un mot, sur le seul nœud irréversible du mode.
  //  ✅ TOUS LES EXEMPLAIRES SE LISENT, et l'écran choisit lequel. La porte
  //     rend la LISTE ; `echanger` accepte un rang explicite.
  //  ⚠️ Le repli reste « le premier » pour tout appelant qui ne choisit pas —
  //     le rejeu serveur, notamment, qui ne passe par aucun écran.
  // ═══════════════════════════════════════════════════════════════════════════
  function exemplairesDe(p, n) {
    var out = [];
    for (var i = 0; i < p.equipe.length; i++) {
      if (p.equipe[i].n === n) out.push({ ou: "equipe", i: i, mon: p.equipe[i] });
    }
    for (var j = 0; j < (p.boite || []).length; j++) {
      if (p.boite[j].n === n) out.push({ ou: "boite", i: j, mon: p.boite[j] });
    }
    return out;
  }

  function echanger(p, e, h, choix) {
    var place = choix || trouver(p, e.donne);
    if (!place) return { ok: false, raison: "pasLeBon" };
    var cede = (place.ou === "equipe" ? p.equipe : p.boite).splice(place.i, 1)[0];
    var recu = M().creer(e.recoit, cede.niveau, h, { capture: { zone: e.etape, niveau: cede.niveau } });
    recu.surnom = e.surnom;
    // 🔴 Le Pokémon échangé arrive AU NIVEAU DE CELUI QU'ON CÈDE. Le jeu
    //    d'origine fait pareil, et c'est ce qui empêche l'échange d'être une
    //    façon détournée de se procurer un Pokémon de haut niveau.
    ranger(p, recu);
    p.echanges = p.echanges || {};
    p.echanges[e.recoit] = true;
    // ⚠️ L'IDENTIFIANT D'ÉTAPE, ET C'EST LA BONNE CONVENTION. La fiche du
    //    Pokédex résout la provenance en cherchant `POKE_ETAPES[i].id === zone`,
    //    puis nomme le `lieu` de cette étape. `e.etape` vaut « route-11 » et
    //    donne bien « Route 11 ».
    //    🔴 J'AI CRU L'INVERSE ET J'AI CASSÉ CETTE LIGNE le 11/08 : voyant que
    //       « route-11 » n'était pas dans `POKE_LIEUX`, j'ai conclu qu'il
    //       fallait passer le lieu. C'était lire la table sans lire la fiche
    //       qui la consulte. *Une convention se vérifie chez celui qui LIT, pas
    //       chez celui qui écrit.* Annulé le jour même.
    P().prendre(p, recu.n, e.etape, recu.niveau);
    return { ok: true, recu: recu, cede: cede };
  }

  // ── Les fossiles ───────────────────────────────────────────────────────────
  //  Deux au Mont Sélénité, UN SEUL emporté : l'autre est perdu pour la partie.
  //  Il ne devient un Pokémon qu'une fois ranimé à Cramois'Île.
  function fossiles() { return FOSSILES().slice(); }

  function prendreFossile(p, objet) {
    if (p.fossile) return { ok: false, raison: "dejaPris" };
    p.fossile = objet;
    return { ok: true, objet: objet };
  }

  function ranimer(p, h) {
    if (!p.fossile) return { ok: false, raison: "sansFossile" };
    if (p.fossileRanime) return { ok: false, raison: "dejaRanime" };
    var f = null;
    var lFos = FOSSILES();
    for (var i = 0; i < lFos.length; i++) {
      if (lFos[i].objet === p.fossile) f = lFos[i];
    }
    if (!f) return { ok: false, raison: "fossileInconnu" };
    var mon = M().creer(f.n, f.niveau, h, { capture: { zone: "cramois-ile", niveau: f.niveau } });
    p.fossileRanime = true;
    var ouF = ranger(p, mon);
    P().prendre(p, mon.n, "cramois-ile", mon.niveau);
    return { ok: true, mon: mon, ou: ouF };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE VIEIL AMBRE — LA PLUS LONGUE DETTE DU VOYAGE
  //
  //  🔴 On le ramasse au Musée d'Argenta, à l'acte 1, et la machine qui le
  //     ranime est à Cramois'Île, six actes plus loin. Entre les deux, il ne
  //     sert à rien et il ne coûte rien : c'est une promesse qu'on porte.
  //  ⚠️ IL EST À CÔTÉ DU FOSSILE, PAS À SA PLACE. `p.fossile` garde le choix
  //     exclusif du Mont Sélénité ; l'ambre a ses deux drapeaux à lui. Les
  //     mélanger ferait d'un choix à deux branches un choix à trois.
  // ═══════════════════════════════════════════════════════════════════════════
  function ambreDisponible(p) { return !!AMBRE() && !p.ambre; }

  function prendreAmbre(p) {
    if (!AMBRE()) return { ok: false, raison: "sansAmbre" };
    if (p.ambre) return { ok: false, raison: "dejaPris" };
    p.ambre = true;
    return { ok: true, objet: AMBRE().objet };
  }

  function ranimerAmbre(p, h) {
    var a = AMBRE();
    if (!a) return { ok: false, raison: "sansAmbre" };
    if (!p.ambre) return { ok: false, raison: "sansFossile" };
    if (p.ambreRanime) return { ok: false, raison: "dejaRanime" };
    var mon = M().creer(a.n, a.niveau, h, { capture: { zone: "cramois-ile", niveau: a.niveau } });
    p.ambreRanime = true;
    var ouA = ranger(p, mon);
    P().prendre(p, mon.n, "cramois-ile", mon.niveau);
    return { ok: true, mon: mon, ou: ouA };
  }

  // ── Les cadeaux ────────────────────────────────────────────────────────────
  //  ⚠️ UN CADEAU DE JOHTO PORTE UNE ÉTAPE, PAS UN LIEU — deux des quatre se
  //     donnent au fond d'un donjon. L'appelant passe ce qu'il a, et la porte
  //     accepte les deux : filtrer sur le seul `lieu` aurait rendu une liste
  //     vide sur un nœud parfaitement posé, et l'écran aurait annoncé un
  //     cadeau qui n'existe pas.
  function cadeauxDe(p, ou) {
    return CADEAUX().filter(function (c) {
      var ici = c.etape ? c.etape === ou : c.lieu === ou;
      return ici && !(p.cadeaux && p.cadeaux[c.n]);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES ŒUFS — LA SEULE PORTE VERS SEPT ESPÈCES
  //
  //  🔴 PICHU, MÉLO, TOUDOUDOU, LIPPOUTI, MAGBY, ÉLEKID ET DEBUGANT NE SONT
  //     DANS AUCUNE HERBE. La seconde génération ne les distribue que par
  //     l'élevage : sans œuf, sept espèces sont décoratives dans un Pokédex
  //     qui les compte. L'Œuf Étrange de Cristal existe exactement pour ça, et
  //     il porte ses probabilités dans le ROM.
  //  ⚠️ UN ŒUF NE SE PREND QU'UNE FOIS PAR VOYAGE, comme un cadeau : c'est la
  //     règle de la cartouche, et c'est ce qui rend le tirage intéressant.
  //     Ce qui en sort est un TIRAGE, pas un choix — on ne sait pas ce qu'on
  //     couve, et c'est tout le sujet.
  // ═══════════════════════════════════════════════════════════════════════════
  function oeufDisponible(p, cle) {
    if (p.oeufs && p.oeufs[cle]) return false;
    var l = OEUFS();
    for (var i = 0; i < l.length; i++) if (l[i].cle === cle) return true;
    return false;
  }

  function prendreOeuf(p, n, h) {
    var cle = n && n.oeuf;
    if (!cle || (p.oeufs && p.oeufs[cle])) return { ok: false, raison: "dejaPris" };
    var table = (n.table || []).filter(function (t) { return t.n; });
    if (!table.length) return { ok: false, raison: "sansOeuf" };
    // Le tirage suit les poids du ROM : Pichu 8 %, Mélo 16 %, Toudoudou 16 %…
    var somme = 0, i;
    for (i = 0; i < table.length; i++) somme += table[i].poids || 1;
    var d = h.entier(somme), choisi = table[table.length - 1];
    for (i = 0; i < table.length; i++) {
      d -= table[i].poids || 1;
      if (d < 0) { choisi = table[i]; break; }
    }
    var niveau = n.niveau || 5;
    var mon = M().creer(choisi.n, niveau, h, { capture: { zone: n.etape, niveau: niveau } });
    p.oeufs = p.oeufs || {};
    p.oeufs[cle] = choisi.n;
    ranger(p, mon);
    P().prendre(p, mon.n, n.etape, mon.niveau);
    return { ok: true, mon: mon, oeuf: cle };
  }

  function prendreCadeau(p, c, h) {
    if (p.cadeaux && p.cadeaux[c.n]) return { ok: false, raison: "dejaPris" };
    var mon = M().creer(c.n, c.niveau, h, { capture: { zone: c.lieu, niveau: c.niveau } });
    p.cadeaux = p.cadeaux || {};
    p.cadeaux[c.n] = true;
    ranger(p, mon);
    // 🔴 LE CADEAU EST LE SEUL À PASSER UN LIEU — 11/08/2026. `c.lieu` vaut
    //    « celadon-city », un identifiant de LIEU ; la fiche, elle, cherche un
    //    identifiant d'ÉTAPE (« celadopole »). Elle ne trouvait donc rien et
    //    retombait sur son repli : « Attrapé au niveau 25 », sans l'endroit.
    //    Évoli et Lapras — les deux seuls cadeaux du jeu — perdaient le leur.
    //    Relevé par `poke-provenance` : « zone CALCULÉE, relevée mais pas
    //    prouvée ». Elle ne l'était pas.
    var etCad = null, tousCad = ETAPES() || [];
    for (var iCad = 0; iCad < tousCad.length; iCad++) {
      if (tousCad[iCad].lieu === c.lieu) { etCad = tousCad[iCad]; break; }
    }
    P().prendre(p, mon.n, (etCad && etCad.id) || c.lieu, mon.niveau);
    return { ok: true, mon: mon };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE DOJO DE SAFRANIA — PRENDRE L'UN, C'EST PERDRE L'AUTRE
  //
  //  🔴 KICKLEE ET TYGNON NE SONT DANS AUCUNE TABLE DE RENCONTRE. Sans ce
  //     passage, deux espèces sur 151 restaient hors d'atteinte — et le seuil
  //     du camion (150 prises) devenait infranchissable : le mythe de Mew
  //     tenait derrière une porte murée. `poke-injoignable` le chiffre.
  //  🔴 ET LE CHOIX EST EXCLUSIF, comme au Mont Sélénité. C'est le seul autre
  //     endroit du jeu d'origine qui pose cette question, et c'est exactement
  //     l'identité de la carte à embranchements : l'un se prend, l'autre se
  //     perd, et on ne revient pas.
  // ═══════════════════════════════════════════════════════════════════════════
  function dojoOuvert(p) {
    return !!DOJO() && !p.dojo;
  }

  function choixDojo() {
    var d = DOJO();
    if (!d) return [];
    return d.choix.map(function (n) { return { n: n, niveau: d.niveau }; });
  }

  function prendreDojo(p, n, h) {
    var d = DOJO();
    if (!d || p.dojo) return { ok: false, raison: "dejaPris" };
    if (d.choix.indexOf(n) < 0) return { ok: false, raison: "horsChoix" };
    var mon = M().creer(n, d.niveau, h, { capture: { zone: "dojo", niveau: d.niveau } });
    // 🔴 LE REFUSÉ SE GARDE. Sans lui, l'écran ne peut pas dire ce qu'on laisse
    //    — et c'est ce qui donne son poids au choix, comme au fossile.
    p.dojo = n;
    p.dojoLaisse = d.choix.filter(function (x) { return x !== n; })[0] || null;
    // 🔴 CELUI QU'ON LAISSE, ON L'A VU — 11/08/2026. L'écran vient de montrer
    //    les deux, et pourtant le refusé restait « inconnu » au Pokédex :
    //    silhouette, pas de nom, et AUCUNE piste (une fiche jamais croisée n'en
    //    affiche pas). Le joueur venait de le rencontrer et sa collection le
    //    niait — donc il ne pouvait pas savoir qu'un autre voyage le lui
    //    donnerait. *Ce n'est pas révéler un secret : c'est enregistrer une
    //    rencontre qui a eu lieu à l'écran.*
    if (p.dojoLaisse) P().voir(p, p.dojoLaisse);
    var ouD = ranger(p, mon);
    P().prendre(p, mon.n, "dojo", mon.niveau);
    return { ok: true, mon: mon, laisse: p.dojoLaisse, ou: ouD };
  }

  // ── Les pierres ────────────────────────────────────────────────────────────
  //  🔴 C'EST LA PIERRE QUI OUVRE TROIS ESPÈCES. Évoli seul n'en donne qu'une ;
  //     Aquali, Voltali et Pyroli dépendent entièrement d'un achat en boutique.
  //     Sans la boutique, ces trois-là restaient injoignables quoi qu'il arrive.
  function pierrePossible(p, mon) {
    var e = ESP()[mon.n];
    var out = [];
    for (var i = 0; i < (e.evolue || []).length; i++) {
      var ev = e.evolue[i];
      if (ev.par !== "pierre") continue;
      if (!(p.sac[ev.objet] > 0)) continue;   // on ne propose que ce qu'on a
      out.push(ev);
    }
    return out;
  }

  function employerPierre(p, index, objet) {
    var mon = p.equipe[index];
    if (!mon) return { ok: false, raison: "pasDePokemon" };
    if (!(p.sac[objet] > 0)) return { ok: false, raison: "pasDePierre" };
    // 🔴 On DEMANDE AU MOTEUR, on ne relit pas la table nous-mêmes. Il porte
    //    déjà `evolutionParPierre`, et `faireEvoluer` recalcule les statistiques
    //    et l'expérience — recopier ce test ici aurait donné une seconde vérité
    //    à tenir d'accord, le motif payé six fois sur ce mode.
    var choix = M().evolutionParPierre(mon, objet);
    if (!choix) return { ok: false, raison: "sansEffet" };
    // 🔴 UNE SEULE PORTE POUR SORTIR DU SAC. Ces trois fonctions décrémentaient
    //    à la main : elles laissaient des entrées à zéro derrière elles, et
    //    surtout elles doublaient la règle. C'est exactement le motif payé six
    //    fois sur ce mode — deux façons de faire, deux comptes, et un jour
    //    l'écran donne pour absent ce que le joueur possède.
    P().utiliserObjet(p, objet);
    var avant = mon.n;
    M().faireEvoluer(mon, choix.vers);
    P().prendre(p, mon.n, "evolution", mon.niveau);
    return { ok: true, de: avant, vers: mon.n, mon: mon };
  }

  // ── Les Capsules Techniques ────────────────────────────────────────────────
  //  🔴 C'EST LE SYSTÈME D'ÉQUIPEMENT DU MODE, et il est entièrement canon.
  //     Un Racaillou avec Séisme n'est pas le même Pokémon qu'un Racaillou
  //     sans. Chaque espèce porte déjà la liste des machines qu'elle accepte
  //     dans `especes[].ct` — on ne l'invente pas, on la lit.
  function ctDe(p) {
    var out = [];
    for (var n in (p.ct || {})) {
      if (!p.ct[n]) continue;
      var m = null;
      for (var i = 0; i < W.POKE_CT.length; i++) if (W.POKE_CT[i].n === +n) m = W.POKE_CT[i];
      if (m) out.push(m);
    }
    return out.sort(function (a, b) { return a.n - b.n; });
  }

  // Qui, dans l'équipe, peut apprendre cette machine.
  function quiApprend(p, machine) {
    var out = [];
    for (var i = 0; i < p.equipe.length; i++) {
      var e = ESP()[p.equipe[i].n];
      if (e && e.ct && e.ct.indexOf(machine.cle) >= 0) out.push(i);
    }
    return out;
  }

  // 🔴 UNE CT S'UTILISE UNE FOIS, comme dans le jeu d'origine. C'est ce qui
  //    fait de son attribution une vraie décision : à qui donner Séisme ?
  function apprendreCT(p, index, machine, remplace) {
    var mon = p.equipe[index];
    if (!mon) return { ok: false, raison: "pasDePokemon" };
    var e = ESP()[mon.n];
    if (!e.ct || e.ct.indexOf(machine.cle) < 0) return { ok: false, raison: "nePeutPas" };
    if (!(p.ct && p.ct[machine.n])) return { ok: false, raison: "pasLaCT" };
    for (var i = 0; i < mon.attaques.length; i++) {
      if (mon.attaques[i].cle === machine.cle) return { ok: false, raison: "dejaConnue" };
    }
    if (mon.attaques.length >= 4 && remplace == null) return { ok: false, raison: "quatreAttaques" };
    M().apprendre(mon, machine.cle, mon.attaques.length >= 4 ? remplace : undefined);
    p.ct[machine.n]--;
    return { ok: true, mon: mon };
  }

  // ── Les vitamines ──────────────────────────────────────────────────────────
  //  🔴 Elles alimentent les POINTS D'EFFORT du jeu d'origine — un système que
  //     le moteur portait déjà et que rien ne remplissait hors combat. Le gain
  //     est PERMANENT : c'est la seule progression qui survit à un K.O.
  var VITAMINES = {
    HP_UP: "pv", PROTEIN: "atk", IRON: "def", CARBOS: "vit", CALCIUM: "spe",
  };
  var VITAMINE_GAIN = 2560;   // le pas du jeu d'origine

  function employerVitamine(p, index, objet) {
    var stat = VITAMINES[objet];
    if (!stat) return { ok: false, raison: "pasUneVitamine" };
    var mon = p.equipe[index];
    if (!mon) return { ok: false, raison: "pasDePokemon" };
    if (!(p.sac[objet] > 0)) return { ok: false, raison: "pasEnStock" };
    // Le plafond du canon : au-delà, la vitamine ne fait plus rien et il faut
    // le DIRE, sinon le joueur gaspille sans comprendre.
    if (mon.statExp[stat] >= 25600) return { ok: false, raison: "plafond", stat: stat };
    P().utiliserObjet(p, objet);
    mon.statExp[stat] = Math.min(25600, mon.statExp[stat] + VITAMINE_GAIN);
    var avant = mon.stats.pv;
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 ON REND LE GAIN VISIBLE, PAS SEULEMENT LE FAIT. Le calcul d'origine
    //    multiplie le terme de points d'effort par le NIVEAU : à N.5, une
    //    vitamine à 9 800 ₽ ajoute 2 560 points et fait bouger la statistique
    //    de… zéro. C'est fidèle, et c'est un piège : l'écran annonçait « gagne
    //    du Attaque, pour toujours » pendant que le nombre ne bougeait pas.
    //    Le joueur croit à un objet cassé et n'en rachètera plus.
    //    On mesure donc l'écart réel et on laisse l'écran dire la vérité —
    //    « +3 », ou « rien encore, mais c'est acquis ».
    // ═══════════════════════════════════════════════════════════════════════
    var statAvant = mon.stats[stat];
    mon.stats = M().calculerStats(mon);
    mon.pv = Math.min(mon.stats.pv, mon.pv + (mon.stats.pv - avant));
    return { ok: true, mon: mon, stat: stat, gain: mon.stats[stat] - statAvant };
  }

  // Le Super Bonbon : un niveau, tout de suite. Il peut donc déclencher une
  // évolution et l'apprentissage d'une attaque — on rend les événements.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 LE BONBON PASSAIT À TRAVERS LE PLAFOND, ET IL RENDAIT 36 NIVEAUX.
  //     Signalé par un joueur le 16/08 : « j'étais cap lvl 64 et en mettant un
  //     super bonbon ça m'a up instant lvl 100 ». Deux règles justes, aucune
  //     faute de frappe, et un trou entre les deux :
  //      · sous plafond, l'expérience RENTRE quand même — seuls les niveaux
  //        s'arrêtent, pour que l'acte suivant rende ce qui a été accumulé ;
  //      · cet appel-ci ne passait PAS de plafond, donc `appliquerExperience`
  //        reprenait sa borne à 100 et relâchait toute la réserve d'un coup.
  //     `manque` était d'ailleurs NÉGATIF (l'expérience dépassait déjà de loin
  //     le niveau suivant), donc `Math.max(1, …)` ajoutait UN point — et un
  //     seul point suffisait à déclencher trente-six montées.
  //  ✅ DEUX BORNES, ET CHACUNE DIT UNE CHOSE DIFFÉRENTE :
  //      · le plafond de l'ACTE décide si le bonbon peut servir — au plafond,
  //        il est refusé et RESTE DANS LE SAC, comme une vitamine au maximum ;
  //      · `mon.niveau + 1` borne l'effet, parce que c'est la promesse écrite
  //        du bonbon : « un niveau, tout de suite ». Sans elle, un Pokémon
  //        avec de la réserve en aurait pris plusieurs pour un seul bonbon.
  //  🔑 UN OBJET QUI DONNE DE L'EXPÉRIENCE DOIT PASSER PAR LE MÊME PLAFOND QUE
  //     LE COMBAT. Sinon le plafond n'est plus une règle, c'est un obstacle à
  //     contourner — et celui-ci s'achetait 4 800 ₽ au comptoir.
  // ═══════════════════════════════════════════════════════════════════════════
  function employerBonbon(p, index) {
    var mon = p.equipe[index];
    if (!mon) return { ok: false, raison: "pasDePokemon" };
    if (!(p.sac.RARE_CANDY > 0)) return { ok: false, raison: "pasEnStock" };
    var cap = (W.PokeActes && W.PokeActes.plafondPour) ? W.PokeActes.plafondPour(p) : 0;
    var borne = Math.min(100, cap > 0 ? cap : 100);
    if (mon.niveau >= borne) return { ok: false, raison: "niveauMax" };
    P().utiliserObjet(p, "RARE_CANDY");
    // ⚠️ Le moteur expose `expTotalePour`, pas `expPourNiveau` : j'avais écrit
    //    le second de mémoire, et il n'existe pas. Un nom inventé passe la
    //    lecture et casse à l'exécution.
    var manque = M().expTotalePour(ESP()[mon.n].croissance, mon.niveau + 1) - mon.exp;
    return {
      ok: true, mon: mon,
      suites: M().appliquerExperience(mon, Math.max(1, manque), mon.niveau + 1),
    };
  }

  // Une place dans l'équipe, sinon la boîte — jamais de perte silencieuse.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 SIX ÉTAIT CODÉ EN DUR ICI, ET ÇA CONTOURNAIT QUATRE SERMENTS. Cette
  //     porte range TOUT ce qu'on obtient hors capture : les cadeaux (Évoli,
  //     les starters du Manoir), les fossiles ranimés, les échanges, Ronflex,
  //     le Dojo. Quatre serments et une règle du jour posent `equipeMax` — le
  //     Serment de la solitude annonce « quatre places », celui de la retraite
  //     deux — et chacun d'eux se contournait en acceptant un cadeau. Le
  //     plafond n'est pas décoratif : c'est le PRIX de ces serments, et il
  //     était remboursé par le premier Évoli venu.
  //  🔴 TROUVÉ EN MESURANT, PAS EN RELISANT : le harnais rendait des équipes de
  //     5,4 sous un serment qui plafonne à 4. Deux « 6 » du harnais corrigés
  //     n'y suffisaient pas — le troisième était dans le jeu.
  //  ⚠️ On lit le COMPOSÉ, comme la capture (`ui.js`) et la Pension : c'est la
  //     seule vérité du plafond, et un quatrième endroit qui décide serait un
  //     quatrième endroit à corriger la prochaine fois.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 ET ELLE REND OÙ ELLE A RANGÉ. Six écrans l'appellent — casino, Dojo,
  //     ranimation, ambre, cadeau, échange — et AUCUN ne disait qu'à équipe
  //     pleine la créature part en réserve. On paie 5 500 jetons, l'artwork
  //     s'affiche façon « il te suit », et il est au PC. Le fait existait, il
  //     n'avait simplement pas de porteur.
  function ranger(p, mon) {
    var places = (W.PokeSerments ? W.PokeSerments.effet(p).equipeMax : 6) || 6;
    if (p.equipe.length < places) { p.equipe.push(mon); return "equipe"; }
    p.boite.push(mon);
    return "boite";
  }

  W.PokeObtenir = {
    prixDe: prixDe,
    acheter: acheter,
    inventaire: inventaire,
    acheterJetons: acheterJetons,
    // Le taux du comptoir, lu par l'écran du Casino ET par l'achat : deux
    // copies du même prix finiraient par se contredire (17/08).
    prixJeton: prixJeton,
    lotsCasino: lotsCasino,
    ouTrouver: ouTrouver,
    prendreLot: prendreLot,
    echangesDe: echangesDe,
    echangeJouable: echangeJouable,
    candidatsRetour: candidatsRetour,
    retourJouable: retourJouable,
    echanger: echanger,
    exemplairesDe: exemplairesDe,
    trouver: trouver,
    fossiles: fossiles,
    prendreFossile: prendreFossile,
    ranimer: ranimer,
    cadeauxDe: cadeauxDe,
    prendreCadeau: prendreCadeau,
    oeufDisponible: oeufDisponible,
    prendreOeuf: prendreOeuf,
    donnerCT: donnerCT,
    poserMachine: poserMachine,
    ambreDisponible: ambreDisponible,
    prendreAmbre: prendreAmbre,
    ranimerAmbre: ranimerAmbre,
    dojoOuvert: dojoOuvert,
    choixDojo: choixDojo,
    prendreDojo: prendreDojo,
    pierrePossible: pierrePossible,
    employerPierre: employerPierre,
    MART_MACHINES: MART_MACHINES,
    MART_COMBAT: MART_COMBAT,
    ACTE_MACHINES: ACTE_MACHINES,
    martPour: martPour,
    ctDe: ctDe,
    machinePour: machinePour,
    quiApprend: quiApprend,
    apprendreCT: apprendreCT,
    VITAMINES: VITAMINES,
    // ⚠️ EXPORTÉ pour que l'écran annonce le gain AVANT le clic sans recopier
    //    le pas : deux valeurs pour un seul pas divergeraient au premier
    //    réglage, et c'est l'écran qui aurait tort.
    VITAMINE_GAIN: VITAMINE_GAIN,
    employerVitamine: employerVitamine,
    employerBonbon: employerBonbon,
    ranger: ranger,
  };
})(typeof window !== "undefined" ? window : globalThis);
