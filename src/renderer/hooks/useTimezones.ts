import { useState, useMemo } from 'react'
import { getCanonicalTimezones, STANDARD_ABBREVIATION_MAP, TimezoneInfo } from '../lib/timezones'

interface UseTimezonesResult {
  allTimezones: TimezoneInfo[]
  filteredTimezones: TimezoneInfo[]
  groupedTimezones: Map<string, TimezoneInfo[]>
  searchQuery: string
  setSearchQuery: (query: string) => void
  clearSearch: () => void
}

function normalise(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function scoreMatch(tz: TimezoneInfo, query: string): number {
  const q = normalise(query)
  const city = normalise(tz.city)

  // Exact city match
  if (city === q) return 0
  // City starts with query
  if (city.startsWith(q)) return 1
  // City contains query
  if (city.includes(q)) return 2
  // Standard abbreviation match — e.g. "PST", "CET", "EST", "BST"
  const upperQ = query.trim().toUpperCase()
  if (STANDARD_ABBREVIATION_MAP[upperQ] === tz.id) return 3
  // Abbreviation match (current-season abbreviation from Luxon)
  if (normalise(tz.abbreviation).includes(q)) return 4
  // UTC offset match — e.g. "+5", "utc-3", "-5:30"
  if (normalise(tz.utcOffsetStr).includes(q) || tz.utcOffsetStr.replace('UTC', '').includes(query)) return 5
  // IANA ID match — e.g. "America/New_York"
  if (normalise(tz.id).includes(q)) return 6
  // Region match — e.g. "Europe"
  if (normalise(tz.region).includes(q)) return 7

  return -1 // no match
}

export function useTimezones(): UseTimezonesResult {
  const [searchQuery, setSearchQuery] = useState('')

  const allTimezones = useMemo(() => getCanonicalTimezones(), [])

  const filteredTimezones = useMemo(() => {
    const q = searchQuery.trim()

    if (!q) {
      return [...allTimezones].sort((a, b) =>
        a.region.localeCompare(b.region) || a.city.localeCompare(b.city)
      )
    }

    const scored: { tz: TimezoneInfo; score: number }[] = []
    for (const tz of allTimezones) {
      const score = scoreMatch(tz, q)
      if (score >= 0) scored.push({ tz, score })
    }

    scored.sort(
      (a, b) => a.score - b.score || a.tz.city.localeCompare(b.tz.city)
    )

    return scored.map((s) => s.tz)
  }, [allTimezones, searchQuery])

  const groupedTimezones = useMemo(() => {
    const map = new Map<string, TimezoneInfo[]>()
    for (const tz of filteredTimezones) {
      const list = map.get(tz.region)
      if (list) {
        list.push(tz)
      } else {
        map.set(tz.region, [tz])
      }
    }
    return map
  }, [filteredTimezones])

  const clearSearch = () => setSearchQuery('')

  return {
    allTimezones,
    filteredTimezones,
    groupedTimezones,
    searchQuery,
    setSearchQuery,
    clearSearch
  }
}
