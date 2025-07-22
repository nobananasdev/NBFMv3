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
    icon: '/icons/add to watchlist.svg',
    className: 'bg-[#fbc72c] text-[#292929] font-bold',
    hoverClassName: 'hover:bg-[#e6b429]'
  },
  {
    status: 'not_for_me' as ShowStatus,
    label: 'Not For Me',
    successLabel: 'Bananas! 🍌',
    icon: '/icons/not for me.svg',
    className: 'bg-[#FFFCF5] border border-[#8e8e8e] text-[#292929] font-bold',
    hoverClassName: 'hover:bg-gray-50'
  },
  {
    status: 'liked_it' as ShowStatus,
    label: 'Like It',
    successLabel: 'Liked it! 👍',
    icon: '/icons/like it.svg',
    className: 'bg-[#FFFCF5] border border-[#8e8e8e] text-[#292929] font-bold',
    hoverClassName: 'hover:bg-gray-50'
  },
  {
    status: 'loved_it' as ShowStatus,
    label: 'Love It',
    successLabel: 'Loved it! ❤️',
    icon: '/icons/love it.svg',
    className: 'bg-[#FFFCF5] border border-[#8e8e8e] text-[#292929] font-bold',
    hoverClassName: 'hover:bg-gray-50'
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
      <div className="bg-[#FFFCF5] rounded-[15px] border border-[#8e8e8e] p-8 flex items-center justify-center min-h-[400px]">
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
    <div className="bg-[#FFFCF5] rounded-[15px] border border-[#8e8e8e] p-4 sm:p-6 relative">
      {/* Rating Badge - Top Right */}
      {rating && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-[#f4f4f4] border border-[#8e8e8e] rounded-[20px] px-2 py-1 sm:px-3 sm:py-1 flex items-center gap-1 sm:gap-2 z-10">
          <Image
            src="/icons/star.svg"
            alt="Star"
            width={16}
            height={16}
            className="w-3 h-3 sm:w-4 sm:h-4"
          />
          <span className="font-bold text-[16px] sm:text-[18px] text-[#292929]">
            {rating.value}
          </span>
        </div>
      )}

      {/* Main Content - Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Poster - Top on mobile, Left on desktop */}
        <div className="flex-shrink-0 self-center lg:self-start">
          <div className="w-[180px] h-[260px] sm:w-[200px] sm:h-[280px] lg:w-[240px] lg:h-[320px] rounded-[20px] overflow-hidden bg-gray-100 relative">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={show.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 180px, (max-width: 1024px) 200px, 240px"
                style={{ borderRadius: '20px' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200" style={{ borderRadius: '20px' }}>
                <div className="text-gray-400 text-center">
                  <div className="text-2xl sm:text-3xl mb-2">📺</div>
                  <div className="text-xs sm:text-sm">No Image</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content - Bottom on mobile, Right on desktop */}
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div>
            {/* Title and Year */}
            <div className="mb-3 sm:mb-4">
              <h3 className="font-bold text-[20px] sm:text-[24px] lg:text-[32px] leading-tight text-[#000000] mb-1">
                {show.title}
                {airDate && (
                  <span className="font-normal text-[#7b7b7b] ml-1 sm:ml-2 text-[16px] sm:text-[20px] lg:text-[24px]">
                    ({airDate})
                  </span>
                )}
              </h3>
            </div>

            {/* Genres and Series Info */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[12px] sm:text-[14px]">
                {genreNames.length > 0 && (
                  <span className="font-semibold text-[#000000]">
                    {genreNames.join(', ')}
                  </span>
                )}
                {genreNames.length > 0 && seriesInfo && (
                  <span className="text-[#8e8e8e] hidden sm:inline">•</span>
                )}
                {seriesInfo && (
                  <span className="font-normal text-[#000000]">
                    {seriesInfo}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="mb-4 sm:mb-6">
                <p className="font-normal text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] text-[#000000] line-clamp-3 sm:line-clamp-none">
                  {description}
                </p>
              </div>
            )}

            {/* Creators and Main Cast */}
            {(show.creators && show.creators.length > 0) || (show.main_cast && show.main_cast.length > 0) ? (
              <div className="mb-4 sm:mb-6">
                {show.creators && show.creators.length > 0 && (
                  <div className="mb-2">
                    <span className="font-semibold text-[12px] sm:text-[14px] text-[#000000]">
                      Creators: 
                    </span>
                    <span className="font-normal text-[12px] sm:text-[14px] text-[#000000] ml-1">
                      {show.creators.join(', ')}
                    </span>
                  </div>
                )}
                {show.main_cast && show.main_cast.length > 0 && (
                  <div>
                    <span className="font-semibold text-[12px] sm:text-[14px] text-[#000000]">
                      Cast: 
                    </span>
                    <span className="font-normal text-[12px] sm:text-[14px] text-[#000000] ml-1">
                      {show.main_cast.slice(0, 5).join(', ')}{show.main_cast.length > 5 ? '...' : ''}
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Streaming Providers and IMDB */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {streamingProviders.slice(0, 2).map((provider) => (
                  <div
                    key={provider.provider_id}
                    className="bg-[#f4f4f4] border border-[#8e8e8e] rounded-[20px] px-3 py-1 sm:px-6 sm:py-2 flex items-center gap-2"
                  >
                    <span className="font-semibold text-[10px] sm:text-[12px] text-[#292929]">
                      {provider.provider_name}
                    </span>
                  </div>
                ))}
              </div>

              {/* IMDB Link */}
              <a
                href={buildImdbUrl(show.imdb_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#fbc72c] rounded-[20px] px-4 py-2 sm:px-6 sm:py-2 flex items-center gap-2 hover:bg-[#e6b429] transition-colors self-start sm:self-auto"
              >
                <span className="font-semibold text-[10px] sm:text-[12px] text-[#292929]">
                  IMDB
                </span>
                <Image
                  src="/icons/arrow-up-right.svg"
                  alt="External link"
                  width={16}
                  height={16}
                  className="w-3 h-3 sm:w-4 sm:h-4"
                />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Action Buttons - Below the main content */}
      {showActions && (
        <>
          {/* Divider Line */}
          <div className="border-t border-[#8e8e8e] mt-6 mb-4 sm:mb-6"></div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            {/* Add To Watchlist - Left side, same width as poster */}
            <div className="w-[180px] sm:w-[200px] lg:w-[240px]">
              {ACTION_BUTTONS
                .filter(button => button.status === 'watchlist' && !hiddenActions.includes(button.status))
                .map((button) => {
                  const isUserRated = show.user_status === button.status
                  return (
                    <button
                      key={button.status}
                      onClick={() => handleAction(button.status)}
                      disabled={isProcessing}
                      className={`${button.className} ${button.hoverClassName} rounded-[20px] px-4 py-2 sm:px-6 sm:py-3 flex items-center justify-center gap-2 transition-all duration-200 transform hover:translate-y-1 hover:shadow-lg active:translate-y-2 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''} w-full`}
                    >
                      <Image
                        src={button.icon}
                        alt={button.label}
                        width={20}
                        height={20}
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span className="text-[12px] sm:text-[14px] leading-[18px] sm:leading-[20px] tracking-[1px] font-bold">
                        {button.label}
                      </span>
                      {isUserRated && <span className="ml-1">✓</span>}
                    </button>
                  )
                })}
            </div>

            {/* Rating buttons - Right side */}
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {ACTION_BUTTONS
                .filter(button => button.status !== 'watchlist' && !hiddenActions.includes(button.status))
                .map((button) => {
                  const isUserRated = show.user_status === button.status
                  return (
                    <button
                      key={button.status}
                      onClick={() => handleAction(button.status)}
                      disabled={isProcessing}
                      className={`${button.className} ${button.hoverClassName} rounded-[20px] px-4 py-2 sm:px-6 sm:py-3 flex items-center justify-center gap-2 transition-all duration-200 transform hover:translate-y-1 hover:shadow-lg active:translate-y-2 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Image
                        src={button.icon}
                        alt={button.label}
                        width={20}
                        height={20}
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span className="text-[12px] sm:text-[14px] leading-[18px] sm:leading-[20px] tracking-[1px] font-bold">
                        {button.label}
                      </span>
                      {isUserRated && <span className="ml-1">✓</span>}
                    </button>
                  )
                })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
