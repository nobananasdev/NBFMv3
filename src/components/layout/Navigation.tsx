'use client'

import { useNavigation, NavigationSection } from '@/contexts/NavigationContext'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface NavigationItem {
  id: NavigationSection
  label: string
  count?: number
  icon: string
  gradient: string
}

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
      className={`
        relative px-2 py-1 rounded-xl text-xs font-bold transition-all duration-300
        ${isActive 
          ? 'bg-white/20 text-white' 
          : 'bg-white/10 text-white/70'
        }
        ${animate ? 'animate-count-pop' : ''}
      `}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      aria-live="polite"
    >
      {display}
      {animate && (
        <div className="absolute inset-0 rounded-xl bg-white/30 animate-ping"></div>
      )}
    </div>
  )
}

export default function Navigation() {
  const { activeSection, setActiveSection, watchlistCount, ratedCount, discoverCount, newSeasonsCount } = useNavigation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigationItems: NavigationItem[] = [
    { 
      id: 'discover', 
      label: 'Discovery', 
      count: discoverCount,
      icon: '/discovery.svg',
      gradient: 'from-blue-500 to-purple-600'
    },
    { 
      id: 'new-seasons', 
      label: 'New Seasons', 
      count: newSeasonsCount,
      icon: '/new seasons.svg',
      gradient: 'from-green-500 to-teal-600'
    },
    { 
      id: 'watchlist', 
      label: 'Watchlist', 
      count: watchlistCount,
      icon: '/watchlist.svg',
      gradient: 'from-yellow-500 to-orange-600'
    },
    { 
      id: 'rated', 
      label: 'Rated', 
      count: ratedCount,
      icon: '/rated.svg',
      gradient: 'from-pink-500 to-red-600'
    },
  ]

  const renderDesktopButton = (item: NavigationItem) => {
    const isActive = activeSection === item.id
    
    return (
      <button
        key={item.id}
        onClick={() => setActiveSection(item.id)}
        className={`
          group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 transform
          ${isActive
            ? `bg-gradient-to-br ${item.gradient} shadow-lg scale-105`
            : `${isScrolled ? 'bg-gray-900/90 backdrop-blur-md border border-white/20' : 'bg-white/10 border border-white/20'} hover:bg-white/15 hover:scale-105`
          }
        `}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-between">
          {/* Left side: Icon and Label */}
          <div className="flex items-center space-x-4">
            <div className={`
              relative p-3 rounded-2xl transition-all duration-300
              ${isActive 
                ? 'bg-white/20 shadow-lg' 
                : 'bg-white/10 group-hover:bg-white/15'
              }
            `}>
              <Image
                src={item.icon}
                alt={item.label}
                width={24}
                height={24}
                className={`w-6 h-6 transition-all duration-300 ${
                  isActive ? 'brightness-0 invert' : 'brightness-0 invert opacity-70 group-hover:opacity-100'
                }`}
              />
              {/* Icon glow effect */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-white/30 blur-md animate-pulse"></div>
              )}
            </div>
            
            <div>
              <h3 className={`
                text-lg font-bold tracking-wide transition-all duration-300
                ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}
              `}>
                {item.label}
              </h3>
              <div className={`
                text-sm transition-all duration-300
                ${isActive ? 'text-white/80' : 'text-white/50 group-hover:text-white/70'}
              `}>
                {item.count || 0} items
              </div>
            </div>
          </div>
          
          {/* Right side: Count Badge */}
          <CountBadge value={item.count} isActive={isActive} />
        </div>
        
        {/* Hover effect overlay */}
        <div className={`
          absolute inset-0 rounded-3xl transition-opacity duration-300
          bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20
          ${isActive ? 'opacity-0' : ''}
        `}></div>
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-white/20 to-transparent animate-pulse"></div>
        )}
      </button>
    )
  }

  const renderMobileButton = (item: NavigationItem) => {
    const isActive = activeSection === item.id
    
    return (
      <button
        key={`mobile-${item.id}`}
        onClick={() => setActiveSection(item.id)}
        className={`
          relative flex-1 p-3 rounded-2xl transition-all duration-300 transform
          ${isActive
            ? `bg-gradient-to-br ${item.gradient} shadow-lg scale-105`
            : `${isScrolled ? 'bg-gray-900/90 backdrop-blur-md border border-white/20' : 'glass'} hover:scale-105`
          }
        `}
      >
        {/* Content */}
        <div className="flex flex-col items-center space-y-2">
          {/* Icon */}
          <div className={`
            relative p-2 rounded-xl transition-all duration-300
            ${isActive ? 'bg-white/20' : 'bg-white/10'}
          `}>
            <Image
              src={item.icon}
              alt={item.label}
              width={20}
              height={20}
              className={`w-5 h-5 transition-all duration-300 ${
                isActive ? 'brightness-0 invert' : 'brightness-0 invert opacity-70'
              }`}
            />
          </div>
          
          {/* Label */}
          <div className="text-center">
            <h3 className={`
              text-xs font-bold tracking-wide transition-all duration-300
              ${isActive ? 'text-white' : 'text-white/80'}
            `}>
              {item.label}
            </h3>
          </div>
          
          {/* Count */}
          <CountBadge value={item.count} isActive={isActive} />
        </div>
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-white/30 to-transparent animate-pulse"></div>
        )}
      </button>
    )
  }

  return (
    <nav className={`sticky top-0 z-40 mt-6 mb-8 animate-slide-up transition-all duration-300 ${isScrolled ? 'backdrop-blur-md' : ''}`}>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Mobile Navigation */}
        <div className="flex gap-2 sm:hidden">
          {navigationItems.map((item) => renderMobileButton(item))}
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {navigationItems.map((item) => renderDesktopButton(item))}
        </div>
      </div>
      
      {/* Decorative gradient line */}
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
    </nav>
  )
}