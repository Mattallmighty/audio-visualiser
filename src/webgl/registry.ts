/**
 * Visualizer Registry Utilities
 * 
 * Provides helpers for working with the schema-based visualizer registry
 * and combining it with WebGL visualizers.
 */

import { VISUALIZER_REGISTRY, getVisualizerIds } from '../_generated'
import { type WebGLVisualisationType } from '../components/Visualisers'
import { WEBGL_VISUALIZERS } from '../_generated/webgl'

export type VisualisationType = WebGLVisualisationType | Extract<keyof typeof VISUALIZER_REGISTRY, string>

/**
 * Get all visualizer IDs in display order (WebGL + Schema-based)
 */
export function getAllVisualizerTypes(): VisualisationType[] {
  return [
    // WebGL visualizers
    ...Object.keys(WEBGL_VISUALIZERS),
    // Schema-based visualizers (sorted by category)
    ...getVisualizerIds().sort((a, b) => {
      const catA = VISUALIZER_REGISTRY[a]?.metadata?.category || ''
      const catB = VISUALIZER_REGISTRY[b]?.metadata?.category || ''
      return catA.localeCompare(catB)
    })
  ] as VisualisationType[]
}

/**
 * Get display name for any visualizer
 */
export function getVisualizerDisplayName(id: string): string {
  // Check schema registry first
  if (VISUALIZER_REGISTRY[id]) {
    return VISUALIZER_REGISTRY[id].displayName
  }
  
  // Check WebGL registry
  if (id in WEBGL_VISUALIZERS) {
    return WEBGL_VISUALIZERS[id as keyof typeof WEBGL_VISUALIZERS].displayName
  }
  
  // Fallback to ID
  return id
}

/**
 * Get category for any visualizer
 */
export function getVisualizerCategory(id: string): string {
  // Check schema registry first
  if (VISUALIZER_REGISTRY[id]?.metadata?.category) {
    return VISUALIZER_REGISTRY[id].metadata.category!
  }
  
  // Check WebGL registry
  if (id in WEBGL_VISUALIZERS) {
    return WEBGL_VISUALIZERS[id as keyof typeof WEBGL_VISUALIZERS].category
  }
  
  return 'Other'
}

/**
 * Get visualizers grouped by category
 */
export function getVisualizersByCategory(): Record<string, Array<{ id: string; displayName: string }>> {
  const grouped: Record<string, Array<{ id: string; displayName: string }>> = {}
  
  // Add WebGL visualizers
  Object.entries(WEBGL_VISUALIZERS).forEach(([id, meta]) => {
    if (!grouped[meta.category]) {
      grouped[meta.category] = []
    }
    grouped[meta.category].push({ id, displayName: meta.displayName })
  })
  
  // Add schema-based visualizers
  getVisualizerIds().forEach(id => {
    const category = VISUALIZER_REGISTRY[id]?.metadata?.category || 'Other'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push({ id, displayName: VISUALIZER_REGISTRY[id].displayName })
  })
  
  return grouped
}

/**
 * Create display name to ID mapping (for voice/text search)
 */
export function createDisplayNameMap(): Record<string, string> {
  const map: Record<string, string> = {}
  
  // WebGL visualizers
  Object.entries(WEBGL_VISUALIZERS).forEach(([id, meta]) => {
    map[meta.displayName.toLowerCase()] = id
    // Add aliases from metadata
    meta.aliases?.forEach(alias => {
      map[alias.toLowerCase()] = id
    })
  })
  
  // Schema-based visualizers
  getVisualizerIds().forEach(id => {
    const displayName = VISUALIZER_REGISTRY[id].displayName
    map[displayName.toLowerCase()] = id
    
    // Add schema-level aliases (legacy support)
    if (id === 'butterchurn') {
      map['milkdrop'] = id
      map['butterchurn (milkdrop)'] = id
    }
    if (id === 'astrofox') {
      map['astrofox (layers)'] = id
    }
  })
  
  return map
}

/**
 * Category display order
 */
export const CATEGORY_ORDER = [
  'Original Effects',
  '2D Effects',
  'Matrix Effects',
  'Preset Player',
  'Layer-Based',
  'Simulation',
  'Geometric',
  'Natural',
  'Retro',
  'Other'
]
