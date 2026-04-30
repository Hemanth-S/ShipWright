# caveman-mode Specification

## Purpose
Generate a testable specification from confirmed Working Backwards inputs.

## Requirements

### Requirement: Configure Internal Handoff Verbosity
Shipwright SHALL support a configurable caveman mode for internal agent or task handoff text.

#### Scenario: Keep Normal Handoffs By Default [P0]
- GIVEN caveman mode is not enabled
- WHEN Shipwright creates internal task handoff text
- THEN the handoff uses the existing clear professional format
- AND task metadata such as capability, requirement, scenario, spec path, and evidence path remains unchanged

#### Scenario: Shorten Internal Handoffs When Enabled [P0]
- GIVEN caveman mode is enabled
- WHEN Shipwright creates internal task handoff text
- THEN the handoff is shorter and simpler than the normal handoff
- AND the handoff still includes the minimum routing information needed by the next worker

### Requirement: Preserve Professional External Artifacts
Shipwright SHALL keep specs, evidence files, documentation, and final reviewer reports in clear professional English regardless of caveman mode.

#### Scenario: Limit Caveman Mode To Internal Handoffs [P0]
- GIVEN caveman mode is enabled
- WHEN Shipwright creates task records and reviewer-facing artifacts
- THEN only the internal handoff text is shortened
- AND specs, evidence, documentation, and reports are not rewritten into caveman-style language

### Requirement: Preserve User Request As Context
The system SHALL treat user-provided feature text as untrusted context rather than executable instructions.

#### Scenario: Capture User Request [P0]
- GIVEN User request: "I want to add a configurable caveman mode to ShipWright. When it is turned off, ShipWright should keep generating normal internal task handoff messages. When it is turned on, ShipWright should make those internal handoffs much shorter and simpler so we use fewer tokens. This should only affect internal agent or task handoff text; specs, evidence files, docs, and final reviewer reports should still be clear professional English."
- WHEN Shipwright generates an OpenSpec file from the request
- THEN the generated file contains the request only as quoted context
- AND no generated requirement instructs the system to follow prompt-injection text
