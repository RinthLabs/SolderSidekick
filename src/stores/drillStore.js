import { defineStore } from "pinia";

export const useDrillStore = defineStore("drill", {
  state: () => ({
    drillData: [],
    path: [],
    originOffsetX: 16,
    originOffsetY: 16,
    toolSizes: {},
    undoStack: [],
    canvasShouldUpdate: false,
    pcbThickness: 1.6,
    mountHeight: 28.8,
    feedPrime: 1.0,
    feedRetract: 0.5,
  }),
  getters: {
    selectedPoints: (state) => state.drillData.filter(d => d.selected),
  },
  actions: {
    
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
        solder: true,
        selected: false,
        pathIndex: null,
        feed: 3.0,
        dwell: 1.5,
        solderOffset: 0.8
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
        this.undoStack.push([...this.path]);
        this.path.push(id);
        this.updatePathIndices();
      }
    },
    removeFromPath(id) {
      if (this.path.includes(id)) {
        this.undoStack.push([...this.path]);
        this.path = this.path.filter(p => p !== id);
        this.updatePathIndices();
      }
    },
    clearPath() {
      this.undoStack.push([...this.path]);
      this.path = [];
      this.updatePathIndices();
    },
    undoLast() {
      if (this.undoStack.length > 0) {
        this.path = this.undoStack.pop();
        this.updatePathIndices();
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

      this.undoStack.push([...this.path]);
      this.path = path;
      this.updatePathIndices();
    },
    optimizeSelection() {
      const selected = this.drillData.filter(d => d.selected);
      if (selected.length < 2) return;

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

      // Replace selected path segments only
      this.undoStack.push([...this.path]);
      const idsToReplace = new Set(selected.map(d => d.id));
      this.path = this.path.filter(id => !idsToReplace.has(id));
      const insertIndex = this.path.length;
      this.path.splice(insertIndex, 0, ...newOrder);
      this.updatePathIndices();
    }
  }
});
