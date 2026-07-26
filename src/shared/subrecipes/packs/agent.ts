import type { SubRecipeDef } from "../types";

export const agentPack: SubRecipeDef[] = [
  {
    id: "agent_task/feature",
    parent: "agent_task",
    category: "implementation",
    label: "Feature Implementation",
    triggers: [
      "add (a )?(feature|auth|login|pagination|dark mode|support for)",
      "implement (the |a )?",
      "build (the |this )?feature",
    ],
    structured: `You are a pragmatic staff engineer shipping one feature cleanly. {{request}}

**Before coding:**
1. Restate the user-visible behavior in one sentence.
2. List files you expect to touch (or ask for the repo map if unknown).
3. Name the smallest vertical slice that proves the feature works end-to-end.

**Then:**
- Implement only that slice.
- Include tests or a manual verification script.
- Call out follow-ups you deliberately deferred.

**Done when:** I can run one command / click path and see the feature work.`,
  },
  {
    id: "agent_task/refactor",
    parent: "agent_task",
    category: "implementation",
    label: "Refactor",
    triggers: ["refactor", "clean up (the|this|my) code", "simplify (this|the)"],
    structured: `You are a careful refactoring engineer — behavior must not change unless I ask. {{request}}

{{code}}

**Rules:**
1. State the invariant you will preserve.
2. Prefer mechanical, reviewable steps over clever rewrites.
3. After each step: how I verify parity (tests, screenshots, or golden outputs).
4. No drive-by feature adds.

**Deliver:** plan (3–6 steps) → first step's patch → verification checklist.`,
  },
  {
    id: "agent_task/migrate",
    parent: "agent_task",
    category: "migration",
    label: "Migration",
    triggers: ["migrate", "upgrade (to|the|my)", "convert (this|the|my)", "move from .+ to"],
    structured: `You are a migration lead who has burned production once and never wants to again. {{request}}

**Plan format:**
1. Inventory what must move (APIs, data, config, clients).
2. Compatibility strategy (dual-write, feature flag, strangler).
3. Rollback trigger + rollback steps.
4. Ordered milestones with acceptance checks I can run myself.

**Then execute milestone 1 only** unless I approve further.`,
  },
  {
    id: "agent_task/tests",
    parent: "agent_task",
    category: "quality",
    label: "Tests",
    triggers: ["write (unit )?tests?", "add tests?", "test suite", "coverage for"],
    structured: `You are a test engineer who writes tests that catch real regressions. {{request}}

{{code}}

**Method:**
1. List the behaviors worth locking (not implementation details).
2. Propose the smallest suite: happy path, one edge, one failure.
3. Write the tests first if feasible; otherwise add them beside the code.
4. Tell me the exact command to run.

**Avoid:** brittle snapshot spam and mocking the unit under test into meaninglessness.`,
  },
  {
    id: "agent_task/ci",
    parent: "agent_task",
    category: "devops",
    label: "CI / Tooling",
    triggers: [
      "set ?up (ci|cd|ci\\/cd|eslint|prettier|typescript|testing)",
      "github actions",
      "dockeri[sz]e",
      "containeri[sz]e",
    ],
    structured: `You are a DevEx engineer who hates flaky pipelines. {{request}}

**Deliver in order:**
1. The minimal config that unblocks the team (lint/typecheck/test on PR).
2. Exact file paths and contents.
3. Local commands that mirror CI.
4. Failure modes to watch (cache, path filters, secrets).

No enterprise YAML novels — ship the boring pipeline that works.`,
  },
];
