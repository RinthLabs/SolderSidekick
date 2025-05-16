<template>
    <div class="getting-started">
      <!-- Hero -->
      <section class="hero">
        <img src="/logo/solder-sidekick-logo-light-bg.svg" alt="Solder Sidekick" class="logo" />
        <p class="tagline">Let's get you soldering in no time.</p>
      </section>
  
      <!-- Step 1 -->
      <section>
        <h2>1. Assemble Your Kit</h2>
        <p>Watch the video below to assemble your Solder Sidekick.</p>
        <div class="video-wrapper">

          <iframe src="https://www.youtube.com/embed/MGpWirqkfZk" title="Assembly Video" frameborder="0" allowfullscreen></iframe>
        </div>
      </section>
  
      <!-- Step 2 -->
      <section>
        <h2>2. Prepare Your PCB Files</h2>
        <p>Follow this video to get your circuit board files ready and export your drill file.</p>
        <div class="video-wrapper">
          <iframe src="https://www.youtube.com/embed/MGpWirqkfZk" title="Software Setup Video" frameborder="0" allowfullscreen></iframe>
        </div>
      </section>
  
      <!-- Step 3 -->
      <section>
        <h2>3. Generate G-code</h2>
        <p>Use our web app to convert your drill file into soldering G-code for your Ender 3 printer.</p>
        <a href="https://soldersidekick.com" class="button">Open Solder Sidekick Web App</a>
      </section>
  
      <!-- FAQ -->
      <section>
        <h2>Frequently Asked Questions</h2>
        <div v-for="(item, index) in faqs" :key="index" class="faq-item">
          <button @click="toggleFaq(index)">
            {{ item.question }}
            <span>{{ item.open ? '-' : '+' }}</span>
          </button>
          <div v-if="item.open" class="faq-answer">
            {{ item.answer }}
          </div>
        </div>
      </section>
  
      <!-- Resources -->
      <section>
        <h2>Resources</h2>
        <a href="https://github.com/RinthLabs/SolderSidekick" class="button">View on GitHub</a>
        <a href="https://rinthlabs.com/products/solder-sidekick-notification-sign-up" class="button">Buy Another Kit</a>
      </section>
    </div>
  </template>
  
  <script>
  export default {
    name: 'GettingStarted',
    data() {
      return {
        faqs: [
          {
            question: 'What drill file format do I need?',
            answer: 'Export your drill file as Excellon (.drl) from your PCB design software.',
            open: false,
          },
          {
            question: 'Can I use this with any printer?',
            answer: 'Solder Sidekick is designed for the Ender 3. Other printers may require custom mods. https://www.amazon.com/Comgrow-Creality-Ender-Aluminum-220x220x250mm/dp/B07BR3F9N6/',
            open: false,
          },
          {
            question: 'How much solder should I use?',
            answer: 'We recommend using 1.0mm solder for best results. https://www.amazon.com/Electronic-Soldering-Electrical-Activity-Diameter/dp/B09KT5P3N8/',
            open: false,
          },
        ],
      };
    },
    methods: {
      toggleFaq(index) {
        this.faqs[index].open = !this.faqs[index].open;
      },
    },
  };
  </script>
  
  <style scoped>
  .getting-started {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
    font-family: Arial, sans-serif;
  }
  
  .hero {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .logo {
    max-width: 150px;
    margin-bottom: 1rem;
  }
  
  .video-wrapper {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    margin-bottom: 1rem;
  }
  
  .video-wrapper iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .button {
    display: block;
    width: 100%;
    background: #66c6d0;
    color: white;
    text-align: center;
    padding: 1rem;
    margin-bottom: 1rem;
    text-decoration: none;
    border-radius: 8px;
  }
  
  .faq-item {
    margin-bottom: 1rem;
  }
  
  .faq-item button {
    width: 100%;
    background: #f4f4f4;
    padding: 0.75rem;
    text-align: left;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    display: flex;
    justify-content: space-between;
    cursor: pointer;
  }
  
  .faq-answer {
    padding: 0.75rem;
    background: #fff;
    border-left: 4px solid #66c6d0;
    margin-top: 0.5rem;
    border-radius: 4px;
  }

  h2{
    font-weight: 700;
  }

  .tagline{
    font-weight: 700;
  }

  .button{
    font-weight: 700;
  }
  </style>
  