import { defineStore } from "pinia";

export const useDrillStore = defineStore("drill", {
  state: () => ({
    drillFile: null,
    drillFilename: null,
    drillData: [],  // Stores parsed drill holes
    processedData: {},
    selectedHoles: {}, // Track which holes should be soldered
  }),
  actions: {
    setDrillFile(fileContent, filename) {
      this.drillFile = fileContent;
      this.drillFilename = filename;
      this.selectedHoles = {}; // Reset selections
    },
    setDrillData(data) {
      this.drillData = data;
      // Initialize all holes as selected for soldering
      this.selectedHoles = data.reduce((acc, hole, index) => {
        acc[index] = true; // Default: solder all holes
        return acc;
      }, {});
    },
    toggleHole(index) {
      this.selectedHoles[index] = !this.selectedHoles[index];
    },
    clearDrillFile() {
      this.drillFile = null;
      this.drillFilename = null;
      this.drillData = [];
      this.processedData = {};
      this.selectedHoles = {};
    }
  },
  persist: true, // Enable persistence
});
