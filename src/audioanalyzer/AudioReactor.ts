/**
 * AudioReactor - Maps audio frequency data to shader uniforms
 *
 * Based on Astrofox AudioReactor pattern, adapted for LedFx.
 * Allows configurable frequency-to-parameter mapping with various output modes.
 */

export enum ReactorMode {
  ADD = 'add', // Direct mapping (0 + value)
  SUBTRACT = 'subtract', // Inverted mapping (1 - value)
  MULTIPLY = 'multiply', // Compound effect (current * value)
  CYCLE = 'cycle', // Accumulative cycling (wraps around)
  PULSE = 'pulse' // Triggered burst on threshold
}

export interface ReactorConfig {
  // Frequency selection (0-1 normalized)
  startFreq: number
  endFreq: number

  // Output transformation
  mode: ReactorMode
  sensitivity: number
  smoothing: number

  // Range mapping
  minValue: number
  maxValue: number

  // For pulse mode
  threshold?: number
  decayRate?: number
}

const DEFAULT_CONFIG: ReactorConfig = {
  startFreq: 0,
  endFreq: 1,
  mode: ReactorMode.ADD,
  sensitivity: 1.0,
  smoothing: 0.5,
  minValue: 0,
  maxValue: 1,
  threshold: 0.5,
  decayRate: 0.95
}

/**
 * AudioReactor - Single parameter reactor
 */
export class AudioReactor {
  private config: ReactorConfig
  private buffer: number = 0
  private accumulator: number = 0
  private pulseValue: number = 0

  constructor(config: Partial<ReactorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Process audio data and return uniform value
   */
  process(frequencyData: number[]): number {
    const { startFreq, endFreq, mode, sensitivity, smoothing, minValue, maxValue } = this.config

    // Handle empty data
    if (!frequencyData || frequencyData.length === 0) {
      return this.buffer
    }

    // Extract frequency range
    const startIdx = Math.floor(startFreq * frequencyData.length)
    const endIdx = Math.max(startIdx + 1, Math.ceil(endFreq * frequencyData.length))

    // Average the selected range
    let sum = 0
    for (let i = startIdx; i < endIdx; i++) {
      sum += frequencyData[i] || 0
    }
    const rawValue = sum / (endIdx - startIdx)

    // Apply mode transformation
    let value = this.applyMode(rawValue * sensitivity, mode)

    // Apply smoothing
    value = this.buffer * smoothing + value * (1 - smoothing)
    this.buffer = value

    // Map to output range
    const range = maxValue - minValue
    return minValue + Math.max(0, Math.min(1, value)) * range
  }

  private applyMode(value: number, mode: ReactorMode): number {
    const CYCLE_SPEED = 0.05

    switch (mode) {
      case ReactorMode.ADD:
        return value

      case ReactorMode.SUBTRACT:
        return 1.0 - value

      case ReactorMode.MULTIPLY:
        // Compound effect - multiplies against previous value
        return Math.max(0.1, this.buffer) * (0.5 + value * 0.5)

      case ReactorMode.CYCLE:
        // Accumulative cycling
        this.accumulator += value * CYCLE_SPEED
        if (this.accumulator > 1) this.accumulator -= 1
        if (this.accumulator < 0) this.accumulator += 1
        return this.accumulator

      case ReactorMode.PULSE: {
        // Triggered burst on threshold
        const { threshold = 0.5, decayRate = 0.95 } = this.config
        if (value > threshold && this.pulseValue < 0.5) {
          this.pulseValue = 1.0
        }
        this.pulseValue *= decayRate
        return this.pulseValue
      }

      default:
        return value
    }
  }

  reset(): void {
    this.buffer = 0
    this.accumulator = 0
    this.pulseValue = 0
  }

  updateConfig(config: Partial<ReactorConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): ReactorConfig {
    return { ...this.config }
  }
}

/**
 * ReactorManager - Manages multiple reactors for different shader parameters
 */
export class ReactorManager {
  private reactors = new Map<string, AudioReactor>()

  /**
   * Create or update a reactor for a shader uniform
   */
  setReactor(uniformName: string, config: Partial<ReactorConfig>): void {
    if (this.reactors.has(uniformName)) {
      this.reactors.get(uniformName)!.updateConfig(config)
    } else {
      this.reactors.set(uniformName, new AudioReactor(config))
    }
  }

  /**
   * Get a specific reactor
   */
  getReactor(uniformName: string): AudioReactor | undefined {
    return this.reactors.get(uniformName)
  }

  /**
   * Check if a reactor exists
   */
  hasReactor(uniformName: string): boolean {
    return this.reactors.has(uniformName)
  }

  /**
   * Process all reactors and return uniform values
   */
  processAll(frequencyData: number[]): Record<string, number> {
    const uniforms: Record<string, number> = {}

    this.reactors.forEach((reactor, name) => {
      uniforms[name] = reactor.process(frequencyData)
    })

    return uniforms
  }

  /**
   * Process a single reactor by name
   */
  process(uniformName: string, frequencyData: number[]): number | undefined {
    const reactor = this.reactors.get(uniformName)
    return reactor?.process(frequencyData)
  }

  /**
   * Reset all reactors
   */
  resetAll(): void {
    this.reactors.forEach((reactor) => reactor.reset())
  }

  /**
   * Remove a reactor
   */
  removeReactor(uniformName: string): void {
    this.reactors.delete(uniformName)
  }

  /**
   * Clear all reactors
   */
  clearAll(): void {
    this.reactors.clear()
  }

  /**
   * Get list of all reactor names
   */
  getReactorNames(): string[] {
    return Array.from(this.reactors.keys())
  }

  /**
   * Get all reactor configurations
   */
  getAllConfigs(): Record<string, ReactorConfig> {
    const configs: Record<string, ReactorConfig> = {}
    this.reactors.forEach((reactor, name) => {
      configs[name] = reactor.getConfig()
    })
    return configs
  }

  /**
   * Load configurations from object
   */
  loadConfigs(configs: Record<string, Partial<ReactorConfig>>): void {
    Object.entries(configs).forEach(([name, config]) => {
      this.setReactor(name, config)
    })
  }
}

/**
 * Preset reactor configurations for common use cases
 */
export const REACTOR_PRESETS = {
  // Bass controls rotation (accumulative)
  bassRotation: {
    startFreq: 0.0,
    endFreq: 0.1,
    mode: ReactorMode.CYCLE,
    sensitivity: 2.0,
    smoothing: 0.3,
    minValue: 0,
    maxValue: Math.PI * 2
  },

  // Mid controls brightness
  midBrightness: {
    startFreq: 0.1,
    endFreq: 0.5,
    mode: ReactorMode.ADD,
    sensitivity: 1.5,
    smoothing: 0.5,
    minValue: 0.2,
    maxValue: 1.0
  },

  // High controls energy/intensity
  highEnergy: {
    startFreq: 0.5,
    endFreq: 1.0,
    mode: ReactorMode.ADD,
    sensitivity: 1.0,
    smoothing: 0.2,
    minValue: 0,
    maxValue: 1.0
  },

  // Bass triggers pulse effect
  bassPulse: {
    startFreq: 0.0,
    endFreq: 0.08,
    mode: ReactorMode.PULSE,
    sensitivity: 2.5,
    smoothing: 0.0,
    threshold: 0.6,
    decayRate: 0.92,
    minValue: 0,
    maxValue: 1.0
  },

  // Full spectrum zoom
  spectrumZoom: {
    startFreq: 0.0,
    endFreq: 1.0,
    mode: ReactorMode.ADD,
    sensitivity: 1.0,
    smoothing: 0.6,
    minValue: 0.8,
    maxValue: 1.5
  },

  // Inverted bass for glow effect
  invertedBass: {
    startFreq: 0.0,
    endFreq: 0.15,
    mode: ReactorMode.SUBTRACT,
    sensitivity: 1.5,
    smoothing: 0.4,
    minValue: 0.3,
    maxValue: 1.0
  }
} as const

export type ReactorPresetName = keyof typeof REACTOR_PRESETS

export default AudioReactor
