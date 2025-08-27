'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useFilter } from '@/contexts/FilterContext'

export default function FilterSidebar() {
  const {
    isFilterOpen,
    filters,
    filterOptions,
    closeFilter,
    setSelectedGenres,
    setYearRange,
    setSelectedStreamers,
    clearFilters,
    hasActiveFilters,
    isApplyingFilters,
    setIsApplyingFilters
  } = useFilter()

  const [isAnimating, setIsAnimating] = useState(false)

  // Local staged filter values to avoid updating global filters while the panel is open.
  const [stagedGenres, setStagedGenres] = useState<number[]>([])
  const [stagedStreamers, setStagedStreamers] = useState<number[]>([])
  const [stagedYearRange, setStagedYearRange] = useState<[number, number]>([1950, 2025])

  // Initialize staged values when the panel opens, and keep them in sync if filters change while open.
  useEffect(() => {
    if (isFilterOpen) {
      setStagedGenres(filters.selectedGenres)
      setStagedStreamers(filters.selectedStreamers)
      setStagedYearRange(filters.yearRange)
    }
  }, [isFilterOpen, filters.selectedGenres, filters.selectedStreamers, filters.yearRange])

  // Close sidebar on escape key, and lock body scroll without layout shift
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFilterOpen) {
        closeFilter()
      }
    }

    if (isFilterOpen) {
      document.addEventListener('keydown', handleEscape)

      // Reserve scrollbar gutter and then lock body scrolling
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      document.body.style.overflow = 'hidden'

      // Start slide-in animation
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      // Restore styles
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isFilterOpen, closeFilter])

  console.log('🔍 [FilterSidebar] Render state:', {
    isFilterOpen,
    filterOptions: filterOptions ? {
      genres: filterOptions.genres?.length || 0,
      streamers: filterOptions.streamers?.length || 0,
      yearRange: filterOptions.yearRange,
      streamersData: filterOptions.streamers
    } : null
  })

  if (!isFilterOpen) return null

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

  const handleYearRangeChange = (type: 'min' | 'max', value: number) => {
    setStagedYearRange(prev => (type === 'min' ? [value, prev[1]] : [prev[0], value]))
  }

  // Apply staged filters in one commit to avoid intermediate fetches/jitter
  const applyFilters = () => {
    // Don't set isApplyingFilters here - let useShows hook manage this state
    // to avoid timing conflicts and ensure proper coordination with data loading
    
    // Apply filters immediately for responsive user experience
    setSelectedGenres(stagedGenres)
    setSelectedStreamers(stagedStreamers)
    setYearRange(stagedYearRange)
    closeFilter()
  }

  // Clear staged values to defaults derived from options, but do not commit until Apply is pressed
  const clearStaged = () => {
    const yr = filterOptions?.yearRange ?? [1950, 2025]
    setStagedGenres([])
    setStagedStreamers([])
    setStagedYearRange(yr)
  }

  // Whether staged differs from current filters (to enable/disable Apply)
  // Note: do NOT use hooks here to keep hook order identical whether the panel is open or closed.
  const isDirty = (() => {
    const sameGenres =
      stagedGenres.length === filters.selectedGenres.length &&
      stagedGenres.every(id => filters.selectedGenres.includes(id))

    const sameStreamers =
      stagedStreamers.length === filters.selectedStreamers.length &&
      stagedStreamers.every(id => filters.selectedStreamers.includes(id))

    const sameYear =
      stagedYearRange[0] === filters.yearRange[0] &&
      stagedYearRange[1] === filters.yearRange[1]

    return !(sameGenres && sameStreamers && sameYear)
  })()

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
          isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={closeFilter}
      />
      
      {/* Sidebar */}
      <div className={`relative glass w-80 h-full border border-[var(--border-primary)] shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isAnimating ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="sticky top-0 glass-strong border-b border-[var(--border-secondary)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <button
            onClick={closeFilter}
            className="icon-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Genres Section */}
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

          {/* Year Range Section */}
          {filterOptions?.yearRange && (
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Year Range</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">From</label>
                    <input
                      type="range"
                      min={filterOptions.yearRange[0]}
                      max={filterOptions.yearRange[1]}
                      value={stagedYearRange[0]}
                      onChange={(e) => handleYearRangeChange('min', parseInt(e.target.value))}
                      className="w-full slider"
                    />
                    <div className="text-center text-sm text-[var(--text-secondary)] mt-1">
                      {stagedYearRange[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">To</label>
                    <input
                      type="range"
                      min={filterOptions.yearRange[0]}
                      max={filterOptions.yearRange[1]}
                      value={stagedYearRange[1]}
                      onChange={(e) => handleYearRangeChange('max', parseInt(e.target.value))}
                      className="w-full slider"
                    />
                    <div className="text-center text-sm text-[var(--text-secondary)] mt-1">
                      {stagedYearRange[1]}
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-[var(--text-secondary)]">
                  {stagedYearRange[0]} - {stagedYearRange[1]}
                </div>
              </div>
            </div>
          )}

          {/* Streaming Providers Section */}
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
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 glass-strong border-t border-[var(--border-secondary)] px-6 py-4 space-y-3">
          {(hasActiveFilters || stagedGenres.length > 0 || stagedStreamers.length > 0 || (filterOptions && (stagedYearRange[0] !== filterOptions.yearRange[0] || stagedYearRange[1] !== filterOptions.yearRange[1]))) && (
            <button
              onClick={clearStaged}
              className="btn-secondary w-full text-sm"
            >
              Clear All Filters
            </button>
          )}
          <button
            onClick={applyFilters}
            disabled={!isDirty || isApplyingFilters}
            className={`action-btn w-full font-semibold rounded-3xl flex items-center justify-center gap-2 ${isDirty && !isApplyingFilters ? 'gradient' : 'opacity-50 cursor-not-allowed'}`}
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
      </div>
    </div>
  )
}
