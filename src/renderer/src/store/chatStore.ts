import { create } from 'zustand'
import type { ChatMessage } from '@shared/types'

interface ChatStore {
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
  streamStartTime: number | null
  lastThinkingMs: number | null
  addUserMessage: (content: string, hasImage?: boolean) => void
  startAssistantMessage: () => void
  appendChunk: (chunk: string) => void
  finishAssistantMessage: () => void
  setError: (error: string | null) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  error: null,
  streamStartTime: null,
  lastThinkingMs: null,

  addUserMessage: (content, hasImage = false) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), role: 'user', content, timestamp: Date.now(), hasImage }
      ],
      error: null,
      lastThinkingMs: null
    })),

  startAssistantMessage: () =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), role: 'assistant', content: '', timestamp: Date.now() }
      ],
      isStreaming: true,
      streamStartTime: Date.now()
    })),

  appendChunk: (chunk) =>
    set((s) => {
      const messages = [...s.messages]
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + chunk }
      }
      return { messages }
    }),

  finishAssistantMessage: () =>
    set((s) => ({
      isStreaming: false,
      lastThinkingMs: s.streamStartTime != null ? Date.now() - s.streamStartTime : null,
      streamStartTime: null
    })),

  setError: (error) => set({ error, isStreaming: false, streamStartTime: null }),

  clearMessages: () =>
    set({ messages: [], error: null, isStreaming: false, streamStartTime: null, lastThinkingMs: null })
}))
