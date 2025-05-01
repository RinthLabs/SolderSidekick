
<template>
  <div class="app-root">
   

<header class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <!-- Logo -->
      <a class="navbar-brand d-flex align-items-center" href="#">
        <img src="/logo/solder-sidekick-logo-dark-bg.svg" alt="Solder Sidekick Logo" height="40" class="me-2" />
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
            <a class="nav-link btn btn-outline-light btn-sm d-flex align-items-center" :href="githubRepo" target="_blank">
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

    <RouterView />
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref } from "vue";

// Define links for GitHub, Shop, and Donate
const githubRepo = ref("https://github.com/RinthLabs/SolderSidekick");
const shopLink = ref("https://rinthlabs.com/products/solder-sidekick-notification-sign-up");
const donateLink = ref("https://www.paypal.com/donate/?hosted_button_id=CF4B9M4MD2HY2");

</script>


<style scoped>


</style>
