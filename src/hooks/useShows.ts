'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShowWithGenres, fetchShows, fetchUserShows, fetchNewSeasonsShows } from '@/lib/shows'
import { ShowStatus } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigation } from '@/contexts/NavigationContext'

export type ShowsViewType = 'discover' | 'watchlist' | 'loved_it' | 'liked_it' | 'new_seasons' | 'all_rated'

export type SortOption = 'latest' | 'rating' | 'recently_added' | 'best_rated' | 'by_rating'

interface UseShowsOptions {
  view: ShowsViewType
  limit?: number
  autoFetch?: boolean
  sortBy?: SortOption
}

interface UseShowsReturn {
  shows: ShowWithGenres[]
  loading: boolean
  error: any
  hasMore: boolean
  fetchMore: () => Promise<void>
  refresh: () => Promise<void>
  handleShowAction: (show: ShowWithGenres, status: ShowStatus) => void
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
}

export function useShows({ view, limit = 20, autoFetch = true, sortBy: initialSortBy }: UseShowsOptions): UseShowsReturn {
  const { user } = useAuth()
  const { refreshCounters, refreshTrigger } = useNavigation()
  const [shows, setShows] = useState<ShowWithGenres[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy || getDefaultSortForView(view))

  function getDefaultSortForView(viewType: ShowsViewType): SortOption {
    switch (viewType) {
      case 'discover':
        return 'latest'
      case 'watchlist':
        return 'recently_added'
      case 'all_rated':
        return 'recently_added'
      case 'new_seasons':
        return 'latest'
      default:
        return 'recently_added'
    }
  }

  const fetchShowsData = useCallback(async (reset = false, overrideSortBy?: SortOption) => {
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      let result: { shows: ShowWithGenres[], error: any }

      const currentOffset = reset ? 0 : offset
      const effectiveSortBy = overrideSortBy || sortBy
      const options = {
        limit,
        offset: currentOffset,
        showInDiscovery: view === 'discover',
        excludeUserShows: view === 'discover' && !!user,
        userId: user?.id
      }

      if (view === 'discover') {
        result = await fetchShows({
          ...options,
          sortBy: effectiveSortBy,
          showInDiscovery: true,
          excludeUserShows: !!user
        })
      } else if (view === 'watchlist') {
        if (!user) {
          setShows([])
          setHasMore(false)
          setLoading(false)
          return
        }
        result = await fetchUserShows(user.id, 'watchlist', { sortBy: effectiveSortBy, limit, offset: currentOffset })
      } else if (view === 'loved_it') {
        if (!user) {
          setShows([])
          setHasMore(false)
          setLoading(false)
          return
        }
        result = await fetchUserShows(user.id, 'loved_it', { sortBy: effectiveSortBy, limit, offset: currentOffset })
      } else if (view === 'liked_it') {
        if (!user) {
          setShows([])
          setHasMore(false)
          setLoading(false)
          return
        }
        result = await fetchUserShows(user.id, 'liked_it', { sortBy: effectiveSortBy, limit, offset: currentOffset })
      } else if (view === 'all_rated') {
        if (!user) {
          setShows([])
          setHasMore(false)
          setLoading(false)
          return
        }
        result = await fetchUserShows(user.id, 'all_rated', { sortBy: effectiveSortBy, limit, offset: currentOffset })
      } else if (view === 'new_seasons') {
        if (!user) {
          setShows([])
          setHasMore(false)
          setLoading(false)
          return
        }
        result = await fetchNewSeasonsShows(user.id, { limit, offset: currentOffset })
      } else {
        result = { shows: [], error: null }
      }

      if (result.error) {
        setError(result.error)
        setShows([])
        setHasMore(false)
      } else {
        if (reset) {
          setShows(result.shows)
          setOffset(result.shows.length)
        } else {
          setShows(prev => [...prev, ...result.shows])
          setOffset(prev => prev + result.shows.length)
        }
        
        // Check if we have more shows to load
        setHasMore(result.shows.length === limit)
      }
    } catch (err) {
      console.error('Error fetching shows:', err)
      setError(err)
      setShows([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [view, user, limit, sortBy]) // Remove offset and loading to avoid infinite loop

  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchShowsData(false)
  }, [hasMore, fetchShowsData])

  const refresh = useCallback(async () => {
    setOffset(0)
    await fetchShowsData(true)
  }, [fetchShowsData])

  const handleShowAction = useCallback(async (show: ShowWithGenres, status: ShowStatus) => {
    console.log('🔄 [useShows] handleShowAction called for:', show.title, 'status:', status, 'view:', view)
    
    if (!user) {
      console.log('❌ [useShows] No user, cannot update show status')
      return
    }
    
    try {
      // Remove show from local state immediately for smooth UX
      console.log('🔄 [useShows] Removing show locally immediately')
      setShows(prev => prev.filter(s => s.imdb_id !== show.imdb_id))
      
      // Import and call the database update function
      const { updateUserShowStatus } = await import('@/lib/shows')
      
      console.log('🔄 [useShows] Updating database for:', show.title)
      const result = await updateUserShowStatus(user.id, show.imdb_id, status)
      
      if (result.error) {
        console.error('❌ [useShows] Database update failed:', result.error)
        return
      }
      
      console.log('✅ [useShows] Database updated successfully for:', show.title)
      
      // Wait a bit then refresh counters
      setTimeout(async () => {
        console.log('🔄 [useShows] Delayed counter refresh')
        await refreshCounters()
      }, 1000)
      
      console.log('✅ [useShows] handleShowAction completed for:', show.title)
    } catch (error) {
      console.error('❌ [useShows] Error in handleShowAction:', error)
    }
  }, [user, view, refreshCounters])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      setOffset(0)
      fetchShowsData(true)
    }
  }, [view, user?.id, autoFetch, sortBy])

  // Refresh data when refreshTrigger changes (skip discover view to prevent flicker)
  useEffect(() => {
    if (user && refreshTrigger > 0 && view !== 'discover') {
      console.log(`🔄 [useShows] Refreshing ${view} view due to trigger:`, refreshTrigger)
      setOffset(0)
      fetchShowsData(true)
    }
  }, [refreshTrigger, user, view, fetchShowsData])

  // Handle sort change
  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort)
    setOffset(0)
    fetchShowsData(true, newSort)
  }, [fetchShowsData, sortBy])

  return {
    shows,
    loading,
    error,
    hasMore,
    fetchMore,
    refresh,
    handleShowAction,
    sortBy,
    setSortBy: handleSortChange
  }
}

// Helper hook for specific views
export function useDiscoverShows(limit?: number) {
  return useShows({ view: 'discover', limit })
}

export function useWatchlistShows(limit?: number) {
  return useShows({ view: 'watchlist', limit })
}

export function useLikedShows(limit?: number) {
  return useShows({ view: 'liked_it', limit })
}

export function useLovedShows(limit?: number) {
  return useShows({ view: 'loved_it', limit })
}

export function useAllRatedShows(limit?: number) {
  return useShows({ view: 'all_rated', limit })
}

export function useNewSeasonsShows(limit?: number) {
  return useShows({ view: 'new_seasons', limit })
}