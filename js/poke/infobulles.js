(function (W, D) {
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
  //  LES INFOBULLES — L'ÉCRAN DU POKÉDEX, EN PETIT
  //
  //  🔴 CE N'EST PAS UNE BULLE GÉNÉRIQUE. C'est l'appareil : cadre de métal,
  //     vitre, chasse fixe. La même partout — combat, équipe, Pokédex,
  //     boutique, classement — parce qu'un joueur qui a appris à lire une
  //     infobulle les a toutes apprises.
  //
  //  🔴 MARQUEUR 7 DU TEST ANTI-VIBE-CODE : « pastilles d'état qui ne disent
  //     rien ». Ici, une infobulle SANS DONNÉE RÉELLE NE S'AFFICHE PAS. Le
  //     constructeur rend `null`, et rien n'apparaît. C'est ce que vérifie
  //     `tools/poke-infobulles.mjs`.
  //  ⚠️ CE COMMENTAIRE A DÉSIGNÉ PENDANT DES SEMAINES UN OUTIL QUI N'EXISTAIT
  //     PAS (`tools/poke-tooltips.mjs`). Une garde annoncée et absente est pire
  //     qu'une garde absente : on cesse de regarder ce qu'on croit surveillé —
  //     et c'est précisément sous cette phrase que le bâtisseur `objet` est
  //     resté limité à cinq Balls pendant que le sac en affichait quarante.
  //
  //  Accessible par construction : elle s'ouvre au survol ET au clavier
  //  (`focus`), elle se ferme à `Échap`, et sur écran tactile un appui suffit.
  //  Elle n'emprisonne jamais le focus — ce n'est pas une fenêtre.
  // ═══════════════════════════════════════════════════════════════════════════

  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  var ATT = function () { return W.PokeRegles ? W.PokeRegles.attaques() : W.POKE_ATTAQUE_PAR_CLE; };
  var LANG = function () { return W.POKE_LANG || "fr"; };

  var TXT = {
    type: { fr: "Type", en: "Type" },
    types: { fr: "Types", en: "Types" },
    puissance: { fr: "Puissance", en: "Power" },
    precision: { fr: "Précision", en: "Accuracy" },
    pp: { fr: "PP", en: "PP" },
    categorie: { fr: "Catégorie", en: "Category" },
    // 🔴 La ligne qui répond à « pourquoi ce Pokémon connaît ÇA ». Voir la
    //    branche `attaque` : elle nomme la MACHINE, jamais la façon dont ce
    //    Pokémon-là l'a apprise — le jeu ne garde pas cette trace.
    machine: { fr: "S'enseigne par", en: "Taught by" },
    ctNumero: { fr: "CT {n}", en: "TM {n}" },
    physique: { fr: "Physique", en: "Physical" },
    special: { fr: "Spécial", en: "Special" },
    statut: { fr: "Statut", en: "Status" },
    capture: { fr: "Taux de capture", en: "Catch rate" },
    craint: { fr: "Craint", en: "Weak to" },
    encaisse: { fr: "Encaisse", en: "Resists" },
    insensible: { fr: "Insensible à", en: "Immune to" },
    efficace: { fr: "Efficace contre", en: "Strong against" },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [20/08, Quirrel sur X] « LE TYPE INSECTE EST SUPER EFFICACE SUR LE
    //     POISON » — signalé comme un bug, capture à l'appui : son Dardargnan
    //     frappe ×4 sur Empiflor. Le jeu a raison : en PREMIÈRE génération,
    //     l'Insecte bat le Poison (et le Poison bat l'Insecte) ; c'est la
    //     génération 2 qui a inversé les deux. Trois cases séparent les deux
    //     tables, et le mode sert celle du monde qu'on joue.
    //  🔑 CE N'ÉTAIT PAS UN DÉFAUT DE RÈGLE, C'ÉTAIT UN DÉFAUT DE PAROLE. Un
    //     joueur qui connaît les jeux d'aujourd'hui lit un bug là où il y a du
    //     canon, et il a raison de le signaler : rien à l'écran ne datait la
    //     table. La bulle des types le dit maintenant, à l'endroit exact où la
    //     question se pose.
    //  ⚠️ La phrase est celle du MONDE, pas une constante : Johto sert la table
    //     de 1999 et doit dire 1999.
    // ═══════════════════════════════════════════════════════════════════════
    tableDe: { fr: "Table", en: "Chart" },
    tableGen1: {
      fr: "Celle de 1996 : l'Insecte y bat le Poison, la Glace n'y craint pas le Feu.",
      en: "The 1996 one: Bug beats Poison here, and Ice does not fear Fire.",
    },
    tableGen2: {
      fr: "Celle de 1999 : l'Insecte n'y peut plus rien contre le Poison.",
      en: "The 1999 one: Bug no longer does anything to Poison here.",
    },
    faibleContre: { fr: "Peu efficace contre", en: "Weak against" },
    sansEffet: { fr: "Sans effet sur", en: "No effect on" },
    pokedex: { fr: "Pokédex", en: "Pokédex" },
    jamaisVu: { fr: "Jamais croisé", en: "Never seen" },
    vu: { fr: "Vu", en: "Seen" },
    pris: { fr: "Capturé", en: "Caught" },
    champion: { fr: "Champion", en: "Leader" },
    ouvre: { fr: "Ouvre", en: "Unlocks" },
    reste: { fr: "Il t'en reste", en: "You have" },
    // Les refus, tels que le moteur les nomme. Chacun dit l'ÉTAT qui bloque,
    // pas la règle : « il est déjà au maximum » se vérifie d'un coup d'œil sur
    // la barre, « la règle interdit le soin à pleine vie » ne se vérifie nulle
    // part.
    // Les deux leviers de la prise, en CHIFFRES relatifs — mesurés, pas devinés.
    // Le sommeil et le gel valent 25 dans le calcul, la paralysie, le poison et
    // la brûlure 12 : exactement moitié moins.
    priseStatut: { fr: "Sommeil et gel aident le plus. Paralysie, poison, brûlure : moitié moins.",
                   en: "Sleep and freeze help most. Paralysis, poison, burn: half as much." },
    prisePv: { fr: "Descendre ses PV compte autant que le rang de la Poké Ball.",
               en: "Dropping its HP counts as much as the Poké Ball's grade." },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 « LA SUPER BALL NE DEVRAIT PAS ÊTRE PLUS EFFICACE QUE L'HYPER BALL »
    //     — rapport de bug du 16/08, capture à l'appui : Super 24 %, Hyper
    //     21 %. Ce n'est pas un défaut : c'est la première génération, et le
    //     ROM est formel (`item_effects.asm`, « It's 8 for Great Balls and 12
    //     for the others »). Le diviseur de PV de la Super Ball est MEILLEUR ;
    //     l'Hyper Ball ne gagne que sur sa plage de premier jet. Mesuré ici :
    //     Roucool à pleine vie, Super 50 % contre Hyper 34 % — mais Mewtwo à
    //     10 % de PV, Hyper 3 % contre Super 2 %.
    //  🔑 LE JEU APPLIQUAIT LA RÈGLE ET NE LA DISAIT PAS : deux joueurs ont
    //     donc conclu à un bug, et le second a ouvert un rapport. La même
    //     classe que partout ailleurs dans ce dossier — sauf qu'ici le chiffre
    //     affiché était JUSTE, et c'est le silence autour qui le rendait faux.
    //  ⚠️ On ne donne pas un conseil, on donne la règle : « commune » et
    //     « rare et affaiblie » se vérifient à l'écran, « prends une Super »
    //     s'oublie.
    // ═══════════════════════════════════════════════════════════════════════
    priseRang: { fr: "Comme en 1996 : Super Ball sur une commune, Hyper Ball sur une rare affaiblie.",
                 en: "As in 1996: Great Poké Ball on a common one, Ultra Poké Ball on a weakened rare one." },
    refusTitre: { fr: "Indisponible", en: "Unavailable" },
    refus_aUnDresseur: { fr: "Il appartient à un dresseur. On ne le capture pas.",
                         en: "It belongs to a trainer. You cannot catch it." },
    refus_seulDebout: { fr: "Personne d'autre ne tient debout.",
                        en: "Nobody else is still standing." },
    // ⚠️ PAS LA MÊME PHRASE QUAND ON EST PARTI SEUL. « Personne d'autre ne
    //    tient debout » raconte des coéquipiers tombés — or au premier acte en
    //    solo, personne n'est tombé : il n'y a personne. Relevé en jouant.
    // 🔴 LES DEUX REFUS DU MENU ÉQUIPE, qui n'existaient pas : les deux boutons
    //    éteints de cet écran s'éteignaient sans un mot, alors que le sac et le
    //    menu principal disent tous leurs refus.
    refus_relaisATerre: { fr: "Il est à terre. Il ne peut pas entrer.",
                          en: "It has fainted. It cannot be sent out." },
    refus_relaisEnJeu: { fr: "Il est déjà sur le terrain.",
                         en: "It is already out." },
    // ⚠️ Et le refus du menu des coups : « 0/15 » était écrit, rien ne le liait
    //    au gris du bouton.
    refus_plusDePP: { fr: "Plus un seul PP pour ce coup.",
                      en: "No PP left for this move." },
    refus_sansAutre: { fr: "Tu n'as personne d'autre.",
                       en: "You have no one else." },
    refus_fuiteDresseur: { fr: "On ne fuit pas un dresseur. Il faut le battre ou tomber.",
                           en: "You do not flee a trainer. Beat them or fall." },
    refus_pleineVie: { fr: "Il est déjà au maximum de ses PV.", en: "It is already at full HP." },
    refus_rienALever: { fr: "Il n'a aucun état à lever.", en: "It has no status to clear." },
    refus_debout: { fr: "Il est debout. Un Rappel ne sert qu'à terre.", en: "It is standing. A Revive only works on a fainted Pokémon." },
    // ⚠️ EN COMBAT, LE RAPPEL NE VISE QUE L'ACTIF — toujours debout. On ne peut
    //    y désigner un tombé au banc : ça se fait au sac de la carte. Le refus
    //    indique donc OÙ agir plutôt que d'opposer un « il est debout » qui
    //    parle du mauvais Pokémon.
    refus_rappelHorsCombat: { fr: "Se joue au sac, entre deux combats.", en: "Used from the bag, between battles." },
    refus_aTerre: { fr: "Il est à terre. Seul un Rappel le relève.", en: "It has fainted. Only a Revive brings it back." },
    refus_palierPlein: { fr: "Ce cran est déjà au plafond.", en: "That stat is already maxed out." },
    refus_gardePosee: { fr: "La garde est déjà posée.", en: "The guard is already up." },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [17/08, rapport de .nevix] LE TOUR PRIS NE DISAIT RIEN, ET IL VOLAIT.
    //     « Quand notre Pokémon est pris au piège dans Danse Flammes on ne peut
    //     pas lancer de Pokéball. » Le refus est la règle (13/08) ; ce qui
    //     n'allait pas, c'est que l'écran laissait cliquer, RETIRAIT la Ball du
    //     sac, et la transformait en attaque. Cinq mécaniques prennent le tour
    //     du joueur — chacune a maintenant sa phrase, parce qu'un « pris au
    //     piège » posé sur une charge de Lance-Soleil serait un mensonge.
    // ═══════════════════════════════════════════════════════════════════════
    refus_etreint: { fr: "Il est pris au piège. Seul un changement le libère.",
                     en: "It is trapped. Only a switch frees it." },
    refus_serre: { fr: "Il tient sa prise. Il ne lâchera pas avant la fin.",
                   en: "It is holding its grip. It will not let go until the end." },
    refus_charge: { fr: "Le coup est en train de se charger.",
                    en: "The move is still charging." },
    refus_fureur: { fr: "Il ne peut plus s'arrêter avant la fin de sa série.",
                    en: "It cannot stop before its rampage ends." },
    refus_patience: { fr: "Il encaisse. Il rendra tout d'un coup.",
                      en: "It is taking the hits. It will give them all back at once." },
    refus_rage: { fr: "Il est en rage. Il ne fera plus que frapper.",
                  en: "It is enraged. All it will do now is strike." },
    //  ⚠️ CELLE-CI DIT LA SORTIE, parce qu'il y en a une : contrairement aux
    //     cinq autres, un Bis se quitte en changeant de Pokémon. Un bouton
    //     ÉQUIPE allumé sans un mot passerait pour une erreur d'écran.
    refus_bis: { fr: "Il est forcé de rejouer le même coup. Un changement le libère.",
                 en: "It is forced to repeat the same move. A switch frees it." },
    // Les effets de statut, en CHIFFRES. Une infobulle ne raconte pas, elle
    // relève : c'est la différence entre un appareil et une notice.
    st_para: { fr: "Vitesse divisée par 4. Un tour sur quatre est perdu.", en: "Speed cut to a quarter. One turn in four is lost." },
    st_brulure: { fr: "Attaque divisée par 2. Perd un seizième de ses PV par tour.", en: "Attack halved. Loses a sixteenth of its HP each turn." },
    st_gel: { fr: "Ne peut plus agir. Une attaque de Feu le dégèle.", en: "Cannot act. A Fire move thaws it." },
    st_sommeil: { fr: "Ne peut plus agir pendant 1 à 7 tours.", en: "Cannot act for 1 to 7 turns." },
    st_poison: { fr: "Perd un seizième de ses PV par tour.", en: "Loses a sixteenth of its HP each turn." },
    st_poisonGrave: { fr: "Perd de plus en plus de PV à chaque tour.", en: "Loses more HP with every turn." },
    st_confusion: { fr: "Une fois sur deux, se blesse au lieu d'attaquer.", en: "Half the time, hurts itself instead of attacking." },
    // ── Les marqueurs de la carte et des cartes à choisir ──────────────────
    loi_traceTitre: { fr: "Une trace de Mew", en: "A trace of Mew" },
    loi_traceDit: {
      fr: "Trois traces dans le même voyage, et la chasse s'ouvre. Chacune coûte une branche.",
      en: "Three traces in one journey opens the hunt. Each one costs a branch.",
    },
    //  Le titre reprend MOT POUR MOT la pastille du nœud (`uneSeuleFois` dans
    //  `ui.js`) : l'infobulle explique ce qu'on vient de toucher, elle ne doit
    //  pas le renommer au passage.
    loi_noeudTitre: { fr: "Maintenant ou jamais", en: "Now or never" },
    loi_noeudDit: {
      fr: "Ce lieu ne reparaîtra plus dans l'acte. Le prendre, c'est renoncer aux autres.",
      en: "This place will not appear again this act. Taking it means giving up the others.",
    },
    loi_machineTitre: { fr: "À usage unique", en: "Single use" },
    loi_machineDit: {
      fr: "Une CT ne sert qu'une fois. Choisis bien qui l'apprend.",
      en: "A TM works only once. Choose carefully who learns it.",
    },
    // 🔴 CELUI-CI MANQUAIT — 11/08/2026. « POUR TOUJOURS » et « À USAGE UNIQUE »
    //    sortent de la MÊME classe `pkdx-butin-rarete`, sur deux écrans de même
    //    forme (prends-en un, les autres sont perdus). Le second portait sa loi
    //    depuis la v500, le premier non : j'avais couvert la moitié de la
    //    famille. *Deux marqueurs de même famille disent leur loi, ou aucun.*
    loi_acquisTitre: { fr: "Pour toujours", en: "Forever" },
    loi_acquisDit: {
      //  ⚠️ « les DEUX autres » retiré le 17/08 : une infobulle énonce une LOI,
      //     elle n'a pas la liste sous les yeux — et cette liste n'a pas
      //     toujours trois entrées. Une loi ne chiffre que ce qu'elle sait.
      fr: "Cet acquis reste jusqu'à la fin du voyage. Les autres sont perdus.",
      en: "This gain lasts to the end of the journey. The others are lost.",
    },
  };
  // Les marqueurs en capitales de la carte, et la loi que chacun énonce. Une
  // table plutôt qu'un `if` : un marqueur neuf s'ajoute ici, avec sa phrase.
  var LOIS = {
    trace: { titre: "loi_traceTitre", dit: "loi_traceDit" },
    noeud: { titre: "loi_noeudTitre", dit: "loi_noeudDit" },
    machine: { titre: "loi_machineTitre", dit: "loi_machineDit" },
    acquis: { titre: "loi_acquisTitre", dit: "loi_acquisDit" },
  };
  // Porte unique : l'accord en genre et en nombre se résout à un seul endroit.
  function T(c, vars) { return W.PokeGenre.pour(TXT, c, vars, "infobulles"); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  var nomType = function (t) { return W.POKE_TYPE_NOMS[t][LANG()]; };
  // 🔴 La pastille passe par la porte unique `PokeType` : c'est elle qui garantit
  //    qu'une couleur de type ne s'affiche jamais sans son nom. Le suffixe (un
  //    multiplicateur d'efficacité) se colle À CÔTÉ, pas dedans — la pastille
  //    doit rester lisible comme une étiquette de type.
  function past(t, s) {
    var p = W.PokeType.pastille(t);
    return s ? p + '<span class="pkdx-chiffre"> ' + esc(s) + "</span>" : p;
  }
  function ligne(cle, valeur) { return "<dt>" + esc(T(cle)) + "</dt><dd>" + valeur + "</dd>"; }

  // ── Les constructeurs ──────────────────────────────────────────────────────
  //  Chacun rend du HTML, ou `null` s'il n'a pas de donnée. Pas de bulle vide.
  // ═════════════════════════════════════════════════════════════════════════
  //  LA MÊME RAISON, EN TEXTE NU — POUR CEUX QUI N'ONT PAS DE SURVOL
  //
  //  🔴 UN BOUTON GRIS NE DIT PAS QU'IL A QUELQUE CHOSE À DIRE. La raison du
  //   refus existait, et elle était même atteignable partout — j'ai mesuré
  //   l'appui tactile sur un bouton éteint : la bulle s'ouvre et porte bien
  //   « Il est déjà au maximum de ses PV. »
  //   ⚠️ J'AVAIS ÉCRIT ICI QU'ELLE ÉTAIT ILLISIBLE AU DOIGT. C'ÉTAIT FAUX, et
  //      la phrase a été livrée avant d'être vérifiée. `infobulles.js` branche
  //      un `touchstart` depuis toujours.
  //   Ce qui manquait n'est pas l'accès, c'est l'INDICE : il faut déjà
  //   soupçonner qu'il y a quelque chose à lire pour aller le chercher, et
  //   rien sur un bouton gris ne le laisse penser. Une information qu'on ne
  //   consulte que si on la devine ne se consulte pas.
  //  🔴 ET L'ÉTAL LE FAISAIT DÉJÀ. La boutique écrit ses refus en clair sous
  //   l'article — « Trop cher », « Personne n'apprend ça ». Même donnée,
  //   deux traitements : le joueur réapprend à lire d'un écran à l'autre.
  //  ⚠️ MÊME TABLE, PAS UNE SECONDE. Cette porte ne fait que dévêtir la
  //   phrase de son balisage ; une table courte « pour les boutons » aurait
  //   fini par ne plus dire la même chose que l'infobulle.
  // ═════════════════════════════════════════════════════════════════════════
  function raison(v) {
    return TXT["refus_" + v] ? T("refus_" + v) : null;
  }

  var BATISSEURS = {
    espece: function (v, partie) {
      var e = ESP()[+v];
      if (!e) return null;
      var etat = partie ? (partie.pris[e.n] ? "pris" : partie.vus[e.n] ? "vu" : "inconnu") : null;
      // Une espèce jamais croisée ne livre rien : le Pokédex est vide, et
      // l'infobulle doit dire ça, pas tout dévoiler.
      if (etat === "inconnu") {
        return { titre: "N° " + e.n, corps: ligne("pokedex", esc(T("jamaisVu"))) };
      }
      var r = W.PokePokedex.rapports(e.types);
      return {
        titre: "N° " + e.n + " · " + esc(e.nom[LANG()]),
        type: e.types[0],
        corps:
          ligne(e.types.length > 1 ? "types" : "type", e.types.map(function (t) { return past(t); }).join(" ")) +
          ligne("craint", r.faible.map(function (x) { return past(x.t, x.m > 2 ? " ×4" : ""); }).join(" ") || "—") +
          (r.immune.length ? ligne("insensible", r.immune.map(function (t) { return past(t); }).join(" ")) : "") +
          ligne("capture", e.capture + " / 255") +
          (etat ? ligne("pokedex", esc(T(etat))) : ""),
      };
    },

    attaque: function (v, partie, el) {
      var a = ATT()[v];
      if (!a) return null;
      // Les PP restants viennent du BOUTON, pas de la table : la table dit le
      // maximum, le joueur veut savoir ce qui lui reste.
      var pp = el && el.getAttribute("data-pp");
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 « SALAMÈCHE QUI APPREND UNE ATTAQUE PSY ??? » — propriétaire, 15/08.
      //     Le jeu avait raison : Repos est la CT 44 et Salamèche l'accepte
      //     dans le ROM ; `quiApprend` vérifie la compatibilité par espèce, et
      //     elle est dans la donnée. Mais RIEN, nulle part, ne disait d'où
      //     l'attaque venait — un Feu avec un coup Psy avait l'air d'un bug, et
      //     le seul moyen de savoir était d'aller lire la table.
      //     C'est la classe n°1 du dossier : le jeu SAIT, et il ne dit pas.
      //  ✅ Le numéro de machine se lit dans `POKE_CT`, qui est déjà chargé et
      //     déjà indexé par clé. Aucune donnée neuve, aucun état à tenir : une
      //     attaque enseignable par capsule le dit, les autres se taisent.
      //  ⚠️ ON DIT « ELLE S'ENSEIGNE PAR », PAS « TU L'AS APPRISE PAR ». La
      //     provenance d'un coup n'est écrite nulle part sur le Pokémon — un
      //     même coup peut venir du niveau ou de la machine. Affirmer l'un des
      //     deux serait inventer un fait que le jeu ne connaît pas.
      // ═══════════════════════════════════════════════════════════════════════
      var machine = W.POKE_CT_PAR_CLE && W.POKE_CT_PAR_CLE[v];
      return {
        titre: esc(a.nom[LANG()]),
        type: a.type,
        corps:
          ligne("type", past(a.type)) +
          ligne("categorie", esc(T(a.categorie === "special" ? "special" : "physique"))) +
          ligne("puissance", a.puissance ? a.puissance : "—") +
          ligne("precision", a.precision + " %") +
          (pp ? ligne("pp", esc(pp)) : "") +
          (machine ? ligne("machine", esc(T("ctNumero", { n: machine.n }))) : "") +
          (a.texte && a.texte[LANG()] ? "<dd>" + esc(a.texte[LANG()]) + "</dd>" : ""),
      };
    },

    // Le type : ses forces ET ses faiblesses, calculées dans les deux sens.
    // C'est l'infobulle la plus utile du jeu, et celle qu'aucun tableau statique
    // ne remplace.
    type: function (v) {
      var table = (W.PokeRegles ? W.PokeRegles.table() : W.POKE_TYPE_TABLE)[v];
      if (!table) return null;
      var fort = [], faible = [], nul = [], contre = { faible: [], resiste: [], immune: [] };
      var tous = W.PokeRegles ? W.PokeRegles.types() : W.POKE_TYPES, i;
      for (i = 0; i < tous.length; i++) {
        var m = table[tous[i]];
        if (m > 1) fort.push(tous[i]);
        else if (m === 0) nul.push(tous[i]);
        else if (m < 1) faible.push(tous[i]);
      }
      var r = W.PokePokedex.rapports([v]);
      return {
        titre: esc(nomType(v)),
        type: v,
        corps:
          ligne("efficace", fort.map(function (t) { return past(t); }).join(" ") || "—") +
          ligne("faibleContre", faible.map(function (t) { return past(t); }).join(" ") || "—") +
          (nul.length ? ligne("sansEffet", nul.map(function (t) { return past(t); }).join(" ")) : "") +
          ligne("craint", r.faible.map(function (x) { return past(x.t); }).join(" ") || "—") +
          ligne("encaisse", r.resiste.map(function (x) { return past(x.t); }).join(" ") || "—") +
          // La table est datée : voir `tableGen1`. Le monde décide de la phrase.
          ligne("tableDe", esc(T((W.PokeRegles && W.PokeRegles.courant() === "gen2") ? "tableGen2" : "tableGen1"))),
      };
    },

    statut: function (v) {
      if (!TXT["st_" + v]) return null;
      return { titre: esc(T("statut")), corps: "<dd>" + esc(T("st_" + v)) + "</dd>" };
    },

    // ═════════════════════════════════════════════════════════════════════════
    //  LE REFUS SEUL — POUR LES BOUTONS QUI N'ONT PAS D'OBJET DERRIÈRE
    //
    //  🔴 « UN BOUTON ÉTEINT SANS RAISON EST UN BOUTON CASSÉ » était appliqué
    //     aux objets seulement, parce que `appliquerObjet` nommait ses refus.
    //     Balayé en jouant le 09/08 : ÉQUIPE s'éteint quand personne d'autre ne
    //     peut se battre, FUIR s'éteint devant un dresseur, la Ball aussi — trois
    //     boutons qui s'éteignent sans un mot, et le joueur ne peut pas
    //     distinguer une règle du jeu d'un défaut de l'écran.
    //  🔴 UNE SEULE PORTE POUR TOUS. `refus_*` est la table qui existe déjà pour
    //     les objets ; ce bâtisseur la rend accessible aux boutons qui n'ont pas
    //     d'objet à décrire. Une deuxième table de raisons aurait fini par ne
    //     plus dire la même chose que la première.
    // ═════════════════════════════════════════════════════════════════════════
    refus: function (v) {
      if (!TXT["refus_" + v]) return null;
      return { titre: esc(T("refusTitre")), corps: '<dd class="pkdx-info-refus">' + esc(raison(v)) + "</dd>" };
    },


    // 🔴 LA RÈGLE DU JOUR DIT CE QU'ELLE FAIT, PAS SEULEMENT SON NOM. Le
    //    bandeau n'a la place que d'un titre — « Économie de guerre » ne dit
    //    pas qu'on ne peut plus se soigner. Sans ce corps, le joueur découvre
    //    la contrainte au moment où elle le punit, et il la prend pour un bug.
    // 🔴 L'ACQUIS DIT CE QU'IL FAIT, PAS SEULEMENT SON NOM. « La bourse tenue »
    //    se retient mieux qu'« argent ×1,5 » — c'est pour ça qu'il porte un nom
    //    de monde — mais on doit pouvoir retrouver le chiffre sans quitter
    //    l'écran. Le nom sur la carte, l'effet au survol.
    acquis: function (v) {
      var q = W.PokeAcquis ? W.PokeAcquis.de(v) : null;
      if (!q) return null;
      return { titre: esc(q.nom[LANG()]), corps: "<dd>" + esc(q.dit[LANG()]) + "</dd>" };
    },

    // 🔴 LE SERMENT MANQUAIT, ET SON ÉCRAN DISAIT POURQUOI IL FALLAIT L'AVOIR.
    //    « Ce qu'on a déjà juré reste sous les yeux » — le commentaire ajoute :
    //    « au huitième badge, un joueur ne se souvient plus de ses sept
    //    engagements, et c'est précisément là que le choix compte le plus ».
    //    La liste ne donnait pourtant que des NOMS. L'acquis, juste à côté,
    //    porte sa phrase depuis toujours. *Un rappel qui ne rappelle qu'un nom
    //    ne répond pas à « à quoi ça sert ? ».*
    serment: function (v) {
      var s = W.PokeSerments ? W.PokeSerments.de(v) : null;
      if (!s) return null;
      return { titre: esc(s.nom[LANG()]), corps: "<dd>" + esc(s.dit[LANG()]) + "</dd>" };
    },

    regleDuJour: function (v) {
      var r = W.PokeRegleDuJour ? W.PokeRegleDuJour.de(v) : null;
      if (!r) return null;
      return { titre: esc(r.nom[LANG()]), corps: "<dd>" + esc(r.dit[LANG()]) + "</dd>" };
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  LES MARQUEURS DE LA CARTE — « qu'est-ce que ça veut dire ? »
    //
    //  🔴 DEUX MARQUEURS PORTAIENT LE MÊME TEXTE POUR DEUX RÈGLES DIFFÉRENTES.
    //     « UNE SEULE FOIS » sur un nœud de la carte voulait dire *ce lieu ne
    //     reviendra pas dans l'acte* ; « UNE SEULE FOIS » sur une carte de
    //     capsule voulait dire *la machine se consomme à l'emploi*. Mêmes mots,
    //     deux lois — dans un mode dont toute la discipline est un mot par
    //     règle. Un joueur qui apprend l'un se trompe sur l'autre.
    //  🔴 ET AUCUN DES DEUX N'AVAIT DE QUOI S'EXPLIQUER. Ce sont des étiquettes
    //     en capitales de onze pixels sur le tout premier écran de jeu : elles
    //     énoncent une règle sans jamais la développer. Le mandat le demande
    //     mot pour mot — « qu'est-ce que c'est ? à quoi ça sert ? ».
    //  ⚠️ Une seule porte pour les deux, sinon on recrée exactement le défaut
    //     qu'on corrige : deux endroits qui expliquent deux marqueurs finissent
    //     par les expliquer pareil.
    // ═══════════════════════════════════════════════════════════════════════
    loi: function (v) {
      var l = LOIS[v];
      if (!l) return null;
      return { titre: esc(T(l.titre)), corps: "<dd>" + esc(T(l.dit)) + "</dd>" };
    },

    // Le badge dit ce qu'il FAIT, pas seulement qu'on l'a. Un badge est une
    // récompense chiffrée : l'infobulle donne le chiffre.
    badge: function (v) {
      var n = +v;
      var a = (ARENES() || []).filter(function (x) { return x.ordre === n; })[0];
      if (!a) return null;
      var cs = (W.PokeRegles && W.PokeRegles.badgePourCS()) || W.POKE_BADGE_POUR_CS || {};
      var ouvre = [];
      for (var c in cs) if (cs[c] === n) ouvre.push((CLES_V()[c] || {}).nom ? CLES_V()[c].nom[LANG()] : c);
      return {
        titre: esc(W.PokeGenre.nomBadge(a)),
        corps: ligne("champion", esc(W.PokeGenre.nomChampion(a))) + ligne("type", esc(a.type)) +
          (ouvre.length ? ligne("ouvre", esc(ouvre.join(", "))) : ""),
      };
    },

    // ═════════════════════════════════════════════════════════════════════════
    //  🔴 LE SAC POSAIT `data-info="objet"` SUR CHAQUE LIGNE, ET CETTE PORTE
    //     NE RÉPONDAIT QUE POUR CINQ BALLS. Une quarantaine d'objets — les
    //     potions, les remèdes d'état, les objets X, les pierres, les cannes —
    //     s'affichaient avec leur seul nom DANS L'ÉCRAN OÙ ON LES EMPLOIE, et
    //     le plus souvent en plein combat, c'est-à-dire au moment où la
    //     question « lequel ? » se pose vraiment. La carte de butin le disait,
    //     la boutique le disait, et le sac se taisait.
    //  🔴 LA MÊME PORTE QUE LA BOUTIQUE ET LE BUTIN. `PokeUI.ditObjet` est la
    //     seule phrase qui existe pour un objet donné ; une deuxième finirait
    //     par ne plus dire la même chose.
    //  🔴 ET LES NOMS VIENNENT DE `POKE_OBJETS`. La liste recopiée ici disait
    //     déjà « Ball Safari » là où la donnée dit « Safari Ball » — cinq
    //     lignes de copie avaient suffi à produire une divergence.
    // ═════════════════════════════════════════════════════════════════════════
    //  🔴 ET ELLE DIT POURQUOI LE BOUTON EST ÉTEINT. `appliquerObjet` nomme
    //     chacun de ses refus depuis toujours — « pleineVie », « aTerre »,
    //     « rienALever » — et AUCUN écran ne lisait ces noms : le sac de combat
    //     grisait le bouton, point. Devant une Potion éteinte en plein combat,
    //     rien ne distinguait un refus du jeu d'un défaut de l'écran.
    objet: function (v, partie, el) {
      var o = W.PokeRegles ? W.PokeRegles.objet(v) : (W.POKE_OBJETS && W.POKE_OBJETS[v]);
      if (!o) return null;
      var dit = W.PokeUI && W.PokeUI.ditObjet ? W.PokeUI.ditObjet(v) : "";
      var reste = partie && partie.sac ? partie.sac[v] : null;
      var refus = el && el.getAttribute ? el.getAttribute("data-info-refus") : null;
      // 🔴 LE BOUTON DONNE LE CHIFFRE, L'INFOBULLE DONNE LES LEVIERS. Depuis que
      //    la Ball affiche « prise 3 % », la question suivante est immédiate :
      //    comment le fait-on monter ? Sans réponse, le chiffre décourage au
      //    lieu d'apprendre — et sur un légendaire, qui n'accorde qu'un essai,
      //    l'ignorance coûte l'espèce pour de bon. Les deux leviers sont câblés
      //    dans `capture.js` depuis le premier jour et n'étaient écrits nulle
      //    part.
      //    ⚠️ Même grammaire que `data-info-refus` : un attribut posé par
      //       l'écran qui sait, lu par l'infobulle. Une deuxième façon de
      //       transporter un complément aurait fait deux conventions.
      var leviers = el && el.getAttribute ? el.getAttribute("data-info-leviers") : null;
      if (!dit && !reste) return null;
      return {
        titre: esc(o.nom[LANG()]),
        // `ditObjet` rend du texte déjà sûr — c'est la convention de la
        // boutique, qui l'insère de la même façon.
        corps: (reste ? ligne("reste", reste) : "") + (dit ? "<dd>" + dit + "</dd>" : "") +
          (leviers ? "<dd>" + esc(T("priseStatut")) + "</dd><dd>" + esc(T("prisePv")) + "</dd>" : "") +
          // ⚠️ SEULEMENT SUR LES DEUX BALLS QUE ÇA OPPOSE. Sur la Poké Ball ou
          //    la Master Ball, cette phrase serait du bruit — et une infobulle
          //    qui dit tout à tout le monde ne se lit plus.
          (leviers && (v === "GREAT_BALL" || v === "ULTRA_BALL")
            ? "<dd>" + esc(T("priseRang")) + "</dd>" : "") +
          (refus && TXT["refus_" + refus]
            ? '<dd class="pkdx-info-refus">' + esc(T("refus_" + refus)) + "</dd>" : ""),
      };
    },
  };

  // ── L'affichage ────────────────────────────────────────────────────────────
  var bulle = null, ancre = null, partieCourante = null;

  function fermer() {
    if (bulle) { bulle.remove(); bulle = null; ancre = null; }
  }

  function ouvrir(el) {
    var genre = el.getAttribute("data-info");
    var valeur = el.getAttribute("data-info-val");
    var bat = BATISSEURS[genre];
    if (!bat) return;
    var contenu = bat(valeur, partieCourante, el);
    // 🔴 Pas de donnée, pas de bulle. C'est la règle, et elle est ici.
    if (!contenu) return;
    fermer();
    ancre = el;
    bulle = D.createElement("div");
    bulle.className = "pkdx-info";
    bulle.setAttribute("role", "tooltip");
    // 🔴 Pas de `data-type` sur la bulle. Il servait à peindre un liseré latéral
    //    de la couleur du type — retiré le 07/08 comme marqueur 6 du test
    //    anti-vibe-code, et redondant avec la pastille qui est DANS la bulle.
    //    Garder l'attribut après avoir supprimé son seul usage, c'est laisser
    //    un état que rien ne lit : exactement ce que le marqueur 7 interdit.
    bulle.innerHTML = '<div class="pkdx-info-titre">' + contenu.titre + "</div><dl>" + contenu.corps + "</dl>";
    D.body.appendChild(bulle);
    placer(el);
  }

  // On place la bulle sous l'élément, et on la ramène DANS la fenêtre si elle
  // déborde. Sur téléphone, une bulle qui sort de l'écran n'existe pas.
  // ═══════════════════════════════════════════════════════════════════════════
  //  OÙ LA POSER — ET SURTOUT, JAMAIS SUR CE QU'ELLE EXPLIQUE
  //
  //  🔴 ELLE TOMBAIT SUR LE BOUTON, et deux joueurs PC en sont restés bloqués
  //     au premier combat le 16/08 : « on ne peut pas cliquer sur les attaques,
  //     le texte explicatif s'affiche sur le bouton ». Benjamin a donné la clé
  //     sans le savoir : « ça arrive quand on est trop bas sur la page ».
  //  🔑 LA CAUSE N'EST PAS LE DÉFILEMENT, C'EST LA HAUTEUR. Mesuré : une bulle
  //     de coup fait 346 px ; dans une fenêtre de 620 elle ne tient NI dessous
  //     NI dessus d'un bouton placé au milieu. L'ancien code basculait alors
  //     au-dessus, obtenait un `y` négatif, et le rabotait à `scrollY + marge`
  //     — c'est-à-dire en haut de la fenêtre, PILE sur le bouton.
  //     Le repli du repli n'avait pas de repli.
  //  ✅ TROIS PLACES, DANS L'ORDRE : dessous, dessus, puis À CÔTÉ. Le côté a
  //     toujours de la hauteur, et il ne peut pas recouvrir le bouton puisqu'il
  //     est ailleurs en largeur. On prend le côté le plus large des deux.
  //  ⚠️ Et si la bulle est plus haute que la fenêtre entière, aucune place
  //     n'existe : on la colle en haut. Elle dépassera — mais le bouton reste
  //     cliquable, parce que la feuille lui interdit de prendre la souris.
  //     *Une correction de placement ne couvre que les cas prévus ;
  //     `pointer-events: none` couvre tous les autres.*
  // ═══════════════════════════════════════════════════════════════════════════
  function placer(el) {
    var r = el.getBoundingClientRect();
    var b = bulle.getBoundingClientRect();
    var vueH = D.documentElement.clientHeight;
    var vueL = D.documentElement.clientWidth;
    var marge = 8, ecart = 6;
    var x = r.left + W.scrollX;
    var y;

    var placeDessous = vueH - r.bottom - ecart - marge;
    var placeDessus = r.top - ecart - marge;

    if (b.height <= placeDessous) {
      y = r.bottom + W.scrollY + ecart;                 // dessous, le cas normal
    } else if (b.height <= placeDessus) {
      y = r.top + W.scrollY - b.height - ecart;         // dessus
    } else {
      // Ni l'un ni l'autre : on se range À CÔTÉ, du côté le plus large.
      var placeGauche = r.left - ecart - marge;
      var placeDroite = vueL - r.right - ecart - marge;
      x = (placeDroite >= placeGauche)
        ? r.right + W.scrollX + ecart
        : r.left + W.scrollX - b.width - ecart;
      // Centrée sur le bouton, puis ramenée dans la fenêtre.
      y = r.top + W.scrollY + (r.height - b.height) / 2;
      y = Math.min(y, W.scrollY + vueH - b.height - marge);
      y = Math.max(y, W.scrollY + marge);
      bulle.style.left = Math.round(Math.max(W.scrollX + marge,
        Math.min(x, W.scrollX + vueL - b.width - marge))) + "px";
      bulle.style.top = Math.round(y) + "px";
      return;
    }

    if (x + b.width > W.scrollX + vueL - marge) x = W.scrollX + vueL - b.width - marge;
    if (x < W.scrollX + marge) x = W.scrollX + marge;
    bulle.style.left = Math.round(x) + "px";
    bulle.style.top = Math.round(Math.max(W.scrollY + marge, y)) + "px";
  }

  function cible(e) {
    var el = e.target;
    while (el && el !== D.body) {
      if (el.getAttribute && el.getAttribute("data-info")) return el;
      el = el.parentNode;
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 ON REGARDE AUSSI VERS LE BAS, ET C'EST UNE QUESTION DE POUCE.
    //     Les marqueurs de la carte (« maintenant ou jamais ») et de la carte de
    //     capsule (« à usage unique ») portent une explication, et ils vivent
    //     DANS un bouton. Pour qu'un clavier puisse les atteindre je leur avais
    //     posé un `tabindex` — deux fautes d'un coup : un élément focalisable
    //     imbriqué dans un bouton, et **sept cibles tactiles de 23 et 15 px**
    //     là où le mode en exige 44. C'est la faute de la v473, recommencée.
    //  ✅ La remontée sert au survol et au doigt ; la DESCENTE sert au clavier.
    //     Focaliser un bouton ouvre l'explication du marqueur qu'il contient,
    //     et le marqueur redevient un simple morceau de texte.
    //  ⚠️ Un seul marqueur par contrôle, le premier : deux bulles pour un même
    //     focus voudrait dire choisir, et un écran ne choisit pas à la place du
    //     joueur.
    // ═══════════════════════════════════════════════════════════════════════
    //  ⚠️ ET LE DOIGT A LE MÊME BESOIN QUE LE CLAVIER. La remontée exige de
    //     toucher le marqueur LUI-MÊME — 15 px de haut sur la carte de capsule.
    //     Toucher le bouton qui le contient doit suffire, sinon l'explication
    //     n'existe que pour une souris.
    if ((e.type === "focusin" || e.type === "touchstart") && e.target && e.target.querySelector) {
      return e.target.querySelector("[data-info]");
    }
    return null;
  }

  function brancher(partie) {
    partieCourante = partie || partieCourante;
    if (brancher.fait) return;
    brancher.fait = true;
    D.addEventListener("mouseover", function (e) { var el = cible(e); if (el && el !== ancre) ouvrir(el); });
    D.addEventListener("mouseout", function (e) { if (ancre && !cible(e)) fermer(); });
    // Le clavier ouvre et ferme comme la souris : une infobulle inaccessible
    // au clavier n'existe pas pour une partie des joueurs.
    D.addEventListener("focusin", function (e) { var el = cible(e); if (el) ouvrir(el); else fermer(); });
    D.addEventListener("focusout", fermer);
    D.addEventListener("keydown", function (e) { if (e.key === "Escape") fermer(); });
    // Tactile : un appui ouvre, un appui ailleurs ferme. Il n'y a pas de survol
    // sur téléphone, et c'est là que le mode se joue le plus.
    D.addEventListener("touchstart", function (e) {
      var el = cible(e);
      if (el) ouvrir(el); else fermer();
    }, { passive: true });
    W.addEventListener("scroll", fermer, { passive: true });
    W.addEventListener("resize", fermer);

    // ═════════════════════════════════════════════════════════════════════════
    //  🔴 UNE BULLE SURVIVAIT À SON ANCRE. Six déclencheurs de fermeture, et
    //     aucun ne couvrait le cas le plus fréquent du mode : l'ancre DISPARAÎT.
    //     Le sac de combat, le menu des coups, la carte des actes se redessinent
    //     entièrement à chaque clic — le bouton survolé est détruit, et le
    //     navigateur ne garantit PAS de `mouseout` sur un nœud retiré. Vu à
    //     l'écran : on survole une Poké Ball, on la lance, et l'infobulle reste
    //     posée par-dessus le combat, à décrire un bouton qui n'existe plus.
    //  ⚠️ On observe le DOCUMENT, pas un minuteur. Un `setInterval` qui vérifie
    //     l'ancre marcherait aussi — et laisserait la bulle orpheline visible
    //     jusqu'au prochain tic, c'est-à-dire pendant l'animation qu'on regarde.
    //  ⚠️ Et on ne branche l'observateur QUE quand une bulle est ouverte serait
    //     une optimisation prématurée : l'observateur ne fait rien tant que
    //     `ancre` est nul, et un branchement conditionnel ferait un état de plus
    //     à tenir juste.
    // ═════════════════════════════════════════════════════════════════════════
    if (W.MutationObserver) {
      new W.MutationObserver(function () {
        if (ancre && !D.body.contains(ancre)) fermer();
      }).observe(D.body, { childList: true, subtree: true });
    }
  }

  W.PokeInfobulles = { brancher: brancher, fermer: fermer, raison: raison, BATISSEURS: BATISSEURS };
})(window, document);
