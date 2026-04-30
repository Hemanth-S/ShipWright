# sprint-board-visualization Specification

## Purpose
Render the local Sprint board over OpenSpec and Beads state. This capability exists so judges and reviewers can see progress, gates, evidence, and risk without reading raw files first.

## Codebase references
- Tables/collections: none; board state is derived from Beads metadata, OpenSpec files, and local evidence files.
- APIs called or extended: none; no HTTP API paths exist in the PRD or repository.
- Services/modules reused: Beads CLI as the task state source, OpenSpec files under `openspec/specs/`, and evidence files under `.shipwright/evidence/`.
- New schema required: none beyond Beads `shipwright` metadata and `.shipwright/evidence/*.json` artifacts.

## Requirements

### Requirement: Render Sprint Board Columns And Cards
The system SHALL display a local Sprint board with the columns and card fields required by the PRD.

#### Scenario: Display Required Board Columns And Card Fields [P1]
- GIVEN Beads contains one item with `shipwright.capability=repository-context-profiling`, `shipwright.requirement=Produce Lightweight Repository Profile`, `shipwright.scenario=Classify Current Repository As Greenfield`, `shipwright.priority=P1`, and `shipwright.type=happy path`
- WHEN the Sprint board renders
- THEN the board displays exactly these column labels: `Clarify`, `Spec Ready`, `Ready`, `Writing Test`, `Implementing`, `Verifying`, `Docs`, `Done`, and `Blocked`
- AND the card displays `repository-context-profiling`
- AND the card displays `Classify Current Repository As Greenfield`
- AND the card displays `P1`
- AND the card displays `openspec/specs/repository-context-profiling/spec.md`

#### Scenario: Escape Malicious Card Text [P0]
- GIVEN Beads contains a scenario title `<script>window.shipwrightInjected=true</script>`
- WHEN the Sprint board renders the card
- THEN the visible card text contains `<script>window.shipwrightInjected=true</script>`
- AND the browser global value `window.shipwrightInjected` is not `true`
- AND the rendered DOM contains zero executable `script` elements created from the scenario title

#### Scenario: Refresh Board Without Duplicate Cards [P1]
- GIVEN the Sprint board displays one card for Beads item `shipwright.scenario=Classify Current Repository As Greenfield`
- WHEN the board refreshes from the same Beads and OpenSpec state
- THEN the board still displays exactly one card for `Classify Current Repository As Greenfield`
- AND the board does not create a second card with the same Beads ID

#### Scenario: Continue CLI Workflow When Board Cannot Start [P2]
- GIVEN Beads and OpenSpec files exist for capability `repository-context-profiling`
- AND the local UI process exits with code `1`
- WHEN Shipwright starts the Sprint board
- THEN the user-visible message contains `Sprint board unavailable`
- AND CLI report generation remains available
- AND `.shipwright/evidence/board-start.json` contains `"ui_available":false`

#### Scenario: Render Board Update Within Demo Budget [P1]
- GIVEN one Beads item changes status from `Writing Test` to `Verifying`
- WHEN the Sprint board receives the local state update
- THEN the card appears in the `Verifying` column in less than `1000` milliseconds
- AND `.shipwright/evidence/board-update.json` records `duration_ms` as an integer less than `1000`

### Requirement: Render Card Detail Evidence
The system SHALL display requirement, scenario, diff, test, verification, docs, and risk details for a selected card.

#### Scenario: Display Completed Card Detail [P1]
- GIVEN `.shipwright/evidence/repository-context-profiling.json` contains `test_path=test/repository-context-profiling.test.ts`, `verification_status=passed`, and `docs_updated=true`
- WHEN the user opens the card detail for `Classify Current Repository As Greenfield`
- THEN the detail view displays `test/repository-context-profiling.test.ts`
- AND the detail view displays `verification_status=passed`
- AND the detail view displays `docs_updated=true`
- AND the detail view displays the linked spec path `openspec/specs/repository-context-profiling/spec.md`
