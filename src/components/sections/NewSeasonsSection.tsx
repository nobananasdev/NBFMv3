'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useNewSeasonsShows } from '@/hooks/useShows'
import NewSeasonsList from '@/components/shows/NewSeasonsList'
import { useAuth } from '@/contexts/AuthContext'

export function NewSeasonsSection() {
  const { user } = useAuth()
  const { shows, loading, error, hasMore, fetchMore } = useNewSeasonsShows(20)
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
          <h3 className="text-lg font-semibold mb-3">Sign in to see new seasons</h3>
          <p className="text-sm text-gray-600">
            Create an account and rate shows to get updates on new seasons.
          </p>
        </div>
      ) : (
        <>
          {/* Show count */}
          {shows.length > 0 && (
            <div className="text-sm text-gray-500 text-center">
              {shows.length} show{shows.length === 1 ? '' : 's'} with new seasons
            </div>
          )}

          <NewSeasonsList
            shows={shows}
            loading={loading}
            error={error}
            emptyMessage="No new seasons from shows you've rated as Loved It or Liked It"
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