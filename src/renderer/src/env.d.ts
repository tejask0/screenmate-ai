import type { ChatRequest, Settings } from '@shared/types'

declare global {
  interface Window {
    screenmate: {
      captureScreen: () => Promise<{ success: boolean; data?: string; error?: string }>
      captureAndCrop: (rect: {
        x: number
        y: number
        width: number
        height: number
      }) => Promise<{ success: boolean; data?: string; error?: string }>
      getSettings: () => Promise<Settings>
      saveSettings: (settings: Settings) => Promise<void>
      startChat: (req: ChatRequest) => void
      cancelChat: () => void
      windowAction: (action: 'minimize' | 'close' | 'compact' | 'restore-compact') => void
      enterSnip: () => Promise<{
        chatBounds: { x: number; y: number; width: number; height: number }
      }>
      exitSnip: () => Promise<void>
      onChatChunk: (cb: (chunk: string) => void) => () => void
      onChatDone: (cb: () => void) => () => void
      onChatError: (cb: (err: string) => void) => () => void
    }
  }
}

export {}
