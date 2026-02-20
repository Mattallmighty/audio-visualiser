/**
 * Reactive Orb Renderer
 *
 * Sphere with simplex-noise vertex displacement creating organic spikes.
 * Features Fresnel edge glow and audio-reactive displacement intensity.
 */

import * as THREE from 'three'
import { Three3DRenderer, type Three3DRendererConfig } from './Three3DRenderer'
import type { FrequencyBands } from '../../utils/AudioSmoother'
import { getAudioValueFromBands, type FrequencyBand } from '../../utils/AudioSmoother'

// Import shaders as strings
import orbVertexShader from './shaders/orbVertex.glsl?raw'
import orbFragmentShader from './shaders/orbFragment.glsl?raw'

export interface ReactiveOrbConfig extends Three3DRendererConfig {
  color: string
  displacementAmount: number
  noiseScale: number
  subdivisions: number
  fresnelIntensity: number
  frequencyBands: FrequencyBand[]
  audioSensitivity: number
}

/**
 * ReactiveOrbRenderer - Noise-displaced sphere with Fresnel glow
 */
export class ReactiveOrbRenderer extends Three3DRenderer {
  private orb: THREE.Mesh
  private material: THREE.ShaderMaterial
  private orbConfig: ReactiveOrbConfig

  constructor(config: ReactiveOrbConfig) {
    super(config)
    this.orbConfig = config

    // Create icosahedron geometry (smoother than sphere)
    const geometry = new THREE.IcosahedronGeometry(
      2, // radius
      Math.min(config.subdivisions || 4, 6) // detail (capped at 6 for performance)
    )

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAudioValue: { value: 0 },
        uDisplacementAmount: { value: config.displacementAmount },
        uNoiseScale: { value: config.noiseScale },
        uSensitivity: { value: config.audioSensitivity },
        uColor: { value: new THREE.Color(config.color) },
        uFresnelIntensity: { value: config.fresnelIntensity },
      },
      vertexShader: orbVertexShader,
      fragmentShader: orbFragmentShader,
      transparent: false,
      side: THREE.DoubleSide,
    })

    // Create mesh
    this.orb = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.orb)

    // Position camera
    this.camera.position.set(0, 0, 8)
    this.baseCameraPosition.set(0, 0, 8)
  }

  /**
   * Render orb with audio-reactive displacement
   */
  render(audioData: FrequencyBands, time: number): HTMLCanvasElement {
    const audioValue = getAudioValueFromBands(audioData, this.orbConfig.frequencyBands)

    // Update shader uniforms
    this.material.uniforms.uTime.value = time
    this.material.uniforms.uAudioValue.value = audioValue
    this.material.uniforms.uDisplacementAmount.value = this.orbConfig.displacementAmount
    this.material.uniforms.uNoiseScale.value = this.orbConfig.noiseScale
    this.material.uniforms.uSensitivity.value = this.orbConfig.audioSensitivity
    this.material.uniforms.uFresnelIntensity.value = this.orbConfig.fresnelIntensity

    // Slow rotation
    this.orb.rotation.y = time * 0.2
    this.orb.rotation.x = Math.sin(time * 0.3) * 0.3

    // Render scene with post-processing
    this.renderScene()

    return this.canvas
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ReactiveOrbConfig>): void {
    Object.assign(this.orbConfig, updates)

    // Update shader uniforms
    if (updates.color) {
      this.material.uniforms.uColor.value = new THREE.Color(updates.color)
    }
    if (updates.displacementAmount !== undefined) {
      this.material.uniforms.uDisplacementAmount.value = updates.displacementAmount
    }
    if (updates.noiseScale !== undefined) {
      this.material.uniforms.uNoiseScale.value = updates.noiseScale
    }
    if (updates.audioSensitivity !== undefined) {
      this.material.uniforms.uSensitivity.value = updates.audioSensitivity
    }
    if (updates.fresnelIntensity !== undefined) {
      this.material.uniforms.uFresnelIntensity.value = updates.fresnelIntensity
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.orb.geometry.dispose()
    this.material.dispose()
    super.dispose()
  }
}
