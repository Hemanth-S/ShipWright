# Spec To PR PRD

## Problem Statement

Solo builders and engineering reviewers can ask AI coding agents to produce code quickly, but they still lack a trustworthy trail from vague intent to reviewed change. Shipwright solves this by turning a feature request into a repo-grounded spec, Beads task graph, Sprint board, verified implementation evidence, and PR-ready report so both the builder and reviewer can see what changed, why, how it was tested, and what risks remain.

## Goals

- Demonstrate one end-to-end local Shipwright run for a single user on one machine.
- Convert one vague software request into an OpenSpec capability with traceable requirements and scenarios.
- Create Beads work items linked to the OpenSpec requirement and scenario metadata.
- Display a Sprint board where at least one task visibly moves through clarification, spec, work, verification, and done states.
- Execute at least one scenario through test creation, implementation, verification, and documentation update.
- Produce `shipwright-report.md` and `shipwright-report.json` with 100% traceability for demo requirements, tasks, evidence, and residual risks.
- Enable a reviewer to answer "what changed, why, how it was tested, and what risks remain" from `shipwright-report.md` in under 2 minutes.

## Non-Goals

- Multi-user SaaS, cloud hosting, team accounts, or app-level login.
- Production-grade failure recovery for Codex, Beads, GitHub, or Graphify during the hackathon demo.
- Support for every programming language, framework, package manager, test runner, or repository layout.
- Full replacement of GitHub, Linear, Jira, Beads, OpenSpec, or Codex.
- A general-purpose app generator that ignores an existing repository's conventions.
- Complete automated proof of production readiness without human review.
- Large-repository graph optimization beyond the minimum Graphify integration needed for the demo.

## Stack & External Dependencies

| Dependency | Type | Purpose | Hackathon Usage |
| --- | --- | --- | --- |
| TypeScript CLI | Framework | Provides the local command surface for initialization, scanning, orchestration, and report generation. | MVP implementation surface. <!-- ASSUMPTION: Existing source requirements recommended a TypeScript CLI, but no implementation exists yet — validate with team --> |
| React + Vite local UI | Framework | Renders the Sprint board and task detail view. | Local browser demo UI. <!-- ASSUMPTION: Existing source requirements recommended a React or Vite UI, but no implementation exists yet — validate with team --> |
| Codex | External agent system | Performs codebase understanding, clarification, spec drafting, implementation, test writing, review, and evidence summarization. | Required demo integration. |
| Beads CLI | External local CLI | Stores epics, tasks, subtasks, dependencies, and status transitions. | Required demo integration. |
| OpenSpec files | Local file format | Stores capability specs, requirements, and scenarios. | Required source of truth for requirements. |
| Local Git | Local system | Tracks changed files, commits, diffs, and branch state. | Required evidence source. |
| GitHub PRs | External service | Publishes or prepares reviewable pull requests. | Required integration when local GitHub credentials are available. <!-- ASSUMPTION: The demo machine will already have usable GitHub credentials, because the chosen security model uses existing local credentials — validate with team --> |
| Graphify | External/local knowledge graph tool | Provides graph-derived codebase context when available. | Required minimal integration: detect and consume graph output, or record a skip reason. <!-- ASSUMPTION: The hackathon MVP can satisfy "Graphify integration" by detecting/reading existing Graphify output instead of building a full graph workflow — validate with team --> |
| `.shipwright/` local directory | Local storage | Stores evidence, run metadata, summaries, logs, and report inputs. | Required local persistence. |

## Customer Experience

The demo starts with a local repository and a vague feature request entered into Shipwright. The user runs a local Shipwright command, answers one or two focused clarification questions, and sees Shipwright write an OpenSpec capability, create Beads tasks, and open a Sprint board. The board shows cards moving through `Clarify`, `Spec Ready`, `Ready`, `Writing Test`, `Implementing`, `Verifying`, `Docs`, and `Done`. The user opens a completed card to see the original intent, linked OpenSpec scenario, Beads metadata, test path, verification result, related diff, documentation update, and residual risks. The demo ends with `shipwright-report.md` and `shipwright-report.json`, and optionally a GitHub PR, showing the trace from request to reviewed change. <!-- ASSUMPTION: Exact command names and screen labels will be finalized during implementation; the PRD uses the workflow surface from the existing requirements document — validate with team -->

## Functional Requirements

- FR-1: The system SHALL initialize Shipwright in a local Git repository and create any required local directories and config files.
- FR-2: The system SHALL classify the repository as greenfield or brownfield using a lightweight scan of top-level files, README files, project docs, package/build config, tests, routes, schemas, and environment usage.
- FR-3: The system SHALL ask no more than two clarification questions per turn before generating a spec.
- FR-4: The system SHALL reference concrete repository facts in clarification questions when brownfield evidence exists.
- FR-5: The system SHALL write an OpenSpec capability file for the requested feature with requirements, scenarios, and explicit assumption comments.
- FR-6: The system SHALL create a Beads epic for the OpenSpec capability.
- FR-7: The system SHALL create Beads tasks or subtasks for each OpenSpec requirement or scenario required by the demo path.
- FR-8: The system SHALL store structured `shipwright` metadata in Beads item descriptions, including spec path, capability, requirement ID, scenario ID, priority, type, test path, and evidence path.
- FR-9: The system SHALL render a local Sprint board with columns for `Clarify`, `Spec Ready`, `Ready`, `Writing Test`, `Implementing`, `Verifying`, `Docs`, `Done`, and `Blocked`.
- FR-10: Each Sprint board card SHALL display the Beads ID, requirement title, scenario title, priority, scenario type, linked OpenSpec path, current status, and current gate result.
- FR-11: Each Sprint board card detail view SHALL display original user intent, OpenSpec acceptance criteria, Beads metadata, test file path when available, related code diff, test command summary, verification result, documentation updates, and open risks.
- FR-12: The system SHALL execute at least one scenario through the chain `write failing test -> implement -> verify acceptance criteria -> update docs`.
- FR-13: The system SHALL run the relevant test command for the implemented scenario and capture command, exit status, and summarized output.
- FR-14: The system SHALL update user-facing documentation when the implemented scenario changes public behavior.
- FR-15: The system SHALL read local Git state to include changed files and diff summaries in the evidence report.
- FR-16: The system SHALL create a GitHub PR when credentials and network access are available, or record a PR-ready fallback with branch, commit, changed files, and report paths. <!-- ASSUMPTION: Creating a real PR may be optional in the recorded demo if timing is tight — validate with team -->
- FR-17: The system SHALL detect Graphify output at `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` when present and include relevant graph context in card detail and evidence reports.
- FR-18: If Graphify output is absent, the system SHALL record an explicit Graphify skip reason and continue using the MVP repository scan.
- FR-19: The system SHALL write `shipwright-report.md` for human review.
- FR-20: The system SHALL write `shipwright-report.json` with machine-readable links among specs, Beads IDs, scenarios, tests, commands, gate results, and evidence artifacts.
- FR-21: The system SHALL calculate traceability completeness as the percentage of demo requirements with linked spec, Beads item, test or skip reason, evidence artifact, and report entry.

## Non-Functional Requirements

- NFR-PERF: For the recorded demo path on a small repository, initialization plus lightweight scan SHALL complete in under 30 seconds, board updates SHALL render in under 1 second after local state changes, and report generation SHALL complete in under 10 seconds. <!-- ASSUMPTION: These thresholds are appropriate for a single-user recorded hackathon demo on a small repo — validate with team -->
- NFR-AVAIL: The hackathon demo SHALL optimize for a pre-recorded single-user run and does not require production uptime or automated retry systems.
- NFR-SCALE: The MVP SHALL support one local user operating on one repository at a time. The realistic next step SHALL be 5 pilot users running Shipwright independently on local repositories. <!-- ASSUMPTION: Five pilot users is a reasonable post-hackathon next step; the user only specified single-user demo scale — validate with team -->
- NFR-SEC: The MVP SHALL be local-only with no app-level login, SHALL rely on existing local Codex, Git, GitHub, Beads, and Graphify credentials, SHALL load secrets only from the local environment or existing credential stores, and SHALL NOT commit secrets to source control.

## Security & Compliance

### Threat Model

| Threat | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Malformed feature request, file path, or repo input causes unsafe file access. | Medium | High | Validate paths against the current repository root; reject path traversal and absolute writes outside allowed project directories. |
| A user runs Shipwright against the wrong repository. | Medium | Medium | Display repository root, current Git branch, and remote before execution; include them in the report. |
| Local credentials or API keys are written to reports, logs, or commits. | Medium | High | Never print environment values; redact common secret patterns; add a DoD check for no secrets in source. |
| No app-level auth allows another local user to operate Shipwright. | Low | Medium | MVP is intentionally local-only and inherits the operating system user boundary. |
| Codex prompt injection from repository files influences generated actions. | Medium | High | Treat repository content as untrusted context; require explicit user confirmation before final spec generation and PR creation. <!-- ASSUMPTION: Implementation will include confirmation gates around high-impact actions — validate with team --> |
| Sensitive repo content appears in local logs or evidence. | Medium | Medium | Store evidence locally only; do not upload logs except through user-authorized GitHub PR/report workflows. |
| Graphify output contains stale or misleading code relationships. | Medium | Medium | Mark graph context with source path and generation time when available; fall back to direct file scan for the active feature area. <!-- ASSUMPTION: Graphify artifacts include enough metadata to identify freshness, or Shipwright can record "unknown" — validate with team --> |
| GitHub PR creation exposes unfinished demo changes. | Low | Medium | Create PR only from the selected branch after report generation; otherwise record PR-ready evidence. |

### Data Classification

Shipwright stores local specs, Beads metadata, evidence artifacts, reports, logs, Graphify outputs, Codex run summaries, Git diff summaries, and command results. This data is classified as local project data and may include source code snippets, repository metadata, and implementation evidence. The MVP does not intentionally process payment data, government IDs, health data, or other regulated personal data. No content is explicitly excluded from local logs for the hackathon, except secrets and credential values, which must be redacted or omitted.

Retention is local and repository-scoped. `.shipwright/` artifacts remain until the user deletes them. <!-- ASSUMPTION: No automatic retention cleanup is required for the hackathon MVP — validate with team -->

### Authentication & Authorization

The MVP uses no Shipwright-specific authentication. Authorization is the local machine and operating system user boundary, plus existing local credentials for Codex, Git, GitHub, Beads, and Graphify. This is intentional for the hackathon and must be stated in the report.

## Operational Requirements

### Metrics to emit

- Critical path latency: initialization, scan, spec generation, Beads creation, first board render, test run, report generation.
- Error rate by dependency: Codex, Beads CLI, OpenSpec file writes, local Git, GitHub, Graphify, UI.
- Traceability completeness: percentage of demo requirements with linked spec, Beads item, test or skip reason, evidence artifact, and report entry.
- Trust review time: whether a reviewer can answer "what changed, why, how tested, and what risks remain" from `shipwright-report.md` in under 2 minutes.

### Failure handling during the demo

- If Codex or an LLM API rate-limits, the MVP MAY mark the task as `Blocked` and use the last successful local evidence artifact for the pre-recorded demo. <!-- ASSUMPTION: A last-successful artifact will exist before recording starts — validate with team -->
- If Beads CLI is missing or returns an error, the MVP SHALL stop task creation and show the exact setup failure without stack traces.
- If GitHub is unavailable, the MVP SHALL skip PR creation and produce PR-ready local evidence.
- If Graphify is unavailable, the MVP SHALL record an explicit skip reason and continue with lightweight repository scan context.
- The manual fallback for the hackathon is the pre-recorded successful run plus committed sample reports. <!-- ASSUMPTION: Sample reports will be committed or otherwise available before judging — validate with team -->

## Failure Modes

| Dependency | Failure scenario | Detection | Degraded behavior | Recovery |
| --- | --- | --- | --- | --- |
| Codex | Agent request fails, times out, or rate-limits. | Non-zero command/API status or timeout. | Mark active work item `Blocked`; preserve prior evidence. | Retry after limit clears or continue with pre-recorded successful run. |
| Beads CLI | CLI not installed or task creation fails. | Missing binary or non-zero exit. | Stop workflow before board execution; show setup error. | Install/configure Beads and rerun initialization. |
| OpenSpec files | Spec write fails. | File write error. | Stop before task creation; show path and permission issue without stack trace. | Fix local permissions and rerun spec generation. |
| Local Git | Repository missing, dirty state unexpected, or commit diff cannot be read. | Git command failure. | Continue only if report can record Git unavailable; otherwise block PR evidence. | Initialize/fix repo and rerun verification. |
| GitHub | Network, auth, or remote failure prevents PR creation. | Push or PR command failure. | Produce PR-ready local report without remote PR URL. | Authenticate, restore network, and rerun PR step. |
| Graphify | Graph output missing, malformed, or stale. | Missing files, parse failure, or freshness metadata unavailable. | Record skip reason and use lightweight scan. | Regenerate Graphify output and rerun context step. |
| Local UI | Sprint board cannot start or render. | Dev server failure or browser error. | Continue CLI workflow and generate report. | Fix UI issue and reload board from local state. |

## Definition of Done

- [ ] All FRs implemented and demoable.
- [ ] One full demo path runs successfully on the demo machine.
- [ ] Critical path tested end-to-end at least once before recording.
- [ ] Traceability completeness is 100% for demo requirements.
- [ ] A reviewer can answer what changed, why, how tested, and what risks remain from `shipwright-report.md` in under 2 minutes.
- [ ] No secrets in source; all credentials come from env or existing local credential stores.
- [ ] Inputs validated; errors do not leak stack traces or internal paths beyond necessary project-relative paths.
- [ ] Demo script written and rehearsed.
- [ ] Fallback plan exists if a live dependency fails mid-demo.
- [ ] `shipwright-report.md` and `shipwright-report.json` are generated.
- [ ] GitHub PR is created, or PR-ready fallback evidence is recorded with an explicit reason.

## Open Questions

- What exact CLI commands should the MVP expose for initialize, run, board, verify, report, and PR creation?
- Should the recorded demo create a real GitHub PR, or stop at a PR-ready local report to reduce timing risk?
- What demo repository and feature request should be used for the recording?
- Should Graphify be run during the recording, or should precomputed `graphify-out/` artifacts be included to reduce timing risk?
- Which OpenSpec directory layout should Shipwright generate?
- Which Beads fields are available for structured metadata without brittle parsing?
- What minimum UI polish is required for judges to understand the board in under 30 seconds?
- Should `.shipwright/` evidence be committed to the demo repository, ignored by default, or selectively attached to the PR?

## Extension Ideas

- Model routing: split ShipWright tasks across models by risk and cost; use a stronger, more expensive model for planning, design, task breakdown, final review, and recovery, then use cheaper/lighter models for bounded implementation tasks with explicit file scope and acceptance checks.
- Caveman mode: offer an ultra-terse agent communication mode that uses compressed, simplified wording to reduce token usage where nuance is not needed.
- Graphify context compression: use a repository knowledge graph to select only the most relevant files, symbols, and dependency paths for a task, reducing prompt size while preserving codebase grounding.
