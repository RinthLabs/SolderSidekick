<script setup>

import UploadDrillFile from "@/components/UploadDrillFile.vue";
import ToolpathEditor from "@/components/ToolpathEditor.vue";
import MachineConfig from "@/components/MachineConfig.vue";
import Header from "@/components/Header.vue";

</script>

<template>


  <Header />

    <ToolpathEditor />
    <MachineConfig />

  <!-- <footer class="footer py-4 text-center text-muted">
    Open source · MIT Licensed · Built by <a href="https://rinthlabs.com" target="_blank">Rinth Labs™</a>
</footer> -->


</template>

<style scoped>


/* .footer {
  border-top: 1px solid #ddd;
  font-size: 0.9rem;
} */


</style>
