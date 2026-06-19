const pool = require("../config/db");

exports.createProfile = async (req,res)=>{
  try {
    const {
      age,
      gender,
      address,
      experience,
      salary,
      availability,
      skills,
      contact,
      timings,
      photo_url
      ,languages
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO maid_profiles
      (
        user_id,
        age,
        gender,
        address,
        experience,
        salary,
        availability,
        skills,
        contact,
                timings
        ,photo_url
        ,languages
      )
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        req.user.id,
        age,
        gender,
        address,
        experience,
        salary,
        availability,
        skills,
        contact,
        timings,
        photo_url
        ,languages
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('createProfile error:', err);
    res.status(500).json(err.message);
  }
};


exports.getAllMaids = async(req,res)=>{
  try {
    const result = await pool.query(
      `
      SELECT
      u.name,
      m.id,
      m.address,
      m.salary,
      m.experience,
      m.availability,
      m.skills,
      m.contact,
      m.timings,
      m.photo_url
      FROM maid_profiles m
      JOIN users u
      ON u.id = m.user_id
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getAllMaids error:', err);
    res.status(500).json(err.message);
  }
};


exports.updateProfile = async (req,res)=>{
  try {
    const {
      age,
      gender,
      address,
      experience,
      salary,
      availability,
      skills,
      contact,
      timings,
      photo_url
      ,languages
    } = req.body;

    const result = await pool.query(
      `
      UPDATE maid_profiles
      SET age = $1,
          gender = $2,
          address = $3,
          experience = $4,
          salary = $5,
          availability = $6,
          skills = $7,
          contact = $8,
          timings = $9
         ,photo_url = $10
        ,languages = $11
      WHERE user_id = $12
      RETURNING *
      `,
      [
        age,
        gender,
        address,
        experience,
        salary,
        availability,
        skills,
        contact,
        timings,
        photo_url,
        languages,
        req.user.id
      ]
    );

    if(result.rows.length === 0) return res.status(404).json('Profile not found');

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json(err.message);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM maid_profiles
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json('Profile not found');
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json(err.message);
  }
};

exports.getProfileById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT m.*, u.name as maid_name, u.email as maid_email FROM maid_profiles m JOIN users u ON u.id = m.user_id WHERE m.id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json('Profile not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getProfileById error:', err);
    res.status(500).json(err.message);
  }
};

exports.addRating = async (req, res) => {
  const { id } = req.params; // maid_profile id
  const { rating, comment } = req.body;
  try {
    // ensure maid profile exists
    const profileRes = await pool.query('SELECT id FROM maid_profiles WHERE id = $1', [id]);
    if (profileRes.rows.length === 0) return res.status(404).json('Profile not found');

    // insert rating
    const insertRes = await pool.query('INSERT INTO ratings (maid_profile_id, user_id, rating, comment) VALUES($1,$2,$3,$4) RETURNING *', [id, req.user.id, rating, comment]);

    // update aggregated rating on maid_profiles
    const aggRes = await pool.query('SELECT AVG(rating) as avg, COUNT(*) as count FROM ratings WHERE maid_profile_id = $1', [id]);
    const avg = aggRes.rows[0].avg;
    const count = parseInt(aggRes.rows[0].count, 10);
    await pool.query('UPDATE maid_profiles SET rating_avg = $1, rating_count = $2 WHERE id = $3', [avg, count, id]);

    res.json(insertRes.rows[0]);
  } catch (err) {
    console.error('addRating error:', err);
    res.status(500).json(err.message);
  }
};

exports.getRatingsForProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const resu = await pool.query('SELECT r.*, u.name as user_name FROM ratings r JOIN users u ON u.id = r.user_id WHERE r.maid_profile_id = $1 ORDER BY r.created_at DESC', [id]);
    res.json(resu.rows);
  } catch (err) {
    console.error('getRatingsForProfile error:', err);
    res.status(500).json(err.message);
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json('No file uploaded');
    // store accessible url path - return full URL so frontend can fetch across origins
    const relativePath = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
    await pool.query('UPDATE maid_profiles SET photo_url = $1 WHERE user_id = $2', [fullUrl, req.user.id]);
    res.json({ photo_url: fullUrl });
  } catch (err) {
    console.error('uploadPhoto error:', err);
    res.status(500).json(err.message);
  }
};

