// Reactive Orb Fragment Shader
// Fresnel edge glow with Phong lighting

uniform vec3 uColor;
uniform float uFresnelIntensity;
uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  // Fresnel effect (edge glow)
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
  fresnel = pow(fresnel, 3.0) * uFresnelIntensity;

  // Simple lighting (two point lights)
  vec3 lightPos1 = vec3(5.0, 5.0, 5.0);
  vec3 lightPos2 = vec3(-5.0, -5.0, 5.0);
  vec3 lightColor1 = vec3(0.3, 0.5, 1.0); // Blue
  vec3 lightColor2 = vec3(1.0, 0.3, 0.5); // Pink

  vec3 lightDir1 = normalize(lightPos1 - vWorldPosition);
  vec3 lightDir2 = normalize(lightPos2 - vWorldPosition);

  float diffuse1 = max(dot(vNormal, lightDir1), 0.0);
  float diffuse2 = max(dot(vNormal, lightDir2), 0.0);

  // Combine lighting
  vec3 lighting = lightColor1 * diffuse1 * 0.5 + lightColor2 * diffuse2 * 0.5;

  // Base color with lighting
  vec3 finalColor = uColor * (lighting + 0.3); // 0.3 = ambient

  // Add Fresnel glow
  finalColor += uColor * fresnel;

  // Pulsing animation
  float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
  finalColor *= pulse;

  gl_FragColor = vec4(finalColor, 1.0);
}
