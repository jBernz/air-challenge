import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables at the module level
// This ensures variables are available before any functions are called
dotenv.config();

// Get database URL from environment variables
const getDbUrl = () => {
  const dbUrl = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DATABASE_URL 
    : process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("Database URL not found in environment variables");
    // Provide a fallback or throw an error based on your preference
  }
  
  return dbUrl;
};

// Create pool with lazy initialization
let pool: Pool;

// Get or initialize the database pool
export function getPool(): Pool {
  if (!pool) {
    const dbUrl = getDbUrl();
    console.log(`Initializing database connection with URL: ${dbUrl}`);
    
    pool = new Pool({
      connectionString: dbUrl,
    });
  }
  return pool;
}

// Initialize database
export async function initializeDatabase() {
  try {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}