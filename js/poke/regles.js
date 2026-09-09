(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE JEU DE RÈGLES D'UNE PARTIE — LE REGISTRE  [19/08/2026]
  //
  //  Étape 2 du chantier de la seconde génération : avant d'ajouter Johto, il
  //  faut qu'une partie SACHE sous quelles règles elle a été jouée. Ce fichier
  //  ne fait que ça. Il n'ajoute aucune donnée, aucune espèce, aucun type — il
  //  pose la couture, et la première génération est la seule entrée.
  //
  //  🔑 POURQUOI. La table des types de la gen 2 change TROIS cases mesurées :
  //     Poison→Insecte (×2 → ×1), Insecte→Poison (×2 → ×0,5) et Glace→Feu
  //     (×1 → ×0,5). Trois cases suffisent à changer l'issue d'un combat.
  //
  //  ⚠️ ET LA RAISON N'EST PAS CELLE QUE JE CROYAIS. J'avais annoncé au
  //     propriétaire que le rejeu serveur refuserait les scores. C'est FAUX
  //     pour ce mode : `js/poke/rejeu.js` ne rejoue pas le chemin, il
  //     RECALCULE le score depuis un résumé de huit nombres — « on ne vérifie
  //     pas le chemin, on vérifie que l'arrivée est atteignable ». Le mode
  //     ninja rejoue une vie ; celui-ci non.
  //     Les vraies raisons de geler sont donc autres, et elles tiennent :
  //      · UNE PARTIE EN COURS ne doit pas changer de règles sous les pieds de
  //        son joueur, entre deux arènes ;
  //      · LE DÉFI DU JOUR promet « même départ pour tous » : deux joueurs sur
  //        la même graine doivent affronter la même table, même si l'un ouvre
  //        le jeu avant une livraison et l'autre après ;
  //      · LES CALIBRAGES (taux de 89-93 %, plafonds par acte, échelle des
  //        sceaux) ont tous été réglés sur la table de la gen 1.
  //
  //  ⚠️ UN JEU DE RÈGLES SE POSE UNE FOIS, AU DÉMARRAGE ET À LA REPRISE, et se
  //     lit partout ensuite. On ne le fait pas voyager en paramètre : le combat
  //     ne reçoit pas la partie, et le lui faire traverser serait une refonte
  //     dont on ne saurait plus prouver qu'elle n'a rien changé. Une partie à
  //     la fois vit dans un onglet — c'est exactement comme `SPORT`.
  // ═══════════════════════════════════════════════════════════════════════════

  var DEFAUT = "gen1";

  //  Les octets du ROM pour le rapport de sexe. Ce ne sont pas des pour-cent :
  //  c'est le nombre auquel la cartouche compare le DV d'Attaque, quartet de
  //  poids fort. On les garde tels quels pour que la comparaison soit LA MÊME.
  //  🔴 `GENDER_F0` et `GENDER_UNKNOWN` n'y sont pas — ils ne sont pas des
  //     taux, et les mettre ici les ferait traiter comme tels.
  var OCTET_DE_SEXE = {
    GENDER_F12_5: 0x1f, GENDER_F25: 0x3f, GENDER_F50: 0x7f,
    GENDER_F75: 0xbf, GENDER_F100: 0xfe,
  };

  // Les entrées. La gen 1 lit les tables déjà chargées : ce fichier ne
  // duplique aucune donnée, il les NOMME.
  var JEUX = {
    gen1: {
      nom: "Première génération",
      types: function () { return W.POKE_TYPES; },
      typeNoms: function () { return W.POKE_TYPE_NOMS; },
      table: function () { return W.POKE_TYPE_TABLE; },
      speciaux: function () { return W.POKE_TYPES_SPECIAUX; },
      especes: function () { return W.POKE_ESPECE; },
      especesListe: function () { return W.POKE_ESPECES; },
      attaques: function () { return W.POKE_ATTAQUE_PAR_CLE; },
      attaquesListe: function () { return W.POKE_ATTAQUES; },
      dexTotal: 151,
      arenes: function () { return W.POKE_ARENES; },
      etapes: function () { return W.POKE_ETAPES; },
      clesVoyage: function () { return W.POKE_CLES; },
      badgePourCS: function () { return W.POKE_BADGE_POUR_CS || {}; },
      // ═══════════════════════════════════════════════════════════════════════
      //  QUELS BADGES DONNENT QUOI — LE DERNIER CHIFFRE ENCORE ÉCRIT EN DUR
      //
      //  🔴 UN BADGE N'EST PAS DÉCORATIF : quatre d'entre eux valent +12,5 % sur
      //     une statistique, pour tout le voyage. La table vivait en deux
      //     morceaux (`badgesActifs` dans partie.js, `BADGE_DE` dans combat.js)
      //     et les deux ne connaissaient que Kanto : les huit badges de Johto
      //     ne donnaient donc RIEN — huit récompenses annoncées, aucune payée.
      //  🔑 Le rang suffit à tout dire. `spe` désigne LA spéciale, quel que soit
      //     le nom que le monde lui donne : c'est une seule case de badge, même
      //     là où la statistique s'est dédoublée.
      // ═══════════════════════════════════════════════════════════════════════
      badgesStat: { 1: "atk", 3: "vit", 5: "def", 7: "spe" },
      // 🔴 CENT ESPÈCES SORTAIENT SANS UN SON. `PokeAudio.cri` lisait une table
      //    qui s'arrête à la 151ᵉ : à Johto, cent créatures apparaissaient en
      //    silence. Les cris de 1999 sont générés depuis Cristal — ils ne se
      //    déduisent PAS de ceux de 1996, et un son faux serait pire qu'un
      //    silence : il se croirait juste.
      sons: function () { return W.POKE_SONS; },
      sonsAttaques: function () { return W.POKE_SONS; },
      peche: function () { return W.POKE_PECHE || null; },
      zones: function () { return W.POKE_ZONES; },
      lieux: function () { return W.POKE_LIEUX; },
      // 🔴 LES VERSIONS D'UNE GÉNÉRATION. Rouge et Bleu n'ont pas les mêmes
      //    tables de rencontre, et le mode en fait un choix de départ.
      versions: ["rouge", "bleu"],
      //  Le nom d'une version se lit DANS le monde qui la porte. Écrit ailleurs,
      //  il aurait fallu le retrouver au monde suivant — voir la note de Johto.
      versionsNoms: {
        rouge: { fr: "Rouge", en: "Red" },
        bleu: { fr: "Bleu", en: "Blue" },
      },
      // ═══════════════════════════════════════════════════════════════════════
      //  LES TROIS DE LA TABLE — ILS APPARTIENNENT AU MONDE, PAS AU MODE
      //
      //  🔴 `[1, 4, 7]` ÉTAIT ÉCRIT EN DUR DANS `depart.js`. Sous Johto, le
      //     laboratoire aurait posé Bulbizarre, Salamèche et Carapuce sur la
      //     table d'Orme — trois espèces que le professeur de 1999 n'a jamais
      //     eues, et un joueur qui croit avoir mal lu.
      // ═══════════════════════════════════════════════════════════════════════
      canon: [1, 4, 7],
      // 🔴 LE PROFESSEUR EST DU MONDE, PAS DU MODE. « Chen te tend le Pokédex »
      //    s'affichait dans le laboratoire d'Orme — le seul personnage que le
      //    joueur rencontre avant d'avoir un Pokémon, et il portait le mauvais
      //    nom. Trois phrases le nomment ; elles le demandent désormais ici.
      professeur: { fr: "Chen", en: "Oak" },
      // 🔴 LES VISAGES SONT DU MONDE AUSSI. La liste était écrite en dur dans
      //    `ui.js` : sous Johto, la carte d'acte montrait Pierre en tête de
      //    l'arène d'Albert, et le Conseil 4 portait les quatre visages de
      //    l'Indigo. Les portraits de 1999 existent — ils vivent ailleurs, sous
      //    un autre nom de fichier — et personne ne les servait.
      //    ⚠️ Un nom SANS barre oblique se lit dans `assets/img/poke/dresseur/` :
      //       c'est le repli de 1996, et c'est ce qui laisse les classes de
      //       route et les visages du rival inchangés.
      visages: {
        arene: ["brock", "misty", "lt.surge", "erika", "koga", "sabrina", "blaine", "giovanni"],
        conseil: ["lorelei", "bruno", "agatha", "lance"],
      },
      // ═══════════════════════════════════════════════════════════════════
      //  LE CINQUIÈME DE LA LIGUE — QUI EST-CE, AU JUSTE ?
      //
      //  🔴 SIGNALÉ PAR UN JOUEUR LE JOUR DE L'OUVERTURE : « il y a des
      //     incohérences sur les noms des champions de la ligue ». À Kanto, le
      //     dernier des cinq est TON RIVAL — c'est le coup de théâtre de 1996,
      //     et le code le supposait partout. À Johto, c'est **Peter**, et son
      //     équipe dormait dans `POKE_GEN2_MAITRE` sans qu'un seul fichier du
      //     jeu ne la lise. *Une règle écrite et jamais branchée* : la donnée
      //     existait, elle était juste, et personne ne l'a jamais affrontée.
      //  🔑 Kanto rend `null` — et `null` veut dire « c'est le rival », pas
      //     « il n'y a personne ». Le seul endroit qui décide est celui qui lit
      //     cette porte.
      // ═══════════════════════════════════════════════════════════════════
      maitre: function () { return null; },
      //  Le rival de 1996 et son ordre de variantes : Carapuce, Bulbizarre,
      //  Salamèche — l'ordre du ROM, et il voyage AVEC la table qu'il indexe.
      //  Les équipes des dresseurs de ROUTE — celles que la carte tire à chaque
      //  nœud. Voir la note posée sur `equipes` de Johto.
      equipes: function () { return W.POKE_EQUIPES || null; },
      classesDresseur: function () { return W.POKE_CLASSES || null; },
      rival: function () {
        return W.POKE_RIVAL
          ? { ordre: [7, 1, 4], rencontres: 8, debut: W.POKE_RIVAL.debut,
              milieu: W.POKE_RIVAL.milieu, champion: W.POKE_RIVAL.champion }
          : null;
      },
      // Kanto n'a pas de dresseur d'épilogue : son sommet est Mewtwo.
      dresseurFinal: function () { return null; },
      // Kanto ne connaît pas les objets tenus : un Pokémon de 1996 ne porte rien.
      tenus: function () { return null; },
      objetsTable: function () { return W.POKE_OBJETS || null; },
      // Kanto n'a ni météo, ni Rune Protect, ni Requiem.
      effetsNeufs: function () { return null; },
      errants: function () { return null; },
      // ═══════════════════════════════════════════════════════════════════
      //  LE MYTHIQUE DU MONDE  [24/08/2026]
      //
      //  🔴 MEW ETAIT ECRIT « 151 » A SIX ENDROITS. La carte, les traces, le
      //     tirage, l'ecran, la fiche du Pokedex : chacun connaissait le
      //     nombre par coeur. Le jour ou le proprietaire a demande Celebi,
      //     ajouter un `if (gen2)` a cote de chaque 151 aurait double la
      //     faute au lieu de la corriger.
      //  🔑 UN MONDE DIT QUI EST SON MYTHIQUE, ET LE RESTE SUIT. C'est la
      //     regle generale, pas le cas : le troisieme monde n'aura rien a
      //     rebrancher.
      //  ⚠️ `lieu` EST L'ADRESSE, QUAND LE CANON EN DONNE UNE. Mew n'en a
      //     pas -- c'est tout son mythe -- et sa chasse emprunte l'etape
      //     d'une zone de l'acte. Celebi, lui, a la sienne : le sanctuaire du
      //     Bois aux Chenes. Un monde qui ne nomme pas de lieu emprunte,
      //     comme avant.
      // ═══════════════════════════════════════════════════════════════════
      mythique: function () { return { n: 151, niveau: 7, lieu: null }; },
      conseil: function () { return W.POKE_CONSEIL; },
      // ═══════════════════════════════════════════════════════════════════════
      //  LES SCÈNES  [20/08/2026]
      //
      //  🔴 CES TABLES ÉTAIENT LUES EN DIRECT, TRENTE FOIS, DANS SIX FICHIERS.
      //     `W.POKE_ECHANGES` dans la carte, dans les actes, dans « où le
      //     trouver », dans le Pokédex, dans l'écran… et toutes ces lectures
      //     servaient les données de 1996 à un voyage de Johto. Un échange de
      //     Carmin-sur-Mer proposé à Ébènelle ne plante pas : il ne SORT pas,
      //     parce que son étape n'existe pas dans ce monde. Douze scènes
      //     disparaissaient ainsi en silence.
      //  🔑 Une porte qui rend `null` se lit partout comme « ce monde n'en a
      //     pas », et c'est déjà la convention de `errants` et de `tenus`.
      // ═══════════════════════════════════════════════════════════════════════
      echanges: function () { return W.POKE_ECHANGES || null; },
      casino: function () { return W.POKE_CASINO || null; },
      cadeaux: function () { return W.POKE_CADEAUX || null; },
      fossiles: function () { return W.POKE_FOSSILES || null; },
      dojo: function () { return W.POKE_DOJO || null; },
      ambre: function () { return W.POKE_AMBRE || null; },
      // 🔴 KANTO POSE UNE SEULE RENCONTRE À LA MAIN — le Ronflex — et il vivait
      //    dans une globale à part, `POKE_RONFLEX`, avec son propre drapeau
      //    d'étape. Johto en pose SEPT. On les sert par la même porte : une
      //    liste, chacune sur son étape. Kanto en donne une, et rien ne change
      //    pour lui.
      statiques: function () {
        if (!W.POKE_RONFLEX) return null;
        var l = [], et = W.POKE_ETAPES || [];
        for (var i = 0; i < et.length; i++) {
          if (et[i].ronflex) l.push({ n: W.POKE_RONFLEX, niveau: 30, etape: et[i].id });
        }
        return l.length ? l : null;
      },
      // Kanto ne connaît ni les arbres à secouer, ni les œufs : l'élevage
      // naît en 1999.
      arbres: function () { return null; },
      oeufs: function () { return null; },
      // ═══════════════════════════════════════════════════════════════════════
      //  LE JEU DE RÈGLES NOMME SES STATISTIQUES SPÉCIALES  [19/08/2026]
      //
      //  🔴 C'EST L'ÉCART DE LA SECONDE GÉNÉRATION QUI TOUCHE LE MOTEUR, et le
      //     seul. Le « Spécial » unique de 1996 s'y sépare en attaque et
      //     défense spéciales : six statistiques de base au lieu de cinq.
      //
      //  🔑 ON NE MET PAS DE `if (gen2)` DANS LE MOTEUR — on lui donne un NOM à
      //     lire. En première génération les deux noms sont le même, `spe`, et
      //     le moteur fait donc exactement ce qu'il faisait : ce n'est pas un
      //     cas particulier neutralisé, c'est le cas général dont la gen 1 est
      //     l'instance dégénérée. C'est ce qui rend la preuve possible —
      //     `poke-sim.mjs 200` doit rendre le MÊME nombre au tour près.
      //
      //  ⚠️ LES VALEURS DÉTERMINANTES ET L'EXPÉRIENCE DE STAT NE SE DÉDOUBLENT
      //     PAS, dans aucune des deux générations : le ROM de 1999 fait servir
      //     l'UNIQUE valeur « spéciale » aux deux statistiques dérivées. On
      //     garde donc `dv.spe` et `statExp.spe` tels quels — et surtout, on ne
      //     touche à AUCUN tirage. Un tirage de plus casserait le rejeu de
      //     toutes les graines du mode.
      // ═══════════════════════════════════════════════════════════════════════
      speAtk: "spe",
      speDef: "spe",
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA SECONDE GÉNÉRATION S'INSCRIT ICI — ET SEULEMENT SI ELLE EST CHARGÉE
  //
  //  🔴 C'EST LA PORTE, ET ELLE EST FERMÉE À CLÉ PAR L'ABSENCE DES DONNÉES.
  //     `js/poke/gen2/*` n'est chargé par personne (voir
  //     `tools/poke-gen2-close.mjs`) : chez un joueur, `POKE_GEN2_ESPECE`
  //     n'existe pas, cette entrée ne se crée pas, et `de()` replie sur la
  //     gen 1 pour toute partie qui la réclamerait. L'outillage, lui, charge
  //     les trois fichiers et peut donc l'éprouver en entier.
  //
  //  🔑 UNE PORTE OUVERTE PAR UN OUTIL SEUL EST FERMÉE — c'est la loi du
  //     dossier, et c'est ce qui permet de MESURER Johto sans le livrer. Sans
  //     ça il aurait fallu choisir entre livrer sans preuve et prouver en
  //     livrant.
  //
  //  ⚠️ CE QUI MANQUE ENCORE, et qui se voit à la mesure plutôt que dans un
  //     commentaire : les effets d'attaque de la gen 2 portent d'AUTRES noms
  //     que ceux de 1996 (`EFFECT_SP_DEF_UP` contre `SPECIAL_UP1_EFFECT`). La
  //     table d'effets de `combat.js` est celle de la gen 1 ; sous ce jeu de
  //     règles, une attaque à effet ne fait donc que ses dégâts. C'est un
  //     manque de CONTENU, mesuré et nommé, pas un calcul faux.
  // ═══════════════════════════════════════════════════════════════════════════
  if (W.POKE_GEN2_ESPECE && W.POKE_GEN2_TYPE_TABLE) {
    // ═══════════════════════════════════════════════════════════════════════
    //  LES EFFETS SE TRADUISENT ICI, PAS DANS LE MOTEUR  [19/08/2026]
    //
    //  🔴 LES DEUX GÉNÉRATIONS N'ONT PAS UN SEUL NOM D'EFFET EN COMMUN —
    //     mesuré, intersection vide sur 68 et 135 noms. `combat.js` lit
    //     `a.effet` à vingt-cinq endroits ; les envelopper un par un aurait
    //     planté vingt-cinq fois la connaissance de la gen 2 dans un fichier
    //     qui doit l'ignorer, et il en aurait manqué un.
    //  ✅ On traduit À LA SOURCE : la table d'attaques que ce jeu de règles
    //     livre porte déjà des noms d'effet que le moteur connaît. Le moteur
    //     ne change pas d'une ligne.
    //  ⚠️ CE QUI N'A PAS D'ÉQUIVALENT GARDE SON NOM DE 1999, exprès : l'effet
    //     ne se déclenche pas, et le compteur d'effets non traités le nomme
    //     dans la langue de sa génération. Un manque doit se voir tel qu'il
    //     est, pas déguisé en effet de 1996.
    //  ⚠️ Construite UNE FOIS, à la demande : 251 attaques recopiées à chaque
    //     coup se paieraient sur chaque tour de chaque combat.
    // ═══════════════════════════════════════════════════════════════════════
    var g2Att = null, g2AttListe = null;
    function traduireAttaques() {
      if (g2Att) return;
      var T = W.POKE_GEN2_EFFETS || {};
      g2Att = {};
      g2AttListe = [];
      for (var i = 0; i < W.POKE_GEN2_ATTAQUES.length; i++) {
        var a = W.POKE_GEN2_ATTAQUES[i], c = {};
        for (var k in a) c[k] = a[k];
        // Le nom d'origine reste lisible : c'est lui qui dit à quelle
        // génération appartient un effet qu'on n'a pas encore écrit.
        c.effetGen2 = a.effet;
        c.effet = T[a.effet] || a.effet;
        g2Att[c.cle] = c;
        g2AttListe.push(c);
      }
    }

    JEUX.gen2 = {
      nom: "Seconde génération",
      types: function () { return W.POKE_GEN2_TYPES; },
      typeNoms: function () { return W.POKE_GEN2_TYPE_NOMS; },
      table: function () { return W.POKE_GEN2_TYPE_TABLE; },
      speciaux: function () { return W.POKE_GEN2_TYPES_SPECIAUX; },
      especes: function () { return W.POKE_GEN2_ESPECE; },
      especesListe: function () { return W.POKE_GEN2_ESPECES; },
      attaques: function () { traduireAttaques(); return g2Att; },
      attaquesListe: function () { traduireAttaques(); return g2AttListe; },
      dexTotal: 251,
      //  ⚠️ Les arènes de Johto ne sont là QUE si leur fichier est chargé —
      //     il est généré à part, et personne ne le charge. Sans lui, cette
      //     entrée du registre rendrait `undefined` : on replie donc sur
      //     Kanto, ce qui n'arrive jamais en jeu et évite un écran mort à
      //     l'outillage.
      arenes: function () { return W.POKE_GEN2_ARENES || W.POKE_ARENES; },
      etapes: function () { return W.POKE_GEN2_ETAPES || W.POKE_ETAPES; },
      clesVoyage: function () { return W.POKE_GEN2_CLES || W.POKE_CLES; },
      badgePourCS: function () { return W.POKE_GEN2_BADGE_POUR_CS || {}; },
      //  Zéphyr → Attaque, Plaine → Vitesse, Minéral → Défense, Glacier →
      //  Spéciale. Le canon de 1999, aux mêmes rangs que la cartouche.
      badgesStat: { 1: "atk", 3: "vit", 6: "def", 7: "spe" },
      //  ⚠️ Les deux banques se complètent : les programmes de 1999 pour les cris,
      //     ceux de 1996 pour tout le reste (attaques, jingles) — le mode n'a
      //     qu'un seul lecteur et une seule bibliothèque d'effets.
      sons: function () { return W.POKE_GEN2_SONS || W.POKE_SONS; },
      //  🔑 LES BRUITAGES DE CRISTAL, PAS CEUX DE ROUGE. Mêler deux banques
      //     dans un même combat s'entend — même refus que pour les sprites.
      sonsAttaques: function () { return W.POKE_GEN2_SONS_ATTAQUES || W.POKE_SONS; },
      //  🔴 SANS CETTE LIGNE, LA PÊCHE N'EXISTE PAS À JOHTO. Trois écrans
      //     lisaient `W.POKE_PECHE` en globale — la table de KANTO — et son
      //     `parCarte` ne nomme aucun lieu d'ici : `onPecheIci` répondait NON
      //     partout, donc aucun nœud de pêche n'était jamais créé.
      peche: function () { return W.POKE_GEN2_PECHE || W.POKE_PECHE || null; },
      zones: function () { return W.POKE_GEN2_ZONES || W.POKE_ZONES; },
      lieux: function () { return W.POKE_GEN2_LIEUX || W.POKE_LIEUX; },
      //  ⚠️ UNE SEULE VERSION, ET C'EST LA VÉRITÉ DE LA SOURCE. On lit Cristal ;
      //     Or et Argent diffèrent par quelques créneaux qu'on n'a pas relevés.
      //     Émettre la même table sous deux noms de version serait mentir sur
      //     une exclusivité qui n'existe pas dans nos données.
      versions: ["cristal"],
      // 🔴 LA CARTE DE PARTAGE DE JOHTO SORTAIT SANS NOM DE VERSION — signalé
      //    par Poltron, deux captures à l'appui : « la version bleu de Kanto,
      //    jusqu'ici tout va bien, puis un second screen qui est la version de
      //    Johto pourtant sans dénomination ». `PokeGenre.version` ne
      //    connaissait que « rouge » et « bleu », écrits en dur : toute autre
      //    clé rendait la chaîne vide, et l'image partagée portait un blanc.
      versionsNoms: {
        cristal: { fr: "Cristal", en: "Crystal" },
      },
      // Germignon, Héricendre, Kaiminus — les trois du Professeur Orme.
      canon: [152, 155, 158],
      professeur: { fr: "Orme", en: "Elm" },
      visages: {
        arene: ["gen2/dresseur/arene1", "gen2/dresseur/arene2", "gen2/dresseur/arene3",
          "gen2/dresseur/arene4", "gen2/dresseur/arene5", "gen2/dresseur/arene6",
          "gen2/dresseur/arene7", "gen2/dresseur/arene8"],
        conseil: ["gen2/dresseur/conseil1", "gen2/dresseur/conseil2",
          "gen2/dresseur/conseil3", "gen2/dresseur/conseil4"],
        maitre: "gen2/dresseur/maitre",
      },
      //  Johto clôt sa Ligue sur Peter — le rival, lui, s'affronte en route.
      maitre: function () { return W.POKE_GEN2_MAITRE || null; },
      //  🔴 JOHTO N'AVAIT PAS DE RIVAL DU TOUT — signalé par un joueur le jour
      //     de l'ouverture : « le rival est le même que dans la 1G, il a pas la
      //     bonne team ». Les huit rencontres puisaient dans les équipes de
      //     Blue. Sept rencontres ici, et aucune ne clôt la Ligue.
      // 🔴 JOHTO N'AVAIT PAS DE DRESSEURS DE ROUTE — signalé par un joueur le
      //    jour de l'ouverture : « les dresseurs en face avaient quasiment 0
      //    pokémon de la seconde génération à part la league ». `carte-actes`
      //    tirait dans `W.POKE_EQUIPES`, la table de 1996, à chaque nœud.
      equipes: function () { return W.POKE_GEN2_EQUIPES || W.POKE_EQUIPES || null; },
      //  ⚠️ LA NOMENCLATURE VOYAGE AVEC LE VIVIER. Livrer les équipes de Johto
      //     sans ses classes a fait tomber les captures de 5 à 1 : la carte ne
      //     tire que les classes DÉCLARÉES, et les 22 manquantes étaient
      //     justement les débutantes. Il ne restait que des dresseurs trop
      //     forts. *Une correction qui n'emporte que la moitié de sa cause est
      //     une régression.*
      classesDresseur: function () { return W.POKE_GEN2_CLASSES || W.POKE_CLASSES || null; },
      rival: function () { return W.POKE_GEN2_RIVAL || null; },
      dresseurFinal: function () { return W.POKE_GEN2_RED || null; },
      tenus: function () { return W.POKE_GEN2_TENUS || null; },
      objetsTable: function () { return W.POKE_GEN2_OBJETS || null; },
      effetsNeufs: function () { return W.POKE_GEN2_EFFETS_NEUFS_TABLE || null; },
      // 🔴 LES TROIS BÊTES. Kanto n'a pas d'errants : sa porte rend `null`, et
      //    tout ce qui les lit se tait de lui-même.
      errants: function () { return W.POKE_GEN2_ERRANTS || null; },
      //  🔴 CELEBI, ET SON ADRESSE. En Cristal il ne s'obtenait qu'a un
      //     evenement, avec la Ball GS -- donc jamais, pour qui joue
      //     aujourd'hui. Il herite ici de la chasse de Mew : le diplome du
      //     monde l'ouvre, les traces le rapprochent, l'essai est unique.
      //     Le lieu, lui, est celui du canon : le sanctuaire du Bois aux
      //     Chenes, ou la Ball GS se posait. Niveau 30, comme la cartouche.
      mythique: function () { return { n: 251, niveau: 30, lieu: "ilex-forest" }; },
      conseil: function () { return W.POKE_GEN2_CONSEIL || W.POKE_CONSEIL; },
      // ── Les scènes de Johto ─────────────────────────────────────────────
      //  ⚠️ AUCUN REPLI SUR KANTO ICI. Partout ailleurs dans ce registre, une
      //     table absente retombe sur celle de 1996 — c'est juste pour les
      //     types ou les sons, qui existent dans les deux mondes. Une scène,
      //     non : servir le Casino de Céladopole à Doublonville poserait un
      //     nœud dont l'étape n'existe pas, et c'est exactement le défaut que
      //     ces portes réparent. Ce que Johto n'a pas, il ne l'a pas.
      echanges: function () { return W.POKE_GEN2_ECHANGES || null; },
      casino: function () { return W.POKE_GEN2_CASINO || null; },
      cadeaux: function () { return W.POKE_GEN2_CADEAUX || null; },
      // Johto n'a ni fossile à ranimer, ni Dojo, ni Musée : ils sont à Kanto,
      // et notre itinéraire s'arrête au Mont Argenté.
      fossiles: function () { return null; },
      dojo: function () { return null; },
      ambre: function () { return null; },
      statiques: function () { return W.POKE_GEN2_STATIQUES || null; },
      // Le Concours de capture d'insectes se tient au Parc National, qui est de
      // Johto : Kanto rend `null` et tout ce qui le lit se tait de lui-meme.
      concours: function () { return W.POKE_GEN2_CONCOURS || null; },
      arbres: function () { return W.POKE_GEN2_ARBRES || null; },
      oeufs: function () { return W.POKE_GEN2_OEUFS || null; },
      // Les deux spéciales, enfin séparées. C'est tout l'écart moteur.
      speAtk: "sat",
      speDef: "sdf",
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA TROISIÈME GÉNÉRATION (HOENN) S'INSCRIT ICI  [09/09/2026]
  // ═══════════════════════════════════════════════════════════════════════════
  if (W.POKE_GEN3_ESPECE && W.POKE_GEN3_TYPE_TABLE) {
    JEUX.gen3 = {
      nom: "Troisième génération",
      types: function () { return W.POKE_GEN3_TYPES; },
      typeNoms: function () { return W.POKE_GEN3_TYPE_NOMS; },
      table: function () { return W.POKE_GEN3_TYPE_TABLE; },
      speciaux: function () { return W.POKE_GEN3_TYPES_SPECIAUX; },
      especes: function () { return W.POKE_GEN3_ESPECE; },
      especesListe: function () { return W.POKE_GEN3_ESPECES; },
      attaques: function () { return W.POKE_GEN3_ATTAQUE_PAR_CLE; },
      attaquesListe: function () { return W.POKE_GEN3_ATTAQUES; },
      dexTotal: 386,
      arenes: function () { return W.POKE_GEN3_ARENES || W.POKE_ARENES; },
      etapes: function () { return W.POKE_GEN3_ETAPES || W.POKE_ETAPES; },
      clesVoyage: function () { return W.POKE_GEN3_CLES || W.POKE_CLES; },
      badgePourCS: function () { return W.POKE_GEN3_BADGE_POUR_CS || {}; },
      badgesStat: { 1: "atk", 3: "vit", 5: "def", 7: "spe" },
      sons: function () { return W.POKE_GEN3_SONS || W.POKE_SONS; },
      sonsAttaques: function () { return W.POKE_GEN3_SONS_ATTAQUES || W.POKE_SONS; },
      peche: function () { return W.POKE_GEN3_PECHE || null; },
      zones: function () { return W.POKE_GEN3_ZONES || W.POKE_ZONES; },
      lieux: function () { return W.POKE_GEN3_LIEUX || W.POKE_LIEUX; },
      versions: ["emeraude"],
      versionsNoms: { emeraude: { fr: "Émeraude", en: "Emerald" } },
      canon: [252, 255, 258],
      professeur: { fr: "Seko", en: "Birch" },
      visages: {
        arene: ["gen3/dresseur/arene1", "gen3/dresseur/arene2", "gen3/dresseur/arene3",
          "gen3/dresseur/arene4", "gen3/dresseur/arene5", "gen3/dresseur/arene6",
          "gen3/dresseur/arene7", "gen3/dresseur/arene8"],
        conseil: ["gen3/dresseur/conseil1", "gen3/dresseur/conseil2",
          "gen3/dresseur/conseil3", "gen3/dresseur/conseil4"],
        maitre: "gen3/dresseur/maitre",
      },
      maitre: function () { return W.POKE_GEN3_MAITRE || null; },
      equipes: function () { return W.POKE_GEN3_EQUIPES || null; },
      classesDresseur: function () { return W.POKE_GEN3_CLASSES || null; },
      rival: function () { return W.POKE_GEN3_RIVAL || null; },
      dresseurFinal: function () { return W.POKE_GEN3_STEVEN || null; },
      objetsTable: function () { return W.POKE_GEN3_OBJETS || null; },
      errants: function () { return W.POKE_GEN3_ERRANTS || null; },
      mythique: function () { return { n: 385, niveau: 30, lieu: "mossdeep-space-center" }; },
      conseil: function () { return W.POKE_GEN3_CONSEIL || W.POKE_CONSEIL; },
      echanges: function () { return W.POKE_GEN3_ECHANGES || null; },
      casino: function () { return W.POKE_GEN3_CASINO || null; },
      cadeaux: function () { return W.POKE_GEN3_CADEAUX || null; },
      fossiles: function () { return W.POKE_GEN3_FOSSILES || null; },
      speAtk: "sat",
      speDef: "sdf",
    };
  }

  var courant = DEFAUT;

  // 🔴 UNE PARTIE SANS `regles` EST UNE PARTIE DE LA GEN 1. Toutes celles qui
  //    existent aujourd'hui sont dans ce cas, et elles doivent continuer à se
  //    jouer exactement pareil. Le repli n'est pas une précaution d'écriture :
  //    c'est la compatibilité de toutes les sauvegardes en cours.
  function de(partie) {
    var r = partie && partie.regles;
    return r && JEUX[r] ? r : DEFAUT;
  }

  function poser(partieOuCle) {
    var cle = typeof partieOuCle === "string" ? partieOuCle : de(partieOuCle);
    courant = JEUX[cle] ? cle : DEFAUT;
    return courant;
  }

  function jeu() { return JEUX[courant] || JEUX[DEFAUT]; }

  W.PokeRegles = {
    DEFAUT: DEFAUT,
    //  La clé du monde POSÉ. Elle manquait, et chaque endroit qui avait besoin
    //  de savoir « où suis-je » le déduisait à sa façon — par le nombre
    //  d'espèces, par la présence d'une globale. Une question posée de six
    //  façons finit par recevoir six réponses.
    courante: function () { return courant || DEFAUT; },
    de: de,
    poser: poser,
    courant: function () { return courant; },
    existe: function (cle) { return !!JEUX[cle]; },
    cles: function () { return Object.keys(JEUX); },
    // Les lectures. Elles remplacent les accès directs aux globales, pour que
    // le jour où une seconde entrée arrive, il n'y ait rien à retrouver.
    types: function () { return jeu().types(); },
    typeNoms: function () { return jeu().typeNoms(); },
    table: function () { return jeu().table(); },
    speciaux: function () { return jeu().speciaux(); },
    especes: function () { return jeu().especes(); },
    // ═══════════════════════════════════════════════════════════════════════
    //  UNE ESPÈCE, QUEL QUE SOIT LE MONDE OÙ ELLE A ÉTÉ PRISE
    //
    //  🔴 L'ACCUEIL EST MORT — écran blanc, aucun bouton — dès qu'un compte a
    //     rapporté une créature de Johto. Sa vitrine montre les trois derniers
    //     Pokémon du COMPTE, et elle les cherchait dans la table du monde
    //     COURANT : hors voyage, c'est celle de 1996, qui s'arrête à la 151ᵉ.
    //     `ESP()[161]` rendait `undefined`, et lire `.types` dessus tuait la
    //     page avant le premier pixel.
    //
    //  🔑 LA COLLECTION APPARTIENT AU COMPTE, PAS AU VOYAGE — c'est la
    //     promesse affichée sur l'écran des mondes : « ton Pokédex est le même
    //     dans les deux ». Tout ce qui la LIT doit donc pouvoir nommer une
    //     espèce sans savoir d'où elle vient. C'est ce que fait cette porte :
    //     le monde courant d'abord, puis les autres, jusqu'à ce qu'un le
    //     connaisse.
    //  ⚠️ ELLE NE REMPLACE PAS `especes()`. Ce qui relève du VOYAGE — ce qu'on
    //     croise, ce qu'on peut attraper — doit continuer de lire la table du
    //     monde joué, sans quoi Johto se rencontrerait à Kanto.
    // ═══════════════════════════════════════════════════════════════════════
    especeToute: function (n) {
      var t = jeu().especes();
      if (t && t[n]) return t[n];
      for (var cle in JEUX) {
        var autre = JEUX[cle].especes();
        if (autre && autre[n]) return autre[n];
      }
      return null;
    },
    especesListe: function () { return jeu().especesListe(); },
    attaques: function () { return jeu().attaques(); },
    attaquesListe: function () { return jeu().attaquesListe(); },
    // ═══════════════════════════════════════════════════════════════════════
    //  LIRE UN JEU DE RÈGLES **NOMMÉ**, SANS CHANGER CELUI DE LA PARTIE
    //
    //  🔴 LE DUEL EN A BESOIN, ET LUI SEUL. C'est une arène de COMPARAISON :
    //     un scellé d'équipe encode ses attaques par leur RANG dans la table,
    //     et son empreinte dépend de cette table. Si le duel lisait le jeu de
    //     règles COURANT, un joueur revenu de Johto décoderait les scellés de
    //     Kanto avec la table de Johto — six équipes aux mauvais coups, et
    //     personne pour s'en apercevoir.
    //  🔑 On ne l'exempte donc pas du registre : on lui donne de quoi
    //     ÉPINGLER un jeu de règles et le dire. Une constante épinglée qui
    //     s'annonce vaut mieux qu'un accès direct qui se tait.
    // ═══════════════════════════════════════════════════════════════════════
    pour: function (cle) { return JEUX[cle] || JEUX[DEFAUT]; },
    dexTotal: function () { return jeu().dexTotal; },
    // ═══════════════════════════════════════════════════════════════════════
    //  LE TOTAL DU COMPTE N'EST PAS CELUI DU VOYAGE
    //
    //  🔑 *La collection appartient au compte, pas au voyage* — c'est déjà la
    //     règle qui a donné `especeToute`. Un joueur revenu de Johto garde ses
    //     251 espèces quand il repart à Kanto : lui afficher « 187 sur 151 »
    //     serait un compteur qui se contredit tout seul. Le total d'un COMPTE
    //     est donc celui du monde le plus large, quel que soit celui qu'on joue.
    //  ⚠️ Avec un seul monde ouvert — la production — il vaut exactement
    //     `dexTotal()`. Rien ne bouge là-bas.
    // ═══════════════════════════════════════════════════════════════════════
    dexTotalCompte: function () {
      var max = 0;
      for (var cle in JEUX) { if (JEUX[cle].dexTotal > max) max = JEUX[cle].dexTotal; }
      return max || jeu().dexTotal;
    },
    arenes: function () { return jeu().arenes(); },
    etapes: function () { return jeu().etapes(); },
    clesVoyage: function () { return jeu().clesVoyage(); },
    badgePourCS: function () { return jeu().badgePourCS ? jeu().badgePourCS() : {}; },
    badgesStat: function () { return jeu().badgesStat || JEUX[DEFAUT].badgesStat; },
    sons: function () { return jeu().sons ? jeu().sons() : W.POKE_SONS; },
    sonsAttaques: function () { return jeu().sonsAttaques ? jeu().sonsAttaques() : W.POKE_SONS; },
    peche: function () { return jeu().peche ? jeu().peche() : (W.POKE_PECHE || null); },
    // ═══════════════════════════════════════════════════════════════════════
    //  L'IDENTIFIANT QUE LES TABLES DE 1996 ACCEPTENT — SON ET ANIMATION
    //
    //  🔴 DEUX TABLES DE ROUGE/BLEU SONT NUMÉROTÉES PAR ATTAQUE : les sons
    //     (`sons.js`, 166 entrées) et les animations (`animations.js`, 203).
    //     Toutes deux DÉBORDENT des 165 attaques de 1996 : au-delà, ce sont des
    //     animations d'état et des bruitages qui n'appartiennent à aucun coup.
    //     Johto porte 251 attaques. Lui laisser employer son propre numéro
    //     ferait jouer à Dessin, Copie et Groz'Yeux trente-huit animations
    //     prises au hasard dans ce débord — plausibles à l'écran, fausses, et
    //     invisibles à la lecture.
    //  🔑 LA GARDE NE COMPTE PAS JUSQU'À 165 : elle VÉRIFIE L'IDENTITÉ. Le
    //     numéro n'est rendu que si l'attaque de Kanto qui le porte est la MÊME
    //     attaque. Un nombre écrit ici deviendrait faux le jour où l'ordre
    //     bouge ; une comparaison de clés, non.
    // ═══════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    //  QUEL NUMÉRO DE SON JOUER POUR UNE ATTAQUE
    //
    //  🔴 `idKanto` EST UN PIS-ALLER, ET IL LE RESTE POUR QUI N'A PAS DE BANQUE.
    //     Il a été écrit quand Johto n'avait aucun bruitage : il fait emprunter
    //     celui de Kanto, mais SEULEMENT quand c'est la même attaque — sans
    //     quoi trente-huit coups de 1999 auraient joué le son d'un état.
    //  🔑 UN MONDE QUI A SA PROPRE BANQUE N'EMPRUNTE RIEN. Johto a désormais
    //     ses 248 bruitages de Cristal : son attaque n°163 joue le n°163 de SA
    //     banque, et la garde d'identité n'a plus rien à garder.
    //  ⚠️ L'ÉCRAN NE DOIT PAS CHOISIR ENTRE LES DEUX : il demande, le registre
    //     répond. Deux appels différents dans deux écrans, c'est la divergence
    //     habituelle.
    // ═══════════════════════════════════════════════════════════════════════
    idSon: function (att) {
      if (!att || !att.id) return 0;
      var b = this.sonsAttaques();
      if (b && b.attaques && b.attaques[att.id]) return att.id;
      return this.idKanto(att);
    },
    idKanto: function (att) {
      if (!att || !att.id) return 0;
      var kanto = JEUX[DEFAUT].attaquesListe();
      var meme = kanto && kanto[att.id - 1];
      return meme && meme.cle === att.cle ? att.id : 0;
    },
    // ═══════════════════════════════════════════════════════════════════════
    //  LE SEXE D'UNE CRÉATURE — ET POURQUOI IL VIT ICI
    //
    //  🔴 1996 N'EN A PAS. Aucune créature de Rouge/Bleue n'a de sexe, aucune
    //     attaque ne le regarde ; cette fonction rend donc `null` sous le jeu
    //     par défaut, et rien du côté de Kanto ne change. C'est exactement la
    //     raison pour laquelle elle est dans le REGISTRE et pas dans le
    //     moteur : une créature n'a pas un sexe, elle a un sexe DANS UN MONDE.
    //  🔑 IL N'EST PAS TIRÉ AU SORT, IL EST DÉJÀ DANS LA CRÉATURE. La cartouche
    //     de 1999 compare le DV d'Attaque au quartet de poids fort du rapport
    //     de sexe de l'espèce : $7f (une chance sur deux) donne huit valeurs de
    //     DV sur seize. Aucun tirage neuf, donc, et le rejeu des graines ne
    //     bouge pas d'un cran — c'est ce qui permet d'ajouter Attraction sans
    //     invalider une seule partie enregistrée.
    //  ⚠️ DEUX CAS NE SONT PAS DES TAUX. `GENDER_F0` est « toujours mâle » (le
    //     lire comme un taux donnerait une femelle sur seize à Tauros), et
    //     `GENDER_UNKNOWN` est l'absence de sexe — vingt-et-une espèces, dont
    //     tous les légendaires, Métamorph et Porygon. Une attaque qui joue sur
    //     le sexe ne prend sur aucune des deux.
    // ═══════════════════════════════════════════════════════════════════════
    sexeDe: function (p) {
      if (!p) return null;
      var e = this.especes()[p.n];
      var r = e && e.sexe;
      if (!r || r === "GENDER_UNKNOWN") return null;
      if (r === "GENDER_F0") return "male";
      var octet = OCTET_DE_SEXE[r];
      if (octet === undefined) return null;
      var dv = p.dv && typeof p.dv.atk === "number" ? p.dv.atk : 0;
      return dv <= (octet >> 4) ? "femelle" : "male";
    },
    zones: function () { return jeu().zones(); },
    lieux: function () { return jeu().lieux(); },
    versions: function () { return jeu().versions || ["rouge", "bleu"]; },
    // ═══════════════════════════════════════════════════════════════════════
    //  TOUTES LES VERSIONS, TOUS MONDES CONFONDUS
    //
    //  🔴 MÊME RAISON QUE `dexTotalCompte`, ET MÊME DÉFAUT ÉVITÉ DE JUSTESSE :
    //     *la collection appartient au COMPTE, pas au voyage.* Une capture
    //     porte la version où elle a eu lieu — « cristal » pour Johto — et le
    //     nettoyage de `fusion.js` la comparait aux deux versions du VOYAGE
    //     COURANT. Toute prise de Johto ressortait donc étiquetée « rouge »,
    //     y compris en repassant par Kanto.
    //  🔑 On rend l'union, pas la liste du monde posé. Un monde qui s'ajoute
    //     élargit la porte sans que personne ne rouvre `fusion.js`.
    // ═══════════════════════════════════════════════════════════════════════
    //  Le nom d'une version, quel que soit le monde qui la porte : la carte de
    //  partage d'un voyage de Johto se lit depuis Kanto, et inversement.
    nomVersion: function (cle) {
      if (!cle) return "";
      var en = (W.POKE_LANG || "fr") === "en";
      for (var m in JEUX) {
        var t = JEUX[m].versionsNoms;
        if (t && t[cle]) return (en && t[cle].en) || t[cle].fr || "";
      }
      return "";
    },
    versionsToutes: function () {
      var vues = {}, out = [];
      for (var cle in JEUX) {
        var l = JEUX[cle].versions || [];
        for (var i = 0; i < l.length; i++) {
          if (!vues[l[i]]) { vues[l[i]] = 1; out.push(l[i]); }
        }
      }
      return out.length ? out : ["rouge", "bleu"];
    },
    canon: function () { return jeu().canon || [1, 4, 7]; },
    visages: function () { return jeu().visages || JEUX[DEFAUT].visages; },
    professeur: function (lang) {
      var p = jeu().professeur || JEUX[DEFAUT].professeur;
      return p[lang === "en" ? "en" : "fr"];
    },
    //  `null` = ce monde n'a pas de Maître nommé, et son dernier combat de
    //  Ligue revient au rival. Voir la note posée sur Kanto.
    maitre: function () { return jeu().maitre ? jeu().maitre() : null; },
    //  Le rival du monde, ordre des variantes compris. `null` = ce monde n'en a
    //  pas, et tout ce qui le lit doit savoir se taire.
    //  Les équipes de route du monde. Le repli sur 1996 est le dernier recours :
    //  un monde sans dresseurs ne poserait aucun combat de route.
    equipes: function () {
      return (jeu().equipes ? jeu().equipes() : null) || W.POKE_EQUIPES || null;
    },
    classesDresseur: function () {
      return (jeu().classesDresseur ? jeu().classesDresseur() : null) || W.POKE_CLASSES || null;
    },
    rival: function () { return jeu().rival ? jeu().rival() : null; },
    dresseurFinal: function () { return jeu().dresseurFinal ? jeu().dresseurFinal() : null; },
    tenus: function () { return jeu().tenus ? jeu().tenus() : null; },
    objetsTable: function () { return jeu().objetsTable ? jeu().objetsTable() : null; },
    // ═══════════════════════════════════════════════════════════════════════
    //  UN OBJET SE NOMME PAR LA PORTE   [20/08/2026]
    //
    //  🔴 SIGNALÉ PAR RAYHANE, CAPTURE À L'APPUI : « on dirait que la Pierre
    //     Foudre n'est pas traduite correctement ! » — l'écran de butin offrait
    //     « Pierre Feu » et, juste en dessous, « THUNDERSTONE ». La donnée était
    //     JUSTE des deux côtés : Johto écrit bien `{fr: "Pierre Foudre"}`. Ce
    //     qui était faux, c'est l'endroit où l'écran allait chercher — treize
    //     lignes lisaient `W.POKE_OBJETS`, la table de 1996, avec une clé de
    //     1999. Kanto range la pierre sous `THUNDER_STONE`, Johto sous
    //     `THUNDERSTONE` : la recherche échouait et l'écran repliait sur la clé.
    //  🔑 ET CE N'ÉTAIT PAS UN OBJET, C'EN ÉTAIT 94 SUR 140. Un joueur de
    //     Johto voyait donc les deux tiers de son sac écrits en majuscules
    //     anglaises. *Ce qui est recopié diverge* — treize fois ici.
    //  ⚠️ LE REPLI SUR KANTO EST VOULU : les deux mondes partagent des dizaines
    //     de clés identiques, et un objet de 1996 lu depuis Johto doit encore
    //     se nommer. Ce qui ne doit plus arriver, c'est l'inverse.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 UN OBJET PORTE LE MÊME NOM PARTOUT — signalé le 21/08 : « SUN_STONE
    //    pas traduit ». La recherche s'arrêtait à la table du monde COURANT
    //    puis à celle de Kanto. Un objet propre à Johto — Pierre Soleil, Pierre
    //    Stase, Baie Sitrus, Pierre Foudre — regardé depuis un écran qui tourne
    //    en règles de Kanto (l'accueil, le palmarès, la collection du compte)
    //    ne se trouvait nulle part, et `nomObjet` repliait sur la CLÉ BRUTE.
    //  ⚠️ C'est la même famille que le défaut de Rayhane du 20/08, d'un cran
    //    plus haut : lui voyait « THUNDERSTONE » parce que les deux mondes ne
    //    nomment pas la clé pareil ; ici la clé est bonne et c'est le MONDE
    //    interrogé qui ne l'est pas. Un nom d'objet ne dépend pas de l'endroit
    //    d'où on le regarde.
    //  ⚠️ L'ORDRE COMPTE ET NE CHANGE PAS : le monde courant d'abord. Là où les
    //    deux tables portent la même clé avec des prix différents, c'est bien
    //    celle du voyage en cours qui doit gagner.
    objet: function (cle) {
      if (!cle) return null;
      var t = jeu().objetsTable ? jeu().objetsTable() : null;
      if (t && t[cle]) return t[cle];
      if (W.POKE_OBJETS && W.POKE_OBJETS[cle]) return W.POKE_OBJETS[cle];
      if (W.POKE_GEN2_OBJETS && W.POKE_GEN2_OBJETS[cle]) return W.POKE_GEN2_OBJETS[cle];
      if (W.POKE_GEN3_OBJETS && W.POKE_GEN3_OBJETS[cle]) return W.POKE_GEN3_OBJETS[cle];
      return null;
    },
    //  Le nom d'un objet dans la langue courante, ou sa clé si l'objet
    //  n'existe nulle part — et ce cas-là est un défaut, pas un repli.
    nomObjet: function (cle) {
      var o = this.objet(cle);
      if (!o || !o.nom) return String(cle || "");
      return o.nom[W.POKE_LANG === "en" ? "en" : "fr"] || o.nom.fr || String(cle);
    },
    effetsNeufs: function () { return jeu().effetsNeufs ? jeu().effetsNeufs() : null; },
    errants: function () { return jeu().errants(); },
    //  ⚠️ Un monde ecrit avant cette porte n'a pas la fonction : il n'a pas de
    //     mythique, et tout ce qui le concerne se tait de lui-meme.
    mythique: function () { return jeu().mythique ? jeu().mythique() : null; },
    conseil: function () { return jeu().conseil(); },
    // ── Les scènes du monde courant ───────────────────────────────────────
    //  ⚠️ `jeu().x ? … : null` et non `jeu().x()` : une entrée de registre
    //     écrite avant ces portes n'a pas la fonction, et une partie en cours
    //     ne doit pas s'arrêter sur un monde qui ignore la question.
    echanges: function () { return jeu().echanges ? jeu().echanges() : null; },
    casino: function () { return jeu().casino ? jeu().casino() : null; },
    cadeaux: function () { return jeu().cadeaux ? jeu().cadeaux() : null; },
    fossiles: function () { return jeu().fossiles ? jeu().fossiles() : null; },
    dojo: function () { return jeu().dojo ? jeu().dojo() : null; },
    ambre: function () { return jeu().ambre ? jeu().ambre() : null; },
    statiques: function () { return jeu().statiques ? jeu().statiques() : null; },
    concours: function () { return jeu().concours ? jeu().concours() : null; },
    arbres: function () { return jeu().arbres ? jeu().arbres() : null; },
    oeufs: function () { return jeu().oeufs ? jeu().oeufs() : null; },
    // Le NOM de la statistique à lire, jamais la valeur : c'est l'appelant qui
    // sait sur quelle créature il travaille.
    speAtk: function () { return jeu().speAtk || "spe"; },
    speDef: function () { return jeu().speDef || "spe"; },
    // Les statistiques dérivées d'un jeu de règles, dans l'ordre. Un seul
    // endroit les énumère — `calculerStats`, les paliers et les objets de
    // combat s'y accordent au lieu de tenir chacun sa liste.
    stats: function () {
      var j = jeu(), l = ["pv", "atk", "def", "vit", j.speAtk || "spe"];
      if ((j.speDef || "spe") !== (j.speAtk || "spe")) l.push(j.speDef);
      return l;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
