import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
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

export function RecaptchaV3Page() {
  const siteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim() ?? ''
  const [token, setToken] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [result, setResult] = useState<'idle' | 'ok' | 'bad' | 'error'>('idle')
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(false)

  const ready = useMemo(() => Boolean(siteKey), [siteKey])

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
    try {
      const tk = await getRecaptchaToken(siteKey, 'submit')
      setToken(tk)
      const backend = await verifyOnBackend(tk)
      const data = backend.data as {
        success?: boolean
        score?: number
        error?: string
        reasons?: string[]
      }
      setScore(typeof data.score === 'number' ? data.score : null)
      if (backend.ok && data.success) {
        setResult('ok')
      } else if (backend.ok) {
        setResult('bad')
        setDetail(data.reasons?.join(', ') || '검증 점수가 기준 이하입니다.')
      } else {
        setResult('error')
        setDetail(data.error || '서버 검증 실패')
      }
    } catch (e) {
      setResult('error')
      setDetail(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
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
      </section>
    </AppShell>
  )
}
