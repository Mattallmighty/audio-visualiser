/**
 * Three3DRenderer Base Class
 *
 * Abstract base class for all Three.js-based 3D renderers.
 * Manages WebGL context, scene, camera, and off-screen canvas rendering.
 * Provides camera shake utility with spring damping physics.
 */

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { RGBShiftShader } from './shaders/rgbShift'
import type { FrequencyBands } from '../../utils/AudioSmoother'

export interface Three3DRendererConfig {
  width: number
  height: number
  pixelRatio?: number
  antialias?: boolean
  enableBloom?: boolean
  bloomStrength?: number
  bloomRadius?: number
  bloomThreshold?: number
  enableRGBShift?: boolean
  rgbShiftAmount?: number
}

/**
 * Abstract base class for Three.js renderers
 */
export abstract class Three3DRenderer {
  protected scene: THREE.Scene
  protected camera: THREE.PerspectiveCamera
  protected renderer: THREE.WebGLRenderer
  protected canvas: HTMLCanvasElement
  protected width: number
  protected height: number
  protected config: Three3DRendererConfig

  // Camera shake physics
  protected baseCameraPosition: THREE.Vector3
  protected cameraShakeOffset: THREE.Vector3 = new THREE.Vector3()
  protected cameraShakeVelocity: THREE.Vector3 = new THREE.Vector3()

  // Post-processing
  protected composer?: EffectComposer
  protected bloomPass?: UnrealBloomPass
  protected rgbShiftPass?: ShaderPass

  constructor(config: Three3DRendererConfig) {
    this.config = config
    this.width = config.width
    this.height = config.height

    // Create off-screen canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width * (config.pixelRatio || 1)
    this.canvas.height = this.height * (config.pixelRatio || 1)

    // Initialize Three.js scene
    this.scene = new THREE.Scene()

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      this.width / this.height, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    )
    this.camera.position.z = 5
    this.baseCameraPosition = this.camera.position.clone()

    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: config.antialias !== false,
      alpha: true,
      preserveDrawingBuffer: true, // Required for ctx.drawImage()
    })
    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(config.pixelRatio || 1)
    // Clear to fully transparent so the Three.js canvas composites cleanly
    // onto the 2D canvas regardless of blend mode.
    this.renderer.setClearColor(0x000000, 0)

    // Setup post-processing if enabled
    this.setupPostProcessing()
  }

  /**
   * Setup post-processing effects
   */
  protected setupPostProcessing(): void {
    if (!this.config.enableBloom && !this.config.enableRGBShift) {
      return
    }

    // Create composer
    this.composer = new EffectComposer(this.renderer)

    // Add render pass
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    // Add bloom pass if enabled
    if (this.config.enableBloom) {
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(this.width, this.height),
        this.config.bloomStrength || 1.5,
        this.config.bloomRadius || 0.4,
        this.config.bloomThreshold || 0.85
      )
      this.composer.addPass(this.bloomPass)
    }

    // Add RGB shift pass if enabled
    if (this.config.enableRGBShift) {
      this.rgbShiftPass = new ShaderPass(RGBShiftShader)
      this.rgbShiftPass.uniforms['amount'].value = this.config.rgbShiftAmount || 0.005
      this.composer.addPass(this.rgbShiftPass)
    }
  }

  /**
   * Apply camera shake based on bass intensity
   * @param bassIntensity - Current bass level (0-1)
   * @param intensity - Shake strength multiplier
   * @param decay - Damping factor (0-1). Lower = stronger damping
   */
  protected applyCameraShake(
    bassIntensity: number,
    intensity: number = 0.1,
    decay: number = 0.9
  ): void {
    // Trigger shake on strong bass hits
    if (bassIntensity > 0.7) {
      this.cameraShakeVelocity.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity * 0.3 // Less Z shake
      )
    }

    // Apply velocity to offset (spring physics)
    this.cameraShakeOffset.add(this.cameraShakeVelocity)

    // Damping
    this.cameraShakeVelocity.multiplyScalar(decay)
    this.cameraShakeOffset.multiplyScalar(decay)

    // Apply offset to camera position
    this.camera.position.copy(this.baseCameraPosition).add(this.cameraShakeOffset)

    // Stop if velocity is negligible
    if (this.cameraShakeVelocity.length() < 0.0001) {
      this.cameraShakeVelocity.set(0, 0, 0)
      this.cameraShakeOffset.set(0, 0, 0)
    }
  }

  /**
   * Reset camera shake to zero
   */
  protected resetCameraShake(): void {
    this.cameraShakeOffset.set(0, 0, 0)
    this.cameraShakeVelocity.set(0, 0, 0)
    this.camera.position.copy(this.baseCameraPosition)
  }

  /**
   * Update renderer size
   */
  resize(width: number, height: number, pixelRatio: number = 1): void {
    this.width = width
    this.height = height

    this.canvas.width = width * pixelRatio
    this.canvas.height = height * pixelRatio

    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(pixelRatio)

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  /**
   * Render the scene with optional post-processing
   */
  protected renderScene(): void {
    if (this.composer) {
      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

  /**
   * Abstract render method - must be implemented by subclasses
   * @param audioData - Smoothed frequency bands
   * @param time - Current time in seconds
   * @returns Rendered canvas for compositing
   */
  abstract render(audioData: FrequencyBands, time: number): HTMLCanvasElement

  /**
   * Dispose of Three.js resources
   */
  dispose(): void {
    // Dispose geometries and materials in scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose())
        } else {
          object.material?.dispose()
        }
      }
    })

    // Dispose renderer
    this.renderer.dispose()

    // Clear scene
    this.scene.clear()
  }
}
