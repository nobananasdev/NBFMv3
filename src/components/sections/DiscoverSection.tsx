'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useDiscoverShows, SortOption } from '@/hooks/useShows'
import ShowsList from '@/components/shows/ShowsList'
import FilterSidebar from '@/components/ui/FilterSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { FilterProvider, useFilter } from '@/contexts/FilterContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { fetchFilterOptions, searchShowsDatabase, fetchShowByImdbId, ShowWithGenres } from '@/lib/shows'
import SearchPanel from '@/components/ui/SearchPanel'

const DISCOVER_SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'rating', label: 'Top rated first' },
  { value: 'latest', label: 'Newest first' }
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
  const { setFilterOptions, isApplyingFilters, toggleFilter, hasActiveFilters, isFilterOpen, closeFilter } = useFilter()
  const observerRef = useRef<HTMLDivElement>(null)
  const preloadObserverRef = useRef<HTMLDivElement>(null)

  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false)
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ShowWithGenres[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<any>(null)
  const [searchHasMore, setSearchHasMore] = useState<boolean>(false)
  const [searchOffset, setSearchOffset] = useState<number>(0)
  const [searchSortBy, setSearchSortBy] = useState<SortOption>('latest')

  useEffect(() => {
    const loadFilterOptions = async () => {
      const result = await fetchFilterOptions()
      if (!result.error) {
        setFilterOptions(result.options)
      }
    }
    loadFilterOptions()
  }, [setFilterOptions])

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
        excludeUserShows: false,
        userId: user?.id,
        sortBy: newSort === 'rating' ? 'by_rating' : newSort
      })
      if (result.error) {
        setSearchError(result.error)
      } else {
        setSearchResults(result.shows)
        setSearchHasMore(result.hasMore)
        setSearchOffset(result.nextOffset ?? 0)
      }
    } finally {
      setSearchLoading(false)
    }
  }, [isSearchActive, searchQuery, user])

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
        const result = await fetchShowByImdbId(imdbId, user?.id)
        if (result.error) {
          setSearchError(result.error)
        } else if (result.show) {
          setSearchResults([result.show])
        }
        setSearchLoading(false)
        return
      }

      const result = await searchShowsDatabase({
        query: q,
        limit: 20,
        offset: 0,
        excludeUserShows: false,
        userId: user?.id,
        sortBy: searchSortBy === 'rating' ? 'by_rating' : searchSortBy
      })

      if (result.error) {
        setSearchError(result.error)
      } else {
        setSearchResults(result.shows)
        setSearchHasMore(result.hasMore)
        setSearchOffset(result.nextOffset ?? 0)
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

  const handleFilterToggle = useCallback(() => {
    if (isSearchPanelOpen) {
      setIsSearchPanelOpen(false)
    }
    if (isSearchActive) {
      clearSearch()
    }
    toggleFilter()
  }, [isSearchPanelOpen, isSearchActive, clearSearch, toggleFilter])

  useEffect(() => {
    if (discoverResetTrigger > 0 && isSearchActive) {
      clearSearch()
    }
  }, [discoverResetTrigger, isSearchActive, clearSearch])

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries
    if (!target.isIntersecting) return

    if (isSearchActive) {
      if (searchHasMore && !searchLoading) {
        setSearchLoading(true)
        ;(async () => {
          const result = await searchShowsDatabase({
            query: searchQuery,
            limit: 20,
            offset: searchOffset,
            excludeUserShows: false,
            userId: user?.id,
            sortBy: searchSortBy === 'rating' ? 'by_rating' : searchSortBy
          })
          if (!result.error) {
            setSearchResults(prev => [...prev, ...result.shows])
            setSearchHasMore(result.hasMore)
            setSearchOffset(result.nextOffset ?? searchOffset)
          }
          setSearchLoading(false)
        })()
      }
    } else if (hasMore && !loading) {
      fetchMore()
    }
  }, [isSearchActive, searchHasMore, searchLoading, searchQuery, searchOffset, user, searchSortBy, hasMore, loading, fetchMore])

  useEffect(() => {
    const element = observerRef.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px'
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [handleObserver])

  useEffect(() => {
    const element = preloadObserverRef.current
    if (!element) return

    const observer = new IntersectionObserver(entries => {
      const [target] = entries
      if (target.isIntersecting && hasMore && !loading && !isSearchActive && !isPreloading) {
        preloadNext()
      }
    }, {
      threshold: 0.1,
      rootMargin: '800px'
    })

    if (!isSearchActive) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, isPreloading, preloadNext, isSearchActive])

  const effectiveShows = isSearchActive ? searchResults : shows
  const effectiveLoading = isSearchActive ? searchLoading : loading
  const effectiveError = isSearchActive ? searchError : error
  const effectiveHasMore = isSearchActive ? searchHasMore : hasMore

  const showLoadingState = effectiveLoading && effectiveShows.length === 0
  const showInlineLoading = (isApplyingFilters || (effectiveLoading && effectiveShows.length > 0)) && !isSearchActive

  const [debouncedInlineLoading, setDebouncedInlineLoading] = useState(false)
  useEffect(() => {
    if (showInlineLoading) {
      const t = setTimeout(() => setDebouncedInlineLoading(true), 220)
      return () => clearTimeout(t)
    }
    setDebouncedInlineLoading(false)
  }, [showInlineLoading])

  const listContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = listContainerRef.current
    if (!el) return
    if (debouncedInlineLoading) {
      const h = el.clientHeight
      if (h > 0) el.style.minHeight = `${h}px`
    } else {
      el.style.minHeight = ''
    }
  }, [debouncedInlineLoading])

  const scrollToShows = useCallback(() => {
    const el = listContainerRef.current
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handleSortChange = useCallback((newSort: SortOption) => {
    if (isSearchActive) {
      void handleSearchSortChange(newSort)
    } else {
      setSortBy(newSort)
    }
  }, [isSearchActive, handleSearchSortChange, setSortBy])

  const currentSort = isSearchActive ? searchSortBy : sortBy
  const isSearchHighlighted = isSearchPanelOpen || isSearchActive
  const isFilterHighlighted = hasActiveFilters || isFilterOpen
  const handleSearchToggle = useCallback(() => {
    setIsSearchPanelOpen(prev => {
      const next = !prev
      if (!prev) {
        closeFilter()
      }
      return next
    })
  }, [closeFilter])

  return (
    <>
      <section className="hero-section">
        <div className="hero-inner">
          <h1 className="hero-headline">
            <span>NO BANANAS</span>
            <span>JUST EVERY SHOW</span>
            <span>ON EARTH</span>
          </h1>
          <p className="hero-subtitle">From global streamers to hidden gems worldwide.</p>
          <div className="flex flex-col items-center gap-3">
            <button type="button" onClick={scrollToShows} className="hero-scroll-btn" aria-label="Scroll to shows">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0-6-6m6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <div className="space-y-8">
        <div className="space-y-3">
          <div className="discover-controls flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSearchToggle}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-200 ${
                  isSearchHighlighted
                    ? 'bg-[var(--accent-primary)] text-black border-transparent shadow-[0_0_14px_rgba(245,180,0,0.6)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]'
                }`}
                aria-label="Open search"
                aria-pressed={isSearchHighlighted}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.2-5.2M9.75 17.5a7.75 7.75 0 1 1 0-15.5 7.75 7.75 0 0 1 0 15.5z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleFilterToggle}
                aria-label="Open filters"
                aria-expanded={isFilterOpen}
                aria-pressed={isFilterOpen}
                className={`relative flex h-11 items-center gap-2 rounded-full border px-5 text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.28em] transition-colors duration-200 ${
                  isFilterHighlighted
                    ? 'bg-white/10 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[0_0_18px_rgba(245,180,0,0.35)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-[var(--accent-primary)]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M6 12h12M10 19h4" />
                </svg>
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-[var(--accent-primary)] shadow-[0_0_12px_rgba(245,180,0,0.6)]" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {DISCOVER_SORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSortChange(option.value)}
                  className={`sort-toggle ${currentSort === option.value ? 'sort-toggle--active' : ''}`}
                  aria-pressed={currentSort === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[1.25rem] text-center text-xs sm:text-sm text-white/60">
            {debouncedInlineLoading && (
              <span className="inline-flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white/60" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V2C5.373 2 1 6.373 1 12h3zm2 5.291A7.962 7.962 0 014 12H1c0 3.042 1.135 5.824 3 7.938l2-2.647z" />
                </svg>
                <span>Loading filtered content...</span>
              </span>
            )}
          </div>
        </div>

        <SearchPanel
          isOpen={isSearchPanelOpen}
          onClose={() => setIsSearchPanelOpen(false)}
          onCommit={startSearch}
          inline
        />
        <FilterSidebar inline />

        {isSearchActive && (
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[var(--text-secondary)]">
            <span>
              Searching for: <span className="font-semibold text-[var(--text-primary)]">{searchQuery}</span>
            </span>
            <button onClick={clearSearch} className="action-button text-xs sm:text-sm uppercase tracking-[0.2em]">
              Clear search
            </button>
          </div>
        )}

        <div ref={listContainerRef}>
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

        {!isSearchActive && hasMore && shows.length > 5 && (
          <div
            ref={preloadObserverRef}
            className="h-1 w-full opacity-0 pointer-events-none"
            style={{ position: 'absolute', bottom: '60vh' }}
          />
        )}

        {effectiveHasMore && (
          <div ref={observerRef} className="text-center py-8">
            {effectiveLoading && (
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                <div className="text-sm text-white/60">Loading more {isSearchActive ? 'results' : 'shows'}...</div>
              </div>
            )}
            {!effectiveLoading && !isSearchActive && isPreloading && (
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-pulse h-2 w-32 bg-yellow-300/60 rounded"></div>
                <div className="text-xs text-white/50">Preparing next shows...</div>
              </div>
            )}
          </div>
        )}

        {!hasMore && !loading && shows.length > 0 && (
          <div className="text-center py-8">
            <div className="text-white/70 text-lg font-medium mb-2">
              That&apos;s it folks! 🎬
            </div>
            <p className="text-white/50">Come back soon - new great shows are added daily</p>
          </div>
        )}
      </div>
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
