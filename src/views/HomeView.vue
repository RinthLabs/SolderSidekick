<script setup>

import UploadDrillFile from "@/components/UploadDrillFile.vue";
import ToolpathEditor from "@/components/ToolpathEditor.vue";
import MachineConfig from "@/components/MachineConfig.vue";

</script>

<template>
  

  <div class="container mt-4">
    <UploadDrillFile />
  </div>
    <ToolpathEditor />
  <div class="container">
    <MachineConfig />
  </div>

  <footer class="footer py-4 text-center text-muted">
    Open source · MIT Licensed · Built by <a href="https://rinthlabs.com" target="_blank">Rinth Labs</a>
</footer>


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

.footer {
  border-top: 1px solid #ddd;
  font-size: 0.9rem;
  margin-top: 20rem;
}


</style>
