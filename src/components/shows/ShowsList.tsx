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
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="w-auto bg-[#FFFCF5] rounded-[12px] sm:rounded-[15px] border border-[#8e8e8e] p-3 sm:p-4 lg:p-6 relative" style={{ minHeight: '420px' }}>
              <div className="animate-pulse">
                {/* Main Content - Responsive Layout - matches ShowCard exactly */}
                <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6">
                  {/* Poster - matches ShowCard image dimensions */}
                  <div className="flex-shrink-0 self-center lg:self-start">
                    <div className="w-[160px] h-[230px] sm:w-[180px] sm:h-[260px] lg:w-[240px] lg:h-[320px] bg-gray-200 rounded-[15px] sm:rounded-[20px]"></div>
                  </div>
                  
                  {/* Content - matches ShowCard content structure */}
                  <div className="flex-1 flex flex-col justify-between text-center lg:text-left" style={{ minHeight: '320px' }}>
                    <div>
                      {/* Title and Year */}
                      <div className="mb-2 sm:mb-3 lg:mb-4 lg:pr-24">
                        <div className="h-8 sm:h-10 lg:h-12 bg-gray-200 rounded mb-1"></div>
                      </div>

                      {/* Genres and Series Info */}
                      <div className="mb-3 sm:mb-4 lg:mb-6">
                        <div className="h-4 sm:h-5 lg:h-6 bg-gray-200 rounded w-3/4"></div>
                      </div>

                      {/* Description */}
                      <div className="mb-3 sm:mb-4 lg:mb-6">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>

                      {/* Creators and Cast */}
                      <div className="mb-3 sm:mb-4 lg:mb-6">
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>

                      {/* Streaming Providers and IMDB */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 lg:gap-0 mb-4 sm:mb-6 lg:mb-8">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:gap-3 justify-center lg:justify-start">
                          <div className="h-8 w-20 bg-gray-200 rounded-[15px]"></div>
                          <div className="h-8 w-24 bg-gray-200 rounded-[15px]"></div>
                        </div>
                        <div className="h-8 w-16 bg-gray-200 rounded-[15px]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - matches ShowCard button area */}
                <div className="border-t border-[#8e8e8e] mt-4 sm:mt-6 mb-3 sm:mb-4 lg:mb-6"></div>
                <div className="flex flex-col items-center lg:flex-row lg:justify-between gap-3 sm:gap-4">
                  <div className="h-12 w-60 bg-gray-200 rounded-[15px]"></div>
                  <div className="flex gap-2 sm:gap-3 lg:gap-4">
                    <div className="h-12 w-24 bg-gray-200 rounded-[15px]"></div>
                    <div className="h-12 w-24 bg-gray-200 rounded-[15px]"></div>
                    <div className="h-12 w-24 bg-gray-200 rounded-[15px]"></div>
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
      <div className="grid grid-cols-1 gap-6">
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