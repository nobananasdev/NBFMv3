'use client'

import React, { useEffect, useState } from 'react'
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

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFilterOpen) {
        closeFilter()
      }
    }

    if (isFilterOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scroll
      // Trigger animation after component mounts
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isFilterOpen, closeFilter])

  if (!isFilterOpen) return null

  const handleGenreChange = (genreId: number, checked: boolean) => {
    if (checked) {
      setSelectedGenres([...filters.selectedGenres, genreId])
    } else {
      setSelectedGenres(filters.selectedGenres.filter(id => id !== genreId))
    }
  }

  const handleStreamerChange = (streamerId: number, checked: boolean) => {
    if (checked) {
      setSelectedStreamers([...filters.selectedStreamers, streamerId])
    } else {
      setSelectedStreamers(filters.selectedStreamers.filter(id => id !== streamerId))
    }
  }

  const handleYearRangeChange = (type: 'min' | 'max', value: number) => {
    if (type === 'min') {
      setYearRange([value, filters.yearRange[1]])
    } else {
      setYearRange([filters.yearRange[0], value])
    }
  }

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
                      checked={filters.selectedGenres.includes(genre.id)}
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
                      value={filters.yearRange[0]}
                      onChange={(e) => handleYearRangeChange('min', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-center text-sm text-gray-700 mt-1">
                      {filters.yearRange[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="range"
                      min={filterOptions.yearRange[0]}
                      max={filterOptions.yearRange[1]}
                      value={filters.yearRange[1]}
                      onChange={(e) => handleYearRangeChange('max', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-center text-sm text-gray-700 mt-1">
                      {filters.yearRange[1]}
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  {filters.yearRange[0]} - {filters.yearRange[1]}
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
                      checked={filters.selectedStreamers.includes(streamer.id)}
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
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          )}
          <button
            onClick={closeFilter}
            className="w-full px-6 py-3 bg-[#3a3a3a] hover:bg-[#2a2a2a] text-white font-semibold rounded-3xl transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
