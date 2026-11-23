import os
import tempfile

os.environ.setdefault("DATABASE_URL", f"sqlite:///{tempfile.mkdtemp()}/test.db")
os.environ.setdefault("TEACHER_PIN", "4321")

from fastapi.testclient import TestClient  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402
from app.services.rmt import help_level, independence_trend, module_summary, potential_label, student_profile  # noqa: E402

client = TestClient(app)
API = "/api/v1"


def test_tingkat_bantuan():
    assert help_level({"wrong": 0, "hints": 0}) == 0
    assert help_level({"wrong": 1, "hints": 0}) == 1
    assert help_level({"wrong": 2, "hints": 1}) == 1
    assert help_level({"wrong": 3, "hints": 0}) == 2
    assert help_level({"wrong": 0, "hints": 2}) == 2


def test_ringkasan_modul_hanya_langkah_selesai():
    s = module_summary(
        {
            "2": {"wrong": 0, "hints": 0, "solved": True},
            "3": {"wrong": 1, "hints": 1, "solved": True},
            "4": {"wrong": 5, "hints": 3, "solved": True},
            "5": {"wrong": 9, "hints": 0, "solved": False},  # belum selesai → tidak dihitung
        }
    )
    assert (s["graded"], s["mandiri"], s["sedikit"], s["banyak"], s["hints"]) == (3, 1, 1, 1, 4)
    assert s["index"] == 0.5
    assert module_summary({})["index"] is None


def test_potensi_dan_tren():
    assert potential_label(0.8) == "Mandiri"
    assert potential_label(0.5) == "Berkembang dengan bantuan"
    assert potential_label(0.1) == "Perlu pendampingan"
    assert potential_label(None) is None
    assert independence_trend([0.25, None, 0.75]) == 0.5
    assert independence_trend([0.5]) is None


def test_profil_urut_modul():
    solo = {"0": {"wrong": 0, "hints": 0, "solved": True}}
    helped = {"0": {"wrong": 4, "hints": 2, "solved": True}}
    p = student_profile({"m2": solo, "m1": helped})
    assert list(p["modules"]) == ["m1", "m2"]
    assert p["trend"] == 1.0 and p["index"] == 0.5


def test_api_simpan_dan_rekap_guru():
    pin = get_settings().teacher_pin
    th = {"Authorization": f"Bearer {client.post(f'{API}/teacher/login', json={'pin': pin}).json()['token']}"}
    j = client.post(f"{API}/students/join", json={"name": "Rara RMT", "nis": "77"}).json()
    sh = {"Authorization": f"Bearer {j['token']}"}

    body = {"steps": {"2": {"wrong": 1, "hints": 1, "solved": True}, "3": {"wrong": 0, "hints": 0, "solved": True}}, "done": True}
    assert client.put(f"{API}/learning/m1", json=body).status_code == 401
    assert client.put(f"{API}/learning/xx", json=body, headers=sh).status_code == 422
    assert client.put(f"{API}/learning/m1", json={"steps": {"0": {"hints": 9}}}, headers=sh).status_code == 422
    assert client.put(f"{API}/learning/m1", json=body, headers=sh).status_code == 200
    assert client.put(f"{API}/learning/m1", json=body, headers=sh).status_code == 200  # idempoten
    assert client.put(f"{API}/learning/m2", json={"steps": {"1": {"wrong": 0, "hints": 0, "solved": True}}}, headers=sh).status_code == 200

    assert client.get(f"{API}/teacher/learning").status_code == 401
    rows = client.get(f"{API}/teacher/learning", headers=th).json()
    me = next(r for r in rows if r["student_id"] == j["student_id"])
    assert me["modules"]["m1"]["index"] == 0.75 and me["modules"]["m1"]["done"] is True
    assert me["modules"]["m2"]["done"] is False
    assert me["trend"] == 0.25 and me["potential"] == "Mandiri"

    csv = client.get(f"{API}/teacher/learning.csv", headers=th)
    assert csv.status_code == 200 and "Rara RMT" in csv.text and "bantuan_ringan" in csv.text
