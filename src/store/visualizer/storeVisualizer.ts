import type { VisualisationType } from '../../engines/webgl/registry'

export interface StoreVisualizerState {
  visualType: VisualisationType
  audioSource: 'backend' | 'mic' | 'system'
  autoChange: boolean
  isPlaying: boolean
}

export interface StoreVisualizerActions {
  setVisualType: (type: VisualisationType) => void
  setAudioSource: (source: 'backend' | 'mic' | 'system') => void
  setAutoChange: (enabled: boolean) => void
  setIsPlaying: (playing: boolean) => void
  togglePlay: () => void
}

const storeVisualizer = (set: any) => ({
  // State
  visualType: 'butterchurn' as VisualisationType,
  audioSource: 'backend' as 'backend' | 'mic' | 'system',
  autoChange: false,
  isPlaying: true,

  // Actions
  setVisualType: (type: VisualisationType) => set({ visualType: type }),
  setAudioSource: (source: 'backend' | 'mic' | 'system') => set({ audioSource: source }),
  setAutoChange: (enabled: boolean) => set({ autoChange: enabled }),
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
  togglePlay: () => set((state: any) => ({ isPlaying: !state.isPlaying }))
})

export default storeVisualizer
