import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { fetchMCAManifest, getCategoryImageUrls } from '../lib/mcaBench'

export function MCACategoryPage() {
  const { categoryKey } = useParams<{ categoryKey: string }>()
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [label, setLabel] = useState<string>('')
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!categoryKey) return
    setLoading(true)
    fetchMCAManifest().then((manifest) => {
      const cat = manifest?.categories.find((c) => c.key === categoryKey)
      if (cat) {
        setLabel(cat.label)
        const files = cat.files ?? []
        setImageUrls(getCategoryImageUrls(categoryKey, files))
        setIndex(0)
      } else {
        setImageUrls([])
      }
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

  if (imageUrls.length === 0) {
    return (
      <AppShell title="MCA-Bench 연습">
        <section className="panel">
          <h2 className="cardTitle">데이터 없음</h2>
          <p className="cardDesc">이 종목에 사용할 수 있는 이미지가 없습니다.</p>
          <Link className="btn btnPrimary" to="/captcha/mca">
            종목 목록으로
          </Link>
        </section>
      </AppShell>
    )
  }

  const current = imageUrls[index]
  const hasPrev = index > 0
  const hasNext = index < imageUrls.length - 1

  return (
    <AppShell
      title="MCA-Bench 연습"
      subtitle={`${label} (${index + 1}/${imageUrls.length})`}
    >
      <section className="hero">
        <h1 className="h1">{label}</h1>
        <p className="lead">
          아래 이미지를 살펴보며 패턴을 익히세요. 이전/다음으로 샘플을 탐색할 수 있습니다.
        </p>
      </section>

      <section className="panel">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              overflow: 'auto',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 16,
              padding: 12,
            }}
          >
            <img
              src={current}
              alt={`${label} 샘플 ${index + 1}`}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>

          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button
              className="btn"
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={!hasPrev}
            >
              ← 이전
            </button>
            <button
              className="btn"
              type="button"
              onClick={() =>
                setIndex((i) => Math.min(imageUrls.length - 1, i + 1))
              }
              disabled={!hasNext}
            >
              다음 →
            </button>
            <Link className="btn" to="/captcha/mca">
              종목 목록
            </Link>
            <Link className="btn" to="/">
              홈
            </Link>
            <span className="hint">
              {index + 1} / {imageUrls.length}
            </span>
          </div>
        </div>
      </section>
    </AppShell>
  )
}
