import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Gathers optional Graphify context for a capability.
 *
 * @param {{ repoRoot: string, capability: string, graphPath?: string, reportPath?: string }} options - Graphify context options.
 * @returns {Promise<object>} Graph context result.
 */
export async function gatherGraphContext(options) {
  const repoRoot = path.resolve(options.repoRoot);
  const graphPath = path.resolve(options.graphPath ?? path.join(repoRoot, "graphify-out", "graph.json"));
  const reportPath = path.resolve(
    options.reportPath ?? path.join(repoRoot, "graphify-out", "GRAPH_REPORT.md")
  );

  if (!isInsideDirectory(graphPath, repoRoot)) {
    return {
      exitCode: 1,
      message: "Invalid Graphify path outside repository root"
    };
  }

  const evidencePath = path.join(repoRoot, ".shipwright", "evidence", `${options.capability}.json`);

  let graphText;
  try {
    graphText = await readFile(graphPath, "utf8");
    await readFile(reportPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return writeFallback(repoRoot, evidencePath, "missing_graphify_output");
    }
    throw error;
  }

  try {
    JSON.parse(graphText);
  } catch {
    return writeFallback(repoRoot, evidencePath, "malformed_graph_json");
  }

  const deduplicated = await pathExists(evidencePath);
  const evidence = {
    graphify: {
      available: true,
      graph_path: path.relative(repoRoot, graphPath),
      report_path: path.relative(repoRoot, reportPath),
      deduplicated
    }
  };

  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, JSON.stringify(evidence));
  await writeFile(
    path.join(repoRoot, "shipwright-report.md"),
    `Graphify context used for ${options.capability}\n`
  );

  return { evidencePath };
}

async function writeFallback(repoRoot, evidencePath, skipReason) {
  const evidence = {
    graphify: {
      available: false,
      skip_reason: skipReason
    },
    profile_path: ".shipwright/repo-profile.json"
  };

  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, JSON.stringify(evidence));
  await writeFile(path.join(repoRoot, "shipwright-report.md"), `Graphify skipped: ${skipReason}\n`);

  return { evidencePath };
}

function isInsideDirectory(targetPath, rootPath) {
  const relativePath = path.relative(rootPath, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}
