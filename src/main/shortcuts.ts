import { globalShortcut } from 'electron'
import { getPopoverWindow } from './tray'
import { getSettings } from './store'

export function registerGlobalShortcut(): void {
  const settings = getSettings()
  const accelerator = settings.globalShortcut || 'CommandOrControl+Shift+T'

  try {
    globalShortcut.register(accelerator, () => {
      const popover = getPopoverWindow()
      if (popover) {
        if (popover.isVisible()) {
          popover.hide()
        } else {
          popover.show()
        }
      }
    })
  } catch (err) {
    console.warn(`Failed to register global shortcut "${accelerator}":`, err)
  }
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll()
}

export function updateGlobalShortcut(): void {
  unregisterAllShortcuts()
  registerGlobalShortcut()
}
