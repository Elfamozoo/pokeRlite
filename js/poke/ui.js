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
  //  L'INTERFACE — LA COQUILLE ET LES ÉCRANS
  //
  //  🔴 Aucune règle de jeu ici. Tout ce qui décide est dans le moteur ; ce
  //     fichier montre, écoute et raconte. C'est ce qui permet au serveur de
  //     rejouer une partie sans charger une ligne d'interface.
  //  🔴 Chaque écran DIT ce qu'il sait. Un bouton grisé sans raison affichée,
  //     un verrou muet, un état connu du moteur et absent de l'écran : c'est la
  //     classe de défaut la plus fréquente du projet, et elle se traite ici.
  // ═══════════════════════════════════════════════════════════════════════════

  var M = function () { return W.PokeMoteur; };
  var P = function () { return W.PokePartie; };
  var C = function () { return W.PokeCombat; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 LA PORTE DES SERMENTS, ET IL N'Y EN A QU'UNE. Tout ce que l'écran
  //     multiplie — expérience, argent, cartes de butin, places dans l'équipe —
  //     passe par ici. Elle rend TOUJOURS un objet complet : sans partie, sans
  //     serment pris, ou avant que `serments.js` soit chargé, on obtient les
  //     valeurs neutres. Un lecteur n'a donc jamais à se demander si la clé
  //     existe — c'est ce qui évite les vingt `if` qui finissent par diverger.
  // ═══════════════════════════════════════════════════════════════════════════
  var SERM = function () {
    var S = W.PokeSerments;
    if (!S) return { degatsInfliges: 1, degatsSubis: 1, critBonus: 0, capture: 1,
                     argent: 1, expGain: 1, butinChoix: 0, equipeMax: 6,
                     soinInterdit: false, centreInterdit: false,
                     fuiteInterdite: false, bossNiveau: 0 };
    // 🔴 LE SCEAU S'AJOUTAIT ICI, ET C'ÉTAIT UNE DEUXIÈME COMPOSITION. Il est
    //    descendu dans `PokeSerments.effet` : tout appelant qui lisait le
    //    composé directement — le butin, le harnais de mesure — voyait les
    //    serments et PAS les sceaux, dans le sens qui avantage le joueur.
    //    Une seule composition, une seule porte, personne à ne rien oublier.
    return S.effet(partie);
  };
  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  var ATT = function () { return W.PokeRegles ? W.PokeRegles.attaques() : W.POKE_ATTAQUE_PAR_CLE; };
  var ATTL = function () { return W.PokeRegles ? W.PokeRegles.attaquesListe() : W.POKE_ATTAQUES; };
  var LANG = function () { return W.POKE_LANG || "fr"; };


  function mesure(ev, ctx) {
    try {
      W.fetch((W.POKE_API || "/api") + "/metric", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ev: ev, ctx: ctx || "", sport: "poke" }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) { /* hors ligne : rien */ }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'INVITATION DISCORD DU SOIR (20/08) — une carte sur l'accueil, 18 h → minuit,
  //  une fois par soir, du 20 au 27/08. Même contrat et même clé de stockage que
  //  le pop-up de `game.js` (`palmares_annonce_<id>`), donc un joueur qui a
  //  refusé trois fois sur le ninja n'est pas relancé ici non plus : c'est le
  //  même site et la même personne.
  // ═══════════════════════════════════════════════════════════════════════════
  var ANNONCE_DISCORD = {
    id: "discord2008", du: "2026-08-20", au: "2026-08-27",
    deHeure: 18, aHeure: 24, refusMax: 3,
    lien: "https://discord.gg/b7tyfeC22q",
  };
  function annonceDiscordCle() { return "palmares_annonce_" + ANNONCE_DISCORD.id; }
  function annonceDiscordEtat() {
    try { return JSON.parse(W.localStorage.getItem(annonceDiscordCle()) || "null") || { refus: 0, vu: "" }; }
    catch (e) { return { refus: 0, vu: "" }; }
  }
  function annonceDiscordGarder(o) {
    var st = annonceDiscordEtat();
    for (var k in o) st[k] = o[k];
    try { W.localStorage.setItem(annonceDiscordCle(), JSON.stringify(st)); } catch (e) {}
  }
  function annonceDiscordJour() {
    var d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function annonceDiscordDue() {
    var A = ANNONCE_DISCORD, auj = annonceDiscordJour(), h = new Date().getHours();
    if (auj < A.du || auj > A.au) return false;
    if (h < A.deHeure || h >= A.aHeure) return false;
    var st = annonceDiscordEtat();
    return st.vu !== auj && (st.refus || 0) < A.refusMax;
  }
  // Montrée = vue : on le note tout de suite, et on le compte.
  function annonceDiscordVue() {
    annonceDiscordGarder({ vu: annonceDiscordJour() });
    mesure("annonce_vue", ANNONCE_DISCORD.id);
  }

  var TXT = {
    titre: { fr: "POKÉDEX", en: "POKÉDEX" },
    accueil: { fr: "Le Professeur Chen t'attend au laboratoire.", en: "Professor Oak is waiting at the lab." },
    // ── L'ACCUEIL D'UN JOUEUR QUI REVIENT ──────────────────────────────────
    // 🔴 « Un nouveau chemin » faisait crier `poke-genre` : sa liste d'adjectifs
    //    ne peut pas savoir que « nouveau » porte ici sur « chemin » et non sur
    //    le joueur. Sa prudence vaut mieux qu'une exception, et la phrase est
    //    plus courte sans.
    accueilRetour: { fr: "Ta collection t'attend. Le chemin ne sera pas le même.",
                     en: "Your collection is waiting. The path will not be the same." },
    cPokedex: { fr: "Pokédex", en: "Pokédex" },
    cVoyages: { fr: "Voyages", en: "Runs" },
    cBadges: { fr: "Record", en: "Best" },
    cDeparts: { fr: "Départs ouverts", en: "Starters" },
    cChroma: { fr: "Chromatiques", en: "Shinies" },
    // Le palier de difficulté franchi. Le mot « Sceau » suffit : les huit noms
    // commencent tous par lui, et le relevé n'a la place que d'un titre.
    cSceau: { fr: "Sceau", en: "Seal" },
    // ── LE RANG ────────────────────────────────────────────────────────────
    //  🔴 CINQ PALIERS, ET AUCUN NE DONNE UN AVANTAGE. Un rang est un titre :
    //     rien ne pèse là où l'on se compare. Ce qu'il apporte, c'est un fil
    //     entre les voyages — le Pokédex est un but de plusieurs mois, les
    //     déblocages de départ s'épuisent, et entre les deux il n'y avait rien.
    //  🔴 CHAQUE NOM S'ACCORDE. Ce sont les titres qu'on porte : les afficher au
    //     masculin à une joueuse serait la faute que tout `PokeGenre` existe
    //     pour empêcher.
    cRang: { fr: "Rang", en: "Rank" },
    rangDebutant: { fr: "Débutant{e}", en: "Rookie" },
    rangDresseur: { fr: "{Joueur} de Kanto", en: "Kanto {joueur}" },
    rangConfirme: { fr: "{Joueur} confirmé{e}", en: "Seasoned {joueur}" },
    rangLigue: { fr: "Champion{ne} de la Ligue", en: "League Champion" },
    rangMaitre: { fr: "Maître de Kanto", en: "Master of Kanto" },
    // Ce qui manque pour le palier suivant. 🔴 Un rang qui s'affiche sans dire
    // comment monter est une décoration.
    versDresseur: { fr: "Gagne un badge pour monter.", en: "Win one badge to rise." },
    versConfirme: { fr: "Termine un voyage avec les huit badges.", en: "Finish a run with all eight badges." },
    versLigue: { fr: "Bats la Ligue Indigo.", en: "Beat the Indigo League." },
    versMaitre: { fr: "Bats le Maître en duel.", en: "Beat the Champion in a duel." },
    rangSommet: { fr: "Plus haut rang atteint.", en: "Highest rank reached." },
    rangMonte: { fr: "TU MONTES DE RANG", en: "YOU RANK UP" },
    // Ce qu'est le jeu, en trois lignes, pour qui arrive.
    promesseActes: { fr: "Neuf actes, huit Champions, la Ligue au bout.",
                     en: "Nine acts, eight Leaders, the League at the end." },
    promesseChemin: { fr: "À chaque rangée, un chemin se prend et l'autre se ferme.",
                      en: "At each row, one path is taken and the other closes." },
    promesseDex: { fr: "Ce que tu attrapes reste, et s'ouvre au départ du voyage suivant.",
                   en: "What you catch stays, and opens as a starter next run." },
    // 🔴 L'écran d'accueil répétait « POKÉDEX » sous l'en-tête qui le dit déjà.
    //    Un titre qui redit son bandeau ne hiérarchise rien.
    titreAccueil: { fr: "Bourg Palette", en: "Pallet Town" },
    sousAccueil: {
      fr: "Huit Champions, la Ligue Indigo, et {n} Pokémon à trouver.",
      en: "Eight Gym Leaders, the Indigo League, and {n} Pokémon to find.",
    },
    // 🔴 CETTE PHRASE PROMET KANTO, ET ELLE MENT DÈS QU'IL Y A DEUX MONDES :
    //    Johto en compte 251 et n'a pas la Ligue Indigo. L'accueil vient AVANT
    //    le choix du monde — il ne peut donc plus nommer les chiffres de l'un
    //    des deux. Il dit ce qui est vrai des deux, et le choix dit le reste.
    sousAccueilDeuxMondes: {
      fr: "Trois régions, vingt-quatre Champions, et tout un Pokédex à remplir.",
      en: "Three regions, twenty-four Gym Leaders, and a whole Pokédex to fill.",
    },
    // Exemples d'accord, par les deux voies prévues.
    //  · par JETON quand la phrase s'y prête — une seule ligne à maintenir ;
    //  · par `frF` complet quand la tournure change vraiment.
    pret: { fr: "Tu es prêt{e} à partir.", en: "You are ready to go." },
    premierPas: {
      fr: "Te voilà dresseur. Le premier pas est fait.",
      frF: "Te voilà dresseuse. Le premier pas est fait.",
      en: "You are a trainer now. The first step is taken.",
    },
    seul: { fr: "Tu pars seul{e}, avec un Pokémon et un Pokédex.", en: "You leave alone, with one Pokémon and a Pokédex." },
    commencer: { fr: "COMMENCER", en: "START" },
    // ═══════════════════════════════════════════════════════════════════════
    //  DEUX MONDES — L'ÉCRAN QUI LES SÉPARE
    //
    //  🔴 IL N'EXISTE QUE S'IL Y A DEUX MONDES. Une porte qui s'ouvre sur un
    //     seul choix n'est pas un choix, c'est une étape en plus : en
    //     production, où seule la première génération est chargée, `COMMENCER`
    //     mène au laboratoire comme il l'a toujours fait, et cet écran n'est
    //     jamais dessiné.
    //  ⚠️ Le Pokédex du COMPTE est commun aux deux. Le dire ici, une fois,
    //     évite la question qu'on se pose devant deux mondes séparés.
    // ═══════════════════════════════════════════════════════════════════════
    mondeChoixSur: { fr: "TROIS MONDES", en: "THREE WORLDS" },
    mondeChoixSur2: { fr: "DEUX MONDES", en: "TWO WORLDS" },
    mondeChoixSur3: { fr: "TROIS MONDES", en: "THREE WORLDS" },
    mondeChoixT: { fr: "Où pars-tu ?", en: "Where are you going?" },
    mondeKanto: { fr: "KANTO", en: "KANTO" },
    mondeKantoDit: { fr: "Rouge ou Bleue, huit Champions, la Ligue Indigo. 151 Pokémon.",
                     en: "Red or Blue, eight Leaders, the Indigo League. 151 Pokémon." },
    mondeJohto: { fr: "JOHTO", en: "JOHTO" },
    mondeJohtoDit: { fr: "Cristal, huit Champions, le Conseil 4, puis Red au Mont Argenté. 251 Pokémon.",
                     en: "Crystal, eight Leaders, the Elite Four, then Red on Mount Silver. 251 Pokémon." },
    mondeHoenn: { fr: "Hoenn", en: "Hoenn" },
    mondeHoennDit: { fr: "La région des terres et des mers",
                     en: "The land of land and seas" },
    mondeCommun: { fr: "Ton Pokédex est le même dans les trois.",
                   en: "Your Pokédex is the same in all three." },
    // [17/08, question de Darkjuampi] Ce que le compte transporte, dit avant de
    // partir — et rien de plus que ce qu'il fait. Voir `gardeDuCompte`.
    compteT: { fr: "Sur cet appareil seulement", en: "This device only" },
    compteB: { fr: "Sans compte, ton Pokédex reste dans ce navigateur. Avec un compte, tu le retrouves sur ton téléphone et sur ton PC. Ton défi du jour te suit aussi. Le voyage en cours reste là où tu l'as commencé.",
               en: "Without an account, your Pokédex stays in this browser. With one, you find it again on your phone and on your PC. Your daily challenge follows you too. The run in progress stays where you started it." },
    compteOui: { fr: "CRÉER MON COMPTE", en: "CREATE MY ACCOUNT" },
    compteNon: { fr: "PLUS TARD", en: "LATER" },
    //  ⚠️ LE PLURIEL PASSE PAR `{n|…|…}`, PAS PAR DEUX CLÉS. Le mode a déjà cette
    //     syntaxe (voir `soinsQui`), et `poke-genre.mjs` refuse un pluriel écrit
    //     en dur : le compteur passe par 1 au premier jour, et « 1 joueurs ont »
    //     serait la toute première phrase que lit ce joueur-là.
    //  ⚠️ ET L'ICÔNE N'EST PAS DANS LE TEXTE. `poke-design.mjs` refuse un emoji
    //     dans le chrome, à juste titre : il ne se traduit pas, il ne se
    //     recolore pas, et il double la charge de la ligne à lire. Elle est
    //     posée par l'écran, comme `game.js` le fait pour les quatre autres.
    monde: { fr: "{n} {n|dresseur a|dresseurs ont} déjà rejoint l'aventure",
             en: "{n} {n|trainer has|trainers have} already joined the adventure" },
    reprendre: { fr: "REPRENDRE LE VOYAGE", en: "RESUME JOURNEY" },
    reprendreOu: { fr: "Acte {a} sur 9 · {n} {n|badge|badges}",
                   en: "Act {a} of 9 · {n} {n|badge|badges}" },
    reprendreNeuf: { fr: "Un nouveau voyage remplacera celui-ci.",
                     en: "A new journey will replace this one." },
    // [20/08, Angel] Le voyage ne suit pas le compte ; le Pokédex, si.
    voyageIci: {
      fr: "Ce voyage reste sur cet appareil. Ton Pokédex, lui, suit ton compte partout.",
      en: "This journey stays on this device. Your Pokédex follows your account everywhere.",
    },
    classement: { fr: "CLASSEMENT", en: "LADDER" },
    carnet: { fr: "CARNET DE CHASSE", en: "HUNT LOG" },
    //  Les nouveautés du mode. 🔴 CE MODE N'AVAIT AUCUNE PAGE DE NOTES : le
    //  « Quoi de neuf » du site vit dans `js/game.js`, que `pokemon.html` ne
    //  charge pas. Une semaine de correctifs demandés par les joueurs, et aucun
    //  endroit où le leur dire — le signalement partait dans le vide.
    neuf: { fr: "NOUVEAUTÉS", en: "WHAT'S NEW" },
    cercle: { fr: "MON CERCLE", en: "MY CIRCLE" },
    usineTitre: { fr: "Zone de Combat", en: "Battle Frontier" },
    usineHall: { fr: "Usine de Combat", en: "Battle Factory" },
    usinePrets: { fr: "Sélectionnez 3 Pokémon de prêt", en: "Select 3 Rental Pokémon" },
    usineEchange: { fr: "Échange de Pokémon", en: "Swap Pokémon" },
    usineBoutique: { fr: "Boutique PCo", en: "Battle Shop" },
    usinePco: { fr: "PCo", en: "BP" },
    coffreTitre: { fr: "Coffre", en: "Chest" },
    coffreDit: {
      fr: "Réserve d'objets acquis à la Zone de Combat. Chaque objet dispose de 5 charges et peut être emporté au départ d'une aventure.",
      en: "Reserve of items acquired at the Battle Factory. Each item has 5 charges and can be taken at the start of a run.",
    },
    coffreVide: {
      fr: "Ton coffre est vide. Explore la Zone de Combat pour remporter des PCo et acheter des objets à la boutique !",
      en: "Your chest is empty. Explore the Battle Factory to earn BP and buy items at the shop!",
    },
    coffreCharges: {
      fr: "⚡ {n} {n|utilisation restante|utilisations restantes}",
      en: "⚡ {n} {n|use remaining|uses remaining}",
    },
    // 💬 L'invitation Discord du soir (20→27/08) — voir `ANNONCE_DISCORD`.
    annonceTitre: { fr: "Un bug ? Une idée ? Viens le dire.", en: "A bug? An idea? Come and say it." },
    annonceDit: {
      fr: "Le Discord du jeu a deux salons pour ça : report-bug et suggestions. Chaque message est lu, et beaucoup partent en correctif le jour même. Et c'est là que les dresseurs se retrouvent.",
      en: "The game's Discord has two channels for it: report-bug and suggestions. Every message gets read, and many ship as a fix the same day. And that is where trainers meet.",
    },
    annonceOui: { fr: "REJOINDRE LE DISCORD ↗", en: "JOIN THE DISCORD ↗" },
    annonceNon: { fr: "PAS CE SOIR", en: "NOT TONIGHT" },
    neufTitre: { fr: "Ce qui a changé", en: "What changed" },
    neufVide: { fr: "Rien de neuf pour l'instant.", en: "Nothing new for now." },
    neufDate: { fr: "Le {v}", en: "On {v}" },
    //  Le PC de COMPTE — demandé par Poltron_sofa le 16/08.
    //  ⚠️ PRÉFIXE `pcCompte`, ET CE N'EST PAS DU ZÈLE : `pcTitre`, `pcDit` et
    //     `pcFait` sont DÉJÀ pris par le PC de partie (« Qui prend sa place ? »),
    //     six cents lignes plus haut. Les redéclarer aurait fait gagner la
    //     dernière EN SILENCE, et l'écran d'échange de partie se serait mis à
    //     dire « Mon PC ». Attrapé par `poke-cles-doublees.mjs` avant la prod.
    pcCompteOuvrir: { fr: "MON PC", en: "MY PC" },
    pcCompteTitre: { fr: "Mon PC", en: "My PC" },
    pcCompteDit: { fr: "Tout ce que tu as élevé, tous voyages confondus. Choisis six.",
                   en: "Everything you have raised, across all runs. Pick six." },
    pcCompteVide: { fr: "Ton PC est vide. Décroche un badge et ton équipe s'y rangera.",
                    en: "Your PC is empty. Earn a badge and your team lands here." },
    pcCompteChoisis: { fr: "{n} sur 6", en: "{n} of 6" },
    pcCompteGarder: { fr: "EN FAIRE MON ÉQUIPE", en: "MAKE THIS MY TEAM" },
    pcCompteFait: { fr: "C'est ton équipe de duel.", en: "That is your duel team." },
    pcCompteRefus: { fr: "Choisis au moins un Pokémon.", en: "Pick at least one Pokémon." },
    pcCompteVoyage: { fr: "{n} {n|badge|badges}", en: "{n} {n|badge|badges}" },
    // La collection, depuis l'accueil. « MA COLLECTION » et non « POKÉDEX » :
    // le mot POKÉDEX est déjà le titre du mode dans le bandeau, et deux fois le
    // même mot sur un écran ne désigne plus rien.
    dexAccueil: { fr: "MA COLLECTION", en: "MY COLLECTION" },
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 [18/08] CETTE PAGE N'AVAIT AUCUNE PORTE DE COMPTE. Ni bouton, ni
    //    carte, rien : `gardeDuCompte` proposait d'en créer un DEUX FOIS au
    //    maximum, au départ d'un voyage, et après ça le mode n'en reparlait
    //    plus jamais. Un joueur qui avait déjà un compte — ou qui avait dit
    //    « plus tard » — n'avait plus un seul endroit où se connecter.
    //    Signalé par Lubin Leforestier : « il n'y a nulle part où l'on me
    //    propose de me connecter ». C'est la faute n°1 du dossier appliquée à
    //    ce que le mode a de plus précieux : le Pokédex de COMPTE, qui se
    //    remplit sur des dizaines de voyages et que 86 % des joueurs
    //    construisent sur un stockage de navigateur, sans filet.
    // ⚠️ Le libellé dit l'ÉTAT où l'on est : entrer quand on est dehors,
    //    consulter quand on est dedans. Un mot unique aurait raté l'un des deux.
    // ⚠️ Cette page ne sait pas créer de compte (elle ne charge pas `game.js`) :
    //    elle renvoie au site par `?go=compte`, la porte ouverte exprès de
    //    l'autre côté — la même que `gardeDuCompte` emprunte déjà.
    // ═══════════════════════════════════════════════════════════════════════
    connexion: { fr: "CONNEXION", en: "LOG IN" },
    monCompte: { fr: "MON COMPTE", en: "MY ACCOUNT" },
    // 🔴 LA SÉRIE SE DIT AVEC CE QU'ELLE RISQUE. « Série : 4 jours » est un
    //    compteur ; « quatre jours d'affilée, le défi du jour t'attend » dit ce
    //    qu'on perd en ne jouant pas. C'est la même donnée et pas le même
    //    effet.
    accueilSerieAttend: {
      fr: "{n} {n|jour|jours} d'affilée. Le défi du jour t'attend.",
      en: "{n} {n|day|days} in a row. Today's challenge is waiting.",
    },
    accueilSerieFaite: {
      fr: "{n} {n|jour|jours} d'affilée. Reviens demain pour la tenir.",
      en: "{n} {n|day|days} in a row. Come back tomorrow to keep it.",
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  LES MENTIONS — CE QUE LE MODE DOIT DIRE DE LUI-MÊME
    //
    //  🔴 IL NE LE DISAIT NULLE PART. Le mode emploie les noms, les sprites et
    //     les illustrations officielles de Nintendo, Creatures et GAME FREAK, et
    //     aucun écran ne l'écrivait — ni qu'il n'est pas officiel, ni à qui
    //     appartient ce qu'on regarde, ni où écrire pour en demander le retrait.
    //
    //     Ce n'est pas une licence, et ça n'en tient pas lieu : rien ici ne rend
    //     légal ce qui ne l'est pas. Mais des trois griefs qu'un ayant droit peut
    //     porter, il y en a un qui se referme d'une phrase — celui de la
    //     CONFUSION D'ORIGINE, « ce jeu se fait passer pour le nôtre ». Un jeu
    //     qui dit lui-même qu'il ne l'est pas ne se le fait plus reprocher, et
    //     c'est ce qu'affichent, sans exception, les fan games qui durent.
    //
    //  🔴 ET LA LIGNE QUI COMPTE LE PLUS EST LA TROISIÈME : le retrait sur
    //     demande. Une adresse lisible transforme une mise en demeure en courriel
    //     — et elle n'a de valeur que si on y répond vraiment.
    //
    //  ⚠️ ELLES VIVENT DANS LE MODE, PAS SUR `legal.html`. La page légale du site
    //     est INDEXÉE : y écrire qu'on héberge un fan game Pokémon, c'est le
    //     faire trouver. Ici, la page porte `noindex`, elle est hors sitemap, et
    //     ses scripts ne se téléchargent même pas sans la clé. On dit la chose
    //     là où on la voit en jouant, pas là où un moteur la récolte.
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LES MENTIONS NE SE TRADUISENT PAS : ELLES SONT EN ANGLAIS, TOUJOURS.
    //     Décision du propriétaire, 09/08, et elle est juste : *« les ayants
    //     droit ne parlent pas français »*. Cette phrase n'est pas écrite pour
    //     le joueur — lui joue, il se moque de savoir qui détient la marque.
    //     Elle est écrite pour la seule personne dont la lecture change quelque
    //     chose : le juriste qui vient voir. En français, elle ne fait rien.
    //  ⚠️ Les deux entrées portent donc le MÊME texte anglais, volontairement.
    //     Ce n'est pas une traduction oubliée : c'est la langue du destinataire,
    //     et le contrôle `poke-discretion` l'exige dans les deux fentes pour
    //     qu'un futur passage de traduction ne la remette pas en français.
    // ═══════════════════════════════════════════════════════════════════════
    mentionsFan: {
      fr: "Unofficial fan game. Not affiliated with Nintendo.",
      en: "Unofficial fan game. Not affiliated with Nintendo.",
    },
    mentionsMarques: {
      fr: "Pokémon is a trademark of Nintendo, Creatures Inc. and GAME FREAK inc. "
        + "Nothing is sold here.",
      en: "Pokémon is a trademark of Nintendo, Creatures Inc. and GAME FREAK inc. "
        + "Nothing is sold here.",
    },
    // 🔴 La phrase s'arrête avant l'adresse : celle-ci est un LIEN, et un lien
    //    posé au milieu d'un jeton de texte finirait échappé ou coupé en deux.
    mentionsRetrait: {
      fr: "Any rights holder may request removal, and it will be honoured:",
      en: "Any rights holder may request removal, and it will be honoured:",
    },
    mentionsMail: { fr: "roadtolegendsgame@gmail.com", en: "roadtolegendsgame@gmail.com" },
    // ── LE DUEL ────────────────────────────────────────────────────────────
    //  🔴 TOUT CE MODE TIENT DANS UN CODE QU'ON COLLE. Il n'y a pas de serveur
    //     de match : deux dresseurs s'échangent une ligne de texte, et chacun
    //     joue le duel chez lui. Les textes doivent donc porter la règle —
    //     sinon le joueur ne comprend ni ce qu'il copie, ni ce qu'il colle.
    duel: { fr: "DUEL", en: "DUEL" },
    duelSur: { fr: "KANTO — DUEL DE DRESSEURS", en: "KANTO — TRAINER DUEL" },
    duelTitre: { fr: "Le carnet de duel", en: "The duel notebook" },
    duelDit: {
      fr: "Donne ton code, colle le sien. Ni objet, ni badge : seules les équipes comptent.",
      en: "Share your code, paste theirs. No items, no badges: teams alone decide.",
    },
    // 🔴 AUDIT NOUVEAU JOUEUR : « se scelle toute seule » est du jargon, et
    //    rien ne disait le CONCEPT — un combat par échange de codes. On dit
    //    d'abord ce qu'est le duel, puis comment on y entre, sans le mot
    //    « sceller » : ce qui se fige se dit avec « devient ».
    duelSansEquipe: {
      fr: "Affronte l'équipe d'un autre joueur, code contre code. Gagne un badge : ton équipe du moment devient ton équipe de duel.",
      en: "Face another player's team, code for code. Win a badge: your current team becomes your duel team.",
    },
    duelMonEquipe: { fr: "TON ÉQUIPE SCELLÉE", en: "YOUR SEALED TEAM" },
    // 🔴 Les trois faits que le jeu connaissait et taisait sur cette liste :
    //    quand elle est prise, qu'elle se reprend, et dans quel ordre.
    duelScelleQuand: {
      fr: "Elle se refait à chaque badge gagné, dans l'ordre de ton équipe.",
      en: "It is re-sealed at every badge, in your team's order.",
    },
    duelMonCode: { fr: "TON CODE", en: "YOUR CODE" },
    duelBadges: { fr: "{n} {n|badge|badges}", en: "{n} {n|badge|badges}" },
    duelCopier: { fr: "COPIER", en: "COPY" },
    duelCopie: { fr: "Code copié. Envoie-le à qui tu veux.", en: "Code copied. Send it to anyone." },
    duelCopieRate: { fr: "Sélectionne le code et copie-le à la main.", en: "Select the code and copy it by hand." },
    duelAdverse: { fr: "LE CODE D'UN AUTRE DRESSEUR", en: "ANOTHER TRAINER'S CODE" },
    duelColler: { fr: "Colle son code ici", en: "Paste their code here" },
    duelLire: { fr: "LIRE LE CODE", en: "READ THE CODE" },
    duelCombattre: { fr: "COMBATTRE", en: "FIGHT" },
    duelAuto: { fr: "DUEL AUTOMATIQUE", en: "AUTO DUEL" },
    duelAutoDit: {
      fr: "Les deux équipes se battent seules. Le résultat est le même sur son écran.",
      en: "Both teams fight on their own. The result is the same on their screen.",
    },
    duelFace: { fr: "{nom} te défie.", en: "{nom} challenges you." },
    // ═══════════════════════════════════════════════════════════════════════
    //  LE FACE-À-FACE DES CARRIÈRES
    //
    //  🔴 LE MODE N'AVAIT AUCUNE FIN DE JEU QUI SE PARTAGE. Le classement est
    //     juste et vide — il attend une ouverture. Le duel, lui, marche déjà
    //     sans serveur. On lui accroche donc ce qui manquait : ce que valent
    //     DEUX CARRIÈRES l'une en face de l'autre, dans le même code, sans un
    //     geste de plus.
    //  🔴 AUCUNE COULEUR NE DÉSIGNE UN VAINQUEUR. La loi du mode dit qu'une
    //     couleur à l'écran nomme un type ou une créature ; celui qui mène est
    //     donc marqué par une FORME. C'est la correction que le verdict de
    //     match-up a déjà coûtée une fois.
    //  ⚠️ « TOI » N'EST PAS UN NOM. La colonne de gauche est toujours le
    //     joueur : il ne se lit pas de l'extérieur, il se reconnaît.
    // ═══════════════════════════════════════════════════════════════════════
    duelPalm: { fr: "LE FACE-À-FACE", en: "HEAD TO HEAD" },
    duelPalmDit: {
      fr: "Ce que vous avez fait chacun, hors de ce duel. Rien de tout ça ne pèse dans le combat.",
      en: "What each of you has done, outside this duel. None of it weighs in the fight.",
    },
    duelPalmMoi: { fr: "TOI", en: "YOU" },
    duelPalmMene: { fr: "en tête", en: "ahead" },
    duelPalmVoyages: { fr: "Voyages menés", en: "Journeys run" },
    duelPalmLigues: { fr: "Ligue remportée", en: "League won" },
    duelPalmBadges: { fr: "Badges, record", en: "Badges, best" },
    duelPalmScore: { fr: "Meilleur score", en: "Best score" },
    duelPalmPokedex: { fr: "Pokédex", en: "Pokédex" },
    duelPalmChroma: { fr: "Chromatiques", en: "Shinies" },
    duelPalmSceau: { fr: "Plus haut sceau", en: "Highest seal" },
    duelPalmChasses: { fr: "Chasses accomplies", en: "Hunts completed" },
    duelPalmRang: { fr: "Rang", en: "Rank" },
    duelPalmDiplome: { fr: "Diplôme du Professeur", en: "Professor's diploma" },
    duelPalmOui: { fr: "obtenu", en: "earned" },
    duelPalmNon: { fr: "—", en: "—" },
    duelPalmSceauNul: { fr: "aucun", en: "none" },
    // 🔴 CE QU'ON MONTRE À QUELQU'UN QUI N'A RIEN À MONTRER. Un code de duel
    //    émis par une version antérieure n'a pas de palmarès : on le dit, plutôt
    //    que d'afficher neuf zéros qui feraient passer le joueur pour un débutant.
    duelPalmAbsent: {
      fr: "Son code ne porte pas de carrière — il vient d'une version antérieure.",
      en: "Their code carries no career — it comes from an earlier version.",
    },
    // ── LES DÉFIS DE KANTO ─────────────────────────────────────────────────
    //  🔴 SANS EUX, LE PvP EST VIDE LE PREMIER JOUR : il faut un code d'ami pour
    //     jouer, et personne n'en a au début. Les Champions, le Conseil 4 et le
    //     Maître donnent une échelle qu'on gravit seul.
    duelDefis: { fr: "LES DÉFIS DE KANTO", en: "THE KANTO CHALLENGES" },
    // 🔴 Le compte de l'échelle, qui manquait. « Vaincus », pas « affrontés » :
    //    c'est vaincre qui fait monter le rang.
    // ⚠️ ET ZÉRO SE DIT AUTREMENT. « 0 sur 13 vaincu » est grammaticalement
    //    juste — en français, zéro prend le singulier — et laid à l'écran. Le
    //    pluriel automatique règle l'accord, jamais la TOURNURE : c'est la même
    //    correction qu'au Centre Pokémon (« 1 de tes 1 Pokémon est blessé ») et
    //    qu'à l'arène (« Aucun de tes 1 Pokémon »). Troisième fois ce mois-ci.
    duelDefisCompte: { fr: "{n} sur {t} {n|vaincu|vaincus}.", en: "{n} of {t} beaten." },
    duelDefisAucun: { fr: "Aucun vaincu pour l'instant.", en: "None beaten yet." },
    duelDefisDit: {
      fr: "Treize dresseurs t'attendent, du premier Champion au Maître.",
      en: "Thirteen trainers are waiting, from the first Leader to the Champion.",
    },
    duelDefier: { fr: "DÉFIER", en: "CHALLENGE" },
    // 🔴 SON NOM PORTE UN ARTICLE, et les autres non. Écrit « Le Maître », il
    //    donnait « Tu bats Le Maître. » — une majuscule au milieu d'une phrase,
    //    sur l'écran du plus rare des duels. On le garde en minuscule, forme de
    //    PHRASE, et l'écran met la majuscule là où il commence une phrase ou
    //    porte un titre. Voir `capital()`.
    duelMaitre: { fr: "le Maître", en: "the Champion" },
    duelRangArene: { fr: "Champion d'arène", en: "Gym Leader" },
    duelRangConseil: { fr: "Conseil 4", en: "Elite Four" },
    duelRangMaitre: { fr: "Maître de la Ligue", en: "League Champion" },
    duelNiveaux: { fr: "N.{a} à N.{b} · {n} {n|Pokémon|Pokémon}", en: "Lv.{a} to Lv.{b} · {n} {n|Pokémon|Pokémon}" },
    duelJamais: { fr: "jamais affronté", en: "never fought" },
    duelCarnet: { fr: "TON CARNET", en: "YOUR NOTEBOOK" },
    duelBilan: { fr: "{v} V — {d} D", en: "{v} W — {d} L" },
    duelRevanche: { fr: "REVANCHE", en: "REMATCH" },
    duelGagne: { fr: "Tu bats {nom}.", en: "You beat {nom}." },
    duelPerdu: { fr: "{nom} te bat.", en: "{nom} beats you." },
    duelTours: { fr: "{n} {n|tour|tours}.", en: "{n} {n|turn|turns}." },
    duelMoi: { fr: "Ce code est le tien.", en: "That code is your own." },
    // Les refus. 🔴 CHACUN DIT CE QU'IL FAUT FAIRE : « code invalide » renvoie
    //    le joueur à lui-même sans lui donner une seule prise.
    duelRVide: { fr: "Colle d'abord un code.", en: "Paste a code first." },
    duelRIllisible: { fr: "Ce texte n'est pas un code de duel.", en: "That text is not a duel code." },
    duelRPerime: { fr: "Ce code vient d'une version antérieure du jeu.", en: "That code comes from an older version." },
    duelREquipe: { fr: "Une équipe de duel tient six Pokémon au plus.", en: "A duel team holds six Pokémon at most." },
    duelREspece: { fr: "Ce code nomme un Pokémon qui n'existe pas.", en: "That code names a Pokémon that does not exist." },
    duelRNiveau: { fr: "Ce code porte un niveau hors bornes.", en: "That code carries a level out of bounds." },
    duelRAttaque: { fr: "Ce code porte une attaque inconnue.", en: "That code carries an unknown move." },
    duelRDv: { fr: "Ce code porte des valeurs impossibles.", en: "That code carries impossible values." },
    // 🔴 Trouvé par `poke-duel-test` à sa première exécution : ce motif existait
    //    dans le moteur et n'avait aucune phrase. Deux équipes qui ne peuvent
    //    pas se départager — que des attaques sans dégâts — bloquaient l'écran
    //    sur un refus fourre-tout.
    duelRSansFin: {
      fr: "Ces deux équipes ne peuvent pas se départager.",
      en: "These two teams cannot settle it.",
    },
    duelRAutre: { fr: "Ce code est refusé.", en: "That code is refused." },
    kanto: { fr: "KANTO — PREMIÈRE GÉNÉRATION", en: "KANTO — FIRST GENERATION" },
    // 🔴 VU À L'ÉCRAN, sur un voyage de Johto : « KANTO — PREMIÈRE GÉNÉRATION »
    //    coiffait l'écran où le joueur choisit son genre et tape son nom, juste
    //    après avoir pris Germignon des mains du Professeur Orme. Le bandeau du
    //    monde était une clé fixe. Un écran qui nomme le mauvais monde à la
    //    seconde où le joueur s'y installe, c'est la classe que ce dossier
    //    traque : *le jeu sait, et il ne dit pas.*
    johto: { fr: "JOHTO — SECONDE GÉNÉRATION", en: "JOHTO — SECOND GENERATION" },
    hoenn: { fr: "HOENN — TROISIÈME GÉNÉRATION", en: "HOENN — THIRD GENERATION" },
    // ── LE DÉFI DU JOUR ────────────────────────────────────────────────────
    //  🔴 IL ÉTAIT CÂBLÉ PARTOUT ET N'AVAIT PAS DE BOUTON. `partie.compare`
    //     verrouille le vivier de départ aux trois du canon, refuse le
    //     compagnon et scelle la version ; `POKE_GRAINE` fixe la carte pour
    //     tout le monde ; l'écran de classement PROMET « une graine par jour,
    //     un seul essai ». Rien ne posait le drapeau.
    defi: { fr: "DÉFI DU JOUR", en: "DAILY CHALLENGE" },
    defiSur: { fr: "KANTO — DÉFI DU JOUR", en: "KANTO — DAILY CHALLENGE" },
    defiTitre: { fr: "La même carte pour tout le monde", en: "The same map for everyone" },
    defiDit: {
      fr: "Une graine par jour. Mêmes rencontres, mêmes adversaires, un seul essai.",
      en: "One seed a day. Same encounters, same opponents, one attempt.",
    },
    // 🔴 ELLE NE NOMMAIT PAS LES TROIS NEUTRALISATIONS QUI COMPTENT. Un joueur
    //    qui a de la méta se demande exactement ceci : est-ce que j'emmène mon
    //    acquis, mes serments ouverts, mon sceau ? Le code les coupe bien tous
    //    les trois — mais la phrase parlait du compagnon et de la règle de
    //    voyage, c'est-à-dire des deux questions que personne ne se pose.
    //    Le jeu savait, et il ne disait pas ce qu'on voulait savoir.
    defiRegles: {
      fr: "Les trois départs du canon. Ni acquis emporté, ni serment débloqué, ni sceau : tout le monde part à égalité.",
      en: "The three canon starters. No carried perk, no unlocked oath, no seal: everyone starts equal.",
    },
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 « QUAND JE ME SUIS RECO ÇA ME FORCE À CRÉER UNE NOUVELLE SAVE » —
    //    @Z3no_, 18/08, après une Ligue. Le défi ne se garde PAS, exprès : on
    //    s'y compare, et reprendre permettrait de rejouer un combat perdu sur
    //    la même graine. La décision est juste ; elle n'était écrite nulle
    //    part. Le joueur ne l'apprenait qu'après — « Tu as déjà commencé ton
    //    essai du jour » — c'est-à-dire une fois son voyage perdu ET sa
    //    journée brûlée. Le voyage libre, lui, se reprend.
    // 🔑 Une règle qui coûte cher se dit AVANT le clic, jamais après.
    // ═══════════════════════════════════════════════════════════════════════
    defiSansReprise: {
      fr: "Il ne se reprend pas. Quitter en route, c'est finir l'essai du jour. Le voyage libre se garde, ce défi non.",
      en: "It cannot be resumed. Leaving partway ends today's attempt. Free journeys are saved, this challenge is not.",
    },
    defiPartir: { fr: "PARTIR", en: "GO" },
    defiFait: { fr: "Tu as déjà joué le défi du {date}.", en: "You already played the {date} challenge." },
    defiScore: { fr: "Ton score : {n}.", en: "Your score: {n}." },
    defiEnCours: { fr: "Tu as déjà commencé ton essai du jour. Pas de deuxième.", en: "You already started today's attempt. There is no second one." },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 « J'AI FERMÉ LE NAVIGATEUR PENDANT UN COMBAT ET JE SUIS REVENU » —
    //     Chris, 19/08. La règle ne distinguait pas ABANDONNER de PERDRE SA
    //     PAGE : un navigateur qui plante coûtait la journée. L'essai se garde
    //     maintenant, et il se reprend là où on l'a laissé.
    //  ⚠️ CE QUI SE REPREND SE DIT, ET CE QUI NE SE REPREND PAS AUSSI. Le
    //     combat engagé est perdu : l'annoncer sur le bouton évite qu'on le
    //     découvre à l'écran suivant, une équipe à terre dans les mains.
    // ═══════════════════════════════════════════════════════════════════════
    defiReprendre: { fr: "REPRENDRE L'ESSAI", en: "RESUME ATTEMPT" },
    defiReprendreOu: { fr: "Acte {a} sur 9 · {n} {n|badge|badges}",
                       en: "Act {a} of 9 · {n} {n|badge|badges}" },
    defiRepriseDit: {
      fr: "Ton essai t'attend là où tu l'as laissé. Le combat que tu avais engagé reste perdu.",
      en: "Your attempt is waiting where you left it. The battle you had engaged stays lost.",
    },
    defiCoupeTitre: { fr: "Le combat a tourné sans toi", en: "The battle went on without you" },
    defiCoupeDit: {
      fr: "Tu as quitté en plein combat : il compte comme perdu. Le reste de ton essai est intact.",
      en: "You left mid-battle: it counts as lost. The rest of your attempt is untouched.",
    },
    defiDemain: { fr: "Une carte neuve demain.", en: "A new map tomorrow." },
    defiVoirClassement: { fr: "LE CLASSEMENT", en: "THE LADDER" },
    // 🔴 LA SÉRIE EST LA SEULE CHOSE QUI TIENNE UN JOUEUR D'UN JOUR À L'AUTRE
    //    tant que le classement est vide. Elle ne demande aucun serveur, et
    //    elle compte les jours OÙ L'ON EST VENU — pas les jours gagnés.
    defiSerie: { fr: "SÉRIE", en: "STREAK" },
    defiJours: { fr: "{n} {n|jour|jours} d'affilée", en: "{n} {n|day|days} in a row" },
    defiRecord: { fr: "Record : {n} {n|jour|jours}.", en: "Best: {n} {n|day|days}." },
    defiPremier: { fr: "Ton premier défi. La série commence ici.", en: "Your first challenge. The streak starts here." },
    // 🔴 Ce qui change d'un jour à l'autre, et dont on parle.
    regleDuJour: { fr: "LA RÈGLE DU JOUR", en: "TODAY'S RULE" },
    accueilRegle: { fr: "Aujourd'hui : {nom}.", en: "Today: {nom}." },
    accueilDemain: { fr: "Demain : {nom}.", en: "Tomorrow: {nom}." },
    // ── LE CALENDRIER : trente jours gardés, aucun montré jusqu'ici ─────────
    defiMois: { fr: "TES TRENTE DERNIERS JOURS", en: "YOUR LAST THIRTY DAYS" },
    defiJoues: { fr: "{n} {n|jour joué|jours joués} sur 30.", en: "{n} {n|day|days} played out of 30." },
    // 🔴 DEUX JETONS POUR UN NOMBRE : `{pts}` AFFICHE, `{n}` ACCORDE. Le
    //    séparateur de milliers est un espace INSÉCABLE — `Number("2 225")`
    //    rend NaN, l'accord abandonne, et « {n|point|points} » s'affiche tel
    //    quel à l'écran. Le nombre formaté ne peut pas servir à accorder.
    defiMeilleur: { fr: "Meilleur jour : {pts} {n|point|points}, {b} {b|badge|badges}.", en: "Best day: {pts} {n|point|points}, {b} {b|badge|badges}." },
    defiCaseJouee: { fr: "{d} : {pts} {n|point|points}, {b} {b|badge|badges}.", en: "{d}: {pts} {n|point|points}, {b} {b|badge|badges}." },
    defiCaseOuverte: { fr: "{d} : commencé, jamais terminé.", en: "{d}: started, never finished." },
    defiCaseVide: { fr: "{d} : pas joué.", en: "{d}: not played." },
    // La règle de ce jour-là, sur chaque case : une frise sans ses règles est
    // un graphique, avec elles c'est un souvenir.
    defiCaseRegle: { fr: "Règle : {nom}.", en: "Rule: {nom}." },
    // ── Les montées de niveau, enfin montrées ──────────────────────────────
    // ── Le butin ────────────────────────────────────────────────────────────
    butinTitre: { fr: "BUTIN", en: "SPOILS" },
    butinBoss: { fr: "BUTIN DE CHAMPION", en: "GYM SPOILS" },
    //  🔴 LE COMPTE SE DIT ICI (17/08). C'est le titre qui pose le choix, donc
    //     c'est lui qui doit dire sur combien il porte — et il le lit de la
    //     liste réellement servie, jamais d'un nombre écrit d'avance.
    butinChoisis: { fr: "Prends-en un sur {n}.", en: "Take one of {n}." },
    butinChoisis1: { fr: "Prends-le.", en: "Take it." },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 « LES DEUX AUTRES SONT PERDUS » DEVANT SIX CARTES — Tadomikari, 17/08
    //     Le Serment de l'Abondance pose des cartes en plus : l'écran en sert
    //     jusqu'à six, et la phrase en annonçait deux depuis le premier jour.
    //     Elle peut aussi être fausse dans l'autre sens — le tirage rend
    //     parfois MOINS que trois quand une famille est épuisée.
    //  🔑 UNE PHRASE QUI CHIFFRE UNE LISTE DOIT LA COMPTER. Le nombre n'est
    //     pas décoratif ici : c'est lui qui dit le prix du choix.
    //  ⚠️ TROIS FORMES, PAS UN PLURIEL AUTOMATIQUE. `{n|…|…}` ne sait pas
    //     porter `{n}` dans une de ses branches (l'accord se résout AVANT la
    //     substitution) : « L'autre est perdu » et « Les 5 autres sont
    //     perdus » sont donc deux clés, et à zéro on ne dit rien du tout.
    // ═══════════════════════════════════════════════════════════════════════
    //  ✅ ET LE NOMBRE VA DANS LE TITRE, PAS DANS CETTE PHRASE. « Les {n}
    //     autres » est un pluriel écrit en dur — `poke-genre` le refuse, à
    //     raison : il dirait « Les 1 autres ». Le titre porte le compte
    //     (« Prends-en un sur 6. »), la phrase ne porte que l'accord.
    butinPerdu: { fr: "{n|L'autre est perdu.|Les autres sont perdus.}",
                  en: "{n|The other one is lost.|The others are lost.}" },
    butinRien: { fr: "NE RIEN PRENDRE", en: "TAKE NOTHING" },
    // 🔴 [22/08, demande de Rayhane] « Le nombre d'objets déjà présents dans
    //    le sac, pour savoir si ça vaut le coup ou non. » Le butin se choisit
    //    à trois cartes : prendre une quatrième Super Potion quand on en a
    //    déjà six, c'est perdre les deux autres pour rien.
    //  ⚠️ ELLE NE PARAÎT QUE SI LE SAC EN PORTE : « déjà 0 en sac » serait du
    //     bruit sur la moitié des cartes.
    butinDejaEnSac: { fr: "déjà {n} en sac", en: "{n} already in bag" },
    // ── Le serment du badge ──────────────────────────────────────────────────
    //  🔴 LE TEXTE DIT QU'ON NE PEUT PAS REVENIR. C'est la seule décision du
    //     voyage qui ne se défait pas, et un joueur qui l'apprend après coup
    //     se sent volé plutôt que engagé.
    sermentSur: { fr: "LE BADGE T'ENGAGE", en: "THE BADGE BINDS YOU" },
    sermentTitre: { fr: "Prête un serment.", en: "Swear an oath." },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 L'ÉCRAN SE VENDAIT COMME UNE TAXE, ET LA MESURE DIT L'INVERSE.
    //     « Chacun te coûte quelque chose » : le joueur lit un péage, et
    //     demande logiquement à le sauter (Tadomikari, 17/08). A/B à monde
    //     constant, 800 voyages par serment contre le témoin SANS serment
    //     (11,1 % de huit badges) : **quinze serments sur dix-sept font
    //     mieux** — solitude 25,2 %, plafond 21,0 %, troupe 19,5 %. Deux
    //     seulement tombent sous le témoin (endurance 8,8 %, meute 4,9 %).
    //  ✅ La phrase dit donc ce que la chose EST : un échange. Zéro effet de
    //     jeu — c'est le CADRE qui était faux, pas l'équilibre.
    //  ⚠️ « donne autant qu'il prend » et non « te rend plus fort » : deux
    //     serments sur dix-sept perdent, et une promesse fausse se paierait
    //     plus cher que le malentendu qu'elle corrige.
    // ═══════════════════════════════════════════════════════════════════════
    sermentDit: {
      fr: "Chacun donne autant qu'il prend. Tu le tiendras jusqu'au bout du voyage.",
      en: "Each one gives as much as it takes. You will hold it to the end.",
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 « SAVOIR CE QU'ELLES DONNENT AVANT DE CHOISIR LA RÉCOMPENSE »
    //     — Tadomikari, 17/08. Il a raison, et l'écran taisait le plus utile :
    //     le serment se prête JUSTE AVANT le butin du même badge, donc celui
    //     qu'on jure ici change la récompense de l'écran suivant. Deux
    //     serments posent des cartes en plus ; personne ne pouvait le savoir
    //     au moment de choisir.
    //  🔑 Encore « le jeu sait, et il ne dit pas » : l'ordre des écrans était
    //     écrit dans le code depuis toujours, jamais à l'écran.
    // ═══════════════════════════════════════════════════════════════════════
    sermentMaintenant: {
      fr: "Il compte tout de suite : la récompense de ce badge se tire après.",
      en: "It counts right away: this badge's reward is drawn afterwards.",
    },
    sermentRang: { fr: "SERMENT", en: "OATH" },
    sermentTenus: { fr: "Déjà jurés :", en: "Already sworn:" },
    // ── Les chasses ──────────────────────────────────────────────────────────
    //  🔴 LE TITRE NE DIT PAS « BRAVO ». Il dit ce qui vient de s'ouvrir : un
    //     joueur qui vient de perdre au troisième acte n'a pas besoin d'être
    //     félicité, il a besoin de savoir que son prochain voyage sera autre.
    chasseTitre: { fr: "CHASSE ACCOMPLIE", en: "HUNT COMPLETE" },
    chasseOuvre: { fr: "ouvre {le|quoi}", en: "unlocks the {quoi}" },
    carnetTitre: { fr: "LE CARNET DE CHASSE", en: "THE HUNT LOG" },
    // 🔴 « C'EST QUOI LES SERMENTS ? » — le propriétaire, dans le carnet. Le
    //    mot y paraissait AVANT que le joueur en ait vu un : le premier serment
    //    ne se prête qu'au premier badge. Un mot de système sans définition —
    //    la même classe que « acquis », déjà payée. La phrase dit désormais ce
    //    que c'est AVANT de dire ce que la chasse y ajoute.
    carnetDit: {
      fr: "À chaque badge, tu prêtes un serment : une règle qui te coûte. Chaque chasse accomplie en ajoute un au choix.",
      en: "At each badge you swear an oath: a rule that costs you. Each hunt completed adds one to the choice.",
    },
    carnetFaite: { fr: "ACCOMPLIE", en: "DONE" },
    carnetOuvre: { fr: "Ouvre :", en: "Unlocks:" },
    butinPris: { fr: "Tu emportes {quoi}.", en: "You take {quoi}." },
    bDitArgent: { fr: "De quoi acheter.", en: "Money to spend." },
    bDitCoup: { fr: "{p} de puissance", en: "{p} power" },
    bDitFixe: { fr: "Dégâts fixes, quel que soit l'adversaire", en: "Fixed damage, whoever you face" },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 SEIZE CAPSULES PORTAIENT LA MÊME PHRASE : « Une attaque de soutien ».
    //     Toxik, Cage-Éclair, Danse-Lames, Repos, Clonage, Métronome, Reflet…
    //     Seize objets à choisir, un seul mot pour les décrire — sur l'écran
    //     dont tout le sens est de comparer trois cartes. Le joueur choisissait
    //     entre trois « attaques de soutien ».
    //  ✅ On dit ce que le coup FAIT, et on le tire de la clé d'effet du
    //     MOTEUR : la phrase ne peut pas diverger de ce qui se joue.
    //  ⚠️ ON NE DÉCRIT QUE CE QUE LE MOTEUR TRAITE. `PokeCombat.EFFETS_TRAITES`
    //     est la liste de ce qui s'exécute vraiment ; un effet absent garde la
    //     phrase générique plutôt que de promettre ce qui n'arrivera pas.
    //     *Décrire un effet non implémenté, c'est écrire un mensonge d'écran
    //     avec application.*
    // ═══════════════════════════════════════════════════════════════════════
    bDitStatut: { fr: "Une attaque de soutien", en: "A support move" },
    eff_poison: { fr: "Empoisonne la cible", en: "Poisons the target" },
    eff_toxik: { fr: "Poison grave : l’usure s’aggrave à chaque tour", en: "Badly poisons: the damage grows every turn" },
    eff_paralyse: { fr: "Paralyse la cible", en: "Paralyzes the target" },
    eff_sommeil: { fr: "Endort la cible", en: "Puts the target to sleep" },
    eff_confusion: { fr: "Rend la cible confuse", en: "Confuses the target" },
    eff_atkUp: { fr: "Monte ton Attaque", en: "Raises your Attack" },
    eff_defUp: { fr: "Monte ta Défense", en: "Raises your Defense" },
    eff_vitUp: { fr: "Monte ta Vitesse", en: "Raises your Speed" },
    eff_speUp: { fr: "Monte ton Spécial", en: "Raises your Special" },
    eff_esquiveUp: { fr: "Monte ton esquive", en: "Raises your evasion" },
    eff_atkDown: { fr: "Baisse l'Attaque de la cible", en: "Lowers the target's Attack" },
    eff_defDown: { fr: "Baisse la Défense de la cible", en: "Lowers the target's Defense" },
    eff_vitDown: { fr: "Baisse la Vitesse de la cible", en: "Lowers the target's Speed" },
    eff_precDown: { fr: "Baisse la précision de la cible", en: "Lowers the target's accuracy" },
    eff_soin: { fr: "Rend la moitié de ses PV", en: "Restores half its HP" },
    // 🔴 « DIVISE PAR DEUX LES DÉGÂTS SUBIS » ÉTAIT DEUX FOIS TROP LARGE : le
    //    moteur double la Défense contre le PHYSIQUE seulement, et un coup
    //    critique l'ignore. C'est la carte d'achat d'une CT à quatre chiffres.
    eff_reflet: { fr: "Double ta Défense contre les coups physiques", en: "Doubles your Defense against physical moves" },
    eff_clone: { fr: "Pose un leurre qui encaisse à ta place", en: "Sets a decoy that takes hits for you" },
    // 🔴 DEUX COUPS S'APPELAIENT « RIPOSTE » SUR LA MÊME CARTE. Patience portait
    //    la phrase « Riposte après avoir encaissé » alors que Riposte est le nom
    //    français d'un AUTRE coup, CT18, vendu au même étal. On dit ce que
    //    Patience fait, et le mot reste au coup qui le porte.
    eff_riposte: { fr: "Encaisse deux tours, puis rend le double", en: "Takes hits for two turns, then deals double" },
    eff_copie: { fr: "Copie un coup de la cible", en: "Copies one of the target's moves" },
    eff_hasard: { fr: "Joue un coup au hasard", en: "Plays a random move" },
    eff_sortie: { fr: "Met fin au combat contre un sauvage", en: "Ends the battle against a wild Pokémon" },
    // 🔴 QUATRE COUPS QUE LA PUISSANCE DÉCRIT MAL — 11/08/2026.
    //    Les trois K.O. en un coup et Croc Fatal portent 1 de puissance : c'est
    //    un marqueur du ROM, pas une force, et la carte les disait « de
    //    soutien ». Dévorêve et Jackpot ont l'ennui inverse — leur puissance
    //    s'affiche et cache la CONDITION (l'un ne touche qu'un dormeur) ou le
    //    GAIN (l'autre rapporte). Dans les deux sens, le chiffre seul trompe.
    eff_ohko: { fr: "K.O. en un coup, s'il touche et si tu frappes en premier", en: "One-hit KO, if it lands and you strike first" },
    eff_crocFatal: { fr: "Enlève la moitié des PV de la cible", en: "Takes away half of the target's HP" },
    eff_reve: { fr: "{p} de puissance, mais seulement sur une cible endormie", en: "{p} power, but only against a sleeping target" },
    eff_jackpot: { fr: "{p} de puissance, et de l'argent en fin de combat", en: "{p} power, and money at the end of the battle" },
    // 🔴 LES CINQ FAMILLES QUI SE VENDAIENT SUR LEUR SEUL CHIFFRE. Chacune a un
    //    PRIX que la puissance ne dit pas — et c'est le prix qui décide de
    //    l'achat, pas le chiffre.
    eff_explose: { fr: "{p} de puissance, mais le lanceur tombe K.O.", en: "{p} power, but the user faints" },
    eff_recul: { fr: "{p} de puissance, et le lanceur encaisse le contrecoup", en: "{p} power, and the user takes recoil" },
    eff_charge: { fr: "{p} de puissance, mais il faut deux tours", en: "{p} power, but it takes two turns" },
    eff_recharge: { fr: "{p} de puissance, puis un tour à récupérer", en: "{p} power, then a turn to recharge" },
    eff_frenesie: { fr: "{p} de puissance, et elle monte à chaque coup encaissé", en: "{p} power, and it grows with every hit taken" },
    eff_contre: { fr: "Renvoie le double du dernier coup physique, si tu frappes après", en: "Returns double the last physical hit, if you strike second" },
    eff_repos: { fr: "Rend tous les PV, mais tu dors deux tours", en: "Restores all HP, but you sleep for two turns" },
    eff_deuxTours: { fr: "{p} de puissance en deux tours, à l'abri entre les deux", en: "{p} power over two turns, sheltered in between" },
    // 🔴 L'ACCORD. « 1 de ton équipe PEUVENT l'apprendre » était fautif, et
    //    c'est le genre de faute qu'on lit vingt fois par partie : c'est
    //    l'écran le plus vu du jeu.
    // ⚠️ « UN DE TON ÉQUIPE » N'EST PAS DU FRANÇAIS. Relevé en jouant, sur
    //    l'écran le plus vu du jeu. La tournure des clés voisines est « de tes
    //    Pokémon » (`hauteurPart`, `centreEtat`) — on dit pareil ici.
    bDitQui1: { fr: "un de tes Pokémon peut l'apprendre", en: "one of your Pokémon can learn it" },
    bDitQuiN: { fr: "{n} de tes Pokémon peuvent l'apprendre", en: "{n} of your Pokémon can learn it" },
    bDitQui0: { fr: "personne ne peut l'apprendre pour l'instant", en: "no one can learn it yet" },
    // La rareté se DIT, elle ne se devine pas à l'épaisseur d'un trait.
    rCommun: { fr: "COURANT", en: "COMMON" },
    rRare: { fr: "RARE", en: "RARE" },
    rLegendaire: { fr: "PRÉCIEUX", en: "PRECIOUS" },
    bDitVitamine: { fr: "{stat} en plus, pour toujours.", en: "{stat} up, permanently." },
    bDitBonbon: { fr: "Un niveau, tout de suite.", en: "One level, right now." },
    // ═════════════════════════════════════════════════════════════════════════
    //  🔴 « DE QUOI TENIR » MENTAIT SUR DEUX OBJETS SUR TROIS. Une seule
    //     légende couvrait Potion, Super Potion et Hyper Potion — qui rendent
    //     20, 50 et 200 PV. C'est exactement la faute des cannes, relevée dix
    //     lignes plus bas : « une légende commune aurait menti sur deux des
    //     trois ». Et à 300 ₽ contre 1 500 ₽, l'écart de prix ne se comprend
    //     que si l'écart de soin est écrit.
    //  🔴 LE NOMBRE SE LIT DANS `PokeCombat.OBJETS_SOIN`, jamais recopié ici.
    //     Cette table se déclare elle-même « la loi » ; une légende qui la
    //     recopierait deviendrait fausse le jour où elle bouge.
    // ═════════════════════════════════════════════════════════════════════════
    bDitSoin: { fr: "Rend {n} PV.", en: "Restores {n} HP." },
    bDitSoinMax: { fr: "Rend tous les PV.", en: "Restores all HP." },
    bDitBall: { fr: "De quoi capturer.", en: "Something to catch with." },
    bDitBallSuper: { fr: "Capture mieux qu'une Poké Ball.", en: "Catches better than a Poké Ball." },
    bDitBallHyper: { fr: "La meilleure Poké Ball qui s'achète.", en: "The best Poké Ball money can buy." },
    // Elle ne rate jamais, et il n'y en a qu'une pour cinq légendaires : c'est
    // la seule décision d'inventaire qui se prend pour tout le voyage.
    bDitBallMaster: { fr: "Ne rate jamais. Tu n'en auras qu'une.", en: "Never fails. You only get one." },
    bDitRappel: { fr: "Relève un Pokémon à terre, à moitié soigné.", en: "Revives a fainted Pokémon at half HP." },
    bDitRappelMax: { fr: "Relève un Pokémon à terre, tous PV rendus.", en: "Revives a fainted Pokémon at full HP." },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 CETTE PHRASE AFFIRMAIT SANS RIEN VÉRIFIER. « Quelqu'un de ton équipe
    //     l'attend » sortait pour TOUTE pierre, à TOUT moment — y compris
    //     devant une équipe d'un seul Carapuce, qui n'évolue par aucune pierre.
    //     Sur un rayon rare à 2 100 ₽, avec une bourse médiane mesurée à 222 ₽,
    //     c'était une promesse FAUSSE qui vend un objet inutile.
    //     Elle dit maintenant ce que la pierre FAIT ; qui l'attend — ou que
    //     personne ne l'attend — se calcule là où l'équipe est connue.
    //  ⚠️ `dits-objets.js` reste PUR : il ne connaît pas la partie, et c'est
    //     bien ainsi. La clause qui regarde l'équipe vit dans l'écran, comme
    //     celle des machines (« 3 de ton équipe peuvent l'apprendre »).
    // ═══════════════════════════════════════════════════════════════════════
    bDitPierre: { fr: "Fait évoluer sur-le-champ celui qui l'attend.",
                  en: "Evolves on the spot the one who awaits it." },
    bDitPierreQui: { fr: "{quoi} l'attend.", en: "{quoi} awaits it." },
    bDitPierrePersonne: { fr: "Personne chez toi ne l'attend.",
                          en: "Nobody on your team awaits it." },
    // 🔴 CHAQUE REMÈDE NOMME SON ÉTAT. Et le sommeil dit ce qu'il COÛTE de le
    //    subir — deux tours perdus décident d'un combat de Champion, alors
    //    qu'« endormi » tout seul se lit comme un détail.
    bDitAntidote: { fr: "Coupe le poison, qui ronge à chaque tour.", en: "Stops poison, which bites every turn." },
    bDitParalysie: { fr: "Lève la paralysie, qui divise ta vitesse par quatre.", en: "Clears paralysis, which quarters your speed." },
    bDitSommeil: { fr: "Réveille. Un Pokémon endormi perd jusqu'à sept tours.", en: "Wakes up. Sleep can cost seven turns." },
    bDitBrulure: { fr: "Éteint la brûlure, qui coupe l'Attaque de moitié.", en: "Puts out a burn, which halves Attack." },
    bDitGel: { fr: "Dégèle. Sans ça, seul un coup de feu le sortira de là.", en: "Thaws. Otherwise only a Fire move will." },
    bDitTousEtats: { fr: "Guérit n'importe quel état, d'un coup.", en: "Cures any status, in one go." },
    // 🔴 ELLE DIT LE PROBLÈME QU'ELLE RÉSOUT, pas sa mécanique. « Partage
    //    l'expérience » est exact et ne parle à personne ; « toute l'équipe
    //    monte, même ceux qui ne se battent pas » décrit la situation que le
    //    joueur vit déjà — trois Pokémon au niveau 5 derrière un seul à 40.
    bDitExpAll: {
      fr: "Toute l'équipe monte, même ceux qui ne se battent pas.",
      en: "The whole team levels, even those who never fight.",
    },
    // 🔴 LES OBJETS X DISENT LEUR EFFET ET SA DURÉE. Ils montent d'un cran une
    //    statistique POUR LE COMBAT EN COURS : sans « le temps du combat », on
    //    croit à un gain permanent et on les garde pour plus tard — c'est-à-
    //    dire pour jamais.
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 ILS VENDAIENT LEUR GAIN ET CACHAIENT LEUR PRIX. Le moteur écrit, au-
    //     dessus d'`OBJETS_STAT` : « ILS COÛTENT LE TOUR, comme un soin. C'est
    //     ce qui en fait une décision — sans ce prix, ce serait un bouton
    //     gratuit qu'on presse toujours. » Aucune des sept phrases ne le
    //     disait. Le joueur lisait un gain sans contrepartie, sur l'écran où
    //     il décide d'acheter.
    //  🔑 ET LE PRIX EST TOUT LE SUJET, MESURÉ LE 14/08 : un objet X posé sur
    //     un dresseur de route ne rend RIEN (337 employés, zéro point de
    //     courbe) ; gardé pour un Champion il rend +3,6 points de Ligue. Ce
    //     n'est pas l'objet qui décide, c'est le moment — et on ne peut pas
    //     choisir le moment si on ignore qu'il se paie.
    //  ⚠️ ON NOMME LE PRIX, ON NE CONSEILLE PAS. Pas de « garde-le pour le
    //     Champion » : le fait suffit, le joueur juge. C'est la doctrine de la
    //     chasse annoncée sur la carte.
    // ═══════════════════════════════════════════════════════════════════════
    bDitXAtt: { fr: "Un cran d'Attaque, le temps du combat. Coûte ton tour.", en: "One Attack stage, for this battle. Costs your turn." },
    bDitXDef: { fr: "Un cran de Défense, le temps du combat. Coûte ton tour.", en: "One Defense stage, for this battle. Costs your turn." },
    bDitXVit: { fr: "Un cran de Vitesse : frapper le premier change tout. Coûte ton tour.", en: "One Speed stage: striking first changes everything. Costs your turn." },
    bDitXSpe: { fr: "Un cran de Spécial, le temps du combat. Coûte ton tour.", en: "One Special stage, for this battle. Costs your turn." },
    bDitXPrecision: { fr: "Tes coups ne rateront plus. Coûte ton tour.", en: "Your moves stop missing. Costs your turn." },
    bDitDireHit: { fr: "Bien plus de coups critiques, le temps du combat. Coûte ton tour.", en: "Far more critical hits, for this battle. Costs your turn." },
    bDitGardeStats: { fr: "Il ne pourra plus baisser tes statistiques. Coûte ton tour.", en: "They can no longer lower your stats. Costs your turn." },
    bDitRepousse: { fr: "Plus de rencontres sauvages pendant un moment.", en: "No wild encounters for a while." },
    bDitCorde: { fr: "Sortir d'un donjon d'un coup.", en: "Leave a dungeon at once." },
    // 🔴 TROIS OBJETS QUE LE JEU DONNE ET NE DÉCRIT PAS. Chacun dit ce qu'il
    //    était dans le ROM et pourquoi il ne sert à rien ici : un objet qui
    //    explique son inutilité est un clin d'œil, un objet muet est un bug.
    bDitVelo: { fr: "Elle ouvrait la Route Cyclable. Ici, tout se fait à pied.",
                en: "It opened Cycling Road. Here, everything is done on foot." },
    bDitCarteMag: { fr: "Elle ouvrait les étages de la Sylphe. La tour n'en a qu'un.",
                    en: "It opened the Silph floors. This tower has only one." },
    bDitDentier: { fr: "Le gardien du Safari les cherche. Force te revient sans eux.",
                   en: "The Safari warden is looking for them. Strength comes without." },
    bDitPoupee: { fr: "Fuir un sauvage à coup sûr.", en: "Escape a wild Pokémon for sure." },
    bDitGuerison: { fr: "Tous les PV et tous les états, d'un coup.", en: "All HP and every status, in one go." },
    // 🔴 « Ouvre la pêche » ET le nombre d'espèces : c'est le nombre qui fait
    //    la différence entre les trois cannes, et donc le seul renseignement
    //    qui permette d'arbitrer contre trois potions.
    bDitCanne: {
      fr: "Ouvre la pêche pour tout le voyage. {n} {n|espèce|espèces} au bout.",
      en: "Opens fishing for the whole run. {n} {n|species|species} within reach.",
    },
    // 🔴 SANS CETTE SECONDE PHRASE, LA PREMIÈRE EST UN PIÈGE. La Vieille Canne
    //    ne donne qu'une espèce ; dit comme ça, on la laisse — et on perd les
    //    quatorze suivantes, puisqu'elle conditionne les cannes d'après.
    bDitCanneEchelle: {
      fr: "Ouvre la pêche. {n} {n|espèce|espèces} maintenant, et la canne suivante après elle.",
      en: "Opens fishing. {n} {n|species|species} now, and the next rod after it.",
    },
    nMontee: { fr: "Niveau supérieur", en: "Level up" },
    nEvolution: { fr: "Évolution", en: "Evolution" },
    montee: { fr: "{nom} passe au niveau {n} !", en: "{nom} grew to level {n}!" },
    //  🔴 PLUSIEURS NIVEAUX D'UN COUP = UNE PHRASE, PAS UNE LITANIE (12/08,
    //     demandé par Tatsu) : un Bonbon ou un gros gain d'expérience faisait
    //     défiler « passe au niveau 21 ! », « passe au niveau 22 ! »… écran
    //     par écran. On dit le saut en entier ; le détail est dans la fiche.
    monteeSaut: { fr: "{nom} passe du niveau {a} au niveau {b} !",
                  en: "{nom} grew from level {a} to level {b}!" },
    apprend: { fr: "{nom} apprend {attaque} !", en: "{nom} learned {attaque}!" },
    oublierTitre: { fr: "Oublier une attaque pour {attaque} ?", en: "Forget a move for {attaque}?" },
    oublierDit: { fr: "{nom} connaît déjà quatre attaques.", en: "{nom} already knows four moves." },
    oublierRefus: { fr: "{attaque} n'a pas été apprise.", en: "{attaque} was not learned." },
    garderSesAttaques: { fr: "NE RIEN OUBLIER", en: "FORGET NOTHING" },
    evolueTitre: { fr: "Que se passe-t-il ? {nom} change !", en: "What? {nom} is evolving!" },
    evolueDit: { fr: "Il va devenir {b}.", en: "It is about to become {b}." },
    laisserEvoluer: { fr: "LAISSER FAIRE", en: "LET IT HAPPEN" },
    arreterEvolution: { fr: "ARRÊTER", en: "STOP IT" },
    evolueFait: { fr: "{nom} devient {b} !", en: "{nom} evolved into {b}!" },
    evolueArrete: { fr: "{nom} reste comme il est.", en: "{nom} stopped evolving." },
    // ═══════════════════════════════════════════════════════════════════════
    //  DEUX CHEMINS, ET LE MODE N'A PAS D'HORLOGE   [22/08/2026]
    //
    //  🔴 Évoli monte en Mentali le JOUR et en Noctali la NUIT. Ce mode ne
    //     modélise pas le moment de la journée, et l'inventer pour un seul
    //     Pokémon serait pire que de ne rien dire. On rend donc les deux
    //     atteignables et on fait choisir — c'est déjà l'idiome du mode.
    //  ⚠️ ON NOMME LES DEUX FORMES : l'écran d'évolution nomme déjà la
    //     cible juste après, la taire ici ne protégerait rien.
    // ═══════════════════════════════════════════════════════════════════════
    evoDeuxTitre: { fr: "{nom} peut prendre deux chemins.", en: "{nom} can take two paths." },
    evoDeuxDit: { fr: "Le jour et la nuit n'en font pas le même. L'autre sera perdu.",
                  en: "Day and night do not make the same one. The other is lost." },
    evoVoieJour: { fr: "Le jour", en: "By day" },
    evoVoieNuit: { fr: "La nuit", en: "At night" },
    labo: { fr: "LABORATOIRE DU PROFESSEUR {prof}", en: "PROFESSOR {prof}'S LAB" },
    // Les deux rôles du face-à-face. Le rival n'a pas encore de nom — on le
    // demande à l'écran suivant — donc on nomme les rôles, jamais les personnes.
    faceMoi: { fr: "LE TIEN", en: "YOURS" },
    faceRival: { fr: "LE SIEN", en: "THEIRS" },
    // 🔴 Le mot qui retourne le sens de la pastille : sous une créature, elle
    //    dirait « son type ». Ici elle dit ce qu'elle PORTE.
    frappeEn: { fr: "frappe en", en: "hits with" },
    // ── Le vivier de départ ─────────────────────────────────────────────────
    // 🔴 CE JETON ÉTAIT UNE PASTILLE PORTÉE PAR 58 CARTES SUR 61, EN DORÉ.
    //    Deux fautes en une, et la seconde est la plus grave.
    //    · Une étiquette que 95 % des cartes portent ne distingue rien : elle
    //      décore. L'information utile est l'INVERSE — trois cartes sont celles
    //      de Chen, tout le reste s'est gagné.
    //    · Et la couleur employée était `--or`, rgb(221,160,34) : le doré du
    //      CHROMATIQUE, dont la loi du mode dit qu'il « nomme une RARETÉ, et
    //      c'est le seul doré du jeu ». Cinquante-huit emplois décoratifs
    //      éteignent le seul signe de rareté que le joueur ait à reconnaître.
    //    Ce que la pastille disait passe donc dans la STRUCTURE : deux sections
    //    titrées, et le compte dit une fois au lieu de cinquante-huit.
    // 🔴 On nomme le premier Champion À L'INSTANT DU CHOIX. La carte d'acte le
    //    dit déjà — trois pas trop tard pour que ça pèse sur le starter.
    departPremier: { fr: "Le premier badge est gardé par {nom}.",
                     en: "The first badge is held by {nom}." },
    //  🔴 « LES TROIS DE CHEN » — même famille que les trois textes rejetés le
    //     12/08 : une référence sans sujet. L'étiquette reprend la phrase du
    //     scénario affichée juste au-dessus (« Trois Poké Balls sont posées
    //     sur la table ») : le joueur relie les deux d'un coup d'œil.
    starterDeChen: { fr: "TROIS POKÉMON SUR LA TABLE", en: "THREE POKÉMON ON THE TABLE" },
    ouvertParToi: { fr: "OUVERTS PAR TES VOYAGES", en: "UNLOCKED BY YOUR JOURNEYS" },
    // 🔴 « {n} DÉPARTS OUVERTS SUR 75. CHAQUE PREMIÈRE FORME QUE TU CAPTURES EN
    //    OUVRE UN DE PLUS. » — refusée par le propriétaire le 08/08 : « cette
    //    phrase veut rien dire ». Elle a raison d'être refusée. « Départ » et
    //    « première forme » sont deux mots de NOTRE code, pas du jeu : un joueur
    //    n'a aucun moyen de savoir qu'une « première forme » est un Pokémon qui
    //    n'a pas encore évolué.
    //    ⚠️ ET C'EST LA RÈGLE D'ÉCRITURE QUI M'Y A MENÉ. « Quatorze mots, zéro
    //       métaphore » sert à ne pas sonner comme une machine — pas à écrire en
    //       télégraphe. Une phrase courte qu'on doit relire deux fois est plus
    //       longue qu'une phrase claire.
    departOuverts: {
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 « 5 POKÉMON SUR 75 » — ET LE JEU DIT 151 PARTOUT AILLEURS.
      //     Relevé par le propriétaire sur cet écran. La phrase donnait un
      //     dénominateur sans jamais dire CE QU'IL COMPTE : le joueur le lit
      //     contre le 151 du Pokédex et conclut que les deux se contredisent.
      //     Les deux sont vrais — 151 espèces, dont **79 premières formes**,
      //     moins les **4 légendaires de chasse** : 75 peuvent ouvrir un
      //     voyage. Mesuré, pas supposé.
      //  🔑 Ce fichier se reproche déjà cette classe en toutes lettres :
      //     « quatre dénominateurs, un seul mot ». Un compteur qui ne nomme
      //     pas ce qu'il compte fabrique une contradiction avec ses voisins.
      //  ⚠️ La règle se dit en DEUX phrases courtes plutôt qu'une longue : la
      //     forme accordée doit suivre son compteur immédiatement, et
      //     `ecriture-lint` refuse les phrases de plus de quatorze mots.
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 « 3 sur 75 » — deux verdicts du propriétaire dans la même soirée :
      //     « ça veut rien dire, on a 151 ! », puis sur ma correction « même
      //     moi je comprends pas cette phrase et pourtant je dev le jeu ».
      //     La 1ʳᵉ réécriture empilait QUATRE idées dans une phrase. La règle
      //     finale : UNE idée par phrase, la règle d'abord, les nombres
      //     ensemble, la promesse à la fin.
      //  🔴 TROISIÈME rejet (« tjr cette phrase de merde ») — et il avait
      //     raison depuis le début : le défaut n'était pas la FORMULATION,
      //     c'était la PLACE. Un règlement de 75 espèces devant trois Poké
      //     Balls, c'est du bruit. UNE promesse, ZÉRO nombre — le compte vit
      //     dans l'en-tête « OUVERT PAR TOI · n », la règle fine en infobulle
      //     du Pokédex, pas ici.
      fr: "Chaque Pokémon attrapé pourra rejoindre cette table à ton prochain voyage.",
      en: "Every Pokémon you catch can join this table on your next journey.",
    },
    //  🔴 « Les trois du Professeur Chen » — verdict du propriétaire : « ça
    //     veut rien dire ». Même classe que « 4 neuves » : une référence sans
    //     son sujet. On NOMME les trois, et la phrase devient une image.
    departCompare: {
      // ⚠️ COUPÉE EN DEUX (15 mots, plafond 14). La règle d'abord, les trois
      //    noms ensuite : c'est aussi l'ordre où on les lit.
      fr: "Au Défi du jour, tout le monde a le même choix. Bulbizarre, Salamèche ou Carapuce.",
      en: "In the Daily Challenge, everyone gets the same choice. Bulbasaur, Charmander or Squirtle.",
    },
    // Le nœud pris se marque, il ne se devine pas. 🔴 L'écran barrait la branche
    // perdue mais ne signalait presque pas celle qu'on avait prise : on voyait
    // ses pertes et pas ses acquis.
    pris: { fr: "pris", en: "taken" },
    // La bande de biome situe la rangée dans Kanto. Sans elle, neuf actes se
    // ressemblent tous — c'est ce qui rendait la carte « vide ».
    bHerbe: { fr: "Hautes herbes", en: "Tall grass" },
    bEau: { fr: "Bord de l'eau", en: "Waterside" },
    bRoute: { fr: "La route", en: "The road" },
    bVille: { fr: "En ville", en: "In town" },
    genre: { fr: "Qui es-tu ?", en: "Who are you?" },
    garcon: { fr: "DRESSEUR", en: "TRAINER (M)" },
    fille: { fr: "DRESSEUSE", en: "TRAINER (F)" },
    tonNom: { fr: "Ton nom", en: "Your name" },
    nomRequis: { fr: "Il te faut un nom pour partir.", en: "You need a name before you leave." },
    nomRival: { fr: "Le nom de ton rival", en: "Your rival's name" },
    // Le nom canon du rival de la première génération, posé quand le champ
    // reste vide. REGIS est celui de la traduction française d'époque.
    rivalDefaut: { fr: "REGIS", en: "BLUE" },
    regle: { fr: "Règle de voyage", en: "Journey rule" },
    // Le prix d'une règle fermée, dit sur sa porte. « Franchis la Ligue » se
    // vise ; une porte absente ne promettait rien.
    ouvreNuzlocke: { fr: "Franchis la Ligue pour l'ouvrir", en: "Beat the League to unlock" },
    ouvreExpress: { fr: "Décroche 4 badges pour l'ouvrir", en: "Earn 4 badges to unlock" },
    rVoyage: { fr: "VOYAGE", en: "JOURNEY" },
    rNuzlocke: { fr: "NUZLOCKE", en: "NUZLOCKE" },
    rExpress: { fr: "EXPRESS", en: "EXPRESS" },
    dVoyage: { fr: "Le voyage complet.", en: "The full journey." },
    dNuzlocke: { fr: "Un Pokémon K.O. est perdu pour toujours.", en: "A fainted Pokémon is gone for good." },
    //  ⚠️ « MOITIÉ MOINS DE JOURS » PARLAIT D'UN COMPTEUR SUPPRIMÉ. La carte à
    //     embranchements n'a plus de jours : elle a des RANGÉES, et c'est elles
    //     que la règle coupe désormais. Un texte qui survit à sa mécanique dit
    //     une règle que le jeu n'applique pas.
    dExpress: { fr: "Moitié moins de rangées par acte. Moins d'expérience, plus de score.",
                en: "Half the rows per act. Less experience, more score." },
    starter: { fr: "Choisis ton premier Pokémon.", en: "Choose your first Pokémon." },
    version: { fr: "Version", en: "Version" },
    // 🔴 LE JEU DOIT DIRE CE QUE LA VERSION FAIT. Il affichait « Version :
    //    Rouge » et se taisait — le propriétaire a demandé « je capte pas trop
    //    pourquoi il y a les versions », et il avait raison : un état que le
    //    moteur connaît et que l'écran n'explique pas, c'est la classe de
    //    défaut n°1 du projet.
    //  🔴 « Chaque voyage TIRE sa version » — verdict du propriétaire : « ça
    //     veut rien dire ». « Tirer » est le mot du moteur. Le joueur, lui,
    //     REÇOIT Rouge ou Bleue au hasard — on le dit avec ces mots-là.
    versionQuoi: {
      fr: "Rouge ou Bleue : chaque voyage reçoit l'une des deux au hasard, comme en 1996. Elle décide de qui tu croiseras.",
      en: "Red or Blue: each journey gets one of the two at random, as in 1996. It decides who you will meet.",
    },
    versionIci: { fr: "Ici tu trouveras", en: "Here you will find" },
    versionPas: { fr: "Tu ne trouveras pas", en: "You will not find" },
    versionPourquoi: {
      fr: "Il faudra donc plusieurs voyages pour tout attraper. Ton Pokédex reste acquis entre les parties.",
      en: "So it takes several journeys to catch everything. Your Pokédex stays with you between runs.",
    },
    suite: { fr: "SUITE", en: "NEXT" },
    carte: { fr: "KANTO", en: "KANTO" },
    acte: { fr: "ACTE {n} SUR {t}", en: "ACT {n} OF {t}" },
    versVille: { fr: "vers {v}", en: "toward {v}" },
    // Le Champion qui ferme l'acte, nommé dès l'entrée : c'est lui qui décide
    // où s'entraîner et quoi acheter.
    acteChampion: { fr: "Au bout : {nom}.", en: "At the end: {nom}." },
    // La chasse de l'acte, annoncée avec le Champion. Elle n'apparaît qu'aux
    // actes qui en portent une — 7, 8 et 9 — et elle nomme, elle ne juge pas.
    acteChasse: { fr: "Et {nom} t'attend. Un seul essai.",
                  en: "And {nom} is waiting. One attempt only." },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LES ACQUIS ÉTAIENT INVISIBLES DÈS QU'ON AVAIT CHOISI. Livrés en v393,
    //     ils ne paraissaient QUE sur la carte de butin, à l'instant du choix.
    //     Ensuite, plus rien : ni sur la carte, ni au sac, ni au bilan.
    //     Or un acquis est PERMANENT et se CUMULE — c'est tout son intérêt. Un
    //     joueur qui porte « La bourse tenue » et « Le flair » joue autrement,
    //     à condition de s'en souvenir. *On ne construit pas autour de ce qu'on
    //     ne voit pas*, et un système de build invisible n'est pas un système.
    //     C'est la classe de défaut n°1 du dossier, posée par moi, sur la
    //     mécanique que je venais d'écrire pour la corriger ailleurs.
    //  ⚠️ SUR LA CARTE D'ACTE, parce que c'est l'écran où l'on PLANIFIE. Le sac
    //     range des objets qu'on dépense ; un acquis ne se dépense pas.
    // ═══════════════════════════════════════════════════════════════════════
    acteAcquis: { fr: "Tu as appris :", en: "You have learned:" },
    // 🔴 Ce que le Champion remet en main propre. Le badge se compte ; la CT,
    //    elle, se joue — et c'est elle qu'on retient d'un Champion.
    champCT: { fr: "{nom} te remet la {ct}.", en: "{nom} hands you {ct}." },
    bossDonne: { fr: "Il donne la {ct}", en: "Hands over {ct}" },
    // ── LA MENACE QUI DÉCIDE VRAIMENT DES DEUX ARÈNES LES PLUS DURES ───────
    areneEtats: { fr: "Son équipe inflige : {quoi}.", en: "Its team inflicts: {quoi}." },
    areneCraint: { fr: "Son équipe craint :", en: "Its team is weak to:" },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 « SON ÉQUIPE CRAINT : INSECTE » EST VRAI ET MÈNE AU MUR.
    //
    //     Relevé le 09/08 dans la donnée du ROM — la meilleure attaque
    //     OFFENSIVE de chaque type, en première génération :
    //       · Dragon **1** (Draco-Rage) · Spectre **20** · Insecte **25**
    //       · puis Poison 65, Roche 75, Combat 85, et tous les autres de 100 à
    //         170.
    //     **Trois types n'ont pas d'arme.** C'est un fait célèbre de 1996, et le
    //     mode conseillait ces types comme des réponses : Morgane « craint
    //     l'Insecte, 4 sur 4 », et l'arme la plus forte du type plafonne à 25 de
    //     puissance. Un joueur qui suit ce conseil perd — non parce qu'il a mal
    //     lu, mais parce que le conseil ne pouvait pas être suivi.
    //
    //  ✅ On garde la vérité — la faiblesse EST réelle, et le Pokédex la donne —
    //     et on ajoute ce qui manquait : que le type n'a pas d'arme. Le joueur
    //     cesse de chercher un Insectre et va chercher des niveaux.
    //  ⚠️ LE SEUIL SE LIT DANS LA DONNÉE, il ne se choisit pas : la falaise est
    //     entre 25 (Insecte) et 65 (Poison). Cinquante tombe au milieu, et
    //     aucune valeur du jeu ne s'en approche assez pour que le choix compte.
    // ═══════════════════════════════════════════════════════════════════════
    areneSansArme: {
      fr: "Ce type n'a pas d'arme en Kanto. Ce mur se passe au niveau.",
      en: "That type has no weapon in Kanto. This wall is passed by levels.",
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE SIMULATEUR EN SAVAIT PLUS QUE LE JOUEUR, sur le seul vrai levier
    //     de build de la première génération.
    //     `poke-difficulte` a deux politiques de capsules : « naïve », qui
    //     enseigne au hasard, et « compétente », qui LIT l'annonce du Champion
    //     pour choisir. La compétente existe parce qu'elle gagne plus souvent.
    //     Or le jeu, lui, écrivait sur la carte « CT26 Séisme · 3 peuvent
    //     l'apprendre » — le type, jamais ; contre qui elle sert, jamais.
    //     Le joueur devait connaître par cœur l'équipe des huit Champions ET la
    //     table des types de 1996 pour prendre la décision que le harnais prend
    //     avec une ligne de code.
    //
    //  🔴 ET LE MODE CALCULAIT DÉJÀ LA RÉPONSE. `ditFaiblesses` produit « son
    //     équipe craint : SOL — 3 sur 4 » sur l'écran d'arène, depuis la v365.
    //     La donnée existait, la porte existait, et la carte de butin — le
    //     moment où l'on CHOISIT — n'y était pas branchée.
    //     *Ce n'est pas une aide : c'est l'information sans laquelle le choix
    //     n'en est pas un.*
    //
    //  ⚠️ ON DIT LE COMPTE, PAS LE CONSEIL. « 3 sur 4 » laisse juger ; « prends
    //     celle-là » déciderait à la place du joueur, et c'est tout l'inverse
    //     de ce qu'on construit.
    //  ⚠️ ET ON DIT AUSSI QUAND ELLE NE SERT À RIEN. Une capsule muette sur le
    //     Champion à venir est une information, pas un silence : elle peut
    //     rester le bon choix pour la suite du voyage.
    // ═══════════════════════════════════════════════════════════════════════
    // ═════════════════════════════════════════════════════════════════════
    //  🔴 « NE TOUCHE PERSONNE CHEZ KOGA » DISAIT LE CONTRAIRE DE LA VÉRITÉ.
    //     L'équipe de Koga est Poison pur : `efficacite("normal", ["poison"])`
    //     vaut 1, donc Plaquage la frappe ENTIÈREMENT, à pleine puissance.
    //     `ctContreLeBoss` compte les faiblesses ×2 — c'est juste — mais la
    //     phrase l'écrivait avec le verbe « toucher », qui veut dire infliger
    //     des dégâts. Sur la ligne qui départage trois capsules, le mot
    //     inversait la décision : on écartait la meilleure option du lot.
    //  🔴 ET « touche 2 d'Ondine sur 2 » N'EST PAS DU FRANÇAIS — le nom
    //     manquait. Les deux défauts tenaient dans la même phrase, et la même
    //     réécriture les règle : on nomme ce qu'on compte, des FAIBLESSES.
    // ═════════════════════════════════════════════════════════════════════
    //  ⚠️ Le Champion passe EN TÊTE, derrière deux points. Ma première
    //     réécriture disait « {n} des {sur} Pokémon d'Ondine… » — et
    //     `poke-genre` l'a refusée, à raison : « {n} des » est un pluriel écrit
    //     en dur. La forme accordée doit suivre le compteur immédiatement.
    bCtContre: { fr: "{champion} : {n} {n|Pokémon|Pokémon} sur {sur} y {n|est faible|sont faibles}",
                 en: "{champion}: {n} of {sur} are weak to it" },
    bCtRien: { fr: "{champion} : aucun Pokémon n'y est faible",
               en: "{champion}: none of the team is weak to it" },
    areneCraintSur: { fr: "{n} sur {t}", en: "{n} of {t}" },
    areneRemedes: { fr: "Tu portes {n} {n|remède|remèdes}.", en: "You carry {n} {n|cure|cures}." },
    areneSansRemede: { fr: "Tu n'as aucun remède.", en: "You carry no cure." },
    etat_sommeil: { fr: "sommeil", en: "sleep" },
    etat_poison: { fr: "poison", en: "poison" },
    etat_paralysie: { fr: "paralysie", en: "paralysis" },
    etat_confusion: { fr: "confusion", en: "confusion" },
    choisis: { fr: "Choisis ton chemin. L'autre sera perdu.", en: "Choose your path. The other is lost." },
    perdu: { fr: "perdu", en: "lost" },
    nHerbes: { fr: "Hautes herbes", en: "Tall grass" },
    nEau: { fr: "Au bord de l'eau", en: "By the water" },
    // 🔴 Le nœud de pêche n'avait pas de nom : il portait celui de la
    //    trouvaille, par le repli de `ICONE`. « À LA LIGNE » dit le geste ;
    //    la canne employée et les espèces atteintes sont dans l'annonce.
    nPeche: { fr: "À la ligne", en: "Fishing" },
    nArbre: { fr: "Secouer l'arbre", en: "Shake the tree" },
    nOeuf: { fr: "Un œuf", en: "An Egg" },
    oeufTitre: { fr: "L'œuf éclôt : {nom} !", en: "The Egg hatches: {nom}!" },
    oeufDit: { fr: "Personne ne savait ce qu'il y avait dedans. Maintenant, si.",
               en: "Nobody knew what was inside. Now everyone does." },
    aOeuf: { fr: "Un œuf, à couver. {quoi}… ou l'un des {n} qu'il peut porter.",
             en: "An Egg to hatch. {quoi}... or any of the {n} it may hold." },
    aOeufFait: { fr: "Cet œuf a déjà éclos.", en: "This Egg has already hatched." },
    aArbre: { fr: "Secouer l'arbre. {n} {n|chance|chances} qu'il en tombe quelque chose.",
              en: "Shake the tree. {n} {n|chance|chances} something drops." },
    aRocher: { fr: "Briser le rocher. {n} {n|chance|chances} qu'il y ait quelqu'un dessous.",
               en: "Smash the rock. {n} {n|chance|chances} someone is under it." },
    nDresseur: { fr: "Dresseur", en: "Trainer" },
    nObjet: { fr: "Trouvaille", en: "Found item" },
    nCentre: { fr: "Centre Pokémon", en: "Pokémon Center" },
    nBoutique: { fr: "Boutique", en: "Shop" },
    // 🔴 « ÇA SE PASSE ICI » ne disait RIEN. Un titre de nœud doit nommer ce
    //    qu'on va y faire : c'est la moitié de l'arbitrage.
    nScene: { fr: "Une halte", en: "A stop" },
    nFossile: { fr: "Deux fossiles", en: "Two fossils" },
    // 🔴 DEUX ÉCRANS S'APPELAIENT « LABORATOIRE » : celui du Professeur Chen,
    //    au premier geste du voyage, et celui qui ranime les fossiles, six
    //    actes plus tard. Le même mot pour deux lieux que rien ne relie — et
    //    c'est le second qui doit céder, puisque le premier porte un nom que
    //    tout le monde connaît. On nomme donc l'endroit par ce qu'on y fait.
    nRanimation: { fr: "Salle de ranimation", en: "Revival room" },
    nCasino: { fr: "Casino", en: "Game Corner" },
    nEchange: { fr: "Un échange", en: "A trade" },
    nCadeau: { fr: "Un cadeau", en: "A gift" },
    // ── LE DOJO — le second choix exclusif du jeu d'origine ────────────────
    nDojo: { fr: "Le Dojo", en: "The Dojo" },
    aDojo: { fr: "Deux combattants. Tu n'en prendras qu'un.", en: "Two fighters. You take only one." },
    // ⚠️ « Un seul te suivra » s'accordait au masculin sur une phrase qui parle
    //    au joueur : le détecteur de genre l'a refusée. On dit l'enjeu au lieu
    //    de compter — c'est plus court et ça n'accorde rien.
    aDojoDeux: { fr: "{a} ou {b}. L'autre reste ici.", en: "{a} or {b}. The other stays here." },
    aDojoFait: { fr: "Le maître a déjà tranché avec toi.", en: "The master has already settled it with you." },
    dojoChoix: { fr: "Le maître te laisse choisir. L'autre reste ici.", en: "The master lets you choose. The other stays." },
    dojoTitre: { fr: "{nom} te suit.", en: "{nom} follows you." },
    dojoLaisse: { fr: "Resté au Dojo", en: "Left at the Dojo" },
    // ── LE MUSÉE — la plus longue dette du voyage ──────────────────────────
    nMusee: { fr: "Le Musée", en: "The Museum" },
    aMusee: { fr: "Un morceau d'ambre, sous vitrine.", en: "A piece of amber, under glass." },
    aMuseeFait: { fr: "Tu as déjà pris l'ambre.", en: "You already took the amber." },
    museeTitre: { fr: "Le Vieil Ambre est à toi.", en: "The Old Amber is yours." },
    museeDit: { fr: "Personne ici ne sait le réveiller. Le laboratoire de Cramois'Île, si.",
      en: "No one here can wake it. The Cinnabar Island lab can." },
    museeQui: { fr: "Ce qui dort dedans", en: "What sleeps inside" },
    ranimeAmbre: { fr: "L'ambre a gardé bien plus longtemps.", en: "The amber kept it far longer." },
    // ── LA PENSION — du présent contre du futur ────────────────────────────
    nPension: { fr: "La Pension", en: "The Day Care" },
    aPension: { fr: "Laisse-en un. Il grandit pendant que tu avances.",
      en: "Leave one behind. It grows while you move on." },
    aPensionPleine: { fr: "Un des tiens y grandit déjà.", en: "One of yours is already growing there." },
    aPensionSeul: { fr: "Il t'en faut deux pour en laisser un.", en: "You need two before you can leave one." },
    // ⚠️ « prêt » s'accorde au joueur : la dresseuse lisait un masculin. On
    //    pose la question sans adjectif — c'est plus court, et c'est plus net.
    pensionTitre: { fr: "Lequel laisses-tu derrière toi ?", en: "Which one do you leave behind?" },
    // ⚠️ « Le Champion, tu le fais sans lui » ne voulait rien dire — relevé par
    //    le propriétaire. On dit l'ordre des choses : d'abord ce qu'il devient,
    //    ensuite ce que ça coûte, et avec un verbe qui existe.
    pensionDit: { fr: "Il te rejoint à l'acte suivant. D'ici là, tu affrontes le Champion sans lui.",
      en: "It rejoins you next act. Until then, you face the Leader without it." },
    pensionPrix: { fr: "L'éleveur prend {n} ₽ par niveau gagné.", en: "The breeder charges {n} ₽ per level gained." },
    pensionLaisse: { fr: "{nom} reste à la Pension.", en: "{nom} stays at the Day Care." },
    pensionRetour: { fr: "{nom} te rejoint.", en: "{nom} rejoins you." },
    pensionGagne: { fr: "{n} {n|niveau|niveaux} gagnés. L'éleveur prend {p} ₽.",
      en: "{n} {n|level|levels} gained. The breeder takes {p} ₽." },
    pensionRien: { fr: "Il n'a pas eu le temps de grandir.", en: "It had no time to grow." },
    pensionDette: { fr: "Tu n'avais que {p} ₽. L'éleveur ne s'en formalise pas.",
      en: "You only had {p} ₽. The breeder lets it go." },
    // ── LES JOURNAUX DU MANOIR ─────────────────────────────────────────────
    //  🔴 Écrits ICI, pas recopiés du jeu. Les faits sont ceux du canon — la
    //     découverte en forêt, le nom donné, la naissance, la fuite — et pas
    //     une phrase n'est reprise mot pour mot. C'est plus sûr, et c'est ce
    //     que je conseillerais à n'importe qui d'autre.
    nJournal: { fr: "Les journaux", en: "The journals" },
    // ── LE RONFLEX EN TRAVERS DE LA ROUTE ──────────────────────────────────
    //  🔴 Il dormait dans les données depuis le premier jour : `ronflex: true`
    //     sur deux routes, une phrase de scénario, un indice au Pokédex — et
    //     aucune façon de le rencontrer. Le barrage le plus connu de Kanto.
    nRonflex: { fr: "Un Ronflex", en: "A Snorlax" },
    aRonflex: { fr: "Il dort en travers. Un seul essai.", en: "It sleeps across the road. One attempt." },
    // Les six autres rencontres uniques (Johto) : ce qui est vrai pour toutes.
    aStatique: { fr: "Il ne se montre qu'ici. Un seul essai.", en: "It only appears here. One attempt." },
    aJournal: { fr: "Des carnets brûlés. Quelqu'un a noté ce qu'il a vu.",
      en: "Burnt notebooks. Someone wrote down what they saw." },
    aJournalLu: { fr: "Tu as déjà tout lu.", en: "You have read them all." },
    journalTitre: { fr: "Ce que le Manoir gardait", en: "What the Mansion kept" },
    journal1: { fr: "6 juillet. Un Pokémon inconnu, au fond de la forêt. Nous le suivons.",
      en: "6 July. An unknown Pokémon, deep in the forest. We follow it." },
    journal2: { fr: "10 février. Il a eu un petit. Nous l'appelons Mewtwo.",
      en: "10 February. It had a young. We call it Mewtwo." },
    journal3: { fr: "1er septembre. Nous avons forcé sa croissance. Il grandit trop.",
      en: "1 September. We forced its growth. It grows too fast." },
    journal4: { fr: "5 septembre. Il a tout détruit. Personne ne l'a arrêté.",
      en: "5 September. It destroyed everything. Nobody stopped it." },
    // ⚠️ « Deux noms de plus au Pokédex » était VRAI et se lisait FAUX : le
    //    compteur du bandeau compte les PRIS, et il ne bougeait pas. On nomme
    //    donc l'état exact — « vus » — au lieu d'une formule qui sonne bien.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 « JE N'AI JAMAIS CROISÉ MEW MALGRÉ TOUS LES BONS PROCESSUS, DONC DE
    //    SÉLECTIONNER LE CARNET BRÛLÉ » — Poltron_sofa, 18/08. Il a raison de
    //    l'avoir cru : les quatre pages du Manoir parlent de Mew, le nœud le
    //    fait passer en « vus », et « il reste à les trouver » promettait une
    //    chasse. Or le carnet ne mène à RIEN — Mewtwo s'ouvre après la Ligue,
    //    Mew sous le camion, une fois les 150 autres pris. Deux portes que ce
    //    nœud ne nommait ni l'une ni l'autre.
    //  🔑 Un indice qui promet sans désigner coûte plus qu'un silence : le
    //     joueur a brûlé des nœuds pour une piste qui n'existait pas.
    // ═══════════════════════════════════════════════════════════════════════
    journalDit: { fr: "Mew et Mewtwo passent en « vus » au Pokédex. Mewtwo attend après la Ligue ; Mew, sous un camion.",
      en: "Mew and Mewtwo now count as seen. Mewtwo waits past the League; Mew, under a truck." },
    // Les annonces de ces nœuds. 🔴 Chacune dit ce qu'on y trouve AVANT le
    //    choix : c'est la règle de la carte, et c'est ce qui en fait un
    //    arbitrage plutôt qu'un clic.
    aRanimation: { fr: "On ranime ton fossile.", en: "Your fossil is revived." },
    aRanimationSans: { fr: "Rien à ranimer — tu n'as pas de fossile.", en: "Nothing to revive — you have no fossil." },
    aCasino: { fr: "Des jetons contre de l'argent, des Pokémon contre des jetons.", en: "Coins for money, Pokémon for coins." },
    // 🔴 LE PRIX FAIT PARTIE DE L'ANNONCE. « Porygon » seul enverrait tout le
    //    monde ; « Porygon, 9 999 jetons » dit aussi que c'est un projet de
    //    voyage entier, pas un détour. Les deux ensemble décident.
    // ⚠️ Le pluriel passe par l'accord automatique, même si aucun lot du ROM ne
    //    coûte un seul jeton : une règle qu'on plie « parce que le cas ne peut
    //    pas arriver » ne protège plus rien le jour où il arrive.
    aCasinoLot: {
      fr: "{quoi} au bout, contre {n} {n|jeton|jetons}.",
      en: "{quoi} at the end, for {n} {n|coin|coins}.",
    },
    // 🔴 « 1 échange(s) possible(s) » S'AFFICHAIT SUR LA CARTE. Le pluriel entre
    //    parenthèses est l'aveu qu'on n'a pas voulu trancher : ça se voit, ça
    //    fait bâclé, et aucun jeu soigné n'en met. Maintenant qu'un accord en
    //    nombre existe, il n'y a plus d'excuse.
    aEchange: { fr: "{n} {n|échange possible|échanges possibles}",
                en: "{n} {n|trade|trades} available" },
    // 🔴 « X contre Y » : la prise D'ABORD, parce que c'est elle qui décide
    //    d'emprunter la branche, et le prix juste derrière, parce qu'il décide
    //    de pouvoir le faire. L'ordre inverse ferait lire un coût avant un gain.
    aEchangeUn: { fr: "{quoi} contre {contre}", en: "{quoi} for {contre}" },
    //  Le troc impayable se dit sur la carte, et le nœud se ferme (12/08).
    aEchangeRien: { fr: "tu n'as aucun de ceux qu'il demande", en: "you have none of what he asks" },
    aCadeau: { fr: "{quoi}, offert.", en: "{quoi}, as a gift." },
    // Les écrans eux-mêmes.
    // 🔴 L'ÉCRAN MONTRAIT L'ARTWORK, LE NOM, LES TYPES ET LE NIVEAU DE KABUTO :
    //    tout disait « tu l'obtiens ». Rien ne disait qu'il faut atteindre le
    //    laboratoire de Cramois'Île, six actes plus loin, sur une carte à
    //    embranchements où on peut le MANQUER. Le Musée, lui, le dit en toutes
    //    lettres (`museeDit`) — deux écrans, même fait, un seul honnête.
    fossileChoix: { fr: "Tu n'en emporteras qu'un. L'autre restera là.", en: "You take only one. The other stays behind." },
    fossilePasEncore: {
      fr: "Ce n'est encore qu'une pierre : seul le laboratoire de Cramois'Île sait la réveiller.",
      en: "It is still just a rock: only the Cinnabar Island lab can wake it.",
    },
    fossilePris: { fr: "Tu emportes {quoi}.", en: "You take the {quoi}." },
    ranimeFait: { fr: "{quoi} revient à la vie.", en: "{quoi} comes back to life." },
    ranimeDit: { fr: "Le savant a rendu ce que la roche gardait.", en: "The scientist gave back what the rock kept." },
    ranimeLaisse: { fr: "Laissé au Mont", en: "Left in the mountain" },
    jetons: { fr: "Jetons", en: "Coins" },
    acheterJetons: { fr: "ACHETER {n} JETONS", en: "BUY {n} COINS" },
    tropCher: { fr: "Il te manque {n} ₽.", en: "You are {n} ₽ short." },
    pasAssezJetons: { fr: "Il te manque {n} {n|jeton|jetons}.", en: "You are {n} {n|coin|coins} short." },
    // Une seule ligne d'aide, et elle porte l'ACTION : combien de paquets, pas
    // seulement combien de jetons. Le joueur ne peut acheter que par 50.
    casinoVise: {
      fr: "Le plus proche : {nom}. Il te manque {n} {n|jeton|jetons}, soit {p} {p|paquet|paquets} au comptoir.",
      en: "Closest prize: {nom}. You are {n} {n|coin|coins} short — {p} {p|pack|packs} at the counter."
    },
    // 🔴 LE RUBAN DÉBORDAIT DE SA CARTE EN 360 px — mesuré au banc mobile :
    //    177 px de texte dans une carte de 141. C'est un ruban posé sur
    //    l'arête d'une carte, donc il ne peut ni revenir à la ligne ni
    //    s'élargir : c'est le TEXTE qui doit tenir. « Seulement ici » dit la
    //    même règle en un tiers de moins.
    casinoUnique: { fr: "Seulement ici", en: "Only here" },
    // 🔴 LE COMPTOIR SE FERMAIT SANS UN MOT. La ligne ci-dessus compte les
    //    JETONS qui manquent — la porte du comptoir, elle, se ferme sur
    //    l'ARGENT, et cet écran n'affiche pas la bourse. Un bouton gris avec un
    //    prix à côté laisse croire à un prix trop élevé alors que la question
    //    est « combien me reste-t-il ? ». On le dit une fois, sous le bouton.
    casinoBourse: { fr: "Il te manque {n}.", en: "You are {n} short." },
    // ═════════════════════════════════════════════════════════════════════
    //  🔴 L'ÉCHANGE NE DISAIT PAS CE QU'IL VALAIT, ET LE JEU LE SAVAIT.
    //     Relevé le 09/08 en mesurant les neuf échanges du canon : **aucun ne
    //     donne un Insecte**, aucun ne répond donc au mur de Morgane, et la
    //     moitié sont des variantes de ce qu'on donne (Nidorino → Nidorina,
    //     Nidoran♂ → Nidoran♀). Leur valeur est presque entièrement au
    //     POKÉDEX — et c'est précisément ce que l'écran taisait, alors que la
    //     collection de compte est lue à deux pas de là.
    //  ⚠️ On ne dit que le NEUF. « Déjà pris » sur huit lignes ferait du bruit
    //     là où l'absence de marque le dit déjà, et le mode ne bavarde pas.
    // ═════════════════════════════════════════════════════════════════════
    echangeNeuf: { fr: "Nouveau au Pokédex", en: "New to the Pokédex" },
    echangeDonner: { fr: "Donner {a} contre {b}", en: "Trade {a} for {b}" },
    echangePasLeBon: { fr: "Il te faut un {a}.", en: "You need a {a}." },
    // 🔴 LE CHOIX QUI MANQUAIT. Le jeu cédait le PREMIER exemplaire de l'espèce
    //    sans le nommer, définitivement — deux Abra de niveaux différents et
    //    l'ordre de l'équipe tranchait à la place du joueur.
    trocLequel: { fr: "Lequel de tes {a} pars-tu ?", en: "Which of your {a} do you give?" },
    trocDefinitif: { fr: "Celui que tu cèdes ne revient pas.", en: "The one you give never comes back." },
    trocEnReserve: { fr: "en réserve", en: "in the box" },
    // 🔴 SIX ÉCRANS RANGEAIENT EN RÉSERVE SANS UN MOT (casino, Dojo,
    //    ranimation, ambre, cadeau, échange). On paie, l'artwork s'affiche
    //    façon « il te suit », et il est au PC.
    partEnReserve: { fr: "Ton équipe est pleine : il part en réserve.",
                     en: "Your team is full: it goes to the box." },
    echangeFait: { fr: "{b} arrive, et il s'appelle {surnom}.", en: "{b} arrives, and its name is {surnom}." },
    achete: { fr: "Acheté : {quoi}", en: "Bought: {quoi}" },
    rienAVendre: { fr: "L'étal est vide.", en: "The counter is empty." },
    pierreEmployer: { fr: "EMPLOYER {quoi}", en: "USE {quoi}" },
    pierreFait: { fr: "{a} évolue en {b} !", en: "{a} evolved into {b}!" },
    nLegendaire: { fr: "Une présence", en: "A presence" },
    nBoss: { fr: "Arène", en: "Gym" },
    nLigue: { fr: "Ligue Indigo", en: "Indigo League" },
    aRencontres: { fr: "{n} {n|rencontre|rencontres}", en: "{n} {n|encounter|encounters}" },
    aPokemon: { fr: "{n} Pokémon", en: "{n} Pokémon" },
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 « ENTRAÎNE VITESSE » N'AVAIT PAS DE SUJET, et le propriétaire l'a
    //    signalé en une phrase : « on comprend pas trop ». Il a raison —
    //    entraîne QUI ? Le Pokémon sauvage ? Mon équipe ? Le verbe portait bien
    //    la mécanique, mais un verbe sans sujet ne se relie à rien, et la carte
    //    est justement l'écran où l'on DÉCIDE.
    // 🔴 LA PHRASE DIT MAINTENANT QUI GAGNE ET À QUELLE CONDITION : c'est en
    //    combattant ici, et c'est celui qui combat. En première génération
    //    seuls les combattants montent — « ton équipe » aurait été faux.
    //  🔴 SIGNALEMENT DU PROPRIÉTAIRE (12/08) : « on gagne en XP, pas en PV,
    //     je comprends pas la phrase ». « Gagne en PV » se lisait comme un
    //     soin ou de l'expérience — deux choses que ce nœud ne donne pas.
    //     Le CENTRE nomme déjà cette mécanique : « Ton équipe a travaillé
    //     {stat} ». Deux écrans qui annoncent la même chose l'annoncent de la
    //     même façon — le nœud parle donc comme le Centre.
    aEntraine: { fr: "combattre ici travaille {stat}", en: "fighting here works on {stat}" },
    // 🔴 « IL GARDE 2 HYPER POTION » — accord manquant, relevé par un QA sur
    //    l'entrée de la LIGUE, le combat le plus important du mode. Le défaut
    //    ne se voit qu'à partir de deux : à l'arène d'Auguste, avec une seule
    //    potion, la phrase est juste. Aucun contrôle ne pouvait l'attraper —
    //    le pluriel porterait sur `{quoi}`, un nom d'OBJET inséré, et le jeton
    //    d'accord ne sait fléchir que ce qu'il connaît.
    //  ✅ On met l'objet en tête et le compte en pronom : « Hyper Potion : il
    //     en garde 2 » est juste pour tout nombre, sans jeton. Et la hiérarchie
    //     y gagne — ce qui décide, c'est QUEL soin, pas combien.
    arenePorte: {
      fr: "{quoi} : il en garde {n}. Il s'en sert quand il tombe au quart.",
      en: "{quoi}: they keep {n}. They use one at a quarter health.",
    },
    // Le juge du Bourg Palette, qui lit les valeurs cachées d'un Pokémon.
    //  🔴 SIGNALEMENT DU PROPRIÉTAIRE (12/08) : « "le juge" je comprends pas
    //     le nom du menu ». Un clin d'œil canon ne répond pas à « qu'est-ce
    //     que c'est ? » — la question n°1 du mandat. Le Pokédex du compte
    //     appelle déjà ces jauges le POTENTIEL : le bouton prend le mot que
    //     le joueur connaît. Le personnage du juge, lui, reste dans la
    //     phrase d'accueil de l'écran.
    jugeTitre: { fr: "POTENTIEL", en: "POTENTIAL" },
    jugeDit: {
      fr: "Ce que tu combats forge ton équipe. Voici ce que celui-ci a gagné.",
      en: "What you fight shapes your team. Here is what this one has gained.",
    },
    jugeInne: { fr: "INNÉ", en: "INNATE" },
    jugeAcquis: { fr: "ACQUIS", en: "GAINED" },
    // 🔴 Ses attaques ne s'affichaient nulle part hors combat.
    jugeCoups: { fr: "SES ATTAQUES", en: "ITS MOVES" },
    // ═══════════════════════════════════════════════════════════════════════
    //  CE QU'IL APPRENDRA ENSUITE  [20/08/2026]
    //
    //  🔴 « JE SUIS NIVEAU 11 AVEC HÉRICENDRE ET J'AI TOUJOURS PAS APPRIS
    //     D'ATTAQUE » — le propriétaire, en jouant. Le jeu faisait pourtant
    //     exactement ce qu'il devait : Héricendre apprend Écran de Fumée au
    //     niveau 6, et c'est un coup de STATUT ; son premier coup qui frappe,
    //     Flammèche, arrive au 12. Il était à un niveau du déblocage et il a
    //     cru à un défaut.
    //  🔑 LE MANQUE N'ÉTAIT PAS DANS LE JEU, IL ÉTAIT DANS CE QU'IL EN DIT.
    //     Mesuré sur les trois starters : premier coup de leur propre type au
    //     niveau 8 (Germignon), 12 (Héricendre), 13 (Kaiminus). Celui qui
    //     attend le plus n'a aucun moyen de savoir qu'il attend.
    //  ⚠️ AUCUN EFFET DE JEU : on lit la table d'apprentissage de l'espèce et
    //     on l'affiche. Pas un tirage, pas une borne, rien qui touche au rejeu.
    // ═══════════════════════════════════════════════════════════════════════
    jugeProchaine: { fr: "Apprend {a} au niveau {n}", en: "Learns {a} at level {n}" },
    // ═══════════════════════════════════════════════════════════════════════
    //  COMMENT IL ÉVOLUE — LE SECOND SILENCE   [20/08/2026]
    //
    //  🔴 TROIS JOUEURS, LA MÊME QUESTION, LE SOIR DE L'OUVERTURE. Poltron,
    //     relayant Angel et Rayhane : « la question est comment obtenir
    //     noctali ? Doit-on le jouer ? Il n'y a aucune indication ni aucun
    //     objet ; dans le jeu original c'était une question d'affinité. »
    //     Les deux évolutions SONT modélisées et jouables — Évoli monte en
    //     Mentali le jour et en Noctali la nuit, par bonheur. Le jeu ne le
    //     disait nulle part.
    //  🔑 C'EST LA MÊME CLASSE QU'HÉRICENDRE CE MATIN : *un manque
    //     d'information se lit comme un défaut*. Le joueur ne distingue pas
    //     « ça n'existe pas » de « on ne m'a rien dit ».
    //  ⚠️ ZÉRO EFFET DE JEU : on lit la table d'évolution de l'espèce et on
    //     l'affiche. Pas un tirage, pas une borne.
    // ═══════════════════════════════════════════════════════════════════════
    evoNiveau:  { fr: "Évolue au niveau {n}", en: "Evolves at level {n}" },
    evoPierre:  { fr: "Évolue avec {o}", en: "Evolves with {o}" },
    evoBonheur: { fr: "Évolue par le bonheur", en: "Evolves through friendship" },
    evoBonheurJour: { fr: "Évolue par le bonheur, le jour", en: "Evolves through friendship, by day" },
    evoBonheurNuit: { fr: "Évolue par le bonheur, la nuit", en: "Evolves through friendship, at night" },
    evoEchange: { fr: "Évolue par l'échange", en: "Evolves by trading" },
    evoStat:    { fr: "Évolue au niveau {n}, selon ses stats", en: "Evolves at level {n}, depending on its stats" },
    evoRien:    { fr: "N'évolue plus", en: "Does not evolve further" },
    evoVers:    { fr: "{quoi} en {nom}", en: "{quoi} into {nom}" },
    jugeRienDeNeuf: { fr: "N'apprendra plus rien en montant", en: "Nothing more to learn by levelling" },
    // [19/08, Syrean] L'ordre des attaques se choisit sur la fiche, comme dans
    // les jeux d'origine : une attaque, puis la place qu'elle prend.
    jugeCoupsDit: { fr: "Touche une attaque, puis la place où la mettre.", en: "Tap a move, then the slot to put it in." },
    jugeCoupLeve: { fr: "Touche la place où mettre {attaque}.", en: "Tap the slot for {attaque}." },
    jugeCoupFait: { fr: "{a} et {b} échangent leur place.", en: "{a} and {b} swap places." },
    jugeInneDit: {
      fr: "Ce qu'il avait en naissant. Rien ne le change.",
      en: "What it had at birth. Nothing changes it.",
    },
    jugeAcquisDit: {
      fr: "Ce que les combats lui ont appris. Il monte à chaque victoire.",
      en: "What battles taught it. It rises with every win.",
    },
    aSoin: { fr: "Ton équipe repart en pleine forme.", en: "Your team leaves at full health." },
    // ── Le Centre, et son arbitrage ──────────────────────────────────────────
    //  🔴 LES DEUX PORTES SE DISENT EN UNE PHRASE CHACUNE, et chacune nomme ce
    //     qu'elle COÛTE. « Soigne » sans « tu n'en tires rien pour la suite »
    //     ferait de l'entraînement un piège pour qui lit vite.
    aCentre: { fr: "Soigner l'équipe, ou l'entraîner.", en: "Heal the team, or train it." },
    // ── Le rayon rare ────────────────────────────────────────────────────────
    //  🔴 IL DIT SON PRIX EN UNE PHRASE. « Cher » ne veut rien dire pour qui a
    //     40 000 ₽ ; « une vitamine vaut tout l'étal » se comprend sans compter.
    aBoutiqueRare: { fr: "Au rayon rare : {quoi}.", en: "In the rare aisle: {quoi}." },
    //  🔴 ET LE COMPTOIR DES CT NE S'ANNONÇAIT PAS. Le rayon rare, lui, se
    //     nomme sur la carte depuis qu'on a compris que c'était la raison de
    //     garder son argent une rangée de plus — et le comptoir des machines,
    //     qui ouvre au même acte et que le code appelle « le seul achat qui
    //     donne de la puissance DURABLE », se découvrait en entrant. On ne
    //     décide pas d'une branche sur ce qu'on ignore.
    //  ⚠️ Les bornes de prix se CALCULENT sur l'étal, elles ne s'écrivent pas :
    //     une machine ajoutée ou retarifée ne doit pas laisser une phrase fausse.
    aBoutiqueMachines: { fr: "Comptoir des CT ouvert ({min} à {max} ₽).", en: "TM counter open ({min}–{max}₽)." },
    etalMachines: { fr: "LE COMPTOIR DES CT", en: "THE TM COUNTER" },
    // 🔴 L'avertissement va dans la fente des raisons, où l'œil cherche déjà
    //    « il te manque X ₽ ». Il n'INTERDIT pas : la machine se garde dans le
    //    sac pour un Pokémon qu'on attrapera plus tard.
    etalPersonne: { fr: "Personne chez toi ne l'apprend", en: "Nobody on your team can learn it" },
    // Elle dit la RÈGLE qui coûte cher : une machine s'emploie une seule fois.
    // Sans ça, un joueur en achète une pour « voir » et la perd.
    etalMachinesDit: {
      fr: "Une CT ne sert qu'une fois. Choisis bien qui l'apprend.",
      en: "A TM works only once. Choose carefully who learns it.",
    },
    etalRare: { fr: "LE RAYON RARE", en: "THE RARE AISLE" },
    etalRareDit: {
      fr: "Une vitamine vaut tout l'étal. Elle rend une statistique pour de bon.",
      en: "One vitamin costs more than the whole stall. It raises a stat for good.",
    },
    // ── Les sceaux ───────────────────────────────────────────────────────────
    //  🔴 « CUMULATIFS » SE DIT, parce que c'est la seule chose qu'on ne devine
    //     pas : au Sceau 4 on porte aussi les trois premiers. Sans ce mot, un
    //     joueur croit choisir une règle et en reçoit quatre.
    sceau: { fr: "SCEAU DE KANTO", en: "KANTO SEAL" },
    sceauAucun: {
      fr: "Aucun sceau. Le voyage se joue comme la première fois.",
      en: "No seal. The run plays as it did the first time.",
    },
    sceauCumul: {
      fr: "Les {n} {n|première règle|premières règles} s'appliquent ensemble.",
      en: "The first {n} {n|rule|rules} all apply.",
    },
    // Dans le bandeau : trois caractères, parce qu'il partage la ligne avec
    // l'acte et, au Défi du jour, avec sa propre marque.
    sceauCourt: { fr: "SCEAU {n}", en: "SEAL {n}" },
    centreTitre: { fr: "Soigner, ou s'entraîner.", en: "Heal, or train." },
    centreTitre3: { fr: "Soigner, s'entraîner, ou changer d'équipe.",
                    en: "Heal, train, or change your team." },
    centreDit3: {
      fr: "Tu ne peux faire qu'une seule chose ici. Les deux autres sont perdues.",
      en: "You can only do one thing here. The other two are lost.",
    },
    centreDit: {
      fr: "Tu ne peux faire qu'une seule chose ici. L'autre est perdue.",
      en: "You can only do one thing here. The other is lost.",
    },
    // ⚠️ « À SOIGNER », PLUS « BLESSÉ ». Le compte inclut désormais le statut et
    //    les PP vides — dire « blessé » d'un Pokémon à pleine vie dont les
    //    attaques sont épuisées serait faux dans l'autre sens.
    centreEtat: {
      fr: "{n} de tes {t} Pokémon {n|a besoin de soins|ont besoin de soins}.",
      en: "{n} of your {t} Pokémon {n|needs care|need care}.",
    },
    centreEntier: { fr: "Ton équipe n'a besoin de rien.", en: "Your team needs nothing." },
    // ⚠️ SANS ADJECTIF ACCORDÉ, ET C'EST VOULU. « Toute ton équipe est
    //    blessée » accorde avec « équipe », pas avec le joueur — mais
    //    `poke-genre` ne peut pas faire la différence, et il a raison de ne
    //    pas essayer : un contrôle qui devine sur quoi porte un accord finira
    //    par laisser passer un vrai défaut. On écrit donc une tournure qui
    //    n'accorde rien, et tout le monde s'y retrouve.
    //    ⚠️ Le mot qui déclenchait était « seul », et le contrôle a raison de
    //       s'en méfier — « tu es seul » parle bien du joueur. Une phrase qui
    //       vaut pour un Pokémon comme pour six évite le problème sans le
    //       contourner, et se lit mieux : elle dit l'ÉTAT, pas le compte.
    centreTous: {
      fr: "Personne n'est au complet.",
      en: "No one is at full strength.",
    },
    centreSoin: { fr: "SOIGNER", en: "HEAL" },
    centreSoinDit: {
      fr: "Toute l'équipe repart en pleine forme, attaques comprises.",
      en: "The whole team leaves at full health, moves included.",
    },
    // 🔴 LA RAISON D'UNE PORTE FERMÉE. Soigner une équipe qui n'a rien à
    //    soigner ne rend rien ET consomme le passage : c'est le seul geste du
    //    mode qui coûte tout et ne donne rien. On le ferme, et on dit pourquoi.
    centreSoinInutile: {
      fr: "Il n'y a rien à soigner.",
      en: "There is nothing to heal.",
    },
    // 🔴 LE REFUS QUI MANQUAIT. « Le pas de course » ferme les Centres — il le
    //    dit sur sa carte, et l'écran ne le disait nulle part.
    centreJure: {
      fr: "Tu as juré de ne plus t'y arrêter.",
      en: "You swore never to stop here again.",
    },
    centreEntrainer: { fr: "S'ENTRAÎNER", en: "TRAIN" },
    centreEntrainerDit: {
      fr: "Aucun soin. Toute l'équipe gagne une statistique pour le reste du voyage.",
      en: "No healing. The whole team gains a stat for the rest of the run.",
    },
    // ═════════════════════════════════════════════════════════════════════
    //  LE PC DE LÉO — et pourquoi il ÉCHANGE au lieu d'ajouter.
    //  🔴 Le compagnon AJOUTE un corps, et c'est mesuré comme perdant : 8
    //     badges 34,4 % → 28,8 %, Ligue 10,6 % → 7,5 %. Dans un mode dominé
    //     par son économie d'expérience, un membre de plus la dilue plus qu'une
    //     réponse de type ne rapporte. L'ÉCHANGE, lui, ne coûte rien — et il
    //     est le premier levier de type qui ait jamais déplacé la courbe :
    //     8 badges 34 % → 38 %, Ligue 10,5 % → 14 %, Morgane 33 % → 39 %.
    //  ⚠️ « à son niveau » se dit, parce que c'est la question que le joueur se
    //     pose : un Pokémon de la boîte ne débarque pas au niveau de la tête.
    // ═════════════════════════════════════════════════════════════════════
    // 🔴 LE PILIER AVAIT ÉTÉ LIVRÉ SANS SA DÉCISION. La carte tirait un acquis
    //    au hasard alors que le système est défini comme « choisi, on renonce à
    //    deux autres ». Ces mots-là sont ceux du renoncement, parce que c'est
    //    lui qui donne son poids au gain — les deux autres ne reviendront pas.
    // 🔴 « UN ACQUIS, AU CHOIX » — LE PROPRIÉTAIRE : « on comprend pas, c'est
    //    trop flou ». Il a raison, et le mode a sa propre règle contre ça :
    //    *les noms sont ceux du MONDE, pas des étiquettes de système.*
    //    « Acquis » nommait ma mécanique, pas ce que le joueur reçoit. Et
    //    l'écran de choix disait déjà « CE QUE TU APPRENDS » : la carte et
    //    l'écran se contredisaient à un clic d'écart.
    //    ⚠️ Pas « bonus » non plus : ça ne dit ni que c'est permanent, ni que
    //       c'est un choix. « Tu apprends » dit les deux, et c'est du français.
    bAcquisNom: { fr: "Tu apprends quelque chose", en: "You learn something" },
    //  ⚠️ « Un des trois » RETIRÉ : la carte annonce AVANT que l'offre soit
    //     tirée, elle ne peut pas savoir combien on présentera. Un nœud ne
    //     promet que ce qu'il peut tenir.
    bAcquisDit: { fr: "Un seul à choisir, gardé jusqu'au bout du voyage :",
                  en: "One to choose, kept to the end of the run:" },
    acquisSur: { fr: "CE QUE TU APPRENDS", en: "WHAT YOU LEARN" },
    acquisTitre: { fr: "Prends-en un sur {n}.", en: "Take one of {n}." },
    acquisTitre1: { fr: "Prends-le.", en: "Take it." },
    acquisDit: { fr: "{n|L'autre est perdu.|Les autres sont perdus.} Celui-ci te suit jusqu'au bout.",
                 en: "{n|The other one is lost.|The others are lost.} This one follows you to the end." },
    acquisDit0: { fr: "Celui-ci te suit jusqu'au bout.",
                  en: "This one follows you to the end." },
    // 🔴 « De 50 % à 75 % » se lit ; « ×0,5 → ×0,75 » demande de savoir lire un
    //    multiplicateur. Et on nomme la chose dans les mots du monde, jamais la
    //    clé technique : « l'argent », pas « argent ».
    // 🔴 LE VERBE NE DOIT PAS DÉPENDRE DU SUJET SUBSTITUÉ. Premier jet :
    //    « {quoi} passerait de… » — et « tes Balls passerait » est sorti à
    //    l'écran. Les noms insérés sont tantôt singuliers (« l'argent »),
    //    tantôt pluriels (« tes Balls ») : aucun accord fixe ne peut convenir.
    //    On coupe donc le verbe. *Un gabarit de phrase qui accorde avec un
    //    jeton se trompera le jour où le jeton change de nombre.*
    acquisCompose: { fr: "Avec ce que tu portes : {quoi}, de {a} % à {b} %.",
                     en: "With what you carry: {quoi}, from {a}% to {b}%." },
    // 🔴 LE VERDICT, PARCE QUE LE CHIFFRE NE SUFFIT PAS — voir `CLE_SENS`. Deux
    //    mots invariables : aucun sujet à accorder, et ils tranchent la seule
    //    question que le joueur se pose devant « de 120 % à 106 % ».
    acquisMieux: { fr: "C'est mieux.", en: "That's better." },
    acquisPire: { fr: "C'est pire.", en: "That's worse." },
    cArgent: { fr: "l'argent", en: "money" },
    cExp: { fr: "l'expérience", en: "experience" },
    cBalls: { fr: "tes Poké Balls", en: "your Poké Balls" },
    cCoups: { fr: "tes coups", en: "your hits" },
    cEncaisse: { fr: "ce que tu encaisses", en: "what you take" },
    // Le rang de la carte : « ACQUIS » redisait le nom du système. Ce qui compte
    // est que ça ne se perd plus — c'est ce qui la distingue d'un objet.
    acquisRang: { fr: "POUR TOUJOURS", en: "FOREVER" },
    // ═════════════════════════════════════════════════════════════════════
    //  LA CARTE DE CAPSULE, DEVENUE UN CHOIX
    //  🔴 Elle nommait « CT24 Tonnerre » — une machine tirée parmi cinquante.
    //     Mesuré : la réponse de type vaut 78 % de victoires contre 60 %, et
    //     elle n'existe que dans 8 % des équipes devant Ondine. Le mode
    //     affichait « son équipe craint : EAU » et ne donnait aucun moyen d'y
    //     répondre avant l'acte 4, quand le rayon des machines ouvre.
    //  ⚠️ Le titre ne nomme plus de machine : nommer une des trois options
    //     ferait croire que le choix est déjà fait.
    // ═════════════════════════════════════════════════════════════════════
    bCtNom: { fr: "Une capsule technique", en: "A technical machine" },
    bCtDit: { fr: "Une seule à choisir, pour armer quelqu'un de ton équipe :",
              en: "One to choose, to arm someone on your team:" },
    ctSur: { fr: "LA MACHINE", en: "THE MACHINE" },
    ctTitre: { fr: "Prends-en une sur {n}.", en: "Take one of {n}." },
    ctTitre1: { fr: "Prends-la.", en: "Take it." },
    ctDit: { fr: "{n|L'autre est perdue.|Les autres sont perdues.} Celle-ci ne sert qu'une fois.",
             en: "{n|The other one is lost.|The others are lost.} This one works only once." },
    ctDit0: { fr: "Celle-ci ne sert qu'une fois.",
              en: "This one works only once." },
    // ⚠️ « UNE SEULE FOIS » était aussi le marqueur des nœuds de la carte, pour
    //    une tout autre règle. Deux lois ne partagent pas trois mots.
    ctRang: { fr: "À USAGE UNIQUE", en: "SINGLE USE" },
    //  ⚠️ « à » N'EST PAS UN JETON D'ÉLISION, et pour une bonne raison : « à »
    //     ne s'élide jamais en français. J'avais écrit `{a|qui}` par réflexe —
    //     le jeton n'existe pas, `elider` ne connaît que `de|le|la|ce|que|…`,
    //     et la carte aurait affiché « Répond {a|qui} » en clair.
    ctRepond: { fr: "Répond à {qui}", en: "Answers {qui}" },
    ctPrise: { fr: "{quoi}. Au sac, choisis qui l'apprend.",
               en: "{quoi}. In the bag, pick who learns it." },
    acquisTenus: { fr: "Tu portes déjà :", en: "You already carry:" },
    acquisPris: { fr: "{nom}. Ça ne se perd plus.", en: "{nom}. That never goes away." },
    centreBoite: { fr: "LE PC DE LÉO", en: "BILL'S PC" },
    // ═════════════════════════════════════════════════════════════════════
    //  🔴 LE PC DE LÉO IMPOSAIT LE PLUS FAIBLE, ET C'EST DEVENU UN CHOIX.
    //     C'est le seul pont mesuré entre la collection de compte et le voyage
    //     — 8 badges 34 → 38 %, Ligue 10,5 → 14 % — mais il ne demandait rien :
    //     le jeu désignait le plus bas niveau hors starter, on ne choisissait
    //     que l'arrivant. Un système qui décide à ta place n'est pas une
    //     décision, c'est un cadeau.
    //  ⚠️ ET IL N'AJOUTE TOUJOURS AUCUNE PUISSANCE : l'arrivant prend le niveau
    //     de CELUI QU'IL REMPLACE. Sacrifier un membre solide pour une réponse
    //     de type est un vrai arbitrage, et il peut se payer cher — c'est
    //     exactement ce qu'on veut, et c'est ce que l'état mesuré du mode
    //     réclame : de la décision, pas du volume.
    //  ⚠️ Le starter reste hors d'atteinte : toute sa courbe de niveaux porte
    //     le voyage, et la mesure du 09/08 l'a tranché — l'échanger donne
    //     8 badges 34 → 4 %.
    // ═════════════════════════════════════════════════════════════════════
    centreBoiteDit: {
      //  ⚠️ DEUX DÉTECTEURS ONT REFUSÉ CETTE PHRASE, L'UN APRÈS L'AUTRE.
      //     `poke-genre` d'abord — « le nouveau arrive », un adjectif accordé
      //     au masculin sans variante féminine. Puis `poke-isolation` sur ma
      //     réécriture : **« remplaçant » est du vocabulaire FOOTBALL**, banni
      //     du mode depuis le pivot. On dit « celui qui prend sa place », ce
      //     qui a l'avantage d'être exactement le titre de l'écran suivant.
      fr: "Une fois par voyage. Tu choisis qui part ; celui qui prend sa place arrive à son niveau.",
      en: "Once per run. You pick who leaves; whoever takes their place arrives at that level.",
    },
    pcTitre: { fr: "Qui prend sa place ?", en: "Who takes their place?" },
    pcQuiPart: { fr: "Qui laisse sa place ?", en: "Who gives up their place?" },
    pcQuiPartDit: {
      fr: "Celui qui part rentre à la boîte. Celui qui prend sa place arrive à son niveau.",
      en: "Whoever leaves goes back in the box. Whoever takes their place arrives at that level.",
    },
    pcStarter: { fr: "ton départ", en: "your starter" },
    pcDit: {
      fr: "{qui} rentre à la boîte. Celui que tu choisis arrive au niveau {n}.",
      en: "{qui} goes back in the box. The one you pick arrives at level {n}.",
    },
    pcFait: { fr: "{qui} rentre. {nom} prend sa place.", en: "{qui} goes back. {nom} takes their place." },
    centreQuoi: { fr: "Quoi travailler ?", en: "What to work on?" },
    // 🔴 Le plafond de points d'effort rend un entraînement DÉFINITIVEMENT nul.
    //    C'est le seul cas où il faut détourner le joueur du bouton.
    centrePlafond: { fr: "au plafond", en: "maxed out" },
    // 🔴 EN 1999 L'ENTRAÎNEMENT « SPÉCIAL » LÈVE LES DEUX SPÉCIALES À LA FOIS.
    //    Ce n'est pas une simplification : le ROM de Cristal garde UNE seule
    //    case d'expérience de statistique pour l'Attaque et la Défense
    //    Spéciales. Le bouton disait « Spécial » — un nom de statistique que
    //    les fiches de Johto n'affichent nulle part, et le joueur ne pouvait
    //    pas savoir laquelle des deux il payait. Il paie les deux.
    centreDeuxSpe: { fr: "Les deux Spéciales", en: "Both Specials" },
    centreQuoiDit: {
      // 🔴 « SIX VICTOIRES » ÉTAIT FAUX D'UN FACTEUR SIX. `CENTRE_GAIN` vaut
      //    2 400, et une victoire lègue la statistique de base du vaincu —
      //    moyenne mesurée 68 sur les 302 fiches. Le vrai rapport est donc
      //    d'environ TRENTE-CINQ victoires. La phrase sous-évaluait
      //    l'entraînement sur l'écran même où l'on arbitre soigner/entraîner :
      //    elle poussait mécaniquement vers le soin.
      //  ⚠️ On dit « des dizaines », pas un chiffre : la moyenne dépend de qui
      //     l'on a vaincu, et le mode n'affiche pas de formule.
      fr: "Ce gain vaut des dizaines de victoires sur cette statistique. Il ne se perd plus.",
      en: "This gain is worth dozens of wins on that stat. It never fades.",
    },
    //  ⚠️ Elle renvoie vers l'écran par SON NOM DE BOUTON — renommé le 12/08
    //     avec lui (« LE JUGE » → « POTENTIEL ») : un renvoi vers un nom qui
    //     n'existe plus est une porte peinte sur un mur.
    centreFait: {
      fr: "Ton équipe a travaillé {stat}. Tu le verras dans POTENTIEL.",
      en: "Your team worked on {stat}. You'll see it under POTENTIAL.",
    },
    aBoutique: { fr: "Poké Balls, soins, et ce que les badges ont ouvert.", en: "Poké Balls, healing, and what your badges unlocked." },
    // La marche à monter, en un chiffre. Même abrégé que la fiche de duel et la
    // bannière du Champion : « N. » partout, jamais deux façons de dire niveau.
    aNiveau: { fr: "N.{a}", en: "Lv.{a}" },
    aNiveaux: { fr: "N.{a}-{b}", en: "Lv.{a}-{b}" },
    // ═══════════════════════════════════════════════════════════════════════
    //  COMBIEN DES MIENS TIENNENT LE NIVEAU DU CHAMPION
    //  🔴 On énonce un FAIT, on ne conseille pas. « Va entraîner les autres »
    //     serait un tutoriel ; « 1 de tes 6 » est une décision. Le joueur sait
    //     très bien quoi en faire — c'est la donnée qui lui manquait.
    // ═══════════════════════════════════════════════════════════════════════
    //  ⚠️ ET « AUCUN DE TES 1 POKÉMON » EST DU MAUVAIS FRANÇAIS. Vu à l'écran
    //     avec une équipe d'un seul — la faute exacte déjà corrigée au Centre
    //     Pokémon (« 1 de tes 1 Pokémon est blessé »). Le pluriel automatique
    //     règle l'accord, jamais la TOURNURE : quand il n'y en a qu'un, on le
    //     dit comme on le dirait à voix haute.
    //  🔴 « 2 DE TES 6 POKÉMON TIENT » — vu à l'écran le jour où le rail a
    //     ouvert la bande 1 à 3. Le verbe était figé au singulier, et l'accord
    //     déclaré portait sur `{t}` — la taille de l'équipe — au lieu de `{n}`,
    //     le nombre qui tient. La phrase était donc juste à 1 et fausse partout
    //     ailleurs, sur la fiche d'arène comme sur le rail.
    //     Le jeton d'accord existait depuis « 1 rencontres » ; personne ne
    //     l'avait mis sur le verbe.
    hauteurPart: { fr: "{n} de tes {t} {t|Pokémon|Pokémon} {n|tient|tiennent} le niveau {de|qui} (N.{a}).",
                   en: "{n} of your {t} Pokémon can match {qui} (Lv.{a})." },
    hauteurAucun: { fr: "Aucun de tes {t} {t|Pokémon|Pokémon} ne tient le niveau {de|qui} (N.{a}).",
                    en: "None of your {t} Pokémon can match {qui} (Lv.{a})." },
    //  ⚠️ « Ton SEUL Pokémon » a été refusé par `poke-genre` : il y lit un
    //     adjectif accordé au masculin sans variante féminine. Il a tort sur le
    //     fond — « seul » s'accorde ici à Pokémon, toujours masculin — mais on
    //     ne desserre pas un contrôle pour un cas : on écrit la phrase autrement.
    hauteurSeul: { fr: "Tu n'as qu'un Pokémon. Il ne tient pas le niveau {de|qui} (N.{a}).",
                   en: "You have one Pokémon. It cannot match {qui} (Lv.{a})." },
    //  ⚠️ SUR LE RAIL SEULEMENT, et suivie d'un FAIT, pas d'un conseil. La fiche
    //     d'arène dit déjà « aucun ne tient le niveau » — mais elle s'ouvre au
    //     BOUT de la carte, quand les embranchements sont consommés. Le rail le
    //     dit pendant qu'il reste des herbes et des dresseurs à choisir, et
    //     rappelle le mécanisme — un débutant ne sait pas encore que les
    //     niveaux se gagnent en chemin. La phrase s'éteint dès qu'un des tiens
    //     tient le niveau : affichée toujours, elle deviendrait un décor.
    hauteurChemin: { fr: "Les combats du chemin font monter ton équipe.",
                     en: "Fights along the way raise your team." },
    // ═══════════════════════════════════════════════════════════════════════
    //  LA COUVERTURE DE TYPES — LE SECOND FACTEUR, ET IL N'AVAIT AUCUNE VOIX
    //
    //  🔴 MESURÉ LE 11/08, SCEAU 0 : avec au moins une réponse de type,
    //     **84 %** de victoires ; sans aucune, **65 %** — sur 2 918 combats.
    //     Au plancher (« hasard »), 52 % contre 39 % sur 1 842. Dix-neuf points
    //     au plafond, treize au plancher, et le rail ne parlait que de NIVEAUX.
    //  🔴 ET LE MOTEUR AFFIRMAIT LE CONTRAIRE : `mesure-arene.js` écrit « la
    //     couverture de types n'y est pour presque rien : 44 % contre 32 % ».
    //     Ces chiffres ne décrivent plus le mode — le taux a doublé depuis, et
    //     l'écart avec. Une conclusion vraie le jour où on l'écrit devient un
    //     garde-fou faux le jour où le jeu bouge. Le commentaire est corrigé.
    //  ⚠️ ON NE PARLE QU'À ZÉRO RÉPONSE, comme le rail des niveaux ne parle
    //     qu'en dessous de la moitié : c'est la bande où l'on perd. Une équipe
    //     qui a une réponse doit la PLACER — c'est un autre problème, et il ne
    //     se règle pas sur la carte.
    //  ⚠️ Et la phrase dit ce qu'on peut FAIRE ici : la carte est le seul
    //     endroit où le chemin peut encore changer.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 CES DEUX PHRASES ONT ÉTÉ REFUSÉES PAR LE PROPRIÉTAIRE — 11/08/2026 :
    //    « cette phrase veut rien dire et fait trop IA ». Il a raison deux fois.
    //    « frappe {qui} par son type » n'est pas du français — on dit qu'on a
    //    l'AVANTAGE sur quelqu'un. Et « peut y répondre » est le genre de
    //    tournure qui a l'air d'un conseil sans en être un : elle ne dit ni
    //    quoi attraper, ni où. Un joueur qui lit ça ne sait pas quoi faire.
    // ✅ On dit l'ÉTAT en français simple, puis un geste CONCRET. Le nom du
    //    type manquant vient du calcul — la carte le connaît déjà.
    couvertureAucune: {
      fr: "Personne dans ton équipe n'a l'avantage sur {qui}.",
      en: "No one on your team has the advantage over {qui}.",
    },
    couvertureChemin: {
      fr: "Attrape un {type} en chemin, ou apprends-lui une capsule.",
      en: "Catch a {type} on the way, or teach one a TM.",
    },
    aUnEssai: { fr: "un seul essai, et il ne revient pas", en: "one attempt, and it does not come back" },
    // Le choix du starter se fait en DEUX temps : ces deux textes portent le
    // second. Le bouton nomme la créature — « Confirmer » obligerait le
    // joueur à se rappeler ce qu'il vient de toucher.
    //  🔴 « Ce choix ne se reprend pas » — proprio : « phrase IA de merde ».
    //     On dit ce que le JOUEUR vivra, avec ses mots à lui.
    starterDefinitif: { fr: "Tu ne pourras plus en changer.", en: "You won't be able to change it." },
    starterJePrends: { fr: "Je prends {nom}", en: "I take {nom}" },
    // Au doigt, la carte se choisit en deux temps, pour la même raison : lire
    // une case ne doit pas la jouer. Le bouton nomme la destination.
    carteUneSeule: { fr: "Une branche prise ferme les autres.", en: "Taking one branch closes the others." },
    carteYAller: { fr: "Y aller : {ou}", en: "Go there: {ou}" },
    // Le mot posé sur le rail de chaque rangée. Il dit où l'on joue, et où l'on
    // ne joue pas encore — la première rangée fermée dit AUSSI pourquoi.
    carteMotIci: { fr: "À toi de jouer", en: "Your move" },
    carteMotBloque: { fr: "Après ton choix", en: "After your choice" },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE NŒUD LE PLUS RARE DU MODE NE DISAIT PAS CE QU'IL DEMANDE.
    //     Mesuré le 09/08 sur 120 voyages en politique compétente, une fois le
    //     harnais rendu capable de CHASSER au lieu de jeter des Balls à main
    //     nue : sur 61 chasses menées jusqu'au bout,
    //       · **36 finissent en « victoire »** — on TUE ce qu'on voulait prendre ;
    //       · **23 en défaite** ;
    //       · **2 en capture** ;
    //       · et **45 se terminent sans une seule Ball en poche.**
    //     Artikodin : 6,7 %. Électhor et Sulfura : 0 %.
    //
    //     Le jeu, lui, affichait « Artikodin · un seul essai ». Il connaissait
    //     le compte de Balls du joueur, il savait s'il avait de quoi endormir,
    //     et il n'en disait rien. C'est la classe de défaut n°1 du dossier — le
    //     jeu SAIT et ne DIT pas — posée sur le contenu le plus désirable qu'il
    //     possède, celui dont dépendent le Pokédex de compte et le diplôme.
    //
    //  ✅ Le nœud annonce donc les deux choses qui décident de la chasse, et il
    //     les annonce AVANT qu'on y entre — c'est-à-dire quand on peut encore
    //     aller acheter, ou prendre l'autre chemin.
    //  ⚠️ On dit CE QU'ON A, pas ce qu'il faudrait avoir : « 3 Hyper Balls »
    //     laisse le joueur juger, « il t'en faudrait plus » décide à sa place.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 « 12 BALLS EN POCHE » — relevé par le propriétaire : « c'est moche, faut
    //    marquer Poké Balls ». Il a raison deux fois. « Ball » tout court n'est
    //    pas le nom de l'objet : la famille s'appelle **Poké Ball**, et ses
    //    membres sont Poké Ball, Super Ball, Hyper Ball, Master Ball. Écrire
    //    « Ball » abrège un nom propre, ce qu'aucun écran du jeu ne fait.
    aChasseBalls: { fr: "{n} {n|Poké Ball|Poké Balls} en poche", en: "{n} {n|Poké Ball|Poké Balls} in the bag" },
    aChasseSansBall: { fr: "aucune Poké Ball", en: "no Poké Ball at all" },
    aChasseDort: { fr: "de quoi l'endormir", en: "something to put it to sleep" },
    aChasseSansDort: { fr: "rien pour l'endormir", en: "nothing to put it to sleep" },
    aDonne: { fr: "Tu en ressors avec : {quoi}", en: "You leave with: {quoi}" },
    cleOuvre: { fr: "Elle ouvre :", en: "It opens:" },
    //  🔴 QUATRE CLÉS N'OUVRENT RIEN (déclarées dans poke-cles-mortes) et leur
    //     ligne du sac restait VIDE : le joueur les reçoit, les garde, et rien
    //     ne lui dit jamais pourquoi elles n'ouvrent rien ICI. Une clé sans
    //     verrou le DIT — la vérité du mode vaut mieux qu'un silence.
    cleRienVol: { fr: "Ce voyage ne revient jamais en arrière : rien à ouvrir.",
                  en: "This journey never turns back: nothing to open." },
    cleRienVelo: { fr: "Ici, les routes 17 et 18 se traversent à pied.",
                   en: "Here, Routes 17 and 18 are crossed on foot." },
    cleRienCarte: { fr: "Ici, chaque bâtiment tient en une seule étape : pas d'ascenseur.",
                    en: "Buildings here are single stops: no lift to unlock." },
    cleRienDentOr: { fr: "Le gardien du Parc Safari t'a déjà confié Force.",
                     en: "The Safari warden already handed you Strength." },
    sac_cles: { fr: "CLÉS", en: "KEY ITEMS" },
    aFossile: { fr: "Deux fossiles. Tu n'en prendras qu'un.", en: "Two fossils. You take only one." },
    // 🔴 LES DEUX NOMS, ET « L'AUTRE EST PERDU » : c'est le seul choix du mode
    //    qui retire définitivement une espèce du voyage. Le dire en nommant
    //    les deux fait la différence entre une règle et un dilemme.
    aFossileDeux: {
      fr: "{a} ou {b}. L'autre est perdu pour ce voyage.",
      en: "{a} or {b}. The other is lost for this run.",
    },
    aRocket: { fr: "La Team Rocket est là.", en: "Team Rocket is here." },
    rare: { fr: "rare", en: "rare" },
    jours: { fr: "Jour {j} sur {b}", en: "Day {j} of {b}" },
    badges: { fr: "Badges", en: "Badges" },
    sonActif: { fr: "Couper le son", en: "Mute the sound" },
    // 🔴 Trois crans nommés dans les mots du monde, pas « ×1 / ×2 / ×3 » : on
    //    dit une allure, pas un multiplicateur.
    rythmeQuoi: { fr: "Vitesse des combats", en: "Battle speed" },
    // ⚠️ UN NOM DE LANGUE S'ÉCRIT DANS SA PROPRE LANGUE. « French » sur un
    //    écran anglais ne sert personne : celui qui cherche sa langue cherche
    //    le mot qu'il sait lire.
    langueQuoi: { fr: "Langue", en: "Language" },
    langueFr: { fr: "Français", en: "Français" },
    langueEn: { fr: "English", en: "English" },
    rythmePose: { fr: "Normale", en: "Normal" },
    rythmeVif: { fr: "Rapide", en: "Fast" },
    rythmePresse: { fr: "Très rapide", en: "Very fast" },
    sonCoupe: { fr: "Remettre le son", en: "Unmute the sound" },
    volume: { fr: "Volume", en: "Volume" },
    // ── Le Parc Safari ──────────────────────────────────────────────────────
    nSafari: { fr: "Parc Safari", en: "Safari Zone" },
    aSafari: { fr: "{n} {n|Poké Ball|Poké Balls}, aucun combat", en: "{n} {n|Poké Ball|Poké Balls}, no battles" },
    // Ce qu'on vient y chercher, nommé. Sans « rare » ni « exclusif » : le nom
    // suffit à qui connaît, et le Pokédex dira le reste à qui ne connaît pas.
    aSafariRare: { fr: "{quoi} y rôde", en: "{quoi} prowls there" },
    safariBalls: { fr: "Poké Balls", en: "Poké Balls" },
    safariHumeur: { fr: "Humeur", en: "Mood" },
    // 🔴 LE CHIFFRE QUE LE PARC CACHAIT. Voir `PokeCapture.chanceSafari` : sans
    //    lui, l'appât et le caillou sont deux boutons sans conséquence visible.
    safariChance: { fr: "Chance de prise", en: "Catch chance" },
    safariPlusDeBalls: { fr: "Plus une seule Safari Ball.", en: "No Safari Balls left." },
    safariCalme: { fr: "Calme", en: "Calm" },
    safariEnerve: { fr: "Énervé — il fuira plus vite", en: "Angry — more likely to flee" },
    safariOccupe: { fr: "Occupé à manger", en: "Busy eating" },
    safariApparait: { fr: "{nom} apparaît. Tu ne peux pas te battre ici.",
                      en: "{nom} appears. You cannot fight here." },
    safariBall: { fr: "LANCER UNE BALL", en: "THROW A BALL" },
    safariAppat: { fr: "APPÂT", en: "BAIT" },
    safariCaillou: { fr: "CAILLOU", en: "ROCK" },
    safariPartir: { fr: "QUITTER LE PARC", en: "LEAVE THE PARK" },
    safariAppatDit: { fr: "Il mange. Il sera plus dur à attraper.",
                      en: "It eats. It will be harder to catch." },
    safariCailloDit: { fr: "Le caillou le touche. Plus facile à attraper, prêt à fuir.",
                       en: "The rock hits. Easier to catch, ready to bolt." },
    safariEchappe: { fr: "La Poké Ball s'ouvre.", en: "The Poké Ball opens." },
    safariFuit: { fr: "{nom} s'enfuit.", en: "{nom} fled." },
    safariPris: { fr: "{nom} est à toi.", en: "{nom} is yours." },
    safariBilan: { fr: "Tu ressors du Parc avec {n} {n|prise|prises} : {quoi}.",
                   en: "You leave the Park with {n} {n|catch|catches}: {quoi}." },
    // ── LE CONCOURS DE CAPTURE D'INSECTES ─────────────────────────────────
    nConcours: { fr: "Le Concours", en: "The Contest" },
    aConcours: { fr: "Vingt Poké Balls, une seule prise gardée. Le juge note la bête.",
      en: "Twenty Poké Balls, one catch kept. The judge scores your bug." },
    concTitre: { fr: "CONCOURS DE CAPTURE", en: "BUG-CATCHING CONTEST" },
    concBalls: { fr: "Poké Balls", en: "Poké Balls" },
    concTenue: { fr: "Ta prise", en: "Your catch" },
    concAucune: { fr: "aucune", en: "none" },
    concNote: { fr: "Note", en: "Score" },
    concApparait: { fr: "{nom} sort des herbes. Ici on n'attrape pas, on concourt.",
      en: "{nom} comes out of the grass. Here you don't just catch — you compete." },
    concGarder: { fr: "GARDER {nom} ({n} {n|point|points})", en: "KEEP {nom} ({n} {n|point|points})" },
    concQuel: { fr: "Tu ne peux en présenter qu'un. Lequel ?",
      en: "You can only enter one. Which?" },
    concPartir: { fr: "PRÉSENTER SA PRISE", en: "SUBMIT YOUR CATCH" },
    concBredouille: { fr: "Tu ressors sans rien à présenter. Le juge ne te note pas.",
      en: "You leave with nothing to enter. The judge does not score you." },
    concVerdict: { fr: "{nom} vaut {n} {n|point|points}.",
      en: "{nom} scores {n} {n|point|points}." },
    concPremier: { fr: "Premier. Le garde te tend une {quoi}.", en: "First place. The warden hands you a {quoi}." },
    concDeuxieme: { fr: "Deuxième. Le garde te tend une {quoi}.", en: "Second place. The warden hands you a {quoi}." },
    concTroisieme: { fr: "Troisième. Le garde te tend une {quoi}.", en: "Third place. The warden hands you a {quoi}." },
    concRien: { fr: "Hors du podium. Le garde te tend une {quoi} pour la peine.",
      en: "Off the podium. The warden hands you a {quoi} anyway." },
    safariBredouille: { fr: "Tu ressors du Parc les mains vides.",
                        en: "You leave the Park empty-handed." },
    // ── Le compagnon ────────────────────────────────────────────────────────
    nCompagnon: { fr: "Compagnon", en: "Companion" },
    compagnonTitre: { fr: "Emmène quelqu'un de ta collection.", en: "Bring someone from your collection." },
    // 🔴 « IL NE PORTE PAS LE VOYAGE » ÉTAIT FAUX, ET LA MESURE LE DIT : bien
    //    choisi, le compagnon porte la Ligue de 10,8 % à 26,3 %. La phrase
    //    disait au joueur que son choix ne comptait pas, sur l'écran où il
    //    compte le plus. Elle dit maintenant le vrai prix — une part
    //    d'expérience en moins pour tous — et ce qu'il faut en faire.
    compagnonDit: { fr: "Il arrive au niveau {n}. Il prend sa part d'expérience : prends-le solide.",
                    en: "They arrive at level {n}. They take a share of experience: pick a sturdy one." },
    compagnonSeul: { fr: "PARTIR SEUL", en: "GO ALONE" },
    // [20/08] Un légendaire attrapé peut enfin repartir avec toi — au niveau de
    // départ, comme les autres. Voir `choixCompagnon`.
    compagnonLegendaire: { fr: "Légendaire — tu l'as attrapé", en: "Legendary — you caught it" },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 ON CHOISISSAIT SON COMPAGNON À L'AVEUGLE, ET C'EST LE SEUL LEVIER
    //     QUI PUISSE RELEVER LA COUVERTURE DE TYPE.
    //
    //     Mesuré le 09/08 : la couverture — avoir une réponse de type contre le
    //     Champion — vaut **1 % à l'arène 3, 18 % chez Morgane, 28 % à
    //     l'arène 8**. C'est le vrai problème du mode : il affiche « son équipe
    //     craint : INSECTE » et sa distribution ne fournit presque jamais la
    //     réponse. Cinq mesures ont montré qu'aucun bonus ne peut compenser ça —
    //     *un multiplicateur sur un événement rare ne déplace pas une moyenne*.
    //
    //     Or le compagnon EST une réponse : un Pokémon de la collection, choisi
    //     librement, amené au niveau de l'équipe. Les huit Champions ont des
    //     équipes FIXES, écrites dans le ROM — donc la question « lequel répond
    //     à quoi » a une réponse exacte, connue d'avance, que le jeu calculait
    //     déjà pour l'écran d'arène et ne montrait pas ici.
    //
    //  ⚠️ ON COMPTE LES CHAMPIONS, PAS LES POKÉMON. « Répond à 3 Champions sur
    //     8 » se décide ; « efficace contre 7 Pokémon » ne dit pas s'ils sont
    //     tous chez le même. C'est la portée qui compte, pas le volume.
    //  ⚠️ ET ON DIT AUSSI ZÉRO. Un compagnon qui ne répond à personne reste un
    //     bon choix — pour sa puissance brute, ou pour le Pokédex. Taire le zéro
    //     laisserait croire à un oubli.
    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️ LA FORME ACCORDÉE DU MODE, pas un jeton par nombre. `{n|x|xs}` accorde
    //    à partir de deux — c'est `PokeGenre` qui le fait, et le lint refuse tout
    //    pluriel écrit en dur. Il avait raison : « 1 Champions ».
    compagnonRepond: { fr: "répond à {n} {n|Champion|Champions} sur {sur}",
                       en: "answers {n} of {sur} {sur|Leader|Leaders}" },
    // 🔴 CE QUE MESURE LA SOLIDITÉ, ET POURQUOI ON LA DIT EN PREMIER : choisir
    //    par la puissance porte la Ligue de 9,4 % à 26,3 %, choisir par le type
    //    la laisse à 9,4 %. On compare à ce que le joueur CONNAÎT — son Pokémon
    //    de départ — parce qu'un total de statistiques ne dit rien à personne.
    compagnonSolide: { fr: "plus solide {que|nom}", en: "sturdier than {nom}" },
    compagnonFragile: { fr: "plus fragile {que|nom}", en: "frailer than {nom}" },
    compagnonEgal: { fr: "aussi solide {que|nom}", en: "as sturdy as {nom}" },
    compagnonRepond0: { fr: "ne répond à aucun Champion", en: "answers no Leader" },
    // ── Le sac ──────────────────────────────────────────────────────────────
    nSac: { fr: "Sac", en: "Bag" },
    sacTitre: { fr: "Ce que tu emportes.", en: "What you carry." },
    //  🔴 « Ce que tu emploies ici ne se reprend pas » — proprio : « ça veut
    //     rien dire ». Même famille que le starter : on dit l'acte du joueur
    //     avec ses mots. Un objet utilisé est dépensé, point.
    sacDit: { fr: "Un objet utilisé est dépensé pour de bon.",
              en: "A used item is spent for good." },
    sacDitVitamine: { fr: "Les vitamines sont définitives. Choisis bien qui en profite.",
                      en: "Vitamins are permanent. Choose who benefits." },
    sacRien: { fr: "Rien à employer pour l'instant.", en: "Nothing to use right now." },
    // Le titre de la section, et la raison portée par chaque Ball : elle ne se
    // clique pas ici, et elle dit pourquoi plutôt que de se laisser essayer.
    sacBalls: { fr: "POUR CAPTURER", en: "TO CATCH" },
    sacBallsNote: { fr: "en combat seulement", en: "in battle only" },
    sac_soins: { fr: "SOINS", en: "HEALING" },
    sac_pierres: { fr: "PIERRES D'ÉVOLUTION", en: "EVOLUTION STONES" },
    // ── LA VEILLE DE VERSION ───────────────────────────────────────────────
    //  Lues par `gate.js`, qui pose le bandeau. Elles vivent ici parce que TOUS
    //  les textes du mode vivent ici — un texte écrit ailleurs échappe aux
    //  contrôles de langue, et c'est ainsi qu'une phrase anglaise passe en prod.
    majTitre: { fr: "Une nouvelle version est sortie.", en: "A new version is out." },
    majDit: { fr: "Ton voyage en cours est gardé.", en: "Your run is kept." },
    majBtn: { fr: "RECHARGER", en: "RELOAD" },
    majPlusTard: { fr: "PLUS TARD", en: "LATER" },
    sac_enMain: { fr: "EN MAIN", en: "HELD" },
    sacEnMainDit: { fr: "Ton équipe tient ça. Reprends-le pour t'en servir.",
      en: "Your team is holding this. Take it back to use it." },
    sacTenuPar: { fr: "tenu par {nom}", en: "held by {nom}" },
    sacRepris: { fr: "{nom} te rend {quoi}.", en: "{nom} hands you {quoi}." },
    // 🔴 LA RAISON TIENT DANS LA LISTE, PAS APRÈS LE CLIC. La ligne d'à côté
    //    affichait les PV d'un Pokémon dont le bouton était grisé pour une tout
    //    autre cause : le seul renseignement visible ne parlait pas du refus.
    //    Court, parce que la colonne est étroite — un refus qui déborde se
    //    replie et redevient illisible.
    sacPierrePas: { fr: "N'évolue pas", en: "No evolution" },
    // 🔴 CE QU'UNE VITAMINE DONNE, DIT AVANT LE CLIC. Voir `gainDeVitamine` :
    //    l'écran affichait les PV, un chiffre sans rapport, sur l'achat le plus
    //    cher et le plus définitif du mode.
    sacVitPlafond: { fr: "Au maximum", en: "At the cap" },
    sacVitLatent: { fr: "Acquis, invisible à ce niveau", en: "Banked, not visible yet" },
    sacPierreRien: { fr: "{nom} n'évolue pas avec cette pierre.",
                     en: "{nom} does not evolve with this stone." },
    sac_vitamines: { fr: "VITAMINES", en: "VITAMINS" },
    sac_bonbon: { fr: "SUPER BONBON", en: "RARE CANDY" },
    // ── Les capsules techniques ────────────────────────────────────────────
    sac_machines: { fr: "CAPSULES TECHNIQUES", en: "TECHNICAL MACHINES" },
    // 🔴 « CE QUI AGIT TOUT SEUL » EST UNE ABSTRACTION D'AUTEUR — critique du
    //    14/08. Le joueur doit décoder une définition pour comprendre qu'il n'a
    //    rien à cliquer. « SUR TOI » dit la même chose et se lit sans traduire :
    //    c'est porté, ça ne s'emploie pas.
    sac_porte: { fr: "SUR TOI", en: "ON YOU" },
    // 🔴 CETTE PHRASE DÉCRIVAIT L'ANCIENNE RÈGLE, celle qui faisait de la carte
    //    un piège : « ceux qui combattent en reçoivent moins ». Depuis que le
    //    combattant garde tout, elle était devenue fausse — et une promesse
    //    fausse sur un objet qu'on choisit est pire qu'un objet sans texte.
    expAllDit: {
      fr: "Les autres Pokémon gagnent la moitié d'un combat. Celui qui se bat garde tout le sien.",
      en: "The others gain half a battle's worth. The fighter keeps all of theirs.",
    },
    // Le filet : un écran plutôt qu'une carte morte, si l'impossible arrive.
    sansIssueTitre: { fr: "La route s'arrête ici", en: "The road ends here" },
    sansIssueDit: { fr: "Plus aucun chemin devant toi. Ton voyage se termine ici, avec ce que tu as pris.",
                    en: "No path left ahead. Your journey ends here, with what you caught." },
    sansIssueSortir: { fr: "VOIR LA VITRINE", en: "SEE THE SHOWCASE" },
    arenePreparer: { fr: "PRÉPARER L'ÉQUIPE", en: "PREPARE THE TEAM" },
    // ── Mon équipe face à la sienne ──────────────────────────────────────────
    //  Les quatre verdicts disent un FAIT, jamais un conseil. « Frappe fort »
    //  ne veut pas dire « commence par lui » : un Pokémon qui frappe fort et
    //  qui est fragile se joue en second, et c'est au joueur d'en décider.
    vTitre: { fr: "TON ÉQUIPE FACE À LUI", en: "YOUR TEAM AGAINST THEM" },
    // ── La Ligue : cinq combats, aucun soin entre eux ────────────────────────
    //  Ce qui rend la Ligue dure n'est pas le premier adversaire, c'est la
    //  SUITE. On annonce donc les cinq d'un coup, et la mesure porte sur
    //  l'ensemble de leurs Pokémon.
    ligueQui: { fr: "QUI T'ATTEND", en: "WHO IS WAITING" },
    ligueFace: { fr: "TON ÉQUIPE FACE À {nom}", en: "YOUR TEAM AGAINST {nom}" },
    ligueEquipe: { fr: "{n} {n|Pokémon|Pokémon}", en: "{n} {n|Pokémon|Pokémon}" },
    ligueNiveau: { fr: "jusqu'à N.{n}", en: "up to Lv.{n}" },
    ligueDernier: { fr: "en dernier", en: "last" },
    //  🔴 À Kanto, le cinquième est le rival et la phrase est un coup de
    //     théâtre. Ailleurs, le Maître est connu de tous : on l'annonce, on ne
    //     le révèle pas. Deux mondes, deux façons d'arriver au sommet.
    ligueMaitre: { fr: "{nom} garde la dernière porte.", en: "{nom} guards the last door." },
    ligueConseilType: { fr: "{nom} t'attend. Son équipe est {type}.", en: "{nom} is waiting. Their team is {type}." },
    ligueConseilNu: { fr: "{nom} t'attend.", en: "{nom} is waiting." },
    // 🔴 LE JEU A DÉJÀ SON VOCABULAIRE, ET C'EST CELUI DE 1996 (12/08, le
    //    proprio : « pas les bons termes pour Pokémon »). Les boutons
    //    d'attaque disent « super efficace »/« peu efficace » (`effForte`,
    //    `effFaible`) depuis toujours — les verdicts parlaient une AUTRE
    //    langue (« frappe fort », « ne mord pas ») sur les mêmes faits de la
    //    même table. Un seul lexique, celui que tout joueur connaît par cœur.
    //  ⚠️ « not very effective » est plus long que « no bite » : la tenue à
    //     320 px a été revérifiée aux DEUX langues après le changement.
    vFort: { fr: "super efficace", en: "super effective" },
    vRien: { fr: "peu efficace", en: "not very effective" },
    vFragile: { fr: "faiblesse", en: "weakness" },
    vTient: { fr: "résiste", en: "resists" },
    vRien2: { fr: "neutre", en: "even" },
    // 🔴 « on n'y revient pas » — jugé FLOU par le propriétaire, et il a
    //    raison : la formule décrit un déplacement (revenir où ?) alors que la
    //    loi est une OCCASION — ce lieu ne reparaîtra plus, c'est ici ou
    //    jamais. On le dit avec les mots du joueur.
    uneSeuleFois: { fr: "maintenant ou jamais", en: "now or never" },
    mewTrace: { fr: "une trace", en: "a trace" },
    resteRangees: { fr: "{n} {n|pas|pas} avant le Champion.",
                    en: "{n} {n|step|steps} to the Leader." },
    // ── Le rival ───────────────────────────────────────────────────────────
    nRival: { fr: "Ton rival", en: "Your rival" },
    // 🔴 L'histoire de la Rocket s'ouvrait quatre fois et ne se fermait jamais :
    //    sa dernière réplique attendait un écran qui existait déjà.
    nRocket: { fr: "Team Rocket", en: "Team Rocket" },
    // ── LE CAMION ──────────────────────────────────────────────────────────
    //  🔴 LA RUMEUR DE 1996, RENDUE VRAIE. Le camion du quai existe dans le ROM
    //     et n'a jamais rien caché. Il se croise à CHAQUE voyage et il dit ce
    //     qu'il voit : rien, puis quelque chose qui remue, puis Mew. C'est
    //     l'état du milieu qui tient le joueur — sans lui, la condition serait
    //     invisible et la récompense tomberait du ciel.
    nCamion: { fr: "Le camion", en: "The truck" },
    aCamion: { fr: "Rien dessous", en: "Nothing under it" },
    aCamionRemue: { fr: "Quelque chose remue dessous", en: "Something stirs under it" },
    aCamionMew: { fr: "Quelque chose t'attend dessous", en: "Something waits under it" },
    camionRien: {
      fr: "Tu soulèves le camion. Il n'y a rien. Il n'y a jamais rien eu.",
      en: "You lift the truck. There is nothing. There never was.",
    },
    camionRemue: {
      fr: "Tu soulèves le camion. Quelque chose file avant que tu voies quoi.",
      en: "You lift the truck. Something darts away before you can see it.",
    },
    camionMew: {
      fr: "Tu soulèves le camion. Mew te regarde.",
      en: "You lift the truck. Mew is looking at you.",
    },
    camionCompte: { fr: "{n} {n|espèce|espèces} sur 150 à ton Pokédex.", en: "{n} {n|species|species} of 150 in your Pokédex." },
    // 🔴 CETTE PHRASE ÉTAIT FAUSSE, ET SUR LE SEUL ÉCRAN QUI DOIT DONNER UN
    //    CAP. Elle disait « il faut les 150 autres » à qui en a déjà cent
    //    douze — l'objectif paraissait donc intact après cent captures, et le
    //    seul moment du mode qui récompense une collection de compte se lisait
    //    comme un mur immobile. On dit ce qu'il MANQUE : c'est le même fait,
    //    et c'est la différence entre un mur et une ligne d'arrivée.
    camionSeuil: {
      fr: "Il t'en manque {n}. Pas une de moins.",
      en: "You are {n} short. Not one fewer.",
    },
    // ── LA GROTTE INCONNUE ─────────────────────────────────────────────────
    //  🔴 MEWTWO N'ÉTAIT DANS AUCUN ACTE. Sa grotte n'existe qu'après la Ligue —
    //     c'est le canon — et `actes.js` rangeait l'étape dans un champ
    //     `epilogue` que personne ne lisait. Le légendaire le plus célèbre du
    //     jeu était injoignable depuis le premier jour.
    nGrotte: { fr: "La Grotte Inconnue", en: "Cerulean Cave" },
    grotteDit: {
      fr: "La Ligue est à toi. Une grotte s'ouvre au bord d'Azuria.",
      en: "The League is yours. A cave opens by Cerulean City.",
    },
    grotteQui: { fr: "Quelque chose y vit. Un seul essai.", en: "Something lives there. One attempt." },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [20/08, Archii sur Discord] « JE CAPTURE MEWTWO, PAS POSSIBLE DE ME
    //     FAIRE JOUER, LA PARTIE SE TERMINE ». C'est le dessin : la grotte EST
    //     l'épilogue, elle s'ouvre après la Ligue et le voyage se referme
    //     derrière, qu'on entre ou qu'on renonce. Rien ne le disait AVANT le
    //     clic — le joueur croit gagner un compagnon, il gagne une ligne de
    //     Pokédex et un trophée sur l'écran de fin.
    //  ⚠️ On ne change pas la règle ici (ce serait une modification de jeu, à
    //     valider) : on la DIT au moment où elle se décide. Le reste — un
    //     « après » où l'on jouerait avec lui — est une décision de design.
    // ═══════════════════════════════════════════════════════════════════════
    grotteFin: {
      fr: "Ta prise entre dans ton équipe et au Pokédex de ton compte. Le voyage se referme après : c'est la dernière page.",
      en: "Your catch joins your team and your account Pokédex. The journey closes after this: it is the last page.",
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 TRANCHÉ LE 20/08 : LA GROTTE RESTE LA DERNIÈRE PAGE.
    //     Trois raisons, et elles tiennent au mode lui-même :
    //     · la grotte s'ouvre APRÈS la Ligue, dans le canon comme ici ; la
    //       remonter avant donnerait un niveau 70 contre des Champions à 60 —
    //       la Ligue cesserait d'être le sommet ;
    //     · un légendaire n'ouvre JAMAIS un départ (`depart.js`) : « ils sont
    //       uniques par partie, en faire un départ retirerait le seul moment
    //       de rareté du jeu ». C'est juste, et ça vaut aussi pour la suite ;
    //     · prolonger un voyage après la Ligue, c'est inventer un mode sans
    //       fin — la boucle « encore un voyage » est ce qui fait tenir celui-ci.
    //  🔑 CE QUI MANQUAIT N'ÉTAIT PAS UNE SUITE, C'ÉTAIT LE PRIX. La prise
    //     compte déjà quatre fois — équipe scellée du duel, Pokédex du compte,
    //     score, et la chasse « Un légendaire » qui ouvre un serment pour les
    //     voyages suivants — et RIEN ne le disait sur l'écran où l'on décide.
    //     Un joueur qui ne voit pas ce qu'il gagne croit ne rien gagner.
    //  ⚠️ Le nom de la chasse et celui du serment se LISENT dans leurs tables :
    //     les recopier ici les ferait diverger au premier renommage.
    // ═══════════════════════════════════════════════════════════════════════
    grotteVaut: {
      fr: "Elle vaut : ton équipe scellée pour tes duels, une ligne de plus au Pokédex de ton compte, et la chasse « {chasse} », qui ouvre {le|serment} pour tes prochains voyages.",
      en: "It is worth: your sealed duel team, one more line in your account Pokédex, and the “{chasse}” hunt, which unlocks the {serment} oath for your next journeys.",
    },
    grotteVautDeja: {
      fr: "Elle vaut : ton équipe scellée pour tes duels, une ligne de plus au Pokédex de ton compte, et le score du voyage.",
      en: "It is worth: your sealed duel team, one more line in your account Pokédex, and the journey's score.",
    },
    grotteEntrer: { fr: "ENTRER DANS LA GROTTE", en: "ENTER THE CAVE" },
    grotteClore: { fr: "CLORE LE VOYAGE", en: "END THE JOURNEY" },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 L'ÉPILOGUE DE JOHTO N'EST PAS UNE GROTTE, C'EST QUELQU'UN. Red
    //     attend au sommet du Mont Argenté et ne dit rien — c'est le combat le
    //     plus dur des deux générations, et la seule chose qui s'oppose
    //     vraiment à un joueur arrivé au bout.
    //  ⚠️ ON NE LUI PRÊTE PAS DE RÉPLIQUE. Il se tait dans le jeu d'origine, et
    //     lui écrire une phrase serait inventer du lore — la règle du dossier.
    // ═══════════════════════════════════════════════════════════════════════
    nSommet: { fr: "Le sommet", en: "The summit" },
    sommetDit: {
      fr: "Au bout de la Grotte Argentée, quelqu'un attend. Il ne dit rien.",
      en: "At the end of Silver Cave, someone is waiting. He says nothing.",
    },
    sommetQui: { fr: "Un seul essai.", en: "One attempt." },
    sommetMonter: { fr: "MONTER AU SOMMET", en: "CLIMB TO THE SUMMIT" },
    // Le choix, quand l'épilogue en offre plusieurs. Johto en a trois.
    epilogueApres: { fr: "Après la Ligue", en: "After the League" },
    // ═══════════════════════════════════════════════════════════════════════
    //  LES TROIS BÊTES — CE QUI REND JOHTO DUR
    //  🔴 Elles ne s'annoncent PAS d'avance sur la carte : c'est tout leur
    //     intérêt. Un nœud d'herbe promet ses rencontres, et l'une d'elles
    //     peut être ça. On le dit APRÈS, parce qu'un joueur doit comprendre ce
    //     qui vient de lui arriver — mais on ne le lui promet pas avant.
    // ═══════════════════════════════════════════════════════════════════════
    errantLibere: {
      fr: "Trois ombres jaillissent de la tour et se dispersent dans Johto.",
      en: "Three shapes burst from the tower and scatter across Johto.",
    },
    // ⚠️ « TE », PAS « VOUS ». Tout le mode tutoie ; j'avais écrit la seule
    //    phrase qui vouvoie, et `poke-genre` l'a prise pour un pluriel écrit en
    //    dur — un détecteur qui crie à côté avait raison sur le fond.
    errantParait: { fr: "{nom} te barre la route.", en: "{nom} blocks your way." },
    errantPresse: { fr: "Il ne restera pas.", en: "It will not stay." },
    errantFuit: { fr: "{nom} s'enfuit.", en: "{nom} flees." },
    errantEncore: { fr: "Il court toujours quelque part.", en: "It is still running somewhere." },
    epilogueChoix: {
      fr: "Le voyage est fini. Il reste ceci — une seule chose, et une seule fois.",
      en: "The journey is over. This remains — one thing, once.",
    },
    rivalSansNom: { fr: "Ton rival", en: "Your rival" },
    aRival: { fr: "{qui} t'attend · {n} {n|Pokémon|Pokémon}",
              en: "{qui} is waiting · {n} Pokémon" },
    retourRival: { fr: "RETOUR AU RIVAL", en: "BACK TO YOUR RIVAL" },
    // ── La réserve ─────────────────────────────────────────────────────────
    // 🔴 L'ÉCRAN NE PARLE PLUS SEULEMENT DE LA RÉSERVE : on y décide aussi QUI
    //    ENTRE EN PREMIER. Le garder nommé « RÉSERVE » cacherait la seule
    //    action tactique posable hors combat derrière un mot qui parle d'autre
    //    chose — et un joueur sans réserve n'aurait aucune raison de l'ouvrir.
    nBoite: { fr: "Équipe", en: "Team" },
    aBoite: { fr: "ÉQUIPE", en: "TEAM" },
    boiteTitre: { fr: "Qui entre en premier ?", en: "Who leads?" },
    boiteDit: { fr: "Touche un des tiens pour le mettre en tête.",
                en: "Tap one of yours to put it in front." },
    // ⚠️ COUPÉE EN DEUX (15 mots, plafond 14) : deux gestes, deux phrases.
    boiteDitReserve: { fr: "Touche un des tiens pour le mettre en tête. Ou un de la réserve pour l'échanger.",
                       en: "Tap one of yours to lead. Or one in storage to swap it in." },
    boiteTete: { fr: "EN TÊTE", en: "LEADS" },
    boiteEnTete: { fr: "{nom} entre en premier.", en: "{nom} leads." },
    // Le retour du glisser-déposer : on dit la PLACE, sinon le joueur relâche
    // sans savoir si son geste a pris — et une action qu'on ne voit pas prendre
    // devient une superstition.
    boiteRange: { fr: "{nom} passe en {n}ᵉ.", en: "{nom} moves to slot {n}." },
    // 🔴 LA CONSIGNE DÉCRIVAIT UN MÉCANISME, PAS UN ENJEU. « Touche un des tiens
    //    pour le mettre en tête » explique comment on clique ; elle occupait la
    //    ligne sous le titre, celle qu'on lit vraiment. Elle dit maintenant ce
    //    que l'ordre FAIT — le premier ouvre, les autres relaient — et le geste
    //    neuf dans la foulée.
    // 🔴 « MAINTIENS ET » N'EST PAS UN MOT DE PLUS, C'EST LE GESTE (16/08). Au
    //    doigt, le glisser s'arme par un appui long — sans quoi la liste ne
    //    défilerait plus, ce qui a été signalé par quatre joueurs. Une phrase
    //    qui dit « glisse » à qui doit d'abord MAINTENIR décrit un geste qui
    //    échoue. Elle vaut aussi à la souris, où maintenir puis tirer est ce
    //    qu'on fait déjà.
    boiteOrdre: { fr: "Le premier ouvre le combat. Maintiens et glisse pour changer l'ordre.",
                  en: "The first one opens the fight. Press and hold, then drag to reorder." },
    // 🔴 LES DEUX CAS QUI MANQUAIENT : le geste utile se taisait dès qu'une
    //    réserve existait, et on promettait le glisser à un joueur qui n'a
    //    qu'un seul Pokémon — où il est impossible.
    boiteGlisse: { fr: "Maintiens et glisse pour changer l'ordre.",
                   en: "Press and hold, then drag to reorder." },
    boiteSeul: { fr: "Il ouvre le combat, et il est seul pour l'instant.",
                 en: "It opens the fight, and it is alone for now." },
    boiteTeteRefus: { fr: "Il est à terre. Il ne peut pas ouvrir.", en: "It has fainted. It cannot lead." },
    // Le mot du ROM, déjà employé sur l'écran de fin : un seul mot pour un seul
    // état, sinon le joueur croit à deux états.
    boiteATerre: { fr: "à terre", en: "fainted" },
    // 🔴 Le Serment du plafond arrête les niveaux : sans cette ligne, le joueur
    //    croit à un défaut du jeu.
    // 🔴 « PLAFOND JURÉ » N'EST PAS DU FRANÇAIS DE JOUEUR — critique du 14/08.
    //    C'est une abstraction d'auteur : le mot « plafond » n'apparaît nulle
    //    part ailleurs dans le mode, et « juré » demande de se souvenir qu'un
    //    serment a été prêté à la création. On dit ce que la règle FAIT, et on
    //    rappelle QUI l'a décidée — c'est le joueur, et c'est ce qui rend la
    //    contrainte supportable.
    //  🔴 DEUXIÈME RÉÉCRITURE, LE MÊME JOUR : « Tu as juré : personne ne
    //     dépassera… » a été jugée « une phrase de merde » par le propriétaire,
    //     et il a raison — elle sermonne. Le joueur n'a pas besoin qu'on lui
    //     rappelle son serment sur un ton de contrat ; il a besoin de savoir
    //     que ses niveaux vont s'ARRÊTER, et à combien. On dit le FAIT, avec le
    //     chiffre en premier, et rien d'autre.
    boitePlafond: { fr: "Niveau {n} maximum jusqu'au Champion.",
                    en: "Level {n} cap until the Leader." },
    // 🔴 [17/08] Le plafond se disait sur l'écran du PC, et nulle part au
    //    moment où il MORD. On le dit là où le joueur le vit : après le combat
    //    qui aurait dû faire monter. Voir `ecranMontees`.
    plafondAtteint: { fr: "{nom} a de quoi monter, mais pas le droit. Niveau {n} maximum jusqu'au prochain Champion.",
                      en: "{nom} has enough to level up but not the right. Level {n} is the cap until the next Leader." },
    boiteContre: { fr: "Contre qui ? Celui que tu désignes part en réserve.",
                   en: "In place of whom? The one you pick goes to storage." },
    boiteReserve: { fr: "EN RÉSERVE", en: "IN STORAGE" },
    boiteEquipe: { fr: "TON ÉQUIPE", en: "YOUR TEAM" },
    boiteFait: { fr: "{b} entre. {a} passe en réserve.", en: "{b} joins. {a} goes to storage." },
    boiteRefus: { fr: "Cet échange n'est pas possible.", en: "That swap is not possible." },
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 « J'AI CAPTURÉ MEWTWO ET JE N'AI PAS PU L'EMBARQUER » — Poltron_sofa,
    //    18/08, Master Ball économisée tout le voyage pour lui. La grotte de
    //    l'épilogue s'ouvre APRÈS la Ligue gagnée ; à ce moment la partie est
    //    close, et la seule porte de la réserve est le bouton de la CARTE, qui
    //    ne se rouvrira plus. Équipe pleine, donc Mewtwo tombait en réserve :
    //    enregistré au Pokédex, absent de l'équipe scellée, absent de l'écran
    //    de fin. La prise la plus rare du mode, payée le plus cher, invisible.
    // 🔑 La classe, pas le cas : TOUTE prise qui arrive quand il n'y a plus de
    //    carte doit pouvoir entrer dans l'équipe. Voir `priseTardive`.
    // ═══════════════════════════════════════════════════════════════════════
    nAdieu: { fr: "Avant de rentrer", en: "Before heading home" },
    adieuTitre: { fr: "Qui repart avec toi ?", en: "Who comes home with you?" },
    adieuDit: {
      fr: "Ta dernière prise attend en réserve. Touche-la, puis touche celui qu'elle remplace.",
      en: "Your last catch waits in storage. Tap it, then tap the one it replaces.",
    },
    adieuFini: { fr: "C'EST MON ÉQUIPE", en: "THIS IS MY TEAM" },
    retourArene: { fr: "RETOUR À L'ARÈNE", en: "BACK TO THE GYM" },
    // Le numéro fait partie du nom d'une machine, comme dans le jeu d'origine :
    // « CT24 Tonnerre » se retient, « Tonnerre » tout seul se confond avec
    // l'attaque qu'un Pokémon connaît déjà.
    ctPuissance: { fr: "{n} de puissance", en: "power {n}" },
    ctSansDegats: { fr: "sans dégâts", en: "no damage" },
    ctQui: { fr: "{n} {n|peut l'apprendre|peuvent l'apprendre}",
             en: "{n} can learn it" },
    ctPersonne: { fr: "personne ne l'apprend", en: "nobody can learn it" },
    ctQuiTitre: { fr: "Qui apprend {quoi} ?", en: "Who learns {quoi}?" },
    ctUnique: { fr: "Une CT ne sert qu'une fois.", en: "A TM works only once." },
    ctPeut: { fr: "peut l'apprendre", en: "can learn it" },
    // Les deux faits qui départagent deux porteurs également capables.
    ctMemeType: { fr: "même type : frappe plus fort", en: "same type: hits harder" },
    ctQuatre: { fr: "4 attaques — il devra en oublier une", en: "4 moves — one must go" },
    ctPlaceLibre: { fr: "une place libre", en: "a free slot" },
    ctNePeutPas: { fr: "ne peut pas", en: "cannot" },
    ctDejaConnue: { fr: "la connaît déjà", en: "already knows it" },
    ctOublier: { fr: "{nom} doit oublier une attaque pour {quoi}",
                 en: "{nom} must forget a move for {quoi}" },
    ctOublierDit: { fr: "Quatre attaques au maximum. Choisis celle qui part.",
                    en: "Four moves at most. Choose the one that goes." },
    ctApprise: { fr: "{nom} apprend {quoi}.", en: "{nom} learns {quoi}." },
    ctRefus: { fr: "{nom} ne peut pas l'apprendre.", en: "{nom} cannot learn it." },
    sacQui: { fr: "{quoi} — pour qui ?", en: "{quoi} — for whom?" },
    sacVitamine: { fr: "{nom} gagne {n} en {stat}, pour toujours.", en: "{nom} gains {n} {stat}, permanently." },
    // 🔴 QUAND LE NOMBRE NE BOUGE PAS, ON LE DIT AUSSI — et on dit pourquoi.
    //    Le gain est acquis, il se révélera en montant de niveau : c'est le
    //    calcul du jeu d'origine, pas une panne. Sans cette phrase, le joueur
    //    voit 9 800 ₽ partir pour rien et n'en rachètera jamais.
    sacVitamineLatente: {
      fr: "{nom} progresse en {stat}. Ça se verra en montant de niveau.",
      en: "{nom} improves in {stat}. It will show on the next level-ups.",
    },
    sacBonbon: { fr: "{nom} monte d'un niveau.", en: "{nom} gains a level." },
    sacSoigne: { fr: "{nom} récupère {n} PV.", en: "{nom} recovers {n} HP." },
    sacGuerit: { fr: "{nom} va mieux.", en: "{nom} feels better." },
    sacRanime: { fr: "{nom} est de nouveau debout.", en: "{nom} is back on its feet." },
    sacPlafond: { fr: "{nom} est au maximum. La vitamine ne ferait rien.",
                  en: "{nom} is maxed out. The vitamin would do nothing." },
    sacImpossible: { fr: "Ça ne servirait à rien sur {nom}.", en: "That would do nothing for {nom}." },
    aSac: { fr: "SAC", en: "BAG" },
    // 🔴 CETTE CLÉ MANQUAIT, et `poke-textes` — écrit une heure plus tôt — l'a
    //    attrapée avant qu'elle n'arrive à l'écran. Le bouton du choix de cible
    //    serait sorti VIDE. Un détecteur écrit le matin qui rattrape une faute
    //    du soir, c'est exactement ce à quoi il sert.
    retour: { fr: "RETOUR", en: "BACK" },
    retourCarte: { fr: "RETOUR À LA CARTE", en: "BACK TO THE MAP" },
    // ── Le K.O. ─────────────────────────────────────────────────────────────
    nKo: { fr: "K.O.", en: "Blacked out" },
    koTitre: { fr: "Ton équipe ne tient plus debout.", en: "Your team can't stand." },
    koArene: { fr: "Tu perds {n} ₽. Le Champion t'attend toujours.",
               en: "You lose {n} ₽. The Leader is still waiting." },
    koRoute: { fr: "Tu perds {n} ₽. Ton équipe repart soignée.",
               en: "You lose {n} ₽. Your team is healed." },
    // 🔴 LE TEXTE DISAIT « DEVANT LUI » parce que le compteur ne servait que
    //    devant un Champion. Il court maintenant sur tout l'acte : un message
    //    qui nomme mal ce qu'il compte est un piège, pas une règle.
    // ⚠️ PAS « CONTRE LUI » : `echouerDansLActe` consomme un essai à TOUTE
    //    défaite de l'acte, dresseur de route compris. La phrase désignait le
    //    seul Champion et faisait croire les combats de route gratuits.
    essaisRegle: { fr: "{n} {n|essai|essais} dans cet acte, toutes défaites comprises.",
                   en: "{n} {n|attempt|attempts} this act, every defeat counted." },
    koEssais: { fr: "Il te reste {n} {n|essai|essais} dans cet acte.",
                en: "You have {n} {n|attempt|attempts} left in this act." },
    // 🔴 LE NOMBRE VIENT DE LA CONSTANTE, JAMAIS DE LA PLUME. Cette phrase a
    //    dit « Trois tentatives » pendant tout le temps où `ESSAIS_BOSS` en
    //    valait deux : le dernier écran d'un voyage perdu apprenait un budget
    //    faux pour le suivant. L'appelant passait déjà `{ n: ESSAIS_BOSS }`.
    koEpuise: { fr: "{n} {n|tentative|tentatives}, {n} {n|échec|échecs}. Le voyage s'arrête ici.",
                en: "{n} {n|attempt|attempts}, {n} {n|defeat|defeats}. The journey ends here." },
    koReessayer: { fr: "REPARTIR", en: "GET BACK UP" },
    koAbandonner: { fr: "ARRÊTER LE VOYAGE", en: "END THE JOURNEY" },
    areneEnJeu: { fr: "En jeu : le Badge {badge}.", en: "At stake: the {badge} Badge." },
    // 🔴 L'ARÈNE SOIGNAIT L'ÉQUIPE GRATUITEMENT ET NE LE DISAIT PAS — sur
    //    l'écran même qui propose « PRÉPARER L'ÉQUIPE » et ouvre le sac.
    //    `#pk-defi` remet PV, statuts et PP de tout le monde avant le combat.
    //    Un joueur qui arrive avec trois Pokémon à moitié morts brûlait donc
    //    ses Potions et ses Antidotes juste avant un remboursement intégral.
    //    Le soin est un bon dessin — on n'entre pas chez un Champion à plat —
    //    mais il ne vaut que s'il est ANNONCÉ : sinon c'est une ressource
    //    dépensée pour rien, et le jeu le savait.
    areneSoigne: { fr: "Ton équipe entre soignée. Garde tes soins pour le combat.",
                   en: "Your team enters fully healed. Keep your items for the fight." },
    //  ⚠️ La Ligue a sa propre phrase, et c'est le CONTRASTE qui compte :
    //     soignée à l'entrée, plus rien ensuite. Réemployer celle de l'arène
    //     aurait dit « garde tes soins pour le combat » au singulier, là où
    //     l'enjeu est de les répartir sur cinq.
    ligueSoigne: { fr: "Ton équipe entre soignée. Ce sera la dernière fois.",
                   en: "Your team enters fully healed. That will be the last time." },
    dejaEnPoche: { fr: "tu en as {n}", en: "you have {n}" },
    cadeauTitre: { fr: "{nom} est à toi.", en: "{nom} is yours." },
    cadeauDit: { fr: "On te le donne. Tu n'as rien eu à faire.",
                 en: "It is given to you. You did nothing for it." },
    cadeauOuvre: { fr: "Il ouvre", en: "It opens" },
    // [22/08] La condition en version COURTE : cette ligne met cinq voies
    // côte à côte, une phrase par voie la rendrait illisible. La fiche du
    // Pokémon, elle, garde ses phrases entières (`evoPierre` et compagnie).
    ouvreCondPierre: { fr: "{o}", en: "{o}" },
    ouvreCondNiveau: { fr: "niveau {n}", en: "level {n}" },
    ouvreCondEchange: { fr: "échange", en: "trade" },
    ouvreCondBonheur: { fr: "bonheur", en: "friendship" },
    ouvreCondBonheurJour: { fr: "bonheur, le jour", en: "friendship, by day" },
    ouvreCondBonheurNuit: { fr: "bonheur, la nuit", en: "friendship, at night" },
    // 🔴 Quatre Pokémon n'évoluent que par échange, et le mode n'en offrait
    //    aucun moyen. Le dresseur fait l'aller-retour — ce que deux joueurs
    //    font depuis 1996 avec un câble.
    trocRetourDit: { fr: "Il accepte l'aller-retour. Ce qui part revient changé.",
                     en: "They'll trade and trade back. What leaves returns changed." },
    trocRetourFait: { fr: "{qui} part et revient. C'est {nom} maintenant.",
                      en: "{qui} leaves and comes back. It's {nom} now." },
    echangeTuLAs: { fr: "tu l'as", en: "you have it" },
    echangeIlTeFaut: { fr: "il te le faut", en: "you need it" },
    nAbandon: { fr: "Arrêter", en: "Stop" },
    abandonTitre: { fr: "Tu veux t'arrêter là ?", en: "Do you want to stop here?" },
    // ⚠️ Même incise contrastive retirée qu'en fin de voyage : « Le voyage, LUI,
    //    sera perdu ». L'opposition tient dans les deux phrases.
    abandonDit: { fr: "Tu gardes ta collection. Le voyage sera perdu pour de bon.",
                  en: "You keep your collection. The journey will be gone for good." },
    abandonContinuer: { fr: "CONTINUER LE VOYAGE", en: "KEEP GOING" },
    // ── La prise ────────────────────────────────────────────────────────────
    nPrise: { fr: "Capture", en: "Caught" },
    nChromatique: { fr: "Chromatique", en: "Shiny" },
    priseTitre: { fr: "{nom} est à toi.", en: "{nom} is yours." },
    // 🔴 LA PHRASE DIT CETTE PRISE, PAS LA RÈGLE. Une explication générique se
    //    lit une fois puis devient du bruit — et l'écran revient à chaque
    //    capture. En parlant du Pokémon qu'on vient d'attraper, elle enseigne la
    //    même règle par comparaison, et elle reste utile au centième passage.
    dOrdinaire: { fr: "Ses statistiques sont faibles pour son espèce.",
                  en: "Its stats are weak for its species." },
    dCorrect: { fr: "Des statistiques dans la moyenne de son espèce.",
                en: "Average stats for its species." },
    dSolide: { fr: "De bonnes statistiques. Il tiendra la route.",
               en: "Good stats. It will hold up." },
    dExceptionnel: { fr: "Un potentiel rare. Un sur cent trente-trois.",
                     en: "Rare potential. One in a hundred and thirty-three." },
    dParfait: { fr: "Statistiques parfaites. Un sur soixante-cinq mille.",
                en: "Perfect stats. One in sixty-five thousand." },
    priseChromatique: { fr: "Une chance sur 8192. Garde-le.",
                        en: "A one in 8192 chance. Keep it." },
    priseNiveau: { fr: "Niveau", en: "Level" },
    priseTypes: { fr: "Type", en: "Type" },
    prisePotentiel: { fr: "Potentiel", en: "Potential" },
    priseDitPotentiel: {
      fr: "Né avec. Ça ne change plus, et ça pèse sur chaque statistique.",
      en: "Born with it. It never changes, and it weighs on every stat.",
    },
    priseSuite: { fr: "CONTINUER", en: "CONTINUE" },
    // 🔴 ELLE DIT QUE C'EST FACULTATIF, et ce que le nom devient : il reste
    //    entre les voyages, dans le PC. Sans ça le joueur hésite à écrire.
    surnomDit: { fr: "Un nom ? Il le gardera, même après ce voyage.",
                 en: "A name? It will keep it, even after this journey." },
    // Le starter porte le nom le plus longtemps : on nomme l'espèce dans la
    // question, parce qu'à ce moment-là le joueur vient tout juste de choisir.
    // 🔴 « ET LUI ? (SALAMÈCHE) » NE DISAIT PAS CE QU'ON DEMANDAIT. Ses deux
    //    voisins sur le même écran sont limpides — « Ton nom », « Le nom de ton
    //    rival » — et le troisième posait une question sans complément, en
    //    capitales, sur le premier écran du jeu. Un QA d'onboarding l'a relevé.
    //    ⚠️ Et c'est le SEUL des trois qu'on peut laisser vide : rien ne le
    //       disait, donc un joueur pressé croyait devoir trouver un surnom pour
    //       partir. Un champ facultatif qui se tait se lit comme obligatoire.
    //    ⚠️ `{de|nom}` plutôt que « de {nom} » : le mode a une porte d'élision,
    //       et une espèce à voyelle initiale donnerait « le nom de Aquali ».
    nomStarter: { fr: "Le nom {de|nom} (facultatif)", en: "{nom}'s name (optional)" },
    pokedex: { fr: "Pokédex", en: "Pokédex" },
    // 🔴 TROIS COMPTEURS « POKÉDEX » SE CONTREDISAIENT SUR LA MÊME PAGE, et
    //    deux QA l'ont relevé séparément : le bandeau disait « 1/139 POKÉDEX »,
    //    le pied de carte « 2/151 · COMPTE », l'accueil « 151 Pokémon à
    //    trouver » et l'écran de départ « 3 sur 75 ». Quatre dénominateurs,
    //    un seul mot. Le pire est celui du BANDEAU : il est présent sur TOUS
    //    les écrans du voyage et il portait le nombre le moins explicable, sans
    //    titre, sans infobulle, sans qualificatif — la phrase qui l'explique
    //    vivant sur un écran qu'on n'ouvre presque jamais.
    //  ✅ Il se sous-titre « CE VOYAGE », exactement comme le pied de carte se
    //     sous-titre « COMPTE ». Le mot ne change pas ; ce qu'il compte devient
    //     lisible, et les deux compteurs cessent de se contredire.
    pokedexVoyage: { fr: "Pokédex · ce voyage", en: "Pokédex · this run" },
    // Le compteur de COMPTE, à côté de celui du voyage. Sans lui, un joueur
    // croirait repartir de zéro à chaque carrière — et c'est faux.
    compte: { fr: "compte", en: "account" },
    argent: { fr: "Argent", en: "Money" },
    aller: { fr: "ALLER", en: "GO" },
    // 🔴 Les refus DISENT pourquoi. Un verrou muet se lit comme un bug.
    manqueCle: { fr: "Il te faut : {quoi}", en: "You need: {quoi}" },
    manqueBadgeCS: { fr: "{quoi} — il te faut {n} {n|badge|badges} pour t'en servir",
                     en: "{quoi} — you need {n} {n|badge|badges} to use it" },
    manqueBadges: { fr: "Il te faut {n} {n|badge|badges} (tu en as {a})",
                    en: "You need {n} {n|badge|badges} (you have {a})" },
    manqueLigue: { fr: "Après la Ligue seulement.", en: "After the League only." },
    dejaFait: { fr: "C'est passé. On n'y revient pas.", en: "That's over. There's no going back." },
    rencontre: { fr: "Les hautes herbes bougent.", en: "The tall grass rustles." },
    rien: { fr: "Rien ne bouge ici.", en: "Nothing stirs here." },
    arene: { fr: "ARÈNE — {nom}", en: "GYM — {nom}" },
    defier: { fr: "DÉFIER {qui}", en: "CHALLENGE {qui}" },
    badgeGagne: { fr: "Badge {b} obtenu !", en: "{b} Badge obtained!" },
    ferme: { fr: "Cette route est fermée.", en: "This route is closed." },
  };
  var TRADUCTIONS = TXT;

  // 🔴 UNE SEULE PORTE POUR TOUT TEXTE D'ÉCRAN. Elle passe par le résolveur
  //    d'accords : le genre du joueur y entre, les jetons y sont remplacés, et
  //    un jeton oublié se signale au lieu de s'afficher tel quel.
  function T(cle, vars) {
    // 🔴 LE GENRE VOYAGE AVEC LA PARTIE, ET LES AUTRES ÉCRANS NE L'ONT PAS.
    //    Le combat, le Pokédex, le classement et les infobulles n'ont pas
    //    `partie` sous la main : ils lisent `POKE_GENRE`. On le tient à jour
    //    ICI, au seul endroit qui connaît la partie — sinon quatre écrans sur
    //    six parleraient au masculin à une joueuse.
    // 🔴 ET HORS PARTIE, C'EST LE COMPTE QUI SAIT. L'accueil, l'écran de duel
    //    et le classement se rendent sans `partie` : ils repliaient tous sur le
    //    masculin. Une joueuse qui revient après six voyages lisait « dresseur »
    //    sur le premier écran du mode — alors que le compte porte son genre.
    //    Encore la même classe : le jeu sait, et il ne dit pas.
    // 🔴 ET ON LE POSE DANS LES DEUX CAS. `W.POKE_GENRE` n'était écrit que
    //    depuis la partie : hors partie il gardait sa valeur d'avant, ou le
    //    masculin par défaut. Or QUATRE écrans le lisent par `PokeGenre.pour` —
    //    le classement, les infobulles, le Pokédex, et les répliques de
    //    scénario. Corriger `T()` sans corriger ce global n'aurait réparé que la
    //    moitié du mode : encore le cas, pas la classe.
    var g = partie && partie.genre ? partie.genre : genreCompte();
    W.POKE_GENRE = g;
    return W.PokeGenre.texte(TXT[cle], LANG(), g, vars, "ui:" + cle);
  }

  // 🔴 LU UNE FOIS, PAS À CHAQUE MOT. `T()` tourne des centaines de fois par
  //    écran ; relire et analyser la sauvegarde à chaque appel se paierait
  //    sur tous les rendus. Le cache se vide quand une partie se clôt.
  var genreLu = null;
  function genreCompte() {
    if (genreLu === null) genreLu = (W.PokeProgression && W.PokeProgression.genre()) || "h";
    return genreLu;
  }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var racine, hasard, partie, journal;
  //  La date de l'essai en cours, ou `null` en carrière libre. Elle dit DANS
  //  QUEL emplacement la partie se garde, et c'est la seule chose qui les
  //  distingue une fois le voyage lancé — `POKE_GRAINE` dit qu'on est au défi,
  //  elle dit DUQUEL. Un essai d'hier ne se reprend pas.
  var defiDate = null;
  // 🔴 L'ÉTAPE DE CRÉATION EN COURS, pour que la lentille RENDE OÙ L'ON EST
  //    (13/08). `partie.starter` ne suffit pas : entre le starter et la carte
  //    vivent la scène du premier pas, le formulaire et le compagnon — et la
  //    lentille, présente sur tous les écrans, sautait par-dessus avec les
  //    défauts de config (nom vide, règle « voyage »). Chaque étape se
  //    déclare ici ; la carte — la fin du flux — solde.
  var reprendreCreation = null;
  // 🔴 ET LA MOISSON AVANT SORTIE. `retenir()` capture les champs AVANT un
  //    redessin déclenché PAR le formulaire (genre, règle) — mais la lentille
  //    quitte l'écran depuis l'EN-TÊTE, hors de sa portée : un nom écrit sans
  //    événement `input` (auto-joueur, autofill) était perdu au retour.
  //    L'écran qui porte des champs pose ici sa moisson ; la lentille la
  //    déclenche avant de remplacer le DOM. Même classe que `retenir()` :
  //    on capture avant de re-rendre, ou on efface ce que le joueur a écrit.
  var moissonAvantSortie = null;

  // ═══════════════════════════════════════════════════════════════════════════
  //  ENTRER EN PARTIE — LA PORTE UNIQUE
  //
  //  🔴 LES INFOBULLES ÉTAIENT MORTES SUR TOUTE PARTIE REPRISE, et deux QA
  //     indépendants l'ont trouvé séparément, avec la même mesure :
  //     `PokeInfobulles.brancher.fait` vaut `true` après « COMMENCER » et
  //     `undefined` après « REPRENDRE LE VOYAGE ». Aucune bulle ne s'ouvrait —
  //     ni au survol, ni au clavier, ni au toucher.
  //     `brancher` n'était appelée qu'à UN endroit, dans `demarrerPartie`. Le
  //     chemin de reprise posait `partie` et allait droit à `carte()`.
  //
  //  🔴 ET TOUT RECHARGEMENT DE PAGE FORCE UNE REPRISE. C'est donc la couche
  //     entière qui explique le jeu — les types, les objets, ce que vaut « 40 »,
  //     comment on fait monter un « prise 1 % » devant un légendaire qui
  //     n'accorde qu'un seul essai — qui disparaissait dès qu'on fermait
  //     l'onglet. Contenu écrit, complet, et jamais montré : la classe n°1.
  //
  //  ✅ ON NE CORRIGE PAS LE CHEMIN, ON SUPPRIME LE CHOIX. Les deux entrées
  //     passent ici, et `tools/poke-infobulles.mjs` refuse désormais toute
  //     affectation de `partie` qui ne passe pas par cette porte. Un troisième
  //     chemin d'entrée — un duel, un défi — ne pourra plus oublier.
  //  ⚠️ `brancher` est idempotente (`brancher.fait`) et remet `partieCourante`
  //     à chaque appel : la rappeler ne double aucun écouteur, et c'est ce qui
  //     permet d'en faire une porte plutôt qu'une étape à ne pas rater.
  // ═══════════════════════════════════════════════════════════════════════════
  function prendreLaPartie(p) {
    partie = p;
    // 🔴 LE JEU DE RÈGLES SE POSE ICI, ET NULLE PART AILLEURS. C'est la seule
    //    porte par laquelle une partie entre — démarrage, reprise, duel, défi —
    //    et un détecteur de la batterie l'impose déjà. Poser les règles ailleurs
    //    laisserait un chemin d'entrée capable de jouer sous la mauvaise table.
    //    ⚠️ Une partie d'avant le 19/08 n'a pas de champ : `de()` rend gen1.
    if (W.PokeRegles) W.PokeRegles.poser(p);
    if (W.PokeInfobulles) W.PokeInfobulles.brancher(partie);
    armerRetour();
    armerBarre();
    armerClics();
    return partie;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE BOUTON PRÉCÉDENT — IL SORTAIT DU MODE
  //
  //  🔴 SIGNALÉ LE 16/08 : « le bouton précédent renvoie sur la page d'accueil
  //     de Road to Legends ». Le mode entier vit dans une seule page : la
  //     flèche du navigateur — et surtout le GESTE de retour au pouce, le plus
  //     facile à déclencher par accident — ne dépilait pas un écran, elle
  //     quittait le jeu. Aucun `<a>` dans `pokemon.html` : c'était bien
  //     l'historique.
  //  🔴 ET LE COMBAT N'EST PAS SAUVEGARDÉ. `voyageEcrire` ne garde qu'à la
  //     CARTE, exprès. Un geste de travers en plein combat le perdait.
  //
  //  Le canon du site est déjà écrit dans `js/game.js` : « la flèche précédent
  //  = le bouton Retour ». On l'applique ici :
  //    · dans un écran de voyage (boutique, sac, centre, Pokédex…) → la CARTE ;
  //    · en combat → on DEMANDE, dans le pupitre du combat (`menuQuitter`) ;
  //    · depuis la carte elle-même → on laisse partir.
  //
  //  ⚠️ CE DERNIER POINT N'EST PAS UN DÉTAIL, C'EST CE QUI EMPÊCHE LE PIÈGE.
  //     Ré-empiler à chaque retour ferait une page dont on ne sort plus jamais
  //     — la faute exacte que `game.js` documente (« on ne peut pas effacer des
  //     entrées d'historique »). La carte est l'accueil du voyage : on n'y
  //     ré-empile pas, le geste suivant sort pour de bon.
  //  ⚠️ ON N'ARME RIEN HORS VOYAGE. `accueil()` remet `partie` à null — comme le
  //     duel, le défi et le classement — et le garde se tait : sur ces écrans,
  //     le retour doit sortir du mode, c'est ce que le joueur demande.
  // ═══════════════════════════════════════════════════════════════════════════
  var retourArme = false;
  var ecranCombat = null;
  function empilerRetour() {
    try { W.history.pushState({ poke: 1 }, ""); } catch (e) { /* historique fermé */ }
  }
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA BARRE DE LA CARTE S'EFFACE QUAND ON DESCEND   [20/08/2026]
  //
  //  🔴 SIGNALÉ SUR X PAR @JawaxxB, deux heures après l'ouverture : « sur mobile
  //     le menu prend bcp de place à l'écran c'est un peu dommage ». Mesuré, et
  //     il a raison : la rangée de quatre portes est COLLÉE en bas, 108 px, et
  //     la carte d'un acte défile sur trois mille. Sur un iPhone SE — 667 px —
  //     ça fait **16 % de l'écran occupés en permanence** par quatre boutons
  //     qu'on ne presse pas en lisant.
  //
  //  🔑 ON NE LA RÉTRÉCIT PAS, ON LA RANGE. La rangée de quatre est le fruit
  //     d'une passe de finition du matin même : icône, mot, compte — la tasser
  //     davantage rendrait la cible tactile mauvaise et le compte illisible.
  //     Ce qu'il faut, ce n'est pas une barre plus petite, c'est l'écran quand
  //     on lit. Elle part vers le bas dès qu'on descend, revient au premier
  //     geste vers le haut, et se repose d'elle-même en bas de page.
  //
  //  ⚠️ UN SEUL ÉCOUTEUR, POSÉ UNE FOIS. La carte se redessine à chaque nœud ;
  //     accrocher le défilement à la barre elle-même en poserait un de plus à
  //     chaque rendu, et ils se contrediraient. On pose une classe sur la
  //     racine, la feuille fait le reste.
  //  ⚠️ ET UN SEUIL, PAS UN PIXEL. Sans lui, le moindre tremblement du doigt
  //     ferait clignoter la barre — c'est le défaut classique de ce motif.
  // ═══════════════════════════════════════════════════════════════════════════
  var barreArmee = false, barreDernier = 0;
  //  🔴 ET LE RENDU NE SUFFIT PAS À LUI SEUL. Remettre la barre au moment du
  //     rendu ne servait à rien : le recentrage sur le nœud courant arrive
  //     APRÈS, et rangeait la barre dans la foulée. Il faut donc un temps mort
  //     — pendant lequel on suit le défilement sans rien en conclure, pour que
  //     le premier vrai geste se mesure depuis la position posée, et pas
  //     depuis le haut de la page.
  var barreCalme = 0;
  var BARRE_CALME_MS = 900;
  function montrerBarre() {
    if (racine) racine.classList.remove("est-barre-rangee");
    barreDernier = (W.scrollY || W.pageYOffset || 0);
    barreCalme = Date.now() + BARRE_CALME_MS;
  }
  //  🔑 ON NOTE TOUS LES CLICS, PAS SEULEMENT LES CHOIX. Le clic fautif est le
  //     SECOND ; le premier est presque toujours un « SUITE » ou un
  //     « CONTINUER », qui ne passent pas par `surClic`. Ne relever que les
  //     choix aurait laissé la garde aveugle au geste qui la déclenche.
  //  ⚠️ En phase de CAPTURE, et sur le document : un gestionnaire posé sur la
  //     racine manquerait les clics que le jeu arrête avant de remonter.
  var clicArme = false;
  function armerClics() {
    if (clicArme || !D.addEventListener) return;
    clicArme = true;
    D.addEventListener("click", function (e) {
      //  On note APRÈS coup, pour que la garde compare au clic PRÉCÉDENT.
      W.setTimeout(function () { dernierClic = { x: e.clientX, y: e.clientY }; }, 0);
    }, true);
  }

  function armerBarre() {
    if (barreArmee || !W.addEventListener) return;
    barreArmee = true;
    var SEUIL = 24;        // en deçà, c'est un tremblement, pas une intention
    var DEPART = 140;      // on ne range rien tant qu'on est en haut de page
    W.addEventListener("scroll", function () {
      if (!racine) return;
      var y = W.scrollY || W.pageYOffset || 0;
      //  Le temps mort d'après rendu : on note où l'on est, on ne juge pas.
      if (Date.now() < barreCalme) { barreDernier = y; return; }
      var bas = (D.documentElement.scrollHeight - y - W.innerHeight) < 80;
      var ecart = y - barreDernier;
      if (Math.abs(ecart) < SEUIL) return;
      barreDernier = y;
      //  En haut, et tout en bas, la barre est là : ce sont les deux moments
      //  où l'on cherche une porte plutôt qu'un nœud.
      if (y < DEPART || bas || ecart < 0) racine.classList.remove("est-barre-rangee");
      else racine.classList.add("est-barre-rangee");
    }, { passive: true });
  }

  function armerRetour() {
    if (retourArme || !W.history || !W.history.pushState) return;
    retourArme = true;
    empilerRetour();
    W.addEventListener("popstate", function () {
      // Hors voyage — accueil, duel, défi, classement — le retour sort.
      // ⚠️ ET PENDANT LA CRÉATION AUSSI. Entre le starter et la carte vivent le
      //    formulaire et le compagnon (`reprendreCreation`) : y répondre par
      //    `carte()` sauterait par-dessus des étapes et poserait un voyage sans
      //    nom. Rien n'est encore sauvegardé — on laisse partir.
      if (!partie || !partie.starter || reprendreCreation) return;
      if (ecranCombat && racine.querySelector(".pkdx-combat")) {
        // Pendant une animation le pupitre ne nous appartient pas : on ravale
        // le geste plutôt que d'afficher un menu qui sera effacé.
        empilerRetour();
        ecranCombat.menuQuitter(quitterLeMode);
        return;
      }
      // Depuis la carte, on ne retient pas — et on CONTINUE de sortir : les
      // entrées qu'on a empilées en chemin sont à nous, les dépiler une à une
      // ne montrerait rien au joueur qui, lui, veut partir. Le dépilage s'arrête
      // tout seul en quittant le document.
      if (racine.querySelector(".pkdx-carte-actes")) { W.history.back(); return; }
      empilerRetour();
      carte();
    });
  }
  // Sortir pour de bon. On NAVIGUE au lieu de dépiler : le nombre d'entrées
  // empilées n'est pas connu, et un `go(-n)` faux d'une unité laisserait le
  // joueur dans la page qu'il vient de demander à quitter.
  function quitterLeMode() { W.location.href = "index.html"; }

  // ── L'en-tête ──────────────────────────────────────────────────────────────
  //  🔴 REFONTE DU 07/08/2026. L'ancienne coque ENCADRAIT chaque écran : une
  //     boîte rouge de 560 px qui bridait tout le contenu et laissait 500 px de
  //     vide en dessous sur un écran d'ordinateur. Le Pokédex reste l'emblème
  //     du mode — la lentille, les trois diodes, le rouge — mais il tient
  //     maintenant dans la barre du haut au lieu de tenir le jeu en otage.
  //
  //  🔴 ET IL PORTE L'ÉTAT. Les badges étaient une ligne de texte « Badges 0/8 »
  //     noyée dans un bandeau gris. Un badge est l'acquis le plus fort du
  //     voyage : il se voit d'un coup d'œil, ou il ne sert à rien.
  function enTete() {
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 REFONTE DU BANDEAU — « pas une UI/UX digne de 2026, et moche ».
    //     Le bandeau imitait un APPAREIL : un gros aplat rouge bombé, une
    //     lentille de verre, trois diodes. Trois problèmes, tous relevés à
    //     l'œil par le propriétaire :
    //       · les trois pastilles égales lisaient « fenêtre macOS » ;
    //       · la lentille ressemblait à un bouton et ne cliquait pas ;
    //       · l'ensemble pesait comme un objet là où il doit porter une INFO.
    //
    //  ✅ LA LENTILLE DEVIENT CE QU'ELLE PRÉTENDAIT ÊTRE : le bouton du
    //     Pokédex. Le propriétaire a essayé de cliquer dessus — c'est le seul
    //     test d'affordance qui compte. *Un élément qui a l'air d'un bouton
    //     doit en être un, ou cesser d'y ressembler.*
    //  ✅ LES DIODES DISPARAISSENT. Elles n'ont jamais rien dit : ni état, ni
    //     mesure, ni chemin. Du décor d'appareil sur une interface.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LE ROND BLEU NE DISAIT PAS « POKÉDEX » — le propriétaire l'a nommé
    //    « le rond moche » et a demandé une icône. La lentille seule était un
    //    vestige d'appareil ; l'icône du Pokédex, elle, se lit — et c'est la
    //    même que sur les boutons POKÉDEX du reste du jeu : un seul dessin
    //    pour un seul sens.
    // ═══════════════════════════════════════════════════════════════════════
    //  LA LENTILLE NE S'OUVRE QUE LÀ OÙ SORTIR NE COÛTE RIEN (17/08)
    //
    //  🔴 SIGNALÉ PAR SONDAY12 : « quand tu commences un event combat ou autre
    //     et que tu vas dans le pokédex, ça passe au suivant ». Reproduit en
    //     lisant le code : ce bouton vit dans l'en-tête, donc sur TOUS les
    //     écrans, et son retour vaut `carte()` quel que soit l'écran quitté.
    //     Or `choisirNoeud` CONSOMME le nœud avant d'afficher la scène. Ouvrir
    //     le Pokédex pendant un événement rendait donc la main sur une carte
    //     où le nœud n'existait plus : l'événement était perdu, sans un mot.
    //     Pendant un COMBAT, c'était pire — on abandonnait le combat.
    //  🔑 LE DÉFAUT N'EST PAS LE RETOUR, C'EST LA PORTE. Un bouton posé sur
    //     tous les écrans doit pouvoir revenir à tous les écrans ; ce mode n'a
    //     pas de notion d'écran courant, et en inventer une pour un bouton de
    //     consultation coûterait plus cher que le service rendu.
    //  ✅ La lentille ne paraît donc que là où quitter ne perd rien : l'accueil
    //     et la carte. Le Pokédex reste atteignable des deux, par cette
    //     lentille et par le bouton POKÉDEX de la carte — on ne retire aucun
    //     chemin, on retire les chemins qui coûtaient un événement.
    //  ⚠️ LES ÉCRANS DE CRÉATION LA GARDENT, et ce n'est pas une exception :
    //     ils ont, EUX, une voie de retour juste (`reprendreCreation`, posée par
    //     la création, le choix du starter, les premiers pas et le compagnon).
    //     C'est d'ailleurs là que le Pokédex sert le plus — on choisit son
    //     premier Pokémon. Le défaut n'a jamais été « le Pokédex s'ouvre trop »,
    //     c'est « il rend la main au mauvais endroit » ; on ne ferme donc que
    //     les écrans dont le retour est faux.
    //  ⚠️ `sortieLibre` est posé par `coque()`, donc il vaut FAUX par défaut :
    //     un écran neuf n'ouvrira pas la porte sans l'avoir demandée. C'est le
    //     sens sûr — l'oubli ferme au lieu d'ouvrir.
    // ═══════════════════════════════════════════════════════════════════════
    var gauche = sortieLibre
      ? '<button type="button" class="pkdx-oeil" id="pk-lentille"' +
          ' title="' + T("cPokedex") + '" aria-label="' + T("cPokedex") + '">' +
          W.PokeIcones.svg("pokedex", { taille: 22 }) +
        "</button>"
      : '<span class="pkdx-oeil est-muet" aria-hidden="true">' +
          W.PokeIcones.svg("pokedex", { taille: 22 }) +
        "</span>";

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 HORS VOYAGE, LE RELEVÉ NE PORTE QUE LE RÉGLAGE DU SON — et le bandeau
    //    doit le savoir. Sur téléphone, un relevé plein passe à la ligne ;
    //    celui-ci n'a rien à mettre à la ligne, et il y allait quand même :
    //    116 px de bandeau rouge pour un curseur seul, collé à gauche, sur
    //    l'accueil, le carnet, le duel et le classement.
    // 🔴 LA GARDE EST POSÉE ICI, PAS DANS LA FEUILLE. J'ai d'abord tenté de la
    //    déduire en CSS — « un relevé sans compteur, c'est un relevé sans
    //    `<b>` » — avec `.pkdx-hud:has(> .pkdx-hud-releve:not(:has(b)))`.
    //    ⚠️ `:has()` NE S'IMBRIQUE PAS : le sélecteur est invalide, le
    //       navigateur jette la règle ENTIÈRE en silence, et le défaut est
    //       revenu en pire. Mesuré : 73 px devenus 125.
    //    L'écran SAIT s'il a des compteurs — il vient de décider de n'en poser
    //    aucun. Il le dit donc, en un mot, et la feuille n'a plus rien à
    //    deviner.
    // ═══════════════════════════════════════════════════════════════════════
    if (!partie) {
      return '<header class="pkdx-hud est-nu">' + gauche +
        // 🔴 SAUF QUAND ON DEMANDE JUSTEMENT LEQUEL. Le bandeau annonçait
        //    « KANTO — PREMIÈRE GÉNÉRATION » au-dessus de « Où pars-tu ? » :
        //    deux lignes du même écran qui se contredisent, et la plus haute
        //    répond à la question que la plus basse pose.
        '<span class="pkdx-hud-nom">' + T("titre") +
          (mondeEnAttente ? "" :
            '<span class="pkdx-hud-dit">' + T(surMonde()) + "</span>") + "</span>" +
        boutonSon() +
      "</header>";
    }

    var d = P().comptePokedex(partie);
    var badges = "";
    for (var i = 1; i <= 8; i++) {
      // 🔴 AUCUN BADGE NE S'EST JAMAIS ALLUMÉ. `partie.badges` contient des
      //    OBJETS — `{ordre, badge, champion, acte}` — et cette ligne cherchait
      //    un NOMBRE avec `indexOf(i)`. La comparaison échouait toujours, donc
      //    les huit pastilles restaient éteintes du début à la fin d'un voyage.
      //    Un joueur pouvait battre quatre Champions et voir un bandeau vide :
      //    l'indicateur de progression le plus visible du mode, mort depuis sa
      //    naissance. Trouvé par le joueur dirigé, en lisant « ACTE 4 SUR 9 »
      //    au-dessus de zéro badge — deux affirmations du même bandeau qui se
      //    contredisaient. Personne ne l'avait vu parce que personne n'avait
      //    jamais gagné une arène en regardant l'écran.
      badges += "<i" + (aLeBadge(i) ? ' class="est-pris"' : "") + "></i>";
    }
    // 🔴 RIEN NE DISAIT AU JOUEUR QU'IL JOUAIT LE DÉFI DU JOUR. Il l'a lancé
    //    depuis un écran qui l'annonce, puis la partie ressemble à toutes les
    //    autres — alors que celle-ci ne se rejoue pas et que chaque nœud choisi
    //    est définitif au regard du classement. La contrainte la plus forte du
    //    mode était invisible dès le deuxième écran.
    return '<header class="pkdx-hud"' + (partie.compare ? ' data-defi="oui"' : "") + ">" + gauche +
      '<span class="pkdx-hud-nom">' + esc(partie.nom || T("titre")) +
        '<span class="pkdx-hud-dit">' +
          (partie.compare ? '<b class="pkdx-hud-defi">' + T("defi") + "</b> " : "") +
          // 🔴 LE SCEAU SE VOIT PENDANT QU'ON JOUE, pas seulement à l'écran de
          //    départ. C'est lui qui explique pourquoi le Champion a cinq
          //    niveaux de plus et pourquoi le butin n'offre que deux cartes :
          //    sans ce mot dans le bandeau, un joueur qui reprend une partie
          //    croit à un déséquilibre. Ce que le jeu sait, il le dit.
          (partie.sceau ? '<b class="pkdx-hud-sceau">' + T("sceauCourt", { n: partie.sceau }) + "</b> " : "") +
          // 🔴 MÊME RAISON POUR LA RÈGLE DU JOUR. Elle est annoncée une fois,
          //    sur l'écran de départ — puis on joue une heure sans savoir
          //    POURQUOI l'argent rentre plus vite ou pourquoi le soin est
          //    refusé. Une règle qu'on subit sans la voir agir ne se retient
          //    pas, et le joueur croit à un défaut du jeu.
          (function () {
            var r = W.PokeRegleDuJour ? W.PokeRegleDuJour.de(partie.regleDuJour) : null;
            if (!r) return "";
            return '<b class="pkdx-hud-regle" data-info="regleDuJour" data-info-val="' +
              esc(r.id) + '" tabindex="0">' + esc(r.nom[LANG()]) + "</b> ";
          })() +
          T("acte", { n: partie.acte, t: W.PokeActes.nombre() }) + "</span></span>" +
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 LE BLOC DU SON VIVAIT DANS LE RELEVÉ, ET C'EST LUI QUI COÛTAIT UNE
      //     TROISIÈME LIGNE. Mesuré le 09/08 à 390 px : le bandeau faisait
      //     **166 px de haut contre 68 sur bureau**, et son relevé se repliait
      //     en trois lignes toutes à moitié vides — les compteurs (117 px), les
      //     badges (171 px), le bloc du son (112 px), chacun seul sur la sienne.
      //     Ce bandeau est sur TOUS les écrans du mode : vingt-cinq pour cent de
      //     la hauteur d'un petit téléphone, en permanence, pour de l'air.
      //
      //     Le son n'est pas un relevé — il ne dit rien de la partie. Il remonte
      //     donc dans la rangée du haut, avec l'appareil et le nom, et le relevé
      //     retrouve ce qu'il est : les badges et les deux compteurs.
      //  ⚠️ Rien n'est retiré, ni le curseur ni la coupure : c'est un
      //     déplacement, pas une amputation.
      // ═══════════════════════════════════════════════════════════════════════
      boutonSon() +
      '<span class="pkdx-hud-releve">' +
        '<span class="pkdx-badges" title="' + T("badges") + '">' + badges + "</span>" +
        '<span title="' + esc(T("pokedexVoyage")) + '"><b>' +
          d.pris + "/" + P().atteignables(partie.version) + "</b>" +
          "<span>" + T("pokedexVoyage") + "</span></span>" +
        // 🔴 `argent()`, PAS UNE CONCATÉNATION. Le bandeau écrivait « 3000 ₽ »
        //    pendant qu'un nœud de dresseur, juste dessous, écrivait « 1 050 ₽ ».
        "<span><b>" + argent(partie.argent) + "</b><span>" + T("argent") + "</span></span>" +
      "</span>" +
    "</header>";
  }

  // ── LE BOUTON DU SON ───────────────────────────────────────────────────────
  //  🔴 UN JEU QUI SONNE SANS QU'ON PUISSE LE TAIRE EST UN JEU QU'ON FERME.
  //     Beaucoup jouent au bureau ou à côté de quelqu'un qui dort. Le bouton
  //     vit dans l'en-tête, donc sur TOUS les écrans — le chercher dans un menu
  //     au moment où le son gêne, c'est déjà trop tard.
  //  Il porte son état dans `aria-pressed` : la même information pour l'œil et
  //  pour un lecteur d'écran, sans texte en double.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA VITESSE DU COMBAT — ET POURQUOI ELLE MANQUAIT
  //
  //  🔴 `POKE_RYTHME` ÉTAIT LU À DEUX ENDROITS ET ÉCRIT NULLE PART. C'était un
  //     crochet d'essai, jamais un réglage : le combat tournait à 900 ms par
  //     événement pour tout le monde, sans moyen d'y toucher.
  //     Relevé en JOUANT une partie — un mode qu'on rejoue des dizaines de fois
  //     et dont chaque échange dure une seconde use la patience avant le talent.
  //
  //  ⚠️ TROIS CRANS, PAS UN CURSEUR : « posé », « vif », « pressé » se
  //     choisissent d'un doigt ; un curseur demande de viser, et il n'y a rien
  //     à doser entre deux valeurs qu'on ne distingue pas.
  //  ⚠️ ON NE DESCEND PAS SOUS 200 ms. En dessous, `ui-combat` coupe les sons et
  //     les animations — c'est le régime de l'auto-joueur, pas d'un humain.
  //     Un « pressé » muet ressemblerait à un jeu cassé.
  //  ⚠️ AUCUN EFFET SUR LE HASARD : c'est du rythme d'affichage, pas de la
  //     règle. `poke-rng` le confirme, et il doit rester vrai.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES TROIS CRANS SONT LINÉAIRES — mesuré le 11/08 par `poke-cadence-dom.js`
  //
  //  Un tour de combat à trois attentes, ce que le jeu DEMANDE :
  //      Normale      900 ms · attente d'animation 1 305 ms · tour 3 105 ms
  //      Rapide       520 ms · attente d'animation   754 ms · tour 1 794 ms
  //      Très rapide  260 ms · attente d'animation   377 ms · tour   897 ms
  //  Soit 1,00 / 0,58 / 0,29 — exactement le rapport de 900 / 520 / 260. Le
  //  troisième cran divise le tour par 3,5. L'animation suit bien le rythme
  //  (`vitesse = rythme / 900`), et le palier `vitesse < 0.2` reste réservé à
  //  l'auto-joueur : à 260 ms on est à 0,29, donc on dessine encore.
  //
  //  🔴 CE BLOC A AFFIRMÉ LE CONTRAIRE PENDANT UNE SOIRÉE : « Normale 4,0 s ·
  //     Rapide 3,0 s · Très rapide 3,0 s — trois crans, deux effets », et une
  //     enquête entière sur un « plancher de trois secondes » introuvable. Tout
  //     était un ARTEFACT : mon onglet était bridé, Chrome y ramène chaque
  //     `setTimeout` au top de seconde suivant, et un tour compte trois
  //     attentes. **Trois attentes × une seconde = trois secondes, quel que
  //     soit le réglage.** Le plancher que je cherchais dans le jeu était le
  //     pas de l'horloge du navigateur.
  //  🔴 J'AVAIS MÊME TIRÉ UN RÉGLAGE DE CETTE MESURE — un cran à 160 ms, pour
  //     passer sous le palier. Il ne pouvait rien changer, et la mesure qui le
  //     « réfutait » ne mesurait rien non plus. Annulé.
  //  🔑 LA SIGNATURE D'UN MINUTEUR BRIDÉ N'EST PAS UN RAPPORT, C'EST UNE
  //     QUANTIFICATION : 900 ms qui en coûtent 1 006, 1 305 qui en coûtent
  //     1 987. Un simple « réel / demandé » donne 1,5 et paraît anodin ; ce qui
  //     accuse, c'est que TOUT atterrit sur une seconde pleine. La sonde le
  //     cherche là, et refuse de rendre un chiffre de mur d'horloge sinon.
  //  ⚠️ AUCUN EFFET SUR LE HASARD ni sur le rejeu : c'est du rythme d'affichage.
  // ═══════════════════════════════════════════════════════════════════════════
  var RYTHMES = [900, 520, 260];
  function rythmeChoisi() {
    var n = 0;
    try { n = +(W.localStorage.getItem("poke_rythme") || 0); } catch (e) { n = 0; }
    return RYTHMES[n] ? n : 0;
  }
  function rythmeActuel() { return RYTHMES[rythmeChoisi()]; }
  var LANG_CLE = "palmares_lang";
  function langueChoisie() {
    try {
      var m = W.localStorage.getItem(LANG_CLE);
      if (m === "fr" || m === "en") return m;
    } catch (e) { /* stockage refusé : on suit le navigateur */ }
    var n = (W.navigator && W.navigator.language) || "fr";
    return n.slice(0, 2).toLowerCase() === "fr" ? "fr" : "en";
  }
  function poserLangue(l) {
    W.POKE_LANG = l === "en" ? "en" : "fr";
    try { W.localStorage.setItem(LANG_CLE, W.POKE_LANG); } catch (e) {}
    return W.POKE_LANG;
  }
  // Le réglage de langue vit sur l'ACCUEIL, nommé, à côté de la vitesse — et
  // pour la raison déjà écrite pour elle : *un réglage se règle une fois ; il
  // n'a pas sa place à côté de l'état du voyage.* Un drapeau seul ne se lit
  // pas davantage qu'une icône seule : le mot est écrit.
  function boutonLangue() {
    var l = LANG();
    return '<button type="button" class="pkdx-rythme" id="pk-langue"' +
      ' title="' + T("langueQuoi") + '" aria-label="' + T("langueQuoi") + " : " +
      T(l === "en" ? "langueEn" : "langueFr") + '">' +
      '<span class="pkdx-rythme-mot">' + T(l === "en" ? "langueEn" : "langueFr") + "</span></button>";
  }

  function boutonRythme() {
    var i = rythmeChoisi();
    var mot = ["rythmePose", "rythmeVif", "rythmePresse"][i];
    // 🔴 LE PROPRIÉTAIRE A DEMANDÉ « À QUOI SERT CETTE ICÔNE ». C'est le
    //    verdict le plus net qu'un écran puisse recevoir : un double chevron
    //    avec un « 2 » collé dessous ne dit ni ce qu'il règle, ni où l'on en
    //    est. Le chiffre était un état sans nom.
    // ✅ LE NOMBRE DE CHEVRONS EST L'ÉTAT. Un chevron pour « posé », deux pour
    //    « vif », trois pour « pressé » : c'est l'idiome de l'avance rapide,
    //    qu'on lit sans l'apprendre, et il n'y a plus rien à décoder à côté.
    //    *Un état affiché par un chiffre demande une légende ; un état affiché
    //    par sa propre forme n'en demande aucune.*
    // ═══════════════════════════════════════════════════════════════════
    //  🔴 LE PROPRIÉTAIRE A DEMANDÉ DEUX FOIS À QUOI SERT CE BOUTON. La
    //     première fois j'ai remplacé un chiffre par des chevrons ; il a
    //     redemandé. Un pictogramme qui échoue deux fois n'est pas à
    //     redessiner, il est à REMPLACER PAR DES MOTS.
    //  🔴 ET LA CAUSE EST LA MÊME QUE POUR LES ATTAQUES : le seul endroit qui
    //     disait le sens était l'INFOBULLE, et sur téléphone l'appui qui
    //     l'ouvre ACTIONNE aussi le bouton. *On ne pouvait pas le lire sans
    //     le changer.* Un réglage dont l'état ne se lit qu'en le modifiant
    //     n'est pas un réglage, c'est une devinette.
    //  ⚠️ Le mot dit la VITESSE, pas une allure poétique : « posé / vif /
    //     pressé » décrivait un ton, pas une fonction.
    //     🔴 ET LA RAISON DONNÉE ICI ÉTAIT FAUSSE : « ×1 / ×2 / ×3 mentirait,
    //        le gain mesuré est de 16 % ». Ces 16 % venaient de la mesure
    //        rétractée. Le gain réel est de **×3,5** entre « Normale » et
    //        « Très rapide » — les trois crans sont linéaires. On garde les
    //        mots plutôt que les multiplicateurs parce qu'ils se lisent sans
    //        être appris, pas parce que le gain serait maigre.
    // ═══════════════════════════════════════════════════════════════════
    // 🔴 IL N'EMPRUNTE PLUS LA CLASSE DU BOUTON DE SON. `.pkdx-son` est un rond
    //    de 44 px dont le fond est un `::before` de 30 px : y coller un mot le
    //    faisait sortir du cercle, sans fond derrière — vu à l'écran par le
    //    propriétaire. *Une classe porte une FORME, pas seulement un style :
    //    l'emprunter pour un contenu qu'elle n'a pas prévu la casse.*
    return '<button type="button" class="pkdx-rythme" id="pk-rythme"' +
      ' title="' + T("rythmeQuoi") + '" aria-label="' + T("rythmeQuoi") + " : " + T(mot) + '">' +
      traceRythme(i) + '<span class="pkdx-rythme-mot">' + T(mot) + "</span></button>";
  }

  // 🔴 TROIS APPELS LITTÉRAUX, PAS UNE CONCATÉNATION. `svg("rythme" + (i+1))`
  //    marchait — et échappait au contrôle des pictogrammes, qui lit des noms
  //    LITTÉRAUX. C'est exactement ainsi que `badge` est resté non dessiné
  //    pendant des mois : cité par une variable, invisible au contrôle, et la
  //    carte s'affichait creuse sans une erreur.
  //    *Un nom construit à l'exécution est un nom que personne ne vérifie.*
  function traceRythme(i) {
    if (i === 0) return W.PokeIcones.svg("rythme1", { taille: 18 });
    if (i === 1) return W.PokeIcones.svg("rythme2", { taille: 18 });
    return W.PokeIcones.svg("rythme3", { taille: 18 });
  }

  function boutonSon() {
    if (!W.PokeSon) return "";
    var coupe = W.PokeSon.muet();
    // 🔴 LE RÉGLAGE DE VITESSE A QUITTÉ LE BANDEAU. Il y a échoué deux fois —
    //    « à quoi sert cette icône ? », posé deux fois par le propriétaire — et
    //    la troisième tentative, avec le MOT écrit, faisait déborder le bandeau
    //    de 18 px à 390. Le bandeau ne peut pas porter un libellé, et une icône
    //    seule ne se lit pas : il fallait changer de place, pas de dessin.
    //    *Un réglage se règle une fois ; il n'a pas sa place à côté de l'état du
    //    voyage, qui se lit à chaque écran.* Il vit sur l'accueil, nommé.
    //
    // 🔴 ET CE COMMENTAIRE ÉTAIT ENTRE `return` ET SA VALEUR. JavaScript insère
    //    alors un point-virgule : la fonction rendait `undefined`, et le mot
    //    s'affichait EN TOUTES LETTRES sur le bandeau rouge. Aucune erreur,
    //    aucun détecteur — `node --check` passe, la syntaxe est légale.
    //    *Un commentaire placé après `return` n'est pas un commentaire, c'est
    //    une instruction de retour vide.*
    return '<span class="pkdx-son-bloc">' +
      '<button type="button" class="pkdx-son" id="pk-son" aria-pressed="' + (coupe ? "false" : "true") +
        '" title="' + T(coupe ? "sonCoupe" : "sonActif") + '" aria-label="' + T(coupe ? "sonCoupe" : "sonActif") + '">' +
        W.PokeIcones.svg(coupe ? "sonCoupe" : "son", { taille: 18 }) + "</button>" +
      // 🔴 COUPER OU NON N'EST PAS UN RÉGLAGE DE VOLUME. J'avais porté toute la
      //    puce sonore et laissé au joueur un seul choix : tout ou rien. Or on
      //    joue souvent à côté de quelqu'un — baisser vaut mieux que couper,
      //    et `PokeSon.volume` existait, exportée, jamais appelée.
      //    Le curseur vit à côté du bouton, pas dans un menu : un réglage
      //    qu'on cherche est un réglage qu'on n'emploie pas.
      '<input type="range" class="pkdx-volume" id="pk-volume" min="0" max="100" step="5"' +
        ' value="' + Math.round(W.PokeSon.volume() * 100) + '"' +
        ' aria-label="' + T("volume") + '" title="' + T("volume") + '">' +
    "</span>";
  }

  // Un seul endroit branche le bouton : il est rendu par l'en-tête, donc par
  // tous les écrans, et un écouteur posé écran par écran finirait par manquer.
  function brancherSon() {
    var v = racine.querySelector("#pk-volume");
    if (v) {
      v.addEventListener("input", function () { W.PokeSon.volume(+v.value / 100); });
      // 🔴 LE TÉMOIN SONORE A ÉTÉ RETIRÉ le 08/08 : « quand on règle le son,
      //    c'est affreux ». Mon intention était bonne — entendre ce qu'on règle
      //    — mais un bip de menu à chaque relâchement du curseur, sur l'élément
      //    qu'on manipule justement parce que le son dérange, produit
      //    exactement ce qu'on cherchait à éviter.
      //    ⚠️ On ne le remplace par rien. Le joueur entend déjà le jeu ; le
      //       curseur n'a pas besoin de sa propre voix.
    }
    // La lentille ouvre le Pokédex — depuis l'accueil et la carte seulement.
    // ⚠️ Le `if (lent)` n'est pas une précaution de style : depuis le 17/08 le
    //    bouton n'est PAS rendu sur les autres écrans (voir `enTete`), et c'est
    //    lui qui rend ce branchement inoffensif.
    var lent = racine.querySelector("#pk-lentille");
    if (lent) {
      lent.addEventListener("click", function () {
        son("PRESS_AB");
        // ⚠️ On revient d'où l'on vient : la carte si un voyage est en cours,
        //    l'accueil sinon. Un Pokédex qui rend toujours à l'accueil ferait
        //    perdre la partie ouverte — et c'est ce qui arrive quand on copie
        //    l'appel de l'accueil sans regarder son troisième argument.
        // 🔴 « EN COURS » VEUT DIRE : STARTER CHOISI (13/08). `partie` existe
        //    dès `demarrerPartie`, AVANT le choix du starter — et la lentille
        //    vit sur tous les écrans, celui-là compris. Son retour sautait
        //    donc par-dessus le starter : carte générée sur une équipe VIDE
        //    (le filtre solo de la rangée 0 saute), combat ouvert sans un
        //    Pokémon debout, page morte. Pile capturée à la sonde, rejouée
        //    en trois clics sur le défi du jour.
        // 🔴 ET ENTRE LE STARTER ET LA CARTE, ON REND À L'ÉTAPE EN COURS
        //    (`reprendreCreation`) — sinon la lentille sautait le formulaire
        //    et le compagnon avec les défauts de config.
        // La moisson d'abord : le DOM du formulaire meurt à la ligne `hote()`.
        if (moissonAvantSortie) { try { moissonAvantSortie(); } catch (err) {} }
        var retour = !partie ? accueil
          : reprendreCreation ? reprendreCreation
          : partie.starter ? function () { return carte(); }
          : choixStarter;
        W.PokePokedex.ouvrir(hote("pk-dex-hote"), partie || { pris: {}, vus: {} }, retour);
      });
    }
    var b = racine.querySelector("#pk-son");
    if (!b) return;
    b.addEventListener("click", function () {
      var coupe = W.PokeSon.muet(!W.PokeSon.muet());
      // 🔴 AUCUN SON SUR LES BOUTONS DE RÉGLAGE. Il y en avait un « pour
      //    qu'on entende qu'on vient de rallumer » — l'intention était bonne,
      //    l'effet est qu'un bouton de CHROME se met à jouer un bruit de jeu.
      //    Ces deux boutons servent à se taire et à aller plus vite : les
      //    faire sonner contredit ce qu'on vient de leur demander.
      b.setAttribute("aria-pressed", coupe ? "false" : "true");
      b.setAttribute("title", T(coupe ? "sonCoupe" : "sonActif"));
      b.setAttribute("aria-label", T(coupe ? "sonCoupe" : "sonActif"));
      b.innerHTML = W.PokeIcones.svg(coupe ? "sonCoupe" : "son", { taille: 18 });
    });
    // 🔴 LE RYTHME SE BRANCHE ICI, avec le son : les deux sont des réglages de
    //    confort posés dans le bandeau, et un second brancheur finirait par
    //    oublier l'un des deux écrans. Le cran tourne en boucle — trois états
    //    se parcourent plus vite qu'ils ne se choisissent dans un menu.
    var bl = racine.querySelector("#pk-langue");
    if (bl) bl.addEventListener("click", function () {
      poserLangue(LANG() === "fr" ? "en" : "fr");
      // ⚠️ On redessine l'ACCUEIL, et c'est pour ça que le réglage y vit : il
      //    n'y a rien en vol à cet endroit. Redessiner un combat ou un bilan en
      //    pleine partie perdrait ce qui s'y joue.
      // 🔴 ET LE BOUTON GARDE SA PLACE DANS LA FENÊTRE — voir `sansBouger` :
      //    les deux langues n'ont pas la même hauteur, et le réglage partait
      //    sous le doigt qui venait de l'actionner.
      sansBouger("#pk-langue", accueil);
    });
    var r = racine.querySelector("#pk-rythme");
    if (!r) return;
    r.addEventListener("click", function () {
      var i = (rythmeChoisi() + 1) % RYTHMES.length;
      try { W.localStorage.setItem("poke_rythme", String(i)); } catch (e) { /* privé */ }
      var mot = ["rythmePose", "rythmeVif", "rythmePresse"][i];
      r.setAttribute("aria-label", T("rythmeQuoi") + " : " + T(mot));
      r.innerHTML = traceRythme(i) + '<span class="pkdx-rythme-mot">' + T(mot) + "</span>";
    });
  }

  //  Vrai seulement sur les deux écrans d'où l'on peut partir sans rien perdre.
  //  🔴 REMIS À FAUX À CHAQUE RENDU : c'est ce qui rend l'oubli inoffensif. Un
  //     écran qui veut la lentille la DEMANDE (`coque(html, true)`) ; celui qui
  //     ne dit rien ne l'a pas. L'inverse — un drapeau qu'il faudrait penser à
  //     baisser — aurait rouvert le défaut au premier écran écrit demain.
  var sortieLibre = false;

  //  🔴 UNE PORTE NOMMÉE PLUTÔT QU'UN SECOND ARGUMENT AU LOIN. `coque()` reçoit
  //     un gabarit de plusieurs dizaines de lignes ; un `, true` accroché après
  //     sa parenthèse fermante serait invisible à la relecture, et personne ne
  //     saurait dire, en lisant un écran, s'il ouvre le Pokédex ou non. Le nom
  //     le dit à l'endroit où on l'écrit.
  function coqueLibre(contenu) { return coque(contenu, true); }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UN RÉGLAGE RESTE SOUS LE DOIGT QUI VIENT DE L'ACTIONNER  [19/08/2026]
  //
  //  🔴 TROISIÈME CAUSE DU « ÇA SAUTE » relevé par le propriétaire, et la seule
  //     que la respiration ne couvre pas. Les deux langues n'occupent pas la
  //     même hauteur : mesuré sur l'accueil, l'accroche tient sur une ligne en
  //     français et sur deux en anglais. Tout ce qui est en dessous descend de
  //     vingt pixels — dont le bouton qu'on vient de toucher, qui part sous le
  //     doigt au moment précis où l'œil y revient.
  //
  //  🔑 Ce n'est pas une faute de traduction : un texte traduit N'A PAS la même
  //     longueur, et vouloir l'y forcer abîmerait les deux langues. Ce qui se
  //     corrige, c'est le point de vue — on redonne au bouton la place qu'il
  //     occupait DANS LA FENÊTRE, et le reste de la page glisse autour de lui.
  //  ⚠️ Sans défilement doux : on ne joue pas une transition, on annule un
  //     déplacement que le joueur n'a pas demandé.
  // ═══════════════════════════════════════════════════════════════════════════
  function sansBouger(selecteur, redessiner) {
    var avant = racine.querySelector(selecteur);
    var haut = avant ? avant.getBoundingClientRect().top : null;
    redessiner();
    var apres = racine.querySelector(selecteur);
    if (haut === null || !apres || !W.scrollBy) return;
    var ecart = apres.getBoundingClientRect().top - haut;
    if (ecart) W.scrollBy(0, ecart);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CLIC QUI TRAVERSE L'ÉCRAN — 17/08/2026, rapport de Kickincreep60
  // ---------------------------------------------------------------------------
  //  « Lorsque je clique sur l'icône "Suite" un peu trop vite, ça m'arrive que
  //   l'item du butin soit sélectionné, car la frame du butin est au même
  //   emplacement que celle du bouton "suite". Et donc, je ne peux pas
  //   "spammer" le bouton "suite". »
  //
  //  🔴 CE N'EST PAS UN DÉFAUT DE POSITION, C'EST UN DÉFAUT DE TEMPS. Déplacer
  //     le bouton — ce qu'il suggère — réparerait CETTE paire d'écrans, à CETTE
  //     largeur de fenêtre. Or la collision est le RÉSULTAT d'une hauteur de
  //     texte et d'une taille de fenêtre : elle reviendra ailleurs, et sur un
  //     téléphone elle ne tombera pas au même endroit. Le vrai fait est que le
  //     second clic d'un joueur pressé arrive AVANT qu'il ait pu voir le nouvel
  //     écran — et il engage une carte qu'il n'a pas lue.
  //  ✅ LA RÈGLE : *on peut marteler ce qui AVANCE, on ne peut pas engager par
  //     accident.* Un écran fraîchement dessiné refuse les CHOIX pendant un
  //     court instant ; « SUITE » et « CONTINUER », qui ne font qu'avancer,
  //     restent martelables — c'est justement ce que le joueur demande.
  //  🔑 UN SEUL ENDROIT, ET C'EST CE QUI LE REND VRAI PARTOUT : `surClic` est la
  //     porte de TOUS les choix du mode (36 appels, tous en `[data-…]`), et
  //     `coque` est la porte de tous les écrans. Trente-six gardes posées à la
  //     main en auraient oublié trente-cinq.
  //  ⚠️ 300 ms, ET LE CHIFFRE EST RAISONNÉ : un martèlement humain enchaîne à
  //     60-150 ms, tandis que voir un écran neuf, lire une carte et viser en
  //     demande 250 à 400. On coupe donc le clic involontaire sans jamais
  //     retarder un clic voulu. Ce n'est PAS une animation : rien ne bouge à
  //     l'écran, le bouton n'est pas grisé — un joueur qui vise ne voit rien.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 ET 300 MS N'ONT PAS SUFFI — SECOND SIGNALEMENT, 20/08/2026.
  //     Kickincreep60, capture à l'appui, mot pour mot : « Même souci avec la
  //     MàJ. Je ne peux pas cliquer vite, sans prendre un item non-voulu. »
  //     Deux joueurs, le même défaut, de part et d'autre d'un correctif : le
  //     chiffre était le bon raisonnement et la mauvaise réponse. Le monter à
  //     500 aurait avalé le clic RÉFLÉCHI d'un joueur rapide — la note
  //     ci-dessus dit elle-même que viser demande 250 à 400 ms.
  //
  //  🔑 CE QUI DISTINGUE LES DEUX CLICS N'EST PAS LEUR DÉLAI, C'EST L'ENDROIT.
  //     Le clic accidentel tombe LÀ OÙ ÉTAIT LE PRÉCÉDENT — c'est le doigt qui
  //     n'a pas bougé, et c'est exactement ce que le premier signalement
  //     décrivait : « la frame du butin est au même emplacement que celle du
  //     bouton SUITE ». Le clic voulu, lui, VISE : il se déplace vers la carte
  //     qu'on a choisie.
  //  ✅ On garde donc 300 ms pour tout le monde, ET on refuse plus longtemps
  //     un clic qui n'a pas bougé de plus d'un pouce. Un joueur qui vise n'est
  //     jamais retardé ; un doigt qui martèle au même endroit ne peut plus
  //     engager. *Ce qui ne se rattrape pas ne se prend pas par inertie.*
  var GARDE_CLIC_MS = 300;
  var GARDE_IMMOBILE_MS = 800;   // au-delà, même immobile, le clic est voulu
  var GARDE_POUCE = 44;          // un pouce d'adulte, en pixels CSS
  var dessineA = 0;
  var dernierClic = null;        // {x, y} du dernier clic reçu, tous écrans confondus

  function coque(contenu, libre) {
    sortieLibre = !!libre;
    dessineA = Date.now();
    racine.innerHTML =
      '<div class="pkdx">' + enTete() +
        '<main class="pkdx-ecran">' + contenu + "</main>" +
      "</div>";
    brancherSon();
    //  🔴 UN ÉCRAN NEUF MONTRE SES PORTES. Vu au banc : le jeu recentre la
    //     carte sur le nœud courant en arrivant, ma barre a pris ce défilement
    //     pour un geste du joueur et s'est rangée AVANT qu'il ait touché quoi
    //     que ce soit. *Un défilement que le programme provoque n'est pas une
    //     intention.* On repart donc de zéro à chaque rendu.
    montrerBarre();
  }

  // Les écrans qui se rendent eux-mêmes (combat, Pokédex, classement, fin)
  // reçoivent la même ossature : un en-tête qui dit toujours où l'on en est.
  function hote(id) {
    racine.innerHTML =
      '<div class="pkdx">' + enTete() +
        '<main class="pkdx-ecran" id="' + id + '"></main>' +
      "</div>";
    brancherSon();
    return racine.querySelector("#" + id);
  }

  function surClic(selecteur, fn) {
    var els = racine.querySelectorAll(selecteur);
    //  La garde du clic traversant : voir le bloc au-dessus de `coque`. On
    //  ignore, on ne diffère pas — un clic qu'on rejouerait 300 ms plus tard
    //  serait exactement le clic accidentel qu'on cherche à écarter.
    var garde = function (e) {
      var maintenant = Date.now();
      var depuis = maintenant - dessineA;
      if (depuis < GARDE_CLIC_MS) return;
      //  Le doigt n'a pas bougé, et l'écran a changé sous lui : c'est de
      //  l'inertie, pas un choix. On ne diffère pas, on ignore — rejouer ce
      //  clic 500 ms plus tard serait rejouer l'accident.
      if (depuis < GARDE_IMMOBILE_MS && dernierClic &&
          Math.abs(e.clientX - dernierClic.x) < GARDE_POUCE &&
          Math.abs(e.clientY - dernierClic.y) < GARDE_POUCE) {
        return;
      }
      fn(e);
    };
    for (var i = 0; i < els.length; i++) els[i].addEventListener("click", garde);
  }

  // ── L'accueil ──────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 L'ACCUEIL NE RECONNAISSAIT PERSONNE. Un titre, une phrase, deux boutons
  //    dans un cadre de deux cent cinquante pixels au milieu d'un écran vide.
  //    Le joueur qui revient avec six départs ouverts, quatre voyages derrière
  //    lui et un record de huit badges voyait exactement le même écran que
  //    celui qui arrive pour la première fois.
  //    Or c'est ICI que se joue la deuxième partie. Tout ce qu'on vient
  //    d'ajouter à l'écran de fin — « ce voyage a ouvert trois départs » — ne
  //    vaut que si l'écran d'accueil s'en souvient.
  // 🔴 ET RIEN NE DISAIT CE QU'EST LE JEU. Ni carte, ni créature, ni la règle
  //    qui le distingue : neuf actes, des chemins qui se ferment derrière soi.
  //    Un joueur qui ne sait pas ce qu'on lui propose ne clique pas.
  // ═══════════════════════════════════════════════════════════════════════════
  // Le rang, dit d'un seul endroit. 🔴 Deux écrans le montrent — l'accueil et le
  //    duel — et deux calculs finiraient par ne plus dire la même chose.
  function rangDit() {
    var r = W.PokeProgression.rang();
    return {
      nom: T("rang" + r.cle.charAt(0).toUpperCase() + r.cle.slice(1)),
      vers: r.suivant ? T("vers" + r.suivant.charAt(0).toUpperCase() + r.suivant.slice(1)) : T("rangSommet"),
      n: r.n, sur: r.sur,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE MÉDAILLON DE LA PORTE D'ENTRÉE (12/08, verdict du propriétaire :
  //  « fade, moche, sans vie, sans couleur, ça donne pas envie »)
  //
  //  🔴 IL AVAIT RAISON, ET LA CAUSE ÉTAIT LISIBLE : trois sprites de 88 px
  //     nus sur le plateau — la seule rangée de l'écran SANS la peinture au
  //     type que tout le reste du mode possède déjà (cartes du Potentiel, de
  //     la réserve, du duel). La porte d'entrée était le seul écran qui
  //     n'employait pas le geste le plus fort du système.
  //  ✅ Donc : l'ARTWORK officiel (assets/img/poke/art, les 151 y sont) sur la
  //     carte teintée du composant commun. La couleur qui arrive nomme un TYPE
  //     — Plante, Feu, Eau pour le trio du canon — la loi du mode est sauve.
  //  ⚠️ AUCUN PRIMITIF NEUF : même peinture 10 % / 34 % que `.pkdx-carte-mon`,
  //     même `PokeType.attr`, même signe doré chromatique sur l'img.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA PHASE DE LA RESPIRATION DE L'ACCUEIL  [19/08/2026]
  //
  //  🔴 « QUAND ON SWITCH ENTRE ANGLAIS ET FRANÇAIS ÇA FAIT UNE ANIMATION
  //     COMME SI ÇA SAUTAIT » — le propriétaire, en production. Mesuré à la
  //     sonde : les trois sujets de la vitrine passaient de -1,86 / -4,75 /
  //     -6,71 px à zéro sur une seule image, puis restaient immobiles le
  //     temps que leurs décalages de départ se rejouent.
  //
  //     Rien à voir avec la langue : `coque()` remplace TOUT le contenu de
  //     l'écran, et une animation CSS posée sur un élément neuf repart de sa
  //     première image. Ça se produit à chaque retour à l'accueil ; le
  //     réglage de langue l'a seulement rendu visible, parce qu'il redessine
  //     l'écran SANS le quitter — c'est le seul moment où l'œil peut comparer.
  //
  //  🔑 On ne conserve pas les nœuds — ce serait une exception dans la seule
  //     porte de rendu du mode, et elle finirait par en appeler d'autres. On
  //     conserve la PHASE : un décalage négatif du temps déjà écoulé, et
  //     l'animation reprend exactement où elle en était.
  //  ⚠️ Le cycle vaut 6,4 s et non 3,2 : `alternate` compte l'aller ET le
  //     retour. Un modulo sur la moitié ferait sauter la scène une fois sur
  //     deux — moins souvent, donc plus difficile à croire.
  //  ⚠️ L'HORLOGE EST CELLE DES ANIMATIONS, PAS CELLE DU MUR. `Date.now()`
  //     avance quand l'onglet passe à l'arrière-plan ; les animations CSS, non
  //     — elles gèlent avec le document. Une phase calculée sur l'heure du mur
  //     aurait donc fait sauter la scène au premier redessin après un retour
  //     d'onglet, c'est-à-dire précisément dans le cas qu'on répare. Les deux
  //     horloges se ressemblent tant qu'on regarde ; c'est quand on ne regarde
  //     pas qu'elles divergent.
  // ═══════════════════════════════════════════════════════════════════════════
  var CYCLE_RESPIRE_MS = 6400;
  function phaseRespire() {
    var d = W.document;
    var t = (d && d.timeline && d.timeline.currentTime) || 0;
    // La propriété se nomme ICI, avec sa valeur : c'est une déclaration CSS
    // complète, et elle se lit comme telle — y compris par `poke-decimales`,
    // qui reconnaît une décimale de CSS à la propriété qui la porte.
    return "--respire:-" + (((t % CYCLE_RESPIRE_MS) || 0) / 1000).toFixed(2) + "s";
  }

  //  Le nombre de joueurs du site, une fois qu'on le sait. 🔴 IL NE SE
  //  REDEMANDE PAS : il ne bouge pas dans une session, et le redemander faisait
  //  disparaître puis réapparaître sa ligne à chaque retour à l'accueil.
  //  ⚠️ Il reste `null` tant qu'une panne dure : rien ne s'affiche alors, comme
  //     avant — un compteur absent vaut mieux qu'un « 0 joueur ».
  var mondeConnu = null;
  //  Un seul endroit écrit ce nombre. Il est mis en forme (« 5 967 »), et
  //  `PokeGenre` sait relire une mise en forme depuis le 19/08 — le gabarit
  //  d'accord s'affichait en toutes lettres avant ça.
  function mondeEcrit(n) {
    return n.toLocaleString(LANG() === "fr" ? "fr-FR" : "en-US");
  }

  function medaillonAccueil(n, chromatique) {
    // 🔴 LA VITRINE DE L'ACCUEIL EST CELLE DU COMPTE, pas celle du voyage : elle
    //    peut montrer une créature rapportée d'un autre monde. Lue dans la
    //    table du monde courant, elle rendait `undefined` — et l'accueil
    //    mourait tout entier, écran blanc, avant le premier bouton.
    var e = W.PokeRegles ? W.PokeRegles.especeToute(n) : ESP()[n];
    if (!e) return "";
    //  🔴 JAMAIS `loading="lazy"` SUR UN HÉROS (12/08, vu par le proprio sur
    //     connexion lente) : les auras CSS s'allument à l'instant, les images
    //     paresseuses arrivent après — « l'aura dans le vide ». La première
    //     image d'un écran se charge en PRIORITÉ, pas en dernier.
    return '<figure class="pkdx-accueil-mon"' + W.PokeType.attr(e.types[0]) + ">" +
      '<img alt="' + esc(e.nom[LANG()]) + '" fetchpriority="high" decoding="async"' +
      (chromatique ? ' data-chromatique="oui"' : "") +
      ' src="assets/img/poke/art/' + n + '.webp">' +
      "</figure>";
  }

  function accueil() {
    partie = null;
    mondeEnAttente = false;
    // Une création abandonnée ne doit pas hanter la suivante : la lentille
    // lirait une étape close sur une partie qui n'existe plus.
    reprendreCreation = null;
    moissonAvantSortie = null;
    // Le voyage laissé en plan, s'il y en a un. Lu UNE fois : l'accueil s'en
    // sert deux fois — pour le bouton et pour ce qu'il annonce — et deux
    // lectures finiraient par ne plus dire la même chose.
    var voyageEnAttente = W.PokeProgression && W.PokeProgression.voyageLire
      ? W.PokeProgression.voyageLire() : null;
    var r = W.PokeProgression ? W.PokeProgression.releve() : null;
    var dex = W.PokeProgression ? W.PokeProgression.comptePokedex() : { pris: 0, total: 151 };
    var depart = W.PokeDepart ? W.PokeDepart.compte() : null;
    var connu = !!(r && r.voyages);
    // Le palier le plus haut franchi, zéro tant qu'on n'est pas monté sur
    // l'échelle. Lu une fois : le relevé ne rouvre pas le compte pour un champ.
    var sceauMaxi = (W.PokeSceaux && W.PokeProgression)
      ? (W.PokeProgression.lire().sceauMax || 0) : 0;
    var nCoffre = (W.PokeProgression && typeof W.PokeProgression.coffreCompte === "function")
      ? W.PokeProgression.coffreCompte() : 0;

    // Un aperçu de la collection, en dessin : des chiffres seuls ne donnent pas
    // envie de la remplir. 🔴 On dit « aperçu », pas « les dernières prises » :
    // `pris` ne garde aucune date, donc le tri par numéro ne raconte rien du
    // temps. Nommer une donnée pour ce qu'elle n'est pas, c'est mentir petit.
    var apercu = "";
    var nombresVitrine = [];
    if (connu && W.PokeProgression) {
      var compte = W.PokeProgression.lire();
      var pris = Object.keys(compte.pris || {}).map(Number);
      pris.sort(function (a, b) { return b - a; });
      var chroma = compte.chromatiques || {};
      nombresVitrine = pris.slice(0, 8);
      //  🔴 UNE COLLECTION D'UNE OU DEUX PRISES LAISSAIT LA FAÇADE À MOITIÉ
      //     ALLUMÉE (12/08, vu sur un compte à 1/151) : un médaillon seul au
      //     centre, et l'ellipse `--scene1` peinte à 15 % de la largeur —
      //     une lueur sur du vide, qui se lit comme une image qui a raté.
      //     L'horizon est dessiné pour TROIS créatures ; on n'en montre
      //     jamais moins. Le trio du canon complète, sans doublon — et les
      //     teintes suivent ce qui est réellement montré, la loi est sauve.
      W.PokeDepart.CANON().forEach(function (n) {
        if (nombresVitrine.length < 3 && nombresVitrine.indexOf(n) < 0) {
          nombresVitrine.push(n);
        }
      });
      apercu = nombresVitrine.map(function (n) {
        // Le même signe doré que partout ailleurs : un chromatique se
        // reconnaît au premier coup d'œil, y compris sur une vignette.
        return medaillonAccueil(n, chroma[n]);
      }).join("");
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LA PORTE D'ENTRÉE — REFAITE LE 08/08
    //
    //  🔴 VERDICT DU PROPRIÉTAIRE : « assez moche, la police pas assez visible,
    //     on voit pas grand-chose, un gros fond blanc qui fait mal aux yeux ».
    //     Il a raison sur les trois points, et ils ont la même cause : c'était
    //     une DALLE BLANCHE posée sur une page sombre, avec du gris pâle en
    //     petit dessus. Un formulaire, pas la façade d'un jeu.
    //
    //  🔴 LE PLATEAU EXISTAIT DÉJÀ, ET IL N'ÉTAIT PAS SUR SA PORTE D'ENTRÉE.
    //     `.pkdx-plateau` est la plus belle surface du mode — celle de la carte
    //     à embranchements. L'accueil la reprend : le contraste devient celui
    //     du reste du jeu au lieu d'être son contraire, et le blanc disparaît.
    //
    //  🔴 ET ON MONTRE DES CRÉATURES. Un jeu Pokémon dont le premier écran ne
    //     contient aucun Pokémon ne dit pas ce qu'il est. Les trois du canon
    //     pour qui arrive, sa propre collection pour qui revient.
    // ═══════════════════════════════════════════════════════════════════════
    if (!(connu && apercu)) nombresVitrine = W.PokeDepart.CANON();
    var vitrine = (connu && apercu)
      ? apercu
      : nombresVitrine.map(function (n) { return medaillonAccueil(n, false); }).join("");
    // ── L'HORIZON DE LA SCÈNE (12/08, « c'est ultra sombre partout ») ──────
    //  🔴 DEUXIÈME PASSE LE MÊME JOUR : les teintes `--scene1/2/3` passées à
    //     la feuille peignaient des ellipses à POSITIONS FIXES de la bande —
    //     « des auras jaune et bleu là où y a pas de Pokémon » dès que la
    //     rangée ne couvrait pas toute la largeur. L'horizon émane désormais
    //     du halo de CHAQUE médaillon (feuille, `.pkdx-accueil-mon::after`) :
    //     la lumière suit les créatures, l'écran n'a plus rien à transmettre.

    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LES SIX COMPTEURS PASSENT SOUS L'ACTION, ET LE RANG RESTE AU-DESSUS.
    //     Mesuré le 09/08 sur un téléphone de 390 px : le bouton COMMENCER
    //     finissait à 826 px du haut. Il tient sur un grand téléphone et sort
    //     de l'écran sur un petit — l'action principale de la porte d'entrée
    //     demandait de défiler pour être trouvée.
    //
    //     La cause n'est pas la hauteur, c'est le RANGEMENT : un mur de six
    //     compteurs se tenait entre la promesse et le bouton. Or les deux ne
    //     font pas le même travail. Le RANG donne envie de partir — « Champion
    //     de la Ligue · bats le Maître en duel » se lit comme un défi. Le
    //     Pokédex, les voyages, le record, les départs et les chromatiques se
    //     CONSULTENT, et ils ont chacun leur écran derrière un bouton.
    //
    //     Donc : le rang au-dessus du bouton, les compteurs en dessous. Ce
    //     n'est pas un compromis de place — c'est la lecture juste, et elle
    //     vaut aussi sur grand écran.
    //  ⚠️ DANS LE DOM, PAS PAR `order`. Un ordre visuel qui contredit l'ordre
    //     du document fait entendre les compteurs avant les boutons à un
    //     lecteur d'écran, et fait sauter le curseur au clavier. Ici, l'ordre
    //     lu et l'ordre vu sont le même.
    // ═══════════════════════════════════════════════════════════════════════
    var compteurs = connu
      ? '<div class="pkdx-compte">' +
            // ═══════════════════════════════════════════════════════════════
            //  🔴 LES MÊMES HUIT PORTRAITS ÉTAIENT DESSINÉS DEUX FOIS.
            //     `apercu` est calculé une fois et servait ICI **et** dans la
            //     vitrine du haut : sur un compte qui revient, l'accueil
            //     affichait la même rangée de créatures à deux cent cinquante
            //     pixels d'écart. Mesuré le 09/08 en comparant les `src` — pas
            //     « des Pokémon des deux côtés », **les mêmes images**.
            //     Sur téléphone, ce doublon poussait le bouton COMMENCER hors
            //     de l'écran : la porte d'entrée demandait de défiler pour
            //     trouver son action principale, à cause d'une répétition.
            //  ⚠️ ON GARDE CELLE DU HAUT. Elle est plus grande, elle est
            //     au-dessus du titre, et c'est elle qui dit ce qu'est le jeu
            //     avant qu'on ait lu un mot. Le relevé, lui, redevient ce
            //     qu'un relevé doit être : des nombres, et rien d'autre.
            // ═══════════════════════════════════════════════════════════════
            '<dl class="pkdx-compte-releve">' +
              // 🔴 LE RANG N'EST PLUS ICI — il est passé AU-DESSUS des boutons,
              //    dans `.pkdx-rang-fil`. Ce qui suit reste vrai et explique
              //    pourquoi il fallait le sortir de ce mur de compteurs.
              // 🔴 LE RANG EN PREMIER. C'est le seul fil qui relie les voyages
              //    entre eux : le mettre après cinq compteurs le rendrait
              //    invisible, et c'est lui qui donne envie du suivant.
              // 🔴 ET IL DISAIT SON NOM SANS DIRE LA SUITE. `rangDit()` calcule
              //    DÉJÀ le rang suivant et la distance qui l'en sépare (`vers`,
              //    `n`, `sur`) — et l'accueil ne gardait que le nom, sur l'écran
              //    dont le commentaire ci-dessus dit qu'« il donne envie du
              //    suivant ». Un rang sans son prochain barreau est une
              //    étiquette, pas un fil : le joueur lit « Dresseur de Kanto »
              //    et ne sait ni ce qui vient après, ni combien il en est loin.
              //    C'est la même règle que le diplôme et que la promesse du
              //    sceau — *un objectif sans distance est une rumeur*.
              // ⚠️ ET ON N'AFFICHE QUE LA CONDITION, PAS `n / sur`. Vu à
              //    l'écran : « Termine un voyage avec les huit badges. · 2 / 5 »
              //    — le 2/5 est la POSITION sur l'échelle des cinq rangs, pas
              //    une progression vers cette condition. Côte à côte, les deux
              //    se lisent comme un seul fait, et ce fait est faux. La
              //    condition EST la distance, et « RECORD 2 / 8 » vit déjà dans
              //    le même relevé, deux colonnes plus loin.
              //    *Un nombre qui ne mesure pas ce qu'il jouxte est pire que
              //    pas de nombre.*
              // ⚠️ Au sommet, `vers` porte la phrase du sommet : rien à
              //    promettre, et la ligne le dit d'elle-même.
              "<div><dt>" + T("cPokedex") + "</dt><dd>" + dex.pris + " / " + dex.total + "</dd></div>" +
              "<div><dt>" + T("cVoyages") + "</dt><dd>" + r.voyages + "</dd></div>" +
              "<div><dt>" + T("cBadges") + "</dt><dd>" + (r.badgesMax || 0) + " / 8</dd></div>" +
              (depart ? "<div><dt>" + T("cDeparts") + "</dt><dd>" +
                depart.ouverts + " / " + depart.ouvrables + "</dd></div>" : "") +
              (r.chromatiques ? "<div><dt>" + T("cChroma") + "</dt><dd>" + r.chromatiques + "</dd></div>" : "") +
              // 🔴 LE SCEAU EST L'IDENTITÉ DU JOUEUR QUI REVIENT. « Je suis au
              //    Sceau 3 » se raconte ; « j'ai 22 espèces » se compte. C'est le
              //    palier le plus haut franchi, donc la seule ligne du relevé
              //    qu'on ne peut pas gagner par la patience — et elle n'était
              //    nulle part sur l'écran qu'on regarde le plus.
              // ⚠️ Rien tant qu'on n'est pas monté sur l'échelle, comme l'écran
              //    de départ : « Sceau 0 / 8 » afficherait un échec à qui n'a
              //    même pas encore appris que l'échelle existe. La promesse,
              //    elle, se fait à l'écran de FIN, au moment où l'on décide de
              //    relancer.
              (sceauMaxi ? '<div><dt>' + T("cSceau") + "</dt><dd>" +
                sceauMaxi + " / " + W.PokeSceaux.nombre() + "</dd></div>" : "") +
            "</dl>" +
        "</div>"
      : "";
    // Le réglage de vitesse, en toutes lettres, là où il y a la place de le
    // nommer. ⚠️ Hors voyage seulement : pendant un combat on ne règle pas, on
    // joue — et le bandeau, lui, n'a pas la largeur d'un libellé.
    var reglageRythme =
      '<div class="pkdx-reglage">' +
        '<span class="pkdx-reglage-nom">' + T("rythmeQuoi") + "</span>" +
        boutonRythme() +
      "</div>" +
      '<div class="pkdx-reglage">' +
        '<span class="pkdx-reglage-nom">' + T("langueQuoi") + "</span>" +
        boutonLangue() +
      "</div>";
    // Le fil du rang : ce qu'on est, et le barreau suivant. Une ligne, au-dessus
    // de l'action — c'est lui qui la déclenche.
    var rd = connu ? rangDit() : null;
    var filRang = connu
      ? '<dl class="pkdx-rang-fil"><div class="est-rang">' +
          "<dt>" + T("cRang") + "</dt>" +
          "<dd>" + esc(rd.nom) + "</dd>" +
          '<dd class="pkdx-rang-suite">' + esc(rd.vers) + "</dd>" +
        "</div></dl>"
      : '<ul class="pkdx-promesse">' +
          "<li>" + T("promesseActes") + "</li>" +
          "<li>" + T("promesseChemin") + "</li>" +
          "<li>" + T("promesseDex") + "</li>" +
        "</ul>";

    coqueLibre(
      '<div class="pkdx-plateau pkdx-accueil">' +
      // La phase de la respiration : voir `--respire` dans la feuille. Le
      // décalage est NÉGATIF — l'animation reprend où elle en était au lieu
      // de repartir de sa première image à chaque redessin de l'accueil.
      '<div class="pkdx-accueil-vitrine" style="' + phaseRespire() + '">' + vitrine + "</div>" +
      // ═══════════════════════════════════════════════════════════════════
      //  L'AFFICHE EN DEUX TEMPS (recomposition 12/08, mandat « toutes les
      //  pages d'onboarding ») : au bureau, le TITRE et l'accroche à gauche,
      //  la promesse (ou le fil de rang) à droite — au lieu d'une pile où
      //  chaque ligne repousse l'action d'un cran. Le bouton remonte
      //  au-dessus de la ligne de flottaison. Une colonne au téléphone.
      // ═══════════════════════════════════════════════════════════════════
      '<div class="pkdx-accueil-double">' +
        "<div>" +
          '<p class="pkdx-surtitre">' +
            T((W.PokeRegles && W.PokeRegles.cles().length > 1) ? "sousAccueilDeuxMondes" : "sousAccueil",
              { n: W.PokeRegles ? W.PokeRegles.dexTotalCompte() : 151 }) +
          "</p>" +
          '<h1 class="pkdx-titre est-geant">' + T("titreAccueil") + "</h1>" +
          '<p class="pkdx-dit est-forte">' + T(connu ? "accueilRetour" : "accueil") + "</p>" +
        "</div>" +
        "<div>" + filRang + "</div>" +
      "</div>" +
      // ═══════════════════════════════════════════════════════════════════════
      //  💬 L'INVITATION DISCORD DU SOIR (20→27/08, 18 h → minuit) — demande du
      //     propriétaire : « le petit pop-up, une fois par jour, pour amener
      //     les gens sur le Discord du jeu : bug, suggestion, communauté ».
      //  ⚠️ PAS UNE MODALE : ce mode n'en a pas, et une fenêtre qui saute par-
      //     dessus l'accueil serait la seule de tout le mode. C'est une CARTE
      //     sous la barre, qu'on rejoint ou qu'on referme — même contrat que
      //     le pop-up de `game.js` (une fois par soir, trois refus et on se
      //     tait, un clic et on ne relance plus), même mesure (`annonce_*`).
      //  ⚠️ Seulement à qui a déjà fini un voyage (`connu`) : le premier
      //     contact appartient au jeu.
      // ═══════════════════════════════════════════════════════════════════════
      (connu && annonceDiscordDue()
        ? '<aside class="pkdx-annonce" id="pk-annonce">' +
            '<p class="pkdx-annonce-titre">' + T("annonceTitre") + "</p>" +
            "<p>" + T("annonceDit") + "</p>" +
            '<div class="pkdx-actions">' +
              '<a class="pkdx-touche est-definitive" id="pk-annonce-oui" href="' + ANNONCE_DISCORD.lien +
                '" target="_blank" rel="noopener">' + T("annonceOui") + "</a>" +
              '<button type="button" class="pkdx-touche est-discrete" id="pk-annonce-non">' + T("annonceNon") + "</button>" +
            "</div>" +
          "</aside>"
        : "") +
      '<div class="pkdx-actions est-pied">' +
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 REPRENDRE PASSE AVANT COMMENCER, ET PORTE L'ACCENT. Un joueur qui
        //     revient a UN geste à faire, et c'est celui-là ; laisser
        //     « COMMENCER » en tête le ferait effacer son propre voyage d'un
        //     doigt. Le bouton neuf dit d'ailleurs ce qu'il coûte.
        //  ⚠️ Il n'apparaît que si un voyage attend : une porte qui s'ouvre sur
        //     rien apprend au joueur à ne plus la regarder.
        // ═══════════════════════════════════════════════════════════════════
        (voyageEnAttente
          ? '<button type="button" class="pkdx-touche est-definitive" id="pk-reprendre">' +
              W.PokeIcones.svg("ball") + T("reprendre") +
              '<span class="pkdx-touche-note">' +
                esc(T("reprendreOu", { a: voyageEnAttente.partie.acte || 1,
                                       n: (voyageEnAttente.partie.badges || []).length })) +
              "</span></button>"
          : "") +
        '<button type="button" class="pkdx-touche' + (voyageEnAttente ? "" : " est-definitive") + '" id="pk-go">' +
          W.PokeIcones.svg("ball") + T("commencer") +
          (voyageEnAttente ? '<span class="pkdx-touche-note">' + esc(T("reprendreNeuf")) + "</span>" : "") +
          "</button>" +
        '<button type="button" class="pkdx-touche" id="pk-defi">' + T("defi") + "</button>" +
        '<button type="button" class="pkdx-touche" id="pk-usine">' + T("usineTitre") + "</button>" +
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 [20/08, Angel sur Discord] « LES RUNS NE SONT PAS SAUVEGARDÉES
        //     ENTRE LES APPAREILS ? J'EN AVAIS COMMENCÉ UNE HIER, LÀ JE DOIS
        //     REPRENDRE DU DÉBUT (JE SUIS BIEN CONNECTÉ) ». Il a raison, et il
        //     a fait exactement ce qu'il fallait : le compte synchronise le
        //     POKÉDEX (`/api/poke/sync`), pas le VOYAGE — celui-ci vit dans le
        //     stockage du navigateur et n'est jamais envoyé au serveur.
        //  🔑 Un joueur connecté suppose que tout suit son compte, et rien ne
        //     lui disait le contraire. On le dit là où la question se pose :
        //     sous le bouton qui reprend un voyage. Faire suivre le voyage est
        //     une AUTRE affaire (le défi du jour ne doit surtout pas suivre —
        //     un essai par appareil est ce qui tient le classement).
        //  ⚠️ Seulement quand un voyage attend : sans voyage, la phrase parle
        //     d'un objet qui n'existe pas.
        // ═══════════════════════════════════════════════════════════════════
        (voyageEnAttente ? '<p class="pkdx-dit est-note">' + T("voyageIci") + "</p>" : "") +
      "</div>" +
      // ═══════════════════════════════════════════════════════════════════════
      //  LE MONDE ATTIRE LE MONDE — ET CE MODE ÉTAIT LE SEUL SANS (16/08)
      //
      //  🔴 « 3 652 joueurs ont déjà rejoint le monde » se lit sur l'accueil des
      //     quatre autres univers (`game.js`, `#player-count`). La page Pokémon
      //     ne charge pas `game.js` : elle n'avait donc ni ce compteur, ni le
      //     panneau de compte. C'est la même cause pour les deux, et elle se
      //     voit dans la base — 13,6 % des parties Pokémon ont un compte,
      //     contre 62 à 70 % partout ailleurs.
      //  ⚠️ MÊME PHRASE, MÊME MONDE, VOLONTAIREMENT. Le nombre est celui du
      //     SITE, pas du mode : « le monde », c'est Road to Legends, et c'est
      //     déjà ce que la phrase dit aux quatre autres. Un compteur propre au
      //     mode aurait affiché 147 — un chiffre vrai qui découragerait, sur
      //     l'écran dont tout le travail est de donner envie d'entrer.
      //  ⚠️ VIDE PAR DÉFAUT, REMPLI APRÈS COUP. L'accueil ne doit pas attendre
      //     le réseau pour s'afficher, et une panne ne doit rien montrer du
      //     tout — surtout pas un « 0 joueur ».
      // ═══════════════════════════════════════════════════════════════════════
      //  ⚠️ L'ATTRIBUT `hidden`, PAS UNE CLASSE. `.hidden` n'est déclarée NULLE PART
      //     dans `css/poke.css` — c'est une convention de `js/game.js`, et ce mode
      //     ne charge pas cette feuille-là. Posée ici, elle aurait laissé un
      //     paragraphe vide occuper sa place sous le bouton, sans erreur visible.
      // 🔴 ET UNE FOIS CONNU, IL SE DESSINE TOUT DE SUITE — 19/08. Le nombre
      //    était redemandé au réseau à CHAQUE dessin de l'accueil, et la ligne
      //    repartait cachée : au retour d'un écran, la rangée de boutons
      //    montait puis redescendait quand la réponse arrivait. Un chiffre qui
      //    ne change pas dans la minute n'a pas à se redemander, et une ligne
      //    déjà lue n'a pas à disparaître pour réapparaître.
      (mondeConnu
        ? '<p class="pkdx-monde" id="pk-monde">' + W.PokeIcones.svg("ball") +
            esc(T("monde", { n: mondeEcrit(mondeConnu) })) + "</p>"
        : '<p class="pkdx-monde" id="pk-monde" hidden></p>') +
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 SIX BOUTONS DE MÊME POIDS, ET « MA COLLECTION » TOUT SEUL SUR SA
      //     LIGNE. Mesuré le 09/08 : à 1180 px la rangée rendait cinq boutons
      //     puis un orphelin, à 390 px elle rendait 1-2-2-1. Un repli qui laisse
      //     un élément seul ne se lit pas comme une rangée, il se lit comme un
      //     oubli.
      //
      //  🔴 ET LA CAUSE N'EST PAS LA LARGEUR, C'EST LE RANGEMENT. Ces six
      //     boutons ne font pas le même métier : deux servent à JOUER —
      //     commencer un voyage, prendre le défi du jour — et quatre mènent à un
      //     ÉCRAN qu'on consulte. Les poser côte à côte demandait au joueur de
      //     trier six portes identiques pour trouver la seule qui lance le jeu.
      //
      //     Deux rangées, donc, et par intention : jouer d'abord, les lieux
      //     ensuite, en retrait. L'orphelin disparaît à toutes les largeurs
      //     parce qu'il n'y a plus de rangée de six à replier.
      // ═══════════════════════════════════════════════════════════════════════
      // ⚠️ ET ELLES GARDENT LEUR CADRE. J'ai d'abord passé ces quatre boutons
      //    en `est-discrete` pour marquer le retrait — mais cette variante a été
      //    écrite pour ARRÊTER SON VOYAGE : « elle se lit, et elle ne se clique
      //    pas par mégarde ». Vu à l'écran, les quatre portes devenaient du texte
      //    sans relief, c'est-à-dire l'inverse exact de ce que disent les trois
      //    commentaires ci-dessous — le duel, le carnet et le Pokédex ont été
      //    remontés ICI précisément pour qu'on les emprunte.
      //    *Une variante porte une intention ; la reprendre pour une autre les
      //    casse toutes les deux.* Le retrait se dit par la RANGÉE, pas par le
      //    bouton : c'est la seconde, sans filet, après celle qui joue.
      '<div class="pkdx-actions est-lieux">' +
        // 🔴 LE DUEL EST SUR L'ACCUEIL, PAS DANS UN SOUS-MENU. Une mécanique
        //    livrée doit avoir sa porte d'entrée le jour même, et au premier
        //    niveau : c'est la faute n°1 du projet, payée assez de fois.
        '<button type="button" class="pkdx-touche" id="pk-duel">' + T("duel") + "</button>" +
        '<button type="button" class="pkdx-touche" id="pk-classement">' + T("classement") + "</button>" +
        // 🏷️ [18/08, Poltron] LE CERCLE — le clan des autres univers, enfin ici.
        //    Le serveur le portait depuis l'ouverture ; c'est l'écran qui
        //    manquait (`PokeClassement.cercle`). À côté du classement : c'est un
        //    classement entre amis.
        '<button type="button" class="pkdx-touche" id="pk-cercle">' + T("cercle") + "</button>" +
        // 🔴 LE CARNET A SA PORTE DÈS L'ACCUEIL, ET C'EST LA CONDITION POUR
        //    QU'IL SERVE À QUELQUE CHOSE. Une chasse qu'on découvre à l'écran
        //    de fin ne dirige aucun voyage : elle raconte celui qu'on vient de
        //    perdre. Elle doit se lire AVANT de partir, pour qu'on parte en la
        //    visant. C'est la faute n°1 du projet — une mécanique livrée sans
        //    sa porte d'entrée — et elle ne se repaie pas ici.
        '<button type="button" class="pkdx-touche" id="pk-carnet">' + T("carnet") + "</button>" +
        '<button type="button" class="pkdx-touche" id="pk-coffre">' +
          T("coffreTitre") +
          (nCoffre > 0 ? ' <span class="pkdx-touche-note" id="pk-coffre-compte">(' + nCoffre + ")</span>" : "") +
        "</button>" +
        // 🔴 ET LES NOUVEAUTÉS ONT LEUR PORTE ICI AUSSI. Sept correctifs en une
        //    nuit, tous demandés par des joueurs, et aucun endroit pour le leur
        //    dire : celui qui signale rejouait le défaut du soir en croyant
        //    qu'on n'avait rien fait. La pastille se pose après coup, quand le
        //    fichier de notes a répondu — l'accueil ne l'attend pas.
        '<button type="button" class="pkdx-touche" id="pk-neuf">' + T("neuf") +
          '<span class="pkdx-pastille" id="pk-neuf-point" hidden></span>' +
        "</button>" +
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 LE POKÉDEX N'AVAIT AUCUNE PORTE DEPUIS L'ACCUEIL. C'est la
        //     collection qui persiste entre les voyages, celle dont le mode
        //     porte le nom, celle qui ouvre les départs — et pour la regarder
        //     il fallait PARTIR EN VOYAGE. Le relevé d'accueil en montrait le
        //     compte et huit vignettes, sans un seul endroit où cliquer.
        //     C'est la faute n°1 du dossier, sur la mécanique la plus centrale :
        //     une collection qu'on ne peut pas contempler ne se collectionne
        //     pas.
        //  ⚠️ ON N'OUVRE QU'À CEUX QUI ONT COMMENCÉ. Un Pokédex de 151 cases
        //     vides au tout premier écran, avant le premier voyage, ce sont
        //     151 portes fermées — le mode a déjà refusé ça pour les sceaux.
        // ═══════════════════════════════════════════════════════════════════
        (connu
          ? '<button type="button" class="pkdx-touche" id="pk-dex-accueil">' + T("dexAccueil") + "</button>"
          : "") +
        // 🔴 LA PORTE DU COMPTE — voir `connexion`. Elle est de cette rangée-ci
        //    parce qu'elle mène à un ÉCRAN qu'on consulte, pas à une partie
        //    qu'on joue : c'est le rangement que cette rangée porte déjà.
        '<button type="button" class="pkdx-touche" id="pk-compte">' +
          T(connecte() ? "monCompte" : "connexion") + "</button>" +
        // 🌌 PAS DE LIEN VERS GATECIV ICI (20/08). Le propriétaire a demandé
        //    « un bouton comme pour Pokémon, DBZ… qui envoie sur mon jeu » ; il
        //    est posé sur l'accueil et la fin de voie de Naruto / Dragon Ball
        //    (`game.js`, `GATECIV_LIEN`). Ce mode-ci est un FAN GAME : sa règle
        //    de discrétion (`tools/poke-discretion.mjs`) interdit qu'il renvoie
        //    vers dehors — a fortiori vers un jeu qui se vend. Le lien a été
        //    écrit puis retiré le soir même, sur le rouge du détecteur.
      "</div>" +
      // 🔴 LE RÉGLAGE DESCEND TOUT EN BAS. Posé sous la vitrine, il s'intercalait
      //    entre l'appareil et le titre du jeu — « ça se retrouve n'importe où »,
      //    et le propriétaire avait raison : un réglage placé avant le nom du
      //    jeu se lit comme du contenu, pas comme une préférence.
      //    *Ce qui se règle une fois se range après ce qui se lit à chaque fois.*
      reglageRythme +
      compteurs +
      // ═══════════════════════════════════════════════════════════════════════
      //  LA SÉRIE SUR L'ACCUEIL — LE SEUL MÉCANISME QUI RAMÈNE DEMAIN
      //
      //  🔴 ELLE EXISTAIT ET IL FALLAIT CLIQUER POUR LA VOIR. Le compte de
      //     jours d'affilée vivait sur l'écran du Défi du jour — c'est-à-dire
      //     derrière un clic que fait justement celui qui n'a pas besoin d'être
      //     rappelé. Une série qui ne se voit qu'après avoir décidé de jouer ne
      //     décide de rien.
      //  🔴 ET ELLE DIT L'ÉTAT DU JOUR, PAS SEULEMENT LE COMPTE : « le défi
      //     t'attend » quand l'essai est intact, « fait » quand il est consommé.
      //     Sans ça, un joueur qui a déjà joué relit un rappel qui ne le
      //     concerne plus, et le rappel perd sa force pour les jours où il
      //     compte.
      //  ⚠️ Rien du tout au premier passage : annoncer une série de zéro jour à
      //     qui découvre le mode, c'est ouvrir sur un reproche.
      // ═══════════════════════════════════════════════════════════════════════
      (function () {
        if (!W.PokeProgression || !W.PokeClassement) return "";
        var date = W.PokeClassement.jour();
        var s = W.PokeProgression.serieDefis(date);
        var fait = W.PokeProgression.defiDuJour(date);
        if (!s.joues && fait) return "";
        if (!s.joues && !fait) return "";
        // 🔴 LA RÈGLE DU JOUR SE LIT DEPUIS L'ACCUEIL, PAS DERRIÈRE UN CLIC.
        //    C'est elle qui donne une raison de revenir AUJOURD'HUI plutôt que
        //    demain ; la garder dans l'écran du défi, c'est la montrer à qui a
        //    déjà décidé de jouer. Un rappel ne sert qu'aux indécis.
        //  ⚠️ Seulement si l'essai est intact : nommer la règle d'un défi déjà
        //     consommé, c'est vanter une porte fermée.
        var r = !fait && W.PokeRegleDuJour ? W.PokeRegleDuJour.pour(date) : null;
        // 🔴 ET QUAND L'ESSAI EST CONSOMMÉ, ON PARLE DE DEMAIN. « 4 jours
        //    d'affilée » est un constat ; « demain : Main légère » est un
        //    rendez-vous. C'est la différence entre un compteur et une raison —
        //    et la règle étant une fonction PURE de la date, celle de demain
        //    est connue aujourd'hui.
        var d = fait && W.PokeRegleDuJour ? W.PokeRegleDuJour.demain(date) : null;
        return '<p class="pkdx-dit pkdx-serie">' +
          esc(T(fait ? "accueilSerieFaite" : "accueilSerieAttend", { n: s.encours })) +
          (r ? " " + esc(T("accueilRegle", { nom: r.nom[LANG()] })) : "") +
          (d ? " " + esc(T("accueilDemain", { nom: d.nom[LANG()] })) : "") +
        "</p>";
      })() +
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 LES MENTIONS SONT SUR L'ACCUEIL, ET NULLE PART AILLEURS.
      //     Sur l'accueil, parce que c'est le seul écran que TOUT LE MONDE
      //     traverse, et le seul qu'un ayant droit ouvrirait s'il venait voir.
      //     Nulle part ailleurs, parce qu'une mention répétée sur neuf écrans
      //     devient du décor et cesse d'être lue — la carte de partage la porte
      //     déjà, et c'est la seule autre surface qui sorte du jeu.
      //  ⚠️ En bas, en encre douce, sans couleur : la loi du mode réserve la
      //     couleur aux créatures et aux types, et une mention légale n'est ni
      //     l'une ni l'autre. Elle doit être LISIBLE, pas voyante — le contraste
      //     se règle en couleur, jamais par `opacity`, qui écrase un groupe
      //     entier et a déjà coûté dix-neuf textes à ce dossier.
      // ═══════════════════════════════════════════════════════════════════════
      '<p class="pkdx-mentions">' +
        esc(T("mentionsFan")) + " " + esc(T("mentionsMarques")) + "<br>" +
        esc(T("mentionsRetrait")) +
        // ⚠️ L'adresse est une CIBLE, pas un mot dans une phrase : un lien de
        //    douze pixels au fil du texte fait quatorze pixels de haut, et le
        //    plancher tactile du mode est quarante-quatre. Elle prend donc sa
        //    ligne, et la ligne fait sa hauteur.
        '<a class="pkdx-mentions-mail" href="mailto:' + esc(T("mentionsMail")) + '">' +
          esc(T("mentionsMail")) + "</a>" +
      "</p>"
    );
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LA REPRISE REMONTE AUSSI L'ÉTAT DE LA GRAINE. Recréer un `PokeHasard`
    //     depuis la seule source repartirait au premier tirage : le monde
    //     changerait sous les pieds du joueur — mêmes lieux, autres rencontres.
    //     `etat` et `tirages` sont donc reposés tels quels, et le voyage repris
    //     est exactement celui qu'on avait quitté.
    // ═══════════════════════════════════════════════════════════════════════
    if (voyageEnAttente) {
      racine.querySelector("#pk-reprendre").addEventListener("click", function () {
        son("PRESS_AB");
        W.POKE_GRAINE = null;
        //  Les deux vont toujours ensemble : la graine imposée dit « on est au
        //  défi », la date dit duquel. Éteindre l'une sans l'autre ferait
        //  garder une carrière libre dans l'emplacement de l'essai du jour.
        defiDate = null;
        hasard = new W.PokeHasard(voyageEnAttente.graine);
        hasard.etat = voyageEnAttente.etat;
        hasard.tirages = voyageEnAttente.tirages;
        // 🔴 PAR LA PORTE, comme le départ : c'est ici que les infobulles
        //    étaient perdues pour tout joueur qui rouvrait son onglet.
        prendreLaPartie(voyageEnAttente.partie);
        journal = voyageEnAttente.journal || [];
        carte();
      });
    }
    racine.querySelector("#pk-go").addEventListener("click", function () {
      // 🔴 ON ÉTEINT LA GRAINE IMPOSÉE. Sans cette ligne, une carrière libre
      //    lancée après un défi rejouerait la carte du défi : `demarrerPartie`
      //    laisse `POKE_GRAINE` maître quand elle existe, et rien ne l'effaçait.
      W.POKE_GRAINE = null;
      if (gardeDuCompte(function () { W.POKE_GRAINE = null; ouvrirDepart(); })) return;
      ouvrirDepart();
    });
    racine.querySelector("#pk-defi").addEventListener("click", function () {
      son("PRESS_AB");
      ecranDefi();
    });
    var boutonUsine = racine.querySelector("#pk-usine");
    if (boutonUsine) {
      boutonUsine.addEventListener("click", function () {
        son("PRESS_AB");
        if (W.PokeRegles && typeof W.PokeRegles.poser === "function") {
          W.PokeRegles.poser("gen3");
        }
        if (W.PokeUIUsine && W.PokeUIUsine.ouvrirHall) {
          W.PokeUIUsine.ouvrirHall({ retour: accueil });
        }
      });
    }
    racine.querySelector("#pk-compte").addEventListener("click", function () {
      son("PRESS_AB");
      W.location.href = "index.html?go=compte&retour=poke";
    });
    // 💬 L'invitation Discord : montrée = vue (une fois par soir) ; rejoindre =
    //    on ne relance plus ; refermer = un refus de plus, trois et on se tait.
    var annonce = racine.querySelector("#pk-annonce");
    if (annonce) {
      annonceDiscordVue();
      racine.querySelector("#pk-annonce-oui").addEventListener("click", function () {
        mesure("annonce_clic", ANNONCE_DISCORD.id);
        annonceDiscordGarder({ refus: ANNONCE_DISCORD.refusMax });
      });
      racine.querySelector("#pk-annonce-non").addEventListener("click", function () {
        son("PRESS_AB");
        mesure("annonce_refus", ANNONCE_DISCORD.id);
        var st = annonceDiscordEtat();
        annonceDiscordGarder({ refus: (st.refus || 0) + 1 });
        annonce.remove();
      });
    }
    // Le compteur du monde, rempli quand le serveur répond. 🔴 ON REVÉRIFIE QUE
    // LE NŒUD EST TOUJOURS LÀ : l'accueil se redessine à chaque retour d'écran,
    // et une réponse en retard écrirait alors dans un élément détaché.
    // 🔴 ET ON NE REDEMANDE PLUS CE QU'ON SAIT DÉJÀ : le dessin ci-dessus pose
    //    la ligne d'emblée quand le nombre est connu, donc il n'y a plus rien à
    //    attendre ni à faire apparaître.
    if (!mondeConnu) (function () {
      var pied = racine.querySelector("#pk-monde");
      if (!pied || !W.PokeClassement || !W.PokeClassement.monde) return;
      W.PokeClassement.monde().then(function (n) {
        if (!n) return;
        mondeConnu = n;
        if (!pied.isConnected) return;
        // L'icône du mode, en SVG comme sur les boutons : elle se recolore avec
        // le thème et ne se lit pas comme un caractère par un lecteur d'écran.
        pied.innerHTML = W.PokeIcones.svg("ball") +
          esc(T("monde", { n: mondeEcrit(n) }));
        pied.hidden = false;
      });
    })();
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [17/08] LE POKÉDEX DE COMPTE DESCEND DU NUAGE ICI, UNE FOIS PAR
    //     CHARGEMENT. C'est le seul écran par lequel tout le monde passe, et
    //     c'est AVANT de partir — un joueur qui ouvre le jeu sur son PC doit
    //     retrouver sa collection avant de choisir quoi que ce soit.
    //  ⚠️ UNE SEULE FOIS, pas à chaque retour à l'accueil : cet écran se
    //     redessine après chaque nœud, et un appel réseau par retour aurait
    //     brûlé le quota du joueur pour rien.
    //  ⚠️ On redessine SI la collection a changé — sinon les compteurs de
    //     l'accueil (Pokédex, voyages, record) resteraient sur les chiffres
    //     d'avant la fusion, et le joueur croirait que rien n'est revenu.
    if (!W.__pokeSyncFaite && W.PokeClassement && W.PokeClassement.pokedexSynchroniser) {
      W.__pokeSyncFaite = true;
      //  ⚠️ `P()` EST `PokePartie`, PAS LA PROGRESSION — deux accesseurs à une
      //     lettre près dans ce fichier. Lire la progression par `P()` aurait
      //     levé « lire is not a function » à chaque ouverture de l'accueil.
      (function () {
        var avant = JSON.stringify(W.PokeProgression.lire());
        W.PokeClassement.pokedexSynchroniser().then(function (ok) {
          if (!ok) return;
          if (JSON.stringify(W.PokeProgression.lire()) !== avant && !partie) accueil();
        });
      })();
    }
    racine.querySelector("#pk-duel").addEventListener("click", function () {
      son("PRESS_AB");
      ecranDuel();
    });
    racine.querySelector("#pk-cercle").addEventListener("click", function () {
      son("PRESS_AB");
      W.PokeClassement.cercle(hote("pk-cl"), accueil, {});
    });
    // Un code de cercle arrivé par lien (`pokemon#l=CODE`) ouvre l'écran du cercle
    // dessus, une seule fois : le code se vide de l'adresse pour ne pas rouvrir
    // l'écran à chaque retour à l'accueil.
    (function () {
      var m = /^#l=([A-Z2-9]{4,12})$/i.exec(W.location.hash || "");
      if (!m) return;
      try { W.history.replaceState(null, "", W.location.pathname + W.location.search); } catch (e) {}
      W.PokeClassement.cercle(hote("pk-cl"), accueil, { code: m[1].toUpperCase() });
    })();
    racine.querySelector("#pk-classement").addEventListener("click", function () {
      W.PokeClassement.ouvrir(hote("pk-cl"), accueil, {});
    });
    var bNeuf = racine.querySelector("#pk-neuf");
    if (bNeuf) {
      bNeuf.addEventListener("click", function () { son("PRESS_AB"); ecranNouveautes(); });
      // ⚠️ On ne fait apparaître la pastille que si le nœud est TOUJOURS là :
      //    l'accueil se redessine à chaque retour d'écran, et une réponse en
      //    retard écrirait dans un élément détaché.
      chargerNotes().then(function (notes) {
        var pt = racine.querySelector("#pk-neuf-point");
        // ⚠️ L'ATTRIBUT `hidden`, PAS LA CLASSE : `.hidden` n'est déclarée nulle
        //    part dans `css/poke.css` — c'est une convention de `js/game.js`,
        //    que ce mode ne charge pas. La faute avait déjà été commise le
        //    16/08 sur le compteur de joueurs.
        if (pt && pt.isConnected && neufNonLu(notes)) pt.hidden = false;
      });
    }
    racine.querySelector("#pk-carnet").addEventListener("click", function () {
      son("PRESS_AB");
      ecranCarnet();
    });
    var bCoffre = racine.querySelector("#pk-coffre");
    if (bCoffre) {
      bCoffre.addEventListener("click", function () {
        son("PRESS_AB");
        ecranCoffre();
      });
    }
    // 🔴 LA COLLECTION, HORS VOYAGE. L'écran du Pokédex attend une `partie` :
    //    on lui en donne une VIDE, sans version. C'est exactement ce qu'il faut
    //    dire — hors partie, rien n'a été pris « pendant ce voyage » et il n'y
    //    a pas d'« ici » — et l'écran sait déjà le lire (`partie.version` absent
    //    ⇒ il compte sur les deux versions au lieu d'une).
    //    ⚠️ Une doublure, PAS un `PokePartie.creer` : créer une vraie partie
    //       tirerait une graine, une version et un rival pour afficher une
    //       grille. Un écran de lecture ne fabrique pas de monde.
    var bDex = racine.querySelector("#pk-dex-accueil");
    if (bDex) {
      bDex.addEventListener("click", function () {
        son("PRESS_AB");
        W.PokePokedex.ouvrir(hote("pk-dex-hote"), { pris: {}, vus: {} }, accueil);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CARNET DE CHASSE — LA SEULE PISTE LONGUE DU MODE
  //
  //  🔴 IL MONTRE CE QUI RESTE, PAS SEULEMENT CE QUI EST FAIT. Une liste de
  //     trophées félicite ; une liste d'objectifs CHIFFRÉS dirige le prochain
  //     départ. Chaque ligne dit son compte — « 2 / 4 badges » — parce qu'un
  //     objectif qu'on ne peut pas suivre en jouant ne change aucune décision.
  //
  //  🔴 IL NOMME LE SERMENT QU'IL OUVRE. « Une chasse de plus » ne fait envie à
  //     personne ; « ouvre le Serment du titan », si — surtout quand on vient
  //     de lire ce que fait un serment, trois écrans plus tôt.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUI A CHANGÉ — LE MODE N'AVAIT AUCUN ENDROIT POUR LE DIRE (17/08)
  //
  //  🔴 SEPT LIVRAISONS EN UNE NUIT, TOUTES DEMANDÉES PAR DES JOUEURS, ET
  //     AUCUNE PAGE POUR LES ANNONCER. Le « Quoi de neuf » du site vit dans
  //     `js/game.js`, que `pokemon.html` ne charge pas — comme le compteur de
  //     joueurs et le panneau de compte. Un joueur signalait un défaut, on le
  //     corrigeait dans l'heure, et il n'avait aucun moyen de l'apprendre : il
  //     rejouait le bug de la veille en croyant qu'on n'avait rien fait.
  //  🔑 CORRIGER SANS LE DIRE, C'EST NE PAS AVOIR CORRIGÉ POUR CELUI QUI A
  //     SIGNALÉ. C'est la classe n°1 du dossier — du contenu écrit et jamais
  //     montré — appliquée cette fois aux réponses qu'on donne aux joueurs.
  //  ⚠️ LES NOTES SONT SERVIES À PART (`patchnotes-poke.json`), comme pour les
  //     autres univers : on peut corriger un texte sans relivrer le mode.
  //  ⚠️ LA PASTILLE SE COMPARE À LA DERNIÈRE ENTRÉE LUE, PAS À UNE DATE. Un
  //     joueur qui revient après trois livraisons doit voir un point, pas
  //     trois — et celui qui a tout lu ne doit rien voir.
  // ═══════════════════════════════════════════════════════════════════════════
  var CLE_NEUF = "poke_neuf_lu";
  var notesNeuf = null;

  function chargerNotes() {
    if (notesNeuf) return Promise.resolve(notesNeuf);
    return fetch("patchnotes-poke.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) { notesNeuf = Array.isArray(j) ? j : []; return notesNeuf; })
      .catch(function () { notesNeuf = []; return notesNeuf; });
  }

  //  La clé de la dernière note. Elle porte la DATE et le TITRE : deux
  //  livraisons du même jour restent distinctes, et corriger une faute de
  //  frappe dans le corps ne rallume pas la pastille chez tout le monde.
  function cleNeuf(notes) {
    return (notes && notes.length) ? notes[0].v + "|" + (notes[0].t.fr || "") : null;
  }
  function neufNonLu(notes) {
    var k = cleNeuf(notes);
    if (!k) return false;
    try { return W.localStorage.getItem(CLE_NEUF) !== k; } catch (e) { return false; }
  }

  function ecranNouveautes() {
    chargerNotes().then(function (notes) {
      try { if (cleNeuf(notes)) W.localStorage.setItem(CLE_NEUF, cleNeuf(notes)); } catch (e) {}
      var corps = notes.length
        ? notes.map(function (n) {
            return '<section class="pkdx-neuf-lot">' +
              '<p class="pkdx-surtitre">' + esc(T("neufDate", { v: n.v })) + "</p>" +
              '<h2 class="pkdx-soustitre">' + esc(n.t[LANG()] || n.t.fr) + "</h2>" +
              "<ul class=\"pkdx-neuf-liste\">" +
                (n.items || []).map(function (i) {
                  return "<li>" + esc(i[LANG()] || i.fr) + "</li>";
                }).join("") +
              "</ul></section>";
          }).join("")
        : '<p class="pkdx-dit">' + T("neufVide") + "</p>";
      coque(
        '<p class="pkdx-surtitre">' + T(surMonde()) + "</p>" +
        '<h1 class="pkdx-titre">' + T("neufTitre") + "</h1>" +
        '<div class="pkdx-neuf">' + corps + "</div>" +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-neuf-ok">' +
            T("retour") + "</button>" +
        "</div>"
      );
      racine.querySelector("#pk-neuf-ok").addEventListener("click", function () {
        son("PRESS_AB");
        accueil();
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  MON PC — TOUT CE QU'ON A ÉLEVÉ, TOUS VOYAGES CONFONDUS (17/08)
  //
  //  🔴 DEMANDE DE POLTRON_SOFA : « dommage qu'on n'ait pas accès à notre PC
  //     toutes parties confondues, et qu'on compose notre équipe de duel (même
  //     les doublons) ». Ce qui s'appelait « PC » n'en était pas un : une ligne
  //     par ESPÈCE, un numéro et un surnom, sans niveau — un journal de
  //     collection. On ne pouvait ni revoir un Pokémon élevé, ni en garder deux.
  //  ✅ Le PC garde des INDIVIDUS et sert à UNE chose : composer l'équipe de
  //     duel. Rien de tout ceci n'entre dans un voyage — « les niveaux ne
  //     persistent pas » reste la règle qui tient le mode.
  //  ⚠️ L'ORDRE DE SÉLECTION EST L'ORDRE DE L'ÉQUIPE. Le premier coché ouvre le
  //     duel : c'est la seule décision tactique de cet écran, elle doit se voir.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranPc(apres) {
    var G = W.PokeProgression;
    var dispo = G.pc();
    var choisis = [];
    var retour = apres || ecranDuel;

    //  ⚠️ `vignette`, ET SURTOUT PAS `carte`. Nommée ainsi, cette aide précédait
    //     l'écran de carte d'acte dans le fichier — et les outils qui découpent
    //     un corps de fonction en cherchant sa déclaration au TEXTE lisaient
    //     celle-ci. `poke-renoncement.mjs` a aussitôt déclaré que la carte
    //     d'acte ne disait plus ce qu'on perd.
    //  🔑 UN NOM LOCAL PEUT CASSER UN CONTRÔLE GLOBAL : pour qui lit le fichier
    //     au texte, il n'y a pas de portée. Et le premier essai de ce
    //     commentaire citait la déclaration en toutes lettres — il redevenait
    //     lui-même la première occurrence trouvée. On la cite donc de loin.
    function vignette(m) {
      var e = ESP()[m.n];
      var rang = choisis.indexOf(m.cle);
      return '<button type="button" class="pkdx-pc-mon' + (rang >= 0 ? " est-pris" : "") +
        '" data-cle="' + esc(m.cle) + '" aria-pressed="' + (rang >= 0) + '">' +
        (rang >= 0 ? '<span class="pkdx-pc-rang">' + (rang + 1) + "</span>" : "") +
        '<img alt="" loading="lazy" src="' + W.PokeSprites.face(m.n, "?i=6") + '">' +
        "<b>" + esc(m.surnom || e.nom[LANG()]) + "</b>" +
        '<span class="pkdx-pc-note">' + W.PokeGenre.niveau(m.niveau) + "</span>" +
        '<span class="pkdx-pc-note">' + esc(T("pcCompteVoyage", { n: m.badges || 0 })) + "</span>" +
        "</button>";
    }

    function dessiner() {
      coque(
        '<p class="pkdx-surtitre">' + T(surMonde()) + "</p>" +
        '<h1 class="pkdx-titre">' + T("pcCompteTitre") + "</h1>" +
        '<p class="pkdx-dit">' + T(dispo.length ? "pcCompteDit" : "pcCompteVide") + "</p>" +
        (dispo.length
          ? '<p class="pkdx-dit est-forte" id="pk-pc-compte">' +
              esc(T("pcCompteChoisis", { n: choisis.length })) + "</p>" +
            '<div class="pkdx-pc">' + dispo.map(vignette).join("") + "</div>"
          : "") +
        '<div class="pkdx-actions est-pied">' +
          (dispo.length
            ? '<button type="button" class="pkdx-touche est-definitive" id="pk-pc-ok">' +
                T("pcCompteGarder") + "</button>"
            : "") +
          '<button type="button" class="pkdx-touche" id="pk-pc-retour">' + T("retour") + "</button>" +
        "</div>"
      );
      var mons = racine.querySelectorAll(".pkdx-pc-mon");
      for (var i = 0; i < mons.length; i++) {
        mons[i].addEventListener("click", function () {
          var cle = this.getAttribute("data-cle");
          var k = choisis.indexOf(cle);
          if (k >= 0) choisis.splice(k, 1);
          // ⚠️ SIX AU PLUS, et on le fait SENTIR au lieu de l'expliquer : le
          //    septième clic ne prend rien, le compteur ne bouge pas.
          else if (choisis.length < 6) choisis.push(cle);
          // ⚠️ `DENIED`, pas un nom inventé. Mon premier jet citait une clé qui
          //    n'existe dans aucune table : un son muet ne se voit pas, et le
          //    septième clic serait resté sans réponse. `poke-sons-lint` l'a
          //    attrapée — puis a attrapé ce commentaire, qui la citait encore
          //    en toutes lettres. Un contrôle qui lit au texte lit AUSSI les
          //    commentaires : on nomme la faute, on ne la recopie pas.
          else return son("DENIED");
          son("PRESS_AB");
          dessiner();
        });
      }
      var ok = racine.querySelector("#pk-pc-ok");
      if (ok) {
        ok.addEventListener("click", function () {
          if (!choisis.length) return message(T("pcCompteTitre"), T("pcCompteRefus"), function () { ecranPc(retour); });
          var r = G.composerDuel(choisis, (G.lire().duel || {}).nom || "");
          if (!r.ok) return message(T("pcCompteTitre"), T("pcCompteRefus"), function () { ecranPc(retour); });
          son("POKEDEX_RATING");
          message(T("pcCompteTitre"), T("pcCompteFait"), retour);
        });
      }
      racine.querySelector("#pk-pc-retour").addEventListener("click", function () {
        son("PRESS_AB");
        retour();
      });
    }

    dessiner();
  }

  function ecranCarnet() {
    var compte = W.PokeProgression.lire();
    var lignes = W.PokeChasses.etat(
      { chasses: compte.chasses, pris: Object.keys(compte.pris).length },
      null
    );
    var faites = lignes.filter(function (l) { return l.faite; }).length;
    coque(
      '<p class="pkdx-surtitre">' + T("carnetTitre") + "</p>" +
      '<h1 class="pkdx-titre">' + faites + " / " + lignes.length + "</h1>" +
      '<p class="pkdx-dit">' + T("carnetDit") + "</p>" +
      '<div class="pkdx-carnet">' + lignes.map(function (l) {
        var ouvre = l.ouvre && l.ouvre.serment && W.PokeSerments
          ? W.PokeSerments.de(l.ouvre.serment) : null;
        return '<div class="pkdx-chasse' + (l.faite ? " est-faite" : "") + '">' +
          '<span class="pkdx-chasse-nom">' + esc(l.nom[LANG()]) + "</span>" +
          '<span class="pkdx-chasse-etat">' +
            (l.faite ? T("carnetFaite") : l.fait + " / " + l.sur) + "</span>" +
          '<span class="pkdx-chasse-dit">' + esc(l.dit[LANG()]) + "</span>" +
          // ═══════════════════════════════════════════════════════════════════
          // 🔴 « 5 / 30 » NE SE RESSENT PAS. Un carnet d'objectifs est un écran
          //    de DÉSIR : ce qui donne envie d'y retourner, c'est de VOIR qu'on
          //    approche. Dix lignes de chiffres nus se lisent comme un relevé
          //    comptable — on compare mentalement dix fractions pour savoir
          //    laquelle est à portée, et personne ne le fait.
          //    La barre répond en un coup d'œil, et elle ne coûte rien : le
          //    compte et le seuil sont déjà là, à deux caractères près.
          // ⚠️ RIEN SUR CE QUI EST FAIT. Une barre pleine sur une chasse
          //    accomplie répéterait « ACCOMPLIE » sans rien ajouter, et
          //    encombrerait la seule ligne qu'on veut voir d'un trait.
          // ⚠️ ET UNE LARGEUR MINIMALE : à 1 sur 151, une barre de zéro pixel
          //    se lit comme « rien commencé » alors qu'on a commencé. Le premier
          //    pas doit se voir, sinon la barre décourage au lieu d'attirer.
          // ⚠️ « Presque » se calcule ICI et se pose en donnée : une règle CSS
          //    qui lirait le pourcentage dans l'attribut `style` serait fausse
          //    par construction (« 9 % » se retrouve dans 19, 29, 90…).
          (function () {
            if (l.faite || !(l.sur > 0)) return "";
            var part = Math.max(0, Math.min(1, l.fait / l.sur));
            // 🔴 LE PLANCHER NE VAUT QUE SI L'ON A COMMENCÉ. Posé sans garde, il
            //    donnait 3 % de barre à une chasse à ZÉRO sur quatre : la barre
            //    annonçait un progrès qui n'existe pas, et un compteur qui ment
            //    est pire qu'un compteur absent. Vu à l'écran dans la minute.
            //    ⚠️ Il reste NÉCESSAIRE au-dessus de zéro : à 1 sur 151, une
            //       barre d'un demi-pixel se lit « rien commencé ».
            var large = l.fait > 0 ? Math.max(3, Math.round(part * 100)) : 0;
            return '<span class="pkdx-barre pkdx-chasse-barre" aria-hidden="true"' +
                (part >= 0.8 ? ' data-pres="oui"' : "") + ">" +
              '<i style="--part:' + (large / 100) + '"></i>' +
            "</span>";
          })() +
          (ouvre ? '<span class="pkdx-chasse-ouvre">' + T("carnetOuvre") + " " +
            esc(ouvre.nom[LANG()]) + "</span>" : "") +
        "</div>";
      }).join("") + "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche" id="pk-carnet-retour">' + T("retour") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-carnet-retour").addEventListener("click", function () {
      son("PRESS_AB");
      accueil();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE COFFRE D'OBJETS — RÉSERVE DE DÉPART À 5 CHARGES (ZONE DE COMBAT)
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranCoffre() {
    var coffre = (W.PokeProgression && typeof W.PokeProgression.coffreLire === "function")
      ? W.PokeProgression.coffreLire()
      : {};
    var cles = Object.keys(coffre);
    var corps = "";

    if (cles.length === 0) {
      corps = '<div class="pkdx-coffre-vide">' +
        '<p class="pkdx-dit">' + esc(T("coffreVide")) + '</p>' +
      '</div>';
    } else {
      corps = '<div class="pkdx-coffre-grille">' +
        cles.map(function (cle) {
          var charges = coffre[cle] || 0;
          var nom = nomDObjet(cle);
          var catItem = null;
          if (W.PokeUIUsine && Array.isArray(W.PokeUIUsine.CATALOGUE_BOUTIQUE)) {
            for (var i = 0; i < W.PokeUIUsine.CATALOGUE_BOUTIQUE.length; i++) {
              if (W.PokeUIUsine.CATALOGUE_BOUTIQUE[i].cle === cle) {
                catItem = W.PokeUIUsine.CATALOGUE_BOUTIQUE[i];
                break;
              }
            }
          }
          var categorie = catItem ? catItem.categorie : "";
          var dit = (W.PokeDits && typeof W.PokeDits.objet === "function" ? W.PokeDits.objet(cle, T) : "") ||
                    (catItem && catItem.desc) || "";
          return '<div class="pkdx-coffre-carte" data-cle="' + esc(cle) + '">' +
            '<div class="pkdx-coffre-carte-haut">' +
              '<span class="pkdx-coffre-nom">' + esc(nom) + '</span>' +
              (categorie ? ' <span class="pkdx-coffre-cat">(' + esc(categorie) + ')</span>' : '') +
            '</div>' +
            (dit ? '<p class="pkdx-coffre-dit">' + esc(dit) + '</p>' : '') +
            '<div class="pkdx-coffre-badge-charges">' +
              esc(T("coffreCharges", { n: charges })) +
            '</div>' +
          '</div>';
        }).join("") +
      '</div>';
    }

    coque(
      '<div class="pkdx-plateau pkdx-coffre">' +
        '<p class="pkdx-surtitre">' + esc(T("usineTitre")) + '</p>' +
        '<h1 class="pkdx-titre">' + esc(T("coffreTitre")) + '</h1>' +
        '<p class="pkdx-dit">' + esc(T("coffreDit")) + '</p>' +
        corps +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche" id="pk-coffre-retour">' + esc(T("retour")) + '</button>' +
        '</div>' +
      '</div>'
    );

    var bRetour = racine.querySelector("#pk-coffre-retour");
    if (bRetour) {
      bRetour.addEventListener("click", function () {
        son("PRESS_AB");
        accueil();
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE DÉFI DU JOUR
  //
  //  🔴 IL ÉTAIT ÉCRIT PARTOUT SAUF À L'ÉCRAN. `partie.compare` verrouille le
  //     vivier de départ aux trois du canon (`depart.js`), refuse le compagnon
  //     et scelle la version ; `POKE_GRAINE` fixe la carte pour tout le monde ;
  //     `PokeClassement` promet en toutes lettres « une graine par jour, un seul
  //     essai » à qui ouvre le classement. Le drapeau n'était posé nulle part :
  //     le mode entier existait sans un bouton, et le classement annonçait un
  //     jeu qu'on ne pouvait pas jouer.
  //
  //  🔴 UN SEUL ESSAI, ET IL SE CONSOMME AU DÉPART. Le compter à l'arrivée
  //     reviendrait à autoriser autant de tentatives qu'on veut : il suffirait
  //     d'abandonner dès que la carte déplaît pour en tirer une autre. Le
  //     roguelite se joue avec la main qu'on reçoit.
  // ═══════════════════════════════════════════════════════════════════════════
  function graineDuJour(date) { return "POKE-JOUR-" + date; }

  // « 2026-08-08 » → « 8 août ». L'année ne sert à rien sur trente jours, et
  // une frise se lit d'un coup d'œil ou ne se lit pas.
  function jourCourt(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return String(iso || "");
    try {
      return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
        .toLocaleDateString(LANG() === "en" ? "en-GB" : "fr-FR",
          { day: "numeric", month: "long", timeZone: "UTC" });
    } catch (e) { return iso; }
  }

  function ecranDefi() {
    partie = null;
    var date = W.PokeClassement.jour();
    var deja = W.PokeProgression.defiDuJour(date);
    //  L'essai gardé, s'il est bien celui d'AUJOURD'HUI et qu'il n'est pas
    //  clos. `defiLire` refuse tout le reste — un essai d'hier n'est pas
    //  reprenable, sa carte et son classement n'existent plus.
    var essaiEnAttente = (deja && deja.score == null)
      ? W.PokeProgression.defiLire(date) : null;

    coque(
      '<p class="pkdx-surtitre">' + T("defiSur") + "</p>" +
      '<h1 class="pkdx-titre">' + T("defiTitre") + "</h1>" +
      '<p class="pkdx-dit">' + T("defiDit") + "</p>" +
      // [20/08, polish] « 2026-08-20 » est une clé de base, pas une date qu'un
      // joueur lit. La même porte que le classement : `dateLisible`.
      '<p class="pkdx-bandeau">' + esc(W.PokeClassement && W.PokeClassement.dateLisible
        ? W.PokeClassement.dateLisible(date) : date) + "</p>" +

      // 🔴 LA SÉRIE EN TÊTE, AVANT LE RÉSULTAT DU JOUR. C'est elle qui donne une
      //    raison de revenir demain ; le score d'aujourd'hui est déjà acquis.
      (function () {
        var s = W.PokeProgression.serieDefis(date);
        if (!s.joues) return '<p class="pkdx-dit est-note">' + T("defiPremier") + "</p>";
        return '<div class="pkdx-rang">' +
          "<dt>" + T("defiSerie") + "</dt>" +
          "<dd>" + esc(T("defiJours", { n: s.encours })) + "</dd>" +
          "<p>" + esc(T("defiRecord", { n: s.meilleure })) + "</p>" +
        "</div>";
      })() +

      // ═══════════════════════════════════════════════════════════════════════
      //  LA FRISE DES TRENTE JOURS
      //
      //  🔴 LE COMPTE GARDAIT SCORE, BADGES ET ISSUE DE CHAQUE JOUR, ET SEULE
      //     LA DATE ÉTAIT RELUE. Trente jours de résultats écrits dans le
      //     stockage, et le joueur ne pouvait voir aucun des siens.
      //  🔴 UNE SÉRIE EST UN NOMBRE, UN CALENDRIER EST UNE FORME. « 4 jours »
      //     ne dit rien de la semaine où l'on a décroché ; une case vide entre
      //     deux pleines, si — et une case vide se comble.
      //  ⚠️ La frise se tait tant qu'on n'a rien joué : trente cases vides sur
      //     l'écran d'un premier défi, c'est un reproche avant le premier clic.
      // ═══════════════════════════════════════════════════════════════════════
      (function () {
        var jours = W.PokeProgression.calendrierDefis(date, 30);
        var joues = 0;
        for (var i = 0; i < jours.length; i++) if (jours[i].joue) joues++;
        if (!joues) return "";
        var best = W.PokeProgression.meilleurJour(date, 30);
        // 🔴 UNE FRISE OÙ TOUS LES JOURS JOUÉS SE RESSEMBLENT NE DIT QUE
        //    « présent ». Trois intensités, rapportées au meilleur jour du
        //    mois : on voit d'un coup où sont les bons jours et où l'on
        //    s'essouffle. Trois et pas un dégradé — au-delà, l'œil ne compare
        //    plus, il regarde une texture.
        var haut = best ? best.score : 0;
        var force = function (s) {
          if (!haut || s == null) return "1";
          var r = s / haut;
          return r >= 0.8 ? "3" : r >= 0.5 ? "2" : "1";
        };
        return '<div class="pkdx-mois">' +
          '<p class="pkdx-surtitre">' + T("defiMois") + "</p>" +
          '<div class="pkdx-frise">' +
            jours.map(function (j) {
              // L'état porte l'issue : rien, entamé, terminé. La couleur reste
              // celle du chrome — la loi du mode la réserve aux créatures.
              var etat = !j.joue ? "vide" : (j.score == null ? "ouvert" : "fait");
              var dit = !j.joue ? T("defiCaseVide", { d: jourCourt(j.date) })
                : j.score == null ? T("defiCaseOuverte", { d: jourCourt(j.date) })
                : T("defiCaseJouee", { d: jourCourt(j.date), pts: milliers(j.score), n: j.score, b: j.badges });
              // 🔴 UNE FRISE DE TRENTE JOURS SANS LEURS RÈGLES EST UN GRAPHIQUE.
              //    Avec elles, c'est un souvenir : « le jour où j'ai fait 2 225
              //    en Main légère ». La règle se dérive de la date — elle est
              //    donc connue pour CHAQUE case, y compris celles d'avant sa
              //    livraison, et sans rien stocker de plus.
              var rj = W.PokeRegleDuJour ? W.PokeRegleDuJour.pour(j.date) : null;
              if (rj) dit += " " + T("defiCaseRegle", { nom: rj.nom[LANG()] });
              // `role="img"` + `aria-label` : sans rôle, un `<span>` étiqueté
              // n'est annoncé par aucun lecteur d'écran — la case serait un
              // carré muet pour qui ne voit pas la frise.
              // 🔴 `pkdx-jour`, jamais `pkdx-case` : celle-là est déjà la case
              //    du Pokédex, avec son propre `data-etat`. Voir la feuille.
              return '<span class="pkdx-jour" data-etat="' + etat + '"' +
                (etat === "fait" ? ' data-force="' + force(j.score) + '"' : "") +
                (j.aujourdhui ? " data-ce-jour" : "") +
                ' role="img" aria-label="' + esc(dit) + '" title="' + esc(dit) + '"></span>';
            }).join("") +
          "</div>" +
          // 🔴 LE CHIFFRE S'ÉCRIT, IL NE SE SURVOLE PAS. Au doigt, il n'y a pas
          //    de survol : une frise dont le sens tient dans des infobulles est
          //    muette sur la moitié des écrans du mode.
          '<p class="pkdx-dit est-note">' + esc(T("defiJoues", { n: joues })) +
            (best ? " " + esc(T("defiMeilleur", { pts: milliers(best.score), n: best.score, b: best.badges })) : "") +
          "</p>" +
        "</div>";
      })() +

      // ═══════════════════════════════════════════════════════════════════════
      //  LA RÈGLE DU JOUR — ANNONCÉE AVANT LE CLIC, COMME TOUT LE RESTE
      //
      //  🔴 LE DÉFI NE CHANGEAIT QUE DE CARTE. Même monde, mêmes règles : d'un
      //     jour à l'autre, ce qui bougeait était un tirage. Une série se tient
      //     sur un nombre ; ce qui se raconte, c'est une CONTRAINTE — « aujourd'hui
      //     c'est trois Pokémon au plus ». Elle est la même pour tout le monde,
      //     dérivée de la date, et c'est ce qui la rend commentable.
      //  ⚠️ Elle se lit AVANT de partir : c'est la loi du mode, et ici elle
      //     décide du départ qu'on choisit.
      // ═══════════════════════════════════════════════════════════════════════
      (function () {
        var r = W.PokeRegleDuJour ? W.PokeRegleDuJour.pour(date) : null;
        if (!r) return "";
        return '<div class="pkdx-regle-jour">' +
          '<p class="pkdx-surtitre">' + T("regleDuJour") + "</p>" +
          '<h2 class="pkdx-regle-nom">' + esc(r.nom[LANG()]) + "</h2>" +
          '<p class="pkdx-dit">' + esc(r.dit[LANG()]) + "</p>" +
        "</div>";
      })() +

      // 🔴 L'ESSAI CONSOMMÉ SE DIT, ET IL DIT LAQUELLE DES TROIS CHOSES : un
      //    défi terminé montre son score, un défi INTERROMPU se reprend, un
      //    défi dont la sauvegarde a disparu dit qu'il ne se reprend pas. Un
      //    bouton grisé sans raison affichée est la classe de défaut n°1 du
      //    projet, et c'est exactement ce qu'a vécu Chris le 19/08.
      (essaiEnAttente
        ? '<div class="pkdx-rang">' +
            "<dt>" + esc(T("defiFait", { date: date })) + "</dt>" +
            "<dd>" + esc(T("defiRepriseDit")) + "</dd>" +
          "</div>"
        : deja
        ? '<div class="pkdx-rang">' +
            "<dt>" + esc(T("defiFait", { date: date })) + "</dt>" +
            "<dd>" + (deja.score == null ? T("defiEnCours") : esc(T("defiScore", { n: deja.score }))) + "</dd>" +
            "<p>" + T("defiDemain") + "</p>" +
          "</div>"
        : '<ul class="pkdx-promesse"><li>' + T("defiRegles") + "</li>" +
            "<li>" + T("defiSansReprise") + "</li></ul>") +
      '<div class="pkdx-actions est-pied">' +
        (essaiEnAttente
          ? '<button type="button" class="pkdx-touche est-definitive" id="pk-defi-reprendre">' +
              W.PokeIcones.svg("ball") + T("defiReprendre") +
              '<span class="pkdx-touche-note">' +
                esc(T("defiReprendreOu", { a: essaiEnAttente.partie.acte || 1,
                                           n: (essaiEnAttente.partie.badges || []).length })) +
              "</span></button>"
          : "") +
        (deja ? "" : '<button type="button" class="pkdx-touche est-definitive" id="pk-defi-go">' +
          W.PokeIcones.svg("ball") + T("defiPartir") + "</button>") +
        '<button type="button" class="pkdx-touche" id="pk-defi-cl">' + T("defiVoirClassement") + "</button>" +
        '<button type="button" class="pkdx-touche" id="pk-defi-retour">' + T("retour") + "</button>" +
      "</div>"
    );

    var go = racine.querySelector("#pk-defi-go");
    if (go) go.addEventListener("click", function () {
      son("PRESS_AB");
      W.POKE_GRAINE = graineDuJour(date);
      W.PokeProgression.ouvrirDefi(date);
      // 🔴 LE DÉPART SE DÉCLARE AU SERVEUR, ET ICI SEULEMENT. C'est lui qui
      //    date la partie et consomme l'essai : sans cet appel, une soumission
      //    arrive sans jeton de départ et se fait refuser en `no_start` —
      //    exactement l'incident du 03/08 côté ninja, vécu par un joueur qui
      //    avait bien joué. On ne l'attend PAS : le voyage commence tout de
      //    suite, le classement n'est pas une condition pour jouer.
      if (W.PokeClassement && W.PokeClassement.demarrer) W.PokeClassement.demarrer(date);
      lancer(date);
    });
    // ═══════════════════════════════════════════════════════════════════════
    //  LA REPRISE DE L'ESSAI DU JOUR  [19/08/2026]
    //
    //  🔴 ON NE REDÉCLARE PAS LE DÉPART AU SERVEUR. `demarrer(date)` consomme
    //     l'essai et le date : le rappeler à chaque reprise ferait compter
    //     autant de départs que de reconnexions, et le classement lirait des
    //     essais qui n'ont jamais eu lieu. Reprendre n'est pas partir.
    //  ⚠️ MÊME REMISE EN PLACE QUE LE VOYAGE LIBRE, ET POUR LA MÊME RAISON :
    //     `etat` et `tirages` reposés tels quels, sans quoi le monde change
    //     sous les pieds du joueur — mêmes lieux, autres rencontres. Plus la
    //     graine imposée et la date, qui disent ce qu'on est en train de jouer.
    // ═══════════════════════════════════════════════════════════════════════
    var rep = racine.querySelector("#pk-defi-reprendre");
    if (rep) rep.addEventListener("click", function () {
      son("PRESS_AB");
      W.POKE_GRAINE = essaiEnAttente.graine;
      defiDate = date;
      hasard = new W.PokeHasard(essaiEnAttente.graine);
      hasard.etat = essaiEnAttente.etat;
      hasard.tirages = essaiEnAttente.tirages;
      prendreLaPartie(essaiEnAttente.partie);
      journal = essaiEnAttente.journal || [];
      // 🔴 LE COMBAT ENGAGÉ SE SOLDE ICI, AVANT LA CARTE. Voir
      //    `marquerCombatEngage` : si le marqueur a survécu, la page est morte
      //    en plein combat, et ce combat est perdu. On le DIT — un prix payé
      //    en silence est un piège — puis on rend la carte.
      if (partie.engage) {
        var devantBoss = !!partie.engage.boss;
        oublierCombatEngage();
        var solde = solderDefaite(devantBoss);
        P().appliquerNuzlocke(partie);
        W.PokeProgression.fusionner(partie);
        garderLeVoyage();
        return message(T("defiCoupeTitre"), T("defiCoupeDit"), function () {
          return ecranDefaite(solde, carte);
        });
      }
      carte();
    });
    racine.querySelector("#pk-defi-cl").addEventListener("click", function () {
      W.PokeClassement.ouvrir(hote("pk-cl"), ecranDefi, {});
    });
    racine.querySelector("#pk-defi-retour").addEventListener("click", function () {
      son("PRESS_AB");
      accueil();
    });
  }

  // ── La création ────────────────────────────────────────────────────────────
  //  🔴 Le genre est un CHOIX DE JEU, pas une case de formulaire : il change les
  //     textes du voyage. Voir `poke-genre.mjs` — tout texte français accordé au
  //     masculin doit déclarer son jumeau féminin.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PREMIER GESTE EST DE CHOISIR SON POKÉMON, PAS DE REMPLIR UN FORMULAIRE
  //
  //  🔴 « LES PREMIERS GESTES, C'EST CE QUI FAIT RESTER LE JOUEUR. » Verdict du
  //     propriétaire, et l'ordre était exactement l'inverse : on ouvrait sur un
  //     formulaire — genre, ton nom, le nom du rival, la règle de voyage — avant
  //     d'avoir montré une seule créature. Cinq décisions administratives pour
  //     entrer dans un jeu dont le premier geste, depuis 1996, est de choisir
  //     entre Bulbizarre, Salamèche et Carapuce.
  //
  //  🔴 ON INVERSE. Le laboratoire d'abord : trois artworks, trois types, on
  //     choisit. Le nom vient APRÈS, quand le joueur a déjà quelque chose à
  //     nommer — et il est pré-rempli, donc franchissable d'un clic.
  //
  //  ⚠️ La partie existe AVANT le choix : `choixStarter` lit `partie.version` et
  //     `partie.compare`. On la crée avec les valeurs du compte, et la création
  //     ne fait plus que les corriger. La graine, elle, est tirée une seule fois
  //     — c'est ce que `poke-rejouabilite` vérifie.
  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉCRAN DES MONDES  [19/08/2026]
  //
  //  🔑 LE MONDE SE CHOISIT AVANT LE LABORATOIRE, et il le faut : ce ne sont
  //     pas les mêmes trois Pokémon sur la table. Le poser après aurait demandé
  //     de reprendre un starter déjà choisi.
  //  ⚠️ CET ÉCRAN NE SE DESSINE QUE S'IL Y A DE QUOI CHOISIR. `PokeRegles.cles()`
  //     rend une seule entrée en production : `ouvrirDepart` lance alors le
  //     voyage tout droit. Aucun joueur ne voit une porte sur une pièce vide.
  // ═══════════════════════════════════════════════════════════════════════════
  var MONDES_DITS = {
    gen1: { nom: "mondeKanto", dit: "mondeKantoDit", sur: "kanto" },
    gen2: { nom: "mondeJohto", dit: "mondeJohtoDit", sur: "johto" },
    gen3: { nom: "mondeHoenn", dit: "mondeHoennDit", sur: "hoenn" },
  };

  //  Le bandeau du monde courant. Hors voyage, le registre rend le monde par
  //  défaut : en production, cette porte répond « kanto » et rien ne change.
  //  ⚠️ ON LIT LA PARTIE, PAS LE REGISTRE. Le jeu de règles courant reste celui
  //     du dernier voyage tant qu'un autre ne l'a pas remplacé : au retour d'un
  //     voyage de Johto, l'accueil se serait coiffé de « JOHTO » au-dessus
  //     d'une accroche qui parle de la Ligue Indigo et de 151 Pokémon. Hors
  //     voyage, le bandeau est celui du monde par défaut — et il n'y a pas de
  //     second appel à `PokeRegles.poser` : la porte reste unique.
  function surMonde() {
    var cle = partie && W.PokeRegles ? W.PokeRegles.de(partie)
      : (W.PokeRegles ? W.PokeRegles.DEFAUT : "gen1");
    var d = MONDES_DITS[cle];
    return (d && d.sur) || "kanto";
  }

  //  Vrai le temps que la question soit posée — le bandeau se tait alors.
  var mondeEnAttente = false;

  function ecranMonde() {
    mondeEnAttente = true;
    var cles = W.PokeRegles ? W.PokeRegles.cles() : ["gen1"];
    var cartes = cles.map(function (cle) {
      var d = MONDES_DITS[cle];
      // Un monde inscrit au registre sans phrase à lui porte son propre nom :
      // mieux vaut un intitulé brut qu'une case muette.
      var nom = d ? T(d.nom) : (W.PokeRegles.pour(cle).nom || cle);
      var dit = d ? T(d.dit) : "";
      return '<button type="button" class="pkdx-touche est-definitive" data-monde="' + esc(cle) + '">' +
        W.PokeIcones.svg("ball") + esc(nom) +
        (dit ? '<span class="pkdx-touche-note">' + esc(dit) + "</span>" : "") +
      "</button>";
    }).join("");
    coqueLibre(
      '<p class="pkdx-surtitre">' + T("mondeChoixSur") + "</p>" +
      '<h1 class="pkdx-titre">' + T("mondeChoixT") + "</h1>" +
      '<div class="pkdx-actions">' + cartes + "</div>" +
      '<p class="pkdx-dit">' + esc(T("mondeCommun")) + "</p>" +
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 ON ENTRAIT DANS LA CRÉATION SANS POUVOIR EN SORTIR — signalé par
      //     le propriétaire : « quand on lance l'aventure et qu'on doit
      //     choisir les 3 starters, on n'a pas la possibilité de revenir en
      //     arrière ». C'est vrai ICI AUSSI, un écran plus tôt : COMMENCER
      //     posait deux mondes et plus aucune porte. Le seul moyen de renoncer
      //     était de recharger la page.
      //  🔑 RIEN N'EST ENCORE ÉCRIT À CE STADE. La sauvegarde du voyage ne se
      //     pose qu'à la CARTE (`garderLeVoyage`) : un voyage laissé en plan
      //     survit à ce détour, et c'est ce qui rend le retour gratuit.
      //  ⚠️ Le gabarit est celui du compagnon et de la boîte : `est-discrete`,
      //     `T("retour")`. Trois écrans qui offrent la même sortie l'offrent
      //     avec le même bouton.
      // ═══════════════════════════════════════════════════════════════════
      '<div class="pkdx-actions"><button type="button" class="pkdx-touche est-discrete"' +
        ' id="pk-monde-non">' + esc(T("retour")) + "</button></div>"
    );
    surClic("[data-monde]", function (e) {
      son("PRESS_AB");
      mondeEnAttente = false;
      lancer(null, e.currentTarget.getAttribute("data-monde"));
    });
    surClic("#pk-monde-non", function () {
      son("PRESS_AB");
      mondeEnAttente = false;
      return accueil();
    });
  }

  // La porte du départ : deux mondes, on demande ; un seul, on part.
  function ouvrirDepart() {
    var cles = W.PokeRegles ? W.PokeRegles.cles() : ["gen1"];
    if (cles.length < 2) return lancer(null);
    ecranMonde();
  }

  function lancer(defi, monde) {
    //  🔴 UNE SEULE PORTE POSE LA DATE DE L'ESSAI, et c'est celle qui lance le
    //     voyage.
    //  ⚠️ UN ESSAI NEUF EFFACE CELUI D'AVANT, et une carrière libre n'efface
    //     RIEN. C'est le sens des deux emplacements : partir en voyage libre
    //     ne doit pas coûter l'essai du jour qu'on a laissé en route, pas plus
    //     que l'inverse. On n'efface donc qu'à l'endroit qui remplace.
    defiDate = defi || null;
    if (defi) W.PokeProgression.defiEffacer();
    demarrerPartie({
      genre: genreCompte(), nom: "", rival: "", regle: "voyage", compare: !!defi,
      // 🔴 LE MONDE VOYAGE DANS LA CONFIG, ET NULLE PART AILLEURS. C'est
      //    `PokePartie.creer` qui le scelle sur la partie ; le poser ici sur le
      //    registre aurait fait un second endroit où le jeu de règles se décide.
      //    ⚠️ Le défi du jour n'en reçoit pas : il compare des voyages, et deux
      //       mondes ne se comparent pas.
      regles: defi ? null : (monde || null),
      // 🔴 LA RÈGLE DU JOUR SE POSE AU DÉPART, PAS À L'ARRIVÉE. Elle change les
      //    dégâts, la capture et l'expérience : la poser plus tard donnerait un
      //    voyage dont la première moitié n'a pas suivi la règle annoncée.
      //    Elle ne vaut QUE pour le défi — une carrière libre n'a pas de date.
      regleDuJour: defi && W.PokeRegleDuJour ? (W.PokeRegleDuJour.pour(defi) || {}).id || null : null,
    });
  }

  //  🔴 LE DÉFI DU JOUR VERROUILLE LA RÈGLE. Nuzlocke et Express changent la
  //     difficulté : les proposer ferait comparer des voyages qui ne sont pas le
  //     même jeu. On retire le choix au lieu de le griser.
  //  🔴 ET LES RÈGLES SE DÉBLOQUENT. `progression.js` ouvre Express à quatre
  //     badges et Nuzlocke à une Ligue gagnée — depuis toujours, et AUCUN écran
  //     ne lisait `regles`. Les trois étaient offertes à tout le monde dès le
  //     premier voyage : le déblocage ne récompensait rien, et un joueur neuf
  //     recevait un choix qu'il ne pouvait pas comprendre.
  // ═══════════════════════════════════════════════════════════════════════════
  //  POSER UN SURNOM — UNE SEULE PORTE
  //
  //  🔴 J'AI RECOPIÉ CE NETTOYAGE, ET J'AI RECOPIÉ SA FAUTE AVEC. Le champ de
  //     surnom est né sur l'écran de capture ; en l'ajoutant au starter j'ai
  //     repris les mêmes six lignes — dont `[ -]`, la plage de l'espace au
  //     tiret, que je venais de corriger une heure plus tôt à l'autre endroit.
  //     « Bou'chon » serait redevenu « Bouchon », sur le seul Pokémon que tout
  //     le monde nomme.
  //     C'est la loi du dossier, payée une fois de plus : CE QUI EST RECOPIÉ
  //     DIVERGE. Un troisième écran de nom viendra ; il appellera cette
  //     fonction.
  //
  //  🔴 CE QU'ELLE GARANTIT : douze signes (le jeu d'origine en autorisait
  //     dix), aucun caractère de CONTRÔLE — la plage écrite en clair, jamais
  //     déduite — et pas de « surnom » qui répète le nom d'espèce, qui n'en est
  //     pas un.
  // ═══════════════════════════════════════════════════════════════════════════
  function poserSurnom(mon, champ) {
    if (!mon || !champ) return;
    var brut = String(champ.value || "");
    var propre = brut.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 12);
    if (!propre) return;
    var espece = ESP()[mon.n].nom[LANG()];
    if (propre.toLowerCase() === espece.toLowerCase()) return;
    mon.surnom = propre;
  }

  // La lecture qui va avec l'écriture. Une seule porte, elle aussi : les deux
  // écrans de nom la partagent, et le compte reste la seule source.
  function surnomDuCompte(n) {
    var p = W.PokeProgression;
    return (p && p.surnomConnu && p.surnomConnu(n)) || "";
  }

  function rivalDefautMonde(genre) {
    var cle = (partie && W.PokeRegles && W.PokeRegles.de) ? W.PokeRegles.de(partie)
      : (W.PokeRegles && W.PokeRegles.courant ? W.PokeRegles.courant() : "gen1");
    if (cle === "gen3") {
      var estFille = (genre === "f");
      var estAnglais = (LANG() === "en");
      if (estFille) {
        return estAnglais ? "BRENDAN" : "BRICE";
      } else {
        return estAnglais ? "MAY" : "FLORA";
      }
    }
    return T("rivalDefaut");
  }

  function creation(brouillonRepris) {
    var defi = !!(partie && partie.compare);
    // Le genre du compte est déjà connu : on ne le redemande pas à zéro.
    // 🔴 LE BROUILLON SURVIT À LA LENTILLE (13/08). Trouvé par l'auto-joueur,
    //    encore lui : la lentille rend maintenant au formulaire (v585), mais
    //    un `creation()` neuf reconstruisait un brouillon VIDE — le nom tapé
    //    disparaissait au retour du Pokédex. C'est la classe déjà payée deux
    //    fois sur cet écran (« le formulaire se vidait à chaque redessin ») :
    //    le retour transporte donc LE brouillon, tenu à jour à la frappe.
    var brouillon = (brouillonRepris && brouillonRepris.nom !== undefined)
      ? brouillonRepris
      : { genre: partie.genre || genreCompte(), nom: "", rival: "", regle: partie.regle || "voyage" };
    reprendreCreation = function () { creation(brouillon); };
    // ═══════════════════════════════════════════════════════════════════════
    //  LE NOM DU DERNIER VOYAGE REVIENT DANS LE CHAMP
    //
    //  🔴 « Il le gardera, même après ce voyage » : c'est ce que l'écran de
    //     capture PROMET. Le PC écrivait le surnom depuis toujours et personne
    //     ne le relisait — la phrase était fausse, et l'écriture qui marchait
    //     empêchait de s'en apercevoir. Voici le lecteur.
    //  ⚠️ Pré-rempli, jamais imposé : le joueur efface s'il veut un autre nom,
    //     et l'effacement TIENT (`retenir()` écrit "" sur le brouillon, qui
    //     n'est plus indéfini — le repli ne se rejoue donc pas au redessin).
    (function () {
      var s = partie.equipe && partie.equipe[0];
      var connu = s ? surnomDuCompte(s.n) : "";
      if (connu) brouillon.surnomStarter = connu;
    })();
    // Les règles ouvertes, lues sur le compte. Une seule ouverte = aucun choix
    // à poser : on n'affiche pas un groupe qui n'a qu'un bouton.
    var ouvertes = ["voyage", "nuzlocke", "express"].filter(function (r) {
      var reg = (W.PokeProgression.lire().regles) || { voyage: true };
      return !!reg[r];
    });
    // 🔴 L'ÉTAT SÉLECTIONNÉ N'EXISTAIT PAS À L'ÉCRAN. `aria-pressed` était posé
    //    sur le genre mais AUCUNE règle de la feuille ne le dessinait, et la
    //    règle de voyage ne le posait même pas. Résultat vérifié dans le
    //    navigateur : cliquer « DRESSEUSE » ou « NUZLOCKE » ne changeait
    //    strictement rien. Un choix qu'on ne voit pas est un choix qu'on refait.
    function choix(attribut, valeur, courant, libelle) {
      return '<button type="button" class="pkdx-touche" data-' + attribut + '="' + valeur + '"' +
        ' aria-pressed="' + (courant === valeur ? "true" : "false") + '">' + libelle + "</button>";
    }
    function rendre() {
      var maj = brouillon.regle.charAt(0).toUpperCase() + brouillon.regle.slice(1);
      coqueLibre(
        // ═══════════════════════════════════════════════════════════════════
        //  LE STARTER PRÉSIDE L'ÉCRAN DES NOMS (12/08, mandat onboarding :
        //  « trop austère, faut que ça donne envie direct »). On vient de le
        //  choisir — c'est lui, l'émotion de cet écran, pas le formulaire.
        //  MÊME composant que la porte d'entrée : médaillon, aura à son type,
        //  halo d'horizon porté par le médaillon. Aucun primitif neuf.
        // ═══════════════════════════════════════════════════════════════════
        // ═══════════════════════════════════════════════════════════════════
        //  LA FICHE DE DRESSEUR (rework structurel 12/08 — « rework les
        //  cases, la manière dont est agencée la page, TOUT »).
        //  Deux colonnes au bureau : à GAUCHE lui — le starter en scène, et
        //  SON nom sous lui, là où on le regarde ; à DROITE toi — genre, nom,
        //  rival. Les champs font la taille d'un NOM (dix caractères), plus
        //  jamais toute la page. Une colonne au téléphone, lui d'abord.
        // ═══════════════════════════════════════════════════════════════════
        '<div class="pkdx-noms">' +
        '<div class="pkdx-noms-lui">' +
        (function () {
          var s0 = partie.equipe && partie.equipe[0];
          if (!s0) return "";
          var e0 = ESP()[s0.n];
          return '<div class="pkdx-accueil-vitrine">' +
            medaillonAccueil(s0.n, false) + "</div>" +
            '<div class="pkdx-groupe">' +
              '<label class="pkdx-q" for="pk-surnom-starter">' +
                T("nomStarter", { nom: esc(e0.nom[LANG()]) }) + "</label>" +
              '<input id="pk-surnom-starter" class="pkdx-champ" maxlength="12"' +
                ' autocomplete="off" spellcheck="false" placeholder="' + esc(e0.nom[LANG()]) + '"' +
                ' value="' + esc(brouillon.surnomStarter || "") + '">' +
            "</div>";
        })() +
        "</div>" +
        '<div class="pkdx-noms-toi">' +
        '<p class="pkdx-surtitre">' + T(defi ? "defiSur" : surMonde()) + "</p>" +
        '<h1 class="pkdx-titre">' + T("genre") + "</h1>" +
        (defi ? '<p class="pkdx-dit">' + T("defiRegles") + "</p>" : "") +
        '<div class="pkdx-groupe"><div class="pkdx-actions">' +
          choix("genre", "h", brouillon.genre, T("garcon")) +
          choix("genre", "f", brouillon.genre, T("fille")) +
        "</div></div>" +
        '<div class="pkdx-groupe">' +
          '<label class="pkdx-q" for="pk-nom">' + T("tonNom") + "</label>" +
          '<input id="pk-nom" class="pkdx-champ" maxlength="10" value="' + esc(brouillon.nom) + '">' +
        "</div>" +
        '<div class="pkdx-groupe">' +
          // 🔴 LE JEU CONNAISSAIT LE NOM QU'IL POSERAIT, ET NE LE DISAIT PAS.
          //    Laisser le champ vide donne REGIS — le canon français, choisi et
          //    commenté vingt lignes plus bas — mais l'écran montrait une boîte
          //    vide sans un mot, à trois lignes d'un champ de surnom qui, lui,
          //    affiche SON repli en filigrane (« Salamèche »). Même écran, même
          //    geste, deux réponses : on tapait un nom au hasard faute de savoir
          //    qu'on pouvait ne rien taper.
          //    🔑 *Le repli se lit AVANT de valider, pas après.* C'est la classe
          //       de défaut n°1 du dossier : le jeu sait, et il ne dit pas.
          //    ⚠️ Un `placeholder`, pas une `value` : une valeur pré-remplie se
          //       fait effacer par qui veut son propre nom, et le repli ne
          //       s'appliquerait plus.
          '<label class="pkdx-q" for="pk-rival">' + T("nomRival") + "</label>" +
          '<input id="pk-rival" class="pkdx-champ" maxlength="10" placeholder="' +
            esc(rivalDefautMonde(brouillon.genre)) + '" value="' + esc(brouillon.rival) + '">' +
        "</div>" +
        "</div>" +
        "</div>" +
        // ═══════════════════════════════════════════════════════════════════
        //  ET LUI ? — LE POKÉMON QU'ON NOMME LE PLUS
        //
        //  🔴 LE STARTER NE PASSAIT PAR AUCUN ÉCRAN DE NOM. Le champ de surnom
        //     est né à la CAPTURE, et le commentaire de cet écran-là le dit :
        //     « le starter ne compte pas, il est donné, pas attrapé ». Or c'est
        //     précisément celui que tout le monde nomme — il traverse le voyage
        //     entier, il ouvre la Ligue, il finit sur la carte de partage.
        //  🔴 ET SA PLACE EST ICI, PAS AILLEURS. Cet écran vient APRÈS le choix
        //     du starter — c'est la refonte du 08/08, écrite en toutes lettres
        //     vingt lignes plus bas : « le nom se demande une fois qu'il y a
        //     quelque chose à nommer ». Toi, ton rival, et lui : trois noms, un
        //     seul écran, et le voyage commence.
        // ═══════════════════════════════════════════════════════════════════
        //  Le champ du surnom vit désormais SOUS le starter, colonne gauche de
        //  la fiche (rework 12/08) — on nomme la créature là où on la regarde.
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 « OÙ EST PASSÉ LE MODE NUZLOCKE ? » — le propriétaire, qui ne
        //     l'avait jamais vu. L'écran ne montrait QUE les règles ouvertes :
        //     tant que la Ligue n'était pas franchie, rien ne disait que le
        //     Nuzlocke existe ni comment l'avoir. *Un déblocage qui ne
        //     s'annonce pas n'existe pas* — la faute n°1 du dossier, encore.
        //  ✅ Les règles fermées se montrent, éteintes, avec leur PRIX :
        //     « Franchis la Ligue » / « Décroche 4 badges ». Une porte fermée
        //     qui dit sa clé est une raison de rejouer ; une porte invisible
        //     n'est rien.
        //  ⚠️ Dès qu'il existe une règle fermée, le groupe se montre — même
        //     quand une seule est ouverte : c'est là que la promesse sert.
        // ═══════════════════════════════════════════════════════════════════
        (defi ? "" :
          '<div class="pkdx-groupe">' +
            '<p class="pkdx-q">' + T("regle") + "</p>" +
            '<div class="pkdx-actions">' +
              ["voyage", "nuzlocke", "express"].map(function (r) {
                if (ouvertes.indexOf(r) >= 0) {
                  return choix("regle", r, brouillon.regle,
                    T("r" + r.charAt(0).toUpperCase() + r.slice(1)));
                }
                return '<span class="pkdx-touche est-fermee" aria-disabled="true">' +
                  T("r" + r.charAt(0).toUpperCase() + r.slice(1)) +
                  '<span class="pkdx-touche-note">' +
                    T(r === "nuzlocke" ? "ouvreNuzlocke" : "ouvreExpress") + "</span></span>";
              }).join("") +
            "</div>" +
            '<p class="pkdx-dit">' + T("d" + maj) + "</p>" +
          "</div>") +
        // ═══════════════════════════════════════════════════════════════════
        //  LE SCEAU — IL N'APPARAÎT QU'UNE FOIS LA LIGUE FRANCHIE
        //
        //  🔴 IL SE TAIT TANT QU'IL NE SERT À RIEN. Montrer huit paliers
        //     verrouillés à qui n'a jamais gagné, c'est afficher sept portes
        //     fermées sur l'écran de départ — le mode a déjà refusé « une porte
        //     qui ouvre sur du vide est un clic volé ».
        //  🔴 ET IL NE PARAÎT JAMAIS AU DÉFI DU JOUR : on s'y compare, donc
        //     tout le monde y joue le même palier.
        // ═══════════════════════════════════════════════════════════════════
        (function () {
          if (defi || !W.PokeSceaux) return "";
          var maxi = W.PokeProgression.lire().sceauMax || 0;
          if (!maxi) return "";
          var choisi = brouillon.sceau || 0;
          var cases = ['<button type="button" class="pkdx-touche' +
            (choisi === 0 ? " est-choisi" : "") + '" data-sceau="0">0</button>'];
          for (var s = 1; s <= maxi; s++) {
            cases.push('<button type="button" class="pkdx-touche' +
              (choisi === s ? " est-choisi" : "") + '" data-sceau="' + s + '">' + s + "</button>");
          }
          var d = choisi ? W.PokeSceaux.de(choisi) : null;
          return '<div class="pkdx-groupe">' +
            '<p class="pkdx-q">' + T("sceau") + "</p>" +
            '<div class="pkdx-actions pkdx-sceaux">' + cases.join("") + "</div>" +
            '<p class="pkdx-dit">' + (d
              ? esc(d.nom[LANG()]) + " — " + T("sceauCumul", { n: choisi })
              : T("sceauAucun")) + "</p>" +
            // ═══════════════════════════════════════════════════════════════
            //  🔴 IL AFFICHAIT UNE RÈGLE SUR N. La phrase juste au-dessus dit
            //     « les {n} premières règles s'appliquent ENSEMBLE », et
            //     l'écran n'imprimait que celle du palier choisi. Au sceau 5,
            //     quatre règles décidaient du voyage sans jamais paraître —
            //     sur l'écran où l'on choisit sa difficulté, et alors qu'elles
            //     sont dans la table à une boucle de là. Contenu écrit et
            //     jamais montré, la classe n°1.
            //  ⚠️ De 1 au palier choisi, dans l'ordre : c'est ainsi qu'elles
            //     s'empilent, et l'ordre porte le durcissement.
            // ═══════════════════════════════════════════════════════════════
            (d ? '<ul class="pkdx-sceau-regles">' + (function () {
              var lignes = [];
              for (var q = 1; q <= choisi; q++) {
                var r = W.PokeSceaux.de(q);
                if (!r) continue;
                lignes.push('<li class="pkdx-dit' + (q === choisi ? " est-alerte" : "") + '">' +
                  esc(r.dit[LANG()]) + "</li>");
              }
              return lignes.join("");
            })() + "</ul>" : "") +
          "</div>";
        })() +
        // 🔴 UN NOM VIDE PASSAIT. L'en-tête affichait alors « POKÉDEX » à la
        //    place du dresseur, et la Vitrine sortait une carte anonyme. Le
        //    bouton se refuse ET DIT POURQUOI : un bouton grisé sans raison se
        //    lit comme un bug, c'est la classe de défaut n°1 du projet.
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-suite"' +
            (brouillon.nom.trim() ? "" : " disabled") + ">" + T("suite") + "</button>" +
          // ⚠️ MAIS IL NE LE DIT PAS AVANT QU'ON AIT ESSAYÉ. À l'arrivée sur
          //    l'écran, « Il te faut un nom pour partir. » s'affichait en rouge
          //    à côté du bouton — on grondait le joueur pour une faute qu'il
          //    n'avait pas encore eu l'occasion de commettre, sur le tout
          //    premier écran du jeu. Le bouton reste grisé (c'est honnête), la
          //    RAISON attend qu'on ait touché le champ. Un refus expliqué
          //    répond à une question ; posé d'avance, c'est un reproche.
          // 🔴 ELLE ÉTAIT CACHÉE JUSQU'AU FOCUS DU CHAMP, ET LE BOUTON EST
          //    `disabled` : un clic dessus ne déclenche RIEN, donc un joueur
          //    qui presse le bouton rouge n'obtient ni mouvement, ni message,
          //    ni curseur. Un QA d'onboarding l'a lu comme « le jeu est
          //    cassé ». La loi du mode est pourtant écrite ailleurs et tenue
          //    partout — « ÉQUIPE : tu n'as personne d'autre », « Potion : il
          //    est déjà au maximum » : un bouton grisé DIT sa raison.
          //    ⚠️ Elle ne paraît que si le champ est vide, et elle s'éteint dès
          //       qu'on tape : affichée en permanence, elle deviendrait un
          //       décor, et la loi du mode le refuse aussi.
          // 🔴 ET LES DEUX AVERTISSEMENTS CI-DESSUS SE CONTREDISENT. Le premier
          //    dit « la raison attend qu'on ait touché le champ », le second
          //    « elle paraît dès que le champ est vide » — c'est le second qui
          //    tenait le code, donc un « Il te faut un nom pour partir. » EN
          //    ROUGE accueillait tout nouveau joueur sur le tout premier écran
          //    du jeu, avant qu'il ait pu taper une lettre. Le mandat vise
          //    exactement ça : un onboarding qui donne envie.
          // ✅ LES DEUX ONT RAISON, ET ON PEUT TENIR LES DEUX. La raison reste
          //    cachée à l'arrivée ; elle paraît dès que le joueur a ESSAYÉ —
          //    en touchant le champ, ou en cliquant sur le bouton refusé. Ce
          //    second geste est le point qui manquait : un bouton `disabled`
          //    n'émet aucun clic, mais son PARENT en émet un, et c'est là qu'on
          //    l'écoute. Le refus répond alors à une question au lieu de
          //    devancer une faute.
          // ⚠️ `aria-live` PARCE QUE CETTE PHRASE PARAÎT SANS QUE RIEN NE BOUGE.
          //    Les deux autres `pkdx-raison` du mode sont là au premier rendu ;
          //    celle-ci naît d'un geste — un clic sur un bouton refusé, qui ne
          //    déplace donc PAS le focus. Sans annonce, le joueur au lecteur
          //    d'écran presse le bouton et n'obtient toujours rien.
          '<p class="pkdx-raison" id="pk-raison" aria-live="polite" hidden="hidden">' + T("nomRequis") + "</p>" +
        "</div>"
      );
      // 🔴 LE REFUS SE LÈVE PENDANT LA FRAPPE, PAS AU PROCHAIN RENDU. Redessiner
      //    l'écran à chaque touche ferait perdre le curseur ; on met donc à jour
      //    le seul bouton concerné. Sans ça, on tape son nom et le bouton reste
      //    gris — un refus qui ne se lève jamais est pire qu'aucun refus.
      var champNom = racine.querySelector("#pk-nom");
      champNom.addEventListener("input", function () {
        brouillon.nom = champNom.value;
        var pret = !!brouillon.nom.trim();
        racine.querySelector("#pk-suite").disabled = !pret;
        racine.querySelector("#pk-raison").hidden = pret;
      });
      // 🔴 LA RAISON APPARAÎT QUAND ON A ESSAYÉ, PAS AVANT. Toucher le champ
      //    est l'essai : le joueur a compris qu'on lui demandait quelque chose,
      //    la phrase l'aide alors au lieu de le devancer.
      //    ⚠️ Et elle reste posée s'il repart en laissant le champ vide — un
      //       refus qui disparaît au premier clic ailleurs redevient un bouton
      //       grisé sans raison, la classe de défaut n°1 du projet.
      champNom.addEventListener("focus", function () {
        if (!champNom.value.trim()) racine.querySelector("#pk-raison").hidden = false;
      });
      // 🔴 ET PRESSER LE BOUTON REFUSÉ EST AUSSI UN ESSAI — c'est même le plus
      //    probable : un joueur qui ne comprend pas ce qu'on lui demande vise
      //    le gros bouton rouge. Chrome n'émet aucun clic sur un `disabled`,
      //    donc on écoute le PIED qui le contient. Sans ça, le seul geste
      //    naturel du joueur restait sans réponse — la lecture « le jeu est
      //    cassé » d'un QA d'onboarding.
      var pied = racine.querySelector(".pkdx-actions.est-pied");
      if (pied) pied.addEventListener("click", function () {
        if (!champNom.value.trim()) racine.querySelector("#pk-raison").hidden = false;
      });
      // 🔴 TROUVÉ PAR L'AUTO-JOUEUR DOM, ET C'EST UN VRAI DÉFAUT DE JEU : sans
      //    cette ligne, changer de genre ou de règle REDESSINE l'écran et efface
      //    le nom qu'on venait de taper. Un joueur écrit son nom, choisit
      //    Nuzlocke, et son nom a disparu. Aucun contrôle statique ne voit ça —
      //    seul un auto-joueur qui clique vraiment le trouve.
      function retenir() {
        var n = racine.querySelector("#pk-nom"), r = racine.querySelector("#pk-rival");
        if (n) brouillon.nom = n.value;
        if (r) brouillon.rival = r.value;
        // ⚠️ LE SURNOM AUSSI. Le genre, la règle et le sceau redessinent l'écran ;
        //    un champ que `retenir()` oublie est effacé au premier de ces clics.
        //    C'est la faute que l'auto-joueur avait déjà trouvée sur le nom et
        //    sur le rival — on ne la repaie pas sur le troisième champ.
        var s = racine.querySelector("#pk-surnom-starter");
        if (s) brouillon.surnomStarter = s.value;
      }
      moissonAvantSortie = retenir;
      surClic("[data-genre]", function (e) { retenir(); brouillon.genre = e.currentTarget.getAttribute("data-genre"); rendre(); });
      surClic("[data-regle]", function (e) { retenir(); brouillon.regle = e.currentTarget.getAttribute("data-regle"); rendre(); });
      // Le sceau se choisit comme le genre et la règle : il redessine, donc il
      // passe par `retenir()` — sans quoi il effacerait le nom, la faute que
      // l'auto-joueur avait trouvée sur les deux autres.
      surClic("[data-sceau]", function (e) {
        retenir();
        brouillon.sceau = +e.currentTarget.getAttribute("data-sceau");
        rendre();
      });
      racine.querySelector("#pk-suite").addEventListener("click", function () {
        // 🔴 LA CRÉATION NE CRÉE PLUS LA PARTIE : elle la CORRIGE. La partie
        //    existe depuis le laboratoire — c'est elle qui porte le starter
        //    déjà choisi et la graine déjà tirée. La recréer ici effacerait le
        //    Pokémon que le joueur vient de prendre, et retirerait un tirage.
        partie.nom = racine.querySelector("#pk-nom").value.trim();
        // 🔴 UN RIVAL SANS NOM DEVENAIT « Ton rival » — vu en jouant : le champ
        //    laissé vide, l'écran d'arène disait « DÉFIER Ton rival », le repli
        //    du titre promu nom propre. Le jeu de 1996 ne laisse jamais le
        //    rival sans nom : il en propose. On pose le canon français, REGIS —
        //    et le joueur qui veut un autre nom l'écrit, comme avant.
        //    ⚠️ Le NOM du joueur, lui, reste exigé — la garde du bouton SUITE
        //       (« Il te faut un nom pour partir ») existe déjà et c'est le bon
        //       choix : le nom du joueur est identitaire, celui du rival est
        //       secondaire. Pas de repli pour l'un, un repli pour l'autre.
        partie.rival = racine.querySelector("#pk-rival").value.trim() || rivalDefautMonde(brouillon.genre);
        partie.genre = brouillon.genre;
        if (!partie.compare) partie.regle = brouillon.regle;
        // 🔴 LE SCEAU SE POSE SUR LA PARTIE, ET JAMAIS AU DÉFI DU JOUR. C'est
        //    `partie.sceau` que lit `SERM()` ; sans cette ligne le choix se
        //    serait affiché sans rien changer — un réglage décoratif, la faute
        //    que ce dossier traque partout.
        partie.sceau = partie.compare ? 0 : (brouillon.sceau || 0);
        // Une seule porte pour tous les surnoms : voir `poserSurnom`.
        poserSurnom(partie.equipe && partie.equipe[0], racine.querySelector("#pk-surnom-starter"));
        W.POKE_GENRE = partie.genre;
        son("PRESS_AB");
        choixCompagnon();
      });
    }
    rendre();
  }

  function demarrerPartie(config) {
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 TOUTES LES PARTIES D'UN MÊME JOUEUR ÉTAIENT LA MÊME PARTIE. La graine
    //    de carrière libre valait « POKE-LIBRE-<nom>-<règle> » : pas une
    //    horloge, pas un tirage — deux fois le même nom, deux fois la même
    //    carte, les mêmes rencontres, les mêmes butins, jusqu'au bout. Dans un
    //    roguelite, c'est le défaut le plus grave qui soit : il n'y a plus rien
    //    à rejouer.
    //    Le commentaire qui tenait ici promettait pourtant « l'horloge du
    //    client ». Il décrivait une intention, pas le code — et personne ne l'a
    //    vu parce que six parties identiques ressemblent à six parties.
    //    Trouvé en mesurant : six voyages d'affilée arrivaient devant Koga avec
    //    exactement « Florizarre N.45, Évoli N.25 ».
    // 🔴 LE DÉFI DU JOUR NE BOUGE PAS : `POKE_GRAINE` reste maître quand le
    //    serveur l'impose, sinon tout le monde n'aurait plus la même carte.
    // ═══════════════════════════════════════════════════════════════════════
    var graine = W.POKE_GRAINE || ("POKE-LIBRE-" + Date.now().toString(36) +
      "-" + Math.floor(Math.random() * 1e9).toString(36));
    hasard = new W.PokeHasard(graine);
    journal = [];
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LA QUALIFICATION À LA CHASSE À MEW SE LIT ICI, UNE FOIS. Elle porte
    //     sur le COMPTE (les 150 obtenables capturés), pas sur le voyage —
    //     donc elle ne peut pas se relire en cours de route sans faire
    //     apparaître Mew au milieu d'une partie commencée sans lui.
    //  🔴 ET JAMAIS AU DÉFI DU JOUR. `POKE_GRAINE` veut dire « tout le monde
    //     joue le même monde » : un acquis hors partie qui ajoute une chasse à
    //     certains seulement casserait la seule chose que ce mode compare.
    //     C'est la règle que le voyage n'a jamais pliée, et elle vaut ici.
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 ET JAMAIS HORS DE KANTO. La chasse à Mew est un mythe de 1996 : elle
    //     se pose sur une étape du voyage de Kanto, et le diplôme qui l'ouvre
    //     compte 150 espèces sur 151. Sous un autre monde, elle chercherait une
    //     étape qui n'existe pas — un contenu écrit, jamais montré, et une
    //     qualification comptée sur le mauvais total.
    //  🔴 [24/08] PLUS « LE MONDE DE MEW », MAIS « LE MONDE A-T-IL UN
    //     MYTHIQUE ». La chasse etait fermee a tout ce qui n'etait pas Kanto,
    //     par un test sur le monde par DEFAUT. Le proprietaire a demande
    //     Celebi ; ouvrir un second cas a cote du premier aurait fait deux
    //     chasses a tenir d'accord. Un monde dit qui est son mythique, et la
    //     chasse suit -- le troisieme monde n'aura rien a rebrancher.
    //  ⚠️ LE SEUIL AUSSI SUIT LE MONDE : `diplome()` compte desormais les
    //     especes obtenables DE CE MONDE-LA. C'est ce qui a ete corrige ce
    //     soir apres le signalement de Syrean.
    //  On lit le jeu PAR SON NOM, sans deplacer celui de l'onglet : `poser`
    //  n'a lieu qu'a `prendreLaPartie`, plus bas. Meme porte que `creer`.
    var jeuChoisi = W.PokeRegles
      ? W.PokeRegles.pour(config.regles || W.PokeRegles.DEFAUT) : null;
    var aUnMythique = !!(jeuChoisi && jeuChoisi.mythique && jeuChoisi.mythique());
    config.mew = aUnMythique && !W.POKE_GRAINE && !!(W.PokeProgression &&
      W.PokeProgression.diplome &&
      W.PokeProgression.diplome(config.regles || (W.PokeRegles && W.PokeRegles.DEFAUT)).atteint);
    // Un nouveau départ n'hérite pas de l'étape de création du précédent.
    reprendreCreation = null;
    moissonAvantSortie = null;
    prendreLaPartie(P().creer(config, hasard));
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LES SERMENTS SOUS VERROU S'OUVRENT ICI, UNE FOIS, AU DÉPART. Les lire
    //    à chaque badge aurait fait apparaître en cours de route un serment
    //    ouvert par une chasse accomplie… dans ce même voyage. Le pool doit
    //    être fixé quand le voyage commence, sinon il n'est plus le même monde
    //    du début à la fin.
    // 🔴 LE DÉFI DU JOUR N'EN REÇOIT AUCUN, et c'est la règle que ce mode n'a
    //    jamais pliée : aucun acquis hors partie ne pèse là où l'on se compare.
    //    `POKE_GRAINE` est posée par le serveur pour le défi, et seulement là.
    // ═══════════════════════════════════════════════════════════════════════
    partie.sermentsOuverts = W.POKE_GRAINE ? {} : W.PokeProgression.sermentsOuverts();
    // La graine voyage déjà avec la partie : `creer` pose `graine: h.source`.
    // Une seconde ligne ici ferait deux portes pour un seul fait.

    // 🔴 CE QU'ON POUVAIT CHOISIR AU DÉPART, GARDÉ AVANT LA PREMIÈRE CAPTURE.
    //    Sans cette photo, l'écran de fin ne peut pas dire ce que le voyage a
    //    OUVERT : la progression est déjà fusionnée quand il s'affiche, donc
    //    tout paraît acquis depuis toujours. Un déblocage qu'on ne voit pas
    //    arriver ne récompense rien.
    partie.vivierDepart = W.PokeDepart ? W.PokeDepart.vivier() : [];
    // 🔴 MÊME PHOTO, POUR LE POKÉDEX DU COMPTE (mandat courbe de progression,
    //    12/08). L'écran de fin disait le TOTAL (« Ton compte : 87 sur 151 »)
    //    mais jamais ce que CE voyage venait d'y ajouter — la récompense du
    //    grind qu'on vient de faire, à l'instant où l'on décide de relancer.
    //    La fusion précède l'écran : sans photo, le delta est incalculable.
    partie.pokedexAvant = {};
    (function () {
      var cpt = W.PokeProgression ? W.PokeProgression.lire() : null;
      if (cpt && cpt.pris) for (var pn in cpt.pris) partie.pokedexAvant[pn] = true;
    })();
    // ⚠️ Les infobulles sont déjà branchées : `prendreLaPartie` s'en charge
    //    pour les DEUX entrées. L'appel qui vivait ici ne couvrait que celle-ci.
    choixStarter();
  }

  // ── Le starter ─────────────────────────────────────────────────────────────
  function choixStarter() {
    // 🔴 LE MOMENT LE PLUS ICONIQUE DE POKÉMON, et il sortait en trois sprites
    //    de 60 px dans des cases grises, sous un mur de texte. On lui donne
    //    l'écran : l'artwork officiel en grand, le nom, les types. La carte
    //    prend la TEINTE DU PREMIER TYPE — la couleur nomme donc quelque chose,
    //    et c'est exactement ce que la loi du mode demande.
    // 🔴 LE VIVIER S'ÉLARGIT AVEC LE POKÉDEX. Capturer une première forme
    //    l'ouvre comme départ : c'est ce qui fait qu'une capture COMPTE au-delà
    //    du compteur, et c'est le seul lien entre deux parties.
    var ouverts = W.PokeDepart.vivier({ compare: !!partie.compare });
    var d = W.PokeDepart.compte();
    var carte = function (n) {
      var e = ESP()[n];
      return '<button type="button" class="pkdx-starter" data-n="' + n + '"' +
          W.PokeType.attr(e.types[0]) + ">" +
        '<img alt="' + esc(e.nom[LANG()]) + '" src="assets/img/poke/art/' + n + '.webp" ' +
          'onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(n) + '\'">' +
        "<b>" + esc(e.nom[LANG()]) + "</b>" +
        // 🔴 `{info:true}` — ET C'EST LE PREMIER ÉCRAN DE JEU. Les pastilles
        //    n'ouvraient AUCUNE bulle ici, alors que le bâtisseur est écrit et
        //    parfait : « Roche — efficace contre Vol Insecte Feu Glace · craint
        //    Combat Sol Eau Plante ». L'écran annonce « le premier badge est
        //    gardé par Pierre. ROCHE » et laisse le débutant décider sans
        //    pouvoir savoir ce que ROCHE implique.
        //    ⚠️ On ne conseille toujours PAS de starter — l'intention est
        //       assumée trois lignes plus bas. On donne la table des types, le
        //       joueur tranche. C'est exactement « qu'est-ce que c'est ? à quoi
        //       ça sert ? », et la réponse existait déjà.
        '<span class="pkdx-starter-types">' +
          e.types.map(function (t) { return W.PokeType.pastille(t, { info: true }); }).join("") +
        "</span>" +
      "</button>";
    };
    // Les trois du canon d'un côté, ce qu'on a gagné de l'autre. La section qui
    // n'a personne ne s'affiche pas : une porte qui s'ouvre sur rien apprend au
    // joueur à ne plus la regarder.
    var deChen = [], gagnes = [], canonDuMonde = W.PokeDepart.CANON();
    for (var iv = 0; iv < ouverts.length; iv++) {
      (canonDuMonde.indexOf(ouverts[iv]) >= 0 ? deChen : gagnes).push(ouverts[iv]);
    }
    var grille = function (titre, liste) {
      if (!liste.length) return "";
      return '<h2 class="pkdx-intertitre">' + titre + "</h2>" +
        '<div class="pkdx-starters">' + liste.map(carte).join("") + "</div>";
    };
    var cases = grille(T("starterDeChen"), deChen) +
      grille(T("ouvertParToi") + " · " + gagnes.length, gagnes) +
      // ═══════════════════════════════════════════════════════════════════
      // 🔴 UN SEUL TOUCHER ENGAGEAIT LE PREMIER CHOIX DU JEU — signalé par le
      //    propriétaire : « si on se trompe on est foutu, en tout cas sur
      //    mobile ». Il a raison, et c'est le pire endroit possible : trois
      //    cartes côte à côte dans 360 px, un doigt, et un voyage entier
      //    décidé sans retour — avant même que le joueur ait rien appris.
      //    Vérifié : après le clic, l'écran suivant annonçait déjà « LE TIEN »
      //    et le seul bouton était SUITE.
      // ✅ DEUX TEMPS. Le premier toucher SÉLECTIONNE — on peut en toucher un
      //    autre autant qu'on veut —, un bouton nommé engage. Le mode a déjà ce
      //    vocabulaire : ce qui ne se reprend pas se DIT avant, pas après.
      // ⚠️ Le bouton porte le NOM choisi. « Confirmer » demanderait au joueur
      //    de se rappeler ce qu'il vient de toucher ; « Je prends Salamèche »
      //    lui montre la réponse.
      // ═══════════════════════════════════════════════════════════════════
      '<div class="pkdx-actions est-pied" id="pk-starter-pied"></div>' +
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 ET ON NE POUVAIT PAS RENONCER — signalé par le propriétaire :
      //     « quand on lance l'aventure et qu'on doit choisir les 3 starters,
      //     on n'a pas la possibilité de revenir en arrière ». Le laboratoire
      //     était un cul-de-sac : trois cartes, et pour en sortir, recharger
      //     la page. Le mode a pourtant fait de ce moment un choix à DEUX
      //     TEMPS pour qu'on puisse changer d'avis — changer d'avis entre les
      //     trois, mais pas sur le fait d'être là.
      //  🔑 RIEN N'EST PERDU EN PARTANT. La sauvegarde ne se pose qu'à la
      //     carte : un voyage laissé en plan attend toujours à l'accueil.
      //  ⚠️ CE BOUTON VIT HORS DU PIED. `#pk-starter-pied` est RÉÉCRIT en
      //     entier au premier toucher d'une carte — l'y mettre l'aurait fait
      //     disparaître à la seconde où le joueur hésite, c'est-à-dire au seul
      //     moment où il en a besoin.
      //  ⚠️ On revient d'un cran, pas jusqu'à l'accueil : sous deux mondes,
      //     l'écran d'avant est « Où pars-tu ? », et c'est souvent ce qu'on
      //     voulait corriger. Sous un seul monde, il n'y a rien entre les deux.
      //  ⚠️ ET IL SE POSE EN BAS DE COLONNE, PAS ICI. Vu en photo à 360 px :
      //     glissé juste sous le pied, il s'intercalait entre « Je prends
      //     Bulbizarre » et la phrase qui l'explique — une porte de sortie au
      //     milieu d'une phrase. Le retour se lit APRÈS tout le reste : c'est
      //     le dernier recours, pas une option de la décision.
      // ═══════════════════════════════════════════════════════════════════
      "";
    coqueLibre(
      // Le sur-titre est une ÉTIQUETTE, pas une phrase : en capitales espacées,
      // une phrase entière devient pénible à lire. Le récit va sous le titre.
      '<p class="pkdx-surtitre">' + T("labo") + "</p>" +
      '<h1 class="pkdx-titre">' + T("starter") + "</h1>" +
      // ═══════════════════════════════════════════════════════════════════
      //  RECOMPOSITION 12/08 (« toutes les pages d'onboarding ») : le CHOIX
      //  au centre, la FICHE DU VOYAGE en rail à droite (Pierre, la version
      //  et ses visages). La notice ne repousse plus les créatures ni le
      //  bouton — elle accompagne. Une colonne au téléphone, le choix d'abord.
      // ═══════════════════════════════════════════════════════════════════
      '<div class="pkdx-depart-double">' +
      '<div class="pkdx-depart-main">' +
      // ═══════════════════════════════════════════════════════════════════
      // 🔴 LE LABORATOIRE N'AVAIT PAS DE SCÈNE. Le premier écran jouable du
      //    voyage annonçait « Choisis ton premier Pokémon » et posait trois
      //    cases — alors que `POKE_SCENARIO.CHEN` porte la scène entière :
      //    le Pokédex qu'on te tend, les trois Poké Balls sur la table, le
      //    rival qui prend celui qui bat le tien, et l'adieu.
      //    Quatre lignes écrites pour la minute qui décide si l'on joue, et
      //    rangées dans un fichier que personne ne lisait.
      // ═══════════════════════════════════════════════════════════════════
      '<p class="pkdx-dit">' + esc(W.PokeGenre.pour(W.POKE_SCENARIO.CHEN, "remise", null, "scenario:chen")) + "</p>" +
      '<p class="pkdx-dit">' + esc(W.PokeGenre.pour(W.POKE_SCENARIO.CHEN, "choixStarter", null, "scenario:chen")) + "</p>" +
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 LA PREMIÈRE DÉCISION DU JEU SE PRENAIT À L'AVEUGLE — relevé en
      //     JOUANT, pas en relisant. L'écran posait trois Pokémon et leurs
      //     types, et rien d'autre : aucune raison de préférer l'un. Trois pas
      //     plus loin, la carte d'acte annonce « Au bout : Pierre · ROCHE » —
      //     le jeu SAVAIT, et il l'a dit trop tard pour que ça serve. En
      //     jouant, j'ai pris Salamèche contre un Champion Roche.
      //  ⚠️ On nomme le Champion et son TYPE, jamais le bon starter : « Pierre,
      //     ROCHE » se juge ; « prends Carapuce » choisit à la place du joueur.
      //     L'écran de compagnon a déjà coûté cette leçon au dossier.
      //  ⚠️ Rien au Défi du jour : la première arène y est la même pour tous.
      // ═══════════════════════════════════════════════════════════════════
      // 🔴 LE CHOIX D'ABORD. Il était enseveli sous six paragraphes sur les
      //    versions : le joueur devait lire un mode d'emploi avant de vivre la
      //    scène. La notice vit dans le RAIL, à côté — plus jamais devant.
      cases +
      //  🔴 LA PHRASE-RÈGLEMENT EST MORTE (rejetée DEUX fois par le proprio :
      //     « 3 sur 75 » puis sa réécriture). UNE promesse, sans un seul
      //     nombre. Le compte vit déjà dans « OUVERT PAR TOI · n ».
      (partie.compare
        ? '<p class="pkdx-dit">' + T("departCompare") + "</p>"
        : '<p class="pkdx-dit">' + T("departOuverts") + "</p>") +
      //  La porte de sortie du laboratoire — voir la note posée plus haut, à
      //  l'endroit où elle NE doit pas être.
      '<div class="pkdx-actions"><button type="button" class="pkdx-touche est-discrete"' +
        ' id="pk-starter-non">' + esc(T("retour")) + "</button></div>" +
      "</div>" +
      '<aside class="pkdx-depart-fiche">' +
      (function () {
        if (partie.compare || !ARENES()) return "";
        var a = null;
        for (var i = 0; i < ARENES().length; i++) {
          if (ARENES()[i].ordre === 1) a = ARENES()[i];
        }
        if (!a) return "";
        //  Le visage de Pierre : la première menace du voyage se montre —
        //  même pont que la carte d'acte et l'arène.
        return '<p class="pkdx-dit pkdx-depart-mur">' +
          visage(VISAGE_ARENE()[0], 44) +
          esc(T("departPremier", { nom: W.PokeGenre.nomChampion(a) })) + " " +
          W.PokeType.pastille(W.PokeType.id(a.type), { info: true, seule: true }) + "</p>";
      })() +
      // 🔴 LA VERSION EST SCELLÉE PAR LA GRAINE, et elle décide de ce qu'on
      //    pourra croiser. Elle s'affiche DÈS LA CRÉATION : la découvrir en
      //    cours de partie se lirait comme un tour de passe-passe.
      //  ✅ Et elle se MONTRE : les visages des exclusifs de TA version. Les
      //     absents restent du texte éteint.
      // 🔴 TOUTE CETTE NOTICE PARLE D'UN CHOIX ENTRE DEUX VERSIONS. Sous un
      //    monde qui n'en a qu'une, elle promettrait un tirage qui n'a pas lieu
      //    et nommerait des absents qui n'existent pas. On ne l'affiche pas :
      //    un écran qui n'a rien à dire se tait.
      (function () {
        var vs = (W.PokeRegles && W.PokeRegles.versions()) || ["rouge", "bleu"];
        if (vs.length < 2) return "";
        var autre = vs[0] === partie.version ? vs[1] : vs[0];
        return '<div class="pkdx-notice">' +
          "<p><b>" + T("version") + " " + W.PokeGenre.version(partie.version) + "</b> — " + T("versionQuoi") + "</p>" +
          "<p>" + T("versionIci") + " :</p>" +
          '<div class="pkdx-version-faces">' +
            exclusifs(partie.version).map(function (nv) {
              return '<figure class="pkdx-version-face">' +
                '<img alt="" loading="lazy" src="' + W.PokeSprites.face(nv, "?i=6") + '">' +
                "<figcaption>" + esc(ESP()[nv].nom[LANG()]) + "</figcaption></figure>";
            }).join("") +
          "</div>" +
          "<p>" + T("versionPas") + " : " + esc(exclusifs(autre)
            .map(function (nv) { return ESP()[nv].nom[LANG()]; }).join(", ")) + ".</p>" +
          "<p>" + T("versionPourquoi") + "</p>" +
        "</div>";
      })() +
      "</aside>" +
      "</div>"
    );
    //  La porte de sortie du laboratoire. Un cran en arrière : le choix du
    //  monde s'il y en a deux, l'accueil sinon. Le Défi du jour n'a pas de
    //  choix de monde — il compare des voyages — donc il rentre à l'accueil.
    surClic("#pk-starter-non", function () {
      son("PRESS_AB");
      partie = null;
      var duDefi = !!defiDate;
      //  ⚠️ LES DEUX S'ÉTEIGNENT ENSEMBLE — la règle est écrite au bouton
      //     REPRENDRE : la graine imposée dit « on est au défi », la date dit
      //     duquel. En laisser une allumée sur une création qu'on vient de
      //     quitter ferait garder une carrière libre dans l'emplacement de
      //     l'essai du jour.
      W.POKE_GRAINE = null;
      defiDate = null;
      var cles = W.PokeRegles ? W.PokeRegles.cles() : ["gen1"];
      if (!duDefi && cles.length > 1) return ecranMonde();
      return accueil();
    });
    // Le premier toucher ne fait que DÉSIGNER : il marque la carte et arme le
    // bouton. Toucher une autre carte change d'avis, sans rien engager.
    var choisi = null;
    var pied = racine.querySelector("#pk-starter-pied");
    surClic("[data-n]", function (e) {
      var n = +e.currentTarget.getAttribute("data-n");
      choisi = n;
      var toutes = racine.querySelectorAll(".pkdx-starter");
      for (var i = 0; i < toutes.length; i++) {
        var estLui = +toutes[i].getAttribute("data-n") === n;
        toutes[i].setAttribute("aria-pressed", estLui ? "true" : "false");
        if (estLui) toutes[i].classList.add("est-choisi");
        else toutes[i].classList.remove("est-choisi");
      }
      //  🔴 « Le son du Pokémon quand on le choisit est décalé » (proprio,
      //     12/08). Le cri jouait à l'ENGAGEMENT — après le calcul de la
      //     partie, avant le rendu de la scène suivante : détaché du geste.
      //     Le bon instant est LE TOUCHER : tu le touches, il répond. C'est
      //     sa présentation, à la seconde où on le regarde.
      criDe(n);
      pied.innerHTML =
        '<p class="pkdx-dit">' + esc(T("starterDefinitif")) + "</p>" +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-starter-ok">' +
          esc(T("starterJePrends", { nom: ESP()[n].nom[LANG()] })) + "</button>";
      // ⚠️ LE GESTIONNAIRE SE POSE ICI, PAS PLUS BAS. `surClic` attache aux
      //    éléments PRÉSENTS au moment de l'appel ; ce bouton naît d'un clic,
      //    donc un `surClic("#pk-starter-ok")` posé au rendu se serait attaché
      //    à rien. Vu à l'écran : le bouton changeait bien de nom et
      //    n'engageait pas. *Un gestionnaire posé avant la naissance de son
      //    élément ne se plaint pas — il ne fait rien.*
      var ok = pied.querySelector("#pk-starter-ok");
      ok.addEventListener("click", engager);
      ok.focus();
    });
    function engager() {
      var n = choisi;
      if (!n) return;
      P().choisirStarter(partie, n, hasard);
      // Sa voix s'est fait entendre AU TOUCHER de la carte (v565) — la jouer
      // une seconde fois ici doublerait la présentation.
      // 🔴 LE RIVAL SE CHOISIT SON POKÉMON DEVANT NOUS. C'est le moment qui
      //    installe tout le voyage — il prend celui qui bat le nôtre — et il
      //    passait en silence. La phrase existait, l'écran ne l'appelait pas.
      //    On la dit ici, avant le compagnon : d'abord la scène, ensuite le
      //    reste.
      // 🔴 ET LA LIGNE DU JOUEUR REVIENT ICI. « Te voilà dresseur » et « Tu pars
      //    seul{e} » vivaient sur l'écran de CHOIX — avant qu'il ait choisi,
      //    donc avant d'être vrai. En branchant la scène de Chen je les avais
      //    décrochées ; elles trouvent leur place après le choix, au moment où
      //    elles disent quelque chose. Ce sont les deux seules lignes accordées
      //    au genre du joueur.
      // 🔴 LA CRÉATION VIENT ICI, APRÈS LE CHOIX. C'est tout l'objet de la
      //    refonte du 08/08 : le premier geste est de prendre son Pokémon, pas
      //    de remplir un formulaire. Le nom se demande une fois qu'il y a
      //    quelque chose à nommer.
      //    ⚠️ Sans cette ligne, la création est purement et simplement SAUTÉE :
      //       le voyage démarrait sans nom et le rival s'appelait « ton rival ».
      //       Vu à l'écran deux minutes après avoir écrit la sortie de
      //       `creation()` — j'avais branché l'arrivée sans brancher le départ.
      scenePremierPas(n, creation);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PREMIER PAS — LA MINUTE QUI DÉCIDE SI L'ON JOUE
  //
  //  🔴 C'ÉTAIT UNE DALLE GRISE. Le joueur vient de choisir son Pokémon, il a
  //     entendu son cri — et le jeu lui répondait par un `message()` générique :
  //     un titre, QUATRE PHRASES COLLÉES BOUT À BOUT en un seul paragraphe, un
  //     bouton. Aucun Pokémon à l'écran, sur l'écran qui suit immédiatement le
  //     choix d'un Pokémon. C'est la loi du mode qu'on enfreignait : un jeu
  //     Pokémon MONTRE ses Pokémon, et c'est ici qu'on en a le plus besoin.
  //
  //  🔴 ET LA RIVALITÉ SE DIT SANS SE VOIR. « Ton rival prend celui qui bat le
  //     tien » est la phrase qui installe tout le voyage — neuf actes plus tard
  //     on l'affronte encore. Écrite, elle est une information ; MONTRÉE, deux
  //     silhouettes face à face, elle est une promesse. Le mode a déjà les deux
  //     sprites et la table qui les oppose (`starterRival`) depuis le premier
  //     jour.
  //
  //  ⚠️ LES PHRASES SE SÉPARENT. Elles étaient concaténées avec des espaces :
  //     sept propositions courtes en un bloc se lisent comme un mode d'emploi.
  //     Trois temps — ce que Chen dit, ce que le rival fait, ce que TU deviens —
  //     et le dernier est le seul accordé au genre du joueur.
  //  ⚠️ AUCUN TEXTE NEUF : les quatre phrases sont celles de `POKE_SCENARIO`,
  //     déjà écrites et déjà relues. On ne réécrit pas, on met en scène.
  // ═══════════════════════════════════════════════════════════════════════════
  function scenePremierPas(n, apres) {
    reprendreCreation = function () { scenePremierPas(n, apres); };
    moissonAvantSortie = null;
    var CH = W.POKE_SCENARIO.CHEN;
    var mien = ESP()[n];
    var sien = ESP()[partie.starterRival];

    function face(e, quoi) {
      if (!e) return "";
      //  Le médaillon de la porte d'entrée, ici aussi (mandat onboarding
      //  12/08) : l'image du voyage entier mérite mieux que deux sprites de
      //  56 px — l'artwork, l'aura au type, la respiration. Même composant.
      return '<span class="pkdx-face-a-face-un">' +
        '<span class="pkdx-face-a-face-qui">' + esc(quoi) + "</span>" +
        medaillonAccueil(e.n, false) +
        "<b>" + esc(e.nom[LANG()]) + "</b>" +
        '<span class="pkdx-face-a-face-types">' +
          e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") +
        "</span>" +
      "</span>";
    }

    coqueLibre(
      '<p class="pkdx-surtitre">' + T("labo") + "</p>" +
      '<p class="pkdx-dialogue">' + esc(W.PokeGenre.pour(CH, "apresChoix", null, "scenario:chen")) + "</p>" +
      // 🔴 Le face-à-face : c'est l'image du voyage entier, et elle tient en
      //    deux sprites. Le rival n'a pas encore de nom — il se nomme à l'écran
      //    suivant — donc on dit les rôles, pas les noms.
      // ⚠️ `est-plateau` : cet écran-ci vit sur la surface SOMBRE. Le même
      //    composant sert l'échange, qui vit sur la claire — le libellé y était
      //    invisible à 1,03:1 faute de le dire.
      '<div class="pkdx-face-a-face est-plateau">' +
        face(mien, T("faceMoi")) +
        '<span class="pkdx-face-a-face-contre" aria-hidden="true"></span>' +
        face(sien, T("faceRival")) +
      "</div>" +
      '<p class="pkdx-dialogue">' + esc(W.PokeGenre.pour(CH, "adieu", null, "scenario:chen")) + "</p>" +
      '<p class="pkdx-dit">' + T("premierPas") + " " + T("seul") + "</p>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
      "</div>"
    );
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 `apres` NE DOIT RECEVOIR AUCUN ARGUMENT — signalement du 15/08 :
    //     l'écran du SAC affichait **« [object PointerEvent] »** en gros sous
    //     son titre. Cause : `addEventListener` passe l'événement au premier
    //     paramètre du gestionnaire, et `apres` est souvent une fonction de
    //     RENDU dont le premier paramètre est le message à afficher
    //     (`rendre(dit)` dans le sac). Le DOM remplissait donc la ligne d'alerte
    //     du sac avec un objet DOM, après une capsule enseignée ou un Super
    //     Bonbon — deux chemins, un seul défaut.
    //  ✅ ON COUPE À LA SOURCE, PAS AU CAS PAR CAS. Quatorze appels passent une
    //     fonction nommée ici ; les corriger un par un aurait laissé le
    //     quinzième rouvrir le défaut. Le contrat est « appelle la suite quand
    //     le joueur continue », pas « transmets-lui l'événement ».
    //  ⚠️ Qui a besoin de l'événement passe une fonction anonyme et le prend
    //     lui-même : c'est le cas de `surClic`, qui lit `e.currentTarget`.
    //     `tools/poke-evenement-fuite.mjs` tient la règle.
    // ═══════════════════════════════════════════════════════════════════════
    var suite = apres || carte;
    racine.querySelector("#pk-suivant").addEventListener("click", function () { suite(); });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE COMPAGNON — UNE MÉCANIQUE ENTIÈRE SANS PORTE D'ENTRÉE
  //
  //  🔴 `compagnonAutorise` ET `poserCompagnon` VIVAIENT DANS `progression.js`,
  //     exportées, jamais appelées. Le champ `compagnon` était même prévu dans
  //     la sauvegarde depuis le premier jour. Toute la mécanique était écrite —
  //     il lui manquait un écran, donc elle n'existait pas.
  //     Trouvée par le détecteur de portes mortes, après les Balls jamais
  //     décomptées et les pierres inemployables. Quatre fois le même défaut.
  //
  //  🔴 IL RÉPOND À UN CHIFFRE MESURÉ : une équipe d'UN SEUL Pokémon ne passe
  //     pas la deuxième arène. Le début de voyage est le moment le plus fragile
  //     du mode, et c'est là qu'on abandonne. Un compagnon donne un second
  //     corps sans donner de puissance — il arrive AU NIVEAU DU STARTER.
  //
  //  🔴 ET IL NE PÈSE PAS LÀ OÙ L'ON SE COMPARE. Ni au Défi du jour, ni en PvP
  //     classé : c'est la règle du projet, aucun acquis hors partie n'entre
  //     dans un classement. `compagnonAutorise` porte cette règle, et c'est
  //     elle qu'on interroge — on ne la réécrit pas ici.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  À COMBIEN DE CHAMPIONS CETTE ESPÈCE RÉPOND-ELLE ?
  //
  //  🔴 MÊME PORTE QUE L'ÉCRAN D'ARÈNE ET QUE LA CAPSULE : `PokePokedex.rapports`
  //     est la seule lecture de la table des types du mode. Trois écrans la
  //     lisent maintenant ; aucun ne la recopie.
  //  ⚠️ « Répondre » veut dire : au moins un Pokémon de l'équipe du Champion est
  //     faible à l'un des types de cette espèce. C'est la définition la plus
  //     modeste, et c'est la bonne — un seul Pokémon faible suffit à donner une
  //     prise, et prétendre davantage serait promettre une victoire.
  //  ⚠️ Le piège de 1996 tient tout seul : le Spectre ne fait rien au Psy, donc
  //     un Spectre rendra bien « ne répond pas » contre Morgane.
  // ═══════════════════════════════════════════════════════════════════════════
  function repondAuxChampions(num) {
    var e = ESP()[num];
    if (!e || !ARENES() || !W.PokePokedex || !W.PokePokedex.rapports) return null;
    var n = 0, sur = 0;
    for (var i = 0; i < ARENES().length; i++) {
      var ar = ARENES()[i];
      if (!ar.equipe || !ar.equipe.length) continue;
      sur++;
      var touche = false;
      for (var j = 0; j < ar.equipe.length && !touche; j++) {
        var adv = ESP()[ar.equipe[j].n];
        if (!adv) continue;
        var r = W.PokePokedex.rapports(adv.types);
        if (!r || !r.faible) continue;
        for (var k = 0; k < r.faible.length; k++) {
          if (e.types.indexOf(r.faible[k].t || r.faible[k]) >= 0) { touche = true; break; }
        }
      }
      if (touche) n++;
    }
    return { n: n, sur: sur };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  🔴 L'ÉCRAN CONSEILLAIT L'AXE QUI FAIT PERDRE. Il n'affichait qu'une chose
  //     — « répond à 5 Champions sur 8 » — et le joueur choisissait là-dessus.
  //     Mesuré, 200 voyages chacun, mêmes conditions :
  //         témoin              8 badges 35 %    · Ligue 10,8 %
  //         choisi PAR TYPE     8 badges 28,1 %  · Ligue  9,4 %
  //         choisi PAR PUISSANCE 8 badges 50,6 % · Ligue 26,3 %
  //     Le compagnon n'était pas un piège : le CONSEIL l'était. Un écran qui
  //     ne montre qu'un critère ne l'informe pas, il le décide — et celui-ci
  //     décidait mal. *Ce qu'un écran met en avant devient ce qu'on optimise.*
  //  ⚠️ Les deux critères restent affichés : le type sert encore contre un mur
  //     précis. Mais l'ordre et la marque disent lequel pèse.
  // ═══════════════════════════════════════════════════════════════════════
  function forceDe(num) {
    var e = ESP()[num];
    if (!e || !e.base) return 0;
    // 🔴 ON SOMME CE QUI EXISTE, on ne nomme pas les cinq. La seconde
    //    génération en porte SIX — `spe` y devient `sat` + `sdf` — et cette
    //    somme aurait rendu NaN sur chaque espèce de Johto, c'est-à-dire un
    //    compagnon dont la force ne s'affiche plus, sans une erreur.
    //  ⚠️ Ce sont les statistiques de BASE, pas les valeurs déterminantes :
    //     celles-là gardent `spe` dans les deux générations (voir `regles.js`),
    //     et les écrans du Juge et du Centre ont raison de l'écrire.
    var t = 0;
    for (var k in e.base) if (typeof e.base[k] === "number") t += e.base[k];
    return t;
  }

  function ditCompagnonForce(num) {
    var tete = partie.equipe[0];
    if (!tete) return "";
    var a = forceDe(num), b = forceDe(tete.n);
    if (!a || !b) return "";
    var ecart = (a - b) / b;
    var cle = ecart > 0.06 ? "compagnonSolide" : ecart < -0.06 ? "compagnonFragile" : "compagnonEgal";
    return '<span class="pkdx-starter-force">' +
      esc(T(cle, { nom: ESP()[tete.n].nom[LANG()] })) + "</span>";
  }

  // [20/08] Un légendaire dans la liste se nomme : c'est la prise la plus rare
  // du mode, et il repart au niveau de départ comme tous les autres. Sans ce
  // mot, il se lit comme un Pokémon ordinaire qu'on aurait mal rangé.
  function ditCompagnonLegendaire(num) {
    if (!W.PokeDepart || !W.PokeDepart.legendaires()[num]) return "";
    return '<span class="pkdx-noeud-chasse">' + esc(T("compagnonLegendaire")) + "</span>";
  }

  function ditCompagnonRepond(num) {
    var r = repondAuxChampions(num);
    if (!r || !r.sur) return "";
    var cle = r.n === 0 ? "compagnonRepond0" : "compagnonRepond";
    return '<span class="pkdx-noeud-chasse">' + esc(T(cle, { n: r.n, sur: r.sur })) + "</span>";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PC DE LÉO — LE LIEN QUI MANQUAIT ENTRE LA COLLECTION ET LE VOYAGE
  //
  //  🔴 IL ÉCHANGE, IL N'AJOUTE PAS, ET C'EST TOUTE LA MÉCANIQUE. Le compagnon
  //     — qui ajoute un corps — est mesuré PERDANT : 8 badges 34,4 % → 28,8 %.
  //     La cause est l'économie d'expérience du mode, pas la valeur du corps.
  //     L'échange, lui, ne la touche pas : 8 badges 34 % → 38 %, Ligue 10,5 %
  //     → 14 %, Morgane 33 % → 39 %. *La réponse de type n'était pas inutile,
  //     elle était payée trop cher.*
  //
  //  ⚠️ JAMAIS LE STARTER. Mesuré aussi, et c'est spectaculaire : troquer le
  //     starter au niveau 5 donne 8 badges 34 % → 4 %. Sa courbe de niveaux est
  //     écrite pour tenir Kanto, celle d'une espèce de route ne l'est pas.
  //  ⚠️ JAMAIS AU DÉFI DU JOUR : la collection diffère d'un compte à l'autre,
  //     et elle casserait la comparaison. Même drapeau `compare` que le
  //     compagnon — une seule règle pour une seule question.
  //  ⚠️ AU NIVEAU DU REMPLACÉ, jamais au niveau de la tête : sinon l'échange
  //     devient une promotion gratuite et le prix disparaît.
  // ═══════════════════════════════════════════════════════════════════════════
  // « Est-ce que je l'ai déjà ? » — une seule porte, celle du compte, lue par
  // le PC de Léo, l'écran de compagnon et désormais l'échange PNJ. Deux façons
  // de répondre à cette question finiraient par en donner deux.
  function neufAuPokedex(num) {
    var PR = W.PokeProgression;
    if (!PR) return false;
    var compte = PR.lire();
    return !(compte && compte.pris && compte.pris[num]);
  }

  var BOITE_MINI = 3;   // en dessous, échanger reviendrait à vider l'équipe

  function boitePlusFaible() {
    var pire = -1, niv = Infinity;
    for (var i = 1; i < partie.equipe.length; i++) {
      if (partie.equipe[i].niveau < niv) { niv = partie.equipe[i].niveau; pire = i; }
    }
    return pire;
  }

  function boiteVivier() {
    var PR = W.PokeProgression;
    if (!PR || partie.compare || partie.boiteFaite) return [];
    if (partie.equipe.length < BOITE_MINI) return [];
    var dedans = {};
    for (var i = 0; i < partie.equipe.length; i++) dedans[partie.equipe[i].n] = true;
    var compte = PR.lire(), out = [];
    for (var n in compte.pris) {
      var num = +n;
      if (dedans[num]) continue;                                   // déjà avec toi
      //  🔴 [20/08] LES LÉGENDAIRES ENTRENT AUSSI ICI. Même raison qu'au
      //     compagnon : un légendaire attrapé ne se jouait nulle part, jamais.
      //     Le PC de Léo ne sert QU'à ce qu'on a déjà pris ; rien n'est donné.
      //  🔴 MÊME RÈGLE QU'AU COMPAGNON : ce qui sort du PC entre dans L'ÉQUIPE,
      //     donc dans le monde qu'on joue. La collection traverse les mondes,
      //     l'équipe non — voir `choixCompagnon`.
      if (!ESP()[num]) continue;
      out.push(num);
    }
    out.sort(function (a, b) { return a - b; });
    return out;
  }

  function boiteOuverte() { return boitePlusFaible() > 0 && boiteVivier().length > 0; }

  // ── QUI LAISSE SA PLACE ? ─────────────────────────────────────────────────
  //  Premier des deux temps du PC de Léo. Le starter n'y figure pas : c'est la
  //  seule place que le mode protège, et la mesure du 09/08 dit pourquoi.
  function choixBoite() {
    var vivier = boiteVivier();
    if (!vivier.length || boitePlusFaible() < 0) return carte();
    coqueLibre(
      '<p class="pkdx-surtitre">' + T("centreBoite") + "</p>" +
      '<h1 class="pkdx-titre">' + T("pcQuiPart") + "</h1>" +
      '<p class="pkdx-dit">' + T("pcQuiPartDit") + "</p>" +
      '<ul class="pkdx-liste">' + partie.equipe.map(function (m, k) {
        var e = ESP()[m.n];
        return '<li class="pkdx-etape">' +
          '<button type="button" class="pkdx-touche" data-part="' + k + '"' +
            (k === 0 ? " disabled" : "") + ">" +
            esc(nomDe(m)) + " " + W.PokeGenre.niveau(m.niveau) + "</button>" +
          '<span class="pkdx-cout">' +
            (k === 0 ? T("pcStarter")
              : e.types.map(function (t) { return W.PokeType.pastille(t); }).join("")) +
          "</span></li>";
      }).join("") + "</ul>" +
      '<div class="pkdx-actions"><button type="button" class="pkdx-touche est-discrete"' +
        ' id="pk-part-non">' + esc(T("retour")) + "</button></div>"
    );
    surClic("[data-part]", function (e) {
      son("PRESS_AB");
      choixBoiteArrivant(+e.currentTarget.getAttribute("data-part"));
    });
    surClic("#pk-part-non", function () { return carte(); });
  }

  // ── ET QUI PREND SA PLACE ? ───────────────────────────────────────────────
  function choixBoiteArrivant(idx) {
    var vivier = boiteVivier();
    var sortant = partie.equipe[idx];
    if (!vivier.length || !sortant || idx < 1) return carte();
    var niveau = sortant.niveau;

    coque(
      '<p class="pkdx-surtitre">' + T("centreBoite") + "</p>" +
      '<h1 class="pkdx-titre">' + T("pcTitre") + "</h1>" +
      '<p class="pkdx-dit">' + esc(T("pcDit", { qui: nomDe(sortant), n: niveau })) + "</p>" +
      // 🔴 LE MÊME GABARIT QUE LE COMPAGNON ET QUE LE DÉPART. Trois écrans qui
      //    posent la même question — « lequel ? » — doivent la poser avec la
      //    même carte, sinon on réapprend à lire à chaque fois.
      '<div class="pkdx-starters">' + vivier.map(function (num) {
        var e = ESP()[num];
        // On dit la PORTÉE, comme au compagnon : « répond à 5 Champions sur 8 »
        // se décide, « efficace contre 7 Pokémon » ne dit pas s'ils sont tous
        // chez le même. Et on dit aussi zéro — le taire ferait croire à un oubli.
        return '<button type="button" class="pkdx-starter" data-boite="' + num + '"' +
            W.PokeType.attr(e.types[0]) + ">" +
          '<img alt="" loading="lazy" src="assets/img/poke/art/' + num + '.webp"' +
            ' onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(num) + '\'">' +
          "<b>" + esc(e.nom[LANG()]) + "</b>" +
          '<span class="pkdx-starter-types">' +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") + "</span>" +
          ditCompagnonRepond(num) +
        "</button>";
      }).join("") + "</div>" +
      '<div class="pkdx-actions"><button type="button" class="pkdx-touche est-discrete"' +
        ' id="pk-boite-non">' + esc(T("retour")) + "</button></div>"
    );
    surClic("[data-boite]", function (e) {
      var num = +e.currentTarget.getAttribute("data-boite");
      // ⚠️ L'INDICE VIENT DU PREMIER ÉCRAN, plus de `boitePlusFaible()` : c'est
      //    le joueur qui a désigné le partant, et le relire ici le remplacerait
      //    par le plus faible — le défaut qu'on vient de retirer.
      var i = idx;
      if (i < 1 || !partie.equipe[i]) return carte();
      var sort = nomDe(partie.equipe[i]);
      partie.equipe[i] = M().creer(num, niveau, hasard);
      partie.boiteFaite = true;
      son("HEAL_HP");
      return message(T("centreBoite"),
        esc(T("pcFait", { qui: sort, nom: ESP()[num].nom[LANG()] })));
    });
    surClic("#pk-boite-non", function () { return carte(); });
  }

  function choixCompagnon() {
    reprendreCreation = choixCompagnon;
    moissonAvantSortie = null;
    var PR = W.PokeProgression;
    // 🔴 LE DRAPEAU EST `compare`, PAS UN CHAMP `mode` QUE J'ALLAIS INVENTER.
    //    C'est lui que le vivier de départ interroge déjà pour refuser les
    //    starters débloqués au Défi du jour ; s'en écarter aurait donné deux
    //    règles pour la même question, et un jour deux réponses.
    if (partie.compare) return carte();
    if (!PR.compagnonAutorise(partie.regle, partie.compare ? "defi" : "libre")) return carte();

    // On n'emmène que ce qu'on a réellement pris, et jamais une seconde fois
    // l'espèce qu'on vient de choisir au départ.
    var compte = PR.lire();
    var dispo = [];
    for (var n in compte.pris) {
      var num = +n;
      if (num === partie.starter) continue;
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 [20/08, Archii puis le propriétaire] « EN GROS ON NE PEUT JAMAIS
      //     JOUER MEWTWO ? » — c'était vrai, et pour TOUS les légendaires. On
      //     les capture à la dernière page d'un voyage qui se referme derrière,
      //     et cette ligne les écartait ensuite du seul endroit où ils
      //     pouvaient servir. Le plus rare du mode n'était jamais joué : ni
      //     dans le voyage où on l'attrape, ni dans aucun autre. Une
      //     récompense qu'on ne peut pas employer n'est pas une récompense.
      //  🔑 LA RÈGLE DE `depart.js` NE BOUGE PAS, ET ELLE DIT AUTRE CHOSE : un
      //     légendaire n'ouvre jamais un DÉPART (`recevable`), parce qu'un
      //     départ est DONNÉ. Un compagnon se MÉRITE — il faut l'avoir attrapé,
      //     donc avoir battu la Ligue puis gagné un combat à un seul essai. La
      //     rareté reste entière ; c'est la récompense qui existe enfin.
      //  ⚠️ IL REPART AU NIVEAU DU STARTER, comme tous les compagnons, et le
      //     plafond d'acte le tient comme les autres : on rejoue un voyage avec
      //     lui, on ne le survole pas.
      //  ⚠️ LE DÉFI DU JOUR N'EST PAS CONCERNÉ : `partie.compare` et
      //     `compagnonAutorise` referment cet écran avant d'arriver ici. Aucun
      //     acquis ne pèse là où l'on se compare.
      // ═══════════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════════
      // 🔴 LE COMPAGNON ENTRE DANS LE VOYAGE — il doit donc EXISTER DANS LE
      //    MONDE QU'ON JOUE. La collection appartient au compte et traverse
      //    les mondes ; l'équipe, non. Sans ce filtre, un joueur revenu de
      //    Johto se voyait proposer Mentali au départ de Kanto, et l'écran
      //    mourait sur `ESP()[num].types` — l'espèce n'est pas dans la table
      //    de 1996. C'est le pendant de `especeToute` : le Pokédex MONTRE
      //    tout ce que le compte a gardé, le voyage ne JOUE que le sien.
      // ═══════════════════════════════════════════════════════════════════
      if (!ESP()[num]) continue;
      dispo.push(num);
    }
    // 🔴 TRIÉ PAR SOLIDITÉ, PAS PAR NUMÉRO DE POKÉDEX. L'ordre d'une liste est
    //    un conseil silencieux, et l'ordre du Pokédex n'en est pas un.
    dispo.sort(function (a, b) { return forceDe(b) - forceDe(a); });
    if (!dispo.length) return carte();

    var niveau = partie.equipe[0] ? partie.equipe[0].niveau : 5;

    coque(
      '<p class="pkdx-surtitre">' + T("nCompagnon") + "</p>" +
      '<h1 class="pkdx-titre">' + T("compagnonTitre") + "</h1>" +
      '<p class="pkdx-dit">' + T("compagnonDit", { n: niveau }) + "</p>" +
      '<div class="pkdx-starters">' + dispo.map(function (num) {
        var e = ESP()[num];
        return '<button type="button" class="pkdx-starter" data-compagnon="' + num + '"' +
            W.PokeType.attr(e.types[0]) + ">" +
          // 🔴 LE MÊME GABARIT QUE L'ÉCRAN DE DÉPART, à la classe près. J'avais
          //    écrit `pkdx-starter-nom` de mémoire ; la carte de départ emploie
          //    un simple `<b>`, et `poke-classes-css` l'a relevé avant que le
          //    nom ne sorte sans style à l'écran. Deux gabarits pour la même
          //    carte, c'est la divergence garantie.
          '<img alt="" loading="lazy" src="assets/img/poke/art/' + num + '.webp"' +
            ' onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(num) + '\'">' +
          // 🔴 C'EST « QUELQU'UN DE TA COLLECTION » — ALORS ON L'APPELLE PAR
          //    SON NOM. L'écran proposait « Pikachu » à un joueur qui l'avait
          //    baptisé « Bou'chon » au voyage d'avant : le PC gardait le nom et
          //    le seul écran qui pioche dans le PC ne le lisait pas. L'espèce
          //    reste lisible — l'artwork et les pastilles de type sont là.
          "<b>" + esc(surnomDuCompte(num) || e.nom[LANG()]) + "</b>" +
          ditCompagnonForce(num) +
          ditCompagnonLegendaire(num) +
          ditCompagnonRepond(num) +
          '<span class="pkdx-starter-types">' +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") + "</span>" +
        "</button>";
      }).join("") + "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche" id="pk-seul">' + T("compagnonSeul") + "</button>" +
      "</div>"
    );

    surClic("[data-compagnon]", function (e) {
      var num = +e.currentTarget.getAttribute("data-compagnon");
      PR.poserCompagnon(num);
      var mon = M().creer(num, niveau, hasard);
      // Le nom suit le Pokémon, pas seulement sa vignette : sans cette ligne il
      // s'appelait « Bou'chon » sur la carte et « Pikachu » en combat.
      var connu = surnomDuCompte(num);
      if (connu) mon.surnom = connu;
      partie.equipe.push(mon);
      P().prendre(partie, num, "compagnon", niveau);
      criDe(num);
      carte();
    });
    // 🔴 PARTIR SEUL RESTE UN CHOIX. Un joueur qui vise le score le fera : le
    //    compagnon ne rapporte aucun point et occupe une place d'équipe.
    racine.querySelector("#pk-seul").addEventListener("click", function () { son("PRESS_AB"); carte(); });
  }

  // Les espèces propres à une version, calculées depuis les tables de rencontre.
  // On n'en nomme que les premières : une liste de vingt noms ne se lit pas.
  // 🔴 CE CALCUL SUPPOSAIT DEUX VERSIONS, ET JOHTO N'EN A QU'UNE. `dans("bleu")`
  //    sur les tables de Cristal lisait `bloc["bleu"]` — indéfini — et la page
  //    mourait au premier starter, avant le moindre pixel. Un monde à version
  //    unique n'a pas d'exclusivité : c'est la RÉPONSE, pas un cas à contourner.
  // ⚠️ LE CACHE EST INDEXÉ PAR MONDE. Deux mondes peuvent nommer leur version
  //    de la même façon un jour ; une clé qui ne dit que « rouge » rendrait
  //    alors les exclusifs de l'autre.
  var _cacheExclusifs = {};
  function exclusifs(version) {
    var vs = (W.PokeRegles && W.PokeRegles.versions()) || ["rouge", "bleu"];
    if (vs.length < 2 || vs.indexOf(version) < 0) return [];
    var cle = (W.PokeRegles ? W.PokeRegles.courant() : "gen1") + ":" + version;
    if (_cacheExclusifs[cle]) return _cacheExclusifs[cle];
    var dans = function (v) {
      var s = {};
      for (var i = 0; i < ZONES().length; i++) {
        var z = ZONES()[i];
        for (var b = 0; b < 2; b++) {
          var bloc = b === 0 ? z.herbe : z.eau;
          if (!bloc) continue;
          for (var c = 0; c < bloc[v].length; c++) if (bloc[v][c].poids > 0) s[bloc[v][c].n] = true;
        }
      }
      return s;
    };
    var autre = vs[0] === version ? vs[1] : vs[0];
    var a = dans(version), b = dans(autre);
    var out = [];
    for (var n in a) if (!b[n]) out.push(+n);
    out.sort(function (x, y) { return x - y; });
    //  Des NUMÉROS, plus des noms (12/08) : l'écran du starter MONTRE les
    //  visages de la version au lieu d'une liste en gras. Les deux lecteurs
    //  traduisent eux-mêmes quand ils veulent du texte.
    _cacheExclusifs[cle] = out.slice(0, 4);
    return _cacheExclusifs[cle];
  }

  // ── La carte du voyage ─────────────────────────────────────────────────────
  function raisonDuRefus(manque) {
    var cles = CLES_V();
    var m = manque[0];
    if (!m) return "";
    if (m.type === "cle") return T("manqueCle", { quoi: cles[m.cle] ? cles[m.cle].nom[LANG()] : m.cle });
    if (m.type === "badgeCS") return T("manqueBadgeCS", { quoi: cles[m.cle].nom[LANG()], n: m.requis });
    if (m.type === "badges") return T("manqueBadges", { n: m.requis, a: m.obtenus });
    if (m.type === "ligue") return T("manqueLigue");
    return T("ferme");
  }

  // ── La carte de l'acte ─────────────────────────────────────────────────────
  //  🔴 CE N'EST PLUS UNE LISTE. Deux ou trois chemins, chacun annonce ce qu'il
  //     contient, on en choisit un, on ne revient pas. Les branches laissées
  //     restent LISIBLES et barrées : voir ce qu'on a perdu donne son poids au
  //     choix suivant. C'était le reproche du propriétaire — « une liste de
  //     lieux vides, on clique il se passe rien, zéro roguelite ».
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 DEUX TYPES DE NŒUD MANQUAIENT, ET LE REPLI LES MAQUILLAIT EN TROUVAILLE.
  //    `peche` et `camion` n'étaient pas dans cette table ; `T(ICONE[n.type] ||
  //    "nObjet")` leur donnait donc le titre du ramassage d'objet. Sur la
  //    carte, un nœud de pêche s'annonçait « TROUVAILLE · 3 rencontres · Eau » —
  //    un ramassage qui annonce des rencontres. Le joueur ne pouvait pas
  //    comprendre qu'il allait pêcher, et c'est très probablement POURQUOI ces
  //    deux écrans n'ont jamais été vus : ils étaient là, sous un autre nom.
  // 🔴 ET LE REPLI EST SUPPRIMÉ. Un type inconnu doit se voir, pas emprunter le
  //    nom du voisin : `|| "nObjet"` transformait un oubli en défaut invisible.
  //    Sans repli, un type neuf sort avec une étiquette vide — laid, immédiat,
  //    corrigé dans la minute. C'est exactement ce qu'on veut d'un oubli.
  // ═══════════════════════════════════════════════════════════════════════════
  var ICONE = {
    herbes: "nHerbes", eau: "nEau", dresseur: "nDresseur", objet: "nObjet",
    centre: "nCentre", boutique: "nBoutique", scene: "nScene",
    legendaire: "nLegendaire", boss: "nBoss", ligue: "nLigue",
    fossile: "nFossile", ranimation: "nRanimation", casino: "nCasino",
    echange: "nEchange", cadeau: "nCadeau", safari: "nSafari",
    rival: "nRival", peche: "nPeche", camion: "nCamion", dojo: "nDojo",
    musee: "nMusee", pension: "nPension", journal: "nJournal", ronflex: "nRonflex",
    arbre: "nArbre", oeuf: "nOeuf", concours: "nConcours",
  };
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 LE TITRE D'UN NŒUD DOIT NOMMER CELUI QUI EST LÀ — signalé par Totor le
  //     21/08 : « sur la 2G il est indiqué que Ronflex barre le chemin alors
  //     que c'est Simularbre qui apparaît ».
  //
  //     Le type du nœud reste « ronflex » à dessein (carte-actes.js l'écrit :
  //     le renommer casserait les voyages ouverts). Mais `ICONE` est une table
  //     TYPE → phrase, et Johto pose SEPT rencontres uniques sous ce type —
  //     Simularbre route 36, le Lokhlass des Caves Jumelles, le Léviator rouge
  //     du Lac Colère, les Voltorbe du repaire. Toutes s'annonçaient « Un
  //     Ronflex ».
  //  ⚠️ Le champ `espece` existait sur le nœud depuis le premier jour, et le
  //     commentaire de carte-actes.js affirmait « c'est lui que tout le monde
  //     lit » : PERSONNE ne le lisait. Une donnée juste ne se voit pas toute
  //     seule — même famille que le niveau qui ne sortait pas du nœud.
  // ═══════════════════════════════════════════════════════════════════════════
  function titreDuNoeud(n) {
    if (n && n.type === "ronflex" && n.espece && ESP()[n.espece]) {
      return esc(ESP()[n.espece].nom[LANG()]);
    }
    return T(ICONE[n.type]);
  }
  // 🔴 CE QUI NE REPASSE PAS. Un fossile écarté reste sous la roche, un Casino
  //    laissé ne se retrouve pas, un légendaire qui fuit est perdu pour le
  //    voyage. La liste vit ici, à côté des noms de nœuds, pour qu'un type neuf
  //    force la question : « celui-là, il repasse ? »
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 DIX DESCRIPTIONS DE LIEUX, ÉCRITES ET MUETTES. `POKE_SCENARIO.ROCKET` et
  //    `POKE_SCENARIO.VOYAGE` portent ce qui donne son épaisseur à Kanto — la
  //    Forêt de Jade sombre, le Mont Sélénité en labyrinthe, le tunnel noir, le
  //    Ronflex en travers de la route, la Team Rocket qui fouille la grotte.
  //    Aucune n'était affichée : la carte annonçait « une scène » et le nom du
  //    lieu, rien de plus. Un décor qu'on ne décrit pas n'est pas un décor.
  // 🔴 LA TABLE RELIE UNE ÉTAPE À SA LIGNE, et le détecteur de textes refuse
  //    toute clé absente : impossible d'en nommer une qui n'existe pas.
  // ═══════════════════════════════════════════════════════════════════════════
  var LIEU_DIT = {
    "mont-selenite": ["ROCKET", "selenite"],
    "repaire-rocket": ["ROCKET", "celadopole"],
    "tour-pokemon": ["ROCKET", "tour"],
    "tour-silph": ["ROCKET", "silph"],
    "foret-de-jade": ["VOYAGE", "foret"],
    "tunnel-roche": ["VOYAGE", "tunnel"],
    "route-12": ["VOYAGE", "ronflex"],
    "route-victoire": ["VOYAGE", "victoire"],
    "grotte-inconnue": ["VOYAGE", "grotte"],
  };
  function ditDuLieu(etape) {
    var e = LIEU_DIT[etape];
    if (!e || !W.POKE_SCENARIO[e[0]] || !W.POKE_SCENARIO[e[0]][e[1]]) return "";
    return W.PokeGenre.pour(W.POKE_SCENARIO[e[0]], e[1], null, "scenario:lieu");
  }

  var UNIQUES = {
    fossile: true, ranimation: true, casino: true, safari: true,
    // Le Concours ne se court qu'une fois : le garde a note ta prise.
    concours: true,
    echange: true, cadeau: true, legendaire: true, scene: true,
    // Le Dojo ne se refait pas : on y prend Kicklee OU Tygnon, une seule fois.
    dojo: true,
    // Le Musée non plus : l'ambre ne s'y ramasse qu'une fois.
    musee: true,
    // La Pension n'accueille qu'un pensionnaire par acte.
    pension: true,
    // Les journaux ne se relisent pas : on sait ce qu'ils disent.
    journal: true,
    // Le Ronflex ne se réveille qu'une fois — comme un légendaire.
    ronflex: true,
    // On ne le croise qu'une fois par acte, et il ne se contourne pas deux fois.
    rival: true,
  };
  // Le pictogramme de chaque nouveau nœud. 🔴 Aucun n'est laissé sans dessin :
  //    un médaillon vide se lit comme un défaut de chargement.
  var DESSIN = {
    fossile: "scene", ranimation: "centre", casino: "objet",
    echange: "dresseur", cadeau: "objet",
    // Le Dojo se gagne au combat : c'est un dresseur, pas une trouvaille.
    dojo: "dresseur",
    // Le Musée est une salle qu'on visite : la même scène que les autres.
    musee: "scene",
    // La Pension soigne et fait grandir : le même dessin que le Centre.
    pension: "centre",
    // Les journaux sont une trouvaille du décor : le pictogramme de l'objet.
    journal: "objet",
    // Le Ronflex est une rencontre unique : le même dessin que le légendaire.
    ronflex: "legendaire",
    // Le Parc n'est ni une herbe ni une boutique : c'est une Ball qu'on lance
    // sans se battre, et son pictogramme le dit.
    safari: "ball",
    // Le Concours aussi se joue a la Ball, sans combattre.
    concours: "ball",
    // Le rival est un dresseur — le pictogramme le dit, son cadre le distingue.
    rival: "dresseur",
    // 🔴 `peche` ET `camion` MANQUAIENT ICI AUSSI. `svg()` rend une chaîne vide
    //    quand le dessin n'existe pas : leurs médaillons sortaient CREUX, sans
    //    une erreur. Les deux mêmes types qui portaient le titre « TROUVAILLE »
    //    par le repli de `ICONE` — un type de nœud s'inscrit à TROIS endroits
    //    (le titre, le dessin, l'écran), et n'en oublier aucun ne se vérifiait
    //    nulle part. `poke-classes-css.mjs` le vérifie maintenant.
    //    La pêche se fait au bord de l'eau ; le camion est une scène, comme le
    //    fossile — un moment du canon qu'on ne croise qu'à un endroit.
    peche: "eau", camion: "scene",
    // L'arbre et le rocher portent le dessin des herbes : c'est une rencontre
    // sauvage, et le joueur doit la lire comme telle au premier coup d'œil.
    arbre: "herbes",
    // ⚠️ CETTE TABLE NE SE RÉSOUT PAS EN CASCADE. J'avais écrit `oeuf: "cadeau"`
    //    — l'œuf EST un cadeau dont on ignore le contenu — et `cadeau` n'est
    //    pas un dessin : c'est lui-même un alias vers `objet`. Un maillon de
    //    plus et le médaillon sortait creux. Le détecteur l'a dit tout de suite.
    oeuf: "objet",
  };

  var OBJETS = {
    POKE_BALL: { fr: "Poké Ball", en: "Poké Ball" }, GREAT_BALL: { fr: "Super Ball", en: "Great Poké Ball" },
    ULTRA_BALL: { fr: "Hyper Ball", en: "Ultra Poké Ball" }, POTION: { fr: "Potion", en: "Potion" },
  };
  // 🔴 LES NOMS D'OBJET VIENNENT DES DONNÉES, PAS D'UNE PETITE TABLE LOCALE.
  //    Celle-ci n'en connaissait que quatre : l'écran des fossiles affichait
  //    « DOME_FOSSIL » brut au joueur. `POKE_OBJETS` en porte 96, tous nommés
  //    depuis le ROM et PokéAPI. La table locale ne sert plus que de repli.
  function nomObjet(c) {
    var o = W.PokeRegles ? W.PokeRegles.objet(c) : (W.POKE_OBJETS && W.POKE_OBJETS[c]);
    if (o) return o.nom[LANG()] || o.nom.fr;
    return (OBJETS[c] || { fr: c, en: c })[LANG()];
  }

  // 🔴 L'ANNONCE EST CALCULÉE, JAMAIS ÉCRITE. Les espèces et leurs taux
  //    viennent des tables du ROM, les équipes de POKE_EQUIPES : elles restent
  //    vraies si les données bougent, et aucun nom n'est tapé au clavier.
  // Les milliers se séparent : « 1550 ₽ » est un mot, « 1 550 ₽ » est un
  // montant. L'espace est insécable, sinon il casse en fin de ligne.
  // 🔴 UNE SEULE PORTE POUR LES MILLIERS. Le bandeau affichait « 3000 ₽ » et,
  //    à trois centimètres, un nœud de dresseur affichait « 1 050 ₽ » : deux
  //    formats pour la même monnaie, sur le même écran, en même temps. Les
  //    phrases « il te manque {n} ₽ » et « tu perds {n} ₽ » étaient dans le
  //    même cas. Le séparateur vit ici, et tout le monde y passe.
  function milliers(v) {
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function argent(v) {
    return milliers(v) + " ₽";
  }

  // Les essais qu'il reste devant le Champion de l'acte — et rien tant qu'on
  // n'a pas échoué : annoncer le compte d'entrée transformerait une réserve
  // en promesse, et le joueur les dépenserait pour voir.
  // 🔴 LE NOMBRE D'ESSAIS NE S'APPRENAIT QU'EN PERDANT. La ligne se taisait
  //    tant qu'aucun essai n'était consommé — donc le joueur découvrait la
  //    règle au moment exact où elle venait de le punir. Or les essais par
  //    acte est une RESSOURCE : elle se budgète avant, comme les Balls avant une
  //    chasse, et c'est ce que le nœud du Champion existe pour dire.
  //  ⚠️ La phrase change quand le compte est plein : « Trois essais dans cet
  //     acte » ANNONCE une règle ; « Il te reste deux essais » sous-entend
  //     qu'on en a déjà perdu. Ce n'est pas la même information.
  function resteDevantLeBoss() {
    if (!P().essaisRestants) return "";
    var reste = P().essaisRestants(partie);
    var plein = reste >= P().ESSAIS_BOSS;
    return '<span class="pkdx-reste">' +
      T(plein ? "essaisRegle" : "koEssais", { n: reste }) + "</span>";
  }

  function annonce(n) {
    // 🔴 « 3 rencontres — Rattata 45 % · Nidoran♀ 40 % · Nidoran♂ 5 % (rare) »
    //    — verdict du propriétaire : « y a les pourcentages partout, on y
    //    comprend pas grand-chose ». Il a raison, et le défaut est de fond :
    //    trois taux qui font 100 % n'aident à RIEN. Ce qui fait choisir un
    //    chemin, c'est le nombre de rencontres et la présence d'une espèce
    //    rare — pas la répartition exacte des communes.
    //    Le détail part donc sur les pastilles d'espèce, et le seul taux qui
    //    survit est celui de la rare, parce que lui pèse dans la décision.
    // 🔴 LE NŒUD DIT CE QU'IL ENTRAÎNE. En première génération, un Pokémon
    //    vaincu lègue ses statistiques de base au vainqueur : c'est le seul
    //    levier de construction du jeu d'origine, il est câblé depuis le
    //    premier jour, et personne ne pouvait le voir. Dit ici, il transforme
    //    « deux rencontres » en une décision de construction — et il est canon
    //    jusqu'à la dernière virgule.
    if (n.annonce) {
      return T("aRencontres", { n: n.rencontres }) +
        (n.entraine ? " · " + T("aEntraine", { stat: nomStat(n.entraine) }) : "");
    }
    if (n.type === "dresseur") {
      // ⚠️ LA CLASSE SE NOMME DANS LA LANGUE DU JOUEUR. Les deux écrans qui
      //    l'affichent lisaient `meta.fr` sans condition : en anglais on
      //    lisait « Motard · 3 Pokémon » puis on affrontait « Karatéka ».
      var meta = W.POKE_CLASSES[n.classe];
      return esc(meta ? (meta[LANG()] || meta.fr) : n.classe) + " · " + T("aPokemon", { n: n.equipe.length });
    }
    if (n.type === "objet") return esc(nomObjet(n.lot.objet)) + " ×" + n.lot.n;
    // 🔴 L'ANNONCE DU NŒUD SUIT SON CONTENU. Elle disait « ton équipe repart en
    //    pleine forme » — vrai tant que le Centre soignait sans rien demander,
    //    faux depuis qu'il pose une question. Une carte qui promet un soin et
    //    ouvre un arbitrage trompe sur le seul écran où l'on choisit.
    if (n.type === "centre") return T("aCentre");
    // 🔴 LE RAYON RARE S'ANNONCE SUR LA CARTE. C'est la loi du mode — un nœud
    //    dit ce qu'il contient avant qu'on le choisisse — et ici c'est ce qui
    //    donne envie de garder son argent une rangée de plus.
    // 🔴 ET IL SE NOMME. « Un rayon rare est ouvert » ne fait rien décider : le
    //    rayon tient une PIERRE, et une pierre d'évolution est le seul achat du
    //    jeu qui change une équipe pour de bon. Savoir que la Pierre Foudre
    //    attend trois rangées plus loin, c'est la raison de ne pas dépenser
    //    maintenant — et cette raison n'existait pas, alors que le nœud portait
    //    ses deux articles depuis sa création.
    if (n.type === "boutique") {
      var rare = (n.rare || []).map(function (o) { return esc(nomObjet(o)); });
      var dit = T("aBoutique") + (rare.length ? " " + T("aBoutiqueRare", { quoi: rare.join(", ") }) : "");
      // Le comptoir des machines ouvre au même acte que le rayon rare : on le
      // dit ici, avec ses bornes de prix lues sur l'étal.
      if ((partie.acte || 1) >= O().ACTE_MACHINES) {
        var martMach = O().martMachines ? O().martMachines(partie) : O().MART_MACHINES;
        var prixCT = O().inventaire(martMach).map(function (c) { return O().prixDe(c); })
          .filter(function (x) { return x > 0; });
        if (prixCT.length) {
          dit += " " + T("aBoutiqueMachines", {
            min: milliers(Math.min.apply(null, prixCT)),
            max: milliers(Math.max.apply(null, prixCT)),
          });
        }
      }
      return dit;
    }
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LE CASINO VEND CE QU'ON NE TROUVE NULLE PART, ET IL DISAIT « DES
    //    POKÉMON CONTRE DES JETONS ». Sa table contient Porygon, Minidraco,
    //    Insécateur, Scarabrute — quatre des espèces que le mesureur de
    //    difficulté liste comme « jamais croisées » sur trois cents voyages.
    //    Elles ne sont pas injoignables : elles sont ICI, derrière une phrase
    //    qui ne les nomme pas.
    // 🔴 ON NOMME LA PLUS CHÈRE, parce que c'est elle qui fait venir. Lister
    //    les six ferait un catalogue sur une carte de choix ; le prix le plus
    //    haut désigne toujours la plus rare, c'est la logique du ROM.
    // ═══════════════════════════════════════════════════════════════════════
    if (n.type === "casino") {
      var lots = ((W.PokeRegles && W.PokeRegles.casino && W.PokeRegles.casino()) ||
                  W.POKE_CASINO || {})[partie.version] || [];
      var haut = null;
      for (var c = 0; c < lots.length; c++) if (!haut || lots[c].jetons > haut.jetons) haut = lots[c];
      if (haut && ESP()[haut.n]) {
        return T("aCasinoLot", { quoi: esc(ESP()[haut.n].nom[LANG()]), n: haut.jetons });
      }
      return T("aCasino");
    }
    if (n.type === "legendaire") return esc(ESP()[n.espece].nom[LANG()]);
    // 🔴 LE CAMION ANNONCE SON ÉTAT SUR LA CARTE, avant le choix. C'est la loi
    //    du mode, et c'est aussi ce qui fait le mythe : on lit « quelque chose
    //    remue dessous » des voyages durant avant de pouvoir y aller.
    if (n.type === "camion") {
      var my = W.PokeDepart.mythe();
      return T(my.etat === "mew" ? "aCamionMew" : my.etat === "remue" ? "aCamionRemue" : "aCamion");
    }
    // 🔴 « DEUX FOSSILES. TU N'EN PRENDRAS QU'UN. » dit la CONTRAINTE et tait
    //    l'ENJEU. Les deux donnent Kabuto et Amonita — deux espèces qu'aucune
    //    herbe, aucune eau et aucune pêche ne rend, et dont l'autre est perdue
    //    pour le voyage. Nommer les deux, c'est transformer une règle en
    //    dilemme : le joueur sait ce qu'il renonce, ce qui est tout le sujet.
    if (n.type === "fossile") {
      var fos = (W.PokeObtenir.fossiles() || []).map(function (f) {
        var e = ESP()[f.n];
        return e ? esc(e.nom[LANG()]) : "";
      }).filter(Boolean);
      return fos.length === 2 ? T("aFossileDeux", { a: fos[0], b: fos[1] }) : T("aFossile");
    }
    // 🔴 L'AMBRE COMPTE AUSSI. Sans lui, le nœud annonçait « rien à ranimer »
    //    à un joueur qui porte le Vieil Ambre depuis l'acte 1 — et il serait
    //    passé à côté, à raison, sur la foi de ce que le nœud lui disait.
    if (n.type === "ranimation") {
      var aRanimer = (partie.fossile && !partie.fossileRanime) || (partie.ambre && !partie.ambreRanime);
      return aRanimer ? T("aRanimation") : T("aRanimationSans");
    }
    // (Une seconde branche `casino` vivait ici, inatteignable : celle du dessus
    //  rend toujours, repli compris. Reste d'une version où le nœud ne nommait
    //  pas son lot. Une branche morte ne lève aucune erreur — elle fait juste
    //  croire, à la relecture, que le cas est traité deux fois.)
    // Le Parc annonce ce qui le rend unique : des espèces qu'on ne croise nulle
    // part ailleurs, et un nombre de Balls qui ne se recharge pas.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LE PARC ANNONÇAIT SES BALLS ET PAS SA RAISON D'ÊTRE. « 30 Balls,
    //    aucun combat » décrit la MÉCANIQUE ; ce qui décide d'y aller, c'est
    //    Kangourex, Scarabrute ou Insécateur — des espèces qu'aucune route ne
    //    rend. Même défaut que la canne, l'échange et le casino : la donnée
    //    est dans le nœud (`tables`), l'écran affichait un compteur.
    // ⚠️ ON NOMME LA PLUS RARE DES QUATRE ZONES, pondérée comme le tirage la
    //    verra vraiment — pas la première de la liste, qui ne veut rien dire.
    if (n.type === "concours") return T("aConcours");
    // ═══════════════════════════════════════════════════════════════════════
    if (n.type === "safari") {
      var pire = null;
      for (var z = 0; z < (ZONES() || []).length; z++) {
        var zn = ZONES()[z];
        if ((n.tables || []).indexOf(zn.id) < 0 || !zn.herbe) continue;
        var cre = zn.herbe[partie.version] || [];
        for (var q = 0; q < cre.length; q++) {
          if (!pire || cre[q].poids < pire.poids) pire = cre[q];
        }
      }
      var eR = pire && ESP()[pire.n];
      return T("aSafari", { n: SAFARI_BALLS }) +
        (eR ? " · " + T("aSafariRare", { quoi: esc(eR.nom[LANG()]) }) : "");
    }
    // 🔴 LE RIVAL S'ANNONCE PAR SON NOM ET SON NOMBRE. C'est la règle de toute
    //    la carte : un nœud dit ce qu'il contient AVANT le choix. Ici, le nom
    //    que le joueur lui a donné à la création — voilà pourquoi on le demande.
    if (n.type === "rival") {
      var eqR = P().equipeRival(partie, n.rencontre) || [];
      return T("aRival", { qui: esc(partie.rival || T("rivalSansNom")), n: eqR.length });
    }
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 « 1 ÉCHANGE POSSIBLE » NE DIT PAS CE QU'ON GAGNE, et c'est le nœud qui
    //    donne les espèces qu'on n'attrape NULLE PART : M. Mime contre un Abra,
    //    Canarticho contre un Krabby. La politique du harnais le note 70 sur
    //    100 pour cette raison exacte — « une espèce qu'on n'attrape nulle
    //    part » — et le joueur, lui, lisait un compteur.
    // 🔴 ET ON DIT LE PRIX, parce qu'un échange se refuse quand on n'a pas de
    //    quoi payer : nommer la prise sans nommer ce qu'elle coûte enverrait
    //    prendre une branche pour rien.
    // ═══════════════════════════════════════════════════════════════════════
    if (n.type === "echange") {
      var lisible = (n.offres || []).map(function (o) {
        var recu = ESP()[o.recoit], paye = ESP()[o.donne];
        if (!recu || !paye) return "";
        return T("aEchangeUn", {
          quoi: esc(recu.nom[LANG()]), contre: esc(paye.nom[LANG()]),
        });
      }).filter(Boolean).join(" · ");
      //  (12/08) La raison du troc impayable vit sur le BOUTON, à côté de son
      //  `disabled` — la grammaire de `poke-bouton-grise`. Ici on n'annonce
      //  que l'offre.
      return lisible || T("aEchange", { n: (n.offres || []).length });
    }
    if (n.type === "cadeau") {
      return T("aCadeau", { quoi: esc(n.offres.map(function (c) { return ESP()[c.n].nom[LANG()]; }).join(", ")) });
    }
    // 🔴 UN ŒUF ANNONCE CE QU'IL PEUT DONNER, JAMAIS CE QU'IL DONNE. Taire les
    //    espèces ferait du nœud un pari aveugle — la loi du mode l'interdit ;
    //    nommer la bonne serait mentir sur ce qu'est un œuf.
    if (n.type === "oeuf") {
      if (!O().oeufDisponible(partie, n.oeuf)) return T("aOeufFait");
      var pOeuf = (n.table || []).slice().sort(function (x, y) { return (y.poids || 0) - (x.poids || 0); });
      return T("aOeuf", {
        quoi: esc(pOeuf.slice(0, 3).map(function (t) { return ESP()[t.n].nom[LANG()]; }).join(", ")),
        n: pOeuf.length,
      });
    }
    // L'arbre dit son geste : on ne secoue pas un rocher, on le brise.
    if (n.type === "arbre") {
      return T(n.genre === "rocher" ? "aRocher" : "aArbre", { n: n.rencontres || 1 });
    }
    // 🔴 LE NŒUD DIT LES DEUX NOMS AVANT LE CLIC. Un choix irréversible annoncé
    //    par « le Dojo » n'est pas un arbitrage — c'est un pari. Même règle
    //    qu'au fossile, qui nomme ses deux créatures.
    if (n.type === "musee") {
      return O().ambreDisponible(partie) ? T("aMusee") : T("aMuseeFait");
    }
    // 🔴 LE NŒUD DIT POURQUOI IL EST FERMÉ. Un bouton grisé sans raison est la
    //    classe de défaut n°1 du dossier — et ici il y a deux raisons.
    if (n.type === "journal") return partie.journalLu ? T("aJournalLu") : T("aJournal");
    //  🔴 « Il dort en travers » n'est vrai que du Ronflex. Simularbre fait le
    //     tronc d'arbre, le Léviator rouge tourne dans le Lac Colère, les
    //     Voltorbe se font passer pour des Ball. La phrase de Kanto reste au
    //     Ronflex ; les autres reçoivent celle qui est vraie pour tous — la
    //     règle qui compte ici, c'est « un seul essai ».
    if (n.type === "ronflex") return T(n.espece === 143 ? "aRonflex" : "aStatique");
    if (n.type === "pension") {
      if (partie.pension) return T("aPensionPleine");
      if ((partie.equipe || []).length < 2) return T("aPensionSeul");
      return T("aPension");
    }
    if (n.type === "dojo") {
      if (!O().dojoOuvert(partie)) return T("aDojoFait");
      var duo = (n.choix || []).map(function (x) { return esc(ESP()[x].nom[LANG()]); });
      return duo.length === 2 ? T("aDojoDeux", { a: duo[0], b: duo[1] }) : T("aDojo");
    }
    if (n.type === "scene") {
      if (n.rocket) return T("aRocket");
      // 🔴 « Tu en ressors avec : CS05 Flash » — une phrase pour nommer un
      //    objet. Le nœud dit CE QU'ON Y TROUVE ; la tournure ne sert à rien.
      var cles = CLES_V();
      return esc((n.donne || []).map(function (c) { return cles[c] ? cles[c].nom[LANG()] : c; }).join(" · "));
    }
    if (n.type === "boss") {
      // 🔴 Ni le nom du Champion ni son type ici : la bannière affiche déjà le
      //    premier en grand et le second en pastille. Redire une information
      //    déjà présente n'en apporte aucune — elle encombre.
      var a = areneDe(n.arene);
      if (!a) return "";
      var equipe = equipeDuChampion(a).map(function (p) {
        return esc(ESP()[p.n].nom[LANG()]) + " " + W.PokeGenre.niveau(p.niveau);
      }).join(" · ");
      // 🔴 CE QUI SE CONSOMME SE DIT AVANT LE CLIC, PAS APRÈS. L'écran de K.O.
      //    annonçait bien les essais restants — mais la carte, elle, laissait
      //    s'engager à l'aveugle. Un joueur qui a déjà échoué deux fois doit
      //    le voir AU MOMENT DE CHOISIR sa rangée, quand il peut encore
      //    décider de se préparer autrement.
      // 🔴 ET CE QU'IL DONNE, AUSSI. Depuis v270 chaque Champion remet SA CT —
      //    une CT change une équipe pour tout le reste du voyage. Ne pas
      //    l'annoncer, c'est cacher la moitié de ce que vaut le combat, dans un
      //    mode dont la loi est qu'un nœud dit son contenu AVANT le choix.
      var don = a.ct && O().machinePour ? O().machinePour(a.ct) : null;
      var dit = equipe + resteDevantLeBoss();
      if (don) {
        dit += '<span class="pkdx-noeud-don">' +
          // ⚠️ Par la même porte : ce nœud écrivait « CT6 Toxik » quand le sac
          //    disait « CT06 Toxik ». Un seul écrit le numéro d'une machine.
          esc(T("bossDonne", { ct: nomMachine(don) })) + "</span>";
      }
      return dit;
    }
    if (n.type === "ligue") return esc(W.PokeGenre.pour(W.POKE_SCENARIO.LIGUE, "entree", null, "scenario:ligue")) + resteDevantLeBoss();
    return "";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'UNE CAPSULE VAUT CONTRE LE CHAMPION QUI FERME L'ACTE
  //
  //  🔴 MÊME PORTE QUE L'ÉCRAN D'ARÈNE. `PokePokedex.rapports` est la seule
  //     lecture de la table des types du mode : la recopier ici, c'est garantir
  //     que les deux écrans finissent par ne plus dire la même chose — et l'un
  //     des deux serait faux sans que personne le voie.
  //  ⚠️ LE PIÈGE DE 1996 EST RESPECTÉ SANS UN MOT : le Spectre ne fait RIEN au
  //     Psy en première génération. Une capsule Spectre contre Morgane rendra
  //     donc « ne touche personne », et c'est la vérité du jeu.
  //  ⚠️ Rien du tout si l'acte n'a pas de Champion : une ligne qui parle d'un
  //     adversaire absent est pire qu'une ligne manquante.
  // ═══════════════════════════════════════════════════════════════════════════
  function ctContreLeBoss(machine) {
    if (!partie || !machine || !W.PokeActes || !W.PokePokedex || !W.PokePokedex.rapports) return null;
    var acte = W.PokeActes.acteDe(partie.acte);
    var arene = acte && acte.boss ? areneDe(acte.boss) : null;
    if (!arene || !arene.equipe || !arene.equipe.length) return null;
    var a = ATT()[machine.cle];
    // Une capsule de statut ne « touche » personne au sens des types : elle
    // n'a pas de puissance, et annoncer un compte sur elle serait un chiffre
    // qui ne mesure pas ce qu'il jouxte.
    if (!a || !a.puissance) return null;
    var n = 0;
    for (var i = 0; i < arene.equipe.length; i++) {
      var e = ESP()[arene.equipe[i].n];
      if (!e) continue;
      var r = W.PokePokedex.rapports(e.types);
      if (!r || !r.faible) continue;
      for (var j = 0; j < r.faible.length; j++) {
        if ((r.faible[j].t || r.faible[j]) === machine.type) { n++; break; }
      }
    }
    return { n: n, sur: arene.equipe.length, champion: W.PokeGenre.nomChampion(arene) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  QUEL CHAMPION EST DEVANT — porte unique
  //
  //  🔴 CE CALCUL VIVAIT EN CLAIR DANS LE PC DE LÉO, et le sac en avait besoin
  //     à son tour. Recopier quatre lignes, c'est se donner deux réponses à
  //     « contre qui joue-t-on ? » — et le jour où l'une apprend les badges
  //     déjà gagnés, l'autre l'ignore. Le dossier a payé cette classe assez
  //     souvent pour ne pas la rejouer sur la question la plus structurante du
  //     voyage.
  //  ⚠️ `partie.badges` porte des FICHES, pas des numéros : un `indexOf` sur
  //     l'ordre n'aurait jamais rien trouvé, et l'écran aurait annoncé un
  //     Champion déjà battu jusqu'à la fin du voyage.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE VERDICT DE MATCH-UP, ÉCRIT UNE SEULE FOIS
  //
  //  🔴 IL ÉTAIT ÉCRIT TROIS FOIS, ET LA TROISIÈME ÉTAIT LA PLUS PAUVRE —
  //     critique du 14/08. L'écran d'arène et celui de la Ligue rendaient les
  //     QUATRE verdicts et disaient « neutre » quand il n'y en a aucun ; la
  //     boîte d'équipe, elle, n'en rendait que DEUX (`fort`, `fragile`) et se
  //     taisait sur le reste. Conséquence à l'écran : une équipe dont AUCUNE
  //     attaque ne mord sur le Champion présentait six cartes vierges — le
  //     moteur le calculait (`frappe: "rien"`), et l'écran d'avant-combat, le
  //     seul où ça change une décision, le jetait.
  //  🔑 On ne répare pas la copie pauvre : on supprime les copies. Les trois
  //     écrans passent par ici, donc un cinquième verdict ajouté demain naîtra
  //     partout à la fois. *Une loi recopiée est une loi qui va diverger.*
  //  ⚠️ L'enveloppe `.pkdx-mesure-notes` fait PARTIE du contrat. Sans elle, les
  //     notes tombaient nues dans une grille : chacune prenait sa propre
  //     rangée, le point médian séparateur sortait ORPHELIN en début de ligne,
  //     et les cartes d'une même rangée n'avaient plus la même hauteur — noms
  //     et niveaux désalignés de onze pixels. C'est ce que le propriétaire a
  //     appelé « moche », et c'était une balise manquante.
  // ═══════════════════════════════════════════════════════════════════════════
  //  ⚠️ `nom` EST OPTIONNEL : quand il est fourni, le verdict porte la PREUVE —
  //     le nom du coup qui le déclenche. Les listes serrées (arène, Ligue) le
  //     passent aussi : c'est là qu'on décide, donc c'est là qu'il faut pouvoir
  //     vérifier. Voir `mesure-arene.js` : un jugement invérifiable se lit
  //     comme un bug même quand il est juste.
  function verdictHtml(x, nom) {
    if (!x) return "";
    //  ⚠️ UN `<span>`, PAS UN `<b>`. La carte de créature emploie déjà `<b>`
    //     pour le NOM du Pokémon, et la feuille le style ainsi. Une seconde
    //     balise `<b>` dans la même carte donnait deux « noms » : relevé au
    //     banc, la preuve « Écume » sortait dans la liste des noms d'équipe.
    var par = function (cle) {
      return nom && cle ? '<span class="pkdx-mesure-par">' + esc(nom(cle)) + "</span>" : "";
    };
    var n = "";
    if (x.frappe === "fort") n += '<span class="pkdx-mesure-note est-fort">' + T("vFort") + par(x.parQuoi) + "</span>";
    if (x.frappe === "rien") n += '<span class="pkdx-mesure-note est-nul">' + T("vRien") + "</span>";
    if (x.subit === "fragile") n += '<span class="pkdx-mesure-note est-risque">' + T("vFragile") + par(x.parQuoiSubi) + "</span>";
    if (x.subit === "tient") n += '<span class="pkdx-mesure-note est-tient">' + T("vTient") + "</span>";
    return '<span class="pkdx-mesure-notes">' +
      (n || '<span class="pkdx-mesure-note est-muet">' + T("vRien2") + "</span>") + "</span>";
  }

  function areneDevant() {
    var acte = W.PokeActes && W.PokeActes.acteDe(partie.acte);
    if (!acte || !acte.boss) return null;
    var a = areneDe(acte.boss);
    if (!a) return null;
    for (var b = 0; b < (partie.badges || []).length; b++) {
      if (partie.badges[b].ordre === a.ordre) return null;
    }
    return a;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉQUIPE D'UN CHAMPION — PORTE UNIQUE, ET IL A FALLU UN AUDIT POUR LA VOIR
  //
  //  🔴 L'ÉCRAN MENTAIT SUR LE NIVEAU DU CHAMPION, depuis le durcissement du
  //     14/08. Le combat montait l'équipe (`bossNiveau` du serment et du sceau,
  //     PLUS `PokeActes.monteeChampion`), et TOUT le reste lisait `a.equipe`
  //     brut, c'est-à-dire le canon du ROM. Devant Giovanni : « Rhinoféros
  //     N.45 » à l'écran, N.61 en combat. Le joueur préparait un combat qui
  //     n'existait pas.
  //  🔴 ET L'ALERTE QUI DEVAIT LE SAUVER ÉTAIT MUETTE. `aLaHauteur` compare
  //     l'équipe au plus haut niveau adverse MOINS trois : calculée sur le
  //     canon, elle plaçait le seuil à 47 là où le vrai était 63. L'avertissement
  //     écrit pour se déclencher exactement dans la bande où l'on perd ne
  //     s'allumait plus jamais aux arènes 3 à 8.
  //  ✅ UNE SEULE FONCTION rend l'équipe RÉELLE, et l'affichage, les mesures et
  //     le combat la lisent tous. C'est la règle que le mode s'applique partout
  //     ailleurs (`plafondDe`, `PokeSerments.effet`) et qui manquait ici.
  //  ⚠️ Elle borne à 100 comme le combat : le moteur ne calcule pas au-delà.
  // ═══════════════════════════════════════════════════════════════════════════
  function equipeDuChampion(a) {
    if (!a || !a.equipe) return [];
    var plus = SERM().bossNiveau +
      (W.PokeActes && W.PokeActes.monteeChampion ? W.PokeActes.monteeChampion(a.ordre) : 0);
    return a.equipe.map(function (x) {
      return { n: x.n, niveau: Math.min(100, x.niveau + plus) };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉQUIPE D'UN COMBAT DE LIGUE — LA MÊME PORTE, ET ELLE MANQUAIT (16/08)
  //
  //  🔴 LA FAUTE DU 14/08, REJOUÉE AU SOMMET. `equipeDuChampion` existe parce
  //     que l'écran d'arène lisait le canon nu pendant que le combat montait
  //     l'équipe. La Ligue faisait pire : elle lisait le canon nu à CINQ
  //     endroits — l'échelle des quatre membres, la mesure « ce qui tient
  //     contre Olga », l'annonce de menace, la vitrine d'avant-combat et le
  //     combat lui-même — et personne ne montait rien. Le sommet du voyage
  //     était le seul endroit du mode où ni un sceau, ni un serment, ni le
  //     durcissement du 14/08 n'arrivaient.
  //  ⚠️ `rang` N'EST PAS DÉCORATIF : il vaut 1 à 4 pour le Conseil et 5 pour le
  //     rival. La montée est plate aujourd'hui (voir `PokeActes.monteeLigue`),
  //     mais la passer ici garde l'option de la graduer en un seul endroit.
  // ═══════════════════════════════════════════════════════════════════════════
  function equipeDeLaLigue(brut) {
    if (!brut || !brut.length) return [];
    var plus = SERM().bossNiveau +
      (W.PokeActes && W.PokeActes.monteeLigue ? W.PokeActes.monteeLigue() : 0);
    return brut.map(function (x) {
      return { n: x.n, niveau: Math.min(100, x.niveau + plus) };
    });
  }

  // ⚠️ REMONTÉE D'UN CRAN : elle vivait dans `ecranArene`, donc l'écran du
  //    RIVAL ne pouvait pas la lire — et il montrait sprite, nom, niveau, sans
  //    un type ni un « FRAPPE EN », alors que son propre en-tête promet « on
  //    montre son équipe entière avant : le voyage se prépare, il ne se subit
  //    pas — même règle que devant une arène ». La règle était écrite, pas
  //    appliquée, et la décision est pourtant la même : prendre la branche ou
  //    la contourner.
  function typesFrappes(x) {
    if (!M().attaquesAuNiveau) return [];
    var vus = [], liste = M().attaquesAuNiveau(x.n, x.niveau) || [];
    for (var i = 0; i < liste.length; i++) {
      var at = ATT()[liste[i].cle];
      if (!at || !at.puissance) continue;
      if (vus.indexOf(at.type) < 0) vus.push(at.type);
    }
    return vus;
  }

  function areneDe(ordre) {
    for (var i = 0; i < ARENES().length; i++) if (ARENES()[i].ordre === ordre) return ARENES()[i];
    return null;
  }

  // 🔴 LA TEINTE D'UN NŒUD NOMME TOUJOURS QUELQUE CHOSE. C'est la loi du mode :
  //    la couleur ne décore pas, elle dit un type. Un nœud de rencontre prend le
  //    type de son espèce RARE — celle qui fait choisir — et affiche sa pastille
  //    juste en dessous ; une arène prend le type de son Champion ; un
  //    légendaire le sien. Les autres nœuds restent à l'encre : ils ne parlent
  //    d'aucun type, donc ils n'ont droit à aucune couleur.
  function typeDuNoeud(n) {
    if (n.type === "boss") { var a = areneDe(n.arene); return a ? W.PokeType.id(a.type) : null; }
    if (n.type === "legendaire") return ESP()[n.espece].types[0];
    if (n.annonce && n.annonce.length) {
      var vedette = null;
      for (var i = 0; i < n.annonce.length; i++) if (n.annonce[i].rare) vedette = n.annonce[i];
      if (!vedette) vedette = n.annonce[0];
      return ESP()[vedette.n].types[0];
    }
    // ⚠️ LE TYPE DU MENEUR, pas un dominant calculé sur l'équipe. Le meneur est
    //    celui qu'on affronte en premier, donc celui contre qui on choisit son
    //    ouverture ; une moyenne aurait annoncé un type que personne n'envoie.
    var adv = equipeOpposee(n);
    if (adv.length && ESP()[adv[0].n]) return ESP()[adv[0].n].types[0];
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'UN NŒUD DE COMBAT OPPOSE — PORTE UNIQUE
  //
  //  🔴 UN DRESSEUR OPPOSE UN TYPE, ET LA CARTE N'EN DISAIT RIEN. Les nœuds
  //     d'herbes portaient leur pastille et leurs créatures depuis le premier
  //     jour ; les nœuds de dresseur et de rival, non — alors que ce sont les
  //     combats qu'on CHOISIT d'aller chercher. Une rangée « Dresseur · Hautes
  //     herbes · Boutique » ne se départageait donc sur rien, alors que la table
  //     des types est le seul vrai levier tactique du jeu d'origine : savoir
  //     qu'une branche mène à de l'INSECTE quand on mène un Bulbizarre, c'est
  //     une décision, et elle existait dans la donnée sans jamais monter.
  //  🔴 UNE SEULE PORTE POUR LES DEUX. Le rival est un dresseur qui a un nom :
  //     lui écrire son propre calcul aurait garanti qu'un jour l'un montre son
  //     équipe et l'autre non — la divergence que ce dossier paye à chaque fois
  //     qu'il recopie.
  //  ⚠️ NI LE CHAMPION NI LA LIGUE : leur bannière écrit déjà l'équipe en toutes
  //     lettres et tient son type de l'Arène. Deux affichages pour une même
  //     chose feraient deux grammaires sur le même écran.
  function equipeOpposee(n) {
    if (n.type === "dresseur") return n.equipe || [];
    if (n.type === "rival") return (P().equipeRival(partie, n.rencontre, n.vise) || []);
    return [];
  }

  // Le nom que porte la bannière de fin d'acte : le Champion, ou la Ligue.
  function nomDuBoss(n) {
    if (n.type === "ligue") return T("nLigue");
    var a = areneDe(n.arene);
    return a ? W.PokeGenre.nomChampion(a) : "";
  }

  // 🔴 LE DÉTAIL DESCEND SOUS LA LIGNE PRINCIPALE. Tout tenait dans une phrase
  //    dense — « 3 rencontres — Rattata 45 % · Nidoran♀ 40 % · Nidoran♂ 5 %
  //    (rare) » — qu'il fallait déchiffrer pour arbitrer. Un nœud se lit
  //    maintenant en deux temps : ce que c'est, puis ce qu'on y croise.
  //    Les taux des espèces communes ont disparu : trois nombres qui font cent
  //    n'aident à rien. Celui de la RARE reste, parce que lui décide.
  function details(n, t) {
    var bouts = [];
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 UN JEU POKÉMON QUI ANNONCE SES POKÉMON EN TEXTE. La carte listait
    //    « Roucool · Mystherbe · Férosinge 25 % » — des noms, dans un jeu dont
    //    le sujet est de VOIR des créatures. Les références actuelles du genre
    //    montrent les sprites partout ; nos écrans se lisaient comme un article
    //    bien maquetté plutôt que comme un jeu.
    //    On montre donc les créatures. Le nom reste dans l'`alt` et dans
    //    l'infobulle : rien n'est perdu pour un lecteur d'écran, et le taux de
    //    la rare — la seule information qui décide — garde ses chiffres.
    // 🔴 ET ÇA RENFORCE LA LOI DU MODE au lieu de l'affaiblir : « toute couleur
    //    à l'écran nomme un type ou une créature ». Un sprite EST une créature.
    // ═══════════════════════════════════════════════════════════════════════
    if (n.annonce) {
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 CE QU'ON A DÉJÀ SE MARQUE, SINON L'ANNONCE NE DÉCIDE RIEN. Deux
      //    nœuds d'herbes annoncent chacun deux espèces ; ce qui les distingue,
      //    c'est laquelle MANQUE au Pokédex — et le joueur devait s'en
      //    souvenir espèce par espèce, voyage après voyage. Le nœud montrait
      //    donc l'information sans permettre de s'en servir.
      // ⚠️ ON MARQUE CE QUI EST DÉJÀ PRIS, PAS CE QUI MANQUE : le neuf doit
      //    rester au premier plan. Estomper l'acquis fait ressortir le reste
      //    sans ajouter un seul élément à l'écran.
      // ⚠️ ET C'EST LE COMPTE, PAS LE VOYAGE. Le Pokédex se remplit entre les
      //    parties : une espèce prise il y a trois voyages est acquise, et la
      //    remontrer comme neuve enverrait chasser ce qu'on a déjà.
      // ═══════════════════════════════════════════════════════════════════════
      var deja = (W.PokeProgression && W.PokeProgression.lire().pris) || {};
      var vignettes = n.annonce.map(function (x) {
        var nom = esc(ESP()[x.n].nom[LANG()]);
        return '<span class="pkdx-vue' + (x.rare ? " est-rare" : "") +
            (deja[x.n] ? " est-connue" : "") + '"' +
            ' data-info="espece" data-info-val="' + x.n + '">' +
          '<img alt="' + nom + '" loading="lazy" src="' + W.PokeSprites.face(x.n, "?i=6") + '">' +
          (x.rare ? '<b class="pkdx-vue-taux">' + x.taux + " %</b>" : "") +
        "</span>";
      }).join("");
      if (vignettes) bouts.push('<span class="pkdx-vues">' + vignettes + "</span>");
    }
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 « SCOUT · 2 POKÉMON » N'EST PAS UNE ANNONCE, C'EST UNE ÉTIQUETTE.
    //    Six nœuds de dresseur sur la carte de l'acte 1, tous écrits pareil, et
    //    le nœud portait pourtant son équipe — espèces ET niveaux — depuis le
    //    premier jour. Le jeu savait exactement qui attendait derrière chaque
    //    branche et n'en disait rien : on choisissait donc un combat à
    //    l'aveugle, ce qui est l'exact contraire d'un choix.
    //    Montré, le même nœud devient « Scout · Rattata 9, Roucool 11 » — on
    //    juge la menace, on la compare aux herbes d'à côté, on décide.
    // ⚠️ ON MONTRE TOUTE L'ÉQUIPE, pas seulement le meneur : c'est le NOMBRE
    //    autant que l'espèce qui fait la difficulté, et il tenait déjà dans la
    //    ligne au-dessus. Cacher la queue laisserait croire à un combat court.
    // ⚠️ UN SEUL CHIFFRE DE NIVEAU, PAS UN PAR CRÉATURE. Posé à la suite comme
    //    le taux de la rare, il donnait « 🐛 7 🐛 7 🐛 7 1 050 ₽ » : trois
    //    niveaux et un prix, tous en gras, tous au même endroit — on ne savait
    //    plus lequel était quoi. Collé SUR chaque vignette, il couvrait un tiers
    //    d'un sprite de 34 px, et le sprite est le sujet : la loi du mode est
    //    qu'un jeu Pokémon MONTRE ses Pokémon.
    //    Ce qui décide, de toute façon, c'est la MARCHE à monter — « N.7 » ou
    //    « N.7-9 » se compare d'un coup d'œil au niveau de sa propre équipe.
    //    Le détail par créature reste sous l'infobulle de chaque vignette.
    var adverses = equipeOpposee(n);
    if (adverses.length) {
      var faces = adverses.map(function (x) {
        var e = ESP()[x.n];
        if (!e) return "";
        return '<span class="pkdx-vue" data-info="espece" data-info-val="' + x.n + '">' +
          '<img alt="' + esc(e.nom[LANG()]) + '" loading="lazy" src="' + W.PokeSprites.face(x.n, "?i=6") + '">' +
        "</span>";
      }).join("");
      if (faces) bouts.push('<span class="pkdx-vues">' + faces + "</span>");
      var bas = adverses[0].niveau, haut = adverses[0].niveau;
      for (var q = 1; q < adverses.length; q++) {
        if (adverses[q].niveau < bas) bas = adverses[q].niveau;
        if (adverses[q].niveau > haut) haut = adverses[q].niveau;
      }
      bouts.push('<span class="pkdx-niveau est-pastille">' +
        T(bas === haut ? "aNiveau" : "aNiveaux", { a: bas, b: haut }) + "</span>");
    }
    if (n.type === "dresseur") bouts.push('<span class="pkdx-gain">' + argent(n.gain) + "</span>");
    // Un légendaire ne revient pas : la contrainte vaut mieux qu'un taux.
    if (n.type === "legendaire") {
      bouts.push('<span class="pkdx-espece est-rare">' + T("aUnEssai") + "</span>");
      // ── CE QUE LA CHASSE DEMANDE, ET CE QU'ON A ─────────────────────────
      //  Deux faits, pas un conseil. Le joueur décide.
      bouts.push('<span class="pkdx-noeud-chasse">' + esc(ditChasse()) + "</span>");
    }
    if (t) bouts.push(W.PokeType.pastille(t));
    return bouts.length ? '<span class="pkdx-noeud-plus">' + bouts.join("") + "</span>" : "";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'ON A POUR CHASSER — LES DEUX SEULS FAITS QUI DÉCIDENT
  //
  //  🔴 LES BALLS SE COMPTENT TOUTES, PAS SEULEMENT LES MEILLEURES. Une Poké
  //     Ball sur un légendaire ne vaut presque rien, mais elle vaut mieux que
  //     rien du tout, et c'est au joueur d'en juger. La Master Ball est exclue :
  //     elle ne se « tente » pas, elle se dépense — l'annoncer ici ferait croire
  //     qu'on en a plusieurs.
  //  🔴 ET « DE QUOI L'ENDORMIR » SE LIT DANS L'ÉQUIPE, pas dans le sac. En
  //     première génération, un légendaire ne se prend pas sans statut : la
  //     Ball la meilleure au monde échoue neuf fois sur dix sur une cible
  //     éveillée à pleins PV. C'est la moitié de la préparation, et le mode ne
  //     la nommait nulle part.
  //  ⚠️ On lit les effets DÉCLARÉS des attaques, pas une liste de noms écrite à
  //     la main : une liste recopiée diverge, et celle-ci divergerait au premier
  //     ajout d'attaque.
  // ═══════════════════════════════════════════════════════════════════════════
  function ditChasse() {
    if (!partie) return "";
    var balls = 0, cle;
    for (cle in W.PokeCapture.BALLS) {
      if (cle === "MASTER_BALL") continue;
      balls += (partie.sac && partie.sac[cle]) || 0;
    }
    var dort = false;
    for (var i = 0; i < partie.equipe.length && !dort; i++) {
      var atk = partie.equipe[i].attaques || [];
      for (var j = 0; j < atk.length; j++) {
        var a = ATT()[atk[j].cle];
        if (a && /SLEEP|ENDORM/i.test(String(a.effet || ""))) { dort = true; break; }
      }
    }
    // ⚠️ L'ESPACE AVANT LE POINT MÉDIAN EST INSÉCABLE (U+00A0), et ça compte
    //    depuis que cette ligne peut REVENIR À LA LIGNE : elle débordait de sa
    //    carte, relevé par le propriétaire, capture à l'appui. Sans elle, le
    //    séparateur se retrouverait seul en tête de ligne, lu comme une puce
    //    orpheline. Elle était déjà là — on ne la retire pas en croyant ranger.
    return (balls ? T("aChasseBalls", { n: balls }) : T("aChasseSansBall")) +
      " · " + T(dort ? "aChasseDort" : "aChasseSansDort");
  }

  // Le lieu d'une rangée. La bande ne se répète pas : elle marque le CHANGEMENT
  // d'endroit — sans elle, les neuf actes se ressemblent tous, et c'est une
  // bonne part de ce qui faisait lire la carte comme « une liste de lieux ».
  function lieuDe(rangee) {
    for (var i = 0; i < rangee.length; i++) if (rangee[i].lieu) return rangee[i].lieu;
    return null;
  }
  // L'étape d'une rangée : c'est elle qui porte la description, pas le lieu —
  // deux étapes peuvent partager une ville (Céladopole et le repaire Rocket).
  function etapeDe(rangee) {
    for (var i = 0; i < rangee.length; i++) if (rangee[i].etape) return rangee[i].etape;
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'UNE PORTE DE MESURE A EMPRUNTÉ, LA CARTE LE REND
  //
  //  🔴 MON PREMIER CORRECTIF NE TENAIT QUE SUR LE CHEMIN DE SORTIE. Il
  //     reposait l'acte et l'équipe dans le `apres` de l'écran de capsule —
  //     donc seulement si l'on CLIQUE une option. Une porte appelée puis
  //     abandonnée (c'est le cas normal quand on balaie des rangs pour
  //     inspecter un écran) laissait la partie modifiée, et l'appel suivant
  //     photographiait l'état déjà sali. Vérifié à l'écran : le bandeau
  //     annonçait un autre acte que celui du voyage.
  //  ✅ La photo se prend UNE fois, et c'est le retour à la carte qui repose —
  //     quel que soit le chemin par lequel on y revient.
  // ═══════════════════════════════════════════════════════════════════════════
  var photoMesure = null;
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 CET INSTANTANÉ NE COUVRAIT QUE TROIS CHAMPS — 11/08/2026, banc mobile.
  //     Une liste de champs tenue à la main à côté de portes qui grossissent se
  //     laisse dépasser, et elle l'a été :
  //       · `mesurerActe` remet `carteActe` à null et `rangee` à zéro — la
  //         carte du joueur était RÉGÉNÉRÉE et sa position perdue ;
  //       · `mesurerFin` ne photographiait RIEN et appelait `fin()`, qui efface
  //         la sauvegarde, COMPTE le voyage dans les statistiques à vie et
  //         REMPLACE l'équipe de duel. Un écran simplement REGARDÉ détruisait
  //         la partie, et je l'ai constaté en perdant la mienne.
  //  🔑 ON PHOTOGRAPHIE L'ÉTAT ÉCRIT, pas une liste de champs : il est complet
  //     par construction, et une porte neuve n'a rien à venir ajouter ici.
  //     *La même faute que la veille sur `EFFETS_TRAITES` : une liste tenue à la
  //     main à côté de ce qu'elle décrit finit toujours par mentir.*
  // ═══════════════════════════════════════════════════════════════════════════
  function photographierPourMesure() {
    if (!photoMesure) {
      photoMesure = { acte: partie.acte, equipe: partie.equipe.length,
                      ligueEtape: partie.ligueEtape,
                      // 🔴 PAR VALEUR, PAS PAR RÉFÉRENCE — 11/08/2026. La v522
                      //    photographiait `partie.carteActe` tel quel : le MÊME
                      //    objet. Or `mesurerChasse` pousse un nœud DEDANS, et
                      //    reposer un objet muté avec lui-même ne repose rien.
                      //    Vu à l'écran : deux « UNE PRÉSENCE / Artikodin »
                      //    identiques, d'id `mesure-chasse`, restés dans la
                      //    carte du joueur. La sauvegarde brute était bien
                      //    restaurée — puis le jeu la réécrivait depuis l'état
                      //    en mémoire, toujours sale.
                      //    *Un instantané ne vaut que s'il COPIE ce qui peut
                      //    être modifié en place.*
                      carteActe: partie.carteActe
                        ? JSON.parse(JSON.stringify(partie.carteActe)) : partie.carteActe,
                      rangee: partie.rangee,
                      fini: partie.fini,
                      //  ⚠️ PAR VALEUR, même leçon que `carteActe` : la porte
                      //     du sac POSE des clés dans cet objet.
                      cles: JSON.parse(JSON.stringify(partie.cles || {})),
                      ecrit: W.PokeProgression.instantane() };
    }
  }
  function reposerApresMesure() {
    if (!photoMesure) return;
    // ⚠️ UNE PORTE QUI MONTRE UN AUTRE ACTE DOIT SURVIVRE AU PREMIER RENDU.
    //    `mesurerActe` pose `garder` : la carte se dessine dans l'acte demandé,
    //    et c'est le rendu SUIVANT qui repose l'état. Sans ce cran, la porte
    //    remettait l'acte avant de dessiner et montrait toujours le même.
    if (photoMesure.garder) { photoMesure.garder = false; return; }
    partie.acte = photoMesure.acte;
    partie.equipe.length = photoMesure.equipe;
    partie.ligueEtape = photoMesure.ligueEtape;
    partie.carteActe = photoMesure.carteActe;
    partie.rangee = photoMesure.rangee;
    partie.cles = photoMesure.cles;
    // 🔴 `fini` EN DERNIER PARMI LES CHAMPS, ET AVANT TOUT LE RESTE DE `carte()`
    //    qui teste `partie.fini` deux lignes plus bas : sans lui, on repartirait
    //    droit sur l'écran de fin qu'on vient de regarder.
    partie.fini = photoMesure.fini;
    W.PokeProgression.restaurer(photoMesure.ecrit);
    photoMesure = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UNE CHASSE INTERROMPUE SE SOLDE AU RETOUR
  //
  //  🔴 `manque` EST UN MARQUEUR EN ATTENTE, PAS UNE ISSUE. On l'inscrit avant
  //     le combat pour que l'essai ne puisse plus s'évaporer à un rechargement,
  //     et les trois issues l'écrasent. S'il survit, c'est que le voyage a été
  //     coupé en pleine chasse — et il faut le DIRE, sinon on a remplacé un
  //     trou silencieux par un état silencieux.
  //  ✅ On le solde en « enfui » : le dresseur n'a jamais fini, l'oiseau est
  //     parti. Les trois issues du vocabulaire restent pris / abattu / enfui.
  //  ⚠️ Une seule fois, et au retour à la carte — pas pendant le combat, où le
  //     message se glisserait au milieu d'un tour.
  // ═══════════════════════════════════════════════════════════════════════════
  function solderChasseInterrompue(apres) {
    var enAttente = null;
    for (var n in partie.legendaires) {
      if (partie.legendaires[n] === "manque") { enAttente = n; break; }
    }
    if (!enAttente) return false;
    partie.legendaires[enAttente] = "enfui";
    message(T("nLegendaire"),
      W.PokeGenre.pour(W.POKE_SCENARIO.POKEDEX, "legendaireManque", null, "scenario:pokedex"),
      apres);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 SUR TÉLÉPHONE, LIRE UNE CASE LA JOUAIT — 11/08/2026, relevé par le
  //     propriétaire. `infobulles.js` ouvre la bulle sur `touchstart` ; le
  //     navigateur envoie ENSUITE le `click` sur le même bouton, et le nœud
  //     partait. L'écran suivant se dessinait, l'ancre disparaissait, et
  //     l'observateur fermait la bulle : d'où « elle apparaît très vite et ne
  //     reste pas ». Le joueur voulait un renseignement, il a dépensé sa
  //     branche — et une branche prise ferme les autres pour de bon.
  //     C'est le défaut du choix du starter, réglé le matin même, à l'endroit
  //     où il coûte le plus cher : le geste que le mode répète le plus.
  //  ✅ AU DOIGT, LE PREMIER APPUI ARME, IL NE JOUE PAS. La bulle reste ouverte
  //     et un bouton apparaît sous la rangée, qui NOMME la destination. À la
  //     souris rien ne change : le survol renseigne déjà sans cliquer, et
  //     imposer deux clics là où le doigt n'a pas le choix punirait la moitié
  //     des joueurs pour un défaut de l'autre.
  //  ⚠️ ON LIT LE TYPE DE POINTEUR, PAS L'APPAREIL. `matchMedia("(hover: none)")`
  //     se trompe sur un portable tactile comme sur une tablette avec souris ;
  //     `pointerdown` dit ce qui a VRAIMENT touché l'écran, à chaque geste.
  // ═══════════════════════════════════════════════════════════════════════════
  var dernierPointeur = "";
  var noeudArme = null;
  function suivreLePointeur() {
    if (suivreLePointeur.fait) return;
    suivreLePointeur.fait = true;
    D.addEventListener("pointerdown", function (e) {
      dernierPointeur = e.pointerType || "mouse";
    }, true);
  }

  function armerNoeud(bouton, id) {
    noeudArme = id;
    var rangee = bouton.parentNode;
    var freres = rangee.children;
    for (var i = 0; i < freres.length; i++) {
      var vise = freres[i] === bouton;
      freres[i].classList.toggle("est-arme", vise);
      freres[i].setAttribute("aria-pressed", vise ? "true" : "false");
    }
    var pied = racine.querySelector("#pk-aller");
    if (!pied) {
      pied = D.createElement("li");
      pied.className = "pkdx-aller";
      pied.id = "pk-aller";
      rangee.parentNode.insertBefore(pied, rangee.nextSibling);
    }
    var titre = bouton.querySelector(".pkdx-noeud-titre");
    //  ⚠️ LE BOUTON SE CRÉE ICI, DONC SON ÉCOUTEUR AUSSI. `surClic` ne branche
    //     que ce qui existe à l'appel — le piège qui avait rendu muet le bouton
    //     de confirmation du starter quelques heures plus tôt.
    pied.innerHTML = '<p class="pkdx-dit">' + esc(T("carteUneSeule")) + "</p>" +
      '<button type="button" class="pkdx-touche est-definitive" id="pk-aller-ok">' +
        esc(T("carteYAller", { ou: titre ? titre.textContent : "" })) + "</button>";
    var ok = pied.querySelector("#pk-aller-ok");
    ok.addEventListener("click", function () { choisirNoeud(id); });
    ok.focus();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  GARDER LE VOYAGE — UNE SEULE PORTE, DEUX ENDROITS OÙ RIEN N'EST À MOITIÉ
  //
  //  🔴 LA LIGUE N'AVAIT AUCUN POINT DE GARDE, ET C'EST LE PLUS LONG PASSAGE
  //     DU MODE. Le voyage ne se gardait qu'à la carte ; or les cinq combats
  //     de la Ligue s'enchaînent par `apres: ecranLigue` et ne repassent
  //     JAMAIS par elle. Un joueur évincé au quatrième — un appel, un onglet
  //     que le téléphone reprend — revenait à la carte de l'acte 9 et
  //     recommençait les cinq. C'est exactement l'endroit où l'on perd le plus,
  //     et c'était le seul sans filet.
  //  🔑 L'ÉCRAN DE LIGUE PORTE LE MÊME INVARIANT QUE LA CARTE : le combat
  //     suivant n'est pas engagé, le précédent est soldé. Rien n'est à moitié
  //     résolu, donc garder ici ne permet de rembobiner aucun coup.
  //  ⚠️ ET ÇA RESSERRE LE RESQUILLAGE au lieu de l'ouvrir : avant, quitter en
  //     pleine Ligue rendait les CINQ combats ; maintenant on reprend là où
  //     l'on était.
  //  🔴 ET LE DÉFI DU JOUR SE GARDE AUSSI DEPUIS LE 19/08 — mais CHEZ LUI, et
  //     jamais en plein combat. Voir `defiEcrire` : la règle n'a pas changé
  //     (un combat engagé ne se rejoue pas), c'est la punition qui a cessé de
  //     confondre « abandonner » et « perdre sa page ».
  //  ⚠️ DEUX EMPLACEMENTS, PAS UN. Écrire l'essai du jour dans la clé du voyage
  //     écraserait la carrière libre en cours — c'est mot pour mot la plainte
  //     de @Z3no_ le 18/08, et on ne la répare pas en la déplaçant.
  // ═══════════════════════════════════════════════════════════════════════════
  function garderLeVoyage() {
    if (!partie) return;
    if (W.POKE_GRAINE) {
      if (defiDate) W.PokeProgression.defiEcrire(defiDate, partie, hasard, journal);
      return;
    }
    W.PokeProgression.voyageEcrire(partie, hasard, journal);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE COMBAT ENGAGÉ NE SE REJOUE JAMAIS  [19/08/2026]
  //
  //  🔴 C'EST LA MOITIÉ DU CORRECTIF QUI PROTÈGE LE CLASSEMENT. Garder l'essai
  //     du jour sans ce marqueur rendrait la triche mécanique : on engage un
  //     Champion, on voit le combat tourner mal, on ferme l'onglet, on reprend
  //     à la carte d'avant. Le journal ne pourrait même pas le dire.
  //  ✅ Le marqueur s'inscrit AVANT le combat et l'écrase au retour. S'il
  //     survit, c'est que la page est morte en plein combat : il se solde en
  //     DÉFAITE, avec le prix entier — équipe à terre, moitié de la bourse,
  //     un essai d'acte consommé. Exactement ce qu'aurait coûté la défaite
  //     qu'on a fuie, ni plus ni moins.
  //  ⚠️ Il porte `boss` parce que le prix n'est pas le même devant un Champion
  //     et sur une route, et qu'au retour on n'a plus le combat sous la main.
  //  ⚠️ Le voyage libre n'en a pas besoin : il se garde déjà à la carte, et il
  //     ne se compare à personne. On ne lui ajoute pas une contrainte pour
  //     l'uniformité.
  // ═══════════════════════════════════════════════════════════════════════════
  function marquerCombatEngage(options) {
    if (!W.POKE_GRAINE || !partie || !defiDate) return;
    partie.engage = { boss: !!(options && (options.arene || options.ligue)) };
    garderLeVoyage();
  }

  function oublierCombatEngage() {
    if (!partie || !partie.engage) return;
    delete partie.engage;
  }

  function carte() {
    reposerApresMesure();
    suivreLePointeur();
    noeudArme = null;
    // 🔴 LA CARTE EXIGE UN VOYAGE COMMENCÉ, C'EST-À-DIRE UN STARTER (13/08).
    //    Sans lui : filtre solo de la rangée 0 sauté (`equipe.length` falsy),
    //    combats ouverts sur une équipe vide, et en carrière la sauvegarde
    //    pérennisait l'état. La précondition se tient À LA PORTE de l'écran,
    //    pas chez chacun de ses appelants — c'est la garde de classe, la
    //    lentille corrigée n'en est qu'un amont parmi les possibles.
    if (!partie.starter) return choixStarter();
    // La carte est la fin du flux de création : l'étape en cours se solde.
    reprendreCreation = null;
    moissonAvantSortie = null;
    if (partie.fini) return fin();
    if (solderChasseInterrompue(function () { return carte(); })) return;
    // 🔴 LA PORTE D'ENTRÉE DU RETOUR DE PENSION. `acteSuivant` a rendu le
    //    pensionnaire et posé le résultat sur la partie ; sans cet appel, il
    //    reviendrait EN SILENCE — grandi, facturé, et le joueur ne saurait ni
    //    qu'il est là ni ce qu'il a coûté. « Ce qui se pose doit se dire. »
    if (partie.pensionRetour) return jouerRetourPension(carte);
    var acte = W.PokeActes.acteDe(partie.acte);
    if (!acte) { partie.fini = "vitrine"; return fin(); }
    // La carte se génère UNE FOIS par acte, depuis la graine : au Défi du jour,
    // tout le monde a exactement la même.
    if (!partie.carteActe) partie.carteActe = W.PokeCarteActes.generer(acte, partie, hasard);
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE VOYAGE SE GARDE ICI, ET APRÈS LA CARTE. La carte est le seul
    //     instant où aucun nœud n'est à moitié résolu : sauver en plein combat
    //     laisserait reprendre AVANT un coup perdu, ce qui est de la triche.
    //  🔴 ET APRÈS, PAS AVANT — défaut trouvé en éprouvant la reprise : posée
    //     deux lignes plus haut, la sauvegarde partait SANS `carteActe`, et la
    //     reprise régénérait la carte depuis un autre point de la graine. Au
    //     premier nœud le hasard a déjà avancé : le joueur serait revenu dans
    //     un acte qui n'est plus le sien, mêmes lieux, autres nœuds.
    //  ⚠️ Le Défi du jour n'est pas gardé — voir `voyageEcrire`.
    // ═══════════════════════════════════════════════════════════════════════
    garderLeVoyage();

    // 🔴 L'INSTANT SÛR, ET LE SEUL. On vient de sceller l'état : un
    //    rechargement ne coûte rien ici, alors qu'en combat il coûterait le
    //    combat — `voyageEcrire` ne garde qu'à la carte, exprès. Si une version
    //    plus récente est servie, `momentSur()` recharge MAINTENANT plutôt que
    //    de laisser le joueur finir son voyage sur du code périmé, ce qui finit
    //    en écart de score au rejeu serveur chez un joueur honnête.
    try { if (W.PokeVeille && W.PokeVeille.momentSur) W.PokeVeille.momentSur(); } catch (e) {}

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LE FILET, ET IL N'ÉTAIT PAS TENDU. `carteSansIssue` a été écrite pour
    //    que le JEU pose la question — « cette carte offre-t-elle encore un
    //    nœud ? » — après le blocage dur qui laissait le joueur devant une
    //    carte morte, sans message, sans bouton, indéfiniment. Seul le
    //    détecteur l'appelait. Le jour où un cas inconnu passe entre les
    //    mailles, le joueur retrouve donc exactement l'écran d'origine.
    //    Six cents parties de sonde n'en produisent aucun ; c'est justement à
    //    ça que sert un filet — au cas qu'on n'a pas prévu.
    // ═══════════════════════════════════════════════════════════════════════
    if (P().carteSansIssue(partie)) {
      coqueLibre(
        '<p class="pkdx-surtitre">' + T("acte", { n: partie.acte, t: W.PokeActes.nombre() }) + "</p>" +
        '<h1 class="pkdx-titre">' + T("sansIssueTitre") + "</h1>" +
        '<p class="pkdx-dit est-alerte">' + T("sansIssueDit") + "</p>" +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-sansissue">' +
            T("sansIssueSortir") + "</button>" +
        "</div>"
      );
      racine.querySelector("#pk-sansissue").addEventListener("click", function () {
        partie.fini = "vitrine";
        fin();
      });
      return;
    }

    var lieuPrecedent = null;
    var rangees = partie.carteActe.rangees.map(function (r, i) {
      var etat = i < partie.rangee ? "passee" : i === partie.rangee ? "courante" : "avenir";
      var final = r.length === 1 && (r[0].type === "boss" || r[0].type === "ligue");

      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 CE QUI EST DERRIÈRE PESAIT AUTANT QUE CE QU'ON JOUE. Une rangée
      //    franchie occupait la même hauteur qu'une rangée jouable : à l'acte
      //    4, huit rangées passées poussaient le choix courant sous la ligne
      //    de flottaison, et la carte redevenait ce qu'on lui reprochait — une
      //    liste qu'on fait défiler.
      //    Une rangée passée n'est plus une décision : c'est un SOUVENIR. Elle
      //    se réduit donc à une trace — ce qu'on a pris, ce qu'on a laissé —
      //    sur une seule ligne. La place regagnée revient à la rangée courante,
      //    qui est la seule qui demande de réfléchir.
      // 🔴 RIEN NE DISPARAÎT : le nom du nœud pris, celui des branches
      //    laissées, tout reste lisible. On change le POIDS, pas le contenu.
      // ═══════════════════════════════════════════════════════════════════════
      if (etat === "passee") {
        // 🔴 LE SUIVI DES LIEUX SE FAIT AVANT DE SORTIR. Sans cette ligne, une
        //    rangée passée ne mémorisait plus son lieu, et la bande du lieu
        //    SUIVANT se croyait inchangée — ou se répétait. Un retour anticipé
        //    qui saute un effet de bord est un piège classique.
        if (lieuDe(r)) lieuPrecedent = lieuDe(r);
        var trace = r.map(function (n) {
          var p = !!partie.noeudsVisites[n.id];
          return '<span class="pkdx-trace-noeud' + (p ? " est-pris" : " est-perdu") + '"' +
              (typeDuNoeud(n) ? W.PokeType.attr(typeDuNoeud(n)) : "") + ">" +
            W.PokeIcones.svg(DESSIN[n.type] || n.type, { taille: 14 }) +
            "<b>" + titreDuNoeud(n) + "</b>" +
          "</span>";
        }).join('<span class="pkdx-trace-ou" aria-hidden="true"></span>');
        return '<li class="pkdx-trace" data-etat="passee">' + trace + "</li>";
      }

      var noeuds = r.map(function (n) {
        var pris = !!partie.noeudsVisites[n.id];
        // 🔴 « PERDU » EST UN FAIT, PAS UNE POSITION. Tant qu'il se déduisait de
        //    « la rangée est dépassée », revenir d'un cran rouvrait les branches
        //    laissées : on pouvait rejouer la rangée entière autant de fois
        //    qu'on voulait. Le moteur les nomme maintenant, on les lit.
        var perdu = !!(partie.noeudsPerdus && partie.noeudsPerdus[n.id]) || (etat === "passee" && !pris);
        var t = typeDuNoeud(n);
        var boss = n.type === "boss" || n.type === "ligue";
        var plus = details(n, t);
        // ═══════════════════════════════════════════════════════════════════
        // 🔴 CINQ MÉCANIQUES QUE PERSONNE NE VOYAIT JAMAIS. Mesuré au clic sur
        //    dix voyages, dont deux allés au Conseil 4 : pas une fois le choix
        //    des fossiles, pas un Casino, pas un Parc Safari, pas un échange,
        //    pas une ranimation. Et la carte les propose pourtant dans CENT
        //    POUR CENT des voyages — mesuré aussi.
        //    La raison tient en une phrase : ils ressemblaient à un nœud
        //    ordinaire. Devant « HERBES » et « SCÈNE », on prend les herbes.
        // 🔴 UN LOT UNIQUE QUI RESSEMBLE À UN LOT ORDINAIRE N'EST PAS UN LOT
        //    UNIQUE. On le DIT donc avant le choix, pas après : c'est la seule
        //    façon de faire d'une branche laissée un vrai regret — et le regret
        //    est ce qui donne envie de recommencer.
        // ═══════════════════════════════════════════════════════════════════
        var unique = UNIQUES[n.type] && !boss;
        //  🔴 Un troc impayable se FERME (12/08, « ça devrait m'empêcher de
        //     sélectionner la case ») : prendre le nœud coûterait l'autre
        //     branche pour un comptoir vide. Sans danger d'impasse : une
        //     rangée porte toujours au moins deux nœuds, et seul l'échange
        //     peut être mort. L'annonce du nœud dit déjà pourquoi.
        //  🔴 …MAIS UN NŒUD D'ÉCHANGE PORTE DEUX RAISONS D'Y ALLER (16/08). La
        //     seconde est l'ALLER-RETOUR, seule porte vers Alakazam, Ectoplasma,
        //     Grolem et Mackogneur. Fermer sur le seul troc du dresseur rendait
        //     ces quatre-là impossibles à qui n'avait pas l'espèce réclamée.
        //     La question « y a-t-il quelque chose à y faire ? » se pose en UN
        //     endroit, `PokeObtenir` — la carte et l'écran lisent la même.
        var trocMort = n.type === "echange" &&
          !O().echangeJouable(partie, n.etape) && !O().retourJouable(partie);
        return '<button type="button" class="pkdx-noeud' +
            (pris ? " est-pris" : "") + (perdu ? " est-perdu" : "") + (boss ? " est-boss" : "") +
            (unique ? " est-unique" : "") + '"' +
            ' data-noeud="' + esc(n.id) + '" data-noeud-type="' + esc(n.type) + '"' +
            (t ? W.PokeType.attr(t) : "") +
            (etat === "courante" && !perdu && !trocMort ? "" : " disabled") + ">" +
          // 🔴 UN VISAGE QUAND IL Y EN A UN. Le médaillon abstrait reste pour
          //    les herbes, l'eau, un objet — des lieux, pas des gens. Mais un
          //    dresseur, un Champion, le rival : ce sont des silhouettes, et
          //    c'est ainsi qu'on les reconnaît d'un coup d'œil.
          (n.type === "dresseur" && visageClasse(n.classe)
            ? '<span class="pkdx-medaillon est-visage">' + visage(visageClasse(n.classe), 40) + "</span>"
            : n.type === "boss" && VISAGE_ARENE()[n.arene - 1]
            ? '<span class="pkdx-medaillon est-visage">' + visage(VISAGE_ARENE()[n.arene - 1], 48) + "</span>"
            : n.type === "rival"
            ? '<span class="pkdx-medaillon est-visage">' + visage(visageRival(n.rencontre), 40) + "</span>"
            : '<span class="pkdx-medaillon">' +
              W.PokeIcones.svg(DESSIN[n.type] || n.type, { taille: boss ? 28 : 22 }) + "</span>") +
          '<span class="pkdx-noeud-corps">' +
            '<span class="pkdx-noeud-titre">' + titreDuNoeud(n) + "</span>" +
            (boss ? '<span class="pkdx-champion">' + esc(nomDuBoss(n)) + "</span>" : "") +
            '<span class="pkdx-noeud-dit">' + annonce(n) + "</span>" +
            //  La raison de la porte fermée, SUR la porte — même grammaire que
            //  les règles verrouillées de l'écran des noms.
            (trocMort ? '<span class="pkdx-touche-note">' + T("aEchangeRien") + "</span>" : "") +
            plus +
          "</span>" +
          (unique && !pris && !perdu
            // 🔴 CE MARQUEUR ET CELUI DE LA CAPSULE DISAIENT « UNE SEULE FOIS »
            //    TOUS LES DEUX, pour deux règles différentes : ici « ce lieu ne
            //    reviendra pas », là-bas « la machine se consomme ». Un joueur
            //    qui apprend l'un se trompe sur l'autre. Chacun dit maintenant SA
            //    loi, et chacun peut la développer.
            ? '<span class="pkdx-noeud-unique" data-info="loi" data-info-val="noeud">' +
                T("uneSeuleFois") + "</span>" : "") +
          // 🔴 UNE TRACE MUETTE NE SE CHOISIT PAS. Elle est posée sur un nœud
          //    ORDINAIRE — herbes, dresseur, objet — donc rien ne la distingue
          //    si l'écran ne la dit pas, et le joueur passerait à côté du seul
          //    arbitrage qui ouvre la chasse.
          (n.trace ? '<span class="pkdx-noeud-trace" data-info="loi"' +
              ' data-info-val="trace">' + T("mewTrace") + "</span>" : "") +
          (pris ? '<span class="pkdx-noeud-pris">' + T("pris") + "</span>" : "") +
          (perdu ? '<span class="pkdx-noeud-perdu">' + T("perdu") + "</span>" : "") +
        "</button>";
      }).join("");

      var lieu = lieuDe(r), bande = "";
      if (lieu && lieu !== lieuPrecedent && !final) {
        var l = LIEUX()[lieu];
        // 🔴 LA DESCRIPTION VA SUR LA BANDE, PAS SUR CHAQUE NŒUD. Je l'avais
        //    posée sur les nœuds : quatre fois « Deux hommes en noir fouillent
        //    la grotte » l'un sous l'autre, dans la même rangée. Répétée, une
        //    phrase n'informe plus — elle encombre. C'est le défaut que je
        //    corrigeais au casino il y a quelques heures, réintroduit par moi.
        //    La bande marque déjà le CHANGEMENT de lieu : elle ne paraît
        //    qu'une fois, et c'est exactement la portée d'un décor.
        var ditLieu = ditDuLieu(etapeDe(r));
        bande = '<li class="pkdx-biome">' + esc(l ? (l[LANG()] || l.fr) : lieu) +
          (ditLieu ? '<span class="pkdx-biome-dit">' + ditLieu + "</span>" : "") + "</li>";
      }
      if (lieu) lieuPrecedent = lieu;
      // 🔴 `:first-child` NE SUFFIT PAS : la bande de lieu est elle aussi un
      //    `<li>`, donc la première rangée n'est presque jamais le premier
      //    enfant. Résultat vu à l'écran : un rail flottait au-dessus de la
      //    rangée de départ, relié à rien. La classe le dit explicitement.
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 « ON A L'IMPRESSION QUE TOUT EST DÉBLOQUÉ » — 11/08/2026, propriétaire.
      //    La rangée jouable portait bien un cadre plus franc et une ombre
      //    (3,23:1 contre sa surface, mesuré) — mais c'est une marque de
      //    STRUCTURE, et une structure ne se décode pas : elle se remarque une
      //    fois qu'on sait déjà. Rien ne DISAIT qu'une rangée est fermée, ni
      //    pourquoi. Or ces nœuds sont `disabled`, et la loi du mode veut qu'un
      //    bouton fermé donne sa raison — loi appliquée partout ailleurs, et
      //    pas sur l'écran le plus vu du jeu.
      // ✅ Un mot posé sur le rail, une fois par rangée. Pas un mot par nœud :
      //    la carte a déjà payé la leçon de la phrase répétée quatre fois de
      //    suite, qui n'informe plus et encombre.
      // ⚠️ La RAISON ne s'écrit qu'une fois, sur la première rangée fermée —
      //    celle qu'on regarde en se demandant pourquoi elle ne réagit pas.
      //    Les suivantes n'ont plus rien à expliquer.
      // ═══════════════════════════════════════════════════════════════════════
      // ⚠️ ET LE MOT DE REPLI DISAIT « PLUS LOIN » SUR LES RANGÉES DÉJÀ
      //    JOUÉES — audit du 14/08. Le calcul ne connaissait que trois cas
      //    (« courante », « la suivante », « tout le reste ») et le passé
      //    tombait dans le troisième : la carte d'un acte entamé affichait
      //    « PLUS LOIN » au-dessus de rangées franchies. Ce n'est pas un mot
      //    de trop, c'est un mot FAUX, sur l'écran le plus vu du jeu.
      //  🔴 ET IL LE DISAIT SEPT FOIS. Le commentaire ci-dessus posait déjà la
      //     loi — « la raison ne s'écrit qu'une fois, les suivantes n'ont plus
      //     rien à expliquer » — et le code la démentait ligne suivante :
      //     toutes les rangées à venir portaient la même pastille. Sept fois
      //     le même mot ne renseigne pas, il fait du décor.
      //  ✅ Le rail ne parle que là où il a quelque chose à dire : ICI, et
      //     JUSTE APRÈS. Le passé se lit à ses nœuds pris et perdus, l'avenir
      //     à sa place dans la pile. Un rail muet est un rail qui ne ment pas.
      var mot = etat === "courante" ? T("carteMotIci")
        : etat === "avenir" && i === partie.rangee + 1 ? T("carteMotBloque")
        : "";
      return bande + '<li class="pkdx-rangee' + (i === 0 ? " est-depart" : "") +
        (final ? " est-fin" : "") + '" data-etat="' + etat +
        '" data-mot="' + esc(mot) + '" style="--n:' + r.length + '">' + noeuds + "</li>";
    }).join("");

    coqueLibre(
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 LA CARTE ÉTAIT UNE FEUILLE BLANCHE. Question du propriétaire, et
      //    elle est juste : « est-ce que c'est ça que les joueurs veulent ? »
      //    Les références actuelles du genre — PokéRogue, Radical Red, Emerald
      //    Rogue — ressemblent à des JEUX : surface sombre, panneaux denses,
      //    couleurs de type qui dominent. Nos écrans se lisaient comme un
      //    article bien maquetté. La loi anti-« vibe-code » nous a protégés des
      //    dégradés bidons ; elle nous avait aussi poussés dans l'austérité.
      //    La carte prend donc sa propre surface — un PLATEAU, la couleur de
      //    fond du mode, celle qui entoure déjà la page.
      // 🔴 AUCUNE RÈGLE EXISTANTE NE BOUGE : ce sont les JETONS qu'on redéfinit
      //    dans la portée du plateau. Les nœuds, les rails, les teintes de type
      //    se recalculent tout seuls contre le nouveau papier. Réécrire trente
      //    règles aurait garanti la divergence.
      // ═══════════════════════════════════════════════════════════════════════
      '<div class="pkdx-plateau">' +
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 LE RAIL — CE QU'ON DOIT VOIR PENDANT QU'ON PARCOURT LE CHEMIN.
      //     Mesuré le 09/08 à 1920 : la carte d'acte défile sur **1 727 px**
      //     pendant que **808 px de largeur — 42 % de l'écran — restent vides**.
      //     Le joueur descend sa liste de nœuds et perd de vue les deux choses
      //     qui décident du choix : l'état de son équipe, et qui l'attend au
      //     bout de l'acte. Il remonte, il redescend.
      //  ⚠️ CE N'EST PAS UN PANNEAU DE PLUS. Le chantier était noté « panneau de
      //     bureau montrant les PV » — or `.pkdx-bande-equipe` les montre déjà.
      //     On ne DUPLIQUE rien : on DÉPLACE ce qui existe dans le vide, et on
      //     le colle. Un second dessin de barre aurait divergé, comme toujours.
      //  🔴 `display: contents` EN DESSOUS DE 1200 : le rail n'existe alors pas
      //     pour la mise en page, et le mobile est inchangé au pixel près. Une
      //     enveloppe qui ne se voit qu'au bureau ne doit rien coûter ailleurs.
      // ═══════════════════════════════════════════════════════════════════════
      '<div class="pkdx-rail">' +
      '<div class="pkdx-acte-tete">' +
        '<p class="pkdx-surtitre">' + T("acte", { n: partie.acte, t: W.PokeActes.nombre() }) + "</p>" +
        '<h1 class="pkdx-titre">' + T("versVille", { v: esc(W.PokeActes.nomActe(acte, LANG())) }) + "</h1>" +
        // 🔴 ON NE SAVAIT JAMAIS OÙ L'ON EN ÉTAIT DANS L'ACTE. La carte disait
        //    « acte 4 sur 9 » et rien sur la distance qui reste jusqu'au
        //    Champion : le joueur choisissait sans savoir s'il lui restait un
        //    pas ou six. Or c'est précisément ce qui décide d'un détour — on ne
        //    prend pas le Casino de la même façon à deux rangées de l'arène.
        '<p class="pkdx-dit">' + T("choisis") + " " +
          T("resteRangees", { n: Math.max(0, partie.carteActe.rangees.length - partie.rangee - 1) }) + "</p>" +
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 « HUIT PAS AVANT LE CHAMPION » SANS DIRE LEQUEL. Le nom et le
        //     type du Champion qui ferme l'acte décident de TOUT l'acte : dans
        //     quelles herbes s'entraîner, quelle CT acheter, qui garder en
        //     réserve. L'information était sur le nœud d'arène — c'est-à-dire
        //     au BOUT de la carte, quand toutes les branches sont déjà prises.
        //  ⚠️ Elle se tait une fois le badge gagné, et à la Ligue : annoncer un
        //     Champion déjà battu, ou un Champion qui n'existe pas, ce serait
        //     remplacer un manque par une erreur.
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 LA CHASSE SE DIT À PART, ET LA v494 L'AVAIT ENFERMÉE DANS LE BLOC
        //     DU CHAMPION. Conséquence : l'acte 9 — celui de SULFURA, le
        //     dernier essai du voyage — restait muet, parce qu'il n'a pas de
        //     Champion mais la Ligue, et que la fonction rendait "" avant.
        //     Trouvé en ouvrant la porte `mesurerActe`, écrite justement pour
        //     regarder ces en-têtes : le défaut a vécu une version.
        //  ⚠️ Elle ne dépend donc de RIEN d'autre que de la présence d'une
        //     chasse dans l'acte — ni du Champion, ni du badge, ni de la Ligue.
        // ═══════════════════════════════════════════════════════════════════
        (function () {
          var chasses = (acte.legendaires || []);
          if (!chasses.length || !chasses[0] || !chasses[0].legendaire) return "";
          var esp = ESP()[chasses[0].legendaire];
          if (!esp) return "";
          //  Le visage de la proie (mandat onboarding 12/08) : l'oiseau qu'on
          //  annonce se MONTRE — une menace nommée sans visage reste du texte.
          return '<p class="pkdx-acte-chasse">' +
            '<img alt="" loading="lazy" src="' + W.PokeSprites.face(chasses[0].legendaire, "?i=6") + '">' +
            esc(T("acteChasse", { nom: esp.nom[LANG()] })) + " " +
            W.PokeType.pastille(esp.types[0]) + "</p>";
        })() +
        (function () {
          if (!acte.boss) return "";
          var a = areneDe(acte.boss);
          if (!a) return "";
          for (var i = 0; i < (partie.badges || []).length; i++) {
            if (partie.badges[i].ordre === a.ordre) return "";
          }
          // ⚠️ `a.type` est le LIBELLÉ français (« Roche »), pas l'identifiant :
          //    `PokeType.id()` fait la traduction, comme pour le nœud de boss.
          //    Lui passer le libellé rendrait une pastille grise sans nom.
          //  Le visage du Champion en tête de carte (mandat onboarding 12/08) :
          //  l'objectif de l'acte a des yeux. Même pont que l'écran d'arène —
          //  `VISAGE_ARENE[ordre - 1]`, l'ordre du ROM, jamais le nom traduit.
          var dit = '<p class="pkdx-acte-champion">' +
            visage(VISAGE_ARENE()[a.ordre - 1], 44) +
            esc(T("acteChampion", { nom: W.PokeGenre.nomChampion(a) })) + " " +
            W.PokeType.pastille(W.PokeType.id(a.type)) + "</p>";
          // ═══════════════════════════════════════════════════════════════════
          //  🔴 L'ACTE NE DISAIT PAS OÙ ÉTAIT SA VRAIE DIFFICULTÉ. Mesuré le
          //     11/08 : l'arène 7 se gagne à **97 % même sans réfléchir** — la
          //     seule du jeu qui ne distingue pas un joueur d'un cliqueur —
          //     pendant qu'Artikodin, au même acte, n'est pris que 16 % du
          //     temps et met l'équipe à terre 71 fois sur 122. Le test de
          //     l'acte 7 n'est pas son Champion, c'est son oiseau. Et le joueur
          //     traversait Auguste sans effort en croyant l'acte facile.
          //  ✅ L'en-tête annonce la chasse à côté du Champion : c'est là qu'on
          //     décide de garder ses Balls, de passer au comptoir, de ne pas
          //     dépenser sa Hyper Ball sur un Roucool.
          //  ⚠️ On ne dit pas « c'est plus dur » — on NOMME l'espèce et son
          //     essai unique. Le joueur juge ; le mode ne classe pas.
          // ═══════════════════════════════════════════════════════════════════

          // ═══════════════════════════════════════════════════════════════════
          //  🔴 « TU ES EN DESSOUS » SE DIT PENDANT QU'ON PEUT ENCORE MONTER.
          //     La fiche d'arène annonce « aucun ne tient le niveau de Pierre »
          //     — au bout de la carte, quand toutes les branches sont prises.
          //     Même défaut que le nom du Champion, corrigé ici pour la même
          //     raison : ce qui décide du CHEMIN se dit en tête de carte.
          //  ⚠️ MÊME PORTE QUE LA FICHE : `PokeMesure.aLaHauteur`, mêmes clés.
          //     Deux écrans qui annoncent la même chose doivent l'annoncer de
          //     la même façon — et un second calcul aurait divergé.
          //  ⚠️ SEULEMENT QUAND PERSONNE NE TIENT. À « 2 de tes 6 », l'équipe a
          //     de quoi se battre : le détail reste sur la fiche. Le rail ne
          //     parle que du cas qui doit changer le chemin.
          // ═══════════════════════════════════════════════════════════════════
          var h = W.PokeMesure && W.PokeMesure.aLaHauteur
            ? W.PokeMesure.aLaHauteur(partie.equipe, equipeDuChampion(a)) : null;
          // ═══════════════════════════════════════════════════════════════
          //  🔴 LE RAIL SE TAISAIT EXACTEMENT DANS LA BANDE OÙ L'ON PERD.
          //     Il ne parlait qu'à ZÉRO — « aucun ne tient le niveau ». Or le
          //     harnais compare désormais les voyages GAGNÉS aux voyages
          //     PERDUS, facteur par facteur, et le partage est net :
          //
          //       arène 4 : 3,1 à la hauteur en victoire · **1,0** en défaite
          //       arène 5 : 2,4 · **0,9**   ·   arène 7 : 4,7 · **2,0**
          //       arène 6 : 4,7 · **2,6**   (sur des équipes de ~6)
          //
          //     On perd avec UN ou DEUX membres au niveau, pas avec zéro — et
          //     à un ou deux, le rail ne disait rien. La ligne existait, elle
          //     était juste, et elle s'éteignait juste avant de servir.
          //
          //  ✅ LE SEUIL EST DÉRIVÉ DE CETTE MESURE, PAS CHOISI : moins de la
          //     MOITIÉ de l'équipe au niveau. Les défaites sont à 15-44 % de
          //     l'équipe, les victoires à 41-80 %. Aucun nombre inventé.
          //  ⚠️ On garde le silence quand la moitié tient : une alerte qui
          //     s'affiche toujours devient un décor qu'on ne lit plus — c'est
          //     écrit dans le texte lui-même, et ça reste vrai.
          // ═══════════════════════════════════════════════════════════════
          if (h && h.n * 2 < h.sur) {
            dit += '<p class="pkdx-acte-hauteur">' +
              esc(T(h.sur === 1 ? "hauteurSeul" : h.n === 0 ? "hauteurAucun" : "hauteurPart",
                    { n: h.n, t: h.sur, a: h.haut, qui: esc(W.PokeGenre.nomChampion(a)) })) + " " +
              esc(T("hauteurChemin")) + "</p>";
          }
          // ═══════════════════════════════════════════════════════════════
          //  ET LE SECOND FACTEUR, PAR LA MÊME PORTE QUE LES AUTRES ÉCRANS.
          //  `PokeMesure.contre` sert déjà au menu de relais, au PC de Léo et
          //  à la capsule : « frappe fort » y veut dire exactement ce que le
          //  harnais compte comme une réponse de type. Un second calcul
          //  finirait par annoncer autre chose que ce qu'on a mesuré.
          //  ⚠️ Silencieux dès qu'UN membre répond — voir la phrase.
          // ═══════════════════════════════════════════════════════════════
          if (W.PokeMesure && W.PokeMesure.contre) {
            var v = W.PokeMesure.contre(partie.equipe, equipeDuChampion(a), hasard.derive("mesure"));
            var repond = 0;
            for (var iv = 0; iv < v.length; iv++) if (v[iv].frappe === "fort") repond++;
            if (v.length && !repond) {
              // ═══════════════════════════════════════════════════════════
              // 🔴 LE CONSEIL NOMME LE TYPE, ET C'EST TOUT CE QUI LE REND
              //    UTILE. « Une capture peut y répondre » a été refusé par le
              //    propriétaire : ça n'indique ni quoi attraper, ni où. On
              //    cherche donc le type qui frappe le plus fort l'équipe du
              //    Champion, et on le NOMME. Le calcul vit ici parce que la
              //    réponse dépend de CETTE équipe-là.
              // ⚠️ On ne propose que ce qui frappe VRAIMENT fort (×2 ou plus)
              //    sur au moins la moitié de son équipe : un type efficace
              //    contre un seul de ses six ne répond à rien.
              // ═══════════════════════════════════════════════════════════
              var meilleur = null, meilleurScore = 0;
              var _types = W.PokeRegles ? W.PokeRegles.types() : W.POKE_TYPES;
              for (var it = 0; it < _types.length; it++) {
                var t = _types[it], score = 0;
                for (var ie = 0; ie < a.equipe.length; ie++) {
                  var esp = ESP()[a.equipe[ie].n];
                  if (esp && W.PokeCombat.efficacite(t, esp.types) > 1) score++;
                }
                if (score > meilleurScore) { meilleurScore = score; meilleur = t; }
              }
              dit += '<p class="pkdx-acte-hauteur">' +
                esc(T("couvertureAucune", { qui: esc(W.PokeGenre.nomChampion(a)) })) +
                (meilleur && meilleurScore * 2 >= a.equipe.length
                  ? " " + esc(T("couvertureChemin", { type: W.POKE_TYPE_NOMS[meilleur][LANG()] }))
                  : "") + "</p>";
            }
          }
          return dit;
        })() +
      "</div>" +
      // Ce que le voyage a déjà appris, et qui ne se perd plus.
      (function () {
        if (!W.PokeAcquis || !partie.acquis || !partie.acquis.length) return "";
        return '<p class="pkdx-acquis-fil"><b>' + esc(T("acteAcquis")) + "</b> " +
          partie.acquis.map(function (id) {
            var q = W.PokeAcquis.de(id);
            return q ? '<span data-info="acquis" data-info-val="' + esc(id) + '">' +
              esc(q.nom[LANG()]) + "</span>" : "";
          }).filter(Boolean).join(" · ") + "</p>";
      })() +
      ditEquipe() +
      "</div>" +
      '<ol class="pkdx-carte-actes">' + rangees + "</ol>" +
      "</div>" +
      // 🔴 Le compte du COMPTE reste visible : sans lui, un joueur croirait
      //    repartir de zéro à chaque carrière, et c'est faux — le Pokédex se
      //    garde entre les parties. L'en-tête, lui, porte celui du VOYAGE.
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 ET IL DIT ENFIN QU'IL EST CELUI DU COMPTE. Deux compteurs portaient
      //    le mot « Pokédex » à quatre cents pixels l'un de l'autre, sur le
      //    même écran, avec des nombres différents : le bandeau « 1/98 » (ce
      //    voyage, sur ce que cette version peut donner) et ce bouton « 0/151 »
      //    (le compte, sur les 151). Les deux sont vrais et se lisent comme un
      //    bug — au premier voyage, on démarre avec un Pokémon et l'écran
      //    affiche 1 d'un côté, 0 de l'autre.
      // ⚠️ LA CLÉ `compte` ÉTAIT DÉJÀ ÉCRITE POUR ÇA, avec son commentaire —
      //    « sans lui, un joueur croirait repartir de zéro à chaque carrière »
      //    — et elle n'était appelée NULLE PART. Le correctif avait été pensé,
      //    rédigé, puis laissé débranché.
      // ═══════════════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 [20/08, polish] LE PIED COLLANT PRENAIT UN TIERS DU TÉLÉPHONE —
      //     240 px sur 736, six commandes en quatre rangées, la deuxième
      //     étape jouable recouverte. Le rythme (un réglage) et l'arrêt (une
      //     sortie) ne sont pas des lieux qu'on rouvre dix fois par voyage :
      //     ils montent dans une rangée ordinaire qui défile avec la carte.
      //     Le pied ne garde que les quatre portes du voyage, en une rangée
      //     (feuille, `.est-carte`).
      // ═══════════════════════════════════════════════════════════════════
      '<div class="pkdx-actions est-reglages">' +
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 LA VITESSE DES COMBATS N'EXISTAIT QUE SUR L'ACCUEIL. Un joueur
        //     qui trouve les combats lents après vingt minutes ne pouvait plus
        //     rien y faire : il fallait finir ou abandonner le voyage pour
        //     revenir au seul écran qui porte le réglage. Un voyage complet
        //     compte ~70 combats ; à 900 ms la ligne, c'est le genre de détail
        //     qui fait fermer l'onglet.
        //  ⚠️ Le commentaire d'origine avait RAISON sur un point — « pendant un
        //     combat on ne règle pas, on joue » — et tort dans sa conclusion :
        //     la CARTE n'est pas un combat, c'est l'écran de respiration entre
        //     deux nœuds. C'est exactement là qu'on ajuste.
        //  ⚠️ Le bouton seul, sans son libellé : le pied de carte n'a pas la
        //     place d'une ligne nommée, et l'`aria-label` du bouton porte déjà
        //     « Vitesse des combats : Rapide ».
        // ═══════════════════════════════════════════════════════════════════
        boutonRythme() +
        // 🔴 ON NE POUVAIT PAS ARRÊTER UN VOYAGE. La seule sortie était de
        //    perdre TROIS fois contre un Champion — un joueur qui voit sa
        //    partie perdue n'avait qu'à fermer l'onglet, et sa collection ne
        //    se clôturait jamais. Tous les roguelites offrent cette porte, et
        //    elle sert exactement au moment où l'on ferait autrement le pire :
        //    partir sans rien enregistrer.
        '<button type="button" class="pkdx-touche est-discrete" id="pk-abandon">' +
          T("koAbandonner") + "</button>" +
      "</div>" +
      '<div class="pkdx-actions est-pied est-carte">' +
        '<button type="button" class="pkdx-touche" id="pk-dex">' +
          W.PokeIcones.svg("pokedex") + T("pokedex").toUpperCase() +
          // 🔴 « POKÉDEX 1/151 » EN PLEIN JOHTO. Le compte venait de la
          //    progression, le TOTAL était écrit à la main. `comptePokedex()`
          //    rend déjà `total`, lu au registre — il n'y avait qu'à le prendre.
          //    Un nombre du monde de 1996 recopié dans un écran ne se voit
          //    qu'en jouant l'autre monde. Voir `poke-nombres-ecrits.mjs`.
          // [20/08, polish] Le compte porte sa propre classe : au téléphone, dans
          // la rangée de quatre, il passe SOUS le mot au lieu de l'étirer.
          ' <span class="pkdx-touche-compte">' + (function () {
            var c = W.PokeProgression.comptePokedex();
            return c.pris + "/" + c.total;
          })() + "</span>" +
          '<span class="pkdx-portee">' + T("compte") + "</span></button>" +
        // 🔴 UNE APTITUDE LIVRÉE DOIT AVOIR SA PORTE D'ENTRÉE LE JOUR MÊME.
        //    C'est la leçon écrite du projet, et c'est exactement ce qui
        //    manquait aux vitamines : la mécanique existait, l'écran aussi
        //    aurait pu exister — sans ce bouton, personne ne l'aurait trouvé.
        //    Le compte d'objets employables est affiché : un sac qu'on ouvre
        //    pour le trouver vide est un clic perdu.
        (objetsEmployables() ? '<button type="button" class="pkdx-touche" id="pk-sac">' +
          W.PokeIcones.svg("objet") + T("aSac") + ' <span class="pkdx-touche-compte">' + objetsEmployables() + "</span></button>" : "") +
        // ═══════════════════════════════════════════════════════════════════
        // 🔴 LA BOÎTE SE REMPLISSAIT ET RIEN NE L'OUVRAIT. Passé six Pokémon,
        //    toute capture partait dans `partie.boite` — comptée au Pokédex,
        //    et perdue pour le voyage : aucun écran ne permettait de la
        //    reprendre. Attraper devenait une punition silencieuse, dans un
        //    mode dont c'est le cœur.
        // 🔴 ET IL S'OUVRE MAINTENANT TOUJOURS, PARCE QU'IL NE SERT PLUS SEULEMENT
        //    À LA RÉSERVE. On y choisit aussi QUI ENTRE EN PREMIER — et cette
        //    décision-là existe dès le premier Pokémon. Le garder fermé sur une
        //    réserve vide revenait à cacher la seule action tactique qu'on peut
        //    poser hors combat. Le compte affiché reste celui de la réserve
        //    quand elle existe : c'est ce qui appelle le clic.
        // ═══════════════════════════════════════════════════════════════════
        '<button type="button" class="pkdx-touche" id="pk-boite">' +
          W.PokeIcones.svg("pokedex") + T("aBoite") +
          (partie.boite.length ? ' <span class="pkdx-touche-compte">' + partie.boite.length + "</span>" : "") + "</button>" +
        // ═══════════════════════════════════════════════════════════════════
        // 🔴 LE JUGE VIT ICI, PAS DANS LA RÉSERVE. Ma première version le
        //    posait dans l'écran de réserve — qui ne s'ouvre lui-même que
        //    lorsqu'on a un SEPTIÈME Pokémon. Un joueur avec une équipe de
        //    quatre n'aurait donc jamais pu lire ce que son équipe a gagné :
        //    la mécanique existait sans porte d'entrée, la faute n°1 de ce
        //    projet, et je venais de la refaire.
        //    L'équipe, elle, existe toujours. Le bouton aussi.
        // ═══════════════════════════════════════════════════════════════════
        '<button type="button" class="pkdx-touche" id="pk-juge">' +
          W.PokeIcones.svg("dresseur") + T("jugeTitre") + "</button>" +
      "</div>"
    );
    // ── LA RANGÉE JOUABLE VIENT AU JOUEUR ────────────────────────────────────
    // 🔴 LA CARTE FAIT MILLE SEPT CENTS PIXELS DANS UNE VUE DE HUIT CENTS.
    //    C'est voulu — on voit ce qu'on a laissé derrière et ce qui vient — mais
    //    la rangée où l'on DÉCIDE peut se trouver n'importe où dedans, et à
    //    partir de la troisième elle sort de l'écran. Le joueur arrive sur la
    //    carte et doit CHERCHER son choix : le seul geste du mode qui compte
    //    commençait par une fouille.
    //    On l'amène à lui, en douceur, sans supprimer le reste — le passé et la
    //    suite restent à un coup de molette.
    // 🔴 INSTANTANÉ, PAS EN DOUCEUR. Un défilement animé se fait étrangler dès
    //    que l'onglet n'a pas le focus — mesuré ici : la rangée restait à 898
    //    px dans une vue de 820 alors que l'appel manuel marchait. Et sur le
    //    fond, une carte qui glisse toute seule à l'arrivée est un mouvement
    //    qu'on subit : le joueur veut voir son choix, pas le regarder venir.
    var courante = racine.querySelector('.pkdx-rangee[data-etat="courante"]');
    if (courante && courante.scrollIntoView) {
      try { courante.scrollIntoView({ block: "center" }); }
      catch (e) { courante.scrollIntoView(); }
    }

    surClic("[data-noeud]", function (e) {
      var bouton = e.currentTarget;
      var id = bouton.getAttribute("data-noeud");
      //  Le doigt arme d'abord ; un second appui sur le MÊME nœud vaut le
      //  bouton, pour qui a compris et ne veut pas viser deux fois.
      if (dernierPointeur === "touch" && noeudArme !== id) return armerNoeud(bouton, id);
      choisirNoeud(id);
    });
    racine.querySelector("#pk-dex").addEventListener("click", function () {
      W.PokePokedex.ouvrir(hote("pk-dex-hote"), partie, carte);
    });
    var bSac = racine.querySelector("#pk-sac");
    if (bSac) bSac.addEventListener("click", function () { son("PRESS_AB"); ecranSac(carte); });
    var bBoite = racine.querySelector("#pk-boite");
    if (bBoite) bBoite.addEventListener("click", function () { son("PRESS_AB"); ecranBoite(carte); });
    var bJuge = racine.querySelector("#pk-juge");
    if (bJuge) bJuge.addEventListener("click", function () { son("PRESS_AB"); ecranJuge(carte); });
    racine.querySelector("#pk-abandon").addEventListener("click", function () {
      // 🔴 UNE FIN DE VOYAGE NE SE DÉCLENCHE PAS D'UN CLIC DISTRAIT. On demande
      //    confirmation, et on dit ce qui est gardé — sinon le bouton fait
      //    peur et personne ne l'emploie, ce qui revient à ne pas l'avoir.
      //    ⚠️ La demande vivait ICI, écrite en toutes lettres, et l'écran de
      //       K.O. portait le même libellé sans elle. Elle a donc déménagé dans
      //       `demanderAbandon`, porte unique — voir ce qu'elle a coûté à
      //       Zerfall le 20/08.
      demanderAbandon(carte);
    });
  }

  // ── Résoudre le nœud choisi ────────────────────────────────────────────────
  //  La remise des clés d'une scène — extraite de `choisirNoeud` (12/08) pour
  //  pouvoir se jouer APRÈS le combat Rocket. Les répliques du scénario
  //  (écrites depuis toujours, jouées depuis aujourd'hui) ouvrent le mot.
  var SCENE_ROCKET_MOT = {
    "mont-selenite": "selenite", "repaire-rocket": "celadopole",
    "tour-pokemon": "tour", "tour-silph": "silph",
  };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES TROIS BÊTES — L'ÉTAT, ET QUI LE POSE
  //
  //  🔴 KANTO N'EN A PAS, et sa porte rend `null` : tout ce qui suit se tait
  //     de lui-même. Aucun tirage n'est consommé, aucun champ n'est écrit, et
  //     le rejeu de toutes les graines de 1996 reste identique.
  //  ⚠️ L'ÉTAT VIT SUR LA PARTIE, donc il se sauvegarde et il se rejoue. Un
  //     errant rattrapé ne revient pas ; un errant qui s'échappe COURT
  //     TOUJOURS — c'est la différence avec la chasse unique de Kanto, et
  //     c'est ce qui rend la poursuite jouable au lieu de punitive.
  // ═══════════════════════════════════════════════════════════════════════════
  function reglesErrants() {
    return (W.PokeRegles && W.PokeRegles.errants && W.PokeRegles.errants()) || null;
  }

  function errantsEtat() {
    var r = reglesErrants();
    if (!r || !partie || !partie.errants) return null;
    return partie.errants;
  }

  function libererErrants() {
    var r = reglesErrants();
    if (!r || !partie || partie.errants) return false;
    partie.errants = {};
    for (var i = 0; i < r.liste.length; i++) partie.errants[r.liste[i].n] = "libre";
    return true;
  }

  //  Celui qui se montre, s'il s'en montre un. Le tirage n'a lieu QUE sous un
  //  jeu de règles qui a des errants : la première génération n'en consomme
  //  aucun.
  function errantQuiParait() {
    var r = reglesErrants(), etat = errantsEtat();
    if (!r || !etat) return null;
    var libres = [];
    for (var i = 0; i < r.liste.length; i++) {
      if (etat[r.liste[i].n] === "libre") libres.push(r.liste[i]);
    }
    if (!libres.length) return null;
    if (hasard.brut() >= r.chance) return null;
    return libres[hasard.entier(libres.length)];
  }

  function livrerScene(n) {
    // 🔴 LA TOUR CALCINÉE LIBÈRE LES TROIS BÊTES, et elle le DIT. Sans cette
    //    phrase, le monde changerait en silence — et le joueur mettrait la
    //    première apparition sur le compte du hasard.
    if (n.libereErrants && libererErrants()) {
      return message(T("nScene"), T("errantLibere"), function () { return carte(); });
    }
    var recu = [];
    for (var k = 0; k < (n.donne || []).length; k++) {
      if (!partie.cles[n.donne[k]]) {
        partie.cles[n.donne[k]] = true;
        // 🔴 UNE SEULE MASTER BALL, posée ici et nulle part ailleurs.
        if (n.donne[k] === "master") partie.sac.MASTER_BALL = 1;
        recu.push(CLES_V()[n.donne[k]].nom[LANG()]);
      }
    }
    // 🔴 ET LA MASTER BALL S'ANNONCE POUR CE QU'ELLE EST. Sa phrase dormait
    //    dans le scénario : « Une seule Master Ball existe. Choisis bien ta
    //    cible. » Sans elle, le joueur reçoit une Ball de plus dans une liste
    //    et dépense la seule capture garantie du voyage sur un Rattata.
    var motMB = partie.sac.MASTER_BALL && (n.donne || []).indexOf("master") >= 0
      ? " " + W.PokeGenre.pour(W.POKE_SCENARIO.POKEDEX, "masterBall", null, "scenario:pokedex")
      : "";
    //  Après le combat Rocket de la tour Silph, la Team se disperse — la
    //  réplique existait, elle se joue enfin.
    var motRocket = n.rocket && n.rocketFait && n.etape === "tour-silph" && W.POKE_SCENARIO.ROCKET
      ? " " + esc(W.PokeGenre.pour(W.POKE_SCENARIO.ROCKET, "fuite", null, "scenario:rocket"))
      : "";
    // 🔴 UNE CLÉ REÇUE DIT CE QU'ELLE OUVRE. Sans cette ligne, l'écran
    //    répétait le nom que la carte venait d'annoncer et rien d'autre —
    //    et un objet-clé n'a QUE cette fonction dans ce mode.
    return message(T("nScene"),
      (recu.length ? T("aDonne", { quoi: esc(recu.join(", ")) }) : annonce(n)) + motMB + motRocket +
      (recu.length ? ditOuvre(n.donne || []) : ""));
  }

  //  L'équipe Rocket la plus proche du visé — un CHOIX, pas un tirage : le
  //  rejeu du serveur retombe sur la même sans consommer un seul nombre.
  //  🔴 ET ELLE SE HISSE AU VISÉ QUAND LE VIVIER PLAFONNE (13/08). Mesuré :
  //     +9 d'écart médian au repaire, +18 à la tour Silph — les sbires du ROM
  //     s'arrêtent bien sous la tête du joueur au climax de leur histoire.
  //     Même patron que les dresseurs de route : décalage en bloc, écarts
  //     internes gardés, jamais vers le bas, EN COPIE (la table est partagée).
  function equipeRocket(vise) {
    var toutes = (W.POKE_EQUIPES || {}).Rocket || [];
    var choix = null, ecart = Infinity;
    for (var i = 0; i < toutes.length; i++) {
      var eq = toutes[i];
      if (!eq || !eq.length) continue;
      var haut = 0;
      for (var j = 0; j < eq.length; j++) if (eq[j].niveau > haut) haut = eq[j].niveau;
      var d = Math.abs(haut - vise);
      if (d < ecart) { ecart = d; choix = eq; }
    }
    if (!choix) return [];
    var as = 0;
    for (var k = 0; k < choix.length; k++) if (choix[k].niveau > as) as = choix[k].niveau;
    if (as >= vise) return choix;
    var decale = vise - as;
    return choix.map(function (x) {
      var niv = Math.min(100, x.niveau + decale);
      // Un hissé évolue avec son niveau (rapport testeur 13/08).
      return { n: W.PokeMoteur.especeAuNiveau(x.n, niv), niveau: niv };
    });
  }

  function choisirNoeud(id) {
    var r = P().prendreNoeud(partie, id);
    if (!r.ok) return carte();
    journal.push({ a: partie.acte, n: id });
    var n = r.noeud;
    var etape = W.pokeEtapeDe(n.etape) || { id: n.etape, lieu: n.lieu, tables: n.zone ? [n.zone] : [] };

    if (n.type === "boss") return ecranArene(n.arene);
    if (n.type === "ligue") return ecranArene(null);
    if (n.type === "centre") return ecranCentre();
    if (n.type === "objet") {
      partie.sac[n.lot.objet] = (partie.sac[n.lot.objet] || 0) + n.lot.n;
      // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
      //  \ud83d\udd34 CET \u00c9CRAN NE FAISAIT QUE R\u00c9P\u00c9TER LA CARTE. Le n\u0153ud annonce d\u00e9j\u00e0
      //     \u00ab TROUVAILLE \u00b7 Super Ball \u00d73 \u00bb ; l'\u00e9cran affichait exactement les
      //     m\u00eames mots, puis un bouton. Un \u00e9cran qui redit ce qu'on vient de
      //     lire est un clic qui co\u00fbte et ne donne rien.
      //  \ud83d\udd34 CE QU'IL LUI MANQUAIT EST D\u00c9J\u00c0 \u00c9CRIT AILLEURS : `PokeDits.objet`
      //     est la porte unique des descriptions \u2014 celle que lisent les cartes
      //     de butin, l'\u00e9tal et le sac. \u00ab Super Ball \u00bb ne dit rien \u00e0 qui
      //     d\u00e9couvre le jeu ; sa phrase, si.
      //  \u26a0\ufe0f Aucune r\u00e9daction neuve : on ne recopie pas, on branche.
      var ditTrouve = W.PokeDits ? W.PokeDits.objet(n.lot.objet, T, nomStat) : "";
      return message(T("nObjet"),
        esc(nomObjet(n.lot.objet)) + " \u00d7" + n.lot.n +
        (ditTrouve ? '<span class="pkdx-trouve-dit">' + esc(ditTrouve) + "</span>" : ""));
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE RAYON RARE N'A JAMAIS ÉTÉ AFFICHÉ. `ecranBoutique` lit
    //     `etape.rare` — et on lui passait l'ÉTAPE de la carte
    //     (`pokeEtapeDe`), qui porte `{id, lieu, tables}` et rien d'autre.
    //     C'est le NŒUD qui porte `rare`, tiré à sa création (`noeudBoutique`).
    //     `etape.rare` valait donc toujours `undefined`, la section entière
    //     était sautée en silence, et la vitamine comme la pierre d'évolution
    //     n'existaient nulle part.
    //  🔴 ET LA CARTE, ELLE, LE PROMETTAIT. Depuis le v290 le nœud annonce
    //     « Au rayon rare : Protéine, Pierre Foudre » — j'ai rendu plus fort un
    //     appel que la boutique ne tenait pas. Le mode punit d'ordinaire le
    //     contenu qui existe sans se montrer ; celui-ci s'annonçait sans
    //     exister, ce qui est pire : on garde son argent pour un étal vide.
    //  ⚠️ On FUSIONNE plutôt que de passer deux arguments : `ecranBoutique` lit
    //     aussi le lieu de l'étape pour son titre, et deux paramètres qu'il
    //     faut penser à passer ensemble finissent par se désynchroniser —
    //     c'est exactement ce qui vient d'arriver.
    // ═══════════════════════════════════════════════════════════════════════
    if (n.type === "boutique") {
      return ecranBoutique(Object.assign({}, etape, { rare: n.rare || [] }));
    }
    if (n.type === "fossile") return ecranFossile();
    if (n.type === "ranimation") return ecranRanimation();
    if (n.type === "casino") return ecranCasino();
    if (n.type === "safari") return ecranSafari(n);
    if (n.type === "concours") return ecranConcours(n);
    if (n.type === "rival") return ecranRival(n);
    if (n.type === "echange") return ecranEchange(n);
    if (n.type === "cadeau") return ecranCadeau(n);
    if (n.type === "oeuf") return ecranOeuf(n);
    if (n.type === "dojo") return ecranDojo(n);
    if (n.type === "musee") return ecranMusee(n);
    if (n.type === "pension") return ecranPension(n);
    if (n.type === "journal") return ecranJournal(n);
    if (n.type === "scene") {
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 « LA HALTE ME PARLAIT DE LA TEAM ROCKET, J'AI LITTÉRALEMENT RIEN
      //     EU ! » (rapport de testeur, 12/08). L'étape déclare `rocket`, la
      //     carte l'ANNONCE (aRocket), et la scène donnait ses clés en
      //     silence — le jeu annonce et ne livre pas, la classe n°1 dans son
      //     pire sens. Les 41 équipes Rocket du ROM et les cinq répliques du
      //     scénario dormaient dans les données.
      //  ✅ LE COMBAT D'ABORD, LES CLÉS ENSUITE. L'équipe Rocket la plus
      //     proche du visé de la rangée (choix DÉTERMINISTE : pas un tirage,
      //     le rejeu ne bouge pas). Gagné ou perdu, l'histoire continue —
      //     les clés sont de la PROGRESSION, on ne bloque pas un acte sur un
      //     combat perdu ; la défaite se paie en équipe couchée, comme
      //     partout.
      // ═══════════════════════════════════════════════════════════════════
      if (n.rocket && !n.rocketFait) {
        n.rocketFait = true;
        var eqRk = equipeRocket(n.vise || 12);
        if (eqRk.length) {
          var eqR2 = eqRk.map(function (x) { return M().creer(x.n, x.niveau, hasard); });
          for (var jr = 0; jr < eqR2.length; jr++) P().voir(partie, eqR2[jr].n);
          var sacR = soinsDeDresseur(partie.acte);
          return lancerCombat(eqR2, { dresseur: true, gain: 300 * (n.rocket || 1),
            soins: sacR.n, soin: sacR.objet,
            classe: "Rocket", apres: function () { return livrerScene(n); } });
        }
      }
      return livrerScene(n);
    }
    if (n.type === "legendaire") {
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 UN LÉGENDAIRE DE NIVEAU 50 SE FAIT TUER AVANT D'ÊTRE PRIS.
      //     Mesuré le 09/08 sur 120 voyages, la chasse jouée jusqu'au bout :
      //     **36 des 61 chasses finissent en « victoire »** — c'est-à-dire que
      //     le joueur ABAT ce qu'il voulait attraper. 23 défaites, 2 prises.
      //     Artikodin 6,7 %, Électhor et Sulfura 0 %.
      //
      //     La cause n'est ni les Balls ni l'argent : c'est l'ÉCART DE NIVEAU.
      //     Les oiseaux se croisent aux actes tardifs, où l'équipe tourne à 65
      //     ou 70 ; à 50, ils tombent au premier coup, et la fenêtre de lancer
      //     — cible dans le rouge, encore debout — n'existe jamais.
      //     Un contenu qu'on ne peut pas rater autrement qu'en le tuant n'est
      //     pas rare, il est inatteignable.
      //
      //  ✅ LE LÉGENDAIRE SUIT L'ACTE, comme les Champions suivent le sceau.
      //     Plancher au niveau canon — 50 pour les oiseaux, 70 pour Mewtwo,
      //     jamais moins — et il monte avec la tête d'équipe pour rester un
      //     combat. C'est le même dessin que `bossNiveau` : le canon donne le
      //     point de départ, l'acte donne l'échelle.
      //  ⚠️ La ZONE et le NIVEAU DE CAPTURE inscrits au Pokédex restent ceux du
      //     canon : c'est ce que la fiche raconte, et ça ne se déplace pas.
      // ═══════════════════════════════════════════════════════════════════
      var canonNiv = n.espece === 150 ? 70 : 50;
      var tete = 0;
      for (var iL = 0; iL < partie.equipe.length; iL++) {
        if (partie.equipe[iL].niveau > tete) tete = partie.equipe[iL].niveau;
      }
      var legNiv = Math.max(canonNiv, Math.min(tete + 3, 80));
      var leg = M().creer(n.espece, legNiv, hasard, { capture: { zone: n.etape, niveau: canonNiv } });
      P().voir(partie, leg.n);
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 L'ESSAI SE CONSOMME ICI, PAS À LA FIN DU COMBAT. Un QA a rechargé
      //     la page en pleine chasse : au retour, le nœud était marqué pris,
      //     la rangée dépassée, et `partie.legendaires` VIDE. Artikodin n'avait
      //     été ni capturé, ni abattu, ni enfui — il avait simplement disparu,
      //     et le carnet de chasse ne l'a jamais su.
      //     Le coût était asymétrique : la sauvegarde protégeait l'équipe, et
      //     pas l'essai — sur le seul contenu du mode qui n'en accorde qu'un.
      //  ✅ On inscrit l'essai AVANT de lancer le combat. Les trois issues
      //     l'écrasent ensuite ; s'il n'y a pas d'issue, il reste « manque »,
      //     ce qui est la seule chose vraie qu'on puisse en dire.
      //  ⚠️ On n'essaie PAS de reprendre un combat interrompu. Rejouer une
      //     chasse depuis une sauvegarde rendrait l'essai unique rejouable —
      //     on réparerait la promesse en la cassant.
      // ═══════════════════════════════════════════════════════════════════
      partie.legendaires[n.espece] = "manque";
      return lancerCombat([leg], { dresseur: false, zone: n.etape, legendaire: n.espece });
    }
    // 🔴 LE RONFLEX SUIT LE MÊME CHEMIN QU'UN LÉGENDAIRE — un seul essai — mais
    //    au niveau du jeu d'origine, 30, et non 50 : c'est un barrage de
    //    milieu de partie, pas une fin de voyage.
    if (n.type === "ronflex") {
      // 🔴 LE NIVEAU VIENT DU NŒUD, PLUS D'UN 30 ÉCRIT ICI. Kanto ne posait
      //    qu'une rencontre — le Ronflex, niveau 30 — et le chiffre pouvait
      //    donc vivre dans l'écran. Johto en pose sept, de 20 à 30 : Simularbre
      //    à 20, les Voltorbe du repaire à 23, le Léviator rouge à 30. Servis
      //    au 30 de 1996, quatre d'entre eux auraient été hors de leur canon
      //    sans qu'aucun écran ne le dise. `poke-noeud-tient-parole` l'a pris
      //    dans la minute : le nœud portait `niveau` et personne ne le lisait.
      var nivSta = n.niveau || 30;
      var dormeur = M().creer(n.espece, nivSta, hasard, { capture: { zone: n.etape, niveau: nivSta } });
      P().voir(partie, dormeur.n);
      return lancerCombat([dormeur], { dresseur: false, zone: n.etape, legendaire: n.espece });
    }
    if (n.type === "camion") return ecranCamion(n);
    // La pêche : même boucle de rencontres, mais la table vient de la canne.
    if (n.type === "peche") {
      chaine = {
        reste: n.rencontres || 1, type: "peche",
        etape: W.pokeEtapeDe(n.etape) || { id: n.etape, lieu: n.lieu, tables: [] },
        table: W.PokeCarteActes.tablePeche(n.canne, n.lieu),
        // 🔴 LE POISSON SUIT LA MÊME RAMPE QUE LES SAUVAGES (13/08). La pêche
        //    était le seul combat hors de toute rampe : +24 à +53 d'écart
        //    médian sous la tête du joueur. Le canon reste un plancher ; un
        //    nœud d'avant l'estampille n'a pas de `vise` et joue au canon.
        vise: n.vise, dose: n.dose,
      };
      return rencontreSuivante();
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  L'ARBRE ET LE ROCHER — MÊME BOUCLE QUE LA PÊCHE
    //
    //  🔴 SEPT ESPÈCES DE JOHTO NE SORTENT QUE D'ICI. Voir `noeudArbre` dans
    //     `carte-actes.js` : ni herbe, ni eau, ni canne ne les porte.
    //  ⚠️ LA TABLE RARE UNE FOIS SUR DIX, tirée À CHAQUE RENCONTRE et non une
    //     fois pour le nœud : c'est la règle de la cartouche, et c'est ce qui
    //     fait qu'on secoue un arbre de plus « au cas où ».
    // ═══════════════════════════════════════════════════════════════════════
    if (n.type === "arbre") {
      chaine = {
        reste: n.rencontres || 1, type: "arbre", arbre: n,
        etape: (W.pokeEtapeDe && W.pokeEtapeDe(n.etape)) || { id: n.etape, lieu: n.lieu, tables: [] },
        table: W.PokeCarteActes.tableArbre(n.etape, hasard.entier(10) === 0),
        vise: n.vise, dose: n.dose,
      };
      return rencontreSuivante();
    }
    if (n.type === "dresseur") {
      var eq = n.equipe.map(function (x) { return M().creer(x.n, x.niveau, hasard); });
      for (var j = 0; j < eq.length; j++) P().voir(partie, eq[j].n);
      // 🔴 `classe` VOYAGE JUSQU'AU COMBAT. Le nœud l'annonce sur la carte
      //    depuis le premier jour et s'arrêtait là : voir `nomAdversaire`.
      var sacD = soinsDeDresseur(partie.acte);
      return lancerCombat(eq, { dresseur: true, gain: n.gain, classe: n.classe, soins: sacD.n, soin: sacD.objet });
    }
    // ── Herbes et eau ───────────────────────────────────────────────────────
    // 🔴 LE NŒUD ANNONÇAIT « 3 RENCONTRES » ET N'EN DONNAIT QU'UNE — parfois
    //    zéro. Vérifié dans le navigateur : nœud « 3 rencontres — Roucool 50 %
    //    · Rattata 50 % », écran obtenu « Rien ne bouge ici. » Le tirage
    //    n'était lancé qu'UNE fois, et il passait encore par le taux de
    //    rencontre du ROM (sur 187), qui pouvait échouer.
    //
    //    C'est la classe de défaut n°1 du projet, dans son autre sens : ici le
    //    jeu ANNONCE et ne livre pas. Or l'annonce est la seule raison d'être
    //    d'un nœud — c'est elle qui transforme un clic en arbitrage. Un nœud
    //    qui ment vaut moins qu'un nœud muet.
    //
    //    Le taux du ROM garde tout son sens à sa place : il dit la probabilité
    //    de croiser quelque chose EN MARCHANT. Ici, marcher est déjà décidé —
    //    on est entré dans les hautes herbes en connaissance de cause, et le
    //    nœud a chiffré ce qu'on y trouverait.
    //  ⚠️ `vise` remonte au moteur : les sauvages suivent la rampe de l'acte
    //     (voir `rencontre()` dans partie.js). Un nœud d'avant l'estampille
    //     n'en a pas — il sert le niveau du ROM, comme avant.
    chaine = { reste: n.rencontres || 1, etape: etape, milieu: n.type === "eau" ? "eau" : "herbe", type: n.type, vise: n.vise, dose: n.dose };
    return rencontreSuivante();
  }

  // La suite d'un nœud de rencontre. Chaque combat terminé rend la main ici
  // jusqu'à ce que le compte annoncé soit épuisé.
  var chaine = null;
  function rencontreSuivante() {
    if (!chaine || chaine.reste <= 0) { chaine = null; return carte(); }
    chaine.reste--;
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LA PÊCHE NE TIRE PAS DANS LES MÊMES TABLES. Elle a les siennes —
    //    `POKE_PECHE` — et c'est le cran de la canne qui décide laquelle. Les
    //    faire passer par `rencontre()` aurait rendu les espèces des herbes, et
    //    la canne n'aurait rien ouvert du tout : seize espèces seraient restées
    //    déclarées atteignables et introuvables, ce qu'elles étaient déjà.
    if (chaine.table) {
      // 🔴 LA TABLE RARE SE RETIRE À CHAQUE COUP, PAS UNE FOIS PAR NŒUD. La
      //    tirer à la création de la chaîne aurait fait de la rareté une
      //    propriété du nœud : trois Scarhino d'affilée, ou aucun jamais.
      //    C'est la règle de la cartouche, et c'est ce qui fait qu'on secoue
      //    un arbre de plus.
      if (chaine.type === "arbre") {
        chaine.table = W.PokeCarteActes.tableArbre(chaine.etape.id, hasard.entier(10) === 0);
      }
      var tire = hasard.dans(chaine.table);
      // Même formule que `rencontre()` : max(canon, visé − dose). Le niveau
      // est un paramètre, pas un tirage — le rejeu ne bouge pas.
      var nivPoisson = chaine.vise ? Math.max(tire.niveau, chaine.vise - (chaine.dose || 4)) : tire.niveau;
      var poisson = M().creer(tire.n, nivPoisson, hasard,
        { capture: { zone: chaine.etape.id, niveau: nivPoisson } });
      P().voir(partie, poisson.n);
      // 🔴 ET L'ÉCRAN DIT QU'ON A FERRÉ, PAS QU'UN POISSON « APPARAÎT ». Vu en
      //    jouant la pêche pour la première fois : « Un Magicarpe sauvage
      //    apparaît ! » — la phrase des hautes herbes, sur un poisson qu'on
      //    vient de tirer de l'eau. Rien ne s'est montré, on l'a attrapé.
      return lancerCombat([poisson], { dresseur: false, zone: chaine.etape.id, chaine: true,
                                       peche: chaine.type !== "arbre",
                                       arbre: chaine.type === "arbre" ? (chaine.arbre && chaine.arbre.genre) || "arbre" : null });
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 L'ERRANT COUPE LA RENCONTRE, IL NE S'Y AJOUTE PAS. Il prend la place
    //     de la créature qu'on allait croiser : sinon un nœud à trois
    //     rencontres en rendrait quatre, et le nœud aurait menti sur ce qu'il
    //     annonçait — la loi du mode.
    //  ⚠️ ET SEULEMENT DANS LES HERBES. On ne croise pas Raikou en pêchant :
    //     la pêche est déjà sortie plus haut, il reste l'herbe et l'eau,
    //     et l'eau ne porte pas les bêtes dans le jeu d'origine.
    // ═══════════════════════════════════════════════════════════════════════
    if (chaine.milieu !== "eau") {
      var err = errantQuiParait();
      if (err) {
        var bete = M().creer(err.n, err.niveau, hasard,
          { capture: { zone: chaine.etape.id, niveau: err.niveau } });
        P().voir(partie, bete.n);
        var rgl = reglesErrants();
        return message(T("nLegendaire"),
          T("errantParait", { nom: ESP()[err.n].nom[LANG()] }) + " " + T("errantPresse"),
          function () {
            return lancerCombat([bete], { dresseur: false, zone: chaine.etape.id,
              chaine: true, errant: err.n, fuiteApres: rgl.tours });
          });
      }
    }
    var sauvage = P().rencontre(partie, chaine.etape, chaine.milieu, hasard, { forcer: true, vise: chaine.vise, dose: chaine.dose });
    // Une zone sans table exploitable ne peut rien rendre : on le DIT au lieu
    // de renvoyer sur la carte sans un mot.
    if (!sauvage) { var t = chaine.type; chaine = null; return message(T(ICONE[t]), T("rien")); }
    return lancerCombat([sauvage], { dresseur: false, zone: chaine.etape.id, chaine: true });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES ÉCRANS D'OBTENTION — 07/08/2026
  //
  //  🔴 Ils réparent DOUZE espèces qu'aucun joueur ne pouvait obtenir. La
  //     donnée existait, la mécanique manquait : le monde annonçait « deux
  //     fossiles » au Mont Sélénité et n'en donnait aucun, la boutique affichait
  //     son étal et ne vendait rien, l'argent s'accumulait sans emploi.
  //
  //  🔴 CHAQUE ÉCRAN DIT POURQUOI IL REFUSE. Un bouton grisé sans raison se lit
  //     comme un bug, même quand la mécanique est juste — c'est la classe de
  //     défaut n°1 du projet, et elle se traite ici comme ailleurs.
  // ═══════════════════════════════════════════════════════════════════════════
  var O = function () { return W.PokeObtenir; };

  // ── UN ARTICLE DE BOUTIQUE ─────────────────────────────────────────────────
  //  🔴 L'ÉTAL SE LISAIT COMME UN FORMULAIRE : sept pilules identiques de six
  //     cents pixels, le nom centré au milieu du vide, le prix largué à
  //     l'autre bout. Rien ne distinguait une Potion d'une Poké Ball.
  //  🔴 ET IL NE DISAIT PAS CE QU'ON POSSÈDE DÉJÀ. C'est pourtant LA donnée
  //     qui décide d'un achat : douze Poké Balls en poche, on n'en rachète
  //     pas ; zéro Antidote avant Erika, on court en acheter. Le jeu le
  //     savait, l'étal se taisait — la classe de défaut n°1 du projet, sur
  //     l'écran où l'on dépense son argent.
  function ligneObjet(cle, actif, raison) {
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 UNE MACHINE EST UN ARTICLE COMME UN AUTRE, ET ELLE SE DÉCRIT MIEUX
    //     QUE LES AUTRES. Son nom, son numéro et son prix viennent de
    //     `POKE_CT` ; sa légende vient de `ditButin({type:"ct"})` — la MÊME
    //     que la carte de butin, qui dit la puissance ET combien de Pokémon de
    //     TON équipe peuvent l'apprendre. C'est l'information qui transforme
    //     un prix en décision : Tonnerre à 2 000 ₽ ne vaut rien si personne
    //     chez toi ne l'apprend, et il vaut le voyage si Pikachu est là.
    // ═══════════════════════════════════════════════════════════════════════
    var machine = O().machinePour(cle);
    var o = W.PokeRegles ? W.PokeRegles.objet(cle) : W.POKE_OBJETS[cle];
    if (!o && !machine) return "";
    var nom = machine ? nomMachine(machine) : esc(o.nom[LANG()]);
    var enPoche = machine
      ? ((partie.ct && partie.ct[machine.n]) || 0)
      : ((partie.sac && partie.sac[cle]) || 0);
    // 🔴 LA PASTILLE DE TYPE, PAS UN ATTRIBUT MUET. J'avais posé
    //    `PokeType.attr(...)` sur l'article : il pose `--teinte`, et AUCUNE
    //    règle ne la consomme sur `.pkdx-article`. C'était un état que rien ne
    //    lit — le marqueur 7 du test anti-vibe-code, celui que ce fichier cite
    //    lui-même. La carte de butin montre une pastille pour la même machine :
    //    l'étal montre la même, et le joueur lit un seul langage.
    return '<button type="button" class="pkdx-article" data-achat="' + esc(cle) + '"' +
        (actif ? "" : " disabled") + ">" +
      '<span class="pkdx-article-nom">' + nom +
        (machine ? " " + W.PokeType.pastille(machine.type) : "") + "</span>" +
      '<span class="pkdx-article-prix">' + argent(machine ? machine.prix : o.prix) + "</span>" +
      // 🔴 CE QUE L'OBJET FAIT, par la MÊME porte que la carte de butin. Voir
      //    `ditButin` : un objet ramassé et un objet acheté ne peuvent pas se
      //    décrire de deux façons.
      (function () {
        var d = ditButin(machine ? { type: "ct", ct: machine.n } : { type: "objet", objet: cle });
        return d ? '<span class="pkdx-article-dit">' + d + "</span>" : "";
      })() +
      (enPoche ? '<span class="pkdx-article-poche">' + T("dejaEnPoche", { n: enPoche }) + "</span>" : "") +
      (raison ? '<span class="pkdx-article-raison">' + raison + "</span>" : "") +
    "</button>";
  }

  function ecranBoutique(etape) {
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 CETTE LIGNE EN ÉTAIT DEUX, ET LA PREMIÈRE N'A JAMAIS RIEN SERVI. Elle
    //    lisait `etape.mart` — un champ qu'AUCUNE étape de `voyage.js` ne
    //    porte. `inventaire("")` rendait donc une liste vide à chaque ouverture
    //    de boutique depuis le premier jour, et c'est le repli qui travaillait.
    //    Un repli qui s'exécute toujours n'est pas un repli : c'est la règle,
    //    déguisée en exception. Et tant qu'elle se déguise, personne ne la
    //    relit — j'ai moi-même écrit hier, trois cents lignes plus haut, que
    //    « `ecranBoutique` lit aussi `etape.mart` », en le croyant vivant.
    //
    // 🔴 ET C'EST BIEN LA PROGRESSION QUI DOIT DÉCIDER, pas la ville. Le nœud
    //    de carte annonce « Balls, soins, et ce que les badges ont ouvert » :
    //    l'étal suit le voyage. Sur une carte à embranchements on croise la
    //    même ville à des moments très différents, et un stock figé par ville
    //    trahirait l'annonce une fois sur deux.
    // ═══════════════════════════════════════════════════════════════════════
    var liste = O().inventaire(martPour(partie));
    // Le 5F de Céladopole rejoint l'étal dès que la ville s'ouvre : ce sont des
    // consommables de combat, ils se rangent avec les potions. Sans doublon —
    // un étal tardif peut déjà les proposer.
    if ((partie.acte || 1) >= O().ACTE_MACHINES) {
      var martCombat = O().martCombat ? O().martCombat(partie) : O().MART_COMBAT;
      O().inventaire(martCombat).forEach(function (c) {
        if (liste.indexOf(c) < 0) liste = liste.concat([c]);
      });
    }
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 NEUF CT ÉTAIENT DANS LES ÉTALS ET NE S'AFFICHAIENT JAMAIS. Le comptoir
    //    de Céladopole vend `TM_MEGA_PUNCH`, `TM_REFLECT` et sept autres ; ces
    //    clés n'existent pas dans `POKE_OBJETS`, donc `ligneObjet` rendait une
    //    chaîne vide et l'article disparaissait SANS UN MOT. Un étal déclarant
    //    douze articles en montrait trois, et rien ne le disait.
    //    Elles ont ensuite été écartées ICI, explicitement, avec la raison
    //    écrite : « vendre une CT demande de choisir à qui l'enseigner — un
    //    écran que je n'ai pas écrit ». Cette ligne a sauté le 08/08.
    // 🔴 CET ÉCRAN EXISTAIT DÉJÀ. `apprendreCT` est complète, le sac montre les
    //    machines et fait choisir le Pokémon puis l'attaque à remplacer : il
    //    ne manquait QUE la caisse. Neuf articles rendus, et surtout le seul
    //    puits d'argent qui achète de la puissance DURABLE — une vitamine rend
    //    un point, une machine change ce qu'un Pokémon sait faire.
    // ═══════════════════════════════════════════════════════════════════════
    function rendre(dit) {
      coque(
        '<p class="pkdx-surtitre">' + T("nBoutique") + "</p>" +
        '<h1 class="pkdx-titre">' + esc(lieuNom(etape.lieu)) + "</h1>" +
        '<p class="pkdx-dit">' + (dit || T("aBoutique")) + "</p>" +
        (liste.length
          ? '<div class="pkdx-etal">' + liste.map(function (c) {
              var assez = partie.argent >= O().prixDe(c);
              return ligneObjet(c, assez, assez ? "" : T("tropCher", { n: milliers(O().prixDe(c) - partie.argent) }));
            }).join("") + "</div>"
          : '<p class="pkdx-raison">' + T("rienAVendre") + "</p>") +
        // ═══════════════════════════════════════════════════════════════════
        // 🔴 LE RAYON RARE — LE SEUL ENDROIT OÙ L'ARGENT DEVIENT DE LA
        //    PUISSANCE. Une vitamine coûte plus que tout l'étal réuni et rend
        //    une statistique DÉFINITIVE ; une pierre fait évoluer sur-le-champ.
        //    Sans lui, l'argent s'accumulait sans emploi, et les trois leviers
        //    qui jouent dessus — Serment de l'avarice, de la fortune, Sceau de
        //    la Foudre — ne pesaient sur rien.
        //    Le rayon est tiré à la création du nœud, jamais ici : cet écran se
        //    redessine à chaque achat, et l'étal changerait sous les doigts.
        // ═══════════════════════════════════════════════════════════════════
        // ═══════════════════════════════════════════════════════════════════
        //  LE COMPTOIR DES MACHINES
        //
        //  🔴 IL A FALLU LE MESURER POUR VOIR QU'IL N'EXISTAIT PAS. Rendre les
        //     CT vendables ne suffisait pas : sur 120 voyages, 1 040 nœuds
        //     boutique, et PAS UN ne déclare d'étal — tous retombent sur
        //     `martPour(partie)`, dont la liste ne contient que le comptoir des
        //     soins de Céladopole, jamais celui des machines. La vente était
        //     câblée et inatteignable : une mécanique livrée sans porte
        //     d'entrée n'existe pas.
        //  🔴 UN RAYON, PAS UN NŒUD. Ajouter un type de nœud aurait changé la
        //     génération de la carte, donc le nombre de tirages, donc le
        //     contrat de rejeu. Le grand magasin de Céladopole a plusieurs
        //     étages dans le jeu d'origine : c'est le même bâtiment.
        //  🔴 À PARTIR DE L'ACTE 4, celui d'Erika — la ville du magasin. Plus
        //     tôt serait hors canon ; plus tard serait hors de portée : la
        //     moitié des voyages s'arrêtent devant Koga, à l'acte 5.
        //  C'est le seul achat qui donne de la puissance DURABLE : une vitamine
        //  rend un point, une machine change ce qu'un Pokémon sait faire.
        //
        //  🔴 ET CETTE DERNIÈRE PHRASE EST DÉMENTIE PAR LA MESURE — 14/08/2026.
        //     Elle est vraie sur le papier et fausse dans une bourse. Au banc
        //     de difficulté, 400 voyages à graines égales, un joueur qui achète
        //     ici perd : politique naïve, Ligue 32,8 → 27,7 % ; politique
        //     compétente, Ligue 29,2 → 23,0 % et la MÉDIANE tombe de 8 badges
        //     à 5. La raison est économique, pas mécanique : une machine coûte
        //     le prix de deux Hyper Potions et rend UNE attaque en écrasant une
        //     attaque déjà là, quand les soins, eux, gagnent des combats de
        //     Champion. La bourse de fin le dit : 1 646 → 869 ₽.
        //  ⚖️ ON NE TOUCHE NI AUX PRIX NI AU RAYON : ce sont ceux du ROM, le
        //     canon est la loi, et un arbitrage qu'on peut perdre reste un
        //     arbitrage. Mais la phrase ci-dessus ne doit plus se lire comme
        //     un conseil : c'est le rayon RARE qui porte la puissance durable.
        //     Le banc le rejoue avec `--comptoir-ct`.
        //     *Une loi écrite dans un commentaire que personne ne mesure n'est
        //     pas une loi, c'est une opinion — la classe n°1 de ce dossier.*
        // ═══════════════════════════════════════════════════════════════════
        (function () {
          if ((partie.acte || 1) < O().ACTE_MACHINES) return "";
          var martMachines = O().martMachines ? O().martMachines(partie) : O().MART_MACHINES;
          var ct = O().inventaire(martMachines);
          if (!ct.length) return "";
          return '<h2 class="pkdx-soustitre">' + T("etalMachines") + "</h2>" +
            '<p class="pkdx-dit">' + T("etalMachinesDit") + "</p>" +
            '<div class="pkdx-etal">' + ct.map(function (c) {
              var assez = partie.argent >= O().prixDe(c);
              // ═══════════════════════════════════════════════════════════
              //  🔴 UNE MACHINE QUE PERSONNE NE PEUT APPRENDRE COÛTE 2 000 À
              //     3 000 ₽, ET RIEN NE LE SIGNALAIT OÙ L'ŒIL REGARDE. La
              //     légende le dit — « 80 de puissance · personne ne peut
              //     l'apprendre pour l'instant » — mais en FIN de phrase,
              //     après la puissance, sur un bouton identique aux autres.
              //     Mesuré la même nuit : la bourse médiane en fin de voyage
              //     est de 222 ₽. Un achat à 2 000 ₽ qui ne sert à rien
              //     maintenant casse un voyage, et il se fait d'un clic.
              //  🔴 ON NE LA GRISE PAS, ET C'EST DÉLIBÉRÉ. `acheter()` la RANGE
              //     dans le sac : on peut l'acheter pour un Pokémon qu'on
              //     attrapera plus tard, et « pour l'instant » dit exactement
              //     ça. Interdire supprimerait un pari légitime ; signaler le
              //     rend conscient. La nuance est tout le sujet.
              //  ⚠️ L'avertissement passe par la fente des RAISONS, là où l'œil
              //     cherche déjà « il te manque X ₽ » — jamais par une couleur
              //     neuve : la loi du mode réserve la couleur aux types et aux
              //     créatures.
              // ═══════════════════════════════════════════════════════════
              var mach = O().machinePour(c);
              var personne = !!(mach && O().quiApprend(partie, mach).length === 0);
              return ligneObjet(c, assez,
                !assez ? T("tropCher", { n: milliers(O().prixDe(c) - partie.argent) })
                       : (personne ? T("etalPersonne") : ""));
            }).join("") + "</div>";
        })() +
        (etape.rare && etape.rare.length
          ? '<h2 class="pkdx-soustitre">' + T("etalRare") + "</h2>" +
            '<p class="pkdx-dit">' + T("etalRareDit") + "</p>" +
            '<div class="pkdx-etal">' + etape.rare.map(function (c) {
              var assez = partie.argent >= O().prixDe(c);
              return ligneObjet(c, assez, assez ? "" : T("tropCher", { n: milliers(O().prixDe(c) - partie.argent) }));
            }).join("") + "</div>"
          : "") +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
        "</div>"
      );
      surClic("[data-achat]", function (e) {
        var cle = e.currentTarget.getAttribute("data-achat");
        var r = O().acheter(partie, cle);
        // Le refus se dit aussi. Un clic sans effet et sans bruit se lit comme
        // un bouton cassé, pas comme « tu n'as pas assez ».
        son(r.ok ? "PURCHASE" : "DENIED");
        // 🔴 LE NOM DE CE QU'ON VIENT D'ACHETER PASSE PAR LA MÊME PORTE QUE
        //    L'ÉTAL. Lire `POKE_OBJETS[cle]` directement plantait sur une
        //    machine — la clé n'y est pas — et le message d'achat aurait été
        //    le seul endroit du circuit à l'ignorer.
        var mAch = O().machinePour(cle);
        var quoi = mAch ? nomMachine(mAch)
                        : esc(W.PokeRegles.nomObjet(cle));
        rendre(r.ok ? T("achete", { quoi: quoi })
                    : T("tropCher", { n: milliers(r.manque) }));
      });
      racine.querySelector("#pk-suivant").addEventListener("click", carte);
    }
    rendre();
  }

  // Quels comptoirs s'ouvrent, et à quel acte : la liste vit dans `obtenir.js`,
  // avec les inventaires qu'elle désigne. Elle a d'abord été écrite ici, et
  // l'outil qui mesurait l'atteignabilité la relisait à l'expression régulière
  // — il a divergé au premier comptoir ajouté, en accusant à tort sept objets
  // qui venaient d'être rendus achetables.
  function martPour(p) { return O().martPour(p); }

  function lieuNom(lieu) {
    var l = LIEUX()[lieu];
    return l ? (l[LANG()] || l.fr) : lieu;
  }

  // ── Les deux fossiles ──────────────────────────────────────────────────────
  function ecranFossile() {
    var choix = O().fossiles() || [];
    // 🔴 UN ÉCRAN NE S'OUVRE JAMAIS SANS ISSUE — 21/08/2026. Vu en capture :
    //    « Deux fossiles. Tu n'en prendras qu'un. », la phrase de l'irréversible
    //    sous les yeux, et PAS UN BOUTON. `choix` était vide (Johto déclare
    //    `fossiles: null`), `choix.map()` ne rendait rien, et le joueur devait
    //    revenir à l'accueil et reprendre son voyage pour s'en sortir.
    //  🔑 C'est la deuxième fois de la journée après le Concours de Syrean, et
    //    la règle est la même : la liste peut être vide, la SORTIE ne peut pas.
    //    Le nœud ne se pose plus dans ce cas (carte-actes.js) — cette porte-ci
    //    est le filet, pour le jour où une autre voie y mène.
    if (!choix.length) {
      return message(T("nFossile"), T("rien"), carte);
    }
    coque(
      '<p class="pkdx-surtitre">' + T("nFossile") + "</p>" +
      '<h1 class="pkdx-titre">' + T("aFossile") + "</h1>" +
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 C'EST LE CHOIX IRRÉVERSIBLE DU VOYAGE, ET ON NE VOYAIT PAS CE QU'ON
      //    CHOISISSAIT. Deux petits boutons de texte — « Fossile Dôme » et
      //    « Nautile » — pour décider entre Kabuto et Amonita. Qui ne connaît
      //    pas la première génération par cœur tranchait à l'aveugle, et
      //    l'autre fossile est PERDU pour la partie.
      //    On montre donc la créature qui en sortira : son dessin, son nom,
      //    ses types. C'est la seule information qui permette de choisir.
      // ═══════════════════════════════════════════════════════════════════════
      '<p class="pkdx-dit">' + T("fossileChoix") + "</p>" +
      // ⚠️ ET CE N'EST PAS ENCORE UN POKÉMON. Tout l'écran — artwork, nom,
      //    types, niveau — dit le contraire ; le laboratoire est à six actes,
      //    sur une carte où l'on peut le manquer.
      '<p class="pkdx-dit est-alerte">' + T("fossilePasEncore") + "</p>" +
      '<div class="pkdx-fossiles">' + choix.map(function (f) {
        var e = ESP()[f.n];
        return '<button type="button" class="pkdx-fossile" data-fossile="' + esc(f.objet) + '"' +
            W.PokeType.attr(e.types[0]) + ">" +
          // 🔴 PAS DE CHARGEMENT PARESSEUX ICI. Deux images, toutes deux au
          //    premier plan, sur le choix irréversible du voyage : `lazy` les
          //    faisait apparaître APRÈS le reste, et la carte clignotait vide
          //    une fraction de seconde. Vu à la capture — la première montrait
          //    deux cadres blancs, la seconde les créatures. Le paresseux sert
          //    la grille de 151 cases du Pokédex, pas deux vignettes visibles.
          '<img alt="" src="assets/img/poke/art/' + f.n + '.webp"' +
            ' onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(f.n, "?i=6") + '\'">' +
          '<span class="pkdx-fossile-objet">' + esc(nomObjet(f.objet)) + "</span>" +
          "<b>" + esc(e.nom[LANG()]) + "</b>" +
          '<span class="pkdx-fossile-types">' +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") + "</span>" +
          '<span class="pkdx-niveau">' + W.PokeGenre.niveau(f.niveau) + "</span>" +
        "</button>";
      }).join("") + "</div>"
    );
    surClic("[data-fossile]", function (e) {
      var objet = e.currentTarget.getAttribute("data-fossile");
      O().prendreFossile(partie, objet);
      // 🔴 « L'AUTRE RESTE DANS LA PIERRE » — la phrase du choix irréversible,
      //    écrite dans le scénario et jamais dite. Elle vient APRÈS le nom de
      //    ce qu'on emporte : d'abord le fait, ensuite ce qu'il coûte.
      message(T("nFossile"), T("fossilePris", { quoi: esc(nomObjet(objet)) }) + " " +
        W.PokeGenre.pour(W.POKE_SCENARIO.POKEDEX, "fossileChoisi", null, "scenario:pokedex"));
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 LE PAYEMENT DU SEUL CHOIX IRRÉVERSIBLE DU VOYAGE, LIVRÉ DANS UNE BOÎTE
  //    DE DIALOGUE. Des actes plus tôt, le joueur a tranché entre deux fossiles
  //    en sachant que l'autre resterait sous la roche. On lui avait fait un
  //    écran entier pour choisir — et pour la récompense, une phrase :
  //    « Amonita revient à la vie. » suivie d'un bouton. La dette ouverte au
  //    Mont Sélénité se soldait en une ligne.
  // 🔴 ON MONTRE DONC CE QUI SORT DE LA PIERRE, et on RAPPELLE ce qu'on a
  //    laissé : c'est ce qui donne son poids au choix, et c'est la dernière
  //    occasion de le dire. Le fossile écarté se lit dans les données — je ne
  //    l'écris pas, je le déduis de celui qu'on porte.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 LA SALLE RANIME DEUX CHOSES DEPUIS LE MUSÉE. Le fossile du Mont
  //     Sélénité et le Vieil Ambre d'Argenta arrivent tous deux ici. Un seul
  //     écran pour les deux escamoterait le second — on les enchaîne, chacun
  //     avec sa créature, comme deux montées de niveau d'affilée.
  function ecranRanimation() {
    var porte = partie.fossile;
    var r = O().ranimer(partie, hasard);
    if (!r.ok) return ecranRanimeAmbre(function () {
      message(T("nRanimation"), T("aRanimationSans"));
    });

    var mon = r.mon, e = ESP()[mon.n];
    var laisse = null;
    var tous = O().fossiles();
    for (var i = 0; i < tous.length; i++) if (tous[i].objet !== porte) laisse = tous[i];

    son("GET_ITEM_1");
    W.setTimeout(function () { criDe(mon.n); }, 700);

    coque(
      '<p class="pkdx-surtitre">' + T("nRanimation") + "</p>" +
      '<h1 class="pkdx-titre">' + T("ranimeFait", { quoi: esc(e.nom[LANG()]) }) + "</h1>" +
      '<p class="pkdx-dit">' + T("ranimeDit") +
        // ⚠️ ET OÙ IL ATTERRIT : à équipe pleine il part au PC, en silence.
        (r.ou === "boite" ? " " + T("partEnReserve") : "") + "</p>" +
      '<div class="pkdx-prise">' +
        '<figure class="pkdx-prise-art">' +
          '<img alt="' + esc(e.nom[LANG()]) + '" src="assets/img/poke/art/' + mon.n + '.webp"' +
            ' onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(mon.n, "?i=6") + '\'">' +
        "</figure>" +
        '<dl class="pkdx-prise-releve">' +
          "<div><dt>" + T("priseNiveau") + "</dt><dd>" + mon.niveau + "</dd></div>" +
          "<div><dt>" + T("priseTypes") + "</dt><dd>" +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join(" ") + "</dd></div>" +
          (laisse
            ? "<div><dt>" + T("ranimeLaisse") + "</dt><dd>" +
                esc(ESP()[laisse.n].nom[LANG()]) + "</dd></div>"
            : "") +
        "</dl>" +
      "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
      "</div>"
    );
    // L'ambre passe APRÈS le fossile : c'est la dette la plus ancienne, mais
    // c'est aussi la plus rare — on finit dessus.
    racine.querySelector("#pk-suivant").addEventListener("click", function () {
      ecranRanimeAmbre(carte);
    });
  }

  //  L'ambre du Musée. `sinon` est ce qu'on fait quand il n'y a rien à réveiller
  //  — la salle enchaîne, ou renvoie à la carte.
  function ecranRanimeAmbre(sinon) {
    var r = O().ranimerAmbre(partie, hasard);
    if (!r.ok) return sinon();
    var mon = r.mon, e = ESP()[mon.n];
    son("GET_ITEM_1");
    W.setTimeout(function () { criDe(mon.n); }, 700);
    coque(
      '<p class="pkdx-surtitre">' + T("nRanimation") + "</p>" +
      '<h1 class="pkdx-titre">' + T("ranimeFait", { quoi: esc(e.nom[LANG()]) }) + "</h1>" +
      '<p class="pkdx-dit">' + T("ranimeAmbre") + "</p>" +
      '<div class="pkdx-prise">' +
        '<figure class="pkdx-prise-art">' +
          '<img alt="' + esc(e.nom[LANG()]) + '" src="assets/img/poke/art/' + mon.n + '.webp"' +
            ' onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(mon.n, "?i=6") + '\'">' +
        "</figure>" +
        '<dl class="pkdx-prise-releve">' +
          "<div><dt>" + T("priseNiveau") + "</dt><dd>" + mon.niveau + "</dd></div>" +
          "<div><dt>" + T("priseTypes") + "</dt><dd>" +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join(" ") + "</dd></div>" +
        "</dl>" +
      "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-suivant").addEventListener("click", carte);
  }

  // ── Le Casino ──────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 SIX AVERTISSEMENTS ROUGES EMPILÉS, ZÉRO CRÉATURE À L'ÉCRAN. Le casino
  //    vend des POKÉMON, et il n'en montrait aucun : six pilules grises avec un
  //    nom centré dans le vide, et sous chacune « Il te manque N jetons. » en
  //    rouge. Répétée six fois, la phrase n'informe plus — elle crie. Et elle
  //    ne dit rien de neuf : le compteur de jetons est en titre, le prix est à
  //    côté, la soustraction est déjà à l'écran.
  // 🔴 CE QUI MANQUAIT VRAIMENT, c'est ce qu'on achète : le dessin, les types,
  //    le niveau — et POURQUOI un lot vaut quatre chiffres. On garde donc une
  //    seule ligne d'aide, celle qui sert : le lot le plus proche, et combien
  //    de paquets au comptoir il demande. C'est la seule action possible ici.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranCasino() {
    var LOT_JETONS = 50;   // le paquet vendu au comptoir, comme dans le jeu
    function rendre(dit) {
      var lots = O().lotsCasino(partie);
      // 🔴 [17/08] LE MÊME TAUX QUE L'ACHAT, PAS UNE SECONDE COPIE. L'écran
      //    lisait `prixDe("COIN")` — la table GÉNÉRÉE depuis le ROM — pendant
      //    que le comptoir applique le taux du mode. Deux vérités pour un prix.
      var prixPaquet = O().prixJeton() * LOT_JETONS;
      var enPoche = partie.jetons || 0;

      // Le lot abordable le plus cher est déjà pris en compte par l'état des
      // cartes ; ce qu'on cherche ici, c'est le premier qui NE l'est pas.
      var vise = null;
      for (var i = 0; i < lots.length; i++) {
        if (lots[i].jetons > enPoche && (!vise || lots[i].jetons < vise.jetons)) vise = lots[i];
      }

      coque(
        '<p class="pkdx-surtitre">' + T("nCasino") + "</p>" +
        '<h1 class="pkdx-titre">' + T("jetons") + " " + enPoche + "</h1>" +
        '<p class="pkdx-dit">' + (dit || T("aCasino")) + "</p>" +
        '<div class="pkdx-actions">' +
          '<button type="button" class="pkdx-touche" id="pk-jetons"' +
            (partie.argent >= prixPaquet ? "" : " disabled") + ">" +
            T("acheterJetons", { n: LOT_JETONS }) + " · " + argent(prixPaquet) + "</button>" +
        "</div>" +
        (partie.argent >= prixPaquet ? ""
          : '<p class="pkdx-raison">' +
              T("casinoBourse", { n: argent(prixPaquet - partie.argent) }) + "</p>") +
        (vise
          ? '<p class="pkdx-vise">' + T("casinoVise", {
              nom: esc(ESP()[vise.n].nom[LANG()]),
              n: vise.jetons - enPoche,
              p: Math.ceil((vise.jetons - enPoche) / LOT_JETONS)
            }) + "</p>"
          : "") +
        '<div class="pkdx-lots">' + lots.map(function (l, i) {
          var e = ESP()[l.n];
          var assez = enPoche >= l.jetons;
          return '<button type="button" class="pkdx-lot" data-lot="' + i + '"' +
              W.PokeType.attr(e.types[0]) + (assez ? "" : " disabled") + ">" +
            // 🔴 LE LOT NE VAUT QUE PAR LE POKÉDEX, et l'écran ne disait pas
            //    s'il était NEUF. « Seulement ici » dit la rareté du comptoir,
            //    pas ce qui manque à la collection — or c'est la seule chose
            //    qui décide de dépenser 5 500 jetons. `neufAuPokedex` est la
            //    porte unique, et l'écran d'échange l'emploie deux nœuds plus
            //    loin : elle manquait ici seulement.
            (l.unique ? '<span class="pkdx-lot-rare">' + T("casinoUnique") + "</span>" : "") +
            // ⚠️ MÊME CLÉ QUE L'ÉCHANGE (`echangeNeuf`) : deux écrans qui
            //    disent le même fait ne l'écrivent pas deux fois.
            (neufAuPokedex(l.n) ? '<span class="pkdx-lot-neuf">' + T("echangeNeuf") + "</span>" : "") +
            '<img alt="" loading="lazy" src="' + W.PokeSprites.face(l.n, "?i=6") + '">' +
            '<b class="pkdx-lot-nom">' + esc(e.nom[LANG()]) + "</b>" +
            '<span class="pkdx-lot-types">' +
              e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") + "</span>" +
            '<span class="pkdx-niveau">' + W.PokeGenre.niveau(l.niveau) + "</span>" +
            '<span class="pkdx-lot-prix' + (assez ? " est-payable" : "") + '">' +
              l.jetons + " " + T("jetons").toLowerCase() + "</span>" +
          "</button>";
        }).join("") + "</div>" +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
        "</div>"
      );
      racine.querySelector("#pk-jetons").addEventListener("click", function () {
        var r = O().acheterJetons(partie, LOT_JETONS);
        rendre(r.ok ? null : T("tropCher", { n: milliers(r.manque) }));
      });
      surClic("[data-lot]", function (e) {
        var l = lots[+e.currentTarget.getAttribute("data-lot")];
        var r = O().prendreLot(partie, l, hasard);
        if (!r.ok) return rendre(T("pasAssezJetons", { n: r.manque }));
        // ⚠️ ET ON DIT OÙ IL VA. À équipe pleine, la créature part en réserve —
        //    six écrans le faisaient en silence, sur un lot payé jusqu'à 5 500
        //    jetons, avec un artwork qui laisse croire qu'il te suit.
        var ouCasino = O().ranger(partie, r.mon);
        P().prendre(partie, r.mon.n, "casino", r.mon.niveau);
        rendre(T("achete", { quoi: esc(ESP()[r.mon.n].nom[LANG()]) }) +
          (ouCasino === "boite" ? " " + T("partEnReserve") : ""));
      });
      racine.querySelector("#pk-suivant").addEventListener("click", carte);
    }
    rendre();
  }

  // ── Les échanges ───────────────────────────────────────────────────────────
  function ecranEchange(n) {
    function rendre(dit) {
      var offres = O().echangesDe(partie, n.etape);
      coque(
        '<p class="pkdx-surtitre">' + T("nEchange") + "</p>" +
        '<h1 class="pkdx-titre">' + esc(lieuNom(n.lieu)) + "</h1>" +
        '<p class="pkdx-dit">' + (dit || "") + "</p>" +
        // ── UN ÉCHANGE, ÇA SE VOIT ───────────────────────────────────────────
        // 🔴 CET ÉCRAN ÉTAIT NU : un bouton gris « Donner Abra contre M. Mime »
        //    et une ligne rouge à côté. Deux créatures changent de main et on
        //    n'en voyait AUCUNE — sur l'écran d'une mécanique dont tout
        //    l'intérêt est d'obtenir une espèce qu'on n'a pas.
        //    On montre donc les deux, face à face, avec la flèche entre elles.
        // 🔴 ET LE SURNOM DU ROM S'AFFICHE AVANT L'ÉCHANGE. « DUX » pour le
        //    Canarticho de Carmin — c'est ce qui rend ces Pokémon reconnaissables
        //    à vie, et le découvrir après coup fait perdre la surprise à l'endroit
        //    où elle vaut quelque chose : au moment de choisir.
        '<div class="pkdx-trocs">' + offres.map(function (e, i) {
          var ea = ESP()[e.donne], eb = ESP()[e.recoit];
          var possede = !!O().trouver(partie, e.donne);
          var face = function (num, sousTitre) {
            return '<span class="pkdx-troc-face">' +
              '<img alt="" loading="lazy" src="' + W.PokeSprites.face(num, "?i=6") + '">' +
              "<b>" + esc(ESP()[num].nom[LANG()]) + "</b>" +
              (sousTitre ? '<span class="pkdx-troc-note">' + sousTitre + "</span>" : "") +
            "</span>";
          };
          return '<button type="button" class="pkdx-troc" data-troc="' + i + '"' +
              (possede ? "" : " disabled") + ">" +
            face(e.donne, possede ? T("echangeTuLAs") : T("echangeIlTeFaut")) +
            '<span class="pkdx-troc-fleche" aria-hidden="true"></span>' +
            // 🔴 CE QUE L'ÉCHANGE VAUT VRAIMENT. Neuf échanges mesurés : aucun
            //    ne donne un Insecte, donc aucun ne répond au mur de Morgane, et
            //    la moitié sont des variantes de ce qu'on donne. Leur valeur est
            //    au POKÉDEX — et le compte le sait déjà, à deux pas d'ici.
            //    On lit la MÊME porte que le PC de Léo et l'écran de compagnon :
            //    une seconde source finirait par dire autre chose.
            face(e.recoit, e.surnom ? esc(e.surnom) : "") +
          "</button>" +
          // La note sort du bouton, et ce n'est pas un detail de mise en page :
          // `.pkdx-troc:disabled` porte une `opacity`, et une opacite posee sur
          // un ancetre ne se rattrape PAS chez un descendant. Nichee dedans, la
          // note tombait a 1,72:1 — precisement sur les echanges qu'on ne peut
          // pas encore faire, c'est-a-dire ceux ou elle sert le plus : elle dit
          // quoi aller attraper.
          (neufAuPokedex(e.recoit)
            ? '<p class="pkdx-troc-neuf">' + T("echangeNeuf") + "</p>" : "");
        }).join("") + "</div>" +
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 QUATRE POKÉMON ÉTAIENT IMPOSSIBLES, ET LE JEU DISAIT COMMENT LES
        //     AVOIR. Alakazam, Ectoplasma, Grolem et Mackogneur n'évoluent que
        //     PAR ÉCHANGE en première génération. La fiche du Pokédex l'affiche
        //     — « par échange » — et aucun échange du mode ne le permettait :
        //     `PokeMoteur.evolutionParEchange` était écrite, exportée, et
        //     appelée NULLE PART. Le jeu indiquait une porte qui n'existait pas.
        //
        //  ✅ L'ALLER-RETOUR. Le dresseur accepte de faire l'échange et de le
        //     défaire : tu confies ton Kadabra, il te rend ton Alakazam. C'est
        //     exactement ce que deux joueurs font depuis 1996 avec un câble, et
        //     ça n'invente aucune règle — l'évolution reste celle du canon.
        //  ⚠️ Le nœud d'échange est UNIQUE (`UNIQUES.echange`) : l'aller-retour
        //     ne se refait donc pas en boucle sur le même nœud.
        //  ⚠️ On ne montre QUE ceux que ça concerne. Une section vide sur les
        //     trois quarts des voyages serait du bruit permanent.
        // ═══════════════════════════════════════════════════════════════════
        (function () {
          //  ⚠️ LA RÉSERVE COMPTE AUSSI (16/08). Cette boucle ne lisait que
          //     l'équipe : un Spectrum laissé au PC n'était jamais proposé, sans
          //     un mot — et rien à l'écran ne disait qu'il fallait le sortir.
          //     On le CONFIE au dresseur : d'où il part n'a aucune importance.
          //     La liste vient de `PokeObtenir`, la même porte que la carte lit
          //     pour décider si le nœud s'ouvre.
          var prets = O().candidatsRetour(partie);
          if (!prets.length) return "";
          return '<p class="pkdx-dit pkdx-troc-retour-dit">' + T("trocRetourDit") + "</p>" +
            '<div class="pkdx-trocs">' + prets.map(function (x) {
              return '<button type="button" class="pkdx-troc" data-retour="' + x.ou + ":" + x.i + '">' +
                '<span class="pkdx-troc-face">' +
                  '<img alt="" loading="lazy" src="' + W.PokeSprites.face(x.mon.n, "?i=6") + '">' +
                  "<b>" + esc(nomDe(x.mon)) + "</b>" +
                "</span>" +
                '<span class="pkdx-troc-fleche" aria-hidden="true"></span>' +
                '<span class="pkdx-troc-face">' +
                  '<img alt="" loading="lazy" src="' + W.PokeSprites.face(x.vers, "?i=6") + '">' +
                  "<b>" + esc(ESP()[x.vers].nom[LANG()]) + "</b>" +
                "</span>" +
              "</button>";
            }).join("") + "</div>";
        })() +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
        "</div>"
      );
      surClic("[data-retour]", function (ev) {
        //  L'attribut porte « où:rang » depuis que la réserve compte : un rang
        //  seul ne dirait plus DANS QUELLE liste chercher.
        var ref = String(ev.currentTarget.getAttribute("data-retour")).split(":");
        var liste = ref[0] === "boite" ? partie.boite : partie.equipe;
        var mon = (liste || [])[+ref[1]];
        if (!mon) return;
        var e = M().evolutionParEchange(mon);
        if (!e) return;
        var avant = nomDe(mon);
        M().faireEvoluer(mon, e.vers);
        // 🔴 « evolution », PAS `partie.etape` — 11/08/2026. Trois sites font
        //    évoluer un Pokémon ; deux inscrivent la provenance « evolution »,
        //    que la fiche traduit par « Obtenu par évolution ». Celui-ci
        //    inscrivait l'ÉTAPE COURANTE, qui n'est pas un lieu nommable :
        //    la fiche retombait sur son repli et disait « Attrapé au niveau X »
        //    — d'un Pokémon qui n'a jamais été attrapé. Le même événement
        //    racontait deux histoires selon le chemin de code emprunté.
        //    Relevé par `poke-provenance` : « 4 zones CALCULÉES, relevées mais
        //    pas prouvées ». En voici une, et elle était fausse.
        P().prendre(partie, e.vers, "evolution", mon.niveau);
        W.PokeProgression.fusionner(partie);
        son("GET_ITEM_2");
        message(T("nEchange"),
          esc(T("trocRetourFait", { qui: avant, nom: ESP()[e.vers].nom[LANG()] })), function () { rendre(""); });
      });
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 ON CÉDAIT UN EXEMPLAIRE PRÉCIS SANS LE NOMMER. `echanger` prenait
      //     LE PREMIER de l'espèce et le retirait DÉFINITIVEMENT : deux Abra,
      //     l'un N.5 l'autre N.30, et le jeu tranchait tout seul selon l'ordre
      //     de l'équipe. C'est le seul nœud irréversible du mode.
      //  ✅ Quand il y en a plusieurs, on demande LEQUEL — avec son niveau et
      //     ses PV, les deux faits qui décident. Un seul exemplaire : rien ne
      //     change, il n'y a pas de choix à poser.
      // ═══════════════════════════════════════════════════════════════════════
      function faireTroc(e, place) {
        var r = O().echanger(partie, e, hasard, place);
        rendre(r.ok
          ? T("echangeFait", { b: esc(ESP()[e.recoit].nom[LANG()]), surnom: esc(e.surnom) })
          : T("echangePasLeBon", { a: esc(ESP()[e.donne].nom[LANG()]) }));
      }

      surClic("[data-troc]", function (ev) {
        var e = offres[+ev.currentTarget.getAttribute("data-troc")];
        var tous = O().exemplairesDe ? O().exemplairesDe(partie, e.donne) : [];
        if (tous.length <= 1) return faireTroc(e, tous[0] || null);
        son("PRESS_AB");
        coque(
          '<p class="pkdx-surtitre">' + T("nEchange") + "</p>" +
          '<h1 class="pkdx-titre">' + T("trocLequel", { a: esc(ESP()[e.donne].nom[LANG()]) }) + "</h1>" +
          '<p class="pkdx-dit est-alerte">' + T("trocDefinitif") + "</p>" +
          '<ul class="pkdx-liste">' + tous.map(function (x, k) {
            return '<li class="pkdx-etape">' +
              '<button type="button" class="pkdx-touche" data-troc-qui="' + k + '">' +
                esc(nomDe(x.mon)) + " " + W.PokeGenre.niveau(x.mon.niveau) + "</button>" +
              '<span class="pkdx-cout">' + x.mon.pv + " / " + x.mon.stats.pv +
                (x.ou === "boite" ? " · " + T("trocEnReserve") : "") + "</span>" +
            "</li>";
          }).join("") + "</ul>" +
          '<div class="pkdx-actions est-pied">' +
            '<button type="button" class="pkdx-touche" id="pk-troc-annule">' + T("retour") + "</button>" +
          "</div>"
        );
        surClic("[data-troc-qui]", function (e2) {
          faireTroc(e, tous[+e2.currentTarget.getAttribute("data-troc-qui")]);
        });
        racine.querySelector("#pk-troc-annule").addEventListener("click", function () { rendre(); });
      });
      racine.querySelector("#pk-suivant").addEventListener("click", carte);
    }
    rendre();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE RIVAL
  //
  //  🔴 SEPT COMBATS ÉCRITS DANS LE ROM ET JAMAIS JOUÉS. `POKE_RIVAL` porte ses
  //     huit équipes, déclinées selon le starter qu'il a pris ; le mode n'en
  //     tirait que la dernière, à la Ligue. Le joueur donnait un nom à son rival
  //     à la création — et ne le revoyait jamais avant l'épilogue.
  //
  //  🔴 IL SE CONTOURNE, ET C'EST UN VRAI CHOIX. Il occupe une branche parmi
  //     deux ou trois, comme tout le reste : le prendre coûte des points de vie
  //     et peut coûter l'acte, l'éviter laisse son argent et son expérience à
  //     l'autre chemin. Écrire ici qu'il « barre la route » serait plus joli et
  //     faux — la carte le pose comme une scène, pas comme un mur.
  //     On montre son équipe entière avant : le voyage se prépare, il ne se
  //     subit pas — même règle que devant une arène.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranRival(n) {
    var equipe = P().equipeRival(partie, n.rencontre, n.vise) || [];
    var nom = esc(partie.rival || T("rivalSansNom"));
    var deja = P().rivalCroise(partie);

    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 IL MONTRAIT MOINS QUE L'ARÈNE, CONTRE SON PROPRE COMMENTAIRE. Sprite,
    //     nom, niveau — pas un type, pas de « FRAPPE EN ». L'en-tête de cet
    //     écran écrit pourtant « on montre son équipe entière avant : le voyage
    //     se prépare, il ne se subit pas — même règle que devant une arène ».
    //     La règle était écrite, pas appliquée, et la décision est identique :
    //     prendre la branche ou la contourner.
    //  ⚠️ MÊME PORTE QUE L'ARÈNE (`typesFrappes`), remontée d'un cran pour être
    //     partagée — pas une seconde dérivation qui divergerait.
    // ═══════════════════════════════════════════════════════════════════════
    var vue = equipe.map(function (x) {
      var e = ESP()[x.n];
      var frappe = typesFrappes(x);
      return '<span class="pkdx-troc-face">' +
        '<img alt="" loading="lazy" src="' + W.PokeSprites.face(x.n, "?i=6") + '">' +
        "<b>" + esc(e.nom[LANG()]) + "</b>" +
        '<span class="pkdx-troc-note">' + W.PokeGenre.niveau(x.niveau) + "</span>" +
        '<span class="pkdx-troc-types">' +
          e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") + "</span>" +
        (frappe.length
          ? '<span class="pkdx-frappe"><i>' + T("frappeEn") + "</i>" +
              frappe.map(function (t) { return W.PokeType.pastille(t); }).join("") + "</span>"
          : "") +
      "</span>";
    }).join("");

    // 🔴 SES RÉPLIQUES ÉTAIENT DÉJÀ ÉCRITES, ET JE NE LES AI PAS VUES.
    //    `POKE_SCENARIO.RIVAL` porte cinq lignes — première rencontre, victoire,
    //    défaite, milieu de voyage, Ligue — rédigées pour exactement cet écran
    //    et employées nulle part. J'ai commencé par en écrire deux autres dans
    //    la table des textes : deux voix pour un seul personnage, c'est la
    //    faute que ce projet traque partout ailleurs. Les miennes sont parties.
    var scene = W.POKE_SCENARIO && W.POKE_SCENARIO.RIVAL;
    var dit = !scene ? "" : W.PokeGenre.pour(
      scene, deja ? "milieu" : "premier", { rival: nom }, "scenario:rival");

    coque(
      '<p class="pkdx-surtitre">' + T("nRival") + "</p>" +
      // Le rival vieillit avec nous : trois silhouettes dans la désassemblée,
      // une par âge, comme ses trois séries d'équipes.
      '<div class="pkdx-champion-tete">' +
        visage(visageRival(n.rencontre), 88) +
        '<div><h1 class="pkdx-titre">' + nom + "</h1></div>" +
      "</div>" +
      '<p class="pkdx-dit">' + dit + "</p>" +
      '<div class="pkdx-adversaires">' + vue + "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-rival-go">' +
          T("defier", { qui: nom }) + "</button>" +
        // Le sac s'ouvre ici aussi : voir son équipe sans pouvoir rien y faire
        // serait une information sans prise, exactement ce qu'on répare ailleurs.
        '<button type="button" class="pkdx-touche" id="pk-rival-sac">' + T("arenePreparer") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-rival-sac").addEventListener("click", function () {
      son("PRESS_AB");
      ecranSac(function () { ecranRival(n); }, "retourRival");
    });
    racine.querySelector("#pk-rival-go").addEventListener("click", function () {
      P().croiserRival(partie);
      var adverse = equipe.map(function (x) { return M().creer(x.n, x.niveau, hasard); });
      var sacRi = soinsDeDresseur(partie.acte);
      lancerCombat(adverse, { dresseur: true, gain: 200 + partie.acte * 180, rival: true,
        soins: sacRi.n, soin: sacRi.objet });
    });
  }

  // ── Les cadeaux ────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE DOJO — LE MÊME GABARIT QUE LE FOSSILE, PARCE QUE C'EST LE MÊME GESTE
  //
  //  🔴 ON MONTRE LES DEUX CRÉATURES, leurs types et leur niveau. C'est la
  //     leçon du fossile, payée une fois : qui ne connaît pas la première
  //     génération par cœur tranchait à l'aveugle sur un choix définitif.
  //  ⚠️ Pas de classe neuve : `pkdx-fossiles` / `pkdx-fossile` habillent déjà
  //     exactement ce couple de cartes, et une classe sans style est refusée
  //     par le détecteur — à raison.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranDojo() {
    if (!O().dojoOuvert(partie)) return message(T("nDojo"), T("aDojoFait"));
    var choix = O().choixDojo();
    coque(
      '<p class="pkdx-surtitre">' + T("nDojo") + "</p>" +
      '<h1 class="pkdx-titre">' + T("aDojo") + "</h1>" +
      '<p class="pkdx-dit">' + T("dojoChoix") + "</p>" +
      '<div class="pkdx-fossiles">' + choix.map(function (c) {
        var e = ESP()[c.n];
        return '<button type="button" class="pkdx-fossile" data-dojo="' + c.n + '"' +
            W.PokeType.attr(e.types[0]) + ">" +
          '<img alt="" src="assets/img/poke/art/' + c.n + '.webp"' +
            ' onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(c.n, "?i=6") + '\'">' +
          "<b>" + esc(e.nom[LANG()]) + "</b>" +
          '<span class="pkdx-fossile-types">' +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") + "</span>" +
          '<span class="pkdx-niveau">' + W.PokeGenre.niveau(c.niveau) + "</span>" +
        "</button>";
      }).join("") + "</div>"
    );
    surClic("[data-dojo]", function (ev) {
      var n = +ev.currentTarget.getAttribute("data-dojo");
      var r = O().prendreDojo(partie, n, hasard);
      if (!r.ok) return message(T("nDojo"), T("aDojoFait"));
      var e = ESP()[r.mon.n];
      var perdu = r.laisse ? ESP()[r.laisse] : null;
      son("GET_KEY_ITEM");
      W.setTimeout(function () { criDe(r.mon.n); }, 700);
      coque(
        '<p class="pkdx-surtitre">' + T("nDojo") + "</p>" +
        '<h1 class="pkdx-titre">' + T("dojoTitre", { nom: esc(e.nom[LANG()]) }) + "</h1>" +
        '<div class="pkdx-prise">' +
          '<figure class="pkdx-prise-art">' +
            '<img alt="' + esc(e.nom[LANG()]) + '" src="assets/img/poke/art/' + r.mon.n + '.webp"' +
              ' onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(r.mon.n, "?i=6") + '\'">' +
          "</figure>" +
          '<dl class="pkdx-prise-releve">' +
            "<div><dt>" + T("priseNiveau") + "</dt><dd>" + r.mon.niveau + "</dd></div>" +
            "<div><dt>" + T("priseTypes") + "</dt><dd>" +
              e.types.map(function (t) { return W.PokeType.pastille(t); }).join(" ") + "</dd></div>" +
            // 🔴 CE QU'ON LAISSE SE DIT. C'est ce qui donne son poids au choix,
            //    et c'est la dernière occasion de le nommer.
            (perdu ? "<div><dt>" + T("dojoLaisse") + "</dt><dd>" +
              esc(perdu.nom[LANG()]) + "</dd></div>" : "") +
          "</dl>" +
        "</div>" +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
        "</div>"
      );
      racine.querySelector("#pk-suivant").addEventListener("click", carte);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE MUSÉE — ON OUVRE UNE DETTE, ON NE REÇOIT PAS UN POKÉMON
  //
  //  🔴 ET L'ÉCRAN LE DIT. Ramasser un caillou à l'acte 1 sans savoir ce qu'il
  //     deviendra six actes plus tard, c'est un objet de plus dans le sac ; on
  //     montre donc la SILHOUETTE de ce qui dort dedans, et on nomme la machine
  //     qui le réveillera. C'est ce qui transforme un ramassage en promesse.
  //  ⚠️ Une silhouette, pas l'artwork : le nom se garde pour la ranimation.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranMusee() {
    var r = O().prendreAmbre(partie);
    if (!r.ok) return message(T("nMusee"), T("aMuseeFait"));
    var n = W.POKE_AMBRE.n;
    son("GET_KEY_ITEM");
    coque(
      '<p class="pkdx-surtitre">' + T("nMusee") + "</p>" +
      '<h1 class="pkdx-titre">' + T("museeTitre") + "</h1>" +
      '<p class="pkdx-dit">' + T("museeDit") + "</p>" +
      '<div class="pkdx-prise">' +
        '<figure class="pkdx-prise-art">' +
          '<img alt="" data-etat="inconnu" src="' + W.PokeSprites.face(n, "?i=6") + '">' +
        "</figure>" +
        '<dl class="pkdx-prise-releve">' +
          "<div><dt>" + T("museeQui") + "</dt><dd>———</dd></div>" +
          "<div><dt>" + T("priseNiveau") + "</dt><dd>" + W.POKE_AMBRE.niveau + "</dd></div>" +
        "</dl>" +
      "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-suivant").addEventListener("click", carte);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA PENSION — ON PAIE LE CHAMPION DE CE SOIR POUR L'ACTE DE DEMAIN
  //
  //  🔴 L'ÉCRAN DIT LE COÛT AVANT LE CLIC, et il le dit en toutes lettres : le
  //     pensionnaire manque pour le Champion. Un nœud qui retire un membre
  //     d'équipe sans le dire serait un piège, pas un arbitrage.
  //  ⚠️ Même gabarit que le choix de cible du sac (`pkdx-liste` / `pkdx-etape`) :
  //     c'est la même question — « lequel des tiens ? » — et deux gabarits pour
  //     une même question finissent par diverger.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES JOURNAUX DU MANOIR — D'OÙ VIENT MEWTWO
  //
  //  🔴 `journalMewtwo: true` était posé sur Cramois'Île depuis le premier jour,
  //     et il n'y avait pas une ligne derrière. C'est la lore la plus connue de
  //     la première génération : le seul endroit du jeu qui EXPLIQUE le
  //     légendaire qu'on affrontera à l'épilogue.
  //
  //  🔴 ET ILS DONNENT QUELQUE CHOSE. Un décor qui ne fait que raconter est
  //     joli ; ici la lecture INSCRIT Mew et Mewtwo au Pokédex comme « vus » —
  //     ce qui est exactement ce que fait un carnet qui les nomme. Voir n'est
  //     pas avoir : les deux cases restent à remplir, mais elles existent.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranJournal() {
    if (partie.journalLu) return message(T("nJournal"), T("aJournalLu"));
    partie.journalLu = true;
    P().voir(partie, 150);
    P().voir(partie, 151);
    son("GET_KEY_ITEM");
    coque(
      '<p class="pkdx-surtitre">' + T("nJournal") + "</p>" +
      '<h1 class="pkdx-titre">' + T("journalTitre") + "</h1>" +
      '<ol class="pkdx-journal">' +
        [1, 2, 3, 4].map(function (i) { return "<li>" + T("journal" + i) + "</li>"; }).join("") +
      "</ol>" +
      '<p class="pkdx-dit">' + T("journalDit") + "</p>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-suivant").addEventListener("click", carte);
  }

  function ecranPension() {
    if (partie.pension) return message(T("nPension"), T("aPensionPleine"));
    if ((partie.equipe || []).length < 2) return message(T("nPension"), T("aPensionSeul"));
    coque(
      '<p class="pkdx-surtitre">' + T("nPension") + "</p>" +
      '<h1 class="pkdx-titre">' + T("pensionTitre") + "</h1>" +
      '<p class="pkdx-dit">' + T("pensionDit") + "</p>" +
      '<ul class="pkdx-liste">' + partie.equipe.map(function (m, k) {
        var e = ESP()[m.n];
        return '<li class="pkdx-etape">' +
          '<button type="button" class="pkdx-touche" data-pension="' + k + '">' +
            esc(m.surnom || e.nom[LANG()]) + " " + W.PokeGenre.niveau(m.niveau) + "</button>" +
          '<span class="pkdx-cout">' + m.pv + " / " + m.stats.pv + "</span></li>";
      }).join("") + "</ul>" +
      '<p class="pkdx-dit est-note">' + esc(T("pensionPrix", { n: P().PENSION_PRIX })) + "</p>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche" id="pk-pension-non">' + T("retour") + "</button>" +
      "</div>"
    );
    surClic("[data-pension]", function (ev) {
      var k = +ev.currentTarget.getAttribute("data-pension");
      var nom = esc(partie.equipe[k].surnom || ESP()[partie.equipe[k].n].nom[LANG()]);
      var r = P().pensionDepot(partie, k);
      if (!r.ok) return message(T("nPension"), T("aPensionPleine"));
      son("GET_KEY_ITEM");
      message(T("nPension"), T("pensionLaisse", { nom: nom }), carte);
    });
    racine.querySelector("#pk-pension-non").addEventListener("click", carte);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ET IL REVIENT. `pensionReprise` a déjà tout fait dans le moteur — l'écran
  //  ne fait que RACONTER, et il enchaîne les montées avec la même fonction que
  //  les combats : sans elle, un Pokémon rentré au niveau d'évoluer resterait
  //  bloqué à sa forme d'avant, sans que rien ne le dise.
  // ═══════════════════════════════════════════════════════════════════════════
  function jouerRetourPension(apres) {
    var r = partie.pensionRetour;
    if (!r) return apres();
    partie.pensionRetour = null;
    var mon = r.mon;
    var nom = esc(mon.surnom || ESP()[mon.n].nom[LANG()]);
    var dit = r.niveaux > 0
      ? T("pensionGagne", { n: r.niveaux, p: milliers(r.paye) }) +
        (r.paye < r.du ? " " + T("pensionDette", { p: milliers(r.paye) }) : "")
      : T("pensionRien");
    son("GET_ITEM_1");
    message(T("pensionRetour", { nom: nom }), dit, function () {
      if (!r.evenements.length) return apres();
      ecranMontees(r.evenements.map(function (ev) { return { mon: mon, ev: ev }; }), apres);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ŒUF — ON NE SAIT PAS CE QU'ON COUVE
  //
  //  🔴 SEPT ESPÈCES N'ONT PAS D'AUTRE PORTE (voir `prendreOeuf`). L'écran doit
  //     donc faire deux choses que le cadeau ne fait pas : dire ce qu'un œuf
  //     PEUT donner AVANT de l'ouvrir — un nœud annonce toujours ce qu'il
  //     contient, c'est la loi du mode — et ne rien promettre de précis.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranOeuf(n) {
    if (!O().oeufDisponible(partie, n.oeuf)) return message(T("nOeuf"), T("dejaFait"));
    var r = O().prendreOeuf(partie, n, hasard);
    if (!r.ok) return message(T("nOeuf"), T("dejaFait"));
    var mon = r.mon, e = ESP()[mon.n];
    var criDeLui = mon.n;
    son("GET_KEY_ITEM");
    W.setTimeout(function () { criDe(criDeLui); }, 700);
    coque(
      '<p class="pkdx-surtitre">' + T("nOeuf") + "</p>" +
      '<h1 class="pkdx-titre">' + T("oeufTitre", { nom: esc(e.nom[LANG()]) }) + "</h1>" +
      '<p class="pkdx-dit">' + T("oeufDit") + "</p>" +
      '<div class="pkdx-prise">' +
        '<figure class="pkdx-prise-art">' +
          '<img alt="' + esc(e.nom[LANG()]) + '" src="assets/img/poke/art/' + mon.n + '.webp"' +
            ' onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(mon.n, "?i=6") + '\'">' +
        "</figure>" +
        '<dl class="pkdx-prise-releve">' +
          "<div><dt>" + T("priseNiveau") + "</dt><dd>" + mon.niveau + "</dd></div>" +
          "<div><dt>" + T("priseTypes") + "</dt><dd>" +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join(" ") + "</dd></div>" +
        "</dl>" +
      "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-suivant").addEventListener("click", carte);
  }

  function ecranCadeau(n) {
    // ⚠️ L'ÉTAPE D'ABORD. Les cadeaux de Johto se posent sur une étape — deux
    //    au fond d'un donjon — et le nœud porte les deux champs : chercher par
    //    le seul lieu rendait une liste vide sur un nœud pourtant bien posé.
    var restants = O().cadeauxDe(partie, n.etape);
    if (!restants.length) restants = O().cadeauxDe(partie, n.lieu);
    if (!restants.length) return message(T("nCadeau"), T("dejaFait"));
    var r = O().prendreCadeau(partie, restants[0], hasard);
    if (!r.ok) return message(T("nCadeau"), T("dejaFait"));

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 « ÉVOLI, OFFERT. » — UNE LIGNE POUR LE POKÉMON LE PLUS MARQUANT DU
    //    JEU. C'était l'écran le plus nu du mode : un message dans une boîte,
    //    un bouton. Or recevoir Évoli n'est pas un ramassage d'objet — il
    //    ouvre TROIS espèces de plus par pierre, et le joueur repart avec une
    //    décision à préparer. On lui donne son écran, comme à la capture.
    // 🔴 ET ON DIT CE QU'IL OUVRE. Le moteur connaît ses évolutions par
    //    pierre : on les lit, on ne les écrit pas — trois noms tapés à la main
    //    seraient faux le jour où les données bougent.
    // ═══════════════════════════════════════════════════════════════════════
    var mon = r.mon, e = ESP()[mon.n];
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [22/08] CETTE LIGNE NE DISAIT QUE LES PIERRES.
    //     Rayhane, capture à l'appui : « Peut-être que ses autres évolutions
    //     ne sont juste pas liées à Évoli pour le moment. » Elles le sont —
    //     Mentali et Noctali arrivent par le bonheur, et cet écran les
    //     taisait. Trois joueurs en ont conclu qu'elles n'existaient pas.
    //  ⚠️ ON DIT AUSSI LA CONDITION : nommer Mentali sans dire « bonheur »
    //     laisserait chercher une sixième pierre qui n'existe pas.
    // ═══════════════════════════════════════════════════════════════════════
    var ouvre = (e.evolue || []).map(function (x) {
      var cond = x.par === "pierre" ? T("ouvreCondPierre", { o: nomObjet(x.objet) })
        : x.par === "niveau" || x.par === "stat" ? T("ouvreCondNiveau", { n: x.niveau })
        : x.par === "echange" ? T("ouvreCondEchange")
        : x.par === "bonheur" ? (x.moment === "jour" ? T("ouvreCondBonheurJour")
            : x.moment === "nuit" ? T("ouvreCondBonheurNuit") : T("ouvreCondBonheur"))
        : null;
      var esp = ESP()[x.vers];
      if (!esp || !cond) return null;
      return esc(esp.nom[LANG()]) + " (" + esc(cond) + ")";
    }).filter(Boolean);
    var criDeLui = mon.n;
    son("GET_KEY_ITEM");
    W.setTimeout(function () { criDe(criDeLui); }, 700);

    coque(
      '<p class="pkdx-surtitre">' + T("nCadeau") + "</p>" +
      '<h1 class="pkdx-titre">' + T("cadeauTitre", { nom: esc(e.nom[LANG()]) }) + "</h1>" +
      '<p class="pkdx-dit">' + T("cadeauDit") + "</p>" +
      '<div class="pkdx-prise">' +
        '<figure class="pkdx-prise-art">' +
          '<img alt="' + esc(e.nom[LANG()]) + '" src="assets/img/poke/art/' + mon.n + '.webp"' +
            ' onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(mon.n, "?i=6") + '\'">' +
        "</figure>" +
        '<dl class="pkdx-prise-releve">' +
          "<div><dt>" + T("priseNiveau") + "</dt><dd>" + mon.niveau + "</dd></div>" +
          "<div><dt>" + T("priseTypes") + "</dt><dd>" +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join(" ") + "</dd></div>" +
          (ouvre.length
            ? "<div><dt>" + T("cadeauOuvre") + "</dt><dd>" + ouvre.join(" · ") + "</dd></div>"
            : "") +
        "</dl>" +
      "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-suivant").addEventListener("click", carte);
  }

  // `apres` permet d'enchaîner plusieurs messages — les montées de niveau en
  // produisent souvent trois ou quatre d'affilée. Sans lui, chaque message
  // renvoyait sur la carte et les suivants disparaissaient.
  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE LE COMPTE TRANSPORTE — dit AVANT de partir (17/08, Darkjuampi)
  // ---------------------------------------------------------------------------
  //  « On ne peut pas récupérer sa Game sur pc quand on a commencé sur
  //  téléphone ? » Si — mais seulement avec un compte, et rien ne le disait.
  //  🔴 ET C'EST ICI QUE ÇA COMPTE LE PLUS. Mesuré en base le 16/08 : **13,6 %
  //     des parties Pokémon ont un compte**, contre 62 à 70 % dans les autres
  //     univers. Ce mode a un Pokédex de COMPTE qui se remplit sur des dizaines
  //     de voyages — et neuf joueurs sur dix le construisent sur un stockage de
  //     navigateur, sans filet.
  //  ⚠️ CETTE PAGE NE SAIT PAS CRÉER DE COMPTE : elle ne charge pas `game.js`.
  //     Le bouton renvoie donc au site avec `?go=compte`, une porte ouverte
  //     exprès de l'autre côté — sans elle, on retombait sur l'accueil.
  //  ⚠️ DEUX FOIS AU MAXIMUM, comme dans les autres univers : au premier départ,
  //     puis une fois quand la collection commence à valoir quelque chose.
  //  Rend `true` si l'écran a été montré (l'appelant s'arrête là).
  // ═══════════════════════════════════════════════════════════════════════════
  var CLE_GARDE_COMPTE = "poke_garde_compte";
  //  🔑 UNE SEULE FAÇON DE SAVOIR SI L'ON EST CONNECTÉ. La garde ci-dessous et
  //     le bouton de l'accueil posent la même question ; deux lectures du même
  //     jeton finiraient par ne plus dire la même chose.
  function connecte() {
    try { return !!W.localStorage.getItem("palmares_token"); } catch (e) { return false; }
  }
  function gardeDuCompte(reprendre) {
    if (connecte()) return false;
    var vu = 0;
    try { vu = Number(W.localStorage.getItem(CLE_GARDE_COMPTE) || 0) || 0; } catch (e) {}
    var pris = 0;
    try { pris = Object.keys((W.PokeProgression.lire().pris) || {}).length; } catch (e) {}
    // « De quoi perdre » : une collection déjà commencée pour de bon.
    if (vu >= 2 || (vu >= 1 && pris < 25)) return false;
    try { W.localStorage.setItem(CLE_GARDE_COMPTE, String(vu + 1)); } catch (e) {}
    coque(
      '<p class="pkdx-surtitre">' + T("compteT") + "</p>" +
      '<p class="pkdx-dialogue">' + esc(T("compteB")) + "</p>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-compte-oui">' + T("compteOui") + "</button>" +
        '<button type="button" class="pkdx-touche" id="pk-compte-non">' + T("compteNon") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-compte-oui").addEventListener("click", function () {
      son("PRESS_AB");
      W.location.href = "index.html?go=compte&retour=poke";
    });
    racine.querySelector("#pk-compte-non").addEventListener("click", function () {
      son("PRESS_AB");
      reprendre();
    });
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA MONTÉE DE NIVEAU SE MET EN SCÈNE — [20/08, polish]
  //  🔴 « Pikachu passe du niveau 14 au niveau 17 ! » dans une boîte d'une
  //     ligne, et un bouton. C'est le seul moment où l'équipe GRANDIT, et le
  //     brief dit que ce qui se gagne se met en scène. Même contrat que
  //     `message` (titre, texte, suite), plus la créature et les deux niveaux
  //     face à face — l'ancien barré, le nouveau en grand.
  //  ⚠️ Affichage seul : aucune donnée n'est lue ailleurs que dans `mon`/`ev`.
  // ═══════════════════════════════════════════════════════════════════════════
  function messageMontee(mon, avant, apresNiveau, texte, apres) {
    var nom = esc(mon.surnom || ESP()[mon.n].nom[LANG()]);
    coque(
      '<p class="pkdx-surtitre">' + T("nMontee") + "</p>" +
      '<div class="pkdx-montee">' +
        '<img alt="" src="' + W.PokeSprites.face(mon.n, "?i=6") + '">' +
        '<h1 class="pkdx-titre">' + nom + "</h1>" +
        '<p class="pkdx-montee-niveaux">' +
          '<span class="est-avant">' + esc(W.PokeGenre.niveau(avant)) + "</span>" +
          '<span class="est-fleche" aria-hidden="true">→</span>' +
          '<span class="est-apres">' + esc(W.PokeGenre.niveau(apresNiveau)) + "</span>" +
        "</p>" +
      "</div>" +
      '<p class="pkdx-dialogue">' + texte + "</p>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-suivant").addEventListener("click", function () { son("PRESS_AB"); apres(); });
  }

  function message(titre, texte, apres) {
    coque(
      '<p class="pkdx-surtitre">' + titre + "</p>" +
      '<p class="pkdx-dialogue">' + texte + "</p>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
      "</div>"
    );
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 `apres` NE DOIT RECEVOIR AUCUN ARGUMENT — signalement du 15/08 :
    //     l'écran du SAC affichait **« [object PointerEvent] »** en gros sous
    //     son titre. Cause : `addEventListener` passe l'événement au premier
    //     paramètre du gestionnaire, et `apres` est souvent une fonction de
    //     RENDU dont le premier paramètre est le message à afficher
    //     (`rendre(dit)` dans le sac). Le DOM remplissait donc la ligne d'alerte
    //     du sac avec un objet DOM, après une capsule enseignée ou un Super
    //     Bonbon — deux chemins, un seul défaut.
    //  ✅ ON COUPE À LA SOURCE, PAS AU CAS PAR CAS. Quatorze appels passent une
    //     fonction nommée ici ; les corriger un par un aurait laissé le
    //     quinzième rouvrir le défaut. Le contrat est « appelle la suite quand
    //     le joueur continue », pas « transmets-lui l'événement ».
    //  ⚠️ Qui a besoin de l'événement passe une fonction anonyme et le prend
    //     lui-même : c'est le cas de `surClic`, qui lit `e.currentTarget`.
    //     `tools/poke-evenement-fuite.mjs` tient la règle.
    // ═══════════════════════════════════════════════════════════════════════
    var suite = apres || carte;
    racine.querySelector("#pk-suivant").addEventListener("click", function () { suite(); });
  }

  // ── L'arène, et la Ligue ───────────────────────────────────────────────────
  //  Le boss ferme l'acte. Le battre ouvre le suivant ; le perdre laisse la
  //  carte en place — on peut réessayer, mais les branches restent perdues.
  function ecranArene(ordre) {
    if (ordre === null) return ecranLigue();
    var a = areneDe(ordre);
    if (!a) return carte();
    // 🔴 La pastille passe par la porte unique : la couleur du Champion et le
    //    nom de son type ne se séparent jamais.
    // ═══════════════════════════════════════════════════════════════════════
    //  L'ARÈNE — LE SOMMET DE L'ACTE, ET L'ÉCRAN LE PLUS PAUVRE DU MODE
    //
    //  🔴 IL MONTRAIT MOINS QUE LE NŒUD DE LA CARTE. Un titre, une pastille de
    //     type, une réplique, un bouton. Le nœud, lui, annonçait déjà l'équipe
    //     complète — on entrait donc dans l'arène en PERDANT de l'information,
    //     juste avant le combat qui décide de l'acte.
    //
    //  🔴 ET C'EST LE SEUL MOMENT OÙ L'ON PEUT ENCORE RECULER. Voir les
    //     niveaux et les types en face, c'est ce qui permet de renoncer pour
    //     aller se préparer — sinon le choix n'existe pas, on découvre en
    //     mourant. On montre donc l'équipe, le badge en jeu, et les essais
    //     qu'il reste.
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 CE QU'ILS FRAPPENT, PAS SEULEMENT CE QU'ILS SONT. L'écran donnait le
    //     type du Pokémon — Onix est ROCHE/SOL — et le joueur en déduisait ce
    //     qu'il allait PRENDRE. C'est faux, et c'est le piège classique de la
    //     première génération : un Onix niveau 14 frappe en NORMAL (Ligotage,
    //     Jet-Pierres n'arrive qu'après), et un type de créature ne dit rien
    //     des coups qu'elle porte. Le moteur connaît la liste exacte
    //     (`attaquesAuNiveau`, la même que celle qu'il donnera en combat) et
    //     l'écran n'en montrait rien.
    //  🔴 DES PASTILLES DE TYPE, PAS DES NOMS. Six Pokémon × quatre coups font
    //     vingt-quatre noms d'attaque : le mur de texte que je viens de retirer
    //     de la carte. Ce qui décide, c'est QUELS TYPES vont me toucher — et le
    //     mode a déjà une grammaire pour ça, la pastille. Dédoublonnée, elle
    //     tient en deux ou trois signes par créature.
    //  ⚠️ SEULEMENT LES COUPS QUI FONT DES DÉGÂTS. Rugissement n'a aucune
    //     efficacité de type ; l'afficher promettrait une menace qui n'existe
    //     pas, et diluerait celles qui existent.
    // ═══════════════════════════════════════════════════════════════════════
    var equipeVue = equipeDuChampion(a).map(function (x) {
      var e = ESP()[x.n];
      var frappe = typesFrappes(x);
      return '<span class="pkdx-troc-face">' +
        '<img alt="" loading="lazy" src="' + W.PokeSprites.face(x.n, "?i=6") + '">' +
        "<b>" + esc(e.nom[LANG()]) + "</b>" +
        '<span class="pkdx-troc-note">' + W.PokeGenre.niveau(x.niveau) + "</span>" +
        // ⚠️ ET LA PASTILLE SE NOMME. Posée seule sous une créature, elle se lit
        //    « son type » — c'est sa grammaire partout ailleurs dans le mode —
        //    et on annonçait donc un Onix de type NORMAL. Un mot suffit à
        //    retourner le sens ; sans lui, l'information est pire que son
        //    absence. Vu à l'écran, corrigé à l'écran.
        (frappe.length
          ? '<span class="pkdx-frappe"><i>' + T("frappeEn") + "</i>" +
              frappe.map(function (t) { return W.PokeType.pastille(t); }).join("") +
            "</span>"
          : "") +
      "</span>";
    }).join("");

    var essais = P().essaisRestants ? P().essaisRestants(partie) : null;

    coque(
      '<p class="pkdx-surtitre">' + T("arene", { nom: esc(a.nom[LANG()]) }) + "</p>" +
      // 🔴 LE CHAMPION AVAIT UN NOM ET PAS DE VISAGE. C'est l'écran le plus
      //    solennel d'un acte — celui où l'on décide d'y aller — et il se
      //    présentait comme une fiche. Sa silhouette vient de la désassemblée,
      //    au format de 1996, la même que les créatures.
      //  ✅ Et sa COULEUR (rework voyage 12/08) : l'en-tête prend l'horizon du
      //     type de l'arène — même langue que l'accueil et le combat.
      '<div class="pkdx-champion-tete"' + W.PokeType.attr(typeId(a.type)) + ">" +
        visage(VISAGE_ARENE()[a.ordre - 1], 88) +
        "<div>" +
          '<h1 class="pkdx-titre">' + esc(W.PokeGenre.nomChampion(a)) + "</h1>" +
          "<p>" + W.PokeType.pastille(typeId(a.type), { info: true, seule: true }) + "</p>" +
        "</div>" +
      "</div>" +
      '<p class="pkdx-dit">' + esc(W.PokeGenre.pour(W.POKE_SCENARIO.ARENES[a.ordre], "avant", null, "scenario:arene")) + "</p>" +
      '<div class="pkdx-adversaires">' + equipeVue + "</div>" +
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 CE QUI TUE LES VOYAGES ÉTAIT LE SEUL FAIT ABSENT. Mesuré sur 1 618
      //     affrontements : devant Erika et Koga, le joueur a l'avantage de
      //     niveau (+3,6) et ne gagne que 13 % du temps. La cause n'est pas la
      //     puissance, c'est l'ÉTAT — Rafflesia endort et empoisonne, Koga
      //     aligne quatre Poison. Une créature endormie ne joue pas.
      //     Et `PokeMesure.contre`, par construction, ne compte QUE les
      //     attaques qui font des dégâts : la menace la plus décisive de
      //     l'écran n'y figurait pas.
      //  🔴 ON DIT AUSSI CE QU'ON PORTE. « Il endort » sans « tu n'as aucun
      //     remède » laisse le joueur devant un fait sans conséquence : c'est
      //     l'écart entre les deux qui décide d'y aller ou de se préparer.
      // ═══════════════════════════════════════════════════════════════════════
      ditMenace(equipeDuChampion(a)) +
      ditFaiblesses(equipeDuChampion(a)) +
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 LE CHIFFRE QUI EXPLIQUAIT TOUT, ET QU'ON NE DISAIT PAS. Mesuré sur
      //    1 618 affrontements : à CHAQUE arène, exactement UN Pokémon sur six
      //    est au niveau du Champion — tête 44, médiane 9,7 devant Koga. Le
      //    bandeau montre six Pokémon ; cinq ne peuvent rien faire ici, et on
      //    entre en croyant avoir l'avantage du nombre.
      //    Ce n'est pas un réglage : c'est un fait qu'on cachait. On le dit,
      //    et le joueur décide d'y aller ou d'aller entraîner les autres.
      // ⚠️ On ne dit RIEN quand toute l'équipe tient : une ligne qui n'apparaît
      //    que dans le mauvais cas se remarque ; affichée toujours, elle devient
      //    un décor qu'on ne lit plus.
      (function () {
        var h = W.PokeMesure.aLaHauteur(partie.equipe, equipeDuChampion(a));
        if (!h || h.n >= h.sur) return "";
        var cle = h.sur === 1 ? "hauteurSeul" : h.n === 0 ? "hauteurAucun" : "hauteurPart";
        return '<p class="pkdx-dit est-alerte">' +
          esc(T(cle, { n: h.n, t: h.sur, a: h.haut, qui: esc(W.PokeGenre.nomChampion(a)) })) + "</p>";
      })() +
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 ET MAINTENANT, MON ÉQUIPE FACE À LA LEUR. Cet écran donnait tout de
      //    l'adversaire et rien de moi : pour décider, il fallait tenir de tête
      //    la table des dix-sept types, six contre quatre, et les attaques de
      //    chacun. Le moteur calcule tout ça à chaque coup porté — il ne le
      //    disait qu'APRÈS, quand l'essai est déjà consommé.
      // 🔴 DEUX FAITS, PAS UN CONSEIL. « Frappe fort » et « fragile » se
      //    déduisent des attaques réelles des deux camps ; on ne classe pas,
      //    on ne recommande personne, on ne dit pas par qui commencer. Ce qui
      //    est ORDINAIRE ne s'affiche pas : une pastille sur chaque ligne ne
      //    distinguerait plus rien.
      // ═══════════════════════════════════════════════════════════════════════
      (function () {
        var v = W.PokeMesure.contre(partie.equipe, equipeDuChampion(a), hasard.derive("mesure"));
        var lignes = v.map(function (x) {
          var e = ESP()[x.n];
          return '<li class="pkdx-mesure">' +
            '<img alt="" loading="lazy" src="' + W.PokeSprites.face(x.n, "?i=6") + '">' +
            '<b>' + esc(e.nom[LANG()]) + "</b>" +
            verdictHtml(x, nomAttaque) +
          "</li>";
        }).join("");
        if (!lignes) return "";
        return '<h2 class="pkdx-soustitre">' + T("vTitre") + "</h2>" +
          '<ul class="pkdx-mesures">' + lignes + "</ul>";
      })() +
      // Le badge en jeu : c'est la récompense, et elle a un nom.
      '<p class="pkdx-dit">' + T("areneEnJeu", { badge: esc(W.PokeGenre.nomBadge(a)) }) + " " +
        T("areneSoigne") + "</p>" +
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 CE QU'IL PORTE SE DIT AVANT, PAS PENDANT. Un Champion qui se soigne
      //    au quart de vie change complètement la façon de l'aborder : il faut
      //    frapper assez fort d'un coup, ou le vider de ses potions d'abord.
      //    Le découvrir en plein combat, c'est perdre un essai pour l'apprendre
      //    — et un boss n'en donne que trois. La loi du mode veut que ce qui
      //    s'annonce se pose ; ici c'est aussi ce qui rend le combat jouable.
      // ═══════════════════════════════════════════════════════════════════════
      (function () {
        var sac = soinsDeChampion(a.ordre);
        if (!sac.n) return "";
        var nomO = W.PokeRegles.nomObjet(sac.objet);
        return '<p class="pkdx-dit est-alerte">' +
          T("arenePorte", { n: sac.n, quoi: esc(nomO) }) + "</p>";
      })() +
      (essais !== null && essais < P().ESSAIS_BOSS
        ? '<p class="pkdx-dit est-alerte">' + T("koEssais", { n: essais }) + "</p>" : "") +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-defi">' + T("defier", { qui: esc(W.PokeGenre.nomChampion(a)) }) + "</button>" +
        // ═══════════════════════════════════════════════════════════════════
        // 🔴 SANS CE BOUTON, CONNAÎTRE LE TYPE DU CHAMPION NE SERT À RIEN.
        //    L'écran annonce depuis toujours l'équipe adverse et son type —
        //    et le joueur n'avait aucun moyen d'en faire quelque chose : ni
        //    soigner, ni employer une pierre, ni enseigner une capsule. Une
        //    information sur laquelle on ne peut pas agir n'est pas une
        //    information, c'est une décoration.
        //    C'est ici que la boucle se ferme : je vois du Poison en face,
        //    j'ouvre le sac, je donne Psyko à qui peut l'apprendre.
        // ═══════════════════════════════════════════════════════════════════
        '<button type="button" class="pkdx-touche" id="pk-arene-sac">' + T("arenePreparer") + "</button>" +
        // 🔴 RECULER EST UN CHOIX, PAS UN ÉCHEC. Sans ce bouton, entrer sur le
        //    nœud de l'arène engageait déjà le combat : le joueur voyait
        //    l'équipe adverse et n'avait plus qu'à la subir.
        '<button type="button" class="pkdx-touche" id="pk-arene-retour">' + T("retourCarte") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-arene-retour").addEventListener("click", function () {
      // 🔴 LE NŒUD EST DÉJÀ CONSOMMÉ QUAND CET ÉCRAN S'AFFICHE. `choisirNoeud`
      //    appelle `prendreNoeud` — qui avance la rangée — AVANT de router
      //    ici. Reculer sans rouvrir le nœud laisserait donc une carte dont
      //    l'arène est « prise » et l'acte non franchi : exactement le blocage
      //    dur réparé cette nuit, que je venais de recréer en ajoutant ce
      //    bouton. Trouvé en me demandant ce que « retour » veut dire quand la
      //    rangée a déjà bougé.
      son("PRESS_AB");
      P().revenirAuNoeud(partie);
      carte();
    });
    // Le sac s'ouvre SUR PLACE : on revient à l'arène, le nœud n'a pas bougé.
    racine.querySelector("#pk-arene-sac").addEventListener("click", function () {
      son("PRESS_AB");
      ecranSac(function () { ecranArene(ordre); }, "retourArene");
    });
    racine.querySelector("#pk-defi").addEventListener("click", function () {
      for (var k = 0; k < partie.equipe.length; k++) M().soigner(partie.equipe[k]);
      // 🔴 LE SERMENT DE LA CHASSE ET CELUI DU DÉFI SE PAIENT ICI, ET NULLE
      //    PART AILLEURS. Ils annoncent des Champions plus forts : la seule
      //    façon honnête de le tenir est de MONTER LEUR NIVEAU à la création
      //    de leur équipe. Un malus posé sur le joueur aurait dit la même
      //    chose et fait autre chose.
      // ⚠️ Le niveau se plafonne à 100 — un empilement de serments de défi
      //    dépasserait sinon la borne du moteur, qui ne calcule pas au-delà.
      //  🔴 LA BASE DU CANON MONTE, GRADUÉE PAR ACTE — voir
      //     `PokeActes.monteeChampion` pour les mesures qui l'ont tranchée.
      //     Elle S'AJOUTE aux sceaux et aux serments, elle ne les remplace pas.
      // 🔴 LA MEME PORTE QUE L'AFFICHAGE. Deux calculs, c'est un ecran qui ment.
      var eq = equipeDuChampion(a).map(function (x) {
        return M().creer(x.n, x.niveau, hasard);
      });
      for (var j = 0; j < eq.length; j++) P().voir(partie, eq[j].n);
      var sac = soinsDeChampion(a.ordre);
      lancerCombat(eq, { dresseur: true, arene: a, soins: sac.n, soin: sac.objet });
    });
  }

  // 🔴 CINQ COMBATS, AUCUN SOIN ENTRE EUX. C'est la règle canon, et le texte le
  //    dit AVANT — une règle dure qu'on découvre en la subissant se lit comme
  //    un bug.
  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUI TUE LES VOYAGES, DIT AVANT LE COMBAT — ARÈNE ET LIGUE
  //
  //  🔴 Mesuré sur 1 618 affrontements : devant Erika le joueur a +3,6 niveaux
  //     et gagne 13 % du temps. Ce n'est pas la puissance, c'est l'ÉTAT — une
  //     créature endormie ne joue pas. Et `PokeMesure.contre`, par
  //     construction, ne compte QUE les attaques qui font des dégâts : la
  //     menace la plus décisive de l'écran n'y figurait pas.
  //  🔴 ON DIT AUSSI CE QU'ON PORTE. « Il endort » sans « tu n'as aucun
  //     remède » laisse un fait sans conséquence : c'est l'ÉCART entre les deux
  //     qui décide d'y aller ou de se préparer.
  //  ⚠️ UNE SEULE PORTE POUR LES DEUX ÉCRANS. L'arène et la Ligue posent la
  //     même question ; deux rendus finiraient par ne plus dire la même chose.
  //     Et à la Ligue, elle pèse plus lourd encore : on y enchaîne cinq combats
  //     SANS SOIN, et Agatha inflige à elle seule confusion, sommeil et
  //     paralysie.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PLAFOND DE L'ACTE — LE NIVEAU DU CHAMPION QUI LE FERME
  //
  //  🔴 IL NE VAUT QUE SI LE SERMENT DU PLAFOND EST JURÉ. Sans lui, on rend 0
  //     et `appliquerExperience` retombe sur sa borne de toujours, 100 : le
  //     voyage de tous les autres joueurs ne bouge pas d'un point.
  //  🔴 LE PLAFOND SUIT LE CHAMPION, PAS UNE TABLE ÉCRITE À CÔTÉ. C'est le
  //     niveau le plus haut de son équipe, augmenté de ce que les sceaux et
  //     serments lui donnent (`bossNiveau`) — sinon un sceau qui muscle les
  //     Champions rendrait le plafond plus bas qu'eux, ce qui est absurde.
  //  ⚠️ À la Ligue, il n'y a pas de Champion d'acte : le plafond se lève. Le
  //     Conseil 4 est le sommet, on n'y arrive pas bridé.
  //  🔴 LA RÈGLE A DÉMÉNAGÉ DANS `actes.js`, ET LE SERMENT N'EST PLUS LA
  //     CONDITION D'EXISTENCE DU PLAFOND — il n'en est plus que le RÉGLAGE.
  //     Sans serment il n'y avait AUCUNE borne, et le joueur arrivait +17 au
  //     dessus du dernier Champion.
  //  ⚠️ ELLE NE COMPOSE PLUS RIEN ELLE-MÊME. Le 16/08, cette composition-ci
  //     était la SEULE, et elle vivait dans l'interface : le sac et la Pension
  //     ne pouvaient pas la poser, donc ils passaient à côté du plafond — le
  //     Super Bonbon rendait 36 niveaux d'un coup. La règle est descendue dans
  //     `PokeActes.plafondPour`, et cet écran la lit comme tout le monde.
  function plafondDeLActe() {
    return partie ? W.PokeActes.plafondPour(partie) : 0;
  }

  function ditMenace(equipeAdverse) {
    if (!W.PokeMesure || !W.PokeMesure.menaces) return "";
    var m = W.PokeMesure.menaces(equipeAdverse, hasard);
    if (!m.length) return "";
    var r = W.PokeMesure.remedes(partie.sac);
    return '<p class="pkdx-menace' + (r ? "" : " est-alerte") + '">' +
      esc(T("areneEtats", { quoi: m.map(function (x) { return T("etat_" + x); }).join(", ") })) +
      " " + esc(r ? T("areneRemedes", { n: r }) : T("areneSansRemede")) + "</p>";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE L'ÉQUIPE D'EN FACE CRAINT — L'AUTRE MOITIÉ DE LA QUESTION
  //
  //  🔴 L'ÉCRAN D'ARÈNE DIT CE QUE LE CHAMPION FRAPPE, JAMAIS CE QU'IL CRAINT.
  //     Il annonce « frappe en PSY » pour les quatre Pokémon de Morgane — et un
  //     joueur qui ne connaît pas la table de 1996 n'en tire rien. Or c'est là
  //     que se décide le combat : mesuré le 09/08 en politique compétente,
  //     Morgane est LE mur du mode, à 15 % de victoires.
  //  🔴 ET LA PREMIÈRE GÉNÉRATION POSE UN PIÈGE : le Spectre ne fait RIEN au
  //     Psy — c'est le défaut de table le plus célèbre du ROM, et le mode le
  //     garde parce que le canon est sa loi. Un joueur qui amène un Spectre
  //     contre Morgane perd. La ligne dit donc ce qui MARCHE, comptes à
  //     l'appui, plutôt que de laisser deviner.
  //  ⚠️ On compte SUR COMBIEN DE MEMBRES le type est efficace : une équipe
  //     mixte n'a pas une réponse, elle en a plusieurs, inégales. « Insecte
  //     (3 sur 4) » décide ; « Insecte » tout court ne dit pas si ça vaut le
  //     détour.
  //  ⚠️ Aucune table recopiée : `PokePokedex.rapports` est la porte qui sert
  //     déjà aux infobulles.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'UNE CLÉ OUVRE — DIT AU MOMENT OÙ ON LA REÇOIT
  //
  //  🔴 LES OBJETS-CLÉS N'AVAIENT AUCUNE DESCRIPTION. Vérifié : `PokeDits.objet`
  //     rend une chaîne vide pour le Vélo, le Scope Sylphe, la Carte Magnétique
  //     et la Clé Ascenseur — et les CS ne sont même pas dans `POKE_OBJETS`.
  //     Or dans ce mode, un objet-clé n'a QU'UNE fonction : ouvrir des étapes.
  //     Le joueur recevait « CS05 Flash » et repartait sans savoir à quoi ça
  //     sert. C'est la classe n°1 du dossier, sur les objets dont c'est toute
  //     la raison d'être.
  //  🔴 ET LE JEU LE SAIT DÉJÀ : chaque étape porte son `exige`. On lit donc la
  //     donnée à l'envers — « qui réclame cette clé ? » — plutôt que d'écrire
  //     une seconde table qui divergerait au premier verrou déplacé.
  //  ⚠️ Même formule que le cadeau d'Évoli, « IL OUVRE » : deux écrans qui
  //     annoncent la même chose doivent l'annoncer de la même façon.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 LES QUATRE CLÉS SANS VERROU (la table du détecteur `poke-cles-mortes`,
  //     côté lecteur) : à la place d'une ligne vide, chacune dit sa vérité.
  //     `poke-cles-mortes` vérifie que les deux tables restent le même monde —
  //     une clé sans verrou ni phrase redevient rouge.
  var SANS_VERROU_DIT = { vol: "cleRienVol", velo: "cleRienVelo", carte: "cleRienCarte",
                          dentOr: "cleRienDentOr" };

  function ditOuvre(cles) {
    if (!cles || !cles.length || !ETAPES()) return "";
    var lieux = [];
    for (var i = 0; i < cles.length; i++) {
      for (var j = 0; j < ETAPES().length; j++) {
        var e = ETAPES()[j];
        if ((e.exige || []).indexOf(cles[i]) < 0) continue;
        var nom = lieuNom(e.lieu);
        if (nom && lieux.indexOf(nom) < 0) lieux.push(nom);
      }
    }
    if (!lieux.length) {
      //  Une seule clé à la fois n'a pas de verrou ET une phrase : le sac les
      //  liste une par une, c'est là que la ligne se lit.
      for (var s = 0; s < cles.length; s++) {
        if (SANS_VERROU_DIT[cles[s]]) {
          return '<p class="pkdx-ouvre">' + esc(T(SANS_VERROU_DIT[cles[s]])) + "</p>";
        }
      }
      return "";
    }
    return '<p class="pkdx-ouvre">' + esc(T("cleOuvre")) + " " +
      '<b>' + esc(lieux.join(" · ")) + "</b></p>";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉTAT DE L'ÉQUIPE, SUR LA CARTE — CE QUI DÉCIDE DU PROCHAIN NŒUD
  //
  //  🔴 LA CARTE NE MONTRAIT PAS LES PV. Elle annonce ce que chaque nœud
  //     contient, le niveau des adversaires, le Champion au bout — et rien de
  //     l'état de celui qui va s'y engager. Pour savoir s'il pouvait prendre un
  //     dresseur ou s'il devait viser le Centre, le joueur devait OUVRIR
  //     l'écran d'équipe, revenir, puis choisir.
  //     Dans un roguelite, les points de vie sont la première entrée de la
  //     décision : les cacher derrière un bouton, c'est cacher la moitié du
  //     choix sur l'écran qui existe pour choisir.
  //  ⚠️ UNE BANDE, PAS UN PANNEAU. Six médaillons et six barres fines : ça
  //     tient sur une ligne au téléphone comme au bureau, et ça ne repousse pas
  //     la rangée jouable — déjà à 347 px du haut sur un écran de 844.
  //  ⚠️ Aucun composant neuf : la barre est `.pkdx-barre`, la même que les PV
  //     du combat et la chasse, avec sa mécanique de remplissage par
  //     transformation. Un second dessin de barre aurait divergé.
  // ═══════════════════════════════════════════════════════════════════════════
  function ditEquipe() {
    var eq = (partie && partie.equipe) || [];
    if (!eq.length) return "";
    return '<ul class="pkdx-bande-equipe">' + eq.map(function (m) {
      var e = ESP()[m.n];
      var max = (m.stats && m.stats.pv) || 1;
      var part = Math.max(0, Math.min(1, m.pv / max));
      // Le seuil est celui du combat : on ne réapprend pas à lire une barre.
      var niveau = part <= 0 ? "zero" : part <= 0.2 ? "bas" : part <= 0.5 ? "moyen" : "haut";
      return '<li class="pkdx-bande-mon"' + W.PokeType.attr(e.types[0]) +
          ' data-niveau="' + niveau + '"' +
          ' title="' + esc(nomDe(m)) + " " + T("aNiveau", { a: m.niveau }) +
            " · " + Math.round(m.pv) + "/" + max + '">' +
        '<img alt="" loading="lazy" src="' + W.PokeSprites.face(m.n, "?i=6") + '">' +
        // 🔴 LE NIVEAU, PAS SEULEMENT LES PV. Chaque adversaire de la carte
        //    affiche le sien (« N.9 », « N.14 ») — les miens ne l'affichaient
        //    nulle part sur cet écran. La comparaison qui décide d'un détour
        //    demandait d'ouvrir l'équipe, retenir, revenir. Même clé `aNiveau`
        //    que partout : jamais deux façons de dire niveau.
        '<span class="pkdx-bande-niv">' + T("aNiveau", { a: m.niveau }) + "</span>" +
        '<span class="pkdx-barre pkdx-bande-pv"><i style="--part:' + part.toFixed(3) + '"></i></span>' +
      "</li>";
    }).join("") + "</ul>";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA MEILLEURE ARME DE CHAQUE TYPE, LUE DANS LES ATTAQUES
  //
  //  🔴 CALCULÉE, JAMAIS ÉCRITE. Une table de quinze puissances recopiée à la
  //     main serait fausse le jour où une attaque change — et elle divergerait
  //     en silence. On la dérive de `POKE_ATTAQUES`, la source du ROM.
  //  ⚠️ Une seule fois : la table ne bouge pas d'un écran à l'autre.
  // ═══════════════════════════════════════════════════════════════════════════
  var ARME_MINI = 50;   // la falaise mesurée entre l'Insecte (25) et le Poison (65)
  var meilleureArme = (function () {
    var cache = null;
    return function (type) {
      if (!cache) {
        cache = {};
        var liste = ATTL() || [];
        for (var i = 0; i < liste.length; i++) {
          var a = liste[i];
          if (!a.puissance) continue;
          if (!cache[a.type] || a.puissance > cache[a.type]) cache[a.type] = a.puissance;
        }
      }
      return cache[type] || 0;
    };
  })();

  function ditFaiblesses(equipeAdverse) {
    if (!W.PokePokedex || !W.PokePokedex.rapports || !equipeAdverse || !equipeAdverse.length) return "";
    var compte = {};
    for (var i = 0; i < equipeAdverse.length; i++) {
      var e = ESP()[equipeAdverse[i].n];
      if (!e) continue;
      var r = W.PokePokedex.rapports(e.types);
      if (!r || !r.faible) continue;
      for (var j = 0; j < r.faible.length; j++) {
        var t = r.faible[j].t || r.faible[j];
        compte[t] = (compte[t] || 0) + 1;
      }
    }
    var liste = [];
    for (var k in compte) liste.push({ t: k, n: compte[k] });
    if (!liste.length) return "";
    liste.sort(function (a2, b2) { return b2.n - a2.n; });
    var haut = liste[0].n;
    var gardes = liste.filter(function (x) { return x.n === haut; }).slice(0, 3);
    // 🔴 Si AUCUNE des faiblesses montrées n'a d'arme, on le dit. Tant qu'une
    //    seule en a une, le conseil reste suivable et la ligne n'a rien à
    //    ajouter — on ne met pas un avertissement sur un plan qui marche.
    var sansArme = gardes.every(function (x) { return meilleureArme(x.t) < ARME_MINI; });
    return '<p class="pkdx-craint">' + esc(T("areneCraint")) + " " +
      gardes.map(function (x) {
        // [20/08, polish] La pastille et son compte sont UNE information : au
        // retour à la ligne, le « 2 sur 2 » partait sous le type suivant.
        return '<span class="pkdx-craint-paire">' + W.PokeType.pastille(x.t) +
          '<span class="pkdx-craint-n">' +
            esc(T("areneCraintSur", { n: x.n, t: equipeAdverse.length })) + "</span></span>";
      }).join(" ") + "</p>" +
      (sansArme ? '<p class="pkdx-dit est-note">' + esc(T("areneSansArme")) + "</p>" : "");
  }

  function ecranLigue() {
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 CINQ ADVERSAIRES, UN SEUL TEXTE. La Ligue affichait « Cinq combats
    //    t'attendent » avant CHACUN des cinq — alors que `POKE_SCENARIO.LIGUE`
    //    porte une réplique par membre du Conseil 4, et la révélation du
    //    Champion : « Le Champion se retourne. C'est {rival}. » Cinq lignes
    //    écrites pour le sommet du jeu, jamais montrées.
    //    Le premier écran garde la règle dure — aucun soin entre les combats —
    //    et y ajoute ce que le rival est venu faire là.
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE VOYAGE SE GARDE ICI AUSSI — voir `garderLeVoyage`. C'est le seul
    //     autre instant du mode où aucun nœud n'est à moitié résolu, et la
    //     Ligue est le passage le plus long qu'on puisse perdre.
    //  ⚠️ ENTRE LES CINQ, JAMAIS AVANT LE PREMIER. À l'étape 0 le nœud vient
    //     d'être CONSOMMÉ par le clic et n'est pas encore rouvert : garder là
    //     déposerait une carte d'acte 9 sans nœud jouable. `revenirAuNoeud`
    //     tourne à chaque victoire de Ligue, donc dès l'étape 1 le nœud est
    //     rouvert et la reprise retombe dessus. Le premier combat, lui, est
    //     déjà couvert par la garde de la carte, juste avant.
    if (partie.ligueEtape) garderLeVoyage();
    var etape = partie.ligueEtape || 0;
    var c0 = CONSEIL()[etape];
    var L = W.POKE_SCENARIO.LIGUE, scR = W.POKE_SCENARIO.RIVAL;
    var nomR = esc(partie.rival || T("rivalSansNom"));
    // ═══════════════════════════════════════════════════════════════════════
    //  QUI CLÔT LA LIGUE — ET CE N'EST PAS PARTOUT LE RIVAL   [20/08/2026]
    //
    //  🔴 SIGNALÉ PAR UN JOUEUR : à Johto, le cinquième combat opposait le
    //     rival de KANTO, avec l'équipe de Kanto. Peter attendait dans les
    //     données depuis le premier jour, jamais lu par une seule ligne du jeu.
    //  ⚠️ UNE SEULE LECTURE, ICI. Trois endroits de cet écran disent qui vient
    //     — le titre, la réplique, la liste des cinq — et les laisser
    //     interroger chacun de leur côté est la façon dont ils finissent par ne
    //     plus dire la même chose. C'est déjà arrivé sur le niveau du Champion.
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    //  LA RÉPLIQUE D'UN MEMBRE DU CONSEIL   [20/08/2026]
    //
    //  🔴 SIGNALÉ PAR UN JOUEUR : « des incohérences sur les noms des champions
    //     de la ligue dans les descriptions ». Les cinq phrases de
    //     `POKE_SCENARIO.LIGUE` sont celles de 1996 — « Olga ouvre, la glace ne
    //     pardonne pas », « Agatha t'attend dans le noir ». À Johto, on les
    //     lisait devant Marion, Koga, Aldo et Marina : quatre noms annoncés,
    //     quatre autres en face. Le rang ne coïncidait même pas — Aldo est
    //     deuxième à Kanto et TROISIÈME à Johto.
    //  🔑 ON NE RÉÉCRIT PAS QUATRE PHRASES PAR MONDE. Une scène écrite ne vaut
    //     que si elle parle de qui est là : quand le monde a ses propres
    //     répliques, on les prend ; sinon on dit ce que les DONNÉES savent —
    //     le nom, et le type qu'il porte. C'est moins beau que 1996, et c'est
    //     vrai, ce qui vaut mieux qu'une belle phrase adressée à un absent.
    // ═══════════════════════════════════════════════════════════════════════
    function repliqueConseil(rang) {
      var ecrite = L["conseil" + (rang + 1)];
      var m = CONSEIL()[rang];
      if (!m) return "";
      //  🔑 LA PHRASE ÉCRITE SERT SI ELLE PARLE DE CELUI QUI EST LÀ, et c'est
      //     tout le test. Pas de clé de monde à interroger, pas de liste à
      //     tenir à jour : on demande à la phrase si elle nomme l'adversaire.
      //     Le jour où quelqu'un écrit les cinq répliques de Johto, elles
      //     seront prises sans qu'une ligne d'ici ne bouge.
      var siens = [m.nom, m.nomEn].filter(Boolean);
      if (ecrite) {
        var texte = ecrite[LANG()] || "";
        for (var q = 0; q < siens.length; q++) {
          if (texte.indexOf(siens[q]) >= 0) return esc(texte);
        }
      }
      var t = typeDominant(m);
      return esc(t
        ? T("ligueConseilType", { nom: W.PokeGenre.nomDresseur(m), type: W.PokeType.nom(t) })
        : T("ligueConseilNu", { nom: W.PokeGenre.nomDresseur(m) }));
    }
    //  Le type qu'un membre du Conseil porte vraiment : celui que son équipe
    //  répète le plus. Le déduire de l'équipe plutôt que de l'écrire à la main
    //  évite la seule faute possible ici — annoncer un type qu'il n'a pas.
    function typeDominant(m) {
      var compte = {}, haut = 0, gagnant = null;
      var eq = (m && m.equipe) || [];
      for (var i = 0; i < eq.length; i++) {
        var e = ESP()[eq[i].n];
        if (!e) continue;
        for (var k = 0; k < e.types.length; k++) {
          var t = e.types[k];
          compte[t] = (compte[t] || 0) + 1;
          if (compte[t] > haut) { haut = compte[t]; gagnant = t; }
        }
      }
      //  Une équipe bariolée n'a pas de type : mieux vaut ne rien dire que
      //  désigner celui qui se trouve en tête d'un compte à égalité.
      return haut >= 2 ? gagnant : null;
    }
    var maitre = (W.PokeRegles && W.PokeRegles.maitre && W.PokeRegles.maitre()) || null;
    var nomDernier = maitre ? esc(W.PokeGenre.nomDresseur(maitre)) : nomR;
    var dit, titre;

    if (!c0) {                                   // le dernier : c'est lui
      titre = nomDernier;
      //  À Kanto, la phrase EST le coup de théâtre — « le Champion se
      //  retourne, c'est ton rival ». Ailleurs, il n'y a rien à retourner :
      //  on annonce celui qui est là, sans lui voler sa scène.
      dit = maitre
        ? esc(T("ligueMaitre", { nom: nomDernier }))
        : W.PokeGenre.pour(L, "champion", { rival: nomR }, "scenario:ligue");
    } else if (etape === 0) {
      titre = T("nLigue");
      // 🔴 LA RÉPLIQUE DU PREMIER MEMBRE DU CONSEIL N'ÉTAIT JAMAIS MONTRÉE.
      //    `L["conseil" + (etape + 1)]` sert les étapes 1, 2 et 3 — donc Aldo,
      //    Agatha et Peter. L'étape 0 passe par cette branche-ci, qui donne la
      //    règle et la pique du rival : « Olga ouvre. La glace ne pardonne
      //    pas. » était écrite, portée par les données, et perdue.
      //    C'est pourtant le combat qu'on ENGAGE en pressant le bouton, et la
      //    seule des cinq répliques qui dise un TYPE — l'information qui décide
      //    de l'ordre d'équipe.
      dit = esc(L.entree[LANG()]) + " " + T("ligueSoigne") + " " +
        W.PokeGenre.pour(scR, "ligue", { rival: nomR }, "scenario:rival") +
        (repliqueConseil(0) ? " " + repliqueConseil(0) : "");
    } else {
      titre = esc(W.PokeGenre.nomDresseur(c0) || T("nLigue"));
      dit = repliqueConseil(etape) || esc(L.entree[LANG()]);
    }

    coque(
      '<p class="pkdx-surtitre">' + T(surMonde()) + "</p>" +
      '<h1 class="pkdx-titre">' + titre + "</h1>" +
      '<p class="pkdx-dit">' + dit + "</p>" +
      // Ce qu'ils portent se dit avant, comme à l'arène : la loi du mode veut
      // que ce qui s'annonce se pose, et ici c'est ce qui rend le combat
      // jouable — il faut frapper assez fort d'un coup.
      '<p class="pkdx-dit est-alerte">' + T("arenePorte", {
        n: 2, quoi: esc(W.POKE_OBJETS.HYPER_POTION ? W.POKE_OBJETS.HYPER_POTION.nom[LANG()] : "Hyper Potion"),
      }) + "</p>" +
      // ═══════════════════════════════════════════════════════════════════════
      //  QUI T'ATTEND — LE SOMMET DU VOYAGE S'ENGAGEAIT À L'AVEUGLE
      //
      //  🔴 L'ÉCRAN LE PLUS SOLENNEL DU MODE N'ANNONÇAIT AUCUN ADVERSAIRE.
      //     Cinq combats d'affilée, sans un soin entre eux, et l'écran disait
      //     seulement « cinq combats t'attendent ». L'écran d'arène, lui, donne
      //     le visage du Champion, son type, ses cinq Pokémon avec leurs
      //     niveaux, ses potions et les essais restants. La Ligue en donnait
      //     moins qu'une arène de début de partie.
      //  🔴 ET LA DONNÉE EXISTE DEPUIS TOUJOURS : `POKE_CONSEIL` porte les
      //     quatre équipes, et `equipeRival` la cinquième. Le jeu savait, il ne
      //     disait pas — sur le seul écran où l'on ne peut plus reculer.
      //  🔴 À L'ENTRÉE, LES CINQ ; ENSUITE, CELUI QU'ON AFFRONTE. Montrer les
      //     cinq avant chaque combat noierait celui d'en face ; ne montrer que
      //     lui à l'entrée cacherait ce qui rend la Ligue dure — c'est la SUITE
      //     qui tue, pas le premier.
      // ═══════════════════════════════════════════════════════════════════════
      (function () {
        var C = CONSEIL() || [];
        if (etape === 0) {
          var lignes = C.map(function (m) {
            var haut = 0, eqM = equipeDeLaLigue(m.equipe);
            for (var i = 0; i < eqM.length; i++) haut = Math.max(haut, eqM[i].niveau);
            return '<li class="pkdx-mesure">' +
              "<b>" + esc(W.PokeGenre.nomDresseur(m)) + "</b>" +
              '<span class="pkdx-mesure-notes">' +
                '<span class="pkdx-mesure-note">' + T("ligueEquipe", { n: m.equipe.length }) + "</span>" +
                '<span class="pkdx-mesure-note est-fort">' + T("ligueNiveau", { n: haut }) + "</span>" +
              "</span></li>";
          }).join("");
          lignes += '<li class="pkdx-mesure"><b>' + nomDernier + "</b>" +
            '<span class="pkdx-mesure-notes"><span class="pkdx-mesure-note">' + T("ligueDernier") + "</span></span></li>";
          // ═══════════════════════════════════════════════════════════════
          // 🔴 LA MESURE PORTE SUR LE PREMIER, PAS SUR TOUTE LA LIGUE. J'avais
          //    d'abord pris l'union des cinq équipes — vingt Pokémon — en me
          //    disant que sans soin entre les combats, c'est l'ensemble qu'il
          //    faut tenir. Vu à l'écran : CINQ LIGNES SUR SIX disaient
          //    « fragile ». Sur vingt adversaires, il s'en trouve toujours un
          //    qui vous frappe au double — le verdict devenait vrai partout,
          //    donc utile nulle part. C'est la loi du mode : ce qui est
          //    ordinaire ne se dit pas, et un mot qui sort toujours est du
          //    bruit.
          //    L'échelle des niveaux au-dessus dit déjà que la suite monte ;
          //    la mesure, elle, parle du combat qu'on engage MAINTENANT.
          // ═══════════════════════════════════════════════════════════════
          var v = W.PokeMesure.contre(partie.equipe, equipeDeLaLigue(C[0].equipe), hasard.derive("mesure"));
          var mesure = v.map(function (x) {
            var e = ESP()[x.n];
            return '<li class="pkdx-mesure">' +
              '<img alt="" loading="lazy" src="' + W.PokeSprites.face(x.n, "?i=6") + '">' +
              "<b>" + esc(e.nom[LANG()]) + "</b>" +
              verdictHtml(x, nomAttaque) + "</li>";
          }).join("");
          return '<h2 class="pkdx-soustitre">' + T("ligueQui") + "</h2>" +
            '<ul class="pkdx-mesures">' + lignes + "</ul>" +
            (mesure ? '<h2 class="pkdx-soustitre">' + T("ligueFace", { nom: esc(C[0].nom) }) + "</h2>" +
              '<ul class="pkdx-mesures">' + mesure + "</ul>" : "") +
            ditMenace(equipeDeLaLigue(C[0].equipe));
        }
        // Les combats suivants : l'équipe d'en face, comme à l'arène.
        // 🔴 SIGNALÉ PAR CHRIS LE 21/08 : « Peter a l'équipe du rival plutôt que
        //    la sienne ». L'ANNONCE retombait sur `equipeRival` pour le dernier
        //    adversaire, alors que le COMBAT lit `maitre` depuis le 20/08 — deux
        //    sources de vérité pour la même équipe, et c'est toujours celle qui
        //    est affichée qui ment. Le joueur préparait son équipe contre
        //    Farfuret, Nostenfer et Ectoplasma, et affrontait des Dracolosse.
        //  ⚠️ MÊME PORTE QUE LE COMBAT, à trois lignes près du même fichier :
        //    `maitre` d'abord, le rival seulement là où il n'y a pas de maître
        //    — c'est-à-dire à Kanto, où le Champion EST le rival.
        var mtrA = (W.PokeRegles && W.PokeRegles.maitre && W.PokeRegles.maitre()) || null;
        var eq = equipeDeLaLigue(c0 ? c0.equipe
          : (mtrA ? mtrA.equipe : (P().equipeRival(partie, P().rencontresRival() - 1) || [])));
        if (!eq.length) return "";
        return ditMenace(eq) + ditFaiblesses(eq) + '<div class="pkdx-adversaires">' + eq.map(function (x) {
          var e = ESP()[x.n];
          return '<span class="pkdx-troc-face">' +
            '<img alt="" loading="lazy" src="' + W.PokeSprites.face(x.n, "?i=6") + '">' +
            "<b>" + esc(e.nom[LANG()]) + "</b>" +
            '<span class="pkdx-troc-note">' + W.PokeGenre.niveau(x.niveau) + "</span></span>";
        }).join("") + "</div>";
      })() +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-ligue">' + T("defier", { qui: "" }).trim() + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-ligue").addEventListener("click", function () {
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 LA LIGUE PROMETTAIT « AUCUN SOIN ENTRE EUX » ET SOIGNAIT L'ÉQUIPE
      //     ENTIÈRE AVANT CHACUN DES CINQ. Mesuré par un QA : équipe descendue
      //     à 20 % de ses PV, clic sur DÉFIER, équipe à plein. La règle est
      //     écrite dans les données (`POKE_SCENARIO.LIGUE.entree`), répétée
      //     trois fois dans les commentaires de ce fichier comme « la règle
      //     dure » — et le code faisait exactement l'inverse, parce que cet
      //     écran se réaffiche entre chaque combat et que le soin y était posé
      //     sans condition.
      //     Ce n'était pas un réglage trop généreux : c'était une fausse règle
      //     apprise au joueur, sur le combat le plus important du mode.
      //
      //  ✅ ON SOIGNE À L'ENTRÉE, ET UNE SEULE FOIS. Entrer soigné est juste —
      //     c'est ce que fait l'arène, et le Centre qui précède la Ligue
      //     n'aurait aucun sens autrement. Ce qui doit être vrai, c'est
      //     l'ABSENCE de soin ENTRE les cinq, et c'est désormais le cas.
      //  ⚠️ La borne est `ligueEtape`, pas un drapeau à part : c'est déjà lui
      //     qui dit où l'on en est dans les cinq, et un second compteur pour la
      //     même question finirait par le contredire.
      // ═══════════════════════════════════════════════════════════════════
      if (!(partie.ligueEtape || 0)) {
        for (var k = 0; k < partie.equipe.length; k++) M().soigner(partie.equipe[k]);
      }
      var c = CONSEIL()[partie.ligueEtape || 0];
      // 🔴 LA VARIANTE ÉTAIT FIGÉE À ZÉRO. `POKE_RIVAL.champion[0]` donnait à
      //    TOUT LE MONDE l'équipe du rival parti avec Carapuce — quel que soit
      //    le starter du joueur, donc quel que soit le sien. Le combat le plus
      //    important du voyage opposait à la moitié des joueurs un adversaire
      //    qui n'était pas le leur, et rien ne pouvait le dire : six Pokémon
      //    plausibles, au bon niveau, simplement pas les bons.
      //    `equipeRival` lit la variante depuis `starterRival`, comme les sept
      //    rencontres précédentes. Une seule porte pour les huit.
      // 🔴 MÊME PORTE QUE L'AFFICHAGE JUSTE AU-DESSUS. C'est tout l'objet de
      //    `equipeDeLaLigue` : l'écran et le combat lisaient le canon nu, et
      //    le jour où l'un des deux montera sans l'autre, le mode aura rejoué
      //    « l'écran mentait sur le niveau du Champion » pour la troisième fois.
      // 🔴 ET LE CINQUIÈME N'EST PAS PARTOUT LE RIVAL — voir la note posée sur
      //    `maitre` dans `regles.js`. Sans cette lecture, un joueur de Johto
      //    affrontait au sommet de son voyage le rival de KANTO, avec son
      //    équipe de Kanto, pendant que Peter dormait dans les données.
      var mtr = (W.PokeRegles && W.PokeRegles.maitre && W.PokeRegles.maitre()) || null;
      var equipeDernier = mtr ? mtr.equipe : (P().equipeRival(partie, P().rencontresRival() - 1) || []);
      var brut = equipeDeLaLigue(c ? c.equipe : equipeDernier);
      var eq = brut.map(function (x) { return M().creer(x.n, x.niveau, hasard); });
      for (var j = 0; j < eq.length; j++) P().voir(partie, eq[j].n);
      // 🔴 LE CONSEIL 4 PORTE DES POTIONS, ET IL LES PORTAIT PAS. J'ai câblé le
      //    soin des dresseurs pour les huit arènes et j'ai oublié le SOMMET du
      //    mode — cinq combats d'affilée sans soin entre eux, et des
      //    adversaires qui encaissaient sans rien faire. Une mécanique livrée
      //    aux neuf dixièmes des cas est une mécanique qui manque là où elle
      //    compte le plus. Deux Hyper Potions chacun, comme Giovanni : c'est
      //    la Ligue, elle ne se joue pas en dessous du dernier Champion.
      // ═══════════════════════════════════════════════════════════════════
      //  LES CINQ S'ENCHAÎNENT — SANS REPASSER PAR LA CARTE (17/08)
      //
      //  🔴 SIGNALÉ PAR UN TESTEUR APRÈS SA PREMIÈRE LIGUE : « on peut se
      //     soigner entre les combats alors que je crois que c'était annoncé
      //     qu'on pouvait pas ». Il a raison, et l'écran le promet noir sur
      //     blanc deux lignes plus haut : **« Ton équipe entre soignée. Ce
      //     sera la dernière fois. »**
      //  🔴 LE SOIN AUTOMATIQUE AVAIT ÉTÉ FERMÉ, PAS LA PORTE. Le 15/08 on a
      //     retiré le soin posé à chaque ouverture de cet écran — mais après
      //     chaque victoire, `lancerCombat` retombe sur son défaut,
      //     `options.apres || carte`. Le joueur revenait donc sur la CARTE DE
      //     L'ACTE entre deux membres du Conseil, avec son sac, son équipe et
      //     tout ce qu'il faut pour se remettre à plein. La règle n'était pas
      //     contournée par une faute de calcul : elle n'avait simplement pas
      //     de porte fermée derrière elle.
      //  🔑 UNE RÈGLE ANNONCÉE QUI DÉPEND D'UN DÉFAUT N'EST PAS UNE RÈGLE.
      //     C'est la troisième fois de la semaine sur ce mode qu'un « par
      //     défaut » silencieux défait une promesse écrite à l'écran (le
      //     plafond du dernier acte, le Super Bonbon, ceci).
      //  ⚠️ ON N'ENCHAÎNE QUE SI L'ON A GAGNÉ CE COMBAT-CI, et on le mesure sur
      //     `ligueEtape`, qui n'avance qu'à la victoire. Router sur l'écran de
      //     Ligue sans cette garde aurait offert un nouvel essai gratuit à qui
      //     vient de perdre — l'inverse exact du durcissement recherché.
      // ═══════════════════════════════════════════════════════════════════
      var etapeAvant = partie.ligueEtape || 0;
      lancerCombat(eq, {
        dresseur: true, ligue: true, rival: !c, conseil: c || null,
        soins: 2, soin: "HYPER_POTION",
        apres: function () {
          if (!partie.fini && (partie.ligueEtape || 0) > etapeAvant) ecranLigue();
          else carte();
        },
      });
    });
  }

  // Le libellé du type vient de Poképédia en français ; l'identifiant de la
  // pastille vient de la table. On relie les deux par le nom, une seule fois.
  function typeId(nomFr) {
    var noms = W.POKE_TYPE_NOMS;
    for (var t in noms) if (noms[t].fr === nomFr || noms[t].en === nomFr) return t;
    return "normal";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  QUI EST EN FACE — UNE SEULE PORTE
  //
  //  🔴 Quatre sortes de dresseurs mènent à l'écran de combat : la route, les
  //     huit arènes, les cinq combats de la Ligue et le rival. Chacune sait
  //     déjà nommer son adversaire, et AUCUNE ne le transmettait. Écrire ce
  //     choix quatre fois garantissait qu'un cinquième appel l'oublie — le
  //     dossier a déjà payé cette classe (« une valeur composée que chaque
  //     appelant recompose »), donc elle se compose ici, une fois.
  //  ⚠️ Un sauvage n'a pas de nom : la phrase des hautes herbes reste celle du
  //     jeu d'origine, « Un Roucool sauvage apparaît ! ».
  // ═══════════════════════════════════════════════════════════════════════════
  function nomAdversaire(o) {
    if (!o || !o.dresseur) return "";
    if (o.arene) return W.PokeGenre.nomChampion(o.arene) || "";
    if (o.conseil) return W.PokeGenre.nomDresseur(o.conseil) || "";
    // 🔴 LE CHAMPION DE LA LIGUE N'EST LE RIVAL QU'À KANTO. C'est le coup de
    //    théâtre de 1996 — et à Johto c'est Peter, qui a son propre nom. Un
    //    joueur de Johto voyait donc son sommet porter le nom qu'il avait
    //    donné à son rival, sur une équipe qui n'était pas la sienne.
    if (o.rival) {
      var mtr = (W.PokeRegles && W.PokeRegles.maitre && W.PokeRegles.maitre()) || null;
      if (o.ligue && mtr) return W.PokeGenre.nomDresseur(mtr) || "";
      return partie.rival || "";
    }
    var meta = o.classe && W.POKE_CLASSES ? W.POKE_CLASSES[o.classe] : null;
    // ⚠️ Même porte que le nœud de la carte : la classe suit la langue.
    return meta ? (meta[LANG()] || meta.fr) : "";
  }

  function lancerCombat(adverse, options) {
    // 🔴 UN COMBAT NE S'OUVRE PAS SANS UN POKÉMON DEBOUT DE CHAQUE CÔTÉ
    //    (13/08). Vu à l'auto-joueur, sur v581 comme sur v582 : l'écran de
    //    combat montait sur une équipe vide et la page mourait — `.pv` d'un
    //    `undefined` à `resynchroniser`, plus aucun clic ne répondait. Le
    //    moteur le dit lui-même (`premierDebout` : « ce cas-là est une
    //    défaite, pas un choix ») mais aucune porte ne l'appliquait.
    //    Quelle que soit la faille d'amont qui a laissé cliquer, celle-ci est
    //    la DERNIÈRE porte : on route vers la carte — elle sait montrer la
    //    fin d'un voyage fini, le centre à une équipe à terre.
    var debout = false;
    for (var d = 0; d < partie.equipe.length; d++) {
      if (partie.equipe[d] && partie.equipe[d].pv > 0) { debout = true; break; }
    }
    if (!debout || !adverse || !adverse.length) { chaine = null; return carte(); }
    // 🔴 L'ESSAI DU JOUR MARQUE SON COMBAT AVANT DE L'OUVRIR — voir
    //    `marquerCombatEngage`. C'est ce marqueur, et lui seul, qui empêche de
    //    fermer l'onglet devant un combat qui tourne mal pour le rejouer.
    //    Il est posé APRÈS la garde du Pokémon debout : un combat qui ne
    //    s'ouvre pas n'est pas un combat engagé.
    marquerCombatEngage(options);
    var etat = C().demarrer(partie.equipe, adverse, {
      dresseur: !!options.dresseur,
      badges: P().badgesActifs(partie),
      zone: options.zone,
      // 🔴 LES SERMENTS ENTRENT DANS LE COMBAT PAR CETTE SEULE LIGNE. Le duel
      //    plus bas ne les reçoit PAS, et c'est la règle du mode : rien de ce
      //    qu'on a bâti dans un voyage ne pèse là où l'on se compare.
      serments: SERM(),
      // Ce que le dresseur d'en face porte. Zéro partout sauf aux arènes et à
      // la Ligue : voir `soinsDeChampion`.
      soins: options.soins || 0,
      soin: options.soin || "SUPER_POTION",
      // Le compte à rebours d'un errant. Absent partout ailleurs — voir
      // fuiteApres dans combat.js.
      fuiteApres: options.fuiteApres || 0,
    }, hasard);
    var jure = SERM();
    // 🔴 RETENU POUR LE GESTE RETOUR, et pour lui seul : c'est le seul écran du
    //    mode dont l'état ne survit pas à une sortie de page (voir
    //    `armerRetour`). Le duel, lui, tourne sans `partie` — le garde s'y tait.
    ecranCombat = new W.PokeUICombat.Ecran(hote("pk-combat"), etat, {
      // La vitesse du texte est un réglage du jeu depuis toujours — et elle sert
      // aussi à l'auto-joueur, qui ne lit pas.
      rythme: W.POKE_RYTHME || rythmeActuel(),
      hasard: hasard,
      partie: partie,
      journal: journal,
      // L'écran de combat n'en lit que deux clés — le sac et la fuite —, mais
      // il reçoit l'objet entier : lui passer deux booléens aurait obligé à
      // rouvrir les deux fichiers au premier serment qui ferme autre chose.
      serments: jure,
      // 🔴 CETTE FONCTION NE TRANSMET QUE CE QU'ELLE NOMME. J'ai posé
      //    `peche: true` sur l'appel et la phrase de pêche n'est jamais sortie :
      //    les options du COMBAT et celles de l'ÉCRAN sont deux objets
      //    distincts, et la seconde ne recopie que les clés listées ici. Une
      //    option ajoutée en amont disparaît donc en silence — elle ne lève
      //    rien, elle n'arrive pas.
      peche: !!options.peche,
      // ⚠️ MÊME PIÈGE QUE `peche` JUSTE AU-DESSUS : une option non nommée ici
      //    n'arrive pas à l'écran de combat. Le genre décide de la phrase —
      //    l'arbre tremble, le rocher se brise.
      arbre: options.arbre || null,
      // Le nom du dresseur d'en face. Décor pur : il ne touche pas `etat`.
      qui: nomAdversaire(options),
      surFin: function (issue) { finDeCombat(issue, etat, adverse, options); },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA TEXTURE DES COMBATS, RELEVÉE PAR LE JEU LUI-MÊME — 17/08/2026
  // ---------------------------------------------------------------------------
  //  🔴 POURQUOI LE JEU DOIT COMPTER ÇA, ET PAS LE SIMULATEUR. « C'est un peu
  //     trop simple » revient depuis des semaines (IHSÂN : « j'ai quasi tout OS
  //     avec mon dracaufeu et je me suis pas servi du reste »). Les trois passes
  //     de réglage ont TOUTES été pilotées par des taux de victoire — « as-tu
  //     battu l'arène ? ». Or un joueur ne dit jamais « je gagne trop souvent »,
  //     il dit « ça ne résiste pas » : deux grandeurs différentes.
  //     Et le seul instrument qui savait lire la seconde est le harnais — dont
  //     ce dossier a PROUVÉ qu'il mentait d'un facteur deux sur la fin de partie
  //     (41 % annoncés contre 94 % réels). Il joue plus mal que tous ceux qui se
  //     plaignent : sa texture n'est pas la leur.
  //  🔑 On ferme donc la boucle là où elle se ferme toujours dans ce dossier :
  //     sur les VRAIS joueurs. Quatre nombres, agrégés, sans un seul détail de
  //     partie — ils voyagent dans le résumé et `tools/poke-reel.mjs` les lit.
  //  ⚠️ ZÉRO TIRAGE, ZÉRO EFFET : on lit des compteurs que le moteur tient déjà
  //     (`etat.tour`, `etat.joueur.participants`). Le rejeu ne passe pas ici, et
  //     le barème du serveur ne lit pas ces champs — ils ne peuvent pas payer.
  //  ⚠️ RANGÉ PAR TYPE D'ADVERSAIRE : un sauvage écrasé en un coup est FIDÈLE à
  //     1996 (un starter évolué balaie la faune d'une route) ; un Champion qui
  //     tombe en un coup ne l'est pas. Confondre les deux, c'est durcir la route
  //     pour rien et laisser le boss mou — exactement ce qu'on a fait trois fois.
  // ═══════════════════════════════════════════════════════════════════════════
  function textureRelever(etat, options) {
    if (!partie || !etat) return;
    var cat = (options && options.arene) || (options && options.ligue) ? "boss"
      : (options && options.dresseur) ? "dresseur" : "sauvage";
    var t = partie.texture = partie.texture || {};
    var c = t[cat] = t[cat] || { n: 0, tours: 0, un: 0, eq: 0 };
    var tours = Math.max(0, Math.min(999, etat.tour || 0));
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 CE COMPTEUR N'A JAMAIS COMPTÉ  [trouvé le 20/08/2026]
    //
    //     `participants` est un OBJET indexé par place d'équipe
    //     (`e.joueur.participants[e.joueur.actif] = true`, `combat.js`). On le
    //     parcourait comme un TABLEAU : `part.length` vaut `undefined`, la
    //     boucle ne tourne pas une fois, et `engages` sortait à zéro — pour
    //     chaque combat, de chaque joueur, depuis la livraison du 17/08.
    //     Ni erreur ni valeur absurde : un zéro parfaitement plausible.
    //  🔴 ET IL A FAIT CONCLURE. `tools/poke-reel.mjs` lit ce champ sur les
    //     vrais voyages et annonçait « 0.0 Pokémon engagé(s) par boss :
    //     l'équipe ne sert pas » — un rouge permanent sur une mécanique qui va
    //     bien. Le simulateur, qui compte lui-même, disait 2,7 pour la même
    //     chose ; les deux chiffres se contredisaient sans que personne les
    //     mette côte à côte. *Un instrument qui ment coûte plus cher
    //     qu'aucun*, et celui-ci était le seul à parler des vrais joueurs.
    //  🔑 ON NE COMPTE PLUS ICI. `PokeCombat.combienOntCombattu` est la porte :
    //     `participants` appartient au moteur, sa forme aussi.
    // ═══════════════════════════════════════════════════════════════════════
    var engages = C().combienOntCombattu(etat.joueur);
    c.n++;
    c.tours += tours;
    if (tours <= 1) c.un++;
    c.eq += engages;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE COÛTE UNE DÉFAITE — UNE SEULE PORTE  [19/08/2026]
  //
  //  🔴 ELLE SORT DE `finDeCombat` PARCE QU'ELLE A UN SECOND APPELANT. Depuis
  //     que l'essai du jour se garde, un combat interrompu se solde en défaite
  //     AU RETOUR, sans combat sous la main. Recopier le prix là-bas aurait
  //     donné deux barèmes : celui du combat perdu et celui du combat quitté.
  //     Ils auraient divergé — c'est le motif le plus constant de ce mode, et
  //     il est écrit dix fois dans ce fichier.
  //  ⚠️ ELLE NE DÉCIDE PAS, ELLE APPLIQUE. L'appelant sait s'il était devant un
  //     Champion ; elle ne le devine pas.
  // ═══════════════════════════════════════════════════════════════════════════
  function solderDefaite(devantBoss) {
    var koRes = P().horsCombat(partie);
    // ── LE K.O. NE DOIT JAMAIS FERMER LA CARTE ─────────────────────────────
    // 🔴 PERDRE CONTRE UN CHAMPION BLOQUAIT LA PARTIE POUR DE BON : l'arène
    //    est la dernière rangée de l'acte, la rangée avançait quand même, et
    //    le joueur retombait sur une carte dont chaque nœud était consommé.
    //    Zéro bouton, zéro message, aucune sortie.
    //    On rouvre donc le nœud perdu — comme le jeu d'origine, où le
    //    Champion reste à sa place après un K.O. Le RESTE de l'acte demeure
    //    consommé : on ne revient pas gagner des niveaux, on le bat avec ce
    //    qu'on a. La moitié de l'argent est déjà partie ; c'est le prix.
    P().revenirAuNoeud(partie);
    // 🔴 Un essai devant un Champion se CONSOMME. Sans compteur, le nœud
    //    rouvert se rejoue indéfiniment dès que l'argent tombe à zéro — la
    //    partie devient injouable autrement : elle ne finit jamais.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 ET LE COMPTEUR NE COUVRAIT QUE LES CHAMPIONS. Le raisonnement
    //    ci-dessus vaut mot pour mot pour un dresseur ordinaire : le nœud
    //    se rouvre, l'argent tombe à zéro, la défaite ne coûte plus rien, et
    //    on rejoue le même combat sans fin. Avec les branches voisines
    //    désormais fermées, c'est même le SEUL nœud jouable — donc la boucle
    //    est garantie.
    //    Mesuré en jeu : une partie a enchaîné 899 K.O. et 901 retours à la
    //    carte dans le seul acte 5, jusqu'au plafond du harnais. Une partie
    //    qui ne peut pas se terminer est le même défaut qu'une partie
    //    bloquée, en plus lent — c'est écrit dans `partie.js`, et je ne
    //    l'avais appliqué qu'à moitié.
    // ═══════════════════════════════════════════════════════════════════════
    var essais = P().echouerDansLActe(partie);
    return {
      perdu: koRes.perdu,
      arene: !!devantBoss,
      reste: essais.reste,
      epuise: !!essais.fini,
    };
  }

  function finDeCombat(issue, etat, adverse, options) {
    // Le combat est fini : le geste retour n'a plus rien à protéger ici.
    ecranCombat = null;
    // 🔴 ET LE MARQUEUR D'ENGAGEMENT S'EFFACE ICI, quelle que soit l'issue —
    //    victoire, défaite, fuite ou capture. C'est le pendant exact de
    //    `marquerCombatEngage` : le combat a UNE issue, donc il n'est plus en
    //    suspens. La sauvegarde qui suit (à la carte) le portera sans marqueur.
    oublierCombatEngage();
    textureRelever(etat, options);
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE JACKPOT SE RAMASSE À LA FIN DU COMBAT, PAS SEULEMENT EN VICTOIRE.
    //     Posé d'abord dans la branche « victoire », il ne payait ni la fuite
    //     ni la capture — or on ramasse les pièces tombées dans les deux cas.
    //     Seule la défaite ne rapporte rien : on repart les poches vides.
    //  ⚠️ Le moteur accumule (`etat.jackpot`) et ne connaît pas la bourse ;
    //     l'écran verse, une fois, avec le même multiplicateur de serment que
    //     le gain d'un dresseur. Deux versements auraient fini par diverger.
    //  ⚠️ C'est la seule source d'argent du jeu qui ne passe pas par un
    //     dresseur — dans un mode où la bourse médiane de fin de voyage est de
    //     222 ₽, ce n'est pas du décor.
    // ═══════════════════════════════════════════════════════════════════════
    if (etat.jackpot && issue !== "defaite") {
      partie.argent += Math.round(etat.jackpot * SERM().argent);
    }
    // Ce que la victoire a déclenché, à montrer AVANT de repartir sur la carte.
    var montees = [];
    var captureAMontrer = null;
    var defaiteAMontrer = null;
    if (issue === "victoire") {
      //  🔑 PAR LA PORTE, comme la texture. C'était le SECOND comptage à la main
      //     de ce fichier ; l'autre s'était trompé de forme de donnée et rendait
      //     zéro depuis trois jours sans que rien ne le dise.
      var participants = C().combienOntCombattu(etat.joueur);
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 L'EXP.ALL, ET CE QU'ELLE RÉPARE. Mesuré au clic, devant Koga :
      //    « Florizarre N.43, Roucool N.5, Roucool N.3, Évoli N.25 ». UN
      //    Pokémon au niveau du Champion et trois poids morts — parce que le
      //    moteur applique la règle canon, celle qui ne donne d'expérience
      //    qu'aux COMBATTANTS. Fidèle, et ruineux dans un voyage de neuf actes :
      //    un Roucool attrapé au niveau 3 y reste jusqu'à la fin, et chaque
      //    capture devient un souvenir plutôt qu'un renfort.
      //    La première génération porte son propre remède, et il dormait dans
      //    nos données sans jamais être donné : l'EXP.ALL. Sa règle d'origine
      //    n'est pas un cadeau — les combattants ne touchent plus que la
      //    moitié, l'autre moitié se partage entre TOUTE l'équipe. On échange
      //    une tête qui monte vite contre une équipe qui suit.
      // ═══════════════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 ET LE SERMENT DE LA TROUPE FAIT LE MÊME TRAVAIL, EN ENTIER.
      //     Mesuré : le Multi Exp. seul ne redresse RIEN — en forçant la
      //     politique à toujours le prendre, la médiane d'équipe passe de 12,0 à
      //     13,2 devant Giovanni et les taux de victoire ne bougent pas. Sa
      //     règle canon donne à chaque passager 8 % d'une part normale. Le
      //     serment, lui, verse la part ENTIÈRE à toute l'équipe et paie ce
      //     partage par `expGain: 0.7` — on échange un porteur qui balaye
      //     contre six Pokémon qui tiennent.
      //  ⚠️ LES DEUX SE CUMULENT, ET C'EST VOULU : on a juré ET payé l'objet.
      //     `part` vaut donc 1 sous serment, 1/2 sous le seul objet.
      // ═══════════════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 LES ÉVÉNEMENTS DE MONTÉE DE NIVEAU ÉTAIENT JETÉS. `distribuerExpé-
      //    rience` rend une liste — niveau gagné, attaque apprise, ÉVOLUTION —
      //    et l'interface l'ignorait purement et simplement. Conséquences,
      //    toutes invisibles dans le code et énormes en jeu :
      //      · AUCUN Pokémon n'évoluait jamais par niveau. Salamèche restait
      //        Salamèche jusqu'au bout du voyage ;
      //      · aucune attaque n'était apprise en montant de niveau, donc une
      //        équipe finissait à N.40 avec les quatre coups de N.5.
      //    Le moteur faisait son travail depuis le début ; c'est l'écran qui
      //    n'écoutait pas.
      // 🔴 ET LA RÈGLE DE RÉPARTITION VIT MAINTENANT DANS LE MOTEUR, PAS ICI.
      //    Elle était écrite deux fois — ici et dans le harnais de mesure — et
      //    les deux avaient divergé : le harnais ignorait le Multi Exp. ET les
      //    serments. J'ai failli en tirer un changement d'équilibre. Une seule
      //    porte, et la mesure décrit enfin le jeu joué.
      // ═══════════════════════════════════════════════════════════════════════
      var suites = M().distribuerExperience(partie, etat.joueur.participants, adverse, {
        expGain: SERM().expGain,
        expPartage: SERM().expPartage,
        expAll: P().aLObjet(partie, "EXP_ALL"),
        plafond: plafondDeLActe(),
        // ⚠️ LE COMBAT DE DRESSEUR VAUT UNE FOIS ET DEMIE en première
        //    génération. Le moteur ne recevait pas l'information : le bonus
        //    n'existait donc pas, et rien ne le disait.
        dresseur: !!(options && options.dresseur),
      });
      for (var s = 0; s < suites.length; s++) montees.push({ mon: suites[s].mon, ev: suites[s].ev });
      if (options.gain) partie.argent += Math.round(options.gain * SERM().argent);
      // 🔴 UN RIVAL QUI NE RÉAGIT PAS N'EST PAS UN RIVAL. `POKE_SCENARIO.RIVAL`
      //    porte sa réplique de défaite — « il rappelle son Pokémon sans un
      //    mot » — et son sourire quand c'est lui qui gagne. Sans elles, on
      //    battait un dresseur anonyme qui se trouvait porter un nom.
      if (options.rival) partie.rivalBattu = (partie.rivalBattu || 0) + 1;
      if (options.arene) {
        P().gagnerBadge(partie, options.arene);
        // 🔴 LA PLUS GRANDE FANFARE POUR LE PLUS RARE. Huit badges par voyage :
        //    c'est assez rare pour mériter les quatre secondes, et assez
        //    fréquent pour qu'on les attende. Un son qu'on entend tout le temps
        //    ne récompense plus rien.
        son("POKEDEX_RATING");
        // 🔴 CHAQUE BADGE SCELLE L'ÉQUIPE DE DUEL. Attendre la fin du voyage
        //    aurait laissé sans équipe la plupart des joueurs : la médiane
        //    mesurée est de trois à quatre badges, et un voyage se clôt souvent
        //    en fermant l'onglet. Un badge est le bon repère — c'est un progrès
        //    que le joueur a vu, et qu'il retrouve à l'écran de duel.
        W.PokeProgression.sceller(partie);
        // 🔴 LE BOSS FERME L'ACTE. C'est ce qui donne au voyage sa forme : neuf
        //    actes bornés, au lieu d'un budget de jours que personne n'épuisait.
        P().acteSuivant(partie);
      }
      if (options.ligue) {
        partie.ligueEtape = (partie.ligueEtape || 0) + 1;
        if (partie.ligueEtape > CONSEIL().length) { partie.ligueGagnee = true; partie.fini = "vitrine"; }
        // 🔴 SECOND BLOCAGE, DE LA MÊME FAMILLE. La Ligue est UN SEUL nœud pour
        //    CINQ combats — le Conseil 4 puis le Maître. Gagner le premier
        //    consommait le nœud, la carte de l'acte 9 se retrouvait vide, et le
        //    voyage s'arrêtait là : à un combat de la fin, sans un message.
        //    Le nœud se rouvre donc tant que la Ligue n'est pas achevée ;
        //    l'écran d'arène lit `ligueEtape` et présente le membre suivant.
        else P().revenirAuNoeud(partie);
      }
    } else if (issue === "capture") {
      var pris = C().actif(etat.adverse);
      P().prendre(partie, pris.n, options.zone || partie.etape, pris.niveau);
      // 🔴 SIX PLACES, SAUF SERMENT. Le Serment de la solitude en laisse quatre,
      //    celui du duel trois : c'est leur COÛT, et il doit mordre au moment
      //    exact où l'on capture — sinon la contrainte se découvre trois nœuds
      //    plus loin, sans qu'on comprenne pourquoi.
      //    ⚠️ Le Pokémon en trop n'est jamais perdu : il part en réserve, comme
      //       toujours. Un serment resserre l'équipe, il ne confisque rien.
      // Le niveau du recruteur et les places de l'équipe : une seule porte,
      // dans le moteur, que le harnais appelle aussi (`P().rejoint`).
      pris = P().rejoint(partie, pris, hasard);
      captureAMontrer = pris;
      // ═══════════════════════════════════════════════════════════════════
      // 🔴 UNE PRISE APRÈS LA DERNIÈRE CARTE N'A PLUS DE PORTE. La réserve ne
      //    s'ouvre que depuis la carte ; quand la partie est déjà close —
      //    l'épilogue, la grotte de Mewtwo — cette carte ne reviendra pas.
      //    Le Pokémon était donc pris, compté au Pokédex, et perdu pour
      //    l'équipe : « je n'ai pas pu l'embarquer » (Poltron_sofa, 18/08).
      //    On note la dette ici et `fin()` la solde, une seule fois.
      //  ⚠️ On lit l'ÉQUIPE, pas la réserve : c'est `rejoint` qui décide où il
      //     va, et une seconde règle recopiée ici divergerait de la sienne.
      // ═══════════════════════════════════════════════════════════════════
      if (partie.fini && partie.equipe.indexOf(pris) < 0) partie.priseTardive = true;
    } else if (issue === "defaite") {
      defaiteAMontrer = solderDefaite(!!(options.arene || options.ligue));
    }
    P().appliquerNuzlocke(partie);
    // 🔴 La collection s'enrichit À CHAQUE ÉTAPE, pas seulement à la fin. Un
    //    joueur qui ferme l'onglet après avoir croisé un Mélofée à un pour cent
    //    doit le garder — sinon la rareté devient une punition.
    W.PokeProgression.fusionner(partie);
    // 900 ms est un temps de LECTURE, pas une règle : le joueur regarde le
    // dernier écran une seconde avant de repartir. Réglable, comme la vitesse
    // du texte — et l'auto-joueur, qui ne lit pas, le met à zéro.
    //
    // 🔴 UNE CHAÎNE DE RENCONTRES SE POURSUIT — SAUF SI ON EST À TERRE. Le nœud
    //    a annoncé un nombre de rencontres : on les enchaîne jusqu'au bout. Mais
    //    une défaite ou une équipe vide arrête tout, sinon le joueur mis K.O.
    //    serait renvoyé au combat suivant sans un Pokémon debout.
    //  Le crochet `apres` (12/08) : une scène qui se poursuit APRÈS son combat
    //  — le repaire Rocket livre ses clés une fois le sbire au sol.
    var suite = options.apres || carte;
    if (chaine && issue !== "defaite" && partie.equipe.length) suite = rencontreSuivante;
    else chaine = null;
    // 🔴 LES MONTÉES DE NIVEAU SE MONTRENT AVANT DE REPARTIR. Une évolution est
    //    LE moment dont on se souvient dans Pokémon : la faire en silence entre
    //    deux écrans, c'est la supprimer.
    // 🔴 PUIS LE BUTIN. Trois cartes, on en prend une — c'est la boucle qui
    //    donne envie de relancer. Elle vient APRÈS les montées de niveau :
    //    on veut savoir ce qu'on est devenu avant de choisir ce qu'on emporte.
    var versButin = suite;
    if (issue === "victoire" && !partie.fini) {
      versButin = function () { ecranButin(suite, !!options.arene); };
    }
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 HUIT CHAMPIONS, HUIT PHRASES DE DÉFAITE, JAMAIS DITES. Chaque arène
    //    porte deux répliques dans `POKE_SCENARIO.ARENES` : `avant`, qu'on lit
    //    en entrant, et `apres` — « Tu as visé juste. Le Badge Roche est à
    //    toi. » — qui n'était affichée nulle part. Le badge tombait en silence,
    //    au moment le plus gratifiant de l'acte, et le Champion qu'on venait de
    //    battre n'avait rien à dire.
    //    Écrites, relues, accordées au genre du joueur — et invisibles.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 UN LÉGENDAIRE QUI S'ENFUIT NE DISAIT RIEN. Deux phrases dormaient dans
    //    le scénario pour les deux issues — « Tu ne le reverras pas de ce
    //    voyage » et « Il n'y en avait qu'un ». C'est l'événement le plus rare
    //    d'une partie, et il se soldait par un retour à la carte.
    // 🔴 ET LA CONDITION LAISSAIT PASSER L'ISSUE LA PLUS FRÉQUENTE. Elle
    //    s'écrivait `issue === "capture" || issue !== "victoire"` — une
    //    tautologie qui exclut exactement un cas : la victoire, c'est-à-dire le
    //    légendaire ABATTU, 312 fois sur 633 au harnais. Le seul silence du
    //    mode tombait sur sa rencontre la plus rare.
    //    ⚠️ Les trois issues sont nommées, aucune n'est un « sinon » : le jour
    //       où une quatrième existera, elle n'héritera pas d'une phrase fausse.
    // 🔴 L'ÉTAT ET LA PHRASE SE DÉCIDENT ICI, ENSEMBLE, ET NULLE PART AILLEURS.
    //    Ils vivaient à trois endroits : « enfui » posé dans la branche
    //    victoire, « pris » dans la branche capture, et la phrase tout en bas.
    //    Résultat, la DÉFAITE et la FUITE n'écrivaient RIEN — le voyage
    //    affichait « Il s'enfuit » et n'en gardait aucune trace. Une même
    //    question résolue à trois endroits finit par donner trois réponses.
    if (options.legendaire) {
      var apresL = versButin;
      // ⚠️ QUATRE ISSUES NOMMÉES, plus aucun « sinon ». La fuite du JOUEUR n'est
      //    pas la fuite de l'oiseau, et la défaite n'est ni l'une ni l'autre.
      var cleL = issue === "capture" ? "legendairePris"
        : issue === "victoire" ? "legendaireAbattu"
        : issue === "fuite" ? "legendaireLache" : "legendaireEnfui";
      partie.legendaires[options.legendaire] = issue === "capture" ? "pris"
        : issue === "victoire" ? "abattu" : "enfui";
      var motL = W.PokeGenre.pour(W.POKE_SCENARIO.POKEDEX, cleL, null, "scenario:pokedex");
      versButin = function () { message(T("nLegendaire"), motL, apresL); };
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 UN ERRANT RATTRAPÉ NE REVIENT PAS ; UN ERRANT QUI S'ÉCHAPPE COURT
    //     TOUJOURS. C'est toute la différence avec la chasse unique de Kanto,
    //     où rater le légendaire le perd pour le voyage. Ici l'essai n'est pas
    //     unique — c'est la RENCONTRE qui est rare, et c'est elle qui coûte.
    //     Rendre l'essai unique en ferait une punition de plus ; le laisser
    //     libre en fait une poursuite.
    //  ⚠️ ON LE DIT quand il part. Un adversaire qui disparaît sans un mot se
    //     lit comme un bug, pas comme une mécanique.
    //
    //  🔴 [24/08] CE BLOC ÉTAIT DANS `ecranDefi`, PAS ICI — un copier-coller
    //     tombé dans le gestionnaire de clic du défi du jour, où ni `options`
    //     ni `issue` n'existent. Deux conséquences, toutes deux signalées le
    //     jour même : lo1845 a capturé Raikou et l'a recroisé DEUX FOIS dans
    //     la même partie, Altaroxx la même chose avec Entei — un errant pris
    //     n'était jamais marqué « pris », donc il restait « libre » et
    //     `errantQuiParait` continuait de le tirer. Et le bloc égaré aurait
    //     levé une erreur le jour où l'on reprend un défi interrompu en plein
    //     combat.
    //  🔑 LA CLASSE : une règle écrite, exportée, et posée dans la mauvaise
    //     fonction se lit comme branchée. Elle ne l'est pas.
    // ═══════════════════════════════════════════════════════════════════════
    if (options.errant && partie.errants) {
      if (issue === "capture") partie.errants[options.errant] = "pris";
      else if (issue === "fuite") {
        return message(T("nLegendaire"),
          T("errantFuit", { nom: ESP()[options.errant].nom[LANG()] }) + " " + T("errantEncore"),
          function () { chaine = null; return carte(); });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 `options.arene` EST L'OBJET ARÈNE, PAS SON NUMÉRO. `lancerCombat` le
    //    reçoit tel quel (`{ dresseur: true, arene: a }`), et `gagnerBadge` lit
    //    bien `arene.ordre`. Mais ces deux lignes le traitaient comme un
    //    NUMÉRO : `POKE_SCENARIO.ARENES[objet]` rendait `undefined` et
    //    `areneDe(objet)` rendait `null`.
    //    Conséquence, vraie depuis le premier jour : la réplique du Champion
    //    après sa défaite ne s'affichait JAMAIS, et le jour où elle l'aurait
    //    fait, elle serait sortie sous le titre générique « ARÈNE » au lieu de
    //    « Pierre » ou « Koga ». Deux comparaisons qui échouent toujours, en
    //    silence — la classe de défaut la plus fréquente du projet, et je
    //    venais d'en écrire une troisième juste en dessous.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LE SERMENT S'INTERCALE DANS LA MÊME CHAÎNE QUE LES RÉPLIQUES. Chaque
    //    écran d'après-combat enveloppe le suivant ; s'insérer ici plutôt que
    //    d'appeler `ecranButin` en dur garantit que la réplique du Champion et
    //    la fuite de la Rocket passent AVANT, dans leur ordre écrit.
    var areneOrdre = options.arene ? options.arene.ordre : 0;
    if (areneOrdre && issue === "victoire") {
      var apresS = versButin;
      versButin = function () { ecranSerment(apresS); };
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE CHAMPION NE DONNAIT PAS SA CT. Chacun des huit en remet une en
    //     main propre dans le jeu d'origine — c'est ce qui fait qu'un badge se
    //     SOUVIENT : on ne repart pas avec « un objet », on repart avec Toxik
    //     parce qu'on a battu Koga. Ici la victoire ne rendait qu'un tirage de
    //     butin, le même que pour un dresseur de route.
    //     Les huit clés sont lues dans `scripts/<Gym>.asm` par `poke-monde`.
    //  ⚠️ L'écran passe AVANT la réplique du Champion : d'abord ce qu'il te
    //     donne, ensuite ce qu'il te dit. C'est l'ordre du jeu d'origine.
    if (areneOrdre && issue === "victoire" && options.arene.ct) {
      var don = O().donnerCT(partie, options.arene.ct);
      if (don.ok) {
        var apresCT = versButin;
        var champCT = options.arene, mCT = don.machine;
        versButin = function () {
          son("GET_KEY_ITEM");
          message(esc(W.PokeGenre.nomChampion(champCT) || T("nBoss")),
            // ⚠️ `nomMachine` est la porte déjà employée par la boutique et le
            //    butin : « CT06 Toxik ». Une seconde façon de nommer une
            //    machine finirait par diverger de la première.
            //    ⚠️ Elle a divergé : ce commentaire désignait `ctArticle`, une
            //       clé jumelle qui rendait « CT6 » sans son zéro. Deux portes
            //       qui se réclament l'une de l'autre restent deux portes.
            T("champCT", {
              nom: esc(W.PokeGenre.nomChampion(champCT)),
              ct: nomMachine(mCT),
            }), apresCT);
        };
      }
    }
    if (areneOrdre && issue === "victoire") {
      var scA = W.POKE_SCENARIO.ARENES[areneOrdre];
      if (scA && scA.apres) {
        var apresA = versButin;
        var motA = W.PokeGenre.pour(scA, "apres", null, "scenario:arene");
        var champ = options.arene;
        versButin = function () {
          message(esc(W.PokeGenre.nomChampion(champ) || T("nBoss")), motA, apresA);
        };
      }
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 LE BADGE N'ÉTAIT NOMMÉ QU'AVANT LE COMBAT. `badgeGagne` — « Badge
      //     {b} obtenu ! » — était écrit depuis toujours et n'a JAMAIS été
      //     servi : seule la réplique du Champion s'affichait après la
      //     victoire. Le beat de récompense du mode, celui qui donne son nom à
      //     l'acte, était écrit et perdu. Contenu écrit et jamais montré, sur
      //     l'objet même de tout le voyage.
      //  ⚠️ APRÈS la réplique, pas avant : d'abord ce que le Champion dit,
      //     ensuite ce qu'on emporte. C'est l'ordre du jeu d'origine, et c'est
      //     déjà celui de la capsule technique juste au-dessus.
      // ═══════════════════════════════════════════════════════════════════
      //  ⚠️ `nomBadge` PREND L'ARÈNE, pas le nom du badge : c'est elle qui
      //     porte le libellé, et c'est déjà l'appel de `areneEnJeu`.
      var apresB = versButin;
      var areneB = options.arene;
      if (areneB && areneB.badge) {
        versButin = function () {
          son("GET_KEY_ITEM");
          message(esc(W.PokeGenre.nomChampion(areneB) || T("nBoss")),
            T("badgeGagne", { b: esc(W.PokeGenre.nomBadge(areneB)) }), apresB);
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LA TEAM ROCKET SE DISPERSAIT EN SILENCE. `ROCKET.fuite` est écrite
    //    depuis le premier jour — « La Team Rocket se disperse. Giovanni
    //    disparaît le dernier. » — et attendait dans la liste « sans écran » du
    //    détecteur avec la mention « attend l'écran de Giovanni ». Or l'écran
    //    existait : c'est la victoire sur la huitième arène.
    //    Le mode raconte la Rocket sur quatre étapes — le Mont Sélénite, le
    //    casino, la tour, la tour Silph — et la cinquième, celle qui CONCLUT,
    //    ne se disait nulle part. Une histoire qu'on ouvre quatre fois et qu'on
    //    ne ferme jamais.
    // ═══════════════════════════════════════════════════════════════════════
    if (areneOrdre === 8 && issue === "victoire") {
      var apresR = versButin;
      var motR = W.PokeGenre.pour(W.POKE_SCENARIO.ROCKET, "fuite", null, "scenario:rocket");
      versButin = function () { message(T("nRocket"), motR, apresR); };
    }

    // Le rival a le dernier mot, gagné ou perdu. Une ligne, à sa place : après
    // le combat, avant le butin — c'est là que le jeu d'origine la met.
    if (options.rival && (issue === "victoire" || issue === "defaite")) {
      var sc = W.POKE_SCENARIO && W.POKE_SCENARIO.RIVAL;
      if (sc) {
        var apres = versButin;
        var mot = W.PokeGenre.pour(sc, issue === "victoire" ? "gagne" : "perdu",
          { rival: esc(partie.rival || T("rivalSansNom")) }, "scenario:rival");
        versButin = function () { message(T("nRival"), mot, apres); };
      }
    }
    if (montees.length) return ecranMontees(montees, versButin);
    // 🔴 UNE CAPTURE MÉRITE SON ÉCRAN. Elle n'en avait aucun : une ligne dans le
    //    journal du combat, puis la carte. C'est LE geste du jeu, et il passait
    //    plus vite qu'un ramassage d'objet.
    if (captureAMontrer) return ecranPrise(captureAMontrer, versButin);
    // Le K.O. a son écran lui aussi : il coûte la moitié de l'argent, et un
    // coût qu'on ne voit pas n'apprend rien.
    if (defaiteAMontrer) return ecranDefaite(defaiteAMontrer, suite);
    W.PokeTempo.apres(W.POKE_TRANSITION == null ? 900 : W.POKE_TRANSITION, versButin);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PARC SAFARI — LA SEULE ZONE OÙ L'ON NE SE BAT PAS
  //
  //  🔴 SIXIÈME MÉCANIQUE MORTE DU MODE. `PokeCapture.tenterSafari` et
  //     `PokeCapture.fuit` étaient écrites, exportées, et appelées nulle part :
  //     le Parc sortait comme un nœud d'herbes ordinaire, avec ses combats et
  //     ses Poké Balls. Or c'est la seule zone du jeu d'origine qui fonctionne
  //     autrement, et c'est ce qui en fait un morceau à part.
  //
  //  🔴 ET IL PORTE HUIT ESPÈCES QU'ON NE TROUVE NULLE PART AILLEURS :
  //     Kangourex, Insécateur, Scarabrute, Tauros, Rhinocorne, Noeunoeuf,
  //     Nidorina, Nidorino. Sans lui, la collection plafonne sans que rien ne
  //     le dise — huit espèces manquantes qu'aucun voyage ne peut combler.
  //
  //  ── LA MÉCANIQUE, TELLE QUE LE ROM LA POSE ────────────────────────────────
  //   · un nombre de Balls FIXE, qui ne se recharge pas ; quand il tombe à
  //     zéro, le Parc se ferme ;
  //   · le CAILLOU double le taux de capture et rend la fuite bien plus
  //     probable ; l'APPÂT fait l'inverse. C'est le seul vrai arbitrage du
  //     Parc, et il se prend créature par créature ;
  //   · pas de combat : on ne peut pas affaiblir, on ne peut que parier.
  //
  //  🔴 TRENTE BALLS COMME DANS LE ROM SERAIT UNE ÉTERNITÉ ICI. Le Parc est UN
  //     nœud d'un acte, pas une zone qu'on visite à loisir : douze essais
  //     tiennent en deux minutes et gardent l'arbitrage tendu.
  // ═══════════════════════════════════════════════════════════════════════════
  var SAFARI_BALLS = 12;

  // 🔴 CHAQUE GESTE DU PARC ENTRE AU JOURNAL. Le Parc TIRE dans le hasard de la
  //    partie — une créature, un jet, une fuite — et le nombre de tirages
  //    dépend de ce que le joueur fait. Sans trace, un rejeu serveur
  //    consommerait le hasard autrement et divergerait au premier nœud suivant.
  //    Le mode est aujourd'hui hors `SPORTS` et hors `RUN_SPORTS` côté serveur,
  //    donc rien ne se rejoue encore ; mais le brief exige que le rejeu soit
  //    ÉPROUVÉ AVANT L'OUVERTURE, et un piège posé maintenant se paierait le
  //    jour de l'ouverture, sur les scores de tout le monde.
  function noterGeste(quoi) { if (journal) journal.push({ s: quoi }); }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CONCOURS DE CAPTURE D'INSECTES — PARC NATIONAL   [21/08/2026]
  //
  //  🔴 IL FERME LE DERNIER TROU NON CANON DE JOHTO. Insécateur et Scarabrute
  //     ne s'attrapent NULLE PART ailleurs dans Cristal. Sans cette mécanique,
  //     ils restaient hors de portée — pas par choix, par absence.
  //
  //  🔑 CE N'EST PAS UN SAFARI AVEC UN AUTRE VIVIER. Le Parc laisse repartir
  //     avec tout ce qu'on attrape ; le Concours n'en laisse garder QU'UN. Ce
  //     seul écart fait toute la décision : à la sixième Ball, garder le
  //     Chenipan de 14 points ou le relâcher en pariant sur un Insécateur qui
  //     ne viendra peut-être pas. On DIT les deux notes au moment du choix —
  //     un arbitrage dont on ne voit pas les termes n'est pas un arbitrage.
  //
  //  🔑 LE BARÈME EST CELUI DE LA CARTOUCHE, terme à terme (`ContestScore`,
  //     engine/events/bug_contest/judging.asm) : PV max ×4, les cinq stats,
  //     le bonus de DV, les PV restants ÷ 8, +1 si la bête tient un objet.
  //     Il vit dans le fichier généré, pas ici : le réécrire dans l'écran
  //     aurait donné une seconde vérité à tenir d'accord.
  //
  //  ⚠️ LES SEUILS DU PODIUM SE CALCULENT SUR LE VIVIER, ils ne sont pas tapés.
  //     Le jeu d'origine fait concourir dix PNJ aux scores tirés ; ici le rang
  //     se joue sur le score seul, et les barres sortent des espèces réellement
  //     tirables. Une espèce ajoutée au vivier déplace donc les barres toute
  //     seule, au lieu de rendre un seuil écrit à la main silencieusement faux.
  // ═══════════════════════════════════════════════════════════════════════════
  function CONC() {
    return (W.PokeRegles && W.PokeRegles.concours && W.PokeRegles.concours()) || null;
  }

  //  `ContestScore` recopiée. `m` est un Pokémon créé par le moteur.
  function scoreConcours(m) {
    var c = CONC();
    if (!c || !m) return 0;
    var b = c.bareme, e = ESP()[m.n];
    if (!e) return 0;
    var st = M().calculerStats ? M().calculerStats(m) : null;
    // Le moteur expose ses statistiques calculées ; sans porte, on retombe sur
    // les bases — et on le DIT plutôt que de rendre un zéro silencieux.
    var pvMax = st ? (st.pv || 0) : (e.base ? e.base.pv : 0);
    var s = pvMax * b.pvMax;
    if (st) {
      s += (st.atk || 0) * b.atk + (st.def || 0) * b.def + (st.vit || 0) * b.vit;
      // Le moteur de 1996 n'a qu'une spéciale ; celui de 1999 en a deux. On lit
      // ce qui existe, des deux côtés, sans supposer lequel tourne.
      s += (st.sat != null ? st.sat : (st.spe || 0)) * b.sat;
      s += (st.sdf != null ? st.sdf : (st.spe || 0)) * b.sdf;
    }
    var dv = m.dv || {};
    var bit = b.dvBit || 2, poids = b.dvPoids || {};
    for (var k in poids) if ((dv[k] & bit) === bit) s += poids[k];
    s += Math.floor((m.pv != null ? m.pv : pvMax) / (b.pvRestantsSur || 8));
    if (m.objet) s += b.objetTenu || 0;
    return s;
  }

  //  Les barres du podium, déduites du vivier lui-même.
  //
  //  🔴 CE CALCUL NE TOUCHE PAS À LA GRAINE. Il fabrique dix Pokémon témoins
  //     pour connaître l'échelle des notes — et `M().creer` TIRE : les DV, et
  //     en 1999 l'objet tenu. Lui passer le `hasard` du voyage aurait
  //     consommé une dizaine de tirages au moment du jugement, donc décalé
  //     TOUT ce qui vient après. Au Défi du jour, deux joueurs partis de la
  //     même graine n'auraient plus eu la même partie — et rien ne l'aurait dit.
  //  ⚠️ Le témoin est donc servi par un tirage FIGÉ, à lui. Les DV sont posés
  //     en clair pour que la barre soit la même à chaque appel : une barre qui
  //     bouge n'est pas une barre.
  var TIRAGE_FIGE = {
    entier: function (n) { return Math.floor(n / 2); },
    brut: function () { return 0.5; },
    pondere: function (l) { return l && l.length ? l[0] : null; },
  };
  var _seuils = null;
  function seuilsConcours() {
    if (_seuils !== null) return _seuils;
    var c = CONC();
    if (!c || !c.vivier || !c.vivier.length) return null;
    var notes = [];
    for (var i = 0; i < c.vivier.length; i++) {
      var r = c.vivier[i];
      // On note chaque espèce du vivier au HAUT de sa plage, à DV moyens : la
      // meilleure prise possible de chaque rang, donc une échelle comparable.
      try {
        var temoin = M().creer(r.n, r.max, TIRAGE_FIGE, { dv: { pv: 8, atk: 8, def: 8, vit: 8, spe: 8 } });
        notes.push(scoreConcours(temoin));
      } catch (_) { /* une espèce absente ne fabrique pas de barre */ }
    }
    if (notes.length < 4) return null;
    notes.sort(function (a, b) { return b - a; });
    _seuils = { premier: notes[1], deuxieme: notes[Math.floor(notes.length / 2)], troisieme: notes[notes.length - 2] };
    return _seuils;
  }

  function ecranConcours(noeud) {
    var c = CONC();
    if (!c) return message(T("nConcours"), T("rien"), carte);
    var restantes = c.balls || 20;
    var etat = { appat: false, caillou: false };
    var courant = null;
    var tenue = null;                 // la prise que l'on présentera

    function tirer() {
      var creneaux = c.vivier.map(function (r) {
        return { n: r.n, niveau: r.min + hasard.entier(r.max - r.min + 1), poids: r.poids };
      });
      return hasard.pondere(creneaux);
    }

    function suivante() {
      if (restantes <= 0) return juger();
      var t = tirer();
      if (!t) return juger();
      courant = M().creer(t.n, t.niveau, hasard);
      P().voir(partie, courant.n);
      etat = { appat: false, caillou: false };
      rendre(T("concApparait", { nom: esc(ESP()[courant.n].nom[LANG()]) }));
      criDe(courant.n);
    }

    function rendre(dit) {
      var e = ESP()[courant.n];
      coque(
        '<p class="pkdx-surtitre">' + T("concTitre") + "</p>" +
        '<h1 class="pkdx-titre">' + esc(e.nom[LANG()]) + " " + W.PokeGenre.niveau(courant.niveau) + "</h1>" +
        '<p class="pkdx-dit">' + dit + "</p>" +
        '<div class="pkdx-prise">' +
          '<figure class="pkdx-prise-art">' +
            '<img alt="' + esc(e.nom[LANG()]) + '" src="assets/img/poke/art/' + courant.n + '.webp">' +
          "</figure>" +
          '<dl class="pkdx-prise-releve">' +
            "<div><dt>" + T("concBalls") + "</dt><dd>" + restantes + " / " + (c.balls || 20) + "</dd></div>" +
            "<div><dt>" + T("priseTypes") + "</dt><dd>" +
              e.types.map(function (t) { return W.PokeType.pastille(t); }).join(" ") + "</dd></div>" +
            // 🔴 CE QU'ON TIENT DÉJÀ EST TOUJOURS À L'ÉCRAN, avec sa note. Sans
            //    lui, le joueur choisirait de relâcher sans savoir contre quoi.
            "<div><dt>" + T("concTenue") + "</dt><dd>" +
              (tenue
                ? esc(ESP()[tenue.n].nom[LANG()]) + " · " + scoreConcours(tenue) + " " + T("concNote").toLowerCase()
                : T("concAucune")) + "</dd></div>" +
          "</dl>" +
        "</div>" +
        // 🔴 SIGNALÉ PAR SYREAN LE 21/08 : « le concours n'affiche aucun bouton
        //    cliquable, obligé de revenir sur l'accueil ». J'avais passé les
        //    touches à `coque()` sous forme de TABLEAU de descripteurs — une
        //    signature que cette fonction n'a pas. Elle prend du HTML, et le
        //    second argument était simplement ignoré : l'écran sortait complet,
        //    beau, et sans une seule sortie. Un cul-de-sac en production.
        //  🔑 Ce que ça a coûté : je n'ai jamais PEINT cet écran avant de le
        //     livrer. Contrôles de données verts, branchements verts, batterie
        //     verte — et le seul geste qui l'aurait vu, ouvrir la page, je ne
        //     l'ai pas fait. La règle de ce dossier le dit déjà : une porte de
        //     mesure ne rend pas du HTML, elle PEINT.
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-conc-ball"' +
            (restantes > 0 ? "" : ' disabled title="' + T("safariPlusDeBalls") + '"') + ">" +
            T("safariBall") + "</button>" +
          '<button type="button" class="pkdx-touche" id="pk-conc-appat"' +
            (restantes > 0 ? "" : " disabled") + ">" + T("safariAppat") + "</button>" +
          '<button type="button" class="pkdx-touche" id="pk-conc-caillou"' +
            (restantes > 0 ? "" : " disabled") + ">" + T("safariCaillou") + "</button>" +
          '<button type="button" class="pkdx-touche" id="pk-conc-partir">' + T("concPartir") + "</button>" +
        "</div>"
      );
      racine.querySelector("#pk-conc-ball").addEventListener("click", lancer);
      racine.querySelector("#pk-conc-appat").addEventListener("click", function () { geste("appat"); });
      racine.querySelector("#pk-conc-caillou").addEventListener("click", function () { geste("caillou"); });
      racine.querySelector("#pk-conc-partir").addEventListener("click", juger);
    }

    function geste(quoi) {
      etat[quoi] = true;
      etat[quoi === "appat" ? "caillou" : "appat"] = false;
      son("PRESS_AB");
      if (fuiteEventuelle(T(quoi === "appat" ? "safariAppatDit" : "safariCailloDit"))) return;
      rendre(T(quoi === "appat" ? "safariAppatDit" : "safariCailloDit"));
    }

    function lancer() {
      if (restantes <= 0) return rendre(T("safariPlusDeBalls"));
      noterGeste("ball");
      restantes--;
      son("BALL_TOSS");
      // La MEME porte que le Parc : `tenterSafari`, jamais une seconde regle.
      var jet = W.PokeCapture.tenterSafari(courant, etat, hasard);
      if (jet.pris) {
        son("CAUGHT_MON");
        P().voir(partie, courant.n);
        var pris = courant;
        // 🔴 UNE SEULE PRISE SE PRÉSENTE. S'il n'y a rien, on garde. Sinon on
        //    montre les DEUX notes et on laisse trancher — c'est le cœur du
        //    Concours, et la seule chose qui le distingue du Parc.
        if (!tenue) { tenue = pris; return apres(); }
        var nA = scoreConcours(tenue), nB = scoreConcours(pris);
        // Même défaut que ci-dessus, même remède : du HTML, puis le câblage.
        coque(
          '<p class="pkdx-surtitre">' + T("concTitre") + "</p>" +
          '<h1 class="pkdx-titre">' + T("concQuel") + "</h1>" +
          '<div class="pkdx-actions est-pied">' +
            '<button type="button" class="pkdx-touche" id="pk-conc-garde">' +
              T("concGarder", { nom: esc(ESP()[tenue.n].nom[LANG()]), n: nA }) + "</button>" +
            '<button type="button" class="pkdx-touche est-definitive" id="pk-conc-echange">' +
              T("concGarder", { nom: esc(ESP()[pris.n].nom[LANG()]), n: nB }) + "</button>" +
          "</div>"
        );
        racine.querySelector("#pk-conc-garde").addEventListener("click", function () { son("PRESS_AB"); apres(); });
        racine.querySelector("#pk-conc-echange").addEventListener("click", function () { son("PRESS_AB"); tenue = pris; apres(); });
        return;
      }
      son("BALL_POOF");
      if (fuiteEventuelle(T("safariEchappe"))) return;
      rendre(T("safariEchappe"));
    }

    function apres() { if (restantes > 0) suivante(); else juger(); }

    function fuiteEventuelle(avant) {
      if (!W.PokeCapture.fuit(courant, etat, hasard)) return false;
      son("RUN");
      message(T("concTitre"), avant + " " + T("safariFuit", { nom: esc(ESP()[courant.n].nom[LANG()]) }),
        restantes > 0 ? suivante : juger);
      return true;
    }

    // ── LE JUGEMENT ─────────────────────────────────────────────────────────
    function juger() {
      noterGeste("sortir");
      if (!tenue) {
        son("PRESS_AB");
        W.PokeProgression.fusionner(partie);
        return message(T("concTitre"), T("concBredouille"), carte);
      }
      var note = scoreConcours(tenue);
      var s = seuilsConcours();
      var rang = "participation";
      if (s) {
        if (note >= s.premier) rang = "premier";
        else if (note >= s.deuxieme) rang = "deuxieme";
        else if (note >= s.troisieme) rang = "troisieme";
      }
      var lotCle = (c.prix || {})[rang];
      var nomLot = lotCle ? nomObjet(lotCle) : "";
      if (lotCle) partie.sac[lotCle] = (partie.sac[lotCle] || 0) + 1;
      // La prise repart avec le joueur : c'est la règle du Concours, et c'est
      // la SEULE porte par laquelle Insécateur et Scarabrute entrent au Pokédex.
      P().prendre(partie, tenue.n, "concours", tenue.niveau);
      if (partie.equipe.length < SERM().equipeMax) partie.equipe.push(tenue); else partie.boite.push(tenue);
      W.PokeProgression.fusionner(partie);
      son(rang === "premier" ? "CAUGHT_MON" : "PRESS_AB");
      var cleRang = rang === "premier" ? "concPremier"
                  : rang === "deuxieme" ? "concDeuxieme"
                  : rang === "troisieme" ? "concTroisieme" : "concRien";
      // Même porte que toute autre prise : on ne recopie pas l'écran, on l'appelle.
      return ecranPrise(tenue, function () {
        message(T("concTitre"),
          T("concVerdict", { nom: esc(ESP()[tenue.n].nom[LANG()]), n: note }) +
          " " + T(cleRang, { quoi: esc(nomLot) }), carte);
      });
    }

    suivante();
  }

  function ecranSafari(noeud) {
    var restantes = SAFARI_BALLS;
    var etat = { appat: false, caillou: false };
    var courant = null;
    var pris = [];

    function zoneDuParc() {
      var tables = noeud.tables || [];
      var id = tables.length ? tables[hasard.entier(tables.length)] : null;
      for (var i = 0; i < ZONES().length; i++) if (ZONES()[i].id === id) return ZONES()[i];
      return null;
    }

    function suivante() {
      if (restantes <= 0) return sortir();
      var z = zoneDuParc();
      var creneaux = z && z.herbe ? z.herbe[partie.version] : null;
      if (!creneaux || !creneaux.length) return sortir();
      var tirage = hasard.pondere(creneaux.map(function (c) { return { n: c.n, niveau: c.niveau, poids: c.poids }; }));
      if (!tirage) return sortir();
      courant = M().creer(tirage.n, tirage.niveau, hasard);
      P().voir(partie, courant.n);
      etat = { appat: false, caillou: false };
      rendre(T("safariApparait", { nom: esc(ESP()[courant.n].nom[LANG()]) }));
      criDe(courant.n);
    }

    function rendre(dit) {
      var e = ESP()[courant.n];
      coque(
        '<p class="pkdx-surtitre">' + T("nSafari") + "</p>" +
        '<h1 class="pkdx-titre">' + esc(e.nom[LANG()]) + " " + W.PokeGenre.niveau(courant.niveau) + "</h1>" +
        '<p class="pkdx-dit">' + dit + "</p>" +
        '<div class="pkdx-prise">' +
          '<figure class="pkdx-prise-art">' +
            '<img alt="' + esc(e.nom[LANG()]) + '" src="assets/img/poke/art/' + courant.n + '.webp">' +
          "</figure>" +
          '<dl class="pkdx-prise-releve">' +
            "<div><dt>" + T("safariBalls") + "</dt><dd>" + restantes + " / " + SAFARI_BALLS + "</dd></div>" +
            "<div><dt>" + T("priseTypes") + "</dt><dd>" +
              e.types.map(function (t) { return W.PokeType.pastille(t); }).join(" ") + "</dd></div>" +
            // 🔴 L'ÉTAT DE LA CRÉATURE SE DIT. Sans lui, l'appât et le caillou
            //    seraient deux boutons dont on ne verrait jamais l'effet — et
            //    un choix dont on ne voit pas la conséquence n'est pas un choix.
            "<div><dt>" + T("safariHumeur") + "</dt><dd>" +
              T(etat.caillou ? "safariEnerve" : etat.appat ? "safariOccupe" : "safariCalme") + "</dd></div>" +
            // ═══════════════════════════════════════════════════════════════
            //  🔴 LE PARC CACHAIT LA SEULE CHANCE QU'IL AVAIT À DONNER. En
            //     combat, chaque Ball porte son pourcentage ; ici — la SEULE
            //     zone où l'on ne peut pas affaiblir, donc où le pari est
            //     tout — l'écran ne donnait qu'une humeur. Le caillou et
            //     l'appât devenaient deux boutons dont on ne mesurait jamais
            //     l'effet.
            //  ⚠️ LE CALCUL EST ANALYTIQUE ET SANS TIRAGE (`PokeCapture.chanceSafari`) :
            //     l'afficher ne coûte pas un cran de hasard.
            // ═══════════════════════════════════════════════════════════════
            (W.PokeCapture.chanceSafari
              ? "<div><dt>" + T("safariChance") + "</dt><dd>" +
                  W.PokeCapture.chanceSafari(courant, etat) + " %</dd></div>"
              : "") +
          "</dl>" +
        "</div>" +
        '<div class="pkdx-actions est-pied">' +
          // ⚠️ À ZÉRO BALL, LES TROIS GESTES S'ÉTEIGNENT ET DISENT POURQUOI.
          //    « LANCER » faisait sortir du Parc ; appât et caillou tournaient
          //    dans le vide.
          '<button type="button" class="pkdx-touche est-definitive" id="pk-saf-ball"' +
            (restantes > 0 ? "" : ' disabled title="' + T("safariPlusDeBalls") + '"') + ">" +
            T("safariBall") + "</button>" +
          '<button type="button" class="pkdx-touche" id="pk-saf-appat"' +
            (restantes > 0 ? "" : " disabled") + ">" + T("safariAppat") + "</button>" +
          '<button type="button" class="pkdx-touche" id="pk-saf-caillou"' +
            (restantes > 0 ? "" : " disabled") + ">" + T("safariCaillou") + "</button>" +
          '<button type="button" class="pkdx-touche" id="pk-saf-partir">' + T("safariPartir") + "</button>" +
        "</div>"
      );
      racine.querySelector("#pk-saf-ball").addEventListener("click", lancer);
      racine.querySelector("#pk-saf-appat").addEventListener("click", function () { poser("appat"); });
      racine.querySelector("#pk-saf-caillou").addEventListener("click", function () { poser("caillou"); });
      racine.querySelector("#pk-saf-partir").addEventListener("click", sortir);
    }

    // 🔴 L'APPÂT ET LE CAILLOU S'EXCLUENT. Poser les deux n'aurait aucun sens :
    //    l'un calme, l'autre énerve. Le ROM garde le dernier posé.
    function poser(quoi) {
      noterGeste(quoi);
      son(quoi === "caillou" ? "COLLISION" : "GET_ITEM_1");
      etat = { appat: quoi === "appat", caillou: quoi === "caillou" };
      if (fuiteEventuelle(T(quoi === "caillou" ? "safariCailloDit" : "safariAppatDit"))) return;
      rendre(T(quoi === "caillou" ? "safariCailloDit" : "safariAppatDit"));
    }

    function lancer() {
      // 🔴 À ZÉRO BALL, « LANCER » FAISAIT SORTIR DU PARC. Le libellé promettait
      //    un jet, l'action quittait la zone — et les boutons restaient tous
      //    actifs, appât et caillou consommant du hasard pour rien. Les trois
      //    s'éteignent désormais, et ils disent pourquoi (voir `rendre`).
      if (restantes <= 0) return;
      noterGeste("ball");
      restantes--;
      son("BALL_TOSS");
      var r = W.PokeCapture.tenterSafari(courant, etat, hasard);
      if (r.pris) {
        son("CAUGHT_MON");
        P().prendre(partie, courant.n, "safari", courant.niveau);
        if (partie.equipe.length < SERM().equipeMax) partie.equipe.push(courant); else partie.boite.push(courant);
        pris.push(courant.n);
        W.PokeProgression.fusionner(partie);
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 LE PARC NE PASSAIT PAR AUCUN ÉCRAN DE PRISE. Il annonçait la
        //     capture d'une ligne et repartait. Conséquences cumulées : un
        //     CHROMATIQUE attrapé au Parc n'était signalé NULLE PART (le halo
        //     et le son ne vivent qu'en combat et dans la boîte), le grade du
        //     Potentiel n'était jamais dit, et **on ne pouvait pas nommer sa
        //     prise** — alors que `ecranPrise` se déclare lui-même « le seul
        //     endroit où le chromatique se constate ».
        //     Or le Parc est la SEULE source de huit espèces : Kangourex,
        //     Insécateur, Scarabrute, Tauros, Rhinocorne, Nœunœuf, Nidorina,
        //     Nidorino. Un chromatique y était donc à la fois le plus rare et
        //     le plus invisible du mode.
        //  ⚠️ MÊME PORTE QUE LA CAPTURE EN COMBAT : on ne recopie pas l'écran,
        //     on l'appelle.
        // ═══════════════════════════════════════════════════════════════════
        return ecranPrise(courant, restantes > 0 ? suivante : sortir);
      }
      son("BALL_POOF");
      if (fuiteEventuelle(T("safariEchappe"))) return;
      rendre(T("safariEchappe"));
    }

    // La créature peut fuir après chaque geste — c'est la tension du Parc.
    function fuiteEventuelle(avant) {
      if (!W.PokeCapture.fuit(courant, etat, hasard)) return false;
      son("RUN");
      message(T("nSafari"), avant + " " + T("safariFuit", { nom: esc(ESP()[courant.n].nom[LANG()]) }),
        restantes > 0 ? suivante : sortir);
      return true;
    }

    function sortir() {
      noterGeste("sortir");
      son("PRESS_AB");
      W.PokeProgression.fusionner(partie);
      var quoi = pris.length
        ? T("safariBilan", { n: pris.length, quoi: esc(pris.map(function (n) { return ESP()[n].nom[LANG()]; }).join(", ")) })
        : T("safariBredouille");
      message(T("nSafari"), quoi, carte);
    }

    suivante();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE SAC — TROIS FAMILLES DE BUTIN ÉTAIENT MORTES
  //
  //  🔴 LES VITAMINES ET LES SUPER BONBONS N'ÉTAIENT EMPLOYABLES NULLE PART.
  //     `employerVitamine` et `employerBonbon` existent dans `obtenir.js`,
  //     elles sont exportées, et AUCUN écran ne les appelait. Le butin les
  //     distribuait, elles tombaient au sac, et elles y restaient pour
  //     toujours. Trois familles de cartes sur huit ne servaient à rien —
  //     et ce sont les RARES, celles qu'on est content de tirer.
  //     Même famille que les Balls jamais décomptées : une fonction morte ne
  //     produit aucune erreur, elle ne fait rien, et rien ressemble à tout.
  //
  //  🔴 ET C'EST UNE COUCHE DE DÉCISION ENTIÈRE. Une vitamine est un gain
  //     PERMANENT sur une statistique : la donner à ce Pokémon-là, c'est
  //     choisir celui qu'on emmène au bout. C'est la seule progression du mode
  //     qui survive à un K.O. — elle mérite un écran, pas un oubli.
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 LES PIERRES AUSSI DORMAIENT. `pierrePossible` et `employerPierre`
  //    existaient dans `obtenir.js`, exportées, jamais appelées — et le butin
  //    distribue une carte « pierre » de rareté LÉGENDAIRE. La carte la plus
  //    rare du jeu donnait un objet qui ne servait à rien, et elle servait
  //    l'évolution, la mécanique que le propriétaire a nommée pierre angulaire
  //    du mode. Trouvée par le détecteur de portes mortes, écrit après les
  //    trois premières.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 UNE PIERRE NE SE RECONNAÎT PAS À LA FORME DE SON NOM. Le test était
  //     `/_STONE$/`, et il se trompait DANS LES DEUX SENS dès qu'on est passé
  //     à Johto :
  //       · `THUNDERSTONE` (Johto) n'a pas de tiret bas — la Pierre Foudre
  //         n'était donc ni rangée dans le sac ni proposée à l'évolution. Le
  //         joueur l'achetait et elle disparaissait. Signalé par Totor le 21/08 :
  //         « elle n'apparaît pas dans l'inventaire, et impossible de la donner
  //         à mon Pikachu » — les deux symptômes, une seule ligne.
  //       · `HARD_STONE` (Pierre Dure) FINIT par `_STONE` et n'est pas une
  //         pierre d'évolution du tout : c'est un objet tenu qui renforce le
  //         type Roche. Il était rangé au rayon des pierres et proposé sur
  //         l'écran d'évolution, où il ne peut rien faire.
  //  🔑 On DEMANDE À LA DONNÉE au lieu de deviner : une pierre d'évolution est
  //     un objet qu'une espèce du monde courant nomme dans `evolue[].objet`
  //     avec `par: "pierre"`. C'est la même règle que le reste du mode —
  //     l'annonce est calculée, jamais écrite — et elle reste vraie tout seule
  //     si un monde ajoute une pierre ou en renomme une.
  //  ⚠️ Mémoïsé PAR MONDE : la table des espèces change quand on passe de
  //     Kanto à Johto, et un cache sans clé de monde servirait les pierres de
  //     l'autre voyage.
  // ═══════════════════════════════════════════════════════════════════════════
  var _pierresParMonde = { monde: null, set: null };
  function estPierre(o) {
    if (!o) return false;
    var monde = (W.PokeRegles && W.PokeRegles.courante) ? W.PokeRegles.courante() : "kanto";
    if (_pierresParMonde.monde !== monde) {
      var set = {}, t = ESP() || {};
      for (var k in t) {
        var ev = t[k] && t[k].evolue;
        for (var i = 0; ev && i < ev.length; i++) {
          if (ev[i] && ev[i].par === "pierre" && ev[i].objet) set[ev[i].objet] = true;
        }
      }
      _pierresParMonde = { monde: monde, set: set };
    }
    return !!_pierresParMonde.set[o];
  }
  var RANGS_SAC = [
    { cle: "soins", test: function (o) { return W.PokeCombat.OBJETS_SOIN[o]; } },
    { cle: "pierres", test: function (o) { return estPierre(o); } },
    { cle: "vitamines", test: function (o) { return O().VITAMINES[o]; } },
    { cle: "bonbon", test: function (o) { return o === "RARE_CANDY"; } },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA RÉSERVE — CE QU'ON A ATTRAPÉ AU-DELÀ DE SIX
  //
  //  🔴 ELLE EXISTAIT DANS LE MOTEUR ET NULLE PART AILLEURS. `partie.boite` se
  //     remplissait à chaque capture passé six Pokémon, et aucun écran ne
  //     permettait d'en reprendre un. Le joueur voyait « Attrapé ! », le
  //     Pokédex se cochait, et la créature disparaissait du voyage pour de bon.
  //     Attraper devenait une punition silencieuse — dans un mode dont la
  //     capture est le cœur.
  //
  //  🔴 ON ÉCHANGE, ON NE DÉPLACE PAS. L'équipe reste à six : reprendre un
  //     Pokémon de la réserve, c'est en céder un. C'est la règle du jeu
  //     d'origine, et c'est ce qui fait de la composition une décision plutôt
  //     qu'une accumulation.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  ⚠️ `opt.adieu` — LE MÊME ÉCRAN, OUVERT UNE DERNIÈRE FOIS. Il ne change ni
  //     les règles ni les gestes : seulement le titre et le bouton, parce que
  //     « RETOUR À LA CARTE » serait faux quand il n'y a plus de carte. Voir
  //     `fin()` et la prise d'après-Ligue.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranBoite(apres, opt) {
    var adieu = !!(opt && opt.adieu);
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 CET ÉCRAN NE FAIT PLUS DE MATCH-UP — 14/08, décision du propriétaire :
    //     « personne ta demandé d'aider à ce point le joueur ni même de dire
    //     contre qui on va se battre dans l'onglet équipe ».
    //     Il avait raison, et le retrait vaut mieux qu'un réglage : cet écran
    //     répond à UNE question — qui ouvre le combat, et dans quel ordre les
    //     autres relaient. Le « il frappe fort / il est fragile » a déjà son
    //     écran, celui de l'arène (`vTitre`, « TON ÉQUIPE FACE À LUI »), où
    //     l'on se tient devant le Champion au moment de s'engager. Le porter
    //     ici, c'était répondre d'avance à une question qu'on ne pose pas
    //     encore, et transformer une boîte d'équipe en solveur.
    //  🔑 Ce que la boîte garde, c'est ce qu'elle SEULE sait : l'ordre, les PV,
    //     qui est à terre. Des faits sur les siens, pas des conseils sur l'autre.
    //  ⚠️ `verdictHtml` et `PokeMesure` restent : l'arène et la Ligue les
    //     servent. On retire l'EMPLOI, pas la porte.
    // ═══════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════
    //  UNE LIGNE PAR POKÉMON — REFONTE COMPLÈTE DU 14/08
    //
    //  🔴 « JE N'AIME PAS DU TOUT », TROIS FOIS. Le propriétaire a dit « moche »
    //     de trois versions successives, et j'ai chaque fois retouché des
    //     détails. Le défaut n'était pas dans les détails : j'avais fait une
    //     GRILLE DE VIGNETTES, c'est-à-dire une liste de produits. Ça peut
    //     habiller n'importe quel site ; ça n'habille pas un écran d'équipe.
    //  🔑 CET ÉCRAN A UNE FORME CONNUE, ET ELLE VIENT DU JEU. Depuis 1996, une
    //     équipe se lit en LIGNES : le sprite à gauche, le nom, le niveau à
    //     droite, la barre de PV chiffrée dessous. Tout joueur de Pokémon la
    //     connaît par cœur — c'est le même argument que le lexique du ROM, que
    //     ce mode applique partout ailleurs. On ne l'invente pas, on la reprend.
    //  ✅ CE QU'ELLE RÈGLE, ET QUI N'ÉTAIT PAS RÉGLABLE EN GRILLE :
    //     · la largeur ne dépend plus du NOMBRE de Pokémon — une ligne fait la
    //       largeur de l'écran, qu'il y en ait un ou six ;
    //     · plus rien ne passe à la ligne, donc plus de hauteurs inégales ;
    //     · le téléphone reçoit la MÊME mise en page que le bureau, au lieu
    //       d'un repli à deux colonnes qui écrasait tout ;
    //     · le glisser devient VERTICAL, ce qui est le geste naturel pour
    //       ordonner une liste.
    // ═══════════════════════════════════════════════════════════════════════
    function vignette(m, ou, i, actif, elu) {
      var e = ESP()[m.n];
      var enTete = ou === "equipe" && i === 0;
      var part = Math.max(0, Math.min(1, m.pv / m.stats.pv));
      return '<button type="button" class="pkdx-mon-ligne" data-' + ou + '="' + i + '"' +
          W.PokeType.attr(e.types[0]) + (actif ? "" : " disabled") +
          (enTete ? ' data-tete="oui"' : "") +
          // 🔴 RIEN NE MARQUAIT LE POKÉMON CHOISI — critique du 14/08. En mode
          //    échange, on ATTÉNUAIT les autres et on ne LEVAIT pas l'élu :
          //    l'inverse exact de la Règle de la Levée du mode. Le joueur
          //    devait déduire son choix de l'absence de réaction des voisins.
          (elu ? ' data-elu="oui"' : "") +
          (m.pv <= 0 ? ' data-ko="oui"' : "") + ">" +
        // La place dans l'ordre, sur le rail de gauche. Le premier ne porte pas
        // « 1 » : sa place a un SENS de jeu, c'est lui qui ouvre le combat.
        '<span class="pkdx-mon-place">' +
          (ou === "equipe" ? (enTete ? T("boiteTete") : i + 1) : "") + "</span>" +
        '<img alt="" loading="lazy" src="' + W.PokeSprites.face(m.n, "?i=6") + '"' +
          (W.PokeEclat && W.PokeEclat.chromatique(m.dv) ? ' data-chromatique="oui"' : "") + ">" +
        '<span class="pkdx-mon-corps">' +
          '<span class="pkdx-mon-haut">' +
            "<b>" + esc(m.surnom || e.nom[LANG()]) + "</b>" +
            '<span class="pkdx-mon-types">' +
              e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") + "</span>" +
            // 🔴 UN POKÉMON À TERRE SE DIT EN TOUTES LETTRES. Le gris d'un sprite
            //    de 1996 ne se voit pas ; le mot, si. Règle déjà écrite pour
            //    l'écran de fin (`.pkdx-vitrine-ko`), réemployée telle quelle.
            (m.pv <= 0 ? '<span class="pkdx-vitrine-ko">' + T("boiteATerre") + "</span>" : "") +
          "</span>" +
          // 🔴 ON CHOISISSAIT QUI OUVRE UN COMBAT SANS VOIR QUI EST BLESSÉ. La
          //    barre est celle du combat, avec ses trois niveaux : on ne
          //    réapprend pas à lire une jauge d'un écran à l'autre.
          '<span class="pkdx-mon-bas">' +
            '<span class="pkdx-barre pkdx-pv" data-niveau="' +
              (part > 0.5 ? "haut" : part > 0.25 ? "moyen" : "bas") + '">' +
              '<i style="--part:' + part + '"></i></span>' +
            '<span class="pkdx-mon-pv">' + m.pv + " / " + m.stats.pv + "</span>" +
          "</span>" +
        "</span>" +
        '<span class="pkdx-mon-niveau">' + W.PokeGenre.niveau(m.niveau) + "</span>" +
      "</button>";
    }

    var choisi = null;   // l'index dans la réserve qu'on veut reprendre

    function rendre(dit) {
      coque(
        '<p class="pkdx-surtitre">' + T(adieu ? "nAdieu" : "nBoite") + "</p>" +
        '<h1 class="pkdx-titre">' + T(adieu ? "adieuTitre" : "boiteTitre") + "</h1>" +
        // ═══════════════════════════════════════════════════════════════════
        //  ⚠️ LA CONSIGNE SUIT CE QUI EST POSSIBLE. Sans réserve, parler
        //     d'échange serait annoncer une porte qui n'existe pas.
        //  🔴 ET LE GLISSER N'ÉTAIT ANNONCÉ QUE LÀ OÙ IL SERT LE MOINS. Dès
        //     qu'une réserve existait, la consigne passait à `boiteDitReserve`
        //     — plus un mot sur le glisser, exactement quand l'équipe est
        //     pleine et que l'ORDRE compte le plus. À l'inverse, `boiteOrdre`
        //     promettait « glisse pour changer l'ordre » au premier écran du
        //     voyage, où `brancherGlisser` sort immédiatement faute de deux
        //     Pokémon : on promettait un geste impossible et on taisait le
        //     geste utile.
        //  ✅ Les deux faits se cumulent quand ils sont vrais tous les deux, et
        //     le glisser se tait à un seul Pokémon.
        // ═══════════════════════════════════════════════════════════════════
        '<p class="pkdx-dit">' + (dit || (function () {
          if (choisi !== null) return T("boiteContre");
          if (adieu) return T("adieuDit");
          var peutGlisser = partie.equipe.length >= 2;
          if (partie.boite.length) {
            return T("boiteDitReserve") + (peutGlisser ? " " + T("boiteGlisse") : "");
          }
          return peutGlisser ? T("boiteOrdre") : T("boiteSeul");
        })()) + "</p>" +

        // ═══════════════════════════════════════════════════════════════════
        //  🔴 L'ÉCRAN S'OUVRAIT SUR CE QU'ON NE JOUE PAS — critique du 14/08.
        //     Mesuré à 360 px : « TON ÉQUIPE » commençait au pixel **725**. Le
        //     titre pose une question sur l'équipe et l'écran montrait d'abord
        //     les remplaçants, puis quatre lignes grises. L'équipe passe donc
        //     devant, la réserve derrière : c'est l'ordre de la question.
        //  🔴 ET LA LÉGENDE ÉTAIT POSÉE ENTRE LES DEUX RANGÉES qu'elle légende
        //     TOUTES LES DEUX — donc après celle qu'elle n'expliquait pas et
        //     avant celle qu'elle expliquait. Elle monte au-dessus des deux.
        //  ⚠️ Le titre « TON ÉQUIPE » ne paraît QUE s'il y a une réserve : sans
        //     second groupe, il ne distingue rien et redit le titre de l'écran.
        (partie.boite.length ? '<h2 class="pkdx-soustitre">' + T("boiteEquipe") + "</h2>" : "") +
        // 🔴 L'ÉQUIPE EST TOUJOURS CLIQUABLE : sans réserve choisie, le clic met
        //    en tête ; avec, il échange. Un même geste, deux sens, et le texte
        //    au-dessus dit lequel — c'est ce que fait le jeu d'origine.
        '<div class="pkdx-mons" id="pk-equipe">' + partie.equipe.map(function (m, i) {
          return vignette(m, "equipe", i, true);
        }).join("") + "</div>" +

        // La réserve ne s'affiche que si elle contient quelque chose : un titre
        // au-dessus d'une rangée vide se lit comme un défaut de chargement.
        (partie.boite.length
          ? '<h2 class="pkdx-soustitre">' + T("boiteReserve") + "</h2>" +
            '<div class="pkdx-mons">' + partie.boite.map(function (m, i) {
              return vignette(m, "reserve", i, choisi === null || choisi === i, choisi === i);
            }).join("") + "</div>"
          : "") +

        // 🔴 UN PLAFOND QU'ON NE VOIT PAS SE LIT COMME UN BUG. Le Serment du
        //    plafond arrête les niveaux ; sans cette ligne, le joueur voit son
        //    équipe cesser de monter après un combat gagné et croit à un
        //    défaut. Ce que le jeu applique, il le dit — surtout quand c'est
        //    le joueur lui-même qui l'a juré.
        //  ⚠️ IL DESCEND, ET IL CHANGE DE FORME. Empilé sous la légende de
        //     match-up, en gris, au même corps, il se lisait comme un troisième
        //     verdict — alors que ce n'est pas un fait sur l'adversaire mais
        //     une RÈGLE de la partie. Il prend donc la forme d'une règle, et il
        //     se range avec les autres choses qu'on relit, pas avec celles qui
        //     décident du clic.
        (function () {
          //  ⚠️ PAS AU DERNIER ÉCRAN : « Niveau 22 maximum jusqu'au Champion »
          //     sur l'adieu annonce une contrainte pour une suite qui n'existe
          //     plus. Une règle vraie au mauvais moment se lit comme une faute.
          if (adieu) return "";
          var cap = plafondDeLActe();
          if (!cap) return "";
          return '<p class="pkdx-regle">' + esc(T("boitePlafond", { n: cap })) + "</p>";
        })() +

        '<div class="pkdx-actions est-pied">' +
          (choisi !== null
            ? '<button type="button" class="pkdx-touche" id="pk-boite-annule">' + T("retour") + "</button>"
            : '<button type="button" class="pkdx-touche' + (adieu ? " est-definitive" : "") +
              '" id="pk-boite-retour">' + T(adieu ? "adieuFini" : "retourCarte") + "</button>") +
        "</div>"
      );

      surClic("[data-reserve]", function (e) {
        choisi = +e.currentTarget.getAttribute("data-reserve");
        son("PRESS_AB");
        rendre();
      });
      surClic("[data-equipe]", function (e) {
        // ⚠️ Le clic qui SUIT un glisser n'est pas un clic : voir `lache`.
        var enTete = e.currentTarget.closest(".pkdx-mons") || e.currentTarget.parentElement;
        if (enTete && enTete.__glisseFini) { enTete.__glisseFini = false; return; }
        var k = +e.currentTarget.getAttribute("data-equipe");
        // Sans réserve désignée, le clic met en tête — le geste tactique.
        if (choisi === null) {
          if (k === 0) return;
          var t = P().mettreEnTete(partie, k);
          if (!t.ok) { son("DENIED"); return rendre(T("boiteTeteRefus")); }
          son("PRESS_AB");
          return rendre(T("boiteEnTete", { nom: esc(nomDe(t.mon)) }));
        }
        // 🔴 L'ÉCHANGE PASSE PAR LE MOTEUR, PAS PAR L'ÉCRAN. Deux `splice` posés
        //    ici diviseraient la règle en deux endroits — et c'est exactement
        //    comme ça qu'une équipe finit à sept.
        var r = P().echangerReserve(partie, k, choisi);
        if (!r.ok) { son("DENIED"); return rendre(T("boiteRefus")); }
        son("GET_ITEM_1");
        choisi = null;
        rendre(T("boiteFait", { a: esc(nomDe(r.sorti)), b: esc(nomDe(r.entre)) }));
      });
      brancherGlisser();
      var annule = racine.querySelector("#pk-boite-annule");
      if (annule) annule.addEventListener("click", function () { son("PRESS_AB"); choisi = null; rendre(); });
      var retour = racine.querySelector("#pk-boite-retour");
      if (retour) retour.addEventListener("click", function () { son("PRESS_AB"); apres(); });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  GLISSER-DÉPOSER — DEMANDÉ PAR LE PROPRIÉTAIRE, 14/08
    //
    //  « on devrait pouvoir drag and drop sur pc et mobile pour switch les
    //    persos dans sa team ». Et il a raison sur le fond : l'ordre décide de
    //    qui relaie après un K.O., et le seul geste possible était « mettre en
    //    tête ». Réordonner les places 2 à 6 était impossible.
    //
    //  🔑 UN SEUL CODE POUR LES DEUX, PAR LES ÉVÉNEMENTS DE POINTEUR. L'API
    //     `dragstart`/`drop` du navigateur n'existe PAS au doigt : la coder
    //     aurait donné un glisser-déposer sur PC et rien sur téléphone, alors
    //     que la demande nomme les deux. `pointerdown/move/up` couvre souris,
    //     doigt et stylet avec la même trentaine de lignes.
    //  ⚠️ LE CLIC SURVIT. Un déplacement de moins de 8 px n'est pas un glisser,
    //     c'est un clic : sans ce seuil, « mettre en tête » deviendrait
    //     inatteignable, et l'écran perdrait son geste le plus courant pour en
    //     gagner un nouveau.
    //  ⚠️ `setPointerCapture` sinon le doigt qui sort de la carte perd la piste.
    //  ⚠️ LE MOTEUR TRANCHE : on appelle `PokePartie.deplacer`, jamais un
    //     `splice` local. Le refus de mettre un K.O. en tête est SA règle.
    //
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE GLISSER AVAIT PRIS L'ÉCRAN EN OTAGE — quatre joueurs, le 16/08.
    //
    //     Belief : « quand je vais dans équipe je peux pas scroll vers le haut
    //     pour voir les pokés qui sont dans mon équipe […] faut scroll à des
    //     endroits ultra spécifiques ». Tatsu confirme, sur un autre téléphone.
    //     Hawkker nomme la cause sans le savoir : « tu peux glisser seulement
    //     en dessous ou dessus des Pokémon, depuis les textes ».
    //
    //     La feuille posait `touch-action: none` sur CHAQUE ligne, et la ligne
    //     fait 100 % de large. Le navigateur cédait donc TOUS les gestes du
    //     doigt — y compris le défilement vertical — sur toute la surface de la
    //     liste. Il ne restait à gratter que les interstices et les titres :
    //     exactement les « endroits ultra spécifiques » du rapport.
    //     Le commentaire d'origine annonçait ce `touch-action: none` comme la
    //     condition du glisser. Il l'était ; personne n'avait mesuré ce qu'il
    //     coûtait à côté — sur l'écran que l'on ouvre pour LIRE son équipe.
    //
    //  ✅ LE DOIGT ET LA SOURIS N'ONT PAS LE MÊME CONTRAT.
    //     · À la souris, rien ne change : on tire dès le premier pixel.
    //     · Au doigt, le glisser s'ARME PAR UN APPUI LONG (350 ms sans bouger),
    //       la convention de tout téléphone pour réordonner. Tant qu'il n'est
    //       pas armé, le geste appartient au navigateur : la liste défile
    //       partout, y compris sur les lignes.
    //  ⚠️ `touch-action` PASSE DONC À `pan-y` (feuille) : le défilement vertical
    //     reste au navigateur, et c'est ce qui répare le rapport. On ne peut pas
    //     lui reprendre un défilement DÉJÀ commencé — d'où l'armement sur un
    //     doigt IMMOBILE, le seul instant où rien n'est encore engagé.
    //  ⚠️ ET IL FAUT `preventDefault` SUR UN `touchmove` NON PASSIF une fois
    //     armé : `pan-y` autoriserait sinon le défilement à démarrer sous le
    //     doigt qui tire. Chrome enregistre `touchmove` en PASSIF par défaut
    //     sur les listeners de document ; ici il est posé sur la carte avec
    //     `{ passive: false }`, sans quoi l'appel est ignoré en silence.
    //  ⚠️ L'appui long ne doit pas non plus déclencher le menu contextuel du
    //     navigateur : `contextmenu` est annulé pendant qu'il est armé.
    // ═══════════════════════════════════════════════════════════════════════
    var ARMEMENT_MS = 350;
    function brancherGlisser() {
      var hote = racine.querySelector("#pk-equipe");
      if (!hote || partie.equipe.length < 2) return;
      var cartes = [].slice.call(hote.querySelectorAll("[data-equipe]"));
      cartes.forEach(function (c) {
        c.addEventListener("pointerdown", function (ev) {
          if (choisi !== null) return;              // en mode échange, le clic prime
          if (ev.button !== undefined && ev.button !== 0) return;
          var de = +c.getAttribute("data-equipe");
          var x0 = ev.clientX, y0 = ev.clientY, glisse = false, vers = de;
          // Au doigt, le glisser attend l'appui long ; à la souris, il est armé
          // d'emblée. `pointerType` est vide sur les très vieux moteurs : on
          // traite alors comme une souris, le comportement d'avant.
          var auDoigt = ev.pointerType === "touch" || ev.pointerType === "pen";
          var arme = !auDoigt;
          var minuteur = null;
          function armer() {
            arme = true;
            minuteur = null;
            // La carte se soulève : sans ce signal, le joueur ne sait pas que
            // le geste a changé de nature sous son doigt.
            c.classList.add("est-arme");
            // Le défilement ne doit plus partir de cette carte, maintenant
            // qu'elle suit le doigt.
            c.style.touchAction = "none";
            son("PRESS_AB");
          }
          function desarmer() {
            if (minuteur) { W.clearTimeout(minuteur); minuteur = null; }
            c.classList.remove("est-arme");
            c.style.touchAction = "";
          }
          if (auDoigt) minuteur = W.setTimeout(armer, ARMEMENT_MS);
          // 🔴 NON PASSIF, ET C'EST TOUTE LA DIFFÉRENCE : sans ce drapeau, le
          //    `preventDefault` ci-dessous ne fait rien et la liste défile
          //    pendant qu'on croit tirer.
          function retenir(e3) { if (arme && glisse) e3.preventDefault(); }
          c.addEventListener("touchmove", retenir, { passive: false });
          function sansMenu(e4) { if (arme) e4.preventDefault(); }
          c.addEventListener("contextmenu", sansMenu);
          try { c.setPointerCapture(ev.pointerId); } catch (e) {}

          function surviser(x, y) {
            //  La cible est la carte SOUS le pointeur. On la cherche par
            //  géométrie et non par `elementFromPoint` : la carte tirée est
            //  au-dessus de tout et se désignerait elle-même.
            //  🔴 ET IL FAUT L'ÉCARTER EXPLICITEMENT, ce que la première version
            //     ne faisait pas : elle SUIT le pointeur, donc sa boîte contient
            //     le pointeur en permanence. Résultat mesuré au banc : la cible
            //     restait toujours celle d'où l'on partait, aucun déplacement ne
            //     s'appliquait jamais, et le glisser-déposer paraissait marcher
            //     (la carte bougeait) sans rien faire.
            var but = de;
            for (var k = 0; k < cartes.length; k++) {
              if (cartes[k] === c) continue;
              var r = cartes[k].getBoundingClientRect();
              if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
                but = +cartes[k].getAttribute("data-equipe");
              }
            }
            return but;
          }
          function bouge(e2) {
            var ecart = Math.abs(e2.clientX - x0) + Math.abs(e2.clientY - y0);
            // 🔴 UN DOIGT QUI BOUGE AVANT L'ARMEMENT VEUT DÉFILER, PAS TIRER.
            //    On annule l'appui long et on rend la main au navigateur : sans
            //    ça, un défilement rapide armerait le glisser en cours de route.
            if (!arme) { if (ecart >= 8) desarmer(); return; }
            if (!glisse && ecart < 8) return;
            if (!glisse) { glisse = true; c.classList.add("est-tire"); hote.classList.add("est-en-cours"); }
            c.style.transform = "translate(" + (e2.clientX - x0) + "px," + (e2.clientY - y0) + "px)";
            var but = surviser(e2.clientX, e2.clientY);
            if (but !== vers) {
              vers = but;
              cartes.forEach(function (o) { o.classList.remove("est-cible"); });
              if (vers !== de) cartes[vers].classList.add("est-cible");
            }
          }
          function lache() {
            hote.removeEventListener("pointermove", bouge);
            hote.removeEventListener("pointerup", lache);
            hote.removeEventListener("pointercancel", lache);
            // Les deux écouteurs de l'appui long partent AVEC le geste : posés
            // à chaque `pointerdown`, ils s'empileraient sinon à chaque touche.
            c.removeEventListener("touchmove", retenir, { passive: false });
            c.removeEventListener("contextmenu", sansMenu);
            desarmer();
            c.style.transform = "";
            c.classList.remove("est-tire");
            hote.classList.remove("est-en-cours");
            cartes.forEach(function (o) { o.classList.remove("est-cible"); });
            // 🔴 RENONCER À UN DÉPLACEMENT CHANGEAIT L'ORDRE DE COMBAT. Quand on
            //    relâche sur la case de départ, on sort ici sans redessiner — et
            //    le navigateur émet ensuite le `click`, qui atteint
            //    `[data-equipe]` et applique « mettre en tête ». Le geste qu'on
            //    croit sans effet en avait un. Quand le glisser ABOUTIT, `rendre`
            //    détache la carte et le clic tombe dans le vide : le défaut ne
            //    frappait QUE l'annulation.
            if (glisse) hote.__glisseFini = true;
            if (!glisse || vers === de) return;
            var r = P().deplacer(partie, de, vers);
            if (!r.ok) { son("DENIED"); return rendre(T("boiteTeteRefus")); }
            son("PRESS_AB");
            rendre(T(vers === 0 ? "boiteEnTete" : "boiteRange", { nom: esc(nomDe(r.mon)), n: vers + 1 }));
          }
          hote.addEventListener("pointermove", bouge);
          hote.addEventListener("pointerup", lache);
          hote.addEventListener("pointercancel", lache);
        });
      });
    }

    rendre();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE JUGE — CE QUE LE MODE CALCULAIT SANS JAMAIS LE MONTRER
  //
  //  🔴 DEUX VALEURS CACHÉES DÉCIDENT DE TOUT, ET AUCUNE N'ÉTAIT LISIBLE.
  //     · Les DV — quinze points par statistique, tirés à la rencontre, figés à
  //       vie. C'est eux qui font qu'un Roucool n'est pas l'autre, et c'est déjà
  //       ce que le compte conserve sous « meilleur exemplaire ».
  //     · Le stat-exp — ce qu'un vaincu lègue au vainqueur. Il monte à chaque
  //       victoire, les vitamines le poussent, et il entre dans le calcul des
  //       statistiques à chaque montée de niveau.
  //     Les deux sont câblés depuis le premier jour. Les deux étaient muets.
  //     Un joueur voyait deux Pokémon identiques rendre des combats différents
  //     sans jamais pouvoir savoir pourquoi — et donc sans jamais pouvoir en
  //     tirer une décision.
  //
  //  🔴 LE JUGE DU JEU D'ORIGINE NE DONNE PAS DE NOMBRES, IL DONNE UN VERDICT.
  //     On garde ce parti pris : cinq barres et un mot. Afficher « 14/15 » et
  //     « 7 208 » ferait de l'écran une feuille de calcul, et le brief interdit
  //     les formules à l'écran. Ce qu'on veut faire comprendre tient en une
  //     phrase : ce que tu combats forge ton équipe.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranJuge(apres) {
    var ORDRE = ["pv", "atk", "def", "vit", "spe"];
    function barre(part, cle) {
      // 🔴 UNE BARRE, PAS UN NOMBRE. Et elle porte son intitulé accessible :
      //    un lecteur d'écran ne lit pas une largeur.
      var pc = Math.round(Math.max(0, Math.min(1, part)) * 100);
      return '<span class="pkdx-juge-ligne">' +
        '<span class="pkdx-juge-stat">' + nomStat(cle) + "</span>" +
        '<span class="pkdx-barre pkdx-juge-barre" role="img" aria-label="' + pc + ' %">' +
          '<i style="--part:' + (pc / 100) + '"></i>' +
        "</span>" +
      "</span>";
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  L'ATTAQUE LEVÉE — [19/08, Syrean] « modifier l'emplacement des attaques
    //  comme dans les jeux de base ». Le geste du jeu d'origine : on désigne
    //  une attaque, puis la place qu'elle prend ; les deux s'échangent.
    //  `leve` = { ou, i, k } — la liste, le Pokémon, l'attaque. Une seule à la
    //  fois, sur toute la fiche : lever une attaque chez un autre Pokémon
    //  déplace la levée, elle ne l'additionne pas.
    //  ⚠️ LE MOTEUR ÉCHANGE (`echangerAttaques`), l'écran ne touche pas au
    //     tableau : même règle que l'ordre de l'équipe.
    // ═══════════════════════════════════════════════════════════════════════
    var leve = null;

    function carteJuge(m, ou, i) {
        var e = ESP()[m.n];
        // 🔴 CETTE CARTE POSAIT SON TYPE ET LE JETAIT. `data-type` était écrit,
        //    `--teinte` résolvait — mesuré à l'écran : #78c850 pour un
        //    Bulbizarre — et la feuille peignait la carte en gris. Elle prend
        //    maintenant la teinte du composant commun, et ses pastilles avec :
        //    la loi du mode veut qu'une couleur nomme son type, et c'est aussi
        //    l'information qui décide juste après le niveau sur l'écran où
        //    l'on se demande si l'équipe tient.
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 LE SEUL ÉCRAN QUI RELIT UN POKÉMON APRÈS SA CAPTURE TAISAIT LES
        //     DEUX CHOSES QU'ON VIENT Y CHERCHER. Il dessinait les barres de DV
        //     et n'appelait jamais `PokeEclat.lire` : ni le VERDICT
        //     (« PARFAIT »… « ORDINAIRE »), ni le halo du CHROMATIQUE. Un
        //     chromatique déjà dans l'équipe était donc invisible sur sa propre
        //     fiche — alors que la boîte, le combat et le Pokédex le disent
        //     tous les trois.
        //  ⚠️ LE GRADE EST UN JETON DE FORME (`data-grade`), déjà stylé, et pas
        //     une couleur neuve : c'est la loi du mode.
        // ═══════════════════════════════════════════════════════════════════
        var ec = W.PokeEclat ? W.PokeEclat.lire(m) : null;
        return '<div class="pkdx-carte-mon pkdx-juge-mon"' + W.PokeType.attr(e.types[0]) + ">" +
          '<img alt="" loading="lazy" src="' + W.PokeSprites.face(m.n, "?i=6") + '"' +
            (ec && ec.chromatique ? ' data-chromatique="oui"' : "") + ">" +
          '<b>' + esc(m.surnom || e.nom[LANG()]) + "</b>" +
          '<span class="pkdx-niveau">' + W.PokeGenre.niveau(m.niveau) + "</span>" +
          '<div class="pkdx-juge-types">' +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") +
          "</div>" +
          '<div class="pkdx-juge-bloc">' +
            '<span class="pkdx-juge-titre">' + T("jugeInne") +
              // ⚠️ `grade.nom` EST L'ÉTIQUETTE COURTE (« PARFAIT ») ; la clé
              //    `d*` porte la PHRASE (« Statistiques parfaites. Un sur
              //    soixante-cinq mille. »), qui n'entre pas dans un jeton.
              // ⚠️ SA PROPRE CLASSE, PAS `.pkdx-mesure-note` : celle-là est en
              //    `nowrap`, et `poke-texte-coupe` refuse — à raison — qu'une
              //    valeur montée à l'exécution s'y voie interdire le retour à
              //    la ligne. Le grade reprend l'échelle de GRAISSE que la fiche
              //    de prise emploie déjà, jamais une couleur.
              (ec ? ' <span class="pkdx-juge-grade" data-grade="' + ec.grade.cle + '">' +
                    esc(ec.grade.nom[LANG()]) + "</span>" : "") +
            "</span>" +
            ORDRE.map(function (k) {
              // Les DV vont de zéro à quinze ; les PV s'en déduisent en
              // première génération, donc `dv.pv` peut manquer : on le
              // recompose comme le moteur, au lieu d'afficher un vide.
              var v = m.dv && m.dv[k] !== undefined ? m.dv[k] : 0;
              return barre(v / 15, k);
            }).join("") +
          "</div>" +
          '<div class="pkdx-juge-bloc">' +
            '<span class="pkdx-juge-titre">' + T("jugeAcquis") + "</span>" +
            ORDRE.map(function (k) {
              // 🔴 LE PLAFOND UTILE EST 25 600, PAS 65 535. Au-delà, la racine
              //    carrée du calcul d'origine ne rend plus rien : une barre
              //    tracée sur 65 535 aurait paru vide alors que le Pokémon est
              //    au maximum. C'est le même plafond que les vitamines.
              var v = m.statExp && m.statExp[k] ? m.statExp[k] : 0;
              return barre(v / 25600, k);
            }).join("") +
          "</div>" +
          // ═══════════════════════════════════════════════════════════════
          //  🔴 SES ATTAQUES NE S'AFFICHAIENT NULLE PART HORS COMBAT. Dans
          //     tous les jeux de la série, la fiche d'un Pokémon montre ses
          //     quatre attaques ; ici on ne les voyait que dans le menu de
          //     combat, et seulement pour celui qui est au front. Trois
          //     décisions en dépendent pourtant : qui entre en premier, quelle
          //     CT acheter, et lequel garder en réserve.
          //  ⚠️ Les PP ne sont PAS ici : ils changent à chaque tour, et cet
          //     écran se lit entre deux combats. Le type et la puissance
          //     suffisent à décider — le reste est du bruit.
          // ═══════════════════════════════════════════════════════════════
          //  🔴 [19/08, Syrean] ET L'ORDRE SE CHOISIT ICI. Chaque ligne est
          //     un bouton : la première touche lève l'attaque (`data-elu`, le
          //     cadre vif du mode), la seconde désigne la place — les deux
          //     s'échangent, PP compris. Toucher la même attaque la repose.
          //  ⚠️ Un Pokémon à une seule attaque n'a rien à ordonner : sa ligne
          //     reste une ligne, pas une porte qui ne mène nulle part.
          // ═══════════════════════════════════════════════════════════════
          '<div class="pkdx-juge-bloc">' +
            '<span class="pkdx-juge-titre">' + T("jugeCoups") + "</span>" +
            '<ul class="pkdx-juge-coups">' + (m.attaques || []).map(function (x, k) {
              var a = ATT()[x.cle];
              if (!a) return "";
              var dedans = W.PokeType.pastille(a.type) +
                "<b>" + esc(a.nom[LANG()]) + "</b>" +
                (a.puissance ? '<span class="pkdx-juge-force">' + a.puissance + "</span>" : "");
              if ((m.attaques || []).length < 2) return "<li>" + dedans + "</li>";
              var elu = leve && leve.ou === ou && leve.i === i && leve.k === k;
              return '<li><button type="button" class="pkdx-juge-coup" data-coup="' + k + '"' +
                ' data-ou="' + ou + '" data-mon="' + i + '"' +
                (elu ? ' data-elu="oui" aria-pressed="true"' : ' aria-pressed="false"') + ">" +
                dedans + "</button></li>";
            }).join("") + "</ul>" +
            //  Ce qu'il apprendra ensuite — voir la note sur `jugeProchaine`.
            '<span class="pkdx-juge-prochaine">' + esc(prochaineAttaque(m)) + "</span>" +
            '<span class="pkdx-juge-prochaine">' + esc(commentEvolue(m)) + "</span>" +
          "</div>" +
        "</div>";
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LE FEUILLETAGE AU POUCE (12/08, mandat « essence du mobile ») : au
    //  téléphone la grille devient une rangée à crans (feuille, `scroll-snap`
    //  — le navigateur fait le geste). Ici, seulement les POINTS de position :
    //  ils n'existent que quand le feuilletage est actif — sous la grille de
    //  bureau ils ne nommeraient rien — et suivent le cran en vue.
    //  ⚠️ `aria-hidden` : les fiches restent dans l'ordre du document, un
    //     lecteur d'écran les lit déjà une à une ; les points sont un décor
    //     de position, pas une information qui lui manque.
    //  ⚠️ Une rangée par groupe (équipe, réserve) : chacune a ses points.
    // ═══════════════════════════════════════════════════════════════════════
    function feuilleter(juge, n) {
      if (!juge || n < 2 || !W.matchMedia || !W.matchMedia("(max-width: 700px)").matches) return;
      var points = D.createElement("div");
      points.className = "pkdx-juge-points";
      points.setAttribute("aria-hidden", "true");
      var html = "";
      for (var i = 0; i < n; i++) html += "<i" + (i === 0 ? ' class="est-la"' : "") + "></i>";
      points.innerHTML = html;
      juge.parentNode.insertBefore(points, juge.nextSibling);
      var poser = function () {
        var i = Math.round(juge.scrollLeft / Math.max(1, juge.clientWidth));
        var tous = points.children;
        for (var k = 0; k < tous.length; k++) {
          tous[k].className = k === i ? "est-la" : "";
        }
      };
      juge.addEventListener("scroll", poser, { passive: true });
      poser();
    }

    function rendre(dit) {
      // ⚠️ L'ÉCRAN SE REDESSINE À CHAQUE TOUCHE, et au téléphone la rangée
      //    est un défilement : sans cette ligne, lever une attaque sur le
      //    quatrième Pokémon ramenait la rangée sur le premier, et le joueur
      //    perdait la fiche qu'il venait de toucher.
      var defil = [].map.call(racine.querySelectorAll(".pkdx-juge"), function (j) { return j.scrollLeft; });
      var boite = partie.boite || [];
      coque(
        '<p class="pkdx-surtitre">' + T("jugeTitre") + "</p>" +
        '<h1 class="pkdx-titre">' + T("boiteEquipe") + "</h1>" +
        '<p class="pkdx-dit' + (dit ? " est-alerte" : "") + '">' +
          (dit || (T("jugeDit") + " " + T("jugeCoupsDit"))) + "</p>" +
        '<div class="pkdx-juge" data-groupe="equipe">' + partie.equipe.map(function (m, i) {
          return carteJuge(m, "equipe", i);
        }).join("") + "</div>" +
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 [19/08, Zodialol] « À chaque fois que je veux voir les IV, je
        //     dois le mettre dans mon équipe. » La réserve passait par la
        //     boîte et un échange pour être lue ici — un aller-retour qui
        //     touchait l'équipe pour regarder un chiffre. La fiche montre
        //     maintenant les deux groupes, l'équipe d'abord, la réserve
        //     derrière, sous le titre que la boîte emploie déjà.
        // ═══════════════════════════════════════════════════════════════════
        (boite.length
          ? '<h2 class="pkdx-soustitre">' + T("boiteReserve") + "</h2>" +
            '<div class="pkdx-juge" data-groupe="boite">' + boite.map(function (m, i) {
              return carteJuge(m, "boite", i);
            }).join("") + "</div>"
          : "") +
        '<p class="pkdx-dit pkdx-juge-note">' + T("jugeInneDit") + " " + T("jugeAcquisDit") + "</p>" +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche" id="pk-juge-retour">' + T("retour") + "</button>" +
        "</div>"
      );
      racine.querySelector("#pk-juge-retour").addEventListener("click", function () {
        son("PRESS_AB");
        apres();
      });
      var rangees = racine.querySelectorAll(".pkdx-juge");
      for (var r = 0; r < rangees.length; r++) {
        if (defil[r]) rangees[r].scrollLeft = defil[r];
        feuilleter(rangees[r], rangees[r].children.length);
      }
      surClic("[data-coup]", function (e) {
        var b = e.currentTarget;
        var ou = b.getAttribute("data-ou"), i = +b.getAttribute("data-mon"), k = +b.getAttribute("data-coup");
        var liste = ou === "boite" ? partie.boite : partie.equipe;
        var mon = liste && liste[i];
        if (!mon) return;
        // Même attaque : on la repose. Autre Pokémon : la levée change de main.
        if (!leve || leve.ou !== ou || leve.i !== i) {
          leve = { ou: ou, i: i, k: k };
          son("PRESS_AB");
          return rendre(T("jugeCoupLeve", { attaque: esc(nomAttaque(mon.attaques[k].cle)) }));
        }
        if (leve.k === k) { leve = null; son("PRESS_AB"); return rendre(); }
        var de = leve.k;
        var r2 = P().echangerAttaques(partie, ou, i, de, k);
        leve = null;
        if (!r2.ok) { son("DENIED"); return rendre(); }
        son("GET_ITEM_1");
        // Après l'échange, ce qui était en `de` est maintenant en `k` et
        // inversement : on nomme les deux par leur place d'arrivée.
        rendre(T("jugeCoupFait", { a: esc(nomAttaque(mon.attaques[k].cle)), b: esc(nomAttaque(mon.attaques[de].cle)) }));
      });
    }

    rendre();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE PORTE UN CHAMPION — LA RÈGLE VIT ICI, ET ELLE SE DÉDUIT
  //
  //  🔴 ELLE NE S'ÉCRIT PAS DANS `POKE_ARENES` : ce tableau est GÉNÉRÉ depuis
  //     la désassemblée, et une colonne posée à la main y disparaîtrait à la
  //     prochaine régénération, sans un mot. On la déduit donc de l'ordre de
  //     l'arène — la seule donnée qui ne peut pas mentir sur l'avancement.
  //
  //  🔴 LA PROGRESSION EST CELLE DU JEU D'ORIGINE : les premiers Champions ne
  //     portent rien — un combat de dix niveaux n'a pas besoin d'une potion
  //     pour être un combat —, les suivants une Super Potion, les derniers une
  //     Hyper Potion. Le Conseil 4 en porte deux, et c'est ce qui fait de la
  //     Ligue autre chose qu'une file de cinq dresseurs.
  //
  //  ⚠️ Un stock FINI, toujours. Le harnais a déjà prouvé une fois qu'une
  //     ressource illimitée en combat produit des combats sans fin.
  //  ⚠️ L'ÉCHELLE EST MESURÉE, PAS DEVINÉE. Sur 300 combats avec une équipe de
  //     six au niveau du Champion : sans potion 100 % de victoires, avec une
  //     100 %, avec deux 98 % — et 260 à 443 soins employés. Les potions
  //     coûtent donc des TOURS, pas des voyages, quand on arrive préparé ; et
  //     elles mordent quand on arrive court, ce qui est exactement le but.
  //     Zéro combat sans fin dans les quatre réglages.
  //  🔴 KOGA PORTE DEUX HYPER POTIONS — DÉCIDÉ ET MESURÉ (13/08). L'ancienne
  //     règle (« une seule Super Potion, ne pas ajouter un mur sans l'avoir
  //     décidé ») datait d'un monde où Koga arrêtait la moitié des voyages.
  //     Depuis la Bosse, il était MORT : ~95 % de victoires optimales, 1 % des
  //     morts. Le propriétaire a ordonné de le réveiller ; le panel de
  //     l'itération 2 a signé l'ensemble équipe à cinq (dresseurs.js, posé
  //     dans le GÉNÉRATEUR poke-monde.mjs) + 2 Hyper Potions : victoires
  //     optimales 62 %, 8 % des morts — LE combat du dernier tiers, voulu.
  //     ⚠️ Le harnais simule désormais ces potions (miroir dans
  //     poke-difficulte.mjs) : tout futur réglage se mesure AVEC.
  //  🔴 MORGANE AUSSI (13/08 soir) : son arène était ÉTEINTE après les
  //     correctifs canon (82 % de victoires optimales, 2 % des morts). Équipe
  //     à cinq + 2 Hyper Potions, A/B m1→m4 : victoires 67 %, morts 8 % — le
  //     second mur des dents de scie vit. Miroir dans poke-difficulte.mjs.
  function soinsDeChampion(ordre) {
    if (ordre <= 2) return { n: 0, objet: "SUPER_POTION" };
    if (ordre <= 4) return { n: 1, objet: "SUPER_POTION" };
    if (ordre === 5 || ordre === 6) return { n: 2, objet: "HYPER_POTION" };
    if (ordre === 7) return { n: 2, objet: "HYPER_POTION" };
    return { n: 2, objet: "HYPER_POTION" };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES DRESSEURS DE ROUTE BOIVENT AUSSI — 17/08/2026
  //
  //  🔴 EN 1996, UN DRESSEUR SOIGNE SON POKÉMON. C'est ce qui fait qu'un combat
  //     ne se règle pas d'un coup : on entame, il répare, il faut frapper deux
  //     fois. Le moteur sait le faire depuis toujours (`soins` / `soin` dans
  //     `demarrer`) et SEUL le Champion en recevait — la route, elle, tombait
  //     au premier coup porté. C'est la moitié de ce qu'IHSÂN décrit.
  //  ⚠️ RIEN AVANT L'ACTE 3. Le début du voyage est déjà le moment le plus
  //     meurtrier (mesuré : la moitié des voyages meurent avant le 2e badge) ;
  //     y ajouter des potions punirait ceux qui peinent pour corriger l'ennui
  //     de ceux qui s'envolent.
  //  ⚠️ UNE SEULE POTION, ET DE LA GAMME DE L'ACTE. Deux transformeraient un
  //     dresseur de passage en mur ; il y en a jusqu'à trois par nœud.
  // ═══════════════════════════════════════════════════════════════════════════
  function soinsDeDresseur(acte) {
    if (!acte || acte <= 2) return { n: 0, objet: "POTION" };
    if (acte <= 5) return { n: 1, objet: "SUPER_POTION" };
    return { n: 1, objet: "HYPER_POTION" };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CENTRE — DEUX PORTES, ET IL N'EN AVAIT AUCUNE
  //
  //  🔴 C'ÉTAIT LE SEUL NŒUD DE LA CARTE QUI NE POSAIT PAS DE QUESTION. On le
  //     prenait, l'équipe était soignée, on repartait — un bouton déguisé en
  //     choix. Or il revient deux à trois fois par acte : c'est un tiers des
  //     décisions du voyage qui n'en étaient pas.
  //
  //  🔴 LE VRAI ARBITRAGE D'UN ROGUELITE, C'EST « MAINTENANT OU PLUS TARD ».
  //     Soigner rend la vie tout de suite ; s'entraîner ne rend rien et rend
  //     l'équipe plus forte pour le reste du voyage. Prendre l'un, c'est
  //     perdre l'autre — la règle du mode, appliquée à un nœud qui l'ignorait.
  //
  //  🔴 ET L'ENTRAÎNEMENT N'INVENTE RIEN : il verse du STAT-EXP, le système de
  //     construction de la première génération, celui-là même que le Juge
  //     affiche depuis hier. Le joueur voit donc ce qu'il gagne, sur l'écran
  //     qu'il connaît déjà. Une mécanique neuve qui se lit avec un outil qui
  //     existe déjà vaut mieux qu'une mécanique neuve avec son écran à elle.
  //     ⚠️ La valeur vaut environ six victoires sur la statistique choisie.
  //        Assez pour peser, trop peu pour remplacer les combats.
  // ═══════════════════════════════════════════════════════════════════════════
  var CENTRE_STATS = ["pv", "atk", "def", "vit", "spe"];
  //  ⚠️ « spe » RESTE UNE SEULE ENTRÉE, MÊME À JOHTO — c'est le ROM de 1999 qui
  //     partage l'expérience de statistique entre les deux Spéciales
  //     (`moteur.js`, `statExp.spe`). Ce qui change, c'est le NOM du bouton :
  //     un monde où « Spécial » n'existe sur aucune fiche ne peut pas le
  //     proposer à l'entraînement sans mentir sur ce qu'on achète.
  function nomStatEntrainement(s) {
    if (s !== "spe") return nomStat(s);
    var R = W.PokeRegles;
    return (R && R.speAtk() !== R.speDef()) ? T("centreDeuxSpe") : nomStat(s);
  }
  var CENTRE_GAIN = 2400;

  function ecranCentre() {
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 CETTE LIGNE NE COMPTAIT QUE LES PV, ET LE SOIN RÉPARE TROIS CHOSES.
    //     `PokeMoteur.soigner` rend les PV, LÈVE LE STATUT et **refait tous
    //     les PP**. Une équipe à pleine vie mais paralysée, ou dont les
    //     attaques sont vides, était annoncée « Ton équipe est intacte. » —
    //     dans l'écran même où l'on choisit entre soigner et s'entraîner, et
    //     où l'autre porte se ferme pour de bon.
    //     C'est la classe que ce dossier a déjà nommée : un compte qui ne
    //     mesure pas ce dont la décision dépend.
    //  ⚠️ On compte donc CE QUE LE SOIN RÉPARE, ni plus ni moins. Ajouter un
    //     quatrième critère qui ne se soigne pas ici remettrait le même
    //     mensonge dans l'autre sens.
    // ═══════════════════════════════════════════════════════════════════════
    var blesses = 0, total = 0;
    for (var i = 0; i < partie.equipe.length; i++) {
      var m = partie.equipe[i];
      total++;
      var ppVides = false;
      for (var ia = 0; ia < (m.attaques || []).length; ia++) {
        if (m.attaques[ia] && m.attaques[ia].pp < m.attaques[ia].ppMax) { ppVides = true; break; }
      }
      if (m.pv < m.stats.pv || m.statut || ppVides) blesses++;
    }
    // 🔴 LE COMPTE DES PORTES SE FAIT UNE FOIS. Le titre énumère (« Soigner, ou
    //    s'entraîner »), le texte dénombre (« L'autre est perdue »), et la carte
    //    s'ajoute : trois endroits qui disent le même nombre. Les recalculer
    //    séparément, c'est se garantir un écran qui se contredit le jour où une
    //    porte s'ouvre. *Un titre qui énumère et un texte qui dénombre sont deux
    //    dettes qu'on contracte sans le savoir.*
    var troisPortes = boiteOuverte();
    coque(
      '<p class="pkdx-surtitre">' + T("nCentre") + "</p>" +
      '<h1 class="pkdx-titre">' + T(troisPortes ? "centreTitre3" : "centreTitre") + "</h1>" +
      '<p class="pkdx-dit">' + T(troisPortes ? "centreDit3" : "centreDit") + "</p>" +
      // 🔴 L'ÉTAT DE L'ÉQUIPE SE DIT AVANT LE CHOIX. Sans lui, « soigner ou
      //    entraîner » se décide à l'aveugle — et c'est justement le nombre de
      //    blessés qui tranche.
      // ⚠️ « 1 de tes 1 Pokémon est blessé » — vu à l'écran, et c'est du
      //    mauvais français. Quand TOUTE l'équipe est touchée, on le dit comme
      //    on le dirait à voix haute. Le pluriel automatique règle l'accord,
      //    pas la tournure.
      '<p class="pkdx-dit">' + T(!blesses ? "centreEntier"
        : blesses === total ? "centreTous" : "centreEtat",
        { n: blesses, t: total }) + "</p>" +
      // 🔴 LE NOMBRE DE COLONNES SUIT LE NOMBRE DE PORTES. La feuille posait
      //    « deux, pas trois » — c'était vrai le jour où elle a été écrite, et
      //    faux depuis que le PC de Léo en a ouvert une troisième : la grille
      //    rendait 2 + 1, une carte seule sous deux autres. Le mode a une
      //    grammaire de trois choix (butin, capsule, acquis, serment) et cet
      //    écran la cassait. Le compte est celui de `troisPortes`, pas un
      //    second : une grille qui recompte finit par contredire l'écran.
      '<div class="pkdx-butin pkdx-centre' + (troisPortes ? " est-trois" : "") + '">' +
        // 🔴 UN BOUTON GRISÉ DIT SA RAISON, et celui-ci ne l'était même pas :
        //    à équipe intacte, SOIGNER ne rend rien et FERME l'entraînement
        //    pour de bon. L'écran annonçait « Ton équipe n'a besoin de rien. »
        //    juste au-dessus et laissait la porte grande ouverte — il savait,
        //    et il ne le faisait pas.
        // 🔴 ET IL NE LISAIT PAS `centreInterdit`. L'acquis « Le pas de course »
        //    annonce « les Centres ne te soignent plus » et le Centre soignait
        //    quand même : la carte prenait un prix qu'elle n'annonçait pas (le
        //    sac de combat) et pas celui qu'elle annonçait. Le refus se dit
        //    ici, comme les autres.
        '<button type="button" class="pkdx-carte-butin" data-centre="soin"' +
          (blesses && !SERM().centreInterdit ? "" : " disabled") + ">" +
          '<span class="pkdx-butin-haut">' +
            '<span class="pkdx-butin-icone">' + W.PokeIcones.svg("centre", { taille: 32 }) + "</span>" +
          "</span>" +
          '<span class="pkdx-butin-nom">' + T("centreSoin") + "</span>" +
          '<span class="pkdx-butin-dit">' + T("centreSoinDit") + "</span>" +
          (SERM().centreInterdit
            ? '<span class="pkdx-butin-raison">' + T("centreJure") + "</span>"
            : blesses ? "" : '<span class="pkdx-butin-raison">' + T("centreSoinInutile") + "</span>") +
        "</button>" +
        '<button type="button" class="pkdx-carte-butin" data-centre="entrainer">' +
          '<span class="pkdx-butin-haut">' +
            '<span class="pkdx-butin-icone">' + W.PokeIcones.svg("dresseur", { taille: 32 }) + "</span>" +
          "</span>" +
          '<span class="pkdx-butin-nom">' + T("centreEntrainer") + "</span>" +
          '<span class="pkdx-butin-dit">' + T("centreEntrainerDit") + "</span>" +
        "</button>" +
        // La troisième porte n'existe que si elle mène quelque part : pas de
        // collection, équipe trop courte, Défi du jour ou échange déjà fait —
        // et la carte ne s'affiche pas. Une porte morte ment sur ce qu'on a.
        (troisPortes ?
          '<button type="button" class="pkdx-carte-butin" data-centre="boite">' +
            '<span class="pkdx-butin-haut">' +
              '<span class="pkdx-butin-icone">' + W.PokeIcones.svg("pokedex", { taille: 32 }) + "</span>" +
            "</span>" +
            '<span class="pkdx-butin-nom">' + T("centreBoite") + "</span>" +
            '<span class="pkdx-butin-dit">' +
              esc(T("centreBoiteDit", { qui: nomDe(partie.equipe[boitePlusFaible()]) })) + "</span>" +
          "</button>" : "") +
      "</div>"
    );
    surClic("[data-centre]", function (e) {
      var quoi = e.currentTarget.getAttribute("data-centre");
      if (quoi === "boite") return choixBoite();
      if (quoi === "soin") {
        for (var k = 0; k < partie.equipe.length; k++) M().soigner(partie.equipe[k]);
        son("HEAL_HP");
        return message(T("nCentre"), T("aSoin"));
      }
      choisirEntrainement();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE CHAQUE ENTRAÎNEMENT RAPPORTE VRAIMENT — ESSAI À BLANC
  //
  //  🔴 CINQ BOUTONS INTERCHANGEABLES. L'écran disait la magnitude (« environ
  //     six victoires ») et proposait ensuite cinq noms de statistique nus. Or
  //     le gain n'est PAS le même d'une statistique à l'autre ni d'une équipe à
  //     l'autre : la conversion de points d'effort passe par une racine, donc
  //     une statistique déjà travaillée rend beaucoup moins que la suivante, et
  //     un plafond à 25 600 peut rendre le gain NUL sans que rien ne le dise.
  //     Le joueur choisissait donc à l'aveugle entre cinq portes dont l'une
  //     pouvait ne rien donner du tout.
  //  🔴 ON NE DEVINE PAS, ON ESSAIE À BLANC. La même méthode que le sac de
  //     combat pour les potions : on applique le gain sur une COPIE, on
  //     recalcule, on lit la différence. Aucune règle recopiée, donc aucune
  //     règle qui puisse diverger du moteur.
  //  ⚠️ On somme sur toute l'équipe, parce que l'entraînement porte sur toute
  //     l'équipe. Un gain par créature ferait cinq colonnes de six chiffres là
  //     où une décision se prend sur un seul.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 ET « ZÉRO » A DEUX SENS QU'IL NE FAUT SURTOUT PAS CONFONDRE :
  //     · AU PLAFOND — les 25 600 points sont atteints, il n'y a plus rien à
  //       gagner, jamais. Le dire évite de dépenser un passage pour rien ;
  //     · ARRONDI À ZÉRO — le gain est bien versé, mais la conversion en points
  //       de statistique dépend du NIVEAU, et au niveau 5 elle rend moins d'un
  //       point. C'est un investissement banqué, pas une perte.
  //     Vu à l'écran sur ma propre première version : elle annonçait « rien »
  //     pour la Vitesse d'une équipe niveau 5, ce qui aurait détourné d'un
  //     choix parfaitement bon. Un chiffre juste, mal nommé, ment quand même.
  // ═══════════════════════════════════════════════════════════════════════════
  //  DE LA CASE D'EXPÉRIENCE VERS LA STATISTIQUE QU'ON VOIT
  //
  //  🔴 L'EXPÉRIENCE DE STATISTIQUE GARDE UNE SEULE CASE « SPÉ », comme le ROM
  //     — dans les deux mondes. Mais 1999 a SÉPARÉ la statistique en deux :
  //     `sat` et `sdf`. Les deux écrans qui annoncent un gain lisaient
  //     `stats["spe"]`, qui n'existe pas à Johto : ils affichaient « rien » sur
  //     un entraînement qui monte pourtant les DEUX statistiques spéciales.
  //     C'est le défaut que ce dossier traque à l'envers — non pas un réglage
  //     décoratif, mais un EFFET RÉEL que l'écran passe sous silence. Un joueur
  //     qui lit « +0 » n'y revient pas.
  //  ⚠️ On annonce la HAUSSE DE L'ATTAQUE SPÉCIALE : la Défense spéciale monte
  //     du même montant, puisqu'elle naît de la même case. Annoncer la somme
  //     doublerait le chiffre par rapport aux quatre autres lignes.
  // ═══════════════════════════════════════════════════════════════════════════
  function statVue(cle) {
    if (cle !== "spe" || !W.PokeRegles) return cle;
    return W.PokeRegles.speAtk();
  }

  function gainEntrainement(stat) {
    var total = 0, place = false;
    for (var k = 0; k < partie.equipe.length; k++) {
      var m = partie.equipe[k];
      if (!m || !m.statExp || !m.stats) continue;
      if ((m.statExp[stat] || 0) < 25600) place = true;
      var vue = statVue(stat);
      var avant = m.stats[vue] || 0;
      // La copie ne partage RIEN avec l'original : `statExp` est un objet, et
      // le muter reviendrait à entraîner l'équipe rien qu'en regardant l'écran.
      var faux = { n: m.n, niveau: m.niveau, dv: m.dv, statExp: {} };
      for (var q in m.statExp) faux.statExp[q] = m.statExp[q];
      faux.statExp[stat] = Math.min(25600, (faux.statExp[stat] || 0) + CENTRE_GAIN);
      var apres = M().calculerStats(faux)[vue] || 0;
      total += Math.max(0, apres - avant);
    }
    return { points: total, place: place };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'UNE VITAMINE DONNE À CE POKÉMON-LÀ — DIT AVANT LE CLIC
  //
  //  🔴 L'ACHAT LE PLUS CHER ET LE PLUS DÉFINITIF DU MODE (9 800 ₽) SE
  //     CHOISISSAIT SUR LES PV AFFICHÉS, un chiffre sans rapport, et le plafond
  //     n'était annoncé qu'APRÈS le clic. La loi de l'écran des capsules — « ce
  //     qui se consomme se dit AVANT » — sautait ici.
  //  ⚠️ MÊME SIMULATION QUE `gainEntrainement` : une COPIE, jamais l'original.
  //     Muter `statExp` reviendrait à entraîner l'équipe rien qu'en affichant
  //     l'écran, et c'est la faute que le voisin documente déjà.
  //  ⚠️ UN GAIN DE ZÉRO N'EST PAS UN REFUS : le stat-exp monte sans que la
  //     statistique bouge tant que le niveau ne repasse pas. Les deux se disent
  //     différemment, sinon le joueur croit son argent perdu.
  // ═══════════════════════════════════════════════════════════════════════════
  function gainDeVitamine(mon, stat) {
    if (!mon || !mon.statExp || !mon.stats) return { gain: 0, plafond: false };
    var pas = O().VITAMINE_GAIN || 2560;
    var actuel = mon.statExp[stat] || 0;
    if (actuel >= 25600) return { gain: 0, plafond: true };
    var faux = { n: mon.n, niveau: mon.niveau, dv: mon.dv, statExp: {} };
    for (var q in mon.statExp) faux.statExp[q] = mon.statExp[q];
    faux.statExp[stat] = Math.min(25600, actuel + pas);
    var vue = statVue(stat);
    var apres = M().calculerStats(faux)[vue] || 0;
    return { gain: Math.max(0, apres - (mon.stats[vue] || 0)), plafond: false };
  }

  function choisirEntrainement() {
    coque(
      '<p class="pkdx-surtitre">' + T("nCentre") + "</p>" +
      '<h1 class="pkdx-titre">' + T("centreQuoi") + "</h1>" +
      '<p class="pkdx-dit">' + T("centreQuoiDit") + "</p>" +
      '<div class="pkdx-actions pkdx-centre-stats">' + CENTRE_STATS.map(function (s) {
        var g = gainEntrainement(s);
        // ⚠️ Trois états, trois écritures : un gain visible se chiffre ; un
        //    plafond se NOMME (rien n'en sortira plus jamais) ; un gain qui
        //    s'arrondit à zéro au niveau actuel ne s'écrit pas du tout — le
        //    marquer d'un « +0 » le ferait passer pour inutile alors qu'il est
        //    banqué, et l'écran dit déjà « il ne se perd plus ».
        var marque = !g.place ? T("centrePlafond") : (g.points > 0 ? "+" + g.points : "");
        return '<button type="button" class="pkdx-touche" data-stat="' + s + '">' +
          nomStatEntrainement(s) +
          (marque ? ' <b class="pkdx-gain-stat">' + marque + "</b>" : "") +
        "</button>";
      }).join("") + "</div>"
    );
    surClic("[data-stat]", function (e) {
      var s = e.currentTarget.getAttribute("data-stat");
      for (var k = 0; k < partie.equipe.length; k++) {
        var m = partie.equipe[k];
        if (!m.statExp) continue;
        // 🔴 LE MÊME PLAFOND QUE LES VITAMINES — 25 600. Au-delà, la racine du
        //    calcul d'origine ne rend plus rien : verser davantage donnerait un
        //    gain annoncé et nul, ce que ce dossier traque partout.
        m.statExp[s] = Math.min(25600, (m.statExp[s] || 0) + CENTRE_GAIN);
        m.stats = M().calculerStats(m);
      }
      son("GET_ITEM_1");
      message(T("nCentre"), T("centreFait", { stat: nomStat(s) }));
    });
  }

  function nomDe(m) { return m.surnom || ESP()[m.n].nom[LANG()]; }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CAMION — LE MYTHE, ET CE QU'IL FAUT POUR LE RENDRE VRAI
  //
  //  🔴 IL NE DONNE RIEN, TROIS FOIS SUR QUATRE, ET C'EST VOULU. Un nœud qui
  //     n'apparaît qu'une fois la condition remplie ne serait pas un mythe : ce
  //     serait une récompense qu'on n'a jamais vue venir. Celui-ci se croise à
  //     chaque voyage, il dit exactement où l'on en est, et un jour il ne dit
  //     plus la même chose.
  //  🔴 MEW SORT AU NIVEAU 7, comme dans la rumeur d'origine. Ce n'est pas une
  //     arme qu'on gagne au bout de cent cinquante espèces — c'est la dernière
  //     case du Pokédex, et le voyage continue après le paquebot : un Mew pris
  //     à l'acte trois a six actes pour grandir.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranCamion(n) {
    var my = W.PokeDepart.mythe();
    if (my.etat === "mew") {
      var mew = M().creer(W.PokeDepart.MEW, 7, hasard, { capture: { zone: n.etape, niveau: 7 } });
      P().voir(partie, mew.n);
      return message(T("nCamion"), T("camionMew"), function () {
        lancerCombat([mew], { dresseur: false, zone: n.etape, legendaire: W.PokeDepart.MEW });
      });
    }
    // Le reste à parcourir se calcule ici, une fois : `mythe()` rend le total
    // et le compte, et deux soustractions dans deux écrans finiraient par ne
    // plus dire la même chose.
    var dit = T(my.etat === "remue" ? "camionRemue" : "camionRien") +
      " " + T("camionCompte", { n: my.pris }) +
      (my.etat === "remue"
        ? " " + T("camionSeuil", { n: Math.max(1, my.total - my.pris) })
        : "");
    son("DENIED");
    return message(T("nCamion"), dit);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE DUEL — AFFRONTER UN AUTRE DRESSEUR, SANS SERVEUR
  //
  //  🔴 LE MOTEUR ÉTAIT COMPLET ET N'AVAIT PAS UN BOUTON. `js/poke/duel.js`
  //     sait sceller une équipe, la valider, la reconstituer, dériver une graine
  //     partagée et résoudre le combat des deux côtés — écrit, éprouvé, exporté,
  //     et appelé nulle part. Le mode avait un PvP entier et aucune porte.
  //
  //  🔴 ET IL N'A PAS BESOIN DU SERVEUR. Une équipe scellée tient en cent
  //     cinquante caractères : c'est un CODE qu'on colle dans un message. L'autre
  //     le colle chez lui, et les deux calculent le même duel — la graine ne
  //     dépend que des deux noms et du jour. Rien à héberger, rien à attendre.
  //     C'est ce qui permet de livrer le PvP aujourd'hui, alors que le serveur
  //     exclut délibérément `poke` de ses écritures tant que le mode est fermé.
  //
  //  🔴 RIEN DU COMPTE N'ENTRE ICI. Ni sac, ni badge, ni compagnon : `sceller`
  //     ne recopie que ce qui vient du voyage, et l'écran de combat retire le
  //     sac et la fuite. C'est la règle du projet — rien ne pèse là où l'on se
  //     compare — et c'est aussi ce qui rend le duel lisible : ce qu'on voit à
  //     l'écran avant de lancer est TOUT ce qui décide.
  // ═══════════════════════════════════════════════════════════════════════════

  // Un visage pour un nom. 🔴 DÉRIVÉ, JAMAIS TIRÉ : le même dresseur doit
  //    porter le même visage chez lui et chez son adversaire, aujourd'hui et
  //    dans un mois. `PokeHasard` sert ici de fonction de hachage — c'est la
  //    porte unique du projet pour tout ce qui doit être reproductible.
  var DUEL_VISAGES = [
    "cooltrainerm", "cooltrainerf", "rival1", "rival2", "rival3",
    "blackbelt", "psychic", "tamer", "biker", "juggler", "swimmer", "lass",
  ];
  function visageDe(nom) {
    return DUEL_VISAGES[new W.PokeHasard("POKE-VISAGE-" + String(nom).toLowerCase())
      .entier(DUEL_VISAGES.length)];
  }

  // 🔴 LE JOUR FAIT PARTIE DE LA GRAINE. Sans lui, deux dresseurs rejoueraient
  //    éternellement le même duel automatique : un verdict figé, et plus aucune
  //    raison de revenir. Avec, le duel se renouvelle chaque jour sans qu'on ait
  //    à stocker quoi que ce soit.
  function jourDuel() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  // 🔴 CHAQUE REFUS DIT QUOI FAIRE. « Code invalide » renvoie le joueur à
  //    lui-même ; « ce code vient d'une version antérieure » lui dit d'en
  //    demander un neuf. Les codes viennent de `PokeDuel.valider` et de
  //    `PokeDuel.decoder`, et `tools/poke-duel.mjs` vérifie qu'aucun n'est
  //    orphelin — sinon le joueur tomberait sur le refus fourre-tout.
  function refusDuel(err) {
    if (err === "code_vide") return T("duelRVide");
    if (err === "code_illisible") return T("duelRIllisible");
    if (err === "code_perime") return T("duelRPerime");
    if (err === "scelle_invalide") return T("duelRIllisible");
    if (err === "equipe_trop_grande") return T("duelREquipe");
    if (err === "espece_inconnue") return T("duelREspece");
    if (err === "niveau_hors_bornes") return T("duelRNiveau");
    if (err === "attaques_invalides" || err === "attaque_inconnue") return T("duelRAttaque");
    if (err === "dv_hors_bornes") return T("duelRDv");
    if (err === "duel_sans_fin") return T("duelRSansFin");
    return T("duelRAutre");
  }

  function ecranDuel() {
    partie = null;
    var mien = W.PokeProgression.equipeDuel();
    var lu = null;    // le code adverse une fois lu : { nom, scelle }

    function equipeHtml(scelle) {
      return '<div class="pkdx-duel-equipe">' + scelle.equipe.map(function (m) {
        var e = ESP()[m.n];
        return '<div class="pkdx-carte-mon pkdx-duel-mon"' + W.PokeType.attr(e.types[0]) + ">" +
          '<img alt="" loading="lazy" src="' + W.PokeSprites.face(m.n, "?i=6") + '"' +
            (W.PokeEclat && W.PokeEclat.chromatique(m.dv) ? ' data-chromatique="oui"' : "") + ">" +
          "<b>" + esc(e.nom[LANG()]) + "</b>" +
          '<span class="pkdx-niveau">' + W.PokeGenre.niveau(m.niveau) + "</span>" +
          '<span class="pkdx-duel-types">' +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") + "</span>" +
        "</div>";
      }).join("") + "</div>";
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LE FACE-À-FACE — NEUF LIGNES, ET AUCUNE COULEUR POUR DIRE QUI MÈNE
    //
    //  🔴 UNE SEULE SOURCE POUR LES DEUX COLONNES. La mienne vient de
    //     `PokeProgression.palmares()`, la sienne du code qu'il m'a envoyé —
    //     produit par la MÊME fonction chez lui. Deux lectures différentes du
    //     même palmarès donneraient deux face-à-face contradictoires selon
    //     l'écran qui regarde.
    //  🔴 LE MARQUEUR EST UNE FORME, PAS UNE TEINTE. Voir `duelPalm`.
    //  ⚠️ ÉGALITÉ = PERSONNE EN TÊTE. Marquer les deux côtés d'une ligne à
    //     égalité fait lire « nous avons tous les deux gagné » là où il ne
    //     s'est rien passé.
    // ═══════════════════════════════════════════════════════════════════════
    var PALM_RANGS_ORDRE = ["debutant", "dresseur", "confirme", "ligue", "maitre"];

    function palmaresLignes(a, b) {
      function nomRang(cle) {
        return T("rang" + String(cle || "debutant").charAt(0).toUpperCase() + String(cle || "debutant").slice(1));
      }
      return [
        { t: "duelPalmVoyages", a: a.voyages, b: b.voyages },
        { t: "duelPalmLigues", a: a.ligues, b: b.ligues },
        { t: "duelPalmBadges", a: a.badges, b: b.badges, sur: 8 },
        { t: "duelPalmScore", a: a.score, b: b.score },
        { t: "duelPalmPokedex", a: a.pokedex, b: b.pokedex, sur: 151 },
        { t: "duelPalmChroma", a: a.chromatiques, b: b.chromatiques },
        {
          t: "duelPalmSceau", a: a.sceau, b: b.sceau,
          dire: function (n) { return n ? String(n) : T("duelPalmSceauNul"); },
        },
        { t: "duelPalmChasses", a: a.chasses, b: b.chasses },
        // 🔴 CES DEUX LIGNES PORTENT DES MOTS, PAS DES NOMBRES, et c'est une
        //    différence de MISE EN PAGE : « Champion de la Ligue » insécable
        //    faisait un tableau de 424 px dans un écran de 390 — mesuré, la page
        //    entière partait en défilement horizontal. Un nombre ne se coupe
        //    jamais, une phrase le doit.
        {
          t: "duelPalmRang", mot: true,
          a: PALM_RANGS_ORDRE.indexOf(a.rang), b: PALM_RANGS_ORDRE.indexOf(b.rang),
          dire: function (n) { return nomRang(PALM_RANGS_ORDRE[n < 0 ? 0 : n]); },
        },
        {
          t: "duelPalmDiplome", mot: true, a: a.diplome ? 1 : 0, b: b.diplome ? 1 : 0,
          dire: function (n) { return T(n ? "duelPalmOui" : "duelPalmNon"); },
        },
      ];
    }

    function palmaresHtml(sien, nom) {
      var mienP = W.PokeProgression.palmares();
      if (!sien) {
        return '<h2 class="pkdx-soustitre">' + T("duelPalm") + "</h2>" +
          '<p class="pkdx-dit est-note">' + T("duelPalmAbsent") + "</p>";
      }
      var lignes = palmaresLignes(mienP, sien);
      return '<h2 class="pkdx-soustitre">' + T("duelPalm") + "</h2>" +
        '<p class="pkdx-dit est-note">' + T("duelPalmDit") + "</p>" +
        '<table class="pkdx-palm">' +
          "<thead><tr><th></th>" +
            "<th>" + T("duelPalmMoi") + "</th>" +
            "<th>" + esc(capital(nom)) + "</th>" +
          "</tr></thead><tbody>" +
          lignes.map(function (l) {
            // 🔴 « EN TÊTE » EST DIT, PAS SEULEMENT DESSINÉ. Le jeton plein est
            //    une forme : elle ne traverse pas un lecteur d'écran. Le mot
            //    part donc dans le titre de la cellule, où il se lit sans
            //    encombrer la colonne — un `aria-label` sur un `<td>` n'est
            //    annoncé nulle part de façon fiable.
            function cellule(v, mene) {
              var texte = l.dire ? l.dire(v) : String(v) + (l.sur ? " / " + l.sur : "");
              return "<td" + (l.mot ? ' data-mot="oui"' : "") +
                (mene ? ' data-mene="oui" title="' + T("duelPalmMene") + '"' : "") + ">" +
                "<b>" + esc(texte) + "</b>" +
                (mene ? '<span class="pkdx-palm-dit"> ' + T("duelPalmMene") + "</span>" : "") +
                "</td>";
            }
            return "<tr><th scope=\"row\">" + T(l.t) + "</th>" +
              cellule(l.a, l.a > l.b) + cellule(l.b, l.b > l.a) + "</tr>";
          }).join("") +
        "</tbody></table>";
    }

    // On annonce SANS redessiner : un rendu complet effacerait le code que le
    // joueur vient de coller, et lui ferait recommencer pour lire un message.
    function annoncer(texte) {
      var el = racine.querySelector("#pk-duel-dit");
      if (el) el.innerHTML = texte;
    }

    // Le visage d'un dresseur canon vient de la MÊME table d'ordre que partout
    // ailleurs : les fichiers portent les noms anglais, nos données les noms
    // français, et seul l'ordre du ROM fait le pont sans se tromper.
    function visageDefi(d) {
      if (d.rang === "arene") return VISAGE_ARENE()[d.ordre - 1];
      if (d.rang === "conseil") return VISAGE_CONSEIL()[d.ordre - 1];
      return VISAGE_MAITRE();
    }
    // 🔴 LE NOM SE RÉSOUT ICI, PAS DANS LA LISTE. `PokeDuel.defis()` mémoïse sa
    //    table ; un nom de Champion rangé dedans serait figé dans la langue du
    //    premier appel — vu à l'écran : la liste restait en français après
    //    bascule. On y garde la FICHE, et l'écran la lit.
    //    ⚠️ Une arène porte `champion`/`championEn`, un membre du Conseil 4
    //       porte `nom`/`nomEn`. Une seule porte les distingue, sinon deux
    //       écrans finiraient par nommer les mêmes gens de deux façons.
    function nomDefi(d) {
      var f = d.fiche;
      if (!f) return T("duelMaitre");
      if (f.champion) return W.PokeGenre.nomChampion(f);
      return ((W.POKE_LANG || "fr") === "en" && f.nomEn) || f.nom || T("duelMaitre");
    }
    // Un nom qui ouvre une phrase ou porte un titre prend sa majuscule ; le même
    // nom au milieu d'une phrase garde la sienne. Les douze premiers sont des
    // prénoms — la fonction ne leur fait rien.
    function capital(s) { return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : s; }
    function rangDefi(d) {
      return T(d.rang === "arene" ? "duelRangArene"
        : d.rang === "conseil" ? "duelRangConseil" : "duelRangMaitre");
    }

    function defisHtml() {
      var palmares = W.PokeProgression.palmaresDefis();
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 UNE ÉCHELLE DE TREIZE SANS SON COMPTE. La section annonçait
      //     « Treize dresseurs t'attendent » et alignait treize cartes, chacune
      //     marquée « jamais affronté » ou non — mais nulle part le TOTAL. Le
      //     joueur devait compter les cartes à l'œil pour savoir où il en est,
      //     sur la seule échelle du mode qui mène au rang de Maître.
      //     `palmaresDefis()` porte la réponse depuis toujours ; elle servait
      //     uniquement à marquer chaque carte, jamais à faire une somme.
      //  ⚠️ On compte les VICTOIRES, pas les rencontres : « affronté » n'est pas
      //     « vaincu », et c'est vaincre qui fait monter le rang.
      var defis = W.PokeDuel.defis();
      var battus = 0;
      for (var di = 0; di < defis.length; di++) {
        var e = palmares[defis[di].id];
        if (e && e.v > 0) battus++;
      }
      return '<h2 class="pkdx-soustitre">' + T("duelDefis") + "</h2>" +
        '<p class="pkdx-dit est-note">' + T("duelDefisDit") + " " +
          esc(battus === 0
            ? T("duelDefisAucun")
            : T("duelDefisCompte", { n: battus, t: defis.length })) + "</p>" +
        '<ul class="pkdx-duel-defis">' + W.PokeDuel.defis().map(function (d, i) {
          var niv = d.brut.map(function (x) { return x.niveau; });
          var p = palmares[d.id];
          return "<li>" + visage(visageDefi(d), 44) +
            '<span class="pkdx-duel-qui">' +
              "<b>" + esc(capital(nomDefi(d))) + "</b>" +
              "<i>" + rangDefi(d) + "</i>" +
              "<em>" + T("duelNiveaux", {
                a: Math.min.apply(null, niv), b: Math.max.apply(null, niv), n: niv.length,
              }) + "</em>" +
            "</span>" +
            // 🔴 « JAMAIS AFFRONTÉ » PLUTÔT QUE « 0 V — 0 D ». Deux zéros se
            //    lisent comme un score ; la phrase dit qu'il reste à faire.
            '<span class="pkdx-duel-bilan">' +
              (p ? T("duelBilan", { v: p.v, d: p.d }) : T("duelJamais")) + "</span>" +
            '<button type="button" class="pkdx-touche" data-defi="' + i + '">' +
              T("duelDefier") + "</button>" +
          "</li>";
        }).join("") + "</ul>";
    }

    function rendre() {
      var carnet = W.PokeProgression.carnet();
      coque(
        '<p class="pkdx-surtitre">' + T("duelSur") + "</p>" +
        '<h1 class="pkdx-titre">' + T("duelTitre") + "</h1>" +
        '<p class="pkdx-dit" id="pk-duel-dit">' + T(mien ? "duelDit" : "duelSansEquipe") + "</p>" +

        // 🔴 LE RANG VIT ICI AUSSI, et pas par décoration : les défis de Kanto
        //    sont la voie du dernier palier. Le joueur doit lire, sur l'écran
        //    même où il choisit son adversaire, ce que cet adversaire lui
        //    rapporte. Un objectif nommé ailleurs n'est pas un objectif.
        '<div class="pkdx-rang">' +
          "<dt>" + T("cRang") + "</dt>" +
          "<dd>" + esc(rangDit().nom) + "</dd>" +
          "<p>" + esc(rangDit().vers) + "</p>" +
        "</div>" +

        (mien
          ? '<h2 class="pkdx-soustitre">' + T("duelMonEquipe") + " · " +
              T("duelBadges", { n: mien.badges }) + "</h2>" +
            equipeHtml(mien.scelle) +
            // ═══════════════════════════════════════════════════════════════
            //  🔴 ELLE SE REFAIT À CHAQUE BADGE, ET PERSONNE NE LE SAIT. Le
            //     joueur voit « Florizarre N.32 · Roucool N.3 · Roucool N.3 »
            //     et n'a aucun moyen de deviner ce qui décide de cette liste :
            //     ni QUAND elle a été prise, ni qu'elle est reprise au badge
            //     suivant, ni qu'elle suit l'ORDRE de l'équipe — que
            //     « Mettre en tête » sait déjà changer.
            //     Trois faits que le jeu connaît, aucun qu'il ne disait, sur
            //     l'écran où l'on se présente aux autres.
            //  ⚠️ ON DIT LE LEVIER, PAS UN CONSEIL. « Va gagner un badge » est
            //     un ordre ; « elle se refait à chaque badge » est une règle du
            //     monde, et le joueur en tire ce qu'il veut.
            // ═══════════════════════════════════════════════════════════════
            '<p class="pkdx-dit">' + T("duelScelleQuand") + "</p>" +
            '<h2 class="pkdx-soustitre">' + T("duelMonCode") + "</h2>" +
            '<div class="pkdx-duel-code">' +
              '<textarea id="pk-duel-mien" class="pkdx-champ est-code" readonly rows="3"' +
                ' aria-label="' + T("duelMonCode") + '">' +
                esc(W.PokeDuel.coder(mien.scelle, mien.nom, W.PokeProgression.palmares())) + "</textarea>" +
              '<button type="button" class="pkdx-touche" id="pk-duel-copier">' + T("duelCopier") + "</button>" +
            "</div>"
          : "") +

        // 🔴 LE PC S'OUVRE D'ICI, ET PAS DE L'ACCUEIL. Demande de Poltron_sofa :
        //    composer son équipe de duel depuis tout ce qu'on a élevé. Le besoin
        //    naît DEVANT son équipe de duel, pas sur la porte d'entrée — et
        //    l'accueil porte déjà six boutons.
        '<div class="pkdx-actions">' +
          '<button type="button" class="pkdx-touche" id="pk-duel-pc">' + T("pcCompteOuvrir") + "</button>" +
        "</div>" +

        '<h2 class="pkdx-soustitre">' + T("duelAdverse") + "</h2>" +
        '<div class="pkdx-duel-code">' +
          '<textarea id="pk-duel-colle" class="pkdx-champ est-code" rows="3"' +
            ' placeholder="' + T("duelColler") + '" aria-label="' + T("duelAdverse") + '"></textarea>' +
          '<button type="button" class="pkdx-touche" id="pk-duel-lire">' + T("duelLire") + "</button>" +
        "</div>" +

        (lu
          ? '<div class="pkdx-duel-face">' + visage(visageDe(lu.nom), 72) +
              "<div>" +
                "<h2>" + esc(capital(lu.nom)) + "</h2>" +
                "<p>" + T("duelFace", { nom: esc(capital(lu.nom)) }) + "</p>" +
              "</div>" +
            "</div>" +
            equipeHtml(lu.scelle) +
            // 🔴 PAS DE FACE-À-FACE AVEC UN CHAMPION DU JEU. Un dresseur canon
            //    n'a pas de carrière : lui en inventer une (« Ondine, 0 voyage »)
            //    dirait au joueur qu'il vient de battre quelqu'un qui n'a jamais
            //    joué. Le bloc n'apparaît qu'entre deux VRAIS comptes.
            (lu.defi ? "" : palmaresHtml(lu.palmares, lu.nom)) +
            (mien
              ? '<div class="pkdx-actions">' +
                  '<button type="button" class="pkdx-touche est-definitive" id="pk-duel-go">' +
                    T("duelCombattre") + "</button>" +
                  '<button type="button" class="pkdx-touche" id="pk-duel-auto">' + T("duelAuto") + "</button>" +
                "</div>" +
                '<p class="pkdx-dit est-note">' + T("duelAutoDit") + "</p>"
              : "")
          : "") +

        (mien ? defisHtml() : "") +

        (carnet.length
          ? '<h2 class="pkdx-soustitre">' + T("duelCarnet") + "</h2>" +
            '<ul class="pkdx-duel-carnet">' + carnet.map(function (r, i) {
              return "<li>" + visage(visageDe(r.nom), 40) +
                "<b>" + esc(capital(r.nom)) + "</b>" +
                '<span class="pkdx-duel-bilan">' + T("duelBilan", { v: r.v, d: r.d }) + "</span>" +
                '<button type="button" class="pkdx-touche" data-rival="' + i + '">' +
                  T("duelRevanche") + "</button>" +
              "</li>";
            }).join("") + "</ul>"
          : "") +

        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche" id="pk-duel-retour">' + T("retour") + "</button>" +
        "</div>"
      );

      var copier = racine.querySelector("#pk-duel-copier");
      if (copier) copier.addEventListener("click", function () {
        // 🔴 UNE SEULE PORTE POUR LE PRESSE-PAPIER, dans `PokeCarte`. Cet écran
        //    en avait sa propre copie ; la Vitrine en aurait fait une troisième.
        //    Deux implémentations d'un même geste finissent par ne plus se
        //    comporter pareil, et celle qu'on ne teste pas est celle qui casse.
        var champ = racine.querySelector("#pk-duel-mien");
        var ok = W.PokeCarte.copier(champ.value, champ);
        son(ok ? "GET_ITEM_1" : "DENIED");
        annoncer(T(ok ? "duelCopie" : "duelCopieRate"));
      });

      racine.querySelector("#pk-duel-lire").addEventListener("click", function () {
        var r = W.PokeDuel.decoder(racine.querySelector("#pk-duel-colle").value);
        if (r.err) { son("DENIED"); return annoncer(refusDuel(r.err)); }
        if (mien && String(r.nom).trim().toLowerCase() === String(mien.nom).trim().toLowerCase()) {
          son("DENIED");
          return annoncer(T("duelMoi"));
        }
        lu = { nom: r.nom || "?", scelle: r.scelle, defi: null, palmares: r.palmares };
        W.PokeProgression.inscrireRival(lu.nom, lu.scelle, null, r.palmares);
        son("PRESS_AB");
        rendre();
      });

      surClic("[data-defi]", function (e) {
        var d = W.PokeDuel.defis()[+e.currentTarget.getAttribute("data-defi")];
        if (!d) return;
        // 🔴 SON IDENTIFIANT N'EST PAS SON NOM. Un joueur qui s'appelle Pierre
        //    affronterait « Pierre » : la graine du duel et le vainqueur rendu
        //    par `jouer` deviendraient ambigus. Le préfixe les sépare.
        lu = { nom: nomDefi(d), scelle: W.PokeDuel.scellerDefi(d), defi: d.id };
        son("PRESS_AB");
        rendre();
      });

      surClic("[data-rival]", function (e) {
        var r = W.PokeProgression.carnet()[+e.currentTarget.getAttribute("data-rival")];
        if (!r || !r.scelle) return;
        lu = { nom: r.nom, scelle: r.scelle, defi: null, palmares: r.palmares || null };
        son("PRESS_AB");
        rendre();
      });

      var go = racine.querySelector("#pk-duel-go");
      if (go) go.addEventListener("click", function () { combattre(false); });
      var auto = racine.querySelector("#pk-duel-auto");
      if (auto) auto.addEventListener("click", function () { combattre(true); });
      var bPc = racine.querySelector("#pk-duel-pc");
      if (bPc) bPc.addEventListener("click", function () { son("PRESS_AB"); ecranPc(ecranDuel); });
      racine.querySelector("#pk-duel-retour").addEventListener("click", function () {
        son("PRESS_AB");
        accueil();
      });
    }

    function conclure(gagne, suite) {
      var avant = W.PokeProgression.rang().cle;
      // Deux palmarès, et ils ne veulent pas dire la même chose : un Champion se
      // rejoue à l'infini, un joueur se retrouve.
      if (lu.defi) W.PokeProgression.noterDefi(lu.defi, gagne);
      else W.PokeProgression.noterDuel(lu.nom, gagne);
      son(gagne ? "POKEDEX_RATING" : "DENIED");
      // 🔴 « Tu bats le Maître. » mais « Le Maître te bat. » — le nom prend sa
      //    majuscule quand il OUVRE la phrase, et pas quand il la termine.
      var dit = (gagne
        ? T("duelGagne", { nom: esc(lu.nom) })
        : T("duelPerdu", { nom: esc(capital(lu.nom)) })) + (suite ? " " + suite : "");
      // 🔴 UN CHANGEMENT DE RANG NE PASSE PAS DANS UNE PHRASE DE RÉSULTAT. Battre
      //    le Maître est le dernier palier du mode : le noyer dans « Tu bats Le
      //    Maître. 16 tours. » reviendrait à ne rien dire. Il a son écran, et
      //    lui seul — les autres duels rendent la main tout de suite.
      if (avant !== W.PokeProgression.rang().cle) return ecranRangMonte(dit);
      message(T("duel"), dit, function () { ecranDuel(); });
    }

    function ecranRangMonte(dit) {
      var r = rangDit();
      son("POKEDEX_RATING");
      coque(
        '<p class="pkdx-surtitre">' + T("duelSur") + "</p>" +
        '<div class="pkdx-rang est-sacre">' +
          "<dt>" + T("rangMonte") + "</dt>" +
          "<dd>" + esc(r.nom) + "</dd>" +
          "<p>" + esc(r.vers) + "</p>" +
        "</div>" +
        '<p class="pkdx-dit">' + dit + "</p>" +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-suivant">' + T("suite") + "</button>" +
        "</div>"
      );
      racine.querySelector("#pk-suivant").addEventListener("click", function () {
        son("PRESS_AB");
        ecranDuel();
      });
    }

    function combattre(auto) {
      if (!mien || !lu) return;
      var jour = jourDuel();
      // 🔴 UN DÉFI CANON N'EST PAS UN NOM DE JOUEUR. Sans ce préfixe, un joueur
      //    nommé Pierre affrontant Pierre donnerait une graine « Pierre-Pierre »
      //    et un vainqueur que `jouer` ne saurait pas désigner.
      var idAdverse = lu.defi ? "@" + lu.defi : lu.nom;

      if (auto) {
        // 🔴 LE VERDICT PARTAGÉ. Les deux équipes se battent avec LA MÊME
        //    politique, et la graine ne dépend que des deux noms et du jour :
        //    l'autre dresseur lit exactement le même vainqueur sur son écran.
        //    C'est ce qui rend le résultat opposable sans aucun serveur.
        var r = W.PokeDuel.jouer(mien.scelle, lu.scelle, mien.nom, idAdverse, jour);
        if (r.err) { son("DENIED"); return annoncer(refusDuel(r.err)); }
        return conclure(String(r.vainqueur) === String(mien.nom), T("duelTours", { n: r.tours }));
      }

      var h = new W.PokeHasard(W.PokeDuel.graineDuel(mien.nom, idAdverse, jour));
      var etat = C().demarrer(
        W.PokeDuel.reconstituer(mien.scelle, h),
        W.PokeDuel.reconstituer(lu.scelle, h),
        { dresseur: true }, h
      );
      new W.PokeUICombat.Ecran(hote("pk-duel-combat"), etat, {
        rythme: W.POKE_RYTHME || rythmeActuel(),
        hasard: h,
        // 🔴 PAS DE PARTIE : rien à consommer, rien à faire monter. Un duel ne
        //    touche ni au sac, ni à l'expérience, ni au Pokédex.
        duel: true,
        politiqueAdverse: function (e, hh) { return W.PokeDuel.choisir(e, "adverse", hh); },
        surFin: function (issue) { conclure(issue === "victoire", null); },
      });
    }

    rendre();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES VISAGES
  //
  //  🔴 LES CRÉATURES AVAIENT LEURS 151 SPRITES, LES HUMAINS AUCUN. Un nœud
  //     « DRESSEUR » portait un pictogramme abstrait, et l'écran d'arène donnait
  //     le nom du Champion sans son visage. Dans un jeu Pokémon, un dresseur EST
  //     une silhouette : on reconnaît le Pêcheur, le Motard, Ondine ou Giovanni
  //     avant d'avoir lu. L'interface était plus pauvre que celle de 1996.
  //
  //  🔴 L'ORDRE EST LE SEUL PONT SÛR. Nos données nomment les Champions en
  //     français — « Pierre », « Ondine » — quand les fichiers portent les noms
  //     anglais. L'ordre des huit arènes, lui, est une donnée du ROM qui ne
  //     bouge pas : le déduire d'un nom traduit donnerait le visage d'un autre.
  //     Même liste que dans `tools/poke-dresseurs-sprites.mjs`, même raison.
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 CES DEUX LISTES ÉTAIENT DES CONSTANTES, et elles nommaient Kanto. Sous
  //    Johto, la carte d'acte posait le visage de Pierre sur l'arène d'Albert
  //    et les quatre de l'Indigo sur le Conseil de 1999. Les portraits existent
  //    depuis qu'on a monté le monde ; c'est l'écran qui ne savait pas où
  //    regarder. Le registre les nomme désormais, monde par monde.
  function VISAGE_ARENE() { return ((W.PokeRegles && W.PokeRegles.visages()) || {}).arene || []; }
  function VISAGE_CONSEIL() { return ((W.PokeRegles && W.PokeRegles.visages()) || {}).conseil || []; }
  function VISAGE_MAITRE() { return ((W.PokeRegles && W.PokeRegles.visages()) || {}).maitre || "rival3"; }

  function visageRival(rencontre) {
    var cleMonde = (partie && W.PokeRegles && W.PokeRegles.de) ? W.PokeRegles.de(partie)
      : (W.PokeRegles && W.PokeRegles.courant ? W.PokeRegles.courant() : "gen1");
    if (cleMonde === "gen3") {
      var genre = (partie && partie.genre) || W.POKE_GENRE || "h";
      return genre === "f" ? "gen3/dresseur/brendan" : "gen3/dresseur/may";
    }
    return "rival" + Math.min(3, Math.floor(((rencontre && rencontre.rencontre) || rencontre || 0) / 3) + 1);
  }

  //  ⚠️ UNE BARRE OBLIQUE DIT « CE CHEMIN EST COMPLET ». Les classes de route
  //     et les trois visages du rival restent des noms nus, servis depuis le
  //     dossier de 1996 : c'est ce qui permet d'ajouter un monde sans toucher
  //     à un seul de leurs appels.
  function visage(nom, taille) {
    if (!nom) return "";
    var cleMonde = (partie && W.PokeRegles && W.PokeRegles.de) ? W.PokeRegles.de(partie)
      : (W.PokeRegles && W.PokeRegles.courant ? W.PokeRegles.courant() : "gen1");
    var src;
    var repli = "";
    if (nom.indexOf("/") >= 0) {
      src = "assets/img/poke/" + nom + ".png";
    } else if (cleMonde === "gen3") {
      src = "assets/img/poke/gen3/dresseur/" + nom + ".png";
      repli = ' onerror="this.onerror=null;this.src=\'assets/img/poke/dresseur/' + esc(nom) + '.png\';"';
    } else {
      src = "assets/img/poke/dresseur/" + nom + ".png";
    }
    return '<img class="pkdx-visage" alt="" loading="lazy" width="' + (taille || 56) +
      '" src="' + src + '"' + repli + '>';
  }
  // La classe d'un dresseur de route : sa clé anglaise donne son fichier, par la
  // même règle que l'outil qui les a rapatriés — minuscules, sans espace.
  function visageClasse(cle) {
    if (!cle) return "";
    var f = String(cle).toLowerCase().replace(/[^a-z0-9.]/g, "");
    if (f === "jrtrainerm") f = "jr.trainerm";
    if (f === "jrtrainerf") f = "jr.trainerf";
    return f;
  }

  // 🔴 LE BOUTON DE SORTIE DIT OÙ IL VA. Le sac s'ouvre depuis la carte ET
  //    depuis l'arène ; « RETOUR À LA CARTE » écrit en dur mentait dans le
  //    second cas — on revient devant le Champion, pas sur la carte.
  function ecranSac(apres, cleRetour) {
    var sac = partie.sac || {};

    function rendre(dit) {
      // ═══════════════════════════════════════════════════════════════════════
      //  UN OBJET DU SAC EST UN ARTICLE, COMME À LA BOUTIQUE — critique du 14/08
      //
      //  🔴 CE QU'IL ÉTAIT : un `.pkdx-etape`, c'est-à-dire un bouton étiré sur
      //     TOUTE la largeur — mesuré à **1008 px pour le mot « Potion »**, nom
      //     centré — avec la quantité posée DEHORS, dans une colonne de coût.
      //     Pas seulement dehors à l'œil : `bouton.contains(compteur)` rendait
      //     FAUX, c'était un frère dans le DOM. Les deux seuls faits d'un objet
      //     — quoi, combien — séparés par un mètre de vide, et le nombre hors
      //     de la cible qu'on touche.
      //  🔴 ET IL NE DISAIT PAS CE QU'IL FAIT. Huit noms empilés — Potion,
      //     Guérison, Rappel, Total Soin — et pour les lire il fallait SURVOLER,
      //     geste qui n'existe pas au doigt. Pendant ce temps l'étal de la
      //     boutique imprime l'effet de chaque article sous son nom, par
      //     `PokeDits.objet`, la porte unique que la carte de butin lit aussi.
      //     Le sac était le seul écran d'objets à se taire sur les objets.
      //  ✅ ON RÉEMPLOIE `.pkdx-article`, on n'invente rien. Nom, quantité à la
      //     place du prix, et la phrase de l'objet. Le joueur lit le même
      //     dessin à la boutique et dans son sac : c'est le même objet.
      //  ⚠️ `.pkdx-etape` reste pour l'écran des capsules, à qui il est destiné :
      //     là-bas la colonne de droite porte une RAISON (« peut l'apprendre »,
      //     « en connaît déjà quatre »), pas un compte.
      // ═══════════════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════════
      //  UN OBJET EST UNE LIGNE, PAS UNE VIGNETTE — refonte du 14/08
      //
      //  🔴 « Je n'aime pas du tout », dit du sac comme de l'équipe. J'étais
      //     passé de la pilule étirée à une grille de cartes ; c'était encore
      //     une liste de produits. Un sac Pokémon est une LISTE : le nom à
      //     gauche, la quantité alignée à droite, un `×` entre les deux. Cette
      //     forme se scanne — les noms partent tous du même x, les nombres se
      //     comparent en colonne — et c'est celle du jeu depuis 1996.
      //  ✅ La phrase de l'objet reste, sous son nom : c'est ce qui manquait
      //     vraiment (huit noms muets, et l'infobulle inaccessible au doigt).
      //     Elle vient de `PokeDits.objet`, la porte que la boutique et la
      //     carte de butin lisent déjà.
      //  ⚠️ Toujours PAS d'infobulle : l'écran parle, la bulle ferait doublon.
      // ═══════════════════════════════════════════════════════════════════
      function carteObjet(cle, n, actif, note) {
        var dit = W.PokeDits ? W.PokeDits.objet(cle, T, function (s) { return esc(nomStat(s)); }) : "";
        return '<button type="button" class="pkdx-objet-ligne"' +
            (actif ? ' data-objet="' + esc(cle) + '"' : " disabled") + ">" +
          '<span class="pkdx-objet-corps">' +
            '<span class="pkdx-objet-nom">' + esc(nomDObjet(cle)) + "</span>" +
            (dit ? '<span class="pkdx-objet-dit">' + dit + "</span>" : "") +
          "</span>" +
          '<span class="pkdx-objet-droite">' +
            '<span class="pkdx-objet-n">×' + n + "</span>" +
            (note ? '<span class="pkdx-objet-note">' + note + "</span>" : "") +
          "</span>" +
        "</button>";
      }

      var rangs = RANGS_SAC.map(function (r) {
        var lignes = [];
        for (var o in sac) {
          if (!sac[o] || !r.test(o)) continue;
          lignes.push(carteObjet(o, sac[o], true, ""));
        }
        if (!lignes.length) return "";
        return '<h2 class="pkdx-soustitre">' + T("sac_" + r.cle) + "</h2>" +
          '<div class="pkdx-objets">' + lignes.join("") + "</div>";
      }).join("");

      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 LE STOCK DE BALLS ÉTAIT LA DERNIÈRE LIGNE DE LA PAGE — critique du
      //     14/08, mesuré au pixel **3 118 sur 3 278** à 360 px : sous sept
      //     sections, en gris, sans titre, dans un `<p>` nu. Dans un jeu dont
      //     la capture est le cœur, « combien de Balls me reste-t-il » est LA
      //     question qu'on vient poser au sac avant un Champion, et c'était la
      //     réponse la plus enterrée de l'écran.
      //  ✅ Elles montent en PREMIER et prennent le dessin des autres objets.
      //  ⚠️ LA LOI NE CHANGE PAS : « on les DIT, sans bouton » — une Ball ne
      //     s'emploie qu'en combat, la rendre cliquable ici promettrait une
      //     action qui n'existe pas. Elles sortent donc éteintes, avec leur
      //     raison écrite dessus. C'était la PLACE qui était fausse, pas la loi.
      // ═══════════════════════════════════════════════════════════════════════
      var balles = [];
      for (var b in sac) if (/BALL$/.test(b) && sac[b]) balles.push(carteObjet(b, sac[b], false, T("sacBallsNote")));

      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 CINQUANTE MACHINES DANS LES DONNÉES, AUCUNE ENSEIGNABLE. Les CT
      //    tombaient en butin, le journal les nommait, et le sac ne les
      //    montrait même pas : elles vivent dans `partie.ct`, pas dans
      //    `partie.sac`. `apprendreCT` existait, complète, et n'était appelée
      //    QUE par le simulateur d'équilibrage — qui mesurait donc un joueur
      //    mieux armé que le vrai.
      //    C'est le levier qui manquait au mode : voir le type d'un Champion,
      //    puis décider à QUI donner Tonnerre. Une CT ne s'emploie qu'une fois.
      // ═══════════════════════════════════════════════════════════════════════
      // 🔴 UN OBJET QUI AGIT SANS QU'ON LE CLIQUE DOIT LE DIRE. L'EXP.ALL ne
      //    s'emploie pas : elle travaille à chaque combat. Sans cette ligne,
      //    elle serait la chose la plus importante du sac et la seule invisible
      //    — et le joueur ne saurait pas pourquoi son équipe monte enfin.
      var porte = P().aLObjet(partie, "EXP_ALL")
        ? '<h2 class="pkdx-soustitre">' + T("sac_porte") + "</h2>" +
          '<p class="pkdx-passif"><b>' + esc(nomDObjet("EXP_ALL")) + "</b> — " + T("expAllDit") + "</p>"
        : "";

      // ═══════════════════════════════════════════════════════════════════
      //  🔴 LES CLÉS N'APPARAISSAIENT NULLE PART DANS LE SAC. Un voyage en
      //     récolte jusqu'à dix — CS, Ticket, Scope Sylphe, Clé Secrète — et
      //     ce sont elles qui OUVRENT les étapes. Le joueur les recevait une
      //     fois, sur un écran qu'il quittait aussitôt, et ne pouvait plus
      //     jamais savoir ce qu'il tenait ni ce que ça débloquait.
      //     C'est la classe n°1 du dossier, sur les objets dont l'ouverture
      //     de contenu est la seule fonction.
      //  ⚠️ Elles ne se cliquent pas : une clé ne s'emploie pas, elle ouvre.
      //     Elles vivent donc dans `partie.cles`, pas dans le sac — et c'est
      //     pour ça qu'aucune boucle sur `sac` ne pouvait les trouver.
      // ═══════════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 QUATRE ENTRÉES SUR CINQ EXPLIQUAIENT POURQUOI L'OBJET NE SERT À
      //     RIEN — critique du 14/08. « Rien à ouvrir », « se traversent à
      //     pied », « pas d'ascenseur », « t'a déjà confié Force » : une
      //     section dont 80 % du contenu est une excuse, et la seule clé qui
      //     ouvre quelque chose noyée au milieu.
      //  ✅ ON NE RETIRE PAS LE TEXTE — savoir qu'une clé ne sert à rien ICI
      //     est une information vraie, et la cacher ferait croire à un oubli.
      //     On les RANGE : ce qui ouvre passe devant. L'ordre porte alors
      //     l'information, et la première ligne lue est celle qui compte.
      // ═══════════════════════════════════════════════════════════════════
      var tenues = [], muettes = [];
      for (var ck in (partie.cles || {})) {
        if (!partie.cles[ck] || !CLES_V()[ck]) continue;
        var dit = ditOuvre([ck]);
        var li = '<li class="pkdx-cle">' +
          '<b>' + esc(CLES_V()[ck].nom[LANG()]) + "</b>" + dit + "</li>";
        //  `ditOuvre` nomme une étape quand la clé en ouvre une : la présence
        //  d'un `<b>` dans sa phrase est le signe qu'il y a une porte derrière.
        (/<b>/.test(dit) ? tenues : muettes).push(li);
      }
      tenues = tenues.concat(muettes);
      var blocCles = !tenues.length ? "" :
        '<h2 class="pkdx-soustitre">' + T("sac_cles") + "</h2>" +
        '<ul class="pkdx-cles">' + tenues.join("") + "</ul>";

      // ═══════════════════════════════════════════════════════════════════════
      //  CE QUE TON ÉQUIPE TIENT EN MAIN — 21/08/2026
      //
      //  🔴 UNE MÉCANIQUE ENTIÈRE ÉTAIT À SENS UNIQUE. Johto donne un objet en
      //     main à soixante et une espèces ; `moteur.js` le pose à la création,
      //     le combat le consomme (une baie qui soigne, une Roche Royale qui
      //     fait reculer) — et le joueur n'avait AUCUN moyen de le reprendre.
      //     Un objet tenu n'entrait jamais dans le sac : il naissait sur une
      //     bête et y mourait.
      //
      //  🔑 CE N'EST PAS UN CONFORT, C'EST LA DERNIÈRE PORTE DE LA PIERRE LUNE.
      //     Mesuré : `MOON_STONE` n'est vendue nulle part à Johto et ne traîne
      //     dans aucun décor. Sa SEULE source est la main de Mélofée, Mélodelfe
      //     et Mélo — et Mélo sort de l'Œuf Étrange, qui est dans le voyage.
      //     Sans ce bouton, Nidorina, Nidorino, Mélofée et Rondoudou
      //     n'évoluaient dans aucune partie de Johto, jamais.
      //
      //  ⚠️ ON NE PREND QUE CE QUI PEUT SERVIR AILLEURS ? Non — on prend TOUT.
      //     Trancher pour le joueur quelle baie mérite le sac, c'est décider à
      //     sa place ; et la ligne dit déjà ce que fait l'objet.
      // ═══════════════════════════════════════════════════════════════════════
      var enMain = [];
      for (var im = 0; im < (partie.equipe || []).length; im++) {
        var mm = partie.equipe[im];
        if (!mm || !mm.objet) continue;
        var ditT = W.PokeDits ? W.PokeDits.objet(mm.objet, T, function (s) { return esc(nomStat(s)); }) : "";
        enMain.push('<button type="button" class="pkdx-objet-ligne" data-reprendre="' + im + '">' +
          '<span class="pkdx-objet-corps">' +
            '<span class="pkdx-objet-nom">' + esc(nomDObjet(mm.objet)) + "</span>" +
            // 🔴 « tenu par X » EST UNE PHRASE COMPOSÉE : sa largeur dépend du
            //    surnom que le joueur a donné. La colonne de droite est en
            //    `nowrap` — une étiquette de longueur connue y tient, pas
            //    celle-ci. Elle descend donc dans le corps, qui se replie.
            '<span class="pkdx-objet-dit">' +
              esc(T("sacTenuPar", { nom: mm.surnom || ESP()[mm.n].nom[LANG()] })) +
              (ditT ? " — " + ditT : "") + "</span>" +
          "</span>" +
        "</button>");
      }
      var blocEnMain = !enMain.length ? "" :
        '<h2 class="pkdx-soustitre">' + T("sac_enMain") + "</h2>" +
        '<p class="pkdx-dit">' + T("sacEnMainDit") + "</p>" +
        '<div class="pkdx-objets">' + enMain.join("") + "</div>";

      var machines = O().ctDe(partie);
      //  Le Champion de l'acte, par la porte unique — et son équipe sert de
      //  cible : c'est CONTRE ELLE qu'une machine « répond », pas dans l'absolu.
      var champDevant = areneDevant();
      function repondAuChampion(m) {
        if (!champDevant || !W.PokeCombat || !W.PokeCombat.efficacite) return false;
        var att = ATT()[m.cle];
        if (!att || !att.puissance) return false;
        for (var q = 0; q < champDevant.equipe.length; q++) {
          var e = ESP()[champDevant.equipe[q].n];
          if (e && W.PokeCombat.efficacite(att.type, e.types) > 1) return true;
        }
        return false;
      }
      var bloc = !machines.length ? "" :
        '<h2 class="pkdx-soustitre">' + T("sac_machines") + "</h2>" +
        '<div class="pkdx-machines">' + machines.map(function (m, i) {
          var a = ATT()[m.cle];
          var peuvent = O().quiApprend(partie, m);
          return '<button type="button" class="pkdx-machine" data-ct="' + i + '"' +
              W.PokeType.attr(m.type) + (peuvent.length ? "" : " disabled") + ">" +
            '<span class="pkdx-machine-num">' + numeroMachine(m) + "</span>" +
            '<b class="pkdx-machine-nom">' + esc(nomAttaque(m.cle)) + "</b>" +
            '<span class="pkdx-machine-type">' + W.PokeType.pastille(m.type) + "</span>" +
            '<span class="pkdx-machine-force">' +
              (a && a.puissance ? T("ctPuissance", { n: a.puissance }) : T("ctSansDegats")) + "</span>" +
            '<span class="pkdx-machine-qui">' +
              (peuvent.length ? T("ctQui", { n: peuvent.length }) : T("ctPersonne")) + "</span>" +
            // ═══════════════════════════════════════════════════════════════
            //  🔴 LE RAIL DIT « une capsule technique peut y répondre », ET LE
            //     SAC NE DISAIT PAS LAQUELLE. La v504 a donné une voix au
            //     second facteur du mode ; sans cette ligne, elle envoie le
            //     joueur fouiller huit machines dont aucune n'annonce ce
            //     qu'elle vaut CONTRE CE CHAMPION-LÀ. Une alerte qui nomme un
            //     remède doit mener au remède.
            //  ⚠️ Seulement si quelqu'un peut l'apprendre : une machine que
            //     personne n'apprend n'est pas une réponse, et la carte est
            //     déjà grisée pour le dire.
            // ═══════════════════════════════════════════════════════════════
            (peuvent.length && repondAuChampion(m)
              ? '<span class="pkdx-machine-reponse">' +
                  esc(T("ctRepond", { qui: W.PokeGenre.nomChampion(champDevant) })) + "</span>" : "") +
          "</button>";
        }).join("") + "</div>";

      coque(
        '<p class="pkdx-surtitre">' + T("nSac") + "</p>" +
        '<h1 class="pkdx-titre">' + T("sacTitre") + "</h1>" +
        // 🔴 UN CONSEIL SUR CE QU'ON NE POSSÈDE PAS N'EST PAS UN CONSEIL. Le
        //    sac ouvrait toujours sur « Les vitamines sont définitives » —
        //    y compris au premier acte, avec trois Potions et rien d'autre.
        //    La phrase est bonne, elle arrivait juste à qui n'avait aucune
        //    vitamine à donner, et le joueur apprend à ne plus lire cette
        //    ligne. Elle attend maintenant d'avoir une raison de paraître.
        // 🔴 « UN OBJET UTILISÉ EST DÉPENSÉ POUR DE BON » A ÉTÉ RETIRÉ. C'était
        //    vrai de tous les consommables de tous les jeux, ça n'apprenait
        //    rien, et ça occupait la ligne la plus lue de l'écran — juste sous
        //    le titre. Le « ×3 » sur chaque carte dit la même chose en mieux :
        //    il descend quand on dépense. La phrase des vitamines, elle, reste :
        //    celle-là annonce une irréversibilité qu'aucun compteur ne montre.
        (dit ? '<p class="pkdx-dit est-alerte">' + dit + "</p>"
             : aUneVitamine() ? '<p class="pkdx-dit">' + T("sacDitVitamine") + "</p>" : "") +
        (balles.length ? '<h2 class="pkdx-soustitre">' + T("sacBalls") + "</h2>" +
          '<div class="pkdx-objets">' + balles.join("") + "</div>" : "") +
        (rangs || (machines.length || porte || balles.length ? "" : '<p class="pkdx-dit">' + T("sacRien") + "</p>")) +
        porte +
        blocEnMain +
        blocCles +
        bloc +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche" id="pk-sac-retour">' + T(cleRetour || "retourCarte") + "</button>" +
        "</div>"
      );
      surClic("[data-objet]", function (e) {
        choisirCible(e.currentTarget.getAttribute("data-objet"));
      });
      surClic("[data-ct]", function (e) {
        choisirEleve(machines[+e.currentTarget.getAttribute("data-ct")]);
      });
      // Reprendre ce qu'un Pokémon tient : il passe dans le sac, et le sac est
      // la SEULE porte par laquelle il devient employable.
      surClic("[data-reprendre]", function (e) {
        var k = +e.currentTarget.getAttribute("data-reprendre");
        var m = partie.equipe[k];
        if (!m || !m.objet) return;
        var cle = m.objet, qui = m.surnom || ESP()[m.n].nom[LANG()];
        m.objet = null;
        partie.sac[cle] = (partie.sac[cle] || 0) + 1;
        son("PRESS_AB");
        W.PokeProgression.fusionner(partie);
        sac = partie.sac;
        rendre(T("sacRepris", { quoi: esc(nomDObjet(cle)), nom: esc(qui) }));
      });
      racine.querySelector("#pk-sac-retour").addEventListener("click", function () { son("PRESS_AB"); apres(); });
    }

    // ── À QUI ? ────────────────────────────────────────────────────────────
    //  🔴 ON MONTRE CEUX QUI NE PEUVENT PAS, ET POURQUOI. Une espèce accepte ou
    //     refuse une machine, c'est dans ses données ; masquer les refusés
    //     ferait croire qu'on n'a que trois Pokémon. Même règle que les pierres.
    function choisirEleve(machine) {
      son("PRESS_AB");
      var peuvent = O().quiApprend(partie, machine);
      coque(
        '<p class="pkdx-surtitre">' + T("nSac") + "</p>" +
        '<h1 class="pkdx-titre">' + T("ctQuiTitre", { quoi: esc(nomAttaque(machine.cle)) }) + "</h1>" +
        '<p class="pkdx-dit">' + T("ctUnique") + "</p>" +
        '<ul class="pkdx-liste">' + partie.equipe.map(function (m, k) {
          var e = ESP()[m.n];
          var peut = peuvent.indexOf(k) >= 0;
          var deja = false;
          for (var i = 0; i < m.attaques.length; i++) if (m.attaques[i].cle === machine.cle) deja = true;
          // ═══════════════════════════════════════════════════════════════
          //  🔴 ON CHOISISSAIT À L'AVEUGLE UNE RESSOURCE À USAGE UNIQUE. La
          //     ligne ne disait qu'un nom, un niveau et « peut l'apprendre ».
          //     Or DEUX faits décident : le TYPE du porteur — une capsule Eau
          //     sur un Pokémon Eau frappe une fois et demie plus fort — et le
          //     nombre d'attaques, parce qu'à quatre il faudra en OUBLIER une,
          //     ce qu'on ne découvrait qu'à l'écran suivant, après avoir
          //     tranché. Tous les autres écrans « lequel ? » du mode montrent
          //     le type ; celui-ci était le seul muet.
          //  ⚠️ Le bonus de même type se DIT quand il s'applique : c'est la
          //     seule ligne qui distingue deux porteurs également capables.
          // ═══════════════════════════════════════════════════════════════
          var att = ATT()[machine.cle];
          var meme = att && e.types.indexOf(att.type) >= 0;
          return '<li class="pkdx-etape">' +
            '<button type="button" class="pkdx-touche" data-eleve="' + k + '"' +
              (peut && !deja ? "" : " disabled") + ">" +
              esc(m.surnom || e.nom[LANG()]) + " " + W.PokeGenre.niveau(m.niveau) +
              '<span class="pkdx-eleve-types">' +
                e.types.map(function (t) { return W.PokeType.pastille(t); }).join("") +
              "</span>" +
            "</button>" +
            '<span class="pkdx-cout">' +
              (deja ? T("ctDejaConnue") : !peut ? T("ctNePeutPas")
                : (meme ? T("ctMemeType") + " · " : "") +
                  (m.attaques.length >= 4 ? T("ctQuatre") : T("ctPlaceLibre"))) +
            "</span></li>";
        }).join("") + "</ul>" +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche" id="pk-ct-annule">' + T("retour") + "</button>" +
        "</div>"
      );
      surClic("[data-eleve]", function (e) { enseigner(machine, +e.currentTarget.getAttribute("data-eleve")); });
      racine.querySelector("#pk-ct-annule").addEventListener("click", function () { son("PRESS_AB"); rendre(); });
    }

    // ── QUELLE ATTAQUE CÈDE SA PLACE ? ─────────────────────────────────────
    //  🔴 ET ON DIT CE QU'ON PERD. Quatre attaques, une place : le joueur doit
    //     voir le TYPE et la PUISSANCE de chacune pour trancher, sinon il jette
    //     sa meilleure attaque au hasard. C'est là que la décision se prend.
    function enseigner(machine, index) {
      var mon = partie.equipe[index];
      var nom = esc(mon.surnom || ESP()[mon.n].nom[LANG()]);

      var poser = function (remplace) {
        var r = O().apprendreCT(partie, index, machine, remplace);
        if (!r.ok) { son("DENIED"); return rendre(T("ctRefus", { nom: nom })); }
        son("GET_ITEM_1");
        return message(T("nSac"),
          T("ctApprise", { nom: nom, quoi: esc(nomAttaque(machine.cle)) }), rendre);
      };

      if (mon.attaques.length < 4) return poser(null);

      son("PRESS_AB");
      coque(
        '<p class="pkdx-surtitre">' + T("nSac") + "</p>" +
        '<h1 class="pkdx-titre">' + T("ctOublier", { nom: nom, quoi: esc(nomAttaque(machine.cle)) }) + "</h1>" +
        '<p class="pkdx-dit">' + T("ctOublierDit") + "</p>" +
        '<ul class="pkdx-liste">' + mon.attaques.map(function (a, k) {
          var d = ATT()[a.cle];
          return '<li class="pkdx-etape">' +
            '<button type="button" class="pkdx-touche' + (d ? " est-typee" : "") + '" data-oubli="' + k + '"' +
              (d ? W.PokeType.attr(d.type) : "") + ">" +
              esc(nomAttaque(a.cle)) + "</button>" +
            '<span class="pkdx-cout">' +
              (d ? W.PokeType.pastille(d.type) + " " +
                   (d.puissance ? T("ctPuissance", { n: d.puissance }) : T("ctSansDegats")) : "") +
            "</span></li>";
        }).join("") + "</ul>" +
        '<div class="pkdx-actions est-pied">' +
          // Le même libellé existait déjà pour l'apprentissage par niveau :
          // deux clés pour un seul bouton, c'est deux textes à tenir d'accord.
          '<button type="button" class="pkdx-touche" id="pk-ct-garder">' + T("garderSesAttaques") + "</button>" +
        "</div>"
      );
      surClic("[data-oubli]", function (e) { poser(+e.currentTarget.getAttribute("data-oubli")); });
      racine.querySelector("#pk-ct-garder").addEventListener("click", function () { son("PRESS_AB"); rendre(); });
    }

    // Sur QUI ? C'est tout le choix : une vitamine est un investissement
    // définitif dans un Pokémon plutôt qu'un autre.
    function choisirCible(objet, dit) {
      son("PRESS_AB");
      coque(
        '<p class="pkdx-surtitre">' + T("nSac") + "</p>" +
        // ⚠️ LE COMPTE EST DANS LE TITRE DEPUIS QU'ON RESTE ICI (16/08). Tant
        //    qu'on repassait par la racine du sac après chaque soin, le joueur
        //    y relisait « Potion ×3 ». Maintenant qu'il enchaîne sans sortir,
        //    c'est cet écran-ci qui doit dire quand il faut s'arrêter.
        '<h1 class="pkdx-titre">' +
          T("sacQui", { quoi: esc(nomDObjet(objet)) +
            ((partie.sac && partie.sac[objet] > 1) ? " ×" + partie.sac[objet] : "") }) + "</h1>" +
        // 🔴 ET LA PHRASE DU SOIN PRÉCÉDENT S'AFFICHE ICI, PAS SUR UN ÉCRAN À
        //    ELLE. Un écran de message coûte un geste de plus à chaque soin —
        //    deux au lieu d'un — et sur téléphone ce geste se paie d'un
        //    défilement. La phrase dit la même chose au même endroit que la
        //    liste qu'elle commente ; l'écran plein n'apportait qu'une pause.
        //    Il reste pour le DERNIER soin, celui qui referme le rayon.
        (dit ? '<p class="pkdx-dit">' + dit + "</p>" : "") +
        '<ul class="pkdx-liste">' + partie.equipe.map(function (m, k) {
          var e = ESP()[m.n];
          // 🔴 UNE PIERRE EST LA CARTE LA PLUS RARE DU JEU — on ne laisse pas
          //    la gaspiller sur un Pokémon qu'elle ne fait pas évoluer. Le
          //    moteur sait déjà lesquels : on le lui demande, et on DIT vers
          //    quoi. Proposer les six et refuser après le clic, c'est faire
          //    porter au joueur une information que le jeu détient.
          var vers = estPierre(objet) ? O().pierrePossible(partie, m) : null;
          var possible = !vers || vers.length > 0;
          // ═══════════════════════════════════════════════════════════════════
          //  🔴 UNE VITAMINE À 9 800 ₽ SE CHOISISSAIT SUR LES PV AFFICHÉS. La
          //     colonne ne savait dire que trois choses — « n'évolue pas »,
          //     « → Aquali », ou les PV — donc l'achat le plus cher et le plus
          //     DÉFINITIF du mode se tranchait sur un chiffre sans rapport, et
          //     le plafond n'était annoncé qu'APRÈS le clic (`sacPlafond`).
          //     C'est la loi que l'écran des capsules applique déjà : ce qui se
          //     consomme se dit AVANT.
          //  ✅ Le calcul existait à trois cents lignes de là (`gainEntrainement`
          //     simule sur une copie) : on l'emploie, on n'en écrit pas un second.
          //  ⚠️ Un gain de zéro n'est pas un refus : le stat-exp monte sans que
          //     la statistique bouge tant que le niveau ne repasse pas. La
          //     colonne le dit au lieu d'afficher « +0 ».
          // ═══════════════════════════════════════════════════════════════════
          var statVit = O().VITAMINES[objet];
          var gainVit = null, plafondVit = false;
          if (statVit) {
            var g = gainDeVitamine(m, statVit);
            plafondVit = g.plafond;
            gainVit = g.gain;
          }
          if (plafondVit) possible = false;
          return '<li class="pkdx-etape">' +
            '<button type="button" class="pkdx-touche" data-cible="' + k + '"' +
              (possible ? "" : " disabled") + ">" +
              esc(m.surnom || e.nom[LANG()]) + " " + W.PokeGenre.niveau(m.niveau) + "</button>" +
            // 🔴 TROIS CAS, PAS DEUX. La ligne opposait « vers quoi il évolue »
            //    à « ses PV » — et rangeait dans les PV le Pokémon que la
            //    pierre ne fait PAS évoluer, c'est-à-dire le seul dont le
            //    bouton est fermé. Le joueur lisait « 24 / 24 » à côté d'une
            //    porte close et cherchait le rapport. Un refus se dit ; les PV
            //    ne valent que pour un objet qui les touche.
            //  ⚠️ ET LA RAISON SE BRANCHE SUR `possible`, LA MÊME EXPRESSION QUI
            //     FERME LE BOUTON. Deux conditions séparées pour un seul refus,
            //     c'est deux vérités qui divergeront le jour où l'une bouge.
            '<span class="pkdx-cout">' +
              (plafondVit ? T("sacVitPlafond")
                : !possible ? T("sacPierrePas")
                : vers && vers.length ? "→ " + esc(ESP()[vers[0].vers].nom[LANG()])
                : statVit ? (gainVit > 0
                    ? "+" + gainVit + " " + esc(nomStat(statVit))
                    : T("sacVitLatent"))
                : m.pv + " / " + m.stats.pv) +
            "</span></li>";
        }).join("") + "</ul>" +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche" id="pk-sac-annule">' + T("retour") + "</button>" +
        "</div>"
      );
      surClic("[data-cible]", function (e) { employer(objet, +e.currentTarget.getAttribute("data-cible")); });
      racine.querySelector("#pk-sac-annule").addEventListener("click", function () { son("PRESS_AB"); rendre(); });
    }

    function employer(objet, index) {
      var mon = partie.equipe[index];
      var nom = esc(mon.surnom || ESP()[mon.n].nom[LANG()]);

      if (estPierre(objet)) {
        var rp = O().employerPierre(partie, index, objet);
        if (!rp.ok) { son("DENIED"); return rendre(T("sacPierreRien", { nom: nom })); }
        // La même mise en scène qu'une évolution par niveau : c'est LE moment
        // dont on se souvient, et il ne se raconte pas dans une ligne de texte.
        son("SHRINK");
        W.setTimeout(function () { criDe(rp.vers); }, 900);
        W.PokeProgression.fusionner(partie);
        return message(T("nEvolution"),
          T("evolueFait", { nom: nom, b: esc(ESP()[rp.vers].nom[LANG()]) }), rendre);
      }
      if (O().VITAMINES[objet]) {
        var rv = O().employerVitamine(partie, index, objet);
        if (!rv.ok) { son("DENIED"); return rendre(T(rv.raison === "plafond" ? "sacPlafond" : "sacImpossible", { nom: nom })); }
        son("GET_ITEM_1");
        // Le gain se DIT en chiffres quand il s'en voit un, et se dit
        // autrement quand il n'y en a pas encore : voir `employerVitamine`.
        var phraseVit = T(rv.gain > 0 ? "sacVitamine" : "sacVitamineLatente",
          { nom: nom, stat: esc(nomStat(rv.stat)), n: rv.gain });
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 [20/08, Martial84] « faire comme les potions pour les vitamines :
        //     dès qu'on en a plusieurs, rester sur la page au lieu de revenir
        //     à chaque fois dans le sac ». Même demande que Syrean pour les
        //     bonbons la veille, même réponse : on reste sur la liste des
        //     cibles tant qu'il en reste, on retombe sur la racine au dernier.
        //  🔑 LA PRUDENCE D'ORIGINE (« une vitamine plafonne ») NE TIENT PLUS
        //     DEPUIS QUE LE PLAFOND SE DIT AVANT LE CLIC : `choisirCible` ferme
        //     le bouton du Pokémon au maximum (`sacVitPlafond`) et affiche le
        //     gain de chacun des autres, recalculé à chaque rendu. Rester
        //     n'expose donc à aucun refus-surprise — et une vitamine à 9 800 ₽
        //     se donne souvent par trois ou quatre au même Pokémon.
        // ═══════════════════════════════════════════════════════════════════
        if ((partie.sac && partie.sac[objet]) > 0) return choisirCible(objet, phraseVit);
        return message(T("nSac"), phraseVit, rendre);
      }
      if (objet === "RARE_CANDY") {
        var rb = O().employerBonbon(partie, index);
        if (!rb.ok) { son("DENIED"); return rendre(T("sacImpossible", { nom: nom })); }
        son("LEVEL_UP");
        // 🔴 UN BONBON PEUT FAIRE ÉVOLUER. Les suites remontent, et on les
        //    montre — c'est exactement l'oubli qui avait empêché toute
        //    évolution par niveau pendant des semaines.
        var suites = (rb.suites || []).map(function (ev) { return { mon: mon, ev: ev }; });
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 [19/08, Syrean] LE BONBON RENVOYAIT À LA RACINE DU SAC — « pouvoir
        //     utiliser les super bonbons comme pour les potions ». Le retour
        //     était un CHOIX ÉCRIT, pas un oubli : « les pierres, vitamines et
        //     bonbons sont rares, définitifs, et on ne les enchaîne pas ».
        //  🔑 CE CHOIX REPOSAIT SUR UN RISQUE QUI N'EXISTE PLUS. Il datait du
        //     16/08, le jour où un bonbon pouvait faire sauter 36 niveaux en
        //     passant à travers le plafond d'acte. Depuis, `employerBonbon`
        //     borne l'effet à `mon.niveau + 1` ET refuse au plafond : un
        //     bonbon rend exactement un niveau, enchaîné ou non. La prudence
        //     protégeait d'un défaut corrigé — *une précaution qui survit à sa
        //     cause devient une gêne.*
        //  ⚠️ Les pierres gardent la racine : une pierre transforme et ne se
        //     répète pas. Les vitamines ont suivi le 20/08 (Martial84) : le
        //     plafond se dit avant le clic, donc rester ne trompe personne.
        //  🔴 ET LE RETOUR SE JOUE DANS LA CONTINUATION, PAS APRÈS ELLE. Premier
        //     jet : j'avais mis l'enchaînement sur la ligne d'après, en pensant
        //     que `suites` ne se remplissait qu'à une ÉVOLUTION. Faux — une
        //     simple montée de niveau en est une, donc la branche passait par
        //     `ecranMontees(…, rendre)` À CHAQUE BONBON et mon code n'était
        //     jamais atteint. Vu à l'écran : « Salamèche passe au niveau 6 »,
        //     SUITE, et retour à la racine du sac. Le correctif ne corrigeait
        //     rien, et il avait l'air juste.
        // ═══════════════════════════════════════════════════════════════════
        var apresBonbon = function () {
          if ((partie.sac && partie.sac.RARE_CANDY) > 0) {
            return choisirCible(objet, T("sacBonbon", { nom: nom }));
          }
          return rendre();
        };
        if (suites.length) return ecranMontees(suites, apresBonbon);
        return message(T("nSac"), T("sacBonbon", { nom: nom }), apresBonbon);
      }
      // Un soin, hors combat : le même moteur qu'en combat, donc les mêmes
      // règles — et pas de tour à perdre puisqu'il n'y a pas de tour.
      var rs = W.PokeCombat.appliquerObjet(mon, objet);
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 LE SAC HORS COMBAT JETAIT LES RAISONS DU MOTEUR. `appliquerObjet`
      //     rend `pleineVie`, `debout`, `aTerre` ou `rienALever` — quatre refus
      //     précis, écrits exprès, et que le sac de COMBAT lit déjà pour son
      //     infobulle. Ici tout retombait sur « Ça ne servirait à rien sur X ».
      //     Le moteur savait, l'écran ne disait pas : classe n°1, et sur le
      //     refus le plus fréquent du mode.
      //  ⚠️ Les clés `refus_*` existent déjà et sont partagées avec le combat :
      //     on ne réécrit aucune phrase.
      // ═══════════════════════════════════════════════════════════════════════
      if (!rs.ok) {
        son("DENIED");
        var dite = W.PokeInfobulles && W.PokeInfobulles.raison
          ? W.PokeInfobulles.raison(rs.raison) : null;
        return rendre(dite || T("sacImpossible", { nom: nom }));
      }
      P().utiliserObjet(partie, objet);
      son(rs.ranime ? "HEAL_AILMENT" : "HEAL_HP");
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 SOIGNER DEUX POKÉMON DEMANDAIT DE TOUT REFAIRE — rapport du 16/08,
      //     et c'est le point qui a le plus agacé : « des fois je voulais use
      //     plusieurs potions, tu dois faire potion > Pokémon > retour >
      //     potion > Pokémon et c'est l'enfer ». Il a raison, et le compte est
      //     cruel : soigner une équipe de six, c'est vingt-quatre gestes.
      //     La faute est ici, en un mot : on rentrait par `rendre`, la RACINE
      //     du sac. Après chaque soin le joueur retombait sur la liste des
      //     objets, devait retrouver sa Potion, la rouvrir, puis redésigner un
      //     Pokémon — pour refaire exactement ce qu'il venait de faire.
      //  ✅ ON RESTE SUR LA LISTE DES CIBLES tant qu'il reste de cet objet.
      //     C'est le geste que le joueur RÉPÈTE qu'on garde sous le doigt, et
      //     il n'a plus qu'à toucher le suivant. Sur téléphone, où chaque
      //     retour arrière coûte un défilement jusqu'en bas, ça change tout.
      //  ⚠️ ET ON RETOMBE SUR LA RACINE QUAND IL N'EN RESTE PLUS : afficher une
      //     liste de cibles pour un objet épuisé serait promettre un geste
      //     impossible — la faute du troc impayable, sur un autre écran.
      //  ⚠️ Seules les pierres gardent `rendre` : une pierre transforme et ne se
      //     répète pas. Les bonbons (19/08) puis les vitamines (20/08) ont
      //     rejoint le soin : ce qui se répète reste sous le doigt.
      // ═══════════════════════════════════════════════════════════════════════
      var phrase = rs.ranime ? T("sacRanime", { nom: nom })
        : rs.soigne ? T("sacSoigne", { nom: nom, n: rs.soigne })
        : T("sacGuerit", { nom: nom });
      // Il en reste : on revient sur la liste des cibles avec la phrase en tête
      // — UN geste par soin. Sinon l'écran plein, qui referme proprement.
      if ((partie.sac && partie.sac[objet]) > 0) return choisirCible(objet, phrase);
      return message(T("nSac"), phrase, rendre);
    }

    rendre();
  }

  function nomDObjet(cle) {
    var o = W.PokeRegles ? W.PokeRegles.objet(cle) : (W.POKE_OBJETS && W.POKE_OBJETS[cle]);
    if (!o && W.POKE_GEN3_OBJETS && W.POKE_GEN3_OBJETS[cle]) o = W.POKE_GEN3_OBJETS[cle];
    if (!o && W.PokeUIUsine && Array.isArray(W.PokeUIUsine.CATALOGUE_BOUTIQUE)) {
      for (var i = 0; i < W.PokeUIUsine.CATALOGUE_BOUTIQUE.length; i++) {
        if (W.PokeUIUsine.CATALOGUE_BOUTIQUE[i].cle === cle) {
          return W.PokeUIUsine.CATALOGUE_BOUTIQUE[i].nom;
        }
      }
    }
    return o ? (typeof o.nom === "object" ? o.nom[LANG()] : o.nom) : cle;
  }

  // Le sac porte-t-il une vitamine ? La liste vient de `VITAMINES`, la table
  // qui les applique — la recopier ici ferait mentir la phrase le jour où elle
  // bouge.
  function aUneVitamine() {
    var sac = (partie && partie.sac) || {};
    var table = O().VITAMINES;
    for (var cle in table) if (sac[cle] > 0) return true;
    return false;
  }

  // Combien d'objets s'emploient DEPUIS LA CARTE. Les Balls n'en sont pas :
  // elles ne servent qu'en combat, et les compter ici ouvrirait un sac où
  // rien n'est cliquable.
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 LA PASTILLE NE COMPTAIT PAS LES MACHINES, ET C'EST TOUT LE SYSTÈME
  //    D'APPRENTISSAGE QUI DISPARAISSAIT. Les capsules ne vivent pas dans
  //    `partie.sac` mais dans `partie.ct` : un joueur qui possède trois CT et
  //    rien d'autre lisait « SAC 0 » et n'avait aucune raison d'ouvrir l'écran.
  //    Il pouvait finir un voyage entier sans apprendre une seule attaque à qui
  //    que ce soit — alors que la carte de butin les lui avait données, que
  //    l'écran d'apprentissage existe, et que le comptoir de Céladopole les
  //    vend depuis ce matin.
  //    Signalé par le propriétaire en une phrase : « on apprend pas des
  //    attaques à nos pokémons ? ». La mécanique était là ; c'est le COMPTEUR
  //    qui la cachait.
  // 🔴 ET ELLES SE COMPTENT AVEC LE RESTE, pas à part : le joueur ne cherche
  //    pas « des objets » puis « des machines », il cherche ce qu'il peut faire.
  // ═══════════════════════════════════════════════════════════════════════════
  function objetsEmployables() {
    var n = 0, sac = (partie && partie.sac) || {};
    for (var o in sac) {
      if (!sac[o]) continue;
      for (var i = 0; i < RANGS_SAC.length; i++) if (RANGS_SAC[i].test(o)) { n += sac[o]; break; }
    }
    var ct = (partie && partie.ct) || {};
    for (var m in ct) if (ct[m] > 0) n += ct[m];
    return n;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ARRÊTER LE VOYAGE — UNE SEULE PORTE, ET ELLE DEMANDE  [20/08/2026]
  //
  //  🔴 « J'AI DÛ CLIQUER SUR SORTIR OU AUTRE CAR DEPUIS JE SUIS SUR LE MENU
  //     PRINCIPAL ET JE NE PEUX QUE RECOMMENCER À 0 » — Zerfall, 20/08 au
  //     matin, en allant faire ses combats de Ligue. Huit badges, un voyage
  //     complet, effacé par un clic.
  //  🔴 LA RÈGLE ÉTAIT ÉCRITE, ET À UN SEUL ENDROIT. Le bouton « ARRÊTER LE
  //     VOYAGE » de la CARTE demande confirmation depuis toujours, avec sa
  //     raison en toutes lettres : « une fin de voyage ne se déclenche pas d'un
  //     clic distrait ». Le MÊME LIBELLÉ, sur l'écran de K.O., partait
  //     directement — `partie.fini = "abandon"` puis `fin()`, qui efface la
  //     sauvegarde. Et c'est le pire des deux écrans pour ça : on y arrive en
  //     ayant perdu, la main déjà sur « REPARTIR », le bouton fatal juste à
  //     côté. *Une règle écrite à un endroit et pas branchée à l'autre n'est
  //     pas une règle, c'est un commentaire.*
  //  🔑 UNE SEULE PORTE, DONC. Les deux écrans l'appellent ; un troisième qui
  //     voudrait arrêter un voyage n'aura pas à se souvenir de demander.
  //  ⚠️ ELLE NE DÉCIDE PAS OÙ L'ON REVIENT : chaque écran passe son propre
  //     retour. Recopier `carte()` ici aurait ramené le joueur de l'écran de
  //     K.O. à la carte sans qu'il ait rien choisi.
  // ═══════════════════════════════════════════════════════════════════════════
  function demanderAbandon(revenir) {
    son("PRESS_AB");
    coque(
      '<p class="pkdx-surtitre">' + T("nAbandon") + "</p>" +
      '<h1 class="pkdx-titre">' + T("abandonTitre") + "</h1>" +
      '<p class="pkdx-dit">' + T("abandonDit") + "</p>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche" id="pk-abandon-oui">' + T("koAbandonner") + "</button>" +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-abandon-non">' + T("abandonContinuer") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-abandon-non").addEventListener("click", function () { son("PRESS_AB"); revenir(); });
    racine.querySelector("#pk-abandon-oui").addEventListener("click", function () {
      son("DENIED");
      partie.fini = "abandon";
      fin();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE K.O. — ET LA SEULE SORTIE GARANTIE DU VOYAGE
  //
  //  🔴 IL N'AVAIT AUCUN ÉCRAN NON PLUS. On perdait, la moitié de l'argent
  //     disparaissait, et on retombait sur la carte sans un mot. Un coût qu'on
  //     ne voit pas n'apprend rien — et le joueur ne comprenait pas pourquoi
  //     il ne pouvait plus rien acheter.
  //
  //  🔴 ET IL PORTE LA PORTE DE SORTIE. Un Champion qu'on peut réessayer sans
  //     fin n'a plus d'enjeu, mais un voyage qu'on ne peut pas quitter est
  //     pire : le joueur ferme l'onglet et sa collection ne se clôture jamais.
  //     Deux boutons, donc, et le second garantit qu'une partie SE TERMINE
  //     toujours — c'est ce qui rend la preuve de sortie atteignable.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranDefaite(info, apres) {
    son("FAINT_FALL");
    // Le dernier essai consommé ferme le voyage : on va droit à la Vitrine
    // plutôt que de proposer un bouton qui ne mène nulle part.
    if (info.epuise) {
      return message(T("nKo"), T("koEpuise", { n: P().ESSAIS_BOSS }), fin);
    }
    dessiner();
    //  🔑 L'ÉCRAN SE REDESSINE — parce qu'on peut en repartir. Renoncer à
    //     arrêter le voyage ramène ICI, sur le même choix, et non sur la carte :
    //     le joueur n'a encore rien décidé. Le cri de chute, lui, ne se rejoue
    //     pas : il appartient au moment, pas à l'écran.
    function dessiner() {
      coque(
        '<p class="pkdx-surtitre">' + T("nKo") + "</p>" +
        '<h1 class="pkdx-titre">' + T("koTitre") + "</h1>" +
        // Les milliers se séparent ici aussi : « Tu perds 1 250 ₽ », jamais
        // « 1250 ₽ ». La phrase porte le symbole, le nombre passe par la porte.
        '<p class="pkdx-dit">' + T(info.arene ? "koArene" : "koRoute", { n: milliers(info.perdu || 0) }) + "</p>" +
        // 🔴 CE QUI SE CONSOMME SE DIT. Un essai perdu en silence n'est pas une
        //    règle du jeu, c'est un piège — et le joueur découvre la contrainte
        //    au moment exact où elle le condamne.
        // ⚠️ `!== null` LAISSAIT PASSER `undefined`, ET LA PHRASE SORTAIT À MOITIÉ
        //    RÉSOLUE : « Il te reste , {n|essai|essais} dans cet acte. » Un garde
        //    qui nomme UNE valeur absente n'en couvre qu'une — on exige le TYPE.
        //    Trouvé par le balayage des 42 écrans, sur la porte `mesurerDefaite`
        //    qui n'envoyait ni `perdu` ni `reste` : le jeu, lui, les pose
        //    toujours (`echouerDansLActe` rend un `Math.max(0, …)`). L'écran
        //    mesuré n'était donc pas l'écran joué — un balayage propre sur un
        //    écran que personne ne voit.
        (typeof info.reste === "number"
          ? '<p class="pkdx-dit est-alerte">' + T("koEssais", { n: info.reste }) + "</p>" : "") +
        '<div class="pkdx-actions est-pied">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-reessayer">' + T("koReessayer") + "</button>" +
          '<button type="button" class="pkdx-touche" id="pk-abandonner">' + T("koAbandonner") + "</button>" +
        "</div>"
      );
      racine.querySelector("#pk-reessayer").addEventListener("click", function () { son("PRESS_AB"); apres(); });
      //  🔴 CE BOUTON PARTAIT SANS DEMANDER, et il est collé à « REPARTIR » sur
      //     l'écran où l'on vient de perdre. Huit badges effacés d'un clic —
      //     Zerfall, 20/08. Voir `demanderAbandon`.
      racine.querySelector("#pk-abandonner").addEventListener("click", function () {
        demanderAbandon(dessiner);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA PRISE — CE QU'ON VIENT VRAIMENT D'ATTRAPER
  //
  //  🔴 TOUS LES RATTATA SE VALAIENT, ET C'ÉTAIT FAUX. Le moteur tire depuis le
  //     premier jour les valeurs déterminantes de la première génération : deux
  //     exemplaires de la même espèce n'ont JAMAIS eu les mêmes statistiques.
  //     Le jeu le savait, l'écran ne le disait pas — la classe de défaut la plus
  //     fréquente du projet, et la plus coûteuse ici : sans elle, capturer deux
  //     fois la même espèce n'avait aucun intérêt.
  //
  //  🔴 CET ÉCRAN EST LE SEUL ENDROIT OÙ LE CHROMATIQUE SE CONSTATE. On ne le
  //     laisse pas passer dans un journal qui défile : on s'arrête dessus.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranPrise(mon, apres) {
    var e = ESP()[mon.n];
    var ec = W.PokeEclat ? W.PokeEclat.lire(mon) : null;
    var nom = esc(mon.surnom || e.nom[LANG()]);
    var chroma = ec && ec.chromatique;
    // La clé du palier donne la clé du texte : `solide` → `dSolide`. Les deux
    // listes ne peuvent donc pas se désaccorder, et `poke-coherence` refuse
    // toute clé manquante.
    var cleDit = ec ? "d" + ec.grade.cle.charAt(0).toUpperCase() + ec.grade.cle.slice(1) : "dCorrect";
    // Le starter ne compte pas : il est donné, pas attrapé. La première VRAIE
    // capture est la deuxième entrée du Pokédex du voyage.
    var premiereDuVoyage = !partie.premiereFaite;
    if (premiereDuVoyage) partie.premiereFaite = true;

    coque(
      '<p class="pkdx-surtitre">' + T(chroma ? "nChromatique" : "nPrise") + "</p>" +
      '<h1 class="pkdx-titre">' + T("priseTitre", { nom: nom }) + "</h1>" +
      '<p class="pkdx-dit">' + T(chroma ? "priseChromatique" : cleDit, { nom: nom }) + "</p>" +
      // 🔴 LA PREMIÈRE CAPTURE D'UN VOYAGE A SA PHRASE, et elle dormait dans
      //    `POKE_SCENARIO.POKEDEX`. C'est le geste fondateur du jeu — celui
      //    qu'on n'oublie pas — et il passait exactement comme le trentième.
      //    Elle ne s'affiche qu'une fois : une phrase de première fois répétée
      //    n'est plus une phrase de première fois.
      (premiereDuVoyage
        ? '<p class="pkdx-dit">' +
            W.PokeGenre.pour(W.POKE_SCENARIO.POKEDEX, "premiereCapture", null, "scenario:pokedex") +
          "</p>"
        : "") +
      '<div class="pkdx-prise">' +
        '<figure class="pkdx-prise-art"' + (chroma ? ' data-chromatique="oui"' : "") + ">" +
          '<img alt="' + nom + '" src="assets/img/poke/art/' + mon.n + '.webp">' +
        "</figure>" +
        '<dl class="pkdx-prise-releve">' +
          "<div><dt>" + T("priseNiveau") + "</dt><dd>" + mon.niveau + "</dd></div>" +
          "<div><dt>" + T("priseTypes") + "</dt><dd>" +
            e.types.map(function (t) { return W.PokeType.pastille(t); }).join(" ") + "</dd></div>" +
          (ec ? "<div><dt>" + T("prisePotentiel") + "</dt><dd>" +
            '<b data-grade="' + ec.grade.cle + '">' + ec.grade.nom[LANG()] + "</b> " +
            '<span class="pkdx-prise-chiffre">' + ec.somme + " / " + ec.sur + "</span>" +
            // 🔴 AUDIT NOUVEAU JOUEUR : « ORDINAIRE 26 / 60 » sans un mot
            //    d'explication — la question « 26 de quoi ? » est immédiate,
            //    et aucune infobulle ne vivait sur cet écran. Une ligne dit ce
            //    que c'est ; le chiffre, lui, était déjà honnête.
            '<span class="pkdx-prise-dit">' + T("priseDitPotentiel") + "</span>" +
            "</dd></div>" : "") +
        "</dl>" +
      "</div>" +
      // ═══════════════════════════════════════════════════════════════════════
      //  LE SURNOM — SEIZE LECTURES, AUCUNE ÉCRITURE
      //
      //  🔴 `mon.surnom` ÉTAIT LU PARTOUT ET N'ÉTAIT JAMAIS ÉCRIT. Le combat
      //     l'affiche à la place du nom d'espèce, la réserve, le duel, l'écran
      //     de fin, la carte de partage, et le PC le garde ENTRE LES VOYAGES —
      //     seize lectures dans six fichiers. Une seule écriture existait :
      //     le surnom canon d'un Pokémon ÉCHANGÉ (« DUX »). Le joueur, lui, n'a
      //     jamais pu nommer un seul de ses Pokémon.
      //
      //  🔴 ET C'EST LE GESTE D'ATTACHEMENT DU JEU. Dans un mode où un Pokémon
      //     à terre disparaît de l'équipe pour de bon, le nom est ce qui fait
      //     que la perte compte. Toute la couche d'affichage l'attendait
      //     depuis le premier jour — il manquait la porte, et rien d'autre.
      //
      //  🔴 IL RESTE FACULTATIF, ET EN UN CLIC. Un champ imposé à chaque
      //     capture casserait le rythme d'un nœud qui en enchaîne quatre :
      //     « CONTINUER » reste l'action par défaut, à sa place, et le champ
      //     ne coûte rien à qui l'ignore.
      // ═══════════════════════════════════════════════════════════════════════
      '<div class="pkdx-surnom">' +
        '<label for="pk-surnom">' + T("surnomDit") + "</label>" +
        // ⚠️ PRÉ-REMPLI PAR LE PC. Reprendre un Bulbizarre déjà nommé au
        //    voyage d'avant ressort son nom — c'est la promesse « il le
        //    gardera » tenue à l'endroit exact où elle est faite.
        '<input id="pk-surnom" type="text" maxlength="12" autocomplete="off"' +
          ' spellcheck="false" placeholder="' + esc(e.nom[LANG()]) + '"' +
          ' value="' + esc(surnomDuCompte(mon.n)) + '">' +
      "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-prise">' + T("priseSuite") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-prise").addEventListener("click", function () {
      // 🔴 LE SURNOM SE POSE AVANT DE CONTINUER, et il se nettoie : les espaces
      //    de bord, les caractères de contrôle et la longueur. Douze signes,
      //    comme le jeu d'origine en autorisait dix — de quoi écrire un nom
      //    sans déborder d'une fiche de combat de 160 pixels.
      // Une seule porte pour tous les surnoms : douze signes, pas de
      // caractere de controle, pas de repetition du nom d'espece.
      poserSurnom(mon, racine.querySelector("#pk-surnom"));
      son("PRESS_AB");
      apres();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE BUTIN — TROIS CARTES, ON EN PREND UNE
  //
  //  🔴 C'EST LE MOTEUR D'ADDICTION DU MODE, et il manquait entièrement. On
  //     battait un dresseur, on recevait de l'argent, et rien ne se décidait.
  //     Ce n'est pas la récompense qui accroche — c'est LE CHOIX : trois
  //     cartes, on en prend une, on renonce aux deux autres. La même grammaire
  //     que la carte à embranchements, à l'échelle du combat.
  //
  //  🔴 ON PEUT TOUT REFUSER. Une fenêtre sans sortie n'est pas un choix, c'est
  //     un péage — et le joueur qui n'a besoin de rien doit pouvoir passer.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉCRAN DU SERMENT — LE SEUL MOMENT DU VOYAGE OÙ L'ON S'ENGAGE
  //
  //  🔴 IL VIENT APRÈS LE BADGE ET AVANT LE BUTIN, et cet ordre porte tout le
  //     sens. Le badge est l'acquis, le butin est la récompense — entre les
  //     deux, le serment est le PRIX. Posé après le butin, il aurait ressemblé
  //     à une deuxième récompense ; posé avant le badge, il aurait pesé sur un
  //     combat qu'on n'a pas encore gagné.
  //
  //  🔴 ON NE PEUT PAS REFUSER, ET C'EST L'INVERSE DE L'ÉCRAN DE BUTIN. Là-bas
  //     on peut tout laisser : refuser trois objets ne change rien à ce qu'on
  //     est. Ici, refuser serait la meilleure option à chaque fois — chaque
  //     serment coûte quelque chose. Un choix qu'on peut décliner sans frais
  //     n'est pas un choix, et le mode a déjà refusé une case à cocher.
  //     La contrepartie est écrite : chaque carte dit son coût ET sa force,
  //     en deux propositions courtes, **et le coût passe en premier**.
  //  ⚖️ CETTE DERNIÈRE AFFIRMATION A ÉTÉ FAUSSE PENDANT DES SEMAINES. Relevé
  //     le 09/08 sur les vingt-six : **dix seulement le faisaient**. Les seize
  //     autres commençaient par le gain — « Tu frappes plus fort. Tu encaisses
  //     moins bien. » La règle décrivait une intention, pas le fichier, et la
  //     v375 avait rabaissé l'affirmation faute de pouvoir trancher.
  //     🔴 TRANCHÉ LE 09/08, ET LES SEIZE PHRASES SONT RÉÉCRITES, dans les deux
  //        langues. **Le coût d'abord**, parce que le serment EST le prix du
  //        badge et qu'on ne peut pas le refuser : trois cartes forcées se
  //        comparent par ce qu'elles COÛTENT, pas par ce qu'elles promettent.
  //     ✅ `tools/poke-serments-ordre.mjs` le tient désormais — éprouvé par six
  //        sabotages, et calibré avant d'être écrit : « gagnent » sert aux deux
  //        camps, c'est le SUJET qui tranche.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranSerment(apres) {
    var S = W.PokeSerments;
    if (!S) return apres();
    var offres = S.offrir(partie, hasard, 3);
    if (!offres.length) return apres();

    coque(
      '<p class="pkdx-surtitre">' + T("sermentSur") + "</p>" +
      '<h1 class="pkdx-titre">' + T("sermentTitre") + "</h1>" +
      '<p class="pkdx-dit">' + T("sermentDit") + "</p>" +
      '<p class="pkdx-dit">' + T("sermentMaintenant") + "</p>" +
      '<div class="pkdx-butin pkdx-serments">' + offres.map(function (s, i) {
        return '<button type="button" class="pkdx-carte-butin pkdx-carte-serment" data-serment="' + i + '">' +
          '<span class="pkdx-butin-haut">' +
            '<span class="pkdx-butin-icone">' + W.PokeIcones.svg("boss", { taille: 32 }) + "</span>" +
            '<span class="pkdx-butin-rarete">' + T("sermentRang") + "</span>" +
          "</span>" +
          '<span class="pkdx-butin-nom">' + esc(s.nom[LANG()]) + "</span>" +
          '<span class="pkdx-butin-dit">' + esc(s.dit[LANG()]) + "</span>" +
          // 🔴 CE QUE ÇA DONNE UNE FOIS EMPILÉ. L'écran des acquis le disait
          //    depuis longtemps ; celui-ci, choisi huit fois par voyage et
          //    porteur des effets les plus lourds, montrait la phrase brute.
          ditAcquisCompose(s, "serments") +
        "</button>";
      }).join("") + "</div>" +
      // 🔴 CE QU'ON A DÉJÀ JURÉ RESTE SOUS LES YEUX. Au huitième badge, un
      //    joueur ne se souvient plus de ses sept engagements — et c'est
      //    précisément à ce moment que le choix compte le plus.
      (partie.serments && partie.serments.length
        ? '<p class="pkdx-dit pkdx-serments-tenus">' + T("sermentTenus") + " " +
            // 🔴 ET IL DIT CE QU'IL FAIT. La liste ne portait que des NOMS,
            //    juste sous un commentaire qui explique qu'au huitième badge on
            //    ne s'en souvient plus. Le fil des acquis, lui, ouvre sa phrase
            //    depuis toujours — deux rappels côte à côte, un seul qui
            //    rappelle vraiment.
            partie.serments.map(function (id) {
              var d = S.de(id);
              return d ? '<span data-info="serment" data-info-val="' + esc(id) + '">' +
                esc(d.nom[LANG()]) + "</span>" : "";
            }).filter(Boolean).join(" · ") + "</p>"
        : "")
    );
    surClic("[data-serment]", function (e) {
      var s = offres[+e.currentTarget.getAttribute("data-serment")];
      S.prendre(partie, s.id);
      son("GET_ITEM_2");
      apres();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉCRAN DE CHOIX D'UN ACQUIS — LE MÊME GABARIT QUE LE SERMENT, ET C'EST
  //  VOULU : le serment est le PRIX du badge, l'acquis est le GAIN du voyage.
  //  Deux faces d'un même geste, donc deux écrans qui se lisent pareil.
  //  ⚠️ LE GESTE EST JOURNALISÉ. Le serveur rejoue la partie depuis la graine
  //     pour valider le score ; un choix de joueur qui ne laisse pas de trace
  //     rend le rejeu impossible. Le mode est fermé aujourd'hui, donc rien ne
  //     le relit encore — mais un piège posé maintenant se paierait le jour de
  //     l'ouverture, sur les scores de tout le monde.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE CET ACQUIS TE DONNERA, À TOI — pas dans l'absolu
  //
  //  🔴 LES SERMENTS ET LES ACQUIS NE SE VOYAIENT PAS. « La bourse tenue :
  //     l'argent rentre moitié plus » se lit pareil qu'on ait juré l'avarice ou
  //     non — alors que le jeu COMPOSE les deux depuis toujours, par la même
  //     porte, et connaît le résultat exact au moment où il pose la carte.
  //     C'est la classe de défaut n°1 du dossier, posée sur son système le plus
  //     profond : celui qui devait faire dire « c'est le joueur qui a fabriqué
  //     cette rencontre ».
  //
  //  ⚠️ ON NE PARLE QUE QUAND IL Y A QUELQUE CHOSE À DIRE. Si rien d'autre ne
  //     pousse la clé, la phrase de l'acquis suffit et une seconde ligne serait
  //     du bruit. On ne sort la composition que si le total en jeu est déjà
  //     déplacé — c'est-à-dire exactement quand la promesse peut tromper.
  //  ⚠️ EN POURCENTAGE, PAS EN MULTIPLICATEUR : « de 50 % à 75 % » se lit ;
  //     « ×0,5 → ×0,75 » demande de savoir lire un multiplicateur.
  // ═══════════════════════════════════════════════════════════════════════════
  var CLE_MOT = {
    argent: "cArgent", expGain: "cExp", capture: "cBalls",
    degatsInfliges: "cCoups", degatsSubis: "cEncaisse",
  };
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 « DE 120 % À 106 % » NE DIT PAS SI C'EST UNE BONNE NOUVELLE, et deux
  //     joueurs ont classé « La garde haute » en malus le 16/08 — l'un a même
  //     ouvert un rapport de bug intitulé « Un serment uniquement malus ? ».
  //     Deux raisons se cumulent, et aucune n'est de leur fait :
  //       · pour les dégâts subis, c'est le chiffre le PLUS BAS qui est bon —
  //         l'inverse des quatre autres clés ;
  //       · la base n'est presque jamais 100 % (ici 120 %, à cause d'un autre
  //         acquis déjà porté), donc l'amélioration reste au-dessus de 100 et
  //         se lit « j'encaisse plus que la normale ».
  //  ✅ ON DIT LE SENS, EN TROIS MOTS ET SANS ACCORD. « C'est mieux » est
  //     invariable : c'est la seule forme qui survit à un sujet tantôt
  //     singulier (« l'argent ») tantôt pluriel (« tes Balls ») — la faute que
  //     le commentaire de `acquisCompose` documente déjà pour le verbe.
  //  ⚠️ ET ÇA VAUT DANS LES DEUX SENS. « La poigne » frappe plus fort ET
  //     encaisse plus : sa seconde ligne dira « c'est pire », ce qui est
  //     exactement le contrat que le joueur accepte en la prenant.
  // ═══════════════════════════════════════════════════════════════════════════
  var CLE_SENS = { degatsSubis: -1 };   // −1 : plus bas vaut mieux

  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 SEUL L'ÉCRAN DES ACQUIS COMPOSAIT. Celui des SERMENTS — choisi HUIT fois
  //     par voyage, porteur des effets les plus lourds du mode — affichait la
  //     phrase brute de la carte : « tu frappes moitié plus fort », sans dire
  //     que le composé passe de 150 % à 225 %. Le jeu connaissait le chiffre au
  //     moment exact où le joueur tranche, et se taisait : classe n°1.
  //  ⚠️ `champ` NOMME LA LISTE À LAQUELLE ON AJOUTE — `acquis` ou `serments` —
  //     parce que la simulation doit ajouter la carte AU BON ENDROIT pour que
  //     `PokeSerments.effet` la voie. Une seule fonction, deux appelants.
  // ═══════════════════════════════════════════════════════════════════════════
  function ditAcquisCompose(q, champ) {
    var S = W.PokeSerments;
    if (!S || !q.effet) return "";
    var ou = champ || "acquis";
    var avant = S.effet(partie);
    var copie = {};
    for (var k in partie) copie[k] = partie[k];
    copie[ou] = (partie[ou] || []).concat([q.id]);
    var apres = S.effet(copie);
    // La clé la plus déplacée par CET acquis, parmi celles qu'on sait nommer.
    var cle = null, ecart = 0;
    for (var c in q.effet) {
      if (!CLE_MOT[c] || typeof avant[c] !== "number") continue;
      var d = Math.abs(apres[c] - avant[c]);
      if (d > ecart) { ecart = d; cle = c; }
    }
    // Rien d'autre ne pousse cette clé : la phrase de l'acquis suffit.
    if (!cle || Math.abs(avant[cle] - 1) < 0.02) return "";
    var sens = CLE_SENS[cle] || 1;
    var mieux = (apres[cle] - avant[cle]) * sens > 0;
    return '<span class="pkdx-acquis-compose">' +
      esc(T("acquisCompose", {
        quoi: T(CLE_MOT[cle]),
        a: Math.round(avant[cle] * 100),
        b: Math.round(apres[cle] * 100),
      })) + " " +
      '<b class="pkdx-acquis-sens" data-sens="' + (mieux ? "mieux" : "pire") + '">' +
        esc(T(mieux ? "acquisMieux" : "acquisPire")) + "</b></span>";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'ON PERD EN CHOISISSANT — UNE SEULE PORTE, ET ELLE COMPTE
  //
  //  🔴 TROIS ÉCRANS DISAIENT « les deux autres » SANS REGARDER LA LISTE : le
  //     butin (jusqu'à SIX cartes avec le Serment de l'Abondance — c'est le
  //     rapport de Tadomikari), les acquis et les capsules (qui en servent
  //     parfois MOINS de trois, quand le vivier s'épuise en fin de voyage).
  //  🔑 LA CLASSE : *un texte qui chiffre une liste sans la compter*. Elle se
  //     ferme en composant la phrase AU MÊME ENDROIT pour les trois — sinon le
  //     quatrième écran de choix la rouvrira.
  //  ⚠️ À zéro reste, on se TAIT : « les 0 autres sont perdus » serait pire
  //     que la faute d'origine. Les clés en `0` portent ce qu'il reste à dire.
  // ═══════════════════════════════════════════════════════════════════════════
  function ditDuReste(base, total) {
    var reste = Math.max(0, (total || 0) - 1);
    if (reste === 0) return TXT[base + "0"] ? T(base + "0") : "";
    return T(base, { n: reste });
  }
  //  Le paragraphe ne s'écrit pas s'il n'a rien à dire : une balise vide laisse
  //  une marge qui décale tout l'écran sans qu'aucun texte l'explique.
  function paraDuReste(base, total) {
    var dit = ditDuReste(base, total);
    return dit ? '<p class="pkdx-dit">' + dit + "</p>" : "";
  }
  //  « Prends-en un sur 6 » — et « Prends-le » quand il n'y a rien à comparer :
  //  annoncer un choix devant une seule carte serait une promesse vide.
  function titreDuChoix(base, total) {
    return (total || 0) <= 1 ? T(base + "1") : T(base, { n: total });
  }

  function ecranAcquis(carte, apres) {
    var A = W.PokeAcquis;
    var offres = A ? A.triplet(A.ouverts(partie), carte.rang || 0) : [];
    if (!offres.length) return apres();

    coque(
      '<p class="pkdx-surtitre">' + T("acquisSur") + "</p>" +
      '<h1 class="pkdx-titre">' + titreDuChoix("acquisTitre", offres.length) + "</h1>" +
      paraDuReste("acquisDit", offres.length) +
      '<div class="pkdx-butin pkdx-serments">' + offres.map(function (q, i) {
        return '<button type="button" class="pkdx-carte-butin pkdx-carte-serment" data-acquis="' + i + '">' +
          '<span class="pkdx-butin-haut">' +
            '<span class="pkdx-butin-icone">' + W.PokeIcones.svg("badge", { taille: 32 }) + "</span>" +
            // ⚠️ DEUX CLASSES, ET C'EST VOULU. `pkdx-butin-rarete` porte le
            //    style ; `data-loi-marqueur` dit le MÉTIER. Une CLASSE aurait été
            //    refusée à juste titre par `poke-classes-css` : une classe sans
            //    style ne fait rien. La même classe servait
            //    à trois choses — une rareté (« COURANT »), une catégorie
            //    (« SERMENT ») et une RÈGLE (« POUR TOUJOURS ») — et aucun
            //    contrôle ne pouvait donc exiger une loi sans crier sur les
            //    deux autres. *Un marqueur qui énonce une règle se distingue
            //    dans le balisage, pas dans la tête de celui qui relit.*
            '<span class="pkdx-butin-rarete" data-loi-marqueur data-info="loi" data-info-val="acquis">' +
              T("acquisRang") + "</span>" +
          "</span>" +
          '<span class="pkdx-butin-nom">' + esc(q.nom[LANG()]) + "</span>" +
          '<span class="pkdx-butin-dit">' + esc(q.dit[LANG()]) + "</span>" +
          ditAcquisCompose(q) +
        "</button>";
      }).join("") + "</div>" +
      // Ce qu'on porte déjà reste sous les yeux : un acquis se CUMULE, donc le
      // bon choix dépend des précédents. Même raison qu'aux serments tenus.
      (partie.acquis && partie.acquis.length
        ? '<p class="pkdx-dit pkdx-serments-tenus">' + T("acquisTenus") + " " +
            // 🔴 ET SUR L'ÉCRAN DE CHOIX, LE RAPPEL DOIT DIRE L'EFFET. C'est le
            //    pire des trois rappels à n'avoir eu que des noms : le
            //    commentaire ci-dessus explique que le bon choix DÉPEND des
            //    précédents, et la liste ne disait pas ce qu'ils font.
            partie.acquis.map(function (id) {
              var d = A.de(id);
              return d ? '<span data-info="acquis" data-info-val="' + esc(id) + '">' +
                esc(d.nom[LANG()]) + "</span>" : "";
            }).filter(Boolean).join(" · ") + "</p>"
        : "")
    );
    surClic("[data-acquis]", function (e) {
      var q = offres[+e.currentTarget.getAttribute("data-acquis")];
      A.poser(partie, q.id);
      noterGeste("acquis:" + q.id);
      W.PokeProgression.fusionner(partie);
      son("GET_ITEM_2");
      message(T("acquisSur"), T("acquisPris", { nom: q.nom[LANG()] }), apres);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉCRAN DE CHOIX D'UNE CAPSULE
  //
  //  🔴 IL FALLAIT LA MÊME FORME QUE L'ACQUIS, ET PAS UNE COPIE DE PLUS. Les
  //     deux écrans partagent la coque, la grille et la classe de carte ; ce
  //     qui change est ce qu'une option DIT — et ça vient de `ditMachine`, la
  //     porte que l'étal du grand magasin lit déjà. Deux phrases séparées pour
  //     la même capsule auraient fini par se contredire d'un écran à l'autre.
  //
  //  🔴 ET ON ENCHAÎNE SUR LE SAC. Une machine posée dans `partie.ct` et jamais
  //     enseignée ne change rien — c'est la classe de défaut n°1 du dossier :
  //     le jeu sait, et il ne dit pas. Le message nomme l'endroit, puis y mène.
  //     Un clic sur « retour » suffit à passer : on propose, on n'impose pas.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranCapsule(carte, apres) {
    var offres = W.PokeButin.machinesDe(partie, carte);
    if (!offres.length) return apres();

    coque(
      '<p class="pkdx-surtitre">' + T("ctSur") + "</p>" +
      '<h1 class="pkdx-titre">' + titreDuChoix("ctTitre", offres.length) + "</h1>" +
      paraDuReste("ctDit", offres.length) +
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 LA HIÉRARCHIE DE LA CARTE D'ÉTAL NE CONVENAIT PAS ICI, ET ÇA S'EST
      //     VU À L'ÉCRAN. Reprise telle quelle, elle mettait en tête « CT03
      //     Danse Lames » — un numéro et un nom qui ne décident de rien — et
      //     reléguait en fin de phrase grise « touche 3 de Ondine sur 3 »,
      //     c'est-à-dire la SEULE ligne qui départage les trois options.
      //     Sur l'étal, une machine est un article parmi vingt-quatre et une
      //     ligne suffit ; ici, c'est une décision entre trois.
      //  ✅ On ouvre donc par le TYPE et la puissance — les deux faits qu'on
      //     compare — et la prise sur le Champion se détache en bas, à part.
      //  ⚠️ Elle se dit en ENCRE, jamais en couleur : la loi du mode réserve la
      //     couleur aux types et aux créatures. Un vert « c'est bon » ici
      //     nommerait une opinion, pas une donnée du jeu.
      // ═══════════════════════════════════════════════════════════════════
      '<div class="pkdx-butin pkdx-capsules">' + offres.map(function (m, i) {
        var f = faitsMachine(m);
        return '<button type="button" class="pkdx-carte-butin pkdx-carte-capsule" data-capsule="' + i + '"' +
            (f.type ? W.PokeType.attr(f.type) : "") + ">" +
          '<span class="pkdx-butin-haut">' +
            (f.type ? W.PokeType.pastille(f.type) : "") +
            '<span class="pkdx-butin-rarete" data-loi-marqueur data-info="loi" data-info-val="machine">' +
              T("ctRang") + "</span>" +
          "</span>" +
          '<span class="pkdx-butin-nom">' + nomMachine(m) + "</span>" +
          '<span class="pkdx-capsule-coup">' + f.coup + "</span>" +
          '<span class="pkdx-butin-dit">' + f.qui + "</span>" +
          (f.ditContre
            ? '<span class="pkdx-capsule-contre' + (f.contre.n ? " est-prise" : "") + '">' +
                f.ditContre + "</span>"
            : "") +
        "</button>";
      }).join("") + "</div>"
    );
    surClic("[data-capsule]", function (e) {
      var m = offres[+e.currentTarget.getAttribute("data-capsule")];
      // La MÊME porte que l'achat et que le don du Champion : une seule façon
      // de ranger une machine, sinon deux comptes finiraient par diverger.
      // 🔴 ET ON LIT LE RETOUR. Le premier jet appelait `donnerCT(partie,
      //    m.cle)` — la clé du COUP là où elle attend une clé d'OBJET. Elle
      //    rendait `{ok:false}`, le joueur voyait « CT24 Tonnerre » sur un
      //    écran de félicitations, et le sac restait vide. Un retour ignoré est
      //    un défaut qui n'a aucune chance d'être vu.
      var r = O().poserMachine(partie, m);
      if (!r.ok) { son("DENIED"); return apres(); }
      noterGeste("ct:" + m.n);
      W.PokeProgression.fusionner(partie);
      son("GET_KEY_ITEM");
      message(T("ctSur"), T("ctPrise", { quoi: nomMachine(m) }), function () {
        ecranSac(apres);
      });
    });
  }

  function ecranButin(apres, boss) {
    // 🔴 LE SERMENT DE L'ABONDANCE SE VOIT ICI, ET C'EST TOUT CE QU'IL FAIT :
    //    une carte de plus sur la table. Un tirage plus large n'est PAS un
    //    tirage plus riche — les poids ne bougent pas —, c'est un choix plus
    //    libre. La distinction compte : elle empêche un serment de déséquilibrer
    //    la rareté du mode en même temps qu'il ouvre l'éventail.
    var cartes = W.PokeButin.tirer(partie, hasard,
      // 🔴 On ne passe plus `combien` : `PokeButin.tirer` compose lui-même le
      //    nombre depuis les serments. Le calculer ici en faisait une valeur que
      //    chaque appelant devait refaire — et le harnais de mesure ne la
      //    refaisait pas, donc `butinChoix` n'existait pas dans les mesures.
      { acte: partie.acte, boss: boss });
    if (!cartes.length) return apres();

    coque(
      '<p class="pkdx-surtitre">' + T(boss ? "butinBoss" : "butinTitre") + "</p>" +
      '<h1 class="pkdx-titre">' + titreDuChoix("butinChoisis", cartes.length) + "</h1>" +
      paraDuReste("butinPerdu", cartes.length) +
      '<div class="pkdx-butin">' + cartes.map(function (c, i) {
        // 🔴 LA RARETÉ SE DIT ET LE TYPE SE MONTRE. Un liseré de quatre pixels
        //    ne se lit pas d'un coup d'œil, et c'est l'écran le plus vu du jeu.
        //    La pastille de type d'une CT passe par la porte unique : la
        //    couleur nomme le type, comme partout ailleurs.
        // 🔴 UNE SEULE PASTILLE POUR UNE CARTE QUI EN MET TROIS EN JEU aurait
        //    menti sur ce qu'on gagne. Depuis que la capsule porte un choix,
        //    c'est l'ÉVENTAIL des types offerts qui décide de prendre la carte
        //    — « Eau · Plante · Normal » se compare aux deux autres cartes,
        //    « Normal » seul aurait fait passer à côté de la réponse à Ondine.
        return '<button type="button" class="pkdx-carte-butin" data-butin="' + i +
            '" data-rarete="' + esc(c.rarete) + '">' +
          '<span class="pkdx-butin-haut">' +
            '<span class="pkdx-butin-icone">' + W.PokeIcones.svg(icôneButin(c), { taille: 32 }) + "</span>" +
            '<span class="pkdx-butin-rarete">' + T("r" + c.rarete.charAt(0).toUpperCase() + c.rarete.slice(1)) + "</span>" +
          "</span>" +
          '<span class="pkdx-butin-nom">' + nomButin(c) + "</span>" +
          '<span class="pkdx-butin-dit">' + ditButin(c) + "</span>" +
          dejaEnSac(c) +
          pastillesButin(c) +
        "</button>";
      }).join("") + "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche" id="pk-rien">' + T("butinRien") + "</button>" +
      "</div>"
    );
    surClic("[data-butin]", function (e) {
      var c = cartes[+e.currentTarget.getAttribute("data-butin")];
      W.PokeButin.prendre(partie, c);
      // L'acquis ne se ramasse pas, il se choisit : la carte ouvre un écran.
      if (c.type === "acquis") { son("PRESS_AB"); return ecranAcquis(c, apres); }
      // La capsule non plus, depuis qu'elle en met trois en jeu.
      if (c.type === "ct") { son("PRESS_AB"); return ecranCapsule(c, apres); }
      W.PokeProgression.fusionner(partie);
      // 🔴 LA RARETÉ S'ENTEND. Une carte rare et une carte ordinaire se
      //    ramassaient du même geste et du même silence — alors que le liseré
      //    doré est justement l'instant qu'on veut faire durer. Les fanfares du
      //    ROM sont graduées : la clé pour ce qui est rare, l'objet pour le
      //    reste. Deux sons, deux poids.
      son(c.rarete === "rare" ? "GET_KEY_ITEM" : "GET_ITEM_1");
      message(T("butinTitre"), T("butinPris", { quoi: nomButin(c) }), apres);
    });
    racine.querySelector("#pk-rien").addEventListener("click", function () { son("PRESS_AB"); apres(); });
  }

  function icôneButin(c) {
    if (c.type === "argent") return "boutique";
    if (c.type === "ct") return "objet";
    // Le pictogramme de l'acquis : il n'entre ni au sac ni dans l'équipe, il
    // reste sur le dresseur. Celui du badge est le seul qui dise « acquis ».
    if (c.type === "acquis") return "badge";
    if (c.type === "vitamine") return "centre";
    if (c.objet && /BALL/.test(c.objet)) return "ball";
    if (c.objet && /POTION|REVIVE/.test(c.objet)) return "centre";
    return "objet";
  }

  function nomButin(c) {
    if (c.type === "argent") return argent(c.montant);
    // 🔴 L'ACQUIS DIT SON NOM DE MONDE, pas sa clé. « La bourse tenue » se
    //    retient et se raconte ; « argent ×1,5 » se lit une fois et s'oublie.
    //    Le chiffre, lui, est dans la phrase juste dessous — on ne cache rien.
    if (c.type === "acquis") return T("bAcquisNom");
    // 🔴 LA CARTE NOMMAIT UNE MACHINE PRÉCISE — « CT24 Tonnerre » — et elle en
    //    met trois en jeu depuis. Un titre qui nomme une seule des trois
    //    options ferait croire que le choix est déjà fait.
    if (c.type === "ct") return T("bCtNom");
    return esc(nomObjet(c.objet)) + (c.n > 1 ? " ×" + c.n : "");
  }

  // Le nom d'affichage d'une machine : « CT24 Tonnerre ». Porte unique — la
  // carte, l'écran de choix et le message de prise le lisent ici.
  // Le préfixe d'une machine, dans la langue du joueur. Porte unique : trois
  // écrans l'écrivaient, un seul le décide.
  function prefixeMachine() { return LANG() === "en" ? "TM" : "CT"; }

  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 « CT2 » DANS LA BOUTIQUE, « CT02 » DANS LE BUTIN, « CT2 » ENCORE DANS LE
  //     SAC — et sur ce dernier, un « CT » écrit en dur qui ne devenait jamais
  //     « TM » en anglais. Une machine porte un NUMÉRO : trois écrans en
  //     donnaient trois formes, sur l'objet que le mode fait justement collectionner.
  //     Le zéro de tête est la forme du jeu d'origine dans les deux langues ;
  //     ce qui manquait, c'est qu'un seul endroit le décide.
  //  ⚠️ Le numéro se sépare du NOM, parce que le sac n'affiche que le numéro :
  //     une porte qui rendrait toujours « CT02 Tonnerre » l'obligerait à
  //     découper la chaîne, et on aurait recréé la troisième forme.
  // ═══════════════════════════════════════════════════════════════════════════
  function numeroMachine(m) { return prefixeMachine() + (m.n < 10 ? "0" : "") + m.n; }

  function nomMachine(m) {
    // 🔴 « CT » EST L'ABRÉVIATION FRANÇAISE DE « CAPSULE TECHNIQUE », et elle
    //    restait telle quelle en anglais — un anglophone lisait « A technical
    //    machine · CT12 Water Gun ». Relevé par les TROIS agents du QA, et
    //    d'autant plus voyant que les Capsules Secrètes, elles, sont proprement
    //    localisées depuis toujours (`CS05 Flash` → `HM05 Flash`).
    //    ⚠️ Le zéro de tête reste : c'est la forme du jeu d'origine dans les
    //       deux langues, et deux écrans l'écrivaient déjà différemment.
    return numeroMachine(m) + " " + esc(nomAttaque(m.cle));
  }

  // Les pastilles de type d'une carte. Une machine porte le type de son coup ;
  // une carte de capsule porte les trois qu'elle offre, sans doublon — deux
  // pastilles identiques feraient croire à deux options du même type.
  // Ce que le sac porte DÉJÀ de cet objet. Lecture pure : aucun effet, aucun
  // tirage. Le sac est la seule source — un compte tenu à côté divergerait.
  function dejaEnSac(c) {
    if (!c || !c.objet) return "";
    var n = (partie.sac && partie.sac[c.objet]) || 0;
    if (!n) return "";
    return '<span class="pkdx-butin-sac">' + T("butinDejaEnSac", { n: n }) + "</span>";
  }

  function pastillesButin(c) {
    var types = [];
    if (c.type === "ct") {
      var offres = W.PokeButin.machinesDe(partie, c);
      for (var i = 0; i < offres.length; i++) {
        var a = ATT()[offres[i].cle];
        if (a && types.indexOf(a.type) < 0) types.push(a.type);
      }
    }
    if (!types.length) return "";
    return '<span class="pkdx-butin-plus">' + types.map(function (t) {
      return W.PokeType.pastille(t);
    }).join("") + "</span>";
  }

  // Les trois acquis que cette carte met en jeu. 🔴 Une seule porte : le nom de
  //    la carte, sa légende et l'écran de choix lisent ici. Trois dépliages
  //    séparés finiraient par montrer trois triplets différents.
  function tripletDe(c) {
    if (!W.PokeAcquis) return [];
    return W.PokeAcquis.triplet(W.PokeAcquis.ouverts(partie), c.rang || 0);
  }

  // Ce que la carte FAIT, dit en une ligne. 🔴 Une carte qui ne dit pas son
  //    effet ne se compare pas — et sans comparaison, il n'y a pas de choix.
  function ditButin(c) {
    if (c.type === "argent") return T("bDitArgent");
    // 🔴 LA CARTE DIT CE QU'ELLE MET EN JEU. Une carte « surprise » ne se
    //    compare pas aux deux autres du butin — et sans comparaison il n'y a
    //    pas de choix, seulement un clic. On nomme donc les trois.
    if (c.type === "acquis") {
      // 🔴 ON DIT CE QUE ÇA FAIT AVANT DE NOMMER LES TROIS. « La bourse tenue ·
      //    Le flair » ne veut rien dire à qui n'a jamais vu le système : trois
      //    noms de monde sans phrase pour les tenir. La ligne dit d'abord la
      //    règle — un des trois, gardé jusqu'au bout — puis les nomme.
      return T("bAcquisDit") + " " +
        tripletDe(c).map(function (q) { return esc(q.nom[LANG()]); }).join(" · ");
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 DEUX CARTES DE CAPSULE, ET UNE SEULE PHRASE POSSIBLE. L'étal de la
    //     boutique vend UNE machine nommée (`{type:"ct", ct: n}`) ; la carte de
    //     butin en met TROIS en jeu (`{type:"ct", rang: r}`). La légende de
    //     l'une ne peut pas être celle de l'autre — mais la phrase par machine,
    //     elle, doit rester unique, sinon l'étal et l'écran de choix finiront
    //     par ne plus dire la même chose de la même capsule.
    // ═══════════════════════════════════════════════════════════════════════
    if (c.type === "ct" && c.ct) return ditMachine(ctDe(c.ct));
    if (c.type === "ct") {
      // 🔴 ON DIT LA RÈGLE AVANT DE NOMMER LES TROIS, comme la carte d'acquis.
      //    Trois noms de machines sans phrase pour les tenir ne disent pas
      //    qu'on n'en gardera qu'une.
      return T("bCtDit") + " " + W.PokeButin.machinesDe(partie, c)
        .map(function (m) { return nomMachine(m); }).join(" · ");
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  Tout le reste est de l'OBJET, et un objet n'a qu'une phrase : celle de
    //  `dits-objets.js`. Elle sert la carte de butin, l'étal de la boutique et
    //  l'infobulle du sac. Elle est sortie d'ici pour qu'un outil puisse
    //  l'appeler pour de vrai au lieu de relire cette source à la loupe.
    // 🔴 LA BRANCHE `type: "vitamine"` A DISPARU D'ICI, ET C'EST LE CORRECTIF.
    //    Elle donnait sa phrase à la carte de butin et à elle seule : la même
    //    Protéine parlait ramassée et se taisait achetée. La clé de l'objet
    //    suffit à la retrouver, donc il n'y a plus qu'un chemin.
    //  L'échappement reste ici : `dits-objets.js` ne produit pas de HTML.
    // ═══════════════════════════════════════════════════════════════════════
    var dit = W.PokeDits.objet(c.objet, T, function (s) { return esc(nomStat(s)); });
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 UNE PIERRE DIT QUI L'ATTEND, OU QUE PERSONNE NE L'ATTEND. La phrase
    //     de base affirmait « quelqu'un de ton équipe l'attend » sans regarder
    //     l'équipe — sur un objet à 2 100 ₽. C'est exactement le traitement
    //     déjà donné aux machines (« 3 de ton équipe peuvent l'apprendre ») :
    //     un prix ne devient une décision qu'avec le nom en face.
    //  ⚠️ On NOMME celui qui attend plutôt que de le compter : une pierre ne
    //     sert qu'à UN Pokémon à la fois, et « Évoli » décide mieux que « 1 ».
    // ═══════════════════════════════════════════════════════════════════════
    if (c.objet && /STONE/.test(c.objet) && partie && partie.equipe) {
      var attend = [];
      for (var pi = 0; pi < partie.equipe.length; pi++) {
        if (M().evolutionParPierre(partie.equipe[pi], c.objet)) attend.push(nomDe(partie.equipe[pi]));
      }
      dit += " " + (attend.length
        ? T("bDitPierreQui", { quoi: esc(attend.join(", ")) })
        : T("bDitPierrePersonne"));
    }
    return dit;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'UNE MACHINE VAUT, EN UNE LIGNE — PORTE UNIQUE
  //
  //  Trois écrans la lisent : l'étal du grand magasin, la carte de butin quand
  //  elle détaille une option, et l'écran de choix de la capsule. Elle dit trois
  //  choses dans cet ordre : ce que le coup fait, qui peut l'apprendre, et ce
  //  qu'il vaut contre le Champion qui ferme l'acte.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'UN COUP SANS DÉGÂTS FAIT — par la clé d'effet du moteur
  //
  //  ⚠️ LA TABLE EST INDEXÉE PAR LA CLÉ DU ROM, pas par le nom du coup : deux
  //     coups qui partagent un effet partagent la phrase, et un coup renommé ne
  //     perd rien. C'est aussi ce qui permet à `EFFETS_TRAITES` de trancher.
  // ═══════════════════════════════════════════════════════════════════════════
  var DIT_EFFET = {
    // ⚠️ `TOXIC_EFFECT` A ÉTÉ RETIRÉ (audit du 13/08) : aucune attaque ne le
    //    porte, et Toxik est reconnu à son NOM par le moteur — sa phrase est
    //    dans `DIT_COUP`. La laisser ici, c'était vendre la CT06 à 4 000 ₽
    //    avec la phrase d'une Poudre Toxik à 0 ₽.
    POISON_EFFECT: "eff_poison",
    PARALYZE_EFFECT: "eff_paralyse", SLEEP_EFFECT: "eff_sommeil",
    CONFUSION_EFFECT: "eff_confusion",
    ATTACK_UP1_EFFECT: "eff_atkUp", ATTACK_UP2_EFFECT: "eff_atkUp",
    DEFENSE_UP1_EFFECT: "eff_defUp", DEFENSE_UP2_EFFECT: "eff_defUp",
    // ⚠️ `SPEED_UP1_EFFECT` retiré pour la même raison : aucune des 165
    //    attaques ne le porte, Hâte porte `SPEED_UP2`.
    SPEED_UP2_EFFECT: "eff_vitUp",
    SPECIAL_UP1_EFFECT: "eff_speUp", SPECIAL_UP2_EFFECT: "eff_speUp",
    EVASION_UP1_EFFECT: "eff_esquiveUp",
    // ⚠️ `ATTACK_DOWN2` ET `SPEED_DOWN2` ONT ÉTÉ RETIRÉS : mesuré, AUCUNE des
    //    165 attaques ne les porte, et le moteur ne les traite pas. Deux
    //    phrases écrites pour personne, qui donnaient l'illusion d'une
    //    couverture. `DEFENSE_DOWN2` reste — Grincement le porte.
    ATTACK_DOWN1_EFFECT: "eff_atkDown",
    DEFENSE_DOWN1_EFFECT: "eff_defDown", DEFENSE_DOWN2_EFFECT: "eff_defDown",
    SPEED_DOWN1_EFFECT: "eff_vitDown",
    ACCURACY_DOWN1_EFFECT: "eff_precDown",
    HEAL_EFFECT: "eff_soin",
    REFLECT_EFFECT: "eff_reflet",
    SUBSTITUTE_EFFECT: "eff_clone",
    BIDE_EFFECT: "eff_riposte",
    MIMIC_EFFECT: "eff_copie",
    METRONOME_EFFECT: "eff_hasard",
    SWITCH_AND_TELEPORT_EFFECT: "eff_sortie",
    OHKO_EFFECT: "eff_ohko", SUPER_FANG_EFFECT: "eff_crocFatal",
  };

  // 🔴 LES COUPS DONT LA PUISSANCE MENT PLUS QU'ELLE N'INFORME. La carte montre
  //    le chiffre dès qu'il dépasse 1 — juste pour presque tous les coups, faux
  //    pour ceux-ci : Dévorêve annonce sa pleine puissance et ne fait RIEN sur
  //    une cible éveillée. La phrase reçoit `{p}` : le chiffre reste dit, il
  //    cesse d'être dit seul, et il n'est écrit nulle part en dur.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 ONZE CAPSULES SUR CINQUANTE SE VENDAIENT SUR LEUR SEUL CHIFFRE. Cette
  //     table n'avait que DEUX entrées, et tout le reste tombait dans
  //     « N de puissance ». Relevé sur `POKE_CT` : **CT47 Explosion « 170 de
  //     puissance » et CT36 Destruction « 130 » — le lanceur tombe K.O., et
  //     l'écran ne le disait pas**. CT09 Bélier, CT10 Damoclès et CT17
  //     Sacrifice (3 000 à 4 000 ₽) taisaient leur contrecoup ; CT02
  //     Coupe-Vent, CT22 Lance-Soleil, CT40 Coud'Krâne et CT43 Piqué taisaient
  //     leur TOUR DE CHARGE — le défaut même que le commentaire du dessous dit
  //     avoir corrigé… pour Tunnel et Vol seulement ; CT15 Ultralaser (5 000 ₽)
  //     taisait son tour de recharge ; CT20 Frénésie annonçait « 20 de
  //     puissance » pour un coup qui monte à chaque coup reçu.
  //  🔑 LA PARADE AVAIT ÉTÉ ÉCRITE PAR NOM DE COUP, donc elle ne couvrait que
  //     les quatre qu'on avait sous les yeux. Indexée par EFFET, elle couvre
  //     toute la famille — *détecter la classe, pas le cas*, la règle du dossier.
  // ═══════════════════════════════════════════════════════════════════════════
  var DIT_EFFET_FORT = {
    DREAM_EATER_EFFECT: "eff_reve", PAY_DAY_EFFECT: "eff_jackpot",
    EXPLODE_EFFECT: "eff_explose",
    RECOIL_EFFECT: "eff_recul",
    CHARGE_EFFECT: "eff_charge", FLY_EFFECT: "eff_charge",
    HYPER_BEAM_EFFECT: "eff_recharge",
    RAGE_EFFECT: "eff_frenesie",
  };

  // 🔴 ET LES COUPS QUE LEUR CLÉ D'EFFET NE DÉCRIT PAS DU TOUT. Riposte porte
  //    `NO_ADDITIONAL_EFFECT`, partagé par deux cents autres coups : aucune
  //    table indexée par l'effet ne peut la nommer. Sa mécanique vit dans son
  //    NOM, côté moteur comme ici — les deux tables se répondent, et
  //    `poke-effet-declare.mjs` exige qu'aucune n'ait de clé que l'autre ignore.
  //  🔴 ET REPOS DISAIT LA PHRASE D'E-COQUE. Les deux portent `HEAL_EFFECT`,
  //     donc Repos héritait de « Rend la moitié de ses PV » : faux deux fois,
  //     puisqu'il rend TOUT et qu'il endort deux tours — les deux seuls faits
  //     qui décident de l'acheter. *Un coup que le moteur traite à son NOM ne
  //     peut pas être décrit par la phrase de sa clé d'effet : cette phrase est
  //     écrite pour les AUTRES.* Tunnel et Vol de même : leur puissance
  //     s'affichait sans dire qu'elle coûte deux tours.
  //  🔴 ET TOXIK, LA CT LA PLUS CHÈRE DU POISON (4 000 ₽), SE VENDAIT AVEC LA
  //     PHRASE D'UNE POUDRE TOXIK. Les deux portaient `POISON_EFFECT` — mais
  //     le moteur reconnaît Toxik à son NOM depuis l'audit du 13/08 et pose un
  //     poison GRAVE, dont l'usure double, triple, quadruple. C'est le seul
  //     fait qui justifie le prix, et l'écran ne le disait pas.
  var DIT_COUP = {
    COUNTER: "eff_contre", REST: "eff_repos",
    DIG: "eff_deuxTours", FLY: "eff_deuxTours",
    TOXIC: "eff_toxik",
  };

  function ditEffet(a) {
    if (!a || !a.effet) return T("bDitStatut");
    var parNom = DIT_COUP[a.cle];
    var cle = parNom || DIT_EFFET_FORT[a.effet] || DIT_EFFET[a.effet];
    if (!cle) return T("bDitStatut");
    // Un coup reconnu à son NOM ne passe pas par le laissez-passer des clés
    // d'effet : c'est son nom que le moteur exécute, et `poke-effet-declare`
    // vérifie que les deux tables se répondent.
    if (parNom) return T(cle, { p: a.puissance });
    // 🔴 LA GARDE QUI COMPTE : on ne décrit que ce que le moteur exécute.
    //    Un effet absent d'`EFFETS_TRAITES` garde la phrase générique — le
    //    décrire serait promettre ce qui n'arrive pas.
    // ⚠️ ELLE A COÛTÉ DANS L'AUTRE SENS. Quatre effets s'exécutaient sans être
    //    déclarés, et cette garde les a fait taire : j'ai lu la LISTE et conclu
    //    que le moteur ne traitait pas le K.O. en un coup, alors qu'il le
    //    traite depuis le 07/08. *Un laissez-passer ne vaut que si la liste qui
    //    le délivre est tenue par le code — `poke-effet-declare.mjs` l'exige.*
    var traites = W.PokeCombat && W.PokeCombat.EFFETS_TRAITES;
    if (traites && traites.indexOf(a.effet) < 0) return T("bDitStatut");
    return T(cle, { p: a.puissance });
  }

  function faitsMachine(m) {
    var a = ATT()[m.cle];
    var qui = W.PokeObtenir.quiApprend(partie, m).length;
    var contre = ctContreLeBoss(m);
    return {
      type: a ? a.type : null,
      // 🔴 « FRAPPE ATLAS · 1 DE PUISSANCE » — vu en jouant. Les attaques à
      //    dégâts fixes portent 1 dans la table du ROM (Frappe Atlas, Ombre
      //    Nocturne, Sonicboom, Draco-Rage, Vague Psy) : montrer ce 1 est une
      //    donnée brute promue en phrase, et elle est FAUSSE — Frappe Atlas
      //    frappe au niveau du lanceur. On lit l'EFFET, pas le chiffre, et on
      //    dit la même chose que la carte de coup : « Dégâts fixes ».
      // ⚠️ ET DEUX COUPS PASSENT DEVANT LEUR PROPRE PUISSANCE : Dévorêve et
      //    Jackpot. Le chiffre est vrai chez eux, il est juste incomplet — la
      //    phrase le reprend et ajoute ce qu'il cache.
      coup: a && a.effet === "SPECIAL_DAMAGE_EFFECT" ? T("bDitFixe")
        : a && (DIT_COUP[a.cle] || DIT_EFFET_FORT[a.effet]) ? ditEffet(a)
        : a && a.puissance > 1 ? T("bDitCoup", { p: a.puissance })
        : ditEffet(a),
      qui: qui === 0 ? T("bDitQui0") : qui === 1 ? T("bDitQui1") : T("bDitQuiN", { n: qui }),
      contre: contre,
      ditContre: !contre ? "" : contre.n
        ? T("bCtContre", { n: contre.n, sur: contre.sur, champion: contre.champion })
        : T("bCtRien", { champion: contre.champion }),
    };
  }

  // La phrase d'une ligne — celle de l'étal, où une machine n'est qu'un article
  // parmi vingt-quatre et n'a droit qu'à une ligne.
  function ditMachine(m) {
    var f = faitsMachine(m);
    return f.coup + " · " + f.qui + (f.ditContre ? " · " + f.ditContre : "");
  }

  function ctDe(n) {
    var table = (W.PokeRegles && W.PokeRegles.ct ? W.PokeRegles.ct(partie) : W.POKE_CT) || [];
    for (var i = 0; i < table.length; i++) if (table[i].n === n) return table[i];
    return { n: n, cle: "?" };
  }
  function nomAttaque(cle) {
    var a = ATT()[cle];
    return a ? a.nom[LANG()] : cle;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'IL APPRENDRA ENSUITE — LA PHRASE QUI MANQUAIT
  //
  //  🔴 Voir la note de `jugeProchaine` : un joueur niveau 11 avec Héricendre a
  //     cru à un défaut parce que rien ne lui disait que Flammèche arrivait au
  //     12. Le jeu ne mentait pas, il se taisait.
  //  🔑 LA TABLE VIENT DU REGISTRE, jamais d'une globale : elle diffère entre
  //     les deux mondes, et la lire au mauvais endroit annoncerait à un
  //     Héricendre les apprentissages d'un Pokémon de Kanto portant le même
  //     numéro. C'est la classe de défaut n°1 du dossier.
  //  ⚠️ ON NE MONTRE QUE LA PROCHAINE. La liste entière est un gâchis : elle
  //     déflore quarante niveaux d'un coup et noie la seule information qui
  //     serve — « combien de niveaux avant que ça change ».
  //  ⚠️ ET ON SAUTE CE QU'IL SAIT DÉJÀ : un compagnon repris d'un ancien voyage
  //     arrive avec des attaques au-dessus de son niveau, et lui promettre ce
  //     qu'il a déjà serait un mensonge de plus.
  //  ⚠️ APRÈS UNE ÉVOLUTION, C'EST LA TABLE DE LA NOUVELLE ESPÈCE qui parle :
  //     on lit `m.n`, l'espèce du moment, pas celle de départ.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  COMMENT IL ÉVOLUE — voir la note sur `evoBonheur`.
  //
  //  🔑 LA TABLE VIENT DU REGISTRE, comme celle des attaques : Évoli n'a pas
  //     les mêmes évolutions dans les deux mondes — Mentali et Noctali
  //     n'existent qu'à partir de 1999. Lire une globale annoncerait à un
  //     joueur de Kanto une évolution qu'il ne peut pas obtenir.
  //  ⚠️ ON DIT TOUTES LES VOIES, PAS LA PREMIÈRE. Évoli en a cinq : n'en
  //     montrer qu'une ferait croire que les autres n'existent pas — c'est
  //     exactement le silence qu'on répare.
  //  ⚠️ ET ON NE DIT PAS VERS QUOI quand l'espèce n'est pas encore vue : le
  //     nom de l'évolution est un spoiler de Pokédex. On donne la CONDITION,
  //     qui est ce que le joueur cherche.
  // ═══════════════════════════════════════════════════════════════════════════
  function commentEvolue(m) {
    var e = m && ESP()[m.n];
    var liste = (e && e.evolue) || [];
    if (!liste.length) return T("evoRien");
    var dits = [], vus = {};
    for (var i = 0; i < liste.length; i++) {
      var ev = liste[i], mot = "";
      if (ev.par === "niveau") mot = T("evoNiveau", { n: ev.niveau });
      else if (ev.par === "pierre") mot = T("evoPierre", { o: nomObjet(ev.objet) });
      else if (ev.par === "echange") mot = T("evoEchange");
      else if (ev.par === "stat") mot = T("evoStat", { n: ev.niveau });
      else if (ev.par === "bonheur") {
        mot = ev.moment === "jour" ? T("evoBonheurJour")
          : ev.moment === "nuit" ? T("evoBonheurNuit") : T("evoBonheur");
      } else continue;
      if (vus[mot]) continue;
      vus[mot] = 1;
      dits.push(mot);
    }
    return dits.length ? dits.join(" · ") : T("evoRien");
  }

  //  Le nom d'un objet passe par la porte du monde — sinon la Pierre Foudre
  //  de Johto se lirait « THUNDERSTONE », défaut réglé le 20/08 au matin.
  function nomObjet(cle) {
    return (W.PokeRegles && W.PokeRegles.nomObjet) ? W.PokeRegles.nomObjet(cle) : String(cle || "");
  }

  function prochaineAttaque(m) {
    var e = m && ESP()[m.n];
    var liste = (e && e.apprend) || [];
    for (var i = 0; i < liste.length; i++) {
      var niv = liste[i][0], cle = liste[i][1];
      if (niv <= m.niveau) continue;
      var deja = false;
      for (var k = 0; k < (m.attaques || []).length; k++) {
        if (m.attaques[k].cle === cle) { deja = true; break; }
      }
      if (deja) continue;
      return T("jugeProchaine", { a: nomAttaque(cle), n: niv });
    }
    return T("jugeRienDeNeuf");
  }
  var NOMS_STAT = {
    pv: { fr: "PV", en: "HP" }, atk: { fr: "Attaque", en: "Attack" },
    def: { fr: "Défense", en: "Defense" }, vit: { fr: "Vitesse", en: "Speed" },
    spe: { fr: "Spécial", en: "Special" },
    // 🔴 1999 A SÉPARÉ LA SPÉCIALE EN DEUX. Sans ces deux entrées, tout écran
    //    qui nomme une statistique de Johto afficherait la CLÉ — « sat » — au
    //    joueur. `nomStat` replie sur la clé, et un repli qui montre du code
    //    est un défaut, pas une sécurité.
    sat: { fr: "Attaque Spéciale", en: "Sp. Attack" },
    sdf: { fr: "Défense Spéciale", en: "Sp. Defense" },
  };
  function nomStat(s) { return (NOMS_STAT[s] || { fr: s, en: s })[LANG()]; }

  // Le badge d'un rang donné est-il gagné ? Porte unique : la forme de
  // `partie.badges` a déjà piégé le bandeau une fois, elle ne le piégera plus
  // depuis deux endroits.
  function aLeBadge(ordre) {
    var b = (partie && partie.badges) || [];
    for (var i = 0; i < b.length; i++) if (b[i].ordre === ordre) return true;
    return false;
  }

  // Le son, avec sa garde. `PokeSon` peut manquer — le serveur ne le charge
  // pas, et un navigateur qui refuse l'audio ne doit pas casser un écran.
  function son(n, o) { if (W.PokeSon) W.PokeSon.jouer(n, o); }
  function criDe(n) { if (W.PokeSon) W.PokeSon.cri(n); }

  // ── Ce que la victoire a changé ────────────────────────────────────────────
  //  🔴 ET L'ÉVOLUTION SE REFUSE. C'est la feature 27 du contrat, et c'est un
  //     vrai choix de jeu : un Pokémon non évolué apprend ses attaques plus
  //     tôt. Le jeu d'origine laisse presser B ; ici, on propose un bouton.
  function ecranMontees(liste, apres) {
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LES NIVEAUX GAGNÉS D'UN COUP SE DISENT EN UNE PHRASE (12/08, Tatsu :
    //     « y a moyen de faire "passe du niveau 20 au niveau 24" plutôt que
    //     level par level ? »). Un Bonbon ou un gros gain d'expérience
    //     poussait un écran PAR niveau — quatre clics pour une seule nouvelle.
    //     On fusionne les montées CONSÉCUTIVES du même Pokémon ; une attaque
    //     apprise en route coupe la fusion à son palier, donc elle s'annonce
    //     toujours au bon niveau. Aucun tirage, pur affichage : le rejeu ne
    //     bouge pas.
    // ═══════════════════════════════════════════════════════════════════════
    var groupee = [];
    for (var g = 0; g < liste.length; g++) {
      var it = liste[g];
      var dernier = groupee[groupee.length - 1];
      if (it.ev.type === "niveau" && dernier && dernier.mon === it.mon &&
          dernier.ev.type === "niveau") {
        dernier.ev = {
          type: "niveau", niveau: it.ev.niveau,
          avant: dernier.ev.avant, apres: it.ev.apres,
          // le niveau AVANT la première montée de la série — celui d'où l'on part
          depuis: dernier.ev.depuis != null ? dernier.ev.depuis : dernier.ev.niveau - 1,
        };
        continue;
      }
      groupee.push({ mon: it.mon, ev: it.ev });
    }
    liste = groupee;
    var i = 0;
    function suivant() {
      if (i >= liste.length) {
        W.PokeTempo.apres(W.POKE_TRANSITION == null ? 400 : W.POKE_TRANSITION, apres);
        return;
      }
      var item = liste[i++];
      var mon = item.mon, ev = item.ev;
      var nom = esc(mon.surnom || ESP()[mon.n].nom[LANG()]);

      if (ev.type === "niveau") {
        son("LEVEL_UP");
        // [20/08, polish] La créature et ses deux niveaux face à face, pas une
        // ligne de texte dans une boîte : voir `messageMontee`.
        var depuis = ev.depuis != null ? ev.depuis : ev.niveau - 1;
        return messageMontee(mon, depuis, ev.niveau,
          ev.depuis != null && ev.niveau - ev.depuis > 1
            ? T("monteeSaut", { nom: nom, a: ev.depuis, b: ev.niveau })
            : T("montee", { nom: nom, n: ev.niveau }),
          suivant);
      }
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 [17/08, Poltron_sofa/Amex] « ILS S'ATTEIGNAIENT AU LEVEL 72, J'AI
      //     PROBABLEMENT PRIS UN MALUS MAIS JE NE SAIS PAS. » Il ne pouvait pas
      //     savoir : l'expérience rentrait, le niveau ne bougeait plus, et rien
      //     ne le disait. La règle existe depuis le 16/08 — le plafond de
      //     l'acte — et elle ne s'affichait QUE sur l'écran du PC, qu'on
      //     n'ouvre pas en plein défi du jour.
      //  ⚠️ UNE FOIS PAR ACTE, PAS UNE FOIS PAR COMBAT. Le moteur constate le
      //     blocage à chaque gain ; le répéter dix fois ferait du bruit et on
      //     cesserait de le lire. Le plafond change quand l'acte change : c'est
      //     donc l'acte qui décide de le redire.
      // ═══════════════════════════════════════════════════════════════════════
      if (ev.type === "plafond") {
        if (!partie || partie.plafondDit === partie.acte) return suivant();
        partie.plafondDit = partie.acte;
        return message(T("nMontee"), T("plafondAtteint", { nom: nom, n: ev.niveau }), suivant);
      }
      if (ev.type === "attaque") {
        //  ⚠️ MÊME RÈGLE QUE L'ÉVOLUTION CI-DESSOUS : l'événement porte l'état
        //     du moment où il a été poussé, l'écran se joue plus tard. Si
        //     l'attaque est déjà sue à l'ouverture (compagnon repris d'un
        //     autre voyage, signalement de Tatsu le 12/08), on passe — sinon
        //     le message annonce un apprentissage que `apprendre()` refuse,
        //     et à quatre attaques on demanderait d'en oublier une pour rien.
        var dejaSue = false;
        for (var k = 0; k < mon.attaques.length; k++) {
          if (mon.attaques[k].cle === ev.attaque) { dejaSue = true; break; }
        }
        if (dejaSue) return suivant();
        var att = ATT()[ev.attaque];
        var nomAtt = esc(att ? att.nom[LANG()] : ev.attaque);
        // Quatre attaques au maximum : au-delà, il faut en abandonner une.
        if (mon.attaques.length < 4) {
          M().apprendre(mon, ev.attaque);
          son("GET_ITEM_1");
          return message(T("nMontee"), T("apprend", { nom: nom, attaque: nomAtt }), suivant);
        }
        return ecranOublier(mon, ev.attaque, nomAtt, suivant);
      }
      if (ev.type === "evolution") {
        // 🔴 « CARABAFFE CHANGE ! IL VA DEVENIR CARABAFFE. » — vu en jouant,
        //    contre un dresseur à QUATRE Pokémon. Chaque victoire interne
        //    distribue ses suites, et tant que l'évolution n'est pas JOUÉE à
        //    l'écran, chaque lot suivant en rempile une : le même écran
        //    revenait, proposant au Pokémon de devenir ce qu'il est déjà.
        //    L'événement porte l'état du moment où il a été poussé — l'écran,
        //    lui, se joue plus tard. On vérifie donc À L'OUVERTURE que
        //    l'évolution est encore vraie ; sinon on passe au suivant.
        //  🔴 `suite()` N'EXISTE PAS DANS CETTE PORTÉE (12/08) : le garde
        //     levait une ReferenceError au lieu de passer — l'écran mourait
        //     précisément dans le cas qu'il devait sauver. La fonction de
        //     cette boucle s'appelle `suivant`.
        if (mon.n === ev.vers) return suivant();
        var vers = esc(ESP()[ev.vers].nom[LANG()]);
        // ═══════════════════════════════════════════════════════════════
        //  🔴 [22/08] DEUX CHEMINS SE CHOISISSENT, ILS NE SE TIRENT PAS.
        //     `voies` n'existe que pour l'évolution par bonheur d'Évoli :
        //     Mentali le jour, Noctali la nuit, et ce mode n'a pas
        //     d'horloge. Prendre la première en silence, c'est condamner
        //     l'autre sans le dire.
        //  ⚠️ ON REJOUE LE MÊME ÉVÉNEMENT : `i--` puis `suivant()`. Le choix
        //     fixe `vers`, et l'écran d'évolution — l'animation, le cri, le
        //     bouton ARRÊTER — reste le seul, en un seul exemplaire.
        // ═══════════════════════════════════════════════════════════════
        // 🔴 L'ÉCRAN VIT DEHORS, et c'est ce qui permet de le RELIRE : une
        //    porte de mesure le convoque sans jouer trente combats. Un écran
        //    qu'on ne peut pas convoquer est un écran qu'on ne repeint
        //    jamais — le Concours du 21/08 est parti sans un seul bouton
        //    pour cette raison exacte.
        if (ev.voies && ev.voies.length > 1 && !ev.choisi) {
          return ecranDeuxChemins(mon, ev, function () { i--; suivant(); });
        }
        coque(
          '<p class="pkdx-surtitre">' + T("nEvolution") + "</p>" +
          '<h1 class="pkdx-titre">' + T("evolueTitre", { nom: nom }) + "</h1>" +
          // 🔴 LA MISE EN SCÈNE COMPTE AUTANT QUE L'EFFET. L'ancienne forme
          //    clignote et s'efface, la nouvelle arrive en silhouette puis se
          //    révèle — c'est le battement du jeu d'origine, et c'est lui qui
          //    rend le moment satisfaisant.
          '<div class="pkdx-evolution">' +
            '<img class="est-avant" alt="" src="assets/img/poke/art/' + mon.n + '.webp">' +
            '<span class="pkdx-fleche" aria-hidden="true"></span>' +
            '<img class="est-apres" alt="' + vers + '" src="assets/img/poke/art/' + ev.vers + '.webp">' +
          "</div>" +
          '<p class="pkdx-dit">' + T("evolueDit", { b: vers }) + "</p>" +
          '<div class="pkdx-actions est-pied">' +
            '<button type="button" class="pkdx-touche est-definitive" id="pk-evo">' + T("laisserEvoluer") + "</button>" +
            '<button type="button" class="pkdx-touche" id="pk-stop">' + T("arreterEvolution") + "</button>" +
          "</div>"
        );
        racine.querySelector("#pk-evo").addEventListener("click", function () {
          M().faireEvoluer(mon, ev.vers);
          P().prendre(partie, mon.n, "evolution", mon.niveau);
          // ═══════════════════════════════════════════════════════════════
          //  LA TRANSFORMATION SE JOUE ICI, APRÈS LE CHOIX
          //
          //  🔴 ELLE SE JOUAIT AU RENDU DE L'ÉCRAN, donc PENDANT que le
          //     joueur lisait « LAISSER FAIRE » ou « ARRÊTER ». La
          //     transformation était finie avant qu'il ait décidé, et
          //     accepter ne donnait plus qu'un écran de texte : le sommet du
          //     moment tombait sur la question au lieu de la réponse.
          //     C'est la pierre angulaire du jeu — « il faut que ce soit FUN
          //     ET SATISFAISANT ». Un spectacle qu'on regarde en hésitant
          //     n'est pas une récompense.
          //  🔴 LES BOUTONS DISPARAISSENT PENDANT LE BASCULEMENT. Laisser
          //     « ARRÊTER » cliquable pendant qu'on regarde la créature
          //     changer promettrait un retour en arrière qui n'existe plus :
          //     `faireEvoluer` vient d'être appelée.
          // ═══════════════════════════════════════════════════════════════
          var scene = racine.querySelector(".pkdx-evolution");
          var actions = racine.querySelector(".pkdx-actions");
          if (actions) actions.innerHTML = "";
          if (scene) scene.className = "pkdx-evolution est-joue";
          // ── LES DEUX TEMPS DE L'ÉVOLUTION ────────────────────────────────
          // 🔴 D'ABORD LA TRANSFORMATION, PUIS LA VOIX. `SHRINK` est le son de
          //    la silhouette qui se déforme ; le cri de la NOUVELLE forme
          //    tombe après, et c'est lui qui dit « ce n'est plus le même ».
          //    Les jouer ensemble les écrase l'un l'autre et le moment retombe.
          son("SHRINK");
          W.setTimeout(function () { criDe(ev.vers); }, 900);
          // Le texte arrive quand l'image a fini de le dire : 620 × 3 pour le
          // clignotement, puis l'arrivée de la nouvelle forme à 1,4 s + 900 ms.
          // ⚠️ Le repli existe si l'animation est éteinte : `setTimeout` ne
          //    dépend d'aucun événement d'animation — mesuré une fois sur ce
          //    mode, `animationend` ne remontait pas sur une image.
          W.setTimeout(function () {
            message(T("nEvolution"), T("evolueFait", { nom: nom, b: vers }), suivant);
          }, 2400);
        });
        racine.querySelector("#pk-stop").addEventListener("click", function () {
          son("DENIED");
          message(T("nEvolution"), T("evolueArrete", { nom: nom }), suivant);
        });
        return;
      }
      return suivant();
    }
    suivant();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DEUX CHEMINS — L'ÉVOLUTION QUI DEMANDE UNE DÉCISION   [22/08/2026]
  //
  //  Évoli monte en Mentali le jour et en Noctali la nuit. Ce mode n'a pas
  //  d'horloge, et en inventer une pour un seul Pokémon serait pire que de se
  //  taire : on rend les deux atteignables et le joueur tranche. `apres` rejoue
  //  le MÊME événement, une fois la voie fixée — l'animation, le cri et le
  //  bouton ARRÊTER restent en un seul exemplaire, dans l'écran d'évolution.
  // ═══════════════════════════════════════════════════════════════════════════
  function ecranDeuxChemins(mon, ev, apres) {
    var nom = esc(mon.surnom || ESP()[mon.n].nom[LANG()]);
    coque(
      '<p class="pkdx-surtitre">' + T("nEvolution") + "</p>" +
      '<h1 class="pkdx-titre">' + T("evoDeuxTitre", { nom: nom }) + "</h1>" +
      '<p class="pkdx-dit">' + T("evoDeuxDit") + "</p>" +
      '<div class="pkdx-trocs">' + (ev.voies || []).map(function (v, k) {
        var e2 = ESP()[v.vers];
        return '<button type="button" class="pkdx-troc" data-voie="' + k + '">' +
          '<span class="pkdx-troc-face">' +
            '<img alt="" loading="lazy" src="' + W.PokeSprites.face(v.vers, "?i=6") + '">' +
            "<b>" + esc(e2 ? e2.nom[LANG()] : v.vers) + "</b>" +
          "</span>" +
          '<span class="pkdx-cout">' +
            (v.moment === "jour" ? T("evoVoieJour") : v.moment === "nuit" ? T("evoVoieNuit") : "") +
          "</span>" +
        "</button>";
      }).join("") + "</div>"
    );
    surClic("[data-voie]", function (e3) {
      var v = (ev.voies || [])[+e3.currentTarget.getAttribute("data-voie")];
      if (!v) return;
      ev.vers = v.vers;
      ev.choisi = true;
      apres();
    });
  }

  // Oublier une attaque pour en apprendre une autre. Le refus est une option,
  // et il est annoncé : c'est un choix, pas un accident.
  function ecranOublier(mon, cle, nomAtt, apres) {
    coque(
      '<p class="pkdx-surtitre">' + T("nMontee") + "</p>" +
      '<h1 class="pkdx-titre">' + T("oublierTitre", { attaque: nomAtt }) + "</h1>" +
      '<p class="pkdx-dit">' + T("oublierDit", { nom: esc(mon.surnom || ESP()[mon.n].nom[LANG()]) }) + "</p>" +
      '<ul class="pkdx-liste">' + mon.attaques.map(function (m, k) {
        var a = ATT()[m.cle];
        return '<li class="pkdx-etape">' +
          '<button type="button" class="pkdx-touche" data-oublie="' + k + '">' +
            esc(a ? a.nom[LANG()] : m.cle) + "</button>" +
          '<span class="pkdx-cout">' + m.pp + "/" + m.ppMax + " PP</span></li>";
      }).join("") + "</ul>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche" id="pk-garde">' + T("garderSesAttaques") + "</button>" +
      "</div>"
    );
    surClic("[data-oublie]", function (e) {
      M().apprendre(mon, cle, +e.currentTarget.getAttribute("data-oublie"));
      message(T("nMontee"), T("apprend", { nom: esc(mon.surnom || ESP()[mon.n].nom[LANG()]), attaque: nomAtt }), apres);
    });
    racine.querySelector("#pk-garde").addEventListener("click", function () {
      message(T("nMontee"), T("oublierRefus", { attaque: nomAtt }), apres);
    });
  }

  // ── La fin ─────────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉPILOGUE — LA GROTTE INCONNUE, ET MEWTWO
  //
  //  🔴 MEWTWO N'ÉTAIT DANS AUCUN ACTE. `actes.js` range depuis toujours ce qui
  //     suit la Ligue dans un champ `epilogue` — et AUCUNE ligne ne le lisait.
  //     Le légendaire le plus célèbre du jeu était donc écrit, placé, doté de sa
  //     grotte et de ses trois tables de rencontre, et injoignable.
  //
  //  🔴 ET C'EST UN CHOIX, PAS UNE SUITE AUTOMATIQUE. La Ligue est gagnée, elle
  //     est acquise : entrer dans la grotte ne peut plus rien retirer au
  //     joueur — mais l'essai est unique, et refuser est une réponse. Un
  //     épilogue qu'on subit n'est pas un épilogue.
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 UNE LISTE, PAS UNE SEULE ISSUE. Kanto n'a que la Grotte Inconnue et
  //    rend donc exactement ce qu'il rendait ; Johto en a TROIS — Lugia aux
  //    Tourb'Îles, Ho-Oh à la Tour Carillon, Red au Mont Argenté. Garder le
  //    premier venu en aurait condamné deux, ce qui est la classe de défaut
  //    n°1 du dossier : du contenu écrit et jamais montré.
  function epiloguesDisponibles() {
    if (!partie || !partie.ligueGagnee || partie.epilogueVu) return [];
    var a = W.PokeActes.acteDe(W.PokeActes.nombre());
    var ep = a && a.epilogue;
    if (!ep) return [];
    var out = (ep.legendaires || []).slice();
    //  ⚠️ ET LE DRESSEUR FINAL DOIT AVOIR SON ÉQUIPE. Une étape qui le nomme
    //     sans que le jeu de règles la porte donnerait un écran qui promet un
    //     combat et n'en ouvre aucun.
    var d = W.PokeRegles && W.PokeRegles.dresseurFinal && W.PokeRegles.dresseurFinal();
    if (d && d.equipe && d.equipe.length) {
      for (var i = 0; i < (ep.finals || []).length; i++) {
        out.push({ id: ep.finals[i].id, lieu: ep.finals[i].lieu, dresseurFinal: d });
      }
    }
    return out;
  }
  function epilogueDisponible() {
    var l = epiloguesDisponibles();
    return l.length ? l[0] : null;
  }

  //  Le nom de ce qui attend, et son image. Un légendaire porte son espèce ;
  //  un dresseur porte son visage — deux données, une seule question.
  function ecranEpilogueChoix(liste) {
    coque(
      '<p class="pkdx-surtitre">' + T("epilogueApres") + "</p>" +
      '<h1 class="pkdx-titre">' + T("epilogueChoix") + "</h1>" +
      '<div class="pkdx-actions est-pied">' +
        liste.map(function (e, i) {
          var nom = e.dresseurFinal ? e.dresseurFinal.nom : ESP()[e.legendaire].nom[LANG()];
          return '<button type="button" class="pkdx-touche' + (i ? "" : " est-definitive") +
            '" data-epi="' + i + '">' + esc(nom) + "</button>";
        }).join("") +
        '<button type="button" class="pkdx-touche" id="pk-clore-choix">' + T("grotteClore") + "</button>" +
      "</div>"
    );
    surClic("[data-epi]", function (ev) {
      son("PRESS_AB");
      ecranEpilogue(liste[+ev.currentTarget.getAttribute("data-epi")]);
    });
    racine.querySelector("#pk-clore-choix").addEventListener("click", function () {
      partie.epilogueVu = true;
      son("PRESS_AB");
      fin();
    });
  }

  //  🔴 LE SOMMET — un DRESSEUR, pas une créature. Même écran, même contrat
  //     (un seul essai, et refuser est une réponse), autre adversaire.
  function ecranSommet(etape) {
    var d = etape.dresseurFinal;
    var cleMonde = (partie && W.PokeRegles && W.PokeRegles.de) ? W.PokeRegles.de(partie)
      : (W.PokeRegles && W.PokeRegles.courant ? W.PokeRegles.courant() : "gen1");
    var nomAffiche = (LANG() === "en" && d.nomEn) ? d.nomEn : (d.nomFr || d.nom);
    var tete = cleMonde === "gen3"
      ? '<div class="pkdx-champion-tete">' +
          visage("gen3/dresseur/steven", 88) +
          '<div><h1 class="pkdx-titre">' + esc(nomAffiche) + "</h1></div>" +
        "</div>"
      : '<h1 class="pkdx-titre">' + esc(d.nom) + "</h1>";
    coque(
      '<p class="pkdx-surtitre">' + T("nSommet") + "</p>" +
      tete +
      '<p class="pkdx-dit">' + T("sommetDit") + "</p>" +
      '<p class="pkdx-dit">' + T("sommetQui") + "</p>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-sommet">' + T("sommetMonter") + "</button>" +
        '<button type="button" class="pkdx-touche" id="pk-clore">' + T("grotteClore") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-sommet").addEventListener("click", function () {
      partie.epilogueVu = true;
      son("PRESS_AB");
      var eq = d.equipe.map(function (x) {
        return M().creer(x.n, x.niveau, hasard, x.attaques ? { attaques: attaquesNommees(x.attaques) } : null);
      });
      for (var i = 0; i < eq.length; i++) P().voir(partie, eq[i].n);
      lancerCombat(eq, { dresseur: true, gain: 9000, classe: d.nom, ligue: true });
    });
    racine.querySelector("#pk-clore").addEventListener("click", function () {
      partie.epilogueVu = true;
      son("PRESS_AB");
      fin();
    });
  }

  //  Les attaques nommées par le ROM, en objets que le moteur sait lire. Une
  //  attaque inconnue est IGNORÉE plutôt que posée à zéro PP : mieux vaut trois
  //  coups vrais qu'un quatrième qui ne part jamais.
  function attaquesNommees(cles) {
    var out = [];
    for (var i = 0; i < cles.length && out.length < 4; i++) {
      var a = ATT()[cles[i]];
      if (a) out.push({ cle: cles[i], pp: a.pp, ppMax: a.pp });
    }
    return out.length ? out : null;
  }

  function ecranEpilogue(etape) {
    if (etape.dresseurFinal) return ecranSommet(etape);
    coque(
      '<p class="pkdx-surtitre">' + T("nGrotte") + "</p>" +
      '<h1 class="pkdx-titre">' + esc(ESP()[etape.legendaire].nom[LANG()]) + "</h1>" +
      '<p class="pkdx-dit">' + T("grotteDit") + "</p>" +
      '<p class="pkdx-dit">' + T("grotteQui") + "</p>" +
      // Ce que le clic engage, dit avant le clic — voir `grotteFin`.
      '<p class="pkdx-dit est-note">' + T("grotteFin") + "</p>" +
      // …et ce qu'il RAPPORTE — voir `grotteVaut`. La chasse et le serment se
      // lisent dans leurs tables ; si la chasse est déjà faite, on ne la promet
      // pas deux fois (le reste, lui, est vrai à chaque voyage).
      (function () {
        var ch = W.PokeChasses && W.PokeChasses.de("unLegendaire");
        var faites = (W.PokeProgression && W.PokeProgression.lire().chasses) || {};
        var srm = ch && ch.ouvre && ch.ouvre.serment && W.PokeSerments
          ? W.PokeSerments.de(ch.ouvre.serment) : null;
        if (!ch || !srm || faites[ch.id]) {
          return '<p class="pkdx-dit est-note">' + T("grotteVautDeja") + "</p>";
        }
        return '<p class="pkdx-dit est-note">' +
          esc(T("grotteVaut", { chasse: ch.nom[LANG()], serment: srm.nom[LANG()] })) + "</p>";
      })() +
      '<div class="pkdx-vues">' +
        '<img class="pkdx-vue" alt="' + esc(ESP()[etape.legendaire].nom[LANG()]) + '"' +
          ' src="' + W.PokeSprites.face(etape.legendaire, "?i=6") + '">' +
      "</div>" +
      '<div class="pkdx-actions est-pied">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-grotte">' + T("grotteEntrer") + "</button>" +
        '<button type="button" class="pkdx-touche" id="pk-clore">' + T("grotteClore") + "</button>" +
      "</div>"
    );
    racine.querySelector("#pk-grotte").addEventListener("click", function () {
      partie.epilogueVu = true;
      son("PRESS_AB");
      //  Le mythique du monde arrive au niveau du canon (Celebi N.30), les
      //  legendaires d'etape au leur. Un seul nombre ecrit ici les aurait tous
      //  mis a 70, y compris celui que la cartouche pose a 30.
      var mythE = (W.PokeRegles && W.PokeRegles.mythique && W.PokeRegles.mythique()) || null;
      var nivLeg = mythE && mythE.n === etape.legendaire ? (mythE.niveau || 70) : 70;
      var leg = M().creer(etape.legendaire, nivLeg, hasard,
        { capture: { zone: etape.id, niveau: nivLeg } });
      P().voir(partie, leg.n);
      lancerCombat([leg], { dresseur: false, zone: etape.id, legendaire: etape.legendaire });
    });
    racine.querySelector("#pk-clore").addEventListener("click", function () {
      partie.epilogueVu = true;
      son("PRESS_AB");
      fin();
    });
  }

  function fin() {
    // Le voyage est clos : sa sauvegarde n'a plus de sens et ne doit pas
    // survivre à l'écran de fin — on ne reprend pas une partie terminée.
    // 🔴 ON EFFACE L'EMPLACEMENT DE CE VOYAGE-CI, PAS LES DEUX. Oublier celui
    //    de l'essai laisserait un bouton « REPRENDRE L'ESSAI » sur un défi
    //    déjà rendu — un second essai, ce que la règle interdit. Effacer les
    //    deux détruirait la carrière libre de quelqu'un qui vient seulement de
    //    finir son défi du jour : c'est la plainte de @Z3no_ le 18/08, et elle
    //    valait DÉJÀ avant que l'essai se garde — `fin()` effaçait le voyage
    //    libre à la fin de chaque défi.
    if (defiDate) W.PokeProgression.defiEffacer();
    else W.PokeProgression.voyageEffacer();
    // 🔴 L'ÉPILOGUE PASSE AVANT LA VITRINE, une seule fois. Sans ce détour, la
    //    Ligue gagnée menait droit à l'écran de fin et la grotte n'existait
    //    pour personne.
    // 🔴 UN SEUL ÉPILOGUE S'OUVRE DIRECTEMENT — c'est le cas de Kanto, et son
    //    écran ne bouge pas d'un pixel. PLUSIEURS se CHOISISSENT : Johto en
    //    offre trois, et en imposer un condamnerait les deux autres.
    var eps = epiloguesDisponibles();
    if (eps.length === 1) return ecranEpilogue(eps[0]);
    if (eps.length > 1) return ecranEpilogueChoix(eps);

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LA DERNIÈRE PRISE PASSE AVANT LA CLÔTURE, et il n'y a que là qu'elle
    //    puisse passer : `cloturer` compte, `sceller` fige l'équipe de duel, et
    //    l'écran de fin montre l'équipe. Ouvrir la réserve APRÈS, ce serait
    //    laisser choisir une équipe que plus rien ne lit.
    //  ⚠️ Le drapeau se solde AVANT l'appel, pas après : le bouton de l'écran
    //     rappelle `fin()`, et un drapeau encore levé rouvrirait la réserve à
    //     l'infini.
    // ═══════════════════════════════════════════════════════════════════════
    if (partie.priseTardive) {
      partie.priseTardive = false;
      return ecranBoite(fin, { adieu: true });
    }

    // La collection se CLÔTURE avant l'affichage : l'écran doit montrer le
    // compte à jour, pas celui d'avant la partie.
    // 🔴 `cloturer`, pas `fusionner` : c'est ICI que le voyage se compte, et une
    //    seule fois. `fusionner` tourne à chaque combat pour sauver la
    //    collection d'un onglet fermé — elle ne doit rien compter.
    var avantRang = W.PokeProgression.rang().cle;
    W.PokeProgression.cloturer(partie);
    // 🔴 ET L'ÉQUIPE PART AU DUEL. Sans cette ligne, le mode PvP existerait pour
    //    un joueur qui n'aurait jamais d'équipe à présenter : c'est exactement
    //    la faute n°1 du projet — une mécanique livrée sans sa porte d'entrée.
    // 🔴 `sceller` REND `null` QUAND ELLE NE REMPLACE PAS. L'écran de fin en a
    //    besoin : il dit « cette équipe est scellée » ou « ton équipe de duel
    //    reste celle de ton meilleur voyage », et les deux phrases ne racontent
    //    pas la même chose au joueur.
    var scellee = W.PokeProgression.sceller(partie);
    // 🔴 [17/08] ET LA COLLECTION MONTE AU NUAGE, ICI. C'est le seul instant du
    //    mode où le Pokédex de compte grandit vraiment : un voyage vient de se
    //    clore, ses prises et ses records sont rangés. Pousser plus tôt (à
    //    chaque combat) brûlerait le quota ; pousser plus tard n'existe pas —
    //    le joueur peut fermer l'onglet sur l'écran de fin.
    //  ⚠️ On ne l'attend pas et on n'affiche aucune erreur : l'écran de fin
    //     doit s'ouvrir même hors ligne. Le local est déjà écrit, la remontée
    //     se refera à la prochaine ouverture.
    if (W.PokeClassement && W.PokeClassement.pokedexSynchroniser) {
      W.PokeClassement.pokedexSynchroniser();
    }
    genreLu = null;   // le compte vient de changer : l'accueil doit le relire
    // 🔴 LE DÉFI SE CLÔT AVEC SON SCORE. L'essai a été consommé au départ ; ici
    //    on ne fait qu'inscrire ce qu'il a donné, pour que l'écran du défi le
    //    montre au lieu de proposer une partie qu'on n'a plus le droit de jouer.
    if (partie.compare) {
      W.PokeProgression.clore(W.PokeClassement.jour(), {
        score: P().score(partie),
        badges: (partie.badges || []).length,
        fini: partie.fini || null,
      });
      // 🔴 ET LE VOYAGE PART AU CLASSEMENT. Sans cette ligne, le mode LISAIT un
      //    tableau que rien ne remplissait jamais — une mécanique livrée sans
      //    sa porte d'entrée, la faute n°1 du dossier, sur l'écran qui donne la
      //    raison de revenir demain.
      // ⚠️ ON ENVOIE LE BILAN, PAS LE SCORE. Le serveur recalcule le barème et
      //    borne le résumé (`js/poke/rejeu.js`) : annoncer un score ne suffit
      //    plus. C'est la même source que l'écran de fin et la carte de partage.
      // ⚠️ Aucune attente, aucun message d'erreur : une panne de classement ne
      //    doit pas s'afficher par-dessus l'écran de fin d'un voyage réussi.
      try { W.PokeClassement.soumettre(W.PokeClassement.jour(), P().bilan(partie), partie.nom); }
      catch (e) { /* le voyage compte, le classement est un bonus */ }
    }
    // 🔴 LE RANG SE COMPARE AVANT ET APRÈS. Il se DÉDUIT du compte : personne ne
    //    l'écrit, donc personne ne peut dire qu'il a bougé — sauf en le lisant
    //    des deux côtés de la clôture. Sans ça, le palier le plus rare du mode
    //    se franchissait sans un mot.
    var monte = avantRang !== W.PokeProgression.rang().cle ? rangDit().nom : null;
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 CE QUE LE VOYAGE A OUVERT SE DIT AVANT L'ÉCRAN DE FIN, PAS APRÈS.
    //    C'est la raison d'être des chasses : un voyage qui s'arrête au
    //    troisième acte doit laisser quelque chose, et ce quelque chose doit
    //    se voir AVANT le bilan, sinon il se lit comme une consolation.
    //    L'annonce nomme le serment ouvert : « une chasse de plus ne veut rien
    //    dire, un Serment de la fureur si.
    // ═══════════════════════════════════════════════════════════════════════
    var finir = function () {
      W.PokeFin.afficher(hote("pk-fin"), partie,
        function () { accueil(); },
        function () { son("PRESS_AB"); ecranDuel(); },
        !!scellee, monte);
      if (monte) son("POKEDEX_RATING");
    };
    var neuves = (W.PokeProgression.lire().chassesNeuves || []).slice();
    if (neuves.length && W.PokeChasses) {
      son("GET_KEY_ITEM");
      var lignes = neuves.map(function (id) {
        var ch = W.PokeChasses.de(id);
        if (!ch) return "";
        var ouvre = ch.ouvre && ch.ouvre.serment && W.PokeSerments
          ? W.PokeSerments.de(ch.ouvre.serment) : null;
        return "<strong>" + esc(ch.nom[LANG()]) + "</strong>" +
          (ouvre ? " — " + T("chasseOuvre", { quoi: esc(ouvre.nom[LANG()]) }) : "");
      }).filter(Boolean);
      message(T("chasseTitre"), lignes.join("<br>"), finir);
    } else {
      finir();
    }
  }

  // ── Le démarrage ───────────────────────────────────────────────────────────
  //  🔴 Appelé PAR LE VERROU, jamais par `DOMContentLoaded` : quand les scripts
  //     sont injectés, l'événement est déjà passé. Piège payé sur le mode
  //     Dragon Ball, l'accueil restait figé sur ses squelettes.
  function demarrer() {
    racine = D.getElementById("poke-racine");
    if (!racine) return;
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [19/08] TOUT L'ANGLAIS DU MODE ÉTAIT INJOIGNABLE. La langue se lisait
    //     ICI, une fois, dans `<html lang>` — et `pokemon.html` est écrit
    //     `lang="fr"` en dur. Aucun bouton, aucun paramètre, aucune mémoire :
    //     un anglophone ne pouvait PAS passer le jeu en anglais, alors que
    //     chaque phrase du mode est écrite dans les deux langues depuis le
    //     premier jour. C'est la classe de défaut n°1 du dossier — du contenu
    //     écrit et jamais montré — sur plusieurs milliers de phrases.
    //  🔑 LA CLÉ EST CELLE DES AUTRES MODES (`palmares_lang`) : un joueur qui a
    //     choisi l'anglais chez le ninja le retrouve ici. Une préférence de
    //     langue appartient à la personne, pas à l'univers.
    //  ⚠️ Et à défaut de choix, on suit le NAVIGATEUR, comme `game.js` : servir
    //     du français à qui n'en a jamais demandé est le défaut d'origine.
    // ═══════════════════════════════════════════════════════════════════════
    W.POKE_LANG = langueChoisie();
    accueil();
  }

  W.PokeDemarrer = demarrer;
  // `ditObjet` est la porte unique vers « ce que fait cet objet ». Elle sert la
  // carte de butin, l'étal de la boutique et l'infobulle du sac : trois écrans,
  // une phrase. La rendre publique était la condition pour que le sac cesse de
  // se taire sans qu'une deuxième description apparaisse quelque part.
  W.PokeUI = {
    T: T,
    carte: function () { return carte(); },
    accueil: function () { return accueil(); },
    ecranCoffre: function () { return ecranCoffre(); },
    ditObjet: function (cle) { return ditButin({ type: "objet", objet: cle }); },
    // ═════════════════════════════════════════════════════════════════════════
    //  🔴 LA PORTE DE MESURE — ET POURQUOI ELLE EXISTE.
    //     Deux écrans du mode ne sont atteignables qu'à UNE étape précise d'un
    //     voyage : le Casino n'est qu'à Céladopole (acte 4), le Parc Safari
    //     qu'à la Zone Safari. Un balayage qui doit rejouer quatre actes pour
    //     les voir ne les mesure jamais — et de fait, ils ont été les deux
    //     derniers écrans non mesurés du dossier, longtemps après tous les
    //     autres. *Un écran qu'aucun instrument n'atteint n'est pas contrôlé.*
    //
    //  ⚠️ ELLE MESURE, ELLE NE JOUE PAS. Elle ne passe PAS par `prendreNoeud` :
    //     aucun nœud n'est consommé, aucun pas n'est compté, le journal n'est
    //     pas écrit. Le voyage en cours n'avance pas d'un cran — on se contente
    //     de peindre l'écran par-dessus, et `carte()` ramène où l'on était.
    //  ⚠️ Elle ne crée aucun contenu qui n'existe pas : le nœud Safari est
    //     celui que `carte-actes` produirait pour l'étape `zone-safari`, tables
    //     comprises. Une porte de mesure qui invente son décor mesure un écran
    //     que personne ne verra.
    // ═════════════════════════════════════════════════════════════════════════
    mesurerCasino: function () { photographierPourMesure(); return ecranCasino(); },
    // 🔴 LE CONCOURS EST SORTI SANS UN SEUL BOUTON, EN PRODUCTION. Signalé par
    //    Syrean le 21/08 : « obligé de revenir sur l'accueil ». Il n'avait pas
    //    de porte de mesure, donc je ne l'ai jamais PEINT avant de le livrer —
    //    j'ai vérifié ses données et ses branchements, et pas une fois son
    //    écran. Cette porte existe pour que cette faute ne puisse pas se
    //    reproduire en silence : elle convoque l'écran, et le contrôle compte
    //    ses touches.
    mesurerConcours: function () {
      photographierPourMesure();
      return ecranConcours({ type: "concours", etape: "parc-national", lieu: "national-park" });
    },
    // Le Centre a une TROISIÈME porte conditionnelle depuis le PC de Léo
    // (collection non vide, équipe de 3, une fois par voyage, hors Défi). Tomber
    // sur le bon état en jouant est une loterie — et une porte qu'on ne peut pas
    // convoquer est une porte qu'on ne relit jamais.
    mesurerCentre: function () { photographierPourMesure(); return ecranCentre(); },
    // Les deux chemins d'Évoli ne s'ouvrent qu'au bout de 1500 points de
    // bonheur : les relire en jouant, c'est une trentaine de combats. La
    // porte PEINT l'écran, elle ne rend pas du HTML — c'est la leçon du
    // Concours (21/08), dont la mesure était verte sur un écran sans boutons.
    mesurerDeuxChemins: function () {
      photographierPourMesure();
      var mon = { n: 133, surnom: null, niveau: 25, attaques: [] };
      return ecranDeuxChemins(mon, {
        type: "evolution", vers: 196,
        voies: [{ vers: 196, moment: "jour" }, { vers: 197, moment: "nuit" }],
      }, function () {});
    },
    // Le serment ne s'ouvre qu'APRÈS un badge gagné : le relire demandait de
    // battre un Champion. C'est l'écran qui porte le coût de tout un acte.
    mesurerSerment: function () { photographierPourMesure(); return ecranSerment(function () { return carte(); }); },
    // Le butin tombe après CHAQUE victoire — donc jamais quand on l'observe.
    mesurerButin: function () { photographierPourMesure(); return ecranButin(function () { return carte(); }, null); },
    // Le sac ne montre les clés qu'une fois REÇUES — et les quatre « sans
    // verrou » (vol, velo, carte, dentOr) arrivent au fil des actes 4 à 6 :
    // les relire en jouant est une loterie. On pose les quatre, plus une qui
    // ouvre (scope), pour relire LES DEUX formes de la ligne côte à côte.
    // ⚠️ La photo emporte `cles` par valeur : l'état se repose au retour.
    mesurerSac: function () {
      photographierPourMesure();
      ["vol", "velo", "carte", "dentOr", "scope"].forEach(function (c) { partie.cles[c] = true; });
      return ecranSac(function () { return carte(); });
    },
    // La carte d'acquis est un tirage LEGENDAIRE de poids 5 : ~2,75 par voyage
    // sur neuf actes. Tomber dessus pour relire l'écran est une loterie.
    // ⚠️ `serments` sert à convoquer l'état « acquis CONTRE serment » — la
    //    ligne de composition ne paraît que là, et l'atteindre en jouant
    //    demanderait de gagner un badge puis de tirer la bonne carte.
    mesurerAcquis: function (rang, serments) {
      photographierPourMesure();
      if (serments && serments.length) {
        partie.serments = (partie.serments || []).concat(serments);
      }
      return ecranAcquis({ type: "acquis", rang: rang || 0 }, function () { return carte(); });
    },
    // ═════════════════════════════════════════════════════════════════════
    //  La carte de capsule est un tirage RARE de poids 18 : elle sort deux
    //  fois par voyage, après une victoire quelconque, et l'écran de choix ne
    //  paraît qu'ensuite. L'atteindre pour le relire demande de jouer un acte.
    //  ⚠️ ET LE CONTENU DE L'ÉCRAN DÉPEND DE TROIS CHOSES, pas d'une. Les
    //     machines offertes sont celles que QUELQU'UN peut apprendre — donc de
    //     l'ÉQUIPE ; la ligne qui départage nomme le Champion — donc l'ACTE ;
    //     et le triplet vient du RANG. Sur une partie neuve, un seul Pokémon
    //     n'accepte que trois capsules de soutien, et l'écran ne montre jamais
    //     l'état qu'il existe pour montrer : « touche 3 de Ondine sur 3 ».
    //     Même raison que `mesurerEchange`, qui pousse une espèce dans
    //     l'équipe pour convoquer l'aller-retour.
    // ═════════════════════════════════════════════════════════════════════
    //  ⚠️ `niveaux` EST ARRIVÉ POUR UN AUTRE ÉCRAN, ET C'EST ASSUMÉ. Le rail
    //     « n de tes t tiennent le niveau » ne paraît que dans une bande
    //     précise — moins de la moitié de l'équipe au niveau du Champion — et
    //     aucune porte du mode ne savait convoquer une équipe PANACHÉE. Sans
    //     niveaux réglables, la bande qui vient d'être ouverte se serait
    //     livrée sans avoir jamais été vue à l'écran.
    //  🔴 ELLE ABÎMAIT CE QU'ELLE MESURAIT, et un QA l'a retrouvé dans une
    //     sauvegarde : « Acte 5 sur 9 · 6 badges », état impossible en jeu.
    //     Elle écrivait `partie.acte` et poussait des Pokémon SANS RESTAURER,
    //     pendant que le commentaire commun à toutes ces portes affirme
    //     « elle mesure, elle ne joue pas ». Le voyage en cours ressortait avec
    //     l'acte d'une autre carte et une équipe qu'on ne lui avait pas donnée.
    //     *Un instrument qui abîme ce qu'il mesure coûte plus cher qu'aucun.*
    //  ✅ On photographie l'état et on le repose au retour, quel que soit le
    //     chemin de sortie — c'est `carte()` qui rend la main, donc c'est là.
    // ═════════════════════════════════════════════════════════════════════
    //  🔴 L'ÉCRAN DE LA LIGUE N'AVAIT AUCUNE PORTE, et un QA l'a nommé comme
    //     le manque le plus coûteux : il demande HUIT BADGES, c'est-à-dire un
    //     voyage complet, et il en existe CINQ VARIANTES — Olga, Aldo, Agatha,
    //     Peter, puis le rival. Quatre d'entre elles n'avaient donc jamais été
    //     relues, et c'est là que dormait le soin qui contredisait la règle
    //     annoncée cinq lignes plus haut.
    //  ⚠️ Elle passe par la photo : `ligueEtape` est de l'état de voyage, et
    //     une porte de mesure qui le laisserait modifié rejouerait la faute
    //     qu'on vient de corriger sur `mesurerCapsule`.
    // ═════════════════════════════════════════════════════════════════════
    // ═════════════════════════════════════════════════════════════════════
    //  🔴 L'ÉCRAN DE FIN EN DÉFAITE N'AVAIT JAMAIS ÉTÉ VU, ET C'EST CELUI DONT
    //     DÉPEND TOUTE LA RELANCE. Le QA du 11/08 l'a dit franchement : il n'a
    //     pu observer que `finVitrine` — la victoire. Les trois autres causes
    //     (`equipe`, `epuise`, `abandon`) ne s'atteignent qu'au terme d'un vrai
    //     échec, c'est-à-dire jamais en QA. Or c'est APRÈS une défaite qu'un
    //     joueur décide de relancer ou de fermer l'onglet.
    //  ⚠️ Elle pose la cause ET clôt la partie, comme le jeu : `fin()` efface
    //     la sauvegarde et fusionne la progression. On ne mesure pas un écran
    //     de fin sur une partie qui continue — ce serait un autre écran.
    // ═════════════════════════════════════════════════════════════════════
    // 🔴 CELLE-CI NE PHOTOGRAPHIAIT RIEN, et `fin()` efface la sauvegarde,
    //    compte le voyage à vie et scelle l'équipe de duel. Regarder l'écran de
    //    fin détruisait donc la partie — constaté en perdant la mienne au banc.
    mesurerFin: function (cause) {
      photographierPourMesure();
      partie.fini = cause || "equipe";
      return fin();
    },
    // ═════════════════════════════════════════════════════════════════════
    //  🔴 L'EN-TÊTE D'UN AUTRE ACTE N'ÉTAIT PAS OBSERVABLE, et c'est la
    //     restauration ajoutée en v466 qui l'avait fermé : elle remet l'acte
    //     avant que `carte()` ne dessine. La v494 a donc livré l'annonce de
    //     chasse sans jamais l'avoir vue aux actes 7, 8 et 9 — seulement le
    //     silence aux actes qui n'en portent pas.
    //     *Un correctif d'instrument peut fermer une porte d'observation ; il
    //     faut le voir au moment où l'on veut regarder, pas après.*
    // ═════════════════════════════════════════════════════════════════════
    mesurerActe: function (n) {
      photographierPourMesure();
      photoMesure.garder = true;
      partie.acte = n || 1;
      partie.carteActe = null;    // la carte se régénère pour l'acte demandé
      partie.rangee = 0;
      return carte();
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  LES DEUX DERNIÈRES PORTES RÉCLAMÉES PAR LE QA À TROIS AGENTS
    //
    //  🔴 L'ÉCRAN D'ARÈNE et L'ÉCRAN DE CHASSE étaient les deux seuls écrans
    //     majeurs sans porte de mesure. Les atteindre demandait de JOUER un
    //     acte entier — et pour la chasse, de tomber sur le nœud, qui n'existe
    //     qu'à trois actes sur neuf. C'est ce qui les a laissés hors des
    //     relectures pendant que tous les autres y passaient.
    //  ⚠️ ELLES MESURENT, ELLES NE JOUENT PAS : la photo/repos les encadre,
    //     donc aucun nœud n'est consommé et le voyage ne bouge pas d'un cran.
    //     Sans elle, ouvrir la chasse pour la relire GRILLERAIT l'essai unique.
    // ═══════════════════════════════════════════════════════════════════════
    mesurerArene: function (ordre) {
      photographierPourMesure();
      return ecranArene(ordre || 1);
    },
    //  ⚠️ L'espèce est un ARGUMENT parce que les trois oiseaux ne se valent pas :
    //     Artikodin sort à 16 % de prises, Sulfura et Électhor à zéro. Une porte
    //     qui n'ouvrirait que sur le premier laisserait les deux autres dans
    //     l'angle mort — l'erreur que cette porte est censée réparer.
    //  🔴 ET ELLE PASSE PAR LE VRAI CHEMIN. Premier jet : fabriquer un nœud et
    //     le donner à `choisirNoeud`. Or celui-ci commence par `prendreNoeud`,
    //     qui cherche le nœud DANS LA RANGÉE COURANTE — un nœud inventé n'y est
    //     pas, la fonction rendait `carte()`, et la porte retombait sur la
    //     carte SANS UN MOT. Une porte de mesure qui échoue en silence est pire
    //     qu'une porte absente : on croit avoir relu l'écran.
    //  ✅ On POSE donc le nœud dans la rangée courante, et on le joue comme le
    //     joueur le jouerait. La photo remet la carte d'aplomb ensuite : c'est
    //     exactement ce pour quoi elle existe.
    mesurerChasse: function (espece) {
      photographierPourMesure();
      if (!partie.carteActe) carte();
      var rangee = partie.carteActe && partie.carteActe.rangees[partie.rangee];
      if (!rangee) return carte();
      var id = "mesure-chasse";
      rangee.push({ type: "legendaire", espece: espece || 144, id: id,
        etape: "iles-ecume", lieu: "seafoam-islands" });
      return choisirNoeud(id);
    },
    mesurerLigue: function (etape) {
      photographierPourMesure();
      partie.ligueEtape = etape || 0;
      return ecranLigue();
    },
    mesurerCapsule: function (rang, acte, especes, niveaux) {
      photographierPourMesure();
      if (acte) partie.acte = acte;
      if (especes && W.PokeMoteur) {
        for (var i = 0; i < especes.length; i++) {
          partie.equipe.push(W.PokeMoteur.creer(especes[i],
            (niveaux && niveaux[i]) || 20, hasard));
        }
      }
      return ecranCapsule({ type: "ct", rang: rang || 0 }, function () { return carte(); });
    },
    // L'écran de compagnon ne s'ouvre qu'AU DÉPART d'une carrière libre : une
    // partie en cours ne le reverra jamais, et c'est l'écran dont le conseil
    // vient d'être corrigé. Sans porte, il se relit en recommençant un voyage.
    mesurerCompagnon: function () { photographierPourMesure(); return choixCompagnon(); },
    // Le comptoir des machines ne s'ouvre qu'à partir d'un acte donné ET sur une
    // étape qui déclare un étal : voir la note de capsule (« touche 3 de Morgane
    // sur 4 ») demandait d'aligner deux conditions et de la chance.
    //  ⚠️ `rare` EST UN ARGUMENT DEPUIS QU'ON A VU LE TROU : la porte forçait
    //     `rare: []`, donc le rayon des vitamines et des pierres — le seul
    //     endroit où l'on dépense vraiment — restait intestable. Le QA l'avait
    //     relevé. Le défaut par défaut reste vide : une boutique ordinaire n'a
    //     pas de rayon rare, et une porte de mesure ne doit pas inventer un
    //     monde plus riche que celui qu'on joue.
    mesurerBoutique: function (etape, rare) {
      photographierPourMesure();
      var e = W.pokeEtapeDe(etape || "celadopole") || {};
      return ecranBoutique(Object.assign({}, e, { rare: rare || [] }));
    },
    // L'échange PNJ n'existe qu'à sept étapes du canon (route-2, azuria, carmin,
    // route-5, route-11, route-18, Cramois'Île) : même loterie que le Casino.
    // ⚠️ `espece` sert à convoquer l'état « aller-retour » : la section ne
    //    paraît qu'avec un Pokémon qui n'évolue QUE par échange (Kadabra 64,
    //    Machopeur 67, Gravalanch 75, Spectrum 93), et en croiser un demande
    //    de la chance et vingt minutes.
    mesurerEchange: function (etape, espece) {
      photographierPourMesure();
      var id = etape || "route-2";
      if (espece && W.PokeMoteur) {
        partie.equipe.push(W.PokeMoteur.creer(espece, 25, hasard));
      }
      var e = W.pokeEtapeDe(id) || {};
      return ecranEchange({ type: "echange", etape: id, lieu: e.lieu || "route-2",
        offres: (W.POKE_ECHANGES || []).filter(function (x) { return x.etape === id; }) });
    },
    mesurerSafari: function () {
      photographierPourMesure();
      var e = W.pokeEtapeDe("zone-safari") || {};
      return ecranSafari({ type: "safari", etape: "zone-safari",
        lieu: e.lieu || "kanto-safari-zone", tables: e.tables || [] });
    },
    // ═════════════════════════════════════════════════════════════════════════
    //  🔴 L'ACCUEIL N'AVAIT PAS DE PORTE — L'ÉCRAN LE PLUS VU DU MODE.
    //     Seize portes couvraient le Casino, le Safari, la chasse, la capsule…
    //     et pas l'écran que chaque joueur voit à chaque ouverture. Le fichier
    //     défend pourtant la règle deux cents lignes plus haut : *un écran
    //     qu'aucun instrument n'atteint n'est pas contrôlé.*
    //     Et ça s'est vérifié le jour même : le balayage de polissage a rendu
    //     ZÉRO défaut sur dix-huit écrans aux deux largeurs, pendant que
    //     l'accueil — le seul hors relevé — en portait un, trouvé à l'œil.
    //  🔴 ET J'AVAIS ÉCRIT ICI QU'ELLE N'AVAIT RIEN À REPOSER. C'était faux, et
    //     deux instruments me l'ont dit dans l'heure : `accueil()` commence par
    //     `partie = null`. Mon propre balayage, qui l'appelait en premier, a
    //     rendu un écran propre et DIX-HUIT « Cannot read properties of null » ;
    //     puis `poke-portes-mesure` a refusé la porte pour la même raison.
    //     *Une porte de mesure sert à REGARDER : ce qu'elle change, elle le
    //     repose.* Elle photographie donc comme les seize autres, et remet en
    //     main la partie que l'écran d'accueil vient de lâcher.
    // ═════════════════════════════════════════════════════════════════════════
    // ═════════════════════════════════════════════════════════════════════════
    //  LES QUINZE ÉCRANS QUI N'ÉTAIENT SOUS AUCUN INSTRUMENT — 15/08
    //
    //  🔴 TRENTE-HUIT ÉCRANS, DIX-HUIT PORTES. Les deux trous trouvés l'un après
    //     l'autre ce jour-là (l'accueil, puis l'équipe) n'étaient pas deux
    //     accidents : c'était un MOTIF. On avait outillé ce qui se joue — les
    //     nœuds de la carte — et laissé dehors tout ce qui s'OUVRE ou tout ce
    //     qui SURVIENT. Or ce qui survient est ce qu'on voit le plus : les
    //     montées de niveau tombent après chaque combat, la capture après chaque
    //     Ball, l'oubli d'attaque à chaque palier, la défaite à chaque perte.
    //  🔑 *Un balayage qui rend zéro sur vingt écrans ne dit rien des quinze
    //     autres — et il en a l'air.* C'est la forme la plus coûteuse d'un
    //     instrument qui ment : celle où il a raison, mais pas sur tout.
    //  ⚠️ CHACUNE PHOTOGRAPHIE, comme les autres, et chacune se sert de DONNÉES
    //     RÉELLES — un Pokémon fabriqué par le moteur, un nœud tel que
    //     `carte-actes` le produirait. Une porte qui invente son décor mesure un
    //     écran que personne ne verra.
    // ═════════════════════════════════════════════════════════════════════════
    //  ── Ce qui s'ouvre depuis l'accueil ──────────────────────────────────────
    mesurerCarnet: function () { photographierPourMesure(); return ecranCarnet(); },
    //  🔴 CES DEUX-LÀ LÂCHENT LA PARTIE, ET JE L'AI REFAIT. `ecranDefi` et
    //     `ecranDuel` commencent par `partie = null`, exactement comme
    //     `accueil` — dont j'avais corrigé le cas une heure plus tôt. Écrites
    //     sans la remise, elles faisaient tomber les portes suivantes du
    //     balayage sur « Cannot read properties of null ».
    //  ⚠️ ET `poke-portes-mesure` LES A LAISSÉES PASSER : il vérifie qu'une
    //     porte PHOTOGRAPHIE, pas qu'elle REPOSE — alors que sa propre phrase de
    //     conclusion promet la seconde. Le contrôle a été resserré dans la
    //     foulée : voir la garde des trois écrans qui lâchent la partie.
    mesurerDefi: function () {
      photographierPourMesure();
      var enCours = partie;
      var vue = ecranDefi();
      prendreLaPartie(enCours);
      return vue;
    },
    mesurerDuel: function () {
      photographierPourMesure();
      var enCours = partie;
      var vue = ecranDuel();
      prendreLaPartie(enCours);
      return vue;
    },
    mesurerStarter: function () { photographierPourMesure(); return choixStarter(); },
    //  🔴 LES DEUX PLUS GRANDS ÉCRANS DU MODE, ET LES DEUX DERNIERS SANS PORTE.
    //     La collection dessine cent cinquante et une cases avec filtres,
    //     recherche et fiche ; le classement affiche un tableau distant. Tous
    //     deux s'ouvrent d'un bouton de l'accueil — donc jamais par un nœud,
    //     donc jamais sous l'instrument. C'est la même famille que l'accueil et
    //     l'équipe, et c'est la troisième fois qu'on la repaie.
    //  ⚠️ Ils vivent dans `pokedex-ui.js` et `classement.js`, pas dans ce
    //     fichier : une porte doit franchir le module, sinon deux modules sur
    //     dix-sept restent hors relevé pour la seule raison qu'ils sont ailleurs.
    // ═════════════════════════════════════════════════════════════════════════
    //  LES QUATRE DERNIERS — ET ILS EXIGENT UN MONDE, PAS SEULEMENT UN APPEL
    //
    //  🔴 CEUX-CI NE S'OUVRENT QUE SOUS CONDITION : le PC veut une équipe d'au
    //     moins trois ET une espèce déjà prise qui n'y soit pas ; l'épilogue
    //     veut la Ligue gagnée. Une porte qui rate la condition retombe sur
    //     `carte()` SANS UN MOT — et on croit alors avoir relu l'écran. Le
    //     fichier dénonce ce piège depuis `mesurerChasse` : *une porte de mesure
    //     qui échoue en silence est pire qu'une porte absente.*
    //  ✅ CHACUNE POSE DONC SA CONDITION, PUIS VÉRIFIE QU'ELLE A OUVERT le bon
    //     écran, et jette une erreur nommée sinon. Le balayage la remonte au
    //     lieu de compter un écran propre qu'il n'a jamais vu.
    // ═════════════════════════════════════════════════════════════════════════
    mesurerBoitePc: function (arrivant) {
      photographierPourMesure();
      // Une équipe pleine, faite par le moteur — c'est l'état où le choix se pose.
      while (partie.equipe.length < 4) partie.equipe.push(M().creer(16 + partie.equipe.length, 12, hasard));
      // Et une espèce AU COMPTE qui ne soit pas dans l'équipe : sans elle, le
      // vivier est vide et l'écran n'a rien à proposer.
      //  ⚠️ ON ÉCRIT DANS LE COMPTE, il n'y a pas d'autre porte : la collection
      //     se remplit par `fusionner`/`cloturer` à la fin d'un voyage, jamais
      //     à la demande. L'instantané de `photographierPourMesure` couvre
      //     l'état écrit — c'est exactement ce pour quoi il existe.
      var dedans = {}, i;
      for (i = 0; i < partie.equipe.length; i++) dedans[partie.equipe[i].n] = true;
      var compte = W.PokeProgression.lire();
      for (i = 1; i <= 151; i++) {
        if (dedans[i] || compte.pris[i]) continue;
        compte.pris[i] = { zone: "mesure", niveau: 10 };
        W.PokeProgression.ecrire(compte);
        break;
      }
      var vue = arrivant ? choixBoiteArrivant(1) : choixBoite();
      //  ⚠️ `data-part` pour « qui part », `data-boite` pour « qui arrive » —
      //     relevé DANS le balisage, pas deviné : mon premier jet cherchait
      //     `data-arrivant`, qui n'existe nulle part, et l'assertion a sorti
      //     l'écran comme non ouvert. Elle a fait son travail sur moi d'abord.
      if (!racine.querySelector("[data-part], [data-boite]"))
        throw new Error("mesurerBoitePc : l'écran du PC ne s'est pas ouvert — condition non remplie, pas un écran propre.");
      return vue;
    },
    mesurerEpilogue: function () {
      photographierPourMesure();
      partie.ligueGagnee = true;
      partie.epilogueVu = false;
      var ep = epilogueDisponible();
      if (!ep) throw new Error("mesurerEpilogue : aucun légendaire d'épilogue déclaré au dernier acte.");
      return ecranEpilogue(ep);
    },
    //  ⚠️ Le nœud est celui que `carte-actes` produit pour une étape qui déclare
    //     un cadeau ; on cherche donc la PREMIÈRE qui en a un plutôt que d'en
    //     inventer une, sinon la porte mesure un décor qui n'existe pas.
    mesurerCadeau: function (etape) {
      photographierPourMesure();
      var id = etape;
      if (!id) {
        var etapes = ETAPES() || [];
        for (var i = 0; i < etapes.length; i++)
          if (O().cadeauxDe(partie, etapes[i].id).length ||
              O().cadeauxDe(partie, etapes[i].lieu || etapes[i].id).length) { id = etapes[i].id; break; }
      }
      if (!id) throw new Error("mesurerCadeau : aucune étape du monde ne déclare de cadeau.");
      var e = W.pokeEtapeDe(id) || {};
      return ecranCadeau({ type: "cadeau", etape: id, lieu: e.lieu || id });
    },
    //  ⚠️ MÊME RÈGLE QUE LE CADEAU : on prend l'œuf que le MONDE déclare, on
    //     n'en fabrique pas un. Une porte qui invente son décor mesure un écran
    //     qui n'existe pas — et Kanto n'a aucun œuf, donc elle doit le dire.
    mesurerOeuf: function (cle) {
      photographierPourMesure();
      var l = (W.PokeRegles && W.PokeRegles.oeufs && W.PokeRegles.oeufs()) || [];
      // ⚠️ LE BANC APPELLE CHAQUE PORTE AVEC `1`. `poke-banc-telephone` joue les
      //    quarante portes à l'aveugle, `PokeUI[nom](1)` — un argument qui n'est
      //    pas une clé d'œuf. Comparé tel quel, il ne trouvait rien et la porte
      //    annonçait « ce monde ne déclare aucun œuf » sur un monde qui en
      //    déclare deux : un refus qui ne dit pas la vraie cause.
      var vise = typeof cle === "string" ? cle : null;
      var o = null;
      for (var i = 0; i < l.length; i++) if (!vise || l[i].cle === vise) { o = l[i]; break; }
      if (!o) throw new Error("mesurerOeuf : ce monde ne déclare aucun œuf.");
      var e = W.pokeEtapeDe(o.etape) || {};
      return ecranOeuf({ type: "oeuf", etape: o.etape, lieu: e.lieu || o.etape,
                         oeuf: o.cle, niveau: o.niveau, table: o.table });
    },
    mesurerCollection: function () {
      photographierPourMesure();
      return W.PokePokedex.ouvrir(hote("pk-dex-hote"), partie, function () { return carte(); });
    },
    mesurerClassement: function () {
      photographierPourMesure();
      var enCours = partie;                       // `accueil` en fermeture : même garde que les autres
      var vue = W.PokeClassement.ouvrir(hote("pk-cl"), accueil, {});
      prendreLaPartie(enCours);
      return vue;
    },
    //  ── Ce qui survient après un combat ──────────────────────────────────────
    //  ⚠️ Le Pokémon vient de `PokeMoteur.creer` : mêmes statistiques, mêmes
    //     attaques et même potentiel qu'en jeu. Un objet écrit à la main aurait
    //     mesuré une fiche qui n'existe pas.
    mesurerMontees: function () {
      photographierPourMesure();
      var mon = M().creer(25, 16, hasard);
      return ecranMontees([{ mon: mon, ev: { type: "niveau", niveau: 17, depuis: 14, apres: mon.stats } }],
        function () { return carte(); });
    },
    mesurerPrise: function (espece, niveau) {
      photographierPourMesure();
      var mon = M().creer(espece || 25, niveau || 12, hasard,
        { capture: { zone: partie.etape, niveau: niveau || 12 } });
      return ecranPrise(mon, function () { return carte(); });
    },
    //  ⚠️ QUATRE ATTAQUES PLEINES, sinon l'écran ne s'ouvre pas : on ne choisit
    //     ce qu'on oublie que quand il n'y a plus de place. Le niveau 40 les
    //     donne sans qu'on ait à en poser une seule à la main.
    mesurerOublier: function () {
      photographierPourMesure();
      var mon = M().creer(25, 40, hasard);
      var app = (ATTL() && ATTL().TACKLE) ? "TACKLE" : Object.keys(ATTL() || {})[0];
      return ecranOublier(mon, app,
        (ATTL()[app] && ATTL()[app].nom[LANG()]) || app,
        function () { return carte(); });
    },
    //  ⚠️ `epuise: false` — l'autre branche part droit sur l'écran de FIN, qui a
    //     déjà sa porte. Ici on veut la défaite qui laisse un essai.
    // ⚠️ LA PORTE DOIT RENDRE L'ÉCRAN QUE LE JOUEUR VOIT. Elle n'envoyait que
    //    `{ epuise: false }` : ni l'argent perdu, ni les essais restants. Le
    //    balayage mesurait donc « Tu perds undefined ₽ » et « Il te reste ,
    //    {n|essai|essais} » — et les déclarait propres. Les deux valeurs
    //    viennent des mêmes fonctions que le jeu, jamais d'un chiffre écrit ici.
    mesurerDefaite: function () {
      photographierPourMesure();
      return ecranDefaite({
        epuise: false,
        arene: false,
        perdu: Math.floor((partie && partie.argent ? partie.argent : 1000) / 2),
        reste: P().essaisRestants ? P().essaisRestants(partie) : 1,
      }, function () { return carte(); });
    },
    mesurerJuge: function () {
      photographierPourMesure();
      return ecranJuge(function () { return carte(); });
    },
    //  ── Les nœuds de la carte qui n'avaient pas de porte ─────────────────────
    //  ⚠️ Six écrans sans argument : ils lisent la partie, pas un nœud. Ils
    //     n'étaient pas atteignables autrement qu'en tombant dessus.
    mesurerJournal: function () { photographierPourMesure(); return ecranJournal(); },
    mesurerMusee: function () { photographierPourMesure(); return ecranMusee(); },
    mesurerPension: function () { photographierPourMesure(); return ecranPension(); },
    mesurerDojo: function () { photographierPourMesure(); return ecranDojo(); },
    mesurerFossile: function () { photographierPourMesure(); return ecranFossile(); },
    mesurerRanimation: function () { photographierPourMesure(); return ecranRanimation(); },
    //  ⚠️ Le nœud du rival est celui que `carte-actes` pose aux actes 1 à 7 —
    //     `rencontre` compte à partir de zéro, d'où `acte - 1`.
    mesurerRival: function (rencontre) {
      photographierPourMesure();
      return ecranRival({ type: "rival", etape: partie.etape, lieu: partie.etape,
        rencontre: rencontre == null ? 0 : rencontre });
    },
    // ⚠️ ET L'ÉQUIPE NON PLUS N'EN AVAIT PAS. Deuxième trou du même genre,
    //    trouvé en cherchant à VÉRIFIER un correctif avant de le supprimer :
    //    `ecranBoite` porte l'équipe, le PC, l'ordre d'entrée et le
    //    glisser-déposer — c'est l'écran qu'on rouvre le plus après la carte, et
    //    aucun balayage ne l'atteignait. Les deux écrans qui manquaient sont
    //    précisément les deux qu'on n'atteint pas par un NŒUD : on outille ce
    //    qui se joue, on oublie ce qui s'ouvre.
    mesurerBoite: function () {
      photographierPourMesure();
      return ecranBoite(function () { return carte(); });
    },
    //  ⚠️ LA VARIANTE D'ADIEU A SA PROPRE PORTE. Elle ne s'ouvre en jeu qu'après
    //     la grotte de l'épilogue, équipe pleine — c'est-à-dire au bout d'une
    //     Ligue gagnée. Sans porte, l'écran de la prise la plus rare du mode ne
    //     serait observable que par ce chemin-là.
    //  🔑 ET ELLE PASSE PAR `fin()`, pas par l'écran en direct : ce qu'on veut
    //     pouvoir regarder, c'est le ROUTAGE — une prise tardive doit s'insérer
    //     AVANT la clôture. Ouvrir l'écran à la main mesurerait un décor et
    //     laisserait le seul chemin qui compte hors de portée.
    mesurerAdieu: function () {
      photographierPourMesure();
      partie.fini = partie.fini || "vitrine";
      partie.priseTardive = true;
      return fin();
    },
    mesurerAccueil: function () {
      photographierPourMesure();
      var enCours = partie;
      var vue = accueil();
      // ⚠️ `prendreLaPartie`, PAS `partie = enCours` — et c'est la batterie qui
      //    me l'a appris dans la minute. Cette porte est la SEULE qui rebranche
      //    les infobulles ; une affectation nue rendait la partie sans une
      //    seule explication au survol, et rien à l'écran ne l'aurait dit.
      prendreLaPartie(enCours);  // l'écran change, le voyage ne bouge pas
      return vue;
    },
  };
  if (W.RTL_DEMARRAGE_IMMEDIAT) demarrer();
})(window, document);
