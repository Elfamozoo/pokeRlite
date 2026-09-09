(function (W) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a son itinéraire, ses clés et ses zones.
  var ETAPES = function () { return (W.PokeRegles && W.PokeRegles.etapes()) || W.POKE_ETAPES || []; };
  var CLES_V = function () { return (W.PokeRegles && W.PokeRegles.clesVoyage()) || W.POKE_CLES || {}; };
  var ZONES = function () { return (W.PokeRegles && W.PokeRegles.zones()) || W.POKE_ZONES || []; };
  var LIEUX = function () { return (W.PokeRegles && W.PokeRegles.lieux()) || W.POKE_LIEUX || {}; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA PARTIE — UN VOYAGE DE DRESSEUR, DE BOURG PALETTE À LA VITRINE
  //
  //  🔴 FICHIER PUR. Aucun DOM, aucun texte affiché. Il rend des ÉVÉNEMENTS ;
  //     l'interface les met en mots, le serveur les rejoue.
  //  🔴 Tout hasard passe par la graine. Le nombre et l'ordre des tirages font
  //     partie du contrat de rejeu.
  // ═══════════════════════════════════════════════════════════════════════════

  var M = function () { return W.PokeMoteur; };
  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CANON VIENT DU MONDE, PAS DE 1996   [20/08/2026]
  //
  //  🔴 SIGNALÉ PAR UN JOUEUR LE JOUR DE L'OUVERTURE DE JOHTO : « il ne prend
  //     pas le bon starter, j'ai pris Germignon il a pris Bulbizarre ». Cette
  //     ligne valait `[1, 4, 7]` en dur — les trois de Bourg Palette — et rien
  //     ne la faisait mentir tant qu'un seul monde existait. À Johto, le rival
  //     ne trouvait donc AUCUN des trois du canon local et retombait sur
  //     Bulbizarre : le premier d'une liste qui n'était pas la sienne.
  //  🔑 `PokeRegles.canon()` est la porte, et elle existait déjà — c'est elle
  //     que l'écran du laboratoire interroge pour poser les trois cartes. Deux
  //     endroits lisaient la même chose, un seul par la porte.
  //     *Ce qui est recopié diverge*, et ici la copie était plus vieille que le
  //     monde qu'elle prétendait décrire.
  // ═══════════════════════════════════════════════════════════════════════════
  var STARTERS = function () {
    return (W.PokeRegles && W.PokeRegles.canon && W.PokeRegles.canon()) || [1, 4, 7];
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES TRACES DE MEW — IL SE MÉRITE DANS LA PARTIE, PAS AU TIRAGE
  //
  //  🔴 PREMIÈRE VERSION LIVRÉE, PUIS RETIRÉE : une loterie au départ, un
  //     voyage sur trois, annoncée en tête d'acte. Le propriétaire a demandé si
  //     c'était vraiment la meilleure solution. Non, et voici pourquoi :
  //       · aucune AGENTIVITÉ — les dés tombaient au départ, le joueur LISAIT
  //         le résultat au lieu de le provoquer ;
  //       · deux voyages sur trois étaient perdus d'avance pour qui chasse
  //         Mew : de l'attente déguisée en rareté ;
  //       · le seul geste encouragé était de RELANCER jusqu'à ce que ça tombe,
  //         pas de jouer autrement.
  //     Or toute l'identité de ce mode tient en une phrase : *prendre une
  //     branche, c'est perdre l'autre.* Une loterie n'a pas sa place dedans.
  //
  //  ✅ LA RARETÉ N'EST PLUS LE DÉ, C'EST LE PRIX. Des traces paraissent sur
  //     des nœuds ordinaires ; en prendre une coûte la branche d'à côté — la
  //     vraie monnaie du mode. Trois traces dans le même voyage ouvrent la
  //     chasse. Chasser Mew, c'est renoncer à l'entraînement dont on a besoin
  //     pour le Champion, et c'est exactement la tension que le mode sait
  //     produire.
  //  ⚠️ TROIS, PAS UNE : une seule trace serait un détour gratuit. Et pas cinq :
  //     il faut que ça reste jouable dans un voyage qu'on veut aussi finir.
  // ═══════════════════════════════════════════════════════════════════════════
  var MEW_TRACES = 3;
  // Le rival prend celui qui BAT le tien. Règle canon, et elle décide de ses
  // trois équipes dans `POKE_RIVAL`.
  var RIVAL_CONTRE = { 1: 4, 4: 7, 7: 1 };

  // ── Créer une partie ───────────────────────────────────────────────────────
  function creer(config, h) {
    // 🔴 LA VERSION EST SCELLÉE PAR LA GRAINE. Elle décide de quelles espèces
    //    sont atteignables : 78 sauvages sur 151 par version. Un Pokédex complet
    //    en une seule partie est donc impossible — c'est exactement pourquoi
    //    l'échange existait en 1996, et c'est ce qui rend le mode rejouable.
    // 🔴 LA LISTE DES VERSIONS VIENT DU JEU DE RÈGLES. Écrite ici, elle
    //    donnait « rouge » ou « bleu » à un voyage de Johto — dont les tables
    //    de rencontre ne portent ni l'une ni l'autre. Résultat mesuré avant
    //    correction : 66 espèces atteignables sur 251, et une MÉDIANE D'UNE
    //    SEULE CAPTURE par voyage. Rien ne plantait : chaque nœud d'herbe
    //    rendait simplement une liste vide.
    // 🔴 LE MONDE SE CHOISIT AU DÉPART, ET IL SE LIT ICI AVANT TOUT LE RESTE.
    //    `PokeRegles.poser` n'a lieu qu'à `prendreLaPartie`, c'est-à-dire APRÈS
    //    cet appel : lire `versions()` sans épingler d'abord rendrait « rouge »
    //    ou « bleu » à un voyage de Johto, et chaque nœud d'herbe donnerait une
    //    liste vide — la faute est décrite quatre lignes plus haut, mesurée à
    //    une capture par voyage. On lit donc le jeu de règles PAR SON NOM, sans
    //    déplacer celui de l'onglet : c'est exactement ce que `pour()` sait
    //    faire, et la porte unique reste unique.
    var cleRegles = (config.regles && W.PokeRegles && W.PokeRegles.existe(config.regles))
      ? config.regles
      : ((W.PokeRegles && W.PokeRegles.DEFAUT) || "gen1");
    var _jeu = W.PokeRegles ? W.PokeRegles.pour(cleRegles) : null;
    var _vs = (_jeu && _jeu.versions) || ["rouge", "bleu"];
    var version = _vs.length === 1 ? _vs[0] : (h.brut() < 0.5 ? _vs[0] : _vs[1]);

    var p = {
      graine: h.source,
      version: version,
      // 🔴 LE JEU DE RÈGLES EST SCELLÉ À LA CRÉATION, comme la version l'est
      //    par la graine. Il dit sous quelle table des types la partie se
      //    joue — et il ne bougera plus, même si une livraison en ajoute une
      //    autre pendant qu'elle est en cours.
      //    ⚠️ Une partie SANS ce champ est une partie de la gen 1 : toutes
      //       celles d'avant le 19/08 le sont, et `PokeRegles.de` le sait.
      regles: cleRegles,
      genre: config.genre === "f" ? "f" : "h",
      nom: config.nom || "",
      rival: config.rival || "",
      regle: config.regle || "voyage",
      // 🔴 LA RÈGLE DU JOUR VIT SUR LA PARTIE, ET LE SERVEUR LA REJOUE. Elle
      //    change les dégâts, la capture et l'expérience via le composé des
      //    serments : un rejeu qui l'ignorerait recalculerait un autre voyage.
      //    C'est un identifiant, pas un effet — l'effet se lit dans
      //    `PokeRegleDuJour`, une seule source.
      regleDuJour: config.regleDuJour || null,
      // 🔴 CE DRAPEAU EXISTAIT PARTOUT ET PERSONNE NE LE POSAIT. `compare`
      //    verrouille déjà le vivier de départ aux trois du canon, refuse le
      //    compagnon et scelle la version — tout le Défi du jour était câblé,
      //    et aucun écran ne l'allumait. L'écran de classement PROMETTAIT
      //    pourtant « une graine par jour, un seul essai » à qui l'ouvrait.
      //    Une promesse affichée sans porte d'entrée : la faute n°1 du projet,
      //    à l'échelle d'un mode entier.
      compare: !!config.compare,
      // 🔴 LES JOURS ONT DISPARU. Verdict du propriétaire : « des jours à côté
      //    qui ne servent à rien ». Mesuré : 68 consommés sur 90 sans qu'un
      //    seul arbitrage ait eu lieu. La contrainte, c'est désormais LE CHEMIN
      //    — prendre une branche, c'est perdre l'autre.
      acte: 1,            // 9 actes : huit Champions, puis la Ligue
      rangee: 0,          // la rangée courante dans la carte de l'acte
      carteActe: null,    // la carte générée, seedée
      noeudsVisites: {},  // ce qu'on a pris ; les autres branches sont perdues
      // 🔴 LES BRANCHES LAISSÉES SE NOMMENT, ELLES NE SE DÉDUISENT PLUS. Tant
      //    qu'« perdue » voulait dire « rangée dépassée », revenir d'un cran
      //    les rendait toutes jouables à nouveau — voir `revenirAuNoeud`.
      noeudsPerdus: {},
      branchesPerdues: 0, // ce qu'on a laissé — c'est ça, le prix
      argent: 3000,
      equipe: [],
      boite: [],
      badges: [],
      cles: {},
      // ⚖️ ÉQUILIBRAGE MESURÉ, 07/08/2026 — lot 9.
      //    Mesuré sur 40 voyages en politique optimale : Pokédex médian de SIX
      //    espèces sur 98 atteignables, et une équipe d'un ou deux Pokémon
      //    utiles aux arènes. Le blocage n'était pas dans les chiffres du
      //    combat — les arènes 3, 4 et 5 se gagnent — mais dans la
      //    CONSTITUTION D'ÉQUIPE : sans Balls, on ne construit rien, et un seul
      //    Pokémon ne couvre pas huit types.
      //    Cinq Balls au départ, c'était le confort du jeu d'origine, qui dure
      //    trente heures. Ici la partie en dure moins d'une.
      //    🔴 On ne touche PAS aux taux de capture : la rareté reste celle du
      //       ROM (Ronflex 25, Mewtwo 3). On donne de quoi ESSAYER, pas de quoi
      //       réussir — c'est la différence entre ouvrir une porte et la
      //       supprimer.
      sac: { POKE_BALL: 12, POTION: 3 },
      vus: {},          // numéro → true
      pris: {},         // numéro → { zone, niveau }
      // ⚠️ `etapes: {}` VIVAIT ICI SANS UN SEUL LECTEUR — un reste de la liste
      //    d'étapes d'avant la carte à embranchements, remplacée par
      //    `noeudsVisites`. Ni lue, ni même écrite après la création : du poids
      //    mort dans le sceau et dans le rejeu. Relevée par
      //    `poke-etat-muet.mjs`, retirée le 09/08.
      etape: "bourg-palette",
      starter: null,
      starterRival: null,
      fossile: null,    // la clé d'objet du fossile emporté — choix EXCLUSIF
      fossileRanime: false,
      jetons: 0,        // les jetons du Casino de Céladopole
      rivalVus: 0,      // combien de fois on a déjà croisé le rival
      echanges: {},     // espèce reçue → true : un échange ne se refait pas
      cadeaux: {},      // espèce reçue → true : Évoli ne se redonne pas
      legendaires: {},  // numéro → "pris" | "enfui"
      ligueGagnee: false,
      perdus: [],       // Nuzlocke : les Pokémon perdus pour toujours
      fini: null,       // "vitrine" | "equipe"
      journal: [],      // le journal de choix, relu par le serveur
    };

    // ═══════════════════════════════════════════════════════════════════════
    //  LES ACQUIS EMPORTÉS DU VOYAGE PRÉCÉDENT
    //
    //  🔴 LE PIED QUI MANQUAIT. Mesuré le 14/08 sur 50 comptes vierges : un
    //     premier voyage mort à l'acte 1 rapportait 2,5 espèces, quand le
    //     premier acquis de compte en demande 25. Perdre ne payait rien, donc
    //     on ne revenait pas — et gagner payait tout, à qui n'en avait plus
    //     besoin. Un acquis EMPORTÉ change ça : chaque voyage laisse un gain
    //     permanent, choisi, et le suivant commence plus fort.
    //  ⚠️ RIEN AU DÉFI DU JOUR (`config.compare`). C'est la règle du mode et
    //     elle ne souffre pas d'exception : aucun avantage acquis hors partie
    //     ne pèse là où l'on se compare. Le serveur rejoue ce voyage-là.
    //  ⚠️ PAR LA PORTE DES ACQUIS, jamais en poussant l'id à la main : `poser`
    //     refuse un doublon et tient la liste. Deux endroits qui écrivent
    //     `partie.acquis`, c'est deux règles qui divergeront.
    // ═══════════════════════════════════════════════════════════════════════
    if (!p.compare && W.PokeProgression && W.PokeProgression.gardes && W.PokeAcquis) {
      var emportes = W.PokeProgression.gardes();
      for (var g = 0; g < emportes.length; g++) W.PokeAcquis.poser(p, emportes[g]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LA CHASSE À MEW — CE QUI RESTE À FAIRE QUAND LE POKÉDEX EST FINI
    //
    //  🔴 MEW N'ÉTAIT NULLE PART, et `poke-injoignable` le disait depuis
    //     toujours : « #151 Mew : introuvable dans les DEUX versions ». C'est
    //     fidèle à 1996 — il n'y était pas obtenable légitimement — mais le
    //     Pokédex affiche 151 et le joueur qui atteint 150 n'a plus rien
    //     devant lui. Demandé par le propriétaire : *qu'il donne envie de
    //     relancer.*
    //
    //  🔑 ON NE CONSTRUIT AUCUN SYSTÈME NEUF. Mew devient une CHASSE, comme
    //     les trois oiseaux : il hérite d'un coup de l'annonce en tête d'acte,
    //     de l'essai unique, du carnet, de l'économie de Balls et des quatre
    //     issues. Le dossier a mesuré cinq fois que l'AJOUT n'aide pas dans ce
    //     mode ; ce qui marche, c'est une porte qui existe et qui sert enfin.
    //
    //  🔴 ET LE TIRAGE EST INCONDITIONNEL, C'EST TOUT L'ENJEU DU REJEU. Le
    //     serveur rejoue un voyage depuis sa graine ; si le dé n'était lancé
    //     que pour les joueurs qualifiés, deux joueurs à la même graine
    //     n'auraient pas la même suite de tirages et aucun score ne serait
    //     comparable. On tire donc TOUJOURS — même nombre, même ordre — et
    //     seul le RÉSULTAT est retenu quand le compte est complet.
    //  ⚠️ La qualification (`config.mew`) est lue une fois, ici, et le
    //     résultat vit sur la partie. L'écran ne la recalcule jamais : une
    //     condition qui dépend du COMPTE, relue en cours de voyage, ferait
    //     apparaître Mew au milieu d'une partie commencée sans lui.
    // ═══════════════════════════════════════════════════════════════════════
    //  La qualification vit sur la partie, lue UNE fois au départ : relue en
    //  cours de route, elle ferait apparaître des traces au milieu d'un voyage
    //  commencé sans elles.
    p.mew = !!config.mew;
    p.mewTraces = 0;

    return p;
  }

  // Le rival choisit toujours celui qui BAT le tien : c'est sa règle dans le
  // jeu d'origine, et elle doit tenir même quand le joueur part avec une espèce
  // que le canon n'avait pas prévue. On calcule l'avantage de type au lieu de
  // laisser une table incomplète décider.
  function contreLeJoueur(n) {
    var C = W.PokeCombat, tableEsp = ESP();
    var mesTypes = tableEsp[n].types;
    var trois = STARTERS();
    var meilleur = trois[0], note = -1;
    for (var i = 0; i < trois.length; i++) {
      var s = trois[i], eff = 0;
      for (var t = 0; t < tableEsp[s].types.length; t++) {
        eff = Math.max(eff, C.efficacite(tableEsp[s].types[t], mesTypes));
      }
      if (eff > note) { note = eff; meilleur = s; }
    }
    return meilleur;
  }

  function choisirStarter(p, n, h) {
    // 🔴 LE VIVIER DE DÉPART S'ÉLARGIT AVEC LE POKÉDEX. On ne compare plus à la
    //    liste figée des trois du canon : capturer une première forme l'ouvre
    //    comme départ, et c'est ce qui fait qu'une capture COMPTE au-delà du
    //    compteur. Le Défi du jour, lui, garde les trois — on ne compare pas
    //    des voyages où l'un part avec Ronflex et l'autre avec Chenipan.
    //    La partie applique la règle STRUCTURELLE — première forme, pas un
    //    légendaire — parce que c'est la seule que le serveur puisse rejouer.
    //    L'écran, lui, ne propose que ce que le compte a ouvert.
    var okStructure = W.PokeDepart ? W.PokeDepart.recevable(n) : STARTERS().indexOf(n) >= 0;
    var okCompare = !p.compare || STARTERS().indexOf(n) >= 0;
    if (!okStructure || !okCompare) throw new Error("Ce Pokémon n'est pas ouvert au départ.");
    p.starter = n;
    // 🔴 Le rival ne répond au canon que sur les trois du canon. Face à un
    //    départ ouvert, il prend le starter qui LUI est fort — sinon il
    //    hériterait d'un `undefined` et son équipe partirait sans chef.
    p.starterRival = RIVAL_CONTRE[n] || contreLeJoueur(n);
    var mon = M().creer(n, 5, h, { capture: { zone: "bourg-palette", niveau: 5 } });
    p.equipe.push(mon);
    voir(p, n);
    prendre(p, n, "bourg-palette", 5);
    voir(p, p.starterRival);
    return mon;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE RIVAL — VINGT ET UNE ÉQUIPES DANS LES DONNÉES, UNE SEULE EMPLOYÉE
  //
  //  🔴 IL N'APPARAISSAIT JAMAIS DU VOYAGE. `POKE_RIVAL` porte ses trois âges —
  //     `debut` (trois rencontres), `milieu` (quatre), `champion` (la dernière)
  //     — soit HUIT affrontements, chacun décliné selon le starter qu'il a
  //     choisi. Le jeu n'en tirait que le dernier, à la Ligue. Sept combats
  //     écrits dans le ROM, tapés dans nos données, et jamais joués.
  //
  //     C'est le ressort le plus fort de la série : quelqu'un part en même
  //     temps que toi, prend le Pokémon qui bat le tien, et revient plus fort
  //     à chaque fois. Sans lui, le voyage n'a pas d'adversaire — seulement des
  //     obstacles.
  //
  //  🔴 LA VARIANTE SE DÉDUIT DE SON STARTER, jamais d'un compteur à part. Les
  //     tables vont par trois, dans l'ordre Carapuce, Bulbizarre, Salamèche —
  //     c'est l'ordre du ROM, et le lire de travers donnerait à chaque joueur
  //     l'équipe d'un autre.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE RIVAL VIENT DU MONDE, ET SON ORDRE AVEC LUI   [20/08/2026]
  //
  //  🔴 SIGNALÉ PAR UN JOUEUR LE JOUR DE L'OUVERTURE : « le rival est le même
  //     que dans la 1G, il a pas la bonne team ». Ces deux lignes valaient
  //     `[7, 1, 4]` et `8` en dur, et `equipeRival` lisait `W.POKE_RIVAL` —
  //     la table de Blue. Johto n'avait pas de rival : il en empruntait un.
  //  🔑 L'ORDRE VOYAGE AVEC LA TABLE. Le ROM range les variantes de 1999 dans
  //     l'ordre Germignon, Héricendre, Kaiminus ; celui de 1996 dans l'ordre
  //     Carapuce, Bulbizarre, Salamèche. Deux tables, deux ordres — les tenir
  //     dans une variable commune, c'est donner à chaque joueur l'équipe d'un
  //     autre, et c'est exactement ce que ce fichier a déjà coûté une fois.
  //  ⚠️ SEPT RENCONTRES À JOHTO, HUIT À KANTO. La huitième de Kanto est le
  //     Champion de la Ligue ; à Johto ce sommet appartient à Peter, et la
  //     table de 1999 n'a donc pas de bloc `champion`. Le compte vient de la
  //     table, jamais d'ici.
  // ═══════════════════════════════════════════════════════════════════════════
  var RIVAL_ORDRE = [7, 1, 4];        // repli de 1996, si le registre se tait
  var RIVAL_RENCONTRES = 8;           // idem — 3 au début, 4 au milieu, 1 à la Ligue

  function tableRival() {
    var r = W.PokeRegles && W.PokeRegles.rival ? W.PokeRegles.rival() : null;
    if (r) return r;
    return W.POKE_RIVAL
      ? { ordre: RIVAL_ORDRE, rencontres: RIVAL_RENCONTRES, debut: W.POKE_RIVAL.debut,
          milieu: W.POKE_RIVAL.milieu, champion: W.POKE_RIVAL.champion }
      : null;
  }

  function rencontresRival() {
    var R = tableRival();
    return (R && R.rencontres) || RIVAL_RENCONTRES;
  }

  function equipeRival(p, rencontre, vise) {
    var R = tableRival();
    if (!R) return null;
    var ordre = R.ordre || RIVAL_ORDRE;
    var v = ordre.indexOf(p.starterRival);
    if (v < 0) v = 0;
    var total = R.rencontres || RIVAL_RENCONTRES;
    var i = Math.max(0, Math.min(total - 1, rencontre | 0));
    //  Les trois premières dans `debut`, les suivantes dans `milieu`, et la
    //  dernière dans `champion` — quand le monde en a un.
    var eq = i < 3 ? R.debut[i * 3 + v]
      : (R.champion && i === total - 1) ? R.champion[v]
      : R.milieu[(i - 3) * 3 + v];
    if (!eq) return null;
    // 🔴 LE RIVAL SUIT LE JOUEUR, PAS SA RANGÉE (13/08) — « Carapuce N.15
    //    contre Bulbizarre N.6 au premier duel », et mesuré : c'était la
    //    MÉDIANE (+7 d'écart), pas un accident. Le correctif du 12/08
    //    (max(canon, visé − 2)) était un PLANCHER, pas un adversaire : la
    //    rangée est estampillée à l'entrée d'acte, le joueur qui prend les
    //    nœuds la dépasse, et le rival ne le rattrapait jamais.
    //    ON DÉCALE L'ÉQUIPE CANON D'UN BLOC pour que son as vaille
    //    max(canon, visé − 2, tête du joueur − 1) : les écarts internes du
    //    ROM survivent — l'as devant, les autres derrière — au lieu de six
    //    Pokémon aplatis au même niveau. A/B 300 voyages, mêmes graines :
    //    écart médian +1 partout (contre +4 à +11), plancher et plafond de
    //    badges tenus. Recalculé AU COMBAT depuis l'équipe : même état au
    //    rejeu serveur, même équipe — et l'aperçu (`ecranRival`) lit la
    //    même porte, donc il montre ce qu'on affrontera.
    // ⚠️ SANS `vise`, CANON PUR : c'est la porte de la Ligue — le Champion
    //    est un MUR, et on ne règle jamais le mur.
    // ⚠️ EN COPIE, JAMAIS EN PLACE : ces tables sont partagées, les muter
    //    monterait le rival de TOUTES les rencontres suivantes.
    if (!vise) return eq;
    var tete = 0, as = 0, j;
    for (j = 0; j < (p.equipe || []).length; j++) tete = Math.max(tete, p.equipe[j].niveau || 0);
    for (j = 0; j < eq.length; j++) as = Math.max(as, eq[j].niveau);
    // tête − 2 depuis le 13/08 au soir : l'évolution des hissés (Reptincel,
    //    plus Salamèche) a durci le duel d'un cran réel — l'écart d'ancre
    //    rend ce cran. Mesuré : médiane hasard restaurée, duel toujours vivant.
    var decale = Math.max(as, vise - 2, tete - 2) - as;
    if (decale <= 0) return eq;
    return eq.map(function (x) {
      var niv = Math.min(100, x.niveau + decale);
      // Un hissé évolue avec son niveau — « le Carapuce N.23 » du rapport
      // testeur (13/08). Même porte que les autres hissages : especeAuNiveau.
      return { n: M().especeAuNiveau(x.n, niv), niveau: niv };
    });
  }

  // Combien de fois l'a-t-on déjà croisé ? Le compteur vit sur la partie : le
  // serveur doit pouvoir rejouer la même suite de rencontres.
  function rivalCroise(p) { return p.rivalVus || 0; }
  function croiserRival(p) { p.rivalVus = (p.rivalVus || 0) + 1; return p.rivalVus; }

  // ── Le Pokédex ─────────────────────────────────────────────────────────────
  //  « Vu » se pose dès la rencontre, « capturé » à la capture. C'est la règle
  //  du jeu, et c'est ce qui donne au Pokédex sa lecture en trois états :
  //  silhouette noire, portrait gris, portrait en couleur.
  function voir(p, n) { if (!p.vus[n]) p.vus[n] = true; }
  function prendre(p, n, zone, niveau) {
    voir(p, n);
    if (!p.pris[n]) p.pris[n] = { zone: zone, niveau: niveau };
  }
  function comptePokedex(p) {
    return { vus: Object.keys(p.vus).length, pris: Object.keys(p.pris).length };
  }

  // ── Les espèces atteignables dans CETTE version ────────────────────────────
  //  Sert au compteur du Pokédex : on affiche `pris / atteignables`, et le total
  //  absolu à côté. Afficher « 43 / 151 » sans dire que 73 sont hors de portée
  //  ferait croire à un jeu incomplet.
  var _cacheAtteignables = {}, _cacheSet = {};
  function atteignablesSet(version) {
    if (_cacheSet[version]) return _cacheSet[version];
    atteignables(version);
    return _cacheSet[version];
  }
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 CE COMPTE ÉTAIT FAUX DE QUARANTE ET UNE ESPÈCES. Il ne lisait que les
  //     tables d'HERBE et d'EAU, plus une liste écrite à la main. Il ignorait
  //     donc TOUT le reste de ce que le mode sait donner : la pêche, les
  //     échanges PNJ, les cadeaux, le Dojo, le Casino, le Parc Safari, l'ambre,
  //     les fossiles, et les évolutions par pierre comme par échange.
  //     Résultat affiché : « 98 atteignables » là où `poke-injoignable` en
  //     calcule **139** par version. Le joueur lisait un Pokédex deux fois plus
  //     petit que le jeu — et croyait le finir en le manquant de moitié.
  //
  //  ✅ ON PROPAGE, ON N'ÉNUMÈRE PLUS. Mêmes règles que le détecteur, dans le
  //     même ordre : les rencontres d'abord, puis les scènes, puis on ferme sur
  //     les ÉVOLUTIONS et les ÉCHANGES jusqu'au point fixe — un échange peut
  //     rendre une espèce qui évolue, qui s'échange à son tour.
  //  ⚠️ UNE LISTE ÉCRITE À LA MAIN VIEILLIT EN SILENCE : celle-ci datait d'avant
  //     la pêche, avant le Casino, avant l'aller-retour de la v427. Elle n'a
  //     jamais crié, elle a juste cessé d'être vraie.
  //  ⚠️ Mew reste hors d'atteinte dans les deux versions, et c'est le canon.
  // ═══════════════════════════════════════════════════════════════════════════
  function atteignables(version) {
    if (_cacheAtteignables[version]) return _cacheAtteignables[version];
    var s = {}, i, k;
    var ajouter = function (n) { if (n) s[n] = true; };

    // 1 · Ce qui se rencontre : herbes, eau, et les légendaires posés sur une étape.
    var zones = {}, z = ZONES() || [];
    for (i = 0; i < z.length; i++) zones[z[i].id] = z[i];
    var etapes = ETAPES() || [];
    for (i = 0; i < etapes.length; i++) {
      var e = etapes[i];
      for (k = 0; k < (e.tables || []).length; k++) {
        var zz = zones[e.tables[k]];
        if (!zz) continue;
        for (var b = 0; b < 2; b++) {
          var bloc = b === 0 ? zz.herbe : zz.eau;
          if (!bloc || !bloc[version]) continue;
          for (var c = 0; c < bloc[version].length; c++) {
            if (bloc[version][c].poids > 0) ajouter(bloc[version][c].n);
          }
        }
      }
      ajouter(e.legendaire);
    }
    // 🔴 LES RENCONTRES POSÉES PAR LE SCÉNARIO. La ligne d'avant ne connaissait
    //    que le Ronflex de 1996 : elle lisait un drapeau d'étape et une globale
    //    à son nom. Johto en pose SEPT — Simularbre, le Lokhlass, le Léviator
    //    rouge, les Voltorbe du repaire — et le compte « pris / atteignables »
    //    que le joueur lit les ignorait toutes.
    var sta = (W.PokeRegles && W.PokeRegles.statiques && W.PokeRegles.statiques()) || [];
    //  ⚠️ SANS FILTRE D'ÉTAPE, comme tout ce qui précède : cette fonction
    //     compte ce que le MONDE peut donner, pas ce que la partie a ouvert.
    for (i = 0; i < sta.length; i++) ajouter(sta[i].n);

    // 2 · La pêche — seize espèces que nulle herbe ne donne.
    //  🔴 PAR LE REGISTRE, ET C'EST LE QUATRIÈME LECTEUR QU'ON REBRANCHE. Ce
    //     compte-ci est CELUI QUE LE JOUEUR VOIT (« pris / atteignables ») et
    //     celui que la mesure de difficulté publie. En lisant `W.POKE_PECHE` en
    //     globale, il promettait à un joueur de Johto les poissons de Kanto et
    //     oubliait les siens — dont le Minidraco de l'Antre du Dragon.
    var P2 = (W.PokeRegles && W.PokeRegles.peche && W.PokeRegles.peche()) || W.POKE_PECHE;
    if (P2) {
      var bancs = (P2.canne || []).concat(P2.bonne || []);
      for (i = 0; i < bancs.length; i++) ajouter(bancs[i].n);
      var g = (P2.mega && P2.mega.groupes) || {};
      for (var nom in g) for (i = 0; i < g[nom].length; i++) ajouter(g[nom][i].n);
    }

    // 3 · Ce que les scènes donnent : starters, fossiles, cadeaux, Dojo, Casino, ambre.
    var canon = STARTERS();
    for (i = 0; i < canon.length; i++) ajouter(canon[i]);
    //  ⚠️ PAR LE REGISTRE, COMME LA PÊCHE JUSTE AU-DESSUS, ET POUR LA MÊME
    //     RAISON : ce compte est celui que le joueur lit. Servi en globale, il
    //     promettait à un voyage de Johto les fossiles et le Dojo de Kanto —
    //     quatre espèces qu'il ne peut pas obtenir — et taisait ses œufs.
    var Rg = W.PokeRegles;
    var lire = function (nom, repli) { return (Rg && Rg[nom] ? Rg[nom]() : repli) || null; };
    var fos = lire("fossiles", W.POKE_FOSSILES) || [];
    for (i = 0; i < fos.length; i++) ajouter(fos[i].n);
    var cad = lire("cadeaux", W.POKE_CADEAUX) || [];
    for (i = 0; i < cad.length; i++) ajouter(cad[i].n);
    var casino = (lire("casino", W.POKE_CASINO) || {})[version] || [];
    for (i = 0; i < casino.length; i++) ajouter(casino[i].n);
    var dojo = (lire("dojo", W.POKE_DOJO) || {}).choix || [];
    for (i = 0; i < dojo.length; i++) ajouter(dojo[i]);
    var amb = lire("ambre", W.POKE_AMBRE);
    if (amb) ajouter(amb.n);
    // Les œufs : sept espèces que la seconde génération ne met dans aucune herbe.
    var oeu = lire("oeufs", null) || [];
    for (i = 0; i < oeu.length; i++) {
      for (var oj = 0; oj < (oeu[i].table || []).length; oj++) ajouter(oeu[i].table[oj].n);
    }

    // 4 · Le point fixe : évolutions ET échanges se nourrissent l'un l'autre.
    //     Un échange rend une espèce qui évolue, qui s'échange à son tour.
    var ESP2 = (W.PokeRegles ? W.PokeRegles.especesListe() : W.POKE_ESPECES) || [],
        troc = lire("echanges", W.POKE_ECHANGES) || [], encore = true;
    while (encore) {
      encore = false;
      for (var n in s) {
        var esp = ESP2[(+n) - 1];
        for (i = 0; i < ((esp && esp.evolue) || []).length; i++) {
          var v = esp.evolue[i].vers;
          if (v && !s[v]) { s[v] = true; encore = true; }
        }
      }
      for (i = 0; i < troc.length; i++) {
        if (s[troc[i].donne] && !s[troc[i].recoit]) { s[troc[i].recoit] = true; encore = true; }
      }
    }

    _cacheSet[version] = s;
    _cacheAtteignables[version] = Object.keys(s).length;
    return _cacheAtteignables[version];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE LA COLLECTION PEUT ATTEINDRE, TOUTES VERSIONS CONFONDUES
  //
  //  🔴 « ATTEIGNABLES ICI » N'A DE SENS QUE DANS UN VOYAGE. Le Pokédex s'ouvre
  //     maintenant aussi depuis l'accueil, hors de toute partie : il n'y a alors
  //     ni version tirée ni « ici ». Or le Pokédex de COMPTE se remplit sur
  //     plusieurs voyages, donc sur les deux versions — le bon dénominateur
  //     hors partie est leur UNION, pas celle d'une version qu'on n'a pas
  //     encore tirée.
  //  ⚠️ Elle se déduit des deux ensembles déjà calculés : aucune troisième
  //     liste, donc rien qui puisse diverger d'elles.
  function atteignablesToutes() {
    var s = {}, v, k;
    var versions = (W.PokeRegles && W.PokeRegles.versions()) || ["rouge", "bleu"];
    for (var i = 0; i < versions.length; i++) {
      v = atteignablesSet(versions[i]);
      for (k in v) s[k] = true;
    }
    return Object.keys(s).length;
  }

  // ── Une rencontre sauvage ──────────────────────────────────────────────────
  //  🔴 Le créneau se tire au POIDS D'ORIGINE. C'est ici que vit la rareté : un
  //     Mélofée du Mont Sélénite reste à un pour cent, et il le reste.
  function rencontre(p, etape, milieu, h, options) {
    var zones = (etape.tables || []).map(function (t) {
      for (var i = 0; i < ZONES().length; i++) if (ZONES()[i].id === t) return ZONES()[i];
      return null;
    }).filter(Boolean);
    if (!zones.length) return null;
    var z = h.dans(zones);
    var bloc = milieu === "eau" ? z.eau : z.herbe;
    if (!bloc) return null;
    // 🔴 `forcer` saute le taux de rencontre du ROM, et c'est VOULU. Ce taux dit
    //    la probabilité de croiser quelque chose EN MARCHANT dans les herbes.
    //    Quand la carte a chiffré « 3 rencontres » sur un nœud, marcher est
    //    déjà décidé et payé d'une branche perdue : le tirage doit alors
    //    répondre. Sans ce drapeau, le nœud annonçait trois rencontres et
    //    rendait « Rien ne bouge ici » — une annonce qui ne se tient pas vaut
    //    moins que pas d'annonce du tout.
    if (!(options && options.forcer) && !h.chance((bloc.taux * 100) / 187)) return null;
    var creneau = h.pondere(bloc[p.version]);
    if (!creneau) return null;
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LES SAUVAGES SUIVENT LA RAMPE DE L'ACTE, UN CRAN SOUS LES DRESSEURS.
    //    Sans ça, la Route 1 servait du N.2-5 à un joueur N.13 — relevé par le
    //    premier testeur externe, mesuré, confirmé. Le niveau du ROM reste un
    //    PLANCHER : on ne sert jamais plus faible que la table d'origine.
    //    `vise` vient du NŒUD, figé à la génération de la carte — le lire au
    //    moment de jouer referait le tapis roulant. Ni le nombre ni l'ordre
    //    des tirages ne bougent : le niveau est un paramètre, pas un tirage.
    //    Une carte d'avant l'estampille n'a pas de `vise` : niveau du ROM,
    //    comme avant — un acte commencé se termine aux règles où il a commencé.
    // ═══════════════════════════════════════════════════════════════════════
    //  ⚠️ − 4 ET NON − 2, DOSÉ PAR A/B À MONDE CONSTANT — 300 voyages × 2
    //     politiques, témoin `--temoin-sauvage` (ROM nu) contre − 2 puis − 4 :
    //       dose      plafond 8 badges   arène 6   plancher 8 badges
    //       témoin         69,4 %          53 %          8,3 %
    //       − 2            76,2 %          80 %         21,8 %
    //       − 4            71,4 %          67 %         20,9 %
    //     À − 2, l'expérience des sauvages relevés FONDAIT le mur de Morgane.
    //     À − 4 le plafond et les deux murs tiennent ; le plancher monte parce
    //     que les boules de neige chanceuses profitent du surcroît d'expérience,
    //     mais sa MÉDIANE ne bouge pas (3 badges, mort à l'acte 4) et le harnais
    //     interdit de calibrer sur la politique hasard.
    var niveau = creneau.niveau;
    // 🔴 LA DOSE VIENT DU NŒUD, COMME LE VISÉ (12/08, v552). Le propriétaire a
    //    rejoué après la rampe v547 : « trop simple, on monte trop » — mesuré,
    //    il a raison : à visé − 4 le plancher passait de 8,3 à 20,9 % et la
    //    Ligue au plafond de 30,6 à 39,8 %. À − 6 (A/B 300 × 2 politiques), le
    //    plafond revient au point d'avant la rampe (69,4 %) et l'ennui reste
    //    corrigé (fin d'acte 1 : N.7, pas N.3). La dose s'ESTAMPILLE à la
    //    génération de la carte : une carte d'avant (sans `dose`) joue à − 4,
    //    le voyage en cours finit aux règles où il a commencé — même verrou de
    //    rejeu que l'estampille `vise` elle-même.
    if (options && options.vise) niveau = Math.max(niveau, options.vise - (options.dose || 4));
    var mon = M().creer(creneau.n, niveau, h, { capture: { zone: etape.id, niveau: niveau } });
    voir(p, creneau.n);
    return mon;
  }

  // ── Avancer dans la carte ──────────────────────────────────────────────────
  //  🔴 ON NE REVIENT PAS. Une rangée franchie est franchie ; les nœuds qu'on
  //     n'a pas pris sont perdus, et c'est tout le sel de la boucle.
  function prendreNoeud(p, noeud) {
    if (!p.carteActe) return { ok: false, raison: "pasDeCarte" };
    var rangee = p.carteActe.rangees[p.rangee];
    if (!rangee) return { ok: false, raison: "finDActe" };
    var choisi = null;
    for (var i = 0; i < rangee.length; i++) if (rangee[i].id === noeud) choisi = rangee[i];
    if (!choisi) return { ok: false, raison: "horsRangee" };

    p.noeudsVisites[choisi.id] = true;
    // ═══════════════════════════════════════════════════════════════════════
    //  UNE TRACE SE RAMASSE EN PRENANT LE NŒUD, pas en le regardant. C'est ce
    //  qui lui donne son prix : la branche d'à côté se ferme à la ligne
    //  suivante, comme pour tout le reste.
    //  ⚠️ Elle se compte ICI et nulle part ailleurs — l'écran ne fait que la
    //     dire. Un compteur tenu par l'affichage sauterait au rechargement.
    // ═══════════════════════════════════════════════════════════════════════
    if (choisi.trace && p.mew) p.mewTraces = (p.mewTraces || 0) + 1;
    // Ce qu'on ne prend pas se ferme MAINTENANT et pour de bon. C'est toute la
    // règle du mode : prendre une branche, c'est perdre l'autre.
    if (!p.noeudsPerdus) p.noeudsPerdus = {};
    for (var j = 0; j < rangee.length; j++) {
      if (rangee[j].id !== choisi.id) p.noeudsPerdus[rangee[j].id] = true;
    }
    p.branchesPerdues += rangee.length - 1;
    p.rangee++;
    return { ok: true, noeud: choisi, dernier: p.rangee >= p.carteActe.rangees.length };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PERDRE CONTRE UN CHAMPION BLOQUAIT LA PARTIE POUR DE BON
  //
  //  🔴 LE BLOCAGE LE PLUS GRAVE TROUVÉ SUR CE MODE. `prendreNoeud` avance la
  //     rangée dès qu'un nœud est choisi — victoire ou défaite, il ne le sait
  //     pas. Or l'arène est la DERNIÈRE rangée de l'acte, et l'acte ne passe
  //     que sur une victoire. Perdre contre le Champion laissait donc une
  //     carte dont chaque nœud était « pris » ou « perdu », zéro nœud
  //     jouable, et aucun moyen d'avancer : le joueur restait devant une carte
  //     morte, sans un message, sans un bouton, indéfiniment.
  //
  //     Trouvé par le joueur dirigé, pas à la lecture — et jamais par le
  //     cliqueur aléatoire, qui n'atteignait pas l'arène. Un harnais qui
  //     n'arrive pas au bout ne prouve rien, et il ne trouve rien non plus.
  //
  //  🔴 LA RÉPONSE EST CELLE DU JEU D'ORIGINE : on est K.O., on perd la moitié
  //     de son argent, l'équipe est soignée, et le Champion est toujours là.
  //     Le reste de l'acte, lui, RESTE consommé — on ne revient pas gagner des
  //     niveaux. Il faut le battre avec ce qu'on a, ou renoncer au voyage.
  //     C'est ce qui garde l'enjeu : la défaite coûte, elle ne se rejoue pas
  //     gratuitement.
  //
  //  🔴 CE QUE LA PROMESSE TENAIT PAR CHANCE, ET NON PAR CONSTRUCTION. La
  //     fonction rendait jouable TOUTE la rangée où elle revenait, prise comme
  //     laissées : une branche n'était « perdue » que tant que la rangée était
  //     dépassée. Si ça ne se voyait pas, c'est uniquement parce qu'une rangée
  //     de boss est seule — mesuré, 1800 rangées sur 1800. Le jour où un acte
  //     poserait un nœud à côté du Champion, se replier donnerait la branche
  //     qu'on venait d'abandonner, puis la redonnerait à chaque aller-retour.
  //     Une règle qui ne tient que par la forme des données ne tient pas : on
  //     nomme donc les branches laissées, et on ne rouvre que le nœud qu'on
  //     doit pouvoir reprendre.
  function revenirAuNoeud(p) {
    if (!p.carteActe) return false;
    if (p.rangee <= 0) return false;
    p.rangee--;
    // Le nœud PRIS redevient jouable : il n'est plus « visité ». Ses voisins,
    // eux, sont marqués perdus depuis `prendreNoeud` et le restent.
    var rangee = p.carteActe.rangees[p.rangee] || [];
    for (var i = 0; i < rangee.length; i++) {
      if (p.noeudsVisites[rangee[i].id]) delete p.noeudsVisites[rangee[i].id];
    }
    return true;
  }

  // 🔴 UNE CARTE SANS ISSUE DOIT POUVOIR SE DIRE. C'est la question que
  //    personne ne posait, et c'est pour ça que le blocage a vécu : le jeu
  //    savait que la rangée dépassait la carte, et rien ne le demandait.
  function carteSansIssue(p) {
    if (p.fini) return false;
    if (!p.carteActe) return false;
    return p.rangee >= p.carteActe.rangees.length;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA PENSION — LE SEUL ÉCHANGE DU MODE QUI COÛTE DU PRÉSENT POUR DU FUTUR
  //
  //  🔴 ELLE ÉTAIT DANS LES DONNÉES DEPUIS LE PREMIER JOUR ET NE PRODUISAIT
  //     AUCUN NŒUD. `route-5` porte `pension: true`, `voyage.js` mentionne même
  //     `elevage: 2` — et aucun écran, aucune mécanique. Du contenu déclaré,
  //     jamais joué.
  //
  //  🔴 ET ELLE EST FAITE POUR UNE CARTE À SENS UNIQUE. Dans le jeu d'origine on
  //     revient chercher son Pokémon ; ici on ne revient jamais. Alors il ne
  //     revient pas à nous : il REJOINT L'ÉQUIPE À L'ACTE SUIVANT, grandi. Ce
  //     qu'on paie, c'est le reste de l'acte à cinq, Champion compris. Un
  //     roguelite n'a pas d'autre monnaie que le risque, et celle-ci est la plus
  //     lisible du mode : plus fort demain, plus faible pour le boss de ce soir.
  //
  //  🔴 AUCUN TIRAGE. Les niveaux se déduisent des nœuds traversés, la facture
  //     du canon (100 ₽ par niveau) : le serveur rejoue la partie à l'identique.
  // ═══════════════════════════════════════════════════════════════════════════
  var PENSION_MAX = 5;          // au-delà, la Pension remplacerait le jeu
  var PENSION_PRIX = 100;       // par niveau, comme en 1996

  function noeudsFaits(p) { return Object.keys(p.noeudsVisites || {}).length; }

  function pensionDepot(p, index) {
    if (p.pension) return { ok: false, raison: "dejaOccupee" };
    // ⚠️ JAMAIS LE DERNIER. Une équipe vide, c'est une partie perdue par un
    //    clic sur un nœud qui ne prévenait pas.
    if (!p.equipe || p.equipe.length < 2) return { ok: false, raison: "equipeTropPetite" };
    var mon = p.equipe[index];
    if (!mon) return { ok: false, raison: "introuvable" };
    p.equipe.splice(index, 1);
    p.pension = { mon: mon, depuis: noeudsFaits(p), acte: p.acte };
    return { ok: true, mon: mon };
  }

  //  Rendu à l'entrée de l'acte suivant. Le résultat est POSÉ sur la partie et
  //  non affiché : le moteur ne connaît aucun écran, et l'interface joue les
  //  montées avec la même fonction que les combats.
  function pensionReprise(p) {
    if (!p.pension) return null;
    var mon = p.pension.mon;
    var pas = Math.max(0, noeudsFaits(p) - p.pension.depuis);
    var niveaux = Math.min(PENSION_MAX, pas);
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 MÊME TROU QUE LE SUPER BONBON, TROUVÉ EN CHERCHANT SA CLASSE (16/08).
    //     Un joueur a signalé le bonbon : « cap lvl 64, un super bonbon, up
    //     instant lvl 100 ». La Pension avait exactement la même faille, et
    //     personne ne l'avait vue — elle appelait `appliquerExperience` sans
    //     plafond, donc la borne y retombait à 100.
    //  ⚠️ ET UN GAIN DE ZÉRO SUFFISAIT. Un Pokémon déposé alors qu'il était au
    //     plafond porte une réserve d'expérience supérieure à son niveau ;
    //     `appliquerExperience` recalcule le niveau VISÉ depuis cette réserve,
    //     et monte jusqu'à lui même sans rien ajouter. Déposer puis reprendre
    //     relâchait donc la réserve, sans qu'aucun chiffre paraisse anormal.
    //  🔑 La faute n'est jamais « on a oublié un argument » : c'est qu'une
    //     borne de jeu vivait dans l'écran (`ui.js`) au lieu de vivre dans une
    //     porte que le sac et la Pension peuvent appeler. Elle est maintenant
    //     dans `PokeActes.plafondPour`.
    // ═══════════════════════════════════════════════════════════════════════
    var cap = (W.PokeActes && W.PokeActes.plafondPour) ? W.PokeActes.plafondPour(p) : 0;
    var borne = Math.min(100, cap > 0 ? cap : 100);
    if (mon.niveau + niveaux > borne) niveaux = Math.max(0, borne - mon.niveau);

    var evenements = [];
    if (niveaux > 0) {
      var e = ESP()[mon.n];
      var vise = M().expTotalePour(e.croissance, mon.niveau + niveaux);
      evenements = M().appliquerExperience(mon, Math.max(0, vise - mon.exp), mon.niveau + niveaux);
    }
    // 🔴 LA FACTURE NE MET JAMAIS À ZÉRO CE QU'ON NE PEUT PAS PAYER. L'éleveur
    //    prend ce qu'il y a : un joueur ruiné récupère quand même son Pokémon.
    //    Une dette impayable bloquerait un voyage sur un nœud facultatif.
    var du = niveaux * PENSION_PRIX;
    var paye = Math.min(p.argent, du);
    p.argent -= paye;

    // 🔴 `p.equipeMax` N'EXISTE PAS, ET N'A JAMAIS EXISTÉ. Ce champ n'est écrit
    //    nulle part dans le mode : le repli `|| 6` s'appliquait donc TOUJOURS,
    //    et la Pension rendait le Pokémon à l'équipe même sous un serment qui
    //    la limite à deux places. Quatre serments et une règle du jour posent
    //    `equipeMax` — tous étaient contournables en déposant un Pokémon puis
    //    en le reprenant. Le plafond vit dans le composé, comme partout
    //    ailleurs (`ui.js` le lit ainsi pour la capture et pour les cadeaux) ;
    //    un champ parallèle sur la partie était une seconde vérité, et elle
    //    était vide.
    var places = (W.PokeSerments ? W.PokeSerments.effet(p).equipeMax : 6) || 6;
    if (p.equipe.length < places) p.equipe.push(mon);
    else { p.boite = p.boite || []; p.boite.push(mon); }

    p.pension = null;
    p.pensionRetour = { mon: mon, niveaux: niveaux, du: du, paye: paye, evenements: evenements };
    return p.pensionRetour;
  }

  // L'acte suivant : on efface la carte, elle se régénère à l'entrée.
  function acteSuivant(p) {
    // 🔴 LA REPRISE SE FAIT ICI, PORTE UNIQUE. Ailleurs, un joueur qui abandonne
    //    ou qui perd finirait le voyage avec un Pokémon resté à la Pension —
    //    invisible dans l'équipe, et pourtant à lui.
    pensionReprise(p);
    p.acte++;
    p.rangee = 0;
    p.carteActe = null;
    if (p.acte > (W.PokeActes ? W.PokeActes.nombre() : 9)) p.fini = "vitrine";
    return p.acte;
  }

  // ── Les Balls ──────────────────────────────────────────────────────────────
  //  🔴 ENTRÉE UNIQUE. Aucune Ball ne se lance ailleurs que par ici. C'est la
  //     leçon de l'Épée Z du mode Dragon Ball : un objet qui entre par deux
  //     portes finit avec deux comptes, et l'écran donne pour absent ce que le
  //     joueur possède.
  //
  //  🔴 LA MASTER BALL EST UNIQUE, ET C'EST UN CHOIX, PAS UNE FORMALITÉ.
  //     Décision du 07/08/2026, prise sur mesure : dans l'ordre du voyage, la
  //     tour Silph tombe avant les Îles Écume, la Centrale et la Route Victoire.
  //     Le joueur arrivait donc sur CHAQUE légendaire avec une Ball qui ne rate
  //     jamais — 100 % de captures mesurées sur Artikodin, Électhor et Sulfura.
  //     Une seule Master Ball, cinq légendaires : il faut choisir lequel, et les
  //     quatre autres se prennent à l'Hyper Ball contre un taux de capture de 3.
  function aLaBall(p, cle) { return (p.sac[cle] || 0) > 0; }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RIEN NE SORTAIT JAMAIS DU SAC
  //
  //  🔴 `utiliserBall` ÉTAIT EXPORTÉE ET APPELÉE NULLE PART. Aucune Ball n'a
  //     jamais été décomptée : on en lançait douze, il en restait douze. Toute
  //     l'économie du mode reposait dessus — le prix des Balls à la boutique,
  //     les cartes de butin qui en donnent, et surtout la MASTER BALL UNIQUE,
  //     dont le choix entre cinq légendaires était la décision la plus tendue
  //     du voyage. Elle se relançait à l'infini.
  //
  //     Personne ne l'a vu parce que personne ne regardait le compteur : on
  //     lance une Ball, on lit le résultat, on ne relit pas le sac.
  //
  //  🔴 UNE SEULE PORTE POUR TOUT CE QUI SE CONSOMME. Balls et soins passent
  //     par ici. Deux portes, ce sont deux comptes — la leçon de l'Épée Z du
  //     mode Dragon Ball, déjà écrite dans ce fichier trente lignes plus haut.
  function aLObjet(p, cle) { return (p.sac[cle] || 0) > 0; }

  function utiliserObjet(p, cle) {
    if (!aLObjet(p, cle)) return false;
    p.sac[cle]--;
    if (p.sac[cle] <= 0) delete p.sac[cle];
    return true;
  }

  function utiliserBall(p, cle) { return utiliserObjet(p, cle); }

  // La meilleure Ball disponible, hors Master Ball : elle ne se dépense jamais
  // toute seule. Le jeu doit demander.
  function meilleureBall(p) {
    var ordre = ["ULTRA_BALL", "GREAT_BALL", "POKE_BALL"];
    for (var i = 0; i < ordre.length; i++) if (aLaBall(p, ordre[i])) return ordre[i];
    return null;
  }

  // ── Le badge ───────────────────────────────────────────────────────────────
  //  🔴 Un badge n'est pas un compteur : il augmente réellement les
  //     statistiques de l'équipe et ouvre une CS hors combat. L'infobulle du
  //     badge doit annoncer exactement ce qu'il fait.
  function gagnerBadge(p, arene) {
    for (var i = 0; i < p.badges.length; i++) if (p.badges[i].ordre === arene.ordre) return false;
    // ⚠️ ON ÉCRIT LE FRANÇAIS DANS LA SAUVEGARDE, ET C'EST VOULU. Cette fiche
    //    est relue par le serveur qui rejoue les voyages pour valider les
    //    scores : y mettre une valeur qui dépend de la langue du navigateur
    //    ferait dépendre un score de la langue du joueur. L'affichage passe
    //    par `PokeGenre.nomBadge` / `nomChampion`, qui replient sur ce
    //    français quand la fiche n'a pas de champ anglais.
    p.badges.push({ ordre: arene.ordre, badge: arene.badge, champion: arene.champion, acte: p.acte });
    // ═══════════════════════════════════════════════════════════════════════
    //  COMBIEN DE BADGES AVANT LA PREMIÈRE CHUTE  [20/08/2026]
    //
    //  🔴 « MÊME EN FAISANT UNE PERFECT RUN LE SUCCÈS AUCUN TOMBÉ NE SE VALIDE
    //     PAS » — Totor, 19/08 au soir. Il avait raison, et la cause est une
    //     phrase lue de deux façons. La chasse promet « gagne trois badges sans
    //     perdre un seul Pokémon » ; elle se jugeait sur `tombes === 0` À LA
    //     CLÔTURE DU VOYAGE, c'est-à-dire des heures après le troisième badge.
    //     Démontré : huit badges, un seul Pokémon tombé sur tout le voyage,
    //     REFUSÉE. Les trois premiers badges avaient pourtant été gagnés sans
    //     une perte. Pour valider, il fallait terminer le voyage ENTIER sans
    //     qu'une créature tombe une seule fois, Ligue comprise. Autant dire
    //     jamais, pour qui continue de jouer après le troisième badge.
    //  🔑 ON COMPTE DONC CE QUE LA PHRASE DIT : les badges gagnés TANT QUE rien
    //     n'est tombé. Le compteur se fige à la première chute, et ce qui a été
    //     gagné avant reste gagné. Un succès se juge au moment où il est
    //     accompli, pas à la fin de la partie.
    //  ⚠️ ON REGARDE AUSSI L'ÉQUIPE, ET C'EST NÉCESSAIRE : le badge se donne
    //     (`ui.js`, `gagnerBadge`) AVANT que `appliquerNuzlocke` ne compte les
    //     chutes du combat qui vient de finir. Sur `tombes` seul, un Pokémon
    //     tombé EN GAGNANT le badge n'était pas encore compté, et le badge
    //     passait. Une créature à zéro PV en ce moment même est tombée dans ce
    //     combat-là. Le second test ne peut que resserrer : si quelque chose
    //     était tombé avant, `tombes` a déjà figé le compteur.
    if (!(p.tombes > 0) && !equipeAUneChute(p)) p.badgesSansChute = p.badges.length;
    return true;
  }

  //  Une créature à zéro PV dans l'équipe — la même lecture que `bilan`.
  function equipeAUneChute(p) {
    for (var i = 0; i < p.equipe.length; i++) if ((p.equipe[i].pv || 0) <= 0) return true;
    return false;
  }

  // 🔴 DEUX BADGES SUR QUATRE ÉTAIENT DÉCORATIFS. Le jeu d'origine donne
  //    +12,5 % sur quatre statistiques, une par badge : Roche → Attaque,
  //    **Foudre → Vitesse**, **Âme → Défense**, Volcan → Spécial. Seuls le
  //    premier et le dernier étaient posés ici, donc seuls eux étaient lus —
  //    pendant que `combat.js` affirmait en commentaire « un badge n'est donc
  //    PAS décoratif ». Deux l'étaient, et ce sont ceux du milieu de partie,
  //    là où la courbe est la plus serrée.
  //  🔴 CETTE TABLE NE CONNAISSAIT QUE KANTO, et sa jumelle dans `combat.js` non
  //     plus : les huit badges de Johto ne donnaient RIEN. Huit récompenses
  //     annoncées à l'écran, aucune payée dans le calcul. Le rang qui donne
  //     quoi vit désormais dans le jeu de règles, une seule fois.
  //  ⚠️ ON REND DES NOMS DE STATISTIQUE, plus des noms de badge : c'est ce que
  //     le combat demande, et ça évite la traduction qui se perdait entre les
  //     deux fichiers.
  function badgesActifs(p) {
    var table = (W.PokeRegles && W.PokeRegles.badgesStat()) || { 1: "atk", 3: "vit", 5: "def", 7: "spe" };
    var b = {};
    for (var i = 0; i < p.badges.length; i++) {
      var stat = table[p.badges[i].ordre];
      if (stat) b[stat] = true;
    }
    return b;
  }

  // ── La réserve ─────────────────────────────────────────────────────────────
  //  🔴 UN ÉCHANGE, JAMAIS UN DÉPLACEMENT. L'équipe tient six places : reprendre
  //     un Pokémon de la réserve, c'est en céder un. Poser la règle ici plutôt
  //     que dans l'écran garantit qu'elle vaut aussi pour le rejeu serveur —
  //     et qu'une équipe ne finira jamais à sept.
  // ═══════════════════════════════════════════════════════════════════════════
  //  QUI ENTRE EN PREMIER — LA DÉCISION QUE LE JEU DEMANDAIT SANS LA PERMETTRE
  //
  //  🔴 LA CARTE ANNONCE DÉJÀ QUI BAT LE CHAMPION. `PokeMesure.contre` dit, sur
  //     le nœud d'arène, lequel des tiens frappe fort et lequel est fragile —
  //     et le joueur ne pouvait RIEN en faire : le combat envoie le premier
  //     de la liste, et la liste ne se réordonne nulle part. Une information
  //     qu'on ne peut pas employer est une information qui se moque du joueur.
  //  ⚠️ Le relais en combat existe, mais il COÛTE UN TOUR — et devant un
  //     Champion, ce tour est souvent le combat. Choisir avant, c'est le geste
  //     tactique que tous les bons jeux de la série permettent.
  //  🔴 AUCUN TIRAGE, AUCUNE STAT TOUCHÉE : on déplace une entrée de tableau.
  //     Le rejeu ne s'en aperçoit pas.
  function mettreEnTete(p, index) {
    if (!p.equipe || index <= 0 || index >= p.equipe.length) return { ok: false, raison: "horsEquipe" };
    var mon = p.equipe[index];
    // Un Pokémon à terre ne peut pas ouvrir un combat : le mettre en tête
    // reviendrait à demander un relais immédiat, c'est-à-dire un tour perdu.
    if (mon.pv <= 0) return { ok: false, raison: "aTerre" };
    p.equipe.splice(index, 1);
    p.equipe.unshift(mon);
    return { ok: true, mon: mon };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DÉPLACER DANS L'ÉQUIPE — l'ordre est une décision de jeu
  //
  //  🔴 `mettreEnTete` ne savait faire qu'UNE chose : remonter en première
  //     place. L'ordre des cinq autres était donc subi — or il décide de qui
  //     entre après un K.O., c'est-à-dire du deuxième combat de chaque arène.
  //     Le propriétaire a demandé le glisser-déposer ; il lui fallait d'abord
  //     un moteur capable de dire « celui-ci passe en troisième ».
  //  ⚠️ LE MOTEUR TRANCHE, PAS L'ÉCRAN. Deux `splice` posés dans l'interface
  //     diviseraient la règle en deux endroits — et c'est exactement comme ça
  //     qu'une équipe finit à sept. Même raison que `echangerReserve`.
  //  ⚠️ Le Pokémon à terre peut être DÉPLACÉ (ranger sa réserve est permis),
  //     mais pas mis en TÊTE : ouvrir un combat avec lui coûterait un tour.
  //     La garde reste donc sur la première place, et seulement sur elle.
  // ═══════════════════════════════════════════════════════════════════════════
  function deplacer(p, de, vers) {
    if (!p.equipe) return { ok: false, raison: "horsEquipe" };
    var n = p.equipe.length;
    if (de < 0 || de >= n || vers < 0 || vers >= n || de === vers) {
      return { ok: false, raison: "horsEquipe" };
    }
    // 🔴 LA RÈGLE PORTE SUR L'OCCUPANT FINAL DE LA PLACE 0, PAS SUR LE DÉPLACÉ.
    //    Sortir un debout de la tête pouvait y laisser un Pokémon à terre :
    //    [A debout, B à terre, C] et l'on tire A vers la 3ᵉ place → B prend la
    //    tête. La ligne affichait alors « EN TÊTE » ET « à terre », pendant que
    //    le combat envoyait quelqu'un d'autre.
    var futur;
    if (vers === 0) futur = p.equipe[de];        // le déplacé prend la tête
    else if (de === 0) futur = p.equipe[1];      // la tête s'en va, le suivant monte
    else futur = p.equipe[0];                    // la tête ne bouge pas
    if (futur && futur.pv <= 0) return { ok: false, raison: "aTerre" };
    var mon = p.equipe.splice(de, 1)[0];
    p.equipe.splice(vers, 0, mon);
    return { ok: true, mon: mon };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ÉCHANGER DEUX ATTAQUES — [19/08, Syrean] « modifier l'emplacement des
  //  attaques comme dans les jeux de base »
  //
  //  🔴 L'ORDRE DES ATTAQUES SE SUBISSAIT. Il venait de l'ordre d'apprentissage,
  //     et la seule façon de le changer était d'oublier une attaque pour la
  //     réapprendre. Or c'est l'ordre du menu de combat — ce que le pouce touche
  //     en premier, trente fois par voyage. Depuis 1996, la fiche d'un Pokémon
  //     permet de le choisir.
  //  ⚠️ ON ÉCHANGE DEUX PLACES, comme le jeu d'origine : désigner une attaque,
  //     puis celle dont elle prend la place. Aucun tirage, aucune statistique,
  //     les PP voyagent avec l'attaque. Le défi du jour ne rejoue pas le
  //     voyage : rien ne diverge.
  //  ⚠️ `ou` nomme la liste — « equipe » ou « boite » — parce que la fiche du
  //     Potentiel montre désormais les deux, et qu'une réserve se range aussi.
  //  🔴 HORS COMBAT SEULEMENT, par construction : le combat range des INDEX
  //     d'attaque dans ses volatils (`entrave`), qui ne survivent pas au combat.
  //     Cette porte n'est appelée que depuis la fiche, entre deux combats.
  // ═══════════════════════════════════════════════════════════════════════════
  function echangerAttaques(p, ou, index, a, b) {
    var liste = ou === "boite" ? p.boite : p.equipe;
    var mon = liste && liste[index];
    if (!mon || !mon.attaques) return { ok: false, raison: "horsEquipe" };
    var n = mon.attaques.length;
    if (a < 0 || a >= n || b < 0 || b >= n || a === b) return { ok: false, raison: "memePlace" };
    var t = mon.attaques[a];
    mon.attaques[a] = mon.attaques[b];
    mon.attaques[b] = t;
    return { ok: true, mon: mon };
  }

  function echangerReserve(p, iEquipe, iBoite) {
    if (!p.boite || !p.boite[iBoite]) return { ok: false, raison: "pasEnReserve" };
    if (!p.equipe[iEquipe]) return { ok: false, raison: "pasDansLEquipe" };
    // ⚠️ MÊME GARDE QUE `deplacer` : cette porte n'en avait AUCUNE, et elle
    //    accepte `iEquipe = 0`. Échanger la tête contre un Pokémon de réserve
    //    à terre laissait un tombé en première place.
    if (iEquipe === 0 && p.boite[iBoite].pv <= 0) return { ok: false, raison: "aTerre" };
    var entre = p.boite[iBoite];
    var sorti = p.equipe[iEquipe];
    p.equipe[iEquipe] = entre;
    p.boite[iBoite] = sorti;
    return { ok: true, entre: entre, sorti: sorti };
  }

  // ── Mise hors combat de toute l'équipe ─────────────────────────────────────
  //  Règle canon : retour au dernier Centre Pokémon, et la MOITIÉ de l'argent
  //  reste sur le chemin. 🔴 Le montant perdu s'annonce, il ne se découvre pas.
  function horsCombat(p) {
    var perdu = Math.floor(p.argent / 2);
    p.argent -= perdu;
    for (var i = 0; i < p.equipe.length; i++) M().soigner(p.equipe[i]);
    return { perdu: perdu };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DEUX ESSAIS DEVANT UN CHAMPION, ET LE VOYAGE S'ARRÊTE
  //
  //  🔴 EN RÉPARANT LE BLOCAGE, J'EN AI CRÉÉ UN AUTRE — vu à l'écran, pas dans
  //     le code. Rouvrir le nœud du Champion après une défaite rend le voyage
  //     jouable, mais le coût est la MOITIÉ DE L'ARGENT : arrivé à 1 ₽, il ne
  //     coûte plus rien. Le joueur dirigé a donc réessayé l'Onix de Pierre
  //     indéfiniment, sans enjeu et sans fin. Une partie qui ne peut pas se
  //     terminer est le même défaut que celle qui se bloque, en plus lent.
  //
  //  🔴 UN COMPTEUR D'ESSAIS BORNE LES DEUX. Deux tentatives par acte : c'est
  //     assez pour qu'un mauvais tirage ne condamne pas quarante minutes de
  //     jeu, assez peu pour qu'un Champion reste un mur. Et il se DIT — un
  //     essai qui se consomme en silence n'est pas une règle, c'est un piège.
  //  🔴 TROIS → DEUX LE 15/08 (« le jeu est encore bcp trop simple »). C'est le
  //     levier le plus fort des trois posés ce jour-là, et de loin : à lui seul
  //     il fait tomber les parcours complets de 27,7 % à **17,2 %** sur un
  //     compte de vétéran. Il ne durcit PAS le début — les morts de l'acte 1
  //     passent même de 18 % à 15 % — parce que le Champion de l'arène 1 ne se
  //     rate presque jamais deux fois. Ce qu'il resserre, c'est le milieu, là
  //     où le troisième essai servait à repasser un mur qu'on n'aurait pas dû
  //     franchir. Voir `PokeActes.monteeChampion` pour les deux autres.
  //
  //  🔴 LES DÉFAITES DE ROUTE NE COMPTENT PAS. Elles ne bloquent rien : la
  //     rangée suivante reste ouverte, et le coût en argent suffit. Punir la
  //     route rendrait le mode brutal là où il est déjà exigeant.
  var ESSAIS_BOSS = 2;

  // 🔴 LES ESSAIS VALENT POUR TOUT — pas seulement devant un Champion.
  //    Le compteur n'était consommé que par les arènes ; un K.O. contre un
  //    dresseur ordinaire rouvrait son nœud sans rien coûter dès que l'argent
  //    touchait zéro. Une partie a ainsi enchaîné 899 K.O. dans le même acte.
  //    Le nom porte la règle : on échoue DANS un acte, quelle qu'en soit la
  //    cause — et le nom sert de garde : `echouerDevantBoss` laissait croire
  //    que la règle s'arrêtait aux Champions, ce qu'elle faisait.
  function echouerDansLActe(p) {
    if (!p.echecsActe) p.echecsActe = {};
    p.echecsActe[p.acte] = (p.echecsActe[p.acte] || 0) + 1;
    var reste = ESSAIS_BOSS - p.echecsActe[p.acte];
    if (reste <= 0) p.fini = "epuise";
    return { reste: Math.max(0, reste), fini: !!p.fini };
  }

  function essaisRestants(p) {
    var faits = (p.echecsActe && p.echecsActe[p.acte]) || 0;
    return Math.max(0, ESSAIS_BOSS - faits);
  }

  // La règle Nuzlocke : un Pokémon hors combat est perdu pour toujours.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 ON COMPTE POUR TOUT LE MONDE, ON NE SANCTIONNE QU'EN NUZLOCKE. Cette
  //     fonction sortait au premier `if` hors Nuzlocke — et c'était le SEUL
  //     endroit du mode qui voie un Pokémon tomber. Conséquence : `p.perdus`
  //     restait vide par construction en voyage, en express ET au Défi du jour,
  //     donc la chasse « Aucun tombé » — présentée comme la plus exigeante du
  //     carnet — tombait toute seule au troisième badge. Le joueur lisait
  //     « sans perdre un seul Pokémon », puis voyait la case cochée sans y
  //     avoir pensé une seconde.
  //  🔑 UN COMPTEUR DOIT COMPTER CE QUI ARRIVE, pas ce qu'une règle en fait.
  //     `tombes` est un FAIT du voyage ; `perdus` est une CONSÉQUENCE du
  //     Nuzlocke. Les mêler, c'était rendre le fait invisible aux trois autres
  //     règles.
  //  ⚠️ Le comptage est sans effet de jeu : aucun tirage, aucune borne. Le rejeu
  //     serveur reste exact.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 ET IL COMPTAIT LES COMBATS, PAS LES CHUTES  [20/08/2026]. Cette fonction
  //     est appelée après CHAQUE combat, et hors Nuzlocke un Pokémon à terre
  //     RESTE dans l'équipe jusqu'au prochain soin — comme dans le jeu
  //     d'origine. Il était donc recompté à chaque combat suivant : un seul
  //     Pokémon tombé et quatre combats gagnés ensuite donnaient `tombes = 4`.
  //     Démontré, puis gardé par `poke-chasse-sans-perte.mjs`.
  //  🔑 ON MARQUE CE QUI A DÉJÀ ÉTÉ COMPTÉ, et le soin lève la marque : une
  //     créature soignée peut retomber, et ce sera une seconde chute.
  //     *Un compteur doit compter ce que son nom dit* — la même faute que le
  //     compteur de Pokémon engagés, trouvée la même nuit.
  function appliquerNuzlocke(p) {
    var i, m;
    for (i = 0; i < p.equipe.length; i++) {
      m = p.equipe[i];
      if (m.pv <= 0) {
        if (!m.tombeCompte) { m.tombeCompte = true; p.tombes = (p.tombes || 0) + 1; }
      } else if (m.tombeCompte) delete m.tombeCompte;
    }
    if (p.regle !== "nuzlocke") return [];
    var partis = [];
    for (i = p.equipe.length - 1; i >= 0; i--) {
      if (p.equipe[i].pv <= 0) {
        partis.push(p.equipe[i]);
        p.perdus.push({ n: p.equipe[i].n, niveau: p.equipe[i].niveau, zone: p.etape });
        p.equipe.splice(i, 1);
      }
    }
    if (!p.equipe.length && p.regle === "nuzlocke") p.fini = "equipe";
    return partis;
  }

  // ── Le score ───────────────────────────────────────────────────────────────
  //  🔴 Les poids sont un POINT DE DÉPART, à régler sur 900 parties simulées
  //     (§20 du brief). Les reprendre d'un autre mode serait la faute du
  //     31/07 : les seuils du ninja montent à 689, ceux du Dragon Ball
  //     plafonnent à 404, et les trois plus hauts titres étaient inatteignables.
  var POIDS = {
    badge: 40,
    ligue: 300,
    vu: 2,
    pris: 12,
    legendaire: 80,
    niveauEquipe: 2,
    acte: 45,
    nuzlocke: 1.5,     // multiplicateur, pas un bonus plat
    express: 1.25,
    // Par sceau franchi. Voir `score()` pour le raisonnement sur la valeur.
    sceau: 0.1,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE SCORE SE CALCULE SUR UN RÉSUMÉ, ET C'EST CE QUI REND LE CLASSEMENT
  //  VÉRIFIABLE
  //
  //  🔴 SORTI DE `score(p)` LE 14/08 POUR L'OUVERTURE. Le classement du défi du
  //     jour n'existait pas : le mode LISAIT le tableau et ne soumettait jamais
  //     rien, faute d'un `replayDaily` côté serveur. Or rejouer un voyage entier
  //     — neuf actes, soixante-dix combats — demanderait le journal d'actions du
  //     mode ninja, c'est-à-dire une autre architecture.
  //  🔑 ELLE N'EST PAS NÉCESSAIRE : le score ne dépend que de HUIT nombres, tous
  //     déjà portés par le bilan. Le serveur peut donc le RECALCULER au lieu de
  //     le croire — un joueur ne peut plus annoncer un score, seulement un
  //     résumé, que `rejeu.js` borne ensuite par les lois du mode.
  //  ⚠️ UNE SEULE SOURCE : `score(p)` passe par ici, le serveur aussi. Deux
  //     barèmes pour un classement, c'est le `score_mismatch` garanti chez un
  //     joueur honnête — la facture que le mode ninja paie depuis une semaine.
  // ═══════════════════════════════════════════════════════════════════════════
  function scoreDeBilan(b) {
    var s = 0;
    s += (b.badges || 0) * POIDS.badge;
    if (b.ligue) s += POIDS.ligue;
    s += (b.vus || 0) * POIDS.vu;
    s += (b.pris || 0) * POIDS.pris;
    s += ((b.legendaires || []).length) * POIDS.legendaire;
    var niv = 0, eq = b.equipe || [];
    for (var i = 0; i < eq.length; i++) niv += eq[i].niveau || 0;
    s += Math.round(niv * POIDS.niveauEquipe);
    // 🔴 Le score récompense le PARCOURS, pas la vitesse : chaque acte franchi
    //    vaut, et chaque branche laissée derrière soi est un choix assumé.
    s += ((b.acte || 1) - 1) * POIDS.acte;
    if (b.regle === "nuzlocke") s = Math.round(s * POIDS.nuzlocke);
    if (b.regle === "express") s = Math.round(s * POIDS.express);
    if (b.sceau) s = Math.round(s * (1 + POIDS.sceau * b.sceau));
    return Math.max(0, Math.round(s));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 LE SCEAU PÈSE SUR LE SCORE, SINON PERSONNE NE MONTE. Un palier de
  //    difficulté qui ne rapporte rien est un handicap volontaire, et les
  //    handicaps volontaires ne se jouent qu'une fois. Dix pour cent par
  //    sceau : au huitième, un même voyage vaut quatre-vingts pour cent de
  //    plus — assez pour que le classement distingue deux joueurs à égalité
  //    de badges, pas assez pour qu'un Sceau 8 raté batte un Sceau 0 gagné.
  //    ⚠️ Il MULTIPLIE, comme les règles de voyage, et il se cumule avec
  //       elles : un Nuzlocke au Sceau 3 est plus dur que les deux séparés.
  //    (Le barème lui-même vit dans `scoreDeBilan`, plus haut.)
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔑 UNE SEULE FORMULE, ET ELLE EST CELLE QUE LE SERVEUR REJOUE. `score(p)`
  //     ne fait plus que RÉSUMER la partie et appeler le barème commun. Écrire
  //     le calcul deux fois — ici pour le jeu, là pour le classement — c'est la
  //     recette du `score_mismatch` chez un joueur honnête.
  function resumePourScore(p) {
    var d = comptePokedex(p);
    var leg = [], k;
    for (k in p.legendaires) if (p.legendaires[k] === "pris") leg.push(+k);
    return {
      badges: p.badges.length, ligue: !!p.ligueGagnee,
      vus: d.vus, pris: d.pris, legendaires: leg,
      equipe: p.equipe.map(function (m) { return { niveau: m.niveau }; }),
      acte: p.acte, regle: p.regle, sceau: p.sceau || 0,
    };
  }

  function score(p) { return scoreDeBilan(resumePourScore(p)); }

  // Le bilan lu par l'écran de fin, la carte de partage et le classement.
  // 🔴 UNE SEULE SOURCE pour les trois. Le mode ninja a laissé le bandeau et
  //    l'écran de fin diverger parce qu'ils lisaient deux calculs différents.
  function bilan(p) {
    var d = comptePokedex(p);
    var leg = [];
    for (var k in p.legendaires) if (p.legendaires[k] === "pris") leg.push(+k);
    return {
      version: p.version,
      genre: p.genre,
      regle: p.regle,
      badges: p.badges.length,
      ligue: p.ligueGagnee,
      vus: d.vus,
      pris: d.pris,
      atteignables: atteignables(p.version),
      total: 151,
      legendaires: leg,
      // 🔴 [17/08] LA TEXTURE DES COMBATS VOYAGE AVEC LE BILAN. Quatre nombres
      //    agrégés par type d'adversaire — combats, tours, réglés en un coup,
      //    Pokémon engagés — pour que `tools/poke-reel.mjs` lise enfin ce que
      //    les joueurs décrivent (« ça ne résiste pas ») et non ce qu'un
      //    simulateur, qui joue plus mal qu'eux, veut bien en dire.
      //    ⚠️ AUCUN DÉTAIL DE PARTIE, et le barème du serveur ne les lit pas :
      //       ces champs ne peuvent rien payer. Voir `js/poke/ui.js`.
      texture: p.texture || null,
      // 🔴 LE BILAN NE DISAIT PAS QUI ÉTAIT À TERRE — audit du 14/08. Hors
      //    Nuzlocke, un voyage se termine par `epuise` (trois échecs dans
      //    l'acte) et l'équipe reste ENTIÈRE, tous à zéro PV. L'écran de fin
      //    annonçait donc l'arrêt du voyage, puis alignait six créatures qui
      //    avaient l'air en pleine forme. La classe de défaut n°1 du projet,
      //    sur le dernier écran vu.
      //    ⚠️ On AJOUTE `ko`, on ne remplace rien : le classement rejoue ce
      //       bilan et la carte de partage le lit. Même règle que `perdusNoms`.
      equipe: p.equipe.map(function (m) {
        return { n: m.n, niveau: m.niveau, surnom: m.surnom, ko: (m.pv || 0) <= 0 };
      }),
      perdus: p.perdus.length,
      // 🔴 CE QUI EST TOMBÉ, TOUTES RÈGLES CONFONDUES — voir `appliquerNuzlocke`.
      //    `perdus` ne vaut qu'en Nuzlocke ; la chasse « Aucun tombé » lisait
      //    donc un zéro garanti dans les trois autres règles.
      tombes: p.tombes || 0,
      //  🔴 ET COMBIEN DE BADGES AVANT LA PREMIÈRE CHUTE. `tombes` seul ne peut
      //     pas juger « trois badges sans perdre un Pokémon » : il dit l'état à
      //     la FIN, la phrase parle d'un MOMENT. Voir `gagnerBadge`.
      //  ⚠️ Les voyages d'avant ce jour n'ont pas ce champ : `bilan` rend alors
      //     zéro, et la chasse reste simplement à faire. On ne rétro-attribue
      //     rien — un succès qu'on n'a pas vu accomplir ne s'accorde pas.
      badgesSansChute: p.badgesSansChute || 0,
      // 🔴 LE TITRE PROMETTAIT UN MÉMORIAL ET LIVRAIT UN COMPTEUR. L'écran de
      //    fin affichait « PERDUS POUR TOUJOURS » puis « 3 », pendant que la
      //    section juste au-dessous déroulait six vignettes illustrées pour
      //    l'équipe survivante. `p.perdus` porte les créatures depuis toujours ;
      //    le bilan n'en transportait que la longueur.
      //    ⚠️ `perdus` GARDE son compte : la carte de partage et le classement
      //       le lisent comme un nombre, et changer son type les casserait en
      //       silence. On AJOUTE, on ne remplace pas.
      perdusNoms: p.perdus.map(function (x) { return { n: x.n, niveau: x.niveau }; }),
      acte: p.acte,
      actes: W.PokeActes ? W.PokeActes.nombre() : 9,
      noeuds: Object.keys(p.noeudsVisites || {}).length,
      perdues: p.branchesPerdues || 0,
      // 🔴 LE BILAN PORTE LES SERMENTS, et c'est ce qui permet aux chasses de
      //    les lire sans fouiller la partie. Un voyage se juge sur ce qu'il a
      //    coûté autant que sur ce qu'il a rapporté — « gagner trois badges en
      //    ayant juré la solitude » n'est pas la même performance que sans.
      serments: (p.serments || []).slice(),
      // 🔴 LE SCEAU VOYAGE DANS LE BILAN. L'écran de fin, la carte de partage
      //    et le classement lisent tous ce même objet : un palier qui ne s'y
      //    trouve pas ne pourrait s'afficher nulle part, et un score gonflé de
      //    quatre-vingts pour cent sans qu'on dise pourquoi ressemble à un bug.
      sceau: p.sceau || 0,
      score: score(p),
      fini: p.fini,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UNE CAPTURE QUI REJOINT — LA PORTE UNIQUE
  //
  //  🔴 LA RÈGLE ÉTAIT ÉCRITE DEUX FOIS : dans `ui.js` pour le jeu, et dans
  //     `poke-difficulte.mjs` pour la mesure. Deux copies d'une règle finissent
  //     par diverger, et la divergence se lit comme « l'instrument ment ».
  //     Elle vit donc ici, et les deux l'appellent.
  //  ⚠️ Elle applique DEUX choses dans l'ordre : le niveau du recruteur, puis
  //     les places de l'équipe. L'inverse mettrait en réserve un Pokémon qu'on
  //     vient de monter, ce qui gaspillerait l'acquis sans le dire.
  //  ⚠️ `captureNiveau` ne monte JAMAIS au-dessus de la tête : capturer
  //     deviendrait meilleur que se battre, et le mode cesserait d'être un
  //     mode de combat.
  // ═══════════════════════════════════════════════════════════════════════════
  function rejoint(p, mon, h) {
    var e = W.PokeSerments ? W.PokeSerments.effet(p) : null;
    if (e && e.captureNiveau && p.equipe[0] && mon.niveau < p.equipe[0].niveau && W.PokeMoteur) {
      mon = W.PokeMoteur.creer(mon.n, p.equipe[0].niveau, h);
    }
    var places = (e ? e.equipeMax : 6) || 6;
    if (p.equipe.length < places) p.equipe.push(mon);
    else { p.boite = p.boite || []; p.boite.push(mon); }
    return mon;
  }

  W.PokePartie = {
    rejoint: rejoint,
    RIVAL_CONTRE: RIVAL_CONTRE,
    POIDS: POIDS,
    aLaBall: aLaBall,
    aLObjet: aLObjet,
    utiliserObjet: utiliserObjet,
    utiliserBall: utiliserBall,
    meilleureBall: meilleureBall,
    creer: creer,
    // Le seuil vit avec la règle qui le fabrique : la carte et l'écran le
    // lisent, aucun des deux ne le recopie.
    MEW_TRACES: MEW_TRACES,
    choisirStarter: choisirStarter,
    voir: voir,
    prendre: prendre,
    comptePokedex: comptePokedex,
    atteignables: atteignables,
    atteignablesToutes: atteignablesToutes,
    atteignablesSet: atteignablesSet,
    rencontre: rencontre,
    prendreNoeud: prendreNoeud,
    revenirAuNoeud: revenirAuNoeud,
    carteSansIssue: carteSansIssue,
    acteSuivant: acteSuivant,
    PENSION_MAX: PENSION_MAX,
    PENSION_PRIX: PENSION_PRIX,
    pensionDepot: pensionDepot,
    pensionReprise: pensionReprise,
    gagnerBadge: gagnerBadge,
    badgesActifs: badgesActifs,
    horsCombat: horsCombat,
    ESSAIS_BOSS: ESSAIS_BOSS,
    RIVAL_RENCONTRES: RIVAL_RENCONTRES,
    rencontresRival: rencontresRival,
    equipeRival: equipeRival,
    rivalCroise: rivalCroise,
    croiserRival: croiserRival,
    echangerReserve: echangerReserve,
    mettreEnTete: mettreEnTete,
    deplacer: deplacer,
    echangerAttaques: echangerAttaques,
    echouerDansLActe: echouerDansLActe,
    essaisRestants: essaisRestants,
    appliquerNuzlocke: appliquerNuzlocke,
    score: score,
    // Le barème seul, pour le serveur : il rejoue un RÉSUMÉ, pas une partie.
    scoreDeBilan: scoreDeBilan,
    bilan: bilan,
  };

  //  ⚠️ `STARTERS` SE LIT COMME UN TABLEAU, ET C'EST VOULU. Dix outils écrivent
  //     `P.STARTERS[0]` ou `h.dans(P.STARTERS)` ; en faire une fonction les
  //     aurait tous cassés, et surtout : chacun serait devenu un endroit de
  //     plus où l'on décide quel monde on interroge. Le lecteur rend le canon
  //     du monde POSÉ, donc un outil qui pose `gen2` éprouve Johto sans avoir
  //     une ligne à changer.
  Object.defineProperty(W.PokePartie, "STARTERS", { get: STARTERS, enumerable: true });
})(typeof window !== "undefined" ? window : globalThis);
