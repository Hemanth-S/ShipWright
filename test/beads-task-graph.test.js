import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createBeadsWorkItems } from "../src/beads-task-graph.js";

test("Reject Metadata Paths Outside Repository", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-beads-"));
  const createdItems = [];

  try {
    const result = await createBeadsWorkItems({
      repoRoot,
      specPath: "openspec/specs/repository-context-profiling/spec.md",
      capability: "repository-context-profiling",
      requirement: "Produce Lightweight Repository Profile",
      scenarios: [
        {
          name: "Classify Current Repository As Greenfield",
          priority: "P1",
          evidence: "../evidence/outside.json"
        }
      ],
      createItem: async (item) => {
        createdItems.push(item);
      }
    });

    assert.equal(result.exitCode, 1);
    assert.equal(result.message.includes("Invalid evidence path outside repository root"), true);
    assert.equal(JSON.stringify(createdItems).includes("../evidence/outside.json"), false);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Create Epic And Scenario Tasks", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-beads-"));
  const createdItems = [];

  try {
    await createBeadsWorkItems({
      repoRoot,
      specPath: "openspec/specs/repository-context-profiling/spec.md",
      capability: "repository-context-profiling",
      requirement: "Produce Lightweight Repository Profile",
      scenarios: [
        {
          name: "Classify Current Repository As Greenfield",
          priority: "P1",
          evidence: ".shipwright/evidence/repository-context-profiling.json"
        }
      ],
      createItem: async (item) => {
        createdItems.push(item);
      }
    });

    assert.equal(
      createdItems.some(
        (item) => item.type === "epic" && item.shipwright.capability === "repository-context-profiling"
      ),
      true
    );
    assert.equal(
      createdItems.some(
        (item) =>
          item.type === "task" &&
          item.shipwright.requirement === "Produce Lightweight Repository Profile"
      ),
      true
    );
    assert.equal(
      createdItems.some(
        (item) =>
          item.shipwright.scenario === "Classify Current Repository As Greenfield" &&
          item.shipwright.spec === "openspec/specs/repository-context-profiling/spec.md"
      ),
      true
    );
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Re-run Beads Creation Without Duplicate Tasks", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-beads-"));
  const items = [
    {
      type: "epic",
      title: "repository-context-profiling",
      shipwright: {
        capability: "repository-context-profiling",
        spec: "openspec/specs/repository-context-profiling/spec.md"
      }
    }
  ];

  try {
    const result = await createBeadsWorkItems({
      repoRoot,
      specPath: "openspec/specs/repository-context-profiling/spec.md",
      capability: "repository-context-profiling",
      requirement: "Produce Lightweight Repository Profile",
      scenarios: [],
      existingItems: items,
      createItem: async (item) => {
        items.push(item);
      }
    });

    assert.equal(
      items.filter((item) => item.shipwright.capability === "repository-context-profiling").length,
      1
    );
    assert.equal(result.evidence.deduplicated, true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Stop When Beads CLI Is Missing", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-beads-"));
  const sprintCards = [];

  try {
    const result = await createBeadsWorkItems({
      repoRoot,
      specPath: "openspec/specs/repository-context-profiling/spec.md",
      capability: "repository-context-profiling",
      requirement: "Produce Lightweight Repository Profile",
      scenarios: [],
      beadsAvailable: false,
      createSprintCard: async (card) => {
        sprintCards.push(card);
      }
    });

    assert.equal(result.exitCode, 1);
    assert.equal(sprintCards.length, 0);
    assert.equal(result.message.includes("Beads CLI not found"), true);
    assert.equal(result.message.includes("\nat "), false);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
