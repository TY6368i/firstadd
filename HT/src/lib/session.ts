const KEY = 'captcha_practice_session_id'

function randomId() {
  // not crypto-secure; good enough for practice session correlation
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function getSessionId() {
  const existing = localStorage.getItem(KEY)
  if (existing) return existing
  const created = randomId()
  localStorage.setItem(KEY, created)
  return created
}

