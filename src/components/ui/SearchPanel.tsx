'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useFilter } from '@/contexts/FilterContext'
import { useAuth } from '@/contexts/AuthContext'
import { quickSearchDatabase } from '@/lib/shows'
import { highlightText, highlightTextArray } from '@/lib/textHighlight'
import { ShowStatus } from '@/types/database'

interface SearchPanelProps {
  isOpen: boolean
  onClose: () => void
  onCommit: (query: string, imdbId?: string) => void
  inline?: boolean
}

export default function SearchPanel({ isOpen, onClose, onCommit, inline = false }: SearchPanelProps) {
  const { filters } = useFilter()
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Array<{
    imdb_id: string
    name: string
    original_name: string | null
    creators: string[]
    main_cast: string[]
    user_status?: ShowStatus
  }>>([])

  const controllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (controllerRef.current) controllerRef.current.abort()
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setInput('')
      setSuggestions([])
      setLoading(false)
      setError(null)
    }
  }, [isOpen])

  // Debounced quick suggestions after 3 characters (changed from 3+)
  useEffect(() => {
    if (!isOpen) return

    const q = input.trim()
    if (q.length < 3) {
      setSuggestions([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const h = setTimeout(async () => {
      try {
        if (controllerRef.current) controllerRef.current.abort()
        controllerRef.current = new AbortController()

        const { suggestions, error } = await quickSearchDatabase({
          prefix: q,
          genreIds: filters.selectedGenres.length > 0 ? filters.selectedGenres : undefined,
          yearRange: filters.yearRange,
          streamerIds: filters.selectedStreamers.length > 0 ? filters.selectedStreamers : undefined,
          limit: 10,
          userId: user?.id
        })

        if (!mountedRef.current) return
        if (error) {
          setError('Failed to load suggestions')
          setSuggestions([])
        } else {
          setSuggestions(suggestions)
        }
      } catch {
        if (!mountedRef.current) return
        setError('Failed to load suggestions')
        setSuggestions([])
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }, 300)

    return () => clearTimeout(h)
  }, [input, isOpen, filters.selectedGenres, filters.yearRange, filters.selectedStreamers])

  const handleCommit = () => {
    const q = input.trim()
    if (q.length >= 1) {
      onCommit(q)
      onClose()
    }
  }

  // Helper function to get status indicator
  const getStatusIndicator = (status?: ShowStatus) => {
    if (!status) return null
    
    switch (status) {
      case 'watchlist':
        return (
          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            <span>Watchlist</span>
          </div>
        )
      case 'loved_it':
        return (
          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
            </svg>
            <span>Loved it</span>
          </div>
        )
      case 'liked_it':
        return (
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>Liked it</span>
          </div>
        )
      case 'not_for_me':
        return (
          <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <span>Not for me</span>
          </div>
        )
      default:
        return null
    }
  }

  if (!isOpen) return null

  if (inline) {
    return (
      <div className="w-full bg-[#FFFCF5] rounded-[12px] sm:rounded-[15px] border border-[#8e8e8e] p-3 sm:p-4 lg:p-6 mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="font-bold text-[20px] sm:text-[24px] lg:text-[32px] leading-tight text-[#000000]">Search shows</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4">
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
                placeholder="Type 3+ characters to search (name, cast, creator)..."
                className="w-full border border-[#8e8e8e] rounded-[15px] sm:rounded-[20px] px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <button
              onClick={handleCommit}
              className="px-4 py-3 rounded-2xl sm:rounded-3xl bg-[#3a3a3a] hover:bg-[#2a2a2a] text-white font-semibold transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Suggestions */}
          <div className="min-h-[84px]">
            {input.trim().length < 3 && (
              <div className="text-sm text-gray-500">Type 3+ characters to search across all shows</div>
            )}

            {input.trim().length >= 3 && loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                Loading suggestions...
              </div>
            )}

            {input.trim().length >= 3 && !loading && error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            {input.trim().length >= 3 && !loading && !error && suggestions.length === 0 && (
              <div className="text-sm text-gray-500">No suggestions</div>
            )}

            {suggestions.length > 0 && (
              <ul className="divide-y divide-gray-200 rounded-[15px] sm:rounded-[20px] border border-[#8e8e8e] overflow-hidden bg-white">
                {suggestions.map((sug) => {
                  const primary = sug.name || sug.original_name || 'Untitled'
                  const searchTerm = input.trim()

                  return (
                    <li key={sug.imdb_id}>
                      <button
                        onClick={() => {
                          onCommit(primary, sug.imdb_id)
                          onClose()
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">
                              {highlightText(primary, searchTerm, 'bg-yellow-200 px-1 py-0.5 rounded font-semibold')}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {sug.creators && sug.creators.length > 0 && (
                                <span>
                                  Creator: {highlightTextArray(sug.creators.slice(0, 2), searchTerm, ', ', 'bg-yellow-200 px-1 py-0.5 rounded font-semibold')}
                                </span>
                              )}
                              {sug.creators && sug.creators.length > 0 && sug.main_cast && sug.main_cast.length > 0 && (
                                <span className="text-gray-400"> • </span>
                              )}
                              {sug.main_cast && sug.main_cast.length > 0 && (
                                <span>
                                  Cast: {highlightTextArray(sug.main_cast.slice(0, 3), searchTerm, ', ', 'bg-yellow-200 px-1 py-0.5 rounded font-semibold')}
                                </span>
                              )}
                            </div>
                          </div>
                          {sug.user_status && (
                            <div className="flex-shrink-0">
                              {getStatusIndicator(sug.user_status)}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
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
      <div className="relative mt-24 w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Search shows</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                placeholder="Type 3+ characters to search (name, cast, creator)..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleCommit}
              className="px-4 py-3 rounded-2xl sm:rounded-3xl bg-[#3a3a3a] hover:bg-[#2a2a2a] text-white font-semibold transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Suggestions */}
          <div className="min-h-[84px]">
            {input.trim().length < 3 && (
              <div className="text-sm text-gray-500">Type 3+ characters to search across all shows</div>
            )}

            {input.trim().length >= 3 && loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                Loading suggestions...
              </div>
            )}

            {input.trim().length >= 3 && !loading && error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            {input.trim().length >= 3 && !loading && !error && suggestions.length === 0 && (
              <div className="text-sm text-gray-500">No suggestions</div>
            )}

            {suggestions.length > 0 && (
              <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 overflow-hidden">
                {suggestions.map((sug) => {
                  const primary = sug.name || sug.original_name || 'Untitled'
                  const searchTerm = input.trim()

                  return (
                    <li key={sug.imdb_id}>
                      <button
                        onClick={() => {
                          onCommit(primary, sug.imdb_id)
                          onClose()
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">
                              {highlightText(primary, searchTerm, 'bg-yellow-200 px-1 py-0.5 rounded font-semibold')}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {sug.creators && sug.creators.length > 0 && (
                                <span>
                                  Creator: {highlightTextArray(sug.creators.slice(0, 2), searchTerm, ', ', 'bg-yellow-200 px-1 py-0.5 rounded font-semibold')}
                                </span>
                              )}
                              {sug.creators && sug.creators.length > 0 && sug.main_cast && sug.main_cast.length > 0 && (
                                <span className="text-gray-400"> • </span>
                              )}
                              {sug.main_cast && sug.main_cast.length > 0 && (
                                <span>
                                  Cast: {highlightTextArray(sug.main_cast.slice(0, 3), searchTerm, ', ', 'bg-yellow-200 px-1 py-0.5 rounded font-semibold')}
                                </span>
                              )}
                            </div>
                          </div>
                          {sug.user_status && (
                            <div className="flex-shrink-0">
                              {getStatusIndicator(sug.user_status)}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}