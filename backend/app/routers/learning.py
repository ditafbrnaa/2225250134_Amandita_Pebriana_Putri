import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ModuleLog, Student
from ..schemas import LearningIn
from ..security import current_student

router = APIRouter(tags=["belajar"])

MODULE_ID = re.compile(r"^m[1-9]$")


@router.put("/learning/{module_id}")
def save_learning(
    module_id: str, body: LearningIn, db: Session = Depends(get_db), student: Student = Depends(current_student)
) -> dict:
    """Menyimpan catatan proses belajar satu modul (idempoten: data dikirim utuh dan menggantikan yang lama)."""
    if not MODULE_ID.match(module_id):
        raise HTTPException(422, "Modul tidak dikenal.")
    steps = {k: v.model_dump() for k, v in body.steps.items() if k.isdigit()}
    log = db.scalar(select(ModuleLog).where(ModuleLog.student_id == student.id, ModuleLog.module_id == module_id))
    if log is None:
        log = ModuleLog(student_id=student.id, module_id=module_id)
        db.add(log)
    log.steps = steps
    log.done = log.done or body.done
    db.commit()
    return {"module_id": module_id, "steps": len(steps), "done": log.done}
