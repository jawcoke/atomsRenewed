let socket;
let gridSize = 8; // 8x8 grid
let atomRadius = 20;
let atoms = []; // Store the atoms that are placed
let gameData = {};

function setup() {
  // Create the canvas and attach it to the div with the id 'game-container'
  let canvas = createCanvas(400, 400); // Creates a 400x400 canvas
  canvas.parent('game-container'); // Attach the canvas to the 'game-container' div
  
  socket = io(); // Establish WebSocket connection with the server

  // Retrieve game and player info from the URL params
  const urlParams = new URLSearchParams(window.location.search);
  gameData.gameName = urlParams.get('gameName');
  gameData.userName = urlParams.get('userName');
  console.log("Game:", gameData.gameName);
  console.log("Player:", gameData.userName);

  // Listen for updates from other clients
  socket.on('updateAtoms', (data) => {
    atoms.push(data);
  });
}

function draw() {
  background(255); // Clear the canvas with a white background

  drawGrid(); // Draw the grid for the game

  // Draw the atoms (colored circles) that have been placed
  for (let atom of atoms) {
    fill(atom.color);
    ellipse(atom.x, atom.y, atomRadius * 2, atomRadius * 2); // Draw atoms as circles
  }
}

function drawGrid() {
  stroke(0); // Set stroke color for grid lines
  noFill(); // Don't fill the cells, just outline them
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      rect(i * width / gridSize, j * height / gridSize, width / gridSize, height / gridSize);
    }
  }
}

function mousePressed() {
  let xPos = Math.floor(mouseX / (width / gridSize));
  let yPos = Math.floor(mouseY / (height / gridSize));

  // Position the atom at the center of the grid cell
  let atom = {
    x: (xPos * width) / gridSize + width / (2 * gridSize),
    y: (yPos * height) / gridSize + height / (2 * gridSize),
    color: color(random(255), random(255), random(255)) // Random color for the atom
  };

  // Emit the atom data to other players
  socket.emit('mouseClick', atom);
}
