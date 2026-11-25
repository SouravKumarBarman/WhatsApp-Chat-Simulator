import waDefaultWallpaper from './assets/wa-default-wallpaper.jpg'
import type { ThemeMode, WallpaperId } from './types'

export { waDefaultWallpaper }

const tintedCache = new Map<string, string>()

interface Palette {
  bg: [number, number, number]
  fg: [number, number, number]
  strength: number
}

function getPalette(wallpaper: WallpaperId, theme: ThemeMode): Palette | null {
  const isDark = theme === 'dark'
  if (wallpaper === 'doodle-classic') {
    if (!isDark) return null // Use original JPG directly
    return { bg: [11, 20, 26], fg: [37, 53, 62], strength: 1.0 }
  }
  if (wallpaper === 'doodle-mint') {
    return isDark
      ? { bg: [9, 24, 21], fg: [30, 68, 59], strength: 1.0 }
      : { bg: [223, 242, 234], fg: [148, 194, 176], strength: 1.0 }
  }
  if (wallpaper === 'doodle-lavender') {
    return isDark
      ? { bg: [20, 17, 34], fg: [52, 42, 82], strength: 1.0 }
      : { bg: [236, 231, 246], fg: [176, 162, 208], strength: 1.0 }
  }
  return null
}

export function getCachedTintedWallpaper(wallpaper: WallpaperId, theme: ThemeMode): string | null {
  if (wallpaper === 'doodle-classic' && theme === 'light') {
    return waDefaultWallpaper
  }
  return tintedCache.get(`${wallpaper}:${theme}`) ?? null
}

export function generateTintedWallpaper(
  wallpaper: WallpaperId,
  theme: ThemeMode
): Promise<string | null> {
  if (wallpaper === 'doodle-classic' && theme === 'light') {
    return Promise.resolve(waDefaultWallpaper)
  }
  const key = `${wallpaper}:${theme}`
  const existing = tintedCache.get(key)
  if (existing) return Promise.resolve(existing)

  const palette = getPalette(wallpaper, theme)
  if (!palette) return Promise.resolve(null)

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || 402
        canvas.height = img.naturalHeight || 874
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imageData.data
        const [br, bg, bb] = palette.bg
        const [fr, fg, fb] = palette.fg

        for (let i = 0; i < d.length; i += 4) {
          const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
          // Original wallpaper has ~229 background and ~204-216 doodle lines
          const t = Math.min(1, Math.max(0, ((229 - lum) / 26) * palette.strength))
          d[i] = Math.round(br + (fr - br) * t)
          d[i + 1] = Math.round(bg + (fg - bg) * t)
          d[i + 2] = Math.round(bb + (fb - bb) * t)
          d[i + 3] = 255
        }
        ctx.putImageData(imageData, 0, 0)
        const outUrl = canvas.toDataURL('image/png')
        tintedCache.set(key, outUrl)
        resolve(outUrl)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = waDefaultWallpaper
  })
}
