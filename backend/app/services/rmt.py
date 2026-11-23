"""Asesmen dinamis berbasis Rigorous Mathematical Thinking (Kinard & Kozulin, 2008).

Yang dinilai bukan hanya benar/salah, tetapi BERAPA BANYAK bantuan (mediasi) yang dibutuhkan siswa,
dan apakah kebutuhan bantuan itu berkurang dari modul ke modul (potensi belajar).

Logika ini sama dengan frontend/src/features/learn/lib/rmt.js. Jaga keduanya tetap sama.
"""

from typing import Any

POTENTIAL = [(0.75, "Mandiri"), (0.4, "Berkembang dengan bantuan"), (0.0, "Perlu pendampingan")]


def help_level(entry: dict[str, Any]) -> int:
    """0 = mandiri, 1 = bantuan ringan, 2 = bantuan banyak."""
    wrong = int(entry.get("wrong") or 0)
    hints = int(entry.get("hints") or 0)
    if wrong == 0 and hints == 0:
        return 0
    if wrong <= 2 and hints <= 1:
        return 1
    return 2


def module_summary(steps: dict[str, Any] | None) -> dict[str, Any]:
    """Ringkasan satu modul. index = indeks kemandirian 0–1 (None bila belum ada langkah yang selesai)."""
    solved = [s for s in (steps or {}).values() if isinstance(s, dict) and s.get("solved")]
    levels = [help_level(s) for s in solved]
    index = round(sum((2 - lv) / 2 for lv in levels) / len(levels), 2) if levels else None
    return {
        "graded": len(solved),
        "mandiri": levels.count(0),
        "sedikit": levels.count(1),
        "banyak": levels.count(2),
        "hints": sum(int(s.get("hints") or 0) for s in solved),
        "index": index,
    }


def potential_label(index: float | None) -> str | None:
    if index is None:
        return None
    return next(label for minimum, label in POTENTIAL if index >= minimum)


def independence_trend(indices: list[float | None]) -> float | None:
    """Modul terakhir − modul pertama yang dikerjakan. Positif = makin mandiri setelah dibimbing."""
    done = [x for x in indices if x is not None]
    if len(done) < 2:
        return None
    return round(done[-1] - done[0], 2)


def _module_order(module_id: str) -> int:
    return int(module_id[1:]) if module_id[1:].isdigit() else 99


def student_profile(logs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """Profil proses belajar seorang siswa dari catatan semua modulnya ({module_id: steps})."""
    modules = {mid: module_summary(steps) for mid, steps in sorted(logs.items(), key=lambda kv: _module_order(kv[0]))}
    indices = [m["index"] for m in modules.values()]
    done = [x for x in indices if x is not None]
    overall = round(sum(done) / len(done), 2) if done else None
    return {
        "modules": modules,
        "index": overall,
        "potential": potential_label(overall),
        "trend": independence_trend(indices),
        "hints": sum(m["hints"] for m in modules.values()),
    }
