import { contextBridge, ipcRenderer } from 'electron'
import type { ChatRequest, Settings } from '../shared/types'

contextBridge.exposeInMainWorld('screenmate', {
  captureScreen: (): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('sm:capture-screen'),

  getSettings: (): Promise<Settings> => ipcRenderer.invoke('sm:get-settings'),

  saveSettings: (settings: Settings): Promise<void> =>
    ipcRenderer.invoke('sm:save-settings', settings),

  startChat: (req: ChatRequest): void => ipcRenderer.send('sm:start-chat', req),

  cancelChat: (): void => ipcRenderer.send('sm:cancel-chat'),

  windowAction: (action: string): void => ipcRenderer.send('sm:window-action', action),

  enterSnip: (): Promise<{ chatBounds: { x: number; y: number; width: number; height: number } }> =>
    ipcRenderer.invoke('sm:enter-snip'),

  exitSnip: (): Promise<void> => ipcRenderer.invoke('sm:exit-snip'),

  captureAndCrop: (
    rect: { x: number; y: number; width: number; height: number }
  ): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('sm:capture-and-crop', rect),

  onChatChunk: (cb: (chunk: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, chunk: string): void => cb(chunk)
    ipcRenderer.on('sm:chat-chunk', handler)
    return () => ipcRenderer.removeListener('sm:chat-chunk', handler)
  },

  onChatDone: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('sm:chat-done', handler)
    return () => ipcRenderer.removeListener('sm:chat-done', handler)
  },

  onChatError: (cb: (err: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, err: string): void => cb(err)
    ipcRenderer.on('sm:chat-error', handler)
    return () => ipcRenderer.removeListener('sm:chat-error', handler)
  }
})
