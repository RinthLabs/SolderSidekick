import { defineStore } from "pinia";

export const useDrillStore = defineStore("drill", {
  state: () => ({
    drillFile: null,
    drillFilename: null,
    drillData: [],  // Stores parsed drill holes
    originOffsetX: 0, // X offset
    originOffsetY: 0, // Y offset
    solderFeedMultiplier: 1, // New: Solder Feed Multiplier
  }),
  actions: {
    setDrillFile(fileContent, filename) {
      this.drillFile = fileContent;
      this.drillFilename = filename;
    },
    setDrillData(data) {
      this.drillData = data.map((hole) => ({
        ...hole,
        solder: true, // Default: solder all holes
        selected: false, // Default: not selected
        solderFeed: 3, // Default: 3mm solder feed per hole
      }));
    },
    toggleSolder(index) {
      if (this.drillData[index]) {
        this.drillData[index].solder = !this.drillData[index].solder;
      }
    },
    toggleSelection(index) {
      if (this.drillData[index]) {
        this.drillData[index].selected = !this.drillData[index].selected;
      }
    },
    selectAll() {
      this.drillData.forEach((hole) => (hole.selected = true));
    },
    deselectAll() {
      this.drillData.forEach((hole) => (hole.selected = false));
    },
    setSelectedSolder(state) {
      this.drillData.forEach((hole) => {
        if (hole.selected) {
          hole.solder = state;
        }
      });
    },
    setOriginOffset(x, y) {
      this.originOffsetX = x;
      this.originOffsetY = y;
    },
    setSolderFeedMultiplier(value) {
      this.solderFeedMultiplier = value;
    },
    clearDrillFile() {
      this.drillFile = null;
      this.drillFilename = null;
      this.drillData = [];
      this.originOffsetX = 0;
      this.originOffsetY = 0;
      this.solderFeedMultiplier = 1;
    },
  },
  persist: true, // Enable persistence
});
