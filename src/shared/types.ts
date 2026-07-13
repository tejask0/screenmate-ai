export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  hasImage?: boolean
}

export interface OllamaMessage {
  role: MessageRole
  content: string
  images?: string[]
}

export interface Settings {
  ollamaUrl: string
  model: string
  opacity: number
  includeScreen: boolean
}

export interface ChatRequest {
  messages: OllamaMessage[]
  model: string
  ollamaUrl: string
}
