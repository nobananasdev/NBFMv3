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
  resetUserData: () => Promise<{ error: any }>
  isResetting: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)

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

  const resetUserData = async (): Promise<{ error: any }> => {
    if (!user?.id) {
      console.log('❌ [RESET] No user to reset')
      return { error: new Error('No user to reset') }
    }

    setIsResetting(true)
    console.log('🔄 [RESET] Starting user data reset for user:', user.id)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }

      // Step 1: Delete all user_shows records
      console.log('🗑️ [RESET] Deleting user_shows records...')
      const deleteUserShowsUrl = `${supabaseUrl}/rest/v1/user_shows?user_id=eq.${user.id}`
      
      const deleteUserShowsPromise = fetch(deleteUserShowsUrl, {
        method: 'DELETE',
        headers
      })
      
      const deleteTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Delete user_shows timeout')), 10000)
      )
      
      const deleteResponse = await Promise.race([deleteUserShowsPromise, deleteTimeout])
      
      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text()
        console.error('❌ [RESET] Failed to delete user_shows:', errorText)
        return { error: new Error(`Failed to delete user_shows: ${deleteResponse.status}`) }
      }
      
      console.log('✅ [RESET] User_shows records deleted successfully')

      // Step 2: Reset interaction count in profiles
      console.log('🔄 [RESET] Resetting interaction count...')
      const updateProfileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`
      const updateData = {
        interaction_count: 0,
        preferences: {}
      }
      
      const updateProfilePromise = fetch(updateProfileUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData)
      })
      
      const updateTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Update profile timeout')), 10000)
      )
      
      const updateResponse = await Promise.race([updateProfilePromise, updateTimeout])
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error('❌ [RESET] Failed to reset profile:', errorText)
        return { error: new Error(`Failed to reset profile: ${updateResponse.status}`) }
      }
      
      console.log('✅ [RESET] Profile interaction count reset successfully')

      // Step 3: Update local profile state
      setProfile(prev => prev ? {
        ...prev,
        interaction_count: 0,
        preferences: {}
      } : null)

      console.log('🎉 [RESET] User data reset completed successfully')
      
      // Small delay to ensure database changes are reflected
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { error: null }
    } catch (error) {
      console.error('❌ [RESET] Error during reset:', error)
      return { error }
    } finally {
      setIsResetting(false)
    }
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
    resetUserData,
    isResetting,
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