import { useMemo, useState, useCallback } from 'react'
import { DateTime } from 'luxon'
import { useClock } from '../hooks/useClock'
import { getTimezoneInfo, type TimezoneInfo } from '../lib/timezones'
import { formatTime } from '../lib/convert'
import { XMarkIcon, DragHandleIcon } from './Icons'

interface WorldClockProps {
  favorites: string[]
  compact?: boolean
  onRemoveFavorite?: (tzId: string) => void
  onReorder?: (newOrder: string[]) => void
}

interface ClockCardData {
  info: TimezoneInfo
  time: DateTime
  dateStr: string
  timeStr: string
  relativeLabel: string
  dayDiff: 'yesterday' | 'tomorrow' | null
}

function buildCardData(tzId: string, now: DateTime): ClockCardData {
  const time = now.setZone(tzId)
  const info = getTimezoneInfo(tzId, time)
  const timeStr = formatTime(time, 'h:mm a')
  const dateStr = formatTime(time, 'MMM d, yyyy')

  const localDay = now.startOf('day')
  const tzDay = time.startOf('day')
  const diffDays = tzDay.diff(localDay, 'days').days
  let dayDiff: ClockCardData['dayDiff'] = null
  if (diffDays >= 1) dayDiff = 'tomorrow'
  else if (diffDays <= -1) dayDiff = 'yesterday'

  const diffMinutes = time.offset - now.offset
  let relativeLabel: string
  if (diffMinutes === 0) {
    relativeLabel = 'Same time'
  } else {
    const abs = Math.abs(diffMinutes)
    const hours = Math.floor(abs / 60)
    const mins = abs % 60
    const parts: string[] = []
    if (hours > 0) parts.push(`${hours}h`)
    if (mins > 0) parts.push(`${mins}m`)
    relativeLabel = `${parts.join(' ')} ${diffMinutes > 0 ? 'ahead' : 'behind'}`
  }

  return { info, time, dateStr, timeStr, relativeLabel, dayDiff }
}

function ClockCard({
  data,
  compact,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragTarget,
}: {
  data: ClockCardData
  compact?: boolean
  onRemove?: () => void
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  isDragTarget?: boolean
}) {
  const draggable = !!onDragStart

  if (compact) {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={`group flex items-center justify-between rounded-xl px-3 py-2 border transition-colors ${
          isDragTarget
            ? 'bg-blue-600/20 border-blue-500/70'
            : 'bg-gray-800/50 dark:bg-gray-800 border-gray-700/50 hover:border-gray-600'
        }`}
      >
        {draggable && (
          <span className="cursor-grab active:cursor-grabbing text-gray-600 group-hover:text-gray-400 transition-colors select-none mr-2 shrink-0">
            <DragHandleIcon className="h-3.5 w-3.5" />
          </span>
        )}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-xl font-mono font-bold text-white whitespace-nowrap">
            {data.timeStr}
          </span>
          <span className="text-sm font-semibold text-gray-200 truncate">
            {data.info.city}
          </span>
          <span className="text-xs text-gray-400">{data.info.abbreviation}</span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 ml-2 text-gray-500 hover:text-red-400 transition-opacity text-sm"
            aria-label={`Remove ${data.info.city}`}
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl p-4 border transition-colors ${
        isDragTarget
          ? 'bg-blue-600/20 border-blue-500/70'
          : 'bg-gray-800/50 dark:bg-gray-800 border-gray-700/50 hover:border-gray-500'
      }`}
    >
      {draggable && (
        <span className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-gray-600 group-hover:text-gray-400 transition-colors select-none opacity-0 group-hover:opacity-100">
          <DragHandleIcon className="h-4 w-4" />
        </span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity text-lg leading-none"
          aria-label={`Remove ${data.info.city}`}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-100">{data.info.city}</h3>
        {data.dayDiff && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 capitalize">
            {data.dayDiff}
          </span>
        )}
      </div>

      <p className="text-3xl font-mono font-bold text-white mt-1">{data.timeStr}</p>
      <p className="text-sm text-gray-400 mt-1">{data.dateStr}</p>

      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>
          {data.info.abbreviation} ({data.info.utcOffsetStr})
        </span>
        <span>{data.relativeLabel}</span>
      </div>
    </div>
  )
}

export default function WorldClock({ favorites, compact, onRemoveFavorite, onReorder }: WorldClockProps) {
  const now = useClock()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const cards = useMemo(
    () => favorites.map((tzId) => buildCardData(tzId, now)),
    [favorites, now],
  )

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (index !== dragIndex) setDragOverIndex(index)
    },
    [dragIndex],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault()
      if (dragIndex === null || dragIndex === dropIndex || !onReorder) return
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

  if (favorites.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        No favorite timezones yet. Add some from the search!
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        {cards.map((data, index) => (
          <ClockCard
            key={data.info.id}
            data={data}
            compact
            onRemove={onRemoveFavorite ? () => onRemoveFavorite(data.info.id) : undefined}
            onDragStart={onReorder ? () => handleDragStart(index) : undefined}
            onDragOver={onReorder ? (e) => handleDragOver(e, index) : undefined}
            onDrop={onReorder ? (e) => handleDrop(e, index) : undefined}
            onDragEnd={onReorder ? handleDragEnd : undefined}
            isDragTarget={dragOverIndex === index && dragIndex !== index}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((data, index) => (
        <ClockCard
          key={data.info.id}
          data={data}
          onRemove={onRemoveFavorite ? () => onRemoveFavorite(data.info.id) : undefined}
          onDragStart={onReorder ? () => handleDragStart(index) : undefined}
          onDragOver={onReorder ? (e) => handleDragOver(e, index) : undefined}
          onDrop={onReorder ? (e) => handleDrop(e, index) : undefined}
          onDragEnd={onReorder ? handleDragEnd : undefined}
          isDragTarget={dragOverIndex === index && dragIndex !== index}
        />
      ))}
    </div>
  )
}
