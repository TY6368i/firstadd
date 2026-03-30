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

  // INSERT … RETURNING(.select())은 RLS에서 SELECT 정책이 없으면 실패합니다.
  // 세션 행만 생기고 batches insert까지 못 가는 경우가 많아, id는 클라이언트에서 고정합니다.
  const sessionId = crypto.randomUUID()

  const { error: sessionErr } = await client.from('captcha_sessions').insert({
    id: sessionId,
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

  if (sessionErr) {
    return {
      error: `[captcha_sessions] ${sessionErr.message}${sessionErr.code ? ` (${sessionErr.code})` : ''}`,
    }
  }

  const { error: batchErr } = await client.from('captcha_pointer_batches').insert({
    session_id: sessionId,
    points: pointers,
  })

  if (batchErr) {
    return {
      error: `[captcha_pointer_batches] ${batchErr.message}${batchErr.code ? ` (${batchErr.code})` : ''}`,
    }
  }

  return { sessionId }
}
