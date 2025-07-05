'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  getUserDisplayName: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        // Add timeout to getSession to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('getSession timeout')), 5000)
        )
        
        const result = await Promise.race([sessionPromise, timeoutPromise])
        const { data: { session }, error } = result
        
        if (error) {
          console.error('Error getting session:', error)
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        
        // If getSession fails, try to manually parse URL hash for auth tokens
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          try {
            // Try to trigger auth state change by refreshing the session
            await supabase.auth.refreshSession()
          } catch (refreshError) {
            console.error('Manual refresh failed:', refreshError)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    // Set a timeout to ensure loading state doesn't persist forever
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000) // 3 second timeout

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      // Step 1: Attempt Supabase auth signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      if (!data.user) {
        return { error: new Error('No user returned from signup') }
      }

      // Check if email confirmation is required
      if (!data.session && data.user) {
        return { error: null } // Success, but no immediate session
      }

      // Step 2: Create profile in database (only if we have a session)
      const profileData = {
        id: data.user.id,
        display_name: displayName || null,
        preferences: {},
        is_admin: false,
        interaction_count: 0,
      }
      
      // Retry mechanism for profile creation (in case of timing issues)
      let profileError = null
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount < maxRetries) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData])

        if (!insertError) {
          break
        }

        profileError = insertError
        retryCount++

        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (profileError) {
        return { error: profileError }
      }

      return { error: null }
      
    } catch (unexpectedError) {
      return { error: unexpectedError }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const getUserDisplayName = () => {
    if (profile?.display_name) {
      return profile.display_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    getUserDisplayName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}