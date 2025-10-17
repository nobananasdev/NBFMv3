'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface FilterState {
  selectedGenres: number[]
  yearRange: [number, number]
  selectedStreamers: number[]
}

export interface FilterOptions {
  genres: Array<{ id: number; name: string }>
  yearRange: [number, number]
  streamers: Array<{ id: number; name: string }>
}

interface FilterContextType {
  // State
  isFilterOpen: boolean
  filters: FilterState
  filterOptions: FilterOptions | null
  isApplyingFilters: boolean
  
  // Actions
  toggleFilter: () => void
  closeFilter: () => void
  setSelectedGenres: (genres: number[]) => void
  setSelectedStreamers: (streamers: number[]) => void
  clearFilters: () => void
  setFilterOptions: (options: FilterOptions) => void
  setIsApplyingFilters: (loading: boolean) => void
  
  // Computed
  hasActiveFilters: boolean
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [isApplyingFilters, setIsApplyingFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    selectedGenres: [],
    yearRange: [1950, 2025], // Wider default range, will be updated when options are loaded
    selectedStreamers: []
  })

  const toggleFilter = () => setIsFilterOpen(!isFilterOpen)
  const closeFilter = () => setIsFilterOpen(false)

  const setSelectedGenres = (genres: number[]) => {
    setFilters(prev => ({ ...prev, selectedGenres: genres }))
  }

  const setSelectedStreamers = (streamers: number[]) => {
    setFilters(prev => ({ ...prev, selectedStreamers: streamers }))
  }

  const clearFilters = () => {
    setFilters({
      selectedGenres: [],
      yearRange: filterOptions?.yearRange || [1950, 2025],
      selectedStreamers: []
    })
  }

  // Update filters when filterOptions are loaded
  const setFilterOptionsAndUpdateDefaults = (options: FilterOptions) => {
    setFilterOptions(options)
    // Update year range to match the actual data range if it's still at default
    setFilters(prev => ({
      ...prev,
      yearRange: prev.yearRange[0] === 1950 && prev.yearRange[1] === 2025 
        ? options.yearRange 
        : prev.yearRange
    }))
  }

  const hasActiveFilters = 
    filters.selectedGenres.length > 0 ||
    filters.selectedStreamers.length > 0

  return (
    <FilterContext.Provider
      value={{
        isFilterOpen,
        filters,
        filterOptions,
        isApplyingFilters,
        toggleFilter,
        closeFilter,
        setSelectedGenres,
        setSelectedStreamers,
        clearFilters,
        setFilterOptions: setFilterOptionsAndUpdateDefaults,
        setIsApplyingFilters,
        hasActiveFilters
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }
  return context
}
