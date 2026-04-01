export interface Settings {
  theme: 'system' | 'light' | 'dark'
  launchAtLogin: boolean
  globalShortcut: string
}

export interface ElectronAPI {
  getFavorites: () => Promise<string[]>
  setFavorites: (favs: string[]) => Promise<void>
  getSettings: () => Promise<Settings>
  setSettings: (settings: Settings) => Promise<void>
  copyToClipboard: (text: string) => Promise<void>
  getTheme: () => Promise<'light' | 'dark'>
  onThemeChange: (callback: (theme: string) => void) => () => void
  getViewMode: () => string
  showMainWindow: () => void
  openSettings: () => void
  onSwitchToSettings: (callback: () => void) => () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
