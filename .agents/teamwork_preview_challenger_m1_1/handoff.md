# Handoff Report — Milestone 1 Adversarial Stress & Determinism Review

## 1. Observation

### Observation 1: Systematic Victory Run Desync (45 pts Mismatch)
In `js/poke/partie.js:790` (`acteSuivant`):
```javascript
  function acteSuivant(p) {
    pensionReprise(p);
    p.acte++;
    p.rangee = 0;
    p.carteActe = null;
    if (p.acte > (W.PokeActes ? W.PokeActes.nombre() : 9)) p.fini = "vitrine";
    return p.acte;
  }
```
When a player finishes Act 9 (beating the Pokémon League), `p.acte` increments from 9 to 10.
In `js/poke/partie.js:1182` (`scoreDeBilan`):
```javascript
s += ((b.acte || 1) - 1) * POIDS.acte;
```
For `p.acte === 10`, client calculates `(10 - 1) * 45 = 405` points.
In `js/poke/rejeu.js:186` (`normaliser`):
```javascript
out.acte = borne(b.acte, 1, LIMITES.acte);
```
Where `LIMITES.acte = 9` (`rejeu.js:62`).
For `b.acte === 10`, server normalizes `out.acte = 9`, calculating `(9 - 1) * 45 = 360` points.
Verbatim command output from `node tests/stress_prng_replay.mjs` (Test 4.1):
```
scoreClient: 1165
bilanClient.score: 1165
replayResult.score: 1120
Difference: 45
```

### Observation 2: Cross-Ruleset Cache Leak in `rejeu.js` (`_acteLeg`)
In `js/poke/rejeu.js:159-177`:
```javascript
  function acteDuLegendaire() {
    var A = W.PokeActes;
    if (_acteLeg) return _acteLeg;
    if (!A || !A.acteDe || !A.nombre) return null;
    var m = {};
    for (var n = 1; n <= A.nombre(); n++) {
      var a = A.acteDe(n);
      if (!a) continue;
      var l = (a.legendaires || []).slice(), i;
      if (a.epilogue && a.epilogue.legendaires) l = l.concat(a.epilogue.legendaires);
      for (i = 0; i < l.length; i++) {
        var e = l[i].legendaire;
        if (m[e] == null || n < m[e]) m[e] = n;
      }
    }
    _acteLeg = m;
    return m;
  }
  var _acteLeg = null;
```
When `_acteLeg` is populated under `gen1`, it caches `{ 144: 7, 145: 8, 146: 9, 150: 9 }`. When `gen2` is evaluated subsequently, `_acteLeg` is NOT refreshed. Lugia (249) in Act 1 is not in `_acteLeg`, so `quandLeg[249]` is `undefined` and the normalization check (`rejeu.js:250`) passes without pruning.

### Observation 3: PRNG & Combinatorial Unranking Determinism Verification
Running `node tests/stress_prng_replay.mjs`:
- 100,000 continuous `mulberry32` draws: mean 0.5002, Chi-square = 7.84, 0 NaNs.
- 10,000 seed permutations (1,000,000 draws total): 100% bit-identical stream matching across independent instances.
- 200 procedural seeds (1,800 acts generated): 100% deep equality between repeated generation runs, 20,412 nodes structurally validated without dead ends or NaNs.
- 1,000 concurrent asynchronous `replayDaily` requests: resolved cleanly with zero race conditions.

---

## 2. Logic Chain

1. **Premise 1 (Obs 1)**: In `partie.js:790`, completing the Pokémon League sets `p.acte = 10`.
2. **Premise 2 (Obs 1)**: `scoreDeBilan` awards `(acte - 1) * 45` points. At `acte = 10`, it awards 405 points. The client displays and sends this score to `/api/daily` in `classement.js:231`.
3. **Premise 3 (Obs 1)**: The server runs `replayDaily`, which calls `normaliser`. `normaliser` bounds `acte` to `LIMITES.acte = 9`.
4. **Premise 4 (Obs 1)**: `scoreDeBilan` on server calculates with `acte = 9`, awarding only 360 points (a 45-point discrepancy).
5. **Deduction 1**: Because the server checks `client_score === replayDaily_score`, every player who beats the game will trigger a `score_mismatch` and be rejected from the Daily Challenge leaderboard.
6. **Premise 5 (Obs 2)**: `_acteLeg` in `rejeu.js` is stored in a file-scoped variable without invalidation hooks when `PokeRegles.courante()` changes.
7. **Deduction 2**: In multi-region Node.js servers, Gen 2 submissions processed after Gen 1 submissions will retain stale Gen 1 legendary mappings, bypassing anti-cheat act checks for Gen 2 legendaries.

---

## 3. Caveats

- **No client UI modifications performed**: As an empirical challenger / review agent, no production code in `js/` was modified. Both bugs are reported with reproduction proofs in `tests/stress_prng_replay.mjs`.
- **Live server environment**: We verified the headless NOYAU logic used by Node.js server engines. Database persistence and network latency layers in `/api/daily` are outside headless unit scope.

---

## 4. Conclusion

The core algorithmic foundations (`mulberry32` in `js/poke/rng.js`, `PokeChoix` combinatorial unranking, and procedural generation in `js/poke/carte-actes.js`) are deterministic, resilient, and mathematically sound across extreme stress parameters.

However, two critical bugs require remediation by the implementer / reviewer:
1. **Critical Bug**: Fix Act 10 score mismatch on victory runs by aligning `partie.js:resumePourScore` (`Math.min(9, p.acte)`) or `rejeu.js:normaliser` / `LIMITES.acte`.
2. **Medium Bug**: Invalidate or key `_acteLeg` cache by ruleset in `js/poke/rejeu.js`.

---

## 5. Verification Method

### Test Commands
Execute both test suites from project root in terminal:
```powershell
node tests/stress_prng_replay.mjs
node tests/run_all_tests.mjs
```

### Invalidation Conditions
- If `tests/stress_prng_replay.mjs` fails any test, the determinism contract is invalidated.
- If `scoreDifference` in Test 4.1 does not evaluate to 0 after implementer's fix, the victory desync bug remains unaddressed.
