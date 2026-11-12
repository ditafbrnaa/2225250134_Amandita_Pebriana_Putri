"""Token sederhana bertanda tangan HMAC (tanpa pustaka tambahan).

Cukup untuk penelitian skala kelas. Untuk produksi luas, ganti dengan JWT + kedaluwarsa.
"""
import hashlib
import hmac

from fastapi import Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from .models import Student


def _sign(payload: str) -> str:
    key = get_settings().secret_key.encode()
    return hmac.new(key, payload.encode(), hashlib.sha256).hexdigest()


def student_token(student_id: int) -> str:
    return f"s{student_id}.{_sign(f'student:{student_id}')}"


def teacher_token() -> str:
    return f"t.{_sign('teacher')}"


def _bearer(authorization: str | None) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return None


def current_student(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> Student:
    token = _bearer(authorization)
    try:
        sid_part, sig = token.split(".", 1)  # type: ignore[union-attr]
        sid = int(sid_part.lstrip("s"))
    except (AttributeError, ValueError):
        raise HTTPException(401, "Sesi tidak valid. Silakan masuk ulang.")
    if not hmac.compare_digest(sig, _sign(f"student:{sid}")):
        raise HTTPException(401, "Sesi tidak valid. Silakan masuk ulang.")
    student = db.get(Student, sid)
    if not student:
        raise HTTPException(401, "Siswa tidak ditemukan.")
    return student


def require_teacher(authorization: str | None = Header(default=None), token: str | None = Query(default=None)) -> None:
    value = _bearer(authorization) or token
    if not value or not hmac.compare_digest(value, teacher_token()):
        raise HTTPException(401, "Masuk sebagai guru terlebih dahulu.")
