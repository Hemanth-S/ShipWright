# beads-task-graph Specification

## Purpose
Create Beads epics, tasks, and subtasks from OpenSpec requirements and scenarios. This capability exists to make the implementation workflow visible, ordered, and traceable.

## Codebase references
- Tables/collections: none; task state is stored by Beads CLI, not by an application database.
- APIs called or extended: none; no HTTP API paths exist in the PRD or repository.
- Services/modules reused: Beads CLI as an external local dependency.
- New schema required: structured `shipwright` metadata in Beads item descriptions with `spec`, `capability`, `requirement`, `scenario`, `type`, `priority`, `test`, and `evidence` fields.

## Requirements

### Requirement: Create Traceable Beads Work Items
The system SHALL create Beads work items linked to OpenSpec capabilities, requirements, scenarios, tests, and evidence artifacts.

#### Scenario: Create Epic And Scenario Tasks [P1]
- GIVEN `openspec/specs/repository-context-profiling/spec.md` contains capability `repository-context-profiling`
- AND the spec contains requirement `Produce Lightweight Repository Profile`
- AND the spec contains scenario `Classify Current Repository As Greenfield [P1]`
- WHEN Shipwright creates Beads work items for the spec
- THEN one Beads epic is created with `shipwright.capability=repository-context-profiling`
- AND at least one Beads task is created with `shipwright.requirement=Produce Lightweight Repository Profile`
- AND at least one Beads subtask or task is created with `shipwright.scenario=Classify Current Repository As Greenfield`
- AND the scenario work item contains `shipwright.spec=openspec/specs/repository-context-profiling/spec.md`

#### Scenario: Reject Metadata Paths Outside Repository [P0]
- GIVEN an OpenSpec scenario contains requested evidence path `../evidence/outside.json`
- WHEN Shipwright creates Beads metadata for that scenario
- THEN Beads task creation exits with code `1`
- AND no Beads item contains `../evidence/outside.json`
- AND the user-visible message contains `Invalid evidence path outside repository root`

#### Scenario: Re-run Beads Creation Without Duplicate Tasks [P1]
- GIVEN Beads already contains a work item with `shipwright.capability=repository-context-profiling`
- AND that work item references `openspec/specs/repository-context-profiling/spec.md`
- WHEN Shipwright creates Beads work items for the same spec a second time
- THEN the existing Beads item is updated instead of duplicated
- AND the total count of Beads items with `shipwright.capability=repository-context-profiling` remains unchanged
- AND the creation evidence records `deduplicated=true`

#### Scenario: Stop When Beads CLI Is Missing [P2]
- GIVEN the Beads CLI executable is not available on `PATH`
- WHEN Shipwright creates Beads work items for `openspec/specs/repository-context-profiling/spec.md`
- THEN task creation exits with code `1`
- AND no Sprint board card is created for the spec
- AND the user-visible message contains `Beads CLI not found`
- AND the message does not include a stack trace line beginning with `at `

<!-- TODO: clarify - missing performance scenario because the PRD defines that Beads creation latency must be emitted as a metric, but it does not define a numeric Beads creation latency target. -->
