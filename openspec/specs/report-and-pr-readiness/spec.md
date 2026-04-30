# report-and-pr-readiness Specification

## Purpose
Generate human-readable and machine-readable evidence reports, then create or prepare a GitHub PR. This capability exists so reviewers can understand what changed, why, how it was tested, and what risks remain.

## Codebase references
- Tables/collections: none; report data is read from local files and external CLI state.
- APIs called or extended: GitHub PRs external service; the PRD does not specify a REST method or path.
- Services/modules reused: local Git for branch, remote, changed files, commits, and diffs; GitHub for PR creation when credentials and network are available; evidence files under `.shipwright/evidence/`; OpenSpec files under `openspec/specs/`; Beads CLI metadata.
- New schema required: `shipwright-report.md` and `shipwright-report.json`.

## Requirements

### Requirement: Generate Evidence Reports
The system SHALL write both Markdown and JSON reports with traceability from requirement to task, test, evidence, and risk.

#### Scenario: Generate Reports With Complete Traceability [P1]
- GIVEN one demo requirement has linked `spec=openspec/specs/repository-context-profiling/spec.md`, one Beads item, one test path, one evidence artifact, and one report entry
- WHEN Shipwright generates the final report
- THEN `shipwright-report.md` exists
- AND `shipwright-report.json` exists
- AND `shipwright-report.json` contains `traceability_completeness=100`
- AND `shipwright-report.md` contains `What changed`
- AND `shipwright-report.md` contains `How it was tested`
- AND `shipwright-report.md` contains `Residual risks`

#### Scenario: Redact Secrets From Reports [P0]
- GIVEN `.shipwright/evidence/secret-test.json` contains `OPENAI_API_KEY=sk-test-secret-value`
- WHEN Shipwright generates `shipwright-report.md` and `shipwright-report.json`
- THEN neither report contains `sk-test-secret-value`
- AND `shipwright-report.json` contains `"redactions":1`
- AND `shipwright-report.md` contains `[REDACTED_SECRET]`

#### Scenario: Re-generate Reports Without Duplicate Sections [P1]
- GIVEN `shipwright-report.md` and `shipwright-report.json` already exist for the same evidence set
- WHEN Shipwright generates the final report a second time
- THEN `shipwright-report.md` contains exactly one `## Requirements Implemented` heading
- AND `shipwright-report.md` contains exactly one `## Residual Risks` heading
- AND `shipwright-report.json` contains one entry for `openspec/specs/repository-context-profiling/spec.md`

#### Scenario: Produce PR-Ready Fallback When GitHub Is Unavailable [P2]
- GIVEN local Git can read branch, commit, remote, and changed files
- AND GitHub PR creation fails with network failure
- WHEN Shipwright runs the PR readiness step
- THEN `shipwright-report.json` contains `"pr_created":false`
- AND `shipwright-report.json` contains `"pr_ready":true`
- AND `shipwright-report.json` contains `"pr_failure":"github_network_failure"`
- AND the user-visible message contains `GitHub unavailable; PR-ready evidence generated`

#### Scenario: Do Not Create Duplicate GitHub PR [P1]
- GIVEN GitHub already has an open PR for the current branch
- WHEN Shipwright runs the PR creation step a second time for the same branch
- THEN no second GitHub PR is created
- AND `shipwright-report.json` contains `"pr_deduplicated":true`
- AND `shipwright-report.json` contains the existing PR URL

#### Scenario: Generate Reports Within Demo Budget [P1]
- GIVEN `.shipwright/evidence/` contains evidence for one demo requirement
- WHEN Shipwright generates `shipwright-report.md` and `shipwright-report.json`
- THEN report generation completes in less than `10000` milliseconds
- AND `shipwright-report.json` contains `report_generation_duration_ms` as an integer less than `10000`
