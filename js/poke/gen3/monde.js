// ═══════════════════════════════════════════════════════════════════════
//  LES LIEUX, ZONES DE RENCONTRE ET TABLES DE PÊCHE D'HOENN (ÉMERAUDE)
// ═══════════════════════════════════════════════════════════════════════
(function (W) {
  "use strict";

  // Les lieux d'Hoenn, avec leurs noms officiels bilingues { fr, en }.
  W.POKE_GEN3_LIEUX = {
    // Villes et villages
    "littleroot-town": { fr: "Bourg-en-Vol", en: "Littleroot Town" },
    "oldale-town": { fr: "Rosyères", en: "Oldale Town" },
    "petalburg-city": { fr: "Clémenti-Ville", en: "Petalburg City" },
    "rustboro-city": { fr: "Mérouville", en: "Rustboro City" },
    "dewford-town": { fr: "Myokara", en: "Dewford Town" },
    "slateport-city": { fr: "Poivressel", en: "Slateport City" },
    "mauville-city": { fr: "Lavandia", en: "Mauville City" },
    "verdanturf-town": { fr: "Vergazon", en: "Verdanturf Town" },
    "fallarbor-town": { fr: "Autéquia", en: "Fallarbor Town" },
    "lavaridge-town": { fr: "Vermilava", en: "Lavaridge Town" },
    "fortree-city": { fr: "Cimetronelle", en: "Fortree City" },
    "lilycove-city": { fr: "Nénucrique", en: "Lilycove City" },
    "mossdeep-city": { fr: "Algatia", en: "Mossdeep City" },
    "sootopolis-city": { fr: "Atalanopolis", en: "Sootopolis City" },
    "pacifidlog-town": { fr: "Pacifiville", en: "Pacifidlog Town" },
    "ever-grande-city": { fr: "Éternara", en: "Ever Grande City" },

    // Routes terrestres (101 à 123)
    "route-101": { fr: "Route 101", en: "Route 101" },
    "route-102": { fr: "Route 102", en: "Route 102" },
    "route-103": { fr: "Route 103", en: "Route 103" },
    "route-104": { fr: "Route 104", en: "Route 104" },
    "route-105": { fr: "Route 105", en: "Route 105" },
    "route-106": { fr: "Route 106", en: "Route 106" },
    "route-107": { fr: "Route 107", en: "Route 107" },
    "route-108": { fr: "Route 108", en: "Route 108" },
    "route-109": { fr: "Route 109", en: "Route 109" },
    "route-110": { fr: "Route 110", en: "Route 110" },
    "route-111": { fr: "Route 111", en: "Route 111" },
    "route-112": { fr: "Route 112", en: "Route 112" },
    "route-113": { fr: "Route 113", en: "Route 113" },
    "route-114": { fr: "Route 114", en: "Route 114" },
    "route-115": { fr: "Route 115", en: "Route 115" },
    "route-116": { fr: "Route 116", en: "Route 116" },
    "route-117": { fr: "Route 117", en: "Route 117" },
    "route-118": { fr: "Route 118", en: "Route 118" },
    "route-119": { fr: "Route 119", en: "Route 119" },
    "route-120": { fr: "Route 120", en: "Route 120" },
    "route-121": { fr: "Route 121", en: "Route 121" },
    "route-122": { fr: "Route 122", en: "Route 122" },
    "route-123": { fr: "Route 123", en: "Route 123" },

    // Chenaux maritimes (124 à 134)
    "route-124": { fr: "Chenal 124", en: "Route 124" },
    "route-125": { fr: "Chenal 125", en: "Route 125" },
    "route-126": { fr: "Chenal 126", en: "Route 126" },
    "route-127": { fr: "Chenal 127", en: "Route 127" },
    "route-128": { fr: "Chenal 128", en: "Route 128" },
    "route-129": { fr: "Chenal 129", en: "Route 129" },
    "route-130": { fr: "Chenal 130", en: "Route 130" },
    "route-131": { fr: "Chenal 131", en: "Route 131" },
    "route-132": { fr: "Chenal 132", en: "Route 132" },
    "route-133": { fr: "Chenal 133", en: "Route 133" },
    "route-134": { fr: "Chenal 134", en: "Route 134" },

    // Donjons, grottes et sites remarquables
    "petalburg-woods": { fr: "Bois Clémenti", en: "Petalburg Woods" },
    "rusturf-tunnel": { fr: "Tunnel Mérouvergne", en: "Rusturf Tunnel" },
    "granite-cave": { fr: "Grotte Granite", en: "Granite Cave" },
    "fiery-path": { fr: "Chemin Ardent", en: "Fiery Path" },
    "jagged-pass": { fr: "Sentier Sinuroc", en: "Jagged Pass" },
    "mt-chimney": { fr: "Mont Chimère", en: "Mt. Chimney" },
    "meteor-falls": { fr: "Site Météore", en: "Meteor Falls" },
    "route-111-desert": { fr: "Désert", en: "Desert" },
    "weather-institute": { fr: "Centre Météo", en: "Weather Institute" },
    "mt-pyre": { fr: "Mont Mémoria", en: "Mt. Pyre" },
    "magma-hideout": { fr: "Repaire Magma", en: "Magma Hideout" },
    "aqua-hideout": { fr: "Repaire Aqua", en: "Aqua Hideout" },
    "safari-zone": { fr: "Parc Safari", en: "Safari Zone" },
    "shoal-cave": { fr: "Grotte Tréfonds", en: "Shoal Cave" },
    "seafloor-cavern": { fr: "Caverne Fondmer", en: "Seafloor Cavern" },
    "cave-of-origin": { fr: "Grotte Origine", en: "Cave of Origin" },
    "sky-pillar": { fr: "Pilier Céleste", en: "Sky Pillar" },
    "victory-road": { fr: "Route Victoire", en: "Victory Road" },
    "sealed-chamber": { fr: "Chambre Scellée", en: "Sealed Chamber" },
    "desert-ruins": { fr: "Ruines du Désert", en: "Desert Ruins" },
    "island-cave": { fr: "Grotte de l'Îlot", en: "Island Cave" },
    "ancient-tomb": { fr: "Tombeau Antique", en: "Ancient Tomb" },
    "terra-cave": { fr: "Grotte Terra", en: "Terra Cave" },
    "marine-cave": { fr: "Grotte Marine", en: "Marine Cave" },
    "birth-island": { fr: "Île Aurore", en: "Birth Island" },
    "mossdeep-space-center": { fr: "Centre Spatial", en: "Mossdeep Space Center" },
    "abandoned-ship": { fr: "Épave", en: "Abandoned Ship" },
    "new-mauville": { fr: "New Lavandia", en: "New Mauville" },
    "scorched-slab": { fr: "Grotte Zénith", en: "Scorched Slab" },
    "artisan-cave": { fr: "Grotte Atelier", en: "Artisan Cave" },
    "desert-underpass": { fr: "Grotte du Désert", en: "Desert Underpass" },
    "battle-frontier": { fr: "Zone de Combat", en: "Battle Frontier" },
    "southern-island": { fr: "Île du Sud", en: "Southern Island" },
    "faraway-island": { fr: "Île Lointaine", en: "Faraway Island" },
    "navel-rock": { fr: "Roc Nombrile", en: "Navel Rock" },
    "pokemon-league": { fr: "Ligue Pokémon", en: "Pokémon League" }
  };

  // Les zones de rencontre d'Hoenn selon la distribution canon d'Émeraude.
  // Chaque zone possède :
  //   id    : identifiant canonique
  //   lieu  : clé dans W.POKE_GEN3_LIEUX
  //   taux  : fréquence de rencontre
  //   herbe : { taux, emeraude: [{ n, niveau, poids }] } ou null
  //   eau   : { taux, emeraude: [{ n, niveau, poids }] } ou null
  W.POKE_GEN3_ZONES = [
    {
      id: "ROUTE_101",
      lieu: "route-101",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 263, niveau: 2, poids: 25 },
          { n: 263, niveau: 3, poids: 20 },
          { n: 265, niveau: 2, poids: 25 },
          { n: 265, niveau: 3, poids: 20 },
          { n: 261, niveau: 2, poids: 5 },
          { n: 261, niveau: 3, poids: 5 }
        ]
      },
      eau: null
    },
    {
      id: "ROUTE_102",
      lieu: "route-102",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 263, niveau: 3, poids: 15 },
          { n: 263, niveau: 4, poids: 15 },
          { n: 265, niveau: 3, poids: 15 },
          { n: 265, niveau: 4, poids: 15 },
          { n: 261, niveau: 3, poids: 10 },
          { n: 261, niveau: 4, poids: 10 },
          { n: 270, niveau: 3, poids: 8 },
          { n: 270, niveau: 4, poids: 7 },
          { n: 273, niveau: 3, poids: 6 },
          { n: 273, niveau: 4, poids: 5 },
          { n: 280, niveau: 4, poids: 4 }
        ]
      },
      eau: {
        taux: 2,
        emeraude: [
          { n: 183, niveau: 15, poids: 9 },
          { n: 118, niveau: 15, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_103",
      lieu: "route-103",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 261, niveau: 2, poids: 20 },
          { n: 261, niveau: 3, poids: 20 },
          { n: 263, niveau: 2, poids: 20 },
          { n: 263, niveau: 4, poids: 20 },
          { n: 278, niveau: 2, poids: 10 },
          { n: 278, niveau: 4, poids: 10 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 72, niveau: 15, poids: 6 },
          { n: 278, niveau: 15, poids: 3 },
          { n: 279, niveau: 25, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_104",
      lieu: "route-104",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 265, niveau: 4, poids: 25 },
          { n: 276, niveau: 4, poids: 25 },
          { n: 183, niveau: 4, poids: 20 },
          { n: 183, niveau: 5, poids: 10 },
          { n: 278, niveau: 4, poids: 20 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 278, niveau: 15, poids: 6 },
          { n: 279, niveau: 25, poids: 3 },
          { n: 72, niveau: 15, poids: 1 }
        ]
      }
    },
    {
      id: "PETALBURG_WOODS",
      lieu: "petalburg-woods",
      taux: 8,
      herbe: {
        taux: 8,
        emeraude: [
          { n: 265, niveau: 5, poids: 25 },
          { n: 266, niveau: 5, poids: 15 },
          { n: 268, niveau: 5, poids: 15 },
          { n: 276, niveau: 5, poids: 15 },
          { n: 285, niveau: 5, poids: 20 },
          { n: 285, niveau: 6, poids: 5 },
          { n: 287, niveau: 5, poids: 5 }
        ]
      },
      eau: null
    },
    {
      id: "ROUTE_116",
      lieu: "route-116",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 261, niveau: 6, poids: 15 },
          { n: 261, niveau: 7, poids: 15 },
          { n: 276, niveau: 6, poids: 15 },
          { n: 276, niveau: 7, poids: 15 },
          { n: 290, niveau: 6, poids: 10 },
          { n: 290, niveau: 7, poids: 10 },
          { n: 293, niveau: 6, poids: 10 },
          { n: 293, niveau: 7, poids: 10 },
          { n: 300, niveau: 7, poids: 5 },
          { n: 300, niveau: 8, poids: 5 }
        ]
      },
      eau: null
    },
    {
      id: "RUSTURF_TUNNEL",
      lieu: "rusturf-tunnel",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 293, niveau: 6, poids: 50 },
          { n: 293, niveau: 7, poids: 30 },
          { n: 293, niveau: 8, poids: 20 }
        ]
      },
      eau: null
    },
    {
      id: "GRANITE_CAVE_1F",
      lieu: "granite-cave",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 41, niveau: 8, poids: 20 },
          { n: 41, niveau: 9, poids: 20 },
          { n: 74, niveau: 8, poids: 20 },
          { n: 74, niveau: 9, poids: 15 },
          { n: 296, niveau: 8, poids: 15 },
          { n: 63, niveau: 9, poids: 10 }
        ]
      },
      eau: null
    },
    {
      id: "GRANITE_CAVE_B1F",
      lieu: "granite-cave",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 41, niveau: 9, poids: 30 },
          { n: 296, niveau: 9, poids: 30 },
          { n: 304, niveau: 10, poids: 25 },
          { n: 302, niveau: 10, poids: 15 }
        ]
      },
      eau: null
    },
    {
      id: "GRANITE_CAVE_B2F",
      lieu: "granite-cave",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 41, niveau: 10, poids: 30 },
          { n: 304, niveau: 10, poids: 25 },
          { n: 296, niveau: 10, poids: 20 },
          { n: 302, niveau: 11, poids: 15 },
          { n: 299, niveau: 11, poids: 10 }
        ]
      },
      eau: null
    },
    {
      id: "ROUTE_105",
      lieu: "route-105",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 20, poids: 6 },
          { n: 278, niveau: 20, poids: 3 },
          { n: 279, niveau: 30, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_106",
      lieu: "route-106",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 20, poids: 6 },
          { n: 278, niveau: 20, poids: 3 },
          { n: 279, niveau: 30, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_107",
      lieu: "route-107",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 20, poids: 6 },
          { n: 278, niveau: 20, poids: 3 },
          { n: 279, niveau: 30, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_108",
      lieu: "route-108",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 20, poids: 6 },
          { n: 278, niveau: 20, poids: 3 },
          { n: 279, niveau: 30, poids: 1 }
        ]
      }
    },
    {
      id: "ABANDONED_SHIP",
      lieu: "abandoned-ship",
      taux: 4,
      herbe: null,
      eau: {
        taux: 4,
        emeraude: [
          { n: 72, niveau: 25, poids: 6 },
          { n: 73, niveau: 30, poids: 3 },
          { n: 129, niveau: 15, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_109",
      lieu: "route-109",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 20, poids: 6 },
          { n: 278, niveau: 20, poids: 3 },
          { n: 279, niveau: 30, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_110",
      lieu: "route-110",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 309, niveau: 12, poids: 15 },
          { n: 309, niveau: 13, poids: 15 },
          { n: 316, niveau: 12, poids: 15 },
          { n: 316, niveau: 13, poids: 10 },
          { n: 261, niveau: 12, poids: 15 },
          { n: 311, niveau: 12, poids: 10 },
          { n: 312, niveau: 12, poids: 10 },
          { n: 43, niveau: 12, poids: 5 },
          { n: 278, niveau: 12, poids: 5 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 72, niveau: 20, poids: 6 },
          { n: 278, niveau: 20, poids: 3 },
          { n: 279, niveau: 25, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_117",
      lieu: "route-117",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 309, niveau: 13, poids: 15 },
          { n: 309, niveau: 14, poids: 15 },
          { n: 315, niveau: 13, poids: 10 },
          { n: 315, niveau: 14, poids: 10 },
          { n: 183, niveau: 13, poids: 10 },
          { n: 183, niveau: 14, poids: 10 },
          { n: 261, niveau: 13, poids: 10 },
          { n: 43, niveau: 13, poids: 10 },
          { n: 313, niveau: 13, poids: 5 },
          { n: 314, niveau: 13, poids: 5 }
        ]
      },
      eau: {
        taux: 2,
        emeraude: [
          { n: 183, niveau: 20, poids: 9 },
          { n: 118, niveau: 20, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_111",
      lieu: "route-111",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 27, niveau: 19, poids: 15 },
          { n: 27, niveau: 20, poids: 15 },
          { n: 328, niveau: 19, poids: 15 },
          { n: 328, niveau: 21, poids: 15 },
          { n: 343, niveau: 19, poids: 15 },
          { n: 343, niveau: 21, poids: 10 },
          { n: 331, niveau: 20, poids: 15 }
        ]
      },
      eau: {
        taux: 2,
        emeraude: [
          { n: 183, niveau: 20, poids: 9 },
          { n: 118, niveau: 20, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_111_DESERT",
      lieu: "route-111-desert",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 328, niveau: 20, poids: 20 },
          { n: 328, niveau: 22, poids: 15 },
          { n: 343, niveau: 20, poids: 15 },
          { n: 343, niveau: 22, poids: 15 },
          { n: 331, niveau: 20, poids: 10 },
          { n: 331, niveau: 22, poids: 10 },
          { n: 27, niveau: 20, poids: 15 }
        ]
      },
      eau: null
    },
    {
      id: "ROUTE_112",
      lieu: "route-112",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 322, niveau: 14, poids: 30 },
          { n: 322, niveau: 15, poids: 25 },
          { n: 183, niveau: 14, poids: 25 },
          { n: 183, niveau: 15, poids: 20 }
        ]
      },
      eau: null
    },
    {
      id: "FIERY_PATH",
      lieu: "fiery-path",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 322, niveau: 15, poids: 30 },
          { n: 324, niveau: 15, poids: 20 },
          { n: 66, niveau: 15, poids: 20 },
          { n: 88, niveau: 15, poids: 15 },
          { n: 109, niveau: 15, poids: 10 },
          { n: 218, niveau: 15, poids: 5 }
        ]
      },
      eau: null
    },
    {
      id: "JAGGED_PASS",
      lieu: "jagged-pass",
      taux: 8,
      herbe: {
        taux: 8,
        emeraude: [
          { n: 66, niveau: 19, poids: 20 },
          { n: 66, niveau: 20, poids: 20 },
          { n: 322, niveau: 19, poids: 20 },
          { n: 322, niveau: 20, poids: 15 },
          { n: 325, niveau: 19, poids: 15 },
          { n: 325, niveau: 20, poids: 10 }
        ]
      },
      eau: null
    },
    {
      id: "MT_CHIMNEY",
      lieu: "mt-chimney",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 41, niveau: 16, poids: 40 },
          { n: 41, niveau: 18, poids: 40 },
          { n: 322, niveau: 16, poids: 20 }
        ]
      },
      eau: null
    },
    {
      id: "ROUTE_113",
      lieu: "route-113",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 327, niveau: 14, poids: 35 },
          { n: 327, niveau: 15, poids: 35 },
          { n: 27, niveau: 14, poids: 15 },
          { n: 27, niveau: 15, poids: 10 },
          { n: 227, niveau: 16, poids: 5 }
        ]
      },
      eau: null
    },
    {
      id: "ROUTE_114",
      lieu: "route-114",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 333, niveau: 16, poids: 20 },
          { n: 333, niveau: 17, poids: 20 },
          { n: 271, niveau: 16, poids: 20 },
          { n: 274, niveau: 16, poids: 20 },
          { n: 336, niveau: 17, poids: 10 },
          { n: 335, niveau: 17, poids: 10 }
        ]
      },
      eau: {
        taux: 2,
        emeraude: [
          { n: 183, niveau: 20, poids: 7 },
          { n: 283, niveau: 15, poids: 2 },
          { n: 284, niveau: 25, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_115",
      lieu: "route-115",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 333, niveau: 23, poids: 20 },
          { n: 333, niveau: 25, poids: 15 },
          { n: 276, niveau: 23, poids: 25 },
          { n: 277, niveau: 25, poids: 15 },
          { n: 278, niveau: 23, poids: 15 },
          { n: 39, niveau: 24, poids: 10 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 72, niveau: 20, poids: 6 },
          { n: 278, niveau: 20, poids: 3 },
          { n: 279, niveau: 25, poids: 1 }
        ]
      }
    },
    {
      id: "METEOR_FALLS_1F",
      lieu: "meteor-falls",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 41, niveau: 16, poids: 20 },
          { n: 41, niveau: 18, poids: 20 },
          { n: 42, niveau: 28, poids: 20 },
          { n: 338, niveau: 16, poids: 20 },
          { n: 337, niveau: 16, poids: 20 }
        ]
      },
      eau: {
        taux: 2,
        emeraude: [
          { n: 41, niveau: 20, poids: 5 },
          { n: 338, niveau: 25, poids: 5 }
        ]
      }
    },
    {
      id: "METEOR_FALLS_B1F",
      lieu: "meteor-falls",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 42, niveau: 30, poids: 20 },
          { n: 42, niveau: 35, poids: 20 },
          { n: 338, niveau: 30, poids: 15 },
          { n: 338, niveau: 35, poids: 15 },
          { n: 371, niveau: 25, poids: 10 },
          { n: 371, niveau: 30, poids: 10 },
          { n: 41, niveau: 25, poids: 10 }
        ]
      },
      eau: {
        taux: 2,
        emeraude: [
          { n: 42, niveau: 30, poids: 9 },
          { n: 371, niveau: 30, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_118",
      lieu: "route-118",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 309, niveau: 24, poids: 15 },
          { n: 309, niveau: 26, poids: 15 },
          { n: 310, niveau: 26, poids: 10 },
          { n: 264, niveau: 25, poids: 15 },
          { n: 264, niveau: 26, poids: 10 },
          { n: 263, niveau: 24, poids: 20 },
          { n: 278, niveau: 24, poids: 10 },
          { n: 352, niveau: 25, poids: 5 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 72, niveau: 25, poids: 6 },
          { n: 278, niveau: 25, poids: 3 },
          { n: 279, niveau: 30, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_119",
      lieu: "route-119",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 264, niveau: 25, poids: 15 },
          { n: 264, niveau: 27, poids: 15 },
          { n: 263, niveau: 24, poids: 20 },
          { n: 43, niveau: 25, poids: 20 },
          { n: 44, niveau: 27, poids: 10 },
          { n: 357, niveau: 25, poids: 15 },
          { n: 352, niveau: 25, poids: 5 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 72, niveau: 25, poids: 5 },
          { n: 278, niveau: 25, poids: 3 },
          { n: 183, niveau: 25, poids: 2 }
        ]
      }
    },
    {
      id: "ROUTE_120",
      lieu: "route-120",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 262, niveau: 25, poids: 15 },
          { n: 262, niveau: 27, poids: 10 },
          { n: 261, niveau: 24, poids: 20 },
          { n: 43, niveau: 25, poids: 15 },
          { n: 44, niveau: 27, poids: 15 },
          { n: 183, niveau: 25, poids: 10 },
          { n: 359, niveau: 25, poids: 10 },
          { n: 352, niveau: 25, poids: 5 }
        ]
      },
      eau: {
        taux: 2,
        emeraude: [
          { n: 183, niveau: 25, poids: 6 },
          { n: 184, niveau: 30, poids: 2 },
          { n: 283, niveau: 20, poids: 1 },
          { n: 284, niveau: 30, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_121",
      lieu: "route-121",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 353, niveau: 26, poids: 15 },
          { n: 353, niveau: 28, poids: 15 },
          { n: 355, niveau: 26, poids: 10 },
          { n: 355, niveau: 28, poids: 10 },
          { n: 262, niveau: 26, poids: 20 },
          { n: 261, niveau: 25, poids: 15 },
          { n: 44, niveau: 27, poids: 10 },
          { n: 352, niveau: 26, poids: 5 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 72, niveau: 25, poids: 6 },
          { n: 278, niveau: 25, poids: 3 },
          { n: 279, niveau: 30, poids: 1 }
        ]
      }
    },
    {
      id: "MT_PYRE_INTERIEUR",
      lieu: "mt-pyre",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 353, niveau: 26, poids: 30 },
          { n: 353, niveau: 28, poids: 30 },
          { n: 355, niveau: 26, poids: 20 },
          { n: 355, niveau: 28, poids: 20 }
        ]
      },
      eau: null
    },
    {
      id: "MT_PYRE_EXTERIEUR",
      lieu: "mt-pyre",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 353, niveau: 28, poids: 20 },
          { n: 353, niveau: 30, poids: 15 },
          { n: 355, niveau: 28, poids: 15 },
          { n: 355, niveau: 30, poids: 15 },
          { n: 307, niveau: 28, poids: 20 },
          { n: 37, niveau: 28, poids: 10 },
          { n: 358, niveau: 28, poids: 5 }
        ]
      },
      eau: null
    },
    {
      id: "ROUTE_123",
      lieu: "route-123",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 353, niveau: 27, poids: 15 },
          { n: 353, niveau: 29, poids: 10 },
          { n: 355, niveau: 27, poids: 15 },
          { n: 355, niveau: 29, poids: 10 },
          { n: 262, niveau: 27, poids: 20 },
          { n: 333, niveau: 27, poids: 15 },
          { n: 44, niveau: 28, poids: 10 },
          { n: 278, niveau: 27, poids: 5 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 72, niveau: 25, poids: 6 },
          { n: 278, niveau: 25, poids: 3 },
          { n: 279, niveau: 30, poids: 1 }
        ]
      }
    },
    {
      id: "MAGMA_HIDEOUT",
      lieu: "magma-hideout",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 74, niveau: 28, poids: 20 },
          { n: 74, niveau: 30, poids: 20 },
          { n: 75, niveau: 30, poids: 20 },
          { n: 75, niveau: 32, poids: 15 },
          { n: 324, niveau: 30, poids: 25 }
        ]
      },
      eau: null
    },
    {
      id: "AQUA_HIDEOUT",
      lieu: "aqua-hideout",
      taux: 4,
      herbe: null,
      eau: {
        taux: 4,
        emeraude: [
          { n: 72, niveau: 30, poids: 6 },
          { n: 41, niveau: 30, poids: 3 },
          { n: 42, niveau: 35, poids: 1 }
        ]
      }
    },
    {
      id: "SAFARI_ZONE",
      lieu: "safari-zone",
      taux: 10,
      herbe: {
        taux: 10,
        emeraude: [
          { n: 84, niveau: 27, poids: 15 },
          { n: 25, niveau: 27, poids: 10 },
          { n: 44, niveau: 27, poids: 10 },
          { n: 177, niveau: 27, poids: 10 },
          { n: 178, niveau: 30, poids: 5 },
          { n: 203, niveau: 27, poids: 10 },
          { n: 202, niveau: 27, poids: 10 },
          { n: 231, niveau: 27, poids: 10 },
          { n: 214, niveau: 27, poids: 5 },
          { n: 127, niveau: 27, poids: 5 },
          { n: 111, niveau: 27, poids: 5 },
          { n: 228, niveau: 28, poids: 5 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 54, niveau: 25, poids: 4 },
          { n: 55, niveau: 32, poids: 2 },
          { n: 183, niveau: 25, poids: 2 },
          { n: 194, niveau: 25, poids: 1 },
          { n: 195, niveau: 32, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_124",
      lieu: "route-124",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 25, poids: 6 },
          { n: 278, niveau: 25, poids: 3 },
          { n: 279, niveau: 32, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_125",
      lieu: "route-125",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 25, poids: 6 },
          { n: 278, niveau: 25, poids: 3 },
          { n: 279, niveau: 32, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_126",
      lieu: "route-126",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 25, poids: 6 },
          { n: 278, niveau: 25, poids: 3 },
          { n: 279, niveau: 32, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_127",
      lieu: "route-127",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 25, poids: 6 },
          { n: 278, niveau: 25, poids: 3 },
          { n: 279, niveau: 32, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_128",
      lieu: "route-128",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 25, poids: 6 },
          { n: 278, niveau: 25, poids: 3 },
          { n: 279, niveau: 32, poids: 1 }
        ]
      }
    },
    {
      id: "SHOAL_CAVE_HAUTE",
      lieu: "shoal-cave",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 363, niveau: 26, poids: 25 },
          { n: 363, niveau: 30, poids: 25 },
          { n: 41, niveau: 26, poids: 20 },
          { n: 41, niveau: 28, poids: 15 },
          { n: 42, niveau: 32, poids: 15 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 363, niveau: 30, poids: 6 },
          { n: 72, niveau: 25, poids: 3 },
          { n: 73, niveau: 35, poids: 1 }
        ]
      }
    },
    {
      id: "SHOAL_CAVE_BASSE",
      lieu: "shoal-cave",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 363, niveau: 28, poids: 25 },
          { n: 363, niveau: 32, poids: 20 },
          { n: 41, niveau: 28, poids: 15 },
          { n: 41, niveau: 30, poids: 15 },
          { n: 361, niveau: 28, poids: 10 },
          { n: 361, niveau: 32, poids: 5 },
          { n: 42, niveau: 32, poids: 10 }
        ]
      },
      eau: null
    },
    {
      id: "ROUTE_129",
      lieu: "route-129",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 30, poids: 6 },
          { n: 278, niveau: 30, poids: 2 },
          { n: 279, niveau: 35, poids: 1 },
          { n: 321, niveau: 35, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_130",
      lieu: "route-130",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 30, poids: 6 },
          { n: 278, niveau: 30, poids: 3 },
          { n: 279, niveau: 35, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_131",
      lieu: "route-131",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 30, poids: 6 },
          { n: 278, niveau: 30, poids: 3 },
          { n: 279, niveau: 35, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_132",
      lieu: "route-132",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 30, poids: 6 },
          { n: 278, niveau: 30, poids: 3 },
          { n: 279, niveau: 35, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_133",
      lieu: "route-133",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 30, poids: 6 },
          { n: 278, niveau: 30, poids: 3 },
          { n: 279, niveau: 35, poids: 1 }
        ]
      }
    },
    {
      id: "ROUTE_134",
      lieu: "route-134",
      taux: 0,
      herbe: null,
      eau: {
        taux: 6,
        emeraude: [
          { n: 72, niveau: 30, poids: 6 },
          { n: 278, niveau: 30, poids: 3 },
          { n: 279, niveau: 35, poids: 1 }
        ]
      }
    },
    {
      id: "SEAFLOOR_CAVERN",
      lieu: "seafloor-cavern",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 41, niveau: 30, poids: 20 },
          { n: 41, niveau: 32, poids: 20 },
          { n: 42, niveau: 34, poids: 15 },
          { n: 42, niveau: 36, poids: 15 },
          { n: 75, niveau: 32, poids: 15 },
          { n: 75, niveau: 35, poids: 15 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 72, niveau: 30, poids: 6 },
          { n: 41, niveau: 30, poids: 3 },
          { n: 42, niveau: 35, poids: 1 }
        ]
      }
    },
    {
      id: "CAVE_OF_ORIGIN",
      lieu: "cave-of-origin",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 41, niveau: 30, poids: 25 },
          { n: 41, niveau: 32, poids: 20 },
          { n: 42, niveau: 34, poids: 25 },
          { n: 302, niveau: 32, poids: 15 },
          { n: 303, niveau: 32, poids: 15 }
        ]
      },
      eau: null
    },
    {
      id: "SKY_PILLAR",
      lieu: "sky-pillar",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 344, niveau: 36, poids: 25 },
          { n: 42, niveau: 36, poids: 25 },
          { n: 302, niveau: 36, poids: 15 },
          { n: 354, niveau: 36, poids: 15 },
          { n: 356, niveau: 38, poids: 10 },
          { n: 334, niveau: 38, poids: 10 }
        ]
      },
      eau: null
    },
    {
      id: "VICTORY_ROAD_1F",
      lieu: "victory-road",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 297, niveau: 38, poids: 25 },
          { n: 305, niveau: 38, poids: 25 },
          { n: 42, niveau: 38, poids: 20 },
          { n: 294, niveau: 38, poids: 15 },
          { n: 308, niveau: 38, poids: 15 }
        ]
      },
      eau: null
    },
    {
      id: "VICTORY_ROAD_B1F",
      lieu: "victory-road",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 297, niveau: 40, poids: 25 },
          { n: 305, niveau: 40, poids: 25 },
          { n: 42, niveau: 40, poids: 20 },
          { n: 308, niveau: 40, poids: 15 },
          { n: 303, niveau: 40, poids: 15 }
        ]
      },
      eau: null
    },
    {
      id: "VICTORY_ROAD_B2F",
      lieu: "victory-road",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 297, niveau: 42, poids: 25 },
          { n: 305, niveau: 42, poids: 25 },
          { n: 42, niveau: 42, poids: 20 },
          { n: 308, niveau: 42, poids: 15 },
          { n: 302, niveau: 42, poids: 15 }
        ]
      },
      eau: {
        taux: 4,
        emeraude: [
          { n: 42, niveau: 40, poids: 9 },
          { n: 119, niveau: 40, poids: 1 }
        ]
      }
    },
    {
      id: "NEW_MAUVILLE",
      lieu: "new-mauville",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 100, niveau: 23, poids: 25 },
          { n: 100, niveau: 25, poids: 20 },
          { n: 81, niveau: 23, poids: 25 },
          { n: 81, niveau: 25, poids: 20 },
          { n: 82, niveau: 26, poids: 5 },
          { n: 101, niveau: 26, poids: 5 }
        ]
      },
      eau: null
    },
    {
      id: "DESERT_UNDERPASS",
      lieu: "desert-underpass",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 293, niveau: 38, poids: 40 },
          { n: 294, niveau: 40, poids: 35 },
          { n: 132, niveau: 40, poids: 25 }
        ]
      },
      eau: null
    },
    {
      id: "ARTISAN_CAVE",
      lieu: "artisan-cave",
      taux: 6,
      herbe: {
        taux: 6,
        emeraude: [
          { n: 235, niveau: 45, poids: 100 }
        ]
      },
      eau: null
    }
  ];

  // Les tables de pêche d'Hoenn.
  //   canne : Canne (Old Rod)
  //   bonne : Super Canne (Good Rod)
  //   mega  : Méga Canne (Super Rod), par groupe et par carte
  W.POKE_GEN3_PECHE = {
    canne: [
      { n: 129, niveau: 10 }, // Magikarp
      { n: 118, niveau: 10 }, // Goldeen
      { n: 72, niveau: 10 }   // Tentacool
    ],
    bonne: [
      { n: 129, niveau: 20 }, // Magikarp
      { n: 118, niveau: 20 }, // Goldeen
      { n: 72, niveau: 20 },  // Tentacool
      { n: 320, niveau: 20 }, // Wailmer
      { n: 341, niveau: 20 }, // Corphish
      { n: 339, niveau: 20 }  // Barboach
    ],
    mega: {
      groupes: {
        Ocean: [
          { n: 320, niveau: 35 }, // Wailmer
          { n: 319, niveau: 35 }, // Sharpedo
          { n: 73, niveau: 35 },  // Tentacruel
          { n: 130, niveau: 35 }  // Gyarados
        ],
        Shore: [
          { n: 320, niveau: 30 }, // Wailmer
          { n: 73, niveau: 30 },  // Tentacruel
          { n: 319, niveau: 30 }, // Sharpedo
          { n: 129, niveau: 30 }  // Magikarp
        ],
        Pond: [
          { n: 119, niveau: 30 }, // Seaking
          { n: 341, niveau: 30 }, // Corphish
          { n: 342, niveau: 35 }, // Crawdaunt
          { n: 130, niveau: 35 }  // Gyarados
        ],
        River: [
          { n: 119, niveau: 30 }, // Seaking
          { n: 339, niveau: 30 }, // Barboach
          { n: 340, niveau: 35 }, // Whiscash
          { n: 130, niveau: 35 }  // Gyarados
        ],
        Route119: [
          { n: 349, niveau: 25 }, // Feebas (Barpau)
          { n: 318, niveau: 30 }, // Carvanha
          { n: 130, niveau: 30 }  // Gyarados
        ],
        DeepSea: [
          { n: 370, niveau: 35 }, // Luvdisc
          { n: 222, niveau: 35 }, // Corsola
          { n: 366, niveau: 30 }, // Clamperl
          { n: 369, niveau: 35 }, // Relicanth
          { n: 171, niveau: 35 }  // Lanturn
        ],
        MeteorFalls: [
          { n: 339, niveau: 30 }, // Barboach
          { n: 340, niveau: 35 }, // Whiscash
          { n: 119, niveau: 35 }  // Seaking
        ],
        ShoalCave: [
          { n: 320, niveau: 35 }, // Wailmer
          { n: 363, niveau: 30 }, // Spheal
          { n: 319, niveau: 35 }  // Sharpedo
        ],
        Safari: [
          { n: 119, niveau: 35 }, // Seaking
          { n: 130, niveau: 35 }, // Gyarados
          { n: 340, niveau: 35 }  // Whiscash
        ]
      },
      parCarte: {
        LITTLEROOT_TOWN: "Pond",
        OLDALE_TOWN: "Pond",
        PETALBURG_CITY: "Pond",
        RUSTBORO_CITY: "Shore",
        DEWFORD_TOWN: "Shore",
        SLATEPORT_CITY: "Shore",
        MAUVILLE_CITY: "River",
        LILYCOVE_CITY: "Shore",
        MOSSDEEP_CITY: "Ocean",
        SOOTOPOLIS_CITY: "DeepSea",
        PACIFIDLOG_TOWN: "Ocean",
        EVER_GRANDE_CITY: "Ocean",
        ROUTE_102: "Pond",
        ROUTE_103: "Shore",
        ROUTE_104: "Shore",
        ROUTE_105: "Ocean",
        ROUTE_106: "Ocean",
        ROUTE_107: "Ocean",
        ROUTE_108: "Ocean",
        ROUTE_109: "Shore",
        ROUTE_110: "Shore",
        ROUTE_111: "Pond",
        ROUTE_114: "River",
        ROUTE_115: "Shore",
        ROUTE_117: "Pond",
        ROUTE_118: "Shore",
        ROUTE_119: "Route119",
        ROUTE_120: "Pond",
        ROUTE_121: "Shore",
        ROUTE_122: "Shore",
        ROUTE_123: "Pond",
        ROUTE_124: "DeepSea",
        ROUTE_125: "Ocean",
        ROUTE_126: "DeepSea",
        ROUTE_127: "Ocean",
        ROUTE_128: "Ocean",
        ROUTE_129: "Ocean",
        ROUTE_130: "Ocean",
        ROUTE_131: "Ocean",
        ROUTE_132: "Ocean",
        ROUTE_133: "Ocean",
        ROUTE_134: "Ocean",
        METEOR_FALLS: "MeteorFalls",
        SAFARI_ZONE: "Safari",
        SHOAL_CAVE: "ShoalCave",
        SEAFLOOR_CAVERN: "Ocean",
        VICTORY_ROAD: "Pond",
        ABANDONED_SHIP: "Shore"
      }
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
