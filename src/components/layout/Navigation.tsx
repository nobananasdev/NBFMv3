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

  const getIcon = (itemId: NavigationSection) => {
    switch (itemId) {
      case 'discover':
        return (
          <Image
            src="/discovery.svg"
            alt="Discovery"
            width={32}
            height={32}
            className="w-8 h-8"
          />
        )
      case 'new-seasons':
        return (
          <Image
            src="/new seasons.svg"
            alt="New Seasons"
            width={32}
            height={32}
            className="w-8 h-8"
          />
        )
      case 'watchlist':
        return (
          <Image
            src="/watchlist.svg"
            alt="Watchlist"
            width={32}
            height={32}
            className="w-8 h-8"
          />
        )
      case 'rated':
        return (
          <Image
            src="/rated.svg"
            alt="Rated"
            width={32}
            height={32}
            className="w-8 h-8"
          />
        )
      default:
        return null
    }
  }

  const getCountDisplay = (itemId: NavigationSection, count?: number) => {
    if (count !== undefined && count > 0) {
      return count > 999 ? '999+' : count.toString()
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
        className={`relative flex-1 p-6 rounded-3xl transition-all duration-200 transform hover:translate-y-1 hover:shadow-lg active:translate-y-2
          /* Desktop styles */
          hidden sm:block sm:min-h-[140px] ${
          isActive
            ? 'bg-[#3a3a3a] hover:bg-[#3a3a3a] border-0 shadow-md'
            : 'bg-[#FFFCF5] hover:bg-gray-50 border border-[#696969] shadow-sm hover:shadow-md'
        }`}
      >
        {/* Top section with icon and count */}
        <div className="flex justify-between items-start mb-4">
          <div className={`flex-shrink-0 ${isActive ? 'brightness-0 invert' : ''}`}>
            {getIcon(item.id)}
          </div>
          <span className={`text-lg font-medium ${
            isActive ? 'text-[#b0b0b0]' : 'text-gray-400'
          }`}>
            {countDisplay}
          </span>
        </div>
        
        {/* Bottom section with title and arrow */}
        <div className="flex justify-between items-end">
          <h3 className={`text-xl font-semibold text-left ${
            isActive ? 'text-white' : 'text-black'
          }`}>
            {item.label}
          </h3>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isActive ? 'bg-white !bg-white' : 'bg-black'
          }`} style={isActive ? { backgroundColor: '#ffffff' } : { backgroundColor: '#000000' }}>
            <ArrowUpRightIcon isActive={isActive} />
          </div>
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
        className={`flex-1 p-3 rounded-2xl transition-all duration-200 sm:hidden ${
          isActive
            ? 'bg-[#3a3a3a] shadow-md'
            : 'bg-[#FFFCF5] border border-[#696969] shadow-sm'
        }`}
      >
        {/* Mobile layout: icon, label, and count in compact vertical arrangement */}
        <div className="flex flex-col items-center space-y-1">
          <div className={`flex-shrink-0 ${isActive ? 'brightness-0 invert' : ''}`}>
            {getIcon(item.id)}
          </div>
          <h3 className={`text-sm font-medium text-center leading-tight ${
            isActive ? 'text-white' : 'text-black'
          }`}>
            {item.label}
          </h3>
          <span className={`text-xs font-medium ${
            isActive ? 'text-[#b0b0b0]' : 'text-gray-400'
          }`}>
            {countDisplay}
          </span>
        </div>
      </button>
    )
  }

  return (
    <nav className="sticky top-0 z-10 mt-5 mb-8 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Mobile navigation - single row */}
        <div className="flex gap-2 sm:hidden mb-4">
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