'use client'

import React, { useState, useEffect, memo, useRef } from 'react'
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
  isNewRelease,
  updateUserShowStatus
} from '@/lib/shows'
import { highlightText, highlightTextArray } from '@/lib/textHighlight'
import { isImagePreloaded, getOptimizedImageUrl, generateBlurPlaceholder } from '@/lib/imagePreloader'

interface ShowCardProps {
  show: ShowWithGenres
  onAction?: (show: ShowWithGenres, status: ShowStatus) => void
  hiddenActions?: ShowStatus[]
  showActions?: boolean
  priority?: boolean
  searchQuery?: string
}

const ACTION_BUTTONS = [
  {
    status: 'watchlist' as ShowStatus,
    label: 'Add To Watchlist',
    successLabel: 'Added to Watchlist',
    icon: '/icons/add to watchlist.svg',
    // Yellow-orange gradient similar to navigation watchlist button
    className: 'action-btn watchlist-btn',
    hoverClassName: ''
  },
  {
    status: 'not_for_me' as ShowStatus,
    label: 'Not For Me',
    successLabel: 'Bananas! 🍌',
    icon: '/icons/not for me.svg',
    // Worst rating - red accent glass
    className: 'action-btn rate-bad ',
    hoverClassName: ''
  },
  {
    status: 'liked_it' as ShowStatus,
    label: 'Like It',
    successLabel: 'Liked it! 👍',
    icon: '/icons/like it.svg',
    // Mid rating - amber accent glass
    className: 'action-btn rate-mid ',
    hoverClassName: ''
  },
  {
    status: 'loved_it' as ShowStatus,
    label: 'Love It',
    successLabel: 'Loved it! ❤️',
    icon: '/icons/love it.svg',
    // Best rating - green accent glass
    className: 'action-btn rate-good ',
    hoverClassName: ''
  }
]

function ShowCardComponent({ show, onAction, hiddenActions = [], showActions = true, priority = false, searchQuery }: ShowCardProps) {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionResult, setActionResult] = useState<{
    status: ShowStatus
    label: string
  } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldFadeOut, setShouldFadeOut] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [shouldFadeOutSuccess, setShouldFadeOutSuccess] = useState(false)
  
  // Image loading states
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [shouldLoadImage, setShouldLoadImage] = useState(true)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const posterUrl = getPosterUrl(show)
  const streamingProviders = filterStreamingProviders(show)
  const airDate = formatAirDate(show.first_air_date)
  const seriesInfo = formatSeriesInfo(show)
  const description = getShowDescription(show)
  const genreNames = show.genre_names || []
  const isNew = isNewRelease(show.first_air_date)
  
  // Get optimized image URL and generate blur placeholder
  const optimizedUrl = posterUrl ? getOptimizedImageUrl(posterUrl) : null
  const isPreloaded = optimizedUrl ? isImagePreloaded(optimizedUrl) : false
  
  // Use DB-provided tiny thumb if available, otherwise generate blur placeholder
  const blurDataURL = (show as any).poster_thumb_url as string | undefined ||
    (typeof window !== 'undefined' ? generateBlurPlaceholder() : undefined)

  // Check if image is preloaded and set loaded state
  useEffect(() => {
    if (optimizedUrl && isPreloaded && !imageLoaded) {
      console.log('📸 [ShowCard] Using preloaded optimized image for:', show.name)
      setImageLoaded(true)
      setShouldLoadImage(true)
      setCurrentImageUrl(optimizedUrl)
    }
  }, [optimizedUrl, isPreloaded, imageLoaded, show.name])

  // Remove lazy loading - load all images immediately
  useEffect(() => {
    setShouldLoadImage(true)
  }, [])

  // Show a rating consistent with sorting fallback: our_score → imdb_rating → vote_average
  const getRating = () => {
    if (show.our_score && show.our_score > 0) {
      return { value: show.our_score.toFixed(1), source: 'Our' }
    }
    if ((show as any).imdb_rating && (show as any).imdb_rating > 0) {
      return { value: (show as any).imdb_rating.toFixed(1), source: 'IMDb' }
    }
    if ((show as any).vote_average && (show as any).vote_average > 0) {
      return { value: (show as any).vote_average.toFixed(1), source: 'TMDB' }
    }
    return null
  }

  const rating = getRating()

  const handleAction = async (status: ShowStatus) => {
    if (!user) {
      alert('Sign up to use this feature')
      return
    }

    if (isProcessing || isAnimating) return

    setIsProcessing(true)
    setIsAnimating(true)

    // Start fade out animation
    setShouldFadeOut(true)

    try {
      const { error } = await updateUserShowStatus(user.id, show.imdb_id, status)
      
      if (error) {
        console.error('Error updating show status:', error)
        alert('Something went wrong. Please try again.')
        setShouldFadeOut(false)
        setIsAnimating(false)
        setIsProcessing(false)
        return
      }

      const button = ACTION_BUTTONS.find(btn => btn.status === status)
      if (button) {
        // Wait for fade out animation to complete before showing success
        setTimeout(() => {
          setActionResult({
            status,
            label: button.successLabel
          })
          setShouldFadeOut(false)
          setShowSuccessMessage(true)
          
          // Start fading out success message after showing it
          setTimeout(() => {
            setShouldFadeOutSuccess(true)
            
            // Remove card completely after success message fade out
            setTimeout(() => {
              onAction?.(show, status)
            }, 400) // Wait for success fade out animation
          }, 1200) // Show success message for 1.2 seconds
        }, 300) // Match the CSS transition duration
      }
    } catch (error) {
      console.error('Error in handleAction:', error)
      alert('Something went wrong. Please try again.')
      setShouldFadeOut(false)
      setIsAnimating(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const buildImdbUrl = (imdbId: string) => {
    return `https://www.imdb.com/title/${imdbId}/`
  }

  if (actionResult) {
    return (
      <div className={`
        show-card-modern p-4 flex items-center justify-center min-h-[320px]
        transition-all duration-500 ease-out
        ${showSuccessMessage && !shouldFadeOutSuccess
          ? 'opacity-100 scale-100 animate-success-bounce'
          : shouldFadeOutSuccess
            ? 'opacity-0 scale-95 transform -translate-y-4'
            : 'opacity-0 scale-95'
        }
      `}>
        <div className="text-center">
          <div className="text-3xl font-bold gradient-text mb-4">
            {actionResult.label}
          </div>
          <div className="text-lg text-white/70">
            {show.name}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`show-card-modern p-3 lg:p-5 relative group transition-all duration-500 ease-out min-h-[320px] ${shouldFadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      {/* Rating Badge */}
      {rating && (
        <div className="rating-badge">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-bold text-white text-sm sm:text-base">
              {rating.value}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
        {/* Poster Section */}
        <div className="flex-shrink-0 self-center lg:self-start">
          <div
            ref={imageRef}
            className="relative w-[140px] h-[210px] sm:w-[160px] sm:h-[240px] lg:w-[200px] lg:h-[300px] rounded-3xl overflow-hidden group-hover:shadow-lg transition-all duration-300"
          >
            {/* NEW badge (visible for 1 month after release) */}
            {isNew && (
              <div className="new-badge absolute top-2 left-2 z-10 tracking-wider">
                NEW
              </div>
            )}
            {/* Enhanced blur placeholder */}
            <div className={`
              absolute inset-0 transition-opacity duration-500 rounded-3xl
              ${(imageLoaded || isPreloaded || imageError) ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}>
              {blurDataURL ? (
                <img
                  src={blurDataURL}
                  alt=""
                  className="w-full h-full object-cover blur-sm rounded-3xl"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-3xl">
                  <div className="absolute inset-0 skeleton rounded-3xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/40 text-center">
                        <div className="text-4xl mb-4">📺</div>
                        <div className="text-sm">Loading...</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Loading progress indicator */}
              <div className="absolute bottom-4 left-4 right-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse rounded-full w-1/3"></div>
              </div>
            </div>

            {/* Main Image */}
            {optimizedUrl && shouldLoadImage && !imageError ? (
              <Image
                src={optimizedUrl}
                alt={show.name}
                fill
                className={`
                  crisp-image object-cover transition-all duration-500 rounded-3xl
                  ${imageLoaded || isPreloaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                `}
                sizes="(max-width: 640px) 140px, (max-width: 1024px) 160px, 200px"
                quality={90}
                priority={priority}
                fetchPriority={priority ? 'high' : 'auto'}
                placeholder={blurDataURL ? 'blur' : 'empty'}
                blurDataURL={blurDataURL}
                onLoad={() => {
                  setImageLoaded(true)
                  setCurrentImageUrl(optimizedUrl)
                  console.log('📸 [ShowCard] Image loaded successfully for:', show.name)
                }}
                onError={(error) => {
                  console.warn('📸 [ShowCard] Image load error for:', show.name, error)
                  if (optimizedUrl !== posterUrl && posterUrl) {
                    console.log('📸 [ShowCard] Trying fallback to original URL for:', show.name)
                    setCurrentImageUrl(posterUrl)
                  } else {
                    setImageError(true)
                    setImageLoaded(true)
                  }
                }}
              />
            ) : currentImageUrl && currentImageUrl !== optimizedUrl && !imageError ? (
              // Fallback image
              <Image
                src={currentImageUrl}
                alt={show.name}
                fill
                className={`
                  crisp-image object-cover transition-all duration-500 rounded-3xl
                  ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                `}
                sizes="(max-width: 640px) 140px, (max-width: 1024px) 160px, 200px"
                quality={80}
                priority={priority}
                fetchPriority={priority ? 'high' : 'auto'}
                placeholder={blurDataURL ? 'blur' : 'empty'}
                blurDataURL={blurDataURL}
                onLoad={() => {
                  setImageLoaded(true)
                  console.log('📸 [ShowCard] Fallback image loaded for:', show.name)
                }}
                onError={() => {
                  console.warn('📸 [ShowCard] Fallback image also failed for:', show.name)
                  setImageError(true)
                  setImageLoaded(true)
                }}
              />
            ) : (!optimizedUrl || imageError) ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl">
                <div className="text-white/50 text-center">
                  <div className="text-4xl mb-4">📺</div>
                  <div className="text-sm font-medium">Image Unavailable</div>
                </div>
              </div>
            ) : null}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between text-center lg:text-left min-h-[200px] lg:min-h-[260px]">
          <div className="space-y-2 lg:space-y-3">
            {/* Title and Year */}
            <div className="lg:pr-20">
              <h3 className="font-bold lg:font-semibold text-xl sm:text-2xl lg:text-[27px] leading-tight text-white mb-1">
                {searchQuery ? highlightText(show.name, searchQuery, 'bg-yellow-400 text-black px-1 rounded font-bold') : show.name}
                {airDate && (
                  <span className="font-normal text-gray-300 ml-2 text-base sm:text-lg lg:text-xl">
                    ({airDate})
                  </span>
                )}
              </h3>
            </div>

            {/* Genres and Series Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center lg:justify-start gap-2 text-sm lg:text-base">
              {genreNames.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {genreNames.slice(0, 3).map((genre, index) => (
                    <span key={index} className="px-3 py-1 rounded-xl bg-white/20 text-white text-xs font-medium">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              {seriesInfo && (
                <span className="text-gray-300 font-medium">
                  {seriesInfo}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-gray-200 text-sm lg:text-base leading-relaxed line-clamp-2">
                {description}
              </p>
            )}

            {/* Creators and Cast */}
            {(show.creators && show.creators.length > 0) || (show.main_cast && show.main_cast.length > 0) ? (
              <div className="space-y-2">
                {show.creators && show.creators.length > 0 && (
                  <div>
                    <span className="font-semibold text-white text-sm">Creators: </span>
                    <span className="text-gray-300 text-sm">
                      {searchQuery ? highlightTextArray(show.creators, searchQuery, ', ', 'bg-yellow-400 text-black px-1 rounded font-semibold') : show.creators.join(', ')}
                    </span>
                  </div>
                )}
                {show.main_cast && show.main_cast.length > 0 && (
                  <div>
                    <span className="font-semibold text-white text-sm">Cast: </span>
                    <span className="text-gray-300 text-sm">
                      {searchQuery ? (
                        <>
                          {highlightTextArray(show.main_cast.slice(0, 4), searchQuery, ', ', 'bg-yellow-400 text-black px-1 rounded font-semibold')}
                          {show.main_cast.length > 4 ? '...' : ''}
                        </>
                      ) : (
                        <>
                          {show.main_cast.slice(0, 4).join(', ')}{show.main_cast.length > 4 ? '...' : ''}
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Streaming Providers and IMDB */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {streamingProviders.slice(0, 2).map((provider) => (
                  <div key={provider.provider_id} className="provider-badge">
                    {provider.provider_name}
                  </div>
                ))}
              </div>

              {/* IMDB Link */}
              <a
                href={buildImdbUrl(show.imdb_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn group inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg whitespace-nowrap self-center sm:self-start lg:self-auto"
              >
                <span className="font-semibold">IMDB</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <>
          {/* Divider */}
          <div className="border-t border-white/20 mt-3 lg:mt-4 mb-3 lg:mb-4"></div>
          
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
            {/* Primary Action - Watchlist */}
            <div className="mx-auto lg:mx-0">
              {ACTION_BUTTONS
                .filter(button => button.status === 'watchlist' && !hiddenActions.includes(button.status))
                .map((button) => {
                  const isUserRated = show.user_status === button.status
                  return (
                    <button
                      key={button.status}
                      onClick={() => handleAction(button.status)}
                      disabled={isProcessing}
                      className={`
                        ${button.className} ${button.hoverClassName} group text-sm w-[200px]
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                        transition-all duration-300 px-3 py-2 rounded-lg whitespace-nowrap
                      `}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <Image
                          src={button.icon}
                          alt={button.label}
                          width={16}
                          height={16}
                          className="w-4 h-4 brightness-0 invert"
                        />
                        <span className="font-bold">
                          {button.label}
                        </span>
                        {isUserRated && <span>✓</span>}
                      </div>
                    </button>
                  )
                })}
            </div>

            {/* Rating Buttons */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
              {ACTION_BUTTONS
                .filter(button => button.status !== 'watchlist' && !hiddenActions.includes(button.status))
                .map((button) => {
                  const isUserRated = show.user_status === button.status
                  return (
                    <button
                      key={button.status}
                      onClick={() => handleAction(button.status)}
                      disabled={isProcessing}
                      className={`
                        ${button.className} ${button.hoverClassName} group text-sm
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                        transition-all duration-300 px-3 py-2 rounded-lg whitespace-nowrap overflow-hidden
                      `}
                      >
                      <div className="flex items-center gap-2">
                        <Image
                          src={button.icon}
                          alt={button.label}
                          width={16}
                          height={16}
                          className="w-4 h-4 brightness-0 invert"
                        />
                        <span className="font-bold truncate">
                          {button.label}
                        </span>
                        {isUserRated && <span>✓</span>}
                      </div>
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

function arraysEqual(a: ShowStatus[] = [], b: ShowStatus[] = []) {
  if (a === b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function arePropsEqual(prev: ShowCardProps, next: ShowCardProps) {
  return (
    prev.show === next.show &&
    prev.showActions === next.showActions &&
    arraysEqual(prev.hiddenActions, next.hiddenActions) &&
    prev.onAction === next.onAction &&
    prev.searchQuery === next.searchQuery
  )
}

export default memo(ShowCardComponent, arePropsEqual)
