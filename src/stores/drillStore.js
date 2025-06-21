import { defineStore } from "pinia";


const startGcodeTemplate = `; Start G-code
M117 Homing XYZ
G28 X Y ; Home X and Y
G28 Z ; Home Z
G0 Z{START_SAFE_Z} F600 ; Initial lift height

M117 Moving to 0,0,0
G0 X{ORIGIN_X} Y{ORIGIN_Y} F600 ; Move to start position X and Y (1,3.3)
G0 Z{ORIGIN_Z + PCB_THICKNESS} F600 ; Move to start position Z + PCB Thickness (0.3)
G92 X0 Y0 Z0 ; Set current position as 0,0,0

M221 S{MULTIPLIER} ; Extruder multiplier
M302 S0 ; Allow cold extrusion
M83 ; Set extruder to relative mode
`;


const perPointTemplate = `; Solder Point G-code
M117 Soldering {INDEX + 1}/{TOTAL_POINTS}
M73 P{INDEX / TOTAL_POINTS * 100} ; Set progress bar %
G0 X{X + APPROACH} Y{Y} F6000 ; Move to point with approach offset
G1 Z3 F600; ; Get near the point
G1 E{PRIME} F300 ; Prime soldering iron with a small amount of solder
G1 E-{PRIME_RETRACT} F600 ; Retract solder from touching soldering iron
G1 Z0.5 F600; Move to PCB height
G1 X{X + POINT_OFFSET_X} F600 ; Move to solder point
G4 S{SOAK} ; Soak time
G1 E{FEED} F300 ; Solder the point
G1 E-{RETRACT} F600 ; Retract solder from touching soldering iron
G4 S{DWELL} ; Dwell time
G1 Z{SOLDER_SAFE_Z} F600 ; Lift soldering iron`;

const endGcodeTemplate = `; End G-code
M117 Solder Sidekick Done!
M73 P100 ; Set progress bar to 100%
G0 Z{END_SAFE_Z} F600 ; Lift soldering iron

M300 S440 P{BEEP} ; Beep
G4 P500 ; Wait for 0.5 seconds
M300 S440 P{BEEP} ; Beep
G4 P500 ; Wait for 0.5 seconds
M300 S440 P{BEEP} ; Beep
`;


export const useDrillStore = defineStore("drill", {
  state: () => ({
     // --- Core drill data ---
    drillData: [],
    path: [],
    toolSizes: {},
    undoStack: [],
    redoStack: [],
    canvasShouldUpdate: false,
    drillFilename: "",
    
    // --- Transform & tooling settings ---
    originOffsetX: 16,
    originOffsetY: 16,
    pcbThickness: 1.6,
    mountHeight: 28.8,
    feedPrime: 1.0,
    feedRetract: 0.5,
    rotation: 0,
    defaultSolderFeed: 3.0,
    defaultSoakTime: 1.5,
    defaultDwellTime: 1.5,
    defaultApproachDistance: 0.8,
    defaultSolderAllPoints: false,

    // --- Profile management ---
    defaultProfileSettings: {
      zeroX: 20,
      zeroY: 25,
      zeroZ: 1,
      startSafeZ: 12,
      solderSafeZ: 12,
      endSafeZ: 12,
      solderFeedMultiplier: 105,
      feedPrime: 1.0,
      feedRetract: 1.0,
      retractAfterSolder: 10,
      bedForwardY: 235,
      playBeep: true,
      startGcode: startGcodeTemplate,
      perPointGcode: perPointTemplate,
      endGcode: endGcodeTemplate,
    },
    profiles: {
      "Custom 1": {},
      "Custom 2": {},
      "Custom 3": {},
      "Custom 4": {},
      "Custom 5": {},
    },
    currentProfile: "Custom 1",
  }),
  getters: {
    selectedPoints: (state) => state.drillData.filter(d => d.selected),
  },
  actions: {

    initProfiles() {
      const stored = localStorage.getItem("solderProfiles");
      if (stored) {
        this.profiles = JSON.parse(stored);
      }

      // Fill in any missing keys in each profile from defaults
      for (let key in this.profiles) {
        this.profiles[key] = {
          ...this.defaultProfileSettings,
          ...this.profiles[key],
        };
      }

      // If profile data was missing, set it up
      if (!stored) {
        for (let key in this.profiles) {
          this.profiles[key] = { ...this.defaultProfileSettings };
        }
        this.saveProfilesToStorage();
      }

      // Always load the current profile
      this.loadSettingsFromProfile(this.currentProfile);
    },


    saveProfilesToStorage() {
      localStorage.setItem("solderProfiles", JSON.stringify(this.profiles));
    },

    setCurrentProfile(name) {
      this.currentProfile = name;
      this.loadSettingsFromProfile(name);
    },

    loadSettingsFromProfile(name) {
      const settings = this.profiles[name];
      if (!settings) return;
      Object.assign(this, settings);
    },

    updateCurrentProfileSettings(newSettings) {
      this.profiles[this.currentProfile] = { ...newSettings };
      this.saveProfilesToStorage();
    },

    resetCurrentProfileToDefault() {
      this.profiles[this.currentProfile] = { ...this.defaultProfileSettings };
      this.loadSettingsFromProfile(this.currentProfile);
      this.saveProfilesToStorage();
    },

    addUndoSnapshot(snapshot) {
      if (this.undoStack.length >= 50) {
        this.undoStack.shift(); // Drop oldest
      }
      this.undoStack.push(snapshot);
    },    
    
    setDrillFile(fileContent, filename) {
      this.drillFile = fileContent;
      this.drillFilename = filename;
    },
    clearDrillFile() {
      this.drillFile = null;
      this.drillFilename = null;
      this.drillData = [];
      this.path = [];
      this.toolSizes = {};
      this.undoStack = [];
      this.originOffsetX = 16;
      this.originOffsetY = 16;
      this.rotation = 0;
    },

    triggerCanvasUpdate() {
      this.canvasShouldUpdate = true;
    },
    acknowledgeCanvasUpdate() {
      this.canvasShouldUpdate = false;
    },
    setDrillData(data, toolSizes = {}) {
      this.drillData = data.map((d, i) => ({
        ...d,
        id: i,
        solder: this.defaultSolderAllPoints,
        selected: false,
        pathIndex: null,
        feed: this.defaultSolderFeed,
        soak: this.defaultSoakTime,
        dwell: this.defaultDwellTime,
        solderOffset: this.defaultApproachDistance
      }));
      
      this.path = [];
      this.toolSizes = toolSizes;
    },
    
    toggleSelection(id) {
      const drill = this.drillData.find(d => d.id === id);
      if (drill) drill.selected = !drill.selected;
    },
    addToPath(id) {
      if (!this.path.includes(id)) {
        this.addUndoSnapshot({
          path: [...this.path],
          solderStates: this.drillData.map(d => ({ id: d.id, solder: d.solder }))
        });
        
        
        this.redoStack = [];
        this.path.push(id);
        this.updatePathIndices();
      }
    },
    
    removeFromPath(id) {
      if (this.path.includes(id)) {
        this.addUndoSnapshot({
          path: [...this.path],
          solderStates: this.drillData.map(d => ({ id: d.id, solder: d.solder }))
        });
        
        this.path = this.path.filter(p => p !== id);
        this.updatePathIndices();
      }
    },
    clearPath() {
      this.addUndoSnapshot({
        path: [...this.path],
        solderStates: this.drillData.map(d => ({ id: d.id, solder: d.solder }))
      });
      
      this.path = [];
      this.updatePathIndices();
    },

    undoLast() {
      if (this.undoStack.length > 0) {
        const current = {
          path: [...this.path],
          solderStates: this.drillData.map(d => ({ id: d.id, solder: d.solder })),
          transform: {
            originOffsetX: this.originOffsetX,
            originOffsetY: this.originOffsetY,
            rotation: this.rotation,
            pcbThickness: this.pcbThickness
          },
          drillDataSnapshot: this.drillData.map(d => ({ ...d }))
        };
        this.redoStack.push(current);
    
        const previous = this.undoStack.pop();
    
        if (previous.transform) {
          this.restoreTransformState(previous);
        }
    
        if (previous.path) {
          this.path = previous.path;
        }
    
        if (previous.solderStates) {
          previous.solderStates.forEach(({ id, solder }) => {
            const d = this.drillData.find(p => p.id === id);
            if (d) d.solder = solder;
          });
        }
    
        if (previous.drillDataSnapshot) {
          this.drillData = previous.drillDataSnapshot.map(d => ({ ...d }));
        }
    
        this.updatePathIndices();
      }
    },
    

    redoLast() {
      if (this.redoStack.length > 0) {
        const current = {
          path: [...this.path],
          solderStates: this.drillData.map(d => ({ id: d.id, solder: d.solder })),
          transform: {
            originOffsetX: this.originOffsetX,
            originOffsetY: this.originOffsetY,
            rotation: this.rotation,
            pcbThickness: this.pcbThickness
          },
          drillDataSnapshot: this.drillData.map(d => ({ ...d }))
        };
        this.undoStack.push(current);
    
        const next = this.redoStack.pop();
    
        if (next.transform) {
          this.restoreTransformState(next);
        }
    
        if (next.path) {
          this.path = next.path;
        }
    
        if (next.solderStates) {
          next.solderStates.forEach(({ id, solder }) => {
            const d = this.drillData.find(p => p.id === id);
            if (d) d.solder = solder;
          });
        }
    
        if (next.drillDataSnapshot) {
          this.drillData = next.drillDataSnapshot.map(d => ({ ...d }));
        }
    
        this.updatePathIndices();
      }
    },
    
    

    saveTransformUndoState() {
      this.addUndoSnapshot({
        transform: {
          originOffsetX: this.originOffsetX,
          originOffsetY: this.originOffsetY,
          rotation: this.rotation,
          pcbThickness: this.pcbThickness
        },
        drillDataSnapshot: this.drillData.map(d => ({ ...d }))
      });
      this.redoStack = [];
    },
    
    
    restoreTransformState(state) {
      if (state.transform) {
        this.originOffsetX = state.transform.originOffsetX;
        this.originOffsetY = state.transform.originOffsetY;
        this.rotation = state.transform.rotation;
        if (typeof state.transform.pcbThickness === 'number') {
          this.pcbThickness = state.transform.pcbThickness;
        }
      }
      
      if (state.drillDataSnapshot) {
        this.drillData = state.drillDataSnapshot.map(d => ({ ...d }));
      }
    },
    
    
    
    
    updatePathIndices() {
      this.drillData.forEach(d => d.pathIndex = null);
      this.path.forEach((id, i) => {
        const d = this.drillData.find(drill => drill.id === id);
        if (d) d.pathIndex = i;
      });
    },
    autoOptimizePath() {
      const unsorted = this.drillData.filter(d => d.solder);
      const path = [];
      const visited = new Set();
      let current = unsorted[0];
      path.push(current.id);
      visited.add(current.id);

      while (path.length < unsorted.length) {
        const next = unsorted
          .filter(d => !visited.has(d.id))
          .sort((a, b) => {
            const distA = Math.hypot(current.x - a.x, current.y - a.y);
            const distB = Math.hypot(current.x - b.x, current.y - b.y);
            return distA - distB;
          })[0];

        if (next) {
          path.push(next.id);
          visited.add(next.id);
          current = next;
        } else {
          break;
        }
      }

      this.addUndoSnapshot({
        path: [...this.path],
        solderStates: this.drillData.map(d => ({ id: d.id, solder: d.solder }))
      });
      
      this.path = path;
      this.updatePathIndices();
    },
    optimizeSelection() {
      const selected = this.drillData.filter(d => d.selected);
      if (selected.length < 2) return;
    
      // Capture a single undo snapshot BEFORE modifying solder/path
      this.addUndoSnapshot({
        path: [...this.path],
        solderStates: this.drillData.map(d => ({ id: d.id, solder: d.solder }))
      });
      this.redoStack = [];
    
      // Mark selected points as soldered
      selected.forEach(d => {
        d.solder = true;
      });
    
      // Nearest-neighbor order
      const newOrder = [];
      const visited = new Set();
      let current = selected[0];
      newOrder.push(current.id);
      visited.add(current.id);
    
      while (newOrder.length < selected.length) {
        const next = selected
          .filter(d => !visited.has(d.id))
          .sort((a, b) => {
            const distA = Math.hypot(current.x - a.x, current.y - a.y);
            const distB = Math.hypot(current.x - b.x, current.y - b.y);
            return distA - distB;
          })[0];
    
        if (next) {
          newOrder.push(next.id);
          visited.add(next.id);
          current = next;
        } else {
          break;
        }
      }
    
      // Remove selected points from current path
      const idsToReplace = new Set(selected.map(d => d.id));
      this.path = this.path.filter(id => !idsToReplace.has(id));
    
      // Insert new optimized path for selected
      this.path.push(...newOrder);
      this.updatePathIndices();
    }
    
  }
});
