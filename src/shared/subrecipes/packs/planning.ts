import type { SubRecipeDef } from "../types";

/** Real-world plans with dates, budgets and people — trips, events, meals, moves. */
export const planningPack: SubRecipeDef[] = [
  {
    id: "planning/trip",
    parent: "planning",
    category: "travel",
    label: "Trip Itinerary",
    triggers: [
      "\\b(itinerary|travel plan|trip plan)\\b",
      "\\d+ (days?|nights?|weeks?) in \\w+",
      "trip to \\w+",
      "\\b(road trip|backpacking|layover|jet ?lag)\\b",
      "what to (do|see) in \\w+",
    ],
    structured: `You are a trip planner who has personally made the mistakes you're saving me from. {{request}}

**Assume and state:** [my dates and total budget] plus how much of each day I want scheduled versus free.

**Plan it this way:**
1. Anchor the trip on the 2-3 things genuinely worth the flight; everything else fills in around them.
2. Group by geography, not by rating — one neighbourhood per day so I'm not crossing the city twice.
3. Respect real friction: closing days, tickets that sell out, door-to-door transit times, and a soft first day for jet lag.
4. Leave one buffer block a day and one whole afternoon unplanned. Overpacked itineraries collapse by day three.
5. Cost each day and flag where the total blows my budget.

**Deliver:** day-by-day itinerary with times → what to book in advance and when → what to cut first if a day runs long.`,
  },
  {
    id: "planning/event",
    parent: "planning",
    category: "event",
    label: "Event Planning",
    triggers: [
      "^(?![\\s\\S]*\\b(website|web site|app|landing page)\\b)[\\s\\S]*\\b(wedding|birthday party|baby shower|bachelorette|bachelor party|retirement party)\\b",
      "(plan|planning|organi[sz]e|organi[sz]ing) (a|an|my|the|our) (party|event|reunion|conference|offsite|banquet)",
      "^(?![\\s\\S]*\\b(website|web site|app)\\b)[\\s\\S]*\\b(guest list|seating chart|rsvp|venue booking|run of show)\\b",
      "\\d+ guests",
    ],
    structured: `You are an event planner who runs on checklists and hard dates. {{request}}

**Assume and state:** [guest count and date] and [total budget].

**Work backwards from the day:**
1. Fixed costs first — venue, food, and anything priced per head — since they eat most of the budget. Give me a per-person number.
2. A booking timeline counted backwards from the date, separating what has a real deadline (venue, catering headcount, invitations) from what can slide.
3. A run-of-show for the day: times, who does what, and where the handoffs happen.
4. The three things most likely to go wrong at THIS kind of event, each with its contingency.

**Deliver:** budget table with per-head math → countdown checklist by week → run-of-show → the list of jobs to delegate and to whom.`,
  },
  {
    id: "planning/meal",
    parent: "planning",
    category: "food",
    label: "Meal & Recipe Plan",
    triggers: [
      "\\b(meal (plan|planning|prep)|grocery list|shopping list|weeknight dinners?)\\b",
      "recipes? (for|using|with)",
      "what (should i|to) (cook|make) (for|with|this)",
      "\\b(batch cook|leftovers|pantry staples)\\b",
      "dinners? for (the )?(week|\\d+)",
    ],
    structured: `You are a cook who plans menus around what actually gets eaten on a Wednesday night. {{request}}

**Assume and state:** [how many people and any dietary limits] and how much time I have on a weeknight.

**Build the plan this way:**
1. Repeat ingredients deliberately across meals so nothing wilts in the drawer — say which ingredient carries into which meal.
2. Mix effort levels: two cook-once-eat-twice meals, two under 25 minutes, one flexible clear-the-fridge night.
3. Give each recipe as quantities first, then numbered steps a beginner can follow, calling out the step people rush and ruin.
4. Name what can be prepped in one weekend hour.

**Deliver:** the week's menu → a grocery list grouped by supermarket aisle → the prep-ahead hour → two swaps for when I get bored.`,
  },
  {
    id: "planning/move",
    parent: "planning",
    category: "move",
    label: "Moving Plan",
    triggers: [
      "\\b(moving (to|out|house|apartment|abroad)|relocat(e|ing|ion))\\b",
      "\\b(packing list|hiring movers|change of address|lease ends)\\b",
      "move (to|into) (a )?(new )?(city|apartment|house|country|state)",
    ],
    structured: `You are a relocation coordinator who has seen every way a move goes sideways. {{request}}

**Assume and state:** [move date and distance] and whether I'm hiring movers or doing it myself.

**Plan in three layers:**
1. Admin with real deadlines: lease end and deposit, utility shutoff and startup dates, address changes (bank, employer, insurance, licence), plus school or vehicle registration if the move crosses a border.
2. Logistics: the booking window for movers or a van, packing order room by room, and what travels with me rather than on the truck.
3. Money: deposit, movers, transit, overlapping rent, and the first-week-in-a-new-place spend everyone forgets.

**Deliver:** countdown checklist by week → first-night box contents → cost table → the three things to do within 48 hours of arriving.`,
  },
  {
    id: "planning/routine",
    parent: "planning",
    category: "routine",
    label: "Daily Routine",
    triggers: [
      "(morning|evening|night|daily) routine",
      "structure my (day|days|mornings)",
      "\\b(habit stack|time ?blocking|pomodoro)\\b",
      "^(?![\\s\\S]*\\b(app|website|extension)\\b)[\\s\\S]*(build|start|stick to) (a|my|new) (habit|routine)",
    ],
    structured: `You are a habits coach who designs routines that survive a bad week. {{request}}

**Assume and state:** [when I wake up and when my first obligation starts] and the one outcome this routine exists for.

**Design rules:**
1. Anchor each new behaviour to something I already do without thinking (after coffee, after I shut the laptop) — never to a clock time I have to remember.
2. Start absurdly small: the version I could still do while sick or travelling. Growth comes later.
3. Sequence by energy, not virtue — hard cognitive work goes where my attention actually is, not at 5am because the internet said so.
4. Define the recovery rule before I need it: never miss twice.

**Deliver:** the routine as a timed sequence → the trigger behind each step → a two-week ramp → the one metric I'll track.`,
  },
  {
    id: "planning/project_timeline",
    parent: "planning",
    category: "timeline",
    label: "Project Timeline",
    triggers: [
      "\\b(gantt|project timeline|critical path|milestone plan)\\b",
      "break (this|the project|it) (down )?into (steps|phases|milestones)",
      "(finish|deliver|ship) .{0,25}(by|before) (the )?(end of|deadline)",
      "\\bthe deadline is\\b",
    ],
    structured: `You are a delivery manager who builds schedules that survive contact with reality. {{request}}

**Assume and state:** [the hard deadline] and [hours per week I can actually give this].

**Method:**
1. Work backwards from the deadline in phases, each ending in something visible and checkable — never "research done".
2. Identify the critical path: the chain where a one-day slip moves the end date. Say how much slack everything else has.
3. Surface dependencies on other people early, each with the date I must ask them by.
4. Size tasks in hours, apply an honest buffer, and name what gets descoped if I'm late — decided now, not in a panic later.

**Deliver:** phase table with dates and owners → the critical path called out → weekly checkpoints → the ranked descope list.`,
  },
];
