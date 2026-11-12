import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["TEACHER_PIN"] = "4321"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
API = "/api/v1"


def test_alur_lengkap():
    # Guru masuk & membuat kelas
    assert client.post(f"{API}/teacher/login", json={"pin": "salah"}).status_code == 401
    t = client.post(f"{API}/teacher/login", json={"pin": "4321"}).json()["token"]
    th = {"Authorization": f"Bearer {t}"}
    kelas = client.post(f"{API}/teacher/classes", json={"name": "VII A", "code": "7A-VENN"}, headers=th).json()

    # Siswa masuk
    j = client.post(f"{API}/students/join", json={"name": "Budi", "nis": "1", "class_code": "7a-venn"}).json()
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
    q = client.get(f"{API}/teacher/grading-queue", params={"class_id": kelas["id"]}, headers=th).json()
    assert len(q) == 1
    client.put(f"{API}/teacher/answers/{q[0]['answer_id']}/score", json={"score": 1}, headers=th)
    rows = client.get(f"{API}/teacher/classes/{kelas['id']}/summary", headers=th).json()
    assert rows[0]["pre"] == 3

    csv = client.get(f"{API}/teacher/classes/{kelas['id']}/export.csv", params={"token": t})
    assert csv.status_code == 200 and "Budi" in csv.text
