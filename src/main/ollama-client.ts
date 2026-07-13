import type { OllamaMessage } from '../shared/types'

const SYSTEM_PROMPT =
  "You are ScreenMate, a local AI assistant. Be concise and helpful. When a screenshot is provided, analyze it and answer the user's question about what you see on screen."

export async function streamChat(
  messages: OllamaMessage[],
  model: string,
  ollamaUrl: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  signal: AbortSignal
): Promise<void> {
  const payload = {
    model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    stream: true
  }

  let res: Response
  try {
    res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    onError(`Cannot connect to Ollama at ${ollamaUrl}. Is Ollama running?`)
    return
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 404 || body.includes('model')) {
      onError(`Model "${model}" not found. Run: ollama pull ${model}`)
    } else {
      onError(`Ollama error ${res.status}: ${res.statusText}`)
    }
    return
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          if (data.message?.content) onChunk(data.message.content)
          if (data.done) {
            onDone()
            return
          }
        } catch {
          // skip incomplete JSON
        }
      }
    }
    onDone()
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    onError((err as Error).message)
  }
}
