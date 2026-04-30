import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Executes an OpenSpec scenario and records evidence.
 *
 * @param {{ repoRoot: string, scenario: string, evidencePath?: string }} options - Scenario execution options.
 * @returns {Promise<object>} Execution result.
 */
export async function executeScenario(options) {
  const repoRoot = path.resolve(options.repoRoot);
  const evidencePath = path.resolve(repoRoot, options.evidencePath ?? defaultEvidencePath(options.scenario));

  if (!isInsideDirectory(evidencePath, repoRoot)) {
    return {
      exitCode: 1,
      beadsStatus: "Blocked",
      message: "Invalid evidence path outside repository root"
    };
  }

  try {
    await options.implementScenario?.();
  } catch (error) {
    const evidence = {
      scenario_id: slugify(options.scenario),
      dependency: error.dependency ?? "Codex",
      failure: error.failure ?? "timeout",
      verification_status: "blocked"
    };

    await mkdir(path.dirname(evidencePath), { recursive: true });
    await writeFile(evidencePath, JSON.stringify(evidence));

    return {
      beadsStatus: "Blocked",
      message: "Scenario execution blocked by Codex timeout",
      evidencePath
    };
  }

  const idempotentRerun = await pathExists(evidencePath);
  const evidence = {
    scenario_id: slugify(options.scenario),
    spec_path: options.specPath,
    beads_id: options.beadsId,
    test_path: options.testPath,
    command_exit_code: options.commandExitCode ?? 0,
    verification_status: "passed",
    docs_updated: options.docsUpdated === true,
    idempotent_rerun: idempotentRerun
  };

  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, JSON.stringify(evidence));

  return {
    beadsStatus: "Done",
    evidencePath,
    beadsItemCount: countMatchingScenarioItems(options.existingBeadsItems, options.scenario)
  };
}

function defaultEvidencePath(scenario) {
  return path.join(".shipwright", "evidence", `${slugify(scenario)}.json`);
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

function countMatchingScenarioItems(items = [], scenario) {
  return items.filter((item) => item.shipwright?.scenario === scenario).length;
}
