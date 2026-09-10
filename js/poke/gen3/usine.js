(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  MOTEUR DE L'USINE DE COMBAT (BATTLE FACTORY — HOENN ÉMERAUDE)
  //
  //  Module pur NOYAU (zéro DOM, zéro Math.random, zéro Date.now) gérant toute
  //  la boucle de jeu de l'Usine de Combat :
  //   · Tirage initial de 6 prêts (au niveau 50) sans doublons d'espèce ni d'objet
  //   · Sélection tactique de 3 Pokémon
  //   · Séries de 7 combats échelonnés par paliers de difficulté (tier1 -> tier4)
  //   · Boss Meneur Samson (Noland) aux combats 21 (Argent) et 42 (Or)
  //   · Échange tactique d'après-match (swap) ou conservation de l'équipe
  //   · Soins complets entre les matchs
  //   · Décompte canonique des Points de Combat (PCo)
  // ═══════════════════════════════════════════════════════════════════════════

  var DRESSEURS_USINE = [
    { classe: "cooltrainer_m", titre: "Topdresseur", noms: ["Alexandre", "Bastien", "Cédric", "Damien", "Hugo", "Julien", "Kevin", "Maxime", "Quentin", "Romain"] },
    { classe: "cooltrainer_f", titre: "Topdresseuse", noms: ["Camille", "Estelle", "Gaëlle", "Isabelle", "Laure", "Nathalie", "Pauline", "Sarah", "Valérie", "Zoé"] },
    { classe: "gentleman", titre: "Gentleman", noms: ["Arthur", "Charles", "Edouard", "Henri", "Roland", "Victor"] },
    { classe: "blackbelt_t", titre: "Karatéka", noms: ["Bruce", "Ken", "Ryu", "Takeshi", "Nobu", "Jin"] },
    { classe: "pokefan_m", titre: "Pokéfan", noms: ["Barnabé", "Félix", "Gaston", "Lucien", "Nestor"] },
    { classe: "pokefan_f", titre: "Pokéfane", noms: ["Agathe", "Béatrice", "Clarisse", "Dorothée", "Élise"] },
    { classe: "psychic_m", titre: "Kinésiste", noms: ["Alain", "Gilles", "Léo", "Stan", "Yann"] },
    { classe: "expert_m", titre: "Expert", noms: ["Gen", "Hattori", "Jubei", "Masashi", "Tenzin"] },
    { classe: "expert_f", titre: "Experte", noms: ["Chiyo", "Kaede", "Mayumi", "Shizuka", "Tomoe"] },
    { classe: "scientist", titre: "Scientifique", noms: ["Albert", "Blaise", "Denis", "Isaac", "Louis", "René"] }
  ];

  /**
   * Détermine le palier de difficulté des sets pour un combat donné.
   */
  function palierPourCombat(serie, combatDansSerie, totalVictoires) {
    var v = typeof totalVictoires === "number" ? totalVictoires : 0;
    var s = typeof serie === "number" ? serie : Math.floor(v / 7) + 1;
    var c = typeof combatDansSerie === "number" ? combatDansSerie : (v % 7) + 1;
    var combatGlobal = (s - 1) * 7 + c;

    if (combatGlobal === 42 || s >= 6) {
      return "tier4";
    }
    if (v < 14) {
      return "tier1";
    }
    if (v < 28) {
      return "tier2";
    }
    return "tier3";
  }

  /**
   * Instancie un Pokémon prêt pour l'Usine au niveau 50 avec scaling DV et statExp.
   */
  function genererMonDeSet(set, h, palier) {
    if (!W.PokeMoteur || typeof W.PokeMoteur.creer !== "function") {
      throw new Error("PokeMoteur.creer non disponible");
    }

    var mon = W.PokeMoteur.creer(set.espece, 50, h, {
      nature: set.nature,
      objet: set.objet,
      attaques: set.attaques
    });

    // Normaliser mon.attaques en { cle, pp, ppMax }
    if (Array.isArray(mon.attaques)) {
      var tableAtt = (W.PokeRegles && W.PokeRegles.attaques && W.PokeRegles.attaques()) || W.POKE_ATTAQUES || {};
      mon.attaques = mon.attaques.map(function (a) {
        if (typeof a === "string") {
          var moveDef = tableAtt[a];
          if (!moveDef && W.POKE_GEN3_ATTAQUES && Array.isArray(W.POKE_GEN3_ATTAQUES)) {
            for (var i = 0; i < W.POKE_GEN3_ATTAQUES.length; i++) {
              if (W.POKE_GEN3_ATTAQUES[i].cle === a) {
                moveDef = W.POKE_GEN3_ATTAQUES[i];
                break;
              }
            }
          }
          var pp = (moveDef && moveDef.pp) || 15;
          return { cle: a, pp: pp, ppMax: pp };
        }
        return a;
      });
    }

    // Scaling selon le palier
    var dvVal = 9;
    var expVal = 2000;
    if (palier === "tier2") {
      dvVal = 12;
      expVal = 8000;
    } else if (palier === "tier3") {
      dvVal = 15;
      expVal = 25000;
    } else if (palier === "tier4") {
      dvVal = 15;
      expVal = 65535;
    }

    mon.dv = { pv: dvVal, atk: dvVal, def: dvVal, vit: dvVal, spe: dvVal };
    mon.statExp = { pv: 0, atk: 0, def: 0, vit: 0, spe: 0, sat: 0, sdf: 0 };

    if (palier === "tier4" || expVal === 65535) {
      mon.statExp.pv = 65535;
      mon.statExp.atk = 65535;
      mon.statExp.def = 65535;
      mon.statExp.vit = 65535;
      mon.statExp.spe = 65535;
      mon.statExp.sat = 65535;
      mon.statExp.sdf = 65535;
    } else {
      var rep = set.repartition || "equilibre";
      if (rep === "atk_vit") {
        mon.statExp.atk = expVal;
        mon.statExp.vit = expVal;
      } else if (rep === "sat_vit") {
        mon.statExp.sat = expVal;
        mon.statExp.spe = expVal;
        mon.statExp.vit = expVal;
      } else if (rep === "atk_pv") {
        mon.statExp.atk = expVal;
        mon.statExp.pv = expVal;
      } else if (rep === "pv_def") {
        mon.statExp.pv = expVal;
        mon.statExp.def = expVal;
      } else if (rep === "pv_sat") {
        mon.statExp.pv = expVal;
        mon.statExp.sat = expVal;
        mon.statExp.spe = expVal;
      } else {
        // equilibre
        mon.statExp.pv = Math.floor(expVal / 2);
        mon.statExp.atk = Math.floor(expVal / 2);
        mon.statExp.def = Math.floor(expVal / 2);
        mon.statExp.vit = Math.floor(expVal / 2);
        mon.statExp.spe = Math.floor(expVal / 2);
        mon.statExp.sat = Math.floor(expVal / 2);
        mon.statExp.sdf = Math.floor(expVal / 2);
      }
    }

    // Recalculer stats
    mon.stats = W.PokeMoteur.calculerStats(mon);
    mon.pv = mon.stats.pv;
    return mon;
  }

  /**
   * Tire N sets distincts d'espèce et d'objet.
   */
  function tirerSetsDistincts(palier, nb, h) {
    var tous = (W.POKE_GEN3_SETS_USINE && W.POKE_GEN3_SETS_USINE[palier]) || [];
    if (!tous.length && W.POKE_GEN3_SETS_USINE) {
      tous = W.POKE_GEN3_SETS_USINE.tier1 || [];
    }

    var melange = typeof h.melange === "function" ? h.melange(tous) : tous.slice();
    var choisis = [];
    var especesVues = {};
    var objetsVus = {};

    for (var i = 0; i < melange.length && choisis.length < nb; i++) {
      var s = melange[i];
      if (especesVues[s.espece]) continue;
      if (s.objet && objetsVus[s.objet]) continue;
      especesVues[s.espece] = true;
      if (s.objet) objetsVus[s.objet] = true;
      choisis.push(s);
    }

    // Fallback si contrainte d'objets trop stricte
    if (choisis.length < nb) {
      for (var j = 0; j < melange.length && choisis.length < nb; j++) {
        var s2 = melange[j];
        if (especesVues[s2.espece]) continue;
        especesVues[s2.espece] = true;
        choisis.push(s2);
      }
    }

    return choisis;
  }

  /**
   * Tire 6 prêts de départ au niveau 50 sans doublon d'espèce ni d'objet.
   */
  function tirerPrets(graine, serie, h) {
    var rng = h;
    if (!rng && W.PokeHasard) {
      rng = new W.PokeHasard(graine || 123456);
    }
    var palier = (typeof serie === "string" && serie.indexOf("tier") === 0)
      ? serie
      : palierPourCombat(typeof serie === "number" ? serie : 1, 1, ((typeof serie === "number" ? serie : 1) - 1) * 7);

    var sets = tirerSetsDistincts(palier, 6, rng);
    var prets = [];
    for (var i = 0; i < sets.length; i++) {
      prets.push(genererMonDeSet(sets[i], rng, palier));
    }
    return prets;
  }

  /**
   * Génère l'adversaire (Boss Samson ou dresseur standard de l'Usine).
   */
  function tirerAdversaire(session, h) {
    var rng = h;
    if (!rng && W.PokeHasard) {
      var sourceGraine = (session && session.graine)
        ? (session.graine + "-adv-" + (session.combatGlobal || 1))
        : 123456;
      rng = new W.PokeHasard(sourceGraine);
    }

    var combatGlobal = session.combatGlobal;

    // Boss Meneur Samson (Argent) au combat 21 (fin de série 3)
    if (combatGlobal === 21) {
      var setsBossArgent = tirerSetsDistincts("tier3", 3, rng);
      var equipeBossArgent = [];
      for (var b1 = 0; b1 < setsBossArgent.length; b1++) {
        equipeBossArgent.push(genererMonDeSet(setsBossArgent[b1], rng, "tier4"));
      }
      return {
        id: "noland_argent",
        nom: "Meneur Samson",
        titre: "Savant de l'Usine",
        classe: "meneur",
        estBoss: true,
        symbole: "argent",
        equipe: equipeBossArgent
      };
    }

    // Boss Meneur Samson (Or) au combat 42 (fin de série 6)
    if (combatGlobal === 42) {
      var setsBossOr = tirerSetsDistincts("tier4", 3, rng);
      var equipeBossOr = [];
      for (var b2 = 0; b2 < setsBossOr.length; b2++) {
        equipeBossOr.push(genererMonDeSet(setsBossOr[b2], rng, "tier4"));
      }
      return {
        id: "noland_or",
        nom: "Meneur Samson",
        titre: "Savant de l'Usine",
        classe: "meneur",
        estBoss: true,
        symbole: "or",
        equipe: equipeBossOr
      };
    }

    // Dresseur régulier
    var palier = palierPourCombat(session.serie, session.combat, session.victoires);
    var setsAdverses = tirerSetsDistincts(palier, 3, rng);
    var equipeAdverse = [];
    for (var a = 0; a < setsAdverses.length; a++) {
      equipeAdverse.push(genererMonDeSet(setsAdverses[a], rng, palier));
    }

    var groupe = typeof rng.dans === "function" ? rng.dans(DRESSEURS_USINE) : DRESSEURS_USINE[0];
    var nomDresseur = typeof rng.dans === "function" ? rng.dans(groupe.noms) : groupe.noms[0];

    return {
      id: "usine_adv_" + combatGlobal,
      nom: nomDresseur,
      titre: groupe.titre,
      classe: groupe.classe,
      estBoss: false,
      symbole: null,
      equipe: equipeAdverse
    };
  }

  /**
   * Crée une session complète d'Usine de Combat.
   */
  function creerSession(options, h) {
    var opt = options || {};
    var graine = opt.graine || (h && (h.source || h.graine)) || 123456;
    var rng = h;
    if (!rng && W.PokeHasard) {
      rng = new W.PokeHasard(graine);
    }

    var prets = tirerPrets(graine, 1, rng);

    return {
      graine: graine,
      serie: 1,
      combat: 1,
      combatGlobal: 1,
      victoires: 0,
      echanges: 0,
      prets: prets,
      equipe: [],
      adversaire: null,
      statut: "choix_initial",
      pcoGagnes: 0,
      symboles: { argent: false, or: false }
    };
  }

  /**
   * Choisit 3 Pokémon parmi les 6 prêts pour constituer l'équipe active.
   */
  function choisirEquipeInitiale(session, indices, h) {
    if (!Array.isArray(indices) || indices.length !== 3) {
      throw new Error("Exactement 3 indices requis");
    }
    var i0 = indices[0], i1 = indices[1], i2 = indices[2];
    if (i0 === i1 || i0 === i2 || i1 === i2) {
      throw new Error("Indices en doublon interdits");
    }
    if (i0 < 0 || i0 > 5 || i1 < 0 || i1 > 5 || i2 < 0 || i2 > 5) {
      throw new Error("Indices hors limites (0 à 5)");
    }
    if (!session.prets || session.prets.length < 6) {
      throw new Error("Prets indisponibles");
    }

    session.equipe = [session.prets[i0], session.prets[i1], session.prets[i2]];
    session.adversaire = tirerAdversaire(session, h);
    session.statut = "combat";
    return session.equipe;
  }

  /**
   * Calcule le gain en Points de Combat (PCo) d'une série victorieuse.
   */
  function calculerGainPCo(serie, estBoss) {
    var s = serie || 1;
    var gainBase = 3;
    if (s === 1 || s === 2) {
      gainBase = 3;
    } else if (s === 3 || s === 4) {
      gainBase = 5;
    } else if (s === 5 || s === 6) {
      gainBase = 7;
    } else {
      gainBase = 10;
    }

    var bonus = 0;
    if (estBoss) {
      if (s === 3) bonus = 15;
      else if (s === 6) bonus = 30;
    }

    return gainBase + bonus;
  }

  /**
   * Soigne entièrement une équipe (PV, statut, PP au max, volatils).
   */
  function soignerEquipe(equipe) {
    if (!Array.isArray(equipe)) return;
    for (var i = 0; i < equipe.length; i++) {
      var mon = equipe[i];
      if (!mon) continue;
      if (mon.stats && typeof mon.stats.pv === "number") {
        mon.pv = mon.stats.pv;
      }
      mon.statut = null;
      mon.statutTours = 0;
      if (mon.volatils) {
        mon.volatils = {};
      }
      if (Array.isArray(mon.attaques)) {
        for (var j = 0; j < mon.attaques.length; j++) {
          var att = mon.attaques[j];
          if (att && typeof att === "object") {
            att.pp = att.ppMax || att.pp || 15;
          }
        }
      }
      if (W.PokeMoteur && typeof W.PokeMoteur.soigner === "function") {
        W.PokeMoteur.soigner(mon);
      }
    }
  }

  /**
   * Enregistre le résultat d'un combat et met à jour le statut et les PCo.
   */
  function enregistrerResultatCombat(session, joueurGagne, h) {
    if (joueurGagne) {
      session.victoires++;
      if (session.combatGlobal === 21) {
        session.symboles.argent = true;
      }
      if (session.combatGlobal === 42) {
        session.symboles.or = true;
      }

      if (session.combat < 7) {
        session.statut = "echange";
      } else {
        var estBoss = (session.combatGlobal === 21 || session.combatGlobal === 42);
        var gain = calculerGainPCo(session.serie, estBoss);
        session.pcoGagnes += gain;
        session.statut = "serie_gagnee";
      }
    } else {
      session.statut = "defaite";
    }
    return session;
  }

  /**
   * Applique un échange post-combat entre un Pokémon du joueur et un Pokémon adverse.
   */
  function appliquerEchange(session, indexJoueur, indexAdverse, h) {
    if (!session.equipe || !session.adversaire || !session.adversaire.equipe) {
      throw new Error("Équipe ou adversaire manquant");
    }
    if (indexJoueur < 0 || indexJoueur >= session.equipe.length) {
      throw new Error("Index joueur invalide");
    }
    if (indexAdverse < 0 || indexAdverse >= session.adversaire.equipe.length) {
      throw new Error("Index adverse invalide");
    }

    var temp = session.equipe[indexJoueur];
    session.equipe[indexJoueur] = session.adversaire.equipe[indexAdverse];
    session.adversaire.equipe[indexAdverse] = temp;

    session.echanges++;
    soignerEquipe(session.equipe);

    session.combat++;
    session.combatGlobal++;
    session.adversaire = tirerAdversaire(session, h);
    session.statut = "combat";
    return session;
  }

  /**
   * Conserve l'équipe actuelle sans effectuer d'échange.
   */
  function garderEquipe(session, h) {
    soignerEquipe(session.equipe);
    session.combat++;
    session.combatGlobal++;
    session.adversaire = tirerAdversaire(session, h);
    session.statut = "combat";
    return session;
  }

  /**
   * Poursuit l'aventure vers la série suivante après avoir remporté une série de 7.
   */
  function continuerSerie(session, h) {
    session.serie++;
    session.combat = 1;
    session.combatGlobal++;
    soignerEquipe(session.equipe);
    session.adversaire = tirerAdversaire(session, h);
    session.statut = "combat";
    return session;
  }

  W.PokeUsine = {
    palierPourCombat: palierPourCombat,
    genererMonDeSet: genererMonDeSet,
    tirerPrets: tirerPrets,
    tirerAdversaire: tirerAdversaire,
    creerSession: creerSession,
    choisirEquipeInitiale: choisirEquipeInitiale,
    enregistrerResultatCombat: enregistrerResultatCombat,
    appliquerEchange: appliquerEchange,
    garderEquipe: garderEquipe,
    continuerSerie: continuerSerie,
    soignerEquipe: soignerEquipe,
    calculerGainPCo: calculerGainPCo
  };

})(typeof window !== "undefined" ? window : globalThis);
