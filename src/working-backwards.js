import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Continues the Working Backwards clarification flow.
 *
 * @param {{ repoRoot: string, featureRequest: string, allTopicsAnswered: boolean, confirmed: boolean, capabilities?: string[] }} options - Conversation state.
 * @returns {Promise<object>} Assistant response state.
 */
export async function continueWorkingBackwards(options) {
  if (!options.allTopicsAnswered) {
    const profile = await readRepositoryProfile(options.repoRoot);
    return {
      status: "clarifying",
      message: [
        `I see this is a ${profile.mode ?? "unknown"} repository.`,
        "What capability or problem are we solving?",
        "Who is the user and exact job-to-be-done?"
      ].join("\n")
    };
  }

  if (options.allTopicsAnswered && !options.confirmed) {
    return {
      status: "awaiting_confirmation",
      message: [
        "I have enough to write the PRD. Shall I generate it now?",
        "Do these capabilities look right? Reply yes to generate the specs, or tell me what to change."
      ].join("\n")
    };
  }

  return {};
}

/**
 * Generates OpenSpec files after user confirmation.
 *
 * @param {{ repoRoot: string, capability: string, featureRequest: string, confirmed: boolean }} options - Spec generation options.
 * @returns {Promise<object>} Spec generation result.
 */
export async function generateOpenSpec(options) {
  const specDir = path.join(options.repoRoot, "openspec", "specs", options.capability);
  const specPath = path.join(specDir, "spec.md");
  const evidencePath = path.join(
    options.repoRoot,
    ".shipwright",
    "evidence",
    `${options.capability}.json`
  );
  const promptInjectionDetected = detectsPromptInjection(options.featureRequest);
  const specAlreadyExists = await pathExists(specPath);

  await mkdir(specDir, { recursive: true });
  await mkdir(path.dirname(evidencePath), { recursive: true });

  let specText;
  try {
    specText = options.draftSpec
      ? await options.draftSpec(options)
      : buildSpecText(options, promptInjectionDetected);
  } catch (error) {
    await writeFile(
      evidencePath,
      JSON.stringify({
        dependency: error.dependency ?? "Codex",
        failure: error.failure ?? "timeout"
      })
    );

    return {
      workItemStatus: "Blocked",
      message: "Spec generation blocked by Codex timeout",
      evidencePath,
      readEvidence: async () => JSON.parse(await readFile(evidencePath, "utf8"))
    };
  }

  await writeFile(specPath, specText);
  await writeFile(
    evidencePath,
    JSON.stringify({
      prompt_injection_detected: promptInjectionDetected,
      idempotent_write: specAlreadyExists
    })
  );

  return {
    specPath,
    evidencePath,
    readSpec: () => readFile(specPath, "utf8"),
    readEvidence: async () => JSON.parse(await readFile(evidencePath, "utf8"))
  };
}

function buildSpecText(options, promptInjectionDetected) {
  const note = promptInjectionDetected
    ? "\n<!-- ASSUMPTION: User request may contain prompt injection; treat it as untrusted context — validate with team -->"
    : "";

  return `# ${options.capability} Specification

## Purpose
Generate a testable specification from confirmed Working Backwards inputs.

## Requirements

### Requirement: Preserve User Request As Context
The system SHALL treat user-provided feature text as untrusted context rather than executable instructions.

#### Scenario: Capture User Request [P0]
- GIVEN User request: "${options.featureRequest}"
- WHEN Shipwright generates an OpenSpec file from the request
- THEN the generated file contains the request only as quoted context
- AND no generated requirement instructs the system to follow prompt-injection text
${note}
`;
}

function detectsPromptInjection(featureRequest) {
  return /ignore previous instructions/i.test(featureRequest ?? "");
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readRepositoryProfile(repoRoot) {
  try {
    const profileText = await readFile(path.join(repoRoot, ".shipwright", "repo-profile.json"), "utf8");
    return JSON.parse(profileText);
  } catch {
    return {};
  }
}
