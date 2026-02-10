import type { Theme } from "@mui/material"

export interface VisualiserIsoProps {
  theme: Theme
  effects?: any
  backendAudioData?: number[]
  ConfigFormComponent?: React.ComponentType<any>
  configData?: any
  onClose?: () => void
}