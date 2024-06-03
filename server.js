const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;
const JWT_SECRET = "your_jwt_secret"; // Use a strong secret key in production

app.use(bodyParser.json());

const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)",
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT, description TEXT)",
  );
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).send("Error hashing password");
    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      function (err) {
        if (err) return res.status(500).send("Error registering user");
        res.status(201).send("User registered");
      },
    );
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err || !user) return res.status(401).send("Invalid credentials");
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ id: user.id }, JWT_SECRET, {
          expiresIn: "1h",
        });
        console.log("Generated Token:", token); // Debug log
        res.json({ token });
      } else {
        res.status(401).send("Invalid credentials");
      }
    });
  });
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Authorization Header:", authHeader); // Debug log

  if (!authHeader) return res.status(403).send("Token is required");

  const token = authHeader.split(" ")[1];
  console.log("Parsed Token:", token); // Debug log

  if (!token) return res.status(403).send("Token is required");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded Token:", decoded); // Debug log
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("Token Verification Error:", err); // Debug log
    res.status(401).send("Invalid token");
  }
};

app.post("/items", authenticate, (req, res) => {
  const { name, description } = req.body;
  db.run(
    "INSERT INTO items (name, description) VALUES (?, ?)",
    [name, description],
    function (err) {
      if (err) return res.status(500).send("Error creating item");
      res.status(201).send("Item created");
    },
  );
});

app.get("/items", authenticate, (req, res) => {
  db.all("SELECT * FROM items", [], (err, rows) => {
    if (err) return res.status(500).send("Error retrieving items");
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
