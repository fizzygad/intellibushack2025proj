/*
  # OmniVST Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `username` (text, unique)
      - `email` (text)
      - `preferred_language` (text)
      - `saved_phrases` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `translation_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `source_language` (text)
      - `target_language` (text)
      - `original_text` (text)
      - `translated_text` (text)
      - `created_at` (timestamptz)
    
    - `language_pairs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `source_language` (text)
      - `target_language` (text)
      - `is_favorite` (boolean)
      - `created_at` (timestamptz)
    
    - `rooms`
      - `id` (uuid, primary key)
      - `room_code` (text, unique)
      - `created_by` (uuid, references profiles)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
    
    - `room_participants`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `user_id` (uuid, references profiles)
      - `joined_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text,
  last_name text,
  username text UNIQUE,
  email text,
  preferred_language text DEFAULT 'English',
  saved_phrases text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Translation history table
CREATE TABLE IF NOT EXISTS translation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  source_language text NOT NULL,
  target_language text NOT NULL,
  original_text text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own translation history"
  ON translation_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own translation history"
  ON translation_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own translation history"
  ON translation_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Language pairs table
CREATE TABLE IF NOT EXISTS language_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  source_language text NOT NULL,
  target_language text NOT NULL,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE language_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own language pairs"
  ON language_pairs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own language pairs"
  ON language_pairs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own language pairs"
  ON language_pairs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own language pairs"
  ON language_pairs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Room participants table
CREATE TABLE IF NOT EXISTS room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view room participants"
  ON room_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_participants rp
      WHERE rp.room_id = room_participants.room_id
      AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms"
  ON room_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON room_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);