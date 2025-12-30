/**
 * MirrorPass - Creates mirror/reflection effects
 *
 * Features:
 * - Horizontal, vertical, or quadrant mirroring
 * - Adjustable mirror position
 * - Multiple mirror modes
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

const mirrorFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform int mode;        // 0=horizontal, 1=vertical, 2=quadrant, 3=diagonal
  uniform float position;  // 0-1, position of mirror line
  uniform bool flip;       // Flip which side is mirrored

  varying vec2 v_uv;

  void main() {
    vec2 uv = v_uv;

    if (mode == 0) {
      // Horizontal mirror (left-right)
      if (flip) {
        if (uv.x > position) {
          uv.x = 2.0 * position - uv.x;
        }
      } else {
        if (uv.x < position) {
          uv.x = 2.0 * position - uv.x;
        }
      }
    } else if (mode == 1) {
      // Vertical mirror (top-bottom)
      if (flip) {
        if (uv.y > position) {
          uv.y = 2.0 * position - uv.y;
        }
      } else {
        if (uv.y < position) {
          uv.y = 2.0 * position - uv.y;
        }
      }
    } else if (mode == 2) {
      // Quadrant mirror (both axes)
      if (uv.x < position) {
        uv.x = 2.0 * position - uv.x;
      }
      if (uv.y < position) {
        uv.y = 2.0 * position - uv.y;
      }
    } else if (mode == 3) {
      // Diagonal mirror
      vec2 center = vec2(position);
      vec2 d = uv - center;
      if (d.x + d.y < 0.0) {
        // Mirror across diagonal
        uv = center + vec2(-d.y, -d.x);
      }
    }

    // Clamp UV to valid range
    uv = clamp(uv, 0.0, 1.0);

    gl_FragColor = texture2D(inputTexture, uv);
  }
`

export type MirrorMode = 'horizontal' | 'vertical' | 'quadrant' | 'diagonal'

export interface MirrorConfig {
  mode?: MirrorMode
  position?: number // 0-1, position of mirror line
  flip?: boolean // Flip which side is mirrored
}

export class MirrorPass extends ShaderPass {
  private _mode: MirrorMode
  private _position: number
  private _flip: boolean

  constructor(config: MirrorConfig = {}) {
    const modeIndex = getModeIndex(config.mode ?? 'horizontal')

    super(
      {
        uniforms: {
          inputTexture: { type: 't', value: null },
          mode: { type: 'i', value: modeIndex },
          position: { type: 'f', value: config.position ?? 0.5 },
          flip: { type: 'b', value: config.flip ?? false }
        },
        vertexShader: fullscreenVertexShader,
        fragmentShader: mirrorFragmentShader
      },
      { needsSwap: true }
    )

    this._mode = config.mode ?? 'horizontal'
    this._position = config.position ?? 0.5
    this._flip = config.flip ?? false
  }

  get mode(): MirrorMode {
    return this._mode
  }

  set mode(value: MirrorMode) {
    this._mode = value
    this.setUniforms({ mode: getModeIndex(value) })
  }

  get position(): number {
    return this._position
  }

  set position(value: number) {
    this._position = Math.max(0, Math.min(1, value))
    this.setUniforms({ position: this._position })
  }

  get flip(): boolean {
    return this._flip
  }

  set flip(value: boolean) {
    this._flip = value
    this.setUniforms({ flip: this._flip })
  }

  updateConfig(config: MirrorConfig): void {
    if (config.mode !== undefined) this.mode = config.mode
    if (config.position !== undefined) this.position = config.position
    if (config.flip !== undefined) this.flip = config.flip
  }
}

function getModeIndex(mode: MirrorMode): number {
  switch (mode) {
    case 'horizontal':
      return 0
    case 'vertical':
      return 1
    case 'quadrant':
      return 2
    case 'diagonal':
      return 3
    default:
      return 0
  }
}

export default MirrorPass
