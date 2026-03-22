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

# 프로젝트 루트
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_CAPTCHA = os.path.join(PROJECT_ROOT, "HT", "public", "captcha-data")
SAMPLE_PER_CATEGORY = 30  # 종목당 복사할 샘플 수


def slugify(name: str) -> str:
    """폴더명을 URL-safe slug로 변환"""
    return name.replace(" ", "-").replace("×", "x").replace("‐", "-").lower()


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
            except Exception as e:
                print(f"   복사 실패 {out_name}: {e}")

        categories_meta.append({
            "key": slug,
            "name": category_name,
            "label": category_name,
            "count": len(copied_files),
            "total": len(all_files),
            "files": copied_files,
        })
        print(f"   {category_name}: {len(copied_files)}개 복사 (총 {len(all_files)}개 중)")

    # 메타데이터 저장
    meta_path = os.path.join(PUBLIC_CAPTCHA, "manifest.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({"categories": categories_meta}, f, ensure_ascii=False, indent=2)

    print(f"\n완료! 메타데이터: {meta_path}")
    print(f"총 {len(categories_meta)}개 종목 준비됨.")


if __name__ == "__main__":
    main()
