/* ==========================================================================
   VERSION 2 - DIGITAL TEXTILE ECOLOGY EDITOR (HIGH PERFORMANCE BUFFERED ENGINE)
   ========================================================================== */

let grid = [];
let cols = 60;
let rows = 60;
let cellSize = 8;
let canvasElt;
let isDrawing = false;
let startDrawVal = 1;


// Offscreen buffer to cache grid drawings and bypass per-frame loop execution
let gridBuffer;
let needsRedraw = true;

// Pre-computed organic offsets to replace slow noise() calls in loops
let randomLookup = [];

// Weave Duplicator states (Motif selection / cloning)
let editorState = "draw"; // "draw", "select", "paste"
let selectStart = null;   // {x, y} coordinates of selection box drag start
let selectEnd = null;     // {x, y} coordinates of selection box drag end
let clipboard = null;     // 2D array of copied grid cells
let clipboardW = 0;       // width of copied grid sub-matrix
let clipboardH = 0;       // height of copied grid sub-matrix

// History stacks for Undo/Redo
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50;

// Active source image for extraction (defaults to horse.png)
let currentSourceImage = null;
let isDefaultImage = true;
let threshold = 120;
let borderEnabled = true;

// Preload assets before p5 setup (retained for backward compatibility or future extensions)
let openTile, filledTile;
let openTile2, filledTile2;
function preload() {
  // Preloading custom assets
  openTile = loadImage("assets/openTile.png");
  filledTile = loadImage("assets/filledTile.png");
  openTile2 = loadImage("assets/openTile2.png");
  filledTile2 = loadImage("assets/filledTile2.png");
}

// Generate organic seed offsets once on startup for speed
function initRandomLookup() {
  randomLookup = [];
  for (let y = 0; y < 120; y++) {
    randomLookup[y] = [];
    for (let x = 0; x < 120; x++) {
      randomLookup[y][x] = {
        fiberX1: Math.random() * 2 - 1.0,
        fiberY1: Math.random() * 2 - 1.0,
        fiberX2: Math.random() * 2 - 1.0,
        fiberY2: Math.random() * 2 - 1.0,
        weight1: Math.random() * 0.45 + 0.35,
        weight2: Math.random() * 0.45 + 0.35,
        rightSway: Array.from({length: 6}, () => Math.random() * 1.5 - 0.75),
        downSway: Array.from({length: 6}, () => Math.random() * 1.5 - 0.75),
        openSwayX: Math.random() * 1.2 - 0.6,
        openSwayY: Math.random() * 1.2 - 0.6
      };
    }
  }
}

// p5.js Setup
function setup() {
  initRandomLookup();
  
  const p5Canvas = createCanvas(cols * cellSize, rows * cellSize);
  p5Canvas.parent("canvas-container");
  canvasElt = p5Canvas.elt;
  
  // Allocate buffer for offscreen drawings
  gridBuffer = createGraphics(cols * cellSize, rows * cellSize);
  
  // Attach vanilla event listeners for drawing
  canvasElt.addEventListener('mousedown', onCanvasMouseDown);
  canvasElt.addEventListener('mousemove', onCanvasMouseMove);
  window.addEventListener('mouseup', onCanvasMouseUp);
  
  // Touch support for mobile and tablets
  canvasElt.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
  canvasElt.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
  window.addEventListener('touchend', onCanvasTouchEnd);

  // Keyboard shortcut listener for duplicator modes
  window.addEventListener("keydown", handleGlobalKeyDown);

  // Load original horse image in vanilla JS for canvas pixel manipulation
  loadDefaultImage();

  // Initialize event listeners for controls
  setupUIEventListeners();
  
  needsRedraw = true;
}

// Global key down handler for Esc, R, and F shortcuts
function handleGlobalKeyDown(e) {
  if (e.key === "Escape" || e.key === "Esc") {
    exitMotifModes();
  } else if ((e.key === "r" || e.key === "R") && editorState === "paste") {
    rotateClipboard();
  } else if ((e.key === "f" || e.key === "F" || e.key === "m" || e.key === "M") && editorState === "paste") {
    reflectClipboard();
  }
}

// p5.js Draw Loop - executes at 60 FPS
function draw() {
  if (needsRedraw) {
    redrawGridBuffer();
    needsRedraw = false;
  }
  
  // Paint cache buffer instantly (O(1) drawing frame time)
  image(gridBuffer, 0, 0);

  // Draw transient selections or previews on top of the buffered grid
  if (editorState === "select" && selectStart && selectEnd) {
    drawSelectionOverlay();
  } else if (editorState === "paste" && clipboard) {
    drawPastePreviewOverlay();
  }
}

// Draws organic crawling dashed borders for active grid selection
function drawSelectionOverlay() {
  let x1 = Math.min(selectStart.x, selectEnd.x) * cellSize;
  let y1 = Math.min(selectStart.y, selectEnd.y) * cellSize;
  let x2 = (Math.max(selectStart.x, selectEnd.x) + 1) * cellSize;
  let y2 = (Math.max(selectStart.y, selectEnd.y) + 1) * cellSize;

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  
  stroke(isDarkMode ? color(196, 211, 185, 220) : color(74, 86, 62, 220));
  strokeWeight(1.5);
  noFill();

  // Animated dashed offset to look like crawling thread fibers
  let dashOffset = frameCount * 0.35;
  drawingContext.setLineDash([5, 3]);
  drawingContext.lineDashOffset = -dashOffset;
  
  rect(x1, y1, x2 - x1, y2 - y1);
  drawingContext.setLineDash([]); // Reset dashed states
}

// Draws Translucent preview of copied motif floating under the cursor
function drawPastePreviewOverlay() {
  // Compute hover coordinates directly relative to canvas cell sizing
  let hx = Math.floor(mouseX / cellSize);
  let hy = Math.floor(mouseY / cellSize);

  if (hx >= 0 && hx < cols && hy >= 0 && hy < rows) {
    let startX = hx - Math.floor(clipboardW / 2);
    let startY = hy - Math.floor(clipboardH / 2);

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Theme-aware coloring for high visibility and contrast (darker in light mode, glowing in dark mode)
    let previewColor = isDarkMode ? color(196, 211, 185, 150) : color(74, 86, 62, 160);
    let outlineColor = isDarkMode ? color(142, 161, 127, 120) : color(74, 86, 62, 130);

    push();
    // 1. Draw boundary outline of motif
    stroke(outlineColor);
    strokeWeight(1);
    noFill();
    rect(startX * cellSize, startY * cellSize, clipboardW * cellSize, clipboardH * cellSize);

    // 2. Draw Translucent squares for closed mesh stitches
    fill(previewColor);
    noStroke();
    for (let y = 0; y < clipboardH; y++) {
      for (let x = 0; x < clipboardW; x++) {
        let tx = startX + x;
        let ty = startY + y;
        if (tx >= 0 && tx < cols && ty >= 0 && ty < rows) {
          if (clipboard[y][x] === 1) {
            rect(tx * cellSize, ty * cellSize, cellSize, cellSize);
          }
        }
      }
    }
    pop();
  }
}

// Render grid structure on offscreen graphics cache
function redrawGridBuffer() {
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  
  gridBuffer.clear();
  
  if (isDarkMode) {
    gridBuffer.background(27, 33, 23); // Moss Loom Dark #1B2117
  } else {
    gridBuffer.background(234, 231, 225); // Linen Loom Light #EAE7E1
  }
  
  if (grid.length === 0) return;

  // 1. Draw static background warp and weft lines
  drawBackgroundWarpWeft(gridBuffer, isDarkMode);

  // 2. Draw organic thread structures
  for (let y = 0; y < rows; y++) {
    if (!grid[y]) continue;
    for (let x = 0; x < cols; x++) {
      drawGenerativeThread(gridBuffer, x, y, isDarkMode);
    }
  }


}

// Draws static background canvas fibers
function drawBackgroundWarpWeft(pg, isDarkMode) {
  pg.stroke(isDarkMode ? 'rgba(229, 227, 216, 0.08)' : 'rgba(74, 86, 62, 0.08)');
  pg.strokeWeight(0.5);
  pg.noFill();

  // Draw vertical warp threads
  for (let x = 0; x <= cols; x += 3) {
    let px = x * cellSize;
    pg.beginShape();
    for (let y = 0; y <= rows; y += 5) {
      let py = y * cellSize;
      let look = randomLookup[y] ? randomLookup[y][x] : null;
      let dx = look ? look.fiberX2 * 1.2 : 0;
      pg.vertex(px + dx, py);
    }
    pg.endShape();
  }

  // Draw horizontal weft threads
  for (let y = 0; y <= rows; y += 3) {
    let py = y * cellSize;
    pg.beginShape();
    for (let x = 0; x <= cols; x += 5) {
      let px = x * cellSize;
      let look = randomLookup[y] ? randomLookup[y][x] : null;
      let dy = look ? look.fiberY2 * 1.2 : 0;
      pg.vertex(px, py + dy);
    }
    pg.endShape();
  }
}

// Draw static generative thread connections using pre-computed seeds
function drawGenerativeThread(pg, x, y, isDarkMode) {
  let cx = (x + 0.5) * cellSize;
  let cy = (y + 0.5) * cellSize;

  // Check neighbor states
  let hasLeft = (x > 0 && grid[y][x-1] === 1);
  let hasRight = (x < cols - 1 && grid[y][x+1] === 1);
  let hasUp = (y > 0 && grid[y-1][x] === 1);
  let hasDown = (y < rows - 1 && grid[y+1][x] === 1);

  // Fetch deterministic random values in O(1)
  let look = randomLookup[y] ? randomLookup[y][x] : null;
  if (!look) return;

  // Colors
  let threadColor = isDarkMode ? pg.color(229, 227, 216, 190) : pg.color(74, 86, 62, 195);
  let highlightColor = isDarkMode ? pg.color(196, 211, 185, 230) : pg.color(125, 143, 112, 230);

  if (grid[y][x] === 1) {
    // ----------------------------------------------------
    // CLOSED MESH: Dense cross-woven organic threads
    // ----------------------------------------------------
    pg.stroke(threadColor);
    pg.noFill();

    // 1. Draw horizontal fibers within the cell
    for (let i = -1.5; i <= 1.5; i += 1.5) {
      let offset = i * (cellSize / 6);
      pg.strokeWeight(look.weight1);
      pg.line(cx - cellSize/2, cy + offset + look.fiberY1, cx + cellSize/2, cy + offset - look.fiberY1);
    }
    
    // 2. Draw vertical fibers within the cell
    for (let i = -1.5; i <= 1.5; i += 1.5) {
      let offset = i * (cellSize / 6);
      pg.strokeWeight(look.weight2);
      pg.line(cx + offset + look.fiberX1, cy - cellSize/2, cx + offset - look.fiberX1, cy + cellSize/2);
    }

    // 3. Connect to adjacent cells with wavy curves
    pg.stroke(highlightColor);
    
    if (hasRight) {
      pg.strokeWeight(0.7);
      for (let i = -1; i <= 1; i++) {
        let offset = i * 1.0;
        pg.beginShape();
        for (let t = 0; t <= 5; t++) {
          let lx = lerp(cx, cx + cellSize, t / 5);
          let sway = look.rightSway[t] || 0;
          pg.vertex(lx, cy + offset + sway);
        }
        pg.endShape();
      }
    }
    
    if (hasDown) {
      pg.strokeWeight(0.7);
      for (let i = -1; i <= 1; i++) {
        let offset = i * 1.0;
        pg.beginShape();
        for (let t = 0; t <= 5; t++) {
          let ly = lerp(cy, cy + cellSize, t / 5);
          let sway = look.downSway[t] || 0;
          pg.vertex(cx + offset + sway, ly);
        }
        pg.endShape();
      }
    }

    // Draw structural anchor knot if isolated
    let neighbors = (hasLeft?1:0) + (hasRight?1:0) + (hasUp?1:0) + (hasDown?1:0);
    if (neighbors === 0) {
      pg.strokeWeight(0.5);
      pg.ellipse(cx, cy, cellSize * 0.25);
    }

  } else {
    // ----------------------------------------------------
    // OPEN MESH: Fine background grid strands
    // ----------------------------------------------------
    pg.stroke(isDarkMode ? pg.color(229, 227, 216, 28) : pg.color(74, 86, 62, 28));
    pg.strokeWeight(0.35);
    pg.noFill();
    
    pg.line(cx - cellSize/2, cy + look.openSwayY, cx + cellSize/2, cy + look.openSwayY);
    pg.line(cx + look.openSwayX, cy - cellSize/2, cx + look.openSwayX, cy + cellSize/2);
  }
}

// Translate screen event coordinates to logical grid coordinates using element bounding rects
function getGridCoordsFromEvent(e) {
  let clientX, clientY;
  
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else if (e.clientX !== undefined) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    return null;
  }
  
  if (!canvasElt) {
    canvasElt = document.querySelector('#canvas-container canvas');
  }
  if (!canvasElt) return null;
  
  const rect = canvasElt.getBoundingClientRect();
  
  const logicalWidth = cols * cellSize;
  const logicalHeight = rows * cellSize;
  const logicalRatio = logicalWidth / logicalHeight;
  const elementRatio = rect.width / rect.height;
  
  let drawnWidth, drawnHeight;
  let xOffset = 0;
  let yOffset = 0;
  
  if (elementRatio > logicalRatio) {
    drawnHeight = rect.height;
    drawnWidth = rect.height * logicalRatio;
    xOffset = (rect.width - drawnWidth) / 2;
  } else {
    drawnWidth = rect.width;
    drawnHeight = rect.width / logicalRatio;
    yOffset = (rect.height - drawnHeight) / 2;
  }
  
  const xRelative = clientX - rect.left;
  const yRelative = clientY - rect.top;
  
  const xCanvas = xRelative - xOffset;
  const yCanvas = yRelative - yOffset;
  
  const gridX = Math.floor(xCanvas * cols / drawnWidth);
  const gridY = Math.floor(yCanvas * rows / drawnHeight);
  
  return { x: gridX, y: gridY };
}

// Drawing interaction handlers
function onCanvasMouseDown(e) {
  let coords = getGridCoordsFromEvent(e);
  if (!coords) return;
  
  let x = coords.x;
  let y = coords.y;

  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    if (editorState === "draw") {
      saveHistoryState();
      startDrawVal = grid[y][x] === 1 ? 0 : 1;
      grid[y][x] = startDrawVal;
      isDrawing = true;
      needsRedraw = true; // Refresh offscreen buffer
      e.preventDefault();
    } else if (editorState === "select") {
      selectStart = { x: x, y: y };
      selectEnd = { x: x, y: y };
      isDrawing = true;
      e.preventDefault();
    } else if (editorState === "paste") {
      if (clipboard) {
        saveHistoryState();
        let startX = x - Math.floor(clipboardW / 2);
        let startY = y - Math.floor(clipboardH / 2);
        for (let cy_offset = 0; cy_offset < clipboardH; cy_offset++) {
          for (let cx_offset = 0; cx_offset < clipboardW; cx_offset++) {
            let tx = startX + cx_offset;
            let ty = startY + cy_offset;
            if (tx >= 0 && tx < cols && ty >= 0 && ty < rows) {
              if (borderEnabled && (ty < 4 || ty >= rows - 4 || tx < 4 || tx >= cols - 4)) continue;
              grid[ty][tx] = clipboard[cy_offset][cx_offset];
            }
          }
        }
        needsRedraw = true;
      }
      e.preventDefault();
    }
  }
}

function onCanvasMouseMove(e) {
  if (isDrawing) {
    let coords = getGridCoordsFromEvent(e);
    if (!coords) return;
    
    let x = coords.x;
    let y = coords.y;

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      if (editorState === "draw") {
        if (grid[y][x] !== startDrawVal) {
          grid[y][x] = startDrawVal;
          needsRedraw = true; // Only trigger redraw if a cell actually changes state
        }
      } else if (editorState === "select") {
        selectEnd = { x: x, y: y };
      }
    }
    e.preventDefault();
  }
}

function onCanvasMouseUp(e) {
  if (isDrawing) {
    isDrawing = false;
    if (editorState === "select" && selectStart && selectEnd) {
      // Calculate selection coordinates boundaries
      let x1 = Math.min(selectStart.x, selectEnd.x);
      let x2 = Math.max(selectStart.x, selectEnd.x);
      let y1 = Math.min(selectStart.y, selectEnd.y);
      let y2 = Math.max(selectStart.y, selectEnd.y);
      
      // Copy cells to clipboard
      clipboard = [];
      for (let y = y1; y <= y2; y++) {
        let rowArr = [];
        for (let x = x1; x <= x2; x++) {
          rowArr.push(grid[y][x]);
        }
        clipboard.push(rowArr);
      }
      clipboardW = x2 - x1 + 1;
      clipboardH = y2 - y1 + 1;

      // Transition to paste state
      enterPasteMode();
    }
  }
}

function onCanvasTouchStart(e) {
  if (e.touches.length > 0) {
    onCanvasMouseDown(e);
  }
}

function onCanvasTouchMove(e) {
  if (isDrawing) {
    onCanvasMouseMove(e);
  }
}

function onCanvasTouchEnd(e) {
  onCanvasMouseUp(e);
}

// Load default horse image
function loadDefaultImage() {
  const img = new Image();
  img.src = "assets/horse.png";
  img.onload = function() {
    currentSourceImage = img;
    isDefaultImage = true;
    processImageToGrid();
  };
}

// Grayscale and threshold-downsampling silhouette processor
function processImageToGrid() {
  if (!currentSourceImage) return;

  const tempCanvas = document.createElement("canvas");
  const ctx = tempCanvas.getContext("2d");
  
  tempCanvas.width = cols;
  tempCanvas.height = rows;

  const srcW = currentSourceImage.naturalWidth;
  const srcH = currentSourceImage.naturalHeight;

  if (isDefaultImage) {
    // Crop wood frame from handmade crochet photo (86% zoom)
    const cropSize = Math.min(srcW, srcH) * 0.86;
    const startX = (srcW - cropSize) / 2;
    const startY = (srcH - cropSize) / 2;
    ctx.drawImage(currentSourceImage, startX, startY, cropSize, cropSize, 0, 0, cols, rows);
  } else {
    // Draw entire image, scaling to fit the grid aspect ratio
    ctx.drawImage(currentSourceImage, 0, 0, srcW, srcH, 0, 0, cols, rows);
  }

  const imgData = ctx.getImageData(0, 0, cols, rows);
  const pixels = imgData.data;

  let newGrid = [];
  for (let y = 0; y < rows; y++) {
    newGrid[y] = [];
    for (let x = 0; x < cols; x++) {
      let idx = (y * cols + x) * 4;
      let r = pixels[idx];
      let g = pixels[idx + 1];
      let b = pixels[idx + 2];

      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      let adjustedGray = isDefaultImage ? (gray - (214 - 120)) : gray;
      newGrid[y][x] = (adjustedGray >= threshold) ? 1 : 0;
    }
  }

  // Draw double borders
  if (borderEnabled) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) {
          newGrid[y][x] = 1;
        } else if (y === 1 || y === rows - 2 || x === 1 || x === cols - 2) {
          newGrid[y][x] = 0;
        } else if (y === 2 || y === rows - 3 || x === 2 || x === cols - 3) {
          newGrid[y][x] = 1;
        } else if (y === 3 || y === rows - 4 || x === 3 || x === cols - 4) {
          newGrid[y][x] = 0;
        }
      }
    }
  }

  grid = newGrid;
  needsRedraw = true; // Trigger buffer refresh
}

// History stack logic (Undo/Redo)
function saveHistoryState() {
  undoStack.push(JSON.stringify(grid));
  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }
  redoStack = []; // Clear redo stack
  updateHistoryButtons();
}

function undo() {
  if (undoStack.length > 0) {
    redoStack.push(JSON.stringify(grid));
    grid = JSON.parse(undoStack.pop());
    updateHistoryButtons();
    needsRedraw = true;
  }
}

function redo() {
  if (redoStack.length > 0) {
    undoStack.push(JSON.stringify(grid));
    grid = JSON.parse(redoStack.pop());
    updateHistoryButtons();
    needsRedraw = true;
  }
}

function updateHistoryButtons() {
  const undoBtn = document.getElementById("undo-btn");
  const redoBtn = document.getElementById("redo-btn");
  if (undoBtn) undoBtn.disabled = undoStack.length === 0;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

// Grid operations
function invertGrid() {
  saveHistoryState();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (borderEnabled && (y < 4 || y >= rows - 4 || x < 4 || x >= cols - 4)) continue;
      grid[y][x] = grid[y][x] === 1 ? 0 : 1;
    }
  }
  needsRedraw = true;
}

function clearGrid() {
  saveHistoryState();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (borderEnabled && (y < 4 || y >= rows - 4 || x < 4 || x >= cols - 4)) continue;
      grid[y][x] = 0;
    }
  }
  needsRedraw = true;
}

function fillGrid() {
  saveHistoryState();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid[y][x] = 1;
    }
  }
  needsRedraw = true;
}

// Resizing grid dimensions
function adjustGridDimensions() {
  let newGrid = [];
  for (let y = 0; y < rows; y++) {
    newGrid[y] = [];
    for (let x = 0; x < cols; x++) {
      if (grid[y] && grid[y][x] !== undefined) {
        newGrid[y][x] = grid[y][x];
      } else {
        newGrid[y][x] = 0;
      }
    }
  }
  grid = newGrid;
  needsRedraw = true;
}

// File Drag/Drop / Selection
function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please upload a valid image file.");
    return;
  }
  saveHistoryState();
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function() {
      currentSourceImage = img;
      isDefaultImage = false;

      // Size grid to fit the aspect ratio of the uploaded image
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const targetMax = Math.max(cols, rows);

      if (srcW >= srcH) {
        cols = targetMax;
        rows = Math.max(10, Math.min(100, Math.round(targetMax * (srcH / srcW))));
      } else {
        rows = targetMax;
        cols = Math.max(10, Math.min(100, Math.round(targetMax * (srcW / srcH))));
      }

      document.getElementById("cols-input").value = cols;
      document.getElementById("rows-input").value = rows;

      resizeCanvas(cols * cellSize, rows * cellSize);
      gridBuffer = createGraphics(cols * cellSize, rows * cellSize);

      processImageToGrid();
    };
  };
}

// Transition editor into Motif Selection Mode
function enterSelectMode() {
  editorState = "select";
  selectStart = null;
  selectEnd = null;
  clipboard = null;
  
  // Highlight active button
  document.getElementById("select-btn").classList.add("active");
  
  const rotateBtn = document.getElementById("rotate-btn");
  const reflectBtn = document.getElementById("reflect-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  if (rotateBtn) rotateBtn.style.display = "none";
  if (reflectBtn) reflectBtn.style.display = "none";
  if (cancelBtn) cancelBtn.style.display = "none";
  
  // Expose floating helper banner
  const banner = document.getElementById("ecology-banner");
  if (banner) {
    banner.style.display = "block";
    document.getElementById("ecology-banner-text").textContent = "Drag a frame on the grid to copy";
  }
}

// Transition editor into Motif Paste/Sprout Mode
function enterPasteMode() {
  editorState = "paste";
  
  document.getElementById("select-btn").classList.remove("active");
  
  const rotateBtn = document.getElementById("rotate-btn");
  const reflectBtn = document.getElementById("reflect-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  if (rotateBtn) rotateBtn.style.display = "inline-block";
  if (reflectBtn) reflectBtn.style.display = "inline-block";
  if (cancelBtn) cancelBtn.style.display = "inline-block";
  
  const banner = document.getElementById("ecology-banner");
  if (banner) {
    banner.style.display = "block";
    document.getElementById("ecology-banner-text").textContent = "Click to weave motif [R: Rotate | F: Reflect | Esc: Exit]";
  }
}

// Reset state machine back to standard drawing Mode
function exitMotifModes() {
  editorState = "draw";
  selectStart = null;
  selectEnd = null;
  clipboard = null;
  
  document.getElementById("select-btn").classList.remove("active");
  
  const rotateBtn = document.getElementById("rotate-btn");
  const reflectBtn = document.getElementById("reflect-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  if (rotateBtn) rotateBtn.style.display = "none";
  if (reflectBtn) reflectBtn.style.display = "none";
  if (cancelBtn) cancelBtn.style.display = "none";
  
  const banner = document.getElementById("ecology-banner");
  if (banner) {
    banner.style.display = "none";
  }
}

// Rotate the cloned 2D sub-grid array by 90 degrees clockwise
function rotateClipboard() {
  if (!clipboard) return;
  
  let rotated = [];
  let newW = clipboardH;
  let newH = clipboardW;
  
  for (let y = 0; y < newH; y++) {
    rotated[y] = [];
    for (let x = 0; x < newW; x++) {
      rotated[y][x] = clipboard[clipboardH - 1 - x][y];
    }
  }
  
  clipboard = rotated;
  clipboardW = newW;
  clipboardH = newH;
}

// Reflect (flip horizontally) the cloned 2D sub-grid array
function reflectClipboard() {
  if (!clipboard) return;
  
  for (let y = 0; y < clipboardH; y++) {
    clipboard[y].reverse();
  }
}

// Setup User Interface Action bindings
function setupUIEventListeners() {
  // Columns Input
  document.getElementById("cols-input").addEventListener("change", (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 10) val = 10;
    if (val > 100) val = 100;
    e.target.value = val;
    
    saveHistoryState();
    cols = val;
    resizeCanvas(cols * cellSize, rows * cellSize);
    gridBuffer = createGraphics(cols * cellSize, rows * cellSize); // Resize buffer
    if (currentSourceImage) {
      processImageToGrid();
    } else {
      adjustGridDimensions();
    }
    needsRedraw = true;
  });

  // Rows Input
  document.getElementById("rows-input").addEventListener("change", (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 10) val = 10;
    if (val > 100) val = 100;
    e.target.value = val;

    saveHistoryState();
    rows = val;
    resizeCanvas(cols * cellSize, rows * cellSize);
    gridBuffer = createGraphics(cols * cellSize, rows * cellSize); // Resize buffer
    if (currentSourceImage) {
      processImageToGrid();
    } else {
      adjustGridDimensions();
    }
    needsRedraw = true;
  });

  // Threshold Slider
  const thresholdSlider = document.getElementById("threshold-slider");
  thresholdSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    document.getElementById("threshold-val").textContent = val;
    threshold = val;
    
    if (currentSourceImage) {
      processImageToGrid();
    }
  });

  // Buttons Bindings
  document.getElementById("invert-btn").addEventListener("click", invertGrid);
  document.getElementById("clear-btn").addEventListener("click", clearGrid);
  document.getElementById("fill-btn").addEventListener("click", fillGrid);
  document.getElementById("undo-btn").addEventListener("click", undo);
  document.getElementById("redo-btn").addEventListener("click", redo);
  
  // Theme Toggle Spindle
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      needsRedraw = true; // Redraw buffer on theme change
    });
  }

  // Horse Reset Button
  document.getElementById("horse-reset-icon-btn").addEventListener("click", () => {
    cols = 60;
    rows = 60;
    document.getElementById("cols-input").value = 60;
    document.getElementById("rows-input").value = 60;
    
    threshold = 120;
    document.getElementById("threshold-slider").value = 120;
    document.getElementById("threshold-val").textContent = 120;
    
    resizeCanvas(cols * cellSize, rows * cellSize);
    gridBuffer = createGraphics(cols * cellSize, rows * cellSize); // Re-create buffer
    loadDefaultImage();
    needsRedraw = true;
  });

  // Download Blueprint Chart
  document.getElementById("download-btn").addEventListener("click", () => {
    saveCanvas("linen_moss_blueprint", "png");
  });

  // Download Numbered Blueprint Chart
  document.getElementById("download-numbered-btn").addEventListener("click", exportNumberedBlueprint);



  // Weave Duplicator controls bindings
  document.getElementById("select-btn").addEventListener("click", () => {
    if (editorState === "draw") {
      enterSelectMode();
    } else {
      exitMotifModes();
    }
  });

  document.getElementById("rotate-btn").addEventListener("click", () => {
    if (editorState === "paste") rotateClipboard();
  });

  document.getElementById("reflect-btn").addEventListener("click", () => {
    if (editorState === "paste") reflectClipboard();
  });

  document.getElementById("cancel-btn").addEventListener("click", exitMotifModes);

  // Dropzone file select
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  
  dropzone.addEventListener("click", () => {
    fileInput.click();
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });
}

// Vanilla Ambient background particles (Dust / Thread Lint)
function initAmbientParticles() {
  const canvas = document.getElementById("ambient-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let particles = [];
  const count = 40;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Particle representation
  class FiberParticle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.height;
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = -15;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = Math.random() * 0.25 + 0.12; 
      this.size = Math.random() * 4.5 + 1.5;
      this.alpha = Math.random() * 0.35 + 0.08; 
      this.type = Math.random() > 0.45 ? "dust" : "lint";
      this.length = Math.random() * 12 + 4;
      this.angle = Math.random() * Math.PI * 2;
      this.spinSpeed = (Math.random() - 0.5) * 0.006;
    }
    update(mx, my) {
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.spinSpeed;

      // Mouse displacement
      if (mx !== null && my !== null) {
        let dx = this.x - mx;
        let dy = this.y - my;
        let d = Math.hypot(dx, dy);
        if (d < 160) {
          let force = (160 - d) * 0.00035;
          this.x += (dx / d) * force * 2.0;
          this.y += (dy / d) * force * 2.0;
        }
      }

      // Loop checks
      if (this.y > canvas.height + 15 || this.x < -15 || this.x > canvas.width + 15) {
        this.reset();
      }
    }
    draw() {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      let baseColor = isDark ? `rgba(229, 227, 216, ${this.alpha})` : `rgba(74, 86, 62, ${this.alpha * 0.6})`;
      ctx.strokeStyle = baseColor;
      ctx.fillStyle = baseColor;

      if (this.type === "dust") {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.lineWidth = 0.4;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.bezierCurveTo(-this.size, -this.length/2, this.size, 0, 0, this.length/2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  for (let i = 0; i < count; i++) {
    particles.push(new FiberParticle());
  }

  let mouseX = null;
  let mouseY = null;
  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update(mouseX, mouseY);
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// Export a clean, numbered grid blueprint for print/crochet references
function exportNumberedBlueprint() {
  const exportCellSize = 16;
  const margin = 45;
  const gridW = cols * exportCellSize;
  const gridH = rows * exportCellSize;
  const exportW = gridW + 2 * margin;
  const exportH = gridH + 2 * margin;
  
  let pg = createGraphics(exportW, exportH);
  pg.background(255);
  
  // 1. Draw grid cells (fill only, no stroke first for clean drawing)
  pg.noStroke();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let cx = margin + x * exportCellSize;
      let cy = margin + y * exportCellSize;
      if (grid[y][x] === 1) {
        pg.fill(162, 181, 155); // light moss green #A2B59B
      } else {
        pg.fill(255); // white
      }
      pg.rect(cx, cy, exportCellSize, exportCellSize);
    }
  }

  // 2. Draw grid lines (warp & weft overlay with heavy lines every 5 cells)
  for (let x = 0; x <= cols; x++) {
    let px = margin + x * exportCellSize;
    if (x === 0 || x === cols) {
      pg.stroke(50);
      pg.strokeWeight(1.5);
    } else if (x % 5 === 0) {
      pg.stroke(100);
      pg.strokeWeight(1.0);
    } else {
      pg.stroke(200);
      pg.strokeWeight(0.5);
    }
    pg.line(px, margin, px, margin + gridH);
  }

  for (let y = 0; y <= rows; y++) {
    let py = margin + y * exportCellSize;
    let displayRow = rows - y;
    if (y === 0 || y === rows) {
      pg.stroke(50);
      pg.strokeWeight(1.5);
    } else if (displayRow % 5 === 0) {
      pg.stroke(100);
      pg.strokeWeight(1.0);
    } else {
      pg.stroke(200);
      pg.strokeWeight(0.5);
    }
    pg.line(margin, py, margin + gridW, py);
  }
  
  // 3. Draw outer heavy border
  pg.stroke(50);
  pg.strokeWeight(1.5);
  pg.noFill();
  pg.rect(margin, margin, gridW, gridH);
  
  // 4. Draw labels
  pg.fill(50);
  pg.noStroke();
  pg.textSize(Math.max(8, exportCellSize * 0.65));
  pg.textFont('Inter, sans-serif');
  
  // Draw Row numbers on left and right margins
  for (let y = 0; y < rows; y++) {
    let displayRow = rows - y;
    let py = margin + y * exportCellSize + exportCellSize / 2;
    
    // Left
    pg.textAlign(RIGHT, CENTER);
    pg.text(displayRow, margin - 8, py);
    
    // Right
    pg.textAlign(LEFT, CENTER);
    pg.text(displayRow, margin + gridW + 8, py);
  }
  
  // Draw Column numbers on top and bottom margins
  for (let x = 0; x < cols; x++) {
    let displayCol = x + 1;
    let px = margin + x * exportCellSize + exportCellSize / 2;
    
    // Top
    pg.textAlign(CENTER, BOTTOM);
    pg.text(displayCol, px, margin - 8);
    
    // Bottom
    pg.textAlign(CENTER, TOP);
    pg.text(displayCol, px, margin + gridH + 8);
  }
  
  // Save canvas
  saveCanvas(pg, "linen_moss_numbered_blueprint", "png");
  pg.remove();
}

// Launch background particle engine when document loads
window.addEventListener("DOMContentLoaded", initAmbientParticles);
