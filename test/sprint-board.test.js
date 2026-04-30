import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { renderSprintBoard } from "../src/sprint-board.js";

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

test("Escape Malicious Card Text", async () => {
  const html = await renderSprintBoard({
    items: [
      {
        id: "bd-malicious",
        status: "Ready",
        shipwright: {
          scenario: "<script>window.shipwrightInjected=true</script>"
        }
      }
    ]
  });

  assert.equal(html.includes("&lt;script&gt;window.shipwrightInjected=true&lt;/script&gt;"), true);
  assert.equal(html.includes("<script>window.shipwrightInjected=true</script>"), false);
  assert.equal((html.match(/<script\b/g) ?? []).length, 0);
});

test("Render Board Update Within Demo Budget", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-board-"));

  try {
    const html = await renderSprintBoard({
      repoRoot,
      items: [
        {
          id: "bd-profile",
          status: "Verifying",
          shipwright: {
            scenario: "Classify Current Repository As Greenfield"
          }
        }
      ],
      previousItems: [
        {
          id: "bd-profile",
          status: "Writing Test",
          shipwright: {
            scenario: "Classify Current Repository As Greenfield"
          }
        }
      ]
    });
    const evidence = await readJsonIfExists(
      path.join(repoRoot, ".shipwright", "evidence", "board-update.json")
    );

    assert.equal(html.includes('data-column="Verifying"'), true);
    assert.notEqual(evidence, undefined);
    assert.equal(Number.isInteger(evidence.duration_ms), true);
    assert.equal(evidence.duration_ms < 1000, true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Refresh Board Without Duplicate Cards", async () => {
  const html = await renderSprintBoard({
    items: [
      {
        id: "bd-profile",
        status: "Ready",
        shipwright: {
          scenario: "Classify Current Repository As Greenfield"
        }
      },
      {
        id: "bd-profile",
        status: "Ready",
        shipwright: {
          scenario: "Classify Current Repository As Greenfield"
        }
      }
    ]
  });

  assert.equal((html.match(/Classify Current Repository As Greenfield/g) ?? []).length, 1);
  assert.equal((html.match(/data-beads-id="bd-profile"/g) ?? []).length, 1);
});

test("Display Required Board Columns And Card Fields", async () => {
  const html = await renderSprintBoard({
    items: [
      {
        id: "bd-profile",
        status: "Ready",
        shipwright: {
          capability: "repository-context-profiling",
          requirement: "Produce Lightweight Repository Profile",
          scenario: "Classify Current Repository As Greenfield",
          priority: "P1",
          type: "happy path",
          spec: "openspec/specs/repository-context-profiling/spec.md"
        }
      }
    ]
  });

  for (const column of [
    "Clarify",
    "Spec Ready",
    "Ready",
    "Writing Test",
    "Implementing",
    "Verifying",
    "Docs",
    "Done",
    "Blocked"
  ]) {
    assert.equal(html.includes(`data-column-label="${column}"`), true);
  }
  assert.equal(html.includes("repository-context-profiling"), true);
  assert.equal(html.includes("Classify Current Repository As Greenfield"), true);
  assert.equal(html.includes("P1"), true);
  assert.equal(html.includes("openspec/specs/repository-context-profiling/spec.md"), true);
});

test("Continue CLI Workflow When Board Cannot Start", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-board-"));

  try {
    const sprintBoard = await import("../src/sprint-board.js");
    assert.equal(typeof sprintBoard.startSprintBoard, "function");

    const result = await sprintBoard.startSprintBoard({
      repoRoot,
      capability: "repository-context-profiling",
      startUi: async () => ({ exitCode: 1 })
    });
    const evidence = JSON.parse(
      await readFile(path.join(repoRoot, ".shipwright", "evidence", "board-start.json"), "utf8")
    );

    assert.equal(result.message.includes("Sprint board unavailable"), true);
    assert.equal(result.cliReportAvailable, true);
    assert.equal(evidence.ui_available, false);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Display Completed Card Detail", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-board-"));

  try {
    await mkdir(path.join(repoRoot, ".shipwright", "evidence"), { recursive: true });
    await writeFile(
      path.join(repoRoot, ".shipwright", "evidence", "repository-context-profiling.json"),
      JSON.stringify({
        test_path: "test/repository-context-profiling.test.ts",
        verification_status: "passed",
        docs_updated: true,
        spec_path: "openspec/specs/repository-context-profiling/spec.md"
      })
    );

    const sprintBoard = await import("../src/sprint-board.js");
    assert.equal(typeof sprintBoard.renderCardDetail, "function");

    const html = await sprintBoard.renderCardDetail({
      repoRoot,
      scenario: "Classify Current Repository As Greenfield",
      evidenceFile: ".shipwright/evidence/repository-context-profiling.json"
    });

    assert.equal(html.includes("test/repository-context-profiling.test.ts"), true);
    assert.equal(html.includes("verification_status=passed"), true);
    assert.equal(html.includes("docs_updated=true"), true);
    assert.equal(html.includes("openspec/specs/repository-context-profiling/spec.md"), true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
