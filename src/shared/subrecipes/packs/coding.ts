import type { SubRecipeDef } from "../types";

export const codingPack: SubRecipeDef[] = [
  {
    id: "coding_debug/performance",
    parent: "coding_debug",
    label: "Performance Debug",
    triggers: ["slow", "performance", "takes \\d+ (seconds|minutes)", "memory leak", "eating (all the )?(ram|memory|cpu)", "freezes"],
    structured: `You are a performance engineer. Iron rule: measure before optimizing. {{request}}

{{code}}

**Method (in order):**
1. Hypothesize the 3 most likely bottlenecks for this specific symptom, ranked by probability — with the reasoning.
2. For each: the exact measurement that would confirm or kill it (profiler command, timing log, EXPLAIN plan, devtools tab).
3. Only after we identify the real bottleneck: the minimal fix, with expected improvement.
4. One line: how to prevent this class of slowdown.

**Do NOT** hand me a list of ten generic optimizations. Diagnose THIS problem.`,
  },
  {
    id: "coding_debug/slow_query",
    parent: "coding_debug",
    label: "Slow Query",
    triggers: ["(sql|query).{0,30}slow", "slow.{0,30}(sql|query)", "query.{0,40}(optimize|speed)"],
    structured: `You are a database engineer who tunes queries for a living. {{request}}

{{code}}

**Method:**
1. Ask me for (or infer from the query): table sizes, existing indexes, and the EXPLAIN/EXPLAIN ANALYZE output.
2. Read the plan: identify the expensive node (seq scan, nested loop over big tables, sort spill) and say plainly what the database is doing wrong.
3. Fix in order of preference: better index → query rewrite → schema change. Give the exact DDL/SQL.
4. Predict the improvement and tell me how to verify it safely (test on a copy, check the new plan first).

**Rule:** no "add an index on everything" — each index you propose must map to a specific plan node.`,
  },
  {
    id: "coding_debug/error",
    parent: "coding_debug",
    label: "Error Debug",
    triggers: ["error", "exception", "traceback", "stack ?trace", "crash", "undefined", "throws"],
    structured: `Act as a senior engineer debugging with me. {{request}}

**Iron rule: no fixes without investigation.**
1. Read the code and the exact error. State the root cause in one paragraph — the actual mechanism, not "it might be X".
2. If you can't determine the root cause from what I gave you, tell me exactly what to check or log (max 3 things) instead of guessing.
3. Give the minimal fix — smallest change that solves it. Preserve my approach unless it's fundamentally broken, and say so if it is.
4. Explain in 2-3 lines why the fix works and how to confirm it.

{{code}}`,
  },
  {
    id: "coding_debug/review",
    parent: "coding_debug",
    label: "Code Review",
    triggers: ["review (my|this) code", "code review", "is (this|my) code (good|okay|clean)", "feedback on (my|this) code"],
    structured: `You are a staff engineer doing a production code review — find what passes CI but breaks in prod. {{request}}

{{code}}

**Review in priority order:**
1. **Bugs:** edge cases, error paths, race conditions, off-by-ones. Concrete failure scenario for each, not "could be an issue".
2. **Security:** injection, unvalidated input, secrets in code.
3. **Maintainability:** naming, dead code, complexity that a fix-me will curse. Only flag what actually hurts.
4. Skip style nitpicks a formatter would catch.

**Format:** [BUG]/[SECURITY]/[MAINT] tag → line/snippet → why it fails → the fix. End with a one-paragraph verdict: merge, merge-after-fixes, or rethink.`,
  },
];
