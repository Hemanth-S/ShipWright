import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BOARD_COLUMNS = [
  "Clarify",
  "Spec Ready",
  "Ready",
  "Writing Test",
  "Implementing",
  "Verifying",
  "Docs",
  "Done",
  "Blocked"
];

/**
 * Renders the local Sprint board.
 *
 * @param {{ items: Array<object> }} options - Board render options.
 * @returns {Promise<string>} HTML board markup.
 */
export async function renderSprintBoard(options) {
  const startedAt = Date.now();
  const cards = uniqueItemsById(options.items ?? [])
    .map(
      (item) =>
        `<article class="card" data-beads-id="${escapeHtml(item.id ?? "")}" data-column="${escapeHtml(item.status ?? "Ready")}">${renderCardFields(item)}</article>`
    )
    .join("");

  if (options.repoRoot && options.previousItems) {
    const evidenceDir = path.join(options.repoRoot, ".shipwright", "evidence");
    await mkdir(evidenceDir, { recursive: true });
    await writeFile(
      path.join(evidenceDir, "board-update.json"),
      JSON.stringify({ duration_ms: Date.now() - startedAt })
    );
  }

  const columns = BOARD_COLUMNS.map(
    (column) => `<section class="board-column" data-column-label="${escapeHtml(column)}">${escapeHtml(column)}</section>`
  ).join("");

  return `<section class="sprint-board">${columns}${cards}</section>`;
}

/**
 * Starts the local Sprint board and records fallback evidence when the UI is unavailable.
 *
 * @param {{ repoRoot: string, startUi?: Function }} options - Sprint board startup options.
 * @returns {Promise<{ message: string, cliReportAvailable: boolean }>} Startup result.
 */
export async function startSprintBoard(options) {
  const result = options.startUi ? await options.startUi() : { exitCode: 0 };
  if (result.exitCode === 0) {
    return { message: "Sprint board available", cliReportAvailable: true };
  }

  const evidenceDir = path.join(options.repoRoot, ".shipwright", "evidence");
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(
    path.join(evidenceDir, "board-start.json"),
    JSON.stringify({ ui_available: false, capability: options.capability })
  );

  return {
    message: "Sprint board unavailable; CLI report generation remains available",
    cliReportAvailable: true
  };
}

/**
 * Renders evidence details for a selected Sprint board card.
 *
 * @param {{ repoRoot: string, evidenceFile: string }} options - Card detail render options.
 * @returns {Promise<string>} HTML card detail markup.
 */
export async function renderCardDetail(options) {
  const evidencePath = path.resolve(options.repoRoot, options.evidenceFile);
  const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
  const fields = [
    evidence.test_path,
    `verification_status=${evidence.verification_status}`,
    `docs_updated=${evidence.docs_updated}`,
    evidence.spec_path
  ];

  return `<section class="card-detail">${fields
    .map((field) => `<span class="card-detail-field">${escapeHtml(field)}</span>`)
    .join("")}</section>`;
}

function uniqueItemsById(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.id ?? item.shipwright?.scenario ?? item.title;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function renderCardFields(item) {
  const metadata = item.shipwright ?? {};
  return [
    metadata.capability,
    metadata.scenario ?? item.title,
    metadata.priority,
    metadata.spec
  ]
    .filter((value) => value !== undefined && value !== "")
    .map((value) => `<span class="card-field">${escapeHtml(value)}</span>`)
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
