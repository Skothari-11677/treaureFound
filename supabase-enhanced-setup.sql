-- ===============================================
-- TREASURE IN THE SHELL - ENHANCED SUPABASE SETUP WITH RESET
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
DROP POLICY IF EXISTS "Enable read access for all users" ON public.submissions;
CREATE POLICY "Enable read access for all users" ON public.submissions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON public.submissions;
CREATE POLICY "Enable insert access for all users" ON public.submissions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON public.submissions;
CREATE POLICY "Enable delete access for all users" ON public.submissions
    FOR DELETE USING (true);

-- Grant permissions to anon and authenticated roles
GRANT ALL ON public.submissions TO anon;
GRANT ALL ON public.submissions TO authenticated;
GRANT USAGE ON SEQUENCE public.submissions_id_seq TO anon;
GRANT USAGE ON SEQUENCE public.submissions_id_seq TO authenticated;

-- Create a function for complete table reset (for admin use)
CREATE OR REPLACE FUNCTION public.truncate_submissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete all records from submissions table
    DELETE FROM public.submissions;
    
    -- Reset the sequence to start from 1 again
    ALTER SEQUENCE public.submissions_id_seq RESTART WITH 1;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.truncate_submissions() TO anon;
GRANT EXECUTE ON FUNCTION public.truncate_submissions() TO authenticated;

-- Create a function to get submission count (for verification)
CREATE OR REPLACE FUNCTION public.get_submission_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result FROM public.submissions;
    RETURN count_result;
END;
$$;

-- Grant execute permission on the count function
GRANT EXECUTE ON FUNCTION public.get_submission_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_submission_count() TO authenticated;

-- Insert some test data (optional - remove after testing)
-- You can uncomment these lines to test the system
/*
INSERT INTO public.submissions (team_id, level, password, difficulty_rating) VALUES
    ('101', 1, 'ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If', 3),
    ('102', 2, '263JGJPfgU6LtdEvgfWU1XP5yac29mFx', 4),
    ('103', 1, 'ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If', 2);
*/

-- Verify the setup
SELECT 
    'Table created successfully' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- Test the functions
SELECT 'Current submission count:' as test, public.get_submission_count() as count;

-- Show confirmation message
SELECT 'Setup completed successfully! Reset functionality enabled.' as confirmation;
