/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react'
import { useStore } from '../../store'
import useAudioAnalyser from '../../engines/audio/useAudioAnalyser'
import { calculateFrequencyBands } from '../../utils/audio'

interface AudioContextValue {
  // Audio data
  activeAudioData: number[] | Float32Array
  beatData?: {
    isBeat: boolean
    beatIntensity: number
    beatPhase: number
    bpm: number
  }
  frequencyBands: {
    bass: number
    mid: number
    high: number
  }
  
  // Mic/analyzer state
  micData: ReturnType<typeof useAudioAnalyser>['data']
  micError: string | null
  isListening: boolean
  
  // Backend state
  hasBackend: boolean
  
  // Actions
  startListening: () => Promise<void>
  stopListening: () => void
  handleSourceChange: (event: React.MouseEvent<HTMLElement>, newSource: 'backend' | 'mic' | null) => void
  getStream: () => MediaStream | null
  tapTempo: () => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

interface AudioProviderProps {
  backendAudioData?: number[]
  children: ReactNode
}

export const AudioProvider = ({ backendAudioData, children }: AudioProviderProps) => {
  const audioSource = useStore(state => state.audioSource)
  const setAudioSource = useStore(state => state.setAudioSource)
  const isPlaying = useStore(state => state.isPlaying)
  const setIsPlaying = useStore(state => state.setIsPlaying)

  // Audio Analyser (Mic)
  const {
    data: micData,
    startListening,
    stopListening,
    isListening,
    error: micError,
    tapTempo,
    getStream
  } = useAudioAnalyser()

  // Check if backend is available
  const hasBackend = backendAudioData !== undefined

  // Detect audio source based on backend availability
  useEffect(() => {
    if (hasBackend && audioSource === 'mic') {
      setAudioSource('backend')
    }
  }, [hasBackend, audioSource, setAudioSource])

  // Auto-start microphone if isPlaying is true on mount
  useEffect(() => {
    if (isPlaying && audioSource === 'mic' && !isListening) {
      startListening().catch(err => {
        console.warn('Auto-start failed (likely due to browser policy):', err)
        setIsPlaying(false) // Revert to paused if auto-start fails
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount

  // Handle Source Switching
  const handleSourceChange = useCallback(
    (event: React.MouseEvent<HTMLElement>, newSource: 'backend' | 'mic' | null) => {
      if (newSource !== null) {
        setAudioSource(newSource)
        if (newSource === 'mic') {
          startListening()
        } else {
          stopListening()
        }
      }
    },
    [setAudioSource, startListening, stopListening]
  )

  // Compute active audio data based on source
  const activeAudioData = audioSource === 'mic' 
    ? micData.normalizedFrequency 
    : (backendAudioData || [])

  // Compute beat data (only available for mic)
  const beatData = audioSource === 'mic'
    ? { 
        isBeat: micData.isBeat, 
        beatIntensity: micData.beatIntensity, 
        beatPhase: micData.beatPhase, 
        bpm: micData.bpm 
      }
    : undefined

  // Compute frequency bands
  const frequencyBands = audioSource === 'mic'
    ? { bass: micData.bass, mid: micData.mid, high: micData.high }
    : calculateFrequencyBands(backendAudioData || [])

  const value: AudioContextValue = {
    activeAudioData,
    beatData,
    frequencyBands,
    micData,
    micError,
    isListening,
    hasBackend,
    startListening,
    stopListening,
    handleSourceChange,
    getStream,
    tapTempo
  }

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    console.error('useAudio must be used within AudioProvider')
    console.error('Current component tree might not include AudioProvider wrapper')
    console.error('Make sure you are importing the default export from the audio-visualiser package')
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}

