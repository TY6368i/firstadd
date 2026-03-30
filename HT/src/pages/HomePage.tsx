import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'

type CaptchaItem = {
  title: string
  desc: string
  to: string
  live: boolean
  tag: string
}

const items: CaptchaItem[] = [
  {
    title: '보안 문자 (Text CAPTCHA)',
    desc: '왜곡된 글자를 보고 입력하는 방식. 기본 원리/실수 패턴을 연습해요.',
    to: '/captcha/text',
    live: true,
    tag: '기본',
  },
  {
    title: '이미지 선택 (Image CAPTCHA)',
    desc: '지정된 대상(예: 버스/신호등)을 모두 선택하는 방식의 연습 버전.',
    to: '/captcha/image',
    live: true,
    tag: '기본',
  },
  {
    title: '마우스 클릭 (reCAPTCHA 스타일)',
    desc: '체크박스 클릭 → 검증 모달. 사용 흐름을 연습해요.',
    to: '/captcha/recaptcha-click',
    live: true,
    tag: '기본',
  },
  {
    title: 'MCA-Bench (20종목)',
    desc: 'Kaggle 데이터 기반. 종목별 한글 설명, 과제 지시, 3×3 선택·클릭 영역·텍스트 정답 채점 및 정답 보기.',
    to: '/captcha/mca',
    live: true,
    tag: 'MCA-Bench',
  },
  {
    title: '최신 기술 #1 (reCAPTCHA v3)',
    desc: 'v3 점수 기반 검증. 토큰 발급 후 서버(siteverify) 검증 흐름을 연습합니다.',
    to: '/captcha/recaptcha-v3',
    live: true,
    tag: '최신',
  },
  {
    title: '최신 기술 #2 (준비중)',
    desc: '나중에 추가할 캡차. 지금은 빈공간(준비중)으로 연결돼요.',
    to: '/captcha/placeholder/modern-2',
    live: false,
    tag: '최신',
  },
]

export function HomePage() {
  return (
    <AppShell
      title="CAPTCHA 연습장"
      subtitle="종류별로 캡차를 직접 풀어보는 연습 사이트 (3개 구현, 2개 준비중)"
    >
      <section className="hero">
        <h1 className="h1">캡차 연습</h1>
        <p className="lead">
          아래 항목 중 동작하는 종류만 선택해 연습하세요.
        </p>
      </section>

      <section className="grid" aria-label="캡차 종류 목록">
        {items.map((it) =>
          it.live ? (
            <Link key={it.to} className="card" to={it.to}>
              <div className="cardInner">
                <div className="cardTop">
                  <h2 className="cardTitle">{it.title}</h2>
                  <span className="badge badgeLive">사용 가능 · {it.tag}</span>
                </div>
                <p className="cardDesc">{it.desc}</p>
                <div className="btnRow">
                  <span className="btn btnPrimary">들어가기</span>
                  <span className="hint">지금 풀 수 있어요</span>
                </div>
              </div>
            </Link>
          ) : (
            <article
              key={it.to}
              className="card"
              aria-disabled="true"
              style={{ opacity: 0.65, cursor: 'not-allowed' }}
            >
              <div className="cardInner">
                <div className="cardTop">
                  <h2 className="cardTitle">{it.title}</h2>
                  <span className="badge">준비중 · {it.tag}</span>
                </div>
                <p className="cardDesc">{it.desc}</p>
                <div className="btnRow">
                  <span className="btn">준비중</span>
                  <span className="hint">현재는 들어갈 수 없어요</span>
                </div>
              </div>
            </article>
          ),
        )}
      </section>
    </AppShell>
  )
}

