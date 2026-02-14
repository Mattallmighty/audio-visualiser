/**
 * Post-build script
 * Copies build artifacts to frontend directory if it exists
 * (For local development only - won't fail in CI)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const copies = [
  {
    src: path.join(projectRoot, 'dist/yz-audio-visualiser.js'),
    dest: path.join(projectRoot, '../frontend/public/modules/yz-audio-visualiser.js')
  },
  {
    src: path.join(projectRoot, 'dist/audio-visualiser.d.ts'),
    dest: path.join(projectRoot, '../frontend/src/types/yz-audio-visualiser.d.ts')
  }
]

let copied = 0

for (const { src, dest } of copies) {
  try {
    // Check if source file exists
    if (!fs.existsSync(src)) {
      console.log(`⚠️  Source file not found: ${path.basename(src)}`)
      continue
    }

    // Check if destination directory exists
    const destDir = path.dirname(dest)
    if (!fs.existsSync(destDir)) {
      console.log(`ℹ️  Destination directory not found (this is normal for CI builds)`)
      continue
    }

    // Copy the file
    fs.copyFileSync(src, dest)
    console.log(`✅ Copied ${path.basename(src)} to frontend`)
    copied++
  } catch (error) {
    console.log(`⚠️  Could not copy ${path.basename(src)}: ${error.message}`)
  }
}

if (copied === 0) {
  console.log('ℹ️  No files copied to frontend (directory not found - this is normal for CI builds)')
}

// Always exit successfully (don't fail the build if frontend doesn't exist)
process.exit(0)
