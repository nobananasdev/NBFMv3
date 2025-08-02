'use client'

import { SortOption } from '@/hooks/useShows'
import { useContext } from 'react'
import { FilterContext } from '@/contexts/FilterContext'

interface SortSelectorProps {
  value: SortOption
  onChange: (sort: SortOption) => void
  options: Array<{
    value: SortOption
    label: string
  }>
  className?: string
  showFilter?: boolean
}

export default function SortSelector({ value, onChange, options, className = '', showFilter = false }: SortSelectorProps) {
  // Always call useContext hook, but only use it if showFilter is true
  const filterContext = useContext(FilterContext)
  const toggleFilter = showFilter ? (filterContext?.toggleFilter || (() => {})) : (() => {})
  const hasActiveFilters = showFilter ? (filterContext?.hasActiveFilters || false) : false

  return (
    <div className={`flex gap-2 sm:gap-4 ${className}`}>
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-2 sm:px-6 sm:py-3 rounded-2xl sm:rounded-3xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0 ${
              isActive
                ? 'bg-[#3a3a3a] hover:bg-[#3a3a3a] border-0 shadow-md'
                : 'bg-[#FFFCF5] hover:bg-gray-50 border border-[#696969] shadow-sm hover:shadow-md'
            }`}
          >
            <span
              className={`font-semibold text-sm sm:text-[14px] ${
                isActive ? 'text-white' : 'text-black'
              }`}
            >
              {option.label}
            </span>
          </button>
        )
      })}
      
      {showFilter && (
        <button
          onClick={toggleFilter}
          className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl sm:rounded-3xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0 relative ${
            hasActiveFilters
              ? 'bg-[#3a3a3a] hover:bg-[#3a3a3a] border-0 shadow-md'
              : 'bg-[#FFFCF5] hover:bg-gray-50 border border-[#696969] shadow-sm hover:shadow-md'
          }`}
        >
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 ${hasActiveFilters ? 'text-white' : 'text-black'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
          )}
        </button>
      )}
    </div>
  )
}
