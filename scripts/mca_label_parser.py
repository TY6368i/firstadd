"""
MCA-Bench 샘플 폴더에서 instruction/라벨 텍스트를 읽어 프론트엔드용 퍼즐 메타로 변환합니다.
"""
from __future__ import annotations

import os
import re
from typing import Any


def _read_text(path: str) -> str | None:
    if not os.path.isfile(path):
        return None
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return None


def _find_label_text(cat_path: str, img_rel: str) -> tuple[str | None, str | None]:
    """이미지와 같은 디렉터리의 라벨 파일 내용과 파일명 반환."""
    full = os.path.join(cat_path, img_rel)
    folder = os.path.dirname(full)
    base = os.path.basename(img_rel)
    stem, _ = os.path.splitext(base)

    candidates = [
        os.path.join(folder, "instruction.txt"),
        os.path.join(folder, f"{stem}.txt"),
        os.path.join(folder, "generated_text.txt"),
        os.path.join(folder, "output.txt"),
    ]
    for p in candidates:
        t = _read_text(p)
        if t and t.strip():
            return t.strip(), os.path.basename(p)
    # 폴더 내 첫 .txt (이미지 제외)
    if os.path.isdir(folder):
        for name in sorted(os.listdir(folder)):
            if name.lower().endswith(".txt") and name != base:
                t = _read_text(os.path.join(folder, name))
                if t and t.strip():
                    return t.strip(), name
    return None, None


def parse_label_for_slug(slug: str, raw: str) -> dict[str, Any]:
    """슬러그별 휴리스틱 파싱."""
    text = raw.strip()
    out: dict[str, Any] = {
        "instructionEn": text,
        "interaction": "info",
    }

    # 3x3 grid — Position coordinates: [4, 6, 8]
    m = re.search(r"Position coordinates:\s*\[([\d,\s]+)\]", text, re.I)
    if m:
        parts = [p.strip() for p in m.group(1).split(",")]
        indices = [int(p) for p in parts if p.isdigit()]
        out["interaction"] = "grid_3x3"
        out["gridIndices"] = indices
        return out

    # full-image grid — 마지막 줄 0,1,2,3
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if lines:
        last = lines[-1]
        if re.fullmatch(r"[\d,\s]+", last) and "," in last:
            nums = [int(x.strip()) for x in last.split(",") if x.strip().isdigit()]
            if nums and max(nums) <= 20:
                out["interaction"] = "grid_3x3"
                out["gridIndices"] = nums
                return out

    # jigsaw — 마지막 줄 두 숫자 (타일 두 칸)
    if lines:
        m2 = re.fullmatch(r"(\d+)\s+(\d+)", lines[-1])
        if m2 and ("misplaced" in text.lower() or "nine-square" in text.lower() or "restore" in text.lower()):
            out["interaction"] = "grid_3x3_two"
            out["gridIndices"] = [int(m2.group(1)), int(m2.group(2))]
            return out

    # distorted word — 마지막 비어있지 않은 줄이 단어들
    if "english words" in text.lower() or "write two" in text.lower():
        tail = lines[-1] if lines else ""
        if tail and not tail.startswith("Please"):
            out["interaction"] = "text"
            out["expectedText"] = tail.strip()
            return out

    # arithmetic character — : -7 또는 result
    m3 = re.search(r":\s*(-?\d+)\s*$", text, re.MULTILINE)
    if m3 and ("calculate" in text.lower() or "result" in text.lower()):
        out["interaction"] = "text"
        out["expectedText"] = m3.group(1).strip()
        return out

    # 좌표 박스들 (x, y, x, y)
    boxes = []
    for bx in re.finditer(
        r"\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)", text
    ):
        boxes.append(
            [int(bx.group(1)), int(bx.group(2)), int(bx.group(3)), int(bx.group(4))]
        )
    if boxes and (
        "click" in text.lower()
        or "pick" in text.lower()
        or "letter" in text.lower()
        or "star" in text.lower()
        or "shape" in text.lower()
        or "vowel" in text.lower()
    ):
        out["interaction"] = "click_boxes"
        out["boxes"] = boxes
        return out

    # inverted — 세미콜론 구분 박스
    if "upside down" in text.lower() or "upside-down" in text.lower():
        boxes2 = []
        for part in text.split(";"):
            mm = re.search(
                r"\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)", part
            )
            if mm:
                boxes2.append(
                    [
                        int(mm.group(1)),
                        int(mm.group(2)),
                        int(mm.group(3)),
                        int(mm.group(4)),
                    ]
                )
        if boxes2:
            out["interaction"] = "click_boxes"
            out["boxes"] = boxes2
            return out

    # vowel — E: (x,y,...)
    if "vowel" in text.lower():
        boxes3 = []
        for mm in re.finditer(
            r"^[A-Za-z]\s*:\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",
            text,
            re.MULTILINE,
        ):
            boxes3.append(
                [
                    int(mm.group(1)),
                    int(mm.group(2)),
                    int(mm.group(3)),
                    int(mm.group(4)),
                ]
            )
        if boxes3:
            out["interaction"] = "click_boxes"
            out["boxes"] = boxes3
            return out

    out["interaction"] = "info"
    out["answerHint"] = text[:500]
    return out


def build_puzzle(cat_path: str, img_rel: str, slug: str) -> dict[str, Any]:
    raw, label_file = _find_label_text(cat_path, img_rel)
    if not raw:
        return {
            "instructionEn": "",
            "interaction": "browse",
            "answerHint": "",
        }
    parsed = parse_label_for_slug(slug, raw)
    parsed["labelFile"] = label_file
    return parsed

