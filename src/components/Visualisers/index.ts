/**
 * Visualisers Barrel Export
 * 
 * Consolidates all visualizer component exports for cleaner imports.
 */

// WebGL Visualiser (28 frontend shaders + 17 backend effects = 45 total)
export { default as WebGLVisualiser, type WebGLVisualisationType } from './WebGLVisualiser'

// Special Visualisers (with refs/complex state)
export { default as ButterchurnVisualiser, type ButterchurnConfig } from './ButterchurnVisualiser'
export { 
  default as AstrofoxVisualiser, 
  type AstrofoxConfig, 
  type AstrofoxVisualiserRef,
  DEFAULT_ASTROFOX_CONFIG,
  ASTROFOX_PRESETS,
  getAstrofoxPresetLayers
} from './AstrofoxVisualiser'

// Schema-based Visualisers (registry-driven)
export { default as FluidVisualiser } from './FluidVisualiser'
export { default as WaveMountainVisualiser } from './WaveMountainVisualiser'
export { default as BladeWaveVisualizer } from './BladeWaveVisualizer'
export { default as HexGridVisualiser } from './HexGridVisualiser'
export { default as SpiralGalaxyVisualiser } from './SpiralGalaxyVisualiser'
export { default as AuroraBorealisVisualiser } from './AuroraBorealisVisualiser'
export { default as FrequencyRingsVisualiser } from './FrequencyRingsVisualiser'
export { default as NeonTerrainVisualiser } from './NeonTerrainVisualiser'
