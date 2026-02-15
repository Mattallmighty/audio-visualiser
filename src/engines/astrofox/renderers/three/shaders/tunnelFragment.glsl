// Neon Tunnel Fragment Shader
// Distance-based glow effect

uniform vec3 uColor;
uniform float uGlowIntensity;
uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;
varying float vDistanceFromCenter;

void main() {
  // Distance-based glow (brighter toward center)
  float glow = 1.0 - smoothstep(0.0, 1.5, vDistanceFromCenter);
  glow = pow(glow, 2.0) * uGlowIntensity;

  // Pulsing animation
  float pulse = sin(uTime * 3.0) * 0.2 + 0.8;

  // Final color with glow
  vec3 finalColor = uColor * (glow * pulse + 0.3);

  // Edge brightness (Fresnel-like)
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
  fresnel = pow(fresnel, 2.0);
  finalColor += uColor * fresnel * 0.5;

  gl_FragColor = vec4(finalColor, 1.0);
}
