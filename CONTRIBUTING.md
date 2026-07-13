# Contributing to ScreenMate

Thanks for taking a look. ScreenMate is a solo build-in-public project, so the author sets the roadmap, but bug reports, small fixes, and sharp questions are all welcome.

## Before you start

- Check [`Plan.md`](./Plan.md) for scope. Features tagged v0.3+ or not listed are deferred, so open an issue to discuss before building them.
- For anything larger than a small fix, open an issue first so we agree on the approach before you write code.

## Development

```bash
npm install
npm run dev        # hot-reload dev build
npm run typecheck  # type check, no emit
npm run build      # production build
```

You need [Ollama](https://ollama.com) running locally with a vision-capable model pulled (`ollama pull gemma4:e4b`) to test the capture flow.

## Ground rules

- TypeScript strict mode. Avoid `any`; if you must use it, comment why.
- Functional React components with hooks. No class components.
- Keep the main/renderer boundary clean: main-process APIs cross through the `contextBridge` preload, never `nodeIntegration`. Validate IPC input in the main process.
- Capture the screen only when the user sends a message with screen capture on, or triggers a capture directly. Never on keystrokes.
- Match the style of the surrounding code. Small, focused files.

## Pull requests

1. Branch off `main`.
2. Run `npm run typecheck` and confirm the app builds.
3. Describe what changed and how you tested it.
4. Link the issue it addresses.

By contributing, you agree your work is licensed under the [MIT License](./LICENSE).
