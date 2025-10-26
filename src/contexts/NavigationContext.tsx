'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react'
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
  sectionFlashes: Partial<Record<NavigationSection, boolean>>
  triggerSectionFlash: (section: NavigationSection) => void
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
  const [sectionFlashes, setSectionFlashes] = useState<Partial<Record<NavigationSection, boolean>>>({})
  const flashTimeouts = useRef<Partial<Record<NavigationSection, ReturnType<typeof setTimeout>>>>({})
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
      if (!user) {
        // Only fetch discover count for non-authenticated users
        const { count: discoverCountResult } = await supabase
          .from('shows')
          .select('*', { count: 'exact', head: true })
          .eq('show_in_discovery', true)

        setDiscoverCount(discoverCountResult || 0)
        setWatchlistCount(0)
        setRatedCount(0)
        setNewSeasonsCount(0)
        return
      }

      // Run all queries in parallel for authenticated users
      const [
        discoverResult,
        watchlistResult,
        ratedResult,
        userLikedShows
      ] = await Promise.all([
        supabase
          .from('shows')
          .select('*', { count: 'exact', head: true })
          .eq('show_in_discovery', true),
        supabase
          .from('user_shows')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'watchlist'),
        supabase
          .from('user_shows')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['liked_it', 'loved_it', 'not_for_me']),
        supabase
          .from('user_shows')
          .select(`
            imdb_id,
            shows!inner (next_season_date)
          `)
          .eq('user_id', user.id)
          .in('status', ['liked_it', 'loved_it'])
      ])

      const currentDate = new Date()
      const sixMonthsAgo = new Date(currentDate.getTime() - (6 * 30 * 24 * 60 * 60 * 1000))

      const newSeasonsCount = userLikedShows.data?.filter((us: any) => {
        const show = us.shows
        if (!show?.next_season_date) return false
        const nextSeasonDate = new Date(show.next_season_date)
        return nextSeasonDate > sixMonthsAgo
      }).length || 0

      setDiscoverCount(discoverResult.count || 0)
      setWatchlistCount(watchlistResult.count || 0)
      setRatedCount(ratedResult.count || 0)
      setNewSeasonsCount(newSeasonsCount)

      // Trigger refresh for all sections that depend on user data
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching navigation counters:', error)
    }
  }, [user])

  const triggerSectionFlash = useCallback((section: NavigationSection) => {
    setSectionFlashes(prev => ({ ...prev, [section]: true }))

    if (flashTimeouts.current[section]) {
      clearTimeout(flashTimeouts.current[section]!)
    }

    flashTimeouts.current[section] = setTimeout(() => {
      setSectionFlashes(prev => {
        const next = { ...prev }
        delete next[section]
        return next
      })
      delete flashTimeouts.current[section]
    }, 1400)
  }, [])

  useEffect(() => {
    refreshCounters()
  }, [user, refreshCounters])

  useEffect(() => {
    return () => {
      Object.values(flashTimeouts.current).forEach(timeoutId => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      })
    }
  }, [])

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
      discoverResetTrigger,
      sectionFlashes,
      triggerSectionFlash
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
