"""
firstadd/model/scaler_v2.pkl + xgboost_bot_detector_v2.json
→ HT/api/models/bot-detector-v2-bundle.json (Vercel Node 추론용)

실행: py -3 scripts/export_bot_detector_v2.py
"""

from __future__ import annotations

import json
import os
import sys

import joblib
import xgboost as xgb

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC_DIR = os.path.join(ROOT, "firstadd", "model")
OUT_PATH = os.path.join(ROOT, "HT", "api", "models", "bot-detector-v2-bundle.json")

FEATURE_NAMES = [
    "mean_velocity",
    "mean_jitter",
    "straightness",
    "mean_acceleration",
    "velocity_variance",
    "acceleration_variance",
    "mean_jerk",
    "pause_ratio",
]


def main() -> None:
    scaler_path = os.path.join(SRC_DIR, "scaler_v2.pkl")
    xgb_path = os.path.join(SRC_DIR, "xgboost_bot_detector_v2.json")
    for p in (scaler_path, xgb_path):
        if not os.path.isfile(p):
            print(f"Missing: {p}", file=sys.stderr)
            sys.exit(1)

    scaler = joblib.load(scaler_path)
    fn = getattr(scaler, "feature_names_in_", None)
    if fn is not None:
        loaded = [str(x) for x in fn]
        if loaded != FEATURE_NAMES:
            raise ValueError(f"scaler feature order mismatch: {loaded} vs {FEATURE_NAMES}")

    booster = xgb.Booster()
    booster.load_model(xgb_path)
    trees_json = [json.loads(s) for s in booster.get_dump(dump_format="json")]

    bundle = {
        "version": 1,
        "label_bot": 1,
        "label_human": 0,
        "feature_names": FEATURE_NAMES,
        "scaler": {
            "mean": [float(x) for x in scaler.mean_],
            "scale": [float(x) for x in scaler.scale_],
        },
        "trees": trees_json,
        "threshold_bot": 0.5,
        "tier_review_min": 0.6,
        "tier_deny_min": 0.9,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(bundle, f)
    print(f"Wrote {OUT_PATH} ({len(trees_json)} trees)")


if __name__ == "__main__":
    main()
