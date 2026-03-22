import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import {
  fetchMCAManifest,
  getCategoryImageUrls,
  type MCACategory,
  type MCAPuzzle,
  type MCATextCategory,
} from '../lib/mcaBench'
import { getCategoryKo } from '../lib/mcaBenchCategoryKo'

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false
  for (const x of a) if (!b.has(x)) return false
  return true
}

function normText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function GridOnImage({
  selected,
  onToggle,
  disabled,
}: {
  selected: Set<number>
  onToggle: (i: number) => void
  disabled?: boolean
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const on = selected.has(i)
        return (
          <button
            key={i}
            type="button"
            onClick={() => onToggle(i)}
            className="btn"
            style={{
              margin: 0,
              minHeight: 48,
              borderRadius: 0,
              opacity: on ? 0.45 : 0.12,
              background: on ? 'rgba(124,58,237,0.85)' : 'rgba(255,255,255,0.15)',
              border: on ? '3px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
            }}
            aria-pressed={on}
          >
            {i}
          </button>
        )
      })}
    </div>
  )
}

function ClickBoxOverlay({
  boxes,
  naturalW,
  naturalH,
  selected,
  onToggle,
  showSolution,
  disabled,
}: {
  boxes: number[][]
  naturalW: number
  naturalH: number
  selected: Set<number>
  onToggle: (i: number) => void
  showSolution: boolean
  disabled?: boolean
}) {
  return (
    <>
      {boxes.map((b, i) => {
        const [x1, y1, x2, y2] = b
        const on = selected.has(i)
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(i)}
            style={{
              position: 'absolute',
              left: `${(x1 / naturalW) * 100}%`,
              top: `${(y1 / naturalH) * 100}%`,
              width: `${((x2 - x1) / naturalW) * 100}%`,
              height: `${((y2 - y1) / naturalH) * 100}%`,
              border: on
                ? '3px solid rgba(34,197,94,0.95)'
                : '2px dashed rgba(255,255,255,0.55)',
              background:
                showSolution || on
                  ? 'rgba(34,197,94,0.28)'
                  : 'rgba(255,255,255,0.06)',
              cursor: disabled ? 'default' : 'pointer',
              padding: 0,
            }}
            aria-pressed={on}
          />
        )
      })}
    </>
  )
}

function TextCategoryView({ cat }: { cat: MCATextCategory }) {
  const ko = getCategoryKo(cat.key)
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<'ok' | 'bad' | null>(null)
  const [revealed, setRevealed] = useState(false)

  const item = cat.items[idx]
  const hasPrev = idx > 0
  const hasNext = idx < cat.items.length - 1

  function check() {
    const ok = normText(answer) === normText(item.answer)
    setResult(ok ? 'ok' : 'bad')
    if (ok) setRevealed(true)
  }

  function next() {
    setIdx((i) => Math.min(cat.items.length - 1, i + 1))
    setAnswer('')
    setResult(null)
    setRevealed(false)
  }

  function prev() {
    setIdx((i) => Math.max(0, i - 1))
    setAnswer('')
    setResult(null)
    setRevealed(false)
  }

  return (
    <AppShell title="MCA-Bench 연습" subtitle={ko.titleKo}>
      <section className="hero">
        <h1 className="h1">{ko.titleKo}</h1>
        <p className="lead">{ko.summaryKo}</p>
        <p className="hint">{ko.taskKo}</p>
      </section>
      <section className="panel">
        <p className="hint">
          문제 {idx + 1} / {cat.items.length}
        </p>
        <div style={{ height: 12 }} />
        <p style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>{item.question}</p>
        <div style={{ height: 16 }} />
        <input
          className="btn"
          style={{
            width: '100%',
            maxWidth: 420,
            padding: '12px 14px',
            textAlign: 'left',
            cursor: 'text',
          }}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="답을 입력하세요 (영문/숫자)"
        />
        <div style={{ height: 12 }} />
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button className="btn btnPrimary" type="button" onClick={check}>
            확인
          </button>
          <button className="btn" type="button" onClick={() => setRevealed((r) => !r)}>
            {revealed ? '정답 숨기기' : '정답 보기'}
          </button>
          <button className="btn" type="button" onClick={prev} disabled={!hasPrev}>
            이전
          </button>
          <button className="btn" type="button" onClick={next} disabled={!hasNext}>
            다음
          </button>
          <Link className="btn" to="/captcha/mca">
            종목 목록
          </Link>
        </div>
        {revealed ? (
          <p className="hint" style={{ marginTop: 12 }}>
            정답: <b>{item.answer}</b>
          </p>
        ) : null}
        {result === 'ok' ? (
          <p className="statusOk" style={{ marginTop: 8 }}>
            정답입니다.
          </p>
        ) : null}
        {result === 'bad' ? (
          <p className="statusBad" style={{ marginTop: 8 }}>
            오답입니다. 정답 보기를 눌러 확인하세요.
          </p>
        ) : null}
      </section>
    </AppShell>
  )
}

export function MCACategoryPage() {
  const { categoryKey } = useParams<{ categoryKey: string }>()
  const [imageCat, setImageCat] = useState<MCACategory | null>(null)
  const [textCat, setTextCat] = useState<MCATextCategory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!categoryKey) return
    setLoading(true)
    fetchMCAManifest().then((m) => {
      const img = m?.categories.find((c) => c.key === categoryKey) ?? null
      const tx = m?.textCategories?.find((c) => c.key === categoryKey) ?? null
      setImageCat(img)
      setTextCat(tx)
      setLoading(false)
    })
  }, [categoryKey])

  if (!categoryKey || loading) {
    return (
      <AppShell title="MCA-Bench 연습">
        <section className="panel">
          <p className="hint">로딩 중...</p>
        </section>
      </AppShell>
    )
  }

  if (textCat) {
    return <TextCategoryView cat={textCat} />
  }

  if (!imageCat?.files?.length) {
    return (
      <AppShell title="MCA-Bench 연습">
        <section className="panel">
          <h2 className="cardTitle">데이터 없음</h2>
          <Link className="btn btnPrimary" to="/captcha/mca">
            종목 목록으로
          </Link>
        </section>
      </AppShell>
    )
  }

  return <ImageCategoryPractice category={imageCat} />
}

function ImageCategoryPractice({ category }: { category: MCACategory }) {
  const ko = getCategoryKo(category.key)
  const files = category.files ?? []
  const puzzles = category.puzzles ?? []
  const urls = useMemo(
    () => getCategoryImageUrls(category.key, files),
    [category.key, files],
  )

  const [index, setIndex] = useState(0)
  const [selectedGrid, setSelectedGrid] = useState<Set<number>>(() => new Set())
  const [selectedBoxes, setSelectedBoxes] = useState<Set<number>>(() => new Set())
  const [textAns, setTextAns] = useState('')
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null)
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const [showSolution, setShowSolution] = useState(false)

  const puzzle: MCAPuzzle = puzzles[index] ?? {
    file: files[index],
    instructionEn: '',
    interaction: 'browse',
  }
  const imageUrl = urls[index] ?? ''
  const hasPrev = index > 0
  const hasNext = index < urls.length - 1

  const interaction = puzzle.interaction
  const expectedGrid = useMemo(
    () => new Set(puzzle.gridIndices ?? []),
    [puzzle.gridIndices],
  )
  const boxCount = puzzle.boxes?.length ?? 0
  const expectedBoxes = useMemo(() => {
    const s = new Set<number>()
    for (let i = 0; i < boxCount; i += 1) s.add(i)
    return s
  }, [boxCount])

  function resetRound() {
    setSelectedGrid(new Set())
    setSelectedBoxes(new Set())
    setTextAns('')
    setFeedback(null)
    setShowSolution(false)
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1))
    resetRound()
  }

  function goNext() {
    setIndex((i) => Math.min(urls.length - 1, i + 1))
    resetRound()
  }

  function toggleGrid(i: number) {
    setSelectedGrid((prev) => {
      const n = new Set(prev)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })
    setFeedback(null)
  }

  function toggleBox(i: number) {
    setSelectedBoxes((prev) => {
      const n = new Set(prev)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })
    setFeedback(null)
  }

  function submit() {
    let ok = false
    if (interaction === 'grid_3x3' || interaction === 'grid_3x3_two') {
      ok = setsEqual(selectedGrid, expectedGrid)
      if (interaction === 'grid_3x3_two' && puzzle.gridIndices?.length === 2) {
        ok = setsEqual(selectedGrid, expectedGrid)
      }
    } else if (interaction === 'click_boxes' && puzzle.boxes?.length) {
      ok = setsEqual(selectedBoxes, expectedBoxes)
    } else if (interaction === 'text' && puzzle.expectedText != null) {
      ok = normText(textAns) === normText(puzzle.expectedText)
    } else {
      setFeedback(null)
      return
    }
    setFeedback(ok ? 'ok' : 'bad')
    if (ok) setShowSolution(true)
  }

  const showGrid =
    interaction === 'grid_3x3' || interaction === 'grid_3x3_two'

  const showBoxes = interaction === 'click_boxes' && (puzzle.boxes?.length ?? 0) > 0
  const showTextInput = interaction === 'text' && puzzle.expectedText != null

  return (
    <AppShell title="MCA-Bench 연습" subtitle={ko.titleKo}>
      <section className="hero">
        <h1 className="h1">{ko.titleKo}</h1>
        <p className="lead">{ko.summaryKo}</p>
        <p className="hint">{ko.taskKo}</p>
        {ko.gridHelpKo && showGrid ? <p className="hint">{ko.gridHelpKo}</p> : null}
      </section>

      <section className="panel">
        <p className="hint">
          샘플 {index + 1} / {urls.length}
        </p>
        {puzzle.instructionEn ? (
          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 12,
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>과제 지시 (원문)</p>
            <pre
              style={{
                margin: '8px 0 0',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: 14,
              }}
            >
              {puzzle.instructionEn}
            </pre>
          </div>
        ) : null}

        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              position: 'relative',
              maxWidth: '100%',
              lineHeight: 0,
            }}
          >
            <img
              src={imageUrl}
              alt={ko.titleKo}
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
              onLoad={(e) => {
                const el = e.currentTarget
                setImgNatural({ w: el.naturalWidth, h: el.naturalHeight })
              }}
            />
            {showGrid ? (
              <GridOnImage selected={selectedGrid} onToggle={toggleGrid} />
            ) : null}
            {showBoxes && imgNatural && puzzle.boxes ? (
              <ClickBoxOverlay
                boxes={puzzle.boxes}
                naturalW={imgNatural.w}
                naturalH={imgNatural.h}
                selected={selectedBoxes}
                onToggle={toggleBox}
                showSolution={showSolution}
              />
            ) : null}
          </div>

          {showGrid ? (
            <p className="hint">
              {interaction === 'grid_3x3_two'
                ? '정확히 두 칸을 선택하세요.'
                : '지시에 맞는 격자 칸을 모두 선택하세요.'}
            </p>
          ) : null}
          {showBoxes ? (
            <p className="hint">정답 영역(라벨 기준)을 모두 클릭해 선택하세요.</p>
          ) : null}

          {showTextInput ? (
            <>
              <input
                className="btn"
                style={{
                  width: '100%',
                  maxWidth: 420,
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'text',
                }}
                value={textAns}
                onChange={(e) => setTextAns(e.target.value)}
                placeholder="답 입력"
              />
            </>
          ) : null}

          {(interaction === 'browse' || interaction === 'info') &&
          !showGrid &&
          !showBoxes &&
          !showTextInput ? (
            <p className="hint">
              이 샘플은 라벨이 없거나 자동 채점이 어렵습니다. 이미지를 참고해 연습하세요.
              {puzzle.answerHint ? (
                <>
                  <br />
                  <span style={{ marginTop: 8, display: 'inline-block' }}>
                    참고: {puzzle.answerHint.slice(0, 400)}
                    {puzzle.answerHint.length > 400 ? '…' : ''}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}

          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {(showGrid || showBoxes || showTextInput) && (
              <>
                <button className="btn btnPrimary" type="button" onClick={submit}>
                  확인
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setShowSolution((s) => !s)}
                >
                  {showSolution ? '정답 숨기기' : '정답 보기'}
                </button>
              </>
            )}
            <button className="btn" type="button" onClick={goPrev} disabled={!hasPrev}>
              ← 이전 샘플
            </button>
            <button className="btn" type="button" onClick={goNext} disabled={!hasNext}>
              다음 샘플 →
            </button>
            <Link className="btn" to="/captcha/mca">
              종목 목록
            </Link>
            <Link className="btn" to="/">
              홈
            </Link>
          </div>

          {showSolution && puzzle.gridIndices?.length ? (
            <p className="hint">
              정답 격자 번호: <b>{puzzle.gridIndices.join(', ')}</b>
            </p>
          ) : null}
          {showSolution && puzzle.expectedText ? (
            <p className="hint">
              정답 텍스트: <b>{puzzle.expectedText}</b>
            </p>
          ) : null}
          {showSolution && showBoxes && puzzle.boxes?.length ? (
            <p className="hint">녹색으로 표시된 영역이 라벨상 정답 클릭 구역입니다.</p>
          ) : null}

          {feedback === 'ok' ? (
            <p className="statusOk">정답입니다.</p>
          ) : null}
          {feedback === 'bad' ? (
            <p className="statusBad">오답입니다. 정답 보기를 참고하세요.</p>
          ) : null}
        </div>
      </section>
    </AppShell>
  )
}
