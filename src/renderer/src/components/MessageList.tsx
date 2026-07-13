import React, { useEffect, useRef } from 'react'
import type { ChatMessage } from '@shared/types'
import { useChatStore } from '../store/chatStore'

function formatThinkingTime(ms: number): string {
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  const rem = sec % 60
  return rem > 0 ? `${min}m ${rem}s` : `${min}m`
}

function ThinkingBubble(): React.JSX.Element {
  return (
    <div className="bg-white/8 text-gray-400 border border-white/10 rounded-xl px-4 py-3 text-sm flex items-center gap-2.5">
      <span className="flex gap-1 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
      </span>
      <span>Thinking…</span>
    </div>
  )
}

interface Props {
  messages: ChatMessage[]
  isStreaming: boolean
}

export default function MessageList({ messages, isStreaming }: Props): React.JSX.Element {
  const { lastThinkingMs } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-6">
        <div className="text-4xl opacity-60">👁</div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Ask me anything about your screen.
          <br />
          Toggle 📷 to include a screenshot.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
      {messages.map((msg, i) => {
        const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1
        const isThinking = isLastAssistant && isStreaming && msg.content === ''
        const showThinkingTime = isLastAssistant && !isStreaming && lastThinkingMs != null

        return (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {isThinking ? (
              <ThinkingBubble />
            ) : (
              <div className={`flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                {showThinkingTime && (
                  <span className="text-[10px] text-gray-500 px-1">
                    Thought for {formatThinkingTime(lastThinkingMs!)}
                  </span>
                )}
                <div
                  className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600/40 text-white border border-blue-500/20'
                      : 'bg-white/8 text-gray-100 border border-white/10'
                  }`}
                >
                  {msg.hasImage && (
                    <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                      <span>📷</span>
                      <span>Screen included</span>
                    </div>
                  )}
                  <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                  {isLastAssistant && isStreaming && (
                    <span className="ml-0.5 inline-block w-1.5 h-3.5 bg-gray-300 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
