<script setup>
import { ref } from "vue";

// General Machine Settings
const solderFeedMultiplier = ref(105);
const printerBedSizeX = ref(235);
const printerBedSizeY = ref(235);
const zClearanceHeight = ref(5);

// Feed Rates
const travelXYFeedRate = ref(20000);
const travelZFeedRate = ref(200);
const solderXYFeedRate = ref(500);
const solderZFeedRate = ref(100);

// Miscellaneous Settings
const turnOffFanAndHeaters = ref(true);
const useMillimeters = ref(true);

// Start G-code Settings
const initialLiftHeight = ref(10);
const extruderMultiplier = ref(105);
const homeXYFirst = ref(true);

// Per-Point G-code Settings
const solderZDepth = ref(-1);
const retractHeight = ref(0);

// End G-code Settings
const retractAfterSolder = ref(10);
const bedForwardY = ref(235);
const disableSteppers = ref(true);
const playBeep = ref(true);

// Toggle collapse state
const isCollapsed = ref(true);
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
      <h4 class="text-dark"><i class="fas fa-cogs"></i> General Settings</h4>

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

      <hr />

      <h4 class="text-dark"><i class="fa-solid fa-play"></i> Start G-code Settings</h4>

      <div class="mb-3">
        <label class="form-label"><i class="fas fa-arrow-up"></i> Initial Lift Height (mm)</label>
        <input type="number" class="form-control" v-model="initialLiftHeight" min="0" />
      </div>

      <div class="mb-3">
        <label class="form-label"><i class="fas fa-percent"></i> Extruder Multiplier (%)</label>
        <input type="number" class="form-control" v-model="extruderMultiplier" min="0" step="0.1" />
      </div>

      <div class="form-check mb-3">
        <input class="form-check-input" type="checkbox" v-model="homeXYFirst" />
        <label class="form-check-label">Home XY before Z</label>
      </div>

      <hr />

      <h4 class="text-dark"><i class="fa-solid fa-crosshairs"></i> Per-Point G-code Settings</h4>

      <div class="mb-3">
        <label class="form-label"><i class="fas fa-arrow-down"></i> Solder Z Depth</label>
        <input type="number" class="form-control" v-model="solderZDepth" min="-10" step="0.1" />
      </div>

      <div class="mb-3">
        <label class="form-label"><i class="fas fa-arrow-up"></i> Retract Height After Solder</label>
        <input type="number" class="form-control" v-model="retractHeight" min="0" step="0.1" />
      </div>

      <hr />

      <h4 class="text-dark"><i class="fa-solid fa-stop"></i> End G-code Settings</h4>

      <div class="mb-3">
        <label class="form-label"><i class="fas fa-arrow-up"></i> Raise Z Before Ending</label>
        <input type="number" class="form-control" v-model="retractAfterSolder" min="0" step="0.1" />
      </div>

      <div class="mb-3">
        <label class="form-label"><i class="fas fa-arrows-alt-v"></i> Move Bed Forward Y</label>
        <input type="number" class="form-control" v-model="bedForwardY" min="0" />
      </div>

      <div class="form-check mb-3">
        <input class="form-check-input" type="checkbox" v-model="disableSteppers" />
        <label class="form-check-label">Disable steppers after job</label>
      </div>

      <div class="form-check mb-3">
        <input class="form-check-input" type="checkbox" v-model="playBeep" />
        <label class="form-check-label">Play beep after job completes</label>
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
