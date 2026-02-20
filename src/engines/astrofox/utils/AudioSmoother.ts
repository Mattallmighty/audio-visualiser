/**
 * Audio Smoother Utility
 *
 * Provides smooth interpolation (lerp) for audio values to prevent jittery visuals.
 * Used to smooth bass/mid/high frequency bands for 3D visualizations.
 */

export interface FrequencyBands {
  bass: number
  mid: number
  high: number
}

export type FrequencyBand = 'bass' | 'mid' | 'high'

/**
 * Linear interpolation helper
 */
function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor
}

/**
 * AudioSmoother class for smoothing audio data over time
 */
export class AudioSmoother {
  private current: FrequencyBands = { bass: 0, mid: 0, high: 0 }
  private lerpFactor: number

  /**
   * @param lerpFactor - Smoothing factor (0-1). Lower = smoother but slower response. Recommended: 0.1-0.2
   */
  constructor(lerpFactor: number = 0.15) {
    this.lerpFactor = Math.max(0, Math.min(1, lerpFactor))
  }

  /**
   * Update smoothed values with new audio data
   */
  update(target: FrequencyBands): FrequencyBands {
    this.current.bass = lerp(this.current.bass, target.bass, this.lerpFactor)
    this.current.mid = lerp(this.current.mid, target.mid, this.lerpFactor)
    this.current.high = lerp(this.current.high, target.high, this.lerpFactor)

    return { ...this.current }
  }

  /**
   * Reset smoothed values to zero
   */
  reset(): void {
    this.current = { bass: 0, mid: 0, high: 0 }
  }

  /**
   * Set lerp factor dynamically
   */
  setLerpFactor(factor: number): void {
    this.lerpFactor = Math.max(0, Math.min(1, factor))
  }
}

/**
 * Get combined audio value from selected frequency bands
 * @param bands - Current frequency band values
 * @param selectedBands - Array of bands to combine (e.g., ['bass', 'mid'])
 * @returns Combined audio value (0-1), averaged across selected bands
 */
export function getAudioValueFromBands(
  bands: FrequencyBands,
  selectedBands: FrequencyBand[]
): number {
  if (!selectedBands || selectedBands.length === 0) {
    return 0
  }

  let sum = 0
  for (const band of selectedBands) {
    sum += bands[band] || 0
  }

  return sum / selectedBands.length
}
