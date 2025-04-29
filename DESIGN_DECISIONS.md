# 🔥 Solder Sidekick Design Decisions

This page highlights key design decisions behind **Solder Sidekick** — a project to convert an Ender-3 3D printer into a reliable through-hole soldering robot.
Our goal was to create a machine that is **affordable**, **simple to assemble**, **open-source**, and **effective** for small production runs and prototypes.

---

## 🧠 Overview

Solder Sidekick is a semi-assembled hardware kit and web interface that turns a common Ender-3 3D printer into an automated through-hole soldering machine.

The system includes:
- A web-based G-code generator that takes **drill files** from Gerber PCB exports
- A mechanical mount to install a **soldering iron vertically** on the Ender-3
- A **direct solder wire feed** using the Ender-3's original Bowden tube
- **Connecting bricks** on the bed to hold PCBs of various sizes without complex tooling

The kit aims to make robotic soldering **accessible and practical** without expensive or proprietary equipment.

---

## 🔩 Why an Ender-3 3D Printer?

The **Ender-3** was selected because:
- 🏭 **Proven reliability**: It's been mass-produced for years.
- 💵 **Low cost**: Affordable worldwide, often under $200 USD.
- 🔧 **Open-source**: Easy to source parts, mods, and firmware support.
- 🛠️ **Large build volume**: Supports PCBs up to ~200mm x 200mm.
- 📦 **Bowden extruder**: The stock Bowden tube can guide 1mm solder wire **without modification**.
- 🧩 **Modular**: Frame and motion system are easy to customize for different projects.

We wanted a platform that users can **trust**, **easily repair**, and **modify**.

---

## 🛠 Why is the Soldering Iron Mounted Vertically?

Mounting the soldering iron **vertically** provides major advantages:
- ✏️ **Simplified mechanical design**: No need for tilt or rotation mechanisms.
- 🚀 **No firmware changes**: Keeping the iron fixed allows full reuse of stock Ender-3 firmware.
- 🔒 **Avoids tall component collisions**: A vertical approach minimizes chances of side collisions with components.
- 🔥 **Custom machined tip**: A groove cut into the soldering iron tip allows precise control of solder placement even with a fixed vertical orientation.

This design reduces complexity and improves reliability for users building their own system.

---

## 🔗 Why Use Connecting Bricks on the Bed?

We needed a way to **hold PCBs of many different sizes** securely while allowing fast changeovers.

Connecting bricks were chosen because:
- 🧱 **Flexible layout**: Position multiple PCBs or odd-shaped boards easily.
- ⚡ **Fast setup and teardown**: No bolts or fixed plates required.
- 🛠️ **Customizable jigs**: STEP files are included so users can 3D print **custom fixtures** that snap into the brick system.
- 🔩 **Sufficient strength**: Strong enough for soldering without movement but fast to rearrange between jobs.

Alternative options like drilled plates were considered but rejected due to longer setup times and lower flexibility.

---

## 🧰 Web Interface and G-code Generation

Instead of writing tedious G-code by hand, the web interface:
- Accepts **drill files** exported from common PCB CAD software.
- Lets you configure solder settings (e.g., tip dwell time, retract settings).
- Generates **ready-to-run G-code** for the Ender-3 printer.

This reduces the learning curve dramatically and enables faster job preparation.

---

# 🎯 Design Philosophy

The design philosophy behind Solder Sidekick is:

| Goal                 | How we achieve it                                     |
|----------------------|--------------------------------------------------------|
| Easy for hobbyists    | Minimal custom parts, reuses stock 3D printer systems  |
| Affordable            | No expensive motion controllers, uses open hardware   |
| Modular and scalable  | Supports multiple PCB sizes, reconfigurable bed setup |
| Open source           | Hardware and software are free to study, use, and improve |

---

# 🤝 Feedback Welcome!

If you have suggestions, ideas, or improvements, [open an issue](https://github.com/RinthLabs/SolderSidekick/issues)!
Your feedback helps make Solder Sidekick better for everyone.