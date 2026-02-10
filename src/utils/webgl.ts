/**
 * WebGL Configuration Utilities
 * 
 * Utility functions for processing WebGL effect schemas and properties.
 * Used by ConfigurationPanel to order and filter backend schema properties.
 */

// Order effect properties same as EffectsComplex
const configOrder = ['color', 'number', 'integer', 'string', 'boolean']

/**
 * Orders and filters effect properties from a backend schema.
 * 
 * @param schema - Backend effect schema (from /api/schema)
 * @param hidden_keys - Keys to always hide
 * @param advanced_keys - Keys to show only in advanced mode
 * @param advanced - Whether advanced mode is enabled
 * @returns Ordered array of property objects
 */
export const orderEffectProperties = (
  schema: any,
  hidden_keys?: string[],
  advanced_keys?: string[],
  advanced?: boolean
) => {
  if (!schema || !schema.properties) return []
  
  const properties: any[] = Object.keys(schema.properties)
    .filter((k) => {
      if (hidden_keys && hidden_keys.length > 0) {
        return hidden_keys?.indexOf(k) === -1
      }
      return true
    })
    .filter((ke) => {
      if (advanced_keys && advanced_keys.length > 0 && !advanced) {
        return advanced_keys?.indexOf(ke) === -1
      }
      return true
    })
    .map((sk) => ({
      ...schema.properties[sk],
      id: sk
    }))
  
  const ordered = [] as any[]
  configOrder.forEach((type) => {
    ordered.push(...properties.filter((x) => x.type === type))
  })
  ordered.push(...properties.filter((x) => !configOrder.includes(x.type)))
  
  return ordered
    .sort((a) => (a.id === 'advanced' ? 1 : -1))
    .sort((a) => (a.type === 'string' && a.enum && a.enum.length ? -1 : 1))
    .sort((a) => (a.type === 'number' ? -1 : 1))
}
