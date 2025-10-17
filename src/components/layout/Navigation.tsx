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


export default function Navigation() {
  const { activeSection, setActiveSection, sectionFlashes } = useNavigation()
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
      icon: '/discovery.svg',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      id: 'new-seasons',
      label: 'New Seasons',
      icon: '/new seasons.svg',
      gradient: 'from-green-500 to-teal-600'
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: '/watchlist.svg',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      id: 'rated',
      label: 'Rated',
      icon: '/rated.svg',
      gradient: 'from-pink-500 to-red-600'
    },
  ]

  const renderDesktopButton = (item: NavigationItem) => {
    const isActive = activeSection === item.id
    const isFlashing = sectionFlashes?.[item.id]
    
    return (
      <button
        key={item.id}
        onClick={() => setActiveSection(item.id)}
        className={`
          group relative ${isFlashing ? 'overflow-visible' : 'overflow-hidden'} rounded-3xl px-4 py-3 transition-all duration-300 transform
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
        <div className="relative z-10 flex items-center justify-start">
          {/* Left side: Icon and Label */}
          <div className="flex items-center space-x-4">
            <div className={`
              relative p-2 rounded-2xl transition-all duration-300
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
                text-base font-semibold tracking-wide transition-all duration-300
                ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}
              `}>
                {item.label}
              </h3>
            </div>
          </div>
          
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
        {isFlashing && (
          <span className="nav-flash-badge nav-flash-badge--desktop">+1</span>
        )}
      </button>
    )
  }

  

  return (
    <nav className={`sticky top-0 z-40 mt-6 mb-8 animate-slide-up transition-all duration-300 ${isScrolled ? 'backdrop-blur-md' : ''} hidden sm:block`}>
      <div className="container mx-auto px-4 sm:px-6 container-content">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {navigationItems.map((item) => renderDesktopButton(item))}
        </div>
      </div>
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
    </nav>
  )
}
