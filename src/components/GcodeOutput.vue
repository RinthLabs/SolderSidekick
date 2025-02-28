<script setup>
import { ref } from "vue";

const startGcode = ref(`; Start G-code\nG21 ; Set units to millimeters\nG90 ; Absolute positioning`);
const perPointGcode = ref(`G0 X{X} Y{Y} ; Move to position\nG1 Z-1 ; Lower drill\nG1 Z0 ; Raise drill`);
const endGcode = ref(`; End G-code\nG0 X0 Y0 ; Return to home\nM30 ; End of program`);

const saveGcode = () => {
  const finalGcode = `${startGcode.value}\n\n; Drill Points\n${perPointGcode.value}\n\n${endGcode.value}`;
  console.log("Generated G-code:\n", finalGcode);
  alert("G-code saved! Check the console for output.");
};
</script>

<template>
  <div class="container mt-4">
    <h2 class="text-primary">G-code Output</h2>

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
