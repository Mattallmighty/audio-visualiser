/**
 * AudioReactorPanel - UI for configuring audio-to-shader mappings
 */

import { useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Chip,
  Stack
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import { ReactorMode, ReactorConfig, REACTOR_PRESETS, ReactorPresetName } from './audioanalyzer/AudioReactor'

interface ReactorPanelProps {
  configs: Record<string, ReactorConfig>
  onChange: (name: string, config: Partial<ReactorConfig>) => void
  onRemove: (name: string) => void
  onAdd: (name: string, preset?: ReactorPresetName) => void
  audioData?: number[]
}

// Frequency labels for the slider
const FREQUENCY_MARKS = [
  { value: 0, label: 'Bass' },
  { value: 25, label: '' },
  { value: 50, label: 'Mid' },
  { value: 75, label: '' },
  { value: 100, label: 'High' }
]

// Mode descriptions
const MODE_DESCRIPTIONS: Record<ReactorMode, string> = {
  [ReactorMode.ADD]: 'Direct mapping - value increases with audio',
  [ReactorMode.SUBTRACT]: 'Inverted - value decreases with audio',
  [ReactorMode.MULTIPLY]: 'Compound - multiplies against previous',
  [ReactorMode.CYCLE]: 'Accumulative - continuously cycles',
  [ReactorMode.PULSE]: 'Triggered - bursts on threshold'
}

/**
 * Frequency spectrum visualizer mini component
 */
function MiniSpectrum({
  audioData = [],
  startFreq,
  endFreq
}: {
  audioData?: number[]
  startFreq: number
  endFreq: number
}) {
  const barCount = 32
  const bars = []

  for (let i = 0; i < barCount; i++) {
    const idx = Math.floor((i / barCount) * audioData.length)
    const value = audioData[idx] || 0
    const isInRange = i / barCount >= startFreq && i / barCount <= endFreq

    bars.push(
      <Box
        key={i}
        sx={{
          flex: 1,
          bgcolor: isInRange ? 'primary.main' : 'grey.700',
          height: `${Math.max(2, value * 100)}%`,
          minHeight: 2,
          transition: 'height 50ms ease-out',
          opacity: isInRange ? 1 : 0.4
        }}
      />
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        height: 40,
        gap: '1px',
        bgcolor: 'rgba(0,0,0,0.3)',
        p: 0.5,
        borderRadius: 1
      }}
    >
      {bars}
    </Box>
  )
}

/**
 * Single reactor configuration UI
 */
function ReactorConfigUI({
  name,
  config,
  onChange,
  onRemove,
  audioData
}: {
  name: string
  config: ReactorConfig
  onChange: (config: Partial<ReactorConfig>) => void
  onRemove: () => void
  audioData?: number[]
}) {
  return (
    <Accordion sx={{ bgcolor: 'background.paper' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <GraphicEqIcon fontSize="small" color="primary" />
          <Typography sx={{ flex: 1 }}>{name}</Typography>
          <Chip
            label={config.mode}
            size="small"
            color={config.mode === ReactorMode.PULSE ? 'secondary' : 'primary'}
            variant="outlined"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {/* Mini spectrum with selection */}
          <MiniSpectrum
            audioData={audioData}
            startFreq={config.startFreq}
            endFreq={config.endFreq}
          />

          {/* Frequency range selector */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Frequency Range
            </Typography>
            <Slider
              value={[config.startFreq * 100, config.endFreq * 100]}
              onChange={(_, value) => {
                const [start, end] = value as number[]
                onChange({ startFreq: start / 100, endFreq: end / 100 })
              }}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}%`}
              marks={FREQUENCY_MARKS}
              min={0}
              max={100}
              size="small"
            />
          </Box>

          {/* Output mode */}
          <FormControl fullWidth size="small">
            <InputLabel>Mode</InputLabel>
            <Select
              value={config.mode}
              label="Mode"
              onChange={(e) => onChange({ mode: e.target.value as ReactorMode })}
            >
              {Object.values(ReactorMode).map((mode) => (
                <MenuItem key={mode} value={mode}>
                  <Box>
                    <Typography variant="body2">{mode}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {MODE_DESCRIPTIONS[mode]}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Sensitivity */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Sensitivity: {config.sensitivity.toFixed(1)}
            </Typography>
            <Slider
              value={config.sensitivity}
              min={0.1}
              max={5.0}
              step={0.1}
              onChange={(_, value) => onChange({ sensitivity: value as number })}
              size="small"
            />
          </Box>

          {/* Smoothing */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Smoothing: {config.smoothing.toFixed(2)}
            </Typography>
            <Slider
              value={config.smoothing}
              min={0}
              max={0.99}
              step={0.01}
              onChange={(_, value) => onChange({ smoothing: value as number })}
              size="small"
            />
          </Box>

          {/* Output range */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Output Range: {config.minValue.toFixed(2)} - {config.maxValue.toFixed(2)}
            </Typography>
            <Slider
              value={[config.minValue, config.maxValue]}
              min={0}
              max={2}
              step={0.01}
              onChange={(_, value) => {
                const [min, max] = value as number[]
                onChange({ minValue: min, maxValue: max })
              }}
              size="small"
            />
          </Box>

          {/* Pulse mode specific settings */}
          {config.mode === ReactorMode.PULSE && (
            <>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Threshold: {(config.threshold || 0.5).toFixed(2)}
                </Typography>
                <Slider
                  value={config.threshold || 0.5}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  onChange={(_, value) => onChange({ threshold: value as number })}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Decay Rate: {(config.decayRate || 0.95).toFixed(2)}
                </Typography>
                <Slider
                  value={config.decayRate || 0.95}
                  min={0.8}
                  max={0.99}
                  step={0.01}
                  onChange={(_, value) => onChange({ decayRate: value as number })}
                  size="small"
                />
              </Box>
            </>
          )}

          {/* Remove button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton size="small" color="error" onClick={onRemove}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}

/**
 * Main AudioReactorPanel component
 */
export function AudioReactorPanel({
  configs,
  onChange,
  onRemove,
  onAdd,
  audioData
}: ReactorPanelProps) {
  const [showPresets, setShowPresets] = useState(false)

  const handleAddPreset = useCallback(
    (presetName: ReactorPresetName) => {
      const baseName = presetName.replace(/([A-Z])/g, ' $1').trim()
      let name = baseName
      let counter = 1
      while (configs[name]) {
        name = `${baseName} ${counter++}`
      }
      onAdd(name, presetName)
      setShowPresets(false)
    },
    [configs, onAdd]
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <GraphicEqIcon sx={{ mr: 1 }} color="primary" />
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          Audio Reactors
        </Typography>
        <IconButton size="small" onClick={() => setShowPresets(!showPresets)} color="primary">
          <AddIcon />
        </IconButton>
      </Box>

      {/* Preset selector */}
      {showPresets && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Add from preset:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {Object.keys(REACTOR_PRESETS).map((preset) => (
              <Chip
                key={preset}
                label={preset.replace(/([A-Z])/g, ' $1').trim()}
                onClick={() => handleAddPreset(preset as ReactorPresetName)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Reactor list */}
      {Object.entries(configs).length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No reactors configured. Click + to add one.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {Object.entries(configs).map(([name, config]) => (
            <ReactorConfigUI
              key={name}
              name={name}
              config={config}
              onChange={(newConfig) => onChange(name, newConfig)}
              onRemove={() => onRemove(name)}
              audioData={audioData}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}

export default AudioReactorPanel
