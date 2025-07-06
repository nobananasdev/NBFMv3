'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export type NavigationSection = 'discover' | 'watchlist' | 'new-seasons' | 'rated'

interface NavigationContextType {
  activeSection: NavigationSection
  setActiveSection: (section: NavigationSection) => void
  watchlistCount: number
  ratedCount: number
  refreshCounters: () => Promise<void>
  refreshTrigger: number
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<NavigationSection>('discover')
  const [watchlistCount, setWatchlistCount] = useState(0)
  const [ratedCount, setRatedCount] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user } = useAuth()

  const refreshCounters = useCallback(async () => {
    if (!user) {
      setWatchlistCount(0)
      setRatedCount(0)
      return
    }

    try {
      // Get watchlist count
      const { count: watchlistCountResult } = await supabase
        .from('user_shows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'watchlist')

      // Get rated count (liked_it, loved_it, and not_for_me)
      const { count: ratedCountResult } = await supabase
        .from('user_shows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['liked_it', 'loved_it', 'not_for_me'])

      setWatchlistCount(watchlistCountResult || 0)
      setRatedCount(ratedCountResult || 0)
      
      // Trigger refresh for all sections that depend on user data
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching navigation counters:', error)
    }
  }, [user])

  useEffect(() => {
    refreshCounters()
  }, [user, refreshCounters])

  return (
    <NavigationContext.Provider value={{
      activeSection,
      setActiveSection,
      watchlistCount,
      ratedCount,
      refreshCounters,
      refreshTrigger
    }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}