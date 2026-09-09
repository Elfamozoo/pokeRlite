(function (W, D) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CLASSEMENT DU DÉFI DU JOUR
  //
  //  Une graine par date : même version, mêmes rencontres, mêmes équipes
  //  adverses pour tout le monde. Un seul essai. Le serveur REJOUE la partie à
  //  partir du journal de choix — personne n'envoie un score, on envoie ce
  //  qu'on a fait.
  //
  //  🔴 LE MODE EST FERMÉ, DONC LE CLASSEMENT EST VIDE. C'est la vérité, et
  //     l'écran doit la DIRE. Un tableau vide sans explication se lit comme une
  //     panne — c'est la classe de défaut n°1 du projet, et elle se traite ici
  //     comme ailleurs.
  //     ⚠️ `poke` est dans `SPORTS_LUS` mais pas dans `SPORTS` : on peut LIRE le
  //        classement, pas y ÉCRIRE. Sans cette distinction, `sportLu("poke")`
  //        retombait sur le ninja et un joueur Pokémon lisait le classement des
  //        ninjas, noms et scores compris — défaut réellement vu en Dragon Ball.
  // ═══════════════════════════════════════════════════════════════════════════

  var LANG = function () { return W.POKE_LANG || "fr"; };

  var TXT = {
    titre: { fr: "DÉFI DU JOUR", en: "DAILY CHALLENGE" },
    // 🔴 Un classement sans sa contrainte compare des chiffres nus.
    regle: { fr: "Règle de ce jour-là : {nom}.", en: "That day's rule: {nom}." },
    explique: {
      fr: "Une graine par jour. Même départ pour tous, un seul essai.",
      en: "One seed per day. Same start for everyone, one attempt.",
    },
    rang: { fr: "RANG", en: "RANK" },
    dresseur: { fr: "DRESSEUR", en: "TRAINER" },
    score: { fr: "SCORE", en: "SCORE" },
    total: { fr: "{n} {n|dresseur|dresseurs} {n|a|ont} joué aujourd'hui.",
             en: "{n} {n|trainer|trainers} played today." },
    vide: {
      fr: "Personne n'a encore joué le défi du jour.",
      en: "Nobody has played today's challenge yet.",
    },
    // 🔴 CETTE PHRASE A ÉTÉ CORRIGÉE LE JOUR DE L'OUVERTURE. Elle disait « le
    //    mode n'est pas encore ouvert » — vrai tant que le verrou tenait, faux
    //    à la seconde où il tombe, et c'était la SEULE explication affichée
    //    quand le tableau était vide. Un écran qui explique le vide par une
    //    raison périmée est pire qu'un écran muet.
    //  ⚠️ Le serveur répond `bad_sport` tant que « poke » n'est pas dans
    //     `SPORTS` : la phrase couvre donc les deux cas — pas encore ouvert, ou
    //     ouvert et personne n'a fini son voyage aujourd'hui.
    ferme: {
      fr: "Sois le premier : termine le défi du jour et ton voyage s'inscrit ici.",
      en: "Be the first: finish today's challenge and your run lands here.",
    },
    injoignable: {
      fr: "Le classement ne répond pas. Ta partie n'est pas perdue.",
      en: "The ladder is not answering. Your run is safe.",
    },
    toi: { fr: "toi", en: "you" },
    fermer: { fr: "FERMER", en: "CLOSE" },
    charge: { fr: "…", en: "…" },
    // ═══════════════════════════════════════════════════════════════════════
    //  LE CERCLE — [18/08, Poltron_sofa/Amex] « faire une ligue… pour nous ! »
    //  ⚠️ PAS « LIGUE » : dans ce mode, la Ligue est le Conseil 4 qu'on va
    //     battre. Un second sens sur le même mot, sur le même écran d'accueil,
    //     ferait chercher le Conseil derrière un bouton de clan. Le mot du jeu
    //     d'origine pour un groupe de dresseurs est le CERCLE ; le texte dit tout
    //     de suite que c'est le clan des autres univers.
    // ═══════════════════════════════════════════════════════════════════════
    cercleTitre: { fr: "CERCLE DE DRESSEURS", en: "TRAINER CIRCLE" },
    cercleDit: {
      fr: "Un cercle, c'est tes amis, classés entre vous. Chaque semaine, la somme de vos meilleurs Défis du jour.",
      en: "A circle is your friends, ranked among yourselves. Each week, the sum of your best Daily Challenges.",
    },
    cercleSansCompte: { fr: "Il faut un compte pour entrer dans un cercle.", en: "You need an account to join a circle." },
    cercleConnexion: { fr: "CONNEXION", en: "SIGN IN" },
    cercleAucun: { fr: "Tu n'es dans aucun cercle. Crée le tien, ou rejoins-en un avec son code.", en: "You are in no circle. Create yours, or join one with its code." },
    cercleSemaine: { fr: "Cette semaine, depuis lundi.", en: "This week, since Monday." },
    cerclePoints: { fr: "POINTS", en: "POINTS" },
    cercleJours: { fr: "JOURS", en: "DAYS" },
    cercleCode: { fr: "Code du cercle : {code}", en: "Circle code: {code}" },
    cercleCopier: { fr: "COPIER LE CODE", en: "COPY THE CODE" },
    cercleCopie: { fr: "CODE COPIÉ", en: "CODE COPIED" },
    cercleQuitter: { fr: "QUITTER LE CERCLE", en: "LEAVE THE CIRCLE" },
    cercleQuitterSur: { fr: "QUITTER, SÛR ?", en: "LEAVE, SURE?" },
    cercleCreerTitre: { fr: "CRÉER UN CERCLE", en: "CREATE A CIRCLE" },
    cercleNom: { fr: "Nom du cercle (ex : Les Dresseurs du Nord)", en: "Circle name (e.g. Northern Trainers)" },
    cercleCreer: { fr: "CRÉER", en: "CREATE" },
    cercleRejoindreTitre: { fr: "REJOINDRE UN CERCLE", en: "JOIN A CIRCLE" },
    cercleCodeSaisie: { fr: "Code reçu d'un ami", en: "Code from a friend" },
    cercleRejoindre: { fr: "REJOINDRE", en: "JOIN" },
    cercleRejoint: { fr: "Cercle rejoint : {nom}.", en: "Circle joined: {nom}." },
    cercleCree: { fr: "Cercle créé. Donne ce code à tes amis : {code}", en: "Circle created. Give this code to your friends: {code}" },
    // Les refus du serveur, dits dans les mots du joueur.
    cercleErrNom: { fr: "Trois lettres au moins.", en: "Three letters at least." },
    cercleErrNomBanni: { fr: "Ce nom ne passe pas.", en: "That name will not do." },
    cercleErrTrop: { fr: "Tu as déjà créé dix cercles. Quitte-en un.", en: "You already created ten circles. Leave one." },
    cercleErrIntrouvable: { fr: "Aucun cercle avec ce code.", en: "No circle with that code." },
    cercleErrPlein: { fr: "Ce cercle est plein (cinquante dresseurs).", en: "That circle is full (fifty trainers)." },
    cercleErrReseau: { fr: "Le serveur ne répond pas. Réessaie dans un instant.", en: "The server is not answering. Try again in a moment." },
  };
  // Porte unique : l'accord en genre et en nombre se résout à un seul endroit.
  function T(cle, vars) { return W.PokeGenre.pour(TXT, cle, vars, "classement"); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // La date du défi. 🔴 Elle vient de l'horloge du CLIENT ici, mais c'est le
  // SERVEUR qui tranche à la soumission : un joueur qui avance sa montre ne
  // gagne rien, il obtient juste un refus.
  function jour() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  // [20/08, polish] « 2026-08-20 » est la CLÉ du jour, pas une date qu'un joueur
  // lit. À l'écran elle se dit « 20 août 2026 » / « 20 August 2026 » — et la
  // clé reste la clé partout ailleurs (serveur, stockage). Sans `Intl` (très
  // vieux navigateur), on rend la clé telle quelle : vraie, juste moins jolie.
  function dateLisible(cle) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(cle || ""));
    if (!m) return String(cle || "");
    try {
      var d = new Date(+m[1], +m[2] - 1, +m[3]);
      return d.toLocaleDateString(LANG() === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return String(cle); }
  }

  // 🔴 [17/08] L'ADRESSE SE RELIT À CHAQUE APPEL, ELLE NE SE CAPTURE PLUS.
  //    Écrite `var API = W.POKE_API || "/api"` au chargement, elle rendait le
  //    module INÉPROUVABLE hors production : le banc local ne pouvait plus la
  //    rediriger vers une API d'essai, donc la synchronisation du Pokédex de
  //    compte ne pouvait être vérifiée que sur la vraie base des joueurs.
  //    Une valeur capturée au chargement est un réglage qu'on ne peut plus
  //    changer — et ce qu'on ne peut pas éprouver, on le livre en espérant.
  var api = function () { return W.POKE_API || "/api"; };

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA SOUMISSION — CE QUI MANQUAIT POUR QUE LE CLASSEMENT EXISTE
  //
  //  🔴 CE FICHIER NE FAISAIT QUE LIRE. Il affichait un tableau, il expliquait
  //     la graine du jour, il montrait la règle — et rien n'écrivait jamais
  //     dedans. Le classement ne pouvait donc que rester vide, et l'écran
  //     l'expliquait par « le mode n'est pas encore ouvert » : une phrase qui
  //     serait devenue fausse à la seconde de l'ouverture, sans cesser d'être
  //     la seule explication affichée.
  //  🔑 TROIS APPELS, DANS CET ORDRE, ET AUCUN N'EST FACULTATIF :
  //     1. `/api/device` donne un identifiant d'appareil SIGNÉ par le serveur.
  //        Tiré par le navigateur, il suffirait d'en changer une lettre pour
  //        rejouer le défi autant de fois qu'on veut.
  //     2. `/api/daily/start` déclare le DÉPART. C'est lui qui consomme
  //        l'essai côté serveur et qui date la partie — sans quoi on pourrait
  //        soumettre un voyage joué hier, ou fini en quinze secondes.
  //     3. `/api/daily` soumet le RÉSUMÉ, jamais le score seul : le serveur
  //        recalcule le barème (`js/poke/rejeu.js`) et refuse ce qui ne colle
  //        pas.
  //  ⚠️ ON PARTAGE LE `pid` ET LE JETON DE SESSION AVEC LE RESTE DU SITE. Le
  //     serveur classe par `pid + ":" + sport` : un même appareil joue les deux
  //     modes sans se marcher dessus, et un joueur CONNECTÉ se classe sous son
  //     nom de compte au lieu d'un « Dresseur 4213 » anonyme.
  //  ⚠️ AUCUN ÉCHEC RÉSEAU NE DOIT INQUIÉTER SUR LA PARTIE. Le voyage est joué,
  //     la collection est sauvée en local ; le classement est un bonus. Toutes
  //     ces portes se taisent en cas de panne.
  // ═══════════════════════════════════════════════════════════════════════════
  var CLE_PID = "palmares_pid2";      // le même appareil que le reste du site
  var CLE_TOKEN = "palmares_token";   // la session du compte, si le joueur en a un
  var CLE_JETON = "rtl_poke_defi_jeton";

  function stock(cle) { try { return W.localStorage.getItem(cle); } catch (e) { return null; } }
  function poser(cle, v) { try { W.localStorage.setItem(cle, v); } catch (e) {} }

  function appel(chemin, methode, corps) {
    var entetes = { "Content-Type": "application/json" };
    var tok = stock(CLE_TOKEN);
    if (tok) entetes.Authorization = "Bearer " + tok;
    return fetch(api() + chemin, {
      method: methode || "GET",
      headers: entetes,
      body: corps ? JSON.stringify(corps) : undefined,
    }).then(function (r) { return r.json(); }).catch(function () { return { err: "reseau" }; });
  }

  var pidEnCours = null;
  function appareil() {
    var vu = stock(CLE_PID);
    if (vu) return Promise.resolve(vu);
    if (!pidEnCours) {
      pidEnCours = appel("/device", "POST", {}).then(function (r) {
        pidEnCours = null;
        if (r && r.ok && r.pid) { poser(CLE_PID, r.pid); return r.pid; }
        return "";
      });
    }
    return pidEnCours;
  }

  //  Déclarer le départ. On garde le jeton avec SA date : un jeton d'hier ne
  //  vaut rien, et le serveur le dirait — autant ne pas l'envoyer.
  function demarrer(date) {
    return appareil().then(function (pid) {
      if (!pid) return null;
      return appel("/daily/start", "POST", { date: date, sport: "poke", pid: pid });
    }).then(function (r) {
      if (r && r.ok && r.token) poser(CLE_JETON, JSON.stringify({ date: date, token: r.token }));
      return r;
    }).catch(function () { return null; });
  }

  function jetonDe(date) {
    try {
      var j = JSON.parse(stock(CLE_JETON) || "null");
      return j && j.date === date ? j.token : null;
    } catch (e) { return null; }
  }

  //  Soumettre le RÉSUMÉ du voyage. `bilan` vient de `PokePartie.bilan()` — la
  //  même source que l'écran de fin et la carte de partage.
  //  🔴 ET LE NOM DU DRESSEUR PART AVEC. Sans lui, le serveur retombe sur le
  //     nom généré du rejeu (« Dresseur 4213 ») : le joueur se cherche dans un
  //     classement où il n'est pas, alors que le jeu lui a fait TAPER ce nom à
  //     la création. Trouvé au banc du 14/08 en lisant la forme des requêtes.
  //  ⚠️ Un joueur CONNECTÉ garde son nom de compte : le serveur ignore ce champ
  //     quand une session accompagne la requête, et c'est la bonne règle — on
  //     ne se classe pas sous le nom d'un autre.
  function soumettre(date, bilan, nom) {
    if (!bilan) return Promise.resolve(null);
    return appareil().then(function (pid) {
      if (!pid) return null;
      return appel("/daily", "POST", {
        sport: "poke", date: date, pid: pid,
        token: jetonDe(date) || undefined,
        name: nom || undefined,
        score: bilan.score,
        // Le journal ne porte QU'UN résumé : le serveur rejoue un barème, pas
        // un voyage. Voir l'en-tête de `js/poke/rejeu.js`.
        journal: [{
          acte: bilan.acte, badges: bilan.badges, ligue: !!bilan.ligue,
          vus: bilan.vus, pris: bilan.pris,
          legendaires: bilan.legendaires || [],
          equipe: (bilan.equipe || []).map(function (m) { return { niveau: m.niveau }; }),
          // 🔴 [17/08] La texture des combats — quatre nombres par type
          //    d'adversaire. Elle ne touche NI le score NI aucune borne : le
          //    serveur la borne et la range, `poke-reel` la lit. C'est la seule
          //    façon de régler la difficulté sur ce que les joueurs vivent.
          texture: bilan.texture || undefined,
        }],
        ver: W.POKE_VERSION || undefined,
      });
    }).catch(function () { return null; });
  }

  function lire(date) {
    return fetch(api() + "/daily?sport=poke&date=" + encodeURIComponent(date))
      .then(function (r) { return r.json(); })
      .catch(function () { return { err: "reseau" }; });
  }

  // ── L'écran ────────────────────────────────────────────────────────────────
  function ouvrir(hote, surFermeture, options) {
    var o = options || {};
    var date = o.date || jour();

    hote.innerHTML =
      '<h1 class="pkdx-titre">' + T("titre") + "</h1>" +
      "<p>" + T("explique") + "</p>" +
      '<p class="pkdx-bandeau">' + esc(dateLisible(date)) + "</p>" +
      // 🔴 UN CLASSEMENT SANS SA CONTRAINTE COMPARE DES CHIFFRES NUS. « 1 480 »
      //    ne dit rien ; « 1 480 en Économie de guerre » dit ce que valait la
      //    journée. La règle se dérive de la DATE affichée juste au-dessus —
      //    on la lit donc pour le jour consulté, pas pour aujourd'hui : un
      //    classement d'hier doit porter la règle d'hier.
      (function () {
        var r = W.PokeRegleDuJour ? W.PokeRegleDuJour.pour(date) : null;
        return r ? '<p class="pkdx-dit">' + esc(T("regle", { nom: r.nom[LANG()] })) + "</p>" : "";
      })() +
      '<div id="pk-ladder"><p>' + T("charge") + "</p></div>" +
      '<div class="pkdx-actions"><button type="button" class="pkdx-touche" id="pk-cl-fermer">' + T("fermer") + "</button></div>";
    // ⚠️ ENROBÉE : une suite reçue en paramètre ne s'accroche pas au DOM — son
    //    premier argument serait l'événement. Voir `tools/poke-evenement-fuite.mjs`.
    hote.querySelector("#pk-cl-fermer").addEventListener("click", function () { surFermeture(); });

    var zone = hote.querySelector("#pk-ladder");
    lire(date).then(function (j) {
      if (!j || j.err) {
        // 🔴 UNE PANNE DE CLASSEMENT NE DOIT PAS INQUIÉTER SUR LA PARTIE. On le
        //    dit explicitement : le joueur doit savoir que son voyage tient.
        zone.innerHTML = "<p>" + esc(T(j && j.err === "bad_sport" ? "ferme" : "injoignable")) + "</p>";
        return;
      }
      var top = j.top || [];
      if (!top.length) {
        zone.innerHTML = "<p>" + esc(T("vide")) + "</p><p>" + esc(T("ferme")) + "</p>";
        return;
      }
      var lignes = top.map(function (e, i) {
        var moi = o.pseudo && e.name === o.pseudo;
        return '<tr' + (moi ? ' class="est-toi"' : "") + ">" +
          "<td>" + (i + 1) + "</td>" +
          "<td>" + esc(e.name || "?") + (moi ? " (" + T("toi") + ")" : "") + "</td>" +
          "<td>" + (e.score || 0) + "</td>" +
        "</tr>";
      }).join("");
      zone.innerHTML =
        '<table class="pkdx-ladder"><thead><tr>' +
          "<th>" + T("rang") + "</th><th>" + T("dresseur") + "</th><th>" + T("score") + "</th>" +
        "</tr></thead><tbody>" + lignes + "</tbody></table>" +
        "<p>" + esc(T("total", { n: j.total || top.length })) + "</p>";
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE CERCLE DE DRESSEURS — [18/08, Poltron_sofa/Amex] « Eh oui grand absent de
  //  ce mode, pourtant le clan est présent dans Naruto et dans DB »
  //
  //  🔴 LE SERVEUR SAVAIT DÉJÀ TOUT FAIRE. `/api/league/*` porte un `sport`,
  //     `sportOf("poke")` passe depuis l'ouverture, et le classement de la
  //     semaine lit la table `daily` — où le Défi du jour de ce mode écrit ses
  //     scores avec le compte (226 journées signées en une semaine). Il ne
  //     manquait que l'ÉCRAN : c'est la classe n°1 du dossier, une mécanique
  //     livrée sans sa porte d'entrée, cette fois pour tout un mode.
  //  🔑 IL VIT ICI parce que le jeton et l'adresse de l'API vivent ici, et
  //     nulle part ailleurs (voir `pokedexSynchroniser`).
  //  ⚠️ SANS COMPTE, L'ÉCRAN LE DIT ET MÈNE À LA CONNEXION — la porte du compte
  //     est la même que sur l'accueil (`index.html?go=compte&retour=poke`).
  //  ⚠️ QUITTER SE CONFIRME EN DEUX TOUCHES sur le même bouton : le mode n'a pas
  //     de modale de confirmation, et un clan qu'on quitte d'un doigt distrait
  //     est la faute déjà payée sur « ARRÊTER LE VOYAGE ».
  //  ⚠️ `options.code` : un code arrivé par lien (`#l=CODE`) ou tapé ; s'il est
  //     là et que le joueur est connecté, on tente d'entrer tout de suite.
  // ═══════════════════════════════════════════════════════════════════════════
  function cercle(hote, surFermeture, options) {
    var o = options || {};
    // Le nom du compte, pour marquer « (toi) » dans le tableau : la clé est
    // celle de `game.js` (`ACC_KEY`), posée à la connexion, lue ici seulement.
    if (!o.pseudo) o.pseudo = stock("palmares_account") || null;
    var erreur = function (code) {
      return T({ name_too_short: "cercleErrNom", name_banned: "cercleErrNomBanni", too_many_leagues: "cercleErrTrop",
        not_found: "cercleErrIntrouvable", league_full: "cercleErrPlein", auth: "cercleSansCompte" }[code] || "cercleErrReseau");
    };
    var dire = function (texte, alerte) {
      var z = hote.querySelector("#pk-cercle-dit");
      if (!z) return;
      z.textContent = texte || "";
      z.className = "pkdx-dit" + (alerte ? " est-alerte" : "");
      z.hidden = !texte;
    };

    function tableau(lg) {
      var lignes = (lg.classement || []).map(function (m, i) {
        var moi = o.pseudo && m.name === o.pseudo;
        return '<tr' + (moi ? ' class="est-toi"' : "") + ">" +
          "<td>" + (i === 0 ? "👑" : i + 1) + "</td>" +
          "<td>" + esc(m.name || "?") + (moi ? " (" + T("toi") + ")" : "") + "</td>" +
          "<td>" + (m.pts || 0) + "</td>" +
          "<td>" + (m.played || 0) + "</td>" +
        "</tr>";
      }).join("");
      return '<section class="pkdx-cercle">' +
        '<h2 class="pkdx-titre">' + esc(lg.name) + "</h2>" +
        '<p class="pkdx-bandeau pkdx-cercle-code">' + esc(T("cercleCode", { code: lg.code })) + "</p>" +
        '<p class="pkdx-dit">' + esc(T("cercleSemaine")) + "</p>" +
        '<table class="pkdx-ladder"><thead><tr>' +
          "<th>" + T("rang") + "</th><th>" + T("dresseur") + "</th><th>" + T("cerclePoints") + "</th><th>" + T("cercleJours") + "</th>" +
        "</tr></thead><tbody>" + lignes + "</tbody></table>" +
        '<div class="pkdx-actions">' +
          '<button type="button" class="pkdx-touche" data-copier="' + esc(lg.code) + '">' + T("cercleCopier") + "</button>" +
          '<button type="button" class="pkdx-touche est-discrete" data-quitter="' + esc(lg.code) + '">' + T("cercleQuitter") + "</button>" +
        "</div>" +
      "</section>";
    }

    function formulaires() {
      return '<h2 class="pkdx-titre">' + T("cercleCreerTitre") + "</h2>" +
        '<div class="pkdx-actions pkdx-cercle-form">' +
          '<input id="pk-cercle-nom" class="pkdx-champ" maxlength="28" placeholder="' + esc(T("cercleNom")) + '" aria-label="' + esc(T("cercleNom")) + '">' +
          '<button type="button" class="pkdx-touche" id="pk-cercle-creer">' + T("cercleCreer") + "</button>" +
        "</div>" +
        '<h2 class="pkdx-titre">' + T("cercleRejoindreTitre") + "</h2>" +
        '<div class="pkdx-actions pkdx-cercle-form">' +
          '<input id="pk-cercle-code" class="pkdx-champ" maxlength="8" autocapitalize="characters" spellcheck="false"' +
            ' placeholder="' + esc(T("cercleCodeSaisie")) + '" aria-label="' + esc(T("cercleCodeSaisie")) + '" value="' + esc(o.code || "") + '">' +
          '<button type="button" class="pkdx-touche" id="pk-cercle-rejoindre">' + T("cercleRejoindre") + "</button>" +
        "</div>";
    }

    function rendre(liste) {
      var cercles = (liste || []).filter(function (lg) { return (lg.sport || "") === "poke"; });
      var zone = hote.querySelector("#pk-cercles");
      if (!zone) return;
      zone.innerHTML = (cercles.length ? cercles.map(tableau).join("") : "<p>" + esc(T("cercleAucun")) + "</p>") + formulaires();
      var boutons = zone.querySelectorAll("[data-copier]");
      for (var i = 0; i < boutons.length; i++) {
        boutons[i].addEventListener("click", function (e) {
          var b = e.currentTarget, code = b.getAttribute("data-copier");
          var fini = function () { b.textContent = T("cercleCopie"); };
          try { W.navigator.clipboard.writeText(code).then(fini, fini); } catch (err) { fini(); }
        });
      }
      var quitters = zone.querySelectorAll("[data-quitter]");
      for (var k = 0; k < quitters.length; k++) {
        quitters[k].addEventListener("click", function (e) {
          var b = e.currentTarget;
          if (b.getAttribute("data-sur") !== "oui") {
            b.setAttribute("data-sur", "oui");
            b.textContent = T("cercleQuitterSur");
            return;
          }
          appel("/league/leave", "POST", { code: b.getAttribute("data-quitter") }).then(function () { charger(); });
        });
      }
      zone.querySelector("#pk-cercle-creer").addEventListener("click", function () {
        var nom = (zone.querySelector("#pk-cercle-nom").value || "").trim();
        if (nom.length < 3) return dire(T("cercleErrNom"), true);
        appel("/league/create", "POST", { name: nom, sport: "poke" }).then(function (r) {
          if (!r || !r.ok) return dire(erreur(r && r.err), true);
          dire(T("cercleCree", { code: r.code }));
          charger(true);
        });
      });
      zone.querySelector("#pk-cercle-rejoindre").addEventListener("click", function () { rejoindre(zone.querySelector("#pk-cercle-code").value); });
    }

    function rejoindre(code) {
      code = String(code || "").trim().toUpperCase();
      if (code.length < 4) return dire(T("cercleErrIntrouvable"), true);
      appel("/league/join", "POST", { code: code }).then(function (r) {
        if (!r || !r.ok) dire(erreur(r && r.err), true);
        else dire(T("cercleRejoint", { nom: r.name || code }));
        // Dans les deux cas on redessine la liste : un code arrivé par lien
        // ouvre l'écran sur l'appel de jonction, et la liste n'est pas encore là.
        charger(true);
      });
    }

    function charger(garderDit) {
      if (!garderDit) dire("");
      appel("/league").then(function (r) {
        if (!r || !r.ok) return dire(erreur(r && r.err), true);
        rendre(r.leagues || []);
      });
    }

    var connecte = !!stock(CLE_TOKEN);
    hote.innerHTML =
      '<h1 class="pkdx-titre">' + T("cercleTitre") + "</h1>" +
      "<p>" + esc(T("cercleDit")) + "</p>" +
      '<p class="pkdx-dit" id="pk-cercle-dit" hidden></p>' +
      (connecte
        ? '<div id="pk-cercles"><p>' + T("charge") + "</p></div>"
        : "<p>" + esc(T("cercleSansCompte")) + "</p>" +
          '<div class="pkdx-actions"><button type="button" class="pkdx-touche est-definitive" id="pk-cercle-connexion">' + T("cercleConnexion") + "</button></div>") +
      '<div class="pkdx-actions est-pied"><button type="button" class="pkdx-touche" id="pk-cercle-fermer">' + T("fermer") + "</button></div>";
    hote.querySelector("#pk-cercle-fermer").addEventListener("click", function () { surFermeture(); });
    var cx = hote.querySelector("#pk-cercle-connexion");
    if (cx) cx.addEventListener("click", function () { W.location.href = "index.html?go=compte&retour=poke"; });
    if (connecte) {
      if (o.code) rejoindre(o.code); else charger();
    }
  }

  //  Combien de joueurs ont rejoint le SITE. Même route que l'accueil des quatre
  //  autres univers (`game.js` → `#player-count`), donc même nombre et même
  //  phrase : « le monde », c'est Road to Legends, pas ce mode-ci.
  //  ⚠️ ELLE SE TAIT EN CAS DE PANNE, comme toutes les portes de ce fichier :
  //     l'accueil s'affiche sans elle, et un compteur absent vaut mieux qu'un
  //     « 0 joueur » servi par une erreur réseau.
  function monde() {
    return appel("/pubstats", "GET").then(function (r) {
      return (r && r.ok && r.players > 0) ? r.players : 0;
    }).catch(function () { return 0; });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE POKÉDEX DE COMPTE MONTE ET DESCEND — 17/08/2026 (Darkjuampi)
  // ---------------------------------------------------------------------------
  //  🔴 IL VIT ICI PARCE QUE C'EST ICI QUE VIT LE RÉSEAU. `progression.js` ne
  //     connaît que le stockage local, et lui donner un `fetch` en ferait un
  //     second client HTTP à côté de celui-ci — deux en-têtes d'autorisation,
  //     deux façons de se taire en cas de panne. Le jeton et l'adresse de l'API
  //     sont déjà lus dans ce fichier, et nulle part ailleurs.
  //  🔴 LES DEUX CÔTÉS UNISSENT (`PokeFusion`), donc l'ordre ne décide de rien :
  //     on lit ce que garde le nuage, on fond avec le local, on écrit, on
  //     pousse — et le serveur refond à son tour avec ce qu'il a. Aucune de ces
  //     étapes ne peut faire rétrécir une collection.
  //  ⚠️ AUCUNE PANNE NE DOIT INQUIÉTER : sans compte, sans réseau ou sur une
  //     réponse cassée, on rend `false` et la partie continue exactement comme
  //     avant. Le Pokédex local reste la vérité de travail.
  // ═══════════════════════════════════════════════════════════════════════════
  function pokedexSynchroniser() {
    var P = W.PokeProgression, F = W.PokeFusion;
    if (!P || !F || !stock(CLE_TOKEN)) return Promise.resolve(false);
    return appel("/poke/sync").then(function (r) {
      var fondu = F.fusionner(P.lire(), (r && r.ok && r.progress) ? r.progress : {});
      P.ecrire(fondu);
      return appel("/poke/sync", "POST", { progress: fondu }).then(function (r2) {
        //  Le serveur rend ce qu'il a fondu de son côté : on l'adopte, et les
        //  deux bouts sont d'accord à la fin de l'appel.
        if (r2 && r2.ok && r2.progress) P.ecrire(F.fusionner(P.lire(), r2.progress));
        return true;
      });
    }).catch(function () { return false; });
  }

  W.PokeClassement = {
    ouvrir: ouvrir, cercle: cercle, jour: jour, dateLisible: dateLisible, lire: lire,
    demarrer: demarrer, soumettre: soumettre, appareil: appareil,
    monde: monde,
    pokedexSynchroniser: pokedexSynchroniser,
  };
})(window, document);
