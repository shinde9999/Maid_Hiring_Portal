const pool = require('../config/db');

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, contact, address, photo_url, role FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json('User not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json(err.message);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, contact, address, photo_url, languages } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = $1, contact = $2, address = $3, photo_url = $4, languages = $5 WHERE id = $6 RETURNING id, name, email, contact, address, photo_url, role, languages',
      [name, contact, address, photo_url, languages, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json('User not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json(err.message);
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json('No file uploaded');
    const relativePath = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
    await pool.query('UPDATE users SET photo_url = $1 WHERE id = $2', [fullUrl, req.user.id]);
    res.json({ photo_url: fullUrl });
  } catch (err) {
    console.error('uploadPhoto error:', err);
    res.status(500).json(err.message);
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    // Optionally cleanup related data (requests, maid_profiles, ratings) if your DB doesn't have ON DELETE CASCADE
    // For safety, attempt cascading deletes where appropriate
    await pool.query('DELETE FROM ratings WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM requests WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM maid_profiles WHERE user_id = $1', [req.user.id]);

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.user.id]);
    if (result.rowCount === 0) return res.status(404).json('User not found');
    res.json({ success: true });
  } catch (err) {
    console.error('deleteAccount error:', err);
    res.status(500).json(err.message);
  }
};