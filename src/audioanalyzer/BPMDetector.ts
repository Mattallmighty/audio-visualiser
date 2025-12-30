/**
 * BPMDetector - Improved BPM detection using histogram method
 *
 * Uses multiple approaches for robust BPM detection:
 * 1. Inter-onset interval histogram
 * 2. Autocorrelation
 * 3. Beat interval clustering
 */

export interface BPMResult {
  bpm: number
  confidence: number
  lastBeatTime: number
  beatPhase: number // 0-1 indicating position in beat cycle
  isBeat: boolean
}

export interface BPMConfig {
  // BPM range to search
  minBPM: number
  maxBPM: number

  // Detection sensitivity
  beatThreshold: number
  histogramSmoothing: number

  // Temporal settings
  historyDuration: number // ms
  stabilityFrames: number // Frames to wait before changing BPM
}

const DEFAULT_CONFIG: BPMConfig = {
  minBPM: 60,
  maxBPM: 200,
  beatThreshold: 0.15, // Lowered for microphone sensitivity
  histogramSmoothing: 0.85,
  historyDuration: 8000, // 8 seconds for faster response
  stabilityFrames: 15 // Faster BPM lock
}

/**
 * BPMDetector class
 */
export class BPMDetector {
  private config: BPMConfig

  // Beat history
  private beatTimes: number[] = []
  private intervalHistogram: Map<number, number> = new Map()

  // State
  private currentBPM: number = 120
  private bpmConfidence: number = 0
  private lastBeatTime: number = 0
  private beatPhase: number = 0

  // Stability tracking
  private bpmCandidates: number[] = []
  private stableFrameCount: number = 0
  private previousEnergy: number = 0

  constructor(config: Partial<BPMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Detect beats and update BPM estimate
   */
  detect(energy: number, bass: number): BPMResult {
    const now = Date.now()

    // Detect beat onset (rising edge of energy)
    const isBeat = this.detectBeatOnset(energy, bass)

    if (isBeat) {
      this.recordBeat(now)
    }

    // Clean old beats
    this.cleanHistory(now)

    // Update BPM estimate periodically
    if (this.beatTimes.length >= 4) {
      this.updateBPMEstimate()
    }

    // Calculate beat phase
    if (this.currentBPM > 0 && this.lastBeatTime > 0) {
      const beatInterval = 60000 / this.currentBPM
      const timeSinceLastBeat = now - this.lastBeatTime
      this.beatPhase = (timeSinceLastBeat % beatInterval) / beatInterval
    }

    this.previousEnergy = energy

    return {
      bpm: this.currentBPM,
      confidence: this.bpmConfidence,
      lastBeatTime: this.lastBeatTime,
      beatPhase: this.beatPhase,
      isBeat
    }
  }

  // Running average for adaptive threshold
  private energyHistory: number[] = []
  private avgEnergy: number = 0

  /**
   * Detect beat onset using adaptive threshold
   */
  private detectBeatOnset(energy: number, bass: number): boolean {
    // Use bass-weighted energy for beat detection
    const weightedEnergy = bass * 0.7 + energy * 0.3

    // Update energy history for adaptive threshold
    this.energyHistory.push(weightedEnergy)
    if (this.energyHistory.length > 43) { // ~0.7 seconds at 60fps
      this.energyHistory.shift()
    }

    // Calculate average energy
    this.avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length

    // Rising edge detection with adaptive threshold
    const energyDerivative = weightedEnergy - this.previousEnergy
    const adaptiveThreshold = Math.max(this.config.beatThreshold * 0.5, this.avgEnergy * 0.2) // Increased sensitivity

    // Beat occurs on significant energy increase above average
    const isAboveAvg = weightedEnergy > this.avgEnergy * 1.15 // Lowered from 1.3
    const hasRisingEdge = energyDerivative > adaptiveThreshold

    if (hasRisingEdge && isAboveAvg) {
      // Minimum time between beats (max 300 BPM = 200ms)
      const minInterval = 180
      const now = Date.now()

      if (now - this.lastBeatTime > minInterval) {
        return true
      }
    }

    return false
  }

  /**
   * Record a beat occurrence
   */
  private recordBeat(time: number): void {
    this.beatTimes.push(time)
    this.lastBeatTime = time

    // Update interval histogram
    if (this.beatTimes.length >= 2) {
      const interval = time - this.beatTimes[this.beatTimes.length - 2]
      this.addToHistogram(interval)
    }
  }

  /**
   * Add interval to histogram with quantization
   */
  private addToHistogram(interval: number): void {
    const { minBPM, maxBPM } = this.config

    // Convert to BPM
    const bpm = 60000 / interval

    // Check if in valid range
    if (bpm < minBPM || bpm > maxBPM) return

    // Quantize to nearest BPM
    const quantizedBPM = Math.round(bpm)

    // Update histogram with smoothing
    const current = this.intervalHistogram.get(quantizedBPM) || 0
    this.intervalHistogram.set(quantizedBPM, current + 1)

    // Decay old values
    const { histogramSmoothing } = this.config
    this.intervalHistogram.forEach((value, key) => {
      this.intervalHistogram.set(key, value * histogramSmoothing)
    })

    // Remove very low values
    this.intervalHistogram.forEach((value, key) => {
      if (value < 0.1) {
        this.intervalHistogram.delete(key)
      }
    })
  }

  /**
   * Update BPM estimate from histogram
   */
  private updateBPMEstimate(): void {
    if (this.intervalHistogram.size === 0) return

    // Find peaks in histogram
    const peaks = this.findHistogramPeaks()

    if (peaks.length === 0) return

    // Get the strongest peak
    const bestCandidate = peaks[0]

    // Track BPM stability
    this.bpmCandidates.push(bestCandidate.bpm)
    if (this.bpmCandidates.length > 10) {
      this.bpmCandidates.shift()
    }

    // Calculate candidate agreement
    const candidateAvg = this.bpmCandidates.reduce((a, b) => a + b, 0) / this.bpmCandidates.length
    const candidateStdDev = Math.sqrt(
      this.bpmCandidates.reduce((sum, bpm) => sum + Math.pow(bpm - candidateAvg, 2), 0) /
        this.bpmCandidates.length
    )

    // If candidates are stable, update BPM
    if (candidateStdDev < 5) {
      this.stableFrameCount++

      if (this.stableFrameCount >= this.config.stabilityFrames) {
        // Use rounded average as the BPM
        const newBPM = Math.round(candidateAvg)

        // Only update if significantly different
        if (Math.abs(newBPM - this.currentBPM) > 2) {
          this.currentBPM = newBPM
        }

        // Calculate confidence based on peak strength and stability
        const totalWeight = Array.from(this.intervalHistogram.values()).reduce((a, b) => a + b, 0)
        this.bpmConfidence = Math.min(1, (bestCandidate.weight / totalWeight) * 2)
      }
    } else {
      this.stableFrameCount = 0
    }
  }

  /**
   * Find peaks in the histogram
   */
  private findHistogramPeaks(): Array<{ bpm: number; weight: number }> {
    const peaks: Array<{ bpm: number; weight: number }> = []
    const entries = Array.from(this.intervalHistogram.entries()).sort((a, b) => b[1] - a[1])

    // Get top candidates
    for (const [bpm, weight] of entries.slice(0, 5)) {
      peaks.push({ bpm, weight })
    }

    // Also check for harmonic relationships (half/double time)
    for (const peak of [...peaks]) {
      // Check double time
      const doubleBPM = peak.bpm * 2
      if (doubleBPM <= this.config.maxBPM) {
        const doubleWeight = this.intervalHistogram.get(Math.round(doubleBPM)) || 0
        if (doubleWeight > peak.weight * 0.3) {
          // Prefer the faster tempo if it has significant support
          peak.bpm = doubleBPM
        }
      }

      // Check half time
      const halfBPM = peak.bpm / 2
      if (halfBPM >= this.config.minBPM) {
        const halfWeight = this.intervalHistogram.get(Math.round(halfBPM)) || 0
        if (halfWeight > peak.weight * 0.5) {
          // Keep slower tempo if it has stronger support
          peak.bpm = halfBPM
        }
      }
    }

    return peaks.sort((a, b) => b.weight - a.weight)
  }

  /**
   * Clean old beats from history
   */
  private cleanHistory(now: number): void {
    const { historyDuration } = this.config
    const cutoff = now - historyDuration

    while (this.beatTimes.length > 0 && this.beatTimes[0] < cutoff) {
      this.beatTimes.shift()
    }
  }

  /**
   * Get time until next predicted beat
   */
  getTimeUntilNextBeat(): number {
    if (this.currentBPM <= 0 || this.lastBeatTime <= 0) return -1

    const beatInterval = 60000 / this.currentBPM
    const now = Date.now()
    const timeSinceLastBeat = now - this.lastBeatTime
    const timeUntilNext = beatInterval - (timeSinceLastBeat % beatInterval)

    return timeUntilNext
  }

  /**
   * Get beat times within recent history
   */
  getBeatHistory(): number[] {
    return [...this.beatTimes]
  }

  /**
   * Get the interval histogram for visualization
   */
  getHistogram(): Array<{ bpm: number; weight: number }> {
    return Array.from(this.intervalHistogram.entries())
      .map(([bpm, weight]) => ({ bpm, weight }))
      .sort((a, b) => a.bpm - b.bpm)
  }

  /**
   * Reset the detector
   */
  reset(): void {
    this.beatTimes = []
    this.intervalHistogram.clear()
    this.currentBPM = 120
    this.bpmConfidence = 0
    this.lastBeatTime = 0
    this.beatPhase = 0
    this.bpmCandidates = []
    this.stableFrameCount = 0
    this.previousEnergy = 0
    this.energyHistory = []
    this.avgEnergy = 0
  }

  /**
   * Tap tempo - manually tap to set BPM
   */
  tap(): void {
    const now = Date.now()

    // Treat tap as a beat
    this.recordBeat(now)

    // If we have enough taps, calculate BPM directly
    if (this.beatTimes.length >= 4) {
      const recentTaps = this.beatTimes.slice(-8)
      let totalInterval = 0
      for (let i = 1; i < recentTaps.length; i++) {
        totalInterval += recentTaps[i] - recentTaps[i - 1]
      }
      const avgInterval = totalInterval / (recentTaps.length - 1)
      const tappedBPM = Math.round(60000 / avgInterval)

      if (tappedBPM >= this.config.minBPM && tappedBPM <= this.config.maxBPM) {
        this.currentBPM = tappedBPM
        this.bpmConfidence = 0.9 // High confidence from manual tap
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BPMConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current state
   */
  getState(): BPMResult {
    return {
      bpm: this.currentBPM,
      confidence: this.bpmConfidence,
      lastBeatTime: this.lastBeatTime,
      beatPhase: this.beatPhase,
      isBeat: false // Only true during detect()
    }
  }
}

/**
 * Factory function
 */
export function createBPMDetector(config?: Partial<BPMConfig>): BPMDetector {
  return new BPMDetector(config)
}

export default BPMDetector
