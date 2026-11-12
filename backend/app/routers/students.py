from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Classroom, Student
from ..schemas import JoinIn, JoinOut
from ..security import student_token
from ..services.scoring import public_instrument

router = APIRouter(tags=["siswa"])


@router.post("/students/join", response_model=JoinOut)
def join(body: JoinIn, db: Session = Depends(get_db)) -> JoinOut:
    """Siswa masuk dengan kode kelas. Nama + NIS yang sama di kelas yang sama → akun yang sama."""
    classroom = db.scalar(select(Classroom).where(Classroom.code == body.class_code.strip().upper()))
    if not classroom:
        raise HTTPException(404, "Kode kelas tidak ditemukan. Periksa lagi atau tanyakan ke gurumu.")
    name = " ".join(body.name.split())
    nis = body.nis.strip()
    student = db.scalar(
        select(Student).where(Student.classroom_id == classroom.id, Student.name == name, Student.nis == nis)
    )
    if not student:
        student = Student(classroom_id=classroom.id, name=name, nis=nis)
        db.add(student)
        db.commit()
    return JoinOut(student_id=student.id, token=student_token(student.id), class_name=classroom.name)


@router.get("/instrument")
def instrument() -> dict:
    """Butir pretest/posttest TANPA kunci jawaban."""
    return public_instrument()
