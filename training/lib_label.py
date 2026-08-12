"""Shared Ollama labeling helpers for the AskWise intent pipeline."""

from __future__ import annotations

import json
import re
import urllib.request

MODES = [
    "simple_answer",
    "research",
    "app_builder",
    "coding_debug",
    "agent_task",
    "resume_job",
    "writing",
    "data_analysis",
    "learning",
    "planning",
    "marketing",
    "business",
    "finance",
    "health",
    "math_help",
    "translation",
    "image_gen",
    "quick_improve",
]

TAXONOMY = """Label a user's raw AI-chat request with exactly one AskWise mode.

Modes:
simple_answer: a bare factual question about the world, roughly 12 words or less, with one right answer - including "how does X work" and "why is X". Never about the user's own files, code or numbers.
learning: asks to be TAUGHT a topic - explain, teach me, walk me through, eli5, deep dive, in detail, summarize the causes of - plus study plans, curricula, exam prep, lesson plans, learning a language.
research: weigh OPTIONS or survey a field - X vs Y, best X, pros and cons, is X worth it, market and competitor research, papers, benchmarks.
app_builder: build a WHOLE NEW product from scratch - app, site, landing page, SaaS, extension, bot, game, dashboard. The object must be an entire product.
coding_debug: existing code is broken, erroring, crashing, hanging, timing out, slow, or giving wrong output.
agent_task: add a feature to code that already exists (dark mode, auth, export, pagination) or change it - refactor, rename, clean up, migrate, optimize, add tests, CI, docker, deploy, upgrade.
data_analysis: SQL, Excel, pandas, a dataset, CSV or spreadsheet, metrics and KPIs, charts, cohorts, funnels, A/B tests, forecasts.
math_help: solve, derive, convert or check a self-contained numeric problem, especially "show the steps".
resume_job: resume and CV bullets, cover letter, LinkedIn, ATS, applications, recruiters, any interview (behavioral, technical, system design), salary negotiation, career change.
writing: prose that informs or expresses - email, essay, blog, tweet, caption, social post, story, poem, speech, bio, press release, announcement, proofreading, tone.
marketing: content or tactics to acquire and convert CUSTOMERS - ads, slogans, sales and landing page copy, product descriptions, SEO, campaigns, email sequences, content calendars, product launches, growth, conversion problems.
business: company strategy - business plan, pricing, unit economics, go-to-market, PRD, roadmap, viability, investor pitch deck and narrative, hiring, ops, freelance rates.
finance: the user's own money - budget, debt, saving, investing, retirement accounts, taxes, mortgage, insurance, credit, affordability.
health: the user's own body or mind - workouts, training programs, weight, macros, symptoms, injuries, sleep, stress, mental health, and the motivation or habits behind them.
planning: real-world logistics - trips, events, parties, weddings, moves, weekly schedules, routines, cooking, recipes, meal prep, groceries. Never money, body or study goals.
translation: another language is involved - translate, how do you say X in Y, localize, sound native, tu/vous, keigo, fix grammar in a foreign language, subtitles.
image_gen: a prompt for an image or video model, or a visual to generate - logo, thumbnail, poster, character, product shot, album cover, storyboard, negative prompt.
quick_improve: LAST RESORT - vague, garbled, joking or tiny input with no real ask; soft-skill and interpersonal advice (public speaking, small talk, procrastination, difficult people, dating); open-ended idea lists (gift ideas, name ideas, conversation starters).

Tie-breaks:
Take the primary ask; if the user self-corrects, the last ask wins.
"how does X work", "why is X" and "what causes X" are simple_answer; anything starting with explain, teach or walk me through is learning and never simple_answer, even for money, health or law. learning teaches ONE topic, research compares options.
The word "plan" is decided by its subject: trip, event or meal = planning; study = learning; workout or diet = health; budget, debt or retirement = finance; roadmap, go-to-market or hiring = business; code = app_builder or agent_task.
Body, exercise, sleep or mood is always health - tips, motivation and multi-week programs included.
Cooking, recipes, meal prep and groceries are planning unless a body goal drives them.
One post or piece of prose that announces, informs or expresses is writing, even for a company and even about a launch (tweet, caption, press release, about page, newsletter, team email). A campaign that advertises or drives signups is marketing.
Investor and board material (pitch deck, narrative, strategy memo, results slides) is business, not writing.
Gift or name ideas, conversation starters and what-to-say advice are quick_improve.
Any interview, recruiter, application or resume bullet is resume_job, whatever the job is about, even when phrased as tips and even when the verb is quantify, rewrite or improve.
Salary negotiation is resume_job; negotiating rent, a bill or a favor with a person is quick_improve.
Company strategy - pricing, what to charge for freelance work, roadmaps, PRDs, pitch decks - is business; the user's household, family and personal insurance money is finance.
Making text work in another language is translation, not writing.
Anything erroring, 404ing, timing out, crashing or running slow is coding_debug - even a SQL query or a deployed site, and even when an explanation is asked for too.
Building the page or product is app_builder; the copy that goes on it is marketing.
If the object is one feature, endpoint, page, component, module or tooling config - rate limiting, infinite scroll, stripe checkout, pagination, eslint, docker, a vercel deploy - it is agent_task, not app_builder. Implement, wire up, set up, convert and deploy are agent_task verbs.
Job-search material, including a LinkedIn headline and any recruiter or interview follow-up, is resume_job; an everyday email to a manager or team is writing.
A question about the user's OWN numbers, results or file is data_analysis even when it is short, and never math_help or finance - but anything broken, wrong or slow, including a SQL query or a slow page, is coding_debug.

Examples:
what causes lightning -> simple_answer
explain how car insurance works -> learning
add a dark mode toggle to the settings page -> agent_task
explain closures and then fix my callback that never fires -> coding_debug
write a linkedin post announcing our funding -> writing
instagram ad copy for my bakery -> marketing
what should i charge for freelance photography -> business
where do i start with an ira at 32 -> finance
8 week 10k training plan starting from the couch -> health
what should i cook for the week -> planning
gift ideas for my sister who has everything -> quick_improve

Use one of the 18 ids above, spelled exactly; never invent one.
Return ONLY JSON: {"mode":"<id>"}"""

def ollama_chat(
    model: str,
    prompt: str,
    host: str = "http://127.0.0.1:11434",
    system: str = TAXONOMY,
    temperature: float = 0.0,
    force_json: bool = True,
    timeout: int = 300,
) -> str:
    payload: dict = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "stream": False,
        "think": False,
        "options": {"temperature": temperature, "num_ctx": 8192},
    }
    if force_json:
        payload["format"] = "json"
    req = urllib.request.Request(
        f"{host}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get("message", {}).get("content", "")


def parse_label(raw: str) -> str | None:
    m = re.search(r"\{[\s\S]*?\}", raw)
    if m:
        try:
            mode = str(json.loads(m.group(0)).get("mode") or "").strip()
            if mode in MODES:
                return mode
        except json.JSONDecodeError:
            pass
    found = [mode for mode in MODES if re.search(rf"\b{mode}\b", raw)]
    return found[0] if len(found) == 1 else None


def classify_one(text: str, model: str, host: str = "http://127.0.0.1:11434") -> str | None:
    one_line = re.sub(r"\s+", " ", text).strip()[:500]
    return parse_label(ollama_chat(model, f'Classify this request:\n"""{one_line}"""', host))
