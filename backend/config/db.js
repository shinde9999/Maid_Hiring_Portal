const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "maid_portal",
  password: "@Aniket2003",
  port: 5432,
});

module.exports = pool;