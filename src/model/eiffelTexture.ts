import * as THREE from 'three';

/**
 * Procedural Puddled Wrought Iron Texture Generator (Brun Tour Eiffel)
 * Strict fidelity to the real Eiffel Tower ironwork:
 * - Authentic base tone rgb(153, 142, 131)
 * - Micro-rivet rows and riveted plate seams (plaques de fer puddlé rivetées)
 * - Horizontal rolling-mill grain striations and subtle surface weathering
 * - Specular roughness map for natural metallic sun sheen
 * - Micro-bump map for 3D embossed rivets and recessed seams
 *
 * Runs seamlessly in browser, and safely degrades to null in Node.js (GLB exporter).
 */
export function createEiffelTextures(): {
  colorMap: THREE.Texture | null;
  roughnessMap: THREE.Texture | null;
  bumpMap: THREE.Texture | null;
} {
  if (typeof document === 'undefined') {
    return { colorMap: null, roughnessMap: null, bumpMap: null };
  }

  const size = 256;

  // --------------------------------------------------------
  // 1. Color Map (Albedo Texture)
  // --------------------------------------------------------
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d');

  if (!ctx) {
    return { colorMap: null, roughnessMap: null, bumpMap: null };
  }

  // Base Brun Tour Eiffel rgb(153, 142, 131)
  ctx.fillStyle = 'rgb(153, 142, 131)';
  ctx.fillRect(0, 0, size, size);

  // Brushed rolling-mill iron grain striations
  for (let y = 0; y < size; y += 2) {
    const grainVar = (Math.sin(y * 12.3) * 0.5 + Math.cos(y * 7.1) * 0.5) * 8;
    const r = Math.min(255, Math.max(0, Math.round(153 + grainVar)));
    const g = Math.min(255, Math.max(0, Math.round(142 + grainVar)));
    const b = Math.min(255, Math.max(0, Math.round(131 + grainVar)));
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
    ctx.fillRect(0, y, size, 1.5);
  }

  // Subtle oxidation & weathering noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const pixels = imgData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    pixels[i]     = Math.min(255, Math.max(0, pixels[i] + noise));
    pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + noise));
    pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Riveted Iron Plate Seams (horizontal bands every 64px)
  const plateStep = 64;
  for (let y = 0; y < size; y += plateStep) {
    // Dark recessed groove
    ctx.strokeStyle = 'rgb(108, 98, 89)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();

    // Upper plate edge highlight
    ctx.strokeStyle = 'rgb(182, 171, 159)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 2);
    ctx.lineTo(size, y + 2);
    ctx.stroke();

    // Rows of spherical rivets along the plate seam
    const rivetPitch = 16;
    for (let x = rivetPitch / 2; x < size; x += rivetPitch) {
      // Rivet shadow
      ctx.fillStyle = 'rgb(95, 86, 78)';
      ctx.beginPath();
      ctx.arc(x + 0.5, y + 7.5, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Rivet body
      ctx.fillStyle = 'rgb(158, 147, 136)';
      ctx.beginPath();
      ctx.arc(x, y + 7, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Rivet highlight specular dot
      ctx.fillStyle = 'rgb(205, 194, 182)';
      ctx.beginPath();
      ctx.arc(x - 0.8, y + 6.2, 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(8, 32);

  // --------------------------------------------------------
  // 2. Roughness Map (Specular Variation & Weathering)
  // --------------------------------------------------------
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  if (rCtx) {
    // Base roughness ~ 0.52 (mid-gray 132)
    rCtx.fillStyle = 'rgb(132, 132, 132)';
    rCtx.fillRect(0, 0, size, size);

    // Weathered bands & plate friction
    for (let y = 0; y < size; y += plateStep) {
      rCtx.fillStyle = 'rgb(165, 165, 165)'; // More matte near seams
      rCtx.fillRect(0, y, size, 12);

      // Polished plate center
      rCtx.fillStyle = 'rgb(105, 105, 105)'; // Higher specular sheen
      rCtx.fillRect(0, y + 20, size, 28);
    }
  }

  const roughnessMap = rCtx ? new THREE.CanvasTexture(roughCanvas) : null;
  if (roughnessMap) {
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(8, 32);
  }

  // --------------------------------------------------------
  // 3. Bump Map (Micro-Relief Rivets & Seams)
  // --------------------------------------------------------
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (bCtx) {
    // Neutral 128 gray base
    bCtx.fillStyle = 'rgb(128, 128, 128)';
    bCtx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += plateStep) {
      // Recessed groove
      bCtx.strokeStyle = 'rgb(60, 60, 60)';
      bCtx.lineWidth = 2;
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.lineTo(size, y);
      bCtx.stroke();

      // Raised seam lip
      bCtx.strokeStyle = 'rgb(160, 160, 160)';
      bCtx.lineWidth = 1;
      bCtx.beginPath();
      bCtx.moveTo(0, y + 2);
      bCtx.lineTo(size, y + 2);
      bCtx.stroke();

      // Raised rivets
      const rivetPitch = 16;
      for (let x = rivetPitch / 2; x < size; x += rivetPitch) {
        bCtx.fillStyle = 'rgb(215, 215, 215)';
        bCtx.beginPath();
        bCtx.arc(x, y + 7, 2.5, 0, Math.PI * 2);
        bCtx.fill();
      }
    }
  }

  const bumpMap = bCtx ? new THREE.CanvasTexture(bumpCanvas) : null;
  if (bumpMap) {
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(8, 32);
  }

  return { colorMap, roughnessMap, bumpMap };
}

