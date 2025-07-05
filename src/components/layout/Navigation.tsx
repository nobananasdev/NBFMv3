'use client'

import { useNavigation, NavigationSection } from '@/contexts/NavigationContext'

interface NavigationItem {
  id: NavigationSection
  label: string
  count?: number
}

export default function Navigation() {
  const { activeSection, setActiveSection, watchlistCount, ratedCount } = useNavigation()

  const navigationItems: NavigationItem[] = [
    { id: 'discover', label: 'Discover' },
    { id: 'watchlist', label: 'Watchlist', count: watchlistCount },
    { id: 'new-seasons', label: 'New Seasons' },
    { id: 'rated', label: 'Rated', count: ratedCount },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-200
                ${
                  activeSection === item.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`
                    px-2 py-1 text-xs rounded-full font-medium
                    ${
                      activeSection === item.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}