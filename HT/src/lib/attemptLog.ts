import { supabase } from './supabaseClient'
import { getSessionId } from './session'

export type CaptchaType = 'text' | 'image' | 'recaptcha_click' | 'placeholder'

export async function logCaptchaAttempt(params: {
  type: CaptchaType
  success: boolean
  durationMs?: number
  meta?: Record<string, unknown>
}) {
  if (!supabase) return { skipped: true as const }

  const session_id = getSessionId()
  const { type, success, durationMs, meta } = params

  const { error } = await supabase.from('captcha_attempts').insert({
    session_id,
    captcha_type: type,
    success,
    duration_ms: durationMs ?? null,
    meta: meta ?? null,
  })

  if (error) {
    // don't break UX for a practice app; just surface via console
    console.warn('[supabase] logCaptchaAttempt failed:', error.message)
    return { skipped: false as const, ok: false as const, error }
  }

  return { skipped: false as const, ok: true as const }
}

