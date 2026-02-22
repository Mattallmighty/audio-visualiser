import type {
  BarSpectrumLayer,
  WaveSpectrumLayer,
  SoundWaveLayer,
  SoundWave2Layer,
  TextLayer,
  ImageLayer,
  StarFieldLayer,
  ParticleFieldLayer,
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

  ctx.strokeStyle = layer.lineColor
  ctx.lineWidth = layer.lineWidth
  ctx.lineCap = 'round'

  if (layer.mode === 'circle' && layer.barMode !== false) {
    // Vizzy-style: mirrored outward bars radiating from a circle
    const radius = layer.radius
    const barsPerHalf = Math.min(128, Math.floor(data.length / 2))

    // Draw base circle if enabled
    if (layer.strokeBase !== false) {
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    const mirror = layer.mirror !== false
    const inward = layer.inward === true

    for (let i = 0; i < barsPerHalf; i++) {
      // Map i to angle: bottom (π/2) → top (−π/2) on the right side
      const t = i / barsPerHalf
      const angle = Math.PI / 2 - t * Math.PI

      // Sample frequency data: map i across the data length
      const dataIndex = Math.floor((i * data.length) / barsPerHalf)
      const amplitude = (data[dataIndex] || 0) as number
      const barLen = amplitude * radius * layer.sensitivity

      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)

      // Right side bar (outward)
      ctx.beginPath()
      ctx.moveTo(cosA * radius, sinA * radius)
      ctx.lineTo(cosA * (radius + barLen), sinA * (radius + barLen))
      ctx.stroke()

      if (inward) {
        ctx.beginPath()
        ctx.moveTo(cosA * radius, sinA * radius)
        ctx.lineTo(cosA * (radius - barLen * 0.4), sinA * (radius - barLen * 0.4))
        ctx.stroke()
      }

      if (mirror) {
        // Left side bar (mirror x-axis)
        ctx.beginPath()
        ctx.moveTo(-cosA * radius, sinA * radius)
        ctx.lineTo(-cosA * (radius + barLen), sinA * (radius + barLen))
        ctx.stroke()

        if (inward) {
          ctx.beginPath()
          ctx.moveTo(-cosA * radius, sinA * radius)
          ctx.lineTo(-cosA * (radius - barLen * 0.4), sinA * (radius - barLen * 0.4))
          ctx.stroke()
        }
      }
    }
  } else if (layer.mode === 'circle') {
    // Original polygon path mode
    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const angle = (i / data.length) * Math.PI * 2
      const r = layer.radius + (data[i] as number) * layer.radius * layer.sensitivity
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.stroke()
  } else {
    // Line mode
    ctx.beginPath()
    const lineWidth = layer.radius * 2
    const startX = -lineWidth / 2
    const pointSpacing = lineWidth / (data.length - 1)

    for (let i = 0; i < data.length; i++) {
      const x = startX + i * pointSpacing
      const y = -(data[i] as number) * layer.radius * layer.sensitivity
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }

  ctx.restore()
}

// Simple deterministic hash returning 0–1 from an integer seed
function simpleHash(n: number): number {
  let h = n
  h = ((h >> 16) ^ h) * 0x45d9f3b
  h = ((h >> 16) ^ h) * 0x45d9f3b
  h = (h >> 16) ^ h
  return (h & 0x7fffffff) / 0x7fffffff
}

export function renderStarField(
  ctx: CanvasRenderingContext2D,
  layer: StarFieldLayer,
  data: AudioDataArray,
  _centerX: number,
  _centerY: number,
  time: number
): void {
  const canvasWidth = ctx.canvas.width
  const canvasHeight = ctx.canvas.height

  // Compute average audio level for reactivity
  let audioAvg = 0
  if (layer.audioReactive && data.length > 0) {
    let sum = 0
    for (let i = 0; i < data.length; i++) sum += (data[i] as number)
    audioAvg = sum / data.length
  }

  ctx.save()
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  for (let i = 0; i < layer.starCount; i++) {
    // Deterministic position from star index
    const px = simpleHash(i * 3 + 0) * canvasWidth
    const py = simpleHash(i * 3 + 1) * canvasHeight
    const baseSizeFactor = simpleHash(i * 3 + 2)
    const baseSize = baseSizeFactor * layer.maxSize + 0.3

    // Twinkle: sinusoidal variation offset by star index
    let twinkleVal = 1
    if (layer.twinkle) {
      const phase = simpleHash(i * 7 + 3) * Math.PI * 2
      twinkleVal = 0.5 + 0.5 * Math.sin(time * (1.5 + baseSizeFactor) + phase)
    }

    // Audio boost
    const audioBoost = layer.audioReactive ? audioAvg * layer.pulseIntensity : 0

    const opacity = Math.min(1, twinkleVal * 0.8 + audioBoost) * layer.opacity
    const size = baseSize * (1 + audioBoost * 0.5)

    ctx.globalAlpha = opacity
    ctx.fillStyle = layer.starColor
    ctx.beginPath()
    ctx.arc(px, py, size, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

// ---------------------------------------------------------------------------
// Particle Field – pure 2D canvas renderer (no Three.js, no black tint)
// Uses additive blending ('lighter') which physically cannot darken the bg.
// ---------------------------------------------------------------------------

export interface ParticleFieldState {
  positions: Float32Array  // interleaved [x0, y0, x1, y1, …]
  angles: Float32Array     // radial angle per particle
  radii: Float32Array      // outward distance (centreOut) or orbit radius (rotateBeat)
  speeds: Float32Array     // per-particle speed multiplier (0.4–1.3)
  count: number
  direction: string
  peakAudio: number        // peak-hold value for smooth flash+decay effect
}

export function renderParticleField2D(
  ctx: CanvasRenderingContext2D,
  layer: ParticleFieldLayer,
  audioValue: number,              // 0–1, pre-computed from frequency bands
  stateCache: Map<string, ParticleFieldState>
): void {
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  const cx = W / 2
  const cy = H / 2
  const count = Math.min(layer.particleCount, 10000)
  const direction = layer.direction ?? 'centreOut'

  // (Re-)initialise state when count or direction changes
  let st = stateCache.get(layer.id)
  if (!st || st.count !== count || st.direction !== direction) {
    const diag = Math.sqrt(W * W + H * H) / 2
    st = {
      positions: new Float32Array(count * 2),
      angles: new Float32Array(count),
      radii: new Float32Array(count),
      speeds: new Float32Array(count),
      count,
      direction,
      peakAudio: 0,
    }
    for (let i = 0; i < count; i++) {
      st.angles[i] = Math.random() * Math.PI * 2
      st.speeds[i] = 0.4 + Math.random() * 0.9
      if (direction === 'centreOut') {
        st.radii[i] = Math.random() * diag
        st.positions[i * 2]     = cx + Math.cos(st.angles[i]) * st.radii[i]
        st.positions[i * 2 + 1] = cy + Math.sin(st.angles[i]) * st.radii[i]
      } else if (direction === 'rotateBeat') {
        st.radii[i] = (0.15 + Math.random() * 0.85) * diag
        st.positions[i * 2]     = cx + Math.cos(st.angles[i]) * st.radii[i]
        st.positions[i * 2 + 1] = cy + Math.sin(st.angles[i]) * st.radii[i]
      } else {
        // leftToRight – fill canvas randomly
        st.radii[i] = 0
        st.positions[i * 2]     = Math.random() * W
        st.positions[i * 2 + 1] = Math.random() * H
      }
    }
    stateCache.set(layer.id, st)
  }

  // Geometry derived from depth setting (controls how far beyond screen edge)
  const diag = Math.sqrt((W / 2) * (W / 2) + (H / 2) * (H / 2))
  const maxRadius = diag * (0.8 + (layer.depth / 100) * 0.5)

  // Canvas-space pixels per frame (speed=1 → 0.8 px/frame at 60 fps)
  const step = layer.speed * 0.8
  const { audioSensitivity } = layer

  // ---- Update positions ----
  for (let i = 0; i < count; i++) {
    const spd = st.speeds[i] * step

    if (direction === 'centreOut') {
      const boost = 1 + audioValue * audioSensitivity * 1.2
      st.radii[i] += spd * boost
      if (st.radii[i] > maxRadius) {
        st.radii[i] = 0
        st.angles[i] = Math.random() * Math.PI * 2
      }
      st.positions[i * 2]     = cx + Math.cos(st.angles[i]) * st.radii[i]
      st.positions[i * 2 + 1] = cy + Math.sin(st.angles[i]) * st.radii[i]

    } else if (direction === 'rotateBeat') {
      const orbitSpd  = spd * 0.004
      const beatBoost = audioValue * audioSensitivity * 0.004
      st.angles[i] += orbitSpd + beatBoost
      const radiusPulse = 1 + audioValue * audioSensitivity * 0.12
      const r = st.radii[i] * radiusPulse
      st.positions[i * 2]     = cx + Math.cos(st.angles[i]) * r
      st.positions[i * 2 + 1] = cy + Math.sin(st.angles[i]) * r

    } else {
      // leftToRight
      const boost = 1 + audioValue * audioSensitivity * 0.4
      st.positions[i * 2] += spd * boost
      if (st.positions[i * 2] > W) {
        st.positions[i * 2]     = 0
        st.positions[i * 2 + 1] = Math.random() * H
      }
    }
  }

  // ---- Realtime audio tracker: instant attack, fast decay ----
  // Tracks the live bass volume directly so opacity mirrors the beat in real time.
  // × 0.75 decay: ~10 frames to zero at 60 fps (~0.17 s).
  if (audioValue > st.peakAudio) {
    st.peakAudio = audioValue                    // instant attack
  } else {
    st.peakAudio *= 0.75                         // fast decay
    if (st.peakAudio < 0.002) st.peakAudio = 0  // hard zero at silence
  }

  // ---- Draw ----
  // 'lighter' (additive blend) – particles only add brightness, never darken.
  const particleRadius = Math.max(0.5, layer.particleSize / 2)

  // Opacity directly mirrors realtime audio volume.
  // When reactive: ceiling is always 1.0 (layer.opacity is hidden/forced to 1).
  // Multiplier 20 maps typical bass (0.3–0.4) to full opacity at sensitivity 0.15.
  // e.g. bass=0.35, sensitivity=0.15 → 0.35×0.15×20 = 1.05 → clamped to 1.0.
  let alpha: number
  if (layer.opacityReactive) {
    const sensitivity = layer.opacitySensitivity ?? 0.3
    alpha = Math.min(1, st.peakAudio * sensitivity * 20)
  } else {
    alpha = layer.opacity
  }

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = alpha
  ctx.fillStyle = layer.particleColor

  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    const x = st.positions[i * 2]
    const y = st.positions[i * 2 + 1]
    ctx.moveTo(x + particleRadius, y)
    ctx.arc(x, y, particleRadius, 0, Math.PI * 2)
  }
  ctx.fill()
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
