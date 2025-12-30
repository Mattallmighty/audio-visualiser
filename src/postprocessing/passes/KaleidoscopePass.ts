/**
 * KaleidoscopePass - Creates a kaleidoscopic mirror effect
 *
 * Divides the view into triangular segments that mirror each other,
 * creating mesmerizing symmetrical patterns with optional beat-synced rotation.
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const kaleidoscopeFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform vec2 resolution;
  uniform float sides;
  uniform float angle;

  varying vec2 v_uv;

  #define PI 3.14159265359
  #define TAU 6.28318530718

  void main() {
    // Center coordinates
    vec2 p = v_uv - 0.5;

    // Correct aspect ratio
    p.x *= resolution.x / resolution.y;

    // Convert to polar coordinates
    float r = length(p);
    float a = atan(p.y, p.x) + angle;

    // Create mirror segments
    float segmentAngle = TAU / sides;
    a = mod(a, segmentAngle);
    a = abs(a - segmentAngle * 0.5);

    // Convert back to Cartesian
    p = r * vec2(cos(a), sin(a));

    // Restore aspect ratio
    p.x /= resolution.x / resolution.y;

    // Sample texture
    vec2 uv = p + 0.5;
    gl_FragColor = texture2D(inputTexture, uv);
  }
`

export interface KaleidoscopeConfig {
  sides?: number
  angle?: number
  rotationSpeed?: number // Base rotation speed (radians per second)
  beatSync?: boolean // Enable beat-synced rotation
  beatAmount?: number // How much to rotate on beat (radians)
}

export class KaleidoscopePass extends ShaderPass {
  private _sides: number
  private _angle: number
  private _rotationSpeed: number
  private _beatSync: boolean
  private _beatAmount: number

  // Internal state for smooth rotation
  private _time: number = 0
  private _targetAngle: number = 0
  private _currentAngle: number = 0
  private _beatPhase: number = 0

  constructor(config: KaleidoscopeConfig = {}) {
    super({
      uniforms: {
        inputTexture: { type: 't', value: null },
        resolution: { type: 'v2', value: [1, 1] },
        sides: { type: 'f', value: 6 },
        angle: { type: 'f', value: 0 }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: kaleidoscopeFragmentShader
    })

    this._sides = config.sides ?? 6
    this._angle = config.angle ?? 0
    this._rotationSpeed = config.rotationSpeed ?? 0.5 // Default: slow rotation
    this._beatSync = config.beatSync ?? true // Default: beat sync enabled
    this._beatAmount = config.beatAmount ?? 0.3 // Radians to rotate on beat
  }

  get sides(): number {
    return this._sides
  }

  set sides(value: number) {
    this._sides = Math.max(2, Math.min(20, value))
    this.setUniforms({ sides: this._sides })
  }

  get angle(): number {
    return this._angle
  }

  set angle(value: number) {
    this._angle = value
    this.setUniforms({ angle: this._angle })
  }

  get rotationSpeed(): number {
    return this._rotationSpeed
  }

  set rotationSpeed(value: number) {
    this._rotationSpeed = value
  }

  get beatSync(): boolean {
    return this._beatSync
  }

  set beatSync(value: boolean) {
    this._beatSync = value
  }

  get beatAmount(): number {
    return this._beatAmount
  }

  set beatAmount(value: number) {
    this._beatAmount = value
  }

  /**
   * Update the kaleidoscope animation
   * @param deltaTime Time since last frame in seconds
   * @param beatData Optional beat data for sync
   */
  update(
    deltaTime: number,
    beatData?: { isBeat: boolean; beatPhase: number; beatIntensity: number }
  ): void {
    this._time += deltaTime

    // Base rotation
    this._targetAngle += this._rotationSpeed * deltaTime

    // Beat-synced rotation
    if (this._beatSync && beatData) {
      // Smooth beat phase tracking (0-1 cycles)
      const phaseDiff = beatData.beatPhase - this._beatPhase
      // Handle phase wrap-around
      if (phaseDiff < -0.5) {
        // Phase wrapped from ~1 to ~0, this is a beat
        this._targetAngle += this._beatAmount * beatData.beatIntensity
      }
      this._beatPhase = beatData.beatPhase

      // On strong beats, add extra rotation
      if (beatData.isBeat && beatData.beatIntensity > 0.5) {
        this._targetAngle += this._beatAmount * 0.5 * beatData.beatIntensity
      }
    }

    // Smooth interpolation to target angle
    const smoothing = 0.1
    this._currentAngle += (this._targetAngle - this._currentAngle) * smoothing

    this.angle = this._currentAngle
  }

  /**
   * Update configuration
   */
  updateConfig(config: KaleidoscopeConfig): void {
    if (config.sides !== undefined) this.sides = config.sides
    if (config.angle !== undefined) this.angle = config.angle
    if (config.rotationSpeed !== undefined) this.rotationSpeed = config.rotationSpeed
    if (config.beatSync !== undefined) this.beatSync = config.beatSync
    if (config.beatAmount !== undefined) this.beatAmount = config.beatAmount
  }
}

export default KaleidoscopePass
