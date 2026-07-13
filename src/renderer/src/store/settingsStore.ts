import { create } from 'zustand'
import type { Settings } from '@shared/types'

const DEFAULT: Settings = {
  ollamaUrl: 'http://localhost:11434',
  model: 'gemma4:e4b',
  opacity: 0.9,
  includeScreen: true
}

interface SettingsStore {
  settings: Settings
  loaded: boolean
  load: () => Promise<void>
  update: (patch: Partial<Settings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT,
  loaded: false,

  load: async () => {
    const settings = await window.screenmate.getSettings()
    set({ settings, loaded: true })
    applyOpacity(settings.opacity)
  },

  update: async (patch) => {
    const next = { ...get().settings, ...patch }
    set({ settings: next })
    if (patch.opacity !== undefined) applyOpacity(next.opacity)
    await window.screenmate.saveSettings(next)
  }
}))

function applyOpacity(opacity: number): void {
  document.documentElement.style.setProperty('--bg-opacity', String(opacity))
}
