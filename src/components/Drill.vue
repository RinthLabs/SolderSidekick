<template>
    <div class="container mt-4">
      <h2 class="text-primary">Upload KiCad Drill File</h2>
      
      <div class="mb-3">
        <input type="file" class="form-control" @change="parseDrillFile" ref="fileInput" accept=".drl, .txt" />
        <p v-if="drillStore.drillFilename" class="mt-2">
          <strong>Selected File:</strong> {{ drillStore.drillFilename }}
          <button class="btn btn-sm btn-danger ms-2" @click="clearFile">Clear</button>
        </p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import { useDrillStore } from "@/stores/drillStore";  // Import Pinia store
  
  const drillStore = useDrillStore();
  const fileInput = ref(null);
  
  const parseDrillFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      
      // Store file content + filename in Pinia
      drillStore.setDrillFile(text, file.name);
  
      let parsedDrills = [];
      const lines = text.split("\n");
      let currentTool = null;
  
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith(";") || line.startsWith("M48") || line.startsWith("M30")) continue;
  
        const toolMatch = line.match(/^T(\d+)C([\d.]+)/);
        if (toolMatch) {
          currentTool = { id: `T${toolMatch[1]}`, size: parseFloat(toolMatch[2]) * 25.4 };
          continue;
        }
  
        const toolChangeMatch = line.match(/^T(\d+)$/);
        if (toolChangeMatch) {
          currentTool = { id: `T${toolChangeMatch[1]}` };
          continue;
        }
  
        const coordMatch = line.match(/X([-+]?\d*\.?\d+)Y([-+]?\d*\.?\d+)/);
        if (coordMatch) {
          const x = parseFloat(coordMatch[1]) * 25.4;
          const y = parseFloat(coordMatch[2]) * 25.4;
  
          parsedDrills.push({
            tool: currentTool?.id || "Unknown",
            size: currentTool?.size || null,
            x: x.toFixed(2),
            y: y.toFixed(2),
          });
        }
      }
  
      drillStore.setDrillData(parsedDrills);
    };
  
    reader.readAsText(file);
  };
  
  // Function to clear the stored file & reset input
  const clearFile = () => {
    drillStore.clearDrillFile();
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
  