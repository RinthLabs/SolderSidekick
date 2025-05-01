<script setup>

import Drill from "@/components/Drill.vue";
import DrillPreview from "@/components/DrillPreview.vue";
import MachineSettings from "@/components/MachineSettings.vue";
import GcodeOutput from "@/components/GcodeOutput.vue";


</script>

<template>
  

  <div class="container mt-4">
    <Drill />
    <DrillPreview />
    <MachineSettings />
    <GcodeOutput />
  </div>
</template>

<style scoped>
/* Adjust logo size and spacing */
.navbar-brand img {
  border-radius: 5px;
}

/* Center the navigation items vertically */
.navbar-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Ensure all items, including donate button, are aligned */
.navbar-nav .nav-item {
  display: flex;
  align-items: center;
}


</style>
