import "dotenv/config";
import { pool } from "../server/db";

async function migrate() {
  try {
    console.log("Starting migration...");

    // First, create the users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        picture TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ Users table created");

    // Delete existing notes (they're seed data and don't have userId)
    await pool.query(`DELETE FROM notes`);
    console.log("✓ Cleared existing notes (seed data)");

    // Add userId column to notes table
    await pool.query(`
      ALTER TABLE notes 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) NOT NULL
    `);
    console.log("✓ Added user_id column to notes table");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate();

