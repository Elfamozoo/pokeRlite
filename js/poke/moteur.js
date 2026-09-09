(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE MOTEUR — CRÉATURES, STATISTIQUES, EXPÉRIENCE, ÉVOLUTION
  //
  //  🔴 CE FICHIER EST PUR. Aucun accès au DOM, aucun texte affiché, aucune
  //     dépendance à l'interface. C'est la condition pour que le serveur le
  //     rejoue à l'identique et valide les scores.
  //  🔴 Tout hasard passe par `PokeHasard`. Rien d'autre.
  //
  //  Les formules sont celles de la PREMIÈRE GÉNÉRATION, reprises de la
  //  désassemblée du jeu. Là où l'on s'en écarte, le commentaire le dit et
  //  donne la raison — il n'y a qu'un écart, et il est dans `combat.js`.
  // ═══════════════════════════════════════════════════════════════════════════

  // ⚠️ PAR LE REGISTRE, PAS PAR LA GLOBALE. C'est ici que la seconde
  //    génération se branche — et c'est le repli qui protège un chargement
  //    partiel, pas un contournement. En gen 1 le registre rend exactement ces
  //    deux globales : la ligne ne change rien à ce que le moteur lit.
  var ESP = function () { return W.PokeRegles ? W.PokeRegles.especes() : W.POKE_ESPECE; };
  var ATT = function () { return W.PokeRegles ? W.PokeRegles.attaques() : W.POKE_ATTAQUE_PAR_CLE; };

  // ── Courbes d'expérience ───────────────────────────────────────────────────
  //  Quatre courbes en génération 1. Elles décident du rythme entier du jeu :
  //  un Dracaufeu (moyenne lente) monte visiblement plus lentement qu'un
  //  Roucarnage (moyenne). C'est du contenu, pas un détail technique.
  function expTotalePour(croissance, n) {
    if (n <= 1) return 0;
    var c = n * n * n;
    switch (croissance) {
      case "rapide": return Math.floor((4 * c) / 5);
      case "lente": return Math.floor((5 * c) / 4);
      case "moyenne_lente":
        return Math.max(0, Math.floor((6 / 5) * c - 15 * n * n + 100 * n - 140));
      default: return c; // « moyenne »
    }
  }

  function niveauPourExp(croissance, exp) {
    var n = 1;
    while (n < 100 && expTotalePour(croissance, n + 1) <= exp) n++;
    return n;
  }

  // ── Statistiques ───────────────────────────────────────────────────────────
  //  🔴 UNE SEULE statistique « Spécial ». C'est la génération 1. Un joueur le
  //     reconnaît immédiatement, et ça change toute la construction d'équipe :
  //     un Pokémon spécial est bon en attaque ET en défense spéciales.
  function terme(base, dv, statExp) {
    var e = Math.floor(Math.min(255, Math.ceil(Math.sqrt(statExp || 0))) / 4);
    return (base + dv) * 2 + e;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES DEUX SPÉCIALES — ET POURQUOI CE N'EST PAS UN `if`  [19/08/2026]
  //
  //  🔴 LA SECONDE GÉNÉRATION SÉPARE LE SPÉCIAL en attaque et défense
  //     spéciales : six statistiques de base au lieu de cinq. C'est le seul
  //     écart de la gen 2 qui touche ce fichier, et c'est le plus profond.
  //
  //  🔑 LE MOTEUR NE SAIT PAS SOUS QUELLE GÉNÉRATION IL TOURNE, et il ne doit
  //     pas l'apprendre. Il demande au registre le NOM de ses deux
  //     statistiques spéciales. En gen 1 les deux noms sont le même — `spe` —
  //     et la boucle produit exactement les cinq statistiques d'avant, dans le
  //     même ordre, avec les mêmes arrondis. Ce n'est pas un cas particulier
  //     neutralisé : c'est le cas général dont la gen 1 est l'instance.
  //     La preuve tient au tour près (`poke-sim.mjs 200`).
  //
  //  ⚠️ LES DEUX SPÉCIALES PARTAGENT LEUR VALEUR DÉTERMINANTE ET LEUR
  //     EXPÉRIENCE DE STAT — c'est le ROM de 1999 qui fait ça, pas une
  //     simplification. `dv.spe` et `statExp.spe` restent donc uniques, et
  //     AUCUN tirage n'est ajouté : un tirage de plus casserait le rejeu de
  //     toutes les graines du mode.
  // ═══════════════════════════════════════════════════════════════════════════
  var SPE_ATK = function () { return W.PokeRegles ? W.PokeRegles.speAtk() : "spe"; };
  var SPE_DEF = function () { return W.PokeRegles ? W.PokeRegles.speDef() : "spe"; };

  function calculerStats(p) {
    var b = ESP()[p.n].base, d = p.dv, e = p.statExp, L = p.niveau;
    var s = {
      pv: Math.floor((terme(b.pv, d.pv, e.pv) * L) / 100) + L + 10,
      atk: Math.floor((terme(b.atk, d.atk, e.atk) * L) / 100) + 5,
      def: Math.floor((terme(b.def, d.def, e.def) * L) / 100) + 5,
      vit: Math.floor((terme(b.vit, d.vit, e.vit) * L) / 100) + 5,
    };
    var sa = SPE_ATK(), sd = SPE_DEF();
    var expSa = (e && e.sat !== undefined) ? e.sat : ((e && e[sa] !== undefined) ? e[sa] : (e ? e.spe : 0));
    var expSd = (e && e.sdf !== undefined) ? e.sdf : ((e && e[sd] !== undefined) ? e[sd] : (e ? e.spe : 0));
    s[sa] = Math.floor((terme(b[sa], d.spe, expSa) * L) / 100) + 5;
    s[sd] = Math.floor((terme(b[sd], d.spe, expSd) * L) / 100) + 5;
    if (p.nature && W.POKE_GEN3_NATURES && W.POKE_GEN3_NATURES[p.nature]) {
      var nMod = W.POKE_GEN3_NATURES[p.nature];
      if (nMod.plus && s[nMod.plus]) s[nMod.plus] = Math.floor(s[nMod.plus] * 1.1);
      if (nMod.moins && s[nMod.moins]) s[nMod.moins] = Math.floor(s[nMod.moins] * 0.9);
    }
    return s;
  }

  // Les valeurs déterminantes. En génération 1, celle des PV n'est pas tirée :
  // elle se DÉDUIT de la parité des quatre autres. Reproduire ce détail rend
  // les Pokémon parfaits aussi rares que dans le jeu d'origine.
  function tirerDV(h) {
    var atk = h.entier(16), def = h.entier(16), vit = h.entier(16), spe = h.entier(16);
    var pv = ((atk & 1) << 3) | ((def & 1) << 2) | ((vit & 1) << 1) | (spe & 1);
    return { pv: pv, atk: atk, def: def, vit: vit, spe: spe };
  }

  // ── Le jeu d'attaques à un niveau donné ────────────────────────────────────
  //  Le jeu garde les QUATRE DERNIÈRES attaques apprises. Un Pokémon capturé
  //  tard n'a donc pas ses attaques de départ — et c'est ce qui rend une
  //  capture tardive moins intéressante qu'un Pokémon élevé.
  function attaquesAuNiveau(n, niveau) {
    var e = ESP()[n];
    var liste = (e.depart || []).slice();
    var app = e.apprend || [];
    for (var i = 0; i < app.length; i++) {
      if (app[i][0] > niveau) break;
      if (liste.indexOf(app[i][1]) < 0) liste.push(app[i][1]);
    }
    var quatre = liste.slice(-4);
    return quatre.map(function (cle) {
      var a = ATT()[cle];
      return { cle: cle, pp: a ? a.pp : 5, ppMax: a ? a.pp : 5 };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CE QU'UNE ESPÈCE PORTE À L'ÉTAT SAUVAGE — 75 / 23 / 2
  //
  //  🔴 LES TROIS TAUX SONT ÉCRITS DANS LA SOURCE DU ROM, en commentaire, au
  //     mot près : « Effective chances: 75% None, 23% Item1, 2% Item2 »
  //     (`LoadEnemyMon`, pokecrystal). Ce ne sont donc pas une lecture ni une
  //     estimation — et c'est bien deux tirages, pas un : un quart de chance
  //     d'avoir QUELQUE CHOSE, puis huit pour cent de ce quart pour le rare.
  //
  //  🔴 CE QUI ÉTAIT ÉCRIT ICI DONNAIT L'OBJET RARE 95 FOIS SUR 100. La ligne
  //     `h.brut() < 0.05 ? (b || a) : (a || b)` se lit comme « 5 % le rare,
  //     sinon le commun » — mais **trente-neuf espèces sur les soixante et une
  //     qui portent quelque chose n'ont RIEN dans l'emplacement commun** :
  //     Tadmorv, Ramoloss, Farfuret… leur fiche dit `[null, KINGS_ROCK]`. Le
  //     repli `a || b` rendait alors `b`, c'est-à-dire l'objet rare, dans les
  //     95 % restants. Mesuré : **24,1 % des créatures tirées portaient
  //     quelque chose** là où le canon en donne 25 % aux seules 61 espèces
  //     concernées, soit environ 6 %. Une Roche Royale « rare » sortait
  //     quarante-sept fois trop souvent.
  //     *Un `||` est un repli silencieux : il ne rend jamais rien de faux, il
  //     rend juste autre chose que ce qu'on croyait demander.*
  //
  //  ⚠️ IL Y A UNE EXCEPTION DANS LE ROM, ET ELLE EST NOMMÉE : Ho-Oh, Lugia et
  //     Ronflex des rencontres fixes reçoivent l'objet 1 À COUP SÛR
  //     (`BATTLETYPE_FORCEITEM`). C'est de là que vient « Ronflex a toujours
  //     ses Restes » — d'un type de combat, pas d'un taux. On l'ouvre par
  //     `options.objetForce`, et personne ne l'emploie encore : les rencontres
  //     fixes de Johto ne sont pas écrites.
  //
  //  ⚠️ DEUX TIRAGES PAR CRÉATURE CRÉÉE, contre un seul avant. Sous 1996 la
  //     porte rend `null` AVANT tout tirage — le rejeu de Kanto ne bouge pas
  //     d'un cran, et c'est ce que son invariant vérifie.
  // ═══════════════════════════════════════════════════════════════════════════
  var OBJET_RIEN = 0.75;    // 75 % : la créature ne porte rien
  var OBJET_RARE = 0.08;    // 8 % du quart restant, soit 2 % en tout

  function objetTenu(e, h, force) {
    var t = W.PokeRegles && W.PokeRegles.tenus && W.PokeRegles.tenus();
    if (!t || !e.objets) return null;
    var a = e.objets[0] || null, b = e.objets[1] || null;
    if (!a && !b) return null;
    //  La rencontre fixe : l'objet 1, sans un jet.
    if (force) return a;
    if (!h) return a;
    if (h.brut() < OBJET_RIEN) return null;
    return h.brut() < OBJET_RARE ? b : a;
  }

  function creer(n, niveau, h, options) {
    var o = options || {};
    var e = ESP()[n];
    if (!e) throw new Error("Espèce inconnue : " + n);
    var p = {
      n: e.n,
      surnom: null,
      niveau: niveau,
      dv: o.dv || tirerDV(h),
      statExp: { pv: 0, atk: 0, def: 0, vit: 0, spe: 0 },
      exp: expTotalePour(e.croissance, niveau),
      attaques: o.attaques || attaquesAuNiveau(n, niveau),
      statut: null,      // "para" | "brulure" | "gel" | "sommeil" | "poison" | "poisonGrave"
      statutTours: 0,
      echange: !!o.echange, // un Pokémon reçu d'un échange gagne plus d'expérience
      capture: o.capture || null, // { zone, niveau } — lu par la fiche du Pokédex
      // ═══════════════════════════════════════════════════════════════════════
      //  🔴 CE QU'IL PORTE. En 1996, rien : la première génération n'a pas
      //     d'objets tenus, sa porte rend `null` et cette ligne pose `null`
      //     sans consommer un tirage. En 1999, soixante et une espèces
      //     arrivent avec quelque chose en main.
      //  ⚠️ ET LE TIRAGE N'EXISTE QUE LÀ-BAS. Le second emplacement est plus
      //     rare que le premier ; départager les deux demande un jet, et ce
      //     jet ne se consomme JAMAIS sous la première génération. C'est le
      //     seul endroit du moteur où les deux jeux de règles ne tirent pas le
      //     même nombre de fois, et il est écrit ici pour qu'on le sache.
      // ═══════════════════════════════════════════════════════════════════════
      objet: o.objet !== undefined ? o.objet : objetTenu(e, h, o.objetForce),
      nature: o.nature !== undefined ? o.nature : (o.genererNature && h && W.PokeNatures ? W.PokeNatures.tirer(h) : undefined),
    };
    p.stats = calculerStats(p);
    p.pv = p.stats.pv;
    return p;
  }

  // ── Gain d'expérience ──────────────────────────────────────────────────────
  //  Formule de génération 1 : (gain de base × niveau du vaincu) ÷ 7, divisé
  //  par le nombre de participants. 🔴 TOUS ceux qui ont combattu en gagnent —
  //  pas seulement le dernier sur le terrain. C'est la règle de l'époque, et
  //  elle est plus dure que le Multi-Exp moderne : il faut vraiment faire
  //  entrer un Pokémon pour l'élever.
  // 🔴 LE RYTHME D'ORIGINE NE TIENT PAS DANS UNE PARTIE DE 40 MINUTES.
  //    Mesuré le 07/08 : avec la formule brute, la politique optimale arrivait
  //    chez Pierre avec un Salamèche niveau 9 face à un Onix 14, et 0 % des
  //    voyages décrochaient un seul badge — le budget de jours s'épuisait dans
  //    l'entraînement. Un jeu Game Boy se joue sur trente heures ; ici la
  //    partie en dure moins d'une.
  //    On accélère donc l'expérience, et on l'écrit au lieu de la cacher. Ce
  //    facteur est LE réglage de rythme du mode : il se mesure sur 900 voyages
  //    (§20 du brief), il ne se devine pas.
  //
  //  ═══ 6 → 4,3, LE 15/08, ET C'EST UNE COMPENSATION ═══════════════════════
  //  🔴 L'AUDIT A RENDU AU JEU DEUX MULTIPLICATEURS DU CANON qui n'existaient
  //     pas : le combat de DRESSEUR vaut une fois et demie, et deux BADGES sur
  //     quatre (Foudre → Vitesse, Âme → Défense) ont enfin un effet. Mesuré,
  //     compte de vétéran, 548 voyages, mêmes graines :
  //       avant l'audit                17,2 % de badges · 10,6 % de Ligue
  //       corrections du canon, R=6    42,7 %            · 35,8 %
  //         · dont le bonus dresseur   14 points
  //         · dont les deux badges     11 points
  //       corrections + **R = 4,3**    20,8 %            · 14,2 %
  //  🔑 LA COMPENSATION VA DANS LE LEVIER QUI EXISTE POUR ÇA. Le canon ne se
  //     rabote pas pour tenir un chiffre d'équilibrage ; c'est ce facteur-ci —
  //     déjà déclaré hors canon, déjà là pour régler le rythme — qui absorbe.
  //     Raboter le ×1,5 aurait rendu les nœuds de dresseur équivalents aux
  //     herbes, c'est-à-dire supprimé une décision de carte.
  //  ⚠️ LA COURBE N'EST PAS MONOTONE : 4,0 rend 17,7 % et 4,6 rend 25,2 %,
  //     parce que le plafond de niveau de l'acte absorbe le surplus. On mesure
  //     le point, on ne l'interpole pas.
  //  ⚠️ Reste plus dur au premier acte qu'avant l'audit : 19 % contre 15 %.
  var RYTHME = 4.3;

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE MUR DE KOGA — LA COURBE, PAS LA CARTE (tranché le 09/08)
  //
  //  🔴 UN MULTIPLICATEUR PLAT NE PEUT PAS SERVIR UNE COURBE CUBIQUE. En
  //     première génération le coût d'un niveau croît comme n³ : passer de 29 à
  //     43 coûte 55 118 unités quand passer de 24 à 29 en coûte 10 565 — CINQ
  //     FOIS PLUS. Le gain, lui, croît linéairement avec le niveau du vaincu,
  //     et chaque acte offre le même contenu (~20 combats, mesuré). L'écart
  //     n'est donc pas un accident d'équilibrage : il est arithmétique, et il
  //     s'aggrave à chaque acte.
  //
  //  🔴 DEUX CORRECTIONS PAR LA CARTE ONT ÉTÉ MESURÉES ET REJETÉES : deux
  //     rangées de plus (aucun chiffre n'a bougé) et deux fois plus de
  //     dresseurs (3 % → 2 %). On ne rattrape pas un cube avec du contenu.
  //
  //  🔴 CE FACTEUR N'EST PAS DU CANON, ET C'EST ÉCRIT PLUS HAUT : `RYTHME`
  //     existe parce qu'un jeu de trente heures doit tenir en moins d'une.
  //     Il était plat ; il suit maintenant le PALIER, avec la même
  //     justification. Normalisé à 1 jusqu'au niveau 20 : le début du voyage
  //     va bien (78 % chez Pierre, 75 % chez Ondine) et on ne touche pas à ce
  //     qui marche.
  //
  //  ⚠️ L'EXPOSANT NE COMPENSE PAS TOUT LE CUBE, ET C'EST VOULU. À 2 il
  //     rendrait l'expérience constante par combat et effacerait la montée en
  //     tension du voyage. On rend une PARTIE de l'écart : l'acte 5 cesse
  //     d'être arithmétiquement infranchissable sans devenir gratuit.
  //
  //  Mesuré sur 300 voyages, arrivée devant Koga et victoires :
  //      plat (avant)   −2,1 niveau ·  3 %  · 8 badges : 0 %
  //      exposant 1,15  +0,4 niveau ·  6 %  · 8 badges : 2,1 %
  //      exposant 1,50  +1,7 niveau ·  8 %  · 8 badges : 2,5 %
  //  Retenu : 1,25, entre les deux mesures. Koga reste la porte la plus dure
  //  du voyage — c'est sa place de cinquième Champion — mais on l'aborde
  //  désormais À SON NIVEAU au lieu d'arriver en dessous.
  //  ⚠️ ET JE M'ARRÊTE DE RÉGLER ICI. Trois mesures suffisent à donner la
  //     DIRECTION ; affiner la quatrième décimale sur un simulateur qui joue
  //     mal, c'est exactement ce que la règle du projet interdit. La valeur
  //     définitive se décide sur une partie humaine.
  // ═══════════════════════════════════════════════════════════════════════════
  //  ⚠️ NOMMÉE `facteurNiveau` ET NON `facteurPalier` : `combat.js` exporte
  //     déjà un `facteurPalier`, celui des paliers de STATISTIQUE. Deux
  //     fonctions homonymes dans deux modules du même mode finissent par se
  //     confondre à la lecture — et le mode a déjà payé ce motif.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA BOSSE DE RATTRAPAGE (13/08) — LE RYTHME SUIT LE NIVEAU DU VAINCU
  //
  //  🔴 « ON PASSE DU LEVEL 5 À 9 EN UN COMBAT » (proprio, 13/08) — vérifié :
  //     Carapuce N.5 bat Chenipan N.7 → N.9. Le ×6 PLAT ne peut pas servir une
  //     courbe cubique : à bas niveau les niveaux ne coûtent presque rien, le
  //     plat les brade ; à haut niveau il suffit à peine (mur de Koga).
  //  ✅ Panel du 13/08 (3 designers × 3 lentilles, 4 candidats mesurés sur
  //     300 voyages × 2 politiques, mêmes graines) — gagnant : la BOSSE.
  //       N.5 → ×2,5 · N.8 → ×3,5 · N.14 → ×9,5 (rattrapage) · N.20 → ×6
  //       N.20+ → ×6·(n/20)^1,25 INCHANGÉ (mur de Koga, tranché le 09/08).
  //     Mesuré contre le témoin ×6 plat : premier combat 5→7 (au lieu de 5→9),
  //     mid conservé (15→17, seul candidat), plafond 65 % (bande 50-65 visée),
  //     Ligue 32,5 % (29,1 avant), plancher 14,6 % (meilleur du panel), morts
  //     optimal a1 12 / a2 10 / a6 8 % — l'early mord, la fin tient.
  //  ✅ ITÉRATION 2 (panel du 13/08 après-midi, signature unanime « la bosse
  //     adoucie ») : la montée 8→14 passe de linéaire à ((n−8)/6)^0,75 — la
  //     bosse arrive plus tôt et plus douce (+12,6 % à N.9), ce qui recentre
  //     le sommet (62,1 % dans la bande) et tient la Ligue à 32,5 % là où la
  //     montée linéaire relevée la faisait déborder (42,7 % mesurés). Va avec
  //     Koga à cinq Pokémon, ses 2 Hyper Potions et la dose 5 des sauvages —
  //     le config s'est mesuré ENSEMBLE, il se change ensemble.
  //  ⚠️ Continue aux trois coutures (3,5/6 à N.8 · 9,5/6 à N.14 · 1 à N.20) :
  //     une marche dans un facteur de gain se sent en jeu comme un mur invisible.
  // ═══════════════════════════════════════════════════════════════════════════
  var NIVEAU_NEUTRE = 20;
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA RAMPE CESSE DE MONTER À 42 — ET C'EST LA BASE QUI TRANCHE (16/08)
  //
  //  🔴 LES VRAIES PARTIES, ENFIN LUES. 133 voyages joués par 133 joueurs sur
  //     le serveur (table `daily`, `sport='poke'`) :
  //       0 badge   90 · 1 à 3 badges  26 · **4 à 7 badges  ZÉRO** · 8 badges 17
  //       et sur les 17 qui vont au bout, **17 ONT LEUR ÉQUIPE À NIVEAU 100.**
  //       Dix-sept sur dix-sept. Pas un à 95, pas un à 85.
  //     Ce n'est pas une queue de distribution, c'est un PLAFOND ATTEINT PAR
  //     TOUT LE MONDE : l'expérience était si abondante que franchir l'acte 4
  //     suffisait à finir le jeu. D'où les trois retours du même jour —
  //     « trop facile », « on gagne trop d'exp », « pas assez long ».
  //  🔴 ET LE HARNAIS NE POUVAIT PAS LE VOIR. Il annonçait 41 % de Ligue chez
  //     ceux qui l'atteignent ; le réel dit **94 %** (16 sur 17). Le simulateur
  //     joue beaucoup moins bien qu'un humain — le dossier l'avait déjà payé sur
  //     le mode ninja (0,8 % simulé contre 45,7 % réel). On mesure donc ICI la
  //     LONGUEUR et le NIVEAU ATTEINT, pas le taux de victoire.
  //
  //  🔴 LA COMPENSATION DU CUBE FINISSAIT PAR DÉPASSER LE CUBE. L'exposant 1,25
  //     a été posé le 09/08 pour que le gain suive le coût d'un niveau, qui
  //     croît en n³ (« le mur de Koga »). Il ne s'arrêtait jamais, et au-delà du
  //     niveau 45 il rendait la montée plus rapide que ce qu'un niveau coûte :
  //       N.20 ×4,3 · N.30 ×7,2 · N.40 ×10,2 · N.50 ×13,6 · N.60 ×17,0 · N.70 ×20,6
  //  ✅ LA RAMPE PLAFONNE AU LIEU DE S'INVERSER. Rien ne change jusqu'à
  //     `NIVEAU_PLEIN` — c'est toute la partie mesurée du 09/08 au 15/08, les
  //     deux murs compris, et c'est aussi là que 90 joueurs sur 133 s'arrêtent :
  //     on ne durcit pas le début. Au-delà, la rampe monte encore, mais
  //     doucement : on progresse, on ne double plus son avance à chaque acte.
  //  ⚠️ CONTINUE À LA COUTURE : à `NIVEAU_PLEIN` les deux branches valent la
  //     même chose. Une marche dans un facteur de gain se sent en jeu comme un
  //     mur invisible — règle déjà appliquée aux trois autres coutures.
  //  ⚠️ ON NE TOUCHE PAS À `RYTHME`. Il vaut 1 jusqu'au niveau 20 et porte tout
  //     le début du voyage ; le baisser aurait durci l'acte 1, là où les deux
  //     tiers des joueurs abandonnent déjà.
  // ═══════════════════════════════════════════════════════════════════════════
  var NIVEAU_PLEIN = 42;
  var PENTE_HAUTE = 0.35;
  function facteurNiveau(niveau) {
    if (!niveau) return 1;
    if (niveau <= 8) return (2.5 + (niveau - 5) / 3) / 6;
    if (niveau <= 14) return (3.5 + 6 * Math.pow((niveau - 8) / 6, 0.75)) / 6;
    if (niveau <= NIVEAU_NEUTRE) return (114 - 7 * (niveau - 14)) / 72;
    if (niveau <= NIVEAU_PLEIN) return Math.pow(niveau / NIVEAU_NEUTRE, 1.25);
    return Math.pow(NIVEAU_PLEIN / NIVEAU_NEUTRE, 1.25) *
      Math.pow(niveau / NIVEAU_PLEIN, PENTE_HAUTE);
  }

  // 🔴 `serments` est un MULTIPLICATEUR déjà composé et borné par
  //    `PokeSerments.effet()` — le Serment de la solitude le monte, celui de
  //    l'endurance le baisse. Il s'applique au gain PARTAGÉ, pas au brut :
  //    posé avant la division, un serment de moitié plus aurait rendu deux
  //    fois plus d'expérience à une équipe de deux qu'à une équipe de quatre,
  //    ce qui n'est pas ce que la carte annonce.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 DEUX MULTIPLICATEURS DU CANON MANQUAIENT, ET L'UN ÉTAIT MÊME ANNONCÉ.
  //   · **Le combat de DRESSEUR vaut une fois et demie** le combat sauvage en
  //     première génération. Aucun écart déclaré ne le mentionnait — le rythme
  //     l'est, celui-ci ne l'était pas : c'était un oubli, pas un choix.
  //   · **Un Pokémon ÉCHANGÉ gagne une fois et demie.** `creer()` posait
  //     `p.echange` avec le commentaire « gagne plus d'expérience » et cette
  //     fonction ne recevait même pas le Pokémon qui gagne : le drapeau était
  //     écrit, jamais lu. L'écran d'échange promettait donc un bonus inexistant.
  //  ⚠️ AUCUN TIRAGE : deux facteurs déterministes. Le rejeu ne bouge pas.
  // ═══════════════════════════════════════════════════════════════════════════
  function gainExperience(vaincu, participants, serments, opt) {
    var e = ESP()[vaincu.n];
    var brut = Math.floor((e.exp * vaincu.niveau * RYTHME * facteurNiveau(vaincu.niveau)) / 7);
    if (opt && opt.dresseur) brut = Math.floor(brut * 1.5);
    var part = Math.floor(brut / Math.max(1, participants));
    if (opt && opt.gagnant && opt.gagnant.echange) part = Math.floor(part * 1.5);
    if (serments && serments !== 1) part = Math.floor(part * serments);
    return Math.max(1, part);
  }

  // Le gain de « points d'effort » de l'époque : les statistiques de base du
  // Pokémon vaincu s'ajoutent à celles du vainqueur. Sans plafond par
  // statistique, avec un plafond global — c'est ce qui récompense l'élevage.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 « NaN / 19 » SUR UNE BARRE DE VIE, ET DES COMBATS QUI NE FINISSAIENT
  //     PLUS. Vu à l'écran sur un voyage de Johto, après une VICTOIRE — jamais
  //     avant. La cause tient en un nom : l'expérience de statistique garde une
  //     seule case « spé » (`statExp.spe`), comme le ROM, mais les statistiques
  //     de BASE de 1999 s'appellent `sat` et `sdf`. `b["spe"]` valait donc
  //     `undefined`, `0 + undefined` vaut NaN, et à partir de là toute la
  //     chaîne se contaminait : `calculerStats` rendait une Spéciale NaN, les
  //     dégâts devenaient NaN, les points de vie aussi. `NaN > 0` étant faux,
  //     la créature comptait pour morte sans jamais tomber.
  //
  //  🔑 ET AUCUN SIMULATEUR NE POUVAIT LE VOIR : ce versement n'est pas dans la
  //     boucle de combat, il est dans `distribuerExperience`, que seul l'écran
  //     appelle. Trois mille combats de Johto disaient « aucun plantage ».
  //     *Un instrument qui ne traverse pas la porte ne dit rien de ce qu'il y a
  //     derrière* — `poke-sim-gen2.mjs` la traverse désormais.
  //
  //  ✅ La case « spé » se nourrit de la Spéciale du vaincu, quel que soit le
  //     nom que son monde lui donne. Et ce qui ne correspond à AUCUNE
  //     statistique de base ne verse rien : mieux vaut un gain nul et vrai
  //     qu'un nombre qui n'en est pas un.
  // ═══════════════════════════════════════════════════════════════════════════
  function gagnerStatExp(p, vaincu) {
    var b = ESP()[vaincu.n].base;
    var k;
    for (k in p.statExp) {
      if (!Object.prototype.hasOwnProperty.call(p.statExp, k)) continue;
      var gain = b[k];
      if (gain === undefined && k === "spe") gain = b[SPE_ATK()];
      if (typeof gain !== "number") continue;
      p.statExp[k] = Math.min(65535, p.statExp[k] + gain);
    }
  }

  // Applique un gain d'expérience et rend la liste des événements qui en
  // découlent. 🔴 Le moteur ne DÉCIDE pas de l'évolution : il la SIGNALE.
  //    C'est l'interface qui la joue et qui laisse le joueur l'annuler — le
  //    bouton B du jeu d'origine. Un moteur qui évoluerait tout seul enlèverait
  //    un choix au joueur, et il mentirait au journal de rejeu.
  //  🔴 `plafond` EST OPTIONNEL, ET IL NE CHANGE RIEN QUAND IL EST ABSENT.
  //     C'est ce qui permet au Serment du Plafond d'exister sans toucher au
  //     voyage de tous les autres : sans lui, la borne reste 100 comme depuis
  //     le premier jour. Aucun tirage n'est consommé ici — le rejeu ne bouge
  //     pas d'un octet.
  //  ⚠️ L'expérience RENTRE quand même, seuls les niveaux s'arrêtent : le jour
  //     où le plafond monte (acte suivant), le Pokémon rattrape d'un coup ce
  //     qu'il avait accumulé. Bloquer l'expérience elle-même punirait deux fois.
  function appliquerExperience(p, gain, plafond) {
    var e = ESP()[p.n];
    var evenements = [];
    var borne = Math.min(100, plafond > 0 ? plafond : 100);
    p.exp += gain;
    var vise = niveauPourExp(e.croissance, p.exp);
    while (p.niveau < vise && p.niveau < borne) {
      p.niveau++;
      var avant = p.stats;
      p.stats = calculerStats(p);
      // Le gain de PV maximum se répercute sur les PV courants : monter d'un
      // niveau ne soigne pas, mais ne doit pas non plus laisser un Pokémon
      // au-dessus de son maximum.
      p.pv = Math.min(p.stats.pv, p.pv + (p.stats.pv - avant.pv));
      evenements.push({ type: "niveau", niveau: p.niveau, avant: avant, apres: p.stats });

      var app = e.apprend || [];
      for (var i = 0; i < app.length; i++) {
        //  🔴 PAS D'ANNONCE POUR UNE ATTAQUE DÉJÀ SUE (12/08, signalement de
        //     Tatsu) : un compagnon repris d'un voyage précédent arrive avec
        //     les quatre dernières attaques de son niveau — atteindre le
        //     palier de la table lui refaisait « apprendre » Flammèche qu'il
        //     avait au départ. `apprendre()` refusait le doublon, mais le
        //     message partait quand même — et à quatre attaques, l'écran
        //     aurait demandé d'en oublier une pour rien. Même garde que
        //     `faireEvoluer` juste en dessous.
        if (app[i][0] === p.niveau && !aLAttaque(p, app[i][1])) {
          evenements.push({ type: "attaque", attaque: app[i][1] });
        }
      }
      var ev = evolutionParNiveau(p);
      // ⚠️ UNE SEULE proposition d'évolution par lot : deux niveaux gagnés
      //    d'un coup en poussaient deux, et l'écran se rejouait sur un Pokémon
      //    déjà évolué. Aucun tirage ici — le rejeu ne bouge pas.
      if (ev && !evenements.some(function (x) { return x.type === "evolution"; })) {
        evenements.push({ type: "evolution", vers: ev.vers });
      }
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 [22/08] L'ÉVOLUTION PAR BONHEUR N'ÉTAIT BRANCHÉE NULLE PART
      // -------------------------------------------------------------------
      //  Trois joueurs le même jour. lo1845 : « Toujours pas de réponse pour
      //  l'évolution au bonheur ?! Évoli, Togepi ou Nosferalto ? » Chris :
      //  « toujours pas ». Rayhane, capture à l'appui, en déduisait que les
      //  autres évolutions d'Évoli n'étaient « pas liées à Évoli pour le
      //  moment ».
      //  Ils avaient raison : `evolutionsParBonheur` était écrite, exportée
      //  et appelée par PERSONNE. Sept lignes de Johto ne pouvaient pas
      //  évoluer — Nosferapti, Leveinard, Évoli, Pichu, Mélo, Toudoudou,
      //  Togepi.
      //  🔑 LA CLASSE, PAS LE CAS : une règle écrite jamais appelée. Le
      //     compte d'espèces atteignables, lui, propageait DÉJÀ ces
      //     évolutions — le Pokédex promettait donc des espèces que le jeu
      //     ne savait pas donner.
      //  ⚠️ APRÈS le niveau et sous la MÊME règle : une seule proposition
      //     d'évolution par lot. Un Pichu qui monte ET a de quoi évoluer ne
      //     reçoit pas deux écrans.
      //  ⚠️ ZÉRO TIRAGE : le bonheur se lit sur les statExp accumulées.
      //  🔴 LES DEUX VOIES D'ÉVOLI VOYAGENT ENSEMBLE (`voies`). Le mode n'a
      //     pas d'horloge : Mentali le jour et Noctali la nuit ne peuvent
      //     pas se trancher ici. On pousse les deux, et l'écran fait choisir
      //     — en choisir une en silence serait le vrai défaut.
      // ═══════════════════════════════════════════════════════════════════
      if (!evenements.some(function (x) { return x.type === "evolution"; })) {
        var parB = evolutionsParBonheur(p);
        if (parB.length) {
          evenements.push({
            type: "evolution", vers: parB[0].vers,
            voies: parB.map(function (x) { return { vers: x.vers, moment: x.moment || null }; }),
          });
        }
      }
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 [24/08] L'ÉVOLUTION PAR STATISTIQUE N'ÉTAIT BRANCHÉE NULLE PART
      // -------------------------------------------------------------------
      //  lo1845, le 22/08 : « Débugant n'évolue pas niveau 20. Bug ? »
      //  Oui. Sa fiche est pourtant juste — `atk<def → Tygnon`,
      //  `atk>def → Kicklee`, `atk=def → Kapoera`, niveau 20 — et
      //  `evolutionParStat` est écrite trente lignes plus haut, exportée
      //  comme les autres. Elle n'était appelée par PERSONNE.
      //  🔑 EXACTEMENT LA FAUTE DU 22/08, À QUINZE LIGNES D'ICI : le bonheur
      //     a été rebranché ce jour-là, la statistique est restée morte. Une
      //     règle écrite jamais appelée ne se voit pas — le Pokédex, lui,
      //     comptait déjà les trois formes comme atteignables.
      //  ⚠️ APRÈS le niveau et le bonheur, sous la MÊME règle : une seule
      //     proposition d'évolution par lot.
      //  ⚠️ ZÉRO TIRAGE — la comparaison se lit sur les statistiques
      //     dérivées, déjà calculées. Le rejeu ne bouge pas d'un pas.
      // ═══════════════════════════════════════════════════════════════════
      if (!evenements.some(function (x) { return x.type === "evolution"; })) {
        var parS = evolutionParStat(p);
        if (parS) evenements.push({ type: "evolution", vers: parS.vers });
      }
    }
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 [17/08, rapport de Poltron_sofa/Amex] LE PLAFOND ARRÊTAIT LA MONTÉE
    //     SANS UN MOT. « Mes pokémon dans le défi du jour s'atteignaient au
    //     level 72, j'ai probablement pris un malus mais… JE NE SAIS PAS. »
    //     Il ne pouvait pas savoir : l'expérience rentrait, le niveau ne
    //     bougeait plus, et la boucle ci-dessus sortait en silence. La règle
    //     existe — c'est le plafond de l'acte, écrit le 16/08 pour empêcher le
    //     70 → 100 en cinq combats — mais elle ne se disait QUE sur l'écran du
    //     PC, que personne n'ouvre en plein défi.
    //  🔑 LE MOTEUR CONSTATE, L'ÉCRAN DÉCIDE DE LE DIRE. On pousse un fait :
    //     « il y avait de quoi monter, le plafond l'a retenu ». C'est à l'écran
    //     de ne pas le répéter à chaque combat — voir `ecranMontees`.
    //  ⚠️ ZÉRO TIRAGE, et l'événement ne modifie RIEN : c'est une observation
    //     sur deux nombres déjà calculés.
    if (vise > p.niveau && p.niveau >= borne) {
      evenements.push({ type: "plafond", niveau: borne });
    }
    return evenements;
  }

  function evolutionParNiveau(p) {
    var e = ESP()[p.n];
    for (var i = 0; i < (e.evolue || []).length; i++) {
      var ev = e.evolue[i];
      if (ev.par === "niveau" && p.niveau >= ev.niveau) return ev;
    }
    return null;
  }

  function evolutionParPierre(p, objet) {
    var e = ESP()[p.n];
    for (var i = 0; i < (e.evolue || []).length; i++) {
      var ev = e.evolue[i];
      if (ev.par === "pierre" && ev.objet === objet) return ev;
    }
    return null;
  }

  function evolutionParEchange(p) {
    var e = ESP()[p.n];
    for (var i = 0; i < (e.evolue || []).length; i++) {
      if (e.evolue[i].par === "echange") return e.evolue[i];
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉVOLUTION PAR LA COMPARAISON ATTAQUE / DÉFENSE  [19/08/2026]
  //
  //  Trois espèces seulement, et c'est toujours Debugant : au niveau 20 il
  //  devient Kicklee si sa Défense l'emporte, Tygnon si son Attaque l'emporte,
  //  Kapoera à égalité.
  //
  //  🔑 RIEN À INVENTER, RIEN À STOCKER. La comparaison porte sur des
  //     statistiques que le Pokémon a DÉJÀ — ses valeurs déterminantes et son
  //     expérience de stat les ont écartées depuis sa capture. C'est donc du
  //     pur calcul, sans tirage, et le rejeu ne bouge pas d'un pas.
  //  ⚠️ ON LIT LES STATISTIQUES DÉRIVÉES, pas les bases : deux Debugant de
  //     même espèce n'ont pas la même Attaque, et c'est précisément ce que
  //     cette évolution récompense. Lire les bases donnerait la même issue à
  //     tout le monde — une évolution à trois branches dont une seule sort.
  // ═══════════════════════════════════════════════════════════════════════════
  function evolutionParStat(p) {
    var e = ESP()[p.n];
    var comp = p.stats.atk < p.stats.def ? "atk<def"
             : p.stats.atk > p.stats.def ? "atk>def" : "atk=def";
    for (var i = 0; i < (e.evolue || []).length; i++) {
      var ev = e.evolue[i];
      if (ev.par === "stat" && p.niveau >= ev.niveau && ev.compare === comp) return ev;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ÉVOLUTION PAR LE BONHEUR — CE QUE CE MODE PEUT EN DIRE  [19/08/2026]
  //
  //  🔴 LA GÉNÉRATION 2 COMPTE UN BONHEUR DE 0 À 255 qui monte en marchant, en
  //     combattant, chez le toiletteur, et retombe à chaque K.O. Ce mode-ci se
  //     joue en quarante minutes, sans pas et sans ville à traverser : porter
  //     ce compteur tel quel donnerait une jauge que personne n'atteindrait,
  //     donc huit espèces écrites et jamais montrées — la classe de défaut
  //     n°1 du dossier.
  //
  //  🔑 ON NE FABRIQUE PAS UN COMPTEUR DE PLUS. Le mode en tient déjà un qui
  //     dit exactement la même chose : l'EXPÉRIENCE DE STAT ne monte que
  //     lorsqu'un Pokémon a COMBATTU à tes côtés. « Il t'a suivi longtemps »
  //     et « il a beaucoup combattu avec toi » sont la même phrase ici. Aucun
  //     champ neuf, aucun tirage, rien à sauvegarder de plus, et une
  //     sauvegarde d'avant reste lisible.
  //
  //  ⚠️ LE SEUIL EST UN CHOIX, ET IL S'ANNONCE. 1 500 points cumulés, c'est
  //     l'ordre de grandeur d'une dizaine de combats gagnés à ce niveau : un
  //     compagnon de route, pas un Pokémon qu'on vient d'attraper. Il se règle
  //     à la mesure, comme tout le reste du mode.
  //
  //  🔴 LE MOMENT DE LA JOURNÉE N'EST PAS MODÉLISÉ, ET ON NE L'INVENTE PAS.
  //     Évoli devient Mentali le jour et Noctali la nuit ; ce mode n'a pas
  //     d'horloge. Cette fonction rend donc TOUTES les issues possibles et
  //     laisse l'écran trancher — c'est déjà l'idiome du mode (« Choisis ton
  //     chemin. L'autre sera perdu. »), et ça rend les deux atteignables au
  //     lieu d'en condamner une. Un défaut de ce mode serait d'en choisir une
  //     en silence.
  // ═══════════════════════════════════════════════════════════════════════════
  var BONHEUR_SEUIL = 1500;

  function bonheurDe(p) {
    var e = p.statExp || {};
    var t = 0;
    for (var k in e) if (typeof e[k] === "number") t += e[k];
    return t;
  }

  function evolutionsParBonheur(p) {
    var e = ESP()[p.n];
    var out = [];
    if (bonheurDe(p) < BONHEUR_SEUIL) return out;
    for (var i = 0; i < (e.evolue || []).length; i++) {
      if (e.evolue[i].par === "bonheur") out.push(e.evolue[i]);
    }
    return out;
  }

  // 🔴 L'ÉVOLUTION EST UN CHANGEMENT D'ÉTAT, ET ELLE DOIT SE POSER.
  //    C'est exactement la classe de défaut la plus fréquente du projet : un
  //    texte qui annonce « il évolue » sans que rien ne change. Ici, la seule
  //    façon d'évoluer est d'appeler cette fonction, et elle recalcule tout.
  function faireEvoluer(p, vers) {
    var avant = p.n;
    p.n = vers;
    var e = ESP()[vers];
    p.exp = Math.max(p.exp, expTotalePour(e.croissance, p.niveau));
    var maxAvant = p.stats.pv;
    p.stats = calculerStats(p);
    p.pv = Math.min(p.stats.pv, p.pv + (p.stats.pv - maxAvant));
    // Une évolution peut débloquer une attaque apprise au niveau courant.
    var nouvelles = [];
    var app = e.apprend || [];
    for (var i = 0; i < app.length; i++) {
      if (app[i][0] === 1 && !aLAttaque(p, app[i][1])) nouvelles.push(app[i][1]);
    }
    return { de: avant, vers: vers, attaques: nouvelles };
  }

  function aLAttaque(p, cle) {
    for (var i = 0; i < p.attaques.length; i++) if (p.attaques[i].cle === cle) return true;
    return false;
  }

  // Apprendre une attaque. Rend `true` si elle est entrée, `false` si l'équipe
  // d'attaques est pleine — auquel cas c'est au joueur de choisir laquelle
  // oublier. 🔴 Le moteur n'oublie JAMAIS à la place du joueur.
  function apprendre(p, cle, remplace) {
    if (aLAttaque(p, cle)) return false;
    var a = ATT()[cle];
    if (!a) throw new Error("Attaque inconnue : " + cle);
    var entree = { cle: cle, pp: a.pp, ppMax: a.pp };
    if (typeof remplace === "number" && p.attaques[remplace]) { p.attaques[remplace] = entree; return true; }
    if (p.attaques.length < 4) { p.attaques.push(entree); return true; }
    return false;
  }

  function soigner(p) {
    p.pv = p.stats.pv;
    p.statut = null;
    p.statutTours = 0;
    for (var i = 0; i < p.attaques.length; i++) p.attaques[i].pp = p.attaques[i].ppMax;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  QUI TOUCHE COMBIEN — LA PORTE UNIQUE DE LA DISTRIBUTION D'EXPÉRIENCE
  //
  //  🔴 ELLE EXISTAIT EN DEUX EXEMPLAIRES, ET ILS AVAIENT DIVERGÉ. L'écran de
  //     combat appliquait le Multi Exp. et les serments ; le harnais de mesure,
  //     lui, avait sa propre boucle et les ignorait tous les deux. Coût réel,
  //     payé le 09/08 : j'ai forcé la politique à toujours prendre le Multi
  //     Exp., mesuré « la médiane ne bouge pas », et failli en conclure que le
  //     remède canon ne servait à rien — alors qu'il n'était **jamais
  //     appliqué**. Une mesure faite sur une copie divergente ne mesure pas le
  //     jeu ; elle allait pourtant décider d'un changement d'équilibre.
  //
  //  🔴 LA RÈGLE COMPLÈTE VIT DONC ICI, ET NULLE PART AILLEURS :
  //     · les combattants touchent leur part, divisée par leur nombre ;
  //     · sous le Multi Exp., ils la gardent ENTIÈRE, et chaque autre Pokémon
  //       debout touche la MOITIÉ d'un combat ;
  //     · sous le Serment de la troupe, chacun touche la part ENTIÈRE, et le
  //       prix est déjà payé en amont par `expGain`.
  //  ⚠️ UN COMBATTANT NE TOUCHE JAMAIS DEUX FOIS. Sans ce garde, le porteur
  //     monterait deux fois plus vite que les passagers et le partage
  //     aggraverait exactement le défaut qu'il corrige.
  //
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 LE MULTI EXP. ÉTAIT UN PIÈGE, ET C'EST MESURÉ (09/08, 150 voyages en
  //     politique compétente)
  //
  //     La règle de 1996, appliquée à la lettre, faisait ceci : le combattant
  //     perdait la MOITIÉ de son expérience, et l'autre moitié se divisait entre
  //     les six Pokémon debout — un DOUZIÈME chacun. Le total est conservé, mais
  //     le coût d'un niveau croît comme le CUBE : répartir la même expérience
  //     sur six ne donne pas six Pokémon au niveau L, il en donne six au niveau
  //     L divisé par la racine cubique de six, c'est-à-dire L / 1,8.
  //
  //     Ce que la mesure a rendu, à chaque arène, sans exception :
  //       · tête d'équipe 49, MÉDIANE 24, Champion 43 ;
  //       · « à la hauteur : 0,9 Pokémon sur 5,9 ».
  //     Un porteur, cinq passagers — à l'arène 1 comme à l'arène 8. Et la carte
  //     est prise dans 87 % des voyages, dès l'acte 4 : elle est donc là, elle
  //     est choisie, et elle ne change rien. Pire, elle COÛTE — le seul Pokémon
  //     qui pouvait gagner grandit deux fois moins vite.
  //
  //  🔴 ET ELLE REND INJOUABLE LE CONSEIL QUE LE JEU DONNE LUI-MÊME. L'écran
  //     d'arène annonce « son équipe craint : INSECTE — 4 sur 4 ». Suivre ce
  //     conseil demande un deuxième Pokémon AU NIVEAU ; l'économie d'expérience
  //     du mode le rend impossible. Mesuré : une réponse de type fait passer les
  //     victoires de 48 % à 57 % seulement, parce que la réponse arrive trente
  //     niveaux trop bas et tombe au premier coup.
  //     *Un jeu qui donne un conseil qu'il empêche de suivre punit celui qui
  //     l'écoute.*
  //
  //  ✅ LA CARTE FAIT DONC CE QU'ELLE PROMET : le combattant garde tout, et
  //     chaque autre touche la moitié d'un combat. C'est l'Exp. Share moderne,
  //     et c'est un écart au canon ASSUMÉ — le troisième du mode, après Spectre
  //     contre Psy et la Master Ball unique. Il est porté par un OBJET que le
  //     joueur choisit de prendre : qui veut la règle de 1996 ne prend pas la
  //     carte.
  //  ⚠️ L'écart se paie ailleurs et c'est voulu : les Sceaux, les serments et le
  //     Nuzlocke restent la source de dureté. On rend possible la LARGEUR
  //     d'équipe, on ne rend pas le jeu facile — et la mesure d'après le dit.
  //
  //  ⚠️ ELLE NE TIRE RIEN AU SORT et ne connaît ni l'écran ni le harnais : elle
  //     REND la liste des suites (montée, attaque apprise, évolution) et laisse
  //     chaque appelant en faire ce qu'il veut — une animation d'un côté, une
  //     application directe de l'autre. C'est ce qui permet à la règle d'être
  //     partagée sans que le noyau apprenne à dessiner.
  // ═══════════════════════════════════════════════════════════════════════════
  function distribuerExperience(partie, participants, adverse, options) {
    var o = options || {};
    var gain = o.expGain || 1;
    var troupe = !!o.expPartage;
    var expAll = !!o.expAll;
    var plafond = o.plafond || 0;
    // Le combat de dresseur vaut une fois et demie — voir `gainExperience`.
    var contexte = { dresseur: !!o.dresseur };
    var partage = troupe || expAll;
    var suites = [];
    var k, i;

    var nb = 0;
    for (k in participants) nb++;
    if (!nb) return suites;

    for (k in participants) {
      var mon = partie.equipe[+k];
      if (!mon || mon.pv <= 0) continue;
      for (i = 0; i < adverse.length; i++) {
        gagnerStatExp(mon, adverse[i]);
        var brut = gainExperience(adverse[i], nb, gain, { dresseur: contexte.dresseur, gagnant: mon });
        var ev = appliquerExperience(mon, brut, plafond);
        for (var s = 0; s < ev.length; s++) suites.push({ mon: mon, index: +k, ev: ev[s] });
      }
    }

    if (!partage) return suites;

    var reserve = [];
    for (var q = 0; q < partie.equipe.length; q++) {
      if (partie.equipe[q] && partie.equipe[q].pv > 0) reserve.push(q);
    }
    for (var r = 0; r < reserve.length; r++) {
      var idx = reserve[r];
      // Qui a combattu a déjà touché sa part : il ne repasse pas au partage.
      if (participants[idx]) continue;
      var autre = partie.equipe[idx];
      for (i = 0; i < adverse.length; i++) {
        var plein = gainExperience(adverse[i], 1, gain, { dresseur: contexte.dresseur, gagnant: autre });
        var don = troupe ? plein : Math.floor(plein / 2);
        var ev2 = appliquerExperience(autre, Math.max(1, don), plafond);
        for (var t = 0; t < ev2.length; t++) suites.push({ mon: autre, index: idx, ev: ev2[t] });
      }
    }
    return suites;
  }

  // 🔴 UN POKÉMON HISSÉ ÉVOLUE AVEC SON NIVEAU (rapport testeur Zalfior,
  //    13/08 : « le Carapuce de Tatsu n'a pas évolué alors qu'il est level
  //    23 »). Les hissages — rival ancré, dresseurs et Rocket montés au visé —
  //    montaient le NIVEAU en gardant l'ESPÈCE du canon : un Carapuce N.23 est
  //    une absurdité que le ROM ne produit jamais (ses tables tardives portent
  //    Carabaffe). On suit la chaîne d'évolution PAR NIVEAU ; pierre et
  //    échange ne dépendent pas du niveau et ne se déduisent pas — on ne les
  //    invente pas. Aucun tirage : pur calcul, le rejeu ne bouge pas.
  function especeAuNiveau(n, niveau) {
    var e = ESP()[n];
    if (!e) return n;
    for (var i = 0; i < (e.evolue || []).length; i++) {
      var ev = e.evolue[i];
      if (ev.par === "niveau" && niveau >= ev.niveau) {
        return especeAuNiveau(ev.vers, niveau);
      }
      // 🔴 ET PAR COMPARAISON ATTAQUE/DÉFENSE, qui dépend aussi du niveau : un
      //    Debugant de dresseur au niveau 25 est un Kicklee, un Tygnon ou un
      //    Kapoera, jamais un Debugant. Le ROM ne produit pas cette absurdité.
      //  ⚠️ ON LIT LES BASES, pas les dérivées : cette fonction répond « quelle
      //     espèce, à ce niveau ? » avant qu'aucune créature n'existe. Chez le
      //     JOUEUR, la porte par statistique lit les valeurs réelles — deux
      //     questions différentes, deux lectures différentes, et c'est voulu.
      if (ev.par === "stat" && niveau >= ev.niveau) {
        var b = e.base || {};
        var c = b.atk < b.def ? "atk<def" : b.atk > b.def ? "atk>def" : "atk=def";
        if (ev.compare === c) return especeAuNiveau(ev.vers, niveau);
      }
    }
    return n;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ÉCRIRE DES POINTS DE VIE — UNE SEULE PORTE, ET ELLE REFUSE LE NON-NOMBRE
  //
  //  🔴 « NaN / 19 » A ÉTÉ VU DEUX FOIS SUR UNE BARRE DE VIE, à deux causes
  //     différentes, et chaque fois le mode s'est tu : `NaN > 0` est faux, donc
  //     la créature comptait pour morte, donc le combat se terminait, donc
  //     aucun simulateur n'avait rien à dire. Le seul endroit d'où ça se voyait
  //     était l'écran — l'endroit le plus cher.
  //
  //  🔑 ON NE RÉPARE PAS EN SILENCE, ON NOMME. Cette porte borne la valeur
  //     comme avant ET, quand ce qu'on lui donne n'est pas un nombre, elle
  //     inscrit l'incident sur la créature : quel endroit du moteur a écrit
  //     quoi. Un simulateur peut alors le lire et tomber, au lieu de conclure
  //     « aucun plantage » sur une partie qui n'avance plus.
  //     *Un contrôle doit dire la cause, pas seulement qu'il y a un problème.*
  //
  //  ⚠️ ELLE NE CHANGE RIEN QUAND TOUT VA BIEN : même bornage, même valeur, à
  //     l'octet — les cent quatre-vingt-deux tours du simulateur de référence
  //     sortent identiques.
  // ═══════════════════════════════════════════════════════════════════════════
  var PV_INCOHERENTS = [];
  function poserPv(p, v, ou) {
    var max = p && p.stats ? p.stats.pv : NaN;
    if (typeof v !== "number" || v !== v || typeof max !== "number" || max !== max) {
      // 🔑 ON CAPTURE LA PILE, ET SEULEMENT ICI. Nommer l'étape (« encaisser »)
      //    dit où l'on écrit, pas d'où vient le nombre — et c'est la seule
      //    question qui compte. Le coût ne se paie que sur l'incident, jamais
      //    sur un tour normal.
      var pile = "";
      try { pile = (new Error().stack || "").split(String.fromCharCode(10)).slice(2, 6).join(" | "); } catch (e2) { /* moteur sans pile */ }
      var incident = { n: p && p.n, ou: ou, valeur: String(v), max: String(max), pile: pile };
      PV_INCOHERENTS.push(incident);
      if (PV_INCOHERENTS.length > 50) PV_INCOHERENTS.shift();
      p.pvIncoherent = incident;
      // On garde la dernière valeur SAINE plutôt que d'écrire un non-nombre :
      // la partie continue, et l'incident se lit au lieu de se propager.
      if (typeof p.pv !== "number" || p.pv !== p.pv) p.pv = 0;
      return p.pv;
    }
    p.pv = Math.max(0, Math.min(max, v));
    return p.pv;
  }

  var Moteur = {
    poserPv: poserPv,
    pvIncoherents: function () { return PV_INCOHERENTS.slice(); },
    pvIncoherentsRaz: function () { PV_INCOHERENTS.length = 0; },
    RYTHME: RYTHME,
    especeAuNiveau: especeAuNiveau,
    distribuerExperience: distribuerExperience,
    expTotalePour: expTotalePour,
    niveauPourExp: niveauPourExp,
    calculerStats: calculerStats,
    tirerDV: tirerDV,
    attaquesAuNiveau: attaquesAuNiveau,
    creer: creer,
    gainExperience: gainExperience,
    gagnerStatExp: gagnerStatExp,
    appliquerExperience: appliquerExperience,
    evolutionParNiveau: evolutionParNiveau,
    evolutionParPierre: evolutionParPierre,
    evolutionParEchange: evolutionParEchange,
    // Les deux méthodes de la seconde génération. Elles sont exportées même
    // sous la gen 1 : aucune espèce de 1996 ne les porte, elles ne rendent
    // donc jamais rien — et une porte qui existe se branche, une porte qui
    // n'existe pas se réinvente.
    evolutionParStat: evolutionParStat,
    evolutionsParBonheur: evolutionsParBonheur,
    bonheurDe: bonheurDe,
    BONHEUR_SEUIL: BONHEUR_SEUIL,
    faireEvoluer: faireEvoluer,
    apprendre: apprendre,
    aLAttaque: aLAttaque,
    soigner: soigner,
  };

  W.PokeMoteur = Moteur;
})(typeof window !== "undefined" ? window : globalThis);
