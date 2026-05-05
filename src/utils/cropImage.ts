export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * This function was adapted from the one in the react-easy-crop project.
 * Optimized to reduce image size and quality for API efficiency.
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  maxSize = 1280,
  quality = 0.7
): Promise<{ blob: Blob; url: string; base64: string }> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // translate canvas context to a central point to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw rotated image
  ctx.drawImage(image, 0, 0)

  // Create a second canvas to perform the crop and potential resize
  const resultCanvas = document.createElement('canvas')
  const resultCtx = resultCanvas.getContext('2d')

  if (!resultCtx) {
    throw new Error('No 2d context for result')
  }

  // Calculate final dimensions with resizing if needed
  let targetWidth = pixelCrop.width
  let targetHeight = pixelCrop.height

  if (targetWidth > maxSize || targetHeight > maxSize) {
    const scale = maxSize / Math.max(targetWidth, targetHeight)
    targetWidth = Math.round(targetWidth * scale)
    targetHeight = Math.round(targetHeight * scale)
  }

  // Set the final desired size
  resultCanvas.width = targetWidth
  resultCanvas.height = targetHeight

  // Draw the cropped (and potentially scaled) portion from the main canvas
  resultCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  )

  // As a blob with specified quality
  return new Promise((resolve, reject) => {
    resultCanvas.toBlob(
      (file) => {
        if (file) {
          const url = URL.createObjectURL(file)
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1]
            resolve({ blob: file, url, base64 })
          }
          reader.readAsDataURL(file)
        } else {
          reject(new Error('Canvas is empty'))
        }
      },
      'image/jpeg',
      quality
    )
  })
}
