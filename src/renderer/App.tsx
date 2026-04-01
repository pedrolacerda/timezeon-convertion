import { useState, useEffect, useCallback, type CSSProperties } from 'react'
import MenuBarPopover from './components/MenuBarPopover'
import WorldClock from './components/WorldClock'
import Converter from './components/Converter'
import Settings from './components/Settings'
import { FavoritesList } from './components/FavoritesList'
import { useFavorites } from './hooks/useFavorites'
import { useTheme } from './hooks/useTheme'

type Tab = 'clock' | 'converter' | 'settings'

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: 'clock', icon: '🌍', label: 'World Clock' },
  { id: 'converter', icon: '⇄', label: 'Converter' },
  { id: 'settings', icon: '⚙', label: 'Settings' },
]

const dragStyle: CSSProperties = { WebkitAppRegion: 'drag' } as CSSProperties
const noDragStyle: CSSProperties = { WebkitAppRegion: 'no-drag' } as CSSProperties

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('clock')
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const { favorites, addFavorite, removeFavorite, reorderFavorites } = useFavorites()
  const themeProps = useTheme()

  // Listen for settings navigation from main process (triggered by popover)
  useEffect(() => {
    const cleanup = window.api.onSwitchToSettings?.(() => {
      setActiveTab('settings')
    })
    return cleanup
  }, [])

  return (
    <div className="flex h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* Draggable title bar area + tab bar */}
      <div className="shrink-0 bg-gray-100 dark:bg-gray-900" style={{ ...dragStyle, paddingTop: 28 }}>
        <nav className="flex border-b border-gray-200 dark:border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={noDragStyle}
              className={`relative flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'clock' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">World Clock</h2>
              <button
                onClick={() => setShowFavoritesModal(true)}
                className="rounded-lg bg-black/5 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-black/10 hover:text-gray-900 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                Edit Favorites
              </button>
            </div>
            <WorldClock favorites={favorites} onRemoveFavorite={removeFavorite} />
          </div>
        )}

        {activeTab === 'converter' && <Converter />}

        {activeTab === 'settings' && (
          <Settings theme={themeProps} />
        )}
      </div>

      {/* Favorites modal */}
      {showFavoritesModal && (
        <FavoritesModal
          favorites={favorites}
          onAdd={addFavorite}
          onRemove={removeFavorite}
          onReorder={reorderFavorites}
          onClose={() => setShowFavoritesModal(false)}
        />
      )}
    </div>
  )
}

function FavoritesModal({
  favorites,
  onAdd,
  onRemove,
  onReorder,
  onClose,
}: {
  favorites: string[]
  onAdd: (tzId: string) => void
  onRemove: (tzId: string) => void
  onReorder: (newOrder: string[]) => void
  onClose: () => void
}) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700/50 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Favorites</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-black/10 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <FavoritesList
          favorites={favorites}
          onAdd={onAdd}
          onRemove={onRemove}
          onReorder={onReorder}
        />
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  const viewMode = window.api.getViewMode()

  if (viewMode === 'popover') {
    return <MenuBarPopover />
  }

  return <MainApp />
}

export default App
