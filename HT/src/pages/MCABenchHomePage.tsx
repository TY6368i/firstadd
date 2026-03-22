import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { fetchMCAManifest, type MCACategory, type MCATextCategory } from '../lib/mcaBench'
import { getCategoryKo } from '../lib/mcaBenchCategoryKo'

type ListItem = (MCACategory | MCATextCategory) & { isText: boolean }

export function MCABenchHomePage() {
  const [imageCats, setImageCats] = useState<MCACategory[]>([])
  const [textCats, setTextCats] = useState<MCATextCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMCAManifest().then((manifest) => {
      setImageCats(manifest?.categories ?? [])
      setTextCats(manifest?.textCategories ?? [])
      setLoading(false)
    })
  }, [])

  const merged: ListItem[] = useMemo(() => {
    const img: ListItem[] = imageCats.map((c) => ({ ...c, isText: false }))
    const tx: ListItem[] = textCats.map((c) => ({ ...c, isText: true }))
    return [...img, ...tx].sort((a, b) =>
      getCategoryKo(a.key).titleKo.localeCompare(getCategoryKo(b.key).titleKo, 'ko'),
    )
  }, [imageCats, textCats])

  return (
    <AppShell
      title="CAPTCHA 연습장"
      subtitle="MCA-Bench 종목별 캡차 연습 (Kaggle 데이터셋)"
    >
      <section className="hero">
        <h1 className="h1">MCA-Bench 종목 선택</h1>
        <p className="lead">
          아래에서 종목을 고르면 <b>한글 설명</b>, <b>과제 지시</b>, <b>정답 확인</b>까지 연습할 수
          있습니다. (데이터는 <code>npm run download-mca</code> 로 준비 후 Git에 포함하세요.)
        </p>
      </section>

      {loading ? (
        <section className="panel">
          <p className="hint">로딩 중...</p>
        </section>
      ) : merged.length === 0 ? (
        <section className="panel" style={{ background: 'rgba(255,200,100,0.15)' }}>
          <h2 className="cardTitle">데이터가 없습니다</h2>
          <p className="cardDesc">
            MCA-Bench 데이터셋을 먼저 준비해주세요. 프로젝트 루트에서 다음을 실행하세요:
          </p>
          <pre
            className="hint"
            style={{
              marginTop: 8,
              padding: 12,
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 8,
            }}
          >
            pip install kagglehub{'\n'}
            npm run download-mca
          </pre>
          <p className="hint">
            Kaggle API 설정(kaggle.json)이 필요할 수 있습니다. 준비 후{' '}
            <code>HT/public/captcha-data</code> 를 커밋하면 Vercel에서도 동작합니다.
          </p>
        </section>
      ) : (
        <section className="grid" aria-label="MCA-Bench 종목 목록">
          {merged.map((cat) => {
            const ko = getCategoryKo(cat.key)
            const isText = cat.isText
            return (
              <Link key={cat.key} className="card" to={`/captcha/mca/${cat.key}`}>
                <div className="cardInner">
                  <div className="cardTop">
                    <h2 className="cardTitle">{ko.titleKo}</h2>
                    <span className="badge badgeLive">
                      {isText ? '텍스트' : '이미지'} · {cat.count}개
                    </span>
                  </div>
                  <p className="cardDesc">{ko.summaryKo}</p>
                  <p className="hint" style={{ marginTop: 8 }}>
                    {ko.taskKo}
                  </p>
                  <div className="btnRow">
                    <span className="btn btnPrimary">연습하기</span>
                    <span className="hint">
                      {cat.name} · 총 {cat.total}개 중 {cat.count}개
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </AppShell>
  )
}
