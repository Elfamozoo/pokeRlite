(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE VOYAGE — L'ITINÉRAIRE DE KANTO
  //
  //  🔴 CE FICHIER EST DE LA CONCEPTION, PAS DE LA DONNÉE EXTRAITE. Les tables
  //     de rencontre, les équipes et les noms viennent du ROM (`monde.js`,
  //     `dresseurs.js`) ; ici on décide de l'ORDRE, des VERROUS et du RYTHME.
  //     Le canon dit ce qui existe ; la conception dit à quel prix on y accède.
  //
  //  Trois règles tiennent tout le fichier :
  //   1. L'ordre est celui du jeu. On ne réinvente pas Kanto.
  //   2. Un verrou est toujours canon — une CS, un objet, un badge, une scène.
  //      Jamais « parce qu'il faut ralentir le joueur ».
  //   3. Un nœud annonce ce qu'il contient AVANT le choix. Le mode est dur,
  //      mais il ne cache rien : une difficulté qu'on ne voit pas venir n'est
  //      pas de la difficulté, c'est un piège.
  //
  //  ⚠️ LE BUDGET DE JOURS N'EXISTE PLUS. Il a été retiré avec la refonte en
  //     carte à embranchements : la contrainte, c'est le CHEMIN — une branche
  //     prise est une branche perdue. Ses données (`jours` sur les 51 étapes,
  //     `POKE_BUDGET`, `POKE_COUT`) ont survécu six semaines sans un lecteur ;
  //     `poke-drapeaux-morts.mjs` les a relevées, elles sont parties le 09/08.
  //     Idem `facultatif`, posé sur trois étapes et lu nulle part.
  // ═══════════════════════════════════════════════════════════════════════════

  // Les clés de progression. Chacune s'obtient par la scène canon qui la donne,
  // et par elle seule.
  var CLES = {
    coupe:    { source: "paquebot",       nom: { fr: "CS01 Coupe", en: "HM01 Cut" } },
    vol:      { source: "route-16",       nom: { fr: "CS02 Vol", en: "HM02 Fly" } },
    surf:     { source: "zone-safari",    nom: { fr: "CS03 Surf", en: "HM03 Surf" } },
    force:    { source: "zone-safari",    nom: { fr: "CS04 Force", en: "HM04 Strength" } },
    flash:    { source: "route-2",        nom: { fr: "CS05 Flash", en: "HM05 Flash" } },
    ticket:   { source: "route-25",       nom: { fr: "Ticket Bateau", en: "S.S. Ticket" } },
    scope:    { source: "repaire-rocket", nom: { fr: "Scope Sylphe", en: "Silph Scope" } },
    flute:    { source: "tour-pokemon",   nom: { fr: "Poké Flûte", en: "Poké Flute" } },
    carte:    { source: "repaire-rocket", nom: { fr: "Carte Magnétique", en: "Lift Key" } },
    dentOr:   { source: "zone-safari",    nom: { fr: "Dent d'Or", en: "Gold Teeth" } },
    velo:     { source: "carmin",         nom: { fr: "Bicyclette", en: "Bicycle" } },
    master:   { source: "tour-silph",     nom: { fr: "Master Ball", en: "Master Ball" } },
    boisson:  { source: "celadopole",     nom: { fr: "Limonade", en: "Fresh Water" } },
    cleSecrete: { source: "manoir",       nom: { fr: "Clé Secrète", en: "Secret Key" } },
  };

  // 🔴 UNE CS NE S'EMPLOIE PAS SANS SON BADGE. C'est la règle du jeu d'origine,
  //    et c'est elle qui fait la vraie progression : trouver la CS ne suffit
  //    pas, il faut avoir mérité le droit de s'en servir. Sans ça, la Zone
  //    Safari donnait Surf et Force au joueur, et la moitié de Kanto s'ouvrait
  //    d'un coup — c'est ce que la mesure du 07/08 a montré.
  var BADGE_POUR_CS = { flash: 1, coupe: 2, vol: 3, force: 4, surf: 5 };

  // Une étape du voyage.
  //   tables  : les tables de rencontre du ROM que cette étape recouvre.
  //   exige   : ce qu'il faut posséder pour entrer. Toujours canon.
  //   donne   : ce que l'étape rend, une fois franchie.
  //   arene   : le numéro de l'arène qu'on y trouve.
  //   legendaire : le Pokémon unique qui y dort.
  var ETAPES = [
    { id: "bourg-palette", lieu: "pallet-town", categorie: "ville", depart: true },
    { id: "route-1", lieu: "kanto-route-1", categorie: "route", tables: ["Route1"] },
    { id: "jadielle", lieu: "viridian-city", categorie: "ville", boutique: 1 },
    // Le rival barre la route 22 avant l'arène : c'est là qu'on le croise la
    // deuxième fois, et l'étape reste facultative.
    { id: "route-22", lieu: "kanto-route-22", categorie: "route", tables: ["Route22"] },
    { id: "route-2", lieu: "kanto-route-2", categorie: "route", tables: ["Route2"], donne: ["flash"] },
    { id: "foret-de-jade", lieu: "viridian-forest", categorie: "donjon", tables: ["ViridianForest"] },
    { id: "argenta", lieu: "pewter-city", categorie: "ville", arene: 1, boutique: 1 },
    { id: "route-3", lieu: "kanto-route-3", categorie: "route", tables: ["Route3"] },
    { id: "mont-selenite", lieu: "mt-moon", categorie: "donjon", tables: ["MtMoon1F", "MtMoonB1F", "MtMoonB2F"], fossile: true, rocket: 1 },
    { id: "route-4", lieu: "kanto-route-4", categorie: "route", tables: ["Route4"] },
    { id: "azuria", lieu: "cerulean-city", categorie: "ville", arene: 2, boutique: 2 },
    { id: "route-24", lieu: "kanto-route-24", categorie: "route", tables: ["Route24"] },
    { id: "route-25", lieu: "kanto-route-25", categorie: "route", tables: ["Route25"], donne: ["ticket"] },
    { id: "route-5", lieu: "kanto-route-5", categorie: "route", tables: ["Route5"], pension: true },
    { id: "route-6", lieu: "kanto-route-6", categorie: "route", tables: ["Route6"] },
    { id: "carmin", lieu: "vermilion-city", categorie: "ville", arene: 3, boutique: 2, donne: ["velo"] },
    // Le paquebot part APRÈS la visite, définitivement. Sans y monter, la Coupe
    // n'existe plus de la partie — et l'arène de Carmin reste fermée.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LE CAMION. C'est la rumeur la plus célèbre de l'histoire de la série :
    //    en 1996, des joueurs ont juré qu'un camion sur le quai du paquebot
    //    cachait Mew. Le camion existe vraiment dans le ROM ; il n'y a jamais
    //    rien eu dessous. On le met donc là où il est, et on le rend VRAI — à
    //    une condition que personne n'atteint par hasard.
    //    Voir `camion` dans `carte-actes.js` et l'écran du même nom.
    { id: "paquebot", lieu: "ss-anne", categorie: "scene", exige: ["ticket"], donne: ["coupe"], unique: true, camion: true },
    { id: "route-11", lieu: "kanto-route-11", categorie: "route", tables: ["Route11"] },
    { id: "grotte-taupiqueur", lieu: "digletts-cave", categorie: "donjon", tables: ["DiglettsCave"] },
    { id: "route-9", lieu: "kanto-route-9", categorie: "route", tables: ["Route9"], exige: ["coupe"] },
    { id: "route-10", lieu: "kanto-route-10", categorie: "route", tables: ["Route10"] },
    { id: "tunnel-roche", lieu: "rock-tunnel", categorie: "donjon", tables: ["RockTunnel1F", "RockTunnelB1F"], exige: ["flash"] },
    { id: "lavanville", lieu: "lavender-town", categorie: "ville", boutique: 2 },
    { id: "route-8", lieu: "kanto-route-8", categorie: "route", tables: ["Route8"] },
    { id: "route-7", lieu: "kanto-route-7", categorie: "route", tables: ["Route7"] },
    { id: "celadopole", lieu: "celadon-city", categorie: "ville", arene: 4, boutique: 3, casino: true, donne: ["boisson"] },
    { id: "repaire-rocket", lieu: "celadon-city", categorie: "scene", rocket: 2, donne: ["scope", "carte"] },
    // Sans le Scope Sylphe, on ne voit pas le fantôme et le tour ne sert à rien.
    // 🔴 LES DEUX PREMIERS ÉTAGES N'ONT PAS DE RENCONTRES, et c'est le canon :
    //    on n'y croise que des dresseurs. Je les avais listés quand même —
    //    `poke-injoignable` a attrapé les deux tables inexistantes. Une table
    //    référencée qui n'existe pas, c'est une zone qui ne rend jamais rien.
    { id: "tour-pokemon", lieu: "pokemon-tower", categorie: "donjon", tables: ["PokemonTower3F", "PokemonTower4F", "PokemonTower5F", "PokemonTower6F", "PokemonTower7F"], exige: ["scope"], donne: ["flute"] },
    { id: "route-16", lieu: "kanto-route-16", categorie: "route", tables: ["Route16"], donne: ["vol"], ronflex: true, exige: ["flute"] },
    { id: "route-17", lieu: "kanto-route-17", categorie: "route", tables: ["Route17"] },
    { id: "route-18", lieu: "kanto-route-18", categorie: "route", tables: ["Route18"] },
    { id: "parmanie", lieu: "fuchsia-city", categorie: "ville", arene: 5, boutique: 3 },
    { id: "zone-safari", lieu: "kanto-safari-zone", categorie: "safari", tables: ["SafariZoneCenter", "SafariZoneEast", "SafariZoneNorth", "SafariZoneWest"], donne: ["surf", "force", "dentOr"] },
    { id: "route-12", lieu: "kanto-route-12", categorie: "route", tables: ["Route12"], ronflex: true, exige: ["flute"] },
    { id: "route-13", lieu: "kanto-route-13", categorie: "route", tables: ["Route13"] },
    { id: "route-14", lieu: "kanto-route-14", categorie: "route", tables: ["Route14"] },
    { id: "route-15", lieu: "kanto-route-15", categorie: "route", tables: ["Route15"] },
    { id: "safrania", lieu: "saffron-city", categorie: "ville", boutique: 3, exige: ["boisson"] },
    { id: "tour-silph", lieu: "saffron-city", categorie: "scene", rocket: 3, donne: ["master"] },
    { id: "safrania-arene", lieu: "saffron-city", categorie: "ville", arene: 6, exige: ["master"] },
    { id: "route-19", lieu: "kanto-sea-route-19", categorie: "eau", tables: ["SeaRoutes"], exige: ["surf"] },
    { id: "iles-ecume", lieu: "seafoam-islands", categorie: "donjon", tables: ["SeafoamIslands1F", "SeafoamIslandsB1F", "SeafoamIslandsB2F", "SeafoamIslandsB3F", "SeafoamIslandsB4F"], exige: ["surf", "force"], legendaire: 144 },
    // Le Chenal 21 relie Cramois'Île à Bourg Palette. Sa table existait dans le
    // ROM et n'était rattachée à aucune étape : `poke-injoignable` l'a relevée.
    // C'est aussi le chemin du retour, et il boucle le voyage sur son départ.
    { id: "route-21", lieu: "kanto-sea-route-21", categorie: "eau", tables: ["Route21"], exige: ["surf"] },
    { id: "cramois-ile", lieu: "cinnabar-island", categorie: "ville", arene: 7, boutique: 3, fossileRanime: true, exige: ["cleSecrete"] },
    { id: "manoir", lieu: "pokemon-mansion", categorie: "donjon", tables: ["PokemonMansion1F", "PokemonMansion2F", "PokemonMansion3F", "PokemonMansionB1F"], journalMewtwo: true, donne: ["cleSecrete"] },
    { id: "centrale", lieu: "kanto-power-plant", categorie: "donjon", tables: ["PowerPlant"], exige: ["surf"], legendaire: 145 },
    { id: "jadielle-arene", lieu: "viridian-city", categorie: "ville", arene: 8, exigeBadges: 7 },
    { id: "route-23", lieu: "kanto-route-23", categorie: "route", tables: ["Route23"], exige: ["surf"], exigeBadges: 8 },
    { id: "route-victoire", lieu: "kanto-victory-road-1", categorie: "donjon", tables: ["VictoryRoad1F", "VictoryRoad2F", "VictoryRoad3F"], exige: ["force"], legendaire: 146 },
    { id: "plateau-indigo", lieu: "indigo-plateau", categorie: "ligue", ligue: true },
    // Mewtwo n'existe qu'APRÈS la Ligue. C'est le canon, et c'est ce qui fait de
    // lui une fin, pas une étape.
    { id: "grotte-inconnue", lieu: "cerulean-cave", categorie: "donjon", tables: ["CeruleanCave1F", "CeruleanCave2F", "CeruleanCaveB1F"], exige: ["surf"], apresLigue: true, legendaire: 150 },
  ];

  // Les deux Ronflex des routes 12 et 16. Ils dorment en travers du chemin et ne
  // bougent qu'à la Poké Flûte. Sans elle, deux branches du monde sont fermées —
  // et le jeu doit le DIRE, sinon le joueur croit à un bug.
  var RONFLEX = 143;

  // ── CE QUE LE BUDGET DE JOURS A LAISSÉ COMME LEÇON ─────────────────────────
  //  Il a existé, il a été mesuré, il a été retiré. On garde la leçon, pas le
  //  code : chez Pokémon, **s'entraîner EST le voyage**. Facturer du temps à
  //  l'entraînement met les deux boucles du jeu en concurrence, et le joueur
  //  perd celle pour laquelle il est venu — 0 % de badges sur quatre réglages
  //  successifs. La dureté vient d'ailleurs, et elle vient de mieux : les
  //  types, l'argent, le Conseil 4 sans soin, le Nuzlocke, la rareté des
  //  créneaux — et depuis la refonte, le CHEMIN lui-même.

  function etapeDe(id) {
    for (var i = 0; i < ETAPES.length; i++) if (ETAPES[i].id === id) return ETAPES[i];
    return null;
  }

  // Une étape est ouverte si toutes ses conditions sont remplies. La fonction
  // rend AUSSI la raison du refus : un verrou muet se lit comme un bug, et
  // c'est la classe de défaut la plus fréquente du projet.
  function ouverture(etape, partie) {
    var manque = [];
    var i;
    for (i = 0; i < (etape.exige || []).length; i++) {
      var cle = etape.exige[i];
      if (!partie.cles[cle]) { manque.push({ type: "cle", cle: cle }); continue; }
      // On a la CS, mais a-t-on le droit de s'en servir ?
      var b = BADGE_POUR_CS[cle];
      if (b && partie.badges.length < b) manque.push({ type: "badgeCS", cle: cle, requis: b });
    }
    if (etape.exigeBadges && partie.badges.length < etape.exigeBadges) {
      manque.push({ type: "badges", requis: etape.exigeBadges, obtenus: partie.badges.length });
    }
    if (etape.apresLigue && !partie.ligueGagnee) manque.push({ type: "ligue" });
    return { ouverte: manque.length === 0, manque: manque };
  }

  W.POKE_BADGE_POUR_CS = BADGE_POUR_CS;
  W.POKE_CLES = CLES;
  W.POKE_ETAPES = ETAPES;
  W.POKE_RONFLEX = RONFLEX;
  W.pokeEtapeDe = etapeDe;
  W.pokeOuverture = ouverture;
})(typeof window !== "undefined" ? window : globalThis);
