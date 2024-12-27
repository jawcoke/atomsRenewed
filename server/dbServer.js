const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;

const bcrypt = require("bcrypt");
const hashedPassword = await bcrypt.hash(password, 10);

// Middleware to parse JSON
app.use(express.json());
app.use(cors({ origin: "*" }));

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


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user; // Attach user payload to request
    next();
  });
};

app.get("/api/protected-route", authenticateToken, (req, res) => {
  res.status(200).json({ message: `Welcome ${req.user.user}`, data: "This is protected data" });
});


// Get userId by username
app.get("/api/users/id/:user", async (req, res) => {
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

app.post("/api/authenticate", async (req, res) => {
  const { user, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM userTable WHERE user = ? AND password = ?",
      [user, password]
    );

    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }


    // Create a JWT payload
    const payload = { userId: rows[0].userId, user: rows[0].user };

    // Generate a token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ token, message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to authenticate user" });
  }
});


// CRUD API Routes

// Create a new user
app.post("/api/users", async (req, res) => {
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






      // Add event listener to the "log in" link FOR guestBox
      document
        .getElementById("showLogin2")
        .addEventListener("click", function (event) {
          event.preventDefault();
          document.getElementById("loginBox").style.display = "block"; // this shows the guest box
          document.querySelector(".signupBox").style.display = "none";
        });

      document
        .getElementById("showLogin")
        .addEventListener("click", function (event) {
          event.preventDefault(); // Prevent default link behavior
          document.getElementById("loginBox").style.display = "block"; // Show the login box
          document.querySelector(".guestBox").style.display = "none"; // Hide the signup box
        });

      document
        .getElementById("showSignup")
        .addEventListener("click", function (event) {
          event.preventDefault();
          document.getElementById("signupBox").style.display = "block"; // this shows the signup box
          document.querySelector(".loginBox").style.display = "none"; // hides the login box xD
        });

      document
        .getElementById("showUserData")
        .addEventListener("click", function (event) {
          event.preventDefault();
          document.getElementById("userBox").style.display = "block";
          document.getElementById("guestBox").style.display = "none";
          document.querySelector("loginBox").style.display = "none";
        });