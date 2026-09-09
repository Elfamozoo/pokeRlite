## 2026-08-25T04:40:04Z

You are Worker 1 for Milestone 1 & Priority Implementation of Road to Legends — Mode Pokémon.
Working directory: c:\Users\illye\Documents\antigravity\rtl-pokemon\.agents\teamwork_preview_worker_m1\
Project root: c:\Users\illye\Documents\antigravity\rtl-pokemon

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your assigned task:
1. Review the three Explorer audit reports:
   - c:\Users\illye\Documents\antigravity\rtl-pokemon\.agents\teamwork_preview_explorer_m1_1\analysis.md
   - c:\Users\illye\Documents\antigravity\rtl-pokemon\.agents\teamwork_preview_explorer_m1_2\analysis.md
   - c:\Users\illye\Documents\antigravity\rtl-pokemon\.agents\teamwork_preview_explorer_m1_3\analysis.md
2. Implement the verified priority fixes:
   a. Fix IIFE global binding in `js/poke/serments.js` (line ~661), `js/poke/chasses.js` (line ~262), and `js/poke/sceaux.js` (line ~205) by replacing `})(window);` with `})(typeof window !== "undefined" ? window : globalThis);`.
   b. In `js/poke/ordre.js`, move `js/poke/gen2/sons.js` and `js/poke/gen2/sons-attaques.js` from `GEN2` (which is inserted into NOYAU) into `GEN2_ECRANS` (which is inserted into ECRANS), preserving pure NOYAU separation for headless Node.js/server replay.
   c. In `manifest.json`, update `background_color` and `theme_color` to `#0d1420` (matching `index.html` and `css/poke.css`).
   d. In `js/poke/ui-combat.js`, ensure capture animation timeouts (`animerCapture`) are tracked and properly cleared if combat is terminated or unmounted (`terminer()`).
3. Build a comprehensive automated test suite `tests/run_all_tests.mjs` (using Node.js `node tests/run_all_tests.mjs`) that programmatically verifies:
   - Strict pure NOYAU execution in isolated Node.js environment without DOM/window.
   - PRNG determinism contract (`mulberry32`), seed hash reproducibility, and combat replay scoring parity across repeated runs.
   - Zero occurrences of unauthorized `Math.random()`, `Date.now()`, `new Date()`, `performance.now()` in all NOYAU files.
   - Zero DOM / browser leaks in NOYAU files.
   - `ordre.js` module loading and dependency order.
4. Execute `node tests/run_all_tests.mjs` and verify that 100% of tests pass.
5. Create a master `AUDIT_REPORT.md` at project root (`c:\Users\illye\Documents\antigravity\rtl-pokemon\AUDIT_REQUEST.md` / `AUDIT_REPORT.md`) synthesizing the complete codebase audit, verified fixes, architecture evaluation, and future roadmap.
6. Write your structured handoff report to `c:\Users\illye\Documents\antigravity\rtl-pokemon\.agents\teamwork_preview_worker_m1\handoff.md`. Update your `progress.md`.
7. Send a message to parent when complete.
