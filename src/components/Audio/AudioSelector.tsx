import { ToggleButtonGroup, ToggleButton } from '@mui/material'
import { Cloud, Mic, CastConnected } from '@mui/icons-material'

interface AudioSelectorProps {
  hasBackend: boolean
  audioSource: 'backend' | 'mic' | 'system'
  handleSourceChange: (event: React.MouseEvent<HTMLElement>, newSource: 'backend' | 'mic' | 'system' | null) => void
}

const AudioSelector: React.FC<AudioSelectorProps> = ({
  hasBackend,
  audioSource,
  handleSourceChange
}) => {
  // Only show if backend is available
  // if (!hasBackend) return null

  return (
    <ToggleButtonGroup
      value={audioSource}
      exclusive
      onChange={handleSourceChange}
      size="small"
    >
      {hasBackend && <ToggleButton value="backend">
        <Cloud sx={{ mr: 1 }} /> Backend
      </ToggleButton>}
      <ToggleButton value="mic">
        <Mic sx={{ mr: 1 }} /> Mic
      </ToggleButton>
      <ToggleButton value="system">
        <CastConnected sx={{ mr: 1 }} /> System
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export default AudioSelector
