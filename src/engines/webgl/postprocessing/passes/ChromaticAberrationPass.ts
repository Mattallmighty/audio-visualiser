/**
 * ChromaticAberrationPass - RGB channel lens distortion effect
 *
 * Separates the red, green, and blue channels by radially offsetting
 * each from the center. Amount can be driven by volume intensity for
 * audio-reactive fringing on beats.
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const fragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform float amount;      // base separation strength (0..1, typically 0.002..0.01)
  uniform float volumeMult;  // extra multiplier driven by u_volumeIntensity (0..1)

  varying vec2 v_uv;

  void main() {
    vec2 center = vec2(0.5);
    vec2 dir = v_uv - center;
    float dist = length(dir);

    float strength = amount * (1.0 + volumeMult * 3.0);

    // Radial offset: channels spread outward from center
    vec2 redOffset   = v_uv + dir * strength * dist;
    vec2 greenOffset = v_uv;
    vec2 blueOffset  = v_uv - dir * strength * dist;

    float r = texture2D(inputTexture, redOffset).r;
    float g = texture2D(inputTexture, greenOffset).g;
    float b = texture2D(inputTexture, blueOffset).b;
    float a = texture2D(inputTexture, v_uv).a;

    gl_FragColor = vec4(r, g, b, a);
  }
`

export interface ChromaticAberrationConfig {
  amount?: number
  volumeMult?: number
}

export class ChromaticAberrationPass extends ShaderPass {
  constructor(config: ChromaticAberrationConfig = {}) {
    super({
      uniforms: {
        inputTexture: { type: 't', value: null },
        amount: { type: 'f', value: config.amount ?? 0.003 },
        volumeMult: { type: 'f', value: config.volumeMult ?? 0 },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader,
    })
  }

  updateConfig(config: ChromaticAberrationConfig): void {
    if (config.amount !== undefined) this.setUniforms({ amount: config.amount })
    if (config.volumeMult !== undefined) this.setUniforms({ volumeMult: config.volumeMult })
  }

  /** Call each frame with the current volume intensity (0–1) */
  updateVolume(intensity: number): void {
    this.setUniforms({ volumeMult: Math.max(0, intensity) })
  }
}

export default ChromaticAberrationPass
