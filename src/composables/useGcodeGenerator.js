import { useDrillStore } from "@/stores/drillStore";

export function useGcodeGenerator() {
  const drillStore = useDrillStore();

  function generateGcode() {
    const profile = drillStore.profiles[drillStore.currentProfile];

     // Validate origin values
    if (profile.zeroX === null || profile.zeroY === null || profile.zeroZ === null) {
      throw new Error("Origin X, Y, and Z values must be set");
    }

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
      // Pre-calculate integer values
      const pointNumber = index + 1;
      const progressPercent = Math.round((index / solderPoints.length) * 100);
      
      const pointVars = {
        INDEX: index,
        TOTAL_POINTS: solderPoints.length,
        X: point.transformedX,
        Y: point.transformedY,
        APPROACH: point.solderOffset,
        POINT_OFFSET_X: profile.pointOffsetX ?? 0,
        SOAK: point.soak,
        FEED: point.feed,
        DWELL: point.dwell,
        PRIME: profile.feedPrime,
        PRIME_RETRACT: profile.feedRetract,
        RETRACT: profile.retractAfterSolder,
        SOLDER_SAFE_Z: profile.solderSafeZ,
        // Add pre-calculated values
        POINT_NUMBER: pointNumber,
        PROGRESS_PERCENT: progressPercent,
      };
      
      gcode += processTemplate(profile.perPointGcode, pointVars);
      gcode += "\n\n";
    });

    // Generate end G-code
    gcode += processTemplate(profile.endGcode, {
      END_SAFE_Z: profile.endSafeZ,
      BEEP: profile.playBeep ? 200 : 0,
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
    
    // First pass: Replace specific patterns with pre-calculated values
    processed = processed.replace(/\{INDEX\s*\+\s*1\}/g, '{POINT_NUMBER}');
    processed = processed.replace(/\{INDEX\s*\/\s*TOTAL_POINTS\s*\*\s*100\}/g, '{PROGRESS_PERCENT}');
    
    // Second pass: Replace all variables and expressions
    processed = processed.replace(/\{([^}]+)\}/g, (match, expression) => {
      const trimmed = expression.trim();
      
      // Check if it's a simple variable
      if (variables.hasOwnProperty(trimmed)) {
        const value = variables[trimmed];
        if (typeof value === 'number') {
          // Integer variables - no decimals
          if (['INDEX', 'TOTAL_POINTS', 'MULTIPLIER', 'BEEP', 'POINT_NUMBER', 'PROGRESS_PERCENT'].includes(trimmed)) {
            return value.toString();
          }
          // Float variables - 2 decimal places
          return value.toFixed(2);
        }
        return value.toString();
      }
      
      // It's an expression - evaluate it
      try {
        const func = new Function(...Object.keys(variables), `return ${expression}`);
        const result = func(...Object.values(variables));
        
        if (typeof result === 'number') {
          // Default: use 2 decimal places for expressions
          return result.toFixed(2);
        }
        
        return result.toString();
      } catch (e) {
        console.error(`Failed to evaluate expression: "${expression}"`, e);
        return match; // Return original if evaluation fails
      }
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