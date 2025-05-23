<script setup>
import { ref, watch   } from "vue";
import GcodeEditor from './GcodeEditor.vue'; // Adjust path if needed

import { useDrillStore } from "@/stores/drillStore";



const drillStore = useDrillStore();
const activeTab = ref("settings");


// Machine Settings
const feedPrime = ref(drillStore.feedPrime ?? 1.0);
const feedRetract = ref(drillStore.feedRetract ?? 1.0);

const solderFeedMultiplier = ref(105);
const startSafeZ = ref(10);
const zeroX = ref(20);
const zeroY = ref(25);
const zeroZ = ref(1);
const retractAfterSolder = ref(10);
const bedForwardY = ref(235);
const playBeep = ref(true);

//G0 X3 Y4.1 F6000 ; Move to start position X and Y
// G-code Templates
const startGcode = ref(`; Start G-code
M117 Homing XYZ
G28 X Y ; Home X and Y
G28 Z ; Home Z
G0 Z{START_SAFE_Z} F600 ; Initial lift height

M117 Moving to 0,0,0
G0 X{ORIGIN_X} Y{ORIGIN_Y} F6000 ; Move to start position X and Y (1,3.3)
G0 Z{ORIGIN_Z} F600 ; Move to start position Z (0.3)
G0 Z{PCB_THICKNESS} F600 ; Move to start position Z
G92 X0 Y0 Z0 ; Set current position as 0,0,0

M221 S{MULTIPLIER} ; Extruder multiplier
M302 S0 ; Allow cold extrusion
M83 ; Set extruder to relative mode

M117 Ready to Solder!`);

//G0 X16 Y16 F6000 ; Move to start position X and Y

//G0 X0 Y0 F6000

const perPointGcode = ref(`; Solder Point G-code
M117 Soldering {INDEX}/{TOTAL_POINTS}
M73 P{INDEX / TOTAL_POINTS} ; Set progress bar %
G0 X{X + APPROACH} Y{Y} F6000 ; Move to point with approach offset
G1 E{PRIME} F600 ; Prime soldering iron with a small amount of solder
G1 E-{PRIME_RETRACT} F600 ; Retract solder from touching soldering iron
G1 Z0 ; Move to PCB height
G0 X{X + POINT_OFFSET_X} Y{Y} F6000 ; Move to solder point
G4 S{SOAK} ; Soak time
G1 E{FEED} ; Solder the point
G4 S{DWELL} ; Dwell time
G1 E-{RETRACT} F600 ; Retract solder from touching soldering iron
G1 Z{SOLDER_SAFE_Z} F600 ; Lift soldering iron`);

const endGcode = ref(`; End G-code
G1 Z{END_SAFE_Z} F600 ; Lift soldering iron
G1 Y{BED_FORWARD} F6000 ; Move bed forward
M18 ; Disable steppers
M84 ; Disable steppers
M73 P100 ; Set progress bar to 100%
M117 Solder Sidekick Done!
M300 S440 P{BEEP} ; Beep
G4 P{BEEP} ; Wait for 0.25 seconds
M300 S440 P{BEEP} ; Beep
G4 P{BEEP} ; Wait for 0.25 seconds
M300 S440 P{BEEP} ; Beep
G4 P{BEEP} ; Wait for 0.25 seconds
`);

// Sync relevant settings to G-code templates
// watch([startSafeZ, solderFeedMultiplier, retractAfterSolder, bedForwardY, playBeep], () => {
//   startGcode.value = startGcode.value
//     .replace(/\{LIFT\}/g, startSafeZ.value)
//     .replace(/\{MULTIPLIER\}/g, solderFeedMultiplier.value);

//   endGcode.value = endGcode.value
//     .replace(/\{RETRACT\}/g, retractAfterSolder.value)
//     .replace(/\{BED_FORWARD\}/g, bedForwardY.value)
//     .replace(/\{BEEP\}/g, playBeep.value ? "M300 S440 P200" : "");
// });

// watch([feedPrime, feedRetract, defaultSolderFeed], () => {
//   perPointGcode.value = perPointGcode.value
//     .replace(/\{PRIME\}/g, feedPrime.value)
//     .replace(/\{RETRACT\}/g, feedRetract.value)
//     .replace(/\{FEED\}/g, defaultSolderFeed.value);
// });

// watch([defaultSolderFeed, defaultDwellTime, defaultApproachDistance], () => {
//   drillStore.defaultSolderFeed = defaultSolderFeed.value;
//   drillStore.defaultDwellTime = defaultDwellTime.value;
//   drillStore.defaultApproachDistance = defaultApproachDistance.value;
// });

// watch([defaultSoakTime], () => {
//   drillStore.defaultSoakTime = defaultSoakTime.value;
// });


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
            <!-- Start G-code Settings + GcodeEditor in same row -->
            <div class="row">
              <div class="col-md-6">
                <h5 class="mt-3"><i class="fa-solid fa-play"></i> Start G-code</h5>
                
                <label class="form-label" title="{ORIGIN_X} {ORIGIN_Y} {ORIGIN_Z}">Homing Origin XYZ</label>
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
                <input type="number" class="form-control" v-model="startSafeZ" />
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
                <input type="number" class="form-control" v-model="startSafeZ" />

                <label class="form-label mt-3" title="{BED_FORWARD}">Bed Forward</label>
                <input type="number" class="form-control" v-model="bedForwardY" />

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
