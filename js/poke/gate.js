(function (W, D) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE VERROU — LE MODE EST LIVRÉ, MAIS FERMÉ
  //
  //  🔴 RÈGLE PERMANENTE DU PROJET : « tant que je dis pas d'ouvrir, tu ouvres
  //     pas. » Livrer en production est autorisé ; OUVRIR ne l'est pas. Les
  //     trois verrous ne se touchent que sur une phrase explicite du
  //     propriétaire :
  //       1. `OUVERT` ci-dessous ;
  //       2. `poke` dans `SPORTS` et `RUN_SPORTS` de `api/server.mjs` ;
  //       3. le `noindex` de `pokemon.html` et l'entrée du `sitemap.xml`.
  //
  //  ⚠️ La couche qui protège vraiment les données est LE SERVEUR. La clé
  //     ci-dessous est lisible par qui ouvre ce fichier : elle empêche un
  //     visiteur de tomber sur un chantier, pas un curieux d'entrer.
  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ OUVERT EN « DISCRET » LE 16/08/2026, sur ordre explicite du propriétaire
  //    (« discret »). Les verrous 1 et 2 tombent ; LE TROISIÈME RESTE POSÉ —
  //    `noindex` et sitemap ne bougent pas. Le mode est jouable par qui a le
  //    lien, et introuvable par un moteur de recherche : c'est ce troisième
  //    geste qui le rendrait trouvable par un ayant droit, et il n'a pas été
  //    demandé.
  var OUVERT = true;
  var CLE = "poke-4c1e7b";
  var MEMOIRE = "rtl_poke_acces";

  function autorise() {
    if (OUVERT) return true;
    try {
      var q = W.location.search || "";
      if (q.indexOf("cle=" + CLE) >= 0) {
        W.localStorage.setItem(MEMOIRE, "1");
        // On retire la clé de la barre d'adresse : sinon elle part dans la
        // première capture d'écran ou le premier lien recopié.
        if (W.history && W.history.replaceState) {
          W.history.replaceState({}, "", W.location.pathname);
        }
        return true;
      }
      return W.localStorage.getItem(MEMOIRE) === "1";
    } catch (e) {
      return false;
    }
  }

  function attente() {
    // Écran court et net. Une version qui énumérait les chantiers en cours a
    // été refusée sur le mode Dragon Ball : « ça sonnait comme une machine ».
    var hote = D.getElementById("poke-racine");
    if (!hote) return;
    hote.innerHTML =
      '<div class="pkdx">' +
        '<div class="pkdx-charniere"></div>' +
        '<div class="pkdx-ecran">' +
          '<h1 class="pkdx-titre">Mode Pokémon</h1>' +
          "<p>En cours de développement. Le monde est posé, les créatures aussi. " +
          "Les routes de Kanto s'écrivent encore.</p>" +
          "<p>Reviens bientôt.</p>" +
        "</div>" +
      "</div>";
  }

  function injecter() {
    // 🔴 L'ORDRE N'EST PLUS DANS LA PAGE. On charge d'abord `js/poke/ordre.js`,
    //    qui EST la liste, puis on la suit. Une seule source, lue aussi par le
    //    harnais et par le serveur — deux ordres qui divergent, c'est un score
    //    refusé chez un joueur honnête.
    // 🔴 LA VERSION VIENT DE `data-v`, ET ELLE EST LA SEULE. Elle est restée
    //    bloquée à « 2 » pendant des heures parce que mes bumps remplaçaient
    //    `v=13` par `v=14` sans jamais toucher `data-v="2"` — les guillemets.
    //    Tous les scripts du mode étaient servis périmés, et les correctifs ne
    //    s'appliquaient pas. On la lit aussi depuis l'URL de CE script, pour
    //    qu'un seul bump suffise même si l'attribut est oublié.
    var moi = D.currentScript;
    var version = (moi && moi.getAttribute("data-v")) || "1";
    if (moi && moi.src) {
      var m = moi.src.match(/[?&]v=(\d+)/);
      if (m && +m[1] > +version) version = m[1];
    }
    // La veille s'ouvre ICI, où la version chargée est connue — et pas dans un
    // coin du fichier où elle serait écrite sans jamais être appelée.
    versionChargee = +version || 0;
    // La porte que le mode appelle quand il vient de sceller son état.
    W.PokeVeille = {
      momentSur: momentSur,
      perimee: function () { return versionServie > versionChargee; },
    };
    ouvrirLaVeille(version);
    charger("js/poke/ordre.js?v=" + version, function () {
      var fichiers = (W.POKE_ORDRE || []).map(function (f) { return f + "?v=" + version; });
      if (!fichiers.length) {
        if (W.console) W.console.error("[poke] ordre de chargement vide");
        return;
      }
      suite(fichiers, 0);
    });
  }

  function charger(src, ok) {
    var s = D.createElement("script");
    s.src = src;
    s.onload = ok;
    s.onerror = function () {
      // Un fichier manquant doit se VOIR. Un moteur à moitié chargé produit des
      // parties fantômes, et personne ne saurait d'où elles viennent.
      if (W.console) W.console.error("[poke] fichier introuvable : " + src);
    };
    D.head.appendChild(s);
  }

  function suite(fichiers, i) {
    if (i >= fichiers.length) return demarrer();
    charger(fichiers[i], function () { suite(fichiers, i + 1); });
  }


  function demarrer() {
    // 🔴 PIÈGE PAYÉ SUR LE MODE DRAGON BALL : le démarrage s'accroche à
    //    `DOMContentLoaded`, qui est DÉJÀ PASSÉ quand le verrou injecte les
    //    scripts — l'accueil restait figé sur ses squelettes. On pose donc un
    //    drapeau que l'interface lit.
    //    ⚠️ Ne PAS tester `document.readyState` : en `defer` il vaut
    //    « interactive », indiscernable de l'après-chargement.
    W.RTL_DEMARRAGE_IMMEDIAT = true;
    if (typeof W.PokeDemarrer === "function") W.PokeDemarrer();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LE SERVICE WORKER — CE QUI REND LE MODE JOUABLE HORS LIGNE ET INSTALLABLE
  //
  //  🔴 IL N'ÉTAIT ENREGISTRÉ QUE DEPUIS `js/game.js`, que cette page ne charge
  //     pas — et ne doit pas charger : il porte le travail des autres modes, et
  //     la règle du projet interdit de le déployer d'ici. Conséquence : le mode
  //     Pokémon n'était ni installable ni jouable hors ligne, alors que le
  //     cahier des charges l'exige. Les trois autres modes l'ont depuis juillet.
  //
  //  🔴 ON L'ENREGISTRE MÊME QUAND LE MODE EST FERMÉ. Le service worker est
  //     celui du SITE, pas du mode : le refuser ici priverait aussi l'accueil du
  //     hors-ligne pour un joueur arrivé par cette page. Le verrou reste ce qui
  //     décide de montrer le jeu ou l'écran d'attente.
  //
  //  ⚠️ HORS CONTEXTE SÉCURISÉ, ON NE TENTE MÊME PAS. En `http://` sur une IP
  //     locale, l'enregistrement échoue avec une erreur rouge dans la console à
  //     chaque chargement — du bruit qui finit par masquer les vraies.
  function poserLeServiceWorker() {
    if (!("serviceWorker" in W.navigator)) return;
    var sur = W.isSecureContext ||
      W.location.protocol === "https:" ||
      W.location.hostname === "localhost" ||
      W.location.hostname === "127.0.0.1";
    if (!sur) return;
    W.navigator.serviceWorker.register("/service-worker.js").catch(function () { /* hors ligne */ });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LA VEILLE DE VERSION — 21/08/2026
  //
  //  🔴 LE MODE N'EN AVAIT AUCUNE, ET ÇA S'EST VU LE JOUR MÊME. lo1845 et
  //     Rayhane ont signalé un défaut corrigé et déployé UNE HEURE PLUS TÔT :
  //     leur page était restée ouverte, leur JS en mémoire. Les deux autres
  //     univers ont ce garde-fou dans `game.js` — mais `pokemon.html` ne charge
  //     pas `game.js`, il ne charge que ce fichier. Personne ne veillait ici.
  //  ⚠️ Et la veille de `game.js` ne nous aurait pas sauvés : son motif
  //     `js/[A-Za-z0-9._-]+\.js` n'a pas la barre oblique, donc il ne voit aucun
  //     `js/poke/**`. Un motif qui décrit une arborescence doit accepter la barre.
  //
  //  🔑 CE FICHIER EST LE SEUL À CONNAÎTRE LA VERSION CHARGÉE. La poser ailleurs
  //     ferait une seconde vérité à tenir d'accord — le motif que ce dossier a
  //     déjà payé six fois.
  //  ⚠️ ON NE COUPE JAMAIS UNE PARTIE. Le bandeau se pose, il ne recharge pas :
  //     un rechargement d'autorité au milieu d'un combat coûterait le voyage.
  //     Et il ne revient pas : refusé une fois, il se tait.
  // ═══════════════════════════════════════════════════════════════════════════
  var DELAI_VEILLE = 10 * 60 * 1000;   // même fenêtre que les deux autres modes
  var derniereVeille = 0;
  var bandeauPose = false;
  var versionChargee = 0;              // celle que ce joueur exécute
  var versionServie = 0;               // la plus haute vue en production
  var CLE_TENTATIVE = "poke_maj_tentee";

  function dire(cle, repli) {
    try {
      if (W.PokeUI && W.PokeUI.T) {
        var t = W.PokeUI.T(cle);
        if (t && t !== cle) return t;
      }
    } catch (e) {}
    return repli;
  }

  function poserBandeau() {
    if (bandeauPose || !D.body) return;
    bandeauPose = true;
    var d = D.createElement("div");
    d.className = "pk-maj";
    d.setAttribute("role", "status");
    var txt = D.createElement("div");
    txt.className = "pk-maj-txt";
    var fort = D.createElement("strong");
    fort.textContent = dire("majTitre", "Une nouvelle version est sortie.");
    var sous = D.createElement("span");
    sous.textContent = dire("majDit", "Ton voyage en cours est gardé.");
    txt.appendChild(fort);
    txt.appendChild(sous);
    var go = D.createElement("button");
    go.type = "button";
    go.className = "pk-maj-go";
    go.textContent = dire("majBtn", "RECHARGER");
    go.addEventListener("click", function () { W.location.reload(); });
    var tard = D.createElement("button");
    tard.type = "button";
    tard.className = "pk-maj-x";
    tard.textContent = dire("majPlusTard", "PLUS TARD");
    tard.setAttribute("aria-label", dire("majPlusTard", "PLUS TARD"));
    tard.addEventListener("click", function () { d.remove(); });
    d.appendChild(txt);
    d.appendChild(go);
    d.appendChild(tard);
    D.body.appendChild(d);
  }

  function veiller(version) {
    if (bandeauPose || !W.navigator.onLine) return;
    var t = +new Date();
    if (t - derniereVeille < DELAI_VEILLE) return;
    derniereVeille = t;
    // 🔴 LA SONDE NE DOIT PAS EMPOISONNER LE CACHE. On interroge la page avec
    //    une clé BIDON, jamais avec le prochain numéro de version : sonder
    //    `?v=766` avant de livrer sous 766 peuplerait le cache de l'ancienne
    //    page, et le joueur recevrait le vieux fichier sous la bonne clé.
    var url = W.location.pathname + "?sonde=" + t;
    try {
      W.fetch(url, { cache: "no-store" }).then(function (r) {
        return r.ok ? r.text() : null;
      }).then(function (html) {
        if (!html) return;
        var haut = 0;
        var re = /js\/poke\/gate\.js\?v=(\d+)|data-v="(\d+)"/g, m;
        while ((m = re.exec(html))) {
          var n = +(m[1] || m[2]);
          if (n > haut) haut = n;
        }
        versionServie = haut;
        // 🔴 ON POSE LE BANDEAU, ON NE RECHARGE PAS D'ICI. J'avais ajouté un
        //    `momentSur()` à cet endroit « pour ne pas attendre le clic » : la
        //    veille se déclenche au RETOUR SUR L'ONGLET, et un joueur revient
        //    souvent en plein combat. Ça rechargeait donc pendant un combat —
        //    précisément ce que tout ce montage existe pour empêcher, puisque
        //    `voyageEcrire` ne garde l'état qu'à la carte.
        //  ⚠️ Le forçage part d'UN SEUL endroit : `momentSur()`, appelé par la
        //    carte quand elle vient de sceller l'état. Une seconde porte, c'est
        //    une seconde vérité — et celle-ci coûtait un combat.
        if (haut > +version) poserBandeau();
      }).catch(function () { /* hors ligne : on retentera */ });
    } catch (e) { /* pas de fetch : tant pis, on ne casse rien */ }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  FORCER, MAIS SEULEMENT LÀ OÙ ÇA NE COÛTE RIEN
  //
  //  🔴 UN BANDEAU QU'ON REFUSE NE PROTÈGE PERSONNE. « PLUS TARD » veut dire
  //     « je continue sur l'ancienne version » — et une partie jouée sur du code
  //     périmé finit en écart de score au rejeu serveur, côté joueur honnête.
  //     On force donc le rechargement.
  //
  //  ⚠️ MAIS PAS N'IMPORTE QUAND, ET C'EST TOUT LE SUJET. `voyageEcrire` ne
  //     garde l'état QU'À LA CARTE, exprès (ui.js le dit : « un geste de travers
  //     en plein combat le perdait »). Recharger pendant un combat coûterait le
  //     combat, parfois le voyage. Le mode appelle donc `momentSur()` au moment
  //     précis où il vient de sceller son état — et c'est le SEUL endroit d'où
  //     un rechargement d'autorité peut partir.
  //
  //  🔴 ET UN GARDE-FOU CONTRE LA BOUCLE. Si la page rechargée revient encore
  //     périmée — livraison à moitié faite, HTML neuf et script en cache — un
  //     forçage sans mémoire rechargerait à l'infini, et le joueur ne pourrait
  //     plus jouer du tout. On note la version visée dans la session : on ne
  //     tente qu'UNE fois par version, ensuite le bandeau reprend la main.
  // ═══════════════════════════════════════════════════════════════════════════
  function dejaTente(cible) {
    try { return W.sessionStorage.getItem(CLE_TENTATIVE) === String(cible); }
    catch (e) { return false; }
  }
  function noterTentative(cible) {
    try { W.sessionStorage.setItem(CLE_TENTATIVE, String(cible)); } catch (e) {}
  }

  function momentSur() {
    if (!versionServie || versionServie <= versionChargee) return false;
    if (dejaTente(versionServie)) return false;   // on a déjà essayé : on n'insiste pas
    noterTentative(versionServie);
    W.location.reload();
    return true;
  }

  function ouvrirLaVeille(version) {
    // Au retour sur l'onglet : c'est le moment où le joueur revient, et le seul
    // où un rechargement ne lui coûte rien.
    D.addEventListener("visibilitychange", function () {
      if (!D.hidden) veiller(version);
    });
    W.setTimeout(function () { veiller(version); }, 60000);
  }

  poserLeServiceWorker();
  if (autorise()) injecter();
  else attente();
})(window, document);
