import { RequestHandler } from "express";
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fcwkebruiyfahqzpzkoy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjd2tlYnJ1aXlmYWhxenB6a295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDkzMzgsImV4cCI6MjA2OTg4NTMzOH0.MkPoamGffTCklmC9uL1QJHfcD8I0ZeU8gA3zXqsWTNQ'

const supabase = createClient(supabaseUrl, supabaseKey)

const LEVEL_PASSWORDS = {
  1: 'ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If',
  2: '263JGJPfgU6LtdEvgfWU1XP5yac29mFx',
  3: 'MNk8KNH3Usiio41PRUEoDFPqfxLPlSmx',
  4: '2WmrDFRmJIq3IPxneAaMGhap0pFhF3NJ',
  5: '4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw',
  6: 'HWasnPhtq9AVKe0dmk45nxy20cvUa6EG',
  7: 'morbNTDkSW6jIlUc0ymOdMaLnOlFVAaj',
  8: 'dfwvzFQi4mU0wfNbFOe9RoWskMLg7eEc',
  9: '4CKMh1JI91bUIZZPXDqGanal4xvAg0JM',
  10: 'FGUW5ilLVJrxX9kMYMmlN4MgbpfMiqey'
} as const

function validatePassword(password: string): number | null {
  for (let level = 10; level >= 1; level--) {
    if (LEVEL_PASSWORDS[level as keyof typeof LEVEL_PASSWORDS] === password) {
      return level
    }
  }
  return null
}

export const handleSubmissions: RequestHandler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        return res.status(500).json({ error: 'Failed to fetch submissions' })
      }

      res.json({ submissions: data || [] })
    } catch (error) {
      console.error('Server error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { team_id, password, difficulty_rating } = req.body

      if (!team_id || !password || !difficulty_rating) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const level = validatePassword(password)
      if (!level) {
        return res.status(400).json({ error: 'Invalid password' })
      }

      const { data, error } = await supabase
        .from('submissions')
        .insert({
          team_id,
          level,
          password,
          difficulty_rating
        })
        .select()

      if (error) {
        console.error('Supabase error:', error)
        return res.status(500).json({ error: 'Failed to submit' })
      }

      res.json({ success: true, level, data: data?.[0] })
    } catch (error) {
      console.error('Server error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
