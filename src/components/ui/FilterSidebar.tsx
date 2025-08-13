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
    hasActiveFilters
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
      <div className={`relative bg-white w-80 h-full shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isAnimating ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={closeFilter}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
              <h3 className="text-sm font-medium text-gray-900 mb-3">Genres</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filterOptions.genres.map((genre) => (
                  <label key={genre.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={stagedGenres.includes(genre.id)}
                      onChange={(e) => handleGenreChange(genre.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700">{genre.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Year Range Section */}
          {filterOptions?.yearRange && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Year Range</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="range"
                      min={filterOptions.yearRange[0]}
                      max={filterOptions.yearRange[1]}
                      value={stagedYearRange[0]}
                      onChange={(e) => handleYearRangeChange('min', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-center text-sm text-gray-700 mt-1">
                      {stagedYearRange[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="range"
                      min={filterOptions.yearRange[0]}
                      max={filterOptions.yearRange[1]}
                      value={stagedYearRange[1]}
                      onChange={(e) => handleYearRangeChange('max', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-center text-sm text-gray-700 mt-1">
                      {stagedYearRange[1]}
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  {stagedYearRange[0]} - {stagedYearRange[1]}
                </div>
              </div>
            </div>
          )}

          {/* Streaming Providers Section */}
          {filterOptions?.streamers && filterOptions.streamers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Streaming Providers</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filterOptions.streamers.map((streamer) => (
                  <label key={streamer.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={stagedStreamers.includes(streamer.id)}
                      onChange={(e) => handleStreamerChange(streamer.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700">{streamer.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 space-y-3">
          {(hasActiveFilters || stagedGenres.length > 0 || stagedStreamers.length > 0 || (filterOptions && (stagedYearRange[0] !== filterOptions.yearRange[0] || stagedYearRange[1] !== filterOptions.yearRange[1]))) && (
            <button
              onClick={clearStaged}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          )}
          <button
            onClick={applyFilters}
            disabled={!isDirty}
            className={`w-full px-6 py-3 text-white font-semibold rounded-3xl transition-colors ${isDirty ? 'bg-[#3a3a3a] hover:bg-[#2a2a2a]' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
