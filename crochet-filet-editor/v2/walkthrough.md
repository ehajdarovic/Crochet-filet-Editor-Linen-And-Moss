# Walkthrough - Version 1 & Version 2

We have successfully designed and built two distinct directions for your Crochet Filet Editor website. They are both hosted locally on the same development server so you can compare them side-by-side.

---

## 📁 File Structure & Locations
All files are saved in the project repository on your Desktop:
📁 **[crochet-filet-editor (Desktop)](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/)**

### Version 1 (Whimsical Y2K - Root & `v1/` subfolder)
- **[index.html](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/index.html)**: A single-column whimsical grid layout featuring Google Fonts (*DynaPuff*, *Henny Penny*, *Quicksand*), double outlines, and twinkling SVG background star clusters.
- **[styles.css](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/styles.css)**: Forest Green (`#456950`) and Mauve Pink (`#D2A3B5`) colors, bubble headliner badge styling, scalloped lace borders, and a Sun/Moon yarn spool theme toggle.
- **[editor.js](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/editor.js)**: Integrates coordinate mapping, history states, image uploads, and is theme-aware (swapping canvas background and grid fallbacks dynamically).

### Version 2 (Linen & Moss - `v2/` subfolder)
- **[v2/index.html](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/v2/index.html)**: Clean, spacious, minimal layout featuring Google Fonts (*Cormorant Garamond* and *Inter*), a dedicated ambient canvas for floating particles, and SVG cloth-distortion filters (`#organic-cloth-displacement`).
- **[v2/styles.css](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/v2/styles.css)**: Foggy Linen (`#E8E5DF`) and Muted Moss (`#4A563E`) color tokens, microscopic warp-and-weft canvas textures, hanging tapestry sway animations, and minimal tactile controls.
- **[v2/editor.js](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/v2/editor.js)**: Runs the ambient background particle engine (floating dust and thread lint that repel when the cursor approaches) and the generative thread mesh rendering engine (programmatic warp & weft mesh with connected bezier curves).

---

## 🌐 How to Preview & Compare
Your local development server is running in the background at:
👉 **`http://localhost:8000/`**

1. **Version 1 (Whimsical Y2K):** Navigate to **`http://localhost:8000/`** (or `http://localhost:8000/v1/`).
2. **Version 2 (Linen & Moss):** Navigate to **`http://localhost:8000/v2/`**.

---

## 🛠️ Key Features of Version 2 (Digital Textile Ecology)

1. **Ambient Air Particles:** 40 tiny dust motes and curly thread lint fibers float slowly on the background, shifting organically and drifting away from your cursor when you move the mouse.
2. **Tapestry Sway:** The p5 canvas is warped by an SVG displacement filter to soften hard borders, and sway-animates gently over time like a linen tapestry hanging in the wind.
3. **Generative Thread Rendering:**
   - **Open Mesh (0):** Rendered as thin, semi-transparent warp and weft lines.
   - **Closed Mesh (1):** Rendered as thick, textured hand-spun yarn strands. When cells align, wavy bezier curves weave them together.
4. **Weave Duplicator (Cloning & Replicating Motifs):**
   - Harvest and duplicate segments of your grid instantly using a smart clipboard state machine.
5. **Discovered Controls:** Tactile outline buttons, minimal text parameters, and a custom upload dropzone that look like raw felt.

---

## 🌾 How to Use the Weave Duplicator (Cloning & Rotation Tool)
We added a tactile duplicator tool inside the **Ecology Controls** sidebar:

1. Click the **Select Motif** button. You'll see a floating linen banner appear: *"Drag a frame on the grid to copy"*.
2. **Select Area:** Click and drag your mouse/finger across the canvas. A glowing dashed outline representing crawling thread fibers will frame your selection.
3. **Motif Cloned:** Release your mouse. The selection is copied, and the sidebar exposes **Rotate** and **Cancel** buttons.
4. **Sprout Preview:** As you hover your mouse back over the canvas, a translucent layout of your copied motif floats under your cursor.
5. **Rotate Motif:** Press **`R`** on your keyboard (or click **Rotate (R)** in the sidebar) to spin the motif 90 degrees clockwise. You can press it repeatedly to rotate it 180 or 270 degrees to connect it to different parts of your grid!
6. **Replicate/Paste:** Click anywhere on the canvas to place a clone of the motif. You can click multiple times to plant a repeating sequence of stitches across the grid.
7. **Cancel/Exit:** Press **`Escape`** (or click **Cancel (Esc)** in the sidebar) to clear the clipboard and return to normal draw/erase mode.
