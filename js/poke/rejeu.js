(function (W) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a ses huit arènes et son Conseil 4, et une
  //    lecture directe aurait envoyé un dresseur de Johto affronter Pierre.
  var ARENES = function () { return (W.PokeRegles && W.PokeRegles.arenes()) || W.POKE_ARENES || []; };
  var CONSEIL = function () { return (W.PokeRegles && W.PokeRegles.conseil()) || W.POKE_CONSEIL || []; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE REJEU DU DÉFI DU JOUR — CE QUE LE SERVEUR VÉRIFIE AVANT DE CLASSER
  //
  //  🔴 POURQUOI CE FICHIER EXISTE. Jusqu'au 14/08 le mode LISAIT le classement
  //     et ne soumettait rien : l'écran affichait « le mode n'est pas encore
  //     ouvert », et il n'aurait jamais pu se remplir. La porte du serveur
  //     (`POST /api/daily`) exige `ENGINES[sport].replayDaily(...)` — le mode
  //     Pokémon ne l'avait pas.
  //
  //  🔴 ET ON NE REJOUE PAS LE VOYAGE. Le mode ninja transporte un journal de
  //     choix et rejoue la vie entière ; ici il faudrait neuf actes et soixante-
  //     dix combats, tour par tour, dans huit mille caractères. Ce n'est pas
  //     seulement gros : c'est la mécanique qui produit un quart de refus chez
  //     des joueurs honnêtes depuis une semaine, à la moindre divergence de
  //     tirage entre client et serveur.
  //
  //  🔑 CE N'EST PAS NÉCESSAIRE, ET LA RAISON EST DANS LE BARÈME. `score()` ne
  //     dépend que de HUIT nombres — badges, Ligue, vus, pris, légendaires,
  //     niveaux d'équipe, acte, et les multiplicateurs. Tous tiennent dans le
  //     bilan. Le serveur RECALCULE donc le score au lieu de le croire : un
  //     joueur ne peut plus annoncer un score, seulement un RÉSUMÉ — et le
  //     résumé, lui, se borne par les lois du mode.
  //     *On ne vérifie pas le chemin, on vérifie que l'arrivée est atteignable.*
  //
  //  CE QUE ÇA TIENT, ET CE QUE ÇA NE TIENT PAS — dit franchement :
  //   ✅ un score inventé (le barème est recalculé côté serveur) ;
  //   ✅ un résumé impossible : plus de 8 badges, plus de 6 Pokémon, un acte
  //      au-delà de 9, une Ligue sans les huit badges, des prises supérieures
  //      aux espèces vues, une équipe au-dessus du plafond de niveau de l'acte ;
  //   ✅ le multiplicateur de règle et celui de sceau, tous deux NEUTRALISÉS
  //      pour le défi (voir plus bas) : personne ne peut se donner ×1,8 ;
  //   ❌ un résumé PLAUSIBLE mais non joué. Il faudrait le rejeu complet.
  //      Les gardes de la porte serveur restent les seules à s'y opposer :
  //      appareil signé, jeton de départ, quinze secondes minimum, un essai par
  //      jour et par appareil, trois refus et l'on se tait.
  //
  //  ⚠️ CE FICHIER EST DANS LE NOYAU : aucun texte d'interface, aucun DOM.
  // ═══════════════════════════════════════════════════════════════════════════

  //  🔴 LE DÉFI COMPARE DES VOYAGES, DONC IL NEUTRALISE CE QUI N'EST PAS DANS LE
  //     VOYAGE. La règle est déjà verrouillée sur « voyage » au départ
  //     (`ui.js`, `lancer`) — mais le SCEAU, lui, vient du COMPTE, et il
  //     multiplie le score jusqu'à ×1,8. Deux joueurs qui jouent la même graine
  //     avec le même talent ne se départageraient plus sur le voyage mais sur
  //     leur ancienneté, et le serveur n'a aucun moyen de vérifier un palier
  //     rangé dans un navigateur. On le met donc à zéro pour tout le monde :
  //     « même départ pour tous » est la promesse écrite sur l'écran.
  function normaliserDefi(b) {
    b.regle = "voyage";
    b.sceau = 0;
    return b;
  }

  var LIMITES = {
    badges: 8,
    acte: 9,
    equipe: 6,
    niveau: 100,
    especes: 151,
    legendaires: 5,
  };

  var borne = function (v, min, max) {
    var n = Math.floor(Number(v));
    if (!isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  };

  // 🔴 LE PLAFOND DE NIVEAU EST LA BORNE QUI TIENT VRAIMENT. Une équipe de six
  //    niveau 100 rendrait 1 200 points à elle seule ; le jeu, lui, coiffe les
  //    montées au niveau du Champion de l'acte plus une marge (`plafondDe`).
  // ⚠️ ON EST GÉNÉREUX, ET C'EST VOULU : plusieurs serments relèvent ce plafond
  //    en cours de voyage, et le serveur ne sait pas lesquels ont été jurés.
  //    Une borne trop serrée refuserait des joueurs honnêtes — la faute la plus
  //    chère du dossier. On borne l'ABSURDE, pas l'inhabituel.
  var MARGE_SERMENTS = 20;
  function plafondNiveau(acte) {
    var A = W.PokeActes, arenes = ARENES();
    if (!A || !A.plafondDe || !arenes) return LIMITES.niveau;
    var haut = 0;
    for (var n = 1; n <= Math.min(acte, 8); n++) {
      haut = Math.max(haut, A.plafondDe(n, arenes, 0, false) || 0);
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  L'ACTE 9 — LA BORNE RESTE LARGE, MAIS PLUS POUR LA MÊME RAISON
    //
    //  🔴 CE QUI ÉTAIT ÉCRIT ICI LE 16/08 AU MATIN : « l'acte 9 n'a aucun
    //     plafond DANS LE JEU », `plafondDe(9, …)` rendant zéro faute de
    //     Champion au dernier acte. C'était vrai, et c'était le DÉFAUT, pas la
    //     règle : le même jour, un joueur signalait être monté de 70 à 100 en
    //     quelques combats et avoir balayé la Ligue. `plafondDe` borne
    //     désormais le dernier acte comme les huit autres.
    //  ⚠️ ON NE RESSERRE PAS CETTE BORNE-CI POUR AUTANT, et c'est délibéré.
    //     Elle sert à refuser l'ABSURDE, pas à rejouer l'équilibrage : un
    //     joueur d'avant le correctif a des bilans à 100 parfaitement honnêtes,
    //     et les resserrer les raboterait rétroactivement — la faute la plus
    //     chère du dossier, commise ici même il y a quelques heures.
    //     Les actes 1 à 8 gardent leur plafond calculé ; c'est là que la borne
    //     discrimine vraiment.
    // ═══════════════════════════════════════════════════════════════════════
    if (acte >= 9) return LIMITES.niveau;
    if (!haut) return LIMITES.niveau;
    return Math.min(LIMITES.niveau, haut + MARGE_SERMENTS);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE LA GRAINE DU JOUR PERMET — la seule borne qui parle DU JOUR
  //
  //  🔴 LE BANC DU 14/08 A MONTRÉ LE TROU. Un résumé impossible, ramené par les
  //     bornes au maximum du mode, se classe PREMIER avec un score cohérent :
  //     4 574 points, une « partie parfaite » que personne n'a jouée. Borner
  //     l'absurde ne suffit pas quand l'absurde a un plafond atteignable.
  //  🔑 LA GRAINE DIT LA VERSION, ET LA VERSION DIT COMBIEN D'ESPÈCES SONT
  //     PRENABLES. Elle est tirée AVANT tout le reste (`partie.js`, `creer` :
  //     `var version = h.brut() < 0.5`), donc le serveur la retrouve d'un seul
  //     tirage sur la graine du jour, sans rejouer quoi que ce soit. Un joueur
  //     qui annonce 151 prises un jour « rouge » annonce ce que le jeu ne
  //     distribue pas.
  //  ⚠️ ET ÇA NE FERME PAS TOUT, IL FAUT LE DIRE. Un résumé PLAUSIBLE mais non
  //     joué reste hors de portée de cette vérification : il faudrait le rejeu
  //     complet du voyage, c'est-à-dire l'architecture du mode ninja. Les
  //     gardes de la porte serveur (appareil signé, jeton de départ, quinze
  //     secondes, un essai par jour) restent les seules à s'y opposer.
  // ═══════════════════════════════════════════════════════════════════════════
  function prisesMaxDuJour(date) {
    var P = W.PokePartie, H = W.PokeHasard;
    if (!P || !P.atteignables || !H) return LIMITES.especes;
    try {
      var h = new H("POKE-JOUR-" + String(date));
      var version = h.brut() < 0.5 ? "rouge" : "bleu";
      var n = P.atteignables(version);
      return (typeof n === "number" && n > 0) ? n : LIMITES.especes;
    } catch (e) { return LIMITES.especes; }
  }

  //  Quels légendaires les actes 1..n portent. 🔴 LU DANS `PokeActes`, JAMAIS
  //  RECOPIÉ : une liste écrite ici divergerait le jour où un légendaire change
  //  d'étape, et une borne qui a divergé laisse passer exactement ce qu'elle
  //  était censée arrêter. L'épilogue du dernier acte compte (Mewtwo).
  //  ⚠️ Rend `null` si la carte n'est pas chargée — sans elle on ne SAIT pas,
  //     et on ne raye pas une prise sur une ignorance.
  //  🔴 ON NE GARDE PAS UNE LISTE DE CE QUI EST PERMIS, ON RAYE CE QUI EST
  //     PROUVÉ TROP TÔT. La première version faisait l'inverse — une liste
  //     blanche des légendaires posés sur une étape — et le contrôle de non
  //     régression l'a prise en défaut avant la livraison : **RONFLEX (143)
  //     n'est posé sur aucune étape `legendaire`**, il dort sur une scène. Huit
  //     joueurs réels l'avaient pris et perdaient 80 points chacun, c'est-à-dire
  //     qu'ils auraient été refusés en `score_mismatch` à leur prochaine partie.
  //  🔑 LE DÉFAUT D'UNE BORNE DOIT ÊTRE « JE NE SAIS PAS, DONC JE LAISSE ».
  //     On ne raye que ce dont on peut nommer l'acte, et seulement s'il est
  //     postérieur. Ce qu'on ne sait pas situer passe — c'est ce qui empêche une
  //     borne de punir un joueur pour une lacune de la carte.
  function acteDuLegendaire() {
    var A = W.PokeActes;
    if (_acteLeg) return _acteLeg;
    if (!A || !A.acteDe || !A.nombre) return null;
    var m = {};
    for (var n = 1; n <= A.nombre(); n++) {
      var a = A.acteDe(n);
      if (!a) continue;
      var l = (a.legendaires || []).slice(), i;
      if (a.epilogue && a.epilogue.legendaires) l = l.concat(a.epilogue.legendaires);
      for (i = 0; i < l.length; i++) {
        var e = l[i].legendaire;
        if (m[e] == null || n < m[e]) m[e] = n;
      }
    }
    _acteLeg = m;
    return m;
  }
  var _acteLeg = null;

  // ── Le résumé, ramené dans les lois du mode ────────────────────────────────
  //  On CORRIGE au lieu de refuser : un résumé hors-la-loi rend alors un score
  //  plus bas que celui annoncé, et la porte serveur le rejette en
  //  `score_mismatch` avec le journal gardé pour autopsie. Refuser ici
  //  perdrait l'information.
  function normaliser(b, date) {
    var out = normaliserDefi({});
    out.acte = borne(b.acte, 1, LIMITES.acte);
    out.badges = borne(b.badges, 0, LIMITES.badges);
    // On ne gagne pas un badge dans un acte qu'on n'a pas franchi.
    out.badges = Math.min(out.badges, Math.max(0, out.acte - 1));
    // La Ligue ne se gagne qu'au bout : huit badges et le dernier acte.
    out.ligue = !!b.ligue && out.badges === LIMITES.badges && out.acte === LIMITES.acte;
    // ═══════════════════════════════════════════════════════════════════════
    //  ON NE CROISE PAS TOUT KANTO AU TROISIÈME ACTE (16/08)
    //
    //  🔴 SECONDE MOITIÉ DU FAUX DE « Plagiat » : le résumé annonçait **151
    //     espèces croisées et 139 prises à l'acte 3**. Les bornes d'alors ne
    //     regardaient que les maximums absolus du mode — 151 et le compte du
    //     jour — donc les deux passaient sans un mot. Privé de ses cinq
    //     légendaires, le même faux valait encore 2 896 points, c'est-à-dire la
    //     première place.
    //  ✅ LA BORNE SUIT L'ACTE, ET ELLE EST LARGE À DESSEIN. Relevé sur les
    //     vrais voyages joués : acte 1 → 15 croisées au plus, acte 3 → 28,
    //     acte 4 → 33, acte 9 → 93 (pour 139 atteignables). La borne posée ici
    //     laisse plus du DOUBLE de ce que le meilleur joueur a fait, et n'atteint
    //     son maximum qu'au dernier acte :
    //         acte 1 → 38 · acte 3 → 63 · acte 4 → 76 · acte 9 → 139
    //  ⚠️ GÉNÉREUSE PARCE QUE SE TROMPER COÛTE CHER DANS CE SENS-LÀ. Une borne
    //     trop serrée fait retomber le score sous celui annoncé, et la porte
    //     serveur rejette alors un joueur HONNÊTE en `score_mismatch` — c'est la
    //     faute la plus chère du dossier, et elle a déjà été commise ici. On
    //     ferme l'absurde, pas l'inhabituel.
    // ═══════════════════════════════════════════════════════════════════════
    var plafondEspeces = Math.min(
      prisesMaxDuJour(date),
      Math.ceil((prisesMaxDuJour(date) * (out.acte + 2)) / (LIMITES.acte + 2))
    );
    out.vus = Math.min(borne(b.vus, 0, LIMITES.especes), plafondEspeces);
    // On ne capture ni ce qu'on n'a pas vu, ni ce que la version du jour ne
    // distribue pas.
    out.pris = Math.min(borne(b.pris, 0, prisesMaxDuJour(date)), out.vus, plafondEspeces);
    // ═══════════════════════════════════════════════════════════════════════
    //  ON N'ANNONCE PAS UN LÉGENDAIRE QU'AUCUN ACTE TRAVERSÉ NE PORTE (16/08)
    //
    //  🔴 EXPLOITÉ, PAS SUPPOSÉ. Le 16/08 au soir, douze soumissions au pseudo
    //     « Plagiat » ont pris les douze premières places du jour avec un même
    //     résumé, renvoyé depuis douze appareils neufs. Le résumé disait :
    //     **acte 3, deux badges, 151 espèces croisées, 139 prises, LES CINQ
    //     LÉGENDAIRES, six Pokémon niveau 63.** Rien de tout ça n'existe à
    //     l'acte 3, et pourtant les bornes le laissaient passer : chaque
    //     nombre pris SÉPARÉMENT tenait dans son maximum.
    //  🔑 UNE BORNE PAR CHAMP NE FAIT PAS UNE BORNE : ce sont les
    //     INCOMPATIBILITÉS ENTRE CHAMPS qui trahissent un faux. La progression
    //     est déjà décrite quelque part — les légendaires vivent sur des étapes,
    //     les étapes appartiennent à des actes — donc on la LIT au lieu de la
    //     recopier. Artikodin est à l'acte 7, Électhor au 8, Sulfura au 9,
    //     Mewtwo dans l'épilogue : avant l'acte 7, la liste est forcément VIDE.
    //  ⚠️ ON CORRIGE, ON NE REFUSE PAS — comme tout ce qui précède : le score
    //     recalculé tombe alors sous celui annoncé, et la porte serveur rejette
    //     en `score_mismatch` en gardant le journal pour autopsie.
    // ═══════════════════════════════════════════════════════════════════════
    var quandLeg = acteDuLegendaire();
    var leg = Array.isArray(b.legendaires) ? b.legendaires : [];
    var vusLeg = {};
    out.legendaires = [];
    for (var i = 0; i < leg.length && out.legendaires.length < LIMITES.legendaires; i++) {
      var n = Math.floor(Number(leg[i]));
      if (!isFinite(n) || vusLeg[n]) continue;
      // On ne raye QUE si l'on sait situer ce légendaire et qu'il est plus loin
      // que l'acte atteint. Un inconnu passe : voir l'en-tête d'`acteDuLegendaire`.
      if (quandLeg && quandLeg[n] != null && quandLeg[n] > out.acte) continue;
      vusLeg[n] = 1;
      out.legendaires.push(n);
    }
    var cap = plafondNiveau(out.acte);
    var eq = Array.isArray(b.equipe) ? b.equipe.slice(0, LIMITES.equipe) : [];
    out.equipe = eq.map(function (m) {
      return { niveau: borne(m && m.niveau, 1, cap) };
    });
    // ═══════════════════════════════════════════════════════════════════════
    //  LA TEXTURE DES COMBATS — 17/08/2026
    //
    //  🔴 ELLE NE PÈSE SUR RIEN, ET C'EST LA CONDITION POUR LA GARDER. Le
    //     barème (`score`) ne lit aucun de ces champs : un joueur qui les
    //     forgerait ne gagnerait pas un point. On les borne quand même — pour
    //     que la base ne stocke pas d'absurde, et pour que les moyennes qu'on
    //     en tirera ne soient pas déplacées par un seul envoi truqué.
    //  ⚠️ TROIS SEAUX NOMMÉS, PAS UNE CLÉ LIBRE : sans cette liste, un envoi
    //     pourrait ranger mille catégories inventées dans chaque journal.
    //  ⚠️ ABSENTE = ABSENTE. Les voyages d'avant ce jour n'en ont pas, et le
    //     dépouillement doit pouvoir dire « je ne sais pas » plutôt que zéro —
    //     un zéro se moyenne, une absence non.
    // ═══════════════════════════════════════════════════════════════════════
    if (b.texture && typeof b.texture === "object") {
      var tex = {}, vu = false;
      var seaux = ["sauvage", "dresseur", "boss"];
      for (var s = 0; s < seaux.length; s++) {
        var src = b.texture[seaux[s]];
        if (!src || typeof src !== "object") continue;
        var n = borne(src.n, 0, 2000);
        if (!n) continue;
        vu = true;
        tex[seaux[s]] = {
          n: n,
          // Un combat ne peut ni durer mille tours ni engager plus de six
          // Pokémon : on borne au produit, pas au champ isolé.
          tours: borne(src.tours, 0, n * 200),
          un: borne(src.un, 0, n),
          eq: borne(src.eq, 0, n * LIMITES.equipe),
        };
      }
      if (vu) out.texture = tex;
    }
    return out;
  }

  // ── Un nom de repli, quand le joueur n'en a pas donné ──────────────────────
  //  La porte serveur l'emploie quand le pseudo est vide, pris ou interdit. Il
  //  doit être STABLE pour une même soumission — sinon deux refus successifs
  //  donneraient deux noms, et l'autopsie perdrait le fil.
  function nomDeRepli(date, resume) {
    var somme = 0, s = String(date) + "|" + resume.badges + "|" + resume.acte + "|" + resume.pris;
    for (var i = 0; i < s.length; i++) somme = (somme * 31 + s.charCodeAt(i)) >>> 0;
    return "Dresseur " + (1000 + (somme % 9000));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA PORTE QUE LE SERVEUR APPELLE
  //
  //  `replayDaily(date, journal, options)` → `{ score, name }`
  //  Le journal porte UNE entrée : le résumé du voyage. La porte serveur borne
  //  déjà sa taille (60 entrées, 8 000 caractères) — un résumé en tient mille.
  // ═══════════════════════════════════════════════════════════════════════════
  function replayDaily(date, journal, options) {
    if (!Array.isArray(journal) || !journal.length) throw new Error("journal vide");
    var brut = journal[0];
    if (!brut || typeof brut !== "object") throw new Error("résumé illisible");
    var P = W.PokePartie;
    if (!P || !P.scoreDeBilan) throw new Error("barème absent");
    var resume = normaliser(brut, date);
    return {
      score: P.scoreDeBilan(resume),
      name: nomDeRepli(date, resume),
      // Rendu pour les journaux du serveur : dire CE QU'ON A RETENU d'un
      // résumé refusé vaut mieux que dire qu'on l'a refusé.
      resume: resume,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  COMBIEN DE TEMPS UN TEL VOYAGE PREND, AU MINIMUM
  //
  //  🔴 LE TROU QUE LE BANC DU 14/08 A MONTRÉ : un résumé PLAUSIBLE mais non
  //     joué se classe. Le rejeu vérifie que l'arrivée est atteignable, pas
  //     qu'on y est allé. Sans rejeu complet du voyage, une seule chose reste
  //     hors de portée d'un faussaire : LE TEMPS.
  //  🔑 UN VOYAGE DE NEUF ACTES NE SE FAIT PAS EN QUARANTE SECONDES. Le serveur
  //     date déjà le départ (`daily_start`) et impose quinze secondes à tout le
  //     monde ; ce plancher-là ne dit rien d'une PARTIE COMPLÈTE. On le fait
  //     donc grandir avec ce que le résumé ANNONCE : plus on prétend loin, plus
  //     on a dû jouer longtemps.
  //  ⚠️ VOLONTAIREMENT TRÈS BAS — dix secondes par acte, dix par badge. Un
  //     voyage complet exige alors moins de trois minutes, là où un joueur réel
  //     en met des dizaines. On ferme la fabrication INSTANTANÉE, on ne juge pas
  //     la vitesse : refuser un joueur honnête coûte infiniment plus cher que
  //     laisser passer un tricheur patient. *On borne l'absurde, pas le rapide.*
  //  📌 Le vrai verrou reste à écrire : un journal d'actions rejoué. Cette
  //     fonction ne le remplace pas, elle rend la triche ennuyeuse.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 LE PLANCHER ÉTAIT TREIZE FOIS TROP BAS (mesuré le 16/08, premières
  //     données réelles). Dix secondes par acte et dix par badge : un voyage
  //     COMPLET — neuf actes, huit badges, la Ligue — se soumettait à partir de
  //     160 secondes. Le premier voyage complet réellement joué en a mis 2 066.
  //  ✅ 40 s par acte et 25 s par badge : un voyage complet exige désormais
  //     520 secondes, soit un peu moins de neuf minutes.
  //  ⚠️ ET ON GARDE UNE MARGE ÉNORME, À DESSEIN. 520 s reste QUATRE FOIS sous
  //     le seul voyage complet observé. Je n'ai qu'UNE partie complète en base :
  //     serrer davantage serait calibrer sur un joueur, la faute nommée le
  //     30/07 (« jamais calibrer sur qasim ») — et un refus infligé à un joueur
  //     honnête coûte plus cher que dix scores gonflés. À rouvrir quand une
  //     dizaine de voyages complets seront en base, pas avant.
  //  ⚠️ Ce plancher ne juge pas un RYTHME, il ferme la soumission fabriquée dans
  //     la foulée du départ. C'est tout ce qu'il peut prouver.
  // ═══════════════════════════════════════════════════════════════════════════
  var SECONDES_PAR_ACTE = 40, SECONDES_PAR_BADGE = 25;
  // ⚠️ `normaliser` PREND UNE DATE, et elle ne lui était pas passée : la borne
  //    d'espèces se calculait alors sur « POKE-JOUR-undefined », c'est-à-dire
  //    sur une carte qui n'existe pas. Sans effet sur le résultat rendu ici —
  //    seuls `acte` et `badges` sont lus — mais un appel qui ment sur son
  //    argument finit par être recopié ailleurs, où il comptera.
  function dureeMinimale(journal, date) {
    if (!Array.isArray(journal) || !journal.length) return 0;
    var r = normaliser(journal[0] || {}, date);
    return (r.acte - 1) * SECONDES_PAR_ACTE + r.badges * SECONDES_PAR_BADGE;
  }

  W.PokeRejeu = {
    replayDaily: replayDaily,
    dureeMinimale: dureeMinimale,
    normaliser: normaliser,
    plafondNiveau: plafondNiveau,
    LIMITES: LIMITES,
  };
  // 🔴 LE SERVEUR APPELLE `engineFor(sport).replayDaily(...)`, donc à la RACINE
  //    du moteur monté — pas sous un espace de noms. Le mode ninja expose la
  //    sienne de la même façon ; poser l'une sans l'autre rendrait le mode
  //    ouvert et le classement muet.
  W.replayDaily = replayDaily;
  // Même raison : le serveur interroge le moteur à sa racine.
  W.dureeMinimale = dureeMinimale;
})(typeof window !== "undefined" ? window : globalThis);
