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
    // MOCK USER FOR TESTING - bypasses all auth complexity
    const initializeMockUser = async () => {
      console.log('🧪 [MOCK AUTH] Initializing test user...')
      
      const mockUserId = '12345678-1234-1234-1234-123456789012' // Valid UUID format
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {}
      } as User

      const mockProfile = {
        id: mockUserId,
        display_name: 'Test User',
        preferences: {},
        is_admin: false,
        interaction_count: 0,
        created_at: new Date().toISOString()
      } as Profile

      // Set mock data
      setUser(mockUser)
      setProfile(mockProfile)
      setSession(null) // We don't need session for testing
      setLoading(false)
      
      console.log('✅ [MOCK AUTH] Test user initialized:', mockUser.id)
    }

    // Small delay to simulate loading
    setTimeout(() => {
      initializeMockUser()
    }, 500)
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('🧪 [MOCK AUTH] Mock sign in - already signed in as test user')
    return { error: null }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    console.log('🧪 [MOCK AUTH] Mock sign up - already signed in as test user')
    return { error: null }
  }

  const signOut = async () => {
    console.log('🧪 [MOCK AUTH] Mock sign out - staying as test user')
    // In mock mode, we don't actually sign out
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