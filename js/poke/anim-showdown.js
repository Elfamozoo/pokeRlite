(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  MOTEUR D'EFFETS ET D'ANIMATIONS DE COMBAT CANVAS 2D (SHOWDOWN)
  //
  //  Rendu moderne, fluide et haute performance des effets visuels d'attaques
  //  et d'auras de statistiques (buffs / debuffs).
  //  - Pure Vanilla ES5 enveloppé dans une IIFE propre.
  //  - Zéro dépendance externe.
  //  - Strict respect des règles du noyau : module d'affichage pur, aucun état
  //    muté fuyant dans la simulation de combat ou le moteur de rejeu.
  //  - Zéro appel non-déterministe (Math.random, Date.now) affectant la logique.
  //  - Résilience headless et mock pour tests Node.js sans plantage.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 1. Utilitaires de normalisation et d'aléatoire déterministe ────────────

  function normaliser(txt) {
    if (!txt) return "";
    var s = String(txt).toLowerCase();
    s = s.replace(/[éèêë]/g, "e")
         .replace(/[àâä]/g, "a")
         .replace(/[îï]/g, "i")
         .replace(/[ôö]/g, "o")
         .replace(/[ûüù]/g, "u")
         .replace(/[ç]/g, "c");
    return s.replace(/[^a-z0-9]/g, "");
  }

  function extraireCle(attCle) {
    if (!attCle) return "";
    if (typeof attCle === "string") return normaliser(attCle);
    if (typeof attCle === "object") {
      if (attCle.cle) return normaliser(attCle.cle);
      if (attCle.nom) {
        if (typeof attCle.nom === "string") return normaliser(attCle.nom);
        if (typeof attCle.nom === "object") {
          return normaliser(attCle.nom.fr || attCle.nom.en || "");
        }
      }
      if (typeof attCle.id === "number" && W.POKE_ATTAQUES && W.POKE_ATTAQUES[attCle.id - 1]) {
        return normaliser(W.POKE_ATTAQUES[attCle.id - 1].cle);
      }
    }
    return normaliser(String(attCle));
  }

  // Pseudo-aléatoire déterministe trigonométrique pour effets visuels (sparks, débris)
  function alea(seed) {
    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // ── 2. Catalogue des signatures d'attaque ─────────────────────────────────

  var SIGNATURES = {
    elec: [
      "tonnerre", "thunderbolt", "fatalfoudre", "thunder", "eclair",
      "thundershock", "etincelle", "spark", "poingeclair", "thunderpunch",
      "cageeclair", "thunderwave", "ondechoc", "shockwave"
    ],
    eau: [
      "surf", "cascade", "waterfall", "hydropump", "hydrocanon",
      "hydroqueue", "aquatail", "surfwave", "ebullition", "scald"
    ],
    sol: [
      "seisme", "earthquake", "ampleur", "magnitude", "abime",
      "fissure", "pietinement", "bulldoze", "tunnel", "dig",
      "eboulement", "rockslide", "tomberoche", "rocktomb"
    ],
    feu: [
      "lanceflammes", "flamethrower", "deflagration", "fireblast",
      "flammeche", "ember", "boutefeu", "flareblitz", "danseflammes",
      "firespin", "poingfeu", "firepunch", "rouedefeu", "flamewheel",
      "surchauffe", "overheat", "canicule", "heatwave"
    ],
    glace: [
      "laserglace", "icebeam", "blizzard", "ventglace", "icywind",
      "poingglace", "icepunch", "crocsgivre", "icefang", "stalagtite",
      "iciclespear", "chuteglace", "iciclecrash"
    ],
    tranche: [
      "tranche", "slash", "griffe", "scratch", "morsure", "bite",
      "machouille", "crunch", "coupe", "cut", "tranchherbe",
      "razorleaf", "griffesacier", "metalclaw", "aeropique",
      "aerialace", "crocs", "fang", "lamefeuille", "leafblade",
      "fauxchage", "falseswipe", "plaiecroix", "xscissor",
      "tranchenuit", "nightslash"
    ],
    psy: [
      "psyko", "psychic", "psychicm", "ballombre", "shadowball",
      "vibrobscur", "darkpulse", "rafalepsy", "psybeam", "chocmental",
      "confusion", "devoreve", "dreameater", "prescience",
      "futuresight", "ondechaos", "shadowpunch", "ombreportee",
      "shadowsneak", "extrasenseur", "extrasensory"
    ]
  };

  function identifierSignature(cleNorm) {
    if (!cleNorm) return null;
    for (var cat in SIGNATURES) {
      if (Object.prototype.hasOwnProperty.call(SIGNATURES, cat)) {
        var liste = SIGNATURES[cat];
        for (var i = 0; i < liste.length; i++) {
          if (cleNorm === liste[i]) return cat;
        }
      }
    }
    return null;
  }

  function estAttaqueSignature(attCle) {
    var c = extraireCle(attCle);
    return identifierSignature(c) !== null;
  }

  // ── 3. Montage et dimensionnement Canvas HiDPI ────────────────────────────

  function monter(hote) {
    if (!hote) return null;

    var canvas = null;
    if (typeof hote.querySelector === "function") {
      canvas = hote.querySelector("canvas.pk-arene-fx") || hote.querySelector(".pk-arene-fx");
    } else if (hote.getElementsByClassName) {
      var els = hote.getElementsByClassName("pk-arene-fx");
      if (els && els.length > 0) canvas = els[0];
    }

    if (!canvas) {
      var doc = (W.document && typeof W.document.createElement === "function") ? W.document : null;
      if (doc) {
        canvas = doc.createElement("canvas");
      } else {
        canvas = { style: {} };
      }
      canvas.className = "pk-arene-fx";
      if (typeof hote.appendChild === "function") {
        hote.appendChild(canvas);
      }
    }

    var dpr = (typeof W.devicePixelRatio === "number" && W.devicePixelRatio > 0) ? W.devicePixelRatio : 1;
    var w = (hote && hote.clientWidth) || 800;
    var h = (hote && hote.clientHeight) || 480;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    if (canvas.style) {
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "4";
      canvas.style.cssText = "position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 4;";
    }

    return canvas;
  }

  // ── 4. Boucle d'animation fluide ──────────────────────────────────────────

  function animer(dureeMs, onCadre, onFin) {
    var debut = null;
    var fini = false;
    var dernier = 0;

    function etape(timestamp) {
      if (fini) return;
      if (timestamp == null) {
        dernier += 16.6;
        timestamp = dernier;
      }
      if (debut == null) debut = timestamp;
      var ecoule = timestamp - debut;
      var p = Math.min(1, Math.max(0, ecoule / dureeMs));

      onCadre(p);

      if (p >= 1) {
        fini = true;
        if (typeof onFin === "function") onFin();
      } else {
        if (typeof W.requestAnimationFrame === "function") {
          W.requestAnimationFrame(etape);
        } else if (typeof W.setTimeout === "function") {
          W.setTimeout(function () { etape(null); }, 16);
        } else {
          fini = true;
          if (typeof onFin === "function") onFin();
        }
      }
    }

    if (typeof W.requestAnimationFrame === "function") {
      W.requestAnimationFrame(etape);
    } else if (typeof W.setTimeout === "function") {
      W.setTimeout(function () { etape(null); }, 16);
    } else {
      onCadre(1);
      if (typeof onFin === "function") onFin();
    }
  }

  function obtenirPositions(canvas, coteAttaquant) {
    var w = (canvas && canvas.width) || 800;
    var h = (canvas && canvas.height) || 480;

    var estJoueur = (coteAttaquant === "joueur" || coteAttaquant === "player");
    // Position perspective Showdown: camp joueur en bas à gauche, adverse en haut à droite
    var posJoueur = { x: w * 0.25, y: h * 0.72 };
    var posAdverse = { x: w * 0.75, y: h * 0.32 };

    return {
      source: estJoueur ? posJoueur : posAdverse,
      cible: estJoueur ? posAdverse : posJoueur,
      w: w,
      h: h
    };
  }

  // ── 5. Rendu des attaques signatures ──────────────────────────────────────

  // Tonnerre / Fatal-Foudre : Éclair vertical brisé + gerbe d'étincelles + flash d'arène
  function dessinerTonnerre(ctx, p, geo) {
    var sx = geo.cible.x;
    var sy = geo.cible.y;

    // Flash lumineux en tout début d'impact
    if (p < 0.25) {
      ctx.fillStyle = "rgba(255, 255, 255, " + (0.35 * (1 - p * 4)) + ")";
      ctx.fillRect(0, 0, geo.w, geo.h);
    }

    if (p < 0.75) {
      var progressFoudre = Math.min(1, p * 2.5);
      var yHaut = 0;
      var yBas = yHaut + (sy - yHaut) * progressFoudre;

      ctx.save();
      ctx.shadowColor = "#66ffff";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx, yHaut);

      var etapes = 8;
      for (var i = 1; i <= etapes; i++) {
        var frac = i / etapes;
        var cy = yHaut + (yBas - yHaut) * frac;
        var offset = (frac < 1) ? (alea(i * 13 + Math.floor(p * 10)) - 0.5) * 50 : 0;
        ctx.lineTo(sx + offset, cy);
      }
      ctx.stroke();

      // Halo externe jaune électrique
      ctx.strokeStyle = "rgba(255, 255, 100, 0.6)";
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();
    }

    // Étincelles radiales à l'impact
    if (p > 0.2) {
      var sparkP = (p - 0.2) / 0.8;
      var nbSparks = 10;
      ctx.save();
      for (var s = 0; s < nbSparks; s++) {
        var angle = (s / nbSparks) * Math.PI * 2 + alea(s) * 0.5;
        var dist = sparkP * 80 * (0.5 + alea(s * 7) * 0.5);
        var px = sx + Math.cos(angle) * dist;
        var py = sy + Math.sin(angle) * dist;
        var r = Math.max(1, (1 - sparkP) * 4);

        ctx.fillStyle = s % 2 === 0 ? "#ffff66" : "#66ffff";
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Surf / Cascade : Grande vague déferlante bleue balayant le terrain
  function dessinerSurf(ctx, p, geo) {
    var xDepart = geo.source.x;
    var xArrivee = geo.cible.x + (geo.cible.x - geo.source.x) * 0.3;
    var xVague = xDepart + (xArrivee - xDepart) * p;
    var ySol = (geo.source.y + geo.cible.y) * 0.5 + 40;
    var amplitude = Math.sin(p * Math.PI) * 70;

    ctx.save();
    // Corps de la vague
    ctx.beginPath();
    ctx.moveTo(xVague - 120, ySol + 60);
    ctx.quadraticCurveTo(xVague - 40, ySol - amplitude * 1.3, xVague, ySol - amplitude);
    ctx.quadraticCurveTo(xVague + 40, ySol - amplitude * 0.7, xVague + 100, ySol + 60);
    ctx.closePath();

    var grad = ctx.createLinearGradient(xVague - 80, ySol - amplitude, xVague + 80, ySol + 60);
    grad.addColorStop(0, "rgba(56, 189, 248, 0.85)");
    grad.addColorStop(0.5, "rgba(14, 165, 233, 0.75)");
    grad.addColorStop(1, "rgba(3, 105, 161, 0.9)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Écume blanche au sommet de la crête
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(xVague, ySol - amplitude, 25, Math.PI, Math.PI * 1.8);
    ctx.stroke();

    // Gouttes et bulles d'eau
    var nbBulles = 12;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (var b = 0; b < nbBulles; b++) {
      var bx = xVague + (alea(b * 3 + p) - 0.5) * 110;
      var by = ySol - amplitude * 0.8 + (alea(b * 5) - 0.5) * 40;
      var br = 2 + alea(b) * 3;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Séisme / Ampleur : Fissure de sol craquelée, secousse et projection de blocs de pierre
  function dessinerSeisme(ctx, p, geo) {
    var sx = geo.source.x;
    var sy = geo.source.y;
    var cx = geo.cible.x;
    var cy = geo.cible.y;

    // Secousse de caméra via translation
    var amplitudeSecousse = (1 - p) * 10;
    var shakeX = Math.sin(p * 35) * amplitudeSecousse;
    var shakeY = Math.cos(p * 28) * amplitudeSecousse * 0.5;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Lignes de faille tellurique
    var fissureProgress = Math.min(1, p * 2);
    var nbSegments = 7;
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    for (var s = 1; s <= nbSegments; s++) {
      var t = (s / nbSegments) * fissureProgress;
      var fx = sx + (cx - sx) * t;
      var fy = sy + (cy - sy) * t;
      var decalage = (s % 2 === 0 ? 1 : -1) * 15 * alea(s);
      ctx.lineTo(fx + decalage, fy);
    }
    ctx.stroke();

    // Roches et débris projetés en parabole
    var nbRoches = 8;
    for (var r = 0; r < nbRoches; r++) {
      var rockP = Math.min(1, Math.max(0, (p - 0.1) / 0.9));
      var rAngle = (r / nbRoches) * Math.PI - 0.2;
      var rx = cx + Math.cos(rAngle) * (rockP * 70);
      var hauteurMax = 50 + alea(r * 4) * 40;
      var ry = cy - Math.sin(rockP * Math.PI) * hauteurMax;

      ctx.fillStyle = r % 2 === 0 ? "#78716c" : "#57534e";
      ctx.beginPath();
      ctx.arc(rx, ry, 3 + alea(r) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Lance-Flammes / Déflagration : Jet ondulatoire de particules de feu thermiques
  function dessinerLanceFlammes(ctx, p, geo) {
    var sx = geo.source.x;
    var sy = geo.source.y;
    var cx = geo.cible.x;
    var cy = geo.cible.y;

    var nbFlammes = 22;
    ctx.save();
    for (var f = 0; f < nbFlammes; f++) {
      var decalageTemps = (f / nbFlammes) * 0.5;
      var fp = p - decalageTemps;
      if (fp <= 0 || fp > 1) continue;

      var t = fp / 0.8;
      if (t > 1) t = 1;

      // Trajectoire ondulatoire vers la cible
      var px = sx + (cx - sx) * t;
      var py = sy + (cy - sy) * t + Math.sin(t * Math.PI * 4 + f) * 15;
      var taille = 6 + t * 24;

      var alpha = (1 - (t * 0.5)) * (1 - fp * 0.3);
      if (alpha < 0) alpha = 0;

      // Dégradé thermique : noyau jaune -> pourtour rouge incandescent
      var r = Math.max(1, taille);
      var grad = ctx.createRadialGradient(px, py, r * 0.2, px, py, r);
      grad.addColorStop(0, "rgba(254, 240, 138, " + alpha + ")");
      grad.addColorStop(0.4, "rgba(249, 115, 22, " + (alpha * 0.85) + ")");
      grad.addColorStop(1, "rgba(220, 38, 38, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Laser Glace / Blizzard : Faisceau cryogénique givré + éclats de prismes cristallins
  function dessinerLaserGlace(ctx, p, geo) {
    var sx = geo.source.x;
    var sy = geo.source.y;
    var cx = geo.cible.x;
    var cy = geo.cible.y;

    ctx.save();
    // Faisceau cryogénique
    if (p < 0.7) {
      var beamP = Math.min(1, p * 2);
      var bx = sx + (cx - sx) * beamP;
      var by = sy + (cy - sy) * beamP;

      // Halo externe bleuté
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Cœur blanc de glace
      ctx.strokeStyle = "#f0f9ff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    // Cristaux de glace en losanges éclatant à l'impact
    if (p > 0.3) {
      var cryoP = (p - 0.3) / 0.7;
      var nbCristaux = 8;
      for (var c = 0; c < nbCristaux; c++) {
        var angle = (c / nbCristaux) * Math.PI * 2 + cryoP * 1.5;
        var dist = cryoP * 65 * (0.6 + alea(c * 2) * 0.4);
        var px = cx + Math.cos(angle) * dist;
        var py = cy + Math.sin(angle) * dist;
        var taille = (1 - cryoP) * 8;

        ctx.fillStyle = c % 2 === 0 ? "#bae6fd" : "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(px, py - taille);
        ctx.lineTo(px + taille * 0.6, py);
        ctx.lineTo(px, py + taille);
        ctx.lineTo(px - taille * 0.6, py);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Tranche / Griffe / Morsure : Arcs cinétiques d'énergie tranchante
  function dessinerTranche(ctx, p, geo) {
    var cx = geo.cible.x;
    var cy = geo.cible.y;

    ctx.save();
    var slashP = Math.min(1, p * 1.8);
    var longueur = slashP * 70;

    // Premier coup tranchant diagonal
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "rgba(255, 255, 255, " + (1 - p * 0.5) + ")";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - longueur, cy - longueur * 0.7);
    ctx.lineTo(cx + longueur, cy + longueur * 0.7);
    ctx.stroke();

    // Deuxième coup croisé (légèrement décalé)
    if (p > 0.15) {
      var slash2P = Math.min(1, (p - 0.15) * 2);
      var len2 = slash2P * 60;
      ctx.strokeStyle = "rgba(244, 63, 94, " + (1 - p) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + len2, cy - len2 * 0.7);
      ctx.lineTo(cx - len2, cy + len2 * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Psyko / Ball'Ombre / Vibrobscur : Ondes de choc chromatiques et distorsions
  function dessinerPsyko(ctx, p, geo) {
    var cx = geo.cible.x;
    var cy = geo.cible.y;

    ctx.save();
    var nbOndes = 3;
    for (var o = 0; o < nbOndes; o++) {
      var op = (p + o * 0.25) % 1;
      var rayon = op * 80;
      var alpha = (1 - op) * 0.8;

      ctx.strokeStyle = o === 0 ? "rgba(192, 38, 211, " + alpha + ")"
                                : o === 1 ? "rgba(6, 182, 212, " + alpha + ")"
                                          : "rgba(147, 51, 234, " + alpha + ")";
      ctx.shadowColor = "#c026d3";
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Ovale déformé type onde psychique
      ctx.ellipse(cx, cy, rayon * 1.2, rayon * 0.7, Math.PI / 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── 6. Rendu procédural générique (Physique, Spécial, Statut) ──────────────

  // Attaque physique générique : Ruée en avant de l'attaquant + étoile d'impact percutante
  function dessinerPhysique(ctx, p, geo) {
    var sx = geo.source.x;
    var sy = geo.source.y;
    var cx = geo.cible.x;
    var cy = geo.cible.y;

    ctx.save();
    if (p < 0.45) {
      // Trait de vitesse de charge
      var dashP = p / 0.45;
      var px = sx + (cx - sx) * dashP * 0.7;
      var py = sy + (cy - sy) * dashP * 0.7;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(px, py);
      ctx.stroke();
    } else {
      // Étoile d'impact sur la cible
      var impactP = (p - 0.45) / 0.55;
      var rayon = impactP * 45;
      var alpha = 1 - impactP;
      var branches = 6;
      ctx.strokeStyle = "rgba(250, 204, 21, " + alpha + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (var i = 0; i < branches; i++) {
        var a = (i / branches) * Math.PI * 2;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * rayon, cy + Math.sin(a) * rayon);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Attaque spéciale générique : Projectile élémentaire balistique vers la cible
  function dessinerSpecial(ctx, p, geo) {
    var sx = geo.source.x;
    var sy = geo.source.y;
    var cx = geo.cible.x;
    var cy = geo.cible.y;

    ctx.save();
    if (p < 0.75) {
      var t = p / 0.75;
      var px = sx + (cx - sx) * t;
      var py = sy + (cy - sy) * t;

      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#93c5fd";
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();

      // Cœur lumineux
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Détonation à l'arrivée
      var expP = (p - 0.75) / 0.25;
      ctx.strokeStyle = "rgba(96, 165, 250, " + (1 - expP) + ")";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, expP * 40, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Statut générique : Ondes concentriques douces enveloppant la créature
  function dessinerStatut(ctx, p, geo) {
    var sx = geo.source.x;
    var sy = geo.source.y;

    ctx.save();
    var nbAnneaux = 3;
    for (var i = 0; i < nbAnneaux; i++) {
      var ap = (p + i * 0.3) % 1;
      var rayon = ap * 50;
      var alpha = (1 - ap) * 0.7;

      ctx.strokeStyle = "rgba(167, 139, 250, " + alpha + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, rayon, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── 7. Méthode principale d'animation d'attaque ───────────────────────────

  function jouerAttaque(canvas, attCle, coteAttaquant, cb) {
    var callback = (typeof cb === "function") ? cb : function () {};

    if (!canvas || typeof canvas.getContext !== "function") {
      callback();
      return;
    }
    var ctx = canvas.getContext("2d");
    if (!ctx) {
      callback();
      return;
    }

    var cleNorm = extraireCle(attCle);
    var sig = identifierSignature(cleNorm);
    var geo = obtenirPositions(canvas, coteAttaquant);

    // Détermination de la catégorie en cas de repli procédural
    var cat = "physique";
    if (typeof attCle === "object" && attCle) {
      if (attCle.categorie === "special" || attCle.categorie === "spécial") cat = "special";
      else if (attCle.categorie === "statut" || attCle.categorie === "status" || attCle.puissance === 0) cat = "statut";
    }

    var duree = 480; // ~480ms standard

    animer(
      duree,
      function (p) {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (sig === "elec") dessinerTonnerre(ctx, p, geo);
          else if (sig === "eau") dessinerSurf(ctx, p, geo);
          else if (sig === "sol") dessinerSeisme(ctx, p, geo);
          else if (sig === "feu") dessinerLanceFlammes(ctx, p, geo);
          else if (sig === "glace") dessinerLaserGlace(ctx, p, geo);
          else if (sig === "tranche") dessinerTranche(ctx, p, geo);
          else if (sig === "psy") dessinerPsyko(ctx, p, geo);
          else {
            // Repli procédural
            if (cat === "special") dessinerSpecial(ctx, p, geo);
            else if (cat === "statut") dessinerStatut(ctx, p, geo);
            else dessinerPhysique(ctx, p, geo);
          }
        } catch (e) {
          // Sécurité headless/mock
        }
      },
      function () {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } catch (e) {}
        callback();
      }
    );
  }

  // ── 8. Rendu des auras de statistiques (Buffs / Debuffs) ───────────────────

  function jouerStatAura(canvas, coteCible, delta, cb) {
    var callback = (typeof cb === "function") ? cb : function () {};

    if (!canvas || typeof canvas.getContext !== "function") {
      callback();
      return;
    }
    var ctx = canvas.getContext("2d");
    if (!ctx) {
      callback();
      return;
    }

    if (!delta || delta === 0) {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } catch (e) {}
      callback();
      return;
    }

    var w = canvas.width || 800;
    var h = canvas.height || 480;
    var estJoueur = (coteCible === "joueur" || coteCible === "player");
    var cibleX = estJoueur ? w * 0.25 : w * 0.75;
    var cibleY = estJoueur ? h * 0.70 : h * 0.32;

    var estHausse = delta > 0;
    var duree = 400;

    animer(
      duree,
      function (p) {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          var nbChevrons = 3;

          ctx.save();
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          if (estHausse) {
            // Hausse : Chevrons verts montant vers le ciel (▲▲▲)
            ctx.strokeStyle = "#22c55e";
            ctx.shadowColor = "#4ade80";
            ctx.shadowBlur = 10;

            for (var i = 0; i < nbChevrons; i++) {
              var dec = (i * 0.25);
              var cp = (p + dec) % 1;
              var cx = cibleX + (i - 1) * 24;
              var cy = cibleY - cp * 70;
              var taille = 12;

              ctx.beginPath();
              ctx.moveTo(cx - taille, cy + taille * 0.5);
              ctx.lineTo(cx, cy - taille * 0.5);
              ctx.lineTo(cx + taille, cy + taille * 0.5);
              ctx.stroke();
            }
          } else {
            // Baisse : Chevrons rouges descendant vers le bas (▼▼▼)
            ctx.strokeStyle = "#ef4444";
            ctx.shadowColor = "#f87171";
            ctx.shadowBlur = 10;

            for (var j = 0; j < nbChevrons; j++) {
              var decB = (j * 0.25);
              var cpB = (p + decB) % 1;
              var cxB = cibleX + (j - 1) * 24;
              var cyB = cibleY + cpB * 70 - 20;
              var tailleB = 12;

              ctx.beginPath();
              ctx.moveTo(cxB - tailleB, cyB - tailleB * 0.5);
              ctx.lineTo(cxB, cyB + tailleB * 0.5);
              ctx.lineTo(cxB + tailleB, cyB - tailleB * 0.5);
              ctx.stroke();
            }
          }
          ctx.restore();
        } catch (e) {
          // Sécurité headless/mock
        }
      },
      function () {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } catch (e) {}
        callback();
      }
    );
  }

  // ── 9. Export global ──────────────────────────────────────────────────────

  var PokeAnimShowdown = {
    monter: monter,
    jouerAttaque: jouerAttaque,
    jouerStatAura: jouerStatAura,
    estAttaqueSignature: estAttaqueSignature,
    SIGNATURES: SIGNATURES
  };

  W.PokeAnimShowdown = PokeAnimShowdown;

})(typeof window !== "undefined" ? window : globalThis);
