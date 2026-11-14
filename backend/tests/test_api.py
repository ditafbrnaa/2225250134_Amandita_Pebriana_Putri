import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["TEACHER_PIN"] = "4321"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
API = "/api/v1"


def test_alur_lengkap():
    # Guru masuk hanya dengan PIN
    assert client.post(f"{API}/teacher/login", json={"pin": "salah"}).status_code == 401
    t = client.post(f"{API}/teacher/login", json={"pin": "4321"}).json()["token"]
    th = {"Authorization": f"Bearer {t}"}

    # Siswa masuk tanpa kode kelas; nama + NIS yang sama → akun yang sama
    r1 = client.post(f"{API}/students/join", json={"name": "Budi", "nis": "1"})
    assert r1.status_code == 200
    j = r1.json()
    assert client.post(f"{API}/students/join", json={"name": " Budi ", "nis": "1"}).json()["student_id"] == j["student_id"]
    assert client.post(f"{API}/students/join", json={"name": "Sari"}).status_code == 200  # NIS opsional
    # Klien lama yang masih mengirim class_code tetap diterima
    assert client.post(f"{API}/students/join", json={"name": "Budi", "nis": "1", "class_code": "X"}).status_code == 200
    sh = {"Authorization": f"Bearer {j['token']}"}

    # Instrumen publik tidak memuat kunci
    inst = client.get(f"{API}/instrument").json()
    assert all("key" not in st for it in inst["items"] for st in it["stages"])

    # Simpan jawaban (dua kali → idempoten) lalu kumpulkan
    aid = "11111111-1111-4111-8111-111111111111"
    body = {"type": "pre", "answers": {"1.1": "35", "1.4": "5", "1.5": "Ada 5 siswa"}, "scratch": {}}
    assert client.put(f"{API}/attempts/{aid}", json=body, headers=sh).status_code == 200
    assert client.put(f"{API}/attempts/{aid}", json=body, headers=sh).status_code == 200
    r = client.post(f"{API}/attempts/{aid}/submit", headers=sh).json()
    assert r["autoTotal"] == 2 and r["pendingCount"] == 1
    assert client.put(f"{API}/attempts/{aid}", json=body, headers=sh).status_code == 409

    # Guru menilai uraian
    q = client.get(f"{API}/teacher/grading-queue", headers=th).json()
    assert len(q) == 1
    client.put(f"{API}/teacher/answers/{q[0]['answer_id']}/score", json={"score": 1}, headers=th)

    # Rekap global: semua siswa tampil tanpa memilih kelas
    assert client.get(f"{API}/teacher/summary").status_code == 401
    rows = client.get(f"{API}/teacher/summary", headers=th).json()
    assert [r["name"] for r in rows] == ["Budi", "Sari"]
    assert rows[0]["pre"] == 3 and rows[0]["pre_submitted_at"]
    assert rows[1]["pre"] is None

    csv = client.get(f"{API}/teacher/export.csv", params={"token": t})
    assert csv.status_code == 200 and "Budi" in csv.text
