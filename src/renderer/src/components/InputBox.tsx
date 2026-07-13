import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'

interface Props {
  onSend: (text: string, includeScreen: boolean) => void
  isStreaming: boolean
  defaultIncludeScreen: boolean
  snipImage: string | null
  onClearSnip?: () => void
  onIncludeScreenChange?: (next: boolean) => void
}

export default function InputBox({
  onSend,
  isStreaming,
  defaultIncludeScreen,
  snipImage,
  onClearSnip,
  onIncludeScreenChange
}: Props): React.JSX.Element {
  const [text, setText] = useState('')
  const [includeScreen, setIncludeScreen] = useState(defaultIncludeScreen)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setIncludeScreen(defaultIncludeScreen)
  }, [defaultIncludeScreen])

  const toggleIncludeScreen = (): void => {
    const next = !includeScreen
    setIncludeScreen(next)
    onIncludeScreenChange?.(next)
  }

  const handleSend = (): void => {
    if (!text.trim() || isStreaming) return
    onSend(text.trim(), includeScreen)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (): void => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }

  return (
    <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
      {snipImage && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={`data:image/png;base64,${snipImage}`}
              alt="Snipped region"
              className="h-14 rounded border border-white/20 object-cover"
              style={{ maxWidth: '160px' }}
            />
            {onClearSnip && (
              <button
                onClick={onClearSnip}
                className="app-no-drag absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white text-[10px] flex items-center justify-center"
                title="Clear snip"
              >
                ✕
              </button>
            )}
          </div>
          <span className="text-[10px] text-green-400">
            Region captured · ask a question and send
          </span>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={toggleIncludeScreen}
          className={`app-no-drag shrink-0 rounded-lg p-2 text-base transition-colors ${
            includeScreen
              ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50'
              : 'text-gray-500 hover:bg-white/10 hover:text-gray-300'
          }`}
          title={
            includeScreen
              ? 'Screen capture: on (snip mode active — click to disable)'
              : 'Screen capture: off (click to enable snip mode)'
          }
        >
          📷
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Waiting for response…' : 'Ask about your screen…'}
          rows={1}
          disabled={isStreaming}
          className="app-no-drag min-h-[36px] flex-1 resize-none rounded-lg bg-white/8 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500/60 disabled:opacity-40 border border-white/10"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isStreaming}
          className="app-no-drag shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
          title="Send (Enter)"
        >
          {isStreaming ? '…' : '↑'}
        </button>
      </div>
    </div>
  )
}
