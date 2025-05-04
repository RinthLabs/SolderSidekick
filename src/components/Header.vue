
<template>
     
  
  <header class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <!-- Logo -->
        <a class="navbar-brand d-flex align-items-center logo" href="#">
          <img src="/logo/solder-sidekick-logo-dark-bg.svg" alt="Solder Sidekick Logo" height="80" class="" />
        </a>

        <!-- Toolpath Editor UI -->

        <UploadDrillFile />
        <button v-if="drillStore.drillFilename" class="btn btn-outline-light btn-sm nav-link" @click="saveProject">
            <i class="fa-solid fa-file-arrow-down"></i> Save Project
        </button>

        <button class="btn btn-outline-light btn-sm nav-link" data-bs-toggle="modal" data-bs-target="#machineConfigModal">
            <i class="fa-solid fa-gears me-1"></i> Advanced Settings
        </button>

        <!-- Navigation -->
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
  
        <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul class="navbar-nav"> 
            <li class="nav-item">
              <a class="btn btn-outline-light btn-sm d-flex align-items-center nav-link" :href="githubRepo" target="_blank">
                <i class="fab fa-github me-2"></i> GitHub
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link btn btn-outline-light btn-sm d-flex align-items-center" :href="shopLink" target="_blank">
                <i class="fas fa-shopping-cart me-2"></i> Shop
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link btn btn-outline-light btn-sm donate-button" :href="donateLink" target="_blank">
                <i class="fas fa-donate me-2"></i> Donate
              </a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  
  </template>
  
  <script setup>
  import { RouterLink, RouterView } from 'vue-router'
  import { ref } from "vue";
  import { useDrillStore } from "@/stores/drillStore";

  import UploadDrillFile from "@/components/UploadDrillFile2.vue";

  

const drillStore = useDrillStore();
  
  // Define links for GitHub, Shop, and Donate
  const githubRepo = ref("https://github.com/RinthLabs/SolderSidekick");
  const shopLink = ref("https://rinthlabs.com/products/solder-sidekick-notification-sign-up");
  const donateLink = ref("https://www.paypal.com/donate/?hosted_button_id=CF4B9M4MD2HY2");
  

  const saveProject = () => {
  const project = {
    drillFilename: drillStore.drillFilename,
    drillData: drillStore.drillData,
    path: drillStore.path,
    originOffsetX: drillStore.originOffsetX,
    originOffsetY: drillStore.originOffsetY,
    toolSizes: drillStore.toolSizes,
    pcbThickness: drillStore.pcbThickness,
    mountHeight: drillStore.mountHeight,
    feedPrime: drillStore.feedPrime,
    feedRetract: drillStore.feedRetract,
  };

  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });

  const baseName = drillStore.drillFilename
    ? drillStore.drillFilename.replace(/\.[^/.]+$/, "") // remove .drl or .txt extension
    : "solder-project";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}.soldersidekick.json`;
  a.click();
  URL.revokeObjectURL(url);
};

  </script>
  
  
  <style scoped>
  .nav-link {
    height: 60px !important;
    font-size: 1.25rem !important;
    padding: 0rem 1rem !important;
  }
  
  .donate-button {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 5px 12px;
    white-space: nowrap;
  }
  
  .logo {
    margin-left: 1.5rem;
  }

  </style>
  
  