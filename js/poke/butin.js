(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE BUTIN — TROIS CARTES APRÈS CHAQUE COMBAT GAGNÉ
  //
  //  ⚠️ « APRÈS CHAQUE NŒUD » : C'EST CE QUE DISAIT CE TITRE, ET C'EST FAUX.
  //     Mesuré en jouant le 09/08 : le butin ne sort QU'APRÈS UNE VICTOIRE —
  //     ni après une trouvaille, ni après une fuite, ni après une boutique.
  //     C'est le bon dessin — un roguelite récompense le combat, pas le
  //     déplacement — mais un titre qui promet plus que le code envoie relire
  //     un défaut qui n'existe pas, ou pire, « corriger » en noyant le jeu.
  //
  //  🔴 CE QUI MANQUAIT AU JEU, ET C'ÉTAIT LE PLUS IMPORTANT. On battait un
  //     dresseur, on recevait de l'argent, et c'était tout. Aucune décision,
  //     aucune surprise, aucune raison de relancer une partie.
  //
  //     Les roguelites qui accrochent — Slay the Spire, et côté Pokémon le
  //     PokéRogue — ont tous la même boucle : CHAQUE combat se termine par un
  //     choix de récompense. Ce n'est pas la récompense qui accroche, c'est le
  //     CHOIX : trois cartes, on en prend une, on renonce aux deux autres.
  //     C'est la même grammaire que la carte à embranchements, à l'échelle du
  //     combat au lieu de l'acte.
  //
  //  🔴 ET LE VOCABULAIRE RESTE CANON. Aucun objet inventé : les 50 CT de la
  //     première génération, les vitamines, les Balls, les soins, l'argent, le
  //     Super Bonbon. Un Racaillou avec Séisme n'est pas le même Pokémon qu'un
  //     Racaillou sans — la variété de build existait déjà dans le ROM, elle
  //     n'était simplement pas distribuée.
  //
  //  🔴 TOUT TIRAGE PASSE PAR LA GRAINE. Au Défi du jour, tout le monde reçoit
  //     les mêmes offres — sinon la comparaison ne vaut rien, et c'est ce que
  //     vérifie `poke-rng.mjs`.
  // ═══════════════════════════════════════════════════════════════════════════

  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  // ⚠️ PAR LE REGISTRE, comme partout : le repli protège un chargement partiel.
  var ATT = function () { return W.PokeRegles ? W.PokeRegles.attaques() : W.POKE_ATTAQUE_PAR_CLE; };

  // ── LES TROIS CANNES, DANS L'ORDRE ─────────────────────────────────────────
  //  Les clés et les noms viennent de `POKE_OBJETS` — Canne, Super Canne, Méga
  //  Canne — comme tout le reste du sac. L'acte minimal suit la progression du
  //  jeu d'origine : la Canne à Azuria, la Super Canne à Parmanie, la Méga
  //  Canne sur la Route 12. On garde l'échelle, pas les coordonnées.
  var CANNES = [
    { objet: "OLD_ROD", acte: 2 },
    { objet: "GOOD_ROD", acte: 4 },
    { objet: "SUPER_ROD", acte: 6 },
  ];

  // 🔴 LA PORTE UNIQUE : la carte de butin, l'écran de pêche et le contrôle
  //    lisent tous cette échelle. Deux listes finiraient par diverger, et la
  //    divergence se lirait comme « la Méga Canne ne sert à rien ».
  function canneDe(p) {
    var meilleure = null;
    for (var i = 0; i < CANNES.length; i++) {
      if (p.sac && p.sac[CANNES[i].objet]) meilleure = CANNES[i].objet;
    }
    return meilleure;
  }

  function canneSuivante(p, acte) {
    for (var i = 0; i < CANNES.length; i++) {
      if (p.sac && p.sac[CANNES[i].objet]) continue;
      return (acte || 1) >= CANNES[i].acte ? CANNES[i].objet : null;
    }
    return null;
  }

  // La RARETÉ décide de la fréquence et de la couleur. Trois crans, pas plus :
  // au-delà, le joueur ne compare plus, il subit une liste.
  var COMMUN = "commun", RARE = "rare", LEGENDAIRE = "legendaire";

  // ── Ce qu'une carte peut être ───────────────────────────────────────────────
  //  Chaque famille sait dire si elle est PERTINENTE : proposer une CT que
  //  personne ne peut apprendre, c'est une carte morte, et une carte morte
  //  transforme un choix à trois en choix à deux sans le dire.
  var FAMILLES = {
    // ── L'argent ────────────────────────────────────────────────────────────
    argent: {
      rarete: COMMUN, poids: 14,
      tirer: function (p, h, acte) {
        var base = 400 + acte * 260;
        return { type: "argent", montant: base + h.entier(base / 2) };
      },
      poser: function (p, c) { p.argent += c.montant; },
    },

    // ── Les Balls ───────────────────────────────────────────────────────────
    balls: {
      rarete: COMMUN, poids: 16,
      tirer: function (p, h, acte) {
        // La qualité suit l'avancement : la Hyper Ball n'arrive pas à l'acte 1.
        var cle = acte >= 6 ? "ULTRA_BALL" : acte >= 3 ? "GREAT_BALL" : "POKE_BALL";
        return { type: "objet", objet: cle, n: h.entre(3, 6) };
      },
      poser: function (p, c) { p.sac[c.objet] = (p.sac[c.objet] || 0) + c.n; },
    },

    // ── Les soins ───────────────────────────────────────────────────────────
    soins: {
      rarete: COMMUN, poids: 13,
      tirer: function (p, h, acte) {
        var cle = acte >= 6 ? "HYPER_POTION" : acte >= 3 ? "SUPER_POTION" : "POTION";
        return { type: "objet", objet: cle, n: h.entre(2, 4) };
      },
      poser: function (p, c) { p.sac[c.objet] = (p.sac[c.objet] || 0) + c.n; },
    },

    // ── Les remèdes d'état ──────────────────────────────────────────────────
    //  🔴 IL N'EN TOMBAIT AUCUN, ET C'EST CE QUI RENDAIT LA SECONDE MOITIÉ DU
    //     JEU INFRANCHISSABLE. Mesuré sur 300 voyages : l'écart de niveau
    //     devant les Champions est de ±3 au plus — ce n'est donc PAS un
    //     problème de puissance. Mais le taux de victoire s'effondre à 7 %
    //     devant Erika et 3 % devant Koga, avec un avantage de niveau.
    //
    //     La raison tient au relevé de leurs équipes : Rafflesia porte Poudre
    //     Dodo et Poudre Toxik, Koga aligne quatre Poison dont trois qui
    //     empoisonnent à chaque coup, Morgane confuse. Une créature endormie
    //     ne joue pas, une créature empoisonnée fond entre deux combats — et
    //     le butin ne distribuait que des Potions, qui ne lèvent aucun état.
    //     Le jeu punissait un manque qu'il ne permettait pas de combler.
    //
    //  🔴 ILS ARRIVENT À L'ACTE 3, juste avant Erika. Plus tôt, ils dormiraient
    //     au sac ; plus tard, ils arriveraient après le mur. Total Soin lève
    //     tout et devient la carte des actes tardifs, quand Koga et Morgane
    //     posent trois états différents dans le même combat.
    remede: {
      rarete: COMMUN, poids: 10,
      utile: function (p, h, acte) { return (acte || 1) >= 3; },
      tirer: function (p, h, acte) {
        if ((acte || 1) >= 6) return { type: "objet", objet: "FULL_HEAL", n: h.entre(2, 3) };
        var choix = ["ANTIDOTE", "AWAKENING", "PARLYZ_HEAL", "FULL_HEAL"];
        return { type: "objet", objet: h.dans(choix), n: h.entre(2, 3) };
      },
      poser: function (p, c) { p.sac[c.objet] = (p.sac[c.objet] || 0) + c.n; },
    },

    // ── Le Rappel ───────────────────────────────────────────────────────────
    rappel: {
      rarete: RARE, poids: 7,
      tirer: function (p, h) { return { type: "objet", objet: "REVIVE", n: h.entre(1, 2) }; },
      poser: function (p, c) { p.sac[c.objet] = (p.sac[c.objet] || 0) + c.n; },
    },

    // ── Les vitamines ───────────────────────────────────────────────────────
    //  🔴 Elles s'appuient sur les POINTS D'EFFORT du jeu d'origine, qui
    //     existaient déjà dans le moteur sans que rien ne les alimente hors
    //     combat. Une vitamine est donc un gain PERMANENT et canon.
    vitamine: {
      rarete: RARE, poids: 9,
      // 🔴 LA STATISTIQUE SE LIT DANS `VITAMINES`, ELLE NE SE RECOPIE PAS. Ces
      //    cinq paires vivaient ici ET dans `obtenir.js` : deux tables pour une
      //    règle, et le jour où l'une bouge, la carte annonce « Défense » là où
      //    l'objet monte l'Attaque. Le joueur paierait 9 800 ₽ sur la foi d'une
      //    phrase fausse.
      // 🔴 LE TIRAGE NE CHANGE PAS : un `dans()` sur cinq clés, dans l'ordre de
      //    la table — le même index rend le même objet. Le contrat de rejeu
      //    tient, et `poke-rng.mjs` le vérifie.
      tirer: function (p, h) {
        var table = W.PokeObtenir.VITAMINES;
        var cle = h.dans(Object.keys(table));
        return { type: "vitamine", objet: cle, stat: table[cle] };
      },
      utile: function (p) { return p.equipe.length > 0; },
      poser: function (p, c) { p.sac[c.objet] = (p.sac[c.objet] || 0) + 1; },
    },

    // ── L'EXP.ALL ───────────────────────────────────────────────────────────
    //  🔴 LA CARTE QUI CHANGE UN VOYAGE, ET ELLE N'EXISTAIT PAS. Sans elle,
    //     seuls les combattants gagnent de l'expérience — c'est la règle du
    //     jeu d'origine — et une équipe finit avec une tête à 43 et trois
    //     Pokémon aux niveaux où on les a attrapés. Mesuré devant Koga.
    //  🔴 ELLE NE SE TIRE QU'UNE FOIS. `utile` refuse la carte à qui la porte
    //     déjà : une seconde n'ajouterait rien, et une carte sans effet dans un
    //     choix à trois vole une option au joueur.
    //  🔴 ET PAS AVANT L'ACTE 3. Trop tôt, elle dilue l'expérience quand
    //     l'équipe n'a qu'un ou deux Pokémon et rend le début plus dur.
    expAll: {
      // ⚠️ POIDS 14, PAS 7 — l'autre moitié du goulot, et le deuxième plus
      //    gros levier jamais mesuré du mode (après le correctif du Multi Exp
      //    lui-même en v385). À poids 7 la carte arrivait à l'acte 3,7 ; à 14
      //    elle arrive à 3,3 et TOUT le voyage en profite (A/B, n=400) :
      //    8 badges 31,3 → 44,1 %, Morgane 34 → 47 % — l'équipe arrive enfin
      //    construite (« à la hauteur » 2,5 → 3,3 sur 6). Elle ne se tire
      //    qu'UNE fois par voyage : doubler son poids avance sa date sans
      //    jamais doubler sa présence. Et c'est le harnais qui la prend à
      //    chaque offre — un joueur choisit parmi trois, l'adoption réelle
      //    sera moindre que la mesure.
      rarete: RARE, poids: 14,
      tirer: function () { return { type: "objet", objet: "EXP_ALL" }; },
      // 🔴 ÉCRITE `(p, acte)` LÀ OÙ LA SIGNATURE EST `(p, h, acte)` : l'acte
      //    valait le TIRAGE, `>= 3` était faux à tous les coups, et cette carte
      //    — présentée trois lignes plus haut comme « la carte qui change un
      //    voyage » — n'a JAMAIS été proposée à personne. Tout le mécanisme de
      //    partage d'expérience qu'elle alimente était donc mort avec elle.
      //    Trouvée le 08/08 par un contrôle qui COMPTE les familles sorties.
      //    Deux cartes portaient la même faute, écrite à deux jours d'écart.
      utile: function (p, h, acte) {
        // 🔴 « PAS AVANT L'ACTE 3 » DATAIT D'AVANT LA v385 — quand le Multi
        //    Exp. DIVISAIT l'expérience du combattant. Depuis, le combattant
        //    garde tout et la troupe reçoit une demi-part : la dilution que ce
        //    garde-fou redoutait n'existe plus.
        //    Et l'attrition mesurée désignait ce retard : 42 % des débutants
        //    meurent à l'ACTE 2 (21 % des compétents — le pic des deux), avec
        //    « 1,1 Pokémon à la hauteur sur 4,9 » devant Ondine — la carte qui
        //    construit l'équipe arrivait à l'acte 4,3 en moyenne, deux actes
        //    trop tard. Ouverte dès l'acte 2 (A/B, n=400) : Ligue 10,3 → 12,2 %,
        //    Ondine 45 → 48 %, arrivée 4,3 → 3,7. L'attrition de l'acte 2 ne
        //    bouge pas encore : la carte reste RARE, il faut la TIRER — la
        //    date d'ouverture n'était que la moitié du goulot.
        // 🔴 OUVERTE DÈS L'ACTE 1 (`>= 1`, A/B n=500). Elle exige déjà DEUX
        //    Pokémon en équipe, donc elle ne s'active pas au tout début — mais
        //    dès qu'on a capturé, elle peut être TIRÉE plus tôt : arrivée
        //    3,3 → 2,7. Ce n'est toujours PAS le mur de l'acte 2 qui bouge
        //    (Ondine 52 → 54 % — le goulot y est la COUVERTURE de type, 8 %) :
        //    ce qui remonte, ce sont les CREUX du mid-game, là où l'arrière a eu
        //    le temps de monter — arène 5 (Koga) 69 → 76 %, arène 6 (Erika)
        //    45 → 50 %, 8 badges ~46 → ~53 %, Ligue ~13 → ~18 % (variance haute).
        //    Les arènes déjà faciles (3, 7, 8 à 95-98 %) ne bougent pas : le
        //    profil se LISSE au lieu de se trivialiser. C'est un gain de
        //    complétion, pas une baisse de difficulté générale.
        return (acte || 1) >= 1 && p.equipe.length > 1 && !(p.sac && p.sac.EXP_ALL);
      },
      poser: function (p, c) { p.sac[c.objet] = (p.sac[c.objet] || 0) + 1; },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  LA CANNE — LA CARTE QUI OUVRE UN TYPE DE NŒUD
    //
    //  🔴 SEIZE ESPÈCES VIVAIENT DANS DES TABLES QUE RIEN N'OUVRAIT. Les trois
    //     cannes existent dans `POKE_OBJETS` (Canne, Super Canne, Méga Canne),
    //     les trois tables de pêche existent dans `POKE_PECHE`, et le Pokédex
    //     COMPTAIT leurs espèces dans « atteignables » — mais aucun nœud ne
    //     pêchait. Mesuré le 08/08 : HUIT espèces par version étaient déclarées
    //     atteignables et impossibles à attraper, dont Magicarpe et Minidraco,
    //     donc Léviator et Dracolosse avec elles. Le dénominateur du Pokédex
    //     mentait à tout le monde depuis le premier jour.
    //
    //  🔴 ET C'EST LA MEILLEURE CARTE DE BUTIN QU'ON PUISSE ÉCRIRE. Elle ne
    //     donne pas un objet : elle OUVRE UN TYPE DE NŒUD pour le reste du
    //     voyage, et chaque cran donne de meilleures espèces. C'est le seul
    //     choix du butin dont l'effet se voit sur la carte elle-même.
    //
    //  🔴 UN CRAN À LA FOIS, ET DANS L'ORDRE. Proposer la Méga Canne à l'acte 2
    //     effacerait les deux autres et supprimerait la progression ; proposer
    //     une canne qu'on a déjà volerait une option dans un choix à trois.
    // ═══════════════════════════════════════════════════════════════════════
    canne: {
      rarete: RARE, poids: 8,
      tirer: function (p, h, acte) { return { type: "objet", objet: canneSuivante(p, acte) }; },
      // 🔴 LA SIGNATURE EST `(p, h, acte)`, ET JE L'AI ÉCRITE `(p, acte)`. L'acte
      //    valait donc le tirage — un objet — et la comparaison `>= 2` était
      //    fausse à tous les coups : la carte n'est JAMAIS sortie, sur 1 800
      //    tirages. C'est mot pour mot la faute documentée vingt lignes plus
      //    bas, celle qui avait déjà tué les remèdes d'état. Trouvée en
      //    COMPTANT, pas en relisant — une carte qui ne sort jamais ne lève
      //    aucune erreur et ressemble à un tirage malchanceux.
      utile: function (p, h, acte) { return !!canneSuivante(p, acte); },
      poser: function (p, c) { p.sac[c.objet] = 1; },
    },

    // ── Le Super Bonbon ─────────────────────────────────────────────────────
    bonbon: {
      rarete: RARE, poids: 6,
      tirer: function () { return { type: "objet", objet: "RARE_CANDY", n: 1 }; },
      utile: function (p) { return p.equipe.length > 0; },
      poser: function (p, c) { p.sac[c.objet] = (p.sac[c.objet] || 0) + c.n; },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  UNE CAPSULE TECHNIQUE — ET C'EST UN CHOIX, PAS UN TIRAGE
    //
    //  🔴 LA CARTE QUI CHANGE UNE PARTIE. On ne propose QUE des machines que
    //     l'équipe peut réellement apprendre : une CT inapprenable serait une
    //     carte morte, et un choix à trois qui n'en offre que deux.
    //
    //  🔴 ELLE TIRAIT UNE MACHINE AU HASARD PARMI CINQUANTE, ET LE MODE
    //     CONSEILLAIT UN PLAN QUE SA PROPRE DISTRIBUTION RENDAIT INAPPLICABLE.
    //     L'écran d'arène dit « son équipe craint : EAU — 3 sur 3 » depuis le
    //     premier jour, et le harnais mesure ce que ça vaut : **78 % de
    //     victoires avec au moins une réponse de type, 60 % sans** (n=400,
    //     2 823 affrontements). Dix-huit points. Mais la colonne « couverture »
    //     du même rapport dit à quelle fréquence la réponse existe : **8 %
    //     devant Ondine**, 1 % à l'arène 3, 9 % chez Koga.
    //     Le joueur frappait presque jamais en super efficace, et la seule
    //     source de couverture avant l'acte 4 — le rayon des machines n'ouvre
    //     qu'à Céladopole — était cette carte, tirée à l'aveugle.
    //
    //  🔴 ET C'EST LE SEUL LEVIER DE TYPE QUI PUISSE MARCHER ICI. Sept mesures
    //     ont tranché que ce mode est dominé par son économie d'expérience :
    //     ajouter un corps qui répond au type COÛTE plus qu'il ne rapporte
    //     (compagnon : 8 badges 34,4 → 28,8 %), l'ÉCHANGER ne coûte rien (PC de
    //     Léo : 34 → 38 %). Une capsule ARME UN CORPS DÉJÀ LÀ — elle ne prélève
    //     pas un point d'expérience. C'est la forme qui a le droit d'agir.
    //
    //  ✅ Trois machines, une seule est gardée, et chacune dit ce qu'elle vaut
    //     contre le Champion qui ferme l'acte. Même forme que la carte d'acquis
    //     — un RANG tiré en un seul appel, déplié par `PokeChoix.deRang` — et
    //     pour la même raison : `h.dans()` trois fois décalerait le flux de
    //     tirages, et le serveur refuserait le score du Défi du jour.
    //  ⚠️ `poser` ne pose RIEN : c'est l'écran de choix qui applique, après que
    //     le joueur a tranché. Exactement comme l'acquis depuis la v410.
    // ═══════════════════════════════════════════════════════════════════════
    ct: {
      // 🔴 18 → 13 (13/08, rapport testeur contresigné : « BCP TROP DE CT »,
      //    dosé par A/B). Mesuré à 18 : 1,8 capsule APPRISE par voyage — la
      //    plus lourde des rares noyait sa propre valeur. Mesuré à 8 : le
      //    sommet s'effondre (60 → 46 %, médiane optimale 5/8) — la carte
      //    porte la SEULE couverture de type d'avant l'acte 4, comme l'en-tête
      //    de ce bloc l'annonce. 15 est le point mesuré qui allège la pluie (13 écrasait la médiane hasard à 1 avec les hissés évolués)
      //    SANS casser la couverture. Le rayon de Céladopole reste la source
      //    voulue du milieu de partie.
      rarete: RARE, poids: 15,
      utile: function (p) { return apprenables(p).length > 0; },
      tirer: function (p, h) {
        var possibles = apprenables(p);
        if (!possibles.length) return null;
        return { type: "ct", rang: h.entier(W.PokeChoix.combien(possibles.length)) };
      },
      poser: function () {},
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  L'ACQUIS — LA SEULE CARTE QUI NE SE DÉPENSE PAS
    //
    //  🔴 TOUT LE RESTE DE CE FICHIER EST CONSOMMABLE. Des Balls, des soins, de
    //     l'argent, une capsule : on les dépense, et à la fin du voyage il n'en
    //     reste rien. C'est pour ça que deux voyages joués à la suite se
    //     ressemblaient — rien ne s'empilait, donc aucun ne prenait d'identité.
    //     L'acquis est PERMANENT, il se CUMULE, et on le CHOISIT contre deux
    //     autres. C'est le pilier que le mode n'avait pas.
    //
    //  🔴 POIDS 5, ET C'EST MESURÉ, PAS VISÉ. Premier jet à 9 : **4,30 acquis
    //     par voyage** sur une liste de neuf — la moitié du vivier à chaque
    //     partie, donc deux voyages de suite portaient presque les mêmes, et
    //     l'identité qu'on cherchait à créer se dissolvait dans la répétition.
    //     Un système qui se collectionne entièrement cesse d'être un choix.
    //  ⚠️ `utile` refuse la carte quand il n'en reste aucun à prendre : une
    //     carte sans effet dans un choix à trois vole une option au joueur.
    // ═══════════════════════════════════════════════════════════════════════
    acquis: {
      rarete: LEGENDAIRE, poids: 5,
      utile: function (p) {
        return !!(W.PokeAcquis && W.PokeAcquis.ouverts(p).length);
      },
      // 🔴 LA CARTE PORTE UN CHOIX, PLUS UN LOT. Elle tirait UN acquis au
      //    hasard alors que le pilier est défini — ici même, trois lignes plus
      //    haut — comme « choisi, on renonce à deux autres ». `PokeAcquis.offrir`
      //    existait pour ça et n'était appelée nulle part : la décision était
      //    conçue, documentée, et jamais offerte. Sans elle, deux voyages qui
      //    tirent les mêmes cartes sont identiques.
      // ⚠️ UN SEUL TIRAGE, ET C'EST LA CONDITION POUR QUE ÇA PARTE. `offrir`
      //    en consomme trois : le rejeu serveur aurait divergé et les scores
      //    auraient été refusés. On tire donc un RANG parmi les triplets
      //    possibles — `h.entier` appelle `brut()` une fois quelle que soit sa
      //    borne — et `PokeAcquis.triplet` le déplie sans toucher au hasard.
      tirer: function (p, h) {
        var v = W.PokeAcquis ? W.PokeAcquis.ouverts(p) : [];
        if (!v.length) return null;
        return { type: "acquis", rang: h.entier(W.PokeAcquis.combien(v.length)) };
      },
      // ⚠️ RIEN À POSER : c'est le joueur qui pose, depuis l'écran de choix, et
      //    son geste est journalisé pour que le rejeu le suive. Appliquer ici
      //    reviendrait à décider à sa place.
      poser: function () {},
    },

    // ── La pierre d'évolution ───────────────────────────────────────────────
    //  Elle ne sort que si QUELQU'UN dans l'équipe peut s'en servir. Une pierre
    //  sans destinataire est un objet décoratif.
    pierre: {
      rarete: LEGENDAIRE, poids: 5,
      utile: function (p) { return pierresUtiles(p).length > 0; },
      tirer: function (p, h) {
        var u = pierresUtiles(p);
        if (!u.length) return null;
        return { type: "objet", objet: h.dans(u), n: 1 };
      },
      poser: function (p, c) { p.sac[c.objet] = (p.sac[c.objet] || 0) + c.n; },
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  UNE MACHINE NE DEVANCE PLUS LA COURBE DE L'ÉQUIPE
  //
  //  🔴 « JE ME RETROUVE AVEC DÉFLAGRATION AU NIVEAU 20 AVEC REPTINCEL » — le
  //     propriétaire, 18/08. Mesuré sur 300 voyages avant de toucher quoi que
  //     ce soit : à l'ACTE 1, 156 capsules posées, puissance moyenne **77**,
  //     sur des porteurs de **niveau 15**. 84 machines à 5 000 ₽ posées, dont
  //     **69 aux actes 1-4**. Et 91 coups de 100 de puissance ou plus posés sur
  //     un porteur de niveau 30 ou moins. La plainte est exacte.
  //
  //  ⚠️ LE JEU D'ORIGINE N'A AUCUN VERROU DE NIVEAU SUR LES CT — un Salamèche
  //     niveau 5 apprend n'importe quelle machine de sa liste. Ce qui retient
  //     Déflagration en 1996, c'est OÙ elle se trouve : le Manoir de Cramois'Île,
  //     septième badge. La règle fidèle n'est donc pas « à partir du niveau X »
  //     mais « à partir de l'endroit où le canon la pose » — ici, l'ACTE.
  //
  //  🔴 ET CE N'EST PAS LE PRIX DU ROM QUI EN DÉCIDE, MESURÉ AUSSI : il classe
  //     l'UTILITÉ, pas la puissance. Toxik vaut 4 000 ₽ pour 0 de puissance,
  //     Tonnerre 2 000 ₽ pour 95, Destruction 2 000 ₽ pour 130. Un plafond par
  //     prix aurait laissé passer Destruction à l'acte 1 et verrouillé
  //     Laser Glace jusqu'à l'acte 6 — l'inverse exact de ce qu'on cherche.
  //
  //  ✅ LE PLAFOND PORTE SUR LA PUISSANCE, ET IL EST DÉDUIT DE LA COURBE
  //     NATURELLE. Meilleur coup appris PAR NIVEAU, sur les 151 espèces, aux
  //     niveaux que ce mode atteint vraiment acte par acte (relevé du harnais) :
  //
  //         acte 1 (N.15) médiane 40, p75 50 · acte 3 (N.29) 50 / 65
  //         acte 5 (N.45) 70 / 90            · acte 6 (N.57) 90 / 120
  //
  //     Le palier 120 — Déflagration, Blizzard, Fatal-Foudre, Lance-Soleil,
  //     Ultralaser, Destruction — est ce que l'équipe atteint SEULE vers
  //     l'acte 6. C'est là qu'il s'ouvre, et pas avant.
  //
  //  ⚠️ LA COUVERTURE DE TYPE PASSE AVANT LA PURETÉ DU PLAFOND. L'en-tête de la
  //     carte le dit : elle porte la SEULE réponse de type d'avant l'acte 4, et
  //     un A/B a déjà mesuré qu'en la resserrant trop « le sommet s'effondre ».
  //     Or le ROM n'offre AUCUN coup électrique ni glace en dessous de 95
  //     (Tonnerre, Laser Glace). Un plafond à 65 les effacerait tous les deux
  //     jusqu'à l'acte 5 — donc devant Ondine, le mur d'eau, on n'aurait plus
  //     rien. Le premier palier est donc à 95 : il laisse passer les réponses de
  //     type, il coupe le palier des 120.
  //  ⚠️ LES COUPS SANS PUISSANCE NE SONT JAMAIS RETENUS — Toxik, Cage-Éclair,
  //     Danse-Lames, Reflet, Repos. Ils ne créent aucun écart de puissance, et
  //     ce sont eux qui font les plans qui ne sont pas « frapper plus fort ».
  //  ⚠️ ET LE COMPTOIR DE CÉLADOPOLE N'EST PAS CONCERNÉ. Ses neuf machines sont
  //     posées par le canon à un endroit précis, elles s'ACHÈTENT, et ce prix
  //     est déjà leur verrou. Ce plafond ne vaut que pour la carte de butin —
  //     la seule source que ce mode a inventée, et la seule qui pleuvait.
  // ═══════════════════════════════════════════════════════════════════════════
  var PLAFOND_CT = [95, 95, 100, 100, 100, 0, 0, 0, 0];

  //  🔴 EXPOSÉE, parce que le harnais d'équilibrage doit pouvoir la remplacer
  //     pour rejouer le témoin. Une seconde copie du barème dans l'outil
  //     divergerait de celui-ci au premier réglage.
  function plafondCT(acte) {
    var a = (acte | 0) - 1;
    if (a < 0) a = 0;
    if (a >= PLAFOND_CT.length) return 0;
    return PLAFOND_CT[a] || 0;      // 0 = aucun plafond
  }

  // Les CT que l'équipe peut apprendre, qu'on n'a pas déjà, et que l'acte
  // autorise.
  function apprenables(p) {
    var out = [];
    var cap = W.PokeButin.plafondCT(p.acte || 1);
    for (var i = 0; i < W.POKE_CT.length; i++) {
      var m = W.POKE_CT[i];
      if (p.ct && p.ct[m.n]) continue;
      if (cap) {
        var att = ATT() ? ATT()[m.cle] : null;
        if (att && (att.puissance || 0) > cap) continue;
      }
      for (var k = 0; k < p.equipe.length; k++) {
        var e = ESP()[p.equipe[k].n];
        if (e && e.ct && e.ct.indexOf(m.cle) >= 0) { out.push(m); break; }
      }
    }
    return out;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES TROIS MACHINES QU'UNE CARTE MET EN JEU — PORTE UNIQUE
  //
  //  🔴 TROIS ÉCRANS LISENT CETTE OFFRE : le nom de la carte, sa légende, et
  //     l'écran de choix. Trois dépliages séparés finiraient par montrer trois
  //     offres différentes sur le même clic — c'est le défaut que la carte
  //     d'acquis a déjà payé, et il s'est réglé de la même façon.
  //  ⚠️ Le vivier se relit à chaque appel plutôt que de voyager dans la carte :
  //     entre le tirage et le clic, rien ne change dans l'équipe ni dans les
  //     machines déjà possédées, et le rang est stable par construction.
  // ═══════════════════════════════════════════════════════════════════════════
  function machinesDe(p, carte) {
    if (!p || !carte) return [];
    return W.PokeChoix.deRang(apprenables(p), carte.rang || 0);
  }

  // Les pierres dont quelqu'un dans l'équipe a l'usage.
  function pierresUtiles(p) {
    var out = {};
    for (var k = 0; k < p.equipe.length; k++) {
      var e = ESP()[p.equipe[k].n];
      for (var i = 0; i < (e.evolue || []).length; i++) {
        if (e.evolue[i].par === "pierre") out[e.evolue[i].objet] = true;
      }
    }
    return Object.keys(out);
  }

  // ── Le tirage ───────────────────────────────────────────────────────────────
  //  Trois cartes DISTINCTES. 🔴 Le doublon est le pire ennemi d'un choix : deux
  //  cartes identiques ramènent l'arbitrage à un seul choix, sans le dire.
  function tirer(p, h, options) {
    var o = options || {};
    var acte = o.acte || p.acte || 1;
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE NOMBRE DE CARTES SE CALCULE ICI, PAS CHEZ L'APPELANT. Il valait
    //     `o.combien || 3`, et c'était `ui.js` qui composait le vrai chiffre
    //     (`3 + SERM().butinChoix`). Résultat : tout appelant qui oubliait
    //     l'option jouait sans les serments — et le harnais de mesure l'a
    //     oubliée depuis toujours. Trois serments, un sceau et deux règles du
    //     jour portent `butinChoix` ; aucun ne se voyait dans les mesures.
    //     C'est la même faute que `equipeMax` corrigée juste avant, à un
    //     fichier près : une valeur composée que chaque appelant recompose.
    //  ⚠️ `o.combien` reste prioritaire — un appelant peut vouloir un nombre
    //     précis (le contrôle qui compte les familles s'en sert) — mais il
    //     n'est plus REQUIS pour que les serments comptent.
    // ═══════════════════════════════════════════════════════════════════════
    var bonus = W.PokeSerments ? (W.PokeSerments.effet(p).butinChoix || 0) : 0;
    var combien = o.combien || Math.max(1, 3 + bonus);
    // Un boss donne davantage — c'est la récompense du mur franchi.
    var chance = o.boss ? 2 : 1;

    var noms = [];
    for (var f in FAMILLES) {
      var fam = FAMILLES[f];
      // 🔴 `utile` NE RECEVAIT PAS L'ACTE, et une famille qui en dépend était
      //    donc écartée en silence : mes remèdes d'état, conditionnés à l'acte
      //    3, lisaient `undefined` et ne sortaient JAMAIS. Aucune erreur,
      //    aucune carte — exactement le genre d'absence qu'on ne remarque pas.
      //    Vu en comptant les tirages, pas en relisant : 400 tirages à l'acte
      //    4, zéro remède.
      if (fam.utile && !fam.utile(p, h, acte)) continue;
      var poids = fam.poids;
      if (o.boss && fam.rarete !== COMMUN) poids *= 2;   // le mur paie mieux
      noms.push({ f: f, poids: poids });
    }
    if (!noms.length) return [];

    var out = [], vues = {};
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LA CARTE QUI DÉCIDE DU VOYAGE SE TIRAIT ENCORE AU SORT
    //
    //     Mesuré (n=250, tableau victoire | défaite du harnais), colonne
    //     « porte le Multi Exp » :
    //       arène 3 : **60 % en victoire, ZÉRO en défaite**
    //       arène 4 : 75 % contre 21 %   ·   arène 5 : 90 % contre 48 %
    //     et l'écart s'éteint à partir de l'arène 6, quand tout le monde l'a.
    //     À contenu presque identique — 45 combats contre 42, mêmes branches —
    //     les voyages gagnants encaissent **60 % de niveaux en plus**.
    //
    //  🔑 PARCE QUE CE N'EST PAS UN PARTAGE, C'EST UN MULTIPLICATEUR ×3,5.
    //     `gainExperience` divise le brut par le nombre de PARTICIPANTS, et
    //     `distribuerExperience` verse EN PLUS la moitié d'un brut PLEIN à
    //     chaque non-participant : avec un seul combattant et six places,
    //     `brut + 5 × brut/2`. Sans lui, `brut`.
    //
    //     Sa DATE d'ouverture a déjà été corrigée deux fois (acte 2 en v453,
    //     acte 1 en v459) et son poids doublé. Ce qui restait n'était plus la
    //     date : c'était le TIRAGE. On pouvait le rater entièrement, et le
    //     voyage était joué avant d'avoir commencé.
    //
    //  ✅ ON LE POSE, ON NE LE TIRE PLUS — même geste que le ravitaillement
    //     avant une chasse (v461) : ce qui décide d'un voyage ne se laisse pas
    //     à un poids de 14 sur 130.
    //  ⚠️ IL RESTE UNE CARTE PARMI TROIS, jamais un cadeau. Le joueur peut lui
    //     préférer des Balls ou une capsule, et c'est un vrai arbitrage —
    //     simplement, il l'aura vu passer une fois.
    //  ⚠️ ET UNE SEULE FOIS PAR VOYAGE : `utile` le refuse dès qu'on le porte,
    //     donc la garantie s'éteint d'elle-même au premier ramassage.
    // ═══════════════════════════════════════════════════════════════════════
    var famExp = FAMILLES.expAll;
    //  ⚠️ `o.sansPose` EST LE TÉMOIN, ET IL VIT DANS LE CODE. J'ai d'abord fait
    //     l'A/B en remisant le fichier par `git stash` — le `pop` a échoué et le
    //     travail de quatre versions a passé une minute hors de l'arbre. Un
    //     témoin se déclare, il ne se bricole pas avec l'outil de version.
    // ⚠️ ACTE 1, ET C'EST BORNÉ PAR `utile` : la carte exige DEUX Pokémon en
    //    équipe, donc elle ne peut pas tomber au tout premier nœud. À l'acte 2
    //    elle arrivait souvent APRÈS Ondine, qui ferme cet acte — d'où deux
    //    arènes d'early strictement insensibles à la pose (72 % et 57 %).
    if (famExp && !o.sansPose && famExp.utile(p, h, acte) && (acte || 1) >= 1 && !o.combien) {
      var carteExp = famExp.tirer(p, h, acte);
      if (carteExp) {
        carteExp.famille = "expAll";
        carteExp.rarete = famExp.rarete;
        out.push(carteExp);
        vues[carteExp.type + ":" + (carteExp.objet || "")] = true;
      }
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE PREMIER ACQUIS SE POSE, IL NE SE TIRE PLUS — 14/08, et c'est LE
    //     trou de rétention du mode, mesuré.
    //
    //     Depuis la v623, un voyage laisse UN acquis au suivant : c'est ce qui
    //     fait qu'échouer paie, donc qu'on relance. Sauf que l'acquis vient
    //     d'un tirage de poids 5. Mesuré sur 40 voyages, par issue :
    //
    //       issue                   acquis pris (médiane)   à ZÉRO
    //       échec précoce (0-1)              0               **73 %**
    //       milieu (2-6)                     2                30 %
    //       sommet (7-8)                     3                11 %
    //
    //     29 % des voyages meurent aux actes 1-2, et les trois quarts d'entre
    //     eux n'avaient AUCUN acquis à emporter. Soit **un voyage sur cinq qui
    //     ne laisse rien** — et ce sont exactement les joueurs qui décident de
    //     revenir ou pas. *Le pilier bâti pour que perdre paie n'atteignait pas
    //     ceux qui perdent.*
    //
    //  ✅ MÊME GESTE QUE LE MULTI EXP CI-DESSUS : on POSE, on ne tire plus. La
    //     carte reste une carte parmi trois — le joueur peut lui préférer des
    //     Balls, et c'est un vrai arbitrage — mais il l'aura vue passer.
    //  ⚠️ LA BORNE S'ÉTEINT D'ELLE-MÊME : seulement si l'on ne porte encore
    //     AUCUN acquis. Le premier est garanti, les suivants se méritent. Rien
    //     ne change donc pour un voyage qui va loin, et tout change pour celui
    //     qui s'arrête tôt.
    //  ⚠️ ZÉRO EFFET SUR LA DIFFICULTÉ DU VOYAGE EN COURS quand il est déjà
    //     perdu : un acquis offert à l'acte 1 sert surtout au voyage SUIVANT.
    // ═══════════════════════════════════════════════════════════════════════
    //  ⚠️ UN DRAPEAU EXPLICITE, PAS UNE DÉDUCTION. Ma première borne lisait
    //     « le joueur ne porte aucun acquis » — mais la carte peut être REFUSÉE
    //     (elle reste une carte parmi trois), et elle se reproposait alors à
    //     chaque butin. Mesuré : le sommet passait de 9 à 20 runs sur 40. Une
    //     garantie qui se répète n'est plus une garantie, c'est un robinet.
    //     `_acquisPose` s'arme au premier dépôt, quoi qu'en fasse le joueur.
    //  ⚠️ ACTE 1 SEULEMENT : c'est là qu'est le trou (73 % des morts précoces
    //     n'en voyaient aucun). Au-delà, le tirage suffit.
    var famAcq = FAMILLES.acquis;
    if (famAcq && !o.sansPose && !o.combien && !p._acquisPose && (acte || 1) === 1 &&
        famAcq.utile(p, h, acte)) {
      p._acquisPose = true;
      var carteAcq = famAcq.tirer(p, h, acte);
      if (carteAcq) {
        carteAcq.famille = "acquis";
        carteAcq.rarete = famAcq.rarete;
        out.push(carteAcq);
        vues[carteAcq.type + ":"] = true;
      }
    }
    for (var essai = 0; essai < 40 && out.length < combien; essai++) {
      var choisi = h.pondere(noms);
      if (!choisi) break;
      var fam2 = FAMILLES[choisi.f];
      var carte = fam2.tirer(p, h, acte);
      if (!carte) continue;
      // 🔴 UNE CARTE QUI PORTE UN CHOIX N'A PAS D'EMPREINTE PROPRE, ET C'EST
      //    VOULU. L'acquis et la capsule se réduisent à « acquis: » et « ct: » :
      //    deux capsules dans le même butin seraient deux fois la même
      //    proposition — six machines pour une seule gardée — et le joueur
      //    perdrait une des trois cartes du tirage sans rien gagner.
      //    ⚠️ `carte.rang` est donc EXCLU de l'empreinte à dessein. L'y mettre
      //       rouvrirait le doublon que ce garde-fou existe pour empêcher.
      var empreinte = carte.type + ":" + (carte.objet || carte.montant || "");
      if (vues[empreinte]) continue;
      vues[empreinte] = true;
      carte.famille = choisi.f;
      carte.rarete = fam2.rarete;
      out.push(carte);
    }
    return out;
  }

  // ── Prendre une carte ───────────────────────────────────────────────────────
  //  🔴 UNE SEULE PORTE. Chaque famille sait se poser elle-même ; l'écran ne
  //     touche jamais au sac ni à la bourse directement. Sans ça, une famille
  //     ajoutée demain serait à moitié branchée, et personne ne le verrait.
  function prendre(p, carte) {
    var fam = FAMILLES[carte.famille];
    if (!fam) return { ok: false, raison: "familleInconnue" };
    fam.poser(p, carte);
    return { ok: true };
  }

  W.PokeButin = {
    COMMUN: COMMUN, RARE: RARE, LEGENDAIRE: LEGENDAIRE,
    FAMILLES: FAMILLES,
    tirer: tirer,
    prendre: prendre,
    apprenables: apprenables,
    plafondCT: plafondCT,
    PLAFOND_CT: PLAFOND_CT,
    machinesDe: machinesDe,
    pierresUtiles: pierresUtiles,
    CANNES: CANNES,
    canneDe: canneDe,
  };
})(typeof window !== "undefined" ? window : globalThis);
