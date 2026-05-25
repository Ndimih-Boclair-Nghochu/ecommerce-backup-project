require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { pool } = require('./db');

async function cleanup() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM admin_activities');
    await client.query('DELETE FROM chat_messages');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM pos_receipts');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');
    await client.query(
      "DELETE FROM admins WHERE role = 'sub_admin' AND email ILIKE '%@example.com'"
    );
    await client.query('COMMIT');

    console.log('Cleanup completed. Demo products, orders, receipts, chats, categories, and example sub-admins were removed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cleanup failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup();
