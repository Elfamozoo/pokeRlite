(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LE HASARD DU MODE POKÉMON — SOURCE UNIQUE
  //
  //  🔴 Aucun `Math.random`, aucun `Date.now`, aucun `new Date()` ailleurs dans
  //     `js/poke/`. Le contrôle `tools/poke-rng.mjs` fait échouer la livraison
  //     s'il en trouve un.
  //
  //  Pourquoi c'est absolu : le serveur REJOUE la partie entière à partir du
  //  journal de choix du joueur pour valider son score. Un seul tirage qui
  //  n'est pas issu de cette graine, et le rejeu diverge — le joueur voit
  //  « score refusé » et il a perdu son unique essai de la journée. Le mode
  //  Dragon Ball et le mode ninja refusent ainsi ~25 % des défis du jour ; on
  //  ne recommence pas.
  //
  //  🔴 Corollaire, aussi important : le NOMBRE et l'ORDRE des tirages font
  //     partie du contrat. Retirer un tirage décale tout ce qui suit. Quand une
  //     règle change, soit on consomme quand même le tirage, soit on protège le
  //     changement par un verrou daté (voir `avantLe` plus bas).
  // ═══════════════════════════════════════════════════════════════════════════

  // mulberry32 — même générateur que le reste de Road to Legends. Petit, rapide,
  // et surtout : identique au bit près entre le navigateur et Node.
  function graineDe(texte) {
    var h = 1779033703 ^ texte.length;
    for (var i = 0; i < texte.length; i++) {
      h = Math.imul(h ^ texte.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }

  function Hasard(graine) {
    // Le compteur de tirages n'est pas un gadget : c'est lui qui permet de
    // situer une divergence de rejeu à un tirage près au lieu de relire toute
    // la partie.
    this.etat = (typeof graine === "string" ? graineDe(graine) : graine >>> 0) || 1;
    this.tirages = 0;
    this.source = graine;
  }

  Hasard.prototype.brut = function () {
    this.tirages++;
    this.etat = (this.etat + 0x6d2b79f5) >>> 0;
    var t = this.etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Entier dans [0, n[ — la forme utilisée partout. On passe par le flottant
  // brut plutôt que par un modulo sur l'état, pour que le compteur de tirages
  // compte exactement une consommation par appel.
  Hasard.prototype.entier = function (n) {
    return Math.floor(this.brut() * n);
  };

  // Entier dans [a, b] inclus.
  Hasard.prototype.entre = function (a, b) {
    return a + this.entier(b - a + 1);
  };

  // Un jet de pourcentage. `chance` est en pour cent, 0 à 100.
  Hasard.prototype.chance = function (pourcent) {
    return this.brut() * 100 < pourcent;
  };

  // Tirage pondéré sur une liste d'objets portant un champ de poids.
  // 🔴 Il consomme EXACTEMENT un tirage, quelle que soit la liste. Une
  //    implémentation qui boucle en tirant à chaque tour rendrait le rejeu
  //    dépendant du contenu de la liste, donc du jour où on l'a écrite.
  Hasard.prototype.pondere = function (liste, champ) {
    var cle = champ || "poids";
    var total = 0, i;
    for (i = 0; i < liste.length; i++) total += liste[i][cle] || 0;
    if (total <= 0) return liste.length ? liste[this.entier(liste.length)] : null;
    var seuil = this.brut() * total;
    for (i = 0; i < liste.length; i++) {
      seuil -= liste[i][cle] || 0;
      if (seuil < 0) return liste[i];
    }
    return liste[liste.length - 1];
  };

  // Un élément au hasard.
  Hasard.prototype.dans = function (liste) {
    return liste.length ? liste[this.entier(liste.length)] : null;
  };

  // Mélange de Fisher-Yates. Consomme `n - 1` tirages, toujours.
  Hasard.prototype.melange = function (liste) {
    var out = liste.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = this.entier(i + 1);
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  };

  // Un générateur DÉRIVÉ, pour un sous-système qui ne doit pas décaler le
  // tirage principal (l'aléa d'affichage, un duel entre deux joueurs).
  // Le dérivé a sa propre suite ; le parent ne bouge pas.
  Hasard.prototype.derive = function (etiquette) {
    return new Hasard(graineDe(String(this.source) + "|" + etiquette));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  UN CHOIX À PLUSIEURS POUR UN SEUL TIRAGE
  //
  //  🔴 CE CODE VIVAIT DANS `acquis.js`, ET IL N'Y AVAIT RIEN À FAIRE. Ce qu'il
  //     résout n'est pas une question d'acquis : c'est le contrat du hasard de
  //     ce mode — le NOMBRE de tirages consommés fait partie du contrat de
  //     rejeu (voir l'en-tête). Une carte qui offre trois options ne doit
  //     consommer qu'UN tirage, sinon tout ce qui suit dans le voyage se décale
  //     et le serveur refuse le score.
  //     La deuxième carte à offrir un choix — la capsule technique — allait
  //     donc appeler `PokeAcquis.triplet` pour déplier des CAPSULES. Le jour où
  //     quelqu'un aurait touché aux acquis, il aurait cassé les capsules sans
  //     le savoir. La combinatoire remonte ici, où les deux la lisent.
  //
  //  ✅ `h.entier(n)` appelle `brut()` UNE fois quelle que soit sa borne. On
  //     tire donc un rang parmi TOUS les sous-ensembles possibles, et on le
  //     déplie sans toucher au hasard : un seul tirage, le flux inchangé à
  //     l'octet, et la variété complète.
  //  ⚠️ Le dépliage est un dérangement lexicographique, pas un bricolage : il
  //     lui faut être une bijection, sinon certaines offres ne sortiraient
  //     jamais et d'autres deux fois plus souvent.
  // ═══════════════════════════════════════════════════════════════════════════
  function parmi(n, k) {          // le nombre de façons de choisir k parmi n
    if (k < 0 || k > n) return 0;
    var r = 1;
    for (var i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
    return Math.round(r);
  }

  // Combien d'offres distinctes un vivier de cette taille peut composer.
  function combienDeChoix(taille, k) {
    return Math.max(1, parmi(taille, Math.min(k || 3, taille)));
  }

  // L'offre de rang `rang`, dépliée sans consommer de hasard.
  function choixDeRang(vivier, rang, k) {
    var n = vivier.length, pris = Math.min(k || 3, n);
    if (n <= pris) return vivier.slice();
    var out = [], reste = rang % parmi(n, pris), i = 0;
    for (var d = 0; d < pris; d++) {
      for (; i < n; i++) {
        var c = parmi(n - i - 1, pris - d - 1);
        if (reste < c) { out.push(vivier[i]); i++; break; }
        reste -= c;
      }
    }
    return out;
  }

  // ── Verrous datés ──────────────────────────────────────────────────────────
  //  Corriger une règle change le tirage. Les parties déjà en cours doivent
  //  continuer à rejouer l'ANCIENNE règle, sinon leur score est refusé.
  //  🔴 La borne est STRICTEMENT antérieure au premier jour public, jamais
  //     égale : le 03/08/2026, une borne posée sur le jour même de l'ouverture
  //     a éteint une mécanique entière pour le tout premier défi public.
  function avantLe(dateGraine, borne) {
    return String(dateGraine || "") <= String(borne);
  }

  W.PokeHasard = Hasard;
  W.PokeChoix = { combien: combienDeChoix, deRang: choixDeRang };
  W.pokeGraineDe = graineDe;
  W.pokeAvantLe = avantLe;
})(typeof window !== "undefined" ? window : globalThis);
