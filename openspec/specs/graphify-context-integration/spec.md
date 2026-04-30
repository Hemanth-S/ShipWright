# graphify-context-integration Specification

## Purpose
Use Graphify repository knowledge graph output when it exists, and fall back to lightweight repository profiling when it does not. This capability exists to provide graph-derived context without blocking the hackathon MVP.

## Codebase references
- Tables/collections: none; Graphify output is read from local files.
- APIs called or extended: none; no HTTP API paths exist in the PRD or repository.
- Services/modules reused: Graphify output at `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md`, plus the MVP lightweight repository scan.
- New schema required: graph context entries in `.shipwright/evidence/<scenario-id>.json` and report summaries in `shipwright-report.md` and `shipwright-report.json`.

## Requirements

### Requirement: Detect And Use Graphify Output
The system SHALL detect Graphify output when available and include relevant graph context in board details and evidence reports.

#### Scenario: Include Graph Context When Files Exist [P1]
- GIVEN `graphify-out/graph.json` exists
- AND `graphify-out/GRAPH_REPORT.md` exists
- WHEN Shipwright gathers context for capability `repository-context-profiling`
- THEN `.shipwright/evidence/repository-context-profiling.json` contains `graphify.available=true`
- AND the evidence contains `graphify.graph_path=graphify-out/graph.json`
- AND the evidence contains `graphify.report_path=graphify-out/GRAPH_REPORT.md`
- AND `shipwright-report.md` contains `Graphify context used`

#### Scenario: Reject Graph Paths Outside Repository [P0]
- GIVEN Graphify context points to `/Users/hemanth/graphify-out/graph.json`
- WHEN Shipwright gathers graph context for repository root `/Users/hemanth/ShipWright`
- THEN graph context loading exits with code `1`
- AND no graph content from `/Users/hemanth/graphify-out/graph.json` is written to `.shipwright/evidence/`
- AND the user-visible message contains `Invalid Graphify path outside repository root`

#### Scenario: Re-read Graph Context Without Duplicate Report Entries [P1]
- GIVEN `.shipwright/evidence/repository-context-profiling.json` already contains one Graphify context entry for `graphify-out/graph.json`
- WHEN Shipwright gathers graph context again for the same repository and graph file hash
- THEN the evidence still contains exactly one Graphify context entry for `graphify-out/graph.json`
- AND `shipwright-report.md` contains exactly one `Graphify context used` entry for `repository-context-profiling`
- AND the evidence contains `graphify.deduplicated=true`

#### Scenario: Fall Back When Graphify Output Is Missing [P2]
- GIVEN `graphify-out/graph.json` does not exist
- AND `graphify-out/GRAPH_REPORT.md` does not exist
- WHEN Shipwright gathers context for capability `repository-context-profiling`
- THEN `.shipwright/evidence/repository-context-profiling.json` contains `graphify.available=false`
- AND the evidence contains `graphify.skip_reason=missing_graphify_output`
- AND the workflow continues with `.shipwright/repo-profile.json`
- AND `shipwright-report.md` contains `Graphify skipped: missing_graphify_output`

#### Scenario: Fall Back When Graphify JSON Is Malformed [P2]
- GIVEN `graphify-out/graph.json` exists
- AND `graphify-out/graph.json` is not valid JSON
- WHEN Shipwright gathers graph context
- THEN `.shipwright/evidence/repository-context-profiling.json` contains `graphify.available=false`
- AND the evidence contains `graphify.skip_reason=malformed_graph_json`
- AND the workflow continues with `.shipwright/repo-profile.json`

<!-- TODO: clarify - missing performance scenario because the PRD does not define a numeric Graphify detection, parsing, or query latency target. -->
