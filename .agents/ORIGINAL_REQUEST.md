# Original User Request

## 2026-08-25T04:35:02Z

Analyse et amélioration prioritaire de la codebase du projet *Road to Legends — Mode Pokémon* (JS vanilla, HTML5, CSS), en préservant scrupuleusement l'architecture modulaire et les contraintes de déterminisme du moteur de rejeu.

Working directory: c:\Users\illye\Documents\antigravity\rtl-pokemon
Integrity mode: development

## Requirements

### R1. Analyse & Audit de la Codebase
Analyser la structure du projet (68+ fichiers JS dans `js/poke/`, `README.md`, `NOTES-MOTEUR-COMBAT.md`, `NOTES-MONDE-VOYAGE.md`), et identifier les points prioritaires d'amélioration UI/UX, correction de bugs, et qualité du code.

### R2. Implémentation des Améliorations Prioritaires
Implémenter les améliorations identifiées tout en préservant le contrat de déterminisme du PRNG (`mulberry32`), la séparation stricte NOYAU/ECRANS, et le graphe de dépendances de `ordre.js`.

### R3. Vérification & Non-Régression
Vérifier l'absence d'appels `Math.random()` / `Date.now()` non autorisés dans le NOYAU et valider l'exécution propre sans erreur console sur `index.html`.

## Acceptance Criteria

### Audit & Architecture
- [ ] L'analyse du projet et les améliorations prioritaires sont clairement documentées et exécutées.
- [ ] La séparation entre NOYAU (pur sans DOM) et ECRANS est strictement respectée.

### Déterminisme & Qualité
- [ ] Aucun appel non déterministe (`Math.random()`, `Date.now()`, etc.) n'est introduit dans le NOYAU.
- [ ] L'ordre des fichiers dans `js/poke/ordre.js` demeure valide et cohérent.

### Exécution & Rendu
- [ ] Le jeu charge sans erreur console dans le navigateur (`index.html` ou serveur HTTP local).
- [ ] Les nouvelles fonctionnalités/corrections apportées sont validées et fonctionnelles.
