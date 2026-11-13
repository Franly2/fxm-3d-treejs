import * as THREE from 'three';

export type SkyMood = 'sun' | 'moon';

/**
 * Builds a procedural equirectangular PMREM environment map for IBL reflections
 * and sky/ground bounce lighting (sunlight in light mode, moonlight in dark mode).
 */
export function createSkyEnvironment(
  renderer: THREE.WebGLRenderer,
  mood: SkyMood
): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (mood === 'sun') {
    grad.addColorStop(0.00, '#4682cc'); // Zenith sky
    grad.addColorStop(0.28, '#88bde8'); // Upper sky
    grad.addColorStop(0.49, '#f6ead9'); // Warm horizon
    grad.addColorStop(0.51, '#c8beb2'); // Ground horizon
    grad.addColorStop(0.78, '#8b847c'); // Mid ground bounce
    grad.addColorStop(1.00, '#5a5652'); // Nadir
  } else {
    grad.addColorStop(0.00, '#0a1226'); // Midnight zenith
    grad.addColorStop(0.28, '#17294b'); // Night sky
    grad.addColorStop(0.49, '#395585'); // Cool moonlit horizon
    grad.addColorStop(0.51, '#1e283b'); // Ground horizon
    grad.addColorStop(0.78, '#121824'); // Dark ground
    grad.addColorStop(1.00, '#080b11'); // Nadir
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Celestial disc + atmospheric halo for crisp specular highlights on metals & glass
  const cx = canvas.width * 0.62;
  const cy = canvas.height * 0.21;
  const haloRadius = mood === 'sun' ? 95 : 85;
  const halo = ctx.createRadialGradient(cx, cy, 4, cx, cy, haloRadius);
  if (mood === 'sun') {
    halo.addColorStop(0.00, 'rgba(255, 250, 235, 1.0)');
    halo.addColorStop(0.14, 'rgba(255, 238, 200, 0.85)');
    halo.addColorStop(0.45, 'rgba(255, 224, 170, 0.28)');
    halo.addColorStop(1.00, 'rgba(255, 224, 170, 0.0)');
  } else {
    halo.addColorStop(0.00, 'rgba(235, 245, 255, 0.95)');
    halo.addColorStop(0.14, 'rgba(185, 215, 255, 0.72)');
    halo.addColorStop(0.45, 'rgba(120, 165, 240, 0.22)');
    halo.addColorStop(1.00, 'rgba(120, 165, 240, 0.0)');
  }
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const equirect = new THREE.CanvasTexture(canvas);
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envTexture = pmrem.fromEquirectangular(equirect).texture;

  equirect.dispose();
  pmrem.dispose();

  return envTexture;
}

/**
 * Builds a subtle 2D sky backdrop texture for the viewport background.
 */
export function createSkyBackdropTexture(mood: SkyMood): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (mood === 'sun') {
    grad.addColorStop(0.00, '#d5e5f6');
    grad.addColorStop(0.45, '#eaf1f9');
    grad.addColorStop(0.82, '#f5f4f1');
    grad.addColorStop(1.00, '#ece9e3');
  } else {
    grad.addColorStop(0.00, '#060a14');
    grad.addColorStop(0.45, '#0d1629');
    grad.addColorStop(0.82, '#15223b');
    grad.addColorStop(1.00, '#101829');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle sun/moon atmospheric glow in upper-right sky
  const gx = canvas.width * 0.78;
  const gy = canvas.height * 0.16;
  const glow = ctx.createRadialGradient(gx, gy, 6, gx, gy, 230);
  if (mood === 'sun') {
    glow.addColorStop(0.0, 'rgba(255, 247, 224, 0.65)');
    glow.addColorStop(0.4, 'rgba(255, 240, 205, 0.22)');
    glow.addColorStop(1.0, 'rgba(255, 240, 205, 0.0)');
  } else {
    glow.addColorStop(0.0, 'rgba(205, 226, 255, 0.22)');
    glow.addColorStop(0.4, 'rgba(130, 170, 245, 0.08)');
    glow.addColorStop(1.0, 'rgba(130, 170, 245, 0.0)');
  }
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

