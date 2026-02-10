# Backend Schema Generation System

## Overview

This project now automatically generates WebGL visualizer schemas from the LedFx Python backend at build time, eliminating 700+ lines of manually duplicated code.

## Architecture

### Source of Truth
**Backend Repository:** https://github.com/LedFx/LedFx  
**Source Files:** `ledfx/effects/*.py` (Voluptuous schemas)

### Generated Files
```
src/webgl/generated/
├── schemas.ts           ← UI form schemas (from CONFIG_SCHEMA)
├── defaults.ts          ← Default values (from vol.Optional defaults)
├── backend-mapping.ts   ← Frontend → backend name mapping
└── README.md            ← Generation docs
```

### Fallback Files (Manual)
```
src/webgl/
├── schemas.ts           ← Used when generation fails
├── defaults.ts          ← Used when generation fails
├── backend-mapping.ts   ← Used when generation fails
└── utils.ts             ← Always used (schema processing)
```

## Build Process

### Automatic (During Build)
```bash
pnpm build
  ├─ pnpm generate         # Generate schema-first visualizers
  └─ pnpm generate:backend # Generate WebGL from backend ← NEW!
```

### Manual (On-Demand)
```bash
# Regenerate from backend
pnpm generate:backend

# Full regeneration
pnpm generate && pnpm generate:backend
```

## How It Works

### 1. Fetch Python Files
Script fetches effect files from GitHub:
```
https://raw.githubusercontent.com/LedFx/LedFx/main/ledfx/effects/[effect].py
```

### 2. Parse Voluptuous Schemas
Extracts from Python:
```python
class Plasma2d(Twod, GradientEffect):
    HIDDEN_KEYS = ["background_color", ...]
    ADVANCED_KEYS = []
    
    CONFIG_SCHEMA = vol.Schema({
        vol.Optional(
            "density",
            description="kinda how small the plasma is",
            default=0.5,
        ): vol.All(vol.Coerce(float), vol.Range(min=0.001, max=2.0)),
    })
```

### 3. Generate TypeScript
Outputs TypeScript equivalents:
```typescript
export const VISUALISER_SCHEMAS: Record<string, any[]> = {
  plasma2d: [
    {
      id: 'density',
      title: 'Density',
      type: 'number',
      description: 'kinda how small the plasma is',
      min: 0.001,
      max: 2.0,
      step: 0.1
    }
  ]
}

export const DEFAULT_CONFIGS: Record<string, any> = {
  plasma2d: {
    density: 0.5,
    developer_mode: false
  }
}
```

## Parsed Features

### Type Mapping
| Python (Voluptuous) | TypeScript |
|---------------------|------------|
| `bool` | `boolean` |
| `vol.Coerce(int)` | `integer` |
| `vol.Coerce(float)` | `number` |
| `str` | `string` |
| `validate_color` | `color` |
| `vol.In([...])` | `string` with enum |

### Constraint Extraction
- **min/max:** From `vol.Range(min=X, max=Y)`
- **step:** Auto-calculated from range
- **default:** From `vol.Optional(..., default=VALUE)`
- **description:** From `description="..."` parameter

### Metadata Extraction
- **hidden_keys:** From `HIDDEN_KEYS = [...]`
- **advanced_keys:** From `ADVANCED_KEYS = [...]`

## Coverage

### Backend-Generated (21 effects)
✅ plasma2d, flame, gameoflife, digitalrain, equalizer2d, noise2d, blender, clone, bands, bandsmatrix, blocks, keybeat2d, texter, plasmawled2d, radial, soap, waterfall, gif, bleep, concentric, image

### Frontend-Only Shaders (7 effects) 
⚠️ bars3d, particles, waveform3d, radial3d, matrix, terrain, geometric
*(No backend equivalent - use manual fallback schemas)*

## Benefits

### Before
- ❌ 700 lines of manually duplicated schemas
- ❌ Manual sync between frontend/backend
- ❌ Schemas drift out of date
- ❌ Copy-paste errors

### After
- ✅ Single source of truth (Python backend)
- ✅ Automatic sync at build time
- ✅ Always up-to-date with backend
- ✅ Type-safe generation from runtime data

## Fallback Strategy

### When Generated Files Are Used
✅ Normal builds with network access  
✅ CI/CD pipelines  
✅ Production releases  

### When Manual Fallbacks Are Used
⚠️ GitHub API rate limit exceeded  
⚠️ Network unavailable  
⚠️ LedFx repo temporarily unavailable  
⚠️ Development without network  

## Maintenance

### Updating Schemas
1. Backend updates Python effect → commit to LedFx repo
2. Run `pnpm generate:backend` → fetches latest
3. Commit generated files → others get updates

### Adding New Effects
1. Add effect to backend Python
2. Map in `WEBGL_EFFECTS` in extract-backend-schemas.ts
3. Run `pnpm generate:backend`

### Frontend-Only Shaders
For pure frontend effects (no backend equivalent):
1. Add to `WEBGL_EFFECTS` with `null` value
2. Manually define in `src/webgl/schemas.ts` (fallback)
3. Script will skip with "frontend-only shader" message

## Files Changed

| File | Purpose | Lines Changed |
|------|---------|---------------|
| `scripts/extract-backend-schemas.ts` | NEW - Generation script | +400 |
| `package.json` | Added generate:backend script | +1 |
| `src/webgl/index.ts` | Import from generated/ | Modified |
| `src/webgl/generated/*.ts` | Generated TypeScript | +~1200 |
| `src/webgl/*.ts` | Marked as fallbacks | Headers |
| `src/visualizerConstants.ts` | DELETED | -707 |

## Result

**Before:** 707 lines of hardcoded duplicates  
**After:** Generated automatically from backend  
**Savings:** Eliminated duplicate maintenance burden  
**Quality:** Always in sync with backend truth  

---

**To regenerate schemas:** `pnpm generate:backend`

## 📚 Related Docs

- [GENERATORS.md](GENERATORS.md) - Overview of all 3 generator systems
- [WEBGL_GENERATION.md](WEBGL_GENERATION.md) - WebGL registry generation
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall project architecture
