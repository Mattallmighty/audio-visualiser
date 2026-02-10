# Zustand Store Documentation

## ✅ Migration Complete!

**Status**: VisualiserIso.tsx has been fully migrated to Zustand state management.

**What Changed**:
- ✅ Removed 13 `useState` declarations
- ✅ Removed manual localStorage save/load logic (Zustand persist handles it)
- ✅ Updated window API to use store methods directly
- ✅ All visualizer configs now managed by Zustand
- ✅ Build size: 3,700.39 kB │ gzip: 736.68 kB
- ✅ Redux DevTools integration ready

**Benefits**:
- Centralized state management
- Automatic persistence with version migrations
- Time-travel debugging via Redux DevTools
- Type-safe store access
- No prop drilling needed
- Simpler component logic

---

## Overview

The audio visualiser now uses Zustand for state management with the following features:
- **Devtools**: Redux devtools integration (development only)
- **Persistence**: Automatic localStorage sync
- **Type Safety**: Full TypeScript support via `combine`
- **Migrations**: Version-based state migrations
- **Modular**: Organized into logical slices

## Store Structure

```typescript
src/store/
├── index.ts                    # Main exports
├── useStore.ts                 # Store configuration
├── migrate.ts                  # Migration system
└── visualizer/
    ├── storeVisualizer.ts     # Visual type, audio source, playback
    ├── storeUI.ts             # UI state (overlays, fullscreen, panels)
    ├── storePostProcessing.ts # FX and post-processing config
    ├── storeConfigs.ts        # Visualizer-specific configs
    └── storeShaderEditor.ts   # Shader editor state
```

## Usage Examples

### Basic Usage

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
  state => ({ visualType: state.visualType, isPlaying: state.isPlaying }),
  shallow
)
```

### Actions

```typescript
// Visualizer controls
setVisualType('spiralgalaxy')
setAudioSource('mic')
setAutoChange(true)
togglePlay()

// UI controls
toggleOverlays()
setShowFxPanel(true)
setFullScreen(true)

// Post-processing
toggleFx()
updatePpConfig({ bloom: { enabled: true, intensity: 0.8 } })

// Configs
updateButterchurnConfig({ cycleInterval: 30 })
setVisualizerConfig('wavemountain', { color: '#ff0000' })

// Shader editor
setShaderCode(newCode)
toggleShaderEditor()
```

## State Slices

### StoreVisualizer
- `visualType`: Current visualizer type
- `audioSource`: 'backend' | 'mic'
- `autoChange`: Auto-cycle visualizers
- `isPlaying`: Playback state

### StoreUI
- `showOverlays`: Controls visibility
- `fullScreen`: Fullscreen mode
- `showFxPanel`: FX panel visibility
- `saveError`: Error messages

### StorePostProcessing
- `fxEnabled`: Post-processing toggle
- `ppConfig`: FX configuration object
- `glContext`: WebGL context (runtime only)
- `canvasSize`: Canvas dimensions (runtime only)

### StoreConfigs
- `butterchurnConfig`: Butterchurn settings
- `astrofoxConfig`: Astrofox settings
- `visualizerConfigs`: Registry-based visualizer configs
- `astrofoxReady`: Astrofox initialization state

### StoreShaderEditor
- `showCode`: Editor visibility
- `shaderCode`: Current shader code
- `activeCustomShader`: Active custom shader ID

## Persistence

The store automatically persists to localStorage under the key `visualiser-storage`.

**Excluded from persistence:**
- `glContext` (runtime WebGL context)
- `canvasSize` (runtime canvas dimensions)
- `astrofoxReady` (runtime initialization flag)
- `saveError` (temporary error messages)

## Migrations

Version-based migrations handle state structure changes:

```typescript
// src/store/migrate.ts
export const migrations: Record<number, (state: MigrationState) => MigrationState> = {
  1: (state) => {
    // Transform old localStorage format to Zustand format
    return state
  },
  2: (state) => {
    // Future migration example
    return { ...state, newField: 'default' }
  }
}
```

To create a new migration:
1. Increment `VISUALISER_STORE_VERSION` in `migrate.ts`
2. Add migration function for the new version
3. Test migration with old persisted state

## DevTools

Redux DevTools integration is enabled in development:
- Time-travel debugging
- State inspection
- Action logging

Access via Redux DevTools browser extension.

## Type Safety

Full TypeScript support via `combine`:

```typescript
import type { IStore } from './store'

// Get complete store type
const state: IStore = useStore.getState()

// Use in components
const visualType: string = useStore(state => state.visualType)
```

## Best Practices

1. **Selector Optimization**: Only select what you need
2. **Shallow Comparison**: Use `shallow` for multiple values
3. **Action Composition**: Combine actions in custom hooks
4. **Immutable Updates**: Always use spread operators
5. **Type Safety**: Let TypeScript infer types from selectors

## Integration with VisualiserIso

The store will replace local state in VisualiserIso.tsx:
- Remove `useState` hooks for store-managed state
- Use `useStore` selectors instead
- Expose store actions via window API
- Keep refs and callbacks as-is

## Next Steps

1. Replace VisualiserIso local state with Zustand
2. Update window API to use store actions
3. Test persistence and migrations
4. Verify Redux DevTools integration
