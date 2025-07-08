'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useDiscoverShows } from '@/hooks/useShows'
import ShowsList from '@/components/shows/ShowsList'
import SortSelector from '@/components/ui/SortSelector'
import { useAuth } from '@/contexts/AuthContext'

const DISCOVER_SORT_OPTIONS = [
  { value: 'latest' as const, label: 'Latest Shows' },
  { value: 'rating' as const, label: 'By Rating' }
]

export function DiscoverSection() {
  const { user } = useAuth()
  const { shows, loading, error, hasMore, fetchMore, handleShowAction, sortBy, setSortBy } = useDiscoverShows(20)
  const observerRef = useRef<HTMLDivElement>(null)

  // Debug info
  console.log('🎬 DiscoverSection render:', {
    shows: shows.length,
    loading,
    error: error?.message || error,
    user: !!user
  })

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
      {/* Sort Selector */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {shows.length > 0 && `${shows.length} show${shows.length === 1 ? '' : 's'}`}
        </div>
        <SortSelector
          value={sortBy}
          onChange={setSortBy}
          options={DISCOVER_SORT_OPTIONS}
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

      {/* End State */}
      {!hasMore && !loading && shows.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg font-medium mb-2">
            That's it folks! 🎬
          </div>
          <p className="text-gray-400">
            Come back soon - new great shows are added daily
          </p>
        </div>
      )}
    </div>
  )
}