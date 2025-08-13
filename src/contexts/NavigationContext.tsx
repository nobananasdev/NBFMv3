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
  discoverCount: number
  newSeasonsCount: number
  refreshCounters: () => Promise<void>
  refreshTrigger: number
  discoverResetTrigger: number
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<NavigationSection>('discover')
  const [watchlistCount, setWatchlistCount] = useState(0)
  const [ratedCount, setRatedCount] = useState(0)
  const [discoverCount, setDiscoverCount] = useState(0)
  const [newSeasonsCount, setNewSeasonsCount] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [discoverResetTrigger, setDiscoverResetTrigger] = useState(0)
  const { user } = useAuth()

  const handleSetActiveSection = useCallback((section: NavigationSection) => {
    if (section === 'discover' && activeSection === 'discover') {
      // If clicking discover while already on discover, trigger a reset
      setDiscoverResetTrigger(prev => prev + 1)
    }
    setActiveSection(section)
  }, [activeSection])

  const refreshCounters = useCallback(async () => {
    try {
      // Get discovery count (shows with show_in_discovery = true, excluding user shows if logged in)
      const { count: discoverCountResult } = await supabase
        .from('shows')
        .select('*', { count: 'exact', head: true })
        .eq('show_in_discovery', true)

      setDiscoverCount(discoverCountResult || 0)

      if (!user) {
        setWatchlistCount(0)
        setRatedCount(0)
        setNewSeasonsCount(0)
        return
      }

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

      // Get new seasons count (shows user rated as loved_it or liked_it with next_season_date)
      const { data: userLikedShows } = await supabase
        .from('user_shows')
        .select(`
          imdb_id,
          shows:imdb_id (next_season_date)
        `)
        .eq('user_id', user.id)
        .in('status', ['liked_it', 'loved_it'])

      const currentDate = new Date()
      const sixMonthsAgo = new Date(currentDate.getTime() - (6 * 30 * 24 * 60 * 60 * 1000))

      const newSeasonsCount = userLikedShows?.filter(us => {
        const show = us.shows as any
        if (!show?.next_season_date) return false
        const nextSeasonDate = new Date(show.next_season_date)
        return nextSeasonDate > sixMonthsAgo
      }).length || 0

      setWatchlistCount(watchlistCountResult || 0)
      setRatedCount(ratedCountResult || 0)
      setNewSeasonsCount(newSeasonsCount)
      
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
      setActiveSection: handleSetActiveSection,
      watchlistCount,
      ratedCount,
      discoverCount,
      newSeasonsCount,
      refreshCounters,
      refreshTrigger,
      discoverResetTrigger
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