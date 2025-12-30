/**
 * Post-processing module index
 * Exports the Composer, ShaderPass base class, and all effect passes
 */

export { ShaderPass, fullscreenVertexShader } from './ShaderPass'
export type { ShaderDefinition, ShaderPassOptions } from './ShaderPass'

export { Composer } from './Composer'

// Export all passes
export * from './passes'
