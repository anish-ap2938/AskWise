"""
Feature analyzer for the AskWise intent classifier.

MUST stay byte-for-byte equivalent to src/shared/intentFeatures.ts.
Any change here requires the same change there (there is a parity test).
"""

from __future__ import annotations

import re

WORD_RE = re.compile(r"[a-z0-9']+")
CODE_RE = re.compile(r"```[\s\S]*?```|`[^`]+`")
URL_RE = re.compile(r"https?://")
TRACE_RE = re.compile(r"traceback|stacktrace|stack trace|line \d+", re.I)
HTTPERR_RE = re.compile(r"\b(400|401|403|404|409|422|429|500|502|503|504)\b")

MAX_WORDS = 120
MAX_CHARGRAM_WORDS = 60
MAX_WORD_LEN = 24


def wc_bucket(n: int) -> str:
    if n <= 3:
        return "a"
    if n <= 8:
        return "b"
    if n <= 15:
        return "c"
    if n <= 30:
        return "d"
    if n <= 60:
        return "e"
    return "f"


def analyze(text: str) -> list[str]:
    lowered = text.lower()
    words = WORD_RE.findall(lowered)[:MAX_WORDS]
    toks: list[str] = []

    toks.extend(words)
    for a, b in zip(words, words[1:]):
        toks.append(f"{a} {b}")

    for w in words[:MAX_CHARGRAM_WORDS]:
        s = f" {w[:MAX_WORD_LEN]} "
        for n in (3, 4, 5):
            if len(s) < n:
                continue
            for i in range(len(s) - n + 1):
                toks.append("#" + s[i : i + n])

    if CODE_RE.search(text):
        toks.append("§code")
    if URL_RE.search(lowered):
        toks.append("§url")
    if TRACE_RE.search(text):
        toks.append("§trace")
    if HTTPERR_RE.search(text):
        toks.append("§httperr")
    if text.rstrip().endswith("?"):
        toks.append("§q")
    toks.append("§wc" + wc_bucket(len(words)))
    if words:
        toks.append("§first_" + words[0])

    return toks
