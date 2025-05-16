import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GettingStarted from '../views/GettingStartedView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { pageClass: 'toolpath-editor-page' },
    },
    {
      path: '/getting-started',
      name: 'getting-started',
      component: GettingStarted,
      meta: { pageClass: 'getting-started-page' },
    },
  ],
})

export default router
