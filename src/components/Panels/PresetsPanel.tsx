import React from 'react'
import { Card, CardContent, Typography, Stack, Button, Divider, Grid } from '@mui/material'
import { type WebGLVisualisationType } from '../Visualisers'
import { AudioStatsPanel } from '../Audio'
import { useStore } from '../../store'

interface PresetsPanelProps {
  handleTypeChange: (type: WebGLVisualisationType) => void
  handleResetAll: () => void
  micData: any
  tapTempo: () => void
}

const PresetsPanel: React.FC<PresetsPanelProps> = ({
  handleTypeChange,
  handleResetAll,
  micData,
  tapTempo
}) => {
  const visualType = useStore(state => state.visualType)
  const audioSource = useStore(state => state.audioSource)
  
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
          <Typography variant="h6" gutterBottom>
            Presets
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Quickly switch between different moods.
          </Typography>

          <Stack spacing={2}>
            <Button onClick={() => handleTypeChange(visualType as WebGLVisualisationType)} variant="outlined" fullWidth>
              DEFAULT
            </Button>
          </Stack>

          <AudioStatsPanel audioSource={audioSource} micData={micData} tapTempo={tapTempo} />

          <Divider sx={{ my: 2 }} />
          <Button
            onClick={handleResetAll}
            variant="text"
            color="error"
            size="small"
            fullWidth
            sx={{ opacity: 0.7 }}
          >
            Reset All Data
          </Button>
        </CardContent>
      </Card>
  )
}

export default PresetsPanel
