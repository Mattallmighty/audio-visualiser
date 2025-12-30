/**
 * RGBShiftPass - Chromatic aberration effect
 *
 * Separates the RGB color channels by offsetting them,
 * creating a "3D glasses" or lens distortion effect.
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const rgbShiftFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform vec2 resolution;
  uniform float amount;
  uniform float angle;
  uniform bool radial;

  varying vec2 v_uv;

  void main() {
    vec2 offset;

    if (radial) {
      // Radial RGB shift (from center)
      vec2 center = v_uv - 0.5;
      float dist = length(center);
      offset = normalize(center) * amount * dist;
    } else {
      // Directional RGB shift
      offset = amount * vec2(cos(angle), sin(angle));
    }

    // Sample each channel at different positions
    float r = texture2D(inputTexture, v_uv + offset).r;
    float g = texture2D(inputTexture, v_uv).g;
    float b = texture2D(inputTexture, v_uv - offset).b;
    float a = texture2D(inputTexture, v_uv).a;

    gl_FragColor = vec4(r, g, b, a);
  }
`

export interface RGBShiftConfig {
  amount?: number
  angle?: number
  radial?: boolean
}

export class RGBShiftPass extends ShaderPass {
  private _amount: number
  private _angle: number
  private _radial: boolean

  constructor(config: RGBShiftConfig = {}) {
    super({
      uniforms: {
        inputTexture: { type: 't', value: null },
        resolution: { type: 'v2', value: [1, 1] },
        amount: { type: 'f', value: 0.01 },
        angle: { type: 'f', value: 0 },
        radial: { type: 'b', value: false }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: rgbShiftFragmentShader
    })

    this._amount = config.amount ?? 0.01
    this._angle = config.angle ?? 0
    this._radial = config.radial ?? false
  }

  get amount(): number {
    return this._amount
  }

  set amount(value: number) {
    this._amount = Math.max(0, Math.min(0.1, value))
    this.setUniforms({ amount: this._amount })
  }

  get angle(): number {
    return this._angle
  }

  set angle(value: number) {
    this._angle = value
    this.setUniforms({ angle: this._angle })
  }

  get radial(): boolean {
    return this._radial
  }

  set radial(value: boolean) {
    this._radial = value
    this.setUniforms({ radial: value })
  }

  updateConfig(config: RGBShiftConfig): void {
    if (config.amount !== undefined) this.amount = config.amount
    if (config.angle !== undefined) this.angle = config.angle
    if (config.radial !== undefined) this.radial = config.radial
  }
}

export default RGBShiftPass
