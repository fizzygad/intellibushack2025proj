import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pkg from "pg";

const router = express.Router();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER || "fizzygad",
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST || "postgres",
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || "minidatabase",
});

const JWT_SECRET = process.env.JWT_SECRET;

// --- User Signup ---
router.post("/signup", async (req, res) => {
  const { first_name, last_name, username, email, password, preferredlang } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, username, email, password_hash, preferredlang)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, username, email, preferredlang`,
      [first_name, last_name, username, email, hashed, preferredlang]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.user_id, username }, JWT_SECRET, { expiresIn: "2h" });

    res.json({ user, token });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(400).json({ message: "Signup failed. Email or username may already exist." });
  }
});

// --- User Login ---
router.post("/login", async (req, res) => {
  const { emailOrUsername, password } = req.body; // allow login by email OR username
  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 OR username = $1`,
      [emailOrUsername]
    );

    if (result.rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: "2h" });
    res.json({ user: { user_id: user.user_id, username: user.username, email: user.email, preferredlang: user.preferredlang }, token });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;