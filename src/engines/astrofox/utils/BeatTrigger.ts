/**
 * Beat Trigger Utility
 *
 * Provides beat detection with exponential decay for transient effects
 * like camera shake, glitches, or visual impacts on kick drums.
 */

export interface BeatTriggerConfig {
  /** Decay rate (0-1). Higher = slower decay. Recommended: 0.9-0.95 */
  decayRate?: number
  /** Minimum time between triggers in milliseconds. Prevents rapid re-triggering. */
  debounceMs?: number
  /** Intensity threshold (0-1) to trigger effect. */
  threshold?: number
}

const DEFAULT_CONFIG: Required<BeatTriggerConfig> = {
  decayRate: 0.92,
  debounceMs: 100,
  threshold: 0.7,
}

/**
 * BeatTrigger class for beat-synchronized transient effects
 */
export class BeatTrigger {
  private config: Required<BeatTriggerConfig>
  private intensity: number = 0
  private lastTriggerTime: number = 0

  constructor(config: BeatTriggerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Update trigger state based on beat detection
   * @param isBeat - Whether a beat was detected this frame
   * @param beatIntensity - Intensity of the beat (0-1)
   * @returns Current trigger intensity value (0-1)
   */
  update(isBeat: boolean, beatIntensity: number): number {
    const now = performance.now()
    const timeSinceLastTrigger = now - this.lastTriggerTime

    // Trigger on beat if above threshold and outside debounce window
    if (
      isBeat &&
      beatIntensity >= this.config.threshold &&
      timeSinceLastTrigger >= this.config.debounceMs
    ) {
      this.intensity = 1.0
      this.lastTriggerTime = now
    }

    // Exponential decay
    this.intensity *= this.config.decayRate

    // Clamp to prevent floating point drift
    if (this.intensity < 0.001) {
      this.intensity = 0
    }

    return this.intensity
  }

  /**
   * Get current intensity without updating
   */
  getIntensity(): number {
    return this.intensity
  }

  /**
   * Reset trigger state
   */
  reset(): void {
    this.intensity = 0
    this.lastTriggerTime = 0
  }

  /**
   * Set decay rate dynamically
   */
  setDecayRate(rate: number): void {
    this.config.decayRate = Math.max(0, Math.min(1, rate))
  }

  /**
   * Set threshold dynamically
   */
  setThreshold(threshold: number): void {
    this.config.threshold = Math.max(0, Math.min(1, threshold))
  }
}
