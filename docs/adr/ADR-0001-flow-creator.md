# ADR-0001: Flow Creator — node-graph action chaining

- **Status:** Proposed
- **Date:** 2026-10-25
- **Relates to:** PLUGIN-ACTIONS-MATRIX.md (multi-action gap), ActionEngine

## Context

BigDeck keys run one action per press. Elgato's answer to chaining is "Multi
Actions" (a fixed linear list) and their internal `MultiAction`/`KeyStack`
classes (seen in the 7.6 binary RE). The owner wants to go beyond both: a
**visual node-graph workflow creator** — click, drag, and wire action nodes
together (n8n-style) — turning a deck into a small automation workhorse.

Today BigDeck has `macro` (ordered keystroke/text steps with delays) and the
SD plugin host (events in/out per context). Neither composes.

## Decision

Introduce **Flows**: a persisted, directed graph of nodes; a new action type
`flow` references a flow document; a main-process execution engine walks the
graph on trigger.

### Document model (`~/.config/bigdeck/flows/<id>.json`)

```jsonc
{
  "id": "flow-uuid", "name": "Morning kickoff", "version": 1,
  "nodes": [
    { "id": "n1", "type": "trigger.keyPress", "config": {} },
    { "id": "n2", "type": "action.keyboardShortcut", "config": { "keys": "ctrl+alt+t" } },
    { "id": "n3", "type": "core.delay", "config": { "ms": 500 } },
    { "id": "n4", "type": "action.openUrl", "config": { "url": "https://…" } }
  ],
  "edges": [ { "from": "n1", "to": "n2" }, { "from": "n2", "to": "n3" },
             { "from": "n3", "to": "n4" } ]
}
```

- **Node types** — three families:
  - `trigger.*` — graph entry points (keyPress, dialRotate, schedule/cron,
    SD-plugin event). A graph with no trigger node is a subroutine callable
    from other flows.
  - `action.*` — anything ActionExecutor already runs (the whole existing
    catalog + `sdplugin` actions). Zero new action code needed.
  - `core.*` — delay, condition (expr on variables), setVariable, http
    request (later), flow.call (sub-flow).
- **Execution engine** — extension of ActionEngine: topological walk from the
  triggered node, per-run variable map, per-node timeout + failure policy
  (stop / continue / jump-to). Runs are logged per node (reuse the truthful
  logging convention from e4b6b35). Cancellation when the same flow is
  retriggered (configurable: queue | restart | ignore).
- **Key binding** — `KeyConfig.action = { type: "flow", flowId }` — flows are
  just another action in the existing catalog and work on keys, dials, and
  from SD plugins alike.

### UI (phased)

- **v1 (engine first, no canvas):** flows authored as JSON + a simple ordered
  list editor. This already beats Elgato Multi Actions (conditions, variables,
  sub-flows).
- **v2 (canvas):** React Flow (@xyflow/react) canvas — nodes are the catalog,
  drag to add, drag edges to chain, click to configure (reuse KeyEditor-style
  panels). Runs view shows per-node pass/fail with timings.

## Consequences

- Multi-action parity arrives free: a linear chain is the simplest graph.
- ActionExecutor becomes the single execution backend for keys, flows, and
  SD plugins — one logging/diagnosis story.
- Engine must enforce cycle detection at save time.
- Node sandboxing: `action.*` runs with the same privileges as key actions
  (user-level); `core.http` (later) gets an allowlist.

## Alternatives considered

- Elgato-style fixed list only — rejected: hits a wall (no branching, no
  variables) and the owner explicitly wants the graph.
- Embedding a full rules engine (json-rules-engine) — rejected for v1: the
  graph model with three node families is simpler and matches the UI vision.

## Phases

1. Engine + JSON flows + flow action type + tests (no UI).
2. Ordered-list flow editor in renderer.
3. React Flow canvas editor.
4. Triggers beyond keyPress (schedule, SD events), sub-flows, http node.
