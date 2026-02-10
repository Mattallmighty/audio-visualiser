import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material'
import { Mic } from '@mui/icons-material'

interface AudioInputSelectorProps {
  audioDevices: MediaDeviceInfo[]
  selectedDeviceId: string
  onDeviceChange: (deviceId: string) => void
  disabled?: boolean
}

const AudioInputSelector: React.FC<AudioInputSelectorProps> = ({
  audioDevices,
  selectedDeviceId,
  onDeviceChange,
  disabled = false
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onDeviceChange(event.target.value)
  }

  // Clean device label by removing bracketed text unless it's "(Bluetooth)"
  const cleanDeviceLabel = (label: string) => {
    if (!label) return label
    // Keep (Bluetooth) but remove other bracketed text
    if (label.includes('(Bluetooth)')) return label
    // Remove any other bracketed text
    return label.replace(/\s*\([^)]*\)\s*$/, '').trim()
  }

  // Don't show if no devices available
  if (audioDevices.length === 0) return null

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel id="audio-input-label">
        <Mic sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
        Audio Input
      </InputLabel>
      <Select
        labelId="audio-input-label"
        id="audio-input-select"
        value={selectedDeviceId}
        label="Audio Input"
        onChange={handleChange}
        disabled={disabled}
      >
        {audioDevices.map((device) => (
          <MenuItem key={device.deviceId} value={device.deviceId}>
            {cleanDeviceLabel(device.label) || `Microphone ${device.deviceId.slice(0, 8)}...`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default AudioInputSelector
