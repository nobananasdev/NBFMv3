'use client'

import { useNavigation, NavigationSection } from '@/contexts/NavigationContext'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface NavigationItem {
  id: NavigationSection
  label: string
  icon: string
  gradient: string
}

export default function MobileNavigation() {
  const { activeSection, setActiveSection, sectionFlashes } = useNavigation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const containerClasses = isScrolled
    ? 'bg-[rgba(8,13,23,0.9)] shadow-[0_18px_32px_rgba(0,0,0,0.55)]'
    : 'bg-[rgba(12,18,30,0.82)] shadow-[0_14px_26px_rgba(0,0,0,0.45)]'

  const navigationItems: NavigationItem[] = [
    {
      id: 'discover',
      label: 'Discovery',
      icon: '/discovery.svg',
      gradient: 'from-blue-500/90 via-purple-500/90 to-purple-600/90',
    },
    {
      id: 'new-seasons',
      label: 'New Seasons',
      icon: '/new seasons.svg',
      gradient: 'from-emerald-400/90 via-teal-500/90 to-teal-600/90',
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: '/watchlist.svg',
      gradient: 'from-amber-400/90 via-orange-500/90 to-orange-600/90',
    },
    {
      id: 'rated',
      label: 'Rated',
      icon: '/rated.svg',
      gradient: 'from-pink-400/90 via-rose-500/90 to-rose-600/90',
    },
  ]

  const renderMobileButton = (item: NavigationItem) => {
    const isActive = activeSection === item.id
    const isFlashing = sectionFlashes?.[item.id]

    return (
      <button
        key={`mobile-${item.id}`}
        type="button"
        aria-pressed={isActive}
        onClick={() => setActiveSection(item.id)}
        className={`group relative flex w-full min-h-[88px] flex-col items-center justify-center overflow-hidden rounded-[26px] px-3 py-3 text-center transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]/60 ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
      >
        {/* Base layer */}
        <span
          className={`pointer-events-none absolute inset-0 rounded-[26px] border border-white/12 transition-all duration-300 ${
            isActive ? `border-white/20 bg-gradient-to-br ${item.gradient}` : 'bg-white/[0.04] group-hover:bg-white/[0.06]'
          }`}
        />
        <span
          className={`pointer-events-none absolute inset-[2px] rounded-[24px] transition-all duration-300 ${
            isActive ? 'bg-white/10 backdrop-blur-sm' : 'bg-gradient-to-b from-white/5 to-transparent'
          }`}
        />

        {/* Content */}
        <span className="relative z-10 flex flex-col items-center gap-2">
          <span
            className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
              isActive ? 'bg-white/20 shadow-[0_14px_24px_rgba(0,0,0,0.35)]' : 'bg-white/[0.06] group-hover:bg-white/[0.1]'
            }`}
          >
            <Image
              src={item.icon}
              alt={item.label}
              width={28}
              height={28}
              className={`h-7 w-7 transition-all duration-300 ${
                isActive ? 'brightness-0 invert drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]' : 'brightness-0 invert opacity-80 group-hover:opacity-100'
              }`}
            />
            {isActive && (
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/40 blur-md opacity-70" />
            )}
          </span>

          <span
            className={`text-[0.72rem] font-semibold tracking-wide transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
            }`}
          >
            {item.label}
          </span>
        </span>

        {/* Active indicator */}
        {isActive && (
          <span className="pointer-events-none absolute -bottom-2 left-1/2 h-9 w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_70%)] opacity-70" />
        )}

        {/* Notification badge */}
        {isFlashing && <span className="nav-flash-badge nav-flash-badge--mobile">+1</span>}
      </button>
    )
  }

  return (
    <nav className="sticky top-3 z-40 sm:hidden">
      <div className="container mx-auto px-4 container-content">
        <div
          className={`relative mt-3 rounded-[32px] border border-white/12 p-3 transition-all duration-300 backdrop-blur-2xl ${containerClasses}`}
        >
          <div className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-4">
            {navigationItems.map((item) => renderMobileButton(item))}
          </div>

          <span className="pointer-events-none absolute inset-x-12 -bottom-6 h-10 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_70%)] opacity-60" />
        </div>
      </div>
    </nav>
  )
}
