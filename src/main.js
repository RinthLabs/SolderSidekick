

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import '@fortawesome/fontawesome-free/css/all.css';
import './assets/main.css';



import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPersist from "pinia-plugin-persistedstate";

import App from './App.vue';
import router from './router';

import CookieAcceptDecline from 'vue-cookie-accept-decline'

// ✅ Highlight.js
import 'highlight.js/styles/github-dark.min.css';
import hljs from "highlight.js/lib/core";
import gcode from "highlight.js/lib/languages/gcode";

hljs.registerLanguage("gcode", gcode);


const pinia = createPinia();
pinia.use(piniaPersist); // ✅ Enable persistence

const app = createApp(App);
app.use(pinia);
app.use(router);
app.component('CookieAcceptDecline', CookieAcceptDecline);
app.config.globalProperties.$hljs = hljs;
app.mount('#app');
