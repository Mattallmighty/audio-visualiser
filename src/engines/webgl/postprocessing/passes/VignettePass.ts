/**
 * VignettePass - Creates a vignette (dark edges) effect
 *
 * Features:
 * - Adjustable radius and softness
 * - Audio-reactive radius via uniform
 * - Color tinting option
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const vignetteFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform float radius;
  uniform float softness;
  uniform float intensity;
  uniform vec3 color;
  uniform vec2 center;

  varying vec2 v_uv;

  void main() {
    vec4 texColor = texture2D(inputTexture, v_uv);

    // Calculate distance from center
    vec2 uv = v_uv - center;
    float dist = length(uv);

    // Calculate vignette factor
    float vignette = smoothstep(radius, radius - softness, dist);

    // Apply vignette with color tinting
    vec3 vignetteColor = mix(color, vec3(1.0), vignette);
    vec3 result = texColor.rgb * vignetteColor * mix(1.0, vignette, intensity);

    gl_FragColor = vec4(result, texColor.a);
  }
`

export interface VignetteConfig {
  radius?: number // 0-1, distance from center where vignette starts
  softness?: number // 0-1, how gradual the falloff is
  intensity?: number // 0-1, strength of the effect
  color?: [number, number, number] // RGB color of vignette (default black)
  centerX?: number // 0-1, X center position
  centerY?: number // 0-1, Y center position
}

export class VignettePass extends ShaderPass {
  private _radius: number
  private _softness: number
  private _intensity: number
  private _color: [number, number, number]
  private _centerX: number
  private _centerY: number

  constructor(config: VignetteConfig = {}) {
    super(
      {
        uniforms: {
          inputTexture: { type: 't', value: null },
          radius: { type: 'f', value: config.radius ?? 0.75 },
          softness: { type: 'f', value: config.softness ?? 0.45 },
          intensity: { type: 'f', value: config.intensity ?? 0.5 },
          color: { type: 'v3', value: config.color ?? [0, 0, 0] },
          center: { type: 'v2', value: [config.centerX ?? 0.5, config.centerY ?? 0.5] }
        },
        vertexShader: fullscreenVertexShader,
        fragmentShader: vignetteFragmentShader
      },
      { needsSwap: true }
    )

    this._radius = config.radius ?? 0.75
    this._softness = config.softness ?? 0.45
    this._intensity = config.intensity ?? 0.5
    this._color = config.color ?? [0, 0, 0]
    this._centerX = config.centerX ?? 0.5
    this._centerY = config.centerY ?? 0.5
  }

  get radius(): number {
    return this._radius
  }

  set radius(value: number) {
    this._radius = Math.max(0.1, Math.min(1.5, value))
    this.setUniforms({ radius: this._radius })
  }

  get softness(): number {
    return this._softness
  }

  set softness(value: number) {
    this._softness = Math.max(0.01, Math.min(1, value))
    this.setUniforms({ softness: this._softness })
  }

  get intensity(): number {
    return this._intensity
  }

  set intensity(value: number) {
    this._intensity = Math.max(0, Math.min(1, value))
    this.setUniforms({ intensity: this._intensity })
  }

  get color(): [number, number, number] {
    return this._color
  }

  set color(value: [number, number, number]) {
    this._color = value
    this.setUniforms({ color: this._color })
  }

  get centerX(): number {
    return this._centerX
  }

  set centerX(value: number) {
    this._centerX = Math.max(0, Math.min(1, value))
    this.setUniforms({ center: [this._centerX, this._centerY] })
  }

  get centerY(): number {
    return this._centerY
  }

  set centerY(value: number) {
    this._centerY = Math.max(0, Math.min(1, value))
    this.setUniforms({ center: [this._centerX, this._centerY] })
  }

  updateConfig(config: VignetteConfig): void {
    if (config.radius !== undefined) this.radius = config.radius
    if (config.softness !== undefined) this.softness = config.softness
    if (config.intensity !== undefined) this.intensity = config.intensity
    if (config.color !== undefined) this.color = config.color
    if (config.centerX !== undefined) this.centerX = config.centerX
    if (config.centerY !== undefined) this.centerY = config.centerY
  }
}

export default VignettePass
