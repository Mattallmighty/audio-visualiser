#!/usr/bin/env tsx
/**
 * Backend Schema Auto-Discovery
 * 
 * Automatically discovers all Twod-based 2D matrix effects from the LedFx backend
 * by fetching Python files from GitHub and parsing class definitions.
 * 
 * This eliminates hardcoded effect lists and automatically adapts when new Twod
 * effects are added to the backend. Effect names match backend filenames exactly.
 * 
 * Run: pnpm generate:backend
 */

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUTPUT_DIR = path.join(__dirname, '../src/_generated/webgl')
const CACHE_FILE = path.join(OUTPUT_DIR, '.backend-cache.json')
const GITHUB_API_BASE = 'https://api.github.com/repos/LedFx/LedFx/contents/ledfx/effects'

interface CacheEntry {
  sha: string
  content: string
  schema: EffectSchema
  lastFetched: string
}

interface CacheData {
  etag: string | null
  files: Record<string, CacheEntry>
}

/**
 * Frontend-only shaders that don't exist in backend
 * These are pure GLSL shaders without backend equivalents
 */
const FRONTEND_ONLY_SHADERS = [
  'bars3d',
  'particles',
  'waveform3d',
  'radial3d',
  'matrix',
  'terrain',
  'geometric',
]

interface SchemaField {
  id: string
  title: string
  type: 'string' | 'number' | 'integer' | 'boolean' | 'color'
  description?: string
  default?: any
  min?: number
  max?: number
  step?: number
  enum?: string[]
  gradient?: boolean
}

interface EffectSchema {
  name: string
  fields: SchemaField[]
  hiddenKeys: string[]
  advancedKeys: string[]
  defaults: Record<string, any>
}

interface GitHubFile {
  name: string
  path: string
  download_url: string
  type: string
}

/**
 * Load cache from disk
 */
async function loadCache(): Promise<CacheData> {
  try {
    if (await fs.pathExists(CACHE_FILE)) {
      return await fs.readJson(CACHE_FILE)
    }
  } catch (error) {
    console.log('⚠️  Cache file invalid, will rebuild')
  }
  return { etag: null, files: {} }
}

/**
 * Save cache to disk
 */
async function saveCache(cache: CacheData): Promise<void> {
  await fs.writeJson(CACHE_FILE, cache, { spaces: 2 })
}

/**
 * Fetch directory listing from GitHub API with ETag caching
 */
async function fetchGitHubDirectory(etag: string | null = null): Promise<{ files: GitHubFile[], etag: string | null, modified: boolean }> {
  console.log('📂 Checking effects directory on GitHub...')
  const headers: Record<string, string> = {}
  if (etag) {
    headers['If-None-Match'] = etag
  }
  
  const response = await fetch(GITHUB_API_BASE, { headers })
  
  // 304 Not Modified - nothing changed!
  if (response.status === 304) {
    console.log('✅ Directory unchanged (ETag match), using cache\n')
    return { files: [], etag, modified: false }
  }
  
  // Rate limit or other error - if we have an ETag, assume cache is valid
  if (!response.ok) {
    if ((response.status === 403 || response.status === 429) && etag) {
      console.log('⚠️  GitHub rate limit reached, using cached data\n')
      return { files: [], etag, modified: false }
    }
    throw new Error(`Failed to fetch directory: ${response.statusText}`)
  }
  
  const newEtag = response.headers.get('etag')
  const files = await response.json() as any[]
  
  const filteredFiles = files.filter((file: any) => 
    file.type === 'file' && 
    file.name.endsWith('.py') &&
    file.name !== '__init__.py' &&
    !file.name.startsWith('template')
  )
  
  console.log(`   Found ${filteredFiles.length} Python files\n`)
  return { files: filteredFiles, etag: newEtag, modified: true }
}

/**
 * Fetch directory listing from GitHub API
 */
async function fetchGitHubDirectoryLegacy(): Promise<GitHubFile[]> {
  console.log('📂 Fetching effects directory from GitHub API...')
  const response = await fetch(GITHUB_API_BASE)
  if (!response.ok) {
    throw new Error(`Failed to fetch directory: ${response.statusText}`)
  }
  
  const files = await response.json() as any[]
  return files.filter((file: any) => 
    file.type === 'file' && 
    file.name.endsWith('.py') &&
    file.name !== '__init__.py' &&
    !file.name.startsWith('template')  // Skip template files
  )
}

/**
 * Fetch Python file content from GitHub
 */
async function fetchGitHubFile(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`)
  }
  return response.text()
}

/**
 * Check if Python file defines a Twod-based effect
 * Looks for class definitions that inherit from Twod
 */
function isTwodEffect(content: string): boolean {
  // Matches: class XYZ(Twod) or class XYZ(Twod, ...) or class XYZ(..., Twod, ...)
  const classRegex = /class\s+\w+\([^)]*\bTwod\b[^)]*\):/
  return classRegex.test(content)
}

/**
 * Extract effect name from Python filename
 * Strips .py extension and preserves original naming (with underscores)
 */
function filenameToEffectName(filename: string): string {
  return filename.replace('.py', '')
}

/**
 * Parse Python effect file and extract schema information
 */
function parsePythonEffect(content: string, effectName: string): EffectSchema {
  const fields: SchemaField[] = []
  const defaults: Record<string, any> = { developer_mode: false }
  let hiddenKeys: string[] = []
  let advancedKeys: string[] = []

  // Extract HIDDEN_KEYS
  const hiddenKeysMatch = content.match(/HIDDEN_KEYS\s*=\s*.*?\[([^\]]+)\]/s)
  if (hiddenKeysMatch) {
    hiddenKeys = hiddenKeysMatch[1]
      .split(',')
      .map(k => k.trim().replace(/['"]/g, ''))
      .filter(k => k && k !== '...')
  }

  // Extract ADVANCED_KEYS
  const advancedKeysMatch = content.match(/ADVANCED_KEYS\s*=\s*.*?\[([^\]]+)\]/s)
  if (advancedKeysMatch) {
    advancedKeys = advancedKeysMatch[1]
      .split(',')
      .map(k => k.trim().replace(/['"]/g, ''))
      .filter(k => k && k !== '...')
  }

  // Extract CONFIG_SCHEMA fields
  // Match vol.Optional blocks
  const optionalRegex = /vol\.Optional\s*\(\s*["']([^"']+)["']\s*,\s*description\s*=\s*["']([^"']*)["']\s*(?:,\s*default\s*=\s*([^)]+))?\s*\)\s*:\s*([^,]+)/gs

  let match
  while ((match = optionalRegex.exec(content)) !== null) {
    const [, id, description, defaultValue, validator] = match
    
    // Parse validator to determine type and constraints
    const field = parseValidator(id, description, defaultValue, validator.trim())
    if (field) {
      fields.push(field)
      defaults[id] = field.default
    }
  }

  // Add developer_mode if not present (common to all effects)
  if (!fields.find(f => f.id === 'developer_mode')) {
    fields.push({
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean',
      default: false
    })
    defaults.developer_mode = false
  }

  return {
    name: effectName,
    fields,
    hiddenKeys,
    advancedKeys,
    defaults
  }
}

/**
 * Parse voluptuous validator to determine field type and constraints
 */
function parseValidator(id: string, description: string, defaultValue: string | undefined, validator: string): SchemaField | null {
  const field: SchemaField = {
    id,
    title: id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    type: 'string',
    description
  }

  // Parse default value - clean up trailing commas and whitespace
  if (defaultValue) {
    defaultValue = defaultValue.trim().replace(/,$/, '').trim()
    
    if (defaultValue === 'True') {
      field.default = true
    } else if (defaultValue === 'False') {
      field.default = false
    } else if (defaultValue.startsWith('"') || defaultValue.startsWith("'")) {
      field.default = defaultValue.slice(1, -1)
    } else if (!isNaN(Number(defaultValue)) && defaultValue !== '') {
      field.default = Number(defaultValue)
    } else if (defaultValue.startsWith('#')) {
      // Color hex value
      field.default = defaultValue
    } else if (defaultValue.includes('.value')) {
      // Enum reference like HealthOptions.ALL.value - extract the enum name
      const enumMatch = defaultValue.match(/\.([A-Z]+)\.value/)
      field.default = enumMatch ? enumMatch[1].toLowerCase() : defaultValue
    } else {
      // Keep as string, strip quotes if present
      field.default = defaultValue.replace(/^["']|["']$/g, '')
    }
  }

  // Parse validator type
  if (validator === 'bool') {
    field.type = 'boolean'
    field.default = field.default ?? false
  } else if (validator.includes('validate_color')) {
    field.type = 'color'
    field.gradient = false
    field.default = field.default ?? '#000000'
  } else if (validator.includes('validate_gradient')) {
    field.type = 'color'
    field.gradient = true
  } else if (validator.includes('vol.In')) {
    // Enum type
    field.type = 'string'
    // Could extract enum values but complex - leave as string for now
  } else if (validator.includes('vol.Coerce(float)') || validator.includes('vol.Coerce(int)')) {
    // Number type with range
    field.type = validator.includes('vol.Coerce(int)') ? 'integer' : 'number'
    
    const rangeMatch = validator.match(/vol\.Range\s*\(\s*min\s*=\s*([^,\s)]+)(?:\s*,\s*max\s*=\s*([^,\s)]+))?\s*\)/)
    if (rangeMatch) {
      field.min = Number(rangeMatch[1])
      if (rangeMatch[2]) {
        field.max = Number(rangeMatch[2])
      }
      
      // Calculate step based on range and type
      if (field.type === 'integer') {
        field.step = 1
      } else {
        const range = (field.max ?? 10) - (field.min ?? 0)
        field.step = range > 10 ? 1 : range > 1 ? 0.1 : 0.01
      }
    }
    
    // Ensure default is a number
    if (typeof field.default === 'string') {
      field.default = Number(field.default) || (field.min ?? 0)
    }
    field.default = field.default ?? (field.min ?? 0)
  }

  return field
}

/**
 * Generate TypeScript schema definitions file
 */
function generateSchemasFile(schemas: Record<string, EffectSchema>): string {
  let output = `/**
 * WebGL Visualizer UI Schemas (Auto-Generated from Backend)
 * 
 * ⚠️ AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: https://github.com/LedFx/LedFx/tree/main/ledfx/effects
 * 
 * Effect names match backend Python filenames for consistency.
 * All Twod-based 2D matrix effects are auto-discovered.
 * 
 * Run \`pnpm generate:backend\` to regenerate.
 */

export const VISUALISER_SCHEMAS: Record<string, any[]> = {\n`

  for (const [key, schema] of Object.entries(schemas)) {
    output += `  "${key}": [\n`
    
    for (const field of schema.fields) {
      output += `    {\n`
      output += `      id: '${field.id}',\n`
      output += `      title: '${field.title}',\n`
      output += `      type: '${field.type}'`
      
      if (field.description) {
        output += `,\n      description: '${field.description}'`
      }
      if (field.min !== undefined) {
        output += `,\n      min: ${field.min}`
      }
      if (field.max !== undefined) {
        output += `,\n      max: ${field.max}`
      }
      if (field.step !== undefined) {
        output += `,\n      step: ${field.step}`
      }
      if (field.enum) {
        output += `,\n      enum: ${JSON.stringify(field.enum)}`
      }
      if (field.gradient !== undefined) {
        output += `,\n      gradient: ${field.gradient}`
      }
      
      output += `\n    },\n`
    }
    
    output += `  ],\n`
  }

  output += `}\n`
  return output
}

/**
 * Generate TypeScript defaults file
 */
function generateDefaultsFile(schemas: Record<string, EffectSchema>): string {
  let output = `/**
 * WebGL Visualizer Default Configurations (Auto-Generated from Backend)
 * 
 * ⚠️ AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: https://github.com/LedFx/LedFx/tree/main/ledfx/effects
 * 
 * Effect names match backend Python filenames for consistency.
 * All Twod-based 2D matrix effects are auto-discovered.
 * 
 * Run \`pnpm generate:backend\` to regenerate.
 */

export const DEFAULT_CONFIGS: Record<string, any> = {\n`

  for (const [key, schema] of Object.entries(schemas)) {
    output += `  "${key}": ${JSON.stringify(schema.defaults, null, 2).replace(/\n/g, '\n  ')},\n`
  }

  output += `}\n`
  return output
}

/**
 * Generate backend mapping file
 * Now 1:1 mapping since frontend names match backend filenames
 */
function generateBackendMappingFile(schemas: Record<string, EffectSchema>): string {
  const backendMapping: Record<string, string> = {}
  
  for (const effectName of Object.keys(schemas)) {
    // Effect name IS the backend name (no transformation needed)
    backendMapping[effectName] = effectName
  }

  const output = `/**
 * WebGL to Backend Effect Mapping (Auto-Generated)
 * 
 * ⚠️ AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: https://github.com/LedFx/LedFx/tree/main/ledfx/effects
 * 
 * This is now a 1:1 mapping since frontend effect names match backend filenames.
 * Effect names are preserved exactly as they appear in the backend (e.g., game_of_life, flame2d).
 * 
 * Run \`pnpm generate:backend\` to regenerate.
 */

export const VISUAL_TO_BACKEND_EFFECT: Record<string, string> = ${JSON.stringify(backendMapping, null, 2)}
`

  return output
}

/**
 * Main execution - Auto-discover and generate
 */
async function main() {
  console.log('🔄 Auto-discovering Twod effects from LedFx backend...\n')

  fs.ensureDirSync(OUTPUT_DIR)
  
  const schemas: Record<string, EffectSchema> = {}
  let processed = 0
  let cached = 0
  let skipped = 0

  try {
    // Load cache
    const cache = await loadCache()
    
    // Fetch directory listing with ETag
    const { files, etag, modified } = await fetchGitHubDirectory(cache.etag)
    
    // If directory hasn't changed and we have cache, use it entirely
    if (!modified && Object.keys(cache.files).length > 0) {
      console.log('📦 Using cached schemas (no changes detected)\n')
      for (const [effectName, entry] of Object.entries(cache.files)) {
        schemas[effectName] = entry.schema
        cached++
      }
    } else {
      // Directory changed or cache empty - process files
      const newCache: CacheData = { etag: etag || cache.etag, files: {} }
      
      for (const file of files) {
        const effectName = filenameToEffectName(file.name)
        
        try {
          // Check if file unchanged in cache (by SHA)
          const cachedEntry = cache.files[effectName]
          if (cachedEntry && cachedEntry.sha === (file as any).sha) {
            console.log(`📦 ${effectName} (cached)`)
            schemas[effectName] = cachedEntry.schema
            newCache.files[effectName] = cachedEntry
            cached++
            continue
          }
          
          // File changed or new - fetch it
          console.log(`Fetching: ${file.download_url}`)
          const content = await fetchGitHubFile(file.download_url)
          
          // Check if this is a Twod-based effect
          if (!isTwodEffect(content)) {
            console.log(`⏭️  Skipping ${file.name} (not a Twod effect)`)
            skipped++
            continue
          }
          
          // Parse the effect schema
          const schema = parsePythonEffect(content, effectName)
          schemas[effectName] = schema
          
          // Cache it
          newCache.files[effectName] = {
            sha: (file as any).sha,
            content,
            schema,
            lastFetched: new Date().toISOString()
          }
          
          processed++
          console.log(`✅ Discovered ${effectName}`)
          
        } catch (error) {
          console.error(`❌ Failed to process ${file.name}:`, error)
          skipped++
        }
      }
      
      // Save updated cache
      await saveCache(newCache)
    }

    // Report statistics
    console.log(`\n📊 Discovery Summary:`)
    console.log(`   ✅ Generated: ${processed} new`)
    console.log(`   📦 Cached: ${cached} unchanged`)
    console.log(`   ⏭️  Skipped: ${skipped} files`)
    console.log(`   📝 Frontend-only: ${FRONTEND_ONLY_SHADERS.length} shaders (${FRONTEND_ONLY_SHADERS.join(', ')})`)

    // Generate TypeScript files
    console.log('\n📝 Generating TypeScript files...')
    
    const schemasContent = generateSchemasFile(schemas)
    const defaultsContent = generateDefaultsFile(schemas)
    const mappingContent = generateBackendMappingFile(schemas)

    await fs.writeFile(path.join(OUTPUT_DIR, 'schemas.ts'), schemasContent)
    await fs.writeFile(path.join(OUTPUT_DIR, 'defaults.ts'), defaultsContent)
    await fs.writeFile(path.join(OUTPUT_DIR, 'backend-mapping.ts'), mappingContent)

    console.log(`✅ Generated ${Object.keys(schemas).length} effect schemas`)
    console.log(`   Output: ${path.relative(process.cwd(), OUTPUT_DIR)}`)

    console.log('\n🎉 Auto-discovery complete!')
    if (cached > 0) {
      console.log(`   ⚡ Cached ${cached} effects (no GitHub requests!)`)
    }
    console.log('   New Twod effects in backend will be automatically discovered!')
    
  } catch (error) {
    console.error('\n❌ Fatal error during auto-discovery:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
