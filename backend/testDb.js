const pool = require("./config/db");

pool.query(`
  SELECT column_name, column_default 
  FROM information_schema.columns 
  WHERE table_schema='public' AND table_name='requests'
  ORDER BY ordinal_position
`, (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Column defaults for requests table:");
    console.log(res.rows);
  }

  pool.end();
});

