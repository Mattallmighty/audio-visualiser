/**
 * Neon Tunnel Renderer
 *
 * Infinite wireframe tunnel with audio-reactive radius pulsation.
 * Features custom shaders for neon glow effect and camera shake on bass hits.
 */

import * as THREE from 'three'
import { Three3DRenderer, type Three3DRendererConfig } from './Three3DRenderer'
import type { FrequencyBands } from '../../utils/AudioSmoother'
import { getAudioValueFromBands, type FrequencyBand } from '../../utils/AudioSmoother'

// Import shaders as strings
import tunnelVertexShader from './shaders/tunnelVertex.glsl?raw'
import tunnelFragmentShader from './shaders/tunnelFragment.glsl?raw'

export interface NeonTunnelConfig extends Three3DRendererConfig {
  color: string
  wireframeThickness: number
  glowIntensity: number
  speed: number
  segments: number
  frequencyBands: FrequencyBand[]
  audioSensitivity: number
  cameraShakeEnabled: boolean
  cameraShakeIntensity: number
}

/**
 * NeonTunnelRenderer - Infinite scrolling wireframe tunnel
 */
export class NeonTunnelRenderer extends Three3DRenderer {
  private tunnel: THREE.Mesh
  private material: THREE.ShaderMaterial
  private tunnelConfig: NeonTunnelConfig
  private segmentLength: number = 10

  constructor(config: NeonTunnelConfig) {
    super(config)
    this.tunnelConfig = config

    // Create cylinder geometry (rotated to face forward along Z-axis)
    const geometry = new THREE.CylinderGeometry(
      2, // radiusTop
      2, // radiusBottom
      this.segmentLength, // height
      config.segments || 32, // radialSegments
      1, // heightSegments
      true // openEnded
    )

    // Rotate geometry to face Z-axis
    geometry.rotateX(Math.PI / 2)

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAudioValue: { value: 0 },
        uSensitivity: { value: config.audioSensitivity },
        uColor: { value: new THREE.Color(config.color) },
        uGlowIntensity: { value: config.glowIntensity },
      },
      vertexShader: tunnelVertexShader,
      fragmentShader: tunnelFragmentShader,
      wireframe: true,
      transparent: true,
      side: THREE.DoubleSide,
    })

    // Create mesh
    this.tunnel = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.tunnel)

    // Position camera inside tunnel
    this.camera.position.set(0, 0, 0)
    this.baseCameraPosition.set(0, 0, 0)
  }

  /**
   * Render tunnel with infinite scrolling
   */
  render(audioData: FrequencyBands, time: number): HTMLCanvasElement {
    const audioValue = getAudioValueFromBands(audioData, this.tunnelConfig.frequencyBands)

    // Update shader uniforms
    this.material.uniforms.uTime.value = time
    this.material.uniforms.uAudioValue.value = audioValue
    this.material.uniforms.uSensitivity.value = this.tunnelConfig.audioSensitivity
    this.material.uniforms.uGlowIntensity.value = this.tunnelConfig.glowIntensity

    // Infinite scroll effect
    this.tunnel.position.z = ((time * this.tunnelConfig.speed) % this.segmentLength) - this.segmentLength / 2

    // Camera shake on bass hits
    if (this.tunnelConfig.cameraShakeEnabled) {
      const bassIntensity = audioData.bass || 0
      this.applyCameraShake(
        bassIntensity,
        this.tunnelConfig.cameraShakeIntensity,
        0.9 // Decay factor
      )
    } else {
      this.resetCameraShake()
    }

    // Render scene with post-processing
    this.renderScene()

    return this.canvas
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<NeonTunnelConfig>): void {
    Object.assign(this.tunnelConfig, updates)

    // Update shader uniforms
    if (updates.color) {
      this.material.uniforms.uColor.value = new THREE.Color(updates.color)
    }
    if (updates.audioSensitivity !== undefined) {
      this.material.uniforms.uSensitivity.value = updates.audioSensitivity
    }
    if (updates.glowIntensity !== undefined) {
      this.material.uniforms.uGlowIntensity.value = updates.glowIntensity
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.tunnel.geometry.dispose()
    this.material.dispose()
    super.dispose()
  }
}
