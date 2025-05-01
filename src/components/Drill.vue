<template>
  <div class="container mt-4 mb-5">
    <div class="d-flex align-items-center gap-3">
      <!-- Label + Icon -->
      <h2 class="text-primary mb-0 d-flex align-items-center" style="white-space: nowrap;">
        <i class="fa-solid fa-file-arrow-up me-2"></i>Gerber Drill File
      </h2>

      <!-- File Input with overlayed filename and clear button -->
      <div class="position-relative flex-grow-1">
        <input
          type="file"
          class="form-control"
          @change="parseDrillFile"
          ref="fileInput"
          accept=".drl, .txt"
          style="z-index: 2"
        />

        <button
          v-if="drillStore.drillFilename"
          class="btn btn-sm btn-danger position-absolute end-0 top-50 translate-middle-y me-2"
          @click="clearFile"
          style="z-index: 3"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</template>



<script setup>
import { ref } from "vue";
import { useDrillStore } from "@/stores/drillStore"; // Import Pinia store

const drillStore = useDrillStore();
const fileInput = ref(null);

// Convert inches to mm and round to 0.01mm precision
const inchesToMm = (inches) => Math.round(inches * 25.4 * 100) / 100;

const parseDrillFile = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    
    // Store file content + filename in Pinia
    drillStore.setDrillFile(text, file.name);

    let parsedDrills = [];
    let toolSizes = {}; // Store tool diameters
    let currentTool = null;

    const lines = text.split("\n");

    for (let line of lines) {
      line = line.trim();

      // Ignore comments and headers
      if (line.startsWith(";") || line.startsWith("M48") || line.startsWith("M30")) continue;

      // ** Extract Tool Definitions (e.g., T1C0.0420) **
      const toolMatch = line.match(/^T(\d+)C([\d.]+)/);
      if (toolMatch) {
        const toolId = `T${toolMatch[1]}`;
        const toolSize = inchesToMm(parseFloat(toolMatch[2])); // Convert to mm, round to 0.01mm
        toolSizes[toolId] = toolSize;
        continue;
      }

      // ** Detect Tool Change (e.g., T1, T2) **
      const toolChangeMatch = line.match(/^T(\d+)$/);
      if (toolChangeMatch) {
        currentTool = `T${toolChangeMatch[1]}`;
        continue;
      }

      // ** Extract Drill Coordinates (e.g., X0.5512Y-0.8858) **
      const coordMatch = line.match(/X([-+]?\d*\.?\d+)Y([-+]?\d*\.?\d+)/);
      if (coordMatch) {
        const x = inchesToMm(parseFloat(coordMatch[1])); // Convert to mm, round to 0.01mm
        const y = inchesToMm(parseFloat(coordMatch[2])); // Convert to mm, round to 0.01mm

        parsedDrills.push({
          tool: currentTool || "Unknown",  // Assign the last used tool
          size: toolSizes[currentTool] ? `${toolSizes[currentTool]} mm` : "Unknown", // Lookup size with mm suffix
          x,
          y,
        });
      }
    }

    // Store drill data & tool sizes in the Pinia store
    drillStore.setDrillData(parsedDrills, toolSizes);
    drillStore.triggerCanvasUpdate(); // 🔁 let the preview know it needs to redraw

  };

  reader.readAsText(file);
};

// Function to clear the stored file & reset input
const clearFile = () => {
  drillStore.clearDrillFile();
  drillStore.triggerCanvasUpdate(); // 🔁 let the preview know it needs to redraw
  if (fileInput.value) {
    fileInput.value.value = ""; // Reset file input field
  }
};
</script>

<style>
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid black;
  padding: 8px;
  text-align: center;
}

</style>
