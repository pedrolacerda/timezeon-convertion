import { DateTime } from 'luxon'

export interface ConversionResult {
  sourceTimezone: string
  targetTimezone: string
  sourceTime: DateTime
  targetTime: DateTime
  sourceFormatted: string
  targetFormatted: string
  offsetDiff: string
  isDSTTransition: boolean
}

const FULL_FORMAT = "MMM d, yyyy h:mm a ZZZZ"
const SHORT_FORMAT = "h:mm a"

export function convertTime(
  sourceTimezone: string,
  targetTimezone: string,
  dateTime?: DateTime
): ConversionResult {
  const sourceTime = dateTime
    ? dateTime.setZone(sourceTimezone)
    : DateTime.now().setZone(sourceTimezone)

  const targetTime = sourceTime.setZone(targetTimezone)

  const sourceFormatted = sourceTime.toFormat(FULL_FORMAT)
  const targetFormatted = targetTime.toFormat(FULL_FORMAT)

  const offsetDiff = formatOffsetDiff(sourceTimezone, targetTimezone)
  const isDSTTransition = sourceTime.isInDST !== targetTime.isInDST

  return {
    sourceTimezone,
    targetTimezone,
    sourceTime,
    targetTime,
    sourceFormatted,
    targetFormatted,
    offsetDiff,
    isDSTTransition
  }
}

export function currentTimeIn(timezone: string): DateTime {
  return DateTime.now().setZone(timezone)
}

export function formatTime(dt: DateTime, format?: string): string {
  return dt.toFormat(format ?? FULL_FORMAT)
}

export function formatOffsetDiff(sourceTz: string, targetTz: string): string {
  const now = DateTime.now()
  const sourceOffset = now.setZone(sourceTz).offset
  const targetOffset = now.setZone(targetTz).offset
  const diffMinutes = targetOffset - sourceOffset

  if (diffMinutes === 0) return 'same time'

  const sign = diffMinutes > 0 ? '+' : '-'
  const abs = Math.abs(diffMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)

  return `${sign}${parts.join(' ')}`
}
