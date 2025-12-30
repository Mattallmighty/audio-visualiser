/**
 * DotScreenPass - Creates a halftone dot screen effect
 *
 * Features:
 * - Adjustable dot scale and angle
 * - Color or grayscale dots
 * - CMYK halftone option
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const dotScreenFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform vec2 resolution;
  uniform vec2 center;
  uniform float angle;
  uniform float scale;
  uniform bool grayscale;
  uniform bool cmyk;

  varying vec2 v_uv;

  // Pattern function - creates circular dots
  float pattern(vec2 uv, float rotAngle) {
    float s = sin(rotAngle);
    float c = cos(rotAngle);

    vec2 tex = uv * resolution - center;
    vec2 point = vec2(
      c * tex.x - s * tex.y,
      s * tex.x + c * tex.y
    ) * scale;

    return (sin(point.x) * sin(point.y)) * 4.0;
  }

  void main() {
    vec4 color = texture2D(inputTexture, v_uv);

    if (cmyk) {
      // CMYK halftone - different angles for each channel
      float c = pattern(v_uv, angle + 0.261799);  // Cyan at +15 degrees
      float m = pattern(v_uv, angle + 1.30900);   // Magenta at +75 degrees
      float y = pattern(v_uv, angle);              // Yellow at base angle
      float k = pattern(v_uv, angle + 0.785398);  // Black at +45 degrees

      // Convert RGB to CMY
      vec3 cmy = 1.0 - color.rgb;
      float brightness = (color.r + color.g + color.b) / 3.0;

      // Apply halftone pattern
      vec3 result = vec3(
        cmy.x * 10.0 - c - 3.0,
        cmy.y * 10.0 - m - 3.0,
        cmy.z * 10.0 - y - 3.0
      );

      // Convert back to RGB and add black
      result = 1.0 - result - vec3(brightness * 10.0 - k - 5.0);

      gl_FragColor = vec4(result, color.a);
    } else {
      // Simple halftone
      float average = (color.r + color.g + color.b) / 3.0;
      float p = pattern(v_uv, angle);

      if (grayscale) {
        // Grayscale dots
        float threshold = average * 10.0 - 5.0 + p;
        gl_FragColor = vec4(vec3(threshold), color.a);
      } else {
        // Color dots
        gl_FragColor = vec4(color.rgb * 10.0 - 5.0 + p, color.a);
      }
    }
  }
`

export interface DotScreenConfig {
  centerX?: number // 0-1, X center of pattern
  centerY?: number // 0-1, Y center of pattern
  angle?: number // Rotation angle in radians
  scale?: number // Scale of the dots
  grayscale?: boolean // Use grayscale dots
  cmyk?: boolean // Use CMYK halftone
}

export class DotScreenPass extends ShaderPass {
  private _centerX: number
  private _centerY: number
  private _angle: number
  private _scale: number
  private _grayscale: boolean
  private _cmyk: boolean

  constructor(config: DotScreenConfig = {}) {
    super(
      {
        uniforms: {
          inputTexture: { type: 't', value: null },
          resolution: { type: 'v2', value: [1, 1] },
          center: { type: 'v2', value: [config.centerX ?? 0.5, config.centerY ?? 0.5] },
          angle: { type: 'f', value: config.angle ?? 1.57 },
          scale: { type: 'f', value: config.scale ?? 1.0 },
          grayscale: { type: 'b', value: config.grayscale ?? false },
          cmyk: { type: 'b', value: config.cmyk ?? false }
        },
        vertexShader: fullscreenVertexShader,
        fragmentShader: dotScreenFragmentShader
      },
      { needsSwap: true }
    )

    this._centerX = config.centerX ?? 0.5
    this._centerY = config.centerY ?? 0.5
    this._angle = config.angle ?? 1.57
    this._scale = config.scale ?? 1.0
    this._grayscale = config.grayscale ?? false
    this._cmyk = config.cmyk ?? false
  }

  setSize(width: number, height: number): void {
    super.setSize(width, height)
    this.setUniforms({
      resolution: [width, height],
      center: [this._centerX * width, this._centerY * height]
    })
  }

  get centerX(): number {
    return this._centerX
  }

  set centerX(value: number) {
    this._centerX = Math.max(0, Math.min(1, value))
    if (this.width > 0) {
      this.setUniforms({ center: [this._centerX * this.width, this._centerY * this.height] })
    }
  }

  get centerY(): number {
    return this._centerY
  }

  set centerY(value: number) {
    this._centerY = Math.max(0, Math.min(1, value))
    if (this.width > 0) {
      this.setUniforms({ center: [this._centerX * this.width, this._centerY * this.height] })
    }
  }

  get angle(): number {
    return this._angle
  }

  set angle(value: number) {
    this._angle = value
    this.setUniforms({ angle: this._angle })
  }

  get scale(): number {
    return this._scale
  }

  set scale(value: number) {
    this._scale = Math.max(0.1, Math.min(5, value))
    this.setUniforms({ scale: this._scale })
  }

  get grayscale(): boolean {
    return this._grayscale
  }

  set grayscale(value: boolean) {
    this._grayscale = value
    this.setUniforms({ grayscale: this._grayscale })
  }

  get cmyk(): boolean {
    return this._cmyk
  }

  set cmyk(value: boolean) {
    this._cmyk = value
    this.setUniforms({ cmyk: this._cmyk })
  }

  updateConfig(config: DotScreenConfig): void {
    if (config.centerX !== undefined) this.centerX = config.centerX
    if (config.centerY !== undefined) this.centerY = config.centerY
    if (config.angle !== undefined) this.angle = config.angle
    if (config.scale !== undefined) this.scale = config.scale
    if (config.grayscale !== undefined) this.grayscale = config.grayscale
    if (config.cmyk !== undefined) this.cmyk = config.cmyk
  }
}

export default DotScreenPass
