'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import ShowCard from './ShowCard'
import { ShowWithGenres } from '@/lib/shows'
import { ShowStatus } from '@/types/database'

interface ShowsListProps {
  shows: ShowWithGenres[]
  loading?: boolean
  error?: any
  onShowAction?: (show: ShowWithGenres, status: ShowStatus) => void
  emptyMessage?: string
  className?: string
  hiddenActions?: ShowStatus[]
  showActions?: boolean
}

export default function ShowsList({
  shows,
  loading,
  error,
  onShowAction,
  emptyMessage = 'No shows found',
  className = '',
  hiddenActions = [],
  showActions = true
}: ShowsListProps) {
  const handleShowAction = (show: ShowWithGenres, status: ShowStatus) => {
    // Just call the parent callback - no animations, no local state
    onShowAction?.(show, status)
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card min-h-[320px] p-6">
              <div className="animate-pulse">
                <div className="hidden md:flex gap-6">
                  <div className="w-[200px] h-[300px] bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-px bg-gray-200 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-32 bg-gray-200 rounded"></div>
                      <div className="h-8 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="md:hidden">
                  <div className="w-[200px] h-[300px] bg-gray-200 rounded-lg mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-px bg-gray-200 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-32 bg-gray-200 rounded"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded"></div>
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

  // Window-based virtualization to keep DOM size small and scrolling fast

  // Lightweight window virtualization without external deps
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [itemHeight, setItemHeight] = useState(560) // initial estimate
  const [scrollY, setScrollY] = useState(0)
  const [viewportH, setViewportH] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || window.pageYOffset || 0)
    const onResize = () => setViewportH(window.innerHeight || 0)
    onScroll()
    onResize()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Measure a real card height once it renders
  useEffect(() => {
    const el = containerRef.current?.querySelector('.cv-auto')
    if (el) {
      const rect = (el as HTMLElement).getBoundingClientRect()
      if (rect.height && Math.abs(rect.height - itemHeight) > 10) {
        setItemHeight(Math.round(rect.height + 24)) // + padding gap
      }
    }
  }, [shows.length]) // re-check when list grows

  const overscan = 6
  const { start, end, topPad, bottomPad } = useMemo(() => {
    const vh = viewportH || (typeof window !== 'undefined' ? window.innerHeight : 0)
    const ih = itemHeight || 560
    const first = Math.max(0, Math.floor((scrollY - 200) / ih) - overscan)
    const visible = Math.ceil((vh + 400) / ih) + overscan * 2
    const last = Math.min(shows.length, first + visible)
    return {
      start: first,
      end: last,
      topPad: first * ih,
      bottomPad: Math.max(0, (shows.length - last) * ih)
    }
  }, [scrollY, viewportH, itemHeight, shows.length])

  const slice = useMemo(() => shows.slice(start, end), [shows, start, end])

  return (
    <div ref={containerRef} className={`${className}`}>
      <div style={{ height: topPad }} />
      <div className="grid grid-cols-1 gap-6">
        {slice.map((show) => (
          <div key={show.imdb_id} className="transition-all duration-300 ease-in-out">
            <ShowCard
              show={show}
              onAction={handleShowAction}
              hiddenActions={hiddenActions}
              showActions={showActions}
            />
          </div>
        ))}
      </div>
      <div style={{ height: bottomPad }} />
    </div>
  )
}