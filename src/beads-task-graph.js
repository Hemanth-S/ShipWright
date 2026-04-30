import path from "node:path";

/**
 * Creates Beads work items from OpenSpec metadata.
 *
 * @param {{ repoRoot: string, specPath: string, capability: string, requirement: string, scenarios: Array<object>, createItem?: (item: object) => Promise<void> }} options - Beads creation options.
 * @returns {Promise<object>} Creation result.
 */
export async function createBeadsWorkItems(options) {
  const repoRoot = path.resolve(options.repoRoot);

  if (options.beadsAvailable === false) {
    return {
      exitCode: 1,
      message: "Beads CLI not found"
    };
  }

  for (const scenario of options.scenarios ?? []) {
    if (scenario.evidence && !isInsideDirectory(path.resolve(repoRoot, scenario.evidence), repoRoot)) {
      return {
        exitCode: 1,
        message: "Invalid evidence path outside repository root"
      };
    }
  }

  const existingItem = (options.existingItems ?? []).find(
    (item) =>
      item.shipwright?.capability === options.capability && item.shipwright?.spec === options.specPath
  );

  if (existingItem) {
    return {
      updated: 1,
      evidence: {
        deduplicated: true
      }
    };
  }

  const createdItems = [
    {
      type: "epic",
      title: options.capability,
      shipwright: {
        capability: options.capability,
        spec: options.specPath
      }
    },
    {
      type: "task",
      title: options.requirement,
      shipwright: {
        capability: options.capability,
        requirement: options.requirement,
        spec: options.specPath
      }
    },
    ...(options.scenarios ?? []).map((scenario) => ({
      type: "subtask",
      title: scenario.name,
      shipwright: {
        capability: options.capability,
        requirement: options.requirement,
        scenario: scenario.name,
        priority: scenario.priority,
        spec: options.specPath,
        evidence: scenario.evidence
      }
    }))
  ];

  for (const item of createdItems) {
    await options.createItem?.(item);
  }

  return { created: createdItems.length };
}

function isInsideDirectory(targetPath, rootPath) {
  const relativePath = path.relative(rootPath, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}
