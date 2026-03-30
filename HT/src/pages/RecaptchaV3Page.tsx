import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { saveCaptchaSessionWithPointers, type PointerSample } from '../lib/captchaSessionLog'
import { supabase } from '../lib/supabaseClient'

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

function loadRecaptchaScript(siteKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve()
      return
    }
    const existing = document.querySelector(
      'script[data-recaptcha-v3="1"]',
    ) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('script load failed')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
    script.async = true
    script.defer = true
    script.dataset.recaptchaV3 = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('script load failed'))
    document.head.appendChild(script)
  })
}

async function getRecaptchaToken(siteKey: string, action: string): Promise<string> {
  await loadRecaptchaScript(siteKey)
  return new Promise((resolve, reject) => {
    const g = window.grecaptcha
    if (!g) {
      reject(new Error('grecaptcha unavailable'))
      return
    }
    g.ready(() => {
      g.execute(siteKey, { action }).then(resolve).catch(reject)
    })
  })
}

const MOVE_INTERVAL_MS = 50

export function RecaptchaV3Page() {
  const siteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim() ?? ''
  const [token, setToken] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [result, setResult] = useState<'idle' | 'ok' | 'bad' | 'error'>('idle')
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [persistHint, setPersistHint] = useState('')

  const pointersRef = useRef<PointerSample[]>([])
  const perfStartRef = useRef<number>(0)
  const wallStartRef = useRef<number>(0)
  const lastMoveAtRef = useRef<number>(0)

  const ready = useMemo(() => Boolean(siteKey), [siteKey])

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

  async function verifyOnBackend(tk: string) {
    // 1) Supabase Edge Function 우선
    if (supabase) {
      const { data, error } = await supabase.functions.invoke('recaptcha-verify', {
        body: { token: tk, action: 'submit' },
      })
      if (error) {
        throw new Error(`supabase_function_error: ${error.message}`)
      }
      return { ok: true as const, data: data as Record<string, unknown> }
    }

    // 2) fallback: Vercel API
    const res = await fetch('/api/recaptcha-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tk, action: 'submit' }),
    })
    const data = (await res.json()) as Record<string, unknown>
    if (!res.ok) {
      return { ok: false as const, data }
    }
    return { ok: true as const, data }
  }

  async function verify() {
    if (!siteKey) return
    setLoading(true)
    setDetail('')
    setResult('idle')
    setPersistHint('')

    const startedAtMs = wallStartRef.current
    const pointerSnapshot = (): PointerSample[] => [...pointersRef.current]

    let recaptchaOk: boolean | null = null
    let recaptchaScore: number | null = null
    let recaptchaHostname: string | null = null
    const meta: Record<string, unknown> = { path: window.location.pathname }

    try {
      const tk = await getRecaptchaToken(siteKey, 'submit')
      setToken(tk)
      const backend = await verifyOnBackend(tk)
      const data = backend.data as {
        success?: boolean
        score?: number
        error?: string
        reasons?: string[]
        raw?: {
          success?: boolean
          score?: number
          action?: string
          hostname?: string
          'error-codes'?: string[]
        }
      }
      recaptchaScore = typeof data.score === 'number' ? data.score : null
      const host =
        data.raw && typeof data.raw.hostname === 'string' ? data.raw.hostname : null
      recaptchaHostname = host

      if (data.raw) {
        meta.google_raw = data.raw
      }

      setScore(recaptchaScore)
      if (backend.ok && data.success) {
        recaptchaOk = true
        setResult('ok')
      } else if (backend.ok) {
        recaptchaOk = false
        meta.reasons = data.reasons
        setResult('bad')
        setDetail(data.reasons?.join(', ') || '검증 점수가 기준 이하입니다.')
      } else {
        recaptchaOk = false
        meta.backend_error = data.error
        setResult('error')
        setDetail(data.error || '서버 검증 실패')
      }
    } catch (e) {
      recaptchaOk = false
      meta.exception = e instanceof Error ? e.message : String(e)
      setResult('error')
      setDetail(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
      const endedAtMs = Date.now()
      const pointers = pointerSnapshot()

      if (supabase) {
        const saveResult = await saveCaptchaSessionWithPointers(supabase, {
          pageUrl: window.location.href,
          action: 'submit',
          startedAtMs,
          endedAtMs,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          viewportW: window.innerWidth,
          viewportH: window.innerHeight,
          pointers,
          recaptchaOk,
          recaptchaScore,
          recaptchaHostname,
          meta,
        })
        if ('error' in saveResult) {
          setPersistHint(`DB 저장 실패: ${saveResult.error}`)
        } else {
          setPersistHint(`DB 저장 완료 · session ${saveResult.sessionId.slice(0, 8)}…`)
        }
      } else {
        setPersistHint('Supabase 미설정이라 DB에는 저장하지 않았습니다.')
      }

      pointersRef.current = []
      perfStartRef.current = performance.now()
      wallStartRef.current = Date.now()
      lastMoveAtRef.current = 0
    }
  }

  return (
    <AppShell title="CAPTCHA 연습장" subtitle="최신 기술 · reCAPTCHA v3">
      <section className="hero">
        <h1 className="h1">reCAPTCHA v3</h1>
        <p className="lead">
          버튼을 누르면 토큰을 발급하고 Supabase Edge Function(없으면 Vercel API fallback)에서
          Google siteverify로 검증합니다.
        </p>
      </section>

      <section className="panel">
        {!ready ? (
          <div className="panel" style={{ background: 'rgba(251,191,36,0.12)' }}>
            <p className="cardDesc">
              환경변수 <code>VITE_RECAPTCHA_SITE_KEY</code>가 없습니다.
            </p>
            <p className="hint">Vercel Project Settings → Environment Variables에 추가하세요.</p>
          </div>
        ) : null}

        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button
            className="btn btnPrimary"
            type="button"
            onClick={verify}
            disabled={!ready || loading}
          >
            {loading ? '검증 중...' : '사람 검증 실행'}
          </button>
          <Link className="btn" to="/">
            홈
          </Link>
        </div>

        <div style={{ height: 12 }} />
        <p className="hint">
          토큰: {token ? `${token.slice(0, 24)}...` : '아직 없음'}
        </p>
        <p className="hint">점수(score): {score == null ? '-' : score}</p>
        {result === 'ok' ? <p className="statusOk">[성공] 통과</p> : null}
        {result === 'bad' ? <p className="statusBad">통과 실패: {detail}</p> : null}
        {result === 'error' ? <p className="statusBad">오류: {detail}</p> : null}
        {persistHint ? <p className="hint">{persistHint}</p> : null}
      </section>
    </AppShell>
  )
}
