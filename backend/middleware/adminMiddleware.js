const pool = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json("Unauthorized: No user credentials");
    }

    const result = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json("User not found");
    }

    if (result.rows[0].role !== "admin") {
      return res.status(403).json("Access denied. Admins only.");
    }

    next();
  } catch (err) {
    console.error("adminMiddleware error:", err);
    res.status(500).json(err.message);
  }
};
