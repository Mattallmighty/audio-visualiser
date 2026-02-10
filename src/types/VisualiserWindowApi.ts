/**
 * Public API exposed via window.visualiserApi for imperative control
 * Methods that require component internals (refs, fullscreen handle) or static registry data
 * 
 * Note: Most state/actions are now available via window.YzAudioVisualiser.useStore
 * This API is kept minimal for methods that need internal component access
 */

export interface VisualiserWindowApi {
  // Butterchurn-specific methods (need butterchurnRef access)
  loadPreset: (index: number) => void
  loadPresetByName: (name: string) => void
  getCurrentPreset: () => { name: string; index: number }
  getPresetNames: () => string[]
  
  // Fullscreen control (needs fullscreenHandle)
  toggleFullscreen: () => void
  
  // Static registry data (no state, just metadata)
  getVisualizerIds: () => string[]
  getVisualizerMetadata: (id: string) => any
  getVisualizerRegistry: () => any
}

// Augment window interface for TypeScript awareness
declare global {
  interface Window {
    visualiserApi?: VisualiserWindowApi
  }
}
