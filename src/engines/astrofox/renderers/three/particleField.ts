/**
 * Particle Field Renderer
 *
 * Renders a 3D particle field with depth perception.
 * Particles move toward camera and loop infinitely.
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
}

/**
 * ParticleFieldRenderer - Infinite looping particle field
 */
export class ParticleFieldRenderer extends Three3DRenderer {
  private particleSystem: THREE.Points
  private positions: Float32Array
  private velocities: Float32Array
  private particleConfig: ParticleFieldConfig

  constructor(config: ParticleFieldConfig) {
    super(config)
    this.particleConfig = config

    // Create particle geometry
    const geometry = new THREE.BufferGeometry()
    const particleCount = Math.min(config.particleCount, 10000) // Cap at 10k for performance

    // Initialize position and velocity arrays
    this.positions = new Float32Array(particleCount * 3)
    this.velocities = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      // Random position in box
      this.positions[i3] = (Math.random() - 0.5) * config.depth * 2 // X
      this.positions[i3 + 1] = (Math.random() - 0.5) * config.depth * 2 // Y
      this.positions[i3 + 2] = (Math.random() - 0.5) * config.depth * 2 // Z

      // Random velocity
      this.velocities[i] = Math.random() * 0.5 + 0.5 // 0.5-1.0
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))

    // Create particle material
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(config.particleColor),
      size: config.particleSize,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    // Create particle system
    this.particleSystem = new THREE.Points(geometry, material)
    this.scene.add(this.particleSystem)
  }

  /**
   * Update particle positions and render
   */
  render(audioData: FrequencyBands, time: number): HTMLCanvasElement {
    const audioValue = getAudioValueFromBands(audioData, this.particleConfig.frequencyBands)

    // Update particle positions
    for (let i = 0; i < this.positions.length / 3; i++) {
      const i3 = i * 3

      // Move particles toward camera (positive Z direction)
      this.positions[i3 + 2] += this.velocities[i] * this.particleConfig.speed * 0.1

      // Loop particles when they pass camera
      if (this.positions[i3 + 2] > this.particleConfig.depth) {
        this.positions[i3 + 2] = -this.particleConfig.depth
        this.positions[i3] = (Math.random() - 0.5) * this.particleConfig.depth * 2
        this.positions[i3 + 1] = (Math.random() - 0.5) * this.particleConfig.depth * 2
      }
    }

    // Mark positions as needing update
    const geometry = this.particleSystem.geometry
    const positionAttribute = geometry.getAttribute('position')
    positionAttribute.needsUpdate = true

    // Audio reactivity: shimmer size and opacity
    const material = this.particleSystem.material as THREE.PointsMaterial
    const sizeScale = 1 + audioValue * this.particleConfig.audioSensitivity * 0.5
    material.size = this.particleConfig.particleSize * sizeScale
    material.opacity = 0.6 + audioValue * 0.4

    // Slight rotation for visual interest
    this.particleSystem.rotation.y = time * 0.05
    this.particleSystem.rotation.x = Math.sin(time * 0.1) * 0.1

    // Render scene with post-processing
    this.renderScene()

    return this.canvas
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ParticleFieldConfig>): void {
    Object.assign(this.particleConfig, updates)

    // Update material if color changed
    if (updates.particleColor) {
      const material = this.particleSystem.material as THREE.PointsMaterial
      material.color = new THREE.Color(updates.particleColor)
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.particleSystem.geometry.dispose()
    ;(this.particleSystem.material as THREE.PointsMaterial).dispose()
    super.dispose()
  }
}
