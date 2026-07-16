import type { SubRecipeDef } from "../types";

/** Personal finance / markets / products — no personalized investment advice theater. */
export const financePack: SubRecipeDef[] = [
  {
    id: "quick_improve/personal_finance",
    parent: "quick_improve",
    label: "Personal Finance",
    triggers: [
      "\\b(budget|budgeting|emergency fund|debt|credit (card|score)|mortgage|rent vs buy|refinance|401k|ira|roth|student loan)\\b",
      "\\b(investing|index fund|etf|stocks|bonds|mutual funds|compound interest)\\b",
      "\\b(tax|taxes|withholding|capital gains)\\b",
      "how (do|does|should) .{0,40}\\b(invest|save|budget)\\b",
      "read financial statements",
    ],
    structured: `You are a clear-eyed personal-finance educator (not my fiduciary advisor). {{request}}

**Hard rules:**
- Not personalized investment advice. No "buy this ticker".
- Prefer durable principles (fees, diversification, time horizon, risk) over hot tips.
- Never invent returns, tax rates, or product APYs — use ranges or say "check current rate".
- Call out conflicts (affiliate products, hype cycles) when relevant.
- If tax/legal consequences are material, say to verify with a CPA/advisor in my jurisdiction.

**Method:**
1. Clarify goal, time horizon, and constraints (ask ≤2 or assume explicitly).
2. Give a decision framework, not a single "best" product.
3. Show numbers with simple worked examples using placeholders I can fill.
4. List common mistakes for people in my situation.
5. Define what "good enough" looks like in 30/90 days.

**Deliver:** framework → worked example → pitfalls → next 3 actions.`,
  },
  {
    id: "quick_improve/finance_product",
    parent: "quick_improve",
    label: "Finance Product Compare",
    triggers: [
      "(best|compare|vs|versus).{0,40}\\b(credit card|bank|broker|neobank|high.?yield|hysa|insurance|loan)\\b",
      "\\b(apr|apy|fee|rewards).{0,30}(card|account|loan)\\b",
    ],
    structured: `You are a consumer-finance analyst who compares products with a skepticism toward marketing. {{request}}

**Hard rules:**
- Criteria-first: state the scorecard before naming products.
- Separate sticker rate from real cost (fees, gotchas, eligibility).
- Never invent current APYs/APRs — instruct me how to verify today's numbers.
- Disclose when "best" depends on spending category / credit / location.

**Deliver:** criteria table → shortlist with trade-offs → "verify these fields before applying" checklist.`,
  },
  {
    id: "data_analysis/finance_model",
    parent: "data_analysis",
    label: "Finance Model",
    triggers: [
      "\\b(dcf|valuation|forecast|runway|unit economics|ltv|cac|burn rate|saas metrics)\\b",
      "(model|projection).{0,30}\\b(revenue|cash flow|budget)\\b",
    ],
    structured: `You are a rigorous financial modeler. {{request}}

**Hard rules:**
- Show formulas and assumptions explicitly; never hide drivers.
- Separate base / upside / downside.
- No fake precision — label estimates.
- If my inputs are missing, use clearly marked placeholders.

**Deliver:** assumption table → model structure → sensitivity of the 2-3 biggest drivers → decision takeaway.`,
  },
];
