<template>
  <div class="container mt-4">
    <h2 class="text-primary">Drill Hole Preview (Canvas)</h2>

    <!-- Toolbar -->
    <div class="mb-3">
      <button class="btn btn-primary" @click="selectAll">Select All</button>
      <button class="btn btn-secondary ms-2" @click="deselectAll">Deselect All</button>
      <button class="btn btn-success ms-2" @click="setSelectedSolder(true)">Set Selected as Soldered</button>
      <button class="btn btn-danger ms-2" @click="setSelectedSolder(false)">Set Selected as Not Soldered</button>
    </div>

    <!-- Canvas -->
    <canvas 
      ref="canvas" 
      class="drill-canvas" 
      width="800" 
      height="500"
      @mousedown="startInteraction"
      @mousemove="handleMouseMove"
      @mouseup="endInteraction"
      @wheel="handleZoom"
      @contextmenu.prevent
    ></canvas>

    <!-- Table for drill points -->
    <table v-if="drillStore.drillData.length" class="table table-striped mt-3">
      <thead class="table-dark">
        <tr>
          <th>Solder</th>
          <th>Tool</th>
          <th>Size (mm)</th>
          <th>X (mm)</th>
          <th>Y (mm)</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(drill, index) in drillStore.drillData"
          :key="index"
          :class="{ 'selected-row': drill.selected, 'unselected-row': !drill.selected }"
        >
          <td>
            <input type="checkbox" v-model="drill.solder" @change="drawCanvas" />
          </td>
          <td>{{ drill.tool }}</td>
          <td>{{ drill.size ? drill.size.toFixed(2) : 'Unknown' }}</td>
          <td>{{ drill.x }}</td>
          <td>{{ drill.y }}</td>
        </tr>
      </tbody>
    </table>

    <button class="btn btn-success mt-3" @click="exportSelectedHoles">Export Selected Holes</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useDrillStore } from "@/stores/drillStore";

const drillStore = useDrillStore();
const canvas = ref(null);
let ctx, scale = 1, offsetX = 0, offsetY = 0;
let isPanning = false, startX, startY;
let isSelecting = false, selectionStart, selectionEnd;

// ** Initialize Canvas Rendering **
onMounted(() => {
  ctx = canvas.value.getContext("2d");
  resetView();
  drawCanvas();
});

// ** Reset View: Move Origin to Bottom Left of Print Bed **
const resetView = () => {
  const canvasWidth = canvas.value.width;
  const canvasHeight = canvas.value.height;
  
  offsetX = (canvasWidth - 235) / 2; // Center horizontally
  offsetY = (canvasHeight + 235) / 2; // Bottom-left position
};

// ** Draw Everything on the Canvas **
const drawCanvas = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  console.log("🟢 Drawing Canvas...");
  console.log(`➡ Drill Data Count: ${drillStore.drillData.length}`);

  // ** Apply Scaling and Translation for Zoom **
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // ** Draw Ender3 Print Bed **
  ctx.fillStyle = "#e0e0e0";
  ctx.fillRect(0, -235, 235, 235);
  console.log(`🛠️ Print Bed drawn at: X=0, Y=-235`);

  // ** Draw Origin Marker (Bottom Left of Bed) **
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(5, 0);
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 5);
  ctx.stroke();
  console.log(`📍 Origin drawn at: X=0, Y=0`);

  // ** Draw Drill Holes (Now Zooms Correctly) **
  drillStore.drillData.forEach((drill, index) => {
    const x = drill.x;
    const y = -drill.y; // Invert Y so the origin is at the bottom-left

    console.log(`🔧 Drill #${index}: Original (X=${drill.x}, Y=${drill.y}) → Transformed (X=${x}, Y=${y})`);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = drill.selected ? "cyan" : drill.solder ? "red" : "gray";
    ctx.fill();
    ctx.stroke();
  });

  console.log("✅ Finished drawing drill points.");
  ctx.restore();
};

// ** Handle Mouse Events **
const startInteraction = (event) => {
  const rect = canvas.value.getBoundingClientRect();
  const x = (event.clientX - rect.left - offsetX) / scale;
  const y = (event.clientY - rect.top - offsetY) / scale;

  if (event.button === 2) {
    isPanning = true;
    startX = event.clientX;
    startY = event.clientY;
  } else {
    isSelecting = true;
    selectionStart = { x, y };
    selectionEnd = { x, y };
  }
};

const handleMouseMove = (event) => {
  if (isPanning) {
    offsetX += event.clientX - startX;
    offsetY += event.clientY - startY;
    startX = event.clientX;
    startY = event.clientY;
    drawCanvas();
  } else if (isSelecting) {
    const rect = canvas.value.getBoundingClientRect();
    selectionEnd = {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
    drawCanvas();
  }
};

const endInteraction = () => {
  if (isSelecting) {
    drillStore.drillData.forEach((drill) => {
      const drillX = drill.x;
      const drillY = drill.y;

      if (
        drillX >= Math.min(selectionStart.x, selectionEnd.x) &&
        drillX <= Math.max(selectionStart.x, selectionEnd.x) &&
        drillY >= Math.min(selectionStart.y, selectionEnd.y) &&
        drillY <= Math.max(selectionStart.y, selectionEnd.y)
      ) {
        drill.selected = true;
      }
    });
  }
  isPanning = false;
  isSelecting = false;
  drawCanvas();
};

// ** Handle Zooming **
const handleZoom = (event) => {
  event.preventDefault();
  const zoomAmount = event.deltaY * -0.001;
  scale += zoomAmount;
  scale = Math.max(0.5, Math.min(5, scale));
  drawCanvas();
};

// ** Helper Functions **
const selectAll = () => {
  drillStore.drillData.forEach((d) => (d.selected = true));
  drawCanvas();
};

const deselectAll = () => {
  drillStore.drillData.forEach((d) => (d.selected = false));
  drawCanvas();
};

const setSelectedSolder = (state) => {
  drillStore.drillData.forEach((drill) => {
    if (drill.selected) {
      drill.solder = state;
    }
  });
  drawCanvas();
};
</script>

<style>
.drill-canvas {
  border: 1px solid #ddd;
  background-color: white;
  cursor: crosshair;
}
.selected-row {
  background-color: cyan !important;
}
.unselected-row {
  background-color: white !important;
}
</style>
