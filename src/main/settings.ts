import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import type { Settings } from '../shared/types'

const SETTINGS_FILE = join(app.getPath('userData'), 'settings.json')
const BOUNDS_FILE = join(app.getPath('userData'), 'window-bounds.json')

export const DEFAULT_SETTINGS: Settings = {
  ollamaUrl: 'http://localhost:11434',
  model: 'gemma4:e4b',
  opacity: 0.9,
  includeScreen: true
}

export function loadSettings(): Settings {
  if (!existsSync(SETTINGS_FILE)) return { ...DEFAULT_SETTINGS }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8')) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function persistSettings(settings: Settings): void {
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}

export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
}

export function loadWindowBounds(): WindowBounds {
  if (!existsSync(BOUNDS_FILE)) return { width: 400, height: 600 }
  try {
    return JSON.parse(readFileSync(BOUNDS_FILE, 'utf-8'))
  } catch {
    return { width: 400, height: 600 }
  }
}

export function persistWindowBounds(bounds: WindowBounds): void {
  writeFileSync(BOUNDS_FILE, JSON.stringify(bounds, null, 2), 'utf-8')
}
