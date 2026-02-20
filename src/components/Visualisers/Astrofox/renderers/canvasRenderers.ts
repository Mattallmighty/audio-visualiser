import type {
  BarSpectrumLayer,
  WaveSpectrumLayer,
  SoundWaveLayer,
  SoundWave2Layer,
  TextLayer,
  ImageLayer,
} from '../../../../engines/astrofox/types'
import { getCompositeOperation } from '../../../../engines/astrofox/types'

export type AudioDataArray = number[] | Float32Array

export type ParseAudioDataFn = (
  data: AudioDataArray | Uint8Array,
  layerId: string,
  minFrequency: number,
  maxFrequency: number,
  maxDecibels: number,
  smoothing: number,
  targetBins?: number
) => Float32Array

export function renderBarSpectrum(
  ctx: CanvasRenderingContext2D,
  layer: BarSpectrumLayer,
  data: AudioDataArray,
  centerX: number,
  centerY: number,
  parseAudioData: ParseAudioDataFn
): void {
  // Calculate number of bars to display
  const numBars = Math.max(1, Math.floor(layer.width / (layer.barWidth + layer.barSpacing)))

  // Use FFTParser for per-layer frequency filtering and dB normalization
  // This applies minFrequency, maxFrequency, maxDecibels, and smoothing per-layer
  const parsedData = parseAudioData(
    data,
    layer.id,
    layer.minFrequency,
    layer.maxFrequency,
    layer.maxDecibels,
    layer.smoothing,
    numBars // Target number of output bins
  )

  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  const startX = -layer.width / 2

  // Create single gradient for all bars (optimization)
  const gradient = ctx.createLinearGradient(0, 0, 0, -layer.height)
  gradient.addColorStop(0, layer.barColor)
  gradient.addColorStop(1, layer.barColorEnd)
  ctx.fillStyle = gradient

  for (let i = 0; i < numBars; i++) {
    const amplitude = parsedData[i] || 0
    const barHeight = amplitude * layer.height

    const x = startX + i * (layer.barWidth + layer.barSpacing)
    ctx.fillRect(x, 0, layer.barWidth, -barHeight)

    if (layer.mirror) {
      ctx.fillRect(x, 0, layer.barWidth, barHeight)
    }
  }

  // Draw shadow separately if needed
  if (layer.shadowHeight > 0) {
    ctx.fillStyle = layer.shadowColor
    ctx.globalAlpha = layer.opacity * 0.3
    for (let i = 0; i < numBars; i++) {
      const amplitude = parsedData[i] || 0
      const barHeight = amplitude * layer.height
      const x = startX + i * (layer.barWidth + layer.barSpacing)
      ctx.fillRect(x, 0, layer.barWidth, Math.min(barHeight * 0.5, layer.shadowHeight))
    }
  }

  ctx.restore()
}

export function renderWaveSpectrum(
  ctx: CanvasRenderingContext2D,
  layer: WaveSpectrumLayer,
  data: AudioDataArray,
  centerX: number,
  centerY: number,
  parseAudioData: ParseAudioDataFn
): void {
  // Use FFTParser for per-layer frequency filtering
  const numPoints = Math.max(2, Math.floor(layer.width / 4)) // ~4px per point for smooth curve
  const parsedData = parseAudioData(
    data,
    layer.id,
    layer.minFrequency,
    layer.maxFrequency,
    -12, // Default maxDecibels for wave spectrum
    layer.smoothing,
    numPoints
  )

  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  const startX = -layer.width / 2
  const pointSpacing = layer.width / (parsedData.length - 1)

  ctx.beginPath()
  ctx.moveTo(startX, 0)

  for (let i = 0; i < parsedData.length; i++) {
    const x = startX + i * pointSpacing
    const y = -parsedData[i] * layer.height
    if (i === 0) {
      ctx.lineTo(x, y)
    } else {
      const prevX = startX + (i - 1) * pointSpacing
      const prevY = -(parsedData[i - 1] || 0) * layer.height
      const cpX = (prevX + x) / 2
      ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2)
    }
  }

  if (layer.fill) {
    ctx.lineTo(startX + layer.width, 0)
    ctx.closePath()
    ctx.fillStyle = layer.fillColor
    ctx.fill()
  }

  ctx.strokeStyle = layer.lineColor
  ctx.lineWidth = layer.lineWidth
  ctx.stroke()

  ctx.restore()
}

// Horizontal SoundWave like Astrofox
export function renderSoundWave(
  ctx: CanvasRenderingContext2D,
  layer: SoundWaveLayer,
  data: AudioDataArray,
  centerX: number,
  centerY: number
): void {
  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  const startX = -layer.width / 2
  const step = Math.max(1, Math.floor(data.length * layer.wavelength * 0.25))
  const sampledData: number[] = []
  for (let i = 0; i < data.length; i += step) {
    sampledData.push(data[i])
  }

  // Apply smoothing
  const smoothedData = sampledData.map((val, i) => {
    if (i === 0 || i === sampledData.length - 1) return val
    const prev = sampledData[i - 1]
    const next = sampledData[i + 1]
    return prev * layer.smooth * 0.25 + val * (1 - layer.smooth * 0.5) + next * layer.smooth * 0.25
  })

  const pointSpacing = layer.width / (smoothedData.length - 1 || 1)

  ctx.beginPath()

  for (let i = 0; i < smoothedData.length; i++) {
    const x = startX + i * pointSpacing
    const amplitude = (smoothedData[i] - 0.5) * 2 // Center around 0
    const y = amplitude * layer.height * 0.5

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  if (layer.useFill) {
    ctx.lineTo(startX + layer.width, 0)
    ctx.lineTo(startX, 0)
    ctx.closePath()
    ctx.fillStyle = layer.fillColor
    ctx.fill()
  }

  ctx.strokeStyle = layer.color
  ctx.lineWidth = layer.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  ctx.restore()
}

// Circle/line mode waveform
export function renderSoundWave2(
  ctx: CanvasRenderingContext2D,
  layer: SoundWave2Layer,
  data: AudioDataArray,
  centerX: number,
  centerY: number
): void {
  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  if (layer.mode === 'circle') {
    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const angle = (i / data.length) * Math.PI * 2
      const r = layer.radius + data[i] * layer.radius * layer.sensitivity
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
  } else {
    ctx.beginPath()
    const lineWidth = layer.radius * 2
    const startX = -lineWidth / 2
    const pointSpacing = lineWidth / (data.length - 1)

    for (let i = 0; i < data.length; i++) {
      const x = startX + i * pointSpacing
      const y = -data[i] * layer.radius * layer.sensitivity
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
  }

  ctx.strokeStyle = layer.lineColor
  ctx.lineWidth = layer.lineWidth
  ctx.stroke()

  ctx.restore()
}

export function renderText(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  data: AudioDataArray,
  centerX: number,
  centerY: number
): void {
  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i]
  const avgAmplitude = data.length > 0 ? sum / data.length : 0
  const reactiveScale = layer.audioReactive ? 1 + avgAmplitude * layer.reactiveScale : 1

  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale * reactiveScale, layer.scale * reactiveScale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  const fontStyle = layer.italic ? 'italic ' : ''
  const fontWeight = layer.bold ? 'bold ' : ''
  ctx.font = `${fontStyle}${fontWeight}${layer.fontSize}px "${layer.font}"`
  ctx.fillStyle = layer.color
  ctx.textAlign = layer.textAlign
  ctx.textBaseline = 'middle'

  ctx.fillText(layer.text, 0, 0)

  ctx.restore()
}

export function renderImage(
  ctx: CanvasRenderingContext2D,
  layer: ImageLayer,
  data: AudioDataArray,
  centerX: number,
  centerY: number,
  imageCache: Map<string, HTMLImageElement>
): void {
  const source = layer.imageData || layer.imageUrl
  if (!source) return

  let img = imageCache.get(source)
  if (!img) {
    img = new Image()
    img.src = source
    // Handle cross-origin images for canvas
    if (source.startsWith('http')) {
      img.crossOrigin = 'Anonymous'
    }
    imageCache.set(source, img)
    return // Wait for load
  }

  if (!img.complete) return

  // Convert percentage to pixels based on canvas size
  const canvasWidth = ctx.canvas.width
  const canvasHeight = ctx.canvas.height
  const drawWidth = (layer.width / 100) * canvasWidth
  let drawHeight = (layer.height / 100) * canvasHeight

  // Maintain aspect ratio if enabled
  // Use actual image dimensions directly from the loaded image
  if (layer.maintainAspectRatio && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const aspectRatio = img.naturalWidth / img.naturalHeight
    // Use width as the primary dimension and calculate height to maintain aspect
    drawHeight = drawWidth / aspectRatio
  }

  // Calculate audio reactive scale
  let audioScale = 1
  if (layer.audioReactive && data && data.length > 0) {
    // Use average of audio data for reactive scaling
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i])
    }
    const avg = sum / data.length
    audioScale = 1 + avg * layer.reactiveScale
  }

  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale * audioScale, layer.scale * audioScale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

  ctx.restore()
}
