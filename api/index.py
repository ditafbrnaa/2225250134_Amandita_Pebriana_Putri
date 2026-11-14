"""Pintu masuk Vercel: semua permintaan /api/* diteruskan ke aplikasi FastAPI di folder backend/."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app  # noqa: E402

__all__ = ["app"]
