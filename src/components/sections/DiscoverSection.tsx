'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useDiscoverShows, SortOption } from '@/hooks/useShows'
import ShowsList from '@/components/shows/ShowsList'
import SortSelector from '@/components/ui/SortSelector'
import FilterSidebar from '@/components/ui/FilterSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { FilterProvider, useFilter } from '@/contexts/FilterContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { fetchFilterOptions, searchShowsDatabase, fetchShowByImdbId, ShowWithGenres } from '@/lib/shows'
import SearchPanel from '@/components/ui/SearchPanel'

const DISCOVER_SORT_OPTIONS = [
  { value: 'latest' as const, label: 'Latest Shows' },
  { value: 'rating' as const, label: 'By Rating' }
]

function DiscoverContent() {
  const { user } = useAuth()
  const { discoverResetTrigger } = useNavigation()
  const {
    shows,
    loading,
    error,
    hasMore,
    fetchMore,
    handleShowAction,
    sortBy,
    setSortBy,
    preloadedShows,
    isPreloading,
    preloadNext
  } = useDiscoverShows(20)
  const { setFilterOptions, filters, isApplyingFilters } = useFilter()
  const observerRef = useRef<HTMLDivElement>(null)
  const preloadObserverRef = useRef<HTMLDivElement>(null)

  // Search UI state
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false)

  // Client-side search mode state
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ShowWithGenres[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<any>(null)
  const [searchHasMore, setSearchHasMore] = useState<boolean>(false)
  const [searchOffset, setSearchOffset] = useState<number>(0)
  const [searchSortBy, setSearchSortBy] = useState<SortOption>('latest')

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      console.log('🔍 [DiscoverSection] Loading filter options...')
      const result = await fetchFilterOptions()
      if (result.error) {
        console.error('❌ [DiscoverSection] Filter options error:', result.error)
      } else {
        console.log('✅ [DiscoverSection] Filter options loaded:', {
          genres: result.options.genres.length,
          streamers: result.options.streamers.length,
          yearRange: result.options.yearRange
        })
        setFilterOptions(result.options)
      }
    }
    loadFilterOptions()
  }, []) // Remove setFilterOptions from dependency array to prevent infinite loop

  // Debug info
  console.log('🎬 DiscoverSection render:', {
    shows: shows.length,
    preloadedShows: preloadedShows.length,
    loading,
    isPreloading,
    error: error?.message || error,
    user: !!user,
    isSearchActive,
    searchResults: searchResults.length,
    searchLoading,
    searchError: searchError?.message || searchError
  })

  // Preload trigger - starts loading next batch much earlier
  const handlePreloadObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      // Disable preloading during search mode
      if (isSearchActive) return
      if (target.isIntersecting && hasMore && !loading && !isPreloading) {
        console.log('🔍 [DiscoverSection] Preload trigger activated')
        preloadNext()
      }
    },
    [isSearchActive, hasMore, loading, isPreloading, preloadNext]
  )

  // Infinite scroll implementation - switches to search paging when active
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting) {
        if (isSearchActive) {
          if (searchHasMore && !searchLoading) {
            console.log('🔍 [DiscoverSection] Infinite scroll trigger (search) activated')
            ;(async () => {
              setSearchLoading(true)
              try {
                const result = await searchShowsDatabase({
                  query: searchQuery,
                  limit: 20,
                  offset: searchOffset,
                  excludeUserShows: !!user,
                  userId: user?.id,
                  sortBy: searchSortBy === 'rating' ? 'by_rating' : searchSortBy
                })
                if (result.error) {
                  setSearchError(result.error)
                  setSearchHasMore(false)
                } else {
                  setSearchResults(prev => {
                    const map = new Map(prev.map(s => [s.imdb_id, s]))
                    for (const s of result.shows) {
                      if (!map.has(s.imdb_id)) map.set(s.imdb_id, s)
                    }
                    return Array.from(map.values())
                  })
                  setSearchHasMore(result.hasMore)
                  setSearchOffset(result.nextOffset ?? searchOffset)
                }
              } finally {
                setSearchLoading(false)
              }
            })()
          }
        } else if (hasMore && !loading) {
          console.log('🔍 [DiscoverSection] Infinite scroll trigger activated')
          fetchMore()
        }
      }
    },
    [isSearchActive, searchHasMore, searchLoading, searchQuery, searchOffset, user, hasMore, loading, fetchMore]
  )

  // Preload observer - triggers much earlier (when user is about halfway through current content)
  useEffect(() => {
    const element = preloadObserverRef.current
    if (!element) return

    const observer = new IntersectionObserver(handlePreloadObserver, {
      threshold: 0.1,
      rootMargin: '800px' // Much larger margin for early preloading
    })

    if (!isSearchActive) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [handlePreloadObserver, isSearchActive])

  // Main infinite scroll observer - smaller margin since content should be preloaded
  useEffect(() => {
    const element = observerRef.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px' // Smaller margin since content is preloaded
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [handleObserver])


  // Start a new client-side search
  const startSearch = useCallback(async (q: string, imdbId?: string) => {
    setIsSearchActive(true)
    setSearchQuery(q)
    setSearchResults([])
    setSearchError(null)
    setSearchHasMore(false)
    setSearchOffset(0)
    setIsSearchPanelOpen(false)
    setSearchLoading(true)
    
    try {
      if (imdbId) {
        // Exact show selection - fetch specific show by IMDB ID
        console.log('🔍 [DiscoverSection] Fetching specific show:', imdbId)
        const result = await fetchShowByImdbId(imdbId, user?.id)
        if (result.error) {
          setSearchError(result.error)
          setSearchResults([])
          setSearchHasMore(false)
          setSearchOffset(0)
        } else if (result.show) {
          setSearchResults([result.show])
          setSearchHasMore(false) // Only one specific show
          setSearchOffset(0)
        } else {
          setSearchError(new Error('Show not found'))
          setSearchResults([])
          setSearchHasMore(false)
          setSearchOffset(0)
        }
      } else {
        // General search - use database search
        console.log('🔍 [DiscoverSection] Performing general search:', q)
        const result = await searchShowsDatabase({
          query: q,
          limit: 20,
          offset: 0,
          excludeUserShows: !!user,
          userId: user?.id,
          sortBy: searchSortBy === 'rating' ? 'by_rating' : searchSortBy
        })
        if (result.error) {
          setSearchError(result.error)
          setSearchResults([])
          setSearchHasMore(false)
          setSearchOffset(0)
        } else {
          setSearchResults(result.shows)
          setSearchHasMore(result.hasMore)
          setSearchOffset(result.nextOffset ?? 0)
        }
      }
    } finally {
      setSearchLoading(false)
    }
  }, [user, searchSortBy])

  const clearSearch = useCallback(() => {
    setIsSearchActive(false)
    setSearchQuery('')
    setSearchResults([])
    setSearchError(null)
    setSearchHasMore(false)
    setSearchOffset(0)
    setSearchSortBy('latest')
  }, [])

  // Clear search when discovery navigation is clicked again
  useEffect(() => {
    if (discoverResetTrigger > 0 && isSearchActive) {
      console.log('🔍 [DiscoverSection] Clearing search due to discovery nav click')
      clearSearch()
    }
  }, [discoverResetTrigger, isSearchActive, clearSearch])

  // Handle search sort change - restart search with new sorting
  const handleSearchSortChange = useCallback(async (newSort: SortOption) => {
    if (!isSearchActive || !searchQuery) return
    
    setSearchSortBy(newSort)
    setSearchResults([])
    setSearchError(null)
    setSearchHasMore(false)
    setSearchOffset(0)
    setSearchLoading(true)
    
    try {
      const result = await searchShowsDatabase({
        query: searchQuery,
        limit: 20,
        offset: 0,
        excludeUserShows: !!user,
        userId: user?.id,
        sortBy: newSort === 'rating' ? 'by_rating' : newSort
      })
      
      if (result.error) {
        setSearchError(result.error)
        setSearchResults([])
        setSearchHasMore(false)
        setSearchOffset(0)
      } else {
        setSearchResults(result.shows)
        setSearchHasMore(result.hasMore)
        setSearchOffset(result.nextOffset ?? 0)
      }
    } finally {
      setSearchLoading(false)
    }
  }, [isSearchActive, searchQuery, user])

  // Effective values for UI - keep existing shows visible during filter application
  const effectiveShows = isSearchActive ? searchResults : shows
  const effectiveLoading = isSearchActive ? searchLoading : loading
  const effectiveError = isSearchActive ? searchError : error
  const effectiveHasMore = isSearchActive ? searchHasMore : hasMore
  
  // Show loading state only when no content exists or during initial load
  const showLoadingState = effectiveLoading && effectiveShows.length === 0
  // Show inline loading indicator when applying filters with existing content
  const showInlineLoading = (isApplyingFilters || (effectiveLoading && effectiveShows.length > 0)) && !isSearchActive

  return (
    <>
      <div className="relative space-y-6">
        {/* Controls row: count + Search + Sort/Filter */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {effectiveShows.length > 0 && !showInlineLoading &&
              `${effectiveShows.length} ${isSearchActive ? 'result' : 'show'}${effectiveShows.length === 1 ? '' : 's'}`}
            {showInlineLoading && (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading filtered content...</span>
              </span>
            )}
          </div>
          <div className="flex gap-2 sm:gap-4">
            {/* Search pill (same style as Sort pills) */}
            <button
              onClick={() => setIsSearchPanelOpen(true)}
              className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl sm:rounded-3xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0 ${
                isSearchActive
                  ? 'bg-[#3a3a3a] hover:bg-[#3a3a3a] border-0 shadow-md'
                  : 'bg-[#FFFCF5] hover:bg-gray-50 border border-[#696969] shadow-sm hover:shadow-md'
              }`}
              aria-label="Open search"
            >
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 ${isSearchActive ? 'text-white' : 'text-black'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <SortSelector
              value={isSearchActive ? searchSortBy : sortBy}
              onChange={isSearchActive ? handleSearchSortChange : setSortBy}
              options={DISCOVER_SORT_OPTIONS}
              showFilter={true}
            />
          </div>
        </div>

        {/* Inline Search Panel */}
        <SearchPanel
          isOpen={isSearchPanelOpen}
          onClose={() => setIsSearchPanelOpen(false)}
          onCommit={startSearch}
          inline={true}
        />

        {/* Active search chip */}
        {isSearchActive && (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600">
              Searching for: <span className="font-semibold text-gray-900">{searchQuery}</span>
            </span>
            <button
              onClick={clearSearch}
              className="text-xs sm:text-sm px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-50"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Shows list with smooth transition during filter application */}
        <div className={`transition-opacity duration-200 ${showInlineLoading ? 'opacity-40' : 'opacity-100'}`}>
          <ShowsList
            shows={effectiveShows}
            loading={showLoadingState}
            error={effectiveError}
            onShowAction={handleShowAction}
            emptyMessage={
              isSearchActive
                ? 'No results found. Try another search term.'
                : user
                ? 'No new shows to discover right now. Check back later!'
                : 'Sign in to get personalized recommendations and discover new shows!'
            }
            preloadedShows={!isSearchActive ? preloadedShows : []}
            onNearEnd={!isSearchActive ? preloadNext : undefined}
            hasMore={effectiveHasMore}
            searchQuery={isSearchActive ? searchQuery : undefined}
          />
        </div>

        {/* Preload Trigger - positioned earlier in the content (disabled in search mode) */}
        {!isSearchActive && hasMore && shows.length > 5 && (
          <div
            ref={preloadObserverRef}
            className="h-1 w-full opacity-0 pointer-events-none"
            style={{
              position: 'absolute',
              bottom: '60vh' // Position this trigger well before the end
            }}
          />
        )}

        {/* Infinite Scroll Trigger */}
        {effectiveHasMore && (
          <div ref={observerRef} className="text-center py-8">
            {effectiveLoading && (
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div className="text-sm text-gray-500">Loading more {isSearchActive ? 'results' : 'shows'}...</div>
              </div>
            )}
            {!effectiveLoading && !isSearchActive && isPreloading && (
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-pulse h-2 w-32 bg-blue-200 rounded"></div>
                <div className="text-xs text-gray-400">Preparing next shows...</div>
              </div>
            )}
            {!effectiveLoading && !isSearchActive && preloadedShows.length > 0 && (
              <div className="flex flex-col items-center space-y-3">
                <div className="h-2 w-32 bg-green-200 rounded"></div>
                <div className="text-xs text-green-600">Next shows ready!</div>
              </div>
            )}
          </div>
        )}

        {/* End State */}
        {!hasMore && !loading && shows.length > 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg font-medium mb-2">
              That&apos;s it folks! 🎬
            </div>
            <p className="text-gray-400">
              Come back soon - new great shows are added daily
            </p>
          </div>
        )}
      </div>
      
      {/* Filter Sidebar */}
      <FilterSidebar />
    </>
  )
}

export function DiscoverSection() {
  return (
    <FilterProvider>
      <DiscoverContent />
    </FilterProvider>
  )
}
