import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'

export function PlaceholderPage() {
  const { slug } = useParams()
  return (
    <AppShell title="CAPTCHA 연습장" subtitle="준비중인 캡차">
      <section className="panel">
        <h1 className="h1">준비중</h1>
        <p className="lead">
          이 캡차는 아직 구현하지 않았어요. (slug: <b>{slug}</b>)
        </p>
        <div style={{ height: 18 }} />
        <div className="row">
          <Link className="btn btnPrimary" to="/">
            홈으로
          </Link>
        </div>
        <div style={{ height: 22 }} />
        <div className="panel" style={{ background: 'rgba(0,0,0,0.18)' }}>
          <p className="hint">
            요청하신 대로 “나머지 두 개”는 지금은 <b>빈공간(준비중)</b>으로
            남겨두고, 클릭하면 이 페이지로 넘어오게 해두었습니다.
          </p>
        </div>
      </section>
    </AppShell>
  )
}

