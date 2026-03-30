import type { SupabaseClient } from '@supabase/supabase-js'

/** ms since page metrics start (performance.now() origin) */
export type PointerSample = {
  t: number
  x: number
  y: number
  k: 'move' | 'down' | 'up'
}

export type SaveCaptchaSessionInput = {
  pageUrl: string
  action: string
  startedAtMs: number
  endedAtMs: number
  userAgent: string
  viewportW: number
  viewportH: number
  pointers: PointerSample[]
  recaptchaOk: boolean | null
  recaptchaScore: number | null
  recaptchaHostname: string | null
  meta?: Record<string, unknown>
}

export async function saveCaptchaSessionWithPointers(
  client: SupabaseClient,
  input: SaveCaptchaSessionInput,
): Promise<{ sessionId: string } | { error: string }> {
  const {
    pointers,
    meta,
    recaptchaOk,
    recaptchaScore,
    recaptchaHostname,
    ...sessionRest
  } = input

  const { data: sessionRow, error: sessionErr } = await client
    .from('captcha_sessions')
    .insert({
      page_url: sessionRest.pageUrl,
      action: sessionRest.action,
      recaptcha_ok: recaptchaOk,
      recaptcha_score: recaptchaScore,
      recaptcha_hostname: recaptchaHostname,
      user_agent: sessionRest.userAgent,
      viewport_w: sessionRest.viewportW,
      viewport_h: sessionRest.viewportH,
      started_at_ms: sessionRest.startedAtMs,
      ended_at_ms: sessionRest.endedAtMs,
      event_count: pointers.length,
      meta: meta ?? {},
    })
    .select('id')
    .single()

  if (sessionErr) {
    return { error: sessionErr.message }
  }
  if (!sessionRow?.id) {
    return { error: 'insert returned no id' }
  }

  const { error: batchErr } = await client.from('captcha_pointer_batches').insert({
    session_id: sessionRow.id,
    points: pointers,
  })

  if (batchErr) {
    return { error: batchErr.message }
  }

  return { sessionId: sessionRow.id }
}
