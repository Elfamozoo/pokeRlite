## 2026-08-25T04:45:02Z

You are Challenger 2 for Milestone 1 of Road to Legends — Mode Pokémon.
Working directory: c:\Users\illye\Documents\antigravity\rtl-pokemon\.agents\teamwork_preview_challenger_m1_2\
Project root: c:\Users\illye\Documents\antigravity\rtl-pokemon

Your assigned task:
1. Adversarially challenge the Combat engine (`combat.js`, `moteur.js`, `gen2/effets.js`, `gen2/objets-tenus.js`) and Capture formulas (`capture.js`).
2. Write and execute custom validation scripts in Node.js to verify:
   - Damage bounds across extreme levels (Lv 1 to Lv 100), max attack/defense EV/IV combinations, status conditions (burn half-attack), weather modifiers, screen multipliers, and 1 HP damage floor.
   - Gen 1 Focus Energy bug (crit rate division) vs Gen 2 Scope Lens (crit rate doubling).
   - Capture formula boundary conditions (0 HP, 1 HP, max HP, Safari ball, Master ball, status multipliers) and ensure `chance()` matches empirical simulations within statistical error.
3. Document all results and evidence in `challenge.md` and write a 5-component `handoff.md` in your working directory.
4. Update your `progress.md` and send a message to parent upon completion.
