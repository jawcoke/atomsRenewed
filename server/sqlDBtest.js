const mysql = require("mysql2");
const db = mysql.createPool({
  connectionLimit: 100,
  host: "3.136.171.11",
  user: "newuser",
  password: "Poseidon1!",
  database: "userDB",
  port: 3306,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    return;
  }
  console.log("Connected to database as ID", connection.threadId);
});
