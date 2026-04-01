import { useState, useEffect, useCallback } from 'react'
import WorldClock from './WorldClock'
import Converter from './Converter'

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
          TimeZap ⚡
        </span>
        <button
          onClick={() => window.api.openSettings()}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          aria-label="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.295a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.416l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.416.587l-.295 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.416-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.416l-1.473-.295A1 1 0 0 1 1 11.36V10a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 3.71l1.25.834a6.957 6.957 0 0 1 1.416-.587l.295-1.473ZM13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </header>

      <div className="mx-3 border-t border-white/5" />

      {/* Mini World Clock — scrollable top section */}
      <section className="min-h-0 flex-[3] overflow-y-auto scroll-smooth px-3 py-2">
        <WorldClock
          favorites={favorites}
          compact
          onRemoveFavorite={handleRemoveFavorite}
        />
      </section>

      <div className="mx-3 border-t border-white/5" />

      {/* Quick Converter — bottom section */}
      <section className="flex shrink-0 flex-[2] flex-col overflow-y-auto px-1 py-1">
        <Converter compact />
      </section>

      {/* Footer */}
      <footer className="shrink-0 border-t border-white/5 px-3 py-1.5 text-center">
        <button
          onClick={() => window.api.showMainWindow()}
          className="text-xs text-gray-500 transition-colors hover:text-blue-400"
        >
          Open full app ↗
        </button>
      </footer>
    </div>
  )
}
