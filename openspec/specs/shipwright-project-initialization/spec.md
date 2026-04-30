# shipwright-project-initialization Specification

## Purpose
Initialize Shipwright inside a local Git repository so later capabilities can store specs, evidence, reports, and local run metadata in predictable paths. This capability exists to create the local foundation for a single-user hackathon demo.

## Codebase references
- Tables/collections: none; this is a greenfield local-file workflow.
- APIs called or extended: none; no HTTP API paths exist in the PRD or repository.
- Services/modules reused: none; no source modules exist yet.
- New schema required: `.shipwright/` local directory, `.shipwright/evidence/` local directory, OpenSpec output under `openspec/specs/`, and local run metadata for repository root, branch, and remote.

## Requirements

### Requirement: Initialize Local Shipwright Workspace
The system SHALL initialize Shipwright in a local Git repository and create the local directories required for specs, evidence, and reports.

#### Scenario: Create Initial Workspace [P1]
- GIVEN `/Users/hemanth/ShipWright` is a Git repository with remote `https://github.com/Hemanth-S/ShipWright.git`
- WHEN Shipwright is invoked to initialize repository root `/Users/hemanth/ShipWright`
- THEN the directory `/Users/hemanth/ShipWright/.shipwright/` exists
- AND the directory `/Users/hemanth/ShipWright/.shipwright/evidence/` exists
- AND the directory `/Users/hemanth/ShipWright/openspec/specs/` exists
- AND the initialization result records `repo_root=/Users/hemanth/ShipWright`, `remote=https://github.com/Hemanth-S/ShipWright.git`, and `mode=local-only`

#### Scenario: Reject Repository Path Traversal [P0]
- GIVEN Shipwright is running from repository root `/Users/hemanth/ShipWright`
- WHEN initialization is requested with target path `/Users/hemanth/ShipWright/../.shipwright`
- THEN the initialization exits with code `1`
- AND no directory is created at `/Users/hemanth/.shipwright`
- AND the user-visible message contains `Refusing to write outside repository root`

#### Scenario: Re-run Initialization Without Duplicate Side Effects [P1]
- GIVEN `/Users/hemanth/ShipWright/.shipwright/` and `/Users/hemanth/ShipWright/openspec/specs/` already exist from a previous successful initialization
- WHEN Shipwright is invoked to initialize repository root `/Users/hemanth/ShipWright` a second time with the same inputs
- THEN the initialization exits with code `0`
- AND exactly one `.shipwright` directory exists under `/Users/hemanth/ShipWright`
- AND exactly one `openspec/specs` directory exists under `/Users/hemanth/ShipWright`
- AND the initialization result records `created=false`

#### Scenario: Report Workspace Write Permission Failure [P2]
- GIVEN `/Users/hemanth/ShipWright` is a Git repository
- AND the operating system denies writes to `/Users/hemanth/ShipWright/.shipwright/`
- WHEN Shipwright is invoked to initialize repository root `/Users/hemanth/ShipWright`
- THEN the initialization exits with code `1`
- AND the user-visible message contains `Cannot write Shipwright workspace`
- AND the message includes project-relative path `.shipwright/`
- AND the message does not include a stack trace line beginning with `at `

#### Scenario: Initialize Small Repository Within Demo Budget [P1]
- GIVEN `/Users/hemanth/ShipWright` contains only `.git/` and `prd-spec-to-pr.md`
- WHEN Shipwright is invoked to initialize repository root `/Users/hemanth/ShipWright`
- THEN initialization plus lightweight repository scan completes in less than `30000` milliseconds
- AND the initialization result records `duration_ms` as an integer less than `30000`
