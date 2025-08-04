import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fcwkebruiyfahqzpzkoy.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjd2tlYnJ1aXlmYWhxenB6a295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDkzMzgsImV4cCI6MjA2OTg4NTMzOH0.MkPoamGffTCklmC9uL1QJHfcD8I0ZeU8gA3zXqsWTNQ";

const supabase = createClient(supabaseUrl, supabaseKey);

const LEVEL_PASSWORDS = {
  1: "ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If",
  2: "263JGJPfgU6LtdEvgfWU1XP5yac29mFx",
  3: "MNk8KNH3Usiio41PRUEoDFPqfxLPlSmx",
  4: "2WmrDFRmJIq3IPxneAaMGhap0pFhF3NJ",
  5: "4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw",
  6: "HWasnPhtq9AVKe0dmk45nxy20cvUa6EG",
  7: "morbNTDkSW6jIlUc0ymOdMaLnOlFVAaj",
  8: "dfwvzFQi4mU0wfNbFOe9RoWskMLg7eEc",
  9: "4CKMh1JI91bUIZZPXDqGanal4xvAg0JM",
  10: "FGUW5ilLVJrxX9kMYMmlN4MgbpfMiqey",
} as const;

function validatePassword(password: string): number | null {
  for (let level = 10; level >= 1; level--) {
    if (LEVEL_PASSWORDS[level as keyof typeof LEVEL_PASSWORDS] === password) {
      return level;
    }
  }
  return null;
}

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({}),
    };
  }

  try {
    if (event.httpMethod === "GET") {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "Failed to fetch submissions" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ submissions: data || [] }),
      };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { team_id, password, difficulty_rating } = body;

      if (!team_id || !password || !difficulty_rating) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing required fields" }),
        };
      }

      const level = validatePassword(password);
      if (!level) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid password" }),
        };
      }

      const { data, error } = await supabase
        .from("submissions")
        .insert({
          team_id,
          level,
          password,
          difficulty_rating,
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "Failed to submit" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, level, data: data?.[0] }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
