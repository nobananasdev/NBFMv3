'use client'

import { useState, useEffect, useRef } from 'react'
import ShowCard from './ShowCard'
import { ShowWithGenres, formatSeasonInfo } from '@/lib/shows'
import type { ShowStatus } from '@/types/database'
import { preloadShowImagesOptimized } from '@/lib/imagePreloader'

function getRelativeTimingLabel(show: ShowWithGenres, isUpcoming: boolean): string | null {
  const rawDate = (show as any).next_season_date
  if (!rawDate) return null

  const target = new Date(rawDate)
  if (Number.isNaN(target.getTime())) return null

  const now = new Date()
  // Normalize times to midnight to avoid timezone jitter
  const diffMs = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (isUpcoming) {
    if (diffDays <= 0) return 'Arrives today'
    if (diffDays === 1) return 'Arrives tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    if (diffDays < 35) {
      const weeks = Math.round(diffDays / 7)
      return `In ${weeks} week${weeks === 1 ? '' : 's'}`
    }
    if (diffDays < 210) {
      const months = Math.round(diffDays / 30)
      return `In ${months} month${months === 1 ? '' : 's'}`
    }
    return 'Coming soon'
  }

  const daysAgo = Math.abs(diffDays)
  if (daysAgo === 0) return 'Dropped today'
  if (daysAgo === 1) return 'Dropped yesterday'
  if (daysAgo < 7) return `${daysAgo} days ago`
  if (daysAgo < 35) {
    const weeks = Math.round(daysAgo / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  }
  if (daysAgo < 210) {
    const months = Math.round(daysAgo / 30)
    return `${months} month${months === 1 ? '' : 's'} ago`
  }
  return 'Released recently'
}

interface NewSeasonsListProps {
  shows: ShowWithGenres[]
  loading?: boolean
  error?: any
  emptyMessage?: string
  className?: string
  preloadedShows?: ShowWithGenres[]
  onNearEnd?: () => void
  hasMore?: boolean
}

export default function NewSeasonsList({
  shows,
  loading,
  error,
  emptyMessage = 'No new seasons found',
  className = '',
  preloadedShows = [],
  onNearEnd,
  hasMore = false
}: NewSeasonsListProps) {
  const [displayedShows, setDisplayedShows] = useState<ShowWithGenres[]>(shows)
  const listRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    setDisplayedShows(shows)
  }, [shows])

  // Aggressive preload images for all current shows
  useEffect(() => {
    if (shows.length > 0) {
      // First batch - highest priority
      const firstBatch = shows.slice(0, 4)
      console.log(`🎬 [NewSeasonsList] Highest-priority preloading for ${firstBatch.length} immediate shows`)
      preloadShowImagesOptimized(firstBatch, 'high').catch(error => {
        console.warn('🎬 [NewSeasonsList] Failed to preload immediate images:', error)
      })

      // Second batch - high priority
      if (shows.length > 4) {
        const secondBatch = shows.slice(4, 12)
        console.log(`🎬 [NewSeasonsList] High-priority preloading for ${secondBatch.length} near-visible shows`)
        setTimeout(() => {
          preloadShowImagesOptimized(secondBatch, 'high').catch(error => {
            console.warn('🎬 [NewSeasonsList] Failed to preload near-visible images:', error)
          })
        }, 100)
      }

      // Remaining shows - medium priority
      if (shows.length > 12) {
        const remainingShows = shows.slice(12)
        console.log(`🎬 [NewSeasonsList] Medium-priority preloading for ${remainingShows.length} remaining shows`)
        setTimeout(() => {
          preloadShowImagesOptimized(remainingShows, 'low').catch(error => {
            console.warn('🎬 [NewSeasonsList] Failed to preload remaining images:', error)
          })
        }, 200)
      }
    }
  }, [shows])

  // Aggressively preload images for upcoming shows
  useEffect(() => {
    if (preloadedShows.length > 0) {
      console.log(`🎬 [NewSeasonsList] Aggressive background preloading for ${preloadedShows.length} upcoming shows`)
      setTimeout(() => {
        preloadShowImagesOptimized(preloadedShows, 'low').catch(error => {
          console.warn('🎬 [NewSeasonsList] Failed to preload upcoming images:', error)
        })
      }, 300)
    }
  }, [preloadedShows])

  // Set up intersection observer for infinite scrolling trigger
  useEffect(() => {
    if (!onNearEnd || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('🎬 [NewSeasonsList] Near end of list, triggering preload')
            onNearEnd?.()
          }
        })
      },
      {
        rootMargin: '600px' // Trigger when 600px away from the end for earlier preloading
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

    const lastItems = listRef.current?.querySelectorAll('.new-season-card-item')
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

  const handleAction = (actedShow: ShowWithGenres, _status: ShowStatus) => {
    setDisplayedShows(prev => prev.filter(show => show.imdb_id !== actedShow.imdb_id))
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="show-card-modern relative flex gap-3 lg:gap-4 p-3 lg:p-4 animate-pulse min-h-[240px]"
            >
              <div className="h-[180px] w-[120px] rounded-3xl bg-white/5 sm:h-[210px] sm:w-[140px] lg:h-[240px] lg:w-[160px]" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-6 w-3/4 rounded bg-white/10" />
                <div className="h-4 w-2/3 rounded bg-white/5" />
                <div className="h-3 w-full rounded bg-white/5" />
                <div className="h-3 w-11/12 rounded bg-white/5" />
                <div className="mt-6 flex gap-3">
                  <div className="h-9 w-24 rounded-full bg-white/5" />
                  <div className="h-9 w-20 rounded-full bg-white/5" />
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
      <div className={className}>
        <div className="show-card-modern p-8 text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Something went wrong</h3>
          <p className="text-gray-300 mb-6">
            We couldn&apos;t load the new seasons. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-modern"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (displayedShows.length === 0) {
    return (
      <div className={className}>
        <div className="show-card-modern p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 7v11h6V7H9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">No new seasons</h3>
          <p className="text-gray-300">
            {emptyMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} ref={listRef}>
      <div className="space-y-4">
        {displayedShows.map((show, index) => {
          const { seasonText, airDate, isUpcoming } = formatSeasonInfo(show)

          const seasonBadgeClasses = isUpcoming
            ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
            : 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'

          const statusLabel = isUpcoming ? 'UPCOMING' : 'RECENTLY RELEASED'
          const airDateLabel = airDate ? `${isUpcoming ? 'Arrives' : 'Arrived'} ${airDate}` : ''
          const timingLabel = getRelativeTimingLabel(show, isUpcoming)

          const extraContent = (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className={`inline-flex items-center rounded-lg px-3 py-1 text-[0.62rem] sm:text-xs font-semibold tracking-[0.24em] uppercase ${seasonBadgeClasses}`}>
                    {seasonText.toUpperCase()}
                  </span>
                  {airDateLabel && (
                    <span className="text-white/80 text-[0.62rem] sm:text-xs tracking-[0.22em] uppercase">
                      {airDateLabel.toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.6rem] sm:text-[0.7rem] font-semibold uppercase tracking-[0.24em] ${
                    isUpcoming ? 'bg-blue-500/15 text-blue-200 border border-blue-400/30' : 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              {timingLabel && (
                <div className="text-[0.62rem] sm:text-xs tracking-[0.2em] uppercase text-white/70">
                  {timingLabel.toUpperCase()}
                </div>
              )}
            </div>
          )

          return (
            <div key={show.imdb_id} className="new-season-card-item">
              <ShowCard
                show={show}
                onAction={handleAction}
                showActions={false}
                showDescription={false}
                compact
                priority={index < 4}
                extraContent={extraContent}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
