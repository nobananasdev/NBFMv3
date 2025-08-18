'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShowWithGenres } from '@/lib/shows'
import { getPosterUrl, formatSeasonInfo } from '@/lib/shows'

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

  useEffect(() => {
    setDisplayedShows(shows)
  }, [shows])

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="w-[30px] h-[45px] bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
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
        <div className="card p-6 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">
            We couldn&apos;t load the new seasons. Please try again later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
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
        <div className="card p-6 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 7v11h6V7H9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No new seasons</h3>
          <p className="text-gray-600">
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

          return (
            <div key={show.imdb_id} className="card p-4 relative">
              <div className="flex items-center gap-4">
                {/* Small Poster with optimized loading */}
                <div className="flex-shrink-0 w-[30px] h-[45px] relative bg-gray-100 rounded overflow-hidden">
                  {posterUrl ? (
                    <Image
                      src={posterThumb || posterUrl}
                      alt={show.name}
                      fill
                      className="object-cover"
                      sizes="30px"
                      quality={50}
                      priority={index < 5}
                      placeholder={posterThumb ? 'blur' : 'empty'}
                      blurDataURL={posterThumb}
                      loading={index < 5 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <div className="text-gray-400 text-xs">📺</div>
                    </div>
                  )}
                </div>

                {/* Show Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[20px] font-bold mb-1 leading-normal text-black truncate" style={{ letterSpacing: '0.6px' }}>
                    {show.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <span className={`font-medium ${isUpcoming ? 'text-blue-600' : 'text-green-600'}`}>
                      {seasonText}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{airDate}</span>
                  </div>
                  {isUpcoming && (
                    <div className="text-xs text-blue-600">
                      Upcoming
                    </div>
                  )}
                  {!isUpcoming && (
                    <div className="text-xs text-green-600">
                      Recently Released
                    </div>
                  )}
                </div>

                {/* IMDb Link */}
                <div className="flex-shrink-0">
                  <a
                    href={`https://www.imdb.com/title/${show.imdb_id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center font-sans hover:text-blue-800"
                    style={{
                      color: '#000',
                      fontSize: '14px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '20px',
                      letterSpacing: '0.42px'
                    }}
                  >
                    IMDB ↗
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}