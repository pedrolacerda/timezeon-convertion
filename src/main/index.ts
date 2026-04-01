import { app, BrowserWindow, clipboard, ipcMain, nativeTheme, shell } from 'electron'
import { join } from 'path'
import { getFavorites, setFavorites, getSettings, setSettings } from './store'
import { createTray } from './tray'
import { registerGlobalShortcut, unregisterAllShortcuts, updateGlobalShortcut } from './shortcuts'

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow
  }
  return null
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 380,
    minHeight: 400,
    resizable: true,
    title: 'TimeZap ⚡',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?view=main`)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { view: 'main' }
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // IPC handlers
  ipcMain.handle('get-favorites', () => getFavorites())
  ipcMain.handle('set-favorites', (_event, favs) => setFavorites(favs))
  ipcMain.handle('get-settings', () => getSettings())
  ipcMain.handle('set-settings', (_event, settings) => {
    setSettings(settings)
    app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin })
    updateGlobalShortcut()
  })
  ipcMain.handle('copy-to-clipboard', (_event, text) => {
    clipboard.writeText(text)
  })
  ipcMain.handle('get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light')

  ipcMain.on('show-main-window', () => {
    const win = getMainWindow()
    if (win) {
      win.show()
      win.focus()
    }
  })

  ipcMain.on('open-settings', () => {
    const win = getMainWindow()
    if (win) {
      win.show()
      win.focus()
      win.webContents.send('switch-to-settings')
    }
  })

  // Broadcast theme changes to all windows
  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('theme-changed', theme)
    })
  })

  const settings = getSettings()
  app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin })

  createWindow()
  createTray()
  registerGlobalShortcut()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('will-quit', () => {
  unregisterAllShortcuts()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
