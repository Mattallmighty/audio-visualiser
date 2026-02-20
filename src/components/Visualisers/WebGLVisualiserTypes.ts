import type { Theme } from '@mui/material/styles'
import type { WebGLVisualiserId } from '../../_generated/webgl'

export type WebGLVisualisationType = WebGLVisualiserId

export interface PostProcessingControls {
  getInputFramebuffer: () => WebGLFramebuffer | null
  render: (width?: number, height?: number) => void
  updateTime: (deltaTime: number, beatData?: { isBeat: boolean; beatPhase: number; beatIntensity: number }) => void
}

export interface WebGLVisualiserProps {
  audioData: number[] | Float32Array
  isPlaying: boolean
  visualType: WebGLVisualisationType
  config: Record<string, any>
  customShader?: string
  beatData?: {
    isBeat: boolean
    beatIntensity: number
    beatPhase: number
    bpm: number
  }
  frequencyBands?: {
    bass: number
    mid: number
    high: number
  }
  theme: Theme
  postProcessing?: PostProcessingControls
  postProcessingEnabled?: boolean
  onContextCreated?: (gl: WebGLRenderingContext, canvas: HTMLCanvasElement) => void
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  amplitude: number
  index: number
}

export const MAX_PARTICLES = 2000
