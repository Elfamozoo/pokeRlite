(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE DUEL — PvP ASYNCHRONE
  //
  //  🔴 FICHIER PUR, et il est dans le NOYAU : le serveur le rejoue. C'est ce
  //     qui rend le PvP inviolable — personne n'envoie un résultat, on envoie
  //     une ÉQUIPE SCELLÉE et le serveur joue le combat lui-même.
  //
  //  Le principe, et il évite tout serveur de match :
  //   1. chaque joueur SCELLE une équipe de six (espèces, niveaux, DV, attaques) ;
  //   2. la graine du duel est dérivée des DEUX identifiants, dans un ordre
  //      FIXE — donc les deux côtés calculent exactement le même combat ;
  //   3. le combat se joue sans intervention : une politique déterministe des
  //      deux côtés, écrite ici et nulle part ailleurs.
  //
  //  🔴 AUCUN AVANTAGE DE COMPTE N'ENTRE ICI. Ni compagnon, ni objet de
  //     boutique, ni bonus de badge. C'est la règle du projet : rien ne pèse là
  //     où l'on se compare. `sceller()` ne recopie que ce qui vient du voyage.
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE DUEL EST ÉPINGLÉ À LA PREMIÈRE GÉNÉRATION, ET IL LE DIT  [19/08/2026]
  //
  //  🔴 IL NE SUIT PAS LE JEU DE RÈGLES COURANT, et c'est la seule exception
  //     du mode. Un scellé d'équipe encode ses attaques par leur RANG dans la
  //     table, et son empreinte est calculée sur cette table (voir
  //     `empreinte()`). Si le duel lisait le jeu de règles de la partie en
  //     cours, un joueur revenu de Johto décoderait les scellés de Kanto avec
  //     la table de Johto : six équipes aux mauvais coups, des deux côtés, et
  //     aucun moyen de s'en apercevoir — le serveur rejouerait le même faux.
  //
  //  🔑 UNE ARÈNE DE COMPARAISON SE FIGE. C'est déjà la règle du fichier pour
  //     les serments, les badges et les objets — « rien ne pèse là où l'on se
  //     compare ». Le jeu de règles est de la même famille : il pèse encore
  //     plus, et il se figerait de toute façon le jour où deux générations
  //     cohabitent.
  //
  //  ⚠️ ÉPINGLÉ PAR LE REGISTRE, PAS PAR UN ACCÈS DIRECT. `PokeRegles.pour()`
  //     rend un jeu de règles NOMMÉ sans changer celui de la partie : la
  //     dépendance est écrite, elle se cherche, et le jour où le duel devra
  //     s'ouvrir à Johto il y aura UN nom à changer et un seul.
  // ═══════════════════════════════════════════════════════════════════════════
  var DUEL_REGLES = "gen1";
  var JEU = function () { return W.PokeRegles.pour(DUEL_REGLES); };
  var ESP = function () { return JEU().especes(); };
  var ATT = function () { return JEU().attaques(); };
  var ESPL = function () { return JEU().especesListe(); };
  var ATTL = function () { return JEU().attaquesListe(); };
  // 🔴 ÉPINGLÉES ELLES AUSSI. L'échelle du duel se compare entre joueurs : ses
  //    paliers sont les Champions de Kanto pour tout le monde, y compris pour
  //    quelqu'un qui revient de Johto. Lues sur le jeu de règles COURANT, deux
  //    joueurs n'auraient pas gravi la même échelle.
  var ARENES = function () { return JEU().arenes() || []; };
  var CONSEIL = function () { return JEU().conseil() || []; };

  var M = function () { return W.PokeMoteur; };
  var C = function () { return W.PokeCombat; };

  // ── Sceller une équipe ─────────────────────────────────────────────────────
  //  On ne garde que ce qui décide du combat. Un scellé compact voyage bien et
  //  se relit sans ambiguïté.
  function sceller(partie) {
    var out = [];
    for (var i = 0; i < partie.equipe.length && i < 6; i++) {
      var m = partie.equipe[i];
      out.push({
        n: m.n, niveau: m.niveau, dv: m.dv,
        statExp: m.statExp,
        attaques: m.attaques.map(function (a) { return a.cle; }),
      });
    }
    return { v: 1, equipe: out };
  }

  // 🔴 UN SCELLÉ SE VÉRIFIE AVANT D'ÊTRE JOUÉ. Sans ça, n'importe qui envoie
  //    six Mewtwo niveau 100. Le serveur appelle CETTE fonction, et il refuse
  //    plutôt que de corriger en silence.
  function valider(scelle) {
    if (!scelle || scelle.v !== 1 || !scelle.equipe || !scelle.equipe.length) return "scelle_invalide";
    if (scelle.equipe.length > 6) return "equipe_trop_grande";
    for (var i = 0; i < scelle.equipe.length; i++) {
      var m = scelle.equipe[i];
      if (!ESP()[m.n]) return "espece_inconnue";
      if (!(m.niveau >= 1 && m.niveau <= 100)) return "niveau_hors_bornes";
      if (!m.attaques || !m.attaques.length || m.attaques.length > 4) return "attaques_invalides";
      for (var k = 0; k < m.attaques.length; k++) {
        if (!ATT()[m.attaques[k]]) return "attaque_inconnue";
      }
      for (var s in m.dv) if (m.dv[s] < 0 || m.dv[s] > 15) return "dv_hors_bornes";
    }
    return null;
  }

  function reconstituer(scelle, h) {
    return scelle.equipe.map(function (m) {
      var p = M().creer(m.n, m.niveau, h, {
        dv: m.dv,
        attaques: m.attaques.map(function (cle) {
          var a = ATT()[cle];
          return { cle: cle, pp: a.pp, ppMax: a.pp };
        }),
      });
      if (m.statExp) { p.statExp = m.statExp; p.stats = M().calculerStats(p); p.pv = p.stats.pv; }
      return p;
    });
  }

  // ── La graine du duel ──────────────────────────────────────────────────────
  //  🔴 L'ORDRE EST FIXE, et il ne dépend pas de qui lance. Deux joueurs qui
  //     calculent la même graine voient le même combat : c'est toute la
  //     garantie du mode asynchrone.
  function graineDuel(idA, idB, jour) {
    var a = String(idA), b = String(idB);
    var premier = a < b ? a : b, second = a < b ? b : a;
    return "POKE-DUEL-" + jour + "-" + premier + "-" + second;
  }

  // ── La politique du duel ───────────────────────────────────────────────────
  //  🔴 ELLE EST ÉCRITE ICI, UNE FOIS. Ni le client ni le serveur ne décident :
  //     ils appliquent. Une politique écrite à deux endroits, c'est un duel qui
  //     donne deux vainqueurs — et un joueur qui crie à la triche.
  //  Elle vise la meilleure attaque disponible, et change de Pokémon quand
  //  l'actif est en danger et qu'un plus frais couvre mieux le type d'en face.
  function choisir(etat, cote, h) {
    var moi = etat[cote], lui = etat[cote === "joueur" ? "adverse" : "joueur"];
    var actif = C().actif(moi), cible = C().actif(lui);

    if (actif.pv < actif.stats.pv * 0.25) {
      for (var k = 0; k < moi.equipe.length; k++) {
        var autre = moi.equipe[k];
        if (k === moi.actif || !C().vivant(autre)) continue;
        if (autre.pv < autre.stats.pv * 0.6) continue;
        // On ne change que si le remplaçant encaisse VRAIMENT mieux.
        var subi = pire(cible, autre), subiActif = pire(cible, actif);
        if (subi < subiActif * 0.6) return { type: "changer", index: k };
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE DUEL SPAMMAIT DÉVORÊVE — audit du 14/08. Mesuré sur 300 duels
    //     miroir : Dévorêve était le coup LE PLUS JOUÉ du PvP (2 225 emplois)
    //     contre des cibles ÉVEILLÉES, où il ne fait rien. C'est le défaut
    //     corrigé le matin même pour l'IA des dresseurs — resté entier ici,
    //     parce que la loi vivait enfermée dans `choixAdverse`.
    //     *Une loi rangée dans un enclos ne protège que l'enclos.* Elle est
    //     désormais exportée (`PokeCombat.coupUtile`) et les deux la lisent.
    //  ⚠️ ET ÇA DÉSÉQUILIBRAIT LE DUEL : un camp finissait par épuiser ses PP
    //     de Dévorêve avant l'autre et basculait sur Hypnose — 109 emplois d'un
    //     côté, ZÉRO de l'autre, à équipes rigoureusement identiques.
    // ═══════════════════════════════════════════════════════════════════════
    var index = 0, note = -1;
    for (var i = 0; i < actif.attaques.length; i++) {
      var a = ATT()[actif.attaques[i].cle];
      if (!a || actif.attaques[i].pp <= 0) continue;
      var eff = a.puissance ? C().efficacite(a.type, ESP()[cible.n].types) : 0.35;
      var stab = ESP()[actif.n].types.indexOf(a.type) >= 0 ? 1.5 : 1;
      var n = (a.puissance || 30) * eff * stab;
      // Un coup dont la condition n'est pas réunie tombe au plancher : il reste
      // jouable si l'on n'a que lui, il cesse d'être le favori.
      if (C().coupUtile && !C().coupUtile(a, actif, cible, moi, lui, false)) n = 0;
      if (n > note) { note = n; index = i; }
    }
    return { type: "attaque", index: index };
  }

  function pire(attaquant, defenseur) {
    var m = 0;
    for (var i = 0; i < attaquant.attaques.length; i++) {
      var a = ATT()[attaquant.attaques[i].cle];
      if (!a || !a.puissance) continue;
      m = Math.max(m, a.puissance * C().efficacite(a.type, ESP()[defenseur.n].types));
    }
    return m;
  }

  // ── Jouer le duel ──────────────────────────────────────────────────────────
  //  Rend le vainqueur ET le journal, pour que les deux joueurs regardent le
  //  même combat se dérouler. Le serveur, lui, ne garde que le vainqueur.
  function jouer(scelleA, scelleB, idA, idB, jour) {
    var faute = valider(scelleA) || valider(scelleB);
    if (faute) return { err: faute };

    var h = new W.PokeHasard(graineDuel(idA, idB, jour));
    // 🔴 L'ORDRE DE RECONSTITUTION SUIT L'ORDRE DE LA GRAINE, pas celui de
    //    l'appel : sinon les deux côtés tirent des DV différents et le combat
    //    diverge dès le premier coup.
    var aEstPremier = String(idA) < String(idB);
    var premier = reconstituer(aEstPremier ? scelleA : scelleB, h);
    var second = reconstituer(aEstPremier ? scelleB : scelleA, h);

    var etat = C().demarrer(premier, second, { dresseur: true }, h);
    var journal = [];
    var garde = 0;
    while (!etat.fini && garde++ < 500) {
      for (var cote of ["joueur", "adverse"]) {
        var c = etat[cote];
        if (!C().vivant(C().actif(c))) {
          var k = -1;
          for (var i = 0; i < c.equipe.length; i++) if (C().vivant(c.equipe[i])) { k = i; break; }
          if (k < 0) { etat.fini = cote === "joueur" ? "defaite" : "victoire"; break; }
          C().entrerEnJeu(etat, cote, k, []);
          // 🔴 UNE SEULE PORTE D'ENTRÉE, ET C'EST CELLE DU MOTEUR. Ce bloc a
          //    payé deux fois de l'avoir recopiée : une table de paliers écrite
          //    à la main qui nommait `spe` (dégâts NaN sous Johto), puis des
          //    volatils jamais effacés (le remplaçant héritait de la confusion
          //    et de la graine de son prédécesseur — un camp jouait avec la
          //    règle du moteur, l'autre avec une règle plus dure, dans un duel
          //    qui se veut symétrique). Et depuis 1999, un piège posé au sol
          //    mord À L'ENTRÉE : par cette porte-là, ou par aucune.
        }
      }
      if (etat.fini) break;
      // 🔴 LA MÊME POLITIQUE DES DEUX CÔTÉS. C'est la définition d'un duel
      //    équitable : ce qui départage, ce sont les ÉQUIPES, pas le hasard de
      //    savoir qui a été rangé du côté « joueur ».
      var ev = C().jouerTour(etat, choisir(etat, "joueur", h), h, choisir(etat, "adverse", h));
      journal.push(ev);
    }
    if (garde >= 500) return { err: "duel_sans_fin" };

    // ═══════════════════════════════════════════════════════════════════════
    //  LE DOUBLE K.O. NE DOIT PAS ÊTRE DÉCIDÉ PAR LE SIÈGE — audit du 14/08
    //
    //  🔑 DANS `combat.js` : `if (!resteUn(adverse)) fini = "victoire"; else if
    //     (!resteUn(joueur)) fini = "defaite";` — quand les DEUX camps tombent
    //     au même tour, le `else if` donne toujours la victoire au siège
    //     « joueur ». C'est un moteur de SOLO, et pour le solo c'est un bon
    //     choix : personne ne se plaint de gagner un double K.O.
    //  ⚠️ MESURÉ, ET IL FAUT LE DIRE : le double K.O. est RARE — poser cette
    //     garde n'a pas bougé le taux d'un point (22,8 % avant, 22,8 % après).
    //     Ce n'était donc PAS la cause du déséquilibre du duel ; celle-là était
    //     les volatils hérités, corrigés plus haut. On garde quand même la
    //     garde : un duel qui se veut symétrique ne doit pas laisser le SIÈGE
    //     trancher, même une fois sur mille. *Une correction juste dont la
    //     mesure dit qu'elle ne change rien se garde en le disant.*
    //  ⚠️ ON NE TOUCHE PAS AU MOTEUR : sa règle est juste pour le mode solo,
    //     qui est tout le reste du jeu. C'est le DUEL qui refuse d'hériter d'un
    //     arbitrage écrit pour un autre usage.
    //  ⚖️ ET ON TRANCHE PAR LA GRAINE PARTAGÉE, pas au hasard local : les deux
    //     joueurs rejouent le même duel chacun de son côté et doivent lire le
    //     même vainqueur. Un tirage de plus, pris sur `h`, donc identique
    //     partout — et consommé APRÈS le combat, donc sans effet sur son cours.
    // ═══════════════════════════════════════════════════════════════════════
    var resteJoueur = etat.joueur.equipe.some(function (m) { return C().vivant(m); });
    var resteAdverse = etat.adverse.equipe.some(function (m) { return C().vivant(m); });
    var doubleKO = !resteJoueur && !resteAdverse;
    var premierGagne = doubleKO ? h.brut() < 0.5 : etat.fini === "victoire";
    return {
      vainqueur: (premierGagne === aEstPremier) ? String(idA) : String(idB),
      tours: journal.length,
      journal: journal,
      graine: h.source,
      tirages: h.tirages,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CODE D'ÉQUIPE — LE PvP SANS SERVEUR
  //
  //  🔴 TOUT CE MODULE ÉTAIT MORT. Sceller, valider, reconstituer, la graine
  //     partagée, la politique adverse, la résolution complète d'un duel : tout
  //     était écrit, éprouvé, exporté — et aucun écran ne l'appelait. Le mode
  //     avait un moteur de PvP complet et pas un bouton.
  //
  //  🔴 ET IL N'A PAS BESOIN DU SERVEUR POUR VIVRE. Une équipe scellée tient en
  //     quelques centaines d'octets : on la donne au joueur sous forme de CODE.
  //     Il l'envoie à qui il veut, l'autre le colle, et le duel se rejoue à
  //     l'identique des deux côtés — la graine ne dépend que des deux noms et
  //     du jour. C'est un vrai PvP entre dresseurs, aujourd'hui, sans attendre
  //     que `poke` soit ouvert en écriture côté serveur.
  //
  //  🔴 LE CODE PORTE SA VERSION. Un scellé d'un autre format doit être REFUSÉ,
  //     pas interprété de travers : `valider` le fait déjà, et le décodage lui
  //     passe la main plutôt que de deviner.
  // ═══════════════════════════════════════════════════════════════════════════
  // ── Le format, et pourquoi il n'est pas du JSON en base64 ──────────────────
  //  🔴 MA PREMIÈRE VERSION FAISAIT 1 560 CARACTÈRES. Mesuré sur une équipe de
  //     six : 1 152 octets de JSON, gonflés d'un tiers par la base64. Or ce code
  //     est TOUT le mode : il se colle dans un message, un salon Discord, un
  //     SMS. Un pavé de mille cinq cents caractères ne se partage pas — et un
  //     PvP qu'on ne partage pas n'a pas de joueurs.
  //     Le format compact tient en un peu plus de deux cents.
  //
  //  Une ligne, quatre parties séparées par « | » :
  //     PKD1 | empreinte | nom | six Pokémon séparés par « ~ »
  //  Un Pokémon : numéro . niveau . DV . statExp . attaques
  //  Tout est en base 36, sans majuscule, sans caractère à échapper.
  var SEP = "|", SEP_MON = "~", SEP_CH = ".", SEP_LISTE = "-";
  var MARQUE = "PKD1";

  // 🔴 L'EMPREINTE DES TABLES, ET ELLE EST LÀ POUR REFUSER. Les attaques
  //    voyagent par leur RANG, pas par leur nom — c'est ce qui fait tenir le
  //    code en deux cents caractères. Mais un rang ne vaut que tant que la table
  //    ne bouge pas : le jour où l'on en insère une, tous les codes émis avant
  //    désigneraient l'attaque suivante. Six équipes aux mauvais coups, et
  //    personne pour s'en apercevoir.
  //    Le fichier le dit déjà en toutes lettres plus haut : un code d'un autre
  //    format doit être REFUSÉ, pas interprété de travers. L'empreinte le rend
  //    vrai.
  function empreinte() {
    var A = ATTL(), s = A.length * 131 + ESPL().length;
    for (var i = 0; i < A.length; i++) {
      var c = A[i].cle;
      for (var k = 0; k < c.length; k++) s = (s * 33 + c.charCodeAt(k)) % 2147483647;
    }
    return s.toString(36);
  }

  function rangAttaque(cle) {
    var A = ATTL();
    for (var i = 0; i < A.length; i++) if (A[i].cle === cle) return i;
    return -1;
  }

  var DV_ORDRE = ["pv", "atk", "def", "vit", "spe"];

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PALMARÈS VOYAGE AVEC L'ÉQUIPE — ET NE PÈSE SUR RIEN
  //
  //  🔴 C'EST UNE CINQUIÈME TRANCHE, ET ELLE EST FACULTATIVE. Un code à quatre
  //     tranches reste valide et se joue exactement pareil : c'est ce qui permet
  //     d'ajouter la comparaison sans périmer un seul code déjà émis. Un format
  //     qui invalide l'existant pour ajouter du décor n'en vaut pas la peine.
  //
  //  🔴 IL NE TRAVERSE PAS `valider()`, ET C'EST VOULU. Le scellé rendu par
  //     `decoder` ne le contient pas : il sort à côté, dans `palmares`. Le
  //     combat ne peut donc pas le lire même par accident — la règle du mode dit
  //     que rien ne pèse là où l'on se compare, et une règle tenue par la FORME
  //     des données ne se contourne pas par distraction.
  //
  //  🔴 UN PALMARÈS RECOPIÉ N'EST PAS UNE PREUVE, et le jeu ne prétend pas le
  //     contraire. Il vient du compte de celui qui l'émet : quelqu'un peut
  //     l'éditer à la main. C'est un carnet qu'on montre entre joueurs, pas un
  //     classement — le classement, lui, se recalcule côté serveur depuis le
  //     bilan, et c'est un autre objet.
  //
  //  ⚠️ L'ORDRE DES CHAMPS EST FIGÉ. Il ne se lit pas par clé mais par rang,
  //     comme les attaques : y insérer un champ au milieu ferait lire les
  //     chromatiques d'un joueur comme son plus haut sceau. On AJOUTE en queue,
  //     jamais ailleurs, et un champ absent vaut zéro.
  // ═══════════════════════════════════════════════════════════════════════════
  var PALM_ORDRE = [
    "voyages", "ligues", "badges", "score",
    "pokedex", "chromatiques", "sceau", "chasses", "diplome",
  ];
  var PALM_RANGS = ["debutant", "dresseur", "confirme", "ligue", "maitre"];

  // 🔴 LA TRANCHE S'ANNONCE. Sans cette lettre, un code de duel dont un
  //    séparateur d'équipe a été abîmé se retrouverait avec cinq tranches et
  //    serait ACCEPTÉ — la queue passant pour un palmarès illisible, donc absent.
  //    Un code abîmé se refuse, il ne se rattrape pas : c'est exactement ce que
  //    `poke-duel-test` sabote exprès pour le vérifier.
  var PALM_MARQUE = "p";

  function coderPalmares(p) {
    if (!p) return "";
    var out = PALM_ORDRE.map(function (k) { return Math.max(0, p[k] | 0).toString(36); });
    var r = PALM_RANGS.indexOf(p.rang);
    out.push((r < 0 ? 0 : r).toString(36));
    return PALM_MARQUE + out.join(SEP_LISTE);
  }

  // Rend le palmarès, ou `false` si la tranche est présente et abîmée. Les deux
  // se distinguent : `null` n'existe pas ici — une tranche absente n'atteint
  // jamais cette fonction.
  function decoderPalmares(texte) {
    var s = String(texte || "");
    if (s.charAt(0) !== PALM_MARQUE) return false;
    var v = s.slice(1).split(SEP_LISTE);
    if (v.length !== PALM_ORDRE.length + 1) return false;
    var out = { v: 1 };
    for (var i = 0; i < PALM_ORDRE.length; i++) {
      var n = parseInt(v[i], 36);
      // Un champ illisible rend le palmarès entier faux plutôt qu'à moitié vrai :
      // une carte de comparaison à demi remplie ment sur ce qui manque.
      if (!(n >= 0)) return false;
      out[PALM_ORDRE[i]] = n;
    }
    var r = parseInt(v[PALM_ORDRE.length], 36);
    if (!(r >= 0 && r < PALM_RANGS.length)) return false;
    out.rang = PALM_RANGS[r];
    return out;
  }

  function coder(scelle, nom, palmares) {
    var mons = scelle.equipe.map(function (m) {
      var dv = 0, i;
      for (i = 0; i < DV_ORDRE.length; i++) dv = dv * 16 + ((m.dv && m.dv[DV_ORDRE[i]]) | 0);
      // Le statExp ne s'écrit que s'il existe : une équipe fraîche n'en a pas,
      // et cinq zéros de plus par Pokémon feraient trente caractères pour rien.
      var se = "", somme = 0;
      if (m.statExp) {
        var vals = DV_ORDRE.map(function (k) { somme += (m.statExp[k] | 0); return (m.statExp[k] | 0).toString(36); });
        if (somme) se = vals.join(SEP_LISTE);
      }
      return [
        m.n.toString(36),
        m.niveau.toString(36),
        dv.toString(36),
        se,
        m.attaques.map(function (c) { return rangAttaque(c).toString(36); }).join(SEP_LISTE),
      ].join(SEP_CH);
    });
    // Le nom ne porte aucun séparateur : il vient d'un champ de dix caractères,
    // et on le nettoie plutôt que de l'échapper — un code doit rester lisible.
    var n = String(nom || "").replace(/[|~.\-]/g, " ").trim().slice(0, 12);
    var base = [MARQUE, empreinte(), n, mons.join(SEP_MON)];
    var pal = coderPalmares(palmares);
    if (pal) base.push(pal);
    return base.join(SEP);
  }

  function decoder(texte) {
    if (!texte || !String(texte).trim()) return { err: "code_vide" };
    var parts = String(texte).trim().split(SEP);
    // Quatre tranches ou cinq : la cinquième est le palmarès, et son absence
    // n'est pas une faute. Voir `coderPalmares`.
    if ((parts.length !== 4 && parts.length !== 5) || parts[0] !== MARQUE) return { err: "code_illisible" };
    // 🔴 ON REFUSE, ON NE DEVINE PAS. Un code émis avant un changement de table
    //    désignerait d'autres attaques que celles que son auteur a choisies.
    if (parts[1] !== empreinte()) return { err: "code_perime" };

    var A = ATTL();
    var equipe = [];
    var mons = parts[3].split(SEP_MON);
    for (var i = 0; i < mons.length; i++) {
      var ch = mons[i].split(SEP_CH);
      if (ch.length !== 5) return { err: "code_illisible" };
      var dv = parseInt(ch[2], 36), d = {}, k;
      if (!(dv >= 0)) return { err: "code_illisible" };
      for (k = DV_ORDRE.length - 1; k >= 0; k--) { d[DV_ORDRE[k]] = dv % 16; dv = Math.floor(dv / 16); }
      var se = null;
      if (ch[3]) {
        var v = ch[3].split(SEP_LISTE);
        if (v.length !== DV_ORDRE.length) return { err: "code_illisible" };
        se = {};
        for (k = 0; k < DV_ORDRE.length; k++) se[DV_ORDRE[k]] = parseInt(v[k], 36) || 0;
      }
      var att = [];
      var rangs = ch[4].split(SEP_LISTE);
      for (k = 0; k < rangs.length; k++) {
        var r = parseInt(rangs[k], 36);
        if (!(r >= 0 && r < A.length)) return { err: "attaque_inconnue" };
        att.push(A[r].cle);
      }
      equipe.push({
        n: parseInt(ch[0], 36), niveau: parseInt(ch[1], 36),
        dv: d, statExp: se, attaques: att,
      });
    }

    var scelle = { v: 1, equipe: equipe };
    var faute = valider(scelle);
    if (faute) return { err: faute };
    // 🔴 LE PALMARÈS SORT À CÔTÉ DU SCELLÉ, jamais dedans. C'est la seule chose
    //    qui garantisse qu'aucun chemin du combat ne puisse le lire.
    var pal = null;
    if (parts.length === 5) {
      pal = decoderPalmares(parts[4]);
      if (pal === false) return { err: "code_illisible" };
    }
    return { ok: true, nom: parts[2] || "", scelle: scelle, palmares: pal };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES DÉFIS DE KANTO — DU CONTENU LE PREMIER JOUR
  //
  //  🔴 J'AI LIVRÉ UN PvP SANS UN SEUL ADVERSAIRE. Le duel se joue en collant le
  //     code d'un autre dresseur : un joueur qui n'a personne à qui en demander
  //     ouvre l'écran, lit la règle, et referme. Un mode entier livré vide pour
  //     tous ceux qui arrivent seuls — c'est-à-dire tout le monde, au début.
  //
  //  Les adversaires existaient déjà : les huit Champions, le Conseil 4 et le
  //  Maître sont dans `POKE_ARENES`, `POKE_CONSEIL` et `POKE_RIVAL`. On les
  //  scelle comme n'importe quelle équipe, et ils deviennent une échelle qu'on
  //  gravit avec l'équipe de son meilleur voyage.
  //
  //  🔴 LEUR GRAINE EST FIXE ET DÉRIVE DE LEUR IDENTIFIANT. Les données ne
  //     portent que l'espèce et le niveau : les DV et les attaques se tirent.
  //     Sans graine fixe, chaque joueur affronterait un Koga différent, et
  //     comparer deux palmarès ne voudrait rien dire.
  //  🔴 CE FICHIER NE PRODUIT AUCUN TEXTE. Le nom vient de la donnée pour les
  //     douze premiers ; le Maître n'en a pas, et c'est l'écran qui le nomme.
  var DEFIS = null;
  function defis() {
    if (DEFIS) return DEFIS;
    DEFIS = [];
    var i;
    for (i = 0; i < ARENES().length; i++) {
      DEFIS.push({
        id: "arene" + ARENES()[i].ordre, rang: "arene",
        // ⚠️ ON GARDE LA FICHE, PAS LE NOM RÉSOLU. `defis()` est mémoïsé
        //    (`if (DEFIS) return DEFIS`) : y ranger une chaîne dépendante de la
        //    langue la fige au premier appel. Ça marche tant que la langue est
        //    posée au démarrage — et ça casserait le jour où le mode offre un
        //    sélecteur de langue en page. L'écran résout au moment d'afficher.
        ordre: ARENES()[i].ordre, fiche: ARENES()[i],
        brut: ARENES()[i].equipe,
      });
    }
    for (i = 0; i < CONSEIL().length; i++) {
      DEFIS.push({
        id: "conseil" + CONSEIL()[i].ordre, rang: "conseil",
        ordre: CONSEIL()[i].ordre, fiche: CONSEIL()[i],
        brut: CONSEIL()[i].equipe,
      });
    }
    // Le Maître. Une seule variante — c'est un adversaire COMMUN à tous, pas le
    // rival de sa propre partie : deux joueurs doivent affronter le même.
    DEFIS.push({ id: "maitre", rang: "maitre", ordre: 1, nom: null, brut: W.POKE_RIVAL.champion[0] });
    return DEFIS;
  }

  function scellerDefi(d) {
    var h = new W.PokeHasard("POKE-DEFI-" + d.id);
    return sceller({
      equipe: d.brut.map(function (x) { return M().creer(x.n, x.niveau, h); }),
    });
  }

  W.PokeDuel = {
    sceller: sceller, valider: valider, reconstituer: reconstituer,
    graineDuel: graineDuel, choisir: choisir, jouer: jouer,
    coder: coder, decoder: decoder,
    coderPalmares: coderPalmares, decoderPalmares: decoderPalmares,
    defis: defis, scellerDefi: scellerDefi,
  };
})(typeof window !== "undefined" ? window : globalThis);
