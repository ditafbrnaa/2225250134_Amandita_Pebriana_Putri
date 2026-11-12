from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Answer, Attempt, Student
from ..schemas import AttemptIn
from ..security import current_student
from ..services.scoring import score_stage, stage_index, summarize

router = APIRouter(tags=["tes"])


def _own_attempt(db: Session, attempt_id: str, student: Student) -> Attempt:
    attempt = db.get(Attempt, attempt_id)
    if not attempt:
        raise HTTPException(404, "Percobaan tidak ditemukan.")
    if attempt.student_id != student.id:
        raise HTTPException(403, "Bukan milikmu.")
    return attempt


@router.put("/attempts/{attempt_id}")
def upsert_attempt(attempt_id: str, body: AttemptIn, db: Session = Depends(get_db), student: Student = Depends(current_student)) -> dict:
    """Membuat/memperbarui percobaan beserta seluruh jawabannya (idempoten, aman dikirim ulang)."""
    attempt = db.get(Attempt, attempt_id)
    if attempt is None:
        attempt = Attempt(id=attempt_id, student_id=student.id, type=body.type, started_at=body.started_at, scratch={})
        db.add(attempt)
    elif attempt.student_id != student.id:
        raise HTTPException(403, "Bukan milikmu.")
    if attempt.status == "submitted":
        raise HTTPException(409, "Jawaban sudah dikumpulkan dan tidak bisa diubah.")

    attempt.scratch = body.scratch
    valid = stage_index()
    existing = {(a.item_no, a.stage_no): a for a in attempt.answers}
    for key, value in body.answers.items():
        try:
            item_no, stage_no = (int(x) for x in key.split("."))
        except ValueError:
            continue
        if (item_no, stage_no) not in valid:
            continue
        ans = existing.get((item_no, stage_no))
        if ans is None:
            attempt.answers.append(Answer(item_no=item_no, stage_no=stage_no, value=value))
        else:
            ans.value = value
    db.commit()
    return {"id": attempt.id, "status": attempt.status, "answers": len(attempt.answers)}


@router.post("/attempts/{attempt_id}/submit")
def submit(attempt_id: str, db: Session = Depends(get_db), student: Student = Depends(current_student)) -> dict:
    attempt = _own_attempt(db, attempt_id, student)
    if attempt.status != "submitted":
        stages = stage_index()
        for ans in attempt.answers:
            st = stages[(ans.item_no, ans.stage_no)]
            ans.auto_score, ans.status = score_stage(ans.value, st)
            ans.scored_at = datetime.now(timezone.utc) if ans.status == "auto" else None
        attempt.status = "submitted"
        attempt.submitted_at = datetime.now(timezone.utc)
        db.commit()
    return {"status": attempt.status, **summarize(attempt.answers)}


@router.get("/attempts/{attempt_id}")
def get_attempt(attempt_id: str, db: Session = Depends(get_db), student: Student = Depends(current_student)) -> dict:
    attempt = _own_attempt(db, attempt_id, student)
    return {"status": attempt.status, **summarize(attempt.answers)}
