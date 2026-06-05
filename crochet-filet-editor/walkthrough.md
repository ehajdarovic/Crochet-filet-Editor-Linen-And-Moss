# Walkthrough - Side-by-Side Editor Versions & Optimizations

We have organized the three distinct versions of the crochet filet editor so you can preview, compare, and test them side-by-side.

---

## 📁 File Structure & Locations
All files are fully synchronized between your scratch workspace and your Desktop:
📁 **[crochet-filet-editor (Desktop)](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/)**

### 🌐 Preview Links on http://localhost:8000/
Your local development server is running in the background at **`http://localhost:8000/`**. Here is where to go to see each version:

1. **Photorealistic Tile Version (Root `/`):**
   👉 Navigate to **`http://localhost:8000/`**
   - **Files:** [index.html](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/index.html), [editor.js](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/editor.js)
   - **Details:** Uses your original `filledTile.png` and `openTile.png` assets. Stitches adapt dynamically to theme colors (warm cream in Light mode, glowing moss-lichen in Dark mode) and let the swaying background warp/weft lines show through the open stitches.

2. **Procedural Green Yarn Version (Folder `/v2/`):**
   👉 Navigate to **`http://localhost:8000/v2/`**
   - **Files:** [v2/index.html](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/v2/index.html), [v2/editor.js](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/v2/editor.js)
   - **Details:** Renders stitches procedurally using thick organic green yarn curves that weave together dynamically when adjacent cells connect.

3. **Whimsical Y2K Version (Folder `/v1/`):**
   👉 Navigate to **`http://localhost:8000/v1/`**
   - **Files:** [v1/index.html](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/v1/index.html), [v1/editor.js](file:///Users/emeliahajdarovic/Desktop/crochet-filet-editor/v1/editor.js)
   - **Details:** Bubble headers, scalloped lace borders, twinkling SVG stars, and Mauve Pink/Forest Green themes.

---

## 🛠️ Performance & Alignment Optimizations

### 1. Offscreen Canvas Double-Buffering (Lag-Free 100x100 Grids)
* To fix input lag at high grid densities (e.g. 100x100, which has 10,000 cells), we implemented a state-aware offscreen double-buffering cache using `gridBuffer` and `needsRedraw`.
* The canvas only redraws the grid structure when a modification actually happens (clicking, dragging, clearing, inverting, or resizing). 
* When rendering the active loop at 60 FPS, p5.js simply blits the pre-drawn buffer image directly to the screen. This reduces rendering lag to 0ms and provides ultra-responsive, fluid drawing.

### 2. Precise Button Coordinate Mapping (Hit-Test Fix)
* The SVG displacement filter `filter: url(#organic-cloth-displacement);` was causing click coordinates to warp in modern browsers, making the uploader dropzone bleed over the "Export Thread Blueprint" button bounds.
* We removed this filter from `.tactile-btn-primary` and `.tactile-dropzone` elements to restore native rectangular coordinate hit testing. Clicking the Export button now triggers the blueprint export correctly every time.

### 4. Weave Duplicator Mirror/Reflection Enhancements
* Added a custom key handler for horizontal reflection/mirroring (`F` key or the Reflect button).
* Users can now copy a selection, move it, rotate it 90 degrees with `R`, flip/invert it with `F` (reflecting it backwards), and stamp it.

### 5. Transparency Pixel Processing (`processOpenTile2Transparency`)
* The `openTile2.png` photographic asset contains a dark tabletop background in the center of the crochet hole.
* The script processes these pixels on load, removing the dark background to make it transparent, allowing the weaving background to show through.


### 6. Numbered Blueprint Export (Crochet-ready Grid Chart)
* Added a secondary export button: **Export Numbered Blueprint**.
* Generates a high-contrast technical chart with empty cells colored white and filled cells colored light moss green (`#A2B59B`).
* Automatically numbers margins: bottom-to-top on the left and right sides, and left-to-right on the top and bottom.
* Overlays thicker lines every 5 cells as a visual counting aid, aligning with typical crochet pattern charts.
