import { useState, useEffect, useCallback } from 'react'
import WorldClock from './WorldClock'
import Converter from './Converter'
import { BoltIcon, GearIcon, ExternalLinkIcon } from './Icons'

export default function MenuBarPopover() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    window.api.getFavorites().then(setFavorites).catch(() => {})
  }, [])

  const handleRemoveFavorite = useCallback(
    (tzId: string) => {
      const next = favorites.filter((f) => f !== tzId)
      setFavorites(next)
      window.api.setFavorites(next).catch(() => {})
    },
    [favorites],
  )

  const handleReorderFavorites = useCallback(
    (newOrder: string[]) => {
      setFavorites(newOrder)
      window.api.setFavorites(newOrder).catch(() => {})
    },
    [],
  )

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden rounded-xl bg-gray-900 text-white">
      {/* Popover arrow notch */}
      <div className="pointer-events-none flex justify-center">
        <div className="h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-gray-900 -mt-2" />
      </div>

      {/* Header — draggable region */}
      <header
        className="flex shrink-0 items-center justify-between px-3 py-2"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-sm font-bold tracking-tight select-none">
          TimeZap <BoltIcon className="inline h-3.5 w-3.5" />
        </span>
        <button
          onClick={() => window.api.openSettings()}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          aria-label="Settings"
        >
          <GearIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="mx-3 border-t border-white/5" />

      {/* Quick Converter — top section */}
      <section
        className="flex shrink-0 flex-col overflow-y-auto px-3 py-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Converter compact />
      </section>

      <div className="mx-3 border-t border-white/5" />

      {/* Mini World Clock — scrollable bottom section */}
      <section
        className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-3 py-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <WorldClock
          favorites={favorites}
          compact
          onRemoveFavorite={handleRemoveFavorite}
          onReorder={handleReorderFavorites}
        />
      </section>

      {/* Footer */}
      <footer className="shrink-0 border-t border-white/5 px-3 py-1.5 text-center">
        <button
          onClick={() => window.api.showMainWindow()}
          className="text-xs text-gray-500 transition-colors hover:text-blue-400"
        >
          Open full app <ExternalLinkIcon className="inline h-3 w-3 ml-0.5" />
        </button>
      </footer>
    </div>
  )
}
