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
      gradient: 'from-blue-500 to-purple-600',
    },
    {
      id: 'new-seasons',
      label: 'New Seasons',
      icon: '/new seasons.svg',
      gradient: 'from-green-500 to-teal-600',
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: '/watchlist.svg',
      gradient: 'from-yellow-500 to-orange-600',
    },
    {
      id: 'rated',
      label: 'Rated',
      icon: '/rated.svg',
      gradient: 'from-pink-500 to-red-600',
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
        className="group relative flex flex-col items-center justify-center py-4 transition-all duration-300"
      >
        {/* Text */}
        <span
          className={`text-xs font-bold tracking-[0.2em] transition-all duration-300 uppercase ${
            isActive ? 'text-[#F5A623]' : 'text-white/85 group-hover:text-white'
          }`}
        >
          {item.label}
        </span>

        {/* Active underline */}
        {isActive && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#F5A623] rounded-full transition-all duration-300"></span>
        )}

        {/* Notification badge */}
        {isFlashing && <span className="nav-flash-badge nav-flash-badge--mobile">+1</span>}
      </button>
    )
  }

  return (
    <nav className="sticky top-0 z-40 sm:hidden bg-[#0A0E17]/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 container-content">
        <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
          {navigationItems.map((item) => renderMobileButton(item))}
        </div>
      </div>
    </nav>
  )
}
