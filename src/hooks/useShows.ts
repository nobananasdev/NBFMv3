'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShowWithGenres, fetchShows, fetchUserShows, fetchNewSeasonsShows } from '@/lib/shows'
import { ShowStatus } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { useContext } from 'react'
import { FilterContext } from '@/contexts/FilterContext'
import { preloadShowImages, preloadNextBatchImages } from '@/lib/imagePreloader'

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
  preloadedShows: ShowWithGenres[]
  isPreloading: boolean
  preloadNext: () => Promise<void>
}

export function useShows({
  view,
  limit = 20,
  autoFetch = true,
  sortBy: initialSortBy
}: UseShowsOptions): UseShowsReturn {
  const { user } = useAuth()
  const { refreshCounters, refreshTrigger } = useNavigation()
  
  // Always call useContext hook, but only use it for discover view
  const filterContext = useContext(FilterContext)
  const filters = view === 'discover' ? (filterContext?.filters || {
    selectedGenres: [],
    yearRange: [2000, 2024] as [number, number],
    selectedStreamers: []
  }) : {
    selectedGenres: [],
    yearRange: [2000, 2024] as [number, number],
    selectedStreamers: []
  }
  const [shows, setShows] = useState<ShowWithGenres[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy || getDefaultSortForView(view))
  const [preloadedShows, setPreloadedShows] = useState<ShowWithGenres[]>([])
  const [isPreloading, setIsPreloading] = useState(false)
  const [serverOffset, setServerOffset] = useState(0)
  const [preloadedNextOffset, setPreloadedNextOffset] = useState<number | null>(null)
  const [preloadedHasMore, setPreloadedHasMore] = useState<boolean | null>(null)


  // Ensure we never accumulate duplicate imdb_id entries when appending pages
  const dedupeByImdb = useCallback((items: ShowWithGenres[]) => {
    const map = new Map<string, ShowWithGenres>()
    for (const s of items) {
      if (s?.imdb_id && !map.has(s.imdb_id)) {
        map.set(s.imdb_id, s)
      }
    }
    return Array.from(map.values())
  }, [])

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

  const fetchShowsData = useCallback(async (reset = false, overrideSortBy?: SortOption, isPreload = false) => {
    if (loading && !isPreload) return
    
    if (isPreload) {
      setIsPreloading(true)
    } else {
      setLoading(true)
      setError(null)
    }

    try {
      let result: { shows: ShowWithGenres[], error: any, hasMore?: boolean }

      // Calculate correct offset for this request
      let currentOffset: number
      if (view === 'discover') {
        currentOffset = reset ? 0 : serverOffset
      } else {
        if (reset) {
          currentOffset = 0
        } else if (isPreload) {
          // For preloading, use the next offset (current shows + preloaded shows)
          currentOffset = shows.length + preloadedShows.length
        } else {
          // For regular infinite scroll, if we have preloaded shows, we need to account for them
          // Otherwise, just use current shows length
          currentOffset = shows.length + preloadedShows.length
        }
      }
      
      const effectiveSortBy = overrideSortBy || sortBy
      
      // For "by_rating" sort, we need all shows for proper grouping - but only on first load
      const adjustedLimit = (effectiveSortBy === 'by_rating' && currentOffset === 0) ? 1000 : limit
      
      const options = {
        limit: adjustedLimit,
        offset: currentOffset,
        showInDiscovery: view === 'discover',
        excludeUserShows: view === 'discover' && !!user,
        userId: user?.id
      }
      
      console.log(`🔍 [useShows] Fetch options:`, {
        view, effectiveSortBy, limit: adjustedLimit, offset: currentOffset, isPreload
      })

      if (view === 'discover') {
        result = await fetchShows({
          ...options,
          sortBy: effectiveSortBy,
          showInDiscovery: true,
          excludeUserShows: !!user,
          genreIds: filters.selectedGenres.length > 0 ? filters.selectedGenres : undefined,
          yearRange: filters.yearRange,
          streamerIds: filters.selectedStreamers.length > 0 ? filters.selectedStreamers : undefined
          // Removed the search parameter - genre filtering is handled by genreIds
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
          setShows(dedupeByImdb(result.shows))
          setPreloadedShows([]) // Clear preloaded shows on reset
          
          // Aggressively preload images for initial batch with high priority
          if (result.shows.length > 0) {
            console.log(`🔍 [useShows] Starting aggressive image preloading for ${result.shows.length} initial shows`)
            preloadShowImages(result.shows).catch(error => {
              console.warn('🔍 [useShows] Image preloading failed for initial batch:', error)
            })
            
            // Also immediately start preloading the next batch in the background
            // Use shorter delay for new_seasons view since cards load faster
            const preloadDelay = view === 'new_seasons' ? 200 : 500
            setTimeout(() => {
              console.log('🔍 [useShows] Starting background preload for next batch')
              fetchShowsData(false, undefined, true).catch(error => {
                console.warn('🔍 [useShows] Background preload failed:', error)
              })
            }, preloadDelay)
          }
          
          // Update server offset for discover view
          if (view === 'discover' && (result as any).nextOffset !== undefined) {
            setServerOffset((result as any).nextOffset)
          }
        } else if (isPreload) {
          // Store preloaded shows separately and immediately start preloading images
          console.log(`🔍 [useShows] Preloaded ${result.shows.length} shows`)
          setPreloadedShows(result.shows)
          
          // Immediately and aggressively preload images for the preloaded shows
          if (result.shows.length > 0) {
            console.log(`🔍 [useShows] Starting immediate image preloading for ${result.shows.length} preloaded shows`)
            // Use setTimeout with 0 delay to ensure it doesn't block the UI
            setTimeout(() => {
              preloadShowImages(result.shows).catch(error => {
                console.warn('🔍 [useShows] Image preloading failed for preloaded batch:', error)
              })
            }, 0)
          }
          
          // Track next offset and hasMore for the preloaded batch
          if (view === 'discover') {
            setPreloadedNextOffset((result as any).nextOffset ?? null)
            setPreloadedHasMore((result as any).hasMore ?? null)
          }
        } else {
          // Use preloaded shows if available, otherwise use fetched shows
          let newShows: ShowWithGenres[]
          
          if (preloadedShows.length > 0) {
            console.log(`🔍 [useShows] Using ${preloadedShows.length} preloaded shows`)
            newShows = preloadedShows
            setPreloadedShows([]) // Clear used preloaded shows
            // Advance server offset using preloaded metadata
            if (view === 'discover') {
              if (preloadedNextOffset != null) {
                setServerOffset(preloadedNextOffset)
                setPreloadedNextOffset(null)
              } else if ((result as any).nextOffset !== undefined) {
                setServerOffset((result as any).nextOffset)
              }
            }
          } else {
            // Use fetched shows directly
            newShows = result.shows
            console.log(`🔍 [useShows] Adding ${newShows.length} new shows`)
            if (view === 'discover' && (result as any).nextOffset !== undefined) {
              setServerOffset((result as any).nextOffset)
            }
          }
          
          setShows(prev => dedupeByImdb([...prev, ...newShows]))
        }
        
        // Simplified hasMore logic
        if (view === 'discover' && (result as any).hasMore !== undefined) {
          setHasMore((result as any).hasMore)
          console.log('🔍 [useShows] Using hasMore from fetchShows result:', (result as any).hasMore)
        } else {
          // For other views - check if we got fewer shows than requested
          const hasMoreShows = result.shows.length === (adjustedLimit === 1000 ? limit : adjustedLimit)
          setHasMore(hasMoreShows)
          console.log('🔍 [useShows] Fallback hasMore logic:', hasMoreShows, 'got', result.shows.length, 'expected', adjustedLimit === 1000 ? limit : adjustedLimit)
        }
      }
    } catch (err) {
      console.error('Error fetching shows:', err)
      setError(err)
      setShows([])
      setHasMore(false)
    } finally {
      if (isPreload) {
        setIsPreloading(false)
      } else {
        setLoading(false)
      }
    }
  }, [view, user, loading, limit, serverOffset, sortBy, shows, preloadedShows, preloadedNextOffset, filters.selectedGenres, filters.yearRange, filters.selectedStreamers, filterContext])

  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return

    // If we already preloaded next batch, consume it without fetching
    if (preloadedShows.length > 0) {
      console.log(`🔍 [useShows] Using ${preloadedShows.length} preloaded shows for ${view}`)
      setShows(prev => dedupeByImdb([...prev, ...preloadedShows]))
      setPreloadedShows([])
      
      if (view === 'discover') {
        if (preloadedNextOffset != null) {
          setServerOffset(preloadedNextOffset)
          setPreloadedNextOffset(null)
        }
        if (preloadedHasMore != null) {
          setHasMore(preloadedHasMore)
          setPreloadedHasMore(null)
        }
      }
      
      // Immediately start preloading the next batch after consuming preloaded shows
      setTimeout(() => {
        console.log('🔍 [useShows] Starting next preload after consuming previous batch')
        fetchShowsData(false, undefined, true).catch(error => {
          console.warn('🔍 [useShows] Next batch preload failed:', error)
        })
      }, 100)
      
      return
    }

    await fetchShowsData(false)
  }, [hasMore, loading, view, preloadedShows.length, preloadedNextOffset, preloadedHasMore, fetchShowsData])

  // Background preloading function
  const preloadNext = useCallback(async () => {
    if (!hasMore || loading || isPreloading || preloadedShows.length > 0) return
    
    console.log('🔍 [useShows] Starting background preload')
    await fetchShowsData(false, undefined, true)
  }, [hasMore, loading, isPreloading, preloadedShows.length, fetchShowsData])

  const refresh = useCallback(async () => {
    setServerOffset(0)
    await fetchShowsData(true)
  }, [fetchShowsData])


  const handleShowAction = useCallback(async (show: ShowWithGenres, status: ShowStatus) => {
    console.log('🔄 [useShows] handleShowAction called for:', show.name, 'status:', status, 'view:', view)
    
    if (!user) {
      console.log('❌ [useShows] No user, cannot update show status')
      return
    }
    
    if (loading) {
      console.log('⏳ [useShows] Already loading, skipping action')
      return
    }
    
    try {
      // Remove show from local state immediately for smooth UX
      console.log('🔄 [useShows] Removing show locally immediately')
      setShows(prev => prev.filter(s => s.imdb_id !== show.imdb_id))
      
      // Import and call the database update function
      const { updateUserShowStatus } = await import('@/lib/shows')
      
      console.log('🔄 [useShows] Updating database for:', show.name)
      const result = await updateUserShowStatus(user.id, show.imdb_id, status)
      
      if (result.error) {
        console.error('❌ [useShows] Database update failed:', result.error)
        return
      }
      
      console.log('✅ [useShows] Database updated successfully for:', show.name)
      
      // Wait a bit then refresh counters
      setTimeout(async () => {
        console.log('🔄 [useShows] Delayed counter refresh')
        await refreshCounters()
      }, 1000)
      
      console.log('✅ [useShows] handleShowAction completed for:', show.name)
    } catch (error) {
      console.error('❌ [useShows] Error in handleShowAction:', error)
    }
  }, [user, view, refreshCounters, loading])

  // Extract complex expressions for dependency array
  const selectedGenresKey = filters.selectedGenres.join(',')
  const yearRangeKey = filters.yearRange.join(',')
  const selectedStreamersKey = filters.selectedStreamers.join(',')

  // Consolidated effect for all data fetching triggers
  useEffect(() => {
    if (autoFetch) {
      setServerOffset(0)
      
      // For discover view with filters, coordinate with FilterContext
      if (view === 'discover' && filterContext) {
        filterContext.setIsApplyingFilters(true)
      }
      
      fetchShowsData(true).finally(() => {
        // Clear the applying filters state immediately when data is loaded
        if (view === 'discover' && filterContext) {
          filterContext.setIsApplyingFilters(false)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    view,
    user?.id,
    autoFetch,
    sortBy,
    // Only include filter dependencies for discover view to prevent infinite loops
    ...(view === 'discover' ? [selectedGenresKey, yearRangeKey, selectedStreamersKey] : [])
  ])

  // Separate effect for refresh trigger (skip discover view to prevent flicker)
  useEffect(() => {
    if (user && refreshTrigger > 0 && view !== 'discover') {
      console.log(`🔄 [useShows] Refreshing ${view} view due to trigger:`, refreshTrigger)
      setServerOffset(0)
      fetchShowsData(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, user, view])

  // Handle sort change
  const handleSortChange = useCallback((newSort: SortOption) => {
    console.log('🔄 [useShows] Sort change requested:', newSort)
    setSortBy(newSort)
    setServerOffset(0)
    // Use a slight delay to ensure state updates are processed
    setTimeout(() => {
      fetchShowsData(true, newSort)
    }, 0)
  }, [fetchShowsData])

  return {
    shows,
    loading,
    error,
    hasMore,
    fetchMore,
    refresh,
    handleShowAction,
    sortBy,
    setSortBy: handleSortChange,
    preloadedShows,
    isPreloading,
    preloadNext
  }
}

// Helper hook for specific views
export function useDiscoverShows(limit?: number) {
  return useShows({
    view: 'discover',
    limit
  })
}

export function useWatchlistShows(limit?: number) {
  return useShows({
    view: 'watchlist',
    limit
  })
}

export function useLikedShows(limit?: number) {
  return useShows({
    view: 'liked_it',
    limit
  })
}

export function useLovedShows(limit?: number) {
  return useShows({
    view: 'loved_it',
    limit
  })
}

export function useAllRatedShows(limit?: number) {
  return useShows({
    view: 'all_rated',
    limit
  })
}

export function useNewSeasonsShows(limit?: number) {
  return useShows({
    view: 'new_seasons',
    limit
  })
}
