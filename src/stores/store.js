import { defineStore } from "pinia";


const startGcodeTemplate = `; Start G-code
M117 Homing XYZ
G28 X Y ; Home X and Y
G28 Z ; Home Z
G0 Z{START_SAFE_Z} F800 ; Initial lift height

M117 Moving to 0,0,0
G0 X{ORIGIN_X} Y{ORIGIN_Y} F6000 ; Move to start position X and Y
G0 Z{ORIGIN_Z + PCB_THICKNESS} F800 ; Move to start position Z + PCB Thickness
G92 X0 Y0 Z0 ; Set current position as 0,0,0

M221 S{MULTIPLIER} ; Extruder multiplier
M302 S0 ; Allow cold extrusion
M83 ; Set extruder to relative mode

G0 X0 Y0 Z{START_SAFE_Z} F800 ; Initial lift height
`;


const perPointTemplate = `; Solder Point G-code
M117 Soldering {INDEX + 1}/{TOTAL_POINTS}
M73 P{INDEX / TOTAL_POINTS * 100} ; Set progress bar %
G0 X{X + X_OFFSET + SOLDER_OFFSET} Y{Y + Y_OFFSET} F6000 ; Move slightly to the right of the point
G1 Z{Z_OFFSET + SOLDER_PRIME_Z} F800; ; Get near the point
G1 E{PRIME} F600 ; Prime soldering iron with a small amount of solder
G1 E-{PRIME_RETRACT} F800 ; Retract solder from touching soldering iron
G1 Z{Z_OFFSET} F800; Move to PCB height
G1 X{X + X_OFFSET} F800 ; Move to solder point
G4 P{SOAK * 1000} ; Soak time (ms)
G1 E{FEED} F500 ; Solder the point
G1 E-{RETRACT} F800 ; Retract solder from touching soldering iron
G4 P{DWELL * 1000} ; Dwell time (ms)
G1 Z{SOLDER_SAFE_Z} F800 ; Lift soldering iron`;

const endGcodeTemplate = `; End G-code
M117 Solder Sidekick Done!
M73 P100 ; Set progress bar to 100%
G0 Z{END_SAFE_Z} F800 ; Lift soldering iron

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
    feedPrime: 2.75,
    feedRetract: 0.25,
    rotation: 0,
    defaultSoakTime: 4.0,
    defaultSolderFeed: 5.0,
    defaultDwellTime: 1.5,
    defaultSolderOffset: 0.25,
    defaultXOffset: 0.0,
    defaultYOffset: 0.0,
    defaultZOffset: 0.0,
    defaultSolderAllPoints: false,
    viaFilterDiameter: 0.4, // Filter out drill holes smaller than this diameter (mm)
    noGoZones: [], // Array of { id, x1, y1, x2, y2 } in bed coordinate space

    // --- Profile management ---
    defaultProfileSettings: {
      zeroX: null,
      zeroY: null,
      zeroZ: null,
      pcbThickness: 1.6,
      startSafeZ: 12,
      solderSafeZ: 3.5,
      solderPrimeZ: 3.5,
      endSafeZ: 12,
      solderFeedMultiplier: 104,
      feedPrime: 2.0,
      feedRetract: 0.25,
      retractAfterSolder: 0.5,
      playBeep: true,
      solderOffset: 0.25,
      pointOffsetX: 0.0, // Additional X offset at each solder point
      pointOffsetY: 0.0, // Additional Y offset at each solder point
      pointOffsetZ: 0.0, // Additional Z offset at each solder point
      bedWidth: 235, // Bed width in mm (default Ender-3)
      bedHeight: 235, // Bed height in mm (default Ender-3)
      startGcode: startGcodeTemplate,
      perPointGcode: perPointTemplate,
      endGcode: endGcodeTemplate,
    },
    profiles: {},  // Changed from fixed object to empty object
    currentProfile: "Default",  // Changed from "Custom 1" to "Default"
  }),
  getters: {
    selectedPoints: (state) => state.drillData.filter(d => d.selected),
    currentPcbThickness: (state) => {
      return state.profiles[state.currentProfile]?.pcbThickness ?? state.pcbThickness;
    },
    currentBedWidth: (state) => {
      return state.profiles[state.currentProfile]?.bedWidth ?? 235;
    },
    currentBedHeight: (state) => {
      return state.profiles[state.currentProfile]?.bedHeight ?? 235;
    },
  },
  actions: {

   initProfiles() {
      const stored = localStorage.getItem("solderProfiles");
      const storedCurrentProfile = localStorage.getItem("solderCurrentProfile");
      
      if (stored) {
        this.profiles = JSON.parse(stored);
      }

      // If no profiles exist, create a default one
      if (Object.keys(this.profiles).length === 0) {
        this.profiles["Default"] = { ...this.defaultProfileSettings };
        this.saveProfilesToStorage();
      }

      // Fill in any missing keys in each profile from defaults
      for (let key in this.profiles) {
        this.profiles[key] = {
          ...this.defaultProfileSettings,
          ...this.profiles[key],
        };
      }

      // Load saved current profile or use first available
      if (storedCurrentProfile && this.profiles[storedCurrentProfile]) {
        this.currentProfile = storedCurrentProfile;
      } else if (!this.profiles[this.currentProfile]) {
        this.currentProfile = Object.keys(this.profiles)[0] || "Default";
      }

      // Always load the current profile
      this.loadSettingsFromProfile(this.currentProfile);
    },

    createProfile(name) {
      if (!name || name.trim().length === 0) {
        throw new Error("Profile name must be at least 1 character");
      }
      
      if (this.profiles[name]) {
        throw new Error("Profile already exists");
      }

      // Copy current profile settings to new profile
      this.profiles[name] = { ...this.profiles[this.currentProfile] };
      this.saveProfilesToStorage();
      return name;
    },

    deleteProfile(name) {
      if (Object.keys(this.profiles).length <= 1) {
        throw new Error("Cannot delete the last profile");
      }

      delete this.profiles[name];
      
      // If we deleted the current profile, switch to another
      if (this.currentProfile === name) {
        this.currentProfile = Object.keys(this.profiles)[0];
        this.loadSettingsFromProfile(this.currentProfile);
        this.saveCurrentProfileToStorage(); // Save new selection
      }
      
      this.saveProfilesToStorage();
    },

    renameProfile(oldName, newName) {
      if (!newName || newName.trim().length === 0) {
        throw new Error("Profile name must be at least 1 character");
      }
      
      if (oldName === newName) return;
      
      if (this.profiles[newName]) {
        throw new Error("Profile already exists");
      }

      this.profiles[newName] = this.profiles[oldName];
      delete this.profiles[oldName];
      
      if (this.currentProfile === oldName) {
        this.currentProfile = newName;
        this.saveCurrentProfileToStorage(); // Save renamed selection
      }
      
      this.saveProfilesToStorage();
    },

    duplicateProfile(name, newName) {
      if (!newName || newName.trim().length === 0) {
        throw new Error("Profile name must be at least 1 character");
      }
      
      if (this.profiles[newName]) {
        throw new Error("Profile already exists");
      }

      this.profiles[newName] = { ...this.profiles[name] };
      this.saveProfilesToStorage();
      return newName;
    },

    saveProfilesToStorage() {
      localStorage.setItem("solderProfiles", JSON.stringify(this.profiles));
    },

    saveCurrentProfileToStorage() {
      localStorage.setItem("solderCurrentProfile", this.currentProfile);
    },

    setCurrentProfile(name) {
      this.currentProfile = name;
      this.loadSettingsFromProfile(name);
      this.saveCurrentProfileToStorage(); // Save selection
    },

    updateCurrentProfileSettings(newSettings) {
      // Merge new settings with existing profile settings
      this.profiles[this.currentProfile] = { 
        ...this.profiles[this.currentProfile], 
        ...newSettings 
      };
      this.saveProfilesToStorage();
    },

    resetCurrentProfileToDefault() {
      this.profiles[this.currentProfile] = { ...this.defaultProfileSettings };
      this.loadSettingsFromProfile(this.currentProfile);
      this.saveProfilesToStorage();
    },

     loadProfilesFromProject(profiles, currentProfile) {
      if (profiles && Object.keys(profiles).length > 0) {
        // Load profiles from project file
        this.profiles = profiles;
        
        // Fill in any missing keys in each profile from defaults
        for (let key in this.profiles) {
          this.profiles[key] = {
            ...this.defaultProfileSettings,
            ...this.profiles[key],
          };
        }
        
        // Set current profile from project or fallback to first
        if (currentProfile && this.profiles[currentProfile]) {
          this.currentProfile = currentProfile;
        } else {
          this.currentProfile = Object.keys(this.profiles)[0];
        }
        
        // Save to localStorage so they persist
        this.saveProfilesToStorage();
        this.saveCurrentProfileToStorage();
        
        // Load the current profile settings
        this.loadSettingsFromProfile(this.currentProfile);
      }
    },

    loadSettingsFromProfile(name) {
      const settings = this.profiles[name];
      if (!settings) return;
      
      // Only sync settings that exist at the store root level
      if (settings.pcbThickness !== undefined) {
        this.pcbThickness = settings.pcbThickness;
      }
      if (settings.feedPrime !== undefined) {
        this.feedPrime = settings.feedPrime;
      }
      if (settings.feedRetract !== undefined) {
        this.feedRetract = settings.feedRetract;
      }
      // Add any other settings that need to be synced to store root
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
      this.noGoZones = [];
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
        xOffset: this.defaultXOffset,
        yOffset: this.defaultYOffset,
        zOffset: this.defaultZOffset
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
    addNoGoZone(zone) {
      this.noGoZones.push({
        id: Date.now() + Math.random(),
        x1: Math.min(zone.x1, zone.x2),
        y1: Math.min(zone.y1, zone.y2),
        x2: Math.max(zone.x1, zone.x2),
        y2: Math.max(zone.y1, zone.y2),
      });
    },
    removeNoGoZone(id) {
      this.noGoZones = this.noGoZones.filter(z => z.id !== id);
    },
    clearNoGoZones() {
      this.noGoZones = [];
    },
    drillToBedSpace(drill) {
      const rad = -(this.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return {
        x: drill.x * cos - drill.y * sin + this.originOffsetX,
        y: drill.x * sin + drill.y * cos + this.originOffsetY,
      };
    },
    isPointInNoGoZone(drill) {
      if (this.noGoZones.length === 0) return false;
      const bed = this.drillToBedSpace(drill);
      return this.noGoZones.some(z =>
        bed.x >= z.x1 && bed.x <= z.x2 && bed.y >= z.y1 && bed.y <= z.y2
      );
    },
    segmentCrossesNoGoZone(ax, ay, bx, by) {
      const dx = bx - ax;
      const dy = by - ay;
      for (const z of this.noGoZones) {
        let tmin = 0, tmax = 1;
        if (dx !== 0) {
          let t1 = (z.x1 - ax) / dx;
          let t2 = (z.x2 - ax) / dx;
          if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
          tmin = Math.max(tmin, t1);
          tmax = Math.min(tmax, t2);
          if (tmin > tmax) continue;
        } else {
          if (ax < z.x1 || ax > z.x2) continue;
        }
        if (dy !== 0) {
          let t1 = (z.y1 - ay) / dy;
          let t2 = (z.y2 - ay) / dy;
          if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
          tmin = Math.max(tmin, t1);
          tmax = Math.min(tmax, t2);
          if (tmin > tmax) continue;
        } else {
          if (ay < z.y1 || ay > z.y2) continue;
        }
        return true;
      }
      return false;
    },
    getNoGoCorners(margin) {
      margin = margin ?? 0.5;
      const corners = [];
      for (const z of this.noGoZones) {
        const candidates = [
          { x: z.x1 - margin, y: z.y1 - margin },
          { x: z.x2 + margin, y: z.y1 - margin },
          { x: z.x2 + margin, y: z.y2 + margin },
          { x: z.x1 - margin, y: z.y2 + margin },
        ];
        for (const c of candidates) {
          const insideAny = this.noGoZones.some(oz =>
            c.x > oz.x1 && c.x < oz.x2 && c.y > oz.y1 && c.y < oz.y2
          );
          if (!insideAny) corners.push(c);
        }
      }
      return corners;
    },
    computeRouteAroundZones(ax, ay, bx, by) {
      if (this.noGoZones.length === 0) return [];
      if (!this.segmentCrossesNoGoZone(ax, ay, bx, by)) return [];

      const corners = this.getNoGoCorners();
      const nodes = [{ x: ax, y: ay }, ...corners, { x: bx, y: by }];
      const n = nodes.length;
      const endIdx = n - 1;

      const dist = new Array(n).fill(Infinity);
      const prev = new Array(n).fill(-1);
      const visited = new Array(n).fill(false);
      dist[0] = 0;

      for (let step = 0; step < n; step++) {
        let u = -1;
        for (let i = 0; i < n; i++) {
          if (!visited[i] && (u === -1 || dist[i] < dist[u])) u = i;
        }
        if (u === -1 || dist[u] === Infinity) break;
        if (u === endIdx) break;
        visited[u] = true;

        for (let v = 0; v < n; v++) {
          if (visited[v]) continue;
          if (this.segmentCrossesNoGoZone(nodes[u].x, nodes[u].y, nodes[v].x, nodes[v].y)) continue;
          const d = dist[u] + Math.hypot(nodes[u].x - nodes[v].x, nodes[u].y - nodes[v].y);
          if (d < dist[v]) {
            dist[v] = d;
            prev[v] = u;
          }
        }
      }

      if (dist[endIdx] === Infinity) return [];

      const route = [];
      let cur = endIdx;
      while (cur !== -1) {
        route.push(cur);
        cur = prev[cur];
      }
      route.reverse();
      return route.slice(1, -1).map(i => nodes[i]);
    },
    routedDistance(ax, ay, bx, by) {
      if (this.noGoZones.length === 0 || !this.segmentCrossesNoGoZone(ax, ay, bx, by)) {
        return Math.hypot(bx - ax, by - ay);
      }
      const waypoints = this.computeRouteAroundZones(ax, ay, bx, by);
      let d = 0;
      let cx = ax, cy = ay;
      for (const wp of waypoints) {
        d += Math.hypot(wp.x - cx, wp.y - cy);
        cx = wp.x; cy = wp.y;
      }
      d += Math.hypot(bx - cx, by - cy);
      return d;
    },

    _nearestNeighborWithZoneAvoidance(points) {
      if (points.length === 0) return [];
      const hasZones = this.noGoZones.length > 0;

      const bedCoords = new Map();
      if (hasZones) {
        for (const d of points) {
          bedCoords.set(d.id, this.drillToBedSpace(d));
        }
      }

      const path = [];
      const visited = new Set();
      let current = points[0];
      path.push(current.id);
      visited.add(current.id);

      while (path.length < points.length) {
        const remaining = points.filter(d => !visited.has(d.id));
        if (remaining.length === 0) break;

        let best = null;
        if (hasZones) {
          const curBed = bedCoords.get(current.id);
          const scored = remaining.map(d => {
            const dBed = bedCoords.get(d.id);
            return {
              drill: d,
              dist: this.routedDistance(curBed.x, curBed.y, dBed.x, dBed.y),
            };
          });
          scored.sort((a, b) => a.dist - b.dist);
          best = scored[0].drill;
        } else {
          remaining.sort((a, b) =>
            Math.hypot(current.x - a.x, current.y - a.y) -
            Math.hypot(current.x - b.x, current.y - b.y)
          );
          best = remaining[0];
        }

        path.push(best.id);
        visited.add(best.id);
        current = best;
      }

      return path;
    },

    autoOptimizePath() {
      const unsorted = this.drillData.filter(d => d.solder && !this.isPointInNoGoZone(d));
      if (unsorted.length === 0) return;

      this.addUndoSnapshot({
        path: [...this.path],
        solderStates: this.drillData.map(d => ({ id: d.id, solder: d.solder }))
      });

      this.path = this._nearestNeighborWithZoneAvoidance(unsorted);
      this.updatePathIndices();
    },
    optimizeSelection() {
      const selected = this.drillData.filter(d => d.selected);
      if (selected.length < 2) return;

      this.addUndoSnapshot({
        path: [...this.path],
        solderStates: this.drillData.map(d => ({ id: d.id, solder: d.solder }))
      });
      this.redoStack = [];

      selected.forEach(d => { d.solder = true; });

      const newOrder = this._nearestNeighborWithZoneAvoidance(selected);

      const idsToReplace = new Set(selected.map(d => d.id));
      this.path = this.path.filter(id => !idsToReplace.has(id));
      this.path.push(...newOrder);
      this.updatePathIndices();
    }
    
  }
});