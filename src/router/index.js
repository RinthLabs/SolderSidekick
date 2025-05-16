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

// On first page load, check if we were redirected
router.isReady().then(() => {
  const redirectPath = sessionStorage.getItem('redirectPath')
  if (redirectPath) {
    sessionStorage.removeItem('redirectPath')
    if (redirectPath !== window.location.pathname) {
      router.replace(redirectPath)
    }
  }
})

export default router
