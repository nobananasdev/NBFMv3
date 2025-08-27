'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShowWithGenres } from '@/lib/shows'
import { getPosterUrl, formatSeasonInfo } from '@/lib/shows'
import ShowCard from './ShowCard'

interface NewSeasonsListProps {
  shows: ShowWithGenres[]
  loading?: boolean
  error?: any
  emptyMessage?: string
  className?: string
}

export default function NewSeasonsList({
  shows,
  loading,
  error,
  emptyMessage = 'No new seasons found',
  className = ''
}: NewSeasonsListProps) {
  const [displayedShows, setDisplayedShows] = useState<ShowWithGenres[]>(shows)
  const [expandedShowId, setExpandedShowId] = useState<string | null>(null)

  useEffect(() => {
    setDisplayedShows(shows)
  }, [shows])

  const handleShowClick = (imdbId: string) => {
    setExpandedShowId(expandedShowId === imdbId ? null : imdbId)
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-card p-6 flex items-center gap-4">
              <div className="w-[30px] h-[45px] skeleton"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton w-3/4"></div>
                <div className="h-3 skeleton w-1/2"></div>
                <div className="h-3 skeleton w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="glass-card p-8 text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Something went wrong</h3>
          <p className="text-gray-300 mb-6">
            We couldn&apos;t load the new seasons. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-modern"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (displayedShows.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="glass-card p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 7v11h6V7H9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">No new seasons</h3>
          <p className="text-gray-300">
            {emptyMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-4">
        {displayedShows.map((show, index) => {
          const posterUrl = getPosterUrl(show)
          const posterThumb = (show as any).poster_thumb_url as string | undefined
          const { seasonText, airDate, isUpcoming } = formatSeasonInfo(show)

          const isExpanded = expandedShowId === show.imdb_id

          return (
            <div
              key={show.imdb_id}
              className={`glass-card relative group cursor-pointer transition-all duration-500 ease-out ${
                isExpanded
                  ? 'p-0 ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/20'
                  : 'p-6 hover:scale-[1.02] hover:shadow-xl'
              }`}
              onClick={() => handleShowClick(show.imdb_id)}
            >
              {/* Compact View */}
              <div className={`transition-all duration-500 ease-out ${isExpanded ? 'p-6 pb-4' : ''}`}>
                <div className="flex items-center gap-6">
                  {/* Small Poster with optimized loading */}
                  <div className={`flex-shrink-0 relative bg-gray-800 rounded-lg overflow-hidden transition-all duration-500 ease-out ${
                    isExpanded ? 'w-[60px] h-[90px]' : 'w-[40px] h-[60px]'
                  }`}>
                    {posterUrl ? (
                      <Image
                        src={posterThumb || posterUrl}
                        alt={show.name}
                        fill
                        className="object-cover crisp-image"
                        sizes={isExpanded ? "60px" : "40px"}
                        quality={75}
                        priority={index < 5}
                        placeholder={posterThumb ? 'blur' : 'empty'}
                        blurDataURL={posterThumb}
                        loading={index < 5 ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <div className="text-gray-400 text-sm">📺</div>
                      </div>
                    )}
                  </div>

                  {/* Show Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold mb-2 leading-tight text-white transition-all duration-500 ease-out ${
                      isExpanded ? 'text-2xl' : 'text-xl truncate'
                    }`}>
                      {show.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm mb-2">
                      <span className={`font-semibold px-2 py-1 rounded-lg ${
                        isUpcoming
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}>
                        {seasonText}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-300">{airDate}</span>
                    </div>
                    <div className={`text-xs font-medium ${
                      isUpcoming ? 'text-blue-400' : 'text-green-400'
                    }`}>
                      {isUpcoming ? 'Upcoming' : 'Recently Released'}
                    </div>
                  </div>

                  {/* Expand/Collapse Icon and IMDb Link */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {/* IMDb Link */}
                    <a
                      href={`https://www.imdb.com/title/${show.imdb_id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass border border-white/20 hover:bg-white/15 text-white px-4 py-2 rounded-xl text-sm font-semibold group inline-flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>IMDB</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    
                    {/* Expand/Collapse Icon */}
                    <div className="text-white/60 hover:text-white transition-colors">
                      <svg
                        className={`w-6 h-6 transition-transform duration-500 ease-out ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details - Smooth Height Transition */}
              <div className={`overflow-hidden transition-all duration-500 ease-out ${
                isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-6 pb-6">
                  {/* Divider */}
                  <div className="border-t border-white/20 mb-6"></div>
                  
                  {/* Additional Show Details */}
                  <div className="space-y-4">
                    {/* Description */}
                    {show.overview && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Overview</h4>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {show.overview}
                        </p>
                      </div>
                    )}

                    {/* Genres */}
                    {show.genre_names && show.genre_names.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Genres</h4>
                        <div className="flex flex-wrap gap-2">
                          {show.genre_names.map((genre, genreIndex) => (
                            <span key={genreIndex} className="px-3 py-1 rounded-xl bg-white/20 text-white text-xs font-medium">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Creators and Cast */}
                    {((show.creators && show.creators.length > 0) || (show.main_cast && show.main_cast.length > 0)) && (
                      <div className="space-y-2">
                        {show.creators && show.creators.length > 0 && (
                          <div>
                            <span className="font-semibold text-white text-sm">Creators: </span>
                            <span className="text-gray-300 text-sm">
                              {show.creators.join(', ')}
                            </span>
                          </div>
                        )}
                        {show.main_cast && show.main_cast.length > 0 && (
                          <div>
                            <span className="font-semibold text-white text-sm">Cast: </span>
                            <span className="text-gray-300 text-sm">
                              {show.main_cast.slice(0, 4).join(', ')}{show.main_cast.length > 4 ? '...' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rating */}
                    {show.our_score && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Rating</h4>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-bold text-white text-lg">
                            {show.our_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}