let socket;
let gridSize = 8; // Example grid size (8x8 grid)
let atoms = [];

function setup() {
  createCanvas(400, 400);
  socket = io(); // Connect to the backend

  // Listen for updates from the server
  socket.on('updateAtoms', (data) => {
    atoms.push(data); // Add the atom to the array
  });
}

function draw() {
  background(255);

  // Draw the grid
  drawGrid();

  // Draw atoms
  for (let atom of atoms) {
    fill(atom.color);
    ellipse(atom.x, atom.y, 40, 40);
  }
}

// Draw the grid
function drawGrid() {
  stroke(0);
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      rect(i * width / gridSize, j * height / gridSize, width / gridSize, height / gridSize);
    }
  }
}

// Handle mouse clicks
function mousePressed() {
  // Get grid position
  let xPos = Math.floor(mouseX / (width / gridSize));
  let yPos = Math.floor(mouseY / (height / gridSize));

  // Send the click data to the server
  let atom = {
    x: (xPos * width) / gridSize + width / (2 * gridSize),
    y: (yPos * height) / gridSize + height / (2 * gridSize),
    color: color(random(255), random(255), random(255)) // Random color for the atom
  };

  socket.emit('mouseClick', atom); // Emit click event to the server
}
