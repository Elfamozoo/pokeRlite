// tests/test_gen3_usine_items.mjs
// Test unitaire et d'intégration : Déblocage du draft Usine & Nouveaux Objets Tenus

import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const window = {
  POKE_ORDRE_GEN3: [],
  POKE_ORDRE_GEN3_ECRANS: [],
  document: {
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {} }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  }
};
globalThis.window = window;
window.window = window;

// Charger l'ordre
vm.runInThisContext(fs.readFileSync("js/poke/ordre.js", "utf8"));

// Charger l'ensemble des modules dans l'ordre canonique
const allFiles = [...window.POKE_ORDRE_NOYAU, ...window.POKE_ORDRE_ECRANS];
for (const f of allFiles) {
  try {
    vm.runInThisContext(fs.readFileSync(f, "utf8"));
  } catch (e) {}
}

let testsReussis = 0;

// Test 1 : Instanciation d'un Pokémon Hoenn (#303 Mysdibule) depuis les règles Gen 1
{
  if (window.PokeRegles && typeof window.PokeRegles.poser === "function") {
    window.PokeRegles.poser("gen1");
  }
  assert.equal(window.PokeRegles.courant(), "gen1");

  const mon = window.PokeMoteur.creer(303, 50, { brut: () => 0.5, entier: () => 10 });
  assert.ok(mon);
  assert.equal(mon.n, 303);
  assert.ok(mon.stats && mon.stats.pv > 0);
  console.log("✓ Test 1 passé : PokeMoteur.creer gère une espèce Gen 3 sous règles Gen 1");
  testsReussis++;
}

// Test 2 : Création de session Usine depuis règles Gen 1
{
  window.PokeRegles.poser("gen1");
  const session = window.PokeUsine.creerSession();
  assert.ok(session);
  assert.equal(session.prets.length, 6);
  console.log("✓ Test 2 passé : PokeUsine.creerSession génère 6 prêts sans erreur");
  testsReussis++;
}

// Test 3 : Fiches de Pokémon de prêt dans ui-usine
{
  window.PokeRegles.poser("gen3");
  const session = window.PokeUsine.creerSession();
  const htmlDraft = window.PokeUIUsine.ouvrirDraft(session, {});
  assert.ok(htmlDraft.includes("pk-usine-draft"));
  assert.ok(!htmlDraft.includes("Pokémon #undefined"));
  assert.ok(!htmlDraft.includes("0.png"));
  console.log("✓ Test 3 passé : Cartes de draft rendues proprement");
  testsReussis++;
}

// Test 4 : Effets de combat des nouveaux objets tenus
{
  window.PokeRegles.poser("gen3");
  const combat = window.PokeCombat;
  const dummyH = { entier: () => 15, brut: () => 0.5 };

  // 4a : Baie Sitrus (+30 PV à <= 50% PV)
  {
    const p1 = window.PokeMoteur.creer(303, 50, dummyH, { objet: "SITRUS_BERRY" });
    p1.pv = Math.floor(p1.stats.pv * 0.4);
    const pvInit = p1.pv;
    const ev = [];
    combat.objetFinDeTour(p1, ev, "joueur", { volatils: {}, paliers: {} });
    assert.equal(p1.pv, pvInit + 30);
    assert.equal(p1.objet, null);
    console.log("✓ Test 4a passé : Baie Sitrus soigne 30 PV");
    testsReussis++;
  }

  // 4b : Baie Litchii (+1 Attaque à <= 25% PV)
  {
    const p1 = window.PokeMoteur.creer(303, 50, dummyH, { objet: "LIECHI_BERRY" });
    p1.pv = Math.floor(p1.stats.pv * 0.2);
    const cote = { volatils: {}, paliers: { atk: 0, def: 0, vit: 0, spe: 0, sat: 0, sdf: 0 } };
    const ev = [];
    combat.objetFinDeTour(p1, ev, "joueur", cote);
    assert.equal(cote.paliers.atk, 1);
    assert.equal(p1.objet, null);
    console.log("✓ Test 4b passé : Baie Litchii booste Atk");
    testsReussis++;
  }

  // 4c : Bandeau (Focus Band) survie coup fatal
  {
    const def = window.PokeMoteur.creer(303, 50, dummyH, { objet: "FOCUS_BAND" });
    def.pv = 50;
    const ev = [];
    combat.encaisser({ volatils: {} }, def, 100, ev, "adverse", null, { entier: () => 10 });
    assert.equal(def.pv, 1);
    console.log("✓ Test 4c passé : Bandeau survit à 1 PV");
    testsReussis++;
  }

  // 4d : Grelot Coque (Shell Bell) soin 1/8 des dégâts
  {
    const att = window.PokeMoteur.creer(254, 50, dummyH, { objet: "SHELL_BELL" });
    const def = window.PokeMoteur.creer(303, 50, dummyH);
    att.pv = 50;
    const ev = [];
    combat.encaisser({ volatils: {} }, def, 80, ev, "adverse", { att: att, coteAtt: "joueur" });
    assert.equal(att.pv, 60);
    console.log("✓ Test 4d passé : Grelot Coque soigne 1/8 dégâts");
    testsReussis++;
  }
}

// Test 5 : Boutique PCo et catalogue complet
{
  window.PokeRegles.poser("gen3");
  const htmlBoutique = window.PokeUIUsine.ouvrirBoutiquePCo({});
  const req = ["LEFTOVERS", "CHOICE_BAND", "SCOPE_LENS", "QUICK_CLAW", "FOCUS_BAND", "SHELL_BELL", "SITRUS_BERRY", "LIECHI_BERRY", "MAGNET"];
  for (const r of req) {
    assert.ok(htmlBoutique.includes('data-cle="' + r + '"'), "Boutique doit contenir " + r);
  }
  console.log("✓ Test 5 passé : Boutique PCo complète");
  testsReussis++;
}

console.log(`\nTOUS LES ${testsReussis} TESTS SONT VERTS !\n`);
