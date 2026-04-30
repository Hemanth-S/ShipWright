# Shipwright Product Requirements Document

## Problem Statement

AI coding agents can generate code quickly, but generated changes are hard to trust. Developers still need to know whether the agent understood the requirement, reused the existing architecture, wrote meaningful tests, handled security and failure cases, updated documentation, and produced a change that is ready to review.

Shipwright turns vague product intent into a verified software change by connecting requirements, specifications, tasks, implementation, tests, and release evidence in one visible workflow.

## Product Positioning

Shipwright is a Codex-native, spec-first engineering workflow.

Tagline:

> Spec to PR, with proof.

One-line pitch:

> Shipwright turns vague product requests into verified pull requests with an auditable trail from requirement to spec to test to code.

## Goals

- Convert ambiguous user intent into a repo-grounded OpenSpec specification.
- Support both new projects and existing codebases.
- Ask clarification questions that are grounded in the actual repository structure, APIs, schemas, tests, and conventions.
- Use Beads as the task graph and sprint execution system.
- Provide a Sprint board UI that visualizes live progress through the engineering workflow.
- Preserve traceability from each requirement to its tasks, tests, code changes, verification results, and documentation updates.
- Produce a final evidence report suitable for PR review.
- Demonstrate strong use of Codex for codebase understanding, implementation, testing, review, and verification.

## Non-Goals

- Ship a general-purpose app generator.
- Replace GitHub, Linear, Jira, or other team planning systems.
- Support every language and framework in the MVP.
- Build a full collaborative multi-user SaaS product for the hackathon.
- Guarantee production readiness for arbitrary repositories without human review.
- Require a knowledge graph index before Shipwright can operate on small or medium repositories.

## Target Users

### Primary User

Solo builders, founders, and engineers using Codex to build or modify software quickly, but who still care about tests, reviewability, and safe shipping.

### Secondary User

Engineering teams evaluating AI-generated changes and looking for a clear evidence trail before merging.

## Core Concept

Shipwright uses three layers:

1. **OpenSpec** is the source of truth for what should be built.
2. **Beads** is the source of truth for what is being worked on.
3. **Shipwright UI** is the source of truth for why the change can be trusted.

Mapping:

```text
OpenSpec capability  -> Beads epic
OpenSpec requirement -> Beads task
OpenSpec scenario    -> Beads subtask chain
```

Each scenario produces a strict execution chain:

```text
Write failing test -> Implement -> Verify acceptance criteria -> Update docs
```

Shipwright must work in two repository modes:

- **Greenfield mode:** the repository is empty or minimal, so Shipwright creates the initial application structure.
- **Brownfield mode:** the repository already has code, tests, schemas, routes, services, and docs. Shipwright must understand and reuse the existing architecture before proposing changes.

## User Workflows

### Workflow 1: Start A Feature In An Existing Codebase

User provides a feature request:

```text
Add admin-only team invite links that expire after 24 hours.
```

Shipwright:

- Scans the repository structure and existing conventions.
- Identifies relevant routes, models, services, tests, docs, and configuration.
- Detects existing architecture decisions that constrain the implementation.
- Asks focused clarification questions based on what it found.
- References concrete codebase facts in each question, such as route names, table names, service files, auth middleware, or test fixtures.
- Writes or updates an OpenSpec file.
- Creates a Beads epic, tasks, and scenario subtasks.
- Opens the Sprint board.

Example brownfield clarification questions:

- "I found `src/auth/requireAdmin.ts` and existing `teams` routes. Should invite creation reuse the existing admin middleware, or does this feature need a new role check?"
- "There is already an `invitations` table with `expires_at`, but no unique constraint on `team_id` and `email`. Should duplicate active invites be prevented?"
- "Existing API tests use Vitest and Supertest under `test/api`. Should Shipwright add invite coverage there, or create a new test suite?"

### Workflow 2: Start A Greenfield Feature

User provides a product request in an empty or minimal repository.

Shipwright:

- Detects that no meaningful application structure exists.
- Asks product and technical setup questions.
- Proposes a minimal stack only when the repository does not already imply one.
- Writes OpenSpec for the initial app capability.
- Creates Beads tasks for the first shippable slice.
- Makes framework and dependency choices explicit in the evidence report.

### Workflow 3: Execute Work

User starts the implementation run.

Shipwright:

- Picks the next ready Beads task.
- Reads the linked OpenSpec scenario.
- Writes a failing test.
- Implements the minimum change required.
- Runs the relevant test.
- Runs the full test suite when appropriate.
- Updates docs for public behavior.
- Moves task state forward in Beads.

### Workflow 4: Verify And Report

User runs verification before review.

Shipwright:

- Confirms no open Beads tasks remain.
- Runs tests.
- Runs coverage where configured.
- Performs dependency and secrets checks where available.
- Confirms docs were updated.
- Produces `shipwright-report.md` and `shipwright-report.json`.

## Codebase Understanding Requirements

Shipwright must avoid generic questions when repository evidence is available.

### MVP Repository Scan

The MVP should perform a lightweight local scan before asking feature questions:

- File tree, excluding dependency folders and build outputs.
- README and existing project instructions.
- Package or build configuration.
- Test configuration and existing test files.
- Route, controller, handler, or API files.
- Schema, migration, model, or ORM files.
- Environment variable usage.

The scan should produce a short internal repository profile:

```yaml
shipwright_repo_profile:
  stack: typescript-node
  test_runner: vitest
  api_style: express-routes
  auth_modules:
    - src/auth/requireAdmin.ts
  likely_feature_areas:
    - teams
    - invitations
  docs:
    - README.md
    - docs/api.md
```

### Question Quality Rules

Questions should:

- Reference discovered code facts.
- Offer a default based on existing patterns when safe.
- Separate product decisions from implementation details.
- Ask one or two questions at a time.
- Stop asking once OpenSpec can be written with explicit assumptions.

Questions should not:

- Ask the user to restate facts already visible in the code.
- Invent table names, endpoint paths, services, or test frameworks.
- Propose a new architecture when an existing one can be extended.

## Sprint Board Requirements

The Sprint board must be a visualization over OpenSpec and Beads state, not a separate task tracker.

### Board Columns

- Clarify
- Spec Ready
- Ready
- Writing Test
- Implementing
- Verifying
- Docs
- Done
- Blocked

### Card Content

Each card should show:

- Beads task or subtask ID.
- Requirement title.
- Scenario title.
- Priority: P0, P1, P2, or P3.
- Scenario type badge: security, failure, idempotency, performance, happy path, or edge case.
- Linked OpenSpec file path.
- Current status.
- Current gate result.

### Card Detail View

Clicking a card should show:

- Original user intent.
- OpenSpec requirement.
- GIVEN / WHEN / THEN acceptance criteria.
- Beads task metadata.
- Test file path, once created.
- Related code diff.
- Test command and output summary.
- Verification result.
- Documentation updates.
- Open risks or blocked questions.

## Structured Metadata

Shipwright should store metadata in Beads task descriptions so the UI can reliably connect tasks to specs and evidence.

Example:

```yaml
shipwright:
  spec: openspec/specs/team-invites/spec.md
  capability: team-invites
  requirement: REQ-2
  scenario: expired-invite-token
  type: security
  priority: P0
  test: test/invites.expiry.test.ts
  evidence: .shipwright/evidence/expired-invite-token.json
```

## Verification Gates

Shipwright should block a final ready state if any required gate fails.

Required MVP gates:

- All linked Beads tasks are closed.
- Each OpenSpec scenario has a linked test or explicit skip reason.
- Test command exits successfully.
- Security scenarios exist for any authentication, authorization, data access, or external input feature.
- Documentation is updated for changed user-facing behavior.
- Final report includes changed files, tests run, and residual risks.

Optional gates:

- Coverage threshold.
- Dependency audit.
- Secret scan.
- Browser QA screenshot.
- Performance benchmark.

## Evidence Report

Shipwright must produce both Markdown and JSON reports.

### Markdown Report

`shipwright-report.md` should be readable by a human reviewer and include:

- Feature summary.
- Requirements implemented.
- Specs created or changed.
- Beads tasks completed.
- Tests added or changed.
- Commands run.
- Verification status.
- Security and failure scenarios covered.
- Documentation updates.
- Files changed.
- Residual risks.

### JSON Report

`shipwright-report.json` should be machine-readable and include:

- Spec paths.
- Beads IDs.
- Scenario IDs.
- Test file paths.
- Command results.
- Gate results.
- Evidence artifact paths.

## Codex Use

Shipwright should use Codex for:

- Codebase understanding, especially in existing repositories.
- Requirement clarification.
- Spec generation.
- Task decomposition.
- Implementation.
- Test writing.
- Debugging failed tests.
- Code review.
- Evidence summarization.

The product should make this usage visible in the UI and final report.

## P1: Graph-Based Codebase Context

Shipwright should support a P1 integration with Graphify or a compatible repository knowledge graph.

Graphify is an open-source knowledge graph skill for AI coding assistants. It builds queryable graphs from code, docs, papers, and diagrams, supports OpenAI Codex, and exports artifacts such as `graph.json`, `graph.html`, and `GRAPH_REPORT.md`.

### Why This Matters

Large repositories are expensive for agents to scan repeatedly. A graph layer can reduce token usage and help Shipwright ask better questions by retrieving the relevant subgraph instead of repeatedly reading broad file sets.

### P1 Requirements

- Detect whether Graphify output exists in the repository.
- Read `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` when available.
- Use graph queries to find relevant files, concepts, and dependency paths before asking clarification questions.
- Display graph-derived context in the Sprint board card detail view.
- Include graph query summaries in the evidence report.
- Fall back to the MVP repository scan when Graphify is not installed or no graph exists.

### P1 Demo Opportunity

The Graphify integration is a strong follow-up feature to build using Shipwright itself:

1. Use the MVP Shipwright workflow to write an OpenSpec for Graphify integration.
2. Generate Beads tasks for graph detection, query usage, UI display, and report evidence.
3. Implement the integration through Shipwright.
4. Use the final evidence report as the hackathon demo artifact.

This demonstrates Shipwright recursively: Shipwright builds a feature that makes Shipwright better.

## MVP Scope

The hackathon MVP should support one polished end-to-end flow:

1. Initialize Shipwright in a repository.
2. Accept one feature request.
3. Scan the existing codebase and ask repo-aware clarification questions.
4. Generate OpenSpec.
5. Generate Beads tasks.
6. Display the Sprint board.
7. Execute at least one scenario through test, implementation, verification, and docs.
8. Produce a final evidence report.

Graphify integration is P1 and should not block the MVP.

## P1 Scope

After the MVP works, Shipwright should add:

1. Graphify-based repository context.
2. Token usage comparison between naive scan and graph-assisted retrieval.
3. Graph context display in the Sprint board.
4. Graph query evidence in `shipwright-report.md`.
5. A Shipwright-built implementation of the Graphify integration as a recursive demo.

Recommended MVP stack:

- TypeScript CLI.
- Local React or Vite UI.
- Beads CLI integration.
- OpenSpec files on disk.
- Local `.shipwright/` evidence directory.

## Success Metrics

- A judge can understand the value proposition in under 30 seconds.
- A judge can see a task move through the board during the demo.
- Every completed task has visible evidence.
- The final report proves what was built and how it was verified.
- The first clarification questions clearly reference existing repository facts.
- The product feels like a Codex-native engineering workflow, not a generic project management board.

## Demo Narrative

Start with:

> AI can write code. The question is whether you can merge it.

Then show Shipwright taking a vague request and producing:

- A repo-grounded spec.
- A visible sprint board.
- A task graph.
- A failing test.
- A code change.
- A passing verification result.
- A PR-ready evidence report.

End with:

> Shipwright is not another app generator. It is a trust layer for AI-generated software changes.

## Risks

- The agent workflow may take too long during a live demo.
- Beads task parsing may be brittle if metadata is not structured.
- OpenSpec generation may be too verbose unless templates are constrained.
- Brownfield codebase scanning may miss important conventions in large repositories.
- Graphify integration could distract from the MVP if attempted too early.
- A generic Sprint board may look like ordinary project management unless evidence is central.
- Too much automation without checkpoints may reduce trust.

## Open Questions

- Should Shipwright be a Codex skill pack, a standalone CLI, or both?
- Should the UI be read-only for the MVP, or allow status changes via Beads?
- Which language/framework should the demo repository use?
- Should the first version create real PRs or stop at a PR-ready report?
- How much deterministic verification should be implemented before relying on Codex review?
- Should Graphify be an optional integration, a bundled dependency, or a user-provided context source?
