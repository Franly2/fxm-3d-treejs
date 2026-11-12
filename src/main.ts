import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createChairModel } from './model/chairModel';
import { createRaceCarModel } from './model/raceCarModel';
import { createCoinModel } from './model/coinModel';
import { createTntModel } from './model/tntModel';
import { createRoadModel } from './model/roadModel';
import { createJetModel } from './model/jetModel';
import { createSagradaModel } from './model/sagradaModel';
import { createParisModel } from './model/parisModel';
import { REFERENCES_DATA, type ReferenceItem } from './referencesData';

let tabButtons: NodeListOf<HTMLButtonElement>;
let jetViewBar: HTMLElement | null = null;
let viewButtons: NodeListOf<HTMLButtonElement>;
let btnOpenRefs: HTMLElement | null = null;
let tntWorldTooltip: HTMLElement | null = null;
let isTntHovered = false;
const tntAnchorVec = new THREE.Vector3();

// 1. Scene setup
const scene = new THREE.Scene();
const defaultBgColor = new THREE.Color(0xf2f2f4);
const defaultFog = new THREE.Fog(0xf2f2f4, 6, 22);
scene.background = defaultBgColor;
scene.fog = defaultFog;

// Procedural Photorealistic Parisian Sky Texture (Rayleigh atmospheric scattering gradient)
function createParisSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Smooth atmospheric Rayleigh scattering vertical gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0.00, '#4b8cd1'); // Zenith rich cerulean blue
  grad.addColorStop(0.22, '#6ea3dc'); // Parisian sky blue
  grad.addColorStop(0.48, '#9fc6ea'); // Mid sky soft azure
  grad.addColorStop(0.72, '#cce4f7'); // Soft atmospheric pale cyan
  grad.addColorStop(0.88, '#edf4fb'); // Lower atmospheric light
  grad.addColorStop(1.00, '#f9ede0'); // Warm golden-cream haze at horizon

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle wispy cirrus cloud layers across upper atmosphere
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  for (let i = 0; i < 16; i++) {
    const y = 90 + i * 36 + Math.sin(i * 1.4) * 16;
    const h = 16 + (i % 4) * 7;
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.48 + ((i * 47) % 320) - 160, y, 460 + i * 22, h, (i % 3 - 1) * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft warm horizon haze gradient
  const hazeGrad = ctx.createLinearGradient(0, canvas.height * 0.76, 0, canvas.height);
  hazeGrad.addColorStop(0.0, 'rgba(249, 237, 224, 0.0)');
  hazeGrad.addColorStop(1.0, 'rgba(249, 237, 224, 0.65)');
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, canvas.height * 0.76, canvas.width, canvas.height * 0.24);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const parisSkyTexture = createParisSkyTexture();
const parisFog = new THREE.FogExp2('#d5e6f5', 0.012);

// 2. Camera setup
const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// 3. WebGL Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// 4. Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 0.5;
controls.maxDistance = 8;

// 5. Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff8ee, 2.1);
sunLight.position.set(2.2, 4.5, 3.2);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 12;
sunLight.shadow.camera.left = -2.2;
sunLight.shadow.camera.right = 2.2;
sunLight.shadow.camera.top = 2.2;
sunLight.shadow.camera.bottom = -2.2;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xbad2e8, 0.85);
fillLight.position.set(-2.5, 2.2, -2.0);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.65);
rimLight.position.set(0, 2.4, -3.2);
scene.add(rimLight);

// 6. Ground Shadow Receiver & Grid
const groundGeo = new THREE.PlaneGeometry(24, 24);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.16 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

const gridHelper = new THREE.GridHelper(6, 30, 0xcccccc, 0xe2e2e5);
gridHelper.position.y = 0.001;
scene.add(gridHelper);

// 7. Instantiate All Procedural Models
const chair = createChairModel();
scene.add(chair.root);

const raceCar = createRaceCarModel();
scene.add(raceCar.root);

const coinMain = createCoinModel();
scene.add(coinMain.root);

const coinExtra1 = createCoinModel();
scene.add(coinExtra1.root);

const coinExtra2 = createCoinModel();
scene.add(coinExtra2.root);

const tntTrap = createTntModel();
scene.add(tntTrap.root);

const road = createRoadModel(3.2, 1.65);
const roadTrack = road.root;
scene.add(roadTrack);

const jet = createJetModel();
scene.add(jet.root);

const sagrada = createSagradaModel();
scene.add(sagrada.root);

const paris = createParisModel();
scene.add(paris.root);

type ViewMode = 'paris' | 'sagrada' | 'jet' | 'showcase' | 'car' | 'coin' | 'tnt' | 'chair';
let currentMode: ViewMode = 'paris';

// 8. Camera View Presets
function setCameraView(view: string) {
  if (viewButtons) {
    viewButtons.forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  }

  if (currentMode === 'paris') {
    if (view === 'trocadero') {
      // 'trocadero' - matches back-eiffel.png view from Esplanade du Trocadéro!
      camera.fov = 54;
      camera.position.set(0.05, 0.62, 3.82);
      controls.target.set(0.05, 1.05, -0.73);
    } else if (view === 'trocadero_pov') {
      // 'trocadero_pov' - Center of Trocadéro checkered floor looking directly at Eiffel Tower
      camera.fov = 52;
      camera.position.set(0.05, 0.50, 3.35);
      controls.target.set(0.05, 0.72, -0.73);
    } else if (view === 'under') {
      // 'under' - 100% matches eiffel-under.jpg framing: on Pont d'Iéna, looking forward under the monumental arch into Champ de Mars
      camera.fov = 38;
      camera.position.set(0.05, 0.40, 1.25);
      controls.target.set(0.05, 0.32, -0.78);
    } else if (view === 'aerial') {
      // 'aerial' - matches left-right-eiffel.png high drone aerial panorama!
      camera.fov = 46;
      camera.position.set(-3.90, 3.40, 3.35);
      controls.target.set(0.15, 0.70, -0.65);
    } else if (view === 'champ') {
      // 'champ' - view from Champ de Mars lawns behind the tower
      camera.fov = 34;
      camera.position.set(0.05, 0.46, -3.35);
      controls.target.set(0.05, 0.90, -0.73);
    } else if (view === 'tower') {
      // 100% matches eiffel-tower.png framing (centered, soaring, from plinths to lightning needle)
      camera.fov = 34;
      camera.position.set(0.05, 1.82, 4.95);
      controls.target.set(0.05, 1.78, -0.78);
    } else if (view === 'spire') {
      // Matches the close-up crop of Spire, Level 2, and Level 3 / Summit
      camera.fov = 30;
      camera.position.set(0.05, 2.22, 3.10);
      controls.target.set(0.05, 2.15, -0.78);
    } else if (view === 'shaft_lower') {
      // Direct framing of Level 2 -> Mid Platform shaft section sent by user
      camera.fov = 27;
      camera.position.set(0.05, 1.49, 0.70);
      controls.target.set(0.05, 1.49, -0.78);
    } else if (view === 'legs') {
      // Direct framing of Level 1 -> Level 2 legs
      camera.fov = 24;
      camera.position.set(0.05, 0.72, 1.15);
      controls.target.set(0.05, 0.72, -0.78);
    } else if (view === 'boat') {
      camera.fov = 24;
      camera.position.set(-0.25, 0.45, 1.95);
      controls.target.set(-0.18, 0.08, 0.85);
    } else if (view === 'top') {
      camera.fov = 40;
      camera.position.set(0.001, 6.2, -0.40);
      controls.target.set(0.05, 0.20, -0.40);
    } else {
      // 'photo' - matches front-eiffel.png / riverside framing
      camera.fov = 35;
      camera.position.set(-0.72, 0.62, 2.05);
      controls.target.set(0.05, 0.82, -0.73);
    }
  } else if (currentMode === 'sagrada') {
    if (view === 'front') {
      camera.fov = 28;
      camera.position.set(0, 1.45, 5.2);
      controls.target.set(0, 0.95, 0.05);
    } else if (view === 'side') {
      camera.fov = 28;
      camera.position.set(-5.2, 1.45, -0.05);
      controls.target.set(0, 0.95, -0.05);
    } else if (view === 'top') {
      camera.fov = 32;
      camera.position.set(0.001, 5.5, 0.0);
      controls.target.set(0, 0.50, 0.0);
    } else if (view === 'spires') {
      camera.fov = 24;
      camera.position.set(-1.85, 2.45, 2.65);
      controls.target.set(0, 1.45, -0.02);
    } else {
      // 'sketch' - matches sagrada.png elevated corner angle
      camera.fov = 30;
      camera.position.set(-3.25, 2.55, 4.05);
      controls.target.set(0, 0.92, 0.02);
    }
  } else if (currentMode === 'jet') {
    camera.fov = 28;
    if (view === 'top') {
      camera.position.set(0.001, 3.2, 0.02);
      controls.target.set(0, 0.25, 0.02);
    } else if (view === 'side') {
      camera.position.set(2.8, 0.26, 0.02);
      controls.target.set(0, 0.26, 0.02);
    } else if (view === 'front') {
      camera.position.set(0, 0.32, 2.8);
      controls.target.set(0, 0.26, 0.02);
    } else if (view === 'cockpit') {
      camera.fov = 24;
      camera.position.set(0.38, 0.58, 0.85);
      controls.target.set(0, 0.32, 0.36);
    } else {
      camera.position.set(1.95, 0.88, 2.25);
      controls.target.set(0, 0.25, 0.02);
    }
  } else if (currentMode === 'chair') {
    camera.fov = 25;
    if (view === 'front') {
      camera.position.set(0, 0.42, 2.5);
      controls.target.set(0, 0.42, 0);
    } else if (view === 'side') {
      camera.position.set(2.5, 0.42, 0);
      controls.target.set(0, 0.42, 0);
    } else if (view === 'top') {
      camera.position.set(0.001, 2.6, 0);
      controls.target.set(0, 0.35, 0);
    } else {
      camera.position.set(1.42, 0.48, 2.48);
      controls.target.set(0, 0.42, 0);
    }
  } else if (currentMode === 'car') {
    camera.fov = 28;
    if (view === 'front') {
      camera.position.set(0, 0.32, 2.2);
      controls.target.set(0, 0.18, 0);
    } else if (view === 'side') {
      camera.position.set(2.2, 0.32, 0);
      controls.target.set(0, 0.18, 0);
    } else if (view === 'top') {
      camera.position.set(0.001, 2.5, 0);
      controls.target.set(0, 0.15, 0);
    } else {
      camera.position.set(1.35, 0.68, 1.55);
      controls.target.set(0, 0.18, 0);
    }
  } else if (currentMode === 'coin') {
    camera.fov = 26;
    if (view === 'front') {
      camera.position.set(0, 0.26, 1.1);
      controls.target.set(0, 0.26, 0);
    } else if (view === 'top') {
      camera.position.set(0.001, 1.2, 0);
      controls.target.set(0, 0.26, 0);
    } else {
      camera.position.set(0.55, 0.48, 0.92);
      controls.target.set(0, 0.26, 0);
    }
  } else if (currentMode === 'tnt') {
    camera.fov = 26;
    if (view === 'front') {
      camera.position.set(0, 0.24, 1.2);
      controls.target.set(0, 0.24, 0);
    } else if (view === 'top') {
      camera.position.set(0.001, 1.3, 0);
      controls.target.set(0, 0.24, 0);
    } else {
      camera.position.set(0.78, 0.58, 1.05);
      controls.target.set(0, 0.24, 0);
    }
  } else {
    // 'showcase'
    camera.fov = 32;
    if (view === 'top') {
      camera.position.set(0.001, 4.2, 0.05);
      controls.target.set(0, 0.18, 0.05);
    } else {
      camera.position.set(1.95, 1.25, 2.25);
      controls.target.set(0, 0.18, 0.05);
    }
  }

  camera.updateProjectionMatrix();
  controls.update();
}

// 9. Mode Switching Logic
function setViewMode(mode: ViewMode) {
  currentMode = mode;

  // Update active button state
  if (tabButtons) {
    tabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  const isGameAsset = mode === 'showcase' || mode === 'car' || mode === 'coin' || mode === 'tnt';
  if (btnOpenRefs) {
    btnOpenRefs.style.display = isGameAsset ? 'none' : 'flex';
  }

  // Reset interactive states
  isTntHovered = false;
  if (tntWorldTooltip) tntWorldTooltip.classList.add('hidden');
  tntTrap.reset();

  // Hide all models first
  chair.root.visible = false;
  raceCar.root.visible = false;
  coinMain.root.visible = false;
  coinExtra1.root.visible = false;
  coinExtra2.root.visible = false;
  tntTrap.root.visible = false;
  roadTrack.visible = false;
  jet.root.visible = false;
  sagrada.root.visible = false;
  paris.root.visible = false;
  if (jetViewBar) jetViewBar.style.display = 'flex';

  // Reset transforms
  raceCar.root.position.set(0, 0, 0);
  raceCar.root.rotation.set(0, 0, 0);
  coinMain.root.position.set(0, 0, 0);
  coinMain.root.scale.setScalar(1);
  coinExtra1.root.scale.setScalar(1);
  coinExtra2.root.scale.setScalar(1);
  tntTrap.root.position.set(0, 0, 0);
  tntTrap.root.scale.setScalar(1);

  gridHelper.visible = mode !== 'paris' && mode !== 'sagrada';
  ground.visible = mode !== 'paris' && mode !== 'sagrada';

  // Default lighting & atmosphere reset
  scene.background = defaultBgColor;
  scene.fog = defaultFog;
  sunLight.position.set(2.2, 4.5, 3.2);
  sunLight.color.set(0xfff8ee);
  sunLight.intensity = 2.1;
  fillLight.position.set(-2.5, 2.2, -2.0);
  fillLight.color.set(0xbad2e8);
  fillLight.intensity = 0.85;
  rimLight.position.set(0, 2.4, -3.2);
  rimLight.color.set(0xffffff);
  rimLight.intensity = 0.65;
  ambientLight.color.set(0xffffff);
  ambientLight.intensity = 0.72;
  renderer.toneMappingExposure = 1.1;

  if (mode === 'paris') {
    paris.root.visible = true;

    // Photorealistic Parisian sky atmosphere and warm golden sunlight
    scene.background = parisSkyTexture;
    scene.fog = parisFog;
    sunLight.position.set(3.5, 6.0, 4.2);
    sunLight.color.set('#fff6ea');
    sunLight.intensity = 2.85;
    fillLight.position.set(-3.2, 3.5, -2.5);
    fillLight.color.set('#9cc8f2');
    fillLight.intensity = 1.05;
    rimLight.position.set(0.5, 2.8, -3.8);
    rimLight.color.set('#fde68a');
    rimLight.intensity = 0.75;
    ambientLight.color.set('#ffffff');
    ambientLight.intensity = 0.58;
    renderer.toneMappingExposure = 1.15;

    // Update view button labels for Paris
    const parisViews = [
      { label: 'Photo View', view: 'photo' },
      { label: 'Trocadéro View', view: 'trocadero' },
      { label: 'Trocadéro POV (Checkered Floor)', view: 'trocadero_pov' },
      { label: 'Under Tower (Bridge)', view: 'under' },
      { label: 'Aerial Panorama', view: 'aerial' },
      { label: 'Champ de Mars', view: 'champ' },
      { label: 'Eiffel Tower', view: 'tower' },
      { label: 'Spire & Summit', view: 'spire' },
      { label: 'River & Boat', view: 'boat' },
      { label: 'Top View', view: 'top' },
    ];
    if (viewButtons) {
      const vBtns = Array.from(viewButtons);
      vBtns.forEach((b, i) => {
        if (i < parisViews.length) {
          b.style.display = 'inline-block';
          b.textContent = parisViews[i].label;
          b.dataset.view = parisViews[i].view;
        } else {
          b.style.display = 'none';
        }
      });
    }

    setCameraView('tower');
  } else if (mode === 'sagrada') {
    sagrada.root.visible = true;

    const sagradaViews = [
      { label: 'Perspective View', view: 'sketch' },
      { label: 'Front Portal', view: 'front' },
      { label: 'Side Elevation', view: 'side' },
      { label: 'Top View', view: 'top' },
      { label: 'Towers & Cross', view: 'spires' },
    ];
    if (viewButtons) {
      const vBtns = Array.from(viewButtons);
      vBtns.forEach((b, i) => {
        if (i < sagradaViews.length) {
          b.style.display = 'inline-block';
          b.textContent = sagradaViews[i].label;
          b.dataset.view = sagradaViews[i].view;
        } else {
          b.style.display = 'none';
        }
      });
    }

    setCameraView('sketch');
  } else if (mode === 'jet') {
    jet.root.visible = true;

    const jetViews = [
      { label: 'Perspective', view: 'persp' },
      { label: 'Front View', view: 'front' },
      { label: 'Side View', view: 'side' },
      { label: 'Top View', view: 'top' },
      { label: 'Cockpit View', view: 'cockpit' },
    ];
    if (viewButtons) {
      const vBtns = Array.from(viewButtons);
      vBtns.forEach((b, i) => {
        if (i < jetViews.length) {
          b.style.display = 'inline-block';
          b.textContent = jetViews[i].label;
          b.dataset.view = jetViews[i].view;
        } else {
          b.style.display = 'none';
        }
      });
    }

    setCameraView('persp');
  } else if (mode === 'chair') {
    chair.root.visible = true;

    const chairViews = [
      { label: 'Perspective', view: 'persp' },
      { label: 'Front View', view: 'front' },
      { label: 'Side View', view: 'side' },
      { label: 'Top View', view: 'top' },
    ];
    if (viewButtons) {
      const vBtns = Array.from(viewButtons);
      vBtns.forEach((b, i) => {
        if (i < chairViews.length) {
          b.style.display = 'inline-block';
          b.textContent = chairViews[i].label;
          b.dataset.view = chairViews[i].view;
        } else {
          b.style.display = 'none';
        }
      });
    }

    setCameraView('persp');
  } else if (mode === 'car') {
    raceCar.root.visible = true;

    const carViews = [
      { label: 'Perspective', view: 'persp' },
      { label: 'Front View', view: 'front' },
      { label: 'Side View', view: 'side' },
      { label: 'Top View', view: 'top' },
    ];
    if (viewButtons) {
      const vBtns = Array.from(viewButtons);
      vBtns.forEach((b, i) => {
        if (i < carViews.length) {
          b.style.display = 'inline-block';
          b.textContent = carViews[i].label;
          b.dataset.view = carViews[i].view;
        } else {
          b.style.display = 'none';
        }
      });
    }

    setCameraView('persp');
  } else if (mode === 'coin') {
    coinMain.root.visible = true;

    const coinViews = [
      { label: 'Perspective', view: 'persp' },
      { label: 'Front View', view: 'front' },
      { label: 'Top View', view: 'top' },
    ];
    if (viewButtons) {
      const vBtns = Array.from(viewButtons);
      vBtns.forEach((b, i) => {
        if (i < coinViews.length) {
          b.style.display = 'inline-block';
          b.textContent = coinViews[i].label;
          b.dataset.view = coinViews[i].view;
        } else {
          b.style.display = 'none';
        }
      });
    }

    setCameraView('persp');
  } else if (mode === 'tnt') {
    tntTrap.root.visible = true;

    const tntViews = [
      { label: 'Perspective', view: 'persp' },
      { label: 'Front View', view: 'front' },
      { label: 'Top View', view: 'top' },
    ];
    if (viewButtons) {
      const vBtns = Array.from(viewButtons);
      vBtns.forEach((b, i) => {
        if (i < tntViews.length) {
          b.style.display = 'inline-block';
          b.textContent = tntViews[i].label;
          b.dataset.view = tntViews[i].view;
        } else {
          b.style.display = 'none';
        }
      });
    }

    setCameraView('persp');
  } else if (mode === 'showcase') {
    roadTrack.visible = true;
    raceCar.root.visible = true;
    coinMain.root.visible = true;
    coinExtra1.root.visible = true;
    coinExtra2.root.visible = true;
    tntTrap.root.visible = true;

    // Arrange on the road track with clear view of all 3 assets
    raceCar.root.position.set(-0.32, 0.016, -0.52);
    coinMain.root.position.set(-0.32, 0.016, 0.42);
    coinMain.root.scale.setScalar(0.68);
    coinExtra1.root.position.set(-0.32, 0.016, 0.95);
    coinExtra1.root.scale.setScalar(0.68);
    coinExtra2.root.position.set(0.34, 0.016, -0.45);
    coinExtra2.root.scale.setScalar(0.68);
    tntTrap.root.position.set(0.34, 0.016, 0.38);
    tntTrap.root.scale.setScalar(0.75);

    const showcaseViews = [
      { label: 'Perspective', view: 'persp' },
      { label: 'Top View', view: 'top' },
    ];
    if (viewButtons) {
      const vBtns = Array.from(viewButtons);
      vBtns.forEach((b, i) => {
        if (i < showcaseViews.length) {
          b.style.display = 'inline-block';
          b.textContent = showcaseViews[i].label;
          b.dataset.view = showcaseViews[i].view;
        } else {
          b.style.display = 'none';
        }
      });
    }

    setCameraView('persp');
  }
}

// 10. Reference Photos Modal Manager
let currentGalleryModel = 'paris';
let currentGalleryItemIndex = 0;

function mapModeToRefModel(mode: string): string {
  if (mode === 'paris') return 'paris';
  if (mode === 'sagrada') return 'sagrada';
  if (mode === 'jet') return 'jet';
  if (mode === 'chair') return 'chair';
  return 'paris';
}

function openReferenceModal(targetModel?: string) {
  const modal = document.getElementById('ref-modal');
  if (!modal) return;

  const modelKey = targetModel || mapModeToRefModel(currentMode);
  renderReferenceGallery(modelKey, 0);

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeReferenceModal() {
  const modal = document.getElementById('ref-modal');
  if (!modal) return;

  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function selectReferenceItem(item: ReferenceItem, index: number) {
  currentGalleryItemIndex = index;

  const imgEl = document.getElementById('ref-preview-img') as HTMLImageElement | null;
  const titleEl = document.getElementById('ref-preview-title');
  const openFullEl = document.getElementById('ref-preview-open-full') as HTMLAnchorElement | null;

  if (imgEl) {
    imgEl.style.opacity = '0.3';
    imgEl.src = item.imageSrc;
    imgEl.onload = () => {
      imgEl.style.opacity = '1';
    };
  }

  // Simply display 1, 2, 3...
  if (titleEl) titleEl.textContent = `${index + 1}`;
  if (openFullEl) openFullEl.href = item.imageSrc;

  // Update card active class in sidebar
  const sidebar = document.getElementById('ref-sidebar');
  if (sidebar) {
    const cards = sidebar.querySelectorAll('.ref-card');
    cards.forEach((card, idx) => {
      card.classList.toggle('active', idx === index);
    });
  }
}

function renderReferenceGallery(modelKey: string, selectIndex = 0) {
  currentGalleryModel = modelKey;
  const data = REFERENCES_DATA[modelKey] || REFERENCES_DATA.paris;

  // Update Header Info
  const titleEl = document.getElementById('ref-modal-title');
  if (titleEl) titleEl.textContent = `Reference Photos: ${data.modelName}`;

  // Update Modal Model Nav Buttons
  const navBtns = document.querySelectorAll<HTMLButtonElement>('.ref-nav-btn');
  navBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.model === modelKey);
  });

  // Render Sidebar Cards (numbered 1, 2, 3...)
  const sidebar = document.getElementById('ref-sidebar');
  if (sidebar) {
    sidebar.innerHTML = '';
    data.items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `ref-card ${idx === selectIndex ? 'active' : ''}`;
      card.innerHTML = `
        <div class="ref-card-thumb-wrap">
          <img src="${item.imageSrc}" alt="${idx + 1}" loading="lazy" />
        </div>
        <div class="ref-card-info">
          <div class="ref-card-title">${idx + 1}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        selectReferenceItem(item, idx);
      });
      sidebar.appendChild(card);
    });
  }

  // Select initial item
  if (data.items.length > 0) {
    const safeIdx = Math.max(0, Math.min(selectIndex, data.items.length - 1));
    selectReferenceItem(data.items[safeIdx], safeIdx);
  }
}

function initDOM() {
  const container = document.getElementById('app') || document.body;
  if (!container.contains(renderer.domElement)) {
    container.appendChild(renderer.domElement);
  }

  tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
  jetViewBar = document.getElementById('jet-view-bar');
  viewButtons = document.querySelectorAll<HTMLButtonElement>('.view-btn');

  viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view || 'persp';
      setCameraView(v);
    });
  });

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = (btn.dataset.mode as ViewMode) || 'jet';
      setViewMode(mode);
    });
  });

  // Reference Photos Modal Setup
  btnOpenRefs = document.getElementById('btn-open-refs');
  const modalClose = document.getElementById('ref-modal-close');
  const modalBackdrop = document.getElementById('ref-modal-backdrop');

  if (btnOpenRefs) {
    btnOpenRefs.addEventListener('click', () => {
      openReferenceModal();
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      closeReferenceModal();
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', () => {
      closeReferenceModal();
    });
  }

  // Modal Model Nav Bar Buttons
  const navBtns = document.querySelectorAll<HTMLButtonElement>('.ref-nav-btn');
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const model = btn.dataset.model || 'paris';
      renderReferenceGallery(model, 0);

      // Also switch 3D scene in the background
      const viewMode = (model as ViewMode) || 'paris';
      setViewMode(viewMode);
    });
  });

  // Keyboard navigation for modal
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('ref-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
      closeReferenceModal();
      return;
    }

    const data = REFERENCES_DATA[currentGalleryModel];
    if (!data || data.items.length <= 1) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (currentGalleryItemIndex + 1) % data.items.length;
      selectReferenceItem(data.items[nextIdx], nextIdx);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (currentGalleryItemIndex - 1 + data.items.length) % data.items.length;
      selectReferenceItem(data.items[prevIdx], prevIdx);
    }
  });

  tntWorldTooltip = document.getElementById('tnt-world-tooltip');

  // 3D Raycasting & Click Interactions (TNT Explosion, etc.)
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let pointerDownPos = { x: 0, y: 0 };
  let pointerDownTime = 0;

  window.addEventListener('pointerdown', (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
    pointerDownTime = performance.now();
  });

  window.addEventListener('pointerup', (e) => {
    const modal = document.getElementById('ref-modal');
    if (modal && !modal.classList.contains('hidden')) return;

    const uiOverlay = document.getElementById('ui-overlay');
    if (uiOverlay && uiOverlay.contains(e.target as Node)) return;

    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    const dist = Math.hypot(dx, dy);
    const dt = performance.now() - pointerDownTime;

    // Must be a clean click, not an orbit pan/drag
    if (dist > 8 || dt > 600) return;

    if (tntTrap.root.visible && !tntTrap.isExploding()) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObject(tntTrap.root, true);
      if (hits.length > 0) {
        isTntHovered = false;
        if (tntWorldTooltip) tntWorldTooltip.classList.add('hidden');
        renderer.domElement.style.cursor = 'default';
        tntTrap.triggerExplosion();
      }
    }
  });

  window.addEventListener('pointermove', (e) => {
    const modal = document.getElementById('ref-modal');
    if (modal && !modal.classList.contains('hidden')) {
      isTntHovered = false;
      if (tntWorldTooltip) tntWorldTooltip.classList.add('hidden');
      renderer.domElement.style.cursor = 'default';
      return;
    }

    const uiOverlay = document.getElementById('ui-overlay');
    if (uiOverlay && uiOverlay.contains(e.target as Node)) {
      isTntHovered = false;
      if (tntWorldTooltip) tntWorldTooltip.classList.add('hidden');
      renderer.domElement.style.cursor = 'default';
      return;
    }

    if (tntTrap.root.visible && !tntTrap.isExploding()) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObject(tntTrap.root, true);
      if (hits.length > 0) {
        isTntHovered = true;
        renderer.domElement.style.cursor = 'pointer';
        return;
      }
    }
    isTntHovered = false;
    if (tntWorldTooltip) tntWorldTooltip.classList.add('hidden');
    renderer.domElement.style.cursor = 'default';
  });

  window.addEventListener('pointerleave', () => {
    isTntHovered = false;
    if (tntWorldTooltip) tntWorldTooltip.classList.add('hidden');
    renderer.domElement.style.cursor = 'default';
  });

  document.addEventListener('mouseleave', () => {
    isTntHovered = false;
    if (tntWorldTooltip) tntWorldTooltip.classList.add('hidden');
    renderer.domElement.style.cursor = 'default';
  });

  // Expose for testing & debug
  (window as any).camera = camera;
  (window as any).tntTrap = tntTrap;
  (window as any).triggerTntExplosion = () => tntTrap.triggerExplosion();

  // Check URL query parameter (?model=paris|sagrada|jet|showcase|car|coin|tnt|chair)
  const params = new URLSearchParams(window.location.search);

  const toggleBtn = document.getElementById('toggle-ui');
  const overlay = document.getElementById('ui-overlay');
  if (toggleBtn && overlay) {
    toggleBtn.addEventListener('click', () => {
      overlay.classList.toggle('collapsed');
      toggleBtn.textContent = overlay.classList.contains('collapsed') ? '⚙' : '_';
    });
    if (params.get('ui') === 'hide') {
      overlay.classList.add('collapsed');
      toggleBtn.textContent = '⚙';
    }
  }

  const initialMode = (params.get('model') as ViewMode) || 'paris';
  setViewMode(initialMode);
  const initialView = params.get('view');
  if (initialView) {
    setCameraView(initialView);
  }

  // Check if URL requests directly opening references (?refs=open or ?refs=paris)
  const refsParam = params.get('refs');
  if (refsParam) {
    const targetModel = refsParam === 'open' ? initialMode : refsParam;
    openReferenceModal(targetModel);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDOM);
} else {
  initDOM();
}

// 11. Animation & Render Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // Clamp delta to prevent huge jumps when tab is throttled or during debugger pauses
  const rawDelta = clock.getDelta();
  const delta = Math.min(rawDelta, 0.05);
  const elapsed = clock.getElapsedTime();

  controls.update();

  if (paris.root.visible) paris.tick(delta, elapsed);
  if (sagrada.root.visible) sagrada.tick(delta, elapsed);
  if (jet.root.visible) jet.tick(delta, elapsed);
  if (chair.root.visible) chair.tick(delta, elapsed);
  if (raceCar.root.visible) raceCar.tick(delta, elapsed);
  if (coinMain.root.visible) coinMain.tick(delta, elapsed);
  if (coinExtra1.root.visible) coinExtra1.tick(delta, elapsed + 0.8);
  if (coinExtra2.root.visible) coinExtra2.tick(delta, elapsed + 1.6);
  if (tntTrap.root.visible) tntTrap.tick(delta, elapsed);

  // 3D World Anchored Hover Tooltip Projection
  if (tntWorldTooltip) {
    if (isTntHovered && tntTrap.root.visible && !tntTrap.isExploding()) {
      // Anchored right above the dynamite bundle apex (~0.46 Y)
      tntAnchorVec.set(0, 0.46, 0);
      tntTrap.root.localToWorld(tntAnchorVec);
      tntAnchorVec.project(camera);

      // Verify that object is in front of the camera clip plane
      if (tntAnchorVec.z < 1.0) {
        const screenX = (tntAnchorVec.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(tntAnchorVec.y * 0.5) + 0.5) * window.innerHeight;
        tntWorldTooltip.style.left = `${screenX}px`;
        tntWorldTooltip.style.top = `${screenY}px`;
        tntWorldTooltip.classList.remove('hidden');
      } else {
        tntWorldTooltip.classList.add('hidden');
      }
    } else {
      tntWorldTooltip.classList.add('hidden');
    }
  }

  renderer.render(scene, camera);
}

animate();

// 12. Resize Handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
