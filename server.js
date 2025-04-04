const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({ origin: '*' })); // Allow all origins (for testing)
app.use(express.static("public"));

app.use(
  session({
    secret: "yourKey",
    resave: false,
    saveUninitialized: false,
  })
);

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Bornon25july",
  database: "PROJECT_BBA",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MYSQL Database");
});



  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Home.html"));
  });

// **REGISTER ROUTE (Without Hashing)**
app.post("/register", (req, res) => {
    const { username, password } = req.body;
  
    // Check if user already exists
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
  
      if (result.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }
  
      // Insert new user into database (Without hashing)
      db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }
        res.status(201).json({ message: "User registered successfully" });
      });
    });
  });


app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result[0];

    if (password === user.password) {
        req.session.user = user;
        return res.status(200).json({ message: "Login successful", redirect: "home.html" });
      } else {
        return res.status(401).json({ message: "Invalid username or password" });
      }
    });
  });

  app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("connect.sid"); // Clear session cookie
        return res.status(200).json({ message: "Logged out successfully" });
    });
});

// Add this endpoint to get all jobs
app.get("/api/jobs", (req, res) => {
  db.query("SELECT * FROM jobs ORDER BY id DESC", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    res.status(200).json(result);
  });
});

// Add this endpoint to get a specific job by ID
app.get("/api/job/:id", (req, res) => {
  const jobId = req.params.id;
  db.query("SELECT * FROM jobs WHERE id = ?", [jobId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json(result[0]);
  });
});


app.listen(3000, function () {
  console.log("SERVER STARTED");
});
