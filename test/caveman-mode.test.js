import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  compareHandoffLengths,
  createInternalHandoff,
  isCavemanModeEnabled
} from "../src/caveman-mode.js";
import { createBeadsWorkItems } from "../src/beads-task-graph.js";

const HANDOFF_OPTIONS = {
  type: "subtask",
  title: "Shorten Internal Handoff Text",
  capability: "caveman-mode",
  requirement: "Configurable Internal Handoff Compression",
  scenario: "Generate Shorter Handoff When Caveman Mode Is Enabled",
  priority: "P1",
  spec: "openspec/specs/caveman-mode/spec.md",
  evidence: ".shipwright/evidence/caveman-mode.json"
};

test("Default To Normal Internal Handoff Text", () => {
  const handoff = createInternalHandoff(HANDOFF_OPTIONS);

  assert.match(handoff, /Internal handoff for subtask/);
  assert.match(handoff, /Use the OpenSpec/);
  assert.match(handoff, /Do not shorten specs, evidence files, documentation, or final reviewer reports/);
});

test("Generate Shorter Handoff When Caveman Mode Is Enabled", () => {
  const comparison = compareHandoffLengths(HANDOFF_OPTIONS);

  assert.equal(comparison.caveman.includes("Internal handoff for subtask"), false);
  assert.equal(comparison.caveman.includes("do: Generate Shorter Handoff"), true);
  assert.equal(comparison.cavemanLength < comparison.normalLength, true);
  assert.equal(comparison.estimatedReductionPercent >= 40, true);
});

test("Resolve Supported Caveman Mode Config Values", () => {
  assert.equal(isCavemanModeEnabled(true), true);
  assert.equal(isCavemanModeEnabled("on"), true);
  assert.equal(isCavemanModeEnabled("true"), true);
  assert.equal(isCavemanModeEnabled({ enabled: true }), true);
  assert.equal(isCavemanModeEnabled(false), false);
  assert.equal(isCavemanModeEnabled("off"), false);
  assert.equal(isCavemanModeEnabled({ enabled: false }), false);
});

test("Only Internal Task Handoff Text Changes", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-caveman-"));
  const normalItems = [];
  const cavemanItems = [];

  try {
    const baseOptions = {
      repoRoot,
      specPath: "openspec/specs/caveman-mode/spec.md",
      capability: "caveman-mode",
      requirement: "Configurable Internal Handoff Compression",
      scenarios: [
        {
          name: "Generate Shorter Handoff When Caveman Mode Is Enabled",
          priority: "P1",
          evidence: ".shipwright/evidence/caveman-mode.json"
        }
      ]
    };

    await createBeadsWorkItems({
      ...baseOptions,
      cavemanMode: false,
      createItem: async (item) => {
        normalItems.push(item);
      }
    });
    await createBeadsWorkItems({
      ...baseOptions,
      cavemanMode: true,
      createItem: async (item) => {
        cavemanItems.push(item);
      }
    });

    const normalScenario = normalItems.find((item) => item.type === "subtask");
    const cavemanScenario = cavemanItems.find((item) => item.type === "subtask");

    assert.deepEqual(cavemanScenario.shipwright, normalScenario.shipwright);
    assert.equal(cavemanScenario.title, normalScenario.title);
    assert.equal(cavemanScenario.handoff.length < normalScenario.handoff.length, true);
    assert.match(normalScenario.handoff, /Do not shorten specs, evidence files/);
    assert.doesNotMatch(cavemanScenario.handoff, /Do not shorten specs, evidence files/);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
