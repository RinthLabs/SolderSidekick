

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

import '@fortawesome/fontawesome-free/css/all.css';

import './assets/main.css';


import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPersist from "pinia-plugin-persistedstate"; // ✅ Ensure correct import

import App from './App.vue';
import router from './router';

const pinia = createPinia();
pinia.use(piniaPersist); // ✅ Enable persistence

const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount('#app');
