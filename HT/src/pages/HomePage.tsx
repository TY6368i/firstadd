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
    title: '최신 기술 #1 (준비중)',
    desc: '나중에 추가할 캡차. 지금은 빈공간(준비중)으로 연결돼요.',
    to: '/captcha/placeholder/modern-1',
    live: false,
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
          아래 5가지 중 하나를 골라 연습하세요. (현재는 <b>기본 3개</b>만
          동작합니다.)
        </p>
      </section>

      <section className="grid" aria-label="캡차 종류 목록">
        {items.map((it) => (
          <Link key={it.to} className="card" to={it.to}>
            <div className="cardInner">
              <div className="cardTop">
                <h2 className="cardTitle">{it.title}</h2>
                <span className={`badge ${it.live ? 'badgeLive' : ''}`}>
                  {it.live ? '사용 가능' : '준비중'} · {it.tag}
                </span>
              </div>
              <p className="cardDesc">{it.desc}</p>
              <div className="btnRow">
                <span className={`btn ${it.live ? 'btnPrimary' : ''}`}>
                  들어가기
                </span>
                <span className="hint">
                  {it.live ? '지금 풀 수 있어요' : '눌러서 준비중 화면으로 이동'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </AppShell>
  )
}

