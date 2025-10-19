import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// Use DATABASE_URL if on Render, otherwise fallback to local Docker env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        preferredlang VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TYPE IF NOT EXISTS item_status AS ENUM ('open', 'closed');
      CREATE TABLE IF NOT EXISTS rooms (
        room_id VARCHAR(50) PRIMARY KEY,
        created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        status item_status DEFAULT 'open'
      );

      CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(50) REFERENCES rooms(room_id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        preferredlang VARCHAR(50) NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (room_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS translations (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(50) REFERENCES rooms(room_id) ON DELETE CASCADE,
        from_user UUID REFERENCES users(user_id) ON DELETE SET NULL,
        to_user UUID REFERENCES users(user_id) ON DELETE SET NULL,
        original_text TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        source_lang VARCHAR(10) NOT NULL,
        target_lang VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      -- Index to quickly fetch all translations for a room
      CREATE INDEX IF NOT EXISTS idx_translations_room ON translations(room_id, created_at);

      CREATE TABLE IF NOT EXISTS saved_phrases (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        original_text TEXT NOT NULL,
        translated_text TEXT NOT NULL,
        source_lang VARCHAR(10) NOT NULL,
        target_lang VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      -- Optional index for faster queries by language pair
      CREATE INDEX IF NOT EXISTS idx_saved_phrases_user_lang ON saved_phrases(user_id, source_lang, target_lang);

      CREATE TABLE IF NOT EXISTS user_language_pairs (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        source_lang VARCHAR(10) NOT NULL,
        target_lang VARCHAR(10) NOT NULL,
        UNIQUE(user_id, source_lang, target_lang)
      );
    `);

    console.log("✅ Tables initialized successfully.");
  } catch (err) {
    console.error("❌ Error initializing tables:", err);
  } finally {
    await pool.end();
    process.exit();
  }
}; 
