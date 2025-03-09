// Canvas setup
const canvas = document.getElementById('mandelbrotCanvas');
const ctx = canvas.getContext('2d');

// Mandelbrot parameters
let xMin = -2.5;
let xMax = 1;
let yMin = -1.25;
let yMax = 1.25;
const maxIterations = 1000;

// Set canvas dimensions
function setupCanvas() {
  canvas.width = window.innerWidth * 0.8;
  canvas.height = window.innerHeight * 0.8;
  drawMandelbrot();
}

// Convert canvas coordinates to complex plane coordinates
function canvasToComplex(x, y) {
  const real = xMin + (x / canvas.width) * (xMax - xMin);
  const imag = yMin + (y / canvas.height) * (yMax - yMin);
  return { real, imag };
}

// Calculate the Mandelbrot value for a complex number
function mandelbrot(real, imag) {
  let zReal = 0;
  let zImag = 0;
  let n = 0;
  
  while (n < maxIterations && zReal * zReal + zImag * zImag < 4) {
    const zRealTemp = zReal * zReal - zImag * zImag + real;
    zImag = 2 * zReal * zImag + imag;
    zReal = zRealTemp;
    n++;
  }
  
  if (n === maxIterations) {
    return n;
  }
  
  // Smooth coloring - calculate the log escape radius
  const logZn = Math.log(zReal * zReal + zImag * zImag) / 2;
  const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
  return n + 1 - nu;
}

// Enhanced color mapping function for more vibrancy
function getColor(iterations) {
  if (iterations >= maxIterations) {
    return [0, 0, 0]; // Black for points in the set
  }
  
  // Use a wider range of colors with multiple color bands
  const colorSchemes = [
    // Vibrant rainbow palette
    (v) => [
      Math.sin(v * 0.3) * 127 + 128,
      Math.sin(v * 0.3 + 2) * 127 + 128,
      Math.sin(v * 0.3 + 4) * 127 + 128
    ],
    // Fire palette
    (v) => [
      Math.min(255, v * 3),
      Math.max(0, Math.min(255, v * 2 - 100)),
      Math.max(0, Math.min(255, v - 150))
    ],
    // Ocean palette
    (v) => [
      Math.max(0, Math.min(255, v - 100)),
      Math.max(0, Math.min(255, v - 50)),
      Math.min(255, v * 2)
    ]
  ];
  
  // Choose color scheme based on the current view
  let colorScheme;
  const viewWidth = xMax - xMin;
  
  if (viewWidth > 1) {
    colorScheme = colorSchemes[0]; // Rainbow for wide views
  } else if (viewWidth > 0.1) {
    colorScheme = colorSchemes[1]; // Fire for medium zoom
  } else {
    colorScheme = colorSchemes[2]; // Ocean for deep zoom
  }
  
  // Apply log scaling to iterations for more color bands in the interesting regions
  const smoothed = iterations / maxIterations;
  const scaled = Math.log(1 + 50 * smoothed) / Math.log(51);
  
  // Map to a cyclic color value to create bands
  const v = (scaled * 1000) % 256;
  
  return colorScheme(v).map(Math.round);
}

// Draw the Mandelbrot set
function drawMandelbrot() {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const complex = canvasToComplex(x, y);
      const iterations = mandelbrot(complex.real, complex.imag);
      const [r, g, b] = getColor(iterations);
      
      const pixelIndex = (y * canvas.width + x) * 4;
      data[pixelIndex] = r;
      data[pixelIndex + 1] = g;
      data[pixelIndex + 2] = b;
      data[pixelIndex + 3] = 255; // Alpha channel (fully opaque)
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// Handle zoom when clicking on the canvas
function handleZoom(event) {
  // Get click position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Convert to complex coordinates
  const clickPoint = canvasToComplex(x, y);
  
  // Calculate new boundaries (zoom in by factor of 5)
  const zoomFactor = 5;
  const newWidth = (xMax - xMin) / zoomFactor;
  const newHeight = (yMax - yMin) / zoomFactor;
  
  xMin = clickPoint.real - newWidth / 2;
  xMax = clickPoint.real + newWidth / 2;
  yMin = clickPoint.imag - newHeight / 2;
  yMax = clickPoint.imag + newHeight / 2;
  
  // Redraw with new boundaries
  drawMandelbrot();
}

// Handle zoom out when right-clicking on the canvas
function handleZoomOut(event) {
  // Prevent the default context menu
  event.preventDefault();
  
  // Get right-click position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Convert to complex coordinates
  const clickPoint = canvasToComplex(x, y);
  
  // Calculate new boundaries (zoom out by factor of 5)
  const zoomFactor = 5;
  const newWidth = (xMax - xMin) * zoomFactor;
  const newHeight = (yMax - yMin) * zoomFactor;
  
  xMin = clickPoint.real - newWidth / 2;
  xMax = clickPoint.real + newWidth / 2;
  yMin = clickPoint.imag - newHeight / 2;
  yMax = clickPoint.imag + newHeight / 2;
  
  // Redraw with new boundaries
  drawMandelbrot();
}

// Initialize
window.addEventListener('load', () => {
  setupCanvas();
  canvas.addEventListener('click', handleZoom);
  canvas.addEventListener('contextmenu', handleZoomOut);
});

// Handle window resize
window.addEventListener('resize', setupCanvas);