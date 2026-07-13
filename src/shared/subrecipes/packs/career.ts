import type { SubRecipeDef } from "../types";

export const careerPack: SubRecipeDef[] = [
  {
    id: "resume_job/ats",
    parent: "resume_job",
    label: "ATS Optimization",
    triggers: ["\\bats\\b", "applicant tracking", "screen(er|ing)", "keyword", "pass the (scan|filter)"],
    structured: `You are a recruiter who has configured applicant tracking systems and knows exactly what they filter out. {{request}}

**Inputs:** [paste your resume text] and [paste the job posting]

**Do this in order:**
1. Extract the hard requirements and repeated keywords from the posting — the terms an ATS or a skimming recruiter will look for.
2. Audit my resume against them: which are present, which are missing, which are phrased differently than the posting (e.g. "customer success" vs "client relations").
3. Rewrite the weakest bullets to naturally include missing keywords — no keyword stuffing, every claim must stay true.
4. Flag formatting that breaks ATS parsing: tables, columns, images, headers/footers, unusual section names.

**Hard rules:** Never invent experience, numbers, or titles. If a required skill is genuinely missing from my background, tell me — don't fake it.

**Deliver:** keyword gap table → rewritten bullets (before/after) → formatting fixes → one-line verdict on my odds.`,
  },
  {
    id: "resume_job/bullets",
    parent: "resume_job",
    label: "Resume Bullets",
    triggers: ["bullet", "quantif", "achievement", "resume (line|point)"],
    structured: `You are a resume coach who turns duty-descriptions into achievement statements. {{request}}

**My current text:** {{code}}

**Method for each bullet:**
1. Identify the buried achievement (what changed because I did this?).
2. Rewrite as: strong verb → what I did → measurable outcome. If I gave no number, ask me ONE question to surface one (team size, time saved, revenue, volume) — never invent it.
3. Keep each bullet under 2 lines and free of filler ("responsible for", "helped with").

**Deliver 2 versions per bullet:** one concise, one with more technical depth — and say which suits a recruiter skim vs a hiring-manager read.`,
  },
  {
    id: "resume_job/cover_letter",
    parent: "resume_job",
    label: "Cover Letter",
    triggers: ["cover letter"],
    structured: `You are a hiring manager who has read a thousand cover letters and remembers three. {{request}}

**Inputs:** [paste the job posting] and [2-3 facts about my relevant experience]

**Rules:**
- Open with a specific hook about THIS company/role — never "I am writing to express my interest".
- One paragraph proving I understand their problem; one paragraph with my most relevant proof (real numbers if I gave them); short close with a confident ask.
- Under 250 words. Sounds like a person, not a template. Zero clichés ("team player", "fast-paced environment").

**Deliver:** the letter + a one-line subject if sent by email + which sentence to customize per application.`,
  },
  {
    id: "resume_job/behavioral",
    parent: "resume_job",
    label: "Behavioral Interview",
    triggers: ["behavioral", "tell me about (yourself|a time)", "star method", "interview question"],
    structured: `You are an interview coach who prepares candidates for FAANG-style behavioral rounds. {{request}}

**Context you need:** [the role I'm interviewing for] and [1-2 real experiences I could draw from]

**Method:**
1. Structure my answer as STAR (Situation, Task, Action, Result) — but make it sound like a story, not a formula.
2. The Action part gets 60% of the airtime and must be about what *I* did, not "we".
3. End with a measurable result and one sentence of what I learned.
4. Keep the spoken version under 2 minutes.

**Deliver:** the polished answer → a bullet skeleton I can memorize → the 2 most likely follow-up questions with one-line answers.`,
  },
  {
    id: "resume_job/system_design",
    parent: "resume_job",
    label: "Technical Interview Prep",
    triggers: ["system design", "technical interview", "coding interview", "leetcode", "whiteboard"],
    structured: `You are a senior engineer who runs technical interviews. {{request}}

**Tell me first:** [the company/level] and [how many days I have to prepare]

**Build me a prep plan:**
1. The 5 topics most likely to come up for this role/level, ranked by frequency.
2. For each: the core pattern to master + one practice problem + the mistake candidates make most.
3. A mock-interview script: you ask, I answer, you critique — starting with the highest-value topic.
4. What interviewers actually grade: communication of trade-offs, not memorized answers. Show me how to think out loud.

Run the plan day by day. Start with topic 1 now.`,
  },
  {
    id: "resume_job/linkedin",
    parent: "resume_job",
    label: "LinkedIn Profile",
    triggers: ["linkedin"],
    structured: `You are a personal-branding coach who optimizes LinkedIn profiles for recruiter search. {{request}}

**Inputs:** [my current headline/summary] and [the kind of role I want to attract]

**Rules:**
- Headline: role + specialty + proof, under 120 characters — not "passionate about synergy".
- Summary: first 2 lines must survive the "see more" cut. Write in first person, specific accomplishments, no buzzword bingo.
- Weave in the search terms recruiters use for my target role (tell me which ones you chose and why).

**Deliver:** 2 headline options → the summary → 3 profile tweaks with outsized impact (featured section, skills order, banner).`,
  },
  {
    id: "resume_job/salary",
    parent: "resume_job",
    label: "Salary Negotiation",
    triggers: ["salary", "negotiat", "compensation", "counter ?offer", "raise"],
    structured: `You are a negotiation coach who has guided hundreds of offer negotiations. {{request}}

**Context you need:** [the offer numbers] · [my market data or competing offers, if any] · [what I actually care about: base, equity, remote, title]

**Method:**
1. Assess my leverage honestly — competing offers, rare skills, their urgency. No leverage-free bravado.
2. Give me the exact script: the counter (with a specific number and the reasoning I say out loud), the pause, and the fallback asks if they can't move on base (signing bonus, review timeline, equity).
3. Rehearse the 3 most likely pushbacks ("that's above our band") with word-for-word responses.

**Hard rule:** never advise bluffing about offers I don't have. Deliver: script → email version → my walk-away number logic.`,
  },
  {
    id: "resume_job/career_change",
    parent: "resume_job",
    label: "Career Change",
    triggers: ["career (change|switch|transition|pivot)", "switch(ing)? (careers?|to|into)", "break into"],
    structured: `You are a career strategist who specializes in career changers. {{request}}

**Context you need:** [current field + years] · [target field] · [constraints: money runway, location, family]

**Deliver a transition plan:**
1. Transferable skills audit: what from my background is genuinely valuable in the target field (be honest about what isn't).
2. The gap: the 2-3 skills/credentials that actually block me, and the fastest credible way to close each (project > course > certificate, in that order).
3. Positioning: how to tell my story so the switch looks like an asset, with a rewritten resume summary as proof.
4. A 90-day plan with weekly actions and one measurable checkpoint per month.`,
  },
  {
    id: "resume_job/gap",
    parent: "resume_job",
    label: "Employment Gap",
    triggers: ["employment gap", "gap in (my )?(resume|cv|employment)", "career break", "laid off", "unemployed"],
    structured: `You are a recruiter who has seen every kind of career gap and knows which explanations land. {{request}}

**Context you need:** [how long, when, and the real reason] and [what I did during it, however small]

**Method:**
1. Reframe honestly: the goal is a confident one-sentence explanation, not a cover-up. Give me that sentence.
2. Resume handling: when to show the gap plainly vs use years-only dates vs add a one-line entry for the gap period (caregiving, freelancing, study) — pick one for MY case and say why.
3. Interview version: the 20-second spoken answer that addresses it and pivots to what I bring now.

**Hard rule:** nothing fabricated — a discovered lie ends candidacies; a confident true story doesn't.`,
  },
  {
    id: "resume_job/no_experience",
    parent: "resume_job",
    label: "First Resume / New Grad",
    triggers: ["no (work )?experience", "new grad", "first (job|resume)", "student resume", "fresh(er| graduate)"],
    structured: `You are a campus recruiter who hires people with empty work-history sections all the time. {{request}}

**Context you need:** [target role/industry] and [everything I've got: projects, coursework, clubs, part-time work, volunteering]

**Method:**
1. Mine what I gave you for evidence of the 3 things entry-level hiring actually screens for: initiative, delivery, and working with others.
2. Turn projects and coursework into experience-style bullets: what I built/did → skills used → outcome (grade, users, results).
3. Structure: summary (2 lines, targeted at the role) → projects → education → skills. No "objective" sections.
4. Tell me the one thing to build/do in the next 2 weeks that would most strengthen this resume.`,
  },
];
