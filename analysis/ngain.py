"""Analisis data pretest–posttest VennBuster.

Masukan : CSV hasil ekspor Dasbor Guru (format panjang: 1 baris = 1 tahap).
Keluaran: rekap per siswa (pre, post, N-gain, kategori), statistik deskriptif,
          uji normalitas Shapiro-Wilk, dan uji-t berpasangan / Wilcoxon.

Pemakaian:
    python ngain.py data/vennbuster_7A-VENN.csv
    python ngain.py data/*.csv --out hasil_ngain.xlsx
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd
from scipy import stats


def kategori(g: float) -> str:
    if pd.isna(g):
        return "-"
    return "tinggi" if g >= 0.7 else "sedang" if g >= 0.3 else "rendah"


def rekap(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["skor_akhir"] = pd.to_numeric(df["skor_akhir"], errors="coerce").fillna(0)
    df["skor_maks"] = pd.to_numeric(df["skor_maks"], errors="coerce").fillna(0)
    pending = df[df["status"] == "pending"].groupby(["student_id", "tes"]).size().rename("pending")

    skor = df.groupby(["kelas", "student_id", "nama", "nis", "tes"]).agg(skor=("skor_akhir", "sum"), maks=("skor_maks", "sum")).reset_index()
    skor = skor.join(pending, on=["student_id", "tes"]).fillna({"pending": 0})
    wide = skor.pivot_table(index=["kelas", "student_id", "nama", "nis"], columns="tes", values=["skor", "maks", "pending"], aggfunc="first")
    wide.columns = [f"{a}_{b}" for a, b in wide.columns]
    wide = wide.reset_index()
    for col in ("skor_pre", "skor_post", "maks_pre", "maks_post", "pending_pre", "pending_post"):
        if col not in wide:
            wide[col] = pd.NA
    maks = wide["maks_post"].fillna(wide["maks_pre"])
    wide["n_gain"] = (wide["skor_post"] - wide["skor_pre"]) / (maks - wide["skor_pre"])
    wide["kategori"] = wide["n_gain"].apply(kategori)
    wide["catatan"] = wide.apply(
        lambda r: "ada uraian belum dinilai" if (r["pending_pre"] or 0) + (r["pending_post"] or 0) > 0 else "", axis=1
    )
    return wide[["kelas", "student_id", "nama", "nis", "skor_pre", "skor_post", "n_gain", "kategori", "catatan"]]


def uji(wide: pd.DataFrame) -> list[str]:
    lengkap = wide.dropna(subset=["skor_pre", "skor_post"])
    out = [f"Siswa dengan data pre & post lengkap: {len(lengkap)}"]
    if len(lengkap) < 3:
        out.append("Data terlalu sedikit untuk uji statistik (minimal 3).")
        return out
    pre, post = lengkap["skor_pre"].astype(float), lengkap["skor_post"].astype(float)
    out.append(f"Rata-rata pretest  = {pre.mean():.2f} (SD {pre.std():.2f})")
    out.append(f"Rata-rata posttest = {post.mean():.2f} (SD {post.std():.2f})")
    g = lengkap["n_gain"].astype(float)
    out.append(f"Rata-rata N-gain   = {g.mean():.3f} → kategori {kategori(g.mean())}")
    out.append("Distribusi kategori: " + ", ".join(f"{k}={v}" for k, v in lengkap["kategori"].value_counts().items()))

    selisih = post - pre
    w, p_norm = stats.shapiro(selisih) if len(selisih) >= 3 else (float("nan"), float("nan"))
    out.append(f"Shapiro-Wilk (selisih post−pre): W = {w:.3f}, p = {p_norm:.4f}")
    if p_norm >= 0.05:
        t, p = stats.ttest_rel(post, pre)
        out.append(f"Data normal → uji-t berpasangan: t = {t:.3f}, p = {p:.4f}")
    else:
        res = stats.wilcoxon(post, pre)
        out.append(f"Data tidak normal → uji Wilcoxon: W = {res.statistic:.3f}, p = {res.pvalue:.4f}")
    out.append("Kesimpulan: " + ("terdapat perbedaan signifikan (α = 0,05)." if (p if p_norm >= 0.05 else res.pvalue) < 0.05 else "tidak terdapat perbedaan signifikan (α = 0,05)."))
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv", nargs="+", type=Path)
    ap.add_argument("--out", type=Path, default=Path("hasil_ngain.xlsx"))
    args = ap.parse_args()

    df = pd.concat([pd.read_csv(p, encoding="utf-8-sig", dtype={"nis": str}) for p in args.csv], ignore_index=True)
    wide = rekap(df)
    laporan = uji(wide)

    pd.set_option("display.width", 140)
    print(wide.to_string(index=False, float_format=lambda v: f"{v:.2f}"))
    print("\n" + "\n".join(laporan))
    try:
        with pd.ExcelWriter(args.out) as xw:
            wide.to_excel(xw, sheet_name="Rekap N-gain", index=False)
            pd.DataFrame({"Hasil analisis": laporan}).to_excel(xw, sheet_name="Uji statistik", index=False)
        print(f"\n✔ Disimpan ke {args.out}")
    except ModuleNotFoundError:
        print("\n(Pasang openpyxl untuk menyimpan ke Excel: pip install openpyxl)", file=sys.stderr)


if __name__ == "__main__":
    main()
