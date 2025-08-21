import { useDrillStore } from "@/stores/store";



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
      let isEasyEDA = false;
      let easyEDAFormat = null; // Will store format like "3:3" for decimal placement
      let lastX = null;
      let lastY = null;
  
      // Detect format
      for (const line of lines) {
        if (line.includes("METRIC")) unitMode = "mm";
        if (line.includes("INCH")) unitMode = "inch";
        if (line.includes("M72")) isEagle = true;
        if (line.startsWith("METRIC,LZ")) {
          // Check if it's EasyEDA by looking for their specific comment
          isEasyEDA = lines.some(l => l.includes("EasyEDA"));
          if (!isEasyEDA) {
            isAltium = true;
          }
        }
        // Parse EasyEDA file format (e.g., ;FILE_FORMAT=3:3)
        if (line.includes("FILE_FORMAT=")) {
          const formatMatch = line.match(/FILE_FORMAT=(\d+):(\d+)/);
          if (formatMatch) {
            easyEDAFormat = {
              beforeDecimal: parseInt(formatMatch[1]),
              afterDecimal: parseInt(formatMatch[2])
            };
          }
        }
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
          } else if (isEasyEDA) {
            // EasyEDA uses FILE_FORMAT to specify decimal placement
            if (easyEDAFormat) {
              // Apply decimal placement based on FILE_FORMAT (e.g., 3:3 means 3 digits before, 3 after decimal)
              const divisor = Math.pow(10, easyEDAFormat.afterDecimal);
              x = x / divisor;
              y = y / divisor;
            } else {
              // Fallback: assume coordinates are in mils if no format specified
              x = inchesToMm(x / 1000);
              y = inchesToMm(y / 1000);
            }
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
        isEasyEDA,
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
    drillStore.rotation = project.rotation || 0;
    drillStore.toolSizes = project.toolSizes || {};
    drillStore.pcbThickness = project.pcbThickness || 1.6;
    drillStore.mountHeight = project.mountHeight || 28.8;
    drillStore.feedPrime = project.feedPrime || 1.0;
    drillStore.feedRetract = project.feedRetract || 0.5;
    drillStore.defaultSolderAllPoints = project.defaultSolderAllPoints ?? false;

    // Handle both old format (single profileSettings) and new format (all profiles)
    if (project.profiles) {
      // New format: use the new method to load profiles from project
      drillStore.loadProfilesFromProject(project.profiles, project.currentProfile);
    } else if (project.currentProfile && project.profileSettings) {
      // Old format: convert to new format
      const profiles = {
        [project.currentProfile]: project.profileSettings
      };
      drillStore.loadProfilesFromProject(profiles, project.currentProfile);
    } else {
      // No profile data in project, just ensure profiles are initialized
      drillStore.initProfiles();
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
    rotation: drillStore.rotation,
    toolSizes: drillStore.toolSizes,
    pcbThickness: drillStore.pcbThickness,
    mountHeight: drillStore.mountHeight,
    feedPrime: drillStore.feedPrime,
    feedRetract: drillStore.feedRetract,
    defaultSolderAllPoints: drillStore.defaultSolderAllPoints,
    currentProfile: drillStore.currentProfile,
    // Save ALL profiles, not just the current one
    profiles: drillStore.profiles,
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
