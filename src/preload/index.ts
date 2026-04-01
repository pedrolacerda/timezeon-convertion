import { contextBridge, ipcRenderer } from 'electron'
import type { Settings } from './types'

contextBridge.exposeInMainWorld('api', {
  // Favorites
  getFavorites: (): Promise<string[]> => ipcRenderer.invoke('get-favorites'),
  setFavorites: (favs: string[]): Promise<void> => ipcRenderer.invoke('set-favorites', favs),

  // Settings
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),
  setSettings: (settings: Settings): Promise<void> => ipcRenderer.invoke('set-settings', settings),

  // Clipboard
  copyToClipboard: (text: string): Promise<void> => ipcRenderer.invoke('copy-to-clipboard', text),

  // Theme
  getTheme: (): Promise<'light' | 'dark'> => ipcRenderer.invoke('get-theme'),
  onThemeChange: (callback: (theme: string) => void): (() => void) => {
    ipcRenderer.on('theme-changed', (_event, theme) => callback(theme))
    return () => ipcRenderer.removeAllListeners('theme-changed')
  },

  // Window info
  getViewMode: (): string => {
    const params = new URLSearchParams(window.location.search)
    return params.get('view') || 'main'
  },

  showMainWindow: (): void => { ipcRenderer.send('show-main-window') },
  openSettings: (): void => { ipcRenderer.send('open-settings') },

  onSwitchToSettings: (callback: () => void): (() => void) => {
    ipcRenderer.on('switch-to-settings', () => callback())
    return () => ipcRenderer.removeAllListeners('switch-to-settings')
  }
})
