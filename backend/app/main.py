from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import Base, engine
from .routers import attempts, students, teacher

# Untuk proyek skripsi, tabel dibuat otomatis. Jika skema berubah setelah ada data, gunakan Alembic.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="VennBuster API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (students.router, attempts.router, teacher.router):
    app.include_router(r, prefix="/api/v1")


@app.get("/api/v1/health")
def health() -> dict:
    return {"ok": True}
