const pool = require("../config/db");

// GET /api/chat/contacts
exports.getContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get users with whom the current user has messaged
    const contactsRes = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.role, u.photo_url
       FROM users u
       WHERE u.id != $1 AND (
         u.id IN (SELECT receiver_id FROM messages WHERE sender_id = $1) OR
         u.id IN (SELECT sender_id FROM messages WHERE receiver_id = $1)
       )
       ORDER BY u.name`,
      [userId]
    );

    res.json(contactsRes.rows);
  } catch (err) {
    console.error("getContacts error:", err);
    res.status(500).json(err.message);
  }
};

// GET /api/chat/search?q=query
exports.searchContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const searchQuery = `%${q}%`;
    const result = await pool.query(
      `SELECT id, name, email, role, photo_url
       FROM users
       WHERE id != $1 AND (name ILIKE $2 OR email ILIKE $2)
       LIMIT 10`,
      [userId, searchQuery]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("searchContacts error:", err);
    res.status(500).json(err.message);
  }
};

// GET /api/chat/messages/:otherUserId
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    // Delete message notifications from this sender to the current user
    const senderRes = await pool.query("SELECT name FROM users WHERE id = $1", [otherUserId]);
    if (senderRes.rows.length > 0) {
      const senderName = senderRes.rows[0].name;
      await pool.query(
        `DELETE FROM notifications 
         WHERE user_id = $1 AND title = 'New Message' AND message LIKE $2`,
        [userId, `New message from ${senderName}%`]
      );
    }

    const messagesRes = await pool.query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId, otherUserId]
    );

    res.json(messagesRes.rows);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json(err.message);
  }
};

// POST /api/chat/messages
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId || !message || !message.trim()) {
      return res.status(400).json("Receiver ID and message content are required");
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [senderId, receiverId, message.trim()]
    );

    // Fetch sender name to create an alert notification for the receiver
    const senderRes = await pool.query("SELECT name FROM users WHERE id = $1", [senderId]);
    const senderName = senderRes.rows[0]?.name || "User";

    await pool.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1, $2, $3)`,
      [
        receiverId,
        "New Message",
        `New message from ${senderName}: "${message.length > 40 ? message.substring(0, 40) + '...' : message}"`
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json(err.message);
  }
};
