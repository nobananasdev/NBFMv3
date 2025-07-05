import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Browser-optimized configuration to prevent auth session hangs
const clientConfig = typeof window === 'undefined' ? {
  // Server-side: normal config
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
} : {
  // Browser-side: enable URL detection but keep other optimizations
  auth: {
    persistSession: true,       // Enable session persistence for auth to work
    autoRefreshToken: true,     // Enable auto refresh for session management
    detectSessionInUrl: true    // ENABLE URL session detection for email confirmation!
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, clientConfig)