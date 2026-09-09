(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  HOENN (GEN 3) — LES 25 NATURES CANONIQUES & MODIFICATEURS DE STATISTIQUES
  //  Chaque nature applique +10% sur une stat et -10% sur une autre (5 neutres).
  // ═══════════════════════════════════════════════════════════════════════════

  var NATURES = {
    hardi:   { id: "hardi",   nom: { fr: "Hardi",   en: "Hardy" },   plus: null,  moins: null },
    docile:  { id: "docile",  nom: { fr: "Docile",  en: "Docile" },  plus: null,  moins: null },
    pudique: { id: "pudique", nom: { fr: "Pudique", en: "Bashful" }, plus: null,  moins: null },
    bizarre: { id: "bizarre", nom: { fr: "Bizarre", en: "Quirky" },  plus: null,  moins: null },
    serieux: { id: "serieux", nom: { fr: "Sérieux", en: "Serious" }, plus: null,  moins: null },

    rigide:  { id: "rigide",  nom: { fr: "Rigide",  en: "Adamant" }, plus: "atk", moins: "sat" },
    brave:   { id: "brave",   nom: { fr: "Brave",   en: "Brave" },   plus: "atk", moins: "vit" },
    mauvais: { id: "mauvais", nom: { fr: "Mauvais", en: "Naughty" }, plus: "atk", moins: "sdf" },
    solo:    { id: "solo",    nom: { fr: "Solo",    en: "Lonely" },  plus: "atk", moins: "def" },

    assure:  { id: "assure",  nom: { fr: "Assuré",  en: "Bold" },    plus: "def", moins: "atk" },
    relax:   { id: "relax",   nom: { fr: "Relax",   en: "Relaxed" }, plus: "def", moins: "vit" },
    malin:   { id: "malin",   nom: { fr: "Malin",   en: "Impish" },  plus: "def", moins: "sat" },
    lache:   { id: "lache",   nom: { fr: "Lâche",   en: "Lax" },     plus: "def", moins: "sdf" },

    modeste: { id: "modeste", nom: { fr: "Modeste", en: "Modest" },  plus: "sat", moins: "atk" },
    doux:    { id: "doux",    nom: { fr: "Doux",    en: "Mild" },    plus: "sat", moins: "def" },
    discret: { id: "discret", nom: { fr: "Discret", en: "Quiet" },   plus: "sat", moins: "vit" },
    foufou:  { id: "foufou",  nom: { fr: "Foufou",  en: "Rash" },    plus: "sat", moins: "sdf" },

    calme:   { id: "calme",   nom: { fr: "Calme",   en: "Calm" },    plus: "sdf", moins: "atk" },
    gentil:  { id: "gentil",  nom: { fr: "Gentil",  en: "Gentle" },  plus: "sdf", moins: "def" },
    malpoli: { id: "malpoli", nom: { fr: "Malpoli", en: "Sassy" },   plus: "sdf", moins: "vit" },
    prudent: { id: "prudent", nom: { fr: "Prudent", en: "Careful" }, plus: "sdf", moins: "sat" },

    timide:  { id: "timide",  nom: { fr: "Timide",  en: "Timid" },   plus: "vit", moins: "atk" },
    presse:  { id: "presse",  nom: { fr: "Pressé",  en: "Hasty" },   plus: "vit", moins: "def" },
    jovial:  { id: "jovial",  nom: { fr: "Jovial",  en: "Jolly" },   plus: "vit", moins: "sat" },
    naif:    { id: "naif",    nom: { fr: "Naïf",    en: "Naive" },   plus: "vit", moins: "sdf" }
  };

  var CLES = Object.keys(NATURES);

  function table() {
    return NATURES;
  }

  function cles() {
    return CLES.slice();
  }

  function liste() {
    return CLES.slice();
  }

  function nom(cle, lang) {
    var n = NATURES[cle];
    if (!n) return cle || "";
    var l = lang || "fr";
    return (n.nom && (n.nom[l] || n.nom.fr)) || cle;
  }

  function de(p) {
    return (p && p.nature) ? p.nature : null;
  }

  function tirer(h) {
    if (!h) return null;
    var l = liste();
    if (typeof h.choisir === "function") return h.choisir(l);
    if (typeof h.dans === "function") return h.dans(l);
    if (typeof h.entier === "function") return l[h.entier(l.length)];
    return null;
  }

  W.POKE_GEN3_NATURES = NATURES;
  W.PokeNatures = {
    table: table,
    cles: cles,
    liste: liste,
    nom: nom,
    de: de,
    tirer: tirer,
  };
})(typeof window !== "undefined" ? window : globalThis);
