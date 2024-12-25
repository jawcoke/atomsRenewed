const express = require("express");


const app = express();
const port = 3001;

// Middleware to parse JSON
app.use(express.json());
app.use(cors({origin: "*"}));

const mysql = require("mysql2/promise");
require("dotenv").config();
// Database connection pool
const db = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
});

// Test database connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("Connected to database successfully");
    connection.release();
  } catch (err) {
    console.error("Database connection failed:", err.stack);
  }
})();


// Get userId by username
app.get("/users/id/:user", async (req, res) => {
  const { user } = req.params;

  try {
    const [rows] = await db.query("SELECT userId FROM userTable WHERE user = ?", [user]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ userId: rows[0].userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve userId" });
  }
});

// CRUD API Routes

// Create a new user
app.post("/users", async (req, res) => {
  const { user, email, password } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO userTable (user, email, password) VALUES (?, ?, ?)",
      [user, email, password]
    );
    res.status(201).json({ userId: result.insertId, message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Read all users
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM userTable");
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});



// Read a single user by ID
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

// Update a user by ID
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { user, email, password } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE userTable SET user = ?, email = ?, password = ? WHERE userId = ?",
      [user, email, password, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete a user by ID
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM userTable WHERE userId = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});
