# 📦 Solder Sidekick™

Turn your Ender-3 3D printer into a **robotic soldering machine** for through-hole PCBs — powered by open-source software and hardware.


[![Notification Sign Up](/docs/solder-sidekick-1.jpg)](https://rinthlabs.com/products/solder-sidekick-notification-sign-up)

👉 [**This project is still being developed, sign up to be one of the first to know when it's released!**](https://rinthlabs.com/products/solder-sidekick-notification-sign-up)

---

## ⚡ What is Solder Sidekick™?

Solder Sidekick™ is an **open-source project** that converts a standard **Ender-3 3D printer** into an **automated through-hole soldering robot**.

It uses a **simple web interface** where you upload your **drill files** (from your Gerber PCB files), configure your component settings, and generate the **G-code** needed to precisely solder each pin.

[👉 Launch the Solder Sidekick™ Web App](https://rinthlabs.com/products/solder-sidekick-notification-sign-up)

- 🔥 Automates tedious manual soldering
- 🔥 Reduces human error
- 🔥 Great for small-run production and prototypes
- 🔥 Designed to be **affordable**, **modular**, and **extensible**

---

## 🛠 Why is Solder Sidekick™ valuable?

Soldering lots of **through-hole parts** by hand is time-consuming, tiring, and error-prone — especially for **small businesses**, **makers**, and **prototype builders**.  
Until now, solutions were either:
- Very expensive (industrial selective soldering machines) 💸
- Very DIY and unreliable 🛠️

**Solder Sidekick™** solves this by offering:
- An easy-to-assemble hardware kit
- An intuitive browser-based software tool
- Low-cost conversion based on an Ender-3 (a widely available 3D printer)

---

## 🏪 Get a Kit (Save Time and Hassle!)

While Solder Sidekick™ is open-source, sourcing the parts and machining the custom soldering iron tips can be difficult.

**Buying a full kit from our Shopify store** makes your life much easier:
- ✅ All hardware parts included (except Ender-3)
- ✅ Included custom machined soldering tips
- ✅ Semi-assembled kit saves you time
- ✅ Supports the project!

👉 [**Notification Sign Up for when it's released!**](https://rinthlabs.com/products/solder-sidekick-notification-sign-up)

---

## 🧪 Example PCB Breadboard

Want to test out the Solder Sidekick™ right away? We include a custom breadboard-style PCB in each kit as a sample project — great for demos and getting started.

[![Notification Sign Up](/docs/solder-sidekick-breadboard.jpg)

![PCB Breadboard](/example/screenshot.png)

This board is:
- Based on an open-source design by [Soldered Electronics](https://www.soldered.com/)
- Modified to include ["locking pin"](https://web.archive.org/web/20241003224515/https://www.sparkfun.com/tutorials/114) footprints for easier soldering
- Branded with the Solder Sidekick logo

You can find the gerber and drill files for the example [**PCB Breadboard**](./example/) in this repository.

📎 The breadboard PCB is licensed under the [TAPR Open Hardware License v1.0](https://tapr.org/the-tapr-open-hardware-license/), with all original and modified work credited and preserved.

👉 Learn more or browse the design files:
[PCB Breadboard](https://github.com/RinthLabs/PCB-breadboard-locking-pins-hardware-design)

---

## 🚫 No-Go Zones

No-Go Zones let you mark **rectangular areas on the build plate** that the soldering path must avoid — for example, where clamps, fixtures, or tall components block the soldering iron.

### How it works

1. Click the **No-Go Zone** button in the toolbar (it turns red when active, and the cursor becomes a crosshair)
2. **Click and drag** on the canvas to draw a rectangular exclusion area
3. Draw as many zones as you need — each is shown as a hatched red rectangle labeled "NO-GO"
4. **Click on an existing zone** (while in No-Go mode) to **delete** it
5. Click the **No-Go Zone** button again to exit drawing mode

### Effect on path generation

- **Auto Optimize Path** will never route the travel path through a no-go zone. When the direct line between two solder points crosses a zone, the path is automatically routed around the zone corners using the shortest detour.
- **Points inside a no-go zone** are excluded from the optimized path entirely.
- **Manually added points** (clicked directly on the canvas) are unaffected — no-go zones only filter the auto optimizer.
- The **Optimize Selection** command also respects no-go zones when ordering selected points.
- No-go zones are **saved and loaded** with project files (`.soldersidekick.json`).

### How the routing works

When a straight-line path between two solder points would cross a no-go zone, the system computes the shortest clear detour around it:

1. The offset corners of each zone (with a small clearance margin) serve as potential waypoints
2. A visibility graph is built — two waypoints are connected only if the line between them doesn't cross any zone
3. Dijkstra's shortest-path algorithm finds the optimal route through the waypoints
4. The resulting detour waypoints appear as **orange diamond markers** on the canvas
5. In the generated G-code, the detour is emitted as `G0` rapid moves at safe Z height between solder points

---

## 🎬 G-code Simulator

The built-in simulator lets you **preview the entire soldering run in 3D** before sending G-code to the printer.

### Opening the simulator

Click the **Simulate** button (next to "Save G-code") in the toolbar. A fullscreen modal opens with an interactive Three.js viewport.

### What you'll see

- **Build plate** with a tiled texture matching the interconnecting brick plate pattern from the 2D editor
- **PCB board** rendered at the correct thickness from your profile settings, with colors matching the 2D view branding
- **Drill holes** (dark circles) and **solder pads** (red rings) at the exact positions from your drill file
- **No-go zones** shown as translucent red boxes
- **Toolpath line** tracing the full G-code route
- **Animated soldering iron** that moves through the G-code in real time — tilted 10° to match the physical iron angle, with a glowing tip effect when near the PCB surface

### Playback controls

- **Play / Pause** and **Restart** buttons
- **Previous / Next solder point** skip buttons to jump between solder points
- **Timeline scrubber** with orange markers showing each solder point's position — click any marker to jump there
- **Point counter** showing which solder point you're at (e.g. "12/42")
- **Speed selector** (1×, 2×, 5×, 10×, 25×, 50×)
- **M117 status messages** from the G-code are displayed in the header

### Loading a custom 3D model (GLB/GLTF/STL/STEP/IGES)

You can optionally replace the default green PCB with an actual 3D model of your board and components:

1. Click **Load 3D Model** in the simulator header
2. Select a `.glb`, `.gltf`, `.stl`, `.step`/`.stp`, or `.iges`/`.igs` file — KiCad 8+ can export GLB or STEP directly. STEP and IGES files are parsed natively in the browser using a WebAssembly engine (~8 MB one-time download on first use). Models are loaded at their native scale, so they should match your drill data if exported from the same design.
3. Use the **Adjust Model** overlay panel (top-right of the viewport) to align the model:
   - **Rotate** the model in 90° steps around the X, Y, or Z axis
   - **Offset** the model along any axis with a selectable step size (0.1 / 0.5 / 1 / 5 mm)
   - **Reset** to snap back to the initial position
   - **Save** the adjustment settings to a `model-alignment.json` file so you can reuse them
   - **Load** a previously saved settings file to instantly restore alignment — useful when you use the same model and tooling across multiple sessions
4. Click **Remove Model** to revert to the default generated PCB

---

## 🚀 Getting Started Guide

Ready to bring your Solder Sidekick™ to life?

Follow our step-by-step setup guide to:

1. 🧩 **Assemble your kit**
2. 🧾 **Prepare your PCB drill files**
3. 🧠 **Generate G-code using the web app**
4. ❓ **Browse FAQs and troubleshooting tips**

👉 [**Start Here: Solder Sidekick Setup & Guide**](https://www.soldersidekick.com/getting-started)

Whether you're soldering your first board or tuning your workflow, this page has everything you need to hit the ground running.

---

## 🧰 Recommended Gear
To get the most out of your Solder Sidekick™, we recommend picking up the following essentials:

🖨️ Compatible Printer
Solder Sidekick is designed specifically for the Ender-3 3D printer. Other printers may require custom modifications.

[![Ender 3 3D Printer](./docs/ender3-small.jpg)
<br>👉 Buy on Amazon](https://amzn.to/43fXs6A)

---

🧵 Recommended Solder
We suggest using 0.6mm solder for optimal feed performance and joint coverage.

[![Ender 3 3D Printer](./docs/solder-0.6mm-small.jpg)
<br>👉 Buy on Amazon](https://amzn.to/44WLI9R)

---

Note: These are Amazon affiliate links. If you make a purchase, a small portion helps fund the development of the Solder Sidekick™ project — at no extra cost to you. ❤️

---

## 💖 Support the Project

This project is **community-driven** and **open-source**!

- 🌟 [Sponsor Solder Sidekick™ on GitHub](https://github.com/BenRinthLabs) to help fund development
- 🔧 Contribute code, documentation, or testing
- 📣 Spread the word!

---


## 🖥 How to Run the Web Interface Locally

If you want to **develop** or **run the web interface locally**:

1. Clone this repo:
   ```bash
   git clone https://github.com/RinthLabs/SolderSidekick.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```
   http://localhost:5173/
   ```

> 📢 Pull requests are welcome! Feel free to open an issue or contribute a new feature!

---

# 🚀 Quick Links

- 🏪 [Buy a Solder Sidekick Kit](https://rinthlabs.com/products/solder-sidekick-notification-sign-up)
- 💬 [Sponsor Solder Sidekick on GitHub](https://github.com/sponsors/BenRinthLabs)
- 📖 [Documentation (coming soon)](#)

---

# 🛠 License

This project is licensed under the **MIT License** — free to use, modify, and share!

---

# 🎉 Thank you for supporting open-source hardware!