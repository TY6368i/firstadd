import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const XGB_V2_INFERENCE_FEATURES = [
  'mean_velocity',
  'mean_jitter',
  'straightness',
  'mean_acceleration',
  'velocity_variance',
  'acceleration_variance',
  'mean_jerk',
  'pause_ratio',
] as const

type PointerSample = { t: number; x: number; y: number; k: 'move' | 'down' | 'up' }

type ValidatorResponse = {
  is_bot?: boolean
  mouse_features?: Record<string, number>
  bot_detector_v2?: {
    prob_bot?: number
    prob_human?: number
    label?: string
    risk_tier?: string
    scaled_top_features?: { feature: string; scaled_value: number }[]
  }
  pointer_xgb?: {
    prob_human?: number
    prob_bot?: number
    label?: string
    features?: Record<string, number>
  }
  error?: string
}

const MOVE_INTERVAL_MS = 50

const FEATURE_LABELS: Record<string, string> = {
  mean_velocity: '평균 속도',
  mean_jitter: '평균 지터',
  straightness: '직진성',
  mean_acceleration: '평균 가속',
  velocity_variance: '속도 분산',
  acceleration_variance: '가속 분산',
  mean_jerk: '평균 저크',
  pause_ratio: '정지 비율',
}

const POINTER_LABELS: Record<string, string> = {
  n_total: '샘플 수',
  path_len: '경로 길이',
  speed_mean: '평균 속도',
  dir_changes: '방향 전환',
  idle_ratio: '유휴 비율',
  straight_ratio: '직선 비율',
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`
}

function labelKo(label?: string) {
  if (label === 'human') return '사람'
  if (label === 'bot') return '봇'
  return '—'
}

function tierKo(tier?: string) {
  if (tier === 'deny') return '차단'
  if (tier === 'review') return '검토'
  if (tier === 'low') return '낮음'
  return '—'
}

/**
 * 스케치 레이아웃: cap 헤더 + 가운데 3칸(행동 특징 / XGB v2 / 궤적 XGB).
 * Vercel `/api/validator` = validator_api.py 의 XGB 결합판(LSTM 제외).
 */
export function PointerBehaviorXgbPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ValidatorResponse | null>(null)
  const [error, setError] = useState('')
  const [sampleHint, setSampleHint] = useState('마우스를 움직여 주세요')

  const pointersRef = useRef<PointerSample[]>([])
  const perfStartRef = useRef(0)
  const wallStartRef = useRef(0)
  const lastMoveAtRef = useRef(0)

  function pushSample(e: PointerEvent, k: PointerSample['k']) {
    const t = Math.round(performance.now() - perfStartRef.current)
    pointersRef.current.push({
      t,
      x: Math.round(e.clientX),
      y: Math.round(e.clientY),
      k,
    })
  }

  useEffect(() => {
    perfStartRef.current = performance.now()
    wallStartRef.current = Date.now()
    lastMoveAtRef.current = 0

    const onMove = (e: PointerEvent) => {
      const now = performance.now()
      if (now - lastMoveAtRef.current < MOVE_INTERVAL_MS) return
      lastMoveAtRef.current = now
      pushSample(e, 'move')
      setSampleHint(`수집 중 · ${pointersRef.current.length}개`)
    }
    const onDown = (e: PointerEvent) => pushSample(e, 'down')
    const onUp = (e: PointerEvent) => pushSample(e, 'up')

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  async function runAnalysis() {
    setLoading(true)
    setError('')
    setData(null)

    const startedAtMs = wallStartRef.current
    const pointers = [...pointersRef.current]
    const endedAtMs = Date.now()

    if (pointers.length < 2) {
      setError('분석하려면 포인터 샘플이 2개 이상 필요합니다.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/validator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointers, startedAtMs, endedAtMs }),
      })
      const json = (await res.json()) as ValidatorResponse
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`)
        return
      }
      setData(json)
      setSampleHint(`완료 · ${pointers.length}개 샘플`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'API 호출 실패')
    } finally {
      setLoading(false)
      pointersRef.current = []
      perfStartRef.current = performance.now()
      wallStartRef.current = Date.now()
      lastMoveAtRef.current = 0
    }
  }

  const mf = data?.mouse_features ?? {}
  const v2 = data?.bot_detector_v2
  const px = data?.pointer_xgb

  return (
    <div className="xgbCapPage">
      <header className="xgbCapHeader">
        <div className="xgbCapBrand">
          <span className="xgbCapLogo">cap</span>
          <span className="xgbCapMark" aria-hidden />
        </div>
        <Link className="xgbCapHome" to="/">
          홈
        </Link>
      </header>

      <div className="xgbCapFrame">
        <div className="xgbCapRow">
          <section className="xgbCapCol" aria-label="행동 특징">
            <h2 className="xgbCapColTitle">행동 특징</h2>
            <p className="xgbCapColSub">mouse_features · 8개</p>
            <ul className="xgbCapFeatList">
              {XGB_V2_INFERENCE_FEATURES.map((key) => (
                <li key={key}>
                  <span className="xgbCapFeatKey">{FEATURE_LABELS[key] ?? key}</span>
                  <span className="xgbCapFeatVal">
                    {data ? Number(mf[key] ?? 0).toFixed(4) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="xgbCapCol" aria-label="XGB v2 봇 탐지">
            <h2 className="xgbCapColTitle">XGB v2</h2>
            <p className="xgbCapColSub">scaler_v2 + xgboost_bot_detector_v2</p>
            {v2 ? (
              <>
                <p className="xgbCapScore">
                  P(봇) <strong>{pct(v2.prob_bot ?? 0)}</strong>
                </p>
                <p className={v2.label === 'bot' ? 'statusBad' : 'statusOk'}>
                  {labelKo(v2.label)} · 위험 {tierKo(v2.risk_tier)}
                </p>
                {v2.scaled_top_features?.length ? (
                  <ul className="xgbCapMiniList">
                    {v2.scaled_top_features.map((row) => (
                      <li key={row.feature}>
                        {FEATURE_LABELS[row.feature] ?? row.feature}{' '}
                        <span>{row.scaled_value.toFixed(3)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="hint">분석 후 표시</p>
            )}
          </section>

          <section className="xgbCapCol" aria-label="궤적 XGB">
            <h2 className="xgbCapColTitle">궤적 XGB</h2>
            <p className="xgbCapColSub">pointer-xgb-trees</p>
            {px ? (
              <>
                <p className="xgbCapScore">
                  P(사람) <strong>{pct(px.prob_human ?? 0)}</strong>
                </p>
                <p className={px.label === 'human' ? 'statusOk' : 'statusBad'}>
                  {labelKo(px.label)}
                </p>
                <ul className="xgbCapMiniList">
                  {Object.entries(POINTER_LABELS).map(([key, label]) => (
                    <li key={key}>
                      {label}{' '}
                      <span>{Number(px.features?.[key] ?? 0).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="hint">분석 후 표시</p>
            )}
          </section>
        </div>

        {data ? (
          <p
            className={data.is_bot ? 'statusBad xgbCapVerdict' : 'statusOk xgbCapVerdict'}
          >
            최종: {data.is_bot ? '봇' : '사람'} (두 XGB OR 게이트)
          </p>
        ) : null}
      </div>

      <footer className="xgbCapFooter">
        <p className="hint">{sampleHint}</p>
        <div className="row">
          <button
            className="btn btnPrimary"
            type="button"
            onClick={() => void runAnalysis()}
            disabled={loading}
          >
            {loading ? '검증 중…' : '행동 검증'}
          </button>
        </div>
        {error ? <p className="statusBad">오류: {error}</p> : null}
        {!error && !data ? (
          <p className="hint">
            로컬: 터미널에서 <code>cd HT</code> 후 <code>npx vercel dev</code>를 실행한 뒤 이
            페이지를 열면 <code>/api/validator</code>가 동작합니다. 배포는 Vercel에 그대로 올리면
            됩니다.
          </p>
        ) : null}
      </footer>
    </div>
  )
}
