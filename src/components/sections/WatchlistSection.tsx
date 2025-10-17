'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useWatchlistShows } from '@/hooks/useShows'
import ShowsList from '@/components/shows/ShowsList'
import SortSelector from '@/components/ui/SortSelector'
import { useAuth } from '@/contexts/AuthContext'

const WATCHLIST_SORT_OPTIONS = [
  { value: 'recently_added' as const, label: 'Recently Added' },
  { value: 'best_rated' as const, label: 'Best Rated' }
]

export function WatchlistSection() {
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
  } = useWatchlistShows(20)
  const observerRef = useRef<HTMLDivElement>(null)
  const preloadObserverRef = useRef<HTMLDivElement>(null)

  // Preload trigger - starts loading next batch much earlier
  const handlePreloadObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && hasMore && !loading && !isPreloading) {
        preloadNext()
      }
    },
    [hasMore, loading, isPreloading, preloadNext]
  )

  // Infinite scroll implementation
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && hasMore && !loading) {
        fetchMore()
      }
    },
    [hasMore, loading, fetchMore]
  )

  // Preload observer
  useEffect(() => {
    const element = preloadObserverRef.current
    if (!element) return

    const observer = new IntersectionObserver(handlePreloadObserver, {
      threshold: 0.1,
      rootMargin: '600px'
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [handlePreloadObserver])

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

  return (
    <div className="space-y-6">
      {!user ? (
        <div className="card p-6 text-center">
          <h3 className="text-lg font-semibold mb-3">Sign in to view your watchlist</h3>
          <p className="text-sm text-gray-600">
            Create an account to save shows and movies to your personal watchlist.
          </p>
        </div>
      ) : (
        <>
          {/* Controls: on mobile show Sort first and count below; desktop keeps one row */}
          {shows.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
              <div className="order-1 sm:order-1 w-full sm:w-auto">
                <SortSelector
                  value={sortBy}
                  onChange={setSortBy}
                  options={WATCHLIST_SORT_OPTIONS}
                  className="w-full sm:w-auto"
                  theme="watchlist"
                  variant="toggle"
                  mobileEqualWidth={false}
                />
              </div>
              <div className="order-2 sm:order-1 text-xs sm:text-sm text-gray-500">
                {shows.length} show{shows.length === 1 ? '' : 's'} in your watchlist
              </div>
            </div>
          )}

          <ShowsList
            shows={shows}
            loading={loading}
            error={error}
            onShowAction={handleShowAction}
            emptyMessage="Your watchlist is empty. Start adding shows from Discover!"
            hiddenActions={['watchlist']}
            preloadedShows={preloadedShows}
            onNearEnd={preloadNext}
            hasMore={hasMore}
          />

          {/* Preload Trigger */}
          {hasMore && shows.length > 10 && (
            <div
              ref={preloadObserverRef}
              className="h-1 w-full"
              style={{
                position: 'relative',
                top: '-30vh'
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
        </>
      )}
    </div>
  )
}
