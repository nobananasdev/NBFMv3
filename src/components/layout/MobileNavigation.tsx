'use client'

import { useNavigation, NavigationSection } from '@/contexts/NavigationContext'
import { useEffect, useRef, useState } from 'react'

interface NavigationItem {
  id: NavigationSection
  label: string
  count?: number
  gradient: string
}

// Mobile nav: show bubble count on the right

const CountBadge = ({ value, isActive }: { value?: number; isActive: boolean }) => {
  const [animate, setAnimate] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (value !== prev.current) {
      setAnimate(true)
      const t = setTimeout(() => setAnimate(false), 650)
      prev.current = value
      return () => clearTimeout(t)
    }
  }, [value])

  const display =
    typeof value === 'number' && value >= 0
      ? new Intl.NumberFormat('en-US').format(value)
      : '0'

  return (
    <div
      className={`relative px-1.5 py-0.5 rounded-lg text-[11px] font-bold transition-all duration-300 ${
        isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'
      } ${animate ? 'animate-count-pop' : ''}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      aria-live="polite"
    >
      {display}
      {animate && <div className="absolute inset-0 rounded-xl bg-white/30 animate-ping"></div>}
    </div>
  )
}

export default function MobileNavigation() {
  const { activeSection, setActiveSection, watchlistCount, ratedCount, discoverCount, newSeasonsCount } = useNavigation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigationItems: NavigationItem[] = [
    { id: 'discover', label: 'Discovery', count: discoverCount, gradient: 'from-blue-500 to-purple-600' },
    { id: 'new-seasons', label: 'New Seasons', count: newSeasonsCount, gradient: 'from-green-500 to-teal-600' },
    { id: 'watchlist', label: 'Watchlist', count: watchlistCount, gradient: 'from-yellow-500 to-orange-600' },
    { id: 'rated', label: 'Rated', count: ratedCount, gradient: 'from-pink-500 to-red-600' },
  ]

  const renderMobileButton = (item: NavigationItem) => {
    const isActive = activeSection === item.id
    return (
      <button
        key={`mobile-${item.id}`}
        onClick={() => setActiveSection(item.id)}
        className={`group relative overflow-hidden w-full h-full rounded-2xl px-3 py-1 transition-all duration-300 transform ${
          isActive
            ? `bg-gradient-to-br ${item.gradient} shadow-lg scale-105`
            : `${isScrolled ? 'bg-gray-900/90 backdrop-blur-md border border-white/20' : 'bg-white/10 border border-white/20'} hover:bg-white/15 hover:scale-105`
        }`}
      >
        {/* Background Pattern (subtle) */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
        </div>
        {/* Content: title on left, bubble count on right */}
        <div className="relative z-10 flex items-center justify-between min-h-[44px]">
          <h3 className={`text-xs leading-4 font-semibold tracking-wide transition-all duration-300 ${isActive ? 'text-white' : 'text-white/80'}`}>{item.label}</h3>
          <CountBadge value={item.count} isActive={isActive} />
        </div>
        <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 ${isActive ? 'opacity-0' : ''}`}></div>
        {isActive && <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-white/20 to-transparent animate-pulse"></div>}
      </button>
    )
  }

  return (
    <nav className={`sticky top-0 z-40 mt-6 mb-8 animate-slide-up transition-all duration-300 ${isScrolled ? 'backdrop-blur-md' : ''} sm:hidden`}>
      <div className="container mx-auto px-4 sm:px-6 container-content">
        <div className="grid grid-cols-2 gap-2">
          {navigationItems.map((item) => renderMobileButton(item))}
        </div>
      </div>
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
    </nav>
  )
}
