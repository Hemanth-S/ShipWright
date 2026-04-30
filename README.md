# Shipwright

Shipwright is a local, spec-first workflow for turning a vague software request into OpenSpec files, Beads tasks, implementation evidence, and a PR-ready report.

## Project Initialization API

### `initializeWorkspace(options)`

Initializes Shipwright workspace paths for a local repository.

- `options.repoRoot` (`string`): Absolute or relative path to the repository root.
- `options.selectedRepoRoot` (`string`, optional): Selected repository boundary. Defaults to `repoRoot`.
- `options.readGitMetadata` (`function`, optional): Internal metadata reader used by tests and adapters. It resolves to an object with `exitCode`.
- `options.targetPath` (`string`, optional): Workspace target path. Defaults to `.shipwright/` under `repoRoot`.

Returns a promise resolving to an object with:

- `exitCode` (`number`): `0` for success, `1` for a validation or setup failure.
- `message` (`string`): User-facing result text.
- `repoRoot` (`string`): Absolute repository root when initialization succeeds.
- `remote` (`string | undefined`): Remote URL passed by the caller.
- `mode` (`"local-only"`): Current MVP security and execution mode.
- `created` (`boolean`): `true` when the workspace target did not already exist.
- `durationMs` (`number`): Initialization duration in milliseconds.

Errors and validation failures are returned as structured results rather than thrown stack traces. If `targetPath` resolves outside `repoRoot`, the function returns `exitCode: 1` and the message `Refusing to write outside repository root`.

Calling `initializeWorkspace` more than once with the same repository is idempotent. Existing `.shipwright/`, `.shipwright/evidence/`, and `openspec/specs/` directories are reused, and the result reports `created: false` when the workspace target already existed.

For small hackathon repositories, initialization records `durationMs` so demo scripts and reports can verify the initialization path stays below the 30 second demo budget.

If workspace directory creation fails because the operating system denies access, the function returns `exitCode: 1` and a user-facing message containing `Cannot write Shipwright workspace` and `.shipwright/`. It does not include stack trace lines.

## Repository Profiling API

### `profileRepository(options)`

Builds a lightweight repository profile at `.shipwright/repo-profile.json`.

- `options.repoRoot` (`string`): Absolute or relative path to the repository root.

The initial profile records discovered source file paths without reading or storing file contents. The result reports `deepScan: false`, and the JSON profile stores `deep_scan: false`.

For a greenfield repository with project docs but no routes or schemas, the profile records `mode: "greenfield"`, `docs`, `routes: []`, and `schemas: []`.

If Git branch or remote metadata cannot be read, the profile still writes `.shipwright/repo-profile.json`, stores `git_available: false`, and returns the warning `Git metadata unavailable`.

Profiling is idempotent. Re-running `profileRepository` updates `.shipwright/repo-profile.json` in place and does not create timestamped duplicate profile artifacts.

For small hackathon repositories, the profile JSON includes `duration_ms` as an integer so demo scripts and reports can verify the lightweight profile path stays below the 30 second demo budget.

If `repoRoot` resolves outside `selectedRepoRoot`, profiling stops before reading or writing profile artifacts and returns `exitCode: 1` with the message `Refusing to profile outside repository root`.

## Graphify Context API

### `gatherGraphContext(options)`

Gathers optional Graphify context for a capability.

- `options.repoRoot` (`string`): Repository root used as the file access boundary.
- `options.capability` (`string`): Capability identifier for evidence output.
- `options.graphPath` (`string`, optional): Graph JSON path. Defaults to `graphify-out/graph.json` under `repoRoot`.
- `options.reportPath` (`string`, optional): Graph report path. Defaults to `graphify-out/GRAPH_REPORT.md` under `repoRoot`.

If `graphPath` resolves outside `repoRoot`, graph context loading stops before reading graph content or writing evidence and returns `exitCode: 1` with the message `Invalid Graphify path outside repository root`.

When `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` exist, `gatherGraphContext` writes `.shipwright/evidence/<capability>.json` with `graphify.available: true`, the relative graph/report paths, and adds `Graphify context used` to `shipwright-report.md`.

When the same Graphify context is gathered again for a capability, the evidence records `graphify.deduplicated: true` and the report keeps a single `Graphify context used` entry for that capability.

When Graphify output is missing, `gatherGraphContext` writes fallback evidence with `graphify.available: false`, `graphify.skip_reason: "missing_graphify_output"`, and `profile_path: ".shipwright/repo-profile.json"`, then records `Graphify skipped: missing_graphify_output` in `shipwright-report.md`.

When `graphify-out/graph.json` exists but is malformed JSON, `gatherGraphContext` records fallback evidence with `graphify.skip_reason: "malformed_graph_json"` and continues with the lightweight profile path.

## Working Backwards API

### `continueWorkingBackwards(options)`

Continues the clarification flow before OpenSpec generation.

- `options.repoRoot` (`string`): Repository root used for generated files.
- `options.featureRequest` (`string`): User request being clarified.
- `options.allTopicsAnswered` (`boolean`): Whether all Working Backwards topics have clear answers.
- `options.confirmed` (`boolean`): Whether the user confirmed generation.
- `options.capabilities` (`string[]`, optional): Confirmed or proposed capability names.

When all topics have answers but `confirmed` is `false`, the function returns `status: "awaiting_confirmation"` and asks for PRD/OpenSpec confirmation without creating files under `openspec/specs/`.

When more clarification is needed, the function reads `.shipwright/repo-profile.json`, includes the detected repository mode in the assistant message, and asks no more than two questions in the turn.

### `generateOpenSpec(options)`

Writes an OpenSpec file for a confirmed capability.

- `options.repoRoot` (`string`): Repository root used for generated files.
- `options.capability` (`string`): Kebab-case capability name.
- `options.featureRequest` (`string`): Original user request to preserve as quoted context.
- `options.confirmed` (`boolean`): Whether the user confirmed generation.

The generator treats user feature text as untrusted input. Requests that look like prompt injection, such as attempts to override instructions or write secrets, are quoted as scenario context and recorded in evidence with `prompt_injection_detected: true`.

Generated files are written to `openspec/specs/<capability>/spec.md` and include the capability title, `## Requirements`, priority-tagged scenarios, and GIVEN/WHEN/THEN clauses.

Calling `generateOpenSpec` again with the same capability updates the same `spec.md` path and records `idempotent_write: true` in `.shipwright/evidence/<capability>.json`.

If the drafting dependency fails with a Codex timeout, the generator returns `workItemStatus: "Blocked"`, records `dependency: "Codex"` and `failure: "timeout"` in evidence, and returns the message `Spec generation blocked by Codex timeout` without leaving a `spec.md.tmp` file.

## Beads Task Graph API

### `createBeadsWorkItems(options)`

Creates traceable Beads work items from OpenSpec metadata.

- `options.repoRoot` (`string`): Repository root used as the metadata path boundary.
- `options.specPath` (`string`): OpenSpec file path.
- `options.capability` (`string`): Capability name.
- `options.requirement` (`string`): Requirement name.
- `options.scenarios` (`object[]`): Scenario metadata, including `name`, `priority`, and optional `evidence`.
- `options.createItem` (`function`, optional): Adapter used to create or update Beads items.

If a scenario evidence path resolves outside `repoRoot`, task creation stops before creating any Beads item and returns `exitCode: 1` with the message `Invalid evidence path outside repository root`.

For valid metadata, the function emits one epic with `shipwright.capability`, one requirement task with `shipwright.requirement`, and scenario subtasks with `shipwright.scenario`, `shipwright.priority`, `shipwright.spec`, and `shipwright.evidence`.

When `existingItems` already contains an item for the same `shipwright.capability` and `shipwright.spec`, task creation does not emit duplicate items and returns evidence with `deduplicated: true`.

If the Beads CLI is unavailable, task creation returns `exitCode: 1` with `Beads CLI not found` and stops before creating Sprint board cards or Beads items.

## Scenario Execution API

### `executeScenario(options)`

Executes an OpenSpec scenario and records evidence.

- `options.repoRoot` (`string`): Repository root used as the evidence path boundary.
- `options.scenario` (`string`): Scenario display name.
- `options.evidencePath` (`string`, optional): Evidence output path. Defaults to `.shipwright/evidence/<scenario-slug>.json`.

If `evidencePath` resolves outside `repoRoot`, scenario execution stops before writing evidence and returns `exitCode: 1`, `beadsStatus: "Blocked"`, and the message `Invalid evidence path outside repository root`.

For passing scenarios, `executeScenario` writes `.shipwright/evidence/<scenario-slug>.json` with `scenario_id`, `spec_path`, `beads_id`, `test_path`, `command_exit_code`, `verification_status: "passed"`, and `docs_updated`, then returns `beadsStatus: "Done"`.

When the evidence file already exists for the same scenario, `executeScenario` updates the same file, records `idempotent_rerun: true`, and returns the current matching Beads scenario count without creating duplicate work items.

If scenario implementation times out through Codex, `executeScenario` writes blocked evidence with `dependency: "Codex"`, `failure: "timeout"`, and `verification_status: "blocked"`, then returns `beadsStatus: "Blocked"` and `Scenario execution blocked by Codex timeout`.

## Report Readiness API

### `generateEvidenceReport(options)`

Generates `shipwright-report.md` and `shipwright-report.json` from local evidence files.

- `options.repoRoot` (`string`): Repository root containing `.shipwright/evidence/`.

Report generation redacts secret-looking token values such as `sk-...` before writing Markdown or JSON. Redacted values appear as `[REDACTED_SECRET]`, and the JSON report records the number of redactions.

The JSON report records `traceability_completeness: 100` when evidence entries exist and includes report entries with spec path, Beads ID, test path, evidence path, and risk. The Markdown report includes `What changed`, `How it was tested`, and `Residual risks` sections.

Re-running `generateEvidenceReport` overwrites the same report files, so Markdown sections and JSON entries are not duplicated for the same evidence set.

When `existingPullRequest` matches the current branch, report generation records `pr_deduplicated: true` and `pr_url` without calling the PR creation adapter.

When local Git metadata is available but GitHub PR creation fails because of a network problem, report generation still writes PR-ready local evidence. `shipwright-report.json` records `pr_created: false`, `pr_ready: true`, and `pr_failure: "github_network_failure"`, and the result message includes `GitHub unavailable; PR-ready evidence generated`.

For small hackathon repositories, `shipwright-report.json` includes `report_generation_duration_ms` as an integer so demo scripts can verify report generation stays below the 10 second demo budget.

## Sprint Board API

### `renderSprintBoard(options)`

Renders the local Sprint board as HTML.

- `options.items` (`object[]`): Beads-derived card records with `shipwright` metadata.

The board renders the fixed workflow columns `Clarify`, `Spec Ready`, `Ready`, `Writing Test`, `Implementing`, `Verifying`, `Docs`, `Done`, and `Blocked`. Cards include Beads-derived metadata fields for capability, scenario, priority, and linked OpenSpec path.

Card text is HTML-escaped before rendering so scenario titles such as `<script>...</script>` appear as visible text and cannot create executable script elements.

When a board refresh includes `repoRoot` and prior item state, `renderSprintBoard` writes `.shipwright/evidence/board-update.json` with `duration_ms` and places cards in a `data-column` that matches their current status, such as `Verifying`.

Board rendering de-duplicates refreshed Beads items by ID and renders each card with `data-beads-id`, so repeated reads of the same task state do not create duplicate cards.

### `startSprintBoard(options)`

Starts the local Sprint board UI.

- `options.repoRoot` (`string`): Repository root where fallback evidence is written.
- `options.startUi` (`function`, optional): UI process adapter used by callers and tests.

If the local UI process exits with a non-zero code, `startSprintBoard` writes `.shipwright/evidence/board-start.json` with `ui_available: false`, returns a message containing `Sprint board unavailable`, and reports `cliReportAvailable: true`.

### `renderCardDetail(options)`

Renders evidence details for a selected Sprint board card.

- `options.repoRoot` (`string`): Repository root used to resolve local evidence.
- `options.evidenceFile` (`string`): Evidence file path, such as `.shipwright/evidence/repository-context-profiling.json`.

The detail view reads local evidence and displays the linked test path, verification status, docs-updated flag, and OpenSpec path.
