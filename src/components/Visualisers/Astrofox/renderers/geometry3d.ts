import type { Geometry3DLayer } from '../../../../engines/astrofox/types'
import { getCompositeOperation } from '../../../../engines/astrofox/types'

type AudioDataArray = number[] | Float32Array

interface GeometryData {
  vertices: [number, number, number][]
  edges: [number, number][]
  faces: [number, number, number][]
}

type GeometryBuffer = { current: { transformed: Float32Array; projected: Float32Array } | null }

// Helper to get cached geometry data
export function getGeometryData(shape: string, size: number, cache: Map<string, GeometryData>): GeometryData {
  const cacheKey = `${shape}-${size}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  let vertices: [number, number, number][] = []
  let edges: [number, number][] = []
  let faces: [number, number, number][] = [] // Triangle indices for solid rendering
  const s = size / 2

  switch (shape) {
    case 'Box':
      vertices = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
      ]
      edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ]
      // Box faces (2 triangles per face, 6 faces)
      faces = [
        [0, 1, 2], [0, 2, 3], // Front
        [4, 6, 5], [4, 7, 6], // Back
        [0, 4, 5], [0, 5, 1], // Bottom
        [2, 6, 7], [2, 7, 3], // Top
        [0, 3, 7], [0, 7, 4], // Left
        [1, 5, 6], [1, 6, 2]  // Right
      ]
      break
    case 'Sphere': {
      const t = (1 + Math.sqrt(5)) / 2
      const r = s * 0.7
      vertices = [
        [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
        [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
        [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
      ].map(([x, y, z]) => [x * r / t, y * r / t, z * r / t] as [number, number, number])
      edges = [
        [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
        [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
        [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
        [4, 9], [2, 4], [6, 2], [8, 6], [9, 8],
        [4, 5], [2, 11], [6, 10], [8, 7], [9, 1]
      ]
      // Icosahedron faces (20 triangles)
      faces = [
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
        [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
        [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
      ]
      break
    }
    case 'Dodecahedron': {
      const phi = (1 + Math.sqrt(5)) / 2
      const r = s * 0.5
      vertices = [
        [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
        [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
        [0, phi, 1/phi], [0, phi, -1/phi], [0, -phi, 1/phi], [0, -phi, -1/phi],
        [1/phi, 0, phi], [1/phi, 0, -phi], [-1/phi, 0, phi], [-1/phi, 0, -phi],
        [phi, 1/phi, 0], [phi, -1/phi, 0], [-phi, 1/phi, 0], [-phi, -1/phi, 0]
      ].map(([x, y, z]) => [x * r, y * r, z * r] as [number, number, number])
      edges = [
        [0, 16], [0, 8], [0, 12], [16, 17], [16, 1],
        [8, 4], [8, 9], [12, 2], [12, 14], [17, 2],
        [1, 9], [4, 14], [9, 5], [5, 18], [18, 4],
        [14, 6], [6, 19], [19, 18], [2, 10], [10, 6],
        [17, 3], [3, 11], [11, 10], [1, 13], [13, 3],
        [5, 15], [15, 13], [15, 7], [7, 19], [7, 11]
      ]
      // Dodecahedron faces (12 pentagons triangulated = 36 triangles)
      // Each pentagon split into 3 triangles
      faces = [
        [0, 8, 4], [0, 4, 14], [0, 14, 12], // Pentagon 1
        [0, 12, 2], [0, 2, 17], [0, 17, 16], // Pentagon 2
        [0, 16, 1], [0, 1, 9], [0, 9, 8], // Pentagon 3
        [8, 9, 5], [8, 5, 18], [8, 18, 4], // Pentagon 4
        [4, 18, 19], [4, 19, 6], [4, 6, 14], // Pentagon 5
        [14, 6, 10], [14, 10, 2], [14, 2, 12], // Pentagon 6
        [2, 10, 11], [2, 11, 3], [2, 3, 17], // Pentagon 7
        [17, 3, 13], [17, 13, 1], [17, 1, 16], // Pentagon 8
        [1, 13, 15], [1, 15, 5], [1, 5, 9], // Pentagon 9
        [5, 15, 7], [5, 7, 19], [5, 19, 18], // Pentagon 10
        [19, 7, 11], [19, 11, 10], [19, 10, 6], // Pentagon 11
        [7, 15, 13], [7, 13, 3], [7, 3, 11] // Pentagon 12
      ]
      break
    }
    case 'Icosahedron': {
      const phi = (1 + Math.sqrt(5)) / 2
      const r = s * 0.6
      vertices = [
        [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
        [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
        [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
      ].map(([x, y, z]) => [x * r, y * r, z * r] as [number, number, number])
      edges = [
        [0, 1], [0, 4], [0, 5], [0, 8], [0, 9],
        [1, 6], [1, 7], [1, 8], [1, 9],
        [2, 3], [2, 4], [2, 5], [2, 10], [2, 11],
        [3, 6], [3, 7], [3, 10], [3, 11],
        [4, 5], [4, 8], [4, 10], [5, 9], [5, 11],
        [6, 7], [6, 8], [6, 10], [7, 9], [7, 11],
        [8, 10], [9, 11]
      ]
      // Icosahedron faces (20 triangles)
      faces = [
        [0, 8, 1], [0, 4, 8], [0, 5, 4], [0, 9, 5], [0, 1, 9],
        [1, 8, 6], [8, 4, 10], [4, 5, 2], [5, 9, 11], [9, 1, 7],
        [6, 8, 10], [10, 4, 2], [2, 5, 11], [11, 9, 7], [7, 1, 6],
        [3, 6, 10], [3, 10, 2], [3, 2, 11], [3, 11, 7], [3, 7, 6]
      ]
      break
    }
    case 'Octahedron':
      vertices = [
        [s, 0, 0], [-s, 0, 0],
        [0, s, 0], [0, -s, 0],
        [0, 0, s], [0, 0, -s]
      ]
      edges = [
        [0, 2], [0, 3], [0, 4], [0, 5],
        [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 4], [2, 5], [3, 4], [3, 5]
      ]
      // Octahedron faces (8 triangles)
      faces = [
        [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
        [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]
      ]
      break
    case 'Tetrahedron':
      vertices = [
        [s, s, s], [s, -s, -s], [-s, s, -s], [-s, -s, s]
      ]
      edges = [
        [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]
      ]
      // Tetrahedron faces (4 triangles)
      faces = [
        [0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]
      ]
      break
    case 'Torus': {
      const segments = 16
      const rings = 12
      const outerR = s * 0.6
      const innerR = s * 0.25
      vertices = []
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        for (let j = 0; j < rings; j++) {
          const phi = (j / rings) * Math.PI * 2
          const x = (outerR + innerR * Math.cos(phi)) * Math.cos(theta)
          const y = innerR * Math.sin(phi)
          const z = (outerR + innerR * Math.cos(phi)) * Math.sin(theta)
          vertices.push([x, y, z])
        }
      }
      edges = []
      faces = []
      for (let i = 0; i < segments; i++) {
        for (let j = 0; j < rings; j++) {
          const current = i * rings + j
          const nextJ = i * rings + ((j + 1) % rings)
          const nextI = ((i + 1) % segments) * rings + j
          const nextIJ = ((i + 1) % segments) * rings + ((j + 1) % rings)
          edges.push([current, nextJ])
          edges.push([current, nextI])
          // Add faces (2 triangles per quad)
          faces.push([current, nextI, nextIJ])
          faces.push([current, nextIJ, nextJ])
        }
      }
      break
    }
    case 'Torus Knot': {
      // Torus knot is a curve, not a surface - wireframe only
      const segments = 64
      const p = 2, q = 3
      const radius = s * 0.5
      vertices = []
      for (let i = 0; i < segments; i++) {
        const t = (i / segments) * Math.PI * 2
        const r = radius * (2 + Math.cos(q * t))
        const x = r * Math.cos(p * t)
        const y = radius * Math.sin(q * t) * 1.5
        const z = r * Math.sin(p * t)
        vertices.push([x, y, z])
      }
      edges = []
      for (let i = 0; i < segments; i++) {
        edges.push([i, (i + 1) % segments])
      }
      // No faces for torus knot (it's a curve, not a surface)
      faces = []
      break
    }
    default:
      vertices = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
      ]
      edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ]
      faces = [
        [0, 1, 2], [0, 2, 3], // Front
        [4, 6, 5], [4, 7, 6], // Back
        [0, 4, 5], [0, 5, 1], // Bottom
        [2, 6, 7], [2, 7, 3], // Top
        [0, 3, 7], [0, 7, 4], // Left
        [1, 5, 6], [1, 6, 2]  // Right
      ]
  }

  const result = { vertices, edges, faces }
  cache.set(cacheKey, result)
  return result
}

// Helper to parse hex color to RGB
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255]
}

// 3D Geometry rendering with solid faces and shading
export function renderGeometry3D(
  ctx: CanvasRenderingContext2D,
  layer: Geometry3DLayer,
  data: AudioDataArray,
  centerX: number,
  centerY: number,
  geometryCache: Map<string, GeometryData>,
  geometryBuffer: GeometryBuffer
): void {
  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i]
  const avgAmplitude = data.length > 0 ? sum / data.length : 0
  const audioRotation = layer.audioReactive ? avgAmplitude * 2 : 0

  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  // Get cached geometry
  const { vertices, edges, faces } = getGeometryData(layer.shape, layer.size, geometryCache)

  // Precompute rotation values
  const rotX = ((layer.rotationX + audioRotation * 50) * Math.PI) / 180
  const rotY = ((layer.rotationY + audioRotation * 30) * Math.PI) / 180
  const rotZ = ((layer.rotationZ + audioRotation * 20) * Math.PI) / 180
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
  const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ)

  // Transform and project all vertices
  if (!geometryBuffer.current || geometryBuffer.current.transformed.length !== vertices.length * 3) {
    geometryBuffer.current = {
      transformed: new Float32Array(vertices.length * 3),
      projected: new Float32Array(vertices.length * 2)
    }
  }
  const transformed = geometryBuffer.current.transformed
  const projected = geometryBuffer.current.projected

  for (let i = 0; i < vertices.length; i++) {
    const [vx, vy, vz] = vertices[i]
    // Rotate around X
    const y1 = vy * cosX - vz * sinX
    const z1 = vy * sinX + vz * cosX
    // Rotate around Y
    const x2 = vx * cosY + z1 * sinY
    const z2 = -vx * sinY + z1 * cosY
    // Rotate around Z
    const x3 = x2 * cosZ - y1 * sinZ
    const y3 = x2 * sinZ + y1 * cosZ

    const tIdx = i * 3
    transformed[tIdx] = x3
    transformed[tIdx + 1] = y3
    transformed[tIdx + 2] = z2

    // Perspective projection
    const scale = 400 / (400 + z2)
    const pIdx = i * 2
    projected[pIdx] = x3 * scale
    projected[pIdx + 1] = y3 * scale
  }

  // Light direction (from top-right-front)
  const lightDir: [number, number, number] = [0.5, -0.7, 0.5]
  const lightLen = Math.sqrt(lightDir[0] * lightDir[0] + lightDir[1] * lightDir[1] + lightDir[2] * lightDir[2])
  lightDir[0] /= lightLen
  lightDir[1] /= lightLen
  lightDir[2] /= lightLen

  // Parse base color
  const [baseR, baseG, baseB] = hexToRgb(layer.color)

  // Solid rendering with faces
  if (!layer.wireframe && faces.length > 0) {
    // Calculate face data for sorting
    const faceData: { idx: number; depth: number; nx: number; ny: number; nz: number }[] = []

    for (let i = 0; i < faces.length; i++) {
      const [i0, i1, i2] = faces[i]
      const v0x = transformed[i0 * 3], v0y = transformed[i0 * 3 + 1], v0z = transformed[i0 * 3 + 2]
      const v1x = transformed[i1 * 3], v1y = transformed[i1 * 3 + 1], v1z = transformed[i1 * 3 + 2]
      const v2x = transformed[i2 * 3], v2y = transformed[i2 * 3 + 1], v2z = transformed[i2 * 3 + 2]

      // Calculate face normal (cross product)
      const ax = v1x - v0x, ay = v1y - v0y, az = v1z - v0z
      const bx = v2x - v0x, by = v2y - v0y, bz = v2z - v0z
      const nx = ay * bz - az * by
      const ny = az * bx - ax * bz
      const nz = ax * by - ay * bx
      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz)
      const fnx = nLen > 0 ? nx / nLen : 0
      const fny = nLen > 0 ? ny / nLen : 0
      const fnz = nLen > 0 ? nz / nLen : 1

      // Backface culling - skip faces pointing away
      if (fnz < 0) continue

      // Average depth for sorting
      const depth = (v0z + v1z + v2z) / 3

      faceData.push({ idx: i, depth, nx: fnx, ny: fny, nz: fnz })
    }

    // Sort faces by depth (far to near)
    faceData.sort((a, b) => a.depth - b.depth)

    // Render faces
    for (const face of faceData) {
      const [i0, i1, i2] = faces[face.idx]
      const p0x = projected[i0 * 2], p0y = projected[i0 * 2 + 1]
      const p1x = projected[i1 * 2], p1y = projected[i1 * 2 + 1]
      const p2x = projected[i2 * 2], p2y = projected[i2 * 2 + 1]

      // Calculate lighting based on material type
      let intensity = 0.3 // Ambient
      const { nx, ny, nz } = face
      const diffuse = Math.max(0, nx * lightDir[0] + ny * lightDir[1] + nz * lightDir[2])

      switch (layer.material) {
        case 'Basic':
          intensity = 1
          break
        case 'Lambert':
          intensity = 0.3 + diffuse * 0.7
          break
        case 'Phong':
        case 'Standard': {
          const spec = Math.pow(Math.max(0, nz), 32)
          intensity = 0.3 + diffuse * 0.5 + spec * 0.4
          break
        }
        case 'Normal':
          ctx.fillStyle = `rgb(${Math.floor((nx + 1) * 127.5)}, ${Math.floor((ny + 1) * 127.5)}, ${Math.floor((nz + 1) * 127.5)})`
          break
        default:
          intensity = 0.3 + diffuse * 0.7
      }

      // Apply shading boost for smooth
      if (layer.shading === 'Smooth') {
        intensity = Math.min(1, intensity * 1.1)
      }

      // Set fill color
      if (layer.material !== 'Normal') {
        const r = Math.min(255, Math.floor(baseR * intensity))
        const g = Math.min(255, Math.floor(baseG * intensity))
        const b = Math.min(255, Math.floor(baseB * intensity))
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      }

      // Draw filled triangle
      ctx.beginPath()
      ctx.moveTo(p0x, p0y)
      ctx.lineTo(p1x, p1y)
      ctx.lineTo(p2x, p2y)
      ctx.closePath()
      ctx.fill()

      // Draw edges if enabled
      if (layer.edges) {
        ctx.strokeStyle = layer.edgeColor
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }
  } else {
    // Wireframe mode
    ctx.strokeStyle = layer.color
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < edges.length; i++) {
      const [i1, i2] = edges[i]
      const p1x = projected[i1 * 2], p1y = projected[i1 * 2 + 1]
      const p2x = projected[i2 * 2], p2y = projected[i2 * 2 + 1]
      ctx.moveTo(p1x, p1y)
      ctx.lineTo(p2x, p2y)
    }
    ctx.stroke()
  }

  ctx.restore()
}
