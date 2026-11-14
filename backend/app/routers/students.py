from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student
from ..schemas import JoinIn, JoinOut
from ..security import student_token
from ..services.scoring import public_instrument

router = APIRouter(tags=["siswa"])


@router.post("/students/join", response_model=JoinOut)
def join(body: JoinIn, db: Session = Depends(get_db)) -> JoinOut:
    """Siswa masuk hanya dengan nama (NIS opsional). Nama + NIS yang sama → akun yang sama."""
    name = " ".join(body.name.split())
    nis = body.nis.strip()
    student = db.scalar(
        select(Student).where(Student.name == name, Student.nis == nis).order_by(Student.id).limit(1)
    )
    if not student:
        student = Student(name=name, nis=nis)
        db.add(student)
        db.commit()
    return JoinOut(student_id=student.id, token=student_token(student.id))


@router.get("/instrument")
def instrument() -> dict:
    """Butir pretest/posttest TANPA kunci jawaban."""
    return public_instrument()
