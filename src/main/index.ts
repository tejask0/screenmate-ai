import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc-handlers'
import { registerHotkeys, unregisterHotkeys } from './hotkeys'
import { loadWindowBounds, persistWindowBounds } from './settings'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const bounds = loadWindowBounds()

  mainWindow = new BrowserWindow({
    ...bounds,
    show: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    transparent: true,
    frame: false,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      // With "type":"module" in package.json, electron-vite outputs the preload as .mjs
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    mainWindow!.setAlwaysOnTop(true, 'screen-saver')
  })

  mainWindow.on('close', () => {
    if (mainWindow) {
      const b = mainWindow.getBounds()
      persistWindowBounds({ x: b.x, y: b.y, width: b.width, height: b.height })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  registerIpcHandlers(mainWindow)
  registerHotkeys(mainWindow)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  unregisterHotkeys()
  if (process.platform !== 'darwin') app.quit()
})
