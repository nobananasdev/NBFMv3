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
    label: 'Add to Watchlist',
    successLabel: 'Added to Watchlist',
    icon: '➕',
    className: 'bg-blue-500 hover:bg-blue-600 text-white'
  },
  {
    status: 'not_for_me' as ShowStatus,
    label: 'Not For Me',
    successLabel: 'Bananas! 🍌',
    icon: '🚫',
    className: 'bg-red-500 hover:bg-red-600 text-white'
  },
  {
    status: 'liked_it' as ShowStatus,
    label: 'Liked It',
    successLabel: 'Liked it! 👍',
    icon: '👍',
    className: 'bg-green-500 hover:bg-green-600 text-white'
  },
  {
    status: 'loved_it' as ShowStatus,
    label: 'Loved It',
    successLabel: 'Loved it! ❤️',
    icon: '❤️',
    className: 'bg-pink-500 hover:bg-pink-600 text-white'
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

  // Get the best available rating
  const getRating = () => {
    if (show.imdb_rating && show.imdb_rating > 0) {
      return { value: show.imdb_rating.toFixed(1), source: 'IMDb' }
    }
    if (show.tmdb_rating && show.tmdb_rating > 0) {
      return { value: show.tmdb_rating.toFixed(1), source: 'TMDb' }
    }
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
        <div className="absolute top-4 right-4 bg-yellow-400 text-black px-2 py-1 rounded-md text-sm font-bold shadow-sm">
          ⭐ {rating.value}
        </div>
      )}
      
      {/* Desktop: Side-by-side layout */}
      <div className="hidden md:flex gap-6">
        {/* Poster */}
        <div className="flex-shrink-0">
          <div className="w-[200px] h-[300px] relative bg-gray-100 rounded-lg overflow-hidden">
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
            <h3 className="text-2xl font-bold mb-2 leading-tight">
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
              <p className="text-gray-700 mb-4 leading-relaxed">
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
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
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
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                View on IMDb ↗
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              {ACTION_BUTTONS
                .filter(button => !hiddenActions.includes(button.status))
                .map((button) => (
                  <button
                    key={button.status}
                    onClick={() => handleAction(button.status)}
                    disabled={isProcessing}
                    className={`btn px-3 py-2 text-sm font-medium ${button.className} ${
                      isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={!user ? 'Sign up to use this feature' : ''}
                  >
                    <span className="mr-1">{button.icon}</span>
                    {button.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="md:hidden">
        {/* Poster */}
        <div className="mb-4">
          <div className="w-[200px] h-[300px] relative bg-gray-100 rounded-lg overflow-hidden mx-auto">
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
          <h3 className="text-xl font-bold mb-2 leading-tight">
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
            <p className="text-gray-700 mb-4 leading-relaxed">
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
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
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
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              View on IMDb ↗
            </a>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              {ACTION_BUTTONS
                .filter(button => !hiddenActions.includes(button.status))
                .map((button) => (
                  <button
                    key={button.status}
                    onClick={() => handleAction(button.status)}
                    disabled={isProcessing}
                    className={`btn px-3 py-2 text-sm font-medium ${button.className} ${
                      isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={!user ? 'Sign up to use this feature' : ''}
                  >
                    <span className="mr-1">{button.icon}</span>
                    {button.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}