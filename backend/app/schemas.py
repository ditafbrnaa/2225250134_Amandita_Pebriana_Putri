from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class JoinIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    nis: str = Field(default="", max_length=30)


class JoinOut(BaseModel):
    student_id: int
    token: str


class AttemptIn(BaseModel):
    type: Literal["pre", "post"]
    started_at: datetime | None = None
    answers: dict[str, Any] = {}
    scratch: dict[str, Any] = {}


class TeacherLoginIn(BaseModel):
    pin: str


class ScoreIn(BaseModel):
    score: int = Field(ge=0)


class TutorMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1200)


class TutorIn(BaseModel):
    problem: str = Field(min_length=10, max_length=1500)
    messages: list[TutorMessage] = Field(min_length=1, max_length=30)
    # 0 = belum minta petunjuk; 1–4 = tingkat petunjuk yang diminta siswa (makin tinggi makin spesifik)
    hint_level: int = Field(default=0, ge=0, le=4)


class TutorOut(BaseModel):
    reply: str
    phase: int | None = None  # 1–3 sesuai tahapan RMT, None bila tidak terbaca
