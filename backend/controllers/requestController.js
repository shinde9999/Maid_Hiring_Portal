const pool = require("../config/db");

exports.sendRequest = async(req,res)=>{

 const {
  maid_id,
  message,
  start_date,
  work_hours
 } = req.body;

 try {
  const result = await pool.query(
    `
    INSERT INTO requests
    (
      user_id,
      maid_id,
      message,
      start_date,
      work_hours
    )
    VALUES($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [
     req.user.id,
     maid_id,
     message,
     start_date,
     work_hours
    ]
  );

  res.json(result.rows[0]);
 } catch (err) {
  console.error('sendRequest error:', err);
  res.status(500).json(err.message);
 }
};

// New: get requests for the authenticated maid
exports.getRequestsForMaid = async (req, res) => {
  try {
    // find maid profile id for this user
    const profileRes = await pool.query(
      'SELECT id FROM maid_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json('Maid profile not found');
    }

    const profileId = profileRes.rows[0].id;

    const result = await pool.query(
      `
      SELECT r.*, u.name as user_name, u.email as user_email, u.photo_url as user_photo_url
      FROM requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.maid_id = $1
      ORDER BY r.id DESC
      `,
      [profileId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getRequestsForMaid error:', err);
    res.status(500).json(err.message);
  }
};

// New: get requests sent by the authenticated user
exports.getRequestsForUser = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT r.*, u.name as maid_name, m.contact as maid_contact, m.skills as maid_skills
      FROM requests r
      JOIN maid_profiles m ON m.id = r.maid_id
      JOIN users u ON u.id = m.user_id
      WHERE r.user_id = $1
      ORDER BY r.id DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getRequestsForUser error:', err);
    res.status(500).json(err.message);
  }
};

// New: update request status (Accept/Reject/Cancel)
exports.updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!['Accepted', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json('Invalid status');
    }

    const requestRes = await pool.query(
      'SELECT * FROM requests WHERE id = $1',
      [id]
    );

    if (requestRes.rows.length === 0) {
      return res.status(404).json('Request not found');
    }

    const request = requestRes.rows[0];

    const maidProfileRes = await pool.query(
      'SELECT id FROM maid_profiles WHERE user_id = $1',
      [req.user.id]
    );
    const isMaidAssigned = maidProfileRes.rows.length > 0 && maidProfileRes.rows[0].id === request.maid_id;
    const isCreator = request.user_id === req.user.id;

    if (!isMaidAssigned && !isCreator) {
      return res.status(403).json('Not authorized to update this request');
    }

    if (isCreator && status === 'Cancelled' && request.status !== 'Pending') {
      return res.status(400).json('Can only cancel pending requests');
    }

    if (isMaidAssigned && ['Accepted', 'Rejected'].includes(status) && request.status !== 'Pending') {
      return res.status(400).json('Can only accept or reject pending requests');
    }

    const result = await pool.query(
      `
      UPDATE requests
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateRequestStatus error:', err);
    res.status(500).json(err.message);
  }
};

// Maid accepts a request
exports.acceptRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    // find maid profile id for this user
    const profileRes = await pool.query(
      'SELECT id FROM maid_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json('Maid profile not found');
    }

    const profileId = profileRes.rows[0].id;

    // Update only if this request is assigned to this maid
    const result = await pool.query(
      `
      UPDATE requests
      SET status = $1
      WHERE id = $2 AND maid_id = $3
      RETURNING *
      `,
      ['accepted', requestId, profileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json('Request not found or not assigned to you');
    }

    // Return only minimal response to avoid sending maid contact/details
    const row = result.rows[0];
    res.json({ id: row.id, status: row.status });
  } catch (err) {
    console.error('acceptRequest error:', err);
    res.status(500).json(err.message);
  }
};
