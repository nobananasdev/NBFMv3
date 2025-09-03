'use client'

import React, { useEffect, useRef } from 'react'
import ShowCard from './ShowCard'
import { ShowWithGenres } from '@/lib/shows'
import { ShowStatus } from '@/types/database'
import { preloadShowImages, preloadShowImagesOptimized } from '@/lib/imagePreloader'

interface ShowsListProps {
  shows: ShowWithGenres[]
  loading?: boolean
  error?: any
  onShowAction?: (show: ShowWithGenres, status: ShowStatus) => void
  emptyMessage?: string
  className?: string
  hiddenActions?: ShowStatus[]
  showActions?: boolean
  searchQuery?: string
  preloadedShows?: ShowWithGenres[]
  onNearEnd?: () => void
  hasMore?: boolean
}

export default function ShowsList({
  shows,
  loading,
  error,
  onShowAction,
  emptyMessage = 'No shows found',
  className = '',
  hiddenActions = [],
  showActions = true,
  searchQuery,
  preloadedShows = [],
  onNearEnd,
  hasMore = false
}: ShowsListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleShowAction = (show: ShowWithGenres, status: ShowStatus) => {
    // Just call the parent callback - no animations, no local state
    onShowAction?.(show, status)
  }

  // Aggressive preload images for all current shows and upcoming shows
  useEffect(() => {
    if (shows.length > 0) {
      // First, preload first batch with very high priority
      const firstBatch = shows.slice(0, 3) // First 3 shows get highest priority
      console.log(`🎬 [ShowsList] Highest-priority preloading for ${firstBatch.length} immediate shows`)
      preloadShowImagesOptimized(firstBatch, 'high').catch(error => {
        console.warn('🎬 [ShowsList] Failed to preload immediate images:', error)
      })

      // Then preload next batch with high priority (almost immediately)
      if (shows.length > 3) {
        const secondBatch = shows.slice(3, 10) // Next 7 shows get high priority
        console.log(`🎬 [ShowsList] High-priority preloading for ${secondBatch.length} near-visible shows`)
        setTimeout(() => {
          preloadShowImagesOptimized(secondBatch, 'high').catch(error => {
            console.warn('🎬 [ShowsList] Failed to preload near-visible images:', error)
          })
        }, 100) // Very short delay to avoid blocking immediate loads
      }

      // Finally preload all remaining current shows with medium priority
      if (shows.length > 10) {
        const remainingShows = shows.slice(10)
        console.log(`🎬 [ShowsList] Medium-priority preloading for ${remainingShows.length} remaining shows`)
        setTimeout(() => {
          preloadShowImagesOptimized(remainingShows, 'low').catch(error => {
            console.warn('🎬 [ShowsList] Failed to preload remaining images:', error)
          })
        }, 200) // Short delay to prioritize more visible content
      }
    }
  }, [shows])

  // Aggressively preload images for upcoming shows when they become available
  useEffect(() => {
    if (preloadedShows.length > 0) {
      console.log(`🎬 [ShowsList] Aggressive background preloading for ${preloadedShows.length} upcoming shows`)
      // Start preloading upcoming shows much earlier with medium priority
      setTimeout(() => {
        preloadShowImagesOptimized(preloadedShows, 'low').catch(error => {
          console.warn('🎬 [ShowsList] Failed to preload upcoming images:', error)
        })
      }, 300) // Reduced delay from 1000ms to 300ms for faster background loading
    }
  }, [preloadedShows])

  // Set up intersection observer for infinite scrolling trigger
  useEffect(() => {
    if (!onNearEnd || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('🎬 [ShowsList] Near end of list, triggering preload')
            onNearEnd?.()
          }
        })
      },
      {
        rootMargin: '400px' // Trigger when 400px away from the end for earlier preloading
      }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [onNearEnd, hasMore])

  // Observe the last few items to trigger near-end callback
  useEffect(() => {
    if (!observerRef.current || shows.length < 3) return

    const lastItems = listRef.current?.querySelectorAll('.show-card-item')
    if (lastItems && lastItems.length >= 3) {
      // Observe the 3rd from last item
      const targetItem = lastItems[lastItems.length - 3]
      if (targetItem) {
        observerRef.current.observe(targetItem)
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [shows.length])

  // Virtualization removed to prevent layout jitter during filter changes

  // Conditional UI returned after hooks to comply with rules-of-hooks
  if (loading && shows.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="show-card-modern p-3 lg:p-5 relative" style={{ minHeight: '320px' }}>
              <div className="animate-pulse">
                {/* Main Content - Responsive Layout - matches ShowCard exactly */}
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                  {/* Poster - matches ShowCard image dimensions */}
                  <div className="flex-shrink-0 self-center lg:self-start">
                    <div className="w-[140px] h-[210px] sm:w-[160px] sm:h-[240px] lg:w-[200px] lg:h-[300px] skeleton rounded-3xl"></div>
                  </div>
                  
                  {/* Content - matches ShowCard content structure */}
                  <div className="flex-1 flex flex-col justify-between text-center lg:text-left min-h-[260px]">
                    <div className="space-y-2 lg:space-y-3">
                      {/* Title and Year */}
                      <div className="lg:pr-20">
                        <div className="h-8 sm:h-10 lg:h-12 skeleton rounded mb-2"></div>
                      </div>

                      {/* Genres and Series Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center lg:justify-start gap-2">
                        <div className="h-6 skeleton rounded w-3/4"></div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <div className="h-4 skeleton rounded"></div>
                        <div className="h-4 skeleton rounded"></div>
                        <div className="h-4 skeleton rounded w-3/4"></div>
                      </div>

                      {/* Creators and Cast */}
                      <div className="space-y-2">
                        <div className="h-4 skeleton rounded w-2/3"></div>
                        <div className="h-4 skeleton rounded w-3/4"></div>
                      </div>

                      {/* Streaming Providers and IMDB */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                          <div className="h-8 w-20 skeleton rounded-xl"></div>
                          <div className="h-8 w-24 skeleton rounded-xl"></div>
                        </div>
                        <div className="h-9 w-20 skeleton rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - matches ShowCard button area */}
                <div className="border-t border-white/20 mt-3 lg:mt-4 mb-4"></div>
                <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                  <div className="mx-auto lg:mx-0">
                    <div className="h-10 skeleton rounded-lg w-[200px]"></div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
                    <div className="h-9 w-24 skeleton rounded-lg"></div>
                    <div className="h-9 w-24 skeleton rounded-lg"></div>
                    <div className="h-9 w-24 skeleton rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="card p-6 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">
            We couldn&apos;t load the shows. Please try again later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (shows.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="card p-6 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 7v11h6V7H9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No shows found</h3>
          <p className="text-gray-600">
            {emptyMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`} ref={listRef}>
      <div className="grid grid-cols-1 gap-3">
        {shows.map((show, index) => (
          <div key={show.imdb_id} className="cv-auto show-card-item">
            <ShowCard
              show={show}
              onAction={handleShowAction}
              hiddenActions={hiddenActions}
              showActions={showActions}
              priority={index < 2} // Only first 2 cards get highest priority
              searchQuery={searchQuery}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
