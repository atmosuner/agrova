/* eslint-disable lingui/no-unlocalized-strings -- engineer-facing error strings */
/** Browser-side JPEG downscale: long edge at most `maxLongEdge` px. */

export function scaledDimensions(
  width: number,
  height: number,
  maxLongEdge: number,
): { width: number; height: number } {
  const long = Math.max(width, height)
  if (long <= maxLongEdge) {
    return { width, height }
  }
  const scale = maxLongEdge / long
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export async function compressImageToJpeg(file: Blob, maxLongEdge = 1600, quality = 0.88): Promise<Blob> {
  if (typeof document === 'undefined') {
    throw new Error('compressImageToJpeg requires a browser environment')
  }
  const bitmap = await createImageBitmap(file)
  try {
    const { width: tw, height: th } = scaledDimensions(bitmap.width, bitmap.height, maxLongEdge)
    const canvas = document.createElement('canvas')
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('2d context unavailable')
    }
    ctx.drawImage(bitmap, 0, 0, tw, th)
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
    )
    if (!blob) {
      throw new Error('jpeg encoding failed')
    }
    return blob
  } finally {
    bitmap.close()
  }
}
