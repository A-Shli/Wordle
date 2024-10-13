-- Create words table if it doesn't exist
CREATE TABLE IF NOT EXISTS words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(5) NOT NULL UNIQUE
);

-- Insert sample words (you can expand this list)
INSERT INTO words (word) VALUES 
  ('which'),
  ('there'),
  ('their'),
  ('about'),
  ('would'),
  ('these'),
  ('other'),
  ('words'),
  ('could'),
  ('write'),
  ('first');
