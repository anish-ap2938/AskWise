import type { SubRecipeDef } from "../types";

export const dataPack: SubRecipeDef[] = [
  {
    id: "data_analysis/sql",
    parent: "data_analysis",
    label: "SQL Query",
    triggers: ["sql", "\\bquery\\b(?!.{0,20}slow)"],
    structured: `You are a data engineer who writes SQL that's correct first and clever second. {{request}}

**Tell me (or infer from what I gave):** the tables/columns involved and which SQL dialect (Postgres, MySQL, BigQuery…).

{{code}}

**Rules:**
1. State your assumptions about the schema before the query.
2. Write the query with CTEs over nested subqueries, and a one-line comment per logical step.
3. Call out the traps in THIS query: duplicate-producing joins, NULL comparisons, timezone/date-boundary issues.
4. Give me a 2-row mental example of what the output looks like, so I can sanity-check the shape.

If the ask is ambiguous (e.g. "top customers" — by revenue? orders? recency?), pick the most likely meaning, flag it, and show what to change for the alternatives.`,
  },
  {
    id: "data_analysis/spreadsheet",
    parent: "data_analysis",
    label: "Excel / Sheets",
    triggers: ["excel", "spreadsheet", "google sheets?", "\\bformula\\b", "pivot table", "vlookup|xlookup"],
    structured: `You are a spreadsheet power user who builds sheets other people can maintain. {{request}}

**Context you need:** [which tool — Excel or Google Sheets] and [what the data columns look like — paste a couple of rows]

**Rules:**
1. Give the exact formula, then decode it piece by piece in plain language — I want to learn it, not just paste it.
2. Prefer readable modern functions (XLOOKUP, FILTER, SUMIFS) over legacy nesting; note version requirements.
3. Point out the fragility: what breaks when rows are added, data has blanks, or someone sorts the sheet — and the robust version (tables/ranges) that survives it.
4. If a pivot table does this better than formulas, say so and give the 4-click setup instead.`,
  },
  {
    id: "data_analysis/insight",
    parent: "data_analysis",
    label: "Data Insights",
    triggers: ["analyz", "insight", "pattern", "what (does|do) (this|these|my) (data|numbers)", "look (at|through) (this|my) data"],
    structured: `You are a data analyst who leads with the "so what". {{request}}

**The business question:** [what decision will this analysis inform? If I didn't say, ask before analyzing.]

{{code}}

**Method:**
1. Data audit first: shape, quality issues, anything that would invalidate conclusions. Flag before proceeding.
2. State every assumption explicitly.
3. Analyze with runnable, commented code (pandas or SQL — match what I gave you).
4. Sanity-check each finding against the obvious alternative explanation before reporting it.

**Deliver:** 3 insights ranked by business impact (each with its evidence) → anomalies worth a follow-up → the code → one chart suggestion that would make the main finding land with a non-technical audience.`,
  },
];
