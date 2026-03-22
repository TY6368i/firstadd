"""
MCA-Bench 데이터셋 다운로드 및 프론트엔드용 샘플 복사 스크립트
- Kaggle에서 데이터셋 다운로드
- 각 종목별로 샘플 이미지를 HT/public/captcha-data/에 복사
"""
import os
import json
import shutil
import random
import sys

# Windows cp949 인코딩 문제 방지
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

try:
    import kagglehub
except ImportError:
    print("kagglehub가 필요합니다: pip install kagglehub")
    exit(1)

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if _SCRIPT_DIR not in sys.path:
    sys.path.insert(0, _SCRIPT_DIR)
from mca_label_parser import build_puzzle  # noqa: E402

# 프로젝트 루트
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_CAPTCHA = os.path.join(PROJECT_ROOT, "HT", "public", "captcha-data")
SAMPLE_PER_CATEGORY = 30  # 종목당 복사할 샘플 수
TEXT_SAMPLE_ROWS = 20  # 텍스트 전용 종목(CSV) 샘플 수


def slugify(name: str) -> str:
    """폴더명을 URL-safe slug로 변환"""
    return name.replace(" ", "-").replace("×", "x").replace("‐", "-").lower()


def load_csv_qa(dataset_path: str, category_name: str, max_rows: int) -> list[dict]:
    """commonsense / text arithmetic 등 CSV 질문·답 로드."""
    import csv

    cat_path = os.path.join(dataset_path, category_name)
    if not os.path.isdir(cat_path):
        return []
    csv_name = None
    for f in os.listdir(cat_path):
        if f.lower().endswith(".csv"):
            csv_name = f
            break
    if not csv_name:
        return []
    path = os.path.join(cat_path, csv_name)
    rows: list[dict] = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace", newline="") as fp:
            reader = csv.DictReader(fp)
            for i, row in enumerate(reader):
                if i >= max_rows:
                    break
                q = (row.get("question") or row.get("Question") or "").strip()
                a = (row.get("answer") or row.get("Answer") or "").strip()
                if q and a:
                    rows.append({"question": q, "answer": a})
    except OSError:
        return []
    return rows


def main():
    print("1. MCA-Bench 데이터셋 다운로드 중...")
    path = kagglehub.dataset_download("luffy798/mca-benchmultimodal-captchas")
    dataset_path = os.path.join(path, "data_set", "dataset")

    if not os.path.exists(dataset_path):
        print(f"오류: 데이터셋 경로를 찾을 수 없습니다: {dataset_path}")
        return

    print(f"   다운로드 경로: {path}")

    # 출력 디렉토리 생성
    os.makedirs(PUBLIC_CAPTCHA, exist_ok=True)

    categories_meta = []
    for category_name in sorted(os.listdir(dataset_path)):
        cat_path = os.path.join(dataset_path, category_name)
        if not os.path.isdir(cat_path):
            continue

        slug = slugify(category_name)
        out_dir = os.path.join(PUBLIC_CAPTCHA, slug)
        os.makedirs(out_dir, exist_ok=True)

        # 이미지 파일 수집 (하위 폴더 포함)
        all_files = []
        for root, _, files in os.walk(cat_path):
            rel = os.path.relpath(root, cat_path)
            for f in files:
                if f.lower().endswith((".png", ".jpg", ".jpeg")):
                    if rel == ".":
                        all_files.append(f)
                    else:
                        all_files.append(os.path.join(rel, f))

        if not all_files:
            print(f"   건너뜀: {slug} (이미지 없음)")
            continue

        # 샘플 선택
        sample_count = min(SAMPLE_PER_CATEGORY, len(all_files))
        samples = random.sample(all_files, sample_count)

        copied_files = []
        puzzles: list[dict] = []
        seen_basenames = {}
        for f in samples:
            src = os.path.join(cat_path, f)
            base_name = os.path.basename(f)
            stem, ext = os.path.splitext(base_name)
            if base_name in seen_basenames:
                seen_basenames[base_name] += 1
                out_name = f"{stem}_{seen_basenames[base_name]}{ext}"
            else:
                seen_basenames[base_name] = 0
                out_name = base_name
            dst = os.path.join(out_dir, out_name)
            try:
                shutil.copy2(src, dst)
                copied_files.append(out_name)
                pz = build_puzzle(cat_path, f, slug)
                pz["file"] = out_name
                puzzles.append(pz)
            except Exception as e:
                print(f"   복사 실패 {out_name}: {e}")

        categories_meta.append({
            "key": slug,
            "name": category_name,
            "label": category_name,
            "count": len(copied_files),
            "total": len(all_files),
            "files": copied_files,
            "puzzles": puzzles,
        })
        print(f"   {category_name}: {len(copied_files)}개 복사 (총 {len(all_files)}개 중)")

    # 텍스트 전용 종목 (이미지 없음)
    text_categories: list[dict] = []
    for tname in ("commonsense reasoning", "text‐based arithmetic"):
        tslug = slugify(tname)
        items = load_csv_qa(dataset_path, tname, TEXT_SAMPLE_ROWS)
        if items:
            text_categories.append({
                "key": tslug,
                "name": tname,
                "label": tname,
                "kind": "text",
                "count": len(items),
                "total": len(items),
                "items": items,
            })
            print(f"   (텍스트) {tname}: {len(items)}개 Q&A")

    # 메타데이터 저장
    meta_path = os.path.join(PUBLIC_CAPTCHA, "manifest.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(
            {"categories": categories_meta, "textCategories": text_categories},
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"\n완료! 메타데이터: {meta_path}")
    print(f"총 {len(categories_meta)}개 이미지 종목 + {len(text_categories)}개 텍스트 종목.")


if __name__ == "__main__":
    main()
