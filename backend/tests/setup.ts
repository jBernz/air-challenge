import { Pool } from 'pg';

// Create a test database connection
const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/boards_test'
});

// Function to reset the database before tests
async function resetDatabase(): Promise<void> {
  try {
    // Drop and recreate the boards table
    await pool.query('DROP TABLE IF EXISTS boards CASCADE');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Test database reset successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

// Function to close database connection
async function closeDatabase(): Promise<void> {
  await pool.end();
}

export {
  pool,
  resetDatabase,
  closeDatabase
};