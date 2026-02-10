/**
 * BuildUpDetector - Detects energy build-ups in audio leading to drops
 *
 * Uses multiple heuristics:
 * 1. Rising energy trend over time window
 * 2. Increasing bass frequency intensity
 * 3. Spectral changes (narrowing/widening)
 * 4. Rhythm density patterns
 */

export interface BuildUpState {
  // Is a build-up currently detected?
  isBuildup: boolean
  // Confidence level (0-1)
  confidence: number
  // Estimated time to drop (in beats, -1 if unknown)
  beatsToImpact: number
  // Current energy level (0-1)
  energy: number
  // Energy trend direction (-1 to 1)
  trend: number
  // Phase of buildup (early, mid, peak, release)
  phase: 'idle' | 'early' | 'mid' | 'peak' | 'release'
}

export interface BuildUpConfig {
  // Analysis windows
  shortWindowMs: number // Short-term energy window
  longWindowMs: number // Long-term energy window for trend

  // Thresholds
  trendThreshold: number // Minimum trend to detect buildup
  energyThreshold: number // Minimum energy for buildup
  confidenceDecay: number // How fast confidence decays

  // Sensitivity
  bassWeight: number // Weight for bass frequencies
  midWeight: number // Weight for mid frequencies
  highWeight: number // Weight for high frequencies
}

const DEFAULT_CONFIG: BuildUpConfig = {
  shortWindowMs: 500,
  longWindowMs: 4000,
  trendThreshold: 0.05,
  energyThreshold: 0.3,
  confidenceDecay: 0.95,
  bassWeight: 1.5,
  midWeight: 1.0,
  highWeight: 0.8
}

/**
 * Circular buffer for efficient windowed analysis
 */
class CircularBuffer {
  private buffer: number[]
  private index: number = 0
  private size: number
  private count: number = 0

  constructor(size: number) {
    this.size = size
    this.buffer = new Array(size).fill(0)
  }

  push(value: number): void {
    this.buffer[this.index] = value
    this.index = (this.index + 1) % this.size
    if (this.count < this.size) this.count++
  }

  average(): number {
    if (this.count === 0) return 0
    let sum = 0
    for (let i = 0; i < this.count; i++) {
      sum += this.buffer[i]
    }
    return sum / this.count
  }

  // Get the trend (slope) of values in the buffer
  trend(): number {
    if (this.count < 2) return 0

    // Simple linear regression
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumX2 = 0
    const n = this.count

    for (let i = 0; i < n; i++) {
      const idx = (this.index - n + i + this.size) % this.size
      const x = i
      const y = this.buffer[idx]
      sumX += x
      sumY += y
      sumXY += x * y
      sumX2 += x * x
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    // Normalize slope to -1 to 1 range
    return Math.max(-1, Math.min(1, slope * 10))
  }

  getRecent(count: number): number[] {
    const result: number[] = []
    const actualCount = Math.min(count, this.count)
    for (let i = 0; i < actualCount; i++) {
      const idx = (this.index - actualCount + i + this.size) % this.size
      result.push(this.buffer[idx])
    }
    return result
  }

  clear(): void {
    this.buffer.fill(0)
    this.index = 0
    this.count = 0
  }
}

/**
 * BuildUpDetector class
 */
export class BuildUpDetector {
  private config: BuildUpConfig

  // Energy history buffers
  private shortTermEnergy: CircularBuffer
  private longTermEnergy: CircularBuffer
  private bassHistory: CircularBuffer
  private midHistory: CircularBuffer
  private highHistory: CircularBuffer

  // State
  private state: BuildUpState
  private lastUpdateTime: number = 0
  private buildupStartTime: number = 0
  private peakEnergy: number = 0

  // Beat tracking
  private beatHistory: number[] = []
  private lastBeatTime: number = 0

  constructor(config: Partial<BuildUpConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Initialize buffers based on config
    // Assume ~60fps (16ms per frame)
    const shortSize = Math.ceil(this.config.shortWindowMs / 16)
    const longSize = Math.ceil(this.config.longWindowMs / 16)

    this.shortTermEnergy = new CircularBuffer(shortSize)
    this.longTermEnergy = new CircularBuffer(longSize)
    this.bassHistory = new CircularBuffer(shortSize)
    this.midHistory = new CircularBuffer(shortSize)
    this.highHistory = new CircularBuffer(shortSize)

    this.state = {
      isBuildup: false,
      confidence: 0,
      beatsToImpact: -1,
      energy: 0,
      trend: 0,
      phase: 'idle'
    }
  }

  /**
   * Update the detector with new audio data
   */
  update(
    frequencyData: number[],
    bass: number,
    mid: number,
    high: number,
    isBeat: boolean
  ): BuildUpState {
    const now = Date.now()
    this.lastUpdateTime = now

    // Calculate overall energy
    const { bassWeight, midWeight, highWeight } = this.config
    const totalWeight = bassWeight + midWeight + highWeight
    const energy = (bass * bassWeight + mid * midWeight + high * highWeight) / totalWeight

    // Update history buffers
    this.shortTermEnergy.push(energy)
    this.longTermEnergy.push(energy)
    this.bassHistory.push(bass)
    this.midHistory.push(mid)
    this.highHistory.push(high)

    // Track beats
    if (isBeat) {
      this.beatHistory.push(now)
      this.lastBeatTime = now
      // Keep only recent beats
      while (this.beatHistory.length > 0 && now - this.beatHistory[0] > 10000) {
        this.beatHistory.shift()
      }
    }

    // Calculate trends
    const shortAvg = this.shortTermEnergy.average()
    const longAvg = this.longTermEnergy.average()
    const trend = this.longTermEnergy.trend()

    // Calculate bass trend specifically (build-ups often have rising bass)
    const bassTrend = this.bassHistory.trend()

    // Detect build-up conditions
    const { trendThreshold, energyThreshold, confidenceDecay } = this.config

    // Build-up detection heuristics
    let buildupScore = 0

    // 1. Rising energy trend
    if (trend > trendThreshold) {
      buildupScore += trend * 0.4
    }

    // 2. Rising bass
    if (bassTrend > trendThreshold * 0.8) {
      buildupScore += bassTrend * 0.3
    }

    // 3. Energy above threshold
    if (energy > energyThreshold) {
      buildupScore += 0.2
    }

    // 4. Short-term energy exceeding long-term
    if (shortAvg > longAvg * 1.1) {
      buildupScore += 0.1
    }

    // 5. Increasing beat density
    const recentBeatCount = this.beatHistory.filter((t) => now - t < 2000).length
    const oldBeatCount = this.beatHistory.filter((t) => now - t >= 2000 && now - t < 4000).length
    if (recentBeatCount > oldBeatCount * 1.2) {
      buildupScore += 0.1
    }

    // Update confidence
    let newConfidence = this.state.confidence
    if (buildupScore > 0.3) {
      newConfidence = Math.min(1, newConfidence + buildupScore * 0.1)
    } else {
      newConfidence *= confidenceDecay
    }

    // Determine if we're in a build-up
    const isBuildup = newConfidence > 0.4

    // Determine phase
    let phase: BuildUpState['phase'] = 'idle'
    if (isBuildup) {
      if (!this.state.isBuildup) {
        // Just started
        this.buildupStartTime = now
        this.peakEnergy = energy
        phase = 'early'
      } else {
        const duration = now - this.buildupStartTime
        if (duration < 2000) {
          phase = 'early'
        } else if (duration < 6000) {
          phase = 'mid'
        } else {
          phase = 'peak'
        }

        // Track peak energy
        if (energy > this.peakEnergy) {
          this.peakEnergy = energy
        }
      }
    } else if (this.state.isBuildup) {
      // Just ended - likely a drop
      phase = 'release'
      this.peakEnergy = 0
    }

    // Estimate beats to impact (rough heuristic)
    let beatsToImpact = -1
    if (isBuildup && phase !== 'peak') {
      // Estimate based on energy curve - higher confidence = closer to drop
      beatsToImpact = Math.round((1 - newConfidence) * 16) // Assume 16 beat build-up
    }

    // Update state
    this.state = {
      isBuildup,
      confidence: newConfidence,
      beatsToImpact,
      energy,
      trend,
      phase
    }

    return this.state
  }

  /**
   * Get current state without updating
   */
  getState(): BuildUpState {
    return { ...this.state }
  }

  /**
   * Reset the detector
   */
  reset(): void {
    this.shortTermEnergy.clear()
    this.longTermEnergy.clear()
    this.bassHistory.clear()
    this.midHistory.clear()
    this.highHistory.clear()
    this.beatHistory = []
    this.buildupStartTime = 0
    this.peakEnergy = 0
    this.state = {
      isBuildup: false,
      confidence: 0,
      beatsToImpact: -1,
      energy: 0,
      trend: 0,
      phase: 'idle'
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BuildUpConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

/**
 * Hook-style factory for React usage
 */
export function createBuildUpDetector(config?: Partial<BuildUpConfig>): BuildUpDetector {
  return new BuildUpDetector(config)
}

export default BuildUpDetector
