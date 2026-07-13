import { globalShortcut, BrowserWindow } from 'electron'

export function registerHotkeys(mainWindow: BrowserWindow): void {
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll()
}
