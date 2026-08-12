#!/usr/bin/env python3
"""
Synthesize realistic AskWise-mode prompts with a local Ollama model (GPU).

Public corpora are overwhelmingly Q&A, so agent_task / resume_job / app_builder /
coding_debug are nearly absent. This generates messy, composer-style asks for
every mode across many domains and typing styles, then (optionally) verifies each
one with the same classifier prompt used for labeling and keeps only agreements.

Writes: training/data/raw/synth.jsonl  {"text","mode","source","domain","style"}

Run:
    python training/13_synth_mode_prompts.py --verify
"""

from __future__ import annotations

import argparse
import json
import random
import re
import threading
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from lib_label import TAXONOMY, classify_one, ollama_chat

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "data" / "raw"

GEN_SYSTEM = """You generate realistic raw text that real people type into an AI chat box.

Critical rules:
- Output messy, natural, FIRST-DRAFT text — the kind of thing someone types quickly, not polished prose.
- Never write a well-structured prompt. No headings, no "Role:", no bullet lists, no numbered steps.
- Vary length wildly: some 3-6 words, some one rambling run-on sentence.
- Include realistic typos, missing punctuation, lowercase starts, and filler ("uh", "btw", "also").
- Do not number the outputs or add commentary.
- Each entry must be a standalone request, not a conversation.
- Every entry is someone ASKING for the thing. Never produce the thing itself: no schedule rows, no recipe steps, no answers, no finished copy.

Return ONLY JSON: {"prompts":["...","..."]}"""

STYLES = [
    "extremely short and blunt, 3 to 6 words, all lowercase, no punctuation",
    "one long rambling run-on sentence with no punctuation and a few typos",
    "casual with filler words like 'hey', 'can u', 'plz', 'btw' and 2-3 typos",
    "medium length, mostly correct grammar, but all lowercase",
    "frustrated and urgent, mentions a deadline, some caps for emphasis",
    "vague and underspecified, missing key details a model would need",
    "includes a concrete detail like a framework name, tool, number, or file name",
    "polite and wordy, over-explains context before the actual ask",
    "fragmented notes rather than a sentence, comma separated",
    "written by a non-native English speaker, slightly off grammar",
]

MODE_SPECS: dict[str, dict] = {
    "agent_task": {
        "what": (
            "multi-step engineering work on an EXISTING codebase they already have: "
            "implement a feature, refactor, migrate a library or version, rename things, "
            "add tests, set up CI/CD or linting, dockerize, deploy, upgrade dependencies, "
            "split a file, add types, wire up an API. They are asking an AI coding agent "
            "to change their code. NOT building a brand new product, NOT fixing a crash."
        ),
        "domains": [
            "a React dashboard", "a Django REST backend", "a Next.js marketing site",
            "an Express API", "a Rails monolith", "a Flutter app", "a Spring Boot service",
            "a Python CLI tool", "a monorepo with turborepo", "a Vue 2 app being upgraded",
            "an Android Kotlin app", "a FastAPI microservice", "a Laravel project",
            "a Go service", "a legacy jQuery frontend", "a Chrome extension",
            "an Unreal Engine game project", "a Terraform infra repo",
            "a GitHub Actions pipeline", "a PostgreSQL-backed SaaS",
        ],
        "n": 1600,
    },
    "coding_debug": {
        "what": (
            "something that ALREADY EXISTS is broken, erroring, crashing, hanging, slow, or "
            "returning wrong output, and they want it diagnosed and fixed. Often includes an "
            "error message, status code, stack trace fragment, or 'it worked yesterday'."
        ),
        "domains": [
            "a React state update not rendering", "a CORS error on a fetch call",
            "a Python ImportError", "a failing pytest suite", "a segfault in C++",
            "a Docker build that fails", "a 500 from an API endpoint",
            "a slow SQL query timing out", "a memory leak in Node",
            "npm install failing", "a webpack build error", "an infinite render loop",
            "a null pointer exception in Java", "a broken CSS layout on mobile",
            "a websocket that keeps disconnecting", "a cron job that silently stops",
            "a Kubernetes pod in CrashLoopBackOff", "a flaky CI test",
            "a TypeScript type error they can't satisfy", "an auth token that keeps expiring",
        ],
        "n": 1000,
    },
    "resume_job": {
        "what": (
            "resumes/CVs, cover letters, LinkedIn profiles, ATS keyword optimization, job "
            "applications, referrals, interview preparation, behavioral answers, salary "
            "negotiation, career changes, resignation, promotion cases, portfolio review."
        ),
        "domains": [
            "a new grad software engineer resume", "switching from teaching to UX",
            "a cover letter for a marketing role", "a data analyst career change",
            "STAR answers for a behavioral interview", "negotiating a 15% raise",
            "a LinkedIn headline for a PM", "ATS keywords for a devops job",
            "explaining a 2 year employment gap", "a resume with too much text",
            "prepping for a system design interview", "a referral message to a stranger",
            "a nursing resume", "a finance internship application",
            "quitting without burning bridges", "a promotion case for senior engineer",
            "a resume for a federal job", "answering 'why should we hire you'",
            "a portfolio for a junior designer", "following up after no response",
        ],
        "n": 1600,
    },
    "app_builder": {
        "what": (
            "wants to BUILD A NEW product from scratch — an app, website, SaaS, marketplace, "
            "browser extension, bot, game, dashboard, or internal tool. Often a rough idea "
            "with no technical detail, sometimes asking for a stack or MVP scope."
        ),
        "domains": [
            "a dog walking marketplace", "a habit tracker app", "an AI recipe generator",
            "a booking site for barbers", "an invoicing tool for freelancers",
            "a Discord bot for a study group", "a 2D platformer game",
            "an internal HR dashboard", "a Chrome extension that blocks distractions",
            "a used textbook marketplace for students", "a fitness coaching SaaS",
            "a local events discovery app", "an inventory tool for a small bakery",
            "a mood journaling app", "a real estate lead CRM",
            "a multiplayer trivia web game", "a plant care reminder app",
            "a podcast transcription service", "a tutoring scheduling platform",
            "a budgeting app for couples",
        ],
        "n": 1000,
    },
    "research": {
        "what": (
            "comparing or investigating options before deciding: pros and cons, which tool is "
            "better, market or competitor research, finding papers or sources, benchmarks, "
            "shortlists, feasibility. They want findings, not prose."
        ),
        "domains": [
            "Postgres vs MongoDB for a startup", "best CRM for a 5 person team",
            "market size for pet insurance", "competitors to Notion",
            "papers on retrieval augmented generation", "is Rust worth learning in 2026",
            "cheapest cloud host for a side project", "electric SUVs under 50k",
            "state of solid state batteries", "which bootcamp has real outcomes",
            "Stripe vs Paddle for EU sales", "open source alternatives to Figma",
            "is a masters worth it for ML jobs", "trends in vertical farming",
            "best city to relocate for tech jobs", "vendor options for payroll",
            "React Native vs Flutter tradeoffs", "regulations for drone delivery",
            "coffee subscription market landscape", "grants for climate startups",
        ],
        "n": 900,
    },
    "writing": {
        "what": (
            "producing or revising prose: emails, essays, blog posts, social captions, "
            "stories, poems, scripts, speeches, product copy, summaries, proofreading, "
            "or changing tone."
        ),
        "domains": [
            "an email asking for a deadline extension", "a wedding toast",
            "a LinkedIn post about a launch", "a blog post on remote work",
            "an apology email to a client", "a short horror story",
            "a poem for a grandmother's birthday", "Instagram captions for a bakery",
            "a cold outreach email to investors", "a eulogy for a father",
            "a college application essay", "product description for a water bottle",
            "a newsletter intro", "a complaint letter to an airline",
            "a YouTube video script about budgeting", "making a paragraph sound less formal",
            "proofreading a thesis abstract", "a press release for a funding round",
            "a break up text", "summarizing a long report for executives",
        ],
        "n": 500,
    },
    "data_analysis": {
        "what": (
            "working with data: writing or fixing SQL, Excel or Sheets formulas, pandas, "
            "analyzing a dataset or CSV, metrics and KPIs, dashboards and charts, cohort or "
            "churn or funnel analysis, forecasting, extracting or classifying records."
        ),
        "domains": [
            "a SQL join across orders and customers", "an Excel formula for running totals",
            "churn analysis on subscription data", "a pivot table of sales by region",
            "cleaning a messy CSV in pandas", "a funnel conversion breakdown",
            "forecasting next quarter revenue", "which KPIs to track for a newsletter",
            "a chart comparing monthly signups", "deduplicating a contact list",
            "an A/B test result that looks flat", "cohort retention for a mobile app",
            "categorizing free text survey answers", "a window function for rankings",
            "outliers in sensor readings", "a Looker Studio dashboard layout",
            "joining two spreadsheets by fuzzy name", "calculating LTV to CAC",
            "a regression on housing prices", "summarizing 10k support tickets",
        ],
        "n": 500,
    },
    "simple_answer": {
        "what": (
            "a SHORT direct question (under about 12 words) wanting one specific fact or a "
            "brief definition. Phrased as a question starting with what/who/when/where/why/"
            "how/is/are/does/do/did/can. NEVER an imperative like 'explain' or 'teach me', "
            "and never asking for depth, examples, steps, tips, or a plan."
        ),
        "domains": [
            "how DNS resolution works", "what a closure is in JavaScript",
            "why the sky is red at sunset", "what APR means",
            "how vaccines create immunity", "the difference between TCP and UDP",
            "what causes inflation", "how a transformer model attends",
            "what a 401k rollover is", "why bread needs yeast",
            "how noise cancelling headphones work", "what git rebase actually does",
            "the rules of offside in soccer", "what BMI measures",
            "how solar panels make electricity", "what a p value means",
            "why cats purr", "the difference between weather and climate",
            "how compound interest works", "what an API key is for",
        ],
        "n": 300,
    },
    "learning": {
        "what": (
            "wants to UNDERSTAND a topic. Imperative teaching asks: explain X, teach me X, "
            "walk me through X, help me understand X, eli5, deep dive on X, break down X, "
            "summarize the causes of X — plus study plans, curricula, exam prep, learning a "
            "language, and lesson planning for teachers. NOT a short factual question "
            "(simple_answer), NOT comparing options to pick one (research), NOT solving an "
            "actual math problem (math_help), NOT what to do about their own body "
            "(health) or their own money (finance)."
        ),
        "domains": [
            "how the electoral college works", "the causes of world war one",
            "recursion for a beginner programmer", "a study plan for the MCAT",
            "eli5 quantum entanglement", "what a mortgage escrow account actually is",
            "how the immune system fights a virus", "a six week plan to learn Spanish",
            "photosynthesis for a 5th grade lesson", "the basics of music theory",
            "how bitcoin mining works under the hood", "self teaching statistics",
            "the difference between socialism and communism", "how a car transmission works",
            "cramming for a chemistry final", "the history of the roman republic",
            "how machine learning models actually learn", "chess opening principles",
            "a lesson plan on fractions for teachers", "how tariffs affect an economy",
        ],
        "n": 600,
    },
    "planning": {
        "what": (
            "a concrete real-world PLAN, ITINERARY, SCHEDULE, or MENU with time, budget or "
            "people constraints: trips and travel, events, weddings, parties, moves, weekly "
            "schedules, daily routines, cooking, recipes, meal prep and grocery lists, "
            "personal project timelines. NOT a study plan (learning), NOT a workout or "
            "body-goal diet (health), NOT a budget (finance), NOT a software project "
            "(app_builder/agent_task), NOT a go-to-market plan (business)."
        ),
        "domains": [
            "a two week trip to Japan", "a wedding on a 15k budget",
            "a toddler's birthday party", "a cross country move",
            "a weekly dinner menu for a family of four", "a Thanksgiving cooking timeline",
            "a bachelor party weekend in Austin", "a grocery list for a week of dinners",
            "a daily routine for a night shift worker", "a road trip through the Pacific Northwest",
            "a surprise 40th birthday dinner", "a garage renovation timeline",
            "a summer camp schedule for two kids", "a team offsite for 30 people",
            "meal prep for busy weeknights", "a wedding day timeline for the photographer",
            "a planting schedule for a vegetable garden", "a weekend visit from the in-laws",
            "a recipe from whatever is left in the fridge",
            "a packing list for 10 days backpacking",
        ],
        "n": 1600,
    },
    "marketing": {
        "what": (
            "content and tactics meant to ACQUIRE OR CONVERT customers: ad copy, landing "
            "page copy, sales and product copy, taglines and slogans, social content "
            "calendars, SEO and keyword content, email marketing campaigns and sequences, "
            "launches, brand positioning, influencer and partnership outreach, growth "
            "experiments, conversion-rate problems. NOT prose meant to communicate or "
            "express (writing), NOT pricing or strategy decisions (business), NOT the "
            "image prompt for the ad (image_gen)."
        ),
        "domains": [
            "Facebook ads for a local gym", "a landing page headline for a SaaS",
            "a tagline for a coffee roaster", "a welcome email sequence for a newsletter",
            "SEO keywords for a plumbing site", "a 30 day Instagram content calendar",
            "a Product Hunt launch", "cold DM outreach to influencers",
            "a Google Ads headline that converts", "a TikTok hook for a skincare brand",
            "brand positioning for a budget airline", "an abandoned cart email",
            "a referral program for a meal kit", "a blog post to rank for 'best crm'",
            "checkout abandonment on an ecommerce site", "a slogan for a nonprofit fundraiser",
            "an Amazon listing that isn't selling", "a webinar promotion push",
            "sales page copy for an online course", "a Black Friday promo campaign",
        ],
        "n": 1600,
    },
    "business": {
        "what": (
            "company and product STRATEGY: business plans, pricing and monetization, unit "
            "economics, go-to-market strategy, product specs and PRDs and roadmaps, whether "
            "a business idea is feasible or makes money, investor pitch narrative and decks, "
            "competitive positioning, operations and process, hiring plans, partnerships, "
            "freelance and consulting rates. NOT gathering findings about options "
            "(research), NOT building the software (app_builder), NOT the user's personal "
            "money (finance), NOT running the campaigns (marketing)."
        ),
        "domains": [
            "pricing tiers for a B2B SaaS", "a business plan for a food truck",
            "unit economics of a car wash", "a go-to-market strategy for a dev tool",
            "a PRD for a notifications feature", "a seed round pitch narrative",
            "whether a laundromat is worth buying", "a roadmap for the next two quarters",
            "freelance rates for a graphic designer", "a hiring plan for a 10 person startup",
            "positioning against a much bigger rival", "moving from one-time to subscription pricing",
            "an order fulfillment process", "a partnership proposal with a distributor",
            "break-even math for a coffee shop", "an equity split between two cofounders",
            "whether to raise or bootstrap", "franchise vs independent restaurant",
            "monetizing a free app", "a one page strategy memo for the board",
        ],
        "n": 1600,
    },
    "finance": {
        "what": (
            "the user's OWN money: budgeting, debt payoff, saving, emergency funds, "
            "investing, retirement accounts, taxes, mortgages and refinancing, rent vs buy, "
            "insurance, credit scores, take-home pay math, whether they can afford a big "
            "purchase. NOT explaining how a financial instrument works (learning), NOT "
            "company money (business), NOT salary negotiation (resume_job), NOT analyzing a "
            "spreadsheet of transactions (data_analysis)."
        ),
        "domains": [
            "paying off 20k of credit card debt", "a monthly budget on a 60k salary",
            "whether to rent or buy a home", "maxing a 401k vs paying student loans",
            "building a six month emergency fund", "index funds in a Roth IRA",
            "refinancing a mortgage", "how much car they can actually afford",
            "taxes on 1099 freelance income", "getting a 610 credit score up",
            "saving for a house down payment", "whether they need life insurance",
            "take home pay after a raise", "consolidating loans at a lower rate",
            "saving for a kid's college", "splitting finances with a partner",
            "what to do with a 10k bonus", "cutting spending without feeling broke",
            "whether retiring at 55 is realistic", "an HSA vs a regular savings account",
        ],
        "n": 1600,
    },
    "health": {
        "what": (
            "the user's OWN body and wellbeing: workout and training programs, running and "
            "lifting plans, weight loss or muscle gain, nutrition targets and macros, "
            "symptoms, sleep, stress, mental health, injuries and rehab, habits tied to "
            "health, managing a condition. NOT explaining how the body works in the "
            "abstract (learning), NOT general cooking or meal planning without a body goal "
            "(planning)."
        ),
        "domains": [
            "a beginner strength training program", "training for a first half marathon",
            "losing 20 pounds without crash dieting", "protein and macros for lean muscle",
            "lower back pain from sitting all day", "runner's knee after a long run",
            "sleeping through the night", "burnout and constant work stress",
            "a home workout with only dumbbells", "eating for prediabetes",
            "a shoulder rehab routine after physio", "gaining weight as a skinny guy",
            "quitting caffeine without headaches", "a cough that won't go away",
            "anxiety before presentations", "getting back in shape after two years off",
            "cramps on long bike rides", "a bench press plateau",
            "returning to exercise postpartum", "quitting vaping",
        ],
        "n": 1600,
    },
    "math_help": {
        "what": (
            "solve, derive, or CHECK a specific quantitative problem with worked steps: "
            "algebra, calculus, statistics and probability, geometry, linear algebra, "
            "physics and chemistry problem sets, unit conversion, word problems, proofs, "
            "'check my work', homework. There is an actual problem with numbers in it. NOT "
            "a dataset, CSV, spreadsheet or SQL question (data_analysis), NOT explaining a "
            "concept with nothing to solve (learning), NOT a trivia numeric fact "
            "(simple_answer)."
        ),
        "domains": [
            "a quadratic equation to solve", "the derivative of a messy function",
            "a probability problem with two dice", "a related rates calculus problem",
            "a system of three linear equations", "a triangle geometry proof",
            "converting km/h to m/s", "a compound interest word problem",
            "checking a statistics homework answer", "a projectile motion problem",
            "balancing a chemical equation", "matrix multiplication and inverses",
            "an induction proof for a summation", "a confidence interval by hand",
            "a mixture problem with two solutions", "long division of polynomials",
            "permutations and combinations", "simplifying a trig identity",
            "a work rate problem with two pipes", "an eigenvalue calculation",
        ],
        "n": 900,
    },
    "translation": {
        "what": (
            "moving text BETWEEN LANGUAGES OR REGISTERS: translate this, how do you say X "
            "in Y, localize copy for a market, make it sound natural to a native speaker, "
            "adjust formality (tu/vous, keigo), explain what a foreign phrase means, correct "
            "grammar in a language they are not native in, subtitles and captions. NOT a "
            "plan or grammar lesson for LEARNING a language (learning), NOT rewriting "
            "English prose for tone (writing)."
        ),
        "domains": [
            "a paragraph from English to Spanish",
            "how to say 'thanks for your patience' in Japanese",
            "localizing app store copy for Brazil", "an email that sounds native in French",
            "tu vs vous in a business email", "keigo for a message to a Japanese manager",
            "what a German idiom actually means", "subtitles for a two minute video",
            "fixing the grammar in a message they wrote", "a menu in simplified Chinese",
            "a Latin phrase on a family crest", "Portuguese for Portugal vs Brazil",
            "a formal Korean apology", "a legal notice in Arabic",
            "an Italian text from a friend", "captions in English and Hindi",
            "a wedding invitation in Polish", "a Dutch sentence that sounds too stiff",
            "medical instructions for a patient", "a product name that works in German",
        ],
        "n": 1400,
    },
    "image_gen": {
        "what": (
            "wants a GENERATION PROMPT, or a better one, for an image / video / audio model "
            "(Midjourney, DALL-E, Stable Diffusion, Flux, Sora, Veo, Runway, Kling, "
            "Leonardo, Ideogram), or describes a visual they want generated: logo, "
            "thumbnail, poster, character art, product shot, album cover, storyboard, "
            "b-roll. Also negative prompts, aspect ratios, style/lighting/lens control, "
            "consistent characters across shots. NOT a UI to be designed and coded "
            "(app_builder), NOT a scene inside a story (writing), NOT the ad copy "
            "(marketing)."
        ),
        "domains": [
            "a Midjourney prompt for a cyberpunk street", "a logo concept for a coffee brand",
            "a YouTube thumbnail that gets clicks", "a Stable Diffusion negative prompt",
            "a Sora clip of a drone over mountains", "one character across several shots",
            "an album cover in 90s grunge style", "a product shot on marble",
            "a poster for a fake horror film", "a storyboard for a 15 second ad",
            "an anime style portrait of their dog", "a Flux prompt with cinematic lighting",
            "b-roll of a busy restaurant kitchen", "aspect ratio and lens settings",
            "a children's book illustration style", "a DALL-E prompt that keeps ignoring text",
            "a fantasy map of an invented kingdom", "a Runway video of a car at night",
            "an isometric game asset set", "a headshot for a fictional character",
        ],
        "n": 1600,
    },
    "quick_improve": {
        "what": (
            "the RESIDUAL catch-all only: vague, tiny, garbled or conversational input; "
            "general life advice and soft skills (public speaking, procrastination, "
            "awkward coworkers, saying no, staying motivated); and open idea generation "
            "(gift ideas, name ideas, things to try). NOT a short factual question, and NOT "
            "learning, planning, health, finance, or business — those are their own modes."
        ),
        "domains": [
            "a one word topic with no request", "a greeting and nothing else",
            "asking for help without saying what", "a half typed thought that trails off",
            "a bare noun phrase like 'productivity stuff'", "asking the AI what it can do",
            "an unclear 'make this better' with nothing attached",
            "testing whether the AI is working", "a topic plus 'idk'",
            "'can you help me with this thing'", "'not sure where to start'",
            "a message that is mostly typos", "tips for a soft skill like public speaking",
            "how to stop procrastinating", "gift ideas for a family member",
            "name ideas for a new puppy", "a passive aggressive coworker",
            "saying no without feeling guilty", "small talk at a networking event",
            "brainstorming things to do on a date",
        ],
        "n": 900,
    },
}


def parse_prompts(raw: str) -> list[str]:
    m = re.search(r"\{[\s\S]*\}", raw)
    if not m:
        return []
    try:
        obj = json.loads(m.group(0))
    except json.JSONDecodeError:
        return []
    items = obj.get("prompts")
    if not isinstance(items, list):
        return []
    out = []
    for it in items:
        if not isinstance(it, str):
            continue
        t = it.strip().strip('"')
        t = re.sub(r"^\s*\d+[\.\)]\s*", "", t)
        if 8 <= len(t) <= 600:
            out.append(t)
    return out


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", re.sub(r"\s+", " ", text.lower())).strip()


def verify_batch(texts: list[str], mode: str, model: str, host: str) -> list[bool]:
    """
    Screen a whole batch in one call by asking which items don't belong.

    Cheaper than classifying each prompt individually (this is a filter, not a
    labeler), so an occasional missed outlier is acceptable — but a malformed
    response must never silently drop good rows, hence the keep-all fallbacks.
    """
    # One line per item, or the indices the judge replies with won't line up.
    flat = [re.sub(r"\s+", " ", t).strip()[:300] for t in texts]
    listing = "\n".join(f"[{i}] {t}" for i, t in enumerate(flat))
    prompt = (
        f'All {len(texts)} requests below are supposed to belong to the mode "{mode}".\n'
        f"Using the mode definitions and rules, list the indices of any that do NOT "
        f'belong to "{mode}".\n\n{listing}\n\n'
        f'Return ONLY JSON: {{"wrong":[indices]}} — use an empty list if all of them fit.'
    )
    try:
        raw = ollama_chat(model, prompt, host, system=TAXONOMY, temperature=0)
    except (urllib.error.URLError, TimeoutError, OSError):
        return [True] * len(texts)

    m = re.search(r"\{[\s\S]*\}", raw)
    if not m:
        return [True] * len(texts)
    try:
        obj = json.loads(m.group(0))
    except json.JSONDecodeError:
        return [True] * len(texts)

    raw_wrong = obj.get("wrong")
    if not isinstance(raw_wrong, list):
        return [True] * len(texts)
    wrong: set[int] = set()
    for v in raw_wrong:
        try:
            i = int(v)
        except (TypeError, ValueError):
            continue
        if 0 <= i < len(texts):
            wrong.add(i)
    # A batch flagged as entirely wrong usually means the judge misread the task.
    if len(wrong) == len(texts):
        return [True] * len(texts)
    return [i not in wrong for i in range(len(texts))]


def load_existing(path: Path) -> tuple[list[dict], set[str]]:
    if not path.exists():
        return [], set()
    rows, keys = [], set()
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            r = json.loads(line)
        except json.JSONDecodeError:
            continue
        rows.append(r)
        keys.add(norm(r["text"]))
    return rows, keys


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=RAW / "synth.jsonl")
    ap.add_argument("--model", type=str, default="qwen3:8b")
    ap.add_argument("--host", type=str, default="http://127.0.0.1:11434")
    ap.add_argument("--per-call", type=int, default=12)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--scale", type=float, default=1.0, help="multiply every mode target")
    ap.add_argument("--only", type=str, default="", help="comma separated modes")
    ap.add_argument("--verify", action="store_true", help="drop prompts that don't fit their mode")
    ap.add_argument(
        "--verify-each",
        action="store_true",
        help="classify every prompt individually instead of screening per batch (12x slower)",
    )
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    existing, seen = load_existing(args.out)
    have = {m: 0 for m in MODE_SPECS}
    for r in existing:
        have[r["mode"]] = have.get(r["mode"], 0) + 1
    print(f"existing synth rows: {len(existing)}")

    only = {m.strip() for m in args.only.split(",") if m.strip()}
    jobs: list[tuple[str, str, str]] = []
    for mode, spec in MODE_SPECS.items():
        if only and mode not in only:
            continue
        target = int(spec["n"] * args.scale)
        need = max(0, target - have.get(mode, 0))
        calls = -(-need // args.per_call)
        for _ in range(calls):
            jobs.append((mode, rng.choice(spec["domains"]), rng.choice(STYLES)))
        print(f"  {mode:15} have={have.get(mode, 0):5} target={target:5} calls={calls}")

    rng.shuffle(jobs)
    if not jobs:
        print("nothing to generate")
        return

    args.out.parent.mkdir(parents=True, exist_ok=True)
    fh = args.out.open("a", encoding="utf-8")
    lock = threading.Lock()
    stats = {"calls": 0, "kept": 0, "dupe": 0, "rejected": 0}
    total_calls = len(jobs)

    def work(job: tuple[str, str, str]) -> None:
        mode, domain, style = job
        spec = MODE_SPECS[mode]
        prompt = (
            f"Generate {args.per_call} different things a user might type into an AI chat box.\n\n"
            f"They all belong to this category:\n{spec['what']}\n\n"
            f"Loose subject matter: {domain}. Vary the specifics — do not repeat the same wording.\n"
            f"Typing style for these: {style}.\n\n"
            f"Remember: raw messy user input, never a polished or structured prompt."
        )
        try:
            raw = ollama_chat(
                args.model,
                prompt,
                args.host,
                system=GEN_SYSTEM,
                temperature=1.0,
            )
        except (urllib.error.URLError, TimeoutError, OSError):
            with lock:
                stats["calls"] += 1
            return

        candidates = parse_prompts(raw)
        accepted: list[str] = []
        for text in candidates:
            key = norm(text)
            if not key:
                continue
            with lock:
                if key in seen:
                    stats["dupe"] += 1
                    continue
                seen.add(key)
            accepted.append(text)

        verified: list[str] = []
        if args.verify and accepted:
            if args.verify_each:
                for text in accepted:
                    try:
                        got = classify_one(text, args.model, args.host)
                    except (urllib.error.URLError, TimeoutError, OSError):
                        got = None
                    if got == mode:
                        verified.append(text)
                    else:
                        with lock:
                            stats["rejected"] += 1
            else:
                keep = verify_batch(accepted, mode, args.model, args.host)
                for text, ok in zip(accepted, keep):
                    if ok:
                        verified.append(text)
                    else:
                        with lock:
                            stats["rejected"] += 1
        else:
            verified = accepted

        with lock:
            for text in verified:
                fh.write(
                    json.dumps(
                        {
                            "text": text,
                            "mode": mode,
                            "source": "synth",
                            "domain": domain,
                            "style": style,
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
                stats["kept"] += 1
            stats["calls"] += 1
            if stats["calls"] % 25 == 0:
                fh.flush()
                print(
                    f"  {stats['calls']}/{total_calls} calls | kept={stats['kept']} "
                    f"dupe={stats['dupe']} rejected={stats['rejected']}",
                    flush=True,
                )

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = [ex.submit(work, j) for j in jobs]
        for _ in as_completed(futures):
            pass

    fh.close()
    print(
        f"\nkept={stats['kept']} dupes={stats['dupe']} rejected={stats['rejected']} -> {args.out}"
    )


if __name__ == "__main__":
    main()
