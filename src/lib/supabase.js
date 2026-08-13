import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[BMC] Supabase env vars not set. ' +
    'Copy .env.example to .env and fill in your project credentials.'
  )
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

// Debug helper — exposes the client to the browser console.
// REMOVE before production.
if (typeof window !== 'undefined') {
  window.__supabase = supabase
}
