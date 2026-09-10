(function (W) {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  INTERFACE UTILISATEUR — USINE DE COMBAT (BATTLE FACTORY)
  //
  //  Ce fichier gère l'ensemble des écrans et interactions visuelles de l'Usine :
  //   · Hall d'accueil : affichage du record, PCo, Symboles du Savoir (Argent & Or)
  //   · Draft initial : présentation de 6 Pokémon de prêt N.50, sélection tactique de 3
  //   · Orchestration de Combat : affichage du match, boss Noland (Samson), issue
  //   · Échange d'après-match (Swap) : 2 colonnes (équipe actuelle vs équipe vaincue)
  //   · Fin de série : célébration des 7 victoires, remise des symboles, PCo
  //   · Fin de parcours (défaite) : bilan de série, effacement de session, record
  //   · Boutique PCo : catalogue complet d'objets rares, vitamines, pierres
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Helpers de consultation des règles & données ────────────────────────────
  function ESP() {
    return (W.PokeRegles && W.PokeRegles.especes && W.PokeRegles.especes()) || W.POKE_ESPECE || {};
  }

  function ATT() {
    return (W.PokeRegles && W.PokeRegles.attaques && W.PokeRegles.attaques()) || W.POKE_ATTAQUE_PAR_CLE || W.POKE_ATTAQUES || {};
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function obtenirCible(options) {
    if (!options) options = {};
    if (options.cible) return options.cible;
    if (options.conteneur) return options.conteneur;
    if (typeof W.document !== "undefined") {
      var app = W.document.querySelector("#app") ||
                W.document.querySelector(".pkdx-ecran") ||
                W.document.body;
      return app;
    }
    return null;
  }

  function son(nom) {
    if (typeof W.son === "function") {
      try { W.son(nom); } catch (e) { /* ignore */ }
    }
  }

  function nomEspece(num) {
    if (W.PokeRegles && typeof W.PokeRegles.nomEspece === "function") {
      var n = W.PokeRegles.nomEspece(num);
      if (n) return n;
    }
    var esp = (W.PokeRegles && typeof W.PokeRegles.especeToute === "function")
      ? W.PokeRegles.especeToute(num)
      : null;
    if (!esp) esp = ESP()[num];
    if (esp && esp.nom) {
      return typeof esp.nom === "object" ? (esp.nom.fr || esp.nom.en) : esp.nom;
    }
    return "Pokémon #" + num;
  }

  function spritePokemon(mon) {
    if (mon && mon.sprite) return mon.sprite;
    var num = (mon && (mon.n || mon.espece)) || 0;
    if (W.PokeSprites && typeof W.PokeSprites.art === "function") {
      return W.PokeSprites.art(num);
    }
    if (W.PokeSprites && typeof W.PokeSprites.face === "function") {
      return W.PokeSprites.face(num);
    }
    return "assets/img/poke/art/" + num + ".webp";
  }

  function formatNature(natureCle) {
    if (!natureCle) return "Neutre";
    var cle = String(natureCle).toLowerCase();
    var nat = (W.POKE_GEN3_NATURES && W.POKE_GEN3_NATURES[cle]) || null;
    if (nat && nat.nom) {
      var nom = typeof nat.nom === "object" ? (nat.nom.fr || nat.nom.en) : nat.nom;
      var bonus = "";
      if (nat.plus && nat.moins) {
        bonus = " (+" + nat.plus.toUpperCase() + ", -" + nat.moins.toUpperCase() + ")";
      }
      return nom + bonus + " (" + cle + ")";
    }
    return cle.charAt(0).toUpperCase() + cle.slice(1) + " (" + cle + ")";
  }

  function formatObjet(objetCle) {
    if (!objetCle) return "Aucun";
    var def = (W.POKE_GEN3_OBJETS && W.POKE_GEN3_OBJETS[objetCle]) ||
              (W.POKE_GEN3_OBJETS_TENUS && W.POKE_GEN3_OBJETS_TENUS[objetCle]);
    if (def && def.nom) {
      var nomFr = typeof def.nom === "object" ? (def.nom.fr || def.nom.en) : def.nom;
      return nomFr + " (" + objetCle + ")";
    }
    // Noms courants canoniques de repli
    var replis = {
      LEFTOVERS: "Restes",
      CHOICE_BAND: "Bandeau Choix",
      SCOPE_LENS: "Lentille Scope",
      QUICK_CLAW: "Vive Griffe",
      WHITE_HERB: "Herbe Blanche",
      FOCUS_BAND: "Bandeau",
      BRIGHTPOWDER: "Poudre Claire",
      KINGS_ROCK: "Roche Royale",
      SHELL_BELL: "Grelot Coque",
      MENTAL_HERB: "Herbe Mental",
      CHARCOAL: "Charbon",
      MYSTIC_WATER: "Eau Mystique",
      MAGNET: "Aimant",
      MIRACLE_SEED: "Graine Miracle",
      BLACKGLASSES: "Lunettes Noires",
      SILK_SCARF: "Mouchoir Soie",
      TWISTEDSPOON: "Cuillère Tordue",
      BLACKBELT_I: "Ceinture Noire",
      HARD_STONE: "Pierre Dure",
      METAL_COAT: "Peau Métal",
      POISON_BARB: "Pic Venin",
      SOFT_SAND: "Sable Doux",
      SILVERPOWDER: "Poudre Argentée",
      SPELL_TAG: "Rune Sort",
      NEVERMELTICE: "Glace Éternelle",
      SHARP_BEAK: "Bec Pointu",
      DRAGON_FANG: "Croc Dragon",
      SITRUS_BERRY: "Baie Sitrus",
      LUM_BERRY: "Baie Prun",
      CHESTO_BERRY: "Baie Maron",
      LIECHI_BERRY: "Baie Litchii",
      PETAYA_BERRY: "Baie Pétaya",
      SALAC_BERRY: "Baie Sailac",
      GANLON_BERRY: "Baie Lingan",
      APICOT_BERRY: "Baie Abriko"
    };
    return (replis[objetCle] ? replis[objetCle] + " (" + objetCle + ")" : objetCle);
  }

  function formatTalent(mon) {
    var cle = mon.talent;
    if (!cle && W.PokeCombat && typeof W.PokeCombat.talentDe === "function") {
      cle = W.PokeCombat.talentDe(mon);
    }
    if (!cle && W.PokeGen3Talents && typeof W.PokeGen3Talents.talentDe === "function") {
      cle = W.PokeGen3Talents.talentDe(mon);
    }
    if (!cle) cle = "Inconnu";

    var table = (W.PokeGen3Talents && W.PokeGen3Talents.TALENTS) || W.POKE_GEN3_TALENTS || {};
    var tal = table[cle];
    if (tal && tal.nom) {
      var nom = typeof tal.nom === "object" ? (tal.nom.fr || tal.nom.en) : tal.nom;
      var desc = tal.desc ? (typeof tal.desc === "object" ? (tal.desc.fr || tal.desc.en) : tal.desc) : "";
      return { cle: cle, nom: nom, desc: desc, affichage: nom + " : " + desc };
    }
    return { cle: cle, nom: cle, desc: "", affichage: cle };
  }

  function formatAttaque(att) {
    var cle = typeof att === "string" ? att : (att && att.cle);
    if (!cle) return { cle: "-", nom: "-", type: "NORMAL", puissance: "-", precision: "-" };
    var tableAtt = (W.PokeRegles && W.PokeRegles.attaques && W.PokeRegles.attaques()) || W.POKE_ATTAQUE_PAR_CLE || W.POKE_ATTAQUES || {};
    var def = tableAtt[cle];
    if (!def && W.POKE_GEN3_ATTAQUES) {
      if (Array.isArray(W.POKE_GEN3_ATTAQUES)) {
        for (var i = 0; i < W.POKE_GEN3_ATTAQUES.length; i++) {
          if (W.POKE_GEN3_ATTAQUES[i].cle === cle) { def = W.POKE_GEN3_ATTAQUES[i]; break; }
        }
      } else {
        def = W.POKE_GEN3_ATTAQUES[cle];
      }
    }
    if (!def && W.POKE_ATTAQUE_PAR_CLE) def = W.POKE_ATTAQUE_PAR_CLE[cle];
    if (!def && W.POKE_ATTAQUES && W.POKE_ATTAQUES[cle]) def = W.POKE_ATTAQUES[cle];
    var nom = (def && def.nom) ? (typeof def.nom === "object" ? (def.nom.fr || def.nom.en) : def.nom) : cle;
    var type = (def && def.type) ? def.type : "NORMAL";
    var pui = (def && def.puissance !== undefined && def.puissance !== null) ? (def.puissance || "-") : "-";
    var acc = (def && def.precision !== undefined && def.precision !== null) ? (def.precision || "-") : "-";
    return { cle: cle, nom: nom, type: type, puissance: pui, precision: acc };
  }

  // ── Catalogue Boutique PCo ──────────────────────────────────────────────────
  var CATALOGUE_BOUTIQUE = [
    // Objets de combat compétitifs
    { cle: "LEFTOVERS",    nom: "Restes",         prix: 48, categorie: "Combat", desc: "Restaure 1/16 des PV max à chaque fin de tour." },
    { cle: "CHOICE_BAND",  nom: "Bandeau Choix",  prix: 64, categorie: "Combat", desc: "Augmente l'Attaque de 50% mais bloque sur la première capacité." },
    { cle: "SCOPE_LENS",   nom: "Lentille Scope", prix: 48, categorie: "Combat", desc: "Augmente le taux de coups critiques." },
    { cle: "QUICK_CLAW",   nom: "Vive Griffe",    prix: 24, categorie: "Combat", desc: "Donne une chance d'agir en premier à priorité égale." },
    { cle: "WHITE_HERB",   nom: "Herbe Blanche",  prix: 32, categorie: "Combat", desc: "Restaure immédiatement les statistiques diminuées." },
    { cle: "FOCUS_BAND",   nom: "Bandeau",        prix: 48, categorie: "Combat", desc: "Peut permettre d'éviter le K.O. en conservant 1 PV." },
    { cle: "BRIGHTPOWDER", nom: "Poudre Claire",  prix: 64, categorie: "Combat", desc: "Baisse la précision des attaques adverses de 10%." },
    { cle: "KINGS_ROCK",   nom: "Roche Royale",   prix: 48, categorie: "Combat", desc: "Peut apeurer l'ennemi lors d'une attaque directe." },
    { cle: "SHELL_BELL",   nom: "Grelot Coque",   prix: 48, categorie: "Combat", desc: "Restaure 1/8 des dégâts infligés au défenseur." },
    { cle: "MENTAL_HERB",  nom: "Herbe Mental",   prix: 32, categorie: "Combat", desc: "Dissipe immédiatement l'attirance ou la provocation." },

    // Renforts de type (+10% dégâts)
    { cle: "SILK_SCARF",   nom: "Mouchoir Soie",  prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Normal de 10%." },
    { cle: "CHARCOAL",     nom: "Charbon",        prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Feu de 10%." },
    { cle: "MYSTIC_WATER", nom: "Eau Mystique",   prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Eau de 10%." },
    { cle: "MAGNET",       nom: "Aimant",         prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Électrik de 10%." },
    { cle: "MIRACLE_SEED", nom: "Graine Miracle", prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Plante de 10%." },
    { cle: "HARD_STONE",   nom: "Pierre Dure",    prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Roche de 10%." },
    { cle: "NEVERMELTICE", nom: "Glace Éternelle",prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Glace de 10%." },
    { cle: "BLACKGLASSES", nom: "Lunettes Noires",prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Ténèbres de 10%." },
    { cle: "BLACKBELT_I",  nom: "Ceinture Noire", prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Combat de 10%." },
    { cle: "TWISTEDSPOON", nom: "Cuillère Tordue",prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Psy de 10%." },
    { cle: "SOFT_SAND",    nom: "Sable Doux",     prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Sol de 10%." },
    { cle: "POISON_BARB",  nom: "Pic Venin",      prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Poison de 10%." },
    { cle: "SILVERPOWDER", nom: "Poudre Argentée",prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Insecte de 10%." },
    { cle: "SPELL_TAG",    nom: "Rune Sort",      prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Spectre de 10%." },
    { cle: "SHARP_BEAK",   nom: "Bec Pointu",     prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Vol de 10%." },
    { cle: "DRAGON_FANG",  nom: "Croc Dragon",    prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Dragon de 10%." },
    { cle: "METAL_COAT",   nom: "Peau Métal",     prix: 24, categorie: "Renfort", desc: "Augmente les dégâts des attaques Acier de 10%." },

    // Baies de combat et de crise
    { cle: "SITRUS_BERRY", nom: "Baie Sitrus",    prix: 16, categorie: "Baies", desc: "Restaure 30 PV lorsque la santé descend sous 50% max." },
    { cle: "LUM_BERRY",    nom: "Baie Prun",      prix: 16, categorie: "Baies", desc: "Soigne n'importe quel problème de statut majeur ou la confusion." },
    { cle: "CHESTO_BERRY", nom: "Baie Maron",     prix: 16, categorie: "Baies", desc: "Réveille instantanément le porteur endormi (synergie Repos)." },
    { cle: "LIECHI_BERRY", nom: "Baie Litchii",   prix: 24, categorie: "Baies", desc: "Augmente l'Attaque de 1 cran en situation critique (PV <= 25%)." },
    { cle: "PETAYA_BERRY", nom: "Baie Pétaya",    prix: 24, categorie: "Baies", desc: "Augmente l'Attaque Spéciale de 1 cran en situation critique (PV <= 25%)." },
    { cle: "SALAC_BERRY",  nom: "Baie Sailac",    prix: 24, categorie: "Baies", desc: "Augmente la Vitesse de 1 cran en situation critique (PV <= 25%)." },
    { cle: "GANLON_BERRY", nom: "Baie Lingan",    prix: 24, categorie: "Baies", desc: "Augmente la Défense de 1 cran en situation critique (PV <= 25%)." },
    { cle: "APICOT_BERRY", nom: "Baie Abriko",    prix: 24, categorie: "Baies", desc: "Augmente la Défense Spéciale de 1 cran en situation critique (PV <= 25%)." },

    // Vitamines & Préparation (1 PCo)
    { cle: "ZINC",        nom: "Zinc",           prix: 1,  categorie: "Vitamines", desc: "Augmente la Défense Spéciale de base." },
    { cle: "CALCIUM",     nom: "Calcium",        prix: 1,  categorie: "Vitamines", desc: "Augmente l'Attaque Spéciale de base." },
    { cle: "PROTEIN",     nom: "Protéine",       prix: 1,  categorie: "Vitamines", desc: "Augmente l'Attaque de base." },
    { cle: "IRON",        nom: "Fer",            prix: 1,  categorie: "Vitamines", desc: "Augmente la Défense de base." },
    { cle: "CARBOS",      nom: "Carbos",         prix: 1,  categorie: "Vitamines", desc: "Augmente la Vitesse de base." },
    { cle: "HP_UP",       nom: "PV Plus",        prix: 1,  categorie: "Vitamines", desc: "Augmente les PV de base." },
    { cle: "RARE_CANDY",  nom: "Super Bonbon",   prix: 1,  categorie: "Vitamines", desc: "Fait monter un Pokémon d'un niveau." },

    // Pierres d'évolution (8 PCo)
    { cle: "WATER_STONE",   nom: "Pierre Eau",   prix: 8,  categorie: "Pierres", desc: "Fait évoluer certains Pokémon d'eau." },
    { cle: "FIRE_STONE",    nom: "Pierre Feu",   prix: 8,  categorie: "Pierres", desc: "Fait évoluer certains Pokémon de feu." },
    { cle: "THUNDER_STONE", nom: "Pierre Foudre",prix: 8,  categorie: "Pierres", desc: "Fait évoluer certains Pokémon électriques." },
    { cle: "LEAF_STONE",    nom: "Pierre Plante",prix: 8,  categorie: "Pierres", desc: "Fait évoluer certains Pokémon plante." },
    { cle: "MOON_STONE",    nom: "Pierre Lune",  prix: 8,  categorie: "Pierres", desc: "Fait évoluer certains Pokémon particuliers." },
    { cle: "SUN_STONE",     nom: "Pierre Soleil",prix: 8,  categorie: "Pierres", desc: "Fait évoluer certains Pokémon de jour." }
  ];

  // ── Rendu d'une carte de Pokémon riche ──────────────────────────────────────
  function rendreCartePokemon(mon, index, estSelectionne, typeCamp) {
    var num = (mon && (mon.n || mon.espece)) || 0;
    var esp = (W.PokeRegles && typeof W.PokeRegles.especeToute === "function")
      ? W.PokeRegles.especeToute(num)
      : ((ESP() && ESP()[num]) || null);
    var nom = esp ? (typeof esp.nom === "object" ? (esp.nom.fr || esp.nom.en) : esp.nom) : nomEspece(num);
    var sprite = spritePokemon(mon);
    var natureTexte = formatNature(mon.nature);
    var objetTexte = formatObjet(mon.objet || mon.objetTenu);
    var talentInfo = formatTalent(mon);

    var types = (mon && mon.types) || (esp && esp.types) || ["NORMAL"];
    var typesBadges = types.map(function (t) {
      return '<span class="pk-badge-type pk-type-' + esc(String(t).toLowerCase()) + '">' + esc(t) + '</span>';
    }).join(" ");

    var attaquesHTML = (mon.attaques || []).map(function (att) {
      var inf = formatAttaque(att);
      return '<div class="pk-mon-attaque-ligne">' +
        '<span class="pk-mon-att-nom">' + esc(inf.nom) + '</span> ' +
        '<span class="pk-mon-att-meta">' + esc(inf.type) + ' | Pui: ' + esc(inf.puissance) + ' | Préc: ' + esc(inf.precision) + '</span>' +
        '</div>';
    }).join("");

    var classeCarte = "pk-carte-mon" +
      (estSelectionne ? " est-selectionne" : "") +
      (typeCamp ? " pk-camp-" + typeCamp : "");

    return '<div class="' + classeCarte + '" data-index="' + index + '" data-camp="' + (typeCamp || "") + '">' +
      '<div class="pk-carte-en-tete">' +
        '<img src="' + esc(sprite) + '" alt="' + esc(nom) + '" class="pk-carte-sprite" />' +
        '<div class="pk-carte-identite">' +
          '<div class="pk-carte-nom">' + esc(nom) + ' <span class="pk-carte-niveau">Niveau 50 (N.50)</span></div>' +
          '<div class="pk-carte-types">' + typesBadges + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pk-carte-corps">' +
        '<div class="pk-carte-ligne"><strong>Nature :</strong> ' + esc(natureTexte) + '</div>' +
        '<div class="pk-carte-ligne"><strong>Talent :</strong> ' + esc(talentInfo.nom) + (talentInfo.desc ? ' <small class="pk-talent-desc">(' + esc(talentInfo.desc) + ')</small>' : '') + '</div>' +
        '<div class="pk-carte-ligne"><strong>Objet :</strong> ' + esc(objetTexte) + '</div>' +
        '<div class="pk-carte-attaques-bloc">' +
          '<div class="pk-attaques-titre">Capacités :</div>' +
          attaquesHTML +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. HALL D'ACCUEIL DE L'USINE (ouvrirHall)
  // ═══════════════════════════════════════════════════════════════════════════
  function ouvrirHall(options) {
    options = options || {};
    if (W.PokeRegles && typeof W.PokeRegles.poser === "function") {
      W.PokeRegles.poser("gen3");
    }
    var P = W.PokeProgression;
    var etat = (P && typeof P.usineLire === "function") ? P.usineLire() : {
      pco: 0,
      record: 0,
      symboles: { argent: false, or: false },
      session: null
    };

    var aSessionEnCours = !!(etat.session && etat.session.statut !== "defaite");

    var html = '<div class="pk-usine-container pk-usine-hall">' +
      '<div class="pk-usine-banniere">' +
        '<h1 class="pk-usine-titre">Usine de Combat (Battle Factory)</h1>' +
        '<div class="pk-usine-sous-titre">Meneur de zone : Savant de l\'Usine Samson (Factory Head Noland)</div>' +
      '</div>' +
      '<div class="pk-usine-panneau-stats">' +
        '<div class="pk-stat-boite">' +
          '<span class="pk-stat-label">Points de Combat (PCo) :</span> ' +
          '<span class="pk-stat-valeur pk-pco-val">' + etat.pco + ' PCo</span>' +
        '</div>' +
        '<div class="pk-stat-boite">' +
          '<span class="pk-stat-label">Record consécutif :</span> ' +
          '<span class="pk-stat-valeur pk-record-val">' + etat.record + ' victoires</span>' +
        '</div>' +
        '<div class="pk-stat-boite pk-symboles-boite">' +
          '<span class="pk-stat-label">Symboles du Savoir :</span> ' +
          '<span class="pk-symbole-badge pk-symbole-argent ' + (etat.symboles && etat.symboles.argent ? 'est-obtenu' : 'est-verrouille') + '">' +
            'Argent (Silver) : ' + (etat.symboles && etat.symboles.argent ? 'Obtenu' : 'Non obtenu') +
          '</span> ' +
          '<span class="pk-symbole-badge pk-symbole-or ' + (etat.symboles && etat.symboles.or ? 'est-obtenu' : 'est-verrouille') + '">' +
            'Or (Gold) : ' + (etat.symboles && etat.symboles.or ? 'Obtenu' : 'Non obtenu') +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div class="pk-usine-dialogue-meneur">' +
        '<div class="pk-meneur-avatar">🧠</div>' +
        '<div class="pk-meneur-texte">' +
          '« Bienvenue à l\'Usine de Combat ! Ici, le savoir et l\'adaptabilité priment sur la force brute. ' +
          'Emprunte trois Pokémon, analyse le profil de tes adversaires, et remporte des séries de 7 combats pour gagner des PCo ! »' +
        '</div>' +
      '</div>' +
      '<div class="pkdx-actions pk-usine-actions">' +
        (aSessionEnCours
          ? '<button type="button" class="pkdx-touche est-definitive" id="pk-usine-reprendre">Reprendre la série</button>'
          : '') +
        '<button type="button" class="pkdx-touche' + (aSessionEnCours ? '' : ' est-definitive') + '" id="pk-usine-nouveau">Nouveau défi</button>' +
        '<button type="button" class="pkdx-touche" id="pk-usine-boutique">Boutique PCo (Battle Shop)</button>' +
        '<button type="button" class="pkdx-touche" id="pk-usine-retour">Retour à l\'accueil (Back)</button>' +
      '</div>' +
    '</div>';

    var cible = obtenirCible(options);
    if (cible) {
      cible.innerHTML = html;

      var btnNouveau = cible.querySelector("#pk-usine-nouveau");
      if (btnNouveau) {
        btnNouveau.addEventListener("click", function () {
          son("PRESS_AB");
          if (!W.PokeUsine) return;
          var nouvelleSession = W.PokeUsine.creerSession();
          if (P && typeof P.usineEcrire === "function") {
            var st = P.usineLire();
            st.session = nouvelleSession;
            P.usineEcrire(st);
          }
          ouvrirDraft(nouvelleSession, options);
        });
      }

      var btnReprendre = cible.querySelector("#pk-usine-reprendre");
      if (btnReprendre) {
        btnReprendre.addEventListener("click", function () {
          son("PRESS_AB");
          if (!etat.session) return;
          if (etat.session.statut === "draft") {
            ouvrirDraft(etat.session, options);
          } else if (etat.session.statut === "echange") {
            ouvrirEchange(etat.session, options);
          } else if (etat.session.statut === "serie_gagnee") {
            ouvrirVictoireSerie(etat.session, options);
          } else if (etat.session.statut === "defaite") {
            ouvrirDefaite(etat.session, options);
          } else {
            lancerCombat(etat.session, options);
          }
        });
      }

      var btnBoutique = cible.querySelector("#pk-usine-boutique");
      if (btnBoutique) {
        btnBoutique.addEventListener("click", function () {
          son("PRESS_AB");
          ouvrirBoutiquePCo(options);
        });
      }

      var btnRetour = cible.querySelector("#pk-usine-retour");
      if (btnRetour) {
        btnRetour.addEventListener("click", function () {
          son("PRESS_AB");
          if (W.PokeRegles && typeof W.PokeRegles.poser === "function") {
            W.PokeRegles.poser("gen1");
          }
          if (typeof options.retour === "function") {
            options.retour();
          }
        });
      }
    }

    return html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ÉCRAN DE DRAFT INITIAL (ouvrirDraft)
  // ═══════════════════════════════════════════════════════════════════════════
  function ouvrirDraft(session, options) {
    options = options || {};
    if (!session && W.PokeUsine) {
      session = W.PokeUsine.creerSession();
    }
    if (!session || !session.prets) return "";

    var selection = [];

    function genererHTML() {
      var cartesHTML = session.prets.map(function (mon, idx) {
        var estSel = selection.includes(idx);
        return '<div class="pk-draft-carte-wrapper" data-idx="' + idx + '">' +
          rendreCartePokemon(mon, idx, estSel, "draft") +
        '</div>';
      }).join("");

      return '<div class="pk-usine-container pk-usine-draft">' +
        '<div class="pk-usine-banniere">' +
          '<h2 class="pk-usine-titre">Sélectionnez 3 Pokémon de prêt</h2>' +
          '<div class="pk-usine-draft-compteur" id="pk-draft-compteur">' +
            'Sélectionnés : <span class="pk-compteur-val">' + selection.length + ' / 3</span>' +
          '</div>' +
        '</div>' +
        '<div class="pk-draft-grille">' + cartesHTML + '</div>' +
        '<div class="pkdx-actions pk-draft-actions">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-draft-confirmer"' +
            (selection.length === 3 ? '' : ' disabled="disabled"') + '>Confirmer l\'équipe</button>' +
          '<button type="button" class="pkdx-touche" id="pk-draft-retour">Retour au Hall</button>' +
        '</div>' +
      '</div>';
    }

    var html = genererHTML();
    var cible = obtenirCible(options);

    function rattacherEvenements() {
      if (!cible) return;
      var wrappers = cible.querySelectorAll(".pk-draft-carte-wrapper");
      for (var i = 0; i < wrappers.length; i++) {
        (function (wrap) {
          wrap.addEventListener("click", function () {
            var idx = parseInt(wrap.getAttribute("data-idx"), 10);
            var pos = selection.indexOf(idx);
            if (pos !== -1) {
              selection.splice(pos, 1);
              son("PRESS_AB");
            } else if (selection.length < 3) {
              selection.push(idx);
              son("PRESS_AB");
            } else {
              son("DENIED");
              return;
            }
            cible.innerHTML = genererHTML();
            rattacherEvenements();
          });
        })(wrappers[i]);
      }

      var btnConfirmer = cible.querySelector("#pk-draft-confirmer");
      if (btnConfirmer) {
        btnConfirmer.addEventListener("click", function () {
          if (selection.length !== 3) return;
          son("PRESS_AB");
          if (W.PokeUsine) {
            W.PokeUsine.choisirEquipeInitiale(session, selection);
          }
          if (W.PokeProgression && typeof W.PokeProgression.usineEcrire === "function") {
            var st = W.PokeProgression.usineLire();
            st.session = session;
            W.PokeProgression.usineEcrire(st);
          }
          lancerCombat(session, options);
        });
      }

      var btnRetour = cible.querySelector("#pk-draft-retour");
      if (btnRetour) {
        btnRetour.addEventListener("click", function () {
          son("PRESS_AB");
          ouvrirHall(options);
        });
      }
    }

    if (cible) {
      cible.innerHTML = html;
      rattacherEvenements();
    }

    return html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ORCHESTRATION DU COMBAT (lancerCombat)
  // ═══════════════════════════════════════════════════════════════════════════
  function lancerCombat(session, options) {
    options = options || {};
    if (!session) return "";

    if (!session.adversaire && W.PokeUsine) {
      session.adversaire = W.PokeUsine.tirerAdversaire(session);
    }

    var adv = session.adversaire || { nom: "Dresseur", titre: "Topdresseur", equipe: [] };
    var estBoss = !!(adv.boss || session.combatGlobal === 21 || session.combatGlobal === 42);

    var bossBanniereHTML = estBoss ? (
      '<div class="pk-boss-intro-banniere">' +
        '<div class="pk-boss-titre">⚡ APPARITION DU MENEUR DE L\'USINE ⚡</div>' +
        '<div class="pk-boss-nom">Savant de l\'Usine Samson (Factory Head Noland) relève votre défi !</div>' +
        '<div class="pk-boss-dialogue">' +
          '« Je suis le Savant de l\'Usine, Samson. Montre-moi comment tu maîtrises le savoir et les Pokémon d\'emprunt ! »' +
        '</div>' +
      '</div>'
    ) : '';

    var html = '<div class="pk-usine-container pk-usine-combat">' +
      '<div class="pk-usine-combat-en-tete">' +
        '<div class="pk-usine-match-info">' +
          'Série n°' + session.serie + ' — Combat ' + session.combat + ' / 7 (Total victoires : ' + session.victoires + ')' +
        '</div>' +
        '<div class="pk-adversaire-titre">' +
          'Adversaire : ' + esc(adv.titre ? adv.titre + " " + adv.nom : adv.nom) +
        '</div>' +
      '</div>' +
      bossBanniereHTML +
      '<div id="pk-usine-combat-hote" class="pk-combat-hote-zone"></div>' +
      '<div class="pkdx-actions pk-combat-test-actions">' +
        '<button type="button" class="pkdx-touche" id="pk-combat-simuler-victoire">Résoudre Combat (Victoire)</button>' +
        '<button type="button" class="pkdx-touche" id="pk-combat-simuler-defaite">Résoudre Combat (Défaite)</button>' +
        '<button type="button" class="pkdx-touche" id="pk-combat-abandonner">Abandonner la série</button>' +
      '</div>' +
    '</div>';

    var cible = obtenirCible(options);
    if (cible) {
      cible.innerHTML = html;

      function terminer(victoire) {
        if (W.PokeUsine) {
          W.PokeUsine.enregistrerResultatCombat(session, victoire);
        }
        if (W.PokeProgression && typeof W.PokeProgression.usineEcrire === "function") {
          var st = W.PokeProgression.usineLire();
          st.session = session;
          W.PokeProgression.usineEcrire(st);
        }
        if (victoire) {
          if (session.statut === "serie_gagnee") {
            ouvrirVictoireSerie(session, options);
          } else {
            ouvrirEchange(session, options);
          }
        } else {
          ouvrirDefaite(session, options);
        }
      }

      var hoteCombat = cible.querySelector("#pk-usine-combat-hote");
      if (hoteCombat && W.PokeCombat && W.PokeUICombat && typeof W.PokeUICombat.Ecran === "function") {
        try {
          var etatCombat = W.PokeCombat.demarrer(session.equipe, adv.equipe, { dresseur: true });
          new W.PokeUICombat.Ecran(hoteCombat, etatCombat, {
            dresseur: true,
            qui: adv.titre ? adv.titre + " " + adv.nom : adv.nom,
            surFin: function (issue) {
              terminer(issue === "victoire");
            }
          });
        } catch (err) {
          // Si le moteur d'animation ou le DOM est indisponible, les boutons de résolution sont actifs
        }
      }

      var btnVictoire = cible.querySelector("#pk-combat-simuler-victoire");
      if (btnVictoire) {
        btnVictoire.addEventListener("click", function () {
          son("VICTOIRE");
          terminer(true);
        });
      }

      var btnDefaite = cible.querySelector("#pk-combat-simuler-defaite");
      if (btnDefaite) {
        btnDefaite.addEventListener("click", function () {
          son("DEFAITE");
          terminer(false);
        });
      }

      var btnAbandon = cible.querySelector("#pk-combat-abandonner");
      if (btnAbandon) {
        btnAbandon.addEventListener("click", function () {
          son("PRESS_AB");
          terminer(false);
        });
      }
    }

    return html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ÉCRAN D'ÉCHANGE D'APRÈS-MATCH (ouvrirEchange)
  // ═══════════════════════════════════════════════════════════════════════════
  function ouvrirEchange(session, options) {
    options = options || {};
    if (!session || !session.equipe) return "";

    var equipeJoueur = session.equipe;
    var equipeAdverse = (session.adversaire && session.adversaire.equipe) ? session.adversaire.equipe : [];

    var selJoueur = null;
    var selAdverse = null;

    function genererHTML() {
      var colJoueurHTML = equipeJoueur.map(function (mon, idx) {
        var estSel = (selJoueur === idx);
        return '<div class="pk-swap-carte-wrap" data-side="joueur" data-idx="' + idx + '">' +
          rendreCartePokemon(mon, idx, estSel, "joueur") +
        '</div>';
      }).join("");

      var colAdverseHTML = equipeAdverse.map(function (mon, idx) {
        var estSel = (selAdverse === idx);
        return '<div class="pk-swap-carte-wrap" data-side="adverse" data-idx="' + idx + '">' +
          rendreCartePokemon(mon, idx, estSel, "adverse") +
        '</div>';
      }).join("");

      return '<div class="pk-usine-container pk-usine-echange">' +
        '<div class="pk-usine-banniere">' +
          '<h2 class="pk-usine-titre">Échange de Pokémon d\'après-match (Swap)</h2>' +
          '<div class="pk-usine-sous-titre">Vous pouvez échanger un Pokémon de votre équipe contre un Pokémon de l\'équipe adverse vaincue.</div>' +
        '</div>' +
        '<div class="pk-echange-colonnes">' +
          '<div class="pk-echange-colonne pk-col-joueur">' +
            '<h3 class="pk-col-titre">Votre équipe (Player Team)</h3>' +
            '<div class="pk-echange-liste">' + colJoueurHTML + '</div>' +
          '</div>' +
          '<div class="pk-echange-colonne pk-col-adverse">' +
            '<h3 class="pk-col-titre">Équipe vaincue (Defeated Team)</h3>' +
            '<div class="pk-echange-liste">' + colAdverseHTML + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pkdx-actions pk-echange-actions">' +
          '<button type="button" class="pkdx-touche est-definitive" id="pk-swap-confirmer"' +
            (selJoueur !== null && selAdverse !== null ? '' : ' disabled="disabled"') + '>Confirmer l\'échange (Échanger)</button>' +
          '<button type="button" class="pkdx-touche" id="pk-swap-garder">Garder mon équipe (Conserver)</button>' +
        '</div>' +
      '</div>';
    }

    var html = genererHTML();
    var cible = obtenirCible(options);

    function rattacherEvenements() {
      if (!cible) return;

      var wraps = cible.querySelectorAll(".pk-swap-carte-wrap");
      for (var i = 0; i < wraps.length; i++) {
        (function (wrap) {
          wrap.addEventListener("click", function () {
            var side = wrap.getAttribute("data-side");
            var idx = parseInt(wrap.getAttribute("data-idx"), 10);
            if (side === "joueur") {
              selJoueur = (selJoueur === idx ? null : idx);
            } else {
              selAdverse = (selAdverse === idx ? null : idx);
            }
            son("PRESS_AB");
            cible.innerHTML = genererHTML();
            rattacherEvenements();
          });
        })(wraps[i]);
      }

      var btnConfirmer = cible.querySelector("#pk-swap-confirmer");
      if (btnConfirmer) {
        btnConfirmer.addEventListener("click", function () {
          if (selJoueur === null || selAdverse === null) return;
          son("PRESS_AB");
          if (W.PokeUsine) {
            W.PokeUsine.appliquerEchange(session, selJoueur, selAdverse);
          }
          if (W.PokeProgression && typeof W.PokeProgression.usineEcrire === "function") {
            var st = W.PokeProgression.usineLire();
            st.session = session;
            W.PokeProgression.usineEcrire(st);
          }
          lancerCombat(session, options);
        });
      }

      var btnGarder = cible.querySelector("#pk-swap-garder");
      if (btnGarder) {
        btnGarder.addEventListener("click", function () {
          son("PRESS_AB");
          if (W.PokeUsine) {
            W.PokeUsine.garderEquipe(session);
          }
          if (W.PokeProgression && typeof W.PokeProgression.usineEcrire === "function") {
            var st = W.PokeProgression.usineLire();
            st.session = session;
            W.PokeProgression.usineEcrire(st);
          }
          lancerCombat(session, options);
        });
      }
    }

    if (cible) {
      cible.innerHTML = html;
      rattacherEvenements();
    }

    return html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ÉCRAN DE FIN DE SÉRIE & CÉLÉBRATION (ouvrirVictoireSerie)
  // ═══════════════════════════════════════════════════════════════════════════
  function ouvrirVictoireSerie(session, options) {
    options = options || {};
    if (!session) return "";

    var P = W.PokeProgression;
    var estArgent = (session.combatGlobal === 21 || (session.symboles && session.symboles.argent));
    var estOr = (session.combatGlobal === 42 || (session.symboles && session.symboles.or));

    if (P) {
      if (estArgent && typeof P.debloquerSymboleUsine === "function") {
        P.debloquerSymboleUsine("argent");
      }
      if (estOr && typeof P.debloquerSymboleUsine === "function") {
        P.debloquerSymboleUsine("or");
      }
      if (session.pcoGagnes > 0 && typeof P.ajouterPCo === "function") {
        P.ajouterPCo(session.pcoGagnes);
        session.pcoGagnes = 0;
      }
      if (typeof P.enregistrerRecordUsine === "function") {
        P.enregistrerRecordUsine(session.victoires);
      }
    }

    var symboleSectionHTML = "";
    if (estArgent || estOr) {
      var metal = estOr ? "Or (Gold)" : "Argent (Silver)";
      var dialogue = estOr
        ? "« Incroyable ! Tu as triomphé 42 fois consécutives et atteint l'apogée du savoir tactique. Reçois le Symbole du Savoir d'Or ! »"
        : "« Bravo dresseur ! Ton savoir et ta maîtrise des créatures d'emprunt ont surpassé les miens. Je te décerne le Symbole du Savoir d'Argent ! »";

      symboleSectionHTML = '<div class="pk-ceremonie-symbole">' +
        '<div class="pk-symbole-embleme">🎖️</div>' +
        '<h3 class="pk-symbole-titre">Remise officielle du Symbole du Savoir (' + metal + ')</h3>' +
        '<div class="pk-dialogue-noland">' + esc(dialogue) + '</div>' +
      '</div>';
    }

    var html = '<div class="pk-usine-container pk-usine-victoire">' +
      '<div class="pk-usine-banniere">' +
        '<h2 class="pk-usine-titre">Victoire de la Série de 7 combats !</h2>' +
        '<div class="pk-usine-sous-titre">Félicitations ! Vous avez complété avec succès la série ' + session.serie + ' !</div>' +
      '</div>' +
      '<div class="pk-victoire-recap">' +
        '<div class="pk-victoire-stat">Victoires consécutives totales : <strong>' + session.victoires + '</strong></div>' +
        '<div class="pk-victoire-stat">Points de Combat (PCo) remportés : <strong>+' + W.PokeUsine.calculerGainPCo(session.serie, estArgent || estOr) + ' PCo</strong></div>' +
      '</div>' +
      symboleSectionHTML +
      '<div class="pkdx-actions pk-victoire-actions">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-victoire-continuer">Continuer pour la Série suivante</button>' +
        '<button type="button" class="pkdx-touche" id="pk-victoire-quitter">Enregistrer et Quitter (Retour au Hall)</button>' +
      '</div>' +
    '</div>';

    var cible = obtenirCible(options);
    if (cible) {
      cible.innerHTML = html;

      var btnContinuer = cible.querySelector("#pk-victoire-continuer");
      if (btnContinuer) {
        btnContinuer.addEventListener("click", function () {
          son("PRESS_AB");
          if (W.PokeUsine) {
            W.PokeUsine.continuerSerie(session);
          }
          if (P && typeof P.usineEcrire === "function") {
            var st = P.usineLire();
            st.session = session;
            P.usineEcrire(st);
          }
          lancerCombat(session, options);
        });
      }

      var btnQuitter = cible.querySelector("#pk-victoire-quitter");
      if (btnQuitter) {
        btnQuitter.addEventListener("click", function () {
          son("PRESS_AB");
          if (P && typeof P.usineEcrire === "function") {
            var st = P.usineLire();
            st.session = session;
            P.usineEcrire(st);
          }
          ouvrirHall(options);
        });
      }
    }

    return html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ÉCRAN DE DÉFAITE (ouvrirDefaite)
  // ═══════════════════════════════════════════════════════════════════════════
  function ouvrirDefaite(session, options) {
    options = options || {};
    var victoires = (session && typeof session.victoires === "number") ? session.victoires : 0;
    var pcoGagnes = (session && typeof session.pcoGagnes === "number") ? session.pcoGagnes : 0;

    var P = W.PokeProgression;
    if (P) {
      if (typeof P.enregistrerRecordUsine === "function") {
        P.enregistrerRecordUsine(victoires);
      }
      if (typeof P.usineLire === "function" && typeof P.usineEcrire === "function") {
        var st = P.usineLire();
        st.session = null;
        P.usineEcrire(st);
      }
    }

    var html = '<div class="pk-usine-container pk-usine-defaite">' +
      '<div class="pk-usine-banniere">' +
        '<h2 class="pk-usine-titre">Défaite... fin de série</h2>' +
        '<div class="pk-usine-sous-titre">Votre parcours à l\'Usine de Combat s\'arrête ici pour cette session.</div>' +
      '</div>' +
      '<div class="pk-defaite-recap">' +
        '<div class="pk-defaite-stat">Victoires consécutives atteintes : <strong>' + victoires + '</strong></div>' +
        '<div class="pk-defaite-stat">Points de Combat (PCo) accumulés : <strong>' + pcoGagnes + ' PCo</strong></div>' +
      '</div>' +
      '<div class="pk-defaite-conseil">' +
        '« La défaite est le meilleur professeur. Retente ta chance avec une nouvelle sélection de prêt ! »' +
      '</div>' +
      '<div class="pkdx-actions pk-defaite-actions">' +
        '<button type="button" class="pkdx-touche est-definitive" id="pk-defaite-retour">Retour au Hall de l\'Usine</button>' +
      '</div>' +
    '</div>';

    var cible = obtenirCible(options);
    if (cible) {
      cible.innerHTML = html;

      var btnRetour = cible.querySelector("#pk-defaite-retour");
      if (btnRetour) {
        btnRetour.addEventListener("click", function () {
          son("PRESS_AB");
          ouvrirHall(options);
        });
      }
    }

    return html;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. BOUTIQUE DE POINTS DE COMBAT (ouvrirBoutiquePCo)
  // ═══════════════════════════════════════════════════════════════════════════
  function ouvrirBoutiquePCo(options) {
    options = options || {};
    var P = W.PokeProgression;
    var soldePCo = (P && typeof P.usineLire === "function") ? P.usineLire().pco : 0;
    var coffre = (P && typeof P.coffreLire === "function") ? P.coffreLire() : {};

    var articlesHTML = CATALOGUE_BOUTIQUE.map(function (item) {
      var peutAcheter = soldePCo >= item.prix;
      var charges = coffre[item.cle] || 0;
      var estAnglais = (W.PokeUI && typeof W.PokeUI.langue === "function" && W.PokeUI.langue() === "en");
      var badgeReserve = charges > 0
        ? ' <span class="pk-boutique-reserve">' +
            (estAnglais
              ? 'In storage: ' + charges + ' use' + (charges > 1 ? 's' : '')
              : 'En réserve : ' + charges + ' utilisation' + (charges > 1 ? 's' : '')) +
          '</span>'
        : '';
      return '<div class="pk-boutique-carte pk-cat-' + esc(item.categorie.toLowerCase()) + '">' +
        '<div class="pk-boutique-info">' +
          '<div class="pk-boutique-nom">' + esc(item.nom) + ' <span class="pk-boutique-code">(' + esc(item.cle) + ')</span></div>' +
          '<div class="pk-boutique-desc">' + esc(item.desc) + '</div>' +
          '<div class="pk-boutique-meta">' +
            '<span class="pk-boutique-categorie">' + esc(item.categorie) + '</span> ' +
            '<span class="pk-boutique-prix"><strong>' + item.prix + ' PCo</strong></span>' +
            badgeReserve +
          '</div>' +
        '</div>' +
        '<button type="button" class="pkdx-touche pk-boutique-acheter" data-cle="' + esc(item.cle) + '"' +
          (peutAcheter ? '' : ' disabled="disabled"') + '>Acheter</button>' +
      '</div>';
    }).join("");

    var html = '<div class="pk-usine-container pk-usine-boutique">' +
      '<div class="pk-usine-banniere">' +
        '<h2 class="pk-usine-titre">Boutique PCo (Battle Shop)</h2>' +
        '<div class="pk-boutique-solde-cadre">' +
          'Solde disponible : <span class="pk-solde-pco-val"><strong>' + soldePCo + ' PCo</strong></span>' +
        '</div>' +
      '</div>' +
      '<div class="pk-boutique-grille">' + articlesHTML + '</div>' +
      '<div class="pkdx-actions pk-boutique-actions">' +
        '<button type="button" class="pkdx-touche" id="pk-boutique-retour">Retour au Hall</button>' +
      '</div>' +
    '</div>';

    var cible = obtenirCible(options);
    if (cible) {
      cible.innerHTML = html;

      var boutons = cible.querySelectorAll(".pk-boutique-acheter");
      for (var b = 0; b < boutons.length; b++) {
        (function (btn) {
          btn.addEventListener("click", function () {
            var cle = btn.getAttribute("data-cle");
            var itemTrouve = null;
            for (var k = 0; k < CATALOGUE_BOUTIQUE.length; k++) {
              if (CATALOGUE_BOUTIQUE[k].cle === cle) {
                itemTrouve = CATALOGUE_BOUTIQUE[k];
                break;
              }
            }
            if (!itemTrouve || !P) return;
            var ok = P.depenserPCo(itemTrouve.prix);
            if (ok) {
              P.coffreAjouter(itemTrouve.cle, 5);
              son("ACHAT");
              ouvrirBoutiquePCo(options);
            } else {
              son("DENIED");
            }
          });
        })(boutons[b]);
      }

      var btnRetour = cible.querySelector("#pk-boutique-retour");
      if (btnRetour) {
        btnRetour.addEventListener("click", function () {
          son("PRESS_AB");
          ouvrirHall(options);
        });
      }
    }

    return html;
  }

  // ── Export public ───────────────────────────────────────────────────────────
  W.PokeUIUsine = {
    ouvrirHall: ouvrirHall,
    ouvrirDraft: ouvrirDraft,
    lancerCombat: lancerCombat,
    ouvrirEchange: ouvrirEchange,
    ouvrirVictoireSerie: ouvrirVictoireSerie,
    ouvrirDefaite: ouvrirDefaite,
    ouvrirBoutiquePCo: ouvrirBoutiquePCo,
    CATALOGUE_BOUTIQUE: CATALOGUE_BOUTIQUE
  };

})(typeof window !== "undefined" ? window : globalThis);
