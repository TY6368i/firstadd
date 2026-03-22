/**
 * 클릭형 캡차 연습: 정답 박스 외에 방해(distractor) 클릭 영역을 생성해
 * 실제처럼 여러 후보 중에서 고르게 합니다.
 */

export type ClickRegion = {
  box: [number, number, number, number]
  isTarget: boolean
}

function boxIou(a: number[], b: number[]): number {
  const [ax1, ay1, ax2, ay2] = a
  const [bx1, by1, bx2, by2] = b
  const ix1 = Math.max(ax1, bx1)
  const iy1 = Math.max(ay1, by1)
  const ix2 = Math.min(ax2, bx2)
  const iy2 = Math.min(ay2, by2)
  if (ix2 <= ix1 || iy2 <= iy1) return 0
  const inter = (ix2 - ix1) * (iy2 - iy1)
  const areaA = (ax2 - ax1) * (ay2 - ay1)
  const areaB = (bx2 - bx1) * (by2 - by1)
  const u = areaA + areaB - inter
  return u <= 0 ? 0 : inter / u
}

/** 시드 기반 0~1 난수 (같은 시드면 같은 배치) */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleRegions(regions: ClickRegion[], seed: number): ClickRegion[] {
  const rng = mulberry32(seed)
  const copy = [...regions]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function generateDistractorBoxes(
  targets: number[][],
  imgW: number,
  imgH: number,
  seed: number,
): number[][] {
  if (targets.length === 0 || imgW < 40 || imgH < 40) return []

  const rng = mulberry32(seed ^ 0x9e3779b9)
  const avgW =
    targets.reduce((s, b) => s + (b[2] - b[0]), 0) / Math.max(1, targets.length)
  const avgH =
    targets.reduce((s, b) => s + (b[3] - b[1]), 0) / Math.max(1, targets.length)

  const want = Math.min(16, Math.max(4, targets.length * 2 + 2))
  const out: number[][] = []
  const occupied = [...targets]
  let attempts = 0
  const maxAttempts = want * 100

  while (out.length < want && attempts < maxAttempts) {
    attempts += 1
    const bw = Math.max(24, Math.min(imgW * 0.35, avgW * (0.65 + rng() * 0.9)))
    const bh = Math.max(24, Math.min(imgH * 0.35, avgH * (0.65 + rng() * 0.9)))
    const maxX = Math.max(2, imgW - bw - 2)
    const maxY = Math.max(2, imgH - bh - 2)
    const x1 = 2 + Math.floor(rng() * maxX)
    const y1 = 2 + Math.floor(rng() * maxY)
    const box = [x1, y1, Math.min(imgW - 2, x1 + bw), Math.min(imgH - 2, y1 + bh)]

    const overlaps = occupied.some((t) => boxIou(box, t) > 0.12)
    if (!overlaps) {
      out.push(box)
      occupied.push(box)
    }
  }

  return out
}

/** 정답 박스 + 방해 박스를 섞은 목록 */
export function buildMixedClickRegions(
  targetBoxes: number[][],
  imgW: number,
  imgH: number,
  seed: number,
): ClickRegion[] {
  const targets: ClickRegion[] = targetBoxes.map((box) => ({
    box: box as [number, number, number, number],
    isTarget: true,
  }))
  const distractors = generateDistractorBoxes(targetBoxes, imgW, imgH, seed + 1)
  const dregs: ClickRegion[] = distractors.map((box) => ({
    box: box as [number, number, number, number],
    isTarget: false,
  }))
  return shuffleRegions([...targets, ...dregs], seed)
}

export function targetIndexSet(regions: ClickRegion[]): Set<number> {
  const s = new Set<number>()
  regions.forEach((r, i) => {
    if (r.isTarget) s.add(i)
  })
  return s
}
