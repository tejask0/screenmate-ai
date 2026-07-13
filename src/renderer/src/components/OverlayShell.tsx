import React from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onCompact: () => void
  onSettings: () => void
  showingSettings: boolean
}

export default function OverlayShell({
  children,
  onCompact,
  onSettings,
  showingSettings
}: Props): React.JSX.Element {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl overlay-bg shadow-2xl border border-white/10">
      {/* Title bar — drag region */}
      <div className="app-drag relative flex h-10 shrink-0 items-center px-4 border-b border-white/10">
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm">👁</span>
          <span className="text-sm font-semibold text-white/90">ScreenMate</span>
        </div>
        <div className="app-no-drag flex items-center gap-0.5">
          <button
            onClick={onSettings}
            className="rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            title={showingSettings ? 'Back to chat' : 'Settings'}
          >
            {showingSettings ? '←' : '⚙'}
          </button>
          <button
            onClick={onCompact}
            className="rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            title="Compact mode (Cmd+Shift+Space to restore)"
          >
            —
          </button>
          <button
            onClick={() => window.screenmate.windowAction('close')}
            className="rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-500/70 hover:text-white"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
