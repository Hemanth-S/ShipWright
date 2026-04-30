# repository-context-profiling Specification

## Purpose
Build a lightweight repository profile before clarification or spec generation. This capability exists so Shipwright can distinguish greenfield and brownfield repositories without reading unnecessary implementation details.

## Codebase references
- Tables/collections: none; this repository has no database schema.
- APIs called or extended: none; no API routes exist in the PRD or repository.
- Services/modules reused: none; no source modules exist yet.
- New schema required: `.shipwright/repo-profile.json` containing repository root, mode, discovered docs, discovered package/build files, discovered tests, discovered routes, discovered schemas, and discovered environment variable references.

## Requirements

### Requirement: Produce Lightweight Repository Profile
The system SHALL scan only lightweight repository artifacts before asking clarification questions.

#### Scenario: Classify Current Repository As Greenfield [P1]
- GIVEN `/Users/hemanth/ShipWright` contains `.git/` and `prd-spec-to-pr.md`
- AND no `README.md`, `package.json`, `src/`, `app/`, `api/`, `routes/`, `schemas/`, or `migrations/` path exists
- WHEN Shipwright profiles repository root `/Users/hemanth/ShipWright`
- THEN `.shipwright/repo-profile.json` contains `"mode":"greenfield"`
- AND `.shipwright/repo-profile.json` contains `"docs":["prd-spec-to-pr.md"]`
- AND `.shipwright/repo-profile.json` contains `"routes":[]`
- AND `.shipwright/repo-profile.json` contains `"schemas":[]`

#### Scenario: Do Not Read Deep Service Files During Initial Profile [P0]
- GIVEN repository root `/Users/hemanth/ShipWright` contains a future file `src/private/service.ts`
- WHEN Shipwright performs the initial lightweight profile
- THEN `.shipwright/repo-profile.json` does not contain the contents of `src/private/service.ts`
- AND `.shipwright/repo-profile.json` records at most the path `src/private/service.ts`
- AND the profile result records `deep_scan=false`

#### Scenario: Re-run Profile Without Duplicate Artifacts [P1]
- GIVEN `.shipwright/repo-profile.json` already exists with `repo_root=/Users/hemanth/ShipWright`
- WHEN Shipwright profiles repository root `/Users/hemanth/ShipWright` again without file changes
- THEN exactly one file exists at `.shipwright/repo-profile.json`
- AND the second profile has the same `mode`, `docs`, `routes`, and `schemas` values as the first profile
- AND no file matching `.shipwright/repo-profile-*.json` is created

#### Scenario: Continue When Local Git Metadata Is Unavailable [P2]
- GIVEN repository root `/Users/hemanth/ShipWright` can be read
- AND the local Git command for branch or remote metadata exits with code `1`
- WHEN Shipwright profiles repository root `/Users/hemanth/ShipWright`
- THEN `.shipwright/repo-profile.json` contains `"git_available":false`
- AND `.shipwright/repo-profile.json` contains `"mode":"greenfield"`
- AND the profile result includes the warning `Git metadata unavailable`

#### Scenario: Complete Lightweight Profile Within Demo Budget [P1]
- GIVEN `/Users/hemanth/ShipWright` contains only `.git/` and `prd-spec-to-pr.md`
- WHEN Shipwright profiles repository root `/Users/hemanth/ShipWright`
- THEN profiling completes in less than `30000` milliseconds
- AND `.shipwright/repo-profile.json` contains `duration_ms` as an integer less than `30000`

### Requirement: Respect Repository Boundary
The system SHALL reject profiling targets outside the selected repository root.

#### Scenario: Reject Profile Outside Repository Root [P0]
- GIVEN Shipwright selected repository root `/Users/hemanth/ShipWright`
- WHEN profiling is requested for `/Users/hemanth`
- THEN profiling exits with code `1`
- AND no `.shipwright/repo-profile.json` is written under `/Users/hemanth`
- AND the user-visible message contains `Refusing to profile outside repository root`
