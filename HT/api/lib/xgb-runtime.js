import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import xgbScorer from 'xgboost-scorer'

const Scorer = xgbScorer.default ?? xgbScorer

const caches = new Map()

/**
 * @param {string} modelRelPath api/models 기준 상대 경로
 */
export async function loadXgbBundle(modelRelPath) {
  if (caches.has(modelRelPath)) return caches.get(modelRelPath)

  const base = dirname(fileURLToPath(import.meta.url))
  const path = join(base, '..', 'models', modelRelPath)
  const raw = JSON.parse(await readFile(path, 'utf8'))
  const scorer = await Scorer.create(raw.trees)
  const featureNames = raw.feature_names
  if (!Array.isArray(featureNames)) {
    throw new Error(`${modelRelPath}: missing feature_names`)
  }

  const bundle = {
    raw,
    scorer,
    featureNames,
    scaler: raw.scaler ?? null,
    thresholdBot: Number(raw.threshold_bot ?? 0.5),
    tierReviewMin: Number(raw.tier_review_min ?? 0.6),
    tierDenyMin: Number(raw.tier_deny_min ?? 0.9),
    labelHuman: Number(raw.label_human ?? 0),
    labelBot: Number(raw.label_bot ?? 1),
  }
  caches.set(modelRelPath, bundle)
  return bundle
}

function scaleRow(rawFeatures, featureNames, scaler) {
  const scaled = []
  for (let i = 0; i < featureNames.length; i++) {
    const name = featureNames[i]
    const v = Number(rawFeatures[name] ?? 0)
    const mean = Number(scaler.mean[i] ?? 0)
    const scale = Number(scaler.scale[i] ?? 1) || 1
    scaled.push((v - mean) / scale)
  }
  return scaled
}

function scaledToVec(scaled, featureNames) {
  const vec = {}
  for (let i = 0; i < featureNames.length; i++) {
    const v = scaled[i]
    vec[`f${i}`] = v
    vec[featureNames[i]] = v
  }
  return vec
}

export function topScaledFeatures(scaled, featureNames, topK = 3) {
  const pairs = featureNames.map((name, i) => ({
    feature: name,
    scaled_value: scaled[i],
  }))
  pairs.sort((a, b) => Math.abs(b.scaled_value) - Math.abs(a.scaled_value))
  return pairs.slice(0, topK)
}

function riskTier(probBot, reviewMin, denyMin) {
  if (probBot >= denyMin) return 'deny'
  if (probBot >= reviewMin) return 'review'
  return 'low'
}

/**
 * @param {Record<string, number>} rawFeatures
 */
export async function scoreBundle(modelRelPath, rawFeatures) {
  const bundle = await loadXgbBundle(modelRelPath)
  const { scorer, featureNames, scaler, thresholdBot, tierReviewMin, tierDenyMin } = bundle

  let vec
  let scaled = null
  if (scaler) {
    scaled = scaleRow(rawFeatures, featureNames, scaler)
    vec = scaledToVec(scaled, featureNames)
  } else {
    vec = {}
    for (const name of featureNames) {
      const v = Number(rawFeatures[name] ?? 0)
      vec[name] = Number.isFinite(v) ? v : 0
    }
  }

  const score = scorer.scoreSingleInstance(vec)
  const positiveIsHuman = bundle.labelHuman === 1

  let probBot
  let probHuman
  if (positiveIsHuman) {
    probHuman = score
    probBot = 1 - score
  } else {
    probBot = score
    probHuman = 1 - score
  }

  const saysBot = probBot > thresholdBot
  const label = saysBot ? 'bot' : 'human'

  return {
    prob_bot: probBot,
    prob_human: probHuman,
    label,
    says_bot: saysBot,
    risk_tier: scaler ? riskTier(probBot, tierReviewMin, tierDenyMin) : null,
    scaled_top_features: scaled ? topScaledFeatures(scaled, featureNames) : null,
    raw_features: Object.fromEntries(
      featureNames.map((n) => [n, Number(rawFeatures[n] ?? 0)]),
    ),
  }
}
