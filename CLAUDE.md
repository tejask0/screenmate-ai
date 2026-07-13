# ScreenMate — Claude Code Guide

Full project spec lives in `Plan.md`. This file is the quick-reference for Claude Code.

## Stack

Electron + React + TypeScript · electron-vite · Tailwind CSS · Zustand · Ollama (localhost:11434)

## Structure

```
src/main/
  index.ts           # App entry — creates window, registers IPC + hotkeys, saves bounds on close
  settings.ts        # Persists Settings + WindowBounds to userData JSON files
  screen-capture.ts  # desktopCapturer wrapper (hides own window before capture)
  ollama-client.ts   # Streams /api/chat; handles "Ollama down" + "model missing" errors
  hotkeys.ts         # Cmd/Ctrl+Shift+Space global shortcut to show/hide overlay
  ipc-handlers.ts    # All IPC channels: capture-screen, start-chat, cancel-chat, settings, window-action
src/preload/
  index.ts           # contextBridge only — exposes window.screenmate API
src/renderer/src/
  App.tsx            # Root — manages compact/settings state, sends messages to Ollama
  env.d.ts           # window.screenmate type declaration
  components/
    OverlayShell.tsx  # Frameless chrome: .app-drag title bar, ⚙/←/—/✕ buttons
    ChatWindow.tsx    # MessageList + InputBox + error banner
    MessageList.tsx   # Bubbles, auto-scroll, streaming cursor
    InputBox.tsx      # Textarea (Enter=send), 📷 screen toggle, send button
    CompactPill.tsx   # 130×44 pill shown in compact mode; click to restore
    SettingsPanel.tsx # Model, Ollama URL, opacity slider, include-screen toggle
  store/
    chatStore.ts      # Messages, isStreaming, error — Zustand
    settingsStore.ts  # Settings loaded from main on init; opacity → CSS var live
src/shared/
  types.ts           # ChatMessage, OllamaMessage, Settings, ChatRequest — shared by all layers
```

## IPC Channels

| Channel | Direction | Description |
|---|---|---|
| `sm:capture-screen` | invoke | Capture primary display (hides+restores window); returns base64 PNG |
| `sm:get-settings` | invoke | Load settings from disk |
| `sm:save-settings` | invoke | Persist settings to disk |
| `sm:start-chat` | send | Start streaming Ollama request (aborts previous) |
| `sm:cancel-chat` | send | Abort in-flight Ollama request |
| `sm:window-action` | send | `minimize` \| `close` \| `compact` \| `restore-compact` |
| `sm:chat-chunk` | main→renderer | Streaming token from Ollama |
| `sm:chat-done` | main→renderer | Stream complete |
| `sm:chat-error` | main→renderer | Error string (surfaced in UI) |

## Hard Rules

- Never `nodeIntegration: true`. All main-process APIs go through `contextBridge`.
- Validate all IPC input in main — renderer is untrusted.
- No screen captures on keystrokes — only on message send with "include screen" on.
- Exclude ScreenMate's own window from `desktopCapturer` (hide → capture → show).
- Stream Ollama responses; never wait for full completion.
- With `"type":"module"` in package.json, electron-vite outputs the preload as `index.mjs` — the main process references `../preload/index.mjs` accordingly.

## Scope Guard

Before adding a feature, check `Plan.md` Roadmap:
- v0.1 = **shipped** ✓
- v0.2+ (voice, TTS) and v0.3+ (desktop control) = defer, ask first

## Dev

```bash
npm run dev       # hot-reload dev mode
npm run typecheck # type check only
npm run build     # production build
```

Primary model: `gemma4:e4b` via Ollama. Fallback: `llama3.2`.

Settings + window bounds persisted to: `~/Library/Application Support/screenmateai/` (macOS).
