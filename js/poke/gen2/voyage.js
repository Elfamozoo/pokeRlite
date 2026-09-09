(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE VOYAGE — L'ITINÉRAIRE DE JOHTO
  //
  //  🔴 CE FICHIER EST DE LA CONCEPTION, PAS DE LA DONNÉE EXTRAITE, et c'est la
  //     seule pièce de la seconde génération dans ce cas. Les tables de
  //     rencontre, les équipes et les noms viennent du ROM (`gen2/monde.js`,
  //     `gen2/dresseurs.js`) ; ici on décide de l'ORDRE, des VERROUS et du
  //     RYTHME. Le canon dit ce qui existe ; la conception dit à quel prix on y
  //     accède. C'est mot pour mot le bandeau de son jumeau de Kanto, et les
  //     trois mêmes règles tiennent le fichier :
  //      1. L'ordre est celui du jeu. On ne réinvente pas Johto.
  //      2. Un verrou est toujours canon — une CS, un objet, un badge, une
  //         scène. Jamais « parce qu'il faut ralentir le joueur ».
  //      3. Un nœud annonce ce qu'il contient AVANT le choix.
  //
  //  🔴 CE QUI CHANGE PAR RAPPORT À KANTO, ET QUI EST LE CŒUR DE JOHTO :
  //
  //   · LES TROIS BÊTES COURENT. Raikou, Entei et Suicune ne s'attendent pas
  //     dans une salle : ils fuient au premier tour, partout, tant qu'on ne les
  //     a pas rattrapés. C'est LA spécificité de 1999, et c'est aussi la seule
  //     réponse honnête au reproche fait à la première génération — « c'était
  //     beaucoup trop facile ». Un légendaire de Kanto attend qu'on vienne le
  //     prendre ; ceux-là, non. Voir `errants` plus bas et `POKE_GEN2_ERRANTS`.
  //
  //   · L'ARÈNE 6 SE GAGNE APRÈS L'ARÈNE 5. Jasmine quitte son arène pour son
  //     Steelix malade au phare : on traverse la mer, on bat Chuck à Irisia, on
  //     rapporte le remède, ET SEULEMENT ALORS Oliville ouvre. Ce n'est pas un
  //     verrou inventé pour ralentir — c'est le scénario du jeu, et c'est ce
  //     qui fait de l'acte 5 le plus long des neuf.
  //
  //   · LE LAC COLÈRE EST UNE SCÈNE, PAS UNE ROUTE. Le Léviator rouge et le
  //     repaire de la Team Rocket ferment l'acte 7 : sans eux, Frédo n'ouvre
  //     pas. C'est le seul moment du voyage où le monde bouge avant le badge.
  //
  //  ⚠️ CE FICHIER N'EST CHARGÉ PAR PERSONNE tant que la seconde génération
  //     n'est pas approuvée — voir `tools/poke-gen2-close.mjs`.
  // ═══════════════════════════════════════════════════════════════════════════

  // Les clés de progression de Johto. Chacune s'obtient par la scène canon qui
  // la donne, et par elle seule.
  // ⚠️ Johto n'a PAS de Passe Navire ni de Passe Or : ses verrous sont des CS
  //    et des objets de scénario. Une clé qui n'ouvre rien serait un drapeau
  //    mort, et `poke-drapeaux-morts.mjs` les traque.
  var CLES = {
    coupe:    { source: "bois-aux-chenes",  nom: { fr: "CS01 Coupe", en: "HM01 Cut" } },
    surf:     { source: "rosalia",          nom: { fr: "CS03 Surf", en: "HM03 Surf" } },
    force:    { source: "oliville",         nom: { fr: "CS04 Force", en: "HM04 Strength" } },
    flash:    { source: "caves-jumelles",   nom: { fr: "CS05 Flash", en: "HM05 Flash" } },
    chute:    { source: "ebenelle",         nom: { fr: "CS07 Cascade", en: "HM07 Waterfall" } },
    // Les objets de scénario. Chacun ouvre exactement une porte.
    remede:   { source: "irisia",           nom: { fr: "Remède du phare", en: "Lighthouse cure" } },
    mdpRocket:{ source: "lac-colere",       nom: { fr: "Mot de passe Rocket", en: "Rocket password" } },
    ailArgent:{ source: "tourbiles",        nom: { fr: "Aile Argentée", en: "Silver Wing" } },
    ailArcEnCiel: { source: "tour-carillon", nom: { fr: "Aile Arc-en-ciel", en: "Rainbow Wing" } },
    // ═══════════════════════════════════════════════════════════════════════
    //  LA MASTER BALL DE JOHTO   [20/08/2026]
    //
    //  🔴 ELLE N'EXISTAIT PAS. Signalé par Poltron le soir de l'ouverture :
    //     « J'ai vaincu la team rocket donc normalement je devrais avoir La
    //     masterball afin de capturer Luchio et Oh Oh… Non. Le jeu a décidé de
    //     me priver de cette dernière. » Kanto la donne à la tour Silph, au
    //     bout de son arc Rocket ; Johto avait l'arc et pas la récompense.
    //  🔑 ET C'EST PIRE QU'UN OBJET MANQUANT : Johto est le monde qui a DEUX
    //     légendaires posés sur l'itinéraire, Lugia et Ho-Oh. Sans Master Ball,
    //     la seule capture garantie du voyage disparaît là où elle sert le plus.
    //  ⚠️ AU REPAIRE, PAS AILLEURS. C'est la dernière fois qu'on croise la Team
    //     Rocket dans cet itinéraire — donc l'endroit que le joueur associe à
    //     « je les ai vaincus ». La poser plus tôt la rendrait disponible avant
    //     l'arc ; plus tard, après les deux légendaires.
    // ═══════════════════════════════════════════════════════════════════════
    master:   { source: "repaire-rocket",   nom: { fr: "Master Ball", en: "Master Ball" } },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES ÉTAPES, DANS L'ORDRE DU JEU
  //
  //  `tables` renvoie aux identifiants de carte de `gen2/monde.js` — ceux du
  //  ROM, en majuscules. Une étape sans table est une ville ou une scène.
  // ═══════════════════════════════════════════════════════════════════════════
  var ETAPES = [
    // ── ACTE 1 · jusqu'à Albert ────────────────────────────────────────────
    { id: "bourg-geon", lieu: "new-bark-town", categorie: "ville", depart: true },
    { id: "route-29", lieu: "johto-route-29", categorie: "route", tables: ["ROUTE_29"] },
    { id: "ville-griotte", lieu: "cherrygrove-city", categorie: "ville", boutique: 1 },
    { id: "route-30", lieu: "johto-route-30", categorie: "route", tables: ["ROUTE_30"] },
    { id: "route-31", lieu: "johto-route-31", categorie: "route", tables: ["ROUTE_31"] },
    { id: "tour-chetiflor", lieu: "sprout-tower", categorie: "donjon",
      tables: ["SPROUT_TOWER_2F", "SPROUT_TOWER_3F"], donne: null },
    { id: "mauville", lieu: "violet-city", categorie: "ville", arene: 1, boutique: 1 },

    // ── ACTE 2 · jusqu'à Hector ────────────────────────────────────────────
    { id: "route-32", lieu: "johto-route-32", categorie: "route", tables: ["ROUTE_32"] },
    { id: "caves-jumelles", lieu: "union-cave", categorie: "donjon",
      tables: ["UNION_CAVE_1F", "UNION_CAVE_B1F", "UNION_CAVE_B2F"], donne: ["flash"] },
    // 🔴 LA GROTTE OBSCURE EST ICI, PAS À L'ACTE 1. Elle exige Flash, et Flash
    //    vient des Caves Jumelles : placée avant elles, c'était un nœud que
    //    personne ne pouvait ouvrir — relevé par le verrou, pas par un plantage.
    { id: "grotte-obscure", lieu: "dark-cave", categorie: "donjon",
      tables: ["DARK_CAVE_VIOLET_ENTRANCE", "DARK_CAVE_BLACKTHORN_ENTRANCE"], exige: ["flash"] },
    { id: "route-33", lieu: "johto-route-33", categorie: "route", tables: ["ROUTE_33"] },
    { id: "puits-ramoloss", lieu: "slowpoke-well", categorie: "donjon",
      tables: ["SLOWPOKE_WELL_B1F", "SLOWPOKE_WELL_B2F"], rocket: 1 },
    { id: "ecorcia", lieu: "azalea-town", categorie: "ville", arene: 2, boutique: 2 },

    // ── ACTE 3 · jusqu'à Blanche ───────────────────────────────────────────
    { id: "bois-aux-chenes", lieu: "ilex-forest", categorie: "donjon",
      tables: ["ILEX_FOREST"], donne: ["coupe"] },
    { id: "route-34", lieu: "johto-route-34", categorie: "route", tables: ["ROUTE_34"],
      exige: ["coupe"] },
    // 🔴 LE CASINO DE DOUBLONVILLE ÉTAIT UNE TABLE SANS PORTE. Ses trois lots —
    //    Abra à 100 jetons, Osselait à 800, Qulbutoké à 1500 — sont dans le ROM
    //    et le mode sait parfaitement jouer un nœud « casino » : il manquait ce
    //    drapeau, et seulement lui. Osselait et Ossatueur n'avaient AUCUNE
    //    autre porte à Johto ; Qulbutoké non plus.
    { id: "doublonville", lieu: "goldenrod-city", categorie: "ville", arene: 3, boutique: 3,
      pension: true, casino: true },

    // ── ACTE 4 · jusqu'à Mortimer ──────────────────────────────────────────
    { id: "route-35", lieu: "johto-route-35", categorie: "route", tables: ["ROUTE_35"] },
    { id: "parc-national", lieu: "national-park", categorie: "donjon", tables: ["NATIONAL_PARK"] },
    { id: "route-36", lieu: "johto-route-36", categorie: "route", tables: ["ROUTE_36"] },
    { id: "ruines-alpha", lieu: "ruins-of-alph", categorie: "donjon",
      tables: ["RUINS_OF_ALPH_OUTSIDE", "RUINS_OF_ALPH_INNER_CHAMBER"], unique: true },
    { id: "route-37", lieu: "johto-route-37", categorie: "route", tables: ["ROUTE_37"] },
    // 🔴 LA TOUR CALCINÉE LIBÈRE LES TROIS BÊTES. C'est la scène qui les met en
    //    fuite, et c'est le seul endroit du voyage où le monde CHANGE sans
    //    qu'un badge soit en jeu. Après elle, chaque nœud d'herbe peut rendre
    //    un errant — et chaque errant peut fuir avant qu'on l'ait touché.
    { id: "tour-calcinee", lieu: "burned-tower", categorie: "donjon",
      tables: ["BURNED_TOWER_1F", "BURNED_TOWER_B1F"], libereErrants: true },
    { id: "rosalia", lieu: "ecruteak-city", categorie: "ville", arene: 4, boutique: 3, donne: ["surf"] },

    // ── ACTE 5 · Chuck, et la traversée ────────────────────────────────────
    { id: "route-38", lieu: "johto-route-38", categorie: "route", tables: ["ROUTE_38"] },
    { id: "route-39", lieu: "johto-route-39", categorie: "route", tables: ["ROUTE_39"] },
    { id: "oliville-port", lieu: "olivine-city", categorie: "ville", boutique: 3 },
    { id: "chenal-40", lieu: "johto-sea-route-40", categorie: "route",
      tables: ["ROUTE_40"], exige: ["surf"] },
    { id: "chenal-41", lieu: "johto-sea-route-41", categorie: "route",
      tables: ["ROUTE_41"], exige: ["surf"] },
    { id: "irisia", lieu: "cianwood-city", categorie: "ville", arene: 5, boutique: 3, donne: ["remede"] },

    // ── ACTE 6 · le retour par les Tourb'Îles, le phare, puis Jasmine ──────
    //  🔴 LE VERROU EST LE SCÉNARIO, PAS UN FREIN. Jasmine n'est pas dans son
    //     arène tant que son Steelix est malade : on ne peut pas la défier
    //     avant d'avoir rapporté le remède d'Irisia. C'est canon, et c'est ce
    //     qui donne à l'acte 5 sa longueur — la seule traversée de mer du jeu.
    //
    //  🔴 ET LES TOURB'ÎLES SONT ICI, PAS SEULEMENT APRÈS LA LIGUE. Mesuré en
    //     construisant les actes : sans elles, l'acte 6 sortait à ZÉRO zone —
    //     un acte où l'on ne croise rien, où l'on n'entraîne rien, où le butin
    //     n'existe pas. Le canon donne la réponse : les Tourb'Îles s'ouvrent
    //     depuis le chenal 41, entre Oliville et Irisia, et on peut les
    //     traverser bien avant d'avoir de quoi emporter Lugia.
    //  ⚠️ LA CAVERNE DE LUGIA RESTE À PART, après la Ligue et derrière l'Aile
    //     Argentée. On entre dans les îles tôt ; on en repart avec Lugia tard.
    { id: "tourbiles", lieu: "whirl-islands", categorie: "donjon",
      tables: ["WHIRL_ISLAND_NW", "WHIRL_ISLAND_NE", "WHIRL_ISLAND_SW", "WHIRL_ISLAND_SE",
               "WHIRL_ISLAND_B1F", "WHIRL_ISLAND_B2F", "WHIRL_ISLAND_CAVE"],
      exige: ["surf"], donne: ["ailArgent"] },
    { id: "phare-oliville", lieu: "olivine-city", categorie: "scene", exige: ["remede"] },
    { id: "oliville", lieu: "olivine-city", categorie: "ville", arene: 6, boutique: 3,
      donne: ["force"], exige: ["remede"] },

    // ── ACTE 7 · le Lac Colère et la Team Rocket ───────────────────────────
    { id: "route-42", lieu: "johto-route-42", categorie: "route", tables: ["ROUTE_42"] },
    { id: "mont-creuset", lieu: "mt-mortar", categorie: "donjon",
      tables: ["MOUNT_MORTAR_1F_OUTSIDE", "MOUNT_MORTAR_1F_INSIDE", "MOUNT_MORTAR_2F_INSIDE", "MOUNT_MORTAR_B1F"],
      exige: ["force"] },
    { id: "acajou-bourg", lieu: "mahogany-town", categorie: "ville", boutique: 3 },
    { id: "route-43", lieu: "johto-route-43", categorie: "route", tables: ["ROUTE_43"] },
    // Le Léviator rouge : une seule rencontre, et elle donne le mot de passe.
    // 🔴 [24/08] MÊME OUBLI QU'À L'ANTRE : `LAKE_OF_RAGE` est écrite dans le
    //    monde — Magicarpe et Léviator — et aucune étape ne la nommait. Le lac
    //    est LE lieu de Léviator dans le canon, et il était le seul de tout
    //    Johto à en porter un : sans cette table, l'espèce n'était pas
    //    obtenable, alors que le Pokédex la comptait.
    { id: "lac-colere", lieu: "lake-of-rage", categorie: "scene",
      exige: ["surf"], unique: true, donne: ["mdpRocket"],
      tables: ["LAKE_OF_RAGE"] },
    { id: "repaire-rocket", lieu: "mahogany-town", categorie: "donjon",
      exige: ["mdpRocket"], rocket: 2, donne: ["ailArcEnCiel", "master"] },
    { id: "acajou", lieu: "mahogany-town", categorie: "ville", arene: 7, boutique: 3,
      exige: ["mdpRocket"] },

    // ── ACTE 8 · la Route de Glace et Sandra ───────────────────────────────
    { id: "route-44", lieu: "johto-route-44", categorie: "route", tables: ["ROUTE_44"] },
    { id: "route-de-glace", lieu: "ice-path", categorie: "donjon",
      tables: ["ICE_PATH_1F", "ICE_PATH_B1F", "ICE_PATH_B2F_MAHOGANY_SIDE", "ICE_PATH_B2F_BLACKTHORN_SIDE", "ICE_PATH_B3F"],
      exige: ["force"] },
    { id: "ebenelle", lieu: "blackthorn-city", categorie: "ville", arene: 8, boutique: 3, donne: ["chute"] },
    // 🔴 [24/08] L'ANTRE N'AVAIT PAS SA TABLE, ET MINIDRACO N'EXISTAIT NULLE
    //    PART. `DRAGONS_DEN_B1F` est écrite dans le monde depuis le premier
    //    jour — Magicarpe et Minidraco, à la surf — et aucune étape ne la
    //    nommait : une zone que le monde porte et que personne n'atteint.
    //    C'est l'ADRESSE de Minidraco dans le canon ; sans elle, la lignée
    //    Minidraco-Draco-Dracolosse était injoignable dans tout Johto.
    { id: "antre-dragon", lieu: "dragons-den", categorie: "donjon", exigeBadges: 8, unique: true,
      tables: ["DRAGONS_DEN_B1F"] },

    // ── ACTE 9 · la Ligue ──────────────────────────────────────────────────
    { id: "route-45", lieu: "johto-route-45", categorie: "route", tables: ["ROUTE_45"] },
    { id: "route-46", lieu: "johto-route-46", categorie: "route", tables: ["ROUTE_46"] },
    { id: "plateau-indigo", lieu: "indigo-plateau", categorie: "ligue", exigeBadges: 8, ligue: true },

    // ── APRÈS LA LIGUE · les deux ailes ────────────────────────────────────
    //  🔴 LUGIA ET HO-OH NE SONT PAS DES BOSS DE PARCOURS. Ils demandent une
    //     aile, l'aile demande la Ligue, et ils ne se prennent qu'une fois —
    //     exactement comme la Grotte Inconnue de Kanto. Les mettre avant la
    //     Ligue en ferait deux étapes de plus ; les laisser dehors les rendrait
    //     inatteignables, ce que ce dossier refuse.
    { id: "caverne-lugia", lieu: "whirl-islands", categorie: "donjon",
      tables: ["WHIRL_ISLAND_LUGIA_CHAMBER"],
      exige: ["surf", "chute", "ailArgent"], apresLigue: true, legendaire: 249 },
    { id: "tour-carillon", lieu: "bell-tower", categorie: "donjon",
      tables: ["TIN_TOWER_2F", "TIN_TOWER_3F", "TIN_TOWER_4F", "TIN_TOWER_5F",
               "TIN_TOWER_6F", "TIN_TOWER_7F", "TIN_TOWER_8F", "TIN_TOWER_9F"],
      exige: ["ailArcEnCiel"], apresLigue: true, legendaire: 250 },
    // ═══════════════════════════════════════════════════════════════════
    //  🔴 LE MONT ARGENTÉ EST LE VRAI SOMMET, ET C'EST LA RÉPONSE MESURÉE À
    //     « C'ÉTAIT BEAUCOUP TROP FACILE ».
    //
    //     Mesuré sur 40 voyages de Johto, avant cette étape : 35,7 % au
    //     huitième badge et **17,9 % de Ligues gagnées**, contre 15,9 % et 0 %
    //     à Kanto. Johto sortait DEUX FOIS PLUS FACILE que la génération dont
    //     le propriétaire disait déjà qu'elle ne s'opposait à rien.
    //
    //     La cause n'est pas un réglage : elle est canon. Le Conseil 4 de
    //     Johto plafonne à 50, celui de Kanto à 62 — parce qu'en 1999 la Ligue
    //     N'EST PAS LA FIN. On la gagne, et on repart pour Kanto.
    //
    //  ✅ ON NE TOUCHE DONC PAS AU MUR — la loi du dossier l'interdit, et elle
    //     a raison : un Champion qu'on rehausse est un Champion qui n'est plus
    //     le sien. On rend au voyage sa VRAIE fin. Red attend au Mont Argenté,
    //     niveaux 81 à 88, sans un mot. C'est le combat le plus dur des deux
    //     générations, et il est à sa place exacte : après la Ligue, derrière
    //     Force et Cascade, comme la Grotte Inconnue de Kanto abrite Mewtwo.
    //  ⚠️ C'est un ÉPILOGUE, pas un dixième acte : il ne s'impose à personne.
    //     Qui veut s'arrêter Maître de Johto s'arrête Maître de Johto.
    // ═══════════════════════════════════════════════════════════════════════
    { id: "mont-argente", lieu: "mt-silver", categorie: "donjon",
      tables: ["SILVER_CAVE_OUTSIDE", "SILVER_CAVE_ROOM_1", "SILVER_CAVE_ROOM_2", "SILVER_CAVE_ROOM_3",
                "SILVER_CAVE_ITEM_ROOMS"],
      exige: ["force", "chute"], apresLigue: true, dresseurFinal: "Red" },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES TROIS BÊTES — CE QUI REND JOHTO DUR
  //
  //  🔴 « C'ÉTAIT BEAUCOUP TROP FACILE » — le propriétaire, sur la première
  //     génération. Les légendaires de Kanto attendent dans une salle : on
  //     arrive, on lance des Balls, on repart. Un seul essai, mais un essai
  //     tranquille.
  //  ✅ CEUX-LÀ FUIENT. Raikou, Entei et Suicune se libèrent à la Tour
  //     Calcinée et courent ensuite dans TOUT Johto : ils apparaissent au
  //     hasard sur un nœud d'herbe, et ils s'en vont — le combat dure ce qu'il
  //     dure, pas ce qu'on veut. Les rattraper demande de préparer une Ball et
  //     un endormissement AVANT de les croiser, pas après.
  //  ⚠️ `chance` est la probabilité, par nœud d'herbe traversé, qu'un errant
  //     encore libre se montre. `tours` est ce qu'on a pour l'attraper.
  //     Les deux se calibrent à la mesure — `tools/poke-gen2-errants.mjs` —
  //     et pas à l'impression.
  // ═══════════════════════════════════════════════════════════════════════════
  var ERRANTS = {
    depuis: "tour-calcinee",
    chance: 0.06,
    tours: 3,
    // Raikou, Entei, Suicune. Leur niveau est celui du canon : 40.
    liste: [{ n: 243, niveau: 40 }, { n: 244, niveau: 40 }, { n: 245, niveau: 40 }],
  };

  function etapeDe(id) {
    for (var i = 0; i < ETAPES.length; i++) if (ETAPES[i].id === id) return ETAPES[i];
    return null;
  }

  // 🔴 UNE CS NE S'EMPLOIE PAS SANS SON BADGE — même règle qu'à Kanto, autres
  //    numéros. L'infobulle du badge lisait la table de 1996 : sous Johto elle
  //    annonçait que le badge Zéphyr ouvre Flash (juste, par hasard) et que le
  //    badge Marais ouvre Surf (faux — c'est le badge Brume). Un écran qui dit
  //    presque vrai coûte plus cher qu'un écran muet.
  W.POKE_GEN2_BADGE_POUR_CS = { flash: 1, coupe: 2, force: 3, surf: 4, chute: 8 };
  W.POKE_GEN2_CLES = CLES;
  W.POKE_GEN2_ETAPES = ETAPES;
  W.POKE_GEN2_ERRANTS = ERRANTS;
  W.pokeGen2EtapeDe = etapeDe;
})(typeof window !== "undefined" ? window : globalThis);
