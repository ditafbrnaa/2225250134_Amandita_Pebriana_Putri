import csv
import hmac
import io
import json
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Answer, Attempt, Classroom, Student
from ..schemas import ClassIn, ScoreIn, TeacherLoginIn
from ..security import require_teacher, teacher_token
from ..services.scoring import n_gain, stage_index, summarize

router = APIRouter(prefix="/teacher", tags=["guru"])


@router.post("/login")
def login(body: TeacherLoginIn) -> dict:
    if not hmac.compare_digest(body.pin, get_settings().teacher_pin):
        raise HTTPException(401, "PIN salah.")
    return {"token": teacher_token()}


@router.get("/classes", dependencies=[Depends(require_teacher)])
def list_classes(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(
        select(Classroom, func.count(Student.id)).outerjoin(Student).group_by(Classroom.id).order_by(Classroom.created_at)
    ).all()
    return [{"id": c.id, "name": c.name, "code": c.code, "student_count": n} for c, n in rows]


@router.post("/classes", dependencies=[Depends(require_teacher)])
def create_class(body: ClassIn, db: Session = Depends(get_db)) -> dict:
    code = (body.code or f"VENN-{secrets.token_hex(2).upper()}").strip().upper()
    if db.scalar(select(Classroom).where(Classroom.code == code)):
        raise HTTPException(409, "Kode kelas sudah dipakai.")
    c = Classroom(name=body.name.strip(), code=code)
    db.add(c)
    db.commit()
    return {"id": c.id, "name": c.name, "code": c.code, "student_count": 0}


def _latest(student: Student, kind: str) -> Attempt | None:
    subs = [a for a in student.attempts if a.type == kind and a.status == "submitted"]
    return max(subs, key=lambda a: a.submitted_at or datetime.min.replace(tzinfo=timezone.utc)) if subs else None


@router.get("/classes/{class_id}/summary", dependencies=[Depends(require_teacher)])
def summary(class_id: int, db: Session = Depends(get_db)) -> list[dict]:
    classroom = db.get(Classroom, class_id) or _404()
    out = []
    for s in sorted(classroom.students, key=lambda x: x.name):
        pre, post = _latest(s, "pre"), _latest(s, "post")
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
                "max": max_score,
                "ngain": g,
                "category": cat,
            }
        )
    return out


@router.get("/grading-queue", dependencies=[Depends(require_teacher)])
def grading_queue(class_id: int, db: Session = Depends(get_db)) -> list[dict]:
    stages = stage_index()
    rows = db.execute(
        select(Answer, Attempt, Student)
        .join(Attempt, Answer.attempt_id == Attempt.id)
        .join(Student, Attempt.student_id == Student.id)
        .where(Student.classroom_id == class_id, Attempt.status == "submitted", Answer.status == "pending", Answer.manual_score.is_(None))
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


@router.get("/classes/{class_id}/export.csv", dependencies=[Depends(require_teacher)])
def export_csv(class_id: int, db: Session = Depends(get_db)) -> StreamingResponse:
    """Data penelitian format panjang: 1 baris = 1 tahap jawaban."""
    classroom = db.get(Classroom, class_id) or _404()
    stages = stage_index()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["kelas", "student_id", "nama", "nis", "tes", "soal", "tahap", "skor_maks", "jawaban", "skor_otomatis", "skor_guru", "skor_akhir", "status", "dikumpulkan"])
    for s in classroom.students:
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
                    classroom.name, s.id, s.name, s.nis, att.type, item_no, stage_no, st.get("score"),
                    json.dumps(value, ensure_ascii=False) if isinstance(value, dict) else value,
                    a.auto_score if a else 0, a.manual_score if a else "", final if final is not None else "",
                    (a.status if a else "blank"), att.submitted_at.isoformat() if att.submitted_at else "",
                ])
    buf.seek(0)
    filename = f"vennbuster_{classroom.code}.csv"
    return StreamingResponse(
        iter(["﻿" + buf.getvalue()]),  # BOM agar Excel membaca UTF-8
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _404():
    raise HTTPException(404, "Data tidak ditemukan.")
