import { extractXgbV2Features } from './mouse-features.js'
import {
  computePointerFeatures,
  pointersToMouseTicks,
  sanitizePointers,
} from './lib/pointer-features.js'
import { scoreBundle } from './lib/xgb-runtime.js'

const POINTER_MODEL = 'pointer-xgb-trees.json'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'object' && req.body ? req.body : {}
    const sp = sanitizePointers(body)
    if ('error' in sp) {
      res.status(400).json({ error: sp.error })
      return
    }

    const startedAtMs = Number(body.startedAtMs ?? body.started_at_ms ?? 0)
    const endedAtMs = Number(body.endedAtMs ?? body.ended_at_ms ?? 0)

    const features = computePointerFeatures(sp.pointers, startedAtMs, endedAtMs)
    const mouseFeatures = extractXgbV2Features(pointersToMouseTicks(sp.pointers))
    const scored = await scoreBundle(POINTER_MODEL, features)

    res.status(200).json({
      prob_human: scored.prob_human,
      prob_bot: scored.prob_bot,
      label: scored.label,
      features,
      mouse_features: mouseFeatures,
    })
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'pointer-human-xgb failed',
    })
  }
}
