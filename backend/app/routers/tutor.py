from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Attempt, Student
from ..schemas import TutorIn, TutorOut
from ..security import current_student
from ..services.tutor import TutorUnavailable, ask_tutor

router = APIRouter(tags=["tutor"])


@router.post("/tutor/chat", response_model=TutorOut)
def chat(body: TutorIn, db: Session = Depends(get_db), student: Student = Depends(current_student)) -> TutorOut:
    """Satu giliran percakapan dengan tutor AI. Ditolak selama siswa mengerjakan pretest/posttest."""
    in_exam = db.scalar(
        select(Attempt.id).where(Attempt.student_id == student.id, Attempt.status == "in_progress").limit(1)
    )
    if in_exam:
        raise HTTPException(423, "Tutor dimatikan selama kamu mengerjakan tes. Selesaikan tesnya dulu, ya.")
    if body.messages[-1].role != "user":
        raise HTTPException(422, "Pesan terakhir harus dari siswa.")
    try:
        reply, phase = ask_tutor(body.problem, [m.model_dump() for m in body.messages], body.hint_level)
    except TutorUnavailable as e:
        raise HTTPException(503, str(e)) from e
    return TutorOut(reply=reply, phase=phase)
