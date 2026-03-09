/**
 * Volume-aware starter template for the custom shader editor.
 * Demonstrates all audio uniforms including the volume uniforms.
 */
export const volumeTemplateShader = `precision highp float;

// ── Resolution & time ─────────────────────────────────────────
uniform vec2  u_resolution;   // canvas size in pixels
uniform float u_time;         // wall-clock time (seconds × speed)

// ── Audio ─────────────────────────────────────────────────────
uniform float u_energy;       // RMS overall energy
uniform float u_beat;         // cumulative beat accumulator
uniform float u_bass;         // 20-250 Hz band
uniform float u_mid;          // 250-4000 Hz band
uniform float u_high;         // 4000-20000 Hz band

// ── Volume normalizer ────────────────────────
uniform float u_volumeTime;       // use instead of u_time for audio-paced animation
uniform float u_volumeIntensity;  // 0→1 combined intensity (fast×mid×slow)
uniform float u_volumeNorm;       // 0=quiet, 1=mean volume (unclamped)

// ── Theme colors ──────────────────────────────────────────────
uniform vec3  u_primaryColor;
uniform vec3  u_secondaryColor;

varying vec2 v_position; // -1..1 in both axes

#define PI 3.14159265359

void main() {
  // Correct aspect ratio
  vec2 uv = v_position;
  uv.x *= u_resolution.x / u_resolution.y;

  // Use u_volumeTime for audio-paced animation instead of wall clock
  float t = u_volumeTime * 0.5;

  float r = length(uv);
  float a = atan(uv.y, uv.x);

  // Pulse radius with volume intensity
  float pulse = 1.0 + u_volumeIntensity * 0.4;
  float ring = smoothstep(0.02, 0.0, abs(r - 0.5 * pulse));

  // Rotate with beat
  float rot = a + u_beat * 0.3 + t;
  float bands = abs(sin(rot * 6.0)) * u_volumeNorm;

  vec3 color = mix(u_primaryColor, u_secondaryColor, bands);
  color += ring * u_primaryColor * 2.0;

  // Vignette
  color *= smoothstep(1.4, 0.3, r);

  gl_FragColor = vec4(color, 1.0);
}
`;
