import { ipcMain, BrowserWindow, nativeImage, screen } from 'electron'
import { captureScreen } from './screen-capture'
import { streamChat } from './ollama-client'
import { loadSettings, persistSettings } from './settings'
import type { ChatRequest, Settings } from '../shared/types'

let currentAbort: AbortController | null = null
let snipSavedBounds: Electron.Rectangle | null = null

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('sm:capture-screen', async () => {
    try {
      const data = await captureScreen(mainWindow)
      return { success: true, data }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('sm:get-settings', () => loadSettings())

  ipcMain.handle('sm:save-settings', (_event, settings: Settings) => {
    persistSettings(settings)
  })

  // Save bounds, expand to full display, and return original chat bounds in
  // display-local coordinates so the renderer can place the chat passthrough.
  ipcMain.handle('sm:enter-snip', () => {
    const saved = mainWindow.getBounds()
    snipSavedBounds = saved
    const display = screen.getPrimaryDisplay().bounds
    mainWindow.setBounds(display)
    return {
      chatBounds: {
        x: saved.x - display.x,
        y: saved.y - display.y,
        width: saved.width,
        height: saved.height
      }
    }
  })

  // Capture the full screen (excluding own window) and crop to the given rect.
  // Rect coords are in CSS pixels relative to the expanded window viewport.
  ipcMain.handle(
    'sm:capture-and-crop',
    async (_event, rect: { x: number; y: number; width: number; height: number }) => {
      try {
        const base64 = await captureScreen(mainWindow)
        const full = nativeImage.createFromBuffer(Buffer.from(base64, 'base64'))
        const { width: imgW, height: imgH } = full.getSize()
        const display = screen.getPrimaryDisplay()
        const viewportW = display.size.width
        const viewportH = display.size.height
        const scaleX = imgW / viewportW
        const scaleY = imgH / viewportH
        const cropRect = {
          x: Math.max(0, Math.round(rect.x * scaleX)),
          y: Math.max(0, Math.round(rect.y * scaleY)),
          width: Math.max(1, Math.round(rect.width * scaleX)),
          height: Math.max(1, Math.round(rect.height * scaleY))
        }
        const cropped = full.crop(cropRect)
        const data = cropped.toPNG().toString('base64')
        return { success: true, data }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    }
  )

  // Awaitable: restore window to pre-snip size
  ipcMain.handle('sm:exit-snip', () => {
    if (snipSavedBounds) {
      mainWindow.setBounds(snipSavedBounds)
      snipSavedBounds = null
    }
  })

  ipcMain.on('sm:start-chat', async (_event, req: ChatRequest) => {
    if (currentAbort) currentAbort.abort()
    currentAbort = new AbortController()

    await streamChat(
      req.messages,
      req.model,
      req.ollamaUrl,
      (chunk) => mainWindow.webContents.send('sm:chat-chunk', chunk),
      () => mainWindow.webContents.send('sm:chat-done'),
      (err) => mainWindow.webContents.send('sm:chat-error', err),
      currentAbort.signal
    )
  })

  ipcMain.on('sm:cancel-chat', () => {
    if (currentAbort) {
      currentAbort.abort()
      currentAbort = null
    }
  })

  ipcMain.on('sm:window-action', (_event, action: string) => {
    switch (action) {
      case 'minimize':
        mainWindow.minimize()
        break
      case 'close':
        mainWindow.close()
        break
      case 'compact':
        mainWindow.setSize(130, 44)
        break
      case 'restore-compact':
        mainWindow.setSize(400, 600)
        break
    }
  })
}
