(function (W) {
  "use strict";
  // ═══════════════════════════════════════════════════════════════════════════
  //  LA PUCE SONORE DU GAME BOY, PORTÉE
  //
  //  Les sons de Rouge/Bleu ne sont pas des enregistrements : ce sont des
  //  programmes pour l'APU du Game Boy. `js/poke/sons.js` porte les programmes,
  //  ce fichier porte la puce. Quatre canaux, comme le matériel :
  //    · deux ondes CARRÉES à rapport cyclique variable (12,5 · 25 · 50 · 75 %)
  //    · une onde PROGRAMMABLE de 32 points sur 4 bits
  //    · un générateur de BRUIT à registre à décalage
  //  Chacun avec son enveloppe de volume, son balayage de fréquence, son
  //  vibrato. On rend le son échantillon par échantillon, exactement comme la
  //  puce le faisait, puis on le garde en mémoire.
  //
  //  🔴 ON REND HORS LIGNE, ON NE PLANIFIE PAS. Enchaîner des oscillateurs Web
  //     Audio avec des rendez-vous dans le temps donne des décalages dès que
  //     l'onglet rame — et un jingle de capture qui traîne n'est plus un jingle.
  //     Un tampon rendu une fois se rejoue à l'identique, toujours.
  //
  //  🔴 LE SON NE DÉMARRE JAMAIS AVANT UN GESTE. Les navigateurs refusent
  //     l'audio sans interaction, et un contexte créé trop tôt reste suspendu
  //     pour toute la partie sans qu'un seul message ne le dise.
  // ═══════════════════════════════════════════════════════════════════════════

  var IMAGE = 59.7275;          // images par seconde de la puce
  var ENVELOPPE = 64;           // pas d'enveloppe par seconde
  var BALAYAGE = 128;           // pas de balayage par seconde
  var RAPPORTS = [0.125, 0.25, 0.5, 0.75];
  var SUR = 2;                  // sur-échantillonnage : adoucit l'aliasing

  var D = W.POKE_SONS || null;
  var ctx = null;
  var cache = {};
  var reglages = { muet: false, volume: 0.55 };

  // ── Le contexte, ouvert au premier geste ──────────────────────────────────
  function contexte() {
    if (ctx) return ctx;
    var C = W.AudioContext || W.webkitAudioContext;
    if (!C) return null;
    try { ctx = new C(); } catch (e) { return null; }
    return ctx;
  }
  function reveiller() {
    var c = contexte();
    if (c && c.state === "suspended") c.resume();
  }

  // ── Lecture d'un programme : commandes → événements sonores ───────────────
  //  Une commande de note dure (longueur + 1) seizièmes, multipliés par la
  //  vitesse et par le tempo. Le moteur tronque le produit à huit bits et
  //  garde une partie fractionnaire d'un pas sur l'autre — on fait pareil,
  //  sinon les notes dérivent et un jingle finit une image trop tard.
  function duree(len, e) {
    var brut = ((len + 1) * e.vitesse) & 0xff;
    var t = e.frac + brut * e.tempo;
    e.frac = t & 0xff;
    return (t >> 8) & 0xff;
  }

  // La hauteur d'une note musicale : la valeur de la table, SIGNÉE, décalée de
  // (octave − 1) rangs. La fréquence vaut 131072 / |résultat| hertz.
  function hauteurNote(h, octave) {
    var v = D.hauteurs[h] >> (octave - 1);
    if (!v) return 0;
    return 2048 + v;                       // v est négatif : donne la période
  }

  function evenements(canal, opt) {
    var e = {
      octave: 4, vitesse: 1, tempo: opt.tempo, duty: 2, motif: null,
      vol: 15, fondu: 0, justesse: 0, vibrato: null, balayage: null,
      frac: 0, t: 0,
    };
    var out = [];
    for (var i = 0; i < canal.n.length; i++) {
      var c = canal.n[i], op = c[0];
      if (op === 7) { e.duty = c[1]; e.motif = null; continue; }
      if (op === 8) { e.motif = [c[1], c[2], c[3], c[4]]; continue; }
      if (op === 4) { e.vitesse = c[1]; e.vol = c[2]; e.fondu = c[3]; continue; }
      // 🔑 15 — L'ENVELOPPE SEULE. 1999 a coupé `note_type` en deux : la
      //    vitesse d'un côté, le volume et le fondu de l'autre. C'est la SEULE
      //    instruction que ce lecteur ait apprise pour la seconde génération,
      //    et elle ne touche pas à la vitesse — sans quoi les bruitages
      //    d'attaque de Cristal repartaient au tempo de la note précédente.
      //    ⚠️ Ce fichier vit dans les ÉCRANS, pas dans le noyau de rejeu : lui
      //       apprendre une instruction ne peut pas faire diverger un score.
      if (op === 15) { e.vol = c[1]; e.fondu = c[2]; continue; }
      if (op === 5) { e.octave = c[1]; continue; }
      if (op === 6) { e.tempo = c[1]; continue; }
      if (op === 10) { e.justesse = e.justesse ? 0 : 1; continue; }
      if (op === 9) { e.vibrato = [c[1], c[2], c[3]]; continue; }
      if (op === 13) { e.balayage = [c[1], c[2], c[3]]; continue; }
      if (op === 12 || op === 11 || op === 14) continue;

      var n = duree(c[1] === undefined ? 0 : (op === 3 ? c[2] : c[1]), e);
      if (op === 2) { e.t += n; continue; }        // silence

      var ev = {
        t: e.t, n: n, duty: e.duty, motif: e.motif,
        vibrato: e.vibrato, balayage: e.balayage,
      };
      // Le fondu est normalisé par le générateur : positif = le volume descend,
      // négatif = il monte, valeur absolue = la période de l'enveloppe.
      if (op === 0) {
        ev.type = "carre";
        ev.vol = c[2]; ev.per = c[3] < 0 ? -c[3] : c[3]; ev.sens = c[3] < 0 ? 1 : 0;
        ev.p = c[4];
      } else if (op === 1) {
        ev.type = "bruit";
        ev.vol = c[2]; ev.per = c[3] < 0 ? -c[3] : c[3]; ev.sens = c[3] < 0 ? 1 : 0;
        ev.nr43 = c[4];
      } else if (op === 3) {
        ev.type = canal.c === 8 ? "bruit" : "carre";
        ev.vol = e.vol; ev.per = e.fondu < 0 ? -e.fondu : e.fondu; ev.sens = e.fondu < 0 ? 1 : 0;
        ev.p = hauteurNote(c[1], e.octave) + e.justesse;
        ev.nr43 = 0x30;
      }
      if (ev.type) {
        // 🔴 Le décalage de période s'ajoute à la note, pas au son entier.
        if (opt.periode && ev.p !== undefined) ev.p = (ev.p + opt.periode) & 0x7ff;
        out.push(ev);
      }
      e.t += n;
      e.balayage = null;
    }
    return out;
  }

  // ── Synthèse ───────────────────────────────────────────────────────────────
  var DIVISEURS = [8, 16, 32, 48, 64, 80, 96, 112];

  function rendre(canaux, opt) {
    var c = contexte();
    if (!c) return null;
    var tous = [], fin = 0;
    for (var i = 0; i < canaux.length; i++) {
      //  🔴 UN CANAL PEUT ÉCHAPPER AU TEMPO DU CRI. Cristal verse la longueur du
      //     cri dans le registre de tempo de chaque canal SAUF le quatrième :
      //     « No tempo for channel 4 » — le bruit garde le tempo normal (256) et
      //     tient sa percussion pendant que les carrés s'accélèrent. En 1996 le
      //     tempo était au contraire GLOBAL (`wSfxTempo`) et frappait tout. La
      //     banque dit lequel des deux ; le lecteur n'en préfère aucun.
      var opt2 = opt;
      if (opt.sansTempo && canaux[i].c === opt.sansTempo && opt.tempo !== 256) {
        opt2 = { periode: opt.periode, tempo: 256, sansTempo: opt.sansTempo };
      }
      var ev = evenements(canaux[i], opt2);
      tous.push({ canal: canaux[i].c, ev: ev });
      for (var k = 0; k < ev.length; k++) fin = Math.max(fin, ev[k].t + ev[k].n);
    }
    if (!fin) return null;

    var se = c.sampleRate, seSur = se * SUR;
    var total = Math.ceil((fin / IMAGE) * se) + Math.round(se * 0.04);
    var acc = new Float32Array(total * SUR);

    for (var a = 0; a < tous.length; a++) {
      var lfsr = 0x7fff, phase = 0;
      var liste = tous[a].ev;
      for (var b = 0; b < liste.length; b++) {
        var v = liste[b];
        if (!v.n) continue;
        var d0 = Math.floor((v.t / IMAGE) * seSur);
        var len = Math.floor((v.n / IMAGE) * seSur);
        var vol = v.vol, compteEnv = 0, compteBal = 0;
        var periode = v.p;
        var pasEnv = seSur / ENVELOPPE, pasBal = seSur / BALAYAGE;
        var pasImage = seSur / IMAGE;
        var divBruit = DIVISEURS[v.nr43 !== undefined ? (v.nr43 & 7) : 0];
        var decal = v.nr43 !== undefined ? (v.nr43 >> 4) & 15 : 0;
        var court = v.nr43 !== undefined && (v.nr43 & 8);
        var hzBruit = 4194304 / divBruit / Math.pow(2, decal + 1);
        var pasBruit = hzBruit / seSur;
        var restBruit = 0;

        for (var s = 0; s < len; s++) {
          var idx = d0 + s;
          if (idx >= acc.length) break;

          // Enveloppe : le volume monte ou descend d'un cran par période.
          if (v.per) {
            compteEnv += 1;
            if (compteEnv >= pasEnv * v.per) {
              compteEnv = 0;
              vol += v.sens ? 1 : -1;
              if (vol < 0) vol = 0;
              if (vol > 15) vol = 15;
            }
          }
          if (vol <= 0) continue;

          var ech = 0;
          if (v.type === "carre") {
            // Balayage de fréquence : la période change par pas de 1/128 s.
            if (v.balayage && v.balayage[0]) {
              compteBal += 1;
              if (compteBal >= pasBal * v.balayage[0]) {
                compteBal = 0;
                var delta = (2048 - periode) >> v.balayage[1];
                periode += v.balayage[2] ? delta : -delta;
                if (periode >= 2047 || periode < 0) { periode = periode < 0 ? 0 : 2047; }
              }
            }
            var hz = 131072 / (2048 - periode);
            if (!isFinite(hz) || hz <= 0 || hz > seSur / 2) { continue; }
            phase += hz / seSur;
            phase -= Math.floor(phase);
            // Motif de rapport cyclique : il tourne d'un cran par image.
            var duty = v.duty;
            if (v.motif) duty = v.motif[Math.floor(s / pasImage) & 3];
            ech = phase < RAPPORTS[duty & 3] ? 1 : -1;
          } else {
            restBruit += pasBruit;
            while (restBruit >= 1) {
              restBruit -= 1;
              var bit = (lfsr ^ (lfsr >> 1)) & 1;
              lfsr = (lfsr >> 1) | (bit << 14);
              if (court) lfsr = (lfsr & ~0x40) | (bit << 6);
            }
            ech = (lfsr & 1) ? -1 : 1;
          }
          acc[idx] += (ech * vol) / 15;
        }
      }
    }

    // Retour au taux d'échantillonnage, avec moyenne : c'est le filtre qui
    // adoucit l'aliasing des carrés aigus sans les rendre sourds.
    var buf = c.createBuffer(1, total, se);
    var sortie = buf.getChannelData(0);
    var precedent = 0, filtre = 0, crete = 0;
    for (var j = 0; j < total; j++) {
      var somme = 0;
      for (var q = 0; q < SUR; q++) somme += acc[j * SUR + q] || 0;
      var x = somme / SUR / canaux.length;
      // Passe-haut d'un pôle : enlève la composante continue, comme le DAC.
      filtre = x - precedent + 0.996 * filtre;
      precedent = x;
      sortie[j] = filtre;
      if (filtre > crete) crete = filtre; else if (-filtre > crete) crete = -filtre;
    }
    // 🔴 ON NORMALISE SUR LA CRÊTE, ET C'EST DEUX CORRECTIONS EN UNE. Sans
    //    cela les cris touchaient 1,0 et s'écrêtaient — une saturation qu'on
    //    entend comme un grésillement sans savoir d'où il vient. Et surtout,
    //    un son à trois canaux sortait deux fois plus fort qu'un son à un
    //    canal : le cri couvrait le jingle. Une même crête pour tous, c'est un
    //    jeu dont le volume ne saute pas d'un écran à l'autre.
    if (crete > 0) {
      var k2 = 0.82 / crete;
      for (var z = 0; z < total; z++) sortie[z] *= k2;
    }
    return buf;
  }

  // ── L'API ──────────────────────────────────────────────────────────────────
  //  ⚠️ LA BANQUE VOYAGE EN PARAMÈTRE, et le cache la nomme : deux mondes
  //     peuvent porter le même nom de programme sans jouer le même son.
  function tampon(nom, periode, tempo, source) {
    var S = source || D;
    if (!S || !S.sfx[nom]) return null;
    var cle = nom + "|" + periode + "|" + tempo + "|" + (S === D ? "1" : "2");
    if (cache[cle] !== undefined) return cache[cle];
    var b = null;
    try {
      b = rendre(S.sfx[nom], { periode: periode, tempo: tempo, sansTempo: S.tempoSaufCanal });
    } catch (e) { b = null; }
    cache[cle] = b;
    return b;
  }

  var enCours = [];
  function lancer(buf, gain) {
    var c = contexte();
    if (!c || !buf) return null;
    reveiller();
    var src = c.createBufferSource();
    src.buffer = buf;
    var g = c.createGain();
    g.gain.value = reglages.muet ? 0 : reglages.volume * (gain === undefined ? 1 : gain);
    src.connect(g);
    g.connect(c.destination);
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 « QUELQUES BRUITAGES SE JOUENT EN DOUBLE » — testeur sur téléphone,
    //    11/08/2026. La mécanique, prouvée au banc : une source `start()`ée
    //    pendant que le contexte est SUSPENDU ne joue pas — elle attend, et
    //    part au prochain `resume()`. Or Safari suspend le contexte à la
    //    moindre inactivité : l'appui N est muet, et l'appui N+1 — dont le
    //    `pointerdown` réveille le contexte — joue SON son plus celui d'avant.
    //    Mesuré : 1 526 ms de retard sur une source mise en file.
    // ✅ Sous suspension, on ne met RIEN en file. On relance le contexte et le
    //    son ne part que si la reprise est immédiate (le premier geste d'une
    //    session, typiquement). Au-delà de 250 ms, il est abandonné : un
    //    bruitage est un accusé de réception du geste — deux gestes plus tard,
    //    il n'accuse plus rien, il ment.
    // ═══════════════════════════════════════════════════════════════════════
    if (c.state === "suspended") {
      var demande = (W.performance && W.performance.now()) || 0;
      c.resume().then(function () {
        var t = (W.performance && W.performance.now()) || 0;
        if (t - demande > 250) return;   // trop tard : le geste est passé
        src.start();
        enCours.push(src);
        src.onended = function () {
          var i = enCours.indexOf(src);
          if (i >= 0) enCours.splice(i, 1);
        };
      });
      return src;
    }
    src.start();
    enCours.push(src);
    src.onended = function () {
      var i = enCours.indexOf(src);
      if (i >= 0) enCours.splice(i, 1);
    };
    return src;
  }

  // ═══ L'OMBRE PHYSIQUE DE DEUX SONS (12/08) ═════════════════════════════════
  //  🔴 « On a encore trop l'impression d'être sur une version web. » Sur un
  //     téléphone, la seconde des secousses — la plus tendue du mode — ne se
  //     vivait que des yeux et des oreilles. La vibration n'est pas un canal
  //     de plus : c'est l'ombre PHYSIQUE des sons qui portent déjà la tension.
  //     La poser ICI, dans la porte unique du son, garantit qu'elle ne pourra
  //     jamais raconter autre chose que ce que l'oreille entend.
  //  ⚠️ AVANT le silence : téléphone en sourdine, la main sent ce que
  //     l'oreille ne dit plus — c'est le sens même du vibreur. iOS ignore
  //     `navigator.vibrate` sans erreur : le repli est le silence, pas un bug.
  //  ⚠️ LISTE FERMÉE. Vibrer chaque appui userait la pile ET le geste : une
  //     main qui bourdonne tout le temps ne sent plus rien au moment qui
  //     compte. Un nom s'ajoute ici avec sa raison, ou pas du tout.
  // ═══════════════════════════════════════════════════════════════════════════
  var TOUCHER = {
    TINK: [30],                          // chaque secousse de la Ball : un tac dans la main
    CAUGHT_MON: [40, 90, 40, 90, 160],   // la prise — la récompense du mode, en trois temps
    // La fanfare des trois moments de gloire (badge gagné, duel gagné, rang
    // monté) — le commentaire du badge dit déjà la règle : « un son qu'on
    // entend tout le temps ne récompense plus rien ». Même loi pour la main.
    // ⚠️ DENIED et les K.O. restent DEHORS : quinze refus par écran de jeu,
    //    une main qui bourdonne à chaque porte fermée ne sent plus un badge.
    POKEDEX_RATING: [70, 110, 70, 110, 70, 110, 250],
  };
  function toucher(nom) {
    var motif = TOUCHER[nom];
    if (motif && W.navigator && W.navigator.vibrate) {
      try { W.navigator.vibrate(motif); } catch (e) { /* politique du navigateur */ }
    }
  }

  // 🔴 UN SON QUI N'EXISTE PAS DOIT SE VOIR EN DÉVELOPPEMENT. En production il
  //    se tait — un message d'erreur n'a jamais amusé personne — mais le
  //    détecteur `poke-sons-lint` refuse tout nom cité qui n'existe pas.
  function jouer(nom, options) {
    toucher(nom);
    if (reglages.muet || !D) return null;
    var o = options || {};
    var b = tampon(nom, o.periode || 0, o.tempo === undefined ? 256 : o.tempo);
    return lancer(b, o.gain);
  }

  // Le cri d'une espèce : 25 programmes de base, et pour chacune un décalage de
  // période et un facteur de durée. Les 151 cris NAISSENT de ces trois nombres.
  //  🔴 LA BANQUE DES CRIS SUIT LE MONDE, pas le lecteur. Une table qui s'arrête
  //     à la 151ᵉ rendait cent créatures de Johto MUETTES — et un silence ne
  //     plante pas, il déçoit. Le registre nomme la banque ; ce fichier ne sait
  //     toujours pas qu'il existe une seconde génération.
  function banque() {
    return (W.PokeRegles && W.PokeRegles.sons && W.PokeRegles.sons()) || D;
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 LE TEMPO D'UN CRI NE SE LIT PAS DE LA MÊME FAÇON DANS LES DEUX BANQUES,
  //    et cette ligne-là était écrite en dur. En 1996, le troisième nombre d'un
  //    cri est un ÉCART autour du tempo normal : on joue `écart + 128`. En 1999,
  //    ce nombre EST le tempo — « Tempo is effectively length », dit l'engin de
  //    Cristal, qui le verse tel quel dans le registre de tempo du canal.
  //    Appliquée à Johto, la règle de 1996 ajoutait une demi-mesure à chaque
  //    cri : 2,02 s de médiane contre 0,78 s à Kanto. Rien ne plantait, rien
  //    n'était muet — les cris étaient simplement TRAÎNANTS, et seule une
  //    oreille pouvait le dire. La banque porte donc sa convention (`tempoBase`)
  //    et le lecteur la lit, au lieu de croire que toutes les cartouches
  //    comptent comme la première.
  // ═══════════════════════════════════════════════════════════════════════════
  function tempoDuCri(c, b) {
    var base = b && typeof b.tempoBase === "number" ? b.tempoBase : 0x80;
    return (c[2] + base) & 0xffff;
  }
  function cri(numero, options) {
    if (reglages.muet) return null;
    var b = banque();
    if (!b || !b.cris) return null;
    var c = b.cris[numero];
    if (!c) return null;
    var o = options || {};
    return lancer(tampon(c[0], c[1], tempoDuCri(c, b), b), o.gain);
  }

  // Le son d'une attaque.
  // 🔴 DIVERGENCE ASSUMÉE, ET LA SEULE DE CE FICHIER. Dans le ROM, la garde
  //    `Audio1_IsCry` empêche les décalages de s'appliquer à autre chose qu'un
  //    cri : les 166 lignes de `data/moves/sfx.asm` portent une intention —
  //    Poing Feu plus aigu que Poing Éclair, Ultimapoing plus bref — que le
  //    moteur ne lit jamais. Sans elles, une trentaine de sons se partagent
  //    166 attaques et le combat sonne pauvre. Les lire n'ôte aucune stratégie
  //    à personne : on prend la table du concepteur contre le bogue du moteur.
  //  🔴 LA BANQUE DES BRUITAGES SUIT LE MONDE, comme celle des cris. Elle ne
  //     le suivait pas : les 86 attaques propres à 1999 n'existent dans aucune
  //     table de 1996, et sortaient donc sans un son. Le registre nomme la
  //     banque ; ce fichier ne sait toujours pas qu'il existe une seconde
  //     génération.
  function banqueAttaques() {
    return (W.PokeRegles && W.PokeRegles.sonsAttaques && W.PokeRegles.sonsAttaques()) || D;
  }
  function attaque(id, options) {
    if (reglages.muet) return null;
    var b = banqueAttaques();
    if (!b || !b.attaques) return null;
    var a = b.attaques[id];
    if (!a) return null;
    var o = options || {};
    //  ⚠️ MÊME CONVENTION DE TEMPO QUE LES CRIS, et pour la même raison : en
    //     1996 le troisième nombre est un ÉCART autour de 128, en 1999 il EST
    //     le tempo. La banque le dit, le lecteur le lit — voir `tempoDuCri`.
    return lancer(tampon(a[0], a[1], tempoDuCri(a, b), b), o.gain);
  }

  function couper() {
    for (var i = enCours.length - 1; i >= 0; i--) {
      try { enCours[i].stop(); } catch (e) { /* déjà fini */ }
    }
    enCours.length = 0;
  }

  function muet(v) {
    if (v === undefined) return reglages.muet;
    reglages.muet = !!v;
    if (reglages.muet) couper();
    try { W.localStorage.setItem("poke_son", reglages.muet ? "0" : "1"); } catch (e) { /* privé */ }
    return reglages.muet;
  }
  try { reglages.muet = W.localStorage.getItem("poke_son") === "0"; } catch (e) { /* privé */ }

  function volume(v) {
    if (v === undefined) return reglages.volume;
    reglages.volume = Math.max(0, Math.min(1, v));
    try { W.localStorage.setItem("poke_volume", String(reglages.volume)); } catch (e) { /* privé */ }
    return reglages.volume;
  }
  try {
    var vs = parseFloat(W.localStorage.getItem("poke_volume"));
    if (vs >= 0 && vs <= 1) reglages.volume = vs;
  } catch (e) { /* privé */ }

  // Le premier geste ouvre le son. Un seul, puis on se retire.
  if (W.document) {
    var ouvrir = function () {
      reveiller();
      W.document.removeEventListener("pointerdown", ouvrir);
      W.document.removeEventListener("keydown", ouvrir);
    };
    W.document.addEventListener("pointerdown", ouvrir);
    W.document.addEventListener("keydown", ouvrir);
  }

  W.PokeSon = {
    jouer: jouer,
    cri: cri,
    attaque: attaque,
    couper: couper,
    muet: muet,
    volume: volume,
    existe: function (n) { return !!(D && D.sfx[n]); },
    noms: function () { return D ? Object.keys(D.sfx) : []; },
    // Les tampons rendus, pour l'écran d'essai et pour la vérification.
    // 🔴 UN SON NE SE LIVRE PAS SANS ÊTRE ÉCOUTÉ, et on ne peut écouter que ce
    //    qu'on peut sortir. Ces trois portes servent à ça, et elles rendent le
    //    MÊME tampon que le jeu joue — pas une seconde synthèse qui divergerait.
    tampon: function (n, o) { o = o || {}; return tampon(n, o.periode || 0, o.tempo === undefined ? 256 : o.tempo); },
    //  ⚠️ LA PORTE DE MESURE LIT LA MÊME BANQUE QUE LE JEU. Elle lisait `D` en
    //     direct : elle rendait donc « silence » sur les cent espèces de Johto
    //     alors que le jeu, lui, les jouait — un instrument qui contredit le
    //     produit qu'il mesure ne sert qu'à faire douter du produit.
    tamponCri: function (n) {
      var b = banque();
      var c = b && b.cris[n];
      return c ? tampon(c[0], c[1], tempoDuCri(c, b), b) : null;
    },
    tamponAttaque: function (i) { var a = D && D.attaques[i]; return a ? tampon(a[0], a[1], (a[2] + 0x80) & 0xffff) : null; },
  };
})(typeof window !== "undefined" ? window : globalThis);
