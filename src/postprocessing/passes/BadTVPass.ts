/**
 * BadTVPass - Creates retro CRT/VHS distortion effects
 *
 * Features:
 * - Scanlines
 * - Horizontal distortion/wobble
 * - Static noise
 * - Rolling bar effect
 * - RGB split for VHS look
 * - Inspired by Astrofox's BadTV shader
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const badTVFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform vec2 resolution;
  uniform float time;

  // Effect intensities
  uniform float distortion;    // Horizontal wave distortion
  uniform float distortion2;   // Fine distortion
  uniform float speed;         // Animation speed
  uniform float rollSpeed;     // Vertical rolling speed

  // Additional effects
  uniform float scanlineIntensity;
  uniform float scanlineCount;
  uniform float staticNoise;
  uniform float rgbSplit;

  varying vec2 v_uv;

  // Pseudo-random functions
  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float rand(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  // Noise function
  float noise(float t) {
    float i = floor(t);
    float f = fract(t);
    return mix(rand(i), rand(i + 1.0), smoothstep(0.0, 1.0, f));
  }

  void main() {
    vec2 uv = v_uv;
    float t = time * speed;

    // Apply horizontal distortion (wavey lines)
    float distAmount = (noise(uv.y * 10.0 + t) * 2.0 - 1.0) * distortion;
    float fineDistAmount = (noise(uv.y * 100.0 + t * 2.0) * 2.0 - 1.0) * distortion2;
    uv.x += distAmount * 0.01 + fineDistAmount * 0.005;

    // Vertical rolling (like VHS tracking issues)
    if (rollSpeed > 0.0) {
      float rollLine = mod(time * rollSpeed, 1.0);
      float rollZone = smoothstep(rollLine - 0.1, rollLine, uv.y) *
                       smoothstep(rollLine + 0.1, rollLine, uv.y);
      uv.y += rollZone * 0.1;
    }

    // Wrap UV
    uv = fract(uv);

    // Sample with RGB split for VHS chromatic aberration
    vec4 color;
    if (rgbSplit > 0.0) {
      float splitAmount = rgbSplit * 0.01;
      float r = texture2D(inputTexture, uv + vec2(splitAmount, 0.0)).r;
      float g = texture2D(inputTexture, uv).g;
      float b = texture2D(inputTexture, uv - vec2(splitAmount, 0.0)).b;
      color = vec4(r, g, b, 1.0);
    } else {
      color = texture2D(inputTexture, uv);
    }

    // Apply scanlines
    if (scanlineIntensity > 0.0) {
      float scanline = sin(uv.y * scanlineCount * 3.14159) * 0.5 + 0.5;
      scanline = pow(scanline, 2.0);
      color.rgb -= scanline * scanlineIntensity;
    }

    // Apply static noise
    if (staticNoise > 0.0) {
      float staticVal = rand(uv + fract(t * 100.0));
      // More noise at bottom of screen (like old TVs)
      float noiseStrength = staticNoise * (0.5 + 0.5 * pow(uv.y, 2.0));
      color.rgb += (staticVal - 0.5) * noiseStrength;
    }

    // Slight brightness variation
    float brightness = 1.0 - (noise(t) * 0.02);
    color.rgb *= brightness;

    // Clamp
    color.rgb = clamp(color.rgb, 0.0, 1.0);

    gl_FragColor = color;
  }
`

export interface BadTVConfig {
  distortion?: number // Main horizontal distortion (0-1)
  distortion2?: number // Fine distortion (0-1)
  speed?: number // Animation speed multiplier
  rollSpeed?: number // Vertical rolling speed (0=off)
  scanlineIntensity?: number // Scanline darkness (0-1)
  scanlineCount?: number // Number of scanlines
  staticNoise?: number // Static noise amount (0-1)
  rgbSplit?: number // RGB channel separation (0-1)
}

export class BadTVPass extends ShaderPass {
  private _distortion: number
  private _distortion2: number
  private _speed: number
  private _rollSpeed: number
  private _scanlineIntensity: number
  private _scanlineCount: number
  private _staticNoise: number
  private _rgbSplit: number
  private _time: number = 0

  constructor(config: BadTVConfig = {}) {
    super(
      {
        uniforms: {
          inputTexture: { type: 't', value: null },
          resolution: { type: 'v2', value: [1, 1] },
          time: { type: 'f', value: 0 },
          distortion: { type: 'f', value: config.distortion ?? 0.1 },
          distortion2: { type: 'f', value: config.distortion2 ?? 0.1 },
          speed: { type: 'f', value: config.speed ?? 1.0 },
          rollSpeed: { type: 'f', value: config.rollSpeed ?? 0.0 },
          scanlineIntensity: { type: 'f', value: config.scanlineIntensity ?? 0.3 },
          scanlineCount: { type: 'f', value: config.scanlineCount ?? 300 },
          staticNoise: { type: 'f', value: config.staticNoise ?? 0.1 },
          rgbSplit: { type: 'f', value: config.rgbSplit ?? 0.5 }
        },
        vertexShader: fullscreenVertexShader,
        fragmentShader: badTVFragmentShader
      },
      { needsSwap: true }
    )

    this._distortion = config.distortion ?? 0.1
    this._distortion2 = config.distortion2 ?? 0.1
    this._speed = config.speed ?? 1.0
    this._rollSpeed = config.rollSpeed ?? 0.0
    this._scanlineIntensity = config.scanlineIntensity ?? 0.3
    this._scanlineCount = config.scanlineCount ?? 300
    this._staticNoise = config.staticNoise ?? 0.1
    this._rgbSplit = config.rgbSplit ?? 0.5
  }

  setSize(width: number, height: number): void {
    super.setSize(width, height)
    this.setUniforms({ resolution: [width, height] })
  }

  // Call this each frame to update the animation
  update(deltaTime: number): void {
    this._time += deltaTime * this._speed
    this.setUniforms({ time: this._time })
  }

  get distortion(): number {
    return this._distortion
  }

  set distortion(value: number) {
    this._distortion = Math.max(0, Math.min(1, value))
    this.setUniforms({ distortion: this._distortion })
  }

  get distortion2(): number {
    return this._distortion2
  }

  set distortion2(value: number) {
    this._distortion2 = Math.max(0, Math.min(1, value))
    this.setUniforms({ distortion2: this._distortion2 })
  }

  get speed(): number {
    return this._speed
  }

  set speed(value: number) {
    this._speed = Math.max(0, Math.min(5, value))
    this.setUniforms({ speed: this._speed })
  }

  get rollSpeed(): number {
    return this._rollSpeed
  }

  set rollSpeed(value: number) {
    this._rollSpeed = Math.max(0, Math.min(2, value))
    this.setUniforms({ rollSpeed: this._rollSpeed })
  }

  get scanlineIntensity(): number {
    return this._scanlineIntensity
  }

  set scanlineIntensity(value: number) {
    this._scanlineIntensity = Math.max(0, Math.min(1, value))
    this.setUniforms({ scanlineIntensity: this._scanlineIntensity })
  }

  get scanlineCount(): number {
    return this._scanlineCount
  }

  set scanlineCount(value: number) {
    this._scanlineCount = Math.max(50, Math.min(1000, value))
    this.setUniforms({ scanlineCount: this._scanlineCount })
  }

  get staticNoise(): number {
    return this._staticNoise
  }

  set staticNoise(value: number) {
    this._staticNoise = Math.max(0, Math.min(1, value))
    this.setUniforms({ staticNoise: this._staticNoise })
  }

  get rgbSplit(): number {
    return this._rgbSplit
  }

  set rgbSplit(value: number) {
    this._rgbSplit = Math.max(0, Math.min(2, value))
    this.setUniforms({ rgbSplit: this._rgbSplit })
  }

  updateConfig(config: BadTVConfig): void {
    if (config.distortion !== undefined) this.distortion = config.distortion
    if (config.distortion2 !== undefined) this.distortion2 = config.distortion2
    if (config.speed !== undefined) this.speed = config.speed
    if (config.rollSpeed !== undefined) this.rollSpeed = config.rollSpeed
    if (config.scanlineIntensity !== undefined) this.scanlineIntensity = config.scanlineIntensity
    if (config.scanlineCount !== undefined) this.scanlineCount = config.scanlineCount
    if (config.staticNoise !== undefined) this.staticNoise = config.staticNoise
    if (config.rgbSplit !== undefined) this.rgbSplit = config.rgbSplit
  }
}

export default BadTVPass
