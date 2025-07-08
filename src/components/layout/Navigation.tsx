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
    <nav className="sticky top-0 z-10 mt-5 mb-5 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-row gap-2 sm:gap-4" style={{ paddingBottom: '3px', paddingRight: '3px' }}>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="flex flex-1 px-2 sm:px-[30px] py-[10px] justify-center items-center gap-1 rounded-[10px] border border-black transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1 active:scale-95"
              style={{
                backgroundColor: activeSection === item.id ? '#000' : '#FFF',
                boxShadow: activeSection === item.id
                  ? '3px 3px 0px 0px #FFE38F'
                  : '3px 3px 0px 0px #000'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.backgroundColor = '#F8F8F8'
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px #FFE38F'
                } else {
                  e.currentTarget.style.boxShadow = '4px 4px 0px 0px #FFE38F'
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.backgroundColor = '#FFF'
                  e.currentTarget.style.boxShadow = '3px 3px 0px 0px #000'
                } else {
                  e.currentTarget.style.boxShadow = '3px 3px 0px 0px #FFE38F'
                }
              }}
            >
              <div className="flex items-center gap-1">
                <span
                  className={`font-bold text-xs leading-[30px] tracking-[0.36px] ${activeSection === item.id ? 'text-white' : 'text-black'}`}
                >
                  {item.label}
                </span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className="px-2 py-1 text-xs rounded-full font-medium"
                    style={{
                      backgroundColor: activeSection === item.id ? '#FFF' : '#000',
                      color: '#F7CB48'
                    }}
                  >
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