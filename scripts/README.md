# MCA-Bench 데이터셋 준비

## 1. 의존성 설치

```bash
pip install -r scripts/requirements.txt
```

또는

```bash
pip install kagglehub
```

## 2. Kaggle API 설정 (최초 1회)

1. [Kaggle](https://www.kaggle.com) 로그인
2. Account → Create New Token → `kaggle.json` 다운로드
3. `kaggle.json`을 다음 위치에 배치:
   - Windows: `C:\Users\<사용자명>\.kaggle\kaggle.json`
   - Mac/Linux: `~/.kaggle/kaggle.json`

## 3. 데이터셋 다운로드 및 샘플 복사

```bash
# 프로젝트 루트에서
npm run download-mca
```

또는

```bash
python scripts/download_mca_bench.py
```

- Kaggle에서 `luffy798/mca-benchmultimodal-captchas` 데이터셋 다운로드
- 각 종목별 30개 샘플을 `HT/public/captcha-data/` 에 복사
- `manifest.json` 메타데이터 생성

## 4. 앱 실행

```bash
cd HT
npm run dev
```

홈에서 **MCA-Bench (20종목)** 카드를 클릭하면 18개 종목별 연습이 가능합니다.
