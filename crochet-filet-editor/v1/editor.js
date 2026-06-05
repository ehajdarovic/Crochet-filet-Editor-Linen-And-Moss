// Global state variables
let cols = 60;
let rows = 60;
let cellSize = 32;
let grid = [];
let canvasElt;

let openTile;
let filledTile;

let drawMode = 1; // 1 = closed (filled), 0 = open (space)
let isDrawing = false;
let startDrawVal = 0;

// History stacks for Undo/Redo
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50;

// Active source image for extraction (defaults to horse.png)
let currentSourceImage = null;
let threshold = 120;
let borderEnabled = true;

// Preload assets before p5 setup
function preload() {
  openTile = loadImage("assets/openTile.png");
  filledTile = loadImage("assets/filledTile.png");
}

// p5.js Setup
function setup() {
  const p5Canvas = createCanvas(cols * cellSize, rows * cellSize);
  p5Canvas.parent("canvas-container");
  canvasElt = p5Canvas.elt;
  
  // Attach vanilla event listeners for drawing
  canvasElt.addEventListener('mousedown', onCanvasMouseDown);
  canvasElt.addEventListener('mousemove', onCanvasMouseMove);
  window.addEventListener('mouseup', onCanvasMouseUp);
  
  // Touch support for mobile and tablets
  canvasElt.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
  canvasElt.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
  window.addEventListener('touchend', onCanvasTouchEnd);

  // Load original horse image in vanilla JS for canvas pixel manipulation
  loadDefaultImage();

  // Initialize event listeners for controls
  setupUIEventListeners();
}

// p5.js Draw Loop
function draw() {
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDarkMode) {
    background(10, 17, 13); // Deep Forest Midnight #0A110D
  } else {
    background(250, 248, 245); // Creamy Pearl #FAF8F5
  }
  
  if (grid.length === 0) return;

  for (let y = 0; y < rows; y++) {
    if (!grid[y]) continue;
    for (let x = 0; x < cols; x++) {
      let px = x * cellSize;
      let py = y * cellSize;

      if (grid[y][x] === 1) {
        if (filledTile) {
          image(filledTile, px, py, cellSize, cellSize);
        } else {
          // Fallback if image not loaded - Forest Green (Light) / Mint (Dark)
          if (isDarkMode) {
            fill(167, 243, 208);
            stroke(35, 51, 42);
          } else {
            fill(69, 105, 80);
            stroke(239, 231, 235);
          }
          rect(px, py, cellSize, cellSize);
        }
      } else {
        if (openTile) {
          image(openTile, px, py, cellSize, cellSize);
        } else {
          // Fallback if image not loaded - Pearl Cream (Light) / Dark Forest (Dark)
          if (isDarkMode) {
            fill(21, 34, 27);
            stroke(35, 51, 42);
          } else {
            fill(255, 253, 251);
            stroke(239, 231, 235);
          }
          rect(px, py, cellSize, cellSize);
        }
      }
    }
  }
}

// // Translate screen event coordinates to logical grid coordinates using vanilla client coordinates
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
  
  // Exact drawn dimensions accounting for letterboxing due to object-fit: contain
  const logicalWidth = cols * cellSize;
  const logicalHeight = rows * cellSize;
  const logicalRatio = logicalWidth / logicalHeight;
  const elementRatio = rect.width / rect.height;
  
  let drawnWidth, drawnHeight;
  let xOffset = 0;
  let yOffset = 0;
  
  if (elementRatio > logicalRatio) {
    // Canvas is letterboxed on the sides (left/right)
    drawnHeight = rect.height;
    drawnWidth = rect.height * logicalRatio;
    xOffset = (rect.width - drawnWidth) / 2;
  } else {
    // Canvas is letterboxed on the top/bottom
    drawnWidth = rect.width;
    drawnHeight = rect.width / logicalRatio;
    yOffset = (rect.height - drawnHeight) / 2;
  }
  
  // Mouse position relative to the canvas element bounding box
  const xRelative = clientX - rect.left;
  const yRelative = clientY - rect.top;
  
  // Mouse position relative to the actual drawn canvas area
  const xCanvas = xRelative - xOffset;
  const yCanvas = yRelative - yOffset;
  
  // Convert to grid coordinates
  const gridX = Math.floor(xCanvas * cols / drawnWidth);
  const gridY = Math.floor(yCanvas * rows / drawnHeight);
  
  return { x: gridX, y: gridY };
}

// Vanilla event handlers for drawing
function onCanvasMouseDown(e) {
  let coords = getGridCoordsFromEvent(e);
  if (!coords) return;
  
  let x = coords.x;
  let y = coords.y;

  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    saveHistoryState();
    // Toggle the clicked cell
    startDrawVal = grid[y][x] === 1 ? 0 : 1;
    grid[y][x] = startDrawVal;
    isDrawing = true;
    e.preventDefault(); // prevent selection/scrolling
  }
}

function onCanvasMouseMove(e) {
  if (isDrawing) {
    let coords = getGridCoordsFromEvent(e);
    if (!coords) return;
    
    let x = coords.x;
    let y = coords.y;

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      grid[y][x] = startDrawVal;
    }
    e.preventDefault();
  }
}

function onCanvasMouseUp(e) {
  isDrawing = false;
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
    processImageToGrid();
  };
}

// Image Extraction Logic using offscreen canvas
function processImageToGrid() {
  if (!currentSourceImage) return;

  const tempCanvas = document.createElement("canvas");
  const ctx = tempCanvas.getContext("2d");
  
  tempCanvas.width = cols;
  tempCanvas.height = rows;

  const srcW = currentSourceImage.naturalWidth;
  const srcH = currentSourceImage.naturalHeight;

  // Crop the center 86% of the original photo to remove the wood table frame
  const cropSize = Math.min(srcW, srcH) * 0.86;
  const startX = (srcW - cropSize) / 2;
  const startY = (srcH - cropSize) / 2;

  // Draw cropped image resized to cols x rows grid
  ctx.drawImage(currentSourceImage, startX, startY, cropSize, cropSize, 0, 0, cols, rows);

  const imgData = ctx.getImageData(0, 0, cols, rows);
  const pixels = imgData.data;

  // Build the grid array based on pixel brightness
  let newGrid = [];
  for (let y = 0; y < rows; y++) {
    newGrid[y] = [];
    for (let x = 0; x < cols; x++) {
      let idx = (y * cols + x) * 4;
      let r = pixels[idx];
      let g = pixels[idx + 1];
      let b = pixels[idx + 2];

      // Standard grayscale conversion
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Extract silhouette (bright = closed/filled, dark = open/space)
      newGrid[y][x] = (gray >= threshold) ? 1 : 0;
    }
  }

  // Apply straight border frame if enabled
  if (borderEnabled) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Layer 0: Solid border
        if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) {
          newGrid[y][x] = 1;
        }
        // Layer 1: Open mesh gap
        else if (y === 1 || y === rows - 2 || x === 1 || x === cols - 2) {
          newGrid[y][x] = 0;
        }
        // Layer 2: Solid inner border
        else if (y === 2 || y === rows - 3 || x === 2 || x === cols - 3) {
          newGrid[y][x] = 1;
        }
        // Layer 3: Open mesh gap
        else if (y === 3 || y === rows - 4 || x === 3 || x === cols - 4) {
          newGrid[y][x] = 0;
        }
      }
    }
  }

  saveHistoryState();
  grid = newGrid;
}

// History Management (Undo/Redo)
function saveHistoryState() {
  // Push copy of current grid to undo stack
  const gridCopy = grid.map(row => [...row]);
  undoStack.push({
    grid: gridCopy,
    cols: cols,
    rows: rows
  });

  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }

  // Clear redo stack on new action
  redoStack = [];
  updateHistoryButtons();
}

function undo() {
  if (undoStack.length === 0) return;

  // Push current state to redo stack
  const currentCopy = grid.map(row => [...row]);
  redoStack.push({
    grid: currentCopy,
    cols: cols,
    rows: rows
  });

  const prevState = undoStack.pop();
  cols = prevState.cols;
  rows = prevState.rows;
  grid = prevState.grid;

  // Update inputs
  document.getElementById("cols-input").value = cols;
  document.getElementById("rows-input").value = rows;
  
  // Resize canvas without resetting the grid
  resizeCanvas(cols * cellSize, rows * cellSize);
  updateHistoryButtons();
}

function redo() {
  if (redoStack.length === 0) return;

  // Push current state to undo stack
  const currentCopy = grid.map(row => [...row]);
  undoStack.push({
    grid: currentCopy,
    cols: cols,
    rows: rows
  });

  const nextState = redoStack.pop();
  cols = nextState.cols;
  rows = nextState.rows;
  grid = nextState.grid;

  // Update inputs
  document.getElementById("cols-input").value = cols;
  document.getElementById("rows-input").value = rows;

  resizeCanvas(cols * cellSize, rows * cellSize);
  updateHistoryButtons();
}

function updateHistoryButtons() {
  document.getElementById("undo-btn").disabled = undoStack.length === 0;
  document.getElementById("redo-btn").disabled = redoStack.length === 0;
}

// Setup Event Listeners for UI Controls
function setupUIEventListeners() {
  // Light/Dark Theme Switcher
  const themeToggle = document.getElementById("theme-toggle");
  
  // Load saved theme or set light default
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });

  // Undo / Redo
  document.getElementById("undo-btn").addEventListener("click", undo);
  document.getElementById("redo-btn").addEventListener("click", redo);

  // Clear Grid (All Open)
  document.getElementById("clear-btn").addEventListener("click", () => {
    saveHistoryState();
    for (let y = 0; y < rows; y++) {
      grid[y].fill(0);
    }
  });

  // Fill Grid (All Closed)
  document.getElementById("fill-btn").addEventListener("click", () => {
    saveHistoryState();
    for (let y = 0; y < rows; y++) {
      grid[y].fill(1);
    }
  });

  // Invert Grid
  document.getElementById("invert-btn").addEventListener("click", () => {
    saveHistoryState();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        grid[y][x] = grid[y][x] === 1 ? 0 : 1;
      }
    }
  });

  // Reset to Original Horse Image
  document.getElementById("horse-reset-icon-btn").addEventListener("click", () => {
    // Reset columns/rows inputs to default
    cols = 60;
    rows = 60;
    document.getElementById("cols-input").value = 60;
    document.getElementById("rows-input").value = 60;
    
    // Preserve the user's active threshold value from the slider so the horse displays correctly
    threshold = parseInt(document.getElementById("threshold-slider").value);
    
    resizeCanvas(cols * cellSize, rows * cellSize);
    loadDefaultImage();
  });

  // Columns Size Change
  document.getElementById("cols-input").addEventListener("change", (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 10) val = 10;
    if (val > 100) val = 100;
    e.target.value = val;
    
    saveHistoryState();
    cols = val;
    resizeCanvas(cols * cellSize, rows * cellSize);
    
    if (currentSourceImage) {
      processImageToGrid();
    } else {
      adjustGridDimensions();
    }
  });

  // Rows Size Change
  document.getElementById("rows-input").addEventListener("change", (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 10) val = 10;
    if (val > 100) val = 100;
    e.target.value = val;

    saveHistoryState();
    rows = val;
    resizeCanvas(cols * cellSize, rows * cellSize);

    if (currentSourceImage) {
      processImageToGrid();
    } else {
      adjustGridDimensions();
    }
  });

  // Threshold Slider Changes
  const thresholdSlider = document.getElementById("threshold-slider");
  thresholdSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    document.getElementById("threshold-val").textContent = val;
    threshold = val;
    if (currentSourceImage) {
      // Re-extract with new threshold, skipping history stack expansion
      // to allow smooth dragging of the slider
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");
      tempCanvas.width = cols;
      tempCanvas.height = rows;
      const srcW = currentSourceImage.naturalWidth;
      const srcH = currentSourceImage.naturalHeight;
      const cropSize = Math.min(srcW, srcH) * 0.86;
      const startX = (srcW - cropSize) / 2;
      const startY = (srcH - cropSize) / 2;
      ctx.drawImage(currentSourceImage, startX, startY, cropSize, cropSize, 0, 0, cols, rows);
      const imgData = ctx.getImageData(0, 0, cols, rows);
      const pixels = imgData.data;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let idx = (y * cols + x) * 4;
          let r = pixels[idx];
          let g = pixels[idx + 1];
          let b = pixels[idx + 2];
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          grid[y][x] = (gray >= threshold) ? 1 : 0;
        }
      }

      if (borderEnabled) {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) {
              grid[y][x] = 1;
            } else if (y === 1 || y === rows - 2 || x === 1 || x === cols - 2) {
              grid[y][x] = 0;
            } else if (y === 2 || y === rows - 3 || x === 2 || x === cols - 3) {
              grid[y][x] = 1;
            } else if (y === 3 || y === rows - 4 || x === 3 || x === cols - 4) {
              grid[y][x] = 0;
            }
          }
        }
      }
    }
  });

  // Closed/Open Drawing Mode toggles
  const drawFilledBtn = document.getElementById("draw-filled-btn");
  const drawOpenBtn = document.getElementById("draw-open-btn");

  drawFilledBtn.addEventListener("click", () => {
    drawMode = 1;
    drawFilledBtn.classList.add("active");
    drawOpenBtn.classList.remove("active");
  });

  drawOpenBtn.addEventListener("click", () => {
    drawMode = 0;
    drawOpenBtn.classList.add("active");
    drawFilledBtn.classList.remove("active");
  });

  // Export Chart to PNG
  document.getElementById("export-btn").addEventListener("click", () => {
    saveCanvas("crochet_filet_chart", "png");
  });

  // Drag and Drop Upload Area
  const uploadBox = document.getElementById("upload-box");
  const fileInput = document.getElementById("file-input");

  uploadBox.addEventListener("click", () => {
    fileInput.click();
  });

  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("dragover");
  });

  uploadBox.addEventListener("dragleave", () => {
    uploadBox.classList.remove("dragover");
  });

  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("dragover");
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

// Adjust grid size manually when there's no background image to re-sample
function adjustGridDimensions() {
  let newGrid = [];
  for (let y = 0; y < rows; y++) {
    newGrid[y] = [];
    for (let x = 0; x < cols; x++) {
      if (grid[y] && grid[y][x] !== undefined) {
        newGrid[y][x] = grid[y][x];
      } else {
        newGrid[y][x] = 0; // Default to open tile
      }
    }
  }
  grid = newGrid;
}

// Process Uploaded Image file
function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please upload a valid image file.");
    return;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function() {
      currentSourceImage = img;
      processImageToGrid();
    };
  };
}
