<script setup>
import { ref } from "vue";
import Drill from "@/components/Drill.vue";
import DrillPreview from "@/components/DrillPreview.vue";
import MachineSettings from "@/components/MachineSettings.vue";
import GcodeOutput from "@/components/GcodeOutput.vue";

// Define links for GitHub, Shop, and Donate
const githubRepo = ref("https://github.com/YOUR-REPO"); // Replace with actual GitHub repo URL
const shopLink = ref("https://your-shop.com"); // Replace with actual shop URL
const donateLink = ref("https://your-donate-page.com"); // Replace with actual donation page URL
</script>

<template>
  <header class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <!-- Logo -->
      <a class="navbar-brand d-flex align-items-center" href="#">
        <img src="@/assets/logo.svg" alt="Logo" width="40" height="40" class="me-2" />
        Solder Sidekick
      </a>

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
            <a class="nav-link d-flex align-items-center" :href="githubRepo" target="_blank">
              <i class="fab fa-github me-2"></i> GitHub
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link d-flex align-items-center" :href="shopLink" target="_blank">
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
}

/* Ensure all items, including donate button, are aligned */
.navbar-nav .nav-item {
  display: flex;
  align-items: center;
}

/* Fix vertical alignment of the Donate button */
.donate-button {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 5px 12px;
  white-space: nowrap;
}
</style>
