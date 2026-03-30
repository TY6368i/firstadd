export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) {
    res.status(500).json({ error: 'Missing RECAPTCHA_SECRET_KEY' })
    return
  }

  const { token, action } = req.body || {}
  if (!token) {
    res.status(400).json({ error: 'Missing token' })
    return
  }

  try {
    const params = new URLSearchParams()
    params.set('secret', secret)
    params.set('response', token)
    if (req.headers['x-forwarded-for']) {
      params.set('remoteip', String(req.headers['x-forwarded-for']).split(',')[0].trim())
    }

    const googleRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    const data = await googleRes.json()

    const success = Boolean(data.success)
    const score = typeof data.score === 'number' ? data.score : 0
    const actionOk = !action || !data.action || data.action === action
    const scoreOk = score >= 0.5
    const finalOk = success && actionOk && scoreOk

    res.status(200).json({
      success: finalOk,
      score,
      reasons: finalOk
        ? []
        : [
            !success ? 'google_verify_fail' : null,
            !actionOk ? 'action_mismatch' : null,
            !scoreOk ? 'low_score' : null,
          ].filter(Boolean),
      raw: {
        success: data.success,
        score: data.score,
        action: data.action,
        hostname: data.hostname,
        'error-codes': data['error-codes'],
      },
    })
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'Unknown error',
    })
  }
}
