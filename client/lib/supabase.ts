import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sxupiyzgponzqrwrsajg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dXBpeXpncG9uenFyd3JzYWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDc5OTgsImV4cCI6MjA2OTgyMzk5OH0.quOnw4mGkxWbvPtjaGTb4G89PooC5-rFEcue-ej2Mxk'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: number
          team_id: string
          level: number
          password: string
          difficulty_rating: number
          created_at: string
        }
        Insert: {
          team_id: string
          level: number
          password: string
          difficulty_rating: number
        }
        Update: {
          team_id?: string
          level?: number
          password?: string
          difficulty_rating?: number
        }
      }
    }
  }
}
