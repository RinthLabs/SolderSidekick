<template>
  <div>
    <div
      class="open-ui"
    >
      <button class="btn btn-outline-light btn-sm open-btn" @click="triggerFilePicker"><i class="fa-solid fa-file-arrow-up me-2"></i> Open File</button>

      <!-- Hidden File Input -->
      <input
        type="file"
        ref="fileInput"
        class="d-none"
        @change="handleFiles"
        accept=".drl,.txt,.json"
      />

    </div>
  </div>
</template>



<script setup>
import { ref } from "vue";
// import { useDrillStore } from "@/stores/drillStore";
import { useFileHandlers } from "@/composables/useFileHandlers";
const { parseDrillFile, parseProjectFile } = useFileHandlers();


// const drillStore = useDrillStore();
const fileInput = ref(null);

// const inchesToMm = (inches) => Math.round(inches * 25.4 * 100) / 100;

const handleFiles = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'json') {
    parseProjectFile(file);
  } else {
    parseDrillFile(file);
  }

  event.target.value = "";
};


const triggerFilePicker = () => {
  if (fileInput.value) {
    fileInput.value.value = ""; // ✅ Clear before opening
    fileInput.value.click();
  }
};

</script>

<style>
.open-ui{
  color:#FFF;
}

.open-btn{
  height: 60px !important;
    font-size: 1.25rem !important;
    padding: 0rem 1rem !important;
    --bs-btn-border-width: 0px !important;

    
}


</style>
