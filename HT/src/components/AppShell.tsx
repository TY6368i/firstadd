import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

export function AppShell(props: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const { title, subtitle, children } = props

  return (
    <div className="appShell">
      <div className="container">
        <header className="topbar">
          <div className="brand">
            <div className="brandTitle">
              <Link to="/">{title}</Link>
            </div>
            {subtitle ? <div className="brandSub">{subtitle}</div> : null}
          </div>
          <nav className="navRow" aria-label="주요 메뉴">
            <NavLink className="chipLink" to="/captcha/text">
              보안 문자
            </NavLink>
            <NavLink className="chipLink" to="/captcha/image">
              이미지
            </NavLink>
            <NavLink className="chipLink" to="/captcha/recaptcha-click">
              reCAPTCHA
            </NavLink>
          </nav>
        </header>

        <main className="page">{children}</main>
      </div>
    </div>
  )
}

