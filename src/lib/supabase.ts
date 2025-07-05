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
  // Browser-side: disable problematic session persistence
  auth: {
    persistSession: false,      // Disable session persistence in browser
    autoRefreshToken: false,    // Disable auto refresh to prevent hangs
    detectSessionInUrl: false   // Disable URL session detection
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, clientConfig)