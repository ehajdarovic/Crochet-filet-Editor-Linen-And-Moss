# Linen & Moss — Digital Textile Ecology

**Linen & Moss** is an interactive filet crochet editor designed to bridge binary stitch logic with organic digital aesthetics. Rather than presenting a sterile pixel grid, the canvas simulates a tactile linen membrane where crochet stitches behave like mycelial threads or lichen structures growing in an ecosystem.

Features include dynamic grid scaling (up to 100x100) with offscreen double-buffering for fluid 60 FPS editing, ambient particle animations, and multi-version aesthetics.

![Linen & Moss Page](assets/Linen_and_Moss-Digital_Textile_Ecology_Page.png)

----------------------------------------------------------------------------------
![Full View - Linen & Moss Page](assets/Linen_and_Moss—Digital_Textile_Ecology.pdf)

## 🎨 Three Distinct Editions

Linen & Moss was made with 3 iterative versions (root being the final version) that provide three unique interactive experiences:
1. **Root Engine (`/`)**: Photographic Tile editor rendering high-fidelity woven thread and yarn texture tiles (both open and filled cells) on a light/dark organic background.
![Linen & Moss Blueprint Example](assets/linen_moss_blueprint-2.png)
2. **Ecology Version 2 (`/v2/`)**: Procedural Yarn Curve editor rendering soft, winding green thread curves simulating organic growth, connections, and live-tension warping. 
![Linen & Moss Blueprint Example](assets/linen_moss_blueprint-1.png)
3. **Heritage Version 1 (`/v1/`)**: Whimsical Y2K-inspired translucent aesthetic edition with lightweight pixel layouts.
![Linen & Moss Blueprint Example](assets/linen_moss_blueprint-3.png)
---

## ✨ Key Interactive Features

* 🕸️ **Offscreen Double-Buffering**: Hand-drawn canvas caching to allow latency-free drawing and scrolling, even at maximum 100x100 grid density (10,000 active cells).
* 🖼️ **Organic Image Upload**: Drop any image (JPEG, PNG, SVG) into the dropzone, adjust the **Fiber Growth Threshold**, and watch the system extract and translate it into a custom filet blueprint.
* 🔄 **Weave Duplicator (Motif Stamping)**:
  * Select any area of your grid to copy.
  * Preview the motif dynamically floating under your cursor.
  * **Rotate (`R`)**: Rotate the motif 90° clockwise.
  * **Reflect (`F`)**: Flip the motif horizontally (inverse projection).
  * Stamp it with a click or dismiss with **Cancel (`Esc`)**.
* 🌗 **Ambient Lighting (Theme Toggle)**: Toggle between daylight editing and dark night-weaving with ambient dust particles drifting across the interface.
* 💾 **Thread Blueprint Export**: Download a high-quality, high-resolution PNG image of the grid pattern ready to print or share.
* 🔢 **Numbered Blueprint Export**: Export a clean, high-contrast technical grid blueprint mapping empty cells as white and filled cells as light moss green. Row numbers (bottom-to-top) and column numbers (left-to-right) are drawn on the margins, with heavy grid lines every 5 cells for easy crochet pattern tracking.

---

## 🚀 Running Locally

The project consists of static HTML/CSS/JavaScript and does not require a compilation step. It can be run using any local static file server.

### Option 1: Ruby (Built-in on macOS)
```bash
ruby -run -e httpd . -p 8000
```
Then open [http://localhost:8000/](http://localhost:8000/) in your browser.

### Option 2: Node.js (`http-server`)
```bash
npx http-server -p 8000
```

### Option 3: Python
```bash
python3 -m http.server 8000
```
