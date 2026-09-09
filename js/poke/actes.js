(function (W) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a son itinéraire, ses clés et ses zones.
  var ETAPES = function () { return (W.PokeRegles && W.PokeRegles.etapes()) || W.POKE_ETAPES || []; };
  var CLES_V = function () { return (W.PokeRegles && W.PokeRegles.clesVoyage()) || W.POKE_CLES || {}; };
  var ZONES = function () { return (W.PokeRegles && W.PokeRegles.zones()) || W.POKE_ZONES || []; };
  var LIEUX = function () { return (W.PokeRegles && W.PokeRegles.lieux()) || W.POKE_LIEUX || {}; };
  // ⚠️ PAR LE REGISTRE : Johto a ses huit arènes et son Conseil 4, et une
  //    lecture directe aurait envoyé un dresseur de Johto affronter Pierre.
  var ARENES = function () { return (W.PokeRegles && W.PokeRegles.arenes()) || W.POKE_ARENES || []; };
  var CONSEIL = function () { return (W.PokeRegles && W.PokeRegles.conseil()) || W.POKE_CONSEIL || []; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES ACTES — KANTO DÉCOUPÉ PAR LES CHAMPIONS
  //
  //  🔴 REFONTE DU 07/08/2026. Verdict du propriétaire sur la boucle
  //     précédente : « une liste de lieux vides avec des jours à côté qui ne
  //     servent à rien, on clique il se passe rien, zéro roguelite ». Il avait
  //     raison, et c'était mesurable : 68 jours consommés sur 90 sans qu'un
  //     seul arbitrage ait eu lieu.
  //     La carte devient une CARTE À EMBRANCHEMENTS : deux ou trois chemins,
  //     chacun annonce ce qu'il contient, on choisit, on ne revient pas.
  //
  //  🔴 CE FICHIER NE RÉÉCRIT PAS KANTO. Il DÉRIVE les actes de `POKE_ETAPES` :
  //     un acte va d'un Champion au suivant. Recopier l'itinéraire ici, c'est
  //     garantir qu'il diverge — le motif s'est vérifié quatre fois sur ce mode
  //     (l'ordre de chargement en quatre exemplaires, la liste des effets
  //     traités, les noms d'arène par gabarit, le dépouillement des
  //     commentaires). Ce qui est recopié diverge.
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 [24/08] LE CACHE DES ACTES NE CONNAISSAIT QU'UN SEUL MONDE
  // ---------------------------------------------------------------------------
  //  c-derrick, le 24/08 : « Dans la version johto j'ai des combats de dresseurs
  //  mais jamais de hautes herbes ou autres pour capturer des Pokémon. »
  //
  //  Il décrivait exactement ceci. `_cache` était rempli au PREMIER voyage de
  //  l'onglet et rendu à tous les suivants, quel que soit le jeu de règles.
  //  Un joueur qui fait Kanto puis Johto sans recharger la page reçoit donc les
  //  ACTES DE KANTO — leurs étapes, leurs noms de tables — pendant que
  //  `zones()` rend, elle, correctement celles de Johto. `zonePour` compare
  //  alors des identifiants de deux mondes différents, ne trouve jamais rien,
  //  et `noeudHerbes` rend `null` : chaque tirage d'herbe retombe en silence
  //  sur le nœud d'objet. Mesuré : 0 nœud d'herbe sur 360 actes, et la part
  //  des objets qui passe de 10 % à 32 %.
  //
  //  🔑 LE DÉFAUT EST SYMÉTRIQUE, et c'est ce qui le rendait invisible : Johto
  //     d'abord puis Kanto casse KANTO de la même façon. Personne ne l'a vu
  //     parce que l'outillage monte un processus neuf par mesure — un onglet
  //     neuf ne joue jamais deux mondes.
  //  🔑 ET C'EST LA CLASSE, PAS LE CAS : un cache sans clé rend la réponse
  //     d'une question qu'on ne lui a pas posée. `zones()`, `etapes()` et
  //     `especes()` traversent toutes le registre à chaque appel ; seul
  //     celui-ci gardait sa première réponse.
  //
  //  ⚠️ LA CLÉ EST CELLE DU REGISTRE, pas celle de la partie : `construire`
  //     n'en reçoit aucune, et c'est bien le monde POSÉ qu'il lit à travers
  //     `ETAPES()`. Les deux doivent donc venir du même endroit.
  // ═══════════════════════════════════════════════════════════════════════════
  var _cache = null;
  var _cacheCle = null;

  //  Le monde sous lequel le cache a été rempli. Hors registre — l'outillage
  //  qui monte ce fichier seul — la clé vaut toujours la même chose et le cache
  //  se comporte comme avant.
  function cleDuMonde() {
    return (W.PokeRegles && W.PokeRegles.courante && W.PokeRegles.courante()) || "gen1";
  }

  // Un acte : tout ce qui se trouve entre deux Champions, plus le Champion.
  //   zones   : les étapes qui portent des tables de rencontre ;
  //   scenes  : celles qui donnent une clé, un fossile, une Team Rocket ;
  //   legendaires : celles qui portent un légendaire ;
  //   boss    : le numéro de l'arène qui ferme l'acte (null pour la Ligue) ;
  //   boutique: le meilleur niveau de boutique traversé dans l'acte.
  function construire() {
    var cle = cleDuMonde();
    if (_cache && _cacheCle === cle) return _cache;
    _cacheCle = cle;
    var etapes = ETAPES() || [];
    var actes = [];
    var courant = neuf(1);

    for (var i = 0; i < etapes.length; i++) {
      var e = etapes[i];
      if (e.tables && e.tables.length) courant.zones.push(e);
      if (e.legendaire) courant.legendaires.push(e);
      if (e.dresseurFinal) courant.finals.push(e);
      // Une scène, c'est une étape qui CHANGE quelque chose : elle donne une
      // clé, un fossile, ou elle avance la Team Rocket. Le reste n'est qu'un
      // décor, et un décor ne mérite pas un nœud.
      // 🔴 Une étape entre dans les scènes dès qu'elle porte QUOI QUE CE SOIT à
      //    vivre — y compris un échange ou un cadeau, qui ne sont pas des
      //    drapeaux de l'étape mais des données du ROM rattachées à elle.
      //    Sans cette lecture, Carmin-sur-Mer n'aurait jamais proposé son
      //    Canarticho, et Céladopole jamais son Évoli.
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 IL Y AVAIT DEUX LISTES DE « CE QUI FAIT UNE SCÈNE », ET ELLES ONT
      //     DIVERGÉ. Ce fichier énumérait les drapeaux à la main — `donne`,
      //     `fossile`, `rocket`, `casino`, l'échange, le cadeau — pendant que
      //     `carte-actes.js` savait produire, LUI, deux nœuds de plus. Résultat :
      //     le Musée d'Argenta et le Dojo de Safrania étaient écrits, gréés,
      //     testables… et posés sur aucune carte. Une mécanique livrée sans
      //     porte d'entrée n'existe pas, et ici la porte se fermait ICI.
      //  ⚠️ `scenesDe` n'a besoin d'aucune partie : c'est une question sur
      //     l'ÉTAPE, pas sur le voyage. On demande donc au producteur ce qu'il
      //     sait produire, au lieu de le redire une seconde fois.
      //     Repli sur l'ancienne énumération si le module manque — le rejeu
      //     serveur charge un sous-ensemble des fichiers.
      var estScene;
      if (W.PokeCarteActes && W.PokeCarteActes.scenesDe) {
        estScene = W.PokeCarteActes.scenesDe(e).length > 0;
      } else {
        var echange = (W.POKE_ECHANGES || []).some(function (x) { return x.etape === e.id; });
        var cadeau = e.categorie === "ville" &&
          (W.POKE_CADEAUX || []).some(function (x) { return x.lieu === e.lieu; });
        estScene = !!((e.donne && e.donne.length) || e.fossile || e.fossileRanime || e.rocket ||
          e.pension || e.casino || echange || cadeau);
      }
      if (estScene) courant.scenes.push(e);
      if (e.boutique) courant.boutique = Math.max(courant.boutique, e.boutique);

      if (e.arene) {
        courant.boss = e.arene;
        courant.ville = e.lieu;
        actes.push(courant);
        courant = neuf(actes.length + 1);
      } else if (e.ligue) {
        courant.ligue = true;
        courant.ville = e.lieu;
        actes.push(courant);
        courant = neuf(actes.length + 1);
      }
    }
    // Ce qui reste après la Ligue (la Grotte Inconnue et Mewtwo) rejoint le
    // dernier acte : c'est l'épilogue, pas un acte de plus.
    // 🔴 ET LE DRESSEUR FINAL, S'IL Y EN A UN. La première génération n'en a
    //    pas — son épilogue est une grotte et un légendaire. Johto, si : Red
    //    attend au Mont Argenté, et sans cette ligne il serait écrit, placé,
    //    doté de son équipe… et injoignable. C'est exactement ce qui est
    //    arrivé à Mewtwo pendant des semaines, et le commentaire de
    //    `epilogueDisponible` le raconte déjà.
    if (courant.zones.length || courant.legendaires.length || courant.finals.length) {
      var dernier = actes[actes.length - 1];
      if (dernier) {
        dernier.epilogue = { zones: courant.zones, legendaires: courant.legendaires,
                             finals: courant.finals };
      }
    }
    _cache = actes;
    return actes;
  }

  function neuf(n) {
    return { n: n, zones: [], scenes: [], legendaires: [], finals: [], boutique: 0, boss: null, ligue: false, ville: null };
  }

  function acteDe(n) {
    var a = construire();
    return a[n - 1] || null;
  }

  function nombre() { return construire().length; }

  // 🔴 `acteCourant(partie)` A ÉTÉ SUPPRIMÉ le 08/08. Il ne faisait que
  //    `acteDe(partie.acte || 1)`, et aucun écran ne l'appelait : tous
  //    écrivent `acteDe(partie.acte)` directement. Deux façons de poser la
  //    même question, c'est une divergence qui attend son heure — et une
  //    porte morte de plus dans un mode qui en comptait déjà six.
  //    On supprime, on ne déclare pas dormant : une commodité que personne
  //    n'emploie n'est pas dormante, elle est inutile.

  // Le nom d'un acte : la ville où il se termine. 🔴 Lu dans `POKE_LIEUX`,
  // jamais fabriqué — l'élision française ne se déduit pas d'une règle.
  function nomActe(acte, langue) {
    if (!acte || !acte.ville) return "";
    var l = LIEUX()[acte.ville];
    return l ? (l[langue] || l.fr) : acte.ville;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PLAFOND DE NIVEAU D'UN ACTE — PORTE UNIQUE
  //
  //  🔴 IL N'EN EXISTAIT AUCUN DE BASE. `plafondDeLActe` ne rendait un chiffre
  //     que sous un SERMENT ; hors serment, rien ne bornait la montée. Mesuré
  //     (n=400) : le joueur arrive devant le Champion à **+7,6** à l'arène 4,
  //     **+11,1** à la 6, **+14,6** à la 7 et **+17,4** à la 8. Résultat, cinq
  //     arènes sur huit au-dessus de 94 % de victoires : le mid et l'endgame
  //     n'opposent plus rien, on les traverse en surniveau.
  //
  //  ✅ LA MARGE EST DE HUIT NIVEAUX, ET ELLE EST DÉRIVÉE, PAS CHOISIE. Le
  //     tableau victoire | défaite dit qu'on gagne l'arène 6 à +14,6 et qu'on la
  //     perd à +6,3 : une borne à +8 mord donc le voyage qui s'envole sans
  //     toucher celui qui peine. C'est le seuil le plus bas qui laisse encore
  //     gagner un joueur en retard.
  //  ⚠️ ON NE TOUCHE PAS AU NIVEAU DES CHAMPIONS : le canon est la loi du mode.
  //     On borne ce que le JOUEUR accumule, pas ce que l'adversaire vaut.
  //  ⚠️ UNE SEULE PORTE, et c'est tout l'objet de la remonter ici : `ui.js` et
  //     `tools/poke-difficulte.mjs` en tenaient chacun une copie. Deux copies
  //     d'une règle d'équilibrage divergent, et la divergence se lit
  //     « l'instrument ment ».
  // ═══════════════════════════════════════════════════════════════════════════
  var MARGE_PLAFOND = 8;
  //  La marge du DERNIER acte. Réglée à part, et mesurée à part : voir le
  //  balayage dans `plafondDe`.
  var MARGE_LIGUE = 16;
  //  ⚠️ `serre` EST CE QUE DEVIENT LE SERMENT. `plafondChampion` était la
  //     CONDITION d'existence du plafond ; en le rendant universel je l'ai
  //     tuée, et deux détecteurs l'ont dit dans la minute. Elle est maintenant
  //     un RÉGLAGE : qui jure de ne pas dépasser le Champion joue à marge ZÉRO.
  //     Le serment garde son sens — il le durcit au lieu de l'inventer.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA MARGE FOND EN FIN DE PARCOURS (15/08, « le jeu est encore bcp trop
  //  simple » — propriétaire)
  //
  //  🔴 CE QUE LA MESURE A MONTRÉ, ET QUI M'A REPRIS : le plafond du joueur
  //     INCLUT `monteeChampion` (voir juste dessous). Monter les Champions ne
  //     durcit donc QUE les actes où le joueur n'atteint pas son plafond. Aux
  //     arènes 7 et 8 il y est toujours — relevé : **100 % et 93 % de
  //     victoires**, quoi qu'on ajoute au Champion. Le levier était neutralisé
  //     par un couplage que j'avais introduit moi-même.
  //  ✅ La marge devient donc DÉGRESSIVE. Elle vaut son plein tant que l'équipe
  //     est dépareillée (à l'arène 4, 2,1 Pokémon sur 5,7 sont à niveau : le
  //     joueur a besoin de cette avance), et elle se referme quand elle ne sert
  //     plus qu'à écraser — à l'arène 7 l'équipe est complète et à niveau à
  //     4,9 sur 6.
  //  ⚠️ ET ÇA NE SUFFIT PAS : même à parité de niveau, six Pokémon frais battent
  //     les quatre d'un Champion. La facilité de la fin est STRUCTURELLE, pas
  //     une affaire de niveaux — et le nombre de Pokémon d'un Champion est du
  //     canon, qu'on ne touche pas. Ce qui reste vraiment sélectif en fin de
  //     partie, c'est la Ligue : 10 % de victoires.
  // ═══════════════════════════════════════════════════════════════════════════
  function margeDe(ordre) {
    if (!ordre || ordre <= 4) return MARGE_PLAFOND;
    if (ordre <= 6) return 5;
    // ⚠️ ZÉRO AUX DEUX DERNIÈRES ARÈNES, ET C'EST LA MOITIÉ DU CORRECTIF DU
    //    16/08 : voir `EFFECTIF_FIN`. Une marge, si petite soit-elle, se REMET
    //    au-dessus du Champion qu'on vient de hisser à hauteur du joueur.
    return 0;
  }
  function plafondDe(n, arenes, bonusSerment, serre) {
    var acte = acteDe(n);
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 L'ACTE DE LA LIGUE N'AVAIT AUCUN PLAFOND, ET C'EST LÀ QUE LE JEU
    //     S'EFFONDRAIT. Pas de Champion au dernier acte → `boss` est nul → on
    //     rendait zéro → `appliquerExperience` laissait la borne à 100.
    //     Signalé par un joueur le 16/08 : « l'exp c'est du délire après
    //     Morgane, j'ai dû faire niveau 70 → 100 en quelques combats et OS
    //     toute la league. » Vérifié au chiffre près : un combat du Conseil 4
    //     rend 127 000 à 192 000 d'expérience au Pokémon actif, et il faut
    //     657 000 pour aller de 70 à 100 — **cinq combats**. Le joueur montait
    //     donc à 100 PENDANT la Ligue, contre des adversaires de 53 à 62.
    //  ✅ Le dernier acte se borne comme les huit autres : le plus haut niveau
    //     qu'on y affronte, plus la marge de fin de parcours. Même règle,
    //     même porte — c'est l'ABSENCE d'exception qui manquait.
    // ═══════════════════════════════════════════════════════════════════════
    if (acte && acte.ligue) {
      //  ⚠️ LA MARGE DU DERNIER ACTE EST LA PLEINE MARGE, PAS CELLE DE FIN DE
      //     PARCOURS. Les arènes 7 et 8 tombent à +2 parce qu'on y arrive avec
      //     six Pokémon à niveau contre quatre ; la Ligue, elle, se joue en
      //     CINQ COMBATS SANS UN SOIN. Mesuré à +2 : **0 % de Ligue gagnée**
      //     sur 300 voyages — un plafond juste sur le papier et un mur en jeu.
      var hautLigue = hautDeLaLigue(bonusSerment);
      return hautLigue ? hautLigue + (serre ? 0 : MARGE_LIGUE) : 0;
    }
    if (!acte || !acte.boss || !arenes) return 0;
    var a = null;
    for (var i = 0; i < arenes.length; i++) if (arenes[i].ordre === acte.boss) a = arenes[i];
    if (!a || !a.equipe || !a.equipe.length) return 0;
    var haut = 0;
    for (var k = 0; k < a.equipe.length; k++) haut = Math.max(haut, a.equipe[k].niveau);
    //  🔴 LE PLAFOND SUIT LA MONTÉE DES CHAMPIONS, ET IL A FALLU LA MESURE POUR
    //     LE VOIR. En montant les Champions sans monter le plafond, j'avais
    //     rendu FAUSSE la phrase du Sceau de la FOUDRE (n°3, pas la Terre —
    //     ce commentaire s'est trompé de sceau) : « tes Pokémon ne dépassent
    //     plus le niveau du Champion de l'acte » — puisque le Champion, lui, était
    //     désormais au-dessus. Le joueur se retrouvait systématiquement
    //     SOUS-niveau, et l'échelle s'effondrait : mesuré, le sceau 2 rendait
    //     26,7 % de badges et le sceau 4 en rendait **2,4 %**, avec les quatre
    //     derniers barreaux indiscernables. Une échelle dont la moitié haute
    //     est morte n'est pas une échelle.
    //  ⚠️ La MARGE, elle, ne suit pas : c'est elle qui borne l'avance, et la
    //     rendre relative rouvrirait l'écart qu'on vient de fermer.
    haut += monteeChampion(acte.boss);
    return haut + (serre ? 0 : margeDe(acte.boss)) + (bonusSerment || 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA MONTÉE DES CHAMPIONS — LE DURCISSEMENT, ET IL EST GRADUÉ
  //
  //  🔴 « LE JEU EST TROP FACILE » (retours de testeurs, 14/08). Mesuré : 51 %
  //     des voyages décrochent les huit badges, la MÉDIANE d'un premier run est
  //     8/8, et un tiers des morts se concentre aux actes 1-2 — puis plus rien.
  //     Une falaise, puis une plaine.
  //  🔴 QUATRE LEVIERS TESTÉS ET MESURÉS MORTS, variable isolée, 400 voyages
  //     par palier : le plafond de niveau (de +8 à +4 : 51,1 → 53,3, aucun
  //     effet), les essais par acte (3 → 2 : −6 pts mais durcit l'acte 1), le
  //     soin gratuit à la porte de l'arène (−5 pts de Ligue, badges inchangés).
  //     Aucun réglage ne mordait, parce que les Champions étaient gagnés avec
  //     une marge large : le joueur arrive à +8 niveaux, avec six réponses.
  //  ✅ CE QUI MORD : monter les Champions. C'est le mécanisme que le mode
  //     reconnaît déjà — deux Sceaux de Kanto ne font que ça, et un serment de
  //     défi aussi. On ne touche donc NI la donnée du ROM, ni une formule de
  //     combat : on emploie la porte que le jeu emploie pour se durcir.
  //  🔴 ET IL EST GRADUÉ, PARCE QU'UN BONUS PLAT DURCIT LA FALAISE. Mesuré :
  //     +8 partout fait passer les morts de l'acte 1 de 16 % à 34 %, c'est-à-
  //     dire qu'on chasse le débutant avant qu'il ait compris le jeu — le
  //     contraire du but. Rien aux actes 1-2, croissant ensuite :
  //
  //       forme            8 badges   Ligue   mediane   morts a3
  //       temoin             51,1 %   27,7 %      8         2 %
  //       (o-2)x1,5          32,8 %   18,6 %      4         5 %
  //       (o-2)x2            34,7 %   16,8 %      4         2 %
  //       6+(o-2)            24,5 %   13,9 %      4        11 %
  //       8+(o-2)            25,5 %   15,3 %      3        14 %   <- retenue
  //       10+(o-2)           21,9 %   14,6 %      3        18 %
  //
  //  🔴 ET LA RAMPE EST CHARGEE SUR LE MILIEU, PAS LINEAIRE. Une rampe qui
  //     monte regulierement durcit surtout les actes 7-8, que presque personne
  //     n'atteint : le taux baissait mais la MEDIANE restait bloquee a 4
  //     badges — « 4 badges en un run, c'est encore trop simple » (proprio).
  //     Charger l'acte 3 fait descendre la mediane a 3 ET repartit les morts :
  //     17 / 14 / 14 / 8 / 14 / 8 % sur six actes, au lieu de 31 % au debut
  //     puis un desert. On peut desormais mourir partout.
  //
  //     La falaise ne bouge pas, la plaine double. C'est la distribution qui
  //     manquait : on meurt désormais AU MILIEU, avec trois à six badges —
  //     l'échec de peu, celui qui fait relancer.
  //  🔴 LE PLAFOND DU JOUEUR SUIT CETTE MONTÉE (`plafondDe`), et c'est ce qui
  //     BORNE ce levier : il ne durcit que les actes où le joueur n'est pas déjà
  //     au plafond. Voir `margeDe` — c'est là que se règle la fin de parcours.
  //  ⚠️ CUMULATIF AVEC LES SCEAUX ET LES SERMENTS, jamais à leur place : eux
  //     poussent `bossNiveau`, celui-ci est la base du canon. Un joueur au
  //     Sceau 6 affronte la base PLUS son sceau.
  //
  //  ═══ 15/08 — « LE JEU EST ENCORE BCP TROP SIMPLE » (propriétaire) ═════════
  //  🔴 JE CITAIS LE MAUVAIS CHIFFRE. Je mesurais sur compte VIERGE (24,6 % de
  //     parcours complets) alors que le propriétaire joue un compte de VÉTÉRAN,
  //     qui emporte un acquis : **32,8 % de badges, 22,8 % de Ligue, médiane
  //     4/8**. Un voyage sur trois allait au bout. Il avait raison, et mon
  //     instrument répondait à une question que personne ne posait.
  //  ✅ TROIS LEVIERS, ET IL FALLAIT LES TROIS (vétéran, 548 voyages, mêmes
  //     graines à chaque essai) :
  //       témoin                              32,8 %  Ligue 22,8  médiane 4
  //       rampe 10+(o-2)                      26,1 %        15,3         4
  //       marge dégressive seule              29,7 %        17,3         4
  //       + arène 2 à +3                      27,7 %        18,8         3
  //       + essais par acte 3 → 2         **17,2 %**   **10,6**     **3**
  //     Compte vierge : 15,3 % · 9,9 % · médiane 2. Sceau 3 : 6,6 % — l'échelle
  //     des sceaux tient encore.
  //  ⚠️ L'ARÈNE 1 RESTE GRATUITE, et les essais coûtent moins cher qu'il n'y
  //     paraît : les morts de l'acte 1 sont passées de 18 % à **15 %**. Ce qui
  //     se resserre, c'est le MILIEU — 15/21/13/11/15/8 sur six actes. On meurt
  //     partout, jamais au premier pas.
  // ═══════════════════════════════════════════════════════════════════════════
  //  ═══ 16/08 — LA RAMPE S'ARRÊTAIT À MORGANE ══════════════════════════════
  //  🔴 UN BONUS QUI MONTE SUR UN CANON QUI DESCEND NE MONTE PAS. La rampe
  //     `10 + (ordre − 2)` était croissante, les niveaux EFFECTIFS ne
  //     l'étaient pas — parce que le ROM, lui, redescend :
  //       arène 6 (Morgane)  canon 48 + 14 = **62**
  //       arène 7 (Auguste)  canon 47 + 15 = **62**   ← aucune marche
  //       arène 8 (Giovanni) canon 50 + 16 = **66**
  //     Or le plafond de l'acte 6 vaut 67 (62 + marge 5). Le joueur SORTAIT
  //     donc de Safrania AU-DESSUS du plafond des deux actes suivants, et un
  //     plafond ne redescend pas un niveau déjà gagné : il n'arrête que les
  //     montées. Les deux dernières arènes n'opposaient plus rien.
  //     Mesuré, 300 voyages, politique optimale, AVANT :
  //       arène   5      6      7      8
  //       tête  51,6   63,8   67,5   69,4
  //       champ 56,0   62,0   62,0   66,0
  //       écart −4,4   +1,8   **+5,5**  **+3,4**
  //       vict.  40 %   58 %  **100 %**  **93 %**
  //     et « où l'on meurt » : acte 6 → 4 %, acte 8 → **0 %**.
  //  ❌ ET MONTER LES DEUX DERNIÈRES ARÈNES NE SERT À RIEN — MESURÉ, PUIS
  //     REVERTÉ LE MÊME JOUR. J'ai essayé exactement ça : viser le niveau
  //     EFFECTIF au lieu du bonus, Auguste au plafond de l'acte 6 (67) et
  //     Giovanni un cran au-dessus (70). Résultat sur 300 voyages :
  //       arène 7   écart +5,5 → **+2,4**   victoires 100 % → **100 %**
  //       arène 8   écart +3,4 → **+3,3**   victoires  93 % →  **89 %**
  //     Le plafond du joueur SUIT la montée du Champion (`plafondDe`), donc
  //     les deux chiffres montent ensemble et l'écart réel ne bouge pas. Ce
  //     fichier le disait déjà quinze lignes plus haut — je l'ai relu APRÈS
  //     l'avoir remesuré.
  //  🔑 LA FIN EST FACILE POUR UNE RAISON STRUCTURELLE, PAS DE NIVEAU : six
  //     Pokémon frais, soignés, contre les quatre d'Auguste et les cinq de
  //     Giovanni. À parité exacte de niveau, le nombre gagne. Le nombre de
  //     Pokémon d'un Champion est du canon, qu'on ne touche pas — donc le
  //     levier des arènes 7-8 est FERMÉ, et il faut le dire ici pour qu'on ne
  //     le rouvre pas une troisième fois.
  //     Ce qui reste sélectif en fin de partie, c'est la Ligue : cinq combats
  //     d'affilée SANS SOIN. C'est là que se règle la fin, et nulle part
  //     ailleurs — voir `monteeLigue` juste en dessous.
  //  ═══ 16/08 — LES DEUX DERNIÈRES ARÈNES SE HISSENT À HAUTEUR DU JOUEUR ═════
  //  🔴 UN BONUS QUI MONTE SUR UN CANON QUI DESCEND NE MONTE PAS. La rampe
  //     `10 + (ordre − 2)` croissait, les niveaux EFFECTIFS non, parce que le
  //     ROM redescend : Morgane 48 + 14 = **62**, Auguste 47 + 15 = **62**,
  //     Giovanni 50 + 16 = 66. Or le plafond de l'acte 6 vaut 67. Le joueur
  //     sortait donc de Safrania AU-DESSUS des deux Champions suivants, et un
  //     plafond n'arrête que les MONTÉES : il ne redescend jamais un niveau
  //     déjà gagné. D'où +5,5 devant Auguste et 100 % de victoires.
  //  ✅ ON VISE LE NIVEAU EFFECTIF, PAS LE BONUS : Auguste au plafond de
  //     l'acte 6 (67), Giovanni un cran au-dessus (70). Les arènes 1 à 6 ne
  //     bougent pas d'un point — la falaise du début et les deux murs (Koga,
  //     Morgane) se sont mesurés ensemble, ils ne se changent pas pour une
  //     plainte qui vise la FIN.
  //  ⚠️ ET ÇA NE MARCHE QUE COUPLÉ À `margeDe(7,8) = 0`. Premier essai du
  //     16/08, marge laissée à 2 : l'écart tombait de +5,5 à +2,4 et les
  //     victoires ne bougeaient pas (100 %), parce que le plafond du joueur
  //     SUIT la montée du Champion — on hissait les deux ensemble. Le levier
  //     n'existe qu'en fermant la marge en même temps.
  //  ⚠️ ET IL FALLAIT AUSSI L'ÉQUIPE. À écart nul, Auguste à quatre Pokémon
  //     contre six frais reste gagné : c'est la leçon de Koga et de Morgane,
  //     hissés à cinq dans `tools/poke-monde.mjs`. Auguste l'est à son tour, et
  //     porte deux Hyper Potions comme eux (`soinsDeChampion`). Les trois
  //     pièces se sont mesurées ENSEMBLE, elles se changent ensemble.
  var EFFECTIF_FIN = { 7: 67, 8: 70 };
  function monteeChampion(ordre) {
    if (!ordre || ordre <= 1) return 0;
    // L'arène 2 cesse d'être gratuite : c'est elle qui bloquait la médiane à 4.
    if (ordre === 2) return 3;
    if (EFFECTIF_FIN[ordre]) return Math.max(0, EFFECTIF_FIN[ordre] - hautCanon(ordre));
    return Math.round(10 + (ordre - 2));
  }

  //  Le plus haut niveau du ROM dans l'équipe d'une arène. LU, jamais recopié :
  //  c'est la seule façon que la cible effective ci-dessus reste vraie le jour
  //  où la table des arènes est regénérée.
  function hautCanon(ordre) {
    var arenes = ARENES() || [];
    for (var i = 0; i < arenes.length; i++) {
      if (arenes[i].ordre !== ordre || !arenes[i].equipe) continue;
      var h = 0;
      for (var k = 0; k < arenes[i].equipe.length; k++) h = Math.max(h, arenes[i].equipe[k].niveau);
      return h;
    }
    return 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA LIGUE SE DURCISSAIT AVEC TOUT LE RESTE — SAUF QU'ELLE, NON (16/08)
  //
  //  🔴 LE SOMMET DU MODE ÉTAIT LE SEUL COMBAT RESTÉ AU CANON NU. `ui.js`
  //     monte l'équipe des huit Champions (`equipeDuChampion` : le sceau, le
  //     serment, ET `monteeChampion`) ; le Conseil 4 et le Champion, eux,
  //     partaient de `POKE_CONSEIL[i].equipe` brut. Conséquences, toutes
  //     mesurées :
  //       · Giovanni finissait à 66, Olga ouvrait la Ligue à **56** — on
  //         DESCENDAIT de dix niveaux en franchissant la porte du sommet ;
  //       · un joueur au Sceau 6 durcissait ses huit arènes (`bossNiveau`
  //         jusqu'à +14) et trouvait la Ligue **exactement identique** : la
  //         moitié haute de l'échelle des sceaux ne portait pas jusqu'au bout.
  //  ✅ Une montée pour la Ligue aussi, et elle REPREND la rampe au lieu de la
  //     rompre : Olga au-dessus de Giovanni, et ça monte jusqu'au rival.
  //       Olga 56→70 · Aldo 58→72 · Agatha 60→74 · Peter 62→76 · rival 65→79
  //  ⚠️ PLATE, ET C'EST VOULU. Les écarts internes du ROM (deux niveaux entre
  //     chaque membre) sont ce qui fait la montée en tension des cinq combats ;
  //     une montée graduée les aurait écrasés ou dilatés. On décale le bloc.
  //  ⚠️ Aucun soin entre les cinq : la dose se juge sur la SUITE, pas sur Olga.
  // ═══════════════════════════════════════════════════════════════════════════
  //  ═══ 17/08 — ELLE ÉTAIT ÉCRITE, DÉCLARÉE ✅, ET DOSÉE À ZÉRO ═════════════
  //  🔴 TOUT LE BLOC CI-DESSUS DÉCRIT UNE MONTÉE QUI N'A JAMAIS EU LIEU. Le
  //     mécanisme est câblé jusqu'au combat (`equipeDeLaLigue`), la mesure est
  //     écrite, les cinq niveaux sont nommés — et la constante valait 0. C'est
  //     la classe n°1 du dossier : du contenu écrit et jamais montré.
  //  🔴 CE QUE DIT LA BASE DE PROD LE 17/08 : sur les 29 voyages du jour qui
  //     décrochent les huit badges, **29 gagnent la Ligue. Vingt-neuf sur
  //     vingt-neuf.** Le sommet du mode n'oppose rien, et c'est très
  //     exactement ce que les joueurs appellent « trop simple ».
  //  ✅ LA DOSE NE SE DEVINE PAS, ELLE SE DÉDUIT : Giovanni ferme les arènes à
  //     70 (`EFFECTIF_FIN`) et Olga ouvrait la Ligue à 56. Franchir la porte du
  //     sommet faisait DESCENDRE de quatorze niveaux. La montée vaut donc
  //     quatorze : la rampe redevient continue, pas d'un chiffre choisi pour
  //     atteindre un taux de victoire.
  //  ⚠️ Le plafond du joueur suit (`hautDeLaLigue` + `MARGE_LIGUE`) : c'est
  //     voulu, sinon la Ligue passerait au-dessus de ce que le joueur a le
  //     droit d'atteindre — le mur du 16/08, en pire.
  var MONTEE_LIGUE = 14;
  function monteeLigue() { return MONTEE_LIGUE; }

  //  Le plus haut niveau qu'on affronte au dernier acte — Conseil 4 ET rival.
  //  🔴 LE RIVAL EN FAIT PARTIE : c'est LUI le Champion, et son as est le plus
  //     haut des cinq combats. L'oublier ici aurait posé le plafond du joueur
  //     trois niveaux sous le dernier adversaire du voyage.
  function hautDeLaLigue(bonusSerment) {
    var haut = 0, i, k;
    var C = CONSEIL() || [];
    for (i = 0; i < C.length; i++) {
      for (k = 0; k < (C[i].equipe || []).length; k++) haut = Math.max(haut, C[i].equipe[k].niveau);
    }
    var R = (W.POKE_RIVAL && W.POKE_RIVAL.champion) || [];
    for (i = 0; i < R.length; i++) {
      for (k = 0; k < R[i].length; k++) haut = Math.max(haut, R[i][k].niveau);
    }
    if (!haut) return 0;
    return Math.min(100, haut + MONTEE_LIGUE + (bonusSerment || 0));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PLAFOND D'UN VOYAGE — LA PORTE QUE LE SUPER BONBON N'AVAIT PAS
  //
  //  🔴 SIGNALÉ PAR UN JOUEUR LE 16/08 : « j'étais cap lvl 64 et en mettant un
  //     super bonbon ça m'a up instant lvl 100 ». Reproduit du premier coup.
  //     Deux règles justes se combinaient en trou :
  //      · sous plafond, l'expérience CONTINUE de rentrer — seuls les niveaux
  //        s'arrêtent (voir `appliquerExperience`), pour que l'acte suivant
  //        rende ce qu'on a accumulé ;
  //      · `employerBonbon` appelait `appliquerExperience` SANS plafond.
  //     Le bonbon relâchait donc toute la réserve d'un coup, jusqu'à 100.
  //  🔑 UN TROU N'A PAS BESOIN DE DEUX FAUTES : deux comportements corrects se
  //     suffisent, s'ils ne se connaissent pas. Le plafond était réglé dans
  //     `ui.js` par une fonction que le sac ne pouvait pas appeler — c'est
  //     l'ABSENCE de porte commune qui a fait le bug, pas une ligne fausse.
  //  ⚠️ ELLE VIT ICI, PAS DANS `ui.js` : le sac, la Pension et le rejeu serveur
  //     n'ont pas d'interface, et chacun doit pouvoir poser la même question.
  // ═══════════════════════════════════════════════════════════════════════════
  function plafondPour(partie) {
    if (!partie) return 0;
    var eff = W.PokeSerments ? W.PokeSerments.effet(partie) : null;
    return plafondDe(partie.acte, ARENES(),
      eff ? eff.bossNiveau : 0, eff ? eff.plafondChampion : false);
  }

  W.PokeActes = {
    construire: construire,
    acteDe: acteDe,
    plafondDe: plafondDe,
    plafondPour: plafondPour,
    monteeChampion: monteeChampion,
    monteeLigue: monteeLigue,
    hautDeLaLigue: hautDeLaLigue,
    MARGE_PLAFOND: MARGE_PLAFOND,
    nombre: nombre,
    nomActe: nomActe,
  };
})(typeof window !== "undefined" ? window : globalThis);
