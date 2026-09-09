(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LES ACQUIS — CE QUE LE VOYAGE T'APPREND ET QUI NE SE PERD PLUS
  //
  //  🔴 LE PILIER QUI MANQUAIT AU MODE : RIEN NE S'EMPILAIT. Relevé le 09/08 en
  //     regardant la boucle en face. Le butin donne des CONSOMMABLES — on les
  //     dépense et il n'en reste rien. Les serments sont des COÛTS imposés, trois
  //     offerts, aucun refusable. Les sceaux sont MÉTA, ils ne bougent pas
  //     pendant la partie. Les chasses se jugent au bilan, après.
  //     Résultat : deux voyages joués à la suite se ressemblent. Aucun ne prend
  //     d'identité, parce que rien n'est ACQUIS en chemin.
  //
  //     C'est le pilier que tous les roguelites qui tiennent ont en commun, et
  //     c'est le seul que le mode n'avait pas : un gain PERMANENT, CHOISI, qui
  //     se CUMULE, et autour duquel on se met à jouer différemment.
  //
  //  🔴 IL EST LE PENDANT EXACT DU SERMENT, ET C'EST VOULU.
  //       · le SERMENT est le PRIX du badge — imposé, on ne le refuse pas ;
  //       · l'ACQUIS est un GAIN du voyage — choisi, on renonce à deux autres.
  //     Les deux se composent par la même porte, donc ils se contredisent et se
  //     renforcent sans qu'aucun code ne les arbitre : un acquis qui double
  //     l'argent et un serment qui le divise se rencontrent, et c'est le joueur
  //     qui aura fabriqué la rencontre.
  //
  //  🔴 AUCUNE CLÉ NEUVE, ET C'EST LA CONDITION POUR QU'IL VIVE. Chaque acquis
  //     pousse les clés que les serments et les sceaux poussent déjà —
  //     `degatsInfliges`, `capture`, `argent`, `butinChoix`, `critBonus`… Le
  //     combat, le butin, la capture et l'expérience les lisent depuis toujours.
  //     *Une mécanique branchée sur une porte existante ne peut pas avoir de
  //     branche morte* — c'est la doctrine des sceaux, et elle a tenu.
  //
  //  ⚠️ LES NOMS SONT CEUX DU MONDE, PAS DES ÉTIQUETTES DE STATISTIQUE. « Le
  //     coup d'œil du pêcheur » se retient ; « capture ×1,3 » se lit une fois et
  //     s'oublie. La phrase, elle, dit le chiffre — c'est la règle du mode : on
  //     ne cache pas ce qu'on fait.
  //  ⚠️ UN ACQUIS NE SE REPREND PAS DEUX FOIS. `utile` refuse celui qu'on porte
  //     déjà : une carte sans effet dans un choix à trois vole une option.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── LA LISTE ───────────────────────────────────────────────────────────────
  //  Chaque acquis tient en une phrase et pousse une clé, deux au plus. Un
  //  acquis qui en pousse cinq ne se raconte pas, et ce qui ne se raconte pas ne
  //  se choisit pas.
  //
  //  🔴 ET AUCUN N'EST GRATUIT AU-DELÀ DU PREMIER PALIER. Les plus forts portent
  //     leur contrepartie DANS l'acquis : c'est ce qui les rend choisissables
  //     contre un petit acquis sans prix, au lieu d'être des évidences.
  var LISTE = [
    // ── Ceux qui répondent à la famine mesurée ────────────────────────────
    //  🔴 45 chasses au légendaire sur 61 finissent SANS UNE SEULE BALL, et
    //     l'argent médian ne suit pas les Hyper Balls à 1 200 ₽. Deux acquis
    //     répondent à ça, et c'est délibéré : une profondeur qui ne répare rien
    //     n'est qu'un chiffre de plus.
    {
      id: "bourse",
      nom: { fr: "La bourse tenue", en: "A tight purse" },
      dit: { fr: "L'argent rentre moitié plus. Une carte de butin de plus.",
             en: "Money comes in half again. One more loot card." },
      effet: { argent: 1.5, butinChoix: 1 },
    },
    {
      id: "poignet",
      nom: { fr: "Le poignet du lanceur", en: "The thrower's wrist" },
      dit: { fr: "Tes Poké Balls tiennent un tiers mieux. Un peu plus de coups critiques.",
             en: "Your Poké Balls hold a third better. A few more critical hits." },
      effet: { capture: 1.33, critBonus: 0.08 },
    },
    // ── Ceux qui changent la façon de se battre ───────────────────────────
    {
      id: "oeil",
      nom: { fr: "L'œil du dresseur", en: "The trainer's eye" },
      dit: { fr: "Un coup critique sur dix de plus.", en: "One more critical hit in ten." },
      effet: { critBonus: 0.1 },
    },
    {
      id: "garde",
      nom: { fr: "La garde haute", en: "Guard up" },
      // 🔴 « Tu encaisses un huitième de moins » A ÉTÉ LU COMME UN MALUS, par
      //    deux joueurs le 16/08. L'un a compris « tu n'encaisses QUE un
      //    huitième » ; l'autre a rangé la carte entière dans les pénalités et
      //    ouvert un rapport de bug. L'élision est la faute : « un huitième »
      //    n'est rattaché à rien, donc chacun lui attribue ce qu'il veut. On
      //    nomme ce qui baisse — les DÉGÂTS — et l'ambiguïté disparaît.
      dit: { fr: "Tu prends un huitième de dégâts en moins.",
             en: "You take an eighth less damage." },
      effet: { degatsSubis: 0.88 },
    },
    {
      id: "poigne",
      nom: { fr: "La poigne", en: "The grip" },
      dit: { fr: "Tu frappes un cinquième plus fort. En échange, tu encaisses un dixième de plus.",
             en: "You hit a fifth harder. In return, you take a tenth more." },
      effet: { degatsInfliges: 1.2, degatsSubis: 1.1 },
    },
    // ── Ceux qui changent ce qu'on ramasse ────────────────────────────────
    {
      id: "flair",
      nom: { fr: "Le flair", en: "A nose for it" },
      dit: { fr: "Une carte de butin de plus à chaque fois.", en: "One more loot card each time." },
      effet: { butinChoix: 1 },
    },
    {
      id: "carnet",
      nom: { fr: "Le carnet tenu", en: "A kept notebook" },
      dit: { fr: "L'expérience monte d'un quart. En échange, l'argent baisse d'un cinquième.",
             en: "Experience rises by a quarter. In return, money drops by a fifth." },
      effet: { expGain: 1.25, argent: 0.8 },
    },
    // ── Ceux qui répondent au mur mesuré ──────────────────────────────────
    //  🔴 MORGANE N'A AUCUNE RÉPONSE POSSIBLE EN CAPSULE : sa faiblesse est
    //     INSECTE, et la première génération ne contient pas une seule CT
    //     Insecte. Un joueur qui suit le conseil du jeu ne peut pas l'appliquer.
    //     Celui-ci lui rend une prise sur ce mur — non pas en baissant Morgane,
    //     mais en payant le niveau qu'il faut pour passer sans réponse de type.
    {
      id: "acharnement",
      nom: { fr: "L'acharnement", en: "Doggedness" },
      dit: { fr: "L'expérience monte d'un quart. En échange, une carte de butin de moins.",
             en: "Experience rises by a quarter. In return, one fewer loot card." },
      effet: { expGain: 1.25, butinChoix: -1 },
    },
    // ── Celui qui échange la sécurité contre la vitesse ───────────────────
    //  🔴 IL SE HEURTE AUX QUATRE SERMENTS QUI INTERDISENT LE SOIN. Porter
    //     « Le pas de course » sous un serment d'audace, c'est renoncer au sac
    //     ET au Centre : le voyage devient une course où chaque combat compte.
    //     C'est le joueur qui aura fabriqué cette rencontre — personne ne
    //     l'arbitre, et c'est tout le dessin du système.
    //  ⚠️ Le prix est DANS l'acquis, et il est lourd : le Centre est la seule
    //     réparation gratuite du mode. L'échanger contre de l'expérience n'a de
    //     sens que si l'on compte finir vite.
    {
      id: "course",
      nom: { fr: "Le pas de course", en: "At a run" },
      //  🔴 « Comment ça les Centres ne me soignent plus ? mdr » (proprio,
      //     12/08) : sans le mot ÉCHANGE, le prix se lisait comme un bug.
      //     « En échange » suffit — la carte redevient un marché qu'on pèse.
      dit: { fr: "L'expérience monte d'un tiers. En échange, les Centres ne te soignent plus.",
             en: "Experience rises by a third. In return, Centers no longer heal you." },
      //  🔴 ET IL POSAIT LE MAUVAIS DRAPEAU. `soinInterdit` ferme le sac EN
      //     COMBAT ; l'écran du Centre ne l'a jamais lu. La carte annonçait donc
      //     un prix qu'elle ne prenait pas, et en prenait un autre en silence.
      effet: { expGain: 1.34, centreInterdit: true },
    },
    // ── Celui qui change la FAÇON de jouer, pas un chiffre ────────────────
    //  🔴 LES NEUF PREMIERS SONT TOUS DES MULTIPLICATEURS. Ils dosent, ils ne
    //     déplacent pas la décision : on joue pareil avec ou sans. Celui-ci
    //     rend une capture tardive JOUABLE — un Pokémon croisé à l'acte 6
    //     arrivait niveau 20 face à une équipe niveau 50, donc il ne servait
    //     qu'au Pokédex. Il redevient un recrutement, et les nœuds d'herbes
    //     cessent d'être un péage pour devenir un choix.
    //  ⚠️ Son prix est DANS l'acquis : on apprend moins vite quand on s'appuie
    //     sur ses recrues. Sans prix il ne se choisirait pas, il s'imposerait.
    {
      id: "recruteur",
      nom: { fr: "Le recruteur", en: "The recruiter" },
      dit: { fr: "Tes captures arrivent au niveau de ta tête. En échange, un sixième d'expérience en moins.",
             en: "Your catches arrive at your lead's level. You gain a sixth less experience." },
      effet: { captureNiveau: true, expGain: 0.88 },
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  CEUX QUE LA COLLECTION DÉBLOQUE — ET POURQUOI ILS EXISTENT
    //
    //  🔴 LA COLLECTION DE COMPTE NE PESAIT PRESQUE RIEN. Elle donnait un
    //     compteur au Pokédex, un compagnon et le PC de Léo — trois portes, mais
    //     aucune n'était une RAISON de capturer une espèce de plus. Capturer
    //     servait à capturer.
    //     Ici, chaque palier ouvre un acquis pour tous les voyages suivants :
    //     « il me manque six espèces avant Le vétéran » devient une raison de
    //     prendre le nœud d'herbes plutôt que le dresseur. C'est le lien qui
    //     manquait entre ce qu'on garde et ce qu'on joue.
    //
    //  🔴 ET C'EST LE CHOIX (v410) QUI REND ÇA POSSIBLE. Tant que la carte
    //     tirait UN acquis au hasard, chaque ajout diluait les autres — un
    //     dixième avait été écrit puis retiré pour cette raison exacte. Avec le
    //     meilleur de trois, agrandir le vivier ajoute de la variété sans
    //     toucher à la qualité de ce qu'on prend.
    //
    //  ⚠️ JAMAIS AU DÉFI DU JOUR NI EN PVP. Deux joueurs n'ont pas la même
    //     collection : un vivier qui en dépend casserait la comparaison, et
    //     c'est tout ce qui fait le Défi. Même borne que le compagnon.
    //  ⚠️ Les seuils se lisent sur les espèces PRISES, pas vues : on récompense
    //     ce qu'on a fait, pas ce qu'on a croisé.
    //  🔴 ET ILS SONT FORTS, PARCE QU'UN ACQUIS FAIBLE COÛTE UNE PLACE. Premier
    //     jet, trois acquis modestes : la Ligue est tombée de 9,2 % à 5,0 % sur
    //     300 voyages. On ne dilue plus ce qu'on PREND — le choix protège de ça
    //     — mais on dilue ce qu'on OFFRE : trois options tièdes dans un vivier
    //     de treize évincent les fortes du triplet. *Agrandir un vivier à choix
    //     fixe n'est gratuit que si l'ajout tient la comparaison.*
    //     Ils sont donc au niveau des meilleurs — et c'est cohérent : ils se
    //     GAGNENT, à 25, 45 et 70 espèces prises.
    // ═══════════════════════════════════════════════════════════════════════
    {
      id: "revanche",
      seuil: 25,
      nom: { fr: "La revanche", en: "Payback" },
      dit: { fr: "Tu frappes un tiers plus fort. En échange, tu encaisses un cinquième de plus.",
             en: "You hit a third harder. In return, you take a fifth more." },
      effet: { degatsInfliges: 1.3, degatsSubis: 1.2 },
    },
    {
      id: "collection",
      seuil: 45,
      nom: { fr: "L'appel du collectionneur", en: "The collector's call" },
      dit: { fr: "Tes Poké Balls tiennent deux fois mieux. Une carte de butin de plus.",
             en: "Your Poké Balls hold twice as well. One more loot card." },
      effet: { capture: 2, butinChoix: 1 },
    },
    {
      id: "veteran",
      seuil: 70,
      nom: { fr: "Le vétéran", en: "The veteran" },
      dit: { fr: "Un coup critique sur cinq de plus.",
             en: "One more critical hit in five." },
      effet: { critBonus: 0.2 },
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 « LA MENACE » A ÉTÉ ÉCRITE, MESURÉE DEUX FOIS, PUIS RETIRÉE — 10/08.
    //     « L'argent rentre deux fois plus. Les Champions gagnent un niveau. »
    //     Elle parlait la langue des Sceaux (`bossNiveau`) et se lisait comme un
    //     neuvième sceau qu'on prend volontairement. L'idée tenait.
    //
    //     Premier verdict : 24,5 % de badges contre 27 au témoin. J'allais la
    //     couper — puis j'ai regardé ce que le harnais faisait de son argent :
    //     il n'achetait QUE des Balls, plafonnées à dix. L'argent au-delà était
    //     mort, donc un acquis qui le double ne pouvait rien valoir.
    //     ✅ Instrument corrigé (il achète des soins), témoin remonté à 32 %.
    //     Second verdict, honnête cette fois : **26,5 % contre 32 %.**
    //
    //  🔴 UN NIVEAU DE CHAMPION COÛTE PLUS QUE LE DOUBLE D'ARGENT NE RAPPORTE.
    //     C'est un fait sur ce mode, et il vaut pour toute future idée du même
    //     dessin : `bossNiveau` est une monnaie très chère.
    //  ⚠️ Et on ne livre pas un acquis qui perd, même quand il se raconte bien :
    //     un tirage à trois n'a que trois places, et une option tiède en vole
    //     une. *Une bonne idée qui mesure mal reste une mauvaise carte.*
    // ═══════════════════════════════════════════════════════════════════════
    // ── Celui qui rend la défaite jouable ─────────────────────────────────
    //  🔴 IL NE VAUT QUE DANS L'ÉTAT LE PLUS TENDU DU MODE, et c'est tout son
    //     dessin : cinq Pokémon à terre, un debout, et le combat redevient
    //     gagnable. Le mode se jouait jusque-là en évitant ce moment ; il
    //     devient une position qu'on peut CHERCHER — ne pas soigner, garder
    //     son meilleur pour la fin, accepter un serment qui borne l'équipe.
    //  ⚠️ Aucun prix écrit, et c'est délibéré : la CONDITION est le prix. On ne
    //     l'obtient qu'au bord de la défaite, et un joueur qui la provoque
    //     paie déjà en risque ce qu'un chiffre lui coûterait.
    {
      id: "dernier",
      nom: { fr: "Le dernier debout", en: "Last one standing" },
      dit: { fr: "Quand il ne t'en reste qu'un, il frappe deux fois plus fort.",
             en: "When only one is left, it hits twice as hard." },
      effet: { dernierDebout: 2 },
    },
    {
      id: "troupe",
      nom: { fr: "L'esprit de troupe", en: "Team spirit" },
      dit: { fr: "Toute l'équipe gagne l'expérience. Chacun en reçoit un quart de moins.",
             en: "The whole team gains experience. Each gets a quarter less." },
      effet: { expPartage: true, expGain: 0.75 },
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 UN DIXIÈME ACQUIS A ÉTÉ ÉCRIT, MESURÉ, PUIS RETIRÉ — 09/08.
    //
    //     « L'étude des faiblesses » : les coups efficaces font moitié plus, les
    //     coups mal choisis font moitié moins. Il visait le seul mur que rien ne
    //     débloque — Morgane, dont la faiblesse est INSECTE alors que la Gen 1
    //     n'a aucune capsule Insecte.
    //
    //     Témoin contre essai, 300 voyages chacun, même politique :
    //       · neuf acquis  → Ligue gagnée **10,4 %**
    //       · dix acquis   → Ligue gagnée **4,6 %**, puis **5,0 %** après avoir
    //         déplacé la pénalité du coup NEUTRE vers le coup MAL CHOISI.
    //     Le réglage n'était donc pas la cause. Deux le sont :
    //       1. avec ~2,5 tirages sur le vivier, **chaque acquis ajouté dilue la
    //          part des autres** — et les neuf autres sont inconditionnels ;
    //       2. **aucun instrument du dossier ne COMPOSE son équipe par types**,
    //          donc aucun ne peut exploiter un bonus conditionnel. La moitié de
    //          la valeur de cet acquis est invisible à la mesure.
    //
    //  🔴 ON NE LIVRE PAS UNE MÉCANIQUE DONT LE SEUL EFFET MESURABLE EST DE
    //     DIVISER PAR DEUX LE TAUX DE VICTOIRE. « Un humain saurait s'en
    //     servir » n'est pas une preuve — c'est l'argument que ce dossier a
    //     appris à refuser.
    //  📌 Le préalable est nommé : une politique de harnais qui compose son
    //     équipe PAR LES TYPES avant une arène. Tant qu'elle n'existe pas,
    //     aucun acquis conditionnel n'est équilibrable.
    // ═══════════════════════════════════════════════════════════════════════
  ];

  var PAR_ID = (function () {
    var m = {};
    for (var i = 0; i < LISTE.length; i++) m[LISTE[i].id] = LISTE[i];
    return m;
  })();

  function porte(partie, id) {
    var a = (partie && partie.acquis) || [];
    for (var i = 0; i < a.length; i++) if (a[i] === id) return true;
    return false;
  }

  // Ceux qu'on peut encore prendre. 🔴 La porte unique : l'offre, le butin et
  //    l'écran la lisent tous ici. Deux listes finiraient par diverger, et la
  //    divergence se lirait comme « cet acquis n'existe pas ».
  // 🔴 COMBIEN D'ESPÈCES LE COMPTE A-T-IL PRISES. Lu à la porte unique de la
  //    progression — jamais un compteur parallèle, qui finirait par dire autre
  //    chose que le Pokédex affiché à deux écrans de là.
  function prisesDuCompte() {
    var PR = W.PokeProgression;
    if (!PR || !PR.lire) return 0;
    var c = PR.lire();
    return c && c.pris ? Object.keys(c.pris).length : 0;
  }

  // ⚠️ AU DÉFI DU JOUR, LE VIVIER EST CELUI DE TOUT LE MONDE. Deux joueurs n'ont
  //    pas la même collection ; un vivier qui en dépend ferait comparer deux
  //    jeux différents. `compare` est le drapeau du mode, celui-là même que le
  //    compagnon interroge — une seule règle pour une seule question.
  function ouverts(partie) {
    var out = [], prises = (partie && partie.compare) ? 0 : prisesDuCompte();
    for (var i = 0; i < LISTE.length; i++) {
      var q = LISTE[i];
      if (porte(partie, q.id)) continue;
      if (q.seuil && prises < q.seuil) continue;
      out.push(q);
    }
    return out;
  }

  // Ce qu'il reste à capturer avant le prochain palier — pour que l'écran
  // puisse le DIRE, au lieu de laisser découvrir un acquis par surprise.
  function prochainPalier(partie) {
    if (partie && partie.compare) return null;
    var prises = prisesDuCompte(), meilleur = null;
    for (var i = 0; i < LISTE.length; i++) {
      var q = LISTE[i];
      if (!q.seuil || prises >= q.seuil) continue;
      if (!meilleur || q.seuil < meilleur.seuil) meilleur = q;
    }
    return meilleur ? { acquis: meilleur, manque: meilleur.seuil - prises } : null;
  }

  // ⚠️ LE TIRAGE PASSE PAR LA GRAINE, comme tout le reste. Au Défi du jour, tout
  //    le monde doit se voir offrir les mêmes acquis — sinon la comparaison ne
  //    vaut rien, et c'est ce que vérifie `poke-rng`.
  function offrir(partie, h, combien) {
    var vivier = ouverts(partie).slice();
    var n = Math.min(combien || 3, vivier.length);
    var out = [];
    for (var i = 0; i < n; i++) out.push(vivier.splice(h.entier(vivier.length), 1)[0]);
    return out;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  TROIS ACQUIS POUR UN SEUL TIRAGE — ET C'EST TOUT L'INTÉRÊT
  //
  //  🔴 `offrir` CONSOMME TROIS TIRAGES, ET C'EST CE QUI L'A RENDUE
  //     INUTILISABLE. La carte de butin n'en dépensait qu'UN (`h.dans(v)`).
  //     Y brancher `offrir` aurait décalé de deux tirages tout ce qui suit dans
  //     le voyage — et le serveur REJOUE la partie depuis la graine pour valider
  //     le score : le joueur aurait lu « score refusé » après son unique essai
  //     du jour. C'est le troisième point que `poke-rng` vérifie, mot pour mot :
  //     *le NOMBRE de tirages consommés doit être identique*.
  //
  //  ✅ `h.entier(n)` appelle `brut()` UNE fois quelle que soit sa borne. On
  //     tire donc un rang dans l'ensemble des TRIPLETS possibles, et on le
  //     déplie sans toucher au hasard : un seul tirage, le flux inchangé à
  //     l'octet, et la variété complète — 84 triplets pour neuf acquis, là où
  //     un tirage simple n'en donnait que neuf.
  //
  //  ⚠️ Le dépliage est un DÉRANGEMENT lexicographique classique, pas un
  //     bricolage : il faut qu'il soit une bijection, sinon certains triplets
  //     ne sortiraient jamais et d'autres deux fois plus souvent.
  //
  //  🔴 ET LA COMBINATOIRE A DÉMÉNAGÉ DANS `rng.js`. Elle a vécu ici tant
  //     qu'elle n'avait qu'un client ; la carte de capsule est le second, et
  //     elle allait appeler `PokeAcquis.triplet` pour déplier des CAPSULES.
  //     Ce qu'on protège n'est pas un acquis, c'est le nombre de tirages
  //     consommés — donc ça appartient au hasard. Les deux fonctions restent
  //     exportées ici : c'est le nom que le reste du mode connaît.
  // ═══════════════════════════════════════════════════════════════════════════
  function combien(taille, k) { return W.PokeChoix.combien(taille, k); }
  function triplet(vivier, rang, k) { return W.PokeChoix.deRang(vivier, rang, k); }

  function poser(partie, id) {
    if (!PAR_ID[id] || porte(partie, id)) return false;
    partie.acquis = partie.acquis || [];
    partie.acquis.push(id);
    return true;
  }

  // Les effets des acquis portés, pour la composition de `PokeSerments.effet`.
  function effets(partie) {
    var out = [], a = (partie && partie.acquis) || [];
    for (var i = 0; i < a.length; i++) if (PAR_ID[a[i]]) out.push(PAR_ID[a[i]].effet);
    return out;
  }

  W.PokeAcquis = {
    LISTE: LISTE,
    de: function (id) { return PAR_ID[id] || null; },
    porte: porte,
    ouverts: ouverts,
    prochainPalier: prochainPalier,
    prisesDuCompte: prisesDuCompte,
    offrir: offrir,
    combien: combien,
    triplet: triplet,
    poser: poser,
    effets: effets,
    nombre: function () { return LISTE.length; },
  };
})(typeof window !== "undefined" ? window : globalThis);
