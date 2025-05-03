<template>
  <div class="container">
  <div class="toolpath-editor container">
    <h2 class="text-primary mb-3"><i class="fa-solid fa-fire"></i> Solder Toolpath Editor</h2>

        <!-- PCB Offset and Rotation Controls -->

    <div class="mb-3 d-flex align-items-center pcb-controls">
      <label class="form-label">PCB Thickness (mm) <i class="fas fa-layer-group pcb-icon mw-5"></i></label>
      <input type="number" class="form-control d-inline w-auto pcb-input" v-model.number="drillStore.pcbThickness">

      <label class="form-label pcb-section">Mount Height (mm) <i class="fas fa-ruler-vertical pcb-icon mw-5"></i></label>
      <input type="number" class="form-control d-inline w-auto pcb-input" v-model.number="drillStore.mountHeight">
    </div>

<div class="mb-3 d-flex align-items-center pcb-controls">
      <label class="form-label">PCB Offset (mm) <i class="fas fa-arrows-alt-h pcb-icon"></i></label>
      <input type="number" class="form-control d-inline w-auto pcb-input" v-model.number="drillStore.originOffsetX" @input="updateCanvas">
      <label class="form-label"><i class="fas fa-arrows-alt-v pcb-icon"></i></label>
      <input type="number" class="form-control d-inline w-auto pcb-input" v-model.number="drillStore.originOffsetY" @input="updateCanvas">

      <label class="form-label mw-5 pcb-section">Flip</label>
      <button class="btn btn-outline-secondary" @click="mirrorHorizontal"><i class="fa-solid fa-right-left"></i></button>
      <button class="btn btn-outline-secondary" @click="mirrorVertical"><i class="fa-solid fa-right-left r90"></i></button>

      <!-- <label class="form-label pcb-section">PCB Thickness (mm) <i class="fas fa-layer-group pcb-icon mw-5"></i></label>
      <input type="number" class="form-control d-inline w-auto pcb-input" v-model.number="drillStore.pcbThickness">

      <label class="form-label pcb-section">Mount Height (mm) <i class="fas fa-ruler-vertical pcb-icon mw-5"></i></label>
      <input type="number" class="form-control d-inline w-auto pcb-input" v-model.number="drillStore.mountHeight"> -->
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
    </div>

  </div>

</div>




    <div class="row toolpath-layout gx-3">

      <div class="col-lg-8 position-relative canvas-wrapper">
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
          <div class="editor-label">Right click + drag to pan. Scroll to zoom.</div>
          <div class="editor-label">Left click each point to manually define tool path.</div>
          <div class="editor-label">Ctrl + left click to select points. Left click drag to box select</div>
        </div>

      </div>

      <div class="col-lg-4 scrolling-table">
        <table class="table table-sm table-striped">
          <thead class="table-dark">
            <tr>
              <th>#</th>
              <th>X</th>
              <th>Y</th>
              <th>Tool</th>
              <th>Solder</th>
              <th>Feed (mm)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(hole, index) in sortedDrillData"
              :key="hole.id"
              :class="{ 'table-primary': hole.selected }"
              @click="toggleSelect(hole.id)"
            >
              <td>{{ hole.pathIndex !== null ? hole.pathIndex + 1 : '-' }}</td>
              <td>{{ hole.x.toFixed(1) }}</td>
              <td>{{ hole.y.toFixed(1) }}</td>
              <td>{{ hole.tool }}</td>
              <td class="checkbox-cell">
                <input type="checkbox" v-model="hole.solder" @change="onSolderToggle(hole)" />
              </td>
              <td>
                <input type="number" class="form-control form-control-sm" v-model.number="hole.feed" min="0" step="0.1" style="max-width: 70px;" />
              </td>


            </tr>
          </tbody>
        </table>
      </div>
    </div>

</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useDrillStore } from "@/stores/drillStore";

const drillStore = useDrillStore();
const canvas = ref(null);

let ctx, scale = 1, offsetX = 0, offsetY = 0;
const rotation = ref(0); // degrees

const radius = 4;

let isPanning = false;
let startX = 0;
let startY = 0;

let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;

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
  const height = window.innerHeight * 0.6;

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
});

onMounted(() => {

  const canvasEl = canvas.value;
  ctx = canvasEl.getContext("2d");
  // resizeCanvas(); // initialize
  // window.addEventListener("resize", resizeCanvas); // ⬅️ Listen for resize

  resizeCanvas();          // sets canvas size and devicePixelRatio
  fitCanvasToBuildPlate(); // zooms and centers based on build plate
  window.addEventListener("resize", () => {
    resizeCanvas();
    fitCanvasToBuildPlate(); // re-fit on resize too
  });

});

const onSolderToggle = (hole) => {
  if (!hole.solder) {
    drillStore.removeFromPath(hole.id);
  } else {
    drillStore.addToPath(hole.id);
  }
  updateCanvas();
};

const setSelectedSolder = (state) => {
  drillStore.drillData.forEach(d => {
    if (d.selected) {
      d.solder = state;
      if (!state) {
        drillStore.removeFromPath(d.id); // ⬅️ Only remove from path when clearing solder
      }
    }
  });
  updateCanvas();
};


const rotatePCB = (angleDelta) => {
  rotation.value = (rotation.value + angleDelta) % 360;
  updateCanvas();
};

const mirrorHorizontal = () => {
  drillStore.drillData.forEach(d => d.x *= -1);
  updateCanvas();
};

const mirrorVertical = () => {
  drillStore.drillData.forEach(d => d.y *= -1);
  updateCanvas();
};



const drawArrow = (ctx, from, to, color) => {
  const headLength = 6;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  const lineEndX = to.x - headLength * Math.cos(angle) * 0.5;
  const lineEndY = to.y - headLength * Math.sin(angle) * 0.5;

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(lineEndX, lineEndY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6), to.y - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6), to.y - headLength * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
};

const drawClippedGrid = (ctx, width, height, spacing = 16, color = "#aaaaaa") => {
  ctx.save(); // Save before clipping
  ctx.beginPath();
  ctx.rect(0, -height, width, height);
  ctx.clip();

  // === Draw Grid Lines ===
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

  // === Draw Circle Grid ===
  const circleSpacing = 8;
  const circleRadius = 2.5; // diameter = 5mm
  const offsetX = 4;
  const offsetY = 4;

  ctx.fillStyle = "#d0d0d0";

  for (let x = offsetX; x <= width; x += circleSpacing) {
    for (let y = offsetY; y <= height; y += circleSpacing) {
      ctx.beginPath();
      ctx.arc(x, -y, circleRadius, 0, 2 * Math.PI); // flip y
      ctx.fill();
    }
  }

  ctx.restore();
};




const updateCanvas = () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Draw build plate (235mm x 235mm)
  ctx.fillStyle = "#c9c9c9";
  ctx.fillRect(0, -235, 235, 235);

  // Draw 16mm grid lines clipped to print bed
  drawClippedGrid(ctx, 235, 235, 16);

  // Draw origin cross (blue)
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(5, 0);
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 5);
  ctx.stroke();

  // Draw axes
  drawArrow(ctx, { x: 0, y: 0 }, { x: 40, y: 0 }, "red");   // X-axis
  drawArrow(ctx, { x: 0, y: 0 }, { x: 0, y: -40 }, "green"); // Y-axis

  // 💡 Apply offset only to drill data
  ctx.translate(drillStore.originOffsetX, -drillStore.originOffsetY);
  ctx.rotate((rotation.value * Math.PI) / 180);

  // Draw + at drill file origin (0,0) after offset and rotation
  ctx.strokeStyle = "magenta";
  ctx.lineWidth = 1 / scale;
  ctx.beginPath();
  ctx.moveTo(-4 / scale, 0);
  ctx.lineTo(4 / scale, 0);
  ctx.moveTo(0, -4 / scale);
  ctx.lineTo(0, 4 / scale);
  ctx.stroke();



  // draw path lines
  const path = drillStore.path;
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 8 / scale;
  ctx.beginPath();
  path.forEach((id, idx) => {
    const pt = drillStore.drillData.find(d => d.id === id);
    if (pt) {
      const x = pt.x;
      const y = -pt.y;

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  });
  ctx.stroke();

  // draw holes
  drillStore.drillData.forEach((d, i) => {
    const x = d.x;
    const y = -d.y;

    ctx.beginPath();
    ctx.arc(x, y, radius / scale, 0, 2 * Math.PI);
    ctx.fillStyle = d.solder ? "red" : "gray";
    ctx.strokeStyle = d.selected ? "cyan" : "black";
    ctx.lineWidth = 2 / scale;
    ctx.fill();
    ctx.stroke();

    // draw index number if in path
    if (d.pathIndex !== null) {
      ctx.fillStyle = "black";
      ctx.font = `${12 / scale}px sans-serif`;
      ctx.fillText((d.pathIndex + 1).toString(), x + 4 / scale, y - 4 / scale);
    }
  });

  ctx.restore();

if (isSelecting && selectionStart && selectionEnd) {
  // Draw the selection box in screen space (no transform)
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
}

};

const sortedDrillData = computed(() => {
  return [...drillStore.drillData].sort((a, b) => {
    if (a.pathIndex === null) return 1;
    if (b.pathIndex === null) return -1;
    return a.pathIndex - b.pathIndex;
  });
});

const handleMouseDown = (e) => {
  if (e.button === 2) { // Right-click
    isPanning = true;
    startX = e.clientX;
    startY = e.clientY;
    return;
  }

  const pt = getMousePosition(e);
  const clicked = drillStore.drillData.find(
    d => Math.hypot(d.x - pt.x, d.y - pt.y) < 1
  );
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
  isPanning = false;
  if (isSelecting && selectionStart && selectionEnd) {
  const [x1, x2] = [selectionStart.x, selectionEnd.x].sort((a, b) => a - b);
  const [y1, y2] = [selectionStart.y, selectionEnd.y].sort((a, b) => a - b);

  drillStore.drillData.forEach(d => {
    const x = d.x + drillStore.originOffsetX;
    const y = d.y + drillStore.originOffsetY;
    d.selected = x >= x1 && x <= x2 && y >= y1 && y <= y2;
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
  const selected = drillStore.drillData.filter(d => d.selected);
  selected.forEach(d => {
    d.solder = true;
    drillStore.addToPath(d.id);
  });
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
</script>

<style scoped>
.toolpath-canvas {
  border: 1px solid #eeeeee;
  width: 100%;
  aspect-ratio: 1.5;
}
/* .scrolling-table {
  overflow-y: auto;
  max-height: 50vh;
  border: 1px solid #ddd;
  background-color: #ddd;
} */


.table-primary {
  background-color: rgba(0, 123, 255, 0.2);
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

.pcb-input {
  width: 5rem !important;
}

.pcb-controls{
  gap:0.5rem;
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
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  line-height: 1.3;
  pointer-events: none; /* 👈 This makes it ignore all mouse interaction */
}


.editor-label {
  margin-bottom: 0.25rem;
}

.editor-label:last-child {
  margin-bottom: 0;
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

.toolpath-layout .scrolling-table {
  width: 400px;
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid #ddd;
  background-color: #ddd;
  --bs-gutter-x: 0;
}

.checkbox-cell{
  max-width: fit-content;
}


</style>
