'use client'

import { SortOption } from '@/hooks/useShows'

interface SortSelectorProps {
  value: SortOption
  onChange: (sort: SortOption) => void
  options: Array<{
    value: SortOption
    label: string
  }>
  className?: string
}

export default function SortSelector({ value, onChange, options, className = '' }: SortSelectorProps) {
  return (
    <div className={`flex gap-4 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className="inline-flex px-[20px] py-[5px] justify-center items-center gap-[10px] rounded-[10px] border border-black transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1 active:scale-95"
          style={{
            backgroundColor: value === option.value ? '#000' : '#FFF',
            boxShadow: value === option.value
              ? '3px 3px 0px 0px #FFE38F'
              : '3px 3px 0px 0px #000'
          }}
          onMouseEnter={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.backgroundColor = '#F8F8F8'
              e.currentTarget.style.boxShadow = '4px 4px 0px 0px #FFE38F'
            } else {
              e.currentTarget.style.boxShadow = '4px 4px 0px 0px #FFE38F'
            }
          }}
          onMouseLeave={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.backgroundColor = '#FFF'
              e.currentTarget.style.boxShadow = '3px 3px 0px 0px #000'
            } else {
              e.currentTarget.style.boxShadow = '3px 3px 0px 0px #FFE38F'
            }
          }}
        >
          <span
            className={`font-bold text-xs leading-[30px] tracking-[0.36px] ${
              value === option.value ? 'text-white' : 'text-black'
            }`}
          >
            {option.label}
          </span>
        </button>
      ))}
    </div>
  )
}