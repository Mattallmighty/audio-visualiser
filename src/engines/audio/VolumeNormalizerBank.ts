/**
 * VolumeNormalizerBank - Multiple VolumeNormalizer instances with different tunings
 *
 * insight: "several different values (at once, all multiplied together)
 * yield the best results." This bank runs multiple normalizers with different window sizes
 * and response curves, then combines them multiplicatively.
 */

import {
  VolumeNormalizer,
  VolumeNormalizerConfig,
  VolumeNormalizerOutput,
} from "./VolumeNormalizer";

export interface VolumeNormalizerBankOutput {
  /** Combined intensity: all normalizer intensities multiplied together */
  combinedIntensity: number;
  /** Combined stream: sum of all normalizer streams (weighted) */
  combinedStream: number;
  /** Fast normalizer output (short window, quick response) */
  fast: VolumeNormalizerOutput;
  /** Medium normalizer output (balanced) */
  medium: VolumeNormalizerOutput;
  /** Slow normalizer output (long window, smooth) */
  slow: VolumeNormalizerOutput;
}

export interface VolumeNormalizerBankConfig {
  fast: Partial<VolumeNormalizerConfig>;
  medium: Partial<VolumeNormalizerConfig>;
  slow: Partial<VolumeNormalizerConfig>;
}

export const BANK_PRESETS: Record<string, VolumeNormalizerBankConfig> = {
  responsive: {
    fast: {
      windowSeconds: 1.5,
      smoothing: 0.7,
      responsePower: 1.5,
      accumulationDivisor: 45,
    },
    medium: {
      windowSeconds: 4,
      smoothing: 0.8,
      responsePower: 2.0,
      accumulationDivisor: 60,
    },
    slow: {
      windowSeconds: 8,
      smoothing: 0.9,
      responsePower: 2.5,
      accumulationDivisor: 90,
    },
  },
  smooth: {
    fast: {
      windowSeconds: 3,
      smoothing: 0.85,
      responsePower: 1.8,
      accumulationDivisor: 60,
    },
    medium: {
      windowSeconds: 6,
      smoothing: 0.9,
      responsePower: 2.2,
      accumulationDivisor: 80,
    },
    slow: {
      windowSeconds: 12,
      smoothing: 0.95,
      responsePower: 3.0,
      accumulationDivisor: 120,
    },
  },
  punchy: {
    fast: {
      windowSeconds: 1,
      smoothing: 0.5,
      responsePower: 1.2,
      accumulationDivisor: 30,
    },
    medium: {
      windowSeconds: 3,
      smoothing: 0.7,
      responsePower: 1.8,
      accumulationDivisor: 50,
    },
    slow: {
      windowSeconds: 7,
      smoothing: 0.85,
      responsePower: 2.5,
      accumulationDivisor: 80,
    },
  },
};

const DEFAULT_BANK_CONFIG = BANK_PRESETS.responsive;

export class VolumeNormalizerBank {
  private fast: VolumeNormalizer;
  private medium: VolumeNormalizer;
  private slow: VolumeNormalizer;

  constructor(config: Partial<VolumeNormalizerBankConfig> = {}) {
    const cfg = { ...DEFAULT_BANK_CONFIG, ...config };
    this.fast = new VolumeNormalizer(cfg.fast);
    this.medium = new VolumeNormalizer(cfg.medium);
    this.slow = new VolumeNormalizer(cfg.slow);
  }

  /**
   * Process a single volume sample through all normalizers.
   * Call once per animation frame.
   */
  process(volume: number): VolumeNormalizerBankOutput {
    const fast = this.fast.process(volume);
    const medium = this.medium.process(volume);
    const slow = this.slow.process(volume);

    // Multiply intensities together for compound responsiveness
    const combinedIntensity =
      fast.intensity * medium.intensity * slow.intensity;

    // Weighted sum of streams (fast dominates for visual pace)
    const combinedStream =
      fast.accumulatedStream * 0.5 +
      medium.accumulatedStream * 0.35 +
      slow.accumulatedStream * 0.15;

    return {
      combinedIntensity,
      combinedStream,
      fast,
      medium,
      slow,
    };
  }

  updateConfig(config: Partial<VolumeNormalizerBankConfig>): void {
    if (config.fast) this.fast.updateConfig(config.fast);
    if (config.medium) this.medium.updateConfig(config.medium);
    if (config.slow) this.slow.updateConfig(config.slow);
  }

  applyPreset(presetName: string): void {
    const preset = BANK_PRESETS[presetName];
    if (preset) {
      this.updateConfig(preset);
    }
  }

  reset(): void {
    this.fast.reset();
    this.medium.reset();
    this.slow.reset();
  }
}
