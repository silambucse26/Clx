const { Pool } = require('pg');
const connectionString = 'postgresql://postgres.spoizlqpcdkeinzvvjcw:8_%40UiAh2%4059vn%24a@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Success! Database time:', res.rows[0]);
  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await pool.end();
  }
}

main();
