import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fcwkebruiyfahqzpzkoy.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjd2tlYnJ1aXlmYWhxenB6a295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDkzMzgsImV4cCI6MjA2OTg4NTMzOH0.MkPoamGffTCklmC9uL1QJHfcD8I0ZeU8gA3zXqsWTNQ";

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: number;
          team_id: string;
          level: number;
          password: string;
          difficulty_rating: number;
          created_at: string;
        };
        Insert: {
          team_id: string;
          level: number;
          password: string;
          difficulty_rating: number;
        };
        Update: {
          team_id?: string;
          level?: number;
          password?: string;
          difficulty_rating?: number;
        };
      };
    };
  };
};
