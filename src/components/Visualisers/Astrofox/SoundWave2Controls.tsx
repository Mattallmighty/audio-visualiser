/**
 * Sound Wave 2 Layer Controls
 */

import {
  Box,
  TextField,
  Slider,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import type { SoundWave2Layer } from '../../../engines/astrofox/types'

export interface SoundWave2ControlsProps {
  layer: SoundWave2Layer
  onUpdate: (updates: Partial<SoundWave2Layer>) => void
}

export function SoundWave2Controls({ layer, onUpdate }: SoundWave2ControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        SOUND WAVE 2
      </Typography>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Mode</InputLabel>
        <Select
          value={layer.mode}
          label="Mode"
          onChange={(e: SelectChangeEvent) =>
            onUpdate({ mode: e.target.value as 'circle' | 'line' })
          }
        >
          <MenuItem value="circle">Circle</MenuItem>
          <MenuItem value="line">Line</MenuItem>
        </Select>
      </FormControl>

      {layer.mode === 'circle' && (
        <>
          <Typography variant="caption" color="text.secondary">
            Radius: {layer.radius}
          </Typography>
          <Slider
            value={layer.radius}
            onChange={(_, v) => onUpdate({ radius: v as number })}
            min={50}
            max={300}
            size="small"
            sx={{ mb: 2 }}
          />
        </>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Line Width"
          type="number"
          value={layer.lineWidth}
          onChange={(e) => onUpdate({ lineWidth: Number(e.target.value) })}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          label="Line Color"
          type="color"
          value={layer.lineColor}
          onChange={(e) => onUpdate({ lineColor: e.target.value })}
          sx={{ flex: 1 }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary">
        Sensitivity: {layer.sensitivity.toFixed(1)}
      </Typography>
      <Slider
        value={layer.sensitivity}
        onChange={(_, v) => onUpdate({ sensitivity: v as number })}
        min={0.1}
        max={5}
        step={0.1}
        size="small"
      />
    </>
  )
}

export default SoundWave2Controls
