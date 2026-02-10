import type { PostProcessingConfig } from '../../hooks/usePostProcessing'

export interface StorePostProcessingState {
  fxEnabled: boolean
  ppConfig: PostProcessingConfig
  glContext: WebGLRenderingContext | null
  canvasSize: { width: number; height: number }
}

export interface StorePostProcessingActions {
  setFxEnabled: (enabled: boolean) => void
  toggleFx: () => void
  setPpConfig: (config: PostProcessingConfig) => void
  updatePpConfig: (partial: Partial<PostProcessingConfig>) => void
  setGlContext: (context: WebGLRenderingContext | null) => void
  setCanvasSize: (size: { width: number; height: number }) => void
}

const storePostProcessing = (set: any) => ({
  // State
  fxEnabled: false,
  ppConfig: {
    pixelate: { enabled: false, scale: 1, beatSync: false, beatAmount: 0 },
    kaleidoscope: { enabled: true, sides: 6, angle: 0, rotationSpeed: 0.3, beatSync: true, beatAmount: 0.5 },
    bloom: { enabled: true, threshold: 0.3, intensity: 0.8, radius: 5 },
    vignette: { enabled: true, radius: 0.7, softness: 0.5, intensity: 0.5 }
  } as PostProcessingConfig,
  glContext: null as WebGLRenderingContext | null,
  canvasSize: { width: 800, height: 600 },

  // Actions
  setFxEnabled: (enabled: boolean) => set({ fxEnabled: enabled }),
  toggleFx: () => set((state: any) => ({ fxEnabled: !state.fxEnabled })),
  setPpConfig: (config: PostProcessingConfig) => set({ ppConfig: config }),
  updatePpConfig: (partial: Partial<PostProcessingConfig>) => 
    set((state: any) => ({ ppConfig: { ...state.ppConfig, ...partial } })),
  setGlContext: (context: WebGLRenderingContext | null) => set({ glContext: context }),
  setCanvasSize: (size: { width: number; height: number }) => set({ canvasSize: size })
})

export default storePostProcessing
