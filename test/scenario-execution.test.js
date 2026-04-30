import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { executeScenario } from "../src/scenario-execution.js";

test("Reject Scenario Evidence Path Outside Repository", async () => {
  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "shipwright-scenario-"));
  const repoRoot = path.join(workspaceRoot, "ShipWright");
  const outsidePath = path.join(workspaceRoot, "outside.json");

  try {
    const result = await executeScenario({
      repoRoot,
      scenario: "Classify Current Repository As Greenfield",
      evidencePath: "../outside.json"
    });

    assert.equal(result.exitCode, 1);
    assert.equal(result.message.includes("Invalid evidence path outside repository root"), true);
    assert.equal(result.beadsStatus, "Blocked");
    assert.equal(existsSync(outsidePath), false);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("Capture Passing Scenario Evidence", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-scenario-"));

  try {
    const result = await executeScenario({
      repoRoot,
      scenario: "Classify Current Repository As Greenfield",
      specPath: "openspec/specs/repository-context-profiling/spec.md",
      beadsId: "bd-classify",
      testPath: "test/repository-profile.test.js",
      commandExitCode: 0,
      docsUpdated: true
    });
    const evidence = JSON.parse(
      await readFile(
        path.join(repoRoot, ".shipwright", "evidence", "classify-current-repository-as-greenfield.json"),
        "utf8"
      )
    );

    assert.equal(typeof evidence.test_path, "string");
    assert.equal(evidence.test_path.length > 0, true);
    assert.equal(evidence.command_exit_code, 0);
    assert.equal(evidence.verification_status, "passed");
    assert.equal(evidence.docs_updated, true);
    assert.equal(result.beadsStatus, "Done");
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Re-run Scenario Without Duplicate Side Effects", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-scenario-"));
  const evidenceDir = path.join(repoRoot, ".shipwright", "evidence");
  const evidencePath = path.join(evidenceDir, "classify-current-repository-as-greenfield.json");

  try {
    await mkdir(evidenceDir, { recursive: true });
    await writeFile(
      evidencePath,
      JSON.stringify({ scenario_id: "classify-current-repository-as-greenfield" })
    );

    const result = await executeScenario({
      repoRoot,
      scenario: "Classify Current Repository As Greenfield",
      specPath: "openspec/specs/repository-context-profiling/spec.md",
      beadsId: "bd-classify",
      testPath: "test/repository-profile.test.js",
      commandExitCode: 0,
      docsUpdated: true,
      existingBeadsItems: [
        {
          shipwright: {
            scenario: "Classify Current Repository As Greenfield"
          }
        }
      ]
    });
    const evidenceFiles = await readdir(evidenceDir);
    const evidence = JSON.parse(await readFile(evidencePath, "utf8"));

    assert.equal(
      evidenceFiles.filter((entry) => entry === "classify-current-repository-as-greenfield.json").length,
      1
    );
    assert.equal(evidence.idempotent_rerun, true);
    assert.equal(result.beadsItemCount, 1);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Mark Scenario Blocked When Codex Times Out", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-scenario-"));

  try {
    const result = await executeScenario({
      repoRoot,
      scenario: "Classify Current Repository As Greenfield",
      implementScenario: async () => {
        const error = new Error("timeout");
        error.dependency = "Codex";
        error.failure = "timeout";
        throw error;
      }
    });
    const evidence = JSON.parse(
      await readFile(
        path.join(repoRoot, ".shipwright", "evidence", "classify-current-repository-as-greenfield.json"),
        "utf8"
      )
    );

    assert.equal(evidence.dependency, "Codex");
    assert.equal(evidence.failure, "timeout");
    assert.equal(evidence.verification_status, "blocked");
    assert.equal(result.beadsStatus, "Blocked");
    assert.equal(result.message.includes("Scenario execution blocked by Codex timeout"), true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
