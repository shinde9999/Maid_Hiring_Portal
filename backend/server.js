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

const maidRoutes = require("./routes/maidRoutes");
app.use("/api/maids", maidRoutes);

const requestRoutes = require("./routes/requestRoutes");
app.use("/api/requests", requestRoutes);

app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

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

    // Create messages table if not exists
    await pool.query(`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );`);

    // Ensure status column exists in messages table and backfill null values
    await pool.query("ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';");
    await pool.query("UPDATE messages SET status = 'read' WHERE status IS NULL;");

    // Create notifications table if not exists
    await pool.query(`CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now()
    );`);

    // Seed default admin user if no admin exists
    const adminCheck = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    if (adminCheck.rows.length === 0) {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ["System Admin", "admin@maidportal.com", hashedPassword, "admin"]
      );
      console.log("Seeded default admin user (admin@maidportal.com / admin123)");
    }

    console.log('Schema check: ensured maid_profiles columns, ratings table, users table fields, chat, notifications, and admin seeding');
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