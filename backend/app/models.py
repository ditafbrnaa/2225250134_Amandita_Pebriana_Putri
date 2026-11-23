from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def now() -> datetime:
    return datetime.now(timezone.utc)


class Student(Base):
    """Siswa dikenali dari nama + NIS (tanpa kode kelas)."""

    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True)
    # Kolom lama dari versi berkode kelas. Tidak dipakai lagi; dibiarkan nullable agar data lama tetap terbaca.
    classroom_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    nis: Mapped[str] = mapped_column(String(30), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    attempts: Mapped[list["Attempt"]] = relationship(back_populates="student")
    learning: Mapped[list["ModuleLog"]] = relationship(back_populates="student")


class Attempt(Base):
    """Satu kali pengerjaan pretest/posttest. ID dibuat oleh aplikasi (UUID) agar aman saat offline."""

    __tablename__ = "attempts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    type: Mapped[str] = mapped_column(String(4))  # pre | post
    status: Mapped[str] = mapped_column(String(20), default="in_progress")  # in_progress | submitted
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scratch: Mapped[dict] = mapped_column(JSON, default=dict)
    student: Mapped[Student] = relationship(back_populates="attempts")
    answers: Mapped[list["Answer"]] = relationship(back_populates="attempt", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    __table_args__ = (UniqueConstraint("attempt_id", "item_no", "stage_no", name="uq_answer_stage"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[str] = mapped_column(ForeignKey("attempts.id"), index=True)
    item_no: Mapped[int] = mapped_column(Integer)
    stage_no: Mapped[int] = mapped_column(Integer)
    value: Mapped[Any] = mapped_column(JSON, nullable=True)
    auto_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    manual_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(12), default="pending")  # auto | pending | blank | unscored
    scored_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempt: Mapped[Attempt] = relationship(back_populates="answers")


class ModuleLog(Base):
    """Catatan proses belajar satu modul (asesmen dinamis RMT): banyak salah & petunjuk per langkah.

    steps = { "indeks_langkah": { "wrong": int, "hints": int, "solved": bool } }. Tidak memuat data pribadi.
    """

    __tablename__ = "module_logs"
    __table_args__ = (UniqueConstraint("student_id", "module_id", name="uq_module_log"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    module_id: Mapped[str] = mapped_column(String(10))
    steps: Mapped[dict] = mapped_column(JSON, default=dict)
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    student: Mapped[Student] = relationship(back_populates="learning")
