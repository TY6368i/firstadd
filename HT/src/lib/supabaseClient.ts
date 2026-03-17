import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export function assertSupabaseConfigured() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase env가 비어있습니다. VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 설정하세요.',
    )
  }
}

