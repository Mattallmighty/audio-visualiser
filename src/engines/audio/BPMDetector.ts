/**
 * BPMDetector - Histogram-based BPM detection with harmonic correction
 *
 * Algorithm:
 * 1. Detect beat onsets via adaptive threshold on bass-weighted energy (median-based)
 * 2. Build inter-onset interval histogram with 2-BPM-wide bins
 * 3. Decay histogram over time (per-frame), not per-beat
 * 4. Score peaks using harmonic ballot: sum evidence for harmonics (½×, 2×, 3×)
 * 5. Prefer musical tempo range (60-180 BPM)
 */

export interface BPMResult {
  bpm: number
  confidence: number
  lastBeatTime: number
  beatPhase: number // 0-1 indicating position in beat cycle
  isBeat: boolean
}

export interface BPMConfig {
  minBPM: number
  maxBPM: number
  beatThreshold: number
  histogramSmoothing: number
  historyDuration: number  // ms
  stabilityFrames: number
}

const DEFAULT_CONFIG: BPMConfig = {
  minBPM: 60,
  maxBPM: 200,
  beatThreshold: 0.15,
  histogramSmoothing: 0.85,
  historyDuration: 8000,
  stabilityFrames: 15,
}

/** Bin width in BPM for histogram quantization */
const BIN_WIDTH = 2

export class BPMDetector {
  private config: BPMConfig

  // Beat history
  private beatTimes: number[] = []

  // Histogram: key = bin index, value = accumulated weight
  private histogram: Map<number, number> = new Map()
  private lastDecayTime: number = 0

  // State
  private currentBPM: number = 120
  private bpmConfidence: number = 0
  private lastBeatTime: number = 0
  private beatPhase: number = 0

  // Stability tracking
  private bpmCandidates: number[] = []
  private stableFrameCount: number = 0
  private previousEnergy: number = 0

  // Adaptive threshold state (circular buffer for median)
  private energyWindow: number[] = []
  private static readonly ENERGY_WINDOW = 60 // ~1s at 60fps

  constructor(config: Partial<BPMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Main entry point - call once per animation frame.
   */
  detect(energy: number, bass: number, now: number = Date.now()): BPMResult {
    // Decay histogram per frame (not per beat)
    this.decayHistogram(now)

    // Detect beat onset
    const isBeat = this.detectBeatOnset(energy, bass, now)

    if (isBeat) {
      this.recordBeat(now)
    }

    // Prune old beats
    this.cleanHistory(now)

    // Update BPM estimate when we have enough beats
    if (this.beatTimes.length >= 4) {
      this.updateBPMEstimate()
    }

    // Calculate beat phase
    if (this.currentBPM > 0 && this.lastBeatTime > 0) {
      const beatInterval = 60000 / this.currentBPM
      this.beatPhase = ((now - this.lastBeatTime) % beatInterval) / beatInterval
    }

    this.previousEnergy = energy

    return {
      bpm: this.currentBPM,
      confidence: this.bpmConfidence,
      lastBeatTime: this.lastBeatTime,
      beatPhase: this.beatPhase,
      isBeat,
    }
  }

  // ─── Beat onset detection ────────────────────────────────────────────────

  private detectBeatOnset(energy: number, bass: number, now: number): boolean {
    const weighted = bass * 0.7 + energy * 0.3

    // Maintain rolling window
    this.energyWindow.push(weighted)
    if (this.energyWindow.length > BPMDetector.ENERGY_WINDOW) {
      this.energyWindow.shift()
    }

    // Median-based adaptive threshold (robust against loud transients)
    const sorted = [...this.energyWindow].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]

    const derivative = weighted - this.previousEnergy
    const threshold = Math.max(this.config.beatThreshold * 0.5, median * 0.2)

    const isAboveMedian = weighted > median * 1.15
    const hasRisingEdge = derivative > threshold

    if (hasRisingEdge && isAboveMedian) {
      // Refractory period derived from max BPM
      const minInterval = Math.floor(60000 / this.config.maxBPM)
      if (now - this.lastBeatTime > minInterval) {
        return true
      }
    }

    return false
  }

  // ─── Beat recording & histogram ──────────────────────────────────────────

  private recordBeat(time: number): void {
    if (this.beatTimes.length > 0) {
      const interval = time - this.beatTimes[this.beatTimes.length - 1]
      this.addToHistogram(interval)
    }
    this.beatTimes.push(time)
    this.lastBeatTime = time
  }

  private bpmToBin(bpm: number): number {
    return Math.round(bpm / BIN_WIDTH)
  }

  private binToBpm(bin: number): number {
    return bin * BIN_WIDTH
  }

  private addToHistogram(intervalMs: number): void {
    const bpm = 60000 / intervalMs
    if (bpm < this.config.minBPM || bpm > this.config.maxBPM) return

    const bin = this.bpmToBin(bpm)
    this.histogram.set(bin, (this.histogram.get(bin) ?? 0) + 1)
  }

  /**
   * Time-based histogram decay: applied once per frame, not per beat.
   * This prevents over-decay at high tempos where beats come fast.
   */
  private decayHistogram(now: number): void {
    if (this.lastDecayTime === 0) {
      this.lastDecayTime = now
      return
    }
    const dt = now - this.lastDecayTime
    this.lastDecayTime = now

    // Decay factor: histogramSmoothing^(dt/16.67) keeps it frame-rate independent
    const decay = Math.pow(this.config.histogramSmoothing, dt / 16.67)

    this.histogram.forEach((value, key) => {
      const newVal = value * decay
      if (newVal < 0.05) {
        this.histogram.delete(key)
      } else {
        this.histogram.set(key, newVal)
      }
    })
  }

  // ─── BPM estimation ───────────────────────────────────────────────────────

  private updateBPMEstimate(): void {
    if (this.histogram.size === 0) return

    const scored = this.scorePeaksWithHarmonics()
    if (scored.length === 0) return

    const best = scored[0]
    this.bpmCandidates.push(best.bpm)
    if (this.bpmCandidates.length > 10) this.bpmCandidates.shift()

    // Check stability (low std-dev over recent candidates)
    const avg = this.bpmCandidates.reduce((a, b) => a + b, 0) / this.bpmCandidates.length
    const variance = this.bpmCandidates.reduce((s, b) => s + (b - avg) ** 2, 0) / this.bpmCandidates.length
    const stdDev = Math.sqrt(variance)

    if (stdDev < 5) {
      this.stableFrameCount++
      if (this.stableFrameCount >= this.config.stabilityFrames) {
        const newBPM = Math.round(avg / BIN_WIDTH) * BIN_WIDTH
        if (Math.abs(newBPM - this.currentBPM) > BIN_WIDTH) {
          this.currentBPM = newBPM
        }
        const totalWeight = Array.from(this.histogram.values()).reduce((a, b) => a + b, 0)
        this.bpmConfidence = Math.min(1, (best.score / Math.max(1, totalWeight)) * 2)
      }
    } else {
      this.stableFrameCount = 0
    }
  }

  /**
   * Score each histogram bin using a harmonic ballot:
   * - A peak at BPM B gets credit for supporting peaks at B/2, B/3, 2B, 3B
   * - Prefer musical range (60–180 BPM) by slightly boosting those bins
   */
  private scorePeaksWithHarmonics(): Array<{ bpm: number; score: number }> {
    if (this.histogram.size === 0) return []

    const harmonicRatios = [0.5, 1 / 3, 2, 3, 1.5, 2 / 3]
    const harmonicWeights = [0.5, 0.25, 0.4, 0.2, 0.3, 0.3]

    const scored: Array<{ bpm: number; score: number }> = []

    this.histogram.forEach((weight, bin) => {
      const bpm = this.binToBpm(bin)
      let score = weight

      // Add harmonic evidence
      harmonicRatios.forEach((ratio, i) => {
        const harmonicBpm = bpm * ratio
        if (harmonicBpm >= this.config.minBPM && harmonicBpm <= this.config.maxBPM) {
          const harmonicBin = this.bpmToBin(harmonicBpm)
          // Check bin and neighbours (±1 bin)
          for (let delta = -1; delta <= 1; delta++) {
            const neighbourWeight = this.histogram.get(harmonicBin + delta) ?? 0
            score += neighbourWeight * harmonicWeights[i] * (1 - Math.abs(delta) * 0.4)
          }
        }
      })

      // Mild boost for musical range 60–180 BPM
      if (bpm >= 60 && bpm <= 180) score *= 1.1

      scored.push({ bpm, score })
    })

    return scored.sort((a, b) => b.score - a.score)
  }

  // ─── History management ───────────────────────────────────────────────────

  private cleanHistory(now: number): void {
    const cutoff = now - this.config.historyDuration
    while (this.beatTimes.length > 0 && this.beatTimes[0] < cutoff) {
      this.beatTimes.shift()
    }
  }

  // ─── Public helpers ───────────────────────────────────────────────────────

  getTimeUntilNextBeat(): number {
    if (this.currentBPM <= 0 || this.lastBeatTime <= 0) return -1
    const beatInterval = 60000 / this.currentBPM
    const now = Date.now()
    return beatInterval - ((now - this.lastBeatTime) % beatInterval)
  }

  getBeatHistory(): number[] {
    return [...this.beatTimes]
  }

  getHistogram(): Array<{ bpm: number; weight: number }> {
    return Array.from(this.histogram.entries())
      .map(([bin, weight]) => ({ bpm: this.binToBpm(bin), weight }))
      .sort((a, b) => a.bpm - b.bpm)
  }

  tap(): void {
    const now = Date.now()
    this.recordBeat(now)
    if (this.beatTimes.length >= 4) {
      const recent = this.beatTimes.slice(-8)
      let total = 0
      for (let i = 1; i < recent.length; i++) total += recent[i] - recent[i - 1]
      const tapped = Math.round(60000 / (total / (recent.length - 1)))
      if (tapped >= this.config.minBPM && tapped <= this.config.maxBPM) {
        this.currentBPM = tapped
        this.bpmConfidence = 0.9
      }
    }
  }

  reset(): void {
    this.beatTimes = []
    this.histogram.clear()
    this.currentBPM = 120
    this.bpmConfidence = 0
    this.lastBeatTime = 0
    this.beatPhase = 0
    this.bpmCandidates = []
    this.stableFrameCount = 0
    this.previousEnergy = 0
    this.energyWindow = []
    this.lastDecayTime = 0
  }

  updateConfig(config: Partial<BPMConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getState(): BPMResult {
    return {
      bpm: this.currentBPM,
      confidence: this.bpmConfidence,
      lastBeatTime: this.lastBeatTime,
      beatPhase: this.beatPhase,
      isBeat: false,
    }
  }
}

export function createBPMDetector(config?: Partial<BPMConfig>): BPMDetector {
  return new BPMDetector(config)
}

export default BPMDetector
