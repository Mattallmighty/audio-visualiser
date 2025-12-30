import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Theme,
  ThemeProvider,
  createTheme,
  LinearProgress,
  Snackbar,
  Alert,
  Divider
} from '@mui/material'
import {
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Pause,
  Code,
  Mic,
  Cloud,
  AutoAwesome,
  MusicNote,
  AutoFixHigh
} from '@mui/icons-material'
import { FullScreen, useFullScreenHandle } from 'react-full-screen'
import WebGLVisualiser, { WebGLVisualisationType } from './WebGLVisualiser'
import ButterchurnVisualiser, { ButterchurnConfig } from './ButterchurnVisualiser'
import AstrofoxVisualiser, { AstrofoxConfig, DEFAULT_ASTROFOX_CONFIG, ASTROFOX_PRESETS, getAstrofoxPresetLayers, AstrofoxVisualiserRef } from './AstrofoxVisualiser'
import { gifFragmentShader } from './shaders'
import useAudioAnalyser from './audioanalyzer/useAudioAnalyser'
import {
  DEFAULT_CONFIGS,
  orderEffectProperties,
  VISUAL_TO_BACKEND_EFFECT,
  VISUALISER_SCHEMAS
} from './visualizerConstants'
import SimpleConfigForm from './SimpleConfigForm'
import { usePostProcessing, PostProcessingConfig } from './usePostProcessing'
import { PostProcessingPanel } from './PostProcessingPanel'

interface VisualiserIsoProps {
  theme: Theme
  effects?: any
  backendAudioData?: number[]
  ConfigFormComponent?: React.ComponentType<any>
  onClose?: () => void
}

const STORAGE_KEY = 'visualiser_state_v1'

const VisualiserIso = ({
  theme,
  effects,
  backendAudioData,
  ConfigFormComponent,
  onClose
}: VisualiserIsoProps) => {
  const fullscreenHandle = useFullScreenHandle()

  // Check if backend is available
  const hasBackend = backendAudioData !== undefined

  // Load saved state from localStorage
  const getSavedState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      console.warn('Failed to load state from localStorage', e)
      return null
    }
  }, [])

  const savedState = getSavedState()

  // Audio Analyser (Mic)
  const {
    data: micData,
    startListening,
    stopListening,
    isListening,
    error: micError,
    tapTempo,
    getStream
  } = useAudioAnalyser()

  // Local state
  const [isPlaying, setIsPlaying] = useState(true) // Default to playing for auto-start
  const [fullScreen, setFullScreen] = useState(false)
  const [visualType, setVisualType] = useState<WebGLVisualisationType>(savedState?.visualType || 'gif')
  
  // Store custom configs for ALL visualiser types in one object
  const [allConfigs, setAllConfigs] = useState<Record<string, any>>(() => {
    const initial = { ...DEFAULT_CONFIGS }
    if (savedState?.allConfigs) {
      Object.assign(initial, savedState.allConfigs)
    } else if (savedState?.savedConfigs) {
      Object.assign(initial, savedState.savedConfigs)
    }
    return initial
  })

  // Audio source state
  const [audioSource, setAudioSource] = useState<'backend' | 'mic'>(hasBackend ? 'backend' : 'mic')
  const [autoChange, setAutoChange] = useState(false)

  // Shader Editor State
  const [showCode, setShowCode] = useState(false)
  const [shaderCode, setShaderCode] = useState(gifFragmentShader)
  const [activeCustomShader, setActiveCustomShader] = useState<string | undefined>(undefined)

  // Post-processing state - FX enabled by default with nice defaults
  const [fxEnabled, setFxEnabled] = useState(savedState?.fxEnabled ?? false)
  const [showFxPanel, setShowFxPanel] = useState(false)
  const [glContext, setGlContext] = useState<WebGLRenderingContext | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [ppConfig, setPpConfig] = useState<PostProcessingConfig>(savedState?.ppConfig || {
    // Default: Kaleidoscope with smooth rotation, bloom, and vignette
    kaleidoscope: { enabled: true, sides: 6, angle: 0, rotationSpeed: 0.3, beatSync: true, beatAmount: 0.5 },
    bloom: { enabled: true, threshold: 0.3, intensity: 0.8, radius: 5 },
    vignette: { enabled: true, radius: 0.7, softness: 0.5, intensity: 0.5 }
  })

  // Butterchurn state
  const [butterchurnConfig, setButterchurnConfig] = useState<ButterchurnConfig>(savedState?.butterchurnConfig || {
    cycleInterval: 25,
    blendTime: 2.7,
    shufflePresets: false,
    currentPresetIndex: 0
  })

  // Astrofox state
  const [astrofoxConfig, setAstrofoxConfig] = useState<AstrofoxConfig>(savedState?.astrofoxConfig || DEFAULT_ASTROFOX_CONFIG)
  const [astrofoxReady, setAstrofoxReady] = useState(false)

  const [saveError, setSaveError] = useState<string | null>(null)

  // Save state to localStorage
  useEffect(() => {
    const stateToSave = {
      visualType,
      allConfigs,
      fxEnabled,
      ppConfig,
      butterchurnConfig,
      astrofoxConfig
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      setSaveError(null)
    } catch (e: any) {
      console.warn('Failed to save state to localStorage', e)
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        setSaveError('Storage full! Some images may be too large to save.')
      }
    }
  }, [visualType, allConfigs, fxEnabled, ppConfig, butterchurnConfig, astrofoxConfig])

  // Post-processing hook
  const [ppState, ppControls] = usePostProcessing(
    fxEnabled ? glContext : null,
    canvasSize.width,
    canvasSize.height
  )

  // Auto-start microphone if isPlaying is true on mount
  useEffect(() => {
    if (isPlaying && audioSource === 'mic' && !isListening) {
      startListening().catch(err => {
        console.warn('Auto-start failed (likely due to browser policy):', err)
        setIsPlaying(false) // Revert to paused if auto-start fails
      })
    }
  }, []) // Run once on mount

  // Handle WebGL context creation - only update if context actually changed
  const glContextRef = useRef<WebGLRenderingContext | null>(null)
  const astrofoxRef = useRef<AstrofoxVisualiserRef>(null)
  const handleContextCreated = useCallback(
    (gl: WebGLRenderingContext, canvas: HTMLCanvasElement) => {
      // Only update state if context has actually changed
      if (glContextRef.current !== gl) {
        glContextRef.current = gl
        setGlContext(gl)
        setCanvasSize({ width: canvas.width, height: canvas.height })
      }
    },
    []
  )

  // Apply post-processing config when it changes
  const ppControlsRef = useRef(ppControls)
  ppControlsRef.current = ppControls

  useEffect(() => {
    if (ppState.isInitialized) {
      ppControlsRef.current.setConfig(ppConfig)
    }
  }, [ppConfig, ppState.isInitialized])

  // Track when Astrofox ref is ready for rendering controls
  useEffect(() => {
    if (visualType === 'astrofox') {
      // Small delay to ensure ref is assigned after render
      const timer = setTimeout(() => setAstrofoxReady(true), 50)
      return () => clearTimeout(timer)
    } else {
      setAstrofoxReady(false)
    }
  }, [visualType])

  // Note: Auto-starting microphone is not possible - browsers require user gesture
  // The user must click "Play" or the mic toggle to start microphone input

  const lastAutoChangeRef = useRef(0)

  // Handle Source Switching
  const handleSourceChange = (
    event: React.MouseEvent<HTMLElement>,
    newSource: 'backend' | 'mic' | null
  ) => {
    if (newSource !== null) {
      setAudioSource(newSource)
      if (newSource === 'mic') {
        startListening()
      } else {
        stopListening()
      }
    }
  }

  const handleEffectConfig = (newConfig: any) => {
    setAllConfigs((prev) => ({
      ...prev,
      [visualType]: { ...prev[visualType], ...newConfig }
    }))
  }

  const handleTypeChange = useCallback(
    (type: WebGLVisualisationType) => {
      setVisualType(type)
      setActiveCustomShader(undefined)
      setShowCode(false)
    },
    []
  )

  const handleApplyShader = () => {
    setActiveCustomShader(shaderCode)
  }

  const handleReset = () => {
    if (visualType === 'butterchurn') {
      setButterchurnConfig({
        cycleInterval: 25,
        blendTime: 2.7,
        shufflePresets: false,
        currentPresetIndex: 0
      })
    } else if (visualType === 'astrofox') {
      setAstrofoxConfig(DEFAULT_ASTROFOX_CONFIG)
    } else {
      setAllConfigs(prev => ({
        ...prev,
        [visualType]: DEFAULT_CONFIGS[visualType] || {}
      }))
    }
  }

  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset ALL settings and visualisers to default? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY)
      window.location.reload()
    }
  }

  const activeAudioData = audioSource === 'mic' ? micData.normalizedFrequency : (backendAudioData || [])
  const config = allConfigs[visualType] || {}
  const beatData =
    audioSource === 'mic'
      ? { isBeat: micData.isBeat, beatIntensity: micData.beatIntensity, beatPhase: micData.beatPhase, bpm: micData.bpm }
      : undefined

  // Calculate frequency bands from backend audio data
  const calculateFrequencyBands = useCallback(
    (data: number[]): { bass: number; mid: number; high: number } => {
      if (data.length === 0) return { bass: 0, mid: 0, high: 0 }

      const len = data.length
      const bassEnd = Math.floor(len * 0.1) // ~0-10% = bass
      const midEnd = Math.floor(len * 0.5) // ~10-50% = mids
      // ~50-100% = highs

      let bassSum = 0
      let midSum = 0
      let highSum = 0
      for (let i = 0; i < len; i++) {
        if (i < bassEnd) {
          bassSum += data[i]
        } else if (i < midEnd) {
          midSum += data[i]
        } else {
          highSum += data[i]
        }
      }

      return {
        bass: bassEnd > 0 ? bassSum / bassEnd : 0,
        mid: midEnd - bassEnd > 0 ? midSum / (midEnd - bassEnd) : 0,
        high: len - midEnd > 0 ? highSum / (len - midEnd) : 0
      }
    },
    []
  )

  const frequencyBands =
    audioSource === 'mic'
      ? { bass: micData.bass, mid: micData.mid, high: micData.high }
      : calculateFrequencyBands(backendAudioData || [])

  const triggerRandomVisual = useCallback(() => {
    const types: WebGLVisualisationType[] = [
      // Original Effects
      'gif',
      'matrix',
      'terrain',
      'geometric',
      'concentric',
      'particles',
      'bars3d',
      'radial3d',
      'waveform3d',
      'bleep',
      // 2D Effects
      'bands',
      'bandsmatrix',
      'blocks',
      'equalizer2d',
      // Matrix Effects
      'blender',
      'clone',
      'digitalrain',
      'flame',
      'gameoflife',
      'image',
      'keybeat2d',
      'noise2d',
      'plasma2d',
      'plasmawled2d',
      'radial',
      'soap',
      'texter',
      'waterfall'
    ]
    const nextType = types[Math.floor(Math.random() * types.length)]
    if (nextType !== visualType) {
      handleTypeChange(nextType)
      lastAutoChangeRef.current = Date.now()
    }
  }, [visualType, handleTypeChange])

  // Auto Change Logic - Beat Detection for Mic
  const lastBeatChangeRef = useRef(0)
  const prevBeatRef = useRef(false)

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

  // Create or use provided theme
  const activeTheme = theme || createTheme({ palette: { mode: 'dark' } })

  return (
    <ThemeProvider theme={activeTheme}>
      <Grid
        container
        spacing={2}
        sx={{
          justifyContent: 'center',
          paddingTop: '1rem',
          width: '100%',
          maxWidth: '1600px',
          margin: '0 auto'
        }}
      >
        {/* Top Row: Visualiser (Full Width) */}
        <Grid size={{ xs: 12 }} key="visualiser-canvas">
        <Card variant="outlined" sx={{ '& > .MuiCardContent-root': { pb: '0.25rem' } }}>
          <CardContent>
            {/* Header / Controls */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                gap: 2
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MusicNote /> Audio Visualiser
                  {onClose && (
                    <IconButton onClick={onClose} size="small" sx={{ ml: 'auto' }}>
                      <FullscreenExit />
                    </IconButton>
                  )}
                </Typography>
                <Typography variant="body2" color={micError ? 'error' : 'textSecondary'}>
                  {audioSource === 'mic'
                    ? micError
                      ? `Error: ${micError}`
                      : isListening
                        ? `Listening (BPM: ${micData.bpm})`
                        : 'Microphone Inactive'
                    : (backendAudioData && backendAudioData.length > 0)
                      ? 'Receiving Backend Audio'
                      : 'Waiting for Backend Audio'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Visualization</InputLabel>
                  <Select
                    value={visualType}
                    label="Visualization"
                    onChange={(e) => handleTypeChange(e.target.value as WebGLVisualisationType)}
                  >
                    <MenuItem disabled sx={{ opacity: 0.5, fontSize: '0.75rem' }}>
                      Original Effects
                    </MenuItem>
                    <MenuItem value="gif">Kaleidoscope</MenuItem>
                    <MenuItem value="matrix">Matrix Rain</MenuItem>
                    <MenuItem value="terrain">Synthwave Terrain</MenuItem>
                    <MenuItem value="geometric">Geometric Pulse</MenuItem>
                    <MenuItem value="concentric">Concentric Rings</MenuItem>
                    <MenuItem value="particles">Particles</MenuItem>
                    <MenuItem value="bars3d">Spectrum Bars</MenuItem>
                    <MenuItem value="radial3d">Radial Spectrum</MenuItem>
                    <MenuItem value="waveform3d">Waveform</MenuItem>
                    <MenuItem value="bleep">Oscilloscope</MenuItem>
                    <MenuItem disabled sx={{ opacity: 0.5, fontSize: '0.75rem', mt: 1 }}>
                      2D Effects
                    </MenuItem>
                    <MenuItem value="bands">Bands</MenuItem>
                    <MenuItem value="bandsmatrix">Bands Matrix</MenuItem>
                    <MenuItem value="blocks">Blocks</MenuItem>
                    <MenuItem value="equalizer2d">Equalizer 2D</MenuItem>
                    <MenuItem disabled sx={{ opacity: 0.5, fontSize: '0.75rem', mt: 1 }}>
                      Matrix Effects
                    </MenuItem>
                    <MenuItem value="blender">Blender</MenuItem>
                    <MenuItem value="clone">Clone</MenuItem>
                    <MenuItem value="digitalrain">Digital Rain</MenuItem>
                    <MenuItem value="flame">Flame</MenuItem>
                    <MenuItem value="gameoflife">Game of Life</MenuItem>
                    <MenuItem value="image">Image</MenuItem>
                    <MenuItem value="keybeat2d">Keybeat 2D</MenuItem>
                    <MenuItem value="noise2d">Noise</MenuItem>
                    <MenuItem value="plasma2d">Plasma 2D</MenuItem>
                    <MenuItem value="plasmawled2d">Plasma WLED</MenuItem>
                    <MenuItem value="radial">Radial</MenuItem>
                    <MenuItem value="soap">Soap</MenuItem>
                    <MenuItem value="texter">Texter</MenuItem>
                    <MenuItem value="waterfall">Waterfall</MenuItem>
                    <MenuItem disabled sx={{ opacity: 0.5, fontSize: '0.75rem', mt: 1 }}>
                      Milkdrop
                    </MenuItem>
                    <MenuItem value="butterchurn">Butterchurn (Milkdrop)</MenuItem>
                    <MenuItem disabled sx={{ opacity: 0.5, fontSize: '0.75rem', mt: 1 }}>
                      Layer-Based
                    </MenuItem>
                    <MenuItem value="astrofox">Astrofox (Layers)</MenuItem>
                  </Select>
                </FormControl>

                {/* Only show audio source toggle if backend is available */}
                {hasBackend && (
                  <ToggleButtonGroup
                    value={audioSource}
                    exclusive
                    onChange={handleSourceChange}
                    size="small"
                  >
                    <ToggleButton value="backend">
                      <Cloud sx={{ mr: 1 }} /> Backend
                    </ToggleButton>
                    <ToggleButton value="mic">
                      <Mic sx={{ mr: 1 }} /> Mic
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}

                <Tooltip title="Auto-change visuals on beat">
                  <ToggleButton
                    value="auto"
                    selected={autoChange}
                    onChange={() => setAutoChange(!autoChange)}
                    size="small"
                    color="primary"
                  >
                    <AutoAwesome sx={{ mr: 1 }} /> Auto
                  </ToggleButton>
                </Tooltip>

                <Tooltip title="Post-processing effects">
                  <ToggleButton
                    value="fx"
                    selected={fxEnabled}
                    onChange={() => {
                      const newValue = !fxEnabled
                      setFxEnabled(newValue)
                      // Auto-show panel when enabling FX
                      if (newValue && !showFxPanel) {
                        setShowFxPanel(true)
                      }
                    }}
                    size="small"
                    color="secondary"
                  >
                    <AutoFixHigh sx={{ mr: 1 }} /> FX
                  </ToggleButton>
                </Tooltip>

                <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
                  <Button
                    onClick={() => {
                      const newPlayingState = !isPlaying
                      setIsPlaying(newPlayingState)
                      
                      // In standalone mic mode, control mic listening based on playing state
                      if (!hasBackend && audioSource === 'mic') {
                        if (newPlayingState) {
                          startListening()
                        } else {
                          stopListening()
                        }
                      }
                    }}
                    variant="outlined"
                    color="inherit"
                    sx={{ minWidth: '40px' }}
                  >
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </Button>
                </Tooltip>
                <Tooltip title="Fullscreen">
                  <Button
                    onClick={fullscreenHandle.enter}
                    variant="outlined"
                    color="inherit"
                    sx={{ minWidth: '40px' }}
                  >
                    <Fullscreen />
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            {/* Canvas Area */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '60vh',
                minHeight: '400px',
                bgcolor: 'black',
                borderRadius: 1,
                overflow: 'hidden',
                '& .fullscreen-wrapper': { width: '100%', height: '100%' }
              }}
            >
              <FullScreen
                handle={fullscreenHandle}
                onChange={setFullScreen}
                className="fullscreen-wrapper"
              >
                <Box
                  sx={{
                    width: fullScreen ? '100vw' : '100%',
                    height: fullScreen ? '100vh' : '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'black'
                  }}
                  onDoubleClick={fullScreen ? fullscreenHandle.exit : fullscreenHandle.enter}
                >
                  {visualType === 'butterchurn' ? (
                    <ButterchurnVisualiser
                      audioData={activeAudioData}
                      isPlaying={isPlaying}
                      config={butterchurnConfig}
                      onConfigChange={(update) =>
                        setButterchurnConfig((prev) => ({ ...prev, ...update }))
                      }
                      showControls={true}
                      audioStream={audioSource === 'mic' ? getStream() : undefined}
                    />
                  ) : visualType === 'astrofox' ? (
                    <AstrofoxVisualiser
                      ref={astrofoxRef}
                      audioData={activeAudioData}
                      isPlaying={isPlaying}
                      config={astrofoxConfig}
                      onConfigChange={(update) =>
                        setAstrofoxConfig((prev) => ({ ...prev, ...update }))
                      }
                      frequencyBands={frequencyBands}
                      beatData={beatData}
                    />
                  ) : (
                    <WebGLVisualiser
                      theme={theme}
                      audioData={activeAudioData}
                      isPlaying={isPlaying}
                      visualType={visualType}
                      config={config}
                      customShader={activeCustomShader}
                      beatData={beatData}
                      frequencyBands={frequencyBands}
                      onContextCreated={handleContextCreated}
                      postProcessing={ppControls}
                      postProcessingEnabled={fxEnabled && ppState.isInitialized}
                    />
                  )}

                  {/* Debug Overlay */}
                  {config.developer_mode && audioSource === 'mic' && (
                    <Paper
                      sx={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        p: 2,
                        width: 250,
                        bgcolor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        zIndex: 10
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom sx={{ color: '#4fc3f7' }}>
                        Audio Debug
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            <TableRow key="bpm">
                              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                                BPM
                              </TableCell>
                              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                                {micData.bpm}
                              </TableCell>
                            </TableRow>
                            <TableRow key="confidence">
                              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                                Confidence
                              </TableCell>
                              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                                {(micData.confidence * 100).toFixed(0)}%
                              </TableCell>
                            </TableRow>
                            <TableRow key="volume">
                              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                                Vol (RMS)
                              </TableCell>
                              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                                {micData.overall.toFixed(3)}
                              </TableCell>
                            </TableRow>
                            <TableRow key="bass">
                              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                                Bass
                              </TableCell>
                              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                                {micData.bass.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow key="mid">
                              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                                Mid
                              </TableCell>
                              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                                {micData.mid.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow key="high">
                              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                                High
                              </TableCell>
                              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                                {micData.high.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow key="brightness">
                              <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                                Brightness
                              </TableCell>
                              <TableCell sx={{ color: 'white', borderBottom: '1px solid #333' }}>
                                {micData.spectralCentroid.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            <TableRow key="noisiness">
                              <TableCell sx={{ color: '#aaa', borderBottom: 'none' }}>
                                Noisiness
                              </TableCell>
                              <TableCell sx={{ color: 'white', borderBottom: 'none' }}>
                                {micData.spectralFlatness.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {micData.isBeat && (
                        <Box
                          sx={{
                            mt: 1,
                            height: 4,
                            width: '100%',
                            bgcolor: '#4fc3f7',
                            boxShadow: '0 0 10px #4fc3f7'
                          }}
                        />
                      )}
                    </Paper>
                  )}

                  {fullScreen && (
                    <Box sx={{ position: 'absolute', bottom: 20, left: 20 }}>
                      <IconButton
                        onClick={fullscreenHandle.exit}
                        sx={{
                          color: 'white',
                          bgcolor: 'rgba(0,0,0,0.5)',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                        }}
                      >
                        <FullscreenExit />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </FullScreen>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Bottom Row */}
      <Grid size={{ xs: 12, md: 8 }} key="config-panel">
        {/* Effect Configuration OR Shader Editor */}
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
            >
              <Typography variant="h6">Configuration</Typography>
              <Box>
                <Tooltip title="Reset to Defaults">
                  <Button size="small" onClick={handleReset} sx={{ mr: 1 }}>
                    Reset
                  </Button>
                </Tooltip>
                <Tooltip title="Edit Shader">
                  <IconButton
                    onClick={() => setShowCode(!showCode)}
                    color={showCode ? 'primary' : 'default'}
                  >
                    <Code />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {showCode ? (
              <Box sx={{ p: 0 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={10}
                  maxRows={15}
                  value={shaderCode}
                  onChange={(e) => setShaderCode(e.target.value)}
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', mb: 2 }}
                  inputProps={{ style: { fontFamily: 'monospace', fontSize: '12px' } }}
                />
                <Button variant="contained" onClick={handleApplyShader} fullWidth>
                  Apply Shader
                </Button>
              </Box>
            ) : visualType === 'butterchurn' ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Preset Cycling
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">Cycle Interval</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {butterchurnConfig.cycleInterval === 0 ? 'Off' : `${butterchurnConfig.cycleInterval}s`}
                    </Typography>
                  </Box>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="5"
                    value={butterchurnConfig.cycleInterval}
                    onChange={(e) =>
                      setButterchurnConfig((prev) => ({
                        ...prev,
                        cycleInterval: Number(e.target.value)
                      }))
                    }
                    style={{ width: '100%' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Time between automatic preset changes (0 = disabled)
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">Blend Time</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {butterchurnConfig.blendTime}s
                    </Typography>
                  </Box>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={butterchurnConfig.blendTime}
                    onChange={(e) =>
                      setButterchurnConfig((prev) => ({
                        ...prev,
                        blendTime: Number(e.target.value)
                      }))
                    }
                    style={{ width: '100%' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Transition duration when switching presets
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={butterchurnConfig.shufflePresets}
                      onChange={(e) =>
                        setButterchurnConfig((prev) => ({
                          ...prev,
                          shufflePresets: e.target.checked
                        }))
                      }
                    />
                    <Typography variant="body2">Shuffle Presets</Typography>
                  </label>
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 3.5 }}>
                    Randomize preset order when cycling
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary">
                  Use the controls on the visualizer to manually switch presets, or adjust the cycle interval above for automatic changes.
                </Typography>
              </Box>
            ) : visualType === 'astrofox' ? (
              <Box>
                {/* Quick Presets */}
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Quick Presets
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {ASTROFOX_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        setAstrofoxConfig((prev) => ({
                          ...prev,
                          layers: getAstrofoxPresetLayers(preset)
                        }))
                      }
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {preset}
                    </Button>
                  ))}
                </Box>

                {/* Background Color */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="body2">Background:</Typography>
                  <input
                    type="color"
                    value={astrofoxConfig.backgroundColor}
                    onChange={(e) =>
                      setAstrofoxConfig((prev) => ({
                        ...prev,
                        backgroundColor: e.target.value
                      }))
                    }
                    style={{ width: 40, height: 30, cursor: 'pointer', border: 'none' }}
                  />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {astrofoxConfig.backgroundColor}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Full Layer Controls from Astrofox component */}
                {astrofoxReady && astrofoxRef.current?.renderControls()}
                {!astrofoxReady && (
                  <Typography variant="caption" color="text.secondary">
                    Loading layer controls...
                  </Typography>
                )}
              </Box>
            ) : (
              (() => {
                // Use custom form component if provided (integrated mode)
                if (ConfigFormComponent && effects) {
                  const backendEffectType = VISUAL_TO_BACKEND_EFFECT[visualType]
                  const schemaProperties =
                    backendEffectType && effects[backendEffectType]
                      ? orderEffectProperties(
                          effects[backendEffectType].schema,
                          effects[backendEffectType].hidden_keys,
                          effects[backendEffectType].advanced_keys,
                          config.advanced
                        )
                      : VISUALISER_SCHEMAS[visualType] || []

                  return (
                    <ConfigFormComponent
                      handleEffectConfig={handleEffectConfig}
                      virtId="visualiser"
                      schemaProperties={schemaProperties}
                      model={config}
                      selectedType={visualType}
                      descriptions="Show"
                    />
                  )
                }

                // Fallback to simple form (standalone mode)
                return <SimpleConfigForm config={config} onChange={handleEffectConfig} />
              })()
            )}

            {/* FX Panel - Collapsible */}
            {fxEnabled && (
              <Box sx={{ mt: 3, borderTop: 1, borderColor: 'divider', pt: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowFxPanel(!showFxPanel)}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <AutoFixHigh fontSize="small" color="secondary" />
                    Post-Processing Effects
                    {ppState.enabledEffects.length > 0 && (
                      <Typography component="span" variant="caption" color="text.secondary">
                        ({ppState.enabledEffects.length} active)
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {showFxPanel ? '▲' : '▼'}
                  </Typography>
                </Box>

                {showFxPanel && (
                  <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    <PostProcessingPanel
                      config={ppConfig}
                      onChange={(newConfig) =>
                        setPpConfig((prev) => ({ ...prev, ...newConfig }))
                      }
                      enabledEffects={ppState.enabledEffects}
                    />
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }} key="presets-panel">
        {/* Presets */}
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Presets
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Quickly switch between different moods.
            </Typography>

            <Stack spacing={2}>
              <Button onClick={() => handleTypeChange(visualType)} variant="outlined" fullWidth>
                DEFAULT
              </Button>
              <Button
                onClick={() =>
                  setAllConfigs((prev) => ({
                    ...prev,
                    [visualType]: {
                      ...prev[visualType],
                      sensitivity: 2.5,
                      brightness: 1.2,
                      smoothing: 0.2
                    }
                  }))
                }
                variant="outlined"
                fullWidth
                color="secondary"
              >
                HIGH ENERGY
              </Button>
              <Button
                onClick={() =>
                  setAllConfigs((prev) => ({
                    ...prev,
                    [visualType]: {
                      ...prev[visualType],
                      sensitivity: 0.8,
                      smoothing: 0.9,
                      speed: 0.5
                    }
                  }))
                }
                variant="outlined"
                fullWidth
                color="info"
              >
                CHILL
              </Button>
            </Stack>

            {audioSource === 'mic' && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" display="block" gutterBottom sx={{ fontWeight: 'bold', mb: 1.5 }}>
                  AUDIO STATS
                </Typography>

                {/* BPM with confidence */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption">BPM</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: 'primary.main' }}>
                        {micData.bpm} <Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>({Math.round(micData.confidence * 100)}%)</Typography>
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{
                          minWidth: '30px',
                          height: '20px',
                          fontSize: '0.65rem',
                          p: 0,
                          lineHeight: 1
                        }}
                        onClick={tapTempo}
                      >
                        TAP
                      </Button>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={micData.confidence * 100}
                    sx={{ height: 4, borderRadius: 2, bgcolor: 'action.disabledBackground' }}
                  />
                </Box>

                {/* Beat phase indicator */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption">Beat</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 0.25, 0.5, 0.75].map((threshold, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: micData.beatPhase >= threshold && micData.beatPhase < threshold + 0.25
                              ? 'primary.main'
                              : 'action.disabledBackground',
                            transition: 'background-color 0.1s',
                            boxShadow: micData.isBeat && micData.beatPhase >= threshold && micData.beatPhase < threshold + 0.25
                              ? '0 0 8px currentColor'
                              : 'none'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>

                {/* Buildup detection */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption">Buildup</Typography>
                    <Typography variant="caption" fontWeight="bold" sx={{
                      color: micData.isBuildUp ? 'warning.main' : 'text.secondary',
                      textTransform: 'uppercase'
                    }}>
                      {micData.buildUpPhase} {micData.beatsToImpact > 0 && `(${micData.beatsToImpact})`}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={micData.buildUpConfidence * 100}
                    color={micData.isBuildUp ? 'warning' : 'primary'}
                    sx={{ height: 4, borderRadius: 2, bgcolor: 'action.disabledBackground' }}
                  />
                </Box>

                {/* Note/Key detection */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption">Note</Typography>
                    <Typography variant="caption" fontWeight="bold" sx={{
                      color: micData.noteConfidence > 0.3 ? 'secondary.main' : 'text.secondary',
                      fontFamily: 'monospace'
                    }}>
                      {micData.dominantNote} {micData.noteConfidence > 0.3 && <Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>({Math.round(micData.noteConfidence * 100)}%)</Typography>}
                    </Typography>
                  </Box>
                </Box>

                {/* Energy level */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption">Energy</Typography>
                    <Typography variant="caption" fontWeight="bold" sx={{
                      color: micData.energy > 0.7 ? 'error.main' : micData.energy > 0.4 ? 'warning.main' : 'success.main'
                    }}>
                      {Math.round(micData.energy * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={micData.energy * 100}
                    color={micData.energy > 0.7 ? 'error' : micData.energy > 0.4 ? 'warning' : 'success'}
                    sx={{ height: 4, borderRadius: 2, bgcolor: 'action.disabledBackground' }}
                  />
                </Box>

                {/* Valence (positiveness) */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption">Valence</Typography>
                    <Typography variant="caption" fontWeight="bold" sx={{
                      color: micData.valence > 0.6 ? 'success.main' : micData.valence < 0.4 ? 'info.main' : 'text.secondary'
                    }}>
                      {Math.round(micData.valence * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={micData.valence * 100}
                    color={micData.valence > 0.6 ? 'success' : micData.valence < 0.4 ? 'info' : 'primary'}
                    sx={{ height: 4, borderRadius: 2, bgcolor: 'action.disabledBackground' }}
                  />
                </Box>

                {/* Mood/Genre */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption">Mood</Typography>
                    <Typography variant="caption" fontWeight="bold" sx={{
                      color: micData.mood === 'intense' ? 'error.main'
                        : micData.mood === 'upbeat' ? 'success.main'
                        : micData.mood === 'driving' ? 'warning.main'
                        : micData.mood === 'chill' ? 'info.main'
                        : micData.mood === 'ambient' ? 'secondary.main'
                        : 'text.secondary',
                      textTransform: 'capitalize'
                    }}>
                      {micData.mood}
                    </Typography>
                  </Box>
                </Box>

                {/* Frequency bands */}
                <Typography variant="caption" display="block" sx={{ mt: 2, mb: 1, opacity: 0.7 }}>
                  Frequency Bands
                </Typography>

                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                    <Typography variant="caption" sx={{ minWidth: 35 }}>Bass</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, minWidth: 30, textAlign: 'right' }}>{micData.bass.toFixed(2)}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(micData.bass * 100, 100)}
                    color="error"
                    sx={{ height: 6, borderRadius: 1, bgcolor: 'action.disabledBackground' }}
                  />
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                    <Typography variant="caption" sx={{ minWidth: 35 }}>Mid</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, minWidth: 30, textAlign: 'right' }}>{micData.mid.toFixed(2)}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(micData.mid * 100, 100)}
                    color="warning"
                    sx={{ height: 6, borderRadius: 1, bgcolor: 'action.disabledBackground' }}
                  />
                </Box>

                <Box sx={{ mb: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                    <Typography variant="caption" sx={{ minWidth: 35 }}>High</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, minWidth: 30, textAlign: 'right' }}>{micData.high.toFixed(2)}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(micData.high * 100, 100)}
                    color="info"
                    sx={{ height: 6, borderRadius: 1, bgcolor: 'action.disabledBackground' }}
                  />
                </Box>
              </Box>
            )}

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
      </Grid>
    </Grid>

    <Snackbar
      open={!!saveError}
      autoHideDuration={6000}
      onClose={() => setSaveError(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={() => setSaveError(null)} severity="warning" sx={{ width: '100%' }}>
        {saveError}
      </Alert>
    </Snackbar>
    </ThemeProvider>
  )
}

export default VisualiserIso
