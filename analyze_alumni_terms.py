"""
同窓会メンバーCSV（bbb 38-60.csv）を List-of-each-term の集計思想に合わせて分析する。

- 出身: 本籍地（参考プロジェクトの「本籍」と同様に is_okinawa_birthplace）
- 就職・勤務: 勤務先 + 勤務先住所（参考の「動向調査」に相当する一次情報として扱う）
- 施設が沖縄県内かは kibetu_list.is_okinawa_facility（キーワード／施設セット）を利用

OPENAI_API_KEY があれば施設名の正規化を試みるが、無くてもキーワード判定で動作する。
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

# 親リポジトリの List-of-each-term を参照
_REPO = Path(__file__).resolve().parent
_KIBETU_ROOT = _REPO.parent / "List-of-each-term"
if str(_KIBETU_ROOT) not in sys.path:
    sys.path.insert(0, str(_KIBETU_ROOT))

from kibetu_list import (  # noqa: E402
    OKINAWA_FACILITIES_RAW,
    is_okinawa_birthplace,
    is_okinawa_facility,
    normalize_facility_name,
    normalize_name,
)

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None  # type: ignore


def _blank(s: Any) -> bool:
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return True
    return str(s).strip() == ""


def classify_birthplace(honseki: Any) -> str:
    """okinawa | outside | unknown"""
    if _blank(honseki):
        return "unknown"
    if is_okinawa_birthplace(honseki):
        return "okinawa"
    return "outside"


def _build_okinawa_facility_set(client: Any, cache: Dict[str, str]) -> set:
    s: set = set()
    for facility in OKINAWA_FACILITIES_RAW:
        normalized = normalize_facility_name(facility, client=client, cache=cache)
        if normalized:
            s.add(normalized)
    return s


_OKINAWA_CITY_RE = re.compile(
    r"(那覇|宜野湾|うるま|沖縄市|豊見城|糸満|浦添|名護|石垣|宮古島|与那国|国頭|今帰仁|読谷|北谷|嘉手納|美ら|琉球大学|琉大)"
)


def classify_workplace(
    work: Any,
    addr: Any,
    bikou: Any,
    okinawa_facilities_set: Optional[set],
    client: Any,
    cache: Dict[str, str],
) -> str:
    """
    okinawa | outside | unknown
    勤務先・勤務先住所を優先。空のときは備考（転勤・進学先の記載）から推定（List-of-each-term
    の動向調査に相当する情報が備考に入っているケース向け）。
    """
    w = "" if _blank(work) else str(work).strip()
    a = "" if _blank(addr) else str(addr).strip()
    combined_raw = f"{w} {a}".strip()
    if not combined_raw:
        combined_raw = "" if _blank(bikou) else str(bikou).strip()
    if not combined_raw:
        return "unknown"

    if client is not None:
        text = normalize_facility_name(combined_raw, client=client, cache=cache) or combined_raw
    else:
        text = combined_raw

    if okinawa_facilities_set is not None:
        flag = is_okinawa_facility(text, okinawa_facilities_set)
    else:
        flag = is_okinawa_facility(text, None)

    if flag:
        return "okinawa"
    # 住所・施設名に明示的な沖縄県情報（キーワード漏れ補正）
    if re.search(r"沖縄|おきなわ|Okinawa|okinawa", text, re.I):
        return "okinawa"
    if _OKINAWA_CITY_RE.search(text):
        return "okinawa"
    return "outside"


def cross_key(birth: str, work: str) -> str:
    mapping = {
        ("okinawa", "okinawa"): "沖縄出身_県内勤務",
        ("okinawa", "outside"): "沖縄出身_県外勤務",
        ("okinawa", "unknown"): "沖縄出身_勤務先不明",
        ("outside", "okinawa"): "県外出身_県内勤務",
        ("outside", "outside"): "県外出身_県外勤務",
        ("outside", "unknown"): "県外出身_勤務先不明",
        ("unknown", "okinawa"): "出身不明_県内勤務",
        ("unknown", "outside"): "出身不明_県外勤務",
        ("unknown", "unknown"): "出身不明_勤務先不明",
    }
    return mapping.get((birth, work), "その他")


def is_ryukyu_university(univ: Any) -> bool:
    """
    出身大学が琉球大学（県内の医学部）か。
    「琉球大学」「琉球大学医学部」「琉大」表記などを含む場合に True。
    """
    if _blank(univ):
        return False
    s = str(univ).strip()
    if "琉球大学" in s:
        return True
    # 出身大学列に「琉大」のみのケース
    if re.fullmatch(r"琉大\s*", s):
        return True
    return False


def analyze_university_by_period(
    csv_path: Path,
    period_min: int = 38,
    period_max: int = 60,
) -> pd.DataFrame:
    """期別・出身大学が琉球大学（県内）かその他（県外）かの人数と割合。"""
    df = load_csv(csv_path)
    if "出身大学" not in df.columns or "期" not in df.columns or "氏名" not in df.columns:
        raise ValueError("必須列: 氏名, 期, 出身大学")

    df = df.copy()
    df["期_num"] = pd.to_numeric(df["期"], errors="coerce")
    df = df[df["期_num"].between(period_min, period_max)]

    rows: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        if _blank(row.get("氏名")):
            continue
        u = row.get("出身大学", "")
        rows.append(
            {
                "期": int(row["期_num"]),
                "琉球大学_県内": 1 if is_ryukyu_university(u) else 0,
                "その他大学_県外": 0 if is_ryukyu_university(u) else 1,
            }
        )

    if not rows:
        return pd.DataFrame()

    t = pd.DataFrame(rows)
    out_rows: List[Dict[str, Any]] = []
    for period in range(period_min, period_max + 1):
        sub = t[t["期"] == period]
        if sub.empty:
            continue
        n = len(sub)
        r = int(sub["琉球大学_県内"].sum())
        o = int(sub["その他大学_県外"].sum())
        out_rows.append(
            {
                "期": period,
                "総数": n,
                "琉球大学出身_県内_人数": r,
                "その他大学出身_県外_人数": o,
                "琉球大学出身_県内_pct": round(100.0 * r / n, 1) if n else 0.0,
                "その他大学出身_県外_pct": round(100.0 * o / n, 1) if n else 0.0,
            }
        )
    return pd.DataFrame(out_rows)


def load_csv(path: Path) -> pd.DataFrame:
    for enc in ("utf-8-sig", "utf-8", "cp932"):
        try:
            return pd.read_csv(path, encoding=enc, dtype=str, keep_default_na=False)
        except UnicodeDecodeError:
            continue
    raise RuntimeError(f"Could not decode CSV: {path}")


def analyze(
    csv_path: Path,
    period_min: int = 38,
    period_max: int = 60,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    df = load_csv(csv_path)
    required = ["氏名", "期", "本籍地", "勤務先", "勤務先住所", "備考"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"必須列がありません: {missing}")

    df = df.copy()
    df["期_num"] = pd.to_numeric(df["期"], errors="coerce")
    df = df[df["期_num"].between(period_min, period_max)]

    client = None
    if OpenAI and os.getenv("OPENAI_API_KEY"):
        try:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        except Exception:
            client = None

    cache: Dict[str, str] = {}
    ok_set = _build_okinawa_facility_set(client, cache) if client else None

    rows_out: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        name = row.get("氏名", "")
        if _blank(name):
            continue
        birth = classify_birthplace(row.get("本籍地"))
        work = classify_workplace(
            row.get("勤務先"),
            row.get("勤務先住所"),
            row.get("備考"),
            ok_set,
            client,
            cache,
        )
        key = cross_key(birth, work)
        rows_out.append(
            {
                "期": int(row["期_num"]),
                "氏名": str(name).strip(),
                "氏名_正規化": normalize_name(name),
                "出身区分": birth,
                "勤務地区分": work,
                "分類": key,
                "本籍地": row.get("本籍地", ""),
                "勤務先": row.get("勤務先", ""),
                "勤務先住所": row.get("勤務先住所", ""),
                "備考": row.get("備考", ""),
            }
        )

    detail = pd.DataFrame(rows_out)

    # 期別ピボット（参考の集計結果シートに相当）
    cat_cols = [
        "沖縄出身_県内勤務",
        "沖縄出身_県外勤務",
        "沖縄出身_勤務先不明",
        "県外出身_県内勤務",
        "県外出身_県外勤務",
        "県外出身_勤務先不明",
        "出身不明_県内勤務",
        "出身不明_県外勤務",
        "出身不明_勤務先不明",
    ]
    summary_rows: List[Dict[str, Any]] = []
    for period in range(period_min, period_max + 1):
        sub = detail[detail["期"] == period]
        if sub.empty:
            continue
        rec: Dict[str, Any] = {"期": period, "総数": len(sub)}
        vc = sub["分類"].value_counts()
        for c in cat_cols:
            rec[c] = int(vc.get(c, 0))
        summary_rows.append(rec)

    summary = pd.DataFrame(summary_rows)
    meta = {
        "source": str(csv_path),
        "rows_input": len(df),
        "rows_detail": len(detail),
        "openai_used": client is not None,
    }
    return summary, {"detail": detail, "meta": meta}


def main() -> None:
    csv_path = _REPO / "bbb 38-60.csv"
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        sys.exit(1)

    summary, bundle = analyze(csv_path)
    out_dir = _REPO / "analysis_output"
    out_dir.mkdir(exist_ok=True)

    summary_path = out_dir / "term_summary.csv"
    detail_path = out_dir / "member_classification.csv"
    meta_path = out_dir / "run_meta.json"

    summary.to_csv(summary_path, index=False, encoding="utf-8-sig")
    bundle["detail"].to_csv(detail_path, index=False, encoding="utf-8-sig")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(bundle["meta"], f, ensure_ascii=False, indent=2)

    uni_path = out_dir / "term_university_origin_pct.csv"
    uni_df = analyze_university_by_period(csv_path)
    uni_df.to_csv(uni_path, index=False, encoding="utf-8-sig")

    print("=== 期別サマリー（出身×勤務地） ===")
    print(summary.to_string(index=False))
    print()
    print("=== 期別・出身大学（琉球大学＝県内 / その他＝県外）割合 ===")
    print(uni_df.to_string(index=False))
    print()
    print(f"Wrote: {summary_path}")
    print(f"Wrote: {detail_path}")
    print(f"Wrote: {meta_path}")
    print(f"Wrote: {uni_path}")


if __name__ == "__main__":
    main()
