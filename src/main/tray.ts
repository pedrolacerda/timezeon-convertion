import { app, BrowserWindow, Tray, nativeImage } from 'electron'
import { join } from 'path'

let tray: Tray | null = null
let popoverWindow: BrowserWindow | null = null

function createPopoverWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 350,
    height: 450,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Hide from dock on macOS
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  win.on('blur', () => {
    win.hide()
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?view=popover`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { view: 'popover' }
    })
  }

  return win
}

function positionPopover(win: BrowserWindow): void {
  if (!tray) return

  const trayBounds = tray.getBounds()
  const windowBounds = win.getBounds()

  // Center the popover horizontally below the tray icon
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
  const y = Math.round(trayBounds.y + trayBounds.height)

  win.setPosition(x, y, false)
}

function togglePopover(): void {
  if (!popoverWindow || popoverWindow.isDestroyed()) {
    popoverWindow = createPopoverWindow()
  }

  if (popoverWindow.isVisible()) {
    popoverWindow.hide()
  } else {
    positionPopover(popoverWindow)
    popoverWindow.show()
    popoverWindow.focus()
  }
}

export function createTray(): void {
  // Use an empty image and set title as the tray indicator
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setTitle('⚡')
  tray.setToolTip('TimeZap — Timezone Converter')

  tray.on('click', () => {
    togglePopover()
  })
}

export function getPopoverWindow(): BrowserWindow | null {
  if (popoverWindow && !popoverWindow.isDestroyed()) {
    return popoverWindow
  }
  return null
}
