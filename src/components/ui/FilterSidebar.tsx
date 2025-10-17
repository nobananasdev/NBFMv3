'use client'

import React, { useEffect, useState } from 'react'
import { useFilter } from '@/contexts/FilterContext'

interface FilterSidebarProps {
  inline?: boolean
}

export default function FilterSidebar({ inline = false }: FilterSidebarProps) {
  const {
    isFilterOpen,
    filters,
    filterOptions,
    closeFilter,
    setSelectedGenres,
    setSelectedStreamers,
    hasActiveFilters,
    isApplyingFilters
  } = useFilter()

  const [isAnimating, setIsAnimating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(isFilterOpen)

  // Local staged filter values to avoid updating global filters while the panel is open.
  const [stagedGenres, setStagedGenres] = useState<number[]>([])
  const [stagedStreamers, setStagedStreamers] = useState<number[]>([])

  // Initialize staged values when the panel opens, and keep them in sync if filters change while open.
  useEffect(() => {
    if (isFilterOpen) {
      setStagedGenres(filters.selectedGenres)
      setStagedStreamers(filters.selectedStreamers)
    }
  }, [isFilterOpen, filters.selectedGenres, filters.selectedStreamers])

  // Allow graceful close animation for inline variant by delaying unmount.
  useEffect(() => {
    if (!inline) {
      setShouldRender(isFilterOpen)
      setIsClosing(false)
      return
    }

    if (isFilterOpen) {
      setShouldRender(true)
      setIsClosing(false)
    } else if (shouldRender) {
      setIsClosing(true)
      const t = setTimeout(() => {
        setShouldRender(false)
        setIsClosing(false)
      }, 220)
      return () => clearTimeout(t)
    }
  }, [inline, isFilterOpen, shouldRender])

  // Close sidebar on escape key, and lock body scroll without layout shift when rendered as overlay.
  useEffect(() => {
    if (inline) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFilterOpen) {
        closeFilter()
      }
    }

    if (isFilterOpen) {
      document.addEventListener('keydown', handleEscape)

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      document.body.style.overflow = 'hidden'

      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [inline, isFilterOpen, closeFilter])

  if (inline) {
    if (!shouldRender) return null
  } else if (!isFilterOpen) {
    return null
  }

  const handleGenreChange = (genreId: number, checked: boolean) => {
    setStagedGenres(prev =>
      checked ? [...prev, genreId] : prev.filter(id => id !== genreId)
    )
  }

  const handleStreamerChange = (streamerId: number, checked: boolean) => {
    setStagedStreamers(prev =>
      checked ? [...prev, streamerId] : prev.filter(id => id !== streamerId)
    )
  }

  // Apply staged filters in one commit to avoid intermediate fetches/jitter.
  const applyFilters = () => {
    setSelectedGenres(stagedGenres)
    setSelectedStreamers(stagedStreamers)
    closeFilter()
  }

  const clearStaged = () => {
    setStagedGenres([])
    setStagedStreamers([])
  }

  const isDirty = (() => {
    const sameGenres =
      stagedGenres.length === filters.selectedGenres.length &&
      stagedGenres.every(id => filters.selectedGenres.includes(id))

    const sameStreamers =
      stagedStreamers.length === filters.selectedStreamers.length &&
      stagedStreamers.every(id => filters.selectedStreamers.includes(id))

    return !(sameGenres && sameStreamers)
  })()

  const hasStagedSelections = (() => {
    return stagedGenres.length > 0 || stagedStreamers.length > 0
  })()

  const canApply = (isDirty || hasStagedSelections || hasActiveFilters) && !isApplyingFilters
  const applyBtnClasses = `action-btn w-full text-sm font-medium rounded-3xl flex items-center justify-center gap-2 ${canApply ? 'gradient' : 'opacity-60 cursor-not-allowed'}`
  const shouldShowClear =
    hasActiveFilters ||
    stagedGenres.length > 0 ||
    stagedStreamers.length > 0

  const renderFilterSections = () => (
    <div className="space-y-6">
      {filterOptions?.genres && filterOptions.genres.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreChange(genre.id, !stagedGenres.includes(genre.id))}
                className={`chip ${stagedGenres.includes(genre.id) ? 'active' : ''}`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {filterOptions?.streamers && filterOptions.streamers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Streaming Providers</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.streamers.map((streamer) => (
              <button
                key={streamer.id}
                onClick={() => handleStreamerChange(streamer.id, !stagedStreamers.includes(streamer.id))}
                className={`chip ${stagedStreamers.includes(streamer.id) ? 'active' : ''}`}
              >
                {streamer.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!filterOptions && (
        <div className="text-sm text-[var(--text-secondary)]">
          Loading filter options...
        </div>
      )}
    </div>
  )

  const renderFooter = (containerClasses: string) => (
    <div className={containerClasses}>
      {shouldShowClear && (
        <button
          onClick={clearStaged}
          className="filter-btn w-full text-sm"
        >
          Clear All Filters
        </button>
      )}
      <button
        onClick={applyFilters}
        disabled={!canApply}
        className={applyBtnClasses}
      >
        {isApplyingFilters ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Applying...
          </>
        ) : (
          'Apply Filters'
        )}
      </button>
    </div>
  )

  if (inline) {
    return (
      <div className={`w-full glass-card minimal-hover rounded-[28px] border border-[var(--border-primary)] p-4 sm:p-6 space-y-6 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <button onClick={closeFilter} className="icon-btn" aria-label="Close filters">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {renderFilterSections()}

        {renderFooter('border-t border-[var(--border-secondary)] pt-4 space-y-3')}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
          isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={closeFilter}
      />

      <div className={`relative glass w-80 h-full border border-[var(--border-primary)] shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isAnimating ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="sticky top-0 glass-strong border-b border-[var(--border-secondary)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <button
            onClick={closeFilter}
            className="icon-btn"
            aria-label="Close filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {renderFilterSections()}
        </div>

        {renderFooter('sticky bottom-0 glass-strong border-t border-[var(--border-secondary)] px-6 py-4 space-y-3')}
      </div>
    </div>
  )
}
