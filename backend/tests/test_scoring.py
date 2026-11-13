from types import SimpleNamespace

from app.services.scoring import n_gain, same_formula, score_stage, solve_linear, stage_index, summarize


def test_solve_linear():
    assert solve_linear("35 = 22 + 18 − x") == 5
    assert solve_linear("22+18-n(A∩B)=35") == 5
    assert solve_linear("30 = 21 + x") == 9
    assert solve_linear("n(A∪B)=n(A)+n(B)-n(A∩B)") is None


def test_same_formula():
    key = "n(A∪B)=n(A)+n(B)-n(A∩B)"
    assert same_formula("n(A ∪ B) = n(A) + n(B) − n(A ∩ B)", key)
    assert same_formula("n(B)+n(A)-n(A∩B)=n(AUB)", key)
    assert not same_formula("n(A∪B)=n(A)+n(B)", key)


def test_score_stage():
    idx = stage_index()
    assert score_stage("5", idx[(1, 4)]) == (1, "auto")
    assert score_stage("31", idx[(3, 4)]) == (0, "auto")
    assert score_stage({"choice": "Tidak tepat", "text": ""}, idx[(3, 1)]) == (1, "auto")
    assert score_stage("", idx[(1, 1)]) == (0, "blank")
    assert score_stage("alasan", idx[(1, 5)]) == (None, "pending")
    assert score_stage("valid", idx[(3, 5)]) == (None, "pending")  # kesimpulan dinilai guru


def test_summarize_with_manual_scores():
    a = lambda i, s, auto, status, manual=None: SimpleNamespace(item_no=i, stage_no=s, auto_score=auto, status=status, manual_score=manual)  # noqa: E731
    answers = [a(1, 1, 1, "auto"), a(1, 2, 2, "auto"), a(1, 5, None, "pending", manual=1), a(4, 6, None, "pending")]
    r = summarize(answers)
    assert r["max"] == 24  # 4 soal × 6, sesuai max_total instrumen
    assert r["total"] == 4
    assert r["autoTotal"] == 3
    assert r["pendingCount"] == 1


def test_n_gain():
    assert n_gain(8, 20, 24) == (0.75, "tinggi")
    assert n_gain(12, 16, 24)[1] == "sedang"
    assert n_gain(None, 16, 24) == (None, None)
