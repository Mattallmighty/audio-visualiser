# WebGL Registry Auto-Generation

## 🎯 Overview

The WebGL visualizer registry is now **fully auto-generated** from a single JSON metadata file, eliminating manual duplication and ensuring type safety.

## 📁 Architecture

```
webgl-metadata.json                     ← Single source of truth
    ↓
scripts/generate-webgl-registry.ts      ← Generator script
    ↓
src/_generated/webgl/
    ├── registry.ts                     ← WebGLVisualiserId type + WEBGL_VISUALIZERS object
    └── index.ts                        ← Barrel export
    ↓
src/components/Visualisers/WebGLVisualiser.tsx    ← Imports generated type
src/webgl/registry.ts                             ← Imports generated registry
```

## 🔧 Usage

### Adding a New WebGL Visualizer

1. **Add entry to `webgl-metadata.json`:**

```json
{
  "visualizers": {
    "myneweffect": {
      "displayName": "My New Effect",
      "category": "Original Effects",
      "description": "Amazing new visualization",
      "aliases": ["amazing", "new"],
      "tags": ["3d", "particle", "audio-reactive"]
    }
  }
}
```

2. **Regenerate types:**

```bash
pnpm generate:webgl
# or just
pnpm generate  # (runs both schema + webgl generators)
```

3. **Implement shader:**

Add shader to `src/engines/webgl/shaders/effects.ts` and export from `index.ts`.

4. **Add case to WebGLVisualiser.tsx:**

```typescript
case 'myneweffect':
  drawCustom(gl, smoothedData, width, height)
  break
```

That's it! TypeScript will enforce type safety everywhere.

## 📊 Generated Files

### `src/_generated/webgl/registry.ts`

Exports:
- `WebGLVisualiserId` - Union type of all visualizer IDs
- `WebGLVisualizerMetadata` - Interface for metadata structure
- `WEBGL_VISUALIZERS` - Const object with all metadata
- `getWebGLVisualizerIds()` - Get all IDs as array
- `getWebGLVisualizerMetadata(id)` - Get metadata by ID
- `isWebGLVisualizer(id)` - Type guard

### Metadata Schema

Each visualizer entry requires:

```typescript
{
  displayName: string      // Human-readable name
  category: string         // Category for grouping
  description: string      // Brief description
  aliases?: string[]       // Alternative names for search
  tags?: string[]          // Searchable tags
}
```

## 🎨 Categories

Current categories:
- **Original Effects** - Custom frontend shaders (10)
- **2D Effects** - Simple 2D visualizations (4)
- **Matrix Effects** - LED matrix effects (14)

## 🔄 Build Integration

The generator runs automatically during:

- `pnpm dev` (via predev hook)
- `pnpm build` (via prebuild hook)
- `pnpm generate` (manually)
- `pnpm generate:webgl` (webgl only)

## 📈 Statistics

**Before Auto-Generation:**
- 🔴 Manual `WEBGL_VISUALIZERS` object (44 lines)
- 🔴 Manual `WebGLVisualisationType` union (28 lines)
- 🔴 Hardcoded aliases in `createDisplayNameMap()`
- ⚠️ Easy to get out of sync

**After Auto-Generation:**
- ✅ Single JSON source of truth
- ✅ Generated types & registry
- ✅ Automatic alias handling
- ✅ Never out of sync
- ✅ 28 visualizers tracked
- ✅ 3 categories
- ✅ Extensible with metadata

## 🚀 Benefits

1. **Single Source of Truth** - Edit one JSON file
2. **Type Safety** - TypeScript enforces correctness
3. **Auto-Sync** - Types always match metadata
4. **Rich Metadata** - Categories, tags, descriptions, aliases
5. **Searchability** - Aliases auto-registered for search
6. **Documentation** - Self-documenting via metadata
7. **Consistency** - Same pattern as schema-first visualizers

## 🔗 Related Systems

This complements the existing auto-generation systems:

1. **Schema-First Visualizers** (10) → `schemas/*.schema.ts` → `src/_generated/`
2. **Backend Twod Effects** (17) → GitHub API → `src/_generated/webgl/`
3. **WebGL Visualizers** (28) → `webgl-metadata.json` → `src/_generated/webgl/`

**Total:** 55 visualizers with zero manual duplication! 🎉

## 📚 Related Docs

- [GENERATORS.md](GENERATORS.md) - Overview of all 3 generator systems
- [BACKEND-SCHEMA-GENERATION.md](BACKEND-SCHEMA-GENERATION.md) - Backend effect generation
- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall project architecture
