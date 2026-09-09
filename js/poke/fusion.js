(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA FUSION DE DEUX PROGRESSIONS — 17/08/2026
  //
  //  🔴 POURQUOI CE FICHIER EXISTE. `poke_progress` — le Pokédex de COMPTE,
  //     celui qui porte le diplôme des 150 espèces et donc la chasse à Mew —
  //     vivait dans le SEUL `localStorage`. Il ne partait nulle part, même avec
  //     un compte. Question de Darkjuampi le 17/08 (« on ne peut pas récupérer
  //     sa Game sur pc quand on a commencé sur téléphone ? ») et mesure du même
  //     jour : **13,6 % des parties Pokémon ont un compte contre 62 à 70 % dans
  //     les autres univers**. Neuf joueurs sur dix construisaient une collection
  //     de plusieurs dizaines de voyages sans aucun filet.
  //
  //  🔴 CE FICHIER EST PUR, ET C'EST LA CONDITION DE TOUT. Aucun DOM, aucun
  //     `localStorage`, aucun réseau. Le CLIENT l'emploie pour fondre ce qu'il a
  //     avec ce que le serveur garde ; le SERVEUR l'emploie pour fondre ce qui
  //     arrive avec ce qu'il a déjà. **Les deux côtés unissent, personne ne
  //     remplace** — et c'est ce qui rend l'ordre des écritures sans importance.
  //     Deux copies de cette règle finiraient par se contredire, et une
  //     divergence ici EFFACE DES POKÉDEX. Il entre donc dans le NOYAU.
  //
  //  🔑 LA RÈGLE DE FER : `fusionner` NE PEUT JAMAIS RENDRE MOINS QUE CE QU'ELLE
  //     REÇOIT. Pas « ne devrait pas » — ne peut pas : chaque champ passe par
  //     une politique qui n'a pas d'issue décroissante. C'est éprouvé par
  //     `tools/poke-fusion.mjs`, qui refuse aussi tout champ NON DÉCLARÉ : le
  //     jour où `vide()` gagne une clé, le contrôle rougit tant que personne
  //     n'a dit ce qu'on en fait.
  //
  //  ⚠️ POURQUOI LES COMPTEURS SE PRENNENT AU MAXIMUM ET NON EN SOMME. La somme
  //     n'est pas idempotente : la synchronisation tourne à chaque ouverture, et
  //     `voyages = 5 + 3` deviendrait 8, puis 13, puis 21. Le maximum ne monte
  //     jamais tout seul et ne redescend jamais — c'est faux d'un poil (un
  //     joueur à 5 voyages sur un appareil et 3 sur l'autre en a fait 8) et
  //     c'est la seule forme qu'on peut appliquer mille fois sans dériver.
  //     Un compteur qui gonfle à chaque synchronisation serait pire qu'un
  //     compteur légèrement bas.
  // ═══════════════════════════════════════════════════════════════════════════

  var PC_MAX = 120;        // le même plafond que `progression.js`
  var HISTO_MAX = 30;      // les trente derniers jours de défi
  // ⚠️ LE TOTAL VIENT DU JEU DE RÈGLES : 151 à Kanto, 251 à Johto. Écrit ici,
  //    il aurait rejeté toute espèce au-delà de 151 à la fusion — un Pokédex
  //    de Johto qui perd la moitié de ses prises en remontant au nuage.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA COLLECTION APPARTIENT AU COMPTE, DONC ELLE SE BORNE SUR LE COMPTE
  //
  //  🔴 CETTE LIGNE DISAIT `dexTotal()` — le total du VOYAGE COURANT — et ce
  //     nettoyage est celui de la SYNCHRONISATION. Deux pertes en découlaient,
  //     toutes deux silencieuses et toutes deux définitives, puisque le serveur
  //     réécrit le fondu :
  //      · en repassant par Kanto, `dexTotal()` vaut 151 et **toute espèce de
  //        Johto disparaissait de la collection** ;
  //      · côté SERVEUR c'était pire encore : le noyau de rejeu ne charge pas
  //        Johto, donc `dexTotal()` y vaut 151 en toutes circonstances — chaque
  //        synchronisation aurait rayé la moitié du Pokédex d'un joueur, et la
  //        lecture suivante lui aurait rendu la version amputée.
  //  🔑 `dexTotalCompte()` est la porte écrite pour exactement ça : le monde le
  //     plus large, pas celui qu'on joue. Avec un seul monde ouvert, les deux
  //     rendent 151 et rien ne bouge.
  //  ⚠️ ET LE SERVEUR DOIT CHARGER JOHTO LE JOUR DE L'OUVERTURE, sans quoi
  //     `dexTotalCompte()` y vaut encore 151 : c'est `var JOHTO = "ouvert"`
  //     dans `js/poke/ordre.js`, et `tools/poke-collection-ne-perd-rien.mjs`
  //     le vérifie en montant les DEUX noyaux.
  // ═══════════════════════════════════════════════════════════════════════════
  var ESPECES = function () {
    if (!W.PokeRegles) return 151;
    return W.PokeRegles.dexTotalCompte ? W.PokeRegles.dexTotalCompte() : W.PokeRegles.dexTotal();
  };
  //  Les versions de TOUS les mondes : une prise de Johto porte « cristal ».
  var VERSIONS = function () {
    return (W.PokeRegles && W.PokeRegles.versionsToutes && W.PokeRegles.versionsToutes())
      || ["rouge", "bleu"];
  };
  //  ⚠️ UNE VERSION INCONNUE RETOMBE SUR LA PREMIÈRE, et pas sur « rouge »
  //     écrit en dur : le jour où un troisième monde arrive, le repli suit.
  var versionSure = function (v) {
    var l = VERSIONS();
    return l.indexOf(v) >= 0 ? v : l[0];
  };

  // ── LA POLITIQUE, CHAMP PAR CHAMP ─────────────────────────────────────────
  //  Elle est LUE par le contrôle : toute clé de `vide()` doit y figurer.
  //   union       objets n→vrai : on garde toutes les clés
  //   unionTot    objets n→fiche : on garde la fiche la PLUS ANCIENNE (la
  //               première prise est la vraie histoire, la seconde n'ajoute rien)
  //   maxPar      objets n→nombre : le plus grand par clé
  //   maxVD       objets id→{v,d} : le plus grand de chaque compteur
  //   parCle      tableaux d'individus : union par identité, jamais de doublon
  //   max         nombres : le plus grand
  //   local       ce qui n'appartient qu'à CET appareil, ou qui ne vaut que
  //               pour l'écran suivant — on n'y touche pas
  //   siVide      on prend l'autre seulement si l'on n'a rien
  //   duel        l'équipe scellée : celle du voyage mené le plus loin
  //   jour        l'essai du jour : la date la plus récente, et « fini » gagne
  //   histo       les trente derniers jours, unis par date
  var POLITIQUE = {
    v: "max",
    vus: "union",
    pris: "unionTot",
    boite: "parCle",
    pc: "parCle",
    voyages: "max",
    ligues: "max",
    badgesMax: "max",
    meilleurScore: "max",
    chromatiques: "unionTot",
    //  🔴 UN DIPLOME SE REUNIT, IL NE SE REMPLACE PAS. Un joueur qui a decroche
    //     celui de Kanto sur son telephone et celui de Johto sur son ordinateur
    //     doit garder LES DEUX -- prendre l'un des deux cotes en effacerait un,
    //     et un diplome perdu ne se regagne qu'en refaisant deux cents captures.
    diplomes: "unionTot",
    meilleurDV: "maxPar",
    regles: "union",
    // 🔴 UN ACQUIS EMPORTÉ NE SE FUSIONNE PAS : c'est une charge à usage unique
    //    (plafond à un). L'unir avec l'autre appareil doublerait un bonus que
    //    le voyage suivant consomme — on fabriquerait de la puissance à partir
    //    d'une synchronisation.
    gardes: "local",
    compagnon: "siVide",
    duel: "duel",
    rivaux: "parCle",
    defis: "maxVD",
    genre: "siVide",
    defiJour: "jour",
    defiHisto: "histo",
    chasses: "unionTot",
    sceauMax: "max",
    // Ne vaut que pour l'écran qui suit la clôture : il n'a rien à voyager.
    sceauNeuf: "local",
  };

  var estObjet = function (x) { return !!x && typeof x === "object" && !Array.isArray(x); };
  var nb = function (x) { return (typeof x === "number" && isFinite(x)) ? x : 0; };
  var quandDe = function (o) { return estObjet(o) && typeof o.quand === "number" ? o.quand : Infinity; };

  function unir(a, b) {
    var out = {}, k;
    for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k];
    for (k in b) if (Object.prototype.hasOwnProperty.call(b, k)) if (!(k in out)) out[k] = b[k];
    return out;
  }
  // La fiche la PLUS ANCIENNE gagne : c'est la première capture, celle que le
  // Pokédex raconte. Une fiche sans date ne peut pas évincer une fiche datée.
  function unirTot(a, b) {
    var out = {}, k;
    for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k];
    for (k in b) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) continue;
      if (!(k in out)) { out[k] = b[k]; continue; }
      if (quandDe(b[k]) < quandDe(out[k])) out[k] = b[k];
    }
    return out;
  }
  function maxPar(a, b) {
    var out = {}, k;
    for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = nb(a[k]);
    for (k in b) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) continue;
      out[k] = (k in out) ? Math.max(out[k], nb(b[k])) : nb(b[k]);
    }
    return out;
  }
  function maxVD(a, b) {
    var out = {}, k;
    for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = { v: nb(a[k] && a[k].v), d: nb(a[k] && a[k].d) };
    for (k in b) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) continue;
      var v = nb(b[k] && b[k].v), d = nb(b[k] && b[k].d);
      out[k] = (k in out) ? { v: Math.max(out[k].v, v), d: Math.max(out[k].d, d) } : { v: v, d: d };
    }
    return out;
  }
  //  🔴 L'IDENTITÉ D'UN INDIVIDU EST SA CLÉ, ET ELLE EXISTE DÉJÀ : `voyage#rang`
  //     (la graine du voyage plus le rang dans l'équipe). Sans elle, unir deux
  //     PC dupliquerait chaque Pokémon à chaque synchronisation. Une ligne sans
  //     clé retombe sur son espèce et son niveau — assez pour ne pas doubler.
  function cleDe(x) {
    if (!estObjet(x)) return null;
    if (x.cle) return String(x.cle);
    return "n" + nb(x.n) + "/" + nb(x.niveau) + "/" + (x.surnom || "");
  }
  function unirParCle(a, b, plafond) {
    var vus = {}, out = [];
    var pousser = function (t) {
      for (var i = 0; i < (t || []).length; i++) {
        var c = cleDe(t[i]);
        if (c == null || vus[c]) continue;
        vus[c] = 1; out.push(t[i]);
      }
    };
    pousser(Array.isArray(a) ? a : []);
    pousser(Array.isArray(b) ? b : []);
    // Les plus récents d'abord, puis on coupe — même règle que `rangerAuPc`.
    out.sort(function (x, y) { return quandDe(y) - quandDe(x); });
    if (plafond && out.length > plafond) out = out.slice(0, plafond);
    return out;
  }

  function fusionner(a, b) {
    var A = estObjet(a) ? a : {}, B = estObjet(b) ? b : {};
    var out = {};
    for (var champ in POLITIQUE) {
      if (!Object.prototype.hasOwnProperty.call(POLITIQUE, champ)) continue;
      var va = A[champ], vb = B[champ];
      switch (POLITIQUE[champ]) {
        case "union": out[champ] = unir(estObjet(va) ? va : {}, estObjet(vb) ? vb : {}); break;
        case "unionTot": out[champ] = unirTot(estObjet(va) ? va : {}, estObjet(vb) ? vb : {}); break;
        case "maxPar": out[champ] = maxPar(estObjet(va) ? va : {}, estObjet(vb) ? vb : {}); break;
        case "maxVD": out[champ] = maxVD(estObjet(va) ? va : {}, estObjet(vb) ? vb : {}); break;
        case "max": out[champ] = Math.max(nb(va), nb(vb)); break;
        case "parCle": out[champ] = unirParCle(va, vb, champ === "pc" ? PC_MAX : 0); break;
        case "local": out[champ] = va !== undefined ? va : vb; break;
        case "siVide": out[champ] = (va === null || va === undefined || va === "") ? vb : va; break;
        case "duel": {
          // Le souvenir du voyage mené le plus loin : c'est ce que l'équipe
          // scellée raconte, donc c'est le nombre de badges qui départage.
          var ba = estObjet(va) ? nb(va.badges) : -1, bb = estObjet(vb) ? nb(vb.badges) : -1;
          out[champ] = bb > ba ? vb : (va !== undefined ? va : vb);
          break;
        }
        case "jour": {
          //  🔴 « UN SEUL ESSAI PAR JOUR » DOIT SURVIVRE AU CHANGEMENT
          //     D'APPAREIL, sinon la synchronisation offrirait une seconde
          //     tentative. À date égale, l'essai TERMINÉ gagne ; sinon la date
          //     la plus récente.
          var da = estObjet(va) ? String(va.date || "") : "", db = estObjet(vb) ? String(vb.date || "") : "";
          if (db > da) out[champ] = vb;
          else if (da > db) out[champ] = va;
          else if (estObjet(vb) && vb.fini && !(estObjet(va) && va.fini)) out[champ] = vb;
          else out[champ] = va !== undefined ? va : vb;
          break;
        }
        case "histo": {
          var vusJ = {}, liste = [];
          var pousserH = function (t) {
            for (var i = 0; i < (t || []).length; i++) {
              var d = estObjet(t[i]) ? String(t[i].date || "") : "";
              if (!d || vusJ[d]) continue;
              vusJ[d] = 1; liste.push(t[i]);
            }
          };
          pousserH(Array.isArray(va) ? va : []);
          pousserH(Array.isArray(vb) ? vb : []);
          liste.sort(function (x, y) { return String(x.date) < String(y.date) ? -1 : 1; });
          out[champ] = liste.slice(-HISTO_MAX);
          break;
        }
        default: out[champ] = va !== undefined ? va : vb;
      }
    }
    //  ⚠️ CE QUI N'EST PAS DÉCLARÉ VOYAGE QUAND MÊME, en préférant le local.
    //     Perdre une clé inconnue serait une perte de données silencieuse ; le
    //     contrôle, lui, exige qu'on la déclare — c'est là qu'on force la main,
    //     pas en jetant la donnée d'un joueur.
    for (var k2 in A) if (Object.prototype.hasOwnProperty.call(A, k2) && !(k2 in out)) out[k2] = A[k2];
    for (var k3 in B) if (Object.prototype.hasOwnProperty.call(B, k3) && !(k3 in out)) out[k3] = B[k3];
    return out;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ASSAINIR — le paquet arrive du navigateur, il est hostile
  //
  //  🔴 CE QU'UN FAUX POKÉDEX PERMET, DIT FRANCHEMENT : le diplôme des 150 et
  //     la chasse à Mew, c'est-à-dire du contenu POUR SOI. Il ne touche NI le
  //     classement du jour (recalculé depuis le bilan, côté serveur) NI le PvP
  //     (`PokeDuel.valider` refuse six Mewtwo niveau 100). La garde est donc
  //     proportionnée : on borne les FORMES pour que rien n'explose et pour
  //     qu'un envoi forgé ne puisse pas gonfler la base, on ne prétend pas
  //     rendre la collection infalsifiable.
  //  🔴 ET ELLE TOURNE AVANT LA FUSION, côté serveur : fondre d'abord
  //     stockerait l'absurde pour toujours, puisque la fusion ne retire jamais.
  // ═══════════════════════════════════════════════════════════════════════════
  function assainir(p) {
    var src = estObjet(p) ? p : {};
    var out = {};
    var espece = function (k) { var n = Math.floor(Number(k)); return (n >= 1 && n <= ESPECES()) ? n : null; };
    var bornerObjet = function (o, valeur) {
      var r = {}, k;
      for (k in o) {
        if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
        var n = espece(k);
        if (n == null) continue;
        r[n] = valeur(o[k]);
      }
      return r;
    };
    var texte = function (s, max) { return s == null ? null : String(s).slice(0, max); };
    var entier = function (x, lo, hi) { return Math.max(lo, Math.min(hi, Math.floor(nb(x)))); };

    out.v = entier(src.v, 0, 99);
    out.vus = bornerObjet(estObjet(src.vus) ? src.vus : {}, function () { return true; });
    out.pris = bornerObjet(estObjet(src.pris) ? src.pris : {}, function (f) {
      f = estObjet(f) ? f : {};
      return { zone: texte(f.zone, 40), niveau: entier(f.niveau, 1, 100),
               version: versionSure(f.version), quand: entier(f.quand, 0, 4e12) };
    });
    out.chromatiques = bornerObjet(estObjet(src.chromatiques) ? src.chromatiques : {}, function (f) {
      f = estObjet(f) ? f : {};
      return { quand: entier(f.quand, 0, 4e12), version: versionSure(f.version) };
    });
    out.meilleurDV = bornerObjet(estObjet(src.meilleurDV) ? src.meilleurDV : {}, function (x) { return entier(x, 0, 60); });
    out.boite = (Array.isArray(src.boite) ? src.boite : []).slice(0, ESPECES()).map(function (l) {
      l = estObjet(l) ? l : {};
      return { n: entier(l.n, 1, ESPECES()), surnom: texte(l.surnom, 12), quand: entier(l.quand, 0, 4e12) };
    }).filter(function (l) { return l.n >= 1; });
    out.pc = (Array.isArray(src.pc) ? src.pc : []).slice(0, PC_MAX).map(function (m) {
      m = estObjet(m) ? m : {};
      return {
        cle: texte(m.cle, 60), n: entier(m.n, 1, ESPECES()), surnom: texte(m.surnom, 12),
        niveau: entier(m.niveau, 1, 100),
        dv: estObjet(m.dv) ? m.dv : null, statExp: estObjet(m.statExp) ? m.statExp : null,
        attaques: (Array.isArray(m.attaques) ? m.attaques : []).slice(0, 4).map(function (a) { return texte(a, 30); }),
        quand: entier(m.quand, 0, 4e12), badges: entier(m.badges, 0, 8),
      };
    }).filter(function (m) { return m.n >= 1; });
    out.voyages = entier(src.voyages, 0, 100000);
    out.ligues = entier(src.ligues, 0, 100000);
    out.badgesMax = entier(src.badgesMax, 0, 8);
    out.meilleurScore = entier(src.meilleurScore, 0, 100000);
    out.sceauMax = entier(src.sceauMax, 0, 8);
    out.regles = {};
    for (var r in (estObjet(src.regles) ? src.regles : {})) {
      if (Object.prototype.hasOwnProperty.call(src.regles, r) && src.regles[r]) out.regles[String(r).slice(0, 30)] = true;
    }
    out.chasses = {};
    var ch = estObjet(src.chasses) ? src.chasses : {};
    var nCh = 0;
    for (var c in ch) {
      if (!Object.prototype.hasOwnProperty.call(ch, c) || nCh++ >= 200) break;
      out.chasses[String(c).slice(0, 40)] = { quand: entier((estObjet(ch[c]) ? ch[c].quand : ch[c]), 0, 4e12) };
    }
    out.defis = {};
    var df = estObjet(src.defis) ? src.defis : {};
    var nDf = 0;
    for (var d in df) {
      if (!Object.prototype.hasOwnProperty.call(df, d) || nDf++ >= 200) break;
      out.defis[String(d).slice(0, 40)] = { v: entier(df[d] && df[d].v, 0, 100000), d: entier(df[d] && df[d].d, 0, 100000) };
    }
    out.rivaux = (Array.isArray(src.rivaux) ? src.rivaux : []).slice(0, 200).map(function (x) {
      x = estObjet(x) ? x : {};
      return { cle: texte(x.cle, 60), nom: texte(x.nom, 24), scelle: texte(x.scelle, 400),
               v: entier(x.v, 0, 100000), d: entier(x.d, 0, 100000), vu: entier(x.vu, 0, 4e12) };
    });
    out.duel = estObjet(src.duel)
      ? { scelle: texte(src.duel.scelle, 400), nom: texte(src.duel.nom, 24),
          badges: entier(src.duel.badges, 0, 8), quand: entier(src.duel.quand, 0, 4e12) }
      : null;
    out.genre = (src.genre === "f" || src.genre === "h") ? src.genre : null;
    out.compagnon = estObjet(src.compagnon) ? { n: entier(src.compagnon.n, 1, ESPECES()) } : null;
    out.defiJour = estObjet(src.defiJour)
      ? { date: texte(src.defiJour.date, 12), score: entier(src.defiJour.score, 0, 100000),
          badges: entier(src.defiJour.badges, 0, 8), fini: src.defiJour.fini == null ? null : !!src.defiJour.fini }
      : null;
    out.defiHisto = (Array.isArray(src.defiHisto) ? src.defiHisto : []).slice(-HISTO_MAX).map(function (h) {
      h = estObjet(h) ? h : {};
      return { date: texte(h.date, 12), score: h.score == null ? null : entier(h.score, 0, 100000),
               badges: entier(h.badges, 0, 8), fini: h.fini == null ? null : !!h.fini };
    }).filter(function (h) { return !!h.date; });
    //  ⚠️ `gardes` et `sceauNeuf` ne voyagent pas (politique « local ») : on ne
    //     les recopie pas ici non plus, pour ne rien stocker d'inutile.
    return out;
  }

  W.PokeFusion = {
    POLITIQUE: POLITIQUE,
    fusionner: fusionner,
    assainir: assainir,
    //  La borne du Pokédex, PAR LA PORTE. Elle vaut 151 tant que Johto dort et
    //  251 dès qu'il s'ouvre ; l'exposer évite qu'un contrôle la recopie en dur
    //  et devienne faux le jour de l'ouverture — ce qui est arrivé le 20/08.
    dexCompte: ESPECES,
    PC_MAX: PC_MAX,
    HISTO_MAX: HISTO_MAX,
  };
})(typeof window !== "undefined" ? window : globalThis);
