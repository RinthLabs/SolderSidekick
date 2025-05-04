<template>
    <div v-if="visible" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box">
        <button class="close-btn" @click="closeModal">×</button>
        <h2 class="modal-title">Getting Started</h2>
        <div class="video-wrapper">
          <iframe
            width="100%"
            height="315"
            :src="youtubeUrl"
            title="YouTube video"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>
  </template>
  
  
  <script setup>
  import { ref, onMounted, watch } from "vue";
  
  const visible = ref(false);
  const STORAGE_KEY = "solderSidekickIntroDismissed";
  
  // This can be customized or made a prop if needed
  const youtubeUrl = "https://www.youtube.com/embed/MGpWirqkfZk";
  
  const closeModal = () => {
    visible.value = false;
    localStorage.setItem(STORAGE_KEY, "true");
  };
  
  // Show it on first load unless dismissed
  onMounted(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      visible.value = true;
    }
  });
  
  // Optional: expose control to parent
  defineExpose({
    show: () => (visible.value = true)
  });
  </script>
  
  <style scoped>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .modal-box {
  background: #fff;
  padding: 1.5rem;
  width: 80vw;
  height: 80vh;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.modal-title {
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
}

.video-wrapper {
  flex: 1;
  width: 100%;
  position: relative;
}

.video-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
}

  </style>
  