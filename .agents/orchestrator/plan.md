# Plan: Road to Legends — Mode Pokémon

## Overview
Orchestrated multi-milestone execution plan for comprehensive audit, priority improvements (UI/UX, bug fixes, code quality), and deterministic testing.

## Iteration Configuration
- Explorers per iteration: 3
- Reviewers per iteration: 2
- Challengers per iteration: 2
- Forensic Auditor per iteration: 1
- Succession threshold: 16 spawns

## Milestones & Execution Stages

### Milestone 1: Comprehensive Codebase Audit & Improvement Roadmap
- **Scope**: Audit all 68+ files in `js/poke/`, documentation (`README.md`, `NOTES-MOTEUR-COMBAT.md`, `NOTES-MONDE-VOYAGE.md`, `docs/`), determinism integrity, UI/UX audit, identifying concrete bug fixes and enhancements.
- **Dispatch**:
  - `explorer_1_m1`: Core & Determinism Audit (NOYAU, RNG, replay consistency, load order).
  - `explorer_2_m1`: Game Systems & Mechanics Audit (Combat, Voyage, Capture, Meta, Gen2).
  - `explorer_3_m1`: UI/UX & Frontend Audit (DOM rendering, UI events, CSS, tooltips, Audio, PWA).
- **Consolidation**: Aggregate findings into structured improvement roadmap.
- **Verification**: Worker + Reviewers + Challengers + Forensic Auditor.

### Milestone 2: Core Bug Fixes & Determinism Hardening
- **Scope**: Implement high-priority bug fixes in NOYAU logic, ensure absolute zero non-deterministic calls, verify seed reproduction.
- **Dispatch**: Explorer investigation -> Worker implementation -> Reviewers -> Challengers -> Forensic Auditor.

### Milestone 3: UI/UX & Quality-of-Life Enhancements
- **Scope**: Implement UI/UX fixes, responsive display polish, tooltip clarifications, battle animation safeguards, and console error immunity.
- **Dispatch**: Explorer investigation -> Worker implementation -> Reviewers -> Challengers -> Forensic Auditor.

### Milestone 4: E2E Verification & Non-Regression Suite
- **Scope**: Full test execution across Tier 1 (Features), Tier 2 (Boundaries), Tier 3 (Pairwise), Tier 4 (Real-world scenarios), Tier 5 (White-box adversarial).
- **Verification**: Validate zero console errors on `index.html` and strict deterministic replay.
- **Final Sign-off**: Forensic Auditor binary veto check + Final Handoff to Sentinel.
