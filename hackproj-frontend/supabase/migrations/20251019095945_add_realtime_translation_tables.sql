/*
  # Add Real-time Translation Support Tables

  1. New Tables
    - `saved_phrases`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `original_text` (text)
      - `translated_text` (text)
      - `source_lang` (text)
      - `target_lang` (text)
      - `created_at` (timestamptz)

    - `room_translations`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `from_user` (uuid, references profiles)
      - `original_text` (text)
      - `translated_text` (text)
      - `source_lang` (text)
      - `target_lang` (text)
      - `created_at` (timestamptz)

  2. Indexes
    - Add index on room_translations for efficient queries
    - Add index on saved_phrases for language pair lookups

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Saved phrases table
CREATE TABLE IF NOT EXISTS saved_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  original_text text NOT NULL,
  translated_text text NOT NULL,
  source_lang text NOT NULL,
  target_lang text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_phrases_user_lang 
  ON saved_phrases(user_id, source_lang, target_lang);

ALTER TABLE saved_phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved phrases"
  ON saved_phrases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved phrases"
  ON saved_phrases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved phrases"
  ON saved_phrases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Room translations table
CREATE TABLE IF NOT EXISTS room_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  from_user uuid REFERENCES profiles(id) ON DELETE SET NULL,
  original_text text NOT NULL,
  translated_text text NOT NULL,
  source_lang text NOT NULL,
  target_lang text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_translations_room 
  ON room_translations(room_id, created_at DESC);

ALTER TABLE room_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room participants can view translations"
  ON room_translations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_participants rp
      WHERE rp.room_id = room_translations.room_id
      AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Room participants can insert translations"
  ON room_translations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user AND
    EXISTS (
      SELECT 1 FROM room_participants rp
      WHERE rp.room_id = room_translations.room_id
      AND rp.user_id = auth.uid()
    )
  );

-- Add preferred_language column to room_participants if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'room_participants' AND column_name = 'preferred_lang'
  ) THEN
    ALTER TABLE room_participants ADD COLUMN preferred_lang text DEFAULT 'en';
  END IF;
END $$;
