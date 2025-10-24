'use client'

import React, { useEffect, useState } from 'react'
import { useFilter } from '@/contexts/FilterContext'

interface SearchPanelProps {
  isOpen: boolean
  onClose: () => void
  onCommit: (query: string, imdbId?: string) => void
  inline?: boolean
}

export default function SearchPanel({ isOpen, onClose, onCommit, inline = false }: SearchPanelProps) {
  const { filters } = useFilter()
  const [input, setInput] = useState('')

  // Support closing animation for inline mode by delaying unmount
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => {
    if (inline) {
      if (isOpen) {
        setShouldRender(true)
        setIsClosing(false)
      } else if (shouldRender) {
        setIsClosing(true)
        const t = setTimeout(() => {
          setShouldRender(false)
          setIsClosing(false)
          setInput('')
        }, 220)
        return () => clearTimeout(t)
      }
    } else {
      if (!isOpen) {
        setInput('')
      }
    }
  }, [isOpen, inline, shouldRender])

  const handleCommit = () => {
    const q = input.trim()
    if (q.length >= 1) {
      onCommit(q)
      onClose()
    }
  }

  if (!inline && !isOpen) return null

  if (inline) {
    if (!shouldRender) return null
    return (
      <div className={`w-full glass-card minimal-hover p-2 sm:p-3 lg:p-4 mb-4 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="font-bold text-[16px] sm:text-[18px] lg:text-[20px] leading-tight text-white">Search shows</h3>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Close search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3">
          {/* Input + Otsi */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                autoFocus
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCommit()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    onClose()
                  }
                }}
                placeholder="Search shows by name, cast, or creator..."
                className="search-input px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleCommit}
              className="action-btn minimal-hover px-3 py-2"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Info text */}
          <div className="text-sm text-gray-500">
            Press Enter or click Search to find shows
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="modal-panel relative mt-24 w-full max-w-xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-secondary)] flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-white">Search shows</h3>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Close search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Input + Otsi */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                autoFocus
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCommit()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    onClose()
                  }
                }}
                placeholder="Search shows by name, cast, or creator..."
                className="search-input"
              />
            </div>
            <button
              onClick={handleCommit}
              className="action-btn gradient"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Info text */}
          <div className="text-sm text-gray-500">
            Press Enter or click Search to find shows
          </div>
        </div>
      </div>
    </div>
  )
}
