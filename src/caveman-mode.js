/**
 * Builds internal task handoff text.
 *
 * @param {{ cavemanMode?: boolean | string | { enabled?: boolean }, type?: string, title?: string, capability?: string, requirement?: string, scenario?: string, priority?: string, spec?: string, evidence?: string }} options - Handoff options.
 * @returns {string} Internal handoff text.
 */
export function createInternalHandoff(options = {}) {
  const handoff = normalizeHandoff(options);

  if (isCavemanModeEnabled(options.cavemanMode)) {
    return compactHandoff(handoff);
  }

  return standardHandoff(handoff);
}

/**
 * Compares normal and caveman handoff sizes for demo evidence.
 *
 * @param {object} options - Handoff options.
 * @returns {{ normal: string, caveman: string, normalLength: number, cavemanLength: number, estimatedReductionPercent: number }} Handoff comparison.
 */
export function compareHandoffLengths(options = {}) {
  const normal = createInternalHandoff({ ...options, cavemanMode: false });
  const caveman = createInternalHandoff({ ...options, cavemanMode: true });
  const estimatedReductionPercent =
    normal.length === 0 ? 0 : Math.round(((normal.length - caveman.length) / normal.length) * 100);

  return {
    normal,
    caveman,
    normalLength: normal.length,
    cavemanLength: caveman.length,
    estimatedReductionPercent
  };
}

/**
 * Resolves supported caveman mode configuration values.
 *
 * @param {boolean | string | { enabled?: boolean } | undefined} value - Mode config.
 * @returns {boolean} Whether caveman mode is enabled.
 */
export function isCavemanModeEnabled(value) {
  if (typeof value === "object" && value !== null) {
    return value.enabled === true;
  }

  if (typeof value === "string") {
    return ["1", "true", "on", "yes"].includes(value.toLowerCase());
  }

  return value === true;
}

function standardHandoff(handoff) {
  return [
    `Internal handoff for ${handoff.type}: ${handoff.title}.`,
    `Capability: ${handoff.capability}.`,
    handoff.requirement ? `Requirement: ${handoff.requirement}.` : undefined,
    handoff.scenario ? `Scenario: ${handoff.scenario}.` : undefined,
    handoff.priority ? `Priority: ${handoff.priority}.` : undefined,
    `Use the OpenSpec at ${handoff.spec} as the source of truth.`,
    handoff.evidence
      ? `Record implementation proof in ${handoff.evidence} and keep reviewer-facing evidence clear.`
      : "Record implementation proof in the Shipwright evidence directory and keep reviewer-facing evidence clear.",
    "Do not shorten specs, evidence files, documentation, or final reviewer reports."
  ]
    .filter(Boolean)
    .join("\n");
}

function compactHandoff(handoff) {
  return [
    `${handoff.type}: ${handoff.title}`,
    `cap: ${handoff.capability}`,
    handoff.scenario ? `do: ${handoff.scenario}` : undefined,
    handoff.priority ? `prio: ${handoff.priority}` : undefined,
    `spec: ${handoff.spec}`,
    handoff.evidence ? `proof: ${handoff.evidence}` : undefined
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeHandoff(options) {
  return {
    type: options.type ?? "task",
    title: options.title ?? options.scenario ?? options.requirement ?? options.capability ?? "untitled",
    capability: options.capability ?? "unknown",
    requirement: options.requirement,
    scenario: options.scenario,
    priority: options.priority,
    spec: options.spec ?? "openspec/specs",
    evidence: options.evidence
  };
}
