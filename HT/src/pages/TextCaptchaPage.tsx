import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { randomInt } from '../lib/random'
import { logCaptchaAttempt } from '../lib/attemptLog'

function makeSolution(len = 6) {
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  let s = ''
  for (let i = 0; i < len; i += 1) {
    s += alphabet[randomInt(0, alphabet.length - 1)]
  }
  return s
}

function drawCaptcha(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height

  // background
  ctx.clearRect(0, 0, w, h)
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, 'rgba(255,255,255,0.10)')
  bg.addColorStop(1, 'rgba(255,255,255,0.04)')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // noise lines
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath()
    ctx.strokeStyle = `rgba(255,255,255,${randomInt(10, 25) / 100})`
    ctx.lineWidth = randomInt(1, 3)
    ctx.moveTo(randomInt(0, w), randomInt(0, h))
    ctx.bezierCurveTo(
      randomInt(0, w),
      randomInt(0, h),
      randomInt(0, w),
      randomInt(0, h),
      randomInt(0, w),
      randomInt(0, h),
    )
    ctx.stroke()
  }

  // text
  const fontSize = 42
  ctx.font = `700 ${fontSize}px system-ui, Segoe UI, sans-serif`
  ctx.textBaseline = 'middle'
  const spacing = w / (text.length + 1)
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const x = spacing * (i + 1) + randomInt(-6, 6)
    const y = h / 2 + randomInt(-10, 10)
    const angle = (randomInt(-18, 18) * Math.PI) / 180
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.fillStyle = 'rgba(255,255,255,0.90)'
    ctx.fillText(ch, -fontSize / 3, 0)
    ctx.restore()
  }

  // dots
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${randomInt(6, 18) / 100})`
    const r = randomInt(1, 2)
    ctx.beginPath()
    ctx.arc(randomInt(0, w), randomInt(0, h), r, 0, Math.PI * 2)
    ctx.fill()
  }

  // border
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
}

export function TextCaptchaPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [solution, setSolution] = useState(() => makeSolution())
  const [answer, setAnswer] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [successes, setSuccesses] = useState(0)
  const [lastResult, setLastResult] = useState<'ok' | 'bad' | null>(null)
  const [startedAt, setStartedAt] = useState(() => performance.now())

  const accuracy = useMemo(() => {
    if (attempts === 0) return null
    return Math.round((successes / attempts) * 100)
  }, [attempts, successes])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    drawCaptcha(c, solution)
  }, [solution])

  function refresh() {
    setSolution(makeSolution())
    setAnswer('')
    setLastResult(null)
    setStartedAt(performance.now())
  }

  function submit() {
    const normalized = answer.trim().toUpperCase()
    const ok = normalized === solution
    const durationMs = Math.round(performance.now() - startedAt)
    setAttempts((n) => n + 1)
    if (ok) setSuccesses((n) => n + 1)
    setLastResult(ok ? 'ok' : 'bad')
    void logCaptchaAttempt({
      type: 'text',
      success: ok,
      durationMs,
      meta: { len: solution.length },
    })
    setSolution(makeSolution())
    setAnswer('')
    setStartedAt(performance.now())
  }

  return (
    <AppShell title="CAPTCHA 연습장" subtitle="보안 문자 (Text CAPTCHA)">
      <section className="hero">
        <h1 className="h1">보안 문자</h1>
        <p className="lead">
          아래 이미지의 문자를 입력하세요. (대소문자 구분 없음)
        </p>
      </section>

      <section className="panel">
        <div className="row">
          <canvas ref={canvasRef} width={320} height={100} />
          <div className="btnRow">
            <button className="btn" type="button" onClick={refresh}>
              새로고침
            </button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="row">
          <input
            className="input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="여기에 입력…"
            autoComplete="off"
            inputMode="text"
            aria-label="보안 문자 입력"
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
          <button className="btn btnPrimary" type="button" onClick={submit}>
            확인
          </button>
          <Link className="btn" to="/">
            홈
          </Link>
        </div>

        <div style={{ height: 10 }} />
        <p className="hint">
          팁: 글자가 헷갈리면 새로고침을 눌러 다른 문제로 바꿔보세요.
        </p>

        <div style={{ height: 12 }} />

        {lastResult ? (
          <div className="panel" style={{ background: 'rgba(0,0,0,0.18)' }}>
            <p className={lastResult === 'ok' ? 'statusOk' : 'statusBad'}>
              {lastResult === 'ok'
                ? '정답! (다음 문제로 넘어갔어요)'
                : '오답! (다음 문제로 넘어갔어요)'}
            </p>
            <p className="hint">
              누적: {successes}/{attempts}회 성공
              {accuracy !== null ? ` · 정확도 ${accuracy}%` : ''}
            </p>
          </div>
        ) : null}
      </section>
    </AppShell>
  )
}

