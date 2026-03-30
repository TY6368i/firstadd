// Supabase Edge Function: recaptcha-verify
// Deploy:
//   supabase functions deploy recaptcha-verify
// Set secret:
//   supabase secrets set RECAPTCHA_SECRET_KEY=your_secret

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

type VerifyReq = {
  token?: string
  action?: string
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const secret = Deno.env.get('RECAPTCHA_SECRET_KEY')
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Missing RECAPTCHA_SECRET_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { token, action } = (await req.json()) as VerifyReq
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const params = new URLSearchParams()
    params.set('secret', secret)
    params.set('response', token)

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim()
    if (ip) params.set('remoteip', ip)

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

    return new Response(
      JSON.stringify({
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
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
})

