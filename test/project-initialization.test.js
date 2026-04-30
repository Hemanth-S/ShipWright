import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { initializeWorkspace } from "../src/project-initialization.js";

test("Create Initial Workspace", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-init-"));

  try {
    const result = await initializeWorkspace({
      repoRoot,
      remote: "https://github.com/Hemanth-S/ShipWright.git"
    });

    assert.equal(result.exitCode, 0);
    assert.equal(existsSync(path.join(repoRoot, ".shipwright")), true);
    assert.equal(existsSync(path.join(repoRoot, ".shipwright", "evidence")), true);
    assert.equal(existsSync(path.join(repoRoot, "openspec", "specs")), true);
    assert.equal(result.repoRoot, repoRoot);
    assert.equal(result.remote, "https://github.com/Hemanth-S/ShipWright.git");
    assert.equal(result.mode, "local-only");
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Reject Repository Path Traversal", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-init-"));
  const outsidePath = path.join(repoRoot, "..", ".shipwright");

  try {
    const result = await initializeWorkspace({
      repoRoot,
      targetPath: outsidePath
    });

    assert.equal(result.exitCode, 1);
    assert.equal(existsSync(path.resolve(repoRoot, "..", ".shipwright")), false);
    assert.match(result.message, /Refusing to write outside repository root/);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
    await rm(path.resolve(repoRoot, "..", ".shipwright"), {
      recursive: true,
      force: true
    });
  }
});

test("Re-run Initialization Without Duplicate Side Effects", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-init-"));

  try {
    await mkdir(path.join(repoRoot, ".shipwright", "evidence"), { recursive: true });
    await mkdir(path.join(repoRoot, "openspec", "specs"), { recursive: true });

    const result = await initializeWorkspace({ repoRoot });
    const rootEntries = await readdir(repoRoot);

    assert.equal(result.exitCode, 0);
    assert.equal(rootEntries.filter((entry) => entry === ".shipwright").length, 1);
    assert.equal(existsSync(path.join(repoRoot, "openspec", "specs")), true);
    assert.equal(result.created, false);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Initialize Small Repository Within Demo Budget", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-init-"));

  try {
    await mkdir(path.join(repoRoot, ".git"), { recursive: true });
    const result = await initializeWorkspace({ repoRoot });

    assert.equal(result.exitCode, 0);
    assert.equal(Number.isInteger(result.durationMs), true);
    assert.equal(result.durationMs < 30000, true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Report Workspace Write Permission Failure", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-init-"));

  try {
    const result = await initializeWorkspace({
      repoRoot,
      createDirectory: async () => {
        const error = new Error("permission denied");
        error.code = "EACCES";
        throw error;
      }
    });

    assert.equal(result.exitCode, 1);
    assert.match(result.message, /Cannot write Shipwright workspace/);
    assert.match(result.message, /\.shipwright\//);
    assert.doesNotMatch(result.message, /^at /m);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
