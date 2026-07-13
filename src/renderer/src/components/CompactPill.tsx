import React from 'react'

interface Props {
  isStreaming: boolean
  onRestore: () => void
}

export default function CompactPill({ isStreaming, onRestore }: Props): React.JSX.Element {
  return (
    <button
      onClick={onRestore}
      className="flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-full overlay-bg border border-white/20 shadow-xl transition-colors hover:border-white/30"
      title="Click to restore (or Cmd+Shift+Space)"
    >
      <span className="text-sm">👁</span>
      {isStreaming && <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />}
    </button>
  )
}
