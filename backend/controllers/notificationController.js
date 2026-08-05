const pool = require("../config/db");

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Mark messages sent to this user as 'delivered' if they were 'sent'
    await pool.query(
      "UPDATE messages SET status = 'delivered' WHERE receiver_id = $1 AND status = 'sent'",
      [userId]
    );

    const result = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json(err.message);
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json("Notification not found");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json(err.message);
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      "UPDATE notifications SET is_read = true WHERE user_id = $1",
      [userId]
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    res.status(500).json(err.message);
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json("Notification not found");
    }

    res.json({ success: true, id: parseInt(id, 10) });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json(err.message);
  }
};
