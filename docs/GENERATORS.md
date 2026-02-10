# Auto-Generation Systems

## 🎯 Overview

The audio visualizer uses **three independent auto-generation systems** that eliminate manual duplication and ensure type safety. Total: **55 visualizers with zero manual metadata**.

```
┌─────────────────────────────────────────────────────────────┐
│  Input Sources (3)                                           │
├─────────────────────────────────────────────────────────────┤
│  1. schemas/*.schema.ts → generate-schemas.ts                │
│     └─ Output: 10 visualizers (Butterchurn, Astrofox, etc.) │
│                                                               │
│  2. GitHub API (LedFx backend) → extract-backend-schemas.ts  │
│     └─ Output: 17 Twod effects (Blade, Scroll, Strobe...)   │
│                                                               │
│  3. webgl-metadata.json → generate-webgl-registry.ts         │
│     └─ Output: 28 WebGL visualizers (Kaleidoscope, Matrix...)│
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Generated Registry (src/_generated/)                        │
├─────────────────────────────────────────────────────────────┤
│  • Full TypeScript types (union types, interfaces)          │
│  • Runtime registry objects (metadata, configs)             │
│  • Helper functions (getConfig, isValid, etc.)              │
│  • Auto-synced with sources (prebuild, predev)              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Unified Registry (src/engines/webgl/registry.ts)            │
├─────────────────────────────────────────────────────────────┤
│  • Combines all 3 sources into single API                   │
│  • getAllVisualizerTypes(): 55 total                        │
│  • getVisualizerDisplayName(id): unified lookup             │
│  • getVisualizersByCategory(): grouped view                 │
└─────────────────────────────────────────────────────────────┘
```

---

## System 1: Schema-First Visualizers (10)

### Purpose
Generate TypeScript types and default configs from Zod schemas for complex visualizers.

### Input
```typescript
// schemas/butterchurn.schema.ts
import { z } from 'zod'

export const butterchurnSchema = z.object({
  cycleSpeed: z.number().min(0.1).max(10).default(1),
  showStats: z.boolean().default(false),
  // ... more fields
})

export type ButterchurnConfig = z.infer<typeof butterchurnSchema>
```

### Generator
```bash
pnpm generate:schemas
# or
pnpm generate
```

**Script**: `scripts/generate-schemas.ts`

### Output
```typescript
// src/_generated/schemas.ts
export const VISUALIZER_REGISTRY = {
  butterchurn: {
    displayName: 'Butterchurn',
    category: 'Preset Player',
    schema: butterchurnSchema,
    defaultConfig: {
      cycleSpeed: 1,
      showStats: false
    },
    getUISchema: (currentConfig) => [
      {
        id: 'cycleSpeed',
        type: 'number',
        title: 'Cycle Speed',
        min: 0.1,
        max: 10,
        step: 0.1,
        value: currentConfig.cycleSpeed
      }
    ]
  }
  // ... 9 more
}
```

### Visualizers
- Butterchurn (milkdrop presets)
- Astrofox (layer-based)
- Fluid (fluid simulation)
- WaveMountain (3D wave terrain)
- HexGrid (hexagonal grid)
- SpiralGalaxy (spiral formation)
- AuroraBorealis (northern lights)
- NeonTerrain (synthwave terrain)
- FrequencyRings (concentric rings)
- SpectrumAnalyzer (frequency bars)

---

## System 2: Backend Effects (17)

### Purpose
Fetch effect schemas from LedFx Python backend, eliminating 700+ lines of manual duplication.

### Input
**Source**: GitHub API  
**Repo**: https://github.com/LedFx/LedFx  
**Files**: `ledfx/effects/*.py` (Voluptuous schemas)

### Generator
```bash
pnpm generate:backend
# or
pnpm generate
```

**Script**: `scripts/extract-backend-schemas.ts`

### Process

1. **Fetch Python Files**:
```
https://raw.githubusercontent.com/LedFx/LedFx/main/ledfx/effects/plasma2d.py
```

2. **Parse Voluptuous Schemas**:
```python
class Plasma2d(Twod, GradientEffect):
    CONFIG_SCHEMA = vol.Schema({
        vol.Optional(
            "density",
            description="kinda how small the plasma is",
            default=0.5,
        ): vol.All(vol.Coerce(float), vol.Range(min=0.001, max=2.0)),
    })
```

3. **Generate TypeScript**:
```typescript
export const BACKEND_EFFECTS = {
  plasma2d: {
    schema: [
      {
        id: 'density',
        type: 'number',
        title: 'Density',
        description: 'kinda how small the plasma is',
        min: 0.001,
        max: 2.0,
        default: 0.5
      }
    ],
    defaults: { density: 0.5 }
  }
}
```

### Output
```typescript
// src/_generated/backend-mapping.ts
export const VISUALISER_SCHEMAS: Record<string, any[]>
export const DEFAULT_CONFIGS: Record<string, any>
export const BACKEND_NAME_MAP: Record<string, string>
```

### Effects (17)
Blade, BladePower, BladeRun, Clone, DigitalRain, Equalizer2d, Flame, GameOfLife, Image, Keybeat2d, Noise, Plasma2d, PlasmaWLED, Radial, Scroll, Soap, Strobe, Texter, Waterfall

---

## System 3: WebGL Registry (28)

### Purpose
Generate types and metadata from single JSON source for WebGL visualizers.

### Input
```json
// webgl-metadata.json
{
  "visualizers": {
    "gif": {
      "displayName": "Kaleidoscope",
      "category": "Original Effects",
      "description": "Rotating kaleidoscope patterns",
      "aliases": ["kaleidoscope"],
      "tags": ["geometric", "rotation", "colorful"]
    }
  }
}
```

### Generator
```bash
pnpm generate:webgl
# or
pnpm generate
```

**Script**: `scripts/generate-webgl-registry.ts`

### Output
```typescript
// src/_generated/webgl/registry.ts

// Union type (auto-generated from JSON keys)
export type WebGLVisualiserId = 
  | 'gif' | 'matrix' | 'terrain' | /* ... */ 'waterfall'

// Full metadata object
export const WEBGL_VISUALIZERS: Record<WebGLVisualiserId, WebGLVisualizerMetadata> = {
  gif: {
    displayName: 'Kaleidoscope',
    category: 'Original Effects',
    // ... metadata from JSON
  }
} as const

// Helper functions
export function getWebGLVisualizerIds(): WebGLVisualiserId[]
export function isWebGLVisualizer(id: string): id is WebGLVisualiserId
```

### Visualizers by Category

**Original Effects (10)**: Kaleidoscope, Matrix Rain, Synthwave Terrain, Geometric Pulse, Concentric Rings, Particles, Spectrum Bars, Radial Spectrum, Waveform, Oscilloscope

**2D Effects (4)**: Bands, Bands Matrix, Blocks, Equalizer 2D

**Matrix Effects (14)**: Blender, Clone, Digital Rain, Flame, Game of Life, Image, Keybeat 2D, Noise, Plasma 2D, Plasma WLED, Radial, Soap, Texter, Waterfall

---

## 🔄 Build Integration

All generators run automatically via package.json hooks:

```json
{
  "scripts": {
    "generate": "pnpm generate:schemas && pnpm generate:webgl && pnpm generate:backend",
    "generate:schemas": "tsx scripts/generate-schemas.ts",
    "generate:webgl": "tsx scripts/generate-webgl-registry.ts",
    "generate:backend": "tsx scripts/extract-backend-schemas.ts",
    "predev": "pnpm generate",
    "prebuild": "pnpm generate"
  }
}
```

**Runs before**:
- `pnpm dev` (development server)
- `pnpm build` (production build)

**Manual generation**:
```bash
pnpm generate           # All generators
pnpm generate:schemas   # Schema-first only
pnpm generate:webgl     # WebGL only
pnpm generate:backend   # Backend only
```

---

## 📈 Impact

### Before Auto-Generation
- 🔴 **72+ lines** of manual WebGL types/configs
- 🔴 **700+ lines** of manual backend schemas
- 🔴 **Manual duplication** for each visualizer
- ⚠️ **Easy to get out of sync**
- ⚠️ **Error-prone maintenance**

### After Auto-Generation
- ✅ **Single source of truth** (JSON/schemas/backend)
- ✅ **Zero manual duplication**
- ✅ **Always in sync** (auto-generated on build)
- ✅ **Type-safe** (TypeScript enforces correctness)
- ✅ **55 visualizers** with consistent metadata
- ✅ **Add visualizer** = 1 file/entry, everything else auto-syncs

### Pain Points Eliminated
- ❌ No more "I added a visualizer but forgot to update the registry"
- ❌ No more "backend changed but frontend is stale"
- ❌ No more "wait which file has the real source of truth?"
- ✅ One JSON file, one schema, one truth

### Statistics
| System | Input | Output Lines | Manual Lines Saved |
|--------|-------|--------------|-------------------|
| Schema-First | 10 schemas | ~1,200 generated | ~300 |
| Backend | 17 API calls | ~800 generated | ~700 |
| WebGL | 28 JSON entries | ~400 generated | ~72 |
| **Total** | **55 sources** | **~2,400 generated** | **~1,072 saved** |

---

## 🚀 Adding a New Visualizer

### Option 1: Schema-First (Complex Config)
```typescript
// 1. Create schemas/mynewviz.schema.ts
export const mynewvizSchema = z.object({
  speed: z.number().min(0).max(10).default(5)
})

// 2. Run generator
pnpm generate:schemas

// 3. Implement component in src/components/Visualisers/
```

### Option 2: WebGL (Custom Shader)
```json
// 1. Add to webgl-metadata.json
{
  "myneweffect": {
    "displayName": "My New Effect",
    "category": "Original Effects",
    "description": "Amazing visualization"
  }
}

// 2. Run generator
pnpm generate:webgl

// 3. Add shader to src/engines/webgl/shaders/
```

### Option 3: Backend (Twod Effect)
Backend effects auto-fetch from GitHub API - no manual addition needed!

---

## 🔗 Related Docs

- [WEBGL_GENERATION.md](WEBGL_GENERATION.md) - WebGL system deep dive
- [BACKEND-SCHEMA-GENERATION.md](BACKEND-SCHEMA-GENERATION.md) - Backend system deep dive
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall architecture
