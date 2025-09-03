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
  mobileEqualWidth?: boolean
  buttonClassName?: string
}

export default function SortSelector({ value, onChange, options, className = '', showFilter = false, mobileEqualWidth = true, buttonClassName = '' }: SortSelectorProps) {
  // Always call useContext hook, but only use it if showFilter is true
  const filterContext = useContext(FilterContext)
  const toggleFilter = showFilter ? (filterContext?.toggleFilter || (() => {})) : (() => {})
  const hasActiveFilters = showFilter ? (filterContext?.hasActiveFilters || false) : false

  const mobileWidthClass = mobileEqualWidth ? 'flex-1' : 'flex-none'

  const containerJustify = mobileEqualWidth ? 'justify-between' : 'justify-start'

  return (
    <div className={`flex gap-2 sm:gap-4 w-full ${containerJustify} items-center flex-nowrap ${className}`}>
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`nav-pill ${isActive ? 'active' : ''} ${mobileWidthClass} text-center sm:flex-none ${buttonClassName}`}
          >
            <span
              className="font-semibold text-xs sm:text-[14px] whitespace-nowrap"
            >
              {option.label}
            </span>
          </button>
        )
      })}
      
      {showFilter && (
        <button
          onClick={toggleFilter}
          className={`nav-pill relative ${hasActiveFilters ? 'active' : ''} ${mobileWidthClass} text-center sm:flex-none ${buttonClassName}`}
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mx-auto"
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
