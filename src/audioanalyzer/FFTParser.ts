/**
 * FFTParser - Parse and process FFT audio data
 *
 * Based on Astrofox FFTParser, adapted for LedFx.
 * Provides frequency range selection, dB normalization, and smoothing.
 */

// Fast math utilities (from astrofox utils/math.js)
const floor = (val: number): number => ~~val
const clamp = (num: number, min: number, max: number): number =>
  num < min ? min : num > max ? max : num
const normalize = (val: number, min: number, max: number): number =>
  clamp((val - min) / (max - min), 0, 1)

// dB to magnitude conversion: Math.pow(10, 0.05 * val)
const db2mag = (val: number): number => Math.exp(0.1151292546497023 * val)

export interface FFTParserConfig {
  fftSize: number
  sampleRate: number
  smoothingTimeConstant: number
  minDecibels: number
  maxDecibels: number
  minFrequency: number
  maxFrequency: number
}

const DEFAULT_CONFIG: FFTParserConfig = {
  fftSize: 2048,
  sampleRate: 44100,
  smoothingTimeConstant: 0.5,
  minDecibels: -100,
  maxDecibels: -12,
  minFrequency: 20,
  maxFrequency: 6000,
}

export class FFTParser {
  private config: FFTParserConfig
  private startBin: number = 0
  private endBin: number = 0
  private totalBins: number = 0
  private output: Float32Array = new Float32Array(0)
  private buffer: Float32Array = new Float32Array(0)

  constructor(config: Partial<FFTParserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.init()
  }

  private init(): void {
    const { fftSize, sampleRate, minFrequency, maxFrequency } = this.config
    const range = sampleRate / fftSize

    this.startBin = floor(minFrequency / range)
    this.endBin = floor(maxFrequency / range)
    this.totalBins = this.endBin - this.startBin
  }

  updateConfig(config: Partial<FFTParserConfig>): void {
    const needsInit =
      config.fftSize !== undefined ||
      config.sampleRate !== undefined ||
      config.minFrequency !== undefined ||
      config.maxFrequency !== undefined

    this.config = { ...this.config, ...config }

    if (needsInit) {
      this.init()
    }
  }

  /**
   * Convert FFT byte value (0-255) to normalized value (0-1) based on dB range
   */
  private getValue(fftValue: number): number {
    const { minDecibels, maxDecibels } = this.config
    // Convert byte value (0-255) to dB
    const db = minDecibels * (1 - fftValue / 256)
    // Convert dB to magnitude and normalize
    return normalize(db2mag(db), db2mag(minDecibels), db2mag(maxDecibels))
  }

  /**
   * Parse FFT data with frequency range selection and normalization
   *
   * @param fft - Raw FFT byte data (Uint8Array or number[])
   * @param bins - Target number of output bins (optional, defaults to frequency range bins)
   * @returns Normalized FFT data as Float32Array
   */
  parseFFT(fft: Uint8Array | number[], bins?: number): Float32Array {
    const { startBin, endBin, totalBins } = this
    const { smoothingTimeConstant } = this.config
    const size = bins || totalBins

    // Resize output arrays if needed
    if (this.output.length !== size) {
      this.output = new Float32Array(size)
      this.buffer = new Float32Array(size)
    }

    // Handle edge case
    if (fft.length === 0 || totalBins <= 0) {
      return this.output
    }

    // Straight conversion (1:1 mapping)
    if (size === totalBins) {
      for (let i = startBin, k = 0; i < endBin; i++, k++) {
        this.output[k] = this.getValue(fft[i] || 0)
      }
    }
    // Compress data (more source bins than target)
    else if (size < totalBins) {
      const step = totalBins / size

      for (let i = 0; i < size; i++) {
        const start = floor(startBin + i * step)
        const end = floor(startBin + (i + 1) * step)
        let max = 0

        // Find max value within range (peak detection)
        for (let j = start; j < end && j < fft.length; j++) {
          const val = fft[j] || 0
          if (val > max) {
            max = val
          }
        }

        this.output[i] = this.getValue(max)
      }
    }
    // Expand data (fewer source bins than target)
    else if (size > totalBins) {
      const step = size / totalBins

      for (let i = startBin, j = 0; i < endBin && i < fft.length; i++, j++) {
        const val = this.getValue(fft[i] || 0)
        const startK = floor(j * step)
        const endK = floor((j + 1) * step)

        for (let k = startK; k < endK && k < size; k++) {
          this.output[k] = val
        }
      }
    }

    // Apply temporal smoothing
    if (smoothingTimeConstant > 0) {
      for (let i = 0; i < size; i++) {
        this.output[i] = this.buffer[i] * smoothingTimeConstant +
                         this.output[i] * (1.0 - smoothingTimeConstant)
        this.buffer[i] = this.output[i]
      }
    }

    return this.output
  }

  /**
   * Get a single value representing the average energy in the frequency range
   */
  getEnergy(fft: Uint8Array | number[]): number {
    const { startBin, endBin } = this
    const count = endBin - startBin

    if (count <= 0 || fft.length === 0) return 0

    let sum = 0
    for (let i = startBin; i < endBin && i < fft.length; i++) {
      sum += this.getValue(fft[i] || 0)
    }

    return sum / count
  }

  /**
   * Reset smoothing buffers
   */
  reset(): void {
    this.output.fill(0)
    this.buffer.fill(0)
  }

  /**
   * Get current configuration
   */
  getConfig(): FFTParserConfig {
    return { ...this.config }
  }

  /**
   * Get frequency bin info
   */
  getBinInfo(): { startBin: number; endBin: number; totalBins: number } {
    return {
      startBin: this.startBin,
      endBin: this.endBin,
      totalBins: this.totalBins,
    }
  }
}

/**
 * WaveParser - Parse time-domain waveform data
 *
 * Based on Astrofox WaveParser for sound wave displays.
 */
export interface WaveParserConfig {
  smoothingTimeConstant: number
}

const DEFAULT_WAVE_CONFIG: WaveParserConfig = {
  smoothingTimeConstant: 0,
}

export class WaveParser {
  private config: WaveParserConfig
  private output: Float32Array = new Float32Array(0)
  private buffer: Float32Array = new Float32Array(0)

  constructor(config: Partial<WaveParserConfig> = {}) {
    this.config = { ...DEFAULT_WAVE_CONFIG, ...config }
  }

  updateConfig(config: Partial<WaveParserConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Parse time-domain waveform data
   *
   * @param data - Raw waveform data (Float32Array with values -1 to 1, or Uint8Array 0-255)
   * @param size - Target output size
   * @returns Normalized waveform data (0-1)
   */
  parseTimeData(data: Float32Array | Uint8Array | number[], size: number): Float32Array {
    const { smoothingTimeConstant } = this.config
    const step = data.length / size

    // Resize output arrays if needed
    if (this.output.length !== size) {
      this.output = new Float32Array(size)
      this.buffer = new Float32Array(size)
    }

    // Determine if input is normalized (-1 to 1) or byte (0-255)
    const isByteData = data instanceof Uint8Array ||
                       (data.length > 0 && (data[0] as number) > 1)

    for (let i = 0, j = 0; i < size; i++, j += step) {
      const idx = floor(j)
      const raw = data[idx] as number || 0

      // Normalize to 0-1 range
      if (isByteData) {
        this.output[i] = normalize(raw, 0, 255)
      } else {
        // Float data (-1 to 1) -> normalize to 0-1
        this.output[i] = normalize(raw, -1, 1)
      }
    }

    // Apply temporal smoothing
    if (smoothingTimeConstant > 0) {
      for (let i = 0; i < size; i++) {
        this.output[i] = this.buffer[i] * smoothingTimeConstant +
                         this.output[i] * (1.0 - smoothingTimeConstant)
        this.buffer[i] = this.output[i]
      }
    }

    return this.output
  }

  reset(): void {
    this.output.fill(0)
    this.buffer.fill(0)
  }
}

export default FFTParser
