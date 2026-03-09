/**
 * VolumeNormalizer - Implements volume normalization approach
 *
 * Maps volume to [0, 1] (unclamped) using a rolling window where:
 * - 0 = quietest volume within the last N seconds
 * - 1 = mean volume of the last N seconds
 *
 * The normalized value is raised to power K, divided by R, and accumulated
 * into a monotonically increasing stream that replaces wall-clock time
 * for animation driving.
 */

export interface VolumeNormalizerConfig {
  /** Rolling window duration in seconds */
  windowSeconds: number;
  /** Smoothing factor (0-1). Higher = smoother, slower response */
  smoothing: number;
  /** Power curve shaping. Higher = more contrast between quiet/loud */
  responsePower: number;
  /** Accumulation divisor. Higher = slower stream accumulation */
  accumulationDivisor: number;
  /** Expected frame rate for ring buffer sizing */
  frameRate: number;
}

export interface VolumeNormalizerOutput {
  /** Raw normalized value, unclamped. 0 = min(window), 1 = mean(window) */
  normalizedVolume: number;
  /** Smoothed normalized value */
  smoothedVolume: number;
  /** Shaped value: pow(smoothedVolume, K) */
  shapedVolume: number;
  /** Accumulated stream: sum of (shapedVolume / R) over time. Monotonically increasing. */
  accumulatedStream: number;
  /** Intensity multiplier for visual elements */
  intensity: number;
  /** Rolling window min */
  windowMin: number;
  /** Rolling window mean */
  windowMean: number;
}

const DEFAULT_CONFIG: VolumeNormalizerConfig = {
  windowSeconds: 5.0,
  smoothing: 0.85,
  responsePower: 2.0,
  accumulationDivisor: 60.0,
  frameRate: 60,
};

export class VolumeNormalizer {
  private config: VolumeNormalizerConfig;
  private ringBuffer: Float32Array;
  private bufferSize: number;
  private writeIndex: number = 0;
  private sampleCount: number = 0;
  private smoothedValue: number = 0;
  private stream: number = 0;

  constructor(config: Partial<VolumeNormalizerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.bufferSize = Math.ceil(
      this.config.windowSeconds * this.config.frameRate,
    );
    this.ringBuffer = new Float32Array(this.bufferSize);
  }

  updateConfig(config: Partial<VolumeNormalizerConfig>): void {
    const newConfig = { ...this.config, ...config };
    const newBufferSize = Math.ceil(
      newConfig.windowSeconds * newConfig.frameRate,
    );

    if (newBufferSize !== this.bufferSize) {
      const newBuffer = new Float32Array(newBufferSize);
      // Copy existing data if possible
      const copyCount = Math.min(this.sampleCount, newBufferSize);
      for (let i = 0; i < copyCount; i++) {
        const srcIdx =
          (this.writeIndex - copyCount + i + this.bufferSize) % this.bufferSize;
        newBuffer[i] = this.ringBuffer[srcIdx];
      }
      this.ringBuffer = newBuffer;
      this.bufferSize = newBufferSize;
      this.writeIndex = copyCount % newBufferSize;
      this.sampleCount = copyCount;
    }

    this.config = newConfig;
  }

  /**
   * Process a single volume sample and return normalized output.
   * Call once per animation frame.
   */
  process(volume: number): VolumeNormalizerOutput {
    // Write to ring buffer
    this.ringBuffer[this.writeIndex] = volume;
    this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
    if (this.sampleCount < this.bufferSize) this.sampleCount++;

    // Compute window min and mean
    let min = Infinity;
    let sum = 0;
    for (let i = 0; i < this.sampleCount; i++) {
      const val = this.ringBuffer[i];
      if (val < min) min = val;
      sum += val;
    }
    const mean = sum / this.sampleCount;
    const windowMin = min === Infinity ? 0 : min;

    // Normalize: 0 = min(window), 1 = mean(window), unclamped
    const range = mean - windowMin;
    const normalizedVolume = range > 0.0001 ? (volume - windowMin) / range : 0;

    // Smooth
    const { smoothing, responsePower, accumulationDivisor } = this.config;
    this.smoothedValue =
      this.smoothedValue * smoothing + normalizedVolume * (1 - smoothing);

    // Shape with power curve
    const shapedVolume = Math.pow(
      Math.max(0, this.smoothedValue),
      responsePower,
    );

    // Accumulate stream (monotonically increasing, replaces u_time)
    this.stream += shapedVolume / accumulationDivisor;

    return {
      normalizedVolume,
      smoothedVolume: this.smoothedValue,
      shapedVolume,
      accumulatedStream: this.stream,
      intensity: this.smoothedValue,
      windowMin,
      windowMean: mean,
    };
  }

  reset(): void {
    this.ringBuffer.fill(0);
    this.writeIndex = 0;
    this.sampleCount = 0;
    this.smoothedValue = 0;
    this.stream = 0;
  }

  getConfig(): VolumeNormalizerConfig {
    return { ...this.config };
  }
}
