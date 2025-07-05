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

  // Group shows by rating when sorted by rating
  const groupedShows = useMemo(() => {
    if (sortBy !== 'by_rating') {
      return { all: shows, loved: [], liked: [], notForMe: [] }
    }

    const loved = shows.filter(show => show.user_status === 'loved_it')
    const liked = shows.filter(show => show.user_status === 'liked_it')
    const notForMe = shows.filter(show => show.user_status === 'not_for_me')

    return { all: shows, loved, liked, notForMe }
  }, [shows, sortBy])

  const renderGroupedContent = () => {
    if (sortBy !== 'by_rating') {
      return (
        <ShowsList
          shows={shows}
          loading={loading}
          error={error}
          onShowAction={handleShowAction}
          emptyMessage="You haven't rated any shows yet. Start rating in Discover!"
        />
      )
    }

    return (
      <div className="space-y-8">
        {/* Loved It Group */}
        {groupedShows.loved && groupedShows.loved.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              ❤️ Loved It ({groupedShows.loved.length})
            </h3>
            <ShowsList
              shows={groupedShows.loved}
              loading={false}
              error={null}
              onShowAction={handleShowAction}
              emptyMessage=""
            />
          </div>
        )}

        {/* Liked It Group */}
        {groupedShows.liked && groupedShows.liked.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              👍 Liked It ({groupedShows.liked.length})
            </h3>
            <ShowsList
              shows={groupedShows.liked}
              loading={false}
              error={null}
              onShowAction={handleShowAction}
              emptyMessage=""
            />
          </div>
        )}

        {/* Not For Me Group */}
        {groupedShows.notForMe && groupedShows.notForMe.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🚫 Not For Me ({groupedShows.notForMe.length})
            </h3>
            <ShowsList
              shows={groupedShows.notForMe}
              loading={false}
              error={null}
              onShowAction={handleShowAction}
              emptyMessage=""
            />
          </div>
        )}

        {/* Empty state for grouped view */}
        {(!groupedShows.loved || groupedShows.loved.length === 0) &&
         (!groupedShows.liked || groupedShows.liked.length === 0) &&
         (!groupedShows.notForMe || groupedShows.notForMe.length === 0) &&
         !loading && (
          <div className="card p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 7v11h6V7H9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No rated shows</h3>
            <p className="text-gray-600">
              You haven't rated any shows yet. Start rating in Discover!
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Rated
        </h2>
        <p className="text-gray-600">
          Shows and movies you&apos;ve rated
        </p>
      </div>
      
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
          {renderGroupedContent()}

          {/* Infinite Scroll Trigger */}
          {hasMore && sortBy !== 'by_rating' && (
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