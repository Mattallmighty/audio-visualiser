/**
 * FilmGrainPass - Adds analog film grain overlay
 *
 * Features:
 * - Animated noise grain
 * - Adjustable intensity and size
 * - Color/monochrome grain options
 * - Vignette-weighted grain (more grain at edges)
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const filmGrainFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform float time;
  uniform float intensity;
  uniform float grainSize;
  uniform float luminanceAffect;
  uniform bool colored;
  uniform vec2 resolution;

  varying vec2 v_uv;

  // Pseudo-random noise function
  float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Improved noise with temporal variation
  float noise(vec2 uv, float t) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);

    // Add time-based variation
    float a = random(i + vec2(0.0, 0.0) + t);
    float b = random(i + vec2(1.0, 0.0) + t);
    float c = random(i + vec2(0.0, 1.0) + t);
    float d = random(i + vec2(1.0, 1.0) + t);

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec4 texColor = texture2D(inputTexture, v_uv);

    // Calculate grain coordinates based on grain size
    vec2 grainCoord = v_uv * resolution / grainSize;

    // Animate grain with time
    float t = floor(time * 24.0) * 0.1; // ~24fps grain animation

    // Generate grain noise
    float grainNoise;
    vec3 grainColor;

    if (colored) {
      // Colored grain - different noise for each channel
      grainColor = vec3(
        noise(grainCoord, t),
        noise(grainCoord + 100.0, t + 0.1),
        noise(grainCoord + 200.0, t + 0.2)
      );
      grainNoise = (grainColor.r + grainColor.g + grainColor.b) / 3.0;
    } else {
      // Monochrome grain
      grainNoise = noise(grainCoord, t);
      grainColor = vec3(grainNoise);
    }

    // Center grain around 0 (-0.5 to 0.5)
    grainColor = grainColor - 0.5;

    // Calculate luminance for luminance-affected grain
    float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    float luminanceFactor = mix(1.0, 1.0 - luminance, luminanceAffect);

    // Apply grain with intensity
    vec3 result = texColor.rgb + grainColor * intensity * luminanceFactor;

    // Clamp to valid range
    result = clamp(result, 0.0, 1.0);

    gl_FragColor = vec4(result, texColor.a);
  }
`

export interface FilmGrainConfig {
  intensity?: number // 0-1, strength of the grain effect
  grainSize?: number // 1-5, size of grain particles
  luminanceAffect?: number // 0-1, how much luminance affects grain visibility
  colored?: boolean // true for colored grain, false for mono
  speed?: number // Animation speed multiplier
}

export class FilmGrainPass extends ShaderPass {
  private _intensity: number
  private _grainSize: number
  private _luminanceAffect: number
  private _colored: boolean
  private _speed: number
  private _time: number = 0

  constructor(config: FilmGrainConfig = {}) {
    super(
      {
        uniforms: {
          inputTexture: { type: 't', value: null },
          time: { type: 'f', value: 0 },
          intensity: { type: 'f', value: config.intensity ?? 0.15 },
          grainSize: { type: 'f', value: config.grainSize ?? 2.0 },
          luminanceAffect: { type: 'f', value: config.luminanceAffect ?? 0.5 },
          colored: { type: 'b', value: config.colored ?? false },
          resolution: { type: 'v2', value: [1, 1] }
        },
        vertexShader: fullscreenVertexShader,
        fragmentShader: filmGrainFragmentShader
      },
      { needsSwap: true }
    )

    this._intensity = config.intensity ?? 0.15
    this._grainSize = config.grainSize ?? 2.0
    this._luminanceAffect = config.luminanceAffect ?? 0.5
    this._colored = config.colored ?? false
    this._speed = config.speed ?? 1.0
  }

  setSize(width: number, height: number): void {
    super.setSize(width, height)
    this.setUniforms({ resolution: [width, height] })
  }

  // Call this each frame to update the grain animation
  update(deltaTime: number): void {
    this._time += deltaTime * this._speed
    this.setUniforms({ time: this._time })
  }

  get intensity(): number {
    return this._intensity
  }

  set intensity(value: number) {
    this._intensity = Math.max(0, Math.min(1, value))
    this.setUniforms({ intensity: this._intensity })
  }

  get grainSize(): number {
    return this._grainSize
  }

  set grainSize(value: number) {
    this._grainSize = Math.max(0.5, Math.min(10, value))
    this.setUniforms({ grainSize: this._grainSize })
  }

  get luminanceAffect(): number {
    return this._luminanceAffect
  }

  set luminanceAffect(value: number) {
    this._luminanceAffect = Math.max(0, Math.min(1, value))
    this.setUniforms({ luminanceAffect: this._luminanceAffect })
  }

  get colored(): boolean {
    return this._colored
  }

  set colored(value: boolean) {
    this._colored = value
    this.setUniforms({ colored: this._colored })
  }

  get speed(): number {
    return this._speed
  }

  set speed(value: number) {
    this._speed = Math.max(0, Math.min(5, value))
  }

  updateConfig(config: FilmGrainConfig): void {
    if (config.intensity !== undefined) this.intensity = config.intensity
    if (config.grainSize !== undefined) this.grainSize = config.grainSize
    if (config.luminanceAffect !== undefined) this.luminanceAffect = config.luminanceAffect
    if (config.colored !== undefined) this.colored = config.colored
    if (config.speed !== undefined) this.speed = config.speed
  }
}

export default FilmGrainPass
