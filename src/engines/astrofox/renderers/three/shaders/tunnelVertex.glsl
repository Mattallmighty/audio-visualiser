// Neon Tunnel Vertex Shader
// Audio-reactive radial pulsation

uniform float uTime;
uniform float uAudioValue;
uniform float uSensitivity;

varying vec3 vPosition;
varying vec3 vNormal;
varying float vDistanceFromCenter;

void main() {
  vNormal = normalize(normalMatrix * normal);

  // Calculate distance from center (Y-axis for cylinder)
  vec2 centerDist = vec2(position.x, position.z);
  vDistanceFromCenter = length(centerDist);

  // Audio-reactive radial pulsation
  float radiusScale = 1.0 + uAudioValue * uSensitivity * 0.3;
  vec3 displaced = position;
  displaced.x *= radiusScale;
  displaced.z *= radiusScale;

  // Add subtle wave motion
  float wave = sin(position.y * 2.0 + uTime * 2.0) * 0.05;
  displaced.x += wave * position.x;
  displaced.z += wave * position.z;

  vPosition = displaced;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
