import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { randomInt } from '../lib/random'
import { logCaptchaAttempt } from '../lib/attemptLog'

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function RecaptchaClickPage() {
  const [open, setOpen] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [round, setRound] = useState(0)
  const [startedAt, setStartedAt] = useState(() => performance.now())

  const etaMs = useMemo(() => randomInt(900, 2000), [round])

  async function start() {
    setOpen(true)
    setVerifying(true)
    setVerified(false)
    setStartedAt(performance.now())
    await wait(etaMs)
    setVerifying(false)
    setVerified(true)
    void logCaptchaAttempt({
      type: 'recaptcha_click',
      success: true,
      durationMs: Math.round(performance.now() - startedAt),
      meta: { etaMs },
    })
  }

  function reset() {
    setOpen(false)
    setVerifying(false)
    setVerified(false)
    setRound((n) => n + 1)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <AppShell title="CAPTCHA 연습장" subtitle="마우스 클릭 (reCAPTCHA 스타일)">
      <section className="hero">
        <h1 className="h1">마우스 클릭 (reCAPTCHA)</h1>
        <p className="lead">
          실제 reCAPTCHA는 위험도(행동/환경)를 종합해 판단하지만, 여기서는
          <b> 사용 흐름</b>을 연습하는 데 초점을 맞춘 간단한 버전이에요.
        </p>
      </section>

      <section className="panel">
        <div
          className="panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'rgba(0,0,0,0.18)',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              checked={verified}
              onChange={() => {
                if (verified) reset()
                else void start()
              }}
              aria-label="로봇이 아닙니다"
              style={{ width: 18, height: 18 }}
            />
            <span>로봇이 아닙니다</span>
          </label>
          <span className="hint">
            {verified ? '인증 완료' : '체크하면 검증이 시작됩니다'}
          </span>
        </div>

        <div style={{ height: 14 }} />

        <div className="row">
          <button className="btn" type="button" onClick={reset}>
            초기화
          </button>
          <Link className="btn" to="/">
            홈
          </Link>
        </div>
      </section>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="reCAPTCHA 검증"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'grid',
            placeItems: 'center',
            padding: 18,
            zIndex: 50,
          }}
        >
          <div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 100%)',
            }}
          >
            <h2 className="cardTitle" style={{ margin: 0 }}>
              reCAPTCHA 확인
            </h2>
            <div style={{ height: 8 }} />

            {verifying ? (
              <>
                <p className="lead">검증 중…</p>
                <div style={{ height: 12 }} />
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(0,0,0,0.22)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: '65%',
                      background:
                        'linear-gradient(90deg, rgba(124,58,237,0.2), rgba(124,58,237,0.85))',
                      animation: 'rcbar 1.1s ease-in-out infinite alternate',
                    }}
                  />
                </div>
                <div style={{ height: 10 }} />
                <p className="hint">예상 소요: 약 {Math.round(etaMs / 100) / 10}s</p>
              </>
            ) : verified ? (
              <>
                <p className="statusOk" style={{ margin: 0 }}>
                  인증 완료!
                </p>
                <div style={{ height: 10 }} />
                <p className="hint">
                  연습용이라 실제 보안 검증은 하지 않습니다. 다시 연습하려면
                  체크를 해제하거나 초기화를 눌러주세요.
                </p>
              </>
            ) : (
              <p className="hint">검증 상태를 불러오지 못했어요. 다시 시도해 주세요.</p>
            )}

            <div style={{ height: 14 }} />
            <div className="row">
              <button className="btn btnPrimary" type="button" onClick={() => setOpen(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* tiny keyframes for the modal progress bar */}
      <style>
        {`
          @keyframes rcbar {
            from { transform: translateX(-20%); filter: brightness(1); }
            to { transform: translateX(40%); filter: brightness(1.15); }
          }
        `}
      </style>
    </AppShell>
  )
}

