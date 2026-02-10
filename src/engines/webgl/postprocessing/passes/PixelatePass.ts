/**
 * PixelatePass - Creates a retro pixelation effect
 *
 * Features:
 * - Adjustable pixel size
 * - Audio-reactive pixel size via uniform
 * - Maintains aspect ratio
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const pixelateFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform vec2 resolution;
  uniform float pixelSize;
  uniform bool roundPixels;

  varying vec2 v_uv;

  void main() {
    // Calculate pixel dimensions
    vec2 pixelDimensions = vec2(pixelSize) / resolution;

    // Quantize UV coordinates to pixel grid
    vec2 pixelatedUV;
    if (roundPixels) {
      // Round to nearest pixel center
      pixelatedUV = floor(v_uv / pixelDimensions + 0.5) * pixelDimensions;
    } else {
      // Floor to pixel corner
      pixelatedUV = floor(v_uv / pixelDimensions) * pixelDimensions;
    }

    // Sample at quantized position
    vec4 color = texture2D(inputTexture, pixelatedUV);

    gl_FragColor = color;
  }
`

export interface PixelateConfig {
  pixelSize?: number // Size of each pixel block
  roundPixels?: boolean // Round to nearest vs floor
}

export class PixelatePass extends ShaderPass {
  private _pixelSize: number
  private _roundPixels: boolean

  constructor(config: PixelateConfig = {}) {
    super(
      {
        uniforms: {
          inputTexture: { type: 't', value: null },
          resolution: { type: 'v2', value: [1, 1] },
          pixelSize: { type: 'f', value: config.pixelSize ?? 8 },
          roundPixels: { type: 'b', value: config.roundPixels ?? true }
        },
        vertexShader: fullscreenVertexShader,
        fragmentShader: pixelateFragmentShader
      },
      { needsSwap: true }
    )

    this._pixelSize = config.pixelSize ?? 8
    this._roundPixels = config.roundPixels ?? true
  }

  setSize(width: number, height: number): void {
    super.setSize(width, height)
    this.setUniforms({ resolution: [width, height] })
  }

  get pixelSize(): number {
    return this._pixelSize
  }

  set pixelSize(value: number) {
    this._pixelSize = Math.max(1, Math.min(64, value))
    this.setUniforms({ pixelSize: this._pixelSize })
  }

  get roundPixels(): boolean {
    return this._roundPixels
  }

  set roundPixels(value: boolean) {
    this._roundPixels = value
    this.setUniforms({ roundPixels: this._roundPixels })
  }

  updateConfig(config: PixelateConfig): void {
    if (config.pixelSize !== undefined) this.pixelSize = config.pixelSize
    if (config.roundPixels !== undefined) this.roundPixels = config.roundPixels
  }
}

export default PixelatePass
