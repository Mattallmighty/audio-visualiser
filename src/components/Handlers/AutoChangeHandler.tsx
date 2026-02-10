import { getAllVisualizerTypes, type VisualisationType } from '../../engines/webgl/registry'
import { useEffect, useCallback, useRef } from 'react'
import { useStore } from '../../store'
import { useAudio } from '../Audio'

const VISUALIZER_TYPES = getAllVisualizerTypes()

interface AutoChangeHandlerProps {
  onTypeChange: (type: VisualisationType) => void
}

/**
 * Side-effect component that handles automatic visualizer changes.
 * - For mic: Changes on strong beats (intensity > 0.8, debounced)
 * - For backend: Changes every 15 seconds
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

  const triggerRandomVisual = useCallback(() => {
    // Get all visualizer types (filtered to exclude special cases from random shuffle)
    const types = VISUALIZER_TYPES.filter(type => type !== 'butterchurn' && type !== 'astrofox')
    const nextType = types[Math.floor(Math.random() * types.length)]
    if (nextType !== visualType) {
      onTypeChange(nextType)
      lastAutoChangeRef.current = Date.now()
    }
  }, [visualType, onTypeChange])

  // Auto Change Logic - Beat Detection for Mic
  useEffect(() => {
    if (!autoChange || !isPlaying || audioSource !== 'mic') {
      prevBeatRef.current = false
      return
    }

    // Only trigger on beat edge (false -> true transition)
    if (micData.isBeat && !prevBeatRef.current && micData.beatIntensity > 0.8) {
      const now = Date.now()
      if (now - lastAutoChangeRef.current >= 5000 && now - lastBeatChangeRef.current > 300) {
        lastBeatChangeRef.current = now
        setTimeout(() => triggerRandomVisual(), 0)
      }
    }

    prevBeatRef.current = micData.isBeat
  }, [autoChange, isPlaying, audioSource, micData.isBeat, micData.beatIntensity, triggerRandomVisual])

  // Auto Change Logic - Random Timer for Backend
  useEffect(() => {
    if (!autoChange || !isPlaying || audioSource !== 'backend') return

    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastAutoChangeRef.current >= 15000) {
        // Change every 15 seconds for backend
        triggerRandomVisual()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [autoChange, isPlaying, audioSource, triggerRandomVisual])

  return null
}
