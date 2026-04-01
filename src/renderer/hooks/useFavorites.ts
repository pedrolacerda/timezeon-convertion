import { useState, useEffect, useCallback } from 'react'

export function useFavorites() {
  const [favorites, setFavoritesState] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getFavorites().then((favs) => {
      setFavoritesState(favs)
      setLoading(false)
    })
  }, [])

  const persist = useCallback(async (next: string[]) => {
    setFavoritesState(next)
    await window.api.setFavorites(next)
  }, [])

  const addFavorite = useCallback(
    async (tzId: string) => {
      if (favorites.includes(tzId)) return
      await persist([...favorites, tzId])
    },
    [favorites, persist],
  )

  const removeFavorite = useCallback(
    async (tzId: string) => {
      await persist(favorites.filter((id) => id !== tzId))
    },
    [favorites, persist],
  )

  const reorderFavorites = useCallback(
    async (newOrder: string[]) => {
      await persist(newOrder)
    },
    [persist],
  )

  const isFavorite = useCallback(
    (tzId: string) => favorites.includes(tzId),
    [favorites],
  )

  return { favorites, loading, addFavorite, removeFavorite, reorderFavorites, isFavorite }
}
