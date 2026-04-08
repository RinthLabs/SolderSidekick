<template>
  <div class="modal fade" ref="modalEl" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen">
      <div class="modal-content bg-dark">
        <div class="modal-header py-2 bg-dark text-white border-bottom border-secondary">
          <h6 class="modal-title mb-0">
            <i class="fa-solid fa-play me-2"></i>G-code Simulator
          </h6>
          <span v-if="statusMessage" class="badge bg-info ms-3 text-truncate" style="max-width: 400px">
            {{ statusMessage }}
          </span>
          <label class="btn btn-sm btn-outline-light ms-auto me-2" title="Load 3D model (GLB, GLTF, STL, STEP, or IGES) to replace the PCB">
            <i class="fa-solid fa-cube me-1"></i>
            <span v-if="!modelLoaded">Load 3D Model</span>
            <span v-else>Replace Model</span>
            <input type="file" accept=".glb,.gltf,.stl,.step,.stp,.iges,.igs" class="d-none" @change="onModelFileSelected" />
          </label>
          <button v-if="modelLoaded" class="btn btn-sm btn-outline-danger me-2" @click="removeModel" title="Remove loaded model and restore default PCB">
            <i class="fa-solid fa-xmark me-1"></i>Remove Model
          </button>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-0 d-flex flex-column position-relative">
          <div ref="viewport" class="simulator-viewport flex-grow-1"></div>

          <!-- STEP/IGES loading overlay -->
          <div v-if="stepLoading" class="step-loading-overlay">
            <div class="step-loading-card">
              <i class="fa-solid fa-gear fa-spin me-2"></i>
              <span class="step-loading-title">{{ stepLoadingPhase }}</span>
              <div class="step-progress-track">
                <div class="step-progress-bar"></div>
              </div>
              <span class="step-loading-hint">STEP/IGES files can take 10–60 s depending on complexity</span>
            </div>
          </div>

          <!-- Model adjustment overlay -->
          <div v-if="modelLoaded" class="model-adjust-panel">
            <div class="adj-header">
              <span><i class="fa-solid fa-sliders me-1"></i>Adjust Model</span>
              <button class="adj-reset-btn" @click="resetModelAdjust" title="Reset to auto-aligned position">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            </div>
            <div class="adj-section-label">Rotate</div>
            <div class="adj-row" v-for="a in ['X','Y','Z']" :key="'r'+a">
              <span class="adj-axis">{{ a }}</span>
              <button class="adj-btn" @click="rotateModel(a, -1)">&minus;90&deg;</button>
              <button class="adj-btn" @click="rotateModel(a, 1)">+90&deg;</button>
            </div>
            <div class="adj-section-label mt-2">
              Offset
              <select v-model.number="offsetStep" class="adj-step-select">
                <option :value="0.1">0.1 mm</option>
                <option :value="0.5">0.5 mm</option>
                <option :value="1">1 mm</option>
                <option :value="5">5 mm</option>
              </select>
            </div>
            <div class="adj-row" v-for="a in ['X','Y','Z']" :key="'o'+a">
              <span class="adj-axis">{{ a }}</span>
              <button class="adj-btn" @click="offsetModel(a, -1)">&minus;</button>
              <button class="adj-btn" @click="offsetModel(a, 1)">+</button>
            </div>
            <div class="adj-save-row">
              <button class="adj-btn adj-save-btn" @click="saveModelSettings" title="Save adjustment settings to JSON file">
                <i class="fa-solid fa-download me-1"></i>Save
              </button>
              <label class="adj-btn adj-save-btn" title="Load adjustment settings from JSON file">
                <i class="fa-solid fa-upload me-1"></i>Load
                <input type="file" accept=".json" class="d-none" @change="loadModelSettings" />
              </label>
            </div>
          </div>

          <div class="simulator-controls bg-dark border-top border-secondary px-3 py-2 d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-light" @click="restart" title="Restart">
              <i class="fa-solid fa-backward-fast"></i>
            </button>
            <button class="btn btn-sm btn-outline-light" @click="prevSolderPoint" title="Previous solder point">
              <i class="fa-solid fa-backward-step"></i>
            </button>
            <button class="btn btn-sm" :class="isPlaying ? 'btn-warning' : 'btn-success'" @click="togglePlay" style="width:42px">
              <i :class="isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
            </button>
            <button class="btn btn-sm btn-outline-light" @click="nextSolderPoint" title="Next solder point">
              <i class="fa-solid fa-forward-step"></i>
            </button>
            <div class="timeline-wrapper flex-grow-1 mx-2">
              <input
                type="range" class="form-range"
                min="0" :max="totalTime" step="0.01"
                :value="currentTime"
                @input="seekTo($event.target.valueAsNumber)"
              />
              <div class="timeline-markers">
                <div
                  v-for="(sp, i) in solderPointTimes" :key="i"
                  class="timeline-tick"
                  :style="{ left: (sp / totalTime * 100) + '%' }"
                  :title="'Point ' + (i + 1)"
                  @click="seekTo(sp)"
                ></div>
              </div>
            </div>
            <span v-if="solderPointTimes.length > 0" class="text-warning text-nowrap small" style="min-width: 52px">
              {{ currentPointIndex }}/{{ solderPointTimes.length }}
            </span>
            <span class="text-white text-nowrap small" style="min-width: 100px">
              {{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}
            </span>
            <select class="form-select form-select-sm bg-dark text-white border-secondary"
              style="width: 80px" v-model.number="playbackSpeed">
              <option :value="1">1×</option>
              <option :value="2">2×</option>
              <option :value="5">5×</option>
              <option :value="10">10×</option>
              <option :value="25">25×</option>
              <option :value="50">50×</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { Modal } from 'bootstrap';
import { useDrillStore } from '@/stores/store';

const drillStore = useDrillStore();

const modalEl = ref(null);
const viewport = ref(null);

const isPlaying = ref(false);
const currentTime = ref(0);
const totalTime = ref(1);
const playbackSpeed = ref(10);
const statusMessage = ref('');
const modelLoaded = ref(false);
const offsetStep = ref(1);
const solderPointTimes = ref([]);
const stepLoading = ref(false);
const stepLoadingPhase = ref('');

const currentPointIndex = computed(() => {
  const pts = solderPointTimes.value;
  const t = currentTime.value;
  let idx = 0;
  for (const p of pts) {
    if (p <= t + 0.05) idx++;
    else break;
  }
  return idx;
});

let scene, camera, renderer, controls, animationId, resizeObserver;
let ironGroup, tipMat, tipLight, shadowDisc;
let pcbGroup = null;
let loadedModelGroup = null;
let modelPivot = null;
let modelBasePos = null;
let timeline = [];
let lastTimestamp = null;
let bsModal = null;

// ── G-code Parser ────────────────────────────────────────────

function extractParams(line) {
  const p = {};
  for (const m of line.matchAll(/([A-Z])([-\d.]+)/g)) {
    p[m[1]] = parseFloat(m[2]);
  }
  return p;
}

function parseGcode(text) {
  const cmds = [];
  let x = 0, y = 0, z = 0, feed = 6000;
  let originSet = false;

  for (const raw of text.split('\n')) {
    const semi = raw.indexOf(';');
    const code = (semi >= 0 ? raw.substring(0, semi) : raw).trim();

    const m117 = raw.match(/M117\s+(.*)/);
    if (m117) {
      cmds.push({ type: 'msg', text: m117[1].trim() });
      continue;
    }

    if (!code) continue;
    if (code.startsWith('G28')) continue;

    if (code.startsWith('G92')) {
      const p = extractParams(code);
      if (p.X !== undefined) x = p.X;
      if (p.Y !== undefined) y = p.Y;
      if (p.Z !== undefined) z = p.Z;
      originSet = true;
      cmds.push({ type: 'pos', x, y, z });
      continue;
    }

    if (code.startsWith('G0') || code.startsWith('G1')) {
      const rapid = code[1] === '0';
      const p = extractParams(code);
      if (p.E !== undefined && p.X === undefined && p.Y === undefined && p.Z === undefined) continue;
      const nx = p.X ?? x, ny = p.Y ?? y, nz = p.Z ?? z;
      if (p.F !== undefined) feed = p.F;

      const dist = Math.sqrt((nx - x) ** 2 + (ny - y) ** 2 + (nz - z) ** 2);
      if (dist > 0.001 && originSet) {
        const speed = rapid ? Math.max(feed, 6000) : feed;
        cmds.push({
          type: 'move', fx: x, fy: y, fz: z,
          tx: nx, ty: ny, tz: nz,
          duration: dist / (speed / 60), rapid,
        });
      }
      x = nx; y = ny; z = nz;
      continue;
    }

    if (code.startsWith('G4')) {
      const p = extractParams(code);
      const dur = (p.P ?? 0) / 1000 + (p.S ?? 0);
      if (dur > 0 && originSet) {
        cmds.push({ type: 'dwell', duration: dur, x, y, z });
      }
      continue;
    }
  }
  return cmds;
}

function buildTimeline(cmds) {
  let t = 0;
  for (const c of cmds) {
    c.startTime = t;
    if (c.type === 'move' || c.type === 'dwell') t += c.duration;
  }
  return t;
}

function getStateAtTime(t) {
  let x = 0, y = 0, z = 0, msg = '';
  for (const c of timeline) {
    if (c.type === 'pos') { x = c.x; y = c.y; z = c.z; continue; }
    if (c.type === 'msg') { if (c.startTime <= t) msg = c.text; continue; }
    if (c.startTime > t) break;
    if (c.type === 'move') {
      const elapsed = t - c.startTime;
      if (elapsed >= c.duration) {
        x = c.tx; y = c.ty; z = c.tz;
      } else {
        const p = elapsed / c.duration;
        return {
          x: c.fx + (c.tx - c.fx) * p,
          y: c.fy + (c.ty - c.fy) * p,
          z: c.fz + (c.tz - c.fz) * p,
          msg,
        };
      }
    } else if (c.type === 'dwell') {
      x = c.x; y = c.y; z = c.z;
      if (t < c.startTime + c.duration) return { x, y, z, msg };
    }
  }
  return { x, y, z, msg };
}

// ── Three.js Scene ───────────────────────────────────────────

function initScene(gcode) {
  cleanup();
  timeline = parseGcode(gcode);
  totalTime.value = buildTimeline(timeline) || 1;
  currentTime.value = 0;
  isPlaying.value = false;
  statusMessage.value = '';

  // Extract one timestamp per solder point (skip duplicate dwells at same XY)
  const spTimes = [];
  let lastSpKey = '';
  for (const c of timeline) {
    if (c.type === 'dwell' && c.z < 2) {
      const key = `${c.x.toFixed(2)},${c.y.toFixed(2)}`;
      if (key !== lastSpKey) {
        spTimes.push(c.startTime);
        lastSpKey = key;
      }
    } else if (c.type === 'move') {
      lastSpKey = '';
    }
  }
  solderPointTimes.value = spTimes;

  const container = viewport.value;
  if (!container) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a2a3e);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dir1.position.set(80, 60, 120);
  scene.add(dir1);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
  dir2.position.set(-60, -40, 80);
  scene.add(dir2);

  const w = container.clientWidth || 800;
  const h = container.clientHeight || 600;

  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 2000);
  camera.up.set(0, 0, 1);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  buildPCB();
  buildPathLine();
  buildIronTip();

  const bounds = getPCBBounds();
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const diag = Math.sqrt((bounds.maxX - bounds.minX) ** 2 + (bounds.maxY - bounds.minY) ** 2) || 100;

  camera.position.set(cx - diag * 0.2, cy - diag * 0.7, diag * 0.9);
  controls.target.set(cx, cy, 0);
  controls.update();

  resizeObserver = new ResizeObserver(() => {
    if (!renderer || !container) return;
    const rw = container.clientWidth;
    const rh = container.clientHeight;
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
    renderer.setSize(rw, rh);
  });
  resizeObserver.observe(container);

  lastTimestamp = null;
  animate();
}

function getPCBBounds() {
  const allBed = drillStore.drillData.map(d => drillStore.drillToBedSpace(d));
  if (allBed.length === 0) return { minX: 0, maxX: 50, minY: 0, maxY: 50 };
  const xs = allBed.map(p => p.x);
  const ys = allBed.map(p => p.y);
  const pad = 3;
  return {
    minX: Math.min(...xs) - pad,
    maxX: Math.max(...xs) + pad,
    minY: Math.min(...ys) - pad,
    maxY: Math.max(...ys) + pad,
  };
}

function removePCBGroup() {
  if (pcbGroup) {
    scene.remove(pcbGroup);
    pcbGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m.dispose());
      }
    });
    pcbGroup = null;
  }
}

function removeLoadedModel() {
  if (modelPivot) {
    scene.remove(modelPivot);
    modelPivot.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m.dispose());
      }
    });
    modelPivot = null;
  }
  loadedModelGroup = null;
  modelBasePos = null;
}

function createBuildPlateTexture() {
  const tileSize = 128;
  const mmPerTile = 16;
  const px = tileSize / mmPerTile;
  const c = document.createElement('canvas');
  c.width = tileSize;
  c.height = tileSize;
  const g = c.getContext('2d');

  g.fillStyle = '#c9c9c9';
  g.fillRect(0, 0, tileSize, tileSize);

  // Grid lines at tile edges
  g.strokeStyle = '#aaaaaa';
  g.lineWidth = 1;
  g.strokeRect(0, 0, tileSize, tileSize);

  // Holes at 8mm spacing, offset 4mm from edges (matching 2D brick pattern)
  g.fillStyle = '#b0b0b0';
  for (const cx of [4, 12]) {
    for (const cy of [4, 12]) {
      g.beginPath();
      g.arc(cx * px, cy * px, 2.5 * px, 0, Math.PI * 2);
      g.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildPCB() {
  removePCBGroup();
  pcbGroup = new THREE.Group();

  const b = getPCBBounds();
  const pw = b.maxX - b.minX;
  const ph = b.maxY - b.minY;
  const thick = drillStore.profiles[drillStore.currentProfile]?.pcbThickness ?? 1.6;

  // PCB board (green, matching 2D branding)
  const pcbGeom = new THREE.BoxGeometry(pw, ph, thick);
  const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1b8a3e, roughness: 0.55, metalness: 0.05 });
  const pcb = new THREE.Mesh(pcbGeom, pcbMat);
  pcb.position.set(b.minX + pw / 2, b.minY + ph / 2, -thick / 2);
  pcbGroup.add(pcb);

  // Drill holes as dark circles on surface
  const allBed = drillStore.drillData.map(d => ({ bed: drillStore.drillToBedSpace(d), ...d }));
  if (allBed.length > 0) {
    const holeGeom = new THREE.CircleGeometry(0.4, 12);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const holes = new THREE.InstancedMesh(holeGeom, holeMat, allBed.length);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < allBed.length; i++) {
      dummy.position.set(allBed[i].bed.x, allBed[i].bed.y, 0.02);
      dummy.updateMatrix();
      holes.setMatrixAt(i, dummy.matrix);
    }
    pcbGroup.add(holes);
  }

  // Solder point markers (copper/red rings matching 2D)
  const solderPts = drillStore.path
    .map(id => drillStore.drillData.find(d => d.id === id))
    .filter(d => d && d.solder)
    .map(d => drillStore.drillToBedSpace(d));

  if (solderPts.length > 0) {
    const ringGeom = new THREE.RingGeometry(0.35, 0.9, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xdd3333, side: THREE.DoubleSide });
    const rings = new THREE.InstancedMesh(ringGeom, ringMat, solderPts.length);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < solderPts.length; i++) {
      dummy.position.set(solderPts[i].x, solderPts[i].y, 0.03);
      dummy.updateMatrix();
      rings.setMatrixAt(i, dummy.matrix);
    }
    pcbGroup.add(rings);
  }

  scene.add(pcbGroup);

  // No-go zones (stay on scene, not in pcbGroup)
  for (const z of drillStore.noGoZones) {
    const zw = z.x2 - z.x1;
    const zh = z.y2 - z.y1;
    const zoneGeom = new THREE.BoxGeometry(zw, zh, 0.3);
    const zoneMat = new THREE.MeshStandardMaterial({
      color: 0xff2222, transparent: true, opacity: 0.25, roughness: 0.8,
    });
    const zone = new THREE.Mesh(zoneGeom, zoneMat);
    zone.position.set(z.x1 + zw / 2, z.y1 + zh / 2, 0.15);
    scene.add(zone);
  }

  // Build plate with tiled brick texture (matching 2D grid pattern)
  const bedW = drillStore.currentBedWidth || Math.max(pw, ph) * 2;
  const bedH = drillStore.currentBedHeight || Math.max(pw, ph) * 2;
  const plateGeom = new THREE.PlaneGeometry(bedW, bedH);
  const plateTex = createBuildPlateTexture();
  plateTex.repeat.set(bedW / 16, bedH / 16);
  const plateMat = new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.9, metalness: 0.0 });
  const plate = new THREE.Mesh(plateGeom, plateMat);
  plate.position.set(bedW / 2, bedH / 2, -thick - 0.05);
  scene.add(plate);
}

function buildPathLine() {
  const pts = [];
  for (const c of timeline) {
    if (c.type === 'pos') {
      pts.push(new THREE.Vector3(c.x, c.y, c.z));
    } else if (c.type === 'move') {
      if (pts.length === 0) pts.push(new THREE.Vector3(c.fx, c.fy, c.fz));
      pts.push(new THREE.Vector3(c.tx, c.ty, c.tz));
    }
  }
  if (pts.length < 2) return;

  const geom = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.45 });
  scene.add(new THREE.Line(geom, mat));
}

function buildIronTip() {
  ironGroup = new THREE.Group();

  // Tapered tip (narrow bottom, wider top)
  const tipGeom = new THREE.CylinderGeometry(0.3, 1.5, 6, 16);
  tipGeom.rotateX(-Math.PI / 2);
  tipMat = new THREE.MeshStandardMaterial({ color: 0xcc8844, metalness: 0.8, roughness: 0.2 });
  const tipMesh = new THREE.Mesh(tipGeom, tipMat);
  tipMesh.position.z = 3;

  // Shaft
  const shaftGeom = new THREE.CylinderGeometry(2.5, 2.5, 20, 16);
  shaftGeom.rotateX(-Math.PI / 2);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.5 });
  const shaft = new THREE.Mesh(shaftGeom, shaftMat);
  shaft.position.z = 16;

  // Glow light at tip
  tipLight = new THREE.PointLight(0xff6600, 0, 15);
  tipLight.position.z = 0;

  ironGroup.add(tipMesh, shaft, tipLight);
  ironGroup.rotation.y = (10 * Math.PI) / 180;
  scene.add(ironGroup);

  // Shadow disc on PCB surface
  const shadowGeom = new THREE.CircleGeometry(3, 24);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 });
  shadowDisc = new THREE.Mesh(shadowGeom, shadowMat);
  shadowDisc.position.z = 0.01;
  scene.add(shadowDisc);
}

// ── 3D Model Loading (GLB/GLTF/STL/STEP/IGES) ─────────────

let occtModule = null;

async function loadOcctModule() {
  if (occtModule) return occtModule;
  const occtimportjs = (await import('occt-import-js')).default;
  occtModule = await occtimportjs({
    locateFile: (name) => name.endsWith('.wasm') ? '/occt-import-js.wasm' : name,
  });
  return occtModule;
}

function occtResultToGroup(result) {
  const group = new THREE.Group();
  for (const meshData of result.meshes) {
    const geom = new THREE.BufferGeometry();
    const pos = meshData.attributes.position.array;
    geom.setAttribute('position', new THREE.Float32BufferAttribute(
      pos instanceof Float32Array ? pos : new Float32Array(pos), 3));
    if (meshData.attributes.normal) {
      const nrm = meshData.attributes.normal.array;
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(
        nrm instanceof Float32Array ? nrm : new Float32Array(nrm), 3));
    }
    const idx = meshData.index.array;
    geom.setIndex(new THREE.BufferAttribute(
      idx instanceof Uint32Array ? idx : new Uint32Array(idx), 1));
    if (!meshData.attributes.normal) geom.computeVertexNormals();

    const c = meshData.color ?? [0.6, 0.6, 0.6];
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(c[0], c[1], c[2]),
      roughness: 0.5, metalness: 0.3,
    });
    group.add(new THREE.Mesh(geom, mat));
  }
  return group;
}

function mountLoadedModel(object3D) {
  removePCBGroup();
  removeLoadedModel();
  loadedModelGroup = object3D;

  // PCB models (KiCad GLB/STEP/STL) export with the component side facing up.
  // Flip 180° around X so the solder side faces +Z for through-hole soldering.
  loadedModelGroup.rotation.x = -Math.PI;
  loadedModelGroup.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(loadedModelGroup);
  const center = box.getCenter(new THREE.Vector3());

  modelPivot = new THREE.Group();
  modelPivot.position.copy(center);
  modelBasePos = { x: center.x, y: center.y, z: center.z };

  loadedModelGroup.position.x -= center.x;
  loadedModelGroup.position.y -= center.y;
  loadedModelGroup.position.z -= center.z;

  modelPivot.add(loadedModelGroup);
  scene.add(modelPivot);
  modelLoaded.value = true;
  statusMessage.value = '3D model loaded';
}

const STEP_EXTS = new Set(['step', 'stp']);
const IGES_EXTS = new Set(['iges', 'igs']);

async function onModelFileSelected(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file || !scene) return;

  const ext = file.name.split('.').pop().toLowerCase();
  statusMessage.value = 'Loading model…';

  try {
    const buffer = await file.arrayBuffer();

    if (ext === 'stl') {
      const loader = new STLLoader();
      const geometry = loader.parse(buffer);
      const mat = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.5, metalness: 0.3 });
      const mesh = new THREE.Mesh(geometry, mat);
      const group = new THREE.Group();
      group.add(mesh);
      mountLoadedModel(group);
    } else if (STEP_EXTS.has(ext) || IGES_EXTS.has(ext)) {
      stepLoading.value = true;
      stepLoadingPhase.value = 'Downloading CAD engine (~8 MB first time)…';
      statusMessage.value = '';
      try {
        const occt = await loadOcctModule();
        stepLoadingPhase.value = 'Parsing CAD file — this may take a while…';
        await nextTick();
        const fileData = new Uint8Array(buffer);
        await new Promise(r => setTimeout(r, 50));
        const result = STEP_EXTS.has(ext)
          ? occt.ReadStepFile(fileData, null)
          : occt.ReadIgesFile(fileData, null);
        if (!result.success || result.meshes.length === 0) {
          statusMessage.value = 'Failed to parse – file may be empty or unsupported';
          return;
        }
        const group = occtResultToGroup(result);
        mountLoadedModel(group);
      } finally {
        stepLoading.value = false;
      }
    } else {
      const loader = new GLTFLoader();
      loader.parse(buffer, '', (gltf) => {
        mountLoadedModel(gltf.scene);
      }, (err) => {
        console.error('GLTF parse error:', err);
        statusMessage.value = 'Failed to load model – try re-exporting as binary GLB';
      });
    }
  } catch (err) {
    console.error('Model load error:', err);
    statusMessage.value = 'Failed to load model';
  }
}

function removeModel() {
  removeLoadedModel();
  modelLoaded.value = false;
  if (scene) buildPCB();
}

function rotateModel(axis, dir) {
  if (!modelPivot) return;
  const angle = dir * Math.PI / 2;
  switch (axis) {
    case 'X': modelPivot.rotation.x += angle; break;
    case 'Y': modelPivot.rotation.y += angle; break;
    case 'Z': modelPivot.rotation.z += angle; break;
  }
}

function offsetModel(axis, dir) {
  if (!modelPivot) return;
  const d = dir * offsetStep.value;
  switch (axis) {
    case 'X': modelPivot.position.x += d; break;
    case 'Y': modelPivot.position.y += d; break;
    case 'Z': modelPivot.position.z += d; break;
  }
}

function resetModelAdjust() {
  if (!modelPivot || !modelBasePos) return;
  modelPivot.position.set(modelBasePos.x, modelBasePos.y, modelBasePos.z);
  modelPivot.rotation.set(0, 0, 0);
}

function prevSolderPoint() {
  const pts = solderPointTimes.value;
  const t = currentTime.value;
  let prev = null;
  for (const p of pts) {
    if (p < t - 0.5) prev = p;
    else break;
  }
  if (prev !== null) seekTo(prev);
}

function nextSolderPoint() {
  const pts = solderPointTimes.value;
  const t = currentTime.value;
  const next = pts.find(p => p > t + 0.05);
  if (next !== undefined) seekTo(next);
}

function getModelAdjustments() {
  if (!modelPivot || !modelBasePos) return null;
  return {
    rotation: {
      x: modelPivot.rotation.x,
      y: modelPivot.rotation.y,
      z: modelPivot.rotation.z,
    },
    offset: {
      x: modelPivot.position.x - modelBasePos.x,
      y: modelPivot.position.y - modelBasePos.y,
      z: modelPivot.position.z - modelBasePos.z,
    },
  };
}

function applyModelAdjustments(adj) {
  if (!modelPivot || !modelBasePos || !adj) return;
  if (adj.rotation) {
    modelPivot.rotation.set(adj.rotation.x ?? 0, adj.rotation.y ?? 0, adj.rotation.z ?? 0);
  }
  if (adj.offset) {
    modelPivot.position.set(
      modelBasePos.x + (adj.offset.x ?? 0),
      modelBasePos.y + (adj.offset.y ?? 0),
      modelBasePos.z + (adj.offset.z ?? 0),
    );
  }
}

function saveModelSettings() {
  const adj = getModelAdjustments();
  if (!adj) return;
  const json = JSON.stringify(adj, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'model-alignment.json';
  a.click();
  URL.revokeObjectURL(url);
}

function loadModelSettings(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const adj = JSON.parse(reader.result);
      applyModelAdjustments(adj);
    } catch (e) {
      console.error('Failed to parse model settings:', e);
    }
  };
  reader.readAsText(file);
}

// ── Animation Loop ───────────────────────────────────────────

function animate(timestamp) {
  animationId = requestAnimationFrame(animate);

  if (isPlaying.value && lastTimestamp !== null) {
    const dt = (timestamp - lastTimestamp) / 1000;
    currentTime.value = Math.min(currentTime.value + dt * playbackSpeed.value, totalTime.value);
    if (currentTime.value >= totalTime.value) {
      isPlaying.value = false;
    }
  }
  lastTimestamp = timestamp;

  const state = getStateAtTime(currentTime.value);

  if (ironGroup) {
    ironGroup.position.set(state.x, state.y, state.z);
    const nearPCB = state.z < 2;
    tipMat.emissive.set(nearPCB ? 0xff4400 : 0x000000);
    tipMat.emissiveIntensity = nearPCB ? 0.6 : 0;
    tipLight.intensity = nearPCB ? 1.2 : 0;
  }
  if (shadowDisc) {
    shadowDisc.position.x = state.x;
    shadowDisc.position.y = state.y;
  }
  if (state.msg) statusMessage.value = state.msg;

  controls?.update();
  renderer?.render(scene, camera);
}

// ── Playback Controls ────────────────────────────────────────

function togglePlay() {
  if (currentTime.value >= totalTime.value) {
    currentTime.value = 0;
  }
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) lastTimestamp = null;
}

function restart() {
  currentTime.value = 0;
  isPlaying.value = false;
  lastTimestamp = null;
}

function seekTo(t) {
  currentTime.value = t;
  isPlaying.value = false;
  lastTimestamp = null;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Modal Lifecycle ──────────────────────────────────────────

function show(gcode) {
  if (!modalEl.value) return;

  bsModal = new Modal(modalEl.value);

  modalEl.value.addEventListener('shown.bs.modal', () => {
    initScene(gcode);
    isPlaying.value = true;
    lastTimestamp = null;
  }, { once: true });

  modalEl.value.addEventListener('hidden.bs.modal', () => {
    cleanup();
  }, { once: true });

  bsModal.show();
}

function cleanup() {
  isPlaying.value = false;
  if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
  if (renderer) {
    renderer.dispose();
    renderer.domElement?.remove();
    renderer = null;
  }
  if (scene) {
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m.dispose());
      }
    });
    scene = null;
  }
  controls = null;
  camera = null;
  ironGroup = null;
  tipMat = null;
  tipLight = null;
  shadowDisc = null;
  pcbGroup = null;
  loadedModelGroup = null;
  modelPivot = null;
  modelBasePos = null;
  modelLoaded.value = false;
  solderPointTimes.value = [];
  timeline = [];
}

onBeforeUnmount(cleanup);

defineExpose({ show });
</script>

<style scoped>
.simulator-viewport {
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.simulator-controls .form-range {
  accent-color: #44bb66;
}

.simulator-controls .form-range::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: #444;
}

.simulator-controls .form-range::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-top: -5px;
}

.timeline-wrapper {
  position: relative;
}

.timeline-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.timeline-tick {
  position: absolute;
  top: 2px;
  width: 2px;
  height: 14px;
  background: rgba(255, 160, 0, 0.65);
  border-radius: 1px;
  pointer-events: auto;
  cursor: pointer;
  transform: translateX(-1px);
}
.timeline-tick:hover {
  background: rgba(255, 180, 0, 1);
  width: 3px;
  transform: translateX(-1.5px);
}

/* Model adjustment overlay */
.model-adjust-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(20, 20, 35, 0.88);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  color: #ccc;
  font-size: 12px;
  width: 180px;
  user-select: none;
}

.adj-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #eee;
}

.adj-reset-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #aaa;
  border-radius: 4px;
  padding: 1px 6px;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.4;
}
.adj-reset-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
}

.adj-section-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.adj-step-select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ccc;
  border-radius: 4px;
  font-size: 10px;
  padding: 0 2px;
  height: 20px;
  margin-left: auto;
}

.adj-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 3px;
}

.adj-axis {
  width: 16px;
  font-weight: 700;
  font-size: 11px;
  color: #aaa;
}

.adj-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ccc;
  border-radius: 4px;
  padding: 2px 0;
  font-size: 11px;
  cursor: pointer;
  text-align: center;
  line-height: 1.4;
}
.adj-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
.adj-btn:active {
  background: rgba(255, 255, 255, 0.22);
}

.adj-save-row {
  display: flex;
  gap: 4px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.adj-save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* STEP/IGES loading overlay */
.step-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 20, 0.75);
  backdrop-filter: blur(4px);
}

.step-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: rgba(30, 30, 50, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 28px 36px;
  color: #eee;
  max-width: 340px;
  text-align: center;
}

.step-loading-title {
  font-size: 14px;
  font-weight: 600;
}

.step-progress-track {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.step-progress-bar {
  height: 100%;
  width: 40%;
  border-radius: 3px;
  background: linear-gradient(90deg, #44bb66, #66dd88);
  animation: step-progress-sweep 1.4s ease-in-out infinite;
}

@keyframes step-progress-sweep {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

.step-loading-hint {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}
</style>
