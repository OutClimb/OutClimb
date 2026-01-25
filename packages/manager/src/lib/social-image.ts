import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import type { EventSocialImageFormData, SocialImageFieldData } from '@/types/social-image'
import { format } from 'date-fns/format'
import { getTime } from 'date-fns/getTime'
import type { Location } from '@/types/location'

interface ImageFile {
  name: string
  blob: Blob
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image()
    image.src = url
    image.onload = () => {
      resolve(image)
    }
  })
}

function fillMultiLineText(ctx: CanvasRenderingContext2D, text: string, lineHeight: number, x: number, y: number) {
  const lines = text.split('\n')
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + lineHeight * index)
  })
}

export async function generateSocialImages(data: SocialImageFieldData, locations: Array<Location>) {
  const mainImageBlob = await generateMainImage(data)
  const eventImageBlobs = await Promise.all(
    data.events.map((event, index) => generateEventImage(index + 1, event, locations)),
  )
  downloadBlob(await compressImages(mainImageBlob, ...eventImageBlobs))
}

async function generateMainImage(data: SocialImageFieldData): Promise<ImageFile> {
  const canvas = document.createElement('canvas')
  canvas.width = 4500
  canvas.height = 5625

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { name: '', blob: new Blob() }
  }

  // Draw the background
  const backgroundImage = await loadImage('/manage/images/main-image-bg.png')
  ctx.drawImage(backgroundImage, 0, 0)

  // Draw the month and year
  ctx.font = '700 147px Poppins'
  const date = format(new Date(data.year, data.month), 'MMMM yyyy')
  const dateMetrics = ctx.measureText(date)
  const backgroundWidth = dateMetrics.width + 172 * 2

  ctx.fillStyle = '#7374B7'
  ctx.beginPath()
  ctx.roundRect(4500 / 2 - backgroundWidth / 2, 331, backgroundWidth, 318, 159)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(date, 4500 / 2 - dateMetrics.width / 2, 547)

  // Draw the header
  ctx.font = '700 333px Poppins'
  ctx.fillStyle = '#7374B7'
  const header = 'CLIMBING EVENTS'
  const headerMetrics = ctx.measureText(header)
  ctx.fillText(header, 4500 / 2 - headerMetrics.width / 2, 1068)

  // Generate the data URL
  const dataUrl = canvas.toDataURL('image/png')
  return {
    name: '0 - Main Image.png',
    blob: await (await fetch(dataUrl)).blob(),
  }
}

async function generateEventImage(
  imageNum: number,
  event: EventSocialImageFormData,
  locations: Array<Location>,
): Promise<ImageFile> {
  const location = locations.find((loc) => loc.id === event.location)
  if (!location) {
    return { name: '', blob: new Blob() }
  }

  const canvas = document.createElement('canvas')
  canvas.width = 4500
  canvas.height = 5625

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { name: '', blob: new Blob() }
  }

  // Draw the background
  const backgroundImage = await loadImage(location.backgroundImagePath)
  ctx.drawImage(backgroundImage, 0, 0)

  // Set Header Text Color
  ctx.fillStyle = location.color

  // Set Header Font
  ctx.font = '700 327px Poppins'
  fillMultiLineText(ctx, location.individualImageName, 395, 269, 547)

  // Set Date/Time Font
  ctx.font = '700 146px Poppins'
  if (event.day) {
    ctx.fillText(format(event.day, 'EEEE, LLLL do'), 269, 1704)
  }
  ctx.fillText(`${event.startTime} - ${event.endTime}`, 269, 1879)

  // Set Body Text Color
  ctx.fillStyle = '#000000'

  // Set Address Font
  ctx.font = '500 106px Poppins'
  fillMultiLineText(ctx, event.address, 120, 269, 2223)

  // Set Description Font
  ctx.font = '400 106px Poppins'
  fillMultiLineText(ctx, event.description, 117, 269, 2710)

  // Generate the data URL
  const dataUrl = canvas.toDataURL('image/png')
  return {
    name: `${imageNum} - ${location.name}.png`,
    blob: await (await fetch(dataUrl)).blob(),
  }
}

async function compressImages(...files: Array<ImageFile>) {
  const zipFileWriter = new BlobWriter()
  const zipWriter = new ZipWriter(zipFileWriter)

  for (const file of files) {
    const blobReader = new BlobReader(file.blob)
    await zipWriter.add(file.name, blobReader)
  }

  await zipWriter.close()
  return zipFileWriter.getData()
}

function downloadBlob(blob: Blob) {
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(blob)
  anchor.download = `SocialImages-${getTime(new Date())}.zip`
  anchor.click()
}
