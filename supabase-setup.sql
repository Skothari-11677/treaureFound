-- ===============================================
-- TREASURE IN THE SHELL - SUPABASE SETUP
-- ===============================================

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id BIGSERIAL PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
    password TEXT NOT NULL,
    difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON public.submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_level ON public.submissions(level);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_team_level ON public.submissions(team_id, level DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (needed for the event)
CREATE POLICY "Enable read access for all users" ON public.submissions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.submissions
    FOR INSERT WITH CHECK (true);

-- Grant permissions to anon and authenticated roles
GRANT ALL ON public.submissions TO anon;
GRANT ALL ON public.submissions TO authenticated;
GRANT USAGE ON SEQUENCE public.submissions_id_seq TO anon;
GRANT USAGE ON SEQUENCE public.submissions_id_seq TO authenticated;

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;

-- Insert some test data (optional - remove after testing)
INSERT INTO public.submissions (team_id, level, password, difficulty_rating) VALUES
    ('101', 1, 'ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If', 3),
    ('102', 2, '263JGJPfgU6LtdEvgfWU1XP5yac29mFx', 4),
    ('103', 1, 'ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If', 2);

-- Verify the setup
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;
