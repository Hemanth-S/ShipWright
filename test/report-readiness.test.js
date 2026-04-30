import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { generateEvidenceReport } from "../src/report-readiness.js";

test("Redact Secrets From Reports", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-report-"));

  try {
    await mkdir(path.join(repoRoot, ".shipwright", "evidence"), { recursive: true });
    await writeFile(
      path.join(repoRoot, ".shipwright", "evidence", "secret-test.json"),
      JSON.stringify({ output: "OPENAI_API_KEY=sk-test-secret-value" })
    );

    await generateEvidenceReport({ repoRoot });
    const markdown = await readFile(path.join(repoRoot, "shipwright-report.md"), "utf8");
    const report = JSON.parse(await readFile(path.join(repoRoot, "shipwright-report.json"), "utf8"));

    assert.equal(markdown.includes("sk-test-secret-value"), false);
    assert.equal(JSON.stringify(report).includes("sk-test-secret-value"), false);
    assert.equal(report.redactions, 1);
    assert.equal(markdown.includes("[REDACTED_SECRET]"), true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Generate Reports With Complete Traceability", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-report-"));

  try {
    await mkdir(path.join(repoRoot, ".shipwright", "evidence"), { recursive: true });
    await writeFile(
      path.join(repoRoot, ".shipwright", "evidence", "trace.json"),
      JSON.stringify({
        spec_path: "openspec/specs/repository-context-profiling/spec.md",
        beads_id: "bd-classify",
        test_path: "test/repository-profile.test.js",
        evidence_path: ".shipwright/evidence/trace.json",
        risk: "none"
      })
    );

    await generateEvidenceReport({ repoRoot });
    const markdown = await readFile(path.join(repoRoot, "shipwright-report.md"), "utf8");
    const report = JSON.parse(await readFile(path.join(repoRoot, "shipwright-report.json"), "utf8"));

    assert.equal(report.traceability_completeness, 100);
    assert.equal(markdown.includes("What changed"), true);
    assert.equal(markdown.includes("How it was tested"), true);
    assert.equal(markdown.includes("Residual risks"), true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Re-generate Reports Without Duplicate Sections", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-report-"));

  try {
    await mkdir(path.join(repoRoot, ".shipwright", "evidence"), { recursive: true });
    await writeFile(
      path.join(repoRoot, ".shipwright", "evidence", "trace.json"),
      JSON.stringify({
        spec_path: "openspec/specs/repository-context-profiling/spec.md",
        beads_id: "bd-classify",
        test_path: "test/repository-profile.test.js"
      })
    );

    await generateEvidenceReport({ repoRoot });
    await generateEvidenceReport({ repoRoot });
    const markdown = await readFile(path.join(repoRoot, "shipwright-report.md"), "utf8");
    const report = JSON.parse(await readFile(path.join(repoRoot, "shipwright-report.json"), "utf8"));

    assert.equal((markdown.match(/## Requirements Implemented/g) ?? []).length, 1);
    assert.equal((markdown.match(/## Residual Risks/g) ?? []).length, 1);
    assert.equal(
      report.entries.filter(
        (entry) => entry.spec_path === "openspec/specs/repository-context-profiling/spec.md"
      ).length,
      1
    );
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Do Not Create Duplicate GitHub PR", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-report-"));

  try {
    const result = await generateEvidenceReport({
      repoRoot,
      branch: "codex/demo",
      existingPullRequest: {
        branch: "codex/demo",
        url: "https://github.com/Hemanth-S/ShipWright/pull/1"
      },
      createPullRequest: async () => {
        throw new Error("should not create duplicate");
      }
    });
    const report = JSON.parse(await readFile(path.join(repoRoot, "shipwright-report.json"), "utf8"));

    assert.equal(result.prCreated, false);
    assert.equal(report.pr_deduplicated, true);
    assert.equal(report.pr_url, "https://github.com/Hemanth-S/ShipWright/pull/1");
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Produce PR-Ready Fallback When GitHub Is Unavailable", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-report-"));

  try {
    const result = await generateEvidenceReport({
      repoRoot,
      gitMetadata: {
        branch: "codex/demo",
        commit: "abc123",
        remote: "https://github.com/Hemanth-S/ShipWright.git",
        changedFiles: ["src/report-readiness.js"]
      },
      createPullRequest: async () => {
        const error = new Error("network failure");
        error.code = "NETWORK_FAILURE";
        throw error;
      }
    });
    const report = JSON.parse(await readFile(path.join(repoRoot, "shipwright-report.json"), "utf8"));

    assert.equal(report.pr_created, false);
    assert.equal(report.pr_ready, true);
    assert.equal(report.pr_failure, "github_network_failure");
    assert.equal(result.message.includes("GitHub unavailable; PR-ready evidence generated"), true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Generate Reports Within Demo Budget", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-report-"));

  try {
    await mkdir(path.join(repoRoot, ".shipwright", "evidence"), { recursive: true });
    await writeFile(path.join(repoRoot, ".shipwright", "evidence", "trace.json"), "{}");

    await generateEvidenceReport({ repoRoot });
    const report = JSON.parse(await readFile(path.join(repoRoot, "shipwright-report.json"), "utf8"));

    assert.equal(Number.isInteger(report.report_generation_duration_ms), true);
    assert.equal(report.report_generation_duration_ms < 10000, true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
