from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class JoinIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    nis: str = Field(default="", max_length=30)
    class_code: str = Field(min_length=1, max_length=20)


class JoinOut(BaseModel):
    student_id: int
    token: str
    class_name: str


class AttemptIn(BaseModel):
    type: Literal["pre", "post"]
    started_at: datetime | None = None
    answers: dict[str, Any] = {}
    scratch: dict[str, Any] = {}


class TeacherLoginIn(BaseModel):
    pin: str


class ClassIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    code: str | None = Field(default=None, max_length=20)


class ScoreIn(BaseModel):
    score: int = Field(ge=0)
