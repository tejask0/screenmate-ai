import React, { useState, useEffect, useCallback, useRef } from 'react'
import OverlayShell from './components/OverlayShell'
import ChatWindow from './components/ChatWindow'
import CompactPill from './components/CompactPill'
import SettingsPanel from './components/SettingsPanel'
import SnipOverlay from './components/SnipOverlay'
import { useChatStore } from './store/chatStore'
import { useSettingsStore } from './store/settingsStore'
import type { OllamaMessage } from '@shared/types'

interface ChatBounds {
  x: number
  y: number
  width: number
  height: number
}

export default function App(): React.JSX.Element {
  const [compact, setCompact] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [snipMode, setSnipMode] = useState<{ chatBounds: ChatBounds } | null>(null)
  const [snipImage, setSnipImage] = useState<string | null>(null)
  const [useFullScreenFallback, setUseFullScreenFallback] = useState(false)
  const settingsLoadedRef = useRef(false)
  const snipModeRef = useRef(false)

  const { settings, loaded: settingsLoaded, load: loadSettings } = useSettingsStore()
  const { isStreaming, addUserMessage, startAssistantMessage, appendChunk, finishAssistantMessage, setError } =
    useChatStore()

  useEffect(() => {
    loadSettings()
    const removeChunk = window.screenmate.onChatChunk(appendChunk)
    const removeDone = window.screenmate.onChatDone(finishAssistantMessage)
    const removeError = window.screenmate.onChatError(setError)
    return () => {
      removeChunk()
      removeDone()
      removeError()
    }
  }, [])

  const enterSnipMode = useCallback(async (): Promise<void> => {
    if (snipModeRef.current) return
    snipModeRef.current = true
    try {
      const { chatBounds } = await window.screenmate.enterSnip()
      setSnipMode({ chatBounds })
    } catch {
      snipModeRef.current = false
    }
  }, [])

  const exitSnipMode = useCallback(async (): Promise<void> => {
    if (!snipModeRef.current) return
    snipModeRef.current = false
    setSnipMode(null)
    await window.screenmate.exitSnip()
  }, [])

  // Enter snip mode once settings have loaded, if the screen toggle is on.
  useEffect(() => {
    if (!settingsLoaded || settingsLoadedRef.current) return
    settingsLoadedRef.current = true
    if (settings.includeScreen && !compact && !showSettings) {
      void enterSnipMode()
    }
  }, [settingsLoaded, settings.includeScreen, compact, showSettings, enterSnipMode])

  const handleCompact = (): void => {
    void exitSnipMode()
    setCompact(true)
    window.screenmate.windowAction('compact')
  }

  const handleRestore = (): void => {
    setCompact(false)
    window.screenmate.windowAction('restore-compact')
    if (settings.includeScreen) void enterSnipMode()
  }

  const handleSnipComplete = useCallback(
    async (croppedBase64: string): Promise<void> => {
      setSnipImage(croppedBase64)
      setUseFullScreenFallback(false)
      await exitSnipMode()
    },
    [exitSnipMode]
  )

  const handleSnipCancel = useCallback(async (): Promise<void> => {
    setSnipImage(null)
    setUseFullScreenFallback(true)
    await exitSnipMode()
  }, [exitSnipMode])

  const handleIncludeScreenChange = useCallback(
    (next: boolean): void => {
      void useSettingsStore.getState().update({ includeScreen: next })
      if (next) {
        void enterSnipMode()
      } else {
        setSnipImage(null)
        setUseFullScreenFallback(false)
        void exitSnipMode()
      }
    },
    [enterSnipMode, exitSnipMode]
  )

  const sendMessage = useCallback(
    async (text: string, includeScreen: boolean): Promise<void> => {
      // If snip overlay is still active, treat send as a cancel + full-screen.
      if (snipModeRef.current) {
        await exitSnipMode()
      }

      const currentMessages = useChatStore.getState().messages

      let imageData: string | undefined
      if (snipImage) {
        imageData = snipImage
      } else if (includeScreen || useFullScreenFallback) {
        const result = await window.screenmate.captureScreen()
        if (!result.success || !result.data) {
          setError(
            result.error ??
              'Screen capture failed — please grant Screen Recording permission in System Settings › Privacy & Security'
          )
          return
        }
        imageData = result.data
      }

      setSnipImage(null)
      setUseFullScreenFallback(false)

      addUserMessage(text, !!imageData)
      startAssistantMessage()

      const ollamaMessages: OllamaMessage[] = currentMessages.map((m) => ({
        role: m.role,
        content: m.content
      }))
      ollamaMessages.push({
        role: 'user',
        content: text,
        ...(imageData ? { images: [imageData] } : {})
      })

      window.screenmate.startChat({
        messages: ollamaMessages,
        model: settings.model,
        ollamaUrl: settings.ollamaUrl
      })

      if (includeScreen) {
        void enterSnipMode()
      }
    },
    [
      settings,
      snipImage,
      useFullScreenFallback,
      addUserMessage,
      startAssistantMessage,
      setError,
      exitSnipMode,
      enterSnipMode
    ]
  )

  if (compact) {
    return <CompactPill isStreaming={isStreaming} onRestore={handleRestore} />
  }

  // During snip mode, render the chat box at its original bounds inside the
  // now-fullscreen transparent window, with the crosshair overlay tiling the
  // rest of the screen. Clicking anywhere on the chat cancels snip.
  if (snipMode) {
    const { chatBounds } = snipMode
    return (
      <>
        <SnipOverlay
          chatBounds={chatBounds}
          onComplete={handleSnipComplete}
          onCancel={handleSnipCancel}
        />
        <div
          style={{
            position: 'fixed',
            left: chatBounds.x,
            top: chatBounds.y,
            width: chatBounds.width,
            height: chatBounds.height,
            zIndex: 50
          }}
          onMouseDownCapture={() => {
            void handleSnipCancel()
          }}
        >
          <OverlayShell
            onCompact={handleCompact}
            onSettings={() => setShowSettings((v) => !v)}
            showingSettings={showSettings}
          >
            {showSettings ? (
              <SettingsPanel />
            ) : (
              <ChatWindow
                onSend={sendMessage}
                defaultIncludeScreen={settings.includeScreen}
                snipImage={snipImage}
                onClearSnip={() => setSnipImage(null)}
                onIncludeScreenChange={handleIncludeScreenChange}
              />
            )}
          </OverlayShell>
        </div>
      </>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <OverlayShell
        onCompact={handleCompact}
        onSettings={() => setShowSettings((v) => !v)}
        showingSettings={showSettings}
      >
        {showSettings ? (
          <SettingsPanel />
        ) : (
          <ChatWindow
            onSend={sendMessage}
            defaultIncludeScreen={settings.includeScreen}
            snipImage={snipImage}
            onClearSnip={() => setSnipImage(null)}
            onIncludeScreenChange={handleIncludeScreenChange}
          />
        )}
      </OverlayShell>
    </div>
  )
}
