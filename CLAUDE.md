# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Solder Sidekick™ is a web application that converts 3D printers into automated soldering robots. It processes Excellon drill files from PCB design software and generates G-code to control the printer for automated through-hole soldering.

## Commands

### Development
- `npm run dev` - Start the development server on http://localhost:5173
- `npm run build` - Build for production
- `npm run preview` - Preview the production build

### Testing
No test framework is currently configured. When implementing tests, consider adding Vitest for unit tests and Playwright/Cypress for E2E tests.

### Code Quality
No linting or formatting tools are configured. Consider adding ESLint and Prettier when requested.

## Architecture

### Tech Stack
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **State Management**: Pinia with persistence plugin (localStorage)
- **3D Visualization**: Three.js
- **UI Framework**: Bootstrap 5
- **Router**: Vue Router

### Key Components

1. **State Management** (`src/stores/drillStore.js`):
   - Central store managing drill data, machine profiles, and G-code generation
   - Persisted to localStorage
   - Handles profile management, drill file processing, and configuration

2. **Core Functionality**:
   - **File Processing**: `src/composables/useFileHandlers.js` - Parses Excellon drill files
   - **G-code Generation**: `src/composables/useGcodeGenerator.js` - Converts drill points to G-code using customizable templates
   - **2D Visualization**: `src/components/ToolpathEditor.vue` - Interactive canvas editor for PCB preview and path editing
   - **3D Simulator**: `src/components/GcodeSimulator.vue` - Three.js G-code simulator with animated soldering iron, solder point timeline markers/skip navigation, and optional GLB/GLTF/STL/STEP/IGES model loading

3. **Main Views**:
   - **HomeView**: Main toolpath editor interface
   - **GettingStartedView**: User guide and documentation

### G-code Generation Flow
1. User uploads Excellon drill file
2. File is parsed to extract drill coordinates
3. Points are optimized using nearest-neighbor algorithm (with no-go zone avoidance)
4. G-code is generated using customizable templates (start, per-point, end)
5. Waypoint G0 rapid moves are inserted between solder points when the path must route around no-go zones
6. User can preview in 2D canvas, simulate in 3D, and download the result

### Important Implementation Details

- **Coordinate System**: Uses Three.js coordinate system with transformations for PCB visualization
- **Path Optimization**: Implements nearest-neighbor algorithm for efficient soldering paths, with no-go zone avoidance using visibility graph + Dijkstra shortest path routing
- **No-Go Zones**: Rectangular exclusion areas (bed coordinate space) that the path must avoid. Stored in `drillStore.noGoZones`. Points inside zones are excluded; path segments crossing zones are routed around zone corners via `computeRouteAroundZones()`. Waypoints appear in both canvas rendering and G-code output.
- **Templates**: G-code templates support variable substitution for coordinates and offsets
- **Mobile Support**: Detects mobile devices and shows appropriate messaging
- **Analytics**: Includes Google Analytics and Facebook Pixel integration
- **Persistence**: All configuration and profiles stored in localStorage via Pinia plugin
- **G-code Simulator**: `GcodeSimulator.vue` parses actual G-code (G0/G1 moves, G4 dwells, G92 origin, M117 messages) to animate a soldering iron in a Three.js scene. Uses `requestAnimationFrame` with timeline interpolation. The iron is tilted 10° to match the physical setup. Scene uses Z-up convention. Build plate uses a canvas-generated tiled texture matching the 2D editor's brick grid pattern. Colors/branding match the 2D view. Solder point dwell commands are extracted as timeline markers with prev/next skip navigation and a point counter.
- **3D Model Loading**: Supports GLB/GLTF (via `GLTFLoader`), STL (via `STLLoader`), and STEP/IGES (via `occt-import-js` WebAssembly, lazy-loaded on first use ~8 MB WASM). Models are loaded at native scale (no auto-scaling). GLB/GLTF and STEP/IGES models are rotated from Y-up to Z-up. PCB-related objects are grouped in a `pcbGroup` for easy removal/replacement. The loaded model is wrapped in a `modelPivot` group (centered on the model's bounding box) that supports user-controlled 90° rotation steps and mm-level offset adjustments via an overlay panel. Adjustment settings (rotation + offset relative to base) can be saved/loaded as a `model-alignment.json` file for reuse across sessions. The WASM file for STEP support lives in `public/occt-import-js.wasm` and is only fetched when a STEP/IGES file is loaded.

## Development Notes

- The project targets Ender-3 3D printers specifically
- No authentication system - runs entirely client-side
- File processing happens in the browser using FileReader API
- Bootstrap modals are used extensively for UI interactions
- The app includes cookie consent management for compliance