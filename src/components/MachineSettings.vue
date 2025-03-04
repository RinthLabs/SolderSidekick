<script setup>
import { ref } from "vue";

// Reactive state for machine settings
const solderFeedMultiplier = ref(105);
const printerBedSizeX = ref(235);
const printerBedSizeY = ref(235);
const zClearanceHeight = ref(5);

// Add these fields

const travelXYFeedRate = ref(20000);
const travelZFeedRate = ref(200);
const solderXYFeedRate = ref(500);
const solderZFeedRate = ref(100);

const turnOffFanAndHeaters = ref(true);
const useMillimeters = ref(true);


// Toggle collapse state
const isCollapsed = ref(true);

// Add dropdown to select your machine, default is Ender3

</script>

<template>
  <div class="container mt-4">
    <!-- Toggle Button -->
    <button
      class="btn btn-primary d-flex align-items-center"
      @click="isCollapsed = !isCollapsed"
    >
      <i class="fas" :class="isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
      <span class="ms-2">Machine Settings</span>
    </button>

    <!-- Collapsible Settings Panel -->
    <div v-show="!isCollapsed" class="mt-3 p-3 border rounded bg-light">
      <div class="mb-3">
        <label class="form-label"><i class="fas fa-tint"></i> Solder Feed Multiplier</label>
        <small class="text-muted d-block">(Default: 105 for 1mm solder)</small>
        
        <input type="number" class="form-control" v-model="solderFeedMultiplier" min="0" step="0.01" />
      </div>

      <div class="mb-3">
        <label class="form-label"><i class="fas fa-ruler-combined"></i> Printer Bed Size (X, Y)</label>
        <div class="d-flex">
          <input type="number" class="form-control me-2" v-model="printerBedSizeX" min="0" />
          <input type="number" class="form-control" v-model="printerBedSizeY" min="0" />
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label"><i class="fas fa-arrows-alt-v"></i> Z Clearance Height</label>
        <input type="number" class="form-control" v-model="zClearanceHeight" min="0" />
      </div>
      
    </div>
  </div>
</template>

<style scoped>
/* Ensure form elements don't stretch too much */
input,
select {
  max-width: 200px;
}
</style>
