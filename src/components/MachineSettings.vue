<script setup>
import { ref } from "vue";
import { useDrillStore } from "@/stores/drillStore";
const drillStore = useDrillStore();

// General Settings
const printerBedSizeX = ref(235);
const printerBedSizeY = ref(235);
const zClearanceHeight = ref(5);

// Extrusion Settings
const solderFeedMultiplier = ref(105);
drillStore.feedPrime = drillStore.feedPrime ?? 1;
drillStore.feedRetract = drillStore.feedRetract ?? 1;
drillStore.defaultSolderFeed = drillStore.defaultSolderFeed ?? 3;
drillStore.dwellTime = drillStore.dwellTime ?? 1.5;

// Start G-code
const initialLiftHeight = ref(10);
const homeXYFirst = ref(true);

// End G-code
const retractAfterSolder = ref(10);
const bedForwardY = ref(235);
const disableSteppers = ref(true);
const playBeep = ref(true);

// Toggle
const isCollapsed = ref(true);
</script>

<template>
  <div class="container mt-4">
    <button class="btn btn-primary d-flex align-items-center" @click="isCollapsed = !isCollapsed">
      <i class="fas" :class="isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
      <span class="ms-2">Advanced Machine Settings</span>
    </button>

    <div v-show="!isCollapsed" class="mt-3 p-3 border rounded bg-light">
      <div class="row g-4">
        <!-- General Settings -->
        <div class="col-md-6">
          <h5 class="text-dark"><i class="fas fa-cogs"></i> General</h5>
          <div class="mb-3">
            <label class="form-label">Printer Bed Size (X, Y)</label>
            <div class="d-flex">
              <input type="number" class="form-control me-2" v-model="printerBedSizeX" min="0" />
              <input type="number" class="form-control" v-model="printerBedSizeY" min="0" />
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Z Clearance Height</label>
            <input type="number" class="form-control" v-model="zClearanceHeight" min="0" />
          </div>
        </div>

        <!-- Extrusion Settings -->
        <div class="col-md-6">
          <h5 class="text-dark"><i class="fa-solid fa-syringe"></i> Extrusion</h5>
          <div class="mb-3">
            <label class="form-label">Solder Feed Multiplier</label>
            <small class="text-muted d-block">(Default: 105 for 1mm solder)</small>
            <input type="number" class="form-control" v-model="solderFeedMultiplier" min="0" step="0.01" />
          </div>
          <div class="mb-3">
            <label class="form-label">Prime Amount Before Each Point (mm)</label>
            <input type="number" class="form-control" v-model="drillStore.feedPrime" min="0" step="0.1" />
          </div>
          <div class="mb-3">
            <label class="form-label">Retract Amount After Each Point (mm)</label>
            <input type="number" class="form-control" v-model="drillStore.feedRetract" min="0" step="0.1" />
          </div>
          <div class="mb-3">
            <label class="form-label">Default Solder Feed per Point (mm)</label>
            <input type="number" class="form-control" v-model="drillStore.defaultSolderFeed" min="0" step="0.1" />
          </div>
          <div class="mb-3">
            <label class="form-label">Dwell Time at Each Point (seconds)</label>
            <input type="number" class="form-control" v-model="drillStore.dwellTime" min="0" step="0.1" />
          </div>
        </div>

        <hr />

        <!-- Start G-code -->
        <div class="col-md-6">
          <h5 class="text-dark"><i class="fa-solid fa-play"></i> Start G-code</h5>
          <div class="mb-3">
            <label class="form-label">Initial Lift Height (mm)</label>
            <input type="number" class="form-control" v-model="initialLiftHeight" min="0" />
          </div>
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" v-model="homeXYFirst" />
            <label class="form-check-label">Home XY before Z</label>
          </div>
        </div>

        <!-- End G-code -->
        <div class="col-md-6">
          <h5 class="text-dark"><i class="fa-solid fa-stop"></i> End G-code</h5>
          <div class="mb-3">
            <label class="form-label">Raise Z Before Ending (mm)</label>
            <input type="number" class="form-control" v-model="retractAfterSolder" min="0" step="0.1" />
          </div>
          <div class="mb-3">
            <label class="form-label">Move Bed Forward Y (mm)</label>
            <input type="number" class="form-control" v-model="bedForwardY" min="0" />
          </div>
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" v-model="disableSteppers" />
            <label class="form-check-label">Disable steppers after job</label>
          </div>
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" v-model="playBeep" />
            <label class="form-check-label">Play beep when done</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input,
select {
  max-width: 200px;
}
</style>
