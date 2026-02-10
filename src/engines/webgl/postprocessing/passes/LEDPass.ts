/**
 * LEDPass - LED matrix/pixelation effect
 *
 * Simulates an LED display by pixelating the image into a grid
 * of circular LEDs with optional glow and spacing.
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const ledFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform vec2 resolution;
  uniform float spacing;
  uniform float size;
  uniform float blur;
  uniform float brightness;
  uniform bool showGrid;

  varying vec2 v_uv;

  void main() {
    // Calculate grid cell
    vec2 gridSize = vec2(spacing);
    vec2 cellCount = resolution / gridSize;

    // Pixelate UV to grid
    vec2 cellIndex = floor(v_uv * cellCount);
    vec2 cellCenter = (cellIndex + 0.5) / cellCount;

    // Sample color at cell center
    vec4 color = texture2D(inputTexture, cellCenter);

    // Calculate position within cell (0-1)
    vec2 cellUV = fract(v_uv * cellCount);

    // Distance from cell center
    vec2 pos = cellUV - 0.5;
    float dist = length(pos);

    // LED circle mask with soft edge
    float ledRadius = size / spacing * 0.5;
    float led = 1.0 - smoothstep(ledRadius - blur * 0.01, ledRadius + blur * 0.01, dist);

    // Apply LED mask
    color.rgb *= led * brightness;

    // Optional grid lines
    if (showGrid) {
      float gridLine = step(0.95, max(cellUV.x, cellUV.y));
      color.rgb = mix(color.rgb, vec3(0.1), gridLine * 0.5);
    }

    // Add slight glow around LEDs
    float glow = exp(-dist * dist * 20.0) * 0.3;
    color.rgb += color.rgb * glow;

    gl_FragColor = color;
  }
`

export interface LEDConfig {
  spacing?: number
  size?: number
  blur?: number
  brightness?: number
  showGrid?: boolean
}

export class LEDPass extends ShaderPass {
  private _spacing: number
  private _size: number
  private _blur: number
  private _brightness: number
  private _showGrid: boolean

  constructor(config: LEDConfig = {}) {
    super({
      uniforms: {
        inputTexture: { type: 't', value: null },
        resolution: { type: 'v2', value: [1, 1] },
        spacing: { type: 'f', value: 10 },
        size: { type: 'f', value: 6 },
        blur: { type: 'f', value: 2 },
        brightness: { type: 'f', value: 1.2 },
        showGrid: { type: 'b', value: false }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: ledFragmentShader
    })

    this._spacing = config.spacing ?? 10
    this._size = config.size ?? 6
    this._blur = config.blur ?? 2
    this._brightness = config.brightness ?? 1.2
    this._showGrid = config.showGrid ?? false
  }

  get spacing(): number {
    return this._spacing
  }

  set spacing(value: number) {
    this._spacing = Math.max(4, Math.min(50, value))
    this.setUniforms({ spacing: this._spacing })
  }

  get size(): number {
    return this._size
  }

  set size(value: number) {
    this._size = Math.max(2, Math.min(this._spacing, value))
    this.setUniforms({ size: this._size })
  }

  get blur(): number {
    return this._blur
  }

  set blur(value: number) {
    this._blur = Math.max(0, Math.min(10, value))
    this.setUniforms({ blur: this._blur })
  }

  get brightness(): number {
    return this._brightness
  }

  set brightness(value: number) {
    this._brightness = Math.max(0.5, Math.min(2, value))
    this.setUniforms({ brightness: this._brightness })
  }

  get showGrid(): boolean {
    return this._showGrid
  }

  set showGrid(value: boolean) {
    this._showGrid = value
    this.setUniforms({ showGrid: value })
  }

  updateConfig(config: LEDConfig): void {
    if (config.spacing !== undefined) this.spacing = config.spacing
    if (config.size !== undefined) this.size = config.size
    if (config.blur !== undefined) this.blur = config.blur
    if (config.brightness !== undefined) this.brightness = config.brightness
    if (config.showGrid !== undefined) this.showGrid = config.showGrid
  }
}

export default LEDPass
