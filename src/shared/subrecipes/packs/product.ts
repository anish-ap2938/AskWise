import type { SubRecipeDef } from "../types";

/** Product management and design work: specs, stories, UX, accessibility, roadmap. */
export const productPack: SubRecipeDef[] = [
  {
    id: "business/prd",
    parent: "business",
    category: "spec",
    label: "PRD / Feature Spec",
    triggers: [
      "\\bprd\\b",
      "product requirements doc",
      "feature spec\\b",
      "product (one-?pager|brief)",
      "spec (out )?(this|the) feature",
    ],
    structured: `You are a product lead who writes specs engineers can build from without a follow-up meeting. {{request}}

**Write it in this order:**
1. **Problem** — what breaks today, for whom, with the evidence I gave you or the evidence I should go get.
2. **User** — one named segment and the job they hire this for. Not "our users".
3. **Solution** — the behaviour, described as what a person sees and does. Screens and states, not implementation.
4. **Non-goals** — three things this deliberately does not do. This section is the whole point; an empty one means nothing was scoped.
5. **Success metric** — one primary number, its baseline (say "unknown" if I did not give one), and the move that counts as a win.
6. **Open questions** — decisions still owed, each phrased as an ask of a specific role.

**Rules:** invent no usage numbers, research findings, or dates — mark every assumption inline. Cut any sentence a reader could skip without losing information.

**Deliver:** the spec → a five-line TL;DR a busy exec would actually read → the one open question most likely to sink the build.`,
  },
  {
    id: "agent_task/user_stories",
    parent: "agent_task",
    category: "requirements",
    label: "User Stories",
    triggers: [
      "user stor(y|ies)",
      "acceptance criteria",
      "given ?/ ?when ?/ ?then",
      "\\bgherkin\\b",
      "(epic|backlog) into (stories|tickets)",
    ],
    structured: `You are a senior product engineer who writes stories a developer can pick up cold and a tester can prove. {{request}}

**Method:**
1. Split the work into stories that each deliver something a user can observe. If one only makes sense after another ships, say so and order them.
2. Write each as: as <role>, I want <capability>, so that <outcome> — where the outcome is a real consequence, never "a better experience".
3. Give every story 3–6 acceptance criteria in Given/When/Then form, each independently checkable. At least one must cover a failure, empty, or permission-denied state.
4. State what is explicitly out of scope for that story so it cannot quietly grow.
5. Flag any story too big to finish in a couple of days and split it along user-visible lines, not layers.

**Rules:** no criterion that needs the code open to evaluate — "works correctly" and "is fast" are not testable, so say which number counts as fast. Keep implementation detail out of the story body; put it in a separate technical-notes line.

**Deliver:** ordered stories → criteria per story → the riskiest assumption hiding in the set.`,
  },
  {
    id: "quick_improve/ux_critique",
    parent: "quick_improve",
    category: "ux",
    label: "UX Critique",
    triggers: [
      "\\bux (review|critique|audit|feedback)",
      "usability (review|test|issues?)",
      "confusing (ui|interface|flow|screen)",
      "users? (get stuck|drop off|give up)",
      "friction (points?|in (the|our|my))",
    ],
    structured: `You are a product designer who runs usability sessions and has watched real people fail at flows their makers thought were obvious. {{request}}

**Method:**
1. Restate the flow as the steps a user takes, in order, from intent to done. Work only from what I described — invent no screens I did not mention, and say which steps you had to assume.
2. At each step, name the cost being paid: a decision, a wait, a typing task, a memory load, or a moment of doubt about what happens next.
3. Predict the step where people abandon, and say why there specifically rather than one step earlier.
4. Rank problems by how many users hit them times how much it hurts — not by how easy they are to fix.
5. For the top three, give the concrete change and what you would expect it to move.

**Rules:** no generic advice ("simplify the UI", "add whitespace"). Every point ties to a step in my flow. Say plainly when something is a wording problem rather than a layout one — it usually is.

**Deliver:** step-by-step friction map → ranked problems → the one fix to ship first → what to watch to know it worked.`,
  },
  {
    id: "agent_task/accessibility",
    parent: "agent_task",
    category: "accessibility",
    label: "Accessibility Audit",
    triggers: [
      "accessib(le|ility)",
      "\\ba11y\\b",
      "\\bwcag\\b",
      "screen ?reader",
      "contrast ratio",
      "keyboard (navigation|accessible|only)",
    ],
    structured: `You are an accessibility engineer who has fixed real audit findings and knows which ones actually block people. {{request}}

**Work in this order — the structural wins are the cheap ones:**
1. **Semantics first:** correct elements (button, label, heading order, landmarks, lists). Most ARIA is a patch over the wrong element — reach for it only where native semantics genuinely cannot express the pattern.
2. **Keyboard path:** every action reachable and operable by keyboard, visible focus, sane tab order, no traps, focus moved deliberately when dialogs open and close.
3. **Screen-reader path:** accessible names for controls and icon buttons, alt text that carries the meaning (empty alt for decoration), dynamic changes announced rather than silent.
4. **Perception:** contrast measured against the WCAG thresholds, never colour alone as the signal, and layout that survives zoom and reflow.

**Hard rules:**
- Never claim something "meets WCAG AA" or any other level from reading code — conformance is a testing claim. Name the specific criterion at risk and why instead.
- Split every finding into what automated tooling (axe, Lighthouse) can confirm and what needs a human: a keyboard walkthrough, a screen-reader pass, reflow at 320px, and focus-order sanity.

**Deliver:** findings by severity, each with the failing pattern and corrected markup → the automated-versus-manual split → the three fixes with the widest reach.`,
  },
  {
    id: "business/onboarding",
    parent: "business",
    category: "onboarding",
    label: "Onboarding Flow",
    triggers: [
      "\\bonboarding\\b",
      "onboarding (flow|experience|process)",
      "(new|first.?time) users?\\b",
      "first-?run experience",
      "time to (first )?value",
      "new user experience",
      "sign-?up flow",
    ],
    structured: `You are a product designer who judges onboarding by how fast someone gets a real result, not by how polished the tour looks. {{request}}

**Method:**
1. Name the first moment of value for this product in one sentence — the thing that, once experienced, brings someone back tomorrow. Every step is judged by whether it moves toward that moment.
2. Map the current path from arrival to that moment, counting steps, form fields, decisions, and waits. The count is the argument.
3. Cut: which fields can be defaulted, inferred, or asked for later; which decisions the product can make on the user's behalf; what can be shown before signup instead of behind it.
4. Make the empty state a working example with real-looking content, not a blank canvas with an arrow.
5. Say where a guided tour is genuinely warranted and where it is a bandage over an interface that should explain itself.

**Rules:** invent no conversion benchmarks. Assume a distracted first-time user on a phone who has forgotten the ad that brought them.

**Deliver:** the time-to-first-value definition → the trimmed path, with what you removed and the risk of removing it → the first change to make this week → the signal that tells me it worked.`,
  },
  {
    id: "business/prioritization",
    parent: "business",
    category: "roadmap",
    label: "Prioritization",
    triggers: [
      "product roadmap",
      "prioriti[sz]e .{0,8}(backlog|roadmap)",
      "feature prioriti[sz]ation",
      "what (should we|to) build (first|next)",
      "everything is (a )?p0",
    ],
    structured: `You are a head of product who has shipped with a team far too small for the roadmap they were handed. {{request}}

**Method:**
1. State capacity first: how many engineer-weeks this window actually holds. If I did not say, assume a number, state it out loud, and build everything on it.
2. Force one explicit criterion for this cycle — retention, revenue, support load, or risk reduction. One. Everything gets scored against it.
3. Score each candidate on impact against that criterion, effort, and confidence, and show the scores so I can argue with them rather than with your conclusion.
4. Draw the cut line at capacity. What sits below it is not "later" — it is not happening this cycle, and you say that plainly.
5. For everything above the line, name the smaller version that captures most of the value in a fraction of the time.

**Hard rules:** refuse to produce a roadmap where everything is P0 — if I hand you one, tell me which items are lying about their priority and why. Do not pad the plan to fill the quarter; leave slack for the work that always appears.

**Deliver:** ranked list with scores → the cut line → what I am dropping and the one-line answer for whoever asked for it.`,
  },
  {
    id: "agent_task/design_system",
    parent: "agent_task",
    category: "design_system",
    label: "Design System",
    triggers: [
      "design system",
      "design tokens",
      "component library",
      "(ui|visual|styling) (is )?inconsistent",
      "inconsistent (spacing|colou?rs|buttons)",
    ],
    structured: `You are a design-systems engineer who has watched component libraries rot into a second layer of chaos. {{request}}

**Method:**
1. Inventory what already exists: every variant of the same thing — button styles, spacing values, greys, shadows, border radii — with a count each. The count is the argument for the cleanup.
2. Collapse to tokens (colour, spacing, type scale, radius, elevation) chosen from what is already most used rather than invented fresh. Name them by role — surface, muted, danger — never by value, since blue-500 is a value pretending to be a name.
3. For each core component define the full state matrix: default, hover, focus-visible, active, disabled, loading, error, empty. Missing states are where consistency actually breaks.
4. Give a migration path that is mechanical and reviewable: token layer first, then one component at a time with the old styles deleted as you go. No big-bang rewrite.

**Rules:** consistency loses to clarity for rare, high-stakes, or destructive actions — call those out and let them look different on purpose. Do not add a component that has exactly one usage, and do not invent a naming scheme I have to memorise.

**Deliver:** the inventory table → the token set → one component rewritten as the reference implementation → the migration order.`,
  },
];
