# scenario-execution-evidence Specification

## Purpose
Execute at least one OpenSpec scenario through failing test, implementation, verification, documentation update, and evidence capture. This capability exists to prove that Shipwright is a trust workflow, not only a planning tool.

## Codebase references
- Tables/collections: none; this repository has no database schema.
- APIs called or extended: none; no HTTP API paths exist in the PRD or repository.
- Services/modules reused: Codex for implementation assistance, local Git for changed files and diffs, OpenSpec files under `openspec/specs/`, and Beads CLI for work item status.
- New schema required: `.shipwright/evidence/<scenario-id>.json` containing scenario ID, spec path, Beads ID, test path, command, exit status, output summary, changed files, documentation updates, verification status, and residual risks.

## Requirements

### Requirement: Execute Scenario Chain
The system SHALL execute at least one scenario through test creation, implementation, verification, and documentation update.

#### Scenario: Capture Passing Scenario Evidence [P1]
- GIVEN Beads item `shipwright.scenario=Classify Current Repository As Greenfield` links to `openspec/specs/repository-context-profiling/spec.md`
- WHEN Shipwright executes the scenario
- THEN `.shipwright/evidence/classify-current-repository-as-greenfield.json` exists
- AND the evidence contains `test_path` with a non-empty string value
- AND the evidence contains `command_exit_code=0`
- AND the evidence contains `verification_status=passed`
- AND the evidence contains `docs_updated=true`
- AND the related Beads item status is `Done`

#### Scenario: Reject Scenario Evidence Path Outside Repository [P0]
- GIVEN a Beads item contains `shipwright.evidence=../../outside.json`
- WHEN Shipwright executes the linked scenario
- THEN scenario execution exits with code `1`
- AND no file is written to `/Users/hemanth/outside.json`
- AND the user-visible message contains `Invalid evidence path outside repository root`
- AND the related Beads item status is `Blocked`

#### Scenario: Re-run Scenario Without Duplicate Side Effects [P1]
- GIVEN `.shipwright/evidence/classify-current-repository-as-greenfield.json` already exists with `scenario_id=classify-current-repository-as-greenfield`
- AND the related Beads item status is `Done`
- WHEN Shipwright executes the same scenario again with the same spec content hash
- THEN exactly one evidence file exists at `.shipwright/evidence/classify-current-repository-as-greenfield.json`
- AND the evidence contains `idempotent_rerun=true`
- AND the count of Beads items with `shipwright.scenario=Classify Current Repository As Greenfield` remains unchanged

#### Scenario: Mark Scenario Blocked When Codex Times Out [P2]
- GIVEN Codex times out while implementing scenario `Classify Current Repository As Greenfield`
- WHEN Shipwright records scenario execution evidence
- THEN `.shipwright/evidence/classify-current-repository-as-greenfield.json` contains `dependency=Codex`
- AND the evidence contains `failure=timeout`
- AND the evidence contains `verification_status=blocked`
- AND the related Beads item status is `Blocked`
- AND the user-visible message contains `Scenario execution blocked by Codex timeout`

<!-- TODO: clarify - missing performance scenario because the PRD requires end-to-end testing before recording, but it does not define a numeric scenario execution latency target. -->
