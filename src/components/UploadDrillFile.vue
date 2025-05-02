<template>
  <div class="container mt-4 mb-5">
    <div
      class="file-drop-zone"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <!-- Title -->
      <h2 class="text-primary mb-3 d-flex align-items-center" style="white-space: nowrap;">
        <i class="fa-solid fa-file-arrow-up me-2"></i>
        Drill File
      </h2>

      <!-- File Input -->
      <div class="position-relative">
        <input
          type="file"
          class="form-control"
          @change="handleFiles"
          ref="fileInput"
          accept=".drl,.txt"
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

      <!-- Filename display if set manually -->
      <div v-if="drillStore.drillFilename" class="mt-2 text-muted">
        <b>Selected:</b> {{ drillStore.drillFilename }}
      </div>

      <!-- Setup instructions link -->
      <div class="mt-2">
        <a
          href="https://github.com/RinthLabs/SolderSidekick/blob/main/Documentation.md"
          target="_blank"
          rel="noopener"
        >
          Drill file setup instructions
        </a>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref } from "vue";
import { useDrillStore } from "@/stores/drillStore";

const drillStore = useDrillStore();
const fileInput = ref(null);

const inchesToMm = (inches) => Math.round(inches * 25.4 * 100) / 100;

const handleFiles = (event) => {
  const file = event.target.files?.[0];
  if (file) parseDrillFile(file);
};

const handleDrop = (event) => {
  const file = Array.from(event.dataTransfer.files).find(f =>
    f.name.endsWith(".drl") || f.name.endsWith(".txt")
  );
  if (file) parseDrillFile(file);
};

const parseDrillFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    drillStore.setDrillFile(text, file.name);

    let parsedDrills = [];
    let toolSizes = {};
    let currentTool = null;

    const lines = text.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith(";") || line.startsWith("M48") || line.startsWith("M30")) continue;

      const toolMatch = line.match(/^T(\d+)C([\d.]+)/);
      if (toolMatch) {
        const toolId = `T${toolMatch[1]}`;
        toolSizes[toolId] = inchesToMm(parseFloat(toolMatch[2]));
        continue;
      }

      const toolChangeMatch = line.match(/^T(\d+)$/);
      if (toolChangeMatch) {
        currentTool = `T${toolChangeMatch[1]}`;
        continue;
      }

      const coordMatch = line.match(/X([-+]?\d*\.?\d+)Y([-+]?\d*\.?\d+)/);
      if (coordMatch) {
        const x = inchesToMm(parseFloat(coordMatch[1]));
        const y = inchesToMm(parseFloat(coordMatch[2]));
        parsedDrills.push({
          tool: currentTool || "Unknown",
          size: toolSizes[currentTool] ? `${toolSizes[currentTool]} mm` : "Unknown",
          x,
          y,
        });
      }
    }

    drillStore.setDrillData(parsedDrills, toolSizes);
    drillStore.triggerCanvasUpdate();
  };

  reader.readAsText(file);
};

const clearFile = () => {
  drillStore.clearDrillFile();
  drillStore.triggerCanvasUpdate();
  if (fileInput.value) fileInput.value.value = "";
};
</script>

<style>
.file-drop-zone {
  border: 2px dashed #aaa;
  padding: 1rem;
  border-radius: 0.5rem;
  transition: background 0.3s ease;
}
.file-drop-zone:hover {
  background: #f5f5f5;
}
</style>
