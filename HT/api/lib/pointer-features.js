/**
 * 포인터 궤적 → XGBoost 입력 특징 (scripts/train_pointer_xgb.py 와 동일).
 */

export const POINTER_FEATURE_NAMES = [
  'n_total',
  'move_count',
  'down_count',
  'wall_ms',
  'trace_ms',
  'path_len',
  'speed_mean',
  'speed_std',
  'dir_changes',
  'idle_ratio',
  'straight_ratio',
]

export const MAX_POINTS = 12_000

export function computePointerFeatures(pointers, startedAtMs, endedAtMs) {
  const empty = {
    n_total: 0,
    move_count: 0,
    down_count: 0,
    wall_ms: 0,
    trace_ms: 0,
    path_len: 0,
    speed_mean: 0,
    speed_std: 0,
    dir_changes: 0,
    idle_ratio: 0,
    straight_ratio: 0,
  }
  const wall_ms = Math.max(
    0,
    Math.min(600_000, Number(endedAtMs) - Number(startedAtMs)),
  )

  if (!Array.isArray(pointers) || pointers.length === 0) {
    return { ...empty, wall_ms }
  }

  const pts = [...pointers].sort((a, b) => a.t - b.t)
  let move_count = 0
  let down_count = 0
  for (const p of pts) {
    if (p.k === 'move') move_count += 1
    if (p.k === 'down') down_count += 1
  }

  const ts = pts.map((p) => p.t)
  const trace_ms = Math.max(0, Math.max(...ts) - Math.min(...ts))

  let path_len = 0
  const stepSpeeds = []
  let dir_changes = 0
  let idleLong = 0
  let intervals = 0

  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy)
    const dt = Math.max(0, b.t - a.t)
    path_len += dist
    if (dt > 1e-6) {
      stepSpeeds.push(dist / dt)
    } else {
      stepSpeeds.push(0)
    }
    if (dt >= 120) idleLong += 1
    intervals += 1

    if (i >= 2) {
      const p0 = pts[i - 2]
      const v1x = a.x - p0.x
      const v1y = a.y - p0.y
      const v2x = dx
      const v2y = dy
      const l1 = Math.hypot(v1x, v1y)
      const l2 = Math.hypot(v2x, v2y)
      if (l1 > 3 && l2 > 3) {
        const dot = (v1x * v2x + v1y * v2y) / (l1 * l2)
        const c = Math.min(1, Math.max(-1, dot))
        if (c < 0.92) dir_changes += 1
      }
    }
  }

  const n = pts.length
  const traceSec = trace_ms / 1000 + 1e-6
  const speed_mean = path_len / traceSec
  const smStep =
    stepSpeeds.length > 0 ? stepSpeeds.reduce((a, b) => a + b, 0) / stepSpeeds.length : 0
  const speed_std =
    stepSpeeds.length > 0
      ? Math.sqrt(stepSpeeds.reduce((s, v) => s + (v - smStep) ** 2, 0) / stepSpeeds.length)
      : 0

  const idle_ratio = intervals > 0 ? idleLong / intervals : 0

  const x0 = pts[0].x
  const y0 = pts[0].y
  const x1 = pts[pts.length - 1].x
  const y1 = pts[pts.length - 1].y
  const chord = Math.hypot(x1 - x0, y1 - y0)
  const straight_ratio = path_len / (chord + 1)

  return {
    n_total: n,
    move_count,
    down_count,
    wall_ms,
    trace_ms,
    path_len,
    speed_mean,
    speed_std,
    dir_changes,
    idle_ratio,
    straight_ratio,
  }
}

export function sanitizePointers(body) {
  const raw = body?.pointers
  if (!Array.isArray(raw)) return { error: 'pointers 배열이 필요합니다.' }
  if (raw.length > MAX_POINTS) {
    return { error: `pointers는 최대 ${MAX_POINTS}개까지 허용됩니다.` }
  }
  const out = []
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue
    const t = Number(p.t)
    const x = Number(p.x)
    const y = Number(p.y)
    const k = typeof p.k === 'string' ? p.k : 'move'
    if (!Number.isFinite(t) || !Number.isFinite(x) || !Number.isFinite(y)) continue
    out.push({ t, x, y, k })
  }
  return { pointers: out }
}

export function pointersToMouseTicks(pointers) {
  return pointers.map((p) => ({
    x: Number(p.x),
    y: Number(p.y),
    time: Number(p.t),
  }))
}
