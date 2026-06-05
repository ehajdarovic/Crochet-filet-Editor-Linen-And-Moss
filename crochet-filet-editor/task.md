# Tasks - Motif Clone, Rotate & Replicate Tool (v2)

- `[x]` Overhaul HTML (`index.html` & `v2/index.html`)
  - `[x]` Add floating `#ecology-banner` above canvas inside the loom frame
  - `[x]` Add copy, rotate, and cancel buttons inside the control sidebar
- `[x]` Style Elements (`styles.css` & `v2/styles.css`)
  - `[x]` Style the floating linen-badge instructions banner
  - `[x]` Add CSS keyframe float animations for the banner
  - `[x]` Create styling and layouts for the weave duplicator buttons
- `[x]` Scripting Logic (`editor.js` & `v2/editor.js`)
  - `[x]` Add state variables: `editorState`, `selectStart`, `selectEnd`, `clipboard`, `clipboardW`, `clipboardH`
  - `[x]` Bind UI buttons (`select-btn`, `rotate-btn`, `reflect-btn`, `cancel-btn`)
  - `[x]` Add global Keydown listener for `R` (rotate), `F` / `M` (reflect), and `Escape` (cancel)
  - `[x]` Implement horizontal matrix reflection function `reflectClipboard()`
  - `[x]` Update p5 `draw()` function to render crawling dash borders and preview motif grids
- `[x]` Verification & Documentation
  - `[x]` Test selection dragging, rotating, reflecting, and pasting on the local server
  - `[x]` Verify responsiveness and theme support
  - `[x]` Update `walkthrough.md` with instructions on how to use the selection & reflection tool

## Photographic Tile Asset Integration (Root Version)
- `[x]` Integrate `filledTile2` and `openTile2` at the root folder level
  - `[x]` Preload `openTile2.png` and `filledTile2.png` in root `editor.js`
  - `[x]` Implement `processOpenTile2Transparency()` pixel processor in setup
  - `[x]` Update `drawGenerativeThread()` to draw the tiles with theme-aware tints
  - `[x]` Sync root `editor.js` and copy to Desktop folder
  - `[x]` Bump cache buster versions in `index.html` to `v=8`
- `[x]` Revert `/v2/` subfolder to the procedural green yarn version
  - `[x]` Revert `v2/editor.js` to original procedural drawing logic (and `cellSize = 8`)
  - `[x]` Revert transparency processor setup calls
  - `[x]` Sync `v2/editor.js` and `v2/index.html` (bump cache buster to `v=9`) to Desktop folder
  - `[x]` Verify side-by-side versions preview correctly in browser

## Canvas Expansion (Screen Scaling)
- `[x]` Adjust container max-width to 1600px and responsive width to 95% in both versions
- `[x]` Reduce editorial header top/bottom margins to elevate the canvas on screen
- `[x]` Set `.canvas-loom-frame` and `.loom-section` to stretch to 100% width of the left column
- `[x]` Sync modifications between Desktop and Scratch workspaces
- `[x]` Bump cache buster versions in HTML files (`v=5` for root, `v=2` for v2) to force client-side stylesheet update

## Bug Fixes
- `[x]` Remove SVG displacement filter from `.tactile-btn-primary` and `.tactile-dropzone` to resolve browser hit-testing (clicking) overlap bugs
- `[x]` Bump cache buster versions in HTML files (`v=6` for root styles, `v=3` for v2 styles) to apply the button click fix immediately
- `[x]` Synchronize all corrected styles and index markup files to the scratch workspace

## GitHub Packaging & README
- `[x]` Copy example blueprint screenshot `linen_moss_blueprint-1.png` to assets directory
- `[x]` Create comprehensive project README.md documenting architecture, versions, features, running instructions, and GitHub pushing steps
- `[x]` Update walkthrough.md to document the latest state-aware offscreen double-buffering performance and button click fixes

## Export Numbered Blueprint Feature
- `[x]` Add "Export Numbered Blueprint" secondary button under "Export Thread Blueprint" in both HTML versions
- `[x]` Code the `exportNumberedBlueprint` function generating a white/light-moss-green technical grid in both script versions
- `[x]` Automatically draw bottom-to-top row coordinates and left-to-right column coordinates on all margins
- `[x]` Overlay thick lines every 5 cells for crochet pattern readability
- `[x]` Sync styles, layouts, and scripts to Desktop, scratch folder, and artifacts

