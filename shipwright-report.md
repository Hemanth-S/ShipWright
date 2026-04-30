# Shipwright Report

## Requirements Implemented
{
  "duration_ms": 0,
  "spec_path": "openspec/specs/caveman-mode/spec.md",
  "beads_id": "ShipWright-u3u",
  "test_path": "test/sprint-board.test.js",
  "evidence_path": ".shipwright/evidence/board-update.json",
  "verification_status": "passed",
  "docs_updated": true,
  "risk": "Low; sprint board uses escaped existing renderer output for the caveman-mode card."
}
{
  "spec_path": "openspec/specs/caveman-mode/spec.md",
  "beads_id": "ShipWright-u3u",
  "test_path": "test/caveman-mode.test.js",
  "evidence_path": ".shipwright/evidence/caveman-mode-tasks.json",
  "verification_status": "passed",
  "docs_updated": true,
  "risk": "Low; task records preserve metadata and only shorten the internal handoff field.",
  "created_items": [
    {
      "id": "ShipWright-u3u-epic",
      "type": "epic",
      "title": "caveman-mode",
      "handoff_length": 78,
      "shipwright": {
        "capability": "caveman-mode",
        "spec": "openspec/specs/caveman-mode/spec.md"
      }
    },
    {
      "id": "ShipWright-u3u-task",
      "type": "task",
      "title": "Configure Internal Handoff Verbosity",
      "handoff_length": 102,
      "shipwright": {
        "capability": "caveman-mode",
        "requirement": "Configure Internal Handoff Verbosity",
        "spec": "openspec/specs/caveman-mode/spec.md"
      }
    },
    {
      "id": "ShipWright-u3u",
      "type": "subtask",
      "title": "Shorten Internal Handoffs When Enabled",
      "handoff_length": 205,
      "shipwright": {
        "capability": "caveman-mode",
        "requirement": "Configure Internal Handoff Verbosity",
        "scenario": "Shorten Internal Handoffs When Enabled",
        "priority": "P0",
        "spec": "openspec/specs/caveman-mode/spec.md",
        "evidence": ".shipwright/evidence/caveman-mode.json"
      }
    }
  ]
}
{
  "scenario_id": "shorten-internal-handoffs-when-enabled",
  "spec_path": "openspec/specs/caveman-mode/spec.md",
  "beads_id": "ShipWright-u3u",
  "test_path": "test/caveman-mode.test.js",
  "evidence_path": ".shipwright/evidence/caveman-mode.json",
  "command_exit_code": 0,
  "verification_status": "passed",
  "docs_updated": true,
  "risk": "Low; caveman mode is scoped to internal handoff strings and leaves specs, evidence, docs, and reports unchanged.",
  "caveman_mode": {
    "normal_handoff": "Internal handoff for subtask: Shorten Internal Handoff Text.\nCapability: caveman-mode.\nRequirement: Configure Internal Handoff Verbosity.\nScenario: Shorten Internal Handoffs When Enabled.\nPriority: P0.\nUse the OpenSpec at openspec/specs/caveman-mode/spec.md as the source of truth.\nRecord implementation proof in .shipwright/evidence/caveman-mode.json and keep reviewer-facing evidence clear.\nDo not shorten specs, evidence files, documentation, or final reviewer reports.",
    "caveman_handoff": "subtask: Shorten Internal Handoff Text\ncap: caveman-mode\ndo: Shorten Internal Handoffs When Enabled\nprio: P0\nspec: openspec/specs/caveman-mode/spec.md\nproof: .shipwright/evidence/caveman-mode.json",
    "normal_length": 472,
    "caveman_length": 196,
    "estimated_reduction_percent": 58
  }
}

## What changed

## How it was tested

## Residual Risks
Residual risks
