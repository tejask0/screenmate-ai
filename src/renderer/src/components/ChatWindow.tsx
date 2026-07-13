import React from 'react'
import MessageList from './MessageList'
import InputBox from './InputBox'
import { useChatStore } from '../store/chatStore'

interface Props {
  onSend: (text: string, includeScreen: boolean) => void
  defaultIncludeScreen: boolean
  snipImage: string | null
  onClearSnip?: () => void
  onIncludeScreenChange?: (next: boolean) => void
}

export default function ChatWindow({
  onSend,
  defaultIncludeScreen,
  snipImage,
  onClearSnip,
  onIncludeScreenChange
}: Props): React.JSX.Element {
  const { messages, isStreaming, error } = useChatStore()

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <MessageList messages={messages} isStreaming={isStreaming} />
      {error && (
        <div className="mx-3 mb-2 rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          ⚠ {error}
        </div>
      )}
      <InputBox
        onSend={onSend}
        isStreaming={isStreaming}
        defaultIncludeScreen={defaultIncludeScreen}
        snipImage={snipImage}
        onClearSnip={onClearSnip}
        onIncludeScreenChange={onIncludeScreenChange}
      />
    </div>
  )
}
