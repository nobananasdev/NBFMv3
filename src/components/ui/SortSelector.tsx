'use client'

import { SortOption } from '@/hooks/useShows'
import { useContext, useState } from 'react'
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
  theme?: 'discover' | 'new-seasons' | 'watchlist' | 'rated'
}

export default function SortSelector({ value, onChange, options, className = '', showFilter = false, mobileEqualWidth = true, buttonClassName = '', theme }: SortSelectorProps) {
  // Always call useContext hook, but only use it if showFilter is true
  const filterContext = useContext(FilterContext)
  const toggleFilter = showFilter ? (filterContext?.toggleFilter || (() => {})) : (() => {})
  const hasActiveFilters = showFilter ? (filterContext?.hasActiveFilters || false) : false
  const [hovered, setHovered] = useState<SortOption | null>(null)

  const mobileWidthClass = mobileEqualWidth ? 'flex-1' : 'flex-none'

  const containerJustify = mobileEqualWidth ? 'justify-between' : 'justify-start'

  const gradients: Record<NonNullable<SortSelectorProps['theme']>, string> = {
    'discover': 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.35) 100%)',
    'new-seasons': 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.35) 100%)',
    'watchlist': 'linear-gradient(135deg, rgba(245,158,11,0.35) 0%, rgba(249,115,22,0.35) 100%)',
    'rated': 'linear-gradient(135deg, rgba(236,72,153,0.35) 0%, rgba(244,63,94,0.35) 100%)',
  }

  const glows: Record<NonNullable<SortSelectorProps['theme']>, string> = {
    'discover': '0 0 18px rgba(99,102,241,0.35)',
    'new-seasons': '0 0 18px rgba(16,185,129,0.35)',
    'watchlist': '0 0 20px rgba(245,158,11,0.35)',
    'rated': '0 0 18px rgba(236,72,153,0.35)'
  }

  return (
    <div className={`flex gap-2 sm:gap-4 w-full ${containerJustify} items-center flex-nowrap ${className}`}>
      {/* Filter pill first */}
      {showFilter && (
        <button
          onClick={toggleFilter}
          aria-label="Ava filtrid"
          title="Filtrid"
          className={`nav-pill relative ${hasActiveFilters ? 'active' : ''} ${mobileWidthClass} text-center sm:flex-none ${buttonClassName}`}
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {/* Sliders (Adjustments Horizontal) icon for clearer filtering metaphor */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6h10m8 0h-4m-4 0a2 2 0 11-4 0 2 2 0 014 0zM3 12h4m14 0H10m8 0a2 2 0 10-4 0 2 2 0 004 0zM3 18h10m8 0h-4m-4 0a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
          )}
        </button>
      )}

      {/* Sort options follow */}
      {options.map((option) => {
        const isActive = value === option.value
        const isHover = hovered === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`group relative overflow-hidden px-3 lg:px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all duration-300 ease-out hover:-translate-y-0.5 ${
              isActive || isHover
                ? 'text-white bg-white/10 border-transparent'
                : 'text-white/75 hover:text-white hover:bg-white/10 border-transparent'
            } ${mobileWidthClass} text-center sm:flex-none ${buttonClassName}`}
            onMouseEnter={() => setHovered(option.value)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(option.value)}
            onBlur={() => setHovered(null)}
            style={theme && (isActive || isHover) ? { boxShadow: `var(--shadow-lg), ${glows[theme]}` } : undefined}
          >
            {theme && (
              <span
                aria-hidden
                className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300 ease-out ${
                  (isActive || isHover) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{ background: gradients[theme] }}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
