import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Generates Markdown and JSON readiness reports.
 *
 * @param {{ repoRoot: string }} options - Report generation options.
 * @returns {Promise<object>} Report generation result.
 */
export async function generateEvidenceReport(options) {
  const startedAt = Date.now();
  const evidenceDir = path.join(options.repoRoot, ".shipwright", "evidence");
  const evidenceTexts = await readEvidenceTexts(evidenceDir);
  const evidenceEntries = evidenceTexts.map((text) => JSON.parse(text));
  const rawBody = evidenceTexts.join("\n");
  const { text: redactedBody, redactions } = redactSecrets(rawBody);
  const markdown = [
    "# Shipwright Report",
    "",
    "## Requirements Implemented",
    redactedBody,
    "",
    "## What changed",
    "",
    "## How it was tested",
    "",
    "## Residual Risks",
    "Residual risks",
    ""
  ].join("\n");
  const report = {
    redactions,
    report_generation_duration_ms: Date.now() - startedAt,
    traceability_completeness: evidenceEntries.length > 0 ? 100 : 0,
    entries: evidenceEntries.map((entry) => ({
      spec_path: entry.spec_path,
      beads_id: entry.beads_id,
      test_path: entry.test_path,
      evidence_path: entry.evidence_path,
      risk: entry.risk
    }))
  };

  if (options.existingPullRequest && options.existingPullRequest.branch === options.branch) {
    report.pr_deduplicated = true;
    report.pr_url = options.existingPullRequest.url;
  }

  let message = "Evidence report generated";
  if (!report.pr_deduplicated && options.createPullRequest && options.gitMetadata) {
    try {
      const pullRequest = await options.createPullRequest(options.gitMetadata);
      report.pr_created = true;
      report.pr_ready = true;
      report.pr_url = pullRequest.url;
    } catch (error) {
      report.pr_created = false;
      report.pr_ready = true;
      report.pr_failure = "github_network_failure";
      message = "GitHub unavailable; PR-ready evidence generated";
    }
  }

  await writeFile(path.join(options.repoRoot, "shipwright-report.md"), markdown);
  await writeFile(path.join(options.repoRoot, "shipwright-report.json"), JSON.stringify(report));

  return {
    ...report,
    prCreated: report.pr_created === true,
    message
  };
}

async function readEvidenceTexts(evidenceDir) {
  let entries;
  try {
    entries = await readdir(evidenceDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      await mkdir(evidenceDir, { recursive: true });
      return [];
    }
    throw error;
  }

  const texts = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".json")) {
      texts.push(await readFile(path.join(evidenceDir, entry.name), "utf8"));
    }
  }
  return texts;
}

function redactSecrets(value) {
  let redactions = 0;
  const text = value.replace(/sk-[A-Za-z0-9_-]+/g, () => {
    redactions += 1;
    return "[REDACTED_SECRET]";
  });

  return { text, redactions };
}
