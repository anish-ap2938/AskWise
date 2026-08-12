#!/usr/bin/env python3
"""
Build AskWise prompt-engineering SFT data.

Combines:
  1) Instant seed rows (seed_sft.jsonl from npm run train:export-seed)
  2) Large synthetic messy→structured/advanced pairs (prompt rewrite task)
  3) Optional Hugging Face rewrite/prompt corpora adapted into AskWise JSON shape

Designed so fine-tuning teaches: fix spelling, structure prompts, never answer the task.
"""

from __future__ import annotations

import argparse
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

SYSTEM_TMPL = """Rewrite rough user text into a better prompt for another AI. Do NOT answer the task.

Return ONLY JSON: {{"structured":"...","advanced":"..."}}
Rules:
- Preserve intent and facts; fix spelling/grammar silently.
- Keep code, URLs, paths, quotes, identifiers exact.
- structured: short usable prompt (≤110 words).
- advanced: sharper executable prompt (≤200 words) with role, method, output contract, acceptance checks — only if useful.
- Prefer polishing the Instant draft over inventing a new template.
- Mode focus: {mode}"""

# (mode, messy_user_prompt, topic_hint for drafts)
SYNTH_SEEDS: list[tuple[str, str, str]] = [
    # app_builder
    ("app_builder", "i want to bild an app for my backery orders", "bakery order tracking app"),
    ("app_builder", "make me a fitnes tracker with meals and workouts", "fitness + meal tracker"),
    ("app_builder", "chrome extention that rewrites prompts like grammerly", "prompt rewrite Chrome extension"),
    ("app_builder", "saas mvp for freelancers to send invoices", "freelancer invoicing SaaS"),
    ("app_builder", "habit tracker with streaks and reminders", "habit tracker with streaks"),
    ("app_builder", "build a job aplication tracker with kanban", "job application kanban tracker"),
    ("app_builder", "discord bot that logs standup updates", "Discord standup logger bot"),
    ("app_builder", "mobile app for spliting resturant bills", "bill-splitting mobile app"),
    ("app_builder", "internal tool for my team to aproove PTO", "PTO approval internal tool"),
    ("app_builder", "landing page + waitlist for my AI note taker", "AI note-taker waitlist landing page"),
    # coding_debug
    ("coding_debug", "my react login button does nothing when clicked", "React login button no-op"),
    ("coding_debug", "page is slow takes 8 seconds to load on mobile", "slow mobile page load"),
    ("coding_debug", "postgres query timing out on users join orders", "Postgres join timeout"),
    ("coding_debug", "cors error calling localhost:3000 from vite", "Vite CORS to localhost API"),
    ("coding_debug", "typescript error Property x does not exist on type never", "TS property on never"),
    ("coding_debug", "docker compose cant reach redis from api container", "Docker Compose Redis connectivity"),
    ("coding_debug", "nextjs hydration mismatch on theme toggle", "Next.js hydration mismatch"),
    ("coding_debug", "python fastapi 422 on nested pydantic model", "FastAPI 422 nested model"),
    ("coding_debug", "git merge conflict in package-lock after rebase", "git merge conflict package-lock"),
    ("coding_debug", "websocket disconnects every 30s behind nginx", "WebSocket disconnect behind nginx"),
    # resume_job
    ("resume_job", "fix my resume so it passes ats for swe intern", "ATS resume for SWE intern"),
    ("resume_job", "help me negotiate salary after a 95k offer", "salary negotiation after offer"),
    ("resume_job", "write a cold email to hiring manager at stripe", "cold email to hiring manager"),
    ("resume_job", "rewrite my linkedin about for data analyst", "LinkedIn About for data analyst"),
    ("resume_job", "cover letter for product manager role at fintech", "PM cover letter fintech"),
    ("resume_job", "how do i explain a 8 month career gap", "career gap explanation"),
    ("resume_job", "behavioral interview answers for conflict with coworker", "behavioral interview conflict"),
    ("resume_job", "tailor this resume bullet for backend engineer", "tailor resume bullet backend"),
    # writing
    ("writing", "draft a wedding toast for my best freind", "wedding toast best friend"),
    ("writing", "email my boss asking for a raise politely", "raise request email"),
    ("writing", "rewrite this slack update to sound less robotic", "humanize Slack update"),
    ("writing", "blog outline about local first chrome extentions", "blog outline local-first extensions"),
    ("writing", "apology email to a client for missed deadline", "client apology missed deadline"),
    ("writing", "product launch announcement for discord community", "product launch Discord post"),
    ("writing", "short linkedin post about shipping an mvp", "LinkedIn MVP ship post"),
    ("writing", "brainstorm newsletter topics for indie hackers", "indie hacker newsletter ideas"),
    # research
    ("research", "compare postgres vs mysql for a saas mvp", "Postgres vs MySQL for SaaS"),
    ("research", "research competitors for habit tracking apps", "habit tracker competitive research"),
    ("research", "best practices for webgpu llm in the browser 2026", "WebGPU in-browser LLM practices"),
    ("research", "what are tradeoffs of qlora vs full finetune 1.5b", "QLoRA vs full FT for 1.5B"),
    ("research", "summarize pros cons of vector dbs for rag", "vector DB pros/cons for RAG"),
    ("research", "find pricing models for chrome extension saas", "Chrome extension SaaS pricing"),
    # data_analysis
    ("data_analysis", "excel formula to sum values between two dates", "Excel SUMIFS between dates"),
    ("data_analysis", "python pandas groupby revenue by month and region", "pandas groupby month region"),
    ("data_analysis", "sql to find churned users last 90 days", "SQL churned users 90 days"),
    ("data_analysis", "make a chart brief for dau mau retention", "DAU/MAU retention chart brief"),
    ("data_analysis", "clean messy csv with missing emails and dupes", "clean CSV missing emails/dupes"),
    # simple_answer / learning
    ("simple_answer", "explain the krebs cycle step by step", "Krebs cycle explanation"),
    ("simple_answer", "what is dns in plain english", "DNS plain-English explanation"),
    ("simple_answer", "how does oauth2 authorization code flow work", "OAuth2 auth code flow"),
    ("simple_answer", "eli5 transformers attention", "attention ELI5"),
    ("simple_answer", "difference between tcp and udp", "TCP vs UDP"),
    # agent_task
    ("agent_task", "plan a 2 week launch checklist for askwise chrome store", "Chrome store launch checklist"),
    ("agent_task", "break down migrating our app from pages to app router", "Next.js pages→app router plan"),
    ("agent_task", "create a research then draft then review workflow for blog posts", "blog research→draft→review workflow"),
    ("agent_task", "agent steps to scrape product prices and alert on drops", "price scrape + alert agent plan"),
    # quick_improve
    ("quick_improve", "make this better: write code for a todo app", "improve vague todo-app ask"),
    ("quick_improve", "improve: tell me about machine learning", "improve vague ML ask"),
    ("quick_improve", "fix spelling and make this a good prompt: help with marketing", "improve vague marketing ask"),
]

MESSY_PREFIXES = [
    "hey can u ",
    "pls ",
    "quick q — ",
    "ok so ",
    "need help: ",
    "",
    "yo ",
    "urgent: ",
]

MESSY_SUFFIXES = [
    "",
    " thx",
    " asap",
    " keep it short",
    " im a beginner",
    " for chatgpt",
    " dont be vague",
]


def system_prompt(mode: str) -> str:
    return SYSTEM_TMPL.format(mode=mode)


def make_structured(topic: str, mode: str) -> str:
    return (
        f"You are an expert assistant for {mode.replace('_', ' ')}.\n"
        f"Task: Help with {topic}.\n"
        f"Ask up to 3 clarifying questions only if critical facts are missing, then deliver a concrete plan.\n"
        f"Output: clear sections, actionable next steps, and any assumptions you made."
    )


def make_advanced(topic: str, mode: str) -> str:
    return (
        f"Role: Senior specialist in {mode.replace('_', ' ')}.\n"
        f"Goal: Produce an executable answer for: {topic}.\n"
        f"Method: (1) restate goals/constraints, (2) propose a structured approach, "
        f"(3) give concrete artifacts (steps, snippets, or templates), (4) list risks/edge cases.\n"
        f"Output contract: markdown with headings; include acceptance checks the user can verify.\n"
        f"Constraints: be specific; no filler; prefer checklists and examples over theory."
    )


def user_block(raw: str, structured: str, advanced: str, target: str = "chatgpt") -> str:
    return (
        f"Target: {target}.\n\n"
        f"User request:\n<raw_prompt>{raw}</raw_prompt>\n"
        f"Instant draft (scaffold — polish, fix spelling, tighten; keep unique structure):\n"
        f"<structured_draft>{structured[:900]}</structured_draft>\n"
        f"<advanced_draft>{advanced[:1200]}</advanced_draft>"
    )


def row(mode: str, raw: str, topic: str) -> dict:
    structured = make_structured(topic, mode)
    advanced = make_advanced(topic, mode)
    # Teacher target: cleaned structured/advanced (spelling fixed in topic already)
    assistant = json.dumps(
        {"structured": structured, "advanced": advanced},
        ensure_ascii=False,
    )
    return {
        "messages": [
            {"role": "system", "content": system_prompt(mode)},
            {"role": "user", "content": user_block(raw, structured, advanced)},
            {"role": "assistant", "content": assistant},
        ],
        "meta": {"mode": mode, "source": "synthetic", "topic": topic},
    }


def expand_synthetic(rng: random.Random, copies: int) -> list[dict]:
    out: list[dict] = []
    for mode, messy, topic in SYNTH_SEEDS:
        variants = {messy}
        for _ in range(copies):
            pref = rng.choice(MESSY_PREFIXES)
            suf = rng.choice(MESSY_SUFFIXES)
            text = f"{pref}{messy}{suf}".strip()
            # light casing noise
            if rng.random() < 0.4 and text:
                text = text[0].lower() + text[1:]
            variants.add(text)
        for raw in variants:
            out.append(row(mode, raw, topic))
    return out


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def adapt_hf_prompt_rows(limit: int, rng: random.Random) -> list[dict]:
    """Pull public corpora and reshape into AskWise rewrite JSON when possible."""
    try:
        from datasets import load_dataset
    except ImportError:
        print("datasets not installed — skipping HF corpora")
        return []

    adapted: list[dict] = []

    # 1) Awesome ChatGPT prompts — treat prompt as advanced target, invent messy user ask
    try:
        ds = load_dataset("fka/awesome-chatgpt-prompts", split="train")
        n = min(limit // 2, len(ds))
        for i in rng.sample(range(len(ds)), k=n):
            act = str(ds[i].get("act") or "assistant").strip()
            prompt = str(ds[i].get("prompt") or "").strip()
            if len(prompt) < 40:
                continue
            mode = "quick_improve"
            topic = act.lower()
            messy = f"make a good prompt for acting as {act}"
            if rng.random() < 0.5:
                messy = f"help me write a prompt that acts like a {act}, keep it usefull"
            structured = (
                f"You are a prompt engineer. Create a clear role prompt for: {act}.\n"
                f"Include goal, constraints, and desired output format in under 110 words."
            )
            advanced = prompt[:900]
            assistant = json.dumps(
                {"structured": structured, "advanced": advanced[:1200]},
                ensure_ascii=False,
            )
            adapted.append(
                {
                    "messages": [
                        {"role": "system", "content": system_prompt(mode)},
                        {
                            "role": "user",
                            "content": user_block(messy, structured, advanced[:1200]),
                        },
                        {"role": "assistant", "content": assistant},
                    ],
                    "meta": {"mode": mode, "source": "awesome-chatgpt-prompts", "act": act},
                }
            )
        print(f"HF awesome-chatgpt-prompts -> {len(adapted)} rows")
    except Exception as e:
        print(f"skip awesome-chatgpt-prompts: {e}")

    # 2) SmolTalk rewrite subset — map rewrite tasks to prompt-polish examples
    before = len(adapted)
    try:
        ds = load_dataset(
            "HuggingFaceTB/smoltalk",
            "smol-rewrite",
            split="train",
            trust_remote_code=True,
        )
        n = min(limit - len(adapted), 400, len(ds))
        idxs = rng.sample(range(len(ds)), k=n) if len(ds) > n else range(n)
        for i in idxs:
            ex = ds[int(i)]
            messages = ex.get("messages") or []
            user_txt = ""
            asst_txt = ""
            for m in messages:
                if m.get("role") == "user" and not user_txt:
                    user_txt = str(m.get("content") or "")
                if m.get("role") == "assistant":
                    asst_txt = str(m.get("content") or "")
            if len(user_txt) < 20 or len(asst_txt) < 20:
                continue
            # Frame as: messy ask to rewrite X → structured prompt asking an AI to rewrite
            mode = "writing"
            topic = "text rewrite / tone polish"
            messy = f"rewrite this better: {user_txt[:280]}"
            structured = (
                "You are an expert editor. Rewrite the user's text for clarity and tone.\n"
                "Preserve meaning and facts. Return only the revised text plus 3 bullet notes on changes."
            )
            advanced = (
                "Role: Senior editor.\n"
                f"Task: Rewrite the source text per the user request.\n"
                f"Source:\n{user_txt[:500]}\n"
                "Method: fix grammar, tighten wording, keep voice unless asked otherwise.\n"
                "Output: revised text, then a short change log."
            )
            # Prefer teaching JSON shape; assistant advanced can echo a prompt not the rewrite answer
            assistant = json.dumps(
                {
                    "structured": structured,
                    "advanced": advanced[:1200],
                },
                ensure_ascii=False,
            )
            adapted.append(
                {
                    "messages": [
                        {"role": "system", "content": system_prompt(mode)},
                        {
                            "role": "user",
                            "content": user_block(messy, structured, advanced),
                        },
                        {"role": "assistant", "content": assistant},
                    ],
                    "meta": {"mode": mode, "source": "smoltalk-smol-rewrite"},
                }
            )
        print(f"HF smoltalk/smol-rewrite -> {len(adapted) - before} rows")
    except Exception as e:
        print(f"skip smoltalk rewrite: {e}")

    return adapted[:limit]


def teacher_polish_gpu(rows: list[dict], model_id: str, max_rows: int) -> list[dict]:
    """Optional: use base instruct model on GPU to polish assistant JSON targets."""
    if max_rows <= 0:
        return rows

    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    if not torch.cuda.is_available():
        raise SystemExit("CUDA required for --teacher-gpu polish")

    print(f"Teacher polish on GPU: {torch.cuda.get_device_name(0)} ({max_rows} rows)")
    tok = AutoTokenizer.from_pretrained(model_id, use_fast=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        attn_implementation="sdpa",
    )
    model.eval()

    polished: list[dict] = []
    for i, r in enumerate(rows[:max_rows]):
        messages = r["messages"][:2]  # system + user
        prompt = tok.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = tok(prompt, return_tensors="pt").to(model.device)
        with torch.inference_mode():
            out = model.generate(
                **inputs,
                max_new_tokens=512,
                do_sample=False,
                pad_token_id=tok.eos_token_id,
            )
        gen = tok.decode(out[0][inputs["input_ids"].shape[-1] :], skip_special_tokens=True)
        # Keep only if looks like JSON with both keys
        m = re.search(r"\{[\s\S]*\}", gen)
        ok = False
        if m:
            try:
                obj = json.loads(m.group(0))
                if isinstance(obj.get("structured"), str) and isinstance(obj.get("advanced"), str):
                    clone = json.loads(json.dumps(r))
                    clone["messages"][2]["content"] = json.dumps(
                        {
                            "structured": obj["structured"][:2000],
                            "advanced": obj["advanced"][:3000],
                        },
                        ensure_ascii=False,
                    )
                    clone["meta"] = {**(clone.get("meta") or {}), "teacher": "gpu"}
                    polished.append(clone)
                    ok = True
            except json.JSONDecodeError:
                ok = False
        if not ok:
            polished.append(r)
        if (i + 1) % 25 == 0:
            print(f"  teacher {i + 1}/{max_rows}")

    # Append remaining unpolished rows
    polished.extend(rows[max_rows:])
    del model
    torch.cuda.empty_cache()
    return polished


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=Path, default=ROOT / "data" / "seed_sft.jsonl")
    ap.add_argument("--out", type=Path, default=ROOT / "data" / "prompt_sft.jsonl")
    ap.add_argument("--synth-copies", type=int, default=4)
    ap.add_argument("--hf-limit", type=int, default=600, help="max rows from HF corpora")
    ap.add_argument("--no-hf", action="store_true")
    ap.add_argument(
        "--teacher-gpu",
        type=int,
        default=0,
        help="polish first N synthetic rows with base model on GPU (0=off)",
    )
    ap.add_argument("--teacher-model", type=str, default="Qwen/Qwen2.5-1.5B-Instruct")
    ap.add_argument("--seed-rng", type=int, default=42)
    args = ap.parse_args()

    rng = random.Random(args.seed_rng)
    seed_rows = load_jsonl(args.seed)
    print(f"seed Instant rows: {len(seed_rows)}")

    synth = expand_synthetic(rng, args.synth_copies)
    print(f"synthetic rows: {len(synth)}")

    hf_rows: list[dict] = []
    if not args.no_hf and args.hf_limit > 0:
        hf_rows = adapt_hf_prompt_rows(args.hf_limit, rng)
        print(f"HF adapted rows: {len(hf_rows)}")

    combined = seed_rows + synth + hf_rows
    if args.teacher_gpu > 0:
        # Prefer polishing synthetic first (higher leverage)
        head = synth[: args.teacher_gpu]
        rest = seed_rows + synth[args.teacher_gpu :] + hf_rows
        polished_head = teacher_polish_gpu(head, args.teacher_model, len(head))
        combined = polished_head + rest

    rng.shuffle(combined)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as f:
        for r in combined:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
        print(f"Wrote {len(combined)} rows -> {args.out}")


if __name__ == "__main__":
    main()
