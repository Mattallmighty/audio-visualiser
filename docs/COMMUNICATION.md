# Frontend ↔ Audio-Visualizer Communication

## 🔄 Evolution: 5 Generations

This document traces the evolution of communication between the frontend (LedFx-Frontend-v2) and the audio-visualizer module, loaded dynamically via [react-dynamic-module](https://github.com/YeonV/react-dynamic-module).

## Generation 1: No Communication 🌱

**Status**: Standalone module, completely isolated

```typescript
const module = useDynamicModule({
  url: '/modules/yz-audio-visualiser.js',
  scope: 'YzAudioVisualiser',
  module: '.'
})

const { AudioVisualiser } = module.exports || {}

// Just render, no external control
<AudioVisualiser />
```

**Limitation**: Frontend cannot control visualizer at all.

---

## Generation 2: Props Passing 📦

**Status**: Basic communication via React props

```typescript
<AudioVisualiser 
  backendAudioData={audioData}
  config={config}
  onConfigChange={handleConfigChange}
/>
```

**Problem Discovered**: 
- Whole component re-renders when ANY prop changes
- Props drilling through multiple internal levels
- Cascading re-renders hurt performance

**Verdict**: Works, but doesn't scale.

---

## Generation 3: window.api + localStorage 🌉

**Status**: Imperative API layer with shared state

```typescript
// Visualizer exposes API
window.visualiserApi = {
  setVisual: (type) => setVisualType(type),
  togglePlay: () => setIsPlaying(prev => !prev),
  loadPreset: (idx) => butterchurnRef.current.loadPreset(idx),
  getCurrentVisual: () => visualType
}

// Frontend calls methods
window.visualiserApi?.setVisual('butterchurn')

// State shared via localStorage
localStorage.setItem('visualiser-config', JSON.stringify(config))

// BUT: Polling required for state changes!
setInterval(() => {
  const current = window.visualiserApi?.getCurrentVisual()
  if (current !== lastKnown) updateUI()
}, 100)
```

**Pros**:
- ✅ Frontend can trigger actions
- ✅ Shared state across instances

**Cons**:
- 🔴 Polling required (check every 100ms)
- 🔴 Desync possible (localStorage race conditions)
- 🔴 No type safety
- 🔴 Limited to predefined methods

**Verdict**: Amazing and working! But not optimal...

---

## Generation 4: Zustand + Subscribe 🎯

**Status**: Zustand store with manual subscriptions

```typescript
// Visualizer migrates to Zustand internally
export { useStore } from './store'

// Frontend subscribes to changes
const { useStore } = module.exports

useEffect(() => {
  const unsubscribe = useStore?.subscribe(
    state => state.visualType,
    (newType) => {
      // React to changes!
    }
  )
  return unsubscribe
}, [])
```

**Pros**:
- ✅ No more polling! Reactive updates!
- ✅ Zustand handles state management

**Cons**:
- 🔴 Manual subscription/unsubscription management
- 🔴 More boilerplate code

**Verdict**: Getting close!

---

## Generation 5: Native useVstore 💖

**Status**: Direct Zustand store sharing (current)

### The Breakthrough

> "Why communicate via window.api and have polling, if the Zustand store can be shared directly? No more polling, no more wait, no desync - just instant direct actions and results!"

### Implementation

**Audio-Visualizer Exports**:
```typescript
// src/index.ts
export { useStore } from './store'
export type { IStore } from './store'
export type {
  StoreVisualizerState,
  StoreVisualizerActions,
  // ... all slice types
} from './store'
```

**Frontend Integration**:
```typescript
// frontend/src/components/AudioVisualiser/AudioVisualiser.tsx
const module = useDynamicModule({
  url: '/modules/yz-audio-visualiser.js',
  scope: 'YzAudioVisualiser',
  module: '.'
})

// Extract useStore from module
const { useStore } = module.exports || {}

// Alias as useVstore (convention)
const useVstore = useStore

// DIRECT ACCESS - Read state (reactive!)
const visualType = useVstore?.(state => state.visualType)
const isPlaying = useVstore?.(state => state.isPlaying)

// DIRECT ACCESS - Call actions (type-safe!)
const setVisualType = useVstore?.(state => state.setVisualType)
const togglePlay = useVstore?.(state => state.togglePlay)

// USE IT!
<Button onClick={() => setVisualType?.('butterchurn')}>
  Switch to Butterchurn
</Button>

// NO NEED TO SUBSCRIBE/UNSUBSCRIBE!
// Zustand hooks provide reactivity automatically! ✨

// IMPERATIVE - Batch updates when needed
useVstore?.setState({ 
  visualType: 'astrofox', 
  isPlaying: true 
})
```

### Benefits

- ✅ **No polling** - Reactivity built-in via Zustand hooks
- ✅ **No desync** - Shared store = single source of truth
- ✅ **Type-safe** - Full TypeScript autocomplete across modules
- ✅ **Bi-directional** - Frontend reads/writes, visualizer updates UI
- ✅ **Selective re-renders** - Only components using changed state re-render
- ✅ **DevTools** - Redux DevTools works across module boundary
- ✅ **Persistence** - State survives module reloads
- ✅ **No API layer** - Direct store access eliminates middleware
- ✅ **No subscribe/unsubscribe** - Zustand handles automatically
- ✅ **No prop drilling** - Internal components use hooks directly

### window.visualiserApi Legacy

Still exists for ref-dependent operations:

```typescript
// Only for operations requiring component internals (refs)
window.visualiserApi = {
  loadPreset: (index) => butterchurnRef.current?.loadPreset(index),
  toggleFullscreen: () => fullscreenHandle.toggle(),
  getVisualizerIds: () => getAllVisualizerTypes()
}

// But 90% of communication now uses direct store sharing!
```

---

## 📊 Comparison Table

| Feature | Gen 1 | Gen 2 | Gen 3 | Gen 4 | Gen 5 |
|---------|-------|-------|-------|-------|-------|
| **Method** | None | Props | window.api | Zustand subscribe | useVstore 💖 |
| **Control** | ❌ | Limited | Good | Better | Perfect ✅ |
| **Latency** | N/A | 0ms | 0-100ms (poll) | 0ms | 0ms |
| **Re-renders** | N/A | Cascading 😱 | N/A | Selective | Selective ✅ |
| **Type Safety** | N/A | Partial | None | Partial | **Full** ✅ |
| **Desync Risk** | N/A | Medium | High (localStorage) | Low | **Zero** ✅ |
| **Polling** | N/A | No | Required 🔴 | No | No ✅ |
| **Manual Sub/Unsub** | N/A | N/A | N/A | Yes 🔴 | No (auto) ✅ |
| **DevTools** | N/A | No | No | Yes | Yes ✅ |
| **Bi-directional** | N/A | Limited | No | Yes | Perfect ✅ |

---

## 💡 Key Insight

Each generation solved the problems of the previous:

1. 🌱 **No communication** → Need basic control
2. 📦 **Props** → Re-render hell, prop drilling
3. 🌉 **window.api** → Polling overhead, desync
4. 🎯 **Subscribe** → Manual subscription management
5. 💖 **useVstore** → Automatic reactivity, perfect harmony!

**Bonus**: Internal prop drilling also eliminated by migrating to Zustand hooks internally.

---

## 🔗 Related Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall architecture
- [ZUSTAND_STORE.md](ZUSTAND_STORE.md) - Store structure and usage
