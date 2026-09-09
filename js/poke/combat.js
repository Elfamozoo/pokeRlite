(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE COMBAT — TOUR PAR TOUR, PREMIÈRE GÉNÉRATION
  //
  //  🔴 FICHIER PUR. Il ne produit AUCUN texte : il rend une liste d'ÉVÉNEMENTS
  //     structurés que l'interface met en mots. C'est ce qui permet au serveur
  //     de rejouer un combat sans charger une seule chaîne de langue, et au
  //     mode d'exister en français et en anglais sans deux moteurs.
  //
  //  Ce qui est fidèle à la génération 1, et qui se remarque :
  //   · une seule statistique « Spécial », en attaque comme en défense ;
  //   · une attaque est physique ou spéciale selon SON TYPE, jamais selon elle ;
  //   · le coup critique se calcule sur la VITESSE DE BASE de l'attaquant, et
  //     il ignore les changements de statistiques ;
  //   · le gel ne se dégèle qu'au contact du feu ;
  //   · pas de talents, pas de natures, pas d'objets tenus.
  //
  //  Ce qui s'en écarte — la liste complète, et elle tient en trois lignes :
  //   1. Spectre est super efficace contre Psy (voir js/poke/types.js).
  //   2. Le gel a une petite chance de fondre seul (voir DEGEL_NATUREL).
  //   3. Pas de raté d'une chance sur 256 : une précision de 100 % touche
  //      toujours. Le bug d'origine ne se voit pas, ne s'explique pas, et vole
  //      des combats.
  // ═══════════════════════════════════════════════════════════════════════════

  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  var ATT = function () { return W.PokeRegles ? W.PokeRegles.attaques() : W.POKE_ATTAQUE_PAR_CLE; };
  // ⚠️ Par le REGISTRE, pas par la globale : c'est ici que la seconde
  //    génération se branchera, et nulle part ailleurs.
  var TABLE = function () { return W.PokeRegles ? W.PokeRegles.table() : W.POKE_TYPE_TABLE; };
  var SPECIAUX = function () { return W.PokeRegles ? W.PokeRegles.speciaux() : W.POKE_TYPES_SPECIAUX; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES DEUX SPÉCIALES — VOIR `moteur.js`, MÊME COUTURE  [19/08/2026]
  //
  //  🔴 EN GÉNÉRATION 1, LES DEUX NOMS SONT LE MÊME (`spe`), et tout ce qui
  //     suit se réduit donc au code d'avant, à l'octet près. En génération 2,
  //     l'attaquant lit son Attaque Spéciale et le défenseur sa Défense
  //     Spéciale — c'est toute la différence, et elle vaut sur chaque coup.
  //  ⚠️ LE CÔTÉ COMPTE. Se tromper de nom ici ne planterait rien : le combat
  //     tournerait, les dégâts seraient faux, et ça se lirait « ce combat est
  //     bizarre » — le pire mode de défaillance du dossier.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES OBJETS TENUS — ET LE TIRAGE QUE SEUL LE PORTEUR PAIE  [19/08/2026]
  //
  //  🔴 EN 1996 CETTE PORTE REND `null`, et tout ce qui suit se tait de
  //     lui-même : pas une lecture, pas une branche prise, pas un jet. La
  //     première génération n'a pas d'objets tenus, et le combat qu'elle joue
  //     ne change pas d'un point de vie.
  //  🔑 DEUX OBJETS TIRENT AUX DÉS, ET SEULEMENT DANS LA MAIN DE CELUI QUI LES
  //     PORTE : la Vive Griffe (60/256, à priorité égale seulement) et la Roche
  //     Royale (30/256, sur un coup qui a porté). Ils avaient été écartés comme
  //     « un jet par tour » — le jet ne se fait QUE si l'objet est là, et deux
  //     pour cent des créatures en portent un. La promesse du dossier n'est pas
  //     « aucun tirage neuf », c'est « aucun tirage qu'on n'ait dit ».
  //  ⚠️ CINQ AUTRES N'ONT AUCUNE PORTE D'ENTRÉE dans ce mode — ni espèce
  //     sauvage, ni boutique. Ils sont NOMMÉS dans
  //     `POKE_GEN2_TENUS_HORS_DE_PORTEE` et volontairement pas écrits.
  // ═══════════════════════════════════════════════════════════════════════════
  var TENUS = function () { return W.PokeRegles && W.PokeRegles.tenus ? W.PokeRegles.tenus() : null; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES EFFETS QUE 1996 N'A PAS — MÉTÉO, DRAPEAUX, PALIERS SUPPLÉMENTAIRES
  //
  //  🔴 EN 1996 CETTE PORTE REND `null`, et tout ce qui suit se tait : pas une
  //     branche prise, pas un compteur posé, pas un jet. Le combat de la
  //     première génération ne change pas d'un point de vie.
  //  🔑 ET LES PALIERS S'AJOUTENT PAR ICI, pas dans `PALIER_DE`. Aucune attaque
  //     de 1996 ne porte « baisse l'Attaque de deux crans » : l'écrire dans la
  //     table du moteur ferait une clé morte des deux côtés, et
  //     `poke-effets-fantomes` la refuserait — à juste titre.
  // ═══════════════════════════════════════════════════════════════════════════
  var NEUFS = function () {
    return W.PokeRegles && W.PokeRegles.effetsNeufs ? W.PokeRegles.effetsNeufs() : null;
  };
  //  Le palier d'un effet, du moteur OU du jeu de règles. Une seule lecture.
  function palierDe(effet) {
    if (PALIER_DE[effet]) return PALIER_DE[effet];
    var n = NEUFS();
    return (n && n.paliers[effet]) || null;
  }
  //  L'effet que porte un Pokémon, ou `null`. Une seule porte : le nom de
  //  l'objet est une CLÉ, son effet est une DONNÉE, et les deux vivent dans
  //  `gen2/objets-tenus.js`.
  function effetTenu(p) {
    var t = TENUS();
    if (!t || !p || !p.objet) return null;
    var O = (W.PokeRegles && W.PokeRegles.objetsTable && W.PokeRegles.objetsTable()) || null;
    var o = O && O[p.objet];
    return o ? o.tenu : null;
  }

  var SPE_ATK = function () { return W.PokeRegles ? W.PokeRegles.speAtk() : "spe"; };
  var SPE_DEF = function () { return W.PokeRegles ? W.PokeRegles.speDef() : "spe"; };
  //  Le moteur, pour la seule porte d'écriture des points de vie. `combat.js` ne
  //  lui demandait rien jusqu'ici ; il ne lui demande que ça.
  var MOT = function () { return W.PokeMoteur; };

  //  🔑 UNE SEULE PORTE POUR UN JEU DE PALIERS NEUF. Il en existait SIX copies
  //     écrites à la main dans ce fichier, toutes identiques — et il aurait
  //     fallu les retrouver toutes le jour où une statistique s'ajoute. Une
  //     oubliée aurait donné un palier de Défense Spéciale qui ne se remet
  //     jamais à zéro entre deux combats.
  function paliersNeufs() {
    var p = { atk: 0, def: 0, vit: 0, precision: 0, esquive: 0 };
    p[SPE_ATK()] = 0;
    p[SPE_DEF()] = 0;
    return p;
  }

  // Le gel de la génération 1 est quasi définitif : sans attaque de feu en
  // face, le Pokémon ne rejoue jamais. Une partie perdue sur un gel au deuxième
  // tour n'est pas une difficulté, c'est une punition — et le §4bis du brief
  // interdit une dureté que le joueur ne peut pas voir venir. On laisse donc
  // une porte de sortie, petite, et on l'affiche dans le journal de combat.
  var DEGEL_NATUREL = 10; // pour cent, par tour

  // Paliers de changement de statistique, génération 1.
  var PALIERS = [0.25, 0.28, 0.33, 0.40, 0.50, 0.66, 1, 1.5, 2, 2.5, 3, 3.5, 4];
  function facteurPalier(p) { return PALIERS[Math.max(0, Math.min(12, p + 6))]; }

  // ── Efficacité des types ───────────────────────────────────────────────────
  function efficacite(typeAttaque, typesDefenseur) {
    var t = TABLE()[typeAttaque];
    if (!t) return 1;
    var m = 1;
    for (var i = 0; i < typesDefenseur.length; i++) m *= t[typesDefenseur[i]];
    return m;
  }

  function estSpecial(type) { return SPECIAUX().indexOf(type) >= 0; }

  // ── Coup critique ──────────────────────────────────────────────────────────
  //  🔴 Sur la VITESSE DE BASE, pas sur la vitesse calculée. Un Persian est
  //     donc structurellement plus critique qu'un Ronflex, quel que soit leur
  //     niveau. C'est une des signatures de la génération 1.
  var FORT_CRITIQUE = { SLASH: 1, KARATE_CHOP: 1, CRABHAMMER: 1, RAZOR_LEAF: 1 };
  function chanceCritique(p, cleAttaque) {
    var base = ESP()[p.n].base.vit;
    var t = Math.floor(base / 2);
    if (FORT_CRITIQUE[cleAttaque]) t = Math.min(255, t * 8);
    return t / 256;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES TYPES D'UNE CRÉATURE — PORTE UNIQUE
  //
  //  🔴 IL Y AVAIT DEUX LECTURES DU MÊME FAIT. `degats` lisait
  //     `typesForces || ESP()[n].types` — donc Conversion et Morphing étaient
  //     honorés — pendant que CINQ immunités (Frappe Atlas, Croc de Mort,
  //     Guillotine, Dévorêve, Vampigraine) lisaient `ESP()[pD.n].types` en dur.
  //     Une cible transformée gardait ses types d'origine pour elles seules :
  //     un Métamorph passé en Spectre restait touchable par Dévorêve, et le
  //     joueur n'avait aucun moyen de comprendre pourquoi.
  //  ⚠️ `ce qui est recopié diverge` — septième occurrence dans ce dossier.
  // ═══════════════════════════════════════════════════════════════════════════
  function typesDe(p) {
    return (p && p.typesForces) || ESP()[p.n].types;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UNE TRANSFORMATION NE SURVIT PAS AU COMBAT  [19/08/2026, nuit]
  //
  //  🔴 ELLE Y SURVIVAIT, ET DÉFINITIVEMENT. Morphing écrit sur la CRÉATURE —
  //     types, apparence, statistiques de combat, liste d'attaques — et rien ne
  //     les effaçait jamais. Mesuré : un Métamorph qui copie un Dracaufeu SORT
  //     du combat avec les types Feu/Vol, 101 d'Attaque au lieu de 59, et
  //     Lance-Flammes à la place de Morphing. Il a perdu sa seule attaque, donc
  //     il ne peut plus jamais se transformer. Au combat suivant, il est encore
  //     Dracaufeu. C'est la sauvegarde qui le garde.
  //  🔴 CE N'EST PAS UN DÉFAUT DE JOHTO : Conversion et Morphing sont de 1996,
  //     et la production le porte depuis le premier jour. Conversion 2 ouvrait
  //     simplement une troisième porte sur le même trou.
  //  🔑 ON GARDE L'AVANT PLUTÔT QUE DE RECALCULER TOUT : les statistiques se
  //     recalculent (elles dérivent du niveau, des DV et de l'expérience de
  //     statistique), mais la liste d'attaques et ses points de pouvoir, non —
  //     recalculer donnerait au Pokémon les attaques de son NIVEAU, pas les
  //     siennes.
  //  ⚠️ ON NE GARDE QU'UNE FOIS : deux Conversions d'affilée ne doivent pas
  //     enregistrer l'état déjà transformé comme étant l'original.
  // ═══════════════════════════════════════════════════════════════════════════
  function garderAvantTransformation(p) {
    if (!p || p.avantTransformation) return;
    p.avantTransformation = {
      typesForces: p.typesForces || null,
      morphe: p.morphe || null,
      attaques: p.attaques.map(function (x) {
        return { cle: x.cle, pp: x.pp, ppMax: x.ppMax };
      }),
    };
  }

  function defaireTransformation(p) {
    if (!p || !p.avantTransformation) return false;
    var av = p.avantTransformation;
    delete p.avantTransformation;
    if (av.typesForces) p.typesForces = av.typesForces; else delete p.typesForces;
    if (av.morphe) p.morphe = av.morphe; else delete p.morphe;
    p.attaques = av.attaques;
    //  🔑 LES STATISTIQUES SE REDEMANDENT AU MOTEUR. Les figer dans l'instantané
    //     aurait gelé un Pokémon qui monte de niveau pendant le combat.
    if (MOT() && MOT().calculerStats) p.stats = MOT().calculerStats(p);
    return true;
  }

  //  Tout le monde reprend sa forme : à la fin d'un combat, et pour celui qui
  //  quitte le terrain.
  function defaireToutesTransformations(e) {
    var rendus = 0;
    ["joueur", "adverse"].forEach(function (c) {
      (e[c].equipe || []).forEach(function (p) { if (defaireTransformation(p)) rendus++; });
    });
    return rendus;
  }

  // ── Dégâts ─────────────────────────────────────────────────────────────────
  function degats(att, def, attaque, ctx, h) {
    var a = ATT()[attaque];
    if (!a || !a.puissance) return { degats: 0, efficacite: 1, critique: false };

    // 🔴 Conversion et Morphing CHANGENT les types. Sans cette lecture, un
    //    Métamorph transformé gardait ses faiblesses d'origine — l'effet
    //    s'annonçait et ne changeait rien au combat.
    var typesDef = typesDe(def);
    var typesAtt = typesDe(att);

    // 🔴 UN COUP PEUT ÊTRE SANS TYPE — 1999 en a un seul, Prescience, et c'est
    //    ce qui la rend fiable : ni super efficace, ni sans effet, jamais. La
    //    garde vaut aussi pour le bonus de même type, plus bas : un coup sans
    //    type n'appartient à personne.
    var eff = ctx.sansType ? 1 : efficacite(a.type, typesDef);
    if (eff === 0) return { degats: 0, efficacite: 0, critique: false };

    // ⚠️ PUISSANCE DIVISE LE TAUX DE CRITIQUE AU LIEU DE LE MULTIPLIER. C'est
    //    le bug le plus célèbre de la première génération, et on le garde :
    //    le corriger donnerait un jeu qui n'a jamais existé.
    var tauxCrit = chanceCritique(att, attaque);
    // La Lentille Scope double le taux. Même jet, autre seuil.
    var _tnC = TENUS();
    if (_tnC && effetTenu(att) === _tnC.critique.effet) tauxCrit = tauxCrit * _tnC.critique.facteur;
    if (ctx.puissance) tauxCrit = tauxCrit / 4;
    // Le Serment de l'audace ajoute sa part ici, le Serment de la prudence la
    // retire. 🔴 LE TIRAGE RESTE LE MÊME : on déplace le seuil, on n'ajoute
    // aucun appel à `h`. Un serment qui changerait le NOMBRE de tirages
    // casserait le rejeu de toutes les graines du mode.
    if (ctx.sermentsCrit) tauxCrit = Math.max(0, Math.min(1, tauxCrit + ctx.sermentsCrit));
    // ⚠️ ET LE TIRAGE DE CRITIQUE NE SE FAIT PAS QUAND IL N'Y A PAS DE
    //    CRITIQUE POSSIBLE. Le consommer pour rien décalerait la graine d'un
    //    cran à chaque Prescience — un coup différé coûte UN tirage, celui de
    //    l'aléa des dégâts, et c'est ce que sa table déclare.
    var critique = ctx.sansCritique ? false : h.brut() < tauxCrit;
    var spec = estSpecial(a.type);

    // Un coup critique ignore les changements de statistiques, des deux côtés.
    // 🔴 L'ATTAQUANT LIT SON ATTAQUE SPÉCIALE, LE DÉFENSEUR SA DÉFENSE
    //    SPÉCIALE. En gen 1 c'est la même statistique et la ligne est celle
    //    d'avant ; en gen 2 c'est ce qui rend un Pokémon fort en attaque et
    //    fragile en défense — l'apport principal de la génération.
    var cleA = spec ? SPE_ATK() : "atk";
    var cleD = spec ? SPE_DEF() : "def";
    var A = att.stats[cleA];
    var D = def.stats[cleD];
    if (!critique) {
      A = Math.floor(A * facteurPalier(ctx.attPaliers[cleA]));
      D = Math.floor(D * facteurPalier(ctx.defPaliers[cleD]));
    }
    // 🔴 LE RENFORT DE TYPE. ×1,1 quand l'objet tenu correspond au type du
    //    coup — c'est la valeur du ROM, et elle s'applique à l'ATTAQUE, pas au
    //    résultat : c'est là que le jeu d'origine la place.
    var _tn = TENUS();
    if (_tn) {
      var _e = effetTenu(att);
      if (_e && _tn.boost[_e] === a.type) A = Math.floor(A * _tn.boostFacteur);
    }
    // 🔴 LA MÉTÉO PÈSE SUR LE COUP, pas sur la créature : la pluie double
    //    presque l'Eau et étouffe le Feu, le zénith fait l'inverse. C'est un
    //    multiplicateur fixe, sans un jet.
    var _nm = NEUFS();
    if (_nm && ctx.meteo) {
      var _md = _nm.meteoDegats[ctx.meteo];
      if (_md && _md[a.type]) A = Math.floor(A * _md[a.type]);
    }
    // La brûlure coupe l'Attaque de moitié — physique uniquement.
    if (!spec && att.statut === "brulure") A = Math.floor(A / 2);
    // 🔴 LES DEUX MURS DOUBLENT LA DÉFENSE VISÉE, chacun sur sa moitié du jeu :
    //    Protection contre le physique, Mur Lumière contre le spécial. Ils
    //    s'annonçaient sans rien changer — deux tours donnés pour rien.
    //    ⚠️ Un coup critique les IGNORE, comme dans le jeu d'origine : c'est ce
    //       qui empêche un mur de rendre un combat imperdable.
    if (!critique) {
      if (spec && ctx.mur) D = D * 2;
      if (!spec && ctx.protection) D = D * 2;
    }
    // Les bonus de badge du joueur, appliqués comme dans le jeu d'origine.
    // ⚠️ ET CELUI DE LA DÉFENSE AUSSI : le Badge Âme vaut +12,5 % de Défense
    //    quand c'est le JOUEUR qui encaisse. Il était posé et jamais lu.
    if (ctx.badgesAtt) A = Math.floor(A * ctx.badgesAtt);
    if (ctx.badgesDef) D = Math.floor(D * ctx.badgesDef);
    // 🔴 EXPLOSION ET DESTRUCTION HALVENT LA DÉFENSE ADVERSE (audit 13/08) :
    //    c'est LA moitié de leur puissance, et elle n'était jamais appliquée —
    //    les deux frappaient moitié moins fort que le canon. Sur critique
    //    aussi, conformément à la doc du ROM.
    if (a.effet === "EXPLODE_EFFECT") D = Math.max(1, Math.floor(D / 2));
    A = Math.max(1, A); D = Math.max(1, D);

    var niveau = critique ? att.niveau * 2 : att.niveau;
    var d = Math.floor(Math.floor((Math.floor((2 * niveau) / 5) + 2) * a.puissance * A / D) / 50) + 2;

    // Bonus de même type. En génération 1 il vaut exactement une fois et demie.
    // Il suit les types FORCÉS : un Métamorph transformé en Dracaufeu profite
    // du bonus des attaques Feu, comme dans le jeu.
    if (!ctx.sansType && typesAtt.indexOf(a.type) >= 0) d = Math.floor(d * 1.5);
    d = Math.floor(d * eff);

    // L'aléa d'origine : entre 217 et 255 deux cent cinquante-cinquièmes. Un
    // même coup fait donc entre 85 % et 100 % de sa valeur, et ça suffit à
    // rendre un combat incertain sans le rendre injuste.
    if (d > 1) d = Math.floor((d * h.entre(217, 255)) / 255);
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LES SERMENTS S'APPLIQUENT APRÈS L'ALÉA, ET C'EST VOULU. Posés avant,
    //    ils passeraient dans deux arrondis vers le bas au lieu d'un, et un
    //    serment de plus ou moins dix pour cent se perdrait entièrement sur
    //    les petits coups. Après, ils se voient toujours.
    // ⚠️ Le plancher d'un dégât reste UN. Un serment ne peut pas rendre une
    //    attaque inoffensive : le combat cesserait d'avancer.
    // ═══════════════════════════════════════════════════════════════════════
    if (ctx.sermentsInflige && ctx.sermentsInflige !== 1) d = Math.floor(d * ctx.sermentsInflige);
    if (ctx.sermentsSubit && ctx.sermentsSubit !== 1) d = Math.floor(d * ctx.sermentsSubit);
    return { degats: Math.max(1, d), efficacite: eff, critique: critique };
  }

  // ── L'état d'un combat ─────────────────────────────────────────────────────
  //  `cote.paliers` porte les changements de statistiques du Pokémon ACTIF ;
  //  ils se remettent à zéro au changement, comme dans le jeu.
  // 🔴 LE COMBAT S'OUVRAIT SUR UN POKÉMON À TERRE. `actif: 0` était posé sans
  //    regarder les PV : perdre son meneur, puis entrer dans les hautes herbes
  //    suivantes, et le combat commençait avec un Pokémon K.O. en première
  //    ligne. Mesuré, pas supposé. On prend le premier DEBOUT — et 0 si tous
  //    sont à terre, parce que ce cas-là est une défaite, pas un choix.
  //  ⚠️ Aucun tirage ici : le rejeu ne bouge pas.
  function premierDebout(equipe) {
    for (var i = 0; i < (equipe || []).length; i++) {
      if (equipe[i] && equipe[i].pv > 0) return i;
    }
    return 0;
  }

  function cote(equipe, options) {
    return {
      equipe: equipe,
      actif: premierDebout(equipe),
      paliers: paliersNeufs(),
      volatils: {},           // confusion, peur, protection…
      participants: {},       // qui a combattu : décide du partage d'expérience
      badges: (options && options.badges) || {},
      dresseur: !!(options && options.dresseur),
      // 🔴 CE QUE LE DRESSEUR PORTE. Zéro par défaut : un dresseur de route ne
      //    se soigne pas, seuls les Champions et le Conseil 4 en ont — c'est
      //    la règle du jeu d'origine, et c'est aussi ce qui garde les combats
      //    ordinaires courts.
      soins: (options && options.soins) || 0,
      soin: (options && options.soin) || "SUPER_POTION",
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ENTRER EN JEU — UNE SEULE PORTE  [19/08/2026, nuit]
  //
  //  🔴 IL Y EN AVAIT TREIZE. Trois dans ce fichier, une dans l'écran de
  //     combat, une dans le duel, huit dans les harnais : chacune posait
  //     `actif`, des paliers neufs et des volatils vides, et chacune portait un
  //     commentaire expliquant le piège que la précédente avait payé. Treize
  //     copies d'une même règle, c'est douze occasions de diverger — et ma
  //     recherche à la main n'en avait trouvé que sept.
  //  🔴 ET LES PICOTS DE 1999 MORDENT EXACTEMENT LÀ. Un piège qui frappe à
  //     l'entrée ne peut pas vivre dans une règle recopiée sept fois : il
  //     mordrait le camp adverse et pas le joueur, ou l'inverse, selon la
  //     porte empruntée — le pire des défauts, celui qui marche à moitié.
  //  🔑 `annonce` est l'événement du changement, et il passe AVANT le piège :
  //     on entre, puis on saigne. L'ordre inverse raconterait une blessure à
  //     un Pokémon qui n'est pas encore là.
  //  ⚠️ ZÉRO TIRAGE. Ni les paliers, ni les volatils, ni les Picots ne se
  //     jouent aux dés — le rejeu des graines ne bouge pas d'un cran.
  // ═══════════════════════════════════════════════════════════════════════════
  function entrerEnJeu(e, quiCote, index, ev, options) {
    var c = e[quiCote];
    var o = options || {};
    //  🔑 CELUI QUI PART REPREND SA FORME. C'est le canon — Morphing et
    //     Conversion s'arrêtent quand on quitte le terrain — et c'est aussi la
    //     seule façon d'empêcher un Métamorph de sortir du combat en Dracaufeu.
    if (c.equipe[c.actif] && c.actif !== index) defaireTransformation(c.equipe[c.actif]);
    c.actif = index;
    //  🔑 C'EST AU MOTEUR DE DIRE QUELLES STATISTIQUES EXISTENT. Une table
    //     écrite à la main nommait `spe` ; sous Johto la Spéciale s'appelle
    //     `sat`/`sdf`, et le remplaçant repartait avec des paliers où sa
    //     statistique n'existait pas — dégâts NaN, points de vie NaN, et
    //     `NaN > 0` étant faux, une créature qui compte pour morte sans tomber.
    c.paliers = o.paliers || paliersNeufs();
    c.volatils = {};
    if (o.annonce) (ev || []).push(o.annonce);
    piegesALEntree(e, quiCote, ev || []);
    return c.equipe[index];
  }

  //  Ce que le terrain fait payer à celui qui entre. En 1996 : rien.
  function piegesALEntree(e, quiCote, ev) {
    var n = NEUFS();
    if (!n || !n.pieges) return;
    var c = e[quiCote];
    var p = c.equipe[c.actif];
    if (!p || !vivant(p)) return;
    for (var i = 0; i < n.pieges.length; i++) {
      var g = n.pieges[i];
      var pose = c.piegesPoses && c.piegesPoses[g.cle];
      if (!pose) continue;
      //  Les Picots sont au SOL : ce qui vole ne les touche pas.
      if (g.epargneTypes) {
        var vole = false;
        for (var t = 0; t < g.epargneTypes.length; t++) {
          if (typesDe(p).indexOf(g.epargneTypes[t]) >= 0) vole = true;
        }
        if (vole) { ev.push({ t: "piegeEpargne", cle: g.cle, cote: quiCote }); continue; }
      }
      var d = Math.max(1, Math.floor(p.stats.pv / g.part));
      ev.push({ t: "piege", cle: g.cle, cote: quiCote, degats: d });
      encaisser(c, p, d, ev, quiCote);
    }
  }

  function actif(c) { return c.equipe[c.actif]; }
  function vivant(p) { return p && p.pv > 0; }
  function resteUn(c) {
    for (var i = 0; i < c.equipe.length; i++) if (vivant(c.equipe[i])) return true;
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  COMBIEN DE POKÉMON ONT COMBATTU  [20/08/2026]
  //
  //  🔴 ELLE EST PUBLIQUE PARCE QU'ELLE A ÉTÉ RECOPIÉE DE TRAVERS. `ui.js`
  //     comptait les participants À LA MAIN, avec une boucle de TABLEAU sur un
  //     OBJET : `part.length` vaut `undefined`, la boucle ne tournait pas une
  //     fois, et le compte sortait à zéro pour chaque combat de chaque joueur
  //     depuis le 17/08. `tools/poke-reel.mjs` en concluait, sur les VRAIS
  //     voyages, « l'équipe ne sert pas » — un rouge permanent sur une
  //     mécanique en bon état.
  //  🔑 `participants` est indexé par PLACE D'ÉQUIPE, et il l'est parce que
  //     c'est ce que le partage d'expérience demande. Qui veut le compter passe
  //     par ici : la forme de la donnée n'a plus à être devinée ailleurs.
  // ═══════════════════════════════════════════════════════════════════════════
  function combienOntCombattu(c) {
    var n = 0;
    var part = (c && c.participants) || {};
    for (var k in part) if (part[k]) n++;
    return n;
  }

  function demarrer(equipeJoueur, equipeAdverse, options, h) {
    var o = options || {};
    var e = {
      joueur: cote(equipeJoueur, { badges: o.badges, dresseur: false }),
      adverse: cote(equipeAdverse, { dresseur: !!o.dresseur, soins: o.soins, soin: o.soin }),
      tour: 0,
      sauvage: !o.dresseur,
      zone: o.zone || null,
      fini: null,           // "victoire" | "defaite" | "fuite" | "capture"
      // 🔴 LE COMBAT REÇOIT L'EFFET COMPOSÉ, PAS LA LISTE DES SERMENTS. Il ne
      //    charge donc pas `serments.js` — le noyau que le serveur relit reste
      //    exactement aussi lourd qu'avant, et un serment neuf ne rouvre pas
      //    ce fichier. Voir `PokeSerments.effet(partie)`.
      serments: o.serments || null,
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 CE QUI FUIT NE SE COMBAT PAS COMME CE QUI ATTEND. Les trois bêtes
      //     de la seconde génération ne se laissent pas user : elles restent
      //     quelques tours, puis s'en vont. C'est ce qui les rend dures — un
      //     légendaire de 1996 attend dans sa salle qu'on vienne le prendre,
      //     et « c'était beaucoup trop facile » est le verdict qu'on en a eu.
      //  ⚠️ ABSENT PAR DÉFAUT, donc rien ne change pour la première génération :
      //     aucun de ses appels ne pose ce champ, et le compte à rebours ne se
      //     déclenche jamais. Aucun tirage n'est ajouté non plus — c'est un
      //     compteur de tours, pas un jet.
      // ═══════════════════════════════════════════════════════════════════════
      fuiteApres: o.fuiteApres || 0,
      balls: o.balls || {},
      journal: [],
    };
    e.joueur.participants[e.joueur.actif] = true;
    return e;
  }

  // ── Ordre des tours ────────────────────────────────────────────────────────
  //  La vitesse tranche. À égalité parfaite, on tire — et on consomme le
  //  tirage TOUJOURS, même quand les vitesses diffèrent, pour que le rejeu ne
  //  dépende pas des statistiques des Pokémon en présence.
  // ⚠️ `camp` EST FACULTATIF, et c'est par lui que le Badge Foudre entre : il
  //    vaut +12,5 % de Vitesse au joueur qui l'a gagné, exactement comme le
  //    Badge Roche vaut +12,5 % d'Attaque. Il était posé et n'avait aucun
  //    lecteur — un badge du milieu de partie, muet.
  function vitesseEffective(p, paliers, camp) {
    var v = Math.floor(p.stats.vit * facteurPalier(paliers.vit));
    if (camp) v = Math.floor(v * bonusBadges(camp, "vit"));
    if (p.statut === "para") v = Math.floor(v / 4);
    return Math.max(1, v);
  }

  // 🔴 LES PRIORITÉS DE 1996 EXISTENT ENFIN (audit 13/08). `joueurEnPremier`
  //    savait les comparer depuis toujours — et son appel passait (0, 0) en
  //    dur : Vive-Attaque n'a JAMAIS frappé en premier (0/60 au banc, canon
  //    100 %), sa seule mécanique vivait dans son nom. Riposte, elle, part en
  //    dernier. Aucun tirage ajouté : l'aléa d'ordre se consomme comme avant.
  var PRIORITES_1G = { QUICK_ATTACK: 1, COUNTER: -1 };
  function prioriteDe(cote, action) {
    if (!action || action.type !== "attaque") return 0;
    var mv = actif(cote).attaques[action.index];
    if (!mv) return 0;
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 1999 CLASSE PAR EFFET, PAS PAR ATTAQUE, et il fallait le porter pour
    //    que trois des six derniers effets aient un sens : Protection et
    //    Ténacité doivent se poser AVANT le coup qu'elles encaissent, et Voile
    //    Miroir ne peut rendre que ce qu'elle a déjà reçu. Sans l'ordre, les
    //    trois sont des tours perdus — pas des attaques faibles, des attaques
    //    qui ne font rien.
    // ⚠️ La table vit dans le jeu de règles (`priorites`) : en 1996 `NEUFS()`
    //    rend `null` et cette lecture n'existe pas. Aucun tirage ajouté non
    //    plus — l'aléa d'égalité se consomme avant toute comparaison.
    // ═══════════════════════════════════════════════════════════════════════
    var n = NEUFS();
    if (n && n.priorites) {
      var aP = ATT()[mv.cle];
      var pG2 = aP && n.priorites[aP.effet];
      if (pG2 !== undefined) return pG2;
    }
    return PRIORITES_1G[mv.cle] || 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA VIVE GRIFFE PASSE DEVANT — MAIS SEULEMENT À PRIORITÉ ÉGALE
  //
  //  🔴 C'EST LA LECTURE DU ROM, ET ELLE BORNE L'OBJET. `.equal_priority` est
  //     la seule branche où la griffe est consultée : elle ne double jamais une
  //     Vive-Attaque, elle ne sauve jamais d'un coup prioritaire. Sans cette
  //     borne, un objet à 23 % deviendrait le meilleur du jeu.
  //  🔑 LE TIRAGE NE SE FAIT QUE S'IL Y A UNE GRIFFE. Deux pour cent des
  //     créatures en portent une : pour tous les autres combats, pas un jet de
  //     plus qu'avant, et le rejeu ne bouge pas.
  //  ⚠️ SI LES DEUX EN PORTENT UNE, on tire pour le joueur d'abord — le ROM
  //     tranche par l'horloge interne, ce qui n'a pas de sens ici ; on garde un
  //     ordre FIXE plutôt qu'un tirage de plus, et on le dit.
  // ═══════════════════════════════════════════════════════════════════════════
  function griffeDe(camp) {
    var t = TENUS();
    if (!t || !t.viveGriffe) return null;
    var p = actif(camp);
    return p && effetTenu(p) === t.viveGriffe.effet ? t.viveGriffe : null;
  }

  function joueurEnPremier(e, prioriteJoueur, prioriteAdverse, h, ev) {
    var alea = h.brut(); // consommé dans tous les cas
    if (prioriteJoueur !== prioriteAdverse) return prioriteJoueur > prioriteAdverse;
    var gJ = griffeDe(e.joueur), gA = griffeDe(e.adverse);
    if (gJ && h.entier(gJ.sur) < gJ.seuil) {
      if (ev) ev.push({ t: "viveGriffe", cote: "joueur" });
      return true;
    }
    if (gA && h.entier(gA.sur) < gA.seuil) {
      if (ev) ev.push({ t: "viveGriffe", cote: "adverse" });
      return false;
    }
    var vj = vitesseEffective(actif(e.joueur), e.joueur.paliers, e.joueur);
    var va = vitesseEffective(actif(e.adverse), e.adverse.paliers);
    if (vj !== va) return vj > va;
    return alea < 0.5;
  }

  // ── Les statuts, en début et en fin de tour ────────────────────────────────
  //  ⚠️ `cle` EST LE COUP CHOISI, et le sommeil de 1999 en a besoin : deux
  //     coups se jouent en dormant. En 1996 le paramètre est simplement ignoré
  //     — `NEUFS()` rend `null` et la porte reste fermée pour tout le monde.
  function peutAgir(p, ev, h, quiCote, cle) {
    if (p.statut === "gel") {
      if (h.chance(DEGEL_NATUREL)) {
        p.statut = null;
        ev.push({ t: "degel", cote: quiCote, naturel: true });
      } else {
        ev.push({ t: "gele", cote: quiCote });
        return false;
      }
    }
    if (p.statut === "sommeil") {
      p.statutTours--;
      if (p.statutTours <= 0) {
        p.statut = null;
        ev.push({ t: "reveil", cote: quiCote });
        // 🔴 LE TOUR DU RÉVEIL EST PERDU, comme en 1996 (audit 13/08 : il
        //    était JOUÉ, 1018/1018 — le sommeil pouvait ne rien coûter du
        //    tout sur un tirage court, et Repos ne coûtait qu'un tour).
        return false;
      }
      ev.push({ t: "dort", cote: quiCote });
      // ═══════════════════════════════════════════════════════════════════
      //  DEUX COUPS SE JOUENT EN DORMANT — ET SANS ÇA ILS N'EXISTENT PAS
      //
      //  🔴 LE SOMMEIL PREND LE TOUR AVANT QU'ON SACHE QUEL COUP A ÉTÉ CHOISI.
      //     C'est la règle juste pour 1996, où aucun coup ne se joue endormi.
      //     1999 en ajoute deux — Blabla Dodo et Ronflement — dont c'est TOUTE
      //     la raison d'être : les deux étaient écrits, tirés au sort par
      //     l'adversaire, offerts en capsule, et le sommeil les avalait avant
      //     qu'une seule ligne de leur code ne tourne.
      //     *Une règle écrite et jamais branchée ne se voit pas : elle ne
      //     plante pas, elle ne fait rien.*
      //  ⚠️ LE COMPTEUR DE SOMMEIL A DÉJÀ DESCENDU, et la phrase « il dort » est
      //     déjà dite : jouer en dormant ne raccourcit pas la nuit, et le
      //     joueur voit les deux lignes — il dort, et il marmonne.
      // ═══════════════════════════════════════════════════════════════════
      var nD = NEUFS();
      if (nD && nD.enDormant && cle && nD.enDormant.indexOf(cle) >= 0) return true;
      return false;
    }
    // 🔴 LA PLEINE PARALYSIE EXISTE ENFIN (audit 13/08) : 900/900 tours joués
    //    paralysé, zéro bloqué — le ROM en bloque 63/256 ≈ 25 %. C'est TOUTE
    //    la moitié offensive du statut. ⚠️ Un tirage de plus par tour de
    //    paralysé : changement du contrat de rejeu, livré dans le bump groupé.
    if (p.statut === "para" && h.chance(100 * 63 / 256)) {
      ev.push({ t: "pleinePara", cote: quiCote });
      return false;
    }
    return true;
  }

  // 🔴 LA VAMPIGRAINE DRAINE VRAIMENT, et vers celui qui l'a posée. Sans le
  //    second camp en paramètre, la graine aurait retiré des points de vie à
  //    personne — l'effet à moitié posé, qui est pire que pas d'effet.
  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QUE L'OBJET TENU FAIT EN FIN DE TOUR — ET IL LE DIT
  //
  //  🔴 UNE BARRE DE VIE QUI REMONTE SANS UNE LIGNE SE LIT COMME UN BUG. La
  //     Vampigraine a payé exactement ça le 14/08 : « par moment des Pokémon
  //     perdent de la vie sans aucune raison particulière ». Les Restes
  //     rendent des points de vie à chaque tour ; sans événement, le joueur
  //     verrait un adversaire se soigner tout seul et n'en saurait pas la
  //     cause.
  //  🔴 ET UNE BAIE SE CONSOMME. Un soin qui ne coûte rien est un soin infini :
  //     le seuil se franchit une fois, l'objet part, et le tour suivant le
  //     Pokémon est seul. C'est le marché du canon.
  //  ⚠️ ZÉRO TIRAGE : les Restes sont une fraction, la baie est un SEUIL sur
  //     les points de vie. Rien ici ne se joue aux dés.
  // ═══════════════════════════════════════════════════════════════════════════
  function objetFinDeTour(p, ev, quiCote) {
    var t = TENUS();
    if (!t || !vivant(p) || !p.objet) return;
    var e = effetTenu(p);
    if (!e) return;
    if (e === t.leftovers.effet && p.pv < p.stats.pv) {
      var soin = Math.max(1, Math.floor(p.stats.pv / t.leftovers.part));
      var avant = p.pv;
      MOT().poserPv(p, p.pv + soin, "restes");
      ev.push({ t: "tenuSoigne", cote: quiCote, objet: p.objet, soin: p.pv - avant, pv: p.pv });
      return;
    }
    var baie = t.baies[e];
    if (baie && p.pv <= Math.floor(p.stats.pv * baie.seuil)) {
      var a2 = p.pv;
      MOT().poserPv(p, p.pv + baie.soigne, "baie");
      ev.push({ t: "tenuSoigne", cote: quiCote, objet: p.objet, soin: p.pv - a2, pv: p.pv, consomme: true });
      p.objet = null;
      return;
    }
    // ── La Baie Mystère : le coup tombé à zéro repart avec cinq points ──────
    //  ⚠️ AUCUN TIRAGE : c'est un SEUIL, comme les autres baies. Elle avait été
    //     rangée parmi « ce qui demande un jet » sur une lecture trop rapide —
    //     la table du ROM lui donne −1 en troisième colonne, c'est-à-dire
    //     justement « pas de seuil de hasard ».
    //  🔑 ELLE VISE LE PREMIER COUP À SEC, dans l'ordre des cases : c'est celui
    //     que le joueur vient d'épuiser, et c'est ce qui la rend lisible.
    var rpp = t.rendPP;
    if (rpp && e === rpp.effet) {
      for (var ip = 0; ip < p.attaques.length; ip++) {
        if (p.attaques[ip] && p.attaques[ip].pp <= 0) {
          p.attaques[ip].pp = Math.min(p.attaques[ip].ppMax, rpp.pp);
          ev.push({ t: "tenuRendPP", cote: quiCote, objet: p.objet,
                    attaque: p.attaques[ip].cle, pp: p.attaques[ip].pp, consomme: true });
          p.objet = null;
          return;
        }
      }
    }
    var cure = t.soins[e];
    if (cure && p.statut && cure.indexOf(p.statut) >= 0) {
      var quoi = p.statut;
      p.statut = null;
      p.statutTours = 0;
      ev.push({ t: "tenuGuerit", cote: quiCote, objet: p.objet, statut: quoi, consomme: true });
      p.objet = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA MÉTÉO S'USE, ET LA TEMPÊTE RONGE
  //
  //  🔴 UNE MÉTÉO QUI NE S'ARRÊTE PAS N'EST PAS UNE MÉTÉO, c'est une règle du
  //     combat. Cinq tours, comptés, annoncés quand ils tombent.
  //  ⚠️ LA TEMPÊTE ÉPARGNE ROCHE, SOL ET ACIER — c'est le canon, pas une
  //     douceur, et c'est ce qui fait d'elle une arme d'ÉQUIPE : on la lance
  //     quand on a les types qui la supportent.
  //  ⚠️ ET ELLE FRAPPE AVANT L'USURE ORDINAIRE : un Pokémon qui tombe sous la
  //     tempête ne subit pas ensuite son poison, comme dans le jeu d'origine.
  // ═══════════════════════════════════════════════════════════════════════════
  function usureMeteo(e, p, ev, quiCote) {
    var n = NEUFS();
    if (!n || !e.meteo || !vivant(p)) return;
    var u = n.meteoUsure[e.meteo.cle];
    if (!u) return;
    var t = typesDe(p);
    for (var i = 0; i < t.length; i++) if (u.epargne.indexOf(t[i]) >= 0) return;
    var d = Math.max(1, Math.floor(p.stats.pv / u.part));
    MOT().poserPv(p, p.pv - d, "usureMeteo");
    ev.push({ t: "meteoRonge", cote: quiCote, cle: e.meteo.cle, degats: d, pv: p.pv });
  }

  //  Le compte à rebours de la météo. Une seule fois par tour, à la fin.
  function meteoFinDeTour(e, ev) {
    if (!e.meteo) return;
    e.meteo.reste--;
    if (e.meteo.reste <= 0) {
      ev.push({ t: "meteoFinit", cle: e.meteo.cle });
      e.meteo = null;
    }
  }

  function usureFinDeTour(p, ev, quiCote, cote, autre) {
    if (!vivant(p)) return;
    objetFinDeTour(p, ev, quiCote);
    if (cote && cote.volatils.graine) {
      var drain = Math.max(1, Math.floor(p.stats.pv / 16));
      MOT().poserPv(p, p.pv - drain, "vampigraine");
      ev.push({ t: "graineDraine", cote: quiCote, degats: drain });
      if (autre) {
        var voleur = actif(autre);
        if (vivant(voleur)) {
          // 🔴 LA MOITIÉ DE LA VAMPIGRAINE ÉTAIT MUETTE — rapport de joueur du
          //    14/08 : « par moment des Pokémon perdent de la vie (adverse)
          //    sans aucune raison particulière ». Vu de l'autre côté : la
          //    graine ANNONÇAIT ce qu'elle retire et TAISAIT ce qu'elle rend.
          //    Une barre de vie qui remonte sans une ligne, c'est la classe de
          //    défaut n°1 du dossier lue sur l'écran de combat.
          //    Trouvé mécaniquement par `tools/poke-pv-muets.mjs`, qui compare
          //    le mouvement RÉEL des points de vie à ce que le tour annonce.
          var avantVol = voleur.pv;
          MOT().poserPv(voleur, voleur.pv + drain, "volDeVie");
          if (voleur.pv !== avantVol) {
            ev.push({
              t: "graineRend",
              cote: quiCote === "joueur" ? "adverse" : "joueur",
              pv: voleur.pv - avantVol,
            });
          }
        }
      }
      if (!vivant(p)) { ev.push({ t: "ko", cote: quiCote }); return; }
    }
    if (p.statut === "poison" || p.statut === "brulure") {
      var d = Math.max(1, Math.floor(p.stats.pv / 16));
      MOT().poserPv(p, p.pv - d, "usure");
      ev.push({ t: "usure", cote: quiCote, statut: p.statut, degats: d });
    } else if (p.statut === "poisonGrave") {
      p.statutTours++;
      // N × la dose de base, comme le ROM : la croissance tient même sur un
      // petit gabarit (floor((pv/16)×N) s'écrasait à 0-1 sous 16 PV).
      var g = p.statutTours * Math.max(1, Math.floor(p.stats.pv / 16));
      MOT().poserPv(p, p.pv - g, "usure");
      ev.push({ t: "usure", cote: quiCote, statut: "poisonGrave", degats: g });
    }
    if (!vivant(p)) ev.push({ t: "ko", cote: quiCote });
  }

  // ── Les effets d'attaque ───────────────────────────────────────────────────
  //  Le ROM range chaque attaque sous une CONSTANTE D'EFFET. On les traite par
  //  famille. 🔴 Un effet non traité ne doit pas se taire : il est listé dans
  //  `EFFETS_NON_TRAITES`, et `tools/poke-canon.mjs` le rapporte. Une attaque
  //  dont l'effet ne fait rien est une attaque qui ment au joueur.
  var EFFETS_NON_TRAITES = {};

  // Les effets À DÉGÂTS traités par du code dédié dans `jouerCoup` — déclarés
  // pour que le relevé EFFETS_NON_TRAITES ne les accuse pas. La liste qui
  // sous-déclare a déjà coûté deux fois (gel, Dard-Nuée) : celui qui ajoute
  // un `case` ajoute sa ligne ici, et `poke-effets-fantomes` le vérifie.
  var COUPS_TRAITES = {
    TWO_TO_FIVE_ATTACKS_EFFECT: 1, ATTACK_TWICE_EFFECT: 1, TWINEEDLE_EFFECT: 1,
    CHARGE_EFFECT: 1, FLY_EFFECT: 1, HYPER_BEAM_EFFECT: 1, RAGE_EFFECT: 1,
    THRASH_PETAL_DANCE_EFFECT: 1, TRAPPING_EFFECT: 1, JUMP_KICK_EFFECT: 1,
    RECOIL_EFFECT: 1, EXPLODE_EFFECT: 1, DRAIN_HP_EFFECT: 1, SWIFT_EFFECT: 1,
  };

  // Les effets auto-ciblés qui ne visent pas : soins, murs, préparations.
  // Voir « UN COUP SUR SOI NE FAIT AUCUN JET » dans jouerCoup.
  var VISE_SOI = {
    HEAL_EFFECT: 1, FOCUS_ENERGY_EFFECT: 1, SUBSTITUTE_EFFECT: 1, MIST_EFFECT: 1,
    LIGHT_SCREEN_EFFECT: 1, REFLECT_EFFECT: 1, HAZE_EFFECT: 1, CONVERSION_EFFECT: 1,
    BIDE_EFFECT: 1, SPLASH_EFFECT: 1, SWITCH_AND_TELEPORT_EFFECT: 1,
  };

  // 🔴 LES TAUX 1 ET 2 ÉTAIENT INVERSÉS (audit du 13/08, 165 attaques au banc).
  //    Le ROM dit : EFFECT1 = 10 %, EFFECT2 = 30 % — Tonnerre paralysait à
  //    30 % (3× le canon) pendant que Plaquage, dont les 30 % sont toute
  //    l'identité, tombait à 10 %. Pareil pour la brûlure (Déflagration
  //    amputée) et le poison, servi 30/10 quand le ROM dit 20/40. Seul le gel
  //    (10) était juste. Chiffré sur 60-200 frappes par attaque, contre-prouvé.
  var STATUT_DE = {
    PARALYZE_SIDE_EFFECT1: ["para", 10], PARALYZE_SIDE_EFFECT2: ["para", 30],
    PARALYZE_EFFECT: ["para", 100],
    BURN_SIDE_EFFECT1: ["brulure", 10], BURN_SIDE_EFFECT2: ["brulure", 30],
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 CETTE LIGNE S'ÉCRIVAIT `FREEZE_SIDE_EFFECT`, SANS SON `1`.
    //     Toute la famille porte son suffixe — `PARALYZE_SIDE_EFFECT1`,
    //     `BURN_SIDE_EFFECT1`, `POISON_SIDE_EFFECT1` — parce que c'est ainsi
    //     que les données nomment l'effet. Le gel était la seule ligne écrite
    //     sans, donc la seule à ne jamais correspondre à rien.
    //     Conséquence, depuis la création du mode : **Poing Glace, Laser Glace
    //     et Blizzard n'avaient AUCUN effet secondaire**, et toute la mécanique
    //     de gel était morte avec eux — l'événement `gele`, le dégel au Feu,
    //     l'immunité des Pokémon Glace, l'Antigel. Tout était écrit, rien ne
    //     pouvait s'allumer.
    //  🔴 TROUVÉ EN MESURANT, PAS EN LISANT : 3 000 combats joués, zéro `gele`.
    //     Une relecture n'attrape pas un caractère manquant dans une clé ;
    //     seul un relevé de ce qui SORT le montre.
    //  ⚠️ CE N'EST PAS UN RÉGLAGE, C'EST UNE RÉPARATION — mais elle a un effet
    //     réel sur la difficulté, dans les deux sens : le gel de la première
    //     génération ne se lève pas tout seul. Il faut une attaque de Feu ou un
    //     Antigel. Les Champions qui portent de la Glace deviennent nettement
    //     plus dangereux, à commencer par Olga au Conseil 4.
    // ═══════════════════════════════════════════════════════════════════════
    FREEZE_SIDE_EFFECT1: ["gel", 10],
    POISON_SIDE_EFFECT1: ["poison", 20], POISON_SIDE_EFFECT2: ["poison", 40],
    // ⚠️ Pas de TOXIC_EFFECT ici : cette clé n'existe dans AUCUNE donnée (le
    //    ROM range Toxik sous POISON_EFFECT et la distingue par son NOM — voir
    //    la reconnaissance dans jouerCoup). Une clé morte des deux côtés est
    //    exactement ce que `poke-effets-fantomes` traque.
    POISON_EFFECT: ["poison", 100],
    SLEEP_EFFECT: ["sommeil", 100],
  };
  var PALIER_DE = {
    ATTACK_DOWN1_EFFECT: ["atk", -1, 100], DEFENSE_DOWN1_EFFECT: ["def", -1, 100],
    // ⚠️ Pas de SPECIAL_DOWN1 ni de SPEED_UP1 : aucune attaque de 1996 ne les
    //    porte (Hâte est UP2, aucune baisse pure de Spécial n'existe). Une clé
    //    morte des deux côtés est la classe que `poke-effets-fantomes` traque.
    SPEED_DOWN1_EFFECT: ["vit", -1, 100],
    // 🔴 33,2 % = 85/256, le taux du ROM (validé proprio 13/08, lot 3 de
    //    l'audit). Le 10 % était la valeur des générations 2+ : Psyko perdait
    //    les deux tiers de son identité — et le Conseil 4 son venin.
    ATTACK_DOWN_SIDE_EFFECT: ["atk", -1, 33.2], DEFENSE_DOWN_SIDE_EFFECT: ["def", -1, 33.2],
    SPEED_DOWN_SIDE_EFFECT: ["vit", -1, 33.2], SPECIAL_DOWN_SIDE_EFFECT: ["spe", -1, 33.2],
    ATTACK_UP1_EFFECT: ["atk", 1, 100], DEFENSE_UP1_EFFECT: ["def", 1, 100],
    SPECIAL_UP1_EFFECT: ["spe", 1, 100],
    ATTACK_UP2_EFFECT: ["atk", 2, 100], DEFENSE_UP2_EFFECT: ["def", 2, 100],
    SPEED_UP2_EFFECT: ["vit", 2, 100], SPECIAL_UP2_EFFECT: ["spe", 2, 100],
    // 🔴 Trois paliers manquaient à l'appel, et quatre attaques ne faisaient
    //    donc RIEN : Jet de Sable, Brouillard, Flash et Télékinésie baissent la
    //    précision ; Grincement casse la Défense de deux crans ; Reflet et
    //    Lilliput montent l'esquive. Les statistiques existaient déjà dans
    //    `paliers` — il n'y manquait que la ligne qui les relie à l'effet.
    ACCURACY_DOWN1_EFFECT: ["precision", -1, 100],
    DEFENSE_DOWN2_EFFECT: ["def", -2, 100],
    EVASION_UP1_EFFECT: ["esquive", 1, 100],
  };
  // 🔴 INVERSÉE AUSSI (audit 13/08) : le ROM dit EFFECT1 = 10 %, EFFECT2 = 30 %.
  //    Morsure apeurait 3× trop, Coup d'Boule 3× trop peu.
  var PEUR_DE = { FLINCH_SIDE_EFFECT1: 10, FLINCH_SIDE_EFFECT2: 30 };
  // Effets traités par du code dédié plus bas, et qu'il ne faut donc PAS
  // compter comme muets.
  var TRAITES_AILLEURS = {
    CONFUSION_EFFECT: 1, CONFUSION_SIDE_EFFECT: 1,
    // Les vingt-et-un effets réparés le 07/08/2026. Voir `effetSpecial`.
    SPECIAL_DAMAGE_EFFECT: 1, SWITCH_AND_TELEPORT_EFFECT: 1, HEAL_EFFECT: 1,
    SPLASH_EFFECT: 1, HAZE_EFFECT: 1, MIST_EFFECT: 1, LIGHT_SCREEN_EFFECT: 1,
    REFLECT_EFFECT: 1, FOCUS_ENERGY_EFFECT: 1, LEECH_SEED_EFFECT: 1,
    SUBSTITUTE_EFFECT: 1, DISABLE_EFFECT: 1, MIMIC_EFFECT: 1,
    MIRROR_MOVE_EFFECT: 1, METRONOME_EFFECT: 1, CONVERSION_EFFECT: 1,
    TRANSFORM_EFFECT: 1, BIDE_EFFECT: 1,
    // 🔴 CES QUATRE-LÀ S'EXÉCUTAIENT SANS ÊTRE DÉCLARÉS — 11/08/2026.
    //    Elles sont traitées vingt lignes plus bas, dans `effetSpecial`, et
    //    absentes d'ici : `EFFETS_TRAITES` SOUS-DÉCLARAIT le moteur. Or l'écran
    //    s'en sert comme d'un laissez-passer pour décrire un coup — donc
    //    Guillotine, Empal'Korne, Abîme et Croc Fatal, qui n'ont que 1 de
    //    puissance parce que tout leur sens est dans l'effet, retombaient sur
    //    « Une attaque de soutien ». CT27 Abîme, la plus chère du jeu à
    //    5 000 ₽, se vendait avec la phrase d'un coup de soutien.
    //    *Une liste qui déclare moins que le code ment dans l'autre sens : elle
    //    ne promet pas trop, elle fait taire ce qui marche.*
    OHKO_EFFECT: 1, SUPER_FANG_EFFECT: 1, DREAM_EATER_EFFECT: 1,
    PAY_DAY_EFFECT: 1,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES EFFETS QUI REMPLACENT L'ATTAQUE — 07/08/2026
  //
  //  🔴 VINGT-ET-UNE ATTAQUES NE FAISAIENT RIEN. Elles s'affichaient, elles
  //     consommaient un tour, et le jeu ne changeait pas d'un octet. Ce sont
  //     précisément les coups dont on se souvient : Métronome, Morphing,
  //     Clonage, Vampigraine, Patience. Une attaque qui ment au joueur est le
  //     défaut le plus cher du projet, et il y en avait vingt-et-un.
  //
  //  Chaque effet ci-dessous rend `true` s'il a CONSOMMÉ le tour : l'assaut
  //  s'arrête alors là, sans passer par la formule de dégâts.
  //
  //  ⚠️ Un détail du canon qu'on garde exprès : PUISSANCE (Focus Energy)
  //     DIVISE le taux de coup critique au lieu de le multiplier. C'est un
  //     bug célèbre de la première génération, pas une erreur de ma part — le
  //     corriger donnerait un jeu qui n'a jamais existé.
  // ═══════════════════════════════════════════════════════════════════════════

  // Les dégâts fixes, par attaque. Le ROM ne les range pas dans une table : ils
  // sont écrits dans la routine de chaque coup, et on les reprend ici.
  function degatsFixes(cle, pA, h) {
    if (cle === "SONICBOOM") return 20;
    if (cle === "DRAGON_RAGE") return 40;
    if (cle === "SEISMIC_TOSS" || cle === "NIGHT_SHADE") return pA.niveau;
    // La plage du ROM est 1..floor(1,5N)−1 — la borne haute EXCLUSIVE (audit
    // 13/08). Le max(1, …) intérieur garde le niveau 1 jouable (toujours 1),
    // la divergence anti-blocage qu'on conserve.
    if (cle === "PSYWAVE") return h.entier(Math.max(1, Math.floor(pA.niveau * 1.5) - 1)) + 1;
    return 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES EFFETS DE LA SECONDE GÉNÉRATION — MÉTÉO ET DRAPEAUX À DURÉE
  //
  //  🔴 UNE SEULE PORTE, APPELÉE EN TÊTE DU RÉPARTITEUR. Les disséminer dans le
  //     `switch` aurait mêlé deux générations dans une même liste de `case`,
  //     et la première n'aurait plus été lisible d'un coup d'œil. Ici, un
  //     `return null` immédiat en 1996 : rien ne se lit, rien ne se pose.
  //  ⚠️ ZÉRO TIRAGE. La météo est un compteur, les drapeaux sont des compteurs.
  //     Ce qui demande un jet — Protection, Ténacité, Dépit — n'est pas ici.
  // ═══════════════════════════════════════════════════════════════════════════
  //  Le corps des quatre. Séparé du répartiteur pour qu'il reste lisible d'un
  //  coup d'œil : le répartiteur dit LEQUEL, celui-ci dit QUOI.
  function sansJet(sj, e, source, cible, pA, pD, quiA, quiD, ev) {
    // ── Malédiction ────────────────────────────────────────────────────────
    if (sj.quoi === "malediction") {
      var estSpectre = typesDe(pA).indexOf(sj.typeQuiPose) >= 0;
      if (!estSpectre) {
        //  Le versant de tout le monde : deux crans gagnés, un perdu. Les trois
        //  passent par la porte des paliers, donc l'écran les raconte déjà.
        for (var ip = 0; ip < sj.paliers.length; ip++) {
          bougerPalier(source, sj.paliers[ip][0], sj.paliers[ip][1], ev, quiA);
        }
        return true;
      }
      //  Le versant du Spectre : il paie, et la plaie s'installe.
      var cout = Math.max(1, Math.floor(pA.stats.pv / sj.coutPart));
      MOT().poserPv(pA, pA.pv - cout, "maledictionCout");
      ev.push({ t: "maledictionPaye", cote: quiA, degats: cout, pv: pA.pv });
      if (!vivant(pA)) ev.push({ t: "ko", cote: quiA });
      cible.volatils.malediction = true;
      ev.push({ t: "maledictionPose", cote: quiD });
      return true;
    }

    // ── Glas de Soin ───────────────────────────────────────────────────────
    if (sj.quoi === "glasDeSoin") {
      var releves = 0;
      for (var ik = 0; ik < source.equipe.length; ik++) {
        var m = source.equipe[ik];
        if (!m || !m.statut) continue;
        m.statut = null;
        m.statutTours = 0;
        releves++;
      }
      //  🔴 ZÉRO SOIGNÉ SE DIT AUSSI. Une attaque qui ne fait rien SANS LE DIRE
      //     est exactement ce que ce dossier traque : le joueur a payé son tour.
      ev.push({ t: "glasDeSoin", cote: quiA, soignes: releves });
      return true;
    }

    // ── Bide en Vrac ───────────────────────────────────────────────────────
    if (sj.quoi === "bideEnVrac") {
      var moitie = Math.max(1, Math.floor(pA.stats.pv / sj.coutPart));
      if (pA.pv <= moitie) {
        ev.push({ t: "bideRefuse", cote: quiA });
        return true;
      }
      MOT().poserPv(pA, pA.pv - moitie, "bideEnVracCout");
      bougerPalier(source, "atk", sj.crans, ev, quiA);
      ev.push({ t: "bideEnVrac", cote: quiA, degats: moitie, pv: pA.pv });
      return true;
    }

    // ── Partage ────────────────────────────────────────────────────────────
    if (sj.quoi === "partage") {
      var moyenne = Math.floor((pA.pv + pD.pv) / 2);
      MOT().poserPv(pA, Math.min(pA.stats.pv, moyenne), "partage");
      MOT().poserPv(pD, Math.min(pD.stats.pv, moyenne), "partage");
      //  ⚠️ LES DEUX MONTANTS SONT DITS. Un seul ne prouverait pas l'égalisation,
      //     et c'est elle la règle — le contrôle a besoin des deux.
      ev.push({ t: "partage", cote: quiA, pv: pA.pv, pvAdverse: pD.pv });
      if (!vivant(pD)) ev.push({ t: "ko", cote: quiD });
      if (!vivant(pA)) ev.push({ t: "ko", cote: quiA });
      return true;
    }

    // ── Picots : on pose un piège, on ne frappe personne ────────────────────
    //  🔴 LE SEUL COUP DU JEU QUI NE VISE PAS L'ADVERSAIRE MAIS SON TERRAIN.
    //     Il ne vit donc pas dans `volatils` — qui s'efface au remplacement —
    //     mais sur le CAMP : c'est le remplacement qu'il punit.
    if (sj.quoi === "poserPiege") {
      cible.piegesPoses = cible.piegesPoses || {};
      //  🔴 UN REFUS DIT SA VRAIE CAUSE. « Il y en a déjà » n'est pas
      //     « ça n'affecte pas » : le joueur doit savoir qu'il a payé un tour
      //     pour rien, et pourquoi.
      if (cible.piegesPoses[sj.piege]) {
        ev.push({ t: "piegeDeja", cle: sj.piege, cote: quiD });
        return true;
      }
      cible.piegesPoses[sj.piege] = true;
      ev.push({ t: "piegePose", cle: sj.piege, cote: quiD });
      return true;
    }

    // ── Attraction ─────────────────────────────────────────────────────────
    //  🔑 LE SEXE VIENT DU REGISTRE, PAS DU MOTEUR. Une créature n'a pas un
    //     sexe : elle a un sexe DANS UN MONDE, et 1996 n'en a pas du tout.
    //  ⚠️ TROIS REFUS, TROIS PHRASES. Confondre « ils sont du même sexe »,
    //     « celui-là n'a pas de sexe » et « il est déjà amoureux » ferait
    //     passer Attraction pour un coup capricieux ; ce sont trois situations
    //     que le joueur peut lire sur l'écran et corriger.
    if (sj.quoi === "attraction") {
      var reg = W.PokeRegles;
      var sexeA = reg && reg.sexeDe ? reg.sexeDe(pA) : null;
      var sexeD = reg && reg.sexeDe ? reg.sexeDe(pD) : null;
      if (cible.volatils.attraction) { ev.push({ t: "attractionDeja", cote: quiD }); return true; }
      if (!sexeA || !sexeD) { ev.push({ t: "attractionSansSexe", cote: quiD }); return true; }
      if (sexeA === sexeD) { ev.push({ t: "attractionMemeSexe", cote: quiD }); return true; }
      cible.volatils.attraction = true;
      ev.push({ t: "attraction", cote: quiD });
      return true;
    }

    // ── Cauchemar : il faut que l'autre dorme ──────────────────────────────
    if (sj.quoi === "cauchemar") {
      if (pD.statut !== "sommeil") { ev.push({ t: "cauchemarEveille", cote: quiD }); return true; }
      if (cible.volatils.cauchemar) { ev.push({ t: "cauchemarDeja", cote: quiD }); return true; }
      cible.volatils.cauchemar = true;
      ev.push({ t: "cauchemar", cote: quiD });
      return true;
    }

    // ── Psykoud'Boul : on COPIE les paliers de l'autre ─────────────────────
    //  ⚠️ ZÉRO COPIÉ SE DIT AUSSI, comme pour le Glas de Soin : le joueur a
    //     payé son tour, et « rien à copier » est une information — elle lui
    //     dit d'attendre que l'autre se prépare.
    if (sj.quoi === "copiePaliers") {
      var bouges = 0;
      for (var cp in cible.paliers) {
        if (source.paliers[cp] !== cible.paliers[cp]) bouges++;
        source.paliers[cp] = cible.paliers[cp];
      }
      ev.push({ t: "copiePaliers", cote: quiA, change: bouges });
      return true;
    }

    // ── Conversion 2 : prendre un type qui RÉSISTE au dernier coup joué ────
    //  🔑 ON CHERCHE DANS LA TABLE DES TYPES DU MONDE COURANT, jamais dans une
    //     liste écrite ici : 1999 en ajoute deux, et une liste figée les
    //     ignorerait sans rien casser — la pire des pannes.
    if (sj.quoi === "conversionDeux") {
      var derC = cible.volatils.dernierCoup;
      var attC = derC && ATT()[derC];
      if (!attC || !attC.type) {
        ev.push({ t: "rienAPrendre", cote: quiD, quoi: "conversionDeux" });
        return true;
      }
      var table = TABLE();
      var choisi = null;
      for (var tt in table) {
        if (efficacite(attC.type, [tt]) < 1) { choisi = tt; break; }
      }
      if (!choisi) { ev.push({ t: "conversionSansAbri", cote: quiA, type: attC.type }); return true; }
      garderAvantTransformation(pA);
      pA.typesForces = [choisi];
      ev.push({ t: "conversionDeux", cote: quiA, type: choisi, contre: attC.type });
      return true;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES SIX DERNIERS EFFETS MUETS  [19/08/2026]
  //
  //  🔴 QUATRE D'ENTRE EUX COÛTENT UN TIRAGE, et c'est dit sur la porte : la
  //     table `avecJet` de `gen2/effets-neufs.js` porte un champ `jets` par
  //     effet, et `tools/poke-gen2-effets-avec-jet.mjs` compte les tirages
  //     réellement consommés. Une promesse qu'aucun outil ne vérifie ne tient
  //     pas trois livraisons.
  //  ⚠️ LE TIRAGE SE CONSOMME MÊME QUAND L'EFFET ÉCHOUE. C'est la convention du
  //     dépôt — un tirage supprimé se conserve — et sans elle un Dépit sur une
  //     cible qui n'a rien joué décalerait toute la suite de la graine.
  // ═══════════════════════════════════════════════════════════════════════════
  //  Le dernier coup de la cible, retrouvé dans SA liste et encore employable.
  //  🔑 Dépit et Bis mordent tous deux sur une attaque RÉELLE : retirer des
  //     points de pouvoir à un coup que la créature ne possède pas, ou
  //     l'enfermer dedans, ne veut rien dire.
  function indexDuDernier(camp, p) {
    var cle = camp.volatils.dernierCoup;
    if (!cle) return -1;
    for (var i = 0; i < p.attaques.length; i++) {
      if (p.attaques[i] && p.attaques[i].cle === cle && p.attaques[i].pp > 0) return i;
    }
    return -1;
  }

  function avecJet(aj, e, source, cible, pA, pD, quiA, quiD, mv, ev, h) {
    // ── Protection et Ténacité ─────────────────────────────────────────────
    //  🔑 UN SEUL COMPTEUR POUR LES DEUX, et il ne se remet à zéro qu'en jouant
    //     autre chose (voir `assaut`). C'est ce qui empêche d'alterner les deux
    //     pour esquiver l'usure — et c'est le ROM de 1999, pas un durcissement.
    if (aj.quoi === "abri" || aj.quoi === "tenacite") {
      var suite = source.volatils[aj.compteur] || 0;
      var seuil = aj.depart >> suite;
      var jetG = h.entier(aj.sur);
      if (seuil <= 0 || jetG >= seuil) {
        source.volatils[aj.compteur] = 0;
        ev.push({ t: "gardeCede", cote: quiA, quoi: aj.quoi });
        return true;
      }
      source.volatils[aj.compteur] = suite + 1;
      source.volatils[aj.quoi] = true;
      ev.push({ t: "garde", cote: quiA, quoi: aj.quoi });
      return true;
    }

    // ── Dépit : des points de pouvoir en moins sur le dernier coup joué ────
    if (aj.quoi === "depit") {
      var perte = h.entre(aj.ppMin, aj.ppMax);   // ⚠️ tiré dans TOUS les cas
      // 🔴 UN REFUS DOIT DIRE LA VRAIE CAUSE. « Ça n'affecte pas X » est la
      //    phrase de l'immunité de type ; ici l'attaque a très bien porté, elle
      //    n'a simplement rien trouvé à ronger. Le joueur qui lit la mauvaise
      //    raison range le coup comme inutile au lieu de le rejouer un tour
      //    plus tard.
      var iD = indexDuDernier(cible, pD);
      if (iD < 0) { ev.push({ t: "rienAPrendre", cote: quiD, quoi: "depit" }); return true; }
      var vrai = Math.min(perte, pD.attaques[iD].pp);
      pD.attaques[iD].pp -= vrai;
      ev.push({ t: "depit", cote: quiD, attaque: pD.attaques[iD].cle, pp: vrai });
      return true;
    }

    // ── Bis : la cible rejoue son dernier coup ─────────────────────────────
    if (aj.quoi === "bis") {
      var tours = h.entre(aj.toursMin, aj.toursMax);   // ⚠️ tiré dans TOUS les cas
      var iB = indexDuDernier(cible, pD);
      var interdit = iB >= 0 && aj.refuse.indexOf(pD.attaques[iB].cle) >= 0;
      // 🔴 TROIS CAUSES, TROIS PHRASES. « Il n'a rien joué », « ce coup-là ne
      //    se répète pas » et « il est déjà enfermé » sont trois refus
      //    différents : les confondre sous un seul message ferait croire à un
      //    coup capricieux.
      if (cible.volatils.bis && cible.volatils.bis.tours > 0) {
        ev.push({ t: "bisDeja", cote: quiD });
        return true;
      }
      if (iB < 0) { ev.push({ t: "rienAPrendre", cote: quiD, quoi: "bis" }); return true; }
      if (interdit) {
        ev.push({ t: "bisRefuse", cote: quiD, attaque: pD.attaques[iB].cle });
        return true;
      }
      cible.volatils.bis = { cle: pD.attaques[iB].cle, tours: tours };
      ev.push({ t: "bis", cote: quiD, attaque: pD.attaques[iB].cle, tours: tours });
      return true;
    }

    // ── Voile Miroir : le double du SPÉCIAL encaissé ce tour ───────────────
    //  ⚠️ AUCUN TIRAGE, et la symétrie exacte de Riposte : elle ne rend que ce
    //     qu'elle a reçu AVANT de jouer, donc il faut être plus lent — ce que
    //     la table des priorités garantit désormais au lieu de l'espérer.
    if (aj.quoi === "voileMiroir") {
      var duS = source.volatils.voileMiroir || 0;
      source.volatils.voileMiroir = 0;
      if (duS <= 0) { ev.push({ t: "voileMiroirPerdu", cote: quiA }); return true; }
      if (!vivant(pD)) return true;
      var rendu = duS * aj.facteur;
      ev.push({ t: "voileMiroirRend", cote: quiA, degats: rendu });
      encaisser(cible, pD, rendu, ev, quiD);
      return true;
    }

    // ── Gribouille : le dernier coup de la cible, POUR DE BON ──────────────
    //  🔑 C'EST CE QUI LE SÉPARE DE COPIE. Copie tire au sort et s'efface au
    //     repli ; Gribouille prend le coup qu'on vient de subir et le garde
    //     pour le reste de la partie — l'attaque s'écrase elle-même, comme
    //     Copie, mais avec ses points de pouvoir pleins.
    if (aj.quoi === "gribouille") {
      var der = cible.volatils.dernierCoup;
      var deja = false;
      for (var kG = 0; kG < pA.attaques.length; kG++) {
        if (pA.attaques[kG] && pA.attaques[kG].cle === der) deja = true;
      }
      if (mv.synthetique) { ev.push({ t: "sansEffet", cote: quiA, attaque: mv.cle }); return true; }
      if (deja) { ev.push({ t: "gribouilleDeja", cote: quiA, attaque: der }); return true; }
      if (!der || !ATT()[der] || aj.refuse.indexOf(der) >= 0) {
        ev.push({ t: "rienAPrendre", cote: quiD, quoi: "gribouille" });
        return true;
      }
      mv.cle = der;
      mv.pp = ATT()[der].pp;
      mv.ppMax = mv.pp;
      ev.push({ t: "gribouille", cote: quiA, attaque: der });
      return true;
    }

    // ── Vantardise : le cadeau et le pari ──────────────────────────────────
    //  🔑 LES DEUX MOITIÉS SONT LE COUP. Monter l'Attaque de l'adversaire de
    //     deux crans est un cadeau ; la confusion est le pari qu'il se frappera
    //     lui-même AVEC ce cadeau. En retirer une donnerait soit un coup
    //     absurde, soit une Onde Folie de plus.
    //  ⚠️ LE TIRAGE SE FAIT D'ABORD, ET IL SE CONSOMME MÊME SI LA CONFUSION NE
    //     PREND PAS — convention du dépôt : un tirage supprimé se conserve.
    if (aj.quoi === "vantardise") {
      var dureeV = h.entre(2, 5);
      bougerPalier(cible, "atk", aj.crans, ev, quiD);
      if (cible.volatils.confusion) { ev.push({ t: "vantardiseDeja", cote: quiD }); return true; }
      cible.volatils.confusion = dureeV;
      ev.push({ t: "confusion", cote: quiD });
      return true;
    }

    // ── Prescience : le coup part maintenant et tombe plus tard ────────────
    //  🔴 LES DÉGÂTS SE CALCULENT AU LANCER. C'est le canon, et c'est ce qui
    //     rend le coup jouable : on paie sur les statistiques d'aujourd'hui, et
    //     il arrive quoi qu'il se passe entre-temps — y compris si celui qui
    //     l'a lancé a quitté le terrain.
    //  ⚠️ IL VIT SUR LE CAMP, pas dans les volatils : un remplacement ne
    //     l'efface pas. C'est le second piège de la génération qui traverse un
    //     changement, avec les Picots.
    if (aj.quoi === "prescience") {
      if (cible.differe) { ev.push({ t: "prescienceDeja", cote: quiD }); return true; }
      var rP = degats(pA, pD, mv.cle, ctxDegats(e, source, cible, quiA, quiD, ATT()[mv.cle], {
        sansType: true, sansCritique: true,
      }), h);
      cible.differe = { cle: mv.cle, tours: aj.tours, degats: rP.degats };
      ev.push({ t: "prescience", cote: quiD, attaque: mv.cle });
      return true;
    }

    // ── Blabla Dodo : jouer un autre de ses coups EN DORMANT ───────────────
    //  🔴 LE SEUL COUP DU JEU QUI RETOURNE UN STATUT SUBI EN TOUR JOUÉ, et
    //     c'est pour ça qu'il n'a de sens QUE si l'on dort : éveillé, il ne
    //     fait rien — et il le dit, au lieu de laisser croire à un raté.
    //  ⚠️ LE TIRAGE SE FAIT D'ABORD, MÊME SI RIEN N'EST JOUABLE.
    if (aj.quoi === "blablaDodo") {
      var possibles = [];
      for (var kB = 0; kB < pA.attaques.length; kB++) {
        var mB = pA.attaques[kB];
        if (!mB || mB.cle === mv.cle) continue;
        if (aj.refuse.indexOf(mB.cle) >= 0) continue;
        possibles.push(mB.cle);
      }
      var tire = possibles.length ? possibles[h.entier(possibles.length)] : null;
      if (pA.statut !== "sommeil") { ev.push({ t: "blablaEveille", cote: quiA }); return true; }
      if (!tire) { ev.push({ t: "rienAPrendre", cote: quiA, quoi: "blablaDodo" }); return true; }
      ev.push({ t: "blablaDodo", cote: quiA, attaque: tire });
      rejouer(e, source, cible, tire, ev, h);
      return true;
    }
    return null;
  }

  function effetGen2(e, source, cible, pA, pD, quiA, quiD, mv, a, ev, h) {
    var n = NEUFS();
    if (!n) return null;

    var m = n.meteo[a.effet];
    if (m) {
      // 🔴 LA MÉTÉO EST DU COMBAT, PAS D'UN CAMP. Posée sur un camp, elle
      //    aurait avantagé celui qui la lance deux fois — une fois par ses
      //    dégâts, une fois par ceux qu'il encaisse.
      e.meteo = { cle: m.cle, reste: m.tours };
      ev.push({ t: "meteo", cle: m.cle, tours: m.tours });
      return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LES QUATRE EFFETS SANS TIRAGE  [19/08/2026]
    //
    //  🔴 ILS SE CALCULENT ENTIÈREMENT, et c'est la seule raison pour laquelle
    //     ils sont ici : une moitié de points de vie, une moyenne, un balayage
    //     de statuts, des crans fixes. Aucun jet ajouté, donc aucune graine du
    //     mode ne change de résultat.
    //  🔑 LES NOMBRES VIENNENT DE `gen2/effets-neufs.js`. Ce fichier ne connaît
    //     ni « la moitié », ni « le quart », ni « six crans » : il connaît
    //     `coutPart`, `rongePart`, `crans`. Le jour où la seconde génération
    //     s'en va, ces valeurs partent avec elle.
    // ═══════════════════════════════════════════════════════════════════════
    var sj = (n.sansJet || {})[a.effet];
    if (sj) return sansJet(sj, e, source, cible, pA, pD, quiA, quiD, ev);

    var aj = (n.avecJet || {})[a.effet];
    if (aj) return avecJet(aj, e, source, cible, pA, pD, quiA, quiD, mv, ev, h);

    var d = n.durees[a.effet];
    if (d) {
      if (d.deuxCamps) {
        source.volatils[d.cle] = d.tours;
        cible.volatils[d.cle] = d.tours;
      } else if (d.camp) source.volatils[d.cle] = d.tours;
      else if (d.soi) source.volatils[d.cle] = d.tours;
      else cible.volatils[d.cle] = d.tours || true;
      ev.push({ t: "drapeau", cle: d.cle, cote: (d.camp || d.soi) ? quiA : quiD, tours: d.tours });
      return true;
    }
    return null;
  }

  function effetSpecial(e, source, cible, pA, pD, quiA, quiD, mv, a, ev, h) {
    // 🔴 LES EFFETS DE 1999 D'ABORD, et ils rendent `null` quand ce n'est pas
    //    leur affaire : le répartiteur de 1996 reprend exactement où il était.
    var _g2 = effetGen2(e, source, cible, pA, pD, quiA, quiD, mv, a, ev, h);
    if (_g2 !== null) return _g2;
    // ═══════════════════════════════════════════════════════════════════════
    //  RIPOSTE — 11/08/2026. LE COUP QUE NULLE TABLE NE POUVAIT TRAHIR.
    //
    //  🔴 CT18, 2 000 ₽, ET ELLE FAISAIT 1 DÉGÂT. Sa clé d'effet est
    //     `NO_ADDITIONAL_EFFECT`, comme deux cents autres coups : sa mécanique
    //     est écrite dans la routine du ROM, pas dans un octet d'effet. Les
    //     deux contrôles qui traquent les attaques muettes cherchent une clé
    //     d'effet non traitée — ils ne pouvaient donc PAS la voir. Elle s'est
    //     vendue tout ce temps avec la phrase « Une attaque de soutien ».
    //     *Un coup dont la mécanique tient dans son NOM échappe à tout contrôle
    //     indexé par l'effet.* On la reconnaît donc au nom, comme Sonicboom et
    //     Draco-Rage le sont déjà dans `degatsFixes`.
    //
    //  ⚠️ ELLE EXIGE D'ÊTRE PLUS LENT — la symétrie exacte du K.O. en un coup,
    //     qui exige d'être plus rapide. On ne modélise pas la priorité : on
    //     efface la dette à la fin du tour, donc seul un Pokémon qui frappe
    //     APRÈS avoir encaissé a quelque chose à rendre. La règle se borne
    //     toute seule, et elle se dit en une phrase au joueur.
    //  ⚠️ AUCUN TIRAGE CONSOMMÉ : elle se calcule sur des dégâts déjà rendus.
    //     Le contrat de rejeu ne bouge pas d'un cran.
    // ═══════════════════════════════════════════════════════════════════════
    if (mv && mv.cle === "COUNTER") {
      var du = source.volatils.riposte || 0;
      source.volatils.riposte = 0;
      if (du <= 0) { ev.push({ t: "ripostePerdue", cote: quiA }); return true; }
      if (!vivant(pD)) return true;
      ev.push({ t: "riposteRend", cote: quiA, degats: du * 2 });
      encaisser(cible, pD, du * 2, ev, quiD);
      return true;
    }

    switch (a.effet) {
      // ── Les dégâts qui ne dépendent pas des statistiques ──────────────────
      case "SPECIAL_DAMAGE_EFFECT": {
        // L'immunité de type s'applique quand même : Ombre Nocturne ne touche
        // pas un Normal, Frappe Atlas ne touche pas un Spectre.
        if (efficacite(a.type, typesDe(pD)) === 0) {
          ev.push({ t: "sansEffet", cote: quiD, attaque: mv.cle });
          return true;
        }
        var d = degatsFixes(mv.cle, pA, h);
        encaisser(cible, pD, d, ev, quiD);
        return true;
      }

      // ── Croc de Mort : la moitié des PV, quels qu'ils soient ────────────
      //  🔴 IL FAISAIT 1 DÉGÂT. Sa puissance vaut 1 dans les données du ROM —
      //     c'est un marqueur, pas une force — et son effet n'était écrit nulle
      //     part : le joueur qui apprenait Croc de Mort recevait une attaque
      //     qui gratte un point de vie. Ce n'est pas une attaque faible, c'est
      //     un piège.
      case "SUPER_FANG_EFFECT": {
        if (efficacite(a.type, typesDe(pD)) === 0) {
          ev.push({ t: "sansEffet", cote: quiD, attaque: mv.cle });
          return true;
        }
        encaisser(cible, pD, Math.max(1, Math.floor(pD.pv / 2)), ev, quiD);
        return true;
      }

      // ── Les trois K.O. en un coup ───────────────────────────────────────
      //  🔴 MÊME PIÈGE, EN PIRE : Guillotine, Empal'Korne et Abîme portaient 1
      //     de puissance et aucun effet. Trois attaques légendaires réduites à
      //     un grattement, avec 30 % de précision pour l'obtenir.
      //  ⚠️ LA RÈGLE DE 1996 EST GARDÉE : le coup échoue si l'on est plus LENT
      //     que la cible. C'est ce qui empêche ces attaques d'être un pari
      //     gratuit — et c'est aussi ce qui les rend jouables contre un
      //     adversaire massif et lent.
      case "OHKO_EFFECT": {
        if (efficacite(a.type, typesDe(pD)) === 0) {
          ev.push({ t: "sansEffet", cote: quiD, attaque: mv.cle });
          return true;
        }
        if (vitesseEffective(pA, source.paliers) < vitesseEffective(pD, cible.paliers)) {
          ev.push({ t: "ohkoTropLent", cote: quiA });
          return true;
        }
        encaisser(cible, pD, pD.pv, ev, quiD);
        ev.push({ t: "ohko", cote: quiD });
        return true;
      }

      // ── Dévorêve : il ne mange que les rêves ────────────────────────────
      //  🔴 `DREAM_EATER_EFFECT` n'était écrit nulle part : Dévorêve frappait
      //     ses 100 comme une attaque Psy ordinaire, sur n'importe qui, éveillé
      //     ou non. C'est pourtant tout son intérêt — c'est l'attaque qui PAIE
      //     un endormissement, et sans elle Hypnose ne mène nulle part.
      //  ⚠️ Elle échoue sur une cible éveillée, et elle rend la moitié des
      //     dégâts, comme les autres vols de vie.
      case "DREAM_EATER_EFFECT": {
        if (pD.statut !== "sommeil") {
          ev.push({ t: "reveEveille", cote: quiD });
          return true;
        }
        if (efficacite(a.type, typesDe(pD)) === 0) {
          ev.push({ t: "sansEffet", cote: quiD, attaque: mv.cle });
          return true;
        }
        // Les dégâts suivent la formule ordinaire : on laisse le cours normal
        // s'en charger, et on ne vole qu'ensuite. `false` = « continue ».
        return false;
      }

      // ── Jackpot : des pièces tombent pendant le combat ──────────────────
      //  🔴 `PAY_DAY_EFFECT` n'était écrit nulle part : l'attaque s'appelle
      //     Jackpot et ne rapportait rien. Dans un mode où la bourse médiane de
      //     fin de voyage est de 222 ₽ — mesuré —, c'est loin d'être un détail
      //     de décor : c'est la seule attaque qui finance.
      //  ⚠️ LE MOTEUR NE CONNAÎT PAS LA BOURSE, et ne doit pas la connaître.
      //     Il ACCUMULE sur l'état du combat ; c'est l'écran de fin de combat
      //     qui verse, une fois, par la même porte que le gain d'un dresseur.
      //     Deux versements auraient fini par diverger.
      case "PAY_DAY_EFFECT": {
        // Le ROM lâche deux fois le niveau de celui qui frappe.
        var pieces = 2 * pA.niveau;
        e.jackpot = (e.jackpot || 0) + pieces;
        ev.push({ t: "jackpot", cote: quiA, montant: pieces });
        // ⚠️ Et l'attaque frappe QUAND MÊME : 40 de puissance. On rend `false`
        //    pour que les dégâts suivent leur cours — un `true` ici en ferait
        //    une attaque de statut, et Jackpot cesserait de blesser.
        return false;
      }

      // ── Fuir, ou faire fuir ───────────────────────────────────────────────
      case "SWITCH_AND_TELEPORT_EFFECT":
        // Contre un dresseur, ça échoue : on ne quitte pas un combat officiel.
        if (e.sauvage) { e.fini = "fuite"; ev.push({ t: "fuite", cote: quiA, reussi: true }); }
        else ev.push({ t: "sansEffet", cote: quiD, attaque: mv.cle });
        return true;

      // ── Se soigner ────────────────────────────────────────────────────────
      case "HEAL_EFFECT": {
        if (mv.cle === "REST") {
          // Repos rend TOUT, et endort deux tours. C'est le marché du canon.
          // 🔴 ET IL ÉCHOUE À PLEINS PV (audit 13/08) : le ROM refuse — sans
          //    cette garde, on s'endormait pour rien.
          if (pA.pv >= pA.stats.pv) { ev.push({ t: "sansEffet", cote: quiA, attaque: mv.cle }); return true; }
          pA.pv = pA.stats.pv;
          pA.statut = "sommeil";
          pA.statutTours = 2;
          ev.push({ t: "repos", cote: quiA });
          return true;
        }
        var manque = pA.stats.pv - pA.pv;
        if (manque <= 0) { ev.push({ t: "sansEffet", cote: quiA, attaque: mv.cle }); return true; }
        var soin = Math.min(manque, Math.floor(pA.stats.pv / 2));
        MOT().poserPv(pA, pA.pv + soin, "soinDuCoup");
        ev.push({ t: "soin", cote: quiA, pv: soin });
        return true;
      }

      // ── Ne rien faire, et le dire ─────────────────────────────────────────
      case "SPLASH_EFFECT":
        // 🔴 Trempette ne fait rien, et c'est CANON. Mais l'écran doit le dire :
        //    un tour muet se lit comme un bug, une blague assumée se lit comme
        //    une blague.
        ev.push({ t: "trempette", cote: quiA });
        return true;

      // ── Remettre les compteurs à zéro ─────────────────────────────────────
      case "HAZE_EFFECT": {
        source.paliers = paliersNeufs();
        cible.paliers = paliersNeufs();
        // 🔴 LE STATUT : L'ENNEMI SEUL (audit 13/08, tranché senior). L'ancien
        //    commentaire (« les deux camps ») était une croyance : en 1996 la
        //    Buée Noire guérit le statut de la CIBLE, jamais du lanceur —
        //    l'asymétrie du glitch gel, célèbre et conservée.
        // 🔴 ET LA LIGNE NE LE DISAIT PAS (audit du 14/08). « Tous les
        //    changements sont annulés » parle des PALIERS ; un joueur endormi
        //    qui se réveille d'un coup ne pouvait pas savoir que sa Buée venait
        //    de lever SON statut. C'est le fait le plus décisif du coup — la
        //    fameuse asymétrie de 1996 — et il passait sous silence.
        //    Trouvé en cherchant les ÉTATS qui changent sans une ligne, la
        //    même sonde que pour les points de vie.
        var statutLeve = pD.statut || null;
        pD.statut = null;
        // Les volatils, eux, tombent DES DEUX CAMPS : brume, murs, graine,
        //    puissance, confusion. Le clone reste — il n'est pas un palier.
        source.volatils.brume = false; cible.volatils.brume = false;
        source.volatils.mur = false; cible.volatils.mur = false;
        source.volatils.protection = false; cible.volatils.protection = false;
        source.volatils.graine = false; cible.volatils.graine = false;
        source.volatils.puissance = false; cible.volatils.puissance = false;
        source.volatils.confusion = 0; cible.volatils.confusion = 0;
        ev.push({ t: "buee", cote: quiA });
        if (statutLeve) ev.push({ t: "bueeLeve", cote: quiD, statut: statutLeve });
        return true;
      }

      case "MIST_EFFECT":
        source.volatils.brume = true;
        ev.push({ t: "brume", cote: quiA });
        return true;

      // ── Les deux murs ─────────────────────────────────────────────────────
      case "LIGHT_SCREEN_EFFECT":
        source.volatils.mur = true;
        ev.push({ t: "murLumiere", cote: quiA });
        return true;

      case "REFLECT_EFFECT":
        source.volatils.protection = true;
        ev.push({ t: "protection", cote: quiA });
        return true;

      case "FOCUS_ENERGY_EFFECT":
        source.volatils.puissance = true;
        ev.push({ t: "puissance", cote: quiA });
        return true;

      // ── Vampigraine ───────────────────────────────────────────────────────
      case "LEECH_SEED_EFFECT":
        // ⚠️ ET PAS SUR UN CLONE : en 1996 la graine ne traverse pas l'abri.
        if (cible.volatils.clone > 0) {
          ev.push({ t: "cloneTient", cote: quiD });
          return true;
        }
        // Une graine ne prend pas sur une Plante : c'est la règle du canon.
        if (typesDe(pD).indexOf("grass") >= 0 || cible.volatils.graine) {
          ev.push({ t: "sansEffet", cote: quiD, attaque: mv.cle });
        } else {
          cible.volatils.graine = true;
          ev.push({ t: "graine", cote: quiD });
        }
        return true;

      // ── Le clone ──────────────────────────────────────────────────────────
      case "SUBSTITUTE_EFFECT": {
        var cout = Math.floor(pA.stats.pv / 4);
        if (source.volatils.clone || pA.pv <= cout) {
          ev.push({ t: "sansEffet", cote: quiA, attaque: mv.cle });
          return true;
        }
        MOT().poserPv(pA, pA.pv - cout, "coutDuCoup");
        source.volatils.clone = cout;
        ev.push({ t: "clone", cote: quiA, pv: cout });
        return true;
      }

      // ── Entrave ───────────────────────────────────────────────────────────
      case "DISABLE_EFFECT": {
        var utilisables = [];
        for (var i = 0; i < pD.attaques.length; i++) {
          if (pD.attaques[i].pp > 0) utilisables.push(i);
        }
        if (!utilisables.length || cible.volatils.entrave) {
          ev.push({ t: "sansEffet", cote: quiD, attaque: mv.cle });
          return true;
        }
        var k = utilisables[h.entier(utilisables.length)];
        cible.volatils.entrave = { index: k, tours: h.entre(2, 5) };
        ev.push({ t: "entrave", cote: quiD, attaque: pD.attaques[k].cle });
        return true;
      }

      // ── Copie ─────────────────────────────────────────────────────────────
      case "MIMIC_EFFECT": {
        if (!pD.attaques.length) { ev.push({ t: "sansEffet", cote: quiD, attaque: mv.cle }); return true; }
        var pris = pD.attaques[h.entier(pD.attaques.length)];
        // Copie remplace CE coup-ci, pas un autre : on écrase Copie elle-même.
        mv.cle = pris.cle;
        mv.pp = Math.min(5, ATT()[pris.cle].pp);
        mv.ppMax = mv.pp;
        ev.push({ t: "copie", cote: quiA, attaque: pris.cle });
        return true;
      }

      // ── Les deux imitations ───────────────────────────────────────────────
      case "MIRROR_MOVE_EFFECT": {
        var derniere = cible.volatils.dernierCoup;
        if (!derniere || derniere === "MIRROR_MOVE") {
          ev.push({ t: "sansEffet", cote: quiA, attaque: mv.cle });
          return true;
        }
        ev.push({ t: "imite", cote: quiA, attaque: derniere });
        rejouer(e, source, cible, derniere, ev, h);
        return true;
      }

      case "METRONOME_EFFECT": {
        // 🔴 On tire dans TOUTES les attaques du jeu, Métronome exclu — sinon
        //    il pourrait s'appeler lui-même sans fin.
        var toutes = W.PokeRegles ? W.PokeRegles.attaquesListe() : W.POKE_ATTAQUES;
        var choisie = null;
        for (var essai = 0; essai < 12 && !choisie; essai++) {
          var c = toutes[h.entier(toutes.length)];
          if (c && c.cle !== "METRONOME" && c.cle !== "STRUGGLE") choisie = c;
        }
        if (!choisie) { ev.push({ t: "sansEffet", cote: quiA, attaque: mv.cle }); return true; }
        ev.push({ t: "metronome", cote: quiA, attaque: choisie.cle });
        rejouer(e, source, cible, choisie.cle, ev, h);
        return true;
      }

      // ── Conversion et Morphing ────────────────────────────────────────────
      case "CONVERSION_EFFECT":
        garderAvantTransformation(pA);
        pA.typesForces = ESP()[pD.n].types.slice();
        ev.push({ t: "conversion", cote: quiA, types: pA.typesForces });
        return true;

      case "TRANSFORM_EFFECT": {
        // On copie l'apparence, les types, les statistiques de combat et les
        // attaques — mais PAS les points de vie, comme dans le jeu.
        garderAvantTransformation(pA);
        pA.morphe = pD.n;
        pA.typesForces = ESP()[pD.n].types.slice();
        // 🔴 LA LISTE DES STATISTIQUES VIENT DU JEU DE RÈGLES, pas d'ici : en
        //    gen 2 il y en a une de plus, et une copie qui l'oublierait
        //    laisserait au morphé la Défense Spéciale de SON espèce d'origine.
        pA.stats = (function (src, dst) {
          var out = { pv: dst.pv };
          var l = W.PokeRegles ? W.PokeRegles.stats() : ["pv", "atk", "def", "vit", "spe"];
          for (var i = 0; i < l.length; i++) if (l[i] !== "pv") out[l[i]] = src[l[i]];
          return out;
        })(pD.stats, pA.stats);
        pA.attaques = pD.attaques.map(function (x) {
          return { cle: x.cle, pp: 5, ppMax: 5 };
        });
        // 🔴 ET LES PALIERS DE LA CIBLE SE COPIENT (audit 13/08, tranché
        //    senior) : un Métamorph face à un +6 Attaque copiait des stats
        //    nues (11/11 au banc). Les six paliers, EN PLACE — remplacer
        //    l'objet casserait la référence que lit la formule de dégâts.
        var pl;
        for (pl in source.paliers) {
          if (Object.prototype.hasOwnProperty.call(source.paliers, pl)) {
            source.paliers[pl] = cible.paliers[pl] || 0;
          }
        }
        ev.push({ t: "morphing", cote: quiA, vers: pD.n });
        return true;
      }

      // ── Patience ──────────────────────────────────────────────────────────
      case "BIDE_EFFECT":
        // Une patience DÉJÀ engagée ne se réécrase pas (audit 13/08) : le tour
        // de continuation repasse ici, il dit qu'on tient, il ne remet rien
        // à zéro.
        if (source.volatils.patience) { ev.push({ t: "patience", cote: quiA }); return true; }
        source.volatils.patience = { tours: h.entre(2, 3), encaisse: 0 };
        ev.push({ t: "patience", cote: quiA });
        return true;

      default:
        return false;
    }
  }

  // Rejouer une attaque tirée (Métronome, Mimique) sans repasser par les PP ni
  // par le choix du joueur. 🔴 On ne rappelle PAS `assaut` : il redécrémenterait
  // les PP et relancerait la confusion, donc l'effet se paierait deux fois.
  //  🔴 ET IL FAUT UNE BORNE DE PROFONDEUR. Métronome peut tirer Métronome, et
  //     Miroir peut renvoyer Miroir : le cycle est réel (environ une fois sur
  //     cent soixante-cinq par itération) et n'était borné par rien. Ce dossier
  //     a déjà payé sept boucles infinies, dont une qui ne laissait aucune
  //     trace — une profondeur de trois coûte une ligne.
  var PROFONDEUR_REJEU = 3;

  //  ⚠️ LA PROFONDEUR VIT SUR L'ÉTAT, PAS DANS LA SIGNATURE. Le cycle passe par
  //     `effetSpecial`, qui rappelle `rejouer` : threader un paramètre aurait
  //     demandé de le porter à travers une fonction appelée partout, pour un
  //     compteur qui appartient au TOUR. Il est remis à zéro par sa propre
  //     sortie, donc aucun état ne fuit d'un tour au suivant.
  function rejouer(e, source, cible, cle, ev, h) {
    if ((e.__rejeu || 0) >= PROFONDEUR_REJEU) return;
    e.__rejeu = (e.__rejeu || 0) + 1;
    try { rejouerVraiment(e, source, cible, cle, ev, h); }
    finally { e.__rejeu--; }
  }

  function rejouerVraiment(e, source, cible, cle, ev, h) {
    var faux = { cle: cle, pp: 1, ppMax: 1 };
    var a = ATT()[cle];
    if (!a) return;
    var pA = actif(source), pD = actif(cible);
    var quiA = source === e.joueur ? "joueur" : "adverse";
    var quiD = source === e.joueur ? "adverse" : "joueur";

    // ⚠️ UNE ATTAQUE REJOUÉE VISE COMME UNE AUTRE. Sans ce jet, tout touchait à
    //    cent pour cent : Fatal-Foudre et Blizzard sortis au Métronome ne
    //    rataient jamais. Les coups qui ne visent pas (sur soi) et ceux dont la
    //    précision est pleine ne consomment rien, comme dans `assaut`.
    // ⚠️ MÊME CALCUL QUE `assaut`, à la lettre : `PALIER_DE` porte des TRIPLETS
    //    `[stat, delta, chance]`, pas d'objet — un `.versSoi` inventé aurait
    //    rendu `undefined`, donc « vise l'adversaire » pour tout, y compris
    //    Hâte et Armure. Une clé qui n'existe pas ne lève rien : c'est la faute
    //    la plus fréquente du dossier.
    var palSoi = palierDe(a.effet);
    var viseSoi = a.puissance === 0 && ((palSoi && palSoi[1] > 0) || VISE_SOI[a.effet]);
    if (!viseSoi && a.precision < 100 && !h.chance(a.precision)) {
      ev.push({ t: "rate", cote: quiA });
      return;
    }

    if (effetSpecial(e, source, cible, pA, pD, quiA, quiD, faux, a, ev, h)) return;
    // 🔴 LA MÊME QUEUE QUE `assaut`, ET C'EST TOUT L'OBJET DE L'EXTRACTION :
    //    statuts, paliers, peur, confusion, coups multiples, vol de vie,
    //    contrecoup, recharge, étreinte, sacrifice. `dejaCharge` vaut VRAI —
    //    une attaque rejouée ne pose pas de tour de charge, elle se joue tout
    //    de suite ou pas du tout.
    resoudreCoup(e, source, cible, pA, pD, quiA, quiD, faux, a, ev, h, true);
  }

  // 🔴 UNE SEULE PORTE POUR ENCAISSER. Le clone doit intercepter les dégâts
  //    AVANT le Pokémon, et il n'y a qu'un endroit où l'oublier suffirait à le
  //    rendre décoratif.
  // 🔴 LA MONTÉE DE FRÉNÉSIE SE FAIT ICI, À L'ENCAISSEMENT — une seule porte,
  //    donc elle vaut pour tous les coups reçus sans exception. Posée dans la
  //    branche d'attaque, elle aurait manqué l'usure, le contrecoup et les
  //    coups multiples.
  function monterRage(cote, ev, quiCote) {
    if (!cote.volatils.rage) return;
    if (cote.paliers.atk >= 6) return;
    cote.paliers.atk++;
    ev.push({ t: "rageMonte", cote: quiCote });
  }

  function encaisser(cote, p, d, ev, quiCote, detail) {
    if (cote.volatils.clone > 0) {
      var pris = Math.min(cote.volatils.clone, d);
      cote.volatils.clone -= pris;
      ev.push({ t: "cloneEncaisse", cote: quiCote, degats: pris });
      if (cote.volatils.clone <= 0) {
        cote.volatils.clone = 0;
        ev.push({ t: "cloneCasse", cote: quiCote });
      }
      return;
    }
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 LA TÉNACITÉ TIENT À UN POINT DE VIE, ET ELLE TIENT ICI. C'est la seule
    //    porte par laquelle un coup retire des points de vie : la poser plus
    //    haut, dans la formule de dégâts, l'aurait ratée sur les coups fixes,
    //    les coups multiples et les rendus de Riposte — c'est-à-dire là où elle
    //    se joue vraiment.
    // ⚠️ ELLE NE PROTÈGE QUE DES COUPS. L'usure de fin de tour — poison,
    //    brûlure, tempête, malédiction — écrit par `poserPv` en direct et ne
    //    passe pas ici : c'est le canon, et c'est aussi ce qui empêche Ténacité
    //    de rendre un Pokémon immortel.
    // ═══════════════════════════════════════════════════════════════════════
    if (cote.volatils.tenacite && p.pv > 0 && p.pv - d <= 0) {
      d = p.pv - 1;
      ev.push({ t: "tenaciteTient", cote: quiCote });
    }
    MOT().poserPv(p, p.pv - d, "encaisser");
    monterRage(cote, ev, quiCote);
    ev.push({
      t: "degats", cote: quiCote, degats: d,
      efficacite: detail ? detail.efficacite : 1,
      critique: detail ? detail.critique : false,
    });
    if (!vivant(p)) ev.push({ t: "ko", cote: quiCote });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE SACRIFICE — DESTRUCTION ET EXPLOSION SE PAYAIENT ZÉRO
  //
  //  🔴 `EXPLODE_EFFECT` n'apparaissait NULLE PART dans ce fichier : 130 et 170
  //     de puissance, et l'utilisateur restait debout. C'était le coup le plus
  //     rentable du jeu, sans discussion — et les Champions le portent aussi.
  //     Un Grolem ou un Électrode pouvait coucher n'importe quoi gratuitement.
  //  ⚠️ EN PREMIÈRE GÉNÉRATION, L'UTILISATEUR TOMBE MÊME S'IL RATE, et même si
  //     la cible est insensible. C'est pour ça que ce geste est appelé depuis
  //     TROIS endroits — le raté, l'insensible, et le coup porté — plutôt que
  //     depuis un seul : un sacrifice qui ne coûte que lorsqu'il réussit n'est
  //     plus un sacrifice.
  // ═══════════════════════════════════════════════════════════════════════════
  function seSacrifier(a, p, ev, quiCote) {
    if (!a || a.effet !== "EXPLODE_EFFECT" || !vivant(p)) return;
    p.pv = 0;
    ev.push({ t: "sacrifice", cote: quiCote });
    ev.push({ t: "ko", cote: quiCote });
  }

  function poserStatut(cible, statut, ev, quiCote, h, coteCible) {
    // 🔴 RUNE PROTECT REFUSE LE STATUT, ET ELLE LE DIT. Sans cette ligne, la
    //    protection s'annonçait au tour où on la pose et ne protégeait de rien
    //    — un coup annoncé qui ne fait rien, exactement ce que ce dossier
    //    traque partout ailleurs.
    var _n = NEUFS();
    if (_n && coteCible && coteCible.volatils.rune > 0) {
      ev.push({ t: "runeProtege", cote: quiCote, statut: statut });
      return;
    }
    // 🔴 Un Pokémon n'a qu'un statut à la fois — poser le second effacerait le
    //    premier sans le dire, et le joueur lirait deux annonces pour un effet.
    if (cible.statut) { ev.push({ t: "statutRefuse", cote: quiCote, deja: cible.statut }); return; }
    cible.statut = statut;
    cible.statutTours = statut === "sommeil" ? h.entre(1, 7) : statut === "poisonGrave" ? 0 : 0;
    ev.push({ t: "statut", cote: quiCote, statut: statut });
  }

  function bougerPalier(c, stat, delta, ev, quiCote) {
    var avant = c.paliers[stat];
    c.paliers[stat] = Math.max(-6, Math.min(6, avant + delta));
    ev.push({ t: "palier", cote: quiCote, stat: stat, delta: c.paliers[stat] - avant,
              bloque: c.paliers[stat] === avant, valeur: c.paliers[stat] });
  }

  // Patience : deux ou trois tours à encaisser, puis on rend le double.
  function libererPatience(e, cote, autre, quiCote, quiAutre, ev) {
    var p = cote.volatils.patience;
    if (!p) return;
    // Un rendeur à terre ne rend rien (audit 13/08 : un K.O. rendait quand
    // même ses dégâts le tour de sa mort).
    if (!vivant(actif(cote))) { cote.volatils.patience = null; return; }
    p.tours--;
    if (p.tours > 0) return;
    cote.volatils.patience = null;
    var rendu = p.encaisse * 2;
    if (rendu <= 0) { ev.push({ t: "patienceVide", cote: quiCote }); return; }
    var vise = actif(autre);
    if (!vivant(vise)) return;
    ev.push({ t: "patienceRend", cote: quiCote, degats: rendu });
    encaisser(autre, vise, rendu, ev, quiAutre);
  }

  // ── Un assaut ──────────────────────────────────────────────────────────────
  function assaut(e, source, cible, index, h) {
    var ev = [];
    var pA = actif(source), pD = actif(cible);
    var quiA = source === e.joueur ? "joueur" : "adverse";
    var quiD = source === e.joueur ? "adverse" : "joueur";
    var dejaCharge = false;   // vrai quand ce tour EXÉCUTE une charge posée avant

    // Un Pokémon à terre n'agit pas. La garde manquait, et c'est elle qui
    // laissait un adversaire tombé continuer à frapper.
    if (!vivant(pA) || !vivant(pD)) return ev;
    //  🔑 LE COUP CHOISI EST CONNU AVANT LE SOMMEIL, et il le faut : deux
    //     coups de 1999 se jouent en dormant. On lit la case demandée telle
    //     quelle — les coups FORCÉS (charge, fureur, Bis) se résolvent plus
    //     bas, et un dormeur sous Bis dort de toute façon.
    var _choisi = pA.attaques[index] && pA.attaques[index].cle;
    if (!peutAgir(pA, ev, h, quiA, _choisi)) return ev;

    // ═══════════════════════════════════════════════════════════════════════
    //  L'ULTRALASER SE RECHARGE — SANS QUOI C'EST LE MEILLEUR COUP DU JEU
    //
    //  🔴 `HYPER_BEAM_EFFECT` n'apparaissait NULLE PART dans ce fichier :
    //     150 de puissance, aucune contrepartie. En première génération,
    //     l'Ultralaser est fort PARCE QU'il coûte le tour suivant ; sans ce
    //     coût il domine tout, pour le joueur comme pour les Champions qui le
    //     portent. Ce n'était pas un réglage manquant, c'était la moitié de
    //     l'attaque.
    //  ⚠️ ET LE CAPRICE DE 1996 EST GARDÉ : si la cible tombe, il n'y a pas de
    //     recharge. C'est un détail célèbre du jeu d'origine, et le mode a le
    //     canon pour loi.
    //  ⚠️ La recharge vit dans `volatils`, donc un changement de Pokémon
    //     l'efface — comme dans le ROM.
    // ═══════════════════════════════════════════════════════════════════════
    if (source.volatils.recharge) {
      source.volatils.recharge = false;
      ev.push({ t: "recharge", cote: quiA });
      return ev;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LES ATTAQUES À CHARGE — SIX COUPS QUI FRAPPAIENT INSTANTANÉMENT
    //
    //  🔴 `CHARGE_EFFECT` et `FLY_EFFECT` n'étaient écrits nulle part : Lance-
    //     Soleil sortait ses 120 sur-le-champ, Piqué ses 140, Tunnel ses 100.
    //     Ces attaques sont fortes PARCE QU'elles coûtent un tour ; sans ce
    //     tour, elles étaient simplement les meilleures du jeu.
    //  🔴 UN TOUR DE CHARGE EN COURS REMPLACE L'ACTION. Le second tour n'est
    //     pas un choix : c'est le jeu d'origine, et c'est aussi ce qui empêche
    //     de charger puis de changer d'avis — sinon la charge ne coûte rien.
    //  ⚠️ La charge vit dans `volatils` : changer de Pokémon l'annule, comme
    //     dans le ROM.
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    //  L'ÉTREINTE — QUATRE ATTAQUES QUI NE TENAIENT PERSONNE
    //
    //  🔴 `TRAPPING_EFFECT` n'était écrit nulle part : Étreinte, Ligotage,
    //     Danse Flammes et Claquoir frappaient pour 15 (35 pour Claquoir) et
    //     lâchaient aussitôt. Ce sont des attaques FAIBLES qui valent par ce
    //     qu'elles empêchent — sans la prise, ce sont les pires du jeu.
    //  🔴 UN SEUL COMPTEUR, PORTÉ PAR CELUI QUI SERRE. Les deux camps le
    //     lisent : celui qui serre y trouve son ordre de répéter, celui qui est
    //     pris y trouve la raison de ne pas agir. Deux compteurs auraient fini
    //     par se désynchroniser — c'est la classe la plus chère de ce dossier.
    //  🔴 ET ON NE S'EN DÉGAGE PAS EN CHANGEANT DE POKÉMON. J'avais écrit
    //     l'inverse ici, et dans l'essai — « changer efface `volatils`, donc
    //     l'étreinte tombe ». C'est faux pour la première génération : le
    //     blocage empêche TOUTE action, y compris le changement, et c'est
    //     précisément ce qui a rendu ces attaques redoutables en 1996.
    //     ⚠️ Un essai écrit sur une croyance valide la croyance, pas le jeu.
    // ═══════════════════════════════════════════════════════════════════════
    if (cible.volatils.etreint && cible.volatils.etreint.tours > 0) {
      ev.push({ t: "etreint", cote: quiA });
      return ev;
    }
    // 🔴 LE COMPTEUR NE SE DÉCRÉMENTE PAS ICI, MAIS EN FIN DE TOUR. Décrémenté
    //    dans la branche de celui qui serre, il tombait à zéro AVANT que la
    //    victime ne joue quand l'attaquant était le plus rapide — et la
    //    victime n'était jamais bloquée. Le compteur dépendait de l'ordre des
    //    camps, c'est-à-dire du hasard des vitesses. Il se décompte donc une
    //    fois par TOUR, dans `finDeTour`, où l'ordre n'existe plus.
    // 🔴 LE COMPTEUR NE SE DÉCOMPTE PAS ICI. Posé dans `assaut`, la fin de la
    //    fureur — et donc la CONFUSION qui la paie — n'arrivait que si le
    //    joueur rejouait une attaque : demander un changement au bon tour
    //    faisait disparaître le prix. Comme pour l'étreinte, le décompte vit
    //    en fin de tour, où aucune action ne peut le contourner.
    if (source.volatils.rage) {
      var iRag = -1;
      for (var ira = 0; ira < pA.attaques.length; ira++) {
        if (pA.attaques[ira] && pA.attaques[ira].cle === source.volatils.rage) { iRag = ira; break; }
      }
      if (iRag >= 0) { index = iRag; dejaCharge = true; }
      else source.volatils.rage = null;
    }
    if (source.volatils.fureur && source.volatils.fureur.tours > 0) {
      var iFur = -1;
      for (var ifu = 0; ifu < pA.attaques.length; ifu++) {
        if (pA.attaques[ifu] && pA.attaques[ifu].cle === source.volatils.fureur.cle) { iFur = ifu; break; }
      }
      if (iFur >= 0) { index = iFur; dejaCharge = true; }
      else source.volatils.fureur = null;
    }
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 BIS ENFERME DANS LE DERNIER COUP — et il ne se paie PAS comme une
    //    continuation. Rage, fureur, étreinte et charge posent `dejaCharge`,
    //    qui saute le décompte des points de pouvoir : c'est juste pour elles,
    //    puisqu'elles ont déjà payé au premier tour. Bis, non — le coup répété
    //    est un coup neuf à chaque tour, et c'est précisément ce qui l'épuise.
    //    Sans PP, il se tait de lui-même.
    // ═══════════════════════════════════════════════════════════════════════
    if (source.volatils.bis && source.volatils.bis.tours > 0) {
      var iBis = -1;
      for (var ibi = 0; ibi < pA.attaques.length; ibi++) {
        if (pA.attaques[ibi] && pA.attaques[ibi].cle === source.volatils.bis.cle
            && pA.attaques[ibi].pp > 0) { iBis = ibi; break; }
      }
      if (iBis >= 0) index = iBis;
      else { source.volatils.bis = null; ev.push({ t: "bisFinit", cote: quiA }); }
    }
    if (source.volatils.etreint && source.volatils.etreint.tours > 0) {
      var iEtr = -1;
      for (var ie = 0; ie < pA.attaques.length; ie++) {
        if (pA.attaques[ie] && pA.attaques[ie].cle === source.volatils.etreint.cle) { iEtr = ie; break; }
      }
      if (iEtr >= 0) { index = iEtr; dejaCharge = true; }
      else source.volatils.etreint = null;   // l'attaque a disparu : on lâche
    }

    // 🔴 PATIENCE VERROUILLE AUSSI (audit 13/08) : on pouvait attaquer pendant
    //    la patience, et re-choisir Patience remettait compteur ET réserve à
    //    zéro (156 encaissés, 0 rendus au banc). Le marché de l'attaque, c'est
    //    d'être ENGAGÉ : même continuation forcée que la fureur.
    if (source.volatils.patience && source.volatils.patience.tours > 0) {
      var iPat = -1;
      for (var ip = 0; ip < pA.attaques.length; ip++) {
        if (pA.attaques[ip] && pA.attaques[ip].cle === "BIDE") { iPat = ip; break; }
      }
      if (iPat >= 0) { index = iPat; dejaCharge = true; }
    }

    if (source.volatils.charge) {
      var cleChargee = source.volatils.charge;
      source.volatils.charge = null;
      var iCharge = -1;
      for (var ic = 0; ic < pA.attaques.length; ic++) {
        if (pA.attaques[ic] && pA.attaques[ic].cle === cleChargee) { iCharge = ic; break; }
      }
      // Si l'attaque a disparu entre-temps (Mimique, PP à zéro), on n'invente
      // rien : le tour est perdu, et il l'est en le disant.
      if (iCharge < 0) { ev.push({ t: "chargePerdue", cote: quiA }); return ev; }
      // 🔴 ON RÉÉCRIT `index`, PAS UNE VARIABLE `action` : cette fonction
      //    s'appelle `assaut(e, source, cible, index, h)` et n'a jamais reçu
      //    d'action. Mon premier jet affectait `action` — en mode strict, une
      //    variable non déclarée lève à l'EXÉCUTION, et `node --check` ne le
      //    voit pas. Le dossier porte déjà cette leçon.
      index = iCharge;
      dejaCharge = true;
    }

    if (source.volatils.peur) {
      source.volatils.peur = false;
      ev.push({ t: "peur", cote: quiA });
      return ev;
    }

    // La confusion se résout AVANT l'attaque, et elle peut la remplacer.
    if (source.volatils.confusion > 0) {
      source.volatils.confusion--;
      if (source.volatils.confusion <= 0) ev.push({ t: "finConfusion", cote: quiA });
      else if (h.chance(50)) {
        var auto = Math.floor(Math.floor((Math.floor((2 * pA.niveau) / 5) + 2) * 40 * pA.stats.atk / pA.stats.def) / 50) + 2;
        MOT().poserPv(pA, pA.pv - auto, "coupSurSoi");
        ev.push({ t: "confus", cote: quiA, degats: auto });
        if (!vivant(pA)) ev.push({ t: "ko", cote: quiA });
        return ev;
      } else ev.push({ t: "confusTient", cote: quiA });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  L'AMOUR IMMOBILISE, UNE FOIS SUR DEUX
    //
    //  🔴 ET IL VIENT APRÈS LA CONFUSION, comme dans la cartouche : l'ordre des
    //     empêchements de 1999 est sommeil, gel, peur, entrave, confusion,
    //     paralysie, puis l'amour. Le placer avant volerait à la confusion les
    //     tours qu'elle doit prendre, et le taux mesuré des deux serait faux.
    //  ⚠️ UN TIRAGE PAR TOUR OÙ L'ON EST AMOUREUX. C'est le seul de la
    //     livraison qui se paie hors du lancer, et il est écrit sur la porte
    //     (`EFFECT_ATTRACT` dans `gen2/effets-neufs.js`).
    // ═══════════════════════════════════════════════════════════════════════
    var nAmour = NEUFS();
    var regleAmour = nAmour && nAmour.sansJet && nAmour.sansJet.EFFECT_ATTRACT;
    if (regleAmour && source.volatils.attraction) {
      ev.push({ t: "amoureux", cote: quiA });
      if (h.entier(regleAmour.surDeux) === 0) {
        ev.push({ t: "amourImmobilise", cote: quiA });
        return ev;
      }
    }

    var mv = pA.attaques[index];
    // Plus un seul point de pouvoir nulle part : c'est Lutte, et elle blesse.
    // 🔴 PAR LE VRAI PIPELINE (audit 13/08) : la version figée d'ici touchait
    //    les Spectres, ignorait type, paliers et critique, et prenait 1/8 des
    //    PV max au lieu du recul canon (la moitié des dégâts, déjà écrite
    //    dans RECOIL_EFFECT qui nomme Lutte). 97 combats sur 200 la voyaient.
    //    Un coup SYNTHÉTIQUE : il n'appartient pas au Pokémon, ne consomme
    //    aucun PP réel, et l'Entrave ne peut pas le bloquer.
    if (!mv || mv.pp <= 0) {
      // Le pipeline annonce (« utilise Lutte ! ») et raconte le contrecoup :
      // l'ancien événement `lutte` n'a plus à doubler la phrase.
      mv = { cle: "STRUGGLE", pp: 2, ppMax: 2, synthetique: true };
    }
    // 🔴 ENTRAVE BLOQUE VRAIMENT LE COUP. Sans ce test, elle s'annonçait et
    //    l'attaque partait quand même — l'attaque qui ment, encore.
    //    Le compteur, lui, descend en FIN DE TOUR (voir `decompterEntrave`),
    //    plus ici : décompter à la tentative faisait durer l'entrave à vie
    //    quand l'adversaire jouait simplement autre chose.
    var ent = source.volatils.entrave;
    if (ent && ent.index === index && !mv.synthetique) {
      // 🔴 [22/08, rapport de Rayhane] ENTRAVE + PLUS RIEN D'AUTRE = LUTTE.
      //    Le seul coup qui restait des PP était l'entravé : le tour se
      //    perdait, encore et encore, et le combat ne pouvait plus finir.
      //    En 1996, Lutte arrive dès qu'aucun coup n'est utilisable — les
      //    PP à zéro n'en sont qu'une des deux causes.
      //  ⚠️ LE COUP SYNTHÉTIQUE NE VIENT PAS DU POKÉMON : il ne consomme
      //     aucun PP réel, et l'Entrave ne peut pas le bloquer (voir la
      //     bascule des PP juste au-dessus, qui le dit déjà).
      var rienDAutreAJouer = true;
      for (var iA = 0; iA < pA.attaques.length; iA++) {
        if (pA.attaques[iA].pp > 0 && iA !== ent.index) { rienDAutreAJouer = false; break; }
      }
      if (!rienDAutreAJouer) {
        ev.push({ t: "entraveBloque", cote: quiA, attaque: mv.cle });
        return ev;
      }
      mv = { cle: "STRUGGLE", pp: 2, ppMax: 2, synthetique: true };
    }

    //  🔴 « LES ATTAQUES EN DEUX TOURS COMME PIQUÉ CONSOMMENT DEUX PP »
    //     (rapport de testeur, 12/08) — et il avait raison : le décompte
    //     vivait ici, AVANT la branche de charge, donc le tour d'envol ET le
    //     tour de frappe payaient chacun. Le ROM ne décompte qu'à la
    //     SÉLECTION du coup. `dejaCharge` couvre toute la famille des
    //     continuations — Vol, Tunnel, Lance-Soleil, mais aussi Rage, Fureur
    //     et l'étreinte — qui, en 1996, ne repaient jamais leur second tour.
    if (!dejaCharge) mv.pp--;
    var a = ATT()[mv.cle];
    // 🔴 LA GARDE S'USE, ENCORE FAUT-IL QU'ELLE SE REPOSE. Le compteur partagé
    //    de Protection et Ténacité retombe à zéro dès qu'on joue AUTRE CHOSE :
    //    sans cette ligne il ne redescendrait jamais et la deuxième Protection
    //    du combat, dix tours plus tard, échouerait une fois sur deux sans
    //    raison lisible.
    (function () {
      var nG = NEUFS();
      if (!nG || !nG.avecJet) return;
      var gG = nG.avecJet[a.effet];
      if (!gG || !gG.compteur) source.volatils.gardeSuite = 0;
    })();
    ev.push({ t: "utilise", cote: quiA, attaque: mv.cle });
    // Mimique a besoin de savoir ce que l'adversaire vient de jouer.
    source.volatils.dernierCoup = mv.cle;

    // 🔴 LA CHARGE SE POSE ICI, APRÈS LE COÛT EN PP ET APRÈS L'ANNONCE. Le
    //    joueur voit « X utilise Lance-Soleil » puis « X absorbe la lumière » :
    //    c'est l'ordre du jeu d'origine, et il dit clairement que le tour est
    //    dépensé. `dejaCharge` distingue le second tour du premier — sans lui,
    //    l'attaque se rechargerait éternellement sans jamais sortir.
    //  🔴 ET ELLE PASSE AVANT LE JET DE PRÉCISION. Posée après, un raté au
    //     premier tour annulait la charge : l'attaque coûtait un tour et un PP
    //     pour rien, sans que rien ne le dise. On ne vise qu'au SECOND tour.
    //  ⚠️ TUNNEL ET VOL METTENT HORS D'ATTEINTE pendant la charge : c'est toute
    //     la raison de les jouer plutôt qu'un coup direct. Sans ça, la charge
    //     n'est qu'un handicap.
    if (!dejaCharge && (a.effet === "CHARGE_EFFECT" || a.effet === "FLY_EFFECT")) {
      source.volatils.charge = mv.cle;
      if (mv.cle === "DIG" || mv.cle === "FLY") source.volatils.horsAtteinte = mv.cle;
      ev.push({ t: "charge", cote: quiA, attaque: mv.cle });
      return ev;
    }
    if (dejaCharge) source.volatils.horsAtteinte = null;


    // 🔴 UN COUP SUR SOI NE FAIT AUCUN JET (audit 13/08). Boule Armure ratait
    //    75 % du temps sous précision −6, Hâte était annulée par le VOL
    //    ADVERSE (40/40) : un repli qui échoue à cause de l'esquive d'en face.
    //    En 1996, monter SA stat, se soigner, poser un mur ou un clone ne se
    //    vise pas — ni jet de précision, ni garde hors d'atteinte.
    var palSoi = palierDe(a.effet);
    var viseSoi = a.puissance === 0 && ((palSoi && palSoi[1] > 0) || VISE_SOI[a.effet]);
    // 🔴 MÉTÉORES NE RATE JAMAIS — et « jamais » couvre AUSSI Vol et Tunnel
    //    (audit 13/08) : en RBY elle saute le jet ENTIER et touche un Pokémon
    //    envolé ou enterré. C'est sa seule raison d'exister.
    // 🔴 LE VERROUILLAGE REND LE COUP SUIVANT INFAILLIBLE — c'est sa seule
    //    raison d'être, et sans cette lecture il posait un compteur que
    //    personne ne consultait.
    var infaillible = a.effet === "SWIFT_EFFECT" || (function () {
      var n = NEUFS();
      var c = n && n.durees.EFFECT_LOCK_ON && n.durees.EFFECT_LOCK_ON.cle;
      return !!(c && source.volatils[c]);
    })();
    // La précision. Pas de raté d'une chance sur 256 : une attaque à 100 %
    // touche toujours, et un joueur ne perd pas un combat sur un bug de 1996.
    // Sous terre ou dans le ciel : le coup ne peut pas porter.
    if (!viseSoi && !infaillible && cible.volatils.horsAtteinte) { ev.push({ t: "horsAtteinte", cote: quiD }); return ev; }
    var prec = a.precision * facteurPalier(source.paliers.precision) / facteurPalier(cible.paliers.esquive);
    // 🔴 LA POUDRE CLAIRE DÉPLACE LE SEUIL, ELLE N'AJOUTE PAS DE JET. Le tirage
    //    de précision existe déjà ; on le rend un peu plus dur à passer.
    var _tnP = TENUS();
    if (_tnP && effetTenu(pD) === _tnP.brightpowder.effet) prec = prec * _tnP.brightpowder.precision;
    // 🔴 UNE PRISE EN COURS TOUCHE D'OFFICE (audit 13/08) : la précision se
    //    rejouait à chaque répétition (24,7 % de ratés) alors qu'en 1996 seul
    //    le tour de POSE vise. Le jet se consomme quand même — un tirage
    //    supprimé se conserve, c'est la convention du dépôt.
    var toucheDOffice = dejaCharge && a.effet === "TRAPPING_EFFECT";
    if (!viseSoi && !infaillible && (a.precision < 100 || prec < 100)) {
      if (!h.chance(Math.max(1, Math.min(100, prec))) && !toucheDOffice) {
        ev.push({ t: "rate", cote: quiA });
        // 🔴 PIED SAUTÉ SE BLESSE EN RATANT — D'EXACTEMENT 1 PV, c'est le
        //    ROM (audit 13/08 : l'ancien 1/8 des PV max était le régime des
        //    générations 5+, attribué à tort au canon dans le commentaire
        //    d'origine). Le pari de l'attaque reste : rater coûte le tour.
        if (a.effet === "JUMP_KICK_EFFECT" && vivant(pA)) {
          var mal = 1;
          MOT().poserPv(pA, pA.pv - mal, "confusion");
          ev.push({ t: "chute", cote: quiA, degats: mal });
          if (!vivant(pA)) ev.push({ t: "ko", cote: quiA });
        }
        seSacrifier(a, pA, ev, quiA);   // il saute quand même : règle de 1996
        return ev;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 L'ABRI TIENT ICI, APRÈS LE JET DE PRÉCISION ET AVANT TOUT LE RESTE.
    //    Après, parce qu'un tirage supprimé se conserve — c'est la convention
    //    du dépôt, et le placer plus haut décalerait la graine. Avant les
    //    effets, parce que Protection arrête TOUT ce qui vise l'adversaire :
    //    les dégâts, mais aussi le statut, le palier et la prise. Un abri qui
    //    ne bloquerait que les dégâts serait un abri qui ment.
    // ⚠️ UN COUP QUI VISE SON LANCEUR PASSE : Hâte ou Repos derrière une
    //    Protection adverse n'ont rien à voir avec elle.
    // ⚠️ ET LE SACRIFICE SE PAIE QUAND MÊME — Explosion couche son lanceur
    //    même arrêtée, comme elle le fait déjà sur un raté et sur un immunisé.
    // ═══════════════════════════════════════════════════════════════════════
    if (!viseSoi && cible.volatils.abri) {
      ev.push({ t: "abriTient", cote: quiD, attaque: mv.cle });
      seSacrifier(a, pA, ev, quiA);
      return ev;
    }

    // 🔴 LES EFFETS QUI REMPLACENT L'ATTAQUE PASSENT AVANT LES DÉGÂTS. Vingt et
    //    une attaques tombaient jusqu'ici dans le vide : voir `effetSpecial`.
    if (effetSpecial(e, source, cible, pA, pD, quiA, quiD, mv, a, ev, h)) return ev;

    return resoudreCoup(e, source, cible, pA, pD, quiA, quiD, mv, a, ev, h, dejaCharge);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA RÉSOLUTION D'UN COUP — LA QUEUE DE `assaut`, EXTRAITE POUR ÊTRE PARTAGÉE
  //
  //  🔴 MÉTRONOME ET MIROIR JOUAIENT UNE ATTAQUE AMPUTÉE DE MOITIÉ. `rejouer`
  //     appelait `effetSpecial` puis la seule formule de dégâts, et RIEN
  //     d'autre : pas de jet de précision (tout touchait à cent pour cent), pas
  //     de statut ni de palier ni de peur ni de confusion secondaires, pas de
  //     coups multiples, pas de vol de vie, pas de contrecoup, pas de recharge
  //     d'Ultralaser, pas d'étreinte, pas d'auto-K.O. d'Explosion — et pas de
  //     charge, donc **Lance-Soleil et Piqué sortaient instantanément à pleine
  //     puissance**. Deux attaques du jeu tiraient au sort parmi toutes les
  //     autres et en jouaient une version qui n'existe nulle part.
  //  ✅ ON EXTRAIT, ON NE RECOPIE PAS. Deux cent quarante lignes dupliquées
  //     auraient divergé au premier correctif — c'est le motif que ce dossier
  //     a payé six fois. Une seule résolution, deux appelants.
  //  ⚠️ `dejaCharge` est le SEUL état du tour dont cette queue avait besoin :
  //     vérifié identifiant par identifiant avant l'extraction.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  TOUT CE QUI PÈSE SUR UN COUP, EN UN SEUL ENDROIT
  //
  //  🔴 CE BLOC ÉTAIT UN LITTÉRAL ÉCRIT DANS `resoudreCoup`, et Prescience a
  //     besoin du même : elle calcule ses dégâts au LANCER et les fait tomber
  //     deux tours plus tard. Le recopier, c'est se donner rendez-vous avec la
  //     divergence — la météo d'un côté, les badges de l'autre, et un coup
  //     différé qui ne frappe pas comme un coup direct sans que personne ne
  //     sache pourquoi.
  //  ⚠️ `en plus` ne sert qu'aux coups qui ont une règle À EUX : Prescience y
  //     passe `sansType` et `sansCritique`, et rien d'autre du moteur ne les
  //     emploie.
  // ═══════════════════════════════════════════════════════════════════════════
  function ctxDegats(e, source, cible, quiA, quiD, a, enPlus) {
    var ctx = {
      attPaliers: source.paliers, defPaliers: cible.paliers,
      // La météo du COMBAT, pas d'un camp — voir `effetGen2`.
      meteo: e.meteo ? e.meteo.cle : null,
      badgesAtt: quiA === "joueur" ? bonusBadges(source, estSpecial(a.type) ? SPE_ATK() : "atk") : 1,
      // Le Badge Âme protège celui qui ENCAISSE : c'est donc le camp d'en
      // face qui le porte, et seulement quand ce camp est le joueur.
      badgesDef: quiD === "joueur" ? bonusBadges(cible, "def") : 1,
      // ═══════════════════════════════════════════════════════════════════
      // 🔴 LES SERMENTS ENTRENT ICI, ET NULLE PART AILLEURS DANS LE MOTEUR.
      //    `serments` est le résultat de `PokeSerments.effet(partie)` —
      //    déjà composé, déjà borné. Le combat ne connaît ni la liste des
      //    serments ni leurs noms : il lit trois nombres. C'est ce qui
      //    permet d'en ajouter quinze de plus sans rouvrir ce fichier.
      // ⚠️ ILS NE VALENT QUE POUR LE JOUEUR. Un serment est un engagement
      //    du dresseur, pas une règle du monde : l'appliquer aux deux
      //    camps l'annulerait exactement.
      // ═══════════════════════════════════════════════════════════════════
      // 🔴 LE DERNIER DEBOUT ENTRE ICI, dans le multiplicateur qui existe
      //    déjà — pas dans une quatrième voie. Il ne mord que si le joueur
      //    n'a plus qu'UN Pokémon vivant : c'est sa condition, et c'est aussi
      //    son prix, puisqu'on ne l'obtient qu'au bord de la défaite.
      //    ⚠️ On compte les VIVANTS de l'équipe, pas les places : un Pokémon
      //       en réserve ne se bat pas, et un K.O. ne compte plus.
      sermentsInflige: quiA === "joueur" && e.serments
        ? e.serments.degatsInfliges *
          (e.serments.dernierDebout !== 1 &&
           e.joueur.equipe.filter(function (m) { return m.pv > 0; }).length === 1
            ? e.serments.dernierDebout : 1)
        : 1,
      sermentsSubit: quiD === "joueur" && e.serments ? e.serments.degatsSubis : 1,
      sermentsCrit: quiA === "joueur" && e.serments ? e.serments.critBonus : 0,
      // Les deux murs de l'adversaire, et sa Puissance à lui.
      mur: cible.volatils.mur, protection: cible.volatils.protection,
      puissance: source.volatils.puissance,
    };
    for (var k in (enPlus || {})) ctx[k] = enPlus[k];
    return ctx;
  }

  function resoudreCoup(e, source, cible, pA, pD, quiA, quiD, mv, a, ev, h, dejaCharge) {
    if (a.puissance > 0) {
      var r = degats(pA, pD, mv.cle, ctxDegats(e, source, cible, quiA, quiD, a), h);
      if (r.efficacite === 0) {
        ev.push({ t: "sansEffet", cote: quiD, attaque: mv.cle });
        seSacrifier(a, pA, ev, quiA);
        return ev;
      }
      // ═══════════════════════════════════════════════════════════════════
      //  LES ATTAQUES QUI FRAPPENT PLUSIEURS FOIS
      //
      //  🔴 DIX ATTAQUES NE FRAPPAIENT QU'UNE FOIS. Torgnoles, Furie, Dard-
      //     Nuée, Double Pied, Osmerang, Double Dard… Leur puissance est basse
      //     PARCE QU'elle se paie deux à cinq fois ; servie une seule, elle
      //     faisait de ces attaques les plus faibles du jeu. Un Dard-Nuée à 14
      //     n'a aucun sens : c'est 14 × 2 à 5 qu'il vaut.
      //  ⚠️ LES DÉGÂTS SE CALCULENT UNE FOIS ET S'APPLIQUENT N FOIS, comme en
      //     première génération — et non un calcul neuf par coup, qui rendrait
      //     la variance absurde sur cinq frappes.
      //  ⚠️ ON S'ARRÊTE DÈS QUE LA CIBLE TOMBE : sans ça, on frapperait un
      //     Pokémon déjà à terre et le journal annoncerait cinq coups pour
      //     trois portés.
      // ═══════════════════════════════════════════════════════════════════
      var coups = 1;
      if (a.effet === "TWO_TO_FIVE_ATTACKS_EFFECT") {
        // La table du ROM : 3/8 pour deux coups, 3/8 pour trois, 1/8 pour
        // quatre, 1/8 pour cinq.
        var r8 = h.entier(8);
        coups = r8 < 3 ? 2 : r8 < 6 ? 3 : r8 === 6 ? 4 : 5;
      } else if (a.effet === "ATTACK_TWICE_EFFECT" || a.effet === "TWINEEDLE_EFFECT") {
        coups = 2;
      }
      // 🔴 Le clone encaisse À LA PLACE du Pokémon : c'est toute sa raison
      //    d'être, et il n'y a qu'un endroit où l'oublier.
      var portes = 0;
      for (var kc = 0; kc < coups; kc++) {
        if (!vivant(pD)) break;
        encaisser(cible, pD, r.degats, ev, quiD, r);
        portes++;
        // 🔴 DARD-NUÉE EMPOISONNE À CHAQUE DARD (audit 13/08) : 0/600 avant —
        //    TWINEEDLE_EFFECT n'était lu que comme « deux coups », le poison
        //    n'existait pas. 20 % PAR COUP comme le ROM, immunité Poison.
        //    ⚠️ Tirages ajoutés : bump groupé.
        if (a.effet === "TWINEEDLE_EFFECT" && vivant(pD) && !pD.statut &&
            typesDe(pD).indexOf("poison") < 0 && h.chance(20)) {
          poserStatut(pD, "poison", ev, quiD, h);
        }
      }
      if (coups > 1) ev.push({ t: "coupsMultiples", cote: quiD, n: portes });
      // Le gel fond au contact du feu. C'est la seule sortie de la génération 1.
      if (a.type === "fire" && pD.statut === "gel") { pD.statut = null; ev.push({ t: "degel", cote: quiD, naturel: false }); }
      // Patience encaisse pour rendre le double, plus tard.
      // ⚠️ ELLE NE COMPTAIT QU'UNE FRAPPE SUR CINQ : `r.degats` est la valeur
      //    d'UN coup, et Riposte deux lignes plus bas prenait déjà
      //    `r.degats * portes`. Une Torgnoles à cinq coups ne remplissait donc
      //    la réserve que d'un cinquième.
      if (cible.volatils.patience) cible.volatils.patience.encaisse += r.degats * portes;
      // Et Riposte retient le dernier coup encaissé, pour le rendre doublé si
      // elle est jouée avant la fin du tour. ⚠️ On retient le total RÉELLEMENT
      // porté, coups multiples compris — pas la valeur d'une frappe.
      // 🔴 NORMAL OU COMBAT SEULEMENT (audit 13/08) : le filtre « physique »
      //    laissait Riposte rendre le double d'un Séisme ou d'un Cru-Ailes —
      //    en 1996 elle ne répond qu'aux types Normal et Combat.
      if ((a.type === "normal" || a.type === "fighting") && portes > 0) {
        cible.volatils.riposte = r.degats * portes;
      }
      // 🔴 ET VOILE MIROIR RETIENT LE SPÉCIAL, exactement comme Riposte retient
      //    le physique de 1996. Deux dettes, deux coups, une même borne : elles
      //    meurent toutes les deux à la fin du tour.
      if (estSpecial(a.type) && portes > 0) {
        cible.volatils.voileMiroir = r.degats * portes;
      }

      // ═══════════════════════════════════════════════════════════════════
      //  LE VOL DE VIE ET LE CONTRECOUP — DEUX FAMILLES QUI NE FAISAIENT RIEN
      //
      //  🔴 Relevé le 09/08 : la clé `DRAIN_HP_EFFECT` (Vampigraine,
      //     Méga-Sangsue, Vampirisme) et `RECOIL_EFFECT` (Bélier, Damoclès,
      //     Sacrifice, Lutte) n'apparaissaient NULLE PART dans ce fichier.
      //     Neuf attaques dont l'effet ne faisait rien — c'est-à-dire neuf
      //     attaques qui mentaient au joueur, exactement ce que l'en-tête de
      //     ce fichier interdit depuis toujours.
      //  🔴 CE SONT LES DEUX FAMILLES QUI CHANGENT LA FAÇON DE JOUER : l'une
      //     donne de l'endurance sans objet, l'autre met un prix sur la
      //     puissance. Sans elles, Damoclès est un Charge en plus fort.
      //  ⚠️ AUCUN TIRAGE CONSOMMÉ : les deux se calculent sur les dégâts déjà
      //     rendus. Le contrat de rejeu ne bouge pas d'un cran.
      // ═══════════════════════════════════════════════════════════════════
      if ((a.effet === "DRAIN_HP_EFFECT" || a.effet === "DREAM_EATER_EFFECT") && vivant(pA)) {
        // La moitié des dégâts rendus, au moins un point : c'est la règle de
        // la première génération, et elle ne dépasse jamais les PV max.
        // 🔴 CETTE LIGNE A ÉCRIT `pA.pvMax`, QUI N'EXISTE PAS. Une créature
        //    porte ses PV maximum dans `stats.pv` — `pvMax` n'apparaissait
        //    nulle part ailleurs dans le dépôt. `Math.min(undefined, x)` rend
        //    NaN : **chaque vol de vie mettait les PV du voleur à NaN**, donc
        //    `vivant()` le déclarait à terre. Vampigraine, Méga-Sangsue et
        //    Vampirisme couchaient celui qui les lançait, livré ainsi en v351.
        // 🔴 ET J'AVAIS « VÉRIFIÉ » : 241 événements `vol` sur 3 000 combats.
        //    Un événement qui SORT ne prouve pas que son EFFET est juste — il
        //    prouve qu'on est passé par la ligne. Le défaut n'est apparu qu'en
        //    mesurant les PV REGAGNÉS, c'est-à-dire la seule chose qui compte.
        var vole = Math.max(1, Math.floor(r.degats / 2));
        var avant = pA.pv;
        MOT().poserPv(pA, pA.pv + vole, "siphon");
        if (pA.pv !== avant) ev.push({ t: "vol", cote: quiA, soin: pA.pv - avant });
      }
      if (a.effet === "RECOIL_EFFECT") {
        // 🔴 LUTTE EST À PART, ET LE ROM LE DIT : un quart pour Bélier,
        //    Damoclès et Sacrifice, LA MOITIÉ pour Lutte. Les données ne
        //    distinguent pas les deux — elles portent la même clé —, donc on
        //    nomme l'attaque ici, une seule fois, plutôt que d'inventer une
        //    clé qui n'existe pas dans le ROM.
        var part = mv.cle === "STRUGGLE" ? 2 : 4;
        var recul = Math.max(1, Math.floor(r.degats / part));
        MOT().poserPv(pA, pA.pv - recul, "contrecoup");
        ev.push({ t: "contrecoup", cote: quiA, degats: recul });
        if (!vivant(pA)) ev.push({ t: "ko", cote: quiA });
      }
      // La recharge se pose ICI, après les dégâts : si la cible est tombée,
      // la ligne juste en dessous sort avant et l'Ultralaser ne coûte rien.
      if (a.effet === "HYPER_BEAM_EFFECT" && vivant(pD)) source.volatils.recharge = true;
      // La prise se pose au premier coup seulement : `dejaCharge` marque les
      // répétitions, et sans lui l'étreinte se renouvellerait sans fin.
      // Deux ou trois tours en tout : on en pose un ou deux de plus.
      // 🔴 FRÉNÉSIE : ON NE S'ARRÊTE PLUS, ET CHAQUE COUP REÇU MONTE L'ATTAQUE.
      //    `RAGE_EFFECT` n'était écrit nulle part : l'attaque sortait ses 20 —
      //    la plus faible du jeu — et rien d'autre. Tout son intérêt est le
      //    marché : on se verrouille dessus, et on grandit à chaque coup pris.
      //  ⚠️ Le verrou n'a PAS de fin : c'est la règle de 1996, et c'est ce qui
      //     en fait un pari. Il se lève en tombant, ou en gagnant.
      if (a.effet === "RAGE_EFFECT") source.volatils.rage = mv.cle;
      if (a.effet === "THRASH_PETAL_DANCE_EFFECT" && !dejaCharge) {
        // 🔴 DEUX OU TROIS COUPS AU TOTAL, ET LE PREMIER EN FAIT PARTIE. Écrit
        //    « 1 + h.entier(2) », le décompte de fin de tour pouvait arrêter la
        //    fureur après UN seul coup : l'attaque payait sa confusion sans
        //    avoir enchaîné quoi que ce soit — le pire des deux mondes.
        source.volatils.fureur = { cle: mv.cle, tours: 2 + h.entier(2) };
      }
      if (a.effet === "TRAPPING_EFFECT" && !dejaCharge && vivant(pD)) {
        // 🔴 DEUX À CINQ TOURS, ET LE TOUR DE POSE EN FAIT PARTIE. Écrit
        //    « 1 + h.entier(4) », le décompte de fin de tour tombait à zéro
        //    dans le tour même où la prise se posait : elle s'annonçait et se
        //    libérait dans la même phrase.
        // 🔴 LA DURÉE SUIT LA TABLE DU ROM (audit 13/08) : 3/8·3/8·1/8·1/8 —
        //    la même que les coups multiples — et non l'uniforme 25 % chacune.
        var r8p = h.entier(8);
        source.volatils.etreint = { cle: mv.cle, tours: r8p < 3 ? 2 : r8p < 6 ? 3 : r8p === 6 ? 4 : 5 };
        ev.push({ t: "etreinte", cote: quiD });
      }
      seSacrifier(a, pA, ev, quiA);
      if (!vivant(pD)) return ev;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE CLONE N'ARRÊTAIT QUE LES DÉGÂTS. En 1996, `CheckTargetSubstitute`
    //     bloque AUSSI le statut, les baisses de palier, la peur, la confusion
    //     et Vampigraine : c'est ce qui fait du clone un abri, et pas une
    //     simple réserve de PV. Ici Toxik, Cage Éclair, Grincement et
    //     Vampigraine le traversaient comme s'il n'existait pas.
    //  ⚠️ IL NE PROTÈGE PAS DE CE QU'ON SE FAIT À SOI : une montée de palier
    //     sur son propre camp n'est pas visée, et n'a rien à traverser.
    // ═══════════════════════════════════════════════════════════════════════
    var abrite = cible.volatils.clone > 0;

    var st = STATUT_DE[a.effet];
    // 🔴 TOXIK SE RECONNAÎT PAR SON NOM, COMME DANS LE ROM (audit 13/08). Les
    //    données portent POISON_EFFECT — fidèle au ROM, qui distingue Toxik
    //    DANS la routine, pas dans la constante. Le moteur attendait une clé
    //    TOXIC_EFFECT qu'aucune attaque ne porte : le poison GRAVE était
    //    inatteignable depuis la création, la routine `poisonGrave` écrite et
    //    jamais appelée. Usure constante 6/6/6 au lieu de croissante.
    if (st && mv.cle === "TOXIC") st = ["poisonGrave", st[1]];
    if (st && abrite) { ev.push({ t: "cloneTient", cote: quiD }); st = null; }
    if (st && h.chance(st[1])) {
      // Un type ne prend pas son propre poison, ni le feu sa brûlure.
      var immun = (st[0] === "poison" || st[0] === "poisonGrave") && typesDe(pD).indexOf("poison") >= 0;
      if (st[0] === "brulure" && typesDe(pD).indexOf("fire") >= 0) immun = true;
      if (st[0] === "gel" && typesDe(pD).indexOf("ice") >= 0) immun = true;
      // 🔴 ET L'IMMUNITÉ DE TYPE VAUT POUR LES STATUTS PURS (audit 13/08) :
      //    Cage Éclair paralysait le type Sol, Regard Médusant le Spectre.
      //    Pour une attaque sans puissance, l'efficacité nulle refuse le
      //    statut — restreint à la paralysie, seul cas canon 1G certain.
      if (!immun && a.puissance === 0 && st[0] === "para"
          && efficacite(a.type, typesDe(pD)) === 0) {
        ev.push({ t: "sansEffet", cote: quiD, attaque: mv.cle });
        return ev;
      }
      // 🔴 ET UN EFFET SECONDAIRE NE PREND PAS SUR SON PROPRE TYPE (1G) :
      //    Tonnerre ne paralyse pas un Électrik, Plaquage un Normal. La garde
      //    puissance>0 est essentielle — Cage Éclair, elle, paralyse bien un
      //    Électrik.
      if (!immun && a.puissance > 0 && ESP()[pD.n].types.indexOf(a.type) >= 0) {
        immun = true;
      }
      if (immun) ev.push({ t: "statutImmune", cote: quiD, statut: st[0] });
      else poserStatut(pD, st[0], ev, quiD, h, cible);
    }
    var pal = palierDe(a.effet);
    if (pal && h.chance(pal[2])) {
      // Une attaque sans puissance qui baisse une statistique vise l'ADVERSAIRE ;
      // celles qui montent visent SOI. C'est la lecture du ROM, pas une règle
      // inventée : Rugissement baisse la Défense d'en face, Danse-Lames monte
      // la sienne.
      var versSoi = pal[1] > 0;
      // 🔴 LA BRUME EST ENFIN LUE (audit 13/08). Posée, effaçable par Buée
      //    Noire, et JAMAIS consultée : Rugissement baissait les stats sous
      //    brume 60/60 — la classe Entrave exacte, posé sans consommé. Elle
      //    bloque les baisses INFLIGÉES (les coups à 100 %), pas les miettes
      //    secondaires des coups à dégâts — le détail du ROM (pal[2] === 100).
      if (!versSoi && abrite) {
        // Le clone prend la baisse à sa place — voir `abrite` plus haut.
        ev.push({ t: "cloneTient", cote: quiD });
      } else if (!versSoi && pal[2] === 100 && cible.volatils.brume) {
        ev.push({ t: "brumeProtege", cote: quiD });
      } else {
        // 🔑 UNE ENTRÉE PEUT NOMMER PLUSIEURS STATISTIQUES. Pouvoir Antique en
        //    monte cinq d'un coup, et c'est toute son identité ; en faire un
        //    cas à part dans le moteur aurait planté un nom de la seconde
        //    génération ici. La table dit une liste, la boucle la lit.
        var quelles = [].concat(pal[0]);
        for (var iq = 0; iq < quelles.length; iq++) {
          bougerPalier(versSoi ? source : cible, quelles[iq], pal[1], ev, versSoi ? quiA : quiD);
        }
      }
    }
    var peur = PEUR_DE[a.effet];
    if (peur && h.chance(peur) && !abrite) { cible.volatils.peur = true; }
    // ═══════════════════════════════════════════════════════════════════════
    //  LA ROCHE ROYALE APEURE — 30 SUR 256, ET SEULEMENT DANS SA MAIN
    //
    //  🔴 LE TIRAGE NE SE FAIT QUE SI L'OBJET EST LÀ. Deux pour cent des
    //     créatures en portent une : pour tous les autres combats, pas un jet
    //     de plus qu'avant. C'est ce qui a débloqué cet objet, écarté depuis
    //     le début comme « un jet par coup porté ».
    //  ⚠️ ELLE NE S'AJOUTE PAS À UN COUP QUI APEURE DÉJÀ : le ROM ne l'essaie
    //     que sur les coups sans effet d'apeurement, et cumuler ferait de
    //     Morsure une arme absurde.
    //  ⚠️ ET ELLE DEMANDE UN COUP QUI A PORTÉ : sans dégâts, pas de secousse.
    var _tR = TENUS();
    if (_tR && _tR.flinch && !peur && !abrite && a.puissance > 0 &&
        effetTenu(pA) === _tR.flinch.effet && vivant(pD)) {
      if (h.entier(_tR.flinch.sur) < _tR.flinch.seuil) {
        cible.volatils.peur = true;
        ev.push({ t: "tenuApeure", cote: quiD, objet: pA.objet });
      }
    }
    // 🔴 LA CONFUSION SECONDAIRE EST À 10 %, PAS À 100 (audit 13/08) : Rafale
    //    Psy et Choc Mental confusaient CHAQUE frappe non létale (188/188) —
    //    le ROM dit ~10 %. Ultrason et Onde Folie, elles, restent à 100 %.
    //    ⚠️ Tirage ajouté sur les coups SIDE : bump groupé.
    if (a.effet === "CONFUSION_EFFECT" ||
        (a.effet === "CONFUSION_SIDE_EFFECT" && h.chance(10))) {
      if (abrite) ev.push({ t: "cloneTient", cote: quiD });
      else if (!cible.volatils.confusion) { cible.volatils.confusion = h.entre(2, 5); ev.push({ t: "confusion", cote: quiD }); }
    }
    // 🔴 Le relevé des effets non traités ne doit accuser QUE ce qui ne fait
    //    rien. Un effet traité plus haut dans cette fonction doit être déclaré
    //    ici, sinon le contrôle crie à tort — et un contrôle qui crie à tort
    //    finit ignoré en bloc, y compris quand il a raison.
    // 🔴 LA RESTRICTION « puissance === 0 » EST LEVÉE (clôture d'audit 13/08) :
    //    c'est l'angle mort qui a caché le gel mort (FREEZE sans « 1 ») puis
    //    le poison de Dard-Nuée (0/600). Les effets à dégâts traités par du
    //    code dédié sont désormais DÉCLARÉS dans COUPS_TRAITES ci-dessous.
    if (!STATUT_DE[a.effet] && !palierDe(a.effet) && !PEUR_DE[a.effet] && !TRAITES_AILLEURS[a.effet]
        && !COUPS_TRAITES[a.effet] && a.effet !== "NO_ADDITIONAL_EFFECT") {
      EFFETS_NON_TRAITES[a.effet] = (EFFETS_NON_TRAITES[a.effet] || 0) + 1;
    }
    return ev;
  }

  // Les badges du jeu d'origine augmentent les statistiques de l'équipe.
  // 🔴 Un badge n'est donc PAS décoratif : c'est une récompense chiffrée, et
  //    l'infobulle du badge doit annoncer exactement ce chiffre.
  //  🔴 ET IL Y EN A QUATRE, PAS DEUX. Foudre (Vitesse) et Âme (Défense) sont
  //     posés depuis `PokePartie.badgesActifs` mais n'avaient AUCUN lecteur :
  //     `degats` ne recevait pas de bonus de défense, `vitesseEffective`
  //     ignorait les badges. `quoi` nomme donc la statistique visée, au lieu
  //     d'un booléen « spécial ou pas » qui ne pouvait en porter que deux.
  //  ⚠️ CES QUATRE BADGES SONT CEUX DE KANTO. Le jour où Johto s'ouvre, ce sont
  //     huit AUTRES badges, et la table devra venir du jeu de règles comme le
  //     reste. En attendant, une statistique que la table ne nomme pas ne
  //     donne aucun bonus — c'est un manque de contenu, pas un défaut de
  //     calcul, et `poke-gen2-close.mjs` tient la porte fermée jusque-là.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 CETTE TABLE NE CONNAISSAIT QUE KANTO — et c'était la seconde moitié du
  //     défaut : `partie.js` posait des noms de BADGE (« roche », « volcan »),
  //     ce fichier les retraduisait en statistiques, et les deux ne parlaient
  //     que de 1996. Les huit badges de Johto ne valaient donc rien du tout.
  //  ✅ `PokePartie.badgesActifs` rend désormais des noms de STATISTIQUE, lus
  //     du jeu de règles. Il n'y a plus de traduction — donc plus de moitié à
  //     oublier.
  //  ⚠️ UNE SEULE CASE DE BADGE POUR LA SPÉCIALE, même là où la statistique
  //     s'est dédoublée : le Badge Glacier de 1999 monte les DEUX, comme le
  //     Badge Volcan de 1996 montait la seule. `sat` et `sdf` ramènent donc à
  //     `spe` — sans quoi le badge n'aurait servi qu'à l'attaque.
  // ═══════════════════════════════════════════════════════════════════════════
  function cleBadge(quoi) {
    if (quoi === "atk" || quoi === "def" || quoi === "vit") return quoi;
    return "spe";
  }
  function bonusBadges(c, quoi) {
    // Compatibilité d'appel : `true`/`false` valaient « spécial »/« attaque ».
    var cle = quoi === true ? "spe" : quoi === false ? "atk" : cleBadge(quoi);
    var b = c.badges || {};
    return b[cle] ? 1.125 : 1;
  }


  // ── Le choix de l'adversaire ───────────────────────────────────────────────
  //  Un Pokémon sauvage frappe au hasard. Un dresseur vise : il pèse ses
  //  attaques par les dégâts qu'elles feraient. C'est ce qui rend un leader
  //  d'arène réellement dangereux sans lui donner de statistiques gonflées.
  // ═══════════════════════════════════════════════════════════════════════════
  //  UN COUP QUI NE PEUT PAS MARCHER — LA LOI, À UN SEUL ENDROIT
  //
  //  🔴 ELLE A VÉCU DANS `choixAdverse`, ET LE DUEL NE POUVAIT PAS LA LIRE.
  //     Mesuré le 14/08 sur 300 duels miroir : Dévorêve était le coup LE PLUS
  //     JOUÉ du PvP — 2 225 emplois — contre des cibles éveillées, où il ne
  //     fait rien. Exactement le défaut corrigé le matin même pour l'IA des
  //     dresseurs, resté entier dans `duel.js` parce que la règle était
  //     enfermée dans une autre fonction.
  //     *Une loi rangée dans un enclos ne protège que l'enclos.*
  //  ⚠️ ON NE JUGE QUE L'IMPOSSIBLE, pas l'inopportun : un coup qui FRAPPE et
  //     empoisonne au passage reste bon même si le statut ne prend pas.
  //  `ctxA` / `ctxD` sont les CAMPS (paliers, volatils) ; `sauvage` dit si l'on
  //  peut quitter le combat.
  function coupUtile(a, pA, pD, ctxA, ctxD, sauvage) {
    if (!a) return true;
    var typesDe = function (p) { return ESP()[p.n].types; };
    // Dévorêve ne mange que les rêves.
    if (a.effet === "DREAM_EATER_EFFECT") return pD.statut === "sommeil";
    // Le K.O. en un coup exige d'être le plus rapide — règle de 1996.
    if (a.effet === "OHKO_EFFECT") {
      return vitesseEffective(pA, ctxA && ctxA.paliers) >= vitesseEffective(pD, ctxD && ctxD.paliers);
    }
    // Se soigner à pleins points de vie ne fait rien, et Repos y échoue.
    if (a.effet === "HEAL_EFFECT") return pA.pv < pA.stats.pv;
    // On ne quitte pas un combat de dresseur : contre lui, ces coups sont morts.
    if (a.effet === "SWITCH_AND_TELEPORT_EFFECT") return !!sauvage;
    // Une graine ne prend ni sur une Plante ni sur une cible déjà semée.
    if (a.effet === "LEECH_SEED_EFFECT") {
      return typesDe(pD).indexOf("grass") < 0 && !(ctxD && ctxD.volatils && ctxD.volatils.graine);
    }
    var st = STATUT_DE[a.effet];
    if (st && a.puissance === 0) {
      if (pD.statut) return false;                       // il en a déjà un
      var quoi = a.cle === "TOXIC" ? "poisonGrave" : st[0];
      var t = typesDe(pD);
      if ((quoi === "poison" || quoi === "poisonGrave") && t.indexOf("poison") >= 0) return false;
      if (quoi === "brulure" && t.indexOf("fire") >= 0) return false;
      if (quoi === "gel" && t.indexOf("ice") >= 0) return false;
      if (quoi === "para" && efficacite(a.type, t) === 0) return false;
    }
    return true;
  }

  function choixAdverse(e, h) {
    var pA = actif(e.adverse), pD = actif(e.joueur);
    var dispo = [];
    for (var i = 0; i < pA.attaques.length; i++) if (pA.attaques[i].pp > 0) dispo.push(i);
    if (!dispo.length) return { type: "attaque", index: 0 };
    if (!e.adverse.dresseur) return { type: "attaque", index: h.dans(dispo) };
    // ═══════════════════════════════════════════════════════════════════════
    //  UN COUP QUI NE PEUT PAS MARCHER NE PÈSE PAS COMME S'IL ALLAIT MARCHER
    //
    //  🔴 RAPPORT DE JOUEUR, 14/08 : « le maître de la Ligue Spectre SPAM
    //     Dévorêve avec Ectoplasma alors que mon Pokémon n'est pas endormi ».
    //     Le moteur, lui, est juste : Dévorêve échoue sur une cible éveillée
    //     (`reveEveille`). C'est la PONDÉRATION qui était fautive — elle notait
    //     100 × efficacité de type, sans jamais demander si la CONDITION du
    //     coup était réunie. Dévorêve étant le coup le plus puissant du jeu
    //     d'Ectoplasma, l'IA le tirait presque à chaque tour, et le dernier
    //     boss du mode passait son combat à échouer.
    //  🔑 C'EST UNE CLASSE, PAS UN CAS. Le moteur porte plusieurs refus francs
    //     — cible éveillée, K.O. en un coup quand on est plus lent, soin à
    //     pleins points de vie. Chacun rendait l'adversaire idiot de la même
    //     façon. On lit donc la CONDITION à la source du refus, et le poids
    //     tombe à 1 : le coup reste possible (le canon ne l'interdit pas), il
    //     cesse d'être le favori.
    //  ⚠️ AUCUN TIRAGE N'EST AJOUTÉ NI RETIRÉ : `h.pondere` est appelé comme
    //     avant, sur les mêmes indices. Seuls les poids changent, donc le
    //     contrat de rejeu tient.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 L'AUDIT DU 14/08 A MONTRÉ QUE DÉVORÊVE N'ÉTAIT QUE LE CAS VISIBLE.
    //    `tools/poke-tours-perdus.mjs` a recensé, sur 21 387 tours, la part de
    //    coups qui ne produisent AUCUN effet — et la famille des STATUTS était
    //    pire encore : Cage Éclair 65 %, Poudre Toxik 52 %, Spore 51 %,
    //    Para-Spore 43 %, presque toujours pour la même raison — « la cible a
    //    déjà un statut ». Un Pokémon n'en porte qu'UN à la fois (`poserStatut`).
    //    Cyclone, Hurlement et Téléport, eux, ne font JAMAIS rien contre un
    //    dresseur (73 %, 55 %, 68 %) : le canon interdit de quitter un combat
    //    officiel.
    var pese = dispo.map(function (i) {
      var cle = pA.attaques[i].cle;
      var a = ATT()[cle];
      var eff = a.puissance ? efficacite(a.type, typesDe(pD)) : 1;
      var note = a.puissance ? a.puissance * eff : 25;
      if (!coupUtile(a, pA, pD, e.adverse, e.joueur, !!e.sauvage)) note = 0;
      return { index: i, poids: Math.max(1, Math.round(note)) };
    });
    // ═══════════════════════════════════════════════════════════════════════
    //  LE DRESSEUR SE SOIGNE — C'EST DU CANON, ET IL MANQUAIT
    //
    //  🔴 DANS LE JEU D'ORIGINE, LES CHAMPIONS ET LE CONSEIL 4 EMPLOIENT DES
    //     POTIONS. Chez nous ils encaissaient jusqu'au bout sans jamais lever
    //     le petit doigt : un mur de points de vie, pas un adversaire. C'est
    //     ce qui rendait les huit boss interchangeables — on les usait, on ne
    //     les affrontait pas. Rendre le soin, c'est rendre au combat sa
    //     deuxième moitié : il ne suffit plus de cogner, il faut cogner assez
    //     fort d'un coup.
    //
    //  🔴 LE TIRAGE EST CONSOMMÉ DANS TOUS LES CAS, ET C'EST LA CONDITION.
    //     `h.pondere` est appelé AVANT le test du soin, même quand le soin
    //     l'emporte. Sortir plus tôt aurait retiré un tirage à ce tour-là,
    //     donc décalé toute la suite de la graine — et le rejeu du serveur
    //     comme le Défi du jour reposent sur ce compte. Le mode a déjà écrit
    //     cette règle pour un tirage supprimé ; on ne la repaie pas.
    //
    //  🔴 LE SEUIL EST FRANC ET LE STOCK EST FINI. Un dresseur qui se soigne à
    //     chaque tour rendrait le combat infini, et le harnais l'a déjà prouvé
    //     une fois sur un sac vide. Un quart de vie, et pas plus de potions
    //     qu'il n'en porte.
    // ═══════════════════════════════════════════════════════════════════════
    var choix = { type: "attaque", index: h.pondere(pese).index };
    if (e.adverse.soins > 0 && pA.pv > 0 && pA.pv <= Math.floor(pA.stats.pv / 4)) {
      return { type: "objetAdverse", objet: e.adverse.soin || "SUPER_POTION" };
    }
    return choix;
  }

  // ── Le tour ────────────────────────────────────────────────────────────────
  //  Rend la liste des événements du tour. L'interface les met en mots ; le
  //  serveur les ignore et ne garde que l'état. Une seule vérité, deux lectures.
  //  🔴 `actionAdverse` sert au PvP : en duel, LES DEUX CAMPS DOIVENT EMPLOYER
  //     LA MÊME POLITIQUE. Sans ce paramètre, le camp « joueur » jouait la
  //     politique de duel et le camp adverse l'intelligence des dresseurs —
  //     mesuré, ça donnait 62 % de victoires au premier appelant au lieu de 50.
  //     Un PvP biaisé par l'ordre d'appel n'est pas un PvP.
  // ── CE QUE CHAQUE OBJET FAIT ───────────────────────────────────────────────
  //  🔴 UNE SEULE TABLE, ET ELLE EST LA LOI. Les valeurs viennent du jeu
  //     d'origine : Potion 20, Super Potion 50, Hyper Potion 200, Potion Max et
  //     Guérison au maximum. Les distributeurs de Céladopole soignent 50, 60 et
  //     80 — ce sont les Eau Fraîche, Soda Cool et Limonade, et c'est
  //     exactement pourquoi ils valent le détour.
  //  🔴 `soin: -1` VEUT DIRE « AU MAXIMUM ». Écrire 999 marcherait aujourd'hui
  //     et mentirait le jour où un Pokémon dépasse ce total.
  var OBJETS_SOIN = {
    POTION: { soin: 20 },
    SUPER_POTION: { soin: 50 },
    HYPER_POTION: { soin: 200 },
    MAX_POTION: { soin: -1 },
    FULL_RESTORE: { soin: -1, etat: "tous" },
    FRESH_WATER: { soin: 50 },
    SODA_POP: { soin: 60 },
    LEMONADE: { soin: 80 },
    ANTIDOTE: { etat: "poison" },
    BURN_HEAL: { etat: "brulure" },
    ICE_HEAL: { etat: "gel" },
    AWAKENING: { etat: "sommeil" },
    // 🔴 « paralysie » N'EXISTE PAS : le moteur pose « para » partout. L'Anti-
    //    Para n'a donc JAMAIS rien guéri depuis sa création (audit 13/08,
    //    refus rienALever 25/25 sur une paralysie réelle). Une lettre de clé,
    //    un objet mort — la classe de l'Anti-Gel FREEZE_SIDE_EFFECT sans « 1 ».
    PARLYZ_HEAL: { etat: "para" },
    FULL_HEAL: { etat: "tous" },
    REVIVE: { ranime: 0.5 },
    MAX_REVIVE: { ranime: 1 },
  };

  // 🔴 UN OBJET QUI NE FERAIT RIEN SE REFUSE, ET IL DIT POURQUOI. Boire une
  //    Potion à pleine vie consomme le tour ET l'objet : c'est un piège, pas
  //    une règle. Le jeu d'origine refuse aussi.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES OBJETS DE COMBAT QUI NE SOIGNENT PAS
  //
  //  🔴 SEPT OBJETS VENDUS EN BOUTIQUE NE FAISAIENT RIEN. Attaque +, Défense +,
  //     Vitesse +, Atq. Spé. +, Précision +, Muscle + et Garde-Stats étaient à
  //     l'étal, à 350 à 950 ₽ pièce, et aucun écran ne savait quoi en faire :
  //     le joueur payait pour un objet qui ne s'employait nulle part.
  //     Le moteur, lui, tient les PALIERS de statistique depuis toujours —
  //     c'est la mécanique du jeu d'origine, et ces objets sont exactement sa
  //     porte d'entrée hors attaque.
  //
  //  🔴 ILS COÛTENT LE TOUR, comme un soin. C'est ce qui en fait une décision :
  //     un palier d'attaque contre un tour de dégâts. Sans ce prix, ce serait
  //     un bouton gratuit qu'on presse toujours.
  // ═══════════════════════════════════════════════════════════════════════════
  var OBJETS_STAT = {
    X_ATTACK: { stat: "atk" },
    X_DEFEND: { stat: "def" },
    X_SPEED: { stat: "vit" },
    // ⚠️ En gen 2 il monte l'ATTAQUE spéciale, pas les deux : le nom suit le
    //    jeu de règles, et en gen 1 les deux noms sont le même.
    get X_SPECIAL() { return { stat: SPE_ATK() }; },
    X_ACCURACY: { stat: "precision" },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 CES DEUX-LÀ SE VENDAIENT ET NE FAISAIENT RIEN. Muscle + écrivait
    //     `paliers.critique`, un palier qu'AUCUN lecteur ne consulte
    //     (`chanceCritique` ne lit que la vitesse de base et la table des coups
    //     à fort critique). Garde-Stats posait `volatils.gardeStats`, lu
    //     uniquement par l'ÉCRAN qui l'affiche — `bougerPalier` ne l'a jamais
    //     regardé : le jeu annonçait une protection inexistante.
    //  ✅ LES DEUX DRAPEAUX CANON EXISTAIENT DÉJÀ, ET SONT LUS. Muscle + est
    //     l'objet de Focus Énergie (`volatils.puissance`, lu par `degats`) ;
    //     Garde-Stats est l'objet de Brume (`volatils.brume`, lu par
    //     `bougerPalier`). On ne câble rien de neuf : on cesse de pointer à côté.
    //  ⚠️ `puissance` reproduit le bug de 1996 (le taux de critique est DIVISÉ),
    //     comme l'attaque du même nom. C'est le canon, et il est déjà assumé.
    // ═══════════════════════════════════════════════════════════════════════
    DIRE_HIT: { volatil: "puissance" },
    GUARD_SPEC: { volatil: "brume" },
  };

  // Employer un objet de statistique sur le camp qui combat. Rend `false` quand
  // le palier est déjà au plafond : un objet gaspillé se dit, il ne se consomme
  // pas en silence.
  function appliquerStat(cote, cle, ev) {
    var o = OBJETS_STAT[cle];
    if (!o) return { ok: false, raison: "inconnu" };
    if (o.volatil) {
      if (cote.volatils[o.volatil]) return { ok: false, raison: "dejaPose" };
      cote.volatils[o.volatil] = true;
      // ⚠️ `garde` reste dans la réponse : l'écran s'en sert pour choisir sa
      //    phrase, et il ne connaît pas les noms de volatils du moteur.
      return { ok: true, garde: true, volatil: o.volatil };
    }
    if (cote.paliers[o.stat] === undefined) cote.paliers[o.stat] = 0;
    if (cote.paliers[o.stat] >= 6) return { ok: false, raison: "plafond" };
    bougerPalier(cote, o.stat, 1, ev || [], "joueur");
    return { ok: true, stat: o.stat };
  }

  function appliquerObjet(mon, cle) {
    var o = OBJETS_SOIN[cle];
    if (!o) return { ok: false, raison: "inconnu" };
    var vivant = mon.pv > 0;

    if (o.ranime !== undefined) {
      if (vivant) return { ok: false, raison: "debout" };
      MOT().poserPv(mon, Math.max(1, Math.floor(mon.stats.pv * o.ranime)), "rappel");
      mon.statut = null;
      return { ok: true, ranime: true, soigne: mon.pv };
    }
    if (!vivant) return { ok: false, raison: "aTerre" };

    var fait = false, statut = null;
    if (o.etat) {
      // L'Antidote lève AUSSI le poison grave : c'est le même venin, en pire.
      var couvre = o.etat === "tous" || mon.statut === o.etat ||
        (o.etat === "poison" && mon.statut === "poisonGrave");
      if (mon.statut && couvre) {
        statut = mon.statut; mon.statut = null; fait = true;
      }
    }
    var soigne = 0;
    if (o.soin) {
      var manque = mon.stats.pv - mon.pv;
      if (manque > 0) {
        soigne = o.soin < 0 ? manque : Math.min(o.soin, manque);
        MOT().poserPv(mon, mon.pv + soigne, "objetDuSac");
        fait = true;
      }
    }
    // 🔴 CES RAISONS SE LISENT MAINTENANT. Elles ont été calculées pendant des
    //    semaines et jetées : le sac de combat grisait le bouton, et le joueur
    //    voyait une Potion éteinte sans savoir si elle était refusée ou cassée.
    //    `ui-combat.js` les passe à l'infobulle. Toute raison ajoutée ici doit
    //    donc recevoir sa phrase — `poke-infobulles.mjs` le vérifie.
    // ⚠️ `riemALever` était une faute de frappe, et personne ne l'a vue parce
    //    que personne ne lisait la valeur. Une chaîne que rien ne lit ne peut
    //    pas se tromper — c'est justement pour ça qu'elle ne sert à rien.
    if (!fait) return { ok: false, raison: o.soin ? "pleineVie" : "rienALever" };
    return { ok: true, soigne: soigne, statut: statut };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE TOUR EST-IL PRIS ? — LA PORTE UNIQUE (17/08/2026, rapport de .nevix)
  //
  //  Rend `null`, ou `{ raison, cle, changerOk }` :
  //    · `raison`    ce que l'écran doit DIRE au joueur (clé de phrase) ;
  //    · `cle`       l'attaque qu'on est forcé de rejouer, s'il y en a une ;
  //    · `changerOk` le repli reste-t-il possible (il casse une étreinte).
  //
  //  🔴 L'ORDRE EST CELUI DE L'ANCIENNE CHAÎNE `coupForce`, À L'IDENTIQUE : une
  //     charge d'abord, puis la prise qu'on exerce, la fureur, la patience, la
  //     rage — et en dernier la prise qu'on SUBIT, la seule qui laisse partir.
  //     Le changer, c'est changer quelle attaque est forcée : les journaux déjà
  //     en base ne se rejoueraient plus pareil.
  //  🔴 LECTURE PURE, ZÉRO TIRAGE : l'écran l'appelle à chaque rendu de menu.
  // ═══════════════════════════════════════════════════════════════════════════
  function tourForce(e) {
    if (!e || !e.joueur || !e.adverse) return null;
    var vj = e.joueur.volatils || {}, va = e.adverse.volatils || {};
    if (vj.charge) return { raison: "charge", cle: vj.charge, changerOk: false };
    if (vj.etreint && vj.etreint.tours > 0) {
      return { raison: "serre", cle: vj.etreint.cle, changerOk: false };
    }
    if (vj.fureur && vj.fureur.tours > 0) {
      return { raison: "fureur", cle: vj.fureur.cle, changerOk: false };
    }
    if (vj.patience && vj.patience.tours > 0) {
      return { raison: "patience", cle: "BIDE", changerOk: false };
    }
    if (vj.rage) return { raison: "rage", cle: vj.rage, changerOk: false };
    // 🔴 ON SORT D'UN BIS EN SE REPLIANT, et c'est son seul contre-jeu : le
    //    coup est imposé, le Pokémon ne l'est pas. `changerOk` le dit à
    //    l'écran comme au moteur — une règle, deux lectures, jamais deux
    //    copies.
    if (vj.bis && vj.bis.tours > 0) {
      return { raison: "bis", cle: vj.bis.cle, changerOk: true };
    }
    if (va.etreint && va.etreint.tours > 0) {
      return { raison: "etreint", cle: null, changerOk: true };
    }
    return null;
  }

  function jouerTour(e, action, h, actionAdverse) {
    var ev = [];
    e.tour++;
    var pJ = actif(e.joueur);
    e.joueur.participants[e.joueur.actif] = true;

    // ═══════════════════════════════════════════════════════════════════════
    //  CE QUI RETIRE LE CHOIX AU JOUEUR — UNE SEULE PORTE
    //
    //  🔴 J'AI FAIT LA MÊME FAUTE DEUX FOIS DANS LA MÊME NUIT. Le remplacement
    //     d'action vivait dans `assaut`, que SEULE une attaque atteint : on
    //     pouvait charger un Lance-Soleil puis FUIR au tour suivant, et plus
    //     tard être « pris au piège » par une Étreinte… puis fuir aussi. Dans
    //     les deux cas la mécanique ne coûtait plus rien et la correction était
    //     vide. Les deux fois, c'est l'essai qui demandait EXPRÈS autre chose
    //     qui l'a montré.
    //  🔴 D'OÙ CETTE PORTE UNIQUE. Toute mécanique qui prive le joueur de son
    //     tour s'inscrit ICI, avant le tri des actions — et non dans `assaut`,
    //     qui ne voit que les attaques. Une troisième s'ajoutera sans repayer.
    //  ⚠️ Le camp adverse passe directement par `assaut` : ses reprises y sont
    //     traitées, et elles y restent.
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [17/08, rapport de .nevix] ET ELLE SE LIT DE L'EXTÉRIEUR, MAINTENANT.
    //     « Quand notre Pokémon est pris au piège dans Danse Flammes on ne peut
    //     pas lancer de Pokéball. » C'était vrai — et le pire n'était pas le
    //     refus, c'était sa forme : l'écran RETIRAIT LA BALL DU SAC
    //     (`agir` → `utiliserObjet`) puis le remplacement ci-dessous en faisait
    //     une attaque. La Ball disparaissait sans être lancée, sans un mot. Sur
    //     la Master Ball, unique et réservée à un légendaire, ça coûtait
    //     l'espèce. La règle du refus est voulue (13/08) ; le vol, non.
    //     `tourForce` est la porte unique : le moteur s'en sert pour forcer,
    //     l'écran pour éteindre le bouton AVANT de vider le sac. Deux lectures
    //     du même fait, jamais deux copies de la règle.
    var _force = tourForce(e);
    var coupForce = (_force && _force.cle) || null;
    // 🔴 ABANDONNER PASSE TOUJOURS. Sans cette exception, un dernier debout pris
    //    dans une Étreinte de dresseur ne pouvait NI fuir (règle), NI attaquer
    //    utilement, NI déclarer forfait — le forfait devenait une attaque et le
    //    combat ne finissait jamais. C'est exactement le blocage que la branche
    //    « ABANDONNER » a été écrite pour ouvrir, refermé par une porte posée
    //    plus haut qu'elle.
    var _sortie = action && action.type === "abandon";
    // 🔴 `changerOk` ÉTAIT LU PAR L'ÉCRAN ET PAS PAR LE MOTEUR — une règle à
    //    moitié branchée. L'écran laissait ÉQUIPE allumé, le joueur cliquait,
    //    et le remplacement redevenait une attaque ici même : le bouton
    //    promettait une sortie qui n'existait pas.
    if (coupForce && action && action.type !== "attaque" && !_sortie
        && !(_force.changerOk && action.type === "changer")) {
      for (var ich = 0; ich < pJ.attaques.length; ich++) {
        if (pJ.attaques[ich] && pJ.attaques[ich].cle === coupForce) {
          action = { type: "attaque", index: ich };
          break;
        }
      }
    }
    // 🔴 CELUI QUI EST PRIS NE JOUE PAS — MAIS IL PEUT SE REPLIER (tranché
    //    senior, 13/08). L'ancien blocage total créait une asymétrie mesurée
    //    à l'audit : la victime ADVERSE se repliait 40/40, la victime JOUEUR
    //    jamais (52/52 refus). En 1996 le changement de Pokémon est LE
    //    contre-jeu d'une prise — il coupe l'étreinte. Fuite, potion et Ball
    //    restent pris dans l'étau.
    if (e.adverse.volatils.etreint && e.adverse.volatils.etreint.tours > 0 && action) {
      if (action.type === "changer") {
        e.adverse.volatils.etreint = null;   // le repli casse la prise
      } else if (action.type !== "attaque" && !_sortie) {
        action = { type: "attaque", index: 0 };
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LE CAMP ADVERSE NE SAVAIT PAS SE REPLIER
    //
    //  🔴 `actionAdverse` N'ÉTAIT LUE QU'AU MOMENT DES ATTAQUES, où l'on
    //     prenait son `.index` pour un NUMÉRO D'ATTAQUE. Or la politique de
    //     duel rend aussi `{ type: "changer", index: k }`, et k est un rang
    //     d'ÉQUIPE, de 0 à 5.
    //  🔴 MESURÉ LE 08/08 SUR 2 237 TOURS DE DUEL : 104 replis demandés, ZÉRO
    //     appliqué. Soixante-seize devenaient une autre attaque que celle
    //     voulue, vingt-huit un numéro d'attaque qui n'existe pas. Le camp
    //     « joueur », lui, changeait bien — quinze lignes plus bas.
    //  🔴 UN PvP OÙ UN SEUL DES DEUX CAMPS PEUT SE REPLIER N'EST PAS UN PvP, et
    //     rien à l'écran ne pouvait le trahir : on voyait un adversaire jouer
    //     une attaque faible, pas un adversaire empêché.
    // ═══════════════════════════════════════════════════════════════════════
    var advChange = (actionAdverse && actionAdverse.type === "changer") ? actionAdverse.index : -1;
    if (advChange >= 0 && e.adverse.equipe[advChange] &&
        advChange !== e.adverse.actif && vivant(e.adverse.equipe[advChange])) {
      // 🔴 IL PORTE LES POINTS DE VIE DE CELUI QUI ENTRE — voir la note du repli
      //    du joueur, quinze lignes plus bas : sans eux, l'écran affiche l'état
      //    de FIN DE TOUR au moment de l'entrée, c'est-à-dire après le coup qui
      //    n'a pas encore été raconté.
      entrerEnJeu(e, "adverse", advChange, ev, {
        annonce: { t: "rappelle", cote: "adverse", de: e.adverse.actif, vers: advChange,
                   pv: e.adverse.equipe[advChange].pv },
      });
    } else {
      advChange = -1;
    }

    // Ce que l'adversaire frappe quand il ne se replie pas. 🔴 PARESSEUX À
    // DESSEIN : `choixAdverse` TIRE, et un tirage de plus décale tout le rejeu.
    // 🔴 ET ELLE HONORE `actionAdverse` PARTOUT, pas seulement au moment des
    //    attaques. Sans ça, un joueur qui change de Pokémon ou boit une potion
    //    faisait basculer son adversaire de la politique de duel à
    //    l'intelligence des dresseurs — deux camps, deux politiques, sur les
    //    tours mêmes où l'on est le plus vulnérable.
    function riposteAdverse() {
      if (advChange >= 0) return;   // il vient de rappeler : son tour est pris
      var a = (actionAdverse && actionAdverse.type === "attaque") ? actionAdverse : choixAdverse(e, h);
      // 🔴 SON SOIN LUI PREND SON TOUR, comme au joueur. C'est ce qui en fait
      //    une vraie décision de sa part et une vraie ouverture pour nous :
      //    un dresseur qui boirait sa potion ET frapperait dans le même tour
      //    ne serait pas difficile, il serait injuste.
      if (a && a.type === "objetAdverse") {
        var soigne = appliquerObjet(actif(e.adverse), a.objet);
        e.adverse.soins--;
        ev.push({
          // ⚠️ `cote` EST LU PAR LA BARRE DE VIE. Sans lui, `suivreEvenement`
          //    sort en tête et la potion ne fait rien bouger à l'écran.
          t: "objetAdverse", cote: "adverse", objet: a.objet,
          soigne: soigne.ok ? (soigne.soigne || 0) : 0,
          reste: e.adverse.soins,
        });
        return;
      }
      ev.push.apply(ev, assaut(e, e.adverse, e.joueur, a.index, h));
    }

    // Les actions qui ne sont pas une attaque passent AVANT, comme dans le jeu.
    if (action.type === "changer") {
      // 🔴 LE REPLI DU JOUEUR N'AVAIT AUCUNE GARDE, celui de l'adversaire en a
      //    trois. Un index hors bornes, un rang déjà actif ou un Pokémon à
      //    terre écrivait quand même `e.joueur.actif` : `actif()` rendait alors
      //    `undefined` et le tour suivant levait. Or c'est le NOYAU que le
      //    serveur rejoue depuis un journal de choix — une entrée aberrante
      //    plantait le rejeu au lieu d'être refusée.
      var cand = e.joueur.equipe[action.index];
      if (!cand || action.index === e.joueur.actif || !vivant(cand)) {
        ev.push({ t: "replisRefuse", cote: "joueur" });
        return ev;
      }
      // ═════════════════════════════════════════════════════════════════════
      // 🔴 « LE JEU NOUS RETIRE DES PV QUAND ON CHANGE DE POKÉMON » — rapport
      //    de Poltron_sofa, 18/08, capture d'écran à l'appui : équipe en pleine
      //    forme dans le menu, et le remplaçant entre déjà entamé.
      //    Ce n'était pas le moteur : il applique bien un seul coup. C'était
      //    l'ÉCRAN. `jouerTour` résout le tour ENTIER avant qu'une image ne
      //    bouge, et la barre du remplaçant se posait sur `mon.pv` — l'état de
      //    FIN de tour, riposte comprise. Le joueur voyait donc ses PV tomber
      //    à l'instant du repli, sans une ligne pour le dire, puis retomber une
      //    seconde fois quand le coup était enfin raconté, puis remonter à la
      //    resynchronisation. Trois mouvements pour un seul dégât.
      // 🔑 L'ÉVÉNEMENT PORTE L'ÉTAT DE L'INSTANT OÙ IL SE PRODUIT. C'est déjà
      //    la règle des autres — `degats` porte son montant, `vol` son soin —
      //    et c'est ce qui permet à l'écran de raconter dans l'ordre au lieu de
      //    lire une fin de tour qui n'est pas encore arrivée.
      // ═════════════════════════════════════════════════════════════════════
      ev.push({ t: "rappelle", cote: "joueur", de: e.joueur.actif, vers: action.index,
                pv: cand.pv });
      // ═════════════════════════════════════════════════════════════════════
      //  🔴 LE RELAIS PASSE LES PALIERS, ET C'EST TOUT SON INTÉRÊT. Sans lui,
      //     l'attaque s'annonçait, le Pokémon se retirait, et le remplaçant
      //     arrivait à zéro comme après n'importe quel repli : un coup qui ne
      //     fait rien, la classe de défaut n°1 du dossier.
      //  ⚠️ LES VOLATILS PARTENT QUAND MÊME. Un Relais qui transmettrait la
      //     confusion ou la prise en cours ferait une autre attaque que celle
      //     du canon, et bien plus forte.
      // ═════════════════════════════════════════════════════════════════════
      var _relais = (function () {
        var n = NEUFS();
        var c = n && n.durees.EFFECT_BATON_PASS && n.durees.EFFECT_BATON_PASS.cle;
        return c && e.joueur.volatils[c] ? e.joueur.paliers : null;
      })();
      entrerEnJeu(e, "joueur", action.index, ev, {
        paliers: _relais || null,
        annonce: _relais ? { t: "relais", cote: "joueur" } : null,
      });
      e.joueur.participants[action.index] = true;
      riposteAdverse();
      finDeTour(e, ev, h);
      return ev;
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  ABANDONNER — LA SORTIE QUAND ON NE PEUT NI GAGNER NI FUIR
    //
    //  🔴 RELEVÉ EN JOUANT : mon dernier debout (Roucool, Normal) devant un
    //     Spectre qu'il ne PEUT PAS toucher, et « on ne fuit pas un dresseur ».
    //     Le combat ne se terminait jamais de lui-même — cinquante tours sans
    //     issue, une défaite garantie qu'il fallait subir coup par coup. Le
    //     joueur DÉCLARE forfait : c'est une défaite, avec ses coûts habituels
    //     (l'argent, l'essai, le nœud rouvert), mais choisie plutôt que subie.
    //  🔴 AUCUN TIRAGE, comme la fuite refusée : la branche sort avant la
    //     riposte et la fin de tour. Le contrat de rejeu ne bouge pas.
    //  ⚠️ `e.abandon` distingue ce cas pour l'écran : dire « tu n'as plus de
    //     Pokémon » serait faux quand on abandonne avec un debout.
    // ═══════════════════════════════════════════════════════════════════════
    if (action.type === "abandon") {
      e.fini = "defaite";
      e.abandon = true;
      ev.push({ t: "abandon" });
      return ev;
    }
    if (action.type === "fuite") {
      if (e.adverse.dresseur) { ev.push({ t: "fuiteRefusee" }); return ev; }
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 DEUX MOITIÉS DE LA RÈGLE MANQUAIENT.
      //   (a) LE RACCOURCI DU ROM : si l'on est PLUS RAPIDE que le sauvage, la
      //       fuite est garantie, sans jet. Ici un Pokémon plus rapide échouait
      //       encore environ un tiers du temps — et c'est le cas le plus
      //       fréquent en début de partie, celui où l'on fuit pour survivre.
      //   (b) LE COMPTEUR DE TENTATIVES : le canon ajoute `30 × C`, où C est le
      //       nombre d'essais déjà faits dans ce combat. Le `+ 30` était figé,
      //       donc **réessayer n'améliorait jamais rien** — pendant que le
      //       commentaire promettait « peut nous retenir plusieurs tours »,
      //       ce qui n'a de sens que si insister finit par payer.
      //  ⚠️ Le tirage se consomme dans TOUS les cas, y compris sur le
      //     raccourci : un tirage supprimé se conserve, c'est la convention du
      //     dépôt et le rejeu serveur en dépend.
      // ═══════════════════════════════════════════════════════════════════════
      var vAdv = actif(e.adverse).stats.vit;
      e.essaisFuite = (e.essaisFuite || 0) + 1;
      var cote2 = Math.floor((pJ.stats.vit * 32) / Math.max(1, Math.floor(vAdv / 4) % 256)) + 30 * e.essaisFuite;
      var jetFuite = h.entier(256);
      if (pJ.stats.vit > vAdv || cote2 > 255 || jetFuite < cote2) {
        e.fini = "fuite"; ev.push({ t: "fuite", reussi: true }); return ev;
      }
      ev.push({ t: "fuite", reussi: false });
      riposteAdverse();
      finDeTour(e, ev, h);
      return ev;
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  L'OBJET EN COMBAT — LA DÉCISION QUI MANQUAIT
    //
    //  🔴 LE SAC NE MONTRAIT QUE DES BALLS. Le butin distribue des Potions, des
    //     Super Potions, des Rappels et des soins d'état depuis le premier
    //     jour — et aucun n'était utilisable. Le joueur les ramassait, les
    //     voyait s'accumuler, et n'en faisait jamais rien. Une récompense qui
    //     ne sert à rien n'est pas une récompense, c'est un décor.
    //
    //  🔴 ET C'EST LA DÉCISION MANQUANTE DU COMBAT. Sans objet, un tour n'offre
    //     qu'un choix : quelle attaque. Avec, il en offre un vrai — soigner ou
    //     frapper — parce que soigner COÛTE LE TOUR : l'adversaire attaque
    //     pendant qu'on boit. C'est la règle du jeu d'origine, et c'est elle
    //     qui rend le choix intéressant plutôt que gratuit.
    //
    //  🔴 IL VIT DANS LE NOYAU. Le serveur rejoue la partie : un soin appliqué
    //     par l'écran seul ferait diverger le rejeu au premier point de vie.
    // ═══════════════════════════════════════════════════════════════════════
    if (action.type === "objet") {
      var cibleIdx = action.cible === undefined ? e.joueur.actif : action.cible;
      var cible = e.joueur.equipe[cibleIdx];
      var res2 = appliquerObjet(cible, action.objet);
      if (!res2.ok) { ev.push({ t: "objetRefuse", objet: action.objet, raison: res2.raison }); return ev; }
      ev.push({
        t: "objet", cote: "joueur", objet: action.objet, cible: cibleIdx,
        soigne: res2.soigne || 0, statut: res2.statut || null, ranime: !!res2.ranime,
      });
      // Le tour est consommé : l'adversaire frappe.
      riposteAdverse();
      finDeTour(e, ev, h);
      return ev;
    }

    // 🔴 UN OBJET DE STATISTIQUE COÛTE LE TOUR, comme un soin. C'est ce qui en
    //    fait une décision — un palier d'attaque contre un tour de dégâts — et
    //    non un bouton gratuit qu'on presse toujours. La règle est POSÉE ICI,
    //    dans le moteur : l'écran ne fait que la demander, et le serveur rejoue
    //    la même suite d'événements.
    if (action.type === "stat") {
      var res3 = appliquerStat(e.joueur, action.objet, ev);
      if (!res3.ok) { ev.push({ t: "objetRefuse", objet: action.objet, raison: res3.raison }); return ev; }
      ev.push({ t: "objet", cote: "joueur", objet: action.objet, cible: e.joueur.actif, soigne: 0, statut: null, ranime: false });
      riposteAdverse();
      finDeTour(e, ev, h);
      return ev;
    }

    if (action.type === "ball") {
      if (e.adverse.dresseur) { ev.push({ t: "ballRefusee" }); return ev; }
      var res = W.PokeCapture.tenter(actif(e.adverse), action.ball, h,
        e.serments ? e.serments.capture : 1);
      ev.push({ t: "ball", ball: action.ball, secousses: res.secousses, pris: res.pris, raison: res.raison });
      if (res.pris) { e.fini = "capture"; return ev; }
      riposteAdverse();
      finDeTour(e, ev, h);
      return ev;
    }

    // Deux attaques : l'ordre se décide, puis on résout.
    var adv = actionAdverse || choixAdverse(e, h);
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 CE CHEMIN AUSSI DOIT CONNAÎTRE LE SOIN, ET IL NE LE CONNAISSAIT PAS.
    //    `riposteAdverse` traite le cas quand le joueur change, fuit, emploie
    //    un objet ou jette une Ball — mais le cas ORDINAIRE, celui où les deux
    //    camps attaquent, passe ici et appelle `choixAdverse` en direct.
    //    L'action de soin y tombait dans `assaut` avec un index vide : le
    //    dresseur ne se soignait pas, et son attaque devenait une Lutte.
    //    Mesuré avant de corriger — 97 Lutte sur 200 combats, et un taux de
    //    victoire qui bougeait de 159 à 172 sans qu'une seule potion soit bue.
    //    ⚠️ Deux chemins pour une même décision, c'est deux fois la règle. On
    //       les fait donc converger : le soin se résout ICI, avant l'ordre des
    //       attaques, exactement comme un objet du joueur.
    // ═══════════════════════════════════════════════════════════════════════
    // ⚠️ L'ORDRE SE TIRE DANS TOUS LES CAS, MÊME QUAND IL NE SERT PAS. C'est
    //    la même discipline que dans `choixAdverse` : un tour de soin qui
    //    sauterait `joueurEnPremier` retirerait un tirage, et décalerait toute
    //    la suite de la graine. J'ai écrit la règle dix lignes plus haut et
    //    j'allais l'enfreindre ici même.
    // Les priorités du coup CHOISI de chaque camp — Vive-Attaque devance,
    // Riposte attend. Voir PRIORITES_1G.
    var joueurDabord = joueurEnPremier(e, prioriteDe(e.joueur, action), prioriteDe(e.adverse, adv), h, ev);
    if (adv && adv.type === "objetAdverse") {
      var soigneA = appliquerObjet(actif(e.adverse), adv.objet);
      e.adverse.soins--;
      ev.push({
        t: "objetAdverse", cote: "adverse", objet: adv.objet,
        soigne: soigneA.ok ? (soigneA.soigne || 0) : 0,
        reste: e.adverse.soins,
      });
      // Son tour est pris : le joueur frappe, lui non.
      ev.push.apply(ev, assaut(e, e.joueur, e.adverse, action.index, h));
      finDeTour(e, ev, h);
      return ev;
    }
    var premier = joueurDabord ? ["joueur", action.index] : ["adverse", adv.index];
    var second = joueurDabord ? ["adverse", adv.index] : ["joueur", action.index];

    ev.push.apply(ev, assaut(e, e[premier[0]], e[premier[0] === "joueur" ? "adverse" : "joueur"], premier[1], h));
    // 🔴 UNE FUITE RÉUSSIE FERME LE TOUR (audit 13/08). Téléport en sauvage
    //    posait e.fini… que personne ne lisait : l'adversaire jouait ENCORE
    //    son coup (60/60) et pouvait transformer la fuite en DÉFAITE (5/60).
    //    Le combat fini, plus personne ne frappe et la fin de tour n'use plus.
    if (!e.fini && vivant(actif(e.joueur)) && vivant(actif(e.adverse))) {
      ev.push.apply(ev, assaut(e, e[second[0]], e[second[0] === "joueur" ? "adverse" : "joueur"], second[1], h));
    }
    if (!e.fini) finDeTour(e, ev, h);
    return ev;
  }

  // Une prise dure des TOURS, pas des actions : on la décompte ici, où les deux
  // camps ont fini de jouer et où l'ordre des vitesses ne compte plus.
  function decompterEtreinte(cote, quiVictime, ev) {
    if (!cote.volatils.etreint) return;
    cote.volatils.etreint.tours--;
    if (cote.volatils.etreint.tours <= 0) {
      cote.volatils.etreint = null;
      ev.push({ t: "finEtreinte", cote: quiVictime });
    }
  }

  // La fureur dure des TOURS, et son prix se paie quand elle s'arrête — jamais
  // au bon vouloir de l'action suivante.
  function decompterFureur(cote, qui, ev, h) {
    if (!cote.volatils.fureur) return;
    cote.volatils.fureur.tours--;
    if (cote.volatils.fureur.tours > 0) return;
    cote.volatils.fureur = null;
    ev.push({ t: "fureurFinie", cote: qui });
    // 🔴 UNE FUREUR QUI S'ARRÊTE SANS CONFUSION SERAIT UNE ATTAQUE FORTE SANS
    //    REVERS, c'est-à-dire la meilleure du jeu. C'est tout son marché.
    if (!cote.volatils.confusion) {
      cote.volatils.confusion = h.entre(2, 5);
      ev.push({ t: "confusion", cote: qui });
    }
  }

  // 🔴 ENTRAVE SE COMPTE EN TOURS, PAS EN TENTATIVES (13/08). « L'attaque
  //    Entrave ne fonctionne pas » (proprio) — le compteur ne descendait que
  //    lorsque l'adversaire RESSAYAIT le coup bloqué : s'il jouait autre
  //    chose, l'entrave durait à vie sans que rien ne se voie. En 1996 le
  //    compteur descend à CHAQUE tour du camp entravé — c'est ce qui rend le
  //    « quelques tours » de la notice vrai.
  // Le Bis dure des TOURS, comme l'entrave — et pour la même raison : décompté
  // à la tentative, il ne finirait jamais quand l'autre camp joue autre chose.
  function decompterBis(cote, qui, ev) {
    if (!cote.volatils.bis || cote.volatils.bis.tours <= 0) return;
    cote.volatils.bis.tours--;
    if (cote.volatils.bis.tours <= 0) {
      cote.volatils.bis = null;
      ev.push({ t: "bisFinit", cote: qui });
    }
  }

  function decompterEntrave(cote, qui, ev) {
    var ent = cote.volatils.entrave;
    if (!ent) return;
    ent.tours--;
    if (ent.tours <= 0) { cote.volatils.entrave = null; ev.push({ t: "finEntrave", cote: qui }); }
  }

  function finDeTour(e, ev, h) {
    decompterEtreinte(e.joueur, "adverse", ev);
    decompterEtreinte(e.adverse, "joueur", ev);
    decompterEntrave(e.joueur, "joueur", ev);
    decompterEntrave(e.adverse, "adverse", ev);
    // 🔴 LA PEUR MEURT AVEC LE TOUR (audit 13/08). Posée par le SECOND à agir,
    //    elle survivait et volait le tour SUIVANT (38/38 au banc) — impossible
    //    en 1996 : l'apeurement ne vaut que si l'on frappe en premier.
    e.joueur.volatils.peur = false;
    e.adverse.volatils.peur = false;
    if (h) { decompterFureur(e.joueur, "joueur", ev, h); decompterFureur(e.adverse, "adverse", ev, h); }
    // La tempête frappe AVANT l'usure ordinaire — voir `usureMeteo`.
    if (vivant(actif(e.joueur))) usureMeteo(e, actif(e.joueur), ev, "joueur");
    if (vivant(actif(e.adverse))) usureMeteo(e, actif(e.adverse), ev, "adverse");
    if (vivant(actif(e.joueur))) usureFinDeTour(actif(e.joueur), ev, "joueur", e.joueur, e.adverse);
    if (vivant(actif(e.adverse))) usureFinDeTour(actif(e.adverse), ev, "adverse", e.adverse, e.joueur);
    meteoFinDeTour(e, ev);
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 LE REQUIEM EMPORTE LES DEUX, ET C'EST CE QUI EN FAIT UN PARI. Trois
    //     tours après le chant, celui qui l'a lancé tombe aussi — le lancer
    //     quand on est derrière est un calcul, pas une exécution.
    //  ⚠️ ET LES DEUX COMPTEURS DESCENDENT ENSEMBLE : un seul décompte aurait
    //     fait tomber un camp avant l'autre, ce qui n'est pas le canon et ce
    //     qui rendrait le coup imparable.
    // ═══════════════════════════════════════════════════════════════════════
    (function () {
      var n = NEUFS();
      if (!n) return;
      var cle = n.durees.EFFECT_PERISH_SONG && n.durees.EFFECT_PERISH_SONG.cle;
      if (!cle) return;
      [["joueur", e.joueur], ["adverse", e.adverse]].forEach(function (paire) {
        var c = paire[1];
        if (!c.volatils[cle]) return;
        c.volatils[cle]--;
        var p = actif(c);
        if (c.volatils[cle] > 0) {
          ev.push({ t: "requiem", cote: paire[0], reste: c.volatils[cle] });
        } else if (vivant(p)) {
          p.pv = 0;
          c.volatils[cle] = 0;
          ev.push({ t: "requiemTombe", cote: paire[0], n: p.n });
        }
      });
    })();
    // ═══════════════════════════════════════════════════════════════════════
    //  LA MALÉDICTION RONGE, ET ELLE NE S'ARRÊTE PAS
    //
    //  🔴 C'EST TOUT SON PRIX. Le Spectre a payé la moitié de ses points de vie
    //     pour la poser ; si elle s'éteignait au bout de trois tours, il aurait
    //     payé plus cher qu'elle ne rapporte. Elle vit tant que la créature
    //     reste — le canon de 1999, et le seul marché qui la rende jouable.
    //  ⚠️ ELLE PART AVEC LE POKÉMON, comme tous les volatils : le remplacement
    //     efface `volatils`, donc changer est la porte de sortie.
    // ═══════════════════════════════════════════════════════════════════════
    (function () {
      var n2 = NEUFS();
      var sjm = n2 && n2.sansJet && n2.sansJet.EFFECT_CURSE;
      if (!sjm) return;
      [["joueur", e.joueur], ["adverse", e.adverse]].forEach(function (paire) {
        var c = paire[1];
        if (!c.volatils.malediction) return;
        var p = actif(c);
        if (!vivant(p)) return;
        var d = Math.max(1, Math.floor(p.stats.pv / sjm.rongePart));
        MOT().poserPv(p, p.pv - d, "malediction");
        ev.push({ t: "maledictionRonge", cote: paire[0], degats: d, pv: p.pv });
        if (!vivant(p)) ev.push({ t: "ko", cote: paire[0] });
      });
    })();
    // ═══════════════════════════════════════════════════════════════════════
    //  LE CAUCHEMAR RONGE TANT QUE L'AUTRE DORT
    //
    //  🔑 ET IL S'ÉTEINT AU RÉVEIL, SANS QU'ON AIT À LE DÉCOMPTER. C'est ce qui
    //     l'attache au sommeil au lieu d'en faire une seconde Malédiction :
    //     Cauchemar est la moitié d'un plan, l'autre moitié est Hypnose. Un
    //     réveil est donc une VICTOIRE, et l'écran doit le dire.
    // ═══════════════════════════════════════════════════════════════════════
    (function () {
      var nC = NEUFS();
      var sjc = nC && nC.sansJet && nC.sansJet.EFFECT_NIGHTMARE;
      if (!sjc) return;
      [["joueur", e.joueur], ["adverse", e.adverse]].forEach(function (paire) {
        var c = paire[1];
        if (!c.volatils.cauchemar) return;
        var p = actif(c);
        if (!vivant(p)) return;
        if (p.statut !== "sommeil") {
          c.volatils.cauchemar = false;
          ev.push({ t: "cauchemarFinit", cote: paire[0] });
          return;
        }
        var d = Math.max(1, Math.floor(p.stats.pv / sjc.rongePart));
        MOT().poserPv(p, p.pv - d, "cauchemar");
        ev.push({ t: "cauchemarRonge", cote: paire[0], degats: d, pv: p.pv });
        if (!vivant(p)) ev.push({ t: "ko", cote: paire[0] });
      });
    })();
    // ═══════════════════════════════════════════════════════════════════════
    //  LA PRESCIENCE TOMBE — ET ELLE TRAVERSE UN REMPLACEMENT
    //
    //  🔴 ELLE VIT SUR LE CAMP, PAS DANS LES VOLATILS, et c'est toute la
    //     mécanique : le coup a été payé deux tours plus tôt, sur les
    //     statistiques de ce moment-là ; changer de Pokémon ne l'annule pas,
    //     ça change seulement QUI le prend. C'est le second piège de 1999 qui
    //     survit à un changement, avec les Picots.
    //  ⚠️ LES DÉGÂTS SONT DÉJÀ CALCULÉS : rien ne se rejoue ici, aucun tirage.
    // ═══════════════════════════════════════════════════════════════════════
    (function () {
      [["joueur", e.joueur], ["adverse", e.adverse]].forEach(function (paire) {
        var c = paire[1];
        if (!c.differe || c.differe.tours <= 0) return;
        c.differe.tours--;
        if (c.differe.tours > 0) return;
        var cle = c.differe.cle, d = c.differe.degats;
        c.differe = null;
        var p = actif(c);
        if (!vivant(p)) return;
        ev.push({ t: "prescienceTombe", cote: paire[0], attaque: cle, degats: d });
        encaisser(c, p, d, ev, paire[0]);
      });
    })();
    // Le Lien du Destin ne vaut qu'un tour : il s'éteint avec lui.
    (function () {
      var n = NEUFS();
      if (!n) return;
      var cle = n.durees.EFFECT_DESTINY_BOND && n.durees.EFFECT_DESTINY_BOND.cle;
      if (!cle) return;
      if (e.joueur.volatils[cle] > 0) e.joueur.volatils[cle]--;
      if (e.adverse.volatils[cle] > 0) e.adverse.volatils[cle]--;
    })();
    // Rune Protect s'use aussi.
    (function () {
      var n = NEUFS();
      if (!n) return;
      var cle = n.durees.EFFECT_SAFEGUARD && n.durees.EFFECT_SAFEGUARD.cle;
      if (!cle) return;
      [["joueur", e.joueur], ["adverse", e.adverse]].forEach(function (paire) {
        var c = paire[1];
        if (!c.volatils[cle]) return;
        c.volatils[cle]--;
        if (c.volatils[cle] <= 0) ev.push({ t: "runeFinit", cote: paire[0] });
      });
    })();
    // 🔴 PATIENCE REND LE DOUBLE, ET ELLE DOIT LE RENDRE. Elle s'annonçait et
    //    ne libérait jamais rien : trois tours perdus pour le joueur.
    libererPatience(e, e.joueur, e.adverse, "joueur", "adverse", ev);
    libererPatience(e, e.adverse, e.joueur, "adverse", "joueur", ev);
    // 🔴 LA DETTE DE RIPOSTE MEURT AVEC LE TOUR. C'est elle qui borne le coup :
    //    sans cet oubli, on riposterait au tour suivant, donc toujours, et
    //    Riposte deviendrait le meilleur coup du jeu au lieu d'un pari sur la
    //    lenteur.
    e.joueur.volatils.riposte = 0;
    e.adverse.volatils.riposte = 0;
    // ═══════════════════════════════════════════════════════════════════════
    //  LES DEUX GARDES DE 1999 MEURENT AVEC LE TOUR, ET LA DETTE SPÉCIALE AUSSI
    //
    //  🔴 C'EST CE QUI LES BORNE. Un abri qui survivrait au tour rendrait son
    //     lanceur intouchable ; une ténacité qui survivrait le rendrait
    //     immortel. Elles se posent au tour où on les joue, elles encaissent le
    //     coup de ce tour-là, et elles s'en vont — le compteur d'usure, lui,
    //     RESTE : c'est lui qui fait payer la répétition.
    // ═══════════════════════════════════════════════════════════════════════
    e.joueur.volatils.abri = false;
    e.adverse.volatils.abri = false;
    e.joueur.volatils.tenacite = false;
    e.adverse.volatils.tenacite = false;
    e.joueur.volatils.voileMiroir = 0;
    e.adverse.volatils.voileMiroir = 0;
    decompterBis(e.joueur, "joueur", ev);
    decompterBis(e.adverse, "adverse", ev);

    // 🔴 L'ADVERSAIRE ENVOIE LE SUIVANT. Sans cette règle, le Pokémon à terre
    //    RESTAIT sur le terrain et continuait d'attaquer : mesuré le 07/08, un
    //    Dracaufeu niveau 45 mettait trois KO en quatre tours puis mourait au
    //    103e sur un adversaire déjà tombé, et les huit arènes étaient
    //    imperdables… pour l'adversaire. C'est la classe de défaut n°1 du
    //    projet, à la lettre : le moteur SAIT que le Pokémon est à terre, et il
    //    n'en tire rien.
    if (!vivant(actif(e.adverse))) {
      var suivant = -1;
      for (var i = 0; i < e.adverse.equipe.length; i++) {
        if (vivant(e.adverse.equipe[i])) { suivant = i; break; }
      }
      if (suivant >= 0) {
        // 🔴 « J'AI MIS KO UN ORTIDE ET LE JEU A DIT QUE MACHOC ÉTAIT KO, PUIS
        //    LE DRESSEUR M'A ENVOYÉ MACHOC » — rapport de joueur du 15/08. Le
        //    remplacement se fait ICI, à la fin du tour, AVANT que l'écran ne
        //    mette le tour en mots : la ligne « {nom} est K.O. ! » lisait donc
        //    l'ACTIF, qui était déjà le remplaçant. Tout ce que l'adversaire
        //    avait fait dans ce tour était nommé de la même façon fausse.
        //  🔑 UN ÉVÉNEMENT DE CHANGEMENT DOIT DIRE D'OÙ IL VIENT, pas seulement
        //     où il va : `de` est le rang QUI PART, et il permet à l'écran de
        //     rembobiner les rangs sans que le moteur ait à figer des noms.
        //     `rappelle` le portait déjà ; `envoie` ne le portait pas.
        var partant = e.adverse.actif;
        //  ⚠️ Il porte ses PV comme `rappelle`, pour la même raison : un
        //     événement de changement dit l'état de celui qui entre. Ici la fin
        //     de tour est déjà passée, donc la valeur est la même que l'état —
        //     mais deux façons de la lire finissent par diverger.
        entrerEnJeu(e, "adverse", suivant, ev, {
          annonce: { t: "envoie", cote: "adverse", de: partant, index: suivant,
                     n: e.adverse.equipe[suivant].n, pv: e.adverse.equipe[suivant].pv },
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  QUAND LES DEUX CAMPS TOMBENT ENSEMBLE, C'EST UNE DÉFAITE  [20/08/2026]
    //
    //  🔴 SIGNALÉ PAR MR0MEGAA, CAPTURE À L'APPUI : « Pokémons KO mais victoire
    //     du combat car l'adversaire est mort de la brûlure en même temps que
    //     moi ». Ces deux lignes étaient liées par un `else if` : dès que le
    //     camp d'en face était vide, on écrivait « victoire » et **on ne
    //     regardait jamais l'équipe du joueur**. Le combat se gagnait, la carte
    //     reprenait, et l'écran suivant demandait « qui entre en premier ? » à
    //     un dresseur dont les six Pokémon sont à terre. Le voyage était mort
    //     sans que rien ne le dise.
    //  🔑 LES RÉSIDUS DE FIN DE TOUR — brûlure, poison, Vampigraine — frappent
    //     les DEUX camps dans le même instant. Un `else if` suppose qu'un seul
    //     peut tomber : c'est vrai d'une attaque, faux d'un poison.
    //  ✅ ET C'EST LE CANON : sur cartouche, si votre dernier Pokémon tombe en
    //     même temps que celui d'en face, vous perdez connaissance. Le camp du
    //     joueur se juge donc EN PREMIER.
    //  ⚠️ Le rejeu voit exactement la même chose : les deux camps sont mis à
    //     jour avant ce test, et le serveur exécute ce fichier-ci.
    // ═══════════════════════════════════════════════════════════════════════
    if (!resteUn(e.joueur)) e.fini = "defaite";
    else if (!resteUn(e.adverse)) e.fini = "victoire";
    // 🔴 L'ERRANT S'EN VA, ET IL LE DIT. Après la victoire et la défaite : on
    //    ne fuit pas un combat déjà tranché. Le tour où il part est COMPTÉ, pas
    //    tiré — deux joueurs sur la même graine voient la même chose.
    else if (e.sauvage && e.fuiteApres && e.tour >= e.fuiteApres) {
      e.fini = "fuite";
      ev.push({ t: "fuiteErrant", n: actif(e.adverse).n });
    }
    // Le joueur, lui, CHOISIT qui entre. Le moteur se contente de le dire ;
    // décider à sa place lui retirerait la seule décision qui reste quand ça
    // tourne mal.
    else if (!vivant(actif(e.joueur))) e.attenteJoueur = true;

    //  🔴 ET UN COMBAT FINI REND TOUT LE MONDE À LUI-MÊME. Sans cette ligne, la
    //     créature transformée est celle que la SAUVEGARDE garde : c'est là que
    //     le défaut devient définitif, pas pendant le combat.
    //  🔑 UNE SEULE PORTE : `finDeTour` est le seul endroit du moteur qui
    //     conclut. Poser la remise en forme derrière chacun des cinq `e.fini`
    //     aurait été cinq occasions d'en oublier un.
    if (e.fini) defaireToutesTransformations(e);
  }

  // 🔴 CE QUI EST RÉELLEMENT TRAITÉ, EXPOSÉ PAR LE CODE QUI LE TRAITE.
  //    `poke-canon.mjs` recopiait cette liste et elle a dérivé au premier
  //    ajout : il accusait `DEFENSE_UP1_EFFECT` d'être sans mécanique alors
  //    qu'elle en a une, six lignes plus haut. Une liste tenue à deux endroits
  //    finit toujours par mentir — celle-ci est calculée depuis les tables.
  //  ⚠️ ET `COUPS_TRAITES` EN FAIT PARTIE. Quatorze effets à dégâts — charge,
  //     recharge, contrecoup, explosion, coups multiples, étreinte, frénésie —
  //     sont exécutés par du code dédié plus haut et n'étaient pas dans cette
  //     liste. Conséquence : le laissez-passer de `ditEffet` les faisait TAIRE,
  //     donc les capsules d'Explosion, de Damoclès ou de Lance-Soleil se
  //     vendaient sur leur seul chiffre de puissance. La faute est déjà
  //     racontée plus haut pour Guillotine et Abîme ; elle se rejouait ici.
  var EFFETS_TRAITES = ["NO_ADDITIONAL_EFFECT"]
    .concat(Object.keys(STATUT_DE)).concat(Object.keys(PALIER_DE))
    .concat(Object.keys(PEUR_DE)).concat(Object.keys(TRAITES_AILLEURS))
    .concat(Object.keys(COUPS_TRAITES));

  W.PokeCombat = {
    DEGEL_NATUREL: DEGEL_NATUREL,
    EFFETS_TRAITES: EFFETS_TRAITES,
    // 🔴 LA SEULE PORTE PAR LAQUELLE ON ENTRE EN JEU. Elle est publique parce
    //    que l'écran, le duel et les deux simulateurs remplacent eux-mêmes
    //    après un K.O. — et qu'un piège posé au sol doit mordre par toutes les
    //    portes ou par aucune. `tools/poke-une-seule-porte-dentree.mjs` refuse
    //    toute pose de `actif` en dehors d'ici.
    entrerEnJeu: entrerEnJeu,
    // 🔴 PUBLIQUE POUR QUE PERSONNE NE LA RECOPIE. Un harnais qui écrirait
    //    `{ atk:0, def:0, vit:0, spe:0, … }` à la main fabriquerait, sous la
    //    seconde génération, une statistique qui n'existe pas — et mesurerait
    //    un monde que le jeu ne joue pas.
    paliersNeufs: paliersNeufs,
    // La loi « ce coup peut-il seulement marcher ? », partagée avec le duel.
    coupUtile: coupUtile,
    // Combien de Pokémon ont pris part au combat — voir ci-dessus : l'écran le
    // comptait lui-même, et se trompait de forme de donnée.
    combienOntCombattu: combienOntCombattu,
    EFFETS_NON_TRAITES: EFFETS_NON_TRAITES,
    jouerTour: jouerTour,
    // Le tour est-il pris ? Lu par `jouerTour` pour forcer le coup, et par
    // l'écran de combat pour éteindre les boutons AVANT de vider le sac.
    tourForce: tourForce,
    OBJETS_SOIN: OBJETS_SOIN,
    OBJETS_STAT: OBJETS_STAT,
    appliquerObjet: appliquerObjet,
    appliquerStat: appliquerStat,
    choixAdverse: choixAdverse,
    bonusBadges: bonusBadges,
    efficacite: efficacite,
    estSpecial: estSpecial,
    chanceCritique: chanceCritique,
    facteurPalier: facteurPalier,
    degats: degats,
    demarrer: demarrer,
    actif: actif,
    vivant: vivant,
    resteUn: resteUn,
    vitesseEffective: vitesseEffective,
    joueurEnPremier: joueurEnPremier,
    peutAgir: peutAgir,
    usureFinDeTour: usureFinDeTour,
  };
})(typeof window !== "undefined" ? window : globalThis);
