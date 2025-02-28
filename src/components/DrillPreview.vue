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

    <div class="mb-3">
  <label class="form-label">PCB Offset X:</label>
  <input type="number" class="form-control d-inline w-auto" v-model.number="drillStore.originOffsetX" @input="updateCanvas">
  <label class="form-label ms-3">PCB Offset Y:</label>
  <input type="number" class="form-control d-inline w-auto" v-model.number="drillStore.originOffsetY" @input="updateCanvas">
  <label class="form-label ms-3">Solder Feed Multiplier:</label>
  <input type="number" class="form-control d-inline w-auto" v-model.number="drillStore.solderFeedMultiplier" min="0" step="0.01">
 
</div>


    <!-- Table for drill points -->
    <table v-if="drillStore.drillData.length" class="table table-striped mt-3">
      <thead class="table-dark">
        <tr>
          <th>Solder</th>
          <th>Tool</th>
          <th>Solder Feed (mm)</th>
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
            <input type="checkbox" v-model="drill.solder" @change="updateCanvas" />
          </td>
          <td>{{ drill.tool }}</td>
          <td>
            <input 
              type="number" 
              min="0" step="0.05"
              class="form-control d-inline w-auto" 
              v-model.number="drill.solderFeed"
              @input="updateCanvas"
            />
          </td>
          <td>{{ drill.x }}</td>
          <td>{{ drill.y }}</td>
        </tr>
      </tbody>
    </table>

    <button class="btn btn-success mt-3" @click="exportSelectedHoles">Export Selected Holes</button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useDrillStore } from "@/stores/drillStore";

const drillStore = useDrillStore();
const canvas = ref(null);
let ctx, scale = 1, offsetX = 0, offsetY = 0;
let isPanning = false, startX, startY;
let isSelecting = false, selectionStart, selectionEnd;
let clickedDrill = null;

// ** Initialize Canvas Rendering **
onMounted(() => {
  ctx = canvas.value.getContext("2d");
  resetView();
  updateCanvas();
});



// ** Reset View: Move Origin to Bottom Left of Print Bed **
const resetView = () => {
  const canvasWidth = canvas.value.width;
  const canvasHeight = canvas.value.height;
  
  offsetX = (canvasWidth - 235) / 2; // Center horizontally
  offsetY = (canvasHeight + 235) / 2; // Bottom-left position
};

// ** Draw Everything on the Canvas **
const updateCanvas = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  // ** Apply Scaling and Translation for Zoom **
  ctx.save();
  ctx.translate(offsetX, offsetY); // Keep bed and axes fixed
  ctx.scale(scale, scale);

  // ** Draw Ender3 Print Bed (Stays Fixed) **
  ctx.fillStyle = "#e0e0e0";
  ctx.fillRect(0, -235, 235, 235);

  // ** Draw Origin Marker (Stays Fixed) **
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(5, 0);
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 5);
  ctx.stroke();

  // ** Draw X and Y Axes (Stays Fixed) **
  drawArrow(ctx, { x: 0, y: 0 }, { x: 40, y: 0 }, "red"); // X-axis
  drawArrow(ctx, { x: 0, y: 0 }, { x: 0, y: -40 }, "green"); // Y-axis

  // ** Move to New Origin (Only Affects Drill Positions) **
  ctx.translate(drillStore.originOffsetX, -drillStore.originOffsetY);

  // ** Draw Origin Drill Position (Now Moves with Offset) **
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = "blue";
  ctx.fill();

  // ** Draw Drill Holes (Now Moves with Offset) **
  drillStore.drillData.forEach((drill) => {
    const x = drill.x;
    const y = -drill.y; // Invert Y for bottom-left origin

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = drill.solder ? "red" : "gray";
    ctx.strokeStyle = drill.selected ? "cyan" : "black";
    ctx.fill();
    ctx.stroke();
  });

  // ** Draw Selection Box (Moves with Offset) **
  if (isSelecting) {
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      selectionStart.x,
      selectionStart.y,
      selectionEnd.x - selectionStart.x,
      selectionEnd.y - selectionStart.y
    );
  }

  ctx.restore();
};


const drawArrow = (ctx, from, to, color) => {
  const headLength = 6; // Arrowhead size
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.fillStyle = color;

  // ** Adjusted Line End to Stop Before Arrowhead **
  const lineEndX = to.x - (headLength / 2) * Math.cos(angle);
  const lineEndY = to.y - (headLength / 2) * Math.sin(angle);

  // ** Draw Line **
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(lineEndX, lineEndY); // Stop the line before the arrowhead
  ctx.stroke();

  // ** Draw Arrowhead **
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLength * Math.cos(angle - Math.PI / 6),
    to.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    to.x - headLength * Math.cos(angle + Math.PI / 6),
    to.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.lineTo(to.x, to.y);
  ctx.fill();
};



// ** Handle Mouse Events **
const startInteraction = (event) => {
  const rect = canvas.value.getBoundingClientRect();
  const x = (event.clientX - rect.left - offsetX) / scale;
  const y = (event.clientY - rect.top - offsetY) / scale;

  clickedDrill = drillStore.drillData.find(
  (drill) => Math.hypot(
    drill.x - (x - drillStore.originOffsetX),
    -drill.y - (y + drillStore.originOffsetY)
  ) < 5 // Click within 5px radius
);

  if (event.button === 2) {
    isPanning = true;
    startX = event.clientX;
    startY = event.clientY;
  } else if (clickedDrill) {
    // ** Toggle Selection on Click **
    clickedDrill.selected = !clickedDrill.selected;
    updateCanvas();
  } else {
     // ** Clicking empty space starts selection box **
     isSelecting = true;
    selectionStart = {
      x: x - drillStore.originOffsetX,
      y: y + drillStore.originOffsetY
    };
    selectionEnd = { ...selectionStart };
  }
};


const handleMouseMove = (event) => {
  if (isPanning) {
    offsetX += event.clientX - startX;
    offsetY += event.clientY - startY;
    startX = event.clientX;
    startY = event.clientY;
    updateCanvas();
  } else if (isSelecting) {
    const rect = canvas.value.getBoundingClientRect();
    selectionEnd = {
  x: ((event.clientX - rect.left - offsetX) / scale) - drillStore.originOffsetX,
  y: ((event.clientY - rect.top - offsetY) / scale) + drillStore.originOffsetY
};

    updateCanvas();
  }
};

const endInteraction = () => {
  if (isSelecting) {
    let selectedDrills = 0;
    drillStore.drillData.forEach((drill) => {
      const drillX = drill.x - drillStore.originOffsetX;
const drillY = -drill.y + drillStore.originOffsetY;





      if (
        drillX + drillStore.originOffsetX >= Math.min(selectionStart.x, selectionEnd.x) &&
        drillX + drillStore.originOffsetX <= Math.max(selectionStart.x, selectionEnd.x) &&
        drillY - drillStore.originOffsetY >= Math.min(selectionStart.y, selectionEnd.y) &&
        drillY - drillStore.originOffsetY <= Math.max(selectionStart.y, selectionEnd.y)
      ) {
        drill.selected = true;
        selectedDrills++;
      }
    });

    // ** If no drills were selected, deselect everything **
    if (selectedDrills === 0) {
      drillStore.drillData.forEach((d) => (d.selected = false));
    }
  }
  
  isPanning = false;
  isSelecting = false;
  updateCanvas();
};

// ** Handle Zooming **
const handleZoom = (event) => {
  event.preventDefault();
  const zoomAmount = event.deltaY * -0.001;
  scale += zoomAmount;
  scale = Math.max(0.5, Math.min(5, scale));
  updateCanvas();
};

// ** Helper Functions **
const selectAll = () => {
  drillStore.drillData.forEach((d) => (d.selected = true));
  updateCanvas();
};

const deselectAll = () => {
  drillStore.drillData.forEach((d) => (d.selected = false));
  updateCanvas();
};

const setSelectedSolder = (state) => {
  drillStore.drillData.forEach((drill) => {
    if (drill.selected) {
      drill.solder = state;
    }
  });
  updateCanvas();
};

// Watch for offset changes and update canvas
watch([() => drillStore.originOffsetX, () => drillStore.originOffsetY, () => drillStore.solderFeedMultiplier], updateCanvas);
</script>

<style>
.drill-canvas {
  border: 1px solid #ddd;
  background-color: white;
  cursor: crosshair;
}

.table tbody tr {
  --bs-table-bg: transparent !important;
}

.selected-row {
  background-color: cyan !important;
}
.unselected-row {
  background-color: white !important;
}
</style>
