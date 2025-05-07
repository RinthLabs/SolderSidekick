<script setup>
import { ref, watch } from "vue";
import { useDrillStore } from "@/stores/drillStore";

const drillStore = useDrillStore();
const activeTab = ref("settings");

// Machine Settings
const feedPrime = ref(drillStore.feedPrime ?? 1.0);
const feedRetract = ref(drillStore.feedRetract ?? 1.0);

const defaultSolderFeed = ref(drillStore.defaultSolderFeed ?? 3.0);
const defaultDwellTime = ref(drillStore.dwellTime ?? 1.5);
const defaultApproachDistance = ref(drillStore.defaultApproachDistance ?? 2.0);


const solderFeedMultiplier = ref(105);
const initialLiftHeight = ref(10);
const homeXYFirst = ref(true);
const retractAfterSolder = ref(10);
const bedForwardY = ref(235);
const disableSteppers = ref(true);
const playBeep = ref(true);

// G-code Templates
const startGcode = ref(`; Start G-code
G28 X Y ; Home X and Y
G28 Z ; Home Z
G1 Z{LIFT} F600 ; Initial lift height
M221 S{MULTIPLIER} ; Extruder multiplier
M117 Ready to Solder!`);

const perPointGcode = ref(`; Solder Point G-code
G0 X{X} Y{Y}
G1 Z-1
G1 E{PRIME} F600
G1 E{FEED}
G1 E-{RETRACT} F600
G1 Z0`);

const endGcode = ref(`; End G-code
G1 Z{RETRACT} F300
G1 Y{BED_FORWARD} F3000
M104 S0
M140 S0
M107
M84
M117 Done
{BEEP}`);

// Sync relevant settings to G-code templates
watch([initialLiftHeight, solderFeedMultiplier, retractAfterSolder, bedForwardY, playBeep], () => {
  startGcode.value = startGcode.value
    .replace(/\{LIFT\}/g, initialLiftHeight.value)
    .replace(/\{MULTIPLIER\}/g, solderFeedMultiplier.value);

  endGcode.value = endGcode.value
    .replace(/\{RETRACT\}/g, retractAfterSolder.value)
    .replace(/\{BED_FORWARD\}/g, bedForwardY.value)
    .replace(/\{BEEP\}/g, playBeep.value ? "M300 S440 P200" : "");
});

watch([feedPrime, feedRetract, defaultSolderFeed], () => {
  perPointGcode.value = perPointGcode.value
    .replace(/\{PRIME\}/g, feedPrime.value)
    .replace(/\{RETRACT\}/g, feedRetract.value)
    .replace(/\{FEED\}/g, defaultSolderFeed.value);
});

watch([defaultSolderFeed, defaultDwellTime, defaultApproachDistance], () => {
  drillStore.defaultSolderFeed = defaultSolderFeed.value;
  drillStore.defaultDwellTime = defaultDwellTime.value;
  drillStore.defaultApproachDistance = defaultApproachDistance.value;
});

</script>

<!-- MachineConfig.vue -->
<template>
  <div class="modal fade" id="machineConfigModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable modal-fullscreen-ish">

      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="fa-solid fa-gears"></i> Machine Configuration</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          


            <div class="container mt-4">
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">Machine Settings</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'gcode' }" @click="activeTab = 'gcode'">G-code Templates</a>
      </li>
    </ul>

    <div v-if="activeTab === 'settings'" class="mt-3">
      <div class="row g-4">
        <div class="col-md-6">
          <h5 class="mt-4"><i class="fa-solid fa-sliders"></i> Defaults</h5>

          <label class="form-label mt-2">Solder Feed (mm)</label>
          <input type="number" class="form-control" v-model="defaultSolderFeed" />

          <label class="form-label mt-3">Solder Time (seconds)</label>
          <input type="number" class="form-control" v-model="defaultDwellTime" />

          <label class="form-label mt-3">Approach Distance (mm)</label>
          <input type="number" class="form-control" v-model="defaultApproachDistance" />
        </div>

        <div class="col-md-6">
          <h5><i class="fa-solid fa-syringe"></i> Solder Extrusion</h5>
          <label class="form-label">Solder Feed Multiplier</label>
          <input type="number" class="form-control" v-model="solderFeedMultiplier" />

          <label class="form-label mt-3">Prime Amount (mm)</label>
          <input type="number" class="form-control" v-model="feedPrime" />

          <label class="form-label mt-3">Retract Amount (mm)</label>
          <input type="number" class="form-control" v-model="feedRetract" />
        </div>

        <div class="col-md-6">
          <h5><i class="fa-solid fa-play"></i> Start G-code</h5>
          <label class="form-label">Initial Lift Height</label>
          <input type="number" class="form-control" v-model="initialLiftHeight" />

          <div class="form-check mt-3">
            <input class="form-check-input" type="checkbox" v-model="homeXYFirst" />
            <label class="form-check-label">Home XY before Z</label>
          </div>

          <h5 class="mt-4"><i class="fa-solid fa-stop"></i> End G-code</h5>
          <label class="form-label">Raise Z Before Ending</label>
          <input type="number" class="form-control" v-model="retractAfterSolder" />

          <label class="form-label mt-3">Move Bed Forward (Y)</label>
          <input type="number" class="form-control" v-model="bedForwardY" />

          <div class="form-check mt-3">
            <input class="form-check-input" type="checkbox" v-model="disableSteppers" />
            <label class="form-check-label">Disable steppers</label>
          </div>
          <div class="form-check mt-1">
            <input class="form-check-input" type="checkbox" v-model="playBeep" />
            <label class="form-check-label">Play beep</label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'gcode'" class="mt-3">
      <label class="form-label"><i class="fa-solid fa-play"></i> Start G-code</label>
      <textarea class="form-control gcode-textarea" v-model="startGcode"></textarea>

      <label class="form-label mt-3"><i class="fa-solid fa-crosshairs"></i> Per-Point G-code</label>
      <textarea class="form-control gcode-textarea" v-model="perPointGcode"></textarea>

      <label class="form-label mt-3"><i class="fa-solid fa-stop"></i> End G-code</label>
      <textarea class="form-control gcode-textarea" v-model="endGcode"></textarea>
    </div>
  </div>



        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  font-family: monospace;
}

.modal-fullscreen-ish {
  max-width: 95vw;
  max-height: 95vh;
  margin: 2.5vh auto;
}

.modal-fullscreen-ish .modal-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-fullscreen-ish .modal-body {
  flex: 1;
  overflow-y: auto;
}

.gcode-textarea {
  min-height: 18vh;
  resize: vertical; /* Optional: allows manual resizing */
  font-family: monospace;
}


</style>
