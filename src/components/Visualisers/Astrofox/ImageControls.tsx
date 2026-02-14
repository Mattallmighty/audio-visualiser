/**
 * Image Layer Controls
 */

import {
  Box,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Slider
} from '@mui/material'
import { Upload, ExpandMore } from '@mui/icons-material'
import type { ImageLayer } from '../../../engines/astrofox/types'

// Stock images available for selection (percentages of screen size)
const STOCK_IMAGES = [
  {
    name: 'LedFx Discord Logo',
    url: 'https://raw.githubusercontent.com/LedFx/LedFx/refs/heads/main/ledfx_assets/discord.png',
    width: 30, // 30% of screen width
    height: 30 // 30% of screen height
  },
  {
    name: 'LedFx Logo',
    url: 'https://raw.githubusercontent.com/LedFx/LedFx/refs/heads/main/ledfx_assets/logo.png',
    width: 30,
    height: 30
  },
  {
    name: 'Abstract Waves',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=400&fit=crop',
    width: 40,
    height: 40
  },
  {
    name: 'Neon Lights',
    url: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=400&fit=crop',
    width: 35,
    height: 35
  },
  {
    name: 'Geometric Pattern',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&h=400&fit=crop',
    width: 50,
    height: 50
  },
  {
    name: 'Sunset Gradient',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    width: 60,
    height: 40
  }
]

export interface ImageControlsProps {
  layer: ImageLayer
  onUpdate: (updates: Partial<ImageLayer>) => void
}

export function ImageControls({ layer, onUpdate }: ImageControlsProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result as string
      onUpdate({ imageData, imageUrl: file.name })
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        IMAGE
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="Image URL"
        value={layer.imageUrl}
        onChange={(e) => onUpdate({ imageUrl: e.target.value })}
        sx={{ mb: 2 }}
      />

      <Box sx={{ mb: 2 }}>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="image-upload-button"
          type="file"
          onChange={handleFileUpload}
        />
        <label htmlFor="image-upload-button">
          <Button
            variant="outlined"
            component="span"
            fullWidth
            startIcon={<Upload />}
            size="small"
          >
            Upload Image
          </Button>
        </label>
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={layer.maintainAspectRatio ?? true}
            onChange={(e) => onUpdate({ maintainAspectRatio: e.target.checked })}
            size="small"
          />
        }
        label="Maintain Aspect Ratio"
        sx={{ mb: 1 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {layer.maintainAspectRatio ?? true
          ? 'Image keeps original proportions'
          : 'Image can be stretched'}
      </Typography>

      <Typography variant="caption" color="text.secondary">
        Width: {layer.width}% of screen
      </Typography>
      <Slider
        value={layer.width}
        onChange={(_, v) => onUpdate({ width: v as number })}
        min={1}
        max={100}
        size="small"
        sx={{ mb: 2 }}
      />

      {!(layer.maintainAspectRatio ?? true) && (
        <>
          <Typography variant="caption" color="text.secondary">
            Height: {layer.height}% of screen
          </Typography>
          <Slider
            value={layer.height}
            onChange={(_, v) => onUpdate({ height: v as number })}
            min={1}
            max={100}
            size="small"
            sx={{ mb: 2 }}
          />
        </>
      )}

      {layer.naturalWidth > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Original: {layer.naturalWidth} × {layer.naturalHeight}px
        </Typography>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={layer.audioReactive}
            onChange={(e) => onUpdate({ audioReactive: e.target.checked })}
            size="small"
          />
        }
        label="Audio Reactive"
        sx={{ mb: 1 }}
      />

      {layer.audioReactive && (
        <>
          <Typography variant="caption" color="text.secondary">
            Reactive Scale: {(layer.reactiveScale ?? 0.15).toFixed(2)}
          </Typography>
          <Slider
            value={layer.reactiveScale ?? 0.15}
            onChange={(_, v) => onUpdate({ reactiveScale: v as number })}
            min={0}
            max={1}
            step={0.01}
            size="small"
            sx={{ mb: 2 }}
          />
        </>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={layer.fixed}
            onChange={(e) => onUpdate({ fixed: e.target.checked })}
            size="small"
          />
        }
        label="Fixed Position"
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        Fixed position ignores transformations
      </Typography>

      {/* Stock Images Accordion */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="body2">Stock Images</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ImageList cols={2} gap={8} sx={{ maxHeight: 300, overflow: 'auto' }}>
            {STOCK_IMAGES.map((stockImg) => (
              <ImageListItem
                key={stockImg.url}
                onClick={() => {
                  // Load image to get natural dimensions
                  const imgElement = new Image()
                  imgElement.onload = () => {
                    onUpdate({
                      imageUrl: stockImg.url,
                      width: stockImg.width,
                      height: stockImg.height,
                      naturalWidth: imgElement.naturalWidth,
                      naturalHeight: imgElement.naturalHeight
                    })
                  }
                  imgElement.src = stockImg.url

                  // Update URL immediately for UI responsiveness
                  onUpdate({
                    imageUrl: stockImg.url,
                    width: stockImg.width,
                    height: stockImg.height
                  })
                }}
                sx={{
                  cursor: 'pointer',
                  border: layer.imageUrl === stockImg.url ? '2px solid' : 'none',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  overflow: 'hidden',
                  '&:hover': { opacity: 0.8 }
                }}
              >
                <img
                  src={stockImg.url}
                  alt={stockImg.name}
                  loading="lazy"
                  style={{ width: '100%', height: 120, objectFit: 'cover' }}
                />
                <ImageListItemBar
                  title={stockImg.name}
                  sx={{
                    '& .MuiImageListItemBar-title': { fontSize: '0.75rem' }
                  }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        </AccordionDetails>
      </Accordion>
    </>
  )
}

export default ImageControls
