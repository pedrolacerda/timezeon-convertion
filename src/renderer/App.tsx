import { useState, useEffect, useCallback, type CSSProperties } from 'react'
import MenuBarPopover from './components/MenuBarPopover'
import WorldClock from './components/WorldClock'
import Converter from './components/Converter'
import { FavoritesList } from './components/FavoritesList'
import { useFavorites } from './hooks/useFavorites'

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

  // Listen for settings navigation from main process (triggered by popover)
  useEffect(() => {
    const cleanup = window.api.onSwitchToSettings?.(() => {
      setActiveTab('settings')
    })
    return cleanup
  }, [])

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      {/* Draggable title bar area + tab bar */}
      <div className="shrink-0 bg-gray-900" style={{ ...dragStyle, paddingTop: 28 }}>
        <nav className="flex border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={noDragStyle}
              className={`relative flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
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
                className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Edit Favorites
              </button>
            </div>
            <WorldClock favorites={favorites} onRemoveFavorite={removeFavorite} />
          </div>
        )}

        {activeTab === 'converter' && <Converter />}

        {activeTab === 'settings' && (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <p className="text-sm">Settings coming soon</p>
          </div>
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
      <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-700/50 bg-gray-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Favorites</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
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
