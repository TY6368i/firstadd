/**
 * validator_api.py (XGB v2 + 궤적 XGB) Vercel 서버리스 버전.
 * LSTM·TensorFlow는 Vercel에서 제외 — 두 XGB만 결합 판정.
 */
import { extractXgbV2Features } from './mouse-features.js'
import {
  computePointerFeatures,
  pointersToMouseTicks,
  sanitizePointers,
} from './lib/pointer-features.js'
import { scoreBundle } from './lib/xgb-runtime.js'

const BOT_MODEL = 'bot-detector-v2-bundle.json'
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
    const pointers = sp.pointers
    const mouseTicks = pointersToMouseTicks(pointers)

    const mouseFeatures = extractXgbV2Features(mouseTicks)
    const pointerRaw = computePointerFeatures(pointers, startedAtMs, endedAtMs)

    const [botV2, pointerXgb] = await Promise.all([
      scoreBundle(BOT_MODEL, mouseFeatures),
      scoreBundle(POINTER_MODEL, pointerRaw),
    ])

    const isBot = Boolean(botV2.says_bot || pointerXgb.label === 'bot')

    res.status(200).json({
      is_bot: isBot,
      is_bot_label: isBot ? 1 : 0,
      labels: {
        is_bot: '1=봇, 0=사람 (학습·CSV와 동일)',
        scores_are: 'bot_v2는 P(봇), pointer_xgb는 P(사람) 기준 human/bot 라벨',
      },
      gate: {
        mode: 'OR_DUAL_XGB',
        rule:
          'XGB v2(행동 8특징) 또는 궤적 XGB 중 하나라도 봇이면 최종 봇. Vercel 배포는 LSTM 미포함.',
        threshold_bot_v2: 0.5,
        threshold_pointer_human: 0.5,
      },
      mouse_features: mouseFeatures,
      bot_detector_v2: {
        prob_bot: botV2.prob_bot,
        prob_human: botV2.prob_human,
        label: botV2.label,
        says_bot: botV2.says_bot,
        risk_tier: botV2.risk_tier,
        raw_features: botV2.raw_features,
        scaled_top_features: botV2.scaled_top_features,
        tier_thresholds: { review_min: 0.6, deny_min: 0.9 },
      },
      pointer_xgb: {
        prob_human: pointerXgb.prob_human,
        prob_bot: pointerXgb.prob_bot,
        label: pointerXgb.label,
        features: pointerRaw,
      },
      models: {
        bot_v2: {
          role: 'advanced_dynamics_xgb_v2',
          prob_bot: botV2.prob_bot,
          says_bot: botV2.says_bot,
        },
        pointer_xgb: {
          role: 'pointer_trajectory_xgb',
          prob_human: pointerXgb.prob_human,
          says_bot: pointerXgb.label === 'bot',
        },
      },
      sample_count: pointers.length,
    })
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'validator failed',
    })
  }
}
