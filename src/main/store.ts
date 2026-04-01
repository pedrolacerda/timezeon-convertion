import Store from 'electron-store'

interface Settings {
  theme: 'system' | 'light' | 'dark'
  launchAtLogin: boolean
  globalShortcut: string
}

interface StoreSchema {
  favorites: string[]
  settings: Settings
}

const store = new Store<StoreSchema>({
  schema: {
    favorites: {
      type: 'array',
      items: { type: 'string' },
      default: ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'America/Sao_Paulo']
    },
    settings: {
      type: 'object',
      properties: {
        theme: {
          type: 'string',
          enum: ['system', 'light', 'dark'],
          default: 'system'
        },
        launchAtLogin: {
          type: 'boolean',
          default: false
        },
        globalShortcut: {
          type: 'string',
          default: 'CommandOrControl+Shift+T'
        }
      },
      default: {
        theme: 'system',
        launchAtLogin: false,
        globalShortcut: 'CommandOrControl+Shift+T'
      }
    }
  }
})

export function getFavorites(): string[] {
  return store.get('favorites')
}

export function setFavorites(favs: string[]): void {
  store.set('favorites', favs)
}

export function getSettings(): Settings {
  return store.get('settings')
}

export function setSettings(settings: Settings): void {
  store.set('settings', settings)
}
