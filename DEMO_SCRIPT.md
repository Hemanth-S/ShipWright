# ShipWright 2 Minute Demo Script

## Demo Promise

ShipWright turns a vague software request into a repo-grounded spec, traceable tasks, verified implementation evidence, and a PR-ready report. The pitch is simple: Codex should not just write code; it should leave a trustworthy engineering trail.

For the recorded demo, use ShipWright on the ShipWright repository itself. That makes the story stronger: the tool is being dogfooded to build the workflow that judges are watching.

## Judging Focus

- Impact: helps solo builders and reviewers trust AI-generated changes faster.
- Quality and readiness: shows specs, tests, evidence, docs, risk tracking, and PR readiness.
- Creative use of the Codex app: uses Codex as an orchestrated engineering workflow across planning, implementation, verification, and reporting.
- Demo and pitch: tells one clear story in two minutes, with the Sprint board and final report as the strongest visuals.

## Recording Setup

- Start on the `ShipWright: Workflow Evolution` slide.
- Keep Codex open with the ShipWright repository ready to show immediately after the slide.
- Keep a terminal available for quick verification commands, but do not make the CLI the star of the recording.
- Have the Sprint board ready to open in the browser.
- Use caveman mode as the ShipWright feature: `Add configurable caveman mode that compresses internal task handoff messages while keeping specs, evidence, and reports readable`.
- Pre-warm any local dependencies so the recording shows the product flow, not setup time.
- Keep the final `shipwright-report.md` visible in a tab so the closing can land cleanly.
- Keep model routing and Graphify token reduction as follow-up ideas, not the main demo path.

## Caveman Mode Acceptance Beats

- Config supports caveman mode on/off.
- Normal mode produces regular internal task handoff text.
- Caveman mode produces shorter internal task handoff text.
- Specs, evidence, and final reports remain readable professional English.
- Evidence records the before/after handoff length or estimated token reduction.

## Intro Slide Speaker Notes

Use this if the slide is shown before the two-minute demo timer starts:

"I'm Hemanth. I've been a software engineer for 10 years, and I'm demoing ShipWright. The slide shows the core idea: most AI coding tools optimize for getting to a diff quickly. ShipWright helps make sure the code does what you asked for, and leaves behind the evidence to prove it."

## Demo Operator Runbook

Primary demo path: show ShipWright through Codex. Paste the human feature request into Codex and ask it to run the ShipWright workflow:

```text
Use ShipWright to build the caveman mode feature in this repo. Start by profiling the repo, then write the OpenSpec capability, create the traceable tasks, show me the Sprint board, implement one scenario with tests, capture evidence, and generate the final report.
```

Optional CLI command surface, if the wrapper is ready. If the final binary name changes, keep the screen beats the same and swap only the command names.

```bash
shipwright init
shipwright profile
shipwright spec --feature "Add configurable caveman mode that compresses internal task handoff messages while keeping specs, evidence, and reports readable"
shipwright tasks --spec openspec/specs/caveman-mode/spec.md
shipwright board
shipwright execute caveman-mode --scenario configurable-caveman-mode
shipwright report
```

If recording against the current API-only build, use the existing artifacts for the visual flow and run the test suite as the verification proof:

```bash
npm test
```

## Caveman Mode Prompt

Paste this as the feature request:

```text
I want to add a configurable caveman mode to ShipWright. When it is turned off, ShipWright should keep generating normal internal task handoff messages. When it is turned on, ShipWright should make those internal handoffs much shorter and simpler so we use fewer tokens. This should only affect internal agent or task handoff text; specs, evidence files, docs, and final reviewer reports should still be clear professional English. Please include a way to enable or disable the mode, tests for both settings, documentation for the config option, and evidence that records the before-and-after handoff length or estimated token reduction.
```

## What To Show On Screen

- Intro slide: show `Most coding tools today` versus `With ShipWright`.
- Codex: paste the "Use ShipWright..." workflow request, then paste the human caveman mode feature request when asked for the feature.
- Codex: show ShipWright profiling the repo and generating the OpenSpec capability.
- Editor: open `openspec/specs/caveman-mode/spec.md`; highlight config on/off, shorter handoff text, readable reports, and token evidence acceptance criteria.
- Codex or terminal: show Beads items linked to the caveman mode spec.
- Browser: open the Sprint board immediately after tasks are created; show the caveman mode card in `Spec Ready` or `Ready` before implementation starts.
- Browser: return to the Sprint board during execution and show the same card moving through `Writing Test`, `Implementing`, `Verifying`, and `Done`.
- Card detail: show before/after handoff length, test command, result, diff summary, docs update, and residual risks.
- Codex or terminal: generate the final report.
- Editor: open `shipwright-report.md`; show `What changed`, `How it was tested`, `Residual risks`, and traceability completeness.

## When To View The Board

Open the board twice:

1. After `shipwright tasks` or the Codex task-creation step, to prove ShipWright turned the spec into visible work before coding.
2. After verification, to open the completed card and show evidence, tests, docs, risks, and token-savings data.

## Script

### 0:00-0:18 - Intro Slide

**Screen:** `ShipWright: Workflow Evolution` slide.

**Voiceover:**  
"I'm Hemanth. I've been a software engineer for 10 years, and I'm demoing ShipWright. Most AI coding tools go from request, to code edits, to maybe tests, then leave the user reviewing a diff. ShipWright helps make sure the code does what you asked for, and leaves behind the evidence to prove it."

**Judging signal:** Impact.

### 0:18-0:35 - Problem And Demo Feature

**Screen:** Paste the ShipWright workflow request and caveman mode feature request into Codex.

**Voiceover:**  
"The bigger problem is trust. AI can produce a diff quickly, but a reviewer still has to reconstruct the intent, requirements, tests, and risks. For the demo, I'm using ShipWright through Codex to build one small ShipWright feature: caveman mode."

**Judging signal:** Impact plus creative Codex use.

### 0:35-0:50 - Codex Plans Before Coding

**Screen:** Show one or two focused clarification questions, then the generated OpenSpec file.

**Voiceover:**  
"This is not just a prompt pack or autocomplete. ShipWright makes Codex profile the repo, ask focused clarification questions, and write an OpenSpec capability first. Here the acceptance criteria are clear: caveman mode can be enabled or disabled, handoff text gets shorter, and reports stay normal."

**Judging signal:** Creative Codex app use plus quality.

### 0:50-1:04 - Turn Spec Into Traceable Work

**Screen:** Show Beads items or task list linked to the spec.

**Voiceover:**  
"Then ShipWright turns the spec into Beads tasks. Each task links back to the requirement, scenario, priority, test path, and evidence artifact. That is the difference from normal AI coding: the work is traceable before the code changes."

**Judging signal:** Quality and readiness.

### 1:04-1:22 - Show The Product Experience

**Screen:** Browser Sprint board with cards moving across columns.

**Voiceover:**  
"The Sprint board makes the agent workflow visible. Cards move from clarification, to spec ready, to writing tests, implementing, verifying, docs, and done. This is how a judge or reviewer can see the state of the change without reading raw logs."

**Judging signal:** Demo and pitch plus quality.

### 1:22-1:40 - Prove It Is Ready

**Screen:** Show a completed card detail or evidence summary with test result.

**Voiceover:**  
"For the demo path, ShipWright drives one scenario end to end: failing test, config change, implementation, verification, and docs. The card detail shows the acceptance criteria, before-and-after handoff length, test command, result, and remaining risks."

**Judging signal:** Quality and readiness.

### 1:40-1:55 - Land The Reviewer Value

**Screen:** Open `shipwright-report.md`, then briefly show `shipwright-report.json`.

**Voiceover:**  
"At the end, ShipWright generates both a human report and a machine-readable report with 100 percent traceability for the demo path. This is the readiness proof: spec, task, config, test, token-saving evidence, and risk are all connected."

**Judging signal:** Impact plus readiness.

### 1:55-2:00 - Close With The Pitch

**Screen:** Final report or PR-ready status.

**Voiceover:**  
"ShipWright is Codex building with receipts. This demo is ShipWright building ShipWright, with a review trail ready to ship."

**Judging signal:** Demo and pitch.

## Optional One-Line Extension Teaser

Use only if the main demo runs under time:

"Next, ShipWright can use this same task graph to spend smarter: strong models for hard decisions, cheaper models for simple tasks, and Graphify to send less context."

## Judge Questions Addressed

- What is ShipWright? A Codex workflow layer for spec, tasks, tests, evidence, and PR readiness.
- How is this different from Codex alone? Codex writes code; ShipWright makes the work traceable and reviewable.
- How is this different from prompt packs or specialist modes? ShipWright creates durable artifacts: OpenSpec, Beads tasks, evidence, and reports.
- Is it ready? The demo shows an end-to-end path with config, tests, docs, risks, traceability, and token-saving evidence.
- Why is it creative? ShipWright uses Codex to build ShipWright, then opens a path to cost-aware model routing and context compression.

## Rubric Coverage Checklist

- Impact: opening problem names reviewer trust, AI-generated code risk, and token cost.
- Quality and readiness: show OpenSpec, Beads traceability, verification evidence, docs, risks, and PR-ready report.
- Creative use of the Codex app: say "Codex is not used as autocomplete" and show it planning, tasking, implementing, verifying, and reporting.
- Demo and pitch: keep the story linear: ShipWright feature request -> spec -> tasks -> board -> evidence -> report.
- Follow-ups: mention model routing across cheap/expensive models and Graphify token reduction only as extensions after the core workflow lands.

## Timing Notes

- Cut terminal waiting time from the recording.
- Spend the most screen time on the Sprint board and final report; those are the highest-scoring visuals.
- Do not explain internal dependencies unless they are visible on screen.
- If anything runs slowly, cut to the completed state and narrate the evidence, not the wait.

## Simple Judge Q&A

**What is ShipWright?**  
ShipWright is a workflow layer for Codex. It turns a vague request into a spec, tasks, tests, evidence, and a report that is ready for review.

**Is ShipWright a skill, app, or library?**  
It is best thought of as a Codex workflow. It can be packaged as a Codex skill or plugin, with a local CLI, files, and board UI behind it.

**How is this different from Codex alone?**  
Codex can write the code. ShipWright makes the work traceable: what was requested, what was built, how it was tested, and what risks remain.

**How is this different from gstack or prompt packs?**  
Prompt packs help the AI think in better modes. ShipWright creates durable artifacts: specs, tasks, evidence, and reports that a reviewer can inspect.

**Why use ShipWright through Codex instead of a CLI?**  
Codex is the natural place where the developer asks for the change. ShipWright gives Codex a structured delivery workflow behind the scenes.

**Why caveman mode for the demo?**  
It is small, easy to understand, and shows real impact: reducing token usage while keeping final reports readable and reviewable.

**What proves the feature is ready?**  
The spec, linked task, test result, evidence file, docs update, and final report are all connected.

**Why use OpenSpec?**  
OpenSpec gives the request a clear, testable shape: requirements, scenarios, and acceptance criteria before coding starts.

**Why use Beads?**  
Beads gives ShipWright a local task graph. It lets each task link back to a spec, scenario, test, and evidence file.

**Why use Graphify?**  
Graphify can help ShipWright understand which files and symbols matter, so future runs can send less context to the model.

**Why store `.shipwright/` files locally?**  
Local files make the workflow inspectable and private. The user can see the evidence without needing a cloud service.

**Why generate both Markdown and JSON reports?**  
Markdown is for humans reviewing the change. JSON is for tools, dashboards, automation, and future PR integrations.

**What does the board add?**  
It makes the agent workflow visible. Judges can see whether work is in spec, test, implementation, verification, docs, done, or blocked.

**When do you open the board?**  
First after tasks are created, to show planned work before coding. Then again after verification, to show the completed card and evidence.

**What is the long-term vision?**  
ShipWright can route hard planning to stronger models, simple implementation to cheaper models, and use Graphify context compression to reduce token cost further.

**Who is this for?**  
Solo builders and small teams using AI coding tools who still need review quality, traceability, and confidence before shipping.

**What is the one-line pitch?**  
Codex writes code; ShipWright helps make that code trustworthy enough to ship.
