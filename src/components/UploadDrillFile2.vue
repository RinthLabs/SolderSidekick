<template>
  <div>
    <div
      class="open-ui"
    >
      <button class="btn btn-outline-light btn-sm open-btn" @click="triggerFilePicker"><i class="fa-solid fa-file-arrow-up me-2"></i> Open File</button>

      <!-- Hidden File Input -->
      <input
        type="file"
        ref="fileInput"
        class="d-none"
        @change="handleFiles"
        accept=".drl,.txt,.json"
      />

    </div>
  </div>
</template>



<script setup>
import { ref } from "vue";
// import { useDrillStore } from "@/stores/drillStore";
import { useFileHandlers } from "@/composables/useFileHandlers";
const { parseDrillFile, parseProjectFile } = useFileHandlers();


// const drillStore = useDrillStore();
const fileInput = ref(null);

// const inchesToMm = (inches) => Math.round(inches * 25.4 * 100) / 100;

const handleFiles = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'json') {
    parseProjectFile(file);
  } else {
    parseDrillFile(file);
  }

  event.target.value = "";
};

// const parseProjectFile = (file) => {
//   const reader = new FileReader();
//   reader.onload = (e) => {
//     const project = JSON.parse(e.target.result);

//     drillStore.drillFilename = project.drillFilename || "imported.drl";
//     drillStore.drillData = project.drillData || [];
//     drillStore.path = project.path || [];
//     drillStore.originOffsetX = project.originOffsetX || 0;
//     drillStore.originOffsetY = project.originOffsetY || 0;
//     drillStore.toolSizes = project.toolSizes || {};
//     drillStore.pcbThickness = project.pcbThickness || 1.6;
//     drillStore.mountHeight = project.mountHeight || 28.8;
//     drillStore.feedPrime = project.feedPrime || 1.0;
//     drillStore.feedRetract = project.feedRetract || 0.5;

//     drillStore.updatePathIndices();
//     drillStore.triggerCanvasUpdate();
//   };
//   reader.readAsText(file);
// };




// const parseDrillFile = (file) => {
//   const reader = new FileReader();
//   reader.onload = (e) => {
//     const text = e.target.result;
//     drillStore.setDrillFile(text, file.name);

//     let parsedDrills = [];
//     let toolSizes = {};
//     let currentTool = null;

//     const lines = text.split("\n");
//     for (let line of lines) {
//       line = line.trim();
//       if (line.startsWith(";") || line.startsWith("M48") || line.startsWith("M30")) continue;

//       const toolMatch = line.match(/^T(\d+)C([\d.]+)/);
//       if (toolMatch) {
//         const toolId = `T${toolMatch[1]}`;
//         toolSizes[toolId] = inchesToMm(parseFloat(toolMatch[2]));
//         continue;
//       }

//       const toolChangeMatch = line.match(/^T(\d+)$/);
//       if (toolChangeMatch) {
//         currentTool = `T${toolChangeMatch[1]}`;
//         continue;
//       }

//       const coordMatch = line.match(/X([-+]?\d*\.?\d+)Y([-+]?\d*\.?\d+)/);
//       if (coordMatch) {
//         const x = inchesToMm(parseFloat(coordMatch[1]));
//         const y = inchesToMm(parseFloat(coordMatch[2]));
//         parsedDrills.push({
//           tool: currentTool || "Unknown",
//           size: toolSizes[currentTool] ? `${toolSizes[currentTool]} mm` : "Unknown",
//           x,
//           y,
//         });
//       }
//     }

//     drillStore.setDrillData(parsedDrills, toolSizes);
//     drillStore.triggerCanvasUpdate();
//   };

//   reader.readAsText(file);
// };


const triggerFilePicker = () => {
  if (fileInput.value) {
    fileInput.value.value = ""; // ✅ Clear before opening
    fileInput.value.click();
  }
};



</script>

<style>
.open-ui{
  color:#FFF;
}

.open-btn{
  height: 60px !important;
    font-size: 1.25rem !important;
    padding: 0rem 1rem !important;
    --bs-btn-border-width: 0px !important;
}


</style>
