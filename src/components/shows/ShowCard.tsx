'use client'

import React, { useState, useEffect, memo, useRef } from 'react'
import Image from 'next/image'
import { ShowWithGenres } from '@/lib/shows'
import { ShowStatus } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigation } from '@/contexts/NavigationContext'
import {
  filterStreamingProviders,
  formatAirDate,
  getShowDescription,
  getPosterUrl,
  updateUserShowStatus
} from '@/lib/shows'
import { highlightText } from '@/lib/textHighlight'
import { isImagePreloaded, getOptimizedImageUrl, generateBlurPlaceholder } from '@/lib/imagePreloader'

interface ShowCardProps {
  show: ShowWithGenres
  onAction?: (show: ShowWithGenres, status: ShowStatus) => void
  hiddenActions?: ShowStatus[]
  showActions?: boolean
  showDescription?: boolean
  compact?: boolean
  priority?: boolean
  searchQuery?: string
  extraContent?: React.ReactNode
}

type ActionButtonConfig = {
  status: ShowStatus
  label: string
  successLabel: string
}

const ACTION_BUTTONS: ActionButtonConfig[] = [
  {
    status: 'watchlist',
    label: 'Add To Watchlist',
    successLabel: 'Added to Watchlist'
  },
  {
    status: 'not_for_me',
    label: 'Not for me',
    successLabel: 'Bananas! 🍌'
  },
  {
    status: 'liked_it',
    label: 'Like',
    successLabel: 'Liked it! 👍'
  },
  {
    status: 'loved_it',
    label: 'Loved',
    successLabel: 'Loved it! ❤️'
  }
]

const PROVIDER_LOOKUP: Array<{ keywords: string[]; label: string; className: string; asset?: string }> = [
  { keywords: ['netflix'], label: 'NETFLIX', className: 'logo-netflix', asset: '/streamers/netflix.png' },
  { keywords: ['prime', 'amazon'], label: 'PRIME VIDEO', className: 'logo-prime', asset: '/streamers/primevideo.png' },
  { keywords: ['disney'], label: 'DISNEY+', className: 'logo-disney', asset: '/streamers/disney+.png' },
  { keywords: ['apple'], label: 'APPLE TV+', className: 'logo-apple', asset: '/streamers/appletv.png' },
  { keywords: ['hulu'], label: 'HULU', className: 'logo-hulu', asset: '/streamers/hulu.png' },
  { keywords: ['hbo', 'max'], label: 'HBO MAX', className: 'logo-hbo', asset: '/streamers/hbomax.png' },
  { keywords: ['paramount'], label: 'PARAMOUNT+', className: 'logo-paramount', asset: '/streamers/paramount+.png' },
  { keywords: ['peacock'], label: 'PEACOCK', className: 'logo-peacock', asset: '/streamers/peacock.png' },
  { keywords: ['amc'], label: 'AMC+', className: 'logo-generic', asset: '/streamers/amc+.png' },
  { keywords: ['britbox'], label: 'BRITBOX', className: 'logo-generic', asset: '/streamers/britbox.png' },
  { keywords: ['rakuten'], label: 'RAKUTEN', className: 'logo-generic', asset: '/streamers/rakuten.png' }
]

const ACTION_ICON_MAP: Record<ShowStatus, { src: string; alt: string }> = {
  watchlist: { src: '/icons/action-add-watchlist.svg', alt: 'Add to watchlist icon' },
  not_for_me: { src: '/icons/action-thumb-down.svg', alt: 'Thumb down icon' },
  liked_it: { src: '/icons/action-thumb-up.svg', alt: 'Thumb up icon' },
  loved_it: { src: '/icons/action-love-it.svg', alt: 'Heart icon' }
}

function ShowCardComponent({
  show,
  onAction,
  hiddenActions = [],
  showActions = true,
  showDescription = true,
  compact = false,
  priority = false,
  searchQuery,
  extraContent
}: ShowCardProps) {
  const { user } = useAuth()
  const { triggerSectionFlash } = useNavigation()
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionResult, setActionResult] = useState<{ status: ShowStatus; label: string } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldFadeOut, setShouldFadeOut] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [shouldFadeOutSuccess, setShouldFadeOutSuccess] = useState(false)

  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [shouldLoadImage, setShouldLoadImage] = useState(true)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const posterUrl = getPosterUrl(show)
  const streamingProviders = filterStreamingProviders(show)
  const airDate = formatAirDate(show.first_air_date)
  const description = getShowDescription(show)
  const genreNames = show.genre_names || []
  const seasonsLabel = (() => {
    if ((show as any).number_of_seasons && (show as any).number_of_seasons > 0) {
      const count = (show as any).number_of_seasons as number
      if (count === 1) return '1 season'
      return `${count} seasons`
    }
    if (show.type === 'Miniseries') return 'Mini Series'
    return undefined
  })()

  const optimizedUrl = posterUrl ? getOptimizedImageUrl(posterUrl) : null
  const isPreloaded = optimizedUrl ? isImagePreloaded(optimizedUrl) : false

  const blurDataURL = (show as any).poster_thumb_url as string | undefined ||
    (typeof window !== 'undefined' ? generateBlurPlaceholder() : undefined)

  useEffect(() => {
    if (optimizedUrl && isPreloaded && !imageLoaded) {
      setImageLoaded(true)
      setShouldLoadImage(true)
      setCurrentImageUrl(optimizedUrl)
    }
  }, [optimizedUrl, isPreloaded, imageLoaded, show.name])

  useEffect(() => {
    setShouldLoadImage(true)
  }, [])

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

      triggerSectionFlash(status === 'watchlist' ? 'watchlist' : 'rated')

      const button = ACTION_BUTTONS.find(b => b.status === status)
      if (button) {
        setTimeout(() => {
          setActionResult({ status, label: button.successLabel })
          setShouldFadeOut(false)
          setShowSuccessMessage(true)
          setTimeout(() => {
            setShouldFadeOutSuccess(true)
            setTimeout(() => {
              onAction?.(show, status)
            }, 400)
          }, 1200)
        }, 300)
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

  const buildImdbUrl = (imdbId: string) => `https://www.imdb.com/title/${imdbId}/`

  if (actionResult) {
    return (
      <div
        className={`show-card-modern p-4 flex items-center justify-center min-h-[320px] transition-all duration-500 ease-out ${
          showSuccessMessage && !shouldFadeOutSuccess
            ? 'opacity-100 scale-100 animate-success-bounce'
            : shouldFadeOutSuccess
              ? 'opacity-0 scale-95 -translate-y-4'
              : 'opacity-0 scale-95'
        }`}
      >
        <div className="text-center">
          <div className="text-3xl font-bold text-[var(--accent-primary)] mb-4">
            {actionResult.label}
          </div>
          <div className="text-lg text-white/80">
            {show.name}
          </div>
        </div>
      </div>
    )
  }

  const streamingBadge = (() => {
    const provider = streamingProviders[0]
    if (!provider) return null
    const normalized = (provider.provider_name || '').toLowerCase()
    const match = PROVIDER_LOOKUP.find(entry =>
      entry.keywords.some(keyword => normalized.includes(keyword))
    )

    if (!match) {
      return <span className="provider-logo provider-logo--text logo-generic">{provider.provider_name}</span>
    }

    if (match.asset) {
      return (
        <span className="provider-logo">
          <Image
            src={match.asset}
            alt={`${provider.provider_name} logo`}
            width={120}
            height={36}
            className="provider-logo__img"
            unoptimized
          />
        </span>
      )
    }

    return <span className={`provider-logo provider-logo--text ${match.className}`}>{match.label}</span>
  })()

  const formattedGenres = genreNames.length > 0 ? genreNames.slice(0, 3).join(' • ').toUpperCase() : undefined
  const metaParts: string[] = []
  if (airDate) metaParts.push(`FIRST AIRED: ${airDate.toUpperCase()}`)
  if (seasonsLabel) metaParts.push(seasonsLabel.toUpperCase())
  if ((show as any).type) metaParts.push((show as any).type.toString().toUpperCase())
  if (formattedGenres) metaParts.push(formattedGenres)

  const imdbLink = (
    <a
      href={buildImdbUrl(show.imdb_id)}
      target="_blank"
      rel="noopener noreferrer"
      className="imdb-chip transition-transform hover:-translate-y-0.5"
      aria-label="View on IMDb"
    >
      <Image
        src="/badges/imdb-badge.png"
        alt="IMDb"
        width={254}
        height={128}
        className="h-5 w-auto sm:h-6 lg:h-6"
        priority={priority}
      />
    </a>
  )

  const cardVisibilityClass = shouldFadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
  const cardPadding = compact ? 'p-3 lg:p-4' : 'p-4 lg:p-6'
  const cardMinHeight = compact ? 'min-h-[240px]' : 'min-h-[360px]'
  const layoutGapClasses = compact ? 'flex flex-col lg:flex-row gap-3 lg:gap-4' : 'flex flex-col lg:flex-row gap-4 lg:gap-6'
  const contentMinHeight = compact ? 'min-h-[170px] lg:min-h-[240px]' : 'min-h-[220px] lg:min-h-[300px]'
  const contentGap = compact ? 'gap-3 lg:gap-4' : 'gap-6'
  const posterWrapperClasses = compact
    ? 'relative w-[120px] h-[180px] sm:w-[140px] sm:h-[210px] lg:w-[160px] lg:h-[240px] rounded-3xl overflow-hidden group-hover:shadow-lg transition-all duration-300'
    : 'relative w-[160px] h-[240px] sm:w-[180px] sm:h-[270px] lg:w-[220px] lg:h-[330px] rounded-3xl overflow-hidden group-hover:shadow-lg transition-all duration-300'
  const placeholderBarClasses = compact
    ? 'absolute bottom-3 left-3 right-3 h-1.5 bg-white/10 rounded-full overflow-hidden'
    : 'absolute bottom-4 left-4 right-4 h-2 bg-white/10 rounded-full overflow-hidden'
  const placeholderInnerClasses = compact
    ? 'h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse rounded-full w-1/2'
    : 'h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse rounded-full w-1/3'

  const renderActionButtonsDesktop = () => {
    if (!showActions) return null
    
    return (
      <>
        <div className="border-b border-white/20 mb-3" />
        <div className="action-toolbar flex flex-nowrap items-center justify-center gap-2 overflow-x-auto px-1 sm:justify-between sm:overflow-visible">
          <div className="flex items-center justify-center gap-2">
            {ACTION_BUTTONS.filter(button => button.status === 'watchlist' && !hiddenActions.includes(button.status)).map(button => {
              const isUserRated = show.user_status === button.status
              const icon = ACTION_ICON_MAP[button.status]
              return (
                <button
                  key={button.status}
                  type="button"
                  onClick={() => handleAction(button.status)}
                  disabled={isProcessing}
                  aria-pressed={isUserRated}
                  className={`action-button action-button--primary ${isUserRated ? 'action-button--active' : ''}`}
                >
                  <Image src={icon.src} alt={icon.alt} width={28} height={28} className="action-button__icon" />
                  <span className="action-button__label">{button.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-3">
            {ACTION_BUTTONS.filter(button => button.status !== 'watchlist' && !hiddenActions.includes(button.status)).map(button => {
              const isUserRated = show.user_status === button.status
              const displayLabel = button.label
              const icon = ACTION_ICON_MAP[button.status]
              return (
                <button
                  key={button.status}
                  type="button"
                  onClick={() => handleAction(button.status)}
                  disabled={isProcessing}
                  aria-pressed={isUserRated}
                  className={`action-button action-button--rating ${isUserRated ? 'action-button--active' : ''}`}
                >
                  <Image src={icon.src} alt={icon.alt} width={28} height={28} className="action-button__icon" />
                  <span className="action-button__label">{displayLabel}</span>
                </button>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  const renderActionButtonsMobile = () => {
    if (!showActions) return null
    
    return (
      <>
        <div className="border-b border-white/20 mb-3" />
        <div className="action-toolbar flex flex-col gap-3">
          {ACTION_BUTTONS.filter(button => button.status === 'watchlist' && !hiddenActions.includes(button.status)).map(button => {
            const isUserRated = show.user_status === button.status
            const icon = ACTION_ICON_MAP[button.status]
            return (
              <button
                key={button.status}
                type="button"
                onClick={() => handleAction(button.status)}
                disabled={isProcessing}
                aria-pressed={isUserRated}
                className={`action-button action-button--primary w-full ${isUserRated ? 'action-button--active' : ''}`}
              >
                <Image src={icon.src} alt={icon.alt} width={28} height={28} className="action-button__icon" />
                <span className="action-button__label">{button.label}</span>
              </button>
            )
          })}

          <div className="flex items-center justify-center gap-2">
            {ACTION_BUTTONS.filter(button => button.status !== 'watchlist' && !hiddenActions.includes(button.status)).map(button => {
              const isUserRated = show.user_status === button.status
              const icon = ACTION_ICON_MAP[button.status]
              return (
                <button
                  key={button.status}
                  type="button"
                  onClick={() => handleAction(button.status)}
                  disabled={isProcessing}
                  aria-pressed={isUserRated}
                  className={`action-button action-button--rating flex-1 ${isUserRated ? 'action-button--active' : ''}`}
                >
                  <Image src={icon.src} alt={icon.alt} width={28} height={28} className="action-button__icon" />
                  <span className="action-button__label">{button.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className={`show-card-modern ${cardPadding} relative group transition-all duration-500 ease-out ${cardMinHeight} ${cardVisibilityClass}`}>
      {rating && (
        <div className="rating-badge">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-bold text-white text-sm sm:text-base">
              {rating.value}
            </span>
          </div>
        </div>
      )}

      <div className={layoutGapClasses}>
        <div className="flex-shrink-0 self-center lg:self-start">
          <div
            ref={imageRef}
            className={posterWrapperClasses}
          >
            <div
              className={`absolute inset-0 transition-opacity duration-500 rounded-3xl ${
                imageLoaded || isPreloaded || imageError ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              {blurDataURL ? (
                <Image src={blurDataURL} alt="" fill className="object-cover blur-sm rounded-3xl" unoptimized />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-3xl" />
              )}
              <div className={placeholderBarClasses}>
                <div className={placeholderInnerClasses} />
              </div>
            </div>

            {optimizedUrl && shouldLoadImage && !imageError ? (
              <Image
                src={optimizedUrl}
                alt={show.name}
                fill
                className={`crisp-image object-cover transition-all duration-500 rounded-3xl ${imageLoaded || isPreloaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                sizes="(max-width: 640px) 160px, (max-width: 1024px) 180px, 220px"
                quality={90}
                priority={priority}
                fetchPriority={priority ? 'high' : 'auto'}
                placeholder={blurDataURL ? 'blur' : 'empty'}
                blurDataURL={blurDataURL}
                onLoad={() => {
                  setImageLoaded(true)
                  setCurrentImageUrl(optimizedUrl)
                }}
                onError={(error) => {
                  console.warn('Image load error for:', show.name, error)
                  if (optimizedUrl !== posterUrl && posterUrl) {
                    setCurrentImageUrl(posterUrl)
                  } else {
                    setImageError(true)
                    setImageLoaded(true)
                  }
                }}
              />
            ) : currentImageUrl && currentImageUrl !== optimizedUrl && !imageError ? (
              <Image
                src={currentImageUrl}
                alt={show.name}
                fill
                className={`crisp-image object-cover transition-all duration-500 rounded-3xl ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                sizes="(max-width: 640px) 160px, (max-width: 1024px) 180px, 220px"
                quality={80}
                priority={priority}
                fetchPriority={priority ? 'high' : 'auto'}
                placeholder={blurDataURL ? 'blur' : 'empty'}
                blurDataURL={blurDataURL}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true)
                  setImageLoaded(true)
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl">
                <div className="text-white/50 text-center">
                  <div className="text-4xl mb-4">📺</div>
                  <div className="text-sm font-medium">Image Unavailable</div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
          </div>
        </div>

        <div className={`flex-1 flex flex-col justify-between text-center lg:text-left ${contentMinHeight}`}>
          <div className={`flex h-full flex-col ${contentGap}`}>
            <div>
              <h3 className="text-xl sm:text-[28px] lg:text-[30px] font-black uppercase tracking-[0.12em] leading-tight text-[var(--accent-primary)] lg:pr-20">
                {searchQuery ? highlightText(show.name, searchQuery, 'px-1 rounded bg-[var(--accent-primary)] text-black font-black') : show.name}
              </h3>
              {metaParts.length > 0 && (
                <div className="mt-2 text-[0.62rem] sm:text-xs font-semibold tracking-[0.12em] text-white/50">
                  {metaParts.join(' • ')}
                </div>
              )}
            </div>

            {showDescription && description && (
              <div className="text-center lg:text-left">
                <p
                  className="text-white/80 text-sm lg:text-base leading-relaxed lg:pr-12"
                  style={{ margin: 0 }}
                >
                  {description}
                </p>
              </div>
            )}

            {extraContent}

            <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
              <div className="flex items-center justify-center sm:justify-start">
                {streamingBadge}
              </div>
              {imdbLink}
            </div>
          </div>

          <div className="mt-4 hidden lg:block">
            {renderActionButtonsDesktop()}
          </div>
        </div>
      </div>

      <div className="lg:hidden mt-4">
        {renderActionButtonsMobile()}
      </div>
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
    prev.showDescription === next.showDescription &&
    prev.compact === next.compact &&
    arraysEqual(prev.hiddenActions, next.hiddenActions) &&
    prev.onAction === next.onAction &&
    prev.searchQuery === next.searchQuery &&
    prev.extraContent === next.extraContent
  )
}

export default memo(ShowCardComponent, arePropsEqual)
