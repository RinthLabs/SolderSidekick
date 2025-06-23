import { useDrillStore } from "@/stores/drillStore";



export function useFileHandlers() {
  const drillStore = useDrillStore();

  function parseDrillFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      drillStore.clearDrillFile();
      drillStore.setDrillFile(text, file.name);
  
      const lines = text.split("\n").map(line => line.trim()).filter(l => l.length);
      let unitMode = "inch";
      let isEagle = false;
      let isAltium = false;
      let lastX = null;
      let lastY = null;
  
      // Detect format
      for (const line of lines) {
        if (line.includes("METRIC")) unitMode = "mm";
        if (line.includes("INCH")) unitMode = "inch";
        if (line.includes("M72")) isEagle = true;
        if (line.startsWith("METRIC,LZ")) isAltium = true;
      }
  
      const parsedDrills = [];
      const toolSizes = {};
      let currentTool = null;
  
      // === Tool definitions ===
      for (const line of lines) {
        const toolMatch = line.match(/^T(\d+)[FS0-9]*C([\d.]+)/);
        if (toolMatch) {
          const toolId = `T${toolMatch[1]}`;
          const size = parseFloat(toolMatch[2]);
          toolSizes[toolId] = unitMode === "inch" ? inchesToMm(size) : size;
        }
      }
  
      // === Parse coordinate lines ===
      for (const line of lines) {
        if (line.startsWith("T") && !line.includes("C")) {
          currentTool = line.trim();
          continue;
        }
  
        const matchFull = line.match(/X([-+]?\d*\.?\d+)Y([-+]?\d*\.?\d+)/);
        const matchXOnly = line.match(/X([-+]?\d*\.?\d+)$/);
        const matchYOnly = line.match(/Y([-+]?\d*\.?\d+)$/);
  
        let x = null;
        let y = null;
  
        if (matchFull) {
          x = parseFloat(matchFull[1]);
          y = parseFloat(matchFull[2]);
        } else if (matchXOnly) {
          x = parseFloat(matchXOnly[1]);
          y = lastY;
        } else if (matchYOnly) {
          x = lastX;
          y = parseFloat(matchYOnly[1]);
        }
  
        if (x !== null && y !== null) {
          lastX = x;
          lastY = y;
        
          if (isEagle) {
            // Eagle uses implied decimals and is in inches
            x = inchesToMm(x / 10000);
            y = inchesToMm(y / 10000);
          } else if (isAltium) {
            // Altium's METRIC,LZ format uses explicit values in mm, no scaling needed
            // Use x and y as-is
            x = (x / 100);
            y = (y / 100);
          } else if (unitMode === "inch") {
            // KiCad uses actual decimals
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

      console.log("Format detected:", {
        isEagle,
        isAltium,
        unitMode,
        file: file.name
      });
      
  
      drillStore.setDrillData(parsedDrills, toolSizes);
      drillStore.triggerCanvasUpdate();
    };
  
    reader.readAsText(file);
  }
  
  
  function inchesToMm(inches) {
    return Math.round(inches * 25.4 * 1000) / 1000;
  }

  function inchesToMm2(inches) {
    return Math.round(inches * 25.4 * 100) / 100;
  }

  // const inchesToMm2 = (inches) => Math.round(inches * 25.4 * 100) / 100;
  
  

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
      drillStore.defaultSolderAllPoints = project.defaultSolderAllPoints ?? false;

      if (project.currentProfile && project.profileSettings) {
        // Ensure pcbThickness is included in profile settings
        if (project.profileSettings.pcbThickness === undefined && project.pcbThickness) {
          project.profileSettings.pcbThickness = project.pcbThickness;
        }
        drillStore.profiles[project.currentProfile] = project.profileSettings;
        drillStore.setCurrentProfile(project.currentProfile);
      }

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
      defaultSolderAllPoints: drillStore.defaultSolderAllPoints,
      currentProfile: drillStore.currentProfile,
      profileSettings: drillStore.profiles[drillStore.currentProfile],

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
