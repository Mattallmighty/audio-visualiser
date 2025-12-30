/**
 * GlitchPass - Digital glitch/distortion effect
 *
 * Creates random horizontal displacement, color channel shifting,
 * and noise artifacts for a digital glitch aesthetic.
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const glitchFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform vec2 resolution;
  uniform float time;
  uniform float amount;
  uniform float speed;
  uniform float seed;
  uniform bool bypassNormal;

  varying vec2 v_uv;

  // Random functions
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float randomLine(float y, float seed) {
    return fract(sin(y * 123.45 + seed) * 43758.5453);
  }

  void main() {
    vec2 uv = v_uv;
    float t = time * speed;

    // Skip effect if amount is zero or bypassing normal frames
    if (amount < 0.001 || bypassNormal) {
      gl_FragColor = texture2D(inputTexture, uv);
      return;
    }

    // Random glitch trigger (not every frame)
    float glitchTrigger = step(0.9, random(vec2(floor(t * 10.0), seed)));

    if (glitchTrigger < 0.5) {
      gl_FragColor = texture2D(inputTexture, uv);
      return;
    }

    // Horizontal shift blocks
    float blockY = floor(uv.y * 20.0);
    float blockRand = randomLine(blockY, seed + floor(t));
    float shiftAmount = (blockRand - 0.5) * amount * 0.2;

    // Only apply shift to some blocks
    shiftAmount *= step(0.7, blockRand);

    // Scanline displacement
    float scanline = sin(uv.y * resolution.y * 0.5 + t * 100.0) * amount * 0.01;

    // Apply horizontal displacement
    vec2 shiftedUV = uv;
    shiftedUV.x += shiftAmount + scanline;

    // Color channel separation (RGB shift)
    float channelShift = amount * 0.02;
    vec4 colorR = texture2D(inputTexture, shiftedUV + vec2(channelShift, 0.0));
    vec4 colorG = texture2D(inputTexture, shiftedUV);
    vec4 colorB = texture2D(inputTexture, shiftedUV - vec2(channelShift, 0.0));

    vec4 color = vec4(colorR.r, colorG.g, colorB.b, 1.0);

    // Random noise blocks
    float noiseBlockY = floor(uv.y * 8.0);
    float noiseBlockX = floor(uv.x * 8.0);
    float noiseBlock = random(vec2(noiseBlockX, noiseBlockY) + floor(t * 5.0));

    if (noiseBlock > 0.95 && amount > 0.3) {
      // Replace with noise
      float noise = random(uv + t);
      color = vec4(vec3(noise), 1.0);
    }

    // Vertical color bands (rare)
    float vertBand = step(0.98, random(vec2(floor(uv.x * 30.0), floor(t * 3.0))));
    if (vertBand > 0.5 && amount > 0.5) {
      color.rgb = vec3(random(vec2(uv.x, t)));
    }

    // Occasional complete inversion
    float invertChance = step(0.995, random(vec2(floor(t), seed)));
    if (invertChance > 0.5 && amount > 0.7) {
      color.rgb = 1.0 - color.rgb;
    }

    gl_FragColor = color;
  }
`

export interface GlitchConfig {
  amount?: number
  speed?: number
  seed?: number
}

export class GlitchPass extends ShaderPass {
  private _amount: number
  private _speed: number
  private _seed: number
  private _time: number = 0
  private lastUpdate: number = Date.now()

  constructor(config: GlitchConfig = {}) {
    super({
      uniforms: {
        inputTexture: { type: 't', value: null },
        resolution: { type: 'v2', value: [1, 1] },
        time: { type: 'f', value: 0 },
        amount: { type: 'f', value: 0.5 },
        speed: { type: 'f', value: 1 },
        seed: { type: 'f', value: 0 },
        bypassNormal: { type: 'b', value: false }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: glitchFragmentShader
    })

    this._amount = config.amount ?? 0.5
    this._speed = config.speed ?? 1
    this._seed = config.seed ?? Math.random() * 1000
  }

  /**
   * Update time uniform for animation
   */
  update(): void {
    const now = Date.now()
    const delta = (now - this.lastUpdate) / 1000
    this.lastUpdate = now
    this._time += delta

    this.setUniforms({
      time: this._time,
      amount: this._amount,
      speed: this._speed,
      seed: this._seed
    })
  }

  render(inputTexture: WebGLTexture | null, outputFramebuffer: WebGLFramebuffer | null): void {
    this.update()
    super.render(inputTexture, outputFramebuffer)
  }

  get amount(): number {
    return this._amount
  }

  set amount(value: number) {
    this._amount = Math.max(0, Math.min(1, value))
  }

  get speed(): number {
    return this._speed
  }

  set speed(value: number) {
    this._speed = Math.max(0.1, Math.min(5, value))
  }

  /**
   * Trigger a glitch burst (temporarily increase amount)
   */
  trigger(intensity: number = 1, duration: number = 0.1): void {
    const originalAmount = this._amount
    this._amount = Math.min(1, originalAmount + intensity)

    setTimeout(() => {
      this._amount = originalAmount
    }, duration * 1000)
  }

  updateConfig(config: GlitchConfig): void {
    if (config.amount !== undefined) this.amount = config.amount
    if (config.speed !== undefined) this.speed = config.speed
    if (config.seed !== undefined) this._seed = config.seed
  }
}

export default GlitchPass
