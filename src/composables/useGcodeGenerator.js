import { useDrillStore } from "@/stores/drillStore";

export function useGcodeGenerator() {
  const drillStore = useDrillStore();

  function generateGcode() {
    const profile = drillStore.profiles[drillStore.currentProfile];
    const solderPoints = getSolderPoints();
    
    if (solderPoints.length === 0) {
      throw new Error("No solder points selected");
    }

    let gcode = "";
    
    // Generate start G-code
    gcode += processTemplate(profile.startGcode, {
      START_SAFE_Z: profile.startSafeZ,
      ORIGIN_X: profile.zeroX,
      ORIGIN_Y: profile.zeroY,
      ORIGIN_Z: profile.zeroZ,
      PCB_THICKNESS: profile.pcbThickness,
      MULTIPLIER: profile.solderFeedMultiplier,
    });
    gcode += "\n\n";

    // Generate per-point G-code
    solderPoints.forEach((point, index) => {
      const pointVars = {
        INDEX: index,
        TOTAL_POINTS: solderPoints.length,
        X: point.transformedX.toFixed(2),
        Y: point.transformedY.toFixed(2),
        APPROACH: point.solderOffset,
        POINT_OFFSET_X: profile.pointOffsetX ?? 0, // Additional X offset at solder point
        SOAK: point.soak,
        FEED: point.feed,
        DWELL: point.dwell,
        PRIME: profile.feedPrime,
        PRIME_RETRACT: profile.feedRetract,
        RETRACT: profile.retractAfterSolder,
        SOLDER_SAFE_Z: profile.solderSafeZ,
      };
      
      gcode += processTemplate(profile.perPointGcode, pointVars);
      gcode += "\n\n";
    });

    // Generate end G-code
    gcode += processTemplate(profile.endGcode, {
      END_SAFE_Z: profile.endSafeZ,
      BEEP: profile.playBeep ? 200 : 0, // 200ms beep duration if enabled
    });

    return gcode;
  }

  function getSolderPoints() {
    // Get points in path order that have solder enabled
    const points = [];
    const angle = (drillStore.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (const id of drillStore.path) {
      const drill = drillStore.drillData.find(d => d.id === id);
      if (drill && drill.solder) {
        // Apply rotation and offset transformations
        const rotatedX = drill.x * cos - drill.y * sin;
        const rotatedY = drill.x * sin + drill.y * cos;
        
        points.push({
          ...drill,
          transformedX: rotatedX + drillStore.originOffsetX,
          transformedY: rotatedY + drillStore.originOffsetY,
        });
      }
    }
    
    return points;
  }

  function processTemplate(template, variables) {
    let processed = template;
    
    // Replace all variables in the template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processed = processed.replace(regex, value);
    }
    
    // Handle expressions (e.g., {ORIGIN_Z + PCB_THICKNESS})
    processed = processed.replace(/\{([^}]+)\}/g, (match, expression) => {
      try {
        const func = new Function(...Object.keys(variables), `return ${expression}`);
        const result = func(...Object.values(variables));
        if (typeof result === 'number') {
          return Number.isInteger(result) ? result.toString() : result.toFixed(2);
        }
        return result;
      } catch (e) {
        console.warn(`Failed to evaluate expression: ${expression}`, e);
        return match;
      }
    });

    
    // Handle progress percentage calculation
    processed = processed.replace(/\{INDEX \/ TOTAL_POINTS \* 100\}/g, () => {
      const index = variables.INDEX || 0;
      const total = variables.TOTAL_POINTS || 1;
      const percentage = Math.round((Math.floor(index) / total));
      return `${percentage}`;
    });
    
    return processed;
  }

  function saveGcodeFile(gcode) {
    const baseName = drillStore.drillFilename?.replace(/\.[^/.]+$/, "") || "solder-gcode";
    const blob = new Blob([gcode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.gcode`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    generateGcode,
    saveGcodeFile,
  };
}