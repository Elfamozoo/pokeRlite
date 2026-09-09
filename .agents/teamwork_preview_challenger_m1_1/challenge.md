# Challenge Report — Milestone 1 Stress & Adversarial Review

## Challenge Summary

**Overall risk assessment**: **HIGH**

Empirical testing through custom adversarial harnesses (100,000 continuous PRNG draws, 1,000,000 draws across 10,000 seed permutations, 200 procedural world map generation runs over 1,800 acts, and 1,000 concurrent replay validation requests) verified that the low-level `mulberry32` PRNG determinism contract and combinatorial unranking (`PokeChoix`) are mathematically solid and bit-identical.

However, **two critical vulnerabilities** were empirically reproduced in the Daily Challenge verification architecture:
1. **Critical Desync on Victory Runs (`score_mismatch` 45-point divergence)**: When a player beats the Pokémon League (Act 9), `partie.js` advances `p.acte` to 10 (vitrine). The client computes a score awarding `(10 - 1) * 45 = 405` act progression points. When submitted to the server, `rejeu.js` normalizer caps `acte` to `LIMITES.acte` (9), awarding only `(9 - 1) * 45 = 360` act progression points. This creates a systematic 45-point divergence (`1165 vs 1120`), causing the server to reject **100% of all winning Daily Challenge submissions**.
2. **State Cache Staleness in `rejeu.js` (`_acteLeg` across rulesets)**: The `_acteLeg` cache in `rejeu.js` is a static file-scoped variable that does not invalidate when switching rulesets (e.g. Kanto `gen1` to Johto `gen2`). If initialized under `gen1`, subsequent `gen2` submissions will fail to bound/prune Johto legendary anomalies (e.g., Lugia in Act 1).

---

## Challenges

### [Critical] Challenge 1: Game-Winning Daily Challenge Submissions Trigger Systematic `score_mismatch` (45 pts Desync)

- **Assumption challenged**: The client game state `score(partie)` and server `replayDaily(date, journal)` evaluate to the exact same integer for all valid completed runs.
- **Attack scenario**: A player completes a legitimate Daily Challenge run, defeating all 8 Gym Leaders and the Pokémon League in Act 9. In `partie.js:790` (`acteSuivant`), `p.acte` increments from 9 to 10 and sets `p.fini = "vitrine"`.
  - Client calls `PokePartie.bilan(p)` -> `score(p)` -> `scoreDeBilan(resumePourScore(p))`. In `scoreDeBilan` (`partie.js:1182`), act points are calculated as `((b.acte || 1) - 1) * POIDS.acte` = `(10 - 1) * 45 = 405`.
  - Client sends `{ score: 1165, journal: [{ acte: 10, badges: 8, ligue: true, ... }] }` via `/api/daily` (`classement.js:231`).
  - Server invokes `replayDaily(date, body.journal)`. Inside `rejeu.js:186`, `normaliser` executes `out.acte = borne(b.acte, 1, LIMITES.acte)` where `LIMITES.acte = 9`. `out.acte` becomes 9.
  - Server invokes `scoreDeBilan(resume)` with `resume.acte = 9`, calculating `(9 - 1) * 45 = 360`.
  - Server evaluates `1165 !== 1120` and rejects the run with `score_mismatch`.
- **Blast radius**: 100% of honest players who complete the Daily Challenge (beat the game) have their scores rejected and lose their daily attempt.
- **Mitigation**: Align act bounding between `partie.js` and `rejeu.js`. Either:
  1. In `partie.js:resumePourScore`: clamp `acte` to `Math.min(9, p.acte)` so client calculates with act 9 max (`(9 - 1) * 45 = 360`), or
  2. In `rejeu.js:LIMITES`: allow `LIMITES.acte = 10` for finished runs, or update `normaliser` to handle completed runs (`b.fini === "vitrine"` or `b.ligue`).

---

### [Medium] Challenge 2: Cross-Ruleset Cache Staleness in `rejeu.js` (`_acteLeg`)

- **Assumption challenged**: Replay normalization is stateless and independent across multi-region / multi-ruleset submissions.
- **Attack scenario**: On a server serving both Gen 1 (Kanto) and Gen 2 (Johto) requests, the first request evaluates `acteDuLegendaire()` under `gen1`. `_acteLeg` caches `{ 144: 7, 145: 8, 146: 9, 150: 9 }`.
  - When a subsequent Gen 2 request is processed, `_acteLeg` is not recomputed.
  - Johto legendaries (Raikou 243, Entei 244, Suicune 245, Lugia 249, Ho-Oh 250, Celebi 251) are missing from `_acteLeg`.
  - The check `if (quandLeg && quandLeg[n] != null && quandLeg[n] > out.acte) continue;` skips pruning because `quandLeg[249] == null`.
  - As a result, a forged Johto submission claiming Lugia in Act 1 is erroneously accepted.
- **Blast radius**: Anti-cheat legendary act pruning fails for Gen 2 on shared Node.js instances that previously processed Gen 1 requests.
- **Mitigation**: Key `_acteLeg` cache by current ruleset (e.g. `_acteLeg[reglesKey]`) or invalidate `_acteLeg` whenever `PokeRegles.courante()` changes.

---

## Stress Test Results

Executed via custom test runner `tests/stress_prng_replay.mjs`:

| Stress Test Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| **1.1: 100k PRNG Draws** | Uniform distribution [0, 1), mean ~0.5, Chi-square < 35, 0 NaNs | Mean = 0.5002, Chi-square = 7.84, min=0.00001, max=0.99999 | **PASS** |
| **1.2: 10,000 Seeds (1M draws total)** | 2 independent PRNG instances with identical seeds produce 100% bit-identical stream | 10,000/10,000 seed pairs matched with 0 bit divergences | **PASS** |
| **1.3: Boundary Seeds (0, -1, 2^32, float, string, unicode, 10k chars)** | No NaNs, deterministic output across runs | Handled all boundary seed types identically without exception | **PASS** |
| **1.4: Draw Accounting Invariants** | Exact draw counts across `entier`, `entre`, `chance`, `pondere`, `dans`, `melange` | `melange(N)` exact N-1 draws; `pondere`/`entier` exact 1 draw | **PASS** |
| **1.5: Substream Isolation (`derive`)** | Derived generators advance independently without advancing parent state | Parent `tirages` remained 0; distinct labels produced uncorrelated streams | **PASS** |
| **2.1: Combinatorial Unranking Bijection** | `PokeChoix.deRang` produces complete set of distinct combinations without collision | Exhaustive C(4,2), C(6,3), C(10,3), C(12,4), C(16,3) verified 100% unique | **PASS** |
| **2.2: Large Pool Unranking (N=151, K=3)** | 10,000 random ranks across 562,475 combinations produce sorted, valid subsets | 10,000 sampled subsets strictly unique and lexicographically ordered | **PASS** |
| **2.3: PokeChoix Boundary Cases** | Safe handling of empty pool, k >= n, rank wrapping | Empty pool returns `[]`; k >= n returns pool copy; rank modulo wraps cleanly | **PASS** |
| **3.1: 200 Procedural Seeds (1,800 Acts)** | Complete map generation is 100% bit-identical and reproducible across runs | 200/200 seeds matched with deep equality on all 1,800 acts | **PASS** |
| **3.2: Procedural Map Invariants (20k+ nodes)** | Valid row counts (3-9), valid boss terminal node, monotonic level ramp, 0 NaNs | 20,412 nodes validated: all levels in [3, 100], 0 NaNs, single terminal boss | **PASS** |
| **3.3: Gen 1 vs Gen 2 Map Isolation** | Headbutt tree nodes only in Gen 2; Kanto vs Johto encounter pools strictly isolated | 0 tree nodes generated in Gen 1; Gen 2 generated valid tree & Johto encounters | **PASS** |
| **4.1: Victory Act 10 Score Parity** | `score(partie)` matches `replayDaily` on completed/winning runs | **Empirically reproduced 45-point mismatch (1165 vs 1120)** | **CONFIRMED BUG** |
| **4.2: `rejeu.js` `_acteLeg` Cache Staleness** | Johto legendaries bounded in Act 1 after Gen 1 execution | **Empirically reproduced: Lugia in Act 1 accepted due to stale Gen 1 cache** | **CONFIRMED BUG** |
| **4.3: Mid-Game Playthroughs (Acts 1-9)** | Exact score parity between client and server for realistic mid-game runs | 100/100 legitimate mid-game runs matched server score with 0 divergence | **PASS** |
| **4.4: 1,000 Concurrent Async Replay Validations** | Zero state contamination or race conditions across concurrent asynchronous calls | 1,000/1,000 requests resolved cleanly without concurrency defects | **PASS** |
| **4.5: Adversarial Replay Fuzzing (500 payloads)** | Malformed / negative / hacked payloads normalized cleanly without throwing | 500/500 fuzz payloads successfully bounded into legal game constraints | **PASS** |

---

## Unchallenged Areas

- **AudioContext & Sound Engine Hardware Playback**: Out of scope for headless Node.js PRNG & replay determinism validation.
- **Visual CSS / Canvas rendering pipeline**: Checked via static analysis and mock DOM; actual GPU pixel rendering out of scope.
