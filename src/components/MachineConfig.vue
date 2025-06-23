<script setup>
import { ref, watch, onMounted, computed  } from "vue";
import GcodeEditor from './GcodeEditor.vue'; // Adjust path if needed

import { useDrillStore } from "@/stores/drillStore";


const drillStore = useDrillStore();


// Profile selection
const selectedProfile = computed({
  get: () => drillStore.currentProfile,
  set: (val) => drillStore.setCurrentProfile(val)
});

// Origin inputs
const zeroX = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].zeroX,
  set: (val) => drillStore.updateCurrentProfileSettings({ zeroX: val })
});
const zeroY = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].zeroY,
  set: (val) => drillStore.updateCurrentProfileSettings({ zeroY: val })
});
const zeroZ = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].zeroZ,
  set: (val) => drillStore.updateCurrentProfileSettings({ zeroZ: val })
});

// Homing inputs
const homeX = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].homeX,
  set: (val) => drillStore.updateCurrentProfileSettings({ homeX: val })
});
const homeY = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].homeY,
  set: (val) => drillStore.updateCurrentProfileSettings({ homeY: val })
});
const homeZ = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].homeZ,
  set: (val) => drillStore.updateCurrentProfileSettings({ homeZ: val })
});


// Add after the existing computed properties
const pcbThickness = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].pcbThickness ?? drillStore.pcbThickness,
  set: (val) => {
    drillStore.updateCurrentProfileSettings({ pcbThickness: val });
    drillStore.pcbThickness = val;
  }
});

const startSafeZ = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].startSafeZ,
  set: (val) => drillStore.updateCurrentProfileSettings({ startSafeZ: val })
});

const solderSafeZ = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].solderSafeZ,
  set: (val) => drillStore.updateCurrentProfileSettings({ solderSafeZ: val })
});

const endSafeZ = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].endSafeZ,
  set: (val) => drillStore.updateCurrentProfileSettings({ endSafeZ: val })
});

const solderFeedMultiplier = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].solderFeedMultiplier,
  set: (val) => drillStore.updateCurrentProfileSettings({ solderFeedMultiplier: val })
});

const feedPrime = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].feedPrime,
  set: (val) => drillStore.updateCurrentProfileSettings({ feedPrime: val })
});

const feedRetract = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].feedRetract,
  set: (val) => drillStore.updateCurrentProfileSettings({ feedRetract: val })
});

const retractAfterSolder = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].retractAfterSolder,
  set: (val) => drillStore.updateCurrentProfileSettings({ retractAfterSolder: val })
});

const playBeep = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].playBeep,
  set: (val) => drillStore.updateCurrentProfileSettings({ playBeep: val })
});

const startGcode = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].startGcode,
  set: (val) => drillStore.updateCurrentProfileSettings({ startGcode: val })
});

const perPointGcode = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].perPointGcode,
  set: (val) => drillStore.updateCurrentProfileSettings({ perPointGcode: val })
});

const endGcode = computed({
  get: () => drillStore.profiles[drillStore.currentProfile].endGcode,
  set: (val) => drillStore.updateCurrentProfileSettings({ endGcode: val })
});

function resetToDefaults() {
  drillStore.resetCurrentProfileToDefault();
}



// const startSafeZ = ref(drillStore.defaultProfileSettings.startSafeZ);
// const solderSafeZ = ref(drillStore.defaultProfileSettings.solderSafeZ);
// const endSafeZ = ref(drillStore.defaultProfileSettings.endSafeZ);
// const solderFeedMultiplier = ref(drillStore.defaultProfileSettings.solderFeedMultiplier);
// const feedPrime = ref(drillStore.defaultProfileSettings.feedPrime);
// const feedRetract = ref(drillStore.defaultProfileSettings.feedRetract);
// const retractAfterSolder = ref(drillStore.defaultProfileSettings.retractAfterSolder);
// const playBeep = ref(drillStore.defaultProfileSettings.playBeep);
// const startGcode = ref(drillStore.defaultProfileSettings.startGcode);
// const perPointGcode = ref(drillStore.defaultProfileSettings.perPointGcode);
// const endGcode = ref(drillStore.defaultProfileSettings.endGcode);



// Load from profile
// function loadSettingsToUI() {
//   const s = drillStore.profiles[selectedProfile.value];
//   zeroX.value = s.zeroX;
//   zeroY.value = s.zeroY;
//   zeroZ.value = s.zeroZ;
//   startSafeZ.value = s.startSafeZ;
//   solderSafeZ.value = s.solderSafeZ;
//   endSafeZ.value = s.endSafeZ;
//   solderFeedMultiplier.value = s.solderFeedMultiplier;
//   feedPrime.value = s.feedPrime;
//   feedRetract.value = s.feedRetract;
//   retractAfterSolder.value = s.retractAfterSolder;
//   playBeep.value = s.playBeep;
//   startGcode.value = s.startGcode;
//   perPointGcode.value = s.perPointGcode;
//   endGcode.value = s.endGcode;
// }

// function saveSettingsToProfile() {
//   drillStore.updateCurrentProfileSettings({
//     zeroX: zeroX.value,
//     zeroY: zeroY.value,
//     zeroZ: zeroZ.value,
//     startSafeZ: startSafeZ.value,
//     solderSafeZ: solderSafeZ.value,
//     endSafeZ: endSafeZ.value,
//     solderFeedMultiplier: solderFeedMultiplier.value,
//     feedPrime: feedPrime.value,
//     feedRetract: feedRetract.value,
//     retractAfterSolder: retractAfterSolder.value,
//     playBeep: playBeep.value,
//     startGcode: startGcode.value,
//     perPointGcode: perPointGcode.value,
//     endGcode: endGcode.value
//   });
// }

// watch(selectedProfile, (newProfile) => {
//   drillStore.setCurrentProfile(newProfile);
//   loadSettingsToUI();
// });

// watch([
//   zeroX, zeroY, zeroZ, startSafeZ, solderSafeZ, endSafeZ,  solderFeedMultiplier,
//   feedPrime, feedRetract, retractAfterSolder, playBeep,
//   startGcode, perPointGcode, endGcode
// ], saveSettingsToProfile, { deep: true });

onMounted(() => {
  //loadSettingsToUI()
})

// function resetToDefaults() {
//   drillStore.resetCurrentProfileToDefault();
//   loadSettingsToUI();
// }

// const activeTab = ref("settings");


// Machine Settings
// const feedPrime = ref(drillStore.feedPrime ?? 1.0);
// const feedRetract = ref(drillStore.feedRetract ?? 1.0);

// const solderFeedMultiplier = ref(105);
// const startSafeZ = ref(12);
// const zeroX = ref(20);
// const zeroY = ref(25);
// const zeroZ = ref(1);
// const retractAfterSolder = ref(10);
// const playBeep = ref(true);

// G-code Templates


</script>

<template>
  <div class="modal fade" id="machineConfigModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable modal-fullscreen-ish">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fa-solid fa-gears"></i> Settings
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
          <div class="container-fluid">


           <div class="mb-3 d-flex align-items-center">
  <label class="me-2">Profile:</label>
  <select class="form-select w-auto" v-model="selectedProfile">
    <option>Custom 1</option>
    <option>Custom 2</option>
    <option>Custom 3</option>
    <option>Custom 4</option>
    <option>Custom 5</option>
  </select>
  <button class="btn btn-outline-secondary ms-3" @click="resetToDefaults">
    Reset to Defaults
  </button>
</div>


            <!-- Start G-code Settings + GcodeEditor in same row -->
            <div class="row">
              <div class="col-md-6">
                <h5 class="mt-3"><i class="fa-solid fa-play"></i> Start G-code</h5>
                
                <label class="form-label" title="{ORIGIN_X} {ORIGIN_Y} {ORIGIN_Z}">Origin XYZ</label>
                <div class="row">
                  <div class="col-auto d-flex align-items-center">
                    <label class="me-2 mb-0" style="min-width: 1.5em;"><b>X</b></label>
                    <input type="number" class="form-control form-control-sm" v-model="zeroX" />
                  </div>
                  <div class="col-auto d-flex align-items-center">
                    <label class="me-2 mb-0" style="min-width: 1.5em;"><b>Y</b></label>
                    <input type="number" class="form-control form-control-sm" v-model="zeroY" />
                  </div>
                  <div class="col-auto d-flex align-items-center">
                    <label class="me-2 mb-0" style="min-width: 1.5em;"><b>Z</b></label>
                    <input type="number" class="form-control form-control-sm" v-model="zeroZ" />
                  </div>
                </div>

                <label class="form-label mt-3" title="{PCB_THICKNESS}">PCB Thickness (mm)</label>
                <input type="number" class="form-control" v-model="pcbThickness" step="0.1" />

                <label class="form-label mt-3" title="{START_SAFE_Z}">Start Safe Z</label>
                <input type="number" class="form-control" v-model="startSafeZ" />

                <label class="form-label mt-3" title="{MULTIPLIER}">Solder Feed Multiplier</label>
                <input type="number" class="form-control" v-model="solderFeedMultiplier" />
              </div>

              <div class="col-md-6">
                <GcodeEditor
                  :code="startGcode"
                  title="Start G-code"
                  icon="fa-play"
                  @update:code="startGcode = $event"
                />
              </div>
            </div>

            <!-- Per Point + End Settings remain grouped -->
            <div class="row mt-4">
              <div class="col-md-6">
                <h5><i class="fa-solid fa-crosshairs"></i> Per Point G-code</h5>

                <label class="form-label mt-3" title="{PRIME}">Solder Prime</label>
                <input type="number" class="form-control" v-model="feedPrime" />

                <label class="form-label mt-3" title="{PRIME_RETRACT}">Solder Prime Retract</label>
                <input type="number" class="form-control" v-model="feedRetract" />

                <label class="form-label mt-3" title="{POINT_OFFSET_X}">Solder Point Offset X</label>
                <input type="number" class="form-control" v-model="drillStore.originOffsetX" />

                <label class="form-label mt-3" title="{RETRACT}">Solder Retract</label>
                <input type="number" class="form-control" v-model="retractAfterSolder" />

                <label class="form-label mt-3" title="{SOLDER_SAFE_Z}">Solder Safe Z</label>
                <input type="number" class="form-control" v-model="solderSafeZ" />
              </div>

              <div class="col-md-6">
                <GcodeEditor
                  :code="perPointGcode"
                  title="Per-Point G-code"
                  icon="fa-crosshairs"
                  @update:code="perPointGcode = $event"
                />
              </div>
            </div>

            <div class="row mt-4">
              <div class="col-md-6">
                <h5><i class="fa-solid fa-stop"></i> End G-code</h5>
                <label class="form-label" title="{END_SAFE_Z}">End Safe Z</label>
                <input type="number" class="form-control" v-model="endSafeZ" />

                <div class="form-check mt-3">
                  <input class="form-check-input" type="checkbox" v-model="playBeep" />
                  <label class="form-check-label" title="{BEEP}">Play Beep</label>
                </div>
              </div>

              <div class="col-md-6">
                <GcodeEditor
                  :code="endGcode"
                  title="End G-code"
                  icon="fa-stop"
                  @update:code="endGcode = $event"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  resize: vertical;
}
</style>
