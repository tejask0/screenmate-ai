import React, { useState, useEffect, useCallback } from 'react'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface ChatBounds {
  x: number
  y: number
  width: number
  height: number
}

interface Props {
  chatBounds: ChatBounds
  onComplete: (croppedBase64: string) => void
  onCancel: () => void
}

export default function SnipOverlay({ chatBounds, onComplete, onCancel }: Props): React.JSX.Element {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const getSelectionRect = (): Rect | null => {
    if (!start || !current) return null
    return {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      w: Math.abs(current.x - start.x),
      h: Math.abs(current.y - start.y)
    }
  }

  const captureCrop = useCallback(
    async (rect: Rect): Promise<void> => {
      setBusy(true)
      const result = await window.screenmate.captureAndCrop({
        x: rect.x,
        y: rect.y,
        width: rect.w,
        height: rect.h
      })
      setBusy(false)
      if (result.success && result.data) {
        onComplete(result.data)
      } else {
        onCancel()
      }
    },
    [onComplete, onCancel]
  )

  const onMouseDown = (e: React.MouseEvent): void => {
    if (busy) return
    e.preventDefault()
    setStart({ x: e.clientX, y: e.clientY })
    setCurrent({ x: e.clientX, y: e.clientY })
    setDragging(true)
  }

  // Window-level move/up so the drag isn't lost when the cursor crosses
  // the chat rect or the (pointer-events:none) selection box.
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent): void => {
      setCurrent({ x: e.clientX, y: e.clientY })
    }
    const onUp = (e: MouseEvent): void => {
      setDragging(false)
      const endX = e.clientX
      const endY = e.clientY
      setStart((s) => {
        if (!s) return null
        const rect = {
          x: Math.min(s.x, endX),
          y: Math.min(s.y, endY),
          w: Math.abs(endX - s.x),
          h: Math.abs(endY - s.y)
        }
        if (rect.w > 8 && rect.h > 8) {
          void captureCrop(rect)
        }
        return null
      })
      setCurrent(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, captureCrop])

  const sel = getSelectionRect()

  // Four transparent, crosshair-cursor panels that tile the screen *around*
  // the chat passthrough. The chat rect gets no panel — events there land on
  // the chat UI which triggers cancel via App's wrapper handler.
  const panels = [
    // top
    { left: 0, top: 0, width: '100vw', height: chatBounds.y },
    // bottom
    {
      left: 0,
      top: chatBounds.y + chatBounds.height,
      width: '100vw',
      height: `calc(100vh - ${chatBounds.y + chatBounds.height}px)`
    },
    // left
    { left: 0, top: chatBounds.y, width: chatBounds.x, height: chatBounds.height },
    // right
    {
      left: chatBounds.x + chatBounds.width,
      top: chatBounds.y,
      width: `calc(100vw - ${chatBounds.x + chatBounds.width}px)`,
      height: chatBounds.height
    }
  ]

  return (
    <>
      {panels.map((p, i) => (
        <div
          key={i}
          className="app-no-drag fixed select-none"
          style={{
            ...p,
            cursor: 'crosshair',
            background: 'transparent',
            zIndex: 40
          }}
          onMouseDown={onMouseDown}
        />
      ))}

      {/* Selection rectangle — only the thin border, no fill */}
      {sel && sel.w > 0 && sel.h > 0 && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: sel.x,
            top: sel.y,
            width: sel.w,
            height: sel.h,
            border: '1.5px solid rgb(96, 165, 250)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
            zIndex: 41
          }}
        >
          <div
            className="absolute text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{
              left: sel.w + 4,
              top: 0,
              background: 'rgba(0,0,0,0.7)',
              color: 'white'
            }}
          >
            {Math.round(sel.w)} × {Math.round(sel.h)}
          </div>
        </div>
      )}
    </>
  )
}
