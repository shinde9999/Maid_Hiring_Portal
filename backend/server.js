const express = require("express");
const cors = require("cors");
const path = require('path');
const fs = require('fs');

const authRoutes = require("./routes/authRoutes");
const pool = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const maidRoutes =
require("./routes/maidRoutes");

app.use("/api/maids", maidRoutes);


const requestRoutes =
require("./routes/requestRoutes");

app.use(
 "/api/requests",
 requestRoutes
);

// ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Ensure required columns exist to avoid runtime SQL errors
async function ensureColumns() {
  try {
    await pool.query("ALTER TABLE IF EXISTS maid_profiles ADD COLUMN IF NOT EXISTS skills TEXT;");
    await pool.query("ALTER TABLE IF EXISTS maid_profiles ADD COLUMN IF NOT EXISTS contact TEXT;");
    await pool.query("ALTER TABLE IF EXISTS maid_profiles ADD COLUMN IF NOT EXISTS timings TEXT;");
    await pool.query("ALTER TABLE IF EXISTS maid_profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;");
    await pool.query("ALTER TABLE IF EXISTS maid_profiles ADD COLUMN IF NOT EXISTS languages TEXT;");
    // Add rating summary columns
    await pool.query("ALTER TABLE IF EXISTS maid_profiles ADD COLUMN IF NOT EXISTS rating_avg NUMERIC;");
    await pool.query("ALTER TABLE IF EXISTS maid_profiles ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;");

    // Create ratings table if not exists
    await pool.query(`CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      maid_profile_id INTEGER REFERENCES maid_profiles(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT now()
    );`);
    // Ensure users table has profile fields
    await pool.query("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS contact TEXT;");
    await pool.query("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS address TEXT;");
    await pool.query("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS photo_url TEXT;");
    await pool.query("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS languages TEXT;");

    console.log('Schema check: ensured maid_profiles columns, ratings table, and users table fields');
  } catch (err) {
    console.error('Schema migration failed:', err.message || err);
    // do not throw — allow server to start so user can see logs
  }
}

// Start server after ensuring columns
ensureColumns().then(() => {
  app.listen(5000, () => {
    console.log("Server running");
  });
}).catch((err) => {
  console.error('Startup failed:', err);
  app.listen(5000, () => {
    console.log("Server running (with errors)");
  });
});