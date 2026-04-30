import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { profileRepository } from "../src/repository-profile.js";

test("Classify Current Repository As Greenfield", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-profile-"));

  try {
    await mkdir(path.join(repoRoot, ".git"), { recursive: true });
    await writeFile(path.join(repoRoot, "prd-spec-to-pr.md"), "# PRD\n");

    await profileRepository({ repoRoot });
    const profile = JSON.parse(
      await readFile(path.join(repoRoot, ".shipwright", "repo-profile.json"), "utf8")
    );

    assert.equal(profile.mode, "greenfield");
    assert.deepEqual(profile.docs, ["prd-spec-to-pr.md"]);
    assert.deepEqual(profile.routes, []);
    assert.deepEqual(profile.schemas, []);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Do Not Read Deep Service Files During Initial Profile", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-profile-"));
  const secretContents = "SHOULD_NOT_BE_IN_PROFILE";

  try {
    await mkdir(path.join(repoRoot, "src", "private"), { recursive: true });
    await writeFile(path.join(repoRoot, "src", "private", "service.ts"), secretContents);

    const result = await profileRepository({ repoRoot });
    const profileText = await readFile(path.join(repoRoot, ".shipwright", "repo-profile.json"), "utf8");
    const profile = JSON.parse(profileText);

    assert.equal(profileText.includes(secretContents), false);
    assert.deepEqual(profile.sourceFiles, ["src/private/service.ts"]);
    assert.equal(result.deepScan, false);
    assert.equal(profile.deep_scan, false);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Re-run Profile Without Duplicate Artifacts", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-profile-"));

  try {
    await writeFile(path.join(repoRoot, "prd-spec-to-pr.md"), "# PRD\n");

    await profileRepository({ repoRoot });
    const firstProfile = JSON.parse(
      await readFile(path.join(repoRoot, ".shipwright", "repo-profile.json"), "utf8")
    );
    await profileRepository({ repoRoot });
    const secondProfile = JSON.parse(
      await readFile(path.join(repoRoot, ".shipwright", "repo-profile.json"), "utf8")
    );
    const artifacts = await readdir(path.join(repoRoot, ".shipwright"));

    assert.deepEqual(secondProfile.mode, firstProfile.mode);
    assert.deepEqual(secondProfile.docs, firstProfile.docs);
    assert.deepEqual(secondProfile.routes, firstProfile.routes);
    assert.deepEqual(secondProfile.schemas, firstProfile.schemas);
    assert.equal(artifacts.filter((entry) => /^repo-profile-.*\.json$/.test(entry)).length, 0);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Complete Lightweight Profile Within Demo Budget", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-profile-"));

  try {
    await mkdir(path.join(repoRoot, ".git"), { recursive: true });
    await writeFile(path.join(repoRoot, "prd-spec-to-pr.md"), "# PRD\n");

    await profileRepository({ repoRoot });
    const profile = JSON.parse(
      await readFile(path.join(repoRoot, ".shipwright", "repo-profile.json"), "utf8")
    );

    assert.equal(Number.isInteger(profile.duration_ms), true);
    assert.equal(profile.duration_ms < 30000, true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Continue When Local Git Metadata Is Unavailable", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-profile-"));

  try {
    await writeFile(path.join(repoRoot, "prd-spec-to-pr.md"), "# PRD\n");

    const result = await profileRepository({
      repoRoot,
      readGitMetadata: async () => ({ exitCode: 1 })
    });
    const profile = JSON.parse(
      await readFile(path.join(repoRoot, ".shipwright", "repo-profile.json"), "utf8")
    );

    assert.equal(profile.git_available, false);
    assert.equal(profile.mode, "greenfield");
    assert.deepEqual(result.warnings, ["Git metadata unavailable"]);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Reject Profile Outside Repository Root", async () => {
  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "shipwright-profile-boundary-"));
  const selectedRepoRoot = path.join(workspaceRoot, "ShipWright");
  const requestedProfileRoot = workspaceRoot;

  try {
    await mkdir(selectedRepoRoot, { recursive: true });

    const result = await profileRepository({
      selectedRepoRoot,
      repoRoot: requestedProfileRoot
    });

    assert.equal(result.exitCode, 1);
    assert.equal(result.message.includes("Refusing to profile outside repository root"), true);
    assert.equal(existsSync(path.join(requestedProfileRoot, ".shipwright", "repo-profile.json")), false);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
