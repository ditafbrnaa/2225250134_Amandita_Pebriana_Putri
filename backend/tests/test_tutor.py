import os
import tempfile

os.environ.setdefault("DATABASE_URL", f"sqlite:///{tempfile.mkdtemp()}/test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402
from app.services import tutor  # noqa: E402

client = TestClient(app)
API = "/api/v1"
PROBLEM = "Dari 30 siswa, 18 suka futsal, 12 suka voli, dan 5 suka keduanya."


def _student(name: str) -> dict:
    t = client.post(f"{API}/students/join", json={"name": name}).json()["token"]
    return {"Authorization": f"Bearer {t}"}


def _body(**kw) -> dict:
    return {"problem": PROBLEM, "messages": [{"role": "user", "content": "Aku mulai dari mana?"}], **kw}


def test_split_phase():
    assert tutor.split_phase("TAHAP: 2\nCoba isi irisannya.") == ("Coba isi irisannya.", 2)
    assert tutor.split_phase("**TAHAP: 1**\nApa yang ditanyakan?") == ("Apa yang ditanyakan?", 1)
    assert tutor.split_phase("Tanpa penanda.") == ("Tanpa penanda.", None)


def test_build_messages_memuat_aturan_soal_dan_petunjuk():
    msgs = tutor.build_messages(PROBLEM, [{"role": "user", "content": "hai"}] * 40, hint_level=3)
    assert "JANGAN PERNAH memberikan jawaban akhir" in msgs[0]["content"]
    assert PROBLEM in msgs[1]["content"]
    assert len([m for m in msgs if m["role"] == "user"]) == tutor.MAX_HISTORY
    assert "LEVEL 3" in msgs[-1]["content"]


def test_tutor_butuh_login_dan_kunci(monkeypatch):
    assert client.post(f"{API}/tutor/chat", json=_body()).status_code == 401
    monkeypatch.setattr(get_settings(), "ai_api_key", "")
    r = client.post(f"{API}/tutor/chat", json=_body(), headers=_student("Tutor Satu"))
    assert r.status_code == 503 and "AI_API_KEY" in r.json()["detail"]


def test_tutor_membalas_dan_tidak_mengirim_nama(monkeypatch):
    sent = {}

    def fake_ask(problem, messages, hint_level=0):
        sent.update(problem=problem, messages=messages, hint_level=hint_level)
        return "Apa yang ditanyakan soal ini?", 1

    monkeypatch.setattr("app.routers.tutor.ask_tutor", fake_ask)
    r = client.post(f"{API}/tutor/chat", json=_body(hint_level=2), headers=_student("Rahasia Sekali"))
    assert r.status_code == 200
    assert r.json() == {"reply": "Apa yang ditanyakan soal ini?", "phase": 1}
    assert sent["hint_level"] == 2
    assert "Rahasia" not in str(sent)


def test_tutor_ditolak_saat_tes_berlangsung(monkeypatch):
    monkeypatch.setattr("app.routers.tutor.ask_tutor", lambda *a, **k: ("x", 1))
    h = _student("Sedang Ujian")
    aid = "22222222-2222-4222-8222-222222222222"
    client.put(f"{API}/attempts/{aid}", json={"type": "pre", "answers": {}, "scratch": {}}, headers=h)
    assert client.post(f"{API}/tutor/chat", json=_body(), headers=h).status_code == 423
    client.post(f"{API}/attempts/{aid}/submit", headers=h)
    assert client.post(f"{API}/tutor/chat", json=_body(), headers=h).status_code == 200


class _Res:
    def __init__(self, status: int, content: str = ""):
        self.status_code = status
        self._content = content

    def json(self):
        return {"choices": [{"message": {"content": self._content}}]}


def test_model_penuh_langsung_pindah_ke_cadangan(monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "ai_api_key", "k")
    monkeypatch.setattr(s, "ai_model", "a:free, b:free ,c:free")
    tried = []
    replies = {"a:free": _Res(429), "b:free": _Res(200, "  "), "c:free": _Res(200, "TAHAP: 1\nApa yang ditanyakan?")}

    def fake_post(url, json, **kw):
        tried.append(json["model"])
        return replies[json["model"]]

    monkeypatch.setattr(tutor.httpx, "post", fake_post)
    assert tutor.ask_tutor(PROBLEM, [{"role": "user", "content": "hai"}]) == ("Apa yang ditanyakan?", 1)
    assert tried == ["a:free", "b:free", "c:free"]


def test_kunci_salah_berhenti_dan_semua_gagal(monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "ai_api_key", "k")
    monkeypatch.setattr(s, "ai_model", "a,b")
    tried = []
    monkeypatch.setattr(tutor.httpx, "post", lambda url, json, **kw: tried.append(json["model"]) or _Res(401))
    try:
        tutor.ask_tutor(PROBLEM, [{"role": "user", "content": "hai"}])
    except tutor.TutorUnavailable as e:
        assert "AI_API_KEY" in str(e)
    assert tried == ["a"]

    monkeypatch.setattr(tutor.httpx, "post", lambda url, json, **kw: _Res(503))
    try:
        tutor.ask_tutor(PROBLEM, [{"role": "user", "content": "hai"}])
        raise AssertionError("harus gagal")
    except tutor.TutorUnavailable as e:
        assert "tidak bisa menjawab" in str(e)
