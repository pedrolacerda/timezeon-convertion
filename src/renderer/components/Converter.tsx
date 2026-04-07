import { useState, useMemo, useCallback, useEffect } from 'react'
import { DateTime } from 'luxon'
import { convertTime, formatTime } from '../lib/convert'
import { useClock } from '../hooks/useClock'
import { ArrowsSwapIcon, ClipboardIcon, CheckIcon, WarningIcon } from './Icons'
import { TimezoneSearch } from './TimezoneSearch'

interface ConverterProps {
  compact?: boolean
}

function getDefaultTarget(localTz: string): string {
  // We can't access favorites synchronously, so default to Europe/London
  return localTz === 'Europe/London' ? 'America/New_York' : 'Europe/London'
}

export default function Converter({ compact = false }: ConverterProps) {
  const localTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])

  const [sourceTz, setSourceTz] = useState(localTz)
  const [targetTz, setTargetTz] = useState(() => getDefaultTarget(localTz))
  const [customTime, setCustomTime] = useState('')
  const [copied, setCopied] = useState(false)
  const [swapRotation, setSwapRotation] = useState(0)

  // Resolve default target from favorites on mount
  useEffect(() => {
    window.api?.getFavorites?.().then((favs) => {
      const diff = favs.find((f) => f !== localTz)
      if (diff) setTargetTz(diff)
    }).catch(() => {})
  }, [localTz])

  // Live clock in the source timezone
  const liveNow = useClock(sourceTz)

  // Build the source DateTime for conversion
  const sourceDateTime = useMemo(() => {
    if (!customTime) return undefined
    const [hours, minutes] = customTime.split(':').map(Number)
    return DateTime.now()
      .setZone(sourceTz)
      .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 })
  }, [customTime, sourceTz])

  const result = useMemo(
    () => convertTime(sourceTz, targetTz, sourceDateTime),
    // Re-run every second when no custom time is set
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceTz, targetTz, sourceDateTime, !customTime ? liveNow : null]
  )

  const handleSwap = useCallback(() => {
    setSourceTz(targetTz)
    setTargetTz(sourceTz)
    setSwapRotation((r) => r + 180)
  }, [sourceTz, targetTz])

  const handleCopy = useCallback(async () => {
    const text = `${result.sourceFormatted} → ${result.targetFormatted}`
    await window.api.copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [result])

  if (compact) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl text-white">
        {/* Two-column layout: selects left, time input + swap right */}
        <div className="flex gap-2">
          {/* Left: both timezone autocompletes stacked */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <TimezoneSearch
              value={sourceTz}
              onChange={setSourceTz}
              placeholder="From timezone..."
              compact
            />
            <TimezoneSearch
              value={targetTz}
              onChange={setTargetTz}
              placeholder="To timezone..."
              compact
            />
          </div>

          {/* Right: time input on top, swap button below */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-[80px] h-[34px] rounded-lg border border-white/10 bg-white/5 px-2 font-mono
                text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSwap}
              className="flex h-[34px] w-[80px] items-center justify-center rounded-lg
                bg-white/10 text-[10px] text-gray-300 hover:bg-white/20 transition-colors"
              style={{ transform: `rotate(${swapRotation}deg)`, transition: 'transform 300ms ease, background-color 150ms ease' }}
              aria-label="Swap timezones"
            >
              <ArrowsSwapIcon />
            </button>
          </div>
        </div>

        {/* Live clock hint */}
        {!customTime && (
          <span className="text-[10px] text-gray-500 pl-1">
            Now: {formatTime(liveNow, 'h:mm a')}
          </span>
        )}

        {/* Result tile — full width */}
        <div
          className="flex items-center justify-between cursor-pointer group relative
            bg-gray-800/60 hover:bg-gray-800 border border-white/10 hover:border-blue-500/30
            rounded-lg px-3 py-2 transition-colors"
          onClick={handleCopy}
          title="Click to copy result"
        >
          <div className="flex flex-col gap-0">
            <span className="text-[10px] text-gray-500 leading-tight">
              {formatTime(result.targetTime, 'EEE, MMM d, yyyy')}
            </span>
            <span className="text-[10px] text-blue-400/80 leading-tight">
              {result.offsetDiff}
            </span>
          </div>
          <p className="text-xl font-mono font-bold text-white group-hover:text-blue-400 transition-colors tabular-nums">
            {formatTime(result.targetTime, 'h:mm a')}
          </p>

          {copied && (
            <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center rounded-lg border border-green-500/30 backdrop-blur-sm z-10">
              <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                <CheckIcon className="h-3 w-3" /> Copied!
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto p-4">
      {/* Source Section */}
      <div className="rounded-xl bg-white/5 p-4 transition-colors">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
          From
        </label>

        <TimezoneSearch
          value={sourceTz}
          onChange={setSourceTz}
          placeholder="Search by city, timezone or abbreviation..."
        />

        {/* Time input */}
        <div className="mt-3 flex flex-col gap-1">
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono
              text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!customTime && (
            <span className="text-xs text-gray-500 pl-1">
              Now: {formatTime(liveNow, 'h:mm:ss a')}
            </span>
          )}
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSwap}
          className="flex h-10 w-10 items-center justify-center rounded-full
            bg-white/10 text-lg text-gray-300 shadow-md transition-all duration-300
            hover:bg-white/20 hover:scale-110 active:scale-95"
          style={{ transform: `rotate(${swapRotation}deg)` }}
          aria-label="Swap timezones"
        >
          <ArrowsSwapIcon />
        </button>
      </div>

      {/* Target Section */}
      <div className="rounded-xl bg-white/5 p-4 transition-colors">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
          To
        </label>

        <TimezoneSearch
          value={targetTz}
          onChange={setTargetTz}
          placeholder="Search by city, timezone or abbreviation..."
        />

        <div className="mt-4 text-center">
          <p className="text-3xl font-mono font-bold text-white transition-all duration-300">
            {formatTime(result.targetTime, 'h:mm a')}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {formatTime(result.targetTime, 'EEEE, MMM d, yyyy')}
          </p>
          <p className="mt-1 text-sm text-blue-400">
            {result.offsetDiff} from source
          </p>
          {result.isDSTTransition && (
            <p className="mt-1 text-xs text-amber-400 cursor-help relative group/dst inline-block">
              <WarningIcon className="inline h-3.5 w-3.5" /> DST difference between zones
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-md bg-gray-900 border border-white/10 px-3 py-2 text-xs text-gray-200 leading-snug opacity-0 group-hover/dst:opacity-100 transition-opacity duration-0 z-50 shadow-lg">
                The two time zones are currently observing different Daylight Saving Time (DST) rules. One zone has shifted its clocks while the other has not, so the offset between them is temporarily different from usual.
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Copy Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCopy}
          className="group relative inline-flex items-center gap-1.5 rounded-lg
            bg-white/5 px-4 py-2 text-sm text-gray-300 transition-colors
            hover:bg-white/10 hover:text-white"
          aria-label="Copy converted time"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <ClipboardIcon className="h-4 w-4" />
              <span>Copy Result</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
