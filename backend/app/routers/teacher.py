import csv
import hmac
import io
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..config import get_settings
from ..database import get_db
from ..models import Answer, Attempt, Student
from ..schemas import ScoreIn, TeacherLoginIn
from ..security import require_teacher, teacher_token
from ..services.scoring import n_gain, stage_index, summarize

router = APIRouter(prefix="/teacher", tags=["guru"])


@router.post("/login")
def login(body: TeacherLoginIn) -> dict:
    if not hmac.compare_digest(body.pin, get_settings().teacher_pin):
        raise HTTPException(401, "PIN salah.")
    return {"token": teacher_token()}


def _all_students(db: Session) -> list[Student]:
    """Seluruh siswa di database (global, tanpa filter kelas) beserta pengerjaan & jawabannya."""
    stmt = (
        select(Student)
        .options(selectinload(Student.attempts).selectinload(Attempt.answers))
        .order_by(Student.name, Student.id)
    )
    return list(db.scalars(stmt).all())


def _latest(student: Student, kind: str) -> Attempt | None:
    subs = [a for a in student.attempts if a.type == kind and a.status == "submitted"]
    return max(subs, key=lambda a: a.submitted_at or datetime.min.replace(tzinfo=timezone.utc)) if subs else None


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


@router.get("/summary", dependencies=[Depends(require_teacher)])
def summary(db: Session = Depends(get_db)) -> list[dict]:
    """Satu tabel rekap global: semua siswa, skor pretest/posttest, dan N-gain."""
    out = []
    for s in _all_students(db):
        pre, post = _latest(s, "pre"), _latest(s, "post")
        in_progress = sorted({a.type for a in s.attempts if a.status != "submitted"})
        ps = summarize(pre.answers) if pre else None
        qs = summarize(post.answers) if post else None
        max_score = (ps or qs or {"max": 24})["max"]
        g, cat = n_gain(ps["total"] if ps else None, qs["total"] if qs else None, max_score)
        out.append(
            {
                "student_id": s.id,
                "name": s.name,
                "nis": s.nis,
                "pre": ps["total"] if ps else None,
                "post": qs["total"] if qs else None,
                "pre_pending": ps["pendingCount"] if ps else 0,
                "post_pending": qs["pendingCount"] if qs else 0,
                "pre_submitted_at": _iso(pre.submitted_at) if pre else None,
                "post_submitted_at": _iso(post.submitted_at) if post else None,
                "in_progress": in_progress,
                "max": max_score,
                "ngain": g,
                "category": cat,
            }
        )
    return out


@router.get("/grading-queue", dependencies=[Depends(require_teacher)])
def grading_queue(db: Session = Depends(get_db)) -> list[dict]:
    stages = stage_index()
    rows = db.execute(
        select(Answer, Attempt, Student)
        .join(Attempt, Answer.attempt_id == Attempt.id)
        .join(Student, Attempt.student_id == Student.id)
        .where(Attempt.status == "submitted",Answer.status == "pending", Answer.manual_score.is_(None))
        .order_by(Answer.item_no, Answer.stage_no, Student.name)
    ).all()
    out = []
    for ans, att, stu in rows:
        st = stages[(ans.item_no, ans.stage_no)]
        out.append(
            {
                "answer_id": ans.id,
                "student_name": stu.name,
                "type": att.type,
                "item_no": ans.item_no,
                "stage_no": ans.stage_no,
                "prompt": st.get("prompt"),
                "rubric": st.get("rubric"),
                "max": st.get("score") or 0,
                "value": ans.value,
            }
        )
    return out


@router.put("/answers/{answer_id}/score", dependencies=[Depends(require_teacher)])
def give_score(answer_id: int, body: ScoreIn, db: Session = Depends(get_db)) -> dict:
    ans = db.get(Answer, answer_id) or _404()
    max_score = stage_index()[(ans.item_no, ans.stage_no)].get("score") or 0
    if body.score > max_score:
        raise HTTPException(422, f"Skor maksimum tahap ini {max_score}.")
    ans.manual_score = body.score
    ans.scored_at = datetime.now(timezone.utc)
    db.commit()
    return {"answer_id": ans.id, "manual_score": ans.manual_score}


@router.get("/export.csv", dependencies=[Depends(require_teacher)])
def export_csv(db: Session = Depends(get_db)) -> StreamingResponse:
    """Data penelitian format panjang (semua siswa): 1 baris = 1 tahap jawaban."""
    stages = stage_index()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["student_id", "nama", "nis", "tes", "soal", "tahap", "skor_maks", "jawaban", "skor_otomatis", "skor_guru", "skor_akhir", "status", "dikumpulkan"])
    for s in _all_students(db):
        for att in s.attempts:
            if att.status != "submitted":
                continue
            by_key = {(a.item_no, a.stage_no): a for a in att.answers}
            for (item_no, stage_no), st in sorted(stages.items()):
                if not st.get("input"):
                    continue
                a = by_key.get((item_no, stage_no))
                final = a.manual_score if a and a.manual_score is not None else (a.auto_score if a else 0)
                value = a.value if a else ""
                w.writerow([
                    s.id, s.name, s.nis, att.type, item_no, stage_no, st.get("score"),
                    json.dumps(value, ensure_ascii=False) if isinstance(value, dict) else value,
                    a.auto_score if a else 0, a.manual_score if a else "", final if final is not None else "",
                    (a.status if a else "blank"), att.submitted_at.isoformat() if att.submitted_at else "",
                ])
    buf.seek(0)
    filename = f"vennbuster_rekap_{datetime.now(timezone.utc):%Y%m%d}.csv"
    return StreamingResponse(
        iter(["﻿" + buf.getvalue()]),  # BOM agar Excel membaca UTF-8
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _404():
    raise HTTPException(404, "Data tidak ditemukan.")


def _key_hint(key: str) -> str | None:
    """Hanya 4 karakter terakhir, cukup untuk mencocokkan dengan dashboard penyedia tanpa membocorkan kunci."""
    return f"…{key[-4:]}" if key else None


@router.get("/ai-status", dependencies=[Depends(require_teacher)])
def ai_status() -> dict:
    """Layanan AI yang dipakai Tutor Kak Venn (urutan = urutan dicoba). Kunci tidak pernah dikirim utuh."""
    from ..services.tutor import model_list

    s = get_settings()
    providers = []
    if s.anthropic_api_key:
        providers.append(
            {
                "name": "Claude (Anthropic)",
                "env": "ANTHROPIC_API_KEY",
                "dashboard": "https://platform.claude.com",
                "models": [s.claude_model],
                "key_hint": _key_hint(s.anthropic_api_key),
            }
        )
    if s.ai_api_key:
        providers.append(
            {
                "name": "OpenRouter",
                "env": "AI_API_KEY",
                "dashboard": "https://openrouter.ai/settings/keys",
                "models": model_list(s.ai_model),
                "key_hint": _key_hint(s.ai_api_key),
            }
        )
    return {"enabled": bool(providers), "providers": providers}
