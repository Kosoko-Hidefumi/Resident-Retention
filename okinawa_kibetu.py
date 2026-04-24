"""
沖縄県内施設・本籍判定（List-of-each-term の kibetu_list から必要部分のみ）。

元リポジトリ: https://github.com/Kosoko-Hidefumi/List-of-each-term
このファイルは上記のロジックを self-contained 運用のために複製したものです。
"""
from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, Optional

import pandas as pd

# 沖縄県の施設リスト（正規化前）
OKINAWA_FACILITIES_RAW = [
    "県立宮古病院",
    "県立北部病院",
    "県立八重山病院",
    "県立中部病院",
    "伊平屋診療所",
    "伊是名診療所",
    "西表西部診療所",
    "小浜診療所",
    "南部医療センター附属北大東診療所",
    "八重山病院附属西表西武診療所",
    "八重山病院",
    "北部病院附属伊平屋診療所",
    "琉大病院　麻酔科",
    "琉大病院　消化器　外科",
    "宮古病院",
    "中部病院",
    "北部病院",
    "南部医療センター附属南大東診療所",
    "座間味診療所",
    "阿嘉診療所",
    "県立八重山病院付属大原診療所",
    "県立北部病院付属伊是名診療所",
    "県立北部病院所属伊平屋診療所",
    "精和病院",
    "日本赤十字センター",
    "県立南部医療センター所属粟国診療所",
    "琉大附属病院　整形外科",
    "県立南部医療センター所属南大東診療所",
    "琉大病院",
    "県立南部医療センター所属渡名喜診療所",
    "県立南部医療センター所属波照間診療所",
    "県立南部医療センター所属阿嘉診療所",
    "県立北部病院所属伊是名診療所",
    "粟国診療所",
    "北大東診療所",
    "大原診療所",
    "南部医療センター",
    "県立南部医療センター所属座間味診療所",
    "県立北部病院所属伊是名診療所",
    "琉大附属病院",
    "浦添総合病院",
    "琉球大学医学部附属病院　泌尿器科",
]


def normalize_name(name: Any) -> str:
    """
    名前を正規化する（括弧部分を削除）
    例: '筧咲陽子(渡部)' -> '筧咲陽子'
    """
    if pd.isna(name):
        return ""
    name_str = str(name)
    normalized = re.sub(r"[（(].+?[）)]", "", name_str)
    return normalized.strip()


def normalize_facility_name(
    facility_name: str,
    client: Any = None,
    cache: Optional[Dict[str, str]] = None,
) -> str:
    """
    OpenAI API を使って施設名を正規化する（API キーが無い場合は元の文字列を返す）。
    """
    if pd.isna(facility_name) or not facility_name or str(facility_name).strip() == "":
        return ""

    facility_str = str(facility_name).strip()

    if cache is not None and facility_str in cache:
        return cache[facility_str]

    if client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return facility_str
        try:
            from openai import OpenAI
        except ImportError:
            return facility_str
        client = OpenAI(api_key=api_key)

    try:
        prompt = f"""以下の施設名が沖縄県内の医療施設かどうかを判定し、沖縄県内の施設の場合は標準名に正規化してください。
沖縄県内の主要な施設名の例：
- 県立宮古病院
- 県立北部病院
- 県立八重山病院
- 県立中部病院
- 琉大病院（琉球大学医学部附属病院）
- 南部医療センター
- 宮古病院
- 北部病院
- 中部病院
- 八重山病院
- 各種診療所（伊平屋、伊是名、西表、小浜、座間味、阿嘉、大原、粟国、渡名喜、波照間、北大東、南大東など）

入力施設名: {facility_str}

JSON形式で回答してください：
{{"is_okinawa": true/false, "normalized_name": "正規化された施設名（沖縄県内の場合のみ）", "original": "{facility_str}"}}
沖縄県外の施設の場合は、is_okinawaをfalseにし、normalized_nameは空文字列にしてください。"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "あなたは医療施設名を正規化する専門家です。JSON形式で正確に回答してください。",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
        )

        result_text = response.choices[0].message.content.strip()
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        result = json.loads(result_text)
        if result.get("is_okinawa", False) and result.get("normalized_name"):
            normalized = result["normalized_name"]
        else:
            normalized = facility_str

        if cache is not None:
            cache[facility_str] = normalized
        return normalized
    except Exception as e:  # noqa: BLE001
        print(f"[WARNING] 施設名の正規化でエラーが発生しました ({facility_str}): {e}")
        if cache is not None:
            cache[facility_str] = facility_str
        return facility_str


def is_okinawa_birthplace(birthplace: str) -> bool:
    """本籍が沖縄県かどうかを判定する。"""
    if pd.isna(birthplace) or not birthplace:
        return False
    birthplace_str = str(birthplace).strip()
    okinawa_keywords = ["沖縄", "おきなわ", "OKINAWA", "okinawa"]
    return any(keyword in birthplace_str for keyword in okinawa_keywords)


def is_okinawa_facility(
    facility_name: str, normalized_facilities: Optional[set] = None
) -> bool:
    """施設が沖縄県内の医療施設かどうかを判定する。"""
    if pd.isna(facility_name) or not facility_name:
        return False
    facility_str = str(facility_name).strip()
    if normalized_facilities is not None:
        return facility_str in normalized_facilities
    okinawa_keywords = [
        "県立",
        "宮古",
        "北部",
        "八重山",
        "中部",
        "南部",
        "琉大",
        "琉球大学",
        "伊平屋",
        "伊是名",
        "西表",
        "小浜",
        "座間味",
        "阿嘉",
        "大原",
        "粟国",
        "渡名喜",
        "波照間",
        "北大東",
        "南大東",
        "精和",
        "浦添",
    ]
    return any(keyword in facility_str for keyword in okinawa_keywords)
