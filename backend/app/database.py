from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

settings = get_settings()
if settings.sqlalchemy_url.startswith("sqlite"):
    engine = create_engine(settings.sqlalchemy_url, connect_args={"check_same_thread": False})
else:
    # Serverless: koneksi bisa diputus server saat fungsi tidur, jadi cek dulu sebelum dipakai.
    engine = create_engine(settings.sqlalchemy_url, pool_pre_ping=True, pool_size=2, max_overflow=3, pool_recycle=300)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
