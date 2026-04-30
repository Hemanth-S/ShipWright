import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { gatherGraphContext } from "../src/graphify-context.js";

test("Reject Graph Paths Outside Repository", async () => {
  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "shipwright-graphify-"));
  const repoRoot = path.join(workspaceRoot, "ShipWright");
  const outsideGraphPath = path.join(workspaceRoot, "graphify-out", "graph.json");

  try {
    await mkdir(repoRoot, { recursive: true });

    const result = await gatherGraphContext({
      repoRoot,
      capability: "repository-context-profiling",
      graphPath: outsideGraphPath
    });

    assert.equal(result.exitCode, 1);
    assert.equal(result.message.includes("Invalid Graphify path outside repository root"), true);
    assert.equal(
      existsSync(path.join(repoRoot, ".shipwright", "evidence", "repository-context-profiling.json")),
      false
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("Include Graph Context When Files Exist", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-graphify-"));

  try {
    await mkdir(path.join(repoRoot, "graphify-out"), { recursive: true });
    await writeFile(path.join(repoRoot, "graphify-out", "graph.json"), '{"nodes":[]}\n');
    await writeFile(path.join(repoRoot, "graphify-out", "GRAPH_REPORT.md"), "# Graph\n");

    await gatherGraphContext({
      repoRoot,
      capability: "repository-context-profiling"
    });
    const evidence = JSON.parse(
      await readFile(
        path.join(repoRoot, ".shipwright", "evidence", "repository-context-profiling.json"),
        "utf8"
      )
    );
    const report = await readFile(path.join(repoRoot, "shipwright-report.md"), "utf8");

    assert.equal(evidence.graphify.available, true);
    assert.equal(evidence.graphify.graph_path, "graphify-out/graph.json");
    assert.equal(evidence.graphify.report_path, "graphify-out/GRAPH_REPORT.md");
    assert.equal(report.includes("Graphify context used"), true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Re-read Graph Context Without Duplicate Report Entries", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-graphify-"));

  try {
    await mkdir(path.join(repoRoot, "graphify-out"), { recursive: true });
    await writeFile(path.join(repoRoot, "graphify-out", "graph.json"), '{"nodes":[]}\n');
    await writeFile(path.join(repoRoot, "graphify-out", "GRAPH_REPORT.md"), "# Graph\n");

    await gatherGraphContext({ repoRoot, capability: "repository-context-profiling" });
    await gatherGraphContext({ repoRoot, capability: "repository-context-profiling" });
    const evidence = JSON.parse(
      await readFile(
        path.join(repoRoot, ".shipwright", "evidence", "repository-context-profiling.json"),
        "utf8"
      )
    );
    const report = await readFile(path.join(repoRoot, "shipwright-report.md"), "utf8");

    assert.equal((report.match(/Graphify context used/g) ?? []).length, 1);
    assert.equal(evidence.graphify.deduplicated, true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Fall Back When Graphify Output Is Missing", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-graphify-"));

  try {
    await gatherGraphContext({ repoRoot, capability: "repository-context-profiling" });
    const evidence = JSON.parse(
      await readFile(
        path.join(repoRoot, ".shipwright", "evidence", "repository-context-profiling.json"),
        "utf8"
      )
    );
    const report = await readFile(path.join(repoRoot, "shipwright-report.md"), "utf8");

    assert.equal(evidence.graphify.available, false);
    assert.equal(evidence.graphify.skip_reason, "missing_graphify_output");
    assert.equal(evidence.profile_path, ".shipwright/repo-profile.json");
    assert.equal(report.includes("Graphify skipped: missing_graphify_output"), true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("Fall Back When Graphify JSON Is Malformed", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "shipwright-graphify-"));

  try {
    await mkdir(path.join(repoRoot, "graphify-out"), { recursive: true });
    await writeFile(path.join(repoRoot, "graphify-out", "graph.json"), "not json\n");
    await writeFile(path.join(repoRoot, "graphify-out", "GRAPH_REPORT.md"), "# Graph\n");

    await gatherGraphContext({ repoRoot, capability: "repository-context-profiling" });
    const evidence = JSON.parse(
      await readFile(
        path.join(repoRoot, ".shipwright", "evidence", "repository-context-profiling.json"),
        "utf8"
      )
    );

    assert.equal(evidence.graphify.available, false);
    assert.equal(evidence.graphify.skip_reason, "malformed_graph_json");
    assert.equal(evidence.profile_path, ".shipwright/repo-profile.json");
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
