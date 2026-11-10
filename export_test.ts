
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createRaceCarModel } from './src/model/raceCarModel';
import fs from 'fs';

const car = createRaceCarModel();
const exporter = new GLTFExporter();
exporter.parse(
  car.root,
  (gltf) => {
    fs.writeFileSync('raceCar.glb', Buffer.from(gltf as ArrayBuffer));
    console.log('SUCCESS: raceCar.glb exported! Size:', fs.statSync('raceCar.glb').size);
  },
  (err) => {
    console.error('ERROR:', err);
  },
  { binary: true }
);
