// src/index.ts

// Export main component
export { default } from './VisualiserIso'
export { default as AudioVisualiser } from './VisualiserIso'
export { default as VisualiserIso } from './VisualiserIso'

// Export types
export type { WebGLVisualisationType } from './components/Visualisers'
export type { VisualiserWindowApi } from './types/VisualiserWindowApi'

// Export constants
export { DEFAULT_CONFIGS } from './_generated/webgl/defaults'
export { VISUAL_TO_BACKEND_EFFECT } from './_generated/webgl/backend-mapping'
export { VISUALISER_SCHEMAS } from './_generated/webgl/schemas'
export { ALL_VISUALIZERS_WITH_CATEGORIES } from './engines/webgl/registry'
export { ALL_VISUALIZERS } from './_generated'
export { ALL_WEBGL_VISUALIZERS } from './_generated/webgl'

// Export Zustand store (advanced API)
export { useStore } from './store'
export type { IStore } from './store'

// Export all store types for external consumption
export type {
  StoreVisualizerState,
  StoreVisualizerActions,
  StoreUIState,
  StoreUIActions,
  StorePostProcessingState,
  StorePostProcessingActions,
  StoreConfigsState,
  StoreConfigsActions,
  StoreShaderEditorState,
  StoreShaderEditorActions
} from './store'
