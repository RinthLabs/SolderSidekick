<template>
  <div class="container mt-4">
    <h2 class="text-primary">Drill Hole Preview (Canvas)</h2>

    

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

   <!-- PCB Offset & Solder Feed Multiplier Inputs -->
<div class="mb-3">
  <label class="form-label">
    <i class="fas fa-arrows-alt-h"></i> PCB Offset X:
  </label>
  <input type="number" class="form-control d-inline w-auto" v-model.number="drillStore.originOffsetX" @input="updateCanvas">

  <label class="form-label ms-3">
    <i class="fas fa-arrows-alt-v"></i> PCB Offset Y:
  </label>
  <input type="number" class="form-control d-inline w-auto" v-model.number="drillStore.originOffsetY" @input="updateCanvas">

  <label class="form-label ms-3">
    <i class="fas fa-tint"></i> Solder Feed Multiplier:
  </label>
  <input type="number" class="form-control d-inline w-auto" v-model.number="drillStore.solderFeedMultiplier" min="0" step="0.01">
</div>

<!-- Toolbar with Icons -->
<div class="mb-3">
  <button class="btn btn-primary" @click="selectAll">
    <i class="fas fa-check-square"></i> Select All
  </button>
  <button class="btn btn-secondary ms-2" @click="deselectAll">
    <i class="fas fa-times-circle"></i> Deselect All
  </button>
  <button class="btn btn-danger ms-2" @click="setSelectedSolder(true)">
    <i class="fas fa-fire"></i> Soldered
  </button>
  <button class="btn btn-secondary ms-2" @click="setSelectedSolder(false)">
    <i class="fas fa-ban"></i> Not Soldered
  </button>
  <button class="btn btn-success ms-2" @click="saveGcode">
    <i class="fa-solid fa-floppy-disk"></i> Save Gcode
  </button>
</div>


   


    <!-- Table for drill points -->
<table v-if="drillStore.drillData.length" class="table table-striped mt-3">
  <thead class="table-dark">
    <tr>
      <th>
        <i class="fas fa-check-circle"></i> Solder
      </th>
      <th>
        <i class="fas fa-tint"></i> Solder Feed (mm)
      </th>
      <th>
        <i class="fas fa-tools"></i> Tool
      </th>
      <th>
        <i class="fas fa-arrows-alt-h"></i> X (mm)
      </th>
      <th>
        <i class="fas fa-arrows-alt-v"></i> Y (mm)
      </th>
    </tr>
  </thead>
  <tbody>
    <tr
      v-for="(drill, index) in drillStore.drillData"
      :key="index"
      :class="{ 'selected-row': drill.selected, 'unselected-row': !drill.selected }"
      @click="toggleDrillSelection(index)"
    >
    <td>
  <input 
    type="checkbox" 
    :checked="drill.solder" 
    @change="updateSolderCheckbox($event, index)"
    @click.stop
  />
</td>

      <td>
  <input 
    type="number" 
    min="0" step="0.05"
    class="form-control d-inline w-auto" 
    :value="drill.solderFeed"
    @input="updateSolderFeed($event, index)"
    @click.stop
  />
</td>

      <td>
      <span @click.stop>
        {{ drill.tool }} 
        <span v-if="drillStore.toolSizes[drill.tool]">
          ({{ drillStore.toolSizes[drill.tool] }}")
        </span>
      </span>
    </td>
      <td><span @click.stop>{{ drill.x }}</span></td>
      <td><span @click.stop>{{ drill.y }}</span></td>
    </tr>
  </tbody>
</table>


    
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
let isDraggingDrillOrigin = false;

let animationFrameId = null;



// ** Initialize Canvas Rendering **
onMounted(() => {
  ctx = canvas.value.getContext("2d");
  resetView();
  updateCanvas();
});

const snapToGrid = (value) => Math.round(value * 2) / 2;




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

// ** Draw Drill Positions Origin Marker (Now Draggable) **
ctx.strokeStyle = "blue";
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(-5, 0);
ctx.lineTo(5, 0);
ctx.moveTo(0, -5);
ctx.lineTo(0, 5);
ctx.stroke();



// ** Draw Drill Positions (Relative to Draggable Origin) **
drillStore.drillData.forEach((drill, index) => {
  // Compute drill position relative to the new origin
  const x = drill.x; // Drill X position
  const y = -drill.y; // Drill Y position (inverted)

  // ** Debugging Log: Check computed positions before rendering **
  console.log(`Drill #${index}: X=${x}, Y=${y}, OriginOffsetX=${drillStore.originOffsetX}, OriginOffsetY=${drillStore.originOffsetY}`);

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

   // Check if the user clicks near the drill origin (within 5 pixels)
   if (Math.hypot(x - drillStore.originOffsetX, y + drillStore.originOffsetY) < 5) {
    isDraggingDrillOrigin = true;
    startX = x - drillStore.originOffsetX;
    startY = y + drillStore.originOffsetY;
  }

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
  const rect = canvas.value.getBoundingClientRect();
  const x = (event.clientX - rect.left - offsetX) / scale;
  const y = (event.clientY - rect.top - offsetY) / scale;

  if (isDraggingDrillOrigin) {
    
    let newOffsetX = snapToGrid(x - startX);
    let newOffsetY = snapToGrid(-(y - startY));

    if (newOffsetX !== drillStore.originOffsetX || newOffsetY !== drillStore.originOffsetY) {
      drillStore.originOffsetX = newOffsetX;
      drillStore.originOffsetY = newOffsetY;

      // Use requestAnimationFrame to update the canvas efficiently
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
          updateCanvas();
          animationFrameId = null; // Reset animation frame ID
        });
      }
    }
  }

  if (isPanning) {
    offsetX += event.clientX - startX;
    offsetY += event.clientY - startY;
    startX = event.clientX;
    startY = event.clientY;
    updateCanvas();
  } else if (isSelecting) {
    selectionEnd = {
      x: x - drillStore.originOffsetX,
      y: y + drillStore.originOffsetY,
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
  isDraggingDrillOrigin  = false;
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

const toggleDrillSelection = (index) => {
  // Toggle selection of the drill point
  drillStore.drillData[index].selected = !drillStore.drillData[index].selected;
  
  // Update the canvas to reflect changes
  updateCanvas();
};

const updateSolderFeed = (event, index) => {
  const newValue = parseFloat(event.target.value);
  if (isNaN(newValue)) return;

  // Update all selected drill holes with the new value
  drillStore.drillData.forEach((drill) => {
    if (drill.selected) {
      drill.solderFeed = newValue;
    }
  });

  updateCanvas();
};

const updateSolderCheckbox = (event, index) => {
  const newValue = event.target.checked; // Get the new checked state

  // Update all selected drill holes with the new checkbox state
  drillStore.drillData.forEach((drill) => {
    if (drill.selected) {
      drill.solder = newValue;
    }
  });

  updateCanvas();
};

const saveGcode = () => {
  const selectedDrills = drillStore.drillData.filter((d) => d.selected);
  console.log("Selected Drills:", selectedDrills);
};



// Watch for offset changes and update canvas


watch(
  [() => drillStore.originOffsetX, () => drillStore.originOffsetY, () => drillStore.solderFeedMultiplier],
  () => {
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(() => {
        updateCanvas();
        animationFrameId = null; // Reset animation frame ID after execution
      });
    }
  }
);


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
