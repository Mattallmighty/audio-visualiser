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

## 🔄 Migrations

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
