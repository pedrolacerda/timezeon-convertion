import { DateTime, IANAZone } from 'luxon'

/**
 * Canonical representative IANA timezone IDs — one city per major world timezone.
 * These are shown when browsing without a search query.
 */
export const CANONICAL_TIMEZONE_IDS: readonly string[] = [
  // Americas
  'Pacific/Pago_Pago',              // UTC-11, SST  — Pago Pago
  'Pacific/Honolulu',               // UTC-10, HST  — Honolulu
  'America/Anchorage',              // UTC-9,  AKST — Anchorage
  'America/Los_Angeles',            // UTC-8,  PST  — Los Angeles
  'America/Phoenix',                // UTC-7,  MST  — Phoenix (no DST)
  'America/Denver',                 // UTC-7,  MST  — Denver (with DST)
  'America/Chicago',                // UTC-6,  CST  — Chicago
  'America/New_York',               // UTC-5,  EST  — New York
  'America/Halifax',                // UTC-4,  AST  — Halifax
  'America/Sao_Paulo',              // UTC-3,  BRT  — São Paulo
  'America/Argentina/Buenos_Aires', // UTC-3,  ART  — Buenos Aires
  // Atlantic
  'Atlantic/Azores',                // UTC-1,  AZOT — Azores
  // Europe & Africa
  'Europe/London',                  // UTC+0,  GMT  — London
  'Europe/Lisbon',                  // UTC+0,  WET  — Lisbon
  'Europe/Paris',                   // UTC+1,  CET  — Paris
  'Europe/Moscow',                  // UTC+3,  MSK  — Moscow
  'Europe/Athens',                  // UTC+2,  EET  — Athens
  'Africa/Lagos',                   // UTC+1,  WAT  — Lagos
  'Africa/Cairo',                   // UTC+2,  EET  — Cairo (no DST)
  'Africa/Johannesburg',            // UTC+2,  SAST — Johannesburg
  'Africa/Nairobi',                 // UTC+3,  EAT  — Nairobi
  // Middle East & Asia
  'Asia/Tehran',                    // UTC+3:30, IRST — Tehran
  'Asia/Dubai',                     // UTC+4,  GST  — Dubai
  'Asia/Kabul',                     // UTC+4:30, AFT — Kabul
  'Asia/Karachi',                   // UTC+5,  PKT  — Karachi
  'Asia/Kolkata',                   // UTC+5:30, IST — Mumbai / Kolkata
  'Asia/Kathmandu',                 // UTC+5:45, NPT — Kathmandu
  'Asia/Dhaka',                     // UTC+6,  BST  — Dhaka
  'Asia/Yangon',                    // UTC+6:30, MMT — Yangon
  'Asia/Bangkok',                   // UTC+7,  ICT  — Bangkok
  'Asia/Shanghai',                  // UTC+8,  CST  — Shanghai / Beijing
  'Asia/Singapore',                 // UTC+8,  SGT  — Singapore
  'Asia/Tokyo',                     // UTC+9,  JST  — Tokyo
  // Australia & Pacific
  'Australia/Darwin',               // UTC+9:30, ACST — Darwin (no DST)
  'Australia/Sydney',               // UTC+10, AEST — Sydney
  'Pacific/Noumea',                 // UTC+11, NCT  — Nouméa
  'Pacific/Auckland',               // UTC+12, NZST — Auckland
  'Pacific/Apia',                   // UTC+13, WST  — Apia
] as const

/**
 * Maps standard/common timezone abbreviations to their canonical IANA timezone ID.
 * Used so users can search "PST", "CET", "EST", "BST", etc. and get the right result.
 * Note: ambiguous abbreviations (e.g. CST, BST) are resolved to the most commonly
 * searched meaning (US Central for CST, British Summer Time for BST).
 */
export const STANDARD_ABBREVIATION_MAP: Readonly<Record<string, string>> = {
  // North America
  SST:  'Pacific/Pago_Pago',
  HST:  'Pacific/Honolulu',
  HDT:  'Pacific/Honolulu',
  AKST: 'America/Anchorage',
  AKDT: 'America/Anchorage',
  PST:  'America/Los_Angeles',
  PDT:  'America/Los_Angeles',
  MST:  'America/Phoenix',
  MDT:  'America/Denver',
  CST:  'America/Chicago',
  CDT:  'America/Chicago',
  EST:  'America/New_York',
  EDT:  'America/New_York',
  ET:   'America/New_York',
  CT:   'America/Chicago',
  MT:   'America/Denver',
  PT:   'America/Los_Angeles',
  AT:   'America/Halifax',
  AST:  'America/Halifax',
  ADT:  'America/Halifax',
  // South America
  BRT:  'America/Sao_Paulo',
  BRST: 'America/Sao_Paulo',
  ART:  'America/Argentina/Buenos_Aires',
  // Atlantic
  AZOT: 'Atlantic/Azores',
  AZOST:'Atlantic/Azores',
  // Europe
  GMT:  'Europe/London',
  BST:  'Europe/London',
  WET:  'Europe/Lisbon',
  WEST: 'Europe/Lisbon',
  CET:  'Europe/Paris',
  CEST: 'Europe/Paris',
  EET:  'Europe/Athens',
  EEST: 'Europe/Athens',
  MSK:  'Europe/Moscow',
  // Africa
  WAT:  'Africa/Lagos',
  SAST: 'Africa/Johannesburg',
  CAT:  'Africa/Johannesburg',
  EAT:  'Africa/Nairobi',
  // Middle East
  IRST: 'Asia/Tehran',
  IRDT: 'Asia/Tehran',
  GST:  'Asia/Dubai',
  // South & Southeast Asia
  AFT:  'Asia/Kabul',
  PKT:  'Asia/Karachi',
  IST:  'Asia/Kolkata',
  NPT:  'Asia/Kathmandu',
  MMT:  'Asia/Yangon',
  ICT:  'Asia/Bangkok',
  SGT:  'Asia/Singapore',
  // East Asia
  JST:  'Asia/Tokyo',
  KST:  'Asia/Seoul',
  HKT:  'Asia/Hong_Kong',
  // Australia
  AWST: 'Australia/Perth',
  ACST: 'Australia/Darwin',
  ACDT: 'Australia/Adelaide',
  AEST: 'Australia/Sydney',
  AEDT: 'Australia/Sydney',
  ACT:  'Australia/Sydney',
  // Pacific
  NZST: 'Pacific/Auckland',
  NZDT: 'Pacific/Auckland',
  WST:  'Pacific/Apia',
} as const

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

/**
 * Returns one representative TimezoneInfo per major world timezone.
 * Use this for default lists / dropdowns to avoid showing hundreds of city duplicates.
 */
export function getCanonicalTimezones(atDate?: DateTime): TimezoneInfo[] {
  return CANONICAL_TIMEZONE_IDS
    .filter((id) => IANAZone.isValidZone(id))
    .map((id) => getTimezoneInfo(id, atDate))
}
