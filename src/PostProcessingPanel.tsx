/**
 * PostProcessingPanel - UI controls for post-processing effects
 */

import { useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Switch,
  Slider,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import type { PostProcessingConfig } from './usePostProcessing'

interface PostProcessingPanelProps {
  config: PostProcessingConfig
  onChange: (config: Partial<PostProcessingConfig>) => void
  enabledEffects: string[]
}

export function PostProcessingPanel({
  config,
  onChange,
  enabledEffects
}: PostProcessingPanelProps) {
  const [expanded, setExpanded] = useState<string | false>('bloom')

  const handleAccordionChange = useCallback(
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false)
    },
    []
  )

  const handleEffectToggle = useCallback(
    (effect: keyof PostProcessingConfig) => (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        [effect]: {
          ...config[effect],
          enabled: event.target.checked
        }
      })
    },
    [config, onChange]
  )

  const handleSliderChange = useCallback(
    (effect: keyof PostProcessingConfig, param: string) =>
      (_event: Event, value: number | number[]) => {
        onChange({
          [effect]: {
            ...config[effect],
            [param]: value as number
          }
        })
      },
    [config, onChange]
  )

  return (
    <Box sx={{ width: '100%', maxWidth: 320 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
        <AutoFixHighIcon fontSize="small" />
        <Typography variant="subtitle2">Post-Processing Effects</Typography>
      </Box>

      {/* Bloom */}
      <Accordion
        expanded={expanded === 'bloom'}
        onChange={handleAccordionChange('bloom')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.bloom?.enabled ?? false}
                onChange={handleEffectToggle('bloom')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="Bloom"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Threshold
            </Typography>
            <Slider
              value={config.bloom?.threshold ?? 0.5}
              onChange={handleSliderChange('bloom', 'threshold')}
              min={0}
              max={1}
              step={0.01}
              size="small"
              disabled={!config.bloom?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Intensity
            </Typography>
            <Slider
              value={config.bloom?.intensity ?? 0.5}
              onChange={handleSliderChange('bloom', 'intensity')}
              min={0}
              max={2}
              step={0.1}
              size="small"
              disabled={!config.bloom?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Radius
            </Typography>
            <Slider
              value={config.bloom?.radius ?? 4}
              onChange={handleSliderChange('bloom', 'radius')}
              min={1}
              max={10}
              step={0.5}
              size="small"
              disabled={!config.bloom?.enabled}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Kaleidoscope */}
      <Accordion
        expanded={expanded === 'kaleidoscope'}
        onChange={handleAccordionChange('kaleidoscope')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.kaleidoscope?.enabled ?? false}
                onChange={handleEffectToggle('kaleidoscope')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="Kaleidoscope"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Sides
            </Typography>
            <Slider
              value={config.kaleidoscope?.sides ?? 6}
              onChange={handleSliderChange('kaleidoscope', 'sides')}
              min={2}
              max={20}
              step={1}
              size="small"
              disabled={!config.kaleidoscope?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Angle
            </Typography>
            <Slider
              value={config.kaleidoscope?.angle ?? 0}
              onChange={handleSliderChange('kaleidoscope', 'angle')}
              min={0}
              max={6.28}
              step={0.1}
              size="small"
              disabled={!config.kaleidoscope?.enabled}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* RGB Shift */}
      <Accordion
        expanded={expanded === 'rgbShift'}
        onChange={handleAccordionChange('rgbShift')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.rgbShift?.enabled ?? false}
                onChange={handleEffectToggle('rgbShift')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="RGB Shift"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Amount
            </Typography>
            <Slider
              value={config.rgbShift?.amount ?? 0.01}
              onChange={handleSliderChange('rgbShift', 'amount')}
              min={0}
              max={0.05}
              step={0.001}
              size="small"
              disabled={!config.rgbShift?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Angle
            </Typography>
            <Slider
              value={config.rgbShift?.angle ?? 0}
              onChange={handleSliderChange('rgbShift', 'angle')}
              min={0}
              max={6.28}
              step={0.1}
              size="small"
              disabled={!config.rgbShift?.enabled}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.rgbShift?.radial ?? false}
                  onChange={(e) =>
                    onChange({
                      rgbShift: { ...config.rgbShift, radial: e.target.checked }
                    })
                  }
                  size="small"
                  disabled={!config.rgbShift?.enabled}
                />
              }
              label="Radial"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Glitch */}
      <Accordion
        expanded={expanded === 'glitch'}
        onChange={handleAccordionChange('glitch')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.glitch?.enabled ?? false}
                onChange={handleEffectToggle('glitch')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="Glitch"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Amount
            </Typography>
            <Slider
              value={config.glitch?.amount ?? 0.5}
              onChange={handleSliderChange('glitch', 'amount')}
              min={0}
              max={1}
              step={0.01}
              size="small"
              disabled={!config.glitch?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Speed
            </Typography>
            <Slider
              value={config.glitch?.speed ?? 1}
              onChange={handleSliderChange('glitch', 'speed')}
              min={0.1}
              max={3}
              step={0.1}
              size="small"
              disabled={!config.glitch?.enabled}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* LED */}
      <Accordion
        expanded={expanded === 'led'}
        onChange={handleAccordionChange('led')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.led?.enabled ?? false}
                onChange={handleEffectToggle('led')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="LED Matrix"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Spacing
            </Typography>
            <Slider
              value={config.led?.spacing ?? 10}
              onChange={handleSliderChange('led', 'spacing')}
              min={4}
              max={30}
              step={1}
              size="small"
              disabled={!config.led?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              LED Size
            </Typography>
            <Slider
              value={config.led?.size ?? 6}
              onChange={handleSliderChange('led', 'size')}
              min={2}
              max={config.led?.spacing ?? 10}
              step={0.5}
              size="small"
              disabled={!config.led?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Brightness
            </Typography>
            <Slider
              value={config.led?.brightness ?? 1.2}
              onChange={handleSliderChange('led', 'brightness')}
              min={0.5}
              max={2}
              step={0.1}
              size="small"
              disabled={!config.led?.enabled}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.led?.showGrid ?? false}
                  onChange={(e) =>
                    onChange({
                      led: { ...config.led, showGrid: e.target.checked }
                    })
                  }
                  size="small"
                  disabled={!config.led?.enabled}
                />
              }
              label="Show Grid"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Vignette */}
      <Accordion
        expanded={expanded === 'vignette'}
        onChange={handleAccordionChange('vignette')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.vignette?.enabled ?? false}
                onChange={handleEffectToggle('vignette')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="Vignette"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Radius
            </Typography>
            <Slider
              value={config.vignette?.radius ?? 0.75}
              onChange={handleSliderChange('vignette', 'radius')}
              min={0.1}
              max={1.5}
              step={0.05}
              size="small"
              disabled={!config.vignette?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Softness
            </Typography>
            <Slider
              value={config.vignette?.softness ?? 0.45}
              onChange={handleSliderChange('vignette', 'softness')}
              min={0.01}
              max={1}
              step={0.01}
              size="small"
              disabled={!config.vignette?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Intensity
            </Typography>
            <Slider
              value={config.vignette?.intensity ?? 0.5}
              onChange={handleSliderChange('vignette', 'intensity')}
              min={0}
              max={1}
              step={0.05}
              size="small"
              disabled={!config.vignette?.enabled}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Film Grain */}
      <Accordion
        expanded={expanded === 'filmGrain'}
        onChange={handleAccordionChange('filmGrain')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.filmGrain?.enabled ?? false}
                onChange={handleEffectToggle('filmGrain')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="Film Grain"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Intensity
            </Typography>
            <Slider
              value={config.filmGrain?.intensity ?? 0.15}
              onChange={handleSliderChange('filmGrain', 'intensity')}
              min={0}
              max={0.5}
              step={0.01}
              size="small"
              disabled={!config.filmGrain?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Grain Size
            </Typography>
            <Slider
              value={config.filmGrain?.grainSize ?? 2}
              onChange={handleSliderChange('filmGrain', 'grainSize')}
              min={0.5}
              max={5}
              step={0.5}
              size="small"
              disabled={!config.filmGrain?.enabled}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.filmGrain?.colored ?? false}
                  onChange={(e) =>
                    onChange({
                      filmGrain: { ...config.filmGrain, colored: e.target.checked }
                    })
                  }
                  size="small"
                  disabled={!config.filmGrain?.enabled}
                />
              }
              label="Colored"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* God Rays */}
      <Accordion
        expanded={expanded === 'godRays'}
        onChange={handleAccordionChange('godRays')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.godRays?.enabled ?? false}
                onChange={handleEffectToggle('godRays')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="God Rays"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Light X
            </Typography>
            <Slider
              value={config.godRays?.lightX ?? 0.5}
              onChange={handleSliderChange('godRays', 'lightX')}
              min={0}
              max={1}
              step={0.05}
              size="small"
              disabled={!config.godRays?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Light Y
            </Typography>
            <Slider
              value={config.godRays?.lightY ?? 0.5}
              onChange={handleSliderChange('godRays', 'lightY')}
              min={0}
              max={1}
              step={0.05}
              size="small"
              disabled={!config.godRays?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Intensity
            </Typography>
            <Slider
              value={config.godRays?.intensity ?? 0.5}
              onChange={handleSliderChange('godRays', 'intensity')}
              min={0}
              max={2}
              step={0.1}
              size="small"
              disabled={!config.godRays?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Threshold
            </Typography>
            <Slider
              value={config.godRays?.threshold ?? 0.5}
              onChange={handleSliderChange('godRays', 'threshold')}
              min={0}
              max={1}
              step={0.05}
              size="small"
              disabled={!config.godRays?.enabled}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Pixelate */}
      <Accordion
        expanded={expanded === 'pixelate'}
        onChange={handleAccordionChange('pixelate')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.pixelate?.enabled ?? false}
                onChange={handleEffectToggle('pixelate')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="Pixelate"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Pixel Size
            </Typography>
            <Slider
              value={config.pixelate?.pixelSize ?? 8}
              onChange={handleSliderChange('pixelate', 'pixelSize')}
              min={1}
              max={64}
              step={1}
              size="small"
              disabled={!config.pixelate?.enabled}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.pixelate?.roundPixels ?? true}
                  onChange={(e) =>
                    onChange({
                      pixelate: { ...config.pixelate, roundPixels: e.target.checked }
                    })
                  }
                  size="small"
                  disabled={!config.pixelate?.enabled}
                />
              }
              label="Round Pixels"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Mirror */}
      <Accordion
        expanded={expanded === 'mirror'}
        onChange={handleAccordionChange('mirror')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.mirror?.enabled ?? false}
                onChange={handleEffectToggle('mirror')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="Mirror"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
              <InputLabel>Mode</InputLabel>
              <Select
                value={config.mirror?.mode ?? 'horizontal'}
                label="Mode"
                onChange={(e) =>
                  onChange({
                    mirror: {
                      ...config.mirror,
                      mode: e.target.value as 'horizontal' | 'vertical' | 'quadrant' | 'diagonal'
                    }
                  })
                }
                disabled={!config.mirror?.enabled}
              >
                <MenuItem value="horizontal">Horizontal</MenuItem>
                <MenuItem value="vertical">Vertical</MenuItem>
                <MenuItem value="quadrant">Quadrant</MenuItem>
                <MenuItem value="diagonal">Diagonal</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" gutterBottom>
              Position
            </Typography>
            <Slider
              value={config.mirror?.position ?? 0.5}
              onChange={handleSliderChange('mirror', 'position')}
              min={0}
              max={1}
              step={0.01}
              size="small"
              disabled={!config.mirror?.enabled}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.mirror?.flip ?? false}
                  onChange={(e) =>
                    onChange({
                      mirror: { ...config.mirror, flip: e.target.checked }
                    })
                  }
                  size="small"
                  disabled={!config.mirror?.enabled}
                />
              }
              label="Flip"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Dot Screen */}
      <Accordion
        expanded={expanded === 'dotScreen'}
        onChange={handleAccordionChange('dotScreen')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.dotScreen?.enabled ?? false}
                onChange={handleEffectToggle('dotScreen')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="Dot Screen"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Scale
            </Typography>
            <Slider
              value={config.dotScreen?.scale ?? 1.0}
              onChange={handleSliderChange('dotScreen', 'scale')}
              min={0.1}
              max={5}
              step={0.1}
              size="small"
              disabled={!config.dotScreen?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Angle
            </Typography>
            <Slider
              value={config.dotScreen?.angle ?? 1.57}
              onChange={handleSliderChange('dotScreen', 'angle')}
              min={0}
              max={6.28}
              step={0.1}
              size="small"
              disabled={!config.dotScreen?.enabled}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.dotScreen?.grayscale ?? false}
                  onChange={(e) =>
                    onChange({
                      dotScreen: { ...config.dotScreen, grayscale: e.target.checked }
                    })
                  }
                  size="small"
                  disabled={!config.dotScreen?.enabled}
                />
              }
              label="Grayscale"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.dotScreen?.cmyk ?? false}
                  onChange={(e) =>
                    onChange({
                      dotScreen: { ...config.dotScreen, cmyk: e.target.checked }
                    })
                  }
                  size="small"
                  disabled={!config.dotScreen?.enabled}
                />
              }
              label="CMYK Mode"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Bad TV */}
      <Accordion
        expanded={expanded === 'badTV'}
        onChange={handleAccordionChange('badTV')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FormControlLabel
            control={
              <Switch
                checked={config.badTV?.enabled ?? false}
                onChange={handleEffectToggle('badTV')}
                onClick={(e) => e.stopPropagation()}
                size="small"
              />
            }
            label="Bad TV"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" gutterBottom>
              Distortion
            </Typography>
            <Slider
              value={config.badTV?.distortion ?? 0.1}
              onChange={handleSliderChange('badTV', 'distortion')}
              min={0}
              max={1}
              step={0.01}
              size="small"
              disabled={!config.badTV?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Scanlines
            </Typography>
            <Slider
              value={config.badTV?.scanlineIntensity ?? 0.3}
              onChange={handleSliderChange('badTV', 'scanlineIntensity')}
              min={0}
              max={1}
              step={0.05}
              size="small"
              disabled={!config.badTV?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Static Noise
            </Typography>
            <Slider
              value={config.badTV?.staticNoise ?? 0.1}
              onChange={handleSliderChange('badTV', 'staticNoise')}
              min={0}
              max={1}
              step={0.01}
              size="small"
              disabled={!config.badTV?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              RGB Split
            </Typography>
            <Slider
              value={config.badTV?.rgbSplit ?? 0.5}
              onChange={handleSliderChange('badTV', 'rgbSplit')}
              min={0}
              max={2}
              step={0.1}
              size="small"
              disabled={!config.badTV?.enabled}
            />
            <Typography variant="caption" gutterBottom>
              Roll Speed
            </Typography>
            <Slider
              value={config.badTV?.rollSpeed ?? 0}
              onChange={handleSliderChange('badTV', 'rollSpeed')}
              min={0}
              max={2}
              step={0.1}
              size="small"
              disabled={!config.badTV?.enabled}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Active effects summary */}
      {enabledEffects.length > 0 && (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Active: {enabledEffects.join(' -> ')}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default PostProcessingPanel
