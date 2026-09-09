(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE VOYAGE — L'ITINÉRAIRE D'HOENN (ÉMERAUDE)
  //
  //  🔴 CE FICHIER EST DE LA CONCEPTION, PAS DE LA DONNÉE EXTRAITE.
  //     Les tables de rencontre, les équipes et les noms viennent du ROM
  //     (`gen3/monde.js`, `gen3/dresseurs.js`, `gen3/arenes.js`) ; ici on
  //     décide de l'ORDRE, des VERROUS et du RYTHME. Le canon dit ce qui existe ;
  //     la conception dit à quel prix on y accède.
  //
  //  Trois règles tiennent tout le fichier :
  //   1. L'ordre est celui du jeu. On ne réinvente pas Hoenn.
  //   2. Un verrou est toujours canon — une CS, un objet, un badge, une scène.
  //      Jamais « parce qu'il faut ralentir le joueur ».
  //   3. Un nœud annonce ce qu'il contient AVANT le choix.
  //
  //  🔴 CE QUI FAIT LE CŒUR D'HOENN :
  //   · HUIT CS CANONIQUES : Coupe, Flash, Éclate-Roc, Force, Surf, Vol, Plongée, Cascade.
  //   · LA TRAVERSÉE MARITIME ET LES FONDS SOUS-MARINS (Plongée sur Chenaux 124-128).
  //   · LES LÉGENDAIRES DU CLIMAT : Rayquaza au Pilier Céleste, Groudon et Kyogre
  //     dans leurs sanctuaires respectifs (Grotte Terra & Grotte Marine).
  //   · LE MYSTÈRE DES TROIS RÉGIS déverrouillé par la Chambre Scellée.
  //   · LES DEUX ERRANTS DU VENT : Latios et Latias libérés après la Ligue.
  //   · LE SOMMET DE L'ÉPILOGUE : Pierre Rochard au fond du Site Météore (niv 75-78).
  // ═══════════════════════════════════════════════════════════════════════════

  // Les clés de progression d'Hoenn. Chacune s'obtient par la scène canon qui
  // la donne, et par elle seule.
  var CLES = {
    coupe:       { source: "merouville",         nom: { fr: "CS01 Coupe", en: "HM01 Cut" } },
    flash:       { source: "grotte-granite",     nom: { fr: "CS05 Flash", en: "HM05 Flash" } },
    eclateroc:   { source: "lavandia",           nom: { fr: "CS06 Éclate-Roc", en: "HM06 Rock Smash" } },
    force:       { source: "tunnel-merouvergne", nom: { fr: "CS04 Force", en: "HM04 Strength" } },
    surf:        { source: "clementi-ville",     nom: { fr: "CS03 Surf", en: "HM03 Surf" } },
    vol:         { source: "route-120",          nom: { fr: "CS02 Vol", en: "HM02 Fly" } },
    plongee:     { source: "algatia",            nom: { fr: "CS08 Plongée", en: "HM08 Dive" } },
    cascade:     { source: "atalanopolis",       nom: { fr: "CS07 Cascade", en: "HM07 Waterfall" } },
    // Les objets de scénario
    lunettes:    { source: "vermilava",          nom: { fr: "Lunettes Sable", en: "Go-Goggles" } },
    devonScope:  { source: "route-120",          nom: { fr: "Devon Scope", en: "Devon Scope" } },
    master:      { source: "nenucrique",         nom: { fr: "Master Ball", en: "Master Ball" } },
  };

  // 🔴 UNE CS NE S'EMPLOIE PAS SANS SON BADGE — règle canonique de la 3e génération.
  var BADGE_POUR_CS = {
    coupe: 1,
    flash: 2,
    eclateroc: 3,
    force: 4,
    surf: 5,
    vol: 6,
    plongee: 7,
    cascade: 8
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES ÉTAPES, DANS L'ORDRE DU JEU (9 ACTES + ÉPILOGUE)
  // ═══════════════════════════════════════════════════════════════════════════
  var ETAPES = [
    // ── ACTE 1 · Roxanne (Mérouville) ──────────────────────────────────────
    { id: "bourg-en-vol", lieu: "littleroot-town", categorie: "ville", depart: true },
    { id: "route-101", lieu: "route-101", categorie: "route", tables: ["ROUTE_101"] },
    { id: "rosyeres", lieu: "oldale-town", categorie: "ville", boutique: 1 },
    { id: "route-103", lieu: "route-103", categorie: "route", tables: ["ROUTE_103"], rival: 1 },
    { id: "route-102", lieu: "route-102", categorie: "route", tables: ["ROUTE_102"] },
    { id: "clementi-ville", lieu: "petalburg-city", categorie: "ville", boutique: 1 },
    { id: "route-104", lieu: "route-104", categorie: "route", tables: ["ROUTE_104"] },
    { id: "bois-clementi", lieu: "petalburg-woods", categorie: "donjon", tables: ["PETALBURG_WOODS"], team: 1 },
    { id: "tunnel-merouvergne", lieu: "rusturf-tunnel", categorie: "donjon", tables: ["RUSTURF_TUNNEL"], donne: ["force"] },
    { id: "merouville", lieu: "rustboro-city", categorie: "ville", arene: 1, boutique: 1, donne: ["coupe"] },

    // ── ACTE 2 · Brawly (Myokara) ──────────────────────────────────────────
    { id: "grotte-granite", lieu: "granite-cave", categorie: "donjon",
      tables: ["GRANITE_CAVE_1F", "GRANITE_CAVE_B1F", "GRANITE_CAVE_B2F"], donne: ["flash"] },
    { id: "myokara", lieu: "dewford-town", categorie: "ville", arene: 2, boutique: 1 },

    // ── ACTE 3 · Wattson (Lavandia) ────────────────────────────────────────
    { id: "plage-poivressel", lieu: "route-109", categorie: "route", tables: ["ROUTE_109"] },
    { id: "poivressel", lieu: "slateport-city", categorie: "ville", boutique: 2 },
    { id: "route-110", lieu: "route-110", categorie: "route", tables: ["ROUTE_110"], rival: 2 },
    { id: "lavandia", lieu: "mauville-city", categorie: "ville", arene: 3, boutique: 2,
      donne: ["eclateroc"], casino: true },

    // ── ACTE 4 · Flannery (Vermilava) ──────────────────────────────────────
    { id: "route-111-sud", lieu: "route-111", categorie: "route", tables: ["ROUTE_111"] },
    { id: "route-112", lieu: "route-112", categorie: "route", tables: ["ROUTE_112"] },
    { id: "chemin-ardent", lieu: "fiery-path", categorie: "donjon", tables: ["FIERY_PATH"] },
    { id: "telepherique-mont-chimere", lieu: "mt-chimney", categorie: "scene", tables: ["MT_CHIMNEY"], team: 2 },
    { id: "sentier-sinuroc", lieu: "jagged-pass", categorie: "route", tables: ["JAGGED_PASS"] },
    { id: "vermilava", lieu: "lavaridge-town", categorie: "ville", arene: 4, boutique: 2,
      donne: ["lunettes"], oeuf: true },

    // ── ACTE 5 · Norman (Clémenti-Ville) ───────────────────────────────────
    { id: "route-111-desert", lieu: "route-111-desert", categorie: "donjon",
      tables: ["ROUTE_111_DESERT"], exige: ["lunettes"], fossile: true },
    { id: "route-117", lieu: "route-117", categorie: "route", tables: ["ROUTE_117"], pension: true },
    { id: "vergazon", lieu: "verdanturf-town", categorie: "ville", boutique: 2 },
    { id: "clementi-arene", lieu: "petalburg-city", categorie: "ville", arene: 5, donne: ["surf"] },

    // ── ACTE 6 · Winona (Cimetronelle) ─────────────────────────────────────
    { id: "route-118", lieu: "route-118", categorie: "route", tables: ["ROUTE_118"], exige: ["surf"] },
    { id: "route-119", lieu: "route-119", categorie: "route", tables: ["ROUTE_119"], meteo: true },
    { id: "route-120", lieu: "route-120", categorie: "route", tables: ["ROUTE_120"],
      donne: ["devonScope", "vol"] },
    { id: "cimetronelle", lieu: "fortree-city", categorie: "ville", arene: 6, boutique: 3 },

    // ── ACTE 7 · Tito & Tato (Algatia) ─────────────────────────────────────
    { id: "route-121", lieu: "route-121", categorie: "route", tables: ["ROUTE_121"] },
    { id: "parc-safari", lieu: "safari-zone", categorie: "safari", tables: ["SAFARI_ZONE"] },
    { id: "nenucrique", lieu: "lilycove-city", categorie: "ville", boutique: 3,
      donne: ["master"], repaireTeam: true },
    { id: "mont-memoria", lieu: "mt-pyre", categorie: "donjon",
      tables: ["MT_PYRE_INTERIEUR", "MT_PYRE_EXTERIEUR"] },
    { id: "chenal-124", lieu: "route-124", categorie: "route", tables: ["ROUTE_124"], exige: ["surf"] },
    { id: "algatia", lieu: "mossdeep-city", categorie: "ville", arene: 7, boutique: 3,
      donne: ["plongee"], centreSpatial: true, legendaire: 385 },

    // ── ACTE 8 · Juan (Atalanopolis) ───────────────────────────────────────
    { id: "chenal-126", lieu: "route-126", categorie: "route", tables: ["ROUTE_126"], exige: ["surf"] },
    { id: "caverne-fondmer", lieu: "seafloor-cavern", categorie: "donjon",
      tables: ["SEAFLOOR_CAVERN"], exige: ["plongee"] },
    { id: "chenal-127-128", lieu: "route-127", categorie: "route",
      tables: ["ROUTE_127", "ROUTE_128"], exige: ["surf"] },
    { id: "pilier-celeste", lieu: "sky-pillar", categorie: "donjon",
      tables: ["SKY_PILLAR"], legendaire: 384, niveauLegendaire: 70 },
    { id: "atalanopolis", lieu: "sootopolis-city", categorie: "ville", arene: 8, boutique: 3,
      donne: ["cascade"] },

    // ── ACTE 9 · La Ligue Pokémon (Éternara) ───────────────────────────────
    { id: "cascade-eternara", lieu: "ever-grande-city", categorie: "route", exige: ["cascade"] },
    { id: "route-victoire", lieu: "victory-road", categorie: "donjon",
      tables: ["VICTORY_ROAD_1F", "VICTORY_ROAD_B1F", "VICTORY_ROAD_B2F"], timmy: true },
    { id: "eternara-ligue", lieu: "ever-grande-city", categorie: "ligue",
      ligue: true, boss: true, exigeBadges: 8, libereErrants: true },

    // ── ÉPILOGUE & SANCTUAIRES ─────────────────────────────────────────────
    { id: "site-meteore-profondeurs", lieu: "meteor-falls", categorie: "donjon",
      tables: ["METEOR_FALLS_B1F"], apresLigue: true, dresseurFinal: true,
      dresseur: "Steven Stone", nomDresseur: { fr: "Pierre Rochard", en: "Steven Stone" } },
    { id: "chambre-scellee", lieu: "sealed-chamber", categorie: "donjon",
      apresLigue: true, deverrouilleRegis: true },
    { id: "ruines-desert", lieu: "desert-ruins", categorie: "donjon",
      apresLigue: true, legendaire: 377, niveauLegendaire: 40 },
    { id: "grotte-ilot", lieu: "island-cave", categorie: "donjon",
      apresLigue: true, legendaire: 378, niveauLegendaire: 40 },
    { id: "tombeau-antique", lieu: "ancient-tomb", categorie: "donjon",
      apresLigue: true, legendaire: 379, niveauLegendaire: 40 },
    { id: "grotte-terra", lieu: "terra-cave", categorie: "donjon",
      apresLigue: true, legendaire: 383, niveauLegendaire: 70 },
    { id: "grotte-marine", lieu: "marine-cave", categorie: "donjon",
      apresLigue: true, legendaire: 382, niveauLegendaire: 70 },
    { id: "ile-aurore", lieu: "birth-island", categorie: "donjon",
      apresLigue: true, legendaire: 386, niveauLegendaire: 30 },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES DEUX ERRANTS DU VENT : LATIAS (380) ET LATIOS (381)
  // ═══════════════════════════════════════════════════════════════════════════
  var ERRANTS = [380, 381];
  ERRANTS.depuis = "eternara-ligue";
  ERRANTS.apresLigue = true;
  ERRANTS.libereErrants = true;
  ERRANTS.chance = 0.05;
  ERRANTS.tours = 3;
  ERRANTS.liste = [
    { n: 380, niveau: 40 },
    { n: 381, niveau: 40 }
  ];

  function etapeDe(id) {
    for (var i = 0; i < ETAPES.length; i++) {
      if (ETAPES[i].id === id) return ETAPES[i];
    }
    return null;
  }

  function ouverture(etape, partie) {
    var manque = [];
    var i;
    for (i = 0; i < (etape.exige || []).length; i++) {
      var cle = etape.exige[i];
      if (!partie.cles || !partie.cles[cle]) {
        manque.push({ type: "cle", cle: cle });
        continue;
      }
      var b = BADGE_POUR_CS[cle];
      if (b && (!partie.badges || partie.badges.length < b)) {
        manque.push({ type: "badgeCS", cle: cle, requis: b });
      }
    }
    if (etape.exigeBadges && (!partie.badges || partie.badges.length < etape.exigeBadges)) {
      manque.push({
        type: "badges",
        requis: etape.exigeBadges,
        obtenus: (partie.badges ? partie.badges.length : 0)
      });
    }
    if (etape.apresLigue && !partie.ligueGagnee) {
      manque.push({ type: "ligue" });
    }
    return { ouverte: manque.length === 0, manque: manque };
  }

  W.POKE_GEN3_BADGE_POUR_CS = BADGE_POUR_CS;
  W.POKE_GEN3_CLES = CLES;
  W.POKE_GEN3_ETAPES = ETAPES;
  W.POKE_GEN3_ERRANTS = ERRANTS;
  W.pokeGen3EtapeDe = etapeDe;
  W.pokeGen3Ouverture = ouverture;
})(typeof window !== "undefined" ? window : globalThis);
