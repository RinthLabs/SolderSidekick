<template>

    <div class="row toolpath-layout gx-3">

      <div class="col-lg-8 position-relative canvas-wrapper"
        @dragover.prevent
        @drop.prevent="handleCanvasDrop"
      >

<div class="container topbar-overlay d-flex">
  <div class="row">

  <div class="mb-3 d-flex align-items-center pcb-controls">
      <label class="form-label">PCB Offset (mm) <i class="fas fa-arrows-alt-h pcb-icon"></i></label>
      <input type="number" class="form-control d-inline w-auto pcb-input" v-model.number="drillStore.originOffsetX" @input="saveOffsetUndoState(); updateCanvas()">
      <label class="form-label"><i class="fas fa-arrows-alt-v pcb-icon"></i></label>
      <input type="number" class="form-control d-inline w-auto pcb-input" v-model.number="drillStore.originOffsetY"@input="saveOffsetUndoState(); updateCanvas()">

      <label class="form-label pcb-section">Rotate</label>
      <button class="btn btn-outline-secondary" @click="rotateAndSave(-90)">
        <i class="fa-solid fa-rotate-left"></i>
      </button>
      <button class="btn btn-outline-secondary" @click="rotateAndSave(90)">
        <i class="fa-solid fa-rotate-right"></i>
      </button>


      <label class="form-label mw-5 pcb-section">Flip</label>
      <button class="btn btn-outline-secondary" @click="mirrorHorizontal"><i class="fa-solid fa-right-left"></i></button>
      <button class="btn btn-outline-secondary" @click="mirrorVertical"><i class="fa-solid fa-right-left r90"></i></button>

      <label class="form-label mw-5 pcb-section">PCB Thickness (mm) <i class="fas fa-layer-group"></i></label>
      <input
        type="number"
        class="form-control d-inline w-auto pcb-input"
        v-model.number="drillStore.pcbThickness"
        @blur="commitThicknessChange"
        @keyup.enter="commitThicknessChange"
      />



    </div>

    <!-- Toolbar -->
    <div class="toolbar d-flex align-items-center mb-3">
      <button class="btn btn-primary" @click="autoOptimizePath"><i class="fa-solid fa-wand-magic-sparkles"></i> Auto Optimize Path</button>
      <button class="btn btn-secondary" @click="optimizeSelected"><i class="fa-solid fa-border-all"></i> Optimize Selection</button>
      
      <label class="form-label">Solder</label>
      <button class="btn btn-success" @click="setSelectedSolder(true)"><i class="fa-solid fa-check"></i></button>
      <button class="btn btn-secondary" @click="setSelectedSolder(false)"><i class="fa-solid fa-xmark"></i></button>

      

      <button class="btn btn-outline-danger" @click="clearPath"><i class="fa-solid fa-trash"></i> Clear Path</button>
      <button class="btn btn-outline-dark" @click="undo"><i class="fa-solid fa-rotate-left"></i> Undo</button>
      <button class="btn btn-outline-dark" @click="redo"><i class="fa-solid fa-rotate-right"></i> Redo</button>

    </div>
  </div>
</div>
        <canvas
          ref="canvas"
          class="toolpath-canvas"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @wheel.prevent="handleZoom"
          @contextmenu.prevent
        ></canvas>
        <div class="editor-instructions">
          <transition name="fade" mode="out-in">
            <div
              class="editor-label"
              v-html="editorLabels[currentLabelIndex].html"
              :key="currentLabelIndex"
            />
          </transition>

          <button class="btn btn-outline-dark fixed-help-button" @click="$refs.introModal.show()">
            <i class="fas fa-question-circle"></i> Getting Started
          </button>
        </div>


      </div>

      <div class="col-lg-4 position-relative right-panel">
       

      <div class="scrolling-table">
        <table class="table table-sm table-striped">
          <thead class="table-dark">
            <tr>
              <th title="Should the point be soldered?"><i class="fa-solid fa-fire"></i></th>
              <th title="The order in which the point will be soldered">#</th>
              <th title="X position in mm">X</th>
              <th title="Y position in mm">Y</th>
              <th title="Drill tool used, can be useful for feed/dwell time"><i class="fas fa-tools"></i></th>
              <th title="Amount of solder to extrude (mm)">Feed</th>
              <th title="Seconds spent soldering the point">Time</th>
              <th title="Approach distance from the right side (mm)"><i class="fas fa-dot-circle"></i> <i class="fas fa-long-arrow-alt-left"></i></th>
            </tr>
          </thead>
          
          <tbody>
            <tr
              v-for="(hole, index) in sortedDrillData"
              :key="hole.id"
              :class="{ 'table-primary': hole.selected }"
              @click="toggleSelect(hole.id)"
            >
              <td class="checkbox-cell">
                <input type="checkbox" v-model="hole.solder" @change="onSolderToggle(hole)" />
              </td>
              <td><b>{{ hole.pathIndex !== null ? hole.pathIndex + 1 : '-' }}</b></td>
              <td>{{ hole.x.toFixed(1) }}</td>
              <td>{{ hole.y.toFixed(1) }}</td>
              <td>{{ hole.tool }}</td>
              
              <td>
                <input
                  type="number"
                  class="form-control form-control-sm"
                  :value="hole.feed"
                  min="0"
                  step="0.1"
                  style="max-width: 50px;"
                  @click.stop
                  @change="updateField(hole, 'feed', $event.target.valueAsNumber)"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="form-control form-control-sm"
                  :value="hole.dwell"
                  min="0"
                  step="0.1"
                  style="max-width: 50px;"
                  @click.stop
                  @change="updateField(hole, 'dwell', $event.target.valueAsNumber)"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="form-control form-control-sm"
                  :value="hole.solderOffset"
                  min="0"
                  step="0.1"
                  style="max-width: 50px;"
                  @click.stop
                  @change="updateField(hole, 'solderOffset', $event.target.valueAsNumber)"
                />
              </td>


            </tr>
          </tbody>

          
        </table>

        <div v-if="drillStore.drillData.length === 0" class="m-3 p-3 text-center example-drill-file">
          <p class="mb-2"><b>Need an example drill file?</b></p>
          <button class="btn btn-outline-dark" @click="downloadExampleDrillFile">
            <i class="fa fa-download me-1"></i> Download PCB_breadboard.drl
          </button>
          <a href="https://github.com/RinthLabs/SolderSidekick/blob/main/Documentation.md" target="_blank" class="d-block mt-3">
            How to export drill file
          </a>
        </div>
      </div>

       <!-- Save G-code Button -->
  <button class="save-button btn btn-success" @click="saveGcode">
    <i class="fa-solid fa-save me-1"></i> Save G-code
  </button>

</div>
    </div>

<GettingStarted ref="introModal" />
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick  } from "vue";
import GettingStarted from "@/components/GettingStarted.vue";
import { useDrillStore } from "@/stores/drillStore";
import { useFileHandlers } from "@/composables/useFileHandlers";
const { parseDrillFile, parseProjectFile, saveProject } = useFileHandlers();


const drillStore = useDrillStore();
const canvas = ref(null);

let pendingRenderFrame = null;


const editorLabels = ref([
  { html: '<img src="/mouse-right.svg" alt="Right Click Mouse">+ <b>Drag to Pan</b>' },
  { html: '<img src="/mouse-middle.svg" alt="Middle Mouse Scroll"> to <b>Zoom</b>' },
  { html: '<img src="/mouse-left.svg" alt="Left Click Mouse"> to <b>Add Point to Toolpath</b>' },
  { html: '<span class="key-icon">Ctrl</span> +<img src="/mouse-left.svg" alt="Left Click Mouse"> to <b>Remove Points from Path</b>' },
  { html: '<img src="/mouse-left.svg" alt="Left Click Mouse"> <b>Drag to Box Select</b>' },
  { html: '<img src="/mouse-left.svg" alt="Left Click Mouse"> drag <img src="/origin-icon.svg" alt="Origin Icon"> to <b>Position PCB</b>' },
]);

const currentLabelIndex = ref(0);

let ctx, scale = 1, offsetX = 0, offsetY = 0;

const radius = 4;

let isPanning = false;
let startX = 0;
let startY = 0;

let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;

let isDraggingOrigin = false;
let dragOriginStart = null;

const lastCommittedThickness = ref(drillStore.pcbThickness);

const commitThicknessChange = () => {
  const newVal = drillStore.pcbThickness;
  if (newVal !== lastCommittedThickness.value) {
    drillStore.saveTransformUndoState(); // 👈 always uses the correct format
    drillStore.redoStack = [];
    lastCommittedThickness.value = newVal;
    updateCanvas();
  }
};



const saveGcode = () => {
  console.log("G-code saved!");
};

const openFileDialog = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".drl,.txt,.json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === "json") {
      parseProjectFile(file);
    } else {
      parseDrillFile(file);
    }
  };
  input.click();
};


const fitCanvasToBuildPlate = () => {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  const screenWidth = canvasEl.width / (window.devicePixelRatio || 1);
  const screenHeight = canvasEl.height / (window.devicePixelRatio || 1);

  // 10% padding around the build plate
  const padding = 0.1;

  const scaleX = screenWidth / (235 * (1 + padding));
  const scaleY = screenHeight / (235 * (1 + padding));
  scale = Math.min(scaleX, scaleY);

  // Center the build plate in the view
  offsetX = screenWidth / 2 - (235 * scale) / 2;
  offsetY = screenHeight / 2 + (235 * scale) / 2;

  updateCanvas();
};


const resizeCanvas = () => {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvasEl.parentElement.clientWidth;
  const height = window.innerHeight * 1.0;
  // const height = window.innerHeight * 1.0;

  canvasEl.width = width * dpr;
  canvasEl.height = height * dpr;
  canvasEl.style.width = width + "px";
  canvasEl.style.height = height + "px";

  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
  ctx.scale(dpr, dpr);

  offsetX = width / 3;
  offsetY = height * 0.75;

  updateCanvas();
};

watch(
  () => drillStore.canvasShouldUpdate,
  (val) => {
    if (val) {
      updateCanvas();
      drillStore.acknowledgeCanvasUpdate(); // ✅ reset the flag
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCanvas);
  window.removeEventListener("keydown", handleKeyDown);
});

// onBeforeUnmount(() => {
    
//   });

onMounted(async () => {
  const canvasEl = canvas.value;
  ctx = canvasEl.getContext("2d");

  resizeCanvas();          // sets canvas size and devicePixelRatio
  fitCanvasToBuildPlate(); // zooms and centers based on build plate

  // Ensure layout is settled before final fit
  await nextTick();
  resizeCanvas();
  fitCanvasToBuildPlate();

  window.addEventListener("resize", () => {
    resizeCanvas();
    fitCanvasToBuildPlate(); // re-fit on resize too
  });

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          undo();
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 's':
          e.preventDefault();
          saveProject();
          break;
        case 'o':
          e.preventDefault();
          openFileDialog();
          break;
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  

  setInterval(() => {
    currentLabelIndex.value = (currentLabelIndex.value + 1) % editorLabels.value.length;
  }, 6000); // 3 seconds per label

});


const updateField = (hole, field, value) => {
  drillStore.undoStack.push({
    drillData: drillStore.drillData.map(d => ({ ...d }))
  });
  drillStore.redoStack = [];

  // Update all selected rows
  drillStore.drillData.forEach(d => {
    if (d.selected) {
      d[field] = value;
    }
  });

  updateCanvas();
};


const rotateAndSave = (angleDelta) => {
  drillStore.saveTransformUndoState();
  drillStore.rotation = (drillStore.rotation + angleDelta + 360) % 360;
  updateCanvas();
};

const saveOffsetUndoState = () => {
  drillStore.undoStack.push({
    transform: {
      originOffsetX: drillStore.originOffsetX,
      originOffsetY: drillStore.originOffsetY,
      rotation: drillStore.rotation
    }
  });
  drillStore.redoStack = [];
};



const onSolderToggle = (hole) => {
  drillStore.undoStack.push({
    path: [...drillStore.path],
    solderStates: drillStore.drillData.map(d => ({ id: d.id, solder: d.solder }))
  });
  drillStore.redoStack = [];

  if (!hole.solder) {
    drillStore.removeFromPath(hole.id);
  } else {
    drillStore.addToPath(hole.id);
  }
  updateCanvas();
};


const setSelectedSolder = (state) => {
  drillStore.undoStack.push({
    path: [...drillStore.path],
    solderStates: drillStore.drillData.map(d => ({ id: d.id, solder: d.solder }))
  });
  drillStore.redoStack = [];

  drillStore.drillData.forEach(d => {
    if (d.selected) {
      d.solder = state;
      if (!state) {
        drillStore.removeFromPath(d.id);
      }
    }
  });
  updateCanvas();
};

const mirrorHorizontal = () => {
  drillStore.saveTransformUndoState();

  const angle = (drillStore.rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const newDrillData = drillStore.drillData.map(d => {
    const x = d.x;
    const y = d.y;

    // Rotate to canvas space
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;

    // Flip X in canvas space
    const mirroredX = -rotatedX;

    // Rotate back to PCB space
    const newX = mirroredX * cos + rotatedY * sin;
    const newY = -mirroredX * sin + rotatedY * cos;

    return { ...d, x: newX, y: newY };
  });

  drillStore.drillData = newDrillData;
  updateCanvas();
};


const mirrorVertical = () => {
  drillStore.saveTransformUndoState();

  const angle = (drillStore.rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const newDrillData = drillStore.drillData.map(d => {
    const x = d.x;
    const y = d.y;

    // Rotate to canvas space
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;

    // Flip Y in canvas space
    const mirroredY = -rotatedY;

    // Rotate back to PCB space
    const newX = rotatedX * cos + mirroredY * sin;
    const newY = -rotatedX * sin + mirroredY * cos;

    return { ...d, x: newX, y: newY };
  });

  drillStore.drillData = newDrillData;
  updateCanvas();
};





const drawClippedGrid = (ctx, width, height, spacing = 16, color = "#aaaaaa") => {
  ctx.save();

  // === Draw Clipped Grid Lines ===
  ctx.beginPath();
  ctx.rect(0, -height, width, height);
  ctx.clip();

  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5 / scale;

  for (let x = 0; x <= width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, -height);
    ctx.lineTo(x, 0);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, -y);
    ctx.lineTo(width, -y);
    ctx.stroke();
  }

  // Optional: Dotted circle grid
  const circleSpacing = 8;
  const circleRadius = 2.5;
  const offsetX = 4;
  const offsetY = 4;
  ctx.fillStyle = "#d0d0d0";

  for (let x = offsetX; x <= width; x += circleSpacing) {
    for (let y = offsetY; y <= height; y += circleSpacing) {
      ctx.beginPath();
      ctx.arc(x, -y, circleRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  ctx.restore(); // ✨ Exit clipping before drawing labels

  // === Axis Labels ===
  ctx.save();
  ctx.font = `${10 / scale}px sans-serif`;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // X-axis labels (skip 0)
  for (let x = 0; x <= width; x += spacing) {
    if (x !== 0) {
      ctx.fillText(`${x}`, x, 6 / scale);
    }
  }

  // Y-axis labels (skip 0)
  ctx.textAlign = "right";
  for (let y = 0; y <= height; y += spacing) {
    if (y !== 0) {
      ctx.fillText(`${y}`, -6 / scale, -y);
    }
  }
  ctx.restore();
};


const updateCanvas = () => {
  if (!ctx) return;
  if (pendingRenderFrame) return; // Skip if already scheduled


  pendingRenderFrame = requestAnimationFrame(() => {
    pendingRenderFrame = null;

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Draw build plate (235mm x 235mm)
  ctx.fillStyle = "#c9c9c9";
  ctx.fillRect(0, -235, 235, 235);

  // Draw 16mm grid lines clipped to print bed
  drawClippedGrid(ctx, 235, 235, 16);

  // 💡 Apply offset only to drill data
  ctx.translate(drillStore.originOffsetX, -drillStore.originOffsetY);
  ctx.rotate((drillStore.rotation * Math.PI) / 180);

  // Draw + at drill file origin (0,0) after offset and rotation
  ctx.strokeStyle = "magenta";
  ctx.lineWidth = 2 / scale;
  const originLength = 8;
  ctx.beginPath();
  ctx.moveTo(-originLength / scale, 0);
  ctx.lineTo(originLength / scale, 0);
  ctx.moveTo(0, -originLength / scale);
  ctx.lineTo(0, originLength / scale);
  ctx.stroke();

  drawPathLines();
  drawDrillHoles();
  ctx.restore();
  drawPathLabels();

  // === Draw fixed-size origin arrows and cross in screen space ===
  ctx.save();

  const originX = offsetX;
  const originY = offsetY;

  // Draw blue origin cross
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(originX - 16, originY);
  ctx.lineTo(originX + 16, originY);
  ctx.moveTo(originX, originY - 16);
  ctx.lineTo(originX, originY + 16);
  ctx.stroke();

  // Draw fixed-size arrows (e.g., 40px length)
  drawFixedArrow(ctx, originX, originY, 60, 0, "red");    // X-axis
  drawFixedArrow(ctx, originX, originY, 0, -60, "green"); // Y-axis

  ctx.restore();

  drawSelectionBox();
});

};


// Draw all path lines (after transform applied)
const drawPathLines = () => {
  const path = drillStore.path;
  if (!Array.isArray(path) || path.length < 2) return;

  ctx.beginPath();
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 8 / scale;

  for (let i = 0; i < path.length; i++) {
    const pt = drillStore.drillDataMap?.[path[i]] || drillStore.drillData.find(d => d.id === path[i]);
    if (!pt) continue;
    const x = pt.x, y = -pt.y;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
};

// Draw all holes (after transform applied)
const drawDrillHoles = () => {
  const r = radius / scale;
  for (const d of drillStore.drillData) {
    const x = d.x, y = -d.y;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = d.solder ? "red" : "gray";
    ctx.strokeStyle = d.selected ? "cyan" : "black";
    ctx.lineWidth = 2 / scale;
    ctx.fill();
    ctx.stroke();
  }
};

// Draw drill path labels in screen space (if zoomed in)
const drawPathLabels = () => {
  if (scale < 3) return; // ⛔ Hide labels when zoomed out

  ctx.save();
  ctx.font = `${12}px sans-serif`;
  ctx.fillStyle = "black";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";

  const rad = -(drillStore.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  for (const d of drillStore.drillData) {
    if (d.pathIndex == null) continue;
    const rx = d.x * cos - d.y * sin + drillStore.originOffsetX;
    const ry = d.x * sin + d.y * cos + drillStore.originOffsetY;
    const sx = offsetX + rx * scale + 6;
    const sy = offsetY - ry * scale - 6;
    ctx.fillText((d.pathIndex + 1).toString(), sx, sy);
  }

  ctx.restore();
};

// Draw the selection rectangle (screen space)
const drawSelectionBox = () => {
  if (!(isSelecting && selectionStart && selectionEnd)) return;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  const x = selectionStart.x;
  const y = -selectionStart.y;
  const w = selectionEnd.x - selectionStart.x;
  const h = -(selectionEnd.y - selectionStart.y);

  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 1 / scale;
  ctx.strokeRect(x, y, w, h);

  ctx.restore();
};


const drawFixedArrow = (ctx, x, y, dx, dy, color) => {
  const headLength = 16; // tip size
  const angle = Math.atan2(dy, dx);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 6;

  const endX = x + dx;
  const endY = y + dy;

  // Move shaft endpoint *back* a bit so it doesn't draw under the arrowhead
  const shaftEndX = endX - Math.cos(angle) * headLength * 0.9;
  const shaftEndY = endY - Math.sin(angle) * headLength * 0.9;

  // Draw shaft
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
};





const sortedDrillData = computed(() => {
  return [...drillStore.drillData].sort((a, b) => {
    if (a.pathIndex === null) return 1;
    if (b.pathIndex === null) return -1;
    return a.pathIndex - b.pathIndex;
  });
});

const handleMouseDown = (e) => {

  const mouse = getMousePosition(e, false); // don't apply offset

  const dx = mouse.x - drillStore.originOffsetX;
  const dy = mouse.y - drillStore.originOffsetY;
  const distanceToOrigin = Math.hypot(dx, dy);

  if (e.button === 0 && distanceToOrigin < 2) {
    // Begin dragging origin if close to it
    drillStore.saveTransformUndoState();
    isDraggingOrigin = true;
    dragOriginStart = { x: e.clientX, y: e.clientY, offsetX: drillStore.originOffsetX, offsetY: drillStore.originOffsetY };
    return;
  }

  if (e.button === 2) { // Right-click
    isPanning = true;
    startX = e.clientX;
    startY = e.clientY;
    return;
  }

  const pt = getMousePosition(e);
  const rad = -(drillStore.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const clicked = drillStore.drillData.find(d => {
    const dx = d.x;
    const dy = d.y;

    const rotatedX = dx * cos - dy * sin + drillStore.originOffsetX;
    const rotatedY = dx * sin + dy * cos + drillStore.originOffsetY;

    return Math.hypot(rotatedX - mouse.x, rotatedY - mouse.y) < 1;
  });

  if (clicked) {
  if (e.ctrlKey) {
    drillStore.removeFromPath(clicked.id);
    clicked.solder = false; // uncheck solder box
  } else {
    drillStore.addToPath(clicked.id);
    clicked.solder = true; // check solder box
  }
  clicked.selected = true;
} else {
  // Clicked empty space: deselect all
  drillStore.drillData.forEach(d => d.selected = false);
}

if (!clicked && e.button === 0) {
  isSelecting = true;
  const pt = getMousePosition(e, false); // ⬅️ don't apply offset for selection box
  selectionStart = pt;
  selectionEnd = pt;
}


updateCanvas();

};

const handleMouseMove = (e) => {
  if (isDraggingOrigin && dragOriginStart) {
    const dx = (e.clientX - dragOriginStart.x) / scale;
    const dy = (e.clientY - dragOriginStart.y) / scale;

    // Snap to nearest 8mm
    const newOffsetX = Math.round((dragOriginStart.offsetX + dx) / 8) * 8;
    const newOffsetY = Math.round((dragOriginStart.offsetY - dy) / 8) * 8;

    drillStore.originOffsetX = newOffsetX;
    drillStore.originOffsetY = newOffsetY;
    updateCanvas();
    return;
  }
  if (isPanning) {
    offsetX += e.clientX - startX;
    offsetY += e.clientY - startY;
    startX = e.clientX;
    startY = e.clientY;
    updateCanvas();
  }
  if (isSelecting) {
    selectionEnd = getMousePosition(e, false); // ⬅️ match startInteraction logic
    updateCanvas();
  }


};

const handleMouseUp = () => {

  if (isDraggingOrigin) {
    isDraggingOrigin = false;
    dragOriginStart = null;
    return;
  }

  isPanning = false;
  if (isSelecting && selectionStart && selectionEnd) {
  const [x1, x2] = [selectionStart.x, selectionEnd.x].sort((a, b) => a - b);
  const [y1, y2] = [selectionStart.y, selectionEnd.y].sort((a, b) => a - b);

  const rad = -(drillStore.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  drillStore.drillData.forEach(d => {
    // Apply offset and then rotate
    const dx = d.x;
    const dy = d.y;
    const rotatedX = dx * cos - dy * sin + drillStore.originOffsetX;
    const rotatedY = dx * sin + dy * cos + drillStore.originOffsetY;

    d.selected = rotatedX >= x1 && rotatedX <= x2 && rotatedY >= y1 && rotatedY <= y2;
  });

}
isSelecting = false;
selectionStart = selectionEnd = null;
updateCanvas();

};

const handleZoom = (e) => {
  const delta = e.deltaY * -0.005;
  scale = Math.max(0.5, Math.min(30, scale + delta));
  updateCanvas();
};


const getMousePosition = (e, applyOffset = true) => {
  const rect = canvas.value.getBoundingClientRect();
  let x = (e.clientX - rect.left - offsetX) / scale;
  let y = -(e.clientY - rect.top - offsetY) / scale;

  if (applyOffset) {
    x -= drillStore.originOffsetX;
    y -= drillStore.originOffsetY;

    const rad = -(drillStore.rotation * Math.PI) / 180;
    const rotatedX = x * Math.cos(rad) - y * Math.sin(rad);
    const rotatedY = x * Math.sin(rad) + y * Math.cos(rad);
    x = rotatedX;
    y = rotatedY;
  }

  return { x, y };
};



const toggleSelect = (id) => {
  drillStore.toggleSelection(id);
  updateCanvas();
};

const autoOptimizePath = () => {
  drillStore.autoOptimizePath();
  updateCanvas();
};

const optimizeSelected = () => {
  drillStore.optimizeSelection();
  updateCanvas();
};


const clearPath = () => {
  drillStore.clearPath();
  updateCanvas();
};

const undo = () => {
  drillStore.undoLast();
  updateCanvas();
};

const redo = () => {
  drillStore.redoLast();
  updateCanvas();
};


const clearFile = () => {
  drillStore.clearDrillFile();
  drillStore.triggerCanvasUpdate();
};

const handleCanvasDrop = (event) => {
  const file = Array.from(event.dataTransfer.files).find(f =>
    f.name.endsWith(".drl") || f.name.endsWith(".txt") || f.name.endsWith(".json")
  );
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === "json") {
    parseProjectFile(file);
  } else {
    parseDrillFile(file);
  }
};

function downloadExampleDrillFile() {
  const url = "https://raw.githubusercontent.com/RinthLabs/SolderSidekick/refs/heads/main/example/PCB_breadboard-PTH.drl";
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "PCB_breadboard-PTH.drl";
      a.click();
      URL.revokeObjectURL(a.href);
    });
}


</script>

<style scoped>
.toolpath-canvas {
  border: 1px solid #eeeeee;
  width: 100%;
  aspect-ratio: 1.5;
}


.table-primary {
  background-color: rgba(0, 255, 242, 0.2) !important;
  --bs-table-striped-bg: rgba(0, 255, 242, 0.2) !important;
  --bs-table-bg: #008bab47 !important
}

.toolpath-canvas {
  border: 1px solid #ccc;
  background-color: #e8e8e8; /* light gray */
  width: 100%;
  aspect-ratio: 1.5;
}

.r90{
  -webkit-transform: rotate(90deg); /* Safari and Chrome */
    -moz-transform: rotate(90deg);   /* Firefox */
    -ms-transform: rotate(90deg);   /* IE 9 */
    -o-transform: rotate(90deg);   /* Opera */
    transform: rotate(90deg);
    display: inline-block; /* 👈 Needed to allow transform to work */
}

.r180{
  -webkit-transform: rotate(180deg); /* Safari and Chrome */
    -moz-transform: rotate(180deg);   /* Firefox */
    -ms-transform: rotate(180deg);   /* IE 9 */
    -o-transform: rotate(180deg);   /* Opera */
    transform: rotate(180deg);
    display: inline-block; /* 👈 Needed to allow transform to work */
}

.pcb-input {
  width: 5rem !important;
}

.pcb-controls{
  gap:0.5rem;
  margin-top: 0.5rem;
}

.pcb-controls .form-label {
  margin: 0;
  line-height: 1;
  display: flex;
  align-items: center;
}

.pcb-controls .pcb-icon {
  margin: 0 !important;
  margin-top: 4px !important;
  margin-left: 4px !important;
}

.pcb-section{
  margin-left: 0.75rem !important;
}

/* .canvas-wrapper {
  position: relative;
} */


.editor-instructions {
  position: absolute;
  bottom: 0.75rem;
  left: 1rem;
  /* padding-left: 0.5rem; */
  font-size: 0.85rem;
  line-height: 1.3;
  pointer-events: none; /* 👈 This makes it ignore all mouse interaction */
}

.editor-instructions button {
  margin-top: 1rem;
  pointer-events: auto; /* 👈 This makes the button clickable */
}


.editor-label {
  margin-bottom: 3.25rem;
}


.toolbar{
  gap:0.5rem !important;
}

.toolbar .form-label {
  margin: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  margin-left: 1rem !important;
}

.form-label{
  font-weight: 700 !important;
}

.toolpath-layout {
  width: 100%;
  margin: 0;
  display: flex;
  flex-wrap: nowrap;
}

.toolpath-layout .canvas-wrapper {
  flex: 1;
  min-width: 0;
  --bs-gutter-x: 0;
}

.right-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 0;
}

.scrolling-table {
  flex: 1;
  max-height: calc(100vh - 64px); /* Adjust height as needed */
  overflow-y: auto;
  border: 0px solid #ddd;
  background-color: #ddd;
  padding-bottom: 3rem;
  /* padding-right: 0.5rem;
  padding-left: 0.5rem; */
  /* margin-bottom: 3.5rem; */
}

.save-button {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;      /* vertical centering */
  justify-content: center;  /* horizontal centering */
  width: 100%;
  height: 4rem;
  padding: 0.5rem 1rem;
  gap: 0.5rem;               /* spacing between icon and text */
  font-weight: 600;
  font-size: 1.1rem;
}




.checkbox-cell {
  max-width: fit-content;
  padding-left: 0.75rem; /* Add this line */
}

th:first-child {
  padding-left: 0.75rem; /* Match checkbox cell padding */
}

.canvas-wrapper.drag-hover {
  outline: 3px dashed #00aaff;
  background-color: #eefbff;
}

.topbar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  /* background: rgba(0, 0, 0, 0.6); */
  color: #000;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 10;
}


.table-dark{
  background-color: var(--bs-secondary) !important;
}

table th {
  background-color: var(--bs-secondary) !important;
}

.btn-outline-secondary, .btn-outline-danger, .btn-outline-dark{
  background-color: #fff !important;
  
}

.btn-outline-danger:hover{
  background-color: #dc3545 !important;
  color: #FFF !important;
}

.btn-outline-secondary:hover{
  background-color: #6c757d !important;
  color: #FFF !important;
}

.btn-outline-dark:hover{
  background-color: #212529 !important;
  color: #FFF !important;
}

.toolpath-layout {
  height: calc(100vh - 105px);
  overflow: hidden;
}

.toolpath-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.canvas-wrapper {
  height: 100%;
  overflow: hidden;
  position: relative;
}


.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.fixed-help-button {
  position: absolute;
  bottom: 0;
  left: 0;
  margin-top: 1rem;
  pointer-events: auto;
  width: 200px;
}

.example-drill-file{
  background-color: #fff;
  border-radius: 0.5rem;
  
}



</style>


<style>
.key-icon {
  border: 1px solid #000;
  border-radius: 0.25rem;
  padding: 0.1rem 0.2rem 0.2rem 0.2rem;
  color: #000;
  font-weight: 600;
  background-color: #fff;
  margin: 0;
}
</style>