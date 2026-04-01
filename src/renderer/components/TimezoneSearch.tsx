import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useTimezones } from '../hooks/useTimezones'
import { getTimezoneInfo, type TimezoneInfo } from '../lib/timezones'

interface TimezoneSearchProps {
  value?: string
  onChange: (tzId: string) => void
  placeholder?: string
  compact?: boolean
}

export function TimezoneSearch({
  value,
  onChange,
  placeholder = 'Search timezones...',
  compact = false,
}: TimezoneSearchProps) {
  const { filteredTimezones, groupedTimezones, searchQuery, setSearchQuery, clearSearch } =
    useTimezones()

  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [inputValue, setInputValue] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedTz = useMemo(
    () => (value ? getTimezoneInfo(value) : null),
    [value],
  )

  // Debounced search
  const handleInputChange = useCallback(
    (text: string) => {
      setInputValue(text)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => setSearchQuery(text), 150)
    },
    [setSearchQuery],
  )

  // Cleanup debounce on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  // Click outside detection
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return
    const item = listRef.current.querySelector(`[data-idx="${highlightIndex}"]`)
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex, isOpen])

  function open() {
    setIsOpen(true)
    setHighlightIndex(0)
  }

  function close() {
    setIsOpen(false)
    setInputValue('')
    clearSearch()
  }

  function select(tz: TimezoneInfo) {
    onChange(tz.id)
    close()
    inputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        open()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIndex((i) => Math.min(i + 1, filteredTimezones.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredTimezones[highlightIndex]) {
          select(filteredTimezones[highlightIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        close()
        inputRef.current?.blur()
        break
    }
  }

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIndex(0)
  }, [searchQuery])

  // Build flat index → timezone mapping respecting group order
  let flatIndex = 0
  const regionEntries = Array.from(groupedTimezones.entries())

  const sz = compact ? 'text-xs' : 'text-sm'
  const padItem = compact ? 'px-2 py-1' : 'px-3 py-2'
  const padHeader = compact ? 'px-2 py-0.5' : 'px-3 py-1.5'

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      {/* Search input */}
      <div className="relative">
        {/* Magnifying glass icon */}
        <svg
          className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          className={`w-full rounded-md border border-gray-600 bg-gray-800 dark:bg-gray-900 ${sz} ${compact ? 'py-1.5 pl-7 pr-2' : 'py-2 pl-9 pr-3'} text-gray-100 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40`}
          placeholder={placeholder}
          value={isOpen ? inputValue : (selectedTz?.label ?? '')}
          readOnly={!isOpen}
          onFocus={() => {
            if (!isOpen) {
              setInputValue('')
              open()
            }
          }}
          onChange={(e) => handleInputChange(e.target.value)}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-800 shadow-lg dark:bg-gray-900"
        >
          {filteredTimezones.length === 0 ? (
            <div className={`${padItem} ${sz} text-center text-gray-500`}>
              No results
            </div>
          ) : (
            regionEntries.map(([region, tzList]) => {
              const header = (
                <div
                  key={`hdr-${region}`}
                  className={`sticky top-0 z-10 ${padHeader} bg-gray-800/95 backdrop-blur dark:bg-gray-900/95 ${compact ? 'text-[10px]' : 'text-xs'} font-semibold uppercase tracking-wider text-gray-500`}
                >
                  {region}
                </div>
              )

              const items = tzList.map((tz) => {
                const idx = flatIndex++
                const isHighlighted = idx === highlightIndex
                const isSelected = tz.id === value

                return (
                  <div
                    key={tz.id}
                    data-idx={idx}
                    role="option"
                    aria-selected={isSelected}
                    className={`cursor-pointer ${padItem} ${sz} transition-colors ${
                      isHighlighted
                        ? 'bg-blue-600/30 text-white'
                        : isSelected
                          ? 'bg-blue-600/15 text-blue-300'
                          : 'text-gray-300 hover:bg-gray-700/60'
                    }`}
                    onPointerDown={(e) => {
                      e.preventDefault()
                      select(tz)
                    }}
                  >
                    <span className="font-medium text-gray-100">{tz.city}</span>
                    <span className="ml-1.5 text-gray-400">
                      — {tz.abbreviation}
                    </span>
                    <span className="ml-1 text-gray-500">
                      ({tz.utcOffsetStr})
                    </span>
                  </div>
                )
              })

              return (
                <div key={region}>
                  {header}
                  {items}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
