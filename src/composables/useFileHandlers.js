import { useDrillStore } from "@/stores/drillStore";

const inchesToMm = (inches) => Math.round(inches * 25.4 * 100) / 100;

export function useFileHandlers() {
  const drillStore = useDrillStore();

  function parseDrillFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      drillStore.clearDrillFile();
      drillStore.setDrillFile(text, file.name);
  
      const parsedDrills = [];
      const toolSizes = {};
      let currentTool = null;
      let unitMode = "inch"; // default unless detected otherwise
  
      const lines = text.split("\n");
      for (let line of lines) {
        line = line.trim();
        if (line.includes("METRIC")) unitMode = "mm";
        if (line.includes("INCH")) unitMode = "inch";
        if (line.startsWith(";") || line.startsWith("M48") || line.startsWith("M30")) continue;
  
        const toolMatch = line.match(/^T(\d+)C([\d.]+)/);
        if (toolMatch) {
          const toolId = `T${toolMatch[1]}`;
          const rawSize = parseFloat(toolMatch[2]);
          toolSizes[toolId] = unitMode === "inch" ? inchesToMm(rawSize) : rawSize;
          continue;
        }
  
        const toolChangeMatch = line.match(/^T(\d+)$/);
        if (toolChangeMatch) {
          currentTool = `T${toolChangeMatch[1]}`;
          continue;
        }
  
        const coordMatch = line.match(/X([-+]?\d*\.?\d+)Y([-+]?\d*\.?\d+)/);
        if (coordMatch) {
          let x = parseFloat(coordMatch[1]);
          let y = parseFloat(coordMatch[2]);
          if (unitMode === "inch") {
            x = inchesToMm(x);
            y = inchesToMm(y);
          }
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
  }
  

  function parseProjectFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const project = JSON.parse(e.target.result);

      drillStore.drillFilename = project.drillFilename || "imported.drl";
      drillStore.drillData = project.drillData || [];
      drillStore.path = project.path || [];
      drillStore.originOffsetX = project.originOffsetX || 0;
      drillStore.originOffsetY = project.originOffsetY || 0;
      drillStore.toolSizes = project.toolSizes || {};
      drillStore.pcbThickness = project.pcbThickness || 1.6;
      drillStore.mountHeight = project.mountHeight || 28.8;
      drillStore.feedPrime = project.feedPrime || 1.0;
      drillStore.feedRetract = project.feedRetract || 0.5;

      drillStore.updatePathIndices();
      drillStore.triggerCanvasUpdate();
    };
    reader.readAsText(file);
  }

  function saveProject() {
    const baseName = drillStore.drillFilename?.replace(/\.[^/.]+$/, "") || "solder-project";
    const project = {
      drillFilename: drillStore.drillFilename,
      drillData: drillStore.drillData,
      path: drillStore.path,
      originOffsetX: drillStore.originOffsetX,
      originOffsetY: drillStore.originOffsetY,
      toolSizes: drillStore.toolSizes,
      pcbThickness: drillStore.pcbThickness,
      mountHeight: drillStore.mountHeight,
      feedPrime: drillStore.feedPrime,
      feedRetract: drillStore.feedRetract,
    };

    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.soldersidekick.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    parseDrillFile,
    parseProjectFile,
    saveProject,
  };
}
