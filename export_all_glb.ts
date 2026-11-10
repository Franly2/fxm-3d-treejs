
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createRaceCarModel } from './src/model/raceCarModel';
import { createCoinModel } from './src/model/coinModel';
import { createTntModel } from './src/model/tntModel';
import fs from 'fs';

// Polyfill FileReader for Node.js
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    onload: any = null;
    onerror: any = null;
    result: any = null;
    readAsArrayBuffer(blob: any) {
      blob.arrayBuffer().then((buf: ArrayBuffer) => {
        this.result = buf;
        if (this.onload) this.onload({ target: this });
      }).catch((err: any) => {
        if (this.onerror) this.onerror(err);
      });
    }
  } as any;
}

const exporter = new GLTFExporter();

function exportModel(name: string, root: THREE.Object3D) {
  return new Promise<void>((resolve, reject) => {
    exporter.parse(
      root,
      (gltf) => {
        const buf = Buffer.from(gltf as ArrayBuffer);
        fs.writeFileSync(name + '.glb', buf);
        console.log('SUCCESS:', name + '.glb exported! Size:', buf.length, 'bytes');
        resolve();
      },
      (err) => {
        console.error('ERROR in ' + name + ':', err);
        reject(err);
      },
      { binary: true }
    );
  });
}

async function run() {
  const car = createRaceCarModel();
  await exportModel('raceCar', car.root);

  const coin = createCoinModel();
  await exportModel('coin', coin.root);

  const tnt = createTntModel();
  await exportModel('tnt', tnt.root);
  
  console.log('ALL MODELS EXPORTED TO GLB!');
}

run();
