"""
포인터 궤적으로 사람(1) vs 단순 봇(0) XGBoost 학습 → HT/api/models/pointer-xgb-trees.json

실행: py -3 scripts/train_pointer_xgb.py
의존성: pip install xgboost numpy
"""

from __future__ import annotations

import json
import math
import os
import random
from typing import Any, Dict, List, Tuple

import numpy as np
import xgboost as xgb

FEATURE_NAMES: List[str] = [
    "n_total",
    "move_count",
    "down_count",
    "wall_ms",
    "trace_ms",
    "path_len",
    "speed_mean",
    "speed_std",
    "dir_changes",
    "idle_ratio",
    "straight_ratio",
]

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_PATH = os.path.join(ROOT, "HT", "api", "models", "pointer-xgb-trees.json")


def session_features(
    pointers: List[Dict[str, Any]], started_at_ms: float, ended_at_ms: float
) -> Dict[str, float]:
    """HT/api/pointer-human-xgb.js 의 computePointerFeatures() 와 동일."""
    wall_ms = max(0.0, min(600_000.0, float(ended_at_ms) - float(started_at_ms)))
    empty = {k: 0.0 for k in FEATURE_NAMES}
    empty["wall_ms"] = wall_ms
    if not pointers:
        return empty

    pts = sorted(pointers, key=lambda p: p["t"])
    move_count = sum(1 for p in pts if p.get("k") == "move")
    down_count = sum(1 for p in pts if p.get("k") == "down")
    ts = [p["t"] for p in pts]
    trace_ms = max(0.0, max(ts) - min(ts))

    path_len = 0.0
    step_speeds: List[float] = []
    dir_changes = 0
    idle_long = 0
    intervals = 0

    for i in range(1, len(pts)):
        a, b = pts[i - 1], pts[i]
        dx = float(b["x"]) - float(a["x"])
        dy = float(b["y"]) - float(a["y"])
        dist = math.hypot(dx, dy)
        dt = max(0.0, float(b["t"]) - float(a["t"]))
        path_len += dist
        step_speeds.append(dist / dt if dt > 1e-6 else 0.0)
        if dt >= 120:
            idle_long += 1
        intervals += 1

        if i >= 2:
            p0 = pts[i - 2]
            v1x = float(a["x"]) - float(p0["x"])
            v1y = float(a["y"]) - float(p0["y"])
            l1 = math.hypot(v1x, v1y)
            l2 = math.hypot(dx, dy)
            if l1 > 3 and l2 > 3:
                dot = (v1x * dx + v1y * dy) / (l1 * l2)
                c = min(1.0, max(-1.0, dot))
                if c < 0.92:
                    dir_changes += 1

    n = len(pts)
    trace_sec = trace_ms / 1000.0 + 1e-6
    speed_mean = path_len / trace_sec
    sm_step = float(np.mean(step_speeds)) if step_speeds else 0.0
    speed_std = float(np.std(step_speeds)) if step_speeds else 0.0
    idle_ratio = (idle_long / intervals) if intervals > 0 else 0.0

    x0, y0 = float(pts[0]["x"]), float(pts[0]["y"])
    x1, y1 = float(pts[-1]["x"]), float(pts[-1]["y"])
    chord = math.hypot(x1 - x0, y1 - y0)
    straight_ratio = path_len / (chord + 1.0)

    return {
        "n_total": float(n),
        "move_count": float(move_count),
        "down_count": float(down_count),
        "wall_ms": wall_ms,
        "trace_ms": float(trace_ms),
        "path_len": float(path_len),
        "speed_mean": float(speed_mean),
        "speed_std": float(speed_std),
        "dir_changes": float(dir_changes),
        "idle_ratio": float(idle_ratio),
        "straight_ratio": float(straight_ratio),
    }


def synth_human(rng: random.Random) -> Tuple[List[Dict[str, Any]], float, float, int]:
    started = 1_700_000_000_000.0
    wall = float(rng.randint(2500, 45_000))
    ended = started + wall
    n = rng.randint(45, 220)
    x0 = rng.uniform(80, 900)
    y0 = rng.uniform(80, 700)
    pts: List[Dict[str, Any]] = []
    t = 0.0
    x, y = x0, y0
    phase = rng.uniform(0, math.pi * 2)
    for i in range(n):
        if rng.random() < 0.88:
            k = "move"
        elif rng.random() < 0.6:
            k = "down"
        else:
            k = "up"
        pts.append({"t": round(t, 2), "x": round(x, 2), "y": round(y, 2), "k": k})
        t += rng.uniform(35, 95)
        x += rng.uniform(-42, 42) + 6 * math.sin(phase + i * 0.31)
        y += rng.uniform(-36, 36) + 5 * math.cos(phase + i * 0.27)
    return pts, started, ended, 1


def synth_bot(rng: random.Random) -> Tuple[List[Dict[str, Any]], float, float, int]:
    started = 1_700_000_000_000.0
    wall = float(rng.randint(120, 2200))
    ended = started + wall
    n = rng.randint(6, 38)
    x0 = rng.uniform(120, 800)
    y0 = rng.uniform(120, 600)
    x1 = x0 + rng.uniform(180, 520) * (1 if rng.random() > 0.5 else -1)
    y1 = y0 + rng.uniform(-40, 40)
    pts: List[Dict[str, Any]] = []
    t = 0.0
    for i in range(n):
        a = i / max(1, n - 1)
        x = x0 + (x1 - x0) * a + rng.uniform(-0.8, 0.8)
        y = y0 + (y1 - y0) * a + rng.uniform(-0.8, 0.8)
        k = "move" if rng.random() < 0.92 else "down"
        pts.append({"t": round(t, 2), "x": round(x, 2), "y": round(y, 2), "k": k})
        t += 48.0 + rng.uniform(-0.5, 0.5)
    return pts, started, ended, 0


def main() -> None:
    rng = random.Random(42)
    rows: List[Dict[str, float]] = []
    labels: List[int] = []
    for _ in range(3200):
        if rng.random() < 0.5:
            pts, st, en, y = synth_human(rng)
        else:
            pts, st, en, y = synth_bot(rng)
        fe = session_features(pts, st, en)
        rows.append(fe)
        labels.append(y)

    X = np.array([[fe[name] for name in FEATURE_NAMES] for fe in rows], dtype=np.float32)
    y_arr = np.array(labels, dtype=np.int32)
    dmat = xgb.DMatrix(X, label=y_arr, feature_names=FEATURE_NAMES)
    params = {
        "objective": "binary:logistic",
        "max_depth": 5,
        "eta": 0.15,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
        "eval_metric": "logloss",
    }
    booster = xgb.train(params, dmat, num_boost_round=40)
    trees_json = [json.loads(s) for s in booster.get_dump(dump_format="json")]
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {
                "version": 1,
                "feature_names": FEATURE_NAMES,
                "trees": trees_json,
                "label_human": 1,
                "label_bot": 0,
            },
            f,
        )
    print(f"Wrote {OUT_PATH} ({len(trees_json)} trees)")


if __name__ == "__main__":
    main()
