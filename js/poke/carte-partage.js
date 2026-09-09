(function (W, D) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a ses huit arènes et son Conseil 4, et une
  //    lecture directe aurait envoyé un dresseur de Johto affronter Pierre.
  var ARENES = function () { return (W.PokeRegles && W.PokeRegles.arenes()) || W.POKE_ARENES || []; };
  var CONSEIL = function () { return (W.PokeRegles && W.PokeRegles.conseil()) || W.POKE_CONSEIL || []; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA CARTE DE PARTAGE — LA FICHE DE LA VITRINE
  //
  //  🔴 UNE SEULE SOURCE. Elle lit `PokePartie.bilan()`, exactement comme
  //     l'écran de fin et la fiche de classement. Le mode ninja a laissé le
  //     bandeau et l'écran de fin diverger parce qu'ils lisaient deux calculs :
  //     le joueur voyait son Rinnegan toute la partie, et la fin ne le nommait
  //     nulle part.
  //
  //  🔴 ELLE PORTE UNE VIE DE DRESSEUR, PAS DES STATISTIQUES DE SPORT. Sur le
  //     mode Dragon Ball, la carte affichait « Coupes du Monde » et « Ballons
  //     d'Or » hérités du football. Ici : l'équipe, les badges, le Pokédex, les
  //     légendaires, le temps, la version, la règle de voyage.
  //
  //  ⚠️ AUCUN EMOJI dans le canvas. Sous Windows ils ne rendent pas, et le
  //     symbole ♀/♂ des Nidoran est le seul caractère à risque : on le teste au
  //     lieu de le supposer (voir `mesurable()`).
  // ═══════════════════════════════════════════════════════════════════════════

  var L = 1080, H = 1350;   // 4:5 — le format que les réseaux ne recadrent pas
  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  var LANG = function () { return W.POKE_LANG || "fr"; };

  var TXT = {
    titre: { fr: "VITRINE DES MAÎTRES", en: "HALL OF FAME" },
    badges: { fr: "BADGES", en: "BADGES" },
    pokedex: { fr: "POKÉDEX", en: "POKÉDEX" },
    jours: { fr: "ACTES", en: "ACTS" },
    score: { fr: "SCORE", en: "SCORE" },
    version: { fr: "VERSION", en: "VERSION" },
    regle: { fr: "RÈGLE", en: "RULE" },
    ligue: { fr: "LIGUE INDIGO REMPORTÉE", en: "INDIGO LEAGUE WON" },
    // 🔴 Sans ce mot et la date qui le suit, deux cartes échangées ne se
    //    comparent pas : un score ne veut dire quelque chose que sur LA MÊME
    //    carte, et c'est toute la promesse du défi quotidien.
    defi: { fr: "DÉFI DU JOUR", en: "DAILY CHALLENGE" },
    voyage: { fr: "VOYAGE", en: "RUN" },
    rVoyage: { fr: "Voyage", en: "Journey" },
    rNuzlocke: { fr: "Nuzlocke", en: "Nuzlocke" },
    rExpress: { fr: "Express", en: "Express" },
    sceau: { fr: "Sceau {n}", en: "Seal {n}" },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE PIED PORTAIT LE DOMAINE QUI VEND, SOUS DES SPRITES OFFICIELS.
    //     C'est la seule image du mode qui sorte d'ici : on la colle sur X, sur
    //     Discord, dans un fil. Elle montrait donc des créatures de Nintendo
    //     estampillées de l'adresse d'un site qui encaisse des paiements —
    //     c'est-à-dire le lien exact que personne n'a envie de fabriquer, et
    //     fabriqué par la surface la plus publique du jeu.
    //
    //     Ce qu'un fan game qui dure met à cet endroit, c'est l'inverse : qu'il
    //     n'est pas officiel, et à qui appartient ce qu'on regarde. Une carte
    //     qui le dit d'elle-même n'a pas besoin qu'on vienne le lui demander.
    //
    //  ⚠️ Une ligne, et elle tient dans les deux formats — mesuré, pas estimé :
    //     1080 px de large au format 4:5 et 1920 en paysage.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 EN ANGLAIS DANS LES DEUX FENTES, ET C'EST VOULU. Cette carte est la
    //    seule image qui sorte du jeu : elle se colle sur X, dans un salon, dans
    //    un fil. Sa mention n'est pas là pour le joueur qui la partage — elle est
    //    là pour qui la trouverait. « Les ayants droit ne parlent pas français. »
    pied: {
      fr: "UNOFFICIAL FAN GAME · © NINTENDO / CREATURES / GAME FREAK",
      en: "UNOFFICIAL FAN GAME · © NINTENDO / CREATURES / GAME FREAK",
    },
  };
  var T = function (c) { var e = TXT[c]; return e ? (e[LANG()] || e.fr) : ""; };

  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 LE SCEAU SE PARTAGE, PARCE QUE C'EST LUI QUI DONNE SA VALEUR AU RESTE.
  //     Trois badges au Sceau 6 et trois badges au Sceau 0 ne racontent pas la
  //     même histoire — et c'est justement l'histoire qu'on colle sur X. Sans
  //     lui, le palier le plus dur du mode serait la seule chose qu'on ne
  //     pourrait pas montrer.
  //  🔴 UNE SEULE FONCTION POUR LES TROIS FORMATS. Le paysage, le 9:16 et le
  //     résumé en texte affichaient déjà la règle par trois lignes jumelles :
  //     y greffer trois fois la même condition aurait garanti qu'elles
  //     divergent au premier réglage. C'est la loi du dossier.
  //  ⚠️ Vide au Sceau 0 — et vide au Défi du jour, qui est toujours au Sceau 0.
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 LA RÈGLE DU JOUR SE PARTAGE, SINON ELLE NE SE RACONTE PAS. Deux joueurs
  //    qui comparent « 1 480 » ne disent rien ; « 1 480 en Économie de guerre »
  //    se commente. C'est la moitié de l'intérêt d'une contrainte quotidienne.
  function ditRegleDuJour(partie) {
    if (!partie || !partie.compare || !W.PokeRegleDuJour) return "";
    var r = W.PokeRegleDuJour.de(partie.regleDuJour);
    return r ? "   ·   " + r.nom[LANG()] : "";
  }

  function sceauDit(b) {
    if (!b || !b.sceau) return "";
    // 🔴 PAR LA PORTE, PAS À LA MAIN. Ce `.replace("{n}", …)` était une
    //    seconde résolution de jeton, écrite ici seulement — exactement ce que
    //    `PokeGenre` existe pour empêcher. Deux résolutions divergent toujours,
    //    et celle qu'on ne teste pas est celle qui casse.
    return "   ·   " + W.PokeGenre.pour(TXT, "sceau", { n: b.sceau }, "carte");
  }

  // Les couleurs viennent de la feuille du mode : la carte ne réinvente pas la
  // palette, elle la LIT. Une carte qui dérive du jeu se voit tout de suite.
  function jeton(nom, repli) {
    try {
      var v = getComputedStyle(D.documentElement).getPropertyValue(nom).trim();
      return v || repli;
    } catch (e) { return repli; }
  }

  // 🔴 Un caractère qui ne rend pas laisse un carré blanc dans l'image, et on
  //    ne s'en aperçoit qu'une fois la carte partagée. On MESURE au lieu de
  //    supposer : si le glyphe n'a pas de largeur propre, on prend le repli.
  function mesurable(ctx, glyphe) {
    var a = ctx.measureText(glyphe).width;
    var b = ctx.measureText("￿").width;
    return a > 0 && Math.abs(a - b) > 0.5;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE NOM QUI S'AFFICHE VRAIMENT
  //
  //  🔴 `mesurable` A ÉTÉ ÉCRITE POUR ÇA ET N'A JAMAIS ÉTÉ APPELÉE. Le fichier
  //     l'explique en tête depuis le premier jour — « le symbole ♀/♂ des Nidoran
  //     est le seul caractère à risque : on le teste au lieu de le supposer » —
  //     et aucune ligne ne s'en servait. Deux espèces sur cent cinquante et une
  //     portent ce symbole dans leur nom ; sur une police qui ne le connaît pas,
  //     la carte partagée sort avec un carré blanc au milieu du nom.
  //     Trouvée le 08/08 quand le détecteur de portes mortes a enfin regardé ce
  //     fichier. Une garde écrite et jamais posée ne protège rien.
  // ═══════════════════════════════════════════════════════════════════════════
  function nomLisible(ctx, s) {
    var t = String(s == null ? "" : s);
    if (t.indexOf("♀") < 0 && t.indexOf("♂") < 0) return t;
    if (mesurable(ctx, "♀") && mesurable(ctx, "♂")) return t;
    return t.replace(/♀/g, " (f)").replace(/♂/g, " (m)");
  }

  function charger(src) {
    return new Promise(function (ok) {
      var im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { ok(null); };  // un sprite absent ne casse pas la carte
      im.src = src;
    });
  }

  function texte(ctx, s, x, y, opts) {
    var o = opts || {};
    ctx.font = (o.gras ? "700 " : "400 ") + (o.taille || 32) + "px " + (o.police || '"Segoe UI", sans-serif');
    ctx.fillStyle = o.couleur || "#16191f";
    ctx.textAlign = o.align || "left";
    if (o.espace) {
      // L'espacement des lettres n'existe pas dans le canvas : on le pose à la
      // main pour les titres, sinon ils ne ressemblent pas à ceux de l'écran.
      var lettres = String(s).split(""), total = 0, i;
      for (i = 0; i < lettres.length; i++) total += ctx.measureText(lettres[i]).width + o.espace;
      // 🔴 L'ALIGNEMENT À DROITE MANQUAIT. Ce chemin ne connaissait que `center`
      //    et le cas par défaut : un texte espacé demandé à droite partait donc
      //    VERS la droite depuis son point d'ancrage, et sortait de l'image.
      //    Vu sur la carte de dresseur — « roadtolegends.com » coupé au milieu.
      var cx = o.align === "center" ? x - total / 2
        : o.align === "right" ? x - total : x;
      ctx.textAlign = "left";
      for (i = 0; i < lettres.length; i++) {
        ctx.fillText(lettres[i], cx, y);
        cx += ctx.measureText(lettres[i]).width + o.espace;
      }
      return;
    }
    ctx.fillText(s, x, y);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA CARTE DE DRESSEUR
  //
  //  🔴 VERDICT DU PROPRIÉTAIRE : « la carte de fin est moche ». Il a raison, et
  //     la raison est de fond, pas de finition. C'était une AFFICHE DE TABLEAU :
  //     un cadre rouge, une feuille blanche, une grille de sprites légendés, et
  //     trois compteurs en bas. Rien qu'on ait envie de montrer.
  //
  //  🔴 CE QUE LES JOUEURS PARTAGENT, C'EST UNE CARTE DE DRESSEUR. C'est l'objet
  //     que la série a créé et que les fans reconnaissent au premier coup d'œil :
  //     un nom, un numéro, une RANGÉE DE BADGES, l'équipe en petit, quelques
  //     chiffres. Nos badges — le fait le plus dur du voyage — n'y figuraient
  //     même pas autrement qu'en « 4 / 8 ».
  //
  //  🔴 ET ELLE PREND LES COULEURS DU PLATEAU. La carte doit ressembler à l'écran
  //     d'où elle sort ; une image claire pour un jeu sombre se lit comme une
  //     capture d'un autre logiciel.
  // ═══════════════════════════════════════════════════════════════════════════
  var CARTE = { L: 1200, H: 675 };

  // Les huit badges, dans l'ordre du ROM. Le nom vient de `POKE_ARENES`.
  // ⚠️ LA PRÉSENCE D'UN BADGE NE SE LIT PAS DANS SON NOM. La version d'avant
  //    écrivait `pris[ordre] = badge.badge` puis testait `!!pris[o]` : un badge
  //    gagné dont le nom serait vide — une donnée régénérée, un ordre inconnu
  //    de `POKE_ARENES` — se serait affiché comme NON gagné, sur la carte qu'on
  //    partage. Un badge est acquis parce qu'il est dans la liste, pas parce
  //    qu'il porte une étiquette. On sépare donc les deux.
  function badgesDe(partie) {
    var pris = {};
    for (var i = 0; i < (partie.badges || []).length; i++) pris[partie.badges[i].ordre] = true;
    var out = [];
    for (var o = 1; o <= 8; o++) {
      var a = null;
      for (var k = 0; k < (ARENES() || []).length; k++) if (ARENES()[k].ordre === o) a = ARENES()[k];
      out.push({ ordre: o, nom: a ? W.PokeGenre.nomBadge(a) : "", pris: !!pris[o] });
    }
    return out;
  }

  // Les badges PRIS, nommés. Vide tant qu'on n'en a aucun : « BADGES 0 / 8 · »
  // avec rien derrière serait une ponctuation qui ne mène nulle part.
  function nomsBadges(bd) {
    var pris = bd.filter(function (x) { return x.pris && x.nom; })
      .map(function (x) { return x.nom; });
    return pris.length ? "   ·   " + pris.join(", ") : "";
  }

  function coinsArrondis(ctx, x, y, l, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + l, y, x + l, y + h, r);
    ctx.arcTo(x + l, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + l, y, r);
    ctx.closePath();
  }

  // Le dessin des sprites demande qu'ils soient CHARGÉS : on attend, sinon la
  // carte sort vide et personne ne comprend pourquoi.
  async function rendre(partie) {
    var b = W.PokePartie.bilan(partie);
    var L = CARTE.L, H = CARTE.H;
    var c = D.createElement("canvas");
    c.width = L; c.height = H;
    var ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;    // les sprites restent nets

    var FOND = "#0d1420", PANNEAU = "#182234", TRAIT = "#29344a";
    var ENCRE = "#eef3fb", PALE = "#9dabc2", SCEAU = "#c62a1f", OR = "#dda022";

    ctx.fillStyle = FOND; ctx.fillRect(0, 0, L, H);
    // Le bandeau rouge : la même signature que l'en-tête du jeu.
    ctx.fillStyle = SCEAU; ctx.fillRect(0, 0, L, 12);

    // ── L'identité ───────────────────────────────────────────────────────────
    texte(ctx, T("titre"), 56, 84, { taille: 26, align: "left", couleur: PALE, espace: 6 });
    texte(ctx, (partie.nom || "").toUpperCase(), 56, 148, { taille: 62, gras: true, align: "left", couleur: ENCRE });

    // ── CE QUE LA CARTE DIT DU VOYAGE ────────────────────────────────────────
    //  🔴 UNE CARTE DE DÉFI DOIT DIRE QU'ELLE EN EST UNE, ET DE QUEL JOUR. Sans
    //     la date, deux joueurs qui échangent leurs cartes ne comparent rien :
    //     un score de 187 ne veut dire quelque chose que rapporté à LA MÊME
    //     carte. C'est tout le sel d'un défi quotidien — et c'est aussi la seule
    //     façon de le partager tant que le classement est vide.
    //  🔴 ET LA RÈGLE DE VOYAGE DISPARAÎT ALORS : elle est verrouillée pour tout
    //     le monde. L'afficher laisserait croire à un choix qui n'existe pas.
    var ligneRegle = partie.compare
      ? T("defi") + "   ·   " + (partie.graine || "").replace(/^POKE-JOUR-/, "") + ditRegleDuJour(partie)
      : T("version") + " " + W.PokeGenre.version(b.version) + "   ·   " +
        T("r" + b.regle.charAt(0).toUpperCase() + b.regle.slice(1)) + sceauDit(b);
    texte(ctx, ligneRegle, 56, 186, { taille: 24, align: "left", couleur: partie.compare ? OR : PALE });

    if (b.ligue) {
      texte(ctx, T("ligue"), L - 56, 148, { taille: 30, gras: true, align: "right", couleur: OR, espace: 3 });
    }

    // ── LES BADGES, EN RANG ──────────────────────────────────────────────────
    // 🔴 Ils n'apparaissaient que comme « 4 / 8 ». Or c'est le fait le plus dur
    //    du voyage, et le seul que tout joueur de la série lit d'un coup d'œil.
    var bd = badgesDe(partie), bx = 56, by = 224, taille = 54, ecart = 14;
    for (var i = 0; i < bd.length; i++) {
      var x = bx + i * (taille + ecart);
      ctx.beginPath();
      ctx.arc(x + taille / 2, by + taille / 2, taille / 2, 0, Math.PI * 2);
      ctx.fillStyle = bd[i].pris ? OR : PANNEAU;
      ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = bd[i].pris ? OR : TRAIT; ctx.stroke();
      if (bd[i].pris) {
        texte(ctx, String(bd[i].ordre), x + taille / 2, by + taille / 2 + 9,
          { taille: 26, gras: true, align: "center", couleur: FOND });
      }
    }
    // 🔴 « 1 2 3 4 » NE DIT RIEN À QUI REÇOIT LA CARTE. Les pastilles se lisent
    //    d'un coup d'œil — cinq sur huit — mais elles ne nomment pas les arènes
    //    franchies, et c'est justement ce qu'on partage. Les noms viennent de
    //    `POKE_ARENES`, comme partout : Roche, Cascade, Foudre…
    texte(ctx, T("badges") + "   " + b.badges + " / 8" + nomsBadges(bd), bx, by + taille + 34,
      { taille: 22, align: "left", couleur: PALE, espace: 3 });

    // ── L'ÉQUIPE, SUR SON PANNEAU ────────────────────────────────────────────
    var py = 350, ph = 190;
    coinsArrondis(ctx, 56, py, L - 112, ph, 18);
    ctx.fillStyle = PANNEAU; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = TRAIT; ctx.stroke();

    var cases = 6, casel = (L - 112) / cases;
    for (var k = 0; k < cases; k++) {
      var m = b.equipe[k];
      var cx = 56 + k * casel;
      if (k) {
        ctx.beginPath(); ctx.moveTo(cx, py + 24); ctx.lineTo(cx, py + ph - 24);
        ctx.strokeStyle = TRAIT; ctx.lineWidth = 2; ctx.stroke();
      }
      if (!m) continue;
      var im = await charger(W.PokeSprites.face(m.n, "?i=6"));
      if (im) ctx.drawImage(im, cx + casel / 2 - 48, py + 18, 96, 96);
      var e = ESP()[m.n];
      texte(ctx, nomLisible(ctx, m.surnom || e.nom[LANG()]), cx + casel / 2, py + 142,
        { taille: 22, gras: true, align: "center", couleur: ENCRE });
      texte(ctx, W.PokeGenre.niveau(m.niveau), cx + casel / 2, py + 168,
        { taille: 20, align: "center", couleur: PALE });
    }

    // ── LE RELEVÉ ────────────────────────────────────────────────────────────
    var ry = 578;
    var releve = [
      [T("pokedex"), b.pris + " / " + b.atteignables],
      [T("jours"), b.acte + " / " + b.actes],
      [T("score"), String(b.score)],
    ];
    for (var j = 0; j < releve.length; j++) {
      var rx = 56 + j * ((L - 112) / 3);
      texte(ctx, releve[j][0], rx, ry, { taille: 20, align: "left", couleur: PALE, espace: 3 });
      texte(ctx, releve[j][1], rx, ry + 46, { taille: 42, gras: true, align: "left", couleur: ENCRE });
    }

    // ⚠️ L'ESPACEMENT PASSE DE 4 À 2, ET C'EST MESURÉ. Le pied dit maintenant
    //    la mention légale au lieu d'un nom de domaine : cinquante-neuf signes
    //    contre dix-sept. À 4, il rend 926 px pour 968 disponibles — il tient,
    //    mais quarante-deux pixels de marge ne survivent pas à une police de
    //    repli. À 2, il rend 808. La ligne est longue : elle se resserre.
    texte(ctx, T("pied"), L - 56, H - 34, { taille: 22, align: "right", couleur: PALE, espace: 2 });
    return c;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE FORMAT VERTICAL — CELUI QUE TIKTOK, REELS ET LES STORIES NE RECADRENT PAS
  //
  //  🔴 UNE CARTE PAYSAGE EST INUTILISABLE SUR LA MOITIÉ DES RÉSEAUX. 1200 × 675
  //     va très bien sur X, où l'aperçu est large ; posée dans une story ou sur
  //     TikTok, elle occupe un bandeau au milieu d'un écran noir. Personne ne
  //     partage ça. Le 9:16 est le seul format que ces trois-là affichent en
  //     plein — et c'est là que se partagent les jeux aujourd'hui.
  //
  //  🔴 ET UN 9:16 N'EST PAS UN PAYSAGE ÉTIRÉ. Un écran de téléphone se regarde
  //     une seconde, le pouce déjà en mouvement : il lui faut UNE image forte,
  //     pas six colonnes de chiffres. La carte verticale mène donc par la
  //     créature — la plus forte de l'équipe, en grand, sur la teinte de SON
  //     type — puis le nom, les badges, l'équipe, le score.
  //     ⚠️ La couleur reste réservée aux types : c'est la loi du mode, et elle
  //        donne ici exactement ce qu'il fallait — une carte qui change de
  //        couleur selon l'équipe qu'on a menée.
  // ═══════════════════════════════════════════════════════════════════════════
  var HAUT = { L: 1080, H: 1920 };

  function teinteDe(mon) {
    if (!mon) return null;
    var t = (ESP()[mon.n].types || [])[0];
    return t ? jeton("--type-" + t, null) : null;
  }

  // La créature qui mène la carte : la plus forte de l'équipe. À niveau égal, la
  // première — l'ordre de l'équipe est un choix du joueur, on le respecte.
  function tete(equipe) {
    var meilleur = null;
    for (var i = 0; i < equipe.length; i++) {
      if (!equipe[i]) continue;
      if (!meilleur || equipe[i].niveau > meilleur.niveau) meilleur = equipe[i];
    }
    return meilleur;
  }

  async function rendreHaut(partie) {
    var b = W.PokePartie.bilan(partie);
    var L = HAUT.L, H = HAUT.H;
    var c = D.createElement("canvas");
    c.width = L; c.height = H;
    var ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    var FOND = "#0d1420", PANNEAU = "#182234", TRAIT = "#29344a";
    var ENCRE = "#eef3fb", PALE = "#9dabc2", SCEAU = "#c62a1f", OR = "#dda022";

    ctx.fillStyle = FOND; ctx.fillRect(0, 0, L, H);

    // ── LA LUEUR DU TYPE ─────────────────────────────────────────────────────
    //  Elle NOMME quelque chose : le type de la créature de tête. Sans elle, la
    //  carte serait la même pour tout le monde, et une carte que rien ne
    //  distingue ne se partage pas.
    //  🔴 CENTRÉE SUR LA CRÉATURE, pas sur le tiers haut. Ma première version la
    //     posait à 700 px avec un tiers d'opacité : sur un type sombre elle ne
    //     se voyait pas du tout, et sur un type clair elle flottait à côté du
    //     sujet. Elle part maintenant de derrière lui.
    var chef = tete(b.equipe);
    var teinte = teinteDe(chef);
    if (teinte) {
      var lueur = ctx.createRadialGradient(L / 2, 760, 30, L / 2, 760, 620);
      lueur.addColorStop(0, teinte);
      lueur.addColorStop(0.55, teinte);
      lueur.addColorStop(1, FOND);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = lueur;
      ctx.fillRect(0, 200, L, 1120);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = SCEAU; ctx.fillRect(0, 0, L, 16);

    // ── L'EN-TÊTE : de quel voyage on parle ──────────────────────────────────
    var entete = partie.compare
      ? T("defi") + "   " + (partie.graine || "").replace(/^POKE-JOUR-/, "") + ditRegleDuJour(partie)
      : T("voyage") + "   " + W.PokeGenre.version(b.version) + "  ·  " +
        T("r" + b.regle.charAt(0).toUpperCase() + b.regle.slice(1)) + sceauDit(b);
    texte(ctx, entete, L / 2, 110, {
      taille: 34, gras: true, align: "center", espace: 6,
      couleur: partie.compare ? OR : PALE,
    });

    // ── LA CRÉATURE DE TÊTE, EN GRAND ────────────────────────────────────────
    //  🔴 L'ARTWORK, PAS LE SPRITE DE 56 PIXELS. Étiré à 560, le sprite de combat
    //     donne dix pixels par pixel : c'est du pixel art assumé sur la carte de
    //     56 px de l'équipe, c'est de la bouillie en héros de story. L'artwork
    //     officiel existe pour les 151 espèces — l'écran de départ s'en sert
    //     déjà. Le sprite reste le repli, comme là-bas.
    //  ⚠️ `imageSmoothingEnabled` est coupé pour les sprites : on le rallume le
    //     temps de l'artwork, sinon il sort crénelé.
    if (chef) {
      var eChef = ESP()[chef.n];
      var grand = await charger("assets/img/poke/art/" + chef.n + ".webp");
      if (grand) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(grand, L / 2 - 300, 440, 600, 600);
        ctx.imageSmoothingEnabled = false;
      } else {
        var repli = await charger(W.PokeSprites.face(chef.n, "?i=6"));
        if (repli) ctx.drawImage(repli, L / 2 - 280, 460, 560, 560);
      }
      texte(ctx, nomLisible(ctx, eChef.nom[LANG()] || "").toUpperCase(), L / 2, 1110,
        { taille: 60, gras: true, align: "center", couleur: ENCRE, espace: 4 });
      texte(ctx, W.PokeGenre.niveau(chef.niveau), L / 2, 1164,
        { taille: 34, align: "center", couleur: PALE });
    }

    // ── LE DRESSEUR ──────────────────────────────────────────────────────────
    texte(ctx, (partie.nom || "").toUpperCase(), L / 2, 300,
      { taille: 92, gras: true, align: "center", couleur: ENCRE });
    if (b.ligue) {
      texte(ctx, T("ligue"), L / 2, 356,
        { taille: 30, gras: true, align: "center", couleur: OR, espace: 4 });
    }

    // ── LES BADGES ───────────────────────────────────────────────────────────
    var bd = badgesDe(partie), taille = 84, ecart = 20;
    var large = bd.length * taille + (bd.length - 1) * ecart;
    var bx = (L - large) / 2, by = 1220;
    for (var i = 0; i < bd.length; i++) {
      var x = bx + i * (taille + ecart);
      ctx.beginPath();
      ctx.arc(x + taille / 2, by + taille / 2, taille / 2, 0, Math.PI * 2);
      ctx.fillStyle = bd[i].pris ? OR : PANNEAU;
      ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = bd[i].pris ? OR : TRAIT; ctx.stroke();
      if (bd[i].pris) {
        texte(ctx, String(bd[i].ordre), x + taille / 2, by + taille / 2 + 14,
          { taille: 40, gras: true, align: "center", couleur: FOND });
      }
    }

    // Les noms des arènes franchies, sous les pastilles : elles disent combien,
    // pas lesquelles — et c'est « lesquelles » qu'on lit sur la carte d'un autre.
    texte(ctx, nomsBadges(bd).replace(/^\s*·\s*/, ""), L / 2, by + taille + 46,
      { taille: 26, align: "center", couleur: PALE, espace: 2 });

    // ── L'ÉQUIPE, DEUX RANGÉES DE TROIS ──────────────────────────────────────
    //  🔴 LE BAS DE L'IMAGE EST MANGÉ PAR L'INTERFACE. Sur TikTok, la légende,
    //     le nom du compte et la colonne de boutons couvrent les derniers 15 %
    //     de l'écran ; sur une story Instagram, le champ de réponse fait pareil.
    //     Rien de lisible ne descend donc sous 1 800 px sur 1 920, et le pied de
    //     page accepte d'y être à moitié caché — c'est une signature, pas une
    //     information.
    var py = 1390, ph = 300;
    coinsArrondis(ctx, 60, py, L - 120, ph, 26);
    ctx.fillStyle = PANNEAU; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = TRAIT; ctx.stroke();
    for (var k = 0; k < 6; k++) {
      var m = b.equipe[k];
      if (!m) continue;
      var col = k % 3, lig = Math.floor(k / 3);
      var cxk = 60 + (L - 120) / 6 + col * ((L - 120) / 3);
      var cyk = py + 22 + lig * 150;
      var im = await charger(W.PokeSprites.face(m.n, "?i=6"));
      if (im) ctx.drawImage(im, cxk - 56, cyk, 112, 112);
      texte(ctx, W.PokeGenre.niveau(m.niveau), cxk, cyk + 136,
        { taille: 24, align: "center", couleur: PALE });
    }

    // ── LE RELEVÉ, EN GRAND ──────────────────────────────────────────────────
    var ry = 1740;
    var releve = [
      [T("score"), String(b.score)],
      [T("badges"), b.badges + " / 8"],
      [T("pokedex"), b.pris + " / " + b.atteignables],
    ];
    for (var j = 0; j < releve.length; j++) {
      var rx = 60 + (L - 120) / 6 + j * ((L - 120) / 3);
      texte(ctx, releve[j][0], rx, ry, { taille: 26, align: "center", couleur: PALE, espace: 4 });
      texte(ctx, releve[j][1], rx, ry + 64, { taille: 60, gras: true, align: "center", couleur: ENCRE });
    }

    // 🔴 ET ICI LA MENTION SORTAIT DE L'IMAGE, DES DEUX CÔTÉS. À 28 px et 6 de
    //    chasse, elle rend 1233 px sur une carte large de 1080 : « FAN » et
    //    « FREAK » étaient rognés. Le domaine qu'elle remplace faisait dix-sept
    //    signes, elle en fait cinquante-neuf — la même pose ne pouvait pas
    //    tenir, et une mention coupée ne vaut pas mieux qu'une mention absente.
    //  ⚠️ J'AI D'ABORD MESURÉ CONTRE 1920. Ce format est 1080 × 1920 : haut,
    //     pas large. Un nombre juste posé contre la mauvaise largeur reste un
    //     nombre faux, et seule l'image rendue l'a montré.
    texte(ctx, T("pied"), L / 2, H - 44, { taille: 24, align: "center", couleur: PALE, espace: 2 });
    return c;
  }

  // La porte unique des deux formats. 🔴 Un appelant qui choisirait lui-même
  //    entre deux fonctions finirait par n'en câbler qu'une.
  function rendreFormat(partie, format) {
    return format === "haut" ? rendreHaut(partie) : rendre(partie);
  }

  // 🔴 LE RENDU PASSE PAR LES DEUX PORTES, TOUJOURS : l'image téléchargée ET
  //    l'aperçu à l'écran. Sur les autres modes, l'une des deux a dérivé et le
  //    joueur partageait une carte différente de celle qu'il voyait.
  async function apercu(hote, partie, format) {
    var c = await rendreFormat(partie, format);
    c.className = "pkdx-carte" + (format === "haut" ? " est-haute" : "");
    hote.innerHTML = "";
    hote.appendChild(c);
    return c;
  }

  async function telecharger(partie, format) {
    var c = await rendreFormat(partie, format);
    var a = D.createElement("a");
    a.download = "vitrine-" + (partie.nom || "dresseur").toLowerCase() +
      (format === "haut" ? "-story" : "") + ".png";
    a.href = c.toDataURL("image/png");
    a.click();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE RÉSUMÉ EN TEXTE — CE QUI SE COLLE VRAIMENT DANS UN MESSAGE
  //
  //  🔴 UNE IMAGE NE SE PARTAGE PAS D'UN GESTE. Il faut la télécharger, la
  //     retrouver, la joindre. Quatre gestes pour dire un résultat — et personne
  //     ne les fait. Les jeux quotidiens qui ont pris se partagent en TEXTE :
  //     on copie, on colle, c'est lu. La carte reste pour qui veut l'image ;
  //     le texte est pour tous les autres.
  //
  //  🔴 IL NE DIT RIEN QUE L'ÉCRAN NE DISE DÉJÀ. Pas de score secret, pas de
  //     donnée que le joueur n'ait pas sous les yeux : c'est la même règle que
  //     pour la carte, et c'est ce qui permet de le vérifier d'un coup d'œil.
  // ═══════════════════════════════════════════════════════════════════════════
  function resume(partie) {
    var b = W.PokePartie.bilan(partie);
    var bd = badgesDe(partie);
    var rang = "";
    for (var i = 0; i < bd.length; i++) rang += bd[i].pris ? "●" : "○";

    // 🔴 PAS « VITRINE DES MAÎTRES » EN TÊTE. Ce titre appartient à l'écran de
    //    fin, où il annonce la Ligue remportée ; en tête d'un résumé partagé
    //    par quelqu'un qui s'est arrêté à l'acte 6, il affirme une chose fausse.
    //    L'en-tête dit ce que le voyage ÉTAIT, pas ce qu'on aurait voulu.
    var entete = partie.compare
      ? T("defi") + " " + (partie.graine || "").replace(/^POKE-JOUR-/, "") + ditRegleDuJour(partie)
      : T("voyage") + " — " + W.PokeGenre.version(b.version) + " · " +
        T("r" + b.regle.charAt(0).toUpperCase() + b.regle.slice(1)) + sceauDit(b);

    return [
      entete,
      rang + "  " + T("score") + " " + b.score,
      T("jours") + " " + b.acte + "/" + b.actes + " · " + T("pokedex") + " " + b.pris + "/" + b.atteignables,
      T("pied"),
    ].join("\n");
  }

  // 🔴 UNE SEULE PORTE POUR LE PRESSE-PAPIER. L'écran de duel en avait sa
  //    propre copie ; deux implémentations d'un même geste finissent par ne
  //    plus se comporter pareil — et celle qu'on ne teste pas est celle qui
  //    casse. Les deux voies restent nécessaires : le presse-papier moderne
  //    exige un contexte sécurisé, l'ancienne commande disparaît peu à peu.
  function copier(texte, champ) {
    var ok = false;
    if (champ) {
      champ.focus();
      champ.select();
      try { ok = D.execCommand("copy"); } catch (e) { ok = false; }
    }
    if (!ok && W.navigator && W.navigator.clipboard) {
      try { W.navigator.clipboard.writeText(texte); ok = true; } catch (e2) { ok = false; }
    }
    return ok;
  }

  W.PokeCarte = {
    rendre: rendre, rendreHaut: rendreHaut, apercu: apercu, telecharger: telecharger,
    mesurable: mesurable, resume: resume, copier: copier, L: L, H: H, HAUT: HAUT,
  };
})(window, document);
