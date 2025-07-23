<template>
    <div class="getting-started">
      <!-- Hero -->
      <section class="hero">
        <img src="/logo/solder-sidekick-logo-light-bg.svg" alt="Solder Sidekick" class="logo" />
        <p class="tagline">Every Maker needs a Sidekick</p>
      </section>
  
      <!-- Step 1 -->
      <section>
        <div class="section-content">
          <h2>1. Assemble Your Kit</h2>
          <p>Watch the video below to assemble your Solder Sidekick.</p>
        </div>
        <div class="video-wrapper">
          <iframe src="https://www.youtube.com/embed/MGpWirqkfZk" title="Assembly Video" frameborder="0" allowfullscreen></iframe>
        </div>
      </section>
  
      <!-- Step 2 -->
      <section>
        <div class="section-content">
          <h2>2. Prepare Your PCB Files</h2>
          <p>Follow this video to get your circuit board files ready and export your drill file.</p>
        </div>
        <div class="video-wrapper">
          <iframe src="https://www.youtube.com/embed/MGpWirqkfZk" title="Software Setup Video" frameborder="0" allowfullscreen></iframe>
        </div>
      </section>
  
      <!-- Step 3 -->
      <section>
        <div class="section-content mb-5">
          <h2>3. Generate G-code</h2>
          <p>Use our web app to convert your drill file into soldering G-code for your Ender 3 printer.</p>
          <a href="https://soldersidekick.com" class="button">Open Solder Sidekick Web App</a>
        </div>
      </section>
  
      <!-- FAQ -->
      <section>
        <div class="section-content">
          <h2>Frequently Asked Questions</h2>
          <div v-for="(item, index) in faqs" :key="index" class="faq-item">
            <button @click="toggleFaq(index)">
              {{ item.question }}
              <span>{{ item.open ? '-' : '+' }}</span>
            </button>
            <div v-if="item.open" class="faq-answer" v-html="item.answer"></div>
          </div>
          <p class="faq-note">Note: Some links are Amazon affiliate links. Purchases help support the Solder Sidekick open source project.</p>
        </div>
      </section>
  
      <!-- Resources -->
      <section>
        <div class="section-content mb-5">
          <h2>Resources</h2>
          <a href="https://github.com/RinthLabs/SolderSidekick" class="button">View on GitHub</a>
          <a href="https://rinthlabs.com/products/solder-sidekick-notification-sign-up" class="button">Buy Another Kit</a>
        </div>
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
            answer: 'Export your drill file as Excellon (.drl) from your PCB design software.<br><img src="/faq/drill-file-example.jpg" alt="Drill File Example">',
            open: false,
          },
          {
            question: 'Can I use this with any printer?',
            answer: 'Solder Sidekick is designed for the Ender 3. Other printers may require custom mods.<br><a href="https://amzn.to/43fXs6A" target="_blank"><img src="/faq/ender3.jpg" alt="Ender 3 3D Printer"><br>Buy on Amazon</a>',
            open: false,
          },
          {
            question: 'What type of solder should I use?',
            answer: 'We recommend using 0.6mm solder for best results.<br><a href="https://amzn.to/44WLI9R" target="_blank"><img src="/faq/solder-0.6mm.jpg" alt="0.6mm Solder"><br>Buy on Amazon</a>',
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
    width: 100%;
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
  
  .section-content {
    padding: 0 1rem;
  }
  
  .video-wrapper {
    width: 100%;
    aspect-ratio: 16 / 9;
    margin-bottom: 1rem;
    border: none;
  }
  
  .video-wrapper iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
  
  .button {
    display: block;
    width: 100%;
    background: #66c6d0;
    color: white;
    text-align: center;
    padding: 1rem;
    margin-top: 1rem;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 700;
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
  
  .faq-answer a {
    color: #66c6d0;
    text-decoration: underline;
  }
  
  .faq-answer img {
    max-width: 100%;
    height: auto;
    margin-top: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ddd;
  }
  
  .faq-note {
    font-size: 0.9rem;
    color: #666;
    margin-top: 1rem;
    font-style: italic;
  }
  
  h2 {
    font-weight: 700;
  }
  
  .tagline {
    font-weight: 700;
  }
  </style>
  
  <style>
.faq-answer img {
  max-width: 20%;
  height: auto;
  margin-top: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>
  