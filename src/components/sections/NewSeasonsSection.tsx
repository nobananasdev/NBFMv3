'use client'

import { useCallback } from 'react'
import { useNewSeasonsShows } from '@/hooks/useShows'
import NewSeasonsList from '@/components/shows/NewSeasonsList'
import { useAuth } from '@/contexts/AuthContext'

export function NewSeasonsSection() {
  const { user } = useAuth()
  const {
    shows,
    loading,
    error,
    hasMore,
    fetchMore,
    preloadedShows,
    isPreloading,
    preloadNext
  } = useNewSeasonsShows(20)

  // Combined handler for near-end detection
  const handleNearEnd = useCallback(() => {
    if (!hasMore || loading || isPreloading) return
    
    console.log('🔄 [NewSeasonsSection] Near end detected, triggering preload')
    
    // If we have preloaded shows, fetch more immediately
    if (preloadedShows.length > 0) {
      fetchMore()
    } else {
      // Otherwise, start preloading
      preloadNext()
    }
  }, [hasMore, loading, isPreloading, preloadedShows.length, fetchMore, preloadNext])

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
            preloadedShows={preloadedShows}
            onNearEnd={handleNearEnd}
            hasMore={hasMore}
          />

          {/* Loading indicator at the bottom */}
          {hasMore && shows.length > 0 && (
            <div className="text-center py-8">
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
            </div>
          )}
        </>
      )}
    </div>
  )
}