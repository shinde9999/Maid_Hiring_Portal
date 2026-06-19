const pool = require("../config/db");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
      (name,email,password,role)
      VALUES($1,$2,$3,$4)
      RETURNING *`,
      [name, email, hashedPassword, role]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    res.status(500).json(err.message);
  }
};

const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {

  const { email, password } = req.body;

  const user = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if(user.rows.length === 0)
    return res.status(404).json("User not found");

  const valid = await bcrypt.compare(
    password,
    user.rows[0].password
  );

  if(!valid)
    return res.status(401).json("Wrong password");

  const token = jwt.sign(
    { id: user.rows[0].id },
    "secretkey"
  );

  res.json({
    token,
    user:user.rows[0]
  });
};