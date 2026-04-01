import { DateTime, IANAZone } from 'luxon'

export interface TimezoneInfo {
  id: string
  region: string
  city: string
  label: string
  abbreviation: string
  utcOffset: number
  utcOffsetStr: string
}

let cachedTimezones: TimezoneInfo[] | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function formatUtcOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return 'UTC'
  const sign = offsetMinutes > 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  return minutes === 0 ? `UTC${sign}${hours}` : `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`
}

export function getTimezoneInfo(tzId: string, atDate?: DateTime): TimezoneInfo {
  const dt = (atDate ?? DateTime.now()).setZone(tzId)
  const parts = tzId.split('/')
  const region = parts[0]
  const city = (parts[parts.length - 1] ?? region).replace(/_/g, ' ')
  const abbreviation = dt.offsetNameShort ?? ''
  const utcOffset = dt.offset
  const utcOffsetStr = formatUtcOffset(utcOffset)
  const label = `${city} (${abbreviation}, ${utcOffsetStr})`

  return {
    id: tzId,
    region,
    city,
    label,
    abbreviation,
    utcOffset,
    utcOffsetStr
  }
}

export function getAllTimezones(atDate?: DateTime): TimezoneInfo[] {
  const now = Date.now()
  if (cachedTimezones && now - cacheTimestamp < CACHE_TTL_MS && !atDate) {
    return cachedTimezones
  }

  const ids = Intl.supportedValuesOf('timeZone')
  const timezones = ids
    .filter((id) => IANAZone.isValidZone(id))
    .map((id) => getTimezoneInfo(id, atDate))

  if (!atDate) {
    cachedTimezones = timezones
    cacheTimestamp = now
  }

  return timezones
}

export function getTimezonesByRegion(atDate?: DateTime): Map<string, TimezoneInfo[]> {
  const all = getAllTimezones(atDate)
  const map = new Map<string, TimezoneInfo[]>()

  for (const tz of all) {
    const list = map.get(tz.region)
    if (list) {
      list.push(tz)
    } else {
      map.set(tz.region, [tz])
    }
  }

  return map
}
