<template>
  <div class="toolpath-editor">
    <h2 class="text-primary mb-3">Solder Toolpath Editor</h2>

    <!-- Toolbar -->
    <div class="toolbar mb-3">
      <button class="btn btn-primary" @click="autoOptimizePath">Auto Optimize Path</button>
      <button class="btn btn-secondary ms-2" @click="optimizeSelected">Optimize Selection</button>
      <button class="btn btn-outline-danger ms-2" @click="clearPath">Clear Path</button>
      <button class="btn btn-outline-success ms-2" @click="setSelectedSolder(true)">Set Solder</button>
      <button class="btn btn-outline-secondary ms-2" @click="setSelectedSolder(false)">Clear Solder</button>

      <button class="btn btn-outline-dark ms-2" @click="undo">Undo</button>
    </div>

    <!-- PCB Offset Controls -->
    <div class="mb-3">
      <label class="form-label"><i class="fas fa-arrows-alt-h"></i> PCB Offset X:</label>
      <input type="number" class="form-control d-inline w-auto" v-model.number="drillStore.originOffsetX" @input="updateCanvas">
      <label class="form-label ms-3"><i class="fas fa-arrows-alt-v"></i> PCB Offset Y:</label>
      <input type="number" class="form-control d-inline w-auto" v-model.number="drillStore.originOffsetY" @input="updateCanvas">
    </div>

    <div class="row">
      <div class="col-lg-8">
        <canvas
          ref="canvas"
          class="toolpath-canvas"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @wheel.prevent="handleZoom"
          @contextmenu.prevent
        ></canvas>

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
              <td>
                <input type="checkbox" v-model="hole.solder" @change="onSolderToggle(hole)" />
              </td>

            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useDrillStore } from "@/stores/drillStore";

const drillStore = useDrillStore();
const canvas = ref(null);

let ctx, scale = 1, offsetX = 0, offsetY = 0;
const radius = 3;

let isPanning = false;
let startX = 0;
let startY = 0;

let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;



onMounted(() => {
  const canvasEl = canvas.value;
  ctx = canvasEl.getContext("2d");

  const dpr = window.devicePixelRatio || 1;
  const width = canvasEl.parentElement.clientWidth;
  const height = window.innerHeight * 0.5;

  canvasEl.width = width * dpr;
  canvasEl.height = height * dpr;
  canvasEl.style.width = width + "px";
  canvasEl.style.height = height + "px";

  ctx.scale(dpr, dpr);
  offsetX = width / 3;
  offsetY = height * 0.75;

  updateCanvas();
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


const updateCanvas = () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Draw build plate (235mm x 235mm)
  ctx.fillStyle = "#e0e0e0";
  ctx.fillRect(0, -235, 235, 235);

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


  // draw path lines
  const path = drillStore.path;
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1;
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
    ctx.lineWidth = 1 / scale;
    ctx.fill();
    ctx.stroke();

    // draw index number if in path
    if (d.pathIndex !== null) {
      ctx.fillStyle = "black";
      ctx.font = `${10 / scale}px sans-serif`;
      ctx.fillText((d.pathIndex + 1).toString(), x + 4 / scale, y - 4 / scale);
    }
  });

  if (isSelecting && selectionStart && selectionEnd) {
  const x = selectionStart.x;
  const y = -selectionStart.y;
  const w = selectionEnd.x - selectionStart.x;
  const h = -(selectionEnd.y - selectionStart.y);
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 1 / scale;
  ctx.strokeRect(x, y, w, h);
}


  ctx.restore();
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
  const delta = e.deltaY * -0.001;
  scale = Math.max(0.5, Math.min(5, scale + delta));
  updateCanvas();
};

const getMousePosition = (e, applyOffset = true) => {
  const rect = canvas.value.getBoundingClientRect();
  let x = (e.clientX - rect.left - offsetX) / scale;
  let y = -(e.clientY - rect.top - offsetY) / scale;

  if (applyOffset) {
    x -= drillStore.originOffsetX;
    y += drillStore.originOffsetY;
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
  border: 1px solid #ccc;
  width: 100%;
  aspect-ratio: 1.5;
}
.scrolling-table {
  overflow-y: auto;
  max-height: 50vh;  /* Matches the canvas height (50% of viewport) */
  border: 1px solid #ddd;
}


.table-primary {
  background-color: rgba(0, 123, 255, 0.2);
}
</style>
