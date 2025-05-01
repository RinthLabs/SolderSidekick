<script setup>
import { ref } from "vue";

const useCustomGcode = ref(false);

const startGcode = ref(`; Start G-code

M104 S0 ; Turn off hotend heater
M140 S0 ; Turn off heated bed
M106 S0 ; Ensure fan is off (if not used)

G21 ; Use millimeters
G91 ; **Set relative positioning (for initial Z movement)**
G1 Z10 F600 ; **Move up 10mm to avoid crashing into the bed**
G90 ; **Switch back to absolute positioning**
M83 ; **Set extruder (E) to relative mode**
G28 X Y             ; Home X and Y axes
G28 Z               ; Home Z separately

M221 S105 ; Extruder multiplier set to 105%

G1 Z10 F600 ; **Move up 10mm to avoid crashing into the bed**
G1 X100 Y100 F3000 ; Move to (100,100) at a safe travel speed
G1 X200 Y200 F7200 ; Move to (200,200) at a faster speed
G1 X200 Y200 F9000 ; Move to (200,200) at a faster speed
G1 X200 Y200 F12000 ; Move to (200,200) at a faster speed
G1 X200 Y200 F36000 ; Move to (200,200) at a faster speed
G1 E500 F500 ; extrude 500mm of solder

M117 Ready to Solder! ; Display message on the printer screen
`);

const perPointGcode = ref(`; Solder Point G-code
G0 X{X} Y{Y} ; Move to position
G1 Z-1 ; Lower soldering iron
G1 Z0 ; Raise soldering iron`);

const endGcode = ref(`; End G-code
G91 ; Set to relative positioning
G1 Z10 F300 ; Raise Z by 10mm to move away from the workpiece

G90 ; Set to absolute positioning
G1 Y235 F3000 ; Move the bed all the way forward (Ender 3 default max Y = 235mm)

M104 S0 ; Turn off hotend heater
M140 S0 ; Turn off bed heater
M107 ; Turn off fan

G92 E0 ; Reset the extruder position (optional)
M84 ; Disable steppers
M300 S440 P200 ; Beep to signal job completion
M117 Job Complete! ; Display message on the printer screen
`);

const saveGcode = () => {
  const finalGcode = `${startGcode.value}\n\n; Drill Points\n${perPointGcode.value}\n\n${endGcode.value}`;
  console.log("Generated G-code:\n", finalGcode);
  alert("G-code saved! Check the console for output.");
};
</script>

<template>
  <div class="container mt-4">
    <h2 class="text-primary"><i class="fa-solid fa-list"></i> G-code Output</h2>

    <div class="mb-3">
      <label class="form-label"><i class="fa-solid fa-play"></i> Start G-code</label>
      <textarea class="form-control" rows="4" v-model="startGcode"></textarea>
    </div>

    <div class="mb-3">
      <label class="form-label"><i class="fa-solid fa-crosshairs"></i> Per-Point G-code</label>
      <textarea class="form-control" rows="4" v-model="perPointGcode"></textarea>
    </div>

    <div class="mb-3">
      <label class="form-label"><i class="fa-solid fa-stop"></i> End G-code</label>
      <textarea class="form-control" rows="4" v-model="endGcode"></textarea>
    </div>

    <button class="btn btn-success" @click="saveGcode">
      <i class="fa-solid fa-save"></i> Save G-code
    </button>
  </div>
</template>

<style scoped>
textarea {
  font-family: monospace;
  resize: vertical;
}
</style>
