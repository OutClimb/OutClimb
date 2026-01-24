import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import type { EventSocialImageFormData, SocialImageFieldData } from '@/types/social-image'
import { format } from 'date-fns/format'
import { getTime } from 'date-fns/getTime'

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

export async function generateSocialImages(data: SocialImageFieldData) {
  const mainImageBlob = await generateMainImage(data)
  const eventImageBlobs = await Promise.all(data.events.map((event, index) => generateEventImage(index + 1, event)))
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

async function generateEventImage(imageNum: number, event: EventSocialImageFormData): Promise<ImageFile> {
  const canvas = document.createElement('canvas')
  canvas.width = 4500
  canvas.height = 5625

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { name: '', blob: new Blob() }
  }

  // Draw the background
  let backgroundImage
  switch (event.location) {
    case 'BIB':
      backgroundImage = await loadImage('/manage/images/bib-bg.png')
      break

    case 'MBP':
    case 'SPBP':
      backgroundImage = await loadImage('/manage/images/bp-bg.png')
      break

    case 'MNCC':
      backgroundImage = await loadImage('/manage/images/mncc-bg.png')
      break

    default:
      backgroundImage = await loadImage('/manage/images/ve-bg.png')
      break
  }
  ctx.drawImage(backgroundImage, 0, 0)

  // Set Header Text Color
  switch (event.location) {
    case 'BIB':
      ctx.fillStyle = '#5F9A5D'
      break

    case 'MBP':
    case 'SPBP':
      ctx.fillStyle = '#109AA9'
      break

    case 'MNCC':
      ctx.fillStyle = '#0076BA'
      break

    default:
      ctx.fillStyle = '#CC3427'
      break
  }

  // Set Header Font
  ctx.font = '700 327px Poppins'
  switch (event.location) {
    case 'BIB':
      fillMultiLineText(ctx, 'BIG ISLAND\nBOULDERING\nMEETUP', 395, 269, 547)
      break

    case 'MBP':
      fillMultiLineText(ctx, 'MINNEAPOLIS\nBOULDERING\nPROJECT MEETUP', 395, 269, 547)
      break

    case 'SPBP':
      fillMultiLineText(ctx, 'SAINT PAUL\nBOULDERING\nPROJECT MEETUP', 395, 269, 547)
      break

    case 'MNCC':
      fillMultiLineText(ctx, 'MN CLIMBING\nCOOPERATIVE\nMEETUP', 395, 269, 547)
      break

    case 'TCB':
      fillMultiLineText(ctx, 'TWIN CITIES\nBOULDERING\nMEETUP', 395, 269, 547)
      break

    case 'VEB':
      fillMultiLineText(ctx, 'VERTICAL ENDEAVORS\nBLOOMINGTON\nMEETUP', 395, 269, 547)
      break

    case 'VEM':
      fillMultiLineText(ctx, 'VERTICAL ENDEAVORS\nMINNEAPOLIS\nMEETUP', 395, 269, 547)
      break

    case 'VESP':
      fillMultiLineText(ctx, 'VERTICAL ENDEAVORS\nSAINT PAUL\nMEETUP', 395, 269, 547)
      break
  }

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
    name: `${imageNum} - ${event.location}.png`,
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
