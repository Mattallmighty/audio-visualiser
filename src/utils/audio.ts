/**
 * Audio processing utilities
 */

export interface FrequencyBands {
  bass: number
  mid: number
  high: number
}

/**
 * Calculate frequency bands (bass, mid, high) from audio data array
 * 
 * @param data - Array of audio frequency data values
 * @returns Object with averaged values for bass (0-10%), mid (10-50%), and high (50-100%) frequency bands
 */
export function calculateFrequencyBands(data: number[]): FrequencyBands {
  if (data.length === 0) return { bass: 0, mid: 0, high: 0 }

  const len = data.length
  const bassEnd = Math.floor(len * 0.1) // ~0-10% = bass
  const midEnd = Math.floor(len * 0.5) // ~10-50% = mids
  // ~50-100% = highs

  let bassSum = 0
  let midSum = 0
  let highSum = 0
  
  for (let i = 0; i < len; i++) {
    if (i < bassEnd) {
      bassSum += data[i]
    } else if (i < midEnd) {
      midSum += data[i]
    } else {
      highSum += data[i]
    }
  }

  return {
    bass: bassEnd > 0 ? bassSum / bassEnd : 0,
    mid: midEnd - bassEnd > 0 ? midSum / (midEnd - bassEnd) : 0,
    high: len - midEnd > 0 ? highSum / (len - midEnd) : 0
  }
}
