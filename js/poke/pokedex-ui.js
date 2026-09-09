(function (W, D) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a son itinéraire, ses clés et ses zones.
  var ETAPES = function () { return (W.PokeRegles && W.PokeRegles.etapes()) || W.POKE_ETAPES || []; };
  var CLES_V = function () { return (W.PokeRegles && W.PokeRegles.clesVoyage()) || W.POKE_CLES || {}; };
  var ZONES = function () { return (W.PokeRegles && W.PokeRegles.zones()) || W.POKE_ZONES || []; };
  var LIEUX = function () { return (W.PokeRegles && W.PokeRegles.lieux()) || W.POKE_LIEUX || {}; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE POKÉDEX INTERACTIF
  //
  //  Trois états, et ils se lisent SANS couleur :
  //    · silhouette noire  — jamais croisé
  //    · portrait gris     — VU (croisé en combat, pas capturé)
  //    · portrait couleur  — CAPTURÉ
  //  C'est le rendu du jeu d'origine, et c'est aussi le plus accessible : un
  //  joueur daltonien lit les trois états à la forme et au contraste.
  //
  //  🔴 « Vu » se pose dès la RENCONTRE. Croiser un Pokémon sans l'attraper
  //     remplit une case — c'est la règle du jeu, et c'est ce qui rend le
  //     Pokédex vivant même quand on rate tout.
  // ═══════════════════════════════════════════════════════════════════════════

  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 CET ÉCRAN MONTRE LE COMPTE, DONC IL DOIT SAVOIR NOMMER CE QUE LE COMPTE
  //    CONTIENT — y compris une espèce ramenée de l'autre monde. `ESP()` ne
  //    connaît que le monde COURANT : la grille s'étend désormais jusqu'au
  //    total du compte, et `ESP()[n]` y rendait `undefined` dès la 152ᵉ case en
  //    plein Kanto. Un joueur revenu de Johto y aurait cassé son Pokédex.
  //    C'est la porte prévue pour ça — voir `PokeRegles.especeToute`.
  // ═══════════════════════════════════════════════════════════════════════════
  var ESPECE = function (n) {
    return (W.PokeRegles && W.PokeRegles.especeToute) ? W.PokeRegles.especeToute(n) : ESP()[n];
  };
  var LANG = function () { return W.POKE_LANG || "fr"; };
  var TABLE = function () { return W.PokeRegles ? W.PokeRegles.table() : W.POKE_TYPE_TABLE; };

  var TXT = {
    titre: { fr: "POKÉDEX", en: "POKÉDEX" },
    tous: { fr: "TOUS", en: "ALL" },
    vus: { fr: "VUS", en: "SEEN" },
    pris: { fr: "CAPTURÉS", en: "CAUGHT" },
    manque: { fr: "MANQUANTS", en: "MISSING" },
    fermer: { fr: "FERMER", en: "CLOSE" },
    inconnu: { fr: "Aucune donnée.", en: "No data." },
    jamaisVu: { fr: "Tu n'as jamais croisé ce Pokémon.", en: "You have never seen this Pokémon." },
    vuPas: { fr: "Croisé, jamais attrapé.", en: "Seen, never caught." },
    taille: { fr: "Taille", en: "Height" },
    poids: { fr: "Poids", en: "Weight" },
    ou: { fr: "Attrapé à", en: "Caught at" },
    niveau: { fr: "niveau", en: "level" },
    // ── CE QUE LE COMPTE GARDAIT SANS JAMAIS LE DIRE ───────────────────────
    //  Le jour de la prise et le jour de l'éclat étaient écrits dans le
    //  stockage depuis le premier jour, et aucun écran ne les lisait.
    ouAvant: { fr: "Attrapé lors d'un voyage précédent, à", en: "Caught on an earlier journey, at" },
    // ── LES PROVENANCES QUI NE SONT PAS DES LIEUX ─────────────────────────
    //  🔴 QUATRE IDENTIFIANTS INTERNES S'AFFICHAIENT TELS QUELS. La fiche
    //     disait « Attrapé à compagnon », « Attrapé à evolution » — vu à
    //     l'écran, sans accent et en minuscules. Un Pokémon reçu, éclos d'une
    //     évolution ou gagné au Casino n'a pas été « attrapé à » quelque part.
    ouCompagnon: { fr: "Emmené comme compagnon, {niv}", en: "Brought along as a companion, {niv}" },
    ouEvolution: { fr: "Obtenu par évolution, {niv}", en: "Obtained by evolving, {niv}" },
    ouCasino: { fr: "Gagné au Casino, {niv}", en: "Won at the Game Corner, {niv}" },
    ouSafari: { fr: "Attrapé au Parc Safari, {niv}", en: "Caught at the Safari Zone, {niv}" },
    ouConcours: { fr: "Présenté au Concours de capture, {niv}",
      en: "Entered in the Bug-Catching Contest, {niv}" },
    ouDojo: { fr: "Choisi au Dojo de Safrania, {niv}", en: "Chosen at the Saffron Dojo, {niv}" },
    // Le repli ne NOMME AUCUN LIEU : mieux vaut taire l'endroit que d'inventer
    // un nom ou de recracher une clé. Voir la loi des replis du dossier.
    ouSansLieu: { fr: "Attrapé au {niv}", en: "Caught at {niv}" },
    // La virgule appartient à la PHRASE, pas au code qui la colle : le français
    // la veut, l'anglais n'en veut pas. « niveau 14 le 18 juillet » se lisait mal.
    leJour: { fr: ", le {d}", en: " on {d}" },
    eclatVu: { fr: "Chromatique trouvé {d}.", en: "Shiny found {d}." },
    eclatSansDate: { fr: "Chromatique trouvé.", en: "Shiny found." },
    faible: { fr: "Craint", en: "Weak to" },
    resiste: { fr: "Encaisse", en: "Resists" },
    immune: { fr: "Insensible à", en: "Immune to" },
    evolue: { fr: "Évolution", en: "Evolution" },
    parNiveau: { fr: "au niveau {n}", en: "at level {n}" },
    parPierre: { fr: "avec une {o}", en: "with a {o}" },
    parEchange: { fr: "par échange", en: "by trade" },
    horsVersion: { fr: "Absent de la version {v}.", en: "Not in {v} version." },
    // ── Les pistes, pour ce qu'on n'a pas encore ───────────────────────────
    pistes: { fr: "OÙ LE TROUVER", en: "WHERE TO FIND IT" },
    // La règle de Mew, dite chez lui. Elle change de phrase une fois gagnée :
    // un objectif atteint qui garderait son libellé de but ne récompense rien.
    // 🔴 [24/08] LE NOMBRE ETAIT ECRIT DANS LA PHRASE. « Capture les 150
    //    autres » est juste a Kanto et faux a Johto, ou le compte est 214.
    //    Le seuil se calcule sur le monde depuis ce soir ; la phrase le lit.
    piste_mewFerme: {
      fr: "Capture les {seuil} autres. Il t'en reste {n}.",
      en: "Catch the other {seuil}. You still need {n}.",
    },
    piste_mewOuvert: {
      fr: "Ton Pokédex est complet : il apparaît dans certains voyages.",
      en: "Your Pokédex is complete: it appears in some journeys.",
    },
    // 🔴 [24/08] LA FICHE SE TAISAIT, ET UN JOUEUR A FAIT LA LISTE À LA MAIN.
    //    Nad a posté sur #bug-report les quatorze lignées qu'il n'arrivait pas
    //    à capturer à Johto, relevées partie après partie. Neuf étaient justes.
    //    Il n'avait aucun moyen de le savoir autrement : sans piste, la
    //    rubrique « OÙ LE TROUVER » ne s'affichait PAS DU TOUT, et une fiche
    //    muette se lit comme « cherche encore », jamais comme « il n'est pas là ».
    //    🔑 LE JEU LE SAVAIT DÉJÀ : `ouTrouver` lit les tables du monde courant,
    //       et rendait une liste vide. Ce qui manquait, c'est de le DIRE.
    piste_horsDeCeVoyage: {
      fr: "Il ne vit nulle part dans ce voyage.",
      en: "It lives nowhere in this journey.",
    },
    piste_herbe: { fr: "Dans les hautes herbes {de|ou}", en: "In the tall grass of {ou}" },
    piste_eau: { fr: "En surfant à {ou}", en: "Surfing at {ou}" },
    piste_peche: { fr: "À la ligne", en: "By fishing" },
    // Les trois voies propres à Johto. Sans leur phrase, la fiche annoncerait
    // une piste sans nom — pire qu'un silence.
    piste_arbre: { fr: "En secouant un arbre", en: "By headbutting a tree" },
    piste_errant: { fr: "Il court dans tout Johto", en: "It roams across Johto" },
    piste_concours: { fr: "Au Concours de capture d'insectes", en: "At the Bug-Catching Contest" },
    piste_echange: { fr: "Par un échange à {ou}", en: "By a trade at {ou}" },
    piste_casino: { fr: "Au Casino de Céladopole", en: "At the Celadon Game Corner" },
    piste_cadeau: { fr: "Offert à {ou}", en: "Given at {ou}" },
    piste_fossile: { fr: "Ranimé depuis un fossile", en: "Revived from a fossil" },
    // Le Dojo est le seul choix exclusif du jeu : on prend l'un, on perd
    // l'autre. La piste doit le dire, sinon elle promet les deux.
    piste_dojo: { fr: "Au Dojo {de|ou} — l'un des deux, l'autre reste là-bas", en: "At the Dojo in {ou} — one of the two, the other stays" },
    piste_ambre: { fr: "Vieil Ambre au Musée {de|ou}, ranimé bien plus tard", en: "Old Amber at the Museum in {ou}, revived much later" },
    piste_legendaire: { fr: "Une seule rencontre, à {ou}", en: "A single encounter, at {ou}" },
    piste_statique: { fr: "Endormi sur la route, à {ou}", en: "Asleep on the road, at {ou}" },
    piste_evolution: { fr: "En faisant évoluer {ou}", en: "By evolving {ou}" },
    piste_depart: { fr: "Au départ du voyage", en: "As a starter" },
    // ── LE BANDEAU DISAIT LE VOYAGE AU-DESSUS D'UNE GRILLE QUI DIT LA VIE ────
    //  🔴 « 1 attrapés » s'affichait au-dessus de cinquante-neuf cases remplies.
    //     Deux périmètres sur un même écran, et le plus petit en tête : le
    //     joueur lit son voyage et croit lire sa collection. On donne donc
    //     d'abord ce que le COMPTE possède — c'est ce que la grille montre —
    //     puis ce que ce voyage a apporté, quand il a apporté quelque chose.
    //  🔴 ET « 1 attrapés » ÉTAIT FAUX. Le pluriel était écrit en dur : le
    //     premier Pokémon de tout nouveau joueur produisait une faute d'accord
    //     sur le tout premier écran de collection. Aucun détecteur ne la voyait,
    //     `poke-genre` traque le genre, pas le nombre.
    compteur: { fr: "{p} en collection · {v} {v|croisé|croisés} · {a} atteignables ici",
                en: "{p} collected · {v} encountered · {a} reachable here" },
    compteurVoyage: { fr: "· {n} pendant ce voyage", en: "· {n} on this journey" },
    // 🔴 Hors voyage, « ici » ne désigne rien : pas de version tirée, pas de
    //    monde. On dit ce que la collection peut CROISER, les deux versions
    //    réunies.
    // ⚠️ « À CROISER », JAMAIS « À TROUVER ». Vu à l'écran : « 108 à trouver en
    //    tout » juste au-dessus d'un diplôme qui en demande 150 — deux
    //    dénominateurs qui se contredisent sur le même écran. `atteignables` ne
    //    compte QUE ce qu'on rencontre directement : les évolutions par niveau
    //    ou par pierre n'y sont pas, et ce sont elles qui font la différence.
    //    Le mot juste distingue les deux, et il n'y avait qu'un mot à changer.
    compteurHorsVoyage: { fr: "{p} en collection · {v} {v|croisé|croisés} · {a} à croiser en tout",
                          en: "{p} collected · {v} encountered · {a} to encounter in all" },
    // ═════════════════════════════════════════════════════════════════════
    //  🔴 « DANS LE POKÉDEX ÇA ME DIT QUE J'AI SALAMÈCHE ET CARAPUCE ALORS
    //     QUE J'AI ENCORE RIEN FAIT » — le propriétaire, sur un voyage neuf.
    //     Ce n'était pas un bug de données : la collection est celle du
    //     COMPTE, elle garde ce que tous les voyages ont pris — y compris un
    //     starter d'un essai perdu au premier duel. C'est le cœur du mode.
    //     Mais AUCUNE ligne ne le disait : un joueur qui démarre un voyage
    //     neuf et trouve des cases pleines conclut à un bug, à raison.
    //     *Une persistance qui ne s'annonce pas se lit comme une erreur.*
    // ═════════════════════════════════════════════════════════════════════
    compteDit: { fr: "Ta collection garde ce que chaque voyage attrape. Elle ne se vide pas.",
                 en: "Your collection keeps what every journey catches. It never resets." },
    // Le diplôme. 🔴 Il dit toujours CE QU'IL RESTE : un objectif lointain sans
    //    distance affichée n'est pas un objectif, c'est une rumeur.
    // 🔴 Un compteur se lit, une phrase se déchiffre. « Encore 150 espèces
    //    avant les 150 » était juste et illisible. On donne l'état, puis la
    //    distance — dans cet ordre, parce que c'est celui du regard.
    chromatiqueTenu: { fr: "chromatique attrapé", en: "shiny caught" },
    ecouterCri: { fr: "Écouter son cri", en: "Hear its cry" },
    releveChroma: { fr: "Chromatiques", en: "Shinies" },
    releveParfaits: { fr: "Potentiels parfaits", en: "Perfect potentials" },
    releveMoyenne: { fr: "Potentiel moyen", en: "Average potential" },
    diplomeReste: {
      fr: "Diplôme du Professeur Chen — {p} sur {seuil} espèces capturées.",
      en: "Professor Oak's diploma — {p} of {seuil} species caught.",
    },
    diplomeObtenu: {
      fr: "DIPLÔME DU PROFESSEUR CHEN — {n} {n|espèce capturée|espèces capturées}.",
      en: "PROFESSOR OAK'S DIPLOMA — {n} species caught.",
    },
    chercher: { fr: "Chercher", en: "Search" },
  };
  // Porte unique : l'accord en genre et en nombre se résout à un seul endroit.
  function T(c, vars) { return W.PokeGenre.pour(TXT, c, vars, "pokedex"); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  var nomType = function (t) { return W.POKE_TYPE_NOMS[t][LANG()]; };

  // ── Faiblesses et résistances, CALCULÉES ───────────────────────────────────
  //  🔴 Jamais écrites à la main. Elles se déduisent de la table des types, donc
  //     elles suivent automatiquement le seul écart assumé du mode (Spectre
  //     efficace contre Psy). Une liste recopiée aurait divergé au premier
  //     changement, et personne ne l'aurait vu.
  function rapports(types) {
    var out = { faible: [], resiste: [], immune: [] };
    var tous = W.PokeRegles ? W.PokeRegles.types() : W.POKE_TYPES;
    for (var i = 0; i < tous.length; i++) {
      var m = 1;
      for (var j = 0; j < types.length; j++) m *= TABLE()[tous[i]][types[j]];
      if (m === 0) out.immune.push(tous[i]);
      else if (m > 1) out.faible.push({ t: tous[i], m: m });
      else if (m < 1) out.resiste.push({ t: tous[i], m: m });
    }
    return out;
  }

  function pastille(t, suffixe) {
    // La pastille porte sa propre infobulle : forces et faiblesses du type,
    // calculées dans les deux sens. C'est la lecture la plus utile du jeu.
    // 🔴 Elle passe par la porte unique `PokeType` — seule garantie qu'une
    //    couleur de type ne s'affiche jamais sans le nom qui la rend lisible.
    var p = W.PokeType.pastille(t, { info: true, seule: true });
    return suffixe ? p + '<span class="pkdx-chiffre"> ' + esc(suffixe) + "</span>" : p;
  }

  // ── L'état d'une espèce ────────────────────────────────────────────────────
  // ── LE POKÉDEX EST UNE VIE, PAS UN VOYAGE ──────────────────────────────────
  //  🔴 LA GRILLE NE MONTRAIT QUE LA PARTIE EN COURS, et le diplôme juste
  //     au-dessus comptait sur le COMPTE. Deux périmètres, un seul écran : au
  //     premier nœud d'un nouveau voyage, un joueur qui possède cinquante-huit
  //     espèces voyait cent cinquante et une cases vides sous la ligne
  //     « 58 sur 150 espèces capturées ». Le mode dit pourtant en toutes
  //     lettres qu'un Pokédex complet demande plusieurs voyages et se garde
  //     entre les parties.
  //
  //     On prend donc l'UNION : ce que le compte a gardé, plus ce que le voyage
  //     vient d'ajouter. Jamais moins d'information qu'avant — et le voyage
  //     reste lisible, il porte sa propre marque.
  //  🔴 LE COMPTE SE LIT ICI, PAS CHEZ L'APPELANT. J'avais ajouté un troisième
  //     paramètre pour la grille — et la FICHE, qui appelle la même fonction,
  //     ne l'a pas suivi : `compte.pris` sur `undefined` faisait planter
  //     l'écran au premier clic sur une case. Une signature qui exige quelque
  //     chose de ses appelants finit toujours par en trouver un qui l'ignore ;
  //     la fonction va donc chercher elle-même ce dont elle a besoin.
  // Une date de compte, lisible et courte : « 8 août 2026 ». Jamais dans le
  // moteur — `rng.js` interdit `new Date()` là-bas, et il a raison : ici on
  // n'affiche qu'un souvenir, aucun tirage n'en dépend.
  function jour(ts) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleDateString(LANG() === "en" ? "en-GB" : "fr-FR",
        { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return ""; }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  D'OÙ IL VIENT — UNE SEULE PORTE, ET AUCUNE CLÉ À L'ÉCRAN
  //
  //  🔴 QUATRE PROVENANCES NE SONT PAS DES LIEUX : le compagnon qu'on emmène,
  //     l'évolution, le Casino, le Parc Safari. Elles passaient dans la même
  //     phrase que les vraies zones et sortaient telles quelles — « Attrapé à
  //     evolution ». Vu à l'écran.
  //  ⚠️ Le jour ne s'ajoute que pour un voyage PASSÉ : sur la prise du jour, il
  //     dirait « aujourd'hui » avec trois mots de plus.
  var HORS_LIEU = {
    compagnon: "ouCompagnon", evolution: "ouEvolution",
    casino: "ouCasino", safari: "ouSafari", dojo: "ouDojo",
    // Le Concours n'est pas un LIEU : on n'y attrape pas, on y presente.
    concours: "ouConcours",
  };

  function provenance(pr, lieu, dAvant) {
    var niv = T("niveau") + " " + pr.niveau;
    var quand = dAvant && pr.quand ? T("leJour", { d: jour(pr.quand) }) : "";
    var cle = HORS_LIEU[pr.zone];
    if (cle) return esc(T(cle, { niv: niv })) + quand + ".";
    if (!lieu) return esc(T("ouSansLieu", { niv: niv })) + quand + ".";
    return T(dAvant ? "ouAvant" : "ou") + " " + esc(lieu) + ", " + niv + quand + ".";
  }

  function etatDe(partie, n) {
    var compte = W.PokeProgression ? W.PokeProgression.lire() : { pris: {}, vus: {} };
    if (partie.pris[n] || compte.pris[n]) return "pris";
    if (partie.vus[n] || compte.vus[n]) return "vu";
    return "inconnu";
  }

  // Les espèces atteignables dans la version en cours. Afficher « 12 / 151 »
  // sans dire que 53 sont hors de portée ferait croire à un jeu incomplet.
  // ── LES PISTES ─────────────────────────────────────────────────────────────
  //  Trois au maximum : au-delà, ce n'est plus une piste mais une liste, et le
  //  joueur referme. Le nom du lieu vient de `POKE_LIEUX`, jamais écrit ici.
  function pistesHtml(partie, n) {
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 MEW N'AVAIT AUCUNE PISTE, DONC AUCUNE LIGNE — la fiche de la 151ᵉ
    //     espèce était muette, sur le seul Pokémon dont tout le monde demande
    //     comment on l'attrape. Le propriétaire a posé la question mot pour
    //     mot ; un joueur la posera aussi, et l'écran prévu pour y répondre
    //     s'appelle « OÙ LE TROUVER ».
    //  ⚠️ ET LA FICHE DISAIT PIRE QUE RIEN : `horsVersion` aurait annoncé
    //     « Absent de la version Rouge », ce qui laisse croire que l'autre
    //     version l'a. Elle ne l'a pas non plus.
    //  ✅ Sa règle est une règle à lui : on la dit chez lui. Une espèce dont la
    //     condition d'apparition est unique n'entre dans aucune table de
    //     pistes — la nier pour préserver la symétrie ferait une fiche vide.
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [24/08] `n === 151` ETAIT ECRIT ICI. Sous Johto, Celebi tombait donc
    //     dans le cas general, ne trouvait aucune piste, et sa fiche restait
    //     muette -- alors que sa chasse existe. Le monde dit qui est son
    //     mythique ; la fiche le lit.
    var myth = W.PokeRegles && W.PokeRegles.mythique ? W.PokeRegles.mythique() : null;
    if (myth && n === myth.n) {
      var d = W.PokeProgression && W.PokeProgression.diplome
        ? W.PokeProgression.diplome() : null;
      return '<h2 class="pkdx-titre">' + T("pistes") + "</h2>" +
        '<ul class="pkdx-pistes"><li>' +
          T(d && d.atteint ? "piste_mewOuvert" : "piste_mewFerme",
            { n: d ? d.reste : 150, seuil: d ? d.seuil : 150 }) +
        "</li></ul>";
    }
    if (!W.PokeObtenir || !W.PokeObtenir.ouTrouver) return "";
    var l = W.PokeObtenir.ouTrouver(partie.version, n);
    // Aucune piste : ce voyage ne l'abrite nulle part, et la fiche le dit.
    // Se taire ici, c'est envoyer chercher ce qui n'existe pas — voir le texte.
    if (!l.length) {
      return '<h2 class="pkdx-titre">' + T("pistes") + "</h2>" +
        '<ul class="pkdx-pistes"><li>' + T("piste_horsDeCeVoyage") + "</li></ul>";
    }
    var lignes = l.slice(0, 3).map(function (p) {
      var ou = "";
      if (p.type === "evolution") {
        // 🔴 On ne révèle pas le nom d'une forme jamais croisée : la fiche
        //    garderait le secret et la piste le vendrait.
        ou = etatDe(partie, p.lieu) === "inconnu" ? "———" : ESP()[p.lieu].nom[LANG()];
      } else if (p.lieu) {
        ou = (LIEUX()[p.lieu] || {})[LANG()] || p.lieu;
      }
      var texte = T("piste_" + p.type, { ou: esc(ou) });
      return "<li>" + texte + (p.taux ? ' <span class="pkdx-piste-taux">' + p.taux + " %</span>" : "") + "</li>";
    });
    return '<h2 class="pkdx-titre">' + T("pistes") + "</h2>" +
      '<ul class="pkdx-pistes">' + lignes.join("") + "</ul>";
  }

  function horsVersion(partie, n) {
    if (!W.PokePartie || !W.PokePartie.atteignablesSet) return false;
    return !W.PokePartie.atteignablesSet(partie.version)[n];
  }

  // ── La grille ──────────────────────────────────────────────────────────────
  function ouvrir(hote, partie, surFermeture) {
    var filtre = "tous", recherche = "";

    function grille() {
      var out = [];
      // ── CE QUE LE COMPTE GARDE DE CHAQUE ESPÈCE ────────────────────────────
      // 🔴 UNE CASE COCHÉE NE DONNE PLUS JAMAIS ENVIE DE RIEN. Le Pokédex était
      //    binaire : pris ou pas pris. Une fois le Rattata coché, les quarante
      //    Rattata suivants du voyage n'avaient plus aucun intérêt — alors que
      //    deux exemplaires n'ont jamais eu les mêmes statistiques.
      //    On lit donc ce que le COMPTE a gardé : le meilleur potentiel vu, et
      //    le chromatique s'il est tombé. Chaque rencontre redevient une
      //    occasion : celui-ci sera-t-il meilleur que le mien ?
      var compte = W.PokeProgression ? W.PokeProgression.lire() : { meilleurDV: {}, chromatiques: {}, pris: {}, vus: {} };
      var recordDe = compte.meilleurDV || {};
      var chromaDe = compte.chromatiques || {};
      //  LA GRILLE EST CELLE DU COMPTE — « le Pokédex est une vie, pas un
      //  voyage », plus haut dans ce fichier. Son étendue suit donc le compte.
      var dexMax = W.PokeRegles ? W.PokeRegles.dexTotalCompte() : 151;
      for (var n = 1; n <= dexMax; n++) {
        var e = ESPECE(n), etat = etatDe(partie, n);
        if (filtre === "vus" && etat === "inconnu") continue;
        if (filtre === "pris" && etat !== "pris") continue;
        if (filtre === "manque" && etat === "pris") continue;
        if (recherche) {
          var r = recherche.toLowerCase();
          var connu = etat !== "inconnu";
          if (!(String(n) === r || (connu && e.nom[LANG()].toLowerCase().indexOf(r) === 0))) continue;
        }
        // 🔴 Le NOM ne s'affiche pas tant que l'espèce n'a pas été croisée.
        //    Le montrer viderait le Pokédex de son intérêt : on cherche ce
        //    qu'on ne connaît pas encore.
        var nom = etat === "inconnu" ? "———" : e.nom[LANG()];
        // Le record ne se montre que sur ce qu'on a réellement tenu : afficher
        // un potentiel pour une espèce jamais capturée n'aurait aucun sens.
        var record = etat === "pris" ? recordDe[n] : undefined;
        // Ce que CE voyage a apporté. La collection est une vie, mais un joueur
        // veut aussi savoir ce qu'il vient de faire aujourd'hui.
        var duVoyage = !!partie.pris[n];
        var grade = record !== undefined && W.PokeEclat
          ? W.PokeEclat.GRADES.filter(function (g) { return record >= g.min; })[0] : null;
        var chroma = etat === "pris" && chromaDe[n];
        out.push(
          '<button type="button" class="pkdx-case" data-etat="' + etat + '" data-n="' + n + '"' +
            (grade ? ' data-grade="' + grade.cle + '"' : "") +
            (chroma ? ' data-chromatique="oui"' : "") +
            (duVoyage ? ' data-voyage="oui"' : "") +
            ' data-info="espece" data-info-val="' + n + '"' +
            ' aria-label="' + esc("N°" + n + " " + nom +
              (grade ? " — " + grade.nom[LANG()] + " " + record + "/60" : "") +
              (chroma ? " — " + T("chromatiqueTenu") : "")) + '">' +
            '<span class="pkdx-num">' + n + "</span>" +
            '<img alt="" loading="lazy" src="' + W.PokeSprites.face(n, "?i=6") + '">' +
            "<span>" + esc(nom) + "</span>" +
            // 🔴 LA JAUGE PORTE L'INFORMATION, PAS UNE COULEUR. Un potentiel se
            //    compare d'un coup d'œil quand il a une LONGUEUR ; un liseré
            //    teinté demande d'apprendre un code, et se perd chez qui ne
            //    distingue pas les teintes.
            (record !== undefined
              ? '<i class="pkdx-case-jauge" style="--part:' + (record / 60).toFixed(3) + '"></i>' : "") +
          "</button>"
        );
      }
      return out.join("");
    }

    // Le diplôme du Professeur Chen, décerné à 150 espèces capturées sur le
    // COMPTE — pas sur le voyage. Mew n'est pas exigé : il n'est pas obtenable
    // légitimement en Rouge/Bleu, et un but inatteignable est décoratif.
    function diplomeHtml() {
      var d = W.PokeProgression.diplome();
      if (d.atteint) {
        W.PokeProgression.decernerDiplome();
        return '<p class="pkdx-diplome est-obtenu">' + T("diplomeObtenu", { n: d.pris }) + "</p>";
      }
      return '<p class="pkdx-diplome">' + T("diplomeReste", { p: d.pris, seuil: d.seuil }) + "</p>";
    }

    // ── LE RELEVÉ DE COLLECTION ────────────────────────────────────────────
    //  🔴 IL DONNE UN SECOND BUT, ET C'EST CE QUI MANQUAIT. Le diplôme est un
    //     objectif unique et lointain : 150 espèces. Une fois atteint, plus
    //     rien. Le relevé, lui, ne se termine jamais — améliorer son meilleur
    //     exemplaire d'une espèce reste possible au millième voyage. C'est la
    //     différence entre une liste qu'on finit et une collection qu'on tient.
    //  🔴 Il ne s'affiche QUE s'il a quelque chose à dire. Un bandeau de zéros
    //     au premier voyage n'apprend rien et occupe la place du diplôme.
    function releveHtml() {
      if (!W.PokeProgression.releve) return "";
      var r = W.PokeProgression.releve();
      if (!r.notes) return "";
      var ligne = function (cle, valeur) {
        return "<div><dt>" + T(cle) + "</dt><dd>" + valeur + "</dd></div>";
      };
      return '<dl class="pkdx-releve">' +
        // ⚠️ `moyenneDV` est arrondie au dixième par `progression.js` : elle
        //    arrive donc avec un point décimal, même quand elle tombe rond.
        ligne("releveMoyenne", W.PokeGenre.decimal(r.moyenneDV) + " / 60") +
        (r.parfaits ? ligne("releveParfaits", r.parfaits) : "") +
        (r.chromatiques ? ligne("releveChroma", r.chromatiques) : "") +
        "</dl>";
    }

    function rendre() {
      var duVoyage = W.PokePartie.comptePokedex(partie);
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 « ATTEIGNABLES ICI » N'A DE SENS QUE DANS UN VOYAGE. Cet écran
      //     s'ouvre désormais aussi depuis l'accueil, hors de toute partie : il
      //     n'y a alors ni version tirée ni « ici », et annoncer « 98
      //     atteignables ici » serait une vérité de Rouge ou de Bleu servie à
      //     quelqu'un qui n'a pas encore tiré sa version. Sans voyage, on dit
      //     donc ce qui est vrai : ce que la COLLECTION peut atteindre, toutes
      //     versions confondues — c'est exactement ce que le Pokédex de compte
      //     mesure, puisqu'il se remplit sur plusieurs voyages.
      // ═══════════════════════════════════════════════════════════════════════
      var att = partie.version
        ? W.PokePartie.atteignables(partie.version)
        : W.PokePartie.atteignablesToutes();
      // Le bandeau décrit CE QUE LA GRILLE MONTRE : le compte. L'union avec le
      // voyage en cours, comme les cases — jamais moins d'information.
      var c = W.PokeProgression ? W.PokeProgression.lire() : { pris: {}, vus: {} };
      var union = function (a, b) {
        var s = {}, k;
        for (k in a) s[k] = 1;
        for (k in b) s[k] = 1;
        return Object.keys(s).length;
      };
      var pris = union(c.pris, partie.pris);
      var vus = union(c.vus, partie.vus);
      hote.innerHTML =
        '<h1 class="pkdx-titre">' + T("titre") + "</h1>" +
        '<p class="pkdx-bandeau">' +
          T(partie.version ? "compteur" : "compteurHorsVoyage", { p: pris, v: vus, a: att }) +
          (duVoyage.pris ? " " + T("compteurVoyage", { n: duVoyage.pris }) : "") + "</p>" +
        '<p class="pkdx-dex-permanence">' + T("compteDit") + "</p>" +
        // 🔴 LE DIPLÔME DONNE UN SENS AU POKÉDEX DE COMPTE. Sans lui, remplir la
        //    collection ne rapporte rien : le joueur accumule des numéros et le
        //    jeu ne le remarque jamais. Il s'affiche ICI parce que c'est ici
        //    qu'on regarde sa collection — et il dit toujours ce qu'il reste.
        diplomeHtml() +
        releveHtml() +
        '<div class="pkdx-actions">' +
          ["tous", "vus", "pris", "manque"].map(function (f) {
            return '<button type="button" class="pkdx-touche" data-filtre="' + f + '"' +
              (filtre === f ? ' aria-pressed="true"' : "") + ">" + T(f === "tous" ? "tous" : f) + "</button>";
          }).join("") +
          '<label class="pkdx-recherche"><input class="pkdx-champ" id="pkdx-q" placeholder="' + T("chercher") + '" value="' + esc(recherche) + '"></label>' +
        "</div>" +
        '<div class="pkdx-grille">' + grille() + "</div>" +
        '<div class="pkdx-actions"><button type="button" class="pkdx-touche" id="pkdx-fermer">' + T("fermer") + "</button></div>";

      var q = hote.querySelector("#pkdx-q");
      q.addEventListener("input", function () { recherche = q.value.trim(); var p = q.selectionStart; rendre(); var q2 = hote.querySelector("#pkdx-q"); q2.focus(); q2.setSelectionRange(p, p); });
      var fs = hote.querySelectorAll("[data-filtre]");
      for (var i = 0; i < fs.length; i++) fs[i].addEventListener("click", function (ev) { filtre = ev.currentTarget.getAttribute("data-filtre"); rendre(); });
      var cs = hote.querySelectorAll(".pkdx-case");
      for (var k = 0; k < cs.length; k++) cs[k].addEventListener("click", function (ev) { fiche(+ev.currentTarget.getAttribute("data-n")); });
      // ⚠️ ENROBÉE — voir `tools/poke-evenement-fuite.mjs`.
      hote.querySelector("#pkdx-fermer").addEventListener("click", function () { surFermeture(); });
    }

    // ── La fiche ─────────────────────────────────────────────────────────────
    function fiche(n) {
      var e = ESPECE(n), etat = etatDe(partie, n);
      if (etat === "inconnu") {
        hote.innerHTML =
          '<h1 class="pkdx-titre">N° ' + n + "</h1>" +
          '<div class="pkdx-fiche-vide"><img alt="" data-etat="inconnu" src="' + W.PokeSprites.face(n, "?i=6") + '"></div>' +
          "<p>" + T("jamaisVu") + "</p>" +
          // 🔴 ET LA RÈGLE DE MEW SE DIT MÊME SUR UNE FICHE INCONNUE — sinon
          //    elle ne se dit JAMAIS : personne ne l'a croisé avant d'avoir
          //    fini son Pokédex, et c'est précisément là qu'on pose la
          //    question. Une réponse qui n'apparaît qu'après coup n'en est pas
          //    une. Ce n'est pas un secret d'espèce (ni nom, ni type, ni
          //    dessin) : c'est une RÈGLE DU MODE, et les règles se disent.
          (n === 151 ? pistesHtml(partie, n) : "") +
          '<div class="pkdx-actions"><button type="button" class="pkdx-touche" id="pkdx-retour">' + T("fermer") + "</button></div>";
        hote.querySelector("#pkdx-retour").addEventListener("click", rendre);
        return;
      }
      var r = rapports(e.types);
      // ═══════════════════════════════════════════════════════════════════════
      //  LA PRISE D'UN VOYAGE PASSÉ COMPTE AUTANT QUE CELLE D'AUJOURD'HUI
      //
      //  🔴 `etatDe()` marque « pris » sur le COMPTE (ligne 147) — mais la
      //     fiche ne lisait que `partie.pris`. Un Nidoran attrapé au voyage
      //     d'avant s'affichait donc en « pris »… avec, dessous, les PISTES
      //     pour aller le chercher. Le Pokédex expliquait où trouver ce qu'on
      //     possédait déjà, et taisait le seul souvenir qu'il gardait de lui.
      //  ⚠️ Le voyage EN COURS passe devant : c'est le plus frais, et c'est
      //     lui qui porte le niveau réellement atteint.
      var compte = W.PokeProgression ? W.PokeProgression.lire() : { pris: {}, chromatiques: {} };
      var pr = partie.pris[n] || (compte.pris || {})[n] || null;
      var dAvant = !partie.pris[n] && pr;
      var lieu = pr && ETAPES() ? (function () {
        for (var i = 0; i < ETAPES().length; i++) {
          // 🔴 PLUS DE REPLI SUR `pr.zone`. C'est lui qui écrivait « Attrapé à
          //    evolution » : une clé de code, sans accent, dans une phrase
          //    montrée au joueur. `null` ici, et la phrase se choisit ailleurs.
          if (ETAPES()[i].id === pr.zone) return (LIEUX()[ETAPES()[i].lieu] || {})[LANG()] || null;
        }
        return null;
      })() : null;

      hote.innerHTML =
        // ── ON PEUT L'ENTENDRE ──────────────────────────────────────────────
        // 🔴 CENT CINQUANTE ET UN CRIS PORTÉS, ET ON N'EN ENTENDAIT QU'EN
        //    COMBAT. La voix d'un Pokémon est une part de son identité au
        //    moins autant que son dessin — et la fiche du Pokédex est
        //    exactement l'endroit où l'on vient regarder une créature de
        //    près. Le bouton la rend audible à la demande.
        // 🔴 SEULEMENT CE QU'ON A CROISÉ. Faire crier une espèce jamais vue
        //    donnerait une information que le Pokédex refuse par ailleurs de
        //    donner — le nom même reste caché tant qu'on ne l'a pas croisée.
        '<h1 class="pkdx-titre">N° ' + n + " · " + esc(e.nom[LANG()]) +
          (W.PokeSon ? ' <button type="button" class="pkdx-cri" id="pkdx-cri"' +
            ' aria-label="' + T("ecouterCri") + '" title="' + T("ecouterCri") + '">' +
            W.PokeIcones.svg("son", { taille: 16 }) + "</button>" : "") +
        "</h1>" +
        '<div class="pkdx-fiche-haut">' +
          // L'artwork officiel se charge à la demande ; sans lui, le sprite
          // d'époque tient le rôle. Un 404 ne doit jamais laisser un trou.
          '<img class="pkdx-portrait" alt="' + esc(e.nom[LANG()]) + '" data-etat="' + etat + '"' +
            ' src="assets/img/poke/art/' + n + '.webp" ' +
            'onerror="this.onerror=null;this.src=\'' + W.PokeSprites.face(n, "?i=6") + '\';this.classList.add(\'est-sprite\')">' +
          '<div class="pkdx-fiche-cle">' +
            "<p>" + esc(e.genre[LANG()]) + "</p>" +
            "<p>" + e.types.map(function (t) { return pastille(t); }).join(" ") + "</p>" +
            // La taille et le poids sont les deux seules décimales que le mode
            // MONTRE. Elles passent par la porte de langue, comme les accords.
            "<p>" + T("taille") + " " + W.PokeGenre.decimal(e.taille / 10) + " m · " +
              T("poids") + " " + W.PokeGenre.decimal(e.poids / 10) + " kg</p>" +
          "</div>" +
        "</div>" +
        // 🔴 La notice est celle du jeu, mot pour mot. On ne la réécrit pas.
        '<p class="pkdx-notice">' + esc(e.dex[LANG()] || T("inconnu")) + "</p>" +
        (etat === "vu" ? "<p>" + T("vuPas") + "</p>" : "") +
        (pr ? "<p>" + provenance(pr, lieu, dAvant) + "</p>" : "") +
        // 🔴 UNE CHANCE SUR 8192 QUI NE LAISSE AUCUNE TRACE N'EST PAS UNE
        //    CHANCE. La date de l'éclat était rangée dans le compte depuis le
        //    premier jour, et personne ne la relisait : la seule ligne de la
        //    fiche qui raconte quelque chose au joueur.
        (function () {
          var c = (compte.chromatiques || {})[n];
          if (!c) return "";
          return '<p class="pkdx-eclat-dit">' +
            (c.quand ? T("eclatVu", { d: jour(c.quand) }) : T("eclatSansDate")) + "</p>";
        })() +
        // ═══════════════════════════════════════════════════════════════════
        // 🔴 LE POKÉDEX DISAIT CE QUI MANQUE ET JAMAIS OÙ LE CHERCHER. La ligne
        //    ci-dessus — « Attrapé à Mont Sélénité, niveau 12 » — ne s'affiche
        //    que pour ce qu'on POSSÈDE. Le filtre « MANQUANTS » listait donc
        //    des silhouettes muettes : le joueur voyait son trou sans la
        //    moindre piste pour le combler. Une collection sans piste est un
        //    score, pas une collection.
        //    Les pistes se CALCULENT sur les tables du monde, les échanges, le
        //    casino, les cadeaux, les fossiles et les chaînes d'évolution.
        // ═══════════════════════════════════════════════════════════════════
        // ═══════════════════════════════════════════════════════════════════
        //  🔴 UNE ESPÈCE HORS VERSION RENDAIT UNE FICHE MUETTE. `pistesHtml`
        //     interroge les tables de la version tirée ; en Rouge sur une
        //     exclusivité Bleue la liste est vide et la fonction rendait `""` —
        //     pas de titre « OÙ LE TROUVER », pas un mot. Le filtre MANQUANTS
        //     alignait donc des silhouettes dont certaines sont hors d'atteinte
        //     À VIE, sans rien qui les distingue.
        //  🔴 ET LA RÉPONSE ÉTAIT ÉCRITE DEUX FOIS SANS LECTEUR : la fonction
        //     `horsVersion` et sa phrase existaient, personne ne les appelait.
        //     Contenu écrit et jamais montré, en double.
        //  ⚠️ LA PHRASE NE PROMET PAS L'AUTRE VERSION : c'est le piège que le
        //     commentaire du dessus nomme — un joueur qui croirait qu'il « lui
        //     manque juste l'autre cartouche » se tromperait de jeu.
        // ═══════════════════════════════════════════════════════════════════
        (!pr && horsVersion(partie, n)
          ? '<h2 class="pkdx-titre">' + T("pistes") + "</h2>" +
            // ⚠️ `PokeGenre.version` est la porte qui nomme une version — celle
            //    que l'écran de départ emploie déjà. Pas de seconde table.
            '<p class="pkdx-dit est-alerte">' +
              T("horsVersion", { v: W.PokeGenre.version(partie.version) }) + "</p>"
          : !pr ? pistesHtml(partie, n) : "") +
        '<h2 class="pkdx-titre">' + T("faible") + "</h2><p>" +
          (r.faible.map(function (x) { return pastille(x.t, x.m > 2 ? " ×4" : ""); }).join(" ") || "—") + "</p>" +
        '<h2 class="pkdx-titre">' + T("resiste") + "</h2><p>" +
          (r.resiste.map(function (x) { return pastille(x.t, x.m < 0.5 ? " ×¼" : ""); }).join(" ") || "—") + "</p>" +
        (r.immune.length ? '<h2 class="pkdx-titre">' + T("immune") + "</h2><p>" + r.immune.map(function (t) { return pastille(t); }).join(" ") + "</p>" : "") +
        (e.evolue && e.evolue.length ? '<h2 class="pkdx-titre">' + T("evolue") + "</h2><p>" +
          e.evolue.map(function (ev) {
            var cible = ESPECE(ev.vers);
            var comment = ev.par === "niveau" ? T("parNiveau", { n: ev.niveau })
              : ev.par === "pierre" ? T("parPierre", { o: nomPierre(ev.objet) }) : T("parEchange");
            // Le nom de la forme évoluée reste caché tant qu'on ne l'a pas
            // croisée : c'est une découverte, pas une fiche technique.
            var nomCible = etatDe(partie, ev.vers) === "inconnu" ? "———" : cible.nom[LANG()];
            return esc(nomCible) + " " + comment;
          }).join(" · ") + "</p>" : "") +
        '<div class="pkdx-actions"><button type="button" class="pkdx-touche" id="pkdx-retour">' + T("fermer") + "</button></div>";
      hote.querySelector("#pkdx-retour").addEventListener("click", rendre);
      var cri = hote.querySelector("#pkdx-cri");
      if (cri) {
        cri.addEventListener("click", function () { W.PokeSon.cri(n); });
        // On la fait entendre en arrivant : c'est la présentation de la
        // créature, et un bouton qu'il faut deviner ne se presse jamais.
        W.PokeSon.cri(n);
      }
    }

    var PIERRES = {
      FIRE_STONE: { fr: "Pierre Feu", en: "Fire Stone" }, WATER_STONE: { fr: "Pierre Eau", en: "Water Stone" },
      THUNDER_STONE: { fr: "Pierre Foudre", en: "Thunder Stone" }, LEAF_STONE: { fr: "Pierre Plante", en: "Leaf Stone" },
      MOON_STONE: { fr: "Pierre Lune", en: "Moon Stone" }, SUN_STONE: { fr: "Pierre Soleil", en: "Sun Stone" },
    };
    function nomPierre(o) { return (PIERRES[o] || { fr: o, en: o })[LANG()]; }

    rendre();
  }

  W.PokePokedex = { ouvrir: ouvrir, rapports: rapports, etatDe: etatDe };
})(window, document);
