"""Penilaian pretest/posttest per tahap — sumber kebenaran skor resmi.

Logika sama dengan frontend/src/features/assessment/lib/scoring.js.
Tahap numerik/pilihan dinilai otomatis; tahap uraian berstatus "pending" sampai dinilai guru.
"""
from __future__ import annotations

import ast
import json
import operator
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

INSTRUMENT_PATH = Path(__file__).resolve().parent.parent / "data" / "instrumen_literasi.json"


@lru_cache
def load_instrument() -> dict:
    return json.loads(INSTRUMENT_PATH.read_text(encoding="utf-8"))


def stage_index() -> dict[tuple[int, int], dict]:
    """{(no_soal, no_tahap): data tahap + konteks soal}."""
    out: dict[tuple[int, int], dict] = {}
    for item in load_instrument()["items"]:
        for st in item["stages"]:
            out[(item["no"], st["no"])] = {**st, "item_no": item["no"]}
    return out


def public_instrument() -> dict:
    """Instrumen tanpa kunci & rubrik (untuk dikirim ke aplikasi siswa)."""
    data = load_instrument()
    items = []
    for item in data["items"]:
        stages = [
            {k: v for k, v in st.items() if k not in ("key", "rubric", "needs_confirmation")}
            for st in item["stages"]
            if st.get("input")
        ]
        items.append({**{k: v for k, v in item.items() if k not in ("stages", "needs_confirmation")}, "stages": stages})
    return {**data, "items": items}


# ------------------------------------------------------------------ persamaan
_OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv}


def normalize_equation(s: Any) -> str:
    s = str(s or "").lower()
    s = re.sub(r"\s+", "", s)
    for a, b in (("−", "-"), ("–", "-"), ("—", "-"), ("×", "*"), ("·", "*"), (":", "/"), ("÷", "/"), (",", "."), ("u", "∪")):
        s = s.replace(a, b)
    return s


def _eval(node: ast.AST, x: float) -> float:
    if isinstance(node, ast.Expression):
        return _eval(node.body, x)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.Name) and node.id == "x":
        return x
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_eval(node.left, x), _eval(node.right, x))
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.USub, ast.UAdd)):
        v = _eval(node.operand, x)
        return -v if isinstance(node.op, ast.USub) else v
    raise ValueError("ekspresi tidak didukung")


def solve_linear(eq: Any) -> float | None:
    s = normalize_equation(eq)
    s = re.sub(r"n\([^)]*\)", "x", s)
    s = re.sub(r"[a-z?∪∩]+", "x", s)
    s = re.sub(r"(\d)x", r"\1*x", s)
    parts = s.split("=")
    if len(parts) != 2 or not all(parts) or "x" not in s or not re.fullmatch(r"[0-9x+\-*/().=]+", s):
        return None
    try:
        left, right = (ast.parse(p, mode="eval") for p in parts)
        f = lambda x: _eval(left, x) - _eval(right, x)  # noqa: E731
        f0 = f(0)
        slope = f(1) - f0
        if abs(slope) < 1e-9:
            return None
        sol = -f0 / slope
        if abs(f(sol + 7) - (f0 + slope * (sol + 7))) > 1e-6:
            return None
        return sol
    except (SyntaxError, ValueError, ZeroDivisionError):
        return None


def _sides(s: str) -> list[str]:
    """Setiap sisi persamaan → suku-suku terurut (urutan suku boleh ditukar)."""
    return ["".join(sorted(t for t in re.split(r"(?=[+-])", p if p[:1] in "+-" else f"+{p}") if t)) for p in s.split("=")]


def same_formula(a: Any, b: Any) -> bool:
    na, nb = normalize_equation(a), normalize_equation(b)
    if na == nb:
        return True
    sa, sb = _sides(na), _sides(nb)
    if len(sa) != 2 or len(sb) != 2:
        return False
    return (sa[0] == sb[0] and sa[1] == sb[1]) or (sa[0] == sb[1] and sa[1] == sb[0])


# ------------------------------------------------------------------ penilaian
def _is_blank(v: Any) -> bool:
    if v is None:
        return True
    if isinstance(v, str):
        return not v.strip()
    if isinstance(v, dict):
        return not v.get("choice") and not str(v.get("text", "")).strip()
    return False


def score_stage(value: Any, stage: dict) -> tuple[int | None, str]:
    """Mengembalikan (skor_otomatis, status)."""
    max_score = stage.get("score")
    if max_score is None:
        return None, "unscored"
    if _is_blank(value):
        return 0, "blank"
    kind = stage.get("input")
    key = stage.get("key")
    if kind == "numeric":
        try:
            return (max_score if float(str(value).replace(",", ".")) == float(key) else 0), "auto"
        except ValueError:
            return 0, "auto"
    if kind == "choice":
        return (max_score if value == key else 0), "auto"
    if kind == "choice+text":
        return (max_score if isinstance(value, dict) and value.get("choice") == key else 0), "auto"
    if kind == "equation":
        key_sol = solve_linear(key)
        if key_sol is not None:
            sol = solve_linear(value)
            if sol is not None and abs(sol - key_sol) < 1e-9 and len(re.findall(r"\d+", normalize_equation(value))) >= 2:
                return max_score, "auto"
        elif same_formula(value, key):
            return max_score, "auto"
        return None, "pending"
    return None, "pending"


def summarize(answers: list) -> dict:
    """Ringkasan skor sebuah percobaan dalam format yang dibaca aplikasi.

    `answers` adalah daftar objek Answer (atribut item_no, stage_no, auto_score, manual_score, status).
    """
    by_key = {(a.item_no, a.stage_no): a for a in answers}
    items: dict[int, dict] = {}
    for (item_no, stage_no), st in stage_index().items():
        if not st.get("input"):
            continue
        items.setdefault(item_no, {"no": item_no, "stages": [], "auto": 0, "pending": 0, "max": 0, "total": 0})
        it = items[item_no]
        a = by_key.get((item_no, stage_no))
        max_score = st.get("score")
        if a is None:
            score, status = (0, "blank") if max_score is not None else (None, "unscored")
        elif a.manual_score is not None:
            score, status = a.manual_score, "manual"
        else:
            score, status = a.auto_score, a.status
        it["stages"].append({"no": stage_no, "score": score, "max": max_score, "status": status})
        if max_score:
            it["max"] += max_score
        if status == "pending":
            it["pending"] += 1
        elif score:
            it["total"] += score
            if status == "auto":
                it["auto"] += score
    lst = sorted(items.values(), key=lambda i: i["no"])
    return {
        "items": lst,
        "autoTotal": sum(i["auto"] for i in lst),
        "total": sum(i["total"] for i in lst),
        "pendingCount": sum(i["pending"] for i in lst),
        "max": sum(i["max"] for i in lst),
    }


def n_gain(pre: float | None, post: float | None, max_score: float) -> tuple[float | None, str | None]:
    if pre is None or post is None or max_score - pre == 0:
        return None, None
    g = (post - pre) / (max_score - pre)
    return g, "tinggi" if g >= 0.7 else "sedang" if g >= 0.3 else "rendah"
