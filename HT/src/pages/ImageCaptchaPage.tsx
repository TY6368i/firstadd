import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { pickOne, randomInt, shuffleInPlace } from '../lib/random'
import { logCaptchaAttempt } from '../lib/attemptLog'

type Category = {
  key: string
  label: string
  emoji: string
  bg: string
}

const categories: Category[] = [
  { key: 'bus', label: '버스', emoji: '🚌', bg: '#2563eb' },
  { key: 'light', label: '신호등', emoji: '🚦', bg: '#16a34a' },
  { key: 'bike', label: '자전거', emoji: '🚲', bg: '#f97316' },
  { key: 'car', label: '자동차', emoji: '🚗', bg: '#a855f7' },
]

type Tile = {
  id: string
  cat: Category
  isTarget: boolean
  src: string
}

function svgDataUri(cat: Category, seed: number) {
  const hueShift = (seed * 29) % 22
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="220" height="180">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${cat.bg}"/>
        <stop offset="1" stop-color="hsl(${220 + hueShift}, 80%, 45%)"/>
      </linearGradient>
    </defs>
    <rect width="220" height="180" rx="18" fill="url(#g)"/>
    <rect x="14" y="14" width="192" height="152" rx="14" fill="rgba(0,0,0,0.12)"/>
    <text x="110" y="95" font-size="64" text-anchor="middle" dominant-baseline="middle">${cat.emoji}</text>
    <text x="110" y="152" font-size="18" fill="rgba(255,255,255,0.88)" text-anchor="middle" font-family="system-ui, Segoe UI, sans-serif">${cat.label}</text>
  </svg>
  `.trim()
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function makePuzzle() {
  const target = pickOne(categories)
  const countTargets = randomInt(3, 5)

  const tiles: Tile[] = []
  for (let i = 0; i < 9; i += 1) {
    const isTarget = i < countTargets
    const cat = isTarget ? target : pickOne(categories.filter((c) => c.key !== target.key))
    tiles.push({
      id: `${Date.now()}_${i}_${Math.random().toString(16).slice(2)}`,
      cat,
      isTarget,
      src: svgDataUri(cat, i + randomInt(1, 999)),
    })
  }
  shuffleInPlace(tiles)
  return { target, tiles }
}

export function ImageCaptchaPage() {
  const [puzzle, setPuzzle] = useState(() => makePuzzle())
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [attempts, setAttempts] = useState(0)
  const [successes, setSuccesses] = useState(0)
  const [lastResult, setLastResult] = useState<'ok' | 'bad' | null>(null)
  const [startedAt, setStartedAt] = useState(() => performance.now())

  const targetIds = useMemo(
    () => new Set(puzzle.tiles.filter((t) => t.isTarget).map((t) => t.id)),
    [puzzle.tiles],
  )

  const selectedIds = useMemo(
    () => new Set(Object.entries(selected).filter(([, v]) => v).map(([k]) => k)),
    [selected],
  )

  function toggle(id: string) {
    setSelected((m) => ({ ...m, [id]: !m[id] }))
  }

  function newPuzzle() {
    setPuzzle(makePuzzle())
    setSelected({})
    setLastResult(null)
    setStartedAt(performance.now())
  }

  function submit() {
    let ok = true
    // must select all targets, and no non-targets
    for (const id of targetIds) {
      if (!selectedIds.has(id)) ok = false
    }
    for (const id of selectedIds) {
      if (!targetIds.has(id)) ok = false
    }

    setAttempts((n) => n + 1)
    if (ok) setSuccesses((n) => n + 1)
    setLastResult(ok ? 'ok' : 'bad')
    void logCaptchaAttempt({
      type: 'image',
      success: ok,
      durationMs: Math.round(performance.now() - startedAt),
      meta: {
        target: puzzle.target.key,
        selectedCount: selectedIds.size,
        targetCount: puzzle.tiles.filter((t) => t.isTarget).length,
      },
    })
    setPuzzle(makePuzzle())
    setSelected({})
    setStartedAt(performance.now())
  }

  return (
    <AppShell title="CAPTCHA 연습장" subtitle="이미지 캡차 (선택형)">
      <section className="hero">
        <h1 className="h1">이미지 선택</h1>
        <p className="lead">
          아래 3×3 이미지에서 <b>{puzzle.target.label}</b>를(을) 모두 선택하세요.
        </p>
      </section>

      <section className="panel">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          {puzzle.tiles.map((t) => {
            const on = !!selected[t.id]
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className="btn"
                style={{
                  padding: 0,
                  borderRadius: 16,
                  borderColor: on ? 'rgba(124,58,237,0.9)' : 'rgba(255,255,255,0.14)',
                  background: 'rgba(0,0,0,0.18)',
                  overflow: 'hidden',
                }}
                aria-pressed={on}
                aria-label={`${t.cat.label} 이미지 ${on ? '(선택됨)' : ''}`}
              >
                <img
                  src={t.src}
                  alt={t.cat.label}
                  style={{
                    width: '100%',
                    display: 'block',
                    filter: on ? 'saturate(1.15) contrast(1.05)' : 'none',
                  }}
                />
              </button>
            )
          })}
        </div>

        <div style={{ height: 12 }} />

        <div className="row">
          <button className="btn btnPrimary" type="button" onClick={submit}>
            확인
          </button>
          <button className="btn" type="button" onClick={newPuzzle}>
            다른 문제
          </button>
          <Link className="btn" to="/">
            홈
          </Link>
          <span className="hint">
            선택 {selectedIds.size}개 · 누적 {successes}/{attempts}회 성공
          </span>
        </div>

        {lastResult ? (
          <>
            <div style={{ height: 12 }} />
            <div className="panel" style={{ background: 'rgba(0,0,0,0.18)' }}>
              <p className={lastResult === 'ok' ? 'statusOk' : 'statusBad'}>
                {lastResult === 'ok'
                  ? '정답! (다음 문제로 넘어갔어요)'
                  : '오답! (다음 문제로 넘어갔어요)'}
              </p>
              <p className="hint">
                팁: 실제 서비스는 사진/세부 객체로 더 어렵게 나오지만, 여기서는
                “흐름/선택 실수”를 연습하도록 단순화했어요.
              </p>
            </div>
          </>
        ) : null}
      </section>
    </AppShell>
  )
}

