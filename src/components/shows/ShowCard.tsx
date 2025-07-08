'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShowWithGenres } from '@/lib/shows'
import { ShowStatus } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { 
  filterStreamingProviders, 
  formatAirDate, 
  formatSeriesInfo, 
  getShowDescription,
  getPosterUrl,
  updateUserShowStatus
} from '@/lib/shows'

interface ShowCardProps {
  show: ShowWithGenres
  onAction?: (show: ShowWithGenres, status: ShowStatus) => void
  hiddenActions?: ShowStatus[]
  showActions?: boolean
}

const ACTION_BUTTONS = [
  {
    status: 'watchlist' as ShowStatus,
    label: 'Add To Watchlist',
    successLabel: 'Added to Watchlist',
    icon: '➕',
    className: 'bg-white border-black text-black hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 hover:shadow-blue-300'
  },
  {
    status: 'not_for_me' as ShowStatus,
    label: 'Not For Me',
    successLabel: 'Bananas! 🍌',
    icon: '⛔',
    className: 'bg-white border-black text-black hover:bg-red-50 hover:border-red-500 hover:text-red-600 hover:shadow-red-300'
  },
  {
    status: 'liked_it' as ShowStatus,
    label: 'OK',
    successLabel: 'Liked it! 👍',
    icon: '👍🏿',
    className: 'bg-white border-black text-black hover:bg-green-50 hover:border-green-500 hover:text-green-600 hover:shadow-green-300'
  },
  {
    status: 'loved_it' as ShowStatus,
    label: 'Love It',
    successLabel: 'Loved it! ❤️',
    icon: '🖤',
    className: 'bg-white border-black text-black hover:bg-pink-50 hover:border-pink-500 hover:text-pink-600 hover:shadow-pink-300'
  }
]

export default function ShowCard({ show, onAction, hiddenActions = [], showActions = true }: ShowCardProps) {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionResult, setActionResult] = useState<{
    status: ShowStatus
    label: string
  } | null>(null)


  const posterUrl = getPosterUrl(show)
  const streamingProviders = filterStreamingProviders(show)
  const airDate = formatAirDate(show.first_air_date)
  const seriesInfo = formatSeriesInfo(show)
  const description = getShowDescription(show)
  const genreNames = show.genre_names || []

  // Get only our_score rating
  const getRating = () => {
    if (show.our_score && show.our_score > 0) {
      return { value: show.our_score.toFixed(1), source: 'Our' }
    }
    return null
  }

  const rating = getRating()

  const handleAction = async (status: ShowStatus) => {
    if (!user) {
      // Show tooltip for unauthenticated users
      alert('Sign up to use this feature')
      return
    }

    if (isProcessing) return

    setIsProcessing(true)

    try {
      const { error } = await updateUserShowStatus(user.id, show.imdb_id, status)
      
      if (error) {
        console.error('Error updating show status:', error)
        alert('Something went wrong. Please try again.')
        return
      }

      const button = ACTION_BUTTONS.find(btn => btn.status === status)
      if (button) {
        setActionResult({
          status,
          label: button.successLabel
        })

        // Call onAction callback for parent component to handle card removal
        setTimeout(() => {
          onAction?.(show, status)
        }, 1500)
      }
    } catch (error) {
      console.error('Error in handleAction:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const buildImdbUrl = (imdbId: string) => {
    return `https://www.imdb.com/title/${imdbId}/`
  }

  if (actionResult) {
    return (
      <div className="card min-h-[320px] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {actionResult.label}
          </div>
          <div className="text-sm text-gray-600">
            {show.title}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card min-h-[320px] p-6 relative">
      {/* Rating Badge - Top Right */}
      {rating && (
        <div
          className="absolute top-4 right-4 flex flex-col justify-center items-center flex-shrink-0 font-sans text-black font-bold"
          style={{
            width: '58px',
            height: '58px',
            padding: '10px 30px',
            gap: '-4px',
            borderRadius: '10px',
            border: '1px solid #000',
            
            fontSize: '16px',
            lineHeight: '30px',
            letterSpacing: '0.48px'
          }}
          title="This is the overall rating for this series"
        >
          {rating.value}
        </div>
      )}
      
      {/* Desktop: Side-by-side layout */}
      <div className="hidden md:flex gap-6">
        {/* Poster */}
        <div className="flex-shrink-0">
          <div className="w-[200px] h-[300px] relative bg-gray-100 rounded-lg overflow-hidden" style={{ position: 'relative' }}>
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={show.title}
                fill
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-gray-400 text-center">
                  <div className="text-2xl mb-2">📺</div>
                  <div className="text-sm">No Image</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            {/* Title */}
            <h3 className="text-[28px] font-bold mb-2 leading-normal text-black" style={{ letterSpacing: '0.96px' }}>
              {show.title}
            </h3>

            {/* Metadata */}
            <div className="text-gray-600 mb-3">
              {airDate && genreNames.length > 0 && (
                <span>{airDate} • {genreNames.join(', ')}</span>
              )}
              {airDate && genreNames.length === 0 && (
                <span>{airDate}</span>
              )}
              {!airDate && genreNames.length > 0 && (
                <span>{genreNames.join(', ')}</span>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 mb-3"></div>

            {/* Series Info */}
            <div className="text-sm font-medium text-gray-700 mb-3">
              {seriesInfo}
            </div>

            {/* Plot */}
            {description && (
              <p className="text-base font-normal mb-4 text-black" style={{ fontSize: '16px', fontWeight: 400, lineHeight: '30px', letterSpacing: '0.48px', color: '#000' }}>
                {description}
              </p>
            )}

            {/* Streaming Providers */}
            {streamingProviders.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Streaming on:
                </div>
                <div className="flex flex-wrap gap-2">
                  {streamingProviders.map((provider) => (
                    <span
                      key={provider.provider_id}
                      className="inline-flex justify-center items-center gap-2 text-white text-xs font-medium"
                      style={{
                        display: 'inline-flex',
                        padding: '6px 20px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        borderRadius: '8px',
                        background: '#020202'
                      }}
                    >
                      {provider.provider_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* IMDb Link */}
            <div className="mb-4">
              <a
                href={buildImdbUrl(show.imdb_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center font-sans hover:text-blue-800"
                style={{
                  color: '#000',
                  fontSize: '16px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: '30px',
                  letterSpacing: '0.48px'
                }}
              >
                IMDB ↗
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
              {ACTION_BUTTONS
                .filter(button => !hiddenActions.includes(button.status))
                .map((button) => {
                  // Check if this button matches the user's rating
                  const isUserRated = show.user_status === button.status
                  
                  return (
                    <button
                      key={button.status}
                      onClick={() => handleAction(button.status)}
                      disabled={isProcessing}
                      className={`group rounded-[10px] border transition-all duration-300 ease-out font-bold text-xs leading-[30px] tracking-[0.36px] transform hover:scale-105 hover:-translate-y-1 ${button.className} ${
                        isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={{
                        display: 'inline-flex',
                        padding: '10px 30px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: isUserRated
                          ? '3px 3px 0px 0px #FFE38F'
                          : '3px 3px 0px 0px #000',
                        transition: 'all 0.3s ease-out'
                      }}
                      onMouseEnter={(e) => {
                        if (!isProcessing) {
                          const shadowColor = button.className.includes('hover:shadow-blue') ? '#93C5FD' :
                                            button.className.includes('hover:shadow-red') ? '#FCA5A5' :
                                            button.className.includes('hover:shadow-green') ? '#86EFAC' :
                                            button.className.includes('hover:shadow-pink') ? '#F9A8D4' : '#000';
                          e.currentTarget.style.boxShadow = `5px 5px 0px 0px ${shadowColor}`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isProcessing) {
                          e.currentTarget.style.boxShadow = isUserRated
                            ? '3px 3px 0px 0px #FFE38F'
                            : '3px 3px 0px 0px #000';
                        }
                      }}
                      title={!user ? 'Sign up to use this feature' : isUserRated ? `You rated this: ${button.label}` : ''}
                    >
                      <span className="mr-1 transition-transform duration-300 group-hover:scale-110">{button.icon}</span>
                      {button.label}
                      {isUserRated && <span className="ml-1">✓</span>}
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="md:hidden">
        {/* Poster */}
        <div className="mb-4">
          <div className="w-[200px] h-[300px] relative bg-gray-100 rounded-lg overflow-hidden mx-auto" style={{ position: 'relative' }}>
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={show.title}
                fill
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-gray-400 text-center">
                  <div className="text-2xl mb-2">📺</div>
                  <div className="text-sm">No Image</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          {/* Title */}
          <h3 className="text-[28px] font-bold mb-2 leading-normal text-black text-center" style={{ letterSpacing: '0.96px' }}>
            {show.title}
          </h3>

          {/* Metadata */}
          <div className="text-gray-600 mb-3 text-center">
            {airDate && genreNames.length > 0 && (
              <span>{airDate} • {genreNames.join(', ')}</span>
            )}
            {airDate && genreNames.length === 0 && (
              <span>{airDate}</span>
            )}
            {!airDate && genreNames.length > 0 && (
              <span>{genreNames.join(', ')}</span>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-3"></div>

          {/* Series Info */}
          <div className="text-sm font-medium text-gray-700 mb-3 text-center">
            {seriesInfo}
          </div>

          {/* Plot */}
          {description && (
            <p className="text-base font-normal mb-4 text-black text-center" style={{ fontSize: '16px', fontWeight: 400, lineHeight: '30px', letterSpacing: '0.48px', color: '#000' }}>
              {description}
            </p>
          )}

          {/* Streaming Providers */}
          {streamingProviders.length > 0 && (
            <div className="mb-4 text-center">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Streaming on:
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {streamingProviders.map((provider) => (
                  <span
                    key={provider.provider_id}
                    className="inline-flex justify-center items-center gap-2 text-white text-xs font-medium"
                    style={{
                      display: 'inline-flex',
                      padding: '6px 20px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '10px',
                      borderRadius: '8px',
                      background: '#020202'
                    }}
                  >
                    {provider.provider_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* IMDb Link */}
          <div className="mb-4 text-center">
            <a
              href={buildImdbUrl(show.imdb_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center font-sans hover:text-blue-800"
              style={{
                color: '#000',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '30px',
                letterSpacing: '0.48px'
              }}
            >
              IMDB ↗
            </a>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100 justify-center">
              {ACTION_BUTTONS
                .filter(button => !hiddenActions.includes(button.status))
                .map((button) => {
                  // Check if this button matches the user's rating
                  const isUserRated = show.user_status === button.status
                  
                  return (
                    <button
                      key={button.status}
                      onClick={() => handleAction(button.status)}
                      disabled={isProcessing}
                      className={`group rounded-[10px] border transition-all duration-300 ease-out font-bold text-xs leading-[30px] tracking-[0.36px] transform hover:scale-105 hover:-translate-y-1 ${button.className} ${
                        isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={{
                        display: 'inline-flex',
                        padding: '10px 30px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: isUserRated
                          ? '3px 3px 0px 0px #FFE38F'
                          : '3px 3px 0px 0px #000',
                        transition: 'all 0.3s ease-out'
                      }}
                      onMouseEnter={(e) => {
                        if (!isProcessing) {
                          const shadowColor = button.className.includes('hover:shadow-blue') ? '#93C5FD' :
                                            button.className.includes('hover:shadow-red') ? '#FCA5A5' :
                                            button.className.includes('hover:shadow-green') ? '#86EFAC' :
                                            button.className.includes('hover:shadow-pink') ? '#F9A8D4' : '#000';
                          e.currentTarget.style.boxShadow = `5px 5px 0px 0px ${shadowColor}`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isProcessing) {
                          e.currentTarget.style.boxShadow = isUserRated
                            ? '3px 3px 0px 0px #FFE38F'
                            : '3px 3px 0px 0px #000';
                        }
                      }}
                      title={!user ? 'Sign up to use this feature' : isUserRated ? `You rated this: ${button.label}` : ''}
                    >
                      <span className="mr-1 transition-transform duration-300 group-hover:scale-110">{button.icon}</span>
                      {button.label}
                      {isUserRated && <span className="ml-1">✓</span>}
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}