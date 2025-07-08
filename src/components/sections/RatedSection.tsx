'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useAllRatedShows } from '@/hooks/useShows'
import ShowsList from '@/components/shows/ShowsList'
import SortSelector from '@/components/ui/SortSelector'
import { useAuth } from '@/contexts/AuthContext'
import { ShowWithGenres } from '@/lib/shows'

const RATED_SORT_OPTIONS = [
  { value: 'recently_added' as const, label: 'Recently Added' },
  { value: 'by_rating' as const, label: 'By Rating' }
]

export function RatedSection() {
  const { user } = useAuth()
  const { shows, loading, error, hasMore, fetchMore, handleShowAction, sortBy, setSortBy } = useAllRatedShows(20)
  const observerRef = useRef<HTMLDivElement>(null)

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
          <h3 className="text-lg font-semibold mb-3">Sign in to view your ratings</h3>
          <p className="text-sm text-gray-600">
            Create an account to rate shows and movies and see your ratings here.
          </p>
        </div>
      ) : (
        <>
          {/* Sort Selector */}
          {shows.length > 0 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {shows.length} rated show{shows.length === 1 ? '' : 's'}
              </div>
              <SortSelector
                value={sortBy}
                onChange={setSortBy}
                options={RATED_SORT_OPTIONS}
              />
            </div>
          )}

          {/* Content */}
          <ShowsList
            shows={shows}
            loading={loading}
            error={error}
            onShowAction={handleShowAction}
            emptyMessage="You haven't rated any shows yet. Start rating in Discover!"
          />

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div ref={observerRef} className="text-center py-8">
              {loading && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}