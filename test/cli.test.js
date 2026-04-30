import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";

const execFileAsync = promisify(execFile);
const cliPath = path.resolve("bin", "shipwright.js");

test("CLI initializes a repository workspace", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-cli-"));

  try {
    const { stdout } = await execFileAsync(process.execPath, [
      cliPath,
      "init",
      "--repo-root",
      repoRoot
    ]);

    assert.match(stdout, /Initialized/);
    assert.equal(existsSync(path.join(repoRoot, ".shipwright", "evidence")), true);
    assert.equal(existsSync(path.join(repoRoot, "openspec", "specs")), true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("CLI profiles a repository", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-cli-"));

  try {
    await mkdir(path.join(repoRoot, "src"), { recursive: true });
    await writeFile(path.join(repoRoot, "src", "index.js"), "export const value = 1;\n");

    await execFileAsync(process.execPath, [cliPath, "profile", "--repo-root", repoRoot]);
    const profile = JSON.parse(
      await readFile(path.join(repoRoot, ".shipwright", "repo-profile.json"), "utf8")
    );

    assert.equal(profile.mode, "greenfield");
    assert.deepEqual(profile.sourceFiles, ["src/index.js"]);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("CLI writes a confirmed OpenSpec", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-cli-"));

  try {
    const { stdout } = await execFileAsync(process.execPath, [
      cliPath,
      "spec",
      "--repo-root",
      repoRoot,
      "--capability",
      "demo-flow",
      "--feature",
      "Build the demo flow"
    ]);
    const specPath = path.join(repoRoot, "openspec", "specs", "demo-flow", "spec.md");
    const spec = await readFile(specPath, "utf8");

    assert.match(stdout, /OpenSpec written/);
    assert.match(spec, /# demo-flow Specification/);
    assert.match(spec, /Build the demo flow/);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("CLI generates evidence reports", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-cli-"));

  try {
    await mkdir(path.join(repoRoot, ".shipwright", "evidence"), { recursive: true });
    await writeFile(
      path.join(repoRoot, ".shipwright", "evidence", "trace.json"),
      JSON.stringify({
        spec_path: "openspec/specs/demo-flow/spec.md",
        beads_id: "bd-demo",
        test_path: "test/demo.test.js",
        evidence_path: ".shipwright/evidence/trace.json",
        risk: "none"
      })
    );

    const { stdout } = await execFileAsync(process.execPath, [
      cliPath,
      "report",
      "--repo-root",
      repoRoot
    ]);
    const report = JSON.parse(await readFile(path.join(repoRoot, "shipwright-report.json"), "utf8"));

    assert.match(stdout, /Evidence report generated/);
    assert.equal(report.traceability_completeness, 100);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("CLI rejects missing required options", async () => {
  await assert.rejects(
    () => execFileAsync(process.execPath, [cliPath, "spec", "--capability", "demo-flow"]),
    /--feature is required for spec/
  );
});
