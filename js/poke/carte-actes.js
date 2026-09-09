(function (W) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a son itinéraire, ses clés et ses zones.
  var ETAPES = function () { return (W.PokeRegles && W.PokeRegles.etapes()) || W.POKE_ETAPES || []; };
  var CLES_V = function () { return (W.PokeRegles && W.PokeRegles.clesVoyage()) || W.POKE_CLES || {}; };
  var ZONES = function () { return (W.PokeRegles && W.PokeRegles.zones()) || W.POKE_ZONES || []; };
  //  Le mythique du monde : Mew a Kanto, Celebi a Johto. Un monde sans porte
  //  garde celui de 1996 -- l'outillage monte parfois ce fichier seul.
  var MYTH = function () {
    return (W.PokeRegles && W.PokeRegles.mythique && W.PokeRegles.mythique()) ||
      { n: 151, niveau: 7, lieu: null };
  };
  var LIEUX = function () { return (W.PokeRegles && W.PokeRegles.lieux()) || W.POKE_LIEUX || {}; };
  // ⚠️ PAR LE REGISTRE : Johto a ses huit arènes et son Conseil 4, et une
  //    lecture directe aurait envoyé un dresseur de Johto affronter Pierre.
  var ARENES = function () { return (W.PokeRegles && W.PokeRegles.arenes()) || W.POKE_ARENES || []; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES SCÈNES SE DEMANDENT AU MONDE COURANT  [20/08/2026]
  //
  //  🔴 ELLES SE LISAIENT EN DIRECT SUR LES GLOBALES DE 1996. Un voyage de
  //     Johto recevait donc les échanges de Kanto — dont les étapes n'existent
  //     pas chez lui — et rien ne sortait. Pas d'erreur, pas de trace : ONZE
  //     des treize sortes de scènes étaient muettes pour la moitié du mode.
  //  ⚠️ Le repli sur la globale reste, et il compte : une partie de Kanto
  //     chargée avant ce registre doit continuer à se jouer exactement pareil.
  // ═══════════════════════════════════════════════════════════════════════════
  var R = function () { return W.PokeRegles; };
  var ECHANGES = function () {
    var r = R(); return (r && r.echanges && r.echanges()) || (r ? [] : W.POKE_ECHANGES) || [];
  };
  var CADEAUX = function () {
    var r = R(); return (r && r.cadeaux && r.cadeaux()) || (r ? [] : W.POKE_CADEAUX) || [];
  };
  var STATIQUES = function () {
    var r = R(); return (r && r.statiques && r.statiques()) || [];
  };
  var DOJO = function () {
    var r = R(); return (r && r.dojo && r.dojo()) || (r ? null : W.POKE_DOJO) || null;
  };
  var AMBRE = function () {
    var r = R(); return (r && r.ambre && r.ambre()) || (r ? null : W.POKE_AMBRE) || null;
  };
  var OEUFS = function () {
    var r = R(); return (r && r.oeufs && r.oeufs()) || [];
  };
  var FOSSILES_DISPO = function () {
    var r = R();
    if (r && r.fossiles) return r.fossiles() || [];
    return W.POKE_FOSSILES || [];
  };
  var CONCOURS = function () {
    var r = R(); return (r && r.concours && r.concours()) || null;
  };
  var CONSEIL = function () { return (W.PokeRegles && W.PokeRegles.conseil()) || W.POKE_CONSEIL || []; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA CARTE D'UN ACTE — GÉNÉRATION SEEDÉE
  //
  //  Trois à cinq rangées, deux ou trois nœuds par rangée. On en choisit un,
  //  les autres sont perdus, et on ne revient pas.
  //
  //  🔴 CHAQUE NŒUD ANNONCE SON CONTENU AVANT LE CHOIX. C'est la contre-mesure
  //     directe au « on clique il se passe rien » : un nœud qui ne dit pas ce
  //     qu'il contient ne demande pas une décision, il demande un clic.
  //  🔴 L'ANNONCE EST CALCULÉE, jamais écrite. Les espèces et leurs taux
  //     viennent de `POKE_ZONES`, les équipes de `POKE_EQUIPES` — donc elles
  //     restent vraies si les données bougent, et `poke-noms.mjs` ne trouve
  //     aucun nom tapé au clavier.
  //  🔴 TOUT TIRAGE PASSE PAR LA GRAINE : au Défi du jour, tout le monde a la
  //     MÊME carte. C'est ce que vérifie `poke-rng.mjs`.
  // ═══════════════════════════════════════════════════════════════════════════

  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };

  // Les poids de tirage des types de nœuds. Un acte doit rester lisible : trop
  // de variété et le joueur ne compare plus rien.
  //  ⚠️ `arbre` PÈSE COMME LA PÊCHE, ET POUR LA MÊME RAISON : il ne sort que là
  //     où le monde en pose un, donc son poids ne se compare pas à celui des
  //     herbes mais à zéro le reste du temps.
  var POIDS = { herbes: 30, dresseur: 26, objet: 12, centre: 10, boutique: 8, eau: 8, peche: 14, arbre: 14 };

  //  Les équipes de route du monde joué. Une seule lecture, ici : c'est la
  //  ligne qui a coûté un voyage entier de Kanto à ceux qui jouaient Johto.
  var EQUIPES = function () {
    return (W.PokeRegles && W.PokeRegles.equipes && W.PokeRegles.equipes()) || W.POKE_EQUIPES;
  };
  //  Et la nomenclature du même monde : c'est elle qui dit ce qui a le droit
  //  d'être croisé au hasard d'une route.
  var CLASSES = function () {
    return (W.PokeRegles && W.PokeRegles.classesDresseur && W.PokeRegles.classesDresseur()) || W.POKE_CLASSES;
  };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE COMPTOIR PÈSE PLUS QUAND IL A ENFIN QUELQUE CHOSE À VENDRE
  //
  //  🔴 MESURÉ LE 14/08 : sur 200 voyages, la médiane est de UN comptoir croisé
  //     pour tout un voyage de neuf actes, et 35 % des voyages n'en croisent
  //     AUCUN. Le joueur gagne ~14 200 ₽ et en dépense 28 % : le reste meurt
  //     avec le voyage. Ce n'est pas un problème de PRIX — c'est qu'il n'y a
  //     presque nulle part où payer.
  //  🔴 ET DOUBLER LE POIDS PARTOUT A ÉTÉ MESURÉ, PUIS REFUSÉ : 8 badges
  //     60,6 → 54 %, et surtout le mur du début s'INVERSE (acte 1 à 15 % de
  //     morts contre l'acte 2 à 9 %), c'est-à-dire la dette n°1 du panel qui
  //     revient. La raison est nette : avant l'acte 4 le comptoir ne vend que
  //     des Poké Balls et des Potions — un nœud sans expérience et sans achat
  //     qui compte, posé exactement là où le joueur n'a pas de marge.
  //  ⚖️ LA DÉCISION SE DÉRIVE, ELLE NE S'INVENTE PAS : le poids monte à partir
  //     de `ACTE_MACHINES`, l'acte où la vitamine, la pierre et les neuf
  //     machines ouvrent. Le comptoir devient fréquent au moment exact où il
  //     devient un choix. Aucun chiffre posé pour un acte en particulier.
  // ═══════════════════════════════════════════════════════════════════════════
  //  ⚖️ LA DOSE, MESURÉE À 400 VOYAGES CONTRE TÉMOIN (poids plat), politique
  //     « optimal », règle « voyage » :
  //        8 (témoin) · 8 badges 56,6 % · Ligue 31,4 % · bourse morte 6 525 ₽
  //                     · 5 300 ₽ dépensés (35,7 %) · 1 comptoir · 32,1 % à zéro
  //       14           · 58,0 % · 29,6 % · 6 798 ₽ · 6 000 ₽ (37,7 %) · 2 · 29,2 %
  //       20  SIGNÉE   · 53,3 % · 29,2 % · 4 806 ₽ · 5 400 ₽ (38,9 %) · 2 · 27,4 %
  //     14 double les comptoirs pour rien : la bourse morte ne bouge pas. Il
  //     faut 20 pour qu'un joueur croise assez de comptoirs pour s'offrir la
  //     vitamine à 9 800 ₽ — le seul achat qui change une partie pour de bon.
  //     Prix payé : 3,3 points de plafond, dans le bruit d'un échantillon de
  //     400 (la même dose rend 59,1 % à 200 voyages), bandes tenues (plafond
  //     50-65, Ligue 25-35), médiane 8/8 intacte, dents de scie inchangées.
  //  ✅ RE-MESURÉE LE SOIR MÊME, DANS LE MONDE CORRIGÉ (l'IA joue enfin ses
  //     coups de statut, les objets X sont achetés et joués). *Une dose se
  //     re-mesure quand le monde change* — et elle TIENT : à 400 voyages,
  //     14 rend 47,4 % / Ligue 24,5 % et 26 rend 47,4 % / 21,9 %, tous deux
  //     avec une médiane tombée à 5 badges, contre 51,1 % / 27,7 % et 8/8 à 20.
  //     Le comptoir est devenu un GAIN pour le joueur (il y achète soins,
  //     Rappels et rayon rare) : en couper coûte, en ajouter coûte aussi, parce
  //     qu'un comptoir est un nœud sans expérience. 20 est un optimum local, et
  //     le levier de la carte est épuisé.
  //  📌 À RECONTRÔLER SUR DONNÉES RÉELLES le jour de l'ouverture : le joueur
  //     simulé sous-estime les vrais joueurs d'un ordre de grandeur.
  var POIDS_BOUTIQUE_RARE = 20;
  function poidsBoutique(partie) {
    var acteMachines = (W.PokeObtenir && W.PokeObtenir.ACTE_MACHINES) || 4;
    return ((partie && partie.acte) || 1) >= acteMachines ? POIDS_BOUTIQUE_RARE : POIDS.boutique;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 VINGT ET UNE TABLES DE RENCONTRE SUR CINQUANTE-SIX NE SORTAIENT JAMAIS.
  //    Cette fonction rendait la PREMIÈRE zone correspondant aux tables de
  //    l'étape — toujours la même. Or le Mont Sélénité en déclare trois, la
  //    Tour Pokémon cinq, les Îles Écume cinq, le Manoir quatre : tous leurs
  //    étages inférieurs étaient morts.
  //    Neuf espèces ne vivent QUE dans ces tables-là — Rhinoféros, Électrode,
  //    Grodoudou, Magmar, Kangourex, Tauros, Lamantine, Hypocéan, Krabboss —
  //    et aucune n'était donc rencontrable, dans aucune version, jamais.
  //
  //  🔴 TROUVÉ PAR LE CONTRÔLE DE RÉPÉTITIONS, pas à la lecture : trois nœuds
  //     d'herbes de la même carte annonçaient exactement la même liste
  //     d'espèces. Trois branches identiques dans une carte dont toute la règle
  //     est « prendre une branche, c'est perdre l'autre ». Le symptôme visible
  //     était cosmétique ; la cause ne l'était pas.
  //
  //  🔴 LE TIRAGE PASSE PAR LA GRAINE. Sans `h` — le serveur qui rejoue une
  //     étape hors carte — on garde la première table : c'est stable, et c'est
  //     le comportement d'avant.
  // ═══════════════════════════════════════════════════════════════════════════
  function zonePour(etape, partie, h) {
    var tables = etape.tables || [];
    var trouvees = [];
    for (var i = 0; i < ZONES().length; i++) {
      for (var k = 0; k < tables.length; k++) {
        if (ZONES()[i].id === tables[k]) { trouvees.push(ZONES()[i]); break; }
      }
    }
    if (!trouvees.length) return null;
    return h ? h.dans(trouvees) : trouvees[0];
  }

  // ── L'annonce d'un nœud d'herbes ────────────────────────────────────────────
  //  On nomme les espèces les plus probables, PLUS la plus rare — c'est elle
  //  qui fait choisir. « Pikachu 1 % » vaut mieux que « 3 rencontres ».
  function annoncerRencontres(zone, version, milieu) {
    var bloc = milieu === "eau" ? zone.eau : zone.herbe;
    if (!bloc) return null;
    var creneaux = bloc[version] || [];
    var parEspece = {};
    for (var i = 0; i < creneaux.length; i++) {
      parEspece[creneaux[i].n] = (parEspece[creneaux[i].n] || 0) + creneaux[i].poids;
    }
    var liste = [];
    for (var n in parEspece) liste.push({ n: +n, poids: parEspece[n] });
    liste.sort(function (a, b) { return b.poids - a.poids; });
    var communes = liste.slice(0, 2);
    var rare = liste[liste.length - 1];
    var out = communes.map(function (x) { return { n: x.n, taux: x.poids }; });
    // La plus rare ne se répète pas si elle est déjà dans les communes.
    if (rare && !communes.some(function (x) { return x.n === rare.n; })) {
      out.push({ n: rare.n, taux: rare.poids, rare: true });
    }
    return out;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'UN LIEU ENTRAÎNE — LE SYSTÈME DE CONSTRUCTION DE 1996, RENDU VISIBLE
  //
  //  🔴 LE MODE CALCULE DÉJÀ TOUT ÇA, ET NE LE DIT À PERSONNE. En première
  //     génération, un Pokémon vaincu lègue SES statistiques de base au
  //     vainqueur — c'est le « stat-exp », et c'est le seul vrai levier de
  //     construction du jeu d'origine. `moteur.js` le gagne à chaque victoire,
  //     `calculerStats` le lit, les vitamines le montent, le code de duel le
  //     transporte. Il est entièrement câblé depuis le premier jour.
  //     Et il est INVISIBLE. Le joueur ne peut ni le lire, ni le viser, ni
  //     comprendre pourquoi deux Roucool du même niveau ne se valent pas.
  //     C'est la classe de défaut que ce dossier traque partout : le jeu sait,
  //     et il ne dit pas.
  //
  //  🔴 EN LE DISANT, ON CHANGE LA NATURE DU CHOIX DE NŒUD. Aujourd'hui deux
  //     nœuds d'herbes se choisissent sur les espèces qu'on veut attraper.
  //     Demain ils se choisissent AUSSI sur ce qu'ils entraînent : la Route 3
  //     élève la Vitesse, le Mont Sélénite l'Attaque. Le même écran, la même
  //     carte, une décision de plus — et elle est canon jusqu'à la dernière
  //     virgule.
  //
  //  ⚠️ ON NOMME UNE SEULE STATISTIQUE, LA DOMINANTE. Afficher cinq nombres
  //     transformerait une carte de choix en tableur, et le mode a déjà refusé
  //     ça une fois. Le joueur veut savoir ce que ce chemin FAIT de son équipe,
  //     pas de combien.
  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️ LA LISTE DES STATISTIQUES VIENT DU JEU DE RÈGLES : la gen 2 en a SIX,
  //    et une liste écrite ici aurait fait dire à chaque route de Johto qu'elle
  //    entraîne une statistique qui n'existe pas.
  function statsDuJeu() {
    return W.PokeRegles ? W.PokeRegles.stats() : ["pv", "atk", "def", "vit", "spe"];
  }
  function entraine(annonce) {
    if (!annonce || !annonce.length) return null;
    var tableEsp = ESP();
    if (!tableEsp) return null;
    var STATS = statsDuJeu();
    var somme = {}, si;
    for (si = 0; si < STATS.length; si++) somme[STATS[si]] = 0;
    var poids = 0;
    for (var i = 0; i < annonce.length; i++) {
      var e = tableEsp[annonce[i].n];
      if (!e || !e.base) continue;
      // 🔴 PONDÉRÉ PAR LE TAUX DE RENCONTRE, pas par espèce. Un Ronflex à un
      //    pour cent ne fait pas d'une route un lieu de Défense : ce qu'on
      //    entraîne, c'est ce qu'on croise vraiment.
      var p = annonce[i].taux || 1;
      poids += p;
      for (var s = 0; s < STATS.length; s++) somme[STATS[s]] += e.base[STATS[s]] * p;
    }
    if (!poids) return null;
    var meilleure = null, valeur = -1;
    for (var k = 0; k < STATS.length; k++) {
      if (somme[STATS[k]] > valeur) { valeur = somme[STATS[k]]; meilleure = STATS[k]; }
    }
    return meilleure;
  }

  // ── Fabriquer un nœud ───────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 « LE DÉBUT EST EXTRÊMEMENT SIMPLE : MON SALAMÈCHE EST N.13 ET JE TOMBE
  //    SUR DES POKÉMON N.3 » — premier testeur externe, 11/08/2026. Mesuré : il
  //    a raison, et la cause est une asymétrie de génération. Les DRESSEURS
  //    suivent la rampe de l'acte (N.7 → N.11 vers l'Onix N.14), mais les
  //    SAUVAGES sortaient tels quels de la table du ROM — Route 1, N.2-5 —
  //    à toutes les rangées. Dans le jeu de 1996 on MARCHE À CÔTÉ des herbes ;
  //    ici, un nœud d'herbes impose 2 à 4 combats. Le mode injectait donc
  //    l'expérience d'une route entière sans jamais faire monter l'adversité :
  //    à mi-acte, chaque rencontre était un combat déjà gagné.
  //    Et ça abîmait AUSSI la capture : attraper un Roucool N.3 quand l'équipe
  //    est N.13, c'est attraper un Pokémon qu'on ne sortira jamais.
  // ✅ Les sauvages suivent la MÊME rampe que les dresseurs, un cran dessous
  //    (visé − 2) : la route mène au mur, comme partout. Le niveau du ROM
  //    reste un PLANCHER — on ne descend jamais sous la table d'origine.
  // ⚠️ LE VISÉ SE FIGE À LA GÉNÉRATION, comme pour les dresseurs. Le calculer
  //    au moment de jouer lirait le niveau COURANT de l'équipe — le tapis
  //    roulant déjà payé une fois : un adversaire qui suit le joueur ne le
  //    fait jamais monter.
  // ⚠️ Une carte d'AVANT cette version n'a pas d'estampille : ses rencontres
  //    gardent le niveau du ROM. Un acte en cours se termine comme il a
  //    commencé, et le rejeu d'hier reste juste.
  // ═══════════════════════════════════════════════════════════════════════════
  function noeudHerbes(etape, partie, h, milieu, acteCourant, rangee, total) {
    var zone = zonePour(etape, partie, h);
    if (!zone) return null;
    var annonce = annoncerRencontres(zone, partie.version, milieu);
    if (!annonce || !annonce.length) return null;
    return {
      type: milieu === "eau" ? "eau" : "herbes",
      etape: etape.id, zone: zone.id, lieu: etape.lieu,
      rencontres: h.entre(2, 4),
      vise: niveauDeRangee(acteCourant, partie, rangee, total),
      // La dose de la rampe des sauvages (visé − dose), estampillée ICI pour
      // que le rejeu d'un voyage en cours ne change pas sous le joueur.
      // 🔴 5 → 4 (13/08 soir, tranché senior, A/B à monde constant). Le refus
      //    de la dose 4 datait d'un monde SANS les correctifs canon de l'audit
      //    (sommet 68,9 % alors) ; le canon a durci le jeu de ~5 points et le
      //    Psyko/Bulles d'O à 33 % écrasait la médiane hasard à 1 badge.
      //    Re-mesurée avec tout le canon : sommet 64,1 % (bande 50-65), Ligue
      //    32 %, MÉDIANE HASARD 2 restaurée, murs à l'endroit (a1 7 < a2 14),
      //    Koga vivant. Une dose se re-mesure quand le monde change.
      dose: 4,
      annonce: annonce,
      // Ce que ce chemin fera de ton équipe. Calculé, jamais écrit à la main :
      // `poke-noms.mjs` refuse les libellés tapés, et une table parallèle aurait
      // divergé des vraies rencontres au premier ajustement du monde.
      entraine: entraine(annonce),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE NŒUD DE PÊCHE — UN TYPE DE NŒUD QUE LA CANNE OUVRE
  //
  //  🔴 SEIZE ESPÈCES ATTENDAIENT DANS `POKE_PECHE` SANS QU'AUCUN NŒUD PÊCHE.
  //     Les tables existent, les trois cannes existent dans `POKE_OBJETS`, et le
  //     Pokédex comptait déjà ces espèces dans « atteignables » : huit par
  //     version étaient donc déclarées atteignables et impossibles à attraper —
  //     Magicarpe, Minidraco, Krabby, Ptitard, et leurs évolutions avec elles.
  //
  //  🔴 IL N'APPARAÎT QUE SI L'ON A UNE CANNE, et c'est tout l'intérêt : une
  //     carte de butin qui OUVRE UN TYPE DE NŒUD pour le reste du voyage vaut
  //     mieux que dix objets. Le cran de la canne décide de la table, donc des
  //     espèces : la Méga Canne ne donne pas les mêmes poissons que la Canne.
  //
  //  🔴 IL LUI FAUT DE L'EAU, ET C'EST LE ROM QUI DIT OÙ. Deux zones seulement
  //     déclarent `eau` dans nos tables : s'y adosser aurait rendu la pêche
  //     invisible. Le ROM, lui, indexe la pêche par CARTE — « ROUTE_4 »,
  //     « CERULEAN_CITY » — et nos étapes portent le lieu de PokeAPI,
  //     « kanto-route-4 ». Le pont tient en une ligne, et il apparie 19 lieux
  //     sur 47, répartis du premier acte au dernier. Mesuré avant d'écrire.
  // ═══════════════════════════════════════════════════════════════════════════
  function cleCarte(lieu) {
    return String(lieu || "").replace(/^kanto-/, "").toUpperCase().replace(/-/g, "_");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA PÊCHE SUIT LE MONDE  [20/08/2026]
  //
  //  🔴 CES DEUX FONCTIONS LISAIENT `W.POKE_PECHE` EN GLOBALE, c'est-à-dire la
  //     table de KANTO, quel que soit le monde joué. Le `parCarte` de Kanto ne
  //     nomme aucun lieu de Johto : `onPecheIci` y répondait NON partout, et
  //     **aucun nœud de pêche n'était jamais créé**. Pendant ce temps
  //     `POKE_GEN2_PECHE` — trente-neuf groupes, corrects — n'était lu par
  //     personne. Mesuré : 66 espèces atteignables sur 251 à Johto, contre 139
  //     sur 151 à Kanto, et UNE capture en médiane par voyage.
  //  🔑 UNE SEULE PORTE : le registre. Il rend la table du monde posé, et ces
  //     deux fonctions cessent de savoir qu'il y a deux mondes.
  // ═══════════════════════════════════════════════════════════════════════════
  function tableDuMonde() {
    return (W.PokeRegles && W.PokeRegles.peche && W.PokeRegles.peche()) || W.POKE_PECHE || {};
  }

  function tablePeche(objet, lieu) {
    var pe = tableDuMonde();
    if (objet === "OLD_ROD") return pe.canne || [];
    if (objet === "GOOD_ROD") return pe.bonne || [];
    // La Méga Canne change de table selon la carte : c'est la règle du ROM, et
    // c'est ce qui fait qu'on ne pêche pas la même chose à Parmanie qu'à Azuria.
    var mega = pe.mega || {};
    var groupe = (mega.parCarte || {})[cleCarte(lieu)];
    return (groupe && (mega.groupes || {})[groupe]) || [];
  }

  // Y a-t-il de l'eau ici ? La table de la Méga Canne fait autorité : elle ne
  // nomme que des cartes où l'on peut vraiment lancer une ligne.
  function onPecheIci(lieu) {
    var mega = tableDuMonde().mega || {};
    return !!(mega.parCarte || {})[cleCarte(lieu)];
  }

  function noeudPeche(etape, partie, h, acteCourant, rangee, total) {
    var objet = W.PokeButin.canneDe(partie);
    if (!objet || !onPecheIci(etape.lieu)) return null;
    var zone = zonePour(etape, partie, h);
    var table = tablePeche(objet, etape.lieu);
    if (!table.length) return null;
    // L'annonce nomme les espèces : c'est elle qui fait choisir ce nœud plutôt
    // qu'un autre, exactement comme pour les herbes.
    var vus = {}, annonce = [];
    for (var i = 0; i < table.length && annonce.length < 3; i++) {
      if (vus[table[i].n]) continue;
      vus[table[i].n] = true;
      annonce.push({ n: table[i].n, taux: Math.round(100 / table.length) });
    }
    return {
      type: "peche", etape: etape.id, zone: zone ? zone.id : null, lieu: etape.lieu,
      canne: objet,
      rencontres: h.entre(2, 3),
      // 🔴 LA PÊCHE ÉTAIT LE SEUL COMBAT HORS DE TOUTE RAMPE (13/08). Tables
      //    canon nues : +24 à +53 d'écart médian sous la tête du joueur, du
      //    Magicarpe N.5 servi à une équipe N.47. Même contrat que les herbes
      //    (v552) : visé et dose estampillés ICI, le canon reste un plancher,
      //    un nœud d'avant l'estampille joue au canon. La même dose que les
      //    herbes, toujours (4 depuis le 13/08 au soir).
      vise: niveauDeRangee(acteCourant, partie, rangee, total),
      dose: 4,
      annonce: annonce,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE NŒUD D'ARBRE — LE COUP DE BOULE DE 1999
  //
  //  🔴 SEPT ESPÈCES N'EXISTENT QUE LÀ. Capumain, Scarhino, Pomdepik, Foretress,
  //     Caratroc, Noeunoeuf et Noadkoko ne sont dans AUCUNE haute herbe, dans
  //     aucune eau, dans aucune table de pêche de Johto : la seconde génération
  //     les met dans les arbres qu'on secoue et les rochers qu'on brise, et
  //     nulle part ailleurs. Sans ce nœud, sept lignées sont décoratives dans
  //     le Pokédex — la classe de défaut n°1 du dossier, à sept exemplaires.
  //
  //  🔑 C'EST LE NŒUD DE PÊCHE, AUTREMENT ADRESSÉ. Même boucle de rencontres,
  //     même rampe, même estampille : on ne réinvente pas une mécanique qui
  //     existe et qui est mesurée. Ce qui change est la TABLE, et l'endroit où
  //     l'on a le droit de la lire.
  //
  //  ⚠️ DEUX TABLES PAR JEU — commune et rare. Le ROM les écrit à la suite, et
  //     les fondre rendrait Scarhino aussi banal qu'un Piafabec. La rare sort
  //     une fois sur dix, comme dans la cartouche.
  //  ⚠️ ET LE ROCHER PASSE AVANT L'ARBRE. Irisia porte les deux ; le rocher n'y
  //     donne que Krabby et Caratroc, et Caratroc n'est nulle part ailleurs.
  //     L'ordre décide donc de ce qui est atteignable, pas d'un goût.
  // ═══════════════════════════════════════════════════════════════════════════
  var ARBRES = function () {
    var r = W.PokeRegles;
    return (r && r.arbres && r.arbres()) || null;
  };

  function jeuArbreDe(etape) {
    var A = ARBRES();
    if (!A || !etape) return null;
    var cle = (A.rochers || {})[etape.id];
    var genre = "rocher";
    if (!cle) { cle = (A.etapes || {})[etape.id]; genre = "arbre"; }
    if (!cle || !A.jeux || !A.jeux[cle]) return null;
    return { cle: cle, genre: genre, jeu: A.jeux[cle] };
  }

  function onSecoueIci(etape) { return !!jeuArbreDe(etape); }

  // La table servie à une rencontre : la rare une fois sur dix.
  function tableArbre(etapeId, rare) {
    var l = ETAPES() || [], e = null;
    for (var i = 0; i < l.length; i++) if (l[i].id === etapeId) e = l[i];
    var g = jeuArbreDe(e);
    if (!g) return [];
    return (rare ? g.jeu.rare : g.jeu.commun) || [];
  }

  function noeudArbre(etape, partie, h, acteCourant, rangee, total) {
    var g = jeuArbreDe(etape);
    if (!g) return null;
    var table = g.jeu.commun || [];
    if (!table.length) return null;
    // L'annonce : ce que le nœud DIT contenir, comme partout ailleurs. Un nœud
    // qui ne dit pas ce qu'il porte est un nœud qu'on ne choisit pas.
    var vus = {}, annonce = [], somme = 0, i;
    for (i = 0; i < table.length; i++) somme += table[i].poids || 0;
    for (i = 0; i < table.length && annonce.length < 3; i++) {
      if (vus[table[i].n]) continue;
      vus[table[i].n] = true;
      annonce.push({ n: table[i].n, taux: somme ? Math.round((table[i].poids * 100) / somme) : 0 });
    }
    return {
      type: "arbre", genre: g.genre, etape: etape.id, lieu: etape.lieu,
      rencontres: h.entre(2, 3),
      vise: niveauDeRangee(acteCourant, partie, rangee, total),
      dose: 4,
      annonce: annonce,
      entraine: entraine(annonce),
    };
  }

  // Le niveau qu'un acte attend : celui du Champion qui le ferme, moins la
  // marge d'un dresseur de bord de route.
  // 🔴 LU SUR L'ARÈNE, JAMAIS ÉCRIT EN DUR. Une échelle recopiée ici
  //    divergerait dès qu'une équipe de Champion bouge — et le tirage se
  //    remettrait à envoyer des adversaires hors de portée sans que rien ne le
  //    dise.
  function niveauDeReference(acte) {
    if (!acte) return 10;
    if (acte.ligue) {
      // 🔴 MÊME PORTE QUE LE PLAFOND DU DERNIER ACTE (`PokeActes.hautDeLaLigue`).
      //    Cette boucle recopiait le calcul, et elle en oubliait la moitié : le
      //    RIVAL, dont l'as est le plus haut niveau des cinq combats, et la
      //    montée de la Ligue. La route de l'acte 9 se calibrait donc sur un
      //    sommet plus bas que le vrai — exactement la divergence que l'en-tête
      //    de cette fonction s'interdit deux lignes plus haut.
      return (W.PokeActes && W.PokeActes.hautDeLaLigue) ? W.PokeActes.hautDeLaLigue(0) : 0;
    }
    for (var i = 0; i < ARENES().length; i++) {
      if (ARENES()[i].ordre !== acte.boss) continue;
      var max = 0, eq = ARENES()[i].equipe;
      for (var j = 0; j < eq.length; j++) max = Math.max(max, eq[j].niveau);
      // ❌ NE PAS Y AJOUTER `monteeChampion` — ESSAYÉ ET MESURÉ LE 16/08.
      //    L'argument est séduisant : cette boucle rend le niveau du ROM quand
      //    le combat sert le niveau monté (+11 à +20), donc la route paraît
      //    calibrée treize niveaux trop bas, et `marche` (plus bas) tombe à 1,
      //    c'est-à-dire l'acte le plus COURT possible. J'ai fait la correction.
      //    Résultat sur 300 voyages : **8 badges 12,6 % → 19,4 %** et l'arène 8
      //    de 83 % à **94 %** de victoires. La carte s'allongeait de deux
      //    rangées et rendait bien plus d'expérience qu'elle n'ajoutait de
      //    danger — l'inverse exact du mandat du jour.
      //  🔑 `monteeChampion` EST UN LEVIER QUI VISE LE CHAMPION, PAS LE MONDE.
      //    Le Champion est un PIC au-dessus de sa route ; monter la route avec
      //    lui supprime le pic et paie le joueur pour la peine. Ce que la route
      //    doit suivre, c'est le canon.
      // Un dresseur de route reste sous le Champion : c'est lui l'épreuve.
      return Math.max(3, max - 1);
    }
    return 10;
  }

  // L'exposant de la rampe d'un acte. En dessous de 1, elle monte vite puis
  // s'aplatit sous le mur — c'est le profil MESURÉ de la progression réelle.
  var RAMPE_EXP = 1.0;
  //  🔴 LA RAMPE SE RÈGLE PAR MONDE — 20/08/2026, et c'est une MESURE, pas un
  //     goût. Les dresseurs de Cristal sont plus durs que ceux de Rouge à
  //     niveau de rangée égal : livrer les vrais dresseurs de Johto avec la
  //     rampe de Kanto fait tomber les captures de 5 à 2 en médiane sur 300
  //     voyages. Le joueur meurt plus tôt, donc il attrape moins, donc le mode
  //     entier — « ce que tu attrapes reste » — cesse de donner.
  //  🔑 ON RÈGLE LA ROUTE, JAMAIS LE MUR. Les niveaux d'arène sont des données
  //     du ROM ; c'est la pente qui y mène qui nous appartient. Un exposant
  //     plus grand creuse le début d'acte et laisse le joueur monter avant de
  //     rencontrer la résistance.
  //  ⚠️ 1,3 EST LE PIED DU PLATEAU, PAS UN CHIFFRE QUI FAIT PASSER UN TEST.
  //     A/B à monde constant, 300 voyages par valeur, captures en médiane :
  //       1,0 → 2   ·   1,3 → 3   ·   1,6 → 3   ·   2,0 → 3
  //     La réponse s'aplatit à 1,3 : au-delà on creuse le début d'acte sans
  //     rien rendre de plus. On prend donc la plus PETITE valeur qui atteint le
  //     plateau — c'est le seul point de la courbe qui ne soit pas arbitraire.
  //  ⚠️ ET JOHTO RESTE PLUS DUR QUE KANTO : 3 captures contre 5. C'est la
  //     cartouche, pas un réglage — les dresseurs de Cristal frappent plus fort
  //     à niveau égal. On ne les affaiblit pas ; on donne au joueur la place de
  //     monter avant de les rencontrer.
  var RAMPE_MONDE = { gen2: 1.3, gen3: 1.6 };
  function rampe() {
    var cle = W.PokeRegles && W.PokeRegles.courante ? W.PokeRegles.courante() : null;
    return (cle && RAMPE_MONDE[cle]) || RAMPE_EXP;
  }

  // Le niveau de la tête d'équipe, au moment où la carte se génère.
  function niveauTete(partie) {
    var max = 0, eq = (partie && partie.equipe) || [];
    for (var i = 0; i < eq.length; i++) max = Math.max(max, eq[i].niveau || 0);
    return max || 5;   // le starter part au niveau 5
  }

  // La rampe d'un acte : du niveau d'entrée jusqu'à celui du Champion.
  //  `rangee` est l'index de la rangée courante, `total` le nombre de rangées
  //  avant le boss. La dernière rangée se joue à un niveau sous le Champion :
  //  assez pour préparer, jamais assez pour rendre l'arène facile.
  function niveauDeRangee(acte, partie, rangee, total) {
    var entree = niveauTete(partie);
    var mur = niveauDeReference(acte);
    if (total <= 1) return Math.max(3, mur);
    // 🔴 LA RAMPE ÉTAIT CREUSE, ET LA MESURE DIT LE CONTRAIRE (13/08). Le
    //    pow 1.8 du 07/08 supposait un joueur qui monte lentement en début
    //    d'acte ; relevé sur 300 voyages, il monte VITE — tête médiane 14 au
    //    milieu de l'acte 1 quand la rangée visait 8, et +2 à +5 d'écart sur
    //    les dresseurs de tous les actes. Les herbes servent 2 à 4 combats
    //    par nœud, un dresseur rend une fois et demie un sauvage : le début
    //    d'acte nourrit. La rampe suit donc la mesure, pas l'intuition :
    //    l'exposant est dosé par A/B à monde constant (300 voyages × 2
    //    politiques) contre le témoin 1.8 — voir `--rival=` et la table
    //    « LA ROUTE FACE À LA TÊTE » du harnais.
    var part = Math.pow(Math.min(1, (rangee + 1) / total), rampe());
    return Math.max(3, Math.round(entree + (mur - entree) * part));
  }

  function noeudDresseur(etape, partie, h, acteCourant, rangee, total) {
    // 🔴 ON NE TIRE QUE DES MÉTIERS. Le vivier prenait TOUTES les entrées de
    //    `POKE_EQUIPES` — or le ROM y range aussi les Champions, le Conseil 4,
    //    Giovanni, le Professeur Chen et le rival, parce qu'il n'a qu'une seule
    //    table. Résultat vu à l'écran par le propriétaire : « Blaine · 4
    //    Pokémon » sur la Route 2, alors que Blaine tient l'Arène de Cramois'Île
    //    à l'autre bout de Kanto. Ce n'était pas un défaut de texte, c'était une
    //    faute de canon.
    //    `POKE_CLASSES` porte le tri : `route` dit ce qui a le droit d'être
    //    croisé au hasard.
    //  ⚠️ MÊME PORTE ICI. Le tri lisait lui aussi la table de 1996 : la corriger
    //     à l'endroit du tirage sans la corriger à l'endroit du TRI aurait
    //     laissé les classes de Kanto décider quels dresseurs Johto peut poser.
    var tableEq = EQUIPES() || {};
    var classes = [];
    for (var c in tableEq) {
      var meta = CLASSES()[c];
      if (!meta || !meta.route) continue;
      var eq = tableEq[c];
      if (eq && eq.length && eq[0] && eq[0].length) classes.push(c);
    }
    if (!classes.length) return null;

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 L'ÉQUIPE ADVERSE SE CHOISIT PAR LE NIVEAU DE L'ACTE, PAS AU HASARD.
    //    Le tirage prenait n'importe quelle équipe de la classe — y compris
    //    celles de fin de partie. Mesuré le 07/08 : l'acte 1 lançait quatre
    //    Pokémon sur un Salamèche niveau 5, qui perdait, ne gagnait AUCUNE
    //    expérience, et se présentait niveau 5 devant l'Onix niveau 14 de
    //    Pierre. Zéro badge sur tous les voyages simulés.
    //    Le défaut n'était pas dans les chiffres du combat : il était dans le
    //    TIRAGE. On vise donc le niveau que l'acte attend, et on prend la plus
    //    proche — sans jamais exclure une classe, pour que la variété reste.
    // ═══════════════════════════════════════════════════════════════════════

    // 🔴 ET ON CHOISIT PARMI TOUTES LES PAIRES CLASSE/ÉQUIPE, pas dans une
    //    classe tirée d'abord. Tirer la classe en premier puis sa meilleure
    //    équipe donnait « Rocker, 4 Pokémon niveau 21 » sur la Route 1 : c'est
    //    la plus FAIBLE équipe que cette classe possède. Le tri doit voir tout
    //    le vivier, sinon il choisit le moins mauvais d'un mauvais paquet.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 UNE RAMPE, PAS UN TAPIS ROULANT — arbitrage du 07/08/2026.
    //
    //    Premier essai : caler les dresseurs sur le NIVEAU DU JOUEUR. Mesuré :
    //    il arrivait N.10 devant l'Onix N.14 de Pierre, sur tous les voyages.
    //    Normal — un adversaire qui suit le joueur ne le fait jamais monter.
    //    C'est un tapis roulant : on court et on reste au même endroit.
    //
    //    Le problème est de LEVEL DESIGN, pas de chiffres de combat. Le jeu
    //    d'origine donne une route entière avant Pierre ; ici l'acte offre cinq
    //    nœuds. La route doit donc MENER AU MUR : le premier nœud se joue au
    //    niveau où l'on entre dans l'acte, le dernier au niveau du Champion
    //    moins un, et on interpole entre les deux. Un joueur qui prend les cinq
    //    nœuds arrive prêt ; un joueur pressé arrive court — c'est exactement
    //    l'arbitrage que la carte à embranchements doit produire.
    //
    //    🔴 LES NIVEAUX DES ARÈNES NE BOUGENT PAS. Ce sont des données du ROM et
    //       le brief exige le canon. On règle LA ROUTE, jamais LE MUR.
    // ═══════════════════════════════════════════════════════════════════════
    var vise = niveauDeRangee(acteCourant, partie, rangee, total);

    var candidats = [];
    for (var ci = 0; ci < classes.length; ci++) {
      //  🔴 PAR LA PORTE DU MONDE. Cette ligne lisait `W.POKE_EQUIPES` — la
      //     table de 1996 — et c'est ce qui a fait qu'un voyage entier de Johto
      //     n'opposait que des Pokémon de Kanto, du premier nœud au dernier.
      var toutes = (EQUIPES() || {})[classes[ci]];
      for (var e = 0; e < toutes.length; e++) {
        var eq = toutes[e];
        if (!eq || !eq.length) continue;
        var max = 0;
        for (var k = 0; k < eq.length; k++) max = Math.max(max, eq[k].niveau);
        // Un écart pondéré : être TROP FORT est plus grave qu'être trop faible,
        // parce qu'un joueur battu ne progresse pas du tout.
        var d = max > vise ? (max - vise) * 2 : (vise - max);
        candidats.push({ classe: classes[ci], equipe: eq, ecart: d });
      }
    }
    if (!candidats.length) return null;
    candidats.sort(function (a, b) { return a.ecart - b.ecart; });
    // On tire parmi les plus proches, pas systématiquement le premier : sinon
    // le joueur croise dix fois le même dresseur sur un voyage.
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE PREMIER DRESSEUR ALIGNAIT DEUX OU TROIS POKÉMON CONTRE UN SEUL.
    //     Rapporté par le propriétaire — « premier duel, tu te fais exploser,
    //     les joueurs vont rage quit » — puis mesuré : un starter niveau 5
    //     SEUL gagne **48,6 %** du temps contre le dresseur de la première
    //     rangée, qui en aligne 2 dans 51 % des cas et 3 dans 49 %.
    //     Un pile ou face sur le premier combat, et la défaite emporte le
    //     voyage entier.
    //     *Le premier combat d'un roguelite n'enseigne rien s'il se perd une
    //     fois sur deux : il apprend seulement que le jeu est injuste.*
    //
    //  ⚠️ LA BORNE NE VAUT QUE POUR LA PREMIÈRE RANGÉE DU PREMIER ACTE — le
    //     seul moment où le joueur est structurellement SEUL, avant d'avoir pu
    //     croiser une herbe. Partout ailleurs la courbe ne bouge pas : un
    //     correctif qui déborde de son cas n'est plus un correctif.
    //  ⚠️ On ne baisse ni le niveau ni les statistiques : la difficulté reste,
    //     c'est le NOMBRE qui cesse d'être une exécution.
    //  ⚠️ AUCUN TIRAGE EN PLUS : on filtre la liste, `h.entier` est appelé une
    //     fois comme avant. Le rejeu serveur ne bouge pas d'un cran.
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 ET LE FILTRE PASSE AVANT LA FENÊTRE D'ÉCART, PAS APRÈS. Posé après,
    //     il ne trouvait rien : sur 378 équipes de dresseur, **70 n'ont qu'un
    //     Pokémon mais trois seulement sont de niveau ≤ 8**, et aucune ne
    //     tombait dans la fenêtre des plus proches. Le correctif était écrit,
    //     branché, et sans effet — la mesure n'avait pas bougé d'un dixième.
    //     *Un filtre posé après une sélection ne filtre que ce qu'elle a
    //     laissé passer.*
    var cleCourante = W.PokeRegles && W.PokeRegles.courante ? W.PokeRegles.courante() : "gen1";
    var maxRangeeSolo = cleCourante === "gen3" ? 1 : 0;
    if (rangee <= maxRangeeSolo && partie && partie.equipe && partie.equipe.length) {
      var miens = partie.equipe.length;
      var courts = candidats.filter(function (c) { return c.equipe.length <= miens; });
      if (courts.length) candidats = courts;
    }
    var lot = candidats.filter(function (c) { return c.ecart <= candidats[0].ecart + 3; });
    var choisi = lot[h.entier(lot.length)];
    var classe = choisi.classe, equipe = choisi.equipe;
    // 🔴 LE VIVIER PLAFONNE, LA SÉLECTION NE PEUT RIEN (13/08). Mesuré sur 300
    //    voyages : les dresseurs de route rendent +9 à l'acte 8 et +23 à
    //    l'acte 9 d'écart MÉDIAN sous la tête du joueur — les tables du ROM
    //    s'arrêtent où le ROM s'arrête, et choisir « la moins mauvaise » d'un
    //    vivier trop bas reste trop bas. On DÉCALE l'équipe choisie d'un bloc
    //    pour que son as atteigne le visé : les écarts internes du ROM
    //    survivent, jamais vers le bas, et l'estampille reste à la génération
    //    — le nœud annonce ce qu'on affrontera, le rejeu ne bouge pas.
    // ⚠️ EN COPIE : `POKE_EQUIPES` est partagée, la muter monterait ce
    //    dresseur pour tous les voyages suivants.
    var as = 0;
    for (var q = 0; q < equipe.length; q++) as = Math.max(as, equipe[q].niveau);
    // ═══════════════════════════════════════════════════════════════════════
    //  L'ÉVOLUTION S'APPLIQUE À TOUS, PLUS SEULEMENT AUX HISSÉS — 17/08/2026
    //
    //  🔴 RAPPORT D'IHSÂN : « j'ai quasi tout OS avec mon dracaufeu et je me
    //     suis pas servi du reste ». Ce n'est PAS un écart de niveau — ils sont
    //     serrés, mesurés, 5,3 niveaux en moyenne sous le Champion. C'est un
    //     écart d'ESPÈCE : un starter en forme finale vaut 534 de base, un
    //     Rattata 253. À niveau égal, le second meurt en un coup, et aucune
    //     couverture de type ne sert jamais.
    //  🔴 ET LA RÈGLE EXISTAIT DÉJÀ, À MOITIÉ. `especeAuNiveau` était appelée
    //     UNIQUEMENT dans la branche « l'équipe est trop faible, on la hisse ».
    //     Or la sélection choisit justement l'équipe dont l'as colle au visé :
    //     la branche ne se déclenchait donc pas, et l'on servait un Rattata de
    //     niveau 30 — le niveau du ROM, l'espèce du ROM, et vingt-cinq niveaux
    //     de retard sur sa propre table d'évolution.
    //  ✅ Un Pokémon servi au-dessus de son palier est servi ÉVOLUÉ, hissé ou
    //     non. Ce n'est pas un bonus inventé : c'est la table d'évolution du
    //     jeu appliquée aux adversaires comme elle l'est au joueur.
    //  ⚠️ ON NE TOUCHE NI AU NIVEAU NI AU NOMBRE. Le mur ne bouge pas, les
    //     Champions non plus (canon) : seule la ROUTE cesse d'aligner des
    //     bébés Pokémon en fin de partie.
    //  ⚠️ AUCUN TIRAGE : `especeAuNiveau` est un pur calcul de table. Le rejeu
    //     ne bouge pas d'un cran, et l'estampille reste à la génération.
    // ═══════════════════════════════════════════════════════════════════════
    var decale = as < vise ? vise - as : 0;
    equipe = equipe.map(function (x) {
      var niv = Math.min(100, x.niveau + decale);
      return { n: W.PokeMoteur.especeAuNiveau(x.n, niv), niveau: niv };
    });
    return {
      type: "dresseur", etape: etape.id, lieu: etape.lieu,
      classe: classe,
      equipe: equipe,
      gain: 300 + equipe.length * 250,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UN OBJET TROUVÉ SUIT L'ACTE — ET IL EST RESTÉ FIGÉ À L'ACTE 1
  //
  //  🔴 CE NŒUD DONNAIT DEUX À CINQ POKÉ BALLS, À L'ACTE 1 COMME À L'ACTE 9.
  //     La carte de butin, elle, suit l'avancement depuis toujours
  //     (`butin.js` : Hyper Ball à partir de l'acte 6, Super Ball à partir du
  //     3). Deux endroits qui donnent exactement la même chose, deux échelles :
  //     c'est la divergence que ce dossier paye à chaque fois qu'une règle est
  //     écrite deux fois.
  //
  //  🔴 ET C'EST CE QUI REND LES OISEAUX INATTEIGNABLES. Mesuré à l'instant où
  //     un légendaire paraît : bourse médiane **16 258 ₽**, **zéro Ball en
  //     main**, 58 % les mains vides. Les actes 8 et 9 n'ont AUCUNE boutique —
  //     ce sont des donjons, et c'est le canon : la Centrale et les Îles Écume
  //     n'ont pas de comptoir. Le seul ravitaillement possible y est donc
  //     l'objet ramassé au sol, exactement comme en 1996 — et il rendait des
  //     Poké Balls contre un taux de capture de 3 sur 255.
  //     Résultat : Artikodin 6,6 %, Électhor 1,7 %, **Sulfura 0 sur 64**.
  //
  //  ✅ On reprend l'échelle de `butin.js`, à l'identique. Aucun seuil inventé :
  //     ceux-là sont déjà mesurés et déjà en service ailleurs.
  //  ⚠️ Les quantités ne bougent PAS. Ce qui manquait n'est pas le nombre, c'est
  //     la QUALITÉ : cinq Poké Balls valent moins qu'une Hyper Ball sur un
  //     oiseau, et vingt n'y changeraient rien.
  // ═══════════════════════════════════════════════════════════════════════════
  //  ⚠️ `pourLaChasse` : le ravitaillement posé avant un légendaire, là où le
  //     canon interdit un comptoir (la Centrale et les Îles Écume n'ont pas de
  //     Poké Mart). Les trois lots deviennent des Balls — un lot de Potions
  //     serait une porte ouverte qui ne donne pas ce pour quoi elle existe, et
  //     c'est le demi-câblage que ce dossier refuse. Le tirage est CONSERVÉ :
  //     même nombre d'appels au hasard, le flux ne se décale pas.
  function noeudObjet(etape, partie, h, pourLaChasse) {
    var acte = (partie && partie.acte) || 1;
    var ball = acte >= 6 ? "ULTRA_BALL" : acte >= 3 ? "GREAT_BALL" : "POKE_BALL";
    var soin = acte >= 6 ? "HYPER_POTION" : acte >= 3 ? "SUPER_POTION" : "POTION";
    var lots = pourLaChasse ? [
      { objet: ball, n: h.entre(5, 8) },
      { objet: ball, n: h.entre(6, 9) },
      { objet: ball, n: h.entre(4, 7) },
    ] : [
      { objet: ball, n: h.entre(2, 5) },
      { objet: acte >= 3 ? ball : "GREAT_BALL", n: h.entre(1, 3) },
      { objet: soin, n: h.entre(1, 3) },
    ];
    return { type: "objet", etape: etape.id, lieu: etape.lieu, lot: h.dans(lots) };
  }

  function noeudCentre(etape) {
    return { type: "centre", etape: etape.id, lieu: etape.lieu };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE RAYON RARE — CE QUI DONNE ENFIN UN EMPLOI À L'ARGENT
  //
  //  🔴 LA BOUTIQUE NE VENDAIT QUE DES CONSOMMABLES. Balls, potions, remèdes,
  //     repousses : l'étal canon des villes, fidèle et sans décision. On
  //     achetait ce qu'on pouvait, l'argent s'accumulait, et deux serments et
  //     un sceau qui jouent sur l'argent ne pesaient donc sur rien.
  //
  //  🔴 CE QU'ON AJOUTE EXISTE DÉJÀ DANS LA DONNÉE, ET C'EST DU CANON : le
  //     grand magasin de Céladopole vend les VITAMINES (9 800 ₽), les PIERRES
  //     d'évolution (2 100 ₽) et des CT. Les trois portes sont câblées depuis
  //     le premier jour — `employerVitamine`, `employerPierre`, `apprendreCT`.
  //     Il manquait un endroit où les acheter.
  //  🔴 UNE VITAMINE COÛTE PLUS QUE TOUT LE RESTE DE L'ÉTAL RÉUNI, et c'est le
  //     but : elle transforme l'argent en statistique définitive, comme
  //     l'entraînement au Centre. Le joueur arbitre enfin entre survivre
  //     maintenant et être plus fort ensuite.
  //
  //  ⚠️ LE TIRAGE SE FAIT ICI, À LA CRÉATION DU NŒUD, ET UNE SEULE FOIS.
  //     L'écran de boutique se redessine à chaque achat : y tirer le rayon
  //     aurait consommé des tirages à chaque clic — et changé l'étal sous les
  //     doigts du joueur. Le nœud porte donc son rayon, comme les herbes
  //     portent leur annonce.
  //  ⚠️ PAS AVANT L'ACTE 4. Un rayon à 9 800 ₽ devant un joueur qui en a 3 000
  //     n'est pas une tentation, c'est une porte fermée — et le grand magasin
  //     n'ouvre pas non plus au début du jeu d'origine.
  // ═══════════════════════════════════════════════════════════════════════════
  var VITAMINES = ["HP_UP", "PROTEIN", "IRON", "CARBOS", "CALCIUM"];
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 LES DEUX MONDES NE NOMMENT PAS LA MÊME PIERRE PAREIL. Kanto la range
  //     sous `THUNDER_STONE`, Johto sous `THUNDERSTONE` — sans tiret bas. Le
  //     rayon vendait la clé de Kanto DANS JOHTO : le joueur payait, et il
  //     recevait une clé qui n'existe pas dans la table du monde. D'où un objet
  //     absent du sac et introuvable au moment de faire évoluer.
  //  ⚠️ Signalé par Totor le 21/08 : « je choisis ce choix et elle n'apparaît
  //     pas dans l'inventaire — et impossible de la donner à mon Pikachu ».
  //     Les trois autres pierres portent le MÊME nom des deux côtés : c'est
  //     pour ça que le signalement ne parle que de la Foudre. Une clé sur
  //     quatre qui diverge suffit à faire passer le défaut pour un cas isolé.
  //  🔑 Même famille que `poke-objet-a-un-nom`, qui avait déjà pris cette
  //     divergence — mais sur le NOM AFFICHÉ seulement. La donnée était juste
  //     et l'écran repliait sur la clé ; ici c'est l'OBJET DONNÉ qui est faux,
  //     donc rien à lire du tout. Réparer l'étiquette n'avait pas réparé l'objet.
  //  ⚠️ On résout contre la table du monde COURANT, pas contre une seconde
  //     liste écrite à la main : une table qui gagne une pierre la voit servie
  //     sans qu'on y revienne. Repli sur les clés de Kanto si la table manque —
  //     un rayon vide vaut mieux qu'un plantage, mais il ne doit pas arriver.
  // ═══════════════════════════════════════════════════════════════════════════
  var PIERRES_CANON = [["FIRE_STONE"], ["THUNDER_STONE", "THUNDERSTONE"],
                       ["WATER_STONE"], ["LEAF_STONE"]];
  var OBJETS_T = function () {
    return (W.PokeRegles && W.PokeRegles.objetsTable && W.PokeRegles.objetsTable()) ||
           W.POKE_OBJETS || null;
  };
  var PIERRES = function () {
    var t = OBJETS_T();
    if (!t) return ["FIRE_STONE", "THUNDER_STONE", "WATER_STONE", "LEAF_STONE"];
    var out = [];
    for (var i = 0; i < PIERRES_CANON.length; i++) {
      for (var j = 0; j < PIERRES_CANON[i].length; j++) {
        if (t[PIERRES_CANON[i][j]]) { out.push(PIERRES_CANON[i][j]); break; }
      }
    }
    return out.length ? out : ["FIRE_STONE", "THUNDER_STONE", "WATER_STONE", "LEAF_STONE"];
  };

  //  🔴 UN COMPTOIR SE TIENT DANS UNE VILLE, ET IL PORTAIT LE LIEU DE SA
  //     RANGÉE. Un QA l'a vu à l'écran : l'étal de l'acte 7 s'annonçait
  //     « Iles Ecume » — un donjon, que le canon laisse sans Poké Mart, et
  //     dans lequel Artikodin est censé être le seul habitant notable.
  //     `acte.boutique` dit vrai (l'acte TRAVERSE une ville qui a un
  //     comptoir), mais le nœud héritait de la zone de sa rangée. On lui donne
  //     la ville de l'acte, qui est précisément l'étape porteuse du comptoir.
  //  ⚠️ On ne conditionne PAS le tirage à `etape.boutique` : `boutique` vit sur
  //     l'étape VILLE, jamais sur les zones traversées — mesuré, cette voie-là
  //     supprime tous les comptoirs du jeu, sur les neuf actes.
  function noeudBoutique(etape, acte, partie, h) {
    if (acte && acte.ville) etape = { id: etape.id, lieu: acte.ville };
    // 🔴 CE NŒUD PORTAIT UN `niveau: acte.boutique` QUE PERSONNE NE LISAIT.
    //    L'étal se décide par la progression du joueur (`martPour`), une seule
    //    fois, dans `ecranBoutique` — un second niveau posé ici était une
    //    deuxième source de vérité pour la même décision, et la classe la plus
    //    coûteuse du dossier. `acte.boutique` garde son seul rôle réel :
    //    dire si une boutique peut APPARAÎTRE dans cet acte.
    var n = { type: "boutique", etape: etape.id, lieu: etape.lieu };
    var num = (partie && partie.acte) || 1;
    if (num >= 4 && h) {
      // ⚠️ DEUX ARTICLES, PAS TROIS. J'avais ajouté une CT tirée au sort — et
      //    la vendre demande de CHOISIR à qui l'enseigner, donc un écran de
      //    plus. J'avais commencé par une entrée qui ne rendait rien : c'est
      //    exactement le demi-câblage que ce dossier refuse. Une vitamine et
      //    une pierre suffisent à donner un emploi à l'argent ; la CT viendra
      //    avec son écran, ou pas du tout.
      var pierres = PIERRES();
      n.rare = [
        VITAMINES[h.entier(VITAMINES.length)],
        pierres[h.entier(pierres.length)],
      ];
    }
    return n;
  }

  // 🔴 UNE ÉTAPE PEUT PORTER PLUSIEURS SCÈNES, ET ELLES DOIVENT TOUTES SORTIR.
  //    Céladopole donne une clé, tient le Casino ET offre Évoli ; Cramois'Île
  //    ranime le fossile ET propose trois échanges. Les fondre en un seul nœud
  //    « scène » en aurait fait disparaître deux sur trois — c'est exactement
  //    ainsi que douze espèces sont devenues injoignables.
  function scenesDe(etape, partie) {
    var out = [];
    // 🔴 ET `libereErrants` EN FAIT UNE SCÈNE. La Tour Calcinée ne donne
    //    aucune clé et n'a pas de Rocket : sans cette condition, elle n'était
    //    pas une scène, donc pas un nœud, donc les trois bêtes n'étaient
    //    jamais libérées. C'est la même faute que le Musée d'Argenta et le
    //    Dojo de Safrania — écrits, gréés, posés sur aucune carte — et le
    //    commentaire de `actes.js` la raconte déjà.
    if ((etape.donne && etape.donne.length) || etape.rocket || etape.libereErrants) {
      out.push({ type: "scene", etape: etape.id, lieu: etape.lieu,
        donne: etape.donne || [], rocket: etape.rocket || 0,
        // 🔴 CE QUI CHANGE LE MONDE VOYAGE AVEC LE NŒUD. La Tour Calcinée
        //    libère les trois bêtes de Johto ; sans ce champ, l'étape le
        //    déclarait et le nœud ne le portait pas — la scène se serait jouée
        //    sans rien libérer, et les errants seraient restés une donnée.
        libereErrants: !!etape.libereErrants });
    }
    // ── LE PARC SAFARI ───────────────────────────────────────────────────────
    // 🔴 IL EXISTAIT COMME ÉTAPE ET NE SORTAIT QUE COMME HERBES ORDINAIRES. Ses
    //    règles propres — `tenterSafari`, `fuit`, l'appât et le caillou —
    //    vivaient dans `capture.js`, exportées, jamais appelées : la sixième
    //    mécanique morte du mode. Et le Parc porte HUIT espèces qu'on ne trouve
    //    nulle part ailleurs : Kangourex, Insécateur, Scarabrute, Tauros,
    //    Rhinocorne, Noeunoeuf, Nidorina, Nidorino. Sans lui, la collection
    //    plafonne en silence.
    if (/safari/i.test(etape.id)) {
      out.push({ type: "safari", etape: etape.id, lieu: etape.lieu, tables: etape.tables || [] });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  LE CAMION — LA RUMEUR LA PLUS CÉLÈBRE DE LA SÉRIE, RENDUE VRAIE
    //
    //  🔴 EN 1996, DES MILLIERS DE JOUEURS ONT SOULEVÉ CE CAMION. La rumeur
    //     disait que Mew dormait dessous ; le camion existe vraiment dans le
    //     ROM, et il n'y a jamais rien eu. C'est le seul mythe que tout joueur
    //     de la première génération connaît — et le rendre VRAI, une fois, à
    //     une condition que personne n'atteint par hasard, vaut mieux que
    //     n'importe quel légendaire de plus.
    //
    //  🔴 LE NŒUD EXISTE TOUJOURS, MÊME QUAND IL NE DONNE RIEN. C'est ce qui
    //     fait le mythe : on le croise à chaque voyage, il dit ce qu'il voit,
    //     et un jour il ne dit plus la même chose. Un contenu qui n'apparaît
    //     qu'une fois la condition remplie ne serait pas un mythe — ce serait
    //     une récompense qu'on n'a jamais vue venir.
    //     Ses trois états se lisent dans `PokeDepart.mythe`, porte unique.
    // ═══════════════════════════════════════════════════════════════════════
    if (etape.camion) {
      out.push({ type: "camion", etape: etape.id, lieu: etape.lieu, espece: 151 });
    }
    // 🔴 LA PENSION ÉTAIT DÉCLARÉE ET MUETTE. `route-5` porte `pension: true`
    //    depuis le premier jour, et aucun nœud n'en sortait.
    if (etape.pension) out.push({ type: "pension", etape: etape.id, lieu: etape.lieu });
    // 🔴 IDEM POUR LES JOURNAUX DU MANOIR : `journalMewtwo: true` était posé sur
    //    Cramois'Île sans un mot derrière. C'est la lore la plus célèbre de la
    //    première génération — d'où vient Mewtwo — et elle n'existait pas.
    if (etape.journalMewtwo) out.push({ type: "journal", etape: etape.id, lieu: etape.lieu });
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE RONFLEX ÉTAIT INATTRAPABLE, ET UN OUTIL LE CACHAIT. `ronflex: true`
    //     est posé sur les routes 12 et 16 depuis le premier jour, le scénario
    //     a sa phrase — « Un Ronflex dort en travers de la route. Il ne bougera
    //     pas seul. » — et il n'existait NI table de rencontre, NI nœud, NI
    //     échange, NI cadeau. Pire : `poke-injoignable` l'ajoutait d'office aux
    //     espèces obtenables, donc le seuil du camion annonçait 150 quand il
    //     n'y en avait que 149. Un contrôle qui SUPPOSE au lieu de mesurer
    //     fabrique la certitude qu'il devrait détruire.
    //  ⚠️ Un seul essai, comme un légendaire : c'est une rencontre unique du
    //     jeu d'origine, pas une zone où l'on repasse.
    // ═══════════════════════════════════════════════════════════════════════
    //  LES RENCONTRES POSÉES À LA MAIN
    //
    //  🔴 KANTO EN A UNE, JOHTO EN A SEPT, ET LE CODE N'EN CONNAISSAIT QU'UNE.
    //     Le nœud s'appelait « ronflex » et lisait `W.POKE_RONFLEX` : un nom de
    //     cas particulier, donc un plafond à un seul cas. Simularbre en travers
    //     de la route 36, le Lokhlass des Caves Jumelles, le Léviator rouge du
    //     Lac Colère et les Voltorbe du repaire Rocket font tous exactement la
    //     même chose — une rencontre unique, posée par le scénario.
    //  ⚠️ LE TYPE RESTE « ronflex ». L'écran, le rejeu et les sauvegardes en
    //     cours le connaissent sous ce nom ; le renommer aujourd'hui casserait
    //     les voyages ouverts pour un gain d'esthétique. Le champ `espece` dit
    //     déjà LEQUEL, et c'est lui que tout le monde lit.
    var sta = STATIQUES();
    for (var st = 0; st < sta.length; st++) {
      if (sta[st].etape !== etape.id) continue;
      out.push({ type: "ronflex", etape: etape.id, lieu: etape.lieu,
                 espece: sta[st].n, niveau: sta[st].niveau || 0 });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  LE CONCOURS DE CAPTURE D'INSECTES
    //
    //  🔴 IL FERME LE DERNIER TROU NON CANON DE JOHTO. Insécateur et Scarabrute
    //     ne s'attrapent NULLE PART ailleurs dans Cristal : sans le Concours,
    //     deux espèces restaient hors de portée pour une mécanique absente, pas
    //     par choix de conception.
    //  ⚠️ IL SE POSE SUR SON ÉTAPE, comme un œuf, et pas sur un jour de la
    //     semaine : le jeu d'origine le tient mardi, jeudi et samedi, or un
    //     voyage n'a pas de calendrier. La traduction est écrite dans le
    //     générateur ; ici on lit seulement l'étape qu'elle désigne.
    // ═══════════════════════════════════════════════════════════════════════
    var conc = CONCOURS();
    if (conc && conc.etape === etape.id) {
      out.push({ type: "concours", etape: etape.id, lieu: etape.lieu });
    }
    // 🔴 UN NŒUD QUI N'A RIEN À OFFRIR NE SE POSE PAS. `etape.fossile` vit sur
    //    le Mont Sélénite ; Johto déclare `fossiles: null`, donc la liste y est
    //    VIDE — et le nœud sortait quand même, sur un écran qui annonce « tu
    //    n'en prendras qu'un » et n'offrait aucun bouton. Cul-de-sac : le
    //    joueur devait revenir à l'accueil et reprendre son voyage.
    //  ⚠️ On demande à la MÊME porte que l'écran, pas à `etape.fossile` seul :
    //    la donnée qui décide l'affichage doit décider l'existence du nœud.
    if (etape.fossile && FOSSILES_DISPO().length) {
      out.push({ type: "fossile", etape: etape.id, lieu: etape.lieu });
    }
    if (etape.fossileRanime) out.push({ type: "ranimation", etape: etape.id, lieu: etape.lieu });
    if (etape.casino) out.push({ type: "casino", etape: etape.id, lieu: etape.lieu });
    // ⚠️ UN ŒUF SE POSE SUR SON ÉTAPE, PAS SUR UN LIEU. Celui de Togepi se
    //    donne au Centre de Mauville, l'Œuf Étrange à la Pension de la route
    //    34 : deux endroits qui ne sont ni des villes ni des donjons au sens
    //    de la carte. C'est la seule scène de Johto qui n'existe pas à Kanto.
    var oe = OEUFS();
    for (var oi = 0; oi < oe.length; oi++) {
      if (oe[oi].etape !== etape.id) continue;
      out.push({ type: "oeuf", etape: etape.id, lieu: etape.lieu, oeuf: oe[oi].cle,
                 niveau: oe[oi].niveau || 5, table: oe[oi].table || [] });
    }
    // Les échanges et les cadeaux se lisent dans les données du ROM, pas dans
    // un drapeau posé à la main sur l'étape.
    var ech = ECHANGES().filter(function (e) { return e.etape === etape.id; });
    if (ech.length) {
      out.push({ type: "echange", etape: etape.id, lieu: etape.lieu, offres: ech });
    }
    // ⚠️ Un cadeau se rattache à un LIEU, et deux étapes peuvent partager le
    //    même — Céladopole et le repaire de la Team Rocket sont tous deux à
    //    `celadon-city`. Sans cette borne, Évoli sortait deux fois : une vraie
    //    fois, puis un nœud « c'est passé » qui n'apporte rien. On le pose dans
    //    la VILLE, là où le jeu d'origine le met.
    //  🔴 ET « VILLE » NE SUFFIT PAS. Safrania a DEUX étapes de catégorie ville
    //     — la ville et son arène — au même lieu : le cadeau de Lokhlass y
    //     sortait deux fois. On le pose sur la PREMIÈRE étape ville du lieu,
    //     une seule, décidée par la donnée et non par un cas particulier écrit
    //     à la main. Le correctif d'Évoli avait traité la scène ; celui-ci
    //     traite le vrai cas général.
    //  🔴 ET UN CADEAU DE JOHTO N'EST PAS EN VILLE. Minidraco se donne au fond
    //     de l'Antre du Dragon, Debugant au Mont Creuset, le Piafabec « KENYA »
    //     à un poste de garde de la route 35 : trois endroits que la règle
    //     ci-dessus écarte, puisqu'elle exige une catégorie « ville ». Écrite
    //     pour Kanto, elle était juste pour Kanto — et elle aurait fait
    //     disparaître les trois quarts des cadeaux de 1999 sans un mot.
    //     Un cadeau qui porte une ÉTAPE va sur cette étape, sans autre règle :
    //     l'ambiguïté que `premiereVilleDu` résout n'existe pas pour lui.
    var tousCad = CADEAUX();
    var cad = tousCad.filter(function (c) { return c.etape && c.etape === etape.id; });
    if (!cad.length) {
      cad = etape.categorie !== "ville" || !premiereVilleDu(etape) ? [] :
        tousCad.filter(function (c) { return !c.etape && c.lieu === etape.lieu; });
    }
    if (cad.length) {
      out.push({ type: "cadeau", etape: etape.id, lieu: etape.lieu, offres: cad });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  LE DOJO — LE SEUL CHOIX EXCLUSIF DU JEU D'ORIGINE
    //
    //  🔴 Kicklee et Tygnon ne sont dans aucune table de rencontre : sans le
    //     Dojo, deux espèces sur 151 étaient hors d'atteinte, et le seuil du
    //     camion — 150 prises — devenait impossible. Le mythe de Mew tenait
    //     derrière une porte murée.
    //  ⚠️ Même règle que le cadeau : la PREMIÈRE ville du lieu, sinon Safrania
    //     et son arène le posent tous les deux.
    // Le Musée d'Argenta : on y ramasse le Vieil Ambre, et rien d'autre. Il ne
    // se ranime qu'à Cramois'Île — la plus longue dette du voyage.
    var amb = AMBRE();
    if (amb && amb.lieu === etape.lieu &&
        etape.categorie === "ville" && premiereVilleDu(etape)) {
      out.push({ type: "musee", etape: etape.id, lieu: etape.lieu, espece: amb.n });
    }
    var doj = DOJO();
    if (doj && doj.lieu === etape.lieu &&
        etape.categorie === "ville" && premiereVilleDu(etape)) {
      out.push({ type: "dojo", etape: etape.id, lieu: etape.lieu, choix: doj.choix.slice(),
                 niveau: doj.niveau });
    }
    return out;
  }

  // La première étape de catégorie « ville » d'un lieu — celle qui porte ce que
  // le jeu d'origine met « en ville » : les cadeaux, le Dojo. L'ordre du
  // fichier `voyage.js` fait foi, comme partout ailleurs dans le mode.
  function premiereVilleDu(etape) {
    var l = ETAPES() || [];
    for (var i = 0; i < l.length; i++) {
      if (l[i].categorie !== "ville" || l[i].lieu !== etape.lieu) continue;
      return l[i].id === etape.id;
    }
    return false;
  }

  function noeudLegendaire(etape) {
    // 🔴 UN SEUL ESSAI, et le nœud le DIT. Un légendaire qui s'enfuit est perdu
    //    pour la partie — le silence, ici, se lirait comme un bug.
    return { type: "legendaire", etape: etape.id, lieu: etape.lieu, espece: etape.legendaire };
  }

  function noeudBoss(acte) {
    if (acte.ligue) return { type: "ligue", lieu: acte.ville };
    var a = null;
    for (var i = 0; i < ARENES().length; i++) if (ARENES()[i].ordre === acte.boss) a = ARENES()[i];
    return a ? { type: "boss", arene: a.ordre, lieu: acte.ville } : null;
  }

  // ── La génération ───────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 UN IDENTIFIANT DE NŒUD PORTE SON ACTE. Ils s'appelaient « r0n0 », « r1n1 »,
  //    « boss » — donc les mêmes à chaque acte, neuf fois par voyage. Trois
  //    conséquences, toutes silencieuses :
  //      · le premier nœud de l'acte 2 s'affichait « déjà pris », parce que
  //        `noeudsVisites` gardait celui de l'acte 1 ;
  //      · la Vitrine annonçait « nœuds visités » en comptant des CLÉS, donc
  //        une trentaine au maximum pour un voyage entier — un chiffre faux
  //        montré au joueur ;
  //      · et toute fermeture de branche posée par identifiant aurait fermé, à
  //        l'acte suivant, un nœud parfaitement neuf.
  //    Le préfixe règle les trois d'un coup.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA ZONE D'UNE RANGÉE — PORTE UNIQUE
  //
  //  🔴 LA ZONE ÉTAIT CHOISIE PAR L'INDICE DE LA RANGÉE, BORNÉ AU DERNIER.
  //     Conséquence : toute zone d'indice supérieur au nombre de rangées
  //     n'apparaissait JAMAIS — `route-7` et `route-15` ne sont sorties aucune
  //     fois sur 200 voyages. On RÉPARTIT donc les zones sur toute la longueur
  //     de l'acte : chacune reçoit sa part des rangées, et l'on traverse
  //     toujours les zones dans l'ordre.
  //  ⚠️ SORTIE DE LA BOUCLE parce qu'un SECOND appelant est arrivé — le
  //     comptoir posé avant une chasse. Deux copies de cette répartition
  //     auraient mis le comptoir dans une autre zone que ses voisins de
  //     rangée, et personne ne l'aurait vu.
  // ═══════════════════════════════════════════════════════════════════════════
  function zoneDeLaRangee(zones, acte, r, rangees) {
    if (!zones.length) return acte.zones[0] || null;
    var iz = Math.min(zones.length - 1, Math.floor((r * zones.length) / Math.max(1, rangees)));
    return zones[iz] || null;
  }

  function generer(acte, partie, h) {
    if (!acte) return { rangees: [] };
    var prefixe = "a" + (acte.n || 0) + ":";
    var zones = acte.zones.slice();
    var scenes = acte.scenes.slice();
    var legendaires = acte.legendaires.slice();

    // ═══════════════════════════════════════════════════════════════════════
    //  LA CHASSE À MEW SE POSE ICI, ET NULLE PART AILLEURS
    //
    //  🔴 ELLE EMPRUNTE L'ÉTAPE D'UNE ZONE DE L'ACTE plutôt que d'inventer un
    //     lieu. Mew n'a pas d'adresse dans le canon — c'est tout son mythe — et
    //     un nœud sans nom de lieu afficherait un identifiant brut, ce que le
    //     mode interdit. Il apparaît donc « à » un endroit réel du chemin, et
    //     le joueur lit un nom qu'il connaît.
    //  ⚠️ L'acte est décidé au DÉPART (`partie.mewActe`), pas ici : une carte
    //     se régénère quand on y revient, et un tirage posé à la génération
    //     ferait apparaître ou disparaître la chasse d'un rechargement à
    //     l'autre. C'est la faute que la v468 a corrigée sur l'essai unique.
    //  ⚠️ Et on ne la pose que si l'acte a une zone : sans zone, pas de lieu.
    // ═══════════════════════════════════════════════════════════════════════
    var myth = MYTH();
    if (myth && partie && partie.mew && zones.length && !(partie.legendaires || {})[myth.n] &&
        (partie.mewTraces || 0) >= (W.PokePartie.MEW_TRACES || 3)) {
      //  🔴 L'ADRESSE DU CANON D'ABORD, L'EMPRUNT ENSUITE. Celebi se tient au
      //     sanctuaire du Bois aux Chenes, et il ne se montre que dans l'acte
      //     qui le traverse. Mew n'a pas d'adresse : il emprunte, comme avant.
      var lieuMyth = null;
      if (myth.lieu) {
        for (var iz = 0; iz < zones.length; iz++) {
          if (zones[iz].lieu === myth.lieu) { lieuMyth = zones[iz]; break; }
        }
      } else {
        lieuMyth = zones[0];
      }
      if (lieuMyth) {
        legendaires.push({ id: lieuMyth.id, lieu: lieuMyth.lieu, legendaire: myth.n });
      }
    }

    // Le nombre de rangées suit la richesse de l'acte : un acte court ne
    // s'étire pas artificiellement.
    // 🔴 LES SCÈNES SONT DÉPLIÉES D'ABORD. Une étape peut en porter plusieurs
    //    (Céladopole : une clé, le Casino, Évoli), et l'acte doit être assez
    //    long pour toutes les poser — sinon la dernière disparaît en silence,
    //    ce qui est précisément le défaut qu'on répare.
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE VERROU DÉCLARÉ N'ÉTAIT APPLIQUÉ NULLE PART. `voyage.js` pose
    //     `exige: ["surf"]` sur seize étapes, `exigeBadges` sur deux,
    //     `apresLigue` sur une — et `pokeOuverture()`, écrite pour les lire,
    //     n'était appelée par PERSONNE. Une porte morte : exportée, jamais
    //     franchie. L'ordre canon du fichier faisait le travail à sa place,
    //     donc rien ne se voyait — jusqu'au jour où quelqu'un déplace une
    //     étape et découvre les Îles Écume sans Surf.
    //  🔴 ET ON NE L'APPLIQUE PAS. Essayé le 09/08, mesuré, retiré dans la
    //     minute : filtrer les scènes par `pokeOuverture` fait DISPARAÎTRE le
    //     cadeau de Lokhlass, parce que Safrania exige la boisson — et sur une
    //     carte à embranchements, la branche qui donne la boisson PEUT NE PAS
    //     AVOIR ÉTÉ PRISE. Un verrou canon suppose un chemin unique ; ici il n'y
    //     en a pas. Appliqué, il fabriquerait des actes sans Champion, c'est-à-
    //     dire exactement le blocage dur que ce mode a déjà payé une fois.
    //     `exige` reste donc ce qu'il est devenu : la DOCUMENTATION du canon,
    //     lue par l'outillage de portée, pas une serrure de partie.
    var aVivre = [];
    for (var s = 0; s < scenes.length; s++) aVivre = aVivre.concat(scenesDe(scenes[s], partie));

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LE RIVAL BARRE LA ROUTE, UNE FOIS PAR ACTE. Ses huit équipes vivaient
    //    dans les données et une seule sortait — la dernière, à la Ligue. Sept
    //    combats écrits dans le ROM et jamais joués, alors que c'est LUI qui
    //    donne un adversaire au voyage : quelqu'un qui part en même temps, qui
    //    prend le Pokémon qui bat le nôtre, et qui revient plus fort.
    // 🔴 IL SE POSE COMME UNE SCÈNE, PAS COMME UN NŒUD DE PLUS. Ainsi il compte
    //    dans la longueur de l'acte — sans quoi il volerait sa place à une
    //    herbe ou à un dresseur, et l'acte perdrait un nœud sans le dire.
    //    Il reste donc une BRANCHE parmi deux ou trois : on peut l'éviter, en
    //    laissant son argent et son expérience de l'autre côté du chemin.
    //    Les sept premières rencontres se répartissent sur les actes 1 à 8 ; la
    //    huitième est celle de la Ligue et ne passe pas par la carte.
    if (acte.n >= 1 && acte.n <= 7) {
      aVivre.push({
        type: "rival", etape: acte.ville || null, lieu: acte.ville || null,
        rencontre: acte.n - 1,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LA LONGUEUR D'UN ACTE SUIT LA MARCHE À MONTER — arbitrage du 07/08.
    //
    //    Elle suivait le nombre de ZONES traversées, ce qui n'a aucun rapport
    //    avec la difficulté. Mesuré : l'acte 1 offrait cinq nœuds pour passer
    //    du niveau 5 à l'Onix niveau 14 de Pierre. En cinq nœuds il faut faire
    //    DEUX métiers — monter son équipe ET la composer pour couvrir le type
    //    du Champion. C'est un de trop : la médiane restait à un badge.
    //
    //    Un acte dure donc ce que coûte sa marche. L'acte 1 demande neuf
    //    niveaux, il est long ; l'acte 8 en demande sept sur des Pokémon déjà
    //    hauts, il est court. La borne haute tient le voyage sous l'heure :
    //    neuf actes de neuf rangées au pire, c'est quatre-vingts nœuds.
    //
    //    🔴 ON RÈGLE LA ROUTE, JAMAIS LE MUR. Les équipes de Champion sont des
    //       données du ROM et le brief exige le canon.
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 CE QUE LA MESURE DIT DU MUR DE KOGA — 07/08, 300 voyages en politique
    //    compétente. Devant chaque Champion, le joueur arrive avec +2 à +7,7
    //    niveaux d'avance et gagne entre 28 et 87 % du temps. Devant KOGA
    //    seul : −2,3 niveau et DIX pour cent.
    //
    //    Ce n'est ni le combat ni les objets — j'ai éprouvé les deux. C'est la
    //    marche : les Champions montent de 14, 21, 24, 29, puis QUARANTE-TROIS.
    //    Passer d'Erika à Koga demande quatorze niveaux quand tous les autres
    //    pas en demandent trois à sept. C'est la courbe du ROM, où l'on
    //    traverse entre-temps la Tour Pokémon, la tour Silph et quatre routes.
    //
    //    🔴 J'AI ESSAYÉ DE MONTER LE PLAFOND À QUATORZE RANGÉES : pas un
    //       chiffre n'a bougé. La raison tient à cette règle même — elle
    //       compte la marche en NIVEAUX, or un niveau à 40 coûte trois fois un
    //       niveau à 15. Allonger l'acte de deux rangées ne rend pas deux
    //       niveaux à ce stade. Le plafond n'était donc pas le coupable, et un
    //       réglage qu'aucune mesure ne justifie n'a rien à faire ici.
    //
    //    La vraie correction touche la courbe d'expérience ou la longueur du
    //    voyage — dans les deux cas elle change le RYTHME de tout le mode, et
    //    la règle du projet est formelle : aucune modification d'équilibrage
    //    sans validation. Elle est donc posée, mesurée, et laissée au choix.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 UN ACTE EST AU MOINS AUSSI LONG QU'IL A DE ZONES. Sans ce plancher,
    //    la répartition ci-dessous en écrase deux ou trois dans la même rangée
    //    et l'acte perd la moitié de sa géographie. C'est ce qui avait fait
    //    disparaître `route-7` et `route-15`.
    var marche = Math.max(1, niveauDeReference(acte) - niveauTete(partie));
    // ═══════════════════════════════════════════════════════════════════════
    //  LE PLANCHER MONTE EN FIN DE VOYAGE — « pas assez long » (retours des
    //  joueurs, 16/08)
    //
    //  🔴 LA LONGUEUR D'UN ACTE SUIT `marche`, C'EST-À-DIRE L'ÉCART AU
    //     CHAMPION — et cet écart se referme précisément à la fin. Mesuré :
    //       acte  1   2   3   4   5   6   7   8   9
    //       rang. 8,7 6,0 8,0 9,0 8,0 9,0 **5,0** **4,9** **4,9**
    //     Les trois derniers actes tombaient au plancher. Un joueur au niveau
    //     du Champion voyait donc le jeu RACCOURCIR au moment où il aurait dû
    //     s'étoffer, et un voyage complet tenait en 27 rangées et ~73 combats
    //     — « 34 minutes » chronométrées sur le premier parcours complet.
    //  ✅ Le plancher passe à SIX à partir de l'acte 5. Ce n'est pas un cadeau
    //     d'expérience : depuis le 16/08 le joueur est BORNÉ par le plafond de
    //     l'acte (67, 67, 70, 81), donc des rangées de plus n'ajoutent plus des
    //     niveaux — elles ajoutent des combats, du butin, et des occasions de
    //     mourir. C'est exactement ce qui manquait.
    //  ⚠️ CE RÉGLAGE N'AURAIT RIEN VALU AVANT LES PLAFONDS. Le dossier avait
    //     d'ailleurs mesuré « deux rangées de plus : aucun chiffre n'a bougé »
    //     à l'époque où rien ne bornait la montée — les rangées se
    //     convertissaient en niveaux, pas en danger.
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    //  ET LE PLANCHER VAUT SIX PARTOUT  [21/08/2026]
    //
    //  🔴 LA LONGUEUR D'UN ACTE SE DÉDUIT DE `marche`, L'ÉCART AU CHAMPION —
    //     et Johto a des Champions plus bas que Kanto. Albert ferme l'acte 1 au
    //     niveau 9 là où Pierre le ferme à 14 : la marche vaut 4 au lieu de 9,
    //     et l'acte 1 de Johto sortait à CINQ rangées contre NEUF.
    //     Mesuré sur 300 voyages, plancher à 4 : le joueur arrivait devant
    //     Albert avec **2,1 Pokémon au niveau 9,2** contre un Champion à 9,0 —
    //     et perdait quatre fois sur cinq. **67 % des voyages mouraient à
    //     l'acte 1**, contre 19 % à Kanto, et le monde rendait 2 captures en
    //     médiane contre 5.
    //
    //  🔑 LA CAUSE N'EST PAS LE NIVEAU, C'EST L'ÉQUIPE. Un acte court donne
    //     assez d'expérience pour suivre un Champion faible, mais pas assez de
    //     RENCONTRES pour composer une équipe — 3,0 contre 5,8 à Kanto, donc
    //     personne à opposer au type du Champion (couverture 1 %). La marche
    //     mesure un écart de niveau ; elle ne sait pas qu'il faut aussi des
    //     Pokémon.
    //
    //  ⚖️ MESURÉ, PAS CHOISI. 300 voyages, règle « voyage », politique
    //     « optimal » :
    //        plancher   8 badges   Ligue   badges méd.   captures   actes   morts a.1
    //          4 (av.)     6,3 %    5,8 %      0 / 8         2       1 / 9     67 %
    //          6  SIGNÉ   11,2 %    8,3 %      2 / 8         7       3 / 9     40 %
    //          7          18,4 %   13,6 %      2 / 8         9       3 / 9     34 %
    //        Kanto        12,6 %    1,5 %      2 / 8         5       3 / 9     19 %
    //     Six aligne Johto sur Kanto SANS le dépasser ; sept le rend plus facile
    //     que le monde de référence, ce qui n'est pas le sujet.
    //
    //  ✅ ET C'EST UNE RÈGLE GÉNÉRALE, PAS UN `if (gen2)`. Vérifié sur Kanto :
    //     12,6 → 13,1 % de 8 badges, 5 captures dans les deux cas, mêmes actes
    //     franchis. Ses actes dépassent déjà six rangées par la marche — le
    //     plancher ne les touche pas. Un cas particulier écrit pour un monde
    //     aurait menti sur la cause ; celui-ci la nomme.
    // ═══════════════════════════════════════════════════════════════════════
    var plancher = 6;
    var rangees = Math.max(plancher, Math.min(9, Math.max(marche, aVivre.length + 1, zones.length)));
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 « EXPRESS » NE FAISAIT PLUS RIEN, ET RAPPORTAIT 25 % DE SCORE.
    //     Sa phrase promet « moitié moins de jours » — un compteur supprimé
    //     avec la refonte de la carte. Depuis, la règle ne touchait PLUS RIEN :
    //     `partie.js` la lit à un seul endroit, `score()`, pour multiplier par
    //     1,25. Un joueur qui la choisissait faisait un voyage normal avec un
    //     quart de score en plus. Ce n'est pas une règle, c'est un cadeau
    //     déguisé en contrainte — et il serait parti tel quel à l'ouverture.
    //  ✅ ON LUI REND SA PROMESSE plutôt que de la retirer : moitié moins de
    //     rangées par acte. Le raccourci se paie en expérience et en butin —
    //     deux fois moins de nœuds pour le même Champion —, ce qui justifie
    //     enfin son multiplicateur.
    //  ⚠️ Le plancher reste à TROIS : en dessous, une scène du canon ou le
    //     ravitaillement d'avant chasse n'aurait plus où se poser, et l'acte
    //     deviendrait injouable au lieu d'être court.
    // ═══════════════════════════════════════════════════════════════════════
    if (partie && partie.regle === "express") {
      rangees = Math.max(3, Math.max(aVivre.length + 1, Math.ceil(rangees / 2)));
    }
    var out = [];

    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 UN COMPTOIR AVANT LA CHASSE — ET C'EST UNE CORRECTION DE MESURE.
    //
    //     Relevé sur 300 voyages, à l'instant précis où un légendaire paraît :
    //     **bourse médiane 16 258 ₽, et ZÉRO Ball en main** — 58 % des chasses
    //     se font les mains vides. Cent pour cent des joueurs avaient de quoi
    //     payer une Hyper Ball ; aucun n'avait où l'acheter. Un second relevé
    //     l'a dit sans détour : **75 % des chasses n'ont aucun étal avant elles
    //     dans leur acte**, la boutique n'étant qu'un tirage de poids 8.
    //     Résultat : Artikodin 6,6 %, Électhor 1,7 %, **Sulfura 0 sur 64**.
    //
    //     La carte annonçait pourtant tout — le nom, « un seul essai », les
    //     Balls qu'on a, de quoi l'endormir. C'est la forme de défaut que ce
    //     mode traque partout : *un conseil que sa propre distribution rend
    //     inapplicable*. Et l'argent des trois derniers actes était mort.
    //
    //  ✅ L'étal se POSE, il ne se tire pas — même raison que les scènes du
    //     canon deux lignes plus bas : ce qui doit sortir ne se laisse pas à un
    //     poids de 8 sur 98. On le met dans la rangée qui PRÉCÈDE la chasse.
    //  ⚠️ IL RESTE UNE BRANCHE PARMI DEUX OU TROIS, jamais un passage obligé.
    //     La décision qu'on crée est « je me prépare ou je m'entraîne », et
    //     c'est le genre de décision qu'on veut — pas un couloir.
    //  ⚠️ Rien avant l'acte 4 : `acte.boutique` garde son mot, et un oiseau ne
    //     paraît de toute façon qu'aux actes 7 à 9.
    // ═══════════════════════════════════════════════════════════════════════
    var rangeeEtal = legendaires.length ? Math.max(1, rangees - 2) : -1;

    for (var r = 0; r < rangees; r++) {
      var largeur = r === 0 ? 2 : h.entre(2, 3);
      var rangee = [];
      var vus = {};

      // 🔴 UNE SCÈNE PASSE AVANT LE REMPLISSAGE. Le fossile, la Team Rocket, la
      //    Poké Flûte : ce sont les moments du canon, ils ne doivent jamais
      //    tomber au hasard du tirage — sinon ils ne sortent pas, et c'est le
      //    défaut que `poke-injoignable` traque depuis le mode Dragon Ball.
      if (aVivre.length && r > 0) {
        var scenePosee = aVivre.shift();
        // 🔴 « MON SALAMÈCHE EST NIVEAU 11, LE POKÉMON DE MON RIVAL NIVEAU 5,
        //    C'EST PAS NORMAL » (proprio, 12/08). Le rival était le SEUL
        //    dresseur hors de la rampe : son équipe sort des tables canon
        //    (première rencontre : N.5, écrite pour un joueur qui n'a pas
        //    encore combattu) pendant que sa rangée vise 9-11. On estampille
        //    donc le visé de SA rangée, comme les herbes (v552) : la rencontre
        //    montera au max(canon, visé − 2) — un cran au-dessus des sauvages,
        //    jamais sous son canon. Une scène d'avant l'estampille n'a pas de
        //    `vise` : elle joue au canon, le rejeu ne bouge pas.
        if (scenePosee.type === "rival" || scenePosee.rocket) {
          //  Le rival ET les scènes Rocket (12/08) : leur combat vise la rampe
          //  de LEUR rangée, estampillée ici — même contrat que les herbes.
          scenePosee.vise = niveauDeRangee(acte, partie, r, rangees);
        }
        rangee.push(scenePosee);
      }
      if (legendaires.length && r === rangees - 1) {
        rangee.push(noeudLegendaire(legendaires.shift()));
      }
      // Le comptoir qui rend la chasse préparable. Il prend la zone de sa
      // rangée, comme n'importe quel nœud — la MÊME répartition que plus bas,
      // sortie ici pour que les deux ne puissent pas diverger.
      if (r === rangeeEtal) {
        var etapeEtal = zoneDeLaRangee(zones, acte, r, rangees);
        if (etapeEtal) {
          // 🔴 ET LÀ OÙ LE CANON REFUSE UN COMPTOIR, ON RAMASSE PAR TERRE.
          //    Les actes 8 et 9 déclarent `boutique: 0` — la Centrale et les
          //    Îles Écume sont des donjons, il n'y a pas de ville. Mesuré : ce
          //    sont EXACTEMENT les deux actes où l'on arrive à zéro Ball, et
          //    Sulfura finissait 54 fois sur 62 en « victoire » — c'est-à-dire
          //    abattu par un joueur qui n'avait rien pour le prendre, et pas
          //    une seule fois en défaite. Un contenu qu'on ne peut que tuer.
          //    Le jeu de 1996 y répond par les objets au sol ; nous aussi.
          // 🔴 ET LE COMPTOIR TOMBAIT DANS LES ÎLES ÉCUME — UN DONJON. Ma
          //    première version lisait `acte.boutique`, qui est le MEILLEUR
          //    étal de tout l'acte : à l'acte 7 il vaut 3 parce que
          //    Cramois'Île en a un, et l'étal se posait donc dans la zone de
          //    la rangée, qui n'en a pas. Un supermarché en pleine grotte,
          //    dans un mode dont la loi est de suivre le canon.
          //    C'est la zone de la RANGÉE qui décide, pas la moyenne de l'acte.
          var nEtal = acte.boutique
            ? noeudBoutique(etapeEtal, acte, partie, h)
            : noeudObjet(etapeEtal, partie, h, true);
          rangee.push(nEtal);
          vus[nEtal.type] = true;
        }
      }

      while (rangee.length < largeur) {
        // ═══════════════════════════════════════════════════════════════════
        // 🔴 LA ZONE ÉTAIT CHOISIE PAR L'INDICE DE LA RANGÉE, BORNÉ AU DERNIER.
        //    Conséquence : toute zone d'indice supérieur au nombre de rangées
        //    n'apparaissait JAMAIS. Un acte de sept rangées avec neuf zones en
        //    perdait deux — silencieusement, sans qu'aucun écran ne s'en
        //    plaigne. Mesuré sur 200 voyages : `route-7` (acte 4) et
        //    `route-15` (acte 6) n'étaient sorties AUCUNE fois.
        //    Et au-delà du décompte, c'est la faute que le mode traque partout
        //    ailleurs : du contenu qui existe sans jamais servir.
        //
        //    On RÉPARTIT donc les zones sur toute la longueur de l'acte, au
        //    lieu de les indexer une à une : chacune reçoit sa part des
        //    rangées, et la progression géographique reste lisible — on
        //    traverse toujours les zones dans l'ordre.
        // ═══════════════════════════════════════════════════════════════════
        var etape = zoneDeLaRangee(zones, acte, r, rangees);
        if (!etape) break;
        // ═══════════════════════════════════════════════════════════════════
        //  LE MUR DE KOGA — TRANCHÉ LE 09/08 EN CONCEPTION DE NIVEAU
        //
        //  🔴 LE DÉFAUT, MESURÉ. Les Champions montent de 14, 21, 24, 29, puis
        //     QUARANTE-TROIS. Passer d'Erika à Koga demande quatorze niveaux
        //     quand tous les autres pas en demandent trois à sept — et chaque
        //     acte offrait le MÊME contenu : ~20 combats, ~5,5 dresseurs.
        //     Résultat : c'est la seule arène qu'on aborde EN DESSOUS du
        //     Champion (−2 à −3), et la seule à 3 % de victoires. La moitié
        //     des voyages s'y arrêtent, donc ne voient jamais les actes 6 à 9.
        //
        //  🔴 CE QUI A DÉJÀ ÉTÉ ESSAYÉ ET REJETÉ. Monter le plafond de rangées
        //     à quatorze : pas un chiffre n'a bougé — un niveau à 40 coûte
        //     trois fois un niveau à 15, deux rangées de plus ne rendent pas
        //     deux niveaux. Baisser l'équipe de Koga : refusé, le canon est la
        //     loi du mode. Monter l'expérience partout : le début va bien
        //     (75 %, 68 %), on casserait ce qui marche.
        //
        //  🔴 LA DÉCISION : LA DENSITÉ DE DRESSEURS SUIT LA MARCHE À FRANCHIR.
        //     C'est la forme du ROM lui-même — entre Erika et Koga on traverse
        //     le repaire de la Team Rocket, la Tour Pokémon et la tour Silph,
        //     c'est-à-dire des DRESSEURS en enfilade, pas des herbes. Un nœud
        //     de dresseur donne deux ou trois adversaires au niveau de l'acte,
        //     et l'expérience d'un dresseur vaut une fois et demie celle d'un
        //     sauvage : il rend de l'expérience là où une rangée de plus n'en
        //     rendait pas.
        //  🔴 ET ELLE SE DÉRIVE, ELLE NE SE RÈGLE PAS. `marche` est déjà
        //     calculé pour la longueur de l'acte : le même nombre décide de la
        //     densité. Un acte à +3 ne bouge pas ; l'acte de Koga passe à
        //     environ deux fois et demie plus de dresseurs. Aucun chiffre
        //     inventé pour un acte en particulier.
        //  ⚠️ VALIDATION HUMAINE REQUISE. Le simulateur dit la DIRECTION, pas
        //     la vérité — la règle du projet interdit de calibrer sur lui seul.
        // ═══════════════════════════════════════════════════════════════════
        //  ⚠️ PREMIÈRE TENTATIVE, MESURÉE ET RETIRÉE. J'ai fait suivre la
        //     DENSITÉ DE DRESSEURS à la marche — plus de dresseurs dans l'acte
        //     qui doit franchir quatorze niveaux. Sur 300 voyages : l'arène 5
        //     est passée de 3 % à 2 % et l'arrivée de −2,1 à −2,4. Rien.
        //     La raison est arithmétique : le coût d'un niveau croît comme le
        //     CUBE du niveau (29→43 coûte 5,2 fois le pas 24→29) tandis que le
        //     gain croît linéairement. Aucune densité de contenu ne rattrape
        //     ça — ni deux rangées de plus, ni deux fois plus de dresseurs.
        //     Le levier est la COURBE, pas la carte. Voir `moteur.js`.
        var choix = h.pondere([
          { t: "herbes", poids: POIDS.herbes },
          { t: "dresseur", poids: POIDS.dresseur },
          { t: "objet", poids: POIDS.objet },
          { t: "centre", poids: r >= 1 ? POIDS.centre : 0 },
          { t: "boutique", poids: acte.boutique && r >= 1 ? poidsBoutique(partie) : 0 },
          { t: "eau", poids: POIDS.eau },
          // 🔴 LA PÊCHE NE PÈSE QUE SI L'ON A UNE CANNE ET QU'IL Y A DE L'EAU.
          //    Un poids constant aurait fait tirer un nœud impossible une fois
          //    sur dix, remplacé en silence par des herbes — c'est-à-dire une
          //    rangée moins variée sans que rien ne le dise.
          { t: "peche", poids: W.PokeButin.canneDe(partie) && onPecheIci(etape.lieu) ? POIDS.peche : 0 },
          // 🔴 L'ARBRE NE PÈSE QUE LÀ OÙ LE MONDE EN POSE UN — dix-neuf étapes
          //    de Johto, aucune à Kanto. Même garde que la pêche, et pour la
          //    même raison : un poids constant ferait tirer un nœud impossible
          //    une fois sur dix, remplacé en silence par des herbes.
          { t: "arbre", poids: onSecoueIci(etape) ? POIDS.arbre : 0 },
        ]);
        var n = null;
        if (choix.t === "herbes") n = noeudHerbes(etape, partie, h, "herbe", acte, r, rangees);
        else if (choix.t === "eau") n = noeudHerbes(etape, partie, h, "eau", acte, r, rangees);
        else if (choix.t === "peche") n = noeudPeche(etape, partie, h, acte, r, rangees);
        else if (choix.t === "arbre") n = noeudArbre(etape, partie, h, acte, r, rangees);
        else if (choix.t === "dresseur") n = noeudDresseur(etape, partie, h, acte, r, rangees);
        else if (choix.t === "objet") n = noeudObjet(etape, partie, h);
        else if (choix.t === "centre") n = noeudCentre(etape);
        else if (choix.t === "boutique") n = noeudBoutique(etape, acte, partie, h);
        // Une rangée de deux nœuds identiques n'offre aucun choix.
        if (!n || vus[n.type]) { n = noeudHerbes(etape, partie, h, "herbe", acte, r, rangees); }
        if (!n) n = noeudObjet(etape, partie, h);
        if (vus[n.type] && rangee.length) { n = noeudDresseur(etape, partie, h, acte, r, rangees) || n; }
        vus[n.type] = true;
        n.id = prefixe + "r" + r + "n" + rangee.length;
        rangee.push(n);
      }
      for (var k = 0; k < rangee.length; k++) rangee[k].id = prefixe + "r" + r + "n" + k;
      out.push(rangee);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LA TRACE — UNE PAR ACTE, POSÉE SUR UN NŒUD ORDINAIRE
    //
    //  🔴 ELLE NE CRÉE PAS DE NŒUD, ELLE EN MARQUE UN. Un nœud « trace » à
    //     part serait un détour gratuit : on le prendrait sans rien perdre
    //     puisqu'il ne remplacerait rien. Posée sur un nœud qui existe, elle
    //     met le joueur devant le seul arbitrage qui compte ici — la trace, ou
    //     ce que l'autre branche lui donnait.
    //  ⚠️ JAMAIS SUR LA DERNIÈRE RANGÉE ni sur un nœud seul : sans alternative,
    //     la trace serait offerte, et une trace offerte ne coûte rien.
    //  ⚠️ Une seule par acte : c'est ce qui fait qu'il en faut trois, donc
    //     trois actes de détours, et pas trois clics dans la même carte.
    // ═══════════════════════════════════════════════════════════════════════
    var mythT = MYTH();
    if (mythT && partie && partie.mew && !(partie.legendaires || {})[mythT.n] &&
        (partie.mewTraces || 0) < (W.PokePartie.MEW_TRACES || 3)) {
      var candidates = [];
      for (var rr = 0; rr < out.length - 1; rr++) {
        if (out[rr].length < 2) continue;
        for (var nn = 0; nn < out[rr].length; nn++) {
          if (out[rr][nn].type !== "boss" && out[rr][nn].type !== "ligue" &&
              out[rr][nn].type !== "legendaire") candidates.push(out[rr][nn]);
        }
      }
      if (candidates.length) h.dans(candidates).trace = true;
    }

    var boss = noeudBoss(acte);
    if (boss) { boss.id = prefixe + "boss"; out.push([boss]); }
    return { acte: acte.n, rangees: out };
  }

  W.PokeCarteActes = {
    POIDS: POIDS,
    tableArbre: tableArbre,
    onSecoueIci: onSecoueIci,
    generer: generer,
    // 🔴 EXPORTÉ POUR QU'IL N'Y AIT QU'UNE LISTE. `actes.js` décidait de son
    //    côté quelles étapes sont des « scènes », avec sa propre énumération de
    //    drapeaux — et deux nœuds neufs (le Musée, le Dojo) n'y figuraient pas :
    //    livrés, testables, et jamais posés sur une seule carte. On demande donc
    //    au producteur ce qu'il sait produire, au lieu de le redire ailleurs.
    scenesDe: scenesDe,
    annoncerRencontres: annoncerRencontres,
    zonePour: zonePour,
    // L'écran de pêche relit la MÊME table que le nœud : deux calculs
    // donneraient une annonce et une prise qui ne se ressemblent pas.
    tablePeche: tablePeche,
    onPecheIci: onPecheIci,
  };
})(typeof window !== "undefined" ? window : globalThis);
