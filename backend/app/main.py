from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .config import get_settings
from .database import Base, engine
from .routers import attempts, students, teacher, tutor

# Untuk proyek skripsi, tabel dibuat otomatis. Jika skema berubah setelah ada data, gunakan Alembic.
Base.metadata.create_all(bind=engine)


def _drop_class_requirement() -> None:
    """Migrasi ringan: database lama mewajibkan students.classroom_id. Sekarang siswa masuk tanpa kode kelas."""
    if engine.dialect.name != "postgresql":
        return  # SQLite baru sudah nullable dari create_all
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE students ALTER COLUMN classroom_id DROP NOT NULL"))


_drop_class_requirement()

app = FastAPI(title="VennBuster API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (students.router, attempts.router, teacher.router, tutor.router):
    app.include_router(r, prefix="/api/v1")


@app.get("/api/v1/health")
def health() -> dict:
    return {"ok": True}
