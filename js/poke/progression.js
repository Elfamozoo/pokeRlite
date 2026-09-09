(function (W) {
  "use strict";
  // ⚠️ PAR LE REGISTRE : Johto a ses huit arènes et son Conseil 4, et une
  //    lecture directe aurait envoyé un dresseur de Johto affronter Pierre.
  var ARENES = function () { return (W.PokeRegles && W.PokeRegles.arenes()) || W.POKE_ARENES || []; };
  var CONSEIL = function () { return (W.PokeRegles && W.PokeRegles.conseil()) || W.POKE_CONSEIL || []; };
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA PROGRESSION DE COMPTE — CE QUI SURVIT AUX CARRIÈRES
  //
  //  Demande du propriétaire : « si ça doit reset à chaque carrière c'est pas
  //  fun ». Arbitrage rendu le 07/08/2026, et il porte sur l'OBJET :
  //
  //  🔴 LES NIVEAUX NE PERSISTENT PAS. Chaque voyage démarrerait plus fort que
  //     le précédent, la tension disparaîtrait, et le Défi du jour deviendrait
  //     inéquitable — or la règle du projet est que rien ne donne l'avantage au
  //     défi ni au classement.
  //
  //  ✅ CE QUI PERSISTE, C'EST LA COLLECTION :
  //     · le POKÉDEX — vus et capturés s'accumulent entre TOUTES les carrières ;
  //     · le PC DE LÉO — les captures rejoignent une boîte de compte ;
  //     · les DÉBLOCAGES — règles de voyage, Balls de départ ;
  //     · UN COMPAGNON ramenable en carrière libre, ramené au niveau du voyage.
  //
  //  Pourquoi ça marche ICI précisément : avec l'exclusivité de version, seules
  //  98 espèces sur 151 sont atteignables dans une partie. Compléter le Pokédex
  //  devient un objectif de COMPTE, pas de partie — et chaque voyage y
  //  contribue. La version tirée à chaque carrière pousse à rejouer pour aller
  //  chercher ce que l'autre ne donne pas. C'est l'échange de 1996, transposé.
  // ═══════════════════════════════════════════════════════════════════════════

  var CLE = "poke_progress";

  function vide() {
    return {
      v: 1,
      vus: {},        // n → true
      pris: {},       // n → { zone, niveau, version, quand }
      boite: [],      // le journal de collection : une ligne par espèce, avec son surnom
      //  🔴 `pc` EST LA RÉSERVE, `boite` EST LE JOURNAL. Deux choses distinctes
      //     qui portaient le même nom : `boite` ne garde qu'une ligne par espèce
      //     « sans leur niveau de jeu », donc on ne pouvait ni revoir un Pokémon
      //     élevé ni en garder deux. Le PC, lui, garde des INDIVIDUS, toutes
      //     parties confondues, et c'est lui qui compose l'équipe de duel.
      pc: [],
      // Un diplome par monde. `diplome` (au singulier) reste celui de Kanto,
      // pose avant qu'il y ait deux mondes.
      diplomes: {},
      voyages: 0,
      ligues: 0,
      badgesMax: 0,
      meilleurScore: 0,
      // ── LA COLLECTION CESSE D'ÊTRE UNE CASE À COCHER ─────────────────────
      //  🔴 UN POKÉDEX BINAIRE S'ARRÊTE À LA PREMIÈRE PRISE. Une fois le
      //     Rattata coché, plus aucun Rattata n'a d'intérêt — et on en croise
      //     quarante par voyage. En gardant le MEILLEUR exemplaire vu de chaque
      //     espèce, chaque rencontre reste une occasion : celui-ci sera-t-il
      //     meilleur que le mien ? C'est ce qui fait tenir une collection.
      chromatiques: {},   // n → { quand, version } — une chance sur 8192
      meilleurDV: {},     // n → somme sur 60 du meilleur exemplaire tenu
      regles: { voyage: true },  // les règles débloquées
      // ═══════════════════════════════════════════════════════════════════════
      //  CE QU'UN VOYAGE PERDU LAISSE — LE PIED QUI MANQUAIT
      //
      //  🔴 MESURÉ LE 14/08, SUR 50 COMPTES VIERGES : un premier voyage mort à
      //     l'acte 1 (28 % des cas) rapportait **2,5 espèces** ; le premier
      //     acquis de compte en demande 25. Dix morts précoces pour débloquer sa
      //     première chose permanente — personne ne va jusque-là. Pendant ce
      //     temps le voyage GAGNÉ en rapportait 15,5, à qui n'en avait plus
      //     besoin. La méta récompensait la victoire, pas le jeu : l'inverse
      //     d'un roguelite.
      //  🔑 LES TROIS PIEDS DU GENRE. Variété, PUISSANCE, difficulté qui
      //     re-durcit. Ce mode avait la variété (le vivier, 75 crans) et la
      //     difficulté (les sceaux, 8 crans) — et il JETAIT sa puissance :
      //     les acquis, choisis parmi trois, permanents dans le voyage… et
      //     effacés à la fin. On garde donc, et c'est tout le pilier.
      //  ⚠️ PLAFOND À UN, et la mesure m'a démenti : j'avais tranché deux. Le
      //     tableau est en tête de `GARDES_MAX` — 0 → 54,7 % de badges, 1 →
      //     63,4 %, 2 → 68,6 %, 3 → 82,6 %. À un, le gain se sent (+10 points)
      //     sans effondrer la courbe, et il laisse la place aux sceaux qui
      //     durcissent en face : c'est là que difficulté et envie de relancer se
      //     rejoignent.
      //  ⚠️ JAMAIS AU DÉFI DU JOUR — règle du mode : aucun avantage acquis hors
      //     partie ne pèse là où l'on se compare.
      // ═══════════════════════════════════════════════════════════════════════
      gardes: [],                // ids d'acquis emportés au voyage suivant
      compagnon: null,           // { n } — un seul, et jamais au Défi du jour
      // ── CE QU'ON EMPORTE AU DUEL ───────────────────────────────────────────
      //  🔴 UNE ÉQUIPE DE DUEL NE SE COMPOSE PAS À PART. Elle est le SOUVENIR du
      //     voyage le plus loin mené : c'est ce qui relie le PvP au reste du
      //     mode. Aller plus loin, c'est se présenter plus fort — et un mode PvP
      //     dont la préparation est un menu à cocher ne donne envie de rien.
      duel: null,     // { scelle, nom, badges, quand }
      rivaux: [],     // le carnet : { cle, nom, scelle, v, d, vu }
      // 🔴 LES DÉFIS CANON NE SONT PAS DES RIVAUX, et ils ne partagent pas leur
      //    liste. Un Champion n'a pas de code à recoller, son équipe se rebâtit
      //    depuis la donnée à chaque fois — la stocker ici la ferait diverger de
      //    `POKE_ARENES` au premier ajustement. On ne garde que le palmarès.
      defis: {},      // id → { v, d }
      // 🔴 LE COMPTE SE SOUVIENT DU GENRE, et il le doit. `T()` lit
      //    `partie.genre` — or l'accueil, l'écran de duel et le classement se
      //    rendent SANS partie. Résultat : une joueuse qui a fait six voyages
      //    revenait sur un accueil qui lui disait « dresseur », et le mode a
      //    tout un système d'accord construit pour éviter exactement ça.
      genre: null,
      // 🔴 UN SEUL ESSAI PAR JOUR, ET C'EST TOUTE LA TENSION DU DÉFI. Sans cette
      //    mémoire, on rejouerait la même graine jusqu'à tomber sur la bonne
      //    suite de tirages — et le classement ne comparerait plus des joueurs
      //    mais des nombres de tentatives.
      defiJour: null,   // { date, score, badges, fini }
      // 🔴 SANS SÉRIE, UN DÉFI QUOTIDIEN N'A AUCUNE RAISON DE REVENIR. Le
      //    classement est vide tant que le mode est fermé : la seule chose qui
      //    puisse tenir un joueur d'un jour à l'autre, c'est SON propre compte
      //    de jours d'affilée. Il ne demande aucun serveur.
      defiHisto: [],    // les 30 derniers, du plus ancien au plus récent
      // 🔴 LES CHASSES : id → date d'accomplissement. Elles ouvrent les neuf
      //    serments sous verrou, et c'est ce qui fait qu'un voyage perdu
      //    rapporte quand même. Voir js/poke/chasses.js.
      chasses: {},
      // 🔴 LE PLUS HAUT SCEAU FRANCHI. Zéro veut dire « la Ligue n'a jamais été
      //    battue » : le premier sceau ne s'ouvre qu'à la première victoire.
      //    On garde le MAXIMUM, jamais le dernier joué — sinon redescendre d'un
      //    palier pour souffler effacerait ce qu'on a prouvé.
      sceauMax: 0,
      // Le palier qui vient de s'ouvrir, s'il y en a un. Écrit par `cloturer`,
      // lu par l'écran de fin — même vie que `chassesNeuves` : il ne vaut que
      // pour l'écran qui suit la clôture.
      sceauNeuf: 0,
    };
  }

  function lire() {
    try {
      var brut = W.localStorage.getItem(CLE);
      if (!brut) return vide();
      var p = JSON.parse(brut);
      // Une sauvegarde d'une version antérieure se complète, elle ne s'écrase
      // pas : un joueur ne perd jamais sa collection à une mise à jour.
      var d = vide(), k;
      for (k in d) if (!(k in p)) p[k] = d[k];
      return p;
    } catch (e) {
      return vide();
    }
  }

  function ecrire(p) {
    try { W.localStorage.setItem(CLE, JSON.stringify(p)); return true; }
    catch (e) { return false; }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DEUX GESTES, ET ILS ÉTAIENT CONFONDUS
  //
  //  🔴 `fusionner` ÉTAIT APPELÉE À CHAQUE COMBAT ET À CHAQUE BUTIN — c'est
  //     voulu, la collection doit survivre à un onglet fermé au milieu d'un
  //     voyage. Mais elle incrémentait aussi `voyages` et `ligues` au passage.
  //     Résultat : `voyages` comptait les COMBATS, et une ligue gagnée valait
  //     deux ligues (la fin du dernier combat, puis l'écran de fin).
  //
  //     Aucun de ces compteurs n'est affiché aujourd'hui, donc rien ne l'a
  //     signalé — et c'est exactement pour ça que c'est grave : le jour où on
  //     affiche « 47 voyages » à un joueur qui en a fait six, la faute a des
  //     mois. Un compteur qui ment est pire qu'un compteur absent.
  //
  //  On sépare donc ce qui se répète de ce qui n'arrive qu'une fois :
  //    · `fusionner` ENRICHIT — idempotente, appelable à volonté ;
  //    · `cloturer` COMPTE — une seule fois par voyage, et elle se verrouille.
  // ═══════════════════════════════════════════════════════════════════════════

  //  🔴 NON DESTRUCTIVE, et dans un seul sens : le voyage ENRICHIT le compte, il
  //     ne le remplace jamais. Une partie ratée ne fait pas perdre ce qui a été
  //     vu avant — c'est tout l'intérêt d'une collection.
  function fusionner(partie, quand) {
    var p = lire();
    var n;
    // 🔴 AUCUN DES SIX APPELANTS NE PASSE `quand`. Le paramètre existait, la
    //    colonne était prévue dans la fiche de prise — et la date valait
    //    `null` sur toutes les captures depuis le premier jour. Un champ
    //    facultatif que personne ne remplit n'est pas facultatif : il est
    //    mort. On le prend ici, comme l'éclat le fait déjà deux lignes plus
    //    bas. Les vieux comptes gardent leur `null` : la ligne se tait.
    if (!quand) quand = Date.now();
    if (partie.genre) p.genre = partie.genre;
    for (n in partie.vus) if (!p.vus[n]) p.vus[n] = true;
    for (n in partie.pris) {
      if (p.pris[n]) continue;
      p.pris[n] = {
        zone: partie.pris[n].zone, niveau: partie.pris[n].niveau,
        version: partie.version, quand: quand || null,
      };
      p.vus[n] = true;
    }
    // Le PC de Léo garde l'espèce et son surnom, pas sa puissance. On collectionne
    // des Pokémon, on ne stocke pas une équipe.
    var equipe = (partie.equipe || []).concat(partie.boite || []);
    for (var i = 0; i < equipe.length; i++) {
      var m = equipe[i];
      var deja = null;
      for (var k = 0; k < p.boite.length; k++) if (p.boite[k].n === m.n) { deja = p.boite[k]; break; }
      // ⚠️ PAS DE `version` ICI. Elle y a dormi sans lecteur : la provenance
      //    d'une capture vit déjà dans `p.pris[n].version`, qui, elle, est
      //    affichée. Deux fois la même donnée, dont une que personne ne lit,
      //    c'est un champ à migrer le jour où le format bouge, et rien d'autre.
      if (!deja) p.boite.push({ n: m.n, surnom: m.surnom || null });
      // 🔴 UN RENOMMAGE SUIT. Sans ça le PREMIER nom se figeait pour toujours :
      //    rebaptiser son Salamèche au voyage suivant n'aurait rien changé, et
      //    le champ pré-rempli aurait ressorti l'ancien nom à chaque départ.
      else if (m.surnom && m.surnom !== deja.surnom) deja.surnom = m.surnom;

      // ── L'ÉCLAT SE GARDE ────────────────────────────────────────────────
      // 🔴 UNE RARETÉ SANS TRACE N'EST PAS UNE RARETÉ. Un chromatique tombe
      //    une fois sur 8192 : s'il disparaît avec la partie, la chance d'une
      //    vie de joueur ne laisse rien derrière elle. Il se garde donc sur le
      //    COMPTE — c'est ce qui rend la rareté atteignable sans la banaliser.
      if (!W.PokeEclat || !m.dv) continue;
      var e = W.PokeEclat.lire(m);
      if (e.chromatique && !p.chromatiques[m.n]) {
        p.chromatiques[m.n] = { quand: quand || Date.now(), version: partie.version };
      }
      if (!(p.meilleurDV[m.n] >= e.somme)) p.meilleurDV[m.n] = e.somme;
    }
    ecrire(p);
    return p;
  }

  // ── La clôture, UNE fois par voyage ────────────────────────────────────────
  //  🔴 ELLE SE VERROUILLE SUR LA PARTIE. Le drapeau vit sur `partie`, pas dans
  //     le compte : deux voyages différents doivent compter deux fois, un même
  //     voyage clôturé deux fois ne doit compter qu'une.
  function cloturer(partie, quand) {
    var p = fusionner(partie, quand);
    if (partie._clos) return p;
    partie._clos = true;
    p.voyages++;
    if (partie.ligueGagnee) p.ligues++;
    p.badgesMax = Math.max(p.badgesMax, (partie.badges || []).length);
    var s = W.PokePartie ? W.PokePartie.score(partie) : 0;
    p.meilleurScore = Math.max(p.meilleurScore, s);

    // Les déblocages. Ils s'ouvrent sur des faits, jamais sur un compteur de
    // parties : jouer beaucoup ne vaut pas jouer bien.
    if (p.badgesMax >= 4) p.regles.express = true;
    if (p.ligues >= 1) p.regles.nuzlocke = true;

    // ═══════════════════════════════════════════════════════════════════════
    //  LE SCEAU SUIVANT S'OUVRE EN FRANCHISSANT LA LIGUE, ET SEULEMENT LÀ
    //
    //  🔴 UN PALIER SE GAGNE, IL NE SE CHOISIT PAS DANS UN MENU. C'est ce qui
    //     lui donne son sens : « je suis au Sceau 4 » raconte quatre Ligues.
    //     Ouvrir les huit d'un coup en aurait fait un curseur de difficulté,
    //     et un curseur ne se raconte pas.
    //  ⚠️ ON N'OUVRE QUE LE SUIVANT, ET DEPUIS CELUI QU'ON VIENT DE JOUER.
    //     Battre la Ligue au Sceau 2 alors qu'on avait déjà le 5 ne redescend
    //     rien : c'est un maximum, pas un compteur.
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 ET IL MONTAIT EN SILENCE. `sceauMax` s'incrémentait ici, l'écran de fin
    //    n'en disait rien, et le palier neuf n'apparaissait qu'au prochain écran
    //    de départ — pour qui pensait à regarder. C'est-à-dire que la seule
    //    récompense PERMANENTE de la victoire, celle qui donne au mode ses huit
    //    crans de rejeu, arrivait sans un mot. La classe est connue : le jeu
    //    sait, et il ne dit pas. On note donc le palier ouvert, comme on note
    //    les chasses neuves quinze lignes plus bas.
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 L'ÉCHELLE ÉTAIT FERMÉE À QUATRE JOUEURS SUR CINQ — 14/08, mesuré.
    //     Un cran ne s'ouvrait qu'en GAGNANT LA LIGUE : 13 à 23 % des voyages.
    //     Or l'échelle EST le long jeu du mode — huit crans de contenu vétéran,
    //     bâtis pour qu'on relance en boucle — et sa porte était le combat le
    //     plus dur qui existe. Le contenu prévu pour retenir tout le monde
    //     n'était visible que par ceux qui n'en avaient plus besoin.
    //  ✅ LA ROUTE DES BADGES OUVRE L'ÉCHELLE ; LA LIGUE RESTE LA VRAIE FIN.
    //     Décrocher les huit badges suffit désormais à monter d'un cran (25 à
    //     32 % des voyages). La Ligue garde tout ce qui la distingue : son
    //     multiplicateur de score, sa règle sans soin, et le fait qu'elle est
    //     la seule vraie victoire. Ce qu'elle perd, c'est le MONOPOLE sur la
    //     progression permanente — et c'est ce monopole qui étouffait le mode.
    //  ⚠️ UN SEUL CRAN PAR VOYAGE, comme avant : c'est la règle qui fait qu'un
    //     palier veut dire quelque chose. Grimper les huit demande donc huit
    //     voyages aboutis — et chaque cran durcit le suivant, donc l'échelle se
    //     défend toute seule.
    // ═══════════════════════════════════════════════════════════════════════
    p.sceauNeuf = 0;
    var routeFinie = partie.ligueGagnee ||
      ((partie.badges || []).length >= (ARENES() ? ARENES().length : 8));
    if (routeFinie) {
      var joue = partie.sceau || 0;
      var plafond = W.PokeSceaux ? W.PokeSceaux.nombre() : 8;
      if (joue >= p.sceauMax) {
        var avant = p.sceauMax;
        p.sceauMax = Math.min(plafond, joue + 1);
        if (p.sceauMax > avant) p.sceauNeuf = p.sceauMax;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LES CHASSES SE JUGENT ICI, ET NULLE PART AILLEURS
    //
    //  🔴 C'EST LE SEUL ENDROIT DU MODE OÙ UN VOYAGE DEVIENT DU PERMANENT, et
    //     il fallait qu'il n'y en ait qu'un. `cloturer` est déjà la porte qui
    //     compte les voyages, les ligues et le meilleur score : y ajouter les
    //     chasses garantit qu'elles sont jugées exactement une fois, sur le
    //     même bilan que le reste, et qu'aucun écran ne peut les déclencher
    //     deux fois. Le garde `partie._clos` au-dessus les protège aussi.
    //
    //  🔴 ON ENREGISTRE LA DATE, PAS UN BOOLÉEN. Une chasse accomplie a une
    //     histoire — le carnet peut dire quand, et un jour un classement
    //     pourra dire qui l'a ouverte le premier. Un `true` aurait fermé cette
    //     porte pour rien.
    // ═══════════════════════════════════════════════════════════════════════
    p.chassesNeuves = [];
    if (W.PokeChasses && W.PokePartie) {
      var bilan = W.PokePartie.bilan(partie);
      var neuves = W.PokeChasses.evaluer(bilan, { chasses: p.chasses, pris: Object.keys(p.pris).length });
      for (var i = 0; i < neuves.length; i++) {
        p.chasses[neuves[i].id] = quand || Date.now();
        p.chassesNeuves.push(neuves[i].id);
      }
    }
    ecrire(p);
    return p;
  }

  // 🔴 PORTE UNIQUE VERS LES SERMENTS SOUS VERROU. La partie ne lit jamais la
  //    table des chasses elle-même : elle demande ici, une fois, au départ.
  //    ⚠️ Le Défi du jour n'appelle PAS cette porte — il joue le pool de base,
  //       sans quoi deux joueurs ne compareraient plus le même voyage.
  function sermentsOuverts() {
    if (!W.PokeChasses) return {};
    return W.PokeChasses.sermentsOuverts(lire());
  }

  // (Pas de porte `chasses()` : l'écran du carnet lit `lire().chasses` avec le
  //  reste du compte, en une fois. Une porte de plus pour un champ déjà
  //  accessible n'aurait rien gardé — le détecteur de portes mortes l'a
  //  refusée dans la minute, et il a raison.)

  // Ce que la collection vaut, au-delà du nombre d'espèces. C'est la porte
  // unique : les écrans ne recomptent rien eux-mêmes.
  function releve() {
    var p = lire();
    var n, chromatiques = 0, parfaits = 0, sommeDV = 0, notes = 0;
    for (n in p.chromatiques) chromatiques++;
    for (n in p.meilleurDV) { notes++; sommeDV += p.meilleurDV[n]; if (p.meilleurDV[n] >= 60) parfaits++; }
    return {
      chromatiques: chromatiques,
      parfaits: parfaits,
      notes: notes,
      moyenneDV: notes ? Math.round((sommeDV / notes) * 10) / 10 : 0,
      voyages: p.voyages, ligues: p.ligues, badgesMax: p.badgesMax,
    };
  }

  function comptePokedex() {
    var p = lire();
    // 🔴 CE COMPTEUR-LÀ EST CELUI DU COMPTE, PAS DU VOYAGE. Il lisait le total
    //    du monde COURANT : un joueur revenu de Johto avec 187 espèces lisait
    //    « 187 sur 151 » dès qu'il repartait à Kanto. Le total d'une collection
    //    est celui du monde le plus large. (Un seul monde ouvert : rien ne
    //    change.)
    return { vus: Object.keys(p.vus).length, pris: Object.keys(p.pris).length,
             total: W.PokeRegles ? W.PokeRegles.dexTotalCompte() : 151 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PALMARÈS — CE QU'UNE CARRIÈRE MONTRE À UNE AUTRE
  //
  //  🔴 LE MODE N'AVAIT AUCUNE FAÇON DE SE COMPARER SANS SERVEUR. Le classement
  //     existe, il est juste, et il est VIDE : rien ne s'y écrit tant que le mode
  //     est fermé. Le duel, lui, se joue déjà de code à code, sans serveur, parce
  //     qu'il rejoue le combat des deux côtés. Toute la comparaison de fin de jeu
  //     tenait donc à une chose qui manquait : le code ne portait que l'ÉQUIPE,
  //     pas la CARRIÈRE. Deux joueurs échangeaient six Pokémon et ne savaient
  //     rien l'un de l'autre.
  //
  //  🔴 ON NE CRÉE PAS UN SECOND CODE. Un deuxième bouton « copier », un deuxième
  //     champ à coller, un deuxième refus à écrire : c'est le même geste fait
  //     deux fois, et c'est comme ça qu'on obtient deux vérités sur le même
  //     joueur. Le palmarès voyage DANS le code de duel, en queue, facultatif.
  //
  //  🔴 IL NE PÈSE SUR RIEN. Ni sur le scellé, ni sur la validation, ni sur le
  //     combat : `PokeDuel.valider` ne le voit pas et `reconstituer` ne le lit
  //     pas. C'est la règle du mode — rien ne pèse là où l'on se compare — et
  //     `tools/poke-palmares.mjs` la vérifie au lieu de la supposer.
  //
  //  ⚠️ QUE DU PERMANENT, JAMAIS DU VOYAGE EN COURS. Un palmarès qui bougerait
  //     pendant une partie ferait d'un code copié le matin un mensonge le soir.
  // ═══════════════════════════════════════════════════════════════════════════
  function palmares() {
    var p = lire();
    var n, chromatiques = 0, chasses = 0;
    for (n in p.chromatiques) chromatiques++;
    for (n in p.chasses) chasses++;
    return {
      v: 1,
      voyages: p.voyages | 0,
      ligues: p.ligues | 0,
      badges: p.badgesMax | 0,
      score: p.meilleurScore | 0,
      pokedex: Object.keys(p.pris).length,
      chromatiques: chromatiques,
      sceau: p.sceauMax | 0,
      chasses: chasses,
      rang: rang().cle,
      diplome: p.diplome ? 1 : 0,
    };
  }

  // ── LE DIPLÔME DU POKÉDEX ──────────────────────────────────────────────────
  //  🔴 C'EST CE QUI DONNE UN SENS AU POKÉDEX DE COMPTE. Sans lui, remplir la
  //     collection ne rapporte rien du tout : le joueur accumule des numéros et
  //     le jeu ne le remarque jamais. Le Professeur Chen remet ce diplôme dans
  //     le jeu d'origine, et c'est le seul but à très long terme du mode.
  //
  //  🔴 MEW N'EST PAS EXIGÉ. Il n'est pas obtenable légitimement en Rouge/Bleu
  //     — `poke-injoignable` le dit d'ailleurs. Exiger 151 rendrait le diplôme
  //     inatteignable, c'est-à-dire décoratif. Le seuil est donc 150, et le
  //     jeu d'origine fait exactement ce compte.
  var DIPLOME_SEUIL = 150;

  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 [24/08] LE DIPLÔME COMPTAIT JOHTO DANS UN SEUIL DE KANTO
  // ---------------------------------------------------------------------------
  //  Syrean, le 21/08 : « Je viens d'attraper Mew, sans avoir le dex de Kanto
  //  complet. » Il disait vrai. Ce compte lisait `comptePokedex().pris`,
  //  c'est-à-dire TOUTES les espèces du compte, tous mondes confondus. Depuis
  //  l'ouverture de Johto, 100 espèces de Kanto plus 50 de Johto font 150 :
  //  le diplôme tombait, et avec lui la chasse à Mew — dont tout le mythe est
  //  d'être ce qui reste QUAND KANTO EST FINI.
  //  🔑 UN SEUIL ET SON COMPTEUR DOIVENT PARLER DU MÊME MONDE. Le seuil est
  //     resté celui de 1996 pendant que le compteur suivait le monde le plus
  //     large — et rien ne le disait, parce que les deux nombres avaient l'air
  //     comparables. Le commentaire de `comptePokedex` décrivait déjà le cas
  //     (« un joueur revenu de Johto avec 187 espèces ») sans voir qu'il
  //     traversait jusqu'ici.
  //  ⚠️ ON NE TOUCHE PAS À `comptePokedex` : le POKÉDEX doit bien afficher la
  //     collection entière. C'est le DIPLÔME qui porte sur Kanto, et lui seul.
  //  ⚠️ 1 À 150, MEW EXCLU : il est le 151ᵉ et il n'est pas exigé — l'exiger
  //     rendrait son propre déblocage impossible.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 [24/08, second passage] LE SEUIL NE S'ÉCRIT PLUS : IL SE CALCULE
  // ---------------------------------------------------------------------------
  //  Premier correctif du soir : compter Kanto seul, avec un `n <= 150` écrit à
  //  la main. Juste, et déjà périmé — le jour où Johto veut son propre diplôme,
  //  il faut un second nombre, puis un troisième. Et un nombre écrit à la main
  //  ment dès qu'on touche au monde : j'ai rendu Minidraco et Léviator
  //  obtenables ce soir même, à deux heures d'intervalle.
  //
  //  🔑 LE JEU SAIT DÉJÀ RÉPONDRE. `PokeObtenir.ouTrouver` lit les tables du
  //     monde COURANT et dit par où une espèce s'obtient. Une espèce sans
  //     aucune piste n'est pas obtenable : le seuil, c'est le nombre de celles
  //     qui en ont au moins une, réunies sur toutes les versions du monde.
  //  ✅ ET LA PREUVE EST DANS LE CHIFFRE : ce calcul rend 150 pour Kanto —
  //     exactement le seuil écrit en dur depuis le premier jour — et 214 pour
  //     Johto. La généralisation n'invente rien, elle retrouve l'existant.
  //  ⚠️ RÉUNIES SUR LES VERSIONS, et il n'y a pas le choix : Rouge et Bleue en
  //     rendent 144 chacune, et leurs exclusivités ne sont pas les mêmes. Le
  //     Pokédex du COMPTE traverse plusieurs voyages, donc plusieurs versions.
  //  ⚠️ CALCULÉ UNE FOIS PAR MONDE, puis gardé. 251 espèces × les tables, c'est
  //     trop pour le refaire à chaque ouverture d'écran.
  // ═══════════════════════════════════════════════════════════════════════════
  var _obtenables = {};

  function mondeCourant() {
    return (W.PokeRegles && W.PokeRegles.courante && W.PokeRegles.courante()) || "gen1";
  }

  //  ⚠️ LE MONDE SE PASSE PAR SON NOM, ET IL LE FAUT. L'ecran de creation
  //     demande le diplome du monde qu'on VA jouer, alors que `poser` n'a lieu
  //     qu'apres -- lire le monde courant rendrait celui de l'onglet. C'est la
  //     meme porte que `PokePartie.creer`, pour la meme raison.
  function obtenablesDuMonde(cle) {
    cle = cle || mondeCourant();
    if (_obtenables[cle]) return _obtenables[cle];
    var jeu = W.PokeRegles && W.PokeRegles.pour ? W.PokeRegles.pour(cle) : null;
    var dedans = {}, n = 0;
    var total = (jeu && jeu.dexTotal) || 151;
    var versions = (jeu && jeu.versions) || ["rouge", "bleu"];
    // ═══════════════════════════════════════════════════════════════════════
    //  🔴 `ouTrouver` LIT LE MONDE POSE, PAS CELUI QU'ON LUI NOMME. Ses tables
    //     passent par `PokeRegles.zones()` et `etapes()`, qui rendent celles du
    //     jeu COURANT. Demander les obtenables de Johto pendant que Kanto est
    //     pose rendait 105 au lieu de 214 -- et la reponse fausse partait au
    //     cache pour le reste de la session.
    //  🔑 ON POSE LE MONDE LE TEMPS DU CALCUL, ET ON LE REMET. C'est
    //     synchrone, ca n'ecrit rien, et le calcul n'a lieu qu'UNE fois par
    //     monde. L'alternative -- rendre `ouTrouver` adressable -- toucherait
    //     six appelants pour le meme resultat.
    //  ⚠️ ET ON REMET MEME SI CA CASSE : sortir d'ici sur un autre monde que
    //     celui de l'onglet ferait jouer la partie suivante dans le mauvais.
    // ═══════════════════════════════════════════════════════════════════════
    var avant = mondeCourant();
    try {
      if (W.PokeRegles && W.PokeRegles.poser && cle !== avant) W.PokeRegles.poser(cle);
      // ═══════════════════════════════════════════════════════════════════
      //  🔴 UNE ÉVOLUTION NE COMPTE QUE SI SA SOURCE S'ATTRAPE. `ouTrouver`
      //     annonce « évolue de Wattouat » pour Lainergie sans regarder si
      //     Wattouat existe quelque part dans ce monde — une piste juste, un
      //     chemin mort. Compté tel quel, le seuil de Johto montait à 224 pour
      //     206 espèces réellement prenables : un diplôme IMPOSSIBLE, donc un
      //     Célébi que personne n'aurait jamais ouvert. Exactement le
      //     « objectif décoratif » que ce fichier refuse pour Mew.
      //  🔑 LES VOIES DIRECTES D'ABORD, LES ÉVOLUTIONS ENSUITE, jusqu'au point
      //     fixe. Une lignée dont la première forme est absente ne compte pas.
      // ═══════════════════════════════════════════════════════════════════
      var versEvo = {};
      if (W.PokeObtenir && W.PokeObtenir.ouTrouver) {
        for (var i = 1; i <= total; i++) {
          for (var v = 0; v < versions.length; v++) {
            var l = W.PokeObtenir.ouTrouver(versions[v], i);
            if (!l || !l.length) continue;
            var direct = false, e;
            for (e = 0; e < l.length; e++) if (l[e].type !== "evolution") { direct = true; break; }
            if (direct) { if (!dedans[i]) { dedans[i] = true; n++; } break; }
            for (e = 0; e < l.length; e++) {
              if (l[e].type === "evolution") (versEvo[i] = versEvo[i] || []).push(l[e].lieu);
            }
          }
        }
        var encore = true;
        while (encore) {
          encore = false;
          for (var cle2 in versEvo) {
            if (dedans[cle2]) continue;
            for (var q = 0; q < versEvo[cle2].length; q++) {
              if (dedans[versEvo[cle2][q]]) { dedans[cle2] = true; n++; encore = true; break; }
            }
          }
        }
      }
    } finally {
      if (W.PokeRegles && W.PokeRegles.poser && cle !== avant) W.PokeRegles.poser(avant);
    }
    // Un monde qui ne répond rien garde le seuil historique : mieux vaut
    // l'ancien nombre qu'un diplôme décerné à zéro espèce.
    _obtenables[cle] = { dedans: dedans, taille: n || DIPLOME_SEUIL };
    return _obtenables[cle];
  }

  function diplome(cle) {
    var p = lire();
    var o = obtenablesDuMonde(cle);
    var seuil = o.taille;
    var pris = 0;
    // 🔴 On ne compte que les espèces DE CE MONDE : les prises de Johto ne
    //    remplissent pas le diplôme de Kanto, c'est le défaut signalé par
    //    Syrean. Mew et Célébi n'ont aucune piste, donc n'entrent ni dans le
    //    seuil ni dans le compte — exiger le mythique pour l'ouvrir le rendrait
    //    inatteignable.
    for (var cle in p.pris) if (o.dedans[+cle]) pris++;
    return {
      seuil: seuil,
      pris: pris,
      // Un diplome par MONDE : celui de Kanto ne se decerne pas a Johto.
      // L'ancien champ `p.diplome` reste celui de Kanto, pour ne rien perdre
      // d'une carriere d'avant.
      obtenu: !!diplomeGarde(p, cle),
      atteint: pris >= seuil,
      reste: Math.max(0, seuil - pris),
    };
  }

  // Le décerner une seule fois, et le retenir. Un diplôme qui se redonne à
  // chaque ouverture n'est pas une récompense, c'est un bandeau.
  //  Le diplome deja decerne pour le monde courant. `p.diplome` est celui de
  //  Kanto -- il existait avant qu'il y ait deux mondes, et une carriere
  //  d'avant doit garder le sien.
  function diplomeGarde(p, cle) {
    var monde = cle || mondeCourant();
    var def = (W.PokeRegles && W.PokeRegles.DEFAUT) || "gen1";
    if (monde === def) return p.diplome || (p.diplomes || {})[monde] || null;
    return (p.diplomes || {})[monde] || null;
  }

  function decernerDiplome() {
    var d = diplome();
    if (!d.atteint || d.obtenu) return null;
    var p = lire();
    var monde = mondeCourant();
    var def = (W.PokeRegles && W.PokeRegles.DEFAUT) || "gen1";
    var recu = { le: Date.now(), pris: d.pris, monde: monde };
    if (monde === def) p.diplome = recu;
    p.diplomes = p.diplomes || {};
    p.diplomes[monde] = recu;
    ecrire(p);
    return recu;
  }

  // ── Le compagnon ───────────────────────────────────────────────────────────
  //  🔴 IL N'ENTRE NI AU DÉFI DU JOUR NI EN PvP CLASSÉ. C'est la règle du
  //     projet : aucun avantage acquis hors partie ne pèse là où l'on se
  //     compare. En carrière libre, il arrive AU NIVEAU DU VOYAGE — il tient
  //     compagnie, il ne porte pas la partie.
  function compagnonAutorise(regle, mode) {
    return mode !== "defi" && mode !== "pvp";
  }

  function poserCompagnon(n) {
    var p = lire();
    if (!p.pris[n]) return false; // on n'emmène que ce qu'on a réellement pris
    p.compagnon = { n: n };
    ecrire(p);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE DUEL — L'ÉQUIPE QU'ON LAISSE DERRIÈRE SOI
  //
  //  🔴 ELLE SE SCELLE PENDANT LE VOYAGE, pas à la fin. Un joueur qui perd
  //     devant Koga n'a pas « échoué » : il a une équipe de cinq badges, et
  //     c'est celle-là qu'il doit pouvoir présenter. Ne sceller qu'à la Ligue
  //     aurait laissé sans équipe de duel la grande majorité des voyages —
  //     mesuré : la médiane est de trois à quatre badges.
  //
  //  🔴 ON GARDE LA PLUS AVANCÉE, PAS LA DERNIÈRE. Sinon un voyage abandonné au
  //     premier acte effacerait l'équipe de huit badges de la veille, et le
  //     joueur perdrait en PvP ce qu'il a gagné en jeu. À badges égaux, la plus
  //     récente l'emporte : on veut pouvoir renouveler son équipe.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 ELLE REND `null` QUAND ELLE NE SCELLE PAS, et c'est ce qui permet à
  //     l'écran de fin de ne pas mentir. Ma première version rendait l'ancienne
  //     équipe dans les deux cas : la Vitrine annonçait alors « cette équipe est
  //     scellée » juste sous l'équipe du voyage — en montrant celle-ci et en
  //     gardant celle-là. Un message qui se contredit à trois lignes d'écart.
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE PC DE COMPTE — TOUTES PARTIES CONFONDUES (17/08)
  //
  //  🔴 DEMANDE DE POLTRON_SOFA : « je trouve ça dommage qu'on n'ait pas accès à
  //     notre PC toutes parties confondues, et qu'on compose notre équipe de
  //     duel (même les doublons) ».
  //  🔴 CE QUI EXISTAIT S'APPELAIT « PC » ET N'EN ÉTAIT PAS UN. `p.boite` ne
  //     garde qu'UNE ligne par espèce — un numéro et un surnom, « sans leur
  //     niveau de jeu ». C'est un journal de collection, pas une réserve : on
  //     ne pouvait ni revoir un Pokémon élevé, ni en garder deux, ni s'en
  //     servir. Le mot promettait une chose, la donnée en tenait une autre.
  //  ✅ Le PC garde des INDIVIDUS : espèce, niveau, valeurs déterminantes,
  //     statistiques d'effort et attaques — de quoi les rejouer tels quels en
  //     duel. Les doublons sont gardés, c'est le sens de la demande.
  //
  //  ⚠️ CE QUE ÇA NE FAIT PAS, ET C'EST DÉLIBÉRÉ : rien de tout ceci ne rentre
  //     dans un VOYAGE. L'en-tête de ce fichier pose la règle qui tient tout le
  //     mode — « les niveaux ne persistent pas », sans quoi chaque voyage
  //     démarrerait plus fort et le Défi du jour deviendrait inéquitable. Le PC
  //     alimente le DUEL, qui est une vitrine figée, et rien d'autre.
  //
  //  ⚠️ UNE ENTRÉE PAR (VOYAGE, PLACE), MISE À JOUR — PAS EMPILÉE. `sceller`
  //     est appelée à CHAQUE badge : sans clé, un voyage à huit badges déposait
  //     huit copies de la même équipe, et le PC se remplissait de quarante-huit
  //     lignes pour six Pokémon. La clé est la graine du voyage plus la place.
  //  ⚠️ BORNÉ À `PC_MAX`. Le stockage d'un navigateur n'est pas infini, et un
  //     quota atteint fait échouer l'écriture de TOUTE la progression — le
  //     Pokédex avec. On garde les plus récents ; les plus vieux sortent.
  // ═══════════════════════════════════════════════════════════════════════════
  var PC_MAX = 120;

  function rangerAuPc(p, partie, quand) {
    var voyage = String(partie.graine || "");
    if (!voyage) return;
    if (!Array.isArray(p.pc)) p.pc = [];
    var eq = partie.equipe || [];
    for (var i = 0; i < eq.length && i < 6; i++) {
      var m = eq[i];
      if (!m || !m.n) continue;
      var cle = voyage + "#" + i;
      var ligne = {
        cle: cle, n: m.n, surnom: m.surnom || null,
        niveau: m.niveau, dv: m.dv, statExp: m.statExp,
        attaques: (m.attaques || []).map(function (a) { return a.cle; }),
        quand: quand || Date.now(),
        badges: (partie.badges || []).length,
      };
      var place = -1;
      for (var k = 0; k < p.pc.length; k++) if (p.pc[k].cle === cle) { place = k; break; }
      if (place >= 0) p.pc[place] = ligne;
      else p.pc.push(ligne);
    }
    // Les plus récents d'abord, puis on coupe. 🔴 On trie AVANT de couper :
    // couper en fin de tableau sans trier jetterait les derniers arrivés.
    p.pc.sort(function (a, b) { return (b.quand || 0) - (a.quand || 0); });
    if (p.pc.length > PC_MAX) p.pc = p.pc.slice(0, PC_MAX);
  }

  function pc() { return lire().pc || []; }

  //  🔴 L'ÉQUIPE DE DUEL COMPOSÉE À LA MAIN. Elle remplace le scellé automatique
  //     du meilleur voyage — c'est le joueur qui choisit, doublons compris.
  //     On repasse par `PokeDuel.valider` : la porte qui refuse six Mewtwo
  //     niveau 100 ne se contourne pas parce que l'ordre vient d'un écran.
  function composerDuel(cles, nom) {
    var p = lire(), dispo = p.pc || [], choisis = [];
    for (var i = 0; i < (cles || []).length && choisis.length < 6; i++) {
      for (var k = 0; k < dispo.length; k++) {
        if (dispo[k].cle !== cles[i]) continue;
        choisis.push({
          n: dispo[k].n, niveau: dispo[k].niveau, dv: dispo[k].dv,
          statExp: dispo[k].statExp, attaques: dispo[k].attaques.slice(),
        });
        break;
      }
    }
    if (!choisis.length) return { ok: false, raison: "equipe_vide" };
    var scelle = { v: 1, equipe: choisis };
    var mal = W.PokeDuel ? W.PokeDuel.valider(scelle) : null;
    if (mal) return { ok: false, raison: mal };
    var haut = 0;
    for (var j = 0; j < choisis.length; j++) haut = Math.max(haut, choisis[j].niveau);
    p.duel = {
      scelle: scelle,
      nom: nom || (p.duel && p.duel.nom) || "",
      // ⚠️ ON GARDE LE COMPTE DE BADGES LE PLUS HAUT DÉJÀ ATTEINT. Il sert de
      //    garde à `sceller` (« ne pas rétrograder ») ; le remettre à zéro ici
      //    laisserait le prochain voyage à un badge écraser l'équipe choisie.
      badges: (p.duel && p.duel.badges) || 0,
      compose: true,
      quand: Date.now(),
    };
    ecrire(p);
    return { ok: true, duel: p.duel, haut: haut };
  }

  function sceller(partie, quand) {
    if (!W.PokeDuel || !partie || !partie.equipe || !partie.equipe.length) return null;
    var p = lire();
    var badges = (partie.badges || []).length;
    // Le PC se remplit à chaque badge, même quand l'équipe de duel ne bouge pas :
    // ce qu'on a élevé se garde, qu'on ait fait mieux qu'avant ou non.
    rangerAuPc(p, partie, quand);
    // 🔴 UNE ÉQUIPE COMPOSÉE À LA MAIN NE SE FAIT PAS ÉCRASER PAR UN VOYAGE. Le
    //    scellé automatique prend le meilleur run ; si le joueur a choisi son
    //    équipe lui-même, c'est SON choix qui vaut, jusqu'à ce qu'il en refasse
    //    un. Sans cette ligne, la fonctionnalité se serait défaite toute seule
    //    au badge suivant, et le joueur aurait cru à un bug.
    if (p.duel && p.duel.compose) { ecrire(p); return p.duel; }
    if (p.duel && badges < (p.duel.badges || 0)) { ecrire(p); return null; }
    p.duel = {
      scelle: W.PokeDuel.sceller(partie),
      nom: partie.nom || "",
      badges: badges,
      quand: quand || Date.now(),
    };
    ecrire(p);
    return p.duel;
  }

  function equipeDuel() { return lire().duel; }

  // Le carnet. 🔴 LA CLÉ EST LE NOM, parce que c'est déjà lui qui fait la graine
  //    du duel (`PokeDuel.graineDuel`). Deux identités différentes pour la même
  //    personne donneraient deux combats et deux vérités.
  function cleRival(nom) { return String(nom || "").trim().toLowerCase(); }

  function inscrireRival(nom, scelle, quand, palm) {
    var p = lire();
    var cle = cleRival(nom);
    if (!cle) return null;
    var e = null;
    for (var i = 0; i < p.rivaux.length; i++) if (p.rivaux[i].cle === cle) { e = p.rivaux[i]; break; }
    if (!e) { e = { cle: cle, nom: String(nom), v: 0, d: 0 }; p.rivaux.push(e); }
    // Un code recollé remplace l'ancien : c'est ainsi qu'un rival « monte ».
    e.scelle = scelle;
    e.nom = String(nom);
    e.vu = quand || Date.now();
    // ⚠️ UN CODE SANS PALMARÈS N'EFFACE PAS CELUI QU'ON CONNAISSAIT. Le champ est
    //    facultatif : écraser sur absence ferait perdre la carrière d'un rival
    //    parce qu'il a recollé un vieux code.
    if (palm) e.palmares = palm;
    ecrire(p);
    return e;
  }

  function noterDuel(nom, gagne) {
    var p = lire();
    var cle = cleRival(nom);
    for (var i = 0; i < p.rivaux.length; i++) {
      if (p.rivaux[i].cle !== cle) continue;
      if (gagne) p.rivaux[i].v++; else p.rivaux[i].d++;
      ecrire(p);
      return p.rivaux[i];
    }
    return null;
  }

  function carnet() { return lire().rivaux || []; }

  function noterDefi(id, gagne) {
    var p = lire();
    if (!p.defis[id]) p.defis[id] = { v: 0, d: 0 };
    if (gagne) p.defis[id].v++; else p.defis[id].d++;
    ecrire(p);
    return p.defis[id];
  }

  function palmaresDefis() { return lire().defis || {}; }

  function genre() { return lire().genre || "h"; }

  // ── LE DÉFI DU JOUR ────────────────────────────────────────────────────────
  //  🔴 LA DATE EST CELLE DU CLIENT, et on l'assume : le serveur tranchera à la
  //     soumission, comme le dit déjà `PokeClassement`. Avancer sa montre ne
  //     donne pas un second essai — ça donne un refus.
  //  🔴 ON POSE LE DÉFI AU DÉPART, PAS À L'ARRIVÉE. Un joueur qui ferme l'onglet
  //     au milieu a bien consommé son essai : sinon il suffirait d'abandonner
  //     dès que la carte déplaît pour en retirer une autre.
  function defiDuJour(date) {
    var d = lire().defiJour;
    if (!d) return null;
    return date && d.date !== date ? null : d;
  }

  function ouvrirDefi(date) {
    var p = lire();
    if (p.defiJour && p.defiJour.date === date) return p.defiJour;
    p.defiJour = { date: date, score: null, badges: 0, fini: null };
    // La série compte les jours OUVERTS, pas les jours gagnés : c'est revenir
    // qui la tient, et c'est exactement ce qu'on veut encourager.
    p.defiHisto.push({ date: date, score: null, badges: 0, fini: null });
    if (p.defiHisto.length > 30) p.defiHisto = p.defiHisto.slice(-30);
    ecrire(p);
    return p.defiJour;
  }

  function clore(date, resume) {
    var p = lire();
    if (!p.defiJour || p.defiJour.date !== date) return null;
    p.defiJour.score = resume.score;
    p.defiJour.badges = resume.badges;
    p.defiJour.fini = resume.fini;
    for (var i = p.defiHisto.length - 1; i >= 0; i--) {
      if (p.defiHisto[i].date !== date) continue;
      p.defiHisto[i] = { date: date, score: resume.score, badges: resume.badges, fini: resume.fini };
      break;
    }
    ecrire(p);
    return p.defiJour;
  }

  // 🔴 LA VEILLE SE CALCULE EN UTC, PAS EN RETIRANT 86 400 000 À UNE DATE LOCALE.
  //    Deux fois par an, un jour local dure 23 ou 25 heures : la soustraction
  //    naïve saute un jour ou le répète, et la série d'un joueur casse au
  //    changement d'heure sans que personne ne comprenne pourquoi.
  function veille(date) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    d.setUTCDate(d.getUTCDate() - 1);
    return d.getUTCFullYear() + "-" +
      String(d.getUTCMonth() + 1).padStart(2, "0") + "-" +
      String(d.getUTCDate()).padStart(2, "0");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CALENDRIER — TRENTE JOURS ÉCRITS, ZÉRO JOUR MONTRÉ
  //
  //  🔴 `defiHisto` GARDE SCORE, BADGES ET ISSUE DE CHAQUE JOUR, et seule la
  //     DATE était relue — pour compter la série. Le joueur n'a jamais pu voir
  //     ses propres résultats : ni sa progression, ni son meilleur jour, ni les
  //     trous de son mois. Trente jours de mémoire, un chiffre à l'écran.
  //  🔴 ET C'EST LE MÉCANISME DE RETOUR LE PLUS DIRECT DU MODE. Une série est
  //     un nombre ; un calendrier est une FORME — on voit le trou, et un trou
  //     se comble. C'est ce qui fait revenir demain, pas « 4 jours ».
  //
  //  Rend les `n` derniers jours, du plus ancien au plus récent, TROUS COMPRIS :
  //  un jour non joué est une case, pas une absence de case.
  function calendrierDefis(aujourdhui, n) {
    var p = lire();
    var par = {};
    for (var i = 0; i < p.defiHisto.length; i++) par[p.defiHisto[i].date] = p.defiHisto[i];
    var jours = [], d = aujourdhui;
    var combien = n || 30;
    while (jours.length < combien && d) {
      var h = par[d];
      jours.unshift({
        date: d,
        joue: !!h,
        // `fini` vaut null tant que le voyage n'est pas clos : ouvert un jour
        // et abandonné, ça reste un jour joué — la série le compte déjà ainsi.
        score: h ? h.score : null,
        badges: h ? h.badges || 0 : 0,
        fini: h ? h.fini : null,
        aujourdhui: d === aujourdhui,
      });
      d = veille(d);
    }
    return jours;
  }

  //  Le meilleur jour du calendrier : celui qui a le plus haut score. Rendu à
  //  part parce qu'une frise ne se survole pas au doigt — sur mobile, la seule
  //  façon de lire un chiffre est de l'écrire.
  function meilleurJour(aujourdhui, n) {
    var j = calendrierDefis(aujourdhui, n), best = null;
    for (var i = 0; i < j.length; i++) {
      if (j[i].score == null) continue;
      if (!best || j[i].score > best.score) best = j[i];
    }
    return best;
  }

  //  Rend la série EN COURS et la MEILLEURE. 🔴 La série en cours ne se rompt
  //  pas le jour même : tant qu'on est le jour J et qu'on n'a pas encore joué,
  //  la série de la veille tient toujours — la casser à minuit punirait un
  //  joueur qui n'a rien fait de mal, et c'est exactement ce qui fait
  //  abandonner une série.
  function serieDefis(aujourdhui) {
    var p = lire();
    var vus = {};
    for (var i = 0; i < p.defiHisto.length; i++) vus[p.defiHisto[i].date] = true;

    var depart = vus[aujourdhui] ? aujourdhui : veille(aujourdhui);
    var encours = 0, d = depart;
    while (d && vus[d]) { encours++; d = veille(d); }

    // La meilleure : on parcourt les dates connues, triées.
    var dates = Object.keys(vus).sort();
    var meilleure = 0, courante = 0, precedent = null;
    for (var k = 0; k < dates.length; k++) {
      courante = (precedent && veille(dates[k]) === precedent) ? courante + 1 : 1;
      if (courante > meilleure) meilleure = courante;
      precedent = dates[k];
    }
    return { encours: encours, meilleure: meilleure, joues: dates.length };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE RANG DE DRESSEUR
  //
  //  🔴 RIEN NE SURVIVAIT À UN VOYAGE SAUF LA COLLECTION. Le Pokédex est un but
  //     à très long terme, et les déblocages de départ s'épuisent vite : entre
  //     les deux, un joueur qui vient de battre la Ligue n'a rien qui le dise.
  //     Le rang est ce fil — cinq paliers, du premier badge au Maître battu en
  //     duel — et il donne enfin une raison de gravir les défis de Kanto.
  //
  //  🔴 IL NE DONNE AUCUN AVANTAGE, ET C'EST LA RÈGLE DU MODE. Rien ne pèse là
  //     où l'on se compare : un rang est un TITRE, jamais un bonus. Le jour où
  //     il ouvrirait une Ball de plus, le classement et le Défi du jour
  //     cesseraient d'être comparables entre deux joueurs.
  //
  //  🔴 CHAQUE PALIER SE FRANCHIT SUR UN FAIT, jamais sur un compteur d'heures.
  //     Jouer beaucoup ne vaut pas jouer bien — c'est déjà la règle qui ouvre
  //     les règles de voyage, et elle vaut ici pour la même raison.
  //     Les noms des rangs vivent dans l'écran, pas ici : ce module ne produit
  //     aucun texte.
  function rang() {
    var p = lire();
    var d = p.defis || {};
    var paliers = [
      { cle: "maitre", ok: !!(d.maitre && d.maitre.v > 0) },
      { cle: "ligue", ok: (p.ligues || 0) > 0 },
      { cle: "confirme", ok: (p.badgesMax || 0) >= 8 },
      { cle: "dresseur", ok: (p.badgesMax || 0) >= 1 },
      { cle: "debutant", ok: true },
    ];
    for (var i = 0; i < paliers.length; i++) {
      if (!paliers[i].ok) continue;
      return {
        cle: paliers[i].cle,
        // 🔴 ON REND AUSSI CE QUI MANQUE. Un rang qui s'affiche sans dire
        //    comment monter est une décoration : c'est le prochain palier qui
        //    fait revenir, pas celui qu'on a déjà.
        suivant: i > 0 ? paliers[i - 1].cle : null,
        n: paliers.length - i,
        sur: paliers.length,
      };
    }
    return { cle: "debutant", suivant: "dresseur", n: 1, sur: paliers.length };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE NOM REVIENT — LA CONTREPARTIE DE LA PROMESSE FAITE À L'ÉCRAN
  //
  //  🔴 L'écran de capture dit « Il le gardera, même après ce voyage ». Le PC
  //     l'écrivait depuis toujours et PERSONNE NE LE RELISAIT : la phrase était
  //     un mensonge, et rien ne pouvait le signaler puisque l'écriture, elle,
  //     marchait. Une promesse faite au joueur a besoin d'un lecteur, pas d'un
  //     écrivain.
  //  ⚠️ Cosmétique et cosmétique seulement : aucun tirage, aucun combat, aucun
  //     score ne dépend du surnom. Le serveur peut rejouer une partie sans lui.
  // ═══════════════════════════════════════════════════════════════════════════
  function surnomConnu(n) {
    var b = lire().boite || [];
    for (var i = 0; i < b.length; i++) if (b[i].n === n && b[i].surnom) return b[i].surnom;
    return null;
  }

  function effacer() { try { W.localStorage.removeItem(CLE); } catch (e) {} }


  // ═══════════════════════════════════════════════════════════════════════════
  //  LE VOYAGE EN COURS SE GARDE — SANS QUOI IL SE PERD À LA PREMIÈRE INTERRUPTION
  //
  //  🔴 TROUVÉ LE 09/08 EN RELEVANT LE STOCKAGE : `poke_progress` ne contient
  //     QUE la méta-progression — Pokédex, boîte, voyages, ligues, chasses,
  //     sceaux. Le voyage lui-même n'était nulle part. Fermer l'onglet, recevoir
  //     un appel, laisser le système reprendre la mémoire : neuf actes, quatre-
  //     vingts nœuds, quarante minutes, perdus sans un mot.
  //     Le mode s'installe en application et se joue au téléphone, c'est-à-dire
  //     à l'endroit exact où une page se fait évincer. Aucun commentaire du
  //     dossier ne défendait ce choix : c'était un oubli, pas une décision.
  //
  //  🔴 LE DÉFI DU JOUR N'EST PAS GARDÉ, ET C'EST VOULU. On s'y compare : une
  //     reprise permettrait de recharger devant un combat perdu et de rejouer
  //     ses coups sur le MÊME état de graine — c'est-à-dire de tricher sans
  //     que le journal puisse le dire. Le voyage libre, lui, ne se compare à
  //     personne d'autre qu'à soi. `POKE_GRAINE` distingue les deux, comme
  //     partout ailleurs dans ce mode.
  //
  //  🔴 ET ON GARDE L'ÉTAT DE LA GRAINE, PAS SEULEMENT LA PARTIE. `PokeHasard`
  //     porte `etat` et `tirages` ; sans eux, une reprise repartirait au début
  //     de la suite et le voyage cesserait d'être celui qu'on jouait. C'est ce
  //     qui rend la reprise HONNÊTE : on retrouve exactement le monde quitté.
  //
  //  ⚠️ `FORMAT` ne suit pas le `?v=` du site. Une livraison par heure
  //     effacerait le voyage de tout le monde à chaque déploiement ; ce numéro
  //     ne bouge que si la FORME d'une partie change.
  // ═══════════════════════════════════════════════════════════════════════════
  var CLE_VOYAGE = "poke_voyage";
  var FORMAT = 1;

  function voyageEcrire(partie, hasard, journal) {
    if (!partie || !hasard) return false;
    try {
      W.localStorage.setItem(CLE_VOYAGE, JSON.stringify({
        f: FORMAT,
        partie: partie,
        graine: hasard.source,
        etat: hasard.etat,
        tirages: hasard.tirages,
        journal: journal || [],
      }));
      return true;
    } catch (e) { return false; }
  }

  // Rend `null` dès que quelque chose cloche : un voyage à moitié lisible vaut
  // moins que pas de voyage du tout, et il vaut surtout moins qu'un plantage.
  function voyageLire() {
    try {
      var brut = W.localStorage.getItem(CLE_VOYAGE);
      if (!brut) return null;
      var v = JSON.parse(brut);
      if (!v || v.f !== FORMAT || !v.partie || !v.partie.equipe) return null;
      if (v.partie.fini) return null;          // un voyage clos ne se reprend pas
      // 🔴 UN VOYAGE SANS STARTER N'EST PAS UN VOYAGE (13/08). La lentille du
      //    Pokédex, ouverte depuis l'écran de choix du starter, renvoyait à la
      //    carte — qui sauvait alors une partie à équipe VIDE. La reprendre
      //    remettait le joueur dans un monde injouable, pour toujours.
      if (!v.partie.starter) return null;
      return v;
    } catch (e) { return null; }
  }

  function voyageEffacer() { try { W.localStorage.removeItem(CLE_VOYAGE); } catch (e) {} }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'ESSAI DU JOUR SE GARDE AUSSI — MAIS PAS AU MÊME ENDROIT  [19/08/2026]
  //
  //  🔴 CE QUI L'A FAIT NAÎTRE. Chris, le 19/08 : « j'ai commencé le défi, fermé
  //     le navigateur pendant un combat et je suis revenu. Ça m'a dit "dispo une
  //     seule fois par jour". » Avant lui, @Z3no_ le 18/08. La règle ci-dessus
  //     tenait — une reprise permettrait de rejouer un combat perdu sur la même
  //     graine — mais elle ne distinguait pas ABANDONNER de PERDRE SA PAGE. Un
  //     navigateur qui plante, un téléphone qui se verrouille, un onglet fermé
  //     par erreur : la journée brûlait comme un abandon.
  //
  //  🔑 CE QU'ON GARDE, ET CE QU'ON NE REND PAS. L'essai se garde ; le combat
  //     ENGAGÉ, lui, ne se rejoue jamais. Le marqueur `engage` s'inscrit AVANT
  //     le combat et les issues l'effacent : s'il survit, c'est que la page est
  //     morte en plein combat, et il se solde en défaite au retour. Le combat
  //     perdu reste perdu, la journée non. C'est exactement le mécanisme des
  //     chasses légendaires (`manque` → `enfui`), qui existe ici depuis le
  //     09/08 et qui a été écrit pour la même raison.
  //
  //  🔴 SA PROPRE CLÉ, ET C'EST LE CŒUR DU CORRECTIF. Un seul emplacement
  //     aurait fait écraser le voyage libre par l'essai du jour — c'est
  //     précisément la plainte de @Z3no_ (« ça me force à créer une nouvelle
  //     save »). Les deux cohabitent, chacun chez soi.
  //  ⚠️ LA DATE EST DANS L'ENREGISTREMENT, ET ELLE EST RELUE. Un essai d'hier
  //     ne se reprend pas : la carte du jour a changé, le classement aussi.
  // ═══════════════════════════════════════════════════════════════════════════
  var CLE_DEFI = "poke_defi";

  function defiEcrire(date, partie, hasard, journal) {
    if (!date || !partie || !hasard) return false;
    try {
      W.localStorage.setItem(CLE_DEFI, JSON.stringify({
        f: FORMAT,
        date: date,
        partie: partie,
        graine: hasard.source,
        etat: hasard.etat,
        tirages: hasard.tirages,
        journal: journal || [],
      }));
      return true;
    } catch (e) { return false; }
  }

  //  Mêmes refus que `voyageLire`, plus la date : un essai d'un autre jour
  //  n'est pas reprenable, il est PÉRIMÉ.
  function defiLire(date) {
    try {
      var brut = W.localStorage.getItem(CLE_DEFI);
      if (!brut) return null;
      var v = JSON.parse(brut);
      if (!v || v.f !== FORMAT || !v.partie || !v.partie.equipe) return null;
      if (date && v.date !== date) return null;
      if (v.partie.fini) return null;
      if (!v.partie.starter) return null;
      return v;
    } catch (e) { return null; }
  }

  function defiEffacer() { try { W.localStorage.removeItem(CLE_DEFI); } catch (e) {} }

  // ═══════════════════════════════════════════════════════════════════════════
  //  L'INSTANTANÉ DES PORTES DE MESURE — 11/08/2026
  //
  //  🔴 CE QU'IL RÉPARE. Les portes `PokeUI.mesurer*` existent pour REGARDER un
  //     écran sans le jouer, et l'une d'elles détruisait la partie. Mesuré au
  //     banc mobile : `mesurerFin` efface la sauvegarde, COMPTE le voyage dans
  //     les statistiques à vie (`cloturer`) et REMPLACE l'équipe de duel
  //     (`sceller`) — trois dégâts persistants pour un écran simplement ouvert.
  //     `mesurerActe`, elle, régénérait la carte et remettait la rangée à zéro.
  //  🔑 L'instantané précédent listait TROIS champs de `partie`. Une liste de
  //     champs tenue à la main à côté de portes qui évoluent ne peut que se
  //     laisser dépasser — c'est la faute de la veille, à l'identique.
  //     **On photographie l'ÉTAT ÉCRIT** : il est complet par construction, et
  //     une porte neuve n'a rien à venir ajouter ici.
  //  ⚠️ Réservé aux portes de mesure. Rien dans le jeu ne doit l'appeler : ce
  //     n'est pas un « annuler », c'est un filet pour un observateur.
  // ═══════════════════════════════════════════════════════════════════════════
  function instantane() {
    try {
      return {
        voyage: W.localStorage.getItem(CLE_VOYAGE),
        // 🔴 L'ESSAI DU JOUR EST DANS LA PHOTO, comme le voyage : depuis le
        //    19/08 il se garde lui aussi, et une porte de mesure qui ouvre un
        //    écran de défi le détruirait sans cette ligne. C'est le défaut
        //    qu'`instantane` a été écrite pour fermer — il ne se rouvre pas
        //    parce qu'un second emplacement est né.
        defi: W.localStorage.getItem(CLE_DEFI),
        compte: W.localStorage.getItem(CLE),
      };
    } catch (e) { return null; }
  }

  function restaurer(photo) {
    if (!photo) return false;
    try {
      // ⚠️ `null` VEUT DIRE « IL N'Y AVAIT RIEN », et il faut le rendre aussi :
      //    restaurer une absence par une écriture fabriquerait une partie qui
      //    n'a jamais existé.
      if (photo.voyage == null) W.localStorage.removeItem(CLE_VOYAGE);
      else W.localStorage.setItem(CLE_VOYAGE, photo.voyage);
      if (photo.defi == null) W.localStorage.removeItem(CLE_DEFI);
      else W.localStorage.setItem(CLE_DEFI, photo.defi);
      if (photo.compte == null) W.localStorage.removeItem(CLE);
      else W.localStorage.setItem(CLE, photo.compte);
      return true;
    } catch (e) { return false; }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LES ACQUIS EMPORTÉS — lecture, plafond, et la garde d'un voyage
  //
  //  ⚠️ LE PLAFOND VIT ICI, PAS DANS L'ÉCRAN. Un écran qui décide combien on
  //     emporte, c'est deux écrans qui décideront différemment le jour où le
  //     second arrive. La règle est du moteur ; l'écran la lit.
  //  ⚠️ ON REFUSE LE DOUBLON. `PokeAcquis.porte` refuse déjà de reprendre un
  //     acquis qu'on tient — emporter deux fois le même volerait une place.
  // ═══════════════════════════════════════════════════════════════════════════
  //  🔴 PLAFOND À UN, ET C'EST LA MESURE QUI L'A TRANCHÉ — pas moi. J'avais
  //     décidé DEUX en écrivant « à un le gain est imperceptible ». Mesuré sur
  //     250 voyages par palier, politique optimal :
  //
  //       plafond   8 badges   Ligue
  //          0        54,7 %   27,9 %   ← témoin, système éteint
  //          1        63,4 %   36,6 %
  //          2        68,6 %   49,4 %
  //          3        82,6 %   66,3 %
  //
  //     Un SEUL acquis emporté vaut +9 points de Ligue. Deux la portent à
  //     49 % — le jeu devient un pile ou face. Le pilier est beaucoup plus
  //     fort que je ne l'avais estimé, et c'est une bonne nouvelle : il fait
  //     vraiment revenir moins faible. Mais il ne se règle qu'à UN, et il
  //     n'est tenable qu'accompagné du durcissement — sans lui, il détruit la
  //     courbe qu'il devait sauver.
  //  ⚠️ *Un réglage qu'on décide avant de mesurer est un pari.* Celui-ci a été
  //     perdu ; la table ci-dessus est là pour que personne ne le rejoue.
  var GARDES_MAX = 1;

  function gardes() {
    var p = lire();
    return (p.gardes || []).slice(0, GARDES_MAX);
  }

  //  Rend `true` si l'acquis a bien été emporté. Refuse si le plafond est
  //  atteint, si l'id est inconnu, ou s'il est déjà emporté.
  function garder(id) {
    if (!id || !W.PokeAcquis || !W.PokeAcquis.de(id)) return false;
    var p = lire();
    p.gardes = p.gardes || [];
    if (p.gardes.length >= GARDES_MAX || p.gardes.indexOf(id) >= 0) return false;
    p.gardes.push(id);
    ecrire(p);
    return true;
  }

  //  Reposer un acquis emporté : le plafond serait une prison sans cette porte.
  //  Un joueur qui a emporté « la bourse tenue » doit pouvoir la rendre le jour
  //  où il préfère « le coup d'œil du pêcheur ».
  function rendre(id) {
    var p = lire();
    var k = (p.gardes || []).indexOf(id);
    if (k < 0) return false;
    p.gardes.splice(k, 1);
    ecrire(p);
    return true;
  }

  W.PokeProgression = {
    CLE: CLE,
    GARDES_MAX: GARDES_MAX,
    gardes: gardes,
    garder: garder,
    rendre: rendre,
    vide: vide, lire: lire, ecrire: ecrire,
    voyageEcrire: voyageEcrire, voyageLire: voyageLire, voyageEffacer: voyageEffacer,
    defiEcrire: defiEcrire, defiLire: defiLire, defiEffacer: defiEffacer,
    instantane: instantane, restaurer: restaurer,
    fusionner: fusionner,
    cloturer: cloturer,
    sermentsOuverts: sermentsOuverts,
    releve: releve,
    comptePokedex: comptePokedex,
    palmares: palmares,
    DIPLOME_SEUIL: DIPLOME_SEUIL,
    diplome: diplome,
    decernerDiplome: decernerDiplome,
    compagnonAutorise: compagnonAutorise,
    poserCompagnon: poserCompagnon,
    sceller: sceller,
    equipeDuel: equipeDuel,
    pc: pc,
    composerDuel: composerDuel,
    PC_MAX: PC_MAX,
    inscrireRival: inscrireRival,
    noterDuel: noterDuel,
    carnet: carnet,
    noterDefi: noterDefi,
    palmaresDefis: palmaresDefis,
    genre: genre,
    surnomConnu: surnomConnu,
    rang: rang,
    defiDuJour: defiDuJour,
    ouvrirDefi: ouvrirDefi,
    clore: clore,
    serieDefis: serieDefis,
    calendrierDefis: calendrierDefis,
    meilleurJour: meilleurJour,
    effacer: effacer,
  };
})(typeof window !== "undefined" ? window : globalThis);
