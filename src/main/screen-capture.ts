import { desktopCapturer, BrowserWindow, screen } from 'electron'

export async function captureScreen(mainWindow: BrowserWindow): Promise<string> {
  // setContentProtection tells macOS to exclude this window from screen capture
  // (NSWindowSharingNone) while keeping it fully visible to the user — no flash.
  mainWindow.setContentProtection(true)
  await new Promise((resolve) => setTimeout(resolve, 50))

  try {
    const display = screen.getPrimaryDisplay()
    const { width, height } = display.size

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    })

    if (sources.length === 0) throw new Error('No screen sources found')

    const thumbnail = sources[0].thumbnail
    if (thumbnail.isEmpty()) {
      throw new Error(
        'Screen capture returned an empty image — please grant Screen Recording permission in System Settings › Privacy & Security'
      )
    }

    const dataUrl = thumbnail.toDataURL()
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    if (!base64) {
      throw new Error(
        'Screen capture returned an empty image — please grant Screen Recording permission in System Settings › Privacy & Security'
      )
    }
    return base64
  } finally {
    mainWindow.setContentProtection(false)
  }
}
