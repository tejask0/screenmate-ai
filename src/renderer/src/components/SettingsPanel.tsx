import React from 'react'
import { useSettingsStore } from '../store/settingsStore'

export default function SettingsPanel(): React.JSX.Element {
  const { settings, update } = useSettingsStore()

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="p-4 space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Model</label>
          <input
            type="text"
            value={settings.model}
            onChange={(e) => update({ model: e.target.value })}
            className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500/60"
            placeholder="gemma4:e4b"
          />
          <p className="mt-1 text-xs text-gray-500">e.g. gemma4:e4b, llama3.2, gemma3:4b</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Ollama URL</label>
          <input
            type="text"
            value={settings.ollamaUrl}
            onChange={(e) => update({ ollamaUrl: e.target.value })}
            className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500/60"
            placeholder="http://localhost:11434"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            Opacity — {Math.round(settings.opacity * 100)}%
          </label>
          <input
            type="range"
            min="40"
            max="100"
            value={Math.round(settings.opacity * 100)}
            onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
            className="w-full accent-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-300">Include screen by default</p>
            <p className="text-xs text-gray-500">Capture screen when sending messages</p>
          </div>
          <button
            onClick={() => update({ includeScreen: !settings.includeScreen })}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              settings.includeScreen ? 'bg-blue-600' : 'bg-gray-600'
            }`}
            role="switch"
            aria-checked={settings.includeScreen}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                settings.includeScreen ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500">
            Shortcut: <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-gray-300">⌘⇧Space</kbd> to show/hide
          </p>
        </div>
      </div>
    </div>
  )
}
