import os
from functools import lru_cache

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SECRET = "dev-secret-ganti-saat-produksi"
DEFAULT_PIN = "123456"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Integrasi Neon/Postgres di Vercel mengisi DATABASE_URL atau POSTGRES_URL secara otomatis.
    database_url: str = Field(
        default="sqlite:///./vennbuster.db",
        validation_alias=AliasChoices("DATABASE_URL", "POSTGRES_URL", "database_url"),
    )
    secret_key: str = DEFAULT_SECRET
    teacher_pin: str = DEFAULT_PIN
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Tutor AI (opsional). Kunci HANYA disimpan di server, tidak pernah dikirim ke HP siswa.
    # AI_MODEL berisi satu atau beberapa model (pisahkan koma). Bila model pertama penuh/gagal,
    # model berikutnya langsung dicoba. Bawaan: deretan model gratis OpenRouter.
    # Paling andal (berbayar, murah): AI_MODEL=deepseek/deepseek-v4.1-flash,google/gemma-4-31b-it:free
    ai_api_key: str = ""
    ai_base_url: str = "https://openrouter.ai/api/v1"
    ai_model: str = (
        "google/gemma-4-31b-it:free,google/gemma-4-26b-a4b-it:free,"
        "nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3.5-super-vl:free"
    )

    @model_validator(mode="after")
    def _require_secrets_in_production(self) -> "Settings":
        """Di server online (Vercel), PIN & kunci bawaan ditolak agar dasbor guru tidak bisa ditebak."""
        if os.getenv("VERCEL"):
            if self.secret_key == DEFAULT_SECRET or self.teacher_pin == DEFAULT_PIN:
                raise ValueError("Atur SECRET_KEY dan TEACHER_PIN di Environment Variables Vercel.")
            if self.database_url.startswith("sqlite"):
                raise ValueError("Atur DATABASE_URL (Postgres) di Vercel; SQLite tidak permanen di serverless.")
        return self

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        """Postgres memakai driver psycopg (v3)."""
        url = self.database_url
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix) :]
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
