import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'

export function useClock(timezone?: string): DateTime {
  const [now, setNow] = useState(() =>
    timezone ? DateTime.now().setZone(timezone) : DateTime.now()
  )

  useEffect(() => {
    const id = setInterval(() => {
      setNow(timezone ? DateTime.now().setZone(timezone) : DateTime.now())
    }, 1000)

    return () => clearInterval(id)
  }, [timezone])

  return now
}
