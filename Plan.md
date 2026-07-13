# CLAUDE.md

This file provides guidance to Claude Code when working on the ScreenMate project.

---

## Project Overview

**ScreenMate** (placeholder name) is a fully local, open-source desktop AI assistant that can see your screen and converse with you via chat (voice I/O coming later). It can also control your screen (Desktop control coming later).

### Core Principles

1. **Fully local first** — No cloud APIs required. All inference runs on the user's machine via Ollama.
2. **Privacy by default** — Screen data never leaves the device. No telemetry unless explicitly opted-in.
3. **Open source** — MIT licensed. Built in public.
4. **Learning project** — Code clarity and understanding matter more than premature optimization.

### What ScreenMate Does

- Captures the user's screen (periodically or on-demand)
- Sends screenshots to a local vision-capable LLM
- Presents a chat interface where the user can ask questions about what's on screen
- Responds based on screen context + conversation history

### What ScreenMate Does NOT Do (Yet)

- Voice input/output (planned for v0.2)
- Desktop control (Planned for v0.3)
- Cloud model support (may add optionally later)
- Continuous 24/7 recording (that's Screenpipe's job; we're real-time conversational)

---

## Tech Stack

| Layer | Choice
|---|---|
| Desktop shell | Electron
| Frontend | React + TypeScript
| Build tooling | Vite + electron-builder
| Styling | Tailwind CSS
| State | Zustand or React Context, no redux
| IPC | Electron contextBridge + ipcRenderer
| LLM runtime | Ollama (local HTTP API on `localhost:11434`)
| Primary model | **Gemma 4 E4B** (via Ollama)
| Fallback chat | llama3.2 / gemma3
| Window mode | Always-on-top overlay


### Deferred to v0.2+

- **STT:** Use Gemma 4's native audio input if Ollama support is solid; otherwise whisper.cpp as fallback
- **TTS:** Piper or Kokoro (local, fast, high-quality) — Gemma 4 outputs text only, so TTS is still needed
- **Tauri migration:** consider only if Electron bloat becomes a problem

### Deferred to v0.3+

- **Desktop control**
---

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Electron Main Process (Node.js)                 │
│  - Overlay window management (always-on-top)    │
│  - desktopCapturer (screen capture)             │
│  - Ollama HTTP client                           │
│  - IPC handlers                                 │
└────────────────┬────────────────────────────────┘
                 │ IPC (contextBridge)
┌────────────────▼────────────────────────────────┐
│ Electron Renderer Process (React + TS)          │
│  - Floating chat UI (semi-transparent overlay)  │
│  - Screen preview / capture trigger             │
│  - Settings (model selection, opacity, etc.)    │
└─────────────────────────────────────────────────┘
                 │ HTTP
┌────────────────▼────────────────────────────────┐
│ Ollama (user's machine, localhost:11434)        │
│  - Gemma 4 E4B                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Overlay Window Behavior

The chat window is designed as a **floating, always-on-top overlay** — the user can see their screen and the chat simultaneously. Key behaviors:

- `alwaysOnTop: true` so it stays visible over other apps
- Semi-transparent background (user-configurable opacity, e.g. 85-95%)
- Resizable + draggable, remembers last position
- Compact mode: can shrink to a small pill/icon when not in use
- **Does not capture itself** when taking screenshots (exclude own window ID from desktopCapturer sources)
- Click-through disabled by default (overlay is interactive, not passive)
- Hotkey to show/hide (e.g. `Cmd/Ctrl + Shift + Space`)

### Key Flows

**Chat with screen context:**
1. User types a message in the overlay chat window
2. Renderer requests screen capture via IPC
3. Main process captures active display (excluding ScreenMate's own window)
4. Screenshot encoded as base64 PNG, downscaled if needed
5. Main process calls Ollama `/api/generate` with Gemma 4 + image + user prompt + prior chat history
6. Streaming response flows back through IPC to renderer
7. UI renders token-by-token in the overlay

**Chat without screen context:**
1. User toggles off "include screen" or asks a non-visual question
2. Main process calls Ollama with the same model, no image attached
3. Faster response, less context

---

## Project Structure

```
screenmate/
├── src/
│   ├── main/                  # Electron main process
│   │   ├── index.ts           # Entry point
│   │   ├── window.ts          # Overlay window config (always-on-top, transparent)
│   │   ├── ipc-handlers.ts    # IPC message handlers
│   │   ├── screen-capture.ts  # desktopCapturer wrapper (excludes own window)
│   │   ├── hotkeys.ts         # Global shortcuts (show/hide overlay)
│   │   └── ollama-client.ts   # HTTP client for Ollama
│   ├── renderer/              # React UI
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── OverlayShell.tsx    # Draggable/resizable container
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── InputBox.tsx
│   │   │   ├── CompactPill.tsx     # Minimized-mode icon
│   │   │   └── SettingsPanel.tsx
│   │   ├── hooks/
│   │   ├── store/             # Zustand stores
│   │   └── index.tsx
│   ├── preload/               # contextBridge API surface
│   │   └── index.ts
│   └── shared/                # Shared types/constants
│       └── types.ts
├── public/
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE                    # MIT
└── CLAUDE.md                  
```

---

## Development Guidelines

### Code Style

- TypeScript strict mode. No `any` unless absolutely unavoidable (and comment why).
- Functional React components with hooks. No class components.
- Prefer composition over inheritance.
- Small, focused files. If a file exceeds ~200 lines, consider splitting.
- Use `async/await`, not `.then()` chains.

### Electron Security

- **Always** use `contextBridge` to expose main-process APIs to the renderer. Never set `nodeIntegration: true`.
- Validate all IPC input in main process handlers. Renderer is untrusted by default.
- Screen capture permission must be explicit — show user what's being captured.

### Performance

- Don't capture the screen on every keystroke. Capture only when:
  - User sends a message AND has "include screen" enabled
  - User explicitly triggers a capture
- Downscale screenshots before sending to Gemma 4 (1280x720 is usually enough; Gemma 4's vision encoder handles 256/512/768 native resolutions).
- Stream responses from Ollama; don't wait for full completion.
- Overlay window should be lightweight — no heavy renders on every message token. Throttle re-renders during streaming if needed.
- Exclude ScreenMate's own window from screen captures to avoid infinite-mirror effects and wasted tokens.

### Error Handling

- Ollama not running → show clear user-facing error with link to install instructions
- Model not installed → suggest `ollama pull <model>` command
- Screen capture permission denied (macOS) → guide user to System Preferences
- Never swallow errors silently. Log to console in dev; surface to user in prod.

---

## Testing Approach

For v0.1, prioritize manual testing and smoke tests over unit test coverage. Add tests for:

- IPC message contracts (shared types match both sides)
- Ollama client retry/error handling
- Screen capture fallback paths

Don't over-engineer the test suite for a learning project. Ship, then test where it actually matters.

---

## Build & Run

```bash
# Install dependencies
npm install

# Dev mode (hot reload)
npm run dev

# Build for current platform
npm run build

# Build for all platforms
npm run build:all
```

### Prerequisites (user-facing, for README)

1. Install Ollama: https://ollama.com
2. Check for existing gemma4 model: `ollama list`
2. Pull Gemma 4 (multimodal) if not already there: `ollama pull gemma4:e4b` (≈7.5GB)
3. Run ScreenMate

---

## Roadmap

### v0.1 (MVP — current scope)
- [ ] Electron + React scaffolding
- [ ] Always-on-top, semi-transparent overlay window (draggable, resizable)
- [ ] Global hotkey to show/hide overlay
- [ ] Chat UI with message history
- [ ] Ollama client (streaming) integrated with Gemma 4
- [ ] Screen capture via desktopCapturer (excluding own window)
- [ ] Send screenshot + prompt to Gemma 4
- [ ] Compact/minimized pill mode
- [ ] Settings panel (model selection, Ollama URL, opacity)
- [ ] Cross-platform builds (macOS, Windows, Linux)

### v0.2 (Voice)
- [ ] Voice input — use Gemma 4's native audio input if Ollama support is ready; else whisper.cpp
- [ ] Voice output — integrate Piper or Kokoro for TTS
- [ ] Push-to-talk UI in overlay
- [ ] Voice-first mode (hands-free, conversational)

### v0.3+ (planned future work)
- [ ] **Desktop control / automation** — ability to click, type, and control apps based on user voice/chat commands (e.g. via `@nut-tree/nut-js`). Introduces significant complexity and safety considerations — scope carefully when we get there.
- [ ] Multi-monitor source selection
- [ ] Conversation history persistence (SQLite)
- [ ] Custom system prompts / personas
- [ ] Optional cloud model support (Anthropic, OpenAI, Gemini)
- [ ] MCP server mode (expose screen to other AI tools)
- [ ] Evaluate Gemma 4 as primary model once multimodal Ollama support is mature

---

## Non-Goals

Be deliberate about what this project is NOT. Saying no keeps the scope sharp.

- **Not a screen recorder.** Screenpipe already does that well — we're real-time conversational, not archival.
- **Not a team/enterprise product.** Single user, single machine.
- **Not a plugin platform.** Keep it focused and simple.
- **Not a general productivity suite.** We're a conversation layer over the screen, not a replacement for your tools.

> Desktop control (clicking, typing, automating apps) was initially a non-goal but is now planned for v0.3+. It stays out of v0.1/v0.2 because it introduces significant complexity (accessibility permissions, safety guardrails, undo semantics) that would distract from nailing the core "see + converse" loop first.

If a feature request doesn't fit the core loop of "see screen → converse," defer it to v0.3+ or decline.

---

## Contribution Philosophy

- Open source from day one (MIT).
- Build in public — progress updates on GitHub + social.
- PRs welcome, but the author sets the direction. This is a learning project, not a committee.
- Documentation is part of the deliverable, not an afterthought.

---

## References & Prior Art

- [Screenpipe](https://github.com/screenpipe/screenpipe) — screen recording + memory (different use case)
- [Desktop Companion AI](https://desktopaicompanion.com) — similar concept, closed source
- [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) — chat frontend (no screen vision)
- [Open WebUI](https://github.com/open-webui/open-webui) — chat frontend
- [Ollama](https://ollama.com) — local inference runtime

---

## Notes for Claude Code

- When asked to add features, check the Roadmap first. If it's v0.3+ or not listed, ask before implementing.
- Default to the simplest viable solution. This is a learning project — clarity > cleverness.
- Before adding a dependency, justify it. The stack is already big enough.
- Keep the main loop (chat → optional capture → Ollama → stream back) as the center of gravity. Don't let side features bloat it.
- When in doubt about scope, ask the user rather than assume.