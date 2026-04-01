import { useState, useRef, useCallback } from 'react'
import { TimezoneSearch } from './TimezoneSearch'
import { getTimezoneInfo, type TimezoneInfo } from '../lib/timezones'
import { DragHandleIcon, XMarkIcon } from './Icons'

interface FavoritesListProps {
  favorites: string[]
  onAdd: (tzId: string) => void
  onRemove: (tzId: string) => void
  onReorder: (newOrder: string[]) => void
}

const MAX_FAVORITES_HINT = 10

function FavoriteItem({
  info,
  index,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragTarget,
}: {
  info: TimezoneInfo
  index: number
  onRemove: () => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  isDragTarget: boolean
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group flex items-center gap-3 px-3 py-2.5 border-b border-gray-700/50 last:border-b-0 transition-colors ${
        isDragTarget
          ? 'bg-blue-600/20 border-t-2 border-t-blue-500'
          : 'hover:bg-gray-800/60'
      }`}
    >
      {/* Drag handle */}
      <span className="cursor-grab active:cursor-grabbing text-gray-600 group-hover:text-gray-400 transition-colors select-none text-sm leading-none">
        <DragHandleIcon className="h-4 w-4" />
      </span>

      {/* Timezone info */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-100">{info.city}</span>
        <span className="ml-1.5 text-xs text-gray-400">{info.abbreviation}</span>
        <span className="ml-1 text-xs text-gray-500">({info.utcOffsetStr})</span>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity text-lg leading-none px-1"
        aria-label={`Remove ${info.city}`}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

export function FavoritesList({ favorites, onAdd, onRemove, onReorder }: FavoritesListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragCounter = useRef(0)

  const infos = favorites.map((tzId) => getTimezoneInfo(tzId))

  const handleAdd = useCallback(
    (tzId: string) => {
      if (!favorites.includes(tzId)) {
        onAdd(tzId)
      }
    },
    [favorites, onAdd],
  )

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
    dragCounter.current = 0
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (index !== dragIndex) {
        setDragOverIndex(index)
      }
    },
    [dragIndex],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault()
      if (dragIndex === null || dragIndex === dropIndex) return

      const newOrder = [...favorites]
      const [moved] = newOrder.splice(dragIndex, 1)
      newOrder.splice(dropIndex, 0, moved)
      onReorder(newOrder)

      setDragIndex(null)
      setDragOverIndex(null)
    },
    [dragIndex, favorites, onReorder],
  )

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDragOverIndex(null)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* Add section */}
      <div className="pb-3 border-b border-gray-700/50">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Add timezone
        </label>
        <TimezoneSearch onChange={handleAdd} placeholder="Search to add a favorite..." compact />
      </div>

      {/* Max favorites hint */}
      {favorites.length >= MAX_FAVORITES_HINT && (
        <p className="text-xs text-amber-400/70 px-1">
          You have {favorites.length} favorites — consider removing some for a cleaner view.
        </p>
      )}

      {/* Favorites list */}
      {favorites.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
          Add your favorite timezones to see them in the World Clock
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700/50 overflow-hidden bg-gray-800/30">
          {infos.map((info, index) => (
            <FavoriteItem
              key={info.id}
              info={info}
              index={index}
              onRemove={() => onRemove(info.id)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragTarget={dragOverIndex === index && dragIndex !== index}
            />
          ))}
        </div>
      )}
    </div>
  )
}
