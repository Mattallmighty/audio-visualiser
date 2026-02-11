# Frontend Integration Guide

## 🎯 Overview

The audio visualizer integrates with LedFx-Frontend-v2 via [react-dynamic-module](https://github.com/YeonV/react-dynamic-module), enabling runtime loading and direct Zustand store sharing.

## 📦 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Build: Audio-Visualizer                                    │
│  pnpm build → dist/yz-audio-visualiser.js (733 kB gzipped)  │
└─────────────────────────────────────────────────────────────┘
                        ↓ (copy to)
┌─────────────────────────────────────────────────────────────┐
│  Frontend: public/modules/yz-audio-visualiser.js            │
└─────────────────────────────────────────────────────────────┘
                        ↓ (loaded via)
┌─────────────────────────────────────────────────────────────┐
│  react-dynamic-module (runtime)                              │
│  useDynamicModule({ url, scope, module })                   │
└─────────────────────────────────────────────────────────────┘
                        ↓ (exports)
┌─────────────────────────────────────────────────────────────┐
│  { AudioVisualiser, useStore, types }                        │
│  window.YzAudioVisualiser = { useStore, ... }               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Frontend Implementation

### 1. Module Loading

```typescript
// frontend/src/components/AudioVisualiser/AudioVisualiser.tsx
import { useDynamicModule } from '@yz-dev/react-dynamic-module'

const AudioVisualiserWrapper = () => {
  const module = useDynamicModule({
    url: '/modules/yz-audio-visualiser.js',
    scope: 'YzAudioVisualiser',
    module: '.'
  })

  if (module.loading) return <Loading />
  if (module.error) return <Error error={module.error} />

  const { AudioVisualiser, useStore } = module.exports || {}
  
  return <AudioVisualiser />
}
```

### 2. Direct Store Access (useVstore)

```typescript
// Extract useStore from module
const { useStore } = module.exports || {}

// Alias as useVstore (convention)
const useVstore = useStore

// READ STATE (reactive!)
const visualType = useVstore?.(state => state.visualType)
const isPlaying = useVstore?.(state => state.isPlaying)
const showOverlays = useVstore?.(state => state.showOverlays)
const ppConfig = useVstore?.(state => state.ppConfig)

// CALL ACTIONS (type-safe!)
const setVisualType = useVstore?.(state => state.setVisualType)
const togglePlay = useVstore?.(state => state.togglePlay)
const toggleOverlays = useVstore?.(state => state.toggleOverlays)

// USE IN UI
<Button onClick={() => setVisualType?.('butterchurn')}>
  Butterchurn
</Button>

<IconButton onClick={() => togglePlay?.()}>
  {isPlaying ? <Pause /> : <Play />}
</IconButton>
```

### 3. Batch Updates

```typescript
// Single setState call = single re-render
useVstore?.setState({
  visualType: 'fluid',
  isPlaying: true,
  showOverlays: false
})
```

### 4. Imperative Access

```typescript
// Get current state (non-reactive)
const currentState = useVstore?.getState()
console.log('Current visual:', currentState?.visualType)

// Subscribe to changes
useEffect(() => {
  const unsubscribe = useVstore?.subscribe(
    state => state.isPlaying,
    (playing) => {
      console.log('Playing changed:', playing)
    }
  )
  return unsubscribe
}, [useVstore])
```

## 🔗 Legacy API (window.visualiserApi)

Some methods still use window.visualiserApi for ref-dependent operations:

```typescript
// Still available for specific operations
window.visualiserApi?.loadPreset(5)
window.visualiserApi?.toggleFullscreen()
window.visualiserApi?.getVisualizerIds()

// But most state/actions now via useVstore!
```

## 📋 Available State & Actions

### Visualizer Control
```typescript
// State
visualType: VisualisationType
audioSource: 'backend' | 'mic'
autoChange: boolean
isPlaying: boolean

// Actions
setVisualType(type: VisualisationType)
setAudioSource(source: 'backend' | 'mic')
setAutoChange(enabled: boolean)
setIsPlaying(playing: boolean)
togglePlay()
```

### UI State
```typescript
// State
showOverlays: boolean
fullScreen: boolean
showFxPanel: boolean
saveError: string | null

// Actions
setShowOverlays(show: boolean)
toggleOverlays()
setFullScreen(fullScreen: boolean)
setShowFxPanel(show: boolean)
setSaveError(error: string | null)
```

### Post-Processing
```typescript
// State
fxEnabled: boolean
ppConfig: PostProcessingConfig

// Actions
toggleFx()
updatePpConfig(updates: Partial<PostProcessingConfig>)
```

### Configurations
```typescript
// State
butterchurnConfig: ButterchurnConfig
astrofoxConfig: AstrofoxConfig
visualizerConfigs: Record<string, any>

// Actions
updateButterchurnConfig(updates: Partial<ButterchurnConfig>)
updateAstrofoxConfig(updates: Partial<AstrofoxConfig>)
setVisualizerConfig(id: string, config: any)
```

### Shader Editor
```typescript
// State
showCode: boolean
shaderCode: string
activeCustomShader: string | undefined

// Actions
setShaderCode(code: string)
setActiveCustomShader(id: string | undefined)
toggleShaderEditor()
```

## 💡 Best Practices

### 1. Selective Subscriptions
```typescript
// ❌ Bad - subscribes to all state changes
const store = useVstore?.()

// ✅ Good - only subscribes to visualType
const visualType = useVstore?.(state => state.visualType)
```

### 2. Batch Related Updates
```typescript
// ❌ Bad - three re-renders
setVisualType('fluid')
setIsPlaying(true)
toggleOverlays()

// ✅ Good - one re-render
useVstore?.setState({
  visualType: 'fluid',
  isPlaying: true,
  showOverlays: false
})
```

### 3. Optional Chaining
```typescript
// Always use ?. since module might not be loaded
useVstore?.(state => state.visualType)
setVisualType?.('butterchurn')
```

### 4. Type Safety
```typescript
// Import types from visualizer
import type { VisualisationType } from '@/types/visualiser'

// Or infer from store
type StoreState = ReturnType<typeof useVstore.getState>
```

---

## 🔗 URL Query Parameters

> **New Feature:** Automatic configuration via URL parameters

The visualizer supports URL query parameters for automatic configuration, enabling OBS integration, preset sharing, and deep linking.

### ✨ Features
- ✅ **Auto-generated support** - All visualizer configs automatically supported via schemas
- ✅ **Type conversion** - Automatic string → boolean/number/integer conversion  
- ✅ **Validation** - Min/max constraints and enum checking from schemas
- ✅ **HashRouter compatible** - Works in both standalone and embedded modes
- ✅ **Race condition free** - Synchronous parsing during store initialization

### 📝 Usage Examples

```
# Standalone Mode (port 3001)
http://localhost:3001/?visual=butterchurn&currentPresetIndex=42

# Integrated Mode (HashRouter)
http://localhost:3000/#/visualiser?visual=butterchurn&currentPresetIndex=42

# Display Mode (OBS-friendly - no UI chrome)
http://localhost:3000/#/visualiser?display=true&visual=butterchurn&currentPresetIndex=42
```

### 🎛️ Available Parameters

#### Core Parameters
```
?visual=<name>              # Sets active visualizer (required)
                            # Examples: butterchurn, fluid, frequencyrings
```

#### Butterchurn
```
?currentPresetIndex=<0-394> # Preset by index
?currentPresetName=<name>   # Preset by name  
?cycleInterval=<seconds>    # Auto-cycle interval (default: 25)
?blendTime=<seconds>        # Blend duration (default: 2.7)
?shufflePresets=<bool>      # Random preset order
```

#### Other Visualizers
All schema properties automatically supported:
```
# Fluid
?fluidDensity=0.98&particleCount=8000

# Frequency Rings  
?ringCount=10&rotationSpeed=2

# Aurora Borealis
?waveSpeed=1.5&particleIntensity=0.8
```

### 🎨 Type Conversion

```typescript
// Boolean: true/false, 1/0, yes/no
?shufflePresets=true   → true

// Integer: with min/max validation
?currentPresetIndex=42 → 42

// Number: float with constraints
?blendTime=2.5         → 2.5

// Array: JSON or comma-separated
?colors=red,blue       → ["red", "blue"]

// Object: JSON only
?position={"x":1}      → {x: 1}
```

### 📺 OBS Browser Source

```
URL: http://localhost:3000/#/visualiser
     ?display=true
     &visual=butterchurn
     &currentPresetIndex=42
     &cycleInterval=30
     &shufflePresets=true

Width: 1920
Height: 1080
FPS: 60
```

### 🔧 Implementation

Query params are parsed **synchronously** during store initialization (`src/store/queryParamInit.ts`), ensuring the configuration is applied before the first component render, eliminating race conditions.

```typescript
// Standalone: window.location.search
// HashRouter: window.location.hash (after '?')

// Automatic schema-based type conversion
// Butterchurn: initialPresetIndex → loaded on mount
// Other visualizers: updateVisualizerConfig(type, params)
```

---

## 🐛 Debugging

### Redux DevTools
```typescript
// Open Redux DevTools to see:
// - Current state tree
// - Action history
// - State diffs
// - Time-travel debugging
```

### Console Logging
```typescript
// Get current state snapshot
console.log('Store state:', useVstore?.getState())

// Subscribe to all changes
useVstore?.subscribe(
  state => state,
  (state) => console.log('State changed:', state)
)
```

## 🔧 Build & Deploy

### 1. Build Visualizer
```bash
cd _audio-visualiser
pnpm build
# Output: dist/yz-audio-visualiser.js (733 kB gzipped)
```

### 2. Copy to Frontend
```bash
# Manual
cp dist/yz-audio-visualiser.js ../frontend/public/modules/

# Or automated (if script exists)
pnpm deploy:frontend
```

### 3. Restart Frontend
```bash
cd ../frontend
pnpm dev
# Module will be loaded at runtime
```

## 📊 Benefits

### Before (Generation 3: window.api)
- 🔴 Polling required (100ms intervals)
- 🔴 Desync possible (localStorage races)
- 🔴 No type safety
- 🔴 Limited to predefined methods

### After (Generation 5: useVstore)
- ✅ No polling (reactive Zustand hooks)
- ✅ No desync (shared store)
- ✅ Full type safety
- ✅ Full state + actions access
- ✅ Redux DevTools support
- ✅ Automatic re-renders
- ✅ Performance optimized

## 🔗 Related Docs

- [COMMUNICATION.md](COMMUNICATION.md) - Communication evolution details
- [ZUSTAND_STORE.md](ZUSTAND_STORE.md) - Store structure
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall architecture
