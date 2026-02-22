/**
 * Particle Field Renderer
 *
 * Renders a particle field as soft circular dots (not squares).
 * Supports three movement modes:
 *   centreOut  – particles radiate outward from the centre (Vizzy-style, default)
 *   rotateBeat – particles orbit the centre; audio beats pulse speed
 *   leftToRight – particles drift left-to-right across the canvas
 *
 * Audio reactivity: size/opacity shimmer based on selected frequency bands.
 */

import * as THREE from 'three'
import { Three3DRenderer, type Three3DRendererConfig } from './Three3DRenderer'
import type { FrequencyBands } from '../../utils/AudioSmoother'
import { getAudioValueFromBands, type FrequencyBand } from '../../utils/AudioSmoother'

export interface ParticleFieldConfig extends Three3DRendererConfig {
  particleCount: number
  particleSize: number
  particleColor: string
  speed: number
  depth: number
  frequencyBands: FrequencyBand[]
  audioSensitivity: number
  direction: 'centreOut' | 'rotateBeat' | 'leftToRight'
}

/**
 * Build a soft circular sprite texture on a small canvas.
 * This replaces the default square point sprites in Three.js.
 */
function createCircleTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const centre = size / 2
  const gradient = ctx.createRadialGradient(centre, centre, 0, centre, centre, centre)
  gradient.addColorStop(0.0, 'rgba(255,255,255,1.0)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.3)')
  gradient.addColorStop(1.0, 'rgba(255,255,255,0.0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

/**
 * ParticleFieldRenderer – circular soft-dot particle field with direction modes
 */
export class ParticleFieldRenderer extends Three3DRenderer {
  private particleSystem: THREE.Points
  private positions: Float32Array
  // Per-particle state for direction modes
  private angles: Float32Array   // centreOut: radial angle; rotateBeat: orbit angle
  private radii: Float32Array    // centreOut: current outward distance; rotateBeat: orbit radius
  private speeds: Float32Array   // per-particle speed multiplier (0.5–1.5)
  private zOffsets: Float32Array // small fixed z spread for depth illusion
  private particleConfig: ParticleFieldConfig
  private spriteTexture: THREE.Texture

  constructor(config: ParticleFieldConfig) {
    super(config)
    this.particleConfig = config

    // Move camera much further back so the world-space spread is visible.
    // At z=60 with FOV 75°, the visible half-height ≈ 46 units — depth values
    // of 20–100 produce sensible, screen-filling spreads.
    this.camera.position.z = 60
    this.baseCameraPosition.set(0, 0, 60)

    const particleCount = Math.min(config.particleCount, 10000)

    this.positions = new Float32Array(particleCount * 3)
    this.angles = new Float32Array(particleCount)
    this.radii = new Float32Array(particleCount)
    this.speeds = new Float32Array(particleCount)
    this.zOffsets = new Float32Array(particleCount)

    this._initParticles(config.direction, config.depth)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))

    this.spriteTexture = createCircleTexture()

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(config.particleColor),
      // sizeAttenuation: false → size is in screen pixels, independent of depth.
      // This avoids the huge-blob problem when particles are close to the camera.
      size: config.particleSize,
      map: this.spriteTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: false,
    })

    this.particleSystem = new THREE.Points(geometry, material)
    this.scene.add(this.particleSystem)
  }

  // Compute the visible world-space half-extents from the camera.
  // Camera is at z=60, FOV=75°.  depth (0–100) controls how far beyond the
  // screen edge particles travel before resetting.
  private _getWorldBounds(depth: number): { halfW: number; halfH: number; diagonal: number } {
    const fovRad = (75 * Math.PI) / 180
    const camZ = 60
    const halfH = camZ * Math.tan(fovRad / 2)                  // ≈ 46 world units
    const halfW = halfH * (this.width / this.height)           // accounts for aspect ratio
    // depth scales from 90% of screen (depth=20) to 120% (depth=100)
    const scale = 0.8 + (depth / 100) * 0.5
    const w = halfW * scale
    const h = halfH * scale
    return { halfW: w, halfH: h, diagonal: Math.sqrt(w * w + h * h) }
  }

  private _initParticles(direction: ParticleFieldConfig['direction'], depth: number): void {
    const count = this.positions.length / 3
    const { halfW, halfH, diagonal } = this._getWorldBounds(depth)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      this.angles[i] = Math.random() * Math.PI * 2
      this.speeds[i] = 0.4 + Math.random() * 0.9
      this.zOffsets[i] = (Math.random() - 0.5) * 4

      if (direction === 'centreOut') {
        // Spray outward in all directions to fill the full screen including corners.
        // Use the diagonal as maxRadius so particles reach every corner.
        this.radii[i] = Math.random() * diagonal
        this.positions[i3] = Math.cos(this.angles[i]) * this.radii[i]
        this.positions[i3 + 1] = Math.sin(this.angles[i]) * this.radii[i]
        this.positions[i3 + 2] = this.zOffsets[i]
      } else if (direction === 'rotateBeat') {
        this.radii[i] = (0.15 + Math.random() * 0.85) * diagonal
        this.positions[i3] = Math.cos(this.angles[i]) * this.radii[i]
        this.positions[i3 + 1] = Math.sin(this.angles[i]) * this.radii[i]
        this.positions[i3 + 2] = this.zOffsets[i]
      } else {
        // leftToRight: fill the full visible XY area
        this.radii[i] = 0
        this.positions[i3] = (Math.random() - 0.5) * halfW * 2
        this.positions[i3 + 1] = (Math.random() - 0.5) * halfH * 2
        this.positions[i3 + 2] = this.zOffsets[i]
      }
    }
  }

  render(audioData: FrequencyBands, time: number): HTMLCanvasElement {
    const audioValue = getAudioValueFromBands(audioData, this.particleConfig.frequencyBands)
    const { speed, depth, audioSensitivity, direction } = this.particleConfig
    const count = this.positions.length / 3
    const { halfW, halfH, diagonal } = this._getWorldBounds(depth)
    // Base step: speed=1 → ~0.025 world units/frame, a gentle drift across ~90 units
    const step = speed * 0.025

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const spd = this.speeds[i] * step

      if (direction === 'centreOut') {
        const boost = 1 + audioValue * audioSensitivity * 1.2
        this.radii[i] += spd * boost

        if (this.radii[i] > diagonal) {
          this.radii[i] = 0
          this.angles[i] = Math.random() * Math.PI * 2
          this.zOffsets[i] = (Math.random() - 0.5) * 4
          this.positions[i3 + 2] = this.zOffsets[i]
        }

        this.positions[i3] = Math.cos(this.angles[i]) * this.radii[i]
        this.positions[i3 + 1] = Math.sin(this.angles[i]) * this.radii[i]

      } else if (direction === 'rotateBeat') {
        const orbitSpeed = spd * 0.08
        const beatBoost = audioValue * audioSensitivity * 0.04
        this.angles[i] += orbitSpeed + beatBoost

        const radiusPulse = 1 + audioValue * audioSensitivity * 0.12
        const r = this.radii[i] * radiusPulse
        this.positions[i3] = Math.cos(this.angles[i]) * r
        this.positions[i3 + 1] = Math.sin(this.angles[i]) * r

      } else {
        // leftToRight
        const boost = 1 + audioValue * audioSensitivity * 0.4
        this.positions[i3] += spd * boost

        if (this.positions[i3] > halfW) {
          this.positions[i3] = -halfW
          this.positions[i3 + 1] = (Math.random() - 0.5) * halfH * 2
          this.zOffsets[i] = (Math.random() - 0.5) * 4
          this.positions[i3 + 2] = this.zOffsets[i]
        }
      }
    }

    this.particleSystem.geometry.getAttribute('position').needsUpdate = true

    // Audio reactivity: size (pixels) and opacity
    const material = this.particleSystem.material as THREE.PointsMaterial
    material.size = this.particleConfig.particleSize * (1 + audioValue * audioSensitivity * 0.8)
    material.opacity = 0.5 + audioValue * 0.5

    if (direction === 'centreOut') {
      this.particleSystem.rotation.z = time * 0.008
    } else {
      this.particleSystem.rotation.z = 0
    }

    this.renderScene()
    return this.canvas
  }

  updateConfig(updates: Partial<ParticleFieldConfig>): void {
    const prevDirection = this.particleConfig.direction
    Object.assign(this.particleConfig, updates)

    if (updates.particleColor) {
      const material = this.particleSystem.material as THREE.PointsMaterial
      material.color = new THREE.Color(updates.particleColor)
    }

    if (updates.particleSize !== undefined) {
      const material = this.particleSystem.material as THREE.PointsMaterial
      material.size = updates.particleSize
    }

    // Re-initialise particle positions when direction or depth changes
    if (updates.direction && updates.direction !== prevDirection) {
      this._initParticles(updates.direction, this.particleConfig.depth)
      this.particleSystem.geometry.getAttribute('position').needsUpdate = true
    } else if (updates.depth !== undefined) {
      this._initParticles(this.particleConfig.direction, updates.depth)
      this.particleSystem.geometry.getAttribute('position').needsUpdate = true
    }
  }

  dispose(): void {
    this.particleSystem.geometry.dispose()
    ;(this.particleSystem.material as THREE.PointsMaterial).dispose()
    this.spriteTexture.dispose()
    super.dispose()
  }
}
