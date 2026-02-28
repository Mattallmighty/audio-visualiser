import { getAllVisualizerTypes, type VisualisationType } from '../../engines/webgl/registry'
import { useEffect, useCallback, useRef } from 'react'
import { useStore } from '../../store'
import { useAudio } from '../Audio'

const VISUALIZER_TYPES = getAllVisualizerTypes()

// Calm / energetic classification for better contextual cycling
const CALM_VISUALIZERS = new Set<string>([
  'butterchurn', 'soap', 'terrain', 'noise2d', 'waterfall', 'concentric',
  'auroraborealis', 'spiralgalaxy', 'neonterrain', 'wavemountain',
])
const ENERGETIC_VISUALIZERS = new Set<string>([
  'radial', 'flame', 'digitalrain', 'matrixrain', 'plasma2d', 'equalizer2d',
  'bands', 'hexgrid', 'bladewave', 'frequencyrings', 'fluid', 'geometric',
])

/** Rolling mean helper - keeps the last N values */
class RollingMean {
  private buf: number[]
  private sum = 0
  private idx = 0
  private full = false
  constructor(private n: number) { this.buf = new Array(n).fill(0) }
  push(v: number): number {
    this.sum -= this.buf[this.idx]
    this.buf[this.idx] = v
    this.sum += v
    this.idx = (this.idx + 1) % this.n
    if (this.idx === 0) this.full = true
    return this.sum / (this.full ? this.n : Math.max(1, this.idx))
  }
  get mean() { return this.sum / (this.full ? this.n : Math.max(1, this.idx)) }
}

interface AutoChangeHandlerProps {
  onTypeChange: (type: VisualisationType) => void
}

/**
 * Enhanced auto-change handler with energy-aware cycling:
 * - Mic: triggers on energy surges above rolling average, or buildUp drops
 * - Backend: timer-based every 15 seconds
 * - Chooses visualizers that match current energy level
 */
export const AutoChangeHandler = ({ onTypeChange }: AutoChangeHandlerProps) => {
  const visualType = useStore(state => state.visualType)
  const autoChange = useStore(state => state.autoChange)
  const isPlaying = useStore(state => state.isPlaying)
  const audioSource = useStore(state => state.audioSource)

  const { micData } = useAudio()

  const lastAutoChangeRef = useRef(0)
  const lastBeatChangeRef = useRef(0)
  const prevBeatRef = useRef(false)
  const prevBuildUpPhaseRef = useRef<string>('idle')
  const rollingEnergyRef = useRef(new RollingMean(120)) // ~2s at 60fps

  const triggerChange = useCallback((preferEnergetic: boolean | null = null) => {
    const now = Date.now()
    if (now - lastAutoChangeRef.current < 5000) return

    let pool = VISUALIZER_TYPES.filter(t => t !== 'butterchurn' && t !== 'astrofox' && t !== visualType)

    if (preferEnergetic === true) {
      const energetic = pool.filter(t => ENERGETIC_VISUALIZERS.has(t as string))
      if (energetic.length > 0) pool = energetic
    } else if (preferEnergetic === false) {
      const calm = pool.filter(t => CALM_VISUALIZERS.has(t as string))
      if (calm.length > 0) pool = calm
    }

    const next = pool[Math.floor(Math.random() * pool.length)]
    if (next) {
      onTypeChange(next)
      lastAutoChangeRef.current = now
    }
  }, [visualType, onTypeChange])

  // Mic: energy-surge + buildup-drop detection
  useEffect(() => {
    if (!autoChange || !isPlaying || (audioSource !== 'mic' && audioSource !== 'system')) {
      prevBeatRef.current = false
      return
    }

    const now = Date.now()

    // Update rolling energy
    const rollingMean = rollingEnergyRef.current.push(micData.overall)

    // 1. Trigger on buildup → drop transition
    const currentPhase = micData.buildUpPhase ?? 'idle'
    const prevPhase = prevBuildUpPhaseRef.current
    if (prevPhase === 'buildup' && currentPhase !== 'buildup') {
      // Buildup just ended - great moment to change
      triggerChange(true)
    }
    prevBuildUpPhaseRef.current = currentPhase

    // 2. Trigger on strong energy surge above rolling average
    if (micData.isBeat && !prevBeatRef.current) {
      const energySurge = micData.overall > rollingMean * 1.4 && micData.beatIntensity > 0.6
      const strongBeat = micData.beatIntensity > 0.8
      const debounced = now - lastAutoChangeRef.current >= 5000 && now - lastBeatChangeRef.current > 300

      if ((energySurge || strongBeat) && debounced) {
        lastBeatChangeRef.current = now
        const preferEnergetic = micData.overall > rollingMean * 1.2
        setTimeout(() => triggerChange(preferEnergetic), 0)
      }
    }

    prevBeatRef.current = micData.isBeat
  }, [
    autoChange, isPlaying, audioSource,
    micData.isBeat, micData.beatIntensity, micData.overall, micData.buildUpPhase,
    triggerChange,
  ])

  // Backend: timer-based every 15 seconds
  useEffect(() => {
    if (!autoChange || !isPlaying || audioSource !== 'backend') return

    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastAutoChangeRef.current >= 15000) {
        triggerChange(null)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [autoChange, isPlaying, audioSource, triggerChange])

  return null
}
