'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useDiscoverShows } from '@/hooks/useShows'
import ShowsList from '@/components/shows/ShowsList'
import SortSelector from '@/components/ui/SortSelector'
import FilterSidebar from '@/components/ui/FilterSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { FilterProvider, useFilter } from '@/contexts/FilterContext'
import { fetchFilterOptions } from '@/lib/shows'

const DISCOVER_SORT_OPTIONS = [
  { value: 'latest' as const, label: 'Latest Shows' },
  { value: 'rating' as const, label: 'By Rating' }
]

function DiscoverContent() {
  const { user } = useAuth()
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
  const { setFilterOptions } = useFilter()
  const observerRef = useRef<HTMLDivElement>(null)
  const preloadObserverRef = useRef<HTMLDivElement>(null)

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const result = await fetchFilterOptions()
      if (!result.error) {
        setFilterOptions(result.options)
      }
    }
    loadFilterOptions()
  }, [setFilterOptions])

  // Debug info
  console.log('🎬 DiscoverSection render:', {
    shows: shows.length,
    preloadedShows: preloadedShows.length,
    loading,
    isPreloading,
    error: error?.message || error,
    user: !!user
  })

  // Preload trigger - starts loading next batch much earlier
  const handlePreloadObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && hasMore && !loading && !isPreloading) {
        console.log('🔍 [DiscoverSection] Preload trigger activated')
        preloadNext()
      }
    },
    [hasMore, loading, isPreloading, preloadNext]
  )

  // Infinite scroll implementation - now uses preloaded content
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && hasMore && !loading) {
        console.log('🔍 [DiscoverSection] Infinite scroll trigger activated')
        fetchMore()
      }
    },
    [hasMore, loading, fetchMore]
  )

  // Preload observer - triggers much earlier (when user is about halfway through current content)
  useEffect(() => {
    const element = preloadObserverRef.current
    if (!element) return

    const observer = new IntersectionObserver(handlePreloadObserver, {
      threshold: 0.1,
      rootMargin: '800px' // Much larger margin for early preloading
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [handlePreloadObserver])

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


  return (
    <>
      <div className="space-y-6">
        {/* Sort Selector */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {shows.length > 0 && `${shows.length} show${shows.length === 1 ? '' : 's'}`}
          </div>
          <SortSelector
            value={sortBy}
            onChange={setSortBy}
            options={DISCOVER_SORT_OPTIONS}
            showFilter={true}
          />
        </div>
        
        <ShowsList
          shows={shows}
          loading={loading}
          error={error}
          onShowAction={handleShowAction}
          emptyMessage={
            user
              ? "No new shows to discover right now. Check back later!"
              : "Sign in to get personalized recommendations and discover new shows!"
          }
        />

        {/* Preload Trigger - positioned earlier in the content */}
        {hasMore && shows.length > 5 && (
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
        {hasMore && (
          <div ref={observerRef} className="text-center py-8">
            {loading && (
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div className="text-sm text-gray-500">Loading more shows...</div>
              </div>
            )}
            {!loading && isPreloading && (
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-pulse h-2 w-32 bg-blue-200 rounded"></div>
                <div className="text-xs text-gray-400">Preparing next shows...</div>
              </div>
            )}
            {!loading && !isPreloading && preloadedShows.length > 0 && (
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
