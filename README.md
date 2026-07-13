# ScreenMate

A local desktop AI assistant that can see your screen. It runs a floating, always-on-top chat overlay, captures a region or your full screen on demand, and answers questions about what you're looking at. Every model runs on your own machine through [Ollama](https://ollama.com), so screenshots never leave your device.

![License: MIT](https://img.shields.io/badge/license-MIT-blue) ![Electron](https://img.shields.io/badge/Electron-31-47848F) ![React](https://img.shields.io/badge/React-18-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

> Status: v0.1 (MVP). This is a build-in-public learning project. Expect rough edges.

## Why

Cloud screen assistants send everything you look at to someone else's server. ScreenMate keeps the loop entirely on your machine: you capture a screenshot, a local vision model reads it, and the answer streams back into the overlay. No account, no telemetry, no upload.

## Features

- **Snip or full-screen capture.** Drag to select a region (the default) or grab the whole display.
- **Always-on-top overlay.** A frameless, draggable window that floats over your other apps at an opacity you set.
- **Streaming replies.** Tokens render as the model generates them, with a thinking indicator while it works.
- **Compact pill mode.** Shrink the window to a small pill when you're not using it, click to restore.
- **Global hotkey.** `⌘⇧Space` (macOS) or `Ctrl+Shift+Space` shows and hides the overlay.
- **Local only.** Screenshots go to your Ollama instance and nowhere else. The overlay excludes its own window from captures.
- **Configurable model.** Point it at any vision-capable Ollama model from the settings panel.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer
- [Ollama](https://ollama.com) running locally
- A vision-capable model pulled into Ollama. The default is `gemma4:e4b`:

  ```bash
  ollama pull gemma4:e4b
  ```

  Any vision model works. `gemma3:4b` and `llama3.2` are reasonable alternatives you can set in the app.

macOS users: grant Screen Recording permission the first time you capture (System Settings → Privacy & Security → Screen Recording), otherwise captures come back blank.

## Run from source

```bash
git clone https://github.com/tejask0/screenmate-ai.git
cd screenmate-ai
npm install
npm run dev
```

Make sure Ollama is already running (`ollama serve`) and your model is pulled before you send a message with screen capture on.

## Build

```bash
npm run build        # package for your current platform via electron-builder
npm run build:unpack # unpacked build for local testing
```

## Configuration

Open the settings panel (⚙ in the overlay) to change:

| Setting | Default | Notes |
|---|---|---|
| Model | `gemma4:e4b` | Any Ollama model tag |
| Ollama URL | `http://localhost:11434` | Point at a remote Ollama if you run one |
| Opacity | ~90% | Overlay transparency, 40–100% |
| Include screen by default | on | Whether a new message captures the screen |

Settings and window position persist to your OS app-data directory (`~/Library/Application Support/screenmateai/` on macOS).

## How it works

```
Electron main (Node)                 Renderer (React + TS)              Ollama
─────────────────────                ─────────────────────              ──────
window + hotkeys           <── IPC ──>  chat UI + settings
desktopCapturer  ──── PNG ──┐
ollama HTTP client  ────────┴── prompt + image ──────────────────────>  vision model
        ▲                                                                    │
        └──────────────── streamed tokens ◄─────── IPC ◄────────────────────┘
```

The renderer never touches Node APIs directly. Everything crosses the main/renderer boundary through a `contextBridge` preload, and the main process validates every IPC message. See [`CLAUDE.md`](./CLAUDE.md) and [`Plan.md`](./Plan.md) for the full architecture and design notes.

## Roadmap

- **v0.1 (now):** overlay, hotkey, snip + full capture, streaming chat, settings, compact mode
- **v0.2:** voice input and output (whisper.cpp / Piper or native model audio)
- **v0.3+:** desktop control, multi-monitor selection, conversation history, optional cloud models

Full roadmap and non-goals live in [`Plan.md`](./Plan.md).

## Contributing

Issues and PRs are welcome. Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) first. This is a solo learning project, so the author sets direction, but bug reports and small fixes help a lot.

## License

[MIT](./LICENSE) © Tejas Kalpande
