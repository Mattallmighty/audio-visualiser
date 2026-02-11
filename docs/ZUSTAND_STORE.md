# Zustand Store

## ✅ Status: Production Ready

The audio visualizer uses Zustand for centralized state management with automatic persistence, migrations, and devtools integration.

## 🏗️ Architecture

```typescript
src/store/
├── index.ts                    # Public exports
├── useStore.ts                 # Main store configuration
├── migrate.ts                  # Version migrations
└── visualizer/
    ├── storeVisualizer.ts     # Visual type, audio source, playback
    ├── storeUI.ts             # UI state (overlays, fullscreen)
    ├── storePostProcessing.ts # FX pipeline configuration
    ├── storeConfigs.ts        # Visualizer-specific configs
    └── storeShaderEditor.ts   # Shader editor state
```

### Main Store Setup

```typescript
// src/store/useStore.ts
import { create } from 'zustand'
import { devtools, persist, combine } from 'zustand/middleware'

const useStore = create(
  devtools(
    persist(
      combine(
        { version: VISUALISER_STORE_VERSION },
        (set, get) => ({
          ...storeVisualizer(set),
          ...storeUI(set),
          ...storePostProcessing(set),
          ...storeConfigs(set, get),
          ...storeShaderEditor(set)
        })
      ),
      {
        name: 'visualiser-storage',
        version: VISUALISER_STORE_VERSION,
        migrate: (persistedState, version) => {
          // Apply sequential migrations
        },
        partialize: (state) => {
          // Exclude runtime-only properties
        }
      }
    ),
    { name: 'Visualiser Store', enabled: process.env.NODE_ENV !== 'production' }
  )
)
```

---

## 📦 Store Slices

### 1. storeVisualizer
```typescript
interface StoreVisualizerState {
  visualType: VisualisationType        // Current visualizer
  audioSource: 'backend' | 'mic'       // Audio input
  autoChange: boolean                  // Auto-cycle visualizers
  isPlaying: boolean                   // Playback state
}

interface StoreVisualizerActions {
  setVisualType: (type: VisualisationType) => void
  setAudioSource: (source: 'backend' | 'mic') => void
  setAutoChange: (enabled: boolean) => void
  setIsPlaying: (playing: boolean) => void
  togglePlay: () => void
}
```

### 2. storeUI
```typescript
interface StoreUIState {
  showOverlays: boolean      // Controls visibility
  fullScreen: boolean        // Fullscreen mode
  showFxPanel: boolean       // FX panel visibility
  saveError: string | null   // Error messages
}

interface StoreUIActions {
  setShowOverlays: (show: boolean) => void
  toggleOverlays: () => void
  setFullScreen: (fullScreen: boolean) => void
  setShowFxPanel: (show: boolean) => void
  setSaveError: (error: string | null) => void
}
```

### 3. storePostProcessing
```typescript
interface StorePostProcessingState {
  fxEnabled: boolean                              // FX toggle
  ppConfig: PostProcessingConfig                  // FX settings
  glContext: WebGLRenderingContext | null         // Runtime only
  canvasSize: { width: number; height: number }   // Runtime only
}

interface StorePostProcessingActions {
  toggleFx: () => void
  setGlContext: (gl: WebGLRenderingContext) => void
  setCanvasSize: (size: { width: number; height: number }) => void
  updatePpConfig: (updates: Partial<PostProcessingConfig>) => void
}
```

### 4. storeConfigs
```typescript
interface StoreConfigsState {
  butterchurnConfig: ButterchurnConfig
  butterchurnPresetNames: string[]
  astrofoxConfig: AstrofoxConfig
  visualizerConfigs: Record<string, any>    // All 10 schema-based configs
  astrofoxReady: boolean                     // Runtime only
}

interface StoreConfigsActions {
  updateButterchurnConfig: (updates: Partial<ButterchurnConfig>) => void
  setButterchurnPresetNames: (names: string[]) => void
  updateAstrofoxConfig: (updates: Partial<AstrofoxConfig>) => void
  setVisualizerConfig: (id: string, config: any) => void
  setAstrofoxReady: (ready: boolean) => void
}
```

### 5. storeShaderEditor
```typescript
interface StoreShaderEditorState {
  showCode: boolean                      // Editor visibility
  shaderCode: string                     // Current shader code
  activeCustomShader: string | undefined // Active custom shader ID
}

interface StoreShaderEditorActions {
  setShaderCode: (code: string) => void
  setActiveCustomShader: (id: string | undefined) => void
  toggleShaderEditor: () => void
}
```

---

## 🎯 Usage

### Basic Access
```typescript
import { useStore } from './store'

function MyComponent() {
  // Select specific state
  const visualType = useStore(state => state.visualType)
  const isPlaying = useStore(state => state.isPlaying)
  
  // Select actions
  const setVisualType = useStore(state => state.setVisualType)
  const togglePlay = useStore(state => state.togglePlay)
  
  return (
    <button onClick={() => setVisualType('butterchurn')}>
      Switch to Butterchurn
    </button>
  )
}
```

### Optimized Selectors
```typescript
// ❌ Bad - re-renders on any store change
const store = useStore()

// ✅ Good - only re-renders when visualType changes
const visualType = useStore(state => state.visualType)

// ✅ Better - multiple values with shallow comparison
import { shallow } from 'zustand/shallow'
const { visualType, isPlaying } = useStore(
  state => ({ 
    visualType: state.visualType, 
    isPlaying: state.isPlaying 
  }),
  shallow
)
```

### Frontend Access (via useVstore)
```typescript
// Frontend accesses visualizer's store directly
const { useStore } = window.YzAudioVisualiser
const useVstore = useStore

// Same usage as internal components!
const visualType = useVstore?.(state => state.visualType)
const setVisual = useVstore?.(state => state.setVisualType)

// Batch updates
useVstore?.setState({ 
  visualType: 'fluid', 
  isPlaying: true 
})
```

---

## 💾 Persistence

The store automatically persists to localStorage under key `visualiser-storage`.

### Excluded from Persistence
Runtime-only properties are excluded via `partialize`:
- `glContext` - WebGL context (cannot serialize)
- `canvasSize` - Canvas dimensions (recalculated on load)
- `astrofoxReady` - Initialization flag (recalculated)
- `saveError` - Temporary error messages

### Storage Format
```json
{
  "state": {
    "version": 1,
    "visualType": "butterchurn",
    "audioSource": "backend",
    "isPlaying": true,
    "showOverlays": true,
    "fxEnabled": false,
    "butterchurnConfig": { "cycleSpeed": 1 },
    "visualizerConfigs": { "fluid": { "color": "#ff0000" } }
  },
  "version": 1
}
```

---

## � Query Parameter Initialization

> **New Feature:** URL parameters are parsed synchronously during store creation to eliminate race conditions.

### Overview

Query parameters are automatically parsed and applied to the store **before** the first component render, ensuring visualizers see the correct initial configuration.

### Implementation

```typescript
// src/store/useStore.ts
import { parseQueryParams } from './queryParamInit'

// Parse BEFORE store creation (synchronous)
const queryParamOverrides = parseQueryParams()

const useStore = create(/* ... */)

// Apply overrides AFTER store creation
if (queryParamOverrides.visualType) {
  setTimeout(() => {
    const store = useStore.getState()
    
    // Set visual type
    if (queryParamOverrides.visualType) {
      store.setVisualType(queryParamOverrides.visualType)
    }
    
    // Apply configs
    if (queryParamOverrides.butterchurnConfig) {
      store.updateButterchurnConfig(queryParamOverrides.butterchurnConfig)
    }
  }, 0)
}
```

### Parser Logic

Located in `src/store/queryParamInit.ts`:

```typescript
export function parseQueryParams(): {
  visualType?: VisualisationType
  butterchurnConfig?: Record<string, any>
  [key: string]: any
}
```

**Features:**
- ✅ Detects standalone vs HashRouter mode automatically
- ✅ Schema-based type conversion (boolean/integer/number/string/array/object)
- ✅ Min/max validation from schema constraints
- ✅ Enum validation for restricted values
- ✅ Legacy support: `preset` → `currentPresetName`, `presetIndex` → `currentPresetIndex`

**Flow:**
```
1. window.location.search (standalone) or window.location.hash (HashRouter)
   ↓
2. URLSearchParams parsing
   ↓
3. visualType lookup in VISUALIZER_REGISTRY
   ↓
4. getUISchema() → properties
   ↓
5. Type conversion via convertValueBySchema()
   ↓
6. Build config object with validated values
   ↓
7. Return { visualType, butterchurnConfig, ...otherConfigs }
```

### Type Conversion

```typescript
// src/store/queryParamInit.ts
const convertValueBySchema = (value: string, property: SchemaProperty): any => {
  switch (property.type) {
    case 'boolean': return value === 'true' || value === '1' || value === 'yes'
    case 'integer': return clamp(parseInt(value), min, max)
    case 'number': return clamp(parseFloat(value), min, max)
    case 'string': return enumCheck(value, property.enum)
    case 'array': return JSON.parse(value) || value.split(',')
    case 'object': return JSON.parse(value)
  }
}
```

### Butterchurn Special Handling

Butterchurn uses `initialPreset*` keys for URL-loaded presets to distinguish from persisted state:

```typescript
if (targetVisualType === 'butterchurn') {
  const butterchurnUpdate: Record<string, any> = {}
  
  // URL params → initialPreset* keys
  if ('currentPresetName' in configUpdate) {
    butterchurnUpdate.initialPresetName = configUpdate.currentPresetName
    delete configUpdate.currentPresetName
  }
  if ('currentPresetIndex' in configUpdate) {
    butterchurnUpdate.initialPresetIndex = configUpdate.currentPresetIndex
    delete configUpdate.currentPresetIndex
  }
  
  // Other params stay as-is (cycleInterval, blendTime, shufflePresets)
  result.butterchurnConfig = { ...butterchurnUpdate, ...configUpdate }
}
```

### Visualizer Component Usage

```typescript
// src/components/Visualisers/ButterchurnVisualiser.tsx
useEffect(() => {
  // ...preset loading...
  
  // Check for URL-specified preset
  if (config.initialPresetIndex !== undefined) {
    const presetIndex = config.initialPresetIndex
    // Use local indices array (not state) to avoid race condition
    const actualIndex = config.shufflePresets ? indices[presetIndex] : presetIndex
    const preset = butterchurnPresets[names[actualIndex]]
    
    if (preset) {
      visualizerRef.current.loadPreset(preset, 0)
      setCurrentPresetIndex(presetIndex)
    }
  }
}, [/* ... */])
```

### Race Condition Prevention

**Problem:** Components mount and run effects **before** store updates from query params complete.

**Solution:** 
1. Parse query params **synchronously** (no await, no async)
2. Apply to store via `setTimeout(..., 0)` (next tick)
3. Butterchurn component checks `config.initialPresetIndex` on mount
4. Uses **local** `indices` array instead of state (which updates async)

**Result:** ✅ No race condition - preset loads correctly every time

### Usage Examples

```
# Standalone
http://localhost:3001/?visual=butterchurn&currentPresetIndex=42&cycleInterval=30

# HashRouter
http://localhost:3000/#/visualiser?visual=butterchurn&currentPresetIndex=42

# With display mode
http://localhost:3000/#/visualiser?display=true&visual=fluid&fluidDensity=0.98
```

---

## �🔄 Migrations

Version-based migrations handle state structure changes:

```typescript
// src/store/migrate.ts
export const VISUALISER_STORE_VERSION = 1

export const migrations: Record<number, (state: MigrationState) => MigrationState> = {
  1: (state) => {
    // Migrate from old localStorage format to Zustand format
    return state
  },
  2: (state) => {
    // Future migration example
    return { ...state, newField: 'default' }
  }
}
```

### Adding a Migration
1. Increment `VISUALISER_STORE_VERSION`
2. Add migration function for new version
3. Test with old persisted state
4. Migration runs automatically on load

---

## 🛠️ DevTools

Redux DevTools integration is enabled in development:

```typescript
devtools(
  /* ... store */,
  { 
    name: 'Visualiser Store', 
    enabled: process.env.NODE_ENV !== 'production' 
  }
)
```

**Features**:
- Time-travel debugging
- State inspection
- Action logging
- State snapshots

**Access**: Install Redux DevTools browser extension

---

## 📊 Benefits

### Before Zustand
- ❌ 13+ `useState` declarations scattered
- ❌ Manual localStorage save/load logic
- ❌ Prop drilling through components
- ❌ No devtools support
- ❌ No type safety for state
- ❌ Complex state synchronization

### After Zustand
- ✅ Centralized state management
- ✅ Automatic persistence with migrations
- ✅ Time-travel debugging via DevTools
- ✅ Full TypeScript type safety
- ✅ No prop drilling needed
- ✅ Selective re-renders (performance)
- ✅ Frontend can share store directly (useVstore)
- ✅ Simple, clean component logic

---

## 🔗 Related Docs

- [COMMUNICATION.md](COMMUNICATION.md) - Frontend↔Visualizer communication (useVstore)
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall architecture
