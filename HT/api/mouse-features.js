/**
 * firstadd/mouse_features.py 기반 JS 포팅.
 * 모델 점수와 함께 참고용 행동 특징을 보여주기 위해 사용한다.
 */

export const XGB_V2_INFERENCE_FEATURES = [
  'mean_velocity',
  'mean_jitter',
  'straightness',
  'mean_acceleration',
  'velocity_variance',
  'acceleration_variance',
  'mean_jerk',
  'pause_ratio',
]

const PAUSE_VELOCITY_PX_PER_MS = 0.05

function popVar(xs) {
  const n = xs.length
  if (n < 2) return 0
  const m = xs.reduce((a, b) => a + b, 0) / n
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / n
}

/**
 * @param {Array<{x:number,y:number,time:number}>} ticksData
 * @returns {Record<string, number>}
 */
export function extractXgbV2Features(ticksData) {
  const out = Object.fromEntries(XGB_V2_INFERENCE_FEATURES.map((k) => [k, 0]))
  if (!Array.isArray(ticksData) || ticksData.length < 2) return out

  const segmentDts = []
  const velocities = []
  const jitters = []
  const accelerations = []
  let totalDistance = 0
  let pauseMs = 0
  let totalMoveMs = 0

  const startPoint = ticksData[0]
  const endPoint = ticksData[ticksData.length - 1]
  let lastValid = startPoint

  for (const curr of ticksData.slice(1)) {
    const x1 = Number(lastValid.x ?? 0)
    const y1 = Number(lastValid.y ?? 0)
    const t1 = Number(lastValid.time ?? 0)
    const x2 = Number(curr.x ?? 0)
    const y2 = Number(curr.y ?? 0)
    const t2 = Number(curr.time ?? 0)
    const dt = t2 - t1

    if (dt > 0) {
      const dx = x2 - x1
      const dy = y2 - y1
      const dist = Math.hypot(dx, dy)
      totalDistance += dist
      const v = dist / dt
      segmentDts.push(dt)
      totalMoveMs += dt
      if (v <= PAUSE_VELOCITY_PX_PER_MS) {
        pauseMs += dt
      }
      velocities.push(v)

      if (velocities.length > 1) {
        const dv = velocities[velocities.length - 1] - velocities[velocities.length - 2]
        jitters.push(Math.abs(dv))
        accelerations.push(dv / dt)
      }
      lastValid = curr
    }
  }

  const straightLineDist = Math.hypot(
    Number(endPoint.x ?? 0) - Number(startPoint.x ?? 0),
    Number(endPoint.y ?? 0) - Number(startPoint.y ?? 0),
  )
  if (straightLineDist > 0) out.straightness = totalDistance / straightLineDist

  if (velocities.length > 0) {
    out.mean_velocity = velocities.reduce((a, b) => a + b, 0) / velocities.length
    out.velocity_variance = popVar(velocities)
  }
  if (jitters.length > 0) out.mean_jitter = jitters.reduce((a, b) => a + b, 0) / jitters.length
  if (accelerations.length > 0) {
    out.mean_acceleration = accelerations.reduce((a, b) => a + b, 0) / accelerations.length
    out.acceleration_variance = popVar(accelerations)
  }

  const jerks = []
  for (let i = 0; i < accelerations.length - 1; i++) {
    const denom =
      i + 2 < segmentDts.length ? segmentDts[i + 1] + segmentDts[i + 2] : segmentDts[i + 1]
    if (denom > 0) jerks.push((accelerations[i + 1] - accelerations[i]) / denom)
  }
  if (jerks.length > 0) out.mean_jerk = jerks.reduce((a, b) => a + b, 0) / jerks.length

  if (totalMoveMs > 0) out.pause_ratio = pauseMs / totalMoveMs
  return out
}

