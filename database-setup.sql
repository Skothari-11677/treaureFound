-- Create submissions table for Treasure in the Shell event
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  team_id VARCHAR(10) NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
  password TEXT NOT NULL,
  difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_level ON submissions(level);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is an event app)
-- In production, you might want more restrictive policies
CREATE POLICY "Allow all operations on submissions" ON submissions
FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON submissions TO anon;
GRANT ALL ON submissions TO authenticated;
GRANT USAGE ON SEQUENCE submissions_id_seq TO anon;
GRANT USAGE ON SEQUENCE submissions_id_seq TO authenticated;
