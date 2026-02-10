#!/usr/bin/env tsx
/**
 * WebGL Registry Generator
 * 
 * Auto-generates TypeScript types and registry from webgl-metadata.json
 * Eliminates manual sync between WEBGL_VISUALIZERS object and WebGLVisualisationType.
 * 
 * Run: pnpm generate:webgl
 */

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const METADATA_FILE = path.join(__dirname, '../webgl-metadata.json')
const OUTPUT_DIR = path.join(__dirname, '../src/_generated/webgl')

interface VisualizerMetadata {
  displayName: string
  category: string
  description: string
  aliases?: string[]
  tags?: string[]
}

interface WebGLMetadata {
  $schema: string
  description: string
  visualizers: Record<string, VisualizerMetadata>
}

/**
 * Load and parse metadata JSON
 */
function loadMetadata(): WebGLMetadata {
  const content = fs.readFileSync(METADATA_FILE, 'utf-8')
  return JSON.parse(content)
}

/**
 * Generate TypeScript union type for visualizer IDs
 */
function generateTypes(metadata: WebGLMetadata): string {
  const ids = Object.keys(metadata.visualizers)
  
  return `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Run: pnpm generate:webgl
 */

/**
 * WebGL Visualizer Type
 * All available frontend-only GLSL shader visualizers
 */
export type WebGLVisualiserId =
${ids.map(id => `  | '${id}'`).join('\n')}

/**
 * WebGL Visualizer Metadata Entry
 */
export interface WebGLVisualizerMetadata {
  displayName: string
  category: string
  description: string
  aliases?: string[]
  tags?: string[]
}

/**
 * WebGL Visualizers Registry
 * Maps visualizer ID to metadata
 */
export const WEBGL_VISUALIZERS: Record<WebGLVisualiserId, WebGLVisualizerMetadata> = ${JSON.stringify(metadata.visualizers, null, 2)} as const

/**
 * Get all WebGL visualizer IDs
 */
export function getWebGLVisualizerIds(): WebGLVisualiserId[] {
  return Object.keys(WEBGL_VISUALIZERS) as WebGLVisualiserId[]
}

/**
 * Get visualizer metadata by ID
 */
export function getWebGLVisualizerMetadata(id: string): WebGLVisualizerMetadata | undefined {
  return WEBGL_VISUALIZERS[id as WebGLVisualiserId]
}

/**
 * Check if an ID is a valid WebGL visualizer
 */
export function isWebGLVisualizer(id: string): id is WebGLVisualiserId {
  return id in WEBGL_VISUALIZERS
}
`
}

/**
 * Generate barrel export
 */
function generateIndex(): string {
  return `/**
 * AUTO-GENERATED - DO NOT EDIT
 * WebGL Registry Exports
 * Run: pnpm generate:webgl
 */

export * from './registry'
`
}

/**
 * Main generator
 */
async function main() {
  console.log('🎨 WebGL Registry Generator')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Ensure output directory exists
  fs.ensureDirSync(OUTPUT_DIR)
  
  // Load metadata
  console.log('📖 Reading webgl-metadata.json...')
  const metadata = loadMetadata()
  
  const count = Object.keys(metadata.visualizers).length
  console.log(`✓ Found ${count} WebGL visualizers`)
  
  // Generate files
  console.log('\n📝 Generating TypeScript files...')
  
  const registryContent = generateTypes(metadata)
  const registryPath = path.join(OUTPUT_DIR, 'registry.ts')
  fs.writeFileSync(registryPath, registryContent)
  console.log(`✓ Generated registry.ts`)
  
  const indexContent = generateIndex()
  const indexPath = path.join(OUTPUT_DIR, 'index.ts')
  fs.writeFileSync(indexPath, indexContent)
  console.log(`✓ Generated index.ts`)
  
  // Summary
  console.log('\n🎉 WebGL registry generation complete!')
  console.log(`   Output: src/_generated/webgl/`)
  console.log(`   ${count} visualizers registered`)
  
  // Category breakdown
  const categories = new Set(Object.values(metadata.visualizers).map(v => v.category))
  console.log(`   ${categories.size} categories: ${[...categories].join(', ')}`)
}

main().catch(error => {
  console.error('❌ Generation failed:', error)
  process.exit(1)
})
