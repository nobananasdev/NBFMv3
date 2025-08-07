'use client'

import { useNavigation, NavigationSection } from '@/contexts/NavigationContext'
import Image from 'next/image'

interface NavigationItem {
  id: NavigationSection
  label: string
  count?: number
}

// Arrow up right icon SVG
const ArrowUpRightIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 17L17 7M17 7H7M17 7V17" stroke={isActive ? "#000000" : "#ffffff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function Navigation() {
  const { activeSection, setActiveSection, watchlistCount, ratedCount, discoverCount, newSeasonsCount } = useNavigation()

  const navigationItems: NavigationItem[] = [
    { id: 'discover', label: 'Discovery', count: discoverCount },
    { id: 'new-seasons', label: 'New Seasons', count: newSeasonsCount },
    { id: 'watchlist', label: 'Watchlist', count: watchlistCount },
    { id: 'rated', label: 'Rated', count: ratedCount },
  ]


  const getCountDisplay = (itemId: NavigationSection, count?: number) => {
    if (typeof count === 'number' && count >= 0) {
      return new Intl.NumberFormat('en-US').format(count)
    }
    return '0'
  }

  const renderButton = (item: NavigationItem) => {
    const isActive = activeSection === item.id
    const countDisplay = getCountDisplay(item.id, item.count)
    
    return (
      <button
        key={item.id}
        onClick={() => setActiveSection(item.id)}
        className={`relative flex-1 p-4 rounded-[15px] transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0
          /* Desktop styles - more compact */
          hidden sm:block sm:h-[70px] ${
          isActive
            ? 'bg-[#3a3a3a] hover:bg-[#3a3a3a] border-0 shadow-md'
            : 'bg-[#FFFCF5] hover:bg-gray-50 border border-[#8e8e8e] shadow-sm hover:shadow-md'
        }`}
      >
        {/* Compact layout with icon, label and count */}
        <div className="flex items-center justify-between h-full">
          {/* Left side: icon and label */}
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 w-6 h-6 ${isActive ? 'brightness-0 invert' : ''}`}>
              <Image
                src={(() => {
                  switch (item.id) {
                    case 'discover': return "/discovery.svg"
                    case 'new-seasons': return "/new seasons.svg"
                    case 'watchlist': return "/watchlist.svg"
                    case 'rated': return "/rated.svg"
                    default: return ""
                  }
                })()}
                alt={item.label}
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>
            <h3 className={`text-[14px] font-bold tracking-[1.54px] ${
              isActive ? 'text-white' : 'text-[#292929]'
            }`}>
              {item.label}
            </h3>
          </div>
          
          {/* Right side: count */}
          <span
            style={{ fontVariantNumeric: 'tabular-nums' }}
            className={`text-[10px] font-bold tracking-[1.1px] ${
              isActive ? 'text-[#adadad]' : 'text-[#adadad]'
            }`}
          >
            {countDisplay}
          </span>
        </div>
      </button>
    )
  }

  const renderMobileButton = (item: NavigationItem) => {
    const isActive = activeSection === item.id
    const countDisplay = getCountDisplay(item.id, item.count)
    
    return (
      <button
        key={`mobile-${item.id}`}
        onClick={() => setActiveSection(item.id)}
        className={`flex-1 py-2 px-1 rounded-[10px] transition-all duration-200 sm:hidden ${
          isActive
            ? 'bg-[#3a3a3a] shadow-md'
            : 'bg-[#FFFCF5] border border-[#8e8e8e] shadow-sm'
        }`}
      >
        {/* Mobile layout matching Figma design: compact vertical arrangement */}
        <div className="flex flex-col items-center justify-between h-full space-y-1">
          {/* Icon at top */}
          <div className={`flex-shrink-0 w-4 h-4 ${isActive ? 'brightness-0 invert' : ''}`}>
            <Image
              src={(() => {
                switch (item.id) {
                  case 'discover': return "/discovery.svg"
                  case 'new-seasons': return "/new seasons.svg"
                  case 'watchlist': return "/watchlist.svg"
                  case 'rated': return "/rated.svg"
                  default: return ""
                }
              })()}
              alt={item.label}
              width={16}
              height={16}
              className="w-4 h-4"
            />
          </div>
          
          {/* Label in middle */}
          <h3 className={`mobile-nav-title sm:text-[10px] font-bold text-center leading-tight tracking-[0.6px] ${
            isActive ? 'text-white' : 'text-[#292929]'
          } px-0.5`}>
            {item.label}
          </h3>
          
          {/* Count at bottom */}
          <span
            style={{ fontVariantNumeric: 'tabular-nums' }}
            className={`text-[10px] font-bold tracking-[1.1px] ${
              isActive ? 'text-[#adadad]' : 'text-[#adadad]'
            }`}
          >
            {countDisplay}
          </span>
        </div>
      </button>
    )
  }

  return (
    <nav className="sticky top-0 z-50 mt-3 sm:mt-5 mb-6 sm:mb-8 bg-background">
      <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
        {/* Mobile navigation - single row */}
        <div className="flex gap-1 sm:hidden mb-4">
          {navigationItems.map((item) => renderMobileButton(item))}
        </div>
        
        {/* Desktop navigation - grid layout */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navigationItems.map((item) => renderButton(item))}
        </div>
      </div>
    </nav>
  )
}