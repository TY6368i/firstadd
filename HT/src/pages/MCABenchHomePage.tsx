import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { fetchMCAManifest, type MCACategory } from '../lib/mcaBench'

export function MCABenchHomePage() {
  const [categories, setCategories] = useState<MCACategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMCAManifest().then((manifest) => {
      setCategories(manifest?.categories ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <AppShell
      title="CAPTCHA 연습장"
      subtitle="MCA-Bench 종목별 캡차 연습 (Kaggle 데이터셋)"
    >
      <section className="hero">
        <h1 className="h1">MCA-Bench 종목 선택</h1>
        <p className="lead">
          아래 20개 종목 중 하나를 선택해 해당 캡차 유형을 연습하세요.
          (데이터셋은 <code>npm run download-mca</code> 로 준비)
        </p>
      </section>

      {loading ? (
        <section className="panel">
          <p className="hint">로딩 중...</p>
        </section>
      ) : categories.length === 0 ? (
        <section className="panel" style={{ background: 'rgba(255,200,100,0.15)' }}>
          <h2 className="cardTitle">데이터가 없습니다</h2>
          <p className="cardDesc">
            MCA-Bench 데이터셋을 먼저 준비해주세요. 프로젝트 루트에서 다음을 실행하세요:
          </p>
          <pre className="hint" style={{ marginTop: 8, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
            pip install kagglehub{"\n"}
            npm run download-mca
          </pre>
          <p className="hint">
            Kaggle API 설정(kaggle.json)이 필요할 수 있습니다.
          </p>
        </section>
      ) : (
        <section className="grid" aria-label="MCA-Bench 종목 목록">
          {categories.map((cat) => (
            <Link key={cat.key} className="card" to={`/captcha/mca/${cat.key}`}>
              <div className="cardInner">
                <div className="cardTop">
                  <h2 className="cardTitle">{cat.label}</h2>
                  <span className="badge badgeLive">
                    {cat.count}개 샘플
                  </span>
                </div>
                <p className="cardDesc">
                  MCA-Bench {cat.name} · 총 {cat.total}개 중 {cat.count}개 로드
                </p>
                <div className="btnRow">
                  <span className="btn btnPrimary">연습하기</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </AppShell>
  )
}
