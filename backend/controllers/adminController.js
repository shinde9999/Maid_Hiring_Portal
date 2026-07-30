const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");
    const maidsCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'maid'");
    const clientsCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
    const profilesCount = await pool.query("SELECT COUNT(*) FROM maid_profiles");
    const requestsCount = await pool.query("SELECT COUNT(*) FROM requests");
    const activeRequests = await pool.query("SELECT COUNT(*) FROM requests WHERE status = 'Pending'");
    const avgRating = await pool.query("SELECT AVG(rating_avg) as rating FROM maid_profiles");

    res.json({
      totalUsers: parseInt(usersCount.rows[0].count, 10),
      totalMaids: parseInt(maidsCount.rows[0].count, 10),
      totalClients: parseInt(clientsCount.rows[0].count, 10),
      totalProfiles: parseInt(profilesCount.rows[0].count, 10),
      totalRequests: parseInt(requestsCount.rows[0].count, 10),
      activeRequests: parseInt(activeRequests.rows[0].count, 10),
      averageRating: parseFloat(avgRating.rows[0].rating || 0).toFixed(1),
    });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json(err.message);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role, contact, address, languages, photo_url, created_at FROM users ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json(err.message);
  }
};

// POST /api/admin/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, contact, address, languages } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json("Please provide name, email, password, and role");
    }

    // Check if email already exists
    const checkEmail = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json("Email is already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, contact, address, languages)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, contact, address, languages, created_at`,
      [name, email, hashedPassword, role, contact || "", address || "", languages || ""]
    );

    // If role is maid, optionally initialize an empty maid profile
    if (role === "maid") {
      await pool.query(
        `INSERT INTO maid_profiles (user_id, age, gender, address, experience, salary, availability, skills, contact, timings, languages)
         VALUES ($1, 25, 'Female', $2, 1, 5000, 'Available', 'Cleaning', $3, 'Morning (6am-10am)', $4)`,
        [result.rows[0].id, address || "", contact || "", languages || ""]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json(err.message);
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, contact, address, languages } = req.body;

    const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json("User not found");
    }

    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, role = $3, contact = $4, address = $5, languages = $6
       WHERE id = $7
       RETURNING id, name, email, role, contact, address, languages`,
      [name, email, role, contact, address, languages, id]
    );

    // Sync role change with maid profiles
    if (role !== "maid") {
      // If no longer maid, remove their maid profile
      await pool.query("DELETE FROM maid_profiles WHERE user_id = $1", [id]);
    } else {
      // If changed to maid, ensure they have a profile
      const profileCheck = await pool.query("SELECT id FROM maid_profiles WHERE user_id = $1", [id]);
      if (profileCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO maid_profiles (user_id, age, gender, address, experience, salary, availability, skills, contact, timings, languages)
           VALUES ($1, 25, 'Female', $2, 1, 5000, 'Available', 'Cleaning', $3, $4)`,
          [id, address || "", contact || "", languages || ""]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json(err.message);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Safety checks / CASCADE deletions
    await pool.query("DELETE FROM ratings WHERE user_id = $1 OR maid_profile_id IN (SELECT id FROM maid_profiles WHERE user_id = $1)", [id]);
    await pool.query("DELETE FROM requests WHERE user_id = $1 OR maid_id IN (SELECT id FROM maid_profiles WHERE user_id = $1)", [id]);
    await pool.query("DELETE FROM maid_profiles WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1", [id]);
    await pool.query("DELETE FROM notifications WHERE user_id = $1", [id]);

    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json("User not found");
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json(err.message);
  }
};

// GET /api/admin/maids
exports.getMaidProfiles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, u.name as maid_name, u.email as maid_email
      FROM maid_profiles m
      JOIN users u ON u.id = m.user_id
      ORDER BY m.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("getMaidProfiles error:", err);
    res.status(500).json(err.message);
  }
};

// POST /api/admin/maids
exports.createMaidProfile = async (req, res) => {
  try {
    const { user_id, age, gender, address, experience, salary, availability, skills, contact, timings, languages } = req.body;
    if (!user_id) return res.status(400).json("User ID is required");

    // Verify user exists and is a maid
    const userCheck = await pool.query("SELECT role FROM users WHERE id = $1", [user_id]);
    if (userCheck.rows.length === 0) return res.status(404).json("User not found");
    if (userCheck.rows[0].role !== "maid") return res.status(400).json("User role is not 'maid'");

    // Check if profile already exists
    const profileCheck = await pool.query("SELECT id FROM maid_profiles WHERE user_id = $1", [user_id]);
    if (profileCheck.rows.length > 0) return res.status(400).json("Maid profile already exists for this user");

    const result = await pool.query(
      `INSERT INTO maid_profiles (user_id, age, gender, address, experience, salary, availability, skills, contact, timings, languages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [user_id, age || 25, gender || "Female", address || "", experience || 1, salary || 5000, availability || "Available", skills || "", contact || "", timings || "", languages || ""]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("createMaidProfile error:", err);
    res.status(500).json(err.message);
  }
};

// PUT /api/admin/maids/:id
exports.updateMaidProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { age, gender, address, experience, salary, availability, skills, contact, timings, languages } = req.body;

    const result = await pool.query(
      `UPDATE maid_profiles
       SET age = $1, gender = $2, address = $3, experience = $4, salary = $5, availability = $6, skills = $7, contact = $8, timings = $9, languages = $10
       WHERE id = $11
       RETURNING *`,
      [age, gender, address, experience, salary, availability, skills, contact, timings, languages, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json("Maid profile not found");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateMaidProfile error:", err);
    res.status(500).json(err.message);
  }
};

// DELETE /api/admin/maids/:id
exports.deleteMaidProfile = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM ratings WHERE maid_profile_id = $1", [id]);
    await pool.query("DELETE FROM requests WHERE maid_id = $1", [id]);

    const result = await pool.query("DELETE FROM maid_profiles WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json("Maid profile not found");
    }
    res.json({ success: true, message: "Maid profile deleted successfully" });
  } catch (err) {
    console.error("deleteMaidProfile error:", err);
    res.status(500).json(err.message);
  }
};

// GET /api/admin/requests
exports.getRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*,
             u_client.name as client_name, u_client.email as client_email,
             u_maid.name as maid_name, m.skills as maid_skills
      FROM requests r
      JOIN users u_client ON u_client.id = r.user_id
      JOIN maid_profiles m ON m.id = r.maid_id
      JOIN users u_maid ON u_maid.id = m.user_id
      ORDER BY r.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("getRequests error:", err);
    res.status(500).json(err.message);
  }
};

// PUT /api/admin/requests/:id
exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, start_date, work_hours, message } = req.body;

    const result = await pool.query(
      `UPDATE requests
       SET status = $1, start_date = $2, work_hours = $3, message = $4
       WHERE id = $5
       RETURNING *`,
      [status, start_date, work_hours, message, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json("Request not found");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateRequest error:", err);
    res.status(500).json(err.message);
  }
};

// DELETE /api/admin/requests/:id
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM requests WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json("Request not found");
    }
    res.json({ success: true, message: "Request deleted successfully" });
  } catch (err) {
    console.error("deleteRequest error:", err);
    res.status(500).json(err.message);
  }
};
