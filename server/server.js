//  modules
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
require("dotenv").config();

// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(require("morgan")("dev"));

// Static files
app.use(express.static(path.join(__dirname, "client")));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

// Database connection 
const db = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

(async () => {
  try {
    const connection = await db.getConnection();
    console.log("Connected to database successfully");
    connection.release();
  } catch (err) {
    console.error("Database connection failed:", err.stack);
  }
})();

// JWT Authentication Middleware // this the cookies basically i thinik
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// API Routes
app.get("/api", (req, res) => {
  res.json({ message: "API is running!" });
});

app.post("/api/authenticate", async (req, res) => {
  const { user, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM userTable WHERE user = ?", [user]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ userId: rows[0].userId, user: rows[0].user }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token, message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to authenticate user" });
  }
});

app.post("/api/users", async (req, res) => {
  const { user, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query("INSERT INTO userTable (user, email, password) VALUES (?, ?, ?)", [
      user,
      email,
      hashedPassword,
    ]);
    res.status(201).json({ userId: result.insertId, message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM userTable");
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query("SELECT * FROM userTable WHERE userId = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { user, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query("UPDATE userTable SET user = ?, email = ?, password = ? WHERE userId = ?", [
      user,
      email,
      hashedPassword,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM userTable WHERE userId = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(rows[0]); // Ensure `wins` and `losses` are included in the response
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});


app.post("/api/updateWins", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const [result] = await db.query("UPDATE userTable SET wins = wins + 1 WHERE userId = ?", [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "Win added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add win" });
  }
});

app.post("/api/updateLosses", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const [result] = await db.query("UPDATE userTable SET losses = losses + 1 WHERE userId = ?", [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "Loss added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add loss" });
  }
});


// WebSocket Events
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("move", (data) => {
    console.log(`Move received from ${socket.id}:`, data);
    socket.broadcast.emit("update", data);
  });

  socket.on("mouseClick", (data) => {
    console.log("Mouse clicked at:", data);
    socket.broadcast.emit("updateAtoms", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
