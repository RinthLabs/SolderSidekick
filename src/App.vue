
<template>
  <div class="app-root">

    <div v-if="isMobile" class="mobile-message">
      <img src="/logo/solder-sidekick-logo-dark-bg.svg" alt="Solder Sidekick Logo" class="mobile-logo" />
      <p class="mobile-text">
        We're sorry, Solder Sidekick isn't available on mobile devices just yet.<br />
        Please use a desktop or laptop for the best experience.
      </p>
    </div>

    <div v-else> 
   
    <RouterView />

    <CookieAcceptDecline
  elementId="cookie-banner"
  @decline="handleDecline"
  @accept="handleAccept"
  :position="'bottom'"
  :type="'floating'"
  :showDeclineButton="true"
  :buttonText="'Accept cookies'"
  :declineButtonText="'Decline'"
>
<template #default>
  <div class="cookie-content">
    <div class="cookie-text">
      We use cookies to ensure you get the best experience on our website. <a href="https://www.soldersidekick.com/privacy.html" target="_blank">Learn More...</a>.
    </div>
    <div class="cookie-buttons">
      <button class="cookie-decline" @click="handleDecline">Decline</button>
      <button class="cookie-accept" @click="handleAccept">Accept cookies</button>
    </div>
  </div>
</template>

</CookieAcceptDecline>
  </div>


</div>

</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref, onMounted } from "vue";

const isMobile = ref(false)

// Define links for GitHub, Shop, and Donate
const githubRepo = ref("https://github.com/RinthLabs/SolderSidekick");
const shopLink = ref("https://rinthlabs.com/products/solder-sidekick-notification-sign-up");
const donateLink = ref("https://www.paypal.com/donate/?hosted_button_id=CF4B9M4MD2HY2");

// ✅ Define handlers for cookie component
const handleAccept = () => {
  console.log("Cookies accepted");
  localStorage.setItem("cookieConsent", "accepted");

  // Google Analytics
  loadGoogleAnalytics();

  // Facebook Pixel
  loadFacebookPixel();
};

const handleDecline = () => {
  console.log("Cookies declined");
  localStorage.setItem("cookieConsent", "declined");
};


function loadGoogleAnalytics() {
  if (window.gtag) return; // already loaded
  const script = document.createElement("script");
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-X05KGJR14W"; // Replace with your GA ID
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', 'G-X05KGJR14W', { anonymize_ip: true });
}

function loadFacebookPixel() {
  if (window.fbq) return;
  !(function(f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script');

  fbq('init', '510286129836083'); // Replace with your pixel ID
  fbq('track', 'PageView');
}

onMounted(() => {
  isMobile.value = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const consent = localStorage.getItem("cookieConsent");
  if (consent === "accepted") {
    loadGoogleAnalytics();
    loadFacebookPixel();
  }
});




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

<style>
/* GLOBAL Cookie Banner Styles (not scoped!) */
#cookie-banner {
  position: fixed !important;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: var(--bs-dark);
  color: var(--bs-light);
  padding: 1rem 2rem;
  font-size: 1rem;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.3);

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}


#cookie-banner a {
  color: var(--bs-primary);
  text-decoration: underline;
}

#cookie-banner a:hover {
  color: var(--bs-primary-hover);
  text-decoration: none;
}

/* Match layout of buttons + text */
.cookie__floating__wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  flex-grow: 1;
}

.cookie__floating__buttons {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

/* Accept (Primary) */
.cookie__floating__buttons__button--accept {
  background-color: var(--bs-primary);
  color: var(--bs-light);
  border: none;
  padding: 0.4rem 1rem;
  font-size: 0.95rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.cookie__floating__buttons__button--accept:hover {
  background-color: var(--bs-primary-hover);
}

/* Decline (Secondary) */
.cookie__floating__buttons__button--decline {
  background-color: var(--bs-secondary);
  color: var(--bs-light);
  border: none;
  padding: 0.4rem 1rem;
  font-size: 0.95rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.cookie__floating__buttons__button--decline:hover {
  background-color: var(--bs-secondary-hover);
}

.mobile-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  padding-bottom: 15vh;
  text-align: center;
  background-color: var(--bs-dark);
  color: var(--bs-light);
}

.mobile-logo {
  width: 180px;
  max-width: 60vw;
  margin-bottom: 1.5rem;
}

.mobile-text {
  font-size: 1.25rem;
  max-width: 500px;
  line-height: 1.6;
  color: var(--bs-light);
}


</style>

